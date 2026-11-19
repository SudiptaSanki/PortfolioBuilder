// station05-main.js — standalone verification entry for Station 05.
// Boots ONLY the Renewables park (no journey, no portfolio UI) so
// each camera pose can be render-checked in isolation:
//   station05.html?view=overview|turbine|array|inverter|bess|substation
// Renderer pattern mirrors the AI/ML build (ACES + sRGB, __rendered
// after 3 frames). The animation clock accumulates clamped frame
// deltas and freezes while the tab is hidden, so the rotors and the
// dust hold still instead of jumping when the visitor returns.

import * as THREE from 'three';
import { createStation05 } from './scene/station05/station05.js';

const viewParam = new URLSearchParams(location.search).get('view') || 'overview';

// Camera poses (inventory §6) — composed from believable standing
// positions in the park; sightline notes where the framing is tight.
const POSES = {
  // 1 · "The shift change": elevated SE, looking WNW into the light.
  // PV field foreground, BESS yard right, all 8 turbines on the ridge.
  overview: { pos: [168, 58, 178], tgt: [-70, 12, -30] },
  // 2 · "105 metres up": from hero 1's access track, rotor filling
  // the top of frame (disc edges ~25° off-axis vs 27.5° half-FOV),
  // door + padmount kiosk giving scale at the base.
  turbine: { pos: [-88, 4.5, 42], tgt: [-150, 72, -2] },
  // 3 · "Between the rows": 1.7 m eye height in the block road,
  // tables raking away both sides, inverter station at the end.
  // (Stepped 7 m forward from the inventory mark: a cable-route
  // marker post stands at (-26, 30) and filled the frame's bottom
  // edge — it is behind the camera now, the road runs clean.)
  array: { pos: [-26, 1.7, 26], tgt: [-25.2, 2.8, -14] },
  // 4 · "3,125 kVA, still warm": three-quarter on inverter station 2
  // from the south-west — louvres, fin stack, plinth, rating plate.
  inverter: { pos: [18.5, 2.1, 4.5], tgt: [26, 1.5, -4] },
  // 5 · "The evening shift clocks in": OUTSIDE the BESS west gate
  // at eye height — the yard sign in the near foreground, then
  // through the (mesh) gate down the lane between the Megapack
  // rows, green beacons up, to the MV skid at the end.
  bess: { pos: [89.5, 1.8, 46], tgt: [140, 1.6, 46] },
  // 6 · "Where it leaves": pooling substation three-quarter from the
  // NE; the met mast stands ~6° left of the yard in the same frame,
  // its guyed lattice rising behind it.
  substation: { pos: [200, 15, -100], tgt: [110, 12, -8] },
};
const pose = POSES[viewParam] || POSES.overview;

const caption = document.getElementById('view-name');
if (caption) caption.textContent = `Station 05 · Renewables — Golden Hour — view: ${viewParam}`;

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.getElementById('fallback').hidden = false;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfb49a); // warm dusk base behind the sky dome

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 5000);
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.tgt);

  const station = createStation05(scene);
  scene.add(station.group);

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
    if (!document.hidden) t += dt;   // hidden tab: the park holds still
    station.update(t);
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) window.__rendered = true;
  });
}
