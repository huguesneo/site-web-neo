import { Suspense } from 'react';
import type { Metadata } from 'next';
import EvaluationReprise from '@/views/EvaluationReprise';

// Page envoyée par courriel de réactivation : noindex + nofollow, absente du
// sitemap et sans lien dans la navigation.
export const metadata: Metadata = {
  title: 'Évaluation de reprise · NEO Performance',
  description:
    'Une rencontre avec ta naturopathe pour faire le point sur ton métabolisme aujourd’hui et repartir avec un plan clair.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  // useSearchParams (préremplissage et UTM) exige une frontière Suspense.
  return (
    <Suspense>
      <EvaluationReprise />
    </Suspense>
  );
}
