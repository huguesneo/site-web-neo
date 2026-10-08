'use client';
import { useEffect, useRef } from 'react';

/*
  Widget Cloudflare Turnstile, chargé à la demande (aucune dépendance npm).
  Un jeton ne sert qu'une fois : pour en obtenir un nouveau après un échec,
  le parent change la `key` du composant, ce qui remonte le widget.

  Sans NEXT_PUBLIC_TURNSTILE_SITE_KEY, on utilise la clé de test officielle
  de Cloudflare (toujours valide), pratique en développement seulement.
*/
const CLE_SITE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let chargement: Promise<TurnstileApi> | null = null;
function chargerTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  chargement ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
    s.onerror = () => {
      chargement = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(s);
  });
  return chargement;
}

type Props = {
  onJeton: (jeton: string | null) => void;
  onErreur?: () => void;
};

export default function Turnstile({ onJeton, onErreur }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Les callbacks changent à chaque rendu du parent : on garde la dernière version.
  const rappels = useRef({ onJeton, onErreur });
  rappels.current = { onJeton, onErreur };

  useEffect(() => {
    let id: string | null = null;
    let annule = false;
    chargerTurnstile()
      .then((ts) => {
        if (annule || !ref.current) return;
        id = ts.render(ref.current, {
          sitekey: CLE_SITE,
          language: 'fr',
          size: 'flexible',
          callback: (jeton: string) => rappels.current.onJeton(jeton),
          'expired-callback': () => rappels.current.onJeton(null),
          'error-callback': () => {
            rappels.current.onJeton(null);
            rappels.current.onErreur?.();
          },
        });
      })
      .catch(() => rappels.current.onErreur?.());
    return () => {
      annule = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, []);

  return <div ref={ref} className="min-h-[65px]" />;
}
