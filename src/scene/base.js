// scene/base.js
import * as THREE from '../../vendor/three.module.js';
import { toon, P, canvasTexture, JP_FONT } from '../toon/materials.js';
import { box } from '../utils/geo.js';
import { HALF } from './layout.js';

function buildBase(root) {
  const g = new THREE.Group();
  root.add(g);

  const S = HALF * 2;
  const strata = canvasTexture(1024, 64, (c, w, h) => {
    c.fillStyle = '#34384c';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#5b5f72';
    c.fillRect(0, 10, w, 10);
    c.fillStyle = '#4a3f45';
    c.fillRect(0, 20, w, h - 20);
    for (let i = 0; i < 500; i++) {
      c.fillStyle = Math.random() < 0.5 ? '#6b5d5e' : '#3a3036';
      const r = 1 + Math.random() * 2.5;
      c.beginPath();
      c.arc(Math.random() * w, 22 + Math.random() * (h - 24), r, 0, Math.PI * 2);
      c.fill();
    }
  });
  const sideMat = toon(0xffffff, { map: strata });
  const topMat = toon(P.asphalt);
  const layer = new THREE.Mesh(new THREE.BoxGeometry(S, 0.5, S), [sideMat, sideMat, topMat, topMat, sideMat, sideMat]);
  layer.position.y = -0.25;
  g.add(layer);

  const plinth = box(g, S + 0.7, 1.3, S + 0.7, toon(P.plinth), 0, -1.8, 0);
  plinth.userData.noShadowCast = true;
  box(g, S + 0.9, 0.12, S + 0.9, toon(P.plinthTop), 0, -0.62, 0);
  box(g, S + 0.9, 0.1, S + 0.9, toon(P.plinthTop), 0, -1.9, 0);

  const plate = canvasTexture(1024, 192, (c, w, h) => {
    const grd = c.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#d8b46a');
    grd.addColorStop(1, '#9c7838');
    c.fillStyle = grd;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#6e5222';
    c.lineWidth = 8;
    c.strokeRect(10, 10, w - 20, h - 20);
    c.fillStyle = '#3d2c10';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold 72px ${JP_FONT}`;
    c.fillText('雨夜のコンビニ', w / 2, h * 0.42);
    c.font = `500 30px ${JP_FONT}`;
    c.fillText('RAINY NIGHT · STREET CORNER  1/150', w / 2, h * 0.78);
  });
  const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.78, 0.06), [
    toon(0x9c7838), toon(0x9c7838), toon(0x9c7838), toon(0x9c7838),
    toon(0xffffff, { map: plate }), toon(0x9c7838),
  ]);
  plateMesh.position.set(0, -1.15, HALF + 0.38);
  g.add(plateMesh);

  return g;
}

// 方块描述符：注册表 src/scene/index.js 靠它装配场景。
// name  唯一名字，用于 window.__dbg.parts.<name> 调试访问
// build (world) => handles，把几何体挂到 world 上并返回自己需要的引用
export const block = {
  name: 'base',
  build: (world) => ({ group: buildBase(world) }),
};

export { buildBase };
