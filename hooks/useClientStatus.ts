'use client';

/**
 * Hook — indique si le visiteur est un client connecté (session Supabase active).
 * Sert à appliquer le prix client (rabais automatique) dans la boutique et le panier.
 * Reprend le pattern déjà utilisé dans views/Account.tsx.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useClientStatus() {
  const [isClient, setIsClient] = useState(false);
  // `ready` passe à true une fois la session vérifiée, pour éviter de faire
  // clignoter le prix régulier → prix client au chargement.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsClient(!!data.session?.user);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsClient(!!session?.user);
      setReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isClient, ready };
}
