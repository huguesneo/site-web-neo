import type { Metadata } from 'next';
import AbonnementLeo from '@/views/AbonnementLeo';

// Page cachée : réactivation d'abonnement Léo envoyée directement par lien
// (courriel, SMS). noindex + nofollow, absente du sitemap et sans lien dans
// la navigation — accessible uniquement par lien direct.
export const metadata: Metadata = {
  title: 'Réactive ton accès à Léo',
  description: "Réactive ton abonnement à Léo, l'assistant métabolique IA de NEO Performance.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <AbonnementLeo />;
}
