'use client';
import React, { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY = 'neo_cookie_consent';

type ConsentState = 'accepted' | 'declined' | null;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Petit délai pour ne pas perturber le chargement initial
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function save(choice: ConsentState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, date: new Date().toISOString() }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-3 sm:p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

        {/* Barre colorée top */}
        <div className="h-1 bg-gradient-to-r from-neo to-neo/60" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">

            {/* Icône */}
            <div className="w-10 h-10 shrink-0 bg-neo/20 rounded-xl flex items-center justify-center text-neo mt-0.5">
              <Cookie size={20} />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ShieldCheck size={15} className="text-neo shrink-0" />
                  Respect de votre vie privée — Loi 25
                </h3>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed">
                NEO Performance utilise des cookies pour améliorer votre expérience et analyser le trafic.
                Conformément à la <span className="text-gray-300 font-medium">Loi 25 du Québec</span>, votre consentement est requis avant toute collecte.
              </p>

              {/* Section détails dépliable */}
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-neo mt-2 hover:text-neo/80 transition-colors"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {expanded ? 'Masquer les détails' : 'Voir les détails'}
              </button>

              {expanded && (
                <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs text-gray-400">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="font-bold text-white mb-1">Essentiels</p>
                    <p>Toujours actifs. Nécessaires au fonctionnement du site (panier, navigation).</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="font-bold text-white mb-1">Analytiques</p>
                    <p>Nous aident à comprendre comment vous utilisez le site (Google Analytics).</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="font-bold text-white mb-1">Marketing</p>
                    <p>Permettent de vous présenter des contenus pertinents sur d'autres plateformes.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <button
              onClick={() => save('accepted')}
              className="flex-1 bg-neo text-white font-bold py-2.5 px-5 rounded-xl hover:bg-neo/90 transition-colors text-sm"
            >
              Accepter tout
            </button>
            <button
              onClick={() => save('declined')}
              className="flex-1 bg-white/10 text-gray-300 font-bold py-2.5 px-5 rounded-xl hover:bg-white/20 transition-colors text-sm"
            >
              Refuser les non-essentiels
            </button>
            <button
              onClick={() => save('declined')}
              className="sm:w-10 sm:shrink-0 flex items-center justify-center text-gray-500 hover:text-white transition-colors py-2.5 sm:py-0"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-[10px] text-gray-600 mt-3 text-center">
            Votre choix est sauvegardé et ne vous sera plus demandé. Vous pouvez le modifier en effaçant les données de votre navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
