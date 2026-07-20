import { GraduationCap, MessagesSquare, RefreshCw } from 'lucide-react';

/*
 * Contenu partagé par les pages de vente privées :
 *  - /protocole-neo : montrée en partage d'écran par les closers pendant l'appel
 *  - /mon-dossier   : envoyée au prospect après l'appel s'il n'a pas closé
 *
 * Source unique : si un prix, une question FAQ ou un engagement change, on le
 * modifie ici et les deux pages restent cohérentes.
 */

// Fiche Google (GBP) de la clinique — preuve vérifiable des 4 000+ avis.
// Même établissement que l'embed Maps de la page contact (cid décimal).
export const GOOGLE_LISTING_URL = 'https://maps.google.com/?cid=2555168139282865277';

export const PITCH_IMAGES = {
  hero: 'https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/6985ce940708e4bb93112c71.jpg',
  dossierApp:
    'https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/699ee8f20b13fa791f374dab.png',
  leoGif:
    'https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/699eee370b13fa408838235f.gif',
  transformations: [
    'https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/698b68f91fe16693a25c84ea.png',
    'https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/698b6b2167d74944aa5c029d.png',
    'https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/698b69e967d7494c815baf8d.png',
    'https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/698b694f52c9522a67bcf550.png',
  ],
};

export const VALUE_STACK = [
  { label: 'Bilan métabolique et analyse clinique', price: '550 $' },
  { label: 'Structure alimentaire 100 % sur-mesure', price: '650 $' },
  { label: '15 semaines de suivis cliniques privés', price: '1 650 $' },
  { label: 'Accès Chat avec ton naturopathe (5j/7)', price: '750 $', bonus: true },
  { label: 'Accès illimité à Léo, ton naturopathe IA', price: '700 $', bonus: true },
  { label: 'Formation vidéo complète sur le maintien', price: '800 $', bonus: true },
];

export const ENGAGEMENTS = [
  {
    icon: RefreshCw,
    title: 'Un plan réajusté en continu',
    text: "Si ton corps plateau, on ne te laisse pas là : nouveaux tests à la semaine 6 et restructuration complète du plan. Ton protocole évolue avec tes résultats.",
  },
  {
    icon: MessagesSquare,
    title: 'Un soutien accessible 7j/7',
    text: "Tu n'es jamais laissé seul avec une question : ton naturopathe te répond par chat 5 jours sur 7, et Léo, ton naturopathe IA, est disponible 24/7 — même le dimanche à l'épicerie.",
  },
  {
    icon: GraduationCap,
    title: 'Ton autonomie comme objectif final',
    text: "Les dernières semaines sont dédiées au maintien : tu repars avec la méthode et la formation pour garder tes résultats à vie, sans dépendre de nous.",
  },
];

export const PITCH_FAQ = [
  {
    q: 'Est-ce une autre diète restrictive ?',
    a: "Non, et c'est exactement l'inverse. On ne coupe pas les calories : on répare d'abord le stress, la digestion et les hormones pour que ton métabolisme réutilise l'énergie au lieu de la stocker. La structure alimentaire est bâtie sur tes tests, pas sur la privation.",
  },
  {
    q: 'Combien de temps ça demande par semaine ?',
    a: "L'évaluation initiale dure 60 à 75 minutes. Ensuite, un suivi clinique aux 2 semaines et quelques minutes par jour dans l'app avec Léo (photos de repas, questions, scan à l'épicerie). C'est conçu pour des gens occupés.",
  },
  {
    q: 'Et si mon corps ne répond pas ?',
    a: "C'est prévu dans le protocole : nouveaux tests à la semaine 6 et changement complet de la structure alimentaire pour briser les plateaux. Ton naturopathe ajuste le plan en continu pendant les 15 semaines — pas juste au début.",
  },
  {
    q: 'Est-ce couvert par mes assurances ?',
    a: "Le programme émet des reçus officiels en naturopathie. La majorité des assurances collectives remboursent une partie des soins en naturopathie — vérifie le pourcentage de couverture dans ta police. Une grande partie de ton investissement peut t'être remboursée.",
  },
  {
    q: "J'ai une condition médicale ou je prends des médicaments",
    a: "L'évaluation initiale fait le tour complet de ta santé et le plan s'adapte à ta réalité. L'accompagnement ne remplace jamais un suivi médical : on travaille en complément de ton médecin.",
  },
  {
    q: "C'est en ligne ou en clinique ?",
    a: "Les deux : en téléconsultation partout au Québec, ou en clinique à Brossard sur la Rive-Sud. Le suivi dans l'app et l'accès à ton naturopathe sont identiques dans les deux cas.",
  },
];
