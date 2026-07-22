import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isExpired, type PwGiftCard } from '../../../../lib/gift-card';
import { GIFT_CARD_PRODUCT_ID } from '../../../../constants';

/**
 * Route serveur — liste les cartes-cadeaux d'un client connecté, avec leur
 * solde en temps réel (API PW Gift Cards Pro).
 *
 * Principe de sécurité (identique à /api/account/orders) : le navigateur
 * n'envoie QUE son jeton Supabase ; le courriel est dérivé du jeton, jamais
 * accepté du client. Une carte appartient au client si :
 *   - elle lui a été ENVOYÉE (recipient_email = courriel du compte), ou
 *   - il l'a ACHETÉE (la carte est liée à une ligne d'une de ses commandes
 *     WooCommerce via order_item_id).
 * L'API PW ne filtre pas par courriel : on liste puis on filtre ICI, côté
 * serveur — le navigateur ne voit jamais les cartes d'autrui.
 */
export const runtime = 'nodejs';

const WC_BASE = process.env.WC_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

function withAuth(url: URL): string {
  url.searchParams.set('consumer_key', WC_KEY as string);
  url.searchParams.set('consumer_secret', WC_SECRET as string);
  return url.toString();
}

/** Vérifie le jeton Supabase et retourne le courriel du compte, ou null. */
async function emailFromToken(accessToken?: string | null): Promise<string | null> {
  if (!accessToken) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const sb = createClient(url, anon);
    const { data, error } = await sb.auth.getUser(accessToken);
    if (error || !data?.user?.email) return null;
    return data.user.email.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * IDs des lignes de commande (line items) des commandes CARTE-CADEAU du client.
 * NB : le paramètre `search` de l'API commandes est ignoré sur cette boutique
 * (vérifié : une recherche bidon retourne quand même des résultats) — on filtre
 * plutôt par produit carte-cadeau (`product=5531`, fiable, ~30 commandes) puis
 * STRICTEMENT par courriel de facturation.
 */
async function fetchOwnOrderItemIds(email: string): Promise<Set<number>> {
  const ids = new Set<number>();
  try {
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        withAuth(new URL(`${WC_BASE}/wp-json/wc/v3/orders?product=${GIFT_CARD_PRODUCT_ID}&per_page=100&page=${page}`)),
        { cache: 'no-store' },
      );
      if (!res.ok) break;
      const orders: Array<{ billing?: { email?: string }; line_items?: Array<{ id: number }> }> = await res.json();
      if (!Array.isArray(orders) || orders.length === 0) break;
      for (const o of orders) {
        if ((o.billing?.email || '').toLowerCase() !== email) continue;
        for (const li of o.line_items ?? []) ids.add(li.id);
      }
      if (orders.length < 100) break;
    }
  } catch { /* fail-open : les cartes « reçues » restent trouvables */ }
  return ids;
}

interface RawPwCard {
  pimwick_gift_card_id: string;
  number: string;
  active: string;
  balance: string;
  expiration_date: string | null;
  recipient_email: string | null;
  order_item_id: string | null;
  create_date: string | null;
}

export async function POST(req: NextRequest) {
  if (!WC_BASE || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuration boutique manquante côté serveur.' }, { status: 500 });
  }

  let accessToken: string | null = null;
  try {
    const body = await req.json();
    accessToken = body?.accessToken ?? null;
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = await emailFromToken(accessToken);
  if (!email) {
    return NextResponse.json({ error: 'Session invalide ou expirée.' }, { status: 401 });
  }

  try {
    const [orderItemIds, cardsRes] = await Promise.all([
      fetchOwnOrderItemIds(email),
      fetch(
        withAuth(new URL(`${WC_BASE}/wp-json/wc-pimwick/v1/pw-gift-cards?limit=2000&orderby=CREATED&order=DESC`)),
        { cache: 'no-store' },
      ),
    ]);
    if (!cardsRes.ok) {
      return NextResponse.json({ error: `Erreur cartes-cadeaux ${cardsRes.status}` }, { status: 502 });
    }
    const all: RawPwCard[] = await cardsRes.json();

    const cards = (Array.isArray(all) ? all : [])
      .filter((c) => {
        const received = (c.recipient_email || '').toLowerCase() === email;
        const purchased = c.order_item_id ? orderItemIds.has(Number(c.order_item_id)) : false;
        return received || purchased;
      })
      .map((c) => {
        const card: PwGiftCard = {
          id: String(c.pimwick_gift_card_id),
          number: String(c.number),
          balance: parseFloat(String(c.balance)) || 0,
          active: String(c.active) === '1',
          expirationDate: c.expiration_date ? String(c.expiration_date) : null,
        };
        return {
          number: card.number,
          balance: Math.round(card.balance * 100) / 100,
          active: card.active,
          expired: isExpired(card),
          expirationDate: card.expirationDate,
          origin: (c.recipient_email || '').toLowerCase() === email ? 'reçue' : 'achetée',
          recipientEmail: c.recipient_email || null,
          createDate: c.create_date || null,
        };
      });

    return NextResponse.json({ cards });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la récupération des cartes-cadeaux.' },
      { status: 502 },
    );
  }
}
