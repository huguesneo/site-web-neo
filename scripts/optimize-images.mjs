import sharp from 'sharp';
import { statSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = new URL('../public/', import.meta.url).pathname;

// Cap de la dimension la plus large (px). 2× la taille d'affichage max → net sur écrans retina.
const jobs = [
  { src: 'hero.jpg', maxW: 1920, quality: 78 },
  { src: 'methode.jpg', maxW: 1400, quality: 78 },
  { src: 'consultation.jpg', maxW: 1600, quality: 78 },
  { src: 'clinique.jpg', maxW: 1600, quality: 78 },
  { src: 'lyliane.jpg', maxW: 1400, quality: 78 },
  { src: 'communaute.png', maxW: 1600, quality: 80 },
];

const kb = (p) => (statSync(p).size / 1024).toFixed(0);

for (const { src, maxW, quality } of jobs) {
  const inPath = join(PUBLIC, src);
  const outName = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const outPath = join(PUBLIC, outName);
  const before = kb(inPath);
  await sharp(inPath)
    .resize({ width: maxW, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outPath);
  console.log(`${src} (${before} Ko) → ${outName} (${kb(outPath)} Ko)`);
}
