
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
  { label: "Blog", path: "/blog" },
  { label: "Boutique", path: "/boutique" },
  { label: "Nous Joindre", path: "/contact" },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "hugues",
    name: "Hugues Pugliese",
    role: "Fondateur & Naturopathe",
    specialty: "Optimisation Métabolique",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce942dd985198475a451.jpg",
    bio: "Depuis plus de 10 ans, Hugues a une mission claire : changer la façon dont les gens abordent leur santé métabolique. Avec son équipe, il a accompagné plus de 15 000 personnes vers des résultats durables, sans diètes restrictives, sans solutions génériques. Toujours à innover, il a notamment développé LÉO, une IA exclusive intégrée directement dans les plans de ses clients.",
    strengths: ["Vision & innovation", "Gestion du système nerveux", "Développement de programmes durables"],
  },
  {
    id: "thibault",
    name: "Thibault Van Elsue",
    role: "Naturopathe & Ostéopathe",
    specialty: "Santé métabolique",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce941dfc02560abfaf3b.jpg",
    bio: "Ma passion pour la naturopathie est née de mon intérêt profond pour la santé, la performance et l’impact concret qu’un mode de vie bien structuré peut avoir sur l’énergie, la composition corporelle et le bien-être global. Dans mon approche, je cherche à simplifier la santé en proposant des stratégies réalistes, individualisées et fondées sur des principes solides.Ce qui me passionne le plus dans mon travail, c’est d’aider les clients à mieux comprendre leur corps, à reprendre le contrôle de leur santé et à obtenir des résultats durables.",
    strengths: ["Stress & récupération", "Équilibre hormonal", "Santé métabolique"],
  },
  {
    id: "jessica",
    name: "Jessica Emond",
    role: "Naturopathe",
    specialty: "Santé de la femme",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce942dd985f9ab75a453.jpg",
    bio: "Passionnée par la santé hormonale, Jessica accompagne les femmes vers un équilibre retrouvé à travers toutes les étapes de la vie.",
    strengths: ["Hormones féminines", "Fertilité", "Énergie & Vitalité"],
  },
  {
    id: "tamara",
    name: "Tamara Ovayan",
    role: "Naturopathe",
    specialty: "Gestion de stress et équilibre hormonal",
    image: "https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/69e7599bc56ad279086de1cd.jpg",
    bio: "Je me suis tournée vers la naturopathie pour mieux comprendre les causes profondes derrière les symptômes chroniques, souvent banalisés. Mon approche est axée sur l’équilibre hormonal, la digestion et la gestion du stress, en tenant compte de la réalité unique de chaque client en leur préparant un plan personnalisé avec plusieurs variétés. Mes clients me le disent souvent : “J’ai des résultats, et j’ai même pas l’impression de suivre un plan”.",
    strengths: ["Optimisation du mindset", "Hormone féminine", "Flexibilité alimentaire"],
  },
  {
    id: "brice",
    name: "Brice Duvalet",
    role: "Naturothérapeute",
    specialty: "Hygiène de vie",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce940708e45c92112c76.jpg",
    bio: "Expert en changement d'habitudes, Brice vous aide à intégrer durablement les piliers de la santé dans votre quotidien.",
    strengths: ["Sommeil", "Nutrition sportive", "Coaching de vie"],
  },
  {
    id: "cloe",
    name: "Cloé Morin Gosselin",
    role: "Responsable Service Client",
    specialty: "Accueil & Orientation",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985ce942dd985140175a450.jpg",
    bio: "Le premier sourire de NEO. Cloé s'assure que votre expérience soit fluide, rassurante et exceptionnelle dès le premier contact.",
    strengths: ["Écoute", "Organisation", "Bienveillance"],
  },
  {
    id: "lyliane",
    name: "Lyliane Champagne",
    role: "Responsable Communication",
    specialty: "Rayonnement",
    image: "https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/6985cfa90a7fd143b0b18b25.jpg",
    bio: "Lyliane porte la voix de NEO Performance pour éduquer et inspirer notre communauté grandissante.",
    strengths: ["Créativité", "Pédagogie", "Communication"],
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
