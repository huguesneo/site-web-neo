import type { Metadata } from 'next';
import Home from '@/views/Home';

export const metadata: Metadata = {
  title: 'NEO Performance | Optimisation Métabolique & Composition Corporelle',
  description: 'Clinique d\'optimisation métabolique à Brossard, Rive-Sud. Programme 15 semaines pour femmes actives 35-50 ans : cortisol, hormones, digestion. Résultats durables.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/',
  },
  openGraph: {
    title: 'NEO Performance | Optimisation Métabolique & Composition Corporelle',
    description: 'Clinique d\'optimisation métabolique à Brossard, Rive-Sud. Programme 15 semaines pour femmes actives 35-50 ans : cortisol, hormones, digestion. Résultats durables.',
    url: 'https://www.neoperformance.ca/',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Home />;
}
