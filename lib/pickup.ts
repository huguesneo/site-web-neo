/**
 * Cueillette en clinique — option « Récupérer ma commande en clinique » du paiement.
 *
 * Le client choisit de passer prendre sa commande : aucuns frais de livraison. La
 * commande WooCommerce reçoit un mode d'expédition « Cueillette en clinique »
 * (visible dans l'admin, le bon de préparation et les courriels) + la meta
 * PICKUP_META_KEY, lue par le snippet WordPress des courriels
 * (wordpress/snippets/neo-pickup-emails.php).
 *
 * Délai annoncé : « d'ici 30 minutes » seulement pendant les heures d'ouverture
 * (et au moins 30 min avant la fermeture) ; sinon, « dès l'ouverture » avec le
 * prochain jour d'ouverture. Même règle que le snippet PHP — garder les deux
 * synchronisés si les heures changent.
 */

export const PICKUP_META_KEY = '_neo_pickup';
export const PICKUP_SHIPPING_TITLE = 'Cueillette en clinique';
export const CLINIC_ADDRESS = '7005 Bd Taschereau #350, Brossard, QC J4Z 1A7';
export const CLINIC_HOURS_LABEL = 'Lundi au jeudi de 8 h à 17 h · Vendredi de 8 h à 12 h';

/** Heures d'ouverture par jour de la semaine (0 = dimanche), en minutes depuis minuit. */
const OPENING: Record<number, { open: number; close: number }> = {
  1: { open: 8 * 60, close: 17 * 60 },
  2: { open: 8 * 60, close: 17 * 60 },
  3: { open: 8 * 60, close: 17 * 60 },
  4: { open: 8 * 60, close: 17 * 60 },
  5: { open: 8 * 60, close: 12 * 60 },
};
const READY_DELAY_MIN = 30;
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Jour de la semaine et minutes depuis minuit à l'heure de la clinique (Montréal). */
function clinicClock(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function formatHour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

/** Message de disponibilité affiché au client, selon l'heure de la commande. */
export function pickupReadyMessage(date: Date = new Date()): string {
  const { day, minutes } = clinicClock(date);
  const today = OPENING[day];
  if (today && minutes >= today.open && minutes <= today.close - READY_DELAY_MIN) {
    return 'Ta commande a bien été reçue. Elle sera disponible d’ici 30 minutes.';
  }
  if (today && minutes < today.open) {
    return `Ta commande a bien été reçue. Elle sera prête dès l’ouverture de la clinique, aujourd’hui à ${formatHour(today.open)}.`;
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const next = OPENING[d];
    if (next) {
      const when = i === 1 ? 'demain' : DAY_NAMES[d];
      return `Ta commande a bien été reçue. Elle sera prête dès l’ouverture de la clinique, ${when} à ${formatHour(next.open)}.`;
    }
  }
  return 'Ta commande a bien été reçue.';
}
