/*
 * Tests du moteur de qualification de la porte ouverte (lib/porteOuverte.ts).
 * Lancer : npx tsx scripts/test-porte-ouverte-scoring.ts
 */
import {
  BAREME_VERSION,
  CONSENTEMENT_VERSION,
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
  Reponses,
  calculerScoreBonus,
  calculerStatut,
  texteConsentement,
} from '../lib/porteOuverte';

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

/** Réponses complètes et neutres, à surcharger cas par cas. */
function base(patch: Partial<Reponses> = {}): Reponses {
  return {
    ...REPONSES_VIDES,
    deja_client: 'non',
    deja_porte_ouverte: 'non',
    objectif: 'perte-gras',
    lbs_cible: 'moins-15',
    anciennete: 'moins-6mois',
    deja_essaye: [],
    priorite: 'informe',
    budget: 'rien',
    modalite: 'visio',
    ...patch,
  };
}

// ─────────────────────────── Routage par le budget ───────────────────────────
console.log('\nRoutage — budget');
{
  const attendu: [Reponses['budget'], string][] = [
    ['1500-plus', 'chaud'],
    ['500-1500', 'chaud'],
    ['moins-500', 'tiede'],
    ['rien', 'froid'],
  ];
  for (const [budget, statut] of attendu) {
    const r = calculerStatut(base({ budget }));
    check(`${budget} → ${statut}`, r.statut === statut && r.motif === null, r);
  }
}

// ──────────────────────── Les filtres l'emportent sur tout ───────────────────
console.log('\nRoutage — disqualification');
{
  const r = calculerStatut(base({ deja_client: 'cliente-actuelle', budget: '1500-plus' }));
  check('cliente actuelle bat le budget le plus élevé', r.statut === 'dq', r);
  check('motif = cliente_actuelle', r.motif === 'cliente-actuelle', r);
}
{
  const r = calculerStatut(base({ deja_client: 'ancienne-cliente', budget: '1500-plus' }));
  check('ancienne cliente → dq', r.statut === 'dq' && r.motif === 'ancienne-cliente', r);
}
{
  const r = calculerStatut(base({ deja_porte_ouverte: 'oui', budget: '1500-plus' }));
  check('déjà venue à une porte ouverte → dq', r.statut === 'dq' && r.motif === 'deja-porte-ouverte', r);
}
{
  // Les deux filtres cochés en même temps : le statut client prime, parce que
  // c'est lui qui détermine le message envoyé.
  const r = calculerStatut(base({ deja_client: 'cliente-actuelle', deja_porte_ouverte: 'oui' }));
  check('cliente actuelle prime sur déjà-PO', r.motif === 'cliente-actuelle', r);
}
{
  // Un questionnaire abandonné à Q1 ne doit pas produire un « froid » par défaut
  // avant d'avoir vu le budget — mais le court-circuit DQ, lui, doit fonctionner
  // dès la première réponse.
  const r = calculerStatut({ ...REPONSES_VIDES, deja_client: 'ancienne-cliente' });
  check('DQ calculable dès Q1, sans le reste', r.statut === 'dq', r);
}

// ───────────────────────────── Barème, ligne à ligne ─────────────────────────
console.log('\nBarème — chaque ligne isolée');
{
  const nul = base();
  check('plancher à 0', calculerScoreBonus(nul) === 0, calculerScoreBonus(nul));

  check('priorité numéro un = 25', calculerScoreBonus(base({ priorite: 'priorite-1' })) === 25);
  check(
    'priorité importante = 10',
    calculerScoreBonus(base({ priorite: 'important' })) === 10,
  );
  check('priorité informative = 0', calculerScoreBonus(base({ priorite: 'informe' })) === 0);

  check('ancienneté 2-5 ans = 15', calculerScoreBonus(base({ anciennete: '2-5ans' })) === 15);
  check('ancienneté 5 ans + = 15', calculerScoreBonus(base({ anciennete: 'plus-5ans' })) === 15);
  check(
    'ancienneté 6 mois-2 ans = 0',
    calculerScoreBonus(base({ anciennete: '6mois-2ans' })) === 0,
  );

  check('15-30 lb = 10', calculerScoreBonus(base({ lbs_cible: '15-30' })) === 10);
  check('30-50 lb = 10', calculerScoreBonus(base({ lbs_cible: '30-50' })) === 10);
  check('plus de 50 lb = 10', calculerScoreBonus(base({ lbs_cible: 'plus-50' })) === 10);
  check('moins de 15 lb = 0', calculerScoreBonus(base({ lbs_cible: 'moins-15' })) === 0);
  check('aucune perte visée = 0', calculerScoreBonus(base({ lbs_cible: 'aucun' })) === 0);

  check('une seule méthode = 0', calculerScoreBonus(base({ deja_essaye: ['keto'] })) === 0);
  check('deux méthodes = 10', calculerScoreBonus(base({ deja_essaye: ['keto', 'jeune'] })) === 10);
  check(
    '« rien de structuré » ne compte pas comme une méthode',
    calculerScoreBonus(base({ deja_essaye: ['rien', 'keto'] })) === 0,
    calculerScoreBonus(base({ deja_essaye: ['rien', 'keto'] })),
  );

  check('clinique = 5', calculerScoreBonus(base({ modalite: 'clinique' })) === 5);
  check('visio = 0', calculerScoreBonus(base({ modalite: 'visio' })) === 0);
}

// ────────────────────────────── Barème combiné ───────────────────────────────
console.log('\nBarème — combinaisons');
{
  const max = base({
    priorite: 'priorite-1',
    anciennete: 'plus-5ans',
    lbs_cible: 'plus-50',
    deja_essaye: ['weight-watchers', 'keto', 'jeune', 'nutritionniste'],
    modalite: 'clinique',
  });
  check('plafond à 65', calculerScoreBonus(max) === 65, calculerScoreBonus(max));

  const milieu = base({
    priorite: 'important',
    anciennete: '2-5ans',
    lbs_cible: '15-30',
    deja_essaye: ['keto'],
    modalite: 'visio',
  });
  check('10 + 15 + 10 = 35', calculerScoreBonus(milieu) === 35, calculerScoreBonus(milieu));

  // Un DQ garde un score : les anciennes clientes sont une liste de
  // réactivation, et l'ordre d'appel y sert autant qu'ailleurs.
  const dq = base({ deja_client: 'ancienne-cliente', priorite: 'priorite-1' });
  check('un DQ conserve son score', calculerScoreBonus(dq) === 25, calculerScoreBonus(dq));
}

// ───────────────────────────── Consentement LCAP ─────────────────────────────
console.log('\nConsentement');
{
  check('la version courante a un texte', texteConsentement(CONSENTEMENT_VERSION).length > 40);
  check(
    'une version inconnue retombe sur la courante',
    texteConsentement(999) === texteConsentement(CONSENTEMENT_VERSION),
  );
  check('le texte mentionne le désabonnement', /désabonner/.test(texteConsentement(1)));
}

// ───────── Contrat de slugs avec Make — un renommage doit casser ici ─────────
console.log('\nSlugs envoyés à Make');
{
  const attendus: [string, { valeur: string }[], string[]][] = [
    ['filtre client', Q_DEJA_CLIENT.options, ['non', 'cliente-actuelle', 'ancienne-cliente']],
    ['filtre porte ouverte', Q_DEJA_PORTE_OUVERTE.options, ['non', 'oui']],
    ['objectif', Q_OBJECTIF.options, ['perte-gras', 'energie', 'digestion', 'hormones', 'autre']],
    ['livres cibles', Q_LBS_CIBLE.options, ['moins-15', '15-30', '30-50', 'plus-50', 'aucun']],
    ['ancienneté', Q_ANCIENNETE.options, ['moins-6mois', '6mois-2ans', '2-5ans', 'plus-5ans']],
    [
      'déjà essayé',
      Q_DEJA_ESSAYE.options,
      ['weight-watchers', 'keto', 'jeune', 'nutritionniste', 'glp1', 'coach', 'rien'],
    ],
    ['priorité', Q_PRIORITE.options, ['priorite-1', 'important', 'informe']],
    ['budget', Q_BUDGET.options, ['1500-plus', '500-1500', 'moins-500', 'rien']],
    ['modalité', Q_MODALITE.options, ['clinique', 'visio']],
  ];

  for (const [nom, options, attendu] of attendus) {
    const vus = options.map((o) => o.valeur);
    check(`${nom} : ${attendu.join(' · ')}`, JSON.stringify(vus) === JSON.stringify(attendu), vus);
  }

  // Pas d'accent, pas de majuscule, pas d'espace : le brief Make est explicite.
  const tous = attendus.flatMap(([, options]) => options.map((o) => o.valeur));
  check('aucun slug hors [a-z0-9-]', tous.every((v) => /^[a-z0-9-]+$/.test(v)), tous);
}

console.log(`\nBarème v${BAREME_VERSION} · consentement v${CONSENTEMENT_VERSION}`);
console.log(failures === 0 ? '\nTous les tests passent.\n' : `\n${failures} test(s) en échec.\n`);
process.exit(failures === 0 ? 0 : 1);
