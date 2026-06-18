import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Route serveur — encaisse un paiement via la NOUVELLE API Moneris.
 * Flux vérifié contre le bac à sable (POST /payments -> SUCCEEDED).
 *
 * 1) Obtient un jeton OAuth (client_credentials)
 * 2) POST /payments avec le token temporaire reçu de la Hosted Tokenization
 *
 * Variables serveur requises (sans NEXT_PUBLIC_) :
 *   MONERIS_ENV          "test" | "prod"
 *   MONERIS_CLIENT_ID
 *   MONERIS_CLIENT_SECRET
 *   MONERIS_API_KEY
 *   MONERIS_MERCHANT_ID
 */

export const runtime = 'nodejs';

const IS_PROD = process.env.MONERIS_ENV === 'prod';
const API_HOST = IS_PROD ? 'https://api.moneris.io' : 'https://api.sb.moneris.io';
const API_VERSION = '2024-09-17';

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

interface PaymentBody {
  // ⚠️ Aucun montant n'est accepté du navigateur : il est relu depuis WooCommerce.
  temporaryToken: string;     // token de la Hosted Tokenization
  orderId: string | number;   // commande WooCommerce (source autoritative du montant)
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

function wc(path: string): string {
  const u = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  u.searchParams.set('consumer_key', WC_KEY as string);
  u.searchParams.set('consumer_secret', WC_SECRET as string);
  return u.toString();
}

/**
 * Lit la commande WooCommerce et renvoie le montant AUTORITATIF en cents
 * (prix réels + taxes + rabais, calculés par WooCommerce). Refuse une
 * commande déjà payée. Ne renvoie jamais un montant venant du client.
 */
async function getAuthoritativeAmountCents(orderId: string | number): Promise<number> {
  const res = await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`));
  if (!res.ok) throw new Error(`Commande introuvable (${res.status}).`);
  const order = await res.json();

  if (order?.date_paid || order?.status === 'processing' || order?.status === 'completed') {
    throw new Error('Cette commande est déjà payée.');
  }
  const total = parseFloat(order?.total);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('Total de commande invalide.');
  }
  return Math.round(total * 100);
}

/** Marque la commande WooCommerce comme payée (côté serveur). */
async function markOrderPaid(orderId: string | number, transactionId: string): Promise<void> {
  await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'processing', set_paid: true, transaction_id: transactionId }),
  }).catch(() => { /* paiement déjà encaissé ; non bloquant */ });
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${API_HOST}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.MONERIS_CLIENT_ID!,
      client_secret: process.env.MONERIS_CLIENT_SECRET!,
      scope: 'payment.write payment.read refund.write refund.read',
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth Moneris échoué (${res.status})`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error('Jeton OAuth Moneris introuvable.');
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  const { MONERIS_CLIENT_ID, MONERIS_CLIENT_SECRET, MONERIS_API_KEY, MONERIS_MERCHANT_ID } = process.env;
  if (!MONERIS_CLIENT_ID || !MONERIS_CLIENT_SECRET || !MONERIS_API_KEY || !MONERIS_MERCHANT_ID) {
    return NextResponse.json({ error: 'Configuration Moneris manquante côté serveur.' }, { status: 500 });
  }

  let body: PaymentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuration WooCommerce manquante côté serveur.' }, { status: 500 });
  }

  const { temporaryToken, orderId, customer } = body;
  if (!temporaryToken) {
    return NextResponse.json({ error: 'Token de carte manquant.' }, { status: 400 });
  }
  if (orderId === undefined || orderId === null || orderId === '') {
    return NextResponse.json({ error: 'Commande manquante.' }, { status: 400 });
  }

  // Montant relu depuis WooCommerce — jamais celui du navigateur. Fail-closed :
  // si on ne peut pas obtenir un total fiable, on n'encaisse rien.
  let amountCents: number;
  try {
    amountCents = await getAuthoritativeAmountCents(orderId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Montant de commande indisponible.' },
      { status: 400 }
    );
  }

  try {
    const token = await getAccessToken();

    const fullName = `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim();

    const payload: Record<string, unknown> = {
      idempotencyKey: randomUUID(),
      amount: { amount: amountCents, currency: 'CAD' },
      paymentMethod: {
        paymentMethodSource: 'TEMPORARY_TOKEN',
        temporaryToken,
        storePaymentMethod: 'DO_NOT_STORE',
      },
      automaticCapture: true,
      dynamicDescriptor: 'NEO Performance',
      ...(orderId ? { orderId: String(orderId) } : {}),
      // Champ « ID client » de Moneris : on y met le prénom + nom du client pour
      // qu'il apparaisse dans le portail (comme les paiements faits en clinique).
      ...(fullName ? { customerId: fullName } : {}),
      ...(fullName
        ? {
            paymentMethodDetails: {
              cardholderInformation: { cardholderName: fullName },
            },
          }
        : {}),
    };

    const res = await fetch(`${API_HOST}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Api-Key': MONERIS_API_KEY,
        'Api-Version': API_VERSION,
        'X-Merchant-Id': MONERIS_MERCHANT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    let data: Record<string, unknown> = {};
    try { data = rawText ? JSON.parse(rawText) : {}; } catch { /* réponse non-JSON */ }
    const approved = res.ok && (data as { paymentStatus?: string })?.paymentStatus === 'SUCCEEDED';

    if (!approved) {
      // — DIAGNOSTIC TEMPORAIRE — journalise la vraie réponse Moneris.
      console.error('[MONERIS] Paiement non approuvé — HTTP', res.status, '— corps:', rawText);
      const d = data as {
        transactionDetails?: { message?: string };
        message?: string;
        errors?: unknown;
      };
      const msg =
        d?.transactionDetails?.message ||
        d?.message ||
        (d?.errors ? JSON.stringify(d.errors) : '') ||
        'Le paiement a été refusé.';
      return NextResponse.json(
        {
          approved: false,
          error: msg,
          status: (data as { paymentStatus?: string })?.paymentStatus ?? null,
          // — DEBUG TEMPORAIRE (à retirer après diagnostic) —
          debug: { monerisHttp: res.status, monerisBody: rawText?.slice(0, 1500) },
        },
        { status: 402 }
      );
    }

    // Paiement approuvé → on marque la commande payée côté serveur.
    const ok = data as {
      paymentId?: string;
      transactionDetails?: { authorizationCode?: string };
      amount?: { amount?: number };
    };
    await markOrderPaid(orderId, ok.paymentId ?? '');

    return NextResponse.json({
      approved: true,
      paymentId: ok.paymentId,
      authorizationCode: ok?.transactionDetails?.authorizationCode ?? null,
      amount: ok?.amount?.amount ?? amountCents,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur paiement Moneris.' },
      { status: 502 }
    );
  }
}
