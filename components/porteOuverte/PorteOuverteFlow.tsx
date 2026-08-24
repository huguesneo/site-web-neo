'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import {
  BAREME_VERSION,
  CONSENTEMENT_VERSION,
  DEJA_ESSAYE_EXCLUSIF,
  DISPONIBILITES_PAR_DEFAUT,
  Q_ANCIENNETE,
  Q_BUDGET,
  Q_DEJA_CLIENT,
  Q_DEJA_ESSAYE,
  Q_DEJA_PORTE_OUVERTE,
  Q_LBS_CIBLE,
  Q_MODALITE,
  Q_OBJECTIF,
  Q_PRIORITE,
  REPONSES_VIDES,
  calculerScoreBonus,
  calculerStatut,
  type DejaEssaye,
  type Disponibilites,
  type DqMotif,
  type Reponses,
} from '@/lib/porteOuverte';
import CaptureScreen, {
  COORDONNEES_VIDES,
  erreursCoordonnees,
  normaliserTelephone,
  type Coordonnees,
} from './CaptureScreen';
import ChoiceScreen from './ChoiceScreen';
import BookingScreen from './BookingScreen';
import WaitlistScreen from './WaitlistScreen';
import DisqualifiedScreen from './DisqualifiedScreen';
import Hero from './Hero';
import SalesSections from './SalesSections';

type Phase = 'capture' | 'questions' | 'verification' | 'booking' | 'attente' | 'dq';

/** Les neuf questions de l'étape 2, dans l'ordre. */
const ETAPES = [
  'deja_client',
  'deja_porte_ouverte',
  'objectif',
  'lbs_cible',
  'anciennete',
  'deja_essaye',
  'priorite',
  'budget',
  'modalite',
] as const;

type EtapeId = (typeof ETAPES)[number];

/** Au-delà, on arrête d'attendre GHL et on ouvre les deux calendriers. */
const ATTENTE_MAX_MS = 4000;

const CLE_LEAD_ID = 'po_lead_id';

/**
 * Identifiant du lead, généré ici et non déduit du courriel.
 *
 * C'est lui qui fait tenir la récupération des abandons : quelqu'un qui se
 * trompe de courriel à l'étape 1 et le corrige à l'étape 2 doit produire une
 * mise à jour dans Make, pas un deuxième contact resté taggé « incomplet » pour
 * l'éternité. Conservé en sessionStorage pour survivre à un rafraîchissement.
 */
function leadId(): string {
  try {
    const existant = window.sessionStorage.getItem(CLE_LEAD_ID);
    if (existant) return existant;
  } catch {
    // sessionStorage refusé (navigation privée stricte) : on repart d'un
    // identifiant neuf, ce qui reste mieux que de bloquer l'inscription.
  }

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `po-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    window.sessionStorage.setItem(CLE_LEAD_ID, id);
  } catch {
    /* voir ci-dessus */
  }
  return id;
}

/** Paramètres UTM de l'URL d'arrivée, pour attribuer la source dans Make. */
function lireUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const cle of ['source', 'medium', 'campaign', 'content', 'term']) {
    const valeur = params.get(`utm_${cle}`);
    if (valeur) utm[cle] = valeur;
  }
  return utm;
}

/** Preuve de consentement estampillée par le serveur à l'étape 1. */
interface PreuveConsentement {
  consent_text: string;
  consent_at: string;
  consent_ip: string;
}

/**
 * Envoie au relais serveur, qui transmet à Make.
 *
 * Volontairement tolérant : un seul réessai après 3 secondes, puis on
 * journalise et on laisse tomber. Chaque rejeu crée une exécution Make, donc
 * jamais de boucle — et un webhook en panne ne doit jamais empêcher quelqu'un
 * de réserver sa place.
 */
function envoyerWebhook(charge: unknown): Promise<PreuveConsentement | null> {
  const appel = () =>
    fetch('/api/porte-ouverte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(charge),
      keepalive: true,
    }).then(async (r) => {
      if (!r.ok) throw new Error(`statut ${r.status}`);
      const donnees = (await r.json()) as { consentement?: PreuveConsentement };
      return donnees.consentement ?? null;
    });

  return appel().catch((erreur) => {
    console.error('[porte-ouverte] envoi du webhook échoué, réessai dans 3 s', erreur);
    return new Promise<PreuveConsentement | null>((resoudre) => {
      window.setTimeout(() => {
        appel()
          .then(resoudre)
          .catch((e) => {
            console.error('[porte-ouverte] réessai du webhook échoué', e);
            resoudre(null);
          });
      }, 3000);
    });
  });
}

export default function PorteOuverteFlow() {
  const [phase, setPhase] = useState<Phase>('capture');
  const [coordonnees, setCoordonnees] = useState<Coordonnees>(COORDONNEES_VIDES);
  const [reponses, setReponses] = useState<Reponses>(REPONSES_VIDES);
  const [index, setIndex] = useState(0);
  const [disponibilites, setDisponibilites] = useState<Disponibilites>(DISPONIBILITES_PAR_DEFAUT);
  const [raisonAttente, setRaisonAttente] = useState<'froid' | 'complet'>('froid');
  const [dqMotif, setDqMotif] = useState<DqMotif>('cliente-actuelle');
  const reduitLeMouvement = useReducedMotion();

  const identifiant = useRef<string>('');
  const utm = useRef<Record<string, string>>({});
  const consentement = useRef<PreuveConsentement | null>(null);

  // La vérification des places part dès que le questionnaire commence, pas à la
  // fin : elle a ainsi les 90 secondes des questions pour répondre, et l'attente
  // devient invisible.
  const verification = useRef<Promise<Disponibilites> | null>(null);
  const dernieresDisponibilites = useRef<Disponibilites | null>(null);

  const etape = ETAPES[index];
  const erreursContact = erreursCoordonnees(coordonnees);

  useEffect(() => {
    utm.current = lireUtm();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, phase]);

  /** Coordonnées telles qu'envoyées à Make — normalisées une seule fois, ici. */
  const contactPourMake = () => ({
    prenom: coordonnees.prenom.trim(),
    courriel: coordonnees.courriel.trim(),
    cellulaire: normaliserTelephone(coordonnees.telephone),
  });

  const commencerQuestions = () => {
    if (Object.keys(erreursContact).length > 0) return;

    identifiant.current = leadId();

    void envoyerWebhook({
      etape: 1,
      po_lead_id: identifiant.current,
      ...contactPourMake(),
      consentement: { accepte: coordonnees.consentement, texte_version: CONSENTEMENT_VERSION },
      page_url: window.location.href,
      utm: utm.current,
    }).then((preuve) => {
      // Réémise telle quelle à l'étape 2, pour que les deux scénarios Make
      // reçoivent la preuve du moment où la case a réellement été cochée.
      if (preuve) consentement.current = preuve;
    });

    // On n'attend pas la réponse du webhook : le lead est parti, la personne
    // continue. Le verdict sur les places démarre en parallèle.
    verification.current = fetch('/api/porte-ouverte/disponibilites')
      .then((r) => (r.ok ? (r.json() as Promise<Disponibilites>) : DISPONIBILITES_PAR_DEFAUT))
      .catch((erreur) => {
        console.error('[porte-ouverte] places injoignables', erreur);
        return DISPONIBILITES_PAR_DEFAUT;
      })
      .then((d) => {
        dernieresDisponibilites.current = d;
        return d;
      });

    setPhase('questions');
  };

  /** Fin du parcours : on calcule, on envoie, puis on route. */
  const terminer = (reponsesFinales: Reponses) => {
    const { statut, motif } = calculerStatut(reponsesFinales);
    const score = calculerScoreBonus(reponsesFinales);

    const envoyer = (dispo: Disponibilites) =>
      void envoyerWebhook({
        etape: 2,
        po_lead_id: identifiant.current,
        ...contactPourMake(),
        reponses: reponsesFinales,
        po_statut: statut,
        po_dq_motif: motif,
        po_score_bonus: score,
        po_bareme_version: BAREME_VERSION,
        places_restantes: dispo.clinique || dispo.visio,
        consentement_etape1: consentement.current,
        page_url: window.location.href,
        utm: utm.current,
      });

    // Une disqualification ne dépend pas des places : rien à attendre.
    if (statut === 'dq' && motif) {
      envoyer(dernieresDisponibilites.current ?? DISPONIBILITES_PAR_DEFAUT);
      setDqMotif(motif);
      setPhase('dq');
      return;
    }

    // Un froid non plus — il va en liste d'attente quoi qu'il arrive.
    if (statut === 'froid') {
      envoyer(dernieresDisponibilites.current ?? DISPONIBILITES_PAR_DEFAUT);
      setRaisonAttente('froid');
      setPhase('attente');
      return;
    }

    setPhase('verification');

    void (async () => {
      const dispo = await Promise.race([
        verification.current ?? Promise.resolve(DISPONIBILITES_PAR_DEFAUT),
        new Promise<Disponibilites>((resoudre) =>
          setTimeout(
            () => resoudre(dernieresDisponibilites.current ?? DISPONIBILITES_PAR_DEFAUT),
            ATTENTE_MAX_MS,
          ),
        ),
      ]);

      dernieresDisponibilites.current = dispo;
      setDisponibilites(dispo);
      envoyer(dispo);

      if (dispo.clinique || dispo.visio) {
        setPhase('booking');
      } else {
        setRaisonAttente('complet');
        setPhase('attente');
      }
    })();
  };

  /** Enregistre une réponse et avance — ou court-circuite sur une disqualification. */
  const repondre = (patch: Partial<Reponses>) => {
    setReponses((r) => ({ ...r, ...patch }));
  };

  const basculerDejaEssaye = (valeur: DejaEssaye) => {
    setReponses((r) => {
      // « Rien de structuré » contredit tout le reste, dans les deux sens.
      if (valeur === DEJA_ESSAYE_EXCLUSIF) {
        return {
          ...r,
          deja_essaye: r.deja_essaye.includes(valeur) ? [] : [DEJA_ESSAYE_EXCLUSIF],
        };
      }
      const sansExclusif = r.deja_essaye.filter((v) => v !== DEJA_ESSAYE_EXCLUSIF);
      return {
        ...r,
        deja_essaye: sansExclusif.includes(valeur)
          ? sansExclusif.filter((v) => v !== valeur)
          : [...sansExclusif, valeur],
      };
    });
  };

  const valide = (() => {
    switch (etape) {
      case 'deja_essaye':
        return reponses.deja_essaye.length > 0;
      default:
        return reponses[etape] !== null;
    }
  })();

  const suivant = () => {
    if (!valide) return;

    // Les deux filtres sortent du parcours immédiatement : personne ne devrait
    // répondre à sept questions de plus pour apprendre que la journée n'est pas
    // pour elle. Le webhook part quand même — les ex-clientes sont une liste de
    // réactivation, et les trois motifs reçoivent un message différent.
    if (etape === 'deja_client' && reponses.deja_client !== 'non') {
      terminer(reponses);
      return;
    }
    if (etape === 'deja_porte_ouverte' && reponses.deja_porte_ouverte === 'oui') {
      terminer(reponses);
      return;
    }

    if (index < ETAPES.length - 1) {
      setIndex((i) => i + 1);
      return;
    }

    terminer(reponses);
  };

  const question = () => {
    switch (etape) {
      case 'deja_client':
        return (
          <ChoiceScreen
            question={Q_DEJA_CLIENT.question}
            options={Q_DEJA_CLIENT.options}
            valeurs={reponses.deja_client ? [reponses.deja_client] : []}
            onSelection={(v) => repondre({ deja_client: v })}
          />
        );
      case 'deja_porte_ouverte':
        return (
          <ChoiceScreen
            question={Q_DEJA_PORTE_OUVERTE.question}
            options={Q_DEJA_PORTE_OUVERTE.options}
            valeurs={reponses.deja_porte_ouverte ? [reponses.deja_porte_ouverte] : []}
            onSelection={(v) => repondre({ deja_porte_ouverte: v })}
          />
        );
      case 'objectif':
        return (
          <ChoiceScreen
            question={Q_OBJECTIF.question}
            aide={Q_OBJECTIF.aide}
            options={Q_OBJECTIF.options}
            valeurs={reponses.objectif ? [reponses.objectif] : []}
            onSelection={(v) => repondre({ objectif: v })}
          />
        );
      case 'lbs_cible':
        return (
          <ChoiceScreen
            question={Q_LBS_CIBLE.question}
            options={Q_LBS_CIBLE.options}
            valeurs={reponses.lbs_cible ? [reponses.lbs_cible] : []}
            onSelection={(v) => repondre({ lbs_cible: v })}
          />
        );
      case 'anciennete':
        return (
          <ChoiceScreen
            question={Q_ANCIENNETE.question}
            options={Q_ANCIENNETE.options}
            valeurs={reponses.anciennete ? [reponses.anciennete] : []}
            onSelection={(v) => repondre({ anciennete: v })}
          />
        );
      case 'deja_essaye':
        return (
          <ChoiceScreen
            question={Q_DEJA_ESSAYE.question}
            aide={Q_DEJA_ESSAYE.aide}
            options={Q_DEJA_ESSAYE.options}
            valeurs={reponses.deja_essaye}
            onSelection={basculerDejaEssaye}
            multiple
          />
        );
      case 'priorite':
        return (
          <ChoiceScreen
            question={Q_PRIORITE.question}
            options={Q_PRIORITE.options}
            valeurs={reponses.priorite ? [reponses.priorite] : []}
            onSelection={(v) => repondre({ priorite: v })}
          />
        );
      case 'budget':
        return (
          <ChoiceScreen
            question={Q_BUDGET.question}
            options={Q_BUDGET.options}
            valeurs={reponses.budget ? [reponses.budget] : []}
            onSelection={(v) => repondre({ budget: v })}
          />
        );
      case 'modalite':
        return (
          <ChoiceScreen
            question={Q_MODALITE.question}
            options={Q_MODALITE.options}
            valeurs={reponses.modalite ? [reponses.modalite] : []}
            onSelection={(v) => repondre({ modalite: v })}
          />
        );
    }
  };

  const questionnaire = (
    <div>
      <div className="flex items-center gap-4 mb-10">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          aria-label="Question précédente"
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-neo hover:text-neo disabled:opacity-0 disabled:pointer-events-none"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1">
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-neo transition-all duration-500 ease-out"
              style={{ width: `${((index + 1) / ETAPES.length) * 100}%` }}
            />
          </div>
        </div>

        <span className="shrink-0 text-sm font-semibold text-gray-400 tabular-nums">
          {index + 1} / {ETAPES.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={etape}
          initial={reduitLeMouvement ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={reduitLeMouvement ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={reduitLeMouvement ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {question()}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10">
        <Button onClick={suivant} disabled={!valide} fullWidth>
          {index === ETAPES.length - 1 ? 'Réserver ma place' : 'Suivant'}
        </Button>
      </div>
    </div>
  );

  const contenu = () => {
    switch (phase) {
      case 'capture':
        return (
          <div>
            <CaptureScreen
              valeur={coordonnees}
              onChange={setCoordonnees}
              erreurs={erreursContact}
            />
            <div className="mt-7">
              <Button
                onClick={commencerQuestions}
                disabled={Object.keys(erreursContact).length > 0}
                fullWidth
              >
                Voir si je suis admissible
              </Button>
              <p className="mt-3.5 text-center text-[13px] leading-normal text-gray-500">
                Réservé aux personnes qui ne sont pas déjà clientes de NEO Performance.
              </p>
            </div>

            {/* Le dépôt est annoncé ici, pas découvert à l'écran de paiement :
                une demande d'argent surprise sur une page qui dit « gratuit »
                fait abandonner. */}
            <div className="mt-6 flex items-start gap-3 border-t border-gray-100 pt-5">
              <span className="inline-flex h-[26px] w-11 shrink-0 items-center justify-center rounded-full bg-neo-50 text-xs font-extrabold text-neo-900">
                20 $
              </span>
              <p className="text-[13px] leading-relaxed text-gray-500">
                Un dépôt de 20 $ confirme ta place le 11 septembre. Il t’est remis en argent le
                jour même, à ton arrivée. C’est ce qui fait que les 40 places vont à des personnes
                qui se présentent.
              </p>
            </div>
          </div>
        );
      case 'questions':
        return questionnaire;
      case 'verification':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 size={32} className="animate-spin text-neo" />
            <p className="mt-5 text-base text-gray-600">
              On regarde les places qu’il reste le 11 septembre…
            </p>
          </div>
        );
      case 'booking':
        return (
          <BookingScreen
            coordonnees={coordonnees}
            modalitePreferee={reponses.modalite ?? 'clinique'}
            disponibilites={disponibilites}
          />
        );
      case 'attente':
        return <WaitlistScreen raison={raisonAttente} />;
      case 'dq':
        return <DisqualifiedScreen motif={dqMotif} />;
    }
  };

  return (
    <>
      <Hero compact={phase !== 'capture'} />

      <div className={`bg-gray-50 ${phase === 'capture' ? 'pb-16 md:pb-26' : 'pb-20'}`}>
        {/* La carte chevauche la bande foncée : c'est ce décalage qui donne du
            relief. `relative z-10` obligatoire, sinon le hero, qui est
            positionné, se peint par-dessus et lui mange le haut. */}
        <div
          className={`relative z-10 mx-auto px-4 ${phase === 'booking' ? 'max-w-3xl' : 'max-w-2xl'}`}
        >
          {/* L'ancre sert au bouton du rappel final, qui ramène ici. */}
          <div
            id="po-formulaire"
            className="-mt-16 scroll-mt-24 rounded-3xl bg-white p-6 shadow-2xl shadow-gray-900/10 md:-mt-20 md:p-10"
          >
            {contenu()}
          </div>
        </div>
      </div>

      {/* Les blocs de vente n'existent qu'au premier écran : passé le premier
          clic, ils ne convainquent plus personne et allongent la page. */}
      {phase === 'capture' && <SalesSections />}
    </>
  );
}
