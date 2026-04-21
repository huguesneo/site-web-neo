import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page introuvable | NEO Performance',
  description: "La page que vous cherchez n'existe pas.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-extrabold text-neo mb-6">404</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page introuvable</h1>
        <p className="text-gray-500 mb-8">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-8 py-3 bg-neo hover:bg-neo-600 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-neo/40 hover:-translate-y-1 active:scale-95"
        >
          Retourner à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
