import type { Metadata } from 'next';
import Account from '@/views/Account';

export const metadata: Metadata = {
  title: 'Espace client | NEO Performance',
  description:
    'Connectez-vous à votre espace client NEO Performance pour accéder à vos commandes et à votre suivi. Mêmes identifiants que l’application Neo Performance.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/espace-client',
  },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Espace client | NEO Performance',
    description:
      'Connectez-vous à votre espace client NEO Performance pour accéder à vos commandes et à votre suivi.',
    url: 'https://www.neoperformance.ca/espace-client',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Account />;
}
