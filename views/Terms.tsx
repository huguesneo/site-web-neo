'use client';
import React from 'react';
import Section from '../components/Section';
import { Scale } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <>
      {/* HEADER SECTION */}
      <div className="bg-gray-900 text-white pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neo/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neo/15 text-neo mb-6">
            <Scale size={30} />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Conditions d'utilisation</h1>
          <p className="text-sm text-gray-400">NEO Performance</p>
        </div>
      </div>

      <Section className="bg-white relative z-10 -mt-10 pt-0 pb-20" noAnimation>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-10 lg:p-14">
            <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-gray-900 prose-a:text-neo prose-a:no-underline hover:prose-a:underline">

              <h2>1. Programme de messagerie texte (SMS)</h2>
              <p>Dans le cadre de notre programme SMS, vous pouvez recevoir les types de messages suivants :</p>
              <ul>
                <li>Confirmation de rendez-vous</li>
                <li>Rappel avant la rencontre</li>
                <li>Mises à jour en cas de report ou d'annulation</li>
                <li>Messages de service à la clientèle relatifs à la rencontre</li>
              </ul>

              <h2>2. Annulation de l'abonnement (Opt-out)</h2>
              <p>Vous pouvez annuler le service SMS à tout moment. Pour ce faire, répondez simplement « STOP » au même numéro qui vous a envoyé le message. Une fois ce mot-clé envoyé :</p>
              <ul>
                <li>Vous recevrez un message confirmant votre désabonnement.</li>
                <li>Vous ne recevrez plus de messages SMS de notre part, sauf si vous vous réinscrivez.</li>
                <li>Pour vous réinscrire, suivez à nouveau le même processus d'inscription que lors de votre première réservation.</li>
              </ul>

              <h2>3. Assistance technique</h2>
              <p>Si vous rencontrez des problèmes avec le programme SMS :</p>
              <ul>
                <li>Répondez avec le mot-clé « AIDE » pour obtenir de l'assistance.</li>
                <li>Vous pouvez également communiquer avec nous : <a href="mailto:info@neoperformance.ca">info@neoperformance.ca</a> · <a href="tel:4388061515">(438) 806-1515</a></li>
              </ul>
              <p>Notre équipe de soutien est disponible durant les heures normales d'ouverture.</p>

              <h2>4. Responsabilité des transporteurs</h2>
              <p>Les opérateurs mobiles ne sont pas responsables des retards ou des messages non délivrés.</p>

              <h2>5. Tarification et fréquence</h2>
              <p>Des frais standards de messagerie et de données peuvent s'appliquer, selon votre fournisseur mobile. La fréquence des messages varie en fonction de vos interactions, de vos rendez-vous et de vos suivis. Pour toute question concernant votre plan de données ou de messagerie, veuillez contacter votre fournisseur de téléphonie mobile.</p>

              <h2>6. Opérateurs pris en charge</h2>
              <p>Notre programme SMS fonctionne avec la majorité des opérateurs canadiens et américains, incluant : Bell, Rogers, Telus, AT&amp;T, Verizon, T-Mobile, Sprint et la plupart des opérateurs régionaux.</p>

              <h2>7. Restriction d'âge</h2>
              <p>Vous devez avoir 18 ans ou plus pour participer à notre programme SMS.</p>

              <h2>8. Politique de confidentialité</h2>
              <p>Pour toute question relative à la confidentialité ou à l'utilisation de vos données, veuillez consulter notre <a href="/politique-de-confidentialite">Politique de confidentialité</a>.</p>
              <p>NEO Performance se conforme à toutes les lois applicables, incluant la Loi canadienne anti-pourriel (LCAP), le Telephone Consumer Protection Act (TCPA) et les directives de la CTIA concernant l'utilisation des communications SMS.</p>

              <hr className="my-12 border-gray-200" />

              <h2>⚖️ Conditions générales d'utilisation du site</h2>
              <p>Ce site web (le « Site ») est la propriété de NEO Performance (« l'Entreprise », « nous », « notre » ou « nos »). En utilisant ce site, vous acceptez d'être lié par les présentes Conditions d'utilisation, ainsi que par notre Politique de confidentialité et toute autre condition spécifique liée à certaines sections ou services du site.</p>
              <p>L'accès au site, de quelque manière que ce soit (automatisée ou non), constitue une acceptation de ces conditions. Nous nous réservons le droit de modifier ces conditions ou d'imposer de nouvelles règles à tout moment. Toute modification sera publiée sur ce site. En continuant à l'utiliser après la publication, vous acceptez les nouvelles conditions.</p>

              <h3>1. Droits de propriété intellectuelle</h3>
              <p><strong>Licence limitée</strong></p>
              <p>Ce site et tout son contenu (textes, images, logos, vidéos, formations, etc.) sont la propriété de NEO Performance et/ou de ses partenaires. Ils sont protégés par les lois sur le droit d'auteur et la propriété intellectuelle. Le site est fourni à des fins personnelles et non commerciales.</p>
              <p>Vous ne pouvez pas modifier, copier, reproduire, republier, télécharger, distribuer ou exploiter tout contenu sans autorisation écrite préalable. Cependant, vous pouvez imprimer une copie à usage personnel, à condition de conserver toutes les mentions de droit d'auteur.</p>
              <p><strong>Licence accordée à NEO Performance</strong></p>
              <p>En nous soumettant du contenu (commentaires, témoignages, photos, etc.) via le site ou les réseaux sociaux, vous déclarez en détenir les droits et accordez à NEO Performance une licence non exclusive, mondiale, irrévocable et gratuite pour utiliser, reproduire, publier ou distribuer ce contenu à des fins promotionnelles ou informatives.</p>

              <h3>2. Avertissement et responsabilité</h3>
              <p>Le site peut contenir des liens vers d'autres sites gérés par des tiers. Ces liens sont fournis à titre informatif et ne constituent pas une approbation de leur contenu. NEO Performance n'est pas responsable de l'exactitude, de la qualité ou de la fiabilité des produits, services ou informations fournis par ces sites tiers.</p>
              <p>Tous les services et informations du site sont fournis « tels quels », sans garantie d'aucune sorte. Vous acceptez d'indemniser NEO Performance et ses employés pour toute réclamation ou perte découlant de votre utilisation du site.</p>

              <h3>3. Transactions en ligne</h3>
              <p>Certaines sections du site peuvent permettre d'acheter des produits ou services. NEO Performance n'est pas responsable des produits ou services vendus par des tiers reliés au site. Toute transaction avec un fournisseur tiers relève uniquement de votre responsabilité.</p>

              <h3>4. Inscription et mots de passe</h3>
              <p>Certaines fonctionnalités peuvent nécessiter la création d'un compte. Vous vous engagez à fournir des informations exactes et à maintenir la confidentialité de vos identifiants. Toute activité effectuée via votre compte relève de votre responsabilité.</p>
              <p>En cas d'utilisation non autorisée, veuillez nous contacter à <a href="mailto:info@neoperformance.ca">info@neoperformance.ca</a>. NEO Performance ne peut être tenue responsable de toute perte liée à l'utilisation non autorisée de votre compte.</p>

              <h3>5. Résiliation</h3>
              <p>Nous nous réservons le droit de suspendre ou de résilier votre accès au site, sans préavis, si nous jugeons que vous avez enfreint les présentes conditions ou utilisé le site de manière inappropriée.</p>

              <h3>6. Droit applicable</h3>
              <p>Les présentes conditions sont régies par les lois du Québec (Canada). Tout litige sera soumis à la juridiction exclusive des tribunaux de cette province.</p>

              <h3>7. Modifications</h3>
              <p>Nous pouvons mettre à jour ces conditions à tout moment. La version la plus récente sera toujours publiée sur notre site, accompagnée de la date d'entrée en vigueur.</p>

              <h3>8. Nous contacter</h3>
              <p>Pour toute question concernant ces conditions d'utilisation :</p>
              <p>
                <strong>NEO Performance</strong><br />
                📞 Téléphone : <a href="tel:4388061515">(438) 806-1515</a><br />
                📧 Courriel : <a href="mailto:info@neoperformance.ca">info@neoperformance.ca</a><br />
                🌐 Site : <a href="https://www.neoperformance.ca">www.neoperformance.ca</a><br />
                📍 Adresse : 7005 boul Taschereau, suite 350, Brossard, J4Z 1A7
              </p>
              <p>En utilisant notre site et nos services, vous acceptez ces Conditions d'utilisation.</p>

            </div>
          </div>
        </div>
      </Section>
    </>
  );
};

export default Terms;
