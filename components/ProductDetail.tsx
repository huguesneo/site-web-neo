'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { GHLProduct, ProductVariation } from '../data/ghlProducts';
import { useCart } from '../contexts/CartContext';
import { useClientStatus } from '../hooks/useClientStatus';
import {
  prixClient, isClientDiscountEligible, GIFT_CARD_PRODUCT_ID,
  GIFT_CARD_MAX_CLIENT_DISCOUNT, giftCardClientDiscount, giftCardFaceValue,
} from '../constants';
import {
  ArrowLeft, ShoppingCart, ShieldCheck, CheckCircle, Sparkles, Truck, ChevronRight,
} from 'lucide-react';

const fmt = (n: number) => n.toFixed(2);

/**
 * Fiche produit pleine page (/boutique/[slug]). Reprend la logique de la modale
 * boutique (galerie, variantes, prix client −13 %, rabais carte-cadeau) mais sur
 * une vraie page indexable. L'ajout au panier réutilise le CartContext partagé.
 */
const ProductDetail: React.FC<{ product: GHLProduct }> = ({ product: p }) => {
  const { addItem } = useCart();
  const { isClient } = useClientStatus();

  const variations = p.variations ?? [];
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [activeImage, setActiveImage] = useState<string>(p.image);
  const [added, setAdded] = useState(false);

  const eligible = isClientDiscountEligible(p.name);
  const isGiftCard = p.id === String(GIFT_CARD_PRODUCT_ID);
  const needsChoice = variations.length > 0 && !selectedVariation;
  // Produit SIMPLE en rupture (les variantes gèrent déjà leur propre statut, bouton par bouton).
  const soldOut = variations.length === 0 && !p.inStock;
  const displayPrice = selectedVariation ? parseFloat(selectedVariation.price) : parseFloat(p.price);

  // Rabais carte-cadeau (fixe) pour la variante choisie.
  const gcUnit = isGiftCard && selectedVariation ? giftCardClientDiscount(p.id, giftCardFaceValue(selectedVariation.label)) : 0;
  // Prix payé final : −13 % (Designs for Health), ou rabais fixe carte-cadeau, si connecté.
  const finalPrice = !isClient ? displayPrice : eligible ? prixClient(displayPrice) : displayPrice - gcUnit;
  const saving = displayPrice - finalPrice;

  const thumbs = Array.from(
    new Set([p.image, ...p.images, ...variations.map((v) => v.image)].filter(Boolean))
  ) as string[];
  const mainImg = activeImage || p.image;

  const handleAdd = () => {
    if (needsChoice || soldOut) return;
    addItem(p, selectedVariation ?? undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="pt-24 md:pt-28 min-h-screen bg-white">
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="max-w-6xl mx-auto px-6 pt-6">
        <ol className="flex items-center flex-wrap gap-1.5 text-xs text-gray-400 font-semibold">
          <li><Link href="/" className="hover:text-neo transition-colors">Accueil</Link></li>
          <ChevronRight size={13} className="text-gray-300" />
          <li><Link href="/boutique" className="hover:text-neo transition-colors">Boutique</Link></li>
          <ChevronRight size={13} className="text-gray-300" />
          <li className="text-gray-700 truncate max-w-[60vw]">{p.name}</li>
        </ol>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 md:py-12">
        <Link href="/boutique" className="inline-flex items-center text-gray-500 hover:text-neo mb-8 transition-colors text-sm font-semibold">
          <ArrowLeft size={17} className="mr-2" /> Retour à la boutique
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* ───── Galerie ───── */}
          <div className="md:sticky md:top-28">
            <div className="bg-gradient-to-br from-gray-50 to-neo-50/30 rounded-3xl flex items-center justify-center p-10 aspect-square">
              <img src={mainImg} alt={p.name} className="w-4/5 h-4/5 object-contain drop-shadow-md" />
            </div>
            {thumbs.length > 1 && (
              <div className="flex flex-wrap gap-2.5 mt-4">
                {thumbs.map((src) => (
                  <button
                    key={src}
                    onClick={() => setActiveImage(src)}
                    className={`w-16 h-16 rounded-xl bg-white border-2 flex items-center justify-center overflow-hidden transition-colors ${
                      mainImg === src ? 'border-neo' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ───── Infos ───── */}
          <div>
            <span className="text-[11px] font-black text-neo uppercase tracking-[0.28em] mb-3 block">
              {p.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {p.name}
            </h1>

            {needsChoice && (
              <p className="text-[12px] font-semibold text-gray-400 mb-1">À partir de</p>
            )}

            {/* Bloc prix */}
            {isGiftCard ? (
              isClient && selectedVariation && gcUnit > 0 ? (
                <div className="mb-6">
                  <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-extrabold text-neo tracking-tight">{fmt(displayPrice - gcUnit)} $</p>
                    <p className="text-xl font-medium text-gray-400 line-through">{fmt(displayPrice)} $</p>
                  </div>
                  <span className="mt-2.5 inline-flex items-center gap-1.5 bg-neo-50 text-neo text-[11px] font-bold px-2.5 py-1 rounded-full">
                    <CheckCircle size={12} /> Prix client · −{Math.round(gcUnit)} $
                  </span>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{fmt(displayPrice)} $</p>
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-neo-50/70 border border-neo/10 px-3 py-2.5 max-w-sm">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles size={15} className="text-neo" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[13px] font-extrabold text-neo">Client : économisez jusqu'à {Math.round(GIFT_CARD_MAX_CLIENT_DISCOUNT)} $</p>
                      <p className="text-[11px] text-gray-500">
                        {isClient ? 'Choisissez un montant pour voir votre prix client.' : 'Connectez-vous à votre espace client.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : isClient && eligible ? (
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-extrabold text-neo tracking-tight">{fmt(finalPrice)} $</p>
                  <p className="text-xl font-medium text-gray-400 line-through">{fmt(displayPrice)} $</p>
                </div>
                <span className="mt-2.5 inline-flex items-center gap-1.5 bg-neo-50 text-neo text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <CheckCircle size={12} /> Prix client appliqué · −13 %
                </span>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{fmt(displayPrice)} $</p>
                {eligible && !isClient && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-neo-50/70 border border-neo/10 px-3 py-2.5 max-w-sm">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles size={15} className="text-neo" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[13px] font-extrabold text-neo">En tant que client NEO, vous économiseriez {fmt(displayPrice - prixClient(displayPrice))} $</p>
                      <p className="text-[11px] text-gray-500">Déjà client ? Connectez-vous à votre espace client.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Variantes */}
            {variations.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  {p.variationLabel || 'Choix'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variations.map((v) => {
                    const active = selectedVariation?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        disabled={!v.inStock}
                        onClick={() => {
                          setSelectedVariation(v);
                          if (v.image) setActiveImage(v.image);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          !v.inStock
                            ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                            : active
                              ? 'border-neo bg-neo text-white shadow-md shadow-neo/20'
                              : 'border-gray-200 text-gray-700 hover:border-neo/50'
                        }`}
                      >
                        {v.label}{!v.inStock && ' — épuisé'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ajout panier */}
            <div className="space-y-3 mb-8">
              <button
                disabled={needsChoice || soldOut}
                onClick={handleAdd}
                className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
                  added ? 'bg-green-500 text-white shadow-green-500/25' : 'bg-neo hover:bg-neo-600 text-white shadow-neo/25'
                }`}
              >
                {added ? (
                  <><CheckCircle size={18} /> Ajouté au panier</>
                ) : soldOut ? (
                  'Rupture de stock'
                ) : needsChoice ? (
                  `Choisissez ${(p.variationLabel || 'une option').toLowerCase()}`
                ) : (
                  <><ShoppingCart size={18} /> Ajouter au panier — {fmt(finalPrice)} $</>
                )}
              </button>
              {added && (
                <Link href="/panier" className="block w-full text-center font-bold py-3.5 rounded-xl border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors">
                  Voir mon panier
                </Link>
              )}
              <div className="flex items-center justify-center gap-5 text-xs text-gray-400 pt-1">
                <span className="flex items-center gap-1.5"><Truck size={13} className="text-neo" /> Expédition 24/48h</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-neo" /> Paiement sécurisé</span>
              </div>
            </div>

            {/* Description */}
            <div className="h-px bg-gray-100 mb-6" />
            {p.descriptionHtml ? (
              <div
                className="text-gray-600 text-[15px] leading-relaxed [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_h4]:font-bold [&_h4]:text-gray-900 [&_h4]:mt-4 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1 [&_strong]:font-semibold [&_strong]:text-gray-800 [&_b]:font-semibold [&_b]:text-gray-800 [&_a]:text-neo [&_a]:underline [&_hr]:my-5 [&_hr]:border-gray-100"
                dangerouslySetInnerHTML={{ __html: p.descriptionHtml }}
              />
            ) : (
              <p className="text-gray-500 text-[15px] leading-relaxed">
                Un supplément de haute qualité, rigoureusement sélectionné par nos experts cliniques pour ses propriétés biologiques exceptionnelles et sa biodisponibilité optimale.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
