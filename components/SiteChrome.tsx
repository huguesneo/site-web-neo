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
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith('/studio');

  if (isStudio) return <>{children}</>;

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
