import { NextRequest, NextResponse } from 'next/server';

/**
 * Validation de coupon CÔTÉ SERVEUR — le navigateur n'envoie que le code.
 * Les clés WooCommerce restent sur le serveur (jamais exposées). Renvoie le
 * type/montant du coupon si valide ; le calcul du rabais (dépendant du panier)
 * reste côté client.
 */
export const runtime = 'nodejs';

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

export async function POST(req: NextRequest) {
  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuration boutique manquante.' }, { status: 500 });
  }

  let code = '';
  try {
    ({ code } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  code = (code || '').trim();
  if (!code) return NextResponse.json({ error: 'Code promo manquant.' }, { status: 400 });

  const url = new URL(`${WC_BASE}/wp-json/wc/v3/coupons`);
  url.searchParams.set('code', code);
  url.searchParams.set('consumer_key', WC_KEY);
  url.searchParams.set('consumer_secret', WC_SECRET);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return NextResponse.json({ error: 'Erreur réseau' }, { status: 502 });

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ error: 'Code promo invalide ou expiré.' }, { status: 404 });
  }

  const c = data[0];
  if (c.date_expires && new Date(c.date_expires) < new Date()) {
    return NextResponse.json({ error: 'Ce code promo est expiré.' }, { status: 410 });
  }
  if (c.usage_limit && c.usage_count >= c.usage_limit) {
    return NextResponse.json({ error: "Ce code promo a atteint sa limite d'utilisation." }, { status: 409 });
  }

  return NextResponse.json({
    code: c.code,
    discount_type: c.discount_type,
    amount: parseFloat(c.amount),
  });
}
