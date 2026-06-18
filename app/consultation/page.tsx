import type { Metadata } from 'next';
import Consultation from '@/views/Consultation';

export const metadata: Metadata = {
  title: 'Consultation Naturopathe en ligne (Gratuite)',
  description: 'Consultation naturopathe gratuite de 30 minutes : en ligne partout au Québec ou en clinique à Brossard. Bilan métabolique personnalisé, perte de poids et hormones.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/consultation',
  },
  openGraph: {
    title: 'Consultation Naturopathe en ligne (Gratuite) | NEO Performance',
    description: 'Consultation naturopathe gratuite de 30 minutes : en ligne partout au Québec ou en clinique à Brossard. Bilan métabolique personnalisé, perte de poids et hormones.',
    url: 'https://www.neoperformance.ca/consultation',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Consultation />;
}
