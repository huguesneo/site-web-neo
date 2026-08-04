'use client';

/**
 * Écran de question à réponse libre (Q6), avec minimum de caractères et
 * compteur visible. Le blocage du bouton « Suivant » est décidé par BilanFlow
 * à partir de la même règle de minimum.
 */
export default function TextScreen({
  question,
  aide,
  minimum,
  valeur,
  onChange,
}: {
  question: string;
  aide: string;
  minimum: number;
  valeur: string;
  onChange: (valeur: string) => void;
}) {
  const longueur = valeur.trim().length;
  const atteint = longueur >= minimum;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-8">
        {question}
      </h1>

      <textarea
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        autoFocus
        className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-base text-gray-800 leading-relaxed transition-colors focus:border-neo focus:outline-none focus:ring-0 resize-none"
        placeholder="Écris-moi ce que tu as tenté…"
      />

      <div className="mt-3 flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500 leading-snug">{aide}</p>
        <p
          className={`shrink-0 text-sm font-semibold tabular-nums ${
            atteint ? 'text-neo-600' : 'text-gray-400'
          }`}
        >
          {longueur} / {minimum}
        </p>
      </div>
    </div>
  );
}
