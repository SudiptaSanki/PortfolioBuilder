// rolloutDock.js — the image dock (tokenRail.js's role: where the
// work arrives). On the west wall beside the entry door, Station
// 04's built images land as tagged crates on a plinth — images are
// DELIVERED here, not built — and in front of the dock stands the
// manifest lectern: the deployment's declaration as a printed
// plate. You declare the state; the cluster does the rest. The
// lectern is that contract made furniture (an echo of Station 01's
// registry lectern, deliberately).

import * as THREE from 'three';
import { STATION05, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S05 = STATION05;
const D = S05.dock;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// -------------------------------------------------------------- crates --
function crateTex(tag, fresh) {
  return canvasTexture(384, 256, (g, w, h) => {
    g.fillStyle = fresh ? '#9aa1a8' : '#83898e'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, 0, w, 20); g.fillRect(0, h - 20, w, 20);
    g.strokeStyle = 'rgba(20,23,26,0.55)'; g.lineWidth = 4; g.strokeRect(12, 12, w - 24, h - 24);
    if (fresh) {                       // still strapped, straight from the pipeline
      g.fillStyle = '#3a3e44';
      g.fillRect(w * 0.3, 0, 14, h); g.fillRect(w * 0.66, 0, 14, h);
      g.fillStyle = '#c9a24d'; g.fillRect(0, 0, w, 10);
    }
    g.fillStyle = '#f2f3f4'; g.fillRect(44, 78, w - 88, 100);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 40px "Courier New", monospace';
    g.fillText(tag, w / 2, 128);
    g.font = '400 25px Arial, sans-serif';
    g.fillText(fresh ? 'IMAGE · FROM CI/CD' : 'IMAGE · RUNNING STOCK', w / 2, 162);
  });
}

function buildDock(group, leds) {
  const plinthMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 1.7), plinthMat);
  plinth.position.set(D.plinth.x, 0.11, D.plinth.z);
  group.add(plinth);

  const crateGeo = new THREE.BoxGeometry(0.52, 0.34, 0.52);
  const plainMat = new THREE.MeshStandardMaterial({ color: 0x767c83, roughness: 0.85 });
  const mkCrate = (tag, fresh, x, y, z, rotY) => {
    const faceMat = new THREE.MeshStandardMaterial({ map: crateTex(tag, fresh), roughness: 0.8 });
    const crate = new THREE.Mesh(crateGeo, [faceMat, faceMat, plainMat, plainMat, faceMat, faceMat]);
    crate.position.set(x, y, z);
    crate.rotation.y = rotY;
    group.add(crate);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.55), plainMat);
    lid.position.set(x, y + 0.185, z);
    lid.rotation.y = rotY;
    group.add(lid);
  };
  // the running stock: v1.41 crates, worn, one stacked on the plinth
  mkCrate('model-api:v1.41', false, D.plinth.x, 0.22 + 0.17, D.plinth.z - 0.42, 0.04);
  mkCrate('model-api:v1.41', false, D.plinth.x, 0.22 + 0.17, D.plinth.z + 0.38, -0.05);
  mkCrate('model-api:v1.41', false, D.plinth.x, 0.22 + 0.51, D.plinth.z - 0.4, 0.1);
  // the fresh arrival on the floor beside the plinth: v2.0, strapped
  mkCrate('model-api:v2.0', true, -5.45, 0.17, -0.45, 0.14);
  leds.push({ x: -5.16, y: 0.42, z: -0.45, color: PALETTE.ledGreen, phase: 0.4, blink: 0 });
}

// ------------------------------------------------------------- lectern --
// A waist-high desk with a tilted reading panel — the shared
// lectern shape of this hall (the analysis lectern in canary.js is
// its sibling). The reader stands at local +Z.
export function buildLectern({ x, z, rotY, panelTex, width = 0.8 }) {
  const lect = new THREE.Group();
  lect.position.set(x, 0, z);
  lect.rotation.y = rotY;
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.5 });
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.8, 0.36), deskMat);
  pedestal.position.y = 0.4;
  lect.add(pedestal);
  const panel = new THREE.Group();
  panel.position.set(0, 0.82, 0.04);
  panel.rotation.x = -0.38;                       // top leans back, face up to the reader
  lect.add(panel);
  const board = new THREE.Mesh(new THREE.BoxGeometry(width, 0.64, 0.035), deskMat);
  board.position.y = 0.3;
  panel.add(board);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.06, 0.58),
    new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.55, metalness: 0.2 }));
  plate.position.set(0, 0.3, 0.021);
  panel.add(plate);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(width, 0.03, 0.03), deskMat);
  lip.position.set(0, 0.845, 0.21);
  lect.add(lip);
  return lect;
}

function manifestTex() {
  return canvasTexture(640, 464, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, 64);
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'left';
    g.font = '700 32px Arial, sans-serif';
    g.fillText('MANIFEST · DESIRED STATE', 28, 42);
    g.fillStyle = '#14171a';
    g.font = '400 31px "Courier New", monospace';
    const lines = [
      'deployment · model-api',
      'replicas: 10',
      'image: model-api:v2.0',
      'strategy: canary',
    ];
    lines.forEach((line, i) => g.fillText(line, 28, 128 + i * 52));
    g.font = '400 25px Arial, sans-serif';
    g.fillStyle = '#44484d';
    g.fillText('Declare the state — the cluster', 28, 372);
    g.fillText('works to make it true, forever.', 28, 406);
  });
}

export function createRolloutDock() {
  const group = new THREE.Group();
  group.name = 's05-dock';
  const leds = [];
  buildDock(group, leds);
  group.add(buildLectern({
    x: D.lectern.x, z: D.lectern.z, rotY: D.lectern.rotY, panelTex: manifestTex(),
  }));
  group.add(createLEDField(leds));
  return group;
}
