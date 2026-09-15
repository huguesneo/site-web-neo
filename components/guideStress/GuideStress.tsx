'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { CONSENTEMENT_GUIDE_VERSION, texteConsentementGuide } from '@/lib/guideStress';

interface Coordonnees {
  prenom: string;
  nom: string;
  courriel: string;
  telephone: string;
  consentement: boolean;
}

type Cle = keyof Coordonnees;

const COURRIEL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** « (438) 402-2883 » → « 4384022883 » ; le 1 nord-américain en tête est retiré. */
function normaliserTelephone(brut: string): string {
  const chiffres = brut.replace(/\D/g, '');
  return chiffres.length === 11 && chiffres.startsWith('1') ? chiffres.slice(1) : chiffres;
}

function erreursDe(c: Coordonnees): Partial<Record<Cle, string>> {
  const e: Partial<Record<Cle, string>> = {};
  if (!c.prenom.trim()) e.prenom = 'Ton prénom est requis.';
  if (!c.nom.trim()) e.nom = 'Ton nom est requis.';
  if (!COURRIEL_VALIDE.test(c.courriel.trim())) e.courriel = 'Entre une adresse courriel valide.';
  if (normaliserTelephone(c.telephone).length !== 10) e.telephone = 'Entre un numéro à 10 chiffres.';
  if (!c.consentement) e.consentement = 'On a besoin de ton accord pour t’envoyer le guide.';
  return e;
}

const APPRENTISSAGES = [
  'Pourquoi ton corps met la combustion des graisses sur pause',
  'Le test de 30 secondes pour sentir la bascule en mode récupération',
  'Le protocole pour envoyer le bon signal aux bons moments de ta journée',
];

export default function GuideStress() {
  const [valeur, setValeur] = useState<Coordonnees>({ prenom: '', nom: '', courriel: '', telephone: '', consentement: false });
  const [touches, setTouches] = useState<Partial<Record<Cle, boolean>>>({});
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'merci' | 'erreur'>('saisie');

  const erreurs = erreursDe(valeur);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setTouches({ prenom: true, nom: true, courriel: true, telephone: true, consentement: true });
    if (Object.keys(erreurs).length > 0) return;

    setEtat('envoi');
    const params = new URLSearchParams(window.location.search);
    try {
      const reponse = await fetch('/api/guide-stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: valeur.prenom.trim(),
          nom: valeur.nom.trim(),
          courriel: valeur.courriel.trim(),
          cellulaire: normaliserTelephone(valeur.telephone),
          consentement: { accepte: true, texte_version: CONSENTEMENT_GUIDE_VERSION },
          utm: {
            source: params.get('utm_source') ?? '',
            medium: params.get('utm_medium') ?? '',
            campaign: params.get('utm_campaign') ?? '',
            content: params.get('utm_content') ?? '',
            term: params.get('utm_term') ?? '',
          },
          page_url: window.location.href,
        }),
      });
      setEtat(reponse.ok ? 'merci' : 'erreur');
    } catch {
      setEtat('erreur');
    }
  }

  const champ = (cle: 'prenom' | 'nom' | 'courriel' | 'telephone', label: string, type: string, autoComplete: string) => {
    const erreur = touches[cle] ? erreurs[cle] : undefined;
    return (
      <div>
        <label htmlFor={`gs-${cle}`} className="mb-1.5 block text-sm font-semibold text-gray-700">
          {label}
        </label>
        <input
          id={`gs-${cle}`}
          type={type}
          autoComplete={autoComplete}
          value={valeur[cle]}
          onChange={(e) => setValeur({ ...valeur, [cle]: e.target.value })}
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

  return (
    <div className="bg-gray-50">
      {/* Bande foncée : même traitement que la porte ouverte, halos turquoise compris. */}
      <div className="relative overflow-hidden bg-gray-900 pt-28 pb-32 text-white md:pt-32 md:pb-40">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-neo/20 blur-[90px] md:-top-44 md:h-[700px] md:w-[1000px] md:blur-[140px]" />

        <div className="container relative z-10 mx-auto grid items-center gap-10 px-5 md:px-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="mb-4 block text-[11px] font-bold uppercase tracking-[0.14em] text-neo md:text-sm">
              Guide gratuit
            </span>
            <h1 className="mb-5 text-[36px] font-extrabold uppercase leading-[1.05] tracking-tight md:text-[60px]">
              Sors du <span className="text-neo">mode survie</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl lg:mx-0">
              Ton corps n’est pas cassé. Il est juste resté coincé en mode survie.{' '}
              <span className="font-semibold text-white">Et il existe un moyen précis de l’en sortir.</span>
            </p>
            <ul className="mx-auto flex max-w-xl flex-col gap-3 text-left lg:mx-0">
              {APPRENTISSAGES.map((a) => (
                <li key={a} className="flex items-start gap-3 text-[15px] text-gray-200 md:text-base">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neo/20 text-neo">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <Image
            src="/guide-sors-du-mode-survie.jpg"
            alt="Le guide Sors du mode survie de NEO Performance"
            width={1660}
            height={948}
            priority
            className="hidden w-full rounded-3xl lg:block"
          />
        </div>
      </div>

      {/* Carte formulaire en surplomb de la bande foncée. */}
      <div className="container relative z-10 mx-auto -mt-20 px-5 pb-24 md:px-12">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-2xl md:p-10">
          <Image
            src="/guide-sors-du-mode-survie.jpg"
            alt=""
            width={1660}
            height={948}
            className="mb-6 w-full rounded-2xl lg:hidden"
          />

          {etat === 'merci' ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neo/10 text-neo">
                <Mail size={30} />
              </div>
              <h2 className="mb-3 text-2xl font-extrabold text-gray-900 md:text-3xl">
                C’est parti, {valeur.prenom.trim()}!
              </h2>
              <p className="mb-8 leading-relaxed text-gray-600">
                Ton guide est en route vers <span className="font-semibold text-gray-900">{valeur.courriel.trim()}</span>.
                S’il n’est pas là d’ici quelques minutes, jette un œil dans tes promotions ou tes courriels indésirables.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-semibold text-neo transition-colors hover:text-neo-700"
              >
                Découvrir NEO Performance <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={soumettre} noValidate>
              <h2 className="mb-1.5 text-[22px] font-extrabold leading-tight tracking-tight text-gray-900 md:text-[28px]">
                Reçois ton guide gratuit
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-600 md:text-[15px]">
                Remplis le formulaire et il arrive dans ta boîte courriel.
              </p>

              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {champ('prenom', 'Prénom', 'text', 'given-name')}
                  {champ('nom', 'Nom', 'text', 'family-name')}
                </div>
                {champ('courriel', 'Courriel', 'email', 'email')}
                {champ('telephone', 'Cellulaire', 'tel', 'tel')}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={valeur.consentement}
                  onClick={() => {
                    setTouches((t) => ({ ...t, consentement: true }));
                    setValeur({ ...valeur, consentement: !valeur.consentement });
                  }}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      valeur.consentement
                        ? 'border-neo bg-neo text-white'
                        : touches.consentement && erreurs.consentement
                          ? 'border-red-400 text-transparent'
                          : 'border-gray-300 text-transparent'
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-gray-600">
                    {texteConsentementGuide(CONSENTEMENT_GUIDE_VERSION)}
                  </span>
                </button>
                {touches.consentement && erreurs.consentement && (
                  <p className="mt-2 text-sm text-red-600">{erreurs.consentement}</p>
                )}
              </div>

              {etat === 'erreur' && (
                <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  Oups, l’envoi n’a pas fonctionné. Réessaie dans un instant.
                </p>
              )}

              <button
                type="submit"
                disabled={etat === 'envoi'}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-neo px-6 py-4 text-lg font-bold text-white shadow-lg shadow-neo/30 transition-all hover:bg-neo-600 hover:shadow-xl disabled:opacity-70"
              >
                {etat === 'envoi' ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <>
                    Recevoir mon guide <ArrowRight size={20} />
                  </>
                )}
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-gray-500">
                <ShieldCheck size={14} className="text-neo" />
                100 % gratuit · Aucun spam ·{' '}
                <Link href="/politique-de-confidentialite" className="underline hover:text-neo">
                  Confidentialité
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
