// station03-main.js — standalone verification entry for Station 03.
// Boots ONLY the Transmission Corridor so each camera pose can be
// render-checked in isolation:
//   station03.html?view=overview|portrait|sag|string|bend|skyline
// Renderer pattern mirrors the proven stations (ACES + sRGB,
// __rendered after 3 frames). The clock accumulates clamped frame
// deltas and freezes while hidden.

import * as THREE from 'three';
import { STATION03 } from './config/world.js';
import { createStation03 } from './scene/station03/station03.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'overview';

// Camera poses — composed per the inventory, from believable
// standing positions (track, tower base, a rise off the corridor,
// a work platform at the arm tip). Sightline notes where tight.
const POSES = {
  // From the access track before T-214, pulled back to ~100 m: at
  // the inventory's 25 m the 49 m tower cannot fit a 55° frame
  // (its top would sit ~56° up); at 100 m the top is ~25° up, the
  // tower stands left of centre and all five towers diminish in haze.
  overview: { pos: [16, 2.0, -100], tgt: [-4, 15, 320] },
  // Inside T-214's legs (base 10.4 m square), ~2 m from the SE leg:
  // step bolts and anti-climb guard at hand height, then 49 m of
  // lattice, arms and strings stacked against the sky.
  portrait: { pos: [3.4, 1.7, -3.4], tgt: [-0.5, 38, 1.5] },
  // Near-profile of the road-crossing span (T-215 → T-216) from a
  // rise ~235 m west of its mid-span, at conductor height: the span
  // fills the frame and the dirt road (z = 600) passes under it just
  // past the low point, so the 11.6 m clearance story reads at once.
  sag: { pos: [-128, 24, 681], tgt: [84.5, 18, 581] },
  // ~9 m off T-214's bottom east arm tip: the 23-disc string,
  // grading ring, yoke and clamp at reading distance, the bundle
  // and its spacer dampers running away down span 1.
  string: { pos: [13.0, 29.4, 6.8], tgt: [7.1, 27.9, 0.3] },
  // Outside the 25° angle at T-215, ~85 m off: strain strings
  // horizontal on both faces, jumper loops drooping under the arms,
  // the corridor arriving straight and leaving turned.
  bend: { pos: [-58, 9, 322], tgt: [2, 24, 402] },
  // Just behind and below T-214's peak (49 m), looking along the
  // earth wire to T-215: one thin wire on its shallower catenary,
  // the top conductors ~14 m below it at mid-span on both sides.
  skyline: { pos: [3.2, 45.0, -16], tgt: [-1, 44, 420] },
};
const pose = POSES[viewParam] || POSES.overview;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 03 · Transmission Corridor — view: ${viewParam}`;

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
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(STATION03.haze.colour);
  scene.fog = new THREE.Fog(STATION03.haze.colour, STATION03.haze.near, STATION03.haze.far);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 6000);
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.tgt);

  const station = createStation03();
  scene.add(station);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  let t = 0;
  let frames = 0;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!document.hidden) t += dt;   // hidden tab: the corridor holds still
    if (station.userData.update) station.userData.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
