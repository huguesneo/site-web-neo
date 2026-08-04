'use client';

import { useState } from 'react';

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const CONTACT_VIDE: Contact = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

const COURRIEL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Ne garde que les chiffres : « (438) 402-2883 » → « 4384022883 ». */
export function normaliserTelephone(brut: string): string {
  const chiffres = brut.replace(/\D/g, '');
  // Un 1 en tête (indicatif nord-américain) n'est pas conservé : Make attend
  // les 10 chiffres du numéro.
  return chiffres.length === 11 && chiffres.startsWith('1') ? chiffres.slice(1) : chiffres;
}

export function erreursContact(contact: Contact): Partial<Record<keyof Contact, string>> {
  const erreurs: Partial<Record<keyof Contact, string>> = {};
  if (!contact.firstName.trim()) erreurs.firstName = 'Ton prénom est requis.';
  if (!contact.lastName.trim()) erreurs.lastName = 'Ton nom est requis.';
  if (!COURRIEL_VALIDE.test(contact.email.trim())) {
    erreurs.email = 'Entre une adresse courriel valide.';
  }
  if (normaliserTelephone(contact.phone).length !== 10) {
    erreurs.phone = 'Entre un numéro à 10 chiffres.';
  }
  return erreurs;
}

/**
 * Dernier écran avant l'analyse : coordonnées obligatoires.
 *
 * Aucune case de consentement ici — elle vit dans le formulaire de réservation
 * Go High Level, à l'étape suivante.
 */
export default function ContactScreen({
  valeur,
  onChange,
  erreurs,
}: {
  valeur: Contact;
  onChange: (contact: Contact) => void;
  erreurs: Partial<Record<keyof Contact, string>>;
}) {
  const [touches, setTouches] = useState<Partial<Record<keyof Contact, boolean>>>({});

  const champ = (
    cle: keyof Contact,
    label: string,
    type: string,
    autoComplete: string,
    inputMode?: 'email' | 'tel' | 'text',
  ) => {
    const erreur = touches[cle] ? erreurs[cle] : undefined;
    return (
      <div>
        <label
          htmlFor={`bilanleo-${cle}`}
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          {label}
        </label>
        <input
          id={`bilanleo-${cle}`}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={valeur[cle]}
          onChange={(e) => onChange({ ...valeur, [cle]: e.target.value })}
          onBlur={() => setTouches((t) => ({ ...t, [cle]: true }))}
          aria-invalid={Boolean(erreur)}
          className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-gray-900 transition-colors focus:outline-none ${
            erreur ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-neo'
          }`}
        />
        {erreur && <p className="mt-1.5 text-sm text-red-600">{erreur}</p>}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-2">
        Dernière étape avant ton résultat
      </h1>
      <p className="text-gray-600 mb-8">
        On en a besoin pour te transmettre ton bilan et préparer ta rencontre.
      </p>

      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {champ('firstName', 'Prénom', 'text', 'given-name', 'text')}
          {champ('lastName', 'Nom', 'text', 'family-name', 'text')}
        </div>
        {champ('email', 'Courriel', 'email', 'email', 'email')}
        {champ('phone', 'Cellulaire', 'tel', 'tel', 'tel')}
      </div>
    </div>
  );
}
