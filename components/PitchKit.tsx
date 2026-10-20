'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import {
  PRIX_NORMAL,
  PRIX_PROMO,
  PRIX_REGULIER,
  PROMO_FIN,
  PROMO_NOM,
  PROMO_VALIDITE,
} from '@/lib/promoDecouverte';

/*
 * Kit de révélation partagé par les pages de vente privées (/protocole-neo,
 * /mon-dossier), durci pour la présentation : mouvements courts (0.45s, 16px)
 * et PRÉ-DÉCLENCHEMENT — la révélation démarre quand l'élément approche à 20 %
 * sous le bord de l'écran, donc le texte est déjà en train d'apparaître quand
 * il devient visible. Détection par simple mesure au scroll (pas
 * d'IntersectionObserver) : zéro cas limite où un bloc resterait invisible.
 */

export const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

function useRevealOnce<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 1.2) {
        setVisible(true);
        window.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
      }
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [ref]);
  return visible;
}

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export function Reveal({ children, className, delay = 0, y = 16 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const visible = useRevealOnce(ref);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.45, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  gap = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const visible = useRevealOnce(ref);
  if (reduce) return <div className={className}>{children}</div>;
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: gap } },
  };
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={container}
      initial="hidden"
      animate={visible ? 'show' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 16 }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const item: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  };
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] ${
        light ? 'text-neo-200' : 'text-neo-600'
      }`}
    >
      <span className="h-px w-8 bg-current opacity-60" />
      {children}
      <span className="h-px w-8 bg-current opacity-60" />
    </span>
  );
}

export const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/*
 * Carte de prix du programme. `promoActive` est calculé côté serveur à chaque
 * requête (pas de flash au chargement) ; un minuteur coupe aussi la promo si
 * la page reste ouverte au moment où elle expire.
 */
export function PrixProgramme({ promoActive: promoInitiale }: { promoActive: boolean }) {
  const [promoActive, setPromoActive] = useState(promoInitiale);

  useEffect(() => {
    if (!promoActive) return;
    const reste = PROMO_FIN.getTime() - Date.now();
    if (reste <= 0) {
      setPromoActive(false);
      return;
    }
    // setTimeout plafonne à ~24,8 jours ; au-delà on laisse le serveur décider.
    if (reste > 2_000_000_000) return;
    const t = setTimeout(() => setPromoActive(false), reste);
    return () => clearTimeout(t);
  }, [promoActive]);

  return (
    <>
      <div className="relative mt-10 w-full max-w-xl rounded-2xl border border-neo-500 bg-white/5 px-8 py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:-translate-y-1 md:px-14">
        {promoActive && (
          <span className="absolute -top-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-neo-500 px-5 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_10px_25px_rgba(0,187,177,0.45)]">
            Promotion · {PROMO_NOM}
          </span>
        )}
        {promoActive && (
          <div className="mb-2 text-2xl font-bold text-gray-400 line-through decoration-neo-500 decoration-2">
            {PRIX_NORMAL}
          </div>
        )}
        <div className="flex flex-wrap items-baseline justify-center gap-3">
          <span className="text-6xl font-extrabold tracking-tight md:text-7xl">
            {promoActive ? PRIX_PROMO : PRIX_REGULIER}
          </span>
          <span className="text-gray-400">+ taxes applicables</span>
        </div>
        <div className="mt-3 text-lg font-semibold text-neo-400">
          Paiement unique (meilleur rapport qualité/prix)
        </div>
        {promoActive && (
          <div className="mt-4 text-sm font-semibold uppercase tracking-wider text-neo-200">
            {PROMO_VALIDITE}
          </div>
        )}
      </div>
      {/* Pendant la promo, 2 799 $ est déjà barré dans la carte : pas de doublon. */}
      {!promoActive && (
        <p className="mt-6 italic text-gray-400">Programme normalement à {PRIX_NORMAL}</p>
      )}
    </>
  );
}
