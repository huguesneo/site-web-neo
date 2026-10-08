'use client';
import type { Coordonnees } from '@/lib/continuite/types';

export type ErreursChamps = Partial<Record<keyof Coordonnees, string>>;

const CHAMPS: { cle: keyof Coordonnees; libelle: string; type: string; autoComplete: string; demi?: boolean }[] = [
  { cle: 'prenom', libelle: 'Prénom', type: 'text', autoComplete: 'given-name', demi: true },
  { cle: 'nom', libelle: 'Nom', type: 'text', autoComplete: 'family-name', demi: true },
  { cle: 'courriel', libelle: 'Courriel', type: 'email', autoComplete: 'email' },
  { cle: 'telephone', libelle: 'Téléphone', type: 'tel', autoComplete: 'tel' },
];

// Validation côté client, seulement pour guider la saisie : l'endpoint revalide.
const MANQUANT: Record<keyof Coordonnees, string> = {
  prenom: 'Indique ton prénom.',
  nom: 'Indique ton nom.',
  courriel: 'Indique ton courriel.',
  telephone: 'Indique ton numéro de téléphone.',
};

export function valider(v: Coordonnees, requis: (keyof Coordonnees)[]): ErreursChamps {
  const e: ErreursChamps = {};
  for (const cle of requis) if (!v[cle].trim()) e[cle] = MANQUANT[cle];
  if (v.courriel.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.courriel.trim())) {
    e.courriel = 'Ce courriel ne semble pas valide.';
  }
  if (v.telephone.trim() && v.telephone.replace(/\D/g, '').length < 10) {
    e.telephone = 'Indique un numéro à 10 chiffres.';
  }
  return e;
}

// Place le focus sur le premier champ fautif, sinon sur la case de consentement.
export function focusPremiereErreur(erreurs: ErreursChamps) {
  const premier = CHAMPS.find((c) => erreurs[c.cle]);
  const cible = premier
    ? document.getElementById(`coord-${premier.cle}`)
    : document.getElementById('consent');
  cible?.focus();
}

type Props = {
  valeurs: Coordonnees;
  erreurs: ErreursChamps;
  onChange: (cle: keyof Coordonnees, valeur: string) => void;
  requis: (keyof Coordonnees)[];
  grand?: boolean;
};

export default function ChampsCoordonnees({ valeurs, erreurs, onChange, requis, grand }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {CHAMPS.map((c) => {
        const id = `coord-${c.cle}`;
        const erreur = erreurs[c.cle];
        const obligatoire = requis.includes(c.cle);
        return (
          <div key={c.cle} className={c.demi ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
            <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
              {c.libelle}
              {obligatoire ? (
                <span className="text-neo-700" aria-hidden="true"> *</span>
              ) : (
                <span className="font-normal text-gray-500"> (facultatif)</span>
              )}
            </label>
            <input
              id={id}
              name={c.cle}
              type={c.type}
              autoComplete={c.autoComplete}
              inputMode={c.type === 'tel' ? 'tel' : c.type === 'email' ? 'email' : undefined}
              required={obligatoire}
              value={valeurs[c.cle]}
              onChange={(e) => onChange(c.cle, e.target.value)}
              aria-invalid={!!erreur}
              aria-describedby={erreur ? `${id}-erreur` : undefined}
              className={`w-full border rounded-xl px-4 outline-none text-gray-900 bg-white focus:border-neo focus:ring-2 focus:ring-neo/20 ${
                grand ? 'py-3.5 text-lg' : 'py-3 text-base'
              } ${erreur ? 'border-red-400' : 'border-gray-200'}`}
            />
            {erreur && (
              <p id={`${id}-erreur`} className="text-sm text-red-600 mt-1">
                {erreur}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
