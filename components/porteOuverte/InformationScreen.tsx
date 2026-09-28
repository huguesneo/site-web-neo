'use client';

import { BookOpen, Users } from 'lucide-react';
import { GROUPE_FACEBOOK } from '@/lib/porteOuverte';

/**
 * Sortie « rien pour le moment » — pas de calendrier.
 *
 * La personne vient chercher de l'information : on lui en donne, sans la
 * faire venir pour rien. Le guide part par courriel (tag posé côté serveur),
 * le groupe Facebook est à un clic.
 */
export default function InformationScreen() {
  return (
    <div className="py-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
          Tu viens chercher de l’information ? On a exactement ce qu’il te faut.
        </h1>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
          Les 40 places du 23 octobre vont en priorité aux personnes prêtes à embarquer dans une
          démarche cet automne. En attendant, voici deux façons de commencer dès aujourd’hui.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4 max-w-xl mx-auto">
        <div className="rounded-2xl bg-gray-50 px-6 py-6">
          <div className="flex items-center gap-3">
            <BookOpen size={22} className="text-neo shrink-0" />
            <h2 className="text-base font-bold text-gray-900">Ton guide gratuit arrive par courriel</h2>
          </div>
          <p className="mt-3 text-base text-gray-600 leading-relaxed">
            « Sors du mode survie », le guide qui débloque le plus de monde. Surveille ta boîte
            courriel dans les prochaines minutes.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-neo-100 bg-neo-50/60 px-6 py-6">
          <div className="flex items-center gap-3">
            <Users size={22} className="text-neo shrink-0" />
            <h2 className="text-base font-bold text-gray-900">Rejoins le groupe Facebook NEO</h2>
          </div>
          <p className="mt-3 text-base text-gray-600 leading-relaxed">
            Des conseils de nos naturopathes chaque semaine, et des femmes qui vivent la même chose
            que toi.
          </p>
          <a
            href={GROUPE_FACEBOOK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center rounded-full bg-neo px-6 py-4 text-base font-bold text-white transition-colors hover:bg-neo-600"
          >
            Rejoindre le groupe
          </a>
        </div>
      </div>
    </div>
  );
}
