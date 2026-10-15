'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CalendarCheck, Check, CheckCircle2, Mail, Phone } from 'lucide-react';
import { getOffre, getSession } from '@/lib/continuite/api';
import { NOMS_PALIERS, argent, creditCents, dateLongue } from '@/lib/continuite/contenu';
import type { Duree, Palier, Prix, Session } from '@/lib/continuite/types';
import { Chargement } from '@/components/continuite/Etats';

const URL_APP_WEB = 'https://app.neoperformance.ca';
const URL_APP_STORE = 'https://apps.apple.com/ca/app/neo-performance/id6756714068';
const URL_GOOGLE_PLAY = 'https://play.google.com/store/apps/details?id=ca.neoperformance.app&hl=fr_CA';

const ENGAGEMENTS: Record<Duree, string> = {
  mensuel: 'Mois par mois, sans engagement',
  '6_mois': 'Engagement de 6 mois',
  '12_mois': 'Engagement de 12 mois',
};

// Paliers qui incluent des suivis individuels en naturopathie.
const FREQUENCE_SUIVI: Partial<Record<Palier, string>> = {
  continuite_plus: 'aux 2 mois',
  continuite_extra: 'chaque mois',
};

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

// Prix du palier acheté, lu dans continuite-offre (crédit et suivi additionnel).
// En cas d'échec, la page s'affiche sans les montants.
function usePrixPalier(palier: Palier | null, duree: Duree | null): Prix | undefined {
  const [offre, setOffre] = useState<Prix[] | null>(null);
  useEffect(() => {
    if (!palier) return;
    let actif = true;
    getOffre()
      .then((o) => actif && setOffre(o))
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [palier]);
  const duPalier = offre?.filter((p) => p.palier === palier) ?? [];
  return duPalier.find((p) => p.duree === duree) ?? duPalier[0];
}

function Carte({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm">{children}</div>;
}

function Entete({ titre, sousTitre }: { titre: string; sousTitre: string }) {
  return (
    <div className="text-center">
      <CheckCircle2 className="w-14 h-14 text-neo mx-auto" aria-hidden="true" />
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4">{titre}</h1>
      <p className="text-gray-600 mt-2">{sousTitre}</p>
    </div>
  );
}

function ProchaineEtape({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-2xl bg-neo text-white px-5 py-5">
      <p className="text-xs font-bold uppercase tracking-wider text-white/80">Ta prochaine étape</p>
      <p className="mt-2 text-base sm:text-lg font-semibold leading-snug">{children}</p>
    </div>
  );
}

function BoutonsApp() {
  return (
    <div className="mt-5">
      <a
        href={URL_APP_WEB}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors"
      >
        Ouvrir l&apos;app NEO
        <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </a>
      <p className="text-sm text-gray-600 text-center mt-3">
        Connecte-toi avec le même courriel que celui utilisé pour le paiement.
      </p>

      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 text-center mt-5 mb-3">
        Tu n&apos;as pas l&apos;app sur ton téléphone ?
      </p>
      <div className="grid grid-cols-2 gap-3">
        <a
          href={URL_APP_STORE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors"
          aria-label="Télécharger NEO Performance sur l'App Store"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.13-2.19 1.28-2.17 3.82.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.76M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span className="text-left leading-tight">
            <span className="block text-[10px] text-gray-500">Télécharger dans</span>
            <span className="block text-sm font-semibold">l&apos;App Store</span>
          </span>
        </a>
        <a
          href={URL_GOOGLE_PLAY}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors"
          aria-label="Télécharger NEO Performance sur Google Play"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true">
            <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l10.703-10.63L1.337.924zM12.98 12.943l3.238 3.216-12.8 7.246 9.562-10.462zm0-1.775L3.395.668l12.822 7.259-3.237 3.241z" />
          </svg>
          <span className="text-left leading-tight">
            <span className="block text-[10px] text-gray-500">Disponible sur</span>
            <span className="block text-sm font-semibold">Google Play</span>
          </span>
        </a>
      </div>
    </div>
  );
}

function Contact() {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
      <p>Une question ou tu ne trouves pas ton accès ?</p>
      <div className="mt-3 flex flex-col gap-2">
        <a href="mailto:info@neoperformance.ca" className="inline-flex items-center gap-2 text-neo-700 font-semibold">
          <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
          Écris-nous à info@neoperformance.ca
        </a>
        <a href="tel:+14504864006" className="inline-flex items-center gap-2 text-neo-700 font-semibold">
          <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
          Appelle-nous au (450) 486-4006
        </a>
      </div>
    </div>
  );
}

function texteCredit(cents: number | null): string {
  const montant = cents ? ` de ${argent(cents)}` : '';
  return `Ton crédit suppléments${montant}, envoyé chaque mois en carte-cadeau par courriel, aussi visible dans ton compte neoperformance.ca`;
}

function ListeInclus({ lignes }: { lignes: string[] }) {
  return (
    <>
      <h2 className="text-lg font-extrabold text-gray-900 mt-8 mb-3">Ce qui est inclus</h2>
      <ul className="space-y-2.5">
        {lignes.map((ligne) => (
          <li key={ligne} className="flex gap-3 text-gray-700 leading-relaxed">
            <Check className="w-5 h-5 text-neo shrink-0 mt-0.5" aria-hidden="true" />
            <span>{ligne}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Abonnement({ session }: { session: Session }) {
  const { palier, duree } = session;
  const prix = usePrixPalier(palier, duree);
  const credit = creditCents(prix);
  const frequence = palier ? FREQUENCE_SUIVI[palier] : undefined;

  return (
    <Carte>
      <Entete titre="Bienvenue dans NEO Continuité" sousTitre="Ton inscription est confirmée. Merci de ta confiance." />

      <div className="mt-6 rounded-2xl bg-neo/[.07] border border-neo/25 px-5 py-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-neo-700">Ton forfait</p>
        {palier && <p className="text-lg font-extrabold text-gray-900 mt-1">{NOMS_PALIERS[palier] ?? palier}</p>}
        {duree && <p className="text-sm font-semibold text-gray-600">{ENGAGEMENTS[duree] ?? duree}</p>}
      </div>
      <p className="flex gap-3 text-sm text-gray-700 leading-relaxed mt-4">
        <CalendarCheck className="w-5 h-5 text-neo shrink-0" aria-hidden="true" />
        <span>
          <PremierPaiement date={session.date_premier_paiement} />
        </span>
      </p>

      {frequence ? (
        <>
          <ProchaineEtape>
            Prends ton premier suivi en naturopathie dans les 7 prochains jours, directement dans l&apos;app NEO
            Performance (bouton Prendre rendez-vous).
          </ProchaineEtape>
          <BoutonsApp />
          <ListeInclus
            lignes={[
              `Un suivi de 30 minutes en naturopathie ${frequence}`,
              'Le chat en naturopathie',
              'Léo, 7 jours sur 7',
              texteCredit(credit),
            ]}
          />
        </>
      ) : (
        <>
          <ProchaineEtape>
            Ton accès est actif dans l&apos;app NEO Performance : Léo, les cours et la rencontre de groupe
            mensuelle.
          </ProchaineEtape>
          <BoutonsApp />
          <ul className="mt-8 space-y-3 text-gray-700 leading-relaxed">
            <li className="flex gap-3">
              <Check className="w-5 h-5 text-neo shrink-0 mt-0.5" aria-hidden="true" />
              <span>{texteCredit(credit)}.</span>
            </li>
            <li className="flex gap-3">
              <Check className="w-5 h-5 text-neo shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Un suivi additionnel de 30 minutes en naturopathie est possible en tout temps dans l&apos;app
                {prix?.suivi_additionnel_cents ? ` (${argent(prix.suivi_additionnel_cents)})` : ''}.
              </span>
            </li>
          </ul>
        </>
      )}

      <Contact />
    </Carte>
  );
}

function ALaCarte() {
  return (
    <Carte>
      <Entete titre="Ta rencontre est confirmée" sousTitre="Merci de ta confiance." />
      <ProchaineEtape>
        Ta rencontre est créditée à ton dossier. Réserve-la dans l&apos;app NEO Performance (bouton Prendre
        rendez-vous).
      </ProchaineEtape>
      <BoutonsApp />
      <Contact />
    </Carte>
  );
}

function Introuvable() {
  return (
    <Carte>
      <h1 className="text-2xl font-extrabold text-gray-900">Nous ne trouvons pas ta confirmation</h1>
      <p className="text-gray-700 mt-4 leading-relaxed">
        Si ton paiement a été accepté, ton accès est activé dans l&apos;app NEO Performance.
      </p>
      <BoutonsApp />
      <Contact />
    </Carte>
  );
}

const ContinuiteMerci: React.FC = () => {
  const params = useSearchParams();
  const sessionId = params.get('session_id')?.trim() || '';
  const [session, setSession] = useState<Session | null>(null);
  const [introuvable, setIntrouvable] = useState(!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    let actif = true;
    getSession(sessionId)
      .then((s) => actif && setSession(s))
      .catch(() => actif && setIntrouvable(true));
    return () => {
      actif = false;
    };
  }, [sessionId]);

  // Le contrat renvoie « ouverte » ou « expiree » ; les valeurs Stripe brutes sont acceptées par prudence.
  const nonTermine = session && ['ouverte', 'expiree', 'open', 'expired'].includes(session.statut);

  return (
    <div className="bg-neo/10 min-h-[80vh] pt-32 pb-16 px-4">
      <div className="container mx-auto max-w-xl">
        {introuvable ? (
          <Introuvable />
        ) : !session ? (
          <Chargement texte="Vérification de ton paiement…" />
        ) : nonTermine ? (
          <Carte>
            <div className="text-center">
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
            <Contact />
          </Carte>
        ) : session.type === 'a_la_carte' ? (
          <ALaCarte />
        ) : (
          <Abonnement session={session} />
        )}
      </div>
    </div>
  );
};

export default ContinuiteMerci;
