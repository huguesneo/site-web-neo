import type { Metadata } from 'next';
import AccountOrders from '@/views/AccountOrders';

export const metadata: Metadata = {
  title: 'Mes commandes',
  description: 'Consultez l’historique de vos commandes à la boutique NEO Performance.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/espace-client/commandes',
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountOrders />;
}
