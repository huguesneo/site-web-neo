'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import {
  CONSENTEMENT_VERSION,
  DISPONIBILITES_PAR_DEFAUT,
  Q_CLIENTE,
  Q_DIFFICULTE,
  Q_MODALITE,
  Q_OBJECTIF,
  Q_PRET,
  REPONSES_VIDES,
  calculerSortie,
  type Disponibilites,
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
import ClienteActiveScreen from './ClienteActiveScreen';
import InformationScreen from './InformationScreen';
import CompletScreen from './CompletScreen';
import Hero from './Hero';
import SalesSections from './SalesSections';

type Phase = 'capture' | 'questions' | 'verification' | 'booking' | 'complet' | 'cliente' | 'information';

/** Les cinq questions, dans l'ordre. */
const ETAPES = ['cliente', 'objectif', 'difficulte', 'pret', 'modalite'] as const;

type EtapeId = (typeof ETAPES)[number];

/** Au-delà, on arrête d'attendre GHL et on ouvre les deux calendriers. */
const ATTENTE_MAX_MS = 4000;

/**
 * Envoie une action à /api/porte-ouverte, qui écrit dans GHL.
 *
 * Volontairement tolérant : un seul réessai après 3 secondes, puis on
 * journalise et on laisse tomber. Une panne GHL ne doit jamais empêcher
 * quelqu'un de réserver sa place.
 */
function envoyer(charge: Record<string, unknown>): Promise<{ contact_id?: string } | null> {
  const appel = () =>
    fetch('/api/porte-ouverte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(charge),
      keepalive: true,
    }).then(async (r) => {
      if (!r.ok) throw new Error(`statut ${r.status}`);
      return (await r.json()) as { contact_id?: string };
    });

  return appel().catch((erreur) => {
    console.error(`[porte-ouverte] ${String(charge.action)} échoué, réessai dans 3 s`, erreur);
    return new Promise((resoudre) => {
      window.setTimeout(() => {
        appel()
          .then(resoudre)
          .catch((e) => {
            console.error(`[porte-ouverte] réessai ${String(charge.action)} échoué`, e);
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
  const reduitLeMouvement = useReducedMotion();

  /** Id du contact GHL renvoyé à la capture, réutilisé aux étapes suivantes. */
  const contactId = useRef<Promise<string | undefined>>(Promise.resolve(undefined));

  // La vérification des places part dès que le questionnaire commence, pas à la
  // fin : elle a ainsi le temps des questions pour répondre, et l'attente
  // devient invisible.
  const verification = useRef<Promise<Disponibilites> | null>(null);

  const etape: EtapeId = ETAPES[index];
  const erreursContact = erreursCoordonnees(coordonnees);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, phase]);

  /** Coordonnées telles qu'envoyées à GHL — normalisées une seule fois, ici. */
  const contact = () => ({
    prenom: coordonnees.prenom.trim(),
    nom: coordonnees.nom.trim(),
    courriel: coordonnees.courriel.trim(),
    cellulaire: normaliserTelephone(coordonnees.telephone),
  });

  const commencerQuestions = () => {
    if (Object.keys(erreursContact).length > 0) return;

    // On n'attend pas GHL : le contact part, la personne continue.
    contactId.current = envoyer({
      action: 'capture',
      ...contact(),
      consentement: { accepte: coordonnees.consentement, texte_version: CONSENTEMENT_VERSION },
    }).then((r) => r?.contact_id);

    verification.current = fetch('/api/porte-ouverte/disponibilites')
      .then((r) => (r.ok ? (r.json() as Promise<Disponibilites>) : DISPONIBILITES_PAR_DEFAUT))
      .catch((erreur) => {
        console.error('[porte-ouverte] places injoignables', erreur);
        return DISPONIBILITES_PAR_DEFAUT;
      });

    setPhase('questions');
  };

  /** Action qui a besoin du contact : attend l'id de la capture, sans bloquer. */
  const envoyerAvecContact = async (charge: Record<string, unknown>) =>
    envoyer({ ...charge, ...contact(), contact_id: await contactId.current });

  /** Fin du parcours : on écrit les réponses dans GHL, puis on route. */
  const terminer = (reponsesFinales: Reponses) => {
    const sortie = calculerSortie(reponsesFinales);
    if (!sortie) return;

    void envoyerAvecContact({ action: 'questionnaire', reponses: reponsesFinales });

    if (sortie === 'cliente-active') {
      setPhase('cliente');
      return;
    }
    if (sortie === 'information') {
      setPhase('information');
      return;
    }

    setPhase('verification');
    void (async () => {
      const dispo = await Promise.race([
        verification.current ?? Promise.resolve(DISPONIBILITES_PAR_DEFAUT),
        new Promise<Disponibilites>((resoudre) =>
          setTimeout(() => resoudre(DISPONIBILITES_PAR_DEFAUT), ATTENTE_MAX_MS),
        ),
      ]);
      setDisponibilites(dispo);
      setPhase(dispo.clinique || dispo.visio ? 'booking' : 'complet');
    })();
  };

  const avertirPlace = async () =>
    (await envoyerAvecContact({ action: 'avertir' })) !== null;

  /**
   * Retour depuis l'écran du calendrier vers la dernière question. Re-valider
   * réécrit les champs du même contact : rien n'est dupliqué dans GHL.
   */
  const retourAuQuestionnaire = () => {
    setIndex(ETAPES.length - 1);
    setPhase('questions');
  };

  const repondre = (patch: Partial<Reponses>) => {
    setReponses((r) => ({ ...r, ...patch }));
  };

  const valide = reponses[etape] !== null;

  const suivant = () => {
    if (!valide) return;

    // Les deux sorties sans calendrier sortent dès que la réponse décisive est
    // donnée : personne ne répond à une question de plus pour rien.
    const sortie = calculerSortie(reponses);
    if (sortie === 'cliente-active' || sortie === 'information' || index === ETAPES.length - 1) {
      terminer(reponses);
      return;
    }

    setIndex((i) => i + 1);
  };

  const question = () => {
    switch (etape) {
      case 'cliente':
        return (
          <ChoiceScreen
            question={Q_CLIENTE.question}
            options={Q_CLIENTE.options}
            valeurs={reponses.cliente ? [reponses.cliente] : []}
            onSelection={(v) => repondre({ cliente: v })}
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
      case 'difficulte':
        return (
          <ChoiceScreen
            question={Q_DIFFICULTE.question}
            options={Q_DIFFICULTE.options}
            valeurs={reponses.difficulte ? [reponses.difficulte] : []}
            onSelection={(v) => repondre({ difficulte: v })}
          />
        );
      case 'pret':
        return (
          <ChoiceScreen
            intro={Q_PRET.intro}
            question={Q_PRET.question}
            options={Q_PRET.options}
            valeurs={reponses.pret ? [reponses.pret] : []}
            onSelection={(v) => repondre({ pret: v })}
          />
        );
      case 'modalite':
        return (
          <ChoiceScreen
            question={Q_MODALITE.question}
            aide={Q_MODALITE.aide}
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
                Réservé aux personnes qui n’ont pas été clientes de NEO Performance dans la dernière année.
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
                Un dépôt de 20 $ confirme ta place le 23 octobre. Ton dépôt de 20 $ sera remboursé
                le jour même à ton arrivée. C’est ce qui fait que les 40 places vont à des
                personnes qui se présentent.
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
              On regarde les places qu’il reste le 23 octobre…
            </p>
          </div>
        );
      case 'booking':
        return (
          <BookingScreen
            coordonnees={coordonnees}
            modalitePreferee={reponses.modalite ?? 'clinique'}
            disponibilites={disponibilites}
            onRetour={retourAuQuestionnaire}
          />
        );
      case 'complet':
        return <CompletScreen onAvertir={avertirPlace} />;
      case 'cliente':
        return <ClienteActiveScreen />;
      case 'information':
        return <InformationScreen />;
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
          className={`relative z-10 mx-auto px-4 ${phase === 'booking' ? 'max-w-6xl' : 'max-w-2xl'}`}
        >
          {/* L'ancre sert au bouton du rappel final, qui ramène ici. */}
          <div
            id="po-formulaire"
            className={`-mt-16 scroll-mt-24 rounded-3xl bg-white p-6 shadow-2xl shadow-gray-900/10 md:-mt-20 ${
              phase === 'booking' ? 'md:p-8' : 'md:p-10'
            }`}
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
