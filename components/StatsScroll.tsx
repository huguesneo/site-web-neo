'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Award, Users, Star, BarChart3, type LucideIcon } from 'lucide-react';
import Counter from './Counter';

/**
 * Section "NEO en chiffres" — compacte (on voit les sections voisines).
 * Quand la section entre à l'écran, 4 encadrés apparaissent un par un dans le
 * sens horaire (haut-gauche → haut-droite → bas-droite → bas-gauche). Le titre
 * correspondant à gauche passe au blanc au même moment et y reste. L'animation
 * s'arrête une fois les 4 affichés. Sur mobile : chaque carte sous son titre.
 * Respecte prefers-reduced-motion.
 */

type Stat = {
  title: string;
  sub: string;
  icon: LucideIcon;
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
  cardSub: string;
  stars?: boolean;
};

const STATS: Stat[] = [
  {
    title: 'Plus de 11 ans à tes côtés',
    sub: 'Une décennie d’expertise en optimisation métabolique.',
    icon: Award,
    value: 11,
    suffix: ' ans',
    label: 'd’expertise',
    cardSub: 'Raffinée année après année.',
  },
  {
    title: '15 000 personnes accompagnées',
    sub: 'Au Québec, en clinique comme en ligne.',
    icon: Users,
    value: 15000,
    suffix: '+',
    label: 'personnes aidées',
    cardSub: 'Au Québec et en ligne.',
  },
  {
    title: '4 000 avis 5 étoiles',
    sub: 'Une communauté qui partage ses résultats et recommande NEO.',
    icon: Star,
    value: 4000,
    suffix: '+',
    label: 'avis 5 étoiles',
    cardSub: 'Une communauté fidèle.',
  },
  {
    title: '4,9 / 5 de satisfaction',
    sub: 'La note moyenne de nos clients, vérifiée et constante.',
    icon: Star,
    value: 4.9,
    decimals: 1,
    suffix: '/5',
    label: 'note moyenne',
    cardSub: 'Sur Google & Facebook.',
    stars: true,
  },
];

// Placement dans la grille 2×2 (haut-gauche, haut-droite, bas-gauche, bas-droite).
// L'ordre de révélation suit l'index (0→1→2→3) = horaire : HG → HD → BD → BG.
const GRID_ORDER = [0, 1, 3, 2];

/* ---------- Encadré ---------- */

function GridCard({ stat, revealed, className = '' }: { stat: Stat; revealed: boolean; className?: string }) {
  const Icon = stat.icon;
  return (
    <motion.div
      className={className}
      initial={false}
      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 26, scale: 0.94 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative h-full rounded-2xl bg-white px-5 py-6 shadow-[0_22px_55px_-28px_rgba(0,0,0,0.6)] ring-1 ring-black/5 flex flex-col items-center justify-center text-center">
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-full bg-neo/70" />
        {stat.stars ? (
          <div className="flex gap-0.5 text-yellow-400 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
        ) : (
          <div className="w-11 h-11 rounded-xl bg-neo/10 text-neo flex items-center justify-center mb-3">
            <Icon size={20} strokeWidth={2.2} />
          </div>
        )}
        <div className="flex items-baseline">
          <Counter
            end={stat.value}
            suffix={stat.suffix}
            decimals={stat.decimals}
            className="text-4xl md:text-5xl font-bold text-gray-900 leading-none tracking-tight"
          />
        </div>
        <p className="mt-3 text-neo font-bold uppercase tracking-[0.18em] text-[11px]">{stat.label}</p>
        <p className="mt-1.5 text-gray-400 text-xs max-w-[14rem]">{stat.cardSub}</p>
      </div>
    </motion.div>
  );
}

/* ---------- Titre de la liste ---------- */

function TitleRow({ stat, revealed }: { stat: Stat; revealed: boolean }) {
  return (
    <div className="relative pl-5 py-2.5">
      <span
        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full transition-colors duration-500 ${
          revealed ? 'bg-neo' : 'bg-white/10'
        }`}
      />
      <h3
        className={`text-xl md:text-2xl font-bold transition-colors duration-500 ${
          revealed ? 'text-white' : 'text-white/40'
        }`}
      >
        {stat.title}
      </h3>
      <p className="text-gray-400 text-sm mt-1 max-w-sm">{stat.sub}</p>
    </div>
  );
}

/* ---------- Section ---------- */

export default function StatsScroll() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [step, setStep] = useState(0);

  // Déclenche la séquence quand la section entre à l'écran.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Avance les étapes une par une, puis s'arrête.
  useEffect(() => {
    if (reduce) {
      setStep(4);
      return;
    }
    if (!inView || step >= 4) return;
    // Délai > durée d'anim (0.5s) pour qu'une carte soit complètement arrivée
    // avant que la suivante démarre (transition bien fluide, sans chevauchement).
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 450 : 780);
    return () => clearTimeout(t);
  }, [inView, step, reduce]);

  return (
    <section ref={ref} className="relative bg-[#0B1120] text-white py-20 md:py-28 overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neo/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
        {/* En-tête */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm font-medium mb-7">
          <BarChart3 size={15} className="text-neo" /> En chiffres
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-end mb-12 md:mb-14">
          <h2 className="text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight">
            Voici NEO Performance<br />en chiffres
          </h2>
          <p className="text-gray-400 text-lg lg:pb-2 lg:max-w-md">
            Plus qu’une clinique : une méthode éprouvée et une communauté,
            portées par celles et ceux qui la vivent.
          </p>
        </div>

        {/* Desktop : liste à gauche + grille 2×2 à droite */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-1">
            {STATS.map((stat, i) => (
              <TitleRow key={i} stat={stat} revealed={step > i} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5">
            {GRID_ORDER.map((s) => (
              <GridCard key={s} stat={STATS[s]} revealed={step > s} className="h-[210px]" />
            ))}
          </div>
        </div>

        {/* Mobile : chaque carte sous son titre */}
        <div className="lg:hidden flex flex-col gap-8">
          {STATS.map((stat, i) => (
            <div key={i}>
              <h3
                className={`text-xl font-bold transition-colors duration-500 ${
                  step > i ? 'text-white' : 'text-white/40'
                }`}
              >
                {stat.title}
              </h3>
              <p className="text-gray-400 text-sm mt-1">{stat.sub}</p>
              <GridCard stat={stat} revealed={step > i} className="mt-4 h-[180px]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
