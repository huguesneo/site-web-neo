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
};

export function middleware(req: NextRequest) {
  // On enlève l'éventuel slash final (les URLs WordPress en avaient un :
  // /nous-joindre/) pour comparer proprement.
  const pathname = req.nextUrl.pathname.replace(/\/+$/, '') || '/';

  // 1) Renommage explicite de page.
  const target = REDIRECTS[pathname];
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
