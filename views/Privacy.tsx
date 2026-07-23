'use client';
import React from 'react';
import Section from '../components/Section';
import { ShieldCheck } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <>
      {/* HEADER SECTION */}
      <div className="bg-gray-900 text-white pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neo/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neo/15 text-neo mb-6">
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Politique de confidentialité</h1>
          <p className="text-sm text-gray-400">Dernière mise à jour : 23 juillet 2026</p>
        </div>
      </div>

      <Section className="bg-white relative z-10 -mt-10 pt-0 pb-20" noAnimation>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-10 lg:p-14">
            <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-gray-900 prose-a:text-neo prose-a:no-underline hover:prose-a:underline">

              <div className="not-prose bg-neo/5 border border-neo/20 rounded-2xl p-5 sm:p-6 mb-10">
                <p className="text-xs font-bold text-neo uppercase tracking-wider mb-2">Avis important concernant les données de messagerie texte</p>
                <p className="text-gray-700 leading-relaxed text-sm">
                  NEO Performance (« nous », « notre » ou « nos ») ne partage en aucun cas les informations d'inscription
                  des clients, y compris les numéros de téléphone et les consentements associés, avec des filiales ou des
                  tiers à des fins de marketing, promotionnelles ou autres usages non liés à la prestation directe de nos
                  services. Toutes les données d'adhésion à la messagerie texte (opt-in) sont conservées de façon
                  strictement confidentielle.
                </p>
              </div>

              <p>
                La présente Politique de confidentialité s'applique au site web <a href="https://www.neoperformance.ca">www.neoperformance.ca</a> ainsi
                qu'à l'application mobile <strong>NEO Performance</strong> (iOS et Android). Elle décrit les renseignements
                que nous recueillons, la façon dont nous les utilisons, la durée pendant laquelle nous les conservons
                et les droits dont vous disposez.
              </p>

              <h2>1. Informations que nous recueillons</h2>

              <h3>Renseignements personnels</h3>
              <ul>
                <li>Nom, adresse courriel, numéro de téléphone, adresse postale</li>
                <li>Informations de paiement lors d'un achat ou d'une demande de devis</li>
                <li>Horodatages et consentements associés à vos inscriptions (SMS, courriel, etc.)</li>
              </ul>

              <h3>Renseignements non personnels</h3>
              <ul>
                <li>Adresse IP, type de navigateur, informations sur l'appareil</li>
                <li>Données d'utilisation du site et statistiques anonymes</li>
                <li>Témoins (cookies) et technologies similaires</li>
              </ul>

              <h3>Communications avec le client</h3>
              <ul>
                <li>Historique des demandes d'informations ou de rendez-vous</li>
                <li>Détails de rendez-vous et préférences</li>
                <li>Commentaires ou retours sur les services reçus</li>
              </ul>

              <h3>Données recueillies via l'application mobile</h3>
              <p>Lorsque vous utilisez l'application mobile NEO Performance, nous recueillons également, avec votre consentement :</p>
              <ul>
                <li>Vos informations de compte (identifiants de connexion, profil client)</li>
                <li>Vos réponses aux questionnaires et évaluations de santé et d'habitudes de vie</li>
                <li>Vos données de santé et d'activité physique (p. ex. poids, mesures, pas, fréquence cardiaque) que vous choisissez de synchroniser depuis Apple Santé ou d'entrer manuellement</li>
                <li>Vos photos de progression, si vous choisissez d'en téléverser</li>
                <li>Vos messages échangés dans la messagerie de l'application, incluant les conversations avec l'assistant Léo</li>
                <li>Vos plans alimentaires, plans d'entraînement et données de suivi de progression</li>
              </ul>
              <p>Les données de santé ne sont jamais utilisées à des fins publicitaires ni vendues à des tiers.</p>

              <h2>2. Utilisation de vos informations</h2>
              <p>Nous utilisons ces données afin de :</p>
              <ul>
                <li>Fournir, planifier et améliorer nos services</li>
                <li>Gérer les paiements et transactions</li>
                <li>Communiquer avec vous au sujet de vos rendez-vous, confirmations et suivis</li>
                <li>Garantir la sécurité et prévenir les fraudes</li>
                <li>Maintenir vos préférences de communication et vos consentements à jour</li>
              </ul>

              <h2>3. Messagerie texte (SMS) et conformité</h2>

              <h3>Conditions d'utilisation des SMS</h3>
              <p>En choisissant de recevoir nos messages texte, vous acceptez de recevoir des SMS liés à nos services, incluant :</p>
              <ul>
                <li>les rappels et confirmations de rencontre découverte,</li>
                <li>le suivi de rendez-vous,</li>
                <li>les messages de service à la clientèle.</li>
              </ul>

              <h3>Inscription et consentement</h3>
              <ul>
                <li>Vous recevrez des messages uniquement si vous avez donné un consentement explicite.</li>
                <li>Nous conservons la preuve (date/heure) de toutes les inscriptions.</li>
                <li>Nous respectons la Loi canadienne anti-pourriel (LCAP), le TCPA et les lois applicables.</li>
              </ul>

              <h3>Désinscription</h3>
              <ul>
                <li>Vous pouvez vous désabonner à tout moment en répondant « STOP ».</li>
                <li>Vous recevrez alors un dernier message confirmant la désinscription.</li>
                <li>Aucun message ne sera envoyé par la suite, sauf si vous vous réinscrivez.</li>
                <li>Toutes les demandes de désinscription sont traitées dans un délai de 24 heures.</li>
              </ul>

              <h3>Fréquence et contenu des messages</h3>
              <ul>
                <li>La fréquence des messages varie selon vos interactions.</li>
                <li>Les messages concernent exclusivement les services ou rendez-vous demandés.</li>
                <li>Aucune promotion ne sera envoyée sans votre consentement explicite.</li>
              </ul>

              <h3>Aide et support</h3>
              <ul>
                <li>Répondez « AIDE » pour obtenir de l'assistance ou contactez-nous à : <a href="mailto:info@neoperformance.ca">info@neoperformance.ca</a></li>
                <li>Notre service client est disponible durant les heures normales d'ouverture.</li>
              </ul>

              <h3>Information sur les transporteurs</h3>
              <ul>
                <li>Des frais standards de messagerie et de données peuvent s'appliquer.</li>
                <li>Les opérateurs ne sont pas responsables des retards ou pertes de messages.</li>
                <li>Les principaux opérateurs pris en charge incluent Bell, Rogers, Telus, AT&amp;T, Verizon, T-Mobile et la plupart des fournisseurs régionaux.</li>
              </ul>

              <h3>Protection des données SMS</h3>
              <ul>
                <li>Les informations mobiles ne seront jamais partagées avec des tiers à des fins de marketing ou de promotion.</li>
                <li>Le partage d'informations avec des sous-traitants (ex. service client, plateforme d'envoi) est permis uniquement dans le cadre du service.</li>
                <li>Toutes les autres catégories d'utilisation excluent les données d'inscription et de consentement à la messagerie texte.</li>
              </ul>
              <p>Nous appliquons des mesures strictes de sécurité pour protéger ces données.</p>

              <h2>4. Partage et divulgation des informations</h2>
              <p>Nous ne vendons, ne louons ni n'échangeons vos informations personnelles. Nous pouvons partager certaines données avec :</p>

              <h3>Fournisseurs de services</h3>
              <ul>
                <li>Partenaires techniques (paiement, réservation, hébergement, messagerie).</li>
                <li>Agrégateurs ou fournisseurs SMS uniquement pour livrer les messages auxquels vous avez consenti.</li>
                <li>Tous ces fournisseurs sont tenus par contrat de préserver la confidentialité et la sécurité des données.</li>
              </ul>

              <h3>Conformité légale</h3>
              <p>Nous pourrions divulguer des informations si requis par la loi, une procédure judiciaire ou pour protéger nos droits.</p>

              <h3>Transferts d'entreprise</h3>
              <p>En cas de fusion, acquisition ou vente d'actifs, vos données demeureront protégées selon la présente politique.</p>
              <p>Toutes ces situations excluent les données d'inscription et de consentement SMS.</p>

              <h2>5. Sécurité des données</h2>
              <p>Nous mettons en œuvre des mesures de sécurité raisonnables, incluant :</p>
              <ul>
                <li>Chiffrement des données sensibles (en transit et au repos)</li>
                <li>Contrôles d'accès et authentification sécurisée</li>
                <li>Audits et mises à jour régulières</li>
                <li>Formation du personnel à la protection des données</li>
                <li>Protocoles de notification en cas d'incident</li>
                <li>Systèmes de sauvegarde sécurisés et plan de reprise</li>
              </ul>
              <p>Aucune méthode électronique n'étant infaillible, nous nous efforçons d'utiliser les meilleures pratiques commerciales pour protéger vos données.</p>

              <h2>6. Conservation des données</h2>
              <p>
                Nous conservons vos renseignements personnels uniquement le temps nécessaire aux fins pour lesquelles
                ils ont été recueillis, ou tel que requis par la loi. Voici nos durées de conservation :
              </p>
              <ul>
                <li><strong>Données de compte et dossier client</strong> (nom, coordonnées, questionnaires, évaluations, plans alimentaires et d'entraînement) : conservées pendant toute la durée de votre relation avec NEO Performance, puis supprimées ou anonymisées au plus tard 3 ans après la fin de celle-ci, sauf obligation légale contraire.</li>
                <li><strong>Données de santé et d'activité physique</strong> (mesures synchronisées depuis Apple Santé, suivi de progression, photos) : conservées tant que votre compte est actif ; supprimées lors de la fermeture de votre compte ou sur demande.</li>
                <li><strong>Messages et conversations</strong> (messagerie de l'application, incluant l'assistant Léo) : conservés tant que votre compte est actif, puis supprimés avec celui-ci.</li>
                <li><strong>Données d'inscription et de consentement SMS</strong> (numéro de téléphone, horodatages de consentement) : conservées tant que votre consentement est actif, puis le temps requis pour démontrer la conformité aux lois applicables.</li>
                <li><strong>Données de facturation et transactions</strong> : conservées 7 ans conformément aux exigences fiscales et comptables applicables au Québec et au Canada.</li>
                <li><strong>Données de navigation et témoins (cookies)</strong> : conservés pour une durée maximale de 24 mois.</li>
              </ul>
              <p>
                Vous pouvez demander la suppression de vos données en tout temps (voir la section
                « Vos droits et choix » ci-dessous). Lorsque la suppression complète n'est pas possible en raison
                d'une obligation légale, vos données sont isolées et protégées jusqu'à leur suppression définitive.
              </p>

              <h2>7. Témoins et technologies de suivi</h2>
              <p>Nous utilisons des cookies pour :</p>
              <ul>
                <li>Analyser le trafic et le comportement des utilisateurs</li>
                <li>Mémoriser vos préférences</li>
                <li>Améliorer la performance du site</li>
                <li>Évaluer l'efficacité de nos services</li>
              </ul>
              <p>Vous pouvez désactiver les cookies via votre navigateur, mais cela peut limiter certaines fonctionnalités du site.</p>

              <h2>8. Vos droits et choix</h2>
              <p>Vous avez le droit de :</p>
              <ul>
                <li>Accéder, modifier ou supprimer vos renseignements personnels</li>
                <li>Demander la suppression de votre compte et des données associées dans l'application mobile</li>
                <li>Vous désabonner de nos courriels (lien « Se désinscrire »)</li>
                <li>Vous désabonner des SMS (réponse « STOP »)</li>
                <li>Demander des détails sur la façon dont vos données sont traitées</li>
                <li>Retirer votre consentement à tout moment, incluant l'accès aux données de santé (via les réglages de votre appareil)</li>
              </ul>
              <p>
                Pour exercer ces droits, écrivez-nous à <a href="mailto:info@neoperformance.ca">info@neoperformance.ca</a>.
                Nous traitons les demandes de suppression dans un délai maximal de 30 jours, sous réserve des données
                que la loi nous oblige à conserver.
              </p>

              <h2>9. Liens vers des sites tiers</h2>
              <p>Notre site peut contenir des liens vers des sites externes. Nous ne sommes pas responsables de leurs pratiques de confidentialité. Cette politique s'applique uniquement aux données recueillies par NEO Performance.</p>

              <h2>10. Modifications de la politique</h2>
              <p>Nous pouvons mettre à jour cette politique à tout moment. La version la plus récente sera publiée sur notre site avec la date d'entrée en vigueur. En cas de changement majeur, une notification sera envoyée par courriel ou publiée sur le site.</p>

              <h2>11. Nous contacter</h2>
              <p>Pour toute question concernant cette Politique de confidentialité :</p>
              <p>
                <strong>NEO Performance</strong><br />
                📞 Téléphone : <a href="tel:4388061515">(438) 806-1515</a><br />
                📧 Courriel : <a href="mailto:info@neoperformance.ca">info@neoperformance.ca</a><br />
                🌐 Site : <a href="https://www.neoperformance.ca">www.neoperformance.ca</a><br />
                📍 Adresse : 7005 boul Taschereau, suite 350, Brossard, J4Z 1A7
              </p>
              <p>En utilisant notre site, notre application mobile et nos services, vous consentez à la présente Politique de confidentialité.</p>

            </div>
          </div>
        </div>
      </Section>
    </>
  );
};

export default Privacy;
