// station04-main.js — standalone verification entry for Station 04.
// Boots ONLY the Build Hall (no journey, no portfolio UI) so each
// camera pose can be render-checked in isolation:
//   station04.html?view=overview|commit|gates|stack|registry|ring
// Renderer pattern mirrors src/station01-main.js (ACES + sRGB,
// __rendered after 3 frames). The animation clock accumulates
// clamped frame deltas and freezes while the tab is hidden, so the
// flow system pauses instead of jumping when the visitor returns.

import * as THREE from 'three';
import { createStation04 } from './scene/station04/station04.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'overview';

// Camera poses — the inventory's six journey stops. Every one inside
// the room, south of the production line or in the open floor south
// and west of the ring (the flight corridor), never through the
// plant and never over the ring's centre.
const POSES = {
  overview: { pos: [-5.55, 2.05, 1.75], tgt: [3.2, 0.8, -0.55] },
  // commit: from the south-east, one frame holds the full recent-
  // builds stack on the west wall, the BUILD #482 gantry plate and
  // the intake dock's gold-trim crates in the north-west corner
  commit: { pos: [-2.9, 1.8, 1.6], tgt: [-5.7, 1.3, -0.9] },
  // gates: swung south so the reject bin's plate and red LED share
  // the frame with Gate 2's FAIL ON CRITICAL · HIGH plate
  gates: { pos: [-1.9, 1.5, 2.35], tgt: [0.3, 1.25, -0.85] },
  // stack: close and front-on from the south-west walkway, EAST of
  // Gate 2's furniture — the scan board (x ≤ 0.66) and the gate's
  // south upright sit ~85° off-axis, behind the view plane, and the
  // sightlines to the west-face stamps pass east of the shortened
  // line bed (ends x 0.98). The stack fills the centre: all five
  // slabs + CONFIG cap read top-to-bottom, the south edge plates
  // and the west CACHED / REBUILT stamps both catch the corner,
  // the scaffold stands in the background, the ring only behind
  // the stack's east edge
  stack: { pos: [0.85, 1.65, 0.55], tgt: [1.7, 0.5, -0.6] },
  // registry: from the open floor south-west of the desk — shelves,
  // Rekor rail and signing desk compose with the ring out of frame
  registry: { pos: [1.3, 1.8, 2.6], tgt: [5.4, 0.95, 1.85] },
  // ring: raised and pulled back to the south-west — the whole
  // annulus reads, LOADED and SIGNED flags face the camera, and the
  // gold DISPATCH crate sits under the west-facing deploy-gate plate
  ring: { pos: [1.0, 2.25, 2.5], tgt: [3.9, 0.85, -0.65] },
};
const pose = POSES[viewParam] || POSES.overview;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 04 · Build Hall — view: ${viewParam}`;

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

  const station = createStation04(scene);
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
    if (!document.hidden) t += dt;   // hidden tab: the build holds still
    station.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
