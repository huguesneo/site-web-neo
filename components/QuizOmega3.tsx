'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { HeartHandshake, Clock, Droplets, ShieldCheck, Search, Activity, ClipboardList } from 'lucide-react';
import MetaPixel, { trackCustom } from './rencontre/MetaPixel';
import { Wrap, Q, Opt, CTA, InsightCard, INPUT_CLASS } from './quiz-omega3/ui';
import {
  AGES, ACTIVITES, OBJECTIFS, POISSONS,
  calculerCible, profilDeCible, estSecurite, TAG_PROFIL, TAG_QUIZ,
  PRODUIT, TEXTE_POISSON, TEXTE_OBJECTIF, TEXTE_ACTIVITE, TEXTE_PROFIL,
  TEXTE_SECURITE, TEXTE_QUAND, TEXTE_USAGE_PROLONGE, TEXTE_CONSULTATION,
  AVERTISSEMENT, AVERTISSEMENT_PRODUIT, WEBHOOK_URL, CALENDRIER_URL,
  type Sexe, type TrancheAge, type OuiNon, type Anticoagulant,
  type Activite, type Objectif, type Poisson, type Profil,
} from '../lib/omega3Config';

// ─── Types ─────────────────────────────────────────────────────────────────────
type StepId =
  | 'intro' | 'sexe' | 'age' | 'mineur' | 'grossesse' | 'anticoag'
  | 'activite' | 'objectif' | 'poisson' | 'form' | 'results' | 'calendar';

interface Answers {
  sexe?: Sexe; age?: TrancheAge; enceinte?: OuiNon; anticoag?: Anticoagulant;
  activite?: Activite; objectif?: Objectif; poisson?: Poisson;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

// Le scénario Make insère ces valeurs dans un corps JSON : on retire guillemets,
// barres obliques inverses et sauts de ligne pour ne jamais casser l'envoi.
const clean = (s: string) => s.replace(/["\\\n\r\t]/g, '').trim().slice(0, 120);

const label = <T extends string>(list: { val: T; label: string }[], val?: T) =>
  list.find(o => o.val === val)?.label ?? '';

// Lien externe vers la fiche produit (garde le résultat ouvert dans l'onglet du quiz)
const ProductCard = ({ onClick }: { onClick: () => void }) => (
  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 mb-6">
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PRODUIT.image} alt={PRODUIT.nom} width={160} height={160}
        className="w-40 h-40 object-contain flex-shrink-0" loading="lazy" />
      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-xl font-extrabold text-gray-900">{PRODUIT.nom}</h3>
        <p className="text-neo font-black text-lg mt-1">{PRODUIT.prix}</p>
        <p className="text-gray-700 font-semibold mt-3">{PRODUIT.resume}</p>
        <p className="text-gray-500 text-sm font-medium mt-2">{PRODUIT.allegation}</p>
      </div>
    </div>
    <a href={PRODUIT.url} target="_blank" rel="noopener" onClick={onClick}
      className="mt-6 block w-full py-4 rounded-full border-2 border-neo text-neo text-center font-bold uppercase tracking-wide hover:bg-neo hover:text-white transition-all duration-200">
      Voir le produit →
    </a>
  </div>
);

// ─── Quiz Component ─────────────────────────────────────────────────────────────
const QuizOmega3: React.FC = () => {
  const [step, setStep] = useState<StepId>('intro');
  const [history, setHistory] = useState<StepId[]>(['intro']);
  const [animKey, setAnimKey] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [form, setForm] = useState({ prenom: '', email: '', tel: '', consentement: false });
  const [submitting, setSubmitting] = useState(false);
  const [utm, setUtm] = useState<Utm>({});

  // Paramètres UTM du lien (ex. ?utm_source=instagram), transmis à GHL et au calendrier
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const u: Utm = {};
    UTM_KEYS.forEach(k => { const v = p.get(k); if (v) u[k] = clean(v).slice(0, 100); });
    setUtm(u);
  }, []);

  const goTo = useCallback((next: StepId) => {
    setAnimKey(k => k + 1);
    setStep(next);
    setHistory(h => [...h, next]);
  }, []);

  const goBack = () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setHistory(h => h.slice(0, -1));
    setAnimKey(k => k + 1);
    setStep(prev);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [animKey]);

  // Barre de progression : la question grossesse n'existe que pour les femmes
  const questions: StepId[] = answers.sexe === 'Homme'
    ? ['sexe', 'age', 'anticoag', 'activite', 'objectif', 'poisson']
    : ['sexe', 'age', 'grossesse', 'anticoag', 'activite', 'objectif', 'poisson'];
  const qIdx = questions.indexOf(step);
  const inQuestions = qIdx >= 0;
  const progress = Math.round(((qIdx + 1) / questions.length) * 100);
  const showBack = inQuestions && history.length > 1;

  const pick = <K extends keyof Answers>(key: K, val: Answers[K], next: StepId) => {
    setAnswers(a => ({ ...a, [key]: val }));
    setTimeout(() => goTo(next), 300);
  };

  // ─── Résultat ────────────────────────────────────────────────────────────────
  // La réponse grossesse ne compte que pour une femme (si on revient changer le sexe)
  const enceinte = answers.sexe === 'Femme' ? answers.enceinte : undefined;
  const securite = estSecurite(enceinte, answers.anticoag);
  const cible = answers.poisson && answers.activite && answers.objectif
    ? calculerCible(answers.poisson, answers.activite, answers.objectif) : 0;
  const profil: Profil = securite ? 'securite' : profilDeCible(cible);

  const calendrierSrc = (() => {
    const p = new URLSearchParams(utm as Record<string, string>);
    const q = p.toString();
    return q ? `${CALENDRIER_URL}?${q}` : CALENDRIER_URL;
  })();

  const startQuiz = () => {
    trackCustom('QuizOmegaDebut');
    goTo('sexe');
  };

  const openConsultation = (origine: string) => {
    trackCustom('ClicConsultation', { origine, profil });
    goTo('calendar');
  };

  const clickProduit = () => trackCustom('ClicProduit', { profil });

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'quiz-omega3',
          firstName: clean(form.prenom),
          email: clean(form.email),
          phone: clean(form.tel),
          consentement_communications: form.consentement ? 'oui' : 'non',
          tag_quiz: TAG_QUIZ,
          tag_profil: TAG_PROFIL[profil],
          // Profil sécurité : aucune cible transmise (elle n'est pas affichée non plus)
          cible_omega_mg: securite ? '' : String(cible),
          profil_omega: profil === 'securite' ? 'securite' : `profil-${profil.toLowerCase()}`,
          poisson_semaine: answers.poisson ?? '',
          objectif_omega: label(OBJECTIFS, answers.objectif),
          activite: label(ACTIVITES, answers.activite),
          sexe: answers.sexe ?? '',
          tranche_age: answers.age ?? '',
          enceinte_allaitement: enceinte ?? '',
          anticoagulant_chirurgie: answers.anticoag ?? '',
          utm_source: utm.utm_source ?? '',
          utm_medium: utm.utm_medium ?? '',
          utm_campaign: utm.utm_campaign ?? '',
          utm_content: utm.utm_content ?? '',
        }),
      });
      window.fbq?.('track', 'Lead', { content_name: 'quiz-omega3' });
    } catch {
      // Même comportement que /quiz : on montre le résultat même si l'envoi échoue
    } finally {
      setSubmitting(false);
      goTo('results');
    }
  };

  const ConsultationBlock = ({ origine }: { origine: string }) => (
    <div className="bg-gray-900 rounded-3xl p-8 md:p-10 text-center shadow-xl mb-6">
      <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
        <HeartHandshake size={14} /> Gratuite · sans engagement
      </div>
      <p className="text-white text-lg md:text-xl font-bold leading-relaxed mb-6">{TEXTE_CONSULTATION}</p>
      <button onClick={() => openConsultation(origine)}
        className="w-full py-5 rounded-full bg-neo text-white font-bold text-lg uppercase tracking-wide shadow-xl shadow-neo/30 hover:bg-neo-600 hover:-translate-y-0.5 transition-all duration-200">
        Réserver ma consultation gratuite →
      </button>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <Wrap animKey={animKey}>
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-neo/10 text-neo px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <Droplets size={14} /> Quiz gratuit · 1 minute
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-[1.1]">
                Combien d&apos;oméga-3<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neo to-neo-600">devrais-tu prendre ?</span>
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed font-medium mb-8 max-w-md mx-auto">
                Réponds à 7 questions rapides et découvre ta cible quotidienne d&apos;EPA + DHA, selon ton alimentation, ton activité et ton objectif.
              </p>
              <div className="max-w-sm mx-auto">
                <CTA label="Commencer →" onClick={startQuiz} />
              </div>
              <p className="text-gray-400 text-sm font-medium mt-4">Conçu par l&apos;équipe de naturopathes NEO Performance</p>
            </div>
          </Wrap>
        );

      case 'sexe':
        return (
          <Wrap animKey={animKey}>
            <Q title="Tu es :" />
            <Opt label="Femme" onClick={() => pick('sexe', 'Femme', 'age')} />
            <Opt label="Homme" onClick={() => pick('sexe', 'Homme', 'age')} />
          </Wrap>
        );

      case 'age':
        return (
          <Wrap animKey={animKey}>
            <Q title="Ton âge :" />
            {AGES.map(a => (
              <Opt key={a} label={a} onClick={() => pick('age', a,
                a === 'Moins de 18 ans' ? 'mineur' : answers.sexe === 'Femme' ? 'grossesse' : 'anticoag')} />
            ))}
          </Wrap>
        );

      case 'mineur':
        return (
          <Wrap animKey={animKey}>
            <div className="text-center bg-white rounded-3xl p-8 shadow-xl border border-gray-50">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">Ce quiz s&apos;adresse aux adultes</h2>
              <p className="text-gray-600 font-medium leading-relaxed">
                Merci de ton intérêt. Les estimations de ce quiz sont conçues pour les personnes de 18 ans et plus.
                Pour toute question sur les oméga-3, parles-en à un professionnel de la santé.
              </p>
            </div>
          </Wrap>
        );

      case 'grossesse':
        return (
          <Wrap animKey={animKey}>
            <Q title="Es-tu enceinte, en train d'allaiter ou en essai de grossesse ?" />
            <Opt label="Oui" onClick={() => pick('enceinte', 'Oui', 'anticoag')} />
            <Opt label="Non" onClick={() => pick('enceinte', 'Non', 'anticoag')} />
          </Wrap>
        );

      case 'anticoag':
        return (
          <Wrap animKey={animKey}>
            <Q title="Prends-tu un anticoagulant ou as-tu une chirurgie prévue ?" sub="Par exemple : warfarine, Eliquis, Xarelto" />
            {(['Oui', 'Non', 'Je ne sais pas'] as Anticoagulant[]).map(v => (
              <Opt key={v} label={v} onClick={() => pick('anticoag', v, 'activite')} />
            ))}
          </Wrap>
        );

      case 'activite':
        return (
          <Wrap animKey={animKey}>
            <Q title="Ton niveau d'activité :" />
            {ACTIVITES.map(o => <Opt key={o.val} label={o.label} onClick={() => pick('activite', o.val, 'objectif')} />)}
          </Wrap>
        );

      case 'objectif':
        return (
          <Wrap animKey={animKey}>
            <Q title="Ton objectif principal :" />
            {OBJECTIFS.map(o => <Opt key={o.val} label={o.label} onClick={() => pick('objectif', o.val, 'poisson')} />)}
          </Wrap>
        );

      case 'poisson':
        return (
          <Wrap animKey={animKey}>
            <Q title="Combien de portions de poisson gras manges-tu par semaine ?" sub="Saumon, sardines, maquereau, truite" />
            {POISSONS.map(o => <Opt key={o.val} label={o.label} onClick={() => pick('poisson', o.val, 'form')} />)}
          </Wrap>
        );

      case 'form':
        return (
          <Wrap animKey={animKey}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-neo/10 text-neo px-4 py-2 rounded-full text-sm font-bold mb-4">
                ✅ Ton résultat est prêt.
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">Où est-ce qu&apos;on te l&apos;envoie ?</h2>
            </div>
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-50">
              <form onSubmit={submitForm} className="space-y-5">
                <div>
                  <label htmlFor="o3-prenom" className="block text-sm font-bold text-gray-700 mb-2">Prénom *</label>
                  <input id="o3-prenom" type="text" required autoComplete="given-name" value={form.prenom}
                    onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                    placeholder="Ton prénom" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="o3-email" className="block text-sm font-bold text-gray-700 mb-2">Courriel *</label>
                  <input id="o3-email" type="email" required autoComplete="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="ton.courriel@exemple.com" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="o3-tel" className="block text-sm font-bold text-gray-700 mb-2">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input id="o3-tel" type="tel" autoComplete="tel" value={form.tel}
                    onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
                    placeholder="(514) 123-4567" className={INPUT_CLASS} />
                </div>
                <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-600 font-medium leading-relaxed">
                  <input type="checkbox" checked={form.consentement}
                    onChange={e => setForm(f => ({ ...f, consentement: e.target.checked }))}
                    className="mt-1 w-5 h-5 flex-shrink-0 accent-[#00bbb1]" />
                  <span>
                    J&apos;accepte de recevoir des communications de NEO Performance (conseils, offres et rappels) par courriel et par texto. Je peux me désabonner en tout temps.
                  </span>
                </label>
                <CTA label={submitting ? 'Envoi en cours...' : 'Voir mon résultat →'} type="submit" disabled={submitting} />
                <p className="text-center text-gray-400 text-xs">
                  🔒 Données sécurisées et confidentielles · <a href="/politique-de-confidentialite" target="_blank" rel="noopener" className="underline">Politique de confidentialité</a>
                </p>
              </form>
            </div>
          </Wrap>
        );

      case 'results': {
        const prenom = form.prenom.trim();
        const pourquoi = answers.poisson && answers.objectif && answers.activite
          ? [TEXTE_POISSON[answers.poisson], TEXTE_OBJECTIF[answers.objectif], TEXTE_ACTIVITE[answers.activite]].filter(Boolean)
          : [];

        if (profil === 'securite') {
          return (
            <Wrap animKey={animKey} wide>
              <div className="text-center mb-8">
                <p className="text-neo font-black text-xs tracking-widest uppercase mb-3">Ton résultat</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                  {prenom ? `${prenom}, merci pour tes réponses.` : 'Merci pour tes réponses.'}
                </h1>
              </div>
              <div className="max-w-xl mx-auto mb-8">
                <InsightCard badge="Important" badgeColor="bg-[#f26457]">
                  <span className="flex items-start gap-3">
                    <ShieldCheck size={22} className="text-[#f26457] flex-shrink-0 mt-0.5" />
                    <span>{TEXTE_SECURITE}</span>
                  </span>
                </InsightCard>
              </div>
              <div className="bg-gray-900 rounded-3xl p-8 md:p-10 text-center shadow-xl mb-6">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  <HeartHandshake size={14} /> Gratuite · sans engagement
                </div>
                <p className="text-white text-lg md:text-xl font-bold leading-relaxed mb-6">
                  En consultation gratuite, un membre de notre équipe regarde ta situation avec toi.
                </p>
                <button onClick={() => openConsultation('securite')}
                  className="w-full py-5 rounded-full bg-neo text-white font-bold text-lg uppercase tracking-wide shadow-xl shadow-neo/30 hover:bg-neo-600 hover:-translate-y-0.5 transition-all duration-200">
                  Réserver ma consultation gratuite →
                </button>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed text-center max-w-2xl mx-auto mt-10">{AVERTISSEMENT}</p>
            </Wrap>
          );
        }

        const txt = TEXTE_PROFIL[profil];
        return (
          <Wrap animKey={animKey} wide>
            <div className="text-center mb-8">
              <p className="text-neo font-black text-xs tracking-widest uppercase mb-3">Ton résultat</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                {prenom ? `${prenom}, ta cible :` : 'Ta cible :'}<br/>
                <span className="text-neo">environ {cible.toLocaleString('fr-CA')} mg</span> d&apos;EPA + DHA par jour
              </h1>
            </div>

            {pourquoi.length > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-50 mb-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4">Pourquoi cette cible</h3>
                <p className="text-gray-700 font-medium leading-relaxed">{pourquoi.join(' ')}</p>
              </div>
            )}

            <div className="bg-neo/5 border border-neo/20 rounded-3xl p-6 md:p-8 mb-6">
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-2">{txt.titre}</h2>
              <p className="text-gray-700 font-semibold leading-relaxed">{txt.texte}</p>
            </div>

            {profil === 'C' && <ConsultationBlock origine="profil-c" />}

            <ProductCard onClick={clickProduit} />

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-50 mb-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={14} className="text-neo" /> Quand les prendre
              </h3>
              <p className="text-gray-700 font-medium leading-relaxed">{TEXTE_QUAND}</p>
              <p className="text-gray-700 font-medium leading-relaxed mt-3">
                {TEXTE_USAGE_PROLONGE}{' '}
                <button onClick={() => openConsultation('usage-prolonge')} className="text-neo font-bold underline underline-offset-4">
                  Réserver ma consultation gratuite
                </button>
              </p>
            </div>

            {profil !== 'C' && <ConsultationBlock origine={`profil-${profil.toLowerCase()}`} />}

            <p className="text-gray-400 text-xs leading-relaxed text-center max-w-2xl mx-auto mt-10">
              {AVERTISSEMENT} {AVERTISSEMENT_PRODUIT}
            </p>
          </Wrap>
        );
      }

      case 'calendar':
        return (
          <Wrap animKey={animKey} wide>
            <button onClick={goBack}
              className="mb-6 flex items-center gap-1.5 text-gray-400 hover:text-neo text-sm font-semibold transition-colors">
              ← Retour à mon résultat
            </button>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-neo/10 text-neo px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <HeartHandshake size={14} /> Gratuite · sans engagement
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">Réserve ta consultation gratuite</h2>
              <p className="text-gray-500 font-medium max-w-lg mx-auto">
                45 minutes avec un membre de notre équipe pour faire le point sur ton stress, ta digestion et tes hormones.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Search, t: 'On fait le point', d: 'Ton alimentation, ton énergie, ton sommeil et ce que tu prends déjà.' },
                { icon: Activity, t: 'On regarde ton profil', d: 'Ton stress, ta digestion et tes hormones, pour comprendre ce qui freine ton corps.' },
                { icon: ClipboardList, t: 'Tu sais par où commencer', d: 'Les prochaines étapes claires pour toi. Aucune pression.' },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left">
                  <div className="w-10 h-10 rounded-xl bg-neo/10 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-neo" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{t}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed font-medium">{d}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100" style={{ height: 680 }}>
              <iframe src={calendrierSrc}
                style={{ width: '100%', height: '100%', border: 'none' }}
                scrolling="yes" title="Réservation NEO" />
            </div>
            <p className="text-center text-gray-400 text-sm mt-4 font-medium flex items-center justify-center gap-1.5">
              <Clock size={14} className="text-neo" /> 45 min · en ligne ou par téléphone · 0 $
            </p>
          </Wrap>
        );

      default: return null;
    }
  };

  return (
    <div className="pt-6 md:pt-10 pb-20">
      <MetaPixel />
      {inQuestions && (
        <div className="max-w-xl mx-auto px-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-neo rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }} />
          </div>
          {showBack && (
            <button onClick={goBack}
              className="mt-4 flex items-center gap-1.5 text-gray-400 hover:text-neo text-sm font-semibold transition-colors">
              ← Retour
            </button>
          )}
        </div>
      )}

      <div className="py-8 md:py-10">
        {renderStep()}
      </div>
    </div>
  );
};

export default QuizOmega3;
