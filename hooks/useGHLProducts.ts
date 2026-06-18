/**
 * Hook React — fournit les produits de la boutique.
 *
 * Deux usages :
 *   • Boutique (SSR) : on passe `initialProducts` rendus côté serveur → aucun
 *     fetch, affichage immédiat, contenu indexable par Google.
 *   • Chatbot/Léo (client global) : sans argument → fetch du proxy `/api/products`
 *     (les clés WooCommerce restent côté serveur, réponse mise en cache).
 *
 * Le mappage WooCommerce et l'assainissement HTML se font désormais côté serveur
 * (services/products.ts). Ce hook ne manipule plus que des GHLProduct prêts.
 */

import { useState, useEffect } from 'react';
import { GHLProduct } from '../data/ghlProducts';

export function useGHLProducts(initialProducts?: GHLProduct[]) {
  const hasInitial = Array.isArray(initialProducts) && initialProducts.length > 0;
  const [products, setProducts] = useState<GHLProduct[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Produits déjà fournis par le serveur → rien à charger.
    if (hasInitial) return;

    let cancelled = false;
    fetch('/api/products')
      .then((res) => {
        if (!res.ok) throw new Error(`Produits: ${res.status}`);
        return res.json() as Promise<GHLProduct[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error('Erreur chargement boutique:', err);
        setError('Impossible de charger les produits. Vérifiez votre connexion et réessayez.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [hasInitial]);

  return { products, loading, error };
}
