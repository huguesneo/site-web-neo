// Promotion « Semaine découverte NEO » sur /protocole-neo et /mon-dossier.
// Le prix passe de 2 400 $ à 2 100 $ jusqu'au dimanche 25 octobre 2026,
// 23 h 59 (heure de Montréal, encore en EDT : -04:00). Dès lundi 00 h 00,
// le prix régulier revient tout seul — rien à redéployer.

export const PRIX_NORMAL = '2 799 $';
export const PRIX_REGULIER = '2 400 $';
export const PRIX_PROMO = '2 100 $';
export const PROMO_NOM = 'Semaine découverte NEO';
export const PROMO_VALIDITE = "Valide jusqu'au dimanche 25 octobre";

export const PROMO_FIN = new Date('2026-10-26T00:00:00-04:00');

export const isPromoDecouverteActive = (now: Date = new Date()) =>
  now.getTime() < PROMO_FIN.getTime();
