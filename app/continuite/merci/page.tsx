import { Suspense } from 'react';
import type { Metadata } from 'next';
import ContinuiteMerci from '@/views/ContinuiteMerci';

// Page de retour de Stripe Checkout : jamais indexée.
export const metadata: Metadata = {
  title: 'Confirmation · NEO Continuité',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return (
    <Suspense>
      <ContinuiteMerci />
    </Suspense>
  );
}
