#!/usr/bin/env node
// Verifies every item in src/js/supplies.js has its icon in public/img/item/.
// Static items use <key>.jpg, animated items (new Item(..., true)) use <key>.gif.
// Exits non-zero and tells the maintainer which file to add when one is missing.
// Wired as npm "test" and "prebuild" so a missing icon fails `npm run build`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import supplies from '../src/js/supplies.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'public', 'img', 'item');

const missing = [];
let checked = 0;

for (const [key, item] of Object.entries(supplies.items)) {
  const file = `${key}.${item.animated ? 'gif' : 'jpg'}`;
  checked++;
  if (!fs.existsSync(path.join(imgDir, file))) {
    missing.push({ key, name: item.name, file });
  }
}

if (missing.length > 0) {
  console.error(`\n✗ ${missing.length} item(s) in src/js/supplies.js have no icon in public/img/item/:\n`);
  for (const { key, name, file } of missing) {
    console.error(`  - ${key} ("${name}") → expected public/img/item/${file}`);
  }
  console.error(
    '\nAdd the missing icon(s) to public/img/item/ named exactly as shown above.\n' +
    'Static .jpg icons can be fetched via the download-images skill / WikiParser/data/supplies.images;\n' +
    'animated .gif icons come from a separate source (see the download-images skill).\n'
  );
  process.exit(1);
}

console.log(`✓ All ${checked} item icons present in public/img/item/`);
