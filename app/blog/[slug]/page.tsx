import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import Section from '@/components/Section';
import Button from '@/components/Button';
import PortableBody from '@/components/PortableBody';
import { client } from '@/sanity/lib/client';
import { postQuery, postSlugsQuery } from '@/sanity/lib/queries';
import { urlForImage } from '@/sanity/lib/image';
import { formatDateFR, estimateReadTime } from '@/sanity/lib/utils';

export const revalidate = 60;

interface PostData {
  _id: string;
  title: string;
  seoTitle?: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  mainImage?: Parameters<typeof urlForImage>[0];
  body?: { _type?: string; children?: { text?: string }[] }[];
  category?: string;
  author?: {
    name: string;
    role?: string;
    image?: Parameters<typeof urlForImage>[0];
    bio?: string;
  };
}

export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(postSlugsQuery);
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await client.fetch<PostData | null>(postQuery, { slug });
  if (!post) return { title: 'Article non trouvé' };

  const image = post.mainImage ? urlForImage(post.mainImage).width(1200).height(630).fit('crop').url() : undefined;
  const title = post.seoTitle || post.title;

  return {
    title: `${title} | NEO Performance`,
    description: post.excerpt,
    alternates: { canonical: `https://www.neoperformance.ca/blog/${post.slug}` },
    openGraph: {
      title,
      description: post.excerpt,
      url: `https://www.neoperformance.ca/blog/${post.slug}`,
      type: 'article',
      locale: 'fr_CA',
      publishedTime: post.publishedAt,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await client.fetch<PostData | null>(postQuery, { slug });
  if (!post) notFound();

  const image = post.mainImage ? urlForImage(post.mainImage).width(1600).fit('max').url() : null;
  const authorImage = post.author?.image ? urlForImage(post.author.image).width(96).height(96).fit('crop').url() : null;
  const readTime = estimateReadTime(post.body);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: image ? [image] : undefined,
    datePublished: post.publishedAt,
    author: { '@type': 'Person', name: post.author?.name },
    publisher: { '@type': 'Organization', name: 'NEO Performance' },
    mainEntityOfPage: `https://www.neoperformance.ca/blog/${post.slug}`,
  };

  return (
    <article className="pt-24 min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="container mx-auto px-4 max-w-4xl mb-12">
        <Link href="/blog" className="inline-flex items-center text-gray-500 hover:text-neo mb-8 transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Retour aux articles
        </Link>

        {post.category && (
          <div className="mb-6 flex gap-3">
            <span className="bg-neo/10 text-neo px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {post.category}
            </span>
          </div>
        )}

        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">{post.title}</h1>

        <div className="flex items-center justify-between border-y border-gray-100 py-6">
          <div className="flex items-center gap-4">
            {authorImage && (
              <img src={authorImage} alt={post.author?.name || ''} className="w-12 h-12 rounded-full object-cover shadow-sm" loading="lazy" />
            )}
            <div>
              <p className="font-bold text-gray-900 text-sm">{post.author?.name}</p>
              {post.author?.role && <p className="text-xs text-gray-500">{post.author.role}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end text-xs text-gray-500 gap-1">
            {post.publishedAt && <span className="flex items-center gap-1"><Calendar size={12} /> {formatDateFR(post.publishedAt)}</span>}
            <span className="flex items-center gap-1"><Clock size={12} /> {readTime} de lecture</span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {image && (
        <div className="container mx-auto px-4 max-w-5xl mb-16">
          <div className="aspect-[21/9] rounded-3xl overflow-hidden shadow-xl">
            <img src={image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 max-w-3xl">
        <div
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-a:text-neo prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-bold
            prose-ul:list-disc prose-ul:pl-5
            prose-li:marker:text-neo"
        >
          <PortableBody value={post.body} />
        </div>
      </div>

      {/* CTA */}
      <Section background="light" className="mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Besoin d'aller plus loin ?</h2>
          <p className="text-gray-600 mb-8">
            Cet article vous a parlé ? Discutons de votre situation personnelle lors d'une consultation gratuite de 45 minutes.
          </p>
          <Button to="/consultation" variant="primary">Réserver ma consultation</Button>
        </div>
      </Section>
    </article>
  );
}
