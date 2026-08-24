import { NextResponse } from 'next/server';
import {
  CALENDRIERS_PORTE_OUVERTE,
  DISPONIBILITES_PAR_DEFAUT,
  type Disponibilites,
  type Modalite,
} from '@/lib/porteOuverte';

export const runtime = 'nodejs';

const GHL_BASE = 'https://services.leadconnectorhq.com';

/** GHL refuse les fenêtres de plus de 31 jours, d'où le découpage en tranches. */
const JOURS_PAR_APPEL = 30;
const TRANCHES = 3; // ≈ 90 jours d'horizon — couvre largement le 11 septembre
const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * Les places bougent lentement et la page les demande à chaque visiteur. Un
 * cache de deux minutes évite de marteler GHL sans jamais servir une réponse
 * vraiment périmée — plus court que sur /bilanleo, parce qu’ici les 40 places
 * peuvent partir en quelques heures un jour de diffusion d'infolettre.
 */
const DUREE_CACHE_MS = 2 * 60 * 1000;
let cache: { valeur: Disponibilites; expire: number } | null = null;

/** Vrai dès qu'un seul créneau libre existe dans l'horizon interrogé. */
async function aDesPlaces(calendarId: string, cle: string): Promise<boolean> {
  const debut = Date.now();

  for (let tranche = 0; tranche < TRANCHES; tranche++) {
    const startDate = debut + tranche * JOURS_PAR_APPEL * JOUR_MS;
    const endDate = startDate + JOURS_PAR_APPEL * JOUR_MS;

    const url = `${GHL_BASE}/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}&timezone=America/Toronto`;
    const reponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cle}`,
        Version: '2021-04-15',
        Accept: 'application/json',
      },
    });

    if (!reponse.ok) {
      throw new Error(`GHL free-slots ${calendarId} : ${reponse.status}`);
    }

    // La réponse est un objet dont les clés sont des dates (« 2026-09-11 »),
    // chacune portant un tableau `slots`. `traceId` est la seule clé à ignorer.
    const donnees = (await reponse.json()) as Record<string, unknown>;
    const trouve = Object.entries(donnees).some(([cleJour, valeur]) => {
      if (cleJour === 'traceId' || typeof valeur !== 'object' || valeur === null) return false;
      const slots = (valeur as { slots?: unknown }).slots;
      return Array.isArray(slots) && slots.length > 0;
    });

    if (trouve) return true;
  }

  return false;
}

export async function GET() {
  if (cache && cache.expire > Date.now()) {
    return NextResponse.json(cache.valeur);
  }

  const cle = process.env.GHL_API_KEY;
  if (!cle) {
    console.error('[porte-ouverte] GHL_API_KEY absente : places non vérifiées');
    return NextResponse.json(DISPONIBILITES_PAR_DEFAUT);
  }

  try {
    const modalites = Object.keys(CALENDRIERS_PORTE_OUVERTE) as Modalite[];
    const resultats = await Promise.all(
      modalites.map((m) => aDesPlaces(CALENDRIERS_PORTE_OUVERTE[m], cle)),
    );

    const valeur: Disponibilites = {
      clinique: resultats[modalites.indexOf('clinique')],
      visio: resultats[modalites.indexOf('visio')],
      verifie: true,
    };

    cache = { valeur, expire: Date.now() + DUREE_CACHE_MS };
    return NextResponse.json(valeur);
  } catch (erreur) {
    // On ouvre les deux calendriers plutôt que d'envoyer quelqu'un en liste
    // d'attente à cause d'une panne d'API.
    console.error('[porte-ouverte] vérification des places échouée', erreur);
    return NextResponse.json(DISPONIBILITES_PAR_DEFAUT);
  }
}
