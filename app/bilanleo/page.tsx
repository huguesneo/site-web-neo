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
  return (
    <div className="bg-white min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <BilanFlow />
      </div>
    </div>
  );
}
