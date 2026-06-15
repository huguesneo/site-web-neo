import type { Metadata } from 'next';
import Blog, { DisplayPost } from '@/views/Blog';
import { client } from '@/sanity/lib/client';
import { postsQuery } from '@/sanity/lib/queries';
import { urlForImage } from '@/sanity/lib/image';
import { formatDateFR } from '@/sanity/lib/utils';

export const metadata: Metadata = {
  title: 'Blogue Santé Métabolique & Naturopathie | NEO Performance',
  description: 'Articles scientifiques sur l\'optimisation métabolique, la santé hormonale, la digestion et le cortisol. Conseils pratiques de nos naturopathes experts.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/blog',
  },
  openGraph: {
    title: 'Blogue Santé Métabolique & Naturopathie | NEO Performance',
    description: 'Articles scientifiques sur l\'optimisation métabolique, la santé hormonale, la digestion et le cortisol. Conseils pratiques de nos naturopathes experts.',
    url: 'https://www.neoperformance.ca/blog',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2670&auto=format&fit=crop';

// Revalide la liste toutes les 60 s (nouveaux articles visibles rapidement)
export const revalidate = 60;

interface RawPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  mainImage?: Parameters<typeof urlForImage>[0];
  category?: string;
  author?: string;
}

export default async function Page() {
  const posts = await client.fetch<RawPost[]>(postsQuery);

  const display: DisplayPost[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    category: p.category ?? 'Santé',
    author: p.author ?? 'Équipe NEO',
    date: formatDateFR(p.publishedAt),
    image: p.mainImage
      ? urlForImage(p.mainImage).width(800).height(500).fit('crop').url()
      : DEFAULT_IMAGE,
  }));

  return <Blog posts={display} />;
}
