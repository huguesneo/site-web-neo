import type {
  CheckoutReponse,
  CheckoutRequete,
  Creneaux,
  ModeRdv,
  Profil,
  Rdv,
  ReserverRequete,
  Session,
} from './types';
import { ErreurReprise, messageErreur } from './erreurs';
import * as mock from './mock';

export { ErreurReprise, messageErreur };

/*
  Appels aux Edge Functions Évaluation de reprise de l'app NEO. Le prix, les
  taxes, la naturo et les disponibilités vivent dans l'app : ce module ne fait
  que relayer. Les erreurs arrivent sous la forme { erreur, message } et on
  affiche `message` tel quel.

  Simulation locale : NEXT_PUBLIC_EVALUATION_REPRISE_MOCK=1 (voir mock.ts).
  Jamais sur Netlify. Le test sur NODE_ENV (toujours figé au build) garantit
  qu'un build de production ne peut pas l'activer, même si la variable
  était définie par erreur.
*/
const MOCK =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_EVALUATION_REPRISE_MOCK === '1';
export const modeSimule = MOCK;
const BASE_URL = (
  process.env.NEXT_PUBLIC_EVALUATION_REPRISE_API_URL ||
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
    throw new ErreurReprise('reseau');
  }

  let corps: unknown = null;
  try {
    corps = await reponse.json();
  } catch {
    // corps vide ou non JSON : traité plus bas
  }

  if (!reponse.ok || (corps && typeof corps === 'object' && 'erreur' in corps)) {
    const { erreur, message } = (corps ?? {}) as { erreur?: string; message?: string };
    throw new ErreurReprise(erreur || 'erreur_serveur', message);
  }
  return corps as T;
}

const q = (params: Record<string, string>) => new URLSearchParams(params).toString();

export function getProfil(cid: string): Promise<Profil> {
  if (MOCK) return mock.getProfil(cid);
  return appel<Profil>(`evaluation-reprise-profil?${q({ cid })}`);
}

export function creerCheckout(requete: CheckoutRequete): Promise<CheckoutReponse> {
  if (MOCK) return mock.creerCheckout(requete);
  return appel<CheckoutReponse>('evaluation-reprise-checkout', requete);
}

export function getSession(sessionId: string): Promise<Session> {
  if (MOCK) return mock.getSession(sessionId);
  return appel<Session>(`evaluation-reprise-session?${q({ session_id: sessionId })}`);
}

export function getCreneaux(sessionId: string, mode: ModeRdv, debut: string): Promise<Creneaux> {
  if (MOCK) return mock.getCreneaux(sessionId, mode, debut);
  return appel<Creneaux>(`evaluation-reprise-creneaux?${q({ session_id: sessionId, mode, debut })}`);
}

export function reserver(requete: ReserverRequete): Promise<Rdv> {
  if (MOCK) return mock.reserver(requete);
  return appel<Rdv>('evaluation-reprise-reserver', requete);
}
