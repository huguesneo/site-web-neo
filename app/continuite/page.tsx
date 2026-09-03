import type { Metadata } from 'next';
import Continuite from '@/views/Continuite';

// Page cachée : offre de continuité envoyée directement aux clientes qui
// terminent leur programme (courriel, SMS). noindex + nofollow, absente du
// sitemap et sans lien dans la navigation.
export const metadata: Metadata = {
  title: 'NEO Continuité',
  description:
    'Garde la structure après ton programme : Léo illimité, chat avec ta naturopathe et rencontres de suivi incluses.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <Continuite />;
}
