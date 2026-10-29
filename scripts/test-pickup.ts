/*
 * Tests du message de cueillette en clinique (lib/pickup.ts).
 * Heures : lundi-jeudi 8 h-17 h, vendredi 8 h-12 h (heure de Montréal).
 * Lancer : npx tsx scripts/test-pickup.ts
 */
import { pickupReadyMessage } from '../lib/pickup';

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

// Dates en heure de l'Est (EDT = UTC-4 jusqu'au 1er nov. 2026, EST = UTC-5 ensuite).
const at = (iso: string) => new Date(iso);
const SOON = 'Elle sera disponible d’ici 30 minutes.';

console.log('pickupReadyMessage');
check('jeudi 10 h → 30 minutes', pickupReadyMessage(at('2026-10-29T10:00:00-04:00')).endsWith(SOON));
check('jeudi 16 h 30 → 30 minutes (limite)', pickupReadyMessage(at('2026-10-29T16:30:00-04:00')).endsWith(SOON));
const late = pickupReadyMessage(at('2026-10-29T16:45:00-04:00'));
check('jeudi 16 h 45 → demain à 8 h', late.includes('demain à 8 h'), late);
const early = pickupReadyMessage(at('2026-10-29T07:15:00-04:00'));
check('jeudi 7 h 15 → aujourd’hui à 8 h', early.includes('aujourd’hui à 8 h'), early);
check('vendredi 11 h → 30 minutes', pickupReadyMessage(at('2026-10-30T11:00:00-04:00')).endsWith(SOON));
const friPm = pickupReadyMessage(at('2026-10-30T13:00:00-04:00'));
check('vendredi 13 h → lundi à 8 h', friPm.includes('lundi à 8 h'), friPm);
const sun = pickupReadyMessage(at('2026-11-01T15:00:00-05:00'));
check('dimanche → demain (lundi) à 8 h', sun.includes('demain à 8 h'), sun);
const sat = pickupReadyMessage(at('2026-10-31T10:00:00-04:00'));
check('samedi → lundi à 8 h', sat.includes('lundi à 8 h'), sat);
check('commence toujours par « Ta commande a bien été reçue. »', [late, early, friPm, sun, sat].every((m) => m.startsWith('Ta commande a bien été reçue.')));

if (failures > 0) {
  console.error(`\n${failures} test(s) en échec.`);
  process.exit(1);
}
console.log('\nTous les tests passent.');
