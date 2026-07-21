import type { Metadata } from 'next';
import { client } from '@/sanity/lib/client';
import LienBio, { type LienPageData } from '@/views/LienBio';

// Page « lien en bio » partagée sur Instagram : accessible uniquement par
// lien direct. noindex + nofollow et absente du sitemap pour ne jamais
// apparaître dans Google (même patron que /protocole-neo).
export const metadata: Metadata = {
  title: 'NEO Performance — Liens',
  description: 'Tous les liens NEO Performance : consultation gratuite, défi, ressources.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

// Les changements faits dans le Studio apparaissent au plus tard 1 min après.
export const revalidate = 60;

const query = `*[_type == "linkPage"][0]{
  tagline,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  items[]{
    _key,
    _type,
    heading,
    label,
    subtitle,
    emoji,
    url,
    featured,
    image,
    ctaLabel,
    enabled
  }
}`;

export default async function Page() {
  let data: LienPageData | null = null;
  try {
    data = await client.fetch<LienPageData | null>(query);
  } catch {
    // Sanity indisponible : LienBio affiche son contenu de secours.
  }
  return <LienBio data={data} />;
}
