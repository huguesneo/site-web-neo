import { NextResponse } from 'next/server';
import { getShopProducts } from '@/services/products';

/**
 * Proxy produits — expose les produits boutique SANS jamais révéler les clés
 * WooCommerce au navigateur. Utilisé par les composants client (Chatbot/Léo)
 * et comme repli côté boutique. Résultat mis en cache (revalidate).
 */
export const runtime = 'nodejs';
export const revalidate = 600;

export async function GET() {
  const products = await getShopProducts();
  return NextResponse.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  });
}
