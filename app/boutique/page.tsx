import type { Metadata } from 'next';
import Shop from '@/views/Shop';
import { getShopProducts } from '@/services/products';

// La boutique est rendue côté serveur avec les produits pré-chargés (cache 10 min) :
// Google indexe les produits/prix, et le visiteur voit la grille sans spinner.
export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Boutique Suppléments Naturopathiques',
  description: 'Boutique en ligne de suppléments de qualité clinique sélectionnés par nos naturopathes. Magnésium, oméga-3, enzymes digestives et vitamines B. Livraison 24-48h.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/boutique',
  },
  openGraph: {
    title: 'Boutique Suppléments Naturopathiques | NEO Performance',
    description: 'Boutique en ligne de suppléments de qualité clinique sélectionnés par nos naturopathes. Magnésium, oméga-3, enzymes digestives et vitamines B. Livraison 24-48h.',
    url: 'https://www.neoperformance.ca/boutique',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default async function Page() {
  const initialProducts = await getShopProducts();
  return <Shop initialProducts={initialProducts} />;
}
