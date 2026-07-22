import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isClientDiscountEligible, GIFT_CARD_PRODUCT_ID, giftCardClientDiscount, giftCardFaceValue, shippingFeeFor, SHIPPING_LABEL, NEO_ACCOMPANIMENT_WC_CATEGORY_ID } from '../../../../constants';
import { fetchCouponByCode, priceCartLines, evaluateCoupon, emailAllowed, perUserLimitReached, releaseUnpaidCouponHolds } from '../../../../lib/coupon-rules';
import { normalizeGiftCardNumber, fetchGiftCardByNumber, isExpired, GC_META_NUMBER, GC_META_ID, GC_META_AMOUNT } from '../../../../lib/gift-card';

/**
 * Route serveur — crée la commande WooCommerce de façon SÛRE.
 *
 * Principe : le navigateur n'envoie QUE la liste des produits (product_id +
 * quantité) et son jeton de session. Le serveur :
 *   1. vérifie le jeton Supabase (→ est-ce un vrai client connecté ?),
 *   2. applique le coupon promo éventuel + le rabais client (-13 %) si la
 *      session est valide,
 *   3. laisse WooCommerce recalculer le total à partir des VRAIS prix + taxes.
 *
 * Aucun montant ne vient du navigateur : il ne peut donc pas être trafiqué.
 */

export const runtime = 'nodejs';

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

// Coupon WooCommerce qui porte le rabais client (-13 %). Le code est
// volontairement non devinable et n'est JAMAIS envoyé au navigateur :
// seul le serveur l'applique, après vérification de la session Supabase.
const CLIENT_COUPON_CODE = process.env.WC_CLIENT_COUPON_CODE || 'neo-client-auto-13';
const CLIENT_COUPON_PERCENT = '13';

// Le rabais -13 % ne s'applique QU'AUX produits Designs for Health. Le coupon WooCommerce
// est donc restreint via `product_ids` à la liste de ces produits (recalculée à chaque
// commande pour rester à jour). Si le panier ne contient AUCUN produit admissible, on
// n'ajoute pas le coupon (sinon WooCommerce le rejette → commande échouée).

interface LineItemIn { product_id: number | string; variation_id?: number | string; quantity: number; }
interface Body {
  items: LineItemIn[];
  billing: Record<string, string>;
  shipping: Record<string, string>;
  customer_note?: string;
  couponCode?: string | null;
  giftCardNumber?: string | null;
  accessToken?: string | null;
}

function wc(path: string): string {
  const u = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  u.searchParams.set('consumer_key', WC_KEY as string);
  u.searchParams.set('consumer_secret', WC_SECRET as string);
  return u.toString();
}

/** Vérifie le jeton Supabase. Retourne true uniquement pour un vrai client connecté. */
async function verifyIsClient(accessToken?: string | null): Promise<boolean> {
  if (!accessToken) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;
  try {
    const sb = createClient(url, anon);
    const { data, error } = await sb.auth.getUser(accessToken);
    return !error && !!data?.user;
  } catch {
    return false;
  }
}

/**
 * Récupère les IDs de TOUS les produits admissibles au rabais (marque Designs for Health).
 * Sert à restreindre le coupon (`product_ids`) et à vérifier l'éligibilité du panier.
 * Retourne null en cas d'échec (→ on laisse WooCommerce trancher, sans casser la commande).
 */
async function fetchDfhProductIds(): Promise<Set<number> | null> {
  try {
    const ids = new Set<number>();
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(wc(`/products?per_page=100&status=publish&page=${page}`));
      if (!res.ok) return ids.size ? ids : null;
      const batch: Array<{ id: number; name: string }> = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const p of batch) if (isClientDiscountEligible(p.name)) ids.add(p.id);
      if (batch.length < 100) break;
    }
    return ids;
  } catch {
    return null;
  }
}

/**
 * S'assure que le coupon client existe (le crée au besoin) ET qu'il est restreint aux
 * produits Designs for Health via `product_ids`. Auto-réparation à chaque commande.
 */
async function ensureClientCoupon(dfhIds: Set<number>): Promise<boolean> {
  const product_ids = [...dfhIds];
  try {
    const res = await fetch(wc(`/coupons?code=${encodeURIComponent(CLIENT_COUPON_CODE)}`));
    if (res.ok) {
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length > 0) {
        const existing = arr[0];
        await fetch(wc(`/coupons/${existing.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_ids, excluded_product_categories: [] }),
        });
        return true;
      }
    }
    const create = await fetch(wc('/coupons'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: CLIENT_COUPON_CODE,
        discount_type: 'percent',
        amount: CLIENT_COUPON_PERCENT,
        individual_use: false,
        product_ids,
        description: 'Rabais client automatique NEO — Designs for Health uniquement (appliqué côté serveur, ne pas diffuser).',
      }),
    });
    return create.ok;
  } catch {
    return false;
  }
}

/**
 * Rabais client carte-cadeau (clients seulement) : somme des rabais FIXES selon le montant
 * de chaque variante achetée. Lit les VRAIS prix des variantes côté serveur (jamais ceux du
 * client) pour décider du rabais. Retourne 0 si rien d'applicable.
 */
async function giftCardClientDiscountTotal(
  giftLines: Array<{ variation_id?: number; quantity: number }>,
): Promise<number> {
  if (giftLines.length === 0) return 0;
  try {
    const res = await fetch(wc(`/products/${GIFT_CARD_PRODUCT_ID}/variations?per_page=100`));
    if (!res.ok) return 0;
    const variations: Array<{ id: number; attributes?: Array<{ option: string }> }> = await res.json();
    // Valeur faciale lue depuis le libellé de la variante (ex. "360 $" → 360), comme côté client.
    const faceById = new Map(
      variations.map((v) => [v.id, giftCardFaceValue((v.attributes ?? []).map((a) => a.option).join(' '))]),
    );
    let total = 0;
    for (const gl of giftLines) {
      if (!gl.variation_id) continue;
      const face = faceById.get(gl.variation_id);
      if (face === undefined) continue;
      total += giftCardClientDiscount(String(GIFT_CARD_PRODUCT_ID), face) * gl.quantity;
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * IDs des produits NUMÉRIQUES à exclure du calcul des frais de livraison : la carte-cadeau
 * (#5531) + tous les produits de la catégorie « Accompagnement NEO » (suivis / NEOflow).
 * Ces produits ne génèrent pas de frais et ne comptent pas dans le seuil de livraison
 * gratuite. Renvoie au moins la carte-cadeau, même si l'appel catégorie échoue.
 */
async function fetchDigitalProductIds(): Promise<Set<number>> {
  const ids = new Set<number>([GIFT_CARD_PRODUCT_ID]);
  try {
    const res = await fetch(wc(`/products?per_page=100&status=publish&category=${NEO_ACCOMPANIMENT_WC_CATEGORY_ID}`));
    if (res.ok) {
      const batch: Array<{ id: number }> = await res.json();
      if (Array.isArray(batch)) for (const p of batch) ids.add(p.id);
    }
  } catch { /* on conserve au moins la carte-cadeau */ }
  return ids;
}

/**
 * Filet de sécurité : revérifie le stock RÉEL côté WooCommerce juste avant la commande.
 * Le catalogue affiché est mis en cache (~10 min) ; un article a pu passer en rupture
 * entre-temps. On lit le statut actuel et on renvoie les NOMS des articles épuisés.
 * Seul 'outofstock' bloque (un 'onbackorder' / réappro reste commandable). Fail-open :
 * en cas d'échec d'appel, on renvoie [] et on laisse WooCommerce trancher au moment de
 * la création — on ne casse jamais une commande à cause d'un check qui échoue.
 */
async function findOutOfStockNames(
  lineItems: Array<{ product_id: number; variation_id?: number }>,
): Promise<string[]> {
  try {
    const productIds = [...new Set(lineItems.map((i) => i.product_id))];
    const res = await fetch(wc(`/products?include=${productIds.join(',')}&per_page=100`));
    if (!res.ok) return [];
    const products: Array<{ id: number; name: string; stock_status: string }> = await res.json();
    const byId = new Map(products.map((p) => [p.id, p]));

    // Variantes : on charge les variantes des produits concernés pour lire leur statut propre.
    const variationProductIds = [...new Set(lineItems.filter((i) => i.variation_id).map((i) => i.product_id))];
    const variationsByProduct = new Map<number, Array<{ id: number; stock_status: string }>>();
    await Promise.all(
      variationProductIds.map(async (pid) => {
        try {
          const r = await fetch(wc(`/products/${pid}/variations?per_page=100`));
          if (r.ok) variationsByProduct.set(pid, await r.json());
        } catch { /* ignore : fail-open pour ce produit */ }
      }),
    );

    const out = new Set<string>();
    for (const li of lineItems) {
      const p = byId.get(li.product_id);
      const name = p?.name || `Produit #${li.product_id}`;
      if (li.variation_id) {
        const v = (variationsByProduct.get(li.product_id) ?? []).find((x) => x.id === li.variation_id);
        if (v && v.stock_status === 'outofstock') out.add(name);
      } else if (p && p.stock_status === 'outofstock') {
        out.add(name);
      }
    }
    return [...out];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuration WooCommerce manquante côté serveur.' }, { status: 500 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  // Articles : on ne garde QUE product_id (+ variation_id) + quantité (jamais de prix du client).
  const line_items = (body.items ?? [])
    .map((i) => {
      const variationId = Number(i.variation_id);
      return {
        product_id: Number(i.product_id),
        quantity: Math.max(1, Number(i.quantity) || 1),
        ...(Number.isInteger(variationId) && variationId > 0 ? { variation_id: variationId } : {}),
      };
    })
    .filter((i) => Number.isInteger(i.product_id) && i.product_id > 0);

  if (line_items.length === 0) {
    return NextResponse.json({ error: 'Panier vide ou articles invalides.' }, { status: 400 });
  }

  // Filet de sécurité : un article a-t-il basculé en rupture depuis l'affichage ?
  const outOfStock = await findOutOfStockNames(line_items);
  if (outOfStock.length > 0) {
    const liste = outOfStock.join(', ');
    return NextResponse.json(
      {
        error: `Désolé, ${outOfStock.length > 1 ? 'ces produits sont' : 'ce produit est'} en rupture de stock : ${liste}. Veuillez ${outOfStock.length > 1 ? 'les' : 'le'} retirer de votre panier pour continuer.`,
        outOfStock,
      },
      { status: 409 },
    );
  }

  const isClient = await verifyIsClient(body.accessToken);

  // ── Codes promo ─────────────────────────────────────────────────────────────
  // TOUTES les règles WooCommerce du code saisi sont appliquées ICI (lib/coupon-rules) :
  // l'API WooCommerce ne les vérifie que partiellement pour les commandes créées par le
  // site. On refuse aussi toute tentative d'utiliser le coupon client -13 % en manuel.
  const coupon_lines: { code: string }[] = [];
  const userCoupon = (body.couponCode || '').trim();
  const billingEmail = String(body.billing?.email ?? '');

  // Rabais client -13 % : seulement si la session est valide ET si le panier contient au
  // moins un produit Designs for Health (sinon le coupon — restreint à ces produits —
  // serait refusé par WooCommerce et ferait échouer la commande). Fail-closed : si on ne
  // peut pas déterminer la liste des produits admissibles, on n'applique aucun rabais.
  let dfhIds: Set<number> | null = null;
  let wantClientCoupon = false;
  if (isClient) {
    dfhIds = await fetchDfhProductIds();
    wantClientCoupon = !!(dfhIds && dfhIds.size > 0 && line_items.some((i) => dfhIds!.has(i.product_id)));
  }

  let applyUserCoupon = false;
  let userFreeShipping = false;
  if (userCoupon && userCoupon.toLowerCase() !== CLIENT_COUPON_CODE.toLowerCase()) {
    // Libère d'abord les tentatives impayées du client (paiement échoué / page fermée)
    // pour qu'elles ne comptent pas contre sa limite d'utilisation.
    await releaseUnpaidCouponHolds(userCoupon, billingEmail);

    const coupon = await fetchCouponByCode(userCoupon);
    if (coupon === null) {
      return NextResponse.json({ error: 'Ce code promo est invalide.' }, { status: 400 });
    }
    if (coupon === undefined) {
      // Échec réseau : fail-open — on pousse le code et WooCommerce tranchera au moment
      // de créer la commande, plutôt que de bloquer un client pour une panne passagère.
      applyUserCoupon = true;
    } else {
      userFreeShipping = coupon.free_shipping === true;
      const priced = await priceCartLines(line_items);
      if (!priced) {
        applyUserCoupon = true; // fail-open (données produit indisponibles)
      } else {
        const ev = evaluateCoupon(coupon, priced);
        if (ev.error) {
          return NextResponse.json({ error: ev.error }, { status: 400 });
        }
        if (!emailAllowed(coupon, billingEmail)) {
          return NextResponse.json({ error: 'Ce code promo est réservé à une autre adresse courriel.' }, { status: 400 });
        }
        if (await perUserLimitReached(coupon, billingEmail)) {
          return NextResponse.json(
            { error: 'Ce code promo a déjà été utilisé avec cette adresse courriel (limite par personne atteinte).' },
            { status: 400 },
          );
        }
        applyUserCoupon = true;
        // « Le meilleur des deux » : un code « usage individuel » (règle WooCommerce) ne
        // se cumule pas avec le rabais client -13 % — on applique le plus avantageux
        // pour le client. Même arbitrage que l'affichage du panier (CartContext).
        if (ev.individualUse && wantClientCoupon && dfhIds) {
          const clientDiscount = priced
            .filter((l) => dfhIds!.has(l.product_id))
            .reduce((s, l) => s + l.unitPrice * l.quantity, 0) * (parseFloat(CLIENT_COUPON_PERCENT) / 100);
          if (clientDiscount > ev.discount) applyUserCoupon = false;
          else wantClientCoupon = false;
        }
      }
    }
  }
  if (applyUserCoupon) coupon_lines.push({ code: userCoupon });
  if (wantClientCoupon && dfhIds && (await ensureClientCoupon(dfhIds))) {
    coupon_lines.push({ code: CLIENT_COUPON_CODE });
  }

  // Rabais client carte-cadeau (montant fixe par variante) → ligne de remise négative.
  // Clients seulement, et seulement si une carte-cadeau est au panier.
  const fee_lines: Array<{ name: string; total: string; tax_status: string }> = [];
  if (isClient) {
    const giftLines = line_items
      .filter((i) => i.product_id === GIFT_CARD_PRODUCT_ID)
      .map((i) => ({ variation_id: (i as { variation_id?: number }).variation_id, quantity: i.quantity }));
    const gcDiscount = await giftCardClientDiscountTotal(giftLines);
    if (gcDiscount > 0) {
      fee_lines.push({ name: 'Rabais client carte-cadeau', total: (-gcDiscount).toFixed(2), tax_status: 'none' });
    }
  }

  // ── Carte-cadeau (paiement) ─────────────────────────────────────────────────
  // Le client paie une partie (ou la totalité) de sa commande avec une carte-cadeau
  // PW. On la valide ICI (fail-closed : si l'API PW est injoignable, on refuse la
  // commande plutôt que d'ignorer silencieusement la carte). Le montant appliqué est
  // calculé APRÈS le total autoritatif WooCommerce (taxes + livraison incluses),
  // comme de l'argent comptant — puis la carte est débitée seulement après paiement.
  let giftCard: { id: string; number: string; balance: number } | null = null;
  const giftInput = (body.giftCardNumber || '').trim();
  if (giftInput) {
    const number = normalizeGiftCardNumber(giftInput);
    if (!number) {
      return NextResponse.json({ error: 'Numéro de carte-cadeau invalide.' }, { status: 400 });
    }
    const card = await fetchGiftCardByNumber(number);
    if (card === undefined) {
      return NextResponse.json(
        { error: 'Impossible de vérifier la carte-cadeau pour le moment. Réessayez ou retirez-la.' },
        { status: 502 },
      );
    }
    if (card === null || !card.active) {
      return NextResponse.json({ error: 'Cette carte-cadeau est introuvable ou désactivée.' }, { status: 400 });
    }
    if (isExpired(card)) {
      return NextResponse.json({ error: 'Cette carte-cadeau est expirée.' }, { status: 400 });
    }
    if (card.balance <= 0) {
      return NextResponse.json({ error: 'Le solde de cette carte-cadeau est épuisé.' }, { status: 400 });
    }
    giftCard = { id: card.id, number: card.number, balance: card.balance };
  }

  // Rattache la commande au compte client WordPress s'il en existe un pour ce
  // courriel : le paramètre `search` des commandes étant ignoré par la boutique,
  // `orders?customer=id` est le seul filtre fiable pour l'historique de l'espace
  // client — chaque commande rattachée ici le rend pérenne. Non bloquant.
  let wpCustomerId = 0;
  try {
    const cRes = await fetch(wc(`/customers?email=${encodeURIComponent(billingEmail)}&per_page=1`));
    if (cRes.ok) {
      const customers: Array<{ id: number; email?: string }> = await cRes.json();
      const cust = Array.isArray(customers)
        ? customers.find((c) => (c.email || '').toLowerCase() === billingEmail.toLowerCase())
        : undefined;
      if (cust) wpCustomerId = cust.id;
    }
  } catch { /* commande invité */ }

  const orderData: Record<string, unknown> = {
    status: 'pending',
    currency: 'CAD',
    payment_method: 'moneris',
    payment_method_title: 'Moneris',
    ...(wpCustomerId ? { customer_id: wpCustomerId } : {}),
    billing: body.billing ?? {},
    shipping: body.shipping ?? {},
    line_items,
    customer_note: body.customer_note ?? '',
    ...(coupon_lines.length ? { coupon_lines } : {}),
    ...(fee_lines.length ? { fee_lines } : {}),
  };

  try {
    const res = await fetch(wc('/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      let msg = `Erreur ${res.status}`;
      try { const e = await res.json(); msg = e.message || msg; } catch { /* ignore */ }
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    let order = await res.json();

    // Frais de livraison : 15 $ pour les commandes de 100 $ et moins (valeur marchande
    // nette = total autoritatif − taxes, donc après rabais et hors livraison). Gratuite
    // au-delà. On se base sur le total recalculé par WooCommerce — jamais sur une valeur
    // venue du navigateur — puis on ajoute une ligne taxable et on laisse WooCommerce
    // recalculer total + taxes. En cas d'échec, on garde la commande sans frais plutôt
    // que de tout faire échouer.
    try {
      // Base des frais = valeur marchande nette des PRODUITS PHYSIQUES seulement (après
      // rabais, hors taxes). Les produits numériques (carte-cadeau, suivis) sont exclus :
      // ils ne génèrent pas de frais et ne comptent pas dans le seuil de livraison gratuite.
      // Ex. produit 32 $ + carte-cadeau 100 $ → base = 32 $ (≤ 100) → frais 15 $.
      const digitalIds = await fetchDigitalProductIds();
      const lines: Array<{ product_id?: number; total?: string }> = Array.isArray(order.line_items) ? order.line_items : [];
      const physicalNet = lines
        .filter((li) => !digitalIds.has(Number(li.product_id)))
        .reduce((sum, li) => sum + parseFloat(li.total || '0'), 0);
      // Un code avec « livraison gratuite » (free_shipping) annule les frais — seulement
      // s'il a réellement été appliqué (pas écarté par l'arbitrage « meilleur des deux »).
      const shipping = applyUserCoupon && userFreeShipping ? 0 : shippingFeeFor(physicalNet);
      if (shipping > 0) {
        const upd = await fetch(wc(`/orders/${order.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fee_lines: [{ name: SHIPPING_LABEL, total: shipping.toFixed(2), tax_status: 'taxable' }],
          }),
        });
        if (upd.ok) order = await upd.json();
      }
    } catch { /* on conserve la commande sans frais de livraison */ }

    // Carte-cadeau : PAIEMENT FRACTIONNÉ, comme le fait nativement PW Gift Cards.
    // La commande garde son total et ses taxes COMPLETS (comptabilité intacte) ;
    // c'est le montant encaissé par Moneris qui est réduit du montant de la carte,
    // appliqué en dernier sur le total autoritatif (taxes + livraison incluses),
    // comme de l'argent comptant. NB : une ligne de remise négative ne convient pas —
    // WooCommerce retire proportionnellement les taxes de tout frais négatif.
    // Le montant est tracé en meta (lu au moment du débit, après paiement approuvé)
    // + une note visible dans l'admin. Fail-closed : si la meta ne peut pas être
    // écrite, la route de paiement chargerait le total complet — on annule plutôt.
    let giftCardApplied = 0;
    if (giftCard) {
      const currentTotal = parseFloat(order.total) || 0;
      giftCardApplied = Math.round(Math.min(giftCard.balance, currentTotal) * 100) / 100;
      if (giftCardApplied > 0) {
        const upd = await fetch(wc(`/orders/${order.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meta_data: [
              { key: GC_META_NUMBER, value: giftCard.number },
              { key: GC_META_ID, value: giftCard.id },
              { key: GC_META_AMOUNT, value: giftCardApplied.toFixed(2) },
            ],
          }),
        }).catch(() => null);
        if (!upd || !upd.ok) {
          await fetch(wc(`/orders/${order.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
          }).catch(() => { /* non bloquant */ });
          return NextResponse.json(
            { error: 'Impossible d’appliquer la carte-cadeau. Réessayez ou retirez-la.' },
            { status: 502 },
          );
        }
        order = await upd.json();
        // Note visible dans l'admin WooCommerce (non bloquante).
        await fetch(wc(`/orders/${order.id}/notes`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            note: `Carte-cadeau ${giftCard.number} appliquée : ${giftCardApplied.toFixed(2)} $ sur le total de ${order.total} $. Le reste (${(parseFloat(order.total) - giftCardApplied).toFixed(2)} $) est encaissé par Moneris ; la carte est débitée automatiquement au paiement.`,
            customer_note: false,
          }),
        }).catch(() => { /* non bloquant */ });
      }
    }

    return NextResponse.json({
      orderId: order.id,
      // Montant À PAYER par le client (total autoritatif WooCommerce − carte-cadeau).
      total: Math.round((parseFloat(order.total) - giftCardApplied) * 100) / 100,
      discountTotal: parseFloat(order.discount_total || '0'),
      giftCardApplied,
      isClient,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur création de commande.' },
      { status: 502 }
    );
  }
}
