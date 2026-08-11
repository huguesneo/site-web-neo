'use client';

import { Check } from 'lucide-react';
import type { Option } from '@/lib/porteOuverte';

/**
 * Écran d'une question, à choix unique ou multiple.
 *
 * Ne connaît rien du parcours : il reçoit une question et des options, et
 * remonte la sélection. Le bouton « Suivant » est géré par PorteOuverteFlow,
 * qui sait s'il reste des étapes.
 *
 * En choix unique la case est ronde, en choix multiple elle est carrée — la
 * forme est la seule chose qui dit à la personne si elle peut en cocher
 * plusieurs, et elle le dit avant qu'elle ait à essayer.
 */
export default function ChoiceScreen<V extends string>({
  question,
  aide,
  options,
  valeurs,
  onSelection,
  multiple = false,
}: {
  question: string;
  aide?: string;
  options: Option<V>[];
  valeurs: V[];
  onSelection: (valeur: V) => void;
  multiple?: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">{question}</h1>
      {aide && <p className="mt-3 text-base text-gray-500 leading-snug">{aide}</p>}

      <div className="mt-8 flex flex-col gap-3">
        {options.map((option) => {
          const choisi = valeurs.includes(option.valeur);
          return (
            <button
              key={option.valeur}
              type="button"
              onClick={() => onSelection(option.valeur)}
              aria-pressed={choisi}
              className={`flex items-center gap-4 w-full text-left rounded-2xl border-2 px-5 py-4 transition-all duration-200 ${
                choisi
                  ? 'border-neo bg-neo-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-neo-300 hover:bg-neo-50/40'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
                  multiple ? 'rounded-md' : 'rounded-full'
                } ${choisi ? 'border-neo bg-neo text-white' : 'border-gray-300 text-transparent'}`}
              >
                <Check size={14} strokeWidth={3} />
              </span>

              <span className="min-w-0">
                <span
                  className={`block text-base leading-snug ${
                    choisi ? 'text-neo-900 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </span>
                {option.detail && (
                  <span className="mt-1 block text-sm text-gray-500 leading-snug">
                    {option.detail}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
