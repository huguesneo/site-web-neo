import { NextRequest, NextResponse } from 'next/server';
import {
  CONSENTEMENT_VERSION,
  REPONSES_VIDES,
  TAGS_PORTE_OUVERTE,
  calculerSortie,
  champsPorteOuverte,
  texteConsentement,
  type Reponses,
} from '@/lib/porteOuverte';

export const runtime = 'nodejs';

/**
 * Écriture directe dans GHL pour la porte ouverte du 23 octobre 2026.
 *
 * Trois actions :
 * - `capture` : crée ou met à jour le contact, pose le tag d'inscription et
 *   écrit la preuve de consentement ;
 * - `questionnaire` : écrit les champs `po_*` et le tag de sortie ;
 * - `avertir` : calendrier plein, pose le tag « avertis-moi ».
 *
 * Tout le reste (courriels, textos, opportunité) part des workflows GHL
 * déclenchés par ces tags. Aucune liste n'est gérée ici.
 *
 * Passer par le serveur garde la clé GHL hors du navigateur et permet
 * d'estampiller le consentement avec l'horodatage et l'adresse IP, que seul
 * le serveur peut établir.
 */

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';
const TIMEOUT_MS = 10_000;

/**
 * Clés des trois champs de preuve de consentement, et des champs PO. Les
 * identifiants GHL sont résolus à l'exécution depuis ces clés : un champ
 * recréé dans GHL ne demande aucun redéploiement.
 */
const CHAMPS_CONSENTEMENT = {
  texte: 'po_consent_text',
  date: 'po_consent_at',
  ip: 'po_consent_ip',
} as const;

const COURRIEL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ─────────────────────────────── Client GHL ─────────────────────────────── */

class ErreurGhl extends Error {}

function configuration() {
  const cle = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!cle || !locationId) throw new ErreurGhl('GHL_API_KEY ou GHL_LOCATION_ID manquante');
  return { cle, locationId };
}

async function ghl<T>(chemin: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { cle } = configuration();
  const reponse = await fetch(`${GHL_BASE}${chemin}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${cle}`,
      Version: GHL_VERSION,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    throw new ErreurGhl(`${init.method ?? 'GET'} ${chemin} : ${reponse.status} ${detail.slice(0, 300)}`);
  }
  return (await reponse.json()) as T;
}

/** Clé de champ (sans « contact. ») → identifiant GHL. Cache de 10 minutes. */
let cacheChamps: { valeur: Map<string, string>; expire: number } | null = null;

async function identifiantsChamps(): Promise<Map<string, string>> {
  if (cacheChamps && cacheChamps.expire > Date.now()) return cacheChamps.valeur;

  const { locationId } = configuration();
  const donnees = await ghl<{ customFields?: { id: string; fieldKey: string }[] }>(
    `/locations/${locationId}/customFields?model=contact`,
  );
  const valeur = new Map(
    (donnees.customFields ?? []).map((c) => [c.fieldKey.replace(/^contact\./, ''), c.id]),
  );
  cacheChamps = { valeur, expire: Date.now() + 10 * 60 * 1000 };
  return valeur;
}

/**
 * Convertit { clé: valeur } en customFields GHL. Un champ absent de GHL est
 * journalisé et ignoré : il ne doit jamais faire perdre une inscription.
 */
async function champsPersonnalises(valeurs: Record<string, string>) {
  const ids = await identifiantsChamps();
  const champs: { id: string; field_value: string }[] = [];
  for (const [cle, valeur] of Object.entries(valeurs)) {
    const id = ids.get(cle);
    if (id) champs.push({ id, field_value: valeur });
    else console.error(`[porte-ouverte] champ GHL introuvable : contact.${cle}`);
  }
  return champs;
}

interface Contact {
  prenom: string;
  courriel: string;
  cellulaire: string;
}

/** Crée ou met à jour le contact (par courriel / téléphone) et renvoie son id. */
async function upsertContact(contact: Contact, customFields: { id: string; field_value: string }[] = []) {
  const { locationId } = configuration();
  const donnees = await ghl<{ contact?: { id?: string } }>('/contacts/upsert', {
    method: 'POST',
    body: {
      locationId,
      firstName: contact.prenom,
      email: contact.courriel,
      phone: `+1${contact.cellulaire}`,
      source: 'Porte ouverte 23 octobre',
      ...(customFields.length > 0 ? { customFields } : {}),
    },
  });
  const id = donnees.contact?.id;
  if (!id) throw new ErreurGhl('upsert sans identifiant de contact');
  return id;
}

/**
 * Ajoute des tags sans toucher aux autres. L'upsert, lui, remplacerait la
 * liste complète des tags du contact : on ne lui en passe donc jamais.
 */
function ajouterTags(contactId: string, tags: string[]) {
  return ghl(`/contacts/${contactId}/tags`, { method: 'POST', body: { tags } });
}

function mettreAJourChamps(contactId: string, customFields: { id: string; field_value: string }[]) {
  if (customFields.length === 0) return Promise.resolve();
  return ghl(`/contacts/${contactId}`, { method: 'PUT', body: { customFields } });
}

/* ──────────────────────────────── Entrées ──────────────────────────────── */

/**
 * Première valeur de x-forwarded-for : c'est l'IP du visiteur, les suivantes
 * étant celles des proxys traversés.
 */
function adresseIp(req: NextRequest): string {
  const chaine = req.headers.get('x-forwarded-for');
  if (chaine) return chaine.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '';
}

function texte(valeur: unknown): string {
  return typeof valeur === 'string' ? valeur.trim() : '';
}

function lireContact(charge: Record<string, any>): Contact | null {
  const contact = {
    prenom: texte(charge.prenom),
    courriel: texte(charge.courriel).toLowerCase(),
    cellulaire: texte(charge.cellulaire).replace(/\D/g, ''),
  };
  if (!contact.prenom || !COURRIEL_VALIDE.test(contact.courriel) || contact.cellulaire.length !== 10) {
    return null;
  }
  return contact;
}

/** Ne garde que les réponses connues : le navigateur n'écrit rien d'autre dans GHL. */
function lireReponses(brut: unknown): Reponses {
  const r = (brut ?? {}) as Record<string, unknown>;
  const pris = <K extends keyof Reponses>(cle: K) =>
    (typeof r[cle] === 'string' ? r[cle] : null) as Reponses[K];
  return {
    ...REPONSES_VIDES,
    cliente: pris('cliente'),
    objectif: pris('objectif'),
    budget: pris('budget'),
    modalite: pris('modalite'),
  };
}

/** L'id renvoyé à la capture, ou un nouvel upsert si la capture a échoué. */
async function contactId(charge: Record<string, any>, contact: Contact) {
  const id = texte(charge.contact_id);
  return /^[A-Za-z0-9]{10,40}$/.test(id) ? id : upsertContact(contact);
}

/* ───────────────────────────────── Route ───────────────────────────────── */

export async function POST(req: NextRequest) {
  const charge = (await req.json().catch(() => ({}))) as Record<string, any>;

  const contact = lireContact(charge);
  if (!contact) return NextResponse.json({ error: 'Coordonnées invalides' }, { status: 400 });

  try {
    switch (charge.action) {
      case 'capture': {
        if (charge.consentement?.accepte !== true) {
          return NextResponse.json({ error: 'Consentement requis' }, { status: 400 });
        }
        // Le client n'envoie que `accepte` et un numéro de version ; le texte
        // affiché est ressorti ici depuis la constante canonique.
        const version = Number(charge.consentement?.texte_version) || CONSENTEMENT_VERSION;
        const champs = await champsPersonnalises({
          [CHAMPS_CONSENTEMENT.texte]: texteConsentement(version),
          [CHAMPS_CONSENTEMENT.date]: new Date().toISOString(),
          [CHAMPS_CONSENTEMENT.ip]: adresseIp(req),
        });
        const id = await upsertContact(contact, champs);
        await ajouterTags(id, [TAGS_PORTE_OUVERTE.inscrite]);
        return NextResponse.json({ ok: true, contact_id: id });
      }

      case 'questionnaire': {
        const reponses = lireReponses(charge.reponses);
        const sortie = calculerSortie(reponses);
        if (!sortie) return NextResponse.json({ error: 'Questionnaire incomplet' }, { status: 400 });

        const id = await contactId(charge, contact);
        await mettreAJourChamps(id, await champsPersonnalises(champsPorteOuverte(reponses, sortie)));

        const tags: string[] = [TAGS_PORTE_OUVERTE.sorties[sortie]];
        if (sortie === 'information') tags.push(TAGS_PORTE_OUVERTE.guideGratuit);
        await ajouterTags(id, tags);
        return NextResponse.json({ ok: true, contact_id: id, sortie });
      }

      case 'avertir': {
        const id = await contactId(charge, contact);
        await ajouterTags(id, [TAGS_PORTE_OUVERTE.avertirPlace]);
        return NextResponse.json({ ok: true, contact_id: id });
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
  } catch (erreur) {
    // Le client journalise et réessaie une fois ; il ne bloque jamais la personne.
    console.error(`[porte-ouverte] écriture GHL échouée (${String(charge.action)})`, erreur);
    return NextResponse.json({ error: 'GHL injoignable' }, { status: 502 });
  }
}
