# Évaluation de reprise : configuration et tests

Pages : `/evaluation-reprise` (offre et paiement) et `/evaluation-reprise/reserver?session_id=` (choix du moment).
Toutes deux en `noindex, nofollow`, hors menu (SiteChrome) et hors sitemap.

Lien du courriel GHL :
`/evaluation-reprise?cid={{contact.id}}&prenom={{contact.first_name}}&nom={{contact.last_name}}&courriel={{contact.email}}&tel={{contact.phone}}&utm_source=ghl&utm_medium=email&utm_campaign=reactivation`

Les paramètres servent seulement à préremplir le formulaire (une balise GHL non résolue, `{{…}}`, est ignorée). La naturo vient toujours de `evaluation-reprise-profil`.

## Configuration

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_EVALUATION_REPRISE_API_URL` | URL de base des Edge Functions. Repli : `NEXT_PUBLIC_CONTINUITE_API_URL`, puis `NEXT_PUBLIC_SUPABASE_URL/functions/v1/` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publiable Stripe (partagée avec `/continuite`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clé de site Turnstile (partagée avec `/continuite`) |
| `NEXT_PUBLIC_EVALUATION_REPRISE_MOCK` | `1` = tout simulé, en local seulement. **Jamais sur Netlify.** |

## Retirer la simulation (quand les endpoints sont déployés)

1. Supprimer `lib/evaluation-reprise/mock.ts`.
2. Dans `lib/evaluation-reprise/api.ts` : retirer `import * as mock`, la constante `MOCK` et les lignes `if (MOCK) …`. Garder `modeSimule = false` ou retirer le bandeau dans `components/evaluation-reprise/Cadre.tsx`.
3. Dans `components/evaluation-reprise/Paiement.tsx` : retirer `PaiementSimule` et le test `mock_er__`.

## Prérequis côté app NEO

- `return_url` du Checkout : `https://www.neoperformance.ca/evaluation-reprise/reserver?session_id={CHECKOUT_SESSION_ID}`.
- CORS : `https://www.neoperformance.ca`, `https://neoperformance.ca` et l'URL d'aperçu Netlify, avec l'en-tête `content-type`.
- `evaluation-reprise-session` : `ouverte` et `expiree` renvoient à la page 1 ; `remboursee` affiche « Ce paiement a été remboursé » sans agenda ; toute autre valeur est traitée comme payée.
- Courriel : le formulaire retire tous les espaces, passe en minuscules et valide avec la même expression que `evaluation-reprise-checkout` (254 caractères au plus, 64 avant le @) avant Turnstile et le Checkout (`lib/evaluation-reprise/courriel.ts`). Le code `courriel_invalide` du serveur s'affiche sous le champ courriel.
- `trop_de_tentatives` (créneaux et réservation) : le message du serveur est affiché tel quel.
- `evaluation-reprise-session` renvoie aussi `prenom` et `naturo: { prenom } | null`, pour « Merci {prénom} … avec {naturo} » dès l'arrivée. Si l'un des deux est nul, la page dit « Merci, ton évaluation est payée » ou « avec ta naturopathe ».
- `evaluation-reprise-creneaux` : `naturo` est `{ prenom } | null`. `debut` = AAAA-MM-JJ (Montréal), fenêtre de 14 jours ; « Semaine suivante » avance `debut` de 7 jours.
- `evaluation-reprise-reserver` : `date` en AAAA-MM-JJ, `heure` en HH:MM (Montréal). Codes gérés : `creneau_indisponible` (message affiché, créneaux rechargés) et `deja_reserve` (confirmation affichée).

## Scénarios simulés (`NEXT_PUBLIC_EVALUATION_REPRISE_MOCK=1`)

| Scénario | Comment |
| --- | --- |
| Naturo connue | `/evaluation-reprise?cid=abc&prenom=Marie` |
| Naturo inconnue | `cid=sans-naturo`, ou aucun `cid` |
| Profil en erreur | `cid=erreur` (page utilisable, naturo de l'équipe) |
| Erreur Checkout | courriel contenant `+captcha` ou `+serveur` |
| Courriel refusé par le serveur | courriel contenant `+invalide` |
| Courriel refusé par le formulaire | `hugues,pugliese@gmail.com`, `a@b.c`, `x@gmail` |
| Payée | `/evaluation-reprise/reserver?session_id=mock_er_paye` |
| Aucun créneau | `session_id=mock_er_aucun` (ou courriel `+aucun` en page 1) |
| Créneau pris | `session_id=mock_er_conflit` (ou courriel `+conflit`) |
| Déjà réservée | `session_id=mock_er_reserve` |
| Non payée | `session_id=mock_er_ouverte` (retour à la page 1) |
| Remboursée | `session_id=mock_er_remboursee` |

## Tests en réel (à faire une fois les endpoints déployés)

| # | Scénario | Résultat attendu |
| --- | --- | --- |
| R0 | Dossier test | Tous les tests en réel se font sur le dossier test `hugues.pugliese@gmail.com` |
| R1 | Lien GHL réel sur téléphone | Prénom dans le titre, formulaire prérempli, naturo de la cliente affichée |
| R2 | Paiement avec ta carte | Checkout intégré, retour sur `/reserver`, « Merci … ton évaluation est payée » |
| R3 | Réservation clinique | Rendez-vous créé dans l'agenda de la naturo, confirmation avec adresse, courriel reçu |
| R4 | Réservation en ligne | Confirmation « Le lien vidéo te sera envoyé par courriel. » |
| R5 | Recharger `/reserver` après réservation | Confirmation, aucun nouveau choix possible |
| R6 | Paiement abandonné puis `/reserver?session_id=<cs ouverte>` | Retour à la page 1 |
| R7 | Indexation | `noindex, nofollow` sur les 2 pages, rien au sitemap ni au menu |
| R8 | Après le test | Rembourser dans Stripe et annuler le rendez-vous |
