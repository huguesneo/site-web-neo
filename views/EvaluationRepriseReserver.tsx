'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, Loader2, MapPin, Video } from 'lucide-react';
import { getCreneaux, getSession, messageErreur, reserver, ErreurReprise } from '@/lib/evaluation-reprise/api';
import {
  ADRESSE_CLINIQUE,
  NOMS_MODES,
  TELEPHONE_CLINIQUE,
  TELEPHONE_LIEN,
  ajouterJours,
  aujourdhui,
  dateCourte,
  dateLongue,
  heureLisible,
  heureMontreal,
  prenomNaturo,
} from '@/lib/evaluation-reprise/contenu';
import type { Creneaux, ModeRdv, Rdv, Session } from '@/lib/evaluation-reprise/types';
import { Chargement, MessageErreur } from '@/components/continuite/Etats';
import Cadre from '@/components/evaluation-reprise/Cadre';

/*
  Retour de Stripe Checkout : la cliente choisit son mode (clinique ou en
  ligne) puis son moment dans l'agenda de sa naturo, en heure de Montréal.
  La session n'est jamais considérée payée côté site : l'endpoint fait foi.
*/

// Le contrat renvoie « ouverte » ou « expiree » ; les valeurs Stripe brutes sont acceptées par prudence.
const NON_PAYEE = ['ouverte', 'expiree', 'open', 'expired'];

const Telephone = () => (
  <a href={TELEPHONE_LIEN} className="font-bold text-[#007F78] underline underline-offset-2 whitespace-nowrap">
    {TELEPHONE_CLINIQUE}
  </a>
);

const EvaluationRepriseReserver: React.FC = () => {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('session_id')?.trim() || '';

  const [session, setSession] = useState<Session | null>(null);
  const [erreurSession, setErreurSession] = useState<string | null>(null);
  const [essaiSession, setEssaiSession] = useState(0);
  const [rdv, setRdv] = useState<Rdv | null>(null);

  const [mode, setMode] = useState<ModeRdv | null>(null);
  const [debut, setDebut] = useState<string>(() => aujourdhui());
  const [creneaux, setCreneaux] = useState<Creneaux | null>(null);
  const [chargementCreneaux, setChargementCreneaux] = useState(false);
  const [erreurCreneaux, setErreurCreneaux] = useState<string | null>(null);
  const [jour, setJour] = useState<string | null>(null);
  const [choix, setChoix] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [avis, setAvis] = useState<string | null>(null);
  const [naturo, setNaturo] = useState<string | null>(null);

  const zoneConfirmer = useRef<HTMLDivElement>(null);

  // Session : non payée → page 1 ; déjà réservée → confirmation.
  useEffect(() => {
    if (!sessionId) {
      router.replace('/evaluation-reprise');
      return;
    }
    let actif = true;
    setErreurSession(null);
    getSession(sessionId)
      .then((s) => {
        if (!actif) return;
        if (NON_PAYEE.includes(s.statut)) {
          router.replace('/evaluation-reprise');
          return;
        }
        setSession(s);
        setNaturo((n) => prenomNaturo(s.naturo) || s.rdv?.naturo_prenom || n);
        if (s.deja_reserve && s.rdv) setRdv(s.rdv);
      })
      .catch((e) => actif && setErreurSession(messageErreur(e)));
    return () => {
      actif = false;
    };
  }, [sessionId, router, essaiSession]);

  const chargerCreneaux = useCallback(
    async (m: ModeRdv, d: string) => {
      setChargementCreneaux(true);
      setErreurCreneaux(null);
      setChoix(null);
      try {
        const c = await getCreneaux(sessionId, m, d);
        setCreneaux(c);
        setNaturo((n) => prenomNaturo(c.naturo) || n);
        setJour((j) => (j && c.jours.some((x) => x.date === j) ? j : (c.jours[0]?.date ?? null)));
      } catch (e) {
        setCreneaux(null);
        setErreurCreneaux(messageErreur(e));
      } finally {
        setChargementCreneaux(false);
      }
    },
    [sessionId],
  );

  const choisirMode = (m: ModeRdv) => {
    if (m === mode) return;
    setMode(m);
    setAvis(null);
    setJour(null);
    chargerCreneaux(m, debut);
  };

  const changerSemaine = (n: number) => {
    if (!mode) return;
    const d = ajouterJours(debut, n);
    setDebut(d);
    setAvis(null);
    setJour(null);
    chargerCreneaux(mode, d);
  };

  const choisirCreneau = (iso: string) => {
    setChoix(iso);
    setAvis(null);
    // Sur téléphone, le bouton de confirmation peut être sous la ligne de flottaison.
    requestAnimationFrame(() => zoneConfirmer.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  const confirmer = async () => {
    if (!mode || !choix) return;
    setEnvoi(true);
    setAvis(null);
    try {
      setRdv(await reserver({ session_id: sessionId, mode, start_time: choix }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      const code = e instanceof ErreurReprise ? e.code : '';
      if (code === 'deja_reserve') {
        // Réservée entre-temps (autre onglet, double clic) : on affiche la confirmation.
        setSession(null);
        setEssaiSession((n) => n + 1);
      } else if (code === 'creneau_indisponible') {
        setAvis(messageErreur(e));
        await chargerCreneaux(mode, debut);
      } else {
        setAvis(messageErreur(e));
      }
    } finally {
      setEnvoi(false);
    }
  };

  if (erreurSession) {
    return (
      <Cadre>
        <div className="max-w-[560px] mx-auto px-4 py-12 flex flex-col gap-5">
          <h1 className="m-0 text-2xl font-extrabold">Nous ne trouvons pas ton paiement</h1>
          <MessageErreur message={erreurSession} onReessayer={() => setEssaiSession((n) => n + 1)} />
          <p className="m-0 text-[15px] leading-relaxed text-[#4A5455]">
            Si ton paiement a été accepté, ta place est réservée. Appelle-nous au <Telephone /> et on choisit ton
            moment ensemble.
          </p>
        </div>
      </Cadre>
    );
  }

  if (!session) {
    return (
      <Cadre>
        <Chargement texte="Vérification de ton paiement…" />
      </Cadre>
    );
  }

  if (session.statut === 'remboursee') {
    return (
      <Cadre>
        <div className="max-w-[560px] mx-auto px-4 py-12 flex flex-col gap-4 text-center">
          <h1 className="m-0 text-2xl font-extrabold">Ce paiement a été remboursé</h1>
          <p className="m-0 text-[15px] leading-relaxed text-[#4A5455]">
            Il n’est donc plus possible de réserver avec ce lien. Pour toute question, appelle-nous au <Telephone />.
          </p>
        </div>
      </Cadre>
    );
  }

  if (rdv || session.deja_reserve) {
    return (
      <Cadre>
        <Confirmation rdv={rdv} />
      </Cadre>
    );
  }

  const prenom = session.prenom?.trim();
  const jours = creneaux?.jours ?? [];
  const jourChoisi = jours.find((j) => j.date === jour);
  const peutReculer = debut > aujourdhui();

  return (
    <Cadre>
      <section className="bg-[#EBF8F7] px-5 pt-9 pb-8 sm:pt-14 sm:pb-12">
        <div className="max-w-[720px] mx-auto text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="w-11 h-11 text-[#007F78]" aria-hidden="true" />
          <h1 className="m-0 text-[clamp(26px,4.4vw,40px)] leading-[1.15] font-extrabold tracking-[-0.01em]">
            {prenom ? `Merci ${prenom}, ton évaluation est payée.` : 'Merci, ton évaluation est payée.'}
          </h1>
          <p className="m-0 text-[17px] sm:text-lg leading-relaxed text-[#4A5455]">
            Choisis maintenant ton moment avec {naturo ? <strong className="text-[#1A1A1A]">{naturo}</strong> : 'ta naturopathe'}.
          </p>
        </div>
      </section>

      <div className="max-w-[720px] mx-auto px-4 sm:px-5 py-8 sm:py-12 flex flex-col gap-8">
        {/* Mode */}
        <fieldset className="m-0 p-0 border-0 flex flex-col gap-3">
          <legend className="mb-3 p-0 text-lg font-extrabold">1. Où veux-tu faire ta rencontre?</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['clinique', 'en_ligne'] as ModeRdv[]).map((m) => {
              const Icone = m === 'clinique' ? Building2 : Video;
              const actif = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => choisirMode(m)}
                  className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left min-h-[96px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007F78] ${
                    actif ? 'border-[#007F78] bg-[#EBF8F7]' : 'border-[#E3E8E8] bg-white hover:border-[#9FDCD8]'
                  }`}
                >
                  <Icone className={`w-6 h-6 ${actif ? 'text-[#007F78]' : 'text-[#4A5455]'}`} aria-hidden="true" />
                  <span className="text-[15px] sm:text-base font-bold leading-snug">{NOMS_MODES[m]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Calendrier */}
        {mode && (
          <section className="flex flex-col gap-4" aria-labelledby="titre-moment">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titre-moment" className="m-0 text-lg font-extrabold">
                2. Choisis ton moment
              </h2>
              <span className="text-[13px] text-[#4A5455]">Heure de Montréal</span>
            </div>

            <div aria-live="polite">{avis && <MessageErreur message={avis} />}</div>

            {chargementCreneaux ? (
              <Chargement texte="Recherche des plages libres…" />
            ) : erreurCreneaux ? (
              <MessageErreur message={erreurCreneaux} onReessayer={() => chargerCreneaux(mode, debut)} />
            ) : jours.length === 0 ? (
              <div className="rounded-2xl bg-[#F6F8F8] border border-[#E3E8E8] px-5 py-5 text-[15px] leading-relaxed">
                Aucune plage n’est libre ces deux semaines. Appelle-nous au <Telephone /> et on te trouve un moment.
              </div>
            ) : (
              <>
                {/* Jours : défilement horizontal sur téléphone */}
                <div
                  role="radiogroup"
                  aria-label="Jours disponibles"
                  className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap"
                >
                  {jours.map((j) => {
                    const c = dateCourte(j.date);
                    const actif = j.date === jour;
                    return (
                      <button
                        key={j.date}
                        type="button"
                        role="radio"
                        aria-checked={actif}
                        aria-label={dateLongue(j.date)}
                        onClick={() => {
                          setJour(j.date);
                          setChoix(null);
                        }}
                        className={`snap-start shrink-0 w-[68px] rounded-2xl border-2 py-2.5 flex flex-col items-center leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007F78] ${
                          actif ? 'border-[#007F78] bg-[#007F78] text-white' : 'border-[#E3E8E8] bg-white hover:border-[#9FDCD8]'
                        }`}
                      >
                        <span className={`text-xs font-semibold ${actif ? 'text-white/85' : 'text-[#4A5455]'}`}>{c.jour}</span>
                        <span className="text-xl font-extrabold">{c.numero}</span>
                        <span className={`text-xs ${actif ? 'text-white/85' : 'text-[#4A5455]'}`}>{c.mois}</span>
                      </button>
                    );
                  })}
                </div>

                {jourChoisi && (
                  <div className="flex flex-col gap-3">
                    <p className="m-0 text-[15px] font-bold first-letter:uppercase">{dateLongue(jourChoisi.date)}</p>
                    <div role="radiogroup" aria-label="Heures disponibles" className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {jourChoisi.creneaux.map((iso) => {
                        const actif = iso === choix;
                        return (
                          <button
                            key={iso}
                            type="button"
                            role="radio"
                            aria-checked={actif}
                            onClick={() => choisirCreneau(iso)}
                            className={`min-h-12 rounded-xl border-2 text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007F78] ${
                              actif ? 'border-[#007F78] bg-[#007F78] text-white' : 'border-[#E3E8E8] bg-white hover:border-[#9FDCD8]'
                            }`}
                          >
                            {heureLisible(heureMontreal(iso))}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {!chargementCreneaux && !erreurCreneaux && (
              <div className="flex justify-between gap-3 pt-1">
                {peutReculer ? (
                  <button
                    type="button"
                    onClick={() => changerSemaine(-7)}
                    className="inline-flex items-center gap-1 min-h-11 px-2 text-[15px] font-bold text-[#007F78]"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    Semaine précédente
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => changerSemaine(7)}
                  className="inline-flex items-center gap-1 min-h-11 px-2 text-[15px] font-bold text-[#007F78]"
                >
                  Semaine suivante
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <div ref={zoneConfirmer} className="scroll-mb-6">
              {choix && (
                <button
                  type="button"
                  onClick={confirmer}
                  disabled={envoi}
                  className="mt-2 flex items-center justify-center gap-2 w-full min-h-14 rounded-full border-2 border-[#007F78] bg-[#007F78] text-white text-[17px] font-bold hover:bg-[#00615C] hover:border-[#00615C] disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007F78]"
                >
                  {envoi && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                  {envoi
                    ? 'Réservation en cours…'
                    : `Confirmer ${dateLongue(jour ?? '')} à ${heureLisible(heureMontreal(choix))}`}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </Cadre>
  );
};

function Confirmation({ rdv }: { rdv: Rdv | null }) {
  return (
    <div className="max-w-[560px] mx-auto px-4 py-10 sm:py-16">
      <div className="text-center flex flex-col items-center gap-3">
        <CalendarCheck className="w-12 h-12 text-[#007F78]" aria-hidden="true" />
        <h1 className="m-0 text-[clamp(26px,4.4vw,36px)] leading-[1.15] font-extrabold">Ton évaluation est réservée</h1>
      </div>

      {rdv ? (
        <dl className="mt-7 mb-0 rounded-3xl border border-[#E3E8E8] bg-white divide-y divide-[#EEF2F2]">
          <Ligne titre="Date">
            <span className="first-letter:uppercase inline-block">{dateLongue(rdv.date)}</span>
          </Ligne>
          <Ligne titre="Heure">{heureLisible(rdv.heure)}</Ligne>
          <Ligne titre="Mode">{NOMS_MODES[rdv.mode] ?? rdv.mode}</Ligne>
          {rdv.naturo_prenom && <Ligne titre="Avec">{rdv.naturo_prenom}, ta naturopathe</Ligne>}
          <Ligne titre={rdv.mode === 'clinique' ? 'Adresse' : 'Lien'}>
            {rdv.mode === 'clinique' ? (
              <span className="inline-flex gap-1.5">
                <MapPin className="w-4 h-4 mt-1 shrink-0 text-[#007F78]" aria-hidden="true" />
                {rdv.adresse || ADRESSE_CLINIQUE}
              </span>
            ) : (
              'Le lien vidéo te sera envoyé par courriel.'
            )}
          </Ligne>
        </dl>
      ) : null}

      <p className="mt-6 mb-0 text-center text-[15px] leading-relaxed text-[#4A5455]">
        Tu vas recevoir une confirmation par courriel. Pour changer ton moment, appelle-nous au <Telephone />.
      </p>
    </div>
  );
}

function Ligne({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-5 py-4">
      <dt className="w-[76px] shrink-0 text-sm font-semibold text-[#4A5455] pt-0.5">{titre}</dt>
      <dd className="m-0 text-base font-bold leading-snug">{children}</dd>
    </div>
  );
}

export default EvaluationRepriseReserver;
