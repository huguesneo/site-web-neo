
/** Une variante sélectionnable (saveur, montant de carte-cadeau, etc.). */
export interface ProductVariation {
  id: number;        // variation_id WooCommerce (requis à la commande)
  label: string;     // libellé affiché : "Chocolat", "600 $"
  price: string;     // prix RÉELLEMENT facturé pour cette variante
  image?: string;    // image propre à la variante, si différente
  inStock: boolean;
}

export interface GHLProduct {
  id: string;
  slug: string;        // identifiant URL unique (ex. "proteine-atp") → page /boutique/[slug]
  name: string;
  category: string;
  price: string;       // prix d'affichage (= min des variantes pour un produit variable)
  image: string;       // image principale
  images: string[];    // galerie complète (≥ 1)
  checkoutUrl: string; // Lien de paiement généré dans GoHighLevel
  description: string;        // texte brut (Chatbot/Léo, repli)
  descriptionHtml: string;   // HTML assaini pour un rendu formaté (modal boutique)
  inStock: boolean;   // false = rupture de stock (achat bloqué). Pour un produit variable : true tant qu'au moins une variante est dispo.
  // Produits variables uniquement :
  variationLabel?: string;          // nom de l'attribut, ex. "Saveurs"
  variations?: ProductVariation[];  // choix disponibles (absent/vide = produit simple)
}
