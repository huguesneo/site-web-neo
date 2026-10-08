'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Check, Plus, X } from 'lucide-react';
import {
  DUREE_PAR_DEFAUT,
  NOMS_DUREES,
  NOMS_PALIERS,
  ONGLETS_PALIERS,
  CARTE_ACTIVE,
  ORDRE_PALIERS,
  PALIER_RECOMMANDE,
  PRIX_CARTE_CENTS,
  argent,
  creditCents,
} from '@/lib/continuite/contenu';
import type { Grille } from '@/lib/continuite/offre';
import { lireUtm } from '@/lib/continuite/utm';
import type { Duree, Palier } from '@/lib/continuite/types';
import { LOGO_URL } from '@/constants';
import SelecteurDuree from '@/components/continuite/SelecteurDuree';
import CarteForfait from '@/components/continuite/CarteForfait';
import BlocCarte from '@/components/continuite/BlocCarte';
import SiLaVieChange from '@/components/continuite/SiLaVieChange';
import SectionPaiement from '@/components/continuite/SectionPaiement';
import { BandeauSimulation, Chargement, MessageErreur } from '@/components/continuite/Etats';
import { useOffre } from '@/components/continuite/useOffre';

/*
  Page publique NEO Continuité (lien envoyé par courriel ou SMS), d'après la
  maquette « Main ». Plein écran, sans le menu du site (voir SiteChrome).
  Paiement immédiat : aucune date de semaine 15 ici.
*/

const FAQ: { q: string; r: string }[] = [
  {
    q: 'Et si ma vie change ?',
    r: 'Tu peux passer au mois par mois en payant seulement la différence de prix sur les mois déjà payés. À la fin de ta durée, ton forfait continue au même prix, mois par mois.',
  },
  {
    q: 'Et si je n’utilise pas tout mon crédit ?',
    r: 'Ton crédit suppléments est remis chaque mois en carte-cadeau dans ton compte neoperformance.ca. Il est valide jusqu’au paiement suivant et ne se reporte pas. Ton ou ta naturopathe t’aide à l’utiliser pour ce dont tu as vraiment besoin.',
  },
  {
    q: 'Pourquoi ne pas simplement réserver quand j’en ai besoin ?',
    r:
      'Parce qu’on revient souvent quand ça a déjà glissé. Un suivi régulier te garde sur la bonne voie avant que ça arrive.' +
      (CARTE_ACTIVE ? ' Le suivi à la carte reste toutefois possible, sans abonnement.' : ''),
  },
  {
    q: 'Quand le paiement est-il prélevé ?',
    r: 'Ton premier mois est prélevé au moment de ton inscription, puis chaque mois à la même date.',
  },
];

function lignesComparatif(g: Grille) {
  const credit = (p: Palier) => {
    const prix = g[p]?.mensuel;
    const c = creditCents(prix);
    if (c == null) return '';
    const rabais = prix?.inclus.some((l) => /10 %/.test(l));
    return `${argent(c)}${rabais ? ' puis 10 % de rabais' : ''}`;
  };
  const suivi = (p: Palier) => {
    const s = g[p]?.mensuel?.suivi_additionnel_cents;
    return s ? argent(s) : '';
  };
  const prix = (p: Palier) =>
    (['mensuel', '6_mois', '12_mois'] as Duree[])
      .map((d) => g[p]?.[d]?.montant_mensuel_cents)
      .filter((c): c is number => c != null)
      .map((c) => argent(c).replace(' $', ''))
      .join(' / ') + ' $ par mois';

  return [
    { titre: 'Crédit suppléments par mois', valeurs: [credit('continuite'), credit('continuite_plus'), credit('continuite_extra'), 'Aucun'] },
    {
      titre: 'Suivi individuel de 30 min',
      valeurs: [
        `Au besoin, ${suivi('continuite')}`,
        `Aux 2 mois (additionnel ${suivi('continuite_plus')})`,
        `Chaque mois (additionnel ${suivi('continuite_extra')})`,
        `${argent(PRIX_CARTE_CENTS)} par rencontre`,
      ],
    },
    { titre: 'Chat avec ton ou ta naturopathe', valeurs: ['Non inclus', 'Inclus', 'Inclus', 'Pendant 4 semaines'] },
    { titre: 'Léo, 7 jours sur 7', valeurs: ['Inclus', 'Inclus', 'Inclus', 'Non inclus'] },
    { titre: 'Application NEO et cours', valeurs: ['Inclus', 'Inclus', 'Inclus', 'Non incluse'] },
    { titre: 'Rencontre de groupe mensuelle', valeurs: ['Incluse', 'Incluse', 'Incluse', 'Non incluse'] },
    {
      titre: 'Prix',
      valeurs: [prix('continuite'), prix('continuite_plus'), prix('continuite_extra'), `${argent(PRIX_CARTE_CENTS)} + taxes par rencontre`],
    },
  ];
}

const Continuite: React.FC = () => {
  const params = useSearchParams();
  const { grille, erreur: erreurOffre, reessayer } = useOffre();

  const [duree, setDuree] = useState<Duree>(DUREE_PAR_DEFAUT);
  const [palier, setPalier] = useState<Palier>(PALIER_RECOMMANDE);
  const [mode, setMode] = useState<'abonnement' | 'carte'>('abonnement');
  const [paiementVisible, setPaiementVisible] = useState(false);
  const sectionPaiement = useRef<HTMLElement>(null);

  // La barre du bas disparaît quand la section de paiement est à l'écran.
  useEffect(() => {
    const cible = sectionPaiement.current;
    if (!cible || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([e]) => setPaiementVisible(e.isIntersecting), { threshold: 0.05 });
    obs.observe(cible);
    return () => obs.disconnect();
  }, [grille]);

  const allerAuPaiement = () => sectionPaiement.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const choisir = (p: Palier) => {
    setPalier(p);
    setMode('abonnement');
  };
  const reserver = () => {
    setMode('carte');
    requestAnimationFrame(allerAuPaiement);
  };

  const prix = grille?.[palier]?.[duree];
  const credit = creditCents(prix);
  const valeur =
    prix && credit != null
      ? palier === 'continuite'
        ? `À ${argent(prix.montant_mensuel_cents)} par mois, tu reçois ${argent(credit)} de suppléments que tu prends déjà, plus Léo, l’application et la rencontre de groupe.`
        : `À ${argent(prix.montant_mensuel_cents)} par mois, ${argent(credit)} vont dans des suppléments que tu prends déjà, et ton suivi avec ton ou ta naturopathe vaut ${argent(PRIX_CARTE_CENTS)} la rencontre à l’unité.`
      : null;

  return (
    <div className="text-[#1A1A1A] bg-white w-full">
      <BandeauSimulation />
      <header className="flex items-center justify-center px-4 py-5 border-b border-[#EEF2F2]">
        <Image src={LOGO_URL} alt="NEO Performance" width={44} height={44} priority className="h-11 w-auto" />
      </header>

      {/* Héro */}
      <section className="bg-[#EBF8F7] px-5 pt-14 pb-12 sm:pt-[72px] sm:pb-16">
        <div className="max-w-[760px] mx-auto text-center flex flex-col items-center gap-5">
          <div className="inline-flex bg-white border border-[#9FDCD8] text-[#007F78] text-xs font-bold tracking-[0.12em] uppercase px-4 py-2 rounded-full">
            Après ton programme
          </div>
          <h1 className="m-0 text-[clamp(32px,5vw,52px)] leading-[1.12] font-extrabold tracking-[-0.02em]">
            Tu as fait le plus dur. Maintenant, on protège ce que tu as bâti.
          </h1>
          <p className="m-0 text-lg sm:text-[19px] leading-relaxed text-[#4A5455] max-w-[620px]">
            NEO Continuité garde ta structure en place après ton programme : ton ou ta naturopathe, Léo et tes
            suppléments, au rythme que tu choisis.
          </p>
          <a
            href="#options"
            className="mt-2 inline-flex items-center justify-center min-h-[52px] px-9 rounded-full border-2 border-[#007F78] bg-[#007F78] text-white text-base font-bold hover:bg-[#00615C] hover:border-[#00615C]"
          >
            Voir les options
          </a>
          <p className="m-0 text-sm text-[#4A5455]">Plus de 15 000 personnes accompagnées</p>
        </div>
      </section>

      {/* Pourquoi */}
      <section className="px-5 py-16 sm:py-20">
        <div className="max-w-[760px] mx-auto flex flex-col gap-5">
          <div className="text-xs font-bold tracking-[0.12em] uppercase text-[#007F78]">Pourquoi on reprend</div>
          <h2 className="m-0 text-[clamp(26px,3.6vw,36px)] leading-[1.2] font-extrabold">
            Ce qui fait reprendre le poids, ce n’est pas l’oubli : c’est la structure qui disparaît.
          </h2>
          <p className="m-0 text-lg leading-[1.7] text-[#4A5455]">
            Tu sais quoi faire. Ce qui change à la fin du programme, c’est que plus personne ne regarde avec toi.
            NEO Continuité, c’est ce regard qui reste.
          </p>
        </div>
      </section>

      {/* Options */}
      <section id="options" className="px-5 pt-14 pb-10 sm:pt-[88px] scroll-mt-4">
        <div className="max-w-[1120px] mx-auto flex flex-col gap-9">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 className="m-0 text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.01em]">Choisis ton rythme</h2>
            <p className="m-0 text-[17px] text-[#4A5455]">D’abord la durée, ensuite ton niveau de suivi.</p>
          </div>

          {erreurOffre ? (
            <MessageErreur message={erreurOffre} onReessayer={reessayer} />
          ) : !grille ? (
            <Chargement />
          ) : (
            <>
              <div className="w-full max-w-[640px] mx-auto">
                <SelecteurDuree valeur={duree} onChange={setDuree} grille={grille} palier="meilleur" />
              </div>

              <div>
                {/* Mobile : un forfait à la fois, choisi par onglet */}
                <div
                  role="tablist"
                  aria-label="Forfaits"
                  className="md:hidden grid grid-cols-3 gap-1 bg-[#EEF2F2] rounded-2xl p-1 mb-4"
                >
                  {ORDRE_PALIERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="tab"
                      aria-selected={p === palier}
                      onClick={() => choisir(p)}
                      className={`min-h-12 rounded-xl text-sm font-bold ${
                        p === palier ? 'bg-white text-[#1A1A1A] shadow-[0_2px_8px_rgba(26,26,26,0.10)]' : 'text-[#4A5455]'
                      }`}
                    >
                      {ONGLETS_PALIERS[p]}
                    </button>
                  ))}
                </div>
                <div className="grid md:grid-cols-3 gap-5 items-stretch pt-4">
                  {ORDRE_PALIERS.map((p) => (
                    <div key={p} className={p === palier ? 'block' : 'hidden md:block'}>
                      <CarteForfait
                        grille={grille}
                        palier={p}
                        duree={duree}
                        variante="publique"
                        recommande={p === PALIER_RECOMMANDE}
                        selectionne={p === palier && mode === 'abonnement'}
                        onChoisir={() => choisir(p)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {valeur && (
                <div className="max-w-[760px] mx-auto mt-2 bg-[#EBF8F7] rounded-2xl px-6 py-5 text-base leading-relaxed text-center">
                  {valeur}
                </div>
              )}

              {CARTE_ACTIVE && <BlocCarte variante="large" onReserver={reserver} />}
            </>
          )}
        </div>
      </section>

      {/* Si la vie change */}
      <section className="px-5 py-14">
        <div className="max-w-[1120px] mx-auto">
          <SiLaVieChange variante="cartes" />
        </div>
      </section>

      {/* Paiement */}
      <section id="paiement" ref={sectionPaiement} className="bg-[#F6F8F8] px-4 sm:px-5 py-14 sm:py-[72px] scroll-mt-2">
        <div className="max-w-[640px] mx-auto bg-white rounded-3xl p-5 sm:p-8 border border-[#E3E8E8] flex flex-col gap-5">
          <h2 className="m-0 text-[26px] font-extrabold">{mode === 'carte' ? 'Réserve ta rencontre' : 'Confirme ta place'}</h2>
          {grille && prix ? (
            <SectionPaiement
              commande={mode === 'carte' ? { type: 'carte' } : { type: 'abonnement', palier, duree, prix }}
              source={{ type: 'public' }}
              utm={lireUtm(params)}
              onRevenirAuxForfaits={() => setMode('abonnement')}
            />
          ) : (
            <Chargement />
          )}
        </div>
      </section>

      {/* Questions */}
      <section className="px-5 pt-16 pb-10 sm:pt-[72px]">
        <div className="max-w-[760px] mx-auto flex flex-col gap-3">
          <h2 className="m-0 mb-3 text-[clamp(24px,3.2vw,32px)] font-extrabold">Tes questions</h2>
          {FAQ.map((item) => (
            <details key={item.q} className="group border-b border-[#E3E8E8] py-[18px]">
              <summary className="text-[17px] font-bold flex justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <Plus
                  className="w-5 h-5 shrink-0 text-[#007F78] transition-transform group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 mb-0 text-base leading-[1.65] text-[#4A5455]">{item.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Comparatif */}
      {grille && (
        <section className="px-5 pt-4 pb-16 sm:pb-[72px]">
          <div className="max-w-[1120px] mx-auto">
            <details className="group w-full border border-[#E3E8E8] rounded-[18px] px-6 py-5">
              <summary className="text-[17px] font-bold flex justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span>Comparer en détail</span>
                <Plus
                  className="w-5 h-5 shrink-0 text-[#007F78] transition-transform group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <div className="overflow-x-auto mt-5">
                <table className="w-full min-w-[780px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="p-3 pl-2 border-b-2 border-[#1A1A1A]">
                        <span className="sr-only">Élément</span>
                      </th>
                      <th className="p-3 border-b-2 border-[#1A1A1A]">{NOMS_PALIERS.continuite}</th>
                      <th className="p-3 border-b-2 border-[#007F78] text-[#007F78]">{NOMS_PALIERS.continuite_plus}</th>
                      <th className="p-3 border-b-2 border-[#1A1A1A]">{NOMS_PALIERS.continuite_extra}</th>
                      <th className="p-3 border-b-2 border-[#8A9596] text-[#4A5455]">Suivi à la carte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesComparatif(grille).map((ligne, i, tout) => (
                      <tr key={ligne.titre}>
                        <th
                          scope="row"
                          className={`p-3 pl-2 text-left font-semibold ${i < tout.length - 1 ? 'border-b border-[#E3E8E8]' : ''}`}
                        >
                          {ligne.titre}
                        </th>
                        {ligne.valeurs.map((v, j) => (
                          <td
                            key={j}
                            className={`p-3 ${i < tout.length - 1 ? 'border-b border-[#E3E8E8]' : ''} ${
                              j === 3 ? 'text-[#4A5455]' : ''
                            }`}
                          >
                            {/^Non inclus/.test(v) ? (
                              <span className="inline-flex items-center gap-1.5 text-[#4A5455]">
                                <X className="w-4 h-4 text-[#8A9596]" aria-hidden="true" />
                                {v}
                              </span>
                            ) : /^Inclus/.test(v) ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-[#00BBB1]" strokeWidth={3} aria-hidden="true" />
                                {v}
                              </span>
                            ) : (
                              v
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </section>
      )}

      <footer className="border-t border-[#EEF2F2] px-5 pt-8 pb-10 text-center text-[13px] leading-[1.7] text-[#4A5455]">
        <p className="m-0">
          NEO Performance · 7005 boul. Taschereau, bureau 350, Brossard · 450 486-4006 ·{' '}
          <a href="mailto:info@neoperformance.ca" className="text-[#007F78] hover:text-[#00615C]">
            info@neoperformance.ca
          </a>
        </p>
        <p className="mt-1 mb-0">Léo est un outil d’accompagnement et ne remplace pas un avis médical.</p>
      </footer>

      {/* Barre du bas */}
      {grille && prix && !paiementVisible && (
        <div className="sticky bottom-0 z-30 bg-white border-t border-[#E3E8E8] shadow-[0_-8px_24px_rgba(26,26,26,0.08)] px-5 py-3">
          <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[15px] font-extrabold truncate">
                {mode === 'carte' ? 'Suivi à la carte' : `${NOMS_PALIERS[palier]} · ${NOMS_DUREES[duree]}`}
              </span>
              <span className="text-[13px] text-[#4A5455]">
                {mode === 'carte'
                  ? `${argent(PRIX_CARTE_CENTS)} + taxes, une seule fois`
                  : `${argent(prix.montant_mensuel_cents)} par mois, + taxes`}
              </span>
            </div>
            <button
              type="button"
              onClick={allerAuPaiement}
              className="shrink-0 inline-flex items-center justify-center min-h-[52px] px-6 sm:px-7 rounded-full border-2 border-[#007F78] bg-[#007F78] text-white text-[15px] sm:text-base font-bold hover:bg-[#00615C] hover:border-[#00615C]"
            >
              {mode === 'carte' ? 'Réserver' : 'Confirmer ma place'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Continuite;
