// scene/props.js
import * as THREE from '../../vendor/three.module.js';
import { toon, glow, P, canvasTexture, JP_FONT } from '../toon/materials.js';
import { box, boxC, cyl, plane, rbox, tube, rng } from '../utils/geo.js';
import { createFlicker } from '../fx/anim.js';
import { SIDEWALK_H } from './layout.js';

function vendingFront(base, accent, seed) {
  const r = rng(seed);
  return canvasTexture(256, 512, (c, w, h) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#eaf6ff';
    c.fillRect(14, 14, w - 28, 250);
    const cols = ['#e94f4f', '#f2a03d', '#4f9be0', '#6cc58a', '#ffffff', '#3c3c48', '#f6d55c', '#9b6a43', '#f28fb3'];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6; i++) {
        const x = 24 + i * 36;
        const y = 26 + row * 80;
        const col = cols[Math.floor(r() * cols.length)];
        c.fillStyle = col;
        c.beginPath();
        c.roundRect(x, y, 26, 52, 6);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.6)';
        c.fillRect(x + 4, y + 16, 18, 10);
        c.fillStyle = '#c9d4e2';
        c.fillRect(x, y + 58, 26, 8);
        c.fillStyle = r() < 0.5 ? '#3fbf6a' : '#e94f4f';
        c.fillRect(x + 8, y + 60, 10, 4);
      }
    }
    c.fillStyle = accent;
    c.fillRect(0, 276, w, 60);
    c.fillStyle = '#fff';
    c.font = `900 34px ${JP_FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(seed % 2 ? 'つめた〜い' : 'あったか〜い', w / 2, 306);
    c.fillStyle = '#20232e';
    c.fillRect(170, 350, 60, 70);
    c.fillStyle = '#9aa3b4';
    c.fillRect(182, 362, 36, 8);
    c.fillRect(182, 384, 36, 20);
    c.fillStyle = '#20232e';
    c.fillRect(30, 430, 196, 56);
    c.fillStyle = '#4a4e5e';
    c.fillRect(36, 436, 184, 44);
  });
}

function vending(parent, x, z, rot, base, accent, seed) {
  const g = new THREE.Group();
  const body = toon(new THREE.Color(base).getHex());
  rbox(g, 0.95, 1.85, 0.78, 0.04, body, 0, 0, 0);
  const tex = vendingFront(base, accent, seed);
  const face = glow(0xffffff, 1.25, { map: tex });
  plane(g, 0.88, 1.76, face, 0, 0.93, 0.392);
  boxC(g, 0.97, 0.06, 0.8, toon(0x2b2e3b), 0, 1.87, 0);
  boxC(g, 0.9, 0.08, 0.04, toon(0x2b2e3b), 0, 0.04, 0.38);
  g.position.set(x, SIDEWALK_H, z);
  g.rotation.y = rot;
  parent.add(g);
  return { group: g, face };
}

function bicycle(parent, x, z, rot, color, basket = true) {
  const g = new THREE.Group();
  const frame = toon(color);
  const metal = toon(0xb8bec9);
  const blk = toon(0x22232b);
  const R = 0.32;
  const wheelGeo = new THREE.TorusGeometry(R, 0.025, 6, 28);
  const spokeGeo = new THREE.TorusGeometry(R * 0.55, 0.006, 4, 16);
  for (const wx of [-0.55, 0.55]) {
    const w = new THREE.Mesh(wheelGeo, blk);
    w.position.set(wx, R + 0.02, 0);
    g.add(w);
    const s = new THREE.Mesh(spokeGeo, metal);
    s.position.copy(w.position);
    g.add(s);
    cyl(g, 0.03, 0.03, 0.06, metal, wx, R - 0.01, 0, 8).rotation.x = Math.PI / 2;
  }
  const V = (a, b, c) => new THREE.Vector3(a, b, c);
  const seg = (a, b, r = 0.022, m = frame) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), m);
    c.position.copy(a).addScaledVector(d, 0.5);
    c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    g.add(c);
  };
  const hub = V(-0.55, R + 0.02, 0);
  const fhub = V(0.55, R + 0.02, 0);
  const bb = V(-0.05, 0.3, 0);
  const seatTop = V(-0.22, 0.82, 0);
  const head = V(0.38, 0.85, 0);
  const headLow = V(0.42, 0.7, 0);
  tube(g, [V(-0.18, 0.72, 0), V(0.0, 0.42, 0), V(0.3, 0.48, 0), headLow], 0.026, frame, 12);
  seg(bb, seatTop);
  seg(bb, hub, 0.016);
  seg(seatTop, hub, 0.016);
  seg(headLow, fhub, 0.02, metal);
  seg(headLow, V(0.36, 1.0, 0), 0.02, metal);
  tube(g, [V(0.22, 1.02, -0.26), V(0.34, 1.04, -0.2), V(0.36, 1.0, 0), V(0.34, 1.04, 0.2), V(0.22, 1.02, 0.26)], 0.016, metal, 12);
  boxC(g, 0.22, 0.05, 0.12, blk, -0.24, 0.86, 0);
  tube(g, [V(-0.9, 0.62, 0), V(-0.55, 0.68, 0), V(-0.2, 0.62, 0)], 0.04, frame, 8).scale.z = 1;
  boxC(g, 0.36, 0.03, 0.22, metal, -0.6, 0.66, 0);
  if (basket) {
    const bm = toon(0xc9ced8);
    const b = new THREE.Group();
    boxC(b, 0.3, 0.01, 0.34, bm, 0, 0, 0);
    for (const [sx, sz, w, d] of [[0.15, 0, 0.01, 0.34], [-0.15, 0, 0.01, 0.34], [0, 0.17, 0.3, 0.01], [0, -0.17, 0.3, 0.01]]) boxC(b, w, 0.22, d, bm, sx, 0.11, sz);
    b.position.set(0.58, 0.92, 0);
    g.add(b);
  }
  tube(g, [V(-0.86, 0.36, 0.03), V(-0.6, 0.62, 0.03), V(-0.3, 0.36, 0.03)], 0.012, frame, 8);
  cyl(g, 0.04, 0.04, 0.03, glow(0xff5040, 1.6), -0.92, 0.6, 0, 8).rotation.z = Math.PI / 2;
  seg(V(-0.1, 0.3, 0.05), V(-0.25, 0.02, 0.18), 0.012, metal);
  g.position.set(x, SIDEWALK_H, z);
  g.rotation.set(0, rot, 0.06);
  parent.add(g);
  return g;
}

function guardrail(parent, a, b, n) {
  const white = toon(0xf0efe9);
  const d = new THREE.Vector3().subVectors(b, a);
  const L = d.length();
  const ang = Math.atan2(-d.z, d.x);
  for (let i = 0; i <= n; i++) {
    const p = new THREE.Vector3().lerpVectors(a, b, i / n);
    cyl(parent, 0.035, 0.035, 0.8, white, p.x, p.y, p.z, 8);
    cyl(parent, 0.045, 0.045, 0.04, white, p.x, p.y + 0.8, p.z, 8);
  }
  for (const h of [0.45, 0.75]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L, 8), white);
    m.position.set((a.x + b.x) / 2, a.y + h, (a.z + b.z) / 2);
    m.rotation.set(0, ang, Math.PI / 2);
    parent.add(m);
  }
}

function buildProps(root) {
  const g = new THREE.Group();
  root.add(g);
  const lights = [];
  const glows = [];

  const v1 = vending(g, 3.62, -5.05, Math.PI / 2, '#e94f4f', '#c22e2e', 1);
  const v2 = vending(g, 3.62, -4.0, Math.PI / 2, '#f4f6fa', '#2f6fd6', 2);
  glows.push(v1.face, v2.face);
  const vl = new THREE.PointLight(0xdff0ff, 2.2, 4, 1.5);
  vl.position.set(4.5, 1.2, -4.5);
  g.add(vl);
  lights.push(vl);

  const binBlue = toon(0x3a78c9);
  const binTop = toon(0xe9ecf2);
  for (const [z, label] of [[-3.15, 'かん'], [-2.75, 'ペット']]) {
    rbox(g, 0.36, 0.72, 0.36, 0.03, binBlue, 3.45, SIDEWALK_H, z);
    cyl(g, 0.19, 0.19, 0.06, binTop, 3.45, SIDEWALK_H + 0.72, z, 16);
    cyl(g, 0.07, 0.07, 0.01, toon(0x1a1c26), 3.45, SIDEWALK_H + 0.78, z, 12);
  }

  const binMats = [toon(0x6cc58a), toon(0x4f9be0), toon(0xf2a03d)];
  const labels = ['もえる', 'ペット', 'かん'];
  binMats.forEach((m, i) => {
    const bx = 2.6 + i * 0.26;
    const bz = 1.68;
    rbox(g, 0.24, 0.85, 0.36, 0.02, toon(0xdcd8cf), bx, 0.2, bz);
    boxC(g, 0.2, 0.12, 0.02, m, bx, 0.2 + 0.72, bz + 0.18);
    boxC(g, 0.1, 0.05, 0.01, toon(0x1a1c26), bx, 0.2 + 0.55, bz + 0.185);
    const t = canvasTexture(96, 48, (c, w, h) => {
      c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#222'; c.font = `800 24px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(labels[i], w / 2, h / 2 + 1);
    });
    plane(g, 0.18, 0.09, toon(0xffffff, { map: t }), bx, 0.2 + 0.36, bz + 0.185);
  });

  {
    const sx = 0.12, sz = 1.85;
    const sm = toon(0x9aa3b4);
    box(g, 0.5, 0.05, 0.3, sm, sx, 0.2, sz);
    box(g, 0.5, 0.03, 0.3, sm, sx, 0.75, sz);
    for (const ox of [-0.24, 0.24]) for (const oz of [-0.14, 0.14]) box(g, 0.025, 0.58, 0.025, sm, sx + ox, 0.2, sz + oz);
    const colors = [0xe8f4ff, 0x2f4fa8, 0xe94f4f, 0xe8f4ff];
    colors.forEach((col, i) => {
      const u = new THREE.Group();
      const clear = col === 0xe8f4ff;
      const mat = clear ? new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.5 }) : toon(col);
      cyl(u, 0.01, 0.01, 0.95, toon(0x9aa0ae), 0, 0, 0, 5);
      cyl(u, 0.025, 0.065, 0.6, mat, 0, 0.25, 0, 8);
      const hdl = tube(u, [new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0, 1.02, 0), new THREE.Vector3(0.05, 1.03, 0), new THREE.Vector3(0.07, 0.98, 0)], 0.012, toon(0x6b4a32), 8);
      u.position.set(sx - 0.18 + i * 0.12, 0.22, sz + (i % 2 ? 0.05 : -0.05));
      u.rotation.set((i % 2 ? 1 : -1) * 0.12, i, 0.08 * (i - 1.5));
      g.add(u);
      void hdl;
    });
  }

  bicycle(g, 4.35, -1.55, -Math.PI / 2 + 0.08, 0x9fd3c7);
  bicycle(g, 4.45, 0.35, -Math.PI / 2 - 0.05, 0xf08aa0);

  guardrail(g, new THREE.Vector3(-9.7, SIDEWALK_H, 4.72), new THREE.Vector3(-5.4, SIDEWALK_H, 4.72), 4);
  guardrail(g, new THREE.Vector3(4.72, SIDEWALK_H, -9.7), new THREE.Vector3(4.72, SIDEWALK_H, -6.2), 3);

  {
    const pole = toon(P.pole);
    cyl(g, 0.04, 0.04, 2.6, pole, 4.62, SIDEWALK_H, 1.05, 10);
    const tri = canvasTexture(256, 230, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(4, 4); c.lineTo(w - 4, 4); c.lineTo(w / 2, h - 4); c.closePath(); c.fill();
      c.fillStyle = '#d9443f';
      c.beginPath(); c.moveTo(22, 16); c.lineTo(w - 22, 16); c.lineTo(w / 2, h - 30); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.font = `900 50px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('止まれ', w / 2, 76);
    });
    const triMat = toon(0xffffff, { map: tri, transparent: true, side: THREE.DoubleSide });
    triMat.alphaTest = 0.5;
    plane(g, 0.7, 0.63, triMat, 4.62, SIDEWALK_H + 2.3, 1.0, Math.PI);
    const cw = canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2f6fd6'; c.fillRect(10, 10, w - 20, h - 20);
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(w / 2, 34); c.lineTo(w - 36, h - 60); c.lineTo(36, h - 60); c.closePath(); c.fill();
      c.fillStyle = '#222';
      c.beginPath(); c.arc(w / 2 + 6, 98, 12, 0, 7); c.fill();
      c.lineWidth = 10; c.strokeStyle = '#222'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(w / 2 + 2, 114); c.lineTo(w / 2 - 6, 150); c.lineTo(w / 2 - 22, 176); c.moveTo(w / 2 - 6, 150); c.lineTo(w / 2 + 14, 178); c.moveTo(w / 2 - 20, 128); c.lineTo(w / 2 + 20, 140); c.stroke();
      c.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) c.fillRect(46 + i * 34, h - 50, 20, 26);
    });
    const cwMat = toon(0xffffff, { map: cw });
    boxC(g, 0.62, 0.62, 0.03, toon(0x9aa3b4), 4.62, SIDEWALK_H + 1.7, 1.05);
    plane(g, 0.6, 0.6, cwMat, 4.62, SIDEWALK_H + 1.7, 1.05 - 0.017, Math.PI);
    plane(g, 0.6, 0.6, cwMat, 4.62, SIDEWALK_H + 1.7, 1.05 + 0.017, 0);
  }

  return { group: g, lights, glows };
}

export const block = {
  name: 'props',
  build: (world) => {
    const handles = buildProps(world);
    const flicker = createFlicker(handles.glows, { seed: 4, amp: 0.04, blinkChance: 0.04 });
    return {
      ...handles,
      update(dt, elapsed) {
        flicker.update(elapsed);
      },
    };
  },
};

export { buildProps };
