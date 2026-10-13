/*
  Réponses simulées des endpoints Évaluation de reprise, pour le développement
  local, tant que les Edge Functions ne sont pas déployées.

  NEXT_PUBLIC_EVALUATION_REPRISE_MOCK=1 : tout est simulé (profil, Checkout,
  session, créneaux, réservation).

  Ne jamais définir cette variable sur Netlify. À supprimer, avec le
  branchement dans api.ts et PaiementSimule (components/evaluation-reprise/
  Paiement.tsx), dès que les endpoints sont en ligne.

  Scénarios :
    Page 1
    - cid absent             : aucun appel au profil, naturo inconnue
    - cid « sans-naturo »    : profil sans naturo
    - cid « erreur »         : le profil échoue (la page reste utilisable)
    - courriel « +captcha » / « +serveur » : erreur du Checkout
    - courriel « +aucun »    : la session simulée n'aura aucun créneau
    - courriel « +conflit »  : le premier créneau choisi sera déjà pris
    Page 2 (session_id)
    - mock_er_paye           : payée, naturo Julie
    - mock_er_sans-naturo    : payée, naturo attribuée par l'app (Sophie)
    - mock_er_aucun          : payée, aucun créneau libre
    - mock_er_conflit        : creneau_indisponible au premier essai
    - mock_er_reserve        : déjà réservée (affiche la confirmation)
    - mock_er_ouverte        : non payée (retour à la page 1)
*/
import { ErreurReprise } from './erreurs';
import { FUSEAU, ajouterJours, aujourdhui } from './contenu';
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

const attendre = (ms = 600) => new Promise((r) => setTimeout(r, ms));

const naturoDe = (sessionId: string) => (sessionId.includes('sans-naturo') ? 'Sophie' : 'Julie');

// Réservations simulées, gardées le temps de l'onglet pour survivre à un rechargement.
const CLE = 'mock_evaluation_reprise';
function lireReservations(): Record<string, Rdv> {
  try {
    return JSON.parse(sessionStorage.getItem(CLE) || '{}');
  } catch {
    return {};
  }
}
function ecrireReservation(sessionId: string, rdv: Rdv) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify({ ...lireReservations(), [sessionId]: rdv }));
  } catch {
    // stockage indisponible : la réservation ne survivra pas au rechargement
  }
}
const conflitsPasses = new Set<string>();
// Créneaux « pris par quelqu'un d'autre » (scénario conflit), retirés des réponses suivantes.
const pris = new Set<string>();

export async function getProfil(cid: string): Promise<Profil> {
  await attendre(400);
  if (cid === 'erreur') throw new ErreurReprise('erreur_serveur');
  return { prenom: 'Marie', naturo: cid === 'sans-naturo' ? null : { prenom: 'Julie' } };
}

export async function creerCheckout(r: CheckoutRequete): Promise<CheckoutReponse> {
  await attendre();
  if (!r.turnstile_token) throw new ErreurReprise('captcha_invalide', 'La vérification anti-robot n’a pas fonctionné. Recharge la page et réessaie.');
  if (r.courriel.includes('+captcha')) throw new ErreurReprise('captcha_invalide', 'La vérification anti-robot n’a pas fonctionné. Recharge la page et réessaie.');
  if (r.courriel.includes('+serveur')) throw new ErreurReprise('erreur_serveur', 'Un problème est survenu de notre côté. Réessaie dans un instant.');
  const scenario = r.courriel.includes('+aucun')
    ? 'aucun'
    : r.courriel.includes('+conflit')
      ? 'conflit'
      : r.cid === 'sans-naturo'
        ? 'sans-naturo'
        : 'paye';
  return { client_secret: `mock_er__${scenario}` };
}

export async function getSession(sessionId: string): Promise<Session> {
  await attendre(500);
  if (!sessionId.startsWith('mock_er_')) throw new ErreurReprise('session_introuvable', 'Nous ne trouvons pas ce paiement.');
  if (sessionId.includes('ouverte')) return { statut: 'ouverte', deja_reserve: false };
  const rdv = lireReservations()[sessionId];
  if (rdv) return { statut: 'complete', deja_reserve: true, rdv, prenom: 'Marie' };
  if (sessionId.includes('reserve')) {
    return {
      statut: 'complete',
      deja_reserve: true,
      prenom: 'Marie',
      rdv: {
        date: ajouterJours(aujourdhui(), 3),
        heure: '10:30',
        mode: 'clinique',
        naturo_prenom: 'Julie',
        adresse: '7005 boul. Taschereau, bureau 350, Brossard',
      },
    };
  }
  return { statut: 'complete', deja_reserve: false, prenom: 'Marie', naturo: { prenom: naturoDe(sessionId) } };
}

// Instant ISO d'une heure de Montréal (gère l'heure avancée).
function isoMontreal(date: string, heure: number, minute: number): string {
  const [a, m, j] = date.split('-').map(Number);
  for (const decalage of [4, 5]) {
    const d = new Date(Date.UTC(a, m - 1, j, heure + decalage, minute));
    const h = Number(new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, hour: 'numeric', hourCycle: 'h23' }).format(d));
    if (h === heure) return d.toISOString();
  }
  return new Date(Date.UTC(a, m - 1, j, heure + 5, minute)).toISOString();
}

const HORAIRES: Record<ModeRdv, [number, number][]> = {
  clinique: [[9, 0], [10, 30], [13, 0], [14, 30], [16, 0]],
  en_ligne: [[8, 0], [12, 0], [17, 30], [19, 0]],
};

export async function getCreneaux(sessionId: string, mode: ModeRdv, debut: string): Promise<Creneaux> {
  await attendre(500);
  const naturo = { prenom: naturoDe(sessionId) };
  if (sessionId.includes('aucun')) return { naturo, jours: [] };
  const maintenant = Date.now();
  const jours: Creneaux['jours'] = [];
  for (let i = 0; i < 14; i++) {
    const date = ajouterJours(debut, i);
    const jourSemaine = new Date(`${date}T12:00:00Z`).getUTCDay();
    // Aucune plage la fin de semaine, ni le mercredi en ligne.
    if (jourSemaine === 0 || jourSemaine === 6 || (mode === 'en_ligne' && jourSemaine === 3)) continue;
    const creneaux = HORAIRES[mode]
      .filter((_, k) => (i + k) % 3 !== 0)
      .map(([h, m]) => isoMontreal(date, h, m))
      .filter((iso) => Date.parse(iso) > maintenant + 2 * 3600 * 1000 && !pris.has(iso));
    if (creneaux.length) jours.push({ date, creneaux });
  }
  return { naturo, jours };
}

export async function reserver(r: ReserverRequete): Promise<Rdv> {
  await attendre(700);
  if (r.session_id.includes('conflit') && !conflitsPasses.has(r.session_id)) {
    conflitsPasses.add(r.session_id);
    pris.add(r.start_time);
    throw new ErreurReprise('creneau_indisponible', 'Ce moment vient d’être réservé par quelqu’un d’autre. Choisis-en un autre.');
  }
  if (lireReservations()[r.session_id] || r.session_id.includes('reserve')) {
    throw new ErreurReprise('deja_reserve', 'Ton évaluation est déjà réservée.');
  }
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU }).format(new Date(r.start_time));
  const heure = new Intl.DateTimeFormat('fr-CA', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(r.start_time))
    .replace(/\s*h\s*/, ':');
  const rdv: Rdv = {
    date,
    heure,
    mode: r.mode,
    naturo_prenom: naturoDe(r.session_id),
    ...(r.mode === 'clinique'
      ? { adresse: '7005 boul. Taschereau, bureau 350, Brossard' }
      : { lien_info: 'Le lien vidéo te sera envoyé par courriel.' }),
  };
  ecrireReservation(r.session_id, rdv);
  return rdv;
}
