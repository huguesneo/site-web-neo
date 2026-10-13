import { Suspense } from 'react';
import type { Metadata } from 'next';
import EvaluationRepriseReserver from '@/views/EvaluationRepriseReserver';

// Page de retour de Stripe Checkout : jamais indexée.
export const metadata: Metadata = {
  title: 'Choisis ton moment · Évaluation de reprise',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return (
    <Suspense>
      <EvaluationRepriseReserver />
    </Suspense>
  );
}
