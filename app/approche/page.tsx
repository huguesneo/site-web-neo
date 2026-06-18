import type { Metadata } from 'next';
import Approach from '@/views/Approach';

export const metadata: Metadata = {
  title: 'Naturopathe Perte de Poids en ligne | Optimisation Métabolique',
  description: 'Naturopathe perte de poids en ligne et à Brossard. Approche NEO : gestion du cortisol, équilibre hormonal et digestion. Programme scientifique de 15 semaines basé sur votre biochimie.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/approche',
  },
  openGraph: {
    title: 'Naturopathe Perte de Poids en ligne | Optimisation Métabolique | NEO Performance',
    description: 'Naturopathe perte de poids en ligne et à Brossard. Approche NEO : gestion du cortisol, équilibre hormonal et digestion. Programme scientifique de 15 semaines basé sur votre biochimie.',
    url: 'https://www.neoperformance.ca/approche',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Approach />;
}
