import type { Utm } from './types';

// Les UTM de l'URL, transmis tels quels aux endpoints pour l'attribution.
export function lireUtm(params: URLSearchParams): Utm {
  const lire = (cle: keyof Utm) => params.get(cle)?.trim().slice(0, 100) || null;
  return {
    utm_source: lire('utm_source'),
    utm_medium: lire('utm_medium'),
    utm_campaign: lire('utm_campaign'),
    utm_content: lire('utm_content'),
    utm_term: lire('utm_term'),
  };
}
