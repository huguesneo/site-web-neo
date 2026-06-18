'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GHLProduct, ProductVariation } from '../data/ghlProducts';
import { useClientStatus } from '../hooks/useClientStatus';
import { CLIENT_DISCOUNT_RATE, isClientDiscountEligible, giftCardClientDiscount, giftCardFaceValue } from '../constants';

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
  amount: number;       // montant brut (ex: 10 = 10% ou 10$)
  discountValue: number; // montant calculé en dollars
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isClient: boolean;        // session Supabase active → prix client
  clientDiscount: number;   // rabais client -13 % appliqué en dollars (0 si non connecté)
  giftCardDiscount: number; // rabais client carte-cadeau appliqué en dollars (0 si non connecté)
  potentialClientDiscount: number; // rabais total possible (appât non-connecté)
  hydrated: boolean;
  coupon: AppliedCoupon | null;
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
  const [hydrated, setHydrated] = useState(false);

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
  const clientDiscount = isClient ? discountableSubtotal * CLIENT_DISCOUNT_RATE : 0;
  // Rabais client fixe sur les cartes-cadeaux (montant par variante), clients seulement.
  const giftCardDiscountPotential = items.reduce(
    (sum, i) => sum + giftCardClientDiscount(i.product.id, giftCardFaceValue(i.variation?.label)) * i.quantity,
    0,
  );
  const giftCardDiscount = isClient ? giftCardDiscountPotential : 0;
  // Économies potentielles totales si le visiteur (non connecté) devenait client.
  const potentialClientDiscount = discountableSubtotal * CLIENT_DISCOUNT_RATE + giftCardDiscountPotential;

  async function applyCoupon(code: string) {
    // Validation côté serveur : les clés WooCommerce ne sont jamais exposées au
    // navigateur. La route renvoie le type/montant ; on calcule le rabais ici
    // (il dépend du sous-total du panier).
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Code promo invalide ou expiré.');
    }

    const amount = parseFloat(String(data.amount));
    const discountValue = data.discount_type === 'percent'
      ? subtotal * (amount / 100)
      : Math.min(amount, subtotal);

    setCoupon({
      code: data.code,
      discountType: data.discount_type,
      amount,
      discountValue,
    });
  }

  function removeCoupon() {
    setCoupon(null);
  }

  function addItem(product: GHLProduct, variation?: SelectedVariation) {
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
  }

  return (
    <CartContext.Provider value={{ items, count, subtotal, isClient, clientDiscount, giftCardDiscount, potentialClientDiscount, hydrated, coupon, applyCoupon, removeCoupon, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
