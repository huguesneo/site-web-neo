import type { Metadata } from 'next';
import Consultation from '@/views/Consultation';

export const metadata: Metadata = {
  title: 'Consultation Gratuite 30 min | NEO Performance',
  description: 'Réservez votre consultation gratuite de 30 minutes avec un naturopathe NEO Performance. Virtuelle ou en clinique à Brossard. Bilan métabolique personnalisé.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/consultation',
  },
  openGraph: {
    title: 'Consultation Gratuite 30 min | NEO Performance',
    description: 'Réservez votre consultation gratuite de 30 minutes avec un naturopathe NEO Performance. Virtuelle ou en clinique à Brossard. Bilan métabolique personnalisé.',
    url: 'https://www.neoperformance.ca/consultation',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Consultation />;
}
