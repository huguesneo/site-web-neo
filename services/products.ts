/**
 * Module SERVEUR — charge et mappe les produits WooCommerce.
 *
 * ⚠️ Server-only : les clés WooCommerce (consumer_key / consumer_secret) ne
 * doivent JAMAIS atteindre le navigateur. Ce fichier est importé uniquement
 * depuis des Server Components et des routes API. Le `import 'server-only'`
 * fait échouer le build si un composant client l'importe par erreur.
 *
 * Avantages vs l'ancien fetch côté client :
 *   • Sécurité : la clé secrète reste sur le serveur (plus exposée dans le JS).
 *   • SEO : le HTML de la boutique arrive pré-rempli → Google indexe les produits.
 *   • Vitesse : résultat mis en cache (revalidate) → on ne tape plus WooCommerce
 *     à chaque visite.
 */
import 'server-only';
import { GHLProduct, ProductVariation } from '../data/ghlProducts';
import { SHOP_CATEGORY_RULES, SHOP_DEFAULT_CATEGORY, ShopCategory } from '../constants';

// ─── Config / env (NON public) ────────────────────────────────────────────────

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

// Durée de cache des produits (secondes). 10 min : la boutique change rarement,
// mais reste fraîche sans intervention.
const PRODUCTS_TTL = 600;

// ─── Types WooCommerce ──────────────────────────────────────────────────────────

interface WCProduct {
  id: number;
  name: string;
  type: string;
  price: string;
  regular_price: string;
  sale_price: string;
  permalink: string;
  description: string;
  short_description: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ src: string; alt: string }>;
  attributes: Array<{ id: number; name: string; variation: boolean; options: string[] }>;
  status: string;
  catalog_visibility: string;
}

interface WCVariation {
  id: number;
  price: string;
  attributes: Array<{ name: string; option: string }>;
  image?: { src: string; alt: string };
  stock_status: string;
}

// ─── Fetch bas niveau ───────────────────────────────────────────────────────────

function wcUrl(path: string, params: Record<string, string> = {}): string {
  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    throw new Error('Variables WooCommerce manquantes (WC_URL, WC_KEY, WC_SECRET). Configurez-les dans Netlify → Environment variables.');
  }
  const url = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  url.searchParams.set('consumer_key', WC_KEY);
  url.searchParams.set('consumer_secret', WC_SECRET);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

// Le cache repose sur le Data Cache de Next.js (`next.revalidate`) : la réponse
// WooCommerce est conservée PRODUCTS_TTL secondes, partagée entre toutes les
// requêtes. La page boutique et la route /api/products portent aussi
// `revalidate = 600`, donc le HTML rendu est lui-même mis en cache.
async function fetchWCProducts(): Promise<WCProduct[]> {
  const res = await fetch(wcUrl('/products', { per_page: '100', status: 'publish' }), {
    next: { revalidate: PRODUCTS_TTL },
  });
  if (!res.ok) throw new Error(`WooCommerce produits: ${res.status}`);
  return res.json();
}

async function fetchWCVariations(productId: number): Promise<WCVariation[]> {
  const res = await fetch(wcUrl(`/products/${productId}/variations`, { per_page: '100' }), {
    next: { revalidate: PRODUCTS_TTL },
  });
  if (!res.ok) throw new Error(`WooCommerce variations ${productId}: ${res.status}`);
  return res.json();
}

// ─── Helpers de mappage ─────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Balises conservées pour un rendu formaté ; tout le reste est « déballé ».
const ALLOWED_TAGS = new Set([
  'H3', 'H4', 'P', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'A', 'BR', 'HR',
]);

/**
 * Assainit le HTML de description WooCommerce, côté serveur, SANS dépendance
 * lourde (jsdom plantait dans le runtime serverless de Netlify → 500). Ne garde
 * qu'un sous-ensemble de balises sûres, retire tous les attributs (sauf
 * href/title sur <a>), supprime script/style et commentaires. Le contenu vient
 * de notre propre WooCommerce (de confiance), pas d'entrées utilisateur.
 */
function sanitizeDescriptionHtml(html: string): string {
  if (!html) return '';
  // 1) Retire entièrement les blocs script/style (balise + contenu) et les commentaires.
  let out = html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // 2) Traite chaque balise : garde les balises autorisées (attributs retirés,
  //    sauf href/title sur <a>), « déballe » les autres en conservant leur texte.
  const unquote = (v: string) => v.replace(/^['"]|['"]$/g, '');
  out = out.replace(
    /<(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_m: string, slash: string, tag: string, attrs: string) => {
      const TAG = tag.toUpperCase();
      if (!ALLOWED_TAGS.has(TAG)) return '';            // déballe : texte conservé
      if (slash) return `</${tag.toLowerCase()}>`;
      if (TAG === 'A') {
        const href = attrs.match(/\bhref\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
        const title = attrs.match(/\btitle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
        let a = '<a';
        if (href) a += ` href="${unquote(href[1])}"`;
        if (title) a += ` title="${unquote(title[1])}"`;
        return a + ' target="_blank" rel="noopener noreferrer">';
      }
      return `<${tag.toLowerCase()}>`;                  // autres balises : attributs retirés
    }
  );

  // 3) Retire les <hr> en tête/queue (comme l'ancien rendu).
  return out.replace(/^(\s*<hr>\s*)+/i, '').replace(/(\s*<hr>\s*)+$/i, '').trim();
}

// Les médias WooCommerce (images produits) sont servis par WordPress (WP Engine),
// accessible via wp.neoperformance.ca. Mais l'API renvoie des URLs codées en dur sur
// www.neoperformance.ca : depuis la migration DNS, ce host pointe vers ce site Next
// (Netlify) et ne sert donc plus les fichiers /wp-content/ → images cassées. On
// réécrit l'hôte des médias vers wp.neoperformance.ca, qui sert toujours WordPress.
const WP_MEDIA_HOST = 'wp.neoperformance.ca';
function rewriteMediaHost(src: string): string {
  return src.replace(
    /^(https?:\/\/)(?:www\.)?neoperformance\.ca\//i,
    `$1${WP_MEDIA_HOST}/`
  );
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Slug « propre » pour les URLs (repli si le permalink WooCommerce est inexploitable).
function slugify(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Le slug canonique d'un produit = dernier segment du permalink WooCommerce
// (ex. https://.../produit/proteine-atp/ → "proteine-atp"). On conserve ainsi
// l'URL que WooCommerce a déjà générée ; repli sur le nom si besoin.
function slugFromPermalink(permalink: string, fallbackName: string): string {
  try {
    const segments = new URL(permalink).pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) return decodeURIComponent(last);
  } catch {
    /* permalink absent/malformé → repli */
  }
  return slugify(fallbackName);
}

function resolveCategory(p: WCProduct): ShopCategory {
  const tags = new Set((p.categories ?? []).map((c) => normalize(c.name)));
  for (const rule of SHOP_CATEGORY_RULES) {
    if (rule.wcTags.some((t) => tags.has(normalize(t)))) return rule.category;
  }
  return SHOP_DEFAULT_CATEGORY;
}

function variationAttrName(p: WCProduct): string | undefined {
  return (p.attributes ?? []).find((a) => a.variation)?.name;
}

function mapVariation(v: WCVariation): ProductVariation {
  return {
    id: v.id,
    label: (v.attributes ?? []).map((a) => a.option).filter(Boolean).join(' · '),
    price: parseFloat(v.price || '0').toFixed(2),
    image: v.image?.src ? rewriteMediaHost(v.image.src) : undefined,
    inStock: v.stock_status !== 'outofstock',
  };
}

function mapWCProduct(p: WCProduct, variations?: WCVariation[]): GHLProduct {
  const price = p.price || p.regular_price || '0.00';
  const images = (p.images ?? []).map((i) => rewriteMediaHost(i.src)).filter(Boolean);
  const category = resolveCategory(p);
  const rawDescription = p.description || p.short_description || '';
  const description = stripHtml(rawDescription);
  const descriptionHtml = sanitizeDescriptionHtml(rawDescription);

  const mappedVariations = (variations ?? [])
    .map(mapVariation)
    .filter((v) => v.label.length > 0);

  return {
    id: String(p.id),
    slug: slugFromPermalink(p.permalink, p.name),
    name: p.name,
    category,
    price: parseFloat(price).toFixed(2),
    image: images[0] ?? '',
    images: images.length ? images : [''],
    checkoutUrl: p.permalink,
    description,
    descriptionHtml,
    variationLabel: mappedVariations.length ? variationAttrName(p) : undefined,
    variations: mappedVariations.length ? mappedVariations : undefined,
  };
}

// ─── API publique (serveur) ──────────────────────────────────────────────────────

/**
 * Produits de la boutique, mappés et prêts à l'affichage. Le cache est assuré
 * par `next.revalidate` sur les fetches WooCommerce. Renvoie [] en cas d'erreur :
 * la page se rend quand même, le client peut réessayer.
 */
export async function getShopProducts(): Promise<GHLProduct[]> {
  try {
    return await loadShopProducts();
  } catch (err) {
    console.error('Erreur chargement boutique WooCommerce (serveur):', err);
    return [];
  }
}

/**
 * Un produit par son slug d'URL, pour la page dédiée /boutique/[slug].
 * S'appuie sur le même cache que la grille (getShopProducts). Renvoie null si
 * introuvable → la page rend un 404.
 */
export async function getProductBySlug(slug: string): Promise<GHLProduct | null> {
  const products = await getShopProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

async function loadShopProducts(): Promise<GHLProduct[]> {
  const raw = await fetchWCProducts();
  const visible = raw.filter((p) => p.catalog_visibility !== 'hidden');

  const isVariable = (p: WCProduct) =>
    (p.attributes ?? []).some((a) => a.variation) || p.type !== 'simple';

  const variationsById = new Map<number, WCVariation[]>();
  await Promise.all(
    visible.filter(isVariable).map(async (p) => {
      try {
        variationsById.set(p.id, await fetchWCVariations(p.id));
      } catch (e) {
        console.warn(`Variations indisponibles pour #${p.id} (${p.name})`, e);
      }
    })
  );

  return visible.map((p) => mapWCProduct(p, variationsById.get(p.id)));
}
