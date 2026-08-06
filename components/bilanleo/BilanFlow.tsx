'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Hourglass } from 'lucide-react';
import type { Disponibilites } from '@/lib/bilanleo';
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
import ExitScreen from './ExitScreen';
import Hero from './Hero';
import Faq from './Faq';
import {
  AUCUN_AUTRE,
  BLOCS_CONDITIONNELS,
  FILTRE_1,
  FILTRE_2,
  LISTE_ATTENTE,
  OBJECTIFS,
  SORTIE_CLIENTE,
  SORTIE_EX_CLIENTE,
  Q1_TITRE,
  Q2_TITRE,
  Q5,
  Q6,
  Q7,
  Q8,
  labelObjectif,
  type ObjectifId,
} from './questions';

type EtapeId =
  | 'filtre1'
  | 'filtre2'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'q7'
  | 'q8'
  | 'contact';
type Phase =
  | 'quiz'
  | 'analyse'
  | 'resultat'
  | 'liste_attente'
  | 'sortie_cliente'
  | 'sortie_ex_cliente';

/**
 * Repli quand GHL n'a pas répondu à temps ou a échoué : on ouvre les deux
 * calendriers. Envoyer quelqu'un sur la liste d'attente à cause d'une panne
 * serait pire que de lui montrer un calendrier peut-être complet.
 */
const DISPONIBILITES_PAR_DEFAUT: Disponibilites = {
  clinique: true,
  visio: true,
  verifie: false,
};

/** Au-delà, on cesse d'attendre GHL et on applique le repli. */
const ATTENTE_MAX_MS = 2200;

interface Reponses {
  /** Filtrage : réponses aux deux questions posées avant le questionnaire. */
  clienteActuelle: string | null;
  exCliente: string | null;
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
  clienteActuelle: null,
  exCliente: null,
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
  const [disponibilites, setDisponibilites] = useState<Disponibilites | null>(null);
  const reduitLeMouvement = useReducedMotion();

  // La vérification des places part dès que le questionnaire commence, pas à la
  // fin : elle a ainsi deux ou trois minutes pour répondre pendant que la
  // personne répond aux questions, et l'attente devient invisible.
  const verification = useRef<Promise<Disponibilites> | null>(null);
  const dernieresDisponibilites = useRef<Disponibilites | null>(null);

  // Le filtrage ouvre le parcours ; la deuxième question n'apparaît que si la
  // personne n'est pas cliente en ce moment. Q4 n'existe que si un objectif
  // secondaire réel a été choisi.
  const etapes = useMemo<EtapeId[]>(() => {
    const suite: EtapeId[] = ['filtre1'];
    if (reponses.clienteActuelle === FILTRE_1.options[1]) suite.push('filtre2');
    suite.push('q1', 'q2', 'q3');
    if (reponses.objectifSecondaire && reponses.objectifSecondaire !== 'aucun') {
      suite.push('q4');
    }
    suite.push('q5', 'q6', 'q7', 'q8', 'contact');
    return suite;
  }, [reponses.clienteActuelle, reponses.objectifSecondaire]);

  // On suppose Q4 présente tant que Q2 n'a pas répondu : la barre peut ainsi
  // bondir en avant quand Q4 disparaît, mais ne recule jamais.
  const total = reponses.objectifSecondaire === 'aucun' ? 9 : 10;
  const etape = etapes[index];
  const estFiltre = etape === 'filtre1' || etape === 'filtre2';
  // Le filtrage ne compte pas dans la progression : la barre doit refléter le
  // questionnaire seul, sinon il a l'air plus long qu'il ne l'est.
  const numero = index - etapes.filter((e) => e.startsWith('filtre')).length + 1;
  const erreursCoordonnees = erreursContact(contact);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, phase]);

  useEffect(() => {
    if (etape !== 'q1' || verification.current) return;
    verification.current = fetch('/api/bilanleo/disponibilites')
      .then((r) => (r.ok ? (r.json() as Promise<Disponibilites>) : DISPONIBILITES_PAR_DEFAUT))
      .catch((erreur) => {
        console.error('[bilanleo] disponibilités injoignables', erreur);
        return DISPONIBILITES_PAR_DEFAUT;
      })
      .then((d) => {
        dernieresDisponibilites.current = d;
        return d;
      });
  }, [etape]);

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
      case 'filtre1':
        return reponses.clienteActuelle !== null;
      case 'filtre2':
        return reponses.exCliente !== null;
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
        return reponses.dejaEssaye.trim().length > 0;
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

    // Les deux sorties du filtrage court-circuitent le questionnaire : aucune
    // donnée n'est collectée, donc rien ne part vers Make.
    if (etape === 'filtre1' && reponses.clienteActuelle === FILTRE_1.options[0]) {
      setPhase('sortie_cliente');
      return;
    }
    if (etape === 'filtre2' && reponses.exCliente === FILTRE_2.options[0]) {
      setPhase('sortie_ex_cliente');
      return;
    }

    if (etape !== 'contact') {
      setIndex((i) => i + 1);
      return;
    }

    setPhase('analyse');

    // L'animation dure trois secondes : elle couvre l'attente du verdict de GHL,
    // qui a de toute façon commencé plusieurs minutes plus tôt. On envoie ensuite
    // un seul webhook, déjà porteur du bon statut.
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
      envoyerWebhook(chargeUtile(dispo));
    })();
  };

  /** Construit la charge envoyée à Make, statut inclus. */
  const chargeUtile = (dispo: Disponibilites) => {
    const resteDesPlaces = dispo.clinique || dispo.visio;
    return {
      firstName: contact.firstName.trim(),
      lastName: contact.lastName.trim(),
      email: contact.email.trim(),
      phone: normaliserTelephone(contact.phone),
      statut: resteDesPlaces ? 'qualifie' : 'liste_attente',
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
    };
  };

  const terminerAnalyse = useCallback(() => {
    const dispo = dernieresDisponibilites.current ?? DISPONIBILITES_PAR_DEFAUT;
    setPhase(dispo.clinique || dispo.visio ? 'resultat' : 'liste_attente');
  }, []);

  /** Les écrans qui remplacent le questionnaire : analyse, résultat, sorties. */
  const horsQuiz = () => {
    switch (phase) {
      case 'analyse':
        return <AnalysisScreen onTermine={terminerAnalyse} />;
      case 'resultat':
        return (
          <ResultScreen
            contact={contact}
            disponibilites={disponibilites ?? DISPONIBILITES_PAR_DEFAUT}
          />
        );
      case 'liste_attente':
        return (
          <ExitScreen
            titre={LISTE_ATTENTE.titre}
            corps={LISTE_ATTENTE.corps}
            icone={Hourglass}
            secondaire={{
              titre: LISTE_ATTENTE.secondaire.titre,
              corps: LISTE_ATTENTE.secondaire.corps,
              action: {
                libelle: LISTE_ATTENTE.secondaire.bouton,
                href: LISTE_ATTENTE.secondaire.lien,
              },
            }}
          />
        );
      case 'sortie_cliente':
        return <ExitScreen titre={SORTIE_CLIENTE.titre} corps={SORTIE_CLIENTE.corps} />;
      case 'sortie_ex_cliente':
        return (
          <ExitScreen
            titre={SORTIE_EX_CLIENTE.titre}
            corps={SORTIE_EX_CLIENTE.corps}
            action={{
              libelle: SORTIE_EX_CLIENTE.bouton,
              href: `mailto:${SORTIE_EX_CLIENTE.courriel}?subject=${encodeURIComponent(
                SORTIE_EX_CLIENTE.sujet,
              )}`,
            }}
          />
        );
      default:
        return null;
    }
  };

  const contenu = () => {
    switch (etape) {
      case 'filtre1':
        return (
          <QuestionScreen
            question={FILTRE_1.question}
            options={FILTRE_1.options}
            valeur={reponses.clienteActuelle}
            onChange={(v) =>
              setReponses((r) =>
                r.clienteActuelle === v
                  ? r
                  : // Changer d'avis ici rend la deuxième question caduque.
                    { ...r, clienteActuelle: v, exCliente: null },
              )
            }
          />
        );

      case 'filtre2':
        return (
          <QuestionScreen
            question={FILTRE_2.question}
            options={FILTRE_2.options}
            valeur={reponses.exCliente}
            onChange={(v) => setReponses((r) => ({ ...r, exCliente: v }))}
          />
        );

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

  const ecranHorsQuiz = horsQuiz();
  // Le hero complet n'a sa place qu'au tout premier écran : ailleurs, il
  // repousserait la question sous la ligne de flottaison sur mobile.
  const premierEcran = phase === 'quiz' && index === 0;
  // La FAQ traite les objections aux deux moments où elles bloquent : avant de
  // commencer, et devant le calendrier. Entre les deux, elle distrait.
  const afficherFaq = premierEcran || phase !== 'quiz';

  const questionnaire = (
    <div>
      {/* Barre de progression — masquée au tout premier écran, où elle n'aurait
          ni retour ni progression à montrer et ne laisserait qu'un blanc. */}
      <div className={`flex items-center gap-4 mb-10 ${index === 0 && estFiltre ? 'hidden' : ''}`}>
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
          {!estFiltre && (
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-neo transition-all duration-500 ease-out"
                style={{ width: `${(numero / total) * 100}%` }}
              />
            </div>
          )}
        </div>

        {!estFiltre && (
          <span className="shrink-0 text-sm font-semibold text-gray-400 tabular-nums">
            {numero} / {total}
          </span>
        )}
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

  return (
    <>
      <Hero compact={!premierEcran} />

      <div className="bg-gray-50 pb-20">
        {/* La carte chevauche la bande foncée : c'est ce décalage qui donne du relief. */}
        {/* `relative z-10` obligatoire : le hero est positionné, donc sans ça il
            se peint par-dessus la carte et lui mange le haut. */}
        <div
          className={`relative z-10 mx-auto px-4 ${phase === 'resultat' ? 'max-w-3xl' : 'max-w-2xl'}`}
        >
          <div className="-mt-16 md:-mt-20 rounded-3xl bg-white p-6 md:p-10 shadow-2xl shadow-gray-900/10">
            {ecranHorsQuiz ?? questionnaire}
          </div>
        </div>

        {afficherFaq && <Faq />}
      </div>
    </>
  );
}
