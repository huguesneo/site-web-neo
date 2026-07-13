interface FaqBlock {
  _type?: string;
  style?: string;
  children?: { text?: string }[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_HEADING = 'questions fréquentes';

function blockText(block: FaqBlock): string {
  return (block.children ?? []).map((c) => c.text ?? '').join('').trim();
}

/**
 * Extrait les paires question/réponse de la section "Questions fréquentes" d'un article.
 * Convention éditoriale (pas de champ Sanity dédié) : un bloc H2 "Questions fréquentes"
 * ouvre la section, chaque H3 qui suit est une question, les blocs normaux jusqu'au H3
 * ou H2 suivant en forment la réponse, et le H2 suivant (ex. "En résumé") la ferme.
 */
export function extractFaqFromBody(body?: FaqBlock[]): FaqItem[] {
  if (!body?.length) return [];

  const startIndex = body.findIndex(
    (b) => b._type === 'block' && b.style === 'h2' && blockText(b).toLowerCase() === FAQ_HEADING
  );
  if (startIndex === -1) return [];

  let endIndex = body.findIndex((b, i) => i > startIndex && b._type === 'block' && b.style === 'h2');
  if (endIndex === -1) endIndex = body.length;

  const section = body.slice(startIndex + 1, endIndex).filter((b) => b._type === 'block');

  const items: FaqItem[] = [];
  let current: FaqItem | null = null;

  for (const block of section) {
    if (block.style === 'h3') {
      const question = blockText(block);
      current = question ? { question, answer: '' } : null;
      if (current) items.push(current);
    } else if (current) {
      const text = blockText(block);
      if (text) current.answer = current.answer ? `${current.answer} ${text}` : text;
    }
  }

  return items.filter((item) => item.question && item.answer);
}

/** Construit le schema FAQPage JSON-LD à partir des paires question/réponse. Retourne null si vide. */
export function buildFaqJsonLd(items: FaqItem[]) {
  if (!items.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
