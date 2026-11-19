// station01-main.js — standalone verification entry for Station 01.
// Boots ONLY the Intake Hall (no journey, no portfolio UI) so each
// camera pose can be render-checked in isolation:
//   station01.html?view=overview|sources|gallery|tiers|vault
// Renderer pattern mirrors src/main.js (ACES + sRGB, __rendered after
// 3 frames). The animation clock accumulates clamped frame deltas and
// freezes while the tab is hidden, so the flow system pauses instead
// of jumping when the visitor returns.

import * as THREE from 'three';
import { createStation01 } from './scene/station01/station01.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'overview';

// Camera poses — every one inside the room, off the furniture, in the
// walkway corridors (the Station 03 journey lesson). Targets in metres.
const POSES = {
  overview: { pos: [-5.5, 2.0, 1.6], tgt: [2.4, 0.8, -0.35] },
  sources: { pos: [-3.3, 1.6, 1.15], tgt: [-5.75, 1.0, -0.7] },
  gallery: { pos: [-4.15, 1.4, -2.95], tgt: [1.4, 0.8, -0.75] },
  tiers: { pos: [1.65, 1.8, -0.85], tgt: [5.75, 0.82, -0.8] },
  vault: { pos: [3.5, 1.65, 0.75], tgt: [5.7, 0.95, 2.7] },
};
const pose = POSES[viewParam] || POSES.overview;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 01 · Intake Hall — view: ${viewParam}`;

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
  document.getElementById('fallback').hidden = false;
  window.__rendered = true;
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9edf0); // bright hall, no void

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 80);
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.tgt);

  const station = createStation01(scene);
  scene.add(station.group);

  function projFactor() {
    return window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }
  station.setProjFactor(projFactor() * renderer.getPixelRatio());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    station.setProjFactor(projFactor() * renderer.getPixelRatio());
  });

  const clock = new THREE.Clock();
  let t = 0;
  let frames = 0;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!document.hidden) t += dt;   // hidden tab: the data holds still
    station.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
