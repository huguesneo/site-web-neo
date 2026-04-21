/**
 * Hook React — charge les produits depuis WooCommerce REST API v3
 */

import { useState, useEffect } from 'react';
import { fetchWCProducts, WCProduct } from '../services/wooApi';
import { GHLProduct } from '../data/ghlProducts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function mapWCProduct(p: WCProduct): GHLProduct {
  const price = p.price || p.regular_price || '0.00';
  const image = p.images?.[0]?.src ?? '';
  const category = p.categories?.[0]?.name ?? 'Général';
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
