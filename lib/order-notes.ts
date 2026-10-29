/**
 * Helpers serveur — traçabilité des échecs sur la commande WooCommerce.
 *
 * Une commande est créée AVANT le paiement (statut « pending »). Sans trace,
 * chaque échec (plantage WordPress, refus Moneris, panne réseau…) laissait une
 * commande « en attente » muette dans l'admin. Ces helpers écrivent une note
 * privée sur la commande et traduisent les erreurs WooCommerce brutes (ex. la
 * page HTML « Une erreur critique est survenue sur votre site ») en un message
 * lisible pour le client. Tous sont non bloquants : un échec d'écriture de note
 * ne doit jamais casser le parcours de paiement.
 */

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

function wc(path: string): string {
  const u = new URL(`${WC_BASE}/wp-json/wc/v3${path}`);
  u.searchParams.set('consumer_key', WC_KEY as string);
  u.searchParams.set('consumer_secret', WC_SECRET as string);
  return u.toString();
}

/** Ajoute une note PRIVÉE (admin seulement) sur la commande. Retourne true si écrite. */
export async function addOrderNote(orderId: string | number, note: string): Promise<boolean> {
  try {
    const res = await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}/notes`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, customer_note: false }),
    });
    if (!res.ok) console.error(`[ORDER-NOTE] Note non écrite sur #${orderId} — HTTP ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error(`[ORDER-NOTE] Note non écrite sur #${orderId} —`, e instanceof Error ? e.message : e);
    return false;
  }
}

/** Annule la commande puis y laisse une note expliquant pourquoi. Non bloquant. */
export async function cancelOrderWithNote(orderId: string | number, note: string): Promise<void> {
  await addOrderNote(orderId, note);
  await fetch(wc(`/orders/${encodeURIComponent(String(orderId))}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' }),
  }).catch(() => { /* non bloquant */ });
}

/** Retire les balises HTML et les entités courantes, puis compacte les espaces. */
export function stripHtml(input: string): string {
  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&rsquo;|&apos;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Traduit la réponse d'erreur WooCommerce (corps brut, JSON ou HTML) en :
 *  - `detail` : message technique nettoyé, pour les logs et la note admin ;
 *  - `customer` : message à afficher au client, jamais de HTML ni de jargon.
 *
 * Erreur serveur (5xx) ou plantage PHP → message générique ; on nomme le code
 * promo s'il y en a un, car c'est le déclencheur observé (règles de plugins de
 * coupons incompatibles avec les commandes créées par l'API). Erreur 4xx avec un
 * message clair (ex. coupon refusé par WooCommerce) → on le transmet, nettoyé.
 */
export function describeWcError(
  status: number,
  rawBody: string,
  couponCode?: string | null,
): { detail: string; customer: string } {
  let message = '';
  let code = '';
  try {
    const j = JSON.parse(rawBody) as { message?: unknown; code?: unknown };
    message = typeof j?.message === 'string' ? j.message : '';
    code = typeof j?.code === 'string' ? j.code : '';
  } catch {
    message = rawBody;
  }
  const clean = stripHtml(message).slice(0, 500);
  const detail = `HTTP ${status}${code ? ` [${code}]` : ''} — ${clean || '(réponse vide)'}`;

  const crashed = status >= 500 || /erreur critique|critical error|internal_server_error/i.test(`${code} ${clean}`);
  if (crashed || !clean) {
    const promo = (couponCode || '').trim();
    return {
      detail,
      customer: promo
        ? `Ta commande n’a pas pu être créée : le code promo « ${promo} » a causé une erreur de notre côté. Retire-le et réessaie, ou écris-nous à info@neoperformance.ca — on s’en occupe rapidement.`
        : 'Ta commande n’a pas pu être créée à cause d’une erreur de notre côté. Réessaie dans un instant, ou écris-nous à info@neoperformance.ca.',
    };
  }
  return { detail, customer: clean };
}
