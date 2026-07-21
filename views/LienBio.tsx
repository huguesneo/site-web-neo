import { Instagram, Facebook, ChevronRight, Star } from 'lucide-react';
import type { Image as SanityImage } from 'sanity';
import { urlForImage } from '@/sanity/lib/image';

/**
 * Page « lien en bio » (/lien) — remplace Linktree.
 *
 * Contenu géré dans Sanity Studio (document « Page Liens »). Rendu 100 %
 * serveur : toutes les animations sont en CSS pur (entrées en cascade, halo
 * doux du logo, dérive lente des taches de couleur) — aucun JS client, la page
 * charge instantanément dans le navigateur Instagram.
 *
 * Design aligné sur le reste du site NEO : fond clair et aéré, taches teal
 * floutées discrètes (comme la page d'accueil), titres Montserrat `font-bold
 * tracking-tight`, texte dégradé teal, boutons pilule `rounded-full`, cartes
 * blanches `rounded-2xl` à ombre douce. Fini le look « template » : fond aurore
 * saturé, bordure arc-en-ciel rotative et balayages de lumière ont été retirés.
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
      _key: 'temoignages',
      _type: 'lienLink',
      emoji: '⭐',
      label: 'Résultats clients (témoignages vidéo)',
      url: 'https://www.neoperformance.ca/temoignages',
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

// Styles d'animation propres à cette page (entrées en cascade, halo doux du
// logo, dérive très lente des taches de couleur du fond). Inclus ici plutôt que
// dans index.css : la page est autonome et rien d'autre ne les utilise.
//
// Perf : aucun filtre blur() animé (gèle le rendu sur mobile) ; on utilise des
// dégradés radiaux doux par nature. Fini la bordure conique rotative et les
// balayages de lumière — ils faisaient « gadget » et cassaient le ton premium.
const css = `
  @keyframes lienPop {
    from { opacity: 0; transform: translateY(22px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes lienBlob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(4%, 6%) scale(1.08); }
  }
  @keyframes lienHalo {
    0%, 100% { opacity: 0.35; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.08); }
  }
  .lien-pop {
    opacity: 0;
    animation: lienPop 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
    style: { animationDelay: `${120 + index * 80}ms` },
  };
}

/** Carte vedette : le CTA principal, mis en avant façon carte « hero » du site. */
function FeaturedCard({ item, index }: { item: LienItem; index: number }) {
  const a = pop(index);
  const imageUrl = item.image
    ? urlForImage(item.image).width(880).height(500).fit('crop').url()
    : null;

  return (
    <a href={item.url} className={`${a.className} block group`} style={a.style}>
      {/* Lueur teal douce derrière la carte (statique, premium) */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute -inset-2 rounded-[32px] bg-neo/15 blur-xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="relative rounded-3xl overflow-hidden bg-white border border-gray-100 ring-1 ring-neo/10 shadow-xl shadow-neo-900/10 transition-transform duration-300 group-hover:-translate-y-1 active:scale-[0.98]">
          <div className="relative">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={item.label ?? ''}
                className="w-full aspect-[16/9] object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full aspect-[16/9] bg-[radial-gradient(130%_150%_at_20%_0%,#00BBB1_0%,#007F78_50%,#00615C_100%)] flex items-center justify-center">
                {item.emoji && <span className="text-6xl">{item.emoji}</span>}
              </div>
            )}
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/85 backdrop-blur-md text-neo-700 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white shadow-sm">
              <Star size={12} fill="currentColor" /> Vedette
            </span>
          </div>
          <div className="px-6 py-6">
            <h2 className="text-gray-900 text-2xl font-bold tracking-tight leading-tight">
              {item.label} {item.emoji && imageUrl ? item.emoji : ''}
            </h2>
            {item.subtitle && (
              <p className="text-gray-600 mt-2 leading-relaxed">{item.subtitle}</p>
            )}
            <span className="mt-5 inline-flex items-center gap-1.5 bg-neo hover:bg-neo-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-neo/30 transition-colors">
              {item.ctaLabel || 'Découvrir'}
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

/** Lien standard : carte blanche épurée, cohérente avec les cartes du site. */
function LinkCard({ item, index }: { item: LienItem; index: number }) {
  const a = pop(index);
  const thumbUrl = item.image
    ? urlForImage(item.image).width(96).height(96).fit('crop').url()
    : null;

  return (
    <a
      href={item.url}
      className={`${a.className} group flex items-center gap-4 bg-white rounded-2xl pl-4 pr-5 py-4 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-neo-900/10 hover:border-neo/30 active:scale-[0.98]`}
      style={a.style}
    >
      {thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbUrl}
          alt=""
          className="h-12 w-12 rounded-xl object-cover shrink-0"
          loading="lazy"
        />
      ) : (
        <span
          className="h-12 w-12 rounded-xl bg-neo/10 ring-1 ring-neo/15 flex items-center justify-center text-xl shrink-0"
          aria-hidden="true"
        >
          {item.emoji || '🔗'}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-gray-900 leading-snug">{item.label}</span>
        {item.subtitle && (
          <span className="block text-sm text-gray-500 mt-0.5">{item.subtitle}</span>
        )}
      </span>
      <ChevronRight className="h-5 w-5 text-neo shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
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
    <div className="lien-root relative min-h-screen overflow-hidden bg-gradient-to-b from-neo-50/60 via-white to-white">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Fond : taches teal floutées très discrètes, comme la page d'accueil.
          Elles dérivent à peine — présence, pas spectacle. */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-neo/10 blur-3xl animate-[lienBlob_22s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-neo-200/25 blur-3xl animate-[lienBlob_26s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-neo/[0.08] blur-3xl animate-[lienBlob_30s_ease-in-out_infinite]" />
      </div>

      <main className="relative max-w-md mx-auto px-5 pt-14 pb-16">
        {/* En-tête */}
        <header className="text-center">
          <div className="lien-pop inline-block relative" style={{ animationDelay: '0ms' }}>
            {/* Halo teal doux derrière le logo */}
            <div
              aria-hidden="true"
              className="absolute inset-[-40%] rounded-full bg-[radial-gradient(circle,rgba(0,187,177,0.35)_0%,transparent_70%)] animate-[lienHalo_6s_ease-in-out_infinite]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoneo.svg"
              alt="NEO Performance"
              className="relative h-20 w-20 mx-auto animate-float"
            />
          </div>
          <h1
            className="lien-pop mt-4 text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neo-700 via-neo to-neo-700"
            style={{ animationDelay: '70ms' }}
          >
            @neoperformance
          </h1>
          {page.tagline && (
            <p
              className="lien-pop mt-2 text-gray-600 leading-relaxed"
              style={{ animationDelay: '130ms' }}
            >
              {page.tagline}
            </p>
          )}

          {/* Preuve sociale — étoiles + note réelle. Pas de photos : les avatars
              génériques faisaient « stock/IA » et minaient la crédibilité. */}
          <div
            className="lien-pop mt-5 inline-flex items-center gap-2.5 bg-white/70 backdrop-blur-sm border border-gray-100 shadow-sm rounded-full px-4 py-2"
            style={{ animationDelay: '175ms' }}
          >
            <span className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </span>
            <span className="text-[13px] text-gray-700">
              <span className="font-bold text-gray-900">4,9/5</span>
              <span className="text-gray-400"> · </span>
              4000+ avis vérifiés
            </span>
          </div>

          {socials.length > 0 && (
            <div
              className="lien-pop mt-5 flex items-center justify-center gap-3"
              style={{ animationDelay: '220ms' }}
            >
              {socials.map(({ url, label, Icon }) => (
                <a
                  key={label}
                  href={url}
                  aria-label={label}
                  className="h-11 w-11 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-neo transition-all duration-300 active:scale-90 hover:-translate-y-0.5 hover:shadow-md hover:text-neo-600"
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
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-neo-200" />
                  <h2 className="text-center text-neo-700 font-bold uppercase tracking-[0.15em] text-xs">
                    {item.heading}
                  </h2>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-neo-200" />
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
            className="text-xs font-medium text-gray-400 hover:text-neo-700 transition-colors"
          >
            neoperformance.ca
          </a>
        </footer>
      </main>
    </div>
  );
}
