import { PRIX_CARTE_CENTS, TEXTE_CARTE, argent } from '@/lib/continuite/contenu';

// Rencontre à la carte, sans abonnement. Le bouton ouvre le formulaire de paiement.
export default function BlocCarte({ variante, onReserver }: { variante: 'large' | 'compact'; onReserver: () => void }) {
  const bouton = (
    <button
      type="button"
      onClick={onReserver}
      className="flex items-center justify-center min-h-12 px-[22px] rounded-full border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] text-[15px] font-bold hover:bg-[#F3F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007F78]"
    >
      Réserver une rencontre
    </button>
  );

  if (variante === 'compact') {
    return (
      <div className="border border-[#C9DCDB] rounded-[18px] px-[22px] py-[18px] flex flex-wrap items-center gap-x-6 gap-y-3 bg-[#F5FAFA]">
        <div className="flex-[1_1_300px] flex flex-col gap-1">
          <div className="text-base font-extrabold">
            Suivi à la carte · <span className="font-bold">{argent(PRIX_CARTE_CENTS)}</span>{' '}
            <span className="text-[13px] font-semibold text-[#4A5455]">+ taxes, par rencontre</span>
          </div>
          <p className="m-0 text-[13px] text-[#4A5455] leading-normal">{TEXTE_CARTE}</p>
        </div>
        {bouton}
      </div>
    );
  }

  return (
    <div className="w-full border border-[#DCE5E5] rounded-[18px] px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-4 bg-[#FAFBFB]">
      <div className="flex-[2_1_300px] flex flex-col gap-1">
        <div className="text-xs font-bold tracking-[0.12em] uppercase text-[#4A5455]">Sans abonnement</div>
        <h3 className="m-0 text-lg font-extrabold">Suivi à la carte</h3>
        <p className="m-0 text-sm text-[#4A5455] leading-normal">{TEXTE_CARTE}</p>
      </div>
      <div className="flex-[0_1_240px] flex flex-col gap-2.5">
        <div className="text-[15px]">
          <span className="text-[26px] font-extrabold">{argent(PRIX_CARTE_CENTS)}</span>{' '}
          <span className="text-[#4A5455] font-semibold">+ taxes, par rencontre</span>
        </div>
        {bouton}
      </div>
    </div>
  );
}
