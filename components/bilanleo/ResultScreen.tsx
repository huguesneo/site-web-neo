'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Building2, Video } from 'lucide-react';
import type { Contact } from './ContactScreen';
import { normaliserTelephone } from './ContactScreen';

import { CALENDRIERS_BILAN, type Disponibilites, type LieuBilan as Lieu } from '@/lib/bilanleo';

const CALENDRIERS: Record<Lieu, { base: string; iframeId: string }> = {
  clinique: {
    base: `https://api.leadconnectorhq.com/widget/booking/${CALENDRIERS_BILAN.clinique}`,
    iframeId: 'JO6tHfBQVXGN96AuXP3o_1785868037708',
  },
  visio: {
    base: `https://api.leadconnectorhq.com/widget/booking/${CALENDRIERS_BILAN.visio}`,
    iframeId: 'JO6tHfBQVXGN96AuXP3o_1785868051182',
  },
};

/** Pré-remplit le formulaire de réservation GHL avec les coordonnées déjà données. */
function urlCalendrier(lieu: Lieu, contact: Contact): string {
  const params = new URLSearchParams({
    first_name: contact.firstName.trim(),
    last_name: contact.lastName.trim(),
    email: contact.email.trim(),
    phone: normaliserTelephone(contact.phone),
  });
  return `${CALENDRIERS[lieu].base}?${params.toString()}`;
}

/**
 * Écran de résultat. Tout le monde est qualifié : le tri se fait en aval dans
 * Make, à partir du webhook.
 *
 * Le calendrier choisi s'affiche dans la page, sans redirection. C'est le
 * script form_embed.js de GHL qui redimensionne l'iframe ; s'il est bloqué, la
 * hauteur minimale garde le calendrier utilisable.
 */
export default function ResultScreen({
  contact,
  disponibilites,
}: {
  contact: Contact;
  disponibilites: Disponibilites;
}) {
  const offerts = (Object.keys(CALENDRIERS) as Lieu[]).filter((l) => disponibilites[l]);
  // Un seul lieu disponible : on le sélectionne d'office, choisir n'a plus de sens.
  const [lieu, setLieu] = useState<Lieu | null>(offerts.length === 1 ? offerts[0] : null);

  const bouton = (
    valeur: Lieu,
    titre: string,
    soustitre: string,
    Icone: typeof Building2,
  ) => {
    const choisi = lieu === valeur;
    return (
      <button
        type="button"
        onClick={() => setLieu(valeur)}
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
        Ton profil correspond à ce pour quoi cette évaluation est bâtie.
      </h1>
      <p className="mt-4 text-lg text-gray-600 text-center max-w-xl mx-auto">
        Il te reste à choisir ton moment. La rencontre dure 75 minutes.
      </p>

      {/* Un lieu complet n'est pas affiché du tout : montrer un bouton qui mène à
          un calendrier vide donne l'impression que la réservation est brisée. */}
      {offerts.length > 1 && (
        <div className="mt-10 flex flex-col md:flex-row gap-4">
          {offerts.includes('clinique') &&
            bouton(
              'clinique',
              'En clinique à Brossard',
              'Inclut l’analyse de composition corporelle InBody',
              Building2,
            )}
          {offerts.includes('visio') &&
            bouton('visio', 'En visioconférence', 'Même évaluation, sans le test InBody', Video)}
        </div>
      )}

      {offerts.length === 1 && (
        <p className="mt-8 rounded-2xl bg-neo-50 px-5 py-4 text-center text-base text-neo-900">
          {offerts[0] === 'clinique'
            ? 'Il reste des places en clinique à Brossard, avec l’analyse InBody. La visioconférence est complète pour le moment.'
            : 'Il reste des places en visioconférence. La clinique de Brossard est complète pour le moment.'}
        </p>
      )}

      {lieu && (
        <div className="mt-10">
          <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
          <iframe
            key={lieu}
            src={urlCalendrier(lieu, contact)}
            id={CALENDRIERS[lieu].iframeId}
            title="Calendrier de réservation"
            allow="payment"
            scrolling="no"
            className="w-full border-none overflow-hidden min-h-[750px]"
          />
        </div>
      )}
    </div>
  );
}
