import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Relais vers le webhook Make du questionnaire /bilanleo.
 *
 * Passer par le serveur plutôt que d'appeler Make depuis le navigateur évite
 * tout blocage CORS et garde l'URL du hook hors du code livré au client.
 * L'URL peut être surchargée par la variable d'environnement
 * BILANLEO_WEBHOOK_URL sans redéploiement de code.
 */
const WEBHOOK_PAR_DEFAUT = 'https://hook.us1.make.com/2r7ngtl1aqe8k5dfp2ecxpjf43gx52f7';

export async function POST(req: NextRequest) {
  const charge = await req.json();

  let reponse: Response;
  try {
    reponse = await fetch(process.env.BILANLEO_WEBHOOK_URL ?? WEBHOOK_PAR_DEFAUT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(charge),
    });
  } catch (erreur) {
    console.error('[bilanleo] Make injoignable', erreur);
    return NextResponse.json({ error: 'Make injoignable' }, { status: 502 });
  }

  if (!reponse.ok) {
    // Le client journalise et réessaie une fois ; il ne bloque jamais la personne.
    return NextResponse.json(
      { error: `Make a répondu ${reponse.status}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
