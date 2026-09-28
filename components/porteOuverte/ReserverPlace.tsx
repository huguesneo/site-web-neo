'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Video } from 'lucide-react';
import { CALENDRIERS_PORTE_OUVERTE, type Modalite } from '@/lib/porteOuverte';

/**
 * Relance « tu as vu le calendrier sans réserver » : le lien envoyé par
 * courriel ou texto mène ici, directement au choix clinique / visio et au
 * calendrier.
 *
 * Les coordonnées arrivent dans l'URL depuis les champs de fusion GHL
 * (first_name, last_name, email, phone) et pré-remplissent le formulaire de
 * réservation. `modalite=visio` présélectionne la visio ; la clinique est
 * proposée par défaut.
 */
const CALENDRIERS: Record<Modalite, { base: string; iframeId: string }> = {
  clinique: {
    base: `https://api.leadconnectorhq.com/widget/booking/${CALENDRIERS_PORTE_OUVERTE.clinique}`,
    iframeId: 'JO6tHfBQVXGN96AuXP3o_1786100000005',
  },
  visio: {
    base: `https://api.leadconnectorhq.com/widget/booking/${CALENDRIERS_PORTE_OUVERTE.visio}`,
    iframeId: 'JO6tHfBQVXGN96AuXP3o_1786100000006',
  },
};

const PARAMS_PREREMPLIS = ['first_name', 'last_name', 'email', 'phone'] as const;

export default function ReserverPlace() {
  const params = useSearchParams();
  const [modalite, setModalite] = useState<Modalite>(
    params.get('modalite') === 'visio' ? 'visio' : 'clinique',
  );

  // Un champ de fusion GHL vide arrive tel quel (« {{contact.email}} ») :
  // on ne transmet que les valeurs réellement remplies.
  const prerempli = new URLSearchParams();
  for (const cle of PARAMS_PREREMPLIS) {
    const valeur = params.get(cle)?.trim();
    if (valeur && !valeur.includes('{{')) prerempli.set(cle, valeur);
  }
  const suffixe = prerempli.toString() ? `?${prerempli.toString()}` : '';

  // Même raison que sur BookingScreen : form_embed.js ne redimensionne que les
  // iframes présentes à son chargement, on le réinjecte donc au montage.
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const choix = (valeur: Modalite, titre: string, detail: string, Icone: typeof Building2) => {
    const choisi = modalite === valeur;
    return (
      <button
        type="button"
        onClick={() => setModalite(valeur)}
        aria-pressed={choisi}
        className={`flex flex-1 flex-col items-center rounded-2xl border-2 px-5 py-5 text-center transition-all duration-200 ${
          choisi
            ? 'border-neo bg-neo-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-neo-300 hover:shadow-md'
        }`}
      >
        <Icone size={26} className={choisi ? 'text-neo-600' : 'text-neo'} />
        <span className="mt-2.5 text-base font-bold text-gray-900 md:text-lg">{titre}</span>
        <span className="mt-1 text-sm text-gray-500">{detail}</span>
      </button>
    );
  };

  return (
    <>
      <div className="relative overflow-hidden bg-gray-900 pt-28 pb-24 text-center text-white md:pb-28">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-neo/20 blur-[90px] md:-top-44 md:h-[700px] md:w-[1000px] md:blur-[140px]" />
        <div className="container relative z-10 mx-auto px-5 md:px-12">
          <span className="mb-4 block text-[11px] font-bold uppercase tracking-[0.12em] text-neo md:text-sm md:tracking-[0.14em]">
            Journée porte ouverte · 23 octobre 2026
          </span>
          <h1 className="mx-auto max-w-2xl text-2xl font-bold leading-snug md:text-4xl">
            Ta place t’attend encore.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-gray-300 md:text-lg">
            Choisis la clinique ou la visio, puis ton heure. Ça prend une minute.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 pb-20">
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <div className="-mt-16 rounded-3xl bg-white p-6 shadow-2xl shadow-gray-900/10 md:-mt-20 md:p-8">
            <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:gap-4">
              {choix('clinique', 'À la clinique de Brossard', 'Recommandé · analyse InBody incluse', Building2)}
              {choix('visio', 'En visio', 'Google Meet, depuis chez toi', Video)}
            </div>

            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border-2 border-neo-100 bg-neo-50/60 px-6 py-4">
              <p className="text-base leading-relaxed text-neo-900">
                <strong className="font-bold">Un dépôt de 20 $ confirme ta place.</strong>
                {modalite === 'clinique' && ' Il te sera remboursé le jour même à ton arrivée.'}
              </p>
            </div>

            {/* Les deux calendriers restent montés, seule la visibilité change :
                une iframe remontée après coup garde sa hauteur minimale. */}
            <div className="mt-8">
              {(Object.keys(CALENDRIERS) as Modalite[]).map((m) => (
                <div key={m} className={m === modalite ? 'block' : 'hidden'}>
                  <iframe
                    src={`${CALENDRIERS[m].base}${suffixe}`}
                    id={CALENDRIERS[m].iframeId}
                    title={
                      m === 'clinique'
                        ? 'Calendrier de réservation à la clinique de Brossard'
                        : 'Calendrier de réservation en visio'
                    }
                    allow="payment"
                    scrolling="no"
                    className="block min-h-[750px] w-full border-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
