import type { Metadata } from 'next';
import QuizOmega3 from '@/components/QuizOmega3';

/**
 * Quiz oméga-3 : lien envoyé en DM Instagram (« commente OMÉGA »).
 * Page NON INDEXÉE : noindex/nofollow, hors sitemap, Disallow dans robots.txt,
 * aucun lien dans le menu ni le footer. Logique et textes : lib/omega3Config.ts.
 */
export const metadata: Metadata = {
  title: "Combien d'oméga-3 devrais-tu prendre ?",
  description: "En 1 minute, découvre ta cible quotidienne d'EPA + DHA selon ton alimentation, ton activité et ton objectif.",
  robots: { index: false, follow: false },
  alternates: { canonical: '/quiz-omega3' },
};

export default function Page() {
  return (
    // Même habillage que /quiz (views/QuizPage.tsx)
    <div className="relative pt-20 min-h-screen bg-gradient-to-b from-neo-50/40 via-[#F8FAFC] to-white overflow-hidden">
      <div className="pointer-events-none absolute top-24 -left-24 w-80 h-80 bg-neo/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-24 w-80 h-80 bg-yellow-400/5 rounded-full blur-3xl" />
      <div className="relative z-10">
        <QuizOmega3 />
      </div>
    </div>
  );
}
