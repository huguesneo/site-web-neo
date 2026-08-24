'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Building2, Video } from 'lucide-react';
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
 * La modalité choisie à la dernière question est pré-sélectionnée mais reste
 * modifiable : c'est devant le calendrier que la personne réalise qu'elle ne
 * peut pas se déplacer.
 */
export default function BookingScreen({
  coordonnees,
  modalitePreferee,
  disponibilites,
}: {
  coordonnees: Coordonnees;
  modalitePreferee: Modalite;
  disponibilites: Disponibilites;
}) {
  const offertes = (Object.keys(CALENDRIERS) as Modalite[]).filter((m) => disponibilites[m]);
  const [modalite, setModalite] = useState<Modalite>(
    disponibilites[modalitePreferee] ? modalitePreferee : offertes[0],
  );

  const preferenceComplete = !disponibilites[modalitePreferee];

  const bouton = (valeur: Modalite, titre: string, soustitre: string, Icone: typeof Building2) => {
    const choisi = modalite === valeur;
    return (
      <button
        type="button"
        onClick={() => setModalite(valeur)}
        aria-pressed={choisi}
        className={`flex-1 flex flex-col items-center text-center rounded-2xl border-2 px-6 py-7 transition-all duration-200 ${
          choisi
            ? 'border-neo bg-neo-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-neo-300 hover:-translate-y-0.5 hover:shadow-md'
        }`}
      >
        <Icone size={28} className={choisi ? 'text-neo-600' : 'text-neo'} />
        <span className="mt-3 text-lg font-bold text-gray-900">{titre}</span>
        <span className="mt-1.5 text-sm text-gray-600 leading-snug">{soustitre}</span>
      </button>
    );
  };

  return (
    <div>
      <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-snug text-center">
        Ta place du 11 septembre t’attend.
      </h1>
      <p className="mt-4 text-lg text-gray-600 text-center max-w-xl mx-auto">
        Il te reste à choisir ton heure. La rencontre dure 60 minutes, et tu repars avec ton
        portrait métabolique en main.
      </p>

      {/* Une modalité complète n'est pas affichée du tout : montrer un bouton qui
          mène à un calendrier vide donne l'impression que tout est brisé. */}
      {offertes.length > 1 && (
        <div className="mt-10 flex flex-col md:flex-row gap-4">
          {bouton(
            'clinique',
            'À la clinique de Brossard',
            'Analyse InBody sur place + sac-cadeau de 110 $',
            Building2,
          )}
          {bouton('visio', 'En visio', 'Sac-cadeau posté + guides numériques', Video)}
        </div>
      )}

      {offertes.length === 1 && preferenceComplete && (
        <p className="mt-8 rounded-2xl bg-neo-50 px-5 py-4 text-center text-base text-neo-900">
          {offertes[0] === 'clinique'
            ? 'Les places en visio sont toutes prises. Il en reste à la clinique de Brossard — avec l’analyse InBody en prime.'
            : 'Les places en clinique sont toutes prises. Il en reste en visio : même évaluation, même portrait métabolique, sac-cadeau posté.'}
        </p>
      )}

      {/* Le dépôt se prend dans le formulaire du calendrier GHL. Ce bloc est là
          pour qu'on ne le découvre pas au moment de payer : une demande d'argent
          non annoncée sur une page qui dit « gratuit » fait abandonner. */}
      <div className="mt-10 rounded-2xl border-2 border-neo-100 bg-neo-50/60 px-6 py-5">
        <p className="text-base text-neo-900 leading-relaxed">
          <strong className="font-bold">Un dépôt de 20 $ confirme ta place.</strong> On te le
          remet en argent le jour même, en arrivant. C’est juste notre façon de s’assurer que les
          40 places vont à des gens qui vont vraiment se présenter — on a 5 professionnels qui
          bloquent leur journée complète pour ça.
        </p>
      </div>

      <div className="mt-8">
        <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
        <iframe
          key={modalite}
          src={urlCalendrier(modalite, coordonnees)}
          id={CALENDRIERS[modalite].iframeId}
          title="Calendrier de réservation de la porte ouverte"
          allow="payment"
          scrolling="no"
          className="w-full border-none overflow-hidden min-h-[750px]"
        />
      </div>
    </div>
  );
}
