import { CalendarCheck, Repeat, ShieldCheck } from 'lucide-react';
import { SI_LA_VIE_CHANGE } from '@/lib/continuite/contenu';

const ICONES = [ShieldCheck, Repeat, CalendarCheck];

// cartes : trois cartes avec icône (page publique) ; bloc : encadré compact (page naturo).
export default function SiLaVieChange({ variante }: { variante: 'cartes' | 'bloc' }) {
  if (variante === 'bloc') {
    return (
      <div className="bg-white rounded-[18px] px-6 py-[22px] flex flex-col gap-3 text-[15px] leading-normal">
        <div className="font-extrabold">Si la vie change</div>
        {SI_LA_VIE_CHANGE.map((t) => (
          <p key={t} className="m-0">
            {t}
          </p>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-7">
      <h2 className="m-0 text-[clamp(24px,3.2vw,32px)] font-extrabold text-center">Si la vie change</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {SI_LA_VIE_CHANGE.map((t, i) => {
          const Icone = ICONES[i];
          return (
            <div key={t} className="flex flex-col gap-3 p-6 rounded-[18px] border border-[#E3E8E8]">
              <Icone className="w-7 h-7 text-[#007F78]" strokeWidth={2} aria-hidden="true" />
              <p className="m-0 text-base leading-[1.55] font-semibold">{t}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
