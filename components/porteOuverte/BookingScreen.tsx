'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  CALENDRIERS_PORTE_OUVERTE,
  type Disponibilites,
  type Modalite,
} from '@/lib/porteOuverte';
import { normaliserTelephone, type Coordonnees } from './CaptureScreen';

/**
 * L'identifiant d'iframe attendu par form_embed.js pour redimensionner le
 * widget. Même forme que sur /bilanleo — identifiant de la location GHL suivi
 * d'un suffixe unique. Si le script est bloqué, la hauteur minimale garde le
 * calendrier utilisable.
 */
const CALENDRIERS: Record<Modalite, { base: string; iframeId: string }> = {
  clinique: {
    base: `https://api.leadconnectorhq.com/widget/booking/${CALENDRIERS_PORTE_OUVERTE.clinique}`,
    iframeId: 'JO6tHfBQVXGN96AuXP3o_1786100000001',
  },
  visio: {
    base: `https://api.leadconnectorhq.com/widget/booking/${CALENDRIERS_PORTE_OUVERTE.visio}`,
    iframeId: 'JO6tHfBQVXGN96AuXP3o_1786100000002',
  },
};

/** Pré-remplit le formulaire de réservation GHL avec les coordonnées déjà données. */
function urlCalendrier(modalite: Modalite, c: Coordonnees): string {
  const params = new URLSearchParams({
    first_name: c.prenom.trim(),
    email: c.courriel.trim(),
    phone: normaliserTelephone(c.telephone),
  });
  return `${CALENDRIERS[modalite].base}?${params.toString()}`;
}

/**
 * Destinations A et B — chaudes et tièdes.
 *
 * Un seul écran pour les deux : le contrôle des places passe par l'ouverture
 * des plages dans GHL, pas par deux calendriers séparés. Le statut ne pilote
 * que les séquences courriel et l'ordre des rappels, en aval dans Make.
 *
 * La modalité vient de la dernière question du questionnaire et ouvre
 * directement le bon calendrier. Il n'y a plus de boutons à re-cliquer ici :
 * la personne a déjà répondu, et deux gros boutons au-dessus du calendrier
 * donnaient l'impression qu'il restait une étape avant de choisir son heure.
 */
export default function BookingScreen({
  coordonnees,
  modalitePreferee,
  disponibilites,
  onRetour,
}: {
  coordonnees: Coordonnees;
  modalitePreferee: Modalite;
  disponibilites: Disponibilites;
  /** Ramène à la dernière question du questionnaire, réponses conservées. */
  onRetour: () => void;
}) {
  const offertes = (Object.keys(CALENDRIERS) as Modalite[]).filter((m) => disponibilites[m]);
  const [modalite, setModalite] = useState<Modalite>(
    disponibilites[modalitePreferee] ? modalitePreferee : offertes[0],
  );

  const preferenceComplete = !disponibilites[modalitePreferee];
  const autre: Modalite = modalite === 'clinique' ? 'visio' : 'clinique';
  const autreOfferte = disponibilites[autre];

  /*
   * form_embed.js n'observe que les iframes déjà dans le DOM quand il
   * s'exécute, et il ne s'exécute qu'une fois. Avec <Script> de Next, revenir
   * au questionnaire puis rouvrir le calendrier remontait des iframes que le
   * script ne voyait plus : elles restaient à leur hauteur minimale, tronquées,
   * avec une barre de défilement interne. On le réinjecte donc à chaque montage
   * de l'écran, comme sur /mon-dossier et /consultation. L'effet part sans
   * dépendances : il tourne après le premier rendu, donc après que les deux
   * iframes sont posées.
   */
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div>
      {/* Même flèche qu'au questionnaire, au même endroit : c'est le dernier
          écran où on peut encore corriger une réponse, et sans elle il faut
          recommencer le parcours au complet. */}
      <button
        type="button"
        onClick={onRetour}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-neo"
      >
        <ArrowLeft size={16} />
        Revenir aux questions
      </button>

      <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-snug text-center">
        Ta place du 11 septembre t’attend.
      </h1>
      <p className="mt-4 text-lg text-gray-600 text-center max-w-xl mx-auto">
        {modalite === 'clinique'
          ? 'Il te reste à choisir ton heure à la clinique de Brossard. La rencontre dure 60 minutes, analyse InBody comprise.'
          : 'Il te reste à choisir ton heure pour ta rencontre en visio. Elle dure 60 minutes, et ton sac-cadeau part par la poste.'}
      </p>

      {/* La modalité choisie au questionnaire est complète : on le dit avant le
          calendrier, sinon la personne croit s'être trompée d'écran. */}
      {preferenceComplete && offertes.length >= 1 && (
        <p className="mt-8 rounded-2xl bg-neo-50 px-5 py-4 text-center text-base text-neo-900">
          {modalite === 'clinique'
            ? 'Les places en visio sont toutes prises. Il en reste à la clinique de Brossard — avec l’analyse InBody en prime.'
            : 'Les places en clinique sont toutes prises. Il en reste en visio : même évaluation, même portrait métabolique, sac-cadeau posté.'}
        </p>
      )}

      {/* Le dépôt se prend dans le formulaire du calendrier GHL. Ce bloc est là
          pour qu'on ne le découvre pas au moment de payer : une demande d'argent
          non annoncée sur une page qui dit « gratuit » fait abandonner. */}
      <div className="mt-8 rounded-2xl border-2 border-neo-100 bg-neo-50/60 px-6 py-5">
        <p className="text-base text-neo-900 leading-relaxed">
          <strong className="font-bold">Un dépôt de 20 $ confirme ta place.</strong> On te le
          remet en argent le jour même, en arrivant. C’est juste notre façon de s’assurer que les
          40 places vont à des gens qui vont vraiment se présenter — on a 5 professionnels qui
          bloquent leur journée complète pour ça.
        </p>
      </div>

      <div className="mt-8">
        {/*
          Les deux calendriers restent montés et on bascule leur visibilité en
          CSS, comme sur /abonnement-leo. form_embed.js ne redimensionne que les
          iframes présentes à son chargement : une iframe remontée après coup
          (rendu conditionnel ou changement de `key`) garde sa hauteur minimale
          et se retrouve tronquée, avec une barre de défilement interne.

          La visibilité est portée par le div, jamais par l'iframe : le script
          GHL pose un `display` inline sur l'iframe, qui l'emporterait sur une
          classe Tailwind.
        */}
        {offertes.map((m) => (
          <div key={m} className={m === modalite ? 'block' : 'hidden'}>
            <iframe
              src={urlCalendrier(m, coordonnees)}
              id={CALENDRIERS[m].iframeId}
              title={
                m === 'clinique'
                  ? 'Calendrier de réservation à la clinique de Brossard'
                  : 'Calendrier de réservation en visio'
              }
              allow="payment"
              scrolling="no"
              className="w-full border-none block min-h-[750px]"
            />
          </div>
        ))}
      </div>

      {/* Repli discret, sous le calendrier : c'est souvent devant les heures
          qu'on réalise qu'on ne pourra pas se déplacer. Un lien, pas un bouton,
          pour que le calendrier reste l'action principale de l'écran. */}
      {autreOfferte && (
        <p className="mt-6 text-center text-sm text-gray-500">
          {modalite === 'clinique'
            ? 'Tu ne peux pas te déplacer à Brossard ? '
            : 'Tu préfères finalement venir à la clinique ? '}
          <button
            type="button"
            onClick={() => setModalite(autre)}
            className="font-semibold text-neo underline underline-offset-2 hover:text-neo-600"
          >
            {modalite === 'clinique'
              ? 'Voir les heures en visio'
              : 'Voir les heures à la clinique de Brossard'}
          </button>
        </p>
      )}
    </div>
  );
}
