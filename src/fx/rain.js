// fx/rain.js
import * as THREE from '../../vendor/three.module.js';
import { HALF, RAIN_BLOCKERS, groundHeightAt } from '../scene/layout.js';

const blockerGLSL = () => {
  const lines = RAIN_BLOCKERS.map(
    (b) => `if (p.x > ${b.x0.toFixed(2)} && p.x < ${b.x1.toFixed(2)} && p.z > ${b.z0.toFixed(2)} && p.z < ${b.z1.toFixed(2)}) h = max(h, ${b.h.toFixed(2)});`,
  );
  return `float floorAt(vec3 p) { float h = 0.0; ${lines.join('\n')} return h; }`;
};

function createRain(scene, count = 6000) {
  const H = 15;
  const seeds = new Float32Array(count * 2 * 4);
  const ends = new Float32Array(count * 2);
  const pos = new Float32Array(count * 2 * 3);
  for (let i = 0; i < count; i++) {
    const s = [Math.random(), Math.random(), Math.random(), Math.random()];
    for (let e = 0; e < 2; e++) {
      seeds.set(s, (i * 2 + e) * 4);
      ends[i * 2 + e] = e;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geo.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xb8cdf5) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      attribute float aEnd;
      uniform float uTime;
      varying float vAlpha;
      varying float vCut;
      ${blockerGLSL()}
      void main() {
        float speed = 11.0 + aSeed.w * 5.0;
        float len = 0.35 + aSeed.w * 0.35;
        float y = ${H.toFixed(1)} - mod(aSeed.y * ${H.toFixed(1)} + uTime * speed, ${H.toFixed(1)});
        vec3 dir = normalize(vec3(0.12, -1.0, 0.05));
        vec3 p = vec3((aSeed.x * 2.0 - 1.0) * ${(HALF - 0.05).toFixed(2)}, y, (aSeed.z * 2.0 - 1.0) * ${(HALF - 0.05).toFixed(2)});
        vec3 head = p;
        p -= dir * len * aEnd;
        float f = floorAt(head);
        vCut = head.y - f;
        vAlpha = (0.25 + aSeed.w * 0.35) * smoothstep(${H.toFixed(1)}, ${(H - 2).toFixed(1)}, y);
        vAlpha *= mix(0.55, 1.0, aEnd);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      varying float vCut;
      void main() {
        if (vCut < 0.0) discard;
        gl_FragColor = vec4(uColor, vAlpha * 0.8);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const rain = new THREE.LineSegments(geo, mat);
  rain.frustumCulled = false;
  rain.renderOrder = 10;
  scene.add(rain);

  const sCount = 620;
  const sPos = new Float32Array(sCount * 3);
  const sSeed = new Float32Array(sCount);
  for (let i = 0; i < sCount; i++) {
    const x = (Math.random() * 2 - 1) * (HALF - 0.1);
    const z = (Math.random() * 2 - 1) * (HALF - 0.1);
    sPos.set([x, groundHeightAt(x, z) + 0.02, z], i * 3);
    sSeed[i] = Math.random();
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  const sMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixel;
      varying float vLife;
      void main() {
        float rate = 1.6 + aSeed * 1.2;
        float t = fract(uTime * rate + aSeed * 17.0);
        vLife = t;
        vec4 mv = viewMatrix * modelMatrix * vec4(position + vec3(0.0, t * 0.08, 0.0), 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixel * (10.0 + 30.0 * t) / -mv.z;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vLife;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c * vec2(1.0, 1.8));
        float ring = smoothstep(0.5, 0.35, d) * smoothstep(0.15, 0.3, d);
        float a = ring * (1.0 - vLife) * 0.42;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.8, 0.88, 1.0) * 1.2, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const splashes = new THREE.Points(sGeo, sMat);
  splashes.frustumCulled = false;
  splashes.renderOrder = 11;
  scene.add(splashes);

  return {
    objects: [rain, splashes],
    setPixelRatio(pr, height) {
      sMat.uniforms.uPixel.value = pr * height * 0.0022;
    },
    update(t) {
      mat.uniforms.uTime.value = t;
      sMat.uniforms.uTime.value = t;
    },
  };
}

export { createRain };
