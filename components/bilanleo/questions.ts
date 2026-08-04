/**
 * Contenu du questionnaire de qualification /bilanleo.
 *
 * Données pures, aucune logique : la navigation vit dans BilanFlow, la
 * présentation dans les écrans. Les libellés sont envoyés tels quels au
 * webhook Make, donc toute modification ici change ce que reçoit Make.
 */

export type ObjectifId =
  | 'perte_gras'
  | 'energie'
  | 'digestion'
  | 'sommeil'
  | 'stress'
  | 'hormones';

export interface Objectif {
  id: ObjectifId;
  label: string;
}

export const OBJECTIFS: Objectif[] = [
  { id: 'perte_gras', label: 'Perdre du gras et changer ma composition corporelle' },
  { id: 'energie', label: 'Retrouver mon énergie' },
  { id: 'digestion', label: 'Régler ma digestion' },
  { id: 'sommeil', label: 'Mieux dormir' },
  { id: 'stress', label: 'Baisser mon stress' },
  { id: 'hormones', label: 'Équilibrer mes hormones' },
];

/** Option supplémentaire de Q2 : quand elle est choisie, Q4 est sautée. */
export const AUCUN_AUTRE = "Aucun autre, c'est vraiment juste ça";

export const Q1_TITRE = 'Quel est ton objectif numéro un en ce moment ?';
export const Q2_TITRE = 'Et ton objectif secondaire ?';

/**
 * Les six blocs conditionnels, servis aussi bien en Q3 (selon Q1) qu'en Q4
 * (selon Q2).
 */
export const BLOCS_CONDITIONNELS: Record<
  ObjectifId,
  { question: string; options: string[] }
> = {
  perte_gras: {
    question: 'Où en es-tu exactement ?',
    options: [
      'Mon poids est immobile malgré mes efforts',
      'Mon poids monte malgré mes efforts',
      'Je perds, mais je reprends chaque fois que j’arrête',
      'Je n’ai jamais vraiment essayé de façon structurée',
    ],
  },
  energie: {
    question: 'Qu’est-ce qui décrit le mieux ta fatigue ?',
    options: [
      'Je manque de sommeil, deux bonnes nuits et ça va mieux',
      'Je dors sept ou huit heures et je me lève comme si je n’avais pas dormi',
      'Je tombe en milieu d’après-midi',
      'J’ai plus d’énergie le soir que le jour',
    ],
  },
  digestion: {
    question: 'Quand ton inconfort apparaît-il ?',
    options: [
      'Dans l’heure suivant le repas',
      'Seulement en fin de journée',
      'Dès le réveil, mon ventre est déjà distendu',
      'C’est irrégulier, sans lien clair avec les repas',
    ],
  },
  sommeil: {
    question: 'À quoi ressemblent tes nuits ?',
    options: [
      'J’ai du mal à m’endormir, la tête tourne',
      'Je me réveille entre 2 h et 4 h',
      'Je dors assez, mais je ne récupère pas',
      'Je n’ai simplement pas assez d’heures',
    ],
  },
  stress: {
    question: 'Comment ton stress se manifeste-t-il le plus ?',
    options: [
      'Je suis tendue et incapable de décrocher, même au repos',
      'Je suis vidée, je n’ai plus de réserve',
      'Je suis irritable, ma mèche est courte',
      'Je mange en réaction au stress',
    ],
  },
  hormones: {
    question: 'Qu’est-ce qui a le plus changé ?',
    options: [
      'Mon cycle est irrégulier ou absent',
      'Mes symptômes prémenstruels sont plus marqués qu’avant',
      'J’ai des bouffées de chaleur ou des sueurs nocturnes',
      'Mon gras s’accumule au ventre sans que j’aie changé mes habitudes',
    ],
  },
};

export const Q5 = {
  question: 'Depuis combien de temps vis-tu avec ça ?',
  options: [
    'Moins de 3 mois',
    'Entre 3 et 12 mois',
    'Entre 1 et 3 ans',
    'Plus de 3 ans',
  ],
};

export const Q6 = {
  question: 'Qu’est-ce que tu as déjà essayé ?',
  aide: 'Deux ou trois phrases. Ce qui a fonctionné au début, et ce qui a arrêté de fonctionner.',
};

export const Q7 = {
  question:
    'Es-tu disponible pour une rencontre de 75 minutes entre le 10 et le 31 août ?',
  options: [
    'Oui, en clinique à Brossard',
    'Oui, en visioconférence',
    'Oui, l’un ou l’autre',
    'Non, seulement en septembre',
  ],
};

export const Q8 = {
  question:
    'Avant la rencontre, il y a deux tests à faire chez toi, environ dix minutes au total. Es-tu partante ?',
  options: ['Oui', 'J’aimerais en savoir plus avant', 'Non'],
};

/** Libellé d'un objectif à partir de son identifiant. */
export function labelObjectif(id: ObjectifId): string {
  return OBJECTIFS.find((o) => o.id === id)?.label ?? '';
}
