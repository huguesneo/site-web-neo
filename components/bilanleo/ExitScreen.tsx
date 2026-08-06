'use client';

import { Heart, type LucideIcon } from 'lucide-react';

interface Action {
  libelle: string;
  href: string;
}

/**
 * Écran de fin sans réservation : filtrage d'une cliente actuelle ou récente, ou
 * liste d'attente. On ne refuse rien à personne — on explique par quel autre
 * chemin elle obtient ce qu'elle est venue chercher.
 *
 * Le bloc secondaire sert à offrir une porte de sortie plus rapide quand la
 * principale est fermée.
 */
export default function ExitScreen({
  titre,
  corps,
  action,
  secondaire,
  icone: Icone = Heart,
}: {
  titre: string;
  corps: string;
  action?: Action;
  secondaire?: { titre: string; corps: string; action: Action };
  icone?: LucideIcon;
}) {
  const bouton = (a: Action, principal: boolean) => (
    <a
      href={a.href}
      className={
        principal
          ? 'mt-8 inline-flex items-center justify-center rounded-full bg-neo px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-neo-600 hover:shadow-neo/40 focus:outline-none focus:ring-2 focus:ring-neo focus:ring-offset-2 active:scale-95'
          : 'mt-6 inline-flex items-center justify-center rounded-full border-2 border-neo px-8 py-3 text-base font-semibold text-neo transition-all duration-300 hover:bg-neo hover:text-white focus:outline-none focus:ring-2 focus:ring-neo focus:ring-offset-2 active:scale-95'
      }
    >
      {a.libelle}
    </a>
  );

  return (
    <div className="text-center py-6">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neo-50 text-neo">
        <Icone size={26} />
      </span>

      <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
        {titre}
      </h1>

      <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">{corps}</p>

      {action && bouton(action, true)}

      {secondaire && (
        <div className="mt-10 border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900">{secondaire.titre}</h2>
          <p className="mt-3 text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
            {secondaire.corps}
          </p>
          {bouton(secondaire.action, false)}
        </div>
      )}
    </div>
  );
}
