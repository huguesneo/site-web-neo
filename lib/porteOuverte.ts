/**
 * Cœur du parcours d'inscription à la journée porte ouverte du 23 octobre 2026.
 *
 * Données pures et calculs sans effet de bord. La navigation vit dans
 * PorteOuverteFlow, la présentation dans les écrans, et la route serveur
 * réutilise d'ici le texte de consentement, les tags et les libellés écrits
 * dans GHL.
 *
 * Distinction à respecter : `valeur` est l'identifiant interne du parcours,
 * `label` est ce qui s'affiche. Le champ GHL à options (po_modalite) reçoit
 * un libellé de sa propre liste d'options — voir `ghl` sur chaque option, qui
 * doit rester identique à l'option dans GHL.
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
   * calendriers : une panne d'API ne doit jamais afficher « complet » alors
   * qu'il reste des places.
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
  /** Option correspondante du champ à choix dans GHL, au caractère près. */
  ghl?: string;
}

export type Cliente = 'oui' | 'non';
export type Objectif = 'perte-gras' | 'energie' | 'digestion' | 'hormones' | 'autre';
export type Difficulte = 'temps' | 'constance' | 'alimentation' | 'energie' | 'stress' | 'tout';
export type Pret = 'totalement' | 'accompagnee' | 'pas-maintenant';

export const Q_CLIENTE = {
  question: 'Es-tu cliente, ou as-tu été cliente de NEO Performance dans la dernière année ?',
  options: [
    { valeur: 'oui', label: 'Oui' },
    { valeur: 'non', label: 'Non' },
  ] as Option<Cliente>[],
};

export const Q_OBJECTIF = {
  question: 'Quel est ton objectif ?',
  aide: 'Choisis une seule réponse, celle qui est la plus importante en ce moment.',
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

export const Q_DIFFICULTE = {
  question: 'Quelle est ta plus grande difficulté en ce moment ?',
  options: [
    { valeur: 'temps', label: 'Le manque de temps' },
    { valeur: 'constance', label: 'Rester constante plus que quelques semaines' },
    { valeur: 'alimentation', label: 'Savoir quoi manger, vraiment' },
    { valeur: 'energie', label: 'La fatigue — je n’ai plus d’énergie pour m’en occuper' },
    { valeur: 'stress', label: 'Le stress qui prend toute la place' },
    { valeur: 'tout', label: 'Tous ces choix' },
  ] as Option<Difficulte>[],
};

export const Q_PRET = {
  intro:
    'Lors de la journée porte ouverte, on va t’expliquer exactement ta problématique et ton plan de match.',
  question: 'Es-tu prête à faire des changements pour enfin atteindre tes objectifs ?',
  options: [
    { valeur: 'totalement', label: 'Oui, totalement prête' },
    { valeur: 'accompagnee', label: 'Oui, mais j’ai besoin d’être bien accompagnée' },
    { valeur: 'pas-maintenant', label: 'Non, pas pour l’instant' },
  ] as Option<Pret>[],
};

/** Valeur du sac-cadeau — un seul montant, affiché partout où on en parle. */
export const VALEUR_SAC_CADEAU = '110 $';

export const Q_MODALITE = {
  question: 'Tu préfères venir à la clinique de Brossard ou faire ta rencontre en visio ?',
  aide: 'On te suggère fortement la clinique de Brossard.',
  options: [
    {
      valeur: 'clinique',
      label: 'À la clinique de Brossard',
      detail: `Sac-cadeau d’une valeur de ${VALEUR_SAC_CADEAU} + analyse InBody sur place`,
      ghl: 'À la clinique de Brossard',
    },
    {
      valeur: 'visio',
      label: 'En visio',
      detail: `Sac-cadeau d’une valeur de ${VALEUR_SAC_CADEAU} envoyé par la poste`,
      ghl: 'En visio',
    },
  ] as Option<Modalite>[],
};

/* ──────────────────────────────── Réponses ─────────────────────────────── */

export interface Reponses {
  cliente: Cliente | null;
  objectif: Objectif | null;
  difficulte: Difficulte | null;
  pret: Pret | null;
  modalite: Modalite | null;
}

export const REPONSES_VIDES: Reponses = {
  cliente: null,
  objectif: null,
  difficulte: null,
  pret: null,
  modalite: null,
};

/* ──────────────────────────────── Sorties ──────────────────────────────── */

/**
 * Trois sorties, pas de score :
 * - cliente, ou cliente dans la dernière année → elle parle à sa
 *   naturopathe, pas de calendrier ;
 * - « pas prête pour l'instant » → groupe Facebook et guide gratuit ;
 * - tout le reste (clientes d'il y a plus d'un an et participantes de
 *   février comprises) → calendrier.
 */
export type Sortie = 'cliente-active' | 'information' | 'calendrier';

/**
 * Sortie dès que les réponses la déterminent, `null` tant qu'il manque une
 * réponse décisive. La cliente sort dès la première question, le « pas pour
 * l'instant » dès la question sur les changements, sans passer par la
 * modalité.
 */
export function calculerSortie(reponses: Reponses): Sortie | null {
  if (reponses.cliente === 'oui') return 'cliente-active';
  if (reponses.cliente === null || reponses.pret === null) return null;
  if (reponses.pret === 'pas-maintenant') return 'information';
  if (reponses.modalite === null) return null;
  return 'calendrier';
}

/* ───────────────────────────────── Tags GHL ────────────────────────────── */

/**
 * Les tags sont le seul contrat avec les workflows GHL : ce sont eux qui
 * déclenchent courriels, textos et création d'opportunité.
 */
export const TAGS_PORTE_OUVERTE = {
  /** Posé à la capture, avant toute question. */
  inscrite: 'po-2310-inscrite',
  sorties: {
    'cliente-active': 'po-2310-cliente-active',
    information: 'po-2310-information',
    calendrier: 'po-2310-calendrier',
  } satisfies Record<Sortie, string>,
  /** Calendrier plein : la personne demande qu'on l'avertisse. */
  avertirPlace: 'po-2310-avertir-place',
  /** Tag existant qui déclenche l'envoi du guide « Sors du mode survie ». */
  guideGratuit: 'stc-guide-stress',
} as const;

/** Liens de la sortie « information ». */
export const GROUPE_FACEBOOK = 'https://www.facebook.com/groups/perdredupoidsmethodeneo';

/** Page de confirmation vers laquelle les deux calendriers GHL redirigent. */
export const URL_CONFIRMATION = 'https://www.neoperformance.ca/porte-ouverte/confirmation';

/* ───────────────────────────── Champs PO dans GHL ──────────────────────── */

/**
 * Valeurs écrites dans les champs personnalisés `po_*` du contact.
 *
 * `po_statut` et `po_dq_motif` sont des listes d'options déjà en place dans
 * GHL : on y range la sortie sans en créer de nouvelles options.
 * `po_difficulte` et `po_pret_changement` sont des champs texte.
 */
export function champsPorteOuverte(reponses: Reponses, sortie: Sortie): Record<string, string> {
  const libelle = <V extends string>(options: Option<V>[], valeur: V | null, cle: 'ghl' | 'label') =>
    options.find((o) => o.valeur === valeur)?.[cle] ?? '';

  const statut =
    sortie === 'cliente-active'
      ? 'dq'
      : sortie === 'information'
        ? 'froid'
        : reponses.pret === 'accompagnee'
          ? 'tiede'
          : 'chaud';

  const champs: Record<string, string> = { po_statut: statut };
  if (sortie === 'cliente-active') champs.po_dq_motif = 'cliente-actuelle';
  if (reponses.objectif) champs.po_objectif = libelle(Q_OBJECTIF.options, reponses.objectif, 'label');
  if (reponses.difficulte) {
    champs.po_difficulte = libelle(Q_DIFFICULTE.options, reponses.difficulte, 'label');
  }
  if (reponses.pret) champs.po_pret_changement = libelle(Q_PRET.options, reponses.pret, 'label');
  if (reponses.modalite) champs.po_modalite = libelle(Q_MODALITE.options, reponses.modalite, 'ghl');
  return champs;
}
