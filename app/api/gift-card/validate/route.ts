import { NextRequest, NextResponse } from 'next/server';
import { normalizeGiftCardNumber, fetchGiftCardByNumber, isExpired } from '../../../../lib/gift-card';

/**
 * Validation d'une carte-cadeau CÔTÉ SERVEUR — le navigateur envoie le numéro
 * saisi, le serveur interroge l'API PW Gift Cards Pro (clés WooCommerce jamais
 * exposées) et renvoie le solde si la carte est valide, active et non expirée.
 *
 * Le montant réellement appliqué est recalculé au moment de la commande
 * (/api/checkout/create-order) puis débité seulement après paiement approuvé.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!process.env.WC_URL || !process.env.WC_KEY || !process.env.WC_SECRET) {
    return NextResponse.json({ error: 'Configuration boutique manquante.' }, { status: 500 });
  }

  let input = '';
  try {
    const body = await req.json();
    input = String(body.number ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  if (!input) return NextResponse.json({ error: 'Numéro de carte-cadeau manquant.' }, { status: 400 });

  const number = normalizeGiftCardNumber(input);
  if (!number) {
    return NextResponse.json(
      { error: 'Numéro invalide — il doit compter 16 caractères (ex. XXXX-XXXX-XXXX-XXXX).' },
      { status: 400 },
    );
  }

  const card = await fetchGiftCardByNumber(number);
  if (card === undefined) {
    return NextResponse.json({ error: 'Impossible de vérifier la carte pour le moment. Réessayez.' }, { status: 502 });
  }
  if (card === null || !card.active) {
    return NextResponse.json({ error: 'Cette carte-cadeau est introuvable ou désactivée.' }, { status: 404 });
  }
  if (isExpired(card)) {
    return NextResponse.json({ error: 'Cette carte-cadeau est expirée.' }, { status: 409 });
  }
  if (card.balance <= 0) {
    return NextResponse.json({ error: 'Le solde de cette carte-cadeau est épuisé.' }, { status: 409 });
  }

  return NextResponse.json({ number: card.number, balance: Math.round(card.balance * 100) / 100 });
}
