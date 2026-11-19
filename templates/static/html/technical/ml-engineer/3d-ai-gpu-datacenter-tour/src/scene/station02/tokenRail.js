// tokenRail.js — the token rail (west wall): where feature vectors
// arriving from Station 01 become tokens. Eight standing plates carry
// the worked sentence — `the cat sat on the mat , .` — each with its
// position number beneath it, because attention has no notion of
// order and position must be added as plant, not as glow. Beside the
// rail, the embedding cabinet: the lookup table (token id → vector,
// plus position) as furniture. A slim conduit tight to the west wall
// feeds the rail from Station 01's exit.

import * as THREE from 'three';
import { STATION02, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S02 = STATION02;
const TR = S02.tokenRail;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// One token plate: token text large, position number beneath. The
// face plane looks +X into the room (rotation.y = π/2, the west-wall
// discipline Station 01 verified) so the text reads correctly from
// the hall.
function tokenPlate(token, pos) {
  const tex = canvasTexture(256, 288, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#14171a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 92px Georgia, "Times New Roman", serif';
    g.fillText(token, w / 2, 138);
    g.fillStyle = '#5a6169';
    g.font = '700 44px "Courier New", monospace';
    g.fillText(`pos ${pos}`, w / 2, 228);
    g.fillStyle = '#2fb7c9';
    g.fillRect(w / 2 - 30, 248, 60, 7);
  });
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.4),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
  face.rotation.y = Math.PI / 2;
  return face;
}

function buildRail(group) {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3c4147, ...SURFACE.paintedMetal });
  const steelMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const zC = TR.z0 + 3.5 * TR.pitch;                    // rail centre z
  const railLen = 8 * TR.pitch + 0.3;

  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, railLen), steelMat);
  bar.position.set(TR.x, TR.railY - 0.025, zC);
  group.add(bar);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, railLen), frameMat);
  plinth.position.set(TR.x, 0.02, zC);
  group.add(plinth);
  const postGeo = new THREE.BoxGeometry(0.05, TR.railY - 0.07, 0.05);
  for (let z = TR.z0 - 0.3; z <= TR.z0 + 7 * TR.pitch + 0.31; z += 1.05) {
    const post = new THREE.Mesh(postGeo, frameMat);
    post.position.set(TR.x, (TR.railY - 0.07) / 2 + 0.02, z);
    group.add(post);
  }

  const backGeo = new THREE.BoxGeometry(0.025, 0.48, 0.4);
  const backMat = new THREE.MeshStandardMaterial({ color: 0x24262a, ...SURFACE.powderCoat });
  const leds = [];
  S02.tokens.forEach((tok, i) => {
    const z = TR.z0 + i * TR.pitch;
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(TR.x - 0.012, TR.railY + 0.26, z);
    group.add(back);
    const face = tokenPlate(tok, i);
    face.position.set(TR.x + 0.002, TR.railY + 0.26, z);
    group.add(face);
    leds.push({ x: TR.x + 0.01, y: TR.railY + 0.52, z: z - 0.15, color: PALETTE.fibreAqua, phase: i / 8, blink: 0 });
  });
  group.add(createLEDField(leds));
}

// The embedding cabinet: a compact lookup-table cabinet in the
// Station 03 tray language — a grid of table cells on its face, the
// operation written out beneath the title.
function buildEmbeddingCabinet(group) {
  const E = TR.embedCabinet;
  const bodyMat = new THREE.MeshStandardMaterial({ color: PALETTE.trayBody, ...SURFACE.powderCoat });
  const frameMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackFrame, ...SURFACE.powderCoat });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.86), frameMat);
  plinth.position.set(E.x, 0.05, E.z);
  group.add(plinth);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.42, 0.8), bodyMat);
  body.position.set(E.x, 0.81, E.z);
  group.add(body);

  const tex = canvasTexture(512, 896, (g, w, h) => {
    g.fillStyle = '#1b1e22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'center';
    g.font = '700 54px Arial, sans-serif';
    g.fillText('EMBEDDING', w / 2, 78);
    g.font = '400 38px "Courier New", monospace';
    g.fillStyle = '#9aa0a6';
    g.fillText('V × d TABLE', w / 2, 128);
    // the table itself: a grid of lookup cells, a few lit
    const cols = 8, rows = 14, cw = (w - 64) / cols, chh = 34;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = (r * cols + c) % 17 === 0 || (r === 3 && c === 5);
        g.fillStyle = lit ? '#2fb7c9' : '#2c3036';
        g.fillRect(32 + c * cw + 2, 168 + r * chh + 2, cw - 4, chh - 4);
      }
    }
    g.fillStyle = '#f2f3f4';
    g.font = '400 34px Arial, sans-serif';
    g.fillText('token id → vector', w / 2, 716);
    g.fillText('+ position', w / 2, 762);
    g.fillStyle = '#5a6169';
    g.font = '400 28px Arial, sans-serif';
    g.fillText('A LOOKUP, NOT A COMPUTATION', w / 2, 838);
  });
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.74, 1.3),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
  face.rotation.y = Math.PI / 2;
  face.position.set(E.x + 0.256, 0.83, E.z);
  group.add(face);

  const leds = [];
  for (let i = 0; i < 8; i++) {
    leds.push({
      x: E.x + 0.26, y: 1.38 - i * 0.13, z: E.z - 0.3,
      color: i % 3 ? PALETTE.ledBlue : PALETTE.ledGreen, phase: i / 8, blink: 0.5,
    });
  }
  group.add(createLEDField(leds));
}

// Entry conduit: in above Station 01's door, tight down the west
// wall, then north along it to the rail's south end. Slim, stepped,
// wall-hugging — never an arc through open air.
function buildEntryConduit(group) {
  const mat = new THREE.MeshStandardMaterial({ color: PALETTE.fibreAqua, roughness: 0.45, metalness: 0.1 });
  const pts = [
    [-6.02, 2.32, TR.entryDoorZ],
    [-5.9, 2.32, TR.entryDoorZ],
    [-5.88, 2.28, TR.entryDoorZ],
    [-5.88, 1.14, TR.entryDoorZ],
    [-5.88, 1.1, 2.2],
    [-5.6, 1.04, 1.92],
    [TR.x - 0.06, TR.railY + 0.06, TR.z0 + 7 * TR.pitch + 0.12],
  ].map((p) => new THREE.Vector3(...p));
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.014, 6), mat);
  group.add(tube);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10),
    new THREE.MeshStandardMaterial({ color: 0x3c4147, ...SURFACE.paintedMetal }));
  collar.rotation.z = Math.PI / 2;
  collar.position.set(-5.98, 2.32, TR.entryDoorZ);
  group.add(collar);
}

export function createTokenRail() {
  const group = new THREE.Group();
  group.name = 's02-token-rail';
  buildRail(group);
  buildEmbeddingCabinet(group);
  buildEntryConduit(group);
  return group;
}
