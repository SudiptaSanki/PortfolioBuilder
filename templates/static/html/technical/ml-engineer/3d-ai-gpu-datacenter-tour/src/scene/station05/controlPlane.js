// controlPlane.js — the control-plane dais (qkv.js's role: the
// cabinets that decide). A raised platform (+0.45 m) along the
// north-west wall — the elevation is the fact: the control plane
// runs on its own machines, above and apart from the workload
// floor, and never runs user pods. Four consoles face south over
// the node field: API server (the only door), the etcd trio (the
// only memory), scheduler (filter → score), controller manager
// (the reconciliation loops). Every other console's conduit runs
// to the API desk FIRST, and only the API desk's bundle reaches
// etcd — that wiring is the architecture, drawn in cable.

import * as THREE from 'three';
import { STATION05, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S05 = STATION05;
const DA = S05.dais;
const TOP = DA.topY;

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
  const geo = new THREE.TubeGeometry(curve, 32, radius, 6, false);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.3 });
  return new THREE.Mesh(geo, mat);
}

// ------------------------------------------------------------- platform --
function buildPlatform(group) {
  const cx = (DA.x0 + DA.x1) / 2;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(DA.x1 - DA.x0, TOP, DA.depth),
    new THREE.MeshStandardMaterial({ color: 0x4a4f55, ...SURFACE.powderCoat }));
  base.position.set(cx, TOP / 2, DA.z);
  group.add(base);
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(DA.x1 - DA.x0 + 0.04, 0.03, DA.depth + 0.04),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel }));
  deck.position.set(cx, TOP + 0.015, DA.z);
  group.add(deck);
  // steps at the east end, descending eastward off the platform
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x565b61, ...SURFACE.powderCoat });
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.62), stepMat);
  step1.position.set(DA.x1 + 0.08, 0.15, -2.4);
  group.add(step1);
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.62), stepMat);
  step2.position.set(DA.x1 + 0.24, 0.075, -2.4);
  group.add(step2);
  // low rail along the south edge + a return on the east (gap at the steps)
  const railMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const postGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.55, 6);
  for (let x = DA.x0 + 0.1; x <= DA.x1 - 0.55; x += 0.62) {
    const post = new THREE.Mesh(postGeo, railMat);
    post.position.set(x, TOP + 0.275, DA.z + DA.depth / 2 - 0.04);
    group.add(post);
  }
  const railS = new THREE.Mesh(new THREE.BoxGeometry(DA.x1 - DA.x0 - 0.6, 0.035, 0.035), railMat);
  railS.position.set((DA.x0 + DA.x1) / 2 - 0.28, TOP + 0.55, DA.z + DA.depth / 2 - 0.04);
  group.add(railS);
  for (const pz of [-3.32, -3.02]) {
    const post = new THREE.Mesh(postGeo, railMat);
    post.position.set(DA.x1 - 0.04, TOP + 0.275, pz);
    group.add(post);
  }
  const railE = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.62), railMat);
  railE.position.set(DA.x1 - 0.04, TOP + 0.55, -3.17);
  group.add(railE);
}

// -------------------------------------------------------------- consoles --
function faceBase(g, w, h, title, sub) {
  g.fillStyle = '#202329'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f2f3f4';
  g.textAlign = 'left';
  g.font = '700 44px Arial, sans-serif';
  g.fillText(title, 30, 66);
  g.font = '400 29px Arial, sans-serif';
  g.fillStyle = '#9aa0a6';
  g.fillText(sub, 30, 110);
}

function apiFaceTex() {
  return canvasTexture(512, 512, (g, w, h) => {
    faceBase(g, w, h, 'API SERVER', 'THE FRONT DOOR · :6443');
    g.fillStyle = '#262a30'; g.fillRect(30, 150, w - 60, 210);          // the hatch
    g.fillStyle = '#0c0d0f';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) g.fillRect(48 + c * 52, 168 + r * 46, 38, 30);
    g.fillStyle = '#4a5058';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) g.fillRect(54 + c * 52, 174 + r * 46, 26, 18);
    g.fillStyle = '#c8ccd1'; g.font = '400 27px Arial, sans-serif';
    g.fillText('AUTH · VALIDATE · ADMIT — THEN STORE', 30, 420);
    g.fillStyle = '#9aa0a6'; g.font = '400 25px Arial, sans-serif';
    g.fillText('Every client talks only to this desk.', 30, 462);
  });
}

function etcdFaceTex() {
  return canvasTexture(512, 512, (g, w, h) => {
    faceBase(g, w, h, 'ETCD', 'THE CLUSTER’S MEMORY · KEY–VALUE');
    for (let i = 0; i < 3; i++) {                                        // the trio, drawn
      const cx = 106 + i * 150, cy = 250;
      g.beginPath(); g.arc(cx, cy, 58, 0, Math.PI * 2);
      g.fillStyle = i === 1 ? '#2e4a35' : '#262a30'; g.fill();
      g.strokeStyle = i === 1 ? '#39ff7a' : '#4a5058'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#c8ccd1'; g.font = '400 24px Arial, sans-serif'; g.textAlign = 'center';
      g.fillText(i === 1 ? 'LEADER' : 'FOLLOWER', cx, cy + 8);
      g.textAlign = 'left';
    }
    g.fillStyle = '#c8ccd1'; g.font = '400 27px Arial, sans-serif';
    g.fillText('A WRITE COUNTS WHEN A MAJORITY AGREES', 30, 400);
    g.fillStyle = '#9aa0a6'; g.font = '400 25px Arial, sans-serif';
    g.fillText('Only the API server may read or write here.', 30, 442);
  });
}

function schedulerFaceTex() {
  return canvasTexture(512, 512, (g, w, h) => {
    faceBase(g, w, h, 'SCHEDULER', 'ASSIGNS PODS TO NODES');
    const stage = (label, y, col) => {
      g.fillStyle = '#262a30'; g.fillRect(90, y, w - 180, 74);
      g.strokeStyle = col; g.lineWidth = 4; g.strokeRect(90, y, w - 180, 74);
      g.fillStyle = '#f2f3f4'; g.font = '700 36px Arial, sans-serif'; g.textAlign = 'center';
      g.fillText(label, w / 2, y + 50); g.textAlign = 'left';
    };
    stage('FILTER', 160, '#3fa9ff');
    g.fillStyle = '#9aa0a6';
    g.beginPath(); g.moveTo(w / 2 - 12, 244); g.lineTo(w / 2 + 12, 244); g.lineTo(w / 2, 266); g.fill();
    stage('SCORE', 276, '#39ff7a');
    g.fillStyle = '#c8ccd1'; g.font = '400 26px Arial, sans-serif';
    g.fillText('Remove what cannot fit — rank the rest.', 30, 420);
  });
}

function controllerFaceTex() {
  return canvasTexture(512, 512, (g, w, h) => {
    faceBase(g, w, h, 'CONTROLLER MANAGER', 'THE AUTOPILOT · RECONCILE, FOREVER');
    const dial = (cx, cy, label) => {
      g.beginPath(); g.arc(cx, cy, 52, 0, Math.PI * 2);
      g.fillStyle = '#262a30'; g.fill();
      g.strokeStyle = '#3fa9ff'; g.lineWidth = 5;
      g.beginPath(); g.arc(cx, cy, 52, -0.4, 3.6); g.stroke();
      g.fillStyle = '#3fa9ff';                                            // return arrowhead
      g.beginPath();
      const ax = cx + 52 * Math.cos(3.6), ay = cy + 52 * Math.sin(3.6);
      g.moveTo(ax, ay); g.lineTo(ax - 20, ay - 4); g.lineTo(ax - 4, ay + 18); g.fill();
      g.fillStyle = '#c8ccd1'; g.font = '400 21px Arial, sans-serif'; g.textAlign = 'center';
      g.fillText(label, cx, cy + 82); g.textAlign = 'left';
    };
    dial(128, 205, 'DEPLOYMENT');
    dial(352, 205, 'REPLICASET');
    dial(128, 350, 'NODE');
    dial(352, 350, 'ENDPOINTSLICE');
    g.fillStyle = '#9aa0a6'; g.font = '400 24px Arial, sans-serif';
    g.fillText('OBSERVE · COMPARE · ACT — AGAIN', 96, 482);
  });
}

const FACE_TEX = { api: apiFaceTex, etcd: etcdFaceTex, scheduler: schedulerFaceTex, controller: controllerFaceTex };

function buildDesk(group, leds, kind, x) {
  const desk = new THREE.Group();
  desk.position.set(x, TOP, -2.64);
  group.add(desk);
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2e3238, roughness: 0.5, metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.72, 0.46), deskMat);
  body.position.y = 0.36;
  desk.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), deskMat);
  top.position.y = 0.74;
  desk.add(top);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.62),
    new THREE.MeshStandardMaterial({ map: FACE_TEX[kind](), roughness: 0.55, metalness: 0.25 }));
  face.position.set(0, 0.38, 0.232);
  desk.add(face);
  const faceWorldZ = -2.64 + 0.234;
  if (kind === 'api') {
    leds.push({ x: x - 0.24, y: TOP + 0.66, z: faceWorldZ, color: PALETTE.ledGreen, phase: 0.15, blink: 0 });
  }
  if (kind === 'scheduler') {
    // the node-card rack on the desk top: NODE 1–4 dealt into slots,
    // one slot amber — a pod waiting for a node that fits
    const cardMat = new THREE.MeshStandardMaterial({ color: 0xd8dce0, roughness: 0.6 });
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.025, 0.05), deskMat);
    slot.position.set(0, 0.77, 0.14);
    desk.add(slot);
    for (let i = 0; i < 4; i++) {
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.012), cardMat);
      card.position.set(-0.21 + i * 0.14, 0.845, 0.14);
      card.rotation.x = -0.18;
      desk.add(card);
    }
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.014),
      new THREE.MeshStandardMaterial({ color: PALETTE.ledAmber, roughness: 0.5 }));
    tag.position.set(0.21, 0.9, 0.145);
    tag.rotation.x = -0.18;
    desk.add(tag);
    leds.push({ x: x + 0.21, y: TOP + 0.93, z: -2.64 + 0.16, color: PALETTE.ledAmber, phase: 0.5, blink: 0.9 });
  }
  if (kind === 'controller') {
    // one lamp per loop dial, at the dial centres drawn on the face
    for (const [dx, dy] of [[-0.155, 0.44], [0.116, 0.44], [-0.155, 0.27], [0.116, 0.27]]) {
      leds.push({
        x: x + dx, y: TOP + dy, z: faceWorldZ,
        color: PALETTE.ledGreen, phase: Math.abs(dx * 3 + dy), blink: 0.35,
      });
    }
  }
  return desk;
}

// -------------------------------------------------------------- etcd trio --
function buildEtcd(group, leds) {
  const drumMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.5 });
  S05.dais.etcdDrumsX.forEach((x, i) => {
    const leader = i === 1;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.58, 24), drumMat);
    drum.position.set(x, TOP + 0.31, S05.dais.etcdZ);
    group.add(drum);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.05, 24), capMat);
    cap.position.set(x, TOP + 0.625, S05.dais.etcdZ);
    group.add(cap);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.045, 24), capMat);
    foot.position.set(x, TOP + 0.022, S05.dais.etcdZ);
    group.add(foot);
    leds.push({
      x, y: TOP + 0.68, z: S05.dais.etcdZ + 0.1,
      color: leader ? PALETTE.ledGreen : PALETTE.ledBlue,
      phase: i * 0.33, blink: leader ? 0 : 0.3,
    });
  });
  // the Raft ring: a conduit loop behind the drums, leader to followers
  group.add(tube([
    [S05.dais.etcdDrumsX[0], TOP + 0.44, S05.dais.etcdZ - 0.24],
    [S05.dais.etcdDrumsX[1], TOP + 0.52, S05.dais.etcdZ - 0.27],
    [S05.dais.etcdDrumsX[2], TOP + 0.44, S05.dais.etcdZ - 0.24],
  ], 0.013, PALETTE.galvanised));
}

// -------------------------------------------------------------- conduits --
// The wiring IS the fact: every console talks to the API desk; only
// the API desk talks to etcd. Tight runs on the platform, never air.
function buildConduits(group) {
  const galv = PALETTE.galvanised;
  const run = (fromX) => tube([
    [fromX - 0.2, TOP + 0.1, -2.93],
    [(fromX + -4.85) / 2, TOP + 0.08, -2.97],
    [-4.98, TOP + 0.1, -2.93],
  ], 0.012, galv);
  group.add(run(-3.15));                       // scheduler → api
  group.add(run(-2.52));                       // controller → api
  group.add(run(-4.0));                        // etcd desk → api (a short hop)
  // the API desk's own bundle north to the trio — the only etcd link
  group.add(tube([
    [-4.72, TOP + 0.3, -2.9], [-4.6, TOP + 0.34, -3.05], [-4.38, TOP + 0.36, -3.16],
  ], 0.016, PALETTE.fibreAqua));
  group.add(tube([
    [-4.78, TOP + 0.22, -2.9], [-4.66, TOP + 0.26, -3.06], [-4.42, TOP + 0.28, -3.18],
  ], 0.011, galv));
}

export function createControlPlane() {
  const group = new THREE.Group();
  group.name = 's05-control-plane';
  const leds = [];
  buildPlatform(group);
  for (const c of DA.consoles) buildDesk(group, leds, c.kind, c.x);
  buildEtcd(group, leds);
  buildConduits(group);
  group.add(createLEDField(leds));
  return group;
}
