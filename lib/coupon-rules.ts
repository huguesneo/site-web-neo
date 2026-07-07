/**
 * Moteur de règles des codes promo — SERVEUR SEULEMENT (utilise les clés WooCommerce).
 *
 * Reproduit fidèlement les règles configurées sur chaque coupon dans WooCommerce,
 * car l'API REST ne les applique que partiellement pour les commandes créées par
 * le site (contrairement au checkout WordPress classique) :
 *   - expiration, limite d'utilisation globale ;
 *   - limite « par personne » (par courriel + compte WooCommerce lié) ;
 *   - montant minimum / maximum du panier ;
 *   - produits / catégories permis et exclus ;
 *   - exclusion des produits en solde ;
 *   - restriction par courriel (email_restrictions) ;
 *   - livraison gratuite (free_shipping) ;
 *   - types de rabais pris en charge : percent, fixed_cart, fixed_product
 *     (les coupons BOGO gérés par plugin ne fonctionnent pas hors WordPress → refusés).
 *
 * Le rabais est calculé sur les seuls articles ADMISSIBLES, comme le fait WooCommerce
 * au moment de recalculer la commande — l'affichage du panier et le total encaissé
 * restent donc toujours identiques.
 */

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

function wc(path: string): string {
  const u = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  u.searchParams.set('consumer_key', WC_KEY as string);
  u.searchParams.set('consumer_secret', WC_SECRET as string);
  return u.toString();
}

export interface WCCoupon {
  id: number;
  code: string;
  discount_type: string;
  amount: string;
  date_expires?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  usage_limit_per_user?: number | null;
  used_by?: Array<string | number>;
  individual_use?: boolean;
  exclude_sale_items?: boolean;
  minimum_amount?: string;
  maximum_amount?: string;
  product_ids?: number[];
  excluded_product_ids?: number[];
  product_categories?: number[];
  excluded_product_categories?: number[];
  email_restrictions?: string[];
  free_shipping?: boolean;
}

export interface CartLineIn {
  product_id: number;
  variation_id?: number;
  quantity: number;
}

/** Ligne de panier enrichie des VRAIES données produit lues côté serveur. */
export interface PricedLine {
  product_id: number;
  variation_id?: number;
  quantity: number;
  unitPrice: number;
  onSale: boolean;
  categoryIds: number[];
}

export interface CouponEvaluation {
  /** Message d'erreur en français, affichable tel quel au client (null si valide). */
  error: string | null;
  /** Rabais en dollars sur les articles admissibles. */
  discount: number;
  /** Clés `${product_id}:${variation_id ?? 0}` des lignes admissibles au rabais. */
  eligibleLineKeys: string[];
  freeShipping: boolean;
  individualUse: boolean;
}

export function lineKey(l: { product_id: number; variation_id?: number }): string {
  return `${l.product_id}:${l.variation_id ?? 0}`;
}

const SUPPORTED_TYPES = new Set(['percent', 'fixed_cart', 'fixed_product']);

/** Récupère un coupon par code. null = introuvable ; undefined = échec réseau. */
export async function fetchCouponByCode(code: string): Promise<WCCoupon | null | undefined> {
  try {
    const res = await fetch(wc(`/coupons?code=${encodeURIComponent(code.trim())}`), { cache: 'no-store' });
    if (!res.ok) return undefined;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[0] as WCCoupon;
  } catch {
    return undefined;
  }
}

/**
 * Enrichit les lignes du panier avec les VRAIS prix / statut solde / catégories,
 * lus depuis WooCommerce (jamais depuis le navigateur). Retourne null si les
 * données ne peuvent pas être obtenues de façon fiable.
 */
export async function priceCartLines(lines: CartLineIn[]): Promise<PricedLine[] | null> {
  try {
    const productIds = [...new Set(lines.map((l) => l.product_id))];
    const res = await fetch(wc(`/products?include=${productIds.join(',')}&per_page=100`), { cache: 'no-store' });
    if (!res.ok) return null;
    const products: Array<{
      id: number;
      price: string;
      on_sale: boolean;
      categories?: Array<{ id: number }>;
    }> = await res.json();
    const byId = new Map(products.map((p) => [p.id, p]));

    // Variantes : prix et statut solde propres à chaque variante.
    const variationProductIds = [...new Set(lines.filter((l) => l.variation_id).map((l) => l.product_id))];
    const variationsByProduct = new Map<number, Map<number, { price: string; on_sale: boolean }>>();
    await Promise.all(
      variationProductIds.map(async (pid) => {
        const r = await fetch(wc(`/products/${pid}/variations?per_page=100`), { cache: 'no-store' });
        if (!r.ok) return;
        const vars: Array<{ id: number; price: string; on_sale: boolean }> = await r.json();
        variationsByProduct.set(pid, new Map(vars.map((v) => [v.id, { price: v.price, on_sale: v.on_sale }])));
      }),
    );

    const out: PricedLine[] = [];
    for (const l of lines) {
      const p = byId.get(l.product_id);
      if (!p) return null; // produit inconnu → on ne devine pas
      const v = l.variation_id ? variationsByProduct.get(l.product_id)?.get(l.variation_id) : undefined;
      if (l.variation_id && !v) return null;
      out.push({
        product_id: l.product_id,
        variation_id: l.variation_id,
        quantity: Math.max(1, l.quantity || 1),
        unitPrice: parseFloat((v ?? p).price) || 0,
        onSale: (v ?? p).on_sale === true,
        categoryIds: (p.categories ?? []).map((c) => c.id),
      });
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Applique TOUTES les règles du coupon au panier (logique pure, sans réseau).
 * Ne couvre pas les limites d'usage par personne ni la restriction courriel —
 * voir perUserLimitReached() et emailAllowed(), qui demandent le courriel.
 */
export function evaluateCoupon(coupon: WCCoupon, lines: PricedLine[]): CouponEvaluation {
  const fail = (error: string): CouponEvaluation =>
    ({ error, discount: 0, eligibleLineKeys: [], freeShipping: false, individualUse: coupon.individual_use === true });

  if (!SUPPORTED_TYPES.has(coupon.discount_type)) {
    // Types gérés par des plugins WordPress (ex. BOGO « 2 pour 1 ») : leur logique
    // n'existe pas hors du checkout WordPress — on refuse plutôt que d'appliquer 0 $.
    return fail('Ce code promo n’est pas utilisable sur la boutique en ligne. Contactez-nous pour en profiter.');
  }
  if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
    return fail('Ce code promo est expiré.');
  }
  if (coupon.usage_limit && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
    return fail('Ce code promo a atteint sa limite d’utilisation.');
  }

  // Montant minimum / maximum : comparés au sous-total du panier, comme WooCommerce.
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const min = parseFloat(coupon.minimum_amount || '0');
  const max = parseFloat(coupon.maximum_amount || '0');
  if (min > 0 && subtotal < min) {
    return fail(`Le montant minimum du panier pour ce code est de ${min.toFixed(2)} $.`);
  }
  if (max > 0 && subtotal > max) {
    return fail(`Le montant maximum du panier pour ce code est de ${max.toFixed(2)} $.`);
  }

  // Admissibilité ligne par ligne (produits / catégories permis et exclus, soldes).
  const allowedProducts = new Set((coupon.product_ids ?? []).map(Number));
  const excludedProducts = new Set((coupon.excluded_product_ids ?? []).map(Number));
  const allowedCats = new Set((coupon.product_categories ?? []).map(Number));
  const excludedCats = new Set((coupon.excluded_product_categories ?? []).map(Number));

  const eligible = lines.filter((l) => {
    const ids = [l.product_id, ...(l.variation_id ? [l.variation_id] : [])];
    if (allowedProducts.size > 0 || allowedCats.size > 0) {
      const inProducts = ids.some((id) => allowedProducts.has(id));
      const inCats = l.categoryIds.some((c) => allowedCats.has(c));
      if (!inProducts && !inCats) return false;
    }
    if (ids.some((id) => excludedProducts.has(id))) return false;
    if (l.categoryIds.some((c) => excludedCats.has(c))) return false;
    if (coupon.exclude_sale_items === true && l.onSale) return false;
    return true;
  });

  if (eligible.length === 0) {
    return fail('Ce code promo ne s’applique à aucun produit de votre panier.');
  }

  const eligibleSubtotal = eligible.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const amount = parseFloat(coupon.amount) || 0;
  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = eligibleSubtotal * (amount / 100);
  } else if (coupon.discount_type === 'fixed_cart') {
    discount = Math.min(amount, eligibleSubtotal);
  } else {
    // fixed_product : montant fixe par unité admissible.
    const qty = eligible.reduce((s, l) => s + l.quantity, 0);
    discount = Math.min(amount * qty, eligibleSubtotal);
  }

  return {
    error: null,
    discount,
    eligibleLineKeys: eligible.map(lineKey),
    freeShipping: coupon.free_shipping === true,
    individualUse: coupon.individual_use === true,
  };
}

/** Restriction courriel du coupon (emails exacts ou motifs avec « * »). */
export function emailAllowed(coupon: WCCoupon, email: string): boolean {
  const restrictions = coupon.email_restrictions ?? [];
  if (restrictions.length === 0) return true;
  const e = email.trim().toLowerCase();
  return restrictions.some((r) => {
    const pattern = String(r).trim().toLowerCase();
    if (!pattern.includes('*')) return pattern === e;
    const rx = new RegExp(`^${pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
    return rx.test(e);
  });
}

/**
 * Limite « X par personne » : compte les utilisations liées à ce courriel dans
 * used_by. Les usages des clients qui ont un COMPTE WooCommerce y sont inscrits
 * sous leur ID de compte, pas leur courriel — WooCommerce ne fait pas ce
 * rapprochement pour les commandes créées via l'API (customer_id 0) ; c'est le
 * trou qui permettait de réutiliser les codes. On résout donc aussi le compte.
 * À appeler APRÈS releaseUnpaidCouponHolds (tentatives impayées déjà décomptées).
 */
export async function perUserLimitReached(coupon: WCCoupon, billingEmail: string): Promise<boolean> {
  const perUser = coupon.usage_limit_per_user ?? 0;
  const email = billingEmail.trim().toLowerCase();
  if (perUser <= 0 || !email) return false;
  const usedBy = (coupon.used_by ?? []).map((u) => String(u).toLowerCase());
  let uses = usedBy.filter((u) => u === email).length;
  try {
    const cres = await fetch(wc(`/customers?email=${encodeURIComponent(email)}`), { cache: 'no-store' });
    if (cres.ok) {
      const customers: Array<{ id: number }> = await cres.json();
      for (const cust of Array.isArray(customers) ? customers : []) {
        uses += usedBy.filter((u) => u === String(cust.id)).length;
      }
    }
  } catch { /* fail-open sur ce sous-contrôle */ }
  return uses >= perUser;
}

/**
 * Libère les utilisations « fantômes » du code promo : WooCommerce inscrit l'usage
 * dès la CRÉATION de la commande (statut pending), avant paiement. Une tentative
 * échouée ou abandonnée (carte refusée, page fermée…) laisse donc une commande
 * impayée qui retient le code et bloquerait le client à sa prochaine tentative.
 * On annule les commandes PENDING de ce courriel, créées par le site, qui portent
 * ce code — l'annulation décrémente le compteur côté WooCommerce.
 */
export async function releaseUnpaidCouponHolds(code: string, billingEmail: string): Promise<number> {
  const email = billingEmail.trim().toLowerCase();
  if (!email) return 0;
  try {
    const res = await fetch(wc('/orders?status=pending&per_page=100'), { cache: 'no-store' });
    if (!res.ok) return 0;
    const orders: Array<{
      id: number;
      created_via?: string;
      billing?: { email?: string };
      coupon_lines?: Array<{ code?: string }>;
    }> = await res.json();
    const codeLc = code.trim().toLowerCase();
    const holds = (Array.isArray(orders) ? orders : []).filter((o) =>
      o.created_via === 'rest-api' &&
      (o.billing?.email ?? '').toLowerCase() === email &&
      (o.coupon_lines ?? []).some((cl) => (cl.code ?? '').toLowerCase() === codeLc),
    );
    let released = 0;
    for (const o of holds) {
      const r = await fetch(wc(`/orders/${o.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (r.ok) released++;
    }
    return released;
  } catch {
    return 0;
  }
}
