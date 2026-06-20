'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Section from '../components/Section';
import Button from '../components/Button';
import { GHLProduct } from '../data/ghlProducts';
import { useGHLProducts } from '../hooks/useGHLProducts';
import { useCart } from '../contexts/CartContext';
import { useClientStatus } from '../hooks/useClientStatus';
import { SHOP_CATEGORIES, NEO_ACCOMPANIMENT_CATEGORY, prixClient, isClientDiscountEligible, GIFT_CARD_PRODUCT_ID, GIFT_CARD_MAX_CLIENT_DISCOUNT } from '../constants';
import { OPEN_LEO_ADVISOR_EVENT } from '../components/Chatbot';
import {
  Search, ArrowRight, Truck, ShieldCheck, ShoppingCart,
  Loader2, AlertCircle, CheckCircle, X, Leaf, ChevronDown, SlidersHorizontal,
  Sparkles, MessageCircle,
} from 'lucide-react';

const LEO_POPUP_SEEN_KEY = 'neo_leo_advisor_popup_seen';

const fmt = (n: number) => n.toFixed(2);

// Prix sur la carte produit — compact. Montre le prix client comme appât pour
// les visiteurs, ou le prix client appliqué (régulier barré) pour les clients.
// noDiscount = true pour les produits d'accompagnement (prix fixe, aucun rabais).
// variablePrefix = true pour les produits à variantes → préfixe « Dès » (prix de départ).
const CardPriceTag: React.FC<{ regular: number; isClient: boolean; noDiscount?: boolean; variablePrefix?: boolean; giftCardUpTo?: number }> = ({ regular, isClient, noDiscount, variablePrefix, giftCardUpTo }) => {
  const client = prixClient(regular);
  const Prefix = variablePrefix ? <span className="text-[10px] font-semibold text-gray-400 mr-0.5">Dès</span> : null;
  // Carte-cadeau : appât « Client · jusqu'à −X $ » (rabais fixe variable selon le montant).
  if (giftCardUpTo) {
    return (
      <div className="flex flex-col leading-none gap-1.5">
        <span className="text-lg font-extrabold text-gray-900 tracking-tight">{Prefix}{fmt(regular)} $</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neo whitespace-nowrap">
          <Sparkles size={10} className="shrink-0" />
          Client&nbsp;· jusqu'à&nbsp;−{Math.round(giftCardUpTo)}&nbsp;$
        </span>
      </div>
    );
  }
  if (noDiscount) {
    return (
      <div className="flex flex-col leading-none gap-1">
        <span className="text-lg font-extrabold text-gray-900 tracking-tight">{Prefix}{fmt(regular)} $</span>
      </div>
    );
  }
  if (isClient) {
    return (
      <div className="flex flex-col leading-none gap-1">
        <span className="text-[11px] font-medium text-gray-400 line-through">{fmt(regular)} $</span>
        <span className="text-lg font-extrabold text-neo tracking-tight">{Prefix}{fmt(client)} $</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col leading-none gap-1.5">
      <span className="text-lg font-extrabold text-gray-900 tracking-tight">{Prefix}{fmt(regular)} $</span>
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neo whitespace-nowrap">
        <Sparkles size={10} className="shrink-0" />
        Client&nbsp;{fmt(client)}&nbsp;$
      </span>
    </div>
  );
};

const Shop: React.FC<{ initialProducts?: GHLProduct[] }> = ({ initialProducts }) => {
  const { products, loading, error } = useGHLProducts(initialProducts);
  const { addItem } = useCart();
  const { isClient } = useClientStatus();
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [cartToast, setCartToast] = useState<{ name: string; visible: boolean }>({ name: '', visible: false });
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [leoPopupOpen, setLeoPopupOpen] = useState(false);

  // Pop-up d'accueil « Besoin d'aide pour choisir ? » — affiché une seule fois (jamais re-proposé).
  // On l'affiche APRÈS la bannière cookies (Loi 25) pour éviter qu'elles se télescopent.
  // Si le stockage est inaccessible (navigation privée), on l'affiche quand même.
  React.useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(LEO_POPUP_SEEN_KEY) === '1';
    } catch { /* stockage bloqué → on affiche quand même */ }
    if (alreadySeen) return;

    let cookieDecided = false;
    try {
      cookieDecided = !!localStorage.getItem('neo_cookie_consent');
    } catch { cookieDecided = true; /* si on ne peut pas savoir, on ne bloque pas le pop-up */ }

    let shown = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const show = (delay: number) => {
      timers.push(setTimeout(() => {
        if (!shown) { shown = true; setLeoPopupOpen(true); }
      }, delay));
    };

    if (cookieDecided) {
      // Cookies déjà gérés → on montre le pop-up rapidement
      show(900);
      return () => timers.forEach(clearTimeout);
    }

    // Cookies pas encore décidés → on attend le choix, avec un repli si la bannière est ignorée
    const onCookieResolved = () => show(500);
    window.addEventListener('neo:cookie-consent-resolved', onCookieResolved);
    show(9000); // repli : si l'utilisateur ignore la bannière, on affiche quand même

    return () => {
      window.removeEventListener('neo:cookie-consent-resolved', onCookieResolved);
      timers.forEach(clearTimeout);
    };
  }, []);

  const dismissLeoPopup = () => {
    setLeoPopupOpen(false);
    try { localStorage.setItem(LEO_POPUP_SEEN_KEY, '1'); } catch { /* ignore */ }
  };

  const openLeoAdvisor = () => {
    dismissLeoPopup();
    // On transmet le catalogue SSR (déjà chargé côté serveur) à Léo via l'événement.
    // Ainsi le conseiller a TOUJOURS le catalogue, sans dépendre de son propre
    // fetch /api/products (qui peut échouer/être lent selon l'hôte déployé).
    window.dispatchEvent(new CustomEvent(OPEN_LEO_ADVISOR_EVENT, { detail: { products } }));
  };

  // Catégories canoniques, dans l'ordre défini, en ne gardant que celles qui ont des produits.
  // "Accompagnement NEO" n'est visible que pour les clients connectés.
  const present = new Set(products.map((p) => p.category));
  const categories = ["Tout", ...SHOP_CATEGORIES.filter((c) => {
    if (c === NEO_ACCOMPANIMENT_CATEGORY && !isClient) return false;
    return present.has(c);
  })];

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const filteredProducts = products.filter(product => {
    if (product.category === NEO_ACCOMPANIMENT_CATEGORY && !isClient) return false;
    const matchCategory = activeCategory === "Tout" || product.category === activeCategory;
    const matchSearch = normalize(product.name).includes(normalize(searchQuery));
    return matchCategory && matchSearch;
  });

  const hasVariations = (p: GHLProduct) => !!p.variations?.length;

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
                Testés en Clinique
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.05] mb-3">
                Boutique<br />
                <span className="text-neo">NEO</span>
              </h1>
              <p className="text-gray-500 max-w-md text-sm leading-relaxed mt-2">
                Des suppléments recommandés par nos naturopathes, disponibles en ligne partout au Québec. Sélectionnés pour leur pureté, leur biodisponibilité et leurs résultats mesurables.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mb-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100">
                <Truck size={15} className="text-neo" /> Expédition 24/48h
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-neo bg-neo-50/70 px-4 py-2.5 rounded-full border border-neo/15">
                <Truck size={15} className="text-neo" /> Livraison gratuite dès 100 $
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100">
                <ShieldCheck size={15} className="text-neo" /> Checkout Sécurisé
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── FILTRES & RECHERCHE ───── */}
      <div className="bg-white border-b border-gray-100 py-5 md:py-6">
        <div className="max-w-3xl mx-auto px-5">
          {/* ── MOBILE : sélecteur compact de catégorie ── */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setCatMenuOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded-2xl bg-gray-100 text-sm font-bold text-gray-800 active:scale-[0.99] transition-transform"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <SlidersHorizontal size={16} className="text-neo flex-shrink-0" />
                <span className="truncate">
                  {activeCategory === 'Tout' ? 'Toutes les catégories' : activeCategory}
                </span>
              </span>
              <ChevronDown size={18} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${catMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {catMenuOpen && (
              <div className="mt-2 flex flex-col gap-1 bg-white border border-gray-100 rounded-2xl p-2 shadow-lg shadow-gray-200/60 animate-fade-in">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setCatMenuOpen(false); }}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      activeCategory === cat
                        ? 'bg-neo text-white'
                        : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    {cat === 'Tout' ? 'Toutes les catégories' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── DESKTOP : pastilles, toutes visibles d'un coup ── */}
          <div className="hidden md:flex flex-wrap justify-center gap-2.5 mb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold leading-none transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-neo text-white shadow-md shadow-neo/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Recherche — pleine largeur, sous les catégories */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none text-sm transition-all"
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
                  <Link
                    key={product.id}
                    href={`/boutique/${product.slug}`}
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
                        decoding="async"
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
                      <div className="mt-auto flex items-end justify-between gap-2 pt-3 border-t border-gray-50">
                        <CardPriceTag regular={parseFloat(product.price)} isClient={isClient} noDiscount={!isClientDiscountEligible(product.name)} variablePrefix={hasVariations(product)} giftCardUpTo={product.id === String(GIFT_CARD_PRODUCT_ID) ? GIFT_CARD_MAX_CLIENT_DISCOUNT : undefined} />
                        <button
                          onClick={(e) => {
                            // Produit à variantes : on laisse le lien naviguer vers la
                            // fiche pour choisir. Produit simple : ajout direct au panier.
                            if (hasVariations(product)) return;
                            e.preventDefault();
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
                            : hasVariations(product)
                              ? <><SlidersHorizontal size={13} /> Choisir</>
                              : <><ShoppingCart size={13} /> Ajouter</>
                          }
                        </button>
                      </div>
                    </div>
                  </Link>
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

      {/* ───── POP-UP ACCUEIL CONSEIL LÉO ───── */}
      {leoPopupOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismissLeoPopup} />
          <div className="relative z-10 bg-white rounded-[1.75rem] w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <button
              onClick={dismissLeoPopup}
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 bg-white/70 hover:bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            {/* Bandeau Léo */}
            <div className="bg-gradient-to-br from-neo to-neo/80 px-7 pt-7 pb-9 text-center relative">
              <div className="relative inline-block mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-black text-2xl shadow-lg ring-1 ring-white/20">
                  L
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-neo" />
              </div>
              <p className="text-white font-bold text-sm">Léo · Conseiller en suppléments</p>
              <p className="text-white/70 text-xs mt-0.5">Sélectionné par nos naturopathes</p>
            </div>

            {/* Carte de contenu qui chevauche le bandeau */}
            <div className="px-7 pt-6 pb-7 -mt-4 bg-white rounded-t-[1.75rem] relative text-center">
              <h3 className="text-[1.35rem] font-bold text-gray-900 mb-2.5 leading-snug">
                Besoin d'aide pour choisir tes suppléments ?
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Réponds à 2-3 questions rapides et Léo te recommande les produits parfaits pour <span className="text-gray-700 font-semibold">tes objectifs</span> — en moins d'une minute.
              </p>

              <div className="flex items-center justify-center gap-4 mb-6 text-[11px] font-semibold text-gray-400">
                <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-neo" /> Personnalisé</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-neo" /> Sans engagement</span>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={openLeoAdvisor}
                  className="w-full bg-neo hover:bg-neo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-neo/25 active:scale-[0.98]"
                >
                  <MessageCircle size={17} /> Oui, demande à Léo
                </button>
                <button
                  onClick={dismissLeoPopup}
                  className="w-full text-gray-400 hover:text-gray-700 font-semibold text-sm py-1.5 transition-colors"
                >
                  Non merci, je regarde par moi-même
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── BOUTON PERMANENT « CONSEIL LÉO » (remplace la bulle support à droite) ───── */}
      <button
        onClick={openLeoAdvisor}
        className="fixed bottom-6 right-6 z-[120] flex items-center gap-2 bg-neo hover:bg-neo-600 text-white font-bold text-sm pl-4 pr-5 py-3.5 rounded-full shadow-2xl shadow-neo/30 hover:scale-105 transition-all active:scale-95"
      >
        <Sparkles size={17} /> Conseil de Léo
      </button>

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
