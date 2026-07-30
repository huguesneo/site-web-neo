'use client';
import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { LogOut, Package, ArrowRight, FolderOpen, Smartphone, Globe } from 'lucide-react';
import Button from './Button';
import AccountGiftCards from './AccountGiftCards';
import { supabase } from '../services/supabaseClient';

// Trouve le prénom à afficher. L'application de suivi peut stocker le nom
// à différents endroits dans les métadonnées du compte Supabase ; on essaie
// les variantes les plus courantes, sinon on retombe sur le début du courriel
// (nettoyé : « hugues.pugliese@… » → « Hugues »).
function getFirstName(user: User): string {
  const m = (user.user_metadata || {}) as Record<string, unknown>;
  const raw =
    m.first_name ||
    m.firstName ||
    m.prenom ||
    m.prénom ||
    m.given_name ||
    m.full_name ||
    m.name ||
    m.display_name;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  if (raw && typeof raw === 'string' && raw.trim()) {
    return capitalize(raw.trim().split(/\s+/)[0]);
  }
  // Repli : on prend la 1re partie du courriel (avant @, point, tiret, chiffre).
  const local = (user.email || '').split('@')[0];
  const token = local.split(/[._\-0-9]/).filter(Boolean)[0];
  return token ? capitalize(token) : 'à vous';
}

interface AccountDashboardProps {
  user: User;
  onSignOut: () => void;
  signingOut?: boolean;
}

const AccountDashboard: React.FC<AccountDashboardProps> = ({ user, onSignOut, signingOut }) => {
  // Repli immédiat dérivé du courriel, le temps de lire le vrai prénom.
  const [firstName, setFirstName] = useState<string>(() => getFirstName(user));

  // Client de la clinique = personne possédant une fiche dans `clients`. Les
  // sections « Mon suivi » et « Mes documents » (contenu clinique) ne s'affichent
  // que pour eux. `undefined` = pas encore déterminé (on n'affiche rien avant).
  const [isClinicClient, setIsClinicClient] = useState<boolean | undefined>(undefined);
  // Jeton public de la fiche client (table `clients`), utilisé pour construire
  // le lien direct vers l'espace de suivi : app.neoperformance.ca/client/<public_token>.
  const [clientToken, setClientToken] = useState<string | null>(null);

  // Va chercher le prénom + l'existence d'une fiche dans la table `clients`,
  // associée par courriel — même donnée que l'application de suivi.
  useEffect(() => {
    let mounted = true;
    if (!user.email) {
      setIsClinicClient(false);
      return;
    }

    supabase
      .from('clients')
      .select('public_token, first_name')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        setIsClinicClient(!!data);
        if (data?.first_name && typeof data.first_name === 'string') {
          const f = data.first_name.trim();
          if (f) setFirstName(f.charAt(0).toUpperCase() + f.slice(1));
        }
        if (data?.public_token) setClientToken(String(data.public_token));
      });

    return () => {
      mounted = false;
    };
  }, [user.email]);

  return (
    <>
      {/* Hero (même style que les autres pages : bande grise puis blanc) */}
      <div className="bg-gray-50 pt-32 pb-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bienvenue, {firstName}&nbsp;!
          </h1>
          <p className="text-gray-600 text-lg break-words">{user.email}</p>
        </div>
      </div>

      <div className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Cartes de sections */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Mes commandes */}
            <Link
              href="/espace-client/commandes"
              className="group bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 transition hover:shadow-2xl hover:border-neo/30 hover:-translate-y-0.5"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neo/10 text-neo mb-4">
                <Package size={22} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Mes commandes</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Retrouvez ici l'historique de vos achats à la boutique.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-neo">
                Voir mes commandes
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Mes documents — clients de la clinique seulement */}
            {isClinicClient && (
              <Link
                href="/espace-client/documents"
                className="group bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 transition hover:shadow-2xl hover:border-neo/30 hover:-translate-y-0.5"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neo/10 text-neo mb-4">
                  <FolderOpen size={22} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Mes documents</h2>
                <p className="mt-1.5 text-sm text-gray-500">
                  Stratégies alimentaires, programmes d'entraînement et reçus.
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-neo">
                  Voir mes documents
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )}
          </div>

          {/* Mes cartes-cadeaux — s'affiche seulement si le client en possède */}
          <AccountGiftCards />

          {/* Application NEO Performance — clients de la clinique seulement */}
          {isClinicClient && (
            <div className="mt-4 bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neo/10 text-neo shrink-0">
                  <Smartphone size={22} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Mon application NEO Performance</h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Accédez à votre profil, vos programmes et votre suivi personnalisé directement depuis
                l'application.
              </p>
              {/* Accès web — action principale */}
              <a
                href={
                  clientToken
                    ? `https://app.neoperformance.ca/client/${clientToken}`
                    : 'https://app.neoperformance.ca'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neo text-white text-sm font-semibold hover:bg-neo-600 transition-colors w-full sm:w-auto"
              >
                <Globe size={17} />
                Accéder à l&apos;application sur le Web
              </a>

              {/* Téléchargement mobile */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Ou téléchargez l&apos;application mobile
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://apps.apple.com/ca/app/neo-performance/id6756714068"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors justify-center sm:justify-start"
                    aria-label="Télécharger NEO Performance sur l'App Store"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.13-2.19 1.28-2.17 3.82.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.76M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left leading-tight">
                      <div className="text-[10px] text-gray-300">Télécharger dans</div>
                      <div className="text-sm font-semibold">l&apos;App Store</div>
                    </div>
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=ca.neoperformance.app&hl=fr_CA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors justify-center sm:justify-start"
                    aria-label="Télécharger NEO Performance sur Google Play"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l10.703-10.63L1.337.924zM12.98 12.943l3.238 3.216-12.8 7.246 9.562-10.462zm0-1.775L3.395.668l12.822 7.259-3.237 3.241z"/>
                    </svg>
                    <div className="text-left leading-tight">
                      <div className="text-[10px] text-gray-300">Disponible sur</div>
                      <div className="text-sm font-semibold">Google Play</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button to="/boutique" variant="outline">
              Visiter la boutique
            </Button>
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition disabled:opacity-50"
            >
              <LogOut size={16} />
              {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountDashboard;
