'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

type Duree = 'mensuel' | 'annuel';
type Palier = 'continuite' | 'plus';

/*
  Formulaires GHL (Go High Level) connectés à Stripe. Un formulaire par
  combinaison palier + durée. Les identifiants proviennent des embeds fournis
  par GHL : ils sont aussi repris tels quels dans `id` et
  `data-layout-iframe-id` sous la forme `inline-<formId>`.
*/
const FORMS: Record<Palier, Record<Duree, { formId: string; formName: string; height: number }>> = {
  continuite: {
    mensuel: { formId: 'vuCi3m9qTf0YL7GusXhh', formName: 'NEO Continuité - Mensuel', height: 750 },
    annuel: { formId: 'hgflGxsqoJe2G0E1eDGD', formName: 'NEO Continuité - Annuel', height: 750 },
  },
  plus: {
    mensuel: { formId: '7EFIoLTi8s0sDbhylvpy', formName: 'NEO Continuité Plus - Mensuel', height: 750 },
    annuel: { formId: '7n7C1uQjLhqUJBm6gdAG', formName: 'NEO Continuité Plus - Annuel', height: 750 },
  },
};

/*
  Prix publics réels de NEO. Tous les montants comparatifs de la page sont
  calculés à partir d'ici, jamais écrits en dur dans le texte : si un tarif
  change, le décompte de l'économie suit tout seul.
*/
const RENCONTRE_UNITE = 198;
const LEO_MENSUEL = 29.99;

type PalierData = {
  nom: string;
  resume: string;
  mensuel: number;
  annuel: number;
  rencontres: number;
  rencontreSup: number;
  rabaisSupplements: number;
  inclusions: string[];
};

const PALIERS: Record<Palier, PalierData> = {
  continuite: {
    nom: 'NEO Continuité',
    resume: 'Le suivi qui garde la structure en place.',
    mensuel: 49.99,
    annuel: 539.89,
    rencontres: 3,
    rencontreSup: 149,
    rabaisSupplements: 10,
    inclusions: [
      'Accès illimité à Léo dans l’application',
      'Chat avec ta naturopathe, réponse en 48 h ouvrables',
      'Une rencontre complète de 60 minutes aux 4 mois, soit 3 par année',
      'Rencontre supplémentaire à 149 $ au lieu de 198 $',
      'Prix membre de 10 % sur les suppléments',
      'Reçu de naturopathie admissible aux assurances',
    ],
  },
  plus: {
    nom: 'NEO Continuité Plus',
    resume: 'Un regard sur ton dossier tous les deux mois.',
    mensuel: 99.99,
    annuel: 1079.89,
    rencontres: 6,
    rencontreSup: 110,
    rabaisSupplements: 15,
    inclusions: [
      'Tout ce que comprend NEO Continuité',
      'Une rencontre complète de 60 minutes aux 2 mois, soit 6 par année',
      'Un ajustement de plan alimentaire de 15 minutes en visioconférence aux 2 mois',
      'Rencontre supplémentaire à 110 $ au lieu de 198 $',
      'Prix membre de 15 % sur les suppléments',
    ],
  },
};

const ORDRE: Palier[] = ['continuite', 'plus'];

/*
  Formatage manuel plutôt qu'Intl : le rendu serveur et le rendu client
  doivent produire exactement la même chaîne, y compris les espaces
  insécables, sinon React signale un écart d'hydratation.
*/
function argent(valeur: number, decimales = 2): string {
  const fixe = valeur.toFixed(decimales);
  const [entier, fraction] = fixe.split('.');
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${groupe}${fraction ? `,${fraction}` : ''} $`;
}

function calcul(palier: Palier) {
  const p = PALIERS[palier];
  const rencontres = p.rencontres * RENCONTRE_UNITE;
  const leo = 12 * LEO_MENSUEL;
  const alaCarte = rencontres + leo;
  const douzeMensualites = 12 * p.mensuel;
  return {
    rencontres,
    leo,
    alaCarte,
    douzeMensualites,
    economieAnnuel: alaCarte - p.annuel,
    economieMensuel: alaCarte - douzeMensualites,
    economieAnnuelVsMensuel: douzeMensualites - p.annuel,
  };
}

// Le meilleur écart annuel contre mensuel des deux paliers, affiché sur le sélecteur.
const ECONOMIE_ANNUELLE_MAX = Math.max(
  ...ORDRE.map((cle) => 12 * PALIERS[cle].mensuel - PALIERS[cle].annuel),
);

const LIGNES: { libelle: string; continuite: string; plus: string; leo: string }[] = [
  { libelle: 'Accès à Léo dans l’application', continuite: 'Illimité', plus: 'Illimité', leo: 'Illimité' },
  { libelle: 'Chat avec ta naturopathe', continuite: 'Réponse en 48 h ouvrables', plus: 'Réponse en 48 h ouvrables', leo: 'Non inclus' },
  { libelle: 'Rencontre complète de 60 minutes', continuite: 'Aux 4 mois, 3 par année', plus: 'Aux 2 mois, 6 par année', leo: 'Non inclus' },
  { libelle: 'Ajustement de plan alimentaire de 15 minutes en visioconférence', continuite: 'Non inclus', plus: 'Aux 2 mois, 6 par année', leo: 'Non inclus' },
  { libelle: 'Rencontre supplémentaire', continuite: '149 $ au lieu de 198 $', plus: '110 $ au lieu de 198 $', leo: 'Tarif régulier de 198 $' },
  { libelle: 'Prix membre sur les suppléments', continuite: '10 %', plus: '15 %', leo: 'Non inclus' },
  { libelle: 'Reçu de naturopathie admissible aux assurances', continuite: 'Oui', plus: 'Oui', leo: 'Non inclus' },
  { libelle: 'Engagement', continuite: '3 mois, ensuite mensuel', plus: '3 mois, ensuite mensuel', leo: 'Aucun' },
  { libelle: 'Prix mensuel', continuite: `${argent(PALIERS.continuite.mensuel)} / mois`, plus: `${argent(PALIERS.plus.mensuel)} / mois`, leo: `${argent(LEO_MENSUEL)} / mois` },
  { libelle: 'Prix annuel payé d’avance', continuite: `${argent(PALIERS.continuite.annuel)} / an`, plus: `${argent(PALIERS.plus.annuel)} / an`, leo: `${argent(279.99)} / an` },
];

const QUESTIONS: { q: string; r: React.ReactNode }[] = [
  {
    q: 'Est-ce que je peux annuler ?',
    r: (
      <>
        Oui. La formule mensuelle demande un engagement minimal de 3 mois, ensuite tu peux annuler en tout temps
        en écrivant à <a href="mailto:info@neoperformance.ca" className="text-neo hover:text-neo-600">info@neoperformance.ca</a>.
        L&apos;annulation prend effet à la fin de la période déjà payée : tu gardes ton accès et tes rencontres
        jusque-là. La formule annuelle est payée d&apos;avance pour 12 mois et se renouvelle à la date
        d&apos;anniversaire, sauf si tu nous avises avant.
      </>
    ),
  },
  {
    q: 'Est-ce que c’est admissible à mes assurances ?',
    r: (
      <>
        Les rencontres avec ta naturopathe donnent droit à un reçu de naturopathie, admissible chez la plupart
        des assureurs qui couvrent la naturopathie. La portion Léo et le chat ne sont pas des actes cliniques et
        n&apos;apparaissent pas sur le reçu. Vérifie ton contrat : la couverture varie d&apos;un assureur à
        l&apos;autre et selon ton régime.
      </>
    ),
  },
  {
    q: 'Qu’arrive-t-il si je ne prends pas ma rencontre incluse ?',
    r: (
      <>
        Elle reste disponible pendant toute la durée de ton abonnement : rien ne se perd d&apos;un bloc à
        l&apos;autre tant que ton abonnement est actif. Elle n&apos;est par contre pas remboursable ni
        transférable après la fin de l&apos;abonnement. Si ton horaire est chargé, écris-nous : on replace la
        rencontre plutôt que de la laisser tomber.
      </>
    ),
  },
];

const Continuite: React.FC = () => {
  const [duree, setDuree] = useState<Duree>('mensuel');
  const [palier, setPalier] = useState<Palier>('plus');
  const [consent, setConsent] = useState(false);
  const [formsMontes, setFormsMontes] = useState(false);
  const sectionPaiement = useRef<HTMLDivElement>(null);

  /*
    Quatre iframes GHL alourdissent le premier affichage, et la moitié de la
    clientèle est sur téléphone. On ne les monte qu'à l'approche de la section
    de paiement. Une fois montées, elles ne sont plus jamais démontées.
  */
  useEffect(() => {
    if (formsMontes) return;
    const cible = sectionPaiement.current;
    if (!cible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setFormsMontes(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          setFormsMontes(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(cible);
    return () => observer.disconnect();
  }, [formsMontes]);

  // Le script GHL n'est injecté qu'une fois les iframes présentes dans le DOM.
  useEffect(() => {
    if (!formsMontes) return;
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [formsMontes]);

  const choisir = (cible: Palier) => {
    setPalier(cible);
    setFormsMontes(true);
    document.getElementById('paiement')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const courant = PALIERS[palier];
  const prixCourant = duree === 'annuel' ? courant.annuel : courant.mensuel;
  const uniteCourante = duree === 'annuel' ? '/ an' : '/ mois';
  const verrouille = !consent;

  return (
    <>
      {/* Hero */}
      <div className="bg-neo/10 pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-neo/30 text-neo-700 text-[11px] font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-5">
            NEO Continuité · Après ton programme
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[44px] leading-tight font-extrabold text-gray-900 mb-4">
            Ce qui fait reprendre le poids, ce n&apos;est pas l&apos;oubli : c&apos;est la disparition de la
            structure.
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Tu as terminé ton programme. Tu sais quoi faire. Ce qui change à partir de maintenant, c&apos;est que
            plus personne ne regarde. NEO Continuité, c&apos;est le regard qui reste.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4">
        {/* Sélecteur de durée */}
        <div className="mt-10 flex flex-col items-center">
          <div className="inline-flex bg-gray-100 rounded-full p-1.5" role="group" aria-label="Durée de l&apos;abonnement">
            <button
              type="button"
              onClick={() => setDuree('mensuel')}
              aria-pressed={duree === 'mensuel'}
              className={`px-6 sm:px-8 py-3 rounded-full text-sm font-bold transition-all ${
                duree === 'mensuel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setDuree('annuel')}
              aria-pressed={duree === 'annuel'}
              className={`relative px-6 sm:px-8 py-3 rounded-full text-sm font-bold transition-all ${
                duree === 'annuel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annuel
              <span className="ml-2 inline-flex items-center bg-neo text-white text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full align-middle">
                Jusqu&apos;à {argent(ECONOMIE_ANNUELLE_MAX)} de moins
              </span>
            </button>
          </div>
          <p className="text-[13px] text-gray-500 mt-3.5 text-center max-w-[440px] leading-relaxed">
            {duree === 'annuel'
              ? 'Payé d’avance pour 12 mois, renouvelé chaque année.'
              : 'Prélevé chaque mois, engagement minimal de 3 mois.'}
          </p>
        </div>

        {/* Les deux forfaits */}
        <div className="grid gap-5 md:grid-cols-2 mt-8 items-start">
          {ORDRE.map((cle) => {
            const p = PALIERS[cle];
            const c = calcul(cle);
            const prix = duree === 'annuel' ? p.annuel : p.mensuel;
            const economie = duree === 'annuel' ? c.economieAnnuel : c.economieMensuel;
            const enAvant = cle === 'plus';
            return (
              <div
                key={cle}
                className={`relative bg-white rounded-[20px] p-6 sm:p-7 ${
                  enAvant
                    ? 'border-2 border-neo shadow-[0_20px_40px_-18px_rgba(0,187,177,0.45)]'
                    : 'border-2 border-gray-200 shadow-sm'
                }`}
              >
                {enAvant && (
                  <span className="absolute -top-3 left-7 bg-neo text-white text-[11px] font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-full">
                    Le plus complet
                  </span>
                )}
                <h2 className="text-lg font-extrabold text-gray-900">{p.nom}</h2>
                <p className="text-sm text-gray-600 mt-1">{p.resume}</p>

                <div className="flex items-end gap-1.5 mt-4 mb-1 flex-wrap">
                  <span className="text-[34px] sm:text-[42px] font-extrabold tracking-tight">{argent(prix)}</span>
                  <span className="text-[15px] font-semibold text-gray-500 pb-2">
                    {duree === 'annuel' ? '/ an' : '/ mois'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {duree === 'annuel'
                    ? `Payé d’avance pour 12 mois, soit ${argent(prix / 12)} par mois.`
                    : `Prélevé chaque mois, soit ${argent(prix * 12)} sur 12 mois.`}
                </p>

                <div className="mt-4 rounded-2xl bg-neo/[.07] border border-neo/25 px-4 py-3.5">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    À la carte, les mêmes services coûtent{' '}
                    <strong className="font-extrabold">{argent(c.alaCarte)}</strong> par année. Tu économises{' '}
                    <strong className="font-extrabold text-neo-700">{argent(economie)}</strong> par
                    année.
                  </p>
                </div>

                <ul className="space-y-2.5 text-sm text-gray-700 mt-5">
                  {p.inclusions.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="text-neo font-extrabold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-[13px] text-gray-500 mt-5 leading-relaxed">
                  Engagement minimal de 3 mois, ensuite mensuel. Cette condition s&apos;applique à la formule
                  mensuelle.{' '}
                  {duree === 'annuel' && 'Sur la formule annuelle, les 12 mois sont déjà payés d’avance.'}
                </p>

                <button
                  type="button"
                  onClick={() => choisir(cle)}
                  className={`w-full mt-5 inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full transition-colors ${
                    enAvant
                      ? 'bg-neo text-white shadow-[0_10px_15px_-3px_rgba(0,187,177,0.2)] hover:bg-neo-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Choisir {p.nom}
                </button>
              </div>
            );
          })}
        </div>

        {/* Léo seul, en sortie de page seulement */}
        <div className="mt-5 border border-gray-200 rounded-2xl px-5 py-4 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-700">
            Tu veux seulement garder Léo ? <strong className="font-bold">{argent(LEO_MENSUEL)} / mois</strong>,
            sans rencontre ni chat avec ta naturopathe.
          </p>
          <a href="/abonnement-leo" className="text-sm font-bold text-neo hover:text-neo-600 whitespace-nowrap">
            Voir l&apos;abonnement Léo seul
          </a>
        </div>

        {/*
          Emplacement réservé à la preuve sociale : 228 avis internes à 4,65 sur 5.
          Les extraits réels seront fournis par NEO. Rien n'est affiché tant que le
          contenu authentique n'est pas en main.
        */}

        {/* Tableau comparatif */}
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5">Ce que chaque formule comprend</h2>
          <p className="text-sm text-gray-600 mb-6">Ligne par ligne, sans zone grise.</p>

          {/* Écran large : tableau */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left font-bold text-gray-500 text-xs uppercase tracking-wider px-5 py-4 w-[34%]">
                    &nbsp;
                  </th>
                  <th className="text-left font-extrabold text-gray-900 px-5 py-4">NEO Continuité</th>
                  <th className="text-left font-extrabold text-neo-700 px-5 py-4 bg-neo/[.06]">
                    NEO Continuité Plus
                  </th>
                  <th className="text-left font-bold text-gray-500 px-5 py-4">Léo seul</th>
                </tr>
              </thead>
              <tbody>
                {LIGNES.map((ligne) => (
                  <tr key={ligne.libelle} className="border-t border-gray-100">
                    <th scope="row" className="text-left font-semibold text-gray-700 px-5 py-4 align-top">
                      {ligne.libelle}
                    </th>
                    <td className="px-5 py-4 text-gray-700 align-top">{ligne.continuite}</td>
                    <td className="px-5 py-4 text-gray-900 font-semibold align-top bg-neo/[.04]">{ligne.plus}</td>
                    <td className="px-5 py-4 text-gray-500 align-top">{ligne.leo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Téléphone : une carte par formule, aucune barre de défilement horizontale */}
          <div className="md:hidden space-y-4">
            {([
              { titre: 'NEO Continuité', champ: 'continuite' as const, mise: false },
              { titre: 'NEO Continuité Plus', champ: 'plus' as const, mise: true },
              { titre: 'Léo seul', champ: 'leo' as const, mise: false },
            ]).map((colonne) => (
              <div
                key={colonne.titre}
                className={`rounded-2xl bg-white p-5 ${
                  colonne.mise ? 'border-2 border-neo' : 'border border-gray-200'
                }`}
              >
                <h3 className={`text-base font-extrabold mb-3 ${colonne.mise ? 'text-neo-700' : 'text-gray-900'}`}>
                  {colonne.titre}
                </h3>
                <dl className="divide-y divide-gray-100">
                  {LIGNES.map((ligne) => (
                    <div key={ligne.libelle} className="py-2.5">
                      <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">{ligne.libelle}</dt>
                      <dd className="text-sm text-gray-800 mt-0.5">{ligne[colonne.champ]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>

        {/* Décompte de l'économie */}
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5">Le calcul, au complet</h2>
          <p className="text-sm text-gray-600 mb-6">
            Ce sont nos prix publics réels : une rencontre à l&apos;unité coûte {argent(RENCONTRE_UNITE, 0)} et un
            bloc de 5 coûte {argent(875, 0)}, soit {argent(175, 0)} la rencontre.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {ORDRE.map((cle) => {
              const p = PALIERS[cle];
              const c = calcul(cle);
              return (
                <div key={cle} className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-base font-extrabold text-gray-900 mb-4">{p.nom}</h3>
                  <dl className="text-sm">
                    <div className="flex justify-between gap-4 py-2 border-b border-gray-100">
                      <dt className="text-gray-600">
                        {p.rencontres} rencontres à {argent(RENCONTRE_UNITE, 0)}
                      </dt>
                      <dd className="font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                        {argent(c.rencontres)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 py-2 border-b border-gray-100">
                      <dt className="text-gray-600">12 mois de Léo à {argent(LEO_MENSUEL)}</dt>
                      <dd className="font-semibold text-gray-900 tabular-nums whitespace-nowrap">{argent(c.leo)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-2.5 border-b-2 border-gray-200">
                      <dt className="font-bold text-gray-900">Total payé séparément</dt>
                      <dd className="font-extrabold text-gray-900 tabular-nums whitespace-nowrap">
                        {argent(c.alaCarte)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 py-2.5">
                      <dt className="font-bold text-gray-900">Ton abonnement annuel</dt>
                      <dd className="font-extrabold text-gray-900 tabular-nums whitespace-nowrap">
                        {argent(p.annuel)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-2 rounded-xl bg-neo/[.07] border border-neo/25 px-4 py-3 text-sm font-bold text-neo-700">
                    Tu économises {argent(c.economieAnnuel)} par année.
                  </p>
                  <p className="text-[13px] text-gray-500 mt-3 leading-relaxed">
                    Annuel contre mensuel : {argent(p.annuel)} au lieu de {argent(c.douzeMensualites)}, soit{' '}
                    {argent(c.economieAnnuelVsMensuel)} de moins sur 12 mois.
                  </p>
                  {cle === 'plus' && (
                    <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
                      Les six ajustements de plan alimentaire de 15 minutes ne sont pas chiffrés ici : ils
                      n&apos;existent pas au menu, ils sont exclusifs aux membres.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Questions */}
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Trois questions qu&apos;on nous pose</h2>
          <div className="space-y-4">
            {QUESTIONS.map((item) => (
              <div key={item.q} className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Consentement */}
        <div id="paiement" ref={sectionPaiement} className="mt-16 scroll-mt-28">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Active ton abonnement</h2>

          {/* Choix du palier pour le formulaire */}
          <div className="grid gap-3 sm:grid-cols-2">
            {ORDRE.map((cle) => {
              const p = PALIERS[cle];
              const prix = duree === 'annuel' ? p.annuel : p.mensuel;
              return (
                <button
                  key={cle}
                  type="button"
                  onClick={() => setPalier(cle)}
                  aria-pressed={palier === cle}
                  className={`text-left bg-white rounded-2xl px-5 py-4 transition-all ${
                    palier === cle
                      ? 'border-2 border-neo shadow-[0_16px_32px_-20px_rgba(0,187,177,0.45)]'
                      : 'border-2 border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-extrabold text-gray-900">{p.nom}</span>
                    <span
                      className={`box-border w-[22px] h-[22px] rounded-full shrink-0 transition-all ${
                        palier === cle ? 'border-[7px] border-neo bg-white' : 'border-2 border-gray-300 bg-white'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {argent(prix)} {duree === 'annuel' ? '/ an' : '/ mois'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 border border-gray-200 rounded-2xl p-5 sm:p-6 bg-gray-50">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-[22px] h-[22px] min-w-[22px] mt-0.5 accent-neo cursor-pointer"
              />
              <span className="text-sm leading-relaxed text-gray-700">
                Je comprends qu&apos;il s&apos;agit d&apos;un{' '}
                <strong className="font-bold">abonnement à renouvellement automatique</strong> : le montant choisi
                sera prélevé sur ma carte à chaque période de facturation, jusqu&apos;à ce que j&apos;annule.
                L&apos;engagement minimal est de 3 mois sur la formule mensuelle. Je peux annuler ensuite en tout
                temps en écrivant à{' '}
                <a href="mailto:info@neoperformance.ca" className="text-neo hover:text-neo-600">
                  info@neoperformance.ca
                </a>
                , et l&apos;annulation prend effet à la fin de la période déjà payée.
              </span>
            </label>
          </div>
        </div>

        {/* Formulaires */}
        <div className="mt-7 pb-16">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <h3 className="text-[22px] font-extrabold text-gray-900">
              {courant.nom} : {argent(prixCourant)} {uniteCourante}
            </h3>
            <p className="text-[13px] text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-[15px] h-[15px] text-neo" strokeWidth={2.2} />
              Paiement sécurisé
            </p>
          </div>

          <div className="relative bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
            <div className={verrouille ? 'pointer-events-none blur-[3px] opacity-50 transition-all' : 'transition-all'}>
              {/*
                Les quatre iframes restent montées en permanence une fois créées et
                on bascule leur visibilité en CSS. form_embed.js de GHL réenveloppe
                chaque iframe dans ses propres divs au chargement ; si on
                démonte/remonte l'iframe sélectionnée via le rendu conditionnel de
                React, React perd la référence au nœud (déplacé par le script) et
                plante avec "Failed to execute 'removeChild' on 'Node'" au
                changement de forfait.
              */}
              {formsMontes ? (
                ORDRE.flatMap((clePalier) =>
                  (['mensuel', 'annuel'] as Duree[]).map((cleDuree) => {
                    const f = FORMS[clePalier][cleDuree];
                    const visible = clePalier === palier && cleDuree === duree;
                    return (
                      // Visibilité portée par ce div, pas par l'iframe : le script GHL pose
                      // un style inline `display` directement sur l'iframe, qui l'emporterait
                      // sur la classe Tailwind `hidden` (spécificité du style inline).
                      <div key={f.formId} className={visible ? 'block' : 'hidden'}>
                        <iframe
                          src={`https://api.leadconnectorhq.com/widget/form/${f.formId}`}
                          id={`inline-${f.formId}`}
                          data-layout="{'id':'INLINE'}"
                          data-trigger-type="alwaysShow"
                          data-trigger-value=""
                          data-activation-type="alwaysActivated"
                          data-activation-value=""
                          data-deactivation-type="neverDeactivate"
                          data-deactivation-value=""
                          data-form-name={f.formName}
                          data-height={f.height}
                          data-layout-iframe-id={`inline-${f.formId}`}
                          data-form-id={f.formId}
                          data-cookie-consent="true"
                          data-cookie-consent-provider="auto"
                          title={f.formName}
                          className="w-full border-none h-[750px] block"
                        />
                      </div>
                    );
                  }),
                )
              ) : (
                <div className="h-[750px] w-full" aria-hidden="true" />
              )}
            </div>

            {verrouille && (
              // Le formulaire GHL se redimensionne selon son propre contenu (souvent
              // bien plus grand que 750px une fois chargé) : un overlay centré dans
              // toute la hauteur de la carte finirait hors écran. `sticky` garde le
              // message et le bouton visibles pendant que la carte défile.
              <div className="absolute inset-0 bg-white/[.86] flex flex-col items-center px-6 text-center">
                <div className="sticky top-24 flex flex-col items-center gap-4">
                  <p className="text-lg font-bold max-w-[380px]">
                    Coche la case de consentement pour accéder au paiement
                  </p>
                  <button
                    type="button"
                    onClick={() => setConsent(true)}
                    className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full bg-neo text-white shadow-[0_10px_15px_-3px_rgba(0,187,177,0.2)] hover:bg-neo-600 transition-colors"
                  >
                    J&apos;accepte et je continue
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Léo est un outil d&apos;accompagnement et ne remplace pas un avis médical ni le suivi de ta
            naturopathe. Taxes applicables incluses au moment du paiement. Le reçu de naturopathie couvre les
            rencontres cliniques.
          </p>
        </div>
      </div>
    </>
  );
};

export default Continuite;
