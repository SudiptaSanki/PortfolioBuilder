// qkv.js — the QKV projection cabinets (south wall, beside the hero
// bay): the learned projection matrices as plant. Three tall, narrow
// cabinets — W_Q, W_K, W_V — identical in form, differing only in
// their labels, because that sameness is the fact: the same operation
// with three different learned matrices. Each face is a wall of small
// dials (the weight matrix as hardware). A fourth cabinet, W_O,
// stands after them: the output projection that folds the eight
// heads back into one vector. Their question plates (QUERY — WHAT AM
// I LOOKING FOR? …) hang beneath each cabinet, in latticeLabels.js.

import * as THREE from 'three';
import { STATION02, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S02 = STATION02;
const Q = S02.qkv;
export const QKV_NAMES = ['W_Q', 'W_K', 'W_V', 'W_O'];

// A cabinet face: title band + a grid of dials, each dial a small
// circle with a needle at a seeded angle — a matrix you could read
// with a screwdriver.
function dialFaceTexture(name, seed) {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 1024;
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  g.fillStyle = '#1b1e22'; g.fillRect(0, 0, 384, 1024);
  g.fillStyle = '#f2f3f4';
  g.textAlign = 'center';
  g.font = '700 74px "Courier New", monospace';
  g.fillText(name, 192, 104);
  g.strokeStyle = '#3a3f42'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(24, 140); g.lineTo(360, 140); g.stroke();
  const cols = 5, rows = 11, cw = 360 / cols, chh = 76;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const cx = 12 + col * cw + cw / 2, cy = 168 + r * chh + chh / 2;
      g.strokeStyle = '#9aa0a6'; g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, 24, 0, Math.PI * 2); g.stroke();
      const a = rnd() * Math.PI * 2;
      g.strokeStyle = '#2fb7c9'; g.lineWidth = 4;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19);
      g.stroke();
      g.fillStyle = '#5a6169';
      g.beginPath(); g.arc(cx, cy, 3.5, 0, Math.PI * 2); g.fill();
    }
  }
  g.fillStyle = '#5a6169';
  g.font = '400 27px Arial, sans-serif';
  g.fillText('512 × 512 · LEARNED', 192, 990);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildCabinet(x, name, seed) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: PALETTE.steel, ...SURFACE.powderCoat });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x878e96, ...SURFACE.powderCoat });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.55), frameMat);
  plinth.position.set(x, 0.05, Q.z);
  g.add(plinth);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.86, 0.45), bodyMat);
  body.position.set(x, 1.03, Q.z);
  g.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.49), frameMat);
  cap.position.set(x, 1.985, Q.z);
  g.add(cap);

  // face looks −Z into the room (rotation.y = π — the south-wall
  // discipline Station 01 verified) so the dials and title read right
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.54, 1.72),
    new THREE.MeshStandardMaterial({ map: dialFaceTexture(name, seed), roughness: 0.6, metalness: 0.05 }));
  face.rotation.y = Math.PI;
  face.position.set(x, 1.04, Q.frontZ - 0.005);
  g.add(face);

  const leds = [];
  for (let i = 0; i < 6; i++) {
    leds.push({
      x: x + 0.26, y: 1.72 - i * 0.24, z: Q.frontZ - 0.012,
      color: i % 3 ? PALETTE.ledBlue : PALETTE.ledGreen, phase: (seed + i) / 10, blink: 0.45,
    });
  }
  g.add(createLEDField(leds));
  return g;
}

export function createQKV() {
  const group = new THREE.Group();
  group.name = 's02-qkv';
  Q.xs.forEach((x, i) => group.add(buildCabinet(x, QKV_NAMES[i], 500 + i * 37)));
  return group;
}
