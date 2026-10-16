'use client';

import { Suspense, useEffect, useState } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';

/**
 * Calendrier GHL de la rencontre découverte : le même que sur la VSL
 * (go.neoperformance.ca/booking-atelier). `calendrier_decouverte=A` remplit un
 * champ de contact GHL utilisé par les workflows : ne pas l'enlever, et ne pas
 * le remplacer par BOOKING_IFRAME_SRC (qui ne l'a pas).
 */
const CALENDRIER_ID = 'DIN6EPtG7eNU3Gf6ZRoC';
const CALENDRIER_URL = `https://api.leadconnectorhq.com/widget/booking/${CALENDRIER_ID}?calendrier_decouverte=A`;

// Hauteur réservée avant que form_embed.js redimensionne l'iframe (évite le CLS).
// form_embed.js pose overflow:auto en ligne : !overflow-hidden évite une barre
// de défilement dans l'iframe sur iPhone.
const HAUTEUR = 'min-h-[650px]';

/**
 * URL de l'iframe : paramètres fixes, puis tous ceux de la page (utm_*, fbclid,
 * ad_id…) pour l'attribution, puis lp_version et les extras (réponses de B).
 */
export function urlCalendrier(page: URLSearchParams, extras: Record<string, string>): string {
  const reserves = new Set(['calendrier_decouverte', 'lp_version', ...Object.keys(extras)]);
  const params = new URLSearchParams();
  page.forEach((valeur, cle) => {
    if (!reserves.has(cle)) params.append(cle, valeur);
  });
  Object.entries(extras).forEach(([cle, valeur]) => params.set(cle, valeur));
  return `${CALENDRIER_URL}&${params.toString()}`;
}

function Iframe({ version, extras }: { version: 'A' | 'B'; extras: Record<string, string> }) {
  const page = useSearchParams();
  const src = urlCalendrier(new URLSearchParams(page.toString()), {
    lp_version: version,
    ...extras,
  });
  // form_embed.js réécrit les attributs de l'iframe : on la monte côté client
  // seulement, puis on charge le script, sinon React signale un écart d'hydratation.
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);
  if (!monte) return <div className={HAUTEUR} aria-hidden="true" />;
  return (
    <>
      <iframe
        // form_embed.js reconnaît l'iframe par le préfixe de son id.
        id={`${CALENDRIER_ID}_rencontre`}
        src={src}
        scrolling="no"
        title="Réserver ma rencontre découverte"
        className={`block w-full border-0 !overflow-hidden ${HAUTEUR}`}
      />
      <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
    </>
  );
}

export default function Calendrier({ version, extras = {} }: { version: 'A' | 'B'; extras?: Record<string, string> }) {
  return (
    <Suspense fallback={<div className={HAUTEUR} aria-hidden="true" />}>
      <Iframe version={version} extras={extras} />
    </Suspense>
  );
}
