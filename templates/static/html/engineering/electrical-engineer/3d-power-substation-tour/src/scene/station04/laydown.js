// laydown.js — the maintenance story at the deck's east end: the
// spare HP/IP rotor lying across the deck on two trestle stands
// (its blade rows drawn as fine circumferential ribs — at scene
// distance the ribbing IS the reading of a rotor), ends sheeted and
// tagged; beside it an LP upper casing half on blocks, a lifting
// beam and a pallet of coiled slings.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { box, cyl } from './kit.js';

const S04 = STATION04;
const DY = S04.deck.topY;

export function createLaydown() {
  const g = new THREE.Group();
  g.name = 's04-laydown';

  const steel = new THREE.MeshStandardMaterial({ color: 0xd7dade, ...SURFACE.brushedSteel });
  const darkMat = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, ...SURFACE.brushedSteel });
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x9aa294, ...SURFACE.powderCoat });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xa98f66, roughness: 0.9, metalness: 0 });
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xd9d5c9, roughness: 0.85, metalness: 0 });

  // ---- spare HP/IP rotor across the deck at x ≈ 31 ----------------
  const rotor = new THREE.Group();
  const axisY = DY + 1.05;
  // journals + stepped barrel sections along z
  const sections = [
    [-3.9, 0.55, 0.3], [-3.1, 0.85, 0.42], [-1.9, 1.5, 0.62], [-0.2, 1.7, 0.72],
    [1.5, 1.5, 0.62], [2.9, 0.85, 0.42], [3.8, 0.55, 0.3],
  ];
  for (const [zc, len, r] of sections) {
    const s = cyl(r, r, len, steel, 0, 0, zc, 22);
    s.rotation.x = Math.PI / 2;
    rotor.add(s);
  }
  // blade rows: fine ribs on the two big sections
  for (const [z0, z1, r] of [[-1.85, -0.3, 0.66], [0.75, 2.2, 0.66]]) {
    for (let z = z0; z < z1; z += 0.16) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(r, 0.028, 6, 26), darkMat);
      rib.position.set(0, 0, z);
      rotor.add(rib);
    }
  }
  // sheeted ends
  for (const zc of [-4.35, 4.35]) {
    const cap = cyl(0.42, 0.42, 0.7, sheetMat, 0, 0, zc, 14);
    cap.rotation.x = Math.PI / 2;
    rotor.add(cap);
  }
  rotor.position.set(31, axisY, 0);
  g.add(rotor);
  // trestle stands with timber saddles
  for (const zc of [-2.6, 2.6]) {
    g.add(box(1.1, axisY - DY - 0.25, 0.5, darkMat, 31, DY + (axisY - DY - 0.25) / 2, zc));
    g.add(box(1.5, 0.22, 0.9, woodMat, 31, axisY - 0.42, zc));
    g.add(box(1.7, 0.14, 1.3, darkMat, 31, DY + 0.07, zc));
  }

  // ---- LP upper casing half on blocks (a huge shallow shell) -------
  // half-cylinder shell: theta 0..PI is the +x half; rotation.z
  // +90° maps +x to +y, so the arc domes upward with its axis on x
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4.6, 22, 1, true, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x9aa294, ...SURFACE.powderCoat, side: THREE.DoubleSide }));
  shell.rotation.z = Math.PI / 2;
  shell.position.set(30.4, DY + 0.6, -3.9);
  g.add(shell);
  g.add(box(4.8, 0.35, 0.5, hoodMat, 30.4, DY + 0.5, -3.9));   // joint flange edge
  for (const bx of [28.6, 32.2]) g.add(box(0.5, 0.6, 2.2, woodMat, bx, DY + 0.3, -3.9));

  // ---- lifting beam + slings pallet ---------------------------------
  g.add(box(4.6, 0.3, 0.24, darkMat, 30.8, DY + 0.35, 4.9));
  for (const bx of [29, 32.6]) g.add(box(0.35, 0.5, 0.9, darkMat, bx, DY + 0.1, 4.9));
  g.add(box(1.2, 0.14, 1.2, woodMat, 28.6, DY + 0.07, 4.6));
  for (let i = 0; i < 3; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.32 - i * 0.05, 0.05, 8, 20), darkMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(28.6, DY + 0.2 + i * 0.11, 4.6);
    g.add(coil);
  }

  return g;
}
