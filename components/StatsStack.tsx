'use client';

import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';
import { Award, Users, Star, Gauge, type LucideIcon } from 'lucide-react';
import Counter from './Counter';
import { STATS } from '../constants';
import type { Stat } from '../types';

// Icône + petite ligne de contexte pour chaque stat (même ordre que STATS).
const META: { icon: LucideIcon; sub: string }[] = [
  { icon: Award, sub: 'en santé métabolique' },
  { icon: Users, sub: 'à reprendre le contrôle' },
  { icon: Star, sub: 'de clients satisfaits' },
  { icon: Gauge, sub: 'Google & Facebook' },
];

/**
 * Section "stats" en pile (sticky stacking cards) :
 * la section se fige plein écran, et chaque bloc de stat monte par-dessus le
 * précédent au rythme du scroll, en laissant voir le haut des blocs en dessous.
 * Une fois la pile complète, la page reprend son défilement.
 * Minimaliste, aux couleurs NEO. Respecte prefers-reduced-motion.
 */

const PEEK = 8; // vh : hauteur visible du haut de chaque bloc empilé
const HOLD = 0.14; // portion finale figée avant que la page reparte
// Hauteur de la piste de scroll (plus petit = plus rapide).
const TRACK_VH = 250;

function StatCard({
  stat,
  index,
  total,
  progress,
}: {
  stat: Stat;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const usable = 1 - HOLD;
  const seg = usable / Math.max(total - 1, 1);
  const start = (index - 1) * seg;
  const end = index * seg;
  // Position de repos : la pile est centrée verticalement, chaque bloc décalé de PEEK.
  const rest = (index - (total - 1) / 2) * PEEK;
  const y = useTransform(progress, [start, end], ['115vh', `${rest}vh`], {
    clamp: true,
  });
  const { icon: Icon, sub } = META[index] ?? META[0];

  return (
    <div
      className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4"
      style={{ zIndex: index + 1 }}
    >
      <motion.div
        style={{ y }}
        className="w-full max-w-xl h-[40vh] min-h-[300px] bg-white rounded-[2rem] border border-gray-100 border-t-[3px] border-t-neo shadow-[0_-14px_50px_-20px_rgba(0,0,0,0.3)] px-8 md:px-14 flex flex-col items-center justify-center text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-neo/10 text-neo flex items-center justify-center mb-6">
          <Icon size={26} strokeWidth={2.2} />
        </div>
        <Counter
          end={stat.value}
          prefix={stat.prefix}
          suffix={stat.suffix}
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 tracking-tight leading-none"
        />
        <div className="flex items-center gap-2.5 mt-4 text-neo">
          <span className="w-2 h-2 rounded-full bg-neo" />
          <span className="text-xs md:text-sm font-bold uppercase tracking-[0.2em]">
            {stat.label}
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-2">{sub}</p>
      </motion.div>
    </div>
  );
}

export default function StatsStack() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Version sans mouvement : simple grille.
  if (reduce) {
    return (
      <div className="bg-neo-50 py-16">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat, i) => (
            <div key={i}>
              <Counter
                end={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="text-4xl md:text-5xl font-bold text-gray-900 block mb-2"
              />
              <p className="text-neo-700 font-bold uppercase tracking-widest text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative bg-neo-50"
      style={{ height: `${TRACK_VH}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {STATS.map((stat, i) => (
          <StatCard
            key={i}
            stat={stat}
            index={i}
            total={STATS.length}
            progress={scrollYProgress}
          />
        ))}
      </div>
    </section>
  );
}
