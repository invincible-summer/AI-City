// toon/materials.js
import * as THREE from '../../vendor/three.module.js';

let gradient;
function gradientMap() {
  if (gradient) return gradient;
  const steps = [70, 140, 205, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => {
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  });
  gradient = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

const cache = new Map();

function toon(color, opts = {}) {
  const key = opts.map || opts.emissiveMap || opts.noCache
    ? null
    : `${color}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? ''}|${opts.side ?? ''}|${opts.transparent ?? ''}|${opts.opacity ?? ''}`;
  if (key && cache.has(key)) return cache.get(key);
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: gradientMap(),
    map: opts.map || null,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    emissiveMap: opts.emissiveMap || null,
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
  if (key) cache.set(key, m);
  return m;
}

function glow(color, intensity = 1, opts = {}) {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  return new THREE.MeshBasicMaterial({
    color: c,
    map: opts.map || null,
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    toneMapped: true,
  });
}

const P = {
  outline: 0x1a1830,
  asphalt: 0x3a3f55,
  asphaltLot: 0x474b5f,
  concrete: 0x8a8ea0,
  concreteDark: 0x6b6f82,
  curb: 0xa9adb8,
  wall: 0xe9e4da,
  wallShade: 0xc9c3b8,
  wallDark: 0x4a4e60,
  roof: 0x7a7f90,
  metal: 0x9aa3b4,
  metalDark: 0x50566a,
  pole: 0x8d8f96,
  black: 0x24252e,
  white: 0xf4f2ec,
  brandBlue: 0x2f6fd6,
  brandGreen: 0x2fb36b,
  brandOrange: 0xf08a3c,
  red: 0xd9443f,
  yellow: 0xf2c84b,
  wood: 0x9a6b4a,
  floor: 0xeeeae2,
  shelf: 0xdfe3ea,
  plinth: 0x2b2a35,
  plinthTop: 0x3b3a48,
};

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const JP_FONT = '"Hiragino Sans","Noto Sans CJK JP","Noto Sans JP","Yu Gothic","Meiryo","Source Han Sans",sans-serif';

export { toon, glow, canvasTexture, P, JP_FONT };
