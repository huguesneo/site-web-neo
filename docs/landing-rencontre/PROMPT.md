# Prompt Claude Code : landing page « rencontre découverte » pour les pubs Meta

## Contexte

Je veux deux nouvelles pages sur le site neoperformance.ca (ce dépôt, Next.js 15 App Router + Tailwind 4, déployé sur Netlify). Le trafic vient des pubs Meta. La personne arrive, comprend l'offre et réserve une rencontre découverte gratuite dans le calendrier GHL. Je vais tester les deux versions l'une contre l'autre.

Les maquettes HTML validées sont dans `docs/landing-rencontre/` :
- `rencontre-A-booking-direct.html` : version A, le calendrier est visible tout de suite.
- `rencontre-B-qualification.html` : version B, 4 questions et un engagement de présence, puis le calendrier.

Ces fichiers sont la référence pour le **texte** (à reprendre mot à mot), la **structure des sections** et la **logique du questionnaire**. Pour le **style**, intègre-les au design du site (composants existants comme `Section`, `Reveal`, `Stagger`, les polices et couleurs du site). Ne colle pas le HTML brut, et ne reprends pas le `position:fixed` plein écran de la maquette : c'était pour GHL.

Avant de coder, lis `app/consultation/page.tsx`, `views/Consultation.tsx`, `constants.ts` (BOOKING_IFRAME_SRC), `app/guide-stress/page.tsx` et `app/porte-ouverte/` pour suivre les conventions du dépôt. Propose-moi ton plan en quelques lignes, puis code.

## Pages à créer

- `/rencontre-decouverte` : version A
- `/rencontre-decouverte-b` : version B

Pour les deux pages :
- `robots: { index: false, follow: false }` et aucune entrée dans `sitemap.ts` : ce sont des pages de pub.
- Pas de menu de navigation ni de liens qui font sortir de la page. Seulement le logo, sans lien, en haut. Footer minimal : mention légale et lien vers la politique de confidentialité.
- Sections dans l'ordre de la maquette : hero (texte + carte calendrier), « Comment se passe ta rencontre » (3 étapes), « Pourquoi c'est différent » (photo `methode.webp`), avis (4 citations + widget d'avis GHL), FAQ en accordéon, CTA final.
- Images dans `public/` : `clinique.webp` (hero), `methode.webp`, `avatar-1.jpg` à `avatar-4.jpg`. Utilise `next/image`.
- Mobile d'abord : 75 % du trafic est sur téléphone. Sur mobile, l'ordre est photo, titre, texte, puis carte calendrier. Ajoute un bouton collant en bas (« Choisir ma plage » en A, « Répondre aux 4 questions » en B) qui défile jusqu'à la carte et se cache quand la carte est visible.
- Widget d'avis : `https://reputationhub.site/reputation/widgets/review_widget/YG2spvWJqnD75L3V95UJ?widgetId=698b1786d6e303bafa03eee3`, chargé en lazy.

## Calendrier

- Même calendrier que la VSL (page go.neoperformance.ca/booking-atelier), URL exacte : `https://api.leadconnectorhq.com/widget/booking/DIN6EPtG7eNU3Gf6ZRoC?calendrier_decouverte=A`. Garde le paramètre `calendrier_decouverte=A` tel quel : il remplit un champ de contact GHL que les workflows peuvent utiliser. Ne pas utiliser `BOOKING_IFRAME_SRC` sans ce paramètre. Faits vérifiés : 45 minutes, Google Meet, round robin, réservation sur 7 jours, redirection après réservation vers `https://go.neoperformance.ca/felicitation-booking`. Ne change rien dans GHL.
- Charge `https://link.msgsndr.com/js/form_embed.js` (via `next/script`) pour que l'iframe se redimensionne toute seule. Il ne doit pas y avoir de barre de défilement dans l'iframe sur iPhone.
- **Attribution (essentiel)** : ajoute à l'URL de l'iframe tous les paramètres de la page (`utm_*`, `fbclid`, `ad_id`, `adset_id`, `campaign_id`, etc.), plus `lp_version=A` ou `lp_version=B`. Lis-les côté client avec `useSearchParams`, dans une limite `Suspense`.

## Version B : le questionnaire

Reprends exactement les 4 questions, les choix et les textes de la maquette B :
- Q1 et Q2 : un seul choix, avec passage automatique à la question suivante.
- Q3 : choix multiple.
- Q4 : un seul choix. Le choix « Je m'informe seulement » affiche une note rassurante. On ne bloque personne.
- Étape finale : case à cocher d'engagement de présence, obligatoire pour voir le calendrier.
- Barre de progression et bouton Retour.

Une fois terminé, la carte affiche le calendrier. Les réponses sont ajoutées à l'URL de l'iframe : `objectif`, `depuis`, `essaye`, `pret`, `engagement=oui`. Je vais créer de mon côté des champs personnalisés avec ces clés de requête dans le formulaire du calendrier.

Accessibilité : les choix sont des `button`, la case d'engagement est un vrai `input type=checkbox` avec un label, et tout est navigable au clavier.

## Suivi Meta (à vérifier en premier)

Je n'ai trouvé aucun pixel Meta dans ce dépôt. Pixel NEO : `731004690765374`.
- Charge le pixel seulement sur ces deux pages (composant client réutilisable). Envoie `PageView` au chargement.
- Version B : envoie `trackCustom('qualif_complete', { pret })` à la fin du questionnaire.
- Ne mets pas d'événement `Schedule` ou `Lead` sur ces pages. La réservation est confirmée sur `felicitation-booking`, côté GHL, qui a déjà le pixel.
- S'il existe déjà une bannière de consentement aux témoins dans le site, respecte-la (Loi 25). Sinon, dis-le-moi au lieu d'en inventer une.

## Règles de contenu (non négociables)

- Français professionnel, tutoiement, négations complètes. Aucun tiret cadratin.
- Jamais le mot « diagnostic », jamais le nom d'une maladie ou d'une pathologie.
- « Ton ou ta naturopathe » : on a des naturopathes hommes et femmes.
- Ne pas dire que la rencontre se fait avec un ou une naturopathe : elle se fait avec « un membre de l'équipe NEO ».
- Les avis : prénom + initiale seulement, texte exact de la maquette.

## Finition

- `npm run build` doit passer sans erreur ni avertissement de type.
- Vérifie le rendu à 390 px et à 1440 px. Pour la version B, fais tout le parcours du questionnaire, puis vérifie dans l'onglet réseau que l'URL de l'iframe contient bien les UTM, `lp_version` et les réponses. Teste avec `?utm_source=test&fbclid=abc`.
- Travaille sur une branche et ouvre une PR. Ne merge pas : je vais regarder l'aperçu Netlify avant.
- Donne-moi à la fin les deux URL de production, et la liste des champs personnalisés à créer dans GHL.

## Barre de qualité (une page de pub doit être rapide)

- Lighthouse mobile : Performance 90+, Accessibilité 95+. Donne-moi les scores avant et après.
- Image du hero en `priority` et bien dimensionnée : LCP sous 2,5 s sur mobile 4G.
- Réserve la hauteur de l'iframe du calendrier (environ 650 px), sinon la page saute au chargement (CLS sous 0,1).
- Charge le widget d'avis et le pixel après le rendu principal, pour ne pas ralentir le premier affichage.
- Le pixel à utiliser est « NEO performance - GHL », ID `731004690765374`. C'est le même que sur `felicitation-booking`. N'utilise pas l'autre pixel (1022843418482938).
- Avant de me dire que c'est fini, fais des captures d'écran à 390 px et à 1440 px pour A et pour B (questionnaire terminé), relis-les comme un client exigeant, corrige ce qui accroche, puis montre-moi le résultat final.
