import type { Metadata } from 'next';
import Home from '@/views/Home';

export const metadata: Metadata = {
  title: 'Naturopathe en ligne & à Brossard | Optimisation Métabolique | NEO Performance',
  description: 'Naturopathe en ligne et à Brossard. Consultations virtuelles partout au Québec : perte de poids, cortisol, hormones, digestion. Optimisation métabolique durable.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/',
  },
  openGraph: {
    title: 'Naturopathe en ligne & à Brossard | Optimisation Métabolique | NEO Performance',
    description: 'Naturopathe en ligne et à Brossard. Consultations virtuelles partout au Québec : perte de poids, cortisol, hormones, digestion. Optimisation métabolique durable.',
    url: 'https://www.neoperformance.ca/',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Home />;
}
