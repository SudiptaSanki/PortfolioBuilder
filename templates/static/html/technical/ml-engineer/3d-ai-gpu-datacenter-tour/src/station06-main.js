// station06-main.js — standalone Station 06 entry for verification
// (same harness contract as station01-main.js: ?view=<pose>,
// window.__rendered after 3 frames, hidden-tab-safe accumulated clock).
// Poses are the inventory's camera stops: the flight corridor runs at
// z ≈ −1.2 (north of the console arc), and the journey ends at the
// dais rest, ~3 m from the map face — the ISO 11064 viewing distance.

import * as THREE from 'three';
import { createStation06 } from './scene/station06/station06.js';

const POSES = {
  overview:  { pos: [-5.45, 1.95, -1.45], tgt: [4.6, 1.25, 0.15] },   // door diagonal: consoles, gauges, map curve
  pipeline:  { pos: [-4.75, 1.6, 1.3],    tgt: [2.6, 1.1, 3.05] },    // the Collector run, entry conduit in frame left
  signals:   { pos: [-2.8, 1.5, -0.8],    tgt: [-0.35, 0.9, 0.85] },  // the arc of four, screens legible
  waterfall: { pos: [-1.45, 1.5, -0.2],   tgt: [-1.48, 1.08, -3.3] }, // pulled back: whole cabinet face + flanking plates fit
  budget:    { pos: [2.05, 1.5, -0.1],    tgt: [4.0, 1.05, -2.7] },   // from above the dais: bank + policy plate both fit
  world:     { pos: [2.0, 1.62, 0],       tgt: [5.35, 1.45, 0] },     // DAIS REST — the journey's end
};

const view = new URLSearchParams(location.search).get('view') || 'overview';
const pose = POSES[view] || POSES.overview;

const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  document.getElementById('nogl').style.display = 'grid';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;          // dim room, legible plant
renderer.setClearColor(0x0b0e13);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e13);
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.05, 120);
camera.position.set(...pose.pos);
camera.lookAt(...pose.tgt);

const station = createStation06(scene);
document.getElementById('cap').textContent = `Station 06 · Observatory — view: ${view}`;

let frames = 0;
let tAcc = 0;
let lastNow = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt = Math.min((now - lastNow) / 1000, 0.05);
  lastNow = now;
  tAcc += dt;
  station.update(tAcc);
  renderer.render(scene, camera);
  frames += 1;
  if (frames === 3) window.__rendered = true;
}
loop();
