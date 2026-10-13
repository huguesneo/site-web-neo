'use client';
import Image from 'next/image';
import { LOGO_URL } from '@/constants';
import { modeSimule } from '@/lib/evaluation-reprise/api';
import { ADRESSE_CLINIQUE, TELEPHONE_CLINIQUE, TELEPHONE_LIEN } from '@/lib/evaluation-reprise/contenu';

/*
  Habillage des pages Évaluation de reprise : plein écran, sans le menu du
  site (voir SiteChrome), comme /continuite.
*/
export default function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[#1A1A1A] bg-white w-full min-h-screen flex flex-col">
      {modeSimule && (
        <div className="bg-amber-100 text-amber-900 text-center text-xs font-bold px-4 py-2">
          Simulation locale : réponses et paiement simulés
        </div>
      )}
      <header className="flex items-center justify-center px-4 py-4 sm:py-5 border-b border-[#EEF2F2]">
        <Image src={LOGO_URL} alt="NEO Performance" width={44} height={44} priority className="h-10 sm:h-11 w-auto" />
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#EEF2F2] px-5 pt-8 pb-10 text-center text-[13px] leading-[1.7] text-[#4A5455]">
        <p className="m-0">
          NEO Performance · {ADRESSE_CLINIQUE} ·{' '}
          <a href={TELEPHONE_LIEN} className="text-[#007F78] hover:text-[#00615C] whitespace-nowrap">
            {TELEPHONE_CLINIQUE}
          </a>{' '}
          ·{' '}
          <a href="mailto:info@neoperformance.ca" className="text-[#007F78] hover:text-[#00615C]">
            info@neoperformance.ca
          </a>
        </p>
      </footer>
    </div>
  );
}
