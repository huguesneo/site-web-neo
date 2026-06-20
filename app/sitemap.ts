import type { MetadataRoute } from 'next';
import { client } from '@/sanity/lib/client';
import { postSlugsQuery } from '@/sanity/lib/queries';
import { getShopProducts } from '@/services/products';
import { NEO_ACCOMPANIMENT_CATEGORY } from '@/constants';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.neoperformance.ca';

  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const slugs = await client.fetch<{ slug: string }[]>(postSlugsQuery);
    blogPosts = slugs.map((s) => ({
      url: `${baseUrl}/blog/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    // Sanity non configuré ou indisponible : on sert quand même le reste du sitemap
  }

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await getShopProducts();
    productPages = products
      // « Accompagnement NEO » réservé aux clients → hors sitemap.
      .filter((p) => p.category !== NEO_ACCOMPANIMENT_CATEGORY)
      .map((p) => ({
      url: `${baseUrl}/boutique/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // WooCommerce indisponible : on sert quand même le reste du sitemap
  }

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/approche`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/consultation`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/equipe`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/boutique`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...productPages,
    ...blogPosts,
  ];
}
