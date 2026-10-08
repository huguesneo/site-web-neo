'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOffre, ErreurContinuite } from '@/lib/continuite/api';
import { grille, rabaisMax } from '@/lib/continuite/offre';
import type { Prix } from '@/lib/continuite/types';

// Charge GET continuite-offre une fois, avec reprise manuelle en cas d'échec.
export function useOffre() {
  const [offre, setOffre] = useState<Prix[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState(0);

  useEffect(() => {
    let actif = true;
    setErreur(null);
    getOffre()
      .then((o) => actif && setOffre(o))
      .catch((e) => {
        if (actif) setErreur(e instanceof ErreurContinuite ? e.message : 'Impossible de charger les forfaits.');
      });
    return () => {
      actif = false;
    };
  }, [essai]);

  const g = useMemo(() => (offre ? grille(offre) : null), [offre]);
  const rabais = useMemo(() => (g ? rabaisMax(g) : {}), [g]);
  const reessayer = useCallback(() => setEssai((n) => n + 1), []);

  return { grille: g, rabais, erreur, reessayer };
}
