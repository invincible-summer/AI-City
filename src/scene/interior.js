// scene/interior.js
import * as THREE from '../../vendor/three.module.js';
import { toon, glow, P, canvasTexture, JP_FONT } from '../toon/materials.js';
import { box, boxC, cyl, plane, rbox, rng } from '../utils/geo.js';
import { createFlicker } from '../fx/anim.js';
import { STORE } from './layout.js';

const PACK = [0xe94f4f, 0xf2a03d, 0xf6d55c, 0x6cc58a, 0x4f9be0, 0x8a6fd6, 0xf28fb3, 0xffffff, 0x3fbfbf, 0xe0663a, 0x9bd14f, 0x2f4fa8];
const BOTTLE = [0x7fd0f0, 0xf6d55c, 0xe94f4f, 0x6cc58a, 0xffffff, 0xf2a03d, 0x3c3c48, 0xb5e36b, 0xf28fb3, 0x9b6a43];

class Batch {
  constructor(geo) {
    this.geo = geo;
    this.items = [];
  }
  add(x, y, z, sx = 1, sy = 1, sz = 1, color = 0xffffff, ry = 0) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
      new THREE.Vector3(sx, sy, sz),
    );
    this.items.push([m, new THREE.Color(color)]);
  }
  build(parent, mat) {
    const im = new THREE.InstancedMesh(this.geo, mat, this.items.length);
    this.items.forEach(([m, c], i) => {
      im.setMatrixAt(i, m);
      im.setColorAt(i, c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    parent.add(im);
    return im;
  }
}

function headerTex(text, bg, fg, sub) {
  return canvasTexture(1024, 160, (c, w, h) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = fg;
    c.font = `900 92px ${JP_FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, w / 2, h * 0.46);
    if (sub) {
      c.font = `700 26px ${JP_FONT}`;
      c.fillText(sub, w / 2, h * 0.86);
    }
  });
}

function buildInterior(root) {
  const g = new THREE.Group();
  root.add(g);
  const r = rng(42);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const { floor: F, z0, z1, x0, x1, ceil } = STORE;
  const lights = [];
  const flickerTubes = [];

  const boxB = new Batch(new THREE.BoxGeometry(1, 1, 1));
  const cylB = new Batch(new THREE.CylinderGeometry(0.5, 0.5, 1, 10));
  const bottleB = new Batch(new THREE.CylinderGeometry(0.5, 0.5, 1, 8));
  const capB = new Batch(new THREE.CylinderGeometry(0.5, 0.5, 1, 8));
  const triShape = new THREE.Shape([new THREE.Vector2(-0.5, -0.42), new THREE.Vector2(0.5, -0.42), new THREE.Vector2(0, 0.5)]);
  const triGeo = new THREE.ExtrudeGeometry(triShape, { depth: 1, bevelEnabled: false });
  triGeo.translate(0, 0, -0.5);
  triGeo.rotateY(Math.PI / 2);
  const onigiriB = new Batch(triGeo);
  const noriB = new Batch(new THREE.BoxGeometry(1, 1, 1));

  const floorTex = canvasTexture(1024, 1024, (c, w, h) => {
    c.fillStyle = '#efebe3';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d6d1c6';
    c.lineWidth = 3;
    const n = 16;
    for (let i = 0; i <= n; i++) {
      c.beginPath(); c.moveTo((i * w) / n, 0); c.lineTo((i * w) / n, h); c.stroke();
      c.beginPath(); c.moveTo(0, (i * h) / n); c.lineTo(w, (i * h) / n); c.stroke();
    }
    const X = (x) => ((x - (x0 + 0.15)) / (x1 - x0 - 0.3)) * w;
    const Z = (z) => ((z - (z0 + 0.15)) / (z1 - z0 - 0.3)) * h;
    c.lineWidth = 16;
    c.strokeStyle = '#2f6fd6';
    c.beginPath(); c.moveTo(X(1.45), Z(1.3)); c.lineTo(X(1.45), Z(-0.2)); c.lineTo(X(0.5), Z(-1.6)); c.lineTo(X(0.5), Z(-4.8)); c.stroke();
    c.strokeStyle = '#2fb36b';
    c.beginPath(); c.moveTo(X(0.2), Z(0.4)); c.lineTo(X(-4.0), Z(0.4)); c.lineTo(X(-4.0), Z(-4.9)); c.stroke();
    c.fillStyle = '#f08a3c';
    for (const [x, z] of [[0.5, -3.6], [0.5, -4.4]]) {
      c.save(); c.translate(X(x), Z(z));
      c.beginPath(); c.moveTo(0, -26); c.lineTo(20, 4); c.lineTo(-20, 4); c.closePath(); c.fill();
      c.fillRect(-7, 4, 14, 22);
      c.restore();
    }
    c.fillStyle = '#f2c84b';
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(X(0.5 + 0.0), Z(-2.0 - i * 0.45));
      c.beginPath(); c.ellipse(-12, 0, 10, 16, 0, 0, 7); c.ellipse(12, 10, 10, 16, 0, 0, 7); c.fill();
      c.restore();
    }
    c.fillStyle = '#2f6fd6';
    c.font = `800 34px ${JP_FONT}`;
    c.textAlign = 'center';
    c.fillText('レジはこちら', X(0.5), Z(-1.1));
    c.fillText('ソーシャルディスタンス', X(0.2), Z(-5.3));
  });
  const fl = plane(g, x1 - x0 - 0.3, z1 - z0 - 0.3, toon(0xffffff, { map: floorTex }), (x0 + x1) / 2, F + 0.002, (z0 + z1) / 2, 0, -Math.PI / 2);
  fl.receiveShadow = true;

  const dark = toon(0x3b4050);
  const white = toon(P.white);
  const shelfMat = toon(P.shelf);
  const shelfEdge = toon(0x8a93a6);

  // drink coolers (back wall)
  {
    const cx0 = -4.75, cx1 = 0.55, depth = 0.75, H = 2.45;
    const zb = z0 + 0.15;
    const zf = zb + depth;
    const W = cx1 - cx0;
    box(g, W, H, 0.08, dark, (cx0 + cx1) / 2, F, zb + 0.04);
    box(g, W, 0.35, depth, dark, (cx0 + cx1) / 2, F, zb + depth / 2);
    box(g, W, 0.35, depth, dark, (cx0 + cx1) / 2, F + H - 0.35, zb + depth / 2);
    const back = plane(g, W, H - 0.7, glow(0xdff3ff, 1.05), (cx0 + cx1) / 2, F + H / 2, zb + 0.09);
    const doors = 7;
    const dw = W / doors;
    const glassM = new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.12, depthWrite: false });
    for (let i = 0; i <= doors; i++) box(g, 0.05, H - 0.7, 0.06, toon(0x5a6074), cx0 + i * dw, F + 0.35, zf - 0.03);
    const doorGlass = [];
    for (let i = 0; i < doors; i++) {
      const gm = plane(g, dw - 0.05, H - 0.7, glassM, cx0 + (i + 0.5) * dw, F + H / 2, zf - 0.01);
      doorGlass.push(gm);
      boxC(g, 0.025, 0.5, 0.04, toon(0xbfc6d4), cx0 + (i + 1) * dw - 0.08, F + 1.3, zf + 0.02);
    }
    g.userData.coolerGlass = doorGlass;
    const levels = 5;
    for (let lv = 0; lv < levels; lv++) {
      const y = F + 0.42 + lv * 0.34;
      box(g, W - 0.05, 0.02, depth - 0.12, toon(0xd8dde6), (cx0 + cx1) / 2, y, zb + depth / 2);
      for (let i = 0; i < doors; i++) {
        const col = BOTTLE[(i * 3 + lv) % BOTTLE.length];
        const col2 = BOTTLE[(i * 5 + lv * 2 + 1) % BOTTLE.length];
        const big = lv === 0;
        const n = big ? 4 : 6;
        for (let k = 0; k < n; k++) {
          const bx = cx0 + i * dw + 0.07 + (k + 0.5) * ((dw - 0.14) / n);
          const c = k % 3 === 2 ? col2 : col;
          const bh = big ? 0.28 : 0.2 + (lv % 2) * 0.03;
          const br = big ? 0.085 : 0.055;
          for (let row = 0; row < 2; row++) {
            const bz = zf - 0.15 - row * 0.2;
            bottleB.add(bx, y + 0.01 + bh / 2, bz, br, bh, br, c);
            capB.add(bx, y + 0.01 + bh + 0.02, bz, br * 0.45, 0.04, br * 0.45, k % 2 ? 0xffffff : 0xe94f4f);
          }
        }
      }
    }
    const hdr = glow(0xffffff, 1.0, { map: headerTex('DRINK  ドリンク', '#2f6fd6', '#ffffff', 'COLD BEVERAGES · よく冷えてます') });
    box(g, W, 0.42, 0.1, dark, (cx0 + cx1) / 2, F + H + 0.05, zb + 0.05);
    plane(g, W - 0.1, 0.36, hdr, (cx0 + cx1) / 2, F + H + 0.26, zb + 0.11);
    flickerTubes.push(back.material);
  }

  // parcel lockers
  {
    const lx = 1.15, lz = z0 + 0.15 + 0.22;
    box(g, 0.95, 1.9, 0.44, toon(0xc7ccd6), lx, F, lz);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) {
      boxC(g, 0.28, 0.33, 0.02, toon(j === 2 && i === 1 ? 0x2f6fd6 : 0xdfe3ea), lx - 0.3 + i * 0.3, F + 0.25 + j * 0.35, lz + 0.23);
    }
    boxC(g, 0.2, 0.12, 0.02, glow(0x9fe0ff, 1.5), lx, F + 0.95, lz + 0.245);
  }

  // left wall chilled shelves
  {
    const xw = x0 + 0.15;
    const za = -5.0, zb = -0.7;
    const L = zb - za;
    const zc = (za + zb) / 2;
    box(g, 0.75, 2.2, L, dark, xw + 0.375 - 0.2, F, zc);
    box(g, 0.05, 1.8, L, glow(0xfff6e0, 1.3), xw + 0.06, F + 0.3, zc);
    box(g, 0.9, 0.38, L, toon(0xdfe3ea), xw + 0.45, F, zc);
    box(g, 0.05, 0.3, L, toon(0x2f6fd6), xw + 0.92, F + 0.04, zc);
    const hdr = glow(0xffffff, 1.0, { map: headerTex('おにぎり・お弁当', '#2fb36b', '#ffffff', 'ONIGIRI · BENTO · SANDWICH') });
    box(g, 0.1, 0.42, L, dark, xw + 0.05, F + 2.25, zc);
    plane(g, L - 0.1, 0.36, hdr, xw + 0.11, F + 2.46, zc, Math.PI / 2);
    const tiers = [
      { y: F + 0.38, depth: 0.85, kind: 'bento' },
      { y: F + 0.85, depth: 0.62, kind: 'bento2' },
      { y: F + 1.25, depth: 0.5, kind: 'onigiri' },
      { y: F + 1.62, depth: 0.42, kind: 'onigiri' },
      { y: F + 1.95, depth: 0.36, kind: 'sand' },
    ];
    for (const t of tiers) {
      box(g, t.depth, 0.025, L, toon(0xe8ecf2), xw + t.depth / 2, t.y, zc);
      boxC(g, 0.02, 0.06, L, toon(0xf2c84b), xw + t.depth, t.y + 0.03, zc);
      if (t.kind === 'onigiri') {
        for (let z = za + 0.1; z < zb - 0.05; z += 0.15) {
          for (let k = 0; k < 2; k++) {
            const x = xw + t.depth - 0.1 - k * 0.15;
            onigiriB.add(x, t.y + 0.08, z, 0.05, 0.13, 0.13, 0xffffff);
            noriB.add(x + 0.003, t.y + 0.055, z, 0.05, 0.06, 0.05, 0x1f2a24);
          }
        }
      } else if (t.kind === 'sand') {
        for (let z = za + 0.12; z < zb - 0.05; z += 0.22) {
          boxB.add(xw + t.depth - 0.12, t.y + 0.07, z, 0.12, 0.12, 0.16, pick([0xf6d55c, 0xf2a03d, 0x9bd14f]));
        }
      } else {
        const step = t.kind === 'bento' ? 0.32 : 0.26;
        for (let z = za + 0.18; z < zb - 0.1; z += step) {
          for (let k = 0; k < (t.kind === 'bento' ? 2 : 1); k++) {
            const x = xw + t.depth - 0.2 - k * 0.32;
            const c = pick([0xe94f4f, 0x2b2b33, 0xf2a03d, 0x6cc58a, 0xd9b06a]);
            boxB.add(x, t.y + 0.04, z, 0.26, 0.06, step - 0.04, 0x2b2b33);
            boxB.add(x, t.y + 0.085, z, 0.24, 0.03, step - 0.06, c);
          }
        }
      }
    }
  }

  // copy machine
  {
    const x = x0 + 0.5, z = 0.25;
    rbox(g, 0.62, 1.0, 0.8, 0.03, toon(0xe6e8ee), x, F, z);
    rbox(g, 0.6, 0.12, 0.7, 0.03, toon(0x9aa0ae), x, F + 1.0, z);
    boxC(g, 0.02, 0.18, 0.26, glow(0x8fd0ff, 1.4), x + 0.32, F + 0.95, z - 0.15);
    boxC(g, 0.01, 0.3, 0.6, toon(0x2f6fd6), x + 0.315, F + 0.5, z);
  }

  // magazine rack
  {
    const xa = -4.55, xb = -1.3;
    const L = xb - xa;
    const xc = (xa + xb) / 2;
    const zr = z1 - 0.38;
    box(g, L, 0.75, 0.42, toon(0xd2d7e0), xc, F, zr);
    const magTex = canvasTexture(1024, 256, (c, w, h) => {
      c.fillStyle = '#d2d7e0'; c.fillRect(0, 0, w, h);
      const cols = 14;
      const cw = w / cols;
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < cols; i++) {
          const x = i * cw + 4;
          const y = row * (h / 2) + 6;
          const hue = Math.floor(r() * 360);
          c.fillStyle = `hsl(${hue},65%,${55 + r() * 20}%)`;
          c.fillRect(x, y, cw - 8, h / 2 - 12);
          c.fillStyle = '#fff';
          c.fillRect(x + 4, y + 4, cw - 16, 18);
          c.fillStyle = `hsl(${(hue + 180) % 360},70%,35%)`;
          c.font = `900 16px ${JP_FONT}`;
          c.fillText(['週刊', 'JUMP', '月刊', 'NEWS', 'ANIME', 'CAR', '旅'][i % 7], x + 6, y + 19);
          c.fillStyle = `hsla(${(hue + 40) % 360},50%,85%,0.9)`;
          c.beginPath(); c.arc(x + cw / 2, y + 70, 22, 0, 7); c.fill();
        }
      }
    });
    const slant = plane(g, L, 0.55, toon(0xffffff, { map: magTex }), xc, F + 1.0, zr, 0);
    slant.rotation.set(-0.35, 0, 0);
    box(g, L, 0.6, 0.06, toon(0xd2d7e0), xc, F + 0.75, zr - 0.2);
    plane(g, L, 0.38, toon(0xffffff, { map: magTex }), xc, F + 0.4, zr + 0.212, 0);
  }

  // gondola shelves
  const gondola = (xc, za, zb, H) => {
    const L = zb - za;
    const zc = (za + zb) / 2;
    const Wd = 0.62;
    box(g, 0.06, H, L, shelfMat, xc, F, zc);
    box(g, Wd, 0.12, L, toon(0x6a7184), xc, F, zc);
    const levels = 4;
    for (let lv = 0; lv < levels; lv++) {
      const y = F + 0.12 + lv * ((H - 0.15) / levels);
      box(g, Wd, 0.025, L, shelfMat, xc, y, zc);
      for (const side of [-1, 1]) {
        boxC(g, 0.015, 0.05, L, shelfEdge, xc + side * (Wd / 2), y + 0.03, zc);
        const type = (lv + (side > 0 ? 1 : 0) + Math.round(xc)) % 3;
        let z = za + 0.06;
        while (z < zb - 0.08) {
          const c = pick(PACK);
          if (type === 0) {
            const w = 0.11 + r() * 0.06;
            const h = 0.16 + r() * 0.08;
            for (let k = 0; k < 2; k++) boxB.add(xc + side * (0.1 + k * 0.14), y + 0.0125 + h / 2, z + w / 2, 0.1, h, w * 0.9, c);
            z += w + 0.02;
          } else if (type === 1) {
            for (let k = 0; k < 2; k++) {
              cylB.add(xc + side * (0.11 + k * 0.14), y + 0.0125 + 0.06, z + 0.07, 0.12, 0.12, 0.12, c);
              cylB.add(xc + side * (0.11 + k * 0.14), y + 0.0125 + 0.125, z + 0.07, 0.125, 0.01, 0.125, 0xffffff);
            }
            z += 0.15;
          } else {
            const h = 0.2 + r() * 0.06;
            boxB.add(xc + side * 0.17, y + 0.0125 + h / 2, z + 0.08, 0.2, h, 0.13, c);
            z += 0.16;
          }
        }
      }
    }
    box(g, Wd + 0.04, 0.05, L + 0.04, shelfMat, xc, F + H, zc);
    box(g, Wd, 0.9, 0.35, toon(0xdfe3ea), xc, F, zb + 0.18);
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) {
      boxB.add(xc - 0.2 + j * 0.2, F + 0.9 + 0.1 + k * 0.0, zb + 0.18, 0.16, 0.2, 0.2, pick(PACK));
    }
    const pop = canvasTexture(256, 160, (c, w, h) => {
      c.fillStyle = '#ffd84a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#d9443f'; c.font = `900 64px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(xc < -2 ? 'お菓子' : 'カップ麺', w / 2, h * 0.42);
      c.font = `800 30px ${JP_FONT}`; c.fillStyle = '#2f4fa8'; c.fillText('2個で100円引', w / 2, h * 0.8);
    });
    cyl(g, 0.01, 0.01, 0.35, toon(0x9aa0ae), xc, F + H, zb - 0.1, 6);
    plane(g, 0.5, 0.31, toon(0xffffff, { map: pop, side: THREE.DoubleSide }), xc, F + H + 0.45, zb - 0.1, 0);
  };
  gondola(-3.3, -4.4, -0.75, 1.45);
  gondola(-1.55, -4.4, -0.75, 1.45);

  // counter
  {
    const cxx = 1.38, za = -5.35, zb = -2.35;
    const L = zb - za;
    const zc = (za + zb) / 2;
    box(g, 0.75, 0.95, L, toon(0xf2efe8), cxx, F, zc);
    box(g, 0.85, 0.05, L + 0.1, toon(0x9a6b4a), cxx, F + 0.95, zc);
    box(g, 0.02, 0.12, L, toon(P.brandBlue), cxx - 0.38, F + 0.7, zc);
    box(g, 0.02, 0.04, L, toon(P.brandGreen), cxx - 0.38, F + 0.64, zc);
    box(g, 0.02, 0.04, L, toon(P.brandOrange), cxx - 0.38, F + 0.6, zc);
    for (const z of [-4.55, -3.45]) {
      box(g, 0.35, 0.12, 0.4, toon(0x2b2e3b), cxx + 0.05, F + 1.0, z);
      box(g, 0.04, 0.28, 0.34, toon(0x2b2e3b), cxx + 0.05, F + 1.12, z);
      plane(g, 0.3, 0.22, glow(0x9fe0ff, 1.6), cxx + 0.075, F + 1.27, z, Math.PI / 2);
      plane(g, 0.3, 0.22, glow(0xb8f0d0, 1.3), cxx + 0.025, F + 1.27, z, -Math.PI / 2);
      boxC(g, 0.12, 0.02, 0.18, toon(0x3b4050), cxx - 0.25, F + 1.0, z + 0.2);
    }
    // hot snack case
    {
      const z = -2.85;
      box(g, 0.55, 0.05, 0.55, dark, cxx, F + 1.0, z);
      const caseGlass = new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.18, depthWrite: false });
      const cg = box(g, 0.55, 0.45, 0.55, caseGlass, cxx, F + 1.05, z);
      g.userData.noOutline = [cg];
      box(g, 0.55, 0.05, 0.55, dark, cxx, F + 1.5, z);
      boxC(g, 0.5, 0.02, 0.5, glow(0xffc070, 1.8), cxx, F + 1.48, z);
      for (let k = 0; k < 2; k++) {
        const y = F + 1.07 + k * 0.2;
        box(g, 0.5, 0.01, 0.5, toon(0xc0c6d0), cxx, y, z);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
          boxB.add(cxx - 0.18 + j * 0.18, y + 0.04, z - 0.18 + i * 0.12, 0.1, 0.07, 0.07, k ? 0xd98a3a : 0xe8b04d);
        }
      }
      const hs = canvasTexture(256, 64, (c, w, h) => {
        c.fillStyle = '#d9443f'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#fff'; c.font = `900 40px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('からあげ', w / 2, h / 2 + 2);
      });
      plane(g, 0.5, 0.12, glow(0xffffff, 1.4, { map: hs }), cxx - 0.28, F + 1.62, z, -Math.PI / 2);
      boxC(g, 0.02, 0.14, 0.52, dark, cxx - 0.27, F + 1.62, z);
    }
    // oden
    {
      const z = -5.05;
      box(g, 0.6, 0.12, 0.42, toon(0xb9c0cc), cxx - 0.05, F + 1.0, z);
      box(g, 0.56, 0.02, 0.38, toon(0x8a5a2e), cxx - 0.05, F + 1.12, z);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        boxC(g, 0.005, 0.02, 0.38, toon(0xb9c0cc), cxx - 0.24 + i * 0.19, F + 1.13, z);
        const cols = [0xf6e6b0, 0xc47a2c, 0xffffff, 0x8b5a3c, 0xf2d27a, 0x6b4a32];
        for (let k = 0; k < 3; k++) {
          cylB.add(cxx - 0.2 + i * 0.18 + (k - 1) * 0.04, F + 1.14, z - 0.1 + j * 0.2 + (k % 2) * 0.03, 0.05, 0.03, 0.05, cols[(i * 2 + j + k) % cols.length]);
        }
      }
      const lid = box(g, 0.6, 0.02, 0.2, new THREE.MeshBasicMaterial({ color: 0xdde8f0, transparent: true, opacity: 0.25 }), cxx - 0.05, F + 1.32, z + 0.05);
      lid.rotation.x = 0.5;
      g.userData.odenPos = new THREE.Vector3(cxx - 0.05, F + 1.15, z);
      const os = canvasTexture(256, 64, (c, w, h) => {
        c.fillStyle = '#fff6dc'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#d9443f'; c.font = `900 40px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('おでん', w / 2, h / 2 + 2);
      });
      plane(g, 0.42, 0.1, toon(0xffffff, { map: os }), cxx - 0.36, F + 1.05, z, -Math.PI / 2);
    }
    // coffee corner
    {
      const z = -1.95;
      box(g, 0.65, 0.95, 0.6, toon(0x5a3e2e), cxx, F, z);
      box(g, 0.7, 0.04, 0.65, toon(0x9a6b4a), cxx, F + 0.95, z);
      rbox(g, 0.42, 0.62, 0.42, 0.03, toon(0x22232b), cxx + 0.05, F + 0.99, z);
      plane(g, 0.18, 0.14, glow(0x9fe0ff, 1.8), cxx - 0.165, F + 1.4, z, -Math.PI / 2);
      boxC(g, 0.02, 0.08, 0.3, glow(0xffb070, 2), cxx - 0.165, F + 1.52, z);
      boxC(g, 0.1, 0.14, 0.16, toon(0x3b3c48), cxx - 0.11, F + 1.08, z);
      for (let i = 0; i < 4; i++) cylB.add(cxx - 0.22, F + 0.99 + 0.05 + i * 0.07, z + 0.22, 0.07, 0.07, 0.07, 0xffffff);
      const cs = canvasTexture(256, 96, (c, w, h) => {
        c.fillStyle = '#5a3e2e'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#fff'; c.font = `900 44px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('COFFEE', w / 2, h * 0.42);
        c.font = `700 22px ${JP_FONT}`; c.fillText('いれたてコーヒー 100円', w / 2, h * 0.8);
      });
      plane(g, 0.55, 0.2, toon(0xffffff, { map: cs }), cxx - 0.33, F + 0.55, z, -Math.PI / 2);
    }
    // back shelf with cigarettes
    {
      const xb = x1 - 0.15 - 0.2;
      box(g, 0.4, 0.95, 2.9, toon(0xdcd8cf), xb, F, -4.3);
      box(g, 0.25, 1.0, 2.9, toon(0x3b4050), xb + 0.075, F + 1.1, -4.3);
      for (let j = 0; j < 6; j++) for (let i = 0; i < 18; i++) {
        boxB.add(xb - 0.06, F + 1.17 + j * 0.155, -5.6 + i * 0.152, 0.03, 0.11, 0.08, PACK[(i * 7 + j * 3) % PACK.length]);
      }
      boxC(g, 0.02, 0.18, 2.9, glow(0xfff1cf, 1.5), xb - 0.04, F + 2.2, -4.3);
    }
    // staff door
    {
      box(g, 0.95, 2.1, 0.04, toon(0x9aa3b4), 2.2, F, z0 + 0.17);
      const sd = canvasTexture(256, 64, (c, w, h) => {
        c.fillStyle = '#2b2e3b'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#fff'; c.font = `800 30px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('STAFF ONLY', w / 2, h / 2 + 2);
      });
      plane(g, 0.5, 0.12, toon(0xffffff, { map: sd }), 2.2, F + 1.75, z0 + 0.195);
      boxC(g, 0.04, 0.04, 0.08, toon(0x6a7184), 2.55, F + 1.0, z0 + 0.22);
      plane(g, 0.12, 0.6, toon(0xd6dbe5), 2.2, F + 1.4, z0 + 0.195);
    }
  }

  // ice cream freezer
  {
    const x = 1.7, z = -0.75;
    rbox(g, 1.3, 0.8, 0.7, 0.04, toon(0xf4f2ec), x, F, z);
    boxC(g, 1.2, 0.02, 0.6, glow(0xc8ecff, 1.1), x, F + 0.7, z);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
      boxB.add(x - 0.52 + i * 0.13, F + 0.74, z - 0.2 + j * 0.13, 0.1, 0.05, 0.11, PACK[(i + j * 4) % PACK.length]);
    }
    const lid = box(g, 1.25, 0.02, 0.65, new THREE.MeshBasicMaterial({ color: 0xe0f4ff, transparent: true, opacity: 0.2, depthWrite: false }), x, F + 0.8, z);
    (g.userData.noOutline ||= []).push(lid);
    boxC(g, 1.31, 0.12, 0.01, toon(0x4f9be0), x, F + 0.6, z + 0.355);
  }

  // ATM
  {
    const x = 2.78, z = 1.05;
    rbox(g, 0.5, 1.5, 0.45, 0.03, toon(0x2f4fa8), x, F, z);
    const scr = plane(g, 0.3, 0.22, glow(0x9fe0ff, 1.6), x, F + 1.05, z - 0.228, Math.PI);
    boxC(g, 0.3, 0.03, 0.1, toon(0x22232b), x, F + 0.8, z - 0.25);
    plane(g, 0.36, 0.1, glow(0xffffff, 1.2), x, F + 1.38, z - 0.228, Math.PI);
  }

  // umbrella stand + baskets
  {
    const x = 0.05, z = 0.95;
    cyl(g, 0.2, 0.17, 0.4, toon(0x9aa0ae), x, F, z);
    const umb = new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.45 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const u = new THREE.Group();
      cyl(u, 0.008, 0.008, 0.85, toon(0x9aa0ae), 0, 0, 0, 5);
      const cone = cyl(u, 0.02, 0.06, 0.55, umb, 0, 0.25, 0, 8);
      boxC(u, 0.05, 0.04, 0.02, toon(0xffffff), 0, 0.88, 0);
      u.position.set(x + Math.cos(a) * 0.08, F + 0.05, z + Math.sin(a) * 0.08);
      u.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
      g.add(u);
      (g.userData.noOutline ||= []).push(cone);
    }
    const bm = toon(0xd9443f);
    for (let i = 0; i < 4; i++) {
      const b = box(g, 0.42, 0.22, 0.3, bm, 2.25 + 0.0, F + i * 0.06, 0.25);
      b.scale.set(1 - i * 0.0, 1, 1);
    }
  }

  // ceiling light panels
  {
    const tube = glow(0xfffaf0, 1.5);
    const flickTube = glow(0xfffaf0, 1.5);
    for (const z of [-4.6, -2.8, -1.0, 0.7]) {
      for (let x = -4.3; x < 2.0; x += 1.55) {
        const isFlick = z === -1.0 && x > -1.5 && x < -1.0;
        const m = boxC(g, 1.1, 0.04, 0.22, isFlick ? flickTube : tube, x + 0.6, ceil - 0.03, z);
        m.userData.noShadowCast = true;
      }
    }
    flickerTubes.push(flickTube);
  }

  // hanging POP banners
  {
    const mk = (txt, bg, fg) => canvasTexture(256, 128, (c, w, h) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = fg; c.font = `900 50px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(txt, w / 2, h / 2 + 2);
    });
    const items = [
      ['からあげ増量', '#d9443f', '#fff', -0.6, -2.0],
      ['いちごフェア', '#f28fb3', '#fff', -2.4, -1.4],
      ['新商品', '#ffd84a', '#d9443f', -2.4, -3.8],
      ['ポイント2倍', '#2f6fd6', '#fff', 0.4, -3.6],
    ];
    for (const [t, bg, fg, x, z] of items) {
      const m = toon(0xffffff, { map: mk(t, bg, fg), side: THREE.DoubleSide });
      plane(g, 0.6, 0.3, m, x, ceil - 0.45, z, Math.PI / 4);
      cyl(g, 0.004, 0.004, 0.28, toon(0x9aa0ae), x, ceil - 0.3, z, 4);
    }
  }

  boxB.build(g, toon(0xffffff, { noCache: true }));
  cylB.build(g, toon(0xffffff, { noCache: true }));
  bottleB.build(g, toon(0xffffff, { noCache: true }));
  capB.build(g, toon(0xffffff, { noCache: true }));
  onigiriB.build(g, toon(0xffffff, { noCache: true }));
  noriB.build(g, toon(0xffffff, { noCache: true }));

  const warm = 0xffefd2;
  for (const [x, y, z, i] of [[-2.6, 2.9, -3.4, 4.2], [0.9, 2.9, -2.6, 3.6], [-1.8, 2.9, 0.2, 3.6], [1.8, 2.9, 0.5, 3.0]]) {
    const l = new THREE.PointLight(warm, i, 9, 1.2);
    l.position.set(x, y, z);
    g.add(l);
    lights.push(l);
  }

  return { group: g, lights, flickerTubes, noOutline: [...(g.userData.noOutline || []), ...(g.userData.coolerGlass || [])], odenPos: g.userData.odenPos };
}

export const block = {
  name: 'interior',
  // 室内整块不参与外描边（招牌等细节自带描边遮罩）
  skipOutline: (handles) => [handles.group],
  build: (world) => {
    const handles = buildInterior(world);
    const flicker = createFlicker(handles.flickerTubes, { base: 1, seed: 3, amp: 0.03, blinkChance: 0.22 });
    return {
      ...handles,
      update(dt, elapsed) {
        flicker.update(elapsed);
        for (const l of handles.lights) {
          if (l.userData.base === undefined) l.userData.base = l.intensity;
          l.intensity = l.userData.base * (1 + Math.sin(elapsed * 3.1 + l.position.x) * 0.04);
        }
      },
    };
  },
};

export { buildInterior };
