/*
  Réponses simulées des endpoints NEO Continuité, actives seulement avec
  NEXT_PUBLIC_CONTINUITE_MOCK=1. À supprimer une fois les Edge Functions
  déployées (voir api.ts).

  Les montants sont FICTIFS : ils servent à tester l'affichage.

  Scénarios d'erreur déclenchables :
    - courriel contenant « +captcha »  → captcha_invalide
    - courriel contenant « +limite »   → trop_de_tentatives
    - courriel contenant « +serveur »  → erreur_serveur
    - price_id inconnu                 → prix_invalide
    - jeton naturo « expire »          → jeton_expire (dès l'aperçu)
    - jeton naturo « invalide »        → jeton_invalide (dès l'aperçu)
    - jeton naturo « generique »       → aperçu sans cliente (coordonnées à saisir)
    - tout autre jeton                 → aperçu avec la cliente Marie Tremblay
    - session_id « mock_inconnu »      → erreur_serveur
    - session_id « mock_ouverte »      → statut « ouverte » (paiement non terminé)
*/
import { ErreurContinuite } from './erreurs';
import { INCLUS_PAR_DEFAUT, ORDRE_DUREES, ORDRE_PALIERS } from './contenu';
import type {
  ApercuNaturo,
  CheckoutNaturoRequete,
  CheckoutPublicRequete,
  CheckoutReponse,
  Duree,
  Palier,
  Prix,
  Session,
} from './types';

const MONTANTS: Record<Palier, Record<Duree, number>> = {
  continuite: { mensuel: 5900, '6_mois': 5400, '12_mois': 4900 },
  continuite_plus: { mensuel: 9900, '6_mois': 8900, '12_mois': 7900 },
  continuite_extra: { mensuel: 14900, '6_mois': 13400, '12_mois': 11900 },
};

const OFFRE: Prix[] = ORDRE_PALIERS.flatMap((palier) =>
  ORDRE_DUREES.map((duree) => ({
    palier,
    duree,
    montant_mensuel_cents: MONTANTS[palier][duree],
    price_id: `price_mock_${palier}__${duree}`,
    inclus: INCLUS_PAR_DEFAUT[palier],
  })),
);

const attendre = (ms = 700) => new Promise((r) => setTimeout(r, ms));

function secretPour(priceId: string): string {
  const prix = OFFRE.find((p) => p.price_id === priceId);
  if (!prix) throw new ErreurContinuite('prix_invalide', 'Ce forfait n’est plus disponible. Recharge la page.');
  return `mock_cs__${prix.palier}__${prix.duree}`;
}

export async function getOffre(): Promise<Prix[]> {
  await attendre(400);
  return OFFRE;
}

export async function checkoutPublic(r: CheckoutPublicRequete): Promise<CheckoutReponse> {
  await attendre();
  console.info('[continuite mock] checkout public', JSON.stringify(r));
  if (!r.turnstile_token) throw new ErreurContinuite('captcha_invalide');
  if (r.courriel.includes('+captcha')) throw new ErreurContinuite('captcha_invalide');
  if (r.courriel.includes('+limite')) throw new ErreurContinuite('trop_de_tentatives');
  if (r.courriel.includes('+serveur')) throw new ErreurContinuite('erreur_serveur');
  return { client_secret: secretPour(r.price_id) };
}

function verifierJeton(jeton: string) {
  if (jeton === 'expire') throw new ErreurContinuite('jeton_expire');
  if (jeton === 'invalide') throw new ErreurContinuite('jeton_invalide');
}

export async function apercuNaturo(jeton: string): Promise<ApercuNaturo> {
  await attendre(500);
  verifierJeton(jeton);
  return {
    naturo_prenom: 'Julie',
    cliente: jeton === 'generique' ? null : { prenom: 'Marie', nom: 'Tremblay', courriel: 'm…@exemple.ca' },
  };
}

export async function checkoutNaturo(r: CheckoutNaturoRequete): Promise<CheckoutReponse> {
  await attendre();
  console.info('[continuite mock] checkout naturo', JSON.stringify(r));
  verifierJeton(r.jeton);
  return { client_secret: secretPour(r.price_id) };
}

export async function getSession(sessionId: string): Promise<Session> {
  await attendre(500);
  if (sessionId === 'mock_inconnu') throw new ErreurContinuite('erreur_serveur', 'Session introuvable.');
  const [, palier = 'continuite_plus', duree = '12_mois'] = sessionId.split('__');
  return {
    statut: sessionId === 'mock_ouverte' ? 'ouverte' : 'complete',
    palier: palier as Palier,
    duree: duree as Duree,
    date_premier_paiement: '2026-11-02',
  };
}
