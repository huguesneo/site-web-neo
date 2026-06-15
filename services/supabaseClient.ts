import { createClient } from '@supabase/supabase-js';

// Client Supabase pour l'espace client du site.
// ⚠️ Utilise le MÊME projet que l'application de suivi Neo Performance :
// les comptes (courriel + mot de passe) y sont donc partagés.
// La clé "anon" est publique et conçue pour le navigateur — aucun secret ici.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
