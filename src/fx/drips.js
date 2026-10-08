// fx/drips.js
import * as THREE from '../../vendor/three.module.js';

function groundY(x, z) {
  const sidewalk = (x > 3.2 && x < 5 && z > -10 && z < 1.5) || (x > -10 && x < -5 && z > 1.5 && z < 5);
  return sidewalk ? 0.15 : 0;
}

function createDrips(scene, count = 340) {
  const edges = [
    { a: [-4.9, 2.68, 2.44], b: [3.1, 2.68, 2.44] },
    { a: [4.04, 2.68, -2.7], b: [4.04, 2.68, 2.3] },
    { a: [-5.06, 3.88, -5.9], b: [-5.06, 3.88, 1.4] },
    { a: [-4.9, 3.88, -6.06], b: [3.1, 3.88, -6.06] },
    { a: [-9.8, 6.78, 1.44], b: [-7.7, 6.78, 1.44] },
    { a: [-7.64, 6.78, -9.8], b: [-7.64, 6.78, 1.4] },
    { a: [3.3, 3.88, -5.9], b: [3.3, 3.88, 1.4] },
  ];
  const total = edges.reduce((s) => s, 0);
  const per = Math.ceil(count / edges.length);

  const pos = [];
  const attr = [];
  const end = [];
  const seed = [];
  for (const e of edges) {
    const y0 = e.a[1];
    for (let i = 0; i < per; i++) {
      const t = Math.random();
      const x = e.a[0] + (e.b[0] - e.a[0]) * t + (Math.random() - 0.5) * 0.04;
      const z = e.a[2] + (e.b[2] - e.a[2]) * t + (Math.random() - 0.5) * 0.04;
      const gy = groundY(x, z) + 0.01;
      const s = Math.random();
      const rate = 0.7 + Math.random() * 1.1;
      for (let v = 0; v < 2; v++) {
        pos.push(x, 0, z);
        attr.push(y0, gy, rate, s * 0.98);
        end.push(v);
        seed.push(s);
      }
    }
  }
  void total;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aAttr', new THREE.Float32BufferAttribute(attr, 4));
  geo.setAttribute('aEnd', new THREE.Float32BufferAttribute(end, 1));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec4 aAttr;
      attribute float aEnd;
      attribute float aSeed;
      uniform float uTime;
      varying float vA;
      void main() {
        float t = fract(uTime * aAttr.z + aAttr.w);
        float fall = aAttr.x - aAttr.y;
        float y = aAttr.x - t * fall;
        vec3 p = vec3(position.x + t * 0.06 * (aSeed - 0.5) * 4.0, y, position.z + t * 0.05 * (aSeed * 7.0 - 3.0));
        p.y += aEnd * 0.12;
        vA = (0.55 - 0.35 * t) * smoothstep(0.98, 0.85, aAttr.w + 0.0);
        vA *= mix(1.0, 0.5, aEnd);
        vA *= smoothstep(aAttr.y, aAttr.y + 0.1, y);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        gl_FragColor = vec4(vec3(0.75, 0.86, 1.05) * 1.25, vA);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 10;
  scene.add(lines);

  return {
    object: lines,
    update(t) {
      mat.uniforms.uTime.value = t;
    },
  };
}

export { createDrips };
