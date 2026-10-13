/*
  Validation du courriel, identique à celle de evaluation-reprise-checkout.
  Le test réel du 13 octobre 2026 a payé avec « hugues,pugliese@gmail.com » :
  le serveur l'acceptait alors, QuickBooks l'a refusé et un dossier neuf a été
  créé. On valide donc avant Turnstile et avant le Checkout.
*/
const MOTIF =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

export const MESSAGE_COURRIEL_INVALIDE =
  'Ce courriel n’est pas valide. Vérifie-le (par exemple : prenom.nom@gmail.com), sans virgule ni espace.';

// Retire tous les espaces, même au milieu, puis passe en minuscules.
export function normaliserCourriel(valeur: string): string {
  return valeur.replace(/\s+/g, '').toLowerCase();
}

// À appeler sur une valeur déjà normalisée.
export function courrielValide(courriel: string): boolean {
  const arobase = courriel.lastIndexOf('@');
  return courriel.length <= 254 && arobase > 0 && arobase <= 64 && MOTIF.test(courriel);
}
