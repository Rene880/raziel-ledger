#!/usr/bin/env node
// Verifies every item icon referenced by the app exists in public/img/item/.
// Two sources are walked:
//   - src/js/supplies.js  — the eternal/evoker calculators' items. Static items
//     use <key>.jpg, animated items (new Item(..., true)) use <key>.gif.
//   - src/js/bullets.js   — the Bullets calculator (since v1.3.0). Self-contained
//     { name, image, items:[{ name, image, quantity }] } data; every `image` key
//     is a static <key>.jpg (no animated bullet icons).
// Exits non-zero and tells the maintainer which file to add when one is missing.
// Wired as npm "test" and "prebuild" so a missing icon fails `npm run build`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import supplies from '../src/js/supplies.js';
import bullets from '../src/js/bullets.js';

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

// Bullets calculator: collect every distinct `image` key (bullets + their crafting
// items), then assert each has a .jpg. A key already verified via supplies.js is
// not double-counted.
const bulletIcons = new Map(); // key -> display name
for (const category of bullets) {
  for (const bullet of category.bullets) {
    if (!bulletIcons.has(bullet.image)) bulletIcons.set(bullet.image, bullet.name.trim());
    for (const item of bullet.items) {
      if (!bulletIcons.has(item.image)) bulletIcons.set(item.image, item.name.trim());
    }
  }
}

for (const [key, name] of bulletIcons) {
  if (Object.prototype.hasOwnProperty.call(supplies.items, key)) continue;
  const file = `${key}.jpg`;
  checked++;
  if (!fs.existsSync(path.join(imgDir, file))) {
    missing.push({ key, name, file });
  }
}

if (missing.length > 0) {
  console.error(`\n✗ ${missing.length} item(s) in src/js/supplies.js or src/js/bullets.js have no icon in public/img/item/:\n`);
  for (const { key, name, file } of missing) {
    console.error(`  - ${key} ("${name}") → expected public/img/item/${file}`);
  }
  console.error(
    '\nAdd the missing icon(s) to public/img/item/ named exactly as shown above.\n' +
    'Static .jpg icons can be fetched via the download-images skill / WikiParser:\n' +
    '  - supplies.js items → WikiParser/data/supplies.images\n' +
    '  - bullets.js items  → WikiParser/data/bullets.images\n' +
    'animated .gif icons come from a separate source (see the download-images skill).\n'
  );
  process.exit(1);
}

console.log(`✓ All ${checked} item icons present in public/img/item/`);
