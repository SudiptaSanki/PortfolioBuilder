// registry.js — the registry wall (east): where built images are
// kept, addressed by digest. Two shelving runs flank the east door,
// holding upright manifest ledgers — one card per stored image, each
// carrying repo, tag and short digest. The registry holds the whole
// facility's images, not just this line's. Between the runs, the
// dedup pedestal makes content addressing physical: the base layer
// exists one time, in one place, and every image that uses it
// points here. Density and repetition are the visual signature, as
// with Station 01's carrier grids.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';

const S04 = STATION04;
const REG = S04.registry;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// repo, tag, short digest — the ledger cards' catalogue
const CARDS = [
  ['model-server', 'v1.4.2', 'sha256:9f86…'],
  ['model-server', 'v1.4.1', 'sha256:3b7c…'],
  ['model-server', 'v1.3.9', 'sha256:51d2…'],
  ['trainer', 'v0.9.3', 'sha256:77d0…'],
  ['trainer', 'v0.9.2', 'sha256:aa08…'],
  ['feature-pipeline', 'v2.1.0', 'sha256:04be…'],
  ['feature-pipeline', 'v2.0.4', 'sha256:6d9a…'],
  ['lattice-serve', 'v1.0.7', 'sha256:5e1f…'],
];

function cardTexture([repo, tag, digest]) {
  return canvasTexture(256, 320, (g, w, h) => {
    g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, 10);
    g.fillStyle = '#14171a';
    g.textAlign = 'left';
    g.font = '700 30px Arial, sans-serif';
    const name = repo.length > 13 ? repo.slice(0, 13) : repo;
    g.fillText(name, 18, 62);
    g.font = '400 26px Arial, sans-serif';
    g.fillStyle = '#3c4147';
    g.fillText(`tag  ${tag}`, 18, 108);
    g.font = '400 23px "Courier New", monospace';
    g.fillText(digest, 18, 148);
    g.strokeStyle = '#c9ccd0'; g.lineWidth = 2;
    for (const y of [186, 222, 258]) { g.beginPath(); g.moveTo(18, y); g.lineTo(w - 18, y); g.stroke(); }
    g.fillStyle = '#0a8a3c';
    g.beginPath(); g.arc(30, h - 28, 9, 0, 7); g.fill();
    g.fillStyle = '#3c4147';
    g.font = '400 20px Arial, sans-serif';
    g.fillText('MANIFEST · OCI', 50, h - 20);
  });
}

function buildShelfRun(group, run, cardOffset) {
  const frameMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x8f959a, ...SURFACE.brushedSteel });
  const zc = (run.z0 + run.z1) / 2, len = run.z1 - run.z0;
  const x = REG.x;

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.1, len + 0.1),
    new THREE.MeshStandardMaterial({ color: 0xd8dbde, roughness: 0.9 }));
  back.position.set(x + 0.22, 1.05, zc);
  group.add(back);
  for (const dz of [run.z0 - 0.03, run.z1 + 0.03]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.46, 2.1, 0.05), frameMat);
    upright.position.set(x, 1.05, dz);
    group.add(upright);
  }
  const shelfYs = [0.42, 1.02, 1.62];
  shelfYs.forEach((y, si) => {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, len + 0.06), boardMat);
    board.position.set(x, y, zc);
    group.add(board);
    // ledger cards standing on the shelf, faces west to the hall
    const n = 4;
    for (let i = 0; i < n; i++) {
      const card = CARDS[(cardOffset + si * n + i) % CARDS.length];
      const cz = run.z0 + 0.22 + i * ((len - 0.4) / (n - 1));
      const bodyCard = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.32, 0.025),
        new THREE.MeshStandardMaterial({ color: 0xd4d7da, roughness: 0.7 }));
      bodyCard.position.set(x, y + 0.18, cz);
      group.add(bodyCard);
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.3),
        new THREE.MeshStandardMaterial({ map: cardTexture(card), roughness: 0.6, metalness: 0.05 }));
      face.position.set(x - 0.126, y + 0.18, cz);
      face.rotation.y = -Math.PI / 2;
      group.add(face);
    }
  });
  const header = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, len + 0.06), frameMat);
  header.position.set(x, 2.14, zc);
  group.add(header);
}

// ------------------------------------------------- dedup pedestal ----
function buildPedestal(group) {
  const { x, z } = REG.pedestal;
  const galv = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.52), galv);
  ped.position.set(x, 0.26, z);
  group.add(ped);
  // the one stored copy of the shared base layer
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.15, 0.58),
    new THREE.MeshStandardMaterial({ color: PALETTE.trayBody, ...SURFACE.powderCoat }));
  slab.position.set(x, 0.52 + 0.075, z);
  group.add(slab);
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.025, 0.6),
    new THREE.MeshStandardMaterial({ color: PALETTE.trayTrim, ...SURFACE.brushedSteel }));
  trim.position.set(x, 0.52 + 0.155, z);
  group.add(trim);
  // two ledger cards leaning on it — images that reference this base
  [CARDS[0], CARDS[5]].forEach((card, i) => {
    const lean = new THREE.Group();
    const bodyCard = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.32, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xd4d7da, roughness: 0.7 }));
    lean.add(bodyCard);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.3),
      new THREE.MeshStandardMaterial({ map: cardTexture(card), roughness: 0.6, metalness: 0.05 }));
    face.position.x = -0.012;
    face.rotation.y = -Math.PI / 2;                  // faces west, to the hall
    lean.add(face);
    lean.position.set(x - 0.31, 0.18, z - 0.14 + i * 0.28);
    lean.rotation.z = -0.2;                          // top tipped onto the pedestal
    group.add(lean);
  });
  const tex = canvasTexture(768, 144, (g, w, h) => {
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'center';
    g.font = '700 42px Arial, sans-serif';
    g.fillText('STORED ONCE · REFERENCED BY 6 IMAGES', w / 2, h / 2 + 15);
  });
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.16),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
  plate.position.set(x - 0.27, 0.3, z);
  plate.rotation.y = -Math.PI / 2;
  group.add(plate);
}

export function createRegistry() {
  const group = new THREE.Group();
  group.name = 's04-registry';
  buildShelfRun(group, REG.runs[0], 0);
  buildShelfRun(group, REG.runs[1], 3);
  buildPedestal(group);
  return group;
}
