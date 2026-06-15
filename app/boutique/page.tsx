import type { Metadata } from 'next';
import Shop from '@/views/Shop';

export const metadata: Metadata = {
  title: 'Boutique Suppléments Cliniques | NEO Performance',
  description: 'Boutique en ligne de suppléments de qualité clinique sélectionnés par nos naturopathes. Magnésium, oméga-3, enzymes digestives et vitamines B. Livraison 24-48h.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/boutique',
  },
  openGraph: {
    title: 'Boutique Suppléments Cliniques | NEO Performance',
    description: 'Boutique en ligne de suppléments de qualité clinique sélectionnés par nos naturopathes. Magnésium, oméga-3, enzymes digestives et vitamines B. Livraison 24-48h.',
    url: 'https://www.neoperformance.ca/boutique',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Shop />;
}
