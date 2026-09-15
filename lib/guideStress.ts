/**
 * Guide gratuit « Sors du mode survie » — page de capture non indexée.
 *
 * Le texte de la case LCAP vit ici, versionné, comme pour la porte ouverte :
 * la page n'envoie que `accepte` et le numéro de version, et la route serveur
 * ressort le texte canonique pour l'estampiller.
 */
export const CONSENTEMENT_GUIDE_VERSION = 1;

export const TEXTES_CONSENTEMENT_GUIDE: Record<number, string> = {
  1: 'J’accepte de recevoir le guide ainsi que les courriels et textos de NEO Performance sur l’optimisation métabolique. Je peux me désabonner en tout temps.',
};

/** Texte canonique d'une version, avec repli sur la version courante. */
export function texteConsentementGuide(version: number): string {
  return TEXTES_CONSENTEMENT_GUIDE[version] ?? TEXTES_CONSENTEMENT_GUIDE[CONSENTEMENT_GUIDE_VERSION];
}
