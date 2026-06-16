import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Route serveur — crée la commande WooCommerce de façon SÛRE.
 *
 * Principe : le navigateur n'envoie QUE la liste des produits (product_id +
 * quantité) et son jeton de session. Le serveur :
 *   1. vérifie le jeton Supabase (→ est-ce un vrai client connecté ?),
 *   2. applique le coupon promo éventuel + le rabais client (-13 %) si la
 *      session est valide,
 *   3. laisse WooCommerce recalculer le total à partir des VRAIS prix + taxes.
 *
 * Aucun montant ne vient du navigateur : il ne peut donc pas être trafiqué.
 */

export const runtime = 'nodejs';

const WC_BASE = process.env.NEXT_PUBLIC_WC_URL;
const WC_KEY = process.env.NEXT_PUBLIC_WC_KEY;
const WC_SECRET = process.env.NEXT_PUBLIC_WC_SECRET;

// Coupon WooCommerce qui porte le rabais client (-13 %). Le code est
// volontairement non devinable et n'est JAMAIS envoyé au navigateur :
// seul le serveur l'applique, après vérification de la session Supabase.
const CLIENT_COUPON_CODE = process.env.WC_CLIENT_COUPON_CODE || 'neo-client-auto-13';
const CLIENT_COUPON_PERCENT = '13';

interface LineItemIn { product_id: number | string; quantity: number; }
interface Body {
  items: LineItemIn[];
  billing: Record<string, string>;
  shipping: Record<string, string>;
  customer_note?: string;
  couponCode?: string | null;
  accessToken?: string | null;
}

function wc(path: string): string {
  const u = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  u.searchParams.set('consumer_key', WC_KEY as string);
  u.searchParams.set('consumer_secret', WC_SECRET as string);
  return u.toString();
}

/** Vérifie le jeton Supabase. Retourne true uniquement pour un vrai client connecté. */
async function verifyIsClient(accessToken?: string | null): Promise<boolean> {
  if (!accessToken) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;
  try {
    const sb = createClient(url, anon);
    const { data, error } = await sb.auth.getUser(accessToken);
    return !error && !!data?.user;
  } catch {
    return false;
  }
}

/** S'assure que le coupon client existe dans WooCommerce (le crée au besoin). */
async function ensureClientCoupon(): Promise<boolean> {
  try {
    const res = await fetch(wc(`/coupons?code=${encodeURIComponent(CLIENT_COUPON_CODE)}`));
    if (res.ok) {
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length > 0) return true;
    }
    const create = await fetch(wc('/coupons'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: CLIENT_COUPON_CODE,
        discount_type: 'percent',
        amount: CLIENT_COUPON_PERCENT,
        individual_use: false,
        description: 'Rabais client automatique NEO (appliqué côté serveur — ne pas diffuser).',
      }),
    });
    return create.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuration WooCommerce manquante côté serveur.' }, { status: 500 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  // Articles : on ne garde QUE product_id + quantité (jamais de prix du client).
  const line_items = (body.items ?? [])
    .map((i) => ({ product_id: Number(i.product_id), quantity: Math.max(1, Number(i.quantity) || 1) }))
    .filter((i) => Number.isInteger(i.product_id) && i.product_id > 0);

  if (line_items.length === 0) {
    return NextResponse.json({ error: 'Panier vide ou articles invalides.' }, { status: 400 });
  }

  const isClient = await verifyIsClient(body.accessToken);

  // Coupons. On refuse toute tentative d'utiliser le coupon client en manuel :
  // il n'est ajouté QUE par le serveur, et seulement si la session est valide.
  const coupon_lines: { code: string }[] = [];
  const userCoupon = (body.couponCode || '').trim();
  if (userCoupon && userCoupon.toLowerCase() !== CLIENT_COUPON_CODE.toLowerCase()) {
    coupon_lines.push({ code: userCoupon });
  }
  if (isClient && (await ensureClientCoupon())) {
    coupon_lines.push({ code: CLIENT_COUPON_CODE });
  }

  const orderData: Record<string, unknown> = {
    status: 'pending',
    currency: 'CAD',
    payment_method: 'moneris',
    payment_method_title: 'Moneris',
    billing: body.billing ?? {},
    shipping: body.shipping ?? {},
    line_items,
    customer_note: body.customer_note ?? '',
    ...(coupon_lines.length ? { coupon_lines } : {}),
  };

  try {
    const res = await fetch(wc('/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      let msg = `Erreur ${res.status}`;
      try { const e = await res.json(); msg = e.message || msg; } catch { /* ignore */ }
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    const order = await res.json();
    return NextResponse.json({
      orderId: order.id,
      total: parseFloat(order.total),                 // total autoritatif (prix réels + taxes + rabais)
      discountTotal: parseFloat(order.discount_total || '0'),
      isClient,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur création de commande.' },
      { status: 502 }
    );
  }
}
