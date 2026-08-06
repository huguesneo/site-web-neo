'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const QUESTIONS = [
  {
    q: 'C’est vraiment gratuit ?',
    r: 'Oui. Le bilan métabolique est offert pour faire découvrir NEO Performance. Aucun paiement, aucune carte de crédit demandée pour réserver.',
  },
  {
    q: 'Ça dure combien de temps ?',
    r: '75 minutes avec une naturopathe de la clinique. On prend le temps de passer à travers tes réponses, tes tests et ce qu’ils révèlent.',
  },
  {
    q: 'C’est quoi, les deux tests à faire chez moi ?',
    r: 'Deux tests simples à faire à la maison avant la rencontre, environ dix minutes au total. Tu reçois les instructions détaillées après avoir réservé. Ils servent à voir ce qu’un questionnaire seul ne peut pas montrer.',
  },
  {
    q: 'Clinique ou visioconférence : quelle différence ?',
    r: 'En clinique à Brossard, on ajoute l’analyse de composition corporelle InBody, qui mesure ta masse musculaire, ta masse grasse et ta répartition d’eau. En visioconférence, l’évaluation est la même, sans ce test. Le reste est identique.',
  },
  {
    q: 'Est-ce que je devrai acheter quelque chose après ?',
    r: 'Non. Tu repars avec ton bilan et des recommandations concrètes, que tu poursuives avec nous ou non. Si tu veux aller plus loin, on t’expliquera comment — mais rien ne t’y oblige.',
  },
  {
    q: 'Je suis déjà cliente chez NEO. Est-ce que je peux le faire ?',
    r: 'Oui, et il est gratuit pour toi aussi. Demande-le simplement à ta naturopathe à ta prochaine rencontre, vous le ferez ensemble.',
  },
];

/**
 * Foire aux questions en accordéon, au bas de la page.
 *
 * Elle traite les objections qui empêchent de réserver — le prix, la durée, ce
 * qu'on va lui vendre après. Les répondre ici évite de perdre quelqu'un juste
 * avant le calendrier.
 */
export default function Faq() {
  const [ouverte, setOuverte] = useState<number | null>(null);

  return (
    <section className="mx-auto mt-20 max-w-2xl px-4">
      <h2 className="mb-8 text-center text-2xl md:text-3xl font-bold text-gray-900">
        Questions fréquentes
      </h2>

      <div className="flex flex-col gap-3">
        {QUESTIONS.map((item, i) => {
          const active = ouverte === i;
          return (
            <div
              key={item.q}
              className={`overflow-hidden rounded-2xl border-2 bg-white transition-colors ${
                active ? 'border-neo-200' : 'border-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setOuverte(active ? null : i)}
                aria-expanded={active}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-base font-semibold text-gray-900">{item.q}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-neo transition-transform duration-300 ${
                    active ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  active ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-base leading-relaxed text-gray-600">{item.r}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
