'use client';
import { Check } from 'lucide-react';
import {
  INCLUS_PAR_DEFAUT,
  NOMS_PALIERS,
  ORDRE_PALIERS,
  PALIER_RECOMMANDE,
  RESUMES_PALIERS,
  argent,
} from '@/lib/continuite/contenu';
import { economie, type Grille } from '@/lib/continuite/offre';
import type { Duree, Palier } from '@/lib/continuite/types';

type Props = {
  grille: Grille;
  duree: Duree;
  selection: Palier | null;
  onChoisir: (palier: Palier) => void;
};

export default function CartesPaliers({ grille, duree, selection, onChoisir }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-3 items-stretch">
      {ORDRE_PALIERS.map((palier) => {
        const prix = grille[palier]?.[duree];
        if (!prix) return null;
        const eco = economie(grille, palier, duree);
        const recommande = palier === PALIER_RECOMMANDE;
        const choisi = selection === palier;
        const inclus = prix.inclus?.length ? prix.inclus : INCLUS_PAR_DEFAUT[palier];
        return (
          <div
            key={palier}
            className={`relative flex flex-col bg-white rounded-[20px] p-6 sm:p-7 border-2 transition-all ${
              choisi
                ? 'border-neo shadow-[0_20px_40px_-18px_rgba(0,187,177,0.45)]'
                : recommande
                  ? 'border-neo/50 shadow-sm'
                  : 'border-gray-200 shadow-sm'
            }`}
          >
            {recommande && (
              <span className="absolute -top-3 left-7 bg-neo text-white text-[11px] font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-full">
                Recommandé
              </span>
            )}
            <h3 className="text-lg font-extrabold text-gray-900">{NOMS_PALIERS[palier]}</h3>
            <p className="text-sm text-gray-600 mt-1">{RESUMES_PALIERS[palier]}</p>

            <div className="flex items-end gap-1.5 mt-4 flex-wrap">
              <span className="text-[38px] sm:text-[42px] font-extrabold tracking-tight leading-none">
                {argent(prix.montant_mensuel_cents)}
              </span>
              <span className="text-[15px] font-semibold text-gray-500 pb-1">par mois, + taxes</span>
            </div>

            <p className="text-sm mt-3 min-h-[2.5rem]">
              {eco ? (
                <span className="text-neo-700 font-semibold">
                  {argent(eco.parMois)} de moins par mois, soit {argent(eco.total)} d&apos;économie sur{' '}
                  {eco.mois} mois.
                </span>
              ) : (
                <span className="text-gray-500">Sans engagement, mois par mois.</span>
              )}
            </p>

            <ul className="space-y-2.5 text-sm text-gray-700 mt-4 mb-6">
              {inclus.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-neo" strokeWidth={3} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onChoisir(palier)}
              aria-pressed={choisi}
              className={`mt-auto w-full inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neo ${
                choisi
                  ? 'bg-neo text-white hover:bg-neo-600'
                  : recommande
                    ? 'bg-neo text-white shadow-[0_10px_15px_-3px_rgba(0,187,177,0.2)] hover:bg-neo-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {choisi ? 'Forfait choisi' : `Choisir ${NOMS_PALIERS[palier]}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}
