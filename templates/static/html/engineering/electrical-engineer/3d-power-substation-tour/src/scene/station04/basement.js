// basement.js — the second machine room under the deck: the
// condenser (16 × 9 m box at ≈10.3 kPa vacuum) with its neck rising
// to both LP exhausts, dished water boxes, the Ø2.6 m circulating-
// water pipes entering through the A-row wall, three vertical
// condensate extraction canister pumps, gland-steam and drain
// vessels. Dimmer and cooler than the deck above, by design.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { box, cyl, pipeRun } from './kit.js';

const S04 = STATION04;
const CD = S04.condenser;

export function createBasement() {
  const g = new THREE.Group();
  g.name = 's04-basement';

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8f9a94, ...SURFACE.powderCoat });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x6d766f, ...SURFACE.powderCoat });
  const soleMat = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, ...SURFACE.brushedSteel });
  const cwMat = new THREE.MeshStandardMaterial({ color: 0xa9bcc2, roughness: 0.5, metalness: 0.35 }); // pale blue-grey
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0x7e8b84, ...SURFACE.powderCoat });

  // ---- condenser body on basement columns -------------------------
  const cx = (CD.x0 + CD.x1) / 2;
  for (const px of [CD.x0 + 1.5, cx, CD.x1 - 1.5]) {
    g.add(box(1.1, CD.baseY, 1.4, soleMat, px, CD.baseY / 2, -3));
    g.add(box(1.1, CD.baseY, 1.4, soleMat, px, CD.baseY / 2, 3));
  }
  g.add(box(CD.x1 - CD.x0, CD.topY - CD.baseY, CD.halfZ * 2, bodyMat, cx, (CD.baseY + CD.topY) / 2, 0));
  // hotwell sump below the tube bundle line
  g.add(box(6, 0.9, 5, darkMat, cx, CD.baseY - 0.3, 0));
  // water boxes: dished ends on both z faces (squashed spheres read
  // as pressed channel ends at scene distance)
  for (const side of [-1, 1]) {
    const dish = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 16), darkMat);
    dish.scale.set(2.35, 1.05, 0.32);
    dish.position.set(cx, (CD.baseY + CD.topY) / 2, side * (CD.halfZ + 0.55));
    g.add(dish);
    for (let i = 0; i < 6; i++) {                       // cover bolts rhythm
      const a = (i / 6) * Math.PI * 2;
      g.add(cyl(0.06, 0.06, 0.22, soleMat, cx + Math.cos(a) * 5.6, (CD.baseY + CD.topY) / 2 + Math.sin(a) * 2.6, side * (CD.halfZ + 1.15), 8));
    }
  }
  // neck: two rectangular trunks rise to the LP exhaust slots
  for (const lp of S04.lp) {
    const lx = (lp.x0 + lp.x1) / 2, w = lp.x1 - lp.x0;
    g.add(box(w - 0.8, S04.deck.soffitY - CD.topY + 0.4, CD.halfZ * 2 - 0.8, bodyMat, lx, (CD.topY + S04.deck.soffitY) / 2, 0));
  }

  // ---- circulating-water pipes Ø2.6 m through the A-row wall ------
  const cwR = S04.cwPipe.dia / 2;
  const cwRun = (px, zBox) => {
    pipeRun([[px, 2.6, S04.hall.aZ + 0.4], [px, 2.6, zBox]], cwR, cwMat, g);
    // butterfly valve: stem + gearbox + handwheel mid-run
    g.add(cyl(0.14, 0.14, 1.3, soleMat, px, 2.6 + cwR + 0.5, -10, 10));
    g.add(box(0.55, 0.45, 0.55, darkMat, px, 2.6 + cwR + 1.25, -10));
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 8, 20), new THREE.MeshStandardMaterial({ color: PALETTE.warningRed, ...SURFACE.powderCoat }));
    wheel.position.set(px, 2.6 + cwR + 1.62, -10);
    g.add(wheel);
    // pipe support stools
    for (const sz of [-15.5, -7]) g.add(box(1.2, 1.3, 1.2, soleMat, px, 0.65, sz));
  };
  cwRun(-2, -CD.halfZ - 0.9);        // inlet to the south water box
  cwRun(7, -CD.halfZ - 0.9);         // outlet, same wall side

  // ---- condensate extraction pumps: 3 × 50 % vertical canisters ---
  for (let i = 0; i < 3; i++) {
    const px = 14.6, pz = -3 + i * 3;
    g.add(cyl(0.55, 0.55, 3.9, pumpMat, px, 1.95, pz, 18));
    g.add(cyl(0.34, 0.34, 0.8, darkMat, px, 4.3, pz, 14));       // motor on top
    pipeRun([[px, 3.6, pz], [px - 1.8, 3.6, pz], [px - 1.8, 3.6, 0]], 0.11, pumpMat, g);
  }

  // ---- gland steam condenser + drain vessels -----------------------
  g.add(box(2.4, 1.5, 1.2, pumpMat, -12, 0.75 + 0.55, -6.5));
  g.add(box(2.7, 0.55, 1.5, soleMat, -12, 0.27, -6.5));
  for (const vx of [-16.5, 15.5]) {
    const v = cyl(0.75, 0.75, 2.6, pumpMat, vx, 1.3, 6.8, 18);
    g.add(v);
    g.add(cyl(0.1, 0.1, 1.1, soleMat, vx, 3.1, 6.8, 8));
  }
  // sump pit with grating
  g.add(box(3, 0.06, 2, soleMat, 8, 0.03, 8.5));
  for (let i = 0; i < 6; i++) g.add(box(3, 0.03, 0.12, darkMat, 8, 0.07, 7.7 + i * 0.32));

  return g;
}
