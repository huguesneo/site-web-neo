'use client';
import React, { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { checkoutPublic, ErreurContinuite } from '@/lib/continuite/api';
import { DETAILS_DUREES, NOMS_PALIERS, PALIER_RECOMMANDE, argent } from '@/lib/continuite/contenu';
import { lireUtm } from '@/lib/continuite/utm';
import type { Coordonnees, Duree, Palier } from '@/lib/continuite/types';
import SelecteurDuree from '@/components/continuite/SelecteurDuree';
import CartesPaliers from '@/components/continuite/CartesPaliers';
import Conditions from '@/components/continuite/Conditions';
import ChampsCoordonnees, { focusPremiereErreur, valider, type ErreursChamps } from '@/components/continuite/ChampsCoordonnees';
import Turnstile from '@/components/continuite/Turnstile';
import CheckoutIntegre from '@/components/continuite/CheckoutIntegre';
import { BandeauSimulation, Chargement, MessageErreur } from '@/components/continuite/Etats';
import { useOffre } from '@/components/continuite/useOffre';

const QUESTIONS: { q: string; r: React.ReactNode }[] = [
  {
    q: 'Comment fonctionne le crédit suppléments ?',
    r: (
      <>
        Chaque mois, ton crédit est remis en carte-cadeau dans ton compte sur neoperformance.ca : 35 $, 50 $ ou
        75 $ selon le palier. Tu l&apos;utilises dans la boutique pour tes suppléments, dans le mois où il est
        remis. Il ne se cumule pas d&apos;un mois à l&apos;autre. Avec Continuité Extra, tu as aussi 10 % de
        rabais sur les suppléments au-delà du crédit.
      </>
    ),
  },
  {
    q: 'Je suis encore en programme. Quand suis-je facturée ?',
    r: (
      <>
        Si tu t&apos;inscris pendant ton programme, ton premier paiement a lieu à la semaine 15. Rien n&apos;est
        prélevé avant cette date.
      </>
    ),
  },
  {
    q: 'Est-ce que je peux arrêter ou changer de durée ?',
    r: (
      <>
        Le forfait mensuel est sans engagement. Avec un engagement de 6 ou 12 mois, l&apos;abonnement ne peut
        pas être annulé avant la fin, mais tu peux passer au mensuel en payant la différence de prix sur les
        mois déjà payés. Pour toute demande, écris-nous à{' '}
        <a href="mailto:info@neoperformance.ca" className="text-neo-700 font-semibold hover:text-neo-600">
          info@neoperformance.ca
        </a>
        .
      </>
    ),
  },
  {
    q: 'Qu’arrive-t-il à la fin de mon engagement ?',
    r: <>Ton forfait continue au même prix, mois par mois. Tu n&apos;as rien à faire.</>,
  },
  {
    q: 'Comment j’accède à mes services après le paiement ?',
    r: (
      <>
        Tout se passe dans l&apos;application NEO : Léo, les cours, le crédit suppléments, la rencontre de
        groupe et, selon ton palier, le chat et les suivis avec ta naturopathe.
      </>
    ),
  },
];

const VIDE: Coordonnees = { prenom: '', nom: '', courriel: '', telephone: '' };
const REQUIS: (keyof Coordonnees)[] = ['prenom', 'nom', 'courriel', 'telephone'];

const Continuite: React.FC = () => {
  const params = useSearchParams();
  const { grille, rabais, erreur: erreurOffre, reessayer } = useOffre();

  const [duree, setDuree] = useState<Duree>('6_mois');
  const [palier, setPalier] = useState<Palier>(PALIER_RECOMMANDE);
  const [coord, setCoord] = useState<Coordonnees>(VIDE);
  const [erreursChamps, setErreursChamps] = useState<ErreursChamps>({});
  const [consent, setConsent] = useState(false);
  const [erreurConsent, setErreurConsent] = useState(false);
  const [jeton, setJeton] = useState<string | null>(null);
  const [cleTurnstile, setCleTurnstile] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const sectionInscription = useRef<HTMLDivElement>(null);

  const prix = grille?.[palier]?.[duree];

  // Tout changement de forfait invalide le Checkout déjà ouvert (autre price_id).
  const changerDuree = (d: Duree) => {
    setDuree(d);
    setClientSecret(null);
  };
  const choisir = (p: Palier) => {
    setPalier(p);
    setClientSecret(null);
    sectionInscription.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    const errs = valider(coord, REQUIS);
    setErreursChamps(errs);
    setErreurConsent(!consent);
    if (Object.keys(errs).length || !consent) {
      focusPremiereErreur(errs);
      return;
    }
    if (!jeton) {
      setErreur('Complète la vérification de sécurité juste au-dessus du bouton.');
      return;
    }
    if (!prix) return;

    setEnvoi(true);
    try {
      const { client_secret } = await checkoutPublic({
        price_id: prix.price_id,
        prenom: coord.prenom.trim(),
        nom: coord.nom.trim(),
        courriel: coord.courriel.trim(),
        telephone: coord.telephone.trim(),
        turnstile_token: jeton,
        utm: lireUtm(params),
      });
      setClientSecret(client_secret);
      requestAnimationFrame(() =>
        sectionInscription.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    } catch (err) {
      setErreur(err instanceof ErreurContinuite ? err.message : 'Un problème est survenu. Réessaie dans un instant.');
      // Le jeton Turnstile est à usage unique : on en demande un nouveau.
      setJeton(null);
      setCleTurnstile((n) => n + 1);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      {/* Héro */}
      <div className="bg-neo/10 pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <BandeauSimulation className="rounded-xl mb-5" />
          <div className="inline-flex items-center gap-2 bg-white border border-neo/30 text-neo-700 text-[11px] font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-5">
            NEO Continuité · Après ton programme
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[44px] leading-tight font-extrabold text-gray-900 mb-4">
            Tu as fait le travail. On t&apos;aide à garder tes résultats.
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            NEO Continuité garde en place ce qui fonctionne : ta naturopathe, Léo, l&apos;application, une
            rencontre de groupe et une carte-cadeau suppléments chaque mois. Tu choisis le niveau
            d&apos;accompagnement qui te convient.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        {/* Durée + paliers */}
        <section aria-labelledby="titre-forfaits" className="mt-10">
          <h2 id="titre-forfaits" className="sr-only">
            Les forfaits
          </h2>
          {erreurOffre ? (
            <MessageErreur message={erreurOffre} onReessayer={reessayer} />
          ) : !grille ? (
            <Chargement />
          ) : (
            <>
              <SelecteurDuree valeur={duree} onChange={changerDuree} rabais={rabais} />
              <div className="mt-10">
                <CartesPaliers grille={grille} duree={duree} selection={palier} onChoisir={choisir} />
              </div>
              <Conditions className="mt-8" />
            </>
          )}
        </section>

        {/* Inscription */}
        {grille && prix && (
          <section
            id="inscription"
            ref={sectionInscription}
            aria-labelledby="titre-inscription"
            className="mt-16 scroll-mt-28 max-w-2xl mx-auto"
          >
            <h2 id="titre-inscription" className="text-2xl font-extrabold text-gray-900 mb-2">
              Active ton forfait
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neo/[.07] border border-neo/25 px-5 py-4 mb-6">
              <p className="text-gray-800">
                <strong className="font-extrabold">{NOMS_PALIERS[palier]}</strong>
                <span className="text-gray-600"> · {DETAILS_DUREES[duree]}</span>
                <br />
                <span className="text-sm text-gray-600">
                  {argent(prix.montant_mensuel_cents)} par mois, + taxes
                </span>
              </p>
              {clientSecret && (
                <button
                  type="button"
                  onClick={() => setClientSecret(null)}
                  className="text-sm font-bold text-neo-700 hover:text-neo-600 underline underline-offset-2"
                >
                  Modifier mes informations
                </button>
              )}
            </div>

            {clientSecret ? (
              <CheckoutIntegre clientSecret={clientSecret} />
            ) : (
              <form onSubmit={soumettre} noValidate className="space-y-5">
                <ChampsCoordonnees
                  valeurs={coord}
                  erreurs={erreursChamps}
                  requis={REQUIS}
                  onChange={(cle, v) => setCoord((c) => ({ ...c, [cle]: v }))}
                />

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
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
                      className="w-[22px] h-[22px] min-w-[22px] mt-0.5 accent-neo cursor-pointer"
                    />
                    <span className="text-sm leading-relaxed text-gray-700">
                      J&apos;ai lu les conditions. Je comprends que mon forfait se renouvelle automatiquement
                      chaque mois et que, avec un engagement, il ne peut pas être annulé avant la fin de
                      l&apos;engagement.
                    </span>
                  </label>
                  {erreurConsent && (
                    <p id="consent-erreur" className="text-sm text-red-600 mt-1 ml-[34px]">
                      Coche cette case pour continuer.
                    </p>
                  )}
                </div>

                <Turnstile
                  key={cleTurnstile}
                  onJeton={setJeton}
                  onErreur={() =>
                    setErreur('La vérification de sécurité n’a pas pu se charger. Recharge la page et réessaie.')
                  }
                />

                <div aria-live="polite">{erreur && <MessageErreur message={erreur} />}</div>

                <button
                  type="submit"
                  disabled={envoi}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full bg-neo text-white shadow-[0_10px_15px_-3px_rgba(0,187,177,0.2)] hover:bg-neo-600 transition-colors disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neo"
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

        {/* Questions */}
        <section aria-labelledby="titre-questions" className="mt-16 max-w-3xl mx-auto">
          <h2 id="titre-questions" className="text-2xl font-extrabold text-gray-900 mb-6">
            Les questions qu&apos;on nous pose
          </h2>
          <div className="space-y-4">
            {QUESTIONS.map((item) => (
              <div key={item.q} className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.r}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-gray-400 mt-10 pb-16 max-w-3xl mx-auto leading-relaxed">
          Léo est un outil d&apos;accompagnement et ne remplace pas un avis médical ni le suivi de ta naturopathe.
          Les prix sont affichés par mois, avant taxes. Les taxes applicables sont calculées au paiement.
        </p>
      </div>
    </>
  );
};

export default Continuite;
