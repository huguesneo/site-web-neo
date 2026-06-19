'use client';
import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { LogOut, Package, ArrowRight, FolderOpen } from 'lucide-react';
import Button from './Button';
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
      .select('first_name')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        setIsClinicClient(!!data);
        if (data?.first_name && typeof data.first_name === 'string') {
          const f = data.first_name.trim();
          if (f) setFirstName(f.charAt(0).toUpperCase() + f.slice(1));
        }
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
