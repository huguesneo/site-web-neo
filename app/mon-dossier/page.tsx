import type { Metadata } from 'next';
import MonDossier from '@/views/MonDossier';

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
  return <MonDossier />;
}
