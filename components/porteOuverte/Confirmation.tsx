'use client';

import { useSearchParams } from 'next/navigation';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import VideoSlot from './VideoSlot';

/** Vidéo de 60 secondes après la réservation, hébergée dans la médiathèque GHL. */
const VIDEO_CONFIRMATION =
  'https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/6aba9804631574b13646f25b.mp4';

const ADRESSE = '7005 Bd Taschereau, Suite 350, Brossard, QC J4Z 1A7';
const TITRE_EVENEMENT = 'Porte ouverte NEO Performance — évaluation métabolique';

/**
 * Plage de l'événement ajouté à l'agenda.
 *
 * Si GHL transmet l'heure du rendez-vous dans l'URL (`?debut=` ISO 8601), on
 * crée un événement de 60 minutes. Sinon, un événement « toute la journée »
 * le 23 octobre : la personne a déjà l'heure exacte dans son courriel de
 * confirmation.
 */
function plage(debut: string | null): { google: string; ics: string[] } {
  const date = debut ? new Date(debut) : null;
  if (date && !Number.isNaN(date.getTime())) {
    const fin = new Date(date.getTime() + 60 * 60 * 1000);
    const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return {
      google: `${utc(date)}/${utc(fin)}`,
      ics: [`DTSTART:${utc(date)}`, `DTEND:${utc(fin)}`],
    };
  }
  return {
    google: '20261023/20261024',
    ics: ['DTSTART;VALUE=DATE:20261023', 'DTEND;VALUE=DATE:20261024'],
  };
}

export default function Confirmation() {
  const params = useSearchParams();
  const visio = params.get('modalite') === 'visio';
  const lieu = visio ? 'En visio — le lien Google Meet est dans ton courriel de confirmation' : ADRESSE;
  const { google, ics } = plage(params.get('debut'));

  const details =
    'Ta rencontre de 60 minutes avec une naturopathe NEO Performance. Pour déplacer ou annuler, utilise le lien dans ton courriel de confirmation.';

  const urlGoogle = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE',
    text: TITRE_EVENEMENT,
    dates: google,
    details,
    location: lieu,
  }).toString()}`;

  const telechargerIcs = () => {
    const contenu = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NEO Performance//Porte ouverte//FR',
      'BEGIN:VEVENT',
      `UID:po-2310-${Date.now()}@neoperformance.ca`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      ...ics,
      `SUMMARY:${TITRE_EVENEMENT}`,
      `DESCRIPTION:${details}`,
      `LOCATION:${lieu.replace(/,/g, '\\,')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([contenu], { type: 'text/calendar;charset=utf-8' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = 'porte-ouverte-neo-23-octobre.ics';
    lien.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-50 pb-20">
      <div className="relative overflow-hidden bg-gray-900 pt-28 pb-24 text-center text-white md:pb-28">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-neo/20 blur-[90px] md:-top-44 md:h-[700px] md:w-[1000px] md:blur-[140px]" />
        <div className="container relative z-10 mx-auto px-5 md:px-12">
          <span className="mb-4 block text-[11px] font-bold uppercase tracking-[0.12em] text-neo md:text-sm md:tracking-[0.14em]">
            Journée porte ouverte · 23 octobre 2026
          </span>
          <h1 className="mx-auto max-w-2xl text-2xl font-bold leading-snug md:text-4xl">
            Ta place est confirmée.
          </h1>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4">
        <div className="-mt-16 rounded-3xl bg-white p-6 shadow-2xl shadow-gray-900/10 md:-mt-20 md:p-10">
          <div className="flex items-center justify-center gap-2 text-neo">
            <CheckCircle2 size={22} />
            <p className="text-base font-semibold">Regarde cette vidéo de 60 secondes avant le 23 octobre</p>
          </div>

          <VideoSlot src={VIDEO_CONFIRMATION} className="mt-6" />

          <div className="mt-8 flex flex-col gap-3">
            <a
              href={urlGoogle}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-neo px-6 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-neo-600"
            >
              <CalendarPlus size={20} />
              Ajouter à mon agenda
            </a>
            <button
              type="button"
              onClick={telechargerIcs}
              className="text-sm font-semibold text-gray-500 underline underline-offset-2 hover:text-neo"
            >
              Apple, Outlook ou autre agenda (.ics)
            </button>
          </div>

          <p className="mt-8 text-center text-base leading-relaxed text-gray-600">
            Tu vas recevoir un courriel de confirmation avec l’heure exacte de ta rencontre
            {visio
              ? ' et ton lien Google Meet.'
              : '. Ton dépôt de 20 $ t’est remis en argent le jour même, à ton arrivée.'}
          </p>
        </div>
      </div>
    </div>
  );
}
