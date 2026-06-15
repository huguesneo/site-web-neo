import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Épingle la racine du projet : sans ça Next détecte un package-lock.json
  // parasite dans le dossier home et résout les modules au mauvais endroit
  // (erreurs "Cannot find module './XXXX.js'" au build).
  outputFileTracingRoot: path.join(__dirname),
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
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
