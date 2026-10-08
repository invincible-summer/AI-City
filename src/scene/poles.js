// scene/poles.js
import * as THREE from '../../vendor/three.module.js';
import { toon, glow, P, canvasTexture, JP_FONT } from '../toon/materials.js';
import { boxC, cyl, sagWire, tube } from '../utils/geo.js';
import { createSignal } from '../fx/anim.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

let stripeTex;
function stripes() {
  if (stripeTex) return stripeTex;
  stripeTex = canvasTexture(64, 256, (c, w, h) => {
    c.fillStyle = '#f2c84b';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#22232b';
    for (let i = -2; i < 10; i++) {
      c.beginPath();
      c.moveTo(0, i * 40);
      c.lineTo(w, i * 40 - 30);
      c.lineTo(w, i * 40 - 10);
      c.lineTo(0, i * 40 + 20);
      c.fill();
    }
  });
  return stripeTex;
}

function utilityPole(parent, x, z, h, armRot, opts = {}) {
  const g = new THREE.Group();
  const conc = toon(0xb3b5bc);
  cyl(g, 0.11, 0.15, h, conc, 0, 0, 0, 14);
  cyl(g, 0.156, 0.156, 1.6, toon(0xffffff, { map: stripes() }), 0, 0.1, 0, 14);
  const arm = toon(0x6b6f7c);
  const ins = toon(0xe9e6de);
  const tops = [];
  for (const [y, w] of [[h - 0.35, 1.6], [h - 0.95, 1.2]]) {
    const a = boxC(g, w, 0.08, 0.08, arm, 0, y, 0);
    for (let i = -1; i <= 1; i++) {
      const ix = (i * w) / 2.4;
      cyl(g, 0.035, 0.045, 0.14, ins, ix, y + 0.04, 0, 8);
      tops.push(V(ix, y + 0.2, 0));
    }
    void a;
  }
  for (let i = 0; i < 9; i++) {
    const yy = 2.0 + i * 0.42;
    const s = boxC(g, 0.3, 0.025, 0.025, toon(0x6b6f7c), 0, yy, 0);
    s.rotation.y = (i % 2) * Math.PI / 2;
  }
  if (opts.transformer) {
    cyl(g, 0.22, 0.22, 0.75, toon(0x9aa0ae), 0.0, h - 2.2, 0.34, 14);
    cyl(g, 0.24, 0.24, 0.05, toon(0x6b6f7c), 0.0, h - 1.45, 0.34, 14);
    boxC(g, 0.06, 0.4, 0.06, arm, 0, h - 1.8, 0.18);
  }
  if (opts.plate) {
    const t = canvasTexture(64, 256, (c, w, hh) => {
      c.fillStyle = '#2f6fd6'; c.fillRect(0, 0, w, hh);
      c.fillStyle = '#fff'; c.font = `800 34px ${JP_FONT}`; c.textAlign = 'center';
      ['星', '見', '町', '3', '丁', '目'].forEach((ch, i) => c.fillText(ch, w / 2, 40 + i * 38));
    });
    const pm = toon(0xffffff, { map: t });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.62), pm);
    pl.position.set(0, 2.3, 0.16);
    g.add(pl);
  }
  g.position.set(x, opts.y ?? 0, z);
  g.rotation.y = armRot;
  parent.add(g);
  g.updateMatrixWorld(true);
  return { group: g, tops: tops.map((p) => p.clone().applyMatrix4(g.matrixWorld)) };
}

function streetLamp(parent, pole, height, dir) {
  const g = new THREE.Group();
  const m = toon(0x8d9099);
  tube(g, [V(0, height - 0.6, 0), V(0, height, 0.15), V(0, height + 0.1, 0.6), V(0, height + 0.05, 1.1)], 0.035, m, 16);
  boxC(g, 0.18, 0.08, 0.45, toon(0x5a5e6b), 0, height, 1.15);
  const lampMat = glow(0xeaf3ff, 1.9);
  const lamp = boxC(g, 0.14, 0.02, 0.38, lampMat, 0, height - 0.045, 1.15);
  lamp.userData.noShadowCast = true;
  g.position.copy(pole);
  g.rotation.y = dir;
  parent.add(g);
  g.updateMatrixWorld(true);
  const lampPos = V(0, height - 0.1, 1.15).applyMatrix4(g.matrixWorld);
  const spot = new THREE.SpotLight(0xd8e6ff, 22, 13, 0.85, 0.6, 1.3);
  spot.position.copy(lampPos);
  spot.target.position.set(lampPos.x, 0, lampPos.z);
  parent.add(spot, spot.target);
  return { lampMat, spot };
}

function signalHead(parent, pos, rotY) {
  const g = new THREE.Group();
  const body = toon(0x5c6170);
  boxC(g, 1.0, 0.36, 0.2, body, 0, 0, 0);
  const off = 0x1d2028;
  const colors = [0x40e0a0, 0xffc040, 0xff3a2a];
  const lamps = [];
  colors.forEach((c, i) => {
    const x = -0.32 + i * 0.32;
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.14, 16, 1, true, Math.PI * 0.1, Math.PI * 1.2), toon(0x3b3f4a, { side: THREE.DoubleSide }));
    visor.rotation.x = Math.PI / 2;
    visor.rotation.y = 0;
    visor.position.set(x, 0, 0.17);
    g.add(visor);
    const mat = new THREE.MeshBasicMaterial({ color: off });
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.12, 18), mat);
    l.position.set(x, 0, 0.101);
    g.add(l);
    lamps.push({ mat, on: new THREE.Color(c).multiplyScalar(3.2), off: new THREE.Color(off) });
  });
  g.position.copy(pos);
  g.rotation.y = rotY;
  parent.add(g);
  return lamps;
}

function pedSignal(parent, pos, rotY) {
  const g = new THREE.Group();
  boxC(g, 0.32, 0.62, 0.18, toon(0x5c6170), 0, 0, 0);
  const mk = (color, walking) => canvasTexture(64, 64, (c, w, h) => {
    c.fillStyle = '#111'; c.fillRect(0, 0, w, h);
    c.fillStyle = color;
    c.beginPath(); c.arc(32, 14, 7, 0, 7); c.fill();
    c.lineWidth = 7; c.strokeStyle = color; c.lineCap = 'round';
    c.beginPath(); c.moveTo(32, 24); c.lineTo(32, 42);
    if (walking) { c.moveTo(32, 42); c.lineTo(22, 58); c.moveTo(32, 42); c.lineTo(42, 56); c.moveTo(22, 32); c.lineTo(42, 30); }
    else { c.moveTo(32, 42); c.lineTo(27, 58); c.moveTo(32, 42); c.lineTo(37, 58); c.moveTo(24, 26); c.lineTo(24, 40); c.moveTo(40, 26); c.lineTo(40, 40); }
    c.stroke();
  });
  const red = new THREE.MeshBasicMaterial({ map: mk('#ff4a3a', false), color: 0x222222 });
  const grn = new THREE.MeshBasicMaterial({ map: mk('#40e0b0', true), color: 0x222222 });
  const a = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), red);
  a.position.set(0, 0.15, 0.091);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), grn);
  b.position.set(0, -0.15, 0.091);
  g.add(a, b);
  g.position.copy(pos);
  g.rotation.y = rotY;
  parent.add(g);
  return { red, grn };
}

function buildPoles(root) {
  const g = new THREE.Group();
  root.add(g);

  const p1 = utilityPole(g, -9.45, 4.75, 7.6, 0.6, { y: 0.15, plate: true });
  const p2 = utilityPole(g, 4.75, -1.9, 7.6, -0.9, { y: 0.15, transformer: true });
  const p3 = utilityPole(g, 4.75, -9.45, 7.6, 0.0, { y: 0.15 });

  const wire = toon(0x1c1d26);
  const link = (a, b, sag) => {
    for (let i = 0; i < Math.min(a.tops.length, b.tops.length); i++) {
      if (i === 1 || i === 4) continue;
      sagWire(g, a.tops[i], b.tops[i], sag + i * 0.04, 0.012, wire);
    }
  };
  link(p1, p2, 0.9);
  link(p2, p3, 0.55);
  sagWire(g, p2.tops[4], V(3.0, 3.75, -3.3), 0.25, 0.012, wire);
  sagWire(g, p1.tops[3], V(-7.7, 5.6, 1.2), 0.25, 0.012, wire);
  sagWire(g, p1.tops[0], V(-9.9, 6.6, -3.0), 0.5, 0.012, wire);

  const lamps = [];
  lamps.push(streetLamp(g, V(-9.45, 0.15, 4.75), 5.0, 0.15));
  lamps.push(streetLamp(g, V(4.75, 0.15, -1.9), 5.0, Math.PI / 2 + 0.1));

  const sp = toon(0x9ea2ab);
  cyl(g, 0.09, 0.11, 5.3, sp, 4.78, 0, 4.78, 12);
  const armA = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), sp);
  armA.rotation.z = Math.PI / 2;
  armA.position.set(4.78 + 1.3, 5.0, 4.78);
  g.add(armA);
  const armB = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), sp);
  armB.rotation.x = Math.PI / 2;
  armB.position.set(4.78, 4.7, 4.78 + 1.3);
  g.add(armB);

  const headNS = signalHead(g, V(6.6, 5.0, 4.78 - 0.13), Math.PI);
  const headEW = signalHead(g, V(4.78 - 0.13, 4.7, 6.6), -Math.PI / 2);
  const pedNS = pedSignal(g, V(4.78, 2.6, 4.78 - 0.14), Math.PI);
  const pedEW = pedSignal(g, V(4.78 - 0.14, 2.6, 4.78), -Math.PI / 2);

  const nsLight = new THREE.PointLight(0x40e0a0, 0, 5, 1.5);
  nsLight.position.set(6.6, 4.6, 4.3);
  const ewLight = new THREE.PointLight(0xff3a2a, 0, 5, 1.5);
  ewLight.position.set(4.3, 4.3, 6.6);
  g.add(nsLight, ewLight);

  return {
    group: g,
    lamps,
    signal: { headNS, headEW, pedNS, pedEW, nsLight, ewLight },
  };
}

export const block = {
  name: 'poles',
  build: (world) => {
    const handles = buildPoles(world);
    const signal = createSignal(handles.signal);
    return {
      ...handles,
      update(dt, elapsed) {
        signal.update(dt);
      },
    };
  },
};

export { buildPoles };
