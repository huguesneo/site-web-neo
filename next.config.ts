import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    formats: ['image/webp', 'image/avif'],
    // Seuls hôtes servant des images à next/image : le CDN Sanity (héro d'article)
    // et WordPress/WooCommerce (images produits). Le logo est local. On évite le
    // joker `**` (n'importe quel domaine devient un proxy d'optimisation ouvert).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'wp.neoperformance.ca',
        pathname: '/wp-content/**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  // On laisse le middleware gérer lui-même le slash final pour éviter une
  // chaîne de redirections (308 de normalisation + 301 de migration) sur les
  // anciennes URLs WordPress, qui avaient toutes un slash final.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
