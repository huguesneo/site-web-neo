import type { Metadata } from 'next';
import GuideStress from '@/components/guideStress/GuideStress';

// Page de capture pour les campagnes : hors index et hors sitemap.
export const metadata: Metadata = {
  title: 'Guide gratuit : Sors du mode survie',
  description: 'Le protocole pour débloquer ton métabolisme. Reçois le guide gratuit de NEO Performance.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GuideStress />;
}
