'use client';

import { Clock, MapPin, Users } from 'lucide-react';

/**
 * Bande foncée d'ouverture, d'après la maquette Claude Design.
 *
 * Version complète au premier écran, compacte ensuite : pendant le
 * questionnaire, un hero pleine hauteur repousserait la question sous la ligne
 * de flottaison sur mobile.
 *
 * Deux halos turquoise superposés — un large et diffus en haut, un plus serré
 * derrière le titre. C'est ce qui empêche le fond foncé de paraître plat.
 */
export default function Hero({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-900 text-white text-center ${
        // Le bas doit rester plus grand que le chevauchement de la carte
        // (-mt-16 / -mt-20), sinon elle recouvre le titre.
        compact ? 'pt-28 pb-24 md:pb-28' : 'pt-28 pb-28 md:pt-32 md:pb-32'
      }`}
    >
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-neo/20 blur-[90px] md:-top-44 md:h-[700px] md:w-[1000px] md:blur-[140px]" />
      <div className="pointer-events-none absolute top-28 left-1/2 hidden h-80 w-[620px] -translate-x-1/2 rounded-full bg-neo/15 blur-[110px] md:block" />

      <div className="container relative z-10 mx-auto px-5 md:px-12">
        <span className="mb-4 block text-[11px] font-bold uppercase leading-relaxed tracking-[0.12em] text-neo md:mb-5 md:text-sm md:tracking-[0.14em]">
          Journée porte ouverte
          <br className="md:hidden" />
          <span className="hidden md:inline"> · </span>
          11 septembre 2026
        </span>

        {compact ? (
          <h1 className="mx-auto max-w-2xl text-xl font-bold leading-snug md:text-2xl">
            Quelques questions, et on regarde s’il te reste une place.
          </h1>
        ) : (
          <>
            <h1 className="mx-auto mb-4 max-w-[940px] text-[31px] font-extrabold leading-[1.1] tracking-tight text-pretty md:mb-6 md:text-[58px] md:leading-[1.06]">
              Le 11 septembre, on ouvre la clinique à 48 personnes qui ont déjà tout essayé
            </h1>
            <p className="mx-auto mb-6 max-w-[700px] text-base leading-relaxed text-gray-300 text-pretty md:mb-8 md:text-xl">
              Une évaluation métabolique complète de 60 minutes. Ton analyse InBody. Ton portrait
              métabolique en main. Gratuit.
            </p>

            <ul className="flex flex-col items-center justify-center gap-2.5 text-[13.5px] text-gray-300 md:flex-row md:gap-8 md:text-[15px]">
              <li className="flex items-center gap-2">
                <Users size={16} className="text-neo md:size-[18px]" />
                48 places, 6 naturopathes
              </li>
              <li aria-hidden className="hidden size-[5px] rounded-full bg-white/25 md:block" />
              <li className="flex items-center gap-2">
                <Clock size={16} className="text-neo md:size-[18px]" />
                60 minutes
              </li>
              <li aria-hidden className="hidden size-[5px] rounded-full bg-white/25 md:block" />
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-neo md:size-[18px]" />
                Brossard ou en visio
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
