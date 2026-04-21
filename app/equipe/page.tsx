import type { Metadata } from 'next';
import Team from '@/views/Team';

export const metadata: Metadata = {
  title: 'L\'Équipe de Naturopathes | NEO Performance',
  description: 'Rencontrez nos naturopathes et spécialistes en santé intégrative à Brossard. Une équipe d\'experts passionnés par l\'optimisation métabolique et hormonale.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/equipe',
  },
  openGraph: {
    title: 'L\'Équipe de Naturopathes | NEO Performance',
    description: 'Rencontrez nos naturopathes et spécialistes en santé intégrative à Brossard. Une équipe d\'experts passionnés par l\'optimisation métabolique et hormonale.',
    url: 'https://www.neoperformance.ca/equipe',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Team />;
}
