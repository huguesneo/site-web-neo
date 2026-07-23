import { NextRequest, NextResponse } from 'next/server';
import { fetchGiftCardByNumber, adjustGiftCardBalance, readGiftCardMeta, GC_META_DEBITED } from '../../../../lib/gift-card';
import { paidStatusFor } from '../../../../lib/paid-status';

/**
 * Route serveur — finalise une commande ENTIÈREMENT payée par carte-cadeau
 * (le montant carte-cadeau couvre tout le total → aucun passage par Moneris).
 *
 * Sécurité : aucun montant ne vient du navigateur. On accepte UNIQUEMENT une
 * commande dont le total autoritatif WooCommerce est couvert par les meta
 * carte-cadeau écrites par /api/checkout/create-order (montant plafonné au solde
 * RÉEL de la carte, revérifié ici avant débit). Le débit est idempotent
 * (meta _neo_gift_card_debited) : un double appel ne débite pas deux fois.
 */
export const runtime = 'nodejs';

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

function wc(path: string): string {
  const u = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  u.searchParams.set('consumer_key', WC_KEY as string);
  u.searchParams.set('consumer_secret', WC_SECRET as string);
  return u.toString();
}

export async function POST(req: NextRequest) {
  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuration WooCommerce manquante côté serveur.' }, { status: 500 });
  }

  let orderId: string | number | undefined;
  try {
    const body = await req.json();
    orderId = body.orderId;
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  if (orderId === undefined || orderId === null || orderId === '') {
    return NextResponse.json({ error: 'Commande manquante.' }, { status: 400 });
  }

  const res = await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`)).catch(() => null);
  if (!res || !res.ok) {
    return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
  }
  const order = await res.json();

  if (order?.date_paid || order?.status === 'processing' || order?.status === 'completed') {
    return NextResponse.json({ error: 'Cette commande est déjà payée.' }, { status: 400 });
  }
  const gc = readGiftCardMeta(order);
  if (!gc) {
    return NextResponse.json({ error: 'Aucune carte-cadeau associée à cette commande.' }, { status: 400 });
  }

  // Paiement fractionné : la commande garde son total complet ; elle n'est
  // « gratuite » que si la carte-cadeau couvre la totalité de ce total.
  const total = parseFloat(order?.total);
  if (!Number.isFinite(total) || total - gc.amount > 0.005) {
    return NextResponse.json({ error: 'Cette commande n’est pas entièrement couverte par la carte-cadeau.' }, { status: 400 });
  }

  if (!gc.debited) {
    // Revérifie le solde MAINTENANT (il a pu être dépensé entre-temps), puis débite.
    const card = await fetchGiftCardByNumber(gc.number);
    if (card === undefined) {
      return NextResponse.json({ error: 'Impossible de vérifier la carte-cadeau. Réessayez dans un instant.' }, { status: 502 });
    }
    if (!card || !card.active || card.balance + 0.005 < gc.amount) {
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

    const debited = await adjustGiftCardBalance(gc.id, -gc.amount, `Commande #${orderId} — neoperformance.ca`);
    if (!debited) {
      return NextResponse.json({ error: 'Le débit de la carte-cadeau a échoué. Réessayez.' }, { status: 502 });
    }
    await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta_data: [{ key: GC_META_DEBITED, value: 'yes' }] }),
    }).catch(() => { /* non bloquant */ });
  }

  // Marque payée (transaction « carte-cadeau », pas de Moneris). Statut
  // « completed » si la commande ne contient que des cartes-cadeaux → PW
  // génère la carte et envoie le courriel (voir lib/paid-status).
  await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: paidStatusFor(order.line_items), set_paid: true, transaction_id: `carte-cadeau-${gc.number.slice(-4)}` }),
  }).catch(() => { /* non bloquant : le débit est tracé sur la commande */ });

  return NextResponse.json({ approved: true, giftCardApplied: gc.amount });
}
