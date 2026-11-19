// buildCells.js — the runners (north wall). Three runner cabinets
// facing the line — identical in form, different in state, because
// runners are fungible and that sameness is the fact. Each carries
// three stage chips (LINT / UNIT TEST / BUILD) that light in sequence
// as the build packet passes; their lighting is registered with
// flow.js's build clock, not driven from here. The third cabinet
// stands spun down: dark, door ajar, interior empty — an ephemeral
// runner torn down after its build. That is the SLSA isolation story
// told with furniture: no build inherits another build's dirt, and
// the signing keys were never in this room while building happened.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField, registerStageLight } from './flow.js';

const S04 = STATION04;
const CELLS = S04.cells;

// The packet passes the cells at these fractions of the build cycle
// (flow.js's line window is 0.02–0.30, gantry → stack).
const CELL_TIMES = [0.067, 0.108, 0.149];

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function faceTexture(idx) {
  return canvasTexture(256, 448, (g, w, h) => {
    g.fillStyle = '#17191c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8eaec';
    g.textAlign = 'center';
    g.font = '700 30px Arial, sans-serif';
    g.fillText(`RUNNER 0${idx + 1}`, w / 2, 52);
    g.font = '400 21px Arial, sans-serif';
    g.fillStyle = '#9aa0a6';
    g.fillText('EPHEMERAL · BUILDKIT', w / 2, 84);
    g.fillStyle = '#3a3e44'; g.fillRect(22, 112, w - 44, 2);
    // the stage chips sit in the clear band y 128–300 (their world
    // positions in buildCabinet map to canvas 152–296): title and
    // subtitle stay clear above the divider, vents resume below
    g.fillStyle = '#0c0d0f';
    for (let y = 318; y < h - 30; y += 26) g.fillRect(22, y, w - 44, 13);
  });
}

function chipTexture(label) {
  return canvasTexture(256, 64, (g, w, h) => {
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd88a';
    g.textAlign = 'center';
    g.font = '700 30px Arial, sans-serif';
    g.fillText(label, w / 2, h / 2 + 11);
  });
}

const CHIP_LABELS = ['LINT', 'UNIT TEST', 'BUILD'];

function buildCabinet(group, leds, idx) {
  const x = CELLS.xs[idx];
  const z = CELLS.z;
  const spunDown = idx === CELLS.spunDown;
  const bodyMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackBlack, ...SURFACE.powderCoat });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.5, 0.55), bodyMat);
  body.position.set(x, 0.75, z);
  group.add(body);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.61),
    new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.7 }));
  plinth.position.set(x, 0.03, z);
  group.add(plinth);

  const frontZ = z + 0.276;
  if (!spunDown) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 1.38),
      new THREE.MeshStandardMaterial({ map: faceTexture(idx), roughness: 0.55, metalness: 0.3 }));
    face.position.set(x, 0.78, frontZ);
    group.add(face);

    // stage chips: emissive plates lit in sequence by the build clock
    CHIP_LABELS.forEach((label, k) => {
      const tex = chipTexture(label);
      const mat = new THREE.MeshStandardMaterial({
        map: tex, emissive: PALETTE.ledAmber, emissiveMap: tex,
        emissiveIntensity: 0.12, roughness: 0.5, metalness: 0.2,
      });
      const chip = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), mat);
      chip.position.set(x, 0.95 - k * 0.17, frontZ + 0.006);
      group.add(chip);
      registerStageLight(mat, CELL_TIMES[idx] + k * 0.011, { width: 0.013, base: 0.12, peak: 2.2 });
    });
    leds.push({ x: x - 0.3, y: 1.44, z: frontZ + 0.01, color: PALETTE.ledGreen, phase: idx * 0.31, blink: 0.25 });
  } else {
    // spun down: dark interior behind a door left ajar on its hinge
    const interior = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 1.38, 0.02),
      new THREE.MeshStandardMaterial({ color: PALETTE.interiorDark, roughness: 0.95 }));
    interior.position.set(x, 0.78, z + 0.2);
    group.add(interior);
    const pivot = new THREE.Group();
    pivot.position.set(x - 0.39, 0.78, frontZ);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.42, 0.03), bodyMat);
    door.position.set(0.39, 0, 0.015);
    pivot.add(door);
    const doorFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 1.3),
      new THREE.MeshStandardMaterial({ map: faceTexture(idx), roughness: 0.55, metalness: 0.3 }));
    doorFace.position.set(0.39, 0, 0.033);
    pivot.add(doorFace);
    // its chips ride on the door — and are never registered with the
    // build clock: the runner is gone, so they stay dark forever
    CHIP_LABELS.forEach((label, k) => {
      const tex = chipTexture(label);
      const mat = new THREE.MeshStandardMaterial({
        map: tex, emissive: PALETTE.ledAmber, emissiveMap: tex,
        emissiveIntensity: 0.0, roughness: 0.5, metalness: 0.2,
      });
      const chip = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), mat);
      chip.position.set(0.39, 0.16 - k * 0.16, 0.05);
      pivot.add(chip);
    });
    pivot.rotation.y = -0.62;                       // ajar, swung into the room
    group.add(pivot);
  }
}

function buildSpunDownPlate(group) {
  const tex = canvasTexture(640, 160, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 44px Arial, sans-serif';
    g.fillText('EPHEMERAL', w / 2, 66);
    g.font = '400 36px Arial, sans-serif';
    g.fillText('CLEAN ROOM PER BUILD', w / 2, 118);
  });
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.17),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
  plate.position.set(-1.42, 1.12, -S04.room.depthZ / 2 + 0.03);
  group.add(plate);
}

export function createBuildCells() {
  const group = new THREE.Group();
  group.name = 's04-build-cells';
  const leds = [];
  CELLS.xs.forEach((_, idx) => buildCabinet(group, leds, idx));
  buildSpunDownPlate(group);
  group.add(createLEDField(leds));
  return group;
}
