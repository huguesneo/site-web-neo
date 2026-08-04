'use client';

/**
 * Écran de question à réponse libre (Q6). Obligatoire comme toutes les autres,
 * mais sans longueur minimale : le bouton « Suivant » se débloque dès qu'il y a
 * du texte.
 */
export default function TextScreen({
  question,
  aide,
  valeur,
  onChange,
}: {
  question: string;
  aide: string;
  valeur: string;
  onChange: (valeur: string) => void;
}) {
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

      <p className="mt-3 text-sm text-gray-500 leading-snug">{aide}</p>
    </div>
  );
}
