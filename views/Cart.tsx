'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Leaf, Tag, X, Loader2, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import Button from '../components/Button';
import Section from '../components/Section';

const Cart: React.FC = () => {
  const { items, subtotal, coupon, applyCoupon, removeCoupon, removeItem, updateQty } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [couponError, setCouponError] = useState('');

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponStatus('loading');
    setCouponError('');
    try {
      await applyCoupon(couponInput);
      setCouponStatus('idle');
      setCouponInput('');
    } catch (e: unknown) {
      setCouponError(e instanceof Error ? e.message : 'Code invalide.');
      setCouponStatus('error');
    }
  }

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
        <Leaf size={56} className="text-gray-200" />
        <h1 className="text-3xl font-bold text-gray-900">Ton panier est vide</h1>
        <p className="text-gray-500 text-lg">Découvre nos suppléments.</p>
        <Button to="/boutique" variant="primary" className="mt-2 px-8 py-3">
          Voir la boutique <ArrowRight className="ml-2" size={18} />
        </Button>
      </div>
    );
  }

  const discount = coupon?.discountValue ?? 0;
  const taxes = (subtotal - discount) * 0.14975;
  const total = subtotal - discount + taxes;

  return (
    <>
      <div className="bg-gray-50 pt-32 pb-10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900">Ton Panier</h1>
          <p className="text-gray-500 mt-2">{items.reduce((s, i) => s + i.quantity, 0)} article{items.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''}</p>
        </div>
      </div>

      <Section className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <ShoppingBag size={32} className="text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-neo uppercase tracking-widest">{product.category}</span>
                  <h3 className="font-bold text-gray-900 leading-tight mt-0.5 line-clamp-2">{product.name}</h3>
                  <p className="text-neo font-bold mt-1">{(parseFloat(product.price) * quantity).toFixed(2)} $</p>
                </div>

                <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                  <button onClick={() => removeItem(product.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={18} />
                  </button>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1">
                    <button onClick={() => updateQty(product.id, quantity - 1)} className="text-gray-500 hover:text-neo transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                    <button onClick={() => updateQty(product.id, quantity + 1)} className="text-gray-500 hover:text-neo transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-28">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Résumé</h2>

              {/* Code promo */}
              {coupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle size={16} />
                    <span className="text-sm font-bold uppercase">{coupon.code}</span>
                    <span className="text-xs text-green-600">
                      {coupon.discountType === 'percent' ? `-${coupon.amount}%` : `-${coupon.amount.toFixed(2)} $`}
                    </span>
                  </div>
                  <button onClick={removeCoupon} className="text-green-500 hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponStatus('idle'); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Code promo"
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponStatus === 'loading'}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-neo transition-colors disabled:opacity-50 shrink-0"
                    >
                      {couponStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : 'Appliquer'}
                    </button>
                  </div>
                  {couponStatus === 'error' && (
                    <p className="text-xs text-red-500 mt-1.5 ml-1">{couponError}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-medium text-gray-900">{subtotal.toFixed(2)} $</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Rabais ({coupon.code})</span>
                    <span className="font-medium">-{discount.toFixed(2)} $</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>TPS + TVQ (14,975%)</span>
                  <span className="font-medium text-gray-900">{taxes.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span className="text-gray-400">Calculée au paiement</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold text-gray-900">
                  <span>Total estimé</span>
                  <span>{total.toFixed(2)} $</span>
                </div>
              </div>

              <Link
                href="/paiement"
                className="mt-6 w-full bg-neo text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neo/90 transition-colors shadow-lg shadow-neo/20"
              >
                Procéder au paiement <ArrowRight size={18} />
              </Link>

              <Link href="/boutique" className="mt-3 w-full text-center text-sm text-gray-400 hover:text-neo transition-colors block">
                ← Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
};

export default Cart;
