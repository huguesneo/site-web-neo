'use client';

import { useEffect, useState } from 'react';

const ETAPES = [
  'On lit tes réponses…',
  'On croise avec nos profils métaboliques…',
  'On prépare ton résultat…',
];

const DUREE_MS = 3000;

/**
 * Animation d'analyse : trois secondes, trois états de texte, un cercle de
 * progression. Sobre volontairement — elle doit paraître crédible, pas
 * théâtrale. Aucun son.
 */
export default function AnalysisScreen({ onTermine }: { onTermine: () => void }) {
  const [etape, setEtape] = useState(0);
  const [progression, setProgression] = useState(0);

  useEffect(() => {
    const debut = Date.now();
    const tick = window.setInterval(() => {
      const ecoule = Date.now() - debut;
      const ratio = Math.min(ecoule / DUREE_MS, 1);
      setProgression(ratio);
      setEtape(Math.min(Math.floor(ratio * ETAPES.length), ETAPES.length - 1));
    }, 50);

    const fin = window.setTimeout(onTermine, DUREE_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(fin);
    };
  }, [onTermine]);

  // Cercle de 120 px de diamètre, trait de 6 px.
  const rayon = 54;
  const circonference = 2 * Math.PI * rayon;

  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16"
      role="status"
      aria-live="polite"
    >
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={rayon} fill="none" stroke="#E0F7F6" strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r={rayon}
          fill="none"
          stroke="#00BBB1"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - progression)}
        />
      </svg>

      <p className="mt-8 text-lg font-semibold text-gray-800">{ETAPES[etape]}</p>
    </div>
  );
}
