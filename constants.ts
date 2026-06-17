
import { NavLink, TeamMember, Testimonial, Stat } from './types';

// CONFIGURATION DES SOURCES
export const WP_CONFIG = {
  // On garde l'API WordPress uniquement pour le contenu du Blog (Headless)
  baseUrl: "https://neoperformance.ca", 
  apiUrl: "https://neoperformance.ca/wp-json"
};

// Logo corrigé selon votre lien
export const LOGO_URL = "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6941c9327109a899ec69b43c.png"; 

// CONFIGURATION GOHIGHLEVEL (GHL)
export const GHL_CONFIG = {
  locationId: "YG2spvWJqnD75L3V95UJ",
  checkoutBaseUrl: "https://link.msgsndr.com/widget/checkout/"
};

export const IMAGES = {
  hero: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce940708e4bb93112c71.jpg",
  consultation: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce941dfc023f86bfaf37.jpg",
  method: "https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/69e60d4138381eafa8cca5c2.jpg",
  clinic: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce940708e4e99e112c75.jpg",
  Lyliane: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce942dd985420a75a44f.jpg"
};

export const NAV_LINKS: NavLink[] = [
  { label: "Accueil", path: "/" },
  { label: "Notre Approche", path: "/approche" },
  { label: "L'Équipe", path: "/equipe" },
  { label: "Blogue", path: "/blog" },
  { label: "Boutique", path: "/boutique" },
  { label: "Nous Joindre", path: "/contact" },
  { label: "Espace client", path: "/espace-client" },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "hugues",
    name: "Hugues Pugliese",
    role: "Fondateur & Naturopathe",
    specialty: "Optimisation Métabolique",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce942dd985198475a451.jpg",
    bio: "Je n'ai jamais cru aux diètes. Ce qui m'intéresse, c'est comprendre pourquoi le corps résiste — et le corriger à la source. En 10 ans et 15 000 clients, j'ai développé des tests métaboliques exclusifs, une application unique à NEO et LÉO, une IA intégrée directement dans le parcours de chaque client afin de rendre la remise en forme plus simple et facile que jamais.",
    strengths: ["Vision & innovation", "Gestion du système nerveux", "Développement de programmes durables"],
  },
  {
    id: "thibault",
    name: "Thibault Van Elsue",
    role: "Naturopathe & Ostéopathe",
    specialty: "Performance & Récupération",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce941dfc02560abfaf3b.jpg",
    bio: "Ma passion pour la naturopathie est née de mon intérêt profond pour la santé, la performance et l’impact concret qu’un mode de vie bien structuré peut avoir sur l’énergie, la composition corporelle et le bien-être global. Dans mon approche, je cherche à simplifier la santé en proposant des stratégies réalistes, individualisées et fondées sur des principes solides.Ce qui me passionne le plus dans mon travail, c’est d’aider les clients à mieux comprendre leur corps, à reprendre le contrôle de leur santé et à obtenir des résultats durables.",
    strengths: ["Stress & récupération", "Équilibre hormonal", "Santé métabolique"],
  },
  {
    id: "jessica",
    name: "Jessica Emond",
    role: "Naturopathe",
    specialty: "Santé Postnatale & Famille",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce942dd985f9ab75a453.jpg",
    bio: "Naturopathe passionnée, je me spécialise dans l’accompagnement des femmes en période postnatale ainsi que des familles avec de jeunes enfants. J’adopte une approche globale qui respecte l’équilibre entre le corps, les émotions et les hormones. Mon objectif est d’aider les mamans à retrouver leur vitalité et à mieux vivre les défis du quotidien grâce à des outils naturels et personnalisés.",
    strengths: ["Gestion du stress", "Équilibre hormonal", "Énergie & Vitalité"],
  },
  {
    id: "tamara",
    name: "Tamara Ovayan",
    role: "Naturopathe",
    specialty: "Hormones & Stress Chronique",
    image: "https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/69e7599bc56ad279086de1cd.jpg",
    bio: "Je me suis tournée vers la naturopathie pour mieux comprendre les causes profondes derrière les symptômes chroniques, souvent banalisés. Mon approche est axée sur l’équilibre hormonal, la digestion et la gestion du stress, en tenant compte de la réalité unique de chaque client en leur préparant un plan personnalisé avec plusieurs variétés. Mes clients me le disent souvent : “J’ai des résultats, et j’ai même pas l’impression de suivre un plan”.",
    strengths: ["Optimisation du mindset", "Hormone féminine", "Flexibilité alimentaire"],
  },
  {
    id: "brice",
    name: "Brice Duvalet",
    role: "Naturothérapeute",
    specialty: "Vitalité & Digestion ",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce940708e45c92112c76.jpg",
    bio: "Ancien athlète de haut niveau et diplômé en psychologie, je combine une compréhension profonde du corps et du mindset pour accompagner mes clients vers des résultats concrets. La naturopathie m'a révélé qu'on peut régler énormément de problématiques à la source, de manière naturelle, en agissant sur l'alimentation, l'hygiène de vie et la supplémentation ciblée. Ce qui me passionne : guider chaque personne dans sa transformation sans rigidité, en respectant son rythme, pour qu'elle atteigne ses objectifs et se retrouve pleinement en tant qu'individu.",
    strengths: ["Mindset", "Gestion du cortisol", "Digestion"],
  },
  {
    id: "cloe",
    name: "Cloé Morin Gosselin",
    role: "Adjointe administrative & réseaux sociaux",
    specialty: "Expérience Client & Contenu",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce942dd985140175a450.jpg",
    bio: "Je suis souvent la première personne que vous rencontrez chez NEO — et j'y mets tout mon cœur. Mon rôle dépasse largement l'administration : j'accompagne chaque client dès le premier contact, je crée du contenu pour faire rayonner la clinique et je cherche constamment de nouvelles façons d'améliorer votre expérience. Ce que j'aime le plus dans mon travail ? Sentir que chaque personne repart avec le sourire et le sentiment d'être vraiment bien prise en charge.",
    strengths: ["Écoute & bienveillance", "Organisation", "Bienveillance"],
  },
  {
    id: "lyliane",
    name: "Lyliane Champagne",
    role: "Accompagnement & Relation Client",
    specialty: "Relation client",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985cfa90a7fd143b0b18b25.jpg",
    bio: "Passionnée par l’humain et l’optimisation du bien-être, je me spécialise dans la compréhension profonde des besoins et du mode de vie de chaque client. Mon rôle est de créer une connexion authentique et de m’assurer que chaque personne se sente pleinement comprise, soutenue et guidée à travers son parcours. J’encadre également l’équipe des conseillers en accompagnement afin de maintenir un standard élevé d’écoute, de qualité et d’expérience client. Grande voyageuse, j’apporte une ouverture et une sensibilité qui enrichissent chaque interaction.",
    strengths: ["Expérience & accompagnement client", "Encadrement d’équipe", "Communication"],
  },
];

export const STATS: Stat[] = [
  { label: "Années d'expertise", value: 11, suffix: " Ans", prefix: "" },
  { label: "Personnes aidées", value: 15000, suffix: "+", prefix: "" },
  { label: "Avis 5 étoiles", value: 4000, suffix: "+", prefix: "" },
  { label: "Note Moyenne", value: 4.9, suffix: "/5", prefix: "" },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Marc-André L.",
    rating: 5,
    text: "Je pensais avoir tout essayé pour mon énergie. L'approche de NEO n'a rien à voir avec les diètes classiques. C'est scientifique, précis et surtout humain.",
    result: "Énergie retrouvée en 3 semaines"
  },
  {
    id: "2",
    name: "Sophie G.",
    rating: 5,
    text: "Enfin une équipe qui écoute vraiment. Ils ont trouvé la cause de mes problèmes digestifs là où d'autres me disaient que c'était 'dans ma tête'.",
    result: "Digestion optimisée"
  },
  {
    id: "3",
    name: "Jean-Philippe R.",
    rating: 5,
    text: "Professionnalisme incroyable. La consultation initiale m'a ouvert les yeux sur mon métabolisme.",
    result: "Perte de gras durable"
  }
];

export const BOOKING_IFRAME_SRC = "https://api.leadconnectorhq.com/widget/booking/DIN6EPtG7eNU3Gf6ZRoC";

// ─── BOUTIQUE : catégories canoniques ───────────────────────────────────────────
// Les produits WooCommerce ont des tags variés ; on les range dans ces buckets.
// "Accompagnement NEO" est la dernière — visible uniquement pour les clients connectés.
// L'ordre ci-dessous = l'ordre d'affichage des pastilles dans la boutique.
export const SHOP_CATEGORIES = [
  "Santé Globale & Vitalité",
  "Digestion & Santé Intestinale",
  "Énergie, Stress & Sommeil",
  "Performance, Muscles & Métabolisme",
  "Santé Ciblée (Hormones & Immunité)",
  "Accompagnement NEO",
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

// Catégorie par défaut (fourre-tout) pour tout produit non couvert par une règle.
export const SHOP_DEFAULT_CATEGORY: ShopCategory = "Santé Globale & Vitalité";

// Catégorie réservée aux clients connectés — JAMAIS de rabais -13 % sur ces produits.
// (« Bloc de suivis NEO », etc. — produits WooCommerce rangés via la catégorie WC « NEOflow ».)
export const NEO_ACCOMPANIMENT_CATEGORY: ShopCategory = "Accompagnement NEO";

// Catégorie WooCommerce qui alimente « Accompagnement NEO ». Aussi exclue du coupon
// client -13 % côté serveur (voir app/api/checkout/create-order/route.ts) → id #18 « NEOflow ».
export const NEO_ACCOMPANIMENT_WC_CATEGORY = "NEOflow";
export const NEO_ACCOMPANIMENT_WC_CATEGORY_ID = 18;

// ─── BOUTIQUE : prix client ─────────────────────────────────────────────────────
// Les clients connectés (session Supabase active) bénéficient automatiquement
// d'un rabais sur le prix régulier. Un seul endroit à modifier pour changer le %.
export const CLIENT_DISCOUNT_RATE = 0.13;            // 13 %
export const CLIENT_DISCOUNT_LABEL = "−13 %";

// Le rabais client ne s'applique QU'AUX produits de la marque « Designs for Health ».
// Aucune taxonomie de marque dans WooCommerce → on identifie par le préfixe du nom.
// Utilisé côté client (affichage + panier) ET côté serveur (coupon limité à ces produits).
export const CLIENT_DISCOUNT_BRAND_PREFIX = "designs for health";

/** Vrai si le produit (par son nom) est admissible au rabais client -13 %. */
export function isClientDiscountEligible(name: string): boolean {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .startsWith(CLIENT_DISCOUNT_BRAND_PREFIX);
}

/** Prix client = prix régulier moins le rabais client. */
export function prixClient(regular: number): number {
  return regular * (1 - CLIENT_DISCOUNT_RATE);
}

// Règles de mappage : pour chaque produit, la PREMIÈRE règle dont un des
// `wcTags` correspond à une catégorie WooCommerce du produit gagne.
// (comparaison insensible à la casse / aux accents)
export const SHOP_CATEGORY_RULES: Array<{ category: ShopCategory; wcTags: string[] }> = [
  { category: "Digestion & Santé Intestinale", wcTags: ["Digestion", "Detox"] },
  { category: "Énergie, Stress & Sommeil", wcTags: ["Cortisol"] },
  { category: "Santé Ciblée (Hormones & Immunité)", wcTags: ["endocrinien / métabolisme", "thyroide"] },
  { category: "Performance, Muscles & Métabolisme", wcTags: ["glycémie", "Protéine"] },
  { category: "Accompagnement NEO", wcTags: ["NEOflow"] },
];
