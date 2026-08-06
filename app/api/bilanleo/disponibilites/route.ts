import { NextResponse } from 'next/server';
import { CALENDRIERS_BILAN, type Disponibilites, type LieuBilan } from '@/lib/bilanleo';

export const runtime = 'nodejs';

const GHL_BASE = 'https://services.leadconnectorhq.com';

/** GHL refuse les fenêtres de plus de 31 jours, d'où le découpage en tranches. */
const JOURS_PAR_APPEL = 30;
const TRANCHES = 3; // ≈ 90 jours d'horizon
const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * Les disponibilités bougent lentement et la page les demande à chaque visiteur.
 * Un cache de cinq minutes évite de marteler GHL sans jamais servir une réponse
 * vraiment périmée.
 */
const DUREE_CACHE_MS = 5 * 60 * 1000;
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

    // La réponse est un objet dont les clés sont des dates (« 2026-08-12 »),
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
    console.error('[bilanleo] GHL_API_KEY absente : disponibilités non vérifiées');
    return NextResponse.json({ clinique: true, visio: true, verifie: false });
  }

  try {
    const lieux = Object.keys(CALENDRIERS_BILAN) as LieuBilan[];
    const resultats = await Promise.all(
      lieux.map((lieu) => aDesPlaces(CALENDRIERS_BILAN[lieu], cle)),
    );

    const valeur: Disponibilites = {
      clinique: resultats[lieux.indexOf('clinique')],
      visio: resultats[lieux.indexOf('visio')],
      verifie: true,
    };

    cache = { valeur, expire: Date.now() + DUREE_CACHE_MS };
    return NextResponse.json(valeur);
  } catch (erreur) {
    // On ouvre les deux calendriers plutôt que de bloquer quelqu'un sur une
    // liste d'attente à cause d'une panne d'API.
    console.error('[bilanleo] vérification des disponibilités échouée', erreur);
    return NextResponse.json({ clinique: true, visio: true, verifie: false });
  }
}
