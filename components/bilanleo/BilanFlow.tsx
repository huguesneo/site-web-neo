'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/Button';
import QuestionScreen from './QuestionScreen';
import TextScreen from './TextScreen';
import ContactScreen, {
  CONTACT_VIDE,
  erreursContact,
  normaliserTelephone,
  type Contact,
} from './ContactScreen';
import AnalysisScreen from './AnalysisScreen';
import ResultScreen from './ResultScreen';
import {
  AUCUN_AUTRE,
  BLOCS_CONDITIONNELS,
  OBJECTIFS,
  Q1_TITRE,
  Q2_TITRE,
  Q5,
  Q6,
  Q7,
  Q8,
  labelObjectif,
  type ObjectifId,
} from './questions';

type EtapeId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'contact';
type Phase = 'quiz' | 'analyse' | 'resultat';

interface Reponses {
  objectifPrincipal: ObjectifId | null;
  /** `'aucun'` correspond à l'option « Aucun autre » de Q2, qui saute Q4. */
  objectifSecondaire: ObjectifId | 'aucun' | null;
  detailPrincipal: string | null;
  detailSecondaire: string | null;
  duree: string | null;
  dejaEssaye: string;
  disponibilite: string | null;
  testsOk: string | null;
}

const REPONSES_VIDES: Reponses = {
  objectifPrincipal: null,
  objectifSecondaire: null,
  detailPrincipal: null,
  detailSecondaire: null,
  duree: null,
  dejaEssaye: '',
  disponibilite: null,
  testsOk: null,
};

/**
 * Envoie les réponses au relais serveur, qui les transmet à Make.
 *
 * Volontairement tolérant : un seul réessai après 2 secondes, puis on
 * journalise et on laisse tomber. Un webhook en panne ne doit jamais empêcher
 * quelqu'un de réserver.
 */
function envoyerWebhook(charge: unknown) {
  const appel = () =>
    fetch('/api/bilanleo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(charge),
      keepalive: true,
    }).then((r) => {
      if (!r.ok) throw new Error(`statut ${r.status}`);
    });

  appel().catch((erreur) => {
    console.error('[bilanleo] envoi du webhook échoué, réessai dans 2 s', erreur);
    window.setTimeout(() => {
      appel().catch((e) => console.error('[bilanleo] réessai du webhook échoué', e));
    }, 2000);
  });
}

export default function BilanFlow() {
  const [phase, setPhase] = useState<Phase>('quiz');
  const [reponses, setReponses] = useState<Reponses>(REPONSES_VIDES);
  const [contact, setContact] = useState<Contact>(CONTACT_VIDE);
  const [index, setIndex] = useState(0);
  const reduitLeMouvement = useReducedMotion();

  // Q4 n'existe que si un objectif secondaire réel a été choisi.
  const etapes = useMemo<EtapeId[]>(() => {
    const suite: EtapeId[] = ['q1', 'q2', 'q3'];
    if (reponses.objectifSecondaire && reponses.objectifSecondaire !== 'aucun') {
      suite.push('q4');
    }
    suite.push('q5', 'q6', 'q7', 'q8', 'contact');
    return suite;
  }, [reponses.objectifSecondaire]);

  // On suppose Q4 présente tant que Q2 n'a pas répondu : la barre peut ainsi
  // bondir en avant quand Q4 disparaît, mais ne recule jamais.
  const total = reponses.objectifSecondaire === 'aucun' ? 9 : 10;
  const etape = etapes[index];
  const erreursCoordonnees = erreursContact(contact);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, phase]);

  const choisirPrincipal = (label: string) => {
    const objectif = OBJECTIFS.find((o) => o.label === label);
    if (!objectif) return;
    setReponses((r) =>
      r.objectifPrincipal === objectif.id
        ? r
        : {
            ...r,
            objectifPrincipal: objectif.id,
            // Le détail de Q3 portait sur l'ancien objectif : il ne veut plus rien dire.
            detailPrincipal: null,
            // Le nouvel objectif principal ne peut pas rester l'objectif secondaire.
            ...(r.objectifSecondaire === objectif.id
              ? { objectifSecondaire: null, detailSecondaire: null }
              : {}),
          },
    );
  };

  const choisirSecondaire = (label: string) => {
    const valeur: ObjectifId | 'aucun' =
      label === AUCUN_AUTRE
        ? 'aucun'
        : (OBJECTIFS.find((o) => o.label === label)?.id ?? 'aucun');
    setReponses((r) =>
      r.objectifSecondaire === valeur
        ? r
        : { ...r, objectifSecondaire: valeur, detailSecondaire: null },
    );
  };

  const valide = (() => {
    switch (etape) {
      case 'q1':
        return reponses.objectifPrincipal !== null;
      case 'q2':
        return reponses.objectifSecondaire !== null;
      case 'q3':
        return reponses.detailPrincipal !== null;
      case 'q4':
        return reponses.detailSecondaire !== null;
      case 'q5':
        return reponses.duree !== null;
      case 'q6':
        return reponses.dejaEssaye.trim().length >= Q6.minimum;
      case 'q7':
        return reponses.disponibilite !== null;
      case 'q8':
        return reponses.testsOk !== null;
      case 'contact':
        return Object.keys(erreursCoordonnees).length === 0;
    }
  })();

  const suivant = () => {
    if (!valide) return;
    if (etape !== 'contact') {
      setIndex((i) => i + 1);
      return;
    }

    // Le webhook part avant l'animation et n'est jamais attendu.
    envoyerWebhook({
      firstName: contact.firstName.trim(),
      lastName: contact.lastName.trim(),
      email: contact.email.trim(),
      phone: normaliserTelephone(contact.phone),
      reponses: {
        objectif_principal: reponses.objectifPrincipal
          ? labelObjectif(reponses.objectifPrincipal)
          : '',
        objectif_principal_detail: reponses.detailPrincipal ?? '',
        objectif_secondaire:
          reponses.objectifSecondaire === 'aucun'
            ? AUCUN_AUTRE
            : reponses.objectifSecondaire
              ? labelObjectif(reponses.objectifSecondaire)
              : '',
        objectif_secondaire_detail: reponses.detailSecondaire ?? '',
        duree: reponses.duree ?? '',
        deja_essaye: reponses.dejaEssaye.trim(),
        disponibilite: reponses.disponibilite ?? '',
        tests_ok: reponses.testsOk ?? '',
      },
    });

    setPhase('analyse');
  };

  const terminerAnalyse = useCallback(() => setPhase('resultat'), []);

  if (phase === 'analyse') return <AnalysisScreen onTermine={terminerAnalyse} />;
  if (phase === 'resultat') return <ResultScreen contact={contact} />;

  const contenu = () => {
    switch (etape) {
      case 'q1':
        return (
          <QuestionScreen
            question={Q1_TITRE}
            options={OBJECTIFS.map((o) => o.label)}
            valeur={reponses.objectifPrincipal ? labelObjectif(reponses.objectifPrincipal) : null}
            onChange={choisirPrincipal}
          />
        );

      case 'q2':
        return (
          <QuestionScreen
            question={Q2_TITRE}
            options={[
              ...OBJECTIFS.filter((o) => o.id !== reponses.objectifPrincipal).map((o) => o.label),
              AUCUN_AUTRE,
            ]}
            valeur={
              reponses.objectifSecondaire === 'aucun'
                ? AUCUN_AUTRE
                : reponses.objectifSecondaire
                  ? labelObjectif(reponses.objectifSecondaire)
                  : null
            }
            onChange={choisirSecondaire}
          />
        );

      case 'q3': {
        if (!reponses.objectifPrincipal) return null;
        const bloc = BLOCS_CONDITIONNELS[reponses.objectifPrincipal];
        return (
          <QuestionScreen
            question={bloc.question}
            options={bloc.options}
            valeur={reponses.detailPrincipal}
            onChange={(v) => setReponses((r) => ({ ...r, detailPrincipal: v }))}
          />
        );
      }

      case 'q4': {
        if (!reponses.objectifSecondaire || reponses.objectifSecondaire === 'aucun') return null;
        const bloc = BLOCS_CONDITIONNELS[reponses.objectifSecondaire];
        return (
          <QuestionScreen
            question={bloc.question}
            options={bloc.options}
            valeur={reponses.detailSecondaire}
            onChange={(v) => setReponses((r) => ({ ...r, detailSecondaire: v }))}
          />
        );
      }

      case 'q5':
        return (
          <QuestionScreen
            question={Q5.question}
            options={Q5.options}
            valeur={reponses.duree}
            onChange={(v) => setReponses((r) => ({ ...r, duree: v }))}
          />
        );

      case 'q6':
        return (
          <TextScreen
            question={Q6.question}
            aide={Q6.aide}
            minimum={Q6.minimum}
            valeur={reponses.dejaEssaye}
            onChange={(v) => setReponses((r) => ({ ...r, dejaEssaye: v }))}
          />
        );

      case 'q7':
        return (
          <QuestionScreen
            question={Q7.question}
            options={Q7.options}
            valeur={reponses.disponibilite}
            onChange={(v) => setReponses((r) => ({ ...r, disponibilite: v }))}
          />
        );

      case 'q8':
        return (
          <QuestionScreen
            question={Q8.question}
            options={Q8.options}
            valeur={reponses.testsOk}
            onChange={(v) => setReponses((r) => ({ ...r, testsOk: v }))}
          />
        );

      case 'contact':
        return (
          <ContactScreen valeur={contact} onChange={setContact} erreurs={erreursCoordonnees} />
        );
    }
  };

  return (
    <div>
      {/* Barre de progression */}
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
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <span className="shrink-0 text-sm font-semibold text-gray-400 tabular-nums">
          {index + 1} / {total}
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
          {contenu()}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10">
        <Button onClick={suivant} disabled={!valide} fullWidth>
          {etape === 'contact' ? 'Voir mon résultat' : 'Suivant'}
        </Button>
      </div>
    </div>
  );
}
