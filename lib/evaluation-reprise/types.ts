// Types du contrat d'API Évaluation de reprise (Supabase Edge Functions de
// l'app NEO). Le contrat est fixé côté app : ne pas renommer les champs ici.
import type { Utm } from '@/lib/continuite/types';

export type ModeRdv = 'clinique' | 'en_ligne';

// GET evaluation-reprise-profil?cid=
export type Profil = {
  prenom: string | null;
  naturo: { prenom: string } | null;
};

// POST evaluation-reprise-checkout
export type CheckoutRequete = {
  cid?: string;
  prenom: string;
  nom: string;
  courriel: string;
  telephone: string;
  turnstile_token: string;
  utm: Utm;
};

export type CheckoutReponse = { client_secret: string };

// POST evaluation-reprise-reserver (réponse), aussi renvoyé dans `rdv` par
// evaluation-reprise-session quand le rendez-vous est déjà pris.
export type Rdv = {
  // AAAA-MM-JJ
  date: string;
  // HH:MM, heure de Montréal
  heure: string;
  mode: ModeRdv;
  naturo_prenom: string | null;
  adresse?: string | null;
  lien_info?: string | null;
};

// GET evaluation-reprise-session?session_id=
export type Session = {
  // complete | ouverte | expiree
  statut: string;
  deja_reserve: boolean;
  rdv?: Rdv | null;
  prenom: string | null;
  naturo: { prenom: string } | null;
};

// GET evaluation-reprise-creneaux?session_id=&mode=&debut=
export type Creneaux = {
  naturo: { prenom: string } | null;
  jours: { date: string; creneaux: string[] }[];
};

export type ReserverRequete = {
  session_id: string;
  mode: ModeRdv;
  start_time: string;
};
