/*
 * Tests du routage de la porte ouverte (lib/porteOuverte.ts).
 * Lancer : npx tsx scripts/test-porte-ouverte-scoring.ts
 */
import {
  CONSENTEMENT_VERSION,
  Q_BUDGET,
  Q_MODALITE,
  REPONSES_VIDES,
  Reponses,
  TAGS_PORTE_OUVERTE,
  calculerSortie,
  champsPorteOuverte,
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

/** Réponses complètes, à surcharger cas par cas. */
function base(patch: Partial<Reponses> = {}): Reponses {
  return {
    ...REPONSES_VIDES,
    cliente: 'non',
    objectif: 'perte-gras',
    budget: '500-1500',
    modalite: 'visio',
    ...patch,
  };
}

// ──────────────────────────────── Sorties ────────────────────────────────
console.log('\nSorties');
check('cliente active → cliente-active', calculerSortie(base({ cliente: 'oui' })) === 'cliente-active');
check(
  'cliente active dès Q1, sans le reste',
  calculerSortie({ ...REPONSES_VIDES, cliente: 'oui' }) === 'cliente-active',
);
check(
  'cliente active bat le budget « rien »',
  calculerSortie(base({ cliente: 'oui', budget: 'rien' })) === 'cliente-active',
);
check('budget rien → information', calculerSortie(base({ budget: 'rien' })) === 'information');
check(
  'budget rien sort sans la modalité',
  calculerSortie(base({ budget: 'rien', modalite: null })) === 'information',
);
for (const b of ['2500-plus', '1500-2500', '500-1500', 'moins-500'] as const) {
  check(`budget ${b} → calendrier`, calculerSortie(base({ budget: b })) === 'calendrier');
}
check('pas de sortie sans modalité', calculerSortie(base({ modalite: null })) === null);
check('pas de sortie sans budget', calculerSortie(base({ budget: null })) === null);
check('pas de sortie à vide', calculerSortie(REPONSES_VIDES) === null);

// ───────────────────────────── Champs GHL ────────────────────────────────
console.log('\nChamps PO');
{
  const c = champsPorteOuverte(base({ cliente: 'oui' }), 'cliente-active');
  check('cliente → po_statut dq + motif', c.po_statut === 'dq' && c.po_dq_motif === 'cliente-actuelle', c);
}
{
  const c = champsPorteOuverte(base({ budget: 'rien', modalite: null }), 'information');
  check('information → po_statut froid', c.po_statut === 'froid', c);
  check('libellé GHL exact du budget rien', c.po_budget === 'Rien pour le moment — je viens chercher de l\'information', c);
  check('pas de modalité écrite', !('po_modalite' in c), c);
}
{
  const c = champsPorteOuverte(base({ budget: 'moins-500', modalite: 'clinique' }), 'calendrier');
  check('moins de 500 → tiede', c.po_statut === 'tiede', c);
  check('modalité GHL', c.po_modalite === 'À la clinique de Brossard', c);
}
check('500+ → chaud', champsPorteOuverte(base(), 'calendrier').po_statut === 'chaud');

// Les options des champs GHL à choix : un libellé qui dérive casse ici.
check(
  'options po_budget = liste GHL',
  JSON.stringify(Q_BUDGET.options.map((o) => o.ghl)) ===
    JSON.stringify([
      '2 500 $ et plus',
      '1 500 $ à 2 500 $',
      '500 $ à 1 500 $',
      'Moins de 500 $',
      'Rien pour le moment — je viens chercher de l\'information',
    ]),
);
check(
  'options po_modalite = liste GHL',
  JSON.stringify(Q_MODALITE.options.map((o) => o.ghl)) ===
    JSON.stringify(['À la clinique de Brossard', 'En visio']),
);

// ──────────────────────────────── Tags ───────────────────────────────────
console.log('\nTags');
{
  const tags = [
    TAGS_PORTE_OUVERTE.inscrite,
    ...Object.values(TAGS_PORTE_OUVERTE.sorties),
    TAGS_PORTE_OUVERTE.avertirPlace,
  ];
  check('tous préfixés po-2310-', tags.every((t) => t.startsWith('po-2310-')), tags);
  check('tous distincts', new Set(tags).size === tags.length, tags);
}

// ───────────────────────────── Consentement LCAP ─────────────────────────────
console.log('\nConsentement');
check('la version courante a un texte', texteConsentement(CONSENTEMENT_VERSION).length > 40);
check(
  'une version inconnue retombe sur la courante',
  texteConsentement(999) === texteConsentement(CONSENTEMENT_VERSION),
);
check('le texte mentionne le désabonnement', /désabonner/.test(texteConsentement(1)));

console.log(failures === 0 ? '\nTous les tests passent.\n' : `\n${failures} test(s) en échec.\n`);
process.exit(failures === 0 ? 0 : 1);
