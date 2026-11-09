import Image from 'next/image';

/**
 * Habillage des pages partenaires (ex. /elody) : aucune navigation, aucun lien
 * vers le reste du site. Seulement le logo (non cliquable) en haut et un pied
 * de page minimal (politique de confidentialité, obligatoire Loi 25).
 *
 * Le header, le footer, le chatbot et le pop-up du site sont retirés par
 * SiteChrome (le layout racine enveloppe quand même ce groupe de routes).
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-[17px] leading-normal text-gray-900 lg:text-lg">
      <header className="flex justify-center pt-3 pb-2 lg:pt-7 lg:pb-3">
        <Image src="/logo-neo.webp" alt="NEO Performance" width={44} height={44} className="h-9 w-auto lg:h-11" />
      </header>

      <main className="flex-grow">{children}</main>

      {/* Marge basse mobile : la barre de réservation collante ne cache pas le lien. */}
      <footer className="border-t border-gray-100 bg-white pt-7 pb-[calc(104px+env(safe-area-inset-bottom))] text-sm text-gray-600 lg:pb-8">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} NEO Performance</span>
          <a
            href="/politique-de-confidentialite"
            className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-[#00655E]"
          >
            Politique de confidentialité
          </a>
        </div>
      </footer>
    </div>
  );
}
