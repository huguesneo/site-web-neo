import type { Metadata } from 'next';
import ProtocoleNeo from '@/views/ProtocoleNeo';

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
  return <ProtocoleNeo />;
}
