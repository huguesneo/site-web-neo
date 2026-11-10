/**
 * Quiz « Combien d'oméga-3 devrais-tu prendre ? » (/quiz-omega3)
 *
 * TOUTE la logique et tous les textes de résultat sont ici, pour validation par
 * la naturopathe. On change un chiffre ou une phrase dans ce fichier, rien
 * d'autre à toucher.
 *
 * RÈGLE NON NÉGOCIABLE : le site ne recommande JAMAIS autre chose que la dose de
 * l'étiquette d'Evo Lab Oméga-3 (2 gélules par jour, licence Santé Canada
 * NPN80132081). La cible en mg est de l'information nutritionnelle, jamais une
 * posologie du produit. Ne pas rendre `PRODUIT.dose` variable.
 */

// ─── Réponses possibles ────────────────────────────────────────────────────────

export type Sexe = 'Femme' | 'Homme';
export type TrancheAge = 'Moins de 18 ans' | '18-34' | '35-44' | '45-54' | '55+';
export type OuiNon = 'Oui' | 'Non';
export type Anticoagulant = 'Oui' | 'Non' | 'Je ne sais pas';
export type Activite = 'sedentaire' | 'actif-1-3' | 'actif-4-plus';
export type Objectif = 'perdre-gras' | 'stress-energie' | 'recuperation' | 'sante-globale';
export type Poisson = '0' | '1' | '2' | '3+';

export const AGES: TrancheAge[] = ['Moins de 18 ans', '18-34', '35-44', '45-54', '55+'];

export const ACTIVITES: { val: Activite; label: string }[] = [
  { val: 'sedentaire', label: 'Sédentaire' },
  { val: 'actif-1-3', label: 'Actif 1 à 3 fois par semaine' },
  { val: 'actif-4-plus', label: 'Actif 4 fois et plus par semaine' },
];

export const OBJECTIFS: { val: Objectif; label: string }[] = [
  { val: 'perdre-gras', label: 'Perdre du gras' },
  { val: 'stress-energie', label: 'Mieux gérer mon stress et mon énergie' },
  { val: 'recuperation', label: 'Mieux récupérer (articulations, entraînement)' },
  { val: 'sante-globale', label: 'Santé globale' },
];

export const POISSONS: { val: Poisson; label: string }[] = [
  { val: '0', label: '0' },
  { val: '1', label: '1' },
  { val: '2', label: '2' },
  { val: '3+', label: '3 et plus' },
];

// ─── Calcul de la cible EPA + DHA (mg par jour) ────────────────────────────────

export const CALCUL = {
  base: 500,
  poisson: { '0': 750, '1': 500, '2': 250, '3+': 0 } as Record<Poisson, number>,
  activite: { sedentaire: 0, 'actif-1-3': 0, 'actif-4-plus': 250 } as Record<Activite, number>,
  objectif: { 'perdre-gras': 500, 'stress-energie': 500, recuperation: 500, 'sante-globale': 0 } as Record<Objectif, number>,
  arrondi: 250,
};

export function calculerCible(poisson: Poisson, activite: Activite, objectif: Objectif): number {
  const brut = CALCUL.base + CALCUL.poisson[poisson] + CALCUL.activite[activite] + CALCUL.objectif[objectif];
  return Math.round(brut / CALCUL.arrondi) * CALCUL.arrondi;
}

// ─── Profils ───────────────────────────────────────────────────────────────────

export type Profil = 'A' | 'B' | 'C' | 'securite';

/** Profil A : cible ≤ 1 000 mg. Profil B : 1 001 à 1 600 mg. Profil C : > 1 600 mg. */
export const SEUILS = { maxA: 1000, maxB: 1600 };

export function profilDeCible(cible: number): Exclude<Profil, 'securite'> {
  if (cible <= SEUILS.maxA) return 'A';
  if (cible <= SEUILS.maxB) return 'B';
  return 'C';
}

/**
 * Filtre de sécurité : grossesse, allaitement ou essai de grossesse (Oui), ou
 * anticoagulant / chirurgie prévue (Oui ou Je ne sais pas). Le lead est capté,
 * mais le résultat n'affiche AUCUNE cible ni AUCUN produit.
 */
export function estSecurite(enceinte: OuiNon | undefined, anticoagulant: Anticoagulant | undefined): boolean {
  return enceinte === 'Oui' || anticoagulant === 'Oui' || anticoagulant === 'Je ne sais pas';
}

/** Tag GHL posé selon le profil (en plus de `quiz-omega3`). */
export const TAG_PROFIL: Record<Profil, string> = {
  A: 'profil-a',
  B: 'profil-b',
  C: 'profil-c',
  securite: 'omega-securite',
};
export const TAG_QUIZ = 'quiz-omega3';

// ─── Produit (seule dose permise : celle de l'étiquette) ───────────────────────

export const PRODUIT = {
  nom: 'Evo Lab Oméga-3',
  prix: '62,99 $',
  // Image et fiche existantes de la boutique (WooCommerce, produit 5056).
  image: 'https://wp.neoperformance.ca/wp-content/uploads/2025/04/Evo-Lab-Omega-3.png',
  url: '/boutique/evo-lab-omega-3',
  dose: '2 gélules par jour',
  mgParDose: 1600,
  resume: "2 gélules = 1 600 mg d'EPA + DHA, forme triglycérides",
  // Seule allégation permise : celle de la licence NPN80132081 (étiquette).
  allegation: "Source d'acides gras oméga-3 pour le maintien d'une bonne santé.",
  npn: 'NPN80132081',
};

// ─── Textes du résultat ────────────────────────────────────────────────────────

/** Phrase « pourquoi » selon le poisson gras mangé par semaine. */
export const TEXTE_POISSON: Record<Poisson, string> = {
  '0': "Tu ne manges pas de poisson gras présentement, donc ton alimentation fournit très peu d'EPA et de DHA.",
  '1': "Avec une portion de poisson gras par semaine, ton alimentation fournit une partie de tes oméga-3, mais pas l'essentiel.",
  '2': 'Avec deux portions de poisson gras par semaine, ton alimentation couvre déjà une bonne partie de tes besoins.',
  '3+': 'Avec trois portions ou plus de poisson gras par semaine, ton alimentation fait déjà une grande partie du travail.',
};

/** Phrase « pourquoi » selon l'objectif (décrit le calcul, aucune allégation). */
export const TEXTE_OBJECTIF: Record<Objectif, string> = {
  'perdre-gras': "Ton objectif de perdre du gras a été pris en compte, ce qui ajoute 500 mg à ta cible.",
  'stress-energie': 'Ton objectif de mieux gérer ton stress et ton énergie a été pris en compte, ce qui ajoute 500 mg à ta cible.',
  recuperation: 'Ton objectif de mieux récupérer a été pris en compte, ce qui ajoute 500 mg à ta cible.',
  'sante-globale': "Pour un objectif de santé globale, on s'en tient à la base, sans ajout.",
};

/** Phrase « pourquoi » selon l'activité (vide = aucune phrase). */
export const TEXTE_ACTIVITE: Record<Activite, string> = {
  sedentaire: '',
  'actif-1-3': '',
  'actif-4-plus': "Comme tu t'entraînes 4 fois ou plus par semaine, on a ajouté 250 mg.",
};

export const TEXTE_PROFIL = {
  A: {
    titre: 'Ton alimentation fait déjà une bonne partie du travail.',
    texte:
      "Pour toi, un supplément reste optionnel. Si tu veux une source régulière d'oméga-3 en plus de ton alimentation, voici celui que notre équipe utilise.",
  },
  B: {
    titre: "Evo Lab Oméga-3, 2 gélules par jour = 1 600 mg d'EPA + DHA.",
    texte: 'Ça couvre ta cible.',
  },
  C: {
    titre: "Evo Lab Oméga-3, 2 gélules par jour comme base (1 600 mg d'EPA + DHA).",
    texte: 'Une dose plus élevée peut être indiquée pour ton profil, mais elle doit être validée par un praticien.',
  },
};

export const TEXTE_SECURITE =
  "Dans ta situation, les oméga-3 doivent être validés par un praticien avant d'en prendre.";

export const TEXTE_QUAND =
  'Au repas le plus gras de ta journée, ou séparés aux deux repas (une gélule à chacun).';

/** Texte exact de l'étiquette, suivi du lien vers la consultation gratuite. */
export const TEXTE_USAGE_PROLONGE = 'Pour un usage prolongé, consulter un praticien de soins de santé.';

export const TEXTE_CONSULTATION =
  "Ta dose idéale dépend aussi de ton stress, de ta digestion et de tes hormones. C'est ce qu'on évalue en consultation gratuite.";

export const AVERTISSEMENT =
  "Ce résultat est une estimation générale qui ne remplace pas l'avis d'un praticien. Consulte un professionnel de la santé avant de prendre un supplément si tu prends des médicaments ou si tu as une condition médicale.";
/** Ajouté à l'avertissement sauf pour le profil sécurité (aucun produit affiché). */
export const AVERTISSEMENT_PRODUIT = 'Evo Lab Oméga-3 : 2 gélules par jour aux repas, adultes de 18 ans et plus.';

// ─── Intégrations ──────────────────────────────────────────────────────────────

/** Webhook Make du scénario « Quiz oméga-3 » (crée ou met à jour le contact GHL). */
export const WEBHOOK_URL = 'https://hook.us1.make.com/c5x72pxobmgj27wy5qsx8ghr39fa17qu';

/** Calendrier de la consultation gratuite : le même que /quiz. */
export const CALENDRIER_URL = 'https://api.leadconnectorhq.com/widget/booking/DIN6EPtG7eNU3Gf6ZRoC';
