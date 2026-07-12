import createImageUrlBuilder from '@sanity/image-url';
import type { Image } from 'sanity';
import { dataset, projectId } from '../env';

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlForImage(source: Image) {
  // `auto('format')` → le CDN Sanity sert WebP/AVIF selon le navigateur (sinon il
  // renvoie le PNG/JPEG original, non compressé). `quality(75)` → compression nette.
  // Fixé ici, au point central, pour couvrir héro d'article, vignettes /blog,
  // images de corps et avatars sans toucher chaque appelant. Un `.format()` ou
  // `.quality()` ajouté ensuite par un appelant surcharge ces valeurs par défaut.
  return builder.image(source).auto('format').quality(75);
}
