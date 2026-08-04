'use client';

import { Check } from 'lucide-react';

/**
 * Écran d'une question à choix unique.
 *
 * Ne connaît rien du parcours : il reçoit une question, des options et une
 * valeur courante, et remonte la sélection. Le bouton « Suivant » est géré par
 * BilanFlow, qui sait s'il reste des étapes.
 */
export default function QuestionScreen({
  question,
  options,
  valeur,
  onChange,
}: {
  question: string;
  options: string[];
  valeur: string | null;
  onChange: (valeur: string) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-8">
        {question}
      </h1>

      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const choisi = option === valeur;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={choisi}
              className={`group flex items-center gap-4 w-full text-left rounded-2xl border-2 px-5 py-4 transition-all duration-200 ${
                choisi
                  ? 'border-neo bg-neo-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-neo-300 hover:bg-neo-50/40'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  choisi ? 'border-neo bg-neo text-white' : 'border-gray-300 text-transparent'
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </span>
              <span
                className={`text-base leading-snug ${
                  choisi ? 'text-neo-900 font-semibold' : 'text-gray-700'
                }`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
