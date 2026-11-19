// metMast.js — the 105 m meteorological mast (inventory §4.6),
// modelled at hub height because that is its whole point: measure
// where the rotor will live. Galvanised lattice ~450 mm square face,
// guyed at three levels to concrete anchors, booms and cup
// anemometers per IEC 61400-12-1 practice, top 10 m in aviation
// orange/white. Its 10-minute averages are the numbers on the
// substation plate — the data the lenders believed.

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';
import { MAT, box, cyl } from './kit.js';
import { fenceRun } from './bess.js';

const S05 = STATION05;

export function createMetMast() {
  const group = new THREE.Group();
  group.name = 's05-met-mast';
  const { x, z, height } = S05.mast;
  const g = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({ color: 0xd96c27, roughness: 0.6, metalness: 0.3 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.6, metalness: 0.3 });

  const half = 0.225; // 450 mm face
  const corners = [[-half, -half], [half, -half], [-half, half], [half, half]];
  // legs: galvanised to 95 m, aviation bands above
  for (const [cx, cz] of corners) {
    g.add(cyl(0.035, 0.045, 95, MAT.galvanised, cx, 47.5, cz, 6));
    g.add(cyl(0.03, 0.035, 5, orange, cx, 97.5, cz, 6));
    g.add(cyl(0.03, 0.03, 5, white, cx, 102.5, cz, 6));
  }
  // horizontal rings every 7.5 m
  for (let y = 3.75; y < height; y += 7.5) {
    const mat = y > 95 ? (Math.round(y / 7.5) % 2 ? orange : white) : MAT.galvanised;
    g.add(box(half * 2 + 0.05, 0.05, 0.05, mat, 0, y, -half));
    g.add(box(half * 2 + 0.05, 0.05, 0.05, mat, 0, y, half));
    g.add(box(0.05, 0.05, half * 2 + 0.05, mat, -half, y, 0));
    g.add(box(0.05, 0.05, half * 2 + 0.05, mat, half, y, 0));
  }
  // diagonal bracing as lines on all four faces
  const bracePts = [];
  for (let y = 0; y < height - 7.5; y += 7.5) {
    for (const [a, b, axis] of [[-half, half, 'z'], [half, -half, 'z'], [-half, half, 'x'], [half, -half, 'x']]) {
      if (axis === 'z') {
        bracePts.push(new THREE.Vector3(a, y, -half), new THREE.Vector3(b, y + 7.5, -half));
        bracePts.push(new THREE.Vector3(a, y, half), new THREE.Vector3(b, y + 7.5, half));
      } else {
        bracePts.push(new THREE.Vector3(-half, y, a), new THREE.Vector3(-half, y + 7.5, b));
        bracePts.push(new THREE.Vector3(half, y, a), new THREE.Vector3(half, y + 7.5, b));
      }
    }
  }
  const braces = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(bracePts),
    new THREE.LineBasicMaterial({ color: 0x8f959a }));
  g.add(braces);

  // lightning rod above the top
  g.add(cyl(0.012, 0.02, 3.4, MAT.galvanised, 0, height + 1.7, 0, 6));

  // instrument booms into the prevailing wind (WNW), sensors per IEC
  const boomDir = new THREE.Vector3(-0.85, 0, -0.45).normalize();
  for (const lvl of [40, 60, 80, 100, 104]) {
    const boom = box(2.4, 0.05, 0.05, MAT.galvanised, boomDir.x * 1.2, lvl, boomDir.z * 1.2);
    boom.rotation.y = Math.atan2(boomDir.x, boomDir.z) + Math.PI / 2;
    g.add(boom);
    const tipX = boomDir.x * 2.4, tipZ = boomDir.z * 2.4;
    g.add(box(0.16, 0.22, 0.12, white, tipX, lvl + 0.05, tipZ)); // sensor body
    if (lvl >= 100) {
      // three-cup rotor, suggested at hero distance
      for (let i = 0; i < 3; i++) {
        const a = (i * 2 * Math.PI) / 3;
        const cup = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), MAT.darkSteel);
        cup.position.set(tipX + Math.cos(a) * 0.14, lvl + 0.28, tipZ + Math.sin(a) * 0.14);
        g.add(cup);
      }
      g.add(cyl(0.015, 0.015, 0.3, MAT.darkSteel, tipX, lvl + 0.15, tipZ, 5));
    }
  }

  // guy wires: 3 levels × 3 directions to concrete anchor blocks
  const guyMat = new THREE.LineBasicMaterial({ color: 0x777d83 });
  const guyPts = [];
  const dirs = [[0.5, -0.87], [-0.5, -0.87], [0, 1]];
  for (const lvl of [35, 70, 100]) {
    for (const [dx, dz] of dirs) {
      const ax = dx * 36, az = dz * 36;
      guyPts.push(new THREE.Vector3(0, lvl, 0), new THREE.Vector3(ax, 0.6, az));
    }
  }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(guyPts), guyMat));
  for (const [dx, dz] of dirs) {
    g.add(box(1.3, 0.8, 1.3, MAT.concrete, dx * 36, 0.4, dz * 36));
  }

  // base: logger cabinet, its little solar panel, battery box
  g.add(box(0.9, 1.3, 0.5, MAT.galvanised, 1.1, 0.65, 0.6));
  g.add(box(0.5, 0.4, 0.4, MAT.darkSteel, 1.15, 0.2, -0.7));
  const panelPole = cyl(0.03, 0.03, 1.6, MAT.structure, -1.2, 0.8, 0.8, 6);
  g.add(panelPole);
  const pvPanel = box(0.75, 0.04, 1.05, new THREE.MeshStandardMaterial({ color: 0x131a26, roughness: 0.3 }), -1.2, 1.7, 0.8);
  pvPanel.rotation.x = 0.5;
  g.add(pvPanel);

  g.position.set(x, 0, z);
  group.add(g);

  // its own little fence square
  fenceRun(group, x - 2.2, z - 2.2, x + 2.2, z - 2.2);
  fenceRun(group, x - 2.2, z + 2.2, x + 2.2, z + 2.2);
  fenceRun(group, x - 2.2, z - 2.2, x - 2.2, z + 2.2);
  fenceRun(group, x + 2.2, z - 2.2, x + 2.2, z + 2.2);

  void height;
  return group;
}
