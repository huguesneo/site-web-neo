'use client';

import { Hourglass } from 'lucide-react';

const GUIDES = [
  'Le voyage d’une bouchée',
  'Sors du mode survie',
  '20 recettes de déjeuners faites par Léo',
  'Comment optimiser la routine du matin et celle du soir',
  'Comprends bien ton alimentation',
];

/**
 * Destination C — et le repli quand les 40 places sont parties.
 *
 * Deux raisons d'arriver ici, deux textes. Le froid n'est pas puni, il est
 * nourri : sur soixante froids, une dizaine remontent en chaud dans les six
 * mois parce qu'ils ont lu les guides. C'est la liste de reciblage de la
 * prochaine porte ouverte.
 *
 * Les guides eux-mêmes partent de Make, pas d'ici : cet écran les annonce.
 */
export default function WaitlistScreen({ raison }: { raison: 'froid' | 'complet' }) {
  const titre =
    raison === 'froid'
      ? 'T’es sur la liste d’attente — et t’as quand même quelque chose aujourd’hui'
      : 'Les 40 places sont parties — t’es sur la liste d’attente';

  const corps =
    raison === 'froid'
      ? 'Les 40 places du 11 septembre partent en priorité aux personnes prêtes à embarquer dans une démarche dès cet automne. C’est plate à dire de même, mais c’est plus honnête que de te faire venir pour rien.'
      : 'Les cinq naturopathes sont complets pour le 11 septembre. On t’a inscrite avec les coordonnées que tu viens de nous donner, et tu passes avant tout le monde dès qu’une place se libère.';

  return (
    <div className="py-6">
      <div className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neo-50 text-neo">
          <Hourglass size={26} />
        </span>

        <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900 leading-snug">{titre}</h1>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">{corps}</p>
      </div>

      <div className="mt-10 rounded-2xl bg-gray-50 px-6 py-6 max-w-xl mx-auto">
        <h2 className="text-base font-bold text-gray-900">Voici ce qui arrive maintenant</h2>
        <p className="mt-3 text-base text-gray-600 leading-relaxed">
          Ta place est réservée sur la liste d’attente. Le 1<sup>er</sup> septembre, on regarde
          combien de places restent. S’il y en a, tu reçois un courriel — et t’as 48 h pour la
          prendre avant qu’on passe à la suivante.
        </p>
      </div>

      <div className="mt-8 max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900">
          Et en attendant, les 5 guides sont à toi.
        </h2>
        <p className="mt-3 text-base text-gray-600 leading-relaxed">
          Pas en échange de quelque chose. Ils sont dans le prochain courriel, dans 2 minutes.
        </p>

        <ul className="mt-5 flex flex-col gap-2.5">
          {GUIDES.map((guide) => (
            <li key={guide} className="flex items-start gap-3 text-base text-gray-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neo" />
              {guide}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-base text-gray-500 leading-relaxed">
          Valeur de 110 $. Lis « Sors du mode survie » en premier — c’est celui qui débloque le
          plus de monde.
        </p>
      </div>
    </div>
  );
}
