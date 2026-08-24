'use client';
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, Copy } from 'lucide-react';

type Plan = 'mensuel' | 'annuel';

/*
  Promo annuelle : 199,99 $ au lieu de 279,99 $ avec le code LEO.
  Elle se coupe d'elle-même le vendredi 28 août 2026 à 23 h 59, heure de l'Est
  (-04:00 = EDT). Passé ce moment, la bannière, le prix barré, le compte à
  rebours et le rappel du code promo disparaissent sans intervention manuelle,
  et le prix annuel redevient 279,99 $ partout sur la page.
*/
const PROMO_END = new Date('2026-08-28T23:59:59-04:00');
const PROMO_CODE = 'LEO';

type PlanConfig = {
  label: string;
  price: string;
  unit: string;
  formTitle: string;
  formId: string;
  formName: string;
  height: number;
};

const PLANS: Record<Plan, PlanConfig> = {
  mensuel: {
    label: 'Mensuel',
    price: '29,99 $',
    unit: '/ mois',
    formTitle: 'Abonnement mensuel — 29,99 $ / mois',
    formId: '3VzFi4tJm3NevuuujjSo',
    formName: 'Léo mensuel',
    height: 683,
  },
  annuel: {
    label: 'Annuel',
    price: '279,99 $',
    unit: '/ an',
    formTitle: 'Abonnement annuel — 279,99 $ / an',
    formId: 'zoopPpxfWYt7sytvGuEj',
    formName: 'Léo annuel',
    height: 680,
  },
};

const PROMO_ANNUAL_PRICE = '199,99 $';

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days} j ${hours} h ${minutes} min`;
  return `${hours} h ${minutes} min ${seconds} s`;
}

/*
  Le rendu serveur part toujours de « promo inactive » (remaining = null) :
  l'horloge du serveur et celle du navigateur ne coïncident pas forcément, et
  un calcul fait au rendu provoquerait un écart d'hydratation. La promo
  s'affiche donc au premier effet, côté client seulement.
*/
function usePromoCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(PROMO_END.getTime() - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return {
    promoActive: remaining !== null && remaining > 0,
    countdown: formatCountdown(remaining ?? 0),
  };
}

const PromoCodeCallout: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers refusé (http, permissions) : le code reste lisible et
      // sélectionnable à l'écran, donc on ne bloque rien.
    }
  };

  return (
    <div className="mb-5 rounded-2xl border-2 border-dashed border-neo bg-neo/[.07] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-extrabold tracking-wider uppercase text-neo-700 mb-1">
            N&apos;oublie pas ton code promo
          </p>
          <p className="text-sm text-gray-700 leading-relaxed max-w-[460px]">
            Inscris le code ci-contre dans le champ <strong className="font-bold">« Code promo »</strong> du formulaire pour payer {PROMO_ANNUAL_PRICE} au lieu de {PLANS.annuel.price}.
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2.5 bg-white border-2 border-neo rounded-xl px-5 py-3 shadow-sm hover:bg-neo/5 transition-colors"
          aria-label={`Copier le code promo ${PROMO_CODE}`}
        >
          <span className="text-2xl font-extrabold tracking-[0.18em] text-gray-900">{PROMO_CODE}</span>
          {copied
            ? <Check className="w-[18px] h-[18px] text-neo" strokeWidth={2.6} />
            : <Copy className="w-[18px] h-[18px] text-gray-400" strokeWidth={2.2} />}
        </button>
      </div>
      {copied && <p className="text-xs font-semibold text-neo-700 mt-2.5">Code copié !</p>}
    </div>
  );
};

const AbonnementLeo: React.FC = () => {
  const [plan, setPlan] = useState<Plan>('mensuel');
  const [consent, setConsent] = useState(false);
  const { promoActive, countdown } = usePromoCountdown();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const current = PLANS[plan];
  const locked = !consent;
  const annualPromo = promoActive && plan === 'annuel';
  const formTitle = annualPromo
    ? `Abonnement annuel — ${PROMO_ANNUAL_PRICE} / an avec le code ${PROMO_CODE}`
    : current.formTitle;

  return (
    <>
      {/* Hero */}
      <div className="bg-neo/10 pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-neo/30 text-neo-700 text-[11px] font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-5">
            Accès Léo · Assistant métabolique IA
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[44px] leading-tight font-extrabold text-gray-900 mb-4">
            Réactive ton accès à Léo
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Ton naturopathe IA, disponible 24/7 dans l&apos;application NEO. Choisis ta formule, active ton abonnement, et Léo se rallume immédiatement.
          </p>

          {promoActive && (
            <div className="mt-8 text-left sm:text-center bg-gray-900 text-white rounded-[20px] px-6 py-6 shadow-[0_24px_45px_-22px_rgba(0,0,0,0.55)]">
              <span className="inline-flex items-center bg-neo text-white text-[11px] font-extrabold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full mb-3.5">
                Offre limitée
              </span>
              <p className="text-[19px] sm:text-[22px] font-extrabold leading-snug">
                Abonnement annuel à <span className="text-neo">{PROMO_ANNUAL_PRICE}</span>{' '}
                <span className="text-gray-400 font-bold line-through">{PLANS.annuel.price}</span>
              </p>
              <p className="text-sm text-gray-300 leading-relaxed mt-2.5">
                Avec le code promo <strong className="text-white font-extrabold tracking-[0.14em]">{PROMO_CODE}</strong> à inscrire dans le formulaire de paiement.
              </p>
              <p className="text-[13px] font-semibold text-gray-400 mt-3.5">
                Se termine vendredi 23 h 59 · il reste <span className="text-white tabular-nums">{countdown}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4">
        {/* Plan picker */}
        <div className="grid gap-5 sm:grid-cols-2 mt-10">
          <button
            type="button"
            onClick={() => setPlan('mensuel')}
            className={`relative text-left bg-white rounded-[20px] p-6 transition-all ${
              plan === 'mensuel'
                ? 'border-2 border-neo shadow-[0_20px_40px_-18px_rgba(0,187,177,0.45)]'
                : 'border-2 border-gray-200 shadow-sm'
            }`}
          >
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Mensuel</p>
              <span
                className={`box-border w-[22px] h-[22px] rounded-full shrink-0 transition-all ${
                  plan === 'mensuel' ? 'border-[7px] border-neo bg-white' : 'border-2 border-gray-300 bg-white'
                }`}
              />
            </div>
            <div className="flex items-end gap-1.5 my-2">
              <span className="text-[34px] sm:text-[44px] font-extrabold tracking-tight">29,99 $</span>
              <span className="text-[15px] font-semibold text-gray-500 pb-2">/ mois</span>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Renouvelé automatiquement chaque mois. Annulable en tout temps.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-700">
              <li className="flex gap-2.5"><span className="text-neo font-extrabold">✓</span>Accès complet à Léo dans l&apos;app</li>
              <li className="flex gap-2.5"><span className="text-neo font-extrabold">✓</span>Aucun engagement</li>
            </ul>
          </button>

          <button
            type="button"
            onClick={() => setPlan('annuel')}
            className={`relative text-left bg-white rounded-[20px] p-6 transition-all ${
              plan === 'annuel'
                ? 'border-2 border-neo shadow-[0_20px_40px_-18px_rgba(0,187,177,0.45)]'
                : 'border-2 border-gray-200 shadow-sm'
            }`}
          >
            <span
              className={`absolute -top-3 left-7 text-white text-[11px] font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-full ${
                promoActive ? 'bg-neo' : 'bg-gray-900'
              }`}
            >
              {promoActive ? 'Promo · 80 $ de rabais' : '2 mois gratuits'}
            </span>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Annuel</p>
              <span
                className={`box-border w-[22px] h-[22px] rounded-full shrink-0 transition-all ${
                  plan === 'annuel' ? 'border-[7px] border-neo bg-white' : 'border-2 border-gray-300 bg-white'
                }`}
              />
            </div>
            <div className="flex items-end gap-2 my-2 flex-wrap">
              {promoActive && (
                <span className="text-[22px] sm:text-[26px] font-bold text-gray-400 line-through pb-1.5">
                  {PLANS.annuel.price}
                </span>
              )}
              <span className="text-[34px] sm:text-[44px] font-extrabold tracking-tight">
                {promoActive ? PROMO_ANNUAL_PRICE : PLANS.annuel.price}
              </span>
              <span className="text-[15px] font-semibold text-gray-500 pb-2">/ an</span>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              {promoActive
                ? 'Renouvelé automatiquement chaque année. Équivaut à 16,67 $ par mois.'
                : 'Renouvelé automatiquement chaque année. Équivaut à 23,33 $ par mois.'}
            </p>
            <ul className="space-y-2.5 text-sm text-gray-700">
              <li className="flex gap-2.5"><span className="text-neo font-extrabold">✓</span>Accès complet à Léo dans l&apos;app</li>
              <li className="flex gap-2.5">
                <span className="text-neo font-extrabold">✓</span>
                {promoActive ? 'Tu économises 159,89 $ vs le mensuel' : 'Tu économises 79,89 $ par année'}
              </li>
              {promoActive && (
                <li className="flex gap-2.5">
                  <span className="text-neo font-extrabold">✓</span>
                  <span>
                    Code promo <strong className="font-extrabold tracking-[0.12em]">{PROMO_CODE}</strong> à inscrire dans le formulaire
                  </span>
                </li>
              )}
            </ul>
          </button>
        </div>

        {/* Consent */}
        <div className="mt-7 border border-gray-200 rounded-2xl p-5 sm:p-6 bg-gray-50">
          <label className="flex items-start gap-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-[22px] h-[22px] min-w-[22px] mt-0.5 accent-neo cursor-pointer"
            />
            <span className="text-sm leading-relaxed text-gray-700">
              Je comprends qu&apos;il s&apos;agit d&apos;un <strong className="font-bold">abonnement à renouvellement automatique</strong> : le montant choisi sera prélevé sur ma carte à chaque période de facturation, jusqu&apos;à ce que j&apos;annule. Je peux annuler en tout temps en écrivant à{' '}
              <a href="mailto:info@neoperformance.ca" className="text-neo hover:text-neo-600">info@neoperformance.ca</a> — l&apos;annulation prend effet à la fin de la période déjà payée.
            </span>
          </label>
        </div>

        {/* Form */}
        <div className="mt-7 pb-16">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <h2 className="text-[22px] font-extrabold text-gray-900">{formTitle}</h2>
            <p className="text-[13px] text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-[15px] h-[15px] text-neo" strokeWidth={2.2} />
              Paiement sécurisé
            </p>
          </div>

          {annualPromo && <PromoCodeCallout />}

          <div className="relative bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
            <div className={locked ? 'pointer-events-none blur-[3px] opacity-50 transition-all' : 'transition-all'}>
              {/*
                Les deux iframes restent montées en permanence et on bascule leur
                visibilité en CSS. form_embed.js de GHL réenveloppe chaque iframe
                dans ses propres divs au chargement ; si on démonte/remonte
                l'iframe sélectionnée via le rendu conditionnel de React, React
                perd la référence au nœud (déplacé par le script) et plante avec
                "Failed to execute 'removeChild' on 'Node'" au changement de plan.
              */}
              {(Object.keys(PLANS) as Plan[]).map((key) => (
                // Visibilité portée par ce div, pas par l'iframe : le script GHL pose
                // un style inline `display` directement sur l'iframe, qui l'emporterait
                // sur la classe Tailwind `hidden` (spécificité du style inline).
                <div key={PLANS[key].formId} className={key === plan ? 'block' : 'hidden'}>
                  <iframe
                    src={`https://api.leadconnectorhq.com/widget/form/${PLANS[key].formId}`}
                    id={`inline-${PLANS[key].formId}`}
                    data-layout="{'id':'INLINE'}"
                    data-trigger-type="alwaysShow"
                    data-trigger-value=""
                    data-activation-type="alwaysActivated"
                    data-activation-value=""
                    data-deactivation-type="neverDeactivate"
                    data-deactivation-value=""
                    data-form-name={PLANS[key].formName}
                    data-height={PLANS[key].height}
                    data-layout-iframe-id={`inline-${PLANS[key].formId}`}
                    data-form-id={PLANS[key].formId}
                    title={PLANS[key].formName}
                    className="w-full border-none h-[700px] block"
                  />
                </div>
              ))}
            </div>

            {locked && (
              // Le formulaire GHL se redimensionne selon son propre contenu (souvent
              // bien plus grand que 700px une fois chargé) : un overlay centré dans
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

          {annualPromo && (
            <p className="text-sm font-semibold text-gray-700 mt-4 leading-relaxed">
              Rappel : sans le code <strong className="font-extrabold tracking-[0.12em]">{PROMO_CODE}</strong>, le formulaire facture le tarif régulier de {PLANS.annuel.price}.
            </p>
          )}

          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Léo est un outil d&apos;accompagnement et ne remplace pas un avis médical ni le suivi de ton naturopathe. Taxes applicables incluses au moment du paiement.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 border-t border-gray-100 py-14 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-extrabold text-center mb-8">Ce que Léo fait pour toi</h2>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="bg-white border border-gray-100 rounded-2xl p-7">
              <h3 className="text-base font-bold mb-2">Répond selon ton dossier réel</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Léo connaît ta stratégie alimentaire, tes notes de suivi et tes tests. Pas des conseils génériques comme ChatGPT.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-7">
              <h3 className="text-base font-bold mb-2">Recettes et équivalences alimentaires</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Un aliment à remplacer ou une recette qui respecte ton plan ? Réponse immédiate, alignée à ta stratégie.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-7">
              <h3 className="text-base font-bold mb-2">Disponible 24/7, sans attendre ton RDV</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Un naturopathe dans ta poche entre deux rencontres avec ton équipe clinique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AbonnementLeo;
