/**
 * Promotion automatique « 2e produit à -50 % » — logique PURE (aucun réseau).
 *
 * Règle : pour N unités admissibles au panier, les floor(N / 2) unités les MOINS CHÈRES
 * sont à -50 %. (2 → 1, 3 → 1, 4 → 2, 5 → 2…) Les quantités comptent : 2 × un même
 * produit = 2 unités. Ex. 2 multivitamines + 1 vitamine D3 → c'est la D3 (la moins
 * chère) qui est à -50 %.
 *
 * Exclusions : cartes-cadeaux. Aucune autre promotion n'est cumulable : le panier et le
 * serveur gardent le plus avantageux entre cette promotion et (rabais client + codes
 * promo) — voir CartContext et app/api/checkout/create-order.
 *
 * Utilisé par le panier (affichage) ET par le serveur (montant réellement facturé, sur les
 * prix lus dans WooCommerce). Un seul endroit à modifier pour changer la règle ou les dates.
 */
import { GIFT_CARD_PRODUCT_ID } from '../constants';

export const PROMO_DEUXIEME_NOM = '2e produit à -50 %';
export const PROMO_DEUXIEME_TAUX = 0.5;

// Valable jusqu'au 30 novembre 2026 à 23 h 59 (heure de Montréal, EST : -05:00).
// Dès le 1er décembre à 00 h 00, la promotion s'arrête toute seule — rien à redéployer.
export const PROMO_DEUXIEME_FIN = new Date('2026-12-01T00:00:00-05:00');

export const isPromoDeuxiemeActive = (now: Date = new Date()): boolean =>
  now.getTime() < PROMO_DEUXIEME_FIN.getTime();

/** Produits qui ne comptent pas dans la promotion (cartes-cadeaux). */
export const isPromoExcludedProductId = (productId: number | string): boolean =>
  Number(productId) === GIFT_CARD_PRODUCT_ID;

export interface PromoLine {
  key: string;
  unitPrice: number;
  quantity: number;
  /** Ligne qui ne participe pas à la promotion (carte-cadeau). */
  excluded: boolean;
  /** Produit physique (sert à calculer le seuil de livraison gratuite). */
  physical: boolean;
}

export interface PromoResult {
  /** Rabais total en dollars (arrondi au sou). */
  discount: number;
  /** Part du rabais qui porte sur des produits physiques (base de la livraison). */
  physicalDiscount: number;
  /** Nombre d'unités admissibles au panier. */
  eligibleUnits: number;
  /** Nombre d'unités à -50 %. */
  discountedUnits: number;
}

const toCents = (dollars: number): number => Math.round(dollars * 100);

export function computeDeuxiemeA50(lines: PromoLine[]): PromoResult {
  const units: Array<{ cents: number; physical: boolean }> = [];
  for (const l of lines) {
    if (l.excluded || !(l.unitPrice > 0)) continue;
    const qty = Math.max(0, Math.floor(l.quantity));
    for (let q = 0; q < qty; q++) units.push({ cents: toCents(l.unitPrice), physical: l.physical });
  }

  const eligibleUnits = units.length;
  const discountedUnits = Math.floor(eligibleUnits / 2);
  // Tri croissant (stable) : les unités les moins chères reçoivent le rabais.
  const cheapest = [...units].sort((a, b) => a.cents - b.cents).slice(0, discountedUnits);

  let totalCents = 0;
  let physicalCents = 0;
  for (const u of cheapest) {
    const off = Math.round(u.cents * PROMO_DEUXIEME_TAUX);
    totalCents += off;
    if (u.physical) physicalCents += off;
  }

  return {
    discount: totalCents / 100,
    physicalDiscount: physicalCents / 100,
    eligibleUnits,
    discountedUnits,
  };
}

/**
 * Arbitrage « le meilleur des deux » : la promotion ne se cumule avec aucune autre. Elle
 * gagne seulement si elle est STRICTEMENT plus avantageuse que les autres rabais réunis
 * (rabais client + carte-cadeau client + code promo) ; à égalité, on garde les autres.
 */
export function promoDeuxiemeWins(promoDiscount: number, otherDiscounts: number): boolean {
  return promoDiscount > 0 && promoDiscount > otherDiscounts + 0.005;
}
