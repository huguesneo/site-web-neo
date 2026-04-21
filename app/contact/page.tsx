import type { Metadata } from 'next';
import Contact from '@/views/Contact';

export const metadata: Metadata = {
  title: 'Nous Joindre | NEO Performance Brossard',
  description: 'Contactez la clinique NEO Performance à Brossard. 7005 boul Taschereau, Brossard QC. Téléphone : (450) 486-4006. Lundi au vendredi, 8h à 17h.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/contact',
  },
  openGraph: {
    title: 'Nous Joindre | NEO Performance Brossard',
    description: 'Contactez la clinique NEO Performance à Brossard. 7005 boul Taschereau, Brossard QC. Téléphone : (450) 486-4006. Lundi au vendredi, 8h à 17h.',
    url: 'https://www.neoperformance.ca/contact',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Contact />;
}
