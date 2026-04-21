import type { Metadata } from 'next';
import Checkout from '@/views/Checkout';

export const metadata: Metadata = {
  title: 'Paiement Sécurisé | NEO Performance',
  description: 'Finalisez votre commande de suppléments NEO Performance en toute sécurité. Informations de livraison et paiement crypté SSL.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/paiement',
  },
  openGraph: {
    title: 'Paiement Sécurisé | NEO Performance',
    description: 'Finalisez votre commande de suppléments NEO Performance en toute sécurité. Informations de livraison et paiement crypté SSL.',
    url: 'https://www.neoperformance.ca/paiement',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Checkout />;
}
