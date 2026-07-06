import { NextRequest, NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────────────────
// Redirections 301 pour la migration depuis l'ancien site WordPress.
// Objectif SEO : aucune ancienne URL indexée par Google ne doit retomber en
// 404. On transfère le « jus SEO » accumulé vers la page équivalente du
// nouveau site. Les 301 sont permanentes : Google met à jour son index et
// reporte l'autorité de l'ancienne URL vers la nouvelle.
// ──────────────────────────────────────────────────────────────────────────

// Renommage de pages : ancien chemin WordPress → nouveau chemin.
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
};

// Premiers segments réellement servis par le nouveau site : on ne touche jamais
// à ces chemins. Tout le reste en un seul segment (ex. un ancien article de
// blogue WordPress) est considéré comme une URL morte à rediriger vers /blog.
const KNOWN_ROUTES = new Set([
  'approche',
  'blog',
  'boutique',
  'consultation',
  'contact',
  'equipe',
  'espace-client',
  'paiement',
  'panier',
  'quiz',
  'studio',
]);

export function middleware(req: NextRequest) {
  // On enlève l'éventuel slash final (les URLs WordPress en avaient un :
  // /nous-joindre/) pour comparer proprement.
  const pathname = req.nextUrl.pathname.replace(/\/+$/, '') || '/';

  // 1) Renommage explicite de page.
  const target = REDIRECTS[pathname];
  if (target) {
    return NextResponse.redirect(new URL(target, req.url), 301);
  }

  // 2) Anciens articles de blogue WordPress (slugs longs avec tirets, parfois
  //    des emojis encodés) qui vivaient à la racine du domaine. Ils n'existent
  //    plus : on les renvoie vers l'index du blogue plutôt qu'en 404.
  const firstSegment = pathname.split('/')[1] ?? '';
  const isSingleSegment = pathname.split('/').length === 2;
  if (
    isSingleSegment &&
    firstSegment &&
    !KNOWN_ROUTES.has(firstSegment) &&
    firstSegment.includes('-')
  ) {
    return NextResponse.redirect(new URL('/blog', req.url), 301);
  }

  // 2.5) Anciennes URLs produits WooCommerce, imbriquées sous une catégorie :
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

  // 3) Slash final sur une page valide (ex. /boutique/) : on 301 vers la
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
