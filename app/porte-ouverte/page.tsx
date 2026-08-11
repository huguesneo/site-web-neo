import type { Metadata } from 'next';
import PorteOuverteFlow from '@/components/porteOuverte/PorteOuverteFlow';

const TITRE = 'Journée porte ouverte du 11 septembre | NEO Performance';
const DESCRIPTION =
  'Le 11 septembre, 6 naturopathes ouvrent la clinique à 48 personnes. Évaluation métabolique de 60 minutes, analyse InBody et portrait métabolique en main. Gratuit.';

export const metadata: Metadata = {
  title: 'Journée porte ouverte du 11 septembre',
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://www.neoperformance.ca/porte-ouverte',
  },
  openGraph: {
    title: TITRE,
    description: DESCRIPTION,
    url: 'https://www.neoperformance.ca/porte-ouverte',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  // PorteOuverteFlow gère sa propre mise en page : bande foncée pleine largeur
  // et carte en surplomb. Le menu et le pied de page du site restent, la page
  // n'étant pas dans la liste plein écran de SiteChrome.
  return <PorteOuverteFlow />;
}
