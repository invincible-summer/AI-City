// fx/glass.js
import * as THREE from '../../vendor/three.module.js';

const vert = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormalW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const frag = /* glsl */ `
uniform float uTime;
uniform float uDrops;
uniform vec3 uTint;
uniform float uOpacity;
varying vec3 vWorld;
varying vec3 vNormalW;

float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
vec3 h31(float p) { vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787)); p3 += dot(p3, p3.yzx + 19.19); return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x)); }

vec2 dropLayer(vec2 uv, float t) {
  vec2 aspect = vec2(2.0, 1.0);
  vec2 st = uv * vec2(1.0, 1.0) * aspect * 2.2;
  st.y += t * 0.22;
  vec2 id = floor(st);
  vec2 gv = fract(st) - 0.5;
  float n = h21(id);
  float tt = t + n * 6.2831;
  float w = uv.y * 10.0;
  float x = (n - 0.5) * 0.8;
  x += (0.4 - abs(x)) * sin(3.0 * w) * pow(sin(w), 6.0) * 0.45;
  float y = -sin(tt + sin(tt + sin(tt) * 0.5)) * 0.45;
  y -= (gv.x - x) * (gv.x - x);
  vec2 dropPos = (gv - vec2(x, y)) / aspect;
  float drop = smoothstep(0.05, 0.035, length(dropPos));
  vec2 trailPos = (gv - vec2(x, t * 0.22)) / aspect;
  trailPos.y = (fract(trailPos.y * 8.0) - 0.5) / 8.0;
  float trail = smoothstep(0.025, 0.015, length(trailPos));
  float fog = smoothstep(-0.05, 0.05, dropPos.y);
  fog *= smoothstep(0.5, y, gv.y);
  trail *= fog;
  float streak = smoothstep(0.012, 0.0, abs(gv.x - x)) * fog * 0.35;
  return vec2(drop + trail, streak);
}

float staticDrops(vec2 uv, float t) {
  uv *= 14.0;
  vec2 id = floor(uv);
  uv = fract(uv) - 0.5;
  vec3 n = h31(id.x * 107.45 + id.y * 3543.654);
  vec2 p = (n.xy - 0.5) * 0.7;
  float d = length(uv - p);
  float fade = smoothstep(0.0, 0.025, fract(t * 0.15 + n.z)) * smoothstep(1.0, 0.2, fract(t * 0.15 + n.z));
  return smoothstep(0.11, 0.0, d) * fract(n.z * 10.0) * fade;
}

void main() {
  vec2 uv = vec2((vWorld.x + vWorld.z) * 0.35, vWorld.y * 0.35);
  float t = uTime;
  vec2 l1 = dropLayer(uv, t);
  vec2 l2 = dropLayer(uv * 1.35 + 7.31, t * 0.9);
  float s = staticDrops(uv, t);
  float drops = clamp((l1.x + l2.x * 0.8 + s * 0.9) * uDrops, 0.0, 1.0);
  float streak = (l1.y + l2.y) * uDrops;

  float band = vWorld.x * 0.7 - vWorld.z * 0.7 + vWorld.y * 1.1;
  float sheen = smoothstep(0.0, 0.06, fract(band * 0.22) - 0.0) * smoothstep(0.16, 0.1, fract(band * 0.22));
  float sheen2 = smoothstep(0.23, 0.25, fract(band * 0.22)) * smoothstep(0.29, 0.27, fract(band * 0.22));
  float sh = (sheen + sheen2 * 0.7) * 0.08;

  vec3 col = uTint;
  float a = uOpacity + sh;
  col = mix(col, vec3(0.85, 0.93, 1.0), clamp(sh * 6.0, 0.0, 1.0));
  col = mix(col, vec3(0.92, 0.97, 1.0) * 1.4, drops);
  a = max(a, drops * 0.75);
  a += streak * 0.4;
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function createGlassMaterial({ drops = 1, opacity = 0.1, tint = 0x9fc6e8 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDrops: { value: drops },
      uTint: { value: new THREE.Color(tint) },
      uOpacity: { value: opacity },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export { createGlassMaterial };
