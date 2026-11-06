'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, CircleCheck, ArrowRight } from 'lucide-react';
import { isPromoDeuxiemeActive } from '../lib/promo-deuxieme-50';

/**
 * Pop-up « 2e produit à -50 % » (Black Friday).
 *
 * - Apparaît après 10 s passées sur le site (le compteur continue d'une page à l'autre).
 * - UNE SEULE FOIS par visiteur : marqué « vu » dès l'affichage (localStorage), pour
 *   qu'il ne revienne pas lors des visites suivantes — même si la personne quitte sans
 *   cliquer. (Nouvel appareil / navigateur ou données effacées → revu une fois.)
 * - Seulement sur les pages vitrines : pas sur la boutique, le panier ni le paiement
 *   (la personne magasine déjà), ni sur les pages de vente / prise de rendez-vous.
 * - Attend le choix de la bannière cookies (Loi 25) pour ne pas se superposer à elle,
 *   avec un repli si la bannière est ignorée — même logique que le pop-up Léo.
 * - S'arrête tout seul à la fin de la promotion (même date que le rabais).
 */

const SEEN_KEY = 'neo_promo_deuxieme_50_vu';
const COOKIE_KEY = 'neo_cookie_consent';
const DELAY_MS = 10_000;
const COOKIE_FALLBACK_MS = 20_000;
const IMAGE_SRC = '/promo-2e-produit-50.jpg';

const SHOWCASE_PAGES = new Set(['/', '/approche', '/equipe', '/contact', '/temoignages']);
const isShowcasePage = (pathname: string | null): boolean =>
  !!pathname && (SHOWCASE_PAGES.has(pathname) || pathname === '/blog' || pathname.startsWith('/blog/'));

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false; // stockage bloqué (navigation privée) → au plus une fois par visite
  }
}

export default function PromoPopup() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false); // délai écoulé ET cookies réglés
  const [open, setOpen] = useState(false);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // 1) Compte à rebours, une seule fois au chargement du site.
  useEffect(() => {
    if (!isPromoDeuxiemeActive() || alreadySeen()) return;

    // Pré-charge l'image pour qu'elle soit prête à l'ouverture (pas d'écran blanc).
    const preload = new window.Image();
    preload.src = IMAGE_SRC;

    let cookieDecided = true;
    try {
      cookieDecided = !!localStorage.getItem(COOKIE_KEY);
    } catch { /* si on ne peut pas savoir, on ne bloque pas */ }

    let elapsed = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const check = () => { if (elapsed && cookieDecided) setReady(true); };

    timers.push(setTimeout(() => { elapsed = true; check(); }, DELAY_MS));

    const onCookieResolved = () => {
      timers.push(setTimeout(() => { cookieDecided = true; check(); }, 500));
    };
    if (!cookieDecided) {
      window.addEventListener('neo:cookie-consent-resolved', onCookieResolved);
      // Repli : bannière ignorée → on affiche quand même.
      timers.push(setTimeout(() => { cookieDecided = true; check(); }, COOKIE_FALLBACK_MS));
    }

    return () => {
      window.removeEventListener('neo:cookie-consent-resolved', onCookieResolved);
      timers.forEach(clearTimeout);
    };
  }, []);

  // L'onglet est-il affiché ? Si le visiteur est sur un autre onglet quand les 10 s
  // tombent, on attend son retour : sinon le pop-up serait marqué « vu » sans être vu.
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === 'visible');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  // 2) Ouverture dès qu'on est prêt, onglet affiché, ET sur une page vitrine (sinon on
  //    attend d'y revenir).
  useEffect(() => {
    if (!ready || !pageVisible || !isShowcasePage(pathname) || !isPromoDeuxiemeActive()) return;
    setReady(false);
    if (alreadySeen()) return; // vu entre-temps dans un autre onglet
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch { /* ignore */ }
    setOpen(true);
  }, [ready, pageVisible, pathname]);

  // 3) Pendant l'ouverture : Échap ferme, la page derrière ne défile pas.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ctaRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-gray-950/60"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-popup-titre"
    >
      <div className="relative w-full max-w-[520px] pt-12" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute top-0 right-0 w-10 h-10 rounded-full bg-white/95 text-gray-900 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Pas d'animation d'entrée (départ à opacité 0) : si le navigateur la met en pause
            (onglet en arrière-plan, économie d'énergie), le pop-up resterait invisible. */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- image locale déjà optimisée (126 Ko), pré-chargée */}
          <img
            src={IMAGE_SRC}
            width={1040}
            height={544}
            alt="Black Friday : achètes-en un, obtiens le deuxième à 50 % sur les suppléments en ligne ou en clinique."
            className="block w-full h-auto aspect-[1040/544] object-cover"
          />
          <div className="px-6 pt-5 pb-5 text-center">
            <h2 id="promo-popup-titre" className="sr-only">Le 2e produit à 50 %</h2>
            <span className="inline-flex items-center gap-2 bg-neo-50 text-neo-700 font-semibold text-sm px-3.5 py-2 rounded-full">
              <CircleCheck size={18} className="shrink-0" />
              Aucun code promo nécessaire
            </span>
            <p className="mt-3 mb-5 text-sm leading-relaxed text-gray-500">
              Ajoute deux produits à ton panier : le rabais s&apos;applique automatiquement sur le moins cher. Jusqu&apos;au 30 novembre.
            </p>
            <Link
              ref={ctaRef}
              href="/boutique"
              onClick={close}
              className="flex items-center justify-center gap-2 w-full bg-neo hover:bg-neo-600 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-neo/25 transition-colors"
            >
              Magasiner maintenant <ArrowRight size={18} />
            </Link>
            <button
              type="button"
              onClick={close}
              className="mt-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Non merci
            </button>
            <p className="mt-1 text-[11px] text-gray-400">
              Cartes-cadeaux exclues. Non cumulable avec les autres rabais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
