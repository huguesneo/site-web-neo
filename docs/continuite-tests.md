# NEO Continuité : liste de tests

Pages : `/continuite`, `/continuite/naturo`, `/continuite/merci`.

## Configuration

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_CONTINUITE_API_URL` | URL de base des Edge Functions (repli : `NEXT_PUBLIC_SUPABASE_URL/functions/v1/`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publiable Stripe (`pk_test_…` pour les tests, `pk_live_…` en production) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clé de site Cloudflare Turnstile (repli : clé de test qui passe toujours) |
| `NEXT_PUBLIC_CONTINUITE_MOCK` | `1` = réponses simulées. **Ne jamais définir sur Netlify.** |

Pour retirer les mocks une fois les endpoints déployés : supprimer `lib/continuite/mock.ts`, son import et la constante `MOCK` dans `lib/continuite/api.ts`, puis le composant `PaiementSimule` dans `components/continuite/CheckoutIntegre.tsx`.

## A. En mode simulé (`NEXT_PUBLIC_CONTINUITE_MOCK=1`)

| # | Scénario | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| A1 | Offre | Ouvrir `/continuite` | Bandeau « Mode démo », 3 paliers, Continuité+ étiqueté « Recommandé », prix « par mois, + taxes » |
| A2 | Durées | Cliquer Mensuel, 6 mois, 12 mois | Les prix changent. En 6 et 12 mois, l'économie par mois et totale s'affiche |
| A3 | Validation | Cliquer « Passer au paiement » sans rien remplir | Message sous chaque champ, focus sur Prénom, case de consentement en erreur |
| A4 | Trop de tentatives | Courriel `x+limite@exemple.test` | « Trop de tentatives… », Turnstile se recharge |
| A5 | Captcha | Courriel `x+captcha@exemple.test` | Message de vérification de sécurité |
| A6 | Erreur serveur | Courriel `x+serveur@exemple.test` | Message d'erreur serveur |
| A7 | Achat public | Courriel normal, chaque durée | Panneau « Paiement simulé » avec le bon palier et la bonne durée, puis la page merci |
| A8 | Naturo valide | `/continuite/naturo?t=abc&utm_source=app_neo&utm_medium=naturo&utm_campaign=continuite&utm_content=Julie` | Sans menu ni chatbot, titre « Julie, choisis ton forfait », prénom prérempli |
| A9 | Naturo sans jeton | `/continuite/naturo` | « Lien expiré, rouvre-le depuis l'app NEO » |
| A10 | Naturo expiré | `?t=expire` (ou `?t=invalide`), choisir un forfait, payer | Bascule sur « Lien expiré… » |
| A11 | Merci | `/continuite/merci?session_id=mock_session__continuite_extra__6_mois` | « Continuité Extra · Engagement 6 mois », date du premier paiement |
| A12 | Merci non terminé | `?session_id=mock_ouverte` | « Ton paiement n'est pas terminé » + bouton vers les forfaits |
| A13 | Merci invalide | `?session_id=mock_inconnu`, puis sans paramètre | « Confirmation introuvable » |

## B. Avec les vrais endpoints (Stripe en mode test, mock retiré)

Cartes de test Stripe : `4242 4242 4242 4242` (succès), `4000 0000 0000 0002` (refusée), `4000 0000 0000 9995` (fonds insuffisants), `4000 0025 0000 3155` (3D Secure). Date future, CVC au choix.

| # | Scénario | Résultat attendu |
| --- | --- | --- |
| B1 | Les 9 prix | `/continuite` affiche les montants de `continuite-offre` pour les 3 paliers × 3 durées |
| B2 | Achat public, mensuel | Checkout intégré affiché, paiement 4242 → `/continuite/merci?session_id=cs_test_…`, forfait et date corrects. Dans Stripe : abonnement créé avec le bon `price_id` |
| B3 | Achat public, 6 mois | Idem B2, vérifier l'engagement côté app NEO |
| B4 | Achat public, 12 mois | Idem B2 |
| B5 | UTM | Ouvrir avec `?utm_source=…&utm_campaign=…`, acheter : les UTM sont enregistrés côté app NEO |
| B6 | Carte refusée | Carte `…0002` : Stripe affiche le refus dans son cadre, aucune redirection, la cliente peut réessayer |
| B7 | 3D Secure | Carte `…3155` : fenêtre d'authentification, puis succès |
| B8 | Captcha réel | Clé Turnstile de production sur le domaine : le widget passe, l'endpoint valide le jeton |
| B9 | Trop de tentatives | Soumissions répétées rapides : message `trop_de_tentatives` de l'endpoint |
| B10 | Lien naturo valide | Généré depuis l'app NEO : achat complet, la vente est attribuée à la naturopathe |
| B11 | Lien naturo expiré | Lien périmé ou déjà utilisé : « Lien expiré, rouvre-le depuis l'app NEO » |
| B12 | Cliente en programme | Premier paiement à la semaine 15 : la page merci annonce la date future et précise qu'aucun montant n'est prélevé avant |
| B13 | Merci | Recharger la page merci : même confirmation. `session_id` bidon : « Confirmation introuvable » |
| B14 | Mobile | iPhone et Android : aucun défilement horizontal, Checkout utilisable |
| B15 | Indexation | Les 3 pages ont `noindex, nofollow`. Aucune n'apparaît dans `/sitemap.xml` ni dans le menu |

## Prérequis côté app NEO (à confirmer avec l'autre session)

- CORS : autoriser `https://neoperformance.ca`, `https://www.neoperformance.ca` et `http://localhost:3000`, avec les en-têtes `content-type, apikey, authorization`. Le site envoie la clé anon dans `apikey` et `Authorization`.
- `return_url` : `https://neoperformance.ca/continuite/merci?session_id={CHECKOUT_SESSION_ID}`. Pour tester en local ou sur un aperçu Netlify, il faudra une `return_url` adaptée à l'environnement.
- `continuite-session` : le site traite `statut` `open` ou `expired` comme non payé, et toute autre valeur comme confirmée.
