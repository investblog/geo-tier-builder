import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { optimize } from 'svgo';

const FLAGS_DIR = resolve('node_modules/flag-icons/flags/4x3');
const OUT_FILE = resolve('src/assets/flags-sprite.svg');

// Get all country ISO2 codes from our dataset
const countries = JSON.parse(readFileSync(resolve('src/data/countries.v1.json'), 'utf8'));
const iso2Set = new Set(countries.map((c) => c.iso2.toLowerCase()));

const files = readdirSync(FLAGS_DIR).filter((f) => {
  if (!f.endsWith('.svg')) return false;
  const code = f.replace('.svg', '');
  return iso2Set.has(code);
});

console.log(`Building sprite from ${files.length} flags...`);

let symbols = '';

for (const file of files.sort()) {
  const code = file.replace('.svg', '');
  const raw = readFileSync(resolve(FLAGS_DIR, file), 'utf8');

  // Optimize with SVGO
  const result = optimize(raw, {
    multipass: true,
    plugins: [
      'preset-default',
    ],
  });

  // Extract the inner content and viewBox from the optimized SVG
  const viewBoxMatch = result.data.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 640 480';

  // Strip the outer <svg> tags to get inner content
  const inner = result.data
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();

  symbols += `<symbol id="flag-${code}" viewBox="${viewBox}">${inner}</symbol>\n`;
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols}</svg>\n`;

writeFileSync(OUT_FILE, sprite, 'utf8');

const sizeKB = (Buffer.byteLength(sprite) / 1024).toFixed(1);
console.log(`Sprite written: ${OUT_FILE} (${sizeKB} KB, ${files.length} flags)`);
