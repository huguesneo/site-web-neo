'use client';
import React, { useState } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { GHLProduct } from '../data/ghlProducts';
import { useGHLProducts } from '../hooks/useGHLProducts';
import { useCart } from '../contexts/CartContext';
import {
  Search, ArrowRight, Truck, ShieldCheck, ShoppingCart,
  Loader2, AlertCircle, CheckCircle, X, Leaf,
} from 'lucide-react';

const Shop: React.FC = () => {
  const { products, loading, error } = useGHLProducts();
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<GHLProduct | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [cartToast, setCartToast] = useState<{ name: string; visible: boolean }>({ name: '', visible: false });

  const categories = ["Tout", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchCategory = activeCategory === "Tout" || product.category === activeCategory;
    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddToCart = (product: GHLProduct) => {
    addItem(product);
    setAddedId(product.id);
    setCartToast({ name: product.name, visible: true });
    setTimeout(() => setAddedId(null), 1500);
    setTimeout(() => setCartToast(prev => ({ ...prev, visible: false })), 2800);
  };

  return (
    <>
      {/* ───── HERO BOUTIQUE ───── */}
      <div className="bg-white pt-28 pb-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <span className="text-neo font-extrabold uppercase tracking-[0.3em] text-xs mb-4 block">
                Boutique Officielle NEO
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.05] mb-3">
                Qualité<br />
                <span className="text-neo">Clinique</span>
              </h1>
              <p className="text-gray-500 max-w-md text-sm leading-relaxed mt-2">
                Chaque supplément est rigoureusement sélectionné pour sa pureté,<br className="hidden md:block" /> sa biodisponibilité et son efficacité clinique démontrée.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mb-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100">
                <Truck size={15} className="text-neo" /> Expédition 24/48h
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100">
                <ShieldCheck size={15} className="text-neo" /> Checkout Sécurisé
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── FILTRES & RECHERCHE ───── */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row justify-between items-center gap-3">
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-neo text-white shadow-md shadow-neo/30'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full lg:w-72 pl-11 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ───── GRILLE PRODUITS ───── */}
      <div className="bg-gray-50 py-10 min-h-[600px]">
        <div className="max-w-7xl mx-auto px-6">

          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-400">
              <Loader2 size={40} className="animate-spin text-neo" />
              <p className="text-sm font-semibold">Chargement des produits…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <AlertCircle size={40} className="text-red-400" />
              <p className="text-lg font-bold text-gray-800">Erreur de chargement</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    style={{ animationDelay: `${Math.min(index * 40, 400)}ms`, opacity: 0 }}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/80 hover:border-neo/20 hover:-translate-y-1.5 transition-all duration-300 flex flex-col cursor-pointer animate-fade-in-up"
                  >
                    {/* Image zone */}
                    <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 aspect-square flex items-center justify-center p-8 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-4/5 h-4/5 object-contain group-hover:scale-[1.06] transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Category pill */}
                      <div className="absolute top-3 left-3">
                        <span className="text-[9px] font-black text-neo uppercase tracking-[0.18em] bg-white/95 px-2.5 py-1 rounded-full border border-neo/15 shadow-sm">
                          {product.category}
                        </span>
                      </div>
                      {/* Hover overlay cue */}
                      <div className="absolute inset-0 bg-neo/0 group-hover:bg-neo/4 transition-colors duration-300 pointer-events-none" />
                    </div>

                    {/* Info zone */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-neo transition-colors line-clamp-2 min-h-[2.6rem] mb-4">
                        {product.name}
                      </h3>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="text-base font-extrabold text-gray-900 tracking-tight">
                          {product.price} $
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm ${
                            addedId === product.id
                              ? 'bg-green-500 text-white scale-95'
                              : 'bg-gray-900 text-white hover:bg-neo hover:shadow-neo/30 hover:shadow-md'
                          }`}
                        >
                          {addedId === product.id
                            ? <><CheckCircle size={13} /> Ajouté</>
                            : <><ShoppingCart size={13} /> Ajouter</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-32">
                  <Leaf className="mx-auto text-gray-200 mb-6" size={64} />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
                  <p className="text-gray-500 text-sm">Essayez d'ajuster vos critères de recherche.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ───── MODAL PRODUIT PREMIUM ───── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative z-10 bg-white rounded-3xl w-full max-w-2xl overflow-y-auto shadow-2xl animate-fade-in flex flex-col md:flex-row max-h-[90vh] md:overflow-hidden">

            {/* Image */}
            <div className="bg-gradient-to-br from-gray-50 to-neo-50/30 flex items-center justify-center p-6 md:p-10 md:w-[45%] flex-shrink-0">
              <img
                src={selectedProduct.image}
                className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-md"
                alt={selectedProduct.name}
              />
            </div>

            {/* Details */}
            <div className="p-8 flex flex-col flex-1 overflow-y-auto">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"
              >
                <X size={16} />
              </button>

              <span className="text-[10px] font-black text-neo uppercase tracking-[0.28em] mb-2 block">
                {selectedProduct.category}
              </span>
              <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">
                {selectedProduct.name}
              </h2>
              <p className="text-3xl font-extrabold text-neo mb-5 tracking-tight">
                {selectedProduct.price} $
              </p>

              <div className="h-px bg-gray-100 mb-5" />

              <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-6">
                {selectedProduct.description
                  ? selectedProduct.description
                  : "Un supplément de haute qualité, rigoureusement sélectionné par nos experts cliniques pour ses propriétés biologiques exceptionnelles et sa biodisponibilité optimale."}
              </p>

              <div className="space-y-2.5 mt-auto">
                <button
                  onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                  className="w-full bg-neo hover:bg-neo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-neo/25 active:scale-[0.98]"
                >
                  <ShoppingCart size={17} />
                  Ajouter au panier — {selectedProduct.price} $
                </button>
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={11} className="text-gray-400" />
                  Paiement 100% sécurisé via Moneris
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── TOAST PANIER ───── */}
      <div
        className={`fixed bottom-6 right-6 z-[200] transition-all duration-500 ${
          cartToast.visible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 min-w-[260px] max-w-xs border border-white/5">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <CheckCircle size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-green-400 uppercase tracking-wider mb-0.5">Ajouté au panier !</p>
            <p className="text-xs font-semibold text-gray-200 truncate">{cartToast.name}</p>
          </div>
          <ShoppingCart size={15} className="text-gray-500 flex-shrink-0" />
        </div>
      </div>

      {/* ───── CTA CONSEIL ───── */}
      <Section background="dark" className="text-center rounded-t-[3rem]">
        <h2 className="text-3xl md:text-4xl font-bold mb-5">Besoin d'aide pour choisir ?</h2>
        <p className="text-gray-400 mb-10 max-w-xl mx-auto text-base leading-relaxed">
          Ne devinez pas vos besoins nutritionnels. Nos experts analysent votre biochimie et vous recommandent le protocole exact pour vos objectifs.
        </p>
        <Button to="/consultation" variant="primary" className="px-10 py-4 text-base">
          Consulter un expert <ArrowRight className="ml-2" size={18} />
        </Button>
      </Section>
    </>
  );
};

export default Shop;
