import type { Metadata } from 'next';
import Cart from '@/views/Cart';

export const metadata: Metadata = {
  title: 'Mon Panier | NEO Performance',
  description: 'Consultez votre panier et finalisez votre commande de suppléments cliniques NEO Performance. Paiement sécurisé et livraison rapide.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/panier',
  },
  openGraph: {
    title: 'Mon Panier | NEO Performance',
    description: 'Consultez votre panier et finalisez votre commande de suppléments cliniques NEO Performance. Paiement sécurisé et livraison rapide.',
    url: 'https://www.neoperformance.ca/panier',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Cart />;
}
