/**
 * Hook React — charge les produits depuis WooCommerce REST API v3
 */

import { useState, useEffect } from 'react';
import { fetchWCProducts, WCProduct } from '../services/wooApi';
import { GHLProduct } from '../data/ghlProducts';
import { SHOP_CATEGORY_RULES, SHOP_DEFAULT_CATEGORY, ShopCategory } from '../constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** Range un produit dans une des 5 catégories boutique selon ses tags WooCommerce. */
function resolveCategory(p: WCProduct): ShopCategory {
  const tags = new Set((p.categories ?? []).map((c) => normalize(c.name)));
  for (const rule of SHOP_CATEGORY_RULES) {
    if (rule.wcTags.some((t) => tags.has(normalize(t)))) return rule.category;
  }
  return SHOP_DEFAULT_CATEGORY;
}

function mapWCProduct(p: WCProduct): GHLProduct {
  const price = p.price || p.regular_price || '0.00';
  const image = p.images?.[0]?.src ?? '';
  const category = resolveCategory(p);
  const description = stripHtml(p.description || p.short_description || '');

  return {
    id: String(p.id),
    name: p.name,
    category,
    price: parseFloat(price).toFixed(2),
    image,
    checkoutUrl: p.permalink,
    description,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGHLProducts() {
  const [products, setProducts] = useState<GHLProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWCProducts()
      .then((raw) => {
        const mapped = raw
          .filter((p) => p.catalog_visibility !== 'hidden')
          .map(mapWCProduct);
        setProducts(mapped);
        setError(null);
      })
      .catch((err: Error) => {
        console.error('Erreur chargement boutique WooCommerce:', err);
        setError('Impossible de charger les produits. Vérifiez votre connexion et réessayez.');
      })
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
