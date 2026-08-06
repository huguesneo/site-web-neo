'use client';

import { Heart } from 'lucide-react';

/**
 * Écran de sortie du filtrage : la personne est déjà cliente, ou l'a été
 * récemment. On ne lui refuse pas le bilan, on lui explique par quel chemin
 * elle l'obtient.
 *
 * Aucun envoi vers Make : le filtrage sort avant les coordonnées, il n'y a rien
 * à transmettre.
 */
export default function ExitScreen({
  titre,
  corps,
  action,
}: {
  titre: string;
  corps: string;
  action?: { libelle: string; courriel: string; sujet: string };
}) {
  return (
    <div className="text-center py-6">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neo-50 text-neo">
        <Heart size={26} />
      </span>

      <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
        {titre}
      </h1>

      <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">{corps}</p>

      {action && (
        <a
          href={`mailto:${action.courriel}?subject=${encodeURIComponent(action.sujet)}`}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-neo px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-neo-600 hover:shadow-neo/40 focus:outline-none focus:ring-2 focus:ring-neo focus:ring-offset-2 active:scale-95"
        >
          {action.libelle}
        </a>
      )}
    </div>
  );
}
