/**
 * Service GHL API v2 — produits, prix et collections
 */

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GHLApiPrice {
  _id: string;
  name?: string;
  amount: number;   // en centimes (ex: 3499 = 34,99 $)
  currency: string;
  type: string;
}

export interface GHLApiProduct {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  statementDescriptor?: string;
  availableInStore?: boolean;
  collectionIds?: string[];   // IDs des collections auxquelles appartient le produit
  prices?: GHLApiPrice[];
  medias?: Array<{
    id: string;
    url: string;
    type: string;
    title?: string;
    isFeatured?: boolean;
  }>;
}

export interface GHLApiCollection {
  _id: string;
  name: string;
  locationId: string;
}

// ─── Helper fetch authentifié ─────────────────────────────────────────────────

function ghlFetch(path: string): Promise<Response> {
  const apiKey = process.env.NEXT_PUBLIC_GHL_API_KEY;
  const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    return Promise.reject(
      new Error('Variables d\'environnement NEXT_PUBLIC_GHL_API_KEY ou NEXT_PUBLIC_GHL_LOCATION_ID manquantes.')
    );
  }

  return fetch(`${GHL_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
  });
}

// ─── Fonctions publiques ───────────────────────────────────────────────────────

/** Récupère tous les produits du catalogue GHL */
export async function fetchGHLProducts(): Promise<GHLApiProduct[]> {
  const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
  // Essai avec expand=prices pour inclure les prix directement
  const res = await ghlFetch(`/products/?locationId=${locationId}&expand=prices`);
  if (!res.ok) throw new Error(`Produits — erreur API GHL: ${res.status} ${res.statusText}`);
  const data = await res.json();
  // 🔍 DEBUG — à retirer après validation
  console.log('DEBUG produit[0] brut:', JSON.stringify((data.products ?? [])[0], null, 2));
  return data.products ?? [];
}

/**
 * Récupère les prix d'un produit spécifique via GET /products/{id}.
 * Test pour voir si les prix s'y trouvent directement.
 */
export async function fetchGHLProductPrices(productId: string): Promise<GHLApiPrice[]> {
  const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
  const res = await ghlFetch(`/products/${productId}?locationId=${locationId}`);
  if (!res.ok) throw new Error(`Produit détail — erreur API GHL: ${res.status} ${res.statusText}`);
  const data = await res.json();
  // 🔍 DEBUG — à retirer après validation
  console.log(`DEBUG product detail[${productId}]:`, JSON.stringify(data, null, 2));
  return data.product?.prices ?? [];
}

/** Récupère toutes les collections (= catégories) du catalogue GHL */
export async function fetchGHLCollections(): Promise<GHLApiCollection[]> {
  const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
  const res = await ghlFetch(`/products/collections?locationId=${locationId}`);
  if (!res.ok) throw new Error(`Collections — erreur API GHL: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.collections ?? [];
}
