/*
  Réponses simulées des endpoints NEO Continuité, pour le développement local.

  - NEXT_PUBLIC_CONTINUITE_MOCK=1        : tout est simulé (offre, aperçu
                                           naturo, Checkout, session).
  - NEXT_PUBLIC_CONTINUITE_MOCK_CARTE=1  : seul continuite-checkout-carte est
                                           simulé (endpoint pas encore déployé).

  Ne jamais définir ces variables sur Netlify. À supprimer, avec les
  branchements dans api.ts et PaiementSimule (CheckoutIntegre.tsx), dès que
  continuite-checkout-carte est déployé.

  Les montants et les textes reprennent la réponse réelle de continuite-offre
  du 8 octobre 2026, mais seul l'endpoint fait foi.

  Scénarios d'erreur :
    - courriel contenant « +captcha » / « +limite » / « +serveur »
    - jeton naturo « expire » / « invalide » (dès l'aperçu)
    - jeton naturo « generique » : aperçu sans cliente
    - jeton naturo « hors-programme » : cliente sans date de semaine 15
    - session_id « mock_inconnu » / « mock_ouverte »
*/
import { ErreurContinuite } from './erreurs';
import { ORDRE_DUREES, ORDRE_PALIERS } from './contenu';
import type {
  ApercuNaturo,
  CheckoutCarteRequete,
  CheckoutNaturoRequete,
  CheckoutPublicRequete,
  CheckoutReponse,
  Duree,
  Palier,
  Prix,
  Session,
} from './types';

const MONTANTS: Record<Palier, Record<Duree, number>> = {
  continuite: { mensuel: 8900, '6_mois': 7900, '12_mois': 7400 },
  continuite_plus: { mensuel: 14900, '6_mois': 12900, '12_mois': 11900 },
  continuite_extra: { mensuel: 22800, '6_mois': 19800, '12_mois': 18300 },
};

const INCLUS: Record<Palier, string[]> = {
  continuite: [
    '35 $ de crédit suppléments (utilisable dans le mois, non cumulable)',
    'Léo, 7 jours sur 7',
    'Application NEO complète',
    'Cours en ligne',
    'Rencontre de groupe mensuelle avec une naturopathe',
  ],
  continuite_plus: [
    '50 $ de crédit suppléments chaque mois (utilisable dans le mois, non cumulable)',
    '1 suivi de 30 minutes aux 2 mois avec sa naturopathe',
    'Léo, 7 jours sur 7',
    'Application NEO complète',
    'Cours en ligne',
    'Rencontre de groupe mensuelle avec une naturopathe',
  ],
  continuite_extra: [
    '75 $ de crédit suppléments (utilisable dans le mois, non cumulable)',
    '10 % de rabais sur tous les suppléments au-delà du crédit',
    '1 suivi de 30 minutes avec sa naturopathe',
    'Léo, 7 jours sur 7',
    'Application NEO complète',
    'Cours en ligne',
    'Rencontre de groupe mensuelle avec une naturopathe',
  ],
};

const SUIVI: Record<Palier, number> = { continuite: 11900, continuite_plus: 6900, continuite_extra: 5900 };

const OFFRE: Prix[] = ORDRE_PALIERS.flatMap((palier) =>
  ORDRE_DUREES.map((duree) => ({
    palier,
    duree,
    montant_mensuel_cents: MONTANTS[palier][duree],
    price_id: `price_mock_${palier}__${duree}`,
    inclus: INCLUS[palier],
    suivi_additionnel_cents: SUIVI[palier],
  })),
);

const attendre = (ms = 700) => new Promise((r) => setTimeout(r, ms));

function verifierCourriel(courriel?: string) {
  if (!courriel) return;
  if (courriel.includes('+captcha')) throw new ErreurContinuite('captcha_invalide');
  if (courriel.includes('+limite')) throw new ErreurContinuite('trop_de_tentatives');
  if (courriel.includes('+serveur')) throw new ErreurContinuite('erreur_serveur');
}

function verifierJeton(jeton: string) {
  if (jeton === 'expire') throw new ErreurContinuite('jeton_expire');
  if (jeton === 'invalide') throw new ErreurContinuite('jeton_invalide');
}

function secretPour(priceId: string): string {
  const prix = OFFRE.find((p) => p.price_id === priceId);
  if (!prix) throw new ErreurContinuite('prix_invalide');
  return `mock_cs__${prix.palier}__${prix.duree}`;
}

export async function getOffre(): Promise<Prix[]> {
  await attendre(400);
  return OFFRE;
}

export async function checkoutPublic(r: CheckoutPublicRequete): Promise<CheckoutReponse> {
  await attendre();
  if (!r.turnstile_token) throw new ErreurContinuite('captcha_invalide');
  verifierCourriel(r.courriel);
  return { client_secret: secretPour(r.price_id) };
}

export async function apercuNaturo(jeton: string): Promise<ApercuNaturo> {
  await attendre(500);
  verifierJeton(jeton);
  const generique = jeton === 'generique';
  return {
    naturo_prenom: 'Julie',
    cliente: generique ? null : { prenom: 'Marie', nom: 'Tremblay', courriel: 'marie.tremblay@exemple.ca' },
    date_premier_paiement: generique || jeton === 'hors-programme' ? null : '2026-11-16',
  };
}

export async function checkoutNaturo(r: CheckoutNaturoRequete): Promise<CheckoutReponse> {
  await attendre();
  verifierJeton(r.jeton);
  verifierCourriel(r.courriel);
  return { client_secret: secretPour(r.price_id) };
}

export async function checkoutCarte(r: CheckoutCarteRequete): Promise<CheckoutReponse> {
  await attendre();
  if (r.jeton) verifierJeton(r.jeton);
  else if (!r.turnstile_token) throw new ErreurContinuite('captcha_invalide');
  verifierCourriel(r.courriel);
  return { client_secret: 'mock_cs__a_la_carte' };
}

export async function getSession(sessionId: string): Promise<Session> {
  await attendre(500);
  if (sessionId === 'mock_inconnu') throw new ErreurContinuite('erreur_serveur', 'Session introuvable.');
  if (sessionId.includes('a_la_carte')) {
    return { statut: 'complete', type: 'a_la_carte', palier: null, duree: null, date_premier_paiement: null };
  }
  const [, palier = 'continuite_plus', duree = '6_mois'] = sessionId.split('__');
  return {
    statut: sessionId === 'mock_ouverte' ? 'ouverte' : 'complete',
    palier: palier as Palier,
    duree: duree as Duree,
    date_premier_paiement: '2026-10-08',
  };
}
