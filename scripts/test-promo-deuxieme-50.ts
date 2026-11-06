/*
 * Tests de la promotion « 2e produit à -50 % » (lib/promo-deuxieme-50.ts).
 * Logique pure, aucun appel réseau.
 * Lancer : npx tsx scripts/test-promo-deuxieme-50.ts
 */
import {
  computeDeuxiemeA50,
  isPromoDeuxiemeActive,
  isPromoExcludedProductId,
  promoDeuxiemeWins,
  type PromoLine,
} from '../lib/promo-deuxieme-50';

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

const line = (key: string, unitPrice: number, quantity = 1, extra: Partial<PromoLine> = {}): PromoLine => ({
  key, unitPrice, quantity, excluded: false, physical: true, ...extra,
});

console.log('Nombre d’unités à -50 %');
{
  check('0 produit → aucun rabais', computeDeuxiemeA50([]).discount === 0);
  const un = computeDeuxiemeA50([line('a', 40)]);
  check('1 unité → aucun rabais', un.discount === 0 && un.discountedUnits === 0, un);
  const deux = computeDeuxiemeA50([line('a', 40), line('b', 60)]);
  check('2 unités → la moins chère à -50 % (40 → 20 $)', deux.discount === 20 && deux.discountedUnits === 1, deux);
  const trois = computeDeuxiemeA50([line('a', 40), line('b', 60), line('c', 80)]);
  check('3 unités → 1 seule à -50 % (la moins chère)', trois.discount === 20 && trois.discountedUnits === 1, trois);
  const quatre = computeDeuxiemeA50([line('a', 40), line('b', 60), line('c', 80), line('d', 100)]);
  check('4 unités → les 2 moins chères (40 + 60 → 50 $)', quatre.discount === 50 && quatre.discountedUnits === 2, quatre);
  const cinq = computeDeuxiemeA50([line('a', 10), line('b', 20), line('c', 30), line('d', 40), line('e', 50)]);
  check('5 unités → 2 à -50 % (10 + 20 → 15 $)', cinq.discount === 15 && cinq.discountedUnits === 2, cinq);
}

console.log('Quantités et produits répétés');
{
  const r = computeDeuxiemeA50([line('multi', 50, 2), line('d3', 30, 1)]);
  check('2 multivitamines + 1 D3 → la D3 est à -50 % (15 $)', r.discount === 15 && r.discountedUnits === 1, r);
  const meme = computeDeuxiemeA50([line('multi', 50, 2)]);
  check('2 unités du même produit → 1 à -50 % (25 $)', meme.discount === 25, meme);
  const quatreMeme = computeDeuxiemeA50([line('multi', 50, 4)]);
  check('4 unités du même produit → 2 à -50 % (50 $)', quatreMeme.discount === 50, quatreMeme);
  const ordre = computeDeuxiemeA50([line('cher', 100), line('pas-cher', 20), line('moyen', 60)]);
  check('l’ordre du panier n’a pas d’importance', ordre.discount === 10, ordre);
}

console.log('Prix égaux et arrondis');
{
  const egaux = computeDeuxiemeA50([line('a', 30), line('b', 30)]);
  check('prix égaux → 1 seule unité à -50 %', egaux.discount === 15 && egaux.discountedUnits === 1, egaux);
  const sou = computeDeuxiemeA50([line('a', 19.99), line('b', 45)]);
  check('19,99 $ → rabais de 10,00 $ (arrondi au sou)', sou.discount === 10, sou);
  const cents = computeDeuxiemeA50([line('a', 33.33), line('b', 50)]);
  check('33,33 $ → rabais de 16,67 $', cents.discount === 16.67, cents);
}

console.log('Cartes-cadeaux exclues');
{
  check('carte-cadeau reconnue par son ID produit', isPromoExcludedProductId(5531) && isPromoExcludedProductId('5531'));
  check('un autre produit n’est pas exclu', !isPromoExcludedProductId(123));
  const seule = computeDeuxiemeA50([line('gc', 100, 2, { excluded: true })]);
  check('2 cartes-cadeaux seules → aucun rabais', seule.discount === 0 && seule.eligibleUnits === 0, seule);
  const mixte = computeDeuxiemeA50([line('gc', 100, 1, { excluded: true }), line('a', 40)]);
  check('1 produit + 1 carte-cadeau → pas de paire, aucun rabais', mixte.discount === 0, mixte);
  const trois = computeDeuxiemeA50([line('gc', 5, 1, { excluded: true }), line('a', 40), line('b', 60)]);
  check('la carte-cadeau ne devient jamais « la moins chère »', trois.discount === 20, trois);
}

console.log('Part physique (livraison)');
{
  const r = computeDeuxiemeA50([line('phys', 40), line('num', 20, 1, { physical: false }), line('x', 80)]);
  // 3 unités → 1 à -50 % : la moins chère est le produit numérique (20 → 10 $).
  check('rabais sur un produit numérique → part physique = 0', r.discount === 10 && r.physicalDiscount === 0, r);
  const p = computeDeuxiemeA50([line('phys', 40), line('x', 80)]);
  check('rabais sur un produit physique → part physique = rabais', p.physicalDiscount === 20, p);
}

console.log('Dates');
{
  check('actif au 1er novembre', isPromoDeuxiemeActive(new Date('2026-11-01T12:00:00-05:00')));
  check('actif le 30 novembre à 23 h 59', isPromoDeuxiemeActive(new Date('2026-11-30T23:59:00-05:00')));
  check('terminé le 1er décembre à 00 h 00', !isPromoDeuxiemeActive(new Date('2026-12-01T00:00:00-05:00')));
}

console.log('Arbitrage « le meilleur des deux »');
{
  check('promo > rabais client → la promo gagne', promoDeuxiemeWins(20, 5));
  check('rabais client > promo → les autres gagnent', !promoDeuxiemeWins(15, 20));
  check('égalité → on garde les autres rabais', !promoDeuxiemeWins(20, 20));
  check('aucune autre promotion → la promo s’applique', promoDeuxiemeWins(20, 0));
  check('promo nulle → jamais retenue', !promoDeuxiemeWins(0, 0));
}

if (failures > 0) {
  console.error(`\n${failures} test(s) en échec`);
  process.exit(1);
}
console.log('\nTous les tests passent.');
