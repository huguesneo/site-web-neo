'use client';

import { Clock, Gift, MapPin } from 'lucide-react';

/**
 * Bande foncée d'ouverture, dans le même esprit que le hero de /approche.
 *
 * En version complète au premier écran, elle plante le décor et donne envie de
 * commencer. En version compacte pendant le questionnaire, elle garde la
 * continuité de marque sans repousser la question sous la ligne de flottaison —
 * ce qui compte surtout sur mobile.
 */
export default function Hero({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-900 text-white text-center ${
        compact ? 'pt-28 pb-14 md:pb-16' : 'pt-32 pb-28 md:pb-32'
      }`}
    >
      {/* Halo turquoise diffus, comme sur /approche */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full rounded-full bg-neo/10 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-4">
        <span className="mb-4 block text-sm font-bold uppercase tracking-wider text-neo">
          Bilan métabolique · offert
        </span>

        {compact ? (
          <h1 className="mx-auto max-w-2xl text-xl md:text-2xl font-bold leading-snug">
            Quelques questions, et on te trouve un moment.
          </h1>
        ) : (
          <>
            <h1 className="mx-auto mb-6 max-w-3xl text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Découvre ce qui bloque vraiment ton métabolisme.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg md:text-xl text-gray-300 leading-relaxed">
              Fatigue, digestion, sommeil, poids qui stagne : ces signaux ont une
              cause. Réponds à quelques questions, on t'ouvre une place pour un
              bilan complet avec une naturopathe.
            </p>

            <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Gift size={18} className="text-neo" />
                Entièrement gratuit
              </li>
              <li className="flex items-center gap-2">
                <Clock size={18} className="text-neo" />
                75 minutes
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={18} className="text-neo" />
                Brossard ou en ligne
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
