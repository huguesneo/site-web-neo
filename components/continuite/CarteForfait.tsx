'use client';
import { Check } from 'lucide-react';
import {
  BADGE_RECOMMANDE,
  BADGE_RECOMMANDE_PUBLIC,
  BOUTONS_PALIERS,
  MOIS_DUREE,
  NOMS_PALIERS,
  NOTE_CARTE_CADEAU,
  ROLES_PALIERS,
  argent,
  lignesInclus,
} from '@/lib/continuite/contenu';
import { economie, type Grille } from '@/lib/continuite/offre';
import type { Duree, Palier } from '@/lib/continuite/types';

type Props = {
  grille: Grille;
  palier: Palier;
  duree: Duree;
  recommande?: boolean;
  selectionne?: boolean;
  /*
    publique   : carte de la grille de /continuite (4 lignes + « Tout ce qui est inclus »)
    principale : grande carte de /continuite/naturo (toutes les lignes sur 2 colonnes)
    secondaire : cartes repliées de /continuite/naturo
  */
  variante: 'publique' | 'principale' | 'secondaire';
  onChoisir: () => void;
};

const LIGNES_VISIBLES = 4;

export default function CarteForfait({ grille, palier, duree, recommande, selectionne, variante, onChoisir }: Props) {
  const prix = grille[palier]?.[duree];
  if (!prix) return null;
  const eco = economie(grille, palier, duree);
  const mois = MOIS_DUREE[duree];
  const lignes = lignesInclus(prix);
  const prixSansEngagement = eco ? grille[palier]?.mensuel?.montant_mensuel_cents : undefined;

  const visibles = variante === 'publique' ? lignes.slice(0, LIGNES_VISIBLES) : lignes;
  const caches = variante === 'publique' ? lignes.slice(LIGNES_VISIBLES) : [];

  const bouton = selectionne ? 'Forfait choisi' : BOUTONS_PALIERS[palier];
  // Page publique : la mise en avant suit le forfait choisi; le badge « Recommandé » reste.
  const plein = selectionne || (recommande && variante === 'principale');

  return (
    <article
      className={`relative flex flex-col h-full bg-white rounded-[22px] border-2 ${
        variante === 'secondaire' ? 'p-[22px]' : 'p-6 sm:p-7'
      } ${
        selectionne
          ? 'border-[#007F78] shadow-[0_24px_48px_-24px_rgba(0,127,120,0.45)]'
          : 'border-[#E3E8E8]'
      } ${recommande && variante === 'publique' ? 'lg:-translate-y-2' : ''}`}
    >
      {recommande && (
        <span className="absolute -top-3.5 left-6 bg-[#007F78] text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
          {variante === 'publique' ? BADGE_RECOMMANDE_PUBLIC : BADGE_RECOMMANDE}
        </span>
      )}

      {variante === 'principale' ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-2xl font-extrabold">{NOMS_PALIERS[palier]}</h2>
            <p className="mt-1.5 text-[15px] text-[#4A5455]">{ROLES_PALIERS[palier]}</p>
          </div>
          <div className="sm:text-right">
            <div className="flex items-baseline gap-2 sm:justify-end">
              {prixSansEngagement != null && (
                <s className="text-xl font-bold text-[#8A9596]">
                  <span className="sr-only">Au lieu de </span>
                  {argent(prixSansEngagement)}
                </s>
              )}
              <span className="text-5xl font-extrabold tracking-[-0.03em] leading-none">
                {argent(prix.montant_mensuel_cents)}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#4A5455] mt-1">par mois, + taxes</div>
          </div>
        </div>
      ) : (
        <>
          <h3 className={`m-0 font-extrabold ${variante === 'secondaire' ? 'text-[19px]' : 'text-[21px]'}`}>
            {NOMS_PALIERS[palier]}
          </h3>
          <p className="mt-1.5 text-[15px] text-[#4A5455] leading-normal">{ROLES_PALIERS[palier]}</p>
          <div className="flex flex-wrap items-baseline gap-1.5 mt-5">
            <span
              className={`font-extrabold tracking-[-0.03em] leading-none ${
                variante === 'secondaire' ? 'text-[32px]' : 'text-5xl'
              }`}
            >
              {argent(prix.montant_mensuel_cents)}
            </span>
            <span className="text-[15px] font-semibold text-[#4A5455]">par mois, + taxes</span>
          </div>
        </>
      )}

      {variante === 'publique' && (
        <p className="mt-2 text-[13px] text-[#4A5455] min-h-5">
          {eco
            ? `${argent(prix.montant_mensuel_cents * mois)} + taxes sur ${mois} mois · prix garanti`
            : 'Prélevé chaque mois, sans durée minimale.'}
        </p>
      )}
      <p className="mt-1 text-sm font-bold text-[#007F78] min-h-[21px]">
        {eco
          ? variante === 'publique'
            ? `Tu économises ${argent(eco.total)}`
            : `Tu économises ${argent(eco.total)} sur ${mois} mois · prix garanti`
          : variante === 'publique'
            ? ''
            : 'Sans durée minimale.'}
      </p>

      <ul
        className={`list-none p-0 ${
          variante === 'principale'
            ? 'mt-[18px] mb-6 grid sm:grid-cols-2 gap-x-5 gap-y-3'
            : variante === 'secondaire'
              ? 'mt-3.5 mb-5 flex flex-col gap-2 text-sm'
              : 'mt-5 mb-6 flex flex-col gap-3'
        }`}
      >
        {visibles.map((l) => (
          <li key={l} className={`flex gap-2.5 leading-[1.45] ${variante === 'secondaire' ? 'text-sm' : 'text-[15px]'}`}>
            <Check className="w-[18px] h-[18px] mt-0.5 shrink-0 text-[#00BBB1]" strokeWidth={3} aria-hidden="true" />
            <span>{l}</span>
          </li>
        ))}
      </ul>

      {variante === 'publique' && (
        <details className="mb-6 text-sm text-[#4A5455] group">
          <summary className="font-bold text-[#007F78] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            Tout ce qui est inclus
          </summary>
          {caches.length > 0 && (
            <ul className="mt-2.5 list-none p-0 flex flex-col gap-2">
              {caches.map((l) => (
                <li key={l} className="flex gap-2.5 leading-[1.45]">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#00BBB1]" strokeWidth={3} aria-hidden="true" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2.5 leading-relaxed">{NOTE_CARTE_CADEAU}</p>
        </details>
      )}

      <button
        type="button"
        onClick={onChoisir}
        aria-pressed={!!selectionne}
        className={`mt-auto flex items-center justify-center w-full rounded-full border-2 font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007F78] ${
          variante === 'secondaire' ? 'min-h-[52px] text-[15px]' : variante === 'principale' ? 'min-h-14 text-[17px]' : 'min-h-[52px] text-base'
        } ${
          plein
            ? 'bg-[#007F78] border-[#007F78] text-white hover:bg-[#00615C] hover:border-[#00615C]'
            : 'bg-white border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F3F5F5]'
        }`}
      >
        {bouton}
      </button>
    </article>
  );
}
