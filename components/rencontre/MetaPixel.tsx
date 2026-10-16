'use client';

import { useEffect } from 'react';

/**
 * Pixel Meta « NEO performance - GHL » (le même que sur felicitation-booking).
 * Monté seulement sur les pages de pub /rencontre-gratuite*. Ne pas utiliser
 * l'autre pixel (1022843418482938).
 *
 * Chargé pour toutes les visites, peu importe le choix fait dans la bannière
 * cookies : décision d'affaires de NEO (attribution des pubs Meta).
 *
 * Pas de Lead ni de Schedule ici : la réservation est comptée par GHL sur la
 * page de confirmation.
 */
export const META_PIXEL_ID = '731004690765374';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function chargerPixel() {
  if (window.fbq) return;
  // Équivalent du code de base Meta : file d'attente puis fbevents.js en async.
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
}

/** Événement personnalisé ; ignoré si le pixel n'est pas encore chargé. */
export function trackCustom(nom: string, params?: Record<string, string>) {
  window.fbq?.('trackCustom', nom, params);
}

export default function MetaPixel() {
  useEffect(() => {
    // Après le rendu principal : on attend un moment calme du navigateur. Pas
    // d'attente de l'événement `load` : il attend la fin de l'iframe du
    // calendrier, ce qui retarderait le PageView de plusieurs secondes.
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(chargerPixel, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(chargerPixel, 1500);
    return () => clearTimeout(id);
  }, []);

  return null;
}
