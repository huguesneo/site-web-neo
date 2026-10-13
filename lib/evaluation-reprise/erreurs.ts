const MESSAGE_SERVEUR = 'Un problème est survenu de notre côté. Réessaie dans un instant.';
const MESSAGE_RESEAU = 'Impossible de joindre le serveur. Vérifie ta connexion Internet et réessaie.';

// Erreur d'un endpoint ({ erreur, message }) : on affiche `message` tel quel.
export class ErreurReprise extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || (code === 'reseau' ? MESSAGE_RESEAU : MESSAGE_SERVEUR));
    this.code = code;
  }
}

export const messageErreur = (e: unknown) => (e instanceof ErreurReprise ? e.message : MESSAGE_SERVEUR);
