'use client';

import { Heart } from 'lucide-react';
import type { DqMotif } from '@/lib/porteOuverte';
import ShareBlock from './ShareBlock';

const MESSAGES: Record<DqMotif, { titre: string; corps: string[] }> = {
  'cliente-actuelle': {
    titre: 'Tu es déjà avec nous.',
    corps: [
      'La porte ouverte, c’est pour les gens qui ne nous connaissent pas encore. Par contre, tu as quelque chose de mieux : ton naturopathe.',
      'Écris-lui dans le chat de l’application, il va te répondre aujourd’hui.',
    ],
  },
  'ancienne-cliente': {
    titre: 'Tu as déjà fait le programme — on a mieux qu’une porte ouverte pour toi.',
    corps: [
      'Un de nos naturopathes va te contacter dans les prochains jours pour voir où tu en es et ce qui ferait du sens pour la suite.',
      'Les anciens clients ont accès à des conditions qu’on ne met pas sur le web.',
    ],
  },
  'deja-porte-ouverte': {
    titre: 'Tu es déjà venue à une porte ouverte.',
    corps: [
      'Les 48 places du 11 septembre vont à des personnes qui n’ont jamais mis les pieds chez nous — c’est la raison d’être de la journée.',
      'On garde tes coordonnées : dès qu’on ouvre quelque chose pour les gens qui nous connaissent déjà, tu es dans les premières averties.',
    ],
  },
};

/**
 * Destination D — les trois disqualifications.
 *
 * Aucune n'est un cul-de-sac : chacune ressort par une porte différente, et
 * toutes les trois donnent le lien de partage. C'est ce qui transforme un refus
 * en source de leads.
 */
export default function DisqualifiedScreen({ motif }: { motif: DqMotif }) {
  const message = MESSAGES[motif];

  return (
    <div className="py-6">
      <div className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neo-50 text-neo">
          <Heart size={26} />
        </span>

        <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
          {message.titre}
        </h1>

        {message.corps.map((paragraphe) => (
          <p
            key={paragraphe}
            className="mt-4 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto"
          >
            {paragraphe}
          </p>
        ))}
      </div>

      <ShareBlock
        titre="Tu connais quelqu’un qui devrait venir le 11 septembre ?"
        corps="Envoie-lui ce lien. C’est le meilleur cadeau que tu peux faire à quelqu’un qui a tout essayé."
      />
    </div>
  );
}
