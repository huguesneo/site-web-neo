import type { Metadata } from 'next';
import Terms from '@/views/Terms';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions d'utilisation de NEO Performance : programme de messagerie texte (SMS), propriété intellectuelle, responsabilité et modalités du site.",
  alternates: {
    canonical: 'https://www.neoperformance.ca/conditions-dutilisation',
  },
  openGraph: {
    title: "Conditions d'utilisation | NEO Performance",
    description: "Conditions d'utilisation de NEO Performance : programme de messagerie texte (SMS), propriété intellectuelle, responsabilité et modalités du site.",
    url: 'https://www.neoperformance.ca/conditions-dutilisation',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Terms />;
}
