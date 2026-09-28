'use client';

import { useState } from 'react';
import { Bell, Check, Hourglass, Loader2 } from 'lucide-react';
import Button from '@/components/Button';

/**
 * Calendrier plein. Aucune liste d'attente gérée ici : le bouton pose un tag
 * sur le contact, et c'est GHL qui avertit quand une place se libère.
 */
export default function CompletScreen({ onAvertir }: { onAvertir: () => Promise<boolean> }) {
  const [etat, setEtat] = useState<'initial' | 'envoi' | 'fait' | 'erreur'>('initial');

  const avertir = async () => {
    setEtat('envoi');
    setEtat((await onAvertir()) ? 'fait' : 'erreur');
  };

  return (
    <div className="py-6 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neo-50 text-neo">
        <Hourglass size={26} />
      </span>

      <h1 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
        Les 40 places du 23 octobre sont toutes prises.
      </h1>
      <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
        Il arrive que des places se libèrent dans les derniers jours. Si tu veux, on t’avertit dès
        que ça arrive.
      </p>

      <div className="mt-8 max-w-md mx-auto">
        {etat === 'fait' ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-neo-50 px-5 py-4 text-base font-semibold text-neo-900">
            <Check size={18} />
            C’est noté. On t’écrit dès qu’une place se libère.
          </p>
        ) : (
          <>
            <Button onClick={avertir} disabled={etat === 'envoi'} fullWidth>
              <span className="inline-flex items-center gap-2">
                {etat === 'envoi' ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                Avertis-moi si une place se libère
              </span>
            </Button>
            {etat === 'erreur' && (
              <p className="mt-3 text-sm text-red-600">
                Ça n’a pas fonctionné. Réessaie, ou appelle-nous au 450 406-4006.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
