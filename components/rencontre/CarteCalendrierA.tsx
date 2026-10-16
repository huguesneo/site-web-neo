import { Clock, Lock, Video } from 'lucide-react';
import Calendrier from './Calendrier';

const PASTILLE =
  'inline-flex items-center gap-1.5 rounded-full bg-neo/10 px-3 py-1 text-xs font-bold uppercase tracking-[.05em] text-neo-700';

/** Carte du hero, version A : le calendrier est visible tout de suite. */
export default function CarteCalendrierA() {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-[-.02em] text-gray-900">Choisis ta plage</h2>
      <div className="mt-3 mb-2 flex flex-wrap gap-2">
        <span className={PASTILLE}>Gratuit</span>
        <span className={PASTILLE}>
          <Clock size={13} strokeWidth={2.25} aria-hidden="true" />
          45 minutes
        </span>
        <span className={PASTILLE}>
          <Video size={13} strokeWidth={2.25} aria-hidden="true" />
          En visio
        </span>
      </div>
      <Calendrier version="A" />
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-600">
        <Lock size={13} className="text-neo" aria-hidden="true" />
        Tes informations restent confidentielles.
      </p>
    </>
  );
}
