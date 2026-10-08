// scene/layout.js
const HALF = 10;

const STORE = { x0: -5, x1: 3.2, z0: -6, z1: 1.5, floor: 0.2, height: 3.6, ceil: 3.15 };

const NEIGHBOR = { x0: -10, x1: -7.6, z0: -10, z1: 1.5, height: 6.6 };

const SIDEWALK_H = 0.15;

const SIDEWALKS = [
  { x0: 3.2, x1: 5, z0: -10, z1: 1.5 },
  { x0: -10, x1: -5, z0: 1.5, z1: 5 },
];

const ROAD_EDGE = 5;

const PUDDLES = [
  [6.9, -2.6, 1.3, 0.85],
  [7.5, 7.3, 1.5, 1.0],
  [-1.6, 7.4, 1.8, 0.75],
  [1.2, 3.3, 1.0, 0.65],
  [-3.6, 3.7, 0.75, 0.55],
  [-6.3, -3.4, 0.55, 1.3],
  [8.3, -7.6, 0.85, 0.7],
  [3.9, 6.5, 0.9, 0.55],
  [-7.5, 8.2, 1.1, 0.6],
  [-1.5, -8.2, 1.0, 0.6],
];

const RAIN_BLOCKERS = [
  { x0: -5.15, x1: 3.35, z0: -6.15, z1: 1.65, h: 3.9 },
  { x0: -5.1, x1: 3.3, z0: 1.5, z1: 2.45, h: 2.75 },
  { x0: 3.2, x1: 4.05, z0: -2.8, z1: 2.45, h: 2.75 },
  { x0: -10, x1: -7.6, z0: -10, z1: 1.5, h: 6.8 },
];

function groundHeightAt(x, z) {
  let h = 0;
  for (const b of RAIN_BLOCKERS) {
    if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) h = Math.max(h, b.h);
  }
  for (const s of SIDEWALKS) {
    if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) h = Math.max(h, SIDEWALK_H);
  }
  return h;
}

export { groundHeightAt, HALF, STORE, NEIGHBOR, SIDEWALK_H, SIDEWALKS, ROAD_EDGE, PUDDLES, RAIN_BLOCKERS };
