// station06-main.js — standalone Station 06 entry for verification
// (harness contract: ?view=<pose>, window.__rendered after 3 frames,
// hidden-tab-safe accumulated clock with clamped deltas).
// Poses are the inventory's six camera stops (§6), composed from
// believable standing positions in the street; sightline notes are
// kept with each pose.

import * as THREE from 'three';
import { createStation06 } from './scene/station06/station06.js';

const POSES = {
  // 1 · "The block at peak" — above the carriageway at the east
  // end, looking west down the street axis: light pools lead in,
  // the shop row and feeder line flank left, the apartment block
  // flanks right, the hero transformer stands mid-frame under its
  // raking light, the curve wall glows at frame left. (The old SE
  // corner sat behind the near houses — their black roof masses
  // ate the foreground and the street ran out into empty ground.)
  overview: { pos: [52, 13, -3], tgt: [-30, 1, 4] },
  // 2 · "315 kVA, 78%" — three-quarter from the carriageway edge at
  // eye height: fins rake in the streetlight at x −14 (2.6 m west of
  // the structure, clear of the frame's subject), bushings and DO
  // fuses against the sky, story plate at frame right.
  transformer: { pos: [-3.8, 1.75, 1.2], tgt: [-10.2, 5.2, 6.3] },
  // 3 · "The switch that saves the street" — at the kiosk from the
  // street: mimic doors face the camera (their flags 4.6 m away),
  // FRTU at frame left, the transition pole rises behind at x 30,
  // trench covers lead away underfoot.
  rmu: { pos: [22.3, 1.6, 1.6], tgt: [26.4, 1.05, 6.5] },
  // 4 · "You are here" — from the carriageway ENE of the wall,
  // square enough to read, angled enough for parallax to do its
  // work: the section pole (x 30) and its stay wire stand in front
  // of the stats column (world x 30.2–32.5) from due south, so the
  // camera steps east until the wire's projection onto the wall
  // plane falls at/past the panel's west edge (x ≤ 30) along its
  // whole run, and the pole clears the stats by ~7°. The whole 8 m
  // wall still fits the frame; the NOW dot stands on the peak.
  curvewall: { pos: [37.4, 1.9, -0.6], tgt: [34.0, 2.6, 8.13] },
  // 5 · "Under the feeder" — low on the north footpath looking east:
  // poles and sagging conductors recede, the sodium pool (x 16)
  // glows amber mid-frame against LED pools beyond, tea stall warmth
  // at the far end.
  streetlevel: { pos: [0, 1.45, 5.4], tgt: [34, 4.0, 6.2] },
  // 6 · "Where the load lives" — above the apartment roof from the
  // SW, a touch higher and flatter than before: the moon-washed
  // tanks sit centre-frame, dishes along the parapet, the street
  // glowing below, skyline behind and the mobile tower's red
  // aviation lights (x 80, z 30) inside the top of the frame.
  rooftops: { pos: [-40, 23.5, -28], tgt: [6, 8, 10] },
};

const view = new URLSearchParams(location.search).get('view') || 'overview';
const pose = POSES[view] || POSES.overview;

const app = document.getElementById('app');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (e) {
  document.getElementById('fallback').style.display = 'grid';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;          // working night, legible plant
renderer.setClearColor(0x0d1b2e);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1b2e);
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.05, 500);
camera.position.set(...pose.pos);
camera.lookAt(...pose.tgt);

const station = createStation06(scene);
document.getElementById('view-name').textContent = `Station 06 · City Grid at Night — view: ${view}`;

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let frames = 0;
let tAcc = 0;
let lastNow = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt = Math.min((now - lastNow) / 1000, 0.05);   // clamped: no jumps after a stall
  lastNow = now;
  if (!document.hidden) tAcc += dt;                    // freeze while hidden
  station.update(tAcc);
  renderer.render(scene, camera);
  frames += 1;
  if (frames === 3) window.__rendered = true;
}
loop();
