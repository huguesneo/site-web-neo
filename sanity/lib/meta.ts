interface MetaBlock {
  _type?: string;
  style?: string;
  listItem?: string;
  children?: { text?: string }[];
}

const KEY_POINTS_HEADING = 'points clés';
const MAX_LENGTH = 155;

function blockText(block: MetaBlock): string {
  return (block.children ?? []).map((c) => c.text ?? '').join('').trim();
}

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Collecte les puces consécutives à partir de `fromIndex` (s'arrête au premier bloc non-puce). */
function collectBullets(body: MetaBlock[], fromIndex: number): string[] {
  const bullets: string[] = [];
  for (let i = fromIndex; i < body.length; i++) {
    const block = body[i];
    if (block._type !== 'block' || block.listItem !== 'bullet') {
      if (bullets.length) break;
      continue;
    }
    const text = blockText(block);
    if (text) bullets.push(text);
  }
  return bullets;
}

/**
 * Dérive une meta description : l'excerpt Sanity s'il est rempli, sinon les puces
 * du bloc éditorial "Points clés" en tête d'article (avec ou sans titre explicite),
 * sinon le premier paragraphe.
 */
export function extractMetaDescription(body?: MetaBlock[], excerpt?: string): string | undefined {
  if (excerpt?.trim()) return excerpt.trim();
  if (!body?.length) return undefined;

  const headingIndex = body.findIndex(
    (b) => b._type === 'block' && blockText(b).toLowerCase() === KEY_POINTS_HEADING
  );

  const bullets = headingIndex !== -1 ? collectBullets(body, headingIndex + 1) : collectBullets(body, 0);
  if (bullets.length) return truncateAtWord(bullets.join(' '), MAX_LENGTH);

  const firstParagraph = body.find(
    (b) => b._type === 'block' && b.style === 'normal' && !b.listItem && blockText(b).length > 20
  );
  return firstParagraph ? truncateAtWord(blockText(firstParagraph), MAX_LENGTH) : undefined;
}
