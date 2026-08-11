'use client';

import { Clock, MapPin, Users } from 'lucide-react';

/**
 * Bande foncée d'ouverture, dans le même esprit que /bilanleo et /approche.
 *
 * Version complète au premier écran, compacte ensuite : pendant le
 * questionnaire, un hero pleine hauteur repousserait la question sous la ligne
 * de flottaison sur mobile.
 *
 * Les blocs de vente qui suivront (déroulé des 60 minutes, preuve, sac-cadeau,
 * « pour qui ce n'est pas », FAQ) viennent en deuxième livraison, sous la carte.
 */
export default function Hero({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-900 text-white text-center ${
        // Le bas doit rester plus grand que le chevauchement de la carte
        // (-mt-16 / -mt-20), sinon elle recouvre le titre.
        compact ? 'pt-28 pb-24 md:pb-28' : 'pt-32 pb-28 md:pb-32'
      }`}
    >
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full rounded-full bg-neo/10 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-4">
        <span className="mb-4 block text-sm font-bold uppercase tracking-wider text-neo">
          Journée porte ouverte · 11 septembre 2026
        </span>

        {compact ? (
          <h1 className="mx-auto max-w-2xl text-xl md:text-2xl font-bold leading-snug">
            Quelques questions, et on regarde s’il te reste une place.
          </h1>
        ) : (
          <>
            <h1 className="mx-auto mb-6 max-w-3xl text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Le 11 septembre, on ouvre la clinique à 48 personnes qui ont déjà tout essayé
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg md:text-xl text-gray-300 leading-relaxed">
              Une évaluation métabolique complète de 60 minutes. Ton analyse InBody. Ton portrait
              métabolique en main. Gratuit.
            </p>

            <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Users size={18} className="text-neo" />
                48 places, 6 naturopathes
              </li>
              <li className="flex items-center gap-2">
                <Clock size={18} className="text-neo" />
                60 minutes
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={18} className="text-neo" />
                Brossard ou en visio
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
