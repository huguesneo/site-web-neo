'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Link2Off, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import { apercuNaturo, checkoutNaturo, ErreurContinuite } from '@/lib/continuite/api';
import { DETAILS_DUREES, NOMS_PALIERS, PALIER_RECOMMANDE, argent } from '@/lib/continuite/contenu';
import { lireUtm } from '@/lib/continuite/utm';
import type { ApercuNaturo, Coordonnees, Duree, Palier } from '@/lib/continuite/types';
import { LOGO_URL } from '@/constants';
import SelecteurDuree from '@/components/continuite/SelecteurDuree';
import CartesPaliers from '@/components/continuite/CartesPaliers';
import Conditions from '@/components/continuite/Conditions';
import ChampsCoordonnees, {
  focusPremiereErreur,
  valider,
  type ErreursChamps,
} from '@/components/continuite/ChampsCoordonnees';
import CheckoutIntegre from '@/components/continuite/CheckoutIntegre';
import { BandeauSimulation, Chargement, MessageErreur } from '@/components/continuite/Etats';
import { useOffre } from '@/components/continuite/useOffre';

/*
  Page ouverte depuis l'app NEO par une naturopathe pendant un suivi, puis
  montrée à la cliente à l'écran (tablette ou ordinateur). Plein écran, sans
  menu ni chatbot (voir SiteChrome). La cliente entre sa carte elle-même.

  Lien attendu :
    /continuite/naturo?t=<jeton>&utm_source=app_neo&utm_medium=naturo
      &utm_campaign=continuite&utm_content=<prénom de la naturo>

  Dès l'ouverture, le mode aperçu de continuite-checkout-naturo valide le
  jeton et indique si le lien porte une cliente :
    - avec cliente : son nom est affiché, rien à saisir (l'app lit son dossier) ;
    - lien générique : prénom, nom et courriel sont demandés.
*/

const VIDE: Coordonnees = { prenom: '', nom: '', courriel: '', telephone: '' };
const REQUIS_GENERIQUE: (keyof Coordonnees)[] = ['prenom', 'nom', 'courriel'];

function LienExpire() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 rounded-full bg-neo/10 flex items-center justify-center mb-5">
        <Link2Off className="w-7 h-7 text-neo-700" aria-hidden="true" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Lien expiré, rouvre-le depuis l&apos;app NEO</h1>
      <p className="text-gray-600 mt-3 max-w-md">
        Pour des raisons de sécurité, ce lien n&apos;est valide que pour une courte durée. Génère un nouveau lien
        à partir du dossier de la cliente dans l&apos;app NEO.
      </p>
    </div>
  );
}

const estErreurJeton = (e: unknown) =>
  e instanceof ErreurContinuite && (e.code === 'jeton_invalide' || e.code === 'jeton_expire');

const ContinuiteNaturo: React.FC = () => {
  const params = useSearchParams();
  const jeton = params.get('t')?.trim() || '';
  const { grille, rabais, erreur: erreurOffre, reessayer } = useOffre();

  const [apercu, setApercu] = useState<ApercuNaturo | null>(null);
  const [erreurApercu, setErreurApercu] = useState<string | null>(null);
  const [expire, setExpire] = useState(!jeton);

  const [duree, setDuree] = useState<Duree>('6_mois');
  const [palier, setPalier] = useState<Palier>(PALIER_RECOMMANDE);
  const [coord, setCoord] = useState<Coordonnees>(VIDE);
  const [erreursChamps, setErreursChamps] = useState<ErreursChamps>({});
  const [consent, setConsent] = useState(false);
  const [erreurConsent, setErreurConsent] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const sectionPaiement = useRef<HTMLDivElement>(null);

  const verifierLien = useCallback(() => {
    if (!jeton) return;
    setErreurApercu(null);
    apercuNaturo(jeton)
      .then(setApercu)
      .catch((e) => {
        if (estErreurJeton(e)) setExpire(true);
        else setErreurApercu(e instanceof ErreurContinuite ? e.message : 'Impossible de vérifier ce lien.');
      });
  }, [jeton]);

  useEffect(verifierLien, [verifierLien]);

  const cliente = apercu?.cliente ?? null;
  const prix = grille?.[palier]?.[duree];

  const changerDuree = (d: Duree) => {
    setDuree(d);
    setClientSecret(null);
  };
  const choisir = (p: Palier) => {
    setPalier(p);
    setClientSecret(null);
    sectionPaiement.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    // Avec une cliente portée par le jeton, l'app lit ses coordonnées dans son dossier.
    const errs = cliente ? {} : valider(coord, REQUIS_GENERIQUE);
    setErreursChamps(errs);
    setErreurConsent(!consent);
    if (Object.keys(errs).length || !consent || !prix) {
      focusPremiereErreur(errs);
      return;
    }

    const remplis = cliente
      ? {}
      : (Object.fromEntries(
          Object.entries(coord)
            .map(([k, v]) => [k, v.trim()])
            .filter(([, v]) => v),
        ) as Partial<Coordonnees>);

    setEnvoi(true);
    try {
      const { client_secret } = await checkoutNaturo({
        jeton,
        price_id: prix.price_id,
        ...remplis,
        utm: lireUtm(params),
      });
      setClientSecret(client_secret);
      requestAnimationFrame(() =>
        sectionPaiement.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    } catch (err) {
      // Le jeton peut expirer pendant que la page est ouverte (durée de vie de 2 h).
      if (estErreurJeton(err)) {
        setExpire(true);
        window.scrollTo({ top: 0 });
        return;
      }
      setErreur(err instanceof ErreurContinuite ? err.message : 'Un problème est survenu. Réessaie dans un instant.');
    } finally {
      setEnvoi(false);
    }
  };

  let contenu: React.ReactNode;
  if (expire) {
    contenu = <LienExpire />;
  } else if (erreurApercu) {
    contenu = (
      <div className="container mx-auto max-w-xl px-4 py-16">
        <MessageErreur message={erreurApercu} onReessayer={verifierLien} />
      </div>
    );
  } else if (!apercu) {
    contenu = <Chargement texte="Vérification du lien…" />;
  } else {
    contenu = (
      <main className="container mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="text-center pt-8 sm:pt-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            {cliente ? `${cliente.prenom}, choisis ton forfait` : 'Choisis ton forfait'}
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            {apercu.naturo_prenom
              ? `Proposé par ${apercu.naturo_prenom}, ta naturopathe. Ce qui fonctionne reste en place après ton programme.`
              : 'Ce qui fonctionne reste en place après ton programme.'}
          </p>
        </div>

        {erreurOffre ? (
          <div className="mt-10">
            <MessageErreur message={erreurOffre} onReessayer={reessayer} />
          </div>
        ) : !grille ? (
          <Chargement />
        ) : (
          <>
            <section aria-label="Durée et forfaits" className="mt-8">
              <SelecteurDuree valeur={duree} onChange={changerDuree} rabais={rabais} />
              <div className="mt-10">
                <CartesPaliers grille={grille} duree={duree} selection={palier} onChoisir={choisir} />
              </div>
              <Conditions className="mt-8" />
            </section>

            {prix && (
              <section
                ref={sectionPaiement}
                aria-labelledby="titre-paiement"
                className="mt-12 max-w-2xl mx-auto scroll-mt-6"
              >
                <h2 id="titre-paiement" className="text-2xl font-extrabold text-gray-900 mb-4">
                  Ton forfait
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neo/[.07] border border-neo/25 px-5 py-4 mb-6">
                  <p className="text-gray-800 text-lg">
                    <strong className="font-extrabold">{NOMS_PALIERS[palier]}</strong>
                    <span className="text-gray-600"> · {DETAILS_DUREES[duree]}</span>
                    <br />
                    <span className="text-base text-gray-600">
                      {argent(prix.montant_mensuel_cents)} par mois, + taxes
                    </span>
                  </p>
                  {clientSecret && (
                    <button
                      type="button"
                      onClick={() => setClientSecret(null)}
                      className="text-base font-bold text-neo-700 hover:text-neo-600 underline underline-offset-2 py-2"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                {clientSecret ? (
                  <CheckoutIntegre clientSecret={clientSecret} />
                ) : (
                  <form onSubmit={soumettre} noValidate className="space-y-5">
                    {cliente ? (
                      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                        <UserRound className="w-6 h-6 text-neo shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {cliente.prenom} {cliente.nom}
                          </p>
                          <p className="text-sm text-gray-600">
                            {cliente.courriel} · coordonnées de ton dossier NEO
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-bold text-gray-900">Tes coordonnées</h3>
                        <ChampsCoordonnees
                          valeurs={coord}
                          erreurs={erreursChamps}
                          requis={REQUIS_GENERIQUE}
                          grand
                          onChange={(cle, v) => setCoord((c) => ({ ...c, [cle]: v }))}
                        />
                      </>
                    )}

                    <div>
                      <label className="flex items-start gap-3.5 cursor-pointer py-1">
                        <input
                          id="consent"
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => {
                            setConsent(e.target.checked);
                            if (e.target.checked) setErreurConsent(false);
                          }}
                          aria-invalid={erreurConsent}
                          aria-describedby={erreurConsent ? 'consent-erreur' : undefined}
                          className="w-7 h-7 min-w-7 mt-0.5 accent-neo cursor-pointer"
                        />
                        <span className="text-base leading-relaxed text-gray-700">
                          J&apos;ai lu les conditions. Je comprends que mon forfait se renouvelle automatiquement
                          chaque mois et que, avec un engagement, il ne peut pas être annulé avant la fin de
                          l&apos;engagement.
                        </span>
                      </label>
                      {erreurConsent && (
                        <p id="consent-erreur" className="text-sm text-red-600 mt-1 ml-[42px]">
                          Coche cette case pour continuer.
                        </p>
                      )}
                    </div>

                    <div aria-live="polite">{erreur && <MessageErreur message={erreur} />}</div>

                    <button
                      type="submit"
                      disabled={envoi}
                      className="w-full inline-flex items-center justify-center gap-2 px-8 py-5 text-lg font-semibold rounded-full bg-neo text-white hover:bg-neo-600 transition-colors disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neo"
                    >
                      {envoi && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                      {envoi ? 'Préparation du paiement…' : 'Passer au paiement'}
                    </button>
                    <p className="text-[13px] text-gray-500 flex items-center justify-center gap-2">
                      <ShieldCheck className="w-[15px] h-[15px] text-neo" strokeWidth={2.2} aria-hidden="true" />
                      Paiement sécurisé par Stripe. Ta carte n&apos;est jamais conservée par NEO.
                    </p>
                  </form>
                )}
              </section>
            )}
          </>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <BandeauSimulation />
      <header className="border-b border-gray-100">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center gap-3">
          <Image src={LOGO_URL} alt="NEO Performance" width={40} height={40} className="h-10 w-auto object-contain" />
          <span className="text-sm font-extrabold tracking-wider uppercase text-neo-700">NEO Continuité</span>
        </div>
      </header>
      {contenu}
    </div>
  );
};

export default ContinuiteNaturo;
