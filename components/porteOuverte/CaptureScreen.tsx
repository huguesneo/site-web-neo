'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { CONSENTEMENT_VERSION, texteConsentement } from '@/lib/porteOuverte';

export interface Coordonnees {
  prenom: string;
  courriel: string;
  telephone: string;
  consentement: boolean;
}

export const COORDONNEES_VIDES: Coordonnees = {
  prenom: '',
  courriel: '',
  telephone: '',
  consentement: false,
};

const COURRIEL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Ne garde que les chiffres : « (438) 402-2883 » → « 4384022883 ». */
export function normaliserTelephone(brut: string): string {
  const chiffres = brut.replace(/\D/g, '');
  // Un 1 en tête (indicatif nord-américain) n'est pas conservé : Make attend
  // les 10 chiffres du numéro.
  return chiffres.length === 11 && chiffres.startsWith('1') ? chiffres.slice(1) : chiffres;
}

export function erreursCoordonnees(c: Coordonnees): Partial<Record<keyof Coordonnees, string>> {
  const erreurs: Partial<Record<keyof Coordonnees, string>> = {};
  if (!c.prenom.trim()) erreurs.prenom = 'Ton prénom est requis.';
  if (!COURRIEL_VALIDE.test(c.courriel.trim())) {
    erreurs.courriel = 'Entre une adresse courriel valide.';
  }
  if (normaliserTelephone(c.telephone).length !== 10) {
    erreurs.telephone = 'Entre un numéro à 10 chiffres.';
  }
  if (!c.consentement) {
    erreurs.consentement = 'On a besoin de ton accord pour t’écrire au sujet du 11 septembre.';
  }
  return erreurs;
}

/**
 * Étape 1 — trois champs et la case LCAP. Quinze secondes.
 *
 * Le consentement est ici, et non à la fin du questionnaire comme dans le plan
 * d'origine, pour une raison simple : c'est cette étape qui déclenche la
 * séquence de récupération des abandons. Sans la case ici, on écrirait à des
 * gens qui ne l'ont jamais cochée — et les personnes disqualifiées, qui sortent
 * après la deuxième question, ne l'atteindraient jamais.
 */
export default function CaptureScreen({
  valeur,
  onChange,
  erreurs,
}: {
  valeur: Coordonnees;
  onChange: (c: Coordonnees) => void;
  erreurs: Partial<Record<keyof Coordonnees, string>>;
}) {
  const [touches, setTouches] = useState<Partial<Record<keyof Coordonnees, boolean>>>({});

  const champ = (
    cle: 'prenom' | 'courriel' | 'telephone',
    label: string,
    type: string,
    autoComplete: string,
    inputMode: 'email' | 'tel' | 'text',
  ) => {
    const erreur = touches[cle] ? erreurs[cle] : undefined;
    return (
      <div>
        <label
          htmlFor={`po-${cle}`}
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          {label}
        </label>
        <input
          id={`po-${cle}`}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={valeur[cle]}
          onChange={(e) => onChange({ ...valeur, [cle]: e.target.value })}
          onBlur={() => setTouches((t) => ({ ...t, [cle]: true }))}
          aria-invalid={Boolean(erreur)}
          className={`w-full rounded-2xl border-2 bg-white px-4 py-3.5 text-base text-gray-900 transition-colors focus:outline-none ${
            erreur ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-neo'
          }`}
        />
        {erreur && <p className="mt-1.5 text-sm text-red-600">{erreur}</p>}
      </div>
    );
  };

  const erreurConsentement = touches.consentement ? erreurs.consentement : undefined;

  return (
    <div>
      <h1 className="mb-1.5 text-[21px] font-extrabold leading-tight tracking-tight text-gray-900 text-pretty md:mb-2 md:text-[28px]">
        Voyons si le 11 septembre est fait pour toi
      </h1>
      <p className="mb-5 text-sm leading-relaxed text-gray-600 md:mb-7 md:text-[15px]">
        Trois champs, puis quelques questions. Compte deux minutes en tout.
      </p>

      <div className="flex flex-col gap-3.5 md:gap-4.5">
        {champ('prenom', 'Prénom', 'text', 'given-name', 'text')}
        {champ('courriel', 'Courriel', 'email', 'email', 'email')}
        {champ('telephone', 'Cellulaire', 'tel', 'tel', 'tel')}
      </div>

      <div className="mt-7">
        <button
          type="button"
          role="checkbox"
          aria-checked={valeur.consentement}
          onClick={() => {
            setTouches((t) => ({ ...t, consentement: true }));
            onChange({ ...valeur, consentement: !valeur.consentement });
          }}
          className="flex w-full items-start gap-3 text-left"
        >
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
              valeur.consentement
                ? 'border-neo bg-neo text-white'
                : erreurConsentement
                  ? 'border-red-400 text-transparent'
                  : 'border-gray-300 text-transparent'
            }`}
          >
            <Check size={14} strokeWidth={3} />
          </span>
          <span className="text-sm text-gray-600 leading-relaxed">
            {texteConsentement(CONSENTEMENT_VERSION)}
          </span>
        </button>

        {erreurConsentement && (
          <p className="mt-2 text-sm text-red-600">{erreurConsentement}</p>
        )}

        <p className="mt-3 text-sm text-gray-400">
          <Link href="/politique-de-confidentialite" className="underline hover:text-neo">
            Politique de confidentialité
          </Link>
        </p>
      </div>
    </div>
  );
}
