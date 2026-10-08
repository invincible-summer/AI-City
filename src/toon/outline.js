// toon/outline.js
import * as THREE from '../../vendor/three.module.js';
import { mergeVertices } from '../../vendor/jsm/utils/BufferGeometryUtils.js';
import { ShaderPass } from '../../vendor/jsm/postprocessing/ShaderPass.js';

const hullCache = new Map();

function hullGeometry(geo, thickness) {
  const key = `${geo.uuid}:${thickness.toFixed(5)}`;
  if (hullCache.has(key)) return hullCache.get(key);
  let g = geo.clone();
  try {
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position') g.deleteAttribute(name);
    }
    g.clearGroups();
    g = mergeVertices(g, 1e-4);
  } catch {
    g = geo.clone();
  }
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + nor.getX(i) * thickness,
      pos.getY(i) + nor.getY(i) * thickness,
      pos.getZ(i) + nor.getZ(i) * thickness,
    );
  }
  pos.needsUpdate = true;
  g.computeBoundingSphere();
  hullCache.set(key, g);
  return g;
}

const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0x141226,
  side: THREE.BackSide,
  fog: false,
});

function isSkippable(mesh, skipSet) {
  if (mesh.userData.noOutline) return true;
  let p = mesh.parent;
  while (p) {
    if (skipSet.has(p) || p.userData.noOutlineSubtree) return true;
    p = p.parent;
  }
  if (mesh.isInstancedMesh || mesh.isPoints || mesh.isLine || mesh.isSprite || mesh.isReflector) return true;
  if (!mesh.geometry) return true;
  const t = mesh.geometry.type;
  if (t === 'PlaneGeometry' || t === 'CircleGeometry' || t === 'RingGeometry') return true;
  const m = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  if (!m) return true;
  if (m.transparent || (m.opacity !== undefined && m.opacity < 1)) return true;
  if (m.isShaderMaterial || m.isMeshNormalMaterial) return true;
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  const s = new THREE.Vector3();
  mesh.getWorldScale(s);
  const r = mesh.geometry.boundingSphere.radius * Math.max(s.x, s.y, s.z);
  if (r < 0.09) return true;
  if (r > 40) return true;
  return false;
}

function addOutline(root, { thickness = 0.014, skip = [] } = {}) {
  root.updateMatrixWorld(true);
  const skipSet = new Set(skip);
  const targets = [];
  root.traverse((o) => {
    if (o.isMesh && !isSkippable(o, skipSet)) targets.push(o);
  });
  const scale = new THREE.Vector3();
  for (const mesh of targets) {
    mesh.getWorldScale(scale);
    const avg = (Math.abs(scale.x) + Math.abs(scale.y) + Math.abs(scale.z)) / 3 || 1;
    const t = thickness / avg;
    const hull = new THREE.Mesh(hullGeometry(mesh.geometry, t), outlineMaterial);
    hull.userData.noOutline = true;
    hull.userData.noShadowCast = true;
    hull.castShadow = false;
    hull.receiveShadow = false;
    hull.renderOrder = mesh.renderOrder - 0.5;
    mesh.add(hull);
  }
  return targets.length;
}

const DepthEdgeShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
    uNear: { value: 0.1 },
    uFar: { value: 300 },
    uColor: { value: new THREE.Color(0x141226) },
    uStrength: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uTexel;
    uniform float uNear;
    uniform float uFar;
    uniform vec3 uColor;
    uniform float uStrength;
    varying vec2 vUv;

    float lin(vec2 uv) {
      float z = texture2D(tDepth, uv).x;
      float ndc = z * 2.0 - 1.0;
      return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
    }

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float d0 = lin(vUv);
      vec2 e = uTexel;
      float d1 = lin(vUv + vec2(e.x, 0.0));
      float d2 = lin(vUv - vec2(e.x, 0.0));
      float d3 = lin(vUv + vec2(0.0, e.y));
      float d4 = lin(vUv - vec2(0.0, e.y));
      float d5 = lin(vUv + e);
      float d6 = lin(vUv - e);
      float d7 = lin(vUv + vec2(e.x, -e.y));
      float d8 = lin(vUv + vec2(-e.x, e.y));
      float m1 = abs(d1 - d0) + abs(d2 - d0);
      float m2 = abs(d3 - d0) + abs(d4 - d0);
      float m3 = abs(d5 - d0) + abs(d6 - d0);
      float m4 = abs(d7 - d0) + abs(d8 - d0);
      float dd = max(max(m1, m2), max(m3 * 0.7, m4 * 0.7));
      float rel = dd / max(d0 * d0 * 0.055, 0.35);
      float edge = smoothstep(0.5, 1.35, rel) * uStrength;
      edge *= smoothstep(0.0, 3.0, d0);
      edge *= 1.0 - smoothstep(45.0, 90.0, d0);
      c.rgb = mix(c.rgb, uColor, clamp(edge, 0.0, 1.0) * 0.85);
      gl_FragColor = c;
    }
  `,
};

function createDepthEdgePass() {
  const pass = new ShaderPass(DepthEdgeShader, '__scene_input');
  pass.material.depthTest = false;
  pass.material.depthWrite = false;
  pass.material.toneMapped = false;
  return pass;
}

export { addOutline, createDepthEdgePass, DepthEdgeShader };
