'use client';

import { Heart } from 'lucide-react';
import ShareBlock from './ShareBlock';

/**
 * Sortie « cliente, ou cliente dans la dernière année » — pas de calendrier.
 *
 * La porte ouverte est pour les gens qui ne sont pas encore accompagnés. Une
 * cliente récente a déjà mieux : sa naturopathe. On la renvoie vers elle, et on lui
 * donne le lien de partage — c'est ce qui transforme un « pas pour toi » en
 * source de leads.
 */
export default function ClienteActiveScreen() {
  return (
    <div className="py-6">
      <div className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neo-50 text-neo">
          <Heart size={26} />
        </span>

        <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
          Tu fais déjà partie de la famille NEO — parle à ta naturopathe.
        </h1>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
          La porte ouverte, c’est pour les gens qui ne nous connaissent pas encore. Toi, tu as
          quelque chose de mieux : ta naturopathe, qui connaît déjà ton dossier.
        </p>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
          Écris-lui dans le chat de l’application NEO, ou appelle-nous au 450 406-4006. On
          va regarder ensemble la meilleure suite pour toi.
        </p>
      </div>

      <ShareBlock
        titre="Tu connais quelqu’un qui devrait venir le 23 octobre ?"
        corps="Envoie-lui ce lien. C’est le meilleur cadeau que tu peux faire à quelqu’un qui a tout essayé."
      />
    </div>
  );
}
