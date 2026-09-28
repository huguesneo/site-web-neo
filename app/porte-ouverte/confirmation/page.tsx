import type { Metadata } from 'next';
import { Suspense } from 'react';
import Confirmation from '@/components/porteOuverte/Confirmation';

export const metadata: Metadata = {
  title: 'Ta place est confirmée — Porte ouverte du 23 octobre',
  robots: { index: false, follow: false },
};

/**
 * Page d'arrivée après la réservation : les deux calendriers GHL de la porte
 * ouverte y redirigent (formSubmitRedirectUrl).
 */
export default function Page() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
