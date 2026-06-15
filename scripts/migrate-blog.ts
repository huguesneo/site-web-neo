/**
 * Migration unique des anciens articles (data/blogPosts.ts) vers Sanity.
 * Lancer avec :  npx tsx scripts/migrate-blog.ts
 * Requiert SANITY_API_WRITE_TOKEN dans .env.local
 *
 * Idempotent : relançable sans créer de doublons (createOrReplace + _id stables).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@sanity/client';
import { htmlToBlocks } from '@sanity/block-tools';
import { Schema } from '@sanity/schema';
import { JSDOM } from 'jsdom';
import { BLOG_POSTS } from '../data/blogPosts';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN!;

if (!projectId || projectId.includes('REMPLIR') || !token || token.includes('REMPLIR')) {
  console.error('\n❌ Renseigne NEXT_PUBLIC_SANITY_PROJECT_ID et SANITY_API_WRITE_TOKEN dans .env.local avant de lancer la migration.\n');
  process.exit(1);
}

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false });

// Schéma minimal pour la conversion HTML -> Portable Text
const defaultSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'post',
      type: 'document',
      fields: [{ name: 'body', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }],
    },
  ],
});
const blockContentType = defaultSchema.get('post').fields.find((f: { name: string }) => f.name === 'body').type;

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function frDateToISO(date: string): string {
  const months: Record<string, string> = {
    janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06',
    juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12',
  };
  const m = date.match(/(\d{1,2})\s+([A-Za-zéûôà]+)\s+(\d{4})/i);
  if (!m) return new Date().toISOString();
  const day = m[1].padStart(2, '0');
  const month = months[m[2].toLowerCase()] || '01';
  return `${m[3]}-${month}-${day}T09:00:00.000Z`;
}

async function uploadImageFromUrl(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement image échoué: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload('image', buffer, { filename });
  return { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: asset._id } };
}

async function run() {
  console.log(`\n🚀 Migration vers projet ${projectId} / dataset ${dataset}\n`);

  // 1. Auteurs uniques
  const authors = new Map<string, { name: string; role: string; image: string }>();
  const categories = new Set<string>();
  for (const p of BLOG_POSTS) {
    authors.set(p.author, { name: p.author, role: p.authorRole, image: p.authorImage });
    categories.add(p.category);
  }

  const authorIds = new Map<string, string>();
  for (const [name, a] of authors) {
    const _id = `author-${slugify(name)}`;
    console.log(`👤 Auteur : ${name}`);
    let image;
    try { image = await uploadImageFromUrl(a.image, `${slugify(name)}.jpg`); } catch { image = undefined; }
    await client.createOrReplace({
      _id, _type: 'author', name: a.name, role: a.role,
      slug: { _type: 'slug', current: slugify(name) }, image,
    });
    authorIds.set(name, _id);
  }

  // 2. Catégories
  const categoryIds = new Map<string, string>();
  for (const c of categories) {
    const _id = `category-${slugify(c)}`;
    console.log(`🏷️  Catégorie : ${c}`);
    await client.createOrReplace({
      _id, _type: 'category', title: c, slug: { _type: 'slug', current: slugify(c) },
    });
    categoryIds.set(c, _id);
  }

  // 3. Articles
  for (const p of BLOG_POSTS) {
    console.log(`📝 Article : ${p.title}`);
    const blocks = htmlToBlocks(p.content, blockContentType, {
      parseHtml: (html) => new JSDOM(html).window.document,
    });
    let mainImage;
    try { mainImage = await uploadImageFromUrl(p.image, `${p.id}.jpg`); } catch { mainImage = undefined; }

    await client.createOrReplace({
      _id: `post-${p.id}`,
      _type: 'post',
      title: p.title,
      slug: { _type: 'slug', current: p.id },
      excerpt: p.excerpt,
      publishedAt: frDateToISO(p.date),
      mainImage,
      category: { _type: 'reference', _ref: categoryIds.get(p.category)! },
      author: { _type: 'reference', _ref: authorIds.get(p.author)! },
      body: blocks,
    });
  }

  console.log('\n✅ Migration terminée ! Va voir le résultat sur /studio et /blog\n');
}

run().catch((e) => { console.error(e); process.exit(1); });
