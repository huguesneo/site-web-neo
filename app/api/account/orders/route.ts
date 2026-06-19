import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Route serveur — liste les commandes WooCommerce d'un client connecté.
 *
 * Principe de sécurité (identique à create-order) : le navigateur n'envoie QUE
 * son jeton Supabase. Le serveur :
 *   1. vérifie le jeton → récupère le courriel RÉEL du compte,
 *   2. interroge WooCommerce avec les clés secrètes (jamais exposées au client),
 *   3. ne renvoie QUE les commandes dont le courriel de facturation correspond
 *      exactement à celui du compte (filtrage strict pour ne jamais fuiter la
 *      commande d'autrui), puis nettoie les champs avant de répondre.
 *
 * Le courriel n'est JAMAIS accepté depuis le navigateur : il est dérivé du jeton.
 */

export const runtime = 'nodejs';

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

// Médias WooCommerce : les URLs sont codées en dur sur www.neoperformance.ca
// (qui pointe désormais vers ce site Next). On réécrit l'hôte vers le backend
// WordPress, comme dans services/products.ts.
const WP_MEDIA_HOST = 'wp.neoperformance.ca';
function rewriteMediaHost(src: string): string {
  return src.replace(/^(https?:\/\/)(?:www\.)?neoperformance\.ca\//i, `$1${WP_MEDIA_HOST}/`);
}

function wc(path: string): string {
  const u = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  u.searchParams.set('consumer_key', WC_KEY as string);
  u.searchParams.set('consumer_secret', WC_SECRET as string);
  return u.toString();
}

/** Vérifie le jeton Supabase et retourne le courriel du compte, ou null. */
async function emailFromToken(accessToken?: string | null): Promise<string | null> {
  if (!accessToken) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const sb = createClient(url, anon);
    const { data, error } = await sb.auth.getUser(accessToken);
    if (error || !data?.user?.email) return null;
    return data.user.email.toLowerCase();
  } catch {
    return null;
  }
}

interface WCLineItem {
  id: number;
  name: string;
  quantity: number;
  total: string;
  image?: { src?: string };
}
interface WCOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  discount_total: string;
  shipping_total: string;
  billing?: { email?: string };
  line_items?: WCLineItem[];
  meta_data?: Array<{ key: string; value: unknown }>;
}

/**
 * Cherche un éventuel numéro de suivi de colis dans les meta_data de la commande.
 * Compatible avec le plugin « WooCommerce Shipment Tracking » (clé
 * `_wc_shipment_tracking_items`). Retourne null si rien (état de livraison à venir).
 */
function extractTracking(order: WCOrder): { provider?: string; number?: string; url?: string } | null {
  const meta = (order.meta_data ?? []).find((m) => m.key === '_wc_shipment_tracking_items');
  if (!meta || !Array.isArray(meta.value) || meta.value.length === 0) return null;
  const t = meta.value[0] as Record<string, unknown>;
  const number = typeof t.tracking_number === 'string' ? t.tracking_number : undefined;
  if (!number) return null;
  return {
    provider: typeof t.tracking_provider === 'string' ? t.tracking_provider : undefined,
    number,
    url: typeof t.custom_tracking_link === 'string' ? t.custom_tracking_link : undefined,
  };
}

export async function POST(req: NextRequest) {
  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuration WooCommerce manquante côté serveur.' }, { status: 500 });
  }

  let accessToken: string | null = null;
  try {
    const body = await req.json();
    accessToken = body?.accessToken ?? null;
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = await emailFromToken(accessToken);
  if (!email) {
    return NextResponse.json({ error: 'Session invalide ou expirée.' }, { status: 401 });
  }

  try {
    // WooCommerce recherche le courriel parmi les champs de la commande. On
    // refiltre ensuite STRICTEMENT par courriel de facturation pour ne jamais
    // renvoyer la commande d'un autre client (la recherche est approximative).
    const res = await fetch(
      wc(`/orders?search=${encodeURIComponent(email)}&per_page=50&orderby=date&order=desc`),
      { cache: 'no-store' },
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Erreur WooCommerce ${res.status}` }, { status: 502 });
    }
    const raw: WCOrder[] = await res.json();
    const mine = (Array.isArray(raw) ? raw : []).filter(
      (o) => (o.billing?.email || '').toLowerCase() === email,
    );

    const orders = mine.map((o) => ({
      id: o.id,
      number: o.number || String(o.id),
      status: o.status,
      dateCreated: o.date_created,
      total: parseFloat(o.total || '0'),
      currency: o.currency || 'CAD',
      discountTotal: parseFloat(o.discount_total || '0'),
      shippingTotal: parseFloat(o.shipping_total || '0'),
      tracking: extractTracking(o),
      items: (o.line_items ?? []).map((li) => ({
        id: li.id,
        name: li.name,
        quantity: li.quantity,
        total: parseFloat(li.total || '0'),
        image: li.image?.src ? rewriteMediaHost(li.image.src) : null,
      })),
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la récupération des commandes.' },
      { status: 502 },
    );
  }
}
