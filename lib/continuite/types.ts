// Types du contrat d'API NEO Continuité (Supabase Edge Functions de l'app NEO).
// Le contrat est fixé côté app : ne pas renommer les champs ici.

export type Palier = 'continuite' | 'continuite_plus' | 'continuite_extra';
export type Duree = 'mensuel' | '6_mois' | '12_mois';

export type Prix = {
  palier: Palier;
  duree: Duree;
  montant_mensuel_cents: number;
  price_id: string;
  inclus: string[];
};

export type Utm = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

export type Coordonnees = {
  prenom: string;
  nom: string;
  courriel: string;
  telephone: string;
};

export type CheckoutPublicRequete = Coordonnees & {
  price_id: string;
  turnstile_token: string;
  utm: Utm;
};

export type CheckoutNaturoRequete = Partial<Coordonnees> & {
  jeton: string;
  price_id: string;
  utm: Utm;
};

// Réponse du mode aperçu de continuite-checkout-naturo ({ jeton, apercu: true }).
// `cliente` vaut null si le jeton ne porte pas de cliente ; le courriel est masqué.
export type ApercuNaturo = {
  naturo_prenom: string | null;
  cliente: { prenom: string; nom: string; courriel: string } | null;
};

export type CheckoutReponse = { client_secret: string };

export type Session = {
  // complete | ouverte | expiree
  statut: string;
  palier: Palier;
  duree: Duree;
  date_premier_paiement: string | null;
};

export type CodeErreur =
  | 'captcha_invalide'
  | 'trop_de_tentatives'
  | 'prix_invalide'
  | 'jeton_invalide'
  | 'jeton_expire'
  | 'erreur_serveur'
  | 'reseau';
