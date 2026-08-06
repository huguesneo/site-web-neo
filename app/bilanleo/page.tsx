import type { Metadata } from 'next';
import BilanFlow from '@/components/bilanleo/BilanFlow';

/**
 * Page cachée : accessible par lien direct, jamais indexée, absente du sitemap
 * et sans lien entrant depuis le menu ou le footer.
 */
export const metadata: Metadata = {
  title: 'Bilan Léo',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  // BilanFlow gère sa propre mise en page : bande foncée pleine largeur, carte
  // en surplomb, FAQ. La page ne fait que le monter.
  return <BilanFlow />;
}
