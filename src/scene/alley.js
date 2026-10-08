// scene/alley.js
import * as THREE from '../../vendor/three.module.js';
import { toon, glow, P, canvasTexture, JP_FONT } from '../toon/materials.js';
import { box, boxC, cyl, plane, rbox, tube, rng } from '../utils/geo.js';
import { NEIGHBOR } from './layout.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function acUnit(parent, x, y, z, ry) {
  const g = new THREE.Group();
  rbox(g, 0.8, 0.55, 0.3, 0.03, toon(0xe4e6ea), 0, 0, 0);
  const fan = new THREE.Mesh(new THREE.CircleGeometry(0.19, 20), toon(0x4a4e5e));
  fan.position.set(-0.13, 0.28, 0.151);
  g.add(fan);
  for (let i = 0; i < 4; i++) boxC(g, 0.4, 0.01, 0.01, toon(0x8a8e9c), -0.13, 0.13 + i * 0.1, 0.16);
  boxC(g, 0.2, 0.3, 0.005, toon(0xc9ccd4), 0.25, 0.28, 0.152);
  boxC(g, 0.06, 0.05, 0.4, toon(0x6b6f7c), -0.3, -0.03, -0.05);
  boxC(g, 0.06, 0.05, 0.4, toon(0x6b6f7c), 0.3, -0.03, -0.05);
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
  return { group: g, fan };
}

function buildAlley(root) {
  const g = new THREE.Group();
  root.add(g);
  const r = rng(11);
  const lights = [];
  const fans = [];
  const { x0, x1, z0, z1, height } = NEIGHBOR;
  const W = x1 - x0, D = z1 - z0;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;

  const wallTex = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#b9a99a'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#a2917f'; c.lineWidth = 2;
    for (let y = 0; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (let i = 0; i < 200; i++) { c.fillStyle = 'rgba(80,70,60,0.08)'; c.fillRect(r() * w, r() * h, 3, 3); }
  });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  const wtF = wallTex.clone(); wtF.repeat.set(W / 2, height / 2); wtF.needsUpdate = true;
  const wtS = wallTex.clone(); wtS.repeat.set(D / 2, height / 2); wtS.needsUpdate = true;
  const wF = toon(0xffffff, { map: wtF });
  const wS = toon(0xd8d4dc, { map: wtS });
  const top = toon(0x6e6a72);
  const bld = new THREE.Mesh(new THREE.BoxGeometry(W, height, D), [wS, wS, top, top, wF, wS]);
  bld.position.set(cx, height / 2, cz);
  g.add(bld);
  box(g, W + 0.1, 0.25, D + 0.1, toon(0x8e8476), cx, height, cz);

  const shutterTex = canvasTexture(128, 128, (c, w, h) => {
    c.fillStyle = '#9aa0ac'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#7d8390';
    for (let y = 0; y < h; y += 8) c.fillRect(0, y, w, 3);
  });
  plane(g, 1.9, 2.3, toon(0xffffff, { map: shutterTex }), cx + 0.05, 1.15, z1 + 0.01);
  box(g, 2.1, 0.35, 0.3, toon(0x7d8390), cx + 0.05, 2.3, z1 + 0.15);
  const shopSign = canvasTexture(512, 96, (c, w, h) => {
    c.fillStyle = '#3d2a1f'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f5e6c8'; c.font = `900 60px ${JP_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('たばこ・酒  まつだ', w / 2, h / 2 + 3);
  });
  boxC(g, 2.2, 0.42, 0.1, toon(0x3d2a1f), cx + 0.05, 2.95, z1 + 0.05);
  plane(g, 2.15, 0.4, toon(0xffffff, { map: shopSign }), cx + 0.05, 2.95, z1 + 0.105);

  const winLit = glow(0xffd9a0, 1.4);
  const winLit2 = glow(0xbfd6ff, 1.0);
  const winDark = toon(0x2a3048);
  const frame = toon(0x5d5a63);
  const curtainTex = canvasTexture(64, 64, (c, w, h) => {
    c.fillStyle = '#ffd39a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8a870'; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 3, h);
  });
  const winCurtain = glow(0xffffff, 1.3, { map: curtainTex });
  const window = (x, y, z, ry, mat, w = 0.9, h = 1.0) => {
    const wg = new THREE.Group();
    boxC(wg, w + 0.1, h + 0.1, 0.06, frame, 0, 0, 0);
    plane(wg, w, h, mat, 0, 0, 0.035);
    boxC(wg, 0.03, h, 0.02, frame, 0, 0, 0.045);
    boxC(wg, w + 0.2, 0.06, 0.18, toon(0x8e8476), 0, -h / 2 - 0.08, 0.06);
    wg.position.set(x, y, z);
    wg.rotation.y = ry;
    g.add(wg);
  };
  window(cx - 0.55, 4.1, z1 + 0.02, 0, winLit);
  window(cx + 0.6, 4.1, z1 + 0.02, 0, winDark);
  window(cx - 0.55, 5.6, z1 + 0.02, 0, winDark);
  window(cx + 0.6, 5.6, z1 + 0.02, 0, winCurtain);
  const sideMats = [winDark, winCurtain, winDark, winLit2, winDark, winLit, winDark, winDark];
  let k = 0;
  for (const y of [4.1, 5.6]) {
    for (const z of [-0.6, -3.2, -5.8, -8.4]) {
      window(x1 + 0.02, y, z, Math.PI / 2, sideMats[k++ % sideMats.length], 1.0, 0.9);
    }
  }
  {
    const rail = toon(0xd6d8de);
    box(g, 0.7, 0.08, 3.2, toon(0x8e8476), x1 + 0.35, 3.3, -4.5);
    for (let i = 0; i <= 8; i++) box(g, 0.03, 0.8, 0.03, rail, x1 + 0.68, 3.38, -6.05 + i * 0.39);
    box(g, 0.05, 0.05, 3.2, rail, x1 + 0.68, 4.15, -4.5);
    plane(g, 0.01, 0.8, toon(0xc9ced8), x1 + 0.02, 3.8, -4.5);
    for (let i = 0; i < 4; i++) {
      const t = boxC(g, 0.02, 0.35, 0.25, toon([0xf28fb3, 0xffffff, 0x9fd3c7, 0xf6d55c][i]), x1 + 0.45, 3.85, -5.4 + i * 0.5);
      t.rotation.y = 0.2;
    }
    box(g, 0.03, 0.03, 2.4, toon(0x9aa0ae), x1 + 0.45, 4.05, -4.5);
  }

  fans.push(acUnit(g, x1 + 0.18, 0.05, -1.6, Math.PI / 2).fan);
  fans.push(acUnit(g, x1 + 0.22, 2.0, -7.0, Math.PI / 2).fan);
  fans.push(acUnit(g, -5.15 - 0.18, 0.05, -3.6, -Math.PI / 2).fan);
  fans.push(acUnit(g, -5.15 - 0.18, 0.05, -4.55, -Math.PI / 2).fan);
  fans.push(acUnit(g, x1 + 0.22, 4.9, -2.0, Math.PI / 2).fan);

  const pipe = toon(0x9aa0ae);
  cyl(g, 0.05, 0.05, height, toon(0x7d8390), x1 + 0.08, 0, 1.2, 10);
  tube(g, [V(x1 + 0.05, 2.05, -7.0), V(x1 + 0.1, 1.7, -7.3), V(x1 + 0.1, 0.1, -7.3)], 0.025, pipe, 12);
  tube(g, [V(-5.2, 0.35, -3.6), V(-5.3, 0.6, -3.9), V(-5.2, 1.2, -4.2), V(-5.2, 2.6, -4.2)], 0.03, pipe, 16);
  cyl(g, 0.05, 0.05, 3.7, toon(0x7d8390), -5.22, 0, -5.9, 10);

  const boardTex = canvasTexture(512, 320, (c, w, h) => {
    c.fillStyle = '#6a5038'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#d9c7a4'; c.fillRect(14, 14, w - 28, h - 28);
    const items = [
      ['#fff', '町内会のお知らせ', '#2f4fa8', 30, 30, 200, 130],
      ['#ffe8a0', '夏祭り', '#d9443f', 250, 26, 220, 150],
      ['#e0f0ff', 'ゴミの日', '#2f6fd6', 40, 180, 160, 110],
      ['#ffd8e0', '迷い猫', '#c0406a', 220, 190, 120, 100],
      ['#fff', '防犯', '#222', 360, 190, 120, 100],
    ];
    for (const [bg, t, fg, x, y, ww, hh] of items) {
      c.save(); c.translate(x + ww / 2, y + hh / 2); c.rotate((r() - 0.5) * 0.08);
      c.fillStyle = bg; c.fillRect(-ww / 2, -hh / 2, ww, hh);
      c.fillStyle = fg; c.font = `900 ${Math.min(34, ww / t.length * 1.1)}px ${JP_FONT}`; c.textAlign = 'center';
      c.fillText(t, 0, -hh / 2 + 40);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 4; i++) c.fillRect(-ww / 2 + 14, -hh / 2 + 56 + i * 12, ww - 28 - (i % 2) * 30, 4);
      c.fillStyle = '#d9443f'; c.beginPath(); c.arc(0, -hh / 2 + 6, 5, 0, 7); c.fill();
      c.restore();
    }
  });
  {
    const bx = -5.15 - 0.05;
    box(g, 0.08, 0.95, 1.55, toon(0x6a5038), bx, 0.95, -1.6);
    plane(g, 1.5, 0.92, toon(0xffffff, { map: boardTex }), bx - 0.045, 1.425, -1.6, -Math.PI / 2);
    box(g, 0.25, 0.06, 1.7, toon(0x4a3a2a), bx - 0.08, 1.92, -1.6);
    cyl(g, 0.03, 0.03, 0.95, toon(0x6a5038), bx, 0, -2.3, 6);
    cyl(g, 0.03, 0.03, 0.95, toon(0x6a5038), bx, 0, -0.9, 6);
  }

  const alleyLamp = glow(0xffb060, 3.0);
  {
    const lp = V(-5.15 - 0.3, 3.0, -2.6);
    boxC(g, 0.3, 0.05, 0.05, toon(0x5a5e6b), lp.x + 0.15, lp.y + 0.15, lp.z);
    cyl(g, 0.12, 0.05, 0.1, toon(0x5a5e6b), lp.x, lp.y + 0.05, lp.z, 12);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), alleyLamp);
    bulb.position.copy(lp);
    g.add(bulb);
    const l = new THREE.PointLight(0xffa850, 4, 6, 1.4);
    l.position.copy(lp).add(V(0, -0.2, 0));
    g.add(l);
    lights.push(l);
  }

  const crate = (x, y, z, col, ry = 0) => {
    const cg = new THREE.Group();
    const m = toon(col);
    boxC(cg, 0.45, 0.04, 0.33, m, 0, 0.02, 0);
    for (const [sx, sz, w, d] of [[0.215, 0, 0.02, 0.33], [-0.215, 0, 0.02, 0.33], [0, 0.155, 0.45, 0.02], [0, -0.155, 0.45, 0.02]]) boxC(cg, w, 0.28, d, m, sx, 0.14, sz);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cyl(cg, 0.04, 0.04, 0.26, toon(0x7a4a22), -0.14 + i * 0.14, 0.02, -0.07 + j * 0.14, 8);
    cg.position.set(x, y, z);
    cg.rotation.y = ry;
    g.add(cg);
  };
  crate(-7.15, 0, -5.0, 0xd9443f, 0.1);
  crate(-7.15, 0.29, -5.0, 0xf2c84b, -0.05);
  crate(-7.2, 0, -5.5, 0xd9443f, 0.0);
  rbox(g, 0.55, 0.4, 0.4, 0.04, toon(0xb08a5a), -5.6, 0, -6.8);
  rbox(g, 0.45, 0.32, 0.35, 0.04, toon(0xc49a66), -5.6, 0.4, -6.75);

  const binGreen = toon(0x3f7d5a);
  for (const z of [-0.2, 0.45]) {
    rbox(g, 0.55, 0.75, 0.55, 0.06, binGreen, -7.2, 0, z);
    rbox(g, 0.6, 0.06, 0.6, 0.03, toon(0x2f5f44), -7.2, 0.75, z);
  }
  const bag = toon(0x9fc2e8, { transparent: true, opacity: 0.9 });
  for (const [x, z, s] of [[-6.7, 0.9, 0.24], [-6.45, 0.75, 0.2], [-6.65, 0.55, 0.18]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), bag);
    b.scale.y = 0.8;
    b.position.set(x, s * 0.8, z);
    g.add(b);
  }
  {
    const net = canvasTexture(64, 64, (c, w, h) => {
      c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, h);
      c.strokeStyle = '#4f9be0'; c.lineWidth = 3;
      for (let i = 0; i < w; i += 10) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 20, h); c.stroke(); c.beginPath(); c.moveTo(i + 20, 0); c.lineTo(i, h); c.stroke(); }
    });
    const nm = toon(0xffffff, { map: net, transparent: true, side: THREE.DoubleSide });
    nm.alphaTest = 0.3;
    const n = plane(g, 1.0, 0.7, nm, -6.6, 0.32, 0.75, 0, -Math.PI / 2 + 0.6);
    void n;
  }

  {
    const potM = toon(0x9a6b4a);
    const leaf = toon(0x4f8a5a);
    for (const [x, z, s] of [[-5.5, 0.9, 1], [-5.45, 0.4, 0.8]]) {
      cyl(g, 0.16 * s, 0.12 * s, 0.3 * s, potM, x, 0, z, 10);
      for (let i = 0; i < 5; i++) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 8, 6), leaf);
        l.position.set(x + Math.cos(i * 1.3) * 0.1 * s, 0.35 * s + (i % 2) * 0.12 * s, z + Math.sin(i * 1.3) * 0.1 * s);
        g.add(l);
      }
    }
  }

  {
    const blk = toon(0xb4b0a8);
    const blk2 = toon(0x9e9a92);
    for (let i = 0; i < 9; i++) box(g, 0.9, 1.2, 0.15, i % 2 ? blk : blk2, -4.55 + i * 0.9, 0, -9.85);
    box(g, 8.4, 0.08, 0.2, toon(0x8a867e), -0.82, 1.2, -9.85);
    box(g, 0.15, 1.2, 3.6, blk, 3.08, 0, -8.05);
    for (let i = 0; i < 2; i++) {
      cyl(g, 0.17, 0.17, 1.1, toon(0xd7d9de), 0.1 + i * 0.4, 0, -6.45, 14);
      cyl(g, 0.06, 0.06, 0.12, toon(0x7d8394), 0.1 + i * 0.4, 1.1, -6.45, 8);
    }
    rbox(g, 0.8, 0.5, 0.5, 0.03, toon(0x4f9be0), -2.2, 0, -6.55);
    rbox(g, 0.8, 0.5, 0.5, 0.03, toon(0x4f9be0), -2.2, 0.5, -6.55);
    rbox(g, 0.8, 0.5, 0.5, 0.03, toon(0x2fb36b), -3.05, 0, -6.55);
    const shed = toon(0xc7cbd3);
    box(g, 1.6, 1.4, 1.1, shed, -3.8, 0, -8.6);
    box(g, 1.7, 0.08, 1.2, toon(0x7d8394), -3.8, 1.4, -8.6);
    for (const z of [-7.3, -8.6]) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), toon(0x4f8a5a));
      l.position.set(2.5, 0.5, z);
      l.scale.y = 1.3;
      g.add(l);
    }
  }

  return { group: g, lights, fans, alleyLamp };
}

export const block = {
  name: 'alley',
  build: (world) => {
    const handles = buildAlley(world);
    return {
      ...handles,
      update(dt, elapsed) {
        for (const fan of handles.fans) fan.rotation.z += dt * 5;
        for (const l of handles.lights) {
          if (l.userData.base === undefined) l.userData.base = l.intensity;
          l.intensity = l.userData.base * (1 + Math.sin(elapsed * 2.3 + l.position.z) * 0.07);
        }
      },
    };
  },
};

export { buildAlley };
