'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BatteryLow,
  BrainCircuit,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  Flame,
  MessageCircleHeart,
  ScanBarcode,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react';
import { TEAM_MEMBERS, TESTIMONIALS } from '@/constants';
import { Eyebrow, Reveal, Stagger, StaggerItem, scrollToId } from '@/components/PitchKit';
import {
  ENGAGEMENTS,
  GOOGLE_LISTING_URL,
  PITCH_FAQ,
  PITCH_IMAGES,
  VALUE_STACK,
} from '@/views/pitch-content';

/**
 * Page privée « Protocole NEO » (/protocole-neo).
 *
 * Montrée en partage d'écran par les closers pour présenter l'accompagnement
 * et conclure la vente. Volontairement hors sitemap + noindex : accessible
 * uniquement par lien direct. Le contenu reprend la page GoHighLevel
 * d'origine (mêmes infos, mêmes prix, même calculateur métabolique) avec un
 * design retravaillé aux couleurs du site.
 */

const CTA_URL = 'https://go.neoperformance.ca/closer';

// Navigation par ancres : le closer saute vers n'importe quelle section si le
// prospect revient sur un point déjà passé (prix, équipe, témoignages…).
const NAV_ITEMS = [
  { id: 'methode', label: 'La méthode' },
  { id: 'parcours', label: 'Le parcours' },
  { id: 'leo', label: 'Léo' },
  { id: 'resultats', label: 'Résultats' },
  { id: 'equipe', label: 'Équipe' },
  { id: 'prix', label: 'Investissement' },
  { id: 'faq', label: 'FAQ' },
];

const IMAGES = {
  hero: PITCH_IMAGES.hero,
  dossier: PITCH_IMAGES.dossierApp,
  leo: PITCH_IMAGES.leoGif,
  transformations: PITCH_IMAGES.transformations,
};

/* ──────────────────────────── Petits helpers UI ─────────────────────────── */

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

/* ─────────────────── Calculateur métabolique (modal) ─────────────────── */

const BASE_CALORIES = 1500;
const FINAL_VALUE = 900;

const BLOCAGES = [
  {
    id: 1,
    title: '1. Le Stress',
    text: 'Cortisol déréglé = corps en mode survie. Chute du métabolisme de base (TDEE).',
    impact: '− 10 à 15 %',
    kcal: -225,
  },
  {
    id: 2,
    title: '2. La Digestion',
    text: "Mauvaise absorption = baisse radicale de l'effet thermique des aliments.",
    impact: '− 30 à 50 %',
    kcal: -150,
  },
  {
    id: 3,
    title: '3. Les Hormones',
    text: "Thyroïde, insuline, estrogène, etc. débalancées. Chute de l'énergie et stockage adipeux.",
    impact: '− 10 à 15 %',
    kcal: -225,
  },
] as const;

function MetabolicModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState<Set<number>>(new Set());

  // Remise à zéro à chaque ouverture : le closer rejoue la démo depuis le début.
  useEffect(() => {
    if (open) setActive(new Set());
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

  const toggle = (id: number) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allActive = active.size === 3;
  const calories = allActive
    ? FINAL_VALUE
    : BLOCAGES.reduce((sum, b) => (active.has(b.id) ? sum + b.kcal : sum), BASE_CALORIES);
  // Barre proportionnelle aux kcal réelles : chaque frein activé la fait
  // visiblement descendre (1500 → 100 %, 900 → 60 %).
  const barWidth = Math.round((calories / BASE_CALORIES) * 100);
  const critical = active.size >= 2;
  const warning = active.size === 1;

  // Animation d'entrée seulement (CSS) : la fermeture démonte immédiatement
  // l'overlay. Pas d'animation de sortie interruptible → aucun risque qu'un
  // voile semi-transparent reste coincé au-dessus de la page pendant un appel.
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-dark-900/95 p-4 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl animate-fade-in-up overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl md:p-14"
            style={{ animationDuration: '0.4s' }}
          >
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-neo-600"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center">
              <Eyebrow>Analyse de l'impact</Eyebrow>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-4xl">
                Sur ton <span className="text-neo-500">métabolisme</span>
              </h2>
            </div>

            {/* Jauge métabolique */}
            <div className="mt-10 text-center">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                Exemple d'un métabolisme à
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
                Basé sur un métabolisme normal sans blocage (en kcal brûlées au repos).
              </p>
            </div>

            {/* Les 3 freins */}
            <div className="mt-12 text-center">
              <Eyebrow>Analyse des freins</Eyebrow>
              <h3 className="mt-3 text-2xl font-extrabold text-dark-900">
                Active les sources de blocage
              </h3>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
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
                    <h4
                      className={`text-lg font-extrabold transition-colors ${
                        on ? 'text-red-500' : 'text-dark-900'
                      }`}
                    >
                      {b.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{b.text}</p>
                    <span
                      className={`mt-4 block text-2xl font-extrabold text-red-500 transition-all duration-300 ${
                        on ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                      }`}
                    >
                      {b.impact}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Verdict final */}
            {allActive && (
              <div className="mt-10 animate-fade-in-up rounded-2xl bg-dark-900 p-8 text-center text-white md:p-10" style={{ animationDuration: '0.4s' }}>
                  <h3 className="text-2xl font-extrabold">Voici ton plateau actuel :</h3>
                  <p className="mt-4 text-lg text-gray-300">
                    Ton métabolisme ne roule pas à 1 500 calories.{' '}
                    <span className="font-bold text-red-400">Tu ne brûles que 900 calories.</span>
                  </p>
                  <hr className="my-6 border-white/10" />
                  <p className="text-lg font-bold">
                    Rétrécir ton apport calorique ne fera qu'amplifier le problème.{' '}
                    <span className="text-red-400">
                      Il faut réparer le métabolisme, pas le priver.
                    </span>{' '}
                    C'est notre philosophie de clinique.
                  </p>
              </div>
            )}
      </div>
    </div>
  );
}

/* ──────────────────────────────── La page ──────────────────────────────── */

const PROBLEMES = [
  { icon: BatteryLow, label: <>L'épuisement<br />métabolique</> },
  { icon: BrainCircuit, label: <>Le système<br />nerveux en alerte</> },
  { icon: Flame, label: <>L'inflammation<br />digestive</> },
  { icon: Activity, label: <>La résistance<br />métabolique</> },
];

const ETAPES = [
  {
    n: '1',
    title: 'Le Stress & Cortisol',
    text: 'On désactive le « mode survie » de ton organisme qui le force actuellement à stocker les graisses.',
  },
  {
    n: '2',
    title: 'La Digestion',
    text: "Un corps stressé ne digère pas. On rétablit l'absorption pour que chaque nutriment soit utilisé.",
  },
  {
    n: '3',
    title: "L'Équilibre Hormonal",
    text: "Le stress et la digestion étant réglés, tes hormones se stabilisent enfin d'elles-mêmes.",
  },
];

const TIMELINE = [
  {
    period: 'Semaine 1',
    title: "L'Évaluation & Fondation",
    text: 'Évaluation clinique complète (60 à 75 minutes) et passation des tests à la maison.',
  },
  {
    period: 'Semaine 2 à 5',
    title: "L'Optimisation",
    text: 'Mise en place de la structure personnalisée et suivis cliniques aux 2 semaines.',
  },
  {
    period: 'Semaine 6',
    title: 'Le Pivot',
    text: 'Nouveaux tests. On change la structure alimentaire pour briser les plateaux.',
  },
  {
    period: 'Semaine 13',
    title: "L'Optimal",
    text: "Le métabolisme roule à 100 %, l'énergie est stable, le corps se transforme.",
  },
  {
    period: 'Semaine 13 à 15',
    title: "L'Autonomie",
    text: "Stratégie de maintien. On t'apprend à garder tes résultats à vie, sans nous.",
  },
];

const LEO_FEATURES = [
  {
    icon: Camera,
    strong: 'Frigo vide ?',
    text: 'Prends tes restants en photo, Léo te crée une recette de chef.',
  },
  {
    icon: UtensilsCrossed,
    strong: 'Au resto ?',
    text: 'Léo lit le menu et te dit exactement quoi commander pour tes objectifs.',
  },
  {
    icon: ScanBarcode,
    strong: "À l'épicerie ?",
    text: "Scanne le code-barres, Léo valide si c'est bon pour ton métabolisme.",
  },
];

// L'équipe clinique qui accompagne réellement les clients (mêmes données que
// la page /equipe — on exclut les rôles administratifs).
const CLINICAL_TEAM_IDS = ['hugues', 'thibault', 'jessica', 'tamara', 'brice'];
const CLINICAL_TEAM = TEAM_MEMBERS.filter((m) => CLINICAL_TEAM_IDS.includes(m.id));

export default function ProtocoleNeo() {
  const [modalOpen, setModalOpen] = useState(false);
  const closeModal = useCallback(() => setModalOpen(false), []);

  // Barre d'ancres : visible dès que le hero est passé. Pas de CTA flottant —
  // le bouton « Prendre rendez-vous » n'apparaît qu'à la toute fin de la page,
  // au moment choisi par le closer.
  const [navVisible, setNavVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Barre de progression de lecture — repère visuel pendant le partage d'écran.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <div className="bg-[#FAFAFA] text-gray-900">
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-neo-500 to-neo-300"
        style={{ scaleX: progress }}
      />

      {/* Barre d'ancres : apparaît après le hero, pour sauter vers n'importe
          quelle section pendant l'appel (masquée sur mobile pour ne pas
          encombrer — les closers présentent sur desktop) */}
      <nav
        className={`fixed inset-x-0 top-0 z-40 hidden transition-all duration-500 md:block ${
          navVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center justify-center gap-1 border-b border-white/10 bg-dark-900/85 px-4 py-2.5 backdrop-blur-md">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mr-4 text-base font-extrabold tracking-tight text-white"
          >
            NEO<span className="text-neo-400">.</span>
          </button>
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToId(id)}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[95vh] items-center overflow-hidden bg-dark-900">
        <div
          className="absolute inset-0 animate-scale-slow bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.hero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-neo-500/20 blur-[120px]" />

        <div className="relative mx-auto w-[90%] max-w-6xl py-24 text-white">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-neo-300" />
              Clinique NEO Performance
            </span>
            <h1 className="mt-8 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Retrouve ton énergie, maîtrise ton stress et atteins ton corps idéal{' '}
              <span className="bg-gradient-to-r from-neo-300 to-neo-500 bg-clip-text text-transparent">
                en 15 semaines.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg font-medium text-white/85 md:text-xl">
              Une approche clinique sur-mesure pour relancer ton métabolisme à la source. Fini les
              solutions temporaires (et les diètes restrictives).
            </p>
          </Reveal>

          {/* Chaque badge mène à sa preuve : sections internes ou fiche Google
              (le prospect sceptique peut vérifier les avis lui-même) */}
          <Stagger className="mt-12 flex flex-wrap gap-x-10 gap-y-4" gap={0.15}>
            {[
              { label: '15 000+ vies transformées', anchor: 'resultats' },
              { label: 'Taux de réussite de 92 %', anchor: 'resultats' },
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
              const cls =
                'group flex items-center gap-3 text-left text-base font-bold text-white md:text-lg';
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

      {/* ── LES PROBLÈMES ── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto w-[90%] max-w-6xl text-center">
          <Reveal>
            <Eyebrow>Les problèmes</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              Ce que nous allons <span className="text-neo-500">régler ensemble</span>
            </h2>
          </Reveal>

          <Stagger className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-4" gap={0.1}>
            {PROBLEMES.map(({ icon: Icon, label }, i) => (
              <StaggerItem key={i}>
                <div className="group h-full rounded-2xl border-t-4 border-transparent bg-white p-8 shadow-[0_15px_35px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-2 hover:border-neo-500 hover:shadow-[0_20px_50px_rgba(0,187,177,0.15)]">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neo-50 transition-colors group-hover:bg-neo-500">
                    <Icon className="h-8 w-8 text-neo-500 transition-colors group-hover:text-white" />
                  </span>
                  <h3 className="mt-6 text-lg font-extrabold leading-snug text-dark-900">{label}</h3>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── PHILOSOPHIE / ÉCOSYSTÈME ── */}
      <section id="methode" className="scroll-mt-14 bg-gradient-to-b from-neo-50/60 to-white py-24 md:py-32">
        <div className="mx-auto w-[90%] max-w-6xl">
          <Reveal className="text-center">
            <Eyebrow>Notre philosophie clinique</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              On ne force pas le corps.
              <br />
              <span className="text-neo-500">On le débloque dans le bon ordre.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600">
              L'industrie essaie de te restreindre avant même de réparer tes fondations. Voici la
              véritable séquence biologique pour réactiver ton métabolisme de façon permanente.
            </p>
          </Reveal>

          <div className="mt-16 flex flex-col items-center gap-4 lg:flex-row lg:items-stretch">
            {ETAPES.map((step, i) => (
              <React.Fragment key={step.n}>
                <Reveal delay={i * 0.12} className="flex-1">
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

          <Reveal delay={0.2}>
            <div className="relative mt-12 overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 to-[#1a1a24] p-10 text-center text-white shadow-[0_30px_60px_rgba(0,0,0,0.35)] md:p-12">
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neo-500 via-neo-300 to-neo-500" />
              <span className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-neo-500/15 blur-[80px]" />
              <h3 className="text-2xl font-extrabold text-neo-400 md:text-3xl">
                Métabolisme 100 % rétabli
              </h3>
              <p className="mt-4 text-lg text-gray-200 md:text-xl">
                Ton corps utilise l'énergie efficacement au lieu de la stocker.
                <br />
                <strong className="text-white">
                  Des résultats incroyables, sans la restriction calorique.
                </strong>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3} className="mt-10 text-center">
            <button
              onClick={() => setModalOpen(true)}
              className="group inline-flex items-center gap-3 rounded-full border-2 border-neo-500 px-9 py-4 text-lg font-bold text-neo-600 transition-all duration-300 hover:bg-neo-500 hover:text-white hover:shadow-[0_15px_30px_rgba(0,187,177,0.3)]"
            >
              <Zap className="h-5 w-5 transition-transform group-hover:scale-110" />
              Voici l'impact direct sur ton métabolisme
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── LA SCIENCE ── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto flex w-[90%] max-w-6xl flex-col items-center gap-16 lg:flex-row">
          <Reveal className="flex-1">
            <Eyebrow>La science</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              On ne devine rien.
              <br />
              <span className="text-neo-500">On mesure.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              Pour transformer ton métabolisme, nous nous appuyons sur des données rigoureuses. Nous
              quantifions tes marqueurs biologiques réels grâce à nos protocoles d'évaluation.
            </p>
            <ul className="mt-8 space-y-6">
              <li className="flex gap-4">
                <span className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neo-50">
                  <BrainCircuit className="h-5 w-5 text-neo-600" />
                </span>
                <p className="text-gray-700">
                  <strong className="text-dark-900">Le Test de Stress :</strong> une mesure
                  quantitative précise permettant d'identifier l'impact de ton système nerveux sur
                  ta capacité de stockage et de récupération.
                </p>
              </li>
              <li className="flex gap-4">
                <span className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neo-50">
                  <ClipboardCheck className="h-5 w-5 text-neo-600" />
                </span>
                <p className="text-gray-700">
                  <strong className="text-dark-900">Le Test Digestif :</strong> une analyse
                  rigoureuse de ton acidité gastrique et de l'efficacité de ton transit pour
                  maximiser l'absorption nutritionnelle.
                </p>
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.15} className="flex flex-1 justify-center">
            <img
              src={IMAGES.dossier}
              alt="Dossier clinique dans l'application NEO"
              className="w-full max-w-lg rounded-3xl shadow-[0_20px_50px_rgba(0,187,177,0.15)]"
            />
          </Reveal>
        </div>
      </section>

      {/* ── TIMELINE 15 SEMAINES ── */}
      <section id="parcours" className="scroll-mt-14 bg-gradient-to-b from-white to-neo-50/50 py-24 md:py-32">
        <div className="mx-auto w-[90%] max-w-5xl">
          <Reveal className="text-center">
            <Eyebrow>La démarche</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              Ton parcours clinique.
              <br />
              <span className="text-neo-500">Évolution en 15 semaines.</span>
            </h2>
          </Reveal>

          <div className="relative mt-16">
            <span className="absolute bottom-0 left-5 top-0 w-1 rounded-full bg-neo-100 md:left-1/2 md:-translate-x-1/2" />
            {TIMELINE.map((step, i) => (
              <Reveal key={step.period} delay={i * 0.08}>
                <div
                  className={`relative mb-10 flex md:w-1/2 ${
                    i % 2 === 0 ? 'md:pr-14' : 'md:ml-auto md:pl-14'
                  } pl-14 md:pl-0 ${i % 2 !== 0 ? 'md:pl-14' : ''}`}
                >
                  <span
                    className={`absolute top-8 h-5 w-5 rounded-full border-4 border-neo-500 bg-white shadow-[0_0_0_4px_rgba(0,187,177,0.15)] ${
                      i % 2 === 0
                        ? 'left-3 md:left-auto md:right-0 md:translate-x-1/2'
                        : 'left-3 md:-translate-x-1/2'
                    }`}
                  />
                  <div className="group w-full rounded-2xl bg-white p-8 shadow-[0_15px_35px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,187,177,0.15)]">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-neo-600">
                      {step.period}
                    </span>
                    <h3 className="mt-2 text-xl font-extrabold text-dark-900">{step.title}</h3>
                    <p className="mt-2 text-gray-600">{step.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── LÉO IA ── */}
      <section id="leo" className="scroll-mt-14 py-24 md:py-32">
        <div className="mx-auto flex w-[90%] max-w-6xl flex-col-reverse items-center gap-16 lg:flex-row">
          <Reveal delay={0.15} className="flex flex-1 justify-center">
            <img
              src={IMAGES.leo}
              alt="Interface de Léo, l'assistant IA nutritionnel"
              className="w-full max-w-sm rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
            />
          </Reveal>
          <Reveal className="flex-1">
            <Eyebrow>Innovation</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              Fini la charge mentale.
              <br />
              <span className="text-neo-500">Rencontre Léo, ton IA.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              Léo est intégré à ton app pour t'assister 24/7 (et c'est ton nouveau meilleur ami pour
              l'épicerie).
            </p>
            <ul className="mt-8 space-y-6">
              {LEO_FEATURES.map(({ icon: Icon, strong, text }) => (
                <li key={strong} className="flex gap-4">
                  <span className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neo-50">
                    <Icon className="h-5 w-5 text-neo-600" />
                  </span>
                  <p className="text-gray-700">
                    <strong className="text-dark-900">{strong}</strong> {text}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── PREUVE SOCIALE ── */}
      <section id="resultats" className="scroll-mt-14 pb-28 pt-4 md:pb-36">
        <div className="mx-auto w-[90%] max-w-6xl text-center">
          <Reveal>
            <Eyebrow>Résultats</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              Plus de 15 000 <span className="text-neo-500">transformations réussies</span>
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4" gap={0.1}>
            {IMAGES.transformations.map((src, i) => (
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

          {/* Verbatims clients — visages et mots réels derrière les chiffres */}
          <Stagger className="mt-14 grid gap-6 text-left md:grid-cols-3" gap={0.1}>
            {TESTIMONIALS.map((t) => (
              <StaggerItem key={t.id}>
                <figure className="flex h-full flex-col rounded-2xl border-l-4 border-neo-500 bg-white p-8 shadow-[0_15px_35px_rgba(0,0,0,0.05)]">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-grow text-gray-700">« {t.text} »</blockquote>
                  <figcaption className="mt-6 flex items-center justify-between gap-3">
                    <span className="font-extrabold text-dark-900">{t.name}</span>
                    <span className="rounded-full bg-neo-50 px-3 py-1 text-xs font-bold text-neo-700">
                      {t.result}
                    </span>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── L'ÉQUIPE CLINIQUE ── */}
      <section id="equipe" className="scroll-mt-14 bg-gradient-to-b from-neo-50/50 to-white py-24 md:py-32">
        <div className="mx-auto w-[90%] max-w-6xl text-center">
          <Reveal>
            <Eyebrow>Ton équipe</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-900 md:text-5xl">
              Les cliniciens derrière <span className="text-neo-500">ta transformation</span>
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600">
              Tu ne seras pas suivi par une app anonyme : un naturopathe dédié t'accompagne du
              premier test jusqu'à ton autonomie.
            </p>
          </Reveal>

          <Stagger className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5" gap={0.08}>
            {CLINICAL_TEAM.map((m) => (
              <StaggerItem key={m.id}>
                <div className="group">
                  <div className="aspect-square overflow-hidden rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.08)]">
                    <img
                      src={m.image}
                      alt={m.name}
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-4 font-extrabold text-dark-900">{m.name}</h3>
                  <p className="text-sm font-semibold text-neo-600">{m.role}</p>
                  <p className="mt-1 text-xs text-gray-500">{m.specialty}</p>
                  {m.accreditation && (
                    <p className="mt-2 inline-block rounded-full bg-neo-50 px-3 py-1 text-[11px] font-bold tracking-wide text-neo-700">
                      {m.accreditation}
                    </p>
                  )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── INVESTISSEMENT ── */}
      <section id="prix" className="relative scroll-mt-14 rounded-t-[40px] bg-dark-900 py-24 text-white md:py-32">
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
            <div className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md md:p-12">
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
                    <span className="whitespace-nowrap text-lg font-bold text-neo-400">
                      {item.price}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-12 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                  Valeur totale réelle
                </span>
                <span className="relative mt-3 inline-block">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-300 md:text-6xl">
                    5 100 $
                  </span>
                  <span className="absolute -left-[12%] -right-[12%] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-neo-500 shadow-[0_0_15px_rgba(0,187,177,0.5)]" />
                </span>

                <div className="mt-10 w-full max-w-xl rounded-2xl border border-neo-500 bg-white/5 px-8 py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:-translate-y-1 md:px-14">
                  <div className="flex flex-wrap items-baseline justify-center gap-3">
                    <span className="text-6xl font-extrabold tracking-tight md:text-7xl">
                      2 400 $
                    </span>
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
        </div>
      </section>

      {/* ── OPTIONS + ASSURANCES + CTA ── */}
      <section className="bg-dark-900 pb-28 text-white">
        <div className="mx-auto w-[90%] max-w-3xl">
          <Reveal>
            <div className="rounded-2xl border border-dashed border-neo-500 bg-neo-500/10 px-8 py-6 text-center text-lg">
              <strong>Option d'optimisation :</strong> ajoute un plan d'entraînement 100 %
              personnalisé pour 100 $.
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div id="assurances" className="mt-8 flex scroll-mt-24 flex-col items-center gap-6 rounded-2xl border-2 border-neo-500 bg-gradient-to-br from-neo-500/15 to-transparent p-8 sm:flex-row">
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-neo-500 shadow-[0_10px_20px_rgba(0,187,177,0.4)]">
                <ShieldCheck className="h-8 w-8 text-white" />
              </span>
              <div className="text-center sm:text-left">
                <h4 className="text-xl font-extrabold">
                  Réduis ton coût réel de façon drastique
                </h4>
                <p className="mt-2 text-gray-300">
                  Programme reconnu. Admissible aux{' '}
                  <strong className="text-white">reçus d'assurances en Naturopathie</strong>. Une
                  grande partie de ton investissement peut t'être remboursée.
                </p>
              </div>
            </div>
          </Reveal>

          {/* L'engagement NEO — réduit le risque perçu avec ce qui est déjà
              garanti par la structure du programme */}
          <Reveal delay={0.15}>
            <div className="mt-16 text-center">
              <Eyebrow light>L'engagement NEO</Eyebrow>
              <h3 className="mt-3 text-2xl font-extrabold md:text-3xl">
                Le risque n'est pas sur tes épaules.
              </h3>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {ENGAGEMENTS.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-7 text-center"
                >
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neo-500/20">
                    <Icon className="h-6 w-6 text-neo-400" />
                  </span>
                  <h4 className="mt-4 font-extrabold">{title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* FAQ — la page désamorce les objections avant que le closer ait à
              le faire à l'oral */}
          <Reveal delay={0.1}>
            <div id="faq" className="mt-20 scroll-mt-20 text-center">
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

          <Reveal delay={0.2} className="mt-16 text-center">
            <a
              href={CTA_URL}
              className="inline-flex items-center gap-3 rounded-full bg-neo-500 px-14 py-6 text-xl font-extrabold uppercase tracking-wide text-white shadow-[0_15px_30px_rgba(0,187,177,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-neo-600 hover:shadow-[0_20px_40px_rgba(0,187,177,0.5)]"
            >
              Prendre rendez-vous
              <ArrowRight className="h-6 w-6" />
            </a>
            <p className="mt-8 flex items-center justify-center gap-2 font-semibold text-gray-300">
              <MessageCircleHeart className="h-5 w-5 text-neo-400" />
              Une équipe clinique dédiée à ta transformation.
            </p>
          </Reveal>
        </div>
      </section>

      <MetabolicModal open={modalOpen} onClose={closeModal} />
    </div>
  );
}
