export function formatDateFR(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Estime le temps de lecture à partir du nombre de blocs de texte Portable Text. */
export function estimateReadTime(blocks?: { _type?: string; children?: { text?: string }[] }[]): string {
  if (!blocks?.length) return '5 min';
  const words = blocks
    .filter((b) => b._type === 'block')
    .flatMap((b) => b.children ?? [])
    .map((c) => c.text ?? '')
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}
