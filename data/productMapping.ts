/**
 * Table de correspondance : ID produit GHL → Prix + URL Checkout
 * À compléter avec vos données réelles de GoHighLevel
 */

export interface ProductPricingInfo {
  price: string;           // Format: "34.99"
  checkoutUrl: string;     // URL de paiement GoHighLevel
}

/**
 * Mapping des produits GHL par ID.
 * Clé = _id du produit GHL
 * Valeur = {price, checkoutUrl}
 */
export const PRODUCT_PRICING_MAP: Record<string, ProductPricingInfo> = {
  // Exemple :
  // "69e217dccaf82513f722d34e": {
  //   price: "49.99",
  //   checkoutUrl: "https://link.msgsndr.com/widget/checkout/NOM_DU_PRODUIT_CHECKOUT"
  // }
};

/**
 * Récupère les infos de prix pour un produit
 * Retourne un prix par défaut si non trouvé
 */
export function getProductPricing(productId: string): ProductPricingInfo {
  const found = PRODUCT_PRICING_MAP[productId];
  
  if (found) {
    return found;
  }
  
  // Prix par défaut si non trouvé dans la table
  console.warn(`⚠️ Pas de prix configuré pour le produit ${productId}. Utilisation du prix par défaut.`);
  return {
    price: "0.00",
    checkoutUrl: `https://link.msgsndr.com/widget/checkout/${productId}`,
  };
}
