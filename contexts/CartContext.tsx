'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { GHLProduct, ProductVariation } from '../data/ghlProducts';
import { useClientStatus } from '../hooks/useClientStatus';
import { CLIENT_DISCOUNT_RATE, GIFT_CARD_PRODUCT_ID, isClientDiscountEligible, giftCardClientDiscount, giftCardFaceValue, isDigitalProduct, shippingFeeFor } from '../constants';

/** Variante choisie pour une ligne de panier (sous-ensemble de ProductVariation). */
export type SelectedVariation = Pick<ProductVariation, 'id' | 'label' | 'price' | 'image'>;

export interface CartItem {
  product: GHLProduct;
  quantity: number;
  variation?: SelectedVariation;
}

/** Identité d'une ligne = produit + variante choisie (deux saveurs = deux lignes). */
export function cartLineId(productId: string, variationId?: number): string {
  return variationId ? `${productId}:${variationId}` : productId;
}

/** Prix unitaire effectif (variante si choisie, sinon prix du produit). */
export function itemUnitPrice(item: CartItem): number {
  return parseFloat(item.variation?.price ?? item.product.price);
}

/** Image effective (image de la variante si fournie, sinon image principale). */
export function itemImage(item: CartItem): string {
  return item.variation?.image || item.product.image;
}

export interface AppliedCoupon {
  code: string;
  discountType: 'percent' | 'fixed_cart' | 'fixed_product';
  amount: number;        // montant brut (ex: 10 = 10% ou 10$)
  discountValue: number; // montant en dollars, recalculé à chaque rendu sur les articles admissibles
  /** Lignes admissibles au rabais (`${productId}:${variationId||0}`), calculées par le
   *  serveur selon TOUTES les règles WooCommerce du coupon (exclusions, soldes…). */
  eligibleLineKeys?: string[];
  freeShipping?: boolean;   // le code annule les frais de livraison (règle WooCommerce)
  individualUse?: boolean;  // « usage individuel » : non cumulable → arbitrage avec le -13 %
  excludedProductIds?: number[]; // rétro-compat : anciens paniers sauvegardés
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isClient: boolean;        // session Supabase active → prix client
  clientDiscount: number;   // rabais client -13 % appliqué en dollars (0 si non connecté)
  giftCardDiscount: number; // rabais client carte-cadeau appliqué en dollars (0 si non connecté)
  potentialClientDiscount: number; // rabais total possible (appât non-connecté)
  shippableNet: number;     // valeur nette des produits PHYSIQUES (base du seuil de livraison)
  shipping: number;         // frais de livraison estimés (0 si gratuite ou panier 100 % numérique)
  hydrated: boolean;
  coupon: AppliedCoupon | null;
  couponNotice: string;     // message informatif (code retiré, arbitrage « meilleur des deux »)
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  addItem: (product: GHLProduct, variation?: SelectedVariation) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Démarre vide (identique côté serveur et au 1er rendu client) pour éviter
  // toute erreur d'hydratation, puis charge le panier depuis localStorage.
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [removalNotice, setRemovalNotice] = useState('');
  const [hydrated, setHydrated] = useState(false);
  // Signature `code|panier` de la dernière validation serveur réussie — évite de
  // re-valider en boucle après chaque réponse.
  const validatedRef = useRef('');

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('neo_cart');
      if (savedCart) setItems(JSON.parse(savedCart));
      const savedCoupon = localStorage.getItem('neo_coupon');
      if (savedCoupon) setCoupon(JSON.parse(savedCoupon));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('neo_cart', JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (coupon) localStorage.setItem('neo_coupon', JSON.stringify(coupon));
    else localStorage.removeItem('neo_coupon');
  }, [coupon, hydrated]);

  const { isClient } = useClientStatus();

  const subtotal = items.reduce((sum, i) => sum + itemUnitPrice(i) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  // Le rabais client -13 % s'applique UNIQUEMENT aux produits Designs for Health (aligné sur
  // le coupon serveur). `discountableSubtotal` = part du panier admissible au rabais.
  const discountableSubtotal = items.reduce(
    (sum, i) => isClientDiscountEligible(i.product.name) ? sum + itemUnitPrice(i) * i.quantity : sum,
    0,
  );
  const rawClientDiscount = isClient ? discountableSubtotal * CLIENT_DISCOUNT_RATE : 0;
  // Rabais client fixe sur les cartes-cadeaux (montant par variante), clients seulement.
  const giftCardDiscountPotential = items.reduce(
    (sum, i) => sum + giftCardClientDiscount(i.product.id, giftCardFaceValue(i.variation?.label)) * i.quantity,
    0,
  );
  const giftCardDiscount = isClient ? giftCardDiscountPotential : 0;
  // Économies potentielles totales si le visiteur (non connecté) devenait client.
  const potentialClientDiscount = discountableSubtotal * CLIENT_DISCOUNT_RATE + giftCardDiscountPotential;

  // ── Code promo ──────────────────────────────────────────────────────────────
  // Le serveur (/api/coupons/validate) applique TOUTES les règles WooCommerce du code
  // (produits/catégories permis et exclus, soldes, minimum, expiration…) et renvoie les
  // LIGNES ADMISSIBLES. Le rabais est recalculé ici à chaque rendu pour suivre les
  // quantités ; un effet plus bas re-valide dès que la composition du panier change.
  const cartLineKey = (i: CartItem): string => `${parseInt(i.product.id, 10)}:${i.variation?.id ?? 0}`;
  const eligibleKeys = coupon?.eligibleLineKeys ? new Set(coupon.eligibleLineKeys) : null;
  // Rétro-compat : coupon sauvegardé avant cette version (sans lignes admissibles) →
  // on exclut au moins les produits exclus connus et la carte-cadeau, en attendant la
  // re-validation automatique.
  const legacyExcluded = new Set<number>([...(coupon?.excludedProductIds ?? []), GIFT_CARD_PRODUCT_ID]);
  const isCouponEligible = (i: CartItem): boolean =>
    eligibleKeys ? eligibleKeys.has(cartLineKey(i)) : !legacyExcluded.has(parseInt(i.product.id, 10));
  const couponEligibleSubtotal = coupon
    ? items.reduce((sum, i) => (isCouponEligible(i) ? sum + itemUnitPrice(i) * i.quantity : sum), 0)
    : 0;
  const couponEligibleQty = coupon
    ? items.reduce((q, i) => (isCouponEligible(i) ? q + i.quantity : q), 0)
    : 0;
  const rawCouponDiscount = !coupon
    ? 0
    : coupon.discountType === 'percent'
      ? couponEligibleSubtotal * (coupon.amount / 100)
      : coupon.discountType === 'fixed_product'
        ? Math.min(coupon.amount * couponEligibleQty, couponEligibleSubtotal)
        : Math.min(coupon.amount, couponEligibleSubtotal);

  // « Le meilleur des deux » : un code « usage individuel » (règle WooCommerce) ne se
  // cumule pas avec le rabais client -13 % — on garde le plus avantageux pour le client.
  // Même arbitrage que le serveur au moment de la commande (create-order).
  const arbitrage = !!(coupon?.individualUse && rawClientDiscount > 0 && rawCouponDiscount > 0);
  const couponSuppressed = arbitrage && rawClientDiscount > rawCouponDiscount;
  const clientDiscount = arbitrage && !couponSuppressed ? 0 : rawClientDiscount;
  const couponDiscountValue = couponSuppressed ? 0 : rawCouponDiscount;
  const couponNotice = removalNotice || (arbitrage
    ? (couponSuppressed
        ? 'Ton rabais client (-13 %) est plus avantageux que ce code : on a gardé le meilleur des deux.'
        : 'Ce code est plus avantageux que ton rabais client (-13 %) : on a gardé le meilleur des deux.')
    : '');

  // ── Frais de livraison ──────────────────────────────────────────────────────
  // Les produits NUMÉRIQUES (carte-cadeau, suivis) ne génèrent pas de frais et NE
  // comptent PAS dans le seuil de livraison gratuite. La base se calcule donc sur la
  // valeur nette des produits PHYSIQUES seulement.
  const physicalSubtotal = items.reduce(
    (sum, i) => isDigitalProduct(i.product) ? sum : sum + itemUnitPrice(i) * i.quantity, 0,
  );
  // Rabais imputables au physique : le rabais client -13 % ne porte que sur des produits
  // physiques (Designs for Health) ; le rabais carte-cadeau est numérique (exclu) ; le
  // coupon est réparti au prorata de la part physique du sous-total qui lui est admissible.
  const physicalEligibleSubtotal = coupon
    ? items.reduce(
        (sum, i) => (isCouponEligible(i) && !isDigitalProduct(i.product)) ? sum + itemUnitPrice(i) * i.quantity : sum,
        0,
      )
    : 0;
  const physicalCouponShare = couponEligibleSubtotal > 0
    ? couponDiscountValue * (physicalEligibleSubtotal / couponEligibleSubtotal)
    : 0;
  const shippableNet = Math.max(0, physicalSubtotal - clientDiscount - physicalCouponShare);
  // Un code « livraison gratuite » (free_shipping) annule les frais — sauf s'il a été
  // écarté par l'arbitrage « meilleur des deux ».
  const shipping = coupon?.freeShipping && !couponSuppressed ? 0 : shippingFeeFor(shippableNet);

  // Re-valide le code promo quand la COMPOSITION du panier change : les règles
  // dépendent du panier (minimum, produits admissibles, soldes…). Debounce léger pour
  // éviter une rafale d'appels pendant les ajustements de quantité. Si le code ne
  // s'applique plus, il est retiré avec un message explicatif.
  const cartSignature = items.map((i) => `${cartLineKey(i)}x${i.quantity}`).join('|');
  useEffect(() => {
    if (!hydrated || !coupon) return;
    if (items.length === 0) {
      setCoupon(null);
      setRemovalNotice('');
      return;
    }
    const sig = `${coupon.code}|${cartSignature}`;
    if (validatedRef.current === sig) return;
    const t = setTimeout(() => {
      applyCoupon(coupon.code).catch((e: unknown) => {
        setCoupon(null);
        setRemovalNotice(
          e instanceof Error && e.message
            ? `Code promo retiré : ${e.message}`
            : 'Code promo retiré : il ne s’applique plus à votre panier.',
        );
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature, hydrated, coupon?.code]);

  async function applyCoupon(code: string) {
    // Validation côté serveur : les clés WooCommerce ne sont jamais exposées au
    // navigateur. La route applique TOUTES les règles WooCommerce du coupon contre
    // le panier réel (ids + quantités, jamais de prix) et renvoie le rabais calculé
    // + les lignes admissibles.
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        items: items.map((i) => ({
          product_id: parseInt(i.product.id, 10),
          ...(i.variation ? { variation_id: i.variation.id } : {}),
          quantity: i.quantity,
        })),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Code promo invalide ou expiré.');
    }

    validatedRef.current = `${data.code}|${items.map((i) => `${cartLineKey(i)}x${i.quantity}`).join('|')}`;
    setRemovalNotice('');
    setCoupon({
      code: data.code,
      discountType: data.discount_type,
      amount: parseFloat(String(data.amount)) || 0,
      discountValue: Number(data.discount_value) || 0,
      eligibleLineKeys: Array.isArray(data.eligible_line_keys) ? data.eligible_line_keys : [],
      freeShipping: data.free_shipping === true,
      individualUse: data.individual_use === true,
    });
  }

  function removeCoupon() {
    setCoupon(null);
    setRemovalNotice('');
  }

  function addItem(product: GHLProduct, variation?: SelectedVariation) {
    // Garde-fou : on n'ajoute jamais un produit explicitement en rupture (l'UI le bloque
    // déjà, ceci couvre les chemins indirects — ex. recommandations de Léo). `=== false`
    // pour ne pas bloquer les anciens articles du panier (localStorage) sans ce champ.
    if (product.inStock === false && !variation) return;
    const lineId = cartLineId(product.id, variation?.id);
    setItems((prev) => {
      const existing = prev.find((i) => cartLineId(i.product.id, i.variation?.id) === lineId);
      if (existing) {
        return prev.map((i) =>
          cartLineId(i.product.id, i.variation?.id) === lineId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, variation }];
    });
  }

  function removeItem(lineId: string) {
    setItems((prev) => prev.filter((i) => cartLineId(i.product.id, i.variation?.id) !== lineId));
  }

  function updateQty(lineId: string, qty: number) {
    if (qty <= 0) { removeItem(lineId); return; }
    setItems((prev) =>
      prev.map((i) => (cartLineId(i.product.id, i.variation?.id) === lineId ? { ...i, quantity: qty } : i))
    );
  }

  function clearCart() {
    setItems([]);
    setCoupon(null);
    setRemovalNotice('');
  }

  return (
    <CartContext.Provider value={{ items, count, subtotal, isClient, clientDiscount, giftCardDiscount, potentialClientDiscount, shippableNet, shipping, hydrated, coupon: coupon ? { ...coupon, discountValue: couponDiscountValue } : null, couponNotice, applyCoupon, removeCoupon, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
