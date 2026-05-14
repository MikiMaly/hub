// Kopíruje gekos Pages Functions do hub/functions tak aby je Cloudflare Pages
// při buildu načetl. Spouští se jako npm "prebuild" script — i lokálně i v CI
// (Cloudflare Pages build běží na Linuxu, fs.cpSync je cross-platform).
//
// Co se kopíruje (z gekos submodulu):
//   gekos/functions/api/geckos -> functions/api/geckos
//   gekos/functions/_lib       -> functions/_lib
//
// Tyto cílové cesty jsou v .gitignore (generované).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const pairs = [
  ['gekos/functions/api/geckos', 'functions/api/geckos'],
  ['gekos/functions/_lib', 'functions/_lib'],
];

let copied = 0;
for (const [src, dst] of pairs) {
  const srcAbs = path.join(root, src);
  const dstAbs = path.join(root, dst);

  if (!fs.existsSync(srcAbs)) {
    console.error(`prebuild-gekos: source missing: ${src}`);
    console.error(`  did you run \`git submodule update --init --recursive\`?`);
    process.exit(1);
  }

  fs.rmSync(dstAbs, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
  fs.cpSync(srcAbs, dstAbs, { recursive: true });
  console.log(`prebuild-gekos: ${src} -> ${dst}`);
  copied += 1;
}

console.log(`prebuild-gekos: ${copied} trees copied`);
