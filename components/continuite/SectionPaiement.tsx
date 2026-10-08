'use client';
import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { checkoutCarte, checkoutNaturo, checkoutPublic, ErreurContinuite } from '@/lib/continuite/api';
import {
  NOMS_DUREES,
  NOMS_PALIERS,
  PRIX_CARTE_CENTS,
  TEXTE_CONSENTEMENT,
  argent,
  dateLongue,
} from '@/lib/continuite/contenu';
import type { ApercuNaturo, Coordonnees, Duree, Palier, Prix, Utm } from '@/lib/continuite/types';
import ChampsCoordonnees, {
  focusPremiereErreur,
  valider,
  type ErreursChamps,
} from '@/components/continuite/ChampsCoordonnees';
import CheckoutIntegre from '@/components/continuite/CheckoutIntegre';
import Turnstile from '@/components/continuite/Turnstile';
import { MessageErreur } from '@/components/continuite/Etats';

export type Commande = { type: 'abonnement'; palier: Palier; duree: Duree; prix: Prix } | { type: 'carte' };

export type Source =
  | { type: 'public' }
  | {
      type: 'naturo';
      jeton: string;
      cliente: ApercuNaturo['cliente'];
      datePremierPaiement: string | null;
      onJetonExpire: () => void;
    };

type Props = {
  commande: Commande;
  source: Source;
  utm: Utm;
  // Affiché en mode « carte » pour revenir à l'abonnement.
  onRevenirAuxForfaits?: () => void;
};

const VIDE: Coordonnees = { prenom: '', nom: '', courriel: '', telephone: '' };
const TOUS: (keyof Coordonnees)[] = ['prenom', 'nom', 'courriel', 'telephone'];
const SANS_TELEPHONE: (keyof Coordonnees)[] = ['prenom', 'nom', 'courriel'];

const estErreurJeton = (e: unknown) =>
  e instanceof ErreurContinuite && (e.code === 'jeton_invalide' || e.code === 'jeton_expire');

export default function SectionPaiement({ commande, source, utm, onRevenirAuxForfaits }: Props) {
  const cliente = source.type === 'naturo' ? source.cliente : null;
  const [coord, setCoord] = useState<Coordonnees>(() => (cliente ? { ...VIDE, ...cliente } : VIDE));
  const [erreursChamps, setErreursChamps] = useState<ErreursChamps>({});
  const [consent, setConsent] = useState(false);
  const [erreurConsent, setErreurConsent] = useState(false);
  const [turnstile, setTurnstile] = useState<string | null>(null);
  const [cleTurnstile, setCleTurnstile] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const abonnement = commande.type === 'abonnement';
  const cleCommande = abonnement ? commande.prix.price_id : 'carte';

  // Un Checkout déjà ouvert ne vaut que pour le forfait choisi à ce moment-là.
  useEffect(() => {
    setClientSecret(null);
    setErreur(null);
  }, [cleCommande]);

  // Champs : tous requis en public ; à la naturo, téléphone facultatif ; cliente du jeton : verrouillés.
  const requis = cliente ? [] : source.type === 'public' ? TOUS : SANS_TELEPHONE;

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    const errs = cliente ? {} : valider(coord, requis);
    setErreursChamps(errs);
    const manqueConsent = abonnement && !consent;
    setErreurConsent(manqueConsent);
    if (Object.keys(errs).length || manqueConsent) {
      focusPremiereErreur(errs);
      return;
    }
    if (source.type === 'public' && !turnstile) {
      setErreur('Complète la vérification de sécurité juste au-dessus du bouton.');
      return;
    }

    const remplis = Object.fromEntries(
      Object.entries(coord)
        .map(([k, v]) => [k, v.trim()])
        .filter(([, v]) => v),
    ) as Partial<Coordonnees>;

    setEnvoi(true);
    try {
      let reponse;
      if (!abonnement) {
        reponse = await checkoutCarte({
          ...VIDE,
          ...remplis,
          ...(source.type === 'naturo' ? { jeton: source.jeton } : { turnstile_token: turnstile! }),
          utm,
        });
      } else if (source.type === 'naturo') {
        reponse = await checkoutNaturo({
          jeton: source.jeton,
          price_id: commande.prix.price_id,
          // Avec une cliente portée par le jeton, l'app lit ses coordonnées dans son dossier.
          ...(cliente ? {} : remplis),
          utm,
        });
      } else {
        reponse = await checkoutPublic({
          price_id: commande.prix.price_id,
          prenom: remplis.prenom ?? '',
          nom: remplis.nom ?? '',
          courriel: remplis.courriel ?? '',
          telephone: remplis.telephone ?? '',
          turnstile_token: turnstile!,
          utm,
        });
      }
      setClientSecret(reponse.client_secret);
    } catch (err) {
      if (source.type === 'naturo' && estErreurJeton(err)) {
        source.onJetonExpire();
        return;
      }
      setErreur(err instanceof ErreurContinuite ? err.message : 'Un problème est survenu. Réessaie dans un instant.');
      if (source.type === 'public') {
        // Le jeton Turnstile est à usage unique : on en demande un nouveau.
        setTurnstile(null);
        setCleTurnstile((n) => n + 1);
      }
    } finally {
      setEnvoi(false);
    }
  };

  const recapNom = abonnement
    ? `${NOMS_PALIERS[commande.palier]} · ${NOMS_DUREES[commande.duree]}`
    : 'Suivi à la carte · une rencontre';
  const recapPrix = abonnement
    ? `${argent(commande.prix.montant_mensuel_cents)} par mois, + taxes`
    : `${argent(PRIX_CARTE_CENTS)} + taxes, une seule fois`;
  const datePremier =
    abonnement && source.type === 'naturo' && source.datePremierPaiement ? source.datePremierPaiement : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-5 py-4 bg-[#EBF8F7] rounded-[14px] text-[15px]">
        <span className="font-bold">{recapNom}</span>
        <span>{recapPrix}</span>
      </div>

      {!abonnement && onRevenirAuxForfaits && !clientSecret && (
        <button
          type="button"
          onClick={onRevenirAuxForfaits}
          className="self-start text-sm font-bold text-[#007F78] underline underline-offset-[3px]"
        >
          Revenir à l’abonnement
        </button>
      )}

      {clientSecret ? (
        <>
          <CheckoutIntegre clientSecret={clientSecret} />
          <button
            type="button"
            onClick={() => setClientSecret(null)}
            className="self-center text-sm font-bold text-[#007F78] underline underline-offset-[3px] py-2"
          >
            Modifier mes informations
          </button>
        </>
      ) : (
        <form onSubmit={soumettre} noValidate className="flex flex-col gap-5">
          <ChampsCoordonnees
            valeurs={coord}
            erreurs={erreursChamps}
            requis={requis}
            champs={cliente ? SANS_TELEPHONE : undefined}
            lectureSeule={!!cliente}
            grand={source.type === 'naturo'}
            aide={
              cliente
                ? { courriel: 'Courriel de ton dossier NEO. Pour le changer, avise ton ou ta naturopathe.' }
                : undefined
            }
            onChange={(cle, v) => setCoord((c) => ({ ...c, [cle]: v }))}
          />

          {abonnement && (
            <div>
              <label className="flex gap-3 text-sm leading-[1.55] text-[#4A5455] cursor-pointer">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setErreurConsent(false);
                  }}
                  aria-invalid={erreurConsent}
                  aria-describedby={erreurConsent ? 'consent-erreur' : undefined}
                  className="w-6 h-6 shrink-0 mt-px accent-[#007F78] cursor-pointer"
                />
                <span>{TEXTE_CONSENTEMENT}</span>
              </label>
              {erreurConsent && (
                <p id="consent-erreur" className="text-sm text-red-600 mt-1 ml-9">
                  Coche cette case pour continuer.
                </p>
              )}
            </div>
          )}

          {source.type === 'public' && (
            <Turnstile
              key={cleTurnstile}
              onJeton={setTurnstile}
              onErreur={() =>
                setErreur('La vérification de sécurité n’a pas pu se charger. Recharge la page et réessaie.')
              }
            />
          )}

          <div aria-live="polite">{erreur && <MessageErreur message={erreur} />}</div>

          <button
            type="submit"
            disabled={envoi}
            className="flex items-center justify-center gap-2 w-full min-h-14 rounded-full border-2 border-[#007F78] bg-[#007F78] text-white text-[17px] font-bold hover:bg-[#00615C] hover:border-[#00615C] disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007F78]"
          >
            {envoi && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
            {envoi ? 'Préparation du paiement…' : abonnement ? 'Confirmer ma place' : 'Réserver ma rencontre'}
          </button>

          {datePremier && (
            <p className="m-0 text-center text-[13px] text-[#4A5455]">
              Premier prélèvement le {dateLongue(datePremier)}
            </p>
          )}
          <p className="m-0 text-[13px] text-[#4A5455] flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#007F78]" aria-hidden="true" />
            Paiement sécurisé par Stripe. Ta carte n’est jamais conservée par NEO.
          </p>
        </form>
      )}
    </div>
  );
}
