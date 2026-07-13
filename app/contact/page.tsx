import type { Metadata } from 'next';
import Contact from '@/views/Contact';

export const metadata: Metadata = {
  title: 'Contact Naturopathe Brossard',
  description: 'Contactez la clinique NEO Performance à Brossard. 7005 Bd Taschereau, Suite 350, Brossard QC. Téléphone : (450) 486-4006. Lundi au jeudi 8h à 17h, vendredi 8h à 12h.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/contact',
  },
  openGraph: {
    title: 'Contact Naturopathe Brossard | NEO Performance',
    description: 'Contactez la clinique NEO Performance à Brossard. 7005 Bd Taschereau, Suite 350, Brossard QC. Téléphone : (450) 486-4006. Lundi au jeudi 8h à 17h, vendredi 8h à 12h.',
    url: 'https://www.neoperformance.ca/contact',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Contact />;
}
