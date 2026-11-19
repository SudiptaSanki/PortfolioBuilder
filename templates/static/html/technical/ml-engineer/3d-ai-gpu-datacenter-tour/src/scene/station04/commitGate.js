// commitGate.js — the trigger (west wall). A portal gantry at the
// hall's entry: a commit lands, the line starts — the webhook made
// physical. Beside it, the pipeline's memory (a stack of recent-build
// plates) and the intake dock, where the trained-model crates from
// Station 03 arrive. Code comes through the gantry; the model comes
// through the dock — an ML pipeline has two inputs, and the room
// shows both. A spur conveyor runs from the dock to the layer stack:
// the weights join the image there, not at the gate.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S04 = STATION04;
const C = S04.commit;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function textPlate(w, h, draw, px = [512, 128]) {
  const tex = canvasTexture(px[0], px[1], draw);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
}

function simplePlate(w, h, lines, { bg = '#f2f3f4', ink = '#14171a', px = [512, 128] } = {}) {
  return textPlate(w, h, (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.fillStyle = ink;
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.font = '700 46px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 17);
    } else {
      g.font = '700 42px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 4);
      g.font = '400 33px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 38);
    }
  }, px);
}

// ---------------------------------------------------------- gantry -----
function buildGantry(group, leds) {
  const steel = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x565d64, ...SURFACE.brushedSteel });
  const [z0, z1] = C.spanZ;
  const zc = (z0 + z1) / 2, span = z1 - z0;

  for (const z of [z0, z1]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.13, C.beamY + 0.12, 0.13), steel);
    upright.position.set(C.gantryX, (C.beamY + 0.12) / 2, z);
    group.add(upright);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.34), darkSteel);
    foot.position.set(C.gantryX, 0.02, z);
    group.add(foot);
    leds.push({ x: C.gantryX - 0.075, y: 1.25, z, color: PALETTE.ledGreen, phase: 0.3, blink: 0 });
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.24, span + 0.26), steel);
  beam.position.set(C.gantryX, C.beamY, zc);
  group.add(beam);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, span - 0.2), darkSteel);
  bar.position.set(C.gantryX, C.beamY - 0.15, zc);
  group.add(bar);
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.012, span - 0.3),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xf4f7f9, emissiveIntensity: 1.4 }));
  strip.position.set(C.gantryX, C.beamY - 0.182, zc);
  group.add(strip);
}

// ------------------------------------------- recent builds (memory) ---
function buildCommitStack(group) {
  const builds = [
    ['#482 · c41a7e2', 'BUILDING', '#14171a'],
    ['#481 · a91bd04', 'PASSED', '#14171a'],
    ['#480 · 7f3e9c1', 'PASSED', '#14171a'],
    ['#479 · e58aa07', 'REJECTED', '#c0272d'],
  ];
  builds.forEach(([sha, state, ink], i) => {
    const plate = simplePlate(0.62, 0.15, [`${sha} · ${state}`], { ink, px: [640, 144] });
    plate.position.set(-S04.room.widthX / 2 + 0.03, 2.02 - i * 0.21, 0.92);
    plate.rotation.y = Math.PI / 2;                 // on the west wall, facing east
    group.add(plate);
  });
  const head = simplePlate(0.62, 0.13, ['RECENT BUILDS'], { bg: '#14171a', ink: '#f2f3f4', px: [640, 128] });
  head.position.set(-S04.room.widthX / 2 + 0.03, 2.3, 0.92);
  head.rotation.y = Math.PI / 2;
  group.add(head);
}

// ------------------------------------------------------------ dock -----
function modelCrate(gold) {
  const crate = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.4, 0.56),
    new THREE.MeshStandardMaterial({ color: PALETTE.trayBody, ...SURFACE.powderCoat }));
  body.position.y = 0.2;
  crate.add(body);
  const trimMat = new THREE.MeshStandardMaterial({
    color: gold ? PALETTE.dgxGold : PALETTE.trayTrim,
    ...(gold ? SURFACE.gold : SURFACE.brushedSteel),
  });
  for (const [dx, dz] of [[-0.27, -0.27], [0.27, -0.27], [-0.27, 0.27], [0.27, 0.27]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.4, 0.035), trimMat);
    post.position.set(dx, 0.2, dz);
    crate.add(post);
  }
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.03, 0.58), trimMat);
  rim.position.y = 0.405;
  crate.add(rim);
  return crate;
}

function buildDock(group) {
  const { x, z } = C.dock;
  const galv = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.16, 1.15), galv);
  deck.position.set(x, 0.08, z);
  group.add(deck);
  const c1 = modelCrate(true);
  c1.position.set(x - 0.3, 0.16, z - 0.22);
  group.add(c1);
  const c2 = modelCrate(true);
  c2.position.set(x + 0.32, 0.16, z + 0.2);
  c2.rotation.y = 0.12;
  group.add(c2);
  const c3 = modelCrate(true);
  c3.position.set(x - 0.15, 0, z + 0.95);
  c3.rotation.y = -0.08;
  group.add(c3);

  const plate = simplePlate(0.98, 0.24,
    ['MODEL ARTIFACT · TRAIN RUN 2026-11-19', 'EVAL PASSED'],
    { bg: '#14171a', ink: '#f2f3f4', px: [1024, 256] });
  plate.position.set(x + 0.69, 0.62, z);
  plate.rotation.y = Math.PI / 2;                  // dock's east face, facing the hall
  group.add(plate);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });
  for (const dz of [-0.42, 0.42]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 5), postMat);
    post.position.set(x + 0.69, 0.31, z + dz);
    group.add(post);
  }
}

// ------------------------------------------------------------ spur -----
// The weights' road: a low conveyor from the dock, along the hall's
// north side, to the layer stack — kept tight to the plant, never
// crossing the room in the air.
function buildSpur(group) {
  const galv = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x565d64, ...SURFACE.brushedSteel });
  const x0 = C.dock.x + 0.55, x1 = S04.stack.x - 0.5;
  const len = x1 - x0, cx = (x0 + x1) / 2, z = -1.5, topY = 0.46;
  const bed = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.5), darkSteel);
  bed.position.set(cx, topY - 0.03, z);
  group.add(bed);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.03), galv);
    rail.position.set(cx, topY + 0.02, z + s * 0.27);
    group.add(rail);
  }
  for (let x = x0 + 0.4; x < x1; x += 1.5) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, topY - 0.06, 0.05), darkSteel);
      leg.position.set(x, (topY - 0.06) / 2, z + s * 0.2);
      group.add(leg);
    }
  }
  // the dock-side ramp joining spur height to the dock deck
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.5), darkSteel);
  ramp.position.set(C.dock.x + 0.35, 0.3, -1.78);
  ramp.rotation.z = 0.32;
  group.add(ramp);
}

export function createCommitGate() {
  const group = new THREE.Group();
  group.name = 's04-commit-gate';
  const leds = [];
  buildGantry(group, leds);
  buildCommitStack(group);
  buildDock(group);
  buildSpur(group);
  group.add(createLEDField(leds));
  return group;
}
