import { NextRequest, NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────────────────
// Redirections 301 pour la migration depuis l'ancien site WordPress.
// Objectif SEO : aucune ancienne URL indexée par Google ne doit retomber en
// 404. On transfère le « jus SEO » accumulé vers la page équivalente du
// nouveau site. Les 301 sont permanentes : Google met à jour son index et
// reporte l'autorité de l'ancienne URL vers la nouvelle.
// ──────────────────────────────────────────────────────────────────────────

// Renommage de pages : ancien chemin WordPress → nouveau chemin.
// Liste FERMÉE et explicite : toute URL absente d'ici tombe en vrai 404.
// (Surtout pas de redirection générique attrape-tout : ça crée un espace
// d'URL infini qui piège les crawlers et masque les vrais 404 dans GSC.)
const REDIRECTS: Record<string, string> = {
  '/a-propos': '/approche',
  '/nous-joindre': '/contact',
  '/forfaits': '/consultation',
  '/forfaits/entrainement': '/consultation',
  '/forfaits/nutrition': '/consultation',
  '/forfaits/duo': '/consultation',
  '/blogue': '/blog',
  '/mon-compte': '/espace-client',
  '/creation-de-compte': '/espace-client',
  '/privacy-policy': '/',
  // Anciens articles de blogue qui vivaient à la racine du domaine sur
  // WordPress : chacun 301 vers sa vraie URL sous /blog/<slug>.
  '/blocage-metabolique': '/blog/blocage-metabolique',
  '/cortisol-belly-mecanisme-graisse-abdominale': '/blog/cortisol-belly-mecanisme-graisse-abdominale',
  '/cortisol-viral-tiktok-mal-mesure': '/blog/cortisol-viral-tiktok-mal-mesure',
  '/inflammaging-silencieuse': '/blog/inflammaging-silencieuse',
  '/la-resistance-a-linsuline-silencieuse-comment-la-reconnaitre-et-linverser-sans-regime':
    '/blog/la-resistance-a-linsuline-silencieuse-comment-la-reconnaitre-et-linverser-sans-regime',
  '/marche-en-intervalles-hormones-femme-40-ans': '/blog/marche-en-intervalles-hormones-femme-40-ans',
  '/mocktails-cortisol-ete-sans-alcool': '/blog/mocktails-cortisol-ete-sans-alcool',
  '/ozempic-naturel-stimuler-glp-1-sans-injection': '/blog/ozempic-naturel-stimuler-glp-1-sans-injection',
  '/perimenopause-pourquoi-consulter-naturopathe-avant-hormones':
    '/blog/perimenopause-pourquoi-consulter-naturopathe-avant-hormones',
  '/perimenopause-ventre-cortisol-prise-de-poids': '/blog/perimenopause-ventre-cortisol-prise-de-poids',
  '/ton-microbiome-poids-science': '/blog/ton-microbiome-poids-science',

  // ── Anciennes pages « funnel » toujours diffusées (cartes d'affaires,
  //    réseaux sociaux, publicités). Redirections PERMANENTES : ces liens
  //    circulent hors du site, ils ne doivent jamais tomber en 404. ──
  '/rendezvousneo': '/consultation',
  // Page réelle hébergée hors du site Next.js, sur le funnel GoHighLevel.
  '/atelier-gratuit': 'https://go.neoperformance.ca/atelier-gratuit',
  '/quiz-metabolisme': '/quiz',

  // ── Anciens articles WordPress à la racine, confirmés dans Search Console
  //    (impressions/clics réels). 301 vers l'article équivalent du nouveau
  //    blogue. Ceux qui se terminaient par un emoji encodé sont indexés ici
  //    par leur slug ASCII (le suffixe emoji est retiré avant comparaison,
  //    voir normalizeForLookup ci-dessous). ──
  '/limpact-du-stress-sur-la-perte-de-poids-comment-gerer-le-stress-pour-reussir-votre-objectif':
    '/blog/cortisol-belly-mecanisme-graisse-abdominale',
  '/le-cortisol-et-ta-perte-de-poids': '/blog/cortisol-belly-mecanisme-graisse-abdominale',
  '/limpact-du-cortisol-sur-la-perte-de-poids-': '/blog/cortisol-belly-mecanisme-graisse-abdominale',
  '/comprendre-et-combattre-le-cortisol': '/blog/cortisol-belly-mecanisme-graisse-abdominale',
  '/le-lien-stress-et-poids-le-cortisol-et-votre-metabolisme':
    '/blog/cortisol-belly-mecanisme-graisse-abdominale',
  '/la-resistance-a-linsuline-cest-quoi':
    '/blog/la-resistance-a-linsuline-silencieuse-comment-la-reconnaitre-et-linverser-sans-regime',
  '/fraicheur-estivale-sans-sucre-ajoute-decouvrez-des-mocktails-savoureux-et-sains-pour-lete':
    '/blog/mocktails-cortisol-ete-sans-alcool',
  '/mocktail-mojito-festif-sans-sucre': '/blog/mocktails-cortisol-ete-sans-alcool',
};

// Retrouve la clé de redirection d'un chemin. On tente trois formes, de la
// plus fidèle à la plus permissive :
//   1. le chemin brut (déjà sans slash final) ;
//   2. sa version décodée (%C3%A9 → é, etc.) ;
//   3. sa version décodée dont on a retiré tout suffixe non-ASCII — les
//      anciens titres WordPress finissaient par un emoji (😰, 🤯, 🤷‍♀️…)
//      dont les octets exacts (ZWJ, sélecteurs de variante) sont pénibles à
//      reproduire ; on compare donc sur le slug ASCII de base.
function normalizeForLookup(pathname: string): string | undefined {
  if (REDIRECTS[pathname]) return REDIRECTS[pathname];

  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // chemin mal encodé : on garde la forme brute
  }
  if (decoded !== pathname && REDIRECTS[decoded]) return REDIRECTS[decoded];

  const asciiStripped = decoded.replace(/[^\x00-\x7F]+$/, '');
  if (asciiStripped !== decoded && REDIRECTS[asciiStripped]) return REDIRECTS[asciiStripped];

  return undefined;
}

export function middleware(req: NextRequest) {
  // On enlève l'éventuel slash final (les URLs WordPress en avaient un :
  // /nous-joindre/) pour comparer proprement.
  const pathname = req.nextUrl.pathname.replace(/\/+$/, '') || '/';

  // 1) Renommage explicite de page (brut, décodé, ou slug ASCII sans emoji).
  const target = normalizeForLookup(pathname);
  if (target) {
    return NextResponse.redirect(new URL(target, req.url), 301);
  }

  // 2) Anciennes URLs produits WooCommerce, imbriquées sous une catégorie :
  //      /boutique/supplements/[categorie/]<slug>/. Le nouveau site sert le
  //      même slug directement sous /boutique/<slug> : on saute droit au but
  //      plutôt que de renvoyer vers l'index (le slug produit ne change pas).
  if (pathname.startsWith('/boutique/supplements/')) {
    const segments = pathname.split('/').filter(Boolean);
    const slug = segments[segments.length - 1];
    if (slug) {
      return NextResponse.redirect(new URL(`/boutique/${slug}`, req.url), 301);
    }
  }

  // 3) Toute autre URL inconnue traverse le middleware sans redirection et
  //    aboutit sur app/not-found.tsx avec un vrai statut HTTP 404.

  // 4) Slash final sur une page valide (ex. /boutique/) : on 301 vers la
  //    version canonique sans slash. skipTrailingSlashRedirect étant activé,
  //    c'est ce middleware qui possède désormais cette normalisation, ce qui
  //    garantit un seul saut 301 au lieu d'une chaîne.
  if (req.nextUrl.pathname !== '/' && req.nextUrl.pathname.endsWith('/')) {
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, req.url), 301);
  }

  return NextResponse.next();
}

// On exclut les assets, l'API, les fichiers statiques et le Studio Sanity :
// le middleware ne tourne que sur les vraies pages publiques.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|studio|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
