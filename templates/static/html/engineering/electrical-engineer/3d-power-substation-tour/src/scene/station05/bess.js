// bess.js — the battery yard (inventory §4.5): 10 × Tesla Megapack
// 2XL in the 4-hour configuration (3.916 MWh / 979 kW each), smooth
// slab-sided enclosures 8800 × 1650 × 2785 mm — NO corrugation, the
// Megapack reads as an appliance. Two rows of five on a shared
// concrete apron facing a central lane, MV skid transformer at the
// end, fenced with a gate. At 18:30 the yard is discharging: status
// beacons green, the evening shift clocked in.

import * as THREE from 'three';
import { STATION05, PALETTE } from '../../config/world.js';
import { MAT, box, canvasTexture, bushing } from './kit.js';

const S05 = STATION05;
const B = S05.bess;

function faceTexture() {
  return canvasTexture(1024, 324, (g, w, h) => {
    g.fillStyle = '#e6e7e4'; g.fillRect(0, 0, w, h);
    // flush access-door seams along the long face
    g.strokeStyle = 'rgba(90,95,100,0.55)'; g.lineWidth = 2;
    for (let i = 1; i < 8; i++) {
      g.beginPath(); g.moveTo((i * w) / 8, 14); g.lineTo((i * w) / 8, h - 14); g.stroke();
    }
    g.strokeRect(10, 10, w - 20, h - 20);
    // door pull recesses
    g.fillStyle = 'rgba(90,95,100,0.5)';
    for (let i = 0; i < 8; i++) g.fillRect((i * w) / 8 + 16, h / 2 - 4, 26, 8);
    // thermal-system grille at the east end — the only mechanical part
    g.fillStyle = '#c9cac6'; g.fillRect(w - 150, 30, 118, h - 60);
    g.fillStyle = '#7e8287';
    for (let y = 44; y < h - 44; y += 11) g.fillRect(w - 140, y, 98, 4);
  });
}

function chainlinkTexture() {
  const tex = canvasTexture(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(170,175,180,0.9)'; g.lineWidth = 2;
    for (let i = -2; i < 6; i++) {
      g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 64, 128); g.stroke();
      g.beginPath(); g.moveTo(i * 32 + 64, 0); g.lineTo(i * 32, 128); g.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function fenceRun(group, x0, z0, x1, z1, gateGap = null) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ang = Math.atan2(z1 - z0, x1 - x0);
  const tex = chainlinkTexture();
  tex.repeat.set(len / 1.2, 2);
  const meshMat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.6, depthWrite: false,
  });
  const segs = gateGap ? [[0, gateGap[0]], [gateGap[1], 1]] : [[0, 1]];
  for (const [a, b] of segs) {
    const l = len * (b - a);
    if (l < 0.2) continue;
    const cx = x0 + (x1 - x0) * ((a + b) / 2), cz = z0 + (z1 - z0) * ((a + b) / 2);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(l, 2.4), meshMat);
    panel.position.set(cx, 1.35, cz);
    panel.rotation.y = -ang;
    group.add(panel);
    const rail = box(l, 0.05, 0.05, MAT.galvanised, cx, 2.56, cz);
    rail.rotation.y = -ang;
    group.add(rail);
  }
  const posts = Math.max(2, Math.round(len / 4));
  for (let i = 0; i <= posts; i++) {
    const px = x0 + ((x1 - x0) * i) / posts, pz = z0 + ((z1 - z0) * i) / posts;
    group.add(box(0.07, 2.6, 0.07, MAT.galvanised, px, 1.3, pz));
  }
}

function buildMegapack(faceDir) {
  const g = new THREE.Group();
  const [L, H, D] = B.unit;
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xe6e7e4, roughness: 0.42, metalness: 0.15 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, H, D), shellMat);
  body.position.y = H / 2 + 0.12;
  body.castShadow = true;
  g.add(body);
  // the dressed long face, toward the lane
  const face = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.06, H - 0.1),
    new THREE.MeshStandardMaterial({ map: faceTexture(), roughness: 0.42, metalness: 0.15 }));
  face.position.set(0, H / 2 + 0.12, faceDir * (D / 2 + 0.006));
  if (faceDir < 0) face.rotation.y = Math.PI;
  g.add(face);
  // twistlock corner castings (top corners read at distance)
  for (const dx of [-L / 2 + 0.12, L / 2 - 0.12]) {
    for (const dz of [-D / 2 + 0.12, D / 2 - 0.12]) {
      g.add(box(0.18, 0.14, 0.18, MAT.darkSteel, dx, H + 0.16, dz));
    }
  }
  // status beacon — green, discharging
  const beacon = new THREE.MeshStandardMaterial({ color: 0x0d3319, emissive: PALETTE.ledGreen, emissiveIntensity: 2.4 });
  g.add(box(0.12, 0.09, 0.12, beacon, L / 2 - 0.7, H + 0.22, 0));
  return g;
}

export function createBess() {
  const group = new THREE.Group();
  group.name = 's05-bess';
  const [ax, az] = B.apron;

  // concrete apron + gravel border
  const apron = box(58, 0.12, 26, MAT.concrete, ax, 0.06, az);
  apron.receiveShadow = true;
  group.add(apron);
  const border = box(62, 0.05, 30, MAT.gravel, ax, 0.025, az);
  border.receiveShadow = true;
  group.add(border);
  // cable trench lines across the apron
  for (const tz of [B.rowsZ[0] + 3.4, B.rowsZ[1] - 3.4]) {
    group.add(box(52, 0.02, 0.5, MAT.concreteDark, ax, 0.13, tz));
  }

  B.rowsZ.forEach((rz, ri) => {
    const faceDir = ri === 0 ? 1 : -1; // both rows face the central lane
    for (const ux of B.unitX) {
      const u = buildMegapack(faceDir);
      u.position.set(ux, 0.12, rz);
      group.add(u);
    }
  });

  // MV skid transformer at the yard's east end (33 kV)
  const skid = new THREE.Group();
  skid.add(box(4.6, 0.18, 2.4, MAT.darkSteel, 0, 0.09, 0));
  const tank = box(2.6, 1.9, 1.5, MAT.tankGreen, -0.6, 1.12, 0);
  tank.castShadow = true;
  skid.add(tank);
  for (let i = 0; i < 6; i++) skid.add(box(0.07, 1.5, 0.2, MAT.tankGreen, -1.6 + i * 0.42, 1.05, 0.87));
  const b1 = bushing(0.85, 0.055, 5); b1.position.set(-1.2, 2.07, 0); skid.add(b1);
  const b2 = bushing(0.85, 0.055, 5); b2.position.set(-0.6, 2.07, 0); skid.add(b2);
  const b3 = bushing(0.85, 0.055, 5); b3.position.set(0.0, 2.07, 0); skid.add(b3);
  skid.add(box(1.3, 1.5, 0.7, MAT.galvanised, 1.7, 0.93, 0)); // skid RMU
  skid.position.set(B.skid[0], 0.12, B.skid[1]);
  group.add(skid);

  // perimeter fence 2.4 m with a west gate (gap in the west run)
  const [fx0, fz0, fx1, fz1] = B.fence;
  fenceRun(group, fx0, fz0, fx1, fz0);
  fenceRun(group, fx0, fz1, fx1, fz1);
  fenceRun(group, fx1, fz0, fx1, fz1);
  const gateHalf = (3 / (fz1 - fz0));
  fenceRun(group, fx0, fz0, fx0, fz1, [0.5 - gateHalf / 2, 0.5 + gateHalf / 2]);
  // gate leaf, closed, on the west run — a framed chainlink panel
  // like the fence it hangs in. (It was a solid galvanised slab:
  // from the approach the yard's own gate blinded the whole lane,
  // which is a fence's job done wrong — real yard gates are mesh.)
  const gate = new THREE.Group();
  const gtex = chainlinkTexture();
  gtex.repeat.set(5.8 / 1.2, 2);
  const gpanel = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.0),
    new THREE.MeshStandardMaterial({
      map: gtex, transparent: true, side: THREE.DoubleSide,
      roughness: 0.5, metalness: 0.6, depthWrite: false,
    }));
  gpanel.rotation.y = Math.PI / 2;
  gate.add(gpanel);
  for (const gy of [-1.02, 0, 1.02]) gate.add(box(0.05, 0.06, 5.9, MAT.galvanised, 0, gy, 0));
  for (const gz of [-2.87, 0, 2.87]) gate.add(box(0.05, 2.06, 0.06, MAT.galvanised, 0, 0, gz));
  gate.position.set(fx0, 1.25, az);
  group.add(gate);

  return group;
}
