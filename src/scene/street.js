// scene/street.js
import * as THREE from '../../vendor/three.module.js';
import { toon, P, canvasTexture, JP_FONT } from '../toon/materials.js';
import { box, boxC, cyl, rng } from '../utils/geo.js';
import { HALF, SIDEWALKS, SIDEWALK_H, PUDDLES, ROAD_EDGE } from './layout.js';

const RES = 2048;
const px = (v) => ((v + HALF) / (HALF * 2)) * RES;
const len = (v) => (v / (HALF * 2)) * RES;

function drawPuddleShape(c, rand, [x, z, rx, rz], grow = 1) {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.6;
    const ox = Math.cos(a) * rx * 0.45;
    const oz = Math.sin(a) * rz * 0.45;
    c.beginPath();
    c.ellipse(px(x + ox), px(z + oz), len(rx * (0.55 + rand() * 0.25) * grow), len(rz * (0.55 + rand() * 0.25) * grow), rand() * Math.PI, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.ellipse(px(x), px(z), len(rx * 0.75 * grow), len(rz * 0.75 * grow), 0, 0, Math.PI * 2);
  c.fill();
}

function groundTexture() {
  return canvasTexture(RES, RES, (c) => {
    const r = rng(7);
    c.fillStyle = '#3f4459';
    c.fillRect(0, 0, RES, RES);

    c.fillStyle = '#353a4e';
    c.fillRect(0, px(ROAD_EDGE), RES, RES);
    c.fillRect(px(ROAD_EDGE), 0, RES, RES);

    c.fillStyle = '#4a4e62';
    c.fillRect(px(-5), px(1.5), len(10), len(3.5));

    c.fillStyle = '#676b7f';
    c.fillRect(px(-7.6), 0, len(2.6), px(1.5));
    c.fillRect(px(-5), px(1.5), len(8.2), len(0.95));
    c.strokeStyle = 'rgba(40,42,58,0.6)';
    c.lineWidth = 3;
    for (let z = 0.2; z < 1.5; z += 0.4) {
      c.beginPath();
      c.moveTo(px(-7.6), px(z));
      c.lineTo(px(-5), px(z));
      c.stroke();
    }
    for (let x = -5; x < 3.2; x += 1.05) {
      c.beginPath();
      c.moveTo(px(x), px(1.5));
      c.lineTo(px(x), px(2.45));
      c.stroke();
    }
    c.beginPath();
    c.moveTo(px(-5), px(1.98));
    c.lineTo(px(3.2), px(1.98));
    c.stroke();

    for (let i = 0; i < 26000; i++) {
      const x = r() * RES;
      const y = r() * RES;
      const v = r();
      c.fillStyle = v < 0.62 ? 'rgba(20,22,35,0.3)' : 'rgba(120,126,150,0.1)';
      c.fillRect(x, y, 2 + r() * 2, 2 + r() * 2);
    }

    c.fillStyle = '#7a7e90';
    c.fillRect(0, px(ROAD_EDGE), px(ROAD_EDGE + 0.35), len(0.35));
    c.fillRect(px(ROAD_EDGE), 0, len(0.35), px(ROAD_EDGE + 0.35));
    c.strokeStyle = 'rgba(30,32,45,0.7)';
    c.lineWidth = 2;
    for (let x = -10; x < 5; x += 0.5) {
      c.beginPath();
      c.moveTo(px(x), px(5));
      c.lineTo(px(x), px(5.35));
      c.stroke();
    }
    for (let z = -10; z < 5; z += 0.5) {
      c.beginPath();
      c.moveTo(px(5), px(z));
      c.lineTo(px(5.35), px(z));
      c.stroke();
    }

    const white = '#e9e9ef';
    c.fillStyle = white;
    c.fillRect(0, px(5.55), px(1.2), len(0.12));
    c.fillRect(px(3.8), px(5.55), len(1.75), len(0.12));
    c.fillRect(0, px(9.6), px(5.6), len(0.12));
    c.fillRect(px(5.55), 0, len(0.12), px(1.0));
    c.fillRect(px(9.6), 0, len(0.12), px(5.6));

    for (let z = 5.75; z < 9.5; z += 0.6) c.fillRect(px(1.5), px(z), len(2.1), len(0.32));
    for (let x = 5.75; x < 9.5; x += 0.6) c.fillRect(px(x), px(1.3), len(0.32), len(2.1));

    c.fillRect(px(5.7), px(0.75), len(1.85), len(0.22));
    c.fillRect(px(0.75), px(5.7), len(0.22), len(1.85));

    c.save();
    c.translate(px(6.65), px(-1.6));
    c.rotate(Math.PI);
    c.scale(1, 2.2);
    c.font = `900 ${len(0.95)}px ${JP_FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('止まれ', 0, 0);
    c.restore();

    c.save();
    c.translate(px(6.65), px(-5.6));
    c.lineWidth = len(0.1);
    c.strokeStyle = white;
    c.beginPath();
    c.moveTo(0, -len(0.9));
    c.lineTo(len(0.45), 0);
    c.lineTo(0, len(0.9));
    c.lineTo(-len(0.45), 0);
    c.closePath();
    c.stroke();
    c.restore();

    for (const x of [-4.8, -2.7, -0.6]) c.fillRect(px(x) - len(0.05), px(2.0), len(0.1), len(2.7));
    c.fillRect(px(-4.8), px(4.65), len(4.2), len(0.1));

    c.fillStyle = 'rgba(242,200,75,0.9)';
    for (let i = 0; i < 6; i++) {
      c.save();
      c.translate(px(0.6 + i * 0.4), px(4.4));
      c.rotate(-0.6);
      c.fillRect(-len(0.04), -len(0.3), len(0.08), len(0.6));
      c.restore();
    }

    const pr = rng(3);
    c.fillStyle = 'rgba(18,20,34,0.55)';
    for (const p of PUDDLES) drawPuddleShape(c, pr, p, 1.15);
    const pr2 = rng(3);
    c.fillStyle = 'rgba(14,16,30,0.6)';
    for (const p of PUDDLES) drawPuddleShape(c, pr2, p, 0.95);

    c.strokeStyle = 'rgba(20,22,35,0.35)';
    c.lineWidth = len(0.22);
    for (const off of [-0.6, 0.6]) {
      c.beginPath();
      c.moveTo(0, px(7.5 + off));
      c.lineTo(RES, px(7.5 + off));
      c.stroke();
      c.beginPath();
      c.moveTo(px(7.5 + off), 0);
      c.lineTo(px(7.5 + off), RES);
      c.stroke();
    }
  });
}

function puddleMask() {
  return canvasTexture(512, 512, (c, w) => {
    const s = w / RES;
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, w);
    c.scale(s, s);
    c.fillStyle = 'rgb(55,55,55)';
    c.fillRect(0, 0, RES, RES);
    c.fillStyle = 'rgb(75,75,75)';
    c.fillRect(0, px(ROAD_EDGE), RES, RES);
    c.fillRect(px(ROAD_EDGE), 0, RES, RES);
    c.filter = 'blur(10px)';
    const pr = rng(3);
    c.fillStyle = 'rgb(255,255,255)';
    for (const p of PUDDLES) drawPuddleShape(c, pr, p, 1.15);
    c.filter = 'none';
  });
}

function buildStreet(root) {
  const g = new THREE.Group();
  root.add(g);

  const tex = groundTexture();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2), toon(0xffffff, { map: tex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.001;
  ground.receiveShadow = true;
  g.add(ground);

  const tile = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#9b9fb0';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#6f7386';
    c.lineWidth = 4;
    for (let i = 0; i <= 4; i++) {
      c.beginPath();
      c.moveTo(0, (i * h) / 4);
      c.lineTo(w, (i * h) / 4);
      c.stroke();
      c.beginPath();
      c.moveTo((i * w) / 4, 0);
      c.lineTo((i * w) / 4, h);
      c.stroke();
    }
  });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping;

  const curbMat = toon(P.curb);
  for (const s of SIDEWALKS) {
    const w = s.x1 - s.x0;
    const d = s.z1 - s.z0;
    const t = tile.clone();
    t.repeat.set(w / 1.6, d / 1.6);
    t.needsUpdate = true;
    const topMat = toon(0xffffff, { map: t });
    const side = toon(P.concreteDark);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, SIDEWALK_H, d), [side, side, topMat, side, side, side]);
    m.position.set((s.x0 + s.x1) / 2, SIDEWALK_H / 2, (s.z0 + s.z1) / 2);
    g.add(m);
  }
  box(g, 0.18, SIDEWALK_H + 0.02, 11.5, curbMat, 4.91, 0, -4.25);
  box(g, 5, SIDEWALK_H + 0.02, 0.18, curbMat, -7.5, 0, 4.91);
  box(g, 0.18, SIDEWALK_H + 0.02, 3.5, curbMat, -5.09, 0, 3.25);

  const grateMat = toon(0x2c2f3d);
  const grateFrame = toon(0x5a5e70);
  const grate = (x, z, rot) => {
    const gg = new THREE.Group();
    boxC(gg, 0.34, 0.03, 0.6, grateFrame, 0, 0.015, 0);
    for (let i = -3; i <= 3; i++) boxC(gg, 0.04, 0.035, 0.52, grateMat, i * 0.042, 0.02, 0);
    gg.position.set(x, 0, z);
    gg.rotation.y = rot;
    g.add(gg);
  };
  for (const x of [-8.5, -4.2, -0.2, 3.6]) grate(x, 5.17, Math.PI / 2);
  for (const z of [-8.2, -4.6, -1.0, 2.8]) grate(5.17, z, 0);

  const stopMat = toon(0xe8e6e0);
  for (const x of [-3.75, -1.65]) {
    const s = box(g, 0.9, 0.1, 0.16, stopMat, x, 0, 2.15);
    s.castShadow = true;
  }

  const manTex = canvasTexture(256, 256, (c, w) => {
    c.fillStyle = '#4a4e5e';
    c.beginPath();
    c.arc(w / 2, w / 2, w / 2 - 2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2b2e3b';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(w / 2, w / 2, w / 2 - 10, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.arc(w / 2, w / 2, 18 + i * 17, 0, Math.PI * 2);
      c.stroke();
    }
  });
  const man = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), toon(0xffffff, { map: manTex, transparent: true }));
  man.rotation.x = -Math.PI / 2;
  man.position.set(7.4, 0.006, -3.9);
  g.add(man);

  return g;
}

export const block = {
  name: 'street',
  build: (world) => {
    const group = buildStreet(world);
    return { group, mask: puddleMask() };
  },
};

export { puddleMask, buildStreet };
