import { NextRequest, NextResponse } from 'next/server';
import { fetchCouponByCode, priceCartLines, evaluateCoupon, type CartLineIn } from '../../../../lib/coupon-rules';

/**
 * Validation de coupon CÔTÉ SERVEUR — le navigateur envoie le code + le contenu du
 * panier (ids + quantités, jamais de prix). Les clés WooCommerce restent sur le
 * serveur. TOUTES les règles WooCommerce du coupon sont appliquées ici contre les
 * VRAIES données produit (prix, soldes, catégories) via lib/coupon-rules, et la
 * route renvoie le rabais calculé + les lignes admissibles.
 *
 * NOTE : la limite « par personne » et la restriction courriel ne peuvent pas être
 * vérifiées ici (le courriel n'est pas encore connu au panier). Elles sont
 * appliquées au moment de la commande dans /api/checkout/create-order.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!process.env.WC_URL || !process.env.WC_KEY || !process.env.WC_SECRET) {
    return NextResponse.json({ error: 'Configuration boutique manquante.' }, { status: 500 });
  }

  let code = '';
  let rawItems: Array<{ product_id?: number | string; variation_id?: number | string; quantity?: number }> = [];
  try {
    const body = await req.json();
    code = String(body.code ?? '').trim();
    rawItems = Array.isArray(body.items) ? body.items : [];
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  if (!code) return NextResponse.json({ error: 'Code promo manquant.' }, { status: 400 });

  const items: CartLineIn[] = rawItems
    .map((i) => {
      const variationId = Number(i.variation_id);
      return {
        product_id: Number(i.product_id),
        quantity: Math.max(1, Number(i.quantity) || 1),
        ...(Number.isInteger(variationId) && variationId > 0 ? { variation_id: variationId } : {}),
      };
    })
    .filter((i) => Number.isInteger(i.product_id) && i.product_id > 0);
  if (items.length === 0) {
    return NextResponse.json({ error: 'Votre panier est vide.' }, { status: 400 });
  }

  const coupon = await fetchCouponByCode(code);
  if (coupon === undefined) return NextResponse.json({ error: 'Erreur réseau. Réessayez.' }, { status: 502 });
  if (coupon === null) return NextResponse.json({ error: 'Code promo invalide ou expiré.' }, { status: 404 });

  const priced = await priceCartLines(items);
  if (!priced) {
    return NextResponse.json({ error: 'Impossible de valider le code pour le moment. Réessayez.' }, { status: 502 });
  }

  const ev = evaluateCoupon(coupon, priced);
  if (ev.error) return NextResponse.json({ error: ev.error }, { status: 409 });

  return NextResponse.json({
    code: coupon.code,
    discount_type: coupon.discount_type,
    amount: parseFloat(coupon.amount) || 0,
    discount_value: ev.discount,
    eligible_line_keys: ev.eligibleLineKeys,
    free_shipping: ev.freeShipping,
    individual_use: ev.individualUse,
  });
}
