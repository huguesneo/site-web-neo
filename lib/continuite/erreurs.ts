import type { CodeErreur } from './types';

// Messages de repli, utilisés seulement si l'endpoint ne fournit pas le sien.
export const MESSAGES: Record<CodeErreur, string> = {
  captcha_invalide: 'La vérification anti-robot n’a pas fonctionné. Recharge la page et réessaie.',
  trop_de_tentatives: 'Trop de tentatives en peu de temps. Attends quelques minutes avant de réessayer.',
  prix_invalide: 'Ce forfait n’est plus disponible. Recharge la page pour voir les prix à jour.',
  jeton_invalide: 'Lien expiré, rouvre-le depuis l’app NEO.',
  jeton_expire: 'Lien expiré, rouvre-le depuis l’app NEO.',
  erreur_serveur: 'Un problème est survenu de notre côté. Réessaie dans un instant.',
  reseau: 'Impossible de joindre le serveur. Vérifie ta connexion Internet et réessaie.',
};

export class ErreurContinuite extends Error {
  code: CodeErreur;
  constructor(code: CodeErreur, message?: string) {
    super(message || MESSAGES[code] || MESSAGES.erreur_serveur);
    this.code = code;
  }
}
