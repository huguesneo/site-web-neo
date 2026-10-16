'use client';

import { useEffect } from 'react';

/**
 * Pixel Meta « NEO performance - GHL » (le même que sur felicitation-booking).
 * Monté seulement sur les pages de pub /rencontre-gratuite*. Ne pas utiliser
 * l'autre pixel (1022843418482938).
 *
 * Loi 25 : le pixel se charge seulement si la personne a accepté les témoins
 * dans la bannière du site (CookieConsent). Si elle accepte pendant sa visite,
 * on le charge à ce moment-là.
 *
 * Pas de Lead ni de Schedule ici : la réservation est comptée par GHL sur la
 * page de confirmation.
 */
export const META_PIXEL_ID = '731004690765374';

const CLE_CONSENTEMENT = 'neo_cookie_consent';

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

function consentementAccepte(): boolean {
  try {
    const brut = localStorage.getItem(CLE_CONSENTEMENT);
    return brut ? JSON.parse(brut)?.choice === 'accepted' : false;
  } catch {
    return false;
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

/** Événement personnalisé ; ignoré si le pixel n'est pas chargé (pas de consentement). */
export function trackCustom(nom: string, params?: Record<string, string>) {
  window.fbq?.('trackCustom', nom, params);
}

export default function MetaPixel() {
  useEffect(() => {
    let annule = false;

    // Après le rendu principal : on attend un moment calme du navigateur.
    const plusTard = (fn: () => void) => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 2500 });
      else setTimeout(fn, 1500);
    };

    const essayer = () => {
      if (!annule && consentementAccepte()) plusTard(chargerPixel);
    };

    // Pas d'attente de l'événement `load` : il attend la fin de l'iframe du
    // calendrier, ce qui retarderait le PageView de plusieurs secondes.
    essayer();
    window.addEventListener('neo:cookie-consent-resolved', essayer);
    return () => {
      annule = true;
      window.removeEventListener('neo:cookie-consent-resolved', essayer);
    };
  }, []);

  return null;
}
