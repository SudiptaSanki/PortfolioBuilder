// cabling.js — overhead power & data distribution: ladder trays on threaded
// rods, colour-coded fibre bundles (aqua OM4 / yellow OS2 / blue Cat6A),
// copper busbars, busway trunking with a tap-off box + power whip per rack,
// and (on hero racks) the rear NVLink copper cartridge + vertical managers.
// Colour conventions come from config/world.js — never rainbow noise.

import * as THREE from 'three';
import { LAYOUT, RACK, PALETTE, SURFACE } from '../config/world.js';

const ROW_LEN = LAYOUT.racksPerRow * RACK.width;      // 4.8
const TRAY_LEN = ROW_LEN + 1.6;                        // overhang past the rows
const LEVELS = [                                       // two stacked trays
  { y: 2.44, kind: 'power' },
  { y: 2.64, kind: 'fibre' },
];

const galvMat = () => new THREE.MeshStandardMaterial({
  color: PALETTE.galvanised, roughness: 0.45, metalness: 0.8,
});

function tube(points, radius, color, rough = 0.6) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, 48, radius, 6, false);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
  return new THREE.Mesh(geo, mat);
}

// ---------------------------------------------------------- one row -----
function buildRowOverhead(group, rowSign) {
  const zc = rowSign * LAYOUT.rowZ;                    // rack centre line
  const galv = galvMat();

  for (const level of LEVELS) {
    // ladder tray: two side rails + instanced rungs
    for (const dz of [-0.14, 0.14]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(TRAY_LEN, 0.05, 0.03), galv);
      rail.position.set(0, level.y, zc + dz);
      group.add(rail);
    }
    const rungCount = Math.floor(TRAY_LEN / 0.3);
    const rungs = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.03, 0.015, 0.28), galv, rungCount);
    const d = new THREE.Object3D();
    for (let i = 0; i < rungCount; i++) {
      d.position.set(-TRAY_LEN / 2 + 0.15 + i * 0.3, level.y - 0.01, zc);
      d.updateMatrix();
      rungs.setMatrixAt(i, d.matrix);
    }
    rungs.instanceMatrix.needsUpdate = true;
    group.add(rungs);

    // threaded rods up to the ceiling structure
    const rodGeo = new THREE.CylinderGeometry(0.006, 0.006, LAYOUT.room.height - level.y, 5);
    for (let x = -TRAY_LEN / 2 + 0.4; x < TRAY_LEN / 2; x += 1.55) {
      for (const dz of [-0.14, 0.14]) {
        const rod = new THREE.Mesh(rodGeo, galv);
        rod.position.set(x, (level.y + LAYOUT.room.height) / 2, zc + dz);
        group.add(rod);
      }
    }

    // cable bundles lying in the tray
    if (level.kind === 'fibre') {
      const runs = [
        { dz: -0.07, color: PALETTE.fibreAqua, r: 0.02 },
        { dz: 0.0, color: PALETTE.fibreAqua, r: 0.016 },
        { dz: 0.07, color: PALETTE.fibreYellow, r: 0.014 },
      ];
      for (const run of runs) {
        const pts = [];
        for (let x = -TRAY_LEN / 2; x <= TRAY_LEN / 2 + 0.01; x += 0.8) {
          pts.push([x, level.y + 0.035 - Math.abs(Math.sin(x * 1.3 + run.dz * 40)) * 0.008, zc + run.dz]);
        }
        group.add(tube(pts, run.r, run.color));
      }
    } else {
      const pts = [];
      for (let x = -TRAY_LEN / 2; x <= TRAY_LEN / 2 + 0.01; x += 0.8) {
        pts.push([x, level.y + 0.03, zc - 0.05]);
      }
      group.add(tube(pts, 0.018, PALETTE.cat6Blue));
    }
  }

  // copper busbar pair riding beside the power tray
  const copperMat = new THREE.MeshStandardMaterial({ color: PALETTE.copper, ...SURFACE.copper });
  for (const dz of [-0.05, 0.05]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(TRAY_LEN, 0.004, 0.04), copperMat);
    bar.position.set(0, LEVELS[0].y + 0.09, zc + dz + 0.22 * rowSign);
    group.add(bar);
  }

  // busway trunking + tap-off box and whip per rack
  const busMat = new THREE.MeshStandardMaterial({ color: PALETTE.busway, ...SURFACE.paintedMetal });
  const busway = new THREE.Mesh(new THREE.BoxGeometry(ROW_LEN + 0.4, 0.09, 0.16), busMat);
  busway.position.set(0, 2.3, zc);
  group.add(busway);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(ROW_LEN + 0.4, 0.02, 0.162),
    new THREE.MeshStandardMaterial({ color: PALETTE.buswayStripe, roughness: 0.6 }));
  stripe.position.set(0, 2.3, zc);
  group.add(stripe);

  const tapMat = new THREE.MeshStandardMaterial({ color: 0x8f959b, ...SURFACE.paintedMetal });
  for (let i = 0; i < LAYOUT.racksPerRow; i++) {
    const x = LAYOUT.rowStartX + i * RACK.width;
    const tap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.15), tapMat);
    tap.position.set(x, 2.19, zc);
    group.add(tap);
    const whip = tube(
      [[x, 2.13, zc], [x + 0.04, 2.02, zc + rowSign * 0.12], [x, RACK.height + 0.01, zc + rowSign * 0.38]],
      0.02, 0x24262a, 0.75);
    group.add(whip);
  }
}

// ------------------------------------------------- hero rack rears ------
function braidTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#a06a30'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(60,32,8,0.55)'; g.lineWidth = 5;
  for (let i = -128; i < 256; i += 14) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
    g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke();
  }
  g.strokeStyle = 'rgba(255,210,140,0.35)'; g.lineWidth = 2;
  for (let i = -128; i < 256; i += 14) {
    g.beginPath(); g.moveTo(i + 4, 0); g.lineTo(i + 132, 128); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 6);
  return t;
}

// Rear-of-rack cabling for hero racks (local rack space, rear = +Z).
export function addRackRearCabling(rackGroup, anchor) {
  if (!anchor.hero) return;
  // NVLink copper cartridge — the braided copper spine at the rear centre
  const cartridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 1.45, 0.07),
    new THREE.MeshStandardMaterial({ map: braidTexture(), roughness: 0.42, metalness: 0.85 }));
  cartridge.position.set(0, 1.12, RACK.depth / 2 - 0.12);
  rackGroup.add(cartridge);

  // vertical cable managers either side of the cartridge
  const mgrMat = new THREE.MeshStandardMaterial({ color: 0x0e0f11, roughness: 0.8 });
  for (const sx of [-1, 1]) {
    const mgr = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.85, 0.09), mgrMat);
    mgr.position.set(sx * 0.245, 1.05, RACK.depth / 2 - 0.1);
    rackGroup.add(mgr);
  }
  // a few dressed aqua patch loops between manager and cartridge
  for (let i = 0; i < 3; i++) {
    const y = 0.6 + i * 0.45;
    const loop = tube(
      [[-0.245, y, RACK.depth / 2 - 0.06], [-0.12, y - 0.07, RACK.depth / 2 - 0.02],
       [0.12, y - 0.07, RACK.depth / 2 - 0.02], [0.245, y, RACK.depth / 2 - 0.06]],
      0.011, PALETTE.fibreAqua);
    rackGroup.add(loop);
  }
}

// -------------------------------------------------------------- main ----
export function createCabling() {
  const group = new THREE.Group();
  group.name = 'cabling';
  buildRowOverhead(group, 1);
  buildRowOverhead(group, -1);
  return group;
}
