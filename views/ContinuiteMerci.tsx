'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarCheck, CheckCircle2, Smartphone } from 'lucide-react';
import { getSession, ErreurContinuite } from '@/lib/continuite/api';
import { DETAILS_DUREES, NOMS_PALIERS, dateLongue } from '@/lib/continuite/contenu';
import type { Session } from '@/lib/continuite/types';
import { BandeauSimulation, Chargement, MessageErreur } from '@/components/continuite/Etats';

// Date du jour en heure locale, au format AAAA-MM-JJ.
function aujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function PremierPaiement({ date }: { date: string | null }) {
  if (!date) return <>La date de ton premier paiement figure dans ton reçu Stripe.</>;
  if (date.slice(0, 10) > aujourdhui()) {
    return (
      <>
        Ton premier paiement aura lieu le <strong className="font-bold">{dateLongue(date)}</strong>. Aucun montant
        n&apos;est prélevé avant cette date.
      </>
    );
  }
  return (
    <>
      Ton premier paiement a été effectué le <strong className="font-bold">{dateLongue(date)}</strong>. Les
      suivants auront lieu chaque mois à la même date.
    </>
  );
}

const ContinuiteMerci: React.FC = () => {
  const params = useSearchParams();
  const sessionId = params.get('session_id')?.trim() || '';
  const [session, setSession] = useState<Session | null>(null);
  const [erreur, setErreur] = useState<string | null>(
    sessionId ? null : 'Nous ne trouvons pas ta confirmation de paiement dans ce lien.',
  );

  useEffect(() => {
    if (!sessionId) return;
    let actif = true;
    getSession(sessionId)
      .then((s) => actif && setSession(s))
      .catch((e) => {
        if (actif) setErreur(e instanceof ErreurContinuite ? e.message : 'Impossible de vérifier ton paiement.');
      });
    return () => {
      actif = false;
    };
  }, [sessionId]);

  // Le contrat renvoie « ouverte » ou « expiree » ; les valeurs Stripe brutes sont acceptées par prudence.
  const nonTermine = session && ['ouverte', 'expiree', 'open', 'expired'].includes(session.statut);

  return (
    <div className="bg-neo/10 min-h-[80vh] pt-32 pb-16 px-4">
      <div className="container mx-auto max-w-xl">
        <BandeauSimulation className="rounded-xl mb-5" />

        {erreur ? (
          <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Confirmation introuvable</h1>
            <MessageErreur message={erreur} />
            <p className="text-sm text-gray-600 mt-5 leading-relaxed">
              Si ton paiement a été accepté, ton accès NEO Continuité est activé dans l&apos;application NEO.
              Connecte-toi avec le même courriel que celui utilisé pour le paiement. Si tu ne vois pas ton forfait
              d&apos;ici quelques minutes, écris-nous à{' '}
              <a href="mailto:info@neoperformance.ca" className="text-neo-700 font-semibold">
                info@neoperformance.ca
              </a>{' '}
              et on règle ça rapidement.
            </p>
          </div>
        ) : !session ? (
          <Chargement texte="Vérification de ton paiement…" />
        ) : nonTermine ? (
          <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm text-center">
            <h1 className="text-2xl font-extrabold text-gray-900">Ton paiement n&apos;est pas terminé</h1>
            <p className="text-gray-600 mt-3">
              Aucun montant n&apos;a été prélevé. Tu peux reprendre ton inscription quand tu veux.
            </p>
            <Link
              href="/continuite"
              className="mt-6 inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full bg-neo text-white hover:bg-neo-600"
            >
              Revenir aux forfaits
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm">
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 text-neo mx-auto" aria-hidden="true" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4">Bienvenue dans NEO Continuité</h1>
              <p className="text-gray-600 mt-2">Ton inscription est confirmée. Merci de ta confiance.</p>
            </div>

            <div className="mt-6 rounded-2xl bg-neo/[.07] border border-neo/25 px-5 py-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-neo-700">Ton forfait</p>
              <p className="text-lg font-extrabold text-gray-900 mt-1">
                {NOMS_PALIERS[session.palier] ?? session.palier}
                <span className="font-semibold text-gray-600"> · {DETAILS_DUREES[session.duree] ?? session.duree}</span>
              </p>
            </div>

            <h2 className="text-lg font-extrabold text-gray-900 mt-8 mb-4">La suite</h2>
            <ol className="space-y-5">
              <li className="flex gap-4">
                <Smartphone className="w-6 h-6 text-neo shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-gray-700 leading-relaxed">
                  <strong className="font-bold text-gray-900">
                    Ton accès NEO Continuité est activé dans l&apos;application NEO.
                  </strong>{' '}
                  Connecte-toi avec le même courriel que celui utilisé pour le paiement. Si tu ne vois pas ton
                  forfait d&apos;ici quelques minutes, écris-nous à{' '}
                  <a href="mailto:info@neoperformance.ca" className="text-neo-700 font-semibold">
                    info@neoperformance.ca
                  </a>{' '}
                  et on règle ça rapidement.
                </p>
              </li>
              <li className="flex gap-4">
                <CalendarCheck className="w-6 h-6 text-neo shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-gray-700 leading-relaxed">
                  <PremierPaiement date={session.date_premier_paiement} />
                </p>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinuiteMerci;
