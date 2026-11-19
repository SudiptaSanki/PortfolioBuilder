// latticeLabels.js — Station 02 signage (labels.js discipline: cheap
// canvas plates, disproportionately convincing). Bay plates on the
// portal frames, the spine's name plate, the FFN press plates, the
// attention board's frame plates and mask plate, the QKV cabinets'
// question plates, the sampling plate at the chute, wayfinding for
// both hand-offs, and the 2017 context plate. Every plate is mounted
// facing its intended viewing side — text reads correctly, never
// mirrored (the Station 01 lesson).

import * as THREE from 'three';
import { STATION02, PALETTE } from '../../config/world.js';

const S02 = STATION02;
const B = S02.blocks;

function textPlate(w, h, draw, px = [512, 128]) {
  const c = document.createElement('canvas');
  c.width = px[0]; c.height = px[1];
  draw(c.getContext('2d'), px[0], px[1]);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
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
      g.font = '700 52px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 19);
    } else {
      g.font = '700 46px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 4);
      g.font = '400 34px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 40);
    }
  }, px);
}

// readable from both sides: two planes back to back, each correct
function doublePlate(w, h, lines, opts = {}) {
  const grp = new THREE.Group();
  const a = simplePlate(w, h, lines, opts);
  const b = simplePlate(w, h, lines, opts);
  b.rotation.y = Math.PI;
  grp.add(a, b);
  return grp;
}

const postMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });

// ----------------------------------------------------------- bays -----
function buildBayPlates(group) {
  B.centresX.forEach((cx, i) => {
    const lines = [`BLOCK ${i + 1}/6`, 'ATTN → FFN · PRE-LN'];
    const south = simplePlate(1.0, 0.2, lines, { bg: '#14171a', ink: '#f2f3f4', px: [768, 144] });
    south.position.set(cx, 2.02, B.spanZ + 0.048);
    group.add(south);
    const north = simplePlate(1.0, 0.2, lines, { bg: '#14171a', ink: '#f2f3f4', px: [768, 144] });
    north.rotation.y = Math.PI;
    north.position.set(cx, 2.02, -B.spanZ - 0.048);
    group.add(north);
  });
}

// ---------------------------------------------------------- spine -----
function buildSpinePlate(group) {
  // a nameplate flat on the spine rail's south cheek at waist
  // height — half the old free-standing sign, readable from the
  // south walkway, never a billboard spanning the corridor
  const plate = simplePlate(0.55, 0.11, ['RESIDUAL STREAM', 'x + SUBLAYER(x)'], { px: [768, 152] });
  plate.position.set(-4.45, S02.spine.y, S02.spine.z + 0.068);
  group.add(plate);
}

// ---------------------------------------------------------- press -----
function buildPressPlates(group) {
  for (const cx of B.centresX) {
    const lines = ['FFN 512 → 2048 → 512 · GELU'];
    const south = simplePlate(0.66, 0.12, lines, { px: [1024, 96] });
    south.position.set(cx, 0.62, 0.49);
    group.add(south);
    const north = simplePlate(0.66, 0.12, lines, { px: [1024, 96] });
    north.rotation.y = Math.PI;
    north.position.set(cx, 0.62, -0.49);
    group.add(north);
  }
}

// ---------------------------------------------------------- board -----
function buildBoardPlates(group) {
  const head = simplePlate(1.5, 0.17, ['ROWS = QUERIES · COLUMNS = KEYS'], { bg: '#14171a', ink: '#f2f3f4', px: [1408, 160] });
  head.position.set(S02.board.x, 2.8, -S02.room.depthZ / 2 + 0.04);
  group.add(head);
  const mask = simplePlate(0.88, 0.21, ['MASKED · −∞ BEFORE SOFTMAX', 'WEIGHT = 0'], { bg: '#3c4147', ink: '#f2f3f4', px: [1024, 168] });
  mask.position.set(0.62, 1.95, S02.board.z + 0.035);
  group.add(mask);
}

// ------------------------------------------------------- cabinets -----
function buildCabinetPlates(group) {
  const plates = [
    ['QUERY', 'WHAT AM I LOOKING FOR?'],
    ['KEY', 'WHAT DO I OFFER?'],
    ['VALUE', 'WHAT DO I CARRY?'],
    ['OUTPUT', 'HEADS → ONE VECTOR'],
  ];
  S02.qkv.xs.forEach((x, i) => {
    const plate = simplePlate(0.58, 0.27, plates[i], { px: [768, 288] });
    plate.rotation.y = Math.PI;                    // faces −Z, into the room
    plate.position.set(x, 0.32, S02.qkv.frontZ - 0.1);
    group.add(plate);
    for (const dx of [-0.22, 0.22]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.19, 5), postMat);
      post.position.set(x + dx, 0.095, S02.qkv.frontZ - 0.1);
      group.add(post);
    }
  });
}

// ---------------------------------------------------------- chute -----
function buildChutePlate(group) {
  const plate = doublePlate(0.78, 0.15, ['SAMPLE → APPEND → REPEAT'], { bg: '#14171a', ink: '#f2f3f4', px: [1024, 120] });
  plate.position.set(5.6, 0.3, 0.48);
  group.add(plate);
  for (const dx of [-0.3, 0.3]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.22, 5), postMat);
    post.position.set(5.6 + dx, 0.11, 0.48);
    group.add(post);
  }
}

// ----------------------------------------------------- wayfinding -----
function exitPlate() {
  const p = textPlate(0.52, 0.19, (g, w, h) => {
    g.fillStyle = '#0a8a3c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = '700 54px Arial, sans-serif';
    g.fillText('EXIT ▸', w / 2, 63);
  }, [256, 96]);
  p.material = new THREE.MeshBasicMaterial({ map: p.material.map });
  return p;
}

function buildWayfinding(group) {
  const W2 = S02.room.widthX / 2;
  const doorZ = S02.tokenRail.entryDoorZ;

  const inPlate = simplePlate(0.95, 0.2, ['← FEATURE VECTORS IN'], { bg: '#14171a', ink: '#f2f3f4', px: [768, 128] });
  inPlate.rotation.y = Math.PI / 2;                // west wall, faces +X into the room
  inPlate.position.set(-W2 + 0.04, 2.62, doorZ);
  group.add(inPlate);

  const exitW = exitPlate();
  exitW.rotation.y = Math.PI / 2;
  exitW.position.set(-W2 + 0.06, 2.42, doorZ);
  group.add(exitW);

  const outPlate = simplePlate(1.15, 0.26, ['HIDDEN STATES →', 'GPU TRAINING CLUSTER'], { bg: '#14171a', ink: '#f2f3f4', px: [768, 176] });
  outPlate.rotation.y = -Math.PI / 2;              // east wall, faces −X into the room
  outPlate.position.set(W2 - 0.04, 2.42, 0.9);
  group.add(outPlate);

  const exitE = exitPlate();
  exitE.rotation.y = -Math.PI / 2;
  exitE.position.set(W2 - 0.06, 2.42, doorZ);
  group.add(exitE);
}

// -------------------------------------------------------- context -----
function buildContextPlate(group) {
  const plate = simplePlate(2.3, 0.3,
    ['ENCODER–DECODER, 2017 · THIS HALL IS THE DECODER STACK', 'N = 6 · d = 512 · h = 8'],
    { px: [1600, 208] });
  plate.position.set(-3.9, 2.52, -S02.room.depthZ / 2 + 0.04);
  group.add(plate);
  const scale = simplePlate(1.7, 0.14, ['SIX BLOCKS SHOWN · PRODUCTION MODELS STACK 12 TO 96+'], { px: [1400, 96] });
  scale.position.set(-3.9, 2.3, -S02.room.depthZ / 2 + 0.04);
  group.add(scale);
}

export function createLatticeLabels() {
  const group = new THREE.Group();
  group.name = 's02-labels';
  buildBayPlates(group);
  buildSpinePlate(group);
  buildPressPlates(group);
  buildBoardPlates(group);
  buildCabinetPlates(group);
  buildChutePlate(group);
  buildWayfinding(group);
  buildContextPlate(group);
  return group;
}
