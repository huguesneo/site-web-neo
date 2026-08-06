/**
 * Identifiants des deux calendriers Go High Level du bilan métabolique.
 *
 * Partagés entre l'écran de résultat, qui les intègre, et la route serveur qui
 * interroge leurs disponibilités — pour qu'un changement d'identifiant n'ait
 * qu'un seul endroit à toucher.
 */
export const CALENDRIERS_BILAN = {
  clinique: 'JoFdnQsmZzd5lO0EQPH5',
  visio: 'YCEFrPWQDpvfi30usnPF',
} as const;

export type LieuBilan = keyof typeof CALENDRIERS_BILAN;

/** Réponse de /api/bilanleo/disponibilites. */
export interface Disponibilites {
  clinique: boolean;
  visio: boolean;
  /**
   * Faux quand l'interrogation de GHL a échoué. Dans ce cas on affiche les deux
   * calendriers malgré tout : une panne d'API ne doit jamais empêcher quelqu'un
   * de réserver.
   */
  verifie: boolean;
}
