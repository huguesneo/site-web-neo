import type { Metadata } from 'next';
import Temoignages from '@/views/Temoignages';

export const metadata: Metadata = {
  title: 'Témoignages & résultats clients | NEO Performance',
  description:
    'Résultats réels et documentés de clients NEO Performance : perte de gras, métabolisme débloqué, hormones et digestion optimisées. Témoignages vidéo et transformations avant/après.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/temoignages',
  },
  openGraph: {
    title: 'Témoignages & résultats clients | NEO Performance',
    description:
      'Résultats réels et documentés de clients NEO Performance : perte de gras, métabolisme débloqué, hormones et digestion optimisées.',
    url: 'https://www.neoperformance.ca/temoignages',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Temoignages />;
}
