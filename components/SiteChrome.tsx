'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import Chatbot from '@/components/Chatbot';

/**
 * Habillage du site (header, footer, bandeau cookies, chatbot).
 *
 * Masqué sur /studio (Sanity Studio) : le Studio occupe tout l'écran et a sa
 * propre barre d'outils ; sans ça, le header du site se superposait par-dessus
 * et cachait les actions (supprimer un article, copier le lien, etc.).
 *
 * Masqué aussi sur /protocole-neo : page montrée en partage d'écran par les
 * closers pendant l'appel — plein écran, sans navigation ni chatbot pour ne
 * pas distraire du pitch.
 *
 * (/mon-dossier, envoyée au prospect après l'appel, GARDE le menu du site :
 * la personne peut vouloir explorer le reste du site avant de réserver.)
 *
 * Masqué aussi sur /lien : page « lien en bio » ouverte depuis Instagram —
 * expérience plein écran type Linktree, sans navigation ni chatbot.
 *
 * Masqué aussi sur /continuite : page de vente envoyée par courriel, avec
 * son propre en-tête, son pied de page et sa barre de paiement en bas.
 *
 * Masqué aussi sur /continuite/naturo : ouverte par une naturopathe depuis
 * l'app NEO et montrée à la cliente à l'écran pendant un suivi.
 *
 * Masqué aussi sur /evaluation-reprise (et /reserver) : page envoyée par
 * courriel de réactivation, avec son propre en-tête et son pied de page.
 *
 * Masqué aussi sur /rencontre-gratuite : page de pub Meta, sans navigation
 * ni chatbot. Elle affiche elle-même la bannière cookies (Loi 25).
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen =
    pathname?.startsWith('/studio') ||
    pathname?.startsWith('/protocole-neo') ||
    pathname === '/lien' ||
    pathname === '/continuite' ||
    pathname?.startsWith('/continuite/naturo') ||
    pathname?.startsWith('/evaluation-reprise') ||
    pathname?.startsWith('/rencontre-gratuite');

  if (isFullScreen) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CookieConsent />
      <Chatbot />
    </>
  );
}
