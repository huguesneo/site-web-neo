'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { CalendarCheck, Check, Link2Off, Loader2, ShieldCheck } from 'lucide-react';
import { apercuNaturo, checkoutNaturo, ErreurContinuite } from '@/lib/continuite/api';
import {
  DETAILS_DUREES,
  INCLUS_COURT,
  NOMS_DUREES,
  NOMS_PALIERS,
  ORDRE_DUREES,
  ORDRE_PALIERS,
  PALIER_RECOMMANDE,
  argent,
  dateLongue,
} from '@/lib/continuite/contenu';
import { economie } from '@/lib/continuite/offre';
import { lireUtm } from '@/lib/continuite/utm';
import type { ApercuNaturo, Coordonnees, Duree, Palier } from '@/lib/continuite/types';
import { LOGO_URL } from '@/constants';
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
  Vente en face à face : page ouverte depuis l'app NEO par une naturopathe
  pendant un suivi, puis montrée à la cliente sur tablette ou ordinateur.
  Plein écran, sans menu ni chatbot (voir SiteChrome).

  Le moins de choix possible pour la cliente :
    1. La naturo choisit UN forfait dans la petite barre du haut ; seul ce
       forfait est affiché, en grand. La durée (6 mois par défaut) met le
       prix à jour en temps réel.
    2. « Forfait choisi » ouvre les coordonnées (verrouillées si le lien
       porte une cliente), les conditions et le consentement.
    3. Checkout Stripe intégré : la cliente entre sa carte elle-même.

  Lien attendu :
    /continuite/naturo?t=<jeton>&utm_source=app_neo&utm_medium=naturo
      &utm_campaign=continuite&utm_content=<prénom de la naturo>

  Dès l'ouverture, le mode aperçu de continuite-checkout-naturo valide le
  jeton et renvoie la cliente éventuelle et la date du premier paiement.
*/

type Etape = 'forfait' | 'coordonnees' | 'paiement';

const VIDE: Coordonnees = { prenom: '', nom: '', courriel: '', telephone: '' };
const REQUIS_GENERIQUE: (keyof Coordonnees)[] = ['prenom', 'nom', 'courriel'];
// L'aperçu ne fournit pas le téléphone de la cliente : l'app le lit dans son dossier.
const CHAMPS_CLIENTE: (keyof Coordonnees)[] = ['prenom', 'nom', 'courriel'];

function LienExpire() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-full bg-neo/10 flex items-center justify-center mb-5">
        <Link2Off className="w-8 h-8 text-neo-700" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900">Lien expiré, rouvre-le depuis l&apos;app NEO</h1>
      <p className="text-lg text-gray-600 mt-3 max-w-md">
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
  const { grille, erreur: erreurOffre, reessayer } = useOffre();

  const [apercu, setApercu] = useState<ApercuNaturo | null>(null);
  const [erreurApercu, setErreurApercu] = useState<string | null>(null);
  const [expire, setExpire] = useState(!jeton);

  const [etape, setEtape] = useState<Etape>('forfait');
  const [palier, setPalier] = useState<Palier>(PALIER_RECOMMANDE);
  const [duree, setDuree] = useState<Duree>('6_mois');
  const [coord, setCoord] = useState<Coordonnees>(VIDE);
  const [erreursChamps, setErreursChamps] = useState<ErreursChamps>({});
  const [consent, setConsent] = useState(false);
  const [erreurConsent, setErreurConsent] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const verifierLien = useCallback(() => {
    if (!jeton) return;
    setErreurApercu(null);
    apercuNaturo(jeton)
      .then((a) => {
        setApercu(a);
        if (a.cliente) setCoord({ ...VIDE, ...a.cliente });
      })
      .catch((e) => {
        if (estErreurJeton(e)) setExpire(true);
        else setErreurApercu(e instanceof ErreurContinuite ? e.message : 'Impossible de vérifier ce lien.');
      });
  }, [jeton]);

  useEffect(verifierLien, [verifierLien]);

  const cliente = apercu?.cliente ?? null;
  const prix = grille?.[palier]?.[duree];
  const eco = grille ? economie(grille, palier, duree) : null;
  const datePremierPaiement = apercu?.date_premier_paiement || null;

  const allerA = (e: Etape) => {
    setEtape(e);
    setErreur(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      allerA('paiement');
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

  // Rappel du forfait choisi, en tête des étapes 2 et 3.
  const recap = prix && (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neo/[.07] border border-neo/25 px-6 py-5 mb-8">
      <p className="text-gray-800 text-xl">
        <strong className="font-extrabold">{NOMS_PALIERS[palier]}</strong>
        <span className="text-gray-600"> · {DETAILS_DUREES[duree]}</span>
        <br />
        <span className="text-lg text-gray-600">{argent(prix.montant_mensuel_cents)} par mois, + taxes</span>
      </p>
      <button
        type="button"
        onClick={() => {
          setClientSecret(null);
          allerA('forfait');
        }}
        className="text-lg font-bold text-neo-700 hover:text-neo-600 underline underline-offset-4 px-2 py-3"
      >
        Modifier
      </button>
    </div>
  );

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
  } else if (erreurOffre) {
    contenu = (
      <div className="container mx-auto max-w-xl px-4 py-16">
        <MessageErreur message={erreurOffre} onReessayer={reessayer} />
      </div>
    );
  } else if (!grille) {
    contenu = <Chargement />;
  } else if (etape === 'forfait') {
    contenu = (
      <main className="mx-auto max-w-2xl px-5 sm:px-8 pt-6 pb-8 text-center">
        <p className="text-lg text-gray-500">
          {cliente ? `${cliente.prenom}, voici le forfait proposé` : 'Le forfait proposé'}
          {apercu.naturo_prenom ? ` par ${apercu.naturo_prenom}` : ''}
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-1">{NOMS_PALIERS[palier]}</h1>

        {/* Durée */}
        <fieldset className="mt-6">
          <legend className="sr-only">Durée de l&apos;abonnement</legend>
          <div className="grid grid-cols-3 gap-3">
            {ORDRE_DUREES.map((d) => {
              const actif = d === duree;
              return (
                <label
                  key={d}
                  className={`cursor-pointer rounded-2xl border-2 px-2 py-4 transition-all focus-within:ring-2 focus-within:ring-neo focus-within:ring-offset-2 ${
                    actif ? 'border-neo bg-neo/[.07]' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="duree"
                    value={d}
                    checked={actif}
                    onChange={() => setDuree(d)}
                    className="sr-only"
                  />
                  <span className={`block text-xl font-extrabold ${actif ? 'text-gray-900' : 'text-gray-700'}`}>
                    {NOMS_DUREES[d]}
                  </span>
                  <span className="block text-sm text-gray-500 mt-0.5">{DETAILS_DUREES[d]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Prix en temps réel */}
        {prix ? (
          <>
            <div className="mt-7 flex items-end justify-center gap-2" aria-live="polite">
              <motion.span
                key={prix.montant_mensuel_cents}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="text-7xl sm:text-8xl font-extrabold tracking-tight leading-none text-gray-900"
              >
                {argent(prix.montant_mensuel_cents)}
              </motion.span>
              <span className="text-xl font-semibold text-gray-500 pb-2">par mois, + taxes</span>
            </div>
            <div className="h-9 mt-3 flex items-center justify-center">
              {eco ? (
                <motion.span
                  key={`eco-${palier}-${duree}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-block rounded-full bg-neo text-white text-lg font-bold px-5 py-1.5"
                >
                  Tu économises {argent(eco.parAnnee)} par année
                </motion.span>
              ) : (
                <span className="text-lg text-gray-500">Sans engagement, mois par mois</span>
              )}
            </div>
          </>
        ) : (
          <p className="mt-8 text-lg text-gray-500">Ce forfait n&apos;est pas disponible pour cette durée.</p>
        )}

        {/* Inclus */}
        <ul className="mt-6 space-y-3 text-left text-lg text-gray-800 max-w-xl mx-auto">
          {INCLUS_COURT[palier].map((item) => (
            <li key={item} className="flex gap-3">
              <Check className="w-6 h-6 mt-0.5 shrink-0 text-neo" strokeWidth={3} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {datePremierPaiement && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 text-left max-w-xl mx-auto">
            <CalendarCheck className="w-6 h-6 text-neo shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-lg text-gray-800">
              Tu gardes ton accès dès aujourd&apos;hui. Premier paiement le{' '}
              <strong className="font-bold">{dateLongue(datePremierPaiement)}</strong>.
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={!prix}
          onClick={() => allerA('coordonnees')}
          className="mt-7 w-full inline-flex items-center justify-center px-8 py-6 text-2xl font-bold rounded-full bg-neo text-white shadow-[0_10px_15px_-3px_rgba(0,187,177,0.25)] hover:bg-neo-600 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neo"
        >
          Forfait choisi
        </button>
      </main>
    );
  } else if (etape === 'coordonnees') {
    contenu = (
      <main className="mx-auto max-w-2xl px-5 sm:px-8 pt-8 pb-12">
        {recap}
        <form onSubmit={soumettre} noValidate className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Tes coordonnées</h2>
            {cliente && <p className="text-gray-500 mt-1">Elles viennent de ton dossier NEO.</p>}
          </div>
          <ChampsCoordonnees
            valeurs={coord}
            erreurs={erreursChamps}
            requis={cliente ? [] : REQUIS_GENERIQUE}
            champs={cliente ? CHAMPS_CLIENTE : undefined}
            lectureSeule={!!cliente}
            grand
            onChange={(cle, v) => setCoord((c) => ({ ...c, [cle]: v }))}
          />

          <Conditions />

          <div>
            <label className="flex items-start gap-4 cursor-pointer py-1">
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
                className="w-8 h-8 min-w-8 mt-0.5 accent-neo cursor-pointer"
              />
              <span className="text-lg leading-relaxed text-gray-700">
                J&apos;ai lu les conditions. Je comprends que mon forfait se renouvelle automatiquement chaque mois
                et que, avec un engagement, il ne peut pas être annulé avant la fin de l&apos;engagement.
              </span>
            </label>
            {erreurConsent && (
              <p id="consent-erreur" className="text-base text-red-600 mt-1 ml-12">
                Coche cette case pour continuer.
              </p>
            )}
          </div>

          <div aria-live="polite">{erreur && <MessageErreur message={erreur} />}</div>

          <button
            type="submit"
            disabled={envoi}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-6 text-2xl font-bold rounded-full bg-neo text-white hover:bg-neo-600 transition-colors disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neo"
          >
            {envoi && <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />}
            {envoi ? 'Préparation du paiement…' : 'Passer au paiement'}
          </button>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neo" strokeWidth={2.2} aria-hidden="true" />
            Paiement sécurisé par Stripe. Ta carte n&apos;est jamais conservée par NEO.
          </p>
        </form>
      </main>
    );
  } else {
    contenu = (
      <main className="mx-auto max-w-2xl px-5 sm:px-8 pt-8 pb-12">
        {recap}
        {clientSecret && <CheckoutIntegre clientSecret={clientSecret} />}
      </main>
    );
  }

  // La barre des forfaits n'est utile qu'à la naturo, à la première étape.
  const barrePaliers = !expire && apercu && grille && etape === 'forfait' && (
    <div role="group" aria-label="Forfait proposé" className="inline-flex bg-gray-100 rounded-full p-1">
      {ORDRE_PALIERS.filter((p) => grille[p]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPalier(p)}
          aria-pressed={p === palier}
          className={`px-3.5 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            p === palier ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {p === 'continuite' ? 'Continuité' : p === 'continuite_plus' ? 'Continuité+' : 'Extra'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <BandeauSimulation />
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="NEO Performance" width={36} height={36} className="h-9 w-auto object-contain" />
            <span className="text-sm font-extrabold tracking-wider uppercase text-neo-700">NEO Continuité</span>
          </div>
          {barrePaliers}
        </div>
      </header>
      {contenu}
    </div>
  );
};

export default ContinuiteNaturo;
