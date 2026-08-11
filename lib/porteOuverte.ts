/**
 * Cœur du parcours d'inscription à la journée porte ouverte du 11 septembre 2026.
 *
 * Données pures et calculs sans effet de bord. La navigation vit dans
 * PorteOuverteFlow, la présentation dans les écrans, et les routes serveur
 * réutilisent d'ici le texte de consentement et les identifiants de calendriers.
 *
 * Distinction à respecter : `valeur` est ce qui part vers Make, `label` est ce
 * qui s'affiche. Les valeurs sont un contrat avec le scénario Make et ne
 * doivent jamais changer ; les libellés peuvent être reformulés librement.
 */

/* ────────────────────────────── Calendriers ────────────────────────────── */

export const CALENDRIERS_PORTE_OUVERTE = {
  clinique: 'S2bOP7tnApN5z1YR4kZ1',
  visio: '319wH1Aj4onnHBJPDvLb',
} as const;

export type Modalite = keyof typeof CALENDRIERS_PORTE_OUVERTE;

/** Réponse de /api/porte-ouverte/disponibilites. */
export interface Disponibilites {
  clinique: boolean;
  visio: boolean;
  /**
   * Faux quand l'interrogation de GHL a échoué. On ouvre alors les deux
   * calendriers : une panne d'API ne doit jamais envoyer quelqu'un en liste
   * d'attente alors qu'il reste des places.
   */
  verifie: boolean;
}

export const DISPONIBILITES_PAR_DEFAUT: Disponibilites = {
  clinique: true,
  visio: true,
  verifie: false,
};

/* ───────────────────────────── Consentement ───────────────────────────── */

/**
 * Le texte de la case LCAP vit ici, versionné, et nulle part ailleurs.
 *
 * La page l'affiche depuis cette constante et n'envoie que `accepte` et le
 * numéro de version ; c'est la route serveur qui ressort le texte canonique et
 * l'estampille. Le navigateur ne peut donc pas mentir sur ce qui a été montré,
 * et une reformulation future n'efface pas la preuve des consentements déjà
 * recueillis — il suffit d'ajouter une entrée et d'incrémenter la version.
 */
export const CONSENTEMENT_VERSION = 1;

export const TEXTES_CONSENTEMENT: Record<number, string> = {
  1: 'J’accepte de recevoir les courriels et textos de NEO Performance concernant la journée porte ouverte et ses conseils en optimisation métabolique. Je peux me désabonner en tout temps.',
};

/** Texte canonique d'une version, avec repli sur la version courante. */
export function texteConsentement(version: number): string {
  return TEXTES_CONSENTEMENT[version] ?? TEXTES_CONSENTEMENT[CONSENTEMENT_VERSION];
}

/* ─────────────────────────────── Questions ─────────────────────────────── */

export interface Option<V extends string> {
  valeur: V;
  label: string;
  /** Précision affichée sous le libellé, quand l'option mérite un mot de plus. */
  detail?: string;
}

export type DejaClient = 'non' | 'cliente-actuelle' | 'ancienne-cliente';
export type DejaPo = 'non' | 'oui';
export type Objectif = 'perte-gras' | 'energie' | 'digestion' | 'hormones' | 'autre';
export type LbsCible = 'moins-15' | '15-30' | '30-50' | 'plus-50' | 'aucun';
export type Anciennete = 'moins-6mois' | '6mois-2ans' | '2-5ans' | 'plus-5ans';
export type DejaEssaye =
  | 'weight-watchers'
  | 'keto'
  | 'jeune'
  | 'nutritionniste'
  | 'glp1'
  | 'coach'
  | 'rien';
export type Priorite = 'priorite-1' | 'important' | 'informe';
export type Budget = '2500-plus' | '1500-2500' | '500-1500' | 'moins-500' | 'rien';

export const Q_DEJA_CLIENT = {
  question: 'Es-tu déjà passée par NEO Performance ?',
  options: [
    { valeur: 'non', label: 'Non, jamais' },
    { valeur: 'cliente-actuelle', label: 'Oui, je suis cliente en ce moment' },
    { valeur: 'ancienne-cliente', label: 'Oui, j’ai déjà fait le programme dans le passé' },
  ] as Option<DejaClient>[],
};

export const Q_DEJA_PORTE_OUVERTE = {
  question: 'As-tu déjà participé à une journée porte ouverte NEO ?',
  options: [
    { valeur: 'non', label: 'Non' },
    { valeur: 'oui', label: 'Oui' },
  ] as Option<DejaPo>[],
};

export const Q_OBJECTIF = {
  question: 'Qu’est-ce qui t’amène ?',
  aide: 'Une seule réponse — celle qui pèse le plus en ce moment.',
  options: [
    { valeur: 'perte-gras', label: 'Perdre du gras et le garder cette fois' },
    { valeur: 'energie', label: 'Retrouver mon énergie' },
    { valeur: 'digestion', label: 'Régler ma digestion', detail: 'Ballonnements, transit, reflux' },
    {
      valeur: 'hormones',
      label: 'Comprendre ce qui se passe avec mes hormones',
      detail: 'Périménopause, cycle, symptômes qui changent',
    },
    { valeur: 'autre', label: 'Autre' },
  ] as Option<Objectif>[],
};

export const Q_LBS_CIBLE = {
  question: 'Combien de livres aimerais-tu perdre ?',
  options: [
    { valeur: 'moins-15', label: 'Moins de 15 lb' },
    { valeur: '15-30', label: '15 à 30 lb' },
    { valeur: '30-50', label: '30 à 50 lb' },
    { valeur: 'plus-50', label: 'Plus de 50 lb' },
    { valeur: 'aucun', label: 'Je ne cherche pas à perdre de poids' },
  ] as Option<LbsCible>[],
};

export const Q_ANCIENNETE = {
  question: 'Depuis combien de temps tu cherches une solution ?',
  options: [
    { valeur: 'moins-6mois', label: 'Moins de 6 mois' },
    { valeur: '6mois-2ans', label: '6 mois à 2 ans' },
    { valeur: '2-5ans', label: '2 à 5 ans' },
    { valeur: 'plus-5ans', label: 'Plus de 5 ans' },
  ] as Option<Anciennete>[],
};

export const Q_DEJA_ESSAYE = {
  question: 'Qu’est-ce que t’as déjà essayé ?',
  aide: 'Coche tout ce qui s’applique.',
  options: [
    { valeur: 'weight-watchers', label: 'Weight Watchers ou un programme de points' },
    { valeur: 'keto', label: 'Keto / low-carb' },
    { valeur: 'jeune', label: 'Jeûne intermittent' },
    { valeur: 'nutritionniste', label: 'Une nutritionniste ou une diététiste' },
    { valeur: 'glp1', label: 'Un médicament type Ozempic / Wegovy' },
    { valeur: 'coach', label: 'Un coach ou un entraîneur' },
    { valeur: 'rien', label: 'Rien de structuré jusqu’ici' },
  ] as Option<DejaEssaye>[],
};

/**
 * « Rien de structuré » contredit toutes les autres cases : la cocher vide la
 * sélection, et cocher autre chose la décoche.
 */
export const DEJA_ESSAYE_EXCLUSIF: DejaEssaye = 'rien';

export const Q_PRIORITE = {
  question: 'Où ça se situe dans tes priorités des 3 prochains mois ?',
  options: [
    { valeur: 'priorite-1', label: 'C’est ma priorité numéro un' },
    { valeur: 'important', label: 'C’est important, mais j’ai d’autres choses en avant' },
    { valeur: 'informe', label: 'Je m’informe pour l’instant' },
  ] as Option<Priorite>[],
};

export const Q_BUDGET = {
  question:
    'Si on te démontre que notre approche est la bonne pour toi, quel montant serais-tu prête à investir dans ta santé au cours des 4 prochains mois ?',
  options: [
    { valeur: '2500-plus', label: '2 500 $ et plus' },
    { valeur: '1500-2500', label: '1 500 $ à 2 500 $' },
    { valeur: '500-1500', label: '500 $ à 1 500 $' },
    { valeur: 'moins-500', label: 'Moins de 500 $' },
    { valeur: 'rien', label: 'Rien pour le moment — je viens chercher de l’information' },
  ] as Option<Budget>[],
};

export const Q_MODALITE = {
  question: 'Tu préfères venir à la clinique de Brossard ou faire ta rencontre en visio ?',
  options: [
    {
      valeur: 'clinique',
      label: 'À la clinique de Brossard',
      detail: 'Sac-cadeau d’une valeur de 110 $ + analyse InBody sur place',
    },
    {
      valeur: 'visio',
      label: 'En visio',
      detail: 'Sac-cadeau envoyé par la poste + guides numériques',
    },
  ] as Option<Modalite>[],
};

/* ──────────────────────────────── Réponses ─────────────────────────────── */

export interface Reponses {
  deja_client: DejaClient | null;
  deja_porte_ouverte: DejaPo | null;
  objectif: Objectif | null;
  lbs_cible: LbsCible | null;
  anciennete: Anciennete | null;
  deja_essaye: DejaEssaye[];
  priorite: Priorite | null;
  budget: Budget | null;
  modalite: Modalite | null;
}

export const REPONSES_VIDES: Reponses = {
  deja_client: null,
  deja_porte_ouverte: null,
  objectif: null,
  lbs_cible: null,
  anciennete: null,
  deja_essaye: [],
  priorite: null,
  budget: null,
  modalite: null,
};

/* ──────────────────────────────── Scoring ──────────────────────────────── */

export type Statut = 'chaud' | 'tiede' | 'froid' | 'dq';
export type DqMotif = 'cliente-actuelle' | 'ancienne-cliente' | 'deja-porte-ouverte';

/**
 * Version du barème de points bonus, envoyée avec chaque score.
 *
 * C'est elle qui rend un recalcul rétroactif honnête : si le barème est ajusté
 * en cours de campagne, on sait quelle cohorte a été scorée avec quelle grille,
 * et les réponses brutes présentes dans le webhook permettent de tout refaire.
 */
export const BAREME_VERSION = 1;

/**
 * Routage. Volontairement simple : les deux filtres l'emportent sur tout, et
 * ensuite un seul champ décide. Rien à déboguer le jour où 40 inscriptions
 * entrent en deux heures.
 */
export function calculerStatut(reponses: Reponses): { statut: Statut; motif: DqMotif | null } {
  if (reponses.deja_client === 'cliente-actuelle') {
    return { statut: 'dq', motif: 'cliente-actuelle' };
  }
  if (reponses.deja_client === 'ancienne-cliente') {
    return { statut: 'dq', motif: 'ancienne-cliente' };
  }
  if (reponses.deja_porte_ouverte === 'oui') {
    return { statut: 'dq', motif: 'deja-porte-ouverte' };
  }

  switch (reponses.budget) {
    case '2500-plus':
    case '1500-2500':
      return { statut: 'chaud', motif: null };
    case '500-1500':
      return { statut: 'tiede', motif: null };
    default:
      return { statut: 'froid', motif: null };
  }
}

/**
 * Points bonus — bris d'égalité, jamais qualification.
 *
 * Sert à ordonner les rappels quand deux personnes veulent le même créneau, ou
 * quand des places se libèrent à J-10. Maximum 65.
 */
export function calculerScoreBonus(reponses: Reponses): number {
  let score = 0;

  if (reponses.priorite === 'priorite-1') score += 25;
  else if (reponses.priorite === 'important') score += 10;

  if (reponses.anciennete === 'plus-5ans' || reponses.anciennete === '2-5ans') score += 15;

  if (
    reponses.lbs_cible === '15-30' ||
    reponses.lbs_cible === '30-50' ||
    reponses.lbs_cible === 'plus-50'
  ) {
    score += 10;
  }

  // « Rien de structuré » n'est pas une méthode essayée.
  const methodes = reponses.deja_essaye.filter((m) => m !== DEJA_ESSAYE_EXCLUSIF);
  if (methodes.length >= 2) score += 10;

  if (reponses.modalite === 'clinique') score += 5;

  return score;
}
