// fx/reflection.js
import * as THREE from '../../vendor/three.module.js';
import { Reflector } from '../../vendor/jsm/objects/Reflector.js';
import { HALF } from '../scene/layout.js';

const WetShader = {
  name: 'WetReflector',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    tMask: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUvR;
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = uv;
      vUvR = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tMask;
    uniform float uTime;
    varying vec4 vUvR;
    varying vec2 vUv;
    varying vec3 vWorld;

    float h21(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
    vec2 h22(vec2 p) { float n = h21(p); return vec2(n, h21(p + n)); }

    vec3 ripples(vec2 uv, float t, float rate) {
      vec2 id = floor(uv);
      vec2 nrm = vec2(0.0);
      float hl = 0.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 cell = id + vec2(float(i), float(j));
          vec2 o = h22(cell);
          vec2 center = cell + 0.5 + (o - 0.5) * 0.8;
          float tt = fract(t * rate + o.x * 7.31);
          vec2 d = uv - center;
          float dist = length(d);
          float x = dist - tt * 1.1;
          float wave = sin(34.0 * x) * smoothstep(-0.45, -0.2, x) * smoothstep(0.02, -0.12, x);
          float fade = (1.0 - tt) * (1.0 - tt);
          nrm += (d / max(dist, 1e-3)) * wave * fade;
          hl += max(wave, 0.0) * fade;
        }
      }
      return vec3(nrm, hl);
    }

    void main() {
      float mask = texture2D(tMask, vUv).r;
      float puddle = smoothstep(0.3, 0.85, mask);
      vec3 r1 = ripples(vWorld.xz * 2.6, uTime, 0.9);
      vec3 r2 = ripples(vWorld.xz * 4.1 + 13.7, uTime * 1.13, 1.1);
      vec2 n = r1.xy + r2.xy * 0.6;
      float hl = r1.z + r2.z * 0.6;

      vec4 uvr = vUvR;
      uvr.xy += n * (0.012 + puddle * 0.02) * uvr.w;
      vec3 refl = vec3(0.0);
      float spread = mix(0.018, 0.003, puddle) * uvr.w;
      float wsum = 0.0;
      for (int k = 0; k < 7; k++) {
        float f = float(k) - 1.0;
        float w = 1.0 - abs(f) / 7.0;
        vec4 q = uvr;
        q.y += f * spread;
        refl += texture2DProj(tDiffuse, q).rgb * w;
        wsum += w;
      }
      refl /= wsum;

      float a = clamp(mask * 1.1, 0.0, 1.0);
      a = mix(a * 0.55, 0.92, puddle);
      vec3 col = refl * mix(0.75, 1.0, puddle);
      col += vec3(0.55, 0.65, 0.9) * hl * (0.04 + puddle * 0.12);
      float edge = smoothstep(${(HALF - 0.05).toFixed(2)}, ${(HALF - 0.25).toFixed(2)}, max(abs(vWorld.x), abs(vWorld.z)));
      gl_FragColor = vec4(col, a * edge);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

function createWetReflector(scene, mask, size) {
  mask.colorSpace = THREE.NoColorSpace;
  mask.needsUpdate = true;
  const geo = new THREE.PlaneGeometry(HALF * 2, HALF * 2);
  const r = new Reflector(geo, {
    textureWidth: size.w,
    textureHeight: size.h,
    clipBias: 0.003,
    shader: WetShader,
    multisample: 0,
  });
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.004;
  r.material.transparent = true;
  r.material.depthWrite = false;
  r.material.uniforms.tMask.value = mask;
  r.renderOrder = 1;
  scene.add(r);
  return {
    object: r,
    update(t) {
      r.material.uniforms.uTime.value = t;
    },
    setSize(w, h) {
      r.getRenderTarget().setSize(w, h);
    },
  };
}

export { createWetReflector };
