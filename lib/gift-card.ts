/**
 * Helpers serveur — cartes-cadeaux PW Gift Cards Pro (API wc-pimwick/v1).
 *
 * Le site vend les cartes-cadeaux comme produit WooCommerce (#5531) ; le plugin
 * PW génère les numéros à l'achat. Ces helpers servent à UTILISER une carte au
 * paiement : vérifier le solde, puis débiter après encaissement. Les clés
 * WooCommerce restent côté serveur — jamais exposées au navigateur.
 */

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

export interface PwGiftCard {
  id: string;            // pimwick_gift_card_id
  number: string;        // XXXX-XXXX-XXXX-XXXX
  balance: number;       // solde en dollars
  active: boolean;
  expirationDate: string | null; // "YYYY-MM-DD HH:MM:SS" ou null
}

function pw(path: string, extra: Record<string, string> = {}): string {
  const u = new URL(`${WC_BASE}/wp-json/wc-pimwick/v1/pw-gift-cards${path}`);
  u.searchParams.set('consumer_key', WC_KEY as string);
  u.searchParams.set('consumer_secret', WC_SECRET as string);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.toString();
}

/**
 * Forme canonique d'un numéro pour COMPARER deux saisies : majuscules, lettres et
 * chiffres seulement (« abcd-1234 » et « ABCD 1234 » désignent la même carte).
 */
export function canonicalGiftCardNumber(input: string): string {
  return String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Normalise la saisie du client avant la recherche PW :
 *  - 16 caractères → format PW standard « XXXX-XXXX-XXXX-XXXX » (regroupement par 4) ;
 *  - autre longueur → numéro PERSONNALISÉ créé à la main dans PW (ex. « NEOCADEAU25 ») :
 *    gardé tel que saisi, en majuscules, sans espaces.
 * Retourne null si la saisie ne peut pas former un numéro plausible (4 à 40
 * lettres/chiffres, tirets et espaces tolérés).
 */
export function normalizeGiftCardNumber(input: string): string | null {
  const trimmed = String(input).trim().toUpperCase();
  if (!/^[A-Z0-9 -]+$/.test(trimmed)) return null;
  const raw = canonicalGiftCardNumber(trimmed);
  if (raw.length === 16) return raw.match(/.{4}/g)!.join('-');
  if (raw.length < 4 || raw.length > 40) return null;
  return trimmed.replace(/\s+/g, '');
}

function parseCard(c: Record<string, unknown>): PwGiftCard {
  return {
    id: String(c.pimwick_gift_card_id ?? ''),
    number: String(c.number ?? ''),
    balance: parseFloat(String(c.balance ?? '0')) || 0,
    active: String(c.active) === '1',
    expirationDate: c.expiration_date ? String(c.expiration_date) : null,
  };
}

export function isExpired(card: PwGiftCard): boolean {
  if (!card.expirationDate) return false;
  const t = Date.parse(card.expirationDate.replace(' ', 'T'));
  return Number.isFinite(t) && t < Date.now();
}

/**
 * Cherche une carte par numéro (déjà normalisé). Retourne :
 *  - la carte si trouvée,
 *  - null si introuvable,
 *  - undefined en cas d'échec réseau/API (l'appelant décide : fail-closed).
 */
export async function fetchGiftCardByNumber(number: string): Promise<PwGiftCard | null | undefined> {
  try {
    const res = await fetch(pw('', { number }));
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [data];
    // Comparaison sur la forme canonique : un numéro personnalisé peut être
    // enregistré dans PW en minuscules ou avec d'autres séparateurs.
    const wanted = canonicalGiftCardNumber(number);
    const found = arr.find((c) => c && canonicalGiftCardNumber(String(c.number ?? '')) === wanted);
    return found ? parseCard(found) : null;
  } catch {
    return undefined;
  }
}

/**
 * Ajuste le solde d'une carte (delta négatif = débit, positif = re-crédit).
 * Retourne true si l'ajustement a été accepté par le plugin.
 */
export async function adjustGiftCardBalance(cardId: string, delta: number, note: string): Promise<boolean> {
  try {
    const res = await fetch(pw(`/${encodeURIComponent(cardId)}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: delta.toFixed(2), note }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Clés meta inscrites sur la commande WooCommerce pour tracer l'utilisation
// d'une carte-cadeau (visibles dans l'admin, lues au moment du débit).
export const GC_META_NUMBER = '_neo_gift_card_number';
export const GC_META_ID = '_neo_gift_card_id';
export const GC_META_AMOUNT = '_neo_gift_card_amount';
export const GC_META_DEBITED = '_neo_gift_card_debited';

/** Lit les meta carte-cadeau d'une commande WooCommerce (objet order déjà chargé). */
export function readGiftCardMeta(order: { meta_data?: Array<{ key: string; value: unknown }> }): {
  number: string; id: string; amount: number; debited: boolean;
} | null {
  const meta = Array.isArray(order.meta_data) ? order.meta_data : [];
  const get = (k: string) => meta.find((m) => m.key === k)?.value;
  const number = String(get(GC_META_NUMBER) ?? '');
  const id = String(get(GC_META_ID) ?? '');
  const amount = parseFloat(String(get(GC_META_AMOUNT) ?? '0')) || 0;
  if (!number || !id || amount <= 0) return null;
  return { number, id, amount, debited: String(get(GC_META_DEBITED) ?? '') === 'yes' };
}
