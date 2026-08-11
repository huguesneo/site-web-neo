'use client';

import { ArrowRight, XCircle } from 'lucide-react';

/**
 * Les blocs de vente sous la carte d'inscription, d'après la maquette Claude
 * Design (« Porte Ouverte - Desktop 1440 » et « Mobile 390 »).
 *
 * Montés uniquement au premier écran : dès que la personne est dans le
 * questionnaire ou sur son écran de destination, ces blocs ne convainquent plus
 * personne, ils allongent la page.
 *
 * Deux blocs sont volontairement provisoires et se voient comme tels — les
 * fiches de preuve et la photo du sac-cadeau. Ils portent des marques
 * explicites (bordure pointillée, étiquette « à confirmer ») pour qu'on ne les
 * mette jamais en ligne par distraction.
 */

const ANCRE_FORMULAIRE = '#po-formulaire';

const ETAPES = [
  { numero: '01', minutage: '0-10 min', texte: 'On revoit tes objectifs et ton historique.' },
  {
    numero: '02',
    minutage: '10-20 min',
    texte: 'Ton analyse InBody. Masse grasse, masse maigre, répartition.',
  },
  {
    numero: '03',
    minutage: '20-45 min',
    texte: 'L’évaluation métabolique. Cortisol, digestion, hormones, sommeil.',
  },
  {
    numero: '04',
    minutage: '45-60 min',
    texte: 'Ton portrait métabolique. On le lit ensemble. Tu repars avec.',
  },
];

const FICHES_PREUVE = [
  { marqueur: 'Marqueur A', dossier: 'Dossier A · femme, 4X ans' },
  { marqueur: 'Marqueur B', dossier: 'Dossier B · femme, 4X ans' },
  { marqueur: 'Marqueur C', dossier: 'Dossier C · femme, 4X ans' },
];

const SAC_CADEAU = [
  'Ton portrait métabolique, imprimé et annoté',
  'Guide — Lire son analyse InBody',
  'Guide — Cortisol et stress chronique',
  'Guide — Digestion : les signes à ne pas banaliser',
  'Guide — Sommeil et récupération après 35 ans',
  'Guide — Ta routine de base, semaine par semaine',
];

const EXCLUSIONS = [
  'Si tu cherches une diète de 1 200 calories.',
  'Si tu veux perdre 20 lb en 3 semaines.',
  'Si tu es déjà cliente NEO.',
  'Si tu n’as pas 60 minutes à bloquer le 11 septembre.',
];

const FAQ = [
  {
    question: 'C’est vraiment gratuit ?',
    reponse:
      'Oui. L’évaluation de 60 minutes, l’InBody et le portrait métabolique ne te coûtent rien. Le seul montant qui bouge, c’est le dépôt de 20 $ qui confirme ta place — et il t’est remis en argent le jour même.',
  },
  {
    question: 'Pourquoi un dépôt de 20 $ si tout est gratuit ?',
    reponse:
      'Parce qu’il y a 48 places et une seule journée. Le dépôt fait la différence entre une place réservée et une place qui reste vide. Tu le récupères en argent à ton arrivée, sans rien avoir à demander.',
  },
  {
    question: 'Je prends de l’Ozempic. Est-ce que je peux venir ?',
    reponse:
      'Oui, et tu n’as rien à arrêter ni à changer avant de venir. On regarde ton métabolisme là où il est aujourd’hui. Rien de ce qu’on fait ne remplace le suivi de ton médecin.',
  },
  {
    question: 'Est-ce que je vais me faire vendre quelque chose ?',
    reponse:
      'On te dira ce qu’on voit dans tes chiffres, et ce qu’un accompagnement chez NEO impliquerait si tu veux aller plus loin. Tu repars avec ton portrait dans les mains dans tous les cas, que tu dises oui ou non.',
  },
  {
    question: 'Ça se passe où, et est-ce que la visio donne la même chose ?',
    reponse:
      'À la clinique, au 7005 boulevard Taschereau à Brossard, ou en visio. Une réserve honnête sur la visio : l’analyse InBody demande la machine, donc elle se fait sur place seulement. Le reste de l’évaluation est identique.',
  },
  {
    question: 'Je suis déjà cliente de NEO. Je peux réserver une place ?',
    reponse:
      'Non. La journée est réservée aux personnes qui n’ont jamais été accompagnées chez NEO. Si tu es cliente, tu as déjà ton portrait et ta naturopathe — écris-nous plutôt pour ton prochain suivi.',
  },
];

/** Surtitre turquoise en capitales, repris dans chaque section. */
function Surtitre({ children, clair = false }: { children: React.ReactNode; clair?: boolean }) {
  return (
    <span
      className={`mb-2.5 block text-[11px] font-bold uppercase tracking-[0.12em] md:mb-3.5 md:text-[13px] md:tracking-[0.14em] ${
        clair ? 'text-neo' : 'text-neo'
      }`}
    >
      {children}
    </span>
  );
}

export default function SalesSections() {
  return (
    <>
      {/* ───────────────────────── Le déroulé ───────────────────────── */}
      <section className="bg-gray-50 pb-16 md:pb-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-12">
          <Surtitre>Le déroulé</Surtitre>
          <h2 className="mb-2.5 max-w-[760px] text-[27px] font-extrabold leading-[1.15] tracking-tight text-gray-900 text-pretty md:mb-3.5 md:text-[44px] md:leading-[1.08]">
            Ce qui se passe pendant les 60 minutes
          </h2>
          <p className="mb-6 max-w-[620px] text-[15px] leading-relaxed text-gray-600 md:mb-12 md:text-[17px]">
            Une naturopathe, une salle, une heure. Voici l’heure par heure, sans surprise.
          </p>

          <div className="grid gap-3.5 md:grid-cols-4 md:gap-6">
            {ETAPES.map((etape, index) => {
              const derniere = index === ETAPES.length - 1;
              return (
                <div
                  key={etape.numero}
                  className={`rounded-3xl bg-white p-5 shadow-xl shadow-gray-900/[0.07] md:p-7 ${
                    // La dernière étape est celle qui vend : c'est le portrait
                    // métabolique en main. Elle est cerclée pour qu'on la voie.
                    derniere ? 'outline outline-2 -outline-offset-2 outline-neo/35' : ''
                  }`}
                >
                  <div className="mb-3.5 flex items-center gap-3.5 md:mb-6 md:justify-between md:gap-0">
                    <span className="text-[30px] font-extrabold leading-none tracking-tight text-neo md:text-[40px]">
                      {etape.numero}
                    </span>
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-2xl px-3 py-1.5 text-[11.5px] font-bold md:px-3.5 md:py-[7px] md:text-[12.5px] ${
                        derniere ? 'bg-neo text-white' : 'bg-neo-50 text-neo-900'
                      }`}
                    >
                      {etape.minutage}
                    </span>
                  </div>
                  <p className="text-base font-semibold leading-snug text-gray-900 text-pretty md:text-[17px]">
                    {etape.texte}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Ce qu'on mesure ───────────────────────── */}
      <section className="bg-white py-16 md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-12">
          <Surtitre>Ce qu’on mesure</Surtitre>
          <h2 className="mb-2.5 max-w-[820px] text-[27px] font-extrabold leading-[1.15] tracking-tight text-gray-900 text-pretty md:mb-3.5 md:text-[44px] md:leading-[1.08]">
            On ne te montre pas des photos. On te montre des chiffres.
          </h2>
          <p className="mb-6 max-w-[640px] text-[15px] leading-relaxed text-gray-600 md:mb-12 md:text-[17px]">
            Trois dossiers suivis sur 13 semaines. Même marqueur, deux mesures, la phrase de la
            personne.
          </p>

          <div className="grid gap-3.5 md:grid-cols-3 md:gap-6">
            {FICHES_PREUVE.map((fiche) => (
              <div
                key={fiche.marqueur}
                className="rounded-3xl border-[1.5px] border-dashed border-neo-200 bg-neo-50/25 p-5 md:p-8"
              >
                <div className="mb-4 flex items-center justify-between md:mb-6">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-neo-900 md:text-[13px]">
                    {fiche.marqueur}
                  </span>
                  <span className="rounded-full border border-neo-100 px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.06em] text-neo md:px-[9px] md:py-1 md:text-[10.5px]">
                    à confirmer
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3 md:mb-6 md:gap-3.5">
                  <div>
                    <div className="mb-[5px] font-mono text-[10.5px] text-gray-400 md:mb-1.5 md:text-[11px]">
                      SEMAINE 1
                    </div>
                    <div className="font-mono text-[30px] font-medium leading-none text-gray-400 md:text-[34px]">
                      00,0
                    </div>
                  </div>
                  <ArrowRight size={20} className="mb-[5px] text-neo md:mb-1.5 md:size-[22px]" />
                  <div>
                    <div className="mb-[5px] font-mono text-[10.5px] text-neo md:mb-1.5 md:text-[11px]">
                      SEMAINE 13
                    </div>
                    <div className="font-mono text-[30px] font-medium leading-none text-neo md:text-[34px]">
                      00,0
                    </div>
                  </div>
                </div>

                <p className="mb-3 text-sm italic leading-relaxed text-gray-700 text-pretty md:mb-4 md:text-[15px]">
                  « [Phrase de la personne — une ligne, dans ses mots, à valider avec elle avant
                  publication.] »
                </p>
                <div className="text-[12.5px] font-semibold text-gray-500 md:text-[13px]">
                  {fiche.dossier}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 font-mono text-[11px] leading-relaxed text-gray-400 md:mt-7 md:text-xs">
            Fiches provisoires. Marqueurs, valeurs et citations à remplacer par les dossiers réels
            avant mise en ligne.
          </p>
        </div>
      </section>

      {/* ───────────────────────── Le sac-cadeau ───────────────────────── */}
      <section className="bg-neo-50 py-16 md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-12">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
            <div>
              <Surtitre>Le sac-cadeau</Surtitre>
              <h2 className="mb-3 text-[27px] font-extrabold leading-[1.15] tracking-tight text-neo-900 md:mb-4.5 md:text-[44px] md:leading-[1.08]">
                Ce que tu repars avec
              </h2>
              <p className="mb-6 max-w-[460px] text-[15px] leading-relaxed text-neo-800 text-pretty md:mb-8 md:text-[17px]">
                Ton portrait métabolique imprimé, et un sac avec les cinq guides qu’on remet à nos
                clientes.
              </p>

              {/* Sur mobile la photo passe avant la liste : c'est elle qui donne
                  envie de lire ce qui suit. */}
              <div className="mb-5 flex h-[230px] flex-col items-center justify-center gap-2.5 rounded-3xl border border-neo/20 bg-[repeating-linear-gradient(135deg,#ffffff_0_12px,#F2FBFB_12px_24px)] shadow-2xl shadow-neo-900/25 md:hidden">
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-neo-800">
                  photo à fournir
                </span>
                <span className="max-w-[230px] text-center font-mono text-[11px] leading-relaxed text-neo-600">
                  le sac NEO ouvert, portrait métabolique et guides posés à plat
                </span>
              </div>

              <ul className="flex flex-col gap-2.5 md:gap-3">
                {SAC_CADEAU.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3.5 md:gap-4 md:px-5 md:py-4"
                  >
                    <span className="font-mono text-xs font-medium text-neo md:text-[13px]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold leading-snug text-gray-900 md:text-[15.5px]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 font-mono text-[11px] text-neo-800 md:mt-5.5 md:text-xs">
                Titres des guides à valider avec l’équipe clinique.
              </p>
            </div>

            <div className="hidden h-[520px] flex-col items-center justify-center gap-3.5 rounded-3xl border border-neo/20 bg-[repeating-linear-gradient(135deg,#ffffff_0_14px,#F2FBFB_14px_28px)] shadow-2xl shadow-neo-900/30 md:flex">
              <span className="font-mono text-[13px] uppercase tracking-[0.08em] text-neo-800">
                photo à fournir
              </span>
              <span className="max-w-[260px] text-center font-mono text-xs leading-relaxed text-neo-600">
                le sac NEO ouvert, portrait métabolique et guides posés à plat, lumière naturelle
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Pour qui ce n'est pas ───────────────────────── */}
      <section className="bg-gray-900 py-16 text-white md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-12">
          <div className="grid items-start gap-7 md:grid-cols-[420px_1fr] md:gap-20">
            <div>
              <Surtitre clair>Filtrage</Surtitre>
              <h2 className="mb-3 text-[27px] font-extrabold leading-[1.15] tracking-tight md:mb-4.5 md:text-[44px] md:leading-[1.08]">
                Pour qui ce n’est pas
              </h2>
              <p className="text-[15px] leading-relaxed text-gray-400 text-pretty md:text-[17px]">
                On préfère te le dire ici plutôt que le 11 septembre. Il y a 48 places, et elles ne
                sont pas pour tout le monde.
              </p>
            </div>

            <ul className="grid gap-3 md:grid-cols-2 md:gap-5">
              {EXCLUSIONS.map((exclusion) => (
                <li
                  key={exclusion}
                  className="flex items-start gap-3.5 rounded-3xl border border-white/10 bg-white/5 p-5 md:flex-col md:gap-0 md:p-7"
                >
                  <XCircle size={20} className="mt-0.5 shrink-0 text-neo md:mb-4.5 md:mt-0 md:size-[22px]" />
                  <p className="text-[15.5px] font-semibold leading-snug text-gray-50 text-pretty md:text-[17px]">
                    {exclusion}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section className="bg-white py-16 md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-12">
          <div className="grid items-start gap-7 md:grid-cols-[380px_1fr] md:gap-20">
            <div>
              <Surtitre>Questions</Surtitre>
              <h2 className="mb-3 text-[27px] font-extrabold leading-[1.15] tracking-tight text-gray-900 md:mb-4.5 md:text-[44px] md:leading-[1.08]">
                Ce qu’on nous demande
              </h2>
              <p className="text-[15px] leading-relaxed text-gray-600 md:text-[17px]">
                Une question qui n’est pas ici ?{' '}
                <a href="tel:+14504864006" className="text-neo hover:text-neo-600">
                  450 486-4006
                </a>
                , ou{' '}
                <a href="mailto:info@neoperformance.ca" className="text-neo hover:text-neo-600">
                  info@neoperformance.ca
                </a>
                .
              </p>
            </div>

            <div className="flex flex-col gap-3 md:gap-3.5">
              {FAQ.map((item) => (
                <div key={item.question} className="rounded-3xl bg-gray-50 p-5 md:px-8 md:py-7">
                  <h3 className="mb-2 text-base font-bold leading-snug text-gray-900 md:mb-2.5 md:text-lg">
                    {item.question}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 text-pretty md:text-[15.5px]">
                    {item.reponse}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Rappel final ───────────────────────── */}
      <section className="relative overflow-hidden bg-neo-50 py-16 md:py-26">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neo/25 blur-[90px] md:h-[420px] md:w-[900px] md:blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-[860px] px-5 text-center md:px-12">
          <span className="mb-3.5 block text-[11px] font-bold uppercase leading-relaxed tracking-[0.12em] text-neo md:mb-4.5 md:text-[13px] md:tracking-[0.14em]">
            Une seule journée
            <br className="md:hidden" />
            <span className="hidden md:inline"> · </span>
            11 septembre 2026
          </span>
          <h2 className="mb-3.5 text-[28px] font-extrabold leading-[1.15] tracking-tight text-neo-900 text-pretty md:mb-5 md:text-[46px] md:leading-[1.1]">
            48 places, 6 naturopathes, et une heure pour comprendre ce qui bloque
          </h2>
          <p className="mx-auto mb-6 max-w-[620px] text-[15.5px] leading-relaxed text-neo-800 text-pretty md:mb-8 md:text-lg">
            Si tu as déjà perdu du poids plusieurs fois et tout repris, c’est exactement pour toi
            qu’on ouvre la clinique cette journée-là.
          </p>

          <a
            href={ANCRE_FORMULAIRE}
            className="flex w-full items-center justify-center rounded-full bg-neo px-6 py-[18px] text-base font-bold text-white shadow-2xl shadow-neo-900/40 transition-colors hover:bg-neo-600 md:inline-flex md:w-auto md:px-12 md:py-5 md:text-lg"
          >
            Voir si je suis admissible
          </a>
          <p className="mx-auto mt-3.5 max-w-[460px] text-[12.5px] leading-relaxed text-neo-800 md:text-[13.5px]">
            Réservé aux personnes qui ne sont pas déjà clientes de NEO Performance. Dépôt de 20 $
            pour confirmer la place, remis en argent le jour même.
          </p>
        </div>
      </section>
    </>
  );
}
