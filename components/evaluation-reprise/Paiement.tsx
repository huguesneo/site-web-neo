'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { creerCheckout, messageErreur, ErreurReprise } from '@/lib/evaluation-reprise/api';
import { MESSAGE_COURRIEL_INVALIDE, courrielValide, normaliserCourriel } from '@/lib/evaluation-reprise/courriel';
import type { Coordonnees, Utm } from '@/lib/continuite/types';
import ChampsCoordonnees, {
  focusPremiereErreur,
  valider,
  type ErreursChamps,
} from '@/components/continuite/ChampsCoordonnees';
import CheckoutIntegre from '@/components/continuite/CheckoutIntegre';
import Turnstile from '@/components/continuite/Turnstile';
import { MessageErreur } from '@/components/continuite/Etats';

const TOUS: (keyof Coordonnees)[] = ['prenom', 'nom', 'courriel', 'telephone'];

type Props = {
  cid: string | null;
  initiales: Coordonnees;
  utm: Utm;
};

/*
  Coordonnées, Turnstile, puis Checkout intégré de Stripe sur la même page.
  Au succès, Stripe redirige vers la return_url fixée par l'endpoint
  (/evaluation-reprise/reserver?session_id=…).
*/
export default function Paiement({ cid, initiales, utm }: Props) {
  const [coord, setCoord] = useState<Coordonnees>(initiales);
  const [erreursChamps, setErreursChamps] = useState<ErreursChamps>({});
  const [turnstile, setTurnstile] = useState<string | null>(null);
  const [cleTurnstile, setCleTurnstile] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    // Courriel normalisé (sans aucun espace, en minuscules) et validé comme le
    // serveur, avant Turnstile et avant le Checkout.
    const courriel = normaliserCourriel(coord.courriel);
    if (courriel !== coord.courriel) setCoord((c) => ({ ...c, courriel }));
    const errs = valider({ ...coord, courriel }, TOUS);
    if (courriel && !courrielValide(courriel)) errs.courriel = MESSAGE_COURRIEL_INVALIDE;
    setErreursChamps(errs);
    if (Object.keys(errs).length) {
      focusPremiereErreur(errs);
      return;
    }
    if (!turnstile) {
      setErreur('Complète la vérification de sécurité juste au-dessus du bouton.');
      return;
    }

    setEnvoi(true);
    try {
      const { client_secret } = await creerCheckout({
        ...(cid ? { cid } : {}),
        prenom: coord.prenom.trim(),
        nom: coord.nom.trim(),
        courriel,
        telephone: coord.telephone.trim(),
        turnstile_token: turnstile,
        utm,
      });
      setClientSecret(client_secret);
    } catch (err) {
      if (err instanceof ErreurReprise && err.code === 'courriel_invalide') {
        // Sous le champ courriel, pas en bandeau général. Texte du site (au
        // « tu ») plutôt que celui du serveur, partagé avec d'autres offres.
        const e = { courriel: MESSAGE_COURRIEL_INVALIDE };
        setErreursChamps(e);
        focusPremiereErreur(e);
      } else {
        setErreur(messageErreur(err));
      }
      // Le jeton Turnstile est à usage unique : on en demande un nouveau.
      setTurnstile(null);
      setCleTurnstile((n) => n + 1);
    } finally {
      setEnvoi(false);
    }
  };

  if (clientSecret) {
    return (
      <div className="flex flex-col gap-4">
        {clientSecret.startsWith('mock_er__') ? (
          <PaiementSimule clientSecret={clientSecret} />
        ) : (
          <CheckoutIntegre clientSecret={clientSecret} />
        )}
        <button
          type="button"
          onClick={() => setClientSecret(null)}
          className="self-center text-sm font-bold text-[#007F78] underline underline-offset-[3px] py-2"
        >
          Modifier mes informations
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} noValidate className="flex flex-col gap-5">
      <ChampsCoordonnees
        valeurs={coord}
        erreurs={erreursChamps}
        requis={TOUS}
        onChange={(cle, v) => setCoord((c) => ({ ...c, [cle]: v }))}
      />

      <Turnstile
        key={cleTurnstile}
        onJeton={setTurnstile}
        onErreur={() => setErreur('La vérification de sécurité n’a pas pu se charger. Recharge la page et réessaie.')}
      />

      <div aria-live="polite">{erreur && <MessageErreur message={erreur} />}</div>

      <button
        type="submit"
        disabled={envoi}
        className="flex items-center justify-center gap-2 w-full min-h-14 rounded-full border-2 border-[#007F78] bg-[#007F78] text-white text-[17px] font-bold hover:bg-[#00615C] hover:border-[#00615C] disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007F78]"
      >
        {envoi && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
        {envoi ? 'Préparation du paiement…' : 'Réserver mon évaluation'}
      </button>

      <p className="m-0 text-[13px] text-[#4A5455] flex items-center justify-center gap-2 text-center">
        <ShieldCheck className="w-4 h-4 shrink-0 text-[#007F78]" aria-hidden="true" />
        Paiement sécurisé par Stripe. Ta carte n’est jamais conservée par NEO.
      </p>
    </form>
  );
}

// Remplace le cadre Stripe en simulation locale (voir lib/evaluation-reprise/mock.ts).
function PaiementSimule({ clientSecret }: { clientSecret: string }) {
  const router = useRouter();
  const scenario = clientSecret.replace('mock_er__', '');
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center">
      <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Paiement simulé</p>
      <p className="mt-2 text-gray-800">Ici apparaîtra le formulaire de carte Stripe.</p>
      <button
        type="button"
        onClick={() => router.push(`/evaluation-reprise/reserver?session_id=mock_er_${scenario}`)}
        className="mt-5 inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full bg-[#007F78] text-white hover:bg-[#00615C]"
      >
        Simuler un paiement réussi
      </button>
    </div>
  );
}
