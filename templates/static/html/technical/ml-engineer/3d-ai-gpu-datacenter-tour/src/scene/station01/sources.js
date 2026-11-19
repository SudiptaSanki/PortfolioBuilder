// sources.js — the source gateways on the west wall. Four bays, four
// kinds of plant — NOT four identical boxes (the inventory's
// identical-boxes trap): a gateway half-rack (API events), a storage
// cabinet being drained (database CDC), a wall of sensor nodes (IoT
// telemetry), and a landing plinth with file crates (batch drops).
// Faces are canvas textures, activity is the shared LED field.

import * as THREE from 'three';
import { STATION01, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S01 = STATION01;
const CX = S01.sources.centreX;          // bay body centre x
const FX = S01.sources.faceX;            // bay front plane x

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function tube(points, radius, color, rough = 0.6) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, 40, radius, 6, false);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
  return new THREE.Mesh(geo, mat);
}

const bodyMat = () => new THREE.MeshStandardMaterial({ color: PALETTE.rackBlack, ...SURFACE.powderCoat });
const frameMat = () => new THREE.MeshStandardMaterial({ color: PALETTE.rackFrame, ...SURFACE.powderCoat });

// A plain cabinet shell with a textured front face (the face carries
// the detail — the CRAH/tray discipline from Station 03).
function cabinet(group, { z, w, h, d = S01.sources.bayDepth, faceTex, y0 = 0 }) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), bodyMat());
  body.position.set(CX, y0 + h / 2, z);
  group.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(d + 0.03, 0.04, w + 0.03), frameMat());
  cap.position.set(CX, y0 + h + 0.02, z);
  group.add(cap);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.06, h - 0.06),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.55, metalness: 0.3 }));
  face.position.set(FX + 0.002, y0 + h / 2, z);
  face.rotation.y = Math.PI / 2;
  group.add(face);
  return body;
}

// ------------------------------------------------------------- G1 API ---
function apiFaceTex() {
  return canvasTexture(512, 448, (g, w, h) => {
    g.fillStyle = '#17191c'; g.fillRect(0, 0, w, h);
    const rows = 5, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      g.fillStyle = '#1d2024'; g.fillRect(10, y + 7, w - 20, rh - 14);
      g.fillStyle = '#c8ccd1'; g.fillRect(10, y + 10, w - 20, 3);       // trim
      g.fillStyle = '#0c0d0f';                                          // port cluster
      g.fillRect(w - 190, y + rh * 0.32, 168, rh * 0.4);
      g.fillStyle = '#3d434a';
      for (let i = 0; i < 6; i++) g.fillRect(w - 182 + i * 27, y + rh * 0.38, 19, rh * 0.28);
      g.fillStyle = '#26292e';                                          // vent slats
      for (let x = 22; x < 190; x += 13) g.fillRect(x, y + rh * 0.62, 8, 4);
      g.fillStyle = '#565b62';
      g.beginPath(); g.arc(20, y + rh / 2, 3, 0, 7); g.arc(w - 20, y + rh / 2, 3, 0, 7); g.fill();
    }
  });
}

function buildAPI(group, leds, z) {
  cabinet(group, { z, w: S01.sources.bayWidth, h: 1.15, faceTex: apiFaceTex() });
  const rnd = seeded(31);
  for (let r = 0; r < 5; r++) {
    const y = 0.12 + r * 0.21;
    leds.push({ x: FX + 0.006, y, z: z - 0.5, color: PALETTE.ledGreen, phase: rnd(), blink: 0 });
    // request activity: blue points that flicker in bursts
    leds.push({ x: FX + 0.006, y, z: z + 0.28 + rnd() * 0.2, color: PALETTE.ledBlue, phase: rnd(), blink: 1 });
    if (rnd() < 0.6) leds.push({ x: FX + 0.006, y: y + 0.05, z: z + 0.05, color: PALETTE.ledBlue, phase: rnd(), blink: 1 });
  }
}

// ------------------------------------------------------------- G2 CDC ---
function cdcFaceTex() {
  return canvasTexture(512, 704, (g, w, h) => {
    g.fillStyle = '#141518'; g.fillRect(0, 0, w, h);
    const cols = 4, rows = 8, cw = (w - 24) / cols, chh = (h - 24) / rows;
    const rnd = seeded(17);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 12 + c * cw, y = 12 + r * chh;
        g.fillStyle = '#22252a'; g.fillRect(x + 3, y + 3, cw - 6, chh - 6);   // carrier
        g.fillStyle = '#0e0f11'; g.fillRect(x + 10, y + 9, cw - 26, chh * 0.34); // grip recess
        const latch = ['#2e7d32', '#2456c8', '#8f2f28'][Math.floor(rnd() * 3)];
        g.fillStyle = latch; g.fillRect(x + cw - 17, y + chh * 0.55, 8, chh * 0.3); // release latch
      }
    }
  });
}

function buildCDC(group, leds, z) {
  cabinet(group, { z, w: S01.sources.bayWidth, h: 1.92, faceTex: cdcFaceTex() });
  // the change stream leaving the top — tray discipline, not free-air
  // arcs: straight up from the cabinet top to a ceiling line, east
  // along it, then the drop at the channel head runs INSIDE a slim
  // floor-standing trunking column (real halls feed channels from
  // floor trunking, not hanging ropes): the pair enters the column
  // top and exits it onto the write head. Slim single-fibre runs,
  // clear of the overview camera's near field.
  const ch1 = S01.gallery.channels[1].z;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x24262a, ...SURFACE.powderCoat });
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.0, 0.09), trunkMat);
  trunk.position.set(-3.7, 1.5, -0.57);
  group.add(trunk);
  group.add(tube([
    [CX, 2.02, z], [CX, 2.95, z], [CX + 0.4, 2.95, z], [-3.68, 2.95, z],
    [-3.68, 2.95, -0.59], [-3.68, 1.45, -0.59], [-3.62, 1.18, ch1 - 0.01],
    [-3.55, 1.12, ch1],
  ], 0.013, PALETTE.fibreAqua));
  group.add(tube([
    [CX + 0.08, 2.02, z + 0.12], [CX + 0.08, 2.84, z + 0.12], [CX + 0.48, 2.84, z + 0.12],
    [-3.72, 2.84, z + 0.12], [-3.72, 2.84, -0.55], [-3.72, 1.4, -0.55],
    [-3.5, 1.08, ch1 + 0.1],
  ], 0.009, PALETTE.fibreYellow));
  const rnd = seeded(43);
  for (let i = 0; i < 7; i++) {
    leds.push({
      x: FX + 0.006, y: 0.25 + rnd() * 1.55, z: z - 0.5 + rnd() * 1.0,
      color: PALETTE.ledBlue, phase: rnd(), blink: rnd() < 0.5 ? 0.8 : 0,
    });
  }
}

// ------------------------------------------------------------- G3 IoT ---
function buildIoT(group, leds, z) {
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.7, metalness: 0.3 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 1.3), boardMat);
  board.position.set(-5.94, 1.5, z);
  group.add(board);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 1.34), frameMat());
  rail.position.set(-5.94, 2.28, z);
  group.add(rail);

  // sensor nodes: one InstancedMesh of small dark modules + one of
  // antenna stubs — many tiny voices, told by density
  const cols = 6, rows = 7, n = cols * rows;
  const modGeo = new THREE.BoxGeometry(0.035, 0.105, 0.155);
  const modMat = new THREE.MeshStandardMaterial({ color: 0x1e2126, roughness: 0.6, metalness: 0.25 });
  const mods = new THREE.InstancedMesh(modGeo, modMat, n);
  const stubGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.055, 5);
  const stubMat = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.6 });
  const stubs = new THREE.InstancedMesh(stubGeo, stubMat, n);
  const d = new THREE.Object3D();
  const rnd = seeded(59);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, i++) {
      const mz = z - 0.52 + c * 0.208;
      const my = 0.92 + r * 0.185;
      d.position.set(-5.9, my, mz);
      d.rotation.set(0, 0, 0);
      d.updateMatrix();
      mods.setMatrixAt(i, d.matrix);
      d.position.set(-5.9, my + 0.08, mz + 0.055);
      d.updateMatrix();
      stubs.setMatrixAt(i, d.matrix);
      // slow green heartbeat per node
      leds.push({ x: -5.878, y: my - 0.028, z: mz - 0.055, color: PALETTE.ledGreen, phase: rnd(), blink: 0.85 });
    }
  }
  mods.instanceMatrix.needsUpdate = true;
  stubs.instanceMatrix.needsUpdate = true;
  group.add(mods, stubs);

  // LoRa-style gateway above the field
  const gw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.52), bodyMat());
  gw.position.set(-5.9, 2.48, z);
  group.add(gw);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.34, 6), stubMat);
  ant.position.set(-5.9, 2.7, z + 0.18);
  group.add(ant);
  leds.push({ x: -5.81, y: 2.48, z: z - 0.18, color: PALETTE.ledGreen, phase: 0.3, blink: 0.4 });
}

// ----------------------------------------------------------- G4 batch ---
function crateTex(text) {
  return canvasTexture(256, 170, (g, w, h) => {
    g.fillStyle = '#8f959a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16);
    g.strokeStyle = 'rgba(20,23,26,0.55)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f2f3f4'; g.fillRect(38, 52, w - 76, 66);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 30px Arial, sans-serif';
    g.fillText(text, w / 2, 92);
    g.font = '400 19px Arial, sans-serif';
    g.fillText('FILE DROP · CSV', w / 2, 118);
  });
}

function buildBatch(group, leds, z) {
  const plinthMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.8), plinthMat);
  plinth.position.set(-5.62, 0.11, z - 0.18);
  group.add(plinth);
  // compact file-transfer server on the plinth
  const srv = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.68), bodyMat());
  srv.position.set(-5.62, 0.39, z - 0.18);
  group.add(srv);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.9 });
  const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), ventMat);
  vent.position.set(-5.355, 0.39, z - 0.18);
  vent.rotation.y = Math.PI / 2;
  group.add(vent);
  leds.push(
    { x: -5.352, y: 0.47, z: z - 0.38, color: PALETTE.ledGreen, phase: 0.1, blink: 0 },
    { x: -5.352, y: 0.47, z: z + 0.02, color: PALETTE.ledBlue, phase: 0.6, blink: 0.7 },
  );
  // the stack of file crates waiting for the nightly window
  const crateGeo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
  const labels = ['DROP · MON', 'DROP · TUE', 'DROP · WED'];
  labels.forEach((text, i) => {
    const mat = new THREE.MeshStandardMaterial({ map: crateTex(text), roughness: 0.8 });
    const crate = new THREE.Mesh(crateGeo, [
      mat, mat, new THREE.MeshStandardMaterial({ color: 0x83898e, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0x83898e, roughness: 0.85 }), mat, mat,
    ]);
    crate.position.set(-5.66, 0.15 + i * 0.305, z + 0.38);
    crate.rotation.y = (i - 1) * 0.07;
    group.add(crate);
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(0.53, 0.035, 0.53),
      new THREE.MeshStandardMaterial({ color: 0x767c83, roughness: 0.8 }));
    lid.position.set(crate.position.x, 0.15 + i * 0.305 + 0.165, z + 0.38);
    lid.rotation.y = crate.rotation.y;
    group.add(lid);
  });
}

export function createSources() {
  const group = new THREE.Group();
  group.name = 's01-sources';
  const leds = [];
  const [zApi, zCdc, zIot, zBatch] = S01.sources.bayZ;
  buildAPI(group, leds, zApi);
  buildCDC(group, leds, zCdc);
  buildIoT(group, leds, zIot);
  buildBatch(group, leds, zBatch);
  group.add(createLEDField(leds));
  return group;
}
