import type { Metadata } from 'next';
import Blog from '@/views/Blog';

export const metadata: Metadata = {
  title: 'Blog Santé Métabolique & Naturopathie | NEO Performance',
  description: 'Articles scientifiques sur l\'optimisation métabolique, la santé hormonale, la digestion et le cortisol. Conseils pratiques de nos naturopathes experts.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/blog',
  },
  openGraph: {
    title: 'Blog Santé Métabolique & Naturopathie | NEO Performance',
    description: 'Articles scientifiques sur l\'optimisation métabolique, la santé hormonale, la digestion et le cortisol. Conseils pratiques de nos naturopathes experts.',
    url: 'https://www.neoperformance.ca/blog',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <Blog />;
}
