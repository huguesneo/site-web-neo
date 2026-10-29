/*
 * Tests des helpers du paiement : messages d'erreur WooCommerce (lib/order-notes.ts)
 * et numéros de carte-cadeau (lib/gift-card.ts). Logique pure, aucun appel réseau.
 * Lancer : npx tsx scripts/test-checkout-errors.ts
 */
import { describeWcError, stripHtml } from '../lib/order-notes';
import { normalizeGiftCardNumber, canonicalGiftCardNumber } from '../lib/gift-card';

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

console.log('describeWcError — plantage WordPress (cas du 28 oct.)');
{
  // Corps renvoyé par l'API REST quand PHP plante (« erreur critique »).
  const raw = JSON.stringify({
    code: 'internal_server_error',
    message: '<p>Une erreur critique est survenue sur votre site.</p><p><a href="https://fr.wordpress.org/support/article/debugging-in-wordpress/">En apprendre plus sur le débogage de WordPress.</a></p>',
    data: { status: 500 },
  });
  const r = describeWcError(500, raw, 'promo25');
  check('aucune balise HTML dans le message client', !/[<>]/.test(r.customer), r.customer);
  check('le message client nomme le code promo', r.customer.includes('promo25'), r.customer);
  check('le détail garde le code et le texte nettoyé', r.detail.includes('internal_server_error') && r.detail.includes('Une erreur critique'), r.detail);
  check('le détail ne contient plus de HTML', !/[<>]/.test(r.detail), r.detail);

  const sansCode = describeWcError(500, raw, null);
  check('sans code promo : message générique', !sansCode.customer.includes('code promo'), sansCode.customer);
}

console.log('describeWcError — autres réponses');
{
  const html = describeWcError(502, '<html><body><h1>502 Bad Gateway</h1></body></html>', '');
  check('page HTML (non JSON) → message générique sans HTML', !/[<>]/.test(html.customer) && html.customer.includes('erreur de notre côté'), html);

  const coupon = describeWcError(400, JSON.stringify({ code: 'woocommerce_rest_invalid_coupon', message: 'Le code promo « promo10 » a expiré.' }), 'promo10');
  check('refus 4xx clair → message WooCommerce transmis', coupon.customer === 'Le code promo « promo10 » a expiré.', coupon);

  const vide = describeWcError(500, '', null);
  check('réponse vide → message générique', vide.customer.includes('erreur de notre côté') && vide.detail.includes('(réponse vide)'), vide);

  check('stripHtml décode les entités', stripHtml('Pay&eacute;&nbsp;<b>ok</b> &amp; fini') === 'Pay&eacute; ok & fini');
}

console.log('normalizeGiftCardNumber');
{
  check('16 caractères sans tirets → format PW', normalizeGiftCardNumber('abcd1234efgh5678') === 'ABCD-1234-EFGH-5678');
  check('16 caractères avec espaces → format PW', normalizeGiftCardNumber(' ABCD 1234 EFGH 5678 ') === 'ABCD-1234-EFGH-5678');
  check('16 caractères avec tirets → inchangé', normalizeGiftCardNumber('ABCD-1234-EFGH-5678') === 'ABCD-1234-EFGH-5678');
  check('numéro personnalisé NEOCADEAU25 accepté', normalizeGiftCardNumber('neocadeau25') === 'NEOCADEAU25', normalizeGiftCardNumber('neocadeau25'));
  check('numéro personnalisé avec tiret gardé', normalizeGiftCardNumber('neo-2026') === 'NEO-2026');
  check('vide → null', normalizeGiftCardNumber('   ') === null);
  check('trop court → null', normalizeGiftCardNumber('ab1') === null);
  check('caractères invalides → null', normalizeGiftCardNumber('abc$1234') === null);
  check('trop long → null', normalizeGiftCardNumber('A'.repeat(41)) === null);
  check('forme canonique identique quelle que soit la saisie', canonicalGiftCardNumber('abcd-1234 efgh-5678') === canonicalGiftCardNumber('ABCD1234EFGH5678'));
}

if (failures > 0) {
  console.error(`\n${failures} test(s) en échec.`);
  process.exit(1);
}
console.log('\nTous les tests passent.');
