'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import Calendrier from './Calendrier';
import { trackCustom } from './MetaPixel';

/**
 * Carte du hero, version B : 4 questions, un engagement de présence, puis le
 * calendrier. Les réponses partent dans l'URL de l'iframe (objectif, depuis,
 * essaye, pret, engagement=oui) : ce sont les clés de requête des champs
 * personnalisés du formulaire GHL. On ne bloque personne.
 */

type Question = {
  cle: 'objectif' | 'depuis' | 'essaye' | 'pret';
  texte: string;
  choix: string[];
  multiple?: boolean;
  /** Note rassurante affichée sous un choix précis (index du choix). */
  notes?: Record<number, string>;
};

const QUESTIONS: Question[] = [
  {
    cle: 'objectif',
    texte: 'Quel est ton objectif principal?',
    choix: ['Perdre moins de 15 lb', 'Perdre de 15 à 30 lb', 'Perdre plus de 30 lb', 'Surtout retrouver mon énergie et me sentir bien'],
  },
  {
    cle: 'depuis',
    texte: "Depuis combien de temps tu essaies d'atteindre cet objectif?",
    choix: ['Moins de 6 mois', '6 mois à 2 ans', 'Plus de 2 ans', "C'est la première fois que je m'y mets"],
  },
  {
    cle: 'essaye',
    texte: "Qu'as-tu déjà essayé? (choisis tout ce qui s'applique)",
    choix: [
      'Couper les calories ou un régime',
      "M'entraîner plus fort",
      'Un coach ou un programme en ligne',
      "Je n'ai encore rien essayé de sérieux",
    ],
    multiple: true,
  },
  {
    cle: 'pret',
    texte:
      "Si on voit ensemble que notre accompagnement est fait pour toi, est-ce le bon moment pour toi d'investir dans ce changement?",
    choix: [
      "Oui, si c'est le bon fit pour moi",
      "J'aimerais d'abord connaître les options et le prix",
      "Je m'informe seulement pour l'instant",
    ],
    notes: { 2: "Aucun problème. La rencontre va t'aider à y voir clair, même si tu commences plus tard." },
  },
];

const ETAPES = QUESTIONS.length + 1; // + l'engagement de présence

type Reponses = Partial<Record<Question['cle'], number[]>>;

const valeur = (q: Question, r: Reponses) => (r[q.cle] ?? []).map((j) => q.choix[j]).join(' | ');

export default function CarteQuestionnaireB({ onFini }: { onFini: () => void }) {
  const [etape, setEtape] = useState(0);
  const [reponses, setReponses] = useState<Reponses>({});
  const [engage, setEngage] = useState(false);
  const [extras, setExtras] = useState<Record<string, string> | null>(null);
  const titreRef = useRef<HTMLHeadingElement>(null);
  const premierRendu = useRef(true);
  const minuterie = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Au changement d'étape, le focus va sur la nouvelle question (clavier, lecteur d'écran).
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    titreRef.current?.focus({ preventScroll: true });
    // La carte change de hauteur : si son haut est sorti de l'écran, on le ramène.
    const carte = document.getElementById('rdv');
    if (carte && carte.getBoundingClientRect().top < 0) {
      const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: carte.getBoundingClientRect().top + window.scrollY - 16,
        behavior: reduit ? 'auto' : 'smooth',
      });
    }
  }, [etape, extras]);

  useEffect(() => () => clearTimeout(minuterie.current), []);

  const q = QUESTIONS[etape];
  const choisis = q ? (reponses[q.cle] ?? []) : [];
  const peutContinuer = q ? choisis.length > 0 : engage;

  function choisir(j: number) {
    if (q.multiple) {
      const suivants = choisis.includes(j) ? choisis.filter((x) => x !== j) : [...choisis, j];
      setReponses({ ...reponses, [q.cle]: suivants });
      return;
    }
    setReponses({ ...reponses, [q.cle]: [j] });
    // Un seul choix : on passe tout seul à la suite, sauf si une note doit être lue.
    clearTimeout(minuterie.current);
    if (!q.notes?.[j]) minuterie.current = setTimeout(() => setEtape((e) => e + 1), 220);
  }

  function continuer() {
    if (!peutContinuer) return;
    clearTimeout(minuterie.current);
    if (etape < QUESTIONS.length) {
      setEtape(etape + 1);
      return;
    }
    const params: Record<string, string> = {};
    QUESTIONS.forEach((question) => (params[question.cle] = valeur(question, reponses)));
    params.engagement = 'oui';
    setExtras(params);
    trackCustom('qualif_complete', { pret: params.pret });
    onFini();
  }

  if (extras) {
    return (
      <>
        <h2
          ref={titreRef}
          tabIndex={-1}
          className="mb-2 flex items-center gap-2.5 rounded-xl bg-neo-50 px-3.5 py-2.5 text-sm font-bold text-neo-800 outline-none"
        >
          <Check size={18} strokeWidth={3} className="shrink-0 text-neo-600" aria-hidden="true" />
          Merci! Choisis maintenant ta plage.
        </h2>
        <Calendrier version="B" extras={extras} />
        <Confidentialite />
      </>
    );
  }

  const note = q?.notes?.[choisis[0]];

  return (
    <>
      <div className="text-xs font-bold uppercase tracking-[.08em] text-gray-600" aria-live="polite">
        {q ? `Question ${etape + 1} sur ${QUESTIONS.length}` : 'Dernière étape'}
      </div>
      <div
        className="mt-1 mb-[18px] h-1.5 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-label="Progression du questionnaire"
        aria-valuemin={0}
        aria-valuemax={ETAPES}
        aria-valuenow={etape + 1}
      >
        <div
          className="h-full rounded-full bg-neo transition-[width] duration-300"
          style={{ width: `${((etape + 1) / ETAPES) * 100}%` }}
        />
      </div>

      {q ? (
        <>
          <h2
            ref={titreRef}
            tabIndex={-1}
            className="mb-4 text-[21px] leading-[1.2] font-bold tracking-[-.02em] text-gray-900 outline-none"
          >
            {q.texte}
          </h2>
          <div className="grid gap-2.5" role="group" aria-label={q.texte}>
            {q.choix.map((c, j) => {
              const actif = choisis.includes(j);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => choisir(j)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-[14px] border-2 px-4 py-[15px] text-left text-base leading-[1.3] font-semibold text-gray-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neo ${
                    actif ? 'border-neo bg-neo-50' : 'border-gray-200 bg-white hover:border-neo-200'
                  }`}
                >
                  {q.multiple && (
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                        actif ? 'border-neo bg-neo text-white' : 'border-gray-300'
                      }`}
                      aria-hidden="true"
                    >
                      {actif && <Check size={13} strokeWidth={3.5} />}
                    </span>
                  )}
                  {c}
                </button>
              );
            })}
          </div>
          {note && <p className="mt-3.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-700">{note}</p>}
        </>
      ) : (
        <>
          <h2
            ref={titreRef}
            tabIndex={-1}
            className="mb-4 text-[21px] leading-[1.2] font-bold tracking-[-.02em] text-gray-900 outline-none"
          >
            Un dernier engagement, pour toi et pour l&apos;équipe
          </h2>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-[14px] border-2 p-4 text-[15px] font-semibold text-gray-800 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-neo ${
              engage ? 'border-neo bg-neo-50' : 'border-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={engage}
              onChange={(e) => setEngage(e.target.checked)}
              className="m-0 h-[22px] w-[22px] shrink-0 accent-neo"
            />
            <span>
              Je serai là à l&apos;heure, caméra ouverte, dans un endroit calme. Si je ne peux plus, j&apos;annule
              d&apos;avance pour libérer la place.
            </span>
          </label>
        </>
      )}

      <div className="mt-[18px] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            clearTimeout(minuterie.current);
            setEtape(etape - 1);
          }}
          className={`inline-flex cursor-pointer items-center gap-1.5 py-2 text-[15px] font-semibold text-gray-600 hover:text-gray-900 ${
            etape === 0 ? 'invisible' : ''
          }`}
          aria-hidden={etape === 0}
          tabIndex={etape === 0 ? -1 : 0}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Retour
        </button>
        <button
          type="button"
          onClick={continuer}
          disabled={!peutContinuer}
          className="inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-full bg-neo px-[26px] text-base font-bold text-white shadow-lg shadow-neo/30 transition hover:bg-neo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neo disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {q ? 'Continuer' : 'Voir les plages'}
        </button>
      </div>
      <Confidentialite />
    </>
  );
}

function Confidentialite() {
  return (
    <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gray-600">
      <Lock size={13} className="shrink-0 text-neo" aria-hidden="true" />
      Tes réponses restent confidentielles et servent seulement à préparer ta rencontre.
    </p>
  );
}
