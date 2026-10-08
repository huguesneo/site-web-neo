'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Check, Copy, Link2Off } from 'lucide-react';
import { apercuNaturo, ErreurContinuite } from '@/lib/continuite/api';
import {
  DUREE_PAR_DEFAUT,
  CARTE_ACTIVE,
  NOMS_PALIERS,
  ORDRE_DUREES,
  ORDRE_PALIERS,
  PALIER_RECOMMANDE,
} from '@/lib/continuite/contenu';
import { lireUtm } from '@/lib/continuite/utm';
import type { ApercuNaturo, Duree, Palier } from '@/lib/continuite/types';
import { LOGO_URL } from '@/constants';
import SelecteurDuree from '@/components/continuite/SelecteurDuree';
import CarteForfait from '@/components/continuite/CarteForfait';
import BlocCarte from '@/components/continuite/BlocCarte';
import SiLaVieChange from '@/components/continuite/SiLaVieChange';
import SectionPaiement from '@/components/continuite/SectionPaiement';
import { BandeauSimulation, Chargement, MessageErreur } from '@/components/continuite/Etats';
import { useOffre } from '@/components/continuite/useOffre';

/*
  Vente en face à face, d'après la maquette « Tablette » : page ouverte depuis
  l'app NEO par une naturopathe pendant un suivi, puis montrée à la cliente
  sur tablette ou ordinateur. Plein écran, sans menu ni chatbot (SiteChrome).

  - La naturo choisit le forfait mis en avant (« Changer de forfait », en
    haut à droite). Les deux autres restent repliés sous « Voir les deux
    autres options ».
  - Le mode aperçu de continuite-checkout-naturo valide le jeton dès
    l'ouverture et fournit la cliente éventuelle et, si elle est en
    programme, la date de la semaine 15.

  Lien attendu :
    /continuite/naturo?t=<jeton>&utm_source=app_neo&utm_medium=naturo
      &utm_campaign=continuite&utm_content=<prénom de la naturo>
  Le jeton est valide 7 jours, pour un seul achat.

  « Copier le lien pour la cliente » ajoute palier=… et duree=… à l'URL. À
  l'ouverture, s'ils existent dans continuite-offre, ils fixent seulement le
  forfait et la durée mis en avant. Rien d'autre ne les lit : le prix reste
  validé par l'app au paiement.
*/

function LienExpire() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-5">
        <Link2Off className="w-8 h-8 text-[#007F78]" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-extrabold">Lien expiré, rouvre-le depuis l’app NEO</h1>
      <p className="text-lg text-[#4A5455] mt-3 max-w-md">
        Un lien est valide 7 jours, pour un seul achat. Génère un nouveau lien à partir du dossier de la cliente
        dans l’app NEO.
      </p>
    </div>
  );
}

function titre(apercu: ApercuNaturo): string {
  const cliente = apercu.cliente?.prenom?.trim();
  const naturo = apercu.naturo_prenom?.trim();
  if (cliente && naturo) return `${cliente}, voici la suite que ${naturo} te recommande.`;
  if (cliente) return `${cliente}, voici la suite recommandée pour toi.`;
  if (naturo) return `Voici la suite que ${naturo} te recommande.`;
  return 'Voici la suite recommandée après ton programme.';
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

  // Forfait recommandé par la naturo, et forfait affiché en grand (peut différer
  // si la cliente choisit une des deux autres options).
  const [palierNaturo, setPalierNaturo] = useState<Palier>(PALIER_RECOMMANDE);
  const [palier, setPalier] = useState<Palier>(PALIER_RECOMMANDE);
  const [duree, setDuree] = useState<Duree>(DUREE_PAR_DEFAUT);
  const [autresOuverts, setAutresOuverts] = useState(false);
  const [choixOuvert, setChoixOuvert] = useState(false);
  const [mode, setMode] = useState<'abonnement' | 'carte'>('abonnement');
  const [lienCopie, setLienCopie] = useState<'ok' | 'erreur' | null>(null);
  const preselectionFaite = useRef(false);
  const sectionPaiement = useRef<HTMLElement>(null);

  // Présélection d'affichage depuis l'URL (palier, duree), une seule fois, si l'offre la contient.
  useEffect(() => {
    if (!grille || preselectionFaite.current) return;
    preselectionFaite.current = true;
    const p = params.get('palier') as Palier | null;
    const d = params.get('duree') as Duree | null;
    if (p && d && ORDRE_PALIERS.includes(p) && ORDRE_DUREES.includes(d) && grille[p]?.[d]) {
      setPalierNaturo(p);
      setPalier(p);
      setDuree(d);
    }
  }, [grille, params]);

  // Le message de copie disparaît dès que le choix affiché change.
  useEffect(() => setLienCopie(null), [palier, duree]);

  const copierLien = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('palier', palier);
    url.searchParams.set('duree', duree);
    try {
      await navigator.clipboard.writeText(url.toString());
      setLienCopie('ok');
    } catch {
      setLienCopie('erreur');
    }
  };

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

  // Le menu « Changer de forfait » se ferme avec Échap ou un clic ailleurs.
  useEffect(() => {
    if (!choixOuvert) return;
    const fermer = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent && (e.target as Element).closest?.('#choix-forfait, [aria-controls="choix-forfait"]')) return;
      setChoixOuvert(false);
    };
    document.addEventListener('keydown', fermer);
    document.addEventListener('mousedown', fermer);
    return () => {
      document.removeEventListener('keydown', fermer);
      document.removeEventListener('mousedown', fermer);
    };
  }, [choixOuvert]);

  const allerAuPaiement = () =>
    requestAnimationFrame(() => sectionPaiement.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  const jetonExpire = () => {
    setExpire(true);
    window.scrollTo({ top: 0 });
  };

  const prix = grille?.[palier]?.[duree];
  const autres = ORDRE_PALIERS.filter((p) => p !== palier && grille?.[p]);

  let contenu: React.ReactNode;
  if (expire) {
    contenu = <LienExpire />;
  } else if (erreurApercu || erreurOffre) {
    contenu = (
      <MessageErreur
        message={(erreurApercu || erreurOffre)!}
        onReessayer={erreurApercu ? verifierLien : reessayer}
      />
    );
  } else if (!apercu) {
    contenu = <Chargement texte="Vérification du lien…" />;
  } else if (!grille) {
    contenu = <Chargement />;
  } else {
    contenu = (
      <>
        <div className="flex flex-col gap-3">
          <h1 className="m-0 text-[clamp(28px,4.4vw,40px)] leading-[1.15] font-extrabold tracking-[-0.02em]">
            {titre(apercu)}
          </h1>
          <p className="m-0 text-lg leading-relaxed text-[#4A5455]">
            Tu as fait le plus dur. La suite sert à protéger ce que tu as bâti.
          </p>
        </div>

        <SelecteurDuree valeur={duree} onChange={setDuree} grille={grille} palier={palier} fond="menthe" />

        <CarteForfait
          grille={grille}
          palier={palier}
          duree={duree}
          variante="principale"
          recommande={palier === palierNaturo}
          selectionne={mode === 'abonnement'}
          onChoisir={() => {
            setMode('abonnement');
            allerAuPaiement();
          }}
        />

        <div className="flex flex-col items-center gap-2 -mt-2">
          <button
            type="button"
            onClick={copierLien}
            className="inline-flex items-center gap-2 min-h-12 px-5 rounded-full bg-white text-[15px] font-bold text-[#1A1A1A] border border-[#C9DCDB] hover:border-[#007F78] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007F78]"
          >
            <Copy className="w-4 h-4 text-[#007F78]" aria-hidden="true" />
            Copier le lien pour la cliente
          </button>
          <p aria-live="polite" className="m-0 min-h-5 text-sm text-center text-[#4A5455]">
            {lienCopie === 'ok' && 'Lien copié. Il est valide 7 jours, pour un seul achat.'}
            {lienCopie === 'erreur' && 'La copie n’a pas fonctionné. Copie l’adresse de la page à la main.'}
          </p>
        </div>

        {autres.length > 0 && (
          <button
            type="button"
            onClick={() => setAutresOuverts((o) => !o)}
            aria-expanded={autresOuverts}
            className="self-center min-h-12 px-5 text-[15px] font-bold text-[#007F78] underline underline-offset-[3px]"
          >
            {autresOuverts ? 'Masquer les autres options' : 'Voir les deux autres options'}
          </button>
        )}

        {autresOuverts && (
          <div className="grid gap-4 sm:grid-cols-2">
            {autres.map((p) => (
              <CarteForfait
                key={p}
                grille={grille}
                palier={p}
                duree={duree}
                variante="secondaire"
                onChoisir={() => {
                  setPalier(p);
                  setMode('abonnement');
                  setAutresOuverts(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        )}

        <SiLaVieChange variante="bloc" />

        <section
          ref={sectionPaiement}
          aria-label="Paiement"
          className="bg-white rounded-[22px] p-5 sm:p-7 border border-[#DCE5E5] scroll-mt-4"
        >
          {prix && (
            <SectionPaiement
              commande={mode === 'carte' ? { type: 'carte' } : { type: 'abonnement', palier, duree, prix }}
              source={{
                type: 'naturo',
                jeton,
                cliente: apercu.cliente,
                datePremierPaiement: apercu.date_premier_paiement ?? null,
                onJetonExpire: jetonExpire,
              }}
              utm={lireUtm(params)}
              onRevenirAuxForfaits={() => setMode('abonnement')}
            />
          )}
        </section>

        {CARTE_ACTIVE && (
          <BlocCarte
            variante="compact"
            onReserver={() => {
              setMode('carte');
              allerAuPaiement();
            }}
          />
        )}
      </>
    );
  }

  const menuForfait = !expire && apercu && grille && (
    <div className="relative">
      <button
        type="button"
        onClick={() => setChoixOuvert((o) => !o)}
        aria-expanded={choixOuvert}
        aria-controls="choix-forfait"
        className="px-4 py-2 rounded-full bg-white/70 text-sm font-semibold text-[#4A5455] hover:bg-white transition-colors"
      >
        Changer de forfait
      </button>
      {choixOuvert && (
        <div
          id="choix-forfait"
          className="absolute right-0 top-full mt-2 z-20 w-60 rounded-2xl border border-[#E3E8E8] bg-white p-1.5 shadow-lg"
        >
          {ORDRE_PALIERS.filter((p) => grille[p]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPalierNaturo(p);
                setPalier(p);
                setMode('abonnement');
                setChoixOuvert(false);
              }}
              aria-current={p === palierNaturo}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-semibold ${
                p === palierNaturo ? 'bg-[#EBF8F7] text-[#1A1A1A]' : 'text-[#4A5455] hover:bg-[#F5FAFA]'
              }`}
            >
              {NOMS_PALIERS[p]}
              {p === palierNaturo && <Check className="w-5 h-5 text-[#007F78]" strokeWidth={3} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="text-[#1A1A1A] bg-[#EBF8F7] w-full min-h-screen">
      <BandeauSimulation />
      <div className="max-w-[800px] mx-auto px-5 sm:px-6 pt-8 pb-12 flex flex-col gap-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="NEO Performance" width={40} height={40} priority className="h-10 w-auto" />
            <span className="hidden sm:inline text-xs font-bold tracking-[0.12em] uppercase text-[#007F78]">
              NEO Continuité
            </span>
          </div>
          {menuForfait}
        </div>
        {contenu}
      </div>
    </div>
  );
};

export default ContinuiteNaturo;
