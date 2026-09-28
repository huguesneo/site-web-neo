import type { Metadata } from 'next';
import { Suspense } from 'react';
import ReserverPlace from '@/components/porteOuverte/ReserverPlace';

export const metadata: Metadata = {
  title: 'Réserve ta place — Porte ouverte du 23 octobre',
  robots: { index: false, follow: false },
};

/**
 * Lien de relance : pour les personnes qui ont fait l'inscription et vu le
 * calendrier sans réserver. Juste le choix clinique / visio et le calendrier,
 * sans repasser par le questionnaire.
 */
export default function Page() {
  return (
    <Suspense>
      <ReserverPlace />
    </Suspense>
  );
}
