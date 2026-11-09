'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import {
  Clock,
  Compass,
  Globe,
  Lock,
  MapPin,
  MoonStar,
  Plus,
  ShieldHalf,
  Star,
  Users,
  Video,
} from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/Reveal';
import MetaPixel from '@/components/rencontre/MetaPixel';

/**
 * Page partenaire (lien en bio et stories Instagram, ~95 % mobile).
 * Un seul objectif : réserver l'analyse métabolique gratuite. Aucun lien qui
 * fait sortir de la page sauf la politique de confidentialité (dans le layout).
 *
 * Couleurs : #00BBB1 pour les fonds de boutons et les accents, #00655E pour le
 * texte cyan sur fond clair. Le texte des boutons est foncé : le blanc sur
 * #00BBB1 n'atteint pas le contraste AA (2,4:1).
 */

export type PartenaireConfig = {
  prenom: string;
  photo: string;
  citation: string;
  instagram: string;
  calendrierUrl: string;
};

const CTA = 'Réserver mon analyse gratuite';

const DECOUVERTES = [
  {
    Icone: ShieldHalf,
    titre: 'Pourquoi ton corps reste en mode protection malgré tous tes efforts',
    texte: 'On regarde ce qui garde ton corps sur la défensive, même quand tu manges bien et que tu bouges.',
  },
  {
    Icone: MoonStar,
    titre: 'Ce que ton sommeil, ton stress et ta digestion disent de ton métabolisme',
    texte: 'Ces signaux du quotidien en disent long sur la façon dont ton corps gère son énergie. On les lit ensemble.',
  },
  {
    Icone: Compass,
    titre: 'Les 3 premiers leviers à corriger pour toi',
    texte: 'Tu repars avec trois priorités claires, choisies pour ta situation, à mettre en place dès maintenant.',
  },
];

const ETAPES = [
  'Tu choisis ton moment ci-dessous.',
  'Tu réponds à quelques questions avant la rencontre (2 minutes).',
  'On fait ton analyse ensemble en vidéo.',
];

const FAQ = [
  [
    'Est-ce vraiment gratuit?',
    "Oui. L'analyse métabolique est gratuite et sans engagement. Tu ne paies rien pour réserver ni pour y participer.",
  ],
  [
    'Est-ce que je dois préparer quelque chose?',
    "Presque rien. Après ta réservation, tu réponds à quelques questions (environ 2 minutes). Le jour venu, prévois 45 minutes dans un endroit calme, avec ta caméra.",
  ],
  [
    'Avec qui je vais parler?',
    "Avec une naturopathe de l'équipe NEO. Elle prend le temps de comprendre ta situation et t'explique simplement ce qu'elle observe.",
  ],
  [
    "Je ne suis pas au Québec, est-ce possible?",
    "Oui. L'analyse se fait en ligne, en vidéo, peu importe où tu es. Assure-toi simplement que l'heure choisie te convient selon ton fuseau horaire.",
  ],
];

const BOUTON =
  'inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#00BBB1] px-7 text-[17px] font-bold text-[#04211F] no-underline shadow-[0_10px_24px_-10px_rgba(0,140,132,.6)] transition-colors hover:bg-[#00A99F] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00655E]';

const RASSURANCE = 'Gratuit · 45 min · En ligne · Sans engagement';

/** Guillemets français avec espaces insécables. */
function guillemets(texte: string) {
  return `« ${texte} »`;
}

function useDefilerVersCalendrier(cible: React.RefObject<HTMLElement | null>) {
  return (e: React.MouseEvent) => {
    const el = cible.current;
    if (!el) return;
    e.preventDefault();
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 12, behavior: reduit ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#reserver');
  };
}

/* ───────────────────────── Calendrier GHL ───────────────────────── */

const HAUTEUR_CALENDRIER = 'min-h-[650px]';

/**
 * Même chargement que /rencontre-gratuite : iframe + form_embed.js (qui
 * redimensionne l'iframe). Montée seulement quand la section approche de
 * l'écran, pour ne pas alourdir le chargement initial sur mobile.
 */
function CalendrierGHL({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setMonte(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMonte(true);
          obs.disconnect();
        }
      },
      { rootMargin: '1200px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={HAUTEUR_CALENDRIER}>
      {monte ? (
        <>
          <iframe
            // form_embed.js reconnaît l'iframe par le préfixe de son id.
            id="DIN6EPtG7eNU3Gf6ZRoC_partenaire"
            src={url}
            scrolling="no"
            title="Réserver mon analyse métabolique gratuite"
            className={`block w-full border-0 !overflow-hidden ${HAUTEUR_CALENDRIER}`}
          />
          <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
        </>
      ) : (
        <div className="flex h-[650px] items-center justify-center text-base text-gray-500" aria-hidden="true">
          Chargement du calendrier…
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function PartenaireLanding({ config }: { config: PartenaireConfig }) {
  const { prenom, photo, citation, instagram, calendrierUrl } = config;

  const heroRef = useRef<HTMLElement>(null);
  const calendrierRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);
  const defiler = useDefilerVersCalendrier(calendrierRef);

  // Barre collante : visible seulement quand ni le héros, ni le calendrier,
  // ni le rappel final (qui a déjà son bouton) ne sont à l'écran.
  const [barreVisible, setBarreVisible] = useState(false);
  useEffect(() => {
    const cibles = [heroRef.current, calendrierRef.current, finalRef.current].filter(Boolean) as HTMLElement[];
    if (!cibles.length || !('IntersectionObserver' in window)) return;
    const visibles = new Set<Element>();
    const obs = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
        setBarreVisible(visibles.size === 0);
      },
      { threshold: 0 },
    );
    cibles.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="text-gray-900">
      {/* ── 1. HÉROS ── */}
      <section ref={heroRef} className="px-4 pt-1 pb-12 sm:px-6 lg:pt-8 lg:pb-20">
        <div className="mx-auto grid max-w-[1080px] gap-x-14 gap-y-4 [grid-template-areas:'pastille''photo''texte'] lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'pastille_photo''texte_photo']">
          <div className="flex justify-center [grid-area:pastille] lg:items-end lg:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00BBB1]/25 bg-[#F0FAF9] px-4 py-2 text-[13px] font-semibold text-[#00655E]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#00BBB1]" aria-hidden="true" />
              Partenaire NEO
              <span className="text-[#00655E]/40" aria-hidden="true">
                ·
              </span>
              <span className="font-bold">{instagram}</span>
            </div>
          </div>

          <figure className="relative m-0 h-[clamp(270px,40svh,400px)] overflow-hidden rounded-[28px] bg-[#E6F6F5] shadow-[0_24px_60px_-28px_rgba(4,33,31,.45)] [grid-area:photo] lg:h-auto lg:min-h-[560px]">
            <Image
              src={photo}
              alt={`${prenom}, partenaire de NEO Performance`}
              fill
              priority
              sizes="(min-width: 1024px) 440px, calc(100vw - 32px)"
              className="object-cover object-[50%_28%]"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#04211F]/85 via-[#04211F]/45 to-transparent"
              aria-hidden="true"
            />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <blockquote className="m-0 text-[21px] leading-[1.28] font-semibold tracking-[-.01em] text-balance sm:text-[26px]">
                {guillemets(citation)}
              </blockquote>
              <p className="mt-3 flex items-center gap-2.5 text-[15px] font-semibold text-white/90">
                <span className="h-[2px] w-6 rounded-full bg-[#00BBB1]" aria-hidden="true" />
                {prenom}
              </p>
            </figcaption>
          </figure>

          <div className="text-center [grid-area:texte] lg:pt-2 lg:text-left">
            <h1 className="text-[30px] leading-[1.1] font-bold tracking-[-.025em] text-balance sm:text-[40px] lg:text-[52px]">
              Fais ton analyse{' '}
              <span className="relative isolate inline-block text-[#00655E]">
                métabolique
                <span
                  className="absolute inset-x-0 bottom-[.06em] -z-10 h-[.32em] rounded-full bg-[#00BBB1]/35"
                  aria-hidden="true"
                />
              </span>{' '}
              gratuite
            </h1>
            <p className="mx-auto mt-3 max-w-[540px] leading-[1.55] text-pretty text-gray-600 lg:mx-0 lg:mt-5 lg:text-[19px]">
              En 45 minutes, en ligne, une naturopathe de l&apos;équipe NEO regarde avec toi ce qui freine ton corps
              (stress, sommeil, digestion, hormones). Tu repars avec un plan clair.
            </p>
            <div className="mt-5 lg:mt-8">
              <a href="#reserver" onClick={defiler} className={`${BOUTON} w-full sm:w-auto sm:px-9`}>
                {CTA}
              </a>
              <p className="mt-2.5 text-[14px] font-medium text-gray-600">{RASSURANCE}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PREUVE ── */}
      <section className="border-y border-[#00BBB1]/15 bg-[#F0FAF9] px-4 py-7 sm:px-6">
        <div className="mx-auto max-w-[1080px]">
          <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[15px] font-semibold text-gray-800">
            <span className="flex gap-0.5 text-[#F5A524]" role="img" aria-label="5 étoiles sur 5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={16} fill="currentColor" aria-hidden="true" />
              ))}
            </span>
            4,9 sur Google · 474 avis
          </p>
          <ul className="mt-5 grid gap-3 text-[15px] font-medium text-gray-700 sm:grid-cols-3 sm:gap-6">
            {[
              { Icone: Users, texte: 'Plus de 15 000 clientes accompagnées depuis 2015' },
              { Icone: MapPin, texte: 'Naturopathes à Brossard' },
              { Icone: Globe, texte: 'En ligne partout au Québec' },
            ].map(({ Icone, texte }) => (
              <li key={texte} className="flex items-center gap-3 sm:justify-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#00655E] shadow-sm">
                  <Icone size={18} aria-hidden="true" />
                </span>
                {texte}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 3. CE QUE TU VAS DÉCOUVRIR ── */}
      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-[1080px]">
          <Reveal className="mx-auto max-w-[640px] text-center">
            <h2 className="text-[28px] leading-[1.15] font-bold tracking-[-.02em] text-balance lg:text-[38px]">
              Ce que tu vas découvrir pendant ton analyse
            </h2>
          </Reveal>
          <Stagger className="mt-9 grid gap-4 md:grid-cols-3 md:gap-6 lg:mt-12">
            {DECOUVERTES.map(({ Icone, titre, texte }) => (
              <StaggerItem
                key={titre}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(4,33,31,.25)] lg:p-7"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F6F5] text-[#00655E]">
                  <Icone size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-[19px] leading-[1.3] font-bold text-balance">{titre}</h3>
                <p className="mt-2.5 text-base leading-[1.6] text-gray-600">{texte}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── 4. COMMENT ÇA FONCTIONNE ── */}
      <section className="bg-[#F0FAF9] px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-[760px]">
          <Reveal>
            <h2 className="text-center text-[28px] leading-[1.15] font-bold tracking-[-.02em] lg:text-[38px]">
              Comment ça fonctionne
            </h2>
          </Reveal>
          <Stagger className="mt-9 grid gap-3.5 lg:mt-12">
            {ETAPES.map((etape, i) => (
              <StaggerItem key={etape} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm lg:p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00BBB1] text-lg font-bold text-[#04211F]">
                  {i + 1}
                </span>
                <p className="leading-[1.5] font-medium text-gray-800">{etape}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── 5. CALENDRIER ── */}
      <section id="reserver" ref={calendrierRef} className="scroll-mt-3 px-3 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-[760px]">
          <h2 className="text-center text-[28px] leading-[1.15] font-bold tracking-[-.02em] lg:text-[38px]">
            Choisis ton moment
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              { Icone: null, texte: 'Gratuit' },
              { Icone: Clock, texte: '45 minutes' },
              { Icone: Video, texte: 'En ligne' },
            ].map(({ Icone, texte }) => (
              <span
                key={texte}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F6F5] px-3 py-1 text-[13px] font-bold text-[#00655E]"
              >
                {Icone && <Icone size={14} strokeWidth={2.25} aria-hidden="true" />}
                {texte}
              </span>
            ))}
          </div>
          <div className="mt-7 rounded-[28px] border border-gray-100 bg-white px-2 pt-4 pb-3 shadow-[0_24px_60px_-30px_rgba(4,33,31,.35)] sm:px-5 sm:pt-6">
            <CalendrierGHL url={calendrierUrl} />
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-gray-600">
              <Lock size={13} className="text-[#00655E]" aria-hidden="true" />
              Tes informations restent confidentielles.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ── */}
      <section className="bg-[#F0FAF9] px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-[760px]">
          <h2 className="text-center text-[28px] leading-[1.15] font-bold tracking-[-.02em] lg:text-[38px]">
            Questions fréquentes
          </h2>
          <div className="mt-8 grid gap-3 lg:mt-10">
            {FAQ.map(([question, reponse]) => (
              <details key={question} className="group rounded-2xl bg-white shadow-sm">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00655E] lg:px-6 [&::-webkit-details-marker]:hidden">
                  {question}
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6F6F5] text-[#00655E] transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                    aria-hidden="true"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </span>
                </summary>
                <p className="px-5 pb-5 leading-[1.65] text-gray-600 lg:px-6">{reponse}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. RAPPEL FINAL ── */}
      <section ref={finalRef} className="px-4 py-16 sm:px-6 lg:py-24">
        <Reveal className="mx-auto flex max-w-[560px] flex-col items-center text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full shadow-[0_12px_30px_-12px_rgba(4,33,31,.45)] ring-4 ring-[#E6F6F5]">
            <Image src={photo} alt={prenom} fill sizes="96px" className="object-cover object-[50%_22%]" />
          </div>
          <p className="mt-4 text-[15px] font-semibold text-[#00655E]">
            Recommandé par {prenom} · {instagram}
          </p>
          <h2 className="mt-3 text-[28px] leading-[1.15] font-bold tracking-[-.02em] text-balance lg:text-[38px]">
            Ton corps a des choses à te dire.
          </h2>
          <p className="mt-3 leading-[1.6] text-gray-600">
            Prends 45 minutes pour les comprendre avec une naturopathe de l&apos;équipe NEO.
          </p>
          <a href="#reserver" onClick={defiler} className={`${BOUTON} mt-7 w-full sm:w-auto sm:px-9`}>
            {CTA}
          </a>
          <p className="mt-3 text-[14px] font-medium text-gray-600">{RASSURANCE}</p>
        </Reveal>
      </section>

      {/* ── BARRE COLLANTE MOBILE ── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(4,33,31,.08)] backdrop-blur transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
          barreVisible ? 'translate-y-0' : 'translate-y-[120%]'
        }`}
        aria-hidden={!barreVisible}
      >
        <a href="#reserver" onClick={defiler} tabIndex={barreVisible ? 0 : -1} className={`${BOUTON} w-full`}>
          {CTA}
        </a>
      </div>

      <MetaPixel />
    </div>
  );
}
