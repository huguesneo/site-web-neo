import type { Metadata } from 'next';
import ReservationManuelle from '@/components/porteOuverte/ReservationManuelle';

export const metadata: Metadata = {
  title: 'Réservation — Porte ouverte',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReservationManuelle />;
}
