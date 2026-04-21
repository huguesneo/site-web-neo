'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GHLProduct } from '../data/ghlProducts';

export interface CartItem {
  product: GHLProduct;
  quantity: number;
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
  coupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  addItem: (product: GHLProduct) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('neo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const saved = localStorage.getItem('neo_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('neo_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (coupon) localStorage.setItem('neo_coupon', JSON.stringify(coupon));
    else localStorage.removeItem('neo_coupon');
  }, [coupon]);

  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  async function applyCoupon(code: string) {
    const wcKey = process.env.NEXT_PUBLIC_WC_KEY;
    const wcSecret = process.env.NEXT_PUBLIC_WC_SECRET;
    const wcUrl = process.env.NEXT_PUBLIC_WC_URL;

    const res = await fetch(
      `${wcUrl}/wp-json/wc/v3/coupons?code=${encodeURIComponent(code.trim())}&consumer_key=${wcKey}&consumer_secret=${wcSecret}`
    );
    if (!res.ok) throw new Error('Erreur réseau');

    const data = await res.json();
    if (!data.length) throw new Error('Code promo invalide ou expiré.');

    const c = data[0];

    // Vérifier la date d'expiration
    if (c.date_expires && new Date(c.date_expires) < new Date()) {
      throw new Error('Ce code promo est expiré.');
    }

    // Vérifier le nombre d'utilisations max
    if (c.usage_limit && c.usage_count >= c.usage_limit) {
      throw new Error('Ce code promo a atteint sa limite d\'utilisation.');
    }

    const amount = parseFloat(c.amount);
    let discountValue = 0;

    if (c.discount_type === 'percent') {
      discountValue = subtotal * (amount / 100);
    } else {
      discountValue = Math.min(amount, subtotal);
    }

    setCoupon({
      code: c.code,
      discountType: c.discount_type,
      amount,
      discountValue,
    });
  }

  function removeCoupon() {
    setCoupon(null);
  }

  function addItem(product: GHLProduct) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { removeItem(productId); return; }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  }

  function clearCart() {
    setItems([]);
    setCoupon(null);
  }

  return (
    <CartContext.Provider value={{ items, count, subtotal, coupon, applyCoupon, removeCoupon, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
