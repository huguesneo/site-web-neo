import type { Metadata } from 'next';
import MonDossier from '@/views/MonDossier';
import { isPromoDecouverteActive } from '@/lib/promoDecouverte';

// Rendu à chaque requête : le prix promo bascule tout seul à la fin de la
// Semaine découverte NEO, sans redéploiement.
export const dynamic = 'force-dynamic';

// Page privée : envoyée par les closers aux prospects qui n'ont pas closé
// pendant l'appel. noindex + nofollow et absente du sitemap pour ne jamais
// apparaître dans Google — accessible uniquement par lien direct.
export const metadata: Metadata = {
  title: 'Mon dossier NEO',
  description: "Revois la démarche NEO Performance et ouvre ton dossier clinique.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <MonDossier promoActive={isPromoDecouverteActive()} />;
}
