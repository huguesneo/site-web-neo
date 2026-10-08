import type { Duree, Palier, Prix } from './types';

// Textes d'affichage seulement. Les prix et les « inclus » des forfaits
// viennent toujours de GET continuite-offre.

export const ORDRE_PALIERS: Palier[] = ['continuite', 'continuite_plus', 'continuite_extra'];
export const ORDRE_DUREES: Duree[] = ['mensuel', '6_mois', '12_mois'];
export const PALIER_RECOMMANDE: Palier = 'continuite_plus';
export const DUREE_PAR_DEFAUT: Duree = '6_mois';

export const MOIS_DUREE: Record<Duree, number> = { mensuel: 1, '6_mois': 6, '12_mois': 12 };

export const NOMS_PALIERS: Record<Palier, string> = {
  continuite: 'NEO Continuité',
  continuite_plus: 'Continuité+',
  continuite_extra: 'Continuité Extra',
};

// Libellés courts des onglets (mobile).
export const ONGLETS_PALIERS: Record<Palier, string> = {
  continuite: 'L’essentiel',
  continuite_plus: 'Le suivi',
  continuite_extra: 'Le suivi mensuel',
};

export const ROLES_PALIERS: Record<Palier, string> = {
  continuite: 'L’essentiel pour garder tes repères.',
  continuite_plus: 'Ton ou ta naturopathe reste à tes côtés.',
  continuite_extra: 'Un suivi chaque mois, pour garder le cap de près.',
};

export const BOUTONS_PALIERS: Record<Palier, string> = {
  continuite: 'Choisir l’essentiel',
  continuite_plus: 'Je garde mon suivi',
  continuite_extra: 'Choisir le suivi mensuel',
};

export const NOMS_DUREES: Record<Duree, string> = {
  mensuel: 'Mois par mois',
  '6_mois': '6 mois',
  '12_mois': '12 mois',
};

export const BADGE_RECOMMANDE = 'Recommandé par ton ou ta naturopathe';

// Rencontre à la carte : section et bouton « Réserver une rencontre » cachés tant
// que NEXT_PUBLIC_CARTE_ACTIVE n'est pas défini (continuite-checkout-carte pas
// encore déployé). La colonne du tableau comparatif reste visible.
export const CARTE_ACTIVE = process.env.NEXT_PUBLIC_CARTE_ACTIVE === '1';

// Rencontre à la carte, sans abonnement. Le montant réellement facturé est
// fixé par continuite-checkout-carte ; ce prix sert à l'affichage.
export const PRIX_CARTE_CENTS = 19800;
export const TEXTE_CARTE =
  'Une rencontre de 30 minutes avec ton ou ta naturopathe et le chat pendant 4 semaines après ta rencontre. Sans abonnement.';

export const SI_LA_VIE_CHANGE = [
  'Ton prix est garanti pendant toute ta durée.',
  'Tu peux passer au mois par mois en payant seulement la différence de prix sur les mois déjà payés.',
  'À la fin de ta durée, ton forfait continue au même prix, mois par mois.',
];

export const TEXTE_CONSENTEMENT =
  'J’accepte les conditions de mon abonnement et je comprends que le montant choisi sera prélevé chaque mois. Je peux passer au mois par mois en payant la différence de prix.';

export const NOTE_CARTE_CADEAU =
  'Ton crédit suppléments est remis chaque mois en carte-cadeau dans ton compte neoperformance.ca. Il s’utilise dans le mois et ne se cumule pas.';

/*
  Les textes « inclus » viennent de la description des produits Stripe. On
  harmonise seulement la façon de nommer la naturopathe.
*/
export function texteInclus(ligne: string): string {
  return ligne.replace(/\b(sa|ta) naturopathe\b/gi, 'ton ou ta naturopathe');
}

// Lignes « inclus » d'un prix, avec le suivi additionnel en dernier.
export function lignesInclus(prix: Prix): string[] {
  const lignes = prix.inclus.map(texteInclus);
  if (prix.suivi_additionnel_cents && !lignes.some((l) => /suivi additionnel/i.test(l))) {
    lignes.push(`Suivi additionnel de 30 minutes : ${argent(prix.suivi_additionnel_cents)}`);
  }
  return lignes;
}

// Montant du crédit suppléments, lu dans la ligne « inclus » qui le mentionne.
export function creditCents(prix: Prix | undefined): number | null {
  const ligne = prix?.inclus.find((l) => /crédit suppléments/i.test(l));
  const m = ligne && /(\d+)\s*\$/.exec(ligne);
  return m ? Number(m[1]) * 100 : null;
}

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
