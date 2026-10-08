import type {
  ApercuNaturo,
  CheckoutCarteRequete,
  CheckoutNaturoRequete,
  CheckoutPublicRequete,
  CheckoutReponse,
  CodeErreur,
  Prix,
  Session,
} from './types';
import { ErreurContinuite, MESSAGES } from './erreurs';
import * as mock from './mock';

export { ErreurContinuite };

/*
  Appels aux Edge Functions NEO Continuité (contrat : docs/continuite-api.md
  du dépôt de l'app NEO). Toute la logique de paiement (prix, taxes,
  engagement, attribution) vit dans l'app NEO : ce module ne fait que
  relayer et traduire les erreurs pour la cliente.

  Simulation locale : voir mock.ts (NEXT_PUBLIC_CONTINUITE_MOCK et
  NEXT_PUBLIC_CONTINUITE_MOCK_CARTE). Jamais sur Netlify.
*/
const MOCK = process.env.NEXT_PUBLIC_CONTINUITE_MOCK === '1';
const MOCK_CARTE = MOCK || process.env.NEXT_PUBLIC_CONTINUITE_MOCK_CARTE === '1';
export const modeSimule = MOCK || MOCK_CARTE;
const BASE_URL = (
  process.env.NEXT_PUBLIC_CONTINUITE_API_URL ||
  `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/functions/v1/`
).replace(/\/?$/, '/');

// Les endpoints publics sont déployés sans vérification JWT : aucun en-tête
// d'authentification n'est envoyé.
async function appel<T>(chemin: string, corpsRequete?: unknown): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(
      BASE_URL + chemin,
      corpsRequete === undefined
        ? undefined
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpsRequete),
          },
    );
  } catch {
    throw new ErreurContinuite('reseau');
  }

  let corps: unknown = null;
  try {
    corps = await reponse.json();
  } catch {
    // corps vide ou non JSON : traité plus bas
  }

  if (!reponse.ok || (corps && typeof corps === 'object' && 'erreur' in corps)) {
    const { erreur, message } = (corps ?? {}) as { erreur?: CodeErreur; message?: string };
    throw new ErreurContinuite(erreur && erreur in MESSAGES ? erreur : 'erreur_serveur', message);
  }
  return corps as T;
}

export async function getOffre(): Promise<Prix[]> {
  if (MOCK) return mock.getOffre();
  const { offre } = await appel<{ offre: Prix[] }>('continuite-offre');
  return offre ?? [];
}

export function checkoutPublic(requete: CheckoutPublicRequete): Promise<CheckoutReponse> {
  if (MOCK) return mock.checkoutPublic(requete);
  return appel<CheckoutReponse>('continuite-checkout-public', requete);
}

export function checkoutNaturo(requete: CheckoutNaturoRequete): Promise<CheckoutReponse> {
  if (MOCK) return mock.checkoutNaturo(requete);
  return appel<CheckoutReponse>('continuite-checkout-naturo', requete);
}

// Rencontre à la carte, sans abonnement (public avec Turnstile, naturo avec jeton).
export function checkoutCarte(requete: CheckoutCarteRequete): Promise<CheckoutReponse> {
  if (MOCK_CARTE) return mock.checkoutCarte(requete);
  return appel<CheckoutReponse>('continuite-checkout-carte', requete);
}

// Valide le jeton dès l'ouverture de la page et renvoie de quoi préremplir,
// sans créer de session Checkout.
export function apercuNaturo(jeton: string): Promise<ApercuNaturo> {
  if (MOCK) return mock.apercuNaturo(jeton);
  return appel<ApercuNaturo>('continuite-checkout-naturo', { jeton, apercu: true });
}

export function getSession(sessionId: string): Promise<Session> {
  if (MOCK) return mock.getSession(sessionId);
  return appel<Session>(`continuite-session?session_id=${encodeURIComponent(sessionId)}`);
}
