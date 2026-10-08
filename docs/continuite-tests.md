# NEO Continuité : liste de tests

Pages : `/continuite`, `/continuite/naturo`, `/continuite/merci`.
Contrat d'API : `docs/continuite-api.md` du dépôt de l'app NEO.

## Configuration

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_CONTINUITE_API_URL` | URL de base des Edge Functions (repli : `NEXT_PUBLIC_SUPABASE_URL/functions/v1/`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publiable Stripe **réelle** (`pk_live_…`). Il n'existe pas de mode test pour ces prix. |
| `NEXT_PUBLIC_CARTE_ACTIVE` | `1` = affiche la rencontre à la carte (section et bouton). Absente : cachée. À poser quand `continuite-checkout-carte` est déployé. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clé de site Cloudflare Turnstile (repli : clé de test qui passe toujours) |


## Tests en réel (Stripe live, carte de Hugues, remboursement)

### Avant de commencer

- **La page merci doit être en ligne.** La `return_url` de Stripe pointe vers `https://neoperformance.ca/continuite/merci`. Si les tests se font sur un aperçu Netlify, la page merci de production doit déjà exister, sinon la cliente tombe sur une 404 après le paiement. L'URL de l'aperçu doit aussi être ajoutée à `CONTINUITE_CORS_ORIGINS` côté app.
- **Un courriel différent par achat**, par exemple `hugues+cont1@neoperformance.ca`, `hugues+cont2@…`. La limite est de 3 sessions par courriel sur 15 minutes, et chaque courriel crée ou relie un dossier distinct dans l'app.
- **Palier le moins cher** (NEO Continuité) pour les tests de durée : un achat avec engagement ne prélève qu'un mois à la fois.
- **Coût :** Stripe ne rend pas ses frais de traitement sur un remboursement (environ 2,9 % + 0,30 $ par achat). Les taxes sont remboursées avec le reste.

### Après chaque achat (obligatoire)

1. **Rembourser** le paiement dans Stripe (Paiements, puis Rembourser).
2. **Annuler l'abonnement immédiatement** dans Stripe (Abonnements, Annuler, « immédiatement »). Un remboursement n'annule pas l'abonnement : sans cette étape, le mois suivant serait prélevé.
3. **Nettoyer côté app NEO :** le webhook aura créé ou relié un dossier, une inscription et le crédit suppléments. Noter le courriel de test pour que l'app les retire ou les marque comme tests.

### Scénarios

| # | Scénario | Comment | Résultat attendu |
| --- | --- | --- | --- |
| B1 | Les 9 prix | Ouvrir `/continuite` | Montants identiques à ceux des prix Stripe, pour les 3 paliers × 3 durées. Aucune carte vide |
| B2 | Achat public, mensuel | Remplir le formulaire, payer avec ta carte | Checkout intégré, taxes calculées selon l'adresse, retour sur `/continuite/merci?session_id=cs_live_…` avec forfait et date du jour. Dans Stripe : métadonnées `palier`, `duree=mensuel`, `source=public`, `engagement_fin` vide |
| B3 | Achat public, 6 mois | Idem | `duree=6_mois`, `engagement_fin` = date du jour + 6 mois |
| B4 | Achat public, 12 mois | Idem | `duree=12_mois`, `engagement_fin` = date du jour + 12 mois |
| B5 | UTM | Ouvrir avec `?utm_source=test&utm_medium=test&utm_campaign=continuite-test`, acheter | Les UTM figurent dans les métadonnées de l'abonnement |
| B6 | Carte refusée | Bloquer temporairement ta carte dans l'app de ta banque, puis payer (ou entrer un mauvais CVC) | Stripe affiche le refus dans son cadre, aucune redirection, aucun abonnement créé. Débloquer la carte ensuite |
| B7 | Lien naturo avec cliente | Depuis l'app, « Vendre NEO Continuité » sur un dossier test, ouvrir le lien sur tablette, acheter | Un seul forfait affiché, tout tient dans l'écran de la tablette. Prénom de la cliente et de la naturo affichés dès l'ouverture, coordonnées non modifiables. Dans Stripe : `source=naturo`, `vendu_par` = la naturo |
| B8 | Lien naturo générique | Lien sans cliente, saisir des coordonnées de test | Prénom, nom et courriel demandés. Achat relié ou créé par courriel |
| B9 | Lien naturo expiré | Ouvrir un lien de plus de 7 jours, ou un lien déjà utilisé pour un achat | « Lien expiré, rouvre-le depuis l'app NEO » dès l'ouverture |
| B9b | Lien copié pour la cliente | « Copier le lien pour la cliente » sur Extra, 12 mois, puis ouvrir le lien copié | Message « Lien copié. Il est valide 7 jours, pour un seul achat. ». Le lien ouvre Extra, 12 mois, mis en avant. Avec palier ou duree invalide : comportement normal |
| B10 | Lien naturo modifié | Changer un caractère du jeton `t` | Même message, dès l'ouverture |
| B11 | Cliente en programme | Lien naturo sur un dossier test en programme avant la semaine 15 | Dès l'ouverture : « Tu gardes ton accès dès aujourd'hui. Premier paiement le [date] ». Carte validée sans prélèvement. La page merci annonce la date de la semaine 15 et précise qu'aucun montant n'est prélevé avant. **Annuler l'abonnement** ensuite (aucun remboursement à faire) |
| B12 | Trop de tentatives | Ouvrir le Checkout 4 fois de suite avec le même courriel, sans payer | 4e fois : message « trop de tentatives » de l'endpoint |
| B13 | Turnstile | Clé de production sur le domaine | Le widget passe sans friction pour une vraie visiteuse |
| B14 | Merci | Recharger la page merci. Puis un `session_id` bidon | Même confirmation. Puis « Confirmation introuvable » |
| B15 | Paiement abandonné | Ouvrir le Checkout, ne pas payer, ouvrir `/continuite/merci?session_id=<cs de cette session>` | « Ton paiement n'est pas terminé » |
| B16 | Mobile | iPhone et Android | Aucun défilement horizontal, Checkout utilisable, Apple Pay ou Google Pay proposés si activés dans Stripe |
| B17 | Indexation | Code source des 3 pages, `/sitemap.xml`, menu | `noindex, nofollow` partout, aucune page dans le sitemap ni dans le menu |

## Prérequis côté app NEO

- **CORS : `https://www.neoperformance.ca` est obligatoire.** `neoperformance.ca` redirige (301) vers `www`, donc les pages tournent toujours sur `www` : sans cette origine, tous les appels échouent. Ajouter aussi `https://neoperformance.ca` et l'URL d'aperçu Netlify, avec l'en-tête `content-type`. Le site n'envoie aucun en-tête d'authentification.
- Mode aperçu de `continuite-checkout-naturo` (`{ jeton, apercu: true }`) : le site l'appelle à l'ouverture de `/continuite/naturo` et affiche « Lien expiré » sur `jeton_invalide` ou `jeton_expire`.
- **Champ à ajouter dans la réponse de l'aperçu : `date_premier_paiement`** (`YYYY-MM-DD`, début de la semaine 15 si la cliente est en programme avant la semaine 15, sinon `null`). Le site affiche la phrase « Premier paiement le… » seulement si ce champ est présent.
- `continuite-session` : `ouverte` et `expiree` sont traités comme non payés, toute autre valeur comme confirmée.
