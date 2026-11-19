// main.js — boot, renderer, and wiring for the portfolio.
// The 3D hall (Station 03) is flown by src/ui/journey.js from native
// scroll; all copy and sections come from src/ui/content.js via dom.js.
// Direct-link poses still work: ?view=hero|racks|aisle|top jumps the
// journey straight to that keyframe.
// If WebGL is unavailable the page degrades to the document portfolio
// with a friendly notice — never a dead still page.

import * as THREE from 'three';
import { createDatacentre } from './scene/datacentre.js';
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
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.body.classList.add('context-lost');
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9edf0); // bright hall, no void

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 80);
  camera.position.set(-2.02, 1.62, 0.0); // hero pose, until the journey takes over

  const dc = createDatacentre(scene);
  scene.add(dc.group);

  function projFactor() {
    return window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }
  dc.setProjFactor(projFactor() * renderer.getPixelRatio());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    dc.setProjFactor(projFactor() * renderer.getPixelRatio());
  });

  const journey = createJourney({ camera, scene, ui, reducedMotion });
  if (viewParam) journey.setView(viewParam);

  const clock = new THREE.Clock();
  let frames = 0;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    journey.update(dt, t);
    dc.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
