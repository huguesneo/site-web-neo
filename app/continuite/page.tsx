import { Suspense } from 'react';
import type { Metadata } from 'next';
import Continuite from '@/views/Continuite';

// Page publique (accessible avec le lien), mais noindex + nofollow, absente du
// sitemap et sans lien dans la navigation pour l'instant.
export const metadata: Metadata = {
  title: 'NEO Continuité',
  description:
    'Garde tes résultats après ton programme : ta naturopathe, Léo, l’application NEO et une rencontre de groupe chaque mois.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  // useSearchParams (lecture des UTM) exige une frontière Suspense.
  return (
    <Suspense>
      <Continuite />
    </Suspense>
  );
}
