import { Instagram, Facebook, ChevronRight } from 'lucide-react';
import type { Image as SanityImage } from 'sanity';
import { urlForImage } from '@/sanity/lib/image';

/**
 * Page « lien en bio » (/lien) — remplace Linktree.
 *
 * Contenu géré dans Sanity Studio (document « Page Liens »). Rendu 100 %
 * serveur : toutes les animations sont en CSS pur (fond aurore, verre dépoli,
 * bordure lumineuse rotative de la carte vedette, entrées en cascade) — aucun
 * JS client, la page charge instantanément dans le navigateur Instagram.
 */

export type LienItem = {
  _key: string;
  _type: 'lienSection' | 'lienLink';
  heading?: string;
  label?: string;
  subtitle?: string;
  emoji?: string;
  url?: string;
  featured?: boolean;
  image?: SanityImage;
  ctaLabel?: string;
  enabled?: boolean;
};

export type LienPageData = {
  tagline?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  items?: LienItem[];
};

// Contenu de secours si le document Sanity n'existe pas encore : la page
// reste présentable avec les destinations connues du site.
const FALLBACK: LienPageData = {
  tagline: '👉🏼 +10 000 vies transformées. Et si c\'était ton tour?',
  instagramUrl: 'https://www.instagram.com/neoperformance/',
  facebookUrl: 'https://www.facebook.com/neoperformance1',
  items: [
    {
      _key: 'section-consult',
      _type: 'lienSection',
      heading: 'Réserve ta consultation gratuite 👇',
    },
    {
      _key: 'consultation',
      _type: 'lienLink',
      emoji: '💻',
      label: 'Consultation gratuite',
      url: 'https://www.neoperformance.ca/consultation',
      enabled: true,
    },
    {
      _key: 'quiz',
      _type: 'lienLink',
      emoji: '🔬',
      label: 'Test : Découvre la santé de ton métabolisme',
      url: 'https://www.neoperformance.ca/quiz',
      enabled: true,
    },
    {
      _key: 'blog',
      _type: 'lienLink',
      emoji: '📖',
      label: 'Blogue NEO Performance',
      url: 'https://www.neoperformance.ca/blog',
      enabled: true,
    },
    {
      _key: 'boutique',
      _type: 'lienLink',
      emoji: '🛒',
      label: 'Boutique compléments NEO',
      url: 'https://www.neoperformance.ca/boutique',
      enabled: true,
    },
  ],
};

// Styles d'animation propres à cette page (fond aurore, brillance, entrées).
// Inclus ici plutôt que dans index.css : la page est autonome et rien d'autre
// ne les utilise.
//
// Perf : aucun filtre blur() — les dégradés radiaux sont déjà doux par
// nature, et les gros calques floutés animés faisaient geler le rendu (testé).
// La bordure de la carte vedette tourne via @property (rotation du dégradé
// lui-même, pas d'élément géant en transform) ; les navigateurs trop vieux
// affichent simplement une bordure dégradée fixe.
const css = `
  @property --lienAngle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes lienSpinAngle {
    to { --lienAngle: 360deg; }
  }
  .lien-border {
    background:
      conic-gradient(from var(--lienAngle, 0deg),
        #007F78 0deg, #00BBB1 70deg, #B3EBE8 110deg, #00BBB1 150deg,
        #007F78 220deg, #00BBB1 290deg, #B3EBE8 330deg, #007F78 360deg);
    animation: lienSpinAngle 5s linear infinite;
  }
  @keyframes lienPop {
    from { opacity: 0; transform: translateY(26px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes lienDriftA {
    0% { transform: translate(-12%, -8%) scale(1); }
    50% { transform: translate(10%, 12%) scale(1.25); }
    100% { transform: translate(-12%, -8%) scale(1); }
  }
  @keyframes lienDriftB {
    0% { transform: translate(10%, 6%) scale(1.15); }
    50% { transform: translate(-14%, -10%) scale(0.9); }
    100% { transform: translate(10%, 6%) scale(1.15); }
  }
  @keyframes lienDriftC {
    0% { transform: translate(0%, 10%) scale(0.95); }
    50% { transform: translate(6%, -12%) scale(1.2); }
    100% { transform: translate(0%, 10%) scale(0.95); }
  }
  @keyframes lienShine {
    0%, 55% { transform: translateX(-120%) skewX(-18deg); }
    100% { transform: translateX(260%) skewX(-18deg); }
  }
  @keyframes lienHalo {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.12); }
  }
  .lien-pop {
    opacity: 0;
    animation: lienPop 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @media (prefers-reduced-motion: reduce) {
    .lien-root *, .lien-root *::before, .lien-root *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .595.047.88.139V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
  );
}

function pop(index: number) {
  return {
    className: 'lien-pop',
    style: { animationDelay: `${120 + index * 85}ms` },
  };
}

/** Carte vedette : bordure lumineuse rotative + balayage de lumière. */
function FeaturedCard({ item, index }: { item: LienItem; index: number }) {
  const a = pop(index);
  const imageUrl = item.image
    ? urlForImage(item.image).width(880).height(500).fit('crop').url()
    : null;

  return (
    <a href={item.url} className={`${a.className} block group`} style={a.style}>
      {/* Bordure lumineuse : le dégradé conique du wrapper tourne (via --lienAngle) */}
      <div className="lien-border relative rounded-[28px] p-[2.5px] shadow-2xl shadow-neo-900/25 transition-transform duration-300 active:scale-[0.97]">
        <div className="relative rounded-[26px] overflow-hidden bg-dark-900">
          <div className="relative overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={item.label ?? ''}
                className="w-full aspect-[16/9] object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full aspect-[16/9] bg-[radial-gradient(120%_140%_at_20%_0%,#007F78_0%,#004541_45%,#1A1A1A_100%)] flex items-center justify-center">
                {item.emoji && (
                  <span className="text-6xl drop-shadow-[0_0_24px_rgba(0,187,177,0.65)]">
                    {item.emoji}
                  </span>
                )}
              </div>
            )}
            {/* Balayage de lumière périodique sur l'image */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[lienShine_4.5s_ease-in-out_infinite]"
            />
            <span className="absolute top-4 right-4 inline-flex items-center gap-1 bg-neo text-dark-900 text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_18px_rgba(0,187,177,0.6)]">
              ⭐ Vedette
            </span>
          </div>
          <div className="px-6 py-6">
            <h2 className="text-white text-2xl font-extrabold leading-tight">
              {item.label} {item.emoji && imageUrl ? item.emoji : ''}
            </h2>
            {item.subtitle && <p className="text-gray-400 mt-1.5">{item.subtitle}</p>}
            <span className="mt-4 inline-flex items-center gap-1.5 bg-neo text-dark-900 font-bold px-5 py-3 rounded-xl shadow-[0_8px_24px_rgba(0,187,177,0.45)]">
              {item.ctaLabel || 'Découvrir →'}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

/** Lien standard : carte en verre dépoli sur le fond aurore. */
function LinkCard({ item, index }: { item: LienItem; index: number }) {
  const a = pop(index);
  const thumbUrl = item.image
    ? urlForImage(item.image).width(96).height(96).fit('crop').url()
    : null;

  return (
    <a
      href={item.url}
      className={`${a.className} group flex items-center gap-4 bg-white/80 rounded-2xl pl-4 pr-5 py-3.5 border border-white/90 shadow-lg shadow-neo-900/[0.07] transition-all duration-300 active:scale-[0.97] hover:shadow-xl hover:shadow-neo-900/[0.12] hover:bg-white/95`}
      style={a.style}
    >
      {thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbUrl}
          alt=""
          className="h-11 w-11 rounded-xl object-cover shrink-0 shadow-sm"
          loading="lazy"
        />
      ) : (
        <span
          className="h-11 w-11 rounded-xl bg-gradient-to-br from-neo-50 to-neo-100 ring-1 ring-neo-200/60 flex items-center justify-center text-xl shrink-0"
          aria-hidden="true"
        >
          {item.emoji || '🔗'}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-gray-900">{item.label}</span>
        {item.subtitle && (
          <span className="block text-sm text-gray-500 mt-0.5">{item.subtitle}</span>
        )}
      </span>
      <ChevronRight className="h-5 w-5 text-neo-600 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
    </a>
  );
}

export default function LienBio({ data }: { data: LienPageData | null }) {
  const page = data ?? FALLBACK;
  const items = (page.items?.length ? page.items : FALLBACK.items ?? []).filter(
    (item) => item._type === 'lienSection' || item.enabled !== false,
  );

  const socials = [
    { url: page.instagramUrl, label: 'Instagram', Icon: Instagram },
    { url: page.facebookUrl, label: 'Facebook', Icon: Facebook },
    { url: page.tiktokUrl, label: 'TikTok', Icon: TikTokIcon },
  ].filter((s) => s.url);

  let animIndex = 0;

  return (
    <div className="lien-root relative min-h-screen overflow-hidden bg-[#EDFAF9]">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Fond aurore : nappes de couleur qui dérivent lentement. Pas de filtre
          blur (trop coûteux) : le fondu vient du dégradé radial lui-même. */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none">
        <div
          className="absolute -top-[15%] -left-[20%] h-[60vh] w-[85vw] opacity-45 animate-[lienDriftA_19s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(ellipse at center, #00BBB1 0%, rgba(0,187,177,0.35) 35%, transparent 68%)' }}
        />
        <div
          className="absolute top-[30%] -right-[25%] h-[55vh] w-[80vw] opacity-40 animate-[lienDriftB_24s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(ellipse at center, #4DD1CA 0%, rgba(77,209,202,0.3) 35%, transparent 68%)' }}
        />
        <div
          className="absolute -bottom-[20%] left-[5%] h-[55vh] w-[75vw] opacity-35 animate-[lienDriftC_28s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(ellipse at center, #80DED9 0%, rgba(128,222,217,0.3) 35%, transparent 68%)' }}
        />
      </div>

      <main className="relative max-w-md mx-auto px-5 pt-12 pb-16">
        {/* En-tête */}
        <header className="text-center">
          <div className="lien-pop inline-block relative" style={{ animationDelay: '0ms' }}>
            {/* Halo lumineux pulsant derrière le logo */}
            <div
              aria-hidden="true"
              className="absolute inset-[-45%] rounded-full animate-[lienHalo_5s_ease-in-out_infinite]"
              style={{ background: 'radial-gradient(circle, rgba(0,187,177,0.5) 0%, rgba(0,187,177,0.2) 45%, transparent 70%)' }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoneo.svg"
              alt="NEO Performance"
              className="relative h-20 w-20 mx-auto animate-float"
            />
          </div>
          <h1
            className="lien-pop mt-4 text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neo-800 via-neo-600 to-neo-800"
            style={{ animationDelay: '70ms' }}
          >
            @neoperformance
          </h1>
          {page.tagline && (
            <p
              className="lien-pop mt-2 text-gray-700 leading-relaxed"
              style={{ animationDelay: '130ms' }}
            >
              {page.tagline}
            </p>
          )}
          {socials.length > 0 && (
            <div
              className="lien-pop mt-5 flex items-center justify-center gap-3"
              style={{ animationDelay: '190ms' }}
            >
              {socials.map(({ url, label, Icon }) => (
                <a
                  key={label}
                  href={url}
                  aria-label={label}
                  className="h-12 w-12 rounded-full bg-white/80 border border-white/90 shadow-lg shadow-neo-900/[0.07] flex items-center justify-center text-neo-800 transition-all duration-300 active:scale-90 hover:bg-white/95 hover:shadow-xl"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </header>

        {/* Liens */}
        <div className="mt-9 space-y-4">
          {items.map((item) => {
            animIndex += 1;
            if (item._type === 'lienSection') {
              const a = pop(animIndex);
              return (
                <div
                  key={item._key}
                  className={`${a.className} flex items-center gap-3 pt-4`}
                  style={a.style}
                >
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-neo-300" />
                  <h2 className="text-center text-neo-700 font-bold uppercase tracking-[0.15em] text-xs">
                    {item.heading}
                  </h2>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-neo-300" />
                </div>
              );
            }
            return item.featured ? (
              <FeaturedCard key={item._key} item={item} index={animIndex} />
            ) : (
              <LinkCard key={item._key} item={item} index={animIndex} />
            );
          })}
        </div>

        <footer className="lien-pop mt-12 text-center" style={{ animationDelay: '700ms' }}>
          <a
            href="https://www.neoperformance.ca"
            className="text-xs font-medium text-gray-500 hover:text-neo-700 transition-colors"
          >
            neoperformance.ca
          </a>
        </footer>
      </main>
    </div>
  );
}
