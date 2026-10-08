/**
 * Regenerates vendor/three.module.js from vendor/three.min.js.
 *
 * The bundled three.js is a minified build that only assigns one global object
 * (globalThis.THREE) and exports nothing, so ES modules cannot import names from
 * it directly. This script parses the keys of that object literal and emits a
 * thin ES module that re-exports each of them by name, which is what the rest
 * of the code imports.
 *
 * Run:  node tools/gen-three-exports.mjs
 * vendor/three.module.js is generated output - do not edit it by hand.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = join(root, 'vendor/three.min.js');
const outPath = join(root, 'vendor/three.module.js');

const MINIFIED = readFileSync(srcPath, 'utf8');

const marker = 'globalThis.THREE = {';
const start = MINIFIED.lastIndexOf(marker);
if (start === -1) throw new Error('globalThis.THREE assignment not found in vendor/three.min.js');
const bodyStart = start + marker.length;
const bodyEnd = MINIFIED.indexOf('};', bodyStart);
if (bodyEnd === -1) throw new Error('unterminated globalThis.THREE object literal');

const literal = MINIFIED.slice(bodyStart, bodyEnd);

// Top-level keys only: walk the literal and collect identifiers that sit at
// depth 0 and are immediately followed by ':'.
const keys = [];
let depth = 0;
let expectKey = true;
let token = '';
for (let i = 0; i < literal.length; i++) {
  const c = literal[i];
  if (c === '{' || c === '[' || c === '(') {
    depth++;
    continue;
  }
  if (c === '}' || c === ']' || c === ')') {
    depth--;
    continue;
  }
  if (c === '"' || c === "'") {
    const quote = c;
    let j = i + 1;
    while (j < literal.length && literal[j] !== quote) {
      if (literal[j] === '\\') j++;
      j++;
    }
    if (depth === 0 && expectKey) keys.push(literal.slice(i + 1, j));
    expectKey = false;
    i = j;
    continue;
  }
  if (c === ':') {
    if (depth === 0 && expectKey) keys.push(token);
    expectKey = true;
    token = '';
    continue;
  }
  if (c === ',') {
    expectKey = true;
    token = '';
    continue;
  }
  if (/\s/.test(c)) continue;
  token += c;
  if (depth > 0) expectKey = false;
}

const revision = /const t="(\d+)"/.exec(MINIFIED)?.[1] ?? 'unknown';
const unique = [...new Set(keys)].filter((k) => /^[A-Za-z_$][\w$]*$/.test(k));
if (unique.length < 200) throw new Error(`only ${unique.length} keys parsed, expected ~230`);

const columns = 4;
const perLine = Math.ceil(unique.length / columns);
const rows = [];
for (let i = 0; i < unique.length; i += perLine) {
  rows.push('  ' + unique.slice(i, i + perLine).join(', '));
}

const out = `// GENERATED FILE - do not edit by hand.
// Source: vendor/three.min.js (three.js r${revision}, MIT)
// Regenerate with: node tools/gen-three-exports.mjs
//
// The minified three.js build only assigns \`globalThis.THREE\`; this module turns
// that single global object into named ES module exports so the rest of the
// code can use the usual \`import * as THREE from './vendor/three.module.js'\`.

import './three.min.js';

const THREE = globalThis.THREE;

export const {
${rows.join(',\n')}
} = THREE;

export default THREE;
`;

writeFileSync(outPath, out);
console.log(`wrote vendor/three.module.js (${unique.length} named exports, three r${revision})`);