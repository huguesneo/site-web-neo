import { ORDRE_DUREES, ORDRE_PALIERS } from './contenu';
import type { Duree, Palier, Prix } from './types';

export type Grille = Partial<Record<Palier, Partial<Record<Duree, Prix>>>>;

export function grille(offre: Prix[]): Grille {
  const g: Grille = {};
  for (const p of offre) (g[p.palier] ??= {})[p.duree] = p;
  return g;
}

const MOIS_ENGAGEMENT: Record<Duree, number> = { mensuel: 1, '6_mois': 6, '12_mois': 12 };

// Économie d'une durée avec engagement par rapport au mensuel du même palier.
export function economie(g: Grille, palier: Palier, duree: Duree) {
  const base = g[palier]?.mensuel?.montant_mensuel_cents;
  const prix = g[palier]?.[duree]?.montant_mensuel_cents;
  if (duree === 'mensuel' || base == null || prix == null || prix >= base) return null;
  const parMois = base - prix;
  return {
    parMois,
    total: parMois * MOIS_ENGAGEMENT[duree],
    parAnnee: parMois * 12,
    mois: MOIS_ENGAGEMENT[duree],
    pourcentage: Math.round((parMois / base) * 100),
  };
}

// Plus grand rabais (en %) par durée, tous paliers confondus.
export function rabaisMax(g: Grille): Partial<Record<Duree, number>> {
  const r: Partial<Record<Duree, number>> = {};
  for (const duree of ORDRE_DUREES) {
    const max = Math.max(0, ...ORDRE_PALIERS.map((p) => economie(g, p, duree)?.pourcentage ?? 0));
    if (max > 0) r[duree] = max;
  }
  return r;
}
