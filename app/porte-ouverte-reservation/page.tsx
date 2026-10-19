import type { Metadata } from 'next';
import PorteOuverteFlow from '@/components/porteOuverte/PorteOuverteFlow';

// Même page d'optin que /porte-ouverte, sans le questionnaire : coordonnées,
// puis seulement le choix clinique ou visio, qui ouvre le bon calendrier.
// Lien envoyé directement, donc jamais indexé : la page publique reste
// /porte-ouverte.
export const metadata: Metadata = {
  title: 'Réserve ta place · Journée porte ouverte du 23 octobre',
  alternates: { canonical: 'https://www.neoperformance.ca/porte-ouverte' },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <PorteOuverteFlow parcours="court" />;
}
