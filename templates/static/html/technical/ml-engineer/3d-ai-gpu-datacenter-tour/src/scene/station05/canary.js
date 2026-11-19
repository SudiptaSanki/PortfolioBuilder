// canary.js — the Canary Rollout (HERO — blocks.js / streams.js's
// role). Two version lanes of seated pod capsules, the traffic-
// split gate at their head, the analysis lectern that watches the
// canary's vital signs, and the HPA governor with its pending
// cradle. The gate is the only mechanism in the hall that MOVES,
// and it moves only at step changes — a rollout is a staircase,
// not a slide: v2 earns 10 → 25 → 50 → 100 while the lectern's
// analysis passes, and the traffic in flow.js splits in the same
// ratio. Replica math is not traffic math: both ReplicaSets stay
// fully seated (10 + 10); the GATE splits requests, the lanes
// hold capacity. Capsules never move — a seated pod is a running
// process, not a vehicle.

import * as THREE from 'three';
import { STATION05, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField, canaryStepAt, CANARY_STEPS } from './flow.js';
import { createCapsuleField } from './nodes.js';
import { buildLectern } from './rolloutDock.js';

const S05 = STATION05;
const L = S05.lanes;
const GATE = S05.gate;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function simplePlate(w, h, lines, { bg = '#f2f3f4', ink = '#14171a', px = [512, 128], mono = false } = {}) {
  const tex = canvasTexture(px[0], px[1], (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.fillStyle = ink;
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.font = `700 ${mono ? 46 : 52}px ${mono ? '"Courier New", monospace' : 'Arial, sans-serif'}`;
      g.fillText(lines[0], cw / 2, ch / 2 + 18);
    } else {
      g.font = '700 46px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 4);
      g.font = '400 34px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 42);
    }
  });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
}

// ---------------------------------------------------------------- lanes --
function buildLane(group, leds, capsules, lane, isV2) {
  const z = lane.z;
  const cx = (L.x0 + L.x1) / 2, len = L.x1 - L.x0;
  const steelMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: 0.55, metalness: 0.4 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.56), deckMat);
  deck.position.set(cx, L.bedTopY - 0.03, z);
  group.add(deck);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.045), steelMat);
    rail.position.set(cx, L.bedTopY + 0.015, z + s * 0.28);
    group.add(rail);
  }
  if (isV2) {                       // gold trim: the new version is the refined thing
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.02, 0.05),
      new THREE.MeshStandardMaterial({ color: PALETTE.dgxGold, ...SURFACE.gold }));
    trim.position.set(cx, L.bedTopY + 0.07, z + 0.28);
    group.add(trim);
  }
  for (const ex of [L.x0, L.x1]) {   // end posts
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.05), steelMat);
    post.position.set(ex, 0.17, z - 0.28);
    group.add(post);
    const post2 = post.clone();
    post2.position.z = z + 0.28;
    group.add(post2);
  }
  // seats + capsules + readiness lamps
  const sockGeo = new THREE.CylinderGeometry(0.105, 0.115, 0.025, 16);
  const sockMat = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.5, metalness: 0.5 });
  const sockets = new THREE.InstancedMesh(sockGeo, sockMat, L.seats);
  const ringGeo = new THREE.TorusGeometry(0.108, 0.008, 6, 20);
  const rings = isV2
    ? new THREE.InstancedMesh(ringGeo, new THREE.MeshStandardMaterial({ color: PALETTE.dgxGold, ...SURFACE.gold }), L.seats)
    : null;
  const d = new THREE.Object3D();
  for (let i = 0; i < L.seats; i++) {
    const sx = L.x0 + L.pitch / 2 + i * L.pitch;
    d.position.set(sx, L.bedTopY + 0.012, z);
    d.rotation.set(0, 0, 0);
    d.updateMatrix();
    sockets.setMatrixAt(i, d.matrix);
    if (rings) {
      d.rotation.set(Math.PI / 2, 0, 0);
      d.position.y = L.bedTopY + 0.026;
      d.updateMatrix();
      rings.setMatrixAt(i, d.matrix);
    }
    capsules.push({ x: sx, y: 0.4, z, tint: isV2 ? 0xf3e2b3 : 0xf2f3f4 });
    leds.push({ x: sx, y: 0.58, z: z + 0.1, color: PALETTE.ledGreen, phase: i * 0.37 + z, blink: 0.2 });
  }
  sockets.instanceMatrix.needsUpdate = true;
  group.add(sockets);
  if (rings) { rings.instanceMatrix.needsUpdate = true; group.add(rings); }
  // east end plate: the ReplicaSet and its count, facing back west
  const plate = simplePlate(0.66, 0.19,
    [`REPLICASET ${isV2 ? 'v2' : 'v1'} · 10 PODS`],
    { bg: isV2 ? '#c9a24d' : '#9fa6ad', ink: '#14171a', px: [768, 128], mono: true });
  plate.position.set(L.x1 + 0.06, 0.62, z);
  plate.rotation.y = -Math.PI / 2;
  group.add(plate);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.03), steelMat);
    post.position.set(L.x1 + 0.06, 0.31, z + s * 0.3);
    group.add(post);
  }
}

// ----------------------------------------------------------------- gate --
let _vane = null;
let _drum = null;

function drumFaceTex(v1, v2) {
  return canvasTexture(512, 352, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, 58);
    g.fillStyle = '#f2f3f4'; g.textAlign = 'center';
    g.font = '700 30px Arial, sans-serif';
    g.fillText('TRAFFIC SPLIT', w / 2, 40);
    g.fillStyle = '#14171a';
    // 62px, measured: at 92px every reading is 717.7px wide on this
    // 512px canvas (outer glyphs off-canvas); at 62px all four
    // readings measure 483.7px — 14px of padding a side, centred.
    g.font = '700 62px "Courier New", monospace';
    g.fillText(`v1 ${v1} · v2 ${v2}`, w / 2, 218);
    g.font = '400 30px Arial, sans-serif'; g.fillStyle = '#44484d';
    g.fillText('SHARE OF REQUESTS', w / 2, 292);
  });
}

function buildGate(group, leds) {
  const postMat = new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: 0.5, metalness: 0.6 });
  for (const pz of [1.24, 2.76]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.66, 0.09), postMat);
    post.position.set(GATE.x, 0.83, pz);
    group.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.66), postMat);
  beam.position.set(GATE.x, 1.68, GATE.z);
  group.add(beam);

  // the percentage drum: a square-section drum on a z axis. Each
  // reading is built in the west-facing pose inside its own pivot;
  // pivot k is pre-rotated −k·90°, so stepping the drum +90° brings
  // reading k to the west face, upright, in order — a staircase
  // you can watch, never a sweep.
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.03), postMat);
    cheek.position.set(GATE.x, 1.48, GATE.z + s * 0.25);
    group.add(cheek);
  }
  const drum = new THREE.Group();
  drum.position.set(GATE.x, 1.32, GATE.z);
  const drumBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.5, metalness: 0.5 }));
  drum.add(drumBody);
  const readings = [[90, 10], [75, 25], [50, 50], [0, 100]];
  readings.forEach(([v1, v2], k) => {
    const pivot = new THREE.Group();
    pivot.rotation.z = -k * Math.PI / 2;
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.26),
      new THREE.MeshStandardMaterial({ map: drumFaceTex(v1, v2), roughness: 0.55, metalness: 0.1 }));
    plate.position.set(-0.152, 0, 0);
    plate.rotation.y = -Math.PI / 2;
    pivot.add(plate);
    drum.add(pivot);
  });
  group.add(drum);
  _drum = drum;

  // the vane: one blade on a vertical pivot at the lane divider,
  // angled toward the lane it is feeding less — it deflects, it
  // does not sweep. Steel with an aqua edge (the traffic's colour).
  const vane = new THREE.Group();
  vane.position.set(GATE.x, 0, GATE.z);
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.14, 10),
    new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }));
  rod.position.y = 0.85;
  vane.add(rod);
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.8, 0.035),
    new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }));
  blade.position.set(0.3, 0.78, 0);
  vane.add(blade);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: PALETTE.fibreAqua, roughness: 0.5, metalness: 0.2 }));
  stripe.position.set(0.3, 1.1, 0);
  vane.add(stripe);
  group.add(vane);
  _vane = vane;

  // gate lamp + the v2 lane's image tag, hanging off the beam
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.05, 10), postMat);
  lampBase.position.set(GATE.x, 1.76, GATE.z);
  group.add(lampBase);
  leds.push({ x: GATE.x, y: 1.82, z: GATE.z, color: PALETTE.ledGreen, phase: 0.1, blink: 0 });
  const tag = simplePlate(0.56, 0.15, ['IMAGE model-api:v2.0'],
    { bg: '#14171a', ink: '#c9a24d', px: [768, 128], mono: true });
  tag.position.set(GATE.x - 0.048, 1.44, 2.76);   // mounted on the gate's south post
  tag.rotation.y = -Math.PI / 2;
  group.add(tag);
}

// ------------------------------------------------------- analysis lectern --
// The gate's evidence, on a lectern beside it. Two dials (drawn
// needles resting in the green) and a step plate that is REDRAWN
// when — and only when — the rollout steps: event-driven, a few
// times a cycle, not per frame.
let _analysis = null;

function drawAnalysis(step) {
  if (!_analysis) return;
  const { g, w, h, tex } = _analysis;
  const v2 = CANARY_STEPS[step];
  g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#14171a'; g.fillRect(0, 0, w, 60);
  g.fillStyle = '#f2f3f4'; g.textAlign = 'left';
  g.font = '700 30px Arial, sans-serif';
  g.fillText('ANALYSIS · ARGO ROLLOUTS', 26, 40);
  const dial = (cx, label, value) => {
    g.beginPath(); g.arc(cx, 148, 62, Math.PI * 0.85, Math.PI * 2.15);
    g.strokeStyle = '#c9ccd0'; g.lineWidth = 13; g.stroke();
    g.beginPath(); g.arc(cx, 148, 62, Math.PI * 0.85, Math.PI * 1.45);
    g.strokeStyle = '#39ff7a'; g.stroke();
    g.beginPath(); g.arc(cx, 148, 62, Math.PI * 1.45, Math.PI * 2.15);
    g.strokeStyle = '#ffb02e'; g.stroke();
    const na = Math.PI * 1.18;                       // needle rests in the green
    g.strokeStyle = '#14171a'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx, 148);
    g.lineTo(cx + 48 * Math.cos(na), 148 + 48 * Math.sin(na)); g.stroke();
    g.fillStyle = '#14171a'; g.textAlign = 'center';
    g.font = '700 30px Arial, sans-serif';
    g.fillText(value, cx, 252);
    g.font = '400 23px Arial, sans-serif'; g.fillStyle = '#44484d';
    g.fillText(label, cx, 284);
    g.textAlign = 'left';
  };
  dial(150, 'SUCCESS RATE ≥ 99%', '99.7%');
  dial(490, 'P99 ≤ 500 ms', '212 ms');
  g.strokeStyle = '#c9ccd0'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(26, 316); g.lineTo(w - 26, 316); g.stroke();
  g.fillStyle = '#14171a';
  g.font = '700 34px "Courier New", monospace';
  g.fillText(`STEP · v2 AT ${v2}%`, 26, 366);
  g.font = '400 26px Arial, sans-serif'; g.fillStyle = '#44484d';
  g.fillText(step < 3 ? `NEXT ${CANARY_STEPS[step + 1]} AFTER ANALYSIS PASSES` : 'FULLY PROMOTED · v2 IS STABLE', 26, 406);
  g.fillStyle = '#0a8a3c';
  g.font = '700 28px Arial, sans-serif';
  g.fillText('● ANALYSIS · PASSING', 26, 444);
  tex.needsUpdate = true;
}

function analysisTex() {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 464;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _analysis = { g: c.getContext('2d'), w: 640, h: 464, tex };
  drawAnalysis(0);
  return tex;
}

// ------------------------------------------------------------------- HPA --
function hpaFaceTex() {
  return canvasTexture(384, 768, (g, w, h) => {
    g.fillStyle = '#202329'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4'; g.textAlign = 'center';
    g.font = '700 34px Arial, sans-serif';
    g.fillText('HPA GOVERNOR', w / 2, 52);
    g.beginPath(); g.arc(w / 2, 190, 88, Math.PI * 0.85, Math.PI * 2.15);
    g.strokeStyle = '#3d434a'; g.lineWidth = 16; g.stroke();
    g.beginPath(); g.arc(w / 2, 190, 88, Math.PI * 0.85, Math.PI * 1.62);
    g.strokeStyle = '#39ff7a'; g.stroke();
    const na = Math.PI * 1.58;
    g.strokeStyle = '#f2f3f4'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(w / 2, 190);
    g.lineTo(w / 2 + 66 * Math.cos(na), 190 + 66 * Math.sin(na)); g.stroke();
    g.fillStyle = '#f2f3f4'; g.font = '700 44px "Courier New", monospace';
    g.fillText('REPLICAS 10', w / 2, 356);
    g.font = '400 28px Arial, sans-serif'; g.fillStyle = '#9aa0a6';
    g.fillText('TARGET CPU 65%', w / 2, 398);
    g.strokeStyle = '#3d434a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(30, 440); g.lineTo(w - 30, 440); g.stroke();
    g.fillStyle = '#c8ccd1'; g.font = '400 27px Arial, sans-serif';
    g.fillText('DESIRED = ⌈CURRENT ×', w / 2, 500);
    g.fillText('METRIC ÷ TARGET⌉', w / 2, 544);
    g.fillText('CHECKED EVERY 15 s', w / 2, 612);
    g.fillStyle = '#9aa0a6'; g.font = '400 24px Arial, sans-serif';
    g.fillText('Scale-down waits 300 s —', w / 2, 676);
    g.fillText('a lull sheds no pods.', w / 2, 710);
  });
}

function buildHPA(group, leds, capsules) {
  const { x, z, cradleX } = S05.hpa;
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.09, 0.72),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel }));
  plinth.position.set(x, 0.045, z);
  group.add(plinth);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 1.3, 0.62),
    new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }));
  body.position.set(x, 0.09 + 0.65, z);
  group.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 1.24),
    new THREE.MeshStandardMaterial({ map: hpaFaceTex(), roughness: 0.5, metalness: 0.35 }));
  face.position.set(x - 0.277, 0.09 + 0.65, z);
  face.rotation.y = -Math.PI / 2;
  group.add(face);
  leds.push({ x: x - 0.28, y: 1.32, z: z - 0.2, color: PALETTE.ledGreen, phase: 0.3, blink: 0.25 });

  // the pending cradle: pods the HPA has asked for, waiting on the
  // scheduler — a request and a queue, not a pop-in
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: 0.5, metalness: 0.6 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.62), frameMat);
  deck.position.set(cradleX, 0.3, z);
  group.add(deck);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), frameMat);
    leg.position.set(cradleX + s * 0.24, 0.15, z - 0.26);
    group.add(leg);
    const leg2 = leg.clone();
    leg2.position.z = z + 0.26;
    group.add(leg2);
  }
  for (let i = 0; i < 3; i++) {
    const cz = z - 0.19 + i * 0.19;
    capsules.push({ x: cradleX, y: 0.325 + 0.145, z: cz, tint: 0xe3e6e9 });
    leds.push({ x: cradleX - 0.05, y: 0.66, z: cz, color: PALETTE.ledAmber, phase: i * 0.4, blink: 0.9 });
  }
  const pending = simplePlate(0.4, 0.13, ['PENDING · 3'], { ink: '#b97a0e', px: [512, 144] });
  pending.position.set(cradleX - 0.3, 0.52, z);
  pending.rotation.y = -Math.PI / 2;
  group.add(pending);
}

// --------------------------------------------------------------- assembly --
export function createCanary() {
  const group = new THREE.Group();
  group.name = 's05-canary';
  const leds = [];
  const capsules = [];
  buildLane(group, leds, capsules, L.v1, false);
  buildLane(group, leds, capsules, L.v2, true);
  buildGate(group, leds);
  group.add(buildLectern({
    x: GATE.lectern.x, z: GATE.lectern.z, rotY: GATE.lectern.rotY,
    panelTex: analysisTex(), width: 0.88,
  }));
  leds.push({ x: GATE.lectern.x - 0.08, y: 1.3, z: GATE.lectern.z, color: PALETTE.ledGreen, phase: 0.6, blink: 0 });
  buildHPA(group, leds, capsules);
  group.add(createCapsuleField(capsules));
  group.add(createLEDField(leds));
  return group;
}

// ------------------------------------------------------------------ tick --
// The hall's single mechanical exception, driven by the same step
// value the traffic shader reads. Work per frame: two eased angles
// and, on the rare step change, one canvas redraw — nothing else.
let _lastT = 0;
let _lastStep = -1;
let _vaneAngle = 0.5;
let _drumTarget = 0;

export function tickCanary(t) {
  const dt = Math.min(Math.max(t - _lastT, 0), 0.1);
  _lastT = t;
  const step = canaryStepAt(t);
  if (step !== _lastStep) {
    if (_lastStep === -1) {
      _drumTarget = step * Math.PI / 2;              // first frame: snap, don't spin
      if (_drum) _drum.rotation.z = _drumTarget;
      _vaneAngle = 0.5 - (CANARY_STEPS[step] / 100);
      if (_vane) _vane.rotation.y = _vaneAngle;
    } else {
      _drumTarget += Math.PI / 2;                    // steps only ever advance one face
    }
    _lastStep = step;
    drawAnalysis(step);
  }
  const k = 1 - Math.exp(-dt * 2.2);
  const vaneTarget = 0.5 - (CANARY_STEPS[step] / 100) * 1.0;
  _vaneAngle += (vaneTarget - _vaneAngle) * k;
  if (_vane) _vane.rotation.y = _vaneAngle;
  if (_drum) {
    const cur = _drum.rotation.z;
    _drum.rotation.z = cur + (_drumTarget - cur) * k;
  }
}
