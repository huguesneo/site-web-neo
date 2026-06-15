'use client';
import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { LogOut, Package, ClipboardList } from 'lucide-react';
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

  // Va chercher le prénom dans la table `clients` (colonne first_name),
  // associé par courriel — même donnée que l'application de suivi.
  useEffect(() => {
    let mounted = true;
    if (!user.email) return;

    supabase
      .from('clients')
      .select('first_name')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data?.first_name && typeof data.first_name === 'string') {
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
            {/* Mes commandes (à venir) */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neo/10 text-neo mb-4">
                <Package size={22} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Mes commandes</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Retrouvez ici l'historique de vos achats à la boutique.
              </p>
              <p className="mt-3 inline-block text-xs font-medium text-neo bg-neo-50 rounded-full px-3 py-1">
                Bientôt disponible
              </p>
            </div>

            {/* Mon suivi (à venir) */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neo/10 text-neo mb-4">
                <ClipboardList size={22} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Mon suivi</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Votre dossier et votre suivi NEO Performance, au même endroit.
              </p>
              <p className="mt-3 inline-block text-xs font-medium text-neo bg-neo-50 rounded-full px-3 py-1">
                Bientôt disponible
              </p>
            </div>
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
