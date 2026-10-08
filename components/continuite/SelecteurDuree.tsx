'use client';
import { DETAILS_DUREES, NOMS_DUREES, ORDRE_DUREES } from '@/lib/continuite/contenu';
import type { Duree } from '@/lib/continuite/types';

type Props = {
  valeur: Duree;
  onChange: (duree: Duree) => void;
  // Plus grand rabais en pourcentage par durée, affiché en pastille.
  rabais?: Partial<Record<Duree, number>>;
};

export default function SelecteurDuree({ valeur, onChange, rabais }: Props) {
  return (
    <fieldset className="w-full max-w-xl mx-auto">
      <legend className="sr-only">Durée de l&apos;abonnement</legend>
      <div className="grid grid-cols-3 gap-1.5 bg-gray-100 rounded-2xl p-1.5">
        {ORDRE_DUREES.map((duree) => {
          const actif = duree === valeur;
          const pct = rabais?.[duree];
          return (
            <label
              key={duree}
              className={`relative cursor-pointer rounded-xl px-2 py-2.5 sm:py-3 text-center transition-all focus-within:ring-2 focus-within:ring-neo ${
                actif ? 'bg-white shadow-sm' : 'hover:bg-white/60'
              }`}
            >
              <input
                type="radio"
                name="duree"
                value={duree}
                checked={actif}
                onChange={() => onChange(duree)}
                className="sr-only"
              />
              <span className={`block text-sm sm:text-[15px] font-bold ${actif ? 'text-gray-900' : 'text-gray-600'}`}>
                {NOMS_DUREES[duree]}
              </span>
              <span className="block text-[11px] sm:text-xs text-gray-500 mt-0.5">{DETAILS_DUREES[duree]}</span>
              {pct ? (
                <span className="mt-1.5 inline-block bg-neo text-white text-[10px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full">
                  <span className="sm:hidden">Jusqu&apos;à −{pct} %</span>
                  <span className="hidden sm:inline">Jusqu&apos;à {pct} % de moins</span>
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
