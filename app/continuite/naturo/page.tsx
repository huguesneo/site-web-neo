import { Suspense } from 'react';
import type { Metadata } from 'next';
import ContinuiteNaturo from '@/views/ContinuiteNaturo';

// Ouverte depuis l'app NEO par une naturopathe : jamais indexée, absente du
// sitemap et du menu.
export const metadata: Metadata = {
  title: 'NEO Continuité',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  referrer: 'no-referrer',
};

export default function Page() {
  return (
    <Suspense>
      <ContinuiteNaturo />
    </Suspense>
  );
}
