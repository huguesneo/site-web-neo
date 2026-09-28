/*
 * Tests du routage de la porte ouverte (lib/porteOuverte.ts).
 * Lancer : npx tsx scripts/test-porte-ouverte-scoring.ts
 */
import {
  CONSENTEMENT_VERSION,
  Q_DIFFICULTE,
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
    difficulte: 'temps',
    pret: 'totalement',
    modalite: 'visio',
    ...patch,
  };
}

// ──────────────────────────────── Sorties ────────────────────────────────
console.log('\nSorties');
check('cliente → cliente-active', calculerSortie(base({ cliente: 'oui' })) === 'cliente-active');
check(
  'cliente dès Q1, sans le reste',
  calculerSortie({ ...REPONSES_VIDES, cliente: 'oui' }) === 'cliente-active',
);
check(
  'cliente bat « pas pour l’instant »',
  calculerSortie(base({ cliente: 'oui', pret: 'pas-maintenant' })) === 'cliente-active',
);
check('pas prête → information', calculerSortie(base({ pret: 'pas-maintenant' })) === 'information');
check(
  'pas prête sort sans la modalité',
  calculerSortie(base({ pret: 'pas-maintenant', modalite: null })) === 'information',
);
for (const p of ['totalement', 'accompagnee'] as const) {
  check(`prête (${p}) → calendrier`, calculerSortie(base({ pret: p })) === 'calendrier');
}
check('pas de sortie sans modalité', calculerSortie(base({ modalite: null })) === null);
check('pas de sortie sans réponse « prête »', calculerSortie(base({ pret: null })) === null);
check('pas de sortie à vide', calculerSortie(REPONSES_VIDES) === null);

// ───────────────────────────── Champs GHL ────────────────────────────────
console.log('\nChamps PO');
{
  const c = champsPorteOuverte(base({ cliente: 'oui' }), 'cliente-active');
  check('cliente → po_statut dq + motif', c.po_statut === 'dq' && c.po_dq_motif === 'cliente-actuelle', c);
}
{
  const c = champsPorteOuverte(base({ pret: 'pas-maintenant', modalite: null }), 'information');
  check('information → po_statut froid', c.po_statut === 'froid', c);
  check('réponse écrite en toutes lettres', c.po_pret_changement === 'Non, pas pour l’instant', c);
  check('pas de modalité écrite', !('po_modalite' in c), c);
}
{
  const c = champsPorteOuverte(base({ pret: 'accompagnee', modalite: 'clinique' }), 'calendrier');
  check('prête mais accompagnée → tiede', c.po_statut === 'tiede', c);
  check('modalité GHL', c.po_modalite === 'À la clinique de Brossard', c);
  check('difficulté écrite', c.po_difficulte === 'Le manque de temps', c);
}
check('totalement prête → chaud', champsPorteOuverte(base(), 'calendrier').po_statut === 'chaud');
check(
  '« Tous ces choix » en dernier',
  Q_DIFFICULTE.options[Q_DIFFICULTE.options.length - 1].label === 'Tous ces choix',
);

// L'option du champ GHL à choix : un libellé qui dérive casse ici.
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
