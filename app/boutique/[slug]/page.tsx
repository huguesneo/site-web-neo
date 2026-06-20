import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from '@/components/ProductDetail';
import { getShopProducts, getProductBySlug } from '@/services/products';
import { NEO_ACCOMPANIMENT_CATEGORY } from '@/constants';

// Même cache que la grille boutique (10 min). `dynamicParams` reste activé par
// défaut : un produit ajouté dans WooCommerce après le build obtient sa page au
// premier accès (ISR), sans redéploiement.
export const revalidate = 600;

const BASE = 'https://www.neoperformance.ca';

// Coupe une description à ~155 caractères sur une frontière de mot (meta description).
function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, '').trim() + '…';
}

export async function generateStaticParams() {
  const products = await getShopProducts();
  // Les produits « Accompagnement NEO » (réservés aux clients) ne sont pas
  // pré-générés ni indexés ; leur page reste accessible par lien direct (ISR).
  return products
    .filter((p) => p.category !== NEO_ACCOMPANIMENT_CATEGORY)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Produit non trouvé | NEO Performance' };

  // Le layout applique le gabarit « %s | NEO Performance » → on n'ajoute que le contexte boutique.
  const title = `${product.name} | Boutique`;
  const description = product.description
    ? truncate(product.description)
    : `${product.name} — supplément de qualité clinique sélectionné par nos naturopathes. Livraison 24-48h partout au Québec.`;
  const url = `${BASE}/boutique/${product.slug}`;
  // Produits « Accompagnement NEO » : page accessible par lien direct mais retirée
  // de l'index Google (cohérent avec leur masquage dans la grille boutique).
  const isClientOnly = product.category === NEO_ACCOMPANIMENT_CATEGORY;

  return {
    title,
    description,
    robots: isClientOnly ? { index: false, follow: true } : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'NEO Performance',
      locale: 'fr_CA',
      type: 'website',
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const url = `${BASE}/boutique/${product.slug}`;
  const variationPrices = (product.variations ?? []).map((v) => parseFloat(v.price)).filter((n) => n > 0);

  // Données structurées Product : permettent à Google d'afficher prix, image et
  // disponibilité directement dans les résultats de recherche (rich results).
  const offers = variationPrices.length
    ? {
        '@type': 'AggregateOffer',
        priceCurrency: 'CAD',
        lowPrice: Math.min(...variationPrices).toFixed(2),
        highPrice: Math.max(...variationPrices).toFixed(2),
        offerCount: variationPrices.length,
        availability: 'https://schema.org/InStock',
        url,
      }
    : {
        '@type': 'Offer',
        priceCurrency: 'CAD',
        price: parseFloat(product.price).toFixed(2),
        availability: 'https://schema.org/InStock',
        url,
      };

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.filter(Boolean),
    description: product.description || product.name,
    category: product.category,
    brand: { '@type': 'Brand', name: 'NEO Performance' },
    offers,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Boutique', item: `${BASE}/boutique` },
      { '@type': 'ListItem', position: 3, name: product.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductDetail product={product} />
    </>
  );
}
