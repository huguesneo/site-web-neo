import type { Metadata } from 'next';
import Privacy from '@/views/Privacy';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité de NEO Performance : collecte, utilisation et protection de vos renseignements personnels et de vos données de messagerie texte (SMS).',
  alternates: {
    canonical: 'https://www.neoperformance.ca/politique-de-confidentialite',
  },
  openGraph: {
    title: 'Politique de confidentialité | NEO Performance',
    description: 'Politique de confidentialité de NEO Performance : collecte, utilisation et protection de vos renseignements personnels et de vos données de messagerie texte (SMS).',
    url: 'https://www.neoperformance.ca/politique-de-confidentialite',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Privacy />;
}
