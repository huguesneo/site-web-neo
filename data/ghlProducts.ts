
export interface GHLProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
  checkoutUrl: string; // Lien de paiement généré dans GoHighLevel
  description: string;
}

export const GHL_PRODUCTS: GHLProduct[] = [
  {
    id: "magnesium-premium",
    name: "Magnésium Bisglycinate Plus",
    category: "Sommeil & Stress",
    price: "34.99",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/66059c0347895a2839d07960.png",
    checkoutUrl: "https://link.msgsndr.com/widget/checkout/VOTRE_LIEN_GHL_ICI",
    description: "La forme de magnésium la plus biodisponible pour calmer le système nerveux et améliorer la qualité du sommeil profond."
  },
  {
    id: "enzymes-pure",
    name: "Enzymes Digestives Pure",
    category: "Digestion",
    price: "42.50",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/66059c0347895a6b85d07961.png",
    checkoutUrl: "https://link.msgsndr.com/widget/checkout/VOTRE_LIEN_GHL_ICI",
    description: "Soutien enzymatique à large spectre pour éliminer les ballonnements et optimiser l'absorption des nutriments."
  },
  {
    id: "complexe-b-active",
    name: "Complexe Vitamines B Activées",
    category: "Énergie",
    price: "39.00",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/66059c0347895a4329d07962.png",
    checkoutUrl: "https://link.msgsndr.com/widget/checkout/VOTRE_LIEN_GHL_ICI",
    description: "Vitamines B co-enzymées pour une absorption immédiate par les mitochondries. Idéal pour l'énergie mentale et physique."
  },
  {
    id: "omega-3-ultra",
    name: "Oméga-3 Ultra Pur",
    category: "Nutrition",
    price: "49.99",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/66059c0379895a0c10d07964.png",
    checkoutUrl: "https://link.msgsndr.com/widget/checkout/VOTRE_LIEN_GHL_ICI",
    description: "Haute concentration en EPA/DHA pour réduire l'inflammation systémique et soutenir la santé cognitive."
  }
];
