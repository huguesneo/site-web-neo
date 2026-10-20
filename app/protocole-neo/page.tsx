import type { Metadata } from 'next';
import ProtocoleNeo from '@/views/ProtocoleNeo';
import { isPromoDecouverteActive } from '@/lib/promoDecouverte';

// Rendu à chaque requête : le prix promo bascule tout seul à la fin de la
// Semaine découverte NEO, sans redéploiement.
export const dynamic = 'force-dynamic';

// Page privée : accessible uniquement par lien direct (partage d'écran des
// closers). noindex + nofollow et absente du sitemap pour ne jamais
// apparaître dans Google.
export const metadata: Metadata = {
  title: 'Protocole NEO',
  description: 'Présentation de l\'accompagnement NEO Performance.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <ProtocoleNeo promoActive={isPromoDecouverteActive()} />;
}
