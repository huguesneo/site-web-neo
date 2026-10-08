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

// Ligne discrète sous le prix.
export function ligneEngagement(duree: Duree): string {
  if (duree === 'mensuel') return 'Sans engagement.';
  const mois = duree === '6_mois' ? 6 : 12;
  return `Engagement de ${mois} mois, puis le forfait continue au même prix, mois par mois.`;
}

/*
  Contenu de chaque palier. Sert de repli si l'endpoint renvoie un champ
  `inclus` vide.
*/
export const INCLUS_PAR_DEFAUT: Record<Palier, string[]> = {
  continuite: [
    '35 $ de crédit suppléments chaque mois, remis en carte-cadeau dans ton compte neoperformance.ca (utilisable dans le mois, non cumulable)',
    'Léo, 7 jours sur 7',
    'Application NEO complète',
    'Cours en ligne',
    'Rencontre de groupe mensuelle avec une naturopathe',
    'Suivi additionnel de 30 minutes : 119 $',
  ],
  continuite_plus: [
    '50 $ de crédit suppléments chaque mois, remis en carte-cadeau dans ton compte neoperformance.ca (utilisable dans le mois, non cumulable)',
    '1 suivi de 30 minutes aux 2 mois avec ta naturopathe',
    'Chat avec ta naturopathe',
    'Léo, 7 jours sur 7',
    'Application NEO complète et cours en ligne',
    'Rencontre de groupe mensuelle avec une naturopathe',
    'Suivi additionnel de 30 minutes : 69 $',
  ],
  continuite_extra: [
    '75 $ de crédit suppléments chaque mois, remis en carte-cadeau dans ton compte neoperformance.ca (utilisable dans le mois, non cumulable)',
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
  Liste courte pour la vente en face à face (/continuite/naturo) : 5 lignes
  au maximum, les plus concrètes d'abord.
*/
export const INCLUS_COURT: Record<Palier, string[]> = {
  continuite: [
    '35 $ en carte-cadeau chaque mois pour tes suppléments',
    'Une rencontre de groupe chaque mois avec une naturopathe',
    'Léo, 7 jours sur 7',
    'L’application NEO complète et les cours en ligne',
    'Un suivi individuel de 30 minutes au besoin, à 119 $',
  ],
  continuite_plus: [
    'Un suivi de 30 minutes aux 2 mois et le chat avec ta naturopathe',
    '50 $ en carte-cadeau chaque mois pour tes suppléments',
    'Léo, 7 jours sur 7',
    'Une rencontre de groupe chaque mois avec une naturopathe',
    'L’application NEO complète et les cours en ligne',
  ],
  continuite_extra: [
    'Un suivi de 30 minutes chaque mois et le chat avec ta naturopathe',
    '75 $ en carte-cadeau chaque mois pour tes suppléments, puis 10 % de rabais',
    'Léo, 7 jours sur 7',
    'Une rencontre de groupe chaque mois avec une naturopathe',
    'L’application NEO complète et les cours en ligne',
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
