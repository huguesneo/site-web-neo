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
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen =
    pathname?.startsWith('/studio') || pathname?.startsWith('/protocole-neo');

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
