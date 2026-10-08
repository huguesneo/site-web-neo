import type { Duree, Palier } from './types';

// Textes d'affichage seulement. Aucun prix ici : les montants viennent
// toujours de GET continuite-offre.

export const ORDRE_PALIERS: Palier[] = ['continuite', 'continuite_plus', 'continuite_extra'];
export const ORDRE_DUREES: Duree[] = ['mensuel', '6_mois', '12_mois'];
export const PALIER_RECOMMANDE: Palier = 'continuite_plus';

export const NOMS_PALIERS: Record<Palier, string> = {
  continuite: 'NEO Continuité',
  continuite_plus: 'Continuité+',
  continuite_extra: 'Continuité Extra',
};

export const RESUMES_PALIERS: Record<Palier, string> = {
  continuite: 'Les outils et la communauté pour garder tes acquis.',
  continuite_plus: 'Ta naturopathe reste dans ta routine, aux deux mois.',
  continuite_extra: 'Un suivi chaque mois, pour garder le cap de près.',
};

export const NOMS_DUREES: Record<Duree, string> = {
  mensuel: 'Mensuel',
  '6_mois': '6 mois',
  '12_mois': '12 mois',
};

export const DETAILS_DUREES: Record<Duree, string> = {
  mensuel: 'Sans engagement',
  '6_mois': 'Engagement 6 mois',
  '12_mois': 'Engagement 12 mois',
};

/*
  Contenu de chaque palier. Sert de repli si l'endpoint renvoie un champ
  `inclus` vide, et alimente les réponses simulées.
*/
export const INCLUS_PAR_DEFAUT: Record<Palier, string[]> = {
  continuite: [
    '35 $ de crédit suppléments par mois (utilisable dans le mois, non cumulable)',
    'Léo, 7 jours sur 7',
    'Application NEO complète',
    'Cours en ligne',
    'Rencontre de groupe mensuelle avec une naturopathe',
    'Suivi additionnel de 30 minutes : 119 $',
  ],
  continuite_plus: [
    '50 $ de crédit suppléments par mois (utilisable dans le mois, non cumulable)',
    '1 suivi de 30 minutes aux 2 mois avec ta naturopathe',
    'Chat avec ta naturopathe',
    'Léo, 7 jours sur 7',
    'Application NEO complète et cours en ligne',
    'Rencontre de groupe mensuelle avec une naturopathe',
    'Suivi additionnel de 30 minutes : 69 $',
  ],
  continuite_extra: [
    '75 $ de crédit suppléments par mois (utilisable dans le mois, non cumulable)',
    '10 % de rabais sur les suppléments au-delà du crédit',
    '1 suivi de 30 minutes par mois avec ta naturopathe',
    'Chat avec ta naturopathe',
    'Léo, 7 jours sur 7',
    'Application NEO complète et cours en ligne',
    'Rencontre de groupe mensuelle avec une naturopathe',
    'Suivi additionnel de 30 minutes : 59 $',
  ],
};

/*
  Formatage manuel plutôt qu'Intl : le rendu serveur et le rendu client
  doivent produire exactement la même chaîne (espaces insécables compris).
*/
export function argent(cents: number): string {
  const valeur = cents / 100;
  const decimales = Number.isInteger(valeur) ? 0 : 2;
  const [entier, fraction] = valeur.toFixed(decimales).split('.');
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${groupe}${fraction ? `,${fraction}` : ''} $`;
}

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

// « 2026-11-02 » ou ISO complet → « 2 novembre 2026 ».
export function dateLongue(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const jour = Number(m[3]);
  return `${jour === 1 ? '1er' : jour} ${MOIS[Number(m[2]) - 1]} ${m[1]}`;
}
