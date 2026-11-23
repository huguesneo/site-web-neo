import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { fetchGiftCardByNumber, adjustGiftCardBalance, readGiftCardMeta, GC_META_DEBITED } from '../../../../lib/gift-card';
import { paidStatusFor } from '../../../../lib/paid-status';
import { addOrderNote, cancelOrderWithNote } from '../../../../lib/order-notes';

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
// Même version que le terminal NEO KPI (customerReference y est prouvé en prod).
const API_VERSION = '2026-08-14';
// Version utilisée avant — sert uniquement au filet de sécurité (voir POST).
const LEGACY_API_VERSION = '2024-09-17';

/**
 * « ID client » au portail Moneris (champ `customerReference`, texte libre) :
 * « Prénom Nom 8236 ». Même nettoyage que le terminal NEO KPI (sans accents,
 * lettres/chiffres/espace/'/-), 40 caractères max. Le numéro de commande à la
 * fin évite les doublons et fait le lien avec WooCommerce pour la comptabilité.
 */
function customerReferenceFor(first: string | undefined, last: string | undefined, orderId: string | number): string {
  const suffix = ` ${orderId}`.replace(/[^A-Za-z0-9 \-]/g, '');
  const name = `${first ?? ''} ${last ?? ''}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 '\-]/g, '').replace(/\s+/g, ' ').trim()
    .slice(0, Math.max(0, 40 - suffix.length)).trim();
  return name ? `${name}${suffix}` : '';
}

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

/**
 * Marque la commande WooCommerce comme payée (côté serveur). Le statut vient de
 * paidStatusFor : « completed » si la commande ne contient que des cartes-cadeaux
 * (déclenche la génération PW Gift Cards + courriel), sinon « processing ».
 */
async function markOrderPaid(orderId: string | number, transactionId: string, status: 'completed' | 'processing'): Promise<boolean> {
  // Le paiement est DÉJÀ encaissé : on ne renvoie jamais d'erreur au client ici.
  // Un échec laisserait la commande « en attente » alors que le client a payé —
  // on réessaie une fois, puis on le signale clairement (log + note admin).
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, set_paid: true, transaction_id: transactionId }),
    }).catch(() => null);
    if (res?.ok) return true;
    console.error(`[MONERIS] Statut payé NON enregistré sur #${orderId} (essai ${attempt}) — HTTP ${res?.status ?? 'réseau'} — paiement ${transactionId}`);
  }
  await addOrderNote(
    orderId,
    `⚠️ PAIEMENT MONERIS APPROUVÉ (${transactionId || 'id inconnu'}) mais le statut de la commande n’a pas pu être mis à jour automatiquement. À passer manuellement en « ${status === 'completed' ? 'Terminée' : 'En cours'} ».`,
  );
  return false;
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
      await cancelOrderWithNote(
        orderId,
        `Paiement non tenté : la carte-cadeau ${gc.number} ne couvre plus ${gc.amount.toFixed(2)} $ (solde actuel : ${card ? card.balance.toFixed(2) : 'introuvable'} $${card && !card.active ? ', carte désactivée' : ''}). Commande annulée automatiquement.`,
      );
      return NextResponse.json(
        { error: 'Le solde de la carte-cadeau a changé depuis l’ajout au panier. Recommence ta commande.' },
        { status: 402 },
      );
    }
  }

  // Vrai dès que la demande de paiement part chez Moneris : au-delà, un échec
  // technique est AMBIGU (le paiement a pu passer) et le client ne doit pas
  // réessayer à l'aveugle.
  let paymentSent = false;
  try {
    const token = await getAccessToken();

    const fullName = `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim();

    const customerReference = customerReferenceFor(customer?.firstName, customer?.lastName, orderId);

    // Requête principale — même forme que le terminal NEO KPI (qui remplit déjà
    // « ID client » au portail Moneris) : version d'API récente, nom du client dans
    // `customerReference` (texte libre), nom du titulaire DANS paymentMethod.
    // NB : ne JAMAIS mettre le nom dans `customerId` — format strict de 30 car.
    // (^[A-Za-z]{2}\d{2}[A-Za-z0-9]{26}$) qui faisait échouer tout le paiement.
    const payload: Record<string, unknown> = {
      idempotencyKey: randomUUID(),
      orderId: String(orderId),
      amount: { amount: amountCents, currency: 'CAD' },
      ...(customerReference ? { customerReference } : {}),
      paymentMethod: {
        paymentMethodSource: 'TEMPORARY_TOKEN',
        temporaryToken,
        storePaymentMethod: 'DO_NOT_STORE',
        ...(fullName ? { cardholderInformation: { cardholderName: fullName.slice(0, 60) } } : {}),
      },
      ecommerceIndicator: 'SSL_MERCHANT',
      automaticCapture: true,
      dynamicDescriptor: 'NEO Performance',
    };

    // Filet de sécurité : requête identique à celle utilisée avant ce changement
    // (ancienne version d'API, sans customerReference). Utilisée seulement si
    // Moneris rejette la requête principale comme MAL FORMÉE (aucun prélèvement).
    const legacyPayload: Record<string, unknown> = {
      idempotencyKey: randomUUID(),
      amount: { amount: amountCents, currency: 'CAD' },
      paymentMethod: {
        paymentMethodSource: 'TEMPORARY_TOKEN',
        temporaryToken,
        storePaymentMethod: 'DO_NOT_STORE',
      },
      automaticCapture: true,
      dynamicDescriptor: 'NEO Performance',
      orderId: String(orderId),
      ...(fullName
        ? { paymentMethodDetails: { cardholderInformation: { cardholderName: fullName } } }
        : {}),
    };

    const sendPayment = async (apiVersion: string, body: Record<string, unknown>) => {
      const r = await fetch(`${API_HOST}/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Api-Key': MONERIS_API_KEY,
          'Api-Version': apiVersion,
          'X-Merchant-Id': MONERIS_MERCHANT_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      let json: Record<string, unknown> = {};
      try { json = text ? JSON.parse(text) : {}; } catch { /* réponse non-JSON */ }
      return { res: r, rawText: text, data: json };
    };

    paymentSent = true;
    let { res, rawText, data } = await sendPayment(API_VERSION, payload);

    // Rejet de validation (400/422 SANS paymentStatus) = la requête n'a pas été
    // traitée, aucun montant prélevé → on peut renvoyer sans risque de double
    // paiement. Un refus de carte, lui, porte un paymentStatus : jamais renvoyé.
    if ((res.status === 400 || res.status === 422) && !(data as { paymentStatus?: string })?.paymentStatus) {
      console.error(`[MONERIS] Requête principale rejetée (HTTP ${res.status}) — commande #${orderId} — renvoi avec l'ancien format. Corps:`, rawText);
      await addOrderNote(
        orderId,
        `Moneris a rejeté le format de la requête de paiement (HTTP ${res.status}) — aucun montant prélevé. Paiement renvoyé avec l'ancien format (sans nom dans « ID client »).`,
      );
      ({ res, rawText, data } = await sendPayment(LEGACY_API_VERSION, legacyPayload));
    }

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
      const d = data as { transactionDetails?: { message?: string }; message?: string };
      const msg =
        d?.transactionDetails?.message ||
        d?.message ||
        'Le paiement a été refusé.';
      const monerisStatus = (data as { paymentStatus?: string })?.paymentStatus ?? 'inconnu';
      const amountTxt = `${(amountCents / 100).toFixed(2)} $`;
      if (res.status < 500) {
        await cancelOrderWithNote(
          orderId,
          `Paiement Moneris refusé (${amountTxt}) — HTTP ${res.status}, statut ${monerisStatus} : « ${msg} ». Commande annulée automatiquement ; le client peut réessayer.`,
        );
      } else {
        await addOrderNote(
          orderId,
          `Réponse Moneris ambiguë (${amountTxt}) — HTTP ${res.status}, statut ${monerisStatus} : « ${msg} ». Commande laissée en attente : vérifier dans le portail Moneris si le paiement est passé avant toute action.`,
        );
      }
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
    await markOrderPaid(orderId, ok.paymentId ?? '', paidStatusFor(wcOrder.line_items));
    await addOrderNote(
      orderId,
      `Paiement Moneris approuvé : ${((ok?.amount?.amount ?? amountCents) / 100).toFixed(2)} $ — paiement ${ok.paymentId ?? 'id inconnu'}${ok?.transactionDetails?.authorizationCode ? `, autorisation ${ok.transactionDetails.authorizationCode}` : ''}.`,
    );

    return NextResponse.json({
      approved: true,
      paymentId: ok.paymentId,
      authorizationCode: ok?.transactionDetails?.authorizationCode ?? null,
      amount: ok?.amount?.amount ?? amountCents,
    });
  } catch (err) {
    // Échec technique (jeton OAuth refusé, panne réseau, délai dépassé…). Si l'appel
    // /payments est parti, le paiement a pu passer : on ne touche pas au statut, on
    // laisse seulement une trace pour vérification dans le portail Moneris.
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[MONERIS] Échec technique — commande #${orderId} — ${paymentSent ? 'APRÈS' : 'AVANT'} l’envoi du paiement — ${reason}`);
    await addOrderNote(
      orderId,
      paymentSent
        ? `Échec technique PENDANT le paiement Moneris (${(amountCents / 100).toFixed(2)} $) : ${reason}. Commande laissée en attente : vérifier dans le portail Moneris si le paiement est passé.`
        : `Échec technique AVANT le paiement Moneris (aucun montant envoyé) : ${reason}.`,
    );
    return NextResponse.json(
      {
        error: paymentSent
          ? 'Le paiement n’a pas pu être confirmé à cause d’une erreur technique. Pour éviter un double paiement, écris-nous à info@neoperformance.ca avant de réessayer.'
          : 'Le paiement n’a pas pu être lancé à cause d’une erreur technique. Aucun montant n’a été prélevé : réessaie dans un instant.',
      },
      { status: 502 }
    );
  }
}
