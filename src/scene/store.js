// scene/store.js
import * as THREE from '../../vendor/three.module.js';
import { toon, glow, P, canvasTexture, JP_FONT } from '../toon/materials.js';
import { box, boxC, cyl, plane, rbox } from '../utils/geo.js';
import { createGlassMaterial } from '../fx/glass.js';
import { createFlicker, createDoor } from '../fx/anim.js';
import { STORE } from './layout.js';

function drawStar(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}

function signTexture(len) {
  const w = Math.round(256 * len);
  return canvasTexture(w, 256, (c, W, H) => {
    c.fillStyle = '#fbfaf5';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#2f6fd6';
    c.fillRect(0, H * 0.72, W, H * 0.28);
    c.fillStyle = '#2fb36b';
    c.fillRect(0, H * 0.66, W, H * 0.06);
    c.fillStyle = '#f08a3c';
    c.fillRect(0, H * 0.6, W, H * 0.06);
    const reps = Math.max(1, Math.round(len / 9));
    for (let k = 0; k < reps; k++) {
      const cx = (W / reps) * (k + 0.5);
      c.fillStyle = '#2f6fd6';
      c.beginPath();
      c.arc(cx - 330, H * 0.3, 62, 0, Math.PI * 2);
      c.fill();
      drawStar(c, cx - 330, H * 0.31, 44, '#ffd84a');
      c.fillStyle = '#1f4fa8';
      c.font = `900 120px ${JP_FONT}`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText('ほしマート', cx - 245, H * 0.31);
      c.fillStyle = '#ffffff';
      c.font = `800 46px ${JP_FONT}`;
      c.textAlign = 'center';
      c.fillText('HOSHI MART  ·  24 HOURS', cx, H * 0.86);
    }
  });
}

function posterTex(draw) {
  return canvasTexture(256, 360, draw);
}

function buildStore(root) {
  const g = new THREE.Group();
  root.add(g);
  const { x0, x1, z0, z1, floor, height } = STORE;
  const W = x1 - x0;
  const D = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;

  const wall = toon(P.wall);
  const wallShade = toon(P.wallShade);
  const frame = toon(0x3b4050);
  const kick = toon(0x4a5064);
  const glass = createGlassMaterial({ drops: 1, opacity: 0.08 });
  const doorGlass = createGlassMaterial({ drops: 0.25, opacity: 0.07 });
  const glassMats = [glass, doorGlass];
  const noOutline = [];

  box(g, W + 0.3, floor, D + 0.3, toon(0x8f93a3), cx, 0, cz);
  box(g, W + 0.1, floor, 0.95, toon(0xa4a8b6), cx, 0, z1 + 0.47);
  box(g, 0.1, 0.02, 0.95, toon(0xf2c84b), 0.45, floor, z1 + 0.47);
  box(g, 0.1, 0.02, 0.95, toon(0xf2c84b), 2.45, floor, z1 + 0.47);

  const T = 0.15;
  box(g, W, height, T, wall, cx, 0, z0 + T / 2);
  box(g, T, height, D, wallShade, x0 + T / 2, 0, cz);
  box(g, 0.3, height, T, wall, x0 + 0.15, 0, z1 - T / 2);
  box(g, 0.7, height, T, wall, 2.85, 0, z1 - T / 2);
  box(g, T, height, 0.7, wallShade, x1 - T / 2, 0, 1.15);
  box(g, T, height, 3.3, wallShade, x1 - T / 2, 0, -4.35);

  const glassPane = (w, h, x, y, z, ry) => {
    const m = plane(g, w, h, glass, x, y, z, ry);
    noOutline.push(m);
    return m;
  };

  box(g, 5.1, 0.25, T, kick, -2.15, floor, z1 - T / 2);
  box(g, 5.1, 0.12, 0.2, frame, -2.15, 2.6, z1 - T / 2);
  box(g, 5.1, 0.06, 0.2, frame, -2.15, floor + 0.25, z1 - T / 2);
  for (const x of [-4.7, -2.95, -1.25, 0.4]) box(g, 0.08, 2.5, 0.2, frame, x, floor, z1 - T / 2);
  glassPane(5.1, 2.15, -2.15, floor + 0.25 + 1.075, z1 - 0.04, 0);

  box(g, T, 0.25, 3.5, kick, x1 - T / 2, floor, -0.95);
  box(g, 0.2, 0.12, 3.5, frame, x1 - T / 2, 2.6, -0.95);
  box(g, 0.2, 0.06, 3.5, frame, x1 - T / 2, floor + 0.25, -0.95);
  for (const z of [-2.7, -0.95, 0.8]) box(g, 0.2, 2.5, 0.08, frame, x1 - T / 2, floor, z);
  glassPane(3.5, 2.15, x1 - 0.04, floor + 0.25 + 1.075, -0.95, Math.PI / 2);

  box(g, 5.1, height - 2.72, T, wall, -2.15, 2.72, z1 - T / 2);
  box(g, T, height - 2.72, 3.5, wallShade, x1 - T / 2, 2.72, -0.95);

  box(g, 2.1, height - 2.45, T, wall, 1.45, 2.45, z1 - T / 2);
  box(g, 2.1, 0.12, 0.24, frame, 1.45, 2.38, z1 - 0.05);
  for (const x of [0.43, 2.47]) box(g, 0.08, 2.3, 0.24, frame, x, floor, z1 - 0.05);
  box(g, 2.1, 0.04, 0.24, toon(0x9aa0ae), 1.45, floor, z1 - 0.05);
  const sensor = box(g, 0.36, 0.08, 0.12, toon(0x2b2f3c), 1.45, 2.28, z1 + 0.12);
  const sensorLed = boxC(g, 0.04, 0.02, 0.01, glow(0xff4040, 3), 1.6, 2.32, z1 + 0.185);

  const door = { panels: [], closed: [], open: [] };
  const doorSticker = canvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = 'rgba(255,255,255,0)';
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.fillRect(0, 34, w, 60);
    c.fillStyle = '#2f6fd6';
    c.font = `800 38px ${JP_FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('自動ドア', w / 2, 64);
  });
  const stickerMat = toon(0xffffff, { map: doorSticker, transparent: true });
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Group();
    const pw = 1.0;
    boxC(p, pw, 0.06, 0.05, frame, 0, 0.03, 0);
    boxC(p, pw, 0.06, 0.05, frame, 0, 2.15, 0);
    boxC(p, 0.05, 2.18, 0.05, frame, -pw / 2 + 0.025, 1.09, 0);
    boxC(p, 0.05, 2.18, 0.05, frame, pw / 2 - 0.025, 1.09, 0);
    const gl = plane(p, pw - 0.06, 2.1, doorGlass, 0, 1.09, 0);
    noOutline.push(gl);
    const st = plane(p, 0.5, 0.25, stickerMat, 0, 1.2, 0.03);
    noOutline.push(st);
    const x = 0.95 + i * 1.0;
    p.position.set(x, floor, z1 + 0.1);
    g.add(p);
    door.panels.push(p);
    door.closed.push(x);
    door.open.push(i === 0 ? -1.0 : 0.0);
  }

  const ceil = plane(g, W - 0.3, D - 0.3, toon(0xf6f3ea, { side: THREE.DoubleSide }), cx, STORE.ceil, cz, 0, Math.PI / 2);
  ceil.userData.noShadowCast = true;

  const roofY = height;
  box(g, W + 0.2, 0.15, D + 0.2, toon(P.roof), cx, roofY, cz);
  const para = toon(0xd6d1c6);
  box(g, W + 0.3, 0.4, 0.15, para, cx, roofY, z0 - 0.02);
  box(g, 0.15, 0.4, D + 0.3, para, x0 - 0.02, roofY, cz);
  const ru = toon(0xbfc4cf);
  const ruDark = toon(0x5d6274);
  for (const [x, z] of [[-3.3, -4.6], [-1.7, -4.6]]) {
    rbox(g, 1.1, 0.7, 0.7, 0.05, ru, x, roofY + 0.15, z);
    cyl(g, 0.24, 0.24, 0.02, ruDark, x - 0.15, roofY + 0.85, z).rotation.x = 0;
  }
  box(g, 0.9, 0.5, 0.9, toon(0x9ea4b2), 1.6, roofY + 0.15, -4.4);
  for (let i = 0; i < 4; i++) box(g, 0.06, 0.06, 1.9, ruDark, 1.0 - i * 0.18, roofY + 0.15, -2.8);

  const sLenF = W + 0.3;
  const sLenS = 3.6 + 0.6;
  const signMatF = glow(0xffffff, 0.9, { map: signTexture(sLenF) });
  const signMatS = glow(0xffffff, 0.9, { map: signTexture(sLenS) });
  const signBody = toon(0x2a3a6a);
  const signF = new THREE.Mesh(new THREE.BoxGeometry(sLenF, 0.8, 0.22), [signBody, signBody, signBody, signBody, signMatF, signBody]);
  signF.position.set(cx + 0.05, 3.2, z1 + 0.08);
  g.add(signF);
  const signS = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, sLenS), [signMatS, signBody, signBody, signBody, signBody, signBody]);
  signS.position.set(x1 + 0.08, 3.2, -1.0);
  g.add(signS);

  const awning = toon(0xe4e1da);
  const awnFascia = toon(P.brandBlue);
  box(g, W + 0.2, 0.08, 0.95, awning, cx, 2.7, z1 + 0.47);
  box(g, W + 0.2, 0.14, 0.05, awnFascia, cx, 2.66, z1 + 0.95);
  box(g, 0.85, 0.08, 5.25, awning, x1 + 0.42, 2.7, -0.18);
  box(g, 0.05, 0.14, 5.25, awnFascia, x1 + 0.85, 2.66, -0.18);
  const lampMat = glow(0xfff1cf, 1.4);
  for (let x = -4.4; x < 3.2; x += 1.25) cyl(g, 0.07, 0.07, 0.01, lampMat, x, 2.69, z1 + 0.5, 12);
  for (let z = -2.4; z < 2.2; z += 1.25) cyl(g, 0.07, 0.07, 0.01, lampMat, x1 + 0.42, 2.69, z, 12);

  const posters = [
    posterTex((c, w, h) => {
      c.fillStyle = '#fff6dc'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#d9443f'; c.fillRect(0, 0, w, 90);
      c.fillStyle = '#fff'; c.font = `900 64px ${JP_FONT}`; c.textAlign = 'center'; c.fillText('おでん', w / 2, 68);
      c.fillStyle = '#c47a2c';
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(80 + i * 48, 170 + i * 30, 34, 0, 7); c.fill(); }
      c.fillStyle = '#d9443f'; c.font = `900 70px ${JP_FONT}`; c.fillText('70円', w / 2, 320);
    }),
    posterTex((c, w, h) => {
      c.fillStyle = '#2f6fd6'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffd84a'; c.font = `900 56px ${JP_FONT}`; c.textAlign = 'center'; c.fillText('新発売', w / 2, 70);
      c.fillStyle = '#fff'; c.fillRect(70, 110, 116, 170);
      c.fillStyle = '#f08a3c'; c.fillRect(70, 150, 116, 50);
      c.fillStyle = '#fff'; c.font = `800 34px ${JP_FONT}`; c.fillText('ミルクティー', w / 2, 330);
    }),
    posterTex((c, w, h) => {
      c.fillStyle = '#fef1f4'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e8708f'; c.font = `900 50px ${JP_FONT}`; c.textAlign = 'center'; c.fillText('いちご', w / 2, 70); c.fillText('フェア', w / 2, 128);
      c.fillStyle = '#e04050'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(50 + i * 40, 220 + (i % 2) * 30, 24, 0, 7); c.fill(); }
      c.fillStyle = '#2fb36b'; c.fillRect(0, 300, w, 60);
    }),
    posterTex((c, w, h) => {
      c.fillStyle = '#1d2a52'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; c.font = `900 80px ${JP_FONT}`; c.textAlign = 'center'; c.fillText('ATM', w / 2, 110);
      c.font = `700 30px ${JP_FONT}`; c.fillText('24時間', w / 2, 170); c.fillText('ご利用いただけます', w / 2, 215);
      c.fillStyle = '#ffd84a'; c.fillRect(30, 260, w - 60, 8);
    }),
  ];
  const pMat = posters.map((t) => toon(0xffffff, { map: t }));
  const addPoster = (i, x, y, z, ry) => {
    const m = plane(g, 0.42, 0.59, pMat[i], x, y, z, ry);
    noOutline.push(m);
  };
  addPoster(0, -4.3, 0.85, z1 + 0.005, 0);
  addPoster(1, -3.75, 0.85, z1 + 0.005, 0);
  addPoster(2, -0.0, 0.85, z1 + 0.005, 0);
  addPoster(3, x1 + 0.005, 0.85, 0.45, Math.PI / 2);

  const mat = canvasTexture(512, 256, (c, w, h) => {
    c.fillStyle = '#2b3550'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#4a5878'; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = '#c9d4ec'; c.font = `800 64px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('いらっしゃいませ', w / 2, h / 2);
  });
  const matSide = toon(0x2b3550);
  const matMesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.025, 0.8), [matSide, matSide, toon(0xffffff, { map: mat }), matSide, matSide, matSide]);
  matMesh.position.set(1.45, floor + 0.0125, z1 + 0.45);
  g.add(matMesh);

  const ps = new THREE.Group();
  g.add(ps);
  cyl(ps, 0.1, 0.12, 5.0, toon(P.metal), -4.8, 0, 4.72, 12);
  boxC(ps, 1.5, 1.05, 0.34, signBody, -4.8, 5.1, 4.72);
  const poleSign = canvasTexture(384, 270, (c, w, h) => {
    c.fillStyle = '#fbfaf5'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2f6fd6'; c.fillRect(0, h * 0.7, w, h * 0.3);
    c.fillStyle = '#2fb36b'; c.fillRect(0, h * 0.64, w, h * 0.06);
    c.fillStyle = '#f08a3c'; c.fillRect(0, h * 0.58, w, h * 0.06);
    c.fillStyle = '#2f6fd6'; c.beginPath(); c.arc(w / 2, h * 0.3, 62, 0, 7); c.fill();
    drawStar(c, w / 2, h * 0.31, 44, '#ffd84a');
    c.fillStyle = '#fff'; c.font = `900 52px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('ほしマート', w / 2, h * 0.85);
  });
  const psMat = glow(0xffffff, 1.0, { map: poleSign });
  const psFaceF = plane(ps, 1.4, 0.95, psMat, -4.8, 5.1, 4.72 + 0.175, 0);
  const psFaceB = plane(ps, 1.4, 0.95, psMat, -4.8, 5.1, 4.72 - 0.175, Math.PI);
  boxC(ps, 1.1, 0.42, 0.24, signBody, -4.8, 4.25, 4.72);
  const pTex = canvasTexture(256, 96, (c, w, h) => {
    c.fillStyle = '#1f4fa8'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff'; c.font = `900 60px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('P  24h', w / 2, h / 2 + 3);
  });
  const pMat2 = glow(0xffffff, 0.9, { map: pTex });
  plane(ps, 1.0, 0.36, pMat2, -4.8, 4.25, 4.72 + 0.125, 0);
  plane(ps, 1.0, 0.36, pMat2, -4.8, 4.25, 4.72 - 0.125, Math.PI);

  const backDoor = toon(0x6d7488);
  box(g, 0.95, 2.1, 0.06, backDoor, 2.2, floor, z0 - 0.03);
  box(g, 0.3, 0.12, 0.2, toon(0x3b4050), 2.2, 2.45, z0 - 0.1);
  boxC(g, 0.18, 0.04, 0.1, glow(0xfff1cf, 3), 2.2, 2.42, z0 - 0.14);
  box(g, 0.5, 0.7, 0.2, toon(0xb8bdc8), 0.8, 1.0, z0 - 0.1);
  for (let i = 0; i < 3; i++) cyl(g, 0.03, 0.03, 0.9, toon(0x7d8394), 0.6 + i * 0.2, 0.1, z0 - 0.25, 8);

  return {
    group: g,
    door,
    glassMats,
    noOutline,
    signs: [signMatF, signMatS],
    poleSign: [psMat, pMat2],
    awningLamps: lampMat,
    sensorLed,
  };
}

export const block = {
  name: 'store',
  build: (world) => {
    const handles = buildStore(world);
    const flickers = [
      createFlicker(handles.signs, { seed: 1, amp: 0.05, blinkChance: 0.08 }),
      createFlicker(handles.poleSign, { seed: 2, amp: 0.07, blinkChance: 0.05 }),
    ];
    const doorAnim = createDoor(handles.door, {
      closed: handles.door.closed,
      open: handles.door.open,
      floorY: 0.2,
      zClosed: 1.5,
      zOpen: 1.6,
    });
    return {
      ...handles,
      update(dt, elapsed) {
        for (const f of flickers) f.update(elapsed);
        const doorOpen = doorAnim.update(elapsed, dt);
        handles.sensorLed.material.color.set(
          doorOpen ? (Math.sin(elapsed * 12) > 0 ? 0xff2a2a : 0x3a0808) : 0x601515,
        );
      },
    };
  },
};

export { signTexture, buildStore };
