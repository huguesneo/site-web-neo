'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  CircleCheck,
  Flame,
  FlaskConical,
  Leaf,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/Reveal';
import MetaPixel from './MetaPixel';

/**
 * Page de pub « rencontre découverte » (trafic Meta, 75 % mobile).
 * Aucun lien qui fait sortir de la page sauf la politique de confidentialité.
 * La carte du hero (`carte`) change selon la version : calendrier direct (A)
 * ou questionnaire puis calendrier (B).
 */

const BULLETS = [
  'On regarde ton parcours : ce qui a marché, puis ce qui a arrêté',
  'On fait le tour de ton sommeil, ton stress, ta digestion et ton alimentation',
  'Tu repars avec une idée claire de la suite, même si tu ne fais pas affaire avec nous',
];

const ETAPE_1 = {
  A: {
    titre: 'Tu choisis ta plage',
    texte: 'En quelques clics, tu réserves le moment qui te convient. Tu reçois le lien de la visio par courriel et par texto.',
  },
  B: {
    titre: 'Tu réponds et choisis ta plage',
    texte: '4 questions, puis tu réserves le moment qui te convient. Tu reçois le lien de la visio par courriel et par texto.',
  },
};

const SOUS_TITRE = {
  A: "En 45 minutes en visio, un membre de l'équipe NEO regarde avec toi ce que tu as essayé, ce qui bloque, et si notre programme de 15 semaines est fait pour toi. Gratuit et sans engagement.",
  B: "Réponds à 4 questions rapides, puis choisis ta plage. En 45 minutes, un membre de l'équipe NEO regarde avec toi ce que tu as essayé, ce qui bloque, et si notre programme de 15 semaines est fait pour toi.",
};

const ETAPES_SUIVANTES = [
  {
    titre: 'On fait le point ensemble',
    texte: 'Ton objectif, ce que tu as déjà essayé, tes habitudes au quotidien. On cherche ce qui empêche ton corps de relâcher le poids.',
  },
  {
    titre: 'Tu décides de la suite',
    texte: "Si on pense pouvoir t'aider, on te présente le programme de 15 semaines et son prix. Si ce n'est pas pour toi, on te le dit franchement.",
  },
];

const PILIERS = [
  {
    Icone: Leaf,
    titre: 'Digestion',
    texte: "Un système digestif qui fonctionne bien, c'est la base. On évalue ton acidité et ton temps de transit pour que ton corps assimile bien ce que tu lui donnes.",
  },
  {
    Icone: Flame,
    titre: 'Cortisol et stress',
    texte: 'Le stress chronique garde ton corps en mode survie et freine le déstockage des graisses. On travaille les trois sources de stress : physique, chimique et psychologique.',
  },
  {
    Icone: Activity,
    titre: 'Hormones',
    texte: 'Tes hormones règlent ta faim, ton énergie et ta composition corporelle. On les soutient naturellement pour que ton corps réponde enfin à tes efforts.',
  },
];

const PROGRAMME = [
  {
    badge: 'S1',
    badgeClasse: 'bg-gray-900 text-white',
    Icone: FlaskConical,
    titre: "L'évaluation initiale",
    texte: "60 à 75 minutes avec ton ou ta naturopathe. On ne suppose rien, on teste : test de stress sur 180 points, test d'acidité et test de transit.",
  },
  {
    badge: '14 J',
    badgeClasse: 'bg-neo text-white',
    Icone: Zap,
    titre: 'Le reset métabolique',
    texte: '14 jours pour stabiliser ta glycémie et relancer un corps qui stockait par réflexe. Plusieurs clientes sentent la différence dès la première semaine.',
  },
  {
    badge: 'S2+',
    badgeClasse: 'bg-white border-2 border-gray-200 text-gray-900',
    Icone: Calendar,
    titre: 'Suivi et ajustements',
    texte: 'Rencontres aux deux semaines, bilans aux semaines 6 et 13 et chat quotidien avec ton ou ta naturopathe. Ton plan évolue avec toi.',
  },
  {
    badge: 'LÉO',
    badgeClasse: 'bg-neo/10 text-neo-700',
    Icone: Bot,
    titre: 'Ton assistant au quotidien',
    texte: "LÉO, l'IA de NEO, t'aide à appliquer ton plan : recettes adaptées, liste d'épicerie, scan des produits et choix au restaurant.",
  },
];

const AVIS = [
  {
    texte: "« J'ai toujours cru qu'il fallait manger moins et s'entraîner plus pour perdre du poids… jusqu'à ce que NEO Performance me prouve le contraire! »",
    nom: 'Carolane R.',
    detail: '15 semaines · avis Google',
  },
  {
    texte: "« C'est la première fois que je ne me sens pas restreinte. Je ne regrette aucunement le 45 minutes de route. »",
    nom: 'Arianne C.',
    detail: '2 mois et demi · avis Google',
  },
  {
    texte: '« Plus rien ne fonctionnait pour moi… je perds enfin du poids. »',
    nom: 'Véronique S.',
    detail: 'Cliente NEO · avis Google',
  },
  {
    texte: "« Au départ, mon objectif principal était la perte de poids, mais j'ai obtenu beaucoup plus que ça. Sans me sentir privée ou constamment en régime. »",
    nom: 'Elise T.',
    detail: 'Cliente NEO · avis Google',
  },
];

const FAQ = [
  ['Est-ce que la rencontre est vraiment gratuite?', 'Oui. La rencontre découverte est gratuite et sans engagement. Tu ne paies rien pour réserver ni pour y assister.'],
  ["Est-ce qu'on va essayer de me vendre quelque chose?", "Si on pense que notre programme peut t'aider, on te le présente avec son prix, clairement. Tu prends ta décision. Si ce n'est pas le bon moment ou le bon fit, on te le dit aussi."],
  ['Je dois me déplacer?', 'Non. La rencontre se fait en visio, de chez toi. Si tu commences avec nous, le programme se fait en clinique à Brossard ou entièrement en ligne.'],
  ['Avec qui je vais parler?', "Avec un membre de l'équipe NEO formé pour bien comprendre ta situation et t'orienter vers le bon accompagnement."],
  ['Comment je me prépare?', "Prévois 45 minutes dans un endroit calme, avec ta caméra. Pense à ce que tu as déjà essayé et à ce que tu veux changer. C'est tout."],
  ['Et si je dois changer mon rendez-vous?', "Tu peux le déplacer ou l'annuler à partir du lien dans ton courriel de confirmation. Fais-le d'avance si possible : ça libère la place pour quelqu'un d'autre."],
];

const AVIS_WIDGET =
  'https://reputationhub.site/reputation/widgets/review_widget/YG2spvWJqnD75L3V95UJ?widgetId=698b1786d6e303bafa03eee3';

function Etoiles({ taille }: { taille: number }) {
  return (
    <span className="flex gap-1 text-yellow-400" role="img" aria-label="5 étoiles sur 5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={taille} fill="currentColor" aria-hidden="true" />
      ))}
    </span>
  );
}

const BOUTON =
  'inline-flex items-center justify-center gap-2 rounded-full bg-neo font-semibold text-white no-underline shadow-lg shadow-neo/30 transition hover:bg-neo-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neo';

export default function RencontreLanding({
  version,
  cta,
  carte,
}: {
  version: 'A' | 'B';
  cta: string;
  carte: React.ReactNode;
}) {
  const etapes = [ETAPE_1[version], ...ETAPES_SUIVANTES];
  const carteRef = useRef<HTMLDivElement>(null);
  const [carteVisible, setCarteVisible] = useState(true);
  const [faqOuverte, setFaqOuverte] = useState(0);

  useEffect(() => {
    const el = carteRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([e]) => setCarteVisible(e.isIntersecting), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function allerALaCarte(e: React.MouseEvent) {
    e.preventDefault();
    const el = carteRef.current;
    if (!el) return;
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: reduit ? 'auto' : 'smooth' });
  }

  return (
    <div className="bg-white font-sans leading-normal text-gray-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative h-[220px] lg:absolute lg:inset-0 lg:h-auto">
          <Image
            src="/clinique.webp"
            alt="Clinique NEO Performance"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_35%] lg:object-[right_30%]"
          />
          {/* Mobile : fondu vers le blanc sous la photo */}
          <div className="absolute inset-x-0 bottom-0 h-[110px] bg-gradient-to-b from-white/0 to-white lg:hidden" />
          {/* Ordinateur : voile blanc à gauche pour le texte, et en bas */}
          <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#fff_0%,#fff_38%,rgba(255,255,255,.9)_52%,rgba(255,255,255,.3)_78%,rgba(255,255,255,.1)_100%)] lg:block" />
          <div className="absolute inset-0 hidden bg-[linear-gradient(0deg,#fff_0%,rgba(255,255,255,0)_30%)] lg:block" />
        </div>

        <div className="absolute inset-x-0 top-0 z-20 py-5">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="inline-flex rounded-xl bg-white/85 px-2 py-1">
              <Image src="/logo-neo.webp" alt="NEO Performance" width={44} height={44} className="h-11 w-auto" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-7 px-4 pt-1 pb-12 lg:min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-16 lg:px-6 lg:pt-[120px] lg:pb-[72px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neo/20 bg-white/85 px-4 py-2 text-[11px] font-bold uppercase tracking-[.04em] text-neo-700 shadow-sm sm:text-[13px]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-neo" aria-hidden="true" />
              Rencontre découverte gratuite · 45 min en visio
            </div>
            <h1 className="mt-5 text-[31px] font-bold leading-[1.1] tracking-[-.025em] text-balance text-gray-900 sm:text-[clamp(31px,4.3vw,58px)]">
              Tu veux perdre du poids sans{' '}
              <span className="bg-gradient-to-r from-neo to-neo-600 bg-clip-text text-transparent">
                recommencer un autre régime?
              </span>
            </h1>
            <p className="mt-5 max-w-[580px] text-base leading-[1.65] text-pretty text-gray-600 lg:text-[19px]">
              {SOUS_TITRE[version]}
            </p>
            <ul className="mt-6 grid gap-2.5">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neo/10 text-neo-600">
                    <CircleCheck size={18} aria-hidden="true" />
                  </span>
                  <span className="text-[15px] font-medium text-gray-700 lg:text-[17px]">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 px-4 py-3.5 shadow-sm">
              <div className="flex shrink-0">
                {[1, 2, 3, 4].map((n) => (
                  <Image
                    key={n}
                    src={`/avatar-${n}.jpg`}
                    alt=""
                    width={40}
                    height={40}
                    className={`h-10 w-10 rounded-full border-2 border-white object-cover shadow-md ${n > 1 ? '-ml-3' : ''}`}
                  />
                ))}
              </div>
              <div className="text-sm leading-[1.4] text-gray-600">
                <div className="mb-1">
                  <Etoiles taille={14} />
                </div>
                <span className="font-bold text-gray-900">4,9 sur Google · 474 avis</span>
                <br />
                15 000 personnes accompagnées depuis 2015
              </div>
            </div>
          </div>

          <div
            id="rdv"
            ref={carteRef}
            className="scroll-mt-4 rounded-3xl border border-gray-100 bg-white px-3.5 pt-5 pb-3.5 shadow-2xl lg:px-6 lg:pt-7 lg:pb-[18px]"
          >
            {carte}
          </div>
        </div>
      </section>

      {/* COMMENT SE PASSE TA RENCONTRE */}
      <section className="bg-gray-50 py-16 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="text-[28px] font-bold leading-[1.15] tracking-[-.02em] text-gray-900 lg:text-4xl">
              Comment se passe ta rencontre
            </h2>
            <p className="mt-4 text-base text-gray-600 lg:text-lg">
              Pas de pitch de vente déguisé. Une vraie conversation sur ta situation.
            </p>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 md:grid-cols-3 lg:mt-16">
            {etapes.map((e, i) => {
              const n = String(i + 1).padStart(2, '0');
              return (
                <StaggerItem
                  key={n}
                  className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
                >
                  <div className="absolute top-0 right-0 p-4 text-6xl leading-none font-bold text-neo opacity-10" aria-hidden="true">
                    {n}
                  </div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-neo/10 text-xl font-bold text-neo-700">
                    {n}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{e.titre}</h3>
                  <p className="text-[15px] leading-[1.65] text-gray-600">{e.texte}</p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* POURQUOI C'EST DIFFÉRENT */}
      <section className="bg-white py-16 lg:py-28">
        <div className="mx-auto grid max-w-[1280px] items-center gap-9 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <Reveal className="relative aspect-[4/3.4] overflow-hidden rounded-3xl shadow-2xl lg:aspect-[4/5]">
            <Image
              src="/methode.webp"
              alt="Accompagnement NEO Performance"
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-black/0 to-60%" />
          </Reveal>
          <Reveal>
            <div className="inline-block rounded-full bg-neo/10 px-3 py-1 text-xs font-bold uppercase tracking-[.05em] text-neo-700">
              Pourquoi c&apos;est différent
            </div>
            <h2 className="mt-4 mb-6 text-[28px] font-bold leading-[1.15] tracking-[-.02em] text-balance text-gray-900 lg:text-[46px]">
              Manger moins et bouger plus, <span className="text-neo-600">tu l&apos;as déjà fait.</span>
            </h2>
            <p className="mb-4 text-base leading-[1.7] text-pretty text-gray-600 lg:text-lg">
              Si tu as déjà perdu du poids pour le reprendre, ce n&apos;est pas un manque de volonté. Quand le stress, le
              sommeil, la digestion ou les hormones ne suivent pas, couper encore plus finit souvent par bloquer les
              résultats.
            </p>
            <p className="mb-8 text-base leading-[1.7] text-pretty text-gray-600 lg:text-lg">
              Chez NEO, ton ou ta naturopathe bâtit un plan autour de ton corps et de ta vie, sans calories à compter ni
              entraînements extrêmes. En clinique à Brossard ou en ligne, partout au Québec.
            </p>
            <a href="#rdv" onClick={allerALaCarte} className={`${BOUTON} px-8 py-3 text-base hover:-translate-y-1`}>
              {cta}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* NOTRE DÉMARCHE */}
      <section className="relative overflow-hidden bg-[#0B1120] py-16 text-white lg:py-28">
        <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-neo/10 blur-[140px]" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Reveal className="grid items-end gap-x-16 gap-y-6 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-gray-300">
                <span className="h-2 w-2 rounded-full bg-neo" aria-hidden="true" />
                Notre démarche
              </div>
              <h2 className="mt-6 text-[30px] font-bold leading-[1.08] tracking-[-.025em] text-balance lg:text-5xl">
                On remonte à la source au lieu de <span className="text-neo">gérer les signaux.</span>
              </h2>
            </div>
            <p className="max-w-[480px] text-base leading-[1.65] text-pretty text-gray-400 lg:text-lg">
              Notre méthode repose sur trois piliers qui travaillent ensemble. Si l&apos;un est déréglé, le reste du corps
              compense, et c&apos;est souvent là que le poids bloque.
            </p>
          </Reveal>

          <Stagger className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-3">
            {PILIERS.map(({ Icone, titre, texte }, i) => (
              <StaggerItem key={titre} className="rounded-2xl border border-white/10 bg-white/5 p-7">
                <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-neo to-neo-700 text-white shadow-lg shadow-neo/20">
                  <Icone size={24} aria-hidden="true" />
                </div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-neo">Pilier {i + 1}</div>
                <h3 className="mb-2.5 text-xl font-bold">{titre}</h3>
                <p className="text-[15px] leading-[1.65] text-gray-400">{texte}</p>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-14 border-t border-white/10 pt-10 lg:mt-20 lg:pt-14">
            <Reveal>
              <h3 className="text-[22px] font-bold tracking-[-.02em] lg:text-[28px]">
                Ce que comprend le programme de 15 semaines
              </h3>
              <p className="mt-2.5 text-base text-gray-400">
                Si tu commences avec nous après la rencontre, voici comment ça se passe.
              </p>
            </Reveal>
            <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {PROGRAMME.map(({ badge, badgeClasse, Icone, titre, texte }) => (
                <StaggerItem key={titre} className="rounded-2xl bg-white p-6 text-gray-900">
                  <div className="mb-[18px] flex items-center justify-between">
                    <span
                      className={`inline-flex h-12 min-w-12 items-center justify-center rounded-full px-2.5 text-[15px] font-bold ${badgeClasse}`}
                    >
                      {badge}
                    </span>
                    <Icone size={22} className="text-neo" aria-hidden="true" />
                  </div>
                  <h4 className="mb-2 text-lg font-bold">{titre}</h4>
                  <p className="text-sm leading-[1.65] text-gray-600">{texte}</p>
                </StaggerItem>
              ))}
            </Stagger>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-x-7 gap-y-3">
                <span className="inline-flex items-center gap-2.5 text-[15px] font-medium text-gray-300">
                  <ShieldCheck size={20} className="text-neo" aria-hidden="true" />
                  Reçus d&apos;assurance en naturopathie
                </span>
                <span className="inline-flex items-center gap-2.5 text-[15px] font-medium text-gray-300">
                  <MapPin size={20} className="text-neo" aria-hidden="true" />
                  En clinique à Brossard ou en ligne, partout au Québec
                </span>
              </div>
              <a href="#rdv" onClick={allerALaCarte} className={`${BOUTON} px-8 py-3 text-base hover:-translate-y-1`}>
                {cta}
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* AVIS */}
      <section className="bg-neo-50 py-16 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center text-[28px] font-bold leading-[1.15] tracking-[-.02em] text-gray-900 lg:text-4xl">
              Elles ont fait la rencontre avant toi
            </h2>
          </Reveal>
          <Stagger className="mx-auto mt-10 grid max-w-[1080px] gap-6 md:grid-cols-2 lg:mt-14">
            {AVIS.map((a) => (
              <StaggerItem key={a.nom} className="relative flex flex-col rounded-2xl bg-white p-8 shadow-sm">
                <div className="absolute -top-4 -left-1 font-serif text-6xl leading-none text-neo/20" aria-hidden="true">
                  &ldquo;
                </div>
                <div className="mb-5">
                  <Etoiles taille={18} />
                </div>
                <blockquote className="mb-6 flex-1 text-base leading-[1.7] text-gray-700 italic">{a.texte}</blockquote>
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                  <span className="font-bold text-gray-900">{a.nom}</span>
                  <span className="rounded-full bg-neo/10 px-3 py-1 text-xs font-bold text-neo-700">{a.detail}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <iframe
            loading="lazy"
            src={AVIS_WIDGET}
            title="Avis de nos clients"
            className="mx-auto mt-10 block h-[560px] w-full max-w-[1080px] rounded-2xl border-0 bg-white"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 lg:py-28">
        <div className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-[28px] font-bold tracking-[-.02em] text-gray-900 lg:text-4xl">
            Questions fréquentes
          </h2>
          <div className="mt-8 flex flex-col gap-3 lg:mt-12">
            {FAQ.map(([q, r], i) => {
              const ouverte = faqOuverte === i;
              return (
                <div key={q} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <h3>
                    <button
                      type="button"
                      id={`faq-q-${i}`}
                      aria-expanded={ouverte}
                      aria-controls={`faq-r-${i}`}
                      onClick={() => setFaqOuverte(ouverte ? -1 : i)}
                      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base font-bold text-gray-900 lg:text-[17px]"
                    >
                      <span>{q}</span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          ouverte ? 'rotate-45 bg-neo text-white' : 'bg-neo/10 text-neo-700'
                        }`}
                        aria-hidden="true"
                      >
                        <Plus size={16} strokeWidth={2.5} />
                      </span>
                    </button>
                  </h3>
                  <div id={`faq-r-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!ouverte}>
                    <p className="px-6 pb-[22px] text-base leading-[1.7] text-gray-600">{r}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden bg-gray-900 py-[72px] text-white lg:py-24">
        <Image src="/clinique.webp" alt="" fill sizes="100vw" className="object-cover opacity-10 grayscale" />
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-neo opacity-20 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-blue-500 opacity-20 blur-[100px]" />
        <div className="relative mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-[32px] font-bold leading-[1.1] tracking-[-.02em] lg:text-6xl">
            Prends 45 minutes pour toi.
          </h2>
          <p className="mx-auto mb-10 max-w-[640px] text-[17px] leading-[1.65] text-gray-300 lg:text-xl">
            Les plages sont ouvertes sur 7 jours seulement. Choisis celle qui te convient.
          </p>
          <a href="#rdv" onClick={allerALaCarte} className={`${BOUTON} px-12 py-5 text-lg hover:scale-105`}>
            {cta}
          </a>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
            <CircleCheck size={16} className="text-neo" aria-hidden="true" />
            Gratuit et sans engagement. 45 minutes en visio.
          </p>
        </div>
      </section>

      {/* PIED DE PAGE MINIMAL */}
      <footer className="border-t border-gray-800 bg-gray-900 pt-8 pb-[104px] text-gray-400 lg:pb-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 text-xs leading-[1.7] sm:px-6 lg:px-8">
          <p className="max-w-[900px]">
            Les résultats varient d&apos;une personne à l&apos;autre. NEO Performance offre un accompagnement en
            naturopathie et en saines habitudes de vie; il ne remplace pas un suivi médical.
          </p>
          <div className="flex flex-wrap justify-between gap-3">
            <span>© 2026 NEO Performance. Tous droits réservés.</span>
            <a href="/politique-de-confidentialite" className="text-gray-300 no-underline hover:text-white">
              Politique de confidentialité
            </a>
          </div>
        </div>
      </footer>

      {/* BOUTON COLLANT MOBILE : caché quand la carte est visible */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white/95 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(17,24,39,.08)] transition-transform duration-250 lg:hidden ${
          carteVisible ? 'translate-y-[120%]' : 'translate-y-0'
        }`}
        aria-hidden={carteVisible}
      >
        <a
          href="#rdv"
          onClick={allerALaCarte}
          tabIndex={carteVisible ? -1 : 0}
          className={`${BOUTON} min-h-[54px] w-full text-[17px] font-bold`}
        >
          {cta}
        </a>
      </div>

      <MetaPixel />
    </div>
  );
}
