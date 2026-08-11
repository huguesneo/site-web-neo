import { NextRequest, NextResponse } from 'next/server';
import { CONSENTEMENT_VERSION, texteConsentement } from '@/lib/porteOuverte';

export const runtime = 'nodejs';

/**
 * Relais vers les webhooks Make de la porte ouverte du 11 septembre 2026.
 *
 * Deux scénarios Make, donc deux URL : la capture et la qualification sont
 * modifiables séparément sans risquer de casser l'autre.
 *
 * Passer par le serveur plutôt que d'appeler Make depuis le navigateur évite
 * tout blocage CORS, garde les URL hors du code livré au client, et — surtout —
 * permet d'estampiller la preuve de consentement avec des données que seul le
 * serveur peut établir : l'horodatage et l'adresse IP.
 *
 * Les deux URL sont surchargeables par variable d'environnement, sans
 * redéploiement.
 */
const WEBHOOKS = {
  1: 'https://hook.us1.make.com/x286e6lb08fs850sqjiqwumfkzdecilf', // capture
  2: 'https://hook.us1.make.com/r93vkc85n1xoaevu82iyfu9bwys3b7cv', // qualification
} as const;

/** Make répond avant de parler à GHL : au-delà de 10 s, c'est qu'il est tombé. */
const TIMEOUT_MS = 10_000;

/**
 * Première valeur de x-forwarded-for : c'est l'IP du visiteur, les suivantes
 * étant celles des proxys traversés.
 */
function adresseIp(req: NextRequest): string {
  const chaine = req.headers.get('x-forwarded-for');
  if (chaine) return chaine.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '';
}

/** Chaîne défensive : Make ne mappe pas une clé absente, jamais de `undefined`. */
function texte(valeur: unknown): string {
  return typeof valeur === 'string' ? valeur : '';
}

interface Consentement {
  consent_text: string;
  consent_at: string;
  consent_ip: string;
}

export async function POST(req: NextRequest) {
  const charge = (await req.json()) as Record<string, any>;

  const etape = charge.etape === 2 ? 2 : 1;
  const submitted_at = new Date().toISOString();
  const ip = adresseIp(req);

  // Le client n'envoie que `accepte` et un numéro de version ; le texte affiché
  // est ressorti ici depuis la constante canonique. Une version inconnue
  // retombe sur la courante plutôt que de rejeter : perdre une inscription pour
  // protéger une donnée serait le mauvais échange.
  const version = Number(charge.consentement?.texte_version) || CONSENTEMENT_VERSION;
  const consentementNeuf: Consentement = {
    consent_text: texteConsentement(version),
    consent_at: submitted_at,
    consent_ip: ip,
  };

  // À l'étape 2, la preuve est celle recueillie à l'étape 1 — c'est là que la
  // case a été cochée. Le client la réémet telle que le serveur la lui a
  // rendue ; l'enregistrement qui fait foi reste celui de l'étape 1.
  const consentement: Consentement =
    etape === 2 && charge.consentement_etape1
      ? {
          consent_text: texte(charge.consentement_etape1.consent_text) || consentementNeuf.consent_text,
          consent_at: texte(charge.consentement_etape1.consent_at) || submitted_at,
          consent_ip: texte(charge.consentement_etape1.consent_ip),
        }
      : consentementNeuf;

  const utm = charge.utm ?? {};
  const communs = {
    po_lead_id: texte(charge.po_lead_id),
    prenom: texte(charge.prenom),
    courriel: texte(charge.courriel),
    cellulaire: texte(charge.cellulaire),
    utm_source: texte(utm.source),
    utm_medium: texte(utm.medium),
    utm_campaign: texte(utm.campaign),
    utm_content: texte(utm.content),
    utm_term: texte(utm.term),
    page_url: texte(charge.page_url),
    submitted_at,
  };

  const corps =
    etape === 1
      ? { ...communs, ...consentement }
      : {
          ...communs,
          po_statut: texte(charge.po_statut),
          po_dq_motif: charge.po_dq_motif ?? null,
          po_score_bonus: Number(charge.po_score_bonus) || 0,
          po_bareme_version: Number(charge.po_bareme_version) || 0,
          reponses: charge.reponses ?? {},
          places_restantes: charge.places_restantes === true,
          ...consentement,
        };

  // Les webhooks Make sont des URL publiques qui créent des contacts et des
  // opportunités dans le CRM : sans clé, quiconque les trouve peut polluer le
  // pipeline. La clé vit en variable d'environnement, jamais dans le dépôt.
  const entetes: Record<string, string> = { 'Content-Type': 'application/json' };
  const cle = process.env.PORTE_OUVERTE_MAKE_APIKEY;
  if (cle) entetes['x-make-apikey'] = cle;

  let reponse: Response;
  try {
    reponse = await fetch(process.env[`PORTE_OUVERTE_WEBHOOK_${etape}`] ?? WEBHOOKS[etape], {
      method: 'POST',
      headers: entetes,
      body: JSON.stringify(corps),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (erreur) {
    console.error(`[porte-ouverte] Make injoignable (étape ${etape})`, erreur);
    return NextResponse.json({ error: 'Make injoignable' }, { status: 502 });
  }

  if (!reponse.ok) {
    // Le client journalise et réessaie une fois ; il ne bloque jamais la personne.
    return NextResponse.json({ error: `Make a répondu ${reponse.status}` }, { status: 502 });
  }

  // La preuve de consentement est renvoyée au client pour qu'il la réémette
  // à l'étape 2 : les deux scénarios Make reçoivent ainsi la même, celle du
  // moment où la case a réellement été cochée.
  return NextResponse.json({ ok: true, consentement });
}
