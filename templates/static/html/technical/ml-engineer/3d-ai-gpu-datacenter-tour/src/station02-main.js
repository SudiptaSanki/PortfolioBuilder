// station02-main.js — standalone verification entry for Station 02.
// Boots ONLY the Lattice Hall (no journey, no portfolio UI) so each
// camera pose can be render-checked in isolation:
//   station02.html?view=overview|tokens|block|board|cabinets|lmhead
// Renderer pattern mirrors src/main.js (ACES + sRGB, __rendered after
// 3 frames). The animation clock accumulates clamped frame deltas and
// freezes while the tab is hidden, so the Forward Pass pauses instead
// of jumping when the visitor returns.

import * as THREE from 'three';
import { createStation02 } from './scene/station02/station02.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'overview';

// Camera poses — the inventory's six journey stops, recomposed from
// the walkway corridors (fix loop 1): every one inside the room with
// a clear sightline, never inside the machinery, never threaded
// through the attention links or blocked by furniture.
const POSES = {
  // on the spine axis from the west entry: six bays recede
  // centrally, the LM head scoreboard closes the frame
  overview: { pos: [-5.5, 2.0, 0], tgt: [5.9, 1.2, 0] },
  // south-east of the token rail, three-quarter: all 8 plates and
  // the embedding cabinet in frame, spine nameplate out of the way
  tokens: { pos: [-3.4, 1.55, 2.9], tgt: [-5.45, 1.05, -0.5] },
  // south walkway beside the hero bay at spine height, looking
  // along it: gate → head frames → FFN press in one frame
  block: { pos: [-1.35, 1.05, 2.35], tgt: [0.15, 1.35, -0.1] },
  // from the north-west walkway, elevated: the sightline threads
  // between bay uprights — full board width incl. row labels,
  // header and shutter in frame with margin, zero occlusions
  board: { pos: [-1.5, 2.2, -0.4], tgt: [0, 1.92, -3.38] },
  // from the west walkway, pulled back and raised: all four
  // cabinets and all four question plates fully in frame, no
  // upright crossing any plate
  cabinets: { pos: [-1.9, 1.65, 0.8], tgt: [0.05, 0.88, 2.95] },
  // low from the south-west, looking up at the RAISED scoreboard
  // (fix loop 3: board +0.12 m in lmHead.js). Bay 6's portal-beam
  // shadow now passes entirely above the title, the whole panel
  // incl. its south frame edge fits the 1440×900 frame, and the
  // FINAL LN plate is readable in the same frame. All five row
  // labels and rows 2–4 are fully clear; hairline crossings from
  // bay 6's head frames, hanger rods and lens discs remain on the
  // title, subtitle, the top two bars/values and the P = value —
  // the solver proves no in-hall viewpoint clears those wide
  // elements completely (frame side-bar shadows always land on
  // some band of the content ladder), so this pose is the verified
  // minimum: 1,755 of 18,717 dense sightline samples occluded,
  // down from 2,140 at the fix-loop-2 pose.
  lmhead: { pos: [4.45, 1.02, -0.77], tgt: [5.9, 1.92, -0.33] },
};
const pose = POSES[viewParam] || POSES.overview;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 02 · Lattice Hall — view: ${viewParam}`;

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

  const station = createStation02(scene);
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
    if (!document.hidden) t += dt;   // hidden tab: the pass holds still
    station.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
