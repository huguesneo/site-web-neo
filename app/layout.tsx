import type { Metadata } from 'next';
import '@/index.css';
import { CartProvider } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import Chatbot from '@/components/Chatbot';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.neoperformance.ca'),
  title: {
    default: 'NEO Performance | Optimisation Métabolique',
    template: '%s | NEO Performance',
  },
  description: 'Clinique spécialisée en optimisation de la composition corporelle, du métabolisme et des hormones à Brossard. Programme 15 semaines pour femmes actives de 35 à 50 ans.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['MedicalClinic', 'LocalBusiness'],
  name: 'NEO Performance',
  description: 'Clinique spécialisée en optimisation de la composition corporelle, du métabolisme et des hormones. Programme de 15 semaines pour femmes actives de 35 à 50 ans.',
  url: 'https://www.neoperformance.ca/',
  telephone: '(450) 486-4006',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '7005 Bd Taschereau, Suite 350',
    addressLocality: 'Brossard',
    addressRegion: 'QC',
    postalCode: 'J4Z 1A7',
    addressCountry: 'CA',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '45.4654',
    longitude: '-73.4596',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '08:00',
      closes: '17:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Friday',
      opens: '08:00',
      closes: '12:00',
    },
  ],
  areaServed: ['Brossard', 'Longueuil', 'Rive-Sud de Montréal', 'Québec'],
  availableService: {
    '@type': 'LifestyleModification',
    name: 'Programme optimisation composition corporelle 15 semaines',
    description: 'Programme personnalisé axé sur la gestion du cortisol, l\'optimisation de la digestion et l\'équilibre hormonal',
  },
  priceRange: '$$',
  sameAs: [
    'https://www.facebook.com/neoperformance1',
    'https://www.instagram.com/neoperformance/',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-white font-sans text-gray-900 antialiased selection:bg-neo/30 selection:text-neo-900">
        <CartProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <CookieConsent />
          <Chatbot />
        </CartProvider>
      </body>
    </html>
  );
}
