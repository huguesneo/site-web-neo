import { createClient } from '@supabase/supabase-js';

// Client Supabase pour l'espace client du site.
// ⚠️ Utilise le MÊME projet que l'application de suivi Neo Performance :
// les comptes (courriel + mot de passe) y sont donc partagés.
// La clé "anon" est publique et conçue pour le navigateur — aucun secret ici.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// On ne fait PAS planter le build si les variables manquent (ex. deploy de
// prévisualisation) : on prévient dans la console et on retombe sur des
// valeurs neutres. En production, les variables doivent être définies sur
// Netlify, sinon l'authentification ne fonctionnera pas.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variables manquantes : NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      "L'espace client ne pourra pas se connecter tant qu'elles ne sont pas définies."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
