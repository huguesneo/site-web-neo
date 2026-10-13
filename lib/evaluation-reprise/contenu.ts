// Textes et formatage d'affichage de l'Évaluation de reprise. Le montant
// réellement facturé est fixé par evaluation-reprise-checkout.

export const PRIX_AFFICHE = '99 $';
export const VALEUR_AFFICHEE = '550 $';
export const TELEPHONE_CLINIQUE = '(450) 486-4006';
export const TELEPHONE_LIEN = 'tel:+14504864006';
export const ADRESSE_CLINIQUE = '7005 boul. Taschereau, bureau 350, Brossard';

export const INCLUS = [
  'Une rencontre d’évaluation de 60 minutes, en clinique à Brossard ou en ligne',
  'Un bilan métabolique complet',
  'Une structure alimentaire ajustée à ta réalité actuelle',
  'Un mois d’accès à Léo dans l’app NEO',
];

export const ETAPES = [
  { titre: 'Tu réserves ta place', texte: '99 $ + taxes, payé en ligne en toute sécurité.' },
  { titre: 'Tu choisis ta date avec ta naturopathe', texte: 'En clinique à Brossard ou en ligne, selon ce qui te convient.' },
  { titre: 'Vous bâtissez ton plan ensemble', texte: 'Tu repars avec une structure claire pour les semaines qui viennent.' },
];

export const NOMS_MODES = { clinique: 'En clinique (Brossard)', en_ligne: 'En ligne (vidéo)' } as const;

/*
  Tout l'agenda est en heure de Montréal, quel que soit le fuseau de
  l'appareil. America/Toronto suit exactement les mêmes règles et est
  reconnu partout (America/Montreal n'est qu'un alias).
*/
export const FUSEAU = 'America/Toronto';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function parties(date: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return null;
  const [a, mo, j] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return { a, mo, j, jourSemaine: new Date(Date.UTC(a, mo - 1, j)).getUTCDay() };
}

// Date du jour à Montréal, AAAA-MM-JJ.
export function aujourdhui(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU }).format(new Date());
}

export function ajouterJours(date: string, n: number): string {
  const p = parties(date);
  if (!p) return date;
  return new Date(Date.UTC(p.a, p.mo - 1, p.j + n)).toISOString().slice(0, 10);
}

// « mardi 20 octobre »
export function dateLongue(date: string): string {
  const p = parties(date);
  if (!p) return date;
  return `${JOURS[p.jourSemaine]} ${p.j === 1 ? '1er' : p.j} ${MOIS[p.mo - 1]}`;
}

// { jour: 'mar.', numero: 20, mois: 'oct.' }
export function dateCourte(date: string) {
  const p = parties(date);
  if (!p) return { jour: '', numero: date, mois: '' };
  return { jour: `${JOURS[p.jourSemaine].slice(0, 3)}.`, numero: String(p.j), mois: MOIS_COURTS[p.mo - 1] };
}

// « 9 h », « 13 h 30 » à partir de « 09:00 » ou « 13:30 ».
export function heureLisible(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return hhmm;
  return `${Number(m[1])} h${m[2] === '00' ? '' : ` ${m[2]}`}`;
}

// Heure de Montréal d'un instant ISO, au format « HH:MM ».
export function heureMontreal(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: FUSEAU,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(new Date(iso))
    .replace(/\s*h\s*/, ':');
}

// Les paramètres du lien GHL non résolus (« {{contact.first_name}} ») sont ignorés.
export function parametrePropre(valeur: string | null): string {
  const v = valeur?.trim() ?? '';
  return v.includes('{{') ? '' : v.slice(0, 120);
}

export function prenomNaturo(naturo: { prenom: string } | null | undefined): string | null {
  return naturo?.prenom?.trim() || null;
}
