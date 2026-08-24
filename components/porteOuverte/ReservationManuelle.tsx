'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Building2, Video } from 'lucide-react';
import { CALENDRIERS_PORTE_OUVERTE, type Modalite } from '@/lib/porteOuverte';

/**
 * Réservation manuelle de la porte ouverte — pour Hugues (ou l'équipe), pas
 * pour un lead.
 *
 * Pas de questionnaire, pas de capture préalable : on choisit clinique ou
 * visio, et les coordonnées se rentrent directement dans le widget GHL, comme
 * n'importe quelle réservation prise au téléphone ou en personne.
 */
const CALENDRIERS: Record<Modalite, { url: string; iframeId: string }> = {
  clinique: {
    url: `https://api.leadconnectorhq.com/widget/booking/${CALENDRIERS_PORTE_OUVERTE.clinique}`,
    iframeId: 'JO6tHfBQVXGN96AuXP3o_1786100000003',
  },
  visio: {
    url: `https://api.leadconnectorhq.com/widget/booking/${CALENDRIERS_PORTE_OUVERTE.visio}`,
    iframeId: 'JO6tHfBQVXGN96AuXP3o_1786100000004',
  },
};

export default function ReservationManuelle() {
  const [modalite, setModalite] = useState<Modalite>('clinique');

  const bouton = (valeur: Modalite, titre: string, Icone: typeof Building2) => {
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
      </button>
    );
  };

  return (
    <div className="bg-gray-50 pb-20 pt-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-gray-900/10 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug text-center">
            Réservation — Journée porte ouverte
          </h1>
          <p className="mt-3 text-base text-gray-600 text-center max-w-xl mx-auto">
            Choisis clinique ou visio, puis complète la réservation directement dans le
            calendrier.
          </p>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            {bouton('clinique', 'À la clinique de Brossard', Building2)}
            {bouton('visio', 'En visio', Video)}
          </div>

          <div className="mt-8">
            <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
            <iframe
              key={modalite}
              src={CALENDRIERS[modalite].url}
              id={CALENDRIERS[modalite].iframeId}
              title="Calendrier de réservation de la porte ouverte"
              allow="payment"
              scrolling="yes"
              className="w-full border-none min-h-[1000px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
