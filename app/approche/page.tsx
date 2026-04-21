import type { Metadata } from 'next';
import Approach from '@/views/Approach';

export const metadata: Metadata = {
  title: 'Notre Approche Naturopathique | NEO Performance',
  description: 'Découvrez l\'approche unique NEO : gestion du cortisol, équilibre hormonal et optimisation digestive. Programme scientifique de 15 semaines basé sur votre biochimie.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/approche',
  },
  openGraph: {
    title: 'Notre Approche Naturopathique | NEO Performance',
    description: 'Découvrez l\'approche unique NEO : gestion du cortisol, équilibre hormonal et optimisation digestive. Programme scientifique de 15 semaines basé sur votre biochimie.',
    url: 'https://www.neoperformance.ca/approche',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Approach />;
}
