'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, UserRound } from 'lucide-react';
import { getProfil } from '@/lib/evaluation-reprise/api';
import {
  ETAPES,
  INCLUS,
  PRIX_AFFICHE,
  VALEUR_AFFICHEE,
  parametrePropre,
} from '@/lib/evaluation-reprise/contenu';
import type { Profil } from '@/lib/evaluation-reprise/types';
import { lireUtm } from '@/lib/continuite/utm';
import Cadre from '@/components/evaluation-reprise/Cadre';
import Paiement from '@/components/evaluation-reprise/Paiement';

/*
  Évaluation de reprise (courriel de réactivation GHL aux anciennes clientes).
  Les paramètres du lien (prenom, nom, courriel, tel) servent seulement à
  préremplir le formulaire. La naturo vient toujours du serveur
  (evaluation-reprise-profil), jamais de l'URL.
*/
const EvaluationReprise: React.FC = () => {
  const params = useSearchParams();
  const cid = parametrePropre(params.get('cid')) || null;
  const initiales = useMemo(
    () => ({
      prenom: parametrePropre(params.get('prenom')),
      nom: parametrePropre(params.get('nom')),
      courriel: parametrePropre(params.get('courriel')),
      telephone: parametrePropre(params.get('tel')),
    }),
    [params],
  );
  const utm = useMemo(() => lireUtm(params), [params]);

  // undefined : profil en chargement ; null : aucun profil (pas de cid ou échec).
  const [profil, setProfil] = useState<Profil | null | undefined>(cid ? undefined : null);

  useEffect(() => {
    if (!cid) return;
    let actif = true;
    getProfil(cid)
      .then((p) => actif && setProfil(p))
      // Sans profil, la page reste utilisable avec une naturo de l'équipe.
      .catch(() => actif && setProfil(null));
    return () => {
      actif = false;
    };
  }, [cid]);

  const prenom = profil?.prenom?.trim() || initiales.prenom;
  const naturo = profil?.naturo?.prenom?.trim() || null;

  return (
    <Cadre>
      {/* Héro */}
      <section className="bg-[#EBF8F7] px-5 pt-10 pb-10 sm:pt-16 sm:pb-14">
        <div className="max-w-[720px] mx-auto text-center flex flex-col items-center gap-4 sm:gap-5">
          <div className="inline-flex bg-white border border-[#9FDCD8] text-[#007F78] text-xs font-bold tracking-[0.12em] uppercase px-4 py-2 rounded-full">
            Évaluation de reprise
          </div>
          <h1 className="m-0 text-[clamp(30px,5vw,48px)] leading-[1.12] font-extrabold tracking-[-0.02em]">
            {prenom ? `${prenom}, on reprend ensemble?` : 'On reprend ensemble?'}
          </h1>
          <p className="m-0 text-[17px] sm:text-[19px] leading-relaxed text-[#4A5455] max-w-[600px]">
            Une rencontre avec ta naturopathe pour faire le point sur ton métabolisme aujourd’hui et repartir avec un
            plan clair.
          </p>

          <div
            className="mt-2 w-full max-w-[520px] flex items-center gap-4 bg-white rounded-2xl border border-[#D5ECEA] px-5 py-4 text-left"
            aria-live="polite"
          >
            <span className="shrink-0 w-11 h-11 rounded-full bg-[#EBF8F7] flex items-center justify-center">
              <UserRound className="w-5 h-5 text-[#007F78]" aria-hidden="true" />
            </span>
            {profil === undefined ? (
              <span className="flex-1 flex flex-col gap-2" aria-label="Chargement">
                <span className="h-3.5 w-4/5 rounded bg-[#EEF2F2] animate-pulse" />
                <span className="h-3.5 w-2/5 rounded bg-[#EEF2F2] animate-pulse" />
              </span>
            ) : (
              <p className="m-0 text-base leading-snug">
                {naturo ? (
                  <>
                    Ta rencontre se fera avec <strong className="font-extrabold">{naturo}</strong>, ta naturopathe.
                  </>
                ) : (
                  'Ta rencontre se fera avec une naturopathe de l’équipe NEO.'
                )}
              </p>
            )}
          </div>

          <a
            href="#reserver"
            className="md:hidden mt-1 inline-flex items-center justify-center min-h-[52px] px-9 rounded-full border-2 border-[#007F78] bg-[#007F78] text-white text-base font-bold hover:bg-[#00615C] hover:border-[#00615C]"
          >
            Voir l’offre
          </a>
        </div>
      </section>

      <section className="px-4 sm:px-5 py-10 sm:py-16">
        <div className="max-w-[1040px] mx-auto grid gap-8 md:gap-12 md:grid-cols-[1fr_440px] md:grid-rows-[auto_1fr] md:items-start">
          {/* Inclus */}
          <div className="flex flex-col gap-5 px-1 md:pt-2">
            <h2 className="m-0 text-[clamp(24px,3.2vw,32px)] leading-tight font-extrabold">Ce qui est inclus</h2>
            <ul className="m-0 p-0 list-none flex flex-col gap-4">
              {INCLUS.map((ligne) => (
                <li key={ligne} className="flex gap-3 text-[17px] leading-snug">
                  <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-[#EBF8F7] flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#007F78]" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span>{ligne}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prix et réservation */}
          <div
            id="reserver"
            className="md:row-span-2 md:sticky md:top-6 scroll-mt-4 bg-white rounded-3xl border border-[#E3E8E8] shadow-[0_12px_40px_rgba(26,26,26,0.06)] p-5 sm:p-7 flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <h2 className="m-0 text-[22px] font-extrabold">Ton évaluation de reprise</h2>
              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <span className="text-lg text-[#8A9596] line-through decoration-2" aria-label={`Valeur de ${VALEUR_AFFICHEE}`}>
                  {VALEUR_AFFICHEE}
                </span>
                <span className="text-[44px] leading-none font-extrabold tracking-[-0.02em]">{PRIX_AFFICHE}</span>
                <span className="text-base font-semibold text-[#4A5455]">+ taxes</span>
              </div>
              <p className="m-0 self-start inline-flex bg-[#EBF8F7] text-[#007F78] text-[13px] font-bold px-3 py-1.5 rounded-full">
                Offre réservée aux anciennes clientes NEO
              </p>
            </div>
            <Paiement cid={cid} initiales={initiales} utm={utm} />
          </div>

          {/* Comment ça fonctionne */}
          <div className="flex flex-col gap-5 px-1">
            <h2 className="m-0 text-[clamp(22px,2.8vw,26px)] leading-tight font-extrabold">Comment ça fonctionne</h2>
            <ol className="m-0 p-0 list-none flex flex-col gap-4">
              {ETAPES.map((etape, i) => (
                <li key={etape.titre} className="flex gap-4">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-[#007F78] text-white font-extrabold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    <p className="m-0 text-[17px] font-bold leading-snug">{etape.titre}</p>
                    <p className="m-0 mt-1 text-[15px] leading-relaxed text-[#4A5455]">{etape.texte}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </Cadre>
  );
};

export default EvaluationReprise;
