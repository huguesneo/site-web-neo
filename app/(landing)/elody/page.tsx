import type { Metadata } from 'next';
import PartenaireLanding, { type PartenaireConfig } from '@/components/partenaires/PartenaireLanding';

/**
 * Contenu de la page partenaire d'Elody Petit. Tout ce qui est propre à Elody
 * est ici : on change la photo ou la citation en une ligne.
 * Photo : déposer le fichier dans public/partenaires/elody/ et changer `photo`.
 */
const ELODY_CONFIG: PartenaireConfig = {
  prenom: 'Elody',
  photo: '/partenaires/elody/elody.jpg',
  citation: 'Ce programme a changé ma vie. Il pourrait changer la tienne aussi.',
  instagram: '@_elodypetit',
  // Calendrier de la VSL. `calendrier_decouverte=elody` est le marqueur fiable
  // d'attribution dans GHL; les UTM sont un second marqueur. La redirection
  // vers /felicitation-booking est réglée dans GHL, pas ici.
  calendrierUrl:
    'https://api.leadconnectorhq.com/widget/booking/DIN6EPtG7eNU3Gf6ZRoC?calendrier_decouverte=elody&utm_source=partenaire&utm_medium=elody&utm_campaign=nov2026',
};

const TITRE = `Ton analyse métabolique gratuite, recommandée par ${ELODY_CONFIG.prenom}`;
const DESCRIPTION =
  "45 minutes en ligne avec une naturopathe de l'équipe NEO pour comprendre ce qui freine ton corps. Gratuit et sans engagement.";

// Page partenaire (trafic Instagram) : hors index, hors sitemap (Disallow dans robots.txt).
export const metadata: Metadata = {
  title: TITRE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  alternates: { canonical: '/elody' },
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: '/elody',
    siteName: 'NEO Performance',
    title: TITRE,
    description: DESCRIPTION,
    images: [{ url: ELODY_CONFIG.photo, alt: `${ELODY_CONFIG.prenom}, partenaire NEO Performance` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITRE,
    description: DESCRIPTION,
    images: [ELODY_CONFIG.photo],
  },
};

export default function Page() {
  return <PartenaireLanding config={ELODY_CONFIG} />;
}
