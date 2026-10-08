import type { Utm } from './types';

// Les UTM de l'URL, transmis tels quels aux endpoints pour l'attribution.
export function lireUtm(params: URLSearchParams): Utm {
  const lire = (cle: string) => params.get(`utm_${cle}`)?.trim() || null;
  return {
    source: lire('source'),
    medium: lire('medium'),
    campaign: lire('campaign'),
    content: lire('content'),
    term: lire('term'),
  };
}
