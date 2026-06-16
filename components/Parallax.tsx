'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

/**
 * Parallaxe subtile : l'élément dérive doucement pendant le scroll.
 * À placer DANS un conteneur `overflow-hidden` (et donner un enfant légèrement
 * surdimensionné, ex. `scale-110`) pour qu'aucun bord ne se découvre.
 */
type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  /** Amplitude du déplacement vertical en px (de +amount à -amount). */
  amount?: number;
};

export function Parallax({ children, className, amount = 30 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);

  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
