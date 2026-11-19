// oilSkid.js — the lube-oil plant and deck services. At ground
// floor beside the pedestal: the 58 m³ main oil tank with its pumps,
// coolers, duplex filters and the centrifuge purification skid
// (system inventory ≈52,000 L of ISO VG 32). On the deck by the
// front standard: the EHC governor cabinet row and the turbine
// supervisory panel. Red appears only on the fire-water line and
// handwheels — the hall's colour discipline.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { box, cyl, pipeRun } from './kit.js';

const S04 = STATION04;
const DY = S04.deck.topY;

export function createOilSkid() {
  const g = new THREE.Group();
  g.name = 's04-oil-skid';

  const tankMat = new THREE.MeshStandardMaterial({ color: 0xcacfc9, ...SURFACE.powderCoat });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x565e58, ...SURFACE.powderCoat });
  const soleMat = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, ...SURFACE.brushedSteel });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xb9bcba, roughness: 0.45, metalness: 0.6 });
  const oilMat = new THREE.MeshStandardMaterial({ color: 0xb59a5e, roughness: 0.55, metalness: 0.3 });

  // ---- main oil tank: 58 m³ (≈7 × 3 × 3 m), bunded -----------------
  const { x: mx, z: mz } = S04.mot;
  g.add(box(7.6, 0.25, 3.8, soleMat, mx, 0.12, mz));                        // bund plinth
  g.add(box(7, 3, 3, tankMat, mx, 1.75, mz));
  g.add(box(7.1, 0.18, 3.1, darkMat, mx, 3.32, mz));
  // vapour exhauster fan + vent stack on the roof
  g.add(cyl(0.32, 0.32, 0.6, darkMat, mx - 2.6, 3.7, mz, 14));
  g.add(cyl(0.14, 0.14, 1.6, pipeMat, mx - 2.6, 4.6, mz, 10));
  // level gauge glass on the south face
  g.add(box(0.1, 2.2, 0.08, new THREE.MeshStandardMaterial({ color: 0xd8b25e, roughness: 0.2, metalness: 0.1 }), mx + 3.2, 1.8, mz - 1.56));
  // AC + DC lube-oil pumps standing on the tank top (classic layout)
  for (const [px, pm] of [[-1.4, darkMat], [0.2, darkMat], [1.8, soleMat]]) {
    g.add(cyl(0.21, 0.25, 0.85, pm, mx + px, 3.85, mz + 0.7, 12));
    g.add(cyl(0.26, 0.26, 0.45, pm, mx + px, 4.5, mz + 0.7, 12));
  }
  // oil coolers: two boxy plate exchangers with CW pipes
  for (const cx of [mx - 1.2, mx + 1.6]) {
    g.add(box(2.1, 1.5, 0.9, tankMat, cx, 0.95, mz - 3.1));
    for (let f = 0; f < 4; f++) g.add(box(2.16, 0.07, 0.96, soleMat, cx, 0.45 + f * 0.36, mz - 3.1));
    pipeRun([[cx, 1.75, mz - 3.1], [cx, 1.75, mz - 1.8]], 0.09, pipeMat, g);
  }
  // duplex filter pair
  for (const fx of [mx + 3.1, mx + 3.85]) g.add(cyl(0.3, 0.3, 1.3, darkMat, fx, 0.9, mz - 2.9, 14));
  // riser: tank top → the deck header (turbine.js draws the deck run)
  pipeRun([[mx, 3.4, mz + 1.2], [mx, 3.4, -7.4]], 0.11, oilMat, g);

  // ---- centrifuge purification skid ---------------------------------
  g.add(box(3.4, 0.2, 2.2, soleMat, mx + 9.5, 0.1, mz));
  const bowl = cyl(0.55, 0.7, 1.15, tankMat, mx + 8.6, 0.78, mz, 18);
  g.add(bowl);
  g.add(cyl(0.2, 0.2, 0.5, darkMat, mx + 8.6, 1.6, mz, 10));
  g.add(box(1.1, 1.5, 1.1, tankMat, mx + 10.6, 0.95, mz));                   // clean-oil tank
  pipeRun([[mx + 3.6, 1.2, mz], [mx + 7.8, 1.2, mz]], 0.07, oilMat, g);

  // ---- EHC governor cabinets on the deck, by the front standard ----
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xc6c9c4, ...SURFACE.powderCoat });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x232a2e, roughness: 0.2, metalness: 0.3 });
  for (let i = 0; i < 5; i++) {
    const cx = -30.2 + i * 1.05;
    g.add(box(0.95, 2.2, 0.6, cabMat, cx, DY + 1.1, 5.3));
    g.add(box(0.7, 0.45, 0.03, glassMat, cx, DY + 1.72, 4.98));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.025, 8),
      new THREE.MeshStandardMaterial({ color: 0x111111, emissive: PALETTE.ledGreen, emissiveIntensity: 1.6 }));
    dot.position.set(cx - 0.28, DY + 1.32, 4.98);
    dot.rotation.y = Math.PI;
    g.add(dot);
  }
  // turbine supervisory panel (vibration / expansion) — dark glass front
  g.add(box(1.5, 2.2, 0.6, cabMat, -24.2, DY + 1.1, 5.3));
  g.add(box(1.24, 1.5, 0.03, glassMat, -24.2, DY + 1.2, 4.98));
  // cable tray from the cabinets toward the BC bay
  g.add(box(9, 0.07, 0.4, soleMat, -27.5, DY + 2.75, 5.6));
  g.add(box(0.4, 0.07, 12, soleMat, -23.4, DY + 2.75, 11.5));

  // ---- deck services: fire line (red, only here) + hose reel -------
  const fireMat = new THREE.MeshStandardMaterial({ color: PALETTE.warningRed, ...SURFACE.powderCoat });
  pipeRun([[-32, DY + 0.28, 6.15], [32, DY + 0.28, 6.15]], 0.055, fireMat, g);
  const reel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 8, 22), fireMat);
  reel.position.set(-18, DY + 0.85, 6.2);
  g.add(reel);
  g.add(cyl(0.05, 0.05, 0.85, soleMat, -18, DY + 0.42, 6.2, 8));
  // red spoked handwheels on steam drains at deck level
  for (const hx of [-20.5, -6.5, 8.5]) {
    g.add(cyl(0.045, 0.045, 0.6, soleMat, hx, DY + 0.3, -4.6, 8));
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.032, 8, 18), fireMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(hx, DY + 0.62, -4.6);
    g.add(wheel);
  }
  // chain-block monorail over the HP
  g.add(box(9, 0.22, 0.18, soleMat, -23.6, DY + 5.4, 0));
  g.add(box(0.3, 0.5, 0.3, darkMat, -24.4, DY + 5.05, 0));
  g.add(cyl(0.02, 0.02, 1.1, soleMat, -24.4, DY + 4.4, 0, 6));

  return g;
}
