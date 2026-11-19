// signingDesk.js — the seal and the catalogue (the trust plant),
// south-east beside the ring: where an image stops being built and
// starts being believed. A sealing desk with a stamp press and the
// whole keyless ceremony as a three-plate plaque — cosign signs the
// digest, Fulcio issues a ~10-minute certificate against the build's
// OIDC identity, and there are no long-lived keys anywhere. Beside
// it, the Rekor ledger rail: the append-only transparency log as
// furniture, entry plates rising bottom → top, none removable
// without the gap showing. The SBOM lectern fans the worked image's
// ingredient cards; the provenance plate posts the SLSA story
// plainly. The desk asserts — it does not sparkle.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { registerStageLight } from './flow.js';

const S04 = STATION04;
const D = S04.desk;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function textPlate(w, h, draw, px = [512, 128]) {
  const tex = canvasTexture(px[0], px[1], draw);
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
      g.font = '700 40px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 14);
    } else {
      g.font = '700 38px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 4);
      g.font = '400 31px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 34);
    }
  }, px);
}

// ------------------------------------------------------------ desk -----
function buildDesk(group) {
  const { x, z } = D;
  const topMat = new THREE.MeshStandardMaterial({ color: 0x3a3e44, ...SURFACE.powderCoat });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.6, metalness: 0.4 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 0.72), topMat);
  top.position.set(x, 0.9, z);
  group.add(top);
  for (const [dx, dz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.05), legMat);
    leg.position.set(x + dx, 0.45, z + dz);
    group.add(leg);
  }
  // back panel carrying the provenance plate
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.62, 0.04), topMat);
  back.position.set(x, 1.24, z + 0.36);
  group.add(back);
  const prov = simplePlate(1.24, 0.3,
    ['PROVENANCE · SLSA BUILD L3', 'WHO · WHAT PROCESS · WHAT INPUTS'],
    { bg: '#14171a', ink: '#f2f3f4', px: [1152, 288] });
  prov.position.set(x, 1.26, z + 0.335);
  prov.rotation.y = Math.PI;                       // faces north, to the room
  group.add(prov);
  const levels = simplePlate(1.24, 0.16,
    ['L1 A RECORD EXISTS · L2 THE PLATFORM SIGNS IT · L3 HARDENED, KEYS UNREACHABLE'],
    { px: [1400, 144] });
  levels.position.set(x, 1.02, z + 0.335);
  levels.rotation.y = Math.PI;
  group.add(levels);

  // the stamp press: base, post, arm and head over the desk
  const pressMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), pressMat);
  base.position.set(x - 0.32, 0.945, z + 0.08);
  group.add(base);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.05), pressMat);
  post.position.set(x - 0.32, 1.16, z + 0.19);
  group.add(post);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.26), pressMat);
  arm.position.set(x - 0.32, 1.36, z + 0.07);
  group.add(arm);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.12, 16), pressMat);
  head.position.set(x - 0.32, 1.26, z - 0.03);
  group.add(head);

  // the seal disc: green only for the verified crate, flaring once
  // as the packet reaches the desk (build-clock driven)
  const sealMat = new THREE.MeshStandardMaterial({
    color: 0x0d2b18, emissive: PALETTE.ledGreen, emissiveIntensity: 0.12,
    roughness: 0.35, metalness: 0.3,
  });
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.016, 24), sealMat);
  seal.position.set(x - 0.32, 0.935, z - 0.03);
  group.add(seal);
  registerStageLight(sealMat, 0.562, { width: 0.02, base: 0.12, peak: 2.8 });

  // the keyless ceremony, as a plaque row on a rail above the desk
  const railMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.03), railMat);
  rail.position.set(x, 1.78, z + 0.3);
  group.add(rail);
  for (const dx of [-0.7, 0.7]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), railMat);
    rod.position.set(x + dx, 1.53, z + 0.3);
    group.add(rod);
  }
  const plaques = [
    'COSIGN · SIGN THE DIGEST',
    'FULCIO · CERT ≈ 10 MIN · OIDC IDENTITY',
    'NO LONG-LIVED KEYS',
  ];
  plaques.forEach((text, i) => {
    const p = simplePlate(0.47, 0.13, [text], { bg: '#14171a', ink: '#f2f3f4', px: [640, 160] });
    p.position.set(x - 0.5 + i * 0.5, 1.64, z + 0.3);
    p.rotation.y = Math.PI;
    group.add(p);
  });
}

// ------------------------------------------------------ Rekor rail -----
// The transparency log as a ledger board: entries rise bottom →
// top, each a plate in the drawing; the newest names the worked
// build. Append-only — a removed plate would leave a gap.
function rekorTexture() {
  return canvasTexture(512, 1024, (g, w, h) => {
    g.fillStyle = '#17191c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'center';
    g.font = '700 36px Arial, sans-serif';
    g.fillText('REKOR', w / 2, 56);
    g.font = '400 24px Arial, sans-serif';
    g.fillStyle = '#9aa0a6';
    g.fillText('TRANSPARENCY LOG · APPEND-ONLY', w / 2, 92);
    g.fillStyle = '#3a3e44'; g.fillRect(24, 112, w - 48, 2);
    const entries = [
      ['1,048,214', 'trainer@sha256:77d0…'],
      ['1,048,216', 'feature-pipeline@sha256:04be…'],
      ['1,048,218', 'lattice-serve@sha256:5e1f…'],
      ['1,048,220', 'model-server@sha256:3b7c…'],
      ['1,048,221', 'model-server@sha256:9f86… · #482'],
    ];
    entries.forEach(([num, what], i) => {
      const y = h - 150 - i * 148;                  // newest at the top
      const newest = i === entries.length - 1;
      g.fillStyle = newest ? '#1d3a28' : '#22252a';
      g.fillRect(24, y, w - 48, 118);
      g.strokeStyle = newest ? '#39ff7a' : '#3a3e44';
      g.lineWidth = 2; g.strokeRect(24, y, w - 48, 118);
      g.fillStyle = '#e8eaec';
      g.textAlign = 'left';
      g.font = '700 32px "Courier New", monospace';
      g.fillText(`ENTRY ${num}`, 44, y + 48);
      g.font = '400 25px "Courier New", monospace';
      g.fillStyle = '#9aa0a6';
      g.fillText(what, 44, y + 88);
      g.textAlign = 'center';
    });
  });
}

function buildRekorRail(group) {
  const { x, z } = D.rekor;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, ...SURFACE.powderCoat });
  for (const dz of [-0.3, 0.3]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, 0.05), frameMat);
    post.position.set(x, 0.95, z + dz);
    group.add(post);
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.78, 0.68), frameMat);
  board.position.set(x, 1.02, z);
  group.add(board);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 1.7),
    new THREE.MeshStandardMaterial({ map: rekorTexture(), roughness: 0.55, metalness: 0.2 }));
  face.position.set(x - 0.022, 1.02, z);
  face.rotation.y = -Math.PI / 2;                  // faces west, to the desk
  group.add(face);
}

// ----------------------------------------------------- SBOM lectern ----
// The ingredient catalogue of the worked image: a fanned set of
// cards drawn on the lectern's sloped top, in the Station 01
// registry-lectern language.
function sbomTexture() {
  const tex = canvasTexture(640, 512, (g, w, h) => {
    g.fillStyle = '#22252a'; g.fillRect(0, 0, w, h);
    const cards = [
      ['python', '3.12.x', -0.1],
      ['torch', '2.x', 0.06],
      ['numpy', '1.26.x', -0.04],
      ['pydantic', '2.x', 0.1],
    ];
    cards.forEach(([name, ver], i) => {
      const cx = 92 + i * 118, cy = 120 + (i % 2) * 26;
      g.save();
      g.translate(cx, cy);
      g.rotate((i - 1.5) * 0.07);
      g.fillStyle = '#eef0f2';
      g.fillRect(-52, -70, 104, 300);
      g.fillStyle = '#14171a'; g.fillRect(-52, -70, 104, 8);
      g.textAlign = 'center';
      g.font = '700 25px Arial, sans-serif';
      g.fillText(name, 0, -22);
      g.font = '400 22px "Courier New", monospace';
      g.fillStyle = '#3c4147';
      g.fillText(ver, 0, 12);
      g.strokeStyle = '#c9ccd0'; g.lineWidth = 2;
      for (const y of [52, 88, 124, 160]) { g.beginPath(); g.moveTo(-36, y); g.lineTo(36, y); g.stroke(); }
      g.restore();
    });
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'center';
    g.font = '700 30px Arial, sans-serif';
    g.fillText('SBOM · model-server', w / 2, h - 66);
    g.font = '400 24px Arial, sans-serif';
    g.fillStyle = '#9aa0a6';
    g.fillText('EVERY PACKAGE · VERSION · LICENCE', w / 2, h - 30);
  });
  // the box's top-face UVs put the canvas upside-down on the sloped
  // top as seen by the reader — rotate 180° so the cards read
  // upright from the viewing side (the Station 01 lectern fix).
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI;
  return tex;
}

function buildLectern(group) {
  const { x, z, rotY } = D.lectern;
  const lect = new THREE.Group();
  lect.position.set(x, 0, z);
  lect.rotation.y = rotY;
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.8 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.95, 0.09), woodMat);
  post.position.y = 0.475;
  lect.add(post);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.36), woodMat);
  foot.position.y = 0.02;
  lect.add(foot);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.03, 0.5),
    new THREE.MeshStandardMaterial({ map: sbomTexture(), roughness: 0.6, metalness: 0.1 }));
  top.position.set(0, 1.02, 0);
  top.rotation.x = -0.42;                          // sloped toward the reader
  lect.add(top);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.03), woodMat);
  lip.position.set(0, 0.93, 0.235);
  lip.rotation.x = -0.42;
  lect.add(lip);
  group.add(lect);

  const fmt = simplePlate(0.56, 0.13,
    ['SBOM · SPDX · ATTACHED AS ATTESTATION'], { px: [900, 144] });
  fmt.position.set(x - Math.sin(rotY) * 0.3, 0.62, z - Math.cos(rotY) * 0.3);
  fmt.rotation.y = rotY + Math.PI;
  group.add(fmt);
}

export function createSigningDesk() {
  const group = new THREE.Group();
  group.name = 's04-signing-desk';
  buildDesk(group);
  buildRekorRail(group);
  buildLectern(group);
  return group;
}
