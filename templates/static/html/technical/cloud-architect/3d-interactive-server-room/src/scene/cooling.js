// cooling.js — direct-to-chip liquid cooling.
// Per rack: a rear stainless manifold (two vertical pipes) with rows of
// silver quick-disconnects capped in blue, one per compute tray. Hero racks
// get black hose loops from manifold to every tray rear. Overhead: blue
// supply / orange return mains with drops, and an in-row CDU cabinet.

import * as THREE from 'three';
import {
  U, RACK, LAYOUT, PALETTE, SURFACE, uCentreY,
} from '../config/world.js';

const MANIFOLD_X = [0.19, 0.265];        // supply / return pipe x (rack local)
const MANIFOLD_Z = RACK.depth / 2 - 0.07;
const TRAY_REAR_Z = 0.19;                // where tray backs sit (rack local)

// --------------------------------------------------------- manifolds ----
// Collected per rack, then built as world-space InstancedMesh in finalize().
const _pending = [];   // { group, anchor }

export function addRackManifold(rackGroup, anchor) {
  _pending.push({ group: rackGroup, anchor });
}

export function finalizeManifolds(parent) {
  const pipeGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
  const steelMat = new THREE.MeshStandardMaterial({
    color: PALETTE.brushedSteel, ...SURFACE.brushedSteel,
  });
  const pipes = [];
  const couplings = [];
  const caps = [];
  const handles = [];
  const v = new THREE.Vector3();

  for (const { group, anchor } of _pending) {
    group.updateWorldMatrix(true, false);
    const toWorld = (x, y, z) => group.localToWorld(v.set(x, y, z).clone());
    for (const px of MANIFOLD_X) {
      pipes.push({ p: toWorld(px, 1.12, MANIFOLD_Z), r: 0.027, h: 1.78 });
    }
    // quick-disconnects at liquid-cooled compute heights: standard racks
    // run compute at U3–U20, hero (DGX) racks at U17–U24
    const uStart = anchor.hero ? 16 : 2;
    const uCount = anchor.hero ? 8 : 18;
    for (let t = 0; t < uCount; t++) {
      const y = uCentreY(uStart + t);
      couplings.push({ p: toWorld(MANIFOLD_X[0], y, MANIFOLD_Z + 0.045), rotX: true });
      caps.push({ p: toWorld(MANIFOLD_X[0], y, MANIFOLD_Z + 0.075) });
      couplings.push({ p: toWorld(MANIFOLD_X[1], y, MANIFOLD_Z + 0.045), rotX: true });
      caps.push({ p: toWorld(MANIFOLD_X[1], y, MANIFOLD_Z + 0.075) });
    }
    handles.push({ p: toWorld(MANIFOLD_X[0], 1.94, MANIFOLD_Z), color: PALETTE.coolantSupply });
    handles.push({ p: toWorld(MANIFOLD_X[1], 1.94, MANIFOLD_Z), color: PALETTE.coolantReturn });
  }

  const dummy = new THREE.Object3D();
  const build = (list, geo, mat, apply) => {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => { apply(it, dummy); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); });
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
  };

  build(pipes, pipeGeo, steelMat, (it, d) => {
    d.position.copy(it.p); d.rotation.set(0, 0, 0); d.scale.set(it.r, it.h, it.r);
  });
  const coupGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.055, 8);
  build(couplings, coupGeo, steelMat, (it, d) => {
    d.position.copy(it.p); d.rotation.set(Math.PI / 2, 0, 0); d.scale.set(1, 1, 1);
  });
  const capGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.02, 8);
  const capMat = new THREE.MeshStandardMaterial({ color: PALETTE.coolantSupply, roughness: 0.5 });
  build(caps, capGeo, capMat, (it, d) => {
    d.position.copy(it.p); d.rotation.set(Math.PI / 2, 0, 0); d.scale.set(1, 1, 1);
  });
  const handleGeo = new THREE.BoxGeometry(0.09, 0.018, 0.03);
  const handleMats = {
    [PALETTE.coolantSupply]: new THREE.MeshStandardMaterial({ color: PALETTE.coolantSupply, roughness: 0.5 }),
    [PALETTE.coolantReturn]: new THREE.MeshStandardMaterial({ color: PALETTE.coolantReturn, roughness: 0.5 }),
  };
  for (const color of [PALETTE.coolantSupply, PALETTE.coolantReturn]) {
    build(handles.filter((h) => h.color === color), handleGeo, handleMats[color], (it, d) => {
      d.position.copy(it.p); d.rotation.set(0, 0.5, 0); d.scale.set(1, 1, 1);
    });
  }
  _pending.length = 0;
}

// ------------------------------------------------------------- hoses ----
function hoseCurve(x0, y, x1) {
  const pts = [
    new THREE.Vector3(x0, y, MANIFOLD_Z + 0.03),
    new THREE.Vector3(x0 - 0.05, y - 0.075, 0.42),
    new THREE.Vector3(x1 + 0.05, y - 0.05, 0.3),
    new THREE.Vector3(x1, y, TRAY_REAR_Z + 0.02),
  ];
  return new THREE.CatmullRomCurve3(pts);
}

const hoseMat = new THREE.MeshStandardMaterial({
  color: PALETTE.hoseBlack, roughness: 0.55, metalness: 0.1,
});
const fittingMat = new THREE.MeshStandardMaterial({
  color: PALETTE.brushedSteel, ...SURFACE.brushedSteel,
});

// Black hose pairs from the manifold into tray rears (rack-local space).
export function addRackHoses(rackGroup, anchor) {
  const full = anchor.hoseHero;
  const trays = full ? 8 : 5;
  for (let t = 0; t < trays; t++) {
    // hose-hero racks are DGX heroes: liquid compute lives at U17–U24
    const uIdx = full ? 16 + t : 3 + t * 3;
    const y = uCentreY(uIdx);
    for (const [mx, tx] of [[MANIFOLD_X[0], -0.1], [MANIFOLD_X[1], 0.12]]) {
      const geo = new THREE.TubeGeometry(hoseCurve(mx, y, tx), 12, 0.0165, 6, false);
      rackGroup.add(new THREE.Mesh(geo, hoseMat));
      const fit = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.035, 8), fittingMat);
      fit.rotation.x = Math.PI / 2;
      fit.position.set(tx, y, TRAY_REAR_Z + 0.03);
      rackGroup.add(fit);
    }
  }
}

// ---------------------------------------------------------- overhead ----
function buildOverhead(group) {
  const pipeMat = (color) => new THREE.MeshStandardMaterial({
    color, roughness: 0.38, metalness: 0.25,
  });
  const len = LAYOUT.racksPerRow * RACK.width + 2.2;
  for (const s of [-1, 1]) {
    const zc = s * LAYOUT.rowZ;
    const runs = [
      { dz: -0.1, color: PALETTE.coolantSupply },
      { dz: 0.1, color: PALETTE.coolantReturn },
    ];
    for (const run of runs) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, len, 14), pipeMat(run.color));
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, 2.94, zc + run.dz);
      group.add(pipe);
      // drops at both row ends, with elbow torus into the row header
      for (const ex of [-1, 1]) {
        const drop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 0.62, 14), pipeMat(run.color));
        drop.position.set(ex * (len / 2 - 0.35), 2.63, zc + run.dz);
        group.add(drop);
        const elbow = new THREE.Mesh(
          new THREE.TorusGeometry(0.14, 0.055, 10, 14, Math.PI / 2), pipeMat(run.color));
        elbow.position.set(ex * (len / 2 - 0.49), 2.94, zc + run.dz);
        elbow.rotation.y = Math.PI / 2;
        if (ex > 0) elbow.rotation.z = Math.PI / 2;
        group.add(elbow);
      }
    }
  }
}

// --------------------------------------------------------------- CDU ----
function cduPanelTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#dde0e3'; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = '#b4b8bd'; g.lineWidth = 4; g.strokeRect(6, 6, 244, 500);
  // two pressure gauges
  for (const cx of [70, 186]) {
    g.fillStyle = '#f4f6f7';
    g.beginPath(); g.arc(cx, 92, 42, 0, 7); g.fill();
    g.strokeStyle = '#3c4147'; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, 92, 42, 0, 7); g.stroke();
    for (let a = 0; a <= 10; a++) {
      const t = Math.PI * 0.75 + a * Math.PI * 1.5 / 10;
      g.beginPath();
      g.moveTo(cx + Math.cos(t) * 34, 92 + Math.sin(t) * 34);
      g.lineTo(cx + Math.cos(t) * 39, 92 + Math.sin(t) * 39);
      g.stroke();
    }
    const na = Math.PI * 0.75 + (cx === 70 ? 0.62 : 0.45) * Math.PI * 1.5;
    g.strokeStyle = '#c0272d'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(cx, 92);
    g.lineTo(cx + Math.cos(na) * 30, 92 + Math.sin(na) * 30); g.stroke();
  }
  // display
  g.fillStyle = '#10151c'; g.fillRect(38, 168, 180, 96);
  g.fillStyle = '#57e6c9';
  g.font = '700 25px monospace';
  g.fillText('FLOW  42.1', 52, 204);
  g.fillText('dT     8.4', 52, 238);
  g.fillStyle = '#39ff7a';
  g.font = '700 19px monospace';
  g.fillText('PUMPS  OK', 52, 262 - 6);
  // vents
  g.fillStyle = '#9ba1a7';
  for (let y = 300; y < 470; y += 12) g.fillRect(30, y, 196, 5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildCDU(group) {
  const { x, z } = LAYOUT.cdu;
  const cdu = new THREE.Group();
  cdu.name = 'cdu';
  // The cabinet is turned so its service face looks out over the open floor
  // at the end of the row rather than into the 0.7 m gap beside the wall.
  const cab = new THREE.Group();
  cab.rotation.y = -Math.PI / 2;
  cdu.add(cab);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd7dade, roughness: 0.55, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.0, 1.05), bodyMat);
  body.position.y = 1.0;
  cab.add(body);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 1.44),
    new THREE.MeshStandardMaterial({ map: cduPanelTexture(), roughness: 0.5 }));
  panel.rotation.y = -Math.PI / 2;                       // local: faces -X
  panel.position.set(-0.428, 1.12, 0);
  cab.add(panel);
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.1, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x3a3e42, roughness: 0.8 }));
  plinth.position.y = 0.05;
  cab.add(plinth);
  // fat blue/orange mains rising from the top to the overhead lines
  const runs = [
    { dz: -0.1, color: PALETTE.coolantSupply },
    { dz: 0.1, color: PALETTE.coolantReturn },
  ];
  for (const run of runs) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.96, 14),
      new THREE.MeshStandardMaterial({ color: run.color, roughness: 0.38, metalness: 0.25 }));
    pipe.position.set(0, 2.46, run.dz);
    cdu.add(pipe);
  }
  cdu.position.set(x, 0, z);
  group.add(cdu);
  return cdu;
}

// -------------------------------------------------------------- main ----
export function createCooling() {
  const group = new THREE.Group();
  group.name = 'cooling';
  buildOverhead(group);
  buildCDU(group);
  return group;
}

export function getCDUPosition() {
  return { ...LAYOUT.cdu };
}
