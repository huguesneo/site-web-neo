'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CalendarCheck,
  Check,
  ChevronDown,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Eyebrow, Reveal, Stagger, StaggerItem, scrollToId } from '@/components/PitchKit';
import {
  ENGAGEMENTS,
  GOOGLE_LISTING_URL,
  PITCH_FAQ,
  PITCH_IMAGES,
  VALUE_STACK,
} from '@/views/pitch-content';

/**
 * Page privée « Mon dossier » (/mon-dossier).
 *
 * Envoyée au prospect APRÈS l'appel s'il n'a pas closé : mêmes informations
 * que /protocole-neo mais résumées, consommables en autonomie. Tout converge
 * vers une seule action — « Ouvrir mon dossier » — qui mène au calendrier de
 * réservation GoHighLevel intégré en bas de page. Hors sitemap + noindex.
 */

const BOOKING_WIDGET_URL = 'https://api.leadconnectorhq.com/widget/booking/2Hkm5UnlIVSS2Vi1vkiC';

const VIDEOS = [
  {
    name: 'Maryse',
    quote: 'Dort enfin, stress bas, énergie top et −20 lbs de gras',
    src: 'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/698b388d67d74988b64bd46d.mp4',
  },
  {
    name: 'Véronique',
    quote: 'Hormones gérées, plateau brisé et −10 % de gras',
    src: 'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/698b387fa41b8756c34ab905.mp4',
  },
  {
    name: 'Charlie',
    quote: 'Digestion optimisée et plateau brisé (−13 lbs)',
    src: 'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/698b4cc4a41b873522510eae.mp4',
  },
  {
    name: 'Minouche',
    quote: 'Comprend son corps, digestion parfaite',
    src: 'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/698b4ba6a41b87af3150b857.mp4',
  },
  {
    name: 'Andréanne',
    quote: 'Plateau de 4 ans enfin brisé',
    src: 'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/698b4a6952c9523dd2b30213.mp4',
  },
  {
    name: 'Alexandre',
    quote: 'Plateau brisé et −24 lbs de tissus adipeux',
    src: 'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media/698b388467d749190c4bd16c.mp4',
  },
];

const ETAPES = [
  {
    n: '1',
    title: 'Le Stress & Cortisol',
    text: 'On désactive le « mode survie » qui force ton corps à stocker.',
  },
  {
    n: '2',
    title: 'La Digestion',
    text: "On rétablit l'absorption pour que chaque nutriment soit utilisé.",
  },
  {
    n: '3',
    title: "L'Équilibre Hormonal",
    text: "Tes hormones se stabilisent enfin d'elles-mêmes, naturellement.",
  },
];

/** Compteur animé (kcal) : glisse vers la nouvelle valeur à chaque changement. */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    const duration = 600;
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    // Filet de sécurité : si requestAnimationFrame est suspendu (onglet en
    // arrière-plan), on force la valeur finale — le chiffre ne peut jamais
    // rester figé sur une ancienne valeur.
    const failsafe = window.setTimeout(() => {
      setDisplay(value);
      fromRef.current = value;
    }, duration + 150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
    };
  }, [value]);

  return <>{display.toLocaleString('fr-CA')}</>;
}

/* ────────────── Calculateur métabolique PERSONNALISÉ (modal) ────────────── */
/*
 * Différence clé avec /protocole-neo : ici le prospect entre SES données
 * (formule clinique de Mifflin-St Jeor × niveau d'activité) et voit SON
 * métabolisme chuter quand il active ses blocages. Beaucoup plus persuasif en
 * autonomie qu'un exemple générique à 1 500 kcal.
 */

const BLOCAGES = [
  {
    id: 1,
    title: '1. Le Stress',
    text: 'Cortisol déréglé = mode survie. Chute du métabolisme de base.',
    pct: 0.15,
  },
  {
    id: 2,
    title: '2. La Digestion',
    text: "Mauvaise absorption = baisse de l'effet thermique des aliments.",
    pct: 0.1,
  },
  {
    id: 3,
    title: '3. Les Hormones',
    text: 'Thyroïde et insuline débalancées. Stockage adipeux forcé.',
    pct: 0.15,
  },
] as const;

const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sédentaire (0 entraînement)' },
  { value: 1.375, label: 'Léger (1-3 fois/sem)' },
  { value: 1.55, label: 'Modéré (3-5 fois/sem)' },
  { value: 1.725, label: 'Actif (6+ fois/sem)' },
];

const inputCls =
  'w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-5 py-4 font-medium text-dark-900 outline-none transition-all focus:border-neo-500 focus:bg-white focus:shadow-[0_0_15px_rgba(0,187,177,0.15)]';

function CalculatorModal({
  open,
  onClose,
  onBook,
}: {
  open: boolean;
  onClose: () => void;
  onBook: () => void;
}) {
  const [sex, setSex] = useState<'F' | 'M'>('F');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [activity, setActivity] = useState(1.2);
  const [error, setError] = useState('');
  const [base, setBase] = useState<number | null>(null);
  const [active, setActive] = useState<Set<number>>(new Set());

  // Remise à zéro complète à chaque ouverture.
  useEffect(() => {
    if (open) {
      setBase(null);
      setActive(new Set());
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const compute = () => {
    const a = parseInt(age, 10);
    const w = parseFloat(weight);
    const ft = parseInt(heightFt, 10);
    const inch = parseInt(heightIn, 10) || 0;
    if (!a || !w || !ft) {
      setError('Remplis ton âge, ton poids et ta taille en pieds pour un calcul précis.');
      return;
    }
    setError('');
    // Mifflin-St Jeor (système métrique) × facteur d'activité
    const kg = w / 2.20462;
    const cm = ft * 30.48 + inch * 2.54;
    const bmr = 10 * kg + 6.25 * cm - 5 * a + (sex === 'M' ? 5 : -161);
    setBase(Math.round(bmr * activity));
    setActive(new Set());
  };

  const toggle = (id: number) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const impacts = new Map(BLOCAGES.map((b) => [b.id, Math.round((base ?? 0) * -b.pct)]));
  const calories = base
    ? BLOCAGES.reduce((sum, b) => (active.has(b.id) ? sum + (impacts.get(b.id) ?? 0) : sum), base)
    : 0;
  const barWidth = base ? Math.round((calories / base) * 100) : 100;
  const critical = active.size >= 2;
  const warning = active.size === 1;
  const blockageLabel =
    active.size === 1 ? 'ce blocage' : active.size === 2 ? 'ces 2 blocages combinés' : 'ces 3 blocages cumulés';

  return (
    <div
      className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-dark-900/95 p-4 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl animate-fade-in-up overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl md:p-12"
        style={{ animationDuration: '0.4s' }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-neo-600"
        >
          <X className="h-6 w-6" />
        </button>

        {base === null ? (
          /* ── Étape 1 : le formulaire ── */
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-dark-900 md:text-4xl">
              Découvre ton <span className="text-neo-500">vrai métabolisme</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Remplis tes informations pour calculer avec précision ta capacité métabolique de base
              (formule clinique de Mifflin-St Jeor).
            </p>

            <div className="mt-8 space-y-5 text-left">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Sexe
                  </span>
                  <select value={sex} onChange={(e) => setSex(e.target.value as 'F' | 'M')} className={inputCls}>
                    <option value="F">Femme</option>
                    <option value="M">Homme</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Âge
                  </span>
                  <input type="number" inputMode="numeric" placeholder="Ex : 34" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Poids (lbs)
                  </span>
                  <input type="number" inputMode="decimal" placeholder="Ex : 140" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Taille (pieds / pouces)
                  </span>
                  <div className="flex gap-3">
                    <input type="number" inputMode="numeric" placeholder="Pieds" min={4} max={7} value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className={inputCls} />
                    <input type="number" inputMode="numeric" placeholder="Pouces" min={0} max={11} value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Niveau d'activité
                  </span>
                  <select value={activity} onChange={(e) => setActivity(parseFloat(e.target.value))} className={inputCls}>
                    {ACTIVITY_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {error && <p className="mt-4 font-semibold text-red-500">{error}</p>}

            <button
              onClick={compute}
              className="mt-8 w-full max-w-md rounded-full bg-neo-500 px-10 py-5 text-lg font-extrabold text-white shadow-[0_10px_20px_rgba(0,187,177,0.3)] transition-all hover:-translate-y-0.5 hover:bg-neo-600 hover:shadow-[0_15px_30px_rgba(0,187,177,0.5)]"
            >
              Générer mon profil métabolique
            </button>
          </div>
        ) : (
          /* ── Étape 2 : le tableau de bord personnalisé ── */
          <div>
            <div className="text-center">
              <Eyebrow>Analyse de ta capacité</Eyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark-900 md:text-4xl">
                TON métabolisme <span className="text-neo-500">personnel</span>
              </h2>
            </div>

            <div className="mt-8 text-center">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                Ta capacité métabolique
              </div>
              <div
                className={`mt-2 text-6xl font-extrabold tabular-nums tracking-tight transition-colors duration-300 md:text-7xl ${
                  critical ? 'text-red-500' : 'text-neo-500'
                }`}
              >
                <AnimatedNumber value={calories} />
              </div>
              <div className="mx-auto mt-6 h-7 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    critical
                      ? 'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_18px_rgba(239,68,68,0.5)]'
                      : warning
                        ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-r from-neo-500 to-neo-300 shadow-[0_0_18px_rgba(0,187,177,0.5)]'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Basé sur tes informations ({base.toLocaleString('fr-CA')} kcal brûlées au repos).
              </p>
            </div>

            <div className="mt-10 text-center">
              <Eyebrow>Analyse des freins</Eyebrow>
              <h3 className="mt-3 text-2xl font-extrabold text-dark-900">
                Simule tes sources de plateau
              </h3>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {BLOCAGES.map((b) => {
                const on = active.has(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggle(b.id)}
                    className={`group rounded-2xl border-2 p-6 text-left transition-all duration-300 ${
                      on
                        ? 'border-red-400 bg-red-50 shadow-[0_15px_30px_rgba(239,68,68,0.12)]'
                        : 'border-gray-100 bg-gray-50 hover:-translate-y-1 hover:border-neo-200 hover:shadow-lg'
                    }`}
                  >
                    <h4 className={`text-lg font-extrabold transition-colors ${on ? 'text-red-500' : 'text-dark-900'}`}>
                      {b.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{b.text}</p>
                    <span
                      className={`mt-4 block text-2xl font-extrabold text-red-500 transition-all duration-300 ${
                        on ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                      }`}
                    >
                      {(impacts.get(b.id) ?? 0).toLocaleString('fr-CA')} kcal
                    </span>
                  </button>
                );
              })}
            </div>

            {active.size > 0 && (
              <div
                className="mt-8 animate-fade-in-up rounded-2xl bg-dark-900 p-8 text-center text-white md:p-10"
                style={{ animationDuration: '0.4s' }}
              >
                <h3 className="text-2xl font-extrabold">Diagnostic de ton plateau :</h3>
                <p className="mt-4 text-lg text-gray-300">
                  Ton métabolisme devrait fonctionner à{' '}
                  <span className="font-bold text-neo-400">{base.toLocaleString('fr-CA')}</span> kcal.
                  <br />
                  <span className="font-bold text-red-400">
                    Avec {blockageLabel}, tu ne brûles plus qu'environ{' '}
                    <span className="text-2xl font-extrabold">{calories.toLocaleString('fr-CA')}</span>{' '}
                    calories au repos.
                  </span>
                </p>
                <hr className="my-6 border-white/10" />
                <p className="text-lg font-bold">
                  Rétrécir ton apport calorique ne fera qu'amplifier le problème.{' '}
                  <span className="text-red-400">Il faut optimiser ton métabolisme, pas le priver.</span>
                </p>
                <button
                  onClick={onBook}
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-neo-500 px-10 py-4 text-lg font-extrabold text-white shadow-[0_10px_20px_rgba(0,187,177,0.4)] transition-all hover:-translate-y-0.5 hover:bg-neo-600"
                >
                  <FolderOpen className="h-5 w-5" />
                  Je veux régler ça — Ouvrir mon dossier
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Ouvrir mon dossier : le calendrier de réservation ─────── */
/*
 * Widget de réservation GoHighLevel intégré directement : le prospect remplit
 * ses infos et choisit sa plage horaire dans le widget, GHL crée le contact et
 * le rendez-vous. (Un formulaire natif en amont avait été testé mais il faisait
 * doublon avec le formulaire du widget — retiré.)
 */

function OuvrirDossier() {
  // Script GHL : redimensionne l'iframe automatiquement à son contenu.
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="rounded-3xl border border-neo-500/30 bg-white p-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)] md:p-12">
      <div className="text-center">
        <Eyebrow>La prochaine étape</Eyebrow>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-4xl">
          Prêt(e) à ouvrir <span className="text-neo-500">ton dossier ?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          Sélectionne le moment idéal ci-dessous pour finaliser ton inscription avec ton expert.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-neo-700">
          <CalendarCheck className="h-4 w-4" />
          Rencontre sans engagement — tes questions, tes réponses.
        </p>
      </div>
      <div className="mt-8 min-h-[650px]">
        <iframe
          src={BOOKING_WIDGET_URL}
          style={{ width: '100%', minHeight: 650, border: 'none', overflow: 'hidden' }}
          scrolling="no"
          id="ghl-booking-mon-dossier"
          title="Calendrier de réservation NEO Performance"
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────── La page ──────────────────────────────── */

export default function MonDossier() {
  const [calcOpen, setCalcOpen] = useState(false);
  const closeCalc = useCallback(() => setCalcOpen(false), []);

  // CTA flottant : ici (contrairement à /protocole-neo) le prospect est seul —
  // « Ouvrir mon dossier » doit rester à portée de clic en tout temps.
  const [ctaVisible, setCtaVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setCtaVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goToBooking = useCallback(() => {
    setCalcOpen(false);
    // Laisse le modal se démonter avant de défiler.
    setTimeout(() => {
      scrollToId('dossier');
      // Filet de sécurité : si le défilement doux n'a pas abouti (rendu
      // suspendu, onglet en arrière-plan…), on saute directement au
      // calendrier — ce clic est l'action de conversion, il ne peut pas
      // échouer en silence.
      setTimeout(() => {
        const el = document.getElementById('dossier');
        if (el && Math.abs(el.getBoundingClientRect().top) > 200) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, 900);
    }, 50);
  }, []);

  return (
    <div className="bg-[#FAFAFA] text-gray-900">
      {/* CTA flottant — placé en bas à GAUCHE pour ne pas chevaucher la bulle du
          chatbot du site (bas à droite). Reste à portée de clic en tout temps. */}
      <button
        onClick={() => scrollToId('dossier')}
        className={`fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full bg-neo-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(0,187,177,0.45)] transition-all duration-500 hover:bg-neo-600 md:px-7 md:py-4 md:text-base ${
          ctaVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-16 opacity-0'
        }`}
      >
        <FolderOpen className="h-5 w-5" />
        Ouvrir mon dossier
      </button>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-dark-900">
        <div
          className="absolute inset-0 animate-scale-slow bg-cover bg-center"
          style={{ backgroundImage: `url(${PITCH_IMAGES.hero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/40" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-neo-500/20 blur-[120px]" />

        <div className="relative mx-auto w-[90%] max-w-5xl py-24 text-center text-white">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-neo-300" />
              Salle de décision clinique
            </span>
            <h1 className="mx-auto mt-8 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Tu as maintenant toutes{' '}
              <span className="bg-gradient-to-r from-neo-300 to-neo-500 bg-clip-text text-transparent">
                les cartes en main.
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-white/85 md:text-xl">
              Ta santé ne devrait pas être laissée au hasard. Revois la démarche, calcule ton
              métabolisme personnel, écoute ceux qui ont franchi le pas — et ouvre ton dossier quand
              tu seras prêt.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => scrollToId('dossier')}
                className="inline-flex items-center gap-3 rounded-full bg-neo-500 px-10 py-5 text-lg font-extrabold uppercase tracking-wide text-white shadow-[0_15px_30px_rgba(0,187,177,0.35)] transition-all duration-300 hover:-translate-y-1 hover:bg-neo-600"
              >
                <FolderOpen className="h-5 w-5" />
                Ouvrir mon dossier
              </button>
              <button
                onClick={() => scrollToId('methode')}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-4 font-bold text-white transition-all hover:border-neo-400 hover:text-neo-300"
              >
                Revoir la démarche
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </Reveal>

          <Stagger className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-4" gap={0.15}>
            {[
              { label: '15 000+ vies transformées', anchor: 'resultats' },
              { label: '4 000+ avis 5 étoiles — note 4,9/5', href: GOOGLE_LISTING_URL },
              { label: "Reçus d'assurances émis", anchor: 'assurances' },
            ].map(({ label, anchor, href }) => {
              const inner = (
                <>
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neo-500/20">
                    <Check className="h-5 w-5 text-neo-300" />
                  </span>
                  <span className="underline decoration-neo-400/0 decoration-2 underline-offset-4 transition-all group-hover:decoration-neo-400">
                    {label}
                  </span>
                </>
              );
              const cls = 'group flex items-center gap-3 text-left text-base font-bold text-white';
              return (
                <StaggerItem key={label}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                      {inner}
                    </a>
                  ) : (
                    <button onClick={() => scrollToId(anchor!)} className={cls}>
                      {inner}
                    </button>
                  )}
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ── LA MÉTHODE (résumé) ── */}
      <section id="methode" className="scroll-mt-24 bg-gradient-to-b from-neo-50/60 to-white py-20 md:py-28">
        <div className="mx-auto w-[90%] max-w-6xl">
          <Reveal className="text-center">
            <Eyebrow>Ton métabolisme</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              Pourquoi tu stagnes en ce moment ?
              <br />
              <span className="text-neo-500">C'est mécanique.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600">
              L'industrie essaie de te restreindre. On t'a montré que c'est une question d'ordre
              biologique. Voici la séquence pour réactiver ton métabolisme.
            </p>
          </Reveal>

          <div className="mt-14 flex flex-col items-center gap-4 lg:flex-row lg:items-stretch">
            {ETAPES.map((step, i) => (
              <React.Fragment key={step.n}>
                <Reveal delay={i * 0.1} className="flex-1">
                  <div className="h-full rounded-2xl border-t-4 border-transparent bg-white p-8 text-center shadow-[0_15px_35px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-neo-500 hover:shadow-[0_20px_50px_rgba(0,187,177,0.15)]">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neo-400 to-neo-600 text-2xl font-extrabold text-white shadow-[0_8px_20px_rgba(0,187,177,0.35)]">
                      {step.n}
                    </span>
                    <h3 className="mt-6 text-xl font-extrabold text-dark-900">{step.title}</h3>
                    <p className="mt-3 text-gray-600">{step.text}</p>
                  </div>
                </Reveal>
                {i < ETAPES.length - 1 && (
                  <div className="flex items-center justify-center text-neo-400">
                    <ArrowRight className="h-8 w-8 rotate-90 lg:rotate-0" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-12 text-center">
            <button
              onClick={() => setCalcOpen(true)}
              className="group inline-flex items-center gap-3 rounded-full border-2 border-neo-500 px-9 py-4 text-lg font-bold text-neo-600 transition-all duration-300 hover:bg-neo-500 hover:text-white hover:shadow-[0_15px_30px_rgba(0,187,177,0.3)]"
            >
              <Calculator className="h-5 w-5 transition-transform group-hover:scale-110" />
              Refaire l'exercice de TA mathématique métabolique
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── TÉMOIGNAGES VIDÉO ── */}
      <section id="resultats" className="scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto w-[90%] max-w-6xl">
          <Reveal className="text-center">
            <Eyebrow>Ils étaient exactement à ta place</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              Ce n'est pas de la magie.
              <br />
              <span className="text-neo-500">C'est de la clinique.</span>
            </h2>
          </Reveal>

          <Stagger className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {VIDEOS.map((v) => (
              <StaggerItem key={v.name}>
                <figure className="overflow-hidden rounded-2xl bg-white shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,187,177,0.15)]">
                  <div className="relative aspect-video bg-black">
                    <video
                      preload="metadata"
                      controls
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    >
                      <source src={v.src} type="video/mp4" />
                    </video>
                  </div>
                  <figcaption className="p-6 text-center">
                    <h3 className="text-lg font-extrabold text-dark-900">{v.name}</h3>
                    <p className="mt-1 text-sm italic text-gray-500">« {v.quote} »</p>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>

          {/* Avant / après */}
          <Stagger className="mt-16 grid grid-cols-2 gap-5 lg:grid-cols-4" gap={0.1}>
            {PITCH_IMAGES.transformations.map((src, i) => (
              <StaggerItem key={src}>
                <div className="group aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.08)]">
                  <img
                    src={src}
                    alt={`Transformation avant / après ${i + 1}`}
                    className="h-full w-full object-cover grayscale-[20%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── INVESTISSEMENT ── */}
      <section id="prix" className="relative scroll-mt-24 rounded-t-[40px] bg-dark-900 py-20 text-white md:py-28">
        <span className="absolute left-1/2 top-0 h-1 w-40 -translate-x-1/2 rounded-b bg-neo-500" />
        <div className="mx-auto w-[90%] max-w-4xl">
          <Reveal className="text-center">
            <Eyebrow light>Ton investissement</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Un écosystème clinique complet.
              <br />
              <span className="text-neo-400">Une transformation définitive.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-300">
              Voici la valeur réelle de l'accompagnement conçu pour rétablir ton métabolisme à la
              source.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md md:p-12">
              <ul>
                {VALUE_STACK.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-4 border-b border-white/5 py-4 last:border-b-0"
                  >
                    <span className="flex items-center gap-4 text-base text-gray-200 md:text-lg">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neo-500/20">
                        <Check className="h-4 w-4 text-neo-400" />
                      </span>
                      <span>
                        {item.bonus && <strong className="text-neo-300">BONUS : </strong>}
                        {item.label}
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-lg font-bold text-neo-400">{item.price}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                  Valeur totale réelle
                </span>
                <span className="relative mt-3 inline-block">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-300 md:text-6xl">
                    5 100 $
                  </span>
                  <span className="absolute -left-[12%] -right-[12%] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-neo-500 shadow-[0_0_15px_rgba(0,187,177,0.5)]" />
                </span>

                <div className="mt-10 w-full max-w-xl rounded-2xl border border-neo-500 bg-white/5 px-8 py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] md:px-14">
                  <div className="flex flex-wrap items-baseline justify-center gap-3">
                    <span className="text-6xl font-extrabold tracking-tight md:text-7xl">2 400 $</span>
                    <span className="text-gray-400">+ taxes applicables</span>
                  </div>
                  <div className="mt-3 text-lg font-semibold text-neo-400">
                    Paiement unique (meilleur rapport qualité/prix)
                  </div>
                </div>

                <p className="mt-6 italic text-gray-400">Programme normalement à 2 799 $</p>
              </div>
            </div>
          </Reveal>

          {/* Assurances */}
          <Reveal delay={0.1}>
            <div
              id="assurances"
              className="mt-10 flex scroll-mt-24 flex-col items-center gap-6 rounded-2xl border-2 border-neo-500 bg-gradient-to-br from-neo-500/15 to-transparent p-8 sm:flex-row"
            >
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-neo-500 shadow-[0_10px_20px_rgba(0,187,177,0.4)]">
                <ShieldCheck className="h-8 w-8 text-white" />
              </span>
              <div className="text-center sm:text-left">
                <h4 className="text-xl font-extrabold">
                  N'oublie pas : réduis ton coût réel de façon drastique
                </h4>
                <p className="mt-2 text-gray-300">
                  Programme reconnu. Admissible aux{' '}
                  <strong className="text-white">reçus d'assurances en Naturopathie</strong>. Une
                  grande partie de ton investissement peut t'être remboursée.
                </p>
              </div>
            </div>
          </Reveal>

          {/* L'engagement NEO */}
          <Reveal delay={0.1}>
            <div className="mt-16 text-center">
              <Eyebrow light>L'engagement NEO</Eyebrow>
              <h3 className="mt-3 text-2xl font-extrabold md:text-3xl">
                Le risque n'est pas sur tes épaules.
              </h3>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {ENGAGEMENTS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-7 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neo-500/20">
                    <Icon className="h-6 w-6 text-neo-400" />
                  </span>
                  <h4 className="mt-4 font-extrabold">{title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* FAQ */}
          <Reveal delay={0.1}>
            <div id="faq" className="mt-16 scroll-mt-20 text-center">
              <Eyebrow light>Questions fréquentes</Eyebrow>
              <h3 className="mt-3 text-2xl font-extrabold md:text-3xl">
                Ce que tu te demandes probablement
              </h3>
            </div>
            <div className="mx-auto mt-8 max-w-2xl space-y-3">
              {PITCH_FAQ.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-white/10 bg-white/5 transition-colors open:border-neo-500/50 open:bg-white/10"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-bold [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-neo-400 transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="px-6 pb-6 leading-relaxed text-gray-300">{a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── LE CALENDRIER : ouvrir son dossier ──
          Pas de <Reveal> ici : c'est la cible des sauts (CTA flottant,
          calculateur). Toujours visible → jamais de section blanche au moment
          de convertir. */}
      <section id="dossier" className="scroll-mt-24 bg-dark-900 pb-24">
        <div className="mx-auto w-[90%] max-w-4xl">
          <OuvrirDossier />
        </div>
      </section>

      <CalculatorModal open={calcOpen} onClose={closeCalc} onBook={goToBooking} />
    </div>
  );
}
