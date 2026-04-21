'use client';
import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type StepId =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  | 'int1' | 'int2' | 'int3'
  | 'loading' | 'form' | 'results' | 'roadmap' | 'value-non' | 'calendar';

interface Answers {
  q1?: string; q2?: string; q3?: string; q4?: string;
  q5: string[]; q6?: string; q7?: string; q8?: string; q9?: string;
  q10: string[]; q11?: string;
  worstBlockName?: string;
}

interface Metrics { effScore: number; cortisol: number; digestion: number; hormones: number; }

const S = '#f26457'; // secondary / coral

// ─── Sous-composants extraits (Correction du bug de Focus) ────────────────────

const Wrap = ({ wide, children, animKey }: { wide?: boolean; children: React.ReactNode; animKey?: number }) => (
  <div key={animKey} className={`mx-auto px-4 animate-fade-in-up ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
    {children}
  </div>
);

const Opt = ({ label, sub, onClick }: { label: string; sub?: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-6 py-5 rounded-2xl border-2 border-gray-100 bg-white
               hover:border-neo hover:bg-neo/5 hover:shadow-lg transition-all duration-200
               font-semibold text-gray-800 hover:text-neo group flex items-center justify-between mb-3"
  >
    <span className="flex-1 leading-snug">
      {label}
      {sub && <span className="block text-sm text-gray-400 font-medium mt-0.5">{sub}</span>}
    </span>
    <span className="text-gray-300 group-hover:text-neo transition-colors ml-4 text-xl flex-shrink-0">→</span>
  </button>
);

const Multi = ({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all duration-200
                font-semibold flex items-center justify-between mb-3 ${
      checked
        ? 'border-neo bg-neo/5 text-neo shadow-[0_0_0_4px_rgba(0,187,177,0.08)]'
        : 'border-gray-100 bg-white text-gray-800 hover:border-gray-200 hover:shadow-md'
    }`}
  >
    <span className="flex-1 leading-snug">{label}</span>
    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ml-4 transition-all ${
      checked ? 'bg-neo border-neo' : 'border-gray-300'
    }`}>
      {checked && <span className="text-white text-[11px] font-black">✓</span>}
    </div>
  </button>
);

const CTA = ({ label, onClick, type = 'button', disabled, sub }: {
  label: string; onClick?: () => void; type?: 'button' | 'submit';
  disabled?: boolean; sub?: string;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="w-full py-5 rounded-full bg-neo text-white font-bold text-lg uppercase tracking-wide
               shadow-lg shadow-neo/30 hover:bg-neo-600 hover:-translate-y-0.5
               transition-all duration-200 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
  >
    {label}
    {sub && <span className="block text-xs font-semibold tracking-wider mt-1 opacity-80">{sub}</span>}
  </button>
);

const PulseOrb = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-center mb-6">
    <div className="w-16 h-16 rounded-full bg-neo/10 flex items-center justify-center animate-pulse-slow">
      {children}
    </div>
  </div>
);

const InsightCard = ({ badge, badgeColor = 'bg-gray-900', children }: {
  badge: string; badgeColor?: string; children: React.ReactNode;
}) => (
  <div className="relative bg-white border border-gray-100 rounded-2xl p-6 pt-8 mt-6 shadow-lg text-left">
    <span className={`absolute -top-3 left-5 ${badgeColor} text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase`}>
      {badge}
    </span>
    <div className="text-gray-900 font-semibold text-base leading-relaxed">{children}</div>
  </div>
);

const Revealed = ({ on, children }: { on: boolean; children: React.ReactNode }) => (
  <div className={`transition-all duration-700 ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}>
    {children}
  </div>
);


// ─── Quiz Component ─────────────────────────────────────────────────────────────
const Quiz: React.FC = () => {
  const [step, setStep] = useState<StepId>(0);
  const [history, setHistory] = useState<StepId[]>([0]);
  const [animKey, setAnimKey] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ q5: [], q10: [] });
  const [metrics, setMetrics] = useState<Metrics>({ effScore: 100, cortisol: 5, digestion: 5, hormones: 5 });

  const [int1Text, setInt1Text] = useState('');
  const [int1Revealed, setInt1Revealed] = useState(false);
  const [int2Text, setInt2Text] = useState('');
  const [int2Revealed, setInt2Revealed] = useState(false);
  const [int3Text, setInt3Text] = useState('');
  const [int3Revealed, setInt3Revealed] = useState(false);

  const [loadingIdx, setLoadingIdx] = useState(-1);
  const [displayScore, setDisplayScore] = useState(0);
  const [barsOn, setBarsOn] = useState(false);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', tel: '' });
  const [submitting, setSubmitting] = useState(false);

  const [userCount] = useState(() => {
    const h = new Date().getHours();
    if (h < 6) return Math.floor(Math.random() * 4) + 2;
    if (h < 12) return Math.floor(Math.random() * 16) + 15;
    return Math.floor(Math.random() * 21) + 25;
  });

  const goTo = useCallback((next: StepId) => {
    setAnimKey(k => k + 1);
    setStep(next);
    setHistory(h => [...h, next]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setHistory(h => h.slice(0, -1));
    setAnimKey(k => k + 1);
    setStep(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const progressMap: Record<string, number> = {
    '0': 0, '1': 1, '2': 2, 'int1': 3, '3': 4, '4': 5, '5': 6,
    'int2': 7, '6': 8, '7': 9, '8': 10, '9': 11, 'int3': 12,
    '10': 13, '11': 14, 'loading': 15, 'form': 16,
    'results': 17, 'roadmap': 18, 'value-non': 18, 'calendar': 19,
  };
  const progress = Math.round(((progressMap[String(step)] ?? 0) / 19) * 100);
  const showBack = history.length > 1 && !['results', 'roadmap', 'calendar', 'value-non'].includes(String(step)) && step !== 0;

  const pick = (key: keyof Answers, val: string, next: StepId, cb?: () => void) => {
    setAnswers(a => ({ ...a, [key]: val }));
    cb?.();
    setTimeout(() => goTo(next), 300);
  };

  const toggleQ5 = (val: string) =>
    setAnswers(a => {
      if (val === 'F') return { ...a, q5: ['F'] };
      const arr = a.q5.filter(v => v !== 'F');
      return { ...a, q5: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });

  const toggleQ10 = (val: string) =>
    setAnswers(a => {
      if (val === 'Rien') return { ...a, q10: ['Rien'] };
      const arr = a.q10.filter(v => v !== 'Rien');
      return { ...a, q10: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });

  const showInt1 = (age: string) => {
    setInt1Revealed(false);
    goTo('int1');
    setTimeout(() => {
      setInt1Text(
        answers.q1 === 'Femme' && ['25-35', '36-50'].includes(age)
          ? "80% des 15 000 femmes que nous aidons se trouvent exactement dans ta tranche d'âge. C'est la période précise où les règles du jeu métabolique changent silencieusement."
          : "L'algorithme a ciblé ton groupe démographique. Parmi nos 15 000 profils analysés, ton groupe traverse des adaptations métaboliques uniques — très souvent ignorées."
      );
      setInt1Revealed(true);
    }, 1300);
  };

  const showInt2 = (q5: string[]) => {
    setInt2Revealed(false);
    let msg = '';
    if (answers.q3 === 'A' || q5.includes('C'))
      msg = "La fatigue ressentie dès le réveil n'est pas de la paresse. C'est la preuve biologique d'un métabolisme qui tourne au ralenti, même après une nuit de repos.";
    else if (['A', 'B'].includes(answers.q4 || '') || q5.includes('D'))
      msg = "Ton sommeil altéré et ton cerveau hyperactif le soir indiquent que ton système nerveux est bloqué en mode alerte permanent.";
    else if (q5.includes('A') || q5.includes('E'))
      msg = "La charge mentale constante et ton mode « go go go » saturent tes surrénales, ordonnant à ton corps de stocker l'énergie au lieu de la brûler.";
    else if (answers.q3 === 'B' || q5.includes('B'))
      msg = "Les crashs d'énergie et tes rages de sucre sont les signes clairs de montagnes russes glycémiques qui épuisent tes réserves métaboliques.";
    else
      msg = "Les signaux que tu as sélectionnés sont les preuves directes d'un métabolisme qui s'est mis en mode survie pour se protéger.";
    setInt2Text(msg);
    setTimeout(() => setInt2Revealed(true), 1300);
  };

  const submitQ5 = () => {
    if (!answers.q5.length) return;
    if (answers.q5.includes('F') && answers.q3 === 'C' && answers.q4 === 'D') { goTo(6); return; }
    showInt2(answers.q5);
    goTo('int2');
  };

  const showInt3 = (transit: string) => {
    setInt3Revealed(false);
    const hasIssue = answers.q7 === 'Souvent' || answers.q7 === 'Parfois' || transit === 'Non';
    setInt3Text(
      hasIssue
        ? "Tes réponses digestives pointent vers un métabolisme qui ne sait plus traiter l'énergie correctement. Quand l'assimilation est bloquée par l'inflammation, même une alimentation parfaite sera stockée plutôt que convertie."
        : "Ta digestion semble bien fonctionner, mais tes autres signaux pointent vers un verrouillage métabolique de sécurité. Quand le corps est sous tension, même une alimentation parfaite est redirigée vers le stockage de graisse."
    );
    setTimeout(() => setInt3Revealed(true), 1300);
  };

  const calcMetrics = (ans: Answers): Metrics & { worst: string } => {
    let base = 100, c = 5, d = 5, h = 5;
    if (ans.q3 === 'A') { base -= 18; c += 35; }
    if (ans.q3 === 'B') { base -= 9; c += 20; }
    if (ans.q4 === 'A') { base -= 12; c += 25; h += 15; }
    if (ans.q4 === 'B') { base -= 10; c += 20; }
    if (ans.q4 === 'C') { base -= 12; c += 10; d += 15; }
    if (ans.q5.includes('A')) { base -= 8; c += 25; }
    if (ans.q5.includes('B')) { base -= 6; d += 15; h += 10; }
    if (ans.q5.includes('C')) { base -= 8; c += 15; }
    if (ans.q6 === 'Ventre') { base -= 12; c += 35; h += 10; }
    if (ans.q6 === 'Diffuse') { base -= 5; h += 25; }
    if (ans.q7 === 'Souvent') { base -= 15; d += 50; }
    if (ans.q7 === 'Parfois') { base -= 6; d += 20; }
    if (ans.q8 === 'Oui') { base -= 10; h += 45; }
    if (ans.q9 === 'Non') { base -= 12; d += 40; }
    const blocks = [
      { name: 'Cortisol (Stress)', score: Math.min(95, c) },
      { name: 'Système Digestif', score: Math.min(95, d) },
      { name: 'Système Hormonal', score: Math.min(95, h) },
    ].sort((a, b) => b.score - a.score);
    return {
      effScore: Math.max(14, Math.floor(base)),
      cortisol: Math.min(95, c),
      digestion: Math.min(95, d),
      hormones: Math.min(95, h),
      worst: blocks[0].name,
    };
  };

  useEffect(() => {
    if (step !== 'loading') return;
    const { worst, ...m } = calcMetrics(answers);
    setMetrics(m);
    setAnswers(a => ({ ...a, worstBlockName: worst }));
    setLoadingIdx(-1);
    let i = 0;
    const t = setInterval(() => {
      setLoadingIdx(i++);
      if (i > 5) { clearInterval(t); setTimeout(() => goTo('form'), 600); }
    }, 850);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (step !== 'results') return;
    setDisplayScore(0); setBarsOn(false);
    let cur = 0;
    const t = setInterval(() => { cur++; setDisplayScore(cur); if (cur >= metrics.effScore) clearInterval(t); }, 15);
    setTimeout(() => setBarsOn(true), 700);
    return () => clearInterval(t);
  }, [step, metrics.effScore]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('https://hook.us1.make.com/6k7ic1ap46l2ye5vdhox2r5whn4qxd53', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.prenom, lastName: form.nom,
          email: form.email, phone: form.tel,
          q_sexe: answers.q1, q_age: answers.q2, q_energie: answers.q3,
          q_sommeil: answers.q4, q_symptomes: answers.q5.join(', '),
          q_poids: answers.q6, q_ballonnements: answers.q7,
          q_fragilite: answers.q8, q_selle: answers.q9,
          q_impact: answers.q10.join(', '), q_objectif: answers.q11,
          score_efficacite: metrics.effScore + '%',
          pire_blocage: answers.worstBlockName || 'Aucun',
        }),
      });
    } finally {
      goTo('results');
    }
  };

  const isGood = metrics.effScore >= 80;
  const worst = answers.worstBlockName || 'Cortisol (Stress)';
  const blockDesc: Record<string, string> = {
    'Cortisol (Stress)': "Le cortisol élevé est ton frein principal. Il bloque l'oxydation des graisses et maintient ton corps en mode survie perpétuel.",
    'Système Digestif': "L'inflammation digestive est ton frein. Une mauvaise assimilation t'empêche de convertir la nourriture en énergie.",
    'Système Hormonal': "Le dérèglement hormonal est ton frein. Ton corps ne reçoit plus le bon signal cellulaire pour brûler l'énergie.",
  };
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const target15w = new Date(Date.now() + 15 * 7 * 86400000);
  const targetMonth = `${months[target15w.getMonth()]} ${target15w.getFullYear()}`;
  const goalLabel: Record<string, string> = {
    'Perte de poids': 'perte de poids durable',
    'Réduire le stress': 'sérénité mentale',
    'Améliorer mon énergie': 'vitalité absolue',
    'Améliorer ma digestion': 'confort digestif optimal',
  };
  const fomoData = () => {
    const n = Math.floor(Math.random() * 4) + 3;
    if (isGood) return { profile: 'MÉTABOLISME OPTIMAL', text: `Ton profil est rare — seulement ${n} personnes ont obtenu ce score ce mois-ci.`, urgency: 'Nous avons 1 place en accompagnement haute performance.' };
    if (worst.includes('Cortisol')) return { profile: 'RÉSISTANCE AU CORTISOL', text: `Ton corps réagit exactement comme ${n+2} autres personnes cette semaine. C'est notre expertise #1 en clinique.`, urgency: "L'équipe peut prendre 1 seul profil similaire cette semaine." };
    if (worst.includes('Digestif')) return { profile: 'INFLAMMATION DIGESTIVE', text: `${n} personnes avec tes signaux exacts ont consulté nos naturopathes dans les 6 derniers jours.`, urgency: "L'équipe peut prendre 1 seul profil similaire cette semaine." };
    return { profile: 'RALENTISSEMENT HORMONAL', text: `Notre équipe clinique a accompagné la même signature hormonale chez ${n+1} clientes ce mois-ci.`, urgency: "L'équipe peut prendre 1 seul profil similaire cette semaine." };
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Wrap animKey={animKey}>
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-full text-sm font-bold mb-6">
                🔥 {userCount} personnes font cette analyse actuellement
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                Décrypte ton<br/>
                <span className="text-neo">code métabolique</span>
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed font-medium mb-8 max-w-md mx-auto">
                Comprends pourquoi ton corps résiste et découvre exactement ce qui bloque tes résultats — en moins de 3 minutes.
              </p>
              <CTA label="Démarrer mon analyse →" onClick={() => goTo(1)} />
              <p className="text-gray-400 text-sm mt-4 font-medium">🔒 Gratuit · Confidentiel · 3 minutes</p>
            </div>
          </Wrap>
        );

      case 1:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-2">Quel est ton sexe biologique ?</h2>
            <p className="text-gray-500 text-center font-medium mb-8">Nécessaire pour calculer tes variations hormonales.</p>
            <Opt label="Féminin" onClick={() => pick('q1', 'Femme', 2)} />
            <Opt label="Masculin" onClick={() => pick('q1', 'Homme', 2)} />
          </Wrap>
        );

      case 2:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-2">Dans quelle tranche d'âge te situes-tu ?</h2>
            <p className="text-gray-500 text-center font-medium mb-8">L'âge influence directement ton profil métabolique.</p>
            {[['18 - 24 ans', '18-24'], ['25 - 35 ans', '25-35'], ['36 - 50 ans', '36-50'], ['51 - 65 ans', '51-65'], ['66 ans et +', '66+']].map(([label, val]) => (
              <Opt key={val} label={label} onClick={() => { setAnswers(a => ({ ...a, q2: val })); showInt1(val); }} />
            ))}
          </Wrap>
        );

      case 'int1':
        return (
          <Wrap animKey={animKey}>
            <PulseOrb>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00bbb1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </PulseOrb>
            <p className={`text-xl font-black uppercase tracking-wider text-center mb-6 transition-colors duration-500 ${int1Revealed ? 'text-neo' : 'text-gray-300'}`}>
              {int1Revealed ? "Tu n'es pas la seule." : 'Recherche de profils similaires...'}
            </p>
            <Revealed on={int1Revealed}>
              <p className="text-gray-600 leading-relaxed font-medium text-center mb-6 text-base">{int1Text}</p>
              <CTA label="Analyser les signaux de mon corps →" onClick={() => goTo(3)} />
            </Revealed>
          </Wrap>
        );

      case 3:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8">Comment décrirais-tu ton niveau d'énergie actuel ?</h2>
            <Opt label="Je me sens fatiguée une bonne partie de la journée" onClick={() => pick('q3', 'A', 4)} />
            <Opt label="Ça va, mais j'ai un crash en après-midi" onClick={() => pick('q3', 'B', 4)} />
            <Opt label="J'ai de l'énergie du matin au soir" onClick={() => pick('q3', 'C', 4)} />
          </Wrap>
        );

      case 4:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8">Comment dors-tu la nuit ?</h2>
            <Opt label="Je me réveille souvent entre 2h et 4h" onClick={() => pick('q4', 'A', 5)} />
            <Opt label="J'ai du mal à m'endormir (cerveau actif)" onClick={() => pick('q4', 'B', 5)} />
            <Opt label="Je dors beaucoup mais je me réveille fatiguée" onClick={() => pick('q4', 'C', 5)} />
            <Opt label="Je n'ai aucun problème de sommeil" onClick={() => pick('q4', 'D', 5)} />
          </Wrap>
        );

      case 5:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-2">À quoi t'identifies-tu le plus ?</h2>
            <p className="text-gray-500 text-center font-medium mb-8">Sélectionne une ou plusieurs réponses</p>
            {[
              ['A', "Je me sens submergée, grosse charge mentale"],
              ['B', "J'ai des rages de sucres en pm et soirée"],
              ['C', "Je suis fatiguée le matin au réveil"],
              ['D', "J'ai du mal à éteindre mon cerveau le soir"],
              ['E', 'Je suis dans le "go go go" toute la journée'],
            ].map(([val, label]) => <Multi key={val} label={label} checked={answers.q5.includes(val)} onClick={() => toggleQ5(val)} />)}
            <button
              onClick={() => toggleQ5('F')}
              className={`w-full text-left px-6 py-4 rounded-2xl border-2 border-dashed transition-all duration-200 font-semibold flex items-center justify-between mb-6 ${
                answers.q5.includes('F') ? 'border-neo bg-neo/5 text-neo' : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              <span>Aucune de ces réponses</span>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${answers.q5.includes('F') ? 'bg-neo border-neo' : 'border-gray-300'}`}>
                {answers.q5.includes('F') && <span className="text-white text-[11px] font-black">✓</span>}
              </div>
            </button>
            <div className={`transition-all duration-300 ${answers.q5.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <CTA label="Continuer →" onClick={submitQ5} disabled={answers.q5.length === 0} />
            </div>
          </Wrap>
        );

      case 'int2':
        return (
          <Wrap animKey={animKey}>
            <PulseOrb>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00bbb1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
              </svg>
            </PulseOrb>
            <p className={`text-xl font-black uppercase tracking-wider text-center mb-4 transition-colors duration-500 ${int2Revealed ? 'text-neo' : 'text-gray-300'}`}>
              {int2Revealed ? 'Premier lien établi.' : 'Identification du pattern...'}
            </p>
            <Revealed on={int2Revealed}>
              <p className="text-3xl font-extrabold text-gray-900 text-center mb-4">Ce n'est pas dans ta tête.</p>
              <p className="text-gray-500 text-center leading-relaxed mb-2 font-medium">
                Ce qui freine ton corps ne s'est pas installé la semaine dernière. L'analyse révèle une <strong className="text-gray-900">surcharge accumulée</strong>.
              </p>
              <InsightCard badge="PATTERN DÉTECTÉ">{int2Text}</InsightCard>
              <div className="mt-6"><CTA label="Localiser l'impact physique →" onClick={() => goTo(6)} /></div>
            </Revealed>
          </Wrap>
        );

      case 6:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8">Où se loge principalement ton inconfort ou ta prise de poids ?</h2>
            <Opt label="Au niveau du ventre" sub="Ceinture abdominale" onClick={() => pick('q6', 'Ventre', 7)} />
            <Opt label="Partout de manière diffuse" onClick={() => pick('q6', 'Diffuse', 7)} />
            <Opt label="Hanches et cuisses" onClick={() => pick('q6', 'Hanches', 7)} />
            <Opt label="Aucune prise de poids / inconfort" onClick={() => pick('q6', 'Aucun', 7)} />
          </Wrap>
        );

      case 7:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8">À quelle fréquence as-tu des ballonnements ou un inconfort après les repas ?</h2>
            <Opt label="Presque après chaque repas" onClick={() => pick('q7', 'Souvent', 8)} />
            <Opt label="Parfois, selon ce que je mange" onClick={() => pick('q7', 'Parfois', 8)} />
            <Opt label="Rarement" onClick={() => pick('q7', 'Rarement', 8)} />
          </Wrap>
        );

      case 8:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8">As-tu remarqué des changements physiques récents ?</h2>
            <Opt label="Oui" sub="Perte de cheveux, ongles cassants, frilosité" onClick={() => pick('q8', 'Oui', 9)} />
            <Opt label="Pas particulièrement" onClick={() => pick('q8', 'Non', 9)} />
          </Wrap>
        );

      case 9:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8">Vas-tu à la selle au moins une fois par jour, de manière régulière ?</h2>
            <Opt label="Oui, c'est régulier" onClick={() => { setAnswers(a => ({ ...a, q9: 'Oui' })); showInt3('Oui'); setTimeout(() => goTo('int3'), 300); }} />
            <Opt label="Non, ce n'est pas régulier" onClick={() => { setAnswers(a => ({ ...a, q9: 'Non' })); showInt3('Non'); setTimeout(() => goTo('int3'), 300); }} />
          </Wrap>
        );

      case 'int3':
        return (
          <Wrap animKey={animKey}>
            <PulseOrb>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00bbb1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/>
                <path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>
              </svg>
            </PulseOrb>
            <p className={`text-xl font-black uppercase tracking-wider text-center mb-4 transition-colors duration-500 ${int3Revealed ? 'text-neo' : 'text-gray-300'}`}>
              {int3Revealed ? 'Le constat est clair.' : "Analyse de la conversion d'énergie..."}
            </p>
            <Revealed on={int3Revealed}>
              <p className="text-3xl font-extrabold text-gray-900 text-center mb-4">Arrête de te culpabiliser.</p>
              <p className="text-gray-500 text-center leading-relaxed mb-2 font-medium">
                Le problème n'est pas ton manque d'efforts. C'est de la <strong className="text-gray-900">pure biologie</strong>.
              </p>
              <InsightCard badge="RÉVÉLATION CLINIQUE" badgeColor="bg-neo">{int3Text}</InsightCard>
              <div className="mt-6"><CTA label="Mesurer l'impact sur mon quotidien →" onClick={() => goTo(10)} /></div>
            </Revealed>
          </Wrap>
        );

      case 10:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-2">Quel est l'impact le plus lourd sur ton quotidien ?</h2>
            <p className="text-gray-500 text-center font-medium mb-8">Sélectionne une ou plusieurs réponses</p>
            {[
              ['Image', "L'image de soi — je m'habille pour me cacher."],
              ['Energie', "L'énergie — je me sens constamment fatigué."],
              ['Frustration', "La frustration — beaucoup d'efforts pour peu de résultats."],
              ['Inconfort', "L'inconfort — les ballonnements dictent mes journées."],
            ].map(([val, label]) => <Multi key={val} label={label} checked={answers.q10.includes(val)} onClick={() => toggleQ10(val)} />)}
            <button
              onClick={() => toggleQ10('Rien')}
              className={`w-full text-left px-6 py-4 rounded-2xl border-2 border-dashed transition-all duration-200 font-semibold flex items-center justify-between mb-6 ${
                answers.q10.includes('Rien') ? 'border-neo bg-neo/5 text-neo' : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              <span>Tout va super bien !</span>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${answers.q10.includes('Rien') ? 'bg-neo border-neo' : 'border-gray-300'}`}>
                {answers.q10.includes('Rien') && <span className="text-white text-[11px] font-black">✓</span>}
              </div>
            </button>
            <div className={`transition-all duration-300 ${answers.q10.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <CTA label="Continuer →" onClick={() => answers.q10.length > 0 && goTo(11)} disabled={answers.q10.length === 0} />
            </div>
          </Wrap>
        );

      case 11:
        return (
          <Wrap animKey={animKey}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-2">Quel est ton objectif principal ?</h2>
            <p className="text-gray-500 text-center font-medium mb-8">Cela adapte ta prédiction personnalisée.</p>
            <Opt label="Perdre du poids durablement" onClick={() => pick('q11', 'Perte de poids', 'loading')} />
            <Opt label="Réduire mon stress et mon anxiété" onClick={() => pick('q11', 'Réduire le stress', 'loading')} />
            <Opt label="Retrouver une énergie constante" onClick={() => pick('q11', 'Améliorer mon énergie', 'loading')} />
            <Opt label="Régler mes problèmes de digestion" onClick={() => pick('q11', 'Améliorer ma digestion', 'loading')} />
          </Wrap>
        );

      case 'loading': {
        const items = ['Analyse du profil hormonal', 'Évaluation du cortisol', 'Vérification digestive', 'Calcul de résistance métabolique', "Génération du plan d'action"];
        const texts = ['Analyse du profil hormonal...', 'Évaluation du cortisol...', 'Vérification digestive...', 'Calcul de résistance...', "Génération du plan d'action..."];
        return (
          <Wrap animKey={animKey}>
            <div className="text-center mb-8 pt-4">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <div className="absolute inset-0 rounded-full border-4 border-neo border-t-transparent animate-spin" />
              </div>
              <p className="text-neo font-bold text-xl mb-1">
                {loadingIdx >= 0 && loadingIdx < 5 ? texts[loadingIdx] : 'Initialisation...'}
              </p>
              <p className="text-gray-400 text-sm font-medium">Algorithme basé sur +15 000 profils</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-50 mb-6">
              <ul className="space-y-4">
                {items.map((item, i) => (
                  <li key={i} className={`flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${
                    i < loadingIdx ? 'text-neo' : i === loadingIdx ? 'text-gray-900' : 'text-gray-300'
                  }`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      i < loadingIdx ? 'bg-neo border-neo' : i === loadingIdx ? 'border-neo' : 'border-gray-200'
                    }`}>
                      {i < loadingIdx && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden h-28 rounded-2xl relative" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }}>
              <div className="flex flex-col" style={{ animation: 'scrollUp 10s linear infinite' }}>
                {['Sophie T.','Isabelle G.','Marie C.','Sophie T.'].map((name, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 mb-3 shadow-sm mx-1">
                    <div className="text-yellow-400 text-sm mb-1">★★★★★</div>
                    <p className="text-gray-800 text-xs font-semibold leading-snug mb-1">
                      {i % 3 === 0 ? '"J\'ai enfin compris. Le cortisol était mon pire ennemi !"' : i % 3 === 1 ? '"Ce n\'était pas dans ma tête ! C\'était ma digestion."' : '"Mon énergie est revenue en 4 semaines."'}
                    </p>
                    <span className="text-gray-400 text-[11px]">— {name}</span>
                  </div>
                ))}
              </div>
            </div>
            <style>{`@keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }`}</style>
          </Wrap>
        );
      }

      case 'form':
        return (
          <Wrap animKey={animKey}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-neo/10 text-neo px-4 py-2 rounded-full text-sm font-bold mb-4">
                ✅ Ton code métabolique est décrypté
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">Reçois ton rapport personnalisé</h2>
              <p className="text-gray-500 font-medium">Entre tes informations pour voir ton score et ton plan d'action.</p>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50">
              <form onSubmit={submitForm} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {[['prenom', 'Prénom *', 'text', 'Ton prénom', true], ['nom', 'Nom *', 'text', 'Ton nom', true]].map(([key, lbl, type, ph, req]) => (
                    <div key={String(key)}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{String(lbl)}</label>
                      <input
                        type={String(type)} required={Boolean(req)}
                        value={form[key as 'prenom' | 'nom']}
                        onChange={e => setForm(f => ({ ...f, [key as string]: e.target.value }))}
                        placeholder={String(ph)}
                        className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:outline-none focus:border-neo focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,187,177,0.1)] transition-all font-medium text-gray-900"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">E-mail *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="ton.email@exemple.com"
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:outline-none focus:border-neo focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,187,177,0.1)] transition-all font-medium text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input type="tel" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
                    placeholder="(514) 123-4567"
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:outline-none focus:border-neo focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,187,177,0.1)] transition-all font-medium text-gray-900"
                  />
                </div>
                <CTA label={submitting ? 'Analyse en cours...' : 'Voir mon rapport →'} type="submit" disabled={submitting} />
                <p className="text-center text-gray-400 text-xs">🔒 Données sécurisées et confidentielles</p>
              </form>
            </div>
          </Wrap>
        );

      case 'results':
        return (
          <Wrap animKey={animKey} wide>
            <div className="text-center mb-10">
              <p className="text-neo font-black text-xs tracking-widest uppercase mb-3">RAPPORT MÉTABOLIQUE PERSONNALISÉ</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Ton efficacité est de <span style={{ color: S }}>{displayScore}%</span>
              </h2>
              <span className="inline-block bg-gray-100 text-gray-600 px-5 py-2 rounded-full text-sm font-bold">
                {isGood
                  ? `Score supérieur à ${Math.max(85, metrics.effScore - 3)}% des personnes`
                  : `Score inférieur à ${100 - metrics.effScore + 5}% des personnes de ton profil`}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neo/10 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00bbb1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  Profil de combustion
                </h3>
                <div className="flex items-end gap-3 h-28 mb-3">
                  {[['Repos', isGood ? 22 : 14], ['Activité', isGood ? 85 : Math.min(metrics.effScore + 12, 92)], ['Digestion', isGood ? 32 : 6], ['Cerveau', isGood ? 62 : 22]].map(([l, v]) => (
                    <div key={String(l)} className="flex flex-col items-center flex-1 h-full justify-end">
                      <div className="w-full bg-gray-100 rounded-t-xl relative overflow-hidden" style={{ height: '100%' }}>
                        <div className="absolute bottom-0 w-full bg-neo rounded-t-xl transition-all duration-[2000ms] ease-out"
                          style={{ height: barsOn ? `${v}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-wide">
                  {['Repos','Activité','Digestion','Cerveau'].map(l => <span key={l}>{l}</span>)}
                </div>
                <p className="text-gray-500 text-sm mt-5 leading-relaxed font-medium">
                  {isGood ? "Ton métabolisme basal est parfaitement actif. La conversion d'énergie est optimale." : "Ton métabolisme basal est ralenti. Ton corps privilégie le stockage plutôt que la dépense énergétique."}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(242,100,87,0.1)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f26457" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  Leviers de blocage
                </h3>
                {[
                  { label: 'Cortisol (Stress)', val: metrics.cortisol, color: S },
                  { label: 'Digestion', val: metrics.digestion, color: '#ef4444' },
                  { label: 'Hormones', val: metrics.hormones, color: '#f59e0b' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="mb-5">
                    <div className="flex justify-between text-xs font-black uppercase tracking-wide mb-2">
                      <span className="text-gray-800">{label}</span>
                      <span style={{ color }}>{barsOn ? val : 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-[2000ms] ease-out"
                        style={{ width: barsOn ? `${val}%` : '0%', background: color }} />
                    </div>
                  </div>
                ))}
                <div className={`relative rounded-2xl p-5 pt-8 mt-4 border ${isGood ? 'bg-neo/5 border-neo/20' : 'bg-red-50 border-red-100'}`}>
                  <span className={`absolute -top-3 left-4 text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase ${isGood ? 'bg-neo' : ''}`}
                    style={!isGood ? { background: S } : {}}>
                    {isGood ? 'PROFIL OPTIMAL' : 'SOURCE DU BLOCAGE'}
                  </span>
                  <p className={`text-sm font-semibold leading-relaxed ${isGood ? 'text-neo' : 'text-red-800'}`}>
                    {isGood ? "Ton profil est exceptionnel. Ton corps est sain et prêt pour une optimisation avancée." : (blockDesc[worst] || blockDesc['Cortisol (Stress)'])}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)' }}>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Dernière étape cruciale</h2>
              <p className="text-gray-400 mb-8 text-base leading-relaxed max-w-lg mx-auto font-medium">
                Serais-tu prête à délaisser les solutions miracles pour une vraie approche scientifique d'optimisation ?
              </p>
              <button onClick={() => goTo('roadmap')}
                className="w-full py-5 rounded-full bg-neo text-white font-bold text-lg uppercase tracking-wide shadow-xl shadow-neo/30 hover:bg-neo-600 hover:-translate-y-0.5 transition-all duration-200 mb-4 animate-pulse-slow">
                OUI, ABSOLUMENT
                <span className="block text-xs font-semibold tracking-wider mt-1.5 opacity-80">Je veux comprendre mon plan d'action</span>
              </button>
              <button onClick={() => goTo('value-non')}
                className="w-full py-4 rounded-full border-2 border-gray-700 text-gray-500 font-semibold text-sm hover:text-white hover:border-gray-500 transition-all">
                NON, je préfère essayer encore seule
              </button>
            </div>
          </Wrap>
        );

      case 'value-non':
        return (
          <Wrap animKey={animKey} wide>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">C'est tout à fait correct !</h2>
              <p className="text-gray-500 max-w-xl mx-auto leading-relaxed font-medium">Voici 3 actions puissantes et gratuites à commencer dès ce soir :</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mb-10">
              {[
                { e: '💧', t: 'Hydratation', d: "500ml d'eau avec une pincée de sel marin dès le réveil active tes surrénales en douceur." },
                { e: '🥩', t: 'Protéines', d: "Vise 30g de protéines dans l'heure suivant ton réveil pour couper les rages de sucre de 15h." },
                { e: '🚶‍♀️', t: 'Marche', d: "10 min de marche après ton repas le plus copieux réduit le pic de glycémie de près de 30%." },
              ].map(({ e, t, d }) => (
                <div key={t} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-50 hover:-translate-y-1 transition-transform duration-300">
                  <div className="text-3xl mb-3">{e}</div>
                  <h3 className="font-black text-neo text-base mb-2">{t}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{d}</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg mb-5">Si tu veux accélérer tes résultats...</p>
              <div className="max-w-sm mx-auto"><CTA label="Voir mon plan d'action →" onClick={() => goTo('roadmap')} /></div>
            </div>
          </Wrap>
        );

      case 'roadmap': {
        const fomo = fomoData();
        return (
          <Wrap animKey={animKey} wide>
            <div className="text-center mb-10">
              <p className="text-neo font-black text-xs tracking-widest uppercase mb-3">PRÉVISION ALGORITHMIQUE</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                Ta trajectoire de <span className="text-neo">{goalLabel[answers.q11 || ''] || 'transformation'}</span>
              </h2>
              <p className="text-gray-500 font-semibold">
                Potentiel estimé atteint d'ici <strong className="text-gray-900">{targetMonth}</strong>
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50 mb-6">
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { n: '1', t: 'Désamorçage', d: `Optimisation du ${worst}`, c: 'text-gray-900', b: 'border-gray-900' },
                  { n: '2', t: 'Accélération', d: 'Réactivation cellulaire et résultats visibles', c: `text-[${S}]`, b: `border-[${S}]`, style: { color: S, borderColor: S } },
                  { n: '3', t: 'Optimisation', d: 'Autonomie totale et stabilisation à vie', c: 'text-neo', b: 'border-neo' },
                ].map(({ n, t, d, c, b, style }) => (
                  <div key={n} className="bg-gray-50 rounded-2xl p-4 text-center hover:bg-white hover:shadow-md transition-all duration-300 border border-gray-100">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto mb-3 text-sm font-black ${c} ${b}`} style={style}>{n}</div>
                    <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${c}`} style={style}>{t}</div>
                    <div className="text-xs text-gray-500 font-medium leading-snug">{d}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  <span>Sem. 1</span><span>Sem. 5</span><span>Sem. 10</span><span>Sem. 15 ✨</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #f26457, #00bbb1)', animation: 'growBar 2.5s ease-out 0.3s both', width: '95%' }} />
                </div>
                <style>{`@keyframes growBar { from { width: 0% } to { width: 95% } }`}</style>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-gray-400">Aujourd'hui</span>
                  <span className="text-[10px] font-bold text-neo">Potentiel optimal →</span>
                </div>
              </div>
            </div>

            <div className="relative bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-neo rounded-l-full" />
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 text-neo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    ANALYSE DÉVERROUILLÉE : <span className="text-neo">{fomo.profile}</span>
                  </p>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">{fomo.text}</p>
                  <span className="inline-block mt-2 font-bold text-xs px-3 py-1 rounded-lg" style={{ color: S, background: '#fff1f2' }}>{fomo.urgency}</span>
                </div>
              </div>
            </div>

            <CTA label="Planifie ta consultation (offerte)" onClick={() => goTo('calendar')} />
          </Wrap>
        );
      }

      case 'calendar':
        return (
          <Wrap animKey={animKey} wide>
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">Sécurise ton créneau</h2>
              <p className="text-gray-500 font-medium">Consultation de stratégie offerte — places limitées</p>
            </div>
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100" style={{ height: 680 }}>
              <iframe src="https://api.leadconnectorhq.com/widget/booking/DIN6EPtG7eNU3Gf6ZRoC"
                style={{ width: '100%', height: '100%', border: 'none' }}
                scrolling="yes" title="Réservation NEO" />
            </div>
          </Wrap>
        );

      default: return null;
    }
  };

  return (
    <div className="pb-20">
      {step !== 0 && (
        <div className="sticky top-20 z-10 w-full h-1 bg-gray-100">
          <div className="h-full bg-neo transition-all duration-500 ease-out shadow-[0_0_6px_rgba(0,187,177,0.5)]"
            style={{ width: `${progress}%` }} />
        </div>
      )}

      {showBack && (
        <div className="max-w-xl mx-auto px-4 pt-5 pb-2">
          <button onClick={goBack}
            className="flex items-center gap-1.5 text-gray-400 hover:text-neo text-sm font-semibold transition-colors">
            ← Retour
          </button>
        </div>
      )}

      <div className="py-8 md:py-12">
        {renderStep()}
      </div>
    </div>
  );
};

export default Quiz;