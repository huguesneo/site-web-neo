'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';

/**
 * Kit de révélation au scroll (style "Jeton") — fondu + glissé fluide.
 * Respecte prefers-reduced-motion : si l'utilisateur le demande, aucun mouvement.
 *
 * Déclenchement via IntersectionObserver natif (même mécanisme éprouvé que
 * <Section> et <Counter>), fiable y compris quand l'élément est déjà visible
 * au chargement.
 *
 * - <Reveal> : révèle un bloc unique quand il entre dans l'écran.
 * - <Stagger> + <StaggerItem> : révèle une liste/grille en cascade.
 */

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

function useInViewOnce<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Décalage de départ en px (sens du glissé). */
  y?: number;
};

export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInViewOnce(ref);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  /** Intervalle entre chaque enfant (s). */
  gap?: number;
};

export function Stagger({ children, className, gap = 0.12 }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInViewOnce(ref);
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
      animate={inView ? 'show' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 28 }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const item: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
