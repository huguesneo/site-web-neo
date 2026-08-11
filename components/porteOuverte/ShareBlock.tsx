'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export const LIEN_PARTAGE = 'https://www.neoperformance.ca/porte-ouverte';

/**
 * Bloc de référence montré aux personnes disqualifiées.
 *
 * On va en disqualifier entre 30 et 50. Chacune connaît des femmes qui ont tout
 * essayé — c'est la source de leads la moins chère de toute la campagne, à
 * condition de leur donner le lien au moment exact où on leur dit non.
 */
export default function ShareBlock({ titre, corps }: { titre: string; corps: string }) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(LIEN_PARTAGE);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2500);
    } catch (erreur) {
      // Presse-papier refusé (navigateur ancien, contexte non sécurisé) : le
      // lien reste lisible et sélectionnable à l'écran, rien n'est perdu.
      console.error('[porte-ouverte] copie du lien impossible', erreur);
    }
  };

  return (
    <div className="mt-10 border-t border-gray-100 pt-8 text-center">
      <h2 className="text-xl font-bold text-gray-900">{titre}</h2>
      <p className="mt-3 text-base text-gray-600 leading-relaxed max-w-xl mx-auto">{corps}</p>

      <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-3 max-w-xl mx-auto">
        <code className="flex-1 truncate rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 text-left">
          {LIEN_PARTAGE}
        </code>
        <button
          type="button"
          onClick={copier}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neo px-5 py-3 text-sm font-semibold text-neo transition-colors hover:bg-neo hover:text-white"
        >
          {copie ? <Check size={16} /> : <Copy size={16} />}
          {copie ? 'Lien copié' : 'Copier le lien'}
        </button>
      </div>
    </div>
  );
}
