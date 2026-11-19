// streetFurniture.js — the human-scale evidence (inventory §4.9,
// §4.11): a bus stop with one lit panel, the street tree whose
// canopy catches the light from below, parked two-wheelers and a
// hatchback and the tea stall's auto-rickshaw (scale cues, kept
// low-detail), and the meter box clusters where the 415 V actually
// lands — the last 50 metres of the system, on the wall.

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';
import { box, cyl, mat, textPlate, lampGlow } from './helpers.js';

const S06 = STATION06;
const P06 = S06.palette;

// a bank of meter boxes with conduit drops, on a wall
function meterCluster(x, y, z, rotY, n) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    g.add(box(0.32, 0.42, 0.14, mat.std(0x707880, 'powderCoat'), (i - (n - 1) / 2) * 0.38, 0, 0));
    g.add(box(0.2, 0.14, 0.02, mat.std(0x3c4147, 'powderCoat'), (i - (n - 1) / 2) * 0.38, 0.03, -0.075));
  }
  // conduit drops from each box to the ground entry
  for (let i = 0; i < n; i++) {
    g.add(cyl(0.016, 0.016, y - 0.2, mat.galv(), (i - (n - 1) / 2) * 0.38, -(y - 0.2) / 2 - 0.21, -0.02, 6));
  }
  const lab = textPlate(0.9, 0.16, [{ text: 'METER BANK · 415 V 3-PH 4-WIRE', size: 72, color: '#dfe5ea' }],
    { px: [1152, 192], bg: '#26292d', emissive: 0.3 });
  lab.position.set(0, 0.38, -0.02);
  lab.rotation.y = Math.PI;
  g.add(lab);
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  return g;
}

// a simple two-wheeler silhouette: two wheels, tank hump, seat
function scooter(x, z, rotY, color) {
  const g = new THREE.Group();
  const body = mat.std(color, 'powderCoat');
  for (const dx of [-0.55, 0.55]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.045, 8, 18), mat.darkSteel());
    wheel.position.set(dx, 0.21, 0);
    g.add(wheel);
  }
  g.add(box(0.85, 0.16, 0.16, body, 0.05, 0.42, 0));
  const cowl = box(0.3, 0.42, 0.2, body, 0.52, 0.62, 0);
  cowl.rotation.z = -0.35;
  g.add(cowl);
  g.add(box(0.5, 0.09, 0.22, mat.std(0x24262a, 'powderCoat'), -0.25, 0.58, 0));   // seat
  g.add(box(0.06, 0.3, 0.3, mat.darkSteel(), 0.68, 0.85, 0));                    // handlebar stem
  g.position.set(x, 0.12, z);
  g.rotation.y = rotY;
  return g;
}

export function createStreetFurniture() {
  const group = new THREE.Group();
  group.name = 's06-street-furniture';

  // ---- bus stop on the south footpath: shelter + one lit ad panel
  const bus = new THREE.Group();
  const frameMat = mat.darkSteel();
  for (const [dx, dz] of [[-1.5, -0.5], [1.5, -0.5], [-1.5, 0.5], [1.5, 0.5]]) {
    bus.add(cyl(0.04, 0.04, 2.5, frameMat, dx, 1.25, dz, 8));
  }
  bus.add(box(3.4, 0.07, 1.3, frameMat, 0, 2.53, 0));
  bus.add(box(2.6, 0.08, 0.4, mat.std(0x4c5157, 'powderCoat'), 0, 0.55, 0.42));   // bench
  const ad = textPlate(0.95, 1.5, [
    { text: 'CITY BUS', size: 88, color: '#ffd9a0' },
    { text: 'ROUTE 42', size: 76, color: '#e8ecf0' },
    { text: 'STATION ROAD', size: 60, color: '#c8cfd6' },
  ], { px: [640, 1024], bg: '#27384a', emissive: 0.65 });
  ad.position.set(-1.72, 1.35, 0);
  ad.rotation.y = -Math.PI / 2 - 0.0;
  bus.add(ad);
  bus.add(lampGlow(-1.85, 1.35, 0, 1.6, 0xdfe9ff, 0.35));
  bus.position.set(14, 0.12, -6.1);
  group.add(bus);

  // ---- the street tree: pit, trunk, canopy lit from below by the
  // streetlight beside it (§4.9 — the canopy catches the light)
  const tree = new THREE.Group();
  tree.add(box(1.3, 0.1, 1.3, mat.std(0x4c4438, 'concrete'), 0, 0.05, 0));
  const trunk = cyl(0.14, 0.2, 3.1, mat.std(0x4a3d30, 'mattePaint'), 0, 1.6, 0, 8);
  tree.add(trunk);
  const canopyMat = mat.std(0x2c4426, 'mattePaint', { emissive: 0x1d2f16, emissiveIntensity: 0.35 });
  for (const [dx, dy, dz, r] of [[0, 3.9, 0, 1.9], [-1.1, 3.4, 0.4, 1.3], [1.15, 3.5, -0.3, 1.35], [0.3, 4.4, 0.7, 1.2]]) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), canopyMat);
    c.position.set(dx, dy, dz);
    c.scale.y = 0.75;
    tree.add(c);
  }
  tree.position.set(-24, 0.12, 6.55);
  group.add(tree);

  // ---- parked vehicles: scooter row by the shops, one hatchback,
  // the auto-rickshaw at the tea stall (scale cues, not heroes)
  const scooterCols = [0x5d3a3a, 0x33506e, 0x3a3f45, 0x6e6136, 0x2e4a3e];
  scooterCols.forEach((col, i) => {
    group.add(scooter(-30 + i * 1.7, 7.55, Math.PI / 2 + (i % 2 ? 0.06 : -0.05), col));
  });
  const car = new THREE.Group();
  const carMat = mat.std(0x707a84, 'powderCoat', { metalness: 0.5, roughness: 0.35 });
  car.add(box(3.6, 0.55, 1.65, carMat, 0, 0.55, 0));
  car.add(box(2.0, 0.5, 1.55, mat.std(0x2c343c, 'powderCoat'), -0.15, 1.05, 0));
  for (const [dx, dz] of [[-1.25, -0.8], [1.25, -0.8], [-1.25, 0.8], [1.25, 0.8]]) {
    const w = cyl(0.31, 0.31, 0.1, mat.darkSteel(), dx, 0.31, dz, 14);
    w.rotation.x = Math.PI / 2;
    car.add(w);
  }
  car.position.set(18, 0.02, -5.35);
  group.add(car);
  const auto = new THREE.Group();
  const autoMat = mat.std(0x2e4a3e, 'powderCoat');
  auto.add(box(2.3, 1.05, 1.25, autoMat, 0, 0.85, 0));
  auto.add(box(2.0, 0.5, 1.15, mat.std(0xd9a441, 'powderCoat'), -0.1, 1.55, 0));   // yellow hood band… canopy
  for (const [dx, dz] of [[-0.8, -0.6], [0.8, -0.6], [0, 0.62]]) {
    const w = cyl(0.26, 0.26, 0.09, mat.darkSteel(), dx, 0.26, dz, 12);
    w.rotation.x = Math.PI / 2;
    auto.add(w);
  }
  auto.position.set(42.2, 0.02, 4.6);
  auto.rotation.y = 0.5;
  group.add(auto);

  // ---- meter clusters: apartment east wall (fed by the long drop),
  // shop row wall, one house (§4.11). The cluster's face is its local
  // −z; rotY turns that face to the street in each case.
  group.add(meterCluster(-9.9, 1.6, -12.5, -Math.PI / 2, 6));    // face +x
  group.add(meterCluster(-20, 1.6, 8.14, 0, 5));                 // face −z
  group.add(meterCluster(9, 1.6, -9.44, Math.PI, 4));            // face +z

  // ---- a pasted board notice on the hero-adjacent pole's neighbour
  const notice = textPlate(0.3, 0.4, [
    { text: 'NOTICE', size: 80, color: '#3a3f45' },
    { text: 'PLANNED SHUTDOWN', size: 56, color: '#5a6068' },
    { text: 'SUN 06:00–09:00', size: 56, color: '#5a6068' },
  ], { px: [384, 512], bg: '#ddd6c4', emissive: 0.12 });
  notice.position.set(-30, 1.9, S06.feeder.poleZ - 0.17);
  notice.rotation.y = Math.PI;
  group.add(notice);

  return group;
}
