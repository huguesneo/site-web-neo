import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cette route crée un utilisateur Supabase et lui envoie un lien d'invitation
// pour qu'il crée son mot de passe sur neoperformance.ca.
// Elle nécessite la clé service_role (admin) — ne jamais exposer côté client.

const INVITE_SECRET = process.env.INVITE_API_SECRET;

export async function POST(req: NextRequest) {
  // Protection par secret partagé (à envoyer dans le header Authorization)
  const auth = req.headers.get('authorization') ?? '';
  if (!INVITE_SECRET || auth !== `Bearer ${INVITE_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Courriel invalide.' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://www.neoperformance.ca/espace-client',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId: data.user.id });
}
