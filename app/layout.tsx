import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/index.css';

// Polices self-hostées depuis le dépôt (app/fonts, sous-ensemble latin, licence
// OFL). On n'utilise plus next/font/google : au build sur Netlify, Google Fonts
// renvoie parfois des URL de fichiers sans extension et next/font plante
// (« Cannot read properties of null (reading '1') »). `display: swap` +
// variables CSS branchées dans index.css.
const montserrat = localFont({
  src: './fonts/montserrat-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-montserrat',
  display: 'swap',
});

// Réservée aux valeurs mesurées de /porte-ouverte : la chasse fixe fait lire les
// chiffres comme des données relevées, pas comme un argument de vente.
const ibmPlexMono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});
import { CartProvider } from '@/contexts/CartContext';
import SiteChrome from '@/components/SiteChrome';

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
  image: 'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6941c9327109a899ec69b43c.png',
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
    latitude: '45.4668426',
    longitude: '-73.465332',
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
  availableService: [
    {
      '@type': 'LifestyleModification',
      name: 'Programme optimisation composition corporelle 15 semaines',
      description: 'Programme personnalisé axé sur la gestion du cortisol, l\'optimisation de la digestion et l\'équilibre hormonal',
    },
    {
      '@type': 'MedicalProcedure',
      name: 'Consultation naturopathique en ligne',
      description: 'Téléconsultation naturopathique disponible partout au Québec : perte de poids, métabolisme, hormones et digestion. Aussi offerte en clinique à Brossard.',
    },
  ],
  priceRange: '$$',
  sameAs: [
    'https://www.facebook.com/neoperformance1',
    'https://www.instagram.com/neoperformance/',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${ibmPlexMono.variable}`}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fastly.picsum.photos" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-white font-sans text-gray-900 antialiased selection:bg-neo/30 selection:text-neo-900">
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
