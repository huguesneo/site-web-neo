import type { Metadata } from 'next';
import PorteOuverteFlow from '@/components/porteOuverte/PorteOuverteFlow';

const URL_PAGE = 'https://www.neoperformance.ca/porte-ouverte';
const IMAGE =
  'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6941c9327109a899ec69b43c.png';
const TITRE = 'Journée porte ouverte du 23 octobre | NEO Performance';
const DESCRIPTION =
  'Le 23 octobre, 5 naturopathes ouvrent la clinique de Brossard à 40 personnes. Évaluation métabolique de 60 minutes, analyse InBody et portrait métabolique en main. Gratuit.';

export const metadata: Metadata = {
  title: 'Journée porte ouverte du 23 octobre',
  description: DESCRIPTION,
  keywords: [
    'journée porte ouverte NEO Performance',
    'évaluation métabolique gratuite Brossard',
    'analyse InBody Brossard',
    'naturopathe Brossard',
    'perte de poids ménopause Rive-Sud',
  ],
  alternates: {
    canonical: URL_PAGE,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: TITRE,
    description: DESCRIPTION,
    url: URL_PAGE,
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
    images: [{ url: IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITRE,
    description: DESCRIPTION,
    images: [IMAGE],
  },
};

const eventLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Journée porte ouverte NEO Performance',
  description: DESCRIPTION,
  startDate: '2026-10-23T08:00:00-04:00',
  endDate: '2026-10-23T17:00:00-04:00',
  eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: [
    {
      '@type': 'Place',
      name: 'NEO Performance',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '7005 Bd Taschereau, Suite 350',
        addressLocality: 'Brossard',
        addressRegion: 'QC',
        postalCode: 'J4Z 1A7',
        addressCountry: 'CA',
      },
    },
    {
      '@type': 'VirtualLocation',
      url: URL_PAGE,
    },
  ],
  image: [IMAGE],
  organizer: {
    '@type': 'Organization',
    name: 'NEO Performance',
    url: 'https://www.neoperformance.ca/',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CAD',
    availability: 'https://schema.org/InStock',
    url: URL_PAGE,
  },
};

export default function Page() {
  // PorteOuverteFlow gère sa propre mise en page : bande foncée pleine largeur
  // et carte en surplomb. Le menu et le pied de page du site restent, la page
  // n'étant pas dans la liste plein écran de SiteChrome.
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <PorteOuverteFlow />
    </>
  );
}
