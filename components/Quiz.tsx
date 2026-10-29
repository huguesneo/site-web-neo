'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Leaf, Activity, Star, ShieldCheck, Clock, HeartHandshake, X, Check, Search, ClipboardList } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type StepId =
  | 'intro' | 'sexe' | 'age' | 'essais' | 'resultat' | 'int1'
  | 'energie' | 'sommeil' | 'symptomes' | 'int2'
  | 'gras' | 'ballon' | 'selles' | 'hormones' | 'int3'
  | 'objectif' | 'livres' | 'impact'
  | 'loading' | 'form' | 'results' | 'value-non' | 'calendar';

// Ordre du parcours — sert uniquement à la barre de progression
const FLOW: StepId[] = [
  'intro', 'sexe', 'age', 'essais', 'resultat', 'int1',
  'energie', 'sommeil', 'symptomes', 'int2',
  'gras', 'ballon', 'selles', 'hormones', 'int3',
  'objectif', 'livres', 'impact', 'loading', 'form', 'results', 'calendar',
];

type Sys = 'cortisol' | 'digestion' | 'hormones';

interface Answers {
  q1?: string; q2?: string;
  essais: string[]; resultat?: string;
  q3?: string; q4?: string; q5: string[];
  q6?: string; q7?: string; q9?: string; q8: string[];
  q11?: string; livres?: string; q10: string[];
}

interface Metrics { effScore: number; cortisol: number; digestion: number; hormones: number; }

const S = '#f26457'; // secondary / coral

// Ce que la personne a déjà essayé — le « faux problème » qu'on recadre
const ESSAIS: { val: string; label: string; short: string; stop: string }[] = [
  { val: 'calories', label: 'Couper les calories / suivre une diète', short: 'couper les calories', stop: 'Couper encore plus les calories' },
  { val: 'cardio', label: "M'entraîner plus (cardio, gym)", short: "t'entraîner plus", stop: 'Ajouter du cardio pour compenser' },
  { val: 'jeune', label: 'Le jeûne intermittent', short: 'le jeûne', stop: 'Sauter des repas' },
  { val: 'programme', label: 'Un programme minceur (points, keto, repas préparés…)', short: 'les programmes minceur', stop: 'Recommencer un énième programme' },
  { val: 'shakes', label: 'Des shakes ou suppléments minceur', short: 'les shakes et suppléments', stop: 'Remplacer des repas par des shakes' },
  { val: 'medic', label: 'Une médication pour maigrir', short: 'la médication', stop: "Compter seulement sur la médication" },
];

const REFRAME: Record<string, string> = {
  calories: "Couper les calories, ton corps le lit comme une période de manque. Il ralentit sa dépense et s'accroche à ses réserves. C'est pour ça que le poids revient dès que tu relâches, souvent avec quelques livres de plus.",
  programme: "Points, keto, repas préparés : différents emballages, même idée — manger moins. Ton corps répond toujours de la même façon : il ralentit et protège ses réserves. Le poids revient dès que le programme s'arrête.",
  cardio: "Ajouter du cardio à un corps déjà épuisé, c'est ajouter du stress. Et un corps stressé protège ses réserves, surtout au ventre. Tu as travaillé plus fort… sur la mauvaise chose.",
  jeune: "Sauter des repas quand ton énergie est déjà basse, c'est un stress de plus pour ton corps. Il répond en se mettant en mode économie, pas en brûlant davantage.",
  shakes: "Les shakes et les suppléments remplacent des repas. Ils ne changent rien à la raison pour laquelle ton corps stocke au lieu de brûler.",
  medic: "La médication coupe l'appétit. Elle ne change pas la raison pour laquelle ton corps stockait au départ — c'est pour ça que le poids revient souvent à l'arrêt.",
  rien: "Bonne nouvelle : tu pars sans les mauvais réflexes. La plupart des gens passent des années à couper les calories avant de comprendre que ce n'était pas ça, le problème.",
};
const REFRAME_PRIORITY = ['calories', 'programme', 'cardio', 'jeune', 'medic', 'shakes'];

const RESULTAT_LINE: Record<string, string> = {
  repris: "Tu as perdu, puis tout repris. Ça ne veut pas dire que tu as échoué. Ça veut dire que la méthode visait la mauvaise cible.",
  plateau: "Tu as perdu un peu, puis plus rien. Ce plateau n'est pas un hasard : c'est ton corps qui se défend.",
  rien: "Tu as fait des efforts et rien n'a bougé. Ce n'est pas que tu n'as pas assez essayé. C'est que la méthode visait la mauvaise cible.",
};

const PROFILES: Record<Sys | 'equilibre', {
  name: string; title: string; explain: string; start: string[];
  tips: { e: string; t: string; d: string }[];
}> = {
  cortisol: {
    name: 'DOMINANCE CORTISOL',
    title: 'Profil métabolique à dominance cortisol',
    explain: "Quand ton corps encaisse trop de stress — charge mentale, nuits coupées, diètes, entraînements intenses — il se met en mode protection. Il garde ses réserves, surtout au ventre, et l'énergie ne suit plus. Dans ce mode-là, manger moins et bouger plus aggrave souvent la situation.",
    start: ['Calmer ton système de stress avant de chercher à perdre', 'Protéger ton sommeil comme une vraie priorité', 'Manger assez, surtout le matin'],
    tips: [
      { e: '🍳', t: 'Déjeuner protéiné', d: "25 à 30 g de protéines dans l'heure suivant ton réveil. Sauter ce repas ajoute du stress à un corps déjà sous tension." },
      { e: '🚶‍♀️', t: 'Marcher plutôt que courir', d: "10 min de marche après ton plus gros repas plutôt qu'un cardio intense en soirée." },
      { e: '🌙', t: 'Couper les écrans', d: "Écrans fermés 45 min avant le coucher pour aider ton cerveau à décrocher." },
    ],
  },
  digestion: {
    name: 'DOMINANCE DIGESTIVE',
    title: 'Profil métabolique à dominance digestive',
    explain: "Quand ta digestion travaille en surcharge, ton corps assimile mal ce que tu manges. Résultat : ballonnements, énergie en dents de scie, et un poids qui ne répond pas à tes efforts. Tant que c'est le cas, manger « parfait » ne suffit pas.",
    start: ['Remettre ta digestion en ordre avant le reste', 'Repérer ce qui déclenche tes ballonnements', 'Régulariser ton transit'],
    tips: [
      { e: '🍽️', t: 'Manger lentement', d: 'Assise, sans écran, en mastiquant longtemps. La digestion commence dans la bouche.' },
      { e: '📝', t: 'Journal de 7 jours', d: 'Note ce que tu manges et quand tu gonfles. Les déclencheurs apparaissent vite.' },
      { e: '💧', t: 'Eau et fibres', d: "1,5 à 2 L d'eau par jour, et des fibres ajoutées graduellement, pas d'un coup." },
    ],
  },
  hormones: {
    name: 'DOMINANCE HORMONALE',
    title: 'Profil métabolique à dominance hormonale',
    explain: "Quand ton équilibre hormonal change, ton corps ne joue plus selon les mêmes règles. Ce qui marchait il y a 10 ans ne marche plus — pas parce que tu fais moins d'efforts, mais parce que la cible a bougé.",
    start: ['Adapter ton approche à ta phase hormonale', 'Miser sur la musculation plutôt que le cardio', 'Stabiliser ta glycémie à chaque repas'],
    tips: [
      { e: '🏋️‍♀️', t: 'Musculation', d: "2 séances par semaine plutôt que plus de cardio. Le muscle est ton meilleur allié métabolique." },
      { e: '🥩', t: 'Protéines à chaque repas', d: 'Pour stabiliser ta glycémie et couper les rages de sucre de fin de journée.' },
      { e: '⏰', t: 'Heure de coucher fixe', d: 'Ton sommeil règle une bonne partie de tes hormones. La régularité compte plus que la durée.' },
    ],
  },
  equilibre: {
    name: 'PROFIL ÉQUILIBRÉ',
    title: 'Profil métabolique équilibré',
    explain: "Ton corps envoie peu de signaux d'alarme. Ton enjeu n'est pas de réparer, c'est d'optimiser : passer de « ça va » à « je me sens au top ».",
    start: ['Optimiser plutôt que restreindre', 'Construire du muscle pour la suite', 'Mesurer et ajuster avec précision'],
    tips: [
      { e: '🍳', t: 'Déjeuner protéiné', d: "25 à 30 g de protéines dans l'heure suivant ton réveil." },
      { e: '🏋️‍♀️', t: 'Musculation', d: '2 à 3 séances par semaine pour garder un métabolisme actif.' },
      { e: '🚶‍♀️', t: 'Marche digestive', d: '10 min de marche après ton plus gros repas.' },
    ],
  },
};

// ─── Sous-composants extraits (Correction du bug de Focus) ────────────────────

const Wrap = ({ wide, children, animKey }: { wide?: boolean; children: React.ReactNode; animKey?: number }) => (
  <div key={animKey} className={`mx-auto px-4 animate-fade-in-up ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
    {children}
  </div>
);

const Q = ({ title, sub }: { title: string; sub?: string }) => (
  <>
    <h2 className={`text-2xl md:text-3xl font-extrabold text-gray-900 text-center ${sub ? 'mb-2' : 'mb-8'}`}>{title}</h2>
    {sub && <p className="text-gray-500 text-center font-medium mb-8">{sub}</p>}
  </>
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

const Multi = ({ label, checked, onClick, none }: { label: string; checked: boolean; onClick: () => void; none?: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-6 rounded-2xl border-2 transition-all duration-200
                font-semibold flex items-center justify-between ${none ? 'py-4 border-dashed mb-6' : 'py-5 mb-3'} ${
      checked
        ? 'border-neo bg-neo/5 text-neo shadow-[0_0_0_4px_rgba(0,187,177,0.08)]'
        : none
          ? 'border-gray-200 text-gray-400 hover:border-gray-300'
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

const Rating = () => (
  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
    <div className="flex text-yellow-400">
      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
    </div>
    <span><strong className="text-gray-900">4.9/5</strong> · 4000+ avis</span>
  </div>
);


// ─── Quiz Component ─────────────────────────────────────────────────────────────
const Quiz: React.FC = () => {
  const [step, setStep] = useState<StepId>('intro');
  const [history, setHistory] = useState<StepId[]>(['intro']);
  const [animKey, setAnimKey] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ essais: [], q5: [], q8: [], q10: [] });
  const [metrics, setMetrics] = useState<Metrics>({ effScore: 100, cortisol: 5, digestion: 5, hormones: 5 });
  const [revealed, setRevealed] = useState(false);

  const [loadingIdx, setLoadingIdx] = useState(-1);
  const [barsOn, setBarsOn] = useState(false);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', tel: '' });
  const [submitting, setSubmitting] = useState(false);

  const fem = answers.q1 !== 'Homme';
  const g = (f: string, m: string) => (fem ? f : m);

  const goTo = useCallback((next: StepId) => {
    setRevealed(false);
    setAnimKey(k => k + 1);
    setStep(next);
    setHistory(h => [...h, next]);
  }, []);

  const goBack = () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setHistory(h => h.slice(0, -1));
    setRevealed(false);
    setAnimKey(k => k + 1);
    setStep(prev);
  };

  // Remonter en haut une fois la nouvelle étape affichée : un défilement lancé
  // avant le rendu est annulé quand la page raccourcit (ex. résultat → pistes)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [animKey]);

  // Barre de progression : seulement pendant les questions
  const qStart = FLOW.indexOf('sexe'), qEnd = FLOW.indexOf('loading');
  const flowIdx = FLOW.indexOf(step);
  const inQuestions = flowIdx >= qStart && flowIdx < qEnd;
  const progress = Math.round(((flowIdx - qStart + 1) / (qEnd - qStart)) * 100);
  const showBack = inQuestions && history.length > 1;

  const pick = (key: keyof Answers, val: string, next: StepId) => {
    setAnswers(a => ({ ...a, [key]: val }));
    setTimeout(() => goTo(next), 300);
  };

  // Sélection multiple — `none` est exclusif avec les autres choix
  const toggle = (key: 'essais' | 'q5' | 'q8' | 'q10', val: string, none: string) =>
    setAnswers(a => {
      if (val === none) return { ...a, [key]: [none] };
      const arr = a[key].filter(v => v !== none);
      return { ...a, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });

  // Révélation différée des écrans intermédiaires
  useEffect(() => {
    if (!['int1', 'int2', 'int3'].includes(step)) return;
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 1300);
    return () => clearTimeout(t);
  }, [step, animKey]);

  const triedSomething = answers.essais.length > 0 && !answers.essais.includes('rien');
  const triedShorts = ESSAIS.filter(e => answers.essais.includes(e.val)).map(e => e.short);
  const joinFr = (arr: string[]) => arr.length <= 1 ? (arr[0] || '') : `${arr.slice(0, -1).join(', ')} et ${arr[arr.length - 1]}`;

  const submitEssais = () => {
    if (!answers.essais.length) return;
    goTo(answers.essais.includes('rien') ? 'int1' : 'resultat');
  };

  const submitSymptomes = () => {
    if (!answers.q5.length) return;
    if (answers.q5.includes('F') && answers.q3 === 'C' && answers.q4 === 'D') { goTo('gras'); return; }
    goTo('int2');
  };

  const calcMetrics = (ans: Answers): Metrics & { worst: Sys | 'equilibre' } => {
    let c = 5, d = 5, h = 5;
    if (ans.q3 === 'A') c += 25;
    if (ans.q3 === 'B') c += 15;
    if (ans.q4 === 'A') { c += 25; h += 10; }
    if (ans.q4 === 'B') c += 20;
    if (ans.q4 === 'C') { c += 10; d += 10; }
    if (ans.q5.includes('A')) c += 15;
    if (ans.q5.includes('B')) { d += 10; h += 10; }
    if (ans.q5.includes('C')) c += 10;
    if (ans.q5.includes('D')) c += 15;
    if (ans.q5.includes('E')) c += 15;
    if (ans.q6 === 'Ventre') c += 25;
    if (ans.q6 === 'Diffuse') { h += 15; d += 10; }
    if (ans.q6 === 'Hanches') h += 20;
    if (ans.q7 === 'Souvent') d += 40;
    if (ans.q7 === 'Parfois') d += 20;
    if (ans.q9 === 'Non') d += 35;
    if (ans.q8.includes('cycle')) h += 25;
    if (ans.q8.includes('chaleurs')) h += 30;
    if (ans.q8.includes('cheveux')) h += 20;
    if (ans.q8.includes('libido')) h += 25;
    if (ans.q8.includes('muscle')) h += 20;
    if (ans.q1 !== 'Homme' && ans.q2 === '45-55') h += 15;
    if (ans.q1 !== 'Homme' && ans.q2 === '35-44') h += 5;
    // Les approches « stress » déjà essayées amplifient le profil cortisol
    if (['calories', 'cardio', 'jeune'].some(v => ans.essais.includes(v))) c += 10;

    const cortisol = Math.min(95, c), digestion = Math.min(95, d), hormones = Math.min(95, h);
    const ranked = ([['cortisol', cortisol], ['digestion', digestion], ['hormones', hormones]] as [Sys, number][])
      .sort((a, b) => b[1] - a[1]);
    const effScore = Math.max(14, 100 - Math.round((cortisol + digestion + hormones - 15) / 3));
    return {
      effScore, cortisol, digestion, hormones,
      worst: ranked[0][1] < 30 ? 'equilibre' : ranked[0][0],
    };
  };

  const [worst, setWorst] = useState<Sys | 'equilibre'>('cortisol');

  useEffect(() => {
    if (step !== 'loading') return;
    const { worst: w, ...m } = calcMetrics(answers);
    setMetrics(m);
    setWorst(w);
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
    setBarsOn(false);
    const t = setTimeout(() => setBarsOn(true), 500);
    return () => clearTimeout(t);
  }, [step]);

  const profile = PROFILES[worst];

  // Signaux que la personne nous a donnés — renvoyés tels quels comme preuve
  const signals = (): { text: string; sys: Sys }[] => {
    const s: { text: string; sys: Sys }[] = [];
    if (answers.q4 === 'A') s.push({ text: 'Tu te réveilles souvent entre 2h et 4h', sys: 'cortisol' });
    if (answers.q4 === 'B') s.push({ text: "Ton cerveau refuse de s'éteindre pour t'endormir", sys: 'cortisol' });
    if (answers.q4 === 'C') s.push({ text: g('Tu te réveilles fatiguée malgré tes heures de sommeil', 'Tu te réveilles fatigué malgré tes heures de sommeil'), sys: 'cortisol' });
    if (answers.q6 === 'Ventre') s.push({ text: 'Ton gras se loge au ventre', sys: 'cortisol' });
    if (answers.q3 === 'A') s.push({ text: 'Tu es fatigué' + g('e', '') + ' une bonne partie de la journée', sys: 'cortisol' });
    if (answers.q3 === 'B') s.push({ text: "Tu as un crash d'énergie en après-midi", sys: 'cortisol' });
    if (answers.q5.includes('A')) s.push({ text: 'Ta charge mentale déborde', sys: 'cortisol' });
    if (answers.q5.includes('E')) s.push({ text: 'Tu es en mode « go go go » toute la journée', sys: 'cortisol' });
    if (answers.q7 === 'Souvent') s.push({ text: 'Tu gonfles après presque chaque repas', sys: 'digestion' });
    if (answers.q7 === 'Parfois') s.push({ text: 'Tu gonfles selon ce que tu manges', sys: 'digestion' });
    if (answers.q9 === 'Non') s.push({ text: "Ton transit n'est pas régulier", sys: 'digestion' });
    if (answers.q5.includes('B')) s.push({ text: 'Tu as des rages de sucre en fin de journée', sys: 'digestion' });
    if (answers.q8.includes('chaleurs')) s.push({ text: 'Tu as des chaleurs ou des sueurs nocturnes', sys: 'hormones' });
    if (answers.q8.includes('cycle')) s.push({ text: 'Ton cycle a changé', sys: 'hormones' });
    if (answers.q8.includes('libido')) s.push({ text: 'Ta libido ou ta motivation a baissé', sys: 'hormones' });
    if (answers.q8.includes('muscle')) s.push({ text: "Ton muscle fond malgré l'entraînement", sys: 'hormones' });
    if (answers.q8.includes('cheveux')) s.push({ text: 'Cheveux plus fins, ongles cassants ou frilosité', sys: 'hormones' });
    if (answers.q6 === 'Hanches') s.push({ text: 'Ton poids se loge aux hanches et aux cuisses', sys: 'hormones' });
    if (answers.q6 === 'Diffuse') s.push({ text: 'Ta prise de poids est diffuse', sys: 'hormones' });
    return [...s.filter(x => x.sys === worst), ...s.filter(x => x.sys !== worst)].slice(0, 3);
  };

  const goalLabel: Record<string, string> = {
    'Perte de poids': 'perdre ' + (answers.livres && answers.livres !== 'aucun' ? answers.livres : 'du poids') + ' durablement',
    'Réduire le stress': 'retrouver ton calme',
    'Améliorer mon énergie': 'retrouver une énergie stable',
    'Améliorer ma digestion': 'en finir avec les ballonnements',
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('https://hook.us1.make.com/tmb0kuzymqcsbdj8s7x6yp11wfe7twv3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.prenom, lastName: form.nom,
          email: form.email, phone: form.tel,
          q_sexe: answers.q1, q_age: answers.q2, q_energie: answers.q3,
          q_sommeil: answers.q4, q_symptomes: answers.q5.join(', '),
          q_poids: answers.q6, q_ballonnements: answers.q7,
          q_fragilite: answers.q8.join(', '), q_selle: answers.q9,
          q_impact: answers.q10.join(', '), q_objectif: answers.q11,
          q_essais: answers.essais.join(', '), q_resultat: answers.resultat || '',
          q_livres: answers.livres || '',
          score_efficacite: metrics.effScore + '%',
          pire_blocage: profile.name,
        }),
      });
    } finally {
      goTo('results');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <Wrap animKey={animKey}>
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-neo/10 text-neo px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <Activity size={14} /> Basé sur +15 000 profils analysés
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-[1.1]">
                Tu fais des efforts.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neo to-neo-600">Ton corps ne suit pas.</span>
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed font-medium mb-8 max-w-md mx-auto">
                En 3 minutes, découvre ton profil métabolique — et pourquoi les diètes, le cardio et les calories n'ont pas réglé le problème.
              </p>

              {/* Aperçu de ce que l'analyse révèle */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
                {[
                  { icon: Flame, label: 'Cortisol' },
                  { icon: Leaf, label: 'Digestion' },
                  { icon: Activity, label: 'Hormones' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm py-4 px-2 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-neo/10 flex items-center justify-center">
                      <Icon size={18} className="text-neo" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{label}</span>
                  </div>
                ))}
              </div>

              <CTA label="Découvrir mon profil →" onClick={() => goTo('sexe')} />
              <p className="text-gray-400 text-sm mt-4 font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck size={15} className="text-neo" /> Gratuit · Confidentiel · 3 minutes
              </p>
              <div className="mt-9"><Rating /></div>
            </div>
          </Wrap>
        );

      case 'sexe':
        return (
          <Wrap animKey={animKey}>
            <Q title="Quel est ton sexe biologique ?" sub="Tes hormones ne fonctionnent pas de la même façon." />
            <Opt label="Féminin" onClick={() => pick('q1', 'Femme', 'age')} />
            <Opt label="Masculin" onClick={() => pick('q1', 'Homme', 'age')} />
          </Wrap>
        );

      case 'age':
        return (
          <Wrap animKey={animKey}>
            <Q title="Quel âge as-tu ?" sub="Les règles du métabolisme changent avec les années." />
            {[['18 - 34 ans', '18-34'], ['35 - 44 ans', '35-44'], ['45 - 55 ans', '45-55'], ['56 ans et +', '56+']].map(([label, val]) => (
              <Opt key={val} label={label} onClick={() => pick('q2', val, 'essais')} />
            ))}
          </Wrap>
        );

      case 'essais':
        return (
          <Wrap animKey={animKey}>
            <Q title="Qu'as-tu déjà essayé pour perdre du poids ou te sentir mieux ?" sub="Sélectionne tout ce qui s'applique" />
            {ESSAIS.map(({ val, label }) => (
              <Multi key={val} label={label} checked={answers.essais.includes(val)} onClick={() => toggle('essais', val, 'rien')} />
            ))}
            <Multi none label="Rien encore, je commence" checked={answers.essais.includes('rien')} onClick={() => toggle('essais', 'rien', 'rien')} />
            <div className={`transition-all duration-300 ${answers.essais.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <CTA label="Continuer →" onClick={submitEssais} disabled={answers.essais.length === 0} />
            </div>
          </Wrap>
        );

      case 'resultat':
        return (
          <Wrap animKey={animKey}>
            <Q title="Et qu'est-ce qui s'est passé ?" />
            <Opt label="J'ai perdu, puis tout repris (ou plus)" onClick={() => pick('resultat', 'repris', 'int1')} />
            <Opt label="J'ai perdu un peu, puis plus rien ne bougeait" onClick={() => pick('resultat', 'plateau', 'int1')} />
            <Opt label="Rien n'a bougé malgré mes efforts" onClick={() => pick('resultat', 'rien', 'int1')} />
          </Wrap>
        );

      case 'int1': {
        const key = REFRAME_PRIORITY.find(v => answers.essais.includes(v)) || 'rien';
        return (
          <Wrap animKey={animKey}>
            <PulseOrb>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00bbb1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </PulseOrb>
            <p className={`text-xl font-black uppercase tracking-wider text-center mb-4 transition-colors duration-500 ${revealed ? 'text-neo' : 'text-gray-300'}`}>
              {revealed ? (fem ? "Tu n'es pas la seule." : "Tu n'es pas le seul.") : 'Comparaison avec des profils similaires...'}
            </p>
            <Revealed on={revealed}>
              <p className="text-3xl font-extrabold text-gray-900 text-center mb-4">
                {triedSomething ? 'Ce n’est pas ta discipline.' : 'Tu pars du bon pied.'}
              </p>
              {answers.resultat && (
                <p className="text-gray-500 text-center leading-relaxed mb-2 font-medium">{RESULTAT_LINE[answers.resultat]}</p>
              )}
              <InsightCard badge={triedSomething ? `CE QUE TU AS ESSAYÉ : ${joinFr(triedShorts).toUpperCase()}` : 'LE PIÈGE À ÉVITER'}>
                {REFRAME[key]}
              </InsightCard>
              <p className="text-gray-900 text-center font-bold mt-6 mb-6 leading-relaxed">
                Ton vrai levier n'est ni dans ton assiette ni sur le tapis roulant. Les prochaines questions vont le trouver.
              </p>
              <CTA label="Trouver mon vrai levier →" onClick={() => goTo('energie')} />
            </Revealed>
          </Wrap>
        );
      }

      case 'energie':
        return (
          <Wrap animKey={animKey}>
            <Q title="Comment décrirais-tu ton niveau d'énergie actuel ?" />
            <Opt label={g('Je me sens fatiguée une bonne partie de la journée', 'Je me sens fatigué une bonne partie de la journée')} onClick={() => pick('q3', 'A', 'sommeil')} />
            <Opt label="Ça va, mais j'ai un crash en après-midi" onClick={() => pick('q3', 'B', 'sommeil')} />
            <Opt label="J'ai de l'énergie du matin au soir" onClick={() => pick('q3', 'C', 'sommeil')} />
          </Wrap>
        );

      case 'sommeil':
        return (
          <Wrap animKey={animKey}>
            <Q title="Comment dors-tu la nuit ?" />
            <Opt label="Je me réveille souvent entre 2h et 4h" onClick={() => pick('q4', 'A', 'symptomes')} />
            <Opt label="J'ai du mal à m'endormir (cerveau actif)" onClick={() => pick('q4', 'B', 'symptomes')} />
            <Opt label={g('Je dors beaucoup mais je me réveille fatiguée', 'Je dors beaucoup mais je me réveille fatigué')} onClick={() => pick('q4', 'C', 'symptomes')} />
            <Opt label="Je n'ai aucun problème de sommeil" onClick={() => pick('q4', 'D', 'symptomes')} />
          </Wrap>
        );

      case 'symptomes':
        return (
          <Wrap animKey={animKey}>
            <Q title="À quoi t'identifies-tu le plus ?" sub="Sélectionne une ou plusieurs réponses" />
            {[
              ['A', g('Je me sens submergée, grosse charge mentale', 'Je me sens submergé, grosse charge mentale')],
              ['B', "J'ai des rages de sucre en après-midi et en soirée"],
              ['C', g('Je suis fatiguée dès le réveil', 'Je suis fatigué dès le réveil')],
              ['D', "J'ai du mal à éteindre mon cerveau le soir"],
              ['E', 'Je suis dans le « go go go » toute la journée'],
            ].map(([val, label]) => <Multi key={val} label={label} checked={answers.q5.includes(val)} onClick={() => toggle('q5', val, 'F')} />)}
            <Multi none label="Aucune de ces réponses" checked={answers.q5.includes('F')} onClick={() => toggle('q5', 'F', 'F')} />
            <div className={`transition-all duration-300 ${answers.q5.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <CTA label="Continuer →" onClick={submitSymptomes} disabled={answers.q5.length === 0} />
            </div>
          </Wrap>
        );

      case 'int2': {
        const stressTried = ESSAIS.filter(e => ['calories', 'cardio', 'jeune'].includes(e.val) && answers.essais.includes(e.val)).map(e => e.short);
        const signs: string[] = [];
        if (answers.q4 === 'A') signs.push('réveils la nuit');
        if (answers.q4 === 'B' || answers.q5.includes('D')) signs.push('cerveau qui ne décroche pas');
        if (answers.q3 === 'A' || answers.q5.includes('C') || answers.q4 === 'C') signs.push('fatigue');
        if (answers.q3 === 'B') signs.push("crash d'énergie");
        if (answers.q5.includes('A') || answers.q5.includes('E')) signs.push('charge mentale');
        if (answers.q5.includes('B')) signs.push('rages de sucre');
        const list = signs.slice(0, 3);
        const head = list.length ? list[0].charAt(0).toUpperCase() + joinFr(list).slice(1) : 'Ces signaux';
        const msg = stressTried.length
          ? `${head} : ce sont des signaux de stress. Et ${joinFr(stressTried)}, c'est ajouter du stress à un corps qui en a déjà trop. Sans le savoir, tu as peut-être nourri le blocage en essayant de le régler.`
          : `${head} : ce sont des signaux de stress. Un corps sous tension en continu se met en mode protection — il garde ses réserves au lieu de les brûler.`;
        return (
          <Wrap animKey={animKey}>
            <PulseOrb>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00bbb1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
              </svg>
            </PulseOrb>
            <p className={`text-xl font-black uppercase tracking-wider text-center mb-4 transition-colors duration-500 ${revealed ? 'text-neo' : 'text-gray-300'}`}>
              {revealed ? 'Premier lien établi.' : 'Lecture de tes signaux...'}
            </p>
            <Revealed on={revealed}>
              <p className="text-3xl font-extrabold text-gray-900 text-center mb-4">Ce n'est pas dans ta tête.</p>
              <p className="text-gray-500 text-center leading-relaxed mb-2 font-medium">
                Ce qui freine ton corps ne s'est pas installé la semaine dernière. C'est une <strong className="text-gray-900">surcharge accumulée</strong>.
              </p>
              <InsightCard badge="CE QUE TES RÉPONSES MONTRENT">{msg}</InsightCard>
              <div className="mt-6"><CTA label="Continuer mon profil →" onClick={() => goTo('gras')} /></div>
            </Revealed>
          </Wrap>
        );
      }

      case 'gras':
        return (
          <Wrap animKey={animKey}>
            <Q title="Où se loge principalement ta prise de poids ?" />
            <Opt label="Au niveau du ventre" sub="Ceinture abdominale" onClick={() => pick('q6', 'Ventre', 'ballon')} />
            <Opt label="Hanches et cuisses" onClick={() => pick('q6', 'Hanches', 'ballon')} />
            <Opt label="Partout de manière diffuse" onClick={() => pick('q6', 'Diffuse', 'ballon')} />
            <Opt label="Aucune prise de poids" onClick={() => pick('q6', 'Aucun', 'ballon')} />
          </Wrap>
        );

      case 'ballon':
        return (
          <Wrap animKey={animKey}>
            <Q title="À quelle fréquence as-tu des ballonnements ou un inconfort après les repas ?" />
            <Opt label="Presque après chaque repas" onClick={() => pick('q7', 'Souvent', 'selles')} />
            <Opt label="Parfois, selon ce que je mange" onClick={() => pick('q7', 'Parfois', 'selles')} />
            <Opt label="Rarement" onClick={() => pick('q7', 'Rarement', 'selles')} />
          </Wrap>
        );

      case 'selles':
        return (
          <Wrap animKey={animKey}>
            <Q title="Vas-tu à la selle au moins une fois par jour, de manière régulière ?" />
            <Opt label="Oui, c'est régulier" onClick={() => pick('q9', 'Oui', 'hormones')} />
            <Opt label="Non, ce n'est pas régulier" onClick={() => pick('q9', 'Non', 'hormones')} />
          </Wrap>
        );

      case 'hormones': {
        const opts = fem
          ? [['cycle', 'Mon cycle a changé (plus irrégulier, SPM plus fort)'], ['chaleurs', 'Chaleurs ou sueurs nocturnes'], ['cheveux', 'Cheveux plus fins, ongles cassants ou frilosité']]
          : [['libido', 'Baisse de libido ou de motivation'], ['muscle', "Je perds du muscle malgré l'entraînement"], ['cheveux', 'Cheveux plus fins, ongles cassants ou frilosité']];
        return (
          <Wrap animKey={animKey}>
            <Q title="As-tu remarqué un de ces changements depuis 1 ou 2 ans ?" sub="Sélectionne tout ce qui s'applique" />
            {opts.map(([val, label]) => <Multi key={val} label={label} checked={answers.q8.includes(val)} onClick={() => toggle('q8', val, 'aucun')} />)}
            <Multi none label="Rien de tout ça" checked={answers.q8.includes('aucun')} onClick={() => toggle('q8', 'aucun', 'aucun')} />
            <div className={`transition-all duration-300 ${answers.q8.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <CTA label="Continuer →" onClick={() => answers.q8.length > 0 && goTo('int3')} disabled={answers.q8.length === 0} />
            </div>
          </Wrap>
        );
      }

      case 'int3': {
        const dig = answers.q7 === 'Souvent' || answers.q7 === 'Parfois' || answers.q9 === 'Non';
        const hor = answers.q8.length > 0 && !answers.q8.includes('aucun');
        const digMsg = "Ballonnements et transit irrégulier : ton système digestif travaille en surcharge. Tant que c'est le cas, ton corps assimile mal ce que tu manges — et manger « parfait » ne suffit pas.";
        const horMsg = fem
          ? "Cycle qui change, chaleurs, cheveux plus fins : ton équilibre hormonal est en train de bouger. Ce qui marchait il y a 10 ans ne marche plus — pas parce que tu fais moins d'efforts, mais parce que la cible a bougé."
          : "Moins de motivation, du muscle qui fond : ton équilibre hormonal est en train de bouger. Ce qui marchait il y a 10 ans ne marche plus — pas parce que tu fais moins d'efforts, mais parce que la cible a bougé.";
        const msg = dig && hor
          ? `${digMsg} Et en même temps, ton équilibre hormonal bouge. Deux freins qui s'additionnent.`
          : dig ? digMsg
          : hor ? horMsg
          : "Ta digestion et tes hormones envoient peu de signaux. Bonne nouvelle : ça nous dit exactement où ne pas perdre ton temps.";
        return (
          <Wrap animKey={animKey}>
            <PulseOrb>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00bbb1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/>
                <path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>
              </svg>
            </PulseOrb>
            <p className={`text-xl font-black uppercase tracking-wider text-center mb-4 transition-colors duration-500 ${revealed ? 'text-neo' : 'text-gray-300'}`}>
              {revealed ? 'Le portrait se précise.' : 'Lecture de tes signaux...'}
            </p>
            <Revealed on={revealed}>
              <p className="text-3xl font-extrabold text-gray-900 text-center mb-4">Arrête de te culpabiliser.</p>
              <p className="text-gray-500 text-center leading-relaxed mb-2 font-medium">
                Le problème n'est pas ton manque d'efforts. C'est <strong className="text-gray-900">où tu les mets</strong>.
              </p>
              <InsightCard badge="CE QUE TON CORPS TE DIT" badgeColor="bg-neo">{msg}</InsightCard>
              <div className="mt-6"><CTA label="Dernières questions →" onClick={() => goTo('objectif')} /></div>
            </Revealed>
          </Wrap>
        );
      }

      case 'objectif':
        return (
          <Wrap animKey={animKey}>
            <Q title="Quel est ton objectif principal ?" sub="On en tient compte dans ton profil." />
            <Opt label="Perdre du poids durablement" onClick={() => pick('q11', 'Perte de poids', 'livres')} />
            <Opt label="Réduire mon stress et mon anxiété" onClick={() => pick('q11', 'Réduire le stress', 'impact')} />
            <Opt label="Retrouver une énergie constante" onClick={() => pick('q11', 'Améliorer mon énergie', 'impact')} />
            <Opt label="Régler mes problèmes de digestion" onClick={() => pick('q11', 'Améliorer ma digestion', 'impact')} />
          </Wrap>
        );

      case 'livres':
        return (
          <Wrap animKey={animKey}>
            <Q title="Combien de livres aimerais-tu perdre ?" />
            {['moins de 10 lb', '10 à 20 lb', '20 à 40 lb', 'plus de 40 lb'].map(v => (
              <Opt key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} onClick={() => pick('livres', v, 'impact')} />
            ))}
          </Wrap>
        );

      case 'impact':
        return (
          <Wrap animKey={animKey}>
            <Q title="Qu'est-ce qui pèse le plus sur ton quotidien ?" sub="Sélectionne une ou plusieurs réponses" />
            {[
              ['Image', "Mon image — je m'habille pour me cacher"],
              ['Energie', g("Mon énergie — je suis constamment fatiguée", 'Mon énergie — je suis constamment fatigué')],
              ['Frustration', "La frustration — beaucoup d'efforts pour peu de résultats"],
              ['Inconfort', "L'inconfort — les ballonnements dictent mes journées"],
            ].map(([val, label]) => <Multi key={val} label={label} checked={answers.q10.includes(val)} onClick={() => toggle('q10', val, 'Rien')} />)}
            <Multi none label="Rien de tout ça" checked={answers.q10.includes('Rien')} onClick={() => toggle('q10', 'Rien', 'Rien')} />
            <div className={`transition-all duration-300 ${answers.q10.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <CTA label="Voir mon profil →" onClick={() => answers.q10.length > 0 && goTo('loading')} disabled={answers.q10.length === 0} />
            </div>
          </Wrap>
        );

      case 'loading': {
        const items = ['Lecture des signaux de stress', 'Lecture des signaux digestifs', 'Lecture des signaux hormonaux', 'Croisement avec tes essais passés', 'Construction de ton profil'];
        return (
          <Wrap animKey={animKey}>
            <div className="text-center mb-8 pt-4">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <div className="absolute inset-0 rounded-full border-4 border-neo border-t-transparent animate-spin" />
              </div>
              <p className="text-neo font-bold text-xl mb-1">
                {loadingIdx >= 0 && loadingIdx < 5 ? `${items[loadingIdx]}...` : 'Initialisation...'}
              </p>
              <p className="text-gray-400 text-sm font-medium">Grille construite à partir de +15 000 profils</p>
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
            <Rating />
          </Wrap>
        );
      }

      case 'form':
        return (
          <Wrap animKey={animKey}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-neo/10 text-neo px-4 py-2 rounded-full text-sm font-bold mb-4">
                ✅ Ton profil métabolique est prêt
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">Où veux-tu recevoir ton profil ?</h2>
              <p className="text-gray-500 font-medium">Tu vas voir ton profil, ce qu'il faut arrêter, et par où commencer.</p>
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
                <CTA label={submitting ? 'Envoi en cours...' : 'Voir mon profil →'} type="submit" disabled={submitting} />
                <p className="text-center text-gray-400 text-xs">🔒 Données sécurisées et confidentielles</p>
              </form>
            </div>
          </Wrap>
        );

      case 'results': {
        const sigs = signals();
        const stops = ESSAIS.filter(e => answers.essais.includes(e.val)).map(e => e.stop).slice(0, 3);
        stops.push('Te blâmer pour un « manque de volonté »');
        return (
          <Wrap animKey={animKey} wide>
            <div className="text-center mb-8">
              <p className="text-neo font-black text-xs tracking-widest uppercase mb-3">
                {form.prenom ? `${form.prenom}, voici ton profil métabolique` : 'Ton profil métabolique'}
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">{profile.title}</h2>
            </div>

            {/* Miroir : ses propres réponses comme preuve */}
            {sigs.length > 0 && (
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50 mb-6">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Tu nous as dit :</p>
                <ul className="space-y-3 mb-5">
                  {sigs.map(({ text }) => (
                    <li key={text} className="flex items-start gap-3 text-gray-900 font-semibold">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(242,100,87,0.12)' }}>
                        <Check size={14} style={{ color: S }} strokeWidth={3} />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
                <p className="text-gray-600 font-medium leading-relaxed">
                  Pris un par un, ça ressemble à de la fatigue ou à un manque de volonté.
                  Ensemble, c'est la signature d'un <strong className="text-gray-900">{profile.title.toLowerCase()}</strong>.
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4">Ce qui se passe dans ton corps</h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{profile.explain}</p>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-6">Intensité des signaux</h3>
                {([
                  { label: 'Stress (cortisol)', val: metrics.cortisol, color: S },
                  { label: 'Digestion', val: metrics.digestion, color: '#ef4444' },
                  { label: 'Hormones', val: metrics.hormones, color: '#f59e0b' },
                ]).map(({ label, val, color }) => (
                  <div key={label} className="mb-5 last:mb-0">
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
              </div>
            </div>

            {/* Le recadrage : arrête / commence */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-3xl p-8 border bg-red-50 border-red-100">
                <h3 className="text-xs font-black uppercase tracking-wider mb-5" style={{ color: S }}>Arrête de travailler sur ça</h3>
                <ul className="space-y-3">
                  {stops.map(t => (
                    <li key={t} className="flex items-start gap-3 text-red-900 font-semibold text-sm">
                      <X size={16} className="flex-shrink-0 mt-0.5" style={{ color: S }} strokeWidth={3} /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl p-8 border bg-neo/5 border-neo/20">
                <h3 className="text-xs font-black uppercase tracking-wider text-neo mb-5">Ton vrai levier</h3>
                <ul className="space-y-3">
                  {profile.start.map(t => (
                    <li key={t} className="flex items-start gap-3 text-gray-900 font-semibold text-sm">
                      <Check size={16} className="flex-shrink-0 mt-0.5 text-neo" strokeWidth={3} /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Offre : analyse complète */}
            <div className="rounded-3xl p-8 md:p-10 text-center" style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)' }}>
              <p className="text-neo font-black text-xs tracking-widest uppercase mb-3">Prochaine étape</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                Savoir quoi arrêter, c'est la moitié du travail.
              </h2>
              <p className="text-gray-300 mb-6 text-base leading-relaxed max-w-lg mx-auto font-medium">
                L'autre moitié, c'est de savoir par quel blocage commencer pour {goalLabel[answers.q11 || ''] || 'retrouver ton corps'}.
                Pendant ton <strong className="text-white">analyse métabolique complète</strong>, on prend le temps de comprendre chacun de tes blocages et de voir lequel travailler en premier.
              </p>
              <button onClick={() => goTo('calendar')}
                className="w-full py-5 rounded-full bg-neo text-white font-bold text-lg uppercase tracking-wide shadow-xl shadow-neo/30 hover:bg-neo-600 hover:-translate-y-0.5 transition-all duration-200 mb-4">
                Réserver mon analyse complète
                <span className="block text-xs font-semibold tracking-wider mt-1.5 opacity-80">45 min · avec un membre de l'équipe · 0 $</span>
              </button>
              <button onClick={() => goTo('value-non')}
                className="w-full py-4 rounded-full border-2 border-gray-700 text-gray-400 font-semibold text-sm hover:text-white hover:border-gray-500 transition-all">
                {g('Pas encore prête ?', 'Pas encore prêt ?')} Donne-moi 3 pistes pour commencer
              </button>
            </div>

            <p className="text-center text-gray-400 text-xs mt-6 max-w-lg mx-auto leading-relaxed">
              Ce profil métabolique est un outil d'orientation basé sur tes réponses. Il ne constitue pas un diagnostic et ne remplace pas l'avis d'un professionnel de la santé.
            </p>
          </Wrap>
        );
      }

      case 'value-non':
        return (
          <Wrap animKey={animKey} wide>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Aucun problème.</h2>
              <p className="text-gray-500 max-w-xl mx-auto leading-relaxed font-medium">Voici 3 pistes adaptées à ton profil, à commencer dès ce soir :</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mb-10">
              {profile.tips.map(({ e, t, d }) => (
                <div key={t} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-50 hover:-translate-y-1 transition-transform duration-300">
                  <div className="text-3xl mb-3">{e}</div>
                  <h3 className="font-black text-neo text-base mb-2">{t}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{d}</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg mb-2">Ces pistes aident. Elles ne te disent pas par quel blocage commencer.</p>
              <p className="text-gray-500 font-medium mb-5">Ton analyse métabolique complète reste gratuite.</p>
              <div className="max-w-sm mx-auto"><CTA label="Réserver mon analyse →" onClick={() => goTo('calendar')} /></div>
            </div>
          </Wrap>
        );

      case 'calendar':
        return (
          <Wrap animKey={animKey} wide>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-neo/10 text-neo px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <HeartHandshake size={14} /> Analyse métabolique complète · gratuite
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">Réserve ton analyse métabolique complète</h2>
              <p className="text-gray-500 font-medium max-w-lg mx-auto">
                45 minutes avec un membre de notre équipe pour comprendre chacun de tes blocages et voir lequel travailler en premier.
              </p>
            </div>

            {/* Ce qui se passe pendant l'analyse — réduit le risque perçu */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Search, t: 'On approfondit ton profil', d: 'On revoit tes signaux en détail pour confirmer ce qui freine vraiment ton corps.' },
                { icon: Activity, t: triedSomething ? 'On comprend tes essais passés' : 'On fait le point', d: triedSomething ? "Pourquoi ce que tu as essayé n'a pas tenu, et quoi faire à la place." : 'Tes habitudes actuelles, ce qui aide et ce qui nuit.' },
                { icon: ClipboardList, t: 'Tu sais par où commencer', d: "Le blocage à travailler en premier, et comment on peut t'aider à y arriver. Zéro pression." },
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
              <iframe src="https://api.leadconnectorhq.com/widget/booking/DIN6EPtG7eNU3Gf6ZRoC"
                style={{ width: '100%', height: '100%', border: 'none' }}
                scrolling="yes" title="Réservation NEO" />
            </div>
            <p className="text-center text-gray-400 text-sm mt-4 font-medium flex items-center justify-center gap-1.5">
              <Clock size={14} className="text-neo" /> 45 min · en ligne ou par téléphone · 0 $ aujourd'hui
            </p>
          </Wrap>
        );

      default: return null;
    }
  };

  return (
    <div className="pt-6 md:pt-10 pb-20">
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

export default Quiz;
