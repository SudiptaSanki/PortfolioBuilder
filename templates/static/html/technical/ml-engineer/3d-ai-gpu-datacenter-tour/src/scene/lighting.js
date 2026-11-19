// lighting.js — the hall is BRIGHT: continuous neutral LED strips over every
// aisle, a high even ambient base, and gentle fills so nothing falls to
// black. Colour comes from LEDs, copper and coolant — never from gels.
// (Research: the old build's dark cyan void was failure #1 to correct.)

import * as THREE from 'three';
import { LAYOUT, PALETTE } from '../config/world.js';

const STRIP_Z = [-2.35, 0, 2.35];        // hot aisle B, cold aisle, hot aisle A
const STRIP_LEN = 7.6;

export function createLighting() {
  const group = new THREE.Group();
  group.name = 'lighting';

  // ---- fixtures: housing + emissive diffuser bar ----
  const housingMat = new THREE.MeshStandardMaterial({
    color: PALETTE.lightHousing, roughness: 0.5, metalness: 0.5,
  });
  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0x111111, emissive: PALETTE.lightNeutral, emissiveIntensity: 2.6,
  });
  for (const z of STRIP_Z) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(STRIP_LEN, 0.05, 0.24), housingMat);
    housing.position.set(0, LAYOUT.room.height - 0.06, z);
    group.add(housing);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(STRIP_LEN - 0.1, 0.02, 0.16), diffuserMat);
    bar.position.set(0, LAYOUT.room.height - 0.095, z);
    group.add(bar);
    // suspension rods
    const rodMat = housingMat;
    for (let x = -STRIP_LEN / 2 + 0.5; x < STRIP_LEN / 2; x += 1.8) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 5), rodMat);
      rod.position.set(x, LAYOUT.room.height - 0.02, z);
      group.add(rod);
    }
  }

  // ---- the rig ----
  const hemi = new THREE.HemisphereLight(0xffffff, 0xc9ced3, 0.95);
  group.add(hemi);

  const key = new THREE.DirectionalLight(0xfff6e8, 1.15);
  key.position.set(3.5, 6.5, 2.5);
  group.add(key);
  const fill = new THREE.DirectionalLight(0xeef2f5, 0.4);
  fill.position.set(-4, 5, -3);
  group.add(fill);

  // even aisle fills (the shadowless clinical wash)
  for (const x of [-1.9, 0, 1.9]) {
    const p = new THREE.PointLight(PALETTE.lightNeutral, 16, 9, 1.7);
    p.position.set(x, 2.8, 0);
    group.add(p);
  }
  for (const s of [-1, 1]) {
    const p = new THREE.PointLight(0xffffff, 9, 9, 1.7);
    p.position.set(0, 2.7, s * 2.6);
    group.add(p);
  }

  // task light over the CDU: visible cone fixture + spot
  const cdu = LAYOUT.cdu;
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.11, 0.12, 12, 1, true), housingMat);
  cone.position.set(cdu.x, LAYOUT.room.height - 0.1, cdu.z);
  group.add(cone);
  const spot = new THREE.SpotLight(0xfff8ec, 60, 7, 0.62, 0.5, 1.4);
  spot.position.set(cdu.x, LAYOUT.room.height - 0.16, cdu.z);
  spot.target.position.set(cdu.x, 0.9, cdu.z);
  group.add(spot, spot.target);

  return group;
}
