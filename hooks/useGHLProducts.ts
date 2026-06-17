/**
 * Hook React — charge les produits depuis WooCommerce REST API v3
 */

import { useState, useEffect } from 'react';
import { fetchWCProducts, fetchWCVariations, WCProduct, WCVariation } from '../services/wooApi';
import { GHLProduct, ProductVariation } from '../data/ghlProducts';
import { SHOP_CATEGORY_RULES, SHOP_DEFAULT_CATEGORY, ShopCategory } from '../constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Balises conservées pour un rendu formaté ; tout le reste est « déballé » (on garde le texte).
const ALLOWED_TAGS = new Set([
  'H3', 'H4', 'P', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'A', 'BR', 'HR',
]);

/**
 * Assainit le HTML de description WooCommerce : on ne garde qu'un sous-ensemble de balises
 * sûres, on retire tous les attributs (classes, data-*, rôles…) sauf href/title sur <a>, et
 * on supprime script/style. Côté serveur (pas de DOM) → repli sur le texte brut.
 */
function sanitizeDescriptionHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return `<p>${stripHtml(html)}</p>`;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType !== 1) continue;
      const el = child as HTMLElement;
      walk(el);
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') { el.remove(); continue; }
      if (!ALLOWED_TAGS.has(el.tagName)) { el.replaceWith(...[...el.childNodes]); continue; }
      for (const attr of [...el.attributes]) {
        if (el.tagName === 'A' && (attr.name === 'href' || attr.name === 'title')) continue;
        el.removeAttribute(attr.name);
      }
      if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }
  };
  walk(doc.body);
  // On retire les <hr> en tête/queue (souvent un séparateur résiduel WooCommerce).
  return doc.body.innerHTML.replace(/^(\s*<hr>\s*)+/i, '').replace(/(\s*<hr>\s*)+$/i, '').trim();
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** Range un produit dans une des 5 catégories boutique selon ses tags WooCommerce. */
function resolveCategory(p: WCProduct): ShopCategory {
  const tags = new Set((p.categories ?? []).map((c) => normalize(c.name)));
  for (const rule of SHOP_CATEGORY_RULES) {
    if (rule.wcTags.some((t) => tags.has(normalize(t)))) return rule.category;
  }
  return SHOP_DEFAULT_CATEGORY;
}

/** Nom de l'attribut qui porte les variantes (ex. "Saveurs"), s'il existe. */
function variationAttrName(p: WCProduct): string | undefined {
  return (p.attributes ?? []).find((a) => a.variation)?.name;
}

function mapVariation(v: WCVariation): ProductVariation {
  return {
    id: v.id,
    label: (v.attributes ?? []).map((a) => a.option).filter(Boolean).join(' · '),
    price: parseFloat(v.price || '0').toFixed(2),
    image: v.image?.src,
    inStock: v.stock_status !== 'outofstock',
  };
}

function mapWCProduct(p: WCProduct, variations?: WCVariation[]): GHLProduct {
  const price = p.price || p.regular_price || '0.00';
  const images = (p.images ?? []).map((i) => i.src).filter(Boolean);
  const category = resolveCategory(p);
  const rawDescription = p.description || p.short_description || '';
  const description = stripHtml(rawDescription);
  const descriptionHtml = sanitizeDescriptionHtml(rawDescription);

  // On ne garde que les variantes réelles (libellé non vide) — WooCommerce expose parfois
  // une variation « fourre-tout » sans attribut qu'il ne faut pas proposer.
  const mappedVariations = (variations ?? [])
    .map(mapVariation)
    .filter((v) => v.label.length > 0);

  return {
    id: String(p.id),
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGHLProducts() {
  const [products, setProducts] = useState<GHLProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWCProducts()
      .then(async (raw) => {
        const visible = raw.filter((p) => p.catalog_visibility !== 'hidden');

        // Pour chaque produit variable, on charge ses variantes en parallèle.
        // Si l'appel échoue, on retombe sur un produit simple (pas de blocage de la boutique).
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

        const mapped = visible.map((p) => mapWCProduct(p, variationsById.get(p.id)));
        setProducts(mapped);
        setError(null);
      })
      .catch((err: Error) => {
        console.error('Erreur chargement boutique WooCommerce:', err);
        setError('Impossible de charger les produits. Vérifiez votre connexion et réessayez.');
      })
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
