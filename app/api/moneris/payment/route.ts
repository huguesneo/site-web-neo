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

interface PaymentBody {
  amountCents: number;        // montant en CENTS (ex: 12345 = 123.45$)
  temporaryToken: string;     // token de la Hosted Tokenization
  orderId?: string | number;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
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

  const { amountCents, temporaryToken, orderId, customer } = body;
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 });
  }
  if (!temporaryToken) {
    return NextResponse.json({ error: 'Token de carte manquant.' }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

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
      ...(customer?.firstName || customer?.lastName
        ? {
            paymentMethodDetails: {
              cardholderInformation: {
                cardholderName: `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim(),
              },
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

    const data = await res.json();
    const approved = res.ok && data?.paymentStatus === 'SUCCEEDED';

    if (!approved) {
      const msg =
        data?.transactionDetails?.message ||
        data?.message ||
        'Le paiement a été refusé.';
      return NextResponse.json(
        { approved: false, error: msg, status: data?.paymentStatus ?? null },
        { status: 402 }
      );
    }

    return NextResponse.json({
      approved: true,
      paymentId: data.paymentId,
      authorizationCode: data?.transactionDetails?.authorizationCode ?? null,
      amount: data?.amount?.amount ?? amountCents,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur paiement Moneris.' },
      { status: 502 }
    );
  }
}
