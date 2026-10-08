import type {
  ApercuNaturo,
  CheckoutNaturoRequete,
  CheckoutPublicRequete,
  CheckoutReponse,
  CodeErreur,
  Prix,
  Session,
} from './types';
import { ErreurContinuite, MESSAGES } from './erreurs';

export { ErreurContinuite };

/*
  Appels aux Edge Functions NEO Continuité (contrat : docs/continuite-api.md
  du dépôt de l'app NEO). Toute la logique de paiement (prix, taxes,
  engagement, attribution) vit dans l'app NEO : ce module ne fait que
  relayer et traduire les erreurs pour la cliente.
*/
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
  const { offre } = await appel<{ offre: Prix[] }>('continuite-offre');
  return offre ?? [];
}

export function checkoutPublic(requete: CheckoutPublicRequete): Promise<CheckoutReponse> {
  return appel<CheckoutReponse>('continuite-checkout-public', requete);
}

export function checkoutNaturo(requete: CheckoutNaturoRequete): Promise<CheckoutReponse> {
  return appel<CheckoutReponse>('continuite-checkout-naturo', requete);
}

// Valide le jeton dès l'ouverture de la page et renvoie de quoi préremplir,
// sans créer de session Checkout.
export function apercuNaturo(jeton: string): Promise<ApercuNaturo> {
  return appel<ApercuNaturo>('continuite-checkout-naturo', { jeton, apercu: true });
}

export function getSession(sessionId: string): Promise<Session> {
  return appel<Session>(`continuite-session?session_id=${encodeURIComponent(sessionId)}`);
}
