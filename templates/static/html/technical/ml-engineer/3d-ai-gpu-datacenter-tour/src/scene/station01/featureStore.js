// featureStore.js — the feature vault (cabling.js's role: where it
// connects onward). Along the south wall, the offline store: a deep,
// quiet archive of tall enclosures — full history, few lights. Standing
// apart near the exit, the online store: ONE small bright cabinet,
// fast blue blink, latest values only. A materialisation conduit links
// them (its gold bursts live in flow.js); a registry lectern carries
// the feature catalogue; one conduit leaves east to Station 02.

import * as THREE from 'three';
import { STATION01, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S01 = STATION01;
const V = S01.vault;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function tube(points, radius, color, rough = 0.55) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, 40, radius, 7, false);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.3 });
  return new THREE.Mesh(geo, mat);
}

// -------------------------------------------------------- archive wall --
function archiveFaceTex() {
  return canvasTexture(256, 640, (g, w, h) => {
    g.fillStyle = '#d4d7da'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#a9adb2'; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16);
    g.beginPath(); g.moveTo(w / 2, 14); g.lineTo(w / 2, h - 14); g.stroke();  // door split
    g.fillStyle = '#8b9096';
    g.fillRect(30, h * 0.46, 14, 90); g.fillRect(w - 44, h * 0.46, 14, 90);   // handles
    g.fillStyle = '#2c3034';                                                  // base vent
    for (let x = 24; x < w - 24; x += 12) g.fillRect(x, h - 52, 7, 30);
    g.fillStyle = '#e8eaec'; g.fillRect(52, 40, w - 104, 54);                 // plate field
  });
}

function buildArchive(group, leds) {
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.6, metalness: 0.35 });
  const faceMat = new THREE.MeshStandardMaterial({ map: archiveFaceTex(), roughness: 0.65, metalness: 0.2 });
  for (const x of V.archiveX) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 2.0, 0.5), bodyMat);
    body.position.set(x, 1.0, V.archiveZ);
    group.add(body);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.94), faceMat);
    face.position.set(x, 1.0, V.archiveZ - 0.253);
    face.rotation.y = Math.PI;
    group.add(face);
    // deep and slow: a single steady lamp per enclosure
    leds.push({ x: x + 0.24, y: 1.82, z: V.archiveZ - 0.26, color: PALETTE.ledBlue, phase: x, blink: 0 });
  }
  // header rail the timestamp plates hang from (plates in streamLabels)
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel }));
  rail.position.set(V.archiveX[1], 2.14, V.archiveZ - 0.26);
  group.add(rail);
}

// ------------------------------------------------------- online store ---
function onlineFaceTex() {
  return canvasTexture(384, 640, (g, w, h) => {
    g.fillStyle = '#202329'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 10; r++) {                       // dense key-value node rows
      const y = 26 + r * 60;
      g.fillStyle = '#262a30'; g.fillRect(16, y, w - 32, 46);
      g.fillStyle = '#0c0d0f';
      for (let i = 0; i < 8; i++) g.fillRect(28 + i * 40, y + 12, 30, 22);
      g.fillStyle = '#4a5058';
      for (let i = 0; i < 8; i++) g.fillRect(33 + i * 40, y + 17, 20, 12);
    }
  });
}

function buildOnline(group, leds) {
  const { x, z } = V.online;
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.09, 0.68),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel }));
  plinth.position.set(x, 0.045, z);
  group.add(plinth);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 1.35, 0.6),
    new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }));
  body.position.set(x, 0.09 + 0.675, z);
  group.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 1.29),
    new THREE.MeshStandardMaterial({ map: onlineFaceTex(), roughness: 0.5, metalness: 0.4 }));
  face.position.set(x - 0.312, 0.09 + 0.675, z);
  face.rotation.y = -Math.PI / 2;
  group.add(face);
  // smallness + speed: a dense field of fast blue blink on the west face
  const rnd = seeded(83);
  for (let i = 0; i < 18; i++) {
    leds.push({
      x: x - 0.318, y: 0.3 + rnd() * 1.15, z: z - 0.24 + rnd() * 0.48,
      color: PALETTE.ledBlue, phase: rnd(), blink: 1,
    });
  }
  leds.push({ x: x - 0.318, y: 1.32, z: z - 0.2, color: PALETTE.ledGreen, phase: 0.2, blink: 0 });
  leds.push({ x: x - 0.318, y: 1.32, z: z + 0.2, color: PALETTE.ledGreen, phase: 0.7, blink: 0 });
}

// ------------------------------------------------------------ lectern ---
function lecternTex() {
  const tex = canvasTexture(640, 400, (g, w, h) => {
    g.fillStyle = '#2a2d31'; g.fillRect(0, 0, w, h);
    const cards = [
      { name: 'user_clicks_7d', meta: ['entity · user_id', 'owner · growth-ml', 'v3 · fresh < 15 m'], rot: -0.05, x: 26 },
      { name: 'account_balance_asof', meta: ['entity · account_id', 'owner · risk-ml', 'v7 · fresh < 1 h'], rot: 0.03, x: 218 },
      { name: 'device_events_1h', meta: ['entity · device_id', 'owner · iot-platform', 'v2 · fresh < 5 m'], rot: -0.02, x: 410 },
    ];
    for (const card of cards) {
      g.save();
      g.translate(card.x + 96, 200);
      g.rotate(card.rot);
      g.fillStyle = '#f2f3f4'; g.fillRect(-96, -150, 192, 300);
      g.strokeStyle = '#c9ccd0'; g.lineWidth = 3; g.strokeRect(-96, -150, 192, 300);
      g.fillStyle = '#1d6fd1'; g.fillRect(-96, -150, 192, 14);
      g.fillStyle = '#14171a';
      g.textAlign = 'center';
      g.font = '700 25px Arial, sans-serif';
      const words = card.name.split('_');
      g.fillText(words.slice(0, 2).join('_'), 0, -88);
      if (words.length > 2) g.fillText(words.slice(2).join('_'), 0, -56);
      g.font = '400 21px Arial, sans-serif';
      g.fillStyle = '#44484d';
      card.meta.forEach((line, i) => g.fillText(line, 0, 6 + i * 38));
      g.restore();
    }
  });
  // the box's top-face UVs put the canvas upside-down on the sloped
  // top as seen by the reader standing at it — rotate the texture
  // 180° so the catalogue cards read upright from the viewing side.
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI;
  return tex;
}

function buildLectern(group) {
  const { x, z, rotY } = V.lectern;
  const lect = new THREE.Group();
  lect.position.set(x, 0, z);
  lect.rotation.y = rotY;
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.5 });
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.82, 0.4), deskMat);
  pedestal.position.y = 0.41;
  lect.add(pedestal);
  const slope = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.04, 0.56),
    new THREE.MeshStandardMaterial({ map: lecternTex(), roughness: 0.55, metalness: 0.2 }));
  slope.position.set(0, 0.94, 0.02);
  slope.rotation.x = -0.42;
  lect.add(slope);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.03, 0.03), deskMat);
  lip.position.set(0, 0.845, 0.245);
  lect.add(lip);
  group.add(lect);
}

// ------------------------------------------------------------ conduits --
function buildConduits(group) {
  const galv = PALETTE.galvanised;
  // materialisation: archive wall → online cabinet (bursts ride in
  // flow.js). Tray discipline: up the south wall to a ceiling line,
  // east along it, then a stepped drop onto the cabinet top — no
  // free-air arc over the cabinet.
  group.add(tube([
    [V.archiveX[1], 2.1, V.archiveZ - 0.12],
    [V.archiveX[1], 2.9, V.archiveZ + 0.02],
    [V.archiveX[1] + 0.35, 2.9, V.archiveZ + 0.02],
    [V.online.x, 2.9, V.archiveZ + 0.02],
    [V.online.x, 2.9, V.online.z + 0.12],
    [V.online.x, 1.52, V.online.z + 0.06],
  ], 0.016, galv));
  const rodMat = new THREE.MeshStandardMaterial({ color: galv, roughness: 0.45, metalness: 0.8 });
  for (const [rx, ry, rz] of [[V.archiveX[1] + 0.5, 2.9, V.archiveZ + 0.02], [V.online.x, 2.9, 2.86]]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, S01.room.height - ry, 5), rodMat);
    rod.position.set(rx, (ry + S01.room.height) / 2, rz);
    group.add(rod);
  }
  // exit conduit: online cabinet → through the east wall → Station 02.
  // Frame-hugging, no free-air arcs: east off the cabinet top, south
  // along the wall gap at cabinet-top height, then UP the exit door's
  // right (south) jamb tight against the frame, across the head jamb
  // just above the lintel — below the EXIT sign, clear of its face —
  // and east through the collar into the wall.
  group.add(tube([
    [V.online.x + 0.16, 1.44, V.online.z],
    [5.6, 1.45, 2.4],
    [5.65, 1.46, 2.66],
    [5.65, 1.46, 2.96],
    [5.74, 1.48, 3.05],
    [5.89, 1.56, 3.07],
    [5.9, 1.8, 3.07],
    [5.9, 2.16, 3.07],
    [5.9, 2.27, 3.03],
    [5.9, 2.27, 2.32],
    [5.97, 2.27, 2.25],
    [6.06, 2.27, 2.23],
  ], 0.02, PALETTE.brushedSteel));
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.22), rodMat);
  collar.position.set(5.99, 2.27, 2.23);
  group.add(collar);
}

export function createFeatureStore() {
  const group = new THREE.Group();
  group.name = 's01-feature-store';
  const leds = [];
  buildArchive(group, leds);
  buildOnline(group, leds);
  buildLectern(group);
  buildConduits(group);
  group.add(createLEDField(leds));
  return group;
}
