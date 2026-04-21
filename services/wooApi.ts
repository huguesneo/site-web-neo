/**
 * Service WooCommerce REST API v3 — produits et catégories
 */

const WC_BASE = process.env.NEXT_PUBLIC_WC_URL as string | undefined;
const WC_KEY = process.env.NEXT_PUBLIC_WC_KEY as string | undefined;
const WC_SECRET = process.env.NEXT_PUBLIC_WC_SECRET as string | undefined;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WCProduct {
  id: number;
  name: string;
  price: string;           // déjà en dollars ex: "33.06"
  regular_price: string;
  sale_price: string;
  permalink: string;
  description: string;
  short_description: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ src: string; alt: string }>;
  status: string;
  catalog_visibility: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function wcUrl(path: string, params: Record<string, string> = {}): string {
  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    throw new Error('Variables WooCommerce manquantes (NEXT_PUBLIC_WC_URL, NEXT_PUBLIC_WC_KEY, NEXT_PUBLIC_WC_SECRET). Configurez-les dans Netlify → Environment variables.');
  }
  const url = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  url.searchParams.set('consumer_key', WC_KEY);
  url.searchParams.set('consumer_secret', WC_SECRET);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

// ─── Fonctions publiques ───────────────────────────────────────────────────────

/** Récupère tous les produits publiés (jusqu'à 100) */
export async function fetchWCProducts(): Promise<WCProduct[]> {
  const res = await fetch(wcUrl('/products', { per_page: '100', status: 'publish' }));
  if (!res.ok) throw new Error(`WooCommerce produits: ${res.status}`);
  return res.json();
}
