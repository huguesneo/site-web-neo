'use client';
import { NOMS_DUREES, ORDRE_DUREES, ORDRE_PALIERS, argent } from '@/lib/continuite/contenu';
import { economie, type Grille } from '@/lib/continuite/offre';
import type { Duree, Palier } from '@/lib/continuite/types';

type Props = {
  valeur: Duree;
  onChange: (duree: Duree) => void;
  grille: Grille;
  /*
    Économie affichée sous chaque durée : celle du forfait donné (page naturo,
    un seul forfait à l'écran), ou la plus haute des trois forfaits, précédée
    de « jusqu'à » (page publique).
  */
  palier: Palier | 'meilleur';
  fond?: 'gris' | 'menthe';
};

export default function SelecteurDuree({ valeur, onChange, grille, palier, fond = 'gris' }: Props) {
  return (
    <fieldset
      className={`w-full grid grid-cols-3 gap-1.5 p-1.5 rounded-[18px] border-0 m-0 ${
        fond === 'menthe' ? 'bg-[#DCEFEE]' : 'bg-[#EEF2F2]'
      }`}
    >
      <legend className="sr-only">Durée</legend>
      {ORDRE_DUREES.map((d) => {
        const actif = d === valeur;
        const total =
          palier === 'meilleur'
            ? Math.max(0, ...ORDRE_PALIERS.map((p) => economie(grille, p, d)?.total ?? 0))
            : (economie(grille, palier, d)?.total ?? 0);
        const montant = total > 0 ? `${palier === 'meilleur' ? 'jusqu’à ' : ''}−${argent(total)}` : '';
        const sous =
          d === 'mensuel'
            ? 'Sans durée minimale'
            : d === '12_mois'
              ? `Meilleur prix${montant ? ` · ${montant}` : ''}`
              : montant.charAt(0).toUpperCase() + montant.slice(1);
        return (
          <label
            key={d}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[64px] sm:min-h-[68px] rounded-[14px] px-1.5 py-2 text-center cursor-pointer transition-all focus-within:ring-2 focus-within:ring-[#007F78] ${
              actif ? 'bg-white shadow-[0_2px_8px_rgba(26,26,26,0.10)]' : 'hover:bg-white/50'
            }`}
          >
            <input
              type="radio"
              name="duree"
              value={d}
              checked={actif}
              onChange={() => onChange(d)}
              className="sr-only"
            />
            <span className="text-[15px] sm:text-base font-extrabold text-[#1A1A1A]">{NOMS_DUREES[d]}</span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#007F78] leading-tight">{sous}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
