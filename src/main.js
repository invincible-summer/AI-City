// main.js
import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/jsm/controls/OrbitControls.js';
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from '../vendor/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from '../vendor/jsm/shaders/FXAAShader.js';

import { buildBlocks, updateBlocks } from './scene/index.js';
import { addOutline, createDepthEdgePass } from './toon/outline.js';
import { createRain } from './fx/rain.js';
import { createDrips } from './fx/drips.js';
import { createWetReflector } from './fx/reflection.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0c1020, 26, 90);

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(24, 16, 26);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.3, -0.3);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 7;
controls.maxDistance = 34;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = 1.43;
controls.rotateSpeed = 0.75;
controls.zoomSpeed = 0.85;
controls.panSpeed = 0.5;
controls.screenSpacePanning = false;

{
  const bg = new THREE.Mesh(
    new THREE.SphereGeometry(140, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {},
      vertexShader: `varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `
        varying vec3 vW;
        void main(){
          float h = clamp(vW.y / 120.0, -1.0, 1.0);
          vec3 top = vec3(0.055, 0.07, 0.16);
          vec3 mid = vec3(0.09, 0.10, 0.21);
          vec3 low = vec3(0.03, 0.035, 0.075);
          vec3 c = mix(low, mid, smoothstep(-0.25, 0.05, h));
          c = mix(c, top, smoothstep(0.05, 0.6, h));
          float glowH = exp(-abs(h + 0.02) * 14.0);
          c += vec3(0.05, 0.05, 0.10) * glowH;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }
      `,
    }),
  );
  bg.userData.noOutline = true;
  scene.add(bg);
}

const moon = new THREE.DirectionalLight(0xa8c0f0, 2.0);
moon.position.set(14, 22, 12);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -14;
moon.shadow.camera.right = 14;
moon.shadow.camera.top = 14;
moon.shadow.camera.bottom = -14;
moon.shadow.camera.near = 4;
moon.shadow.camera.far = 60;
moon.shadow.bias = -0.0004;
moon.shadow.normalBias = 0.03;
scene.add(moon);

scene.add(new THREE.HemisphereLight(0x33427a, 0x101219, 1.15));
scene.add(new THREE.AmbientLight(0x1a2038, 0.65));

const world = new THREE.Group();
scene.add(world);

const { parts, outlineSkip } = buildBlocks(world);

world.traverse((o) => {
  if (!o.isMesh) return;
  const mats = Array.isArray(o.material) ? o.material : [o.material];
  const transparent = mats.some((m) => m.transparent || (m.opacity !== undefined && m.opacity < 1));
  const toonish = mats.some((m) => m.isMeshToonMaterial);
  if (toonish && !transparent) {
    if (!o.userData.noShadowCast) o.castShadow = true;
    o.receiveShadow = true;
  } else if (o.isInstancedMesh) {
    o.receiveShadow = true;
  }
});

const hullCount = addOutline(world, { thickness: 0.015, skip: outlineSkip });
console.log('[diorama] outline hulls:', hullCount);

const rain = createRain(scene, 5200);
const drips = createDrips(scene, 300);
const mask = parts.street.mask;
const dpr = renderer.getPixelRatio();
const reflector = createWetReflector(scene, mask, {
  w: Math.min(1024, Math.floor(window.innerWidth * dpr * 0.7)),
  h: Math.min(1024, Math.floor(window.innerHeight * dpr * 0.7)),
});

const depthTex = new THREE.DepthTexture(1, 1);
depthTex.type = THREE.UnsignedIntType;
const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
  type: THREE.HalfFloatType,
  depthBuffer: true,
  stencilBuffer: false,
});
sceneRT.texture.minFilter = THREE.LinearFilter;
sceneRT.texture.magFilter = THREE.LinearFilter;
sceneRT.texture.generateMipmaps = false;
sceneRT.depthTexture = depthTex;

function syncSize() {
  const sz = renderer.getDrawingBufferSize(new THREE.Vector2());
  sceneRT.setSize(sz.x, sz.y);
  depthTex.image.width = sz.x;
  depthTex.image.height = sz.y;
  depthTex.needsUpdate = true;
}

const composer = new EffectComposer(renderer);
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(window.innerWidth, window.innerHeight);

const edgePass = createDepthEdgePass();
edgePass.uniforms.tDepth.value = depthTex;
edgePass.uniforms.uNear.value = camera.near;
edgePass.uniforms.uFar.value = camera.far;
composer.addPass(edgePass);

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.38,
  0.35,
  0.92,
);
composer.addPass(bloom);

composer.addPass(new OutputPass());

const fxaa = new ShaderPass(FXAAShader);
composer.addPass(fxaa);

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb += vec3(0.012, 0.018, 0.045) * (1.0 - smoothstep(0.0, 0.45, l));
      c.rgb = mix(vec3(l), c.rgb, 1.07);
      vec2 q = vUv - 0.5;
      float vig = smoothstep(0.95, 0.32, length(q * vec2(1.1, 1.0)));
      c.rgb *= mix(0.66, 1.0, vig);
      float g = fract(sin(dot(vUv * 913.7 + fract(uTime), vec2(12.9898, 78.233))) * 43758.5453);
      c.rgb += (g - 0.5) * 0.02;
      gl_FragColor = c;
    }
  `,
};
const gradePass = new ShaderPass(GradeShader);
gradePass.renderToScreen = true;
composer.addPass(gradePass);

function setFxaaRes() {
  const sz = renderer.getDrawingBufferSize(new THREE.Vector2());
  fxaa.material.uniforms.resolution.value.set(1 / sz.x, 1 / sz.y);
  edgePass.uniforms.uTexel.value.set(1 / sz.x, 1 / sz.y);
}
syncSize();
setFxaaRes();
rain.setPixelRatio(renderer.getPixelRatio(), window.innerHeight);

const intro = {
  active: true,
  t: 0,
  dur: 3.6,
  from: new THREE.Vector3(25, 17, 27),
  to: new THREE.Vector3(13.6, 9.2, 15.2),
  fromT: new THREE.Vector3(0, 1.2, -0.3),
  toT: new THREE.Vector3(0, 1.5, -0.4),
};
canvas.addEventListener('pointerdown', () => {
  intro.active = false;
});

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

window.__dbg = { scene, camera, controls, composer, renderer, edgePass, bloom, reflector, world, parts };

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  if (intro.active) {
    intro.t += dt;
    const k = easeInOut(Math.min(1, intro.t / intro.dur));
    camera.position.lerpVectors(intro.from, intro.to, k);
    controls.target.lerpVectors(intro.fromT, intro.toT, k);
    if (intro.t >= intro.dur) intro.active = false;
  }

  controls.update();

  rain.update(elapsed);
  drips.update(elapsed);
  reflector.update(elapsed);
  updateBlocks(parts, dt, elapsed);

  gradePass.uniforms.uTime.value = elapsed;

  edgePass.uniforms.tDiffuse.value = sceneRT.texture;
  edgePass.uniforms.tDepth.value = depthTex;
  renderer.setRenderTarget(sceneRT);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  composer.render();
}

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.resolution.set(w, h);
  syncSize();
  setFxaaRes();
  rain.setPixelRatio(renderer.getPixelRatio(), h);
  const sz = renderer.getDrawingBufferSize(new THREE.Vector2());
  reflector.setSize(Math.min(1024, Math.floor(sz.x * 0.7)), Math.min(1024, Math.floor(sz.y * 0.7)));
});

animate();
