# Bilan Léo — questionnaire de qualification (`/bilanleo`)

**Date :** 2026-08-04
**Statut :** design validé par Hugues

## Objectif

Une page cachée et non indexée qui fait passer un questionnaire de qualification
en 8 questions, joue une courte animation d'analyse, puis présente l'écran de
réservation avec les deux calendriers Go High Level (clinique et
visioconférence). Les réponses partent vers un webhook Make.

La page garde l'identité visuelle du site et son menu du haut.

## Portée

Dans la portée : la route `/bilanleo`, le parcours complet, l'animation, l'écran
de résultat avec les calendriers intégrés, le relais serveur vers Make.

Hors portée : toute modification de `/quiz` (le quiz métabolique public, projet
distinct), toute logique de scoring, tout écran de disqualification.

## Visibilité

- Route : `neoperformance.ca/bilanleo`
- `metadata.robots = { index: false, follow: false }` → `noindex, nofollow`
- Absente de `app/sitemap.ts`
- Aucun lien entrant depuis le menu, le footer ou une autre page
- Accessible sans authentification : quiconque a l'URL peut répondre

## Identité visuelle

`components/SiteChrome.tsx` n'est pas modifié : la page hérite du header, du
footer, du bandeau cookies, du chatbot, de la police Montserrat et de la palette
`neo` (`--color-neo: #00BBB1` et ses déclinaisons 50 à 900 définies dans
`index.css`).

Le parcours occupe la hauteur disponible sous le header. Mobile d'abord, une
question par écran, barre de progression en haut, bouton retour.

## Composants

| Fichier | Responsabilité |
|---|---|
| `app/bilanleo/page.tsx` | Composant serveur : metadata `noindex`, monte `BilanFlow` |
| `components/bilanleo/questions.ts` | Données pures : Q1–Q8, les 6 blocs conditionnels, les libellés. Aucune logique |
| `components/bilanleo/BilanFlow.tsx` | Client : machine à états, navigation, progression, envoi du webhook |
| `components/bilanleo/QuestionScreen.tsx` | Rendu d'une question : choix unique ou champ texte long |
| `components/bilanleo/ContactScreen.tsx` | Prénom, nom, courriel, cellulaire + validation |
| `components/bilanleo/AnalysisScreen.tsx` | Animation de 3 s, 3 états de texte |
| `components/bilanleo/ResultScreen.tsx` | Écran « qualifié », deux boutons, calendrier GHL intégré |
| `app/api/bilanleo/route.ts` | Route serveur qui relaie la charge utile vers Make |

Chaque unité a une frontière claire : le contenu vit dans les données, la
navigation dans un seul composant, la présentation dans les écrans.

## Le questionnaire

Toutes les questions sont obligatoires. Aucune n'est sautable par la personne.

### Q1 — Objectif numéro un (choix unique)

- Perdre du gras et changer ma composition corporelle
- Retrouver mon énergie
- Régler ma digestion
- Mieux dormir
- Baisser mon stress
- Équilibrer mes hormones

### Q2 — Objectif secondaire (choix unique)

Les mêmes options que Q1, **sauf celle déjà choisie**, plus :

- Aucun autre, c'est vraiment juste ça

### Q3 — Bloc conditionnel dépendant de Q1

### Q4 — Bloc conditionnel dépendant de Q2

Si Q2 = « Aucun autre, c'est vraiment juste ça », Q4 est **entièrement sautée**
et le parcours passe à Q5.

### Les six blocs conditionnels

Identiques pour Q3 et Q4, sélectionnés par l'objectif correspondant.

**Perte de gras — « Où en es-tu exactement ? »**
- Mon poids est immobile malgré mes efforts
- Mon poids monte malgré mes efforts
- Je perds, mais je reprends chaque fois que j'arrête
- Je n'ai jamais vraiment essayé de façon structurée

**Énergie — « Qu'est-ce qui décrit le mieux ta fatigue ? »**
- Je manque de sommeil, deux bonnes nuits et ça va mieux
- Je dors sept ou huit heures et je me lève comme si je n'avais pas dormi
- Je tombe en milieu d'après-midi
- J'ai plus d'énergie le soir que le jour

**Digestion — « Quand ton inconfort apparaît-il ? »**
- Dans l'heure suivant le repas
- Seulement en fin de journée
- Dès le réveil, mon ventre est déjà distendu
- C'est irrégulier, sans lien clair avec les repas

**Sommeil — « À quoi ressemblent tes nuits ? »**
- J'ai du mal à m'endormir, la tête tourne
- Je me réveille entre 2 h et 4 h
- Je dors assez, mais je ne récupère pas
- Je n'ai simplement pas assez d'heures

**Stress — « Comment ton stress se manifeste-t-il le plus ? »**
- Je suis tendue et incapable de décrocher, même au repos
- Je suis vidée, je n'ai plus de réserve
- Je suis irritable, ma mèche est courte
- Je mange en réaction au stress

**Hormones — « Qu'est-ce qui a le plus changé ? »**
- Mon cycle est irrégulier ou absent
- Mes symptômes prémenstruels sont plus marqués qu'avant
- J'ai des bouffées de chaleur ou des sueurs nocturnes
- Mon gras s'accumule au ventre sans que j'aie changé mes habitudes

### Q5 — « Depuis combien de temps vis-tu avec ça ? »

- Moins de 3 mois
- Entre 3 et 12 mois
- Entre 1 et 3 ans
- Plus de 3 ans

### Q6 — « Qu'est-ce que tu as déjà essayé ? »

Champ texte long, sans longueur minimale et sans compteur. Obligatoire comme
toutes les autres : le bouton « Suivant » se débloque dès qu'il y a du texte.

Texte d'aide sous le champ : « Deux ou trois phrases. Ce qui a fonctionné au
début, et ce qui a arrêté de fonctionner. »

### Q7 — Disponibilité

« Es-tu disponible pour une rencontre de 75 minutes entre le 10 et le 31 août ? »

- Oui, en clinique à Brossard
- Oui, en visioconférence
- Oui, l'un ou l'autre
- Non, seulement en septembre

La durée est fixée à **75 minutes** partout, en cohérence avec l'écran de
résultat.

### Q8 — Tests à domicile

« Avant la rencontre, il y a deux tests à faire chez toi, environ dix minutes au
total. Es-tu partante ? »

- Oui
- J'aimerais en savoir plus avant
- Non

### Écran final — coordonnées

Prénom, nom, courriel, cellulaire. Tous obligatoires. Validation de format sur
le courriel et sur le téléphone (10 chiffres nord-américains, la ponctuation de
saisie est tolérée puis normalisée). Aucune case de consentement à cette étape.

## Navigation et progression

La barre de progression compte 9 ou 10 étapes selon que Q4 existe, déterminé dès
la réponse à Q2, pour qu'elle ne recule jamais.

Le bouton retour revient à l'écran précédent en conservant toutes les réponses
déjà données. Revenir sur Q1 ou Q2 et changer d'objectif invalide la réponse
conditionnelle correspondante (Q3 ou Q4), qui doit être redonnée.

Transitions en fondu-glissé avec `motion`, déjà présent dans les dépendances.

## Qualification

Tous les répondants voient l'écran « qualifié ». Aucune branche alternative,
aucun écran de disqualification. Le tri se fait en aval, dans Make, à partir des
réponses reçues.

## Webhook vers Make

Déclenché **au moment où la personne valide ses coordonnées**, donc avant
l'animation d'analyse. L'appel n'est jamais attendu : l'animation démarre
immédiatement.

Le navigateur appelle `/api/bilanleo`, une route serveur Next qui relaie vers
`https://hook.us1.make.com/2r7ngtl1aqe8k5dfp2ecxpjf43gx52f7`. Ce relais évite
tout blocage CORS et garde l'URL du hook hors du code livré au navigateur.

Charge utile :

```json
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "phone": "",
  "reponses": {
    "objectif_principal": "",
    "objectif_principal_detail": "",
    "objectif_secondaire": "",
    "objectif_secondaire_detail": "",
    "duree": "",
    "deja_essaye": "",
    "disponibilite": "",
    "tests_ok": ""
  }
}
```

Les valeurs sont les libellés exacts choisis par la personne.
`objectif_secondaire_detail` vaut la chaîne vide quand Q4 a été sautée.

Gestion d'échec : un seul réessai après 2 secondes. Si le réessai échoue aussi,
l'erreur est journalisée avec `console.error` et le parcours continue. Un échec
du webhook ne bloque jamais la personne.

## Animation d'analyse

Trois secondes maximum. Un cercle ou une barre de progression avec trois états
de texte qui se succèdent :

1. « On lit tes réponses... »
2. « On croise avec nos profils métaboliques... »
3. « On prépare ton résultat... »

Sobre, sans son, sans faux suspense. Crédible plutôt que théâtrale.

## Écran de résultat

**Titre :** Ton profil correspond à ce pour quoi cette évaluation est bâtie.

**Corps :** Il te reste à choisir ton moment. La rencontre dure 75 minutes.

**Deux boutons**, côte à côte sur ordinateur, empilés sur mobile :

| Bouton | Sous-titre |
|---|---|
| En clinique à Brossard | Inclut l'analyse de composition corporelle InBody |
| En visioconférence | Même évaluation, sans le test InBody |

Au clic, le calendrier correspondant apparaît **dans la page**, sous les
boutons, sans redirection.

- Clinique : `https://api.leadconnectorhq.com/widget/booking/JoFdnQsmZzd5lO0EQPH5`
- Visioconférence : `https://api.leadconnectorhq.com/widget/booking/YCEFrPWQDpvfi30usnPF`

L'iframe reprend les attributs fournis par GHL (`allow="payment"`, largeur
100 %, sans bordure, `scrolling="no"`). Le script
`https://link.msgsndr.com/js/form_embed.js` est chargé une seule fois via
`next/script` — c'est lui qui redimensionne l'iframe automatiquement.

Le prénom, le nom, le courriel et le téléphone sont passés en paramètres d'URL à
l'iframe pour pré-remplir le formulaire de réservation GHL et réduire la
friction de dernière étape.

Le formulaire GHL contient déjà sa case de consentement : aucune case n'est
ajoutée côté site.

## Erreurs et cas limites

- Webhook indisponible : réessai unique, puis journalisation, parcours continu.
- Script GHL bloqué : l'iframe s'affiche quand même, sans redimensionnement
  automatique ; une hauteur minimale garantit qu'elle reste utilisable.
- Rechargement de page en cours de parcours : le parcours repart du début. Pas
  de persistance, c'est un formulaire court.

## Tests

- Le saut de Q4 quand Q2 = « Aucun autre » : la progression reste cohérente et
  `objectif_secondaire_detail` part vide.
- Q2 n'affiche jamais l'option déjà choisie en Q1.
- Q3 et Q4 servent le bon bloc conditionnel pour chacun des six objectifs.
- Q6 bloque tant que le champ est vide et débloque dès le premier caractère.
- Le courriel et le téléphone rejettent les formats invalides.
- Le retour conserve les réponses ; changer Q1 invalide Q3.
- La charge utile du webhook contient les huit clés attendues.
- Un échec du webhook n'empêche pas l'affichage du résultat.
- La page renvoie `noindex, nofollow` et est absente du sitemap.
