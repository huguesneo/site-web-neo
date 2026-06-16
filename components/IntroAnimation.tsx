'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Animation d'intro "wow" :
 *  1. Sur fond sombre, le logo NEO se dessine pièce par pièce (flèche teal + "neo" en blanc).
 *  2. Zoom 3D qui plonge dans la lettre "o" jusqu'à un écran 100% blanc.
 *  3. Le blanc s'efface et révèle le site (transition fluide).
 * Une seule fois par session, accueil seulement, respecte prefers-reduced-motion.
 */

const TEAL = '#01BCB1';
const WHITE = '#FFFFFF';
const STAGE_BG = '#0F0F0F';
const SESSION_KEY = 'neo_intro_seen';

type Piece = { d: string; transform: string; color: string; delay: number };

const PIECES: Piece[] = [
  // Flèche teal — apex puis base (logo neo.svg)
  {
    d: 'm0 0h8l9 3 10 9 14 25 10 17 45 78 14 24 16 28 30 52 14 24 10 17v3h-62l-6-9-16-28-14-24-16-28-14-24-16-28-15-26-14-24-3-5-6 9-14 25-14 24-30 52-14 24-16 28-14 24-6 10h-62v-3l15-27 14-24 15-26 14-24 16-28 14-24 30-52 16-28 15-26 7-10 9-6z',
    transform: 'translate(537,143)',
    color: TEAL,
    delay: 0.1,
  },
  {
    d: 'm0 0h62l1 2-15 26-14 24-16 28-14 24-15 26-12 21h659l-11-20-14-24-15-26-16-28-15-26-14-24v-3h62l6 9 16 28 75 130 2 6v11l-4 9-7 8-8 4-5 1h-763l-11-4-6-5-5-8-1-3v-15l8-16 30-52 14-24 16-28 14-24 15-26z',
    transform: 'translate(232,647)',
    color: TEAL,
    delay: 0.3,
  },
  // "neo" en blanc (lettres du logoneo.svg)
  {
    d: 'm0 0h24l15 4 13 7 12 11 7 11 5 12 3 13v117l-4 2h-18l-4-4-1-111-4-12-6-10-9-8-11-5-7-2h-20l-14 4-10 6-8 7-7 11-4 11-1 110-3 3h-21l-2-1v-171l3-2h12l4 4 4 27 1 1 6-9 7-8 13-9 16-7z',
    transform: 'translate(331,444)',
    color: WHITE,
    delay: 0.7,
  },
  {
    d: 'm0 0h20l15 3 13 5 12 7 11 9 11 14 7 15 4 15 1 7v14l-4 8-3 3-3 1h-135l4 15 6 11 9 11 10 7 10 5 16 4h17l14-3 12-5 10-7 3-2h5l11 15-1 5-8 7-15 8-18 6-12 2h-22l-17-4-12-5-12-7-11-9-11-13-7-12-5-13-3-14v-27l5-19 8-16 8-11 11-11 10-7 14-7 15-4zm-1 25-11 3-14 7-11 10-9 14-4 11-1 7h119l-1-10-5-13-9-12-11-9-11-5-12-3z',
    transform: 'translate(528,444)',
    color: WHITE,
    delay: 0.85,
  },
  {
    d: 'm0 0h20l16 3 13 5 11 6 9 7 8 7 9 12 8 15 5 17 1 6v25l-4 17-5 11-7 12-9 11-11 9-11 7-14 6-12 3-7 1h-20l-16-3-14-5-15-9-12-11-7-8-8-13-6-15-3-15v-23l4-17 5-12 7-12 12-13 8-7 14-8 12-5 12-3zm2 25-16 4-14 7-12 11-9 14-5 15-1 7v13l3 15 5 12 9 12 10 9 16 8 13 3h17l16-4 13-7 10-9 6-7 8-16 3-13v-17l-4-16-7-14-11-12-8-6-10-5-16-4z',
    transform: 'translate(732,444)',
    color: WHITE,
    delay: 1.0,
  },
];

export default function IntroAnimation() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<'draw' | 'zoom'>('draw');

  // 1) Décide UNE fois s'il faut jouer l'intro (idempotent vis-à-vis du Strict Mode).
  useEffect(() => {
    const force = new URLSearchParams(window.location.search).has('intro');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (force || (!reduced && !seen)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setShow(true);
    }
  }, []);

  // 2) Pilote les phases seulement quand l'intro est visible ; nettoie ses propres timers.
  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = 'hidden';
    document.getElementById('neo-intro-precover')?.remove();

    const t1 = setTimeout(() => setPhase('zoom'), 1750);
    const t2 = setTimeout(() => setShow(false), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = '';
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-hidden"
          // Fond sombre qui s'efface en douceur pendant le zoom pour révéler le site.
          style={{ backgroundColor: STAGE_BG }}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'zoom' ? 0 : 1 }}
          transition={{ duration: 0.7, ease: [0.5, 0, 0.2, 1] }}
          onClick={() => setPhase('zoom')}
        >
          <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1600 }}>
            {/* Logo : se dessine, puis zoom centré et uniforme qui plonge vers l'écran */}
            <motion.div
              className="w-[58vmin] max-w-[420px]"
              style={{ transformOrigin: 'center center', willChange: 'transform, opacity' }}
              animate={
                phase === 'zoom'
                  ? { scale: 9, opacity: 0 }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.85, ease: [0.6, 0, 0.4, 1] }}
            >
              <svg viewBox="0 0 1080 1080" className="w-full h-full">
                {PIECES.map((p, i) => (
                  <g key={i} transform={p.transform}>
                    <motion.path
                      d={p.d}
                      fill={p.color}
                      stroke={p.color}
                      strokeWidth={3.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, fillOpacity: 0 }}
                      animate={{ pathLength: 1, fillOpacity: 1 }}
                      transition={{
                        pathLength: { delay: p.delay, duration: 0.55, ease: [0.65, 0, 0.35, 1] },
                        fillOpacity: { delay: p.delay + 0.35, duration: 0.3, ease: 'easeOut' },
                      }}
                    />
                  </g>
                ))}
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
