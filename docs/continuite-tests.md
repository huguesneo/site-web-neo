# NEO Continuité : liste de tests

Pages : `/continuite`, `/continuite/naturo`, `/continuite/merci`.
Contrat d'API : `docs/continuite-api.md` du dépôt de l'app NEO.

## Configuration

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_CONTINUITE_API_URL` | URL de base des Edge Functions (repli : `NEXT_PUBLIC_SUPABASE_URL/functions/v1/`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publiable Stripe **réelle** (`pk_live_…`). Il n'existe pas de mode test pour ces prix. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clé de site Cloudflare Turnstile (repli : clé de test qui passe toujours) |
| `NEXT_PUBLIC_CONTINUITE_MOCK` | `1` = réponses simulées. **Ne jamais définir sur Netlify.** |

Pour retirer les mocks une fois les endpoints déployés : supprimer `lib/continuite/mock.ts`, son import et la constante `MOCK` dans `lib/continuite/api.ts`, puis le composant `PaiementSimule` dans `components/continuite/CheckoutIntegre.tsx`.

## A. En mode simulé (`NEXT_PUBLIC_CONTINUITE_MOCK=1`, local seulement)

| # | Scénario | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| A1 | Offre | Ouvrir `/continuite` | Bandeau « Mode démo », 3 paliers, Continuité+ étiqueté « Recommandé », 6 mois coché par défaut, prix « par mois, + taxes » |
| A2 | Durées | Cliquer Mensuel, 6 mois, 12 mois | Les prix changent. Sous chaque prix : « Engagement de X mois, puis… » ou « Sans engagement. ». En 6 et 12 mois : « Tu économises X $ sur 6 (ou 12) mois » |
| A3 | Validation | Cliquer « Passer au paiement » sans rien remplir | Message sous chaque champ, focus sur Prénom, case de consentement en erreur |
| A4 | Trop de tentatives | Courriel `x+limite@exemple.test` | « Trop de tentatives… », Turnstile se recharge |
| A5 | Captcha | Courriel `x+captcha@exemple.test` | Message de vérification anti-robot |
| A6 | Erreur serveur | Courriel `x+serveur@exemple.test` | Message d'erreur serveur |
| A7 | Achat public | Courriel normal, chaque durée | Panneau « Paiement simulé » avec le bon palier et la bonne durée, puis la page merci |
| A8 | Naturo avec cliente | `/continuite/naturo?t=abc&utm_source=app_neo&utm_medium=naturo&utm_campaign=continuite&utm_content=julie` | Sans menu ni chatbot. Continuité+ et 6 mois par défaut, un seul forfait affiché, en grand. Prix mensuel barré à gauche, « Engagement de 6 mois, puis… », « Tu économises 60 $ sur 6 mois ». « Premier paiement le 16 novembre 2026 » |
| A8b | Changement de forfait | « Changer de forfait » en haut à droite, choisir Extra, puis 12 mois, puis Mensuel | Le menu ne s'ouvre qu'au clic et se ferme au choix (ou Échap, ou clic ailleurs). Le prix s'anime, l'économie est calculée sur la durée de l'engagement. En mensuel : pas de prix barré, pas de badge, « Sans engagement. » |
| A8c | Coordonnées verrouillées | « Forfait choisi » | Prénom, nom et courriel masqué non modifiables, conditions, consentement, puis paiement simulé. « Modifier » ramène au forfait |
| A8d | Hors programme | `?t=hors-programme` | Aucune phrase de premier paiement |
| A9 | Naturo générique | `?t=generique` | Prénom, nom et courriel obligatoires, téléphone facultatif |
| A10 | Naturo sans jeton | `/continuite/naturo` | « Lien expiré, rouvre-le depuis l'app NEO » tout de suite |
| A11 | Naturo expiré ou invalide | `?t=expire`, puis `?t=invalide` | « Lien expiré… » tout de suite, avant tout choix de forfait |
| A12 | Merci | `/continuite/merci?session_id=mock_session__continuite_extra__6_mois` | « Continuité Extra · Engagement 6 mois », date du premier paiement |
| A13 | Merci non terminé | `?session_id=mock_ouverte` | « Ton paiement n'est pas terminé » + bouton vers les forfaits |
| A14 | Merci invalide | `?session_id=mock_inconnu`, puis sans paramètre | « Confirmation introuvable » |

## B. En réel (Stripe live, carte de Hugues, remboursement)

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
| B9 | Lien naturo expiré | Ouvrir un lien de plus de 2 heures | « Lien expiré, rouvre-le depuis l'app NEO » dès l'ouverture |
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
