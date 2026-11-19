// main.js — boot, renderer, and wiring for the portfolio.
// The 3D yard (Station 02) is flown by src/ui/journey.js from native
// scroll; all copy and sections come from src/ui/content.js via dom.js.
// Direct-link poses still work: ?view=gate|portrait|lid|bayline|bus|
// firewall jumps the journey straight to that keyframe.
// The lighting rig is the verified one from station02-main.js — 06:04
// sun, warm and low in the ESE, long shadows toward WNW.
// If WebGL is unavailable the page degrades to the document portfolio
// with a friendly notice — never a dead still page.

import * as THREE from 'three';
import { createStation02 } from './scene/station02/station02.js';
import { buildUI } from './ui/dom.js';
import { createJourney } from './ui/journey.js';

const ui = buildUI();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const viewParam = new URLSearchParams(location.search).get('view');

function showFallback() {
  document.body.classList.add('no-webgl');
  document.getElementById('fallback').hidden = false;
  // keep the chrome alive: the progress bar still tracks the document
  const onScroll = () => {
    const len = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    ui.progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / len))})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  window.__rendered = true;
  window.__scrollReady = true;
}

let gl2 = null;
try {
  gl2 = document.createElement('canvas').getContext('webgl2');
} catch {
  gl2 = null;
}

let renderer = null;
if (gl2) {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch {
    renderer = null;
  }
}

if (!renderer) {
  showFallback();
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.body.classList.add('context-lost');
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8e2e8); // clear morning sky
  scene.fog = new THREE.Fog(0xd8e2e8, 85, 190);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(-1.8, 1.7, 22.6); // gate pose, until the journey takes over

  // 06:04 sun: low in the ESE, warm, long shadows toward WNW.
  const sun = new THREE.DirectionalLight(0xffd9a6, 2.6);
  sun.position.set(55, 17, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -52; sun.shadow.camera.right = 52;
  sun.shadow.camera.top = 52; sun.shadow.camera.bottom = -52;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 160;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbdd2e4, 0x8a7f6a, 0.85));
  const fill = new THREE.DirectionalLight(0xdfe8ee, 0.35);
  fill.position.set(-40, 30, -30);
  scene.add(fill);

  const station = createStation02();
  scene.add(station);

  function projFactor() {
    return window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }
  if (station.userData.setProjFactor)
    station.userData.setProjFactor(projFactor() * renderer.getPixelRatio());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (station.userData.setProjFactor)
      station.userData.setProjFactor(projFactor() * renderer.getPixelRatio());
  });

  const journey = createJourney({ camera, scene, ui, reducedMotion });
  if (viewParam) journey.setView(viewParam);

  const clock = new THREE.Clock();
  let t = 0;
  let frames = 0;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!document.hidden) t += dt;
    journey.update(dt, t);
    if (station.userData.update) station.userData.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
