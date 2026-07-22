import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { fetchGiftCardByNumber, adjustGiftCardBalance, readGiftCardMeta, GC_META_DEBITED } from '../../../../lib/gift-card';

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
 * (prix réels + taxes + rabais, calculés par WooCommerce) + la commande
 * elle-même (pour lire les meta carte-cadeau). Refuse une commande déjà
 * payée. Ne renvoie jamais un montant venant du client.
 */
async function getAuthoritativeOrder(orderId: string | number): Promise<{ amountCents: number; order: Record<string, unknown> }> {
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
  return { amountCents: Math.round(total * 100), order };
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
  let wcOrder: Record<string, unknown>;
  try {
    ({ amountCents, order: wcOrder } = await getAuthoritativeOrder(orderId));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Montant de commande indisponible.' },
      { status: 400 }
    );
  }

  // Carte-cadeau appliquée à la commande (paiement fractionné) : le montant
  // encaissé par Moneris = total WooCommerce − montant carte-cadeau. On revérifie
  // le solde MAINTENANT (il a pu être dépensé entre la création de la commande et
  // le paiement). La carte n'est débitée qu'APRÈS l'approbation Moneris — jamais
  // avant, pour ne pas laisser de débit orphelin si le client abandonne.
  const gc = readGiftCardMeta(wcOrder as { meta_data?: Array<{ key: string; value: unknown }> });
  if (gc) {
    amountCents -= Math.round(gc.amount * 100);
    if (amountCents <= 0) {
      // Commande entièrement couverte par la carte → c'est la route
      // /api/checkout/complete-free-order qui doit la finaliser, sans Moneris.
      return NextResponse.json({ error: 'Cette commande est entièrement couverte par la carte-cadeau.' }, { status: 400 });
    }
  }
  if (gc && !gc.debited) {
    const card = await fetchGiftCardByNumber(gc.number);
    if (card === undefined) {
      return NextResponse.json(
        { error: 'Impossible de vérifier la carte-cadeau. Réessayez dans un instant.' },
        { status: 502 },
      );
    }
    if (!card || !card.active || card.balance + 0.005 < gc.amount) {
      // Le solde ne couvre plus le montant promis → on annule la commande (le
      // client devra recommencer ; son code promo est libéré par l'annulation).
      await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      }).catch(() => { /* non bloquant */ });
      return NextResponse.json(
        { error: 'Le solde de la carte-cadeau a changé depuis l’ajout au panier. Recommence ta commande.' },
        { status: 402 },
      );
    }
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
      // NB : le champ Moneris `customerId` n'est PAS un nom libre — il exige un
      // format strict (30 car., motif ^[A-Za-z]{2}\d{2}[A-Za-z0-9]{26}$). Y mettre
      // le nom du client faisait échouer TOUT le paiement (400 INVALID_FORMAT).
      // Le nom est déjà transmis via cardholderName ci-dessous, qui s'affiche au portail.
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
      // Journalise la réponse complète Moneris côté serveur (diagnostic), sans
      // jamais l'exposer au navigateur.
      console.error('[MONERIS] Paiement non approuvé — HTTP', res.status, '— corps:', rawText);
      // Refus DÉFINITIF (réponse claire de Moneris, pas une panne) : on annule la
      // commande. WooCommerce inscrit l'usage du code promo dès la création de la
      // commande (avant paiement) — sans annulation, une carte refusée « consommerait »
      // le code (limite 1 par personne) et bloquerait le client à sa 2e tentative.
      // L'annulation décrémente le compteur. Sur un statut ambigu (5xx), on ne touche
      // à rien : le paiement a pu passer malgré tout.
      if (res.status < 500) {
        await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        }).catch(() => { /* non bloquant */ });
      }
      const d = data as { transactionDetails?: { message?: string }; message?: string };
      const msg =
        d?.transactionDetails?.message ||
        d?.message ||
        'Le paiement a été refusé.';
      return NextResponse.json(
        { approved: false, error: msg, status: (data as { paymentStatus?: string })?.paymentStatus ?? null },
        { status: 402 }
      );
    }

    // Paiement approuvé → on débite la carte-cadeau (si présente), puis on
    // marque la commande payée. Si le débit échoue malgré le solde vérifié
    // plus haut (cas très rare), on n'annule PAS le paiement déjà encaissé :
    // on trace l'échec sur la commande pour correction manuelle dans l'admin.
    if (gc && !gc.debited) {
      const debited = await adjustGiftCardBalance(gc.id, -gc.amount, `Commande #${orderId} — neoperformance.ca`);
      await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_data: [{ key: GC_META_DEBITED, value: debited ? 'yes' : 'ECHEC-A-DEBITER-MANUELLEMENT' }],
        }),
      }).catch(() => { /* non bloquant */ });
      if (!debited) {
        console.error(`[GIFT-CARD] Débit ÉCHOUÉ pour la commande #${orderId} — carte ${gc.number}, montant ${gc.amount.toFixed(2)} $. À débiter manuellement.`);
      }
    }

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
