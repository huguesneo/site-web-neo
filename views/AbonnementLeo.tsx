'use client';
import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

type Plan = 'mensuel' | 'annuel';

const PLANS: Record<Plan, { label: string; price: string; unit: string; formTitle: string; formId: string; formName: string; height: number }> = {
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

const AbonnementLeo: React.FC = () => {
  const [plan, setPlan] = useState<Plan>('mensuel');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const current = PLANS[plan];
  const locked = !consent;

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
            <span className="absolute -top-3 left-7 bg-gray-900 text-white text-[11px] font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-full">
              2 mois gratuits
            </span>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Annuel</p>
              <span
                className={`box-border w-[22px] h-[22px] rounded-full shrink-0 transition-all ${
                  plan === 'annuel' ? 'border-[7px] border-neo bg-white' : 'border-2 border-gray-300 bg-white'
                }`}
              />
            </div>
            <div className="flex items-end gap-1.5 my-2">
              <span className="text-[34px] sm:text-[44px] font-extrabold tracking-tight">279,99 $</span>
              <span className="text-[15px] font-semibold text-gray-500 pb-2">/ an</span>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Renouvelé automatiquement chaque année. Équivaut à 23,33 $ par mois.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-700">
              <li className="flex gap-2.5"><span className="text-neo font-extrabold">✓</span>Accès complet à Léo dans l&apos;app</li>
              <li className="flex gap-2.5"><span className="text-neo font-extrabold">✓</span>Tu économises 79,89 $ par année</li>
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
            <h2 className="text-[22px] font-extrabold text-gray-900">{current.formTitle}</h2>
            <p className="text-[13px] text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-[15px] h-[15px] text-neo" strokeWidth={2.2} />
              Paiement sécurisé
            </p>
          </div>

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
