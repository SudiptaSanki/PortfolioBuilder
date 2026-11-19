// pedestal.js — the TG deck and what holds it up: a 66 × 13 m
// concrete table at +14 m with open wells over the LP exhausts and a
// slot for the generator bus ducts, standing on 26 columns (T1–T26)
// whose heads carry the station's signature detail — steel spring
// vibration isolator (VIS) canisters in a visible shadow gap, tuning
// the foundation to ≈2–3 Hz against the machine's 50 Hz. Handrails
// with kick plates guard the deck edges and every opening.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { box, cyl, placeRailing } from './kit.js';

const S04 = STATION04;
const D = S04.deck;
const LP = S04.lp;

export function createPedestal() {
  const g = new THREE.Group();
  g.name = 's04-pedestal';

  const deckMat = new THREE.MeshStandardMaterial({ color: 0x66705f, ...SURFACE.concrete }); // dark grey-green anti-slip
  const deckEdge = new THREE.MeshStandardMaterial({ color: PALETTE.concreteDark, ...SURFACE.concrete });
  const colMat = new THREE.MeshStandardMaterial({ color: PALETTE.concrete, ...SURFACE.concrete });
  const visMat = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, ...SURFACE.brushedSteel });
  const visPlate = new THREE.MeshStandardMaterial({ color: PALETTE.structureGrey, ...SURFACE.galvanised });
  const yel = new THREE.MeshStandardMaterial({ color: PALETTE.safetyYellow, ...SURFACE.powderCoat });
  const chevMat = new THREE.MeshStandardMaterial({ color: 0x2e3236, ...SURFACE.mattePaint });

  const thick = D.topY - D.soffitY;
  const midY = (D.topY + D.soffitY) / 2;
  const seg = (x0, x1, z0, z1) => {
    if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
    g.add(box(x1 - x0, thick, z1 - z0, deckMat, (x0 + x1) / 2, midY, (z0 + z1) / 2));
    g.add(box(x1 - x0, 0.35, z1 - z0, deckEdge, (x0 + x1) / 2, D.soffitY + 0.17, (z0 + z1) / 2));
  };

  // deck slab in segments — openings over both LP exhausts and a
  // bus-duct slot on the generator's south side (x 16.5..22.5, z -3.4..-2.2)
  seg(D.x0, LP[0].x0, -D.halfZ, D.halfZ);
  seg(LP[0].x1, LP[1].x0, -D.halfZ, D.halfZ);
  seg(LP[1].x1, 16.5, -D.halfZ, D.halfZ);
  seg(22.5, D.x1, -D.halfZ, D.halfZ);
  seg(16.5, 22.5, -D.halfZ, -3.4);
  seg(16.5, 22.5, -2.2, D.halfZ);
  for (const lp of LP) {           // strips flanking each LP opening
    seg(lp.x0, lp.x1, -D.halfZ, -S04.lpHood.halfZ);
    seg(lp.x0, lp.x1, S04.lpHood.halfZ, D.halfZ);
  }

  // yellow walkway lines + chevron strip along the open south edge
  const lineMat = new THREE.MeshStandardMaterial({ color: PALETTE.safetyYellow, ...SURFACE.mattePaint });
  g.add(box(D.x1 - D.x0 - 2, 0.012, 0.12, lineMat, 0, D.topY + 0.006, D.halfZ - 0.85));
  g.add(box(D.x1 - D.x0 - 2, 0.012, 0.12, lineMat, 0, D.topY + 0.006, -D.halfZ + 0.85));
  for (let x = D.x0 + 1; x < D.x1 - 1; x += 1.2) {
    const ch = box(0.55, 0.012, 0.3, (Math.round(x) % 2 === 0) ? chevMat : lineMat, x, D.topY + 0.006, -D.halfZ + 0.3);
    ch.rotation.y = 0.6;
    g.add(ch);
  }

  // ---- 26 columns T1–T26 + VIS spring canisters ------------------
  let n = 0;
  for (const z of [-D.colZ, D.colZ]) {
    for (let i = 0; i < 13; i++) {
      const x = -31.2 + i * D.colPitch;
      n++;
      g.add(box(1.2, 10.2, 1.8, colMat, x, 5.1, z));                       // column shaft
      g.add(box(1.7, 0.35, 2.3, colMat, x, 0.17, z));                      // footing pad
      // VIS canister group in the shadow gap, 10.2 → 11.2
      g.add(box(1.15, 0.1, 1.15, visPlate, x, 10.25, z));
      const can = cyl(0.42, 0.42, 0.78, visMat, x, 10.69, z, 20);
      g.add(can);
      for (let s = 0; s < 5; s++) {                                          // spring stack rings
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.045, 8, 20), visMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, 10.38 + s * 0.16, z);
        g.add(ring);
      }
      g.add(box(1.15, 0.1, 1.15, visPlate, x, 11.13, z));
    }
  }

  // ---- handrails: deck perimeter + LP opening guards -------------
  const rail = (len, x, z, rotY) => g.add(placeRailing(len, yel, x, D.topY, z, rotY));
  rail(D.x1 - D.x0, 0, -D.halfZ + 0.06, 0);
  rail(D.x1 - D.x0, 0, D.halfZ - 0.06, 0);
  rail(D.halfZ * 2, D.x0 + 0.06, 0, Math.PI / 2);
  rail(D.halfZ * 2, D.x1 - 0.06, 0, Math.PI / 2);
  for (const lp of LP) {
    const w = lp.x1 - lp.x0, cx = (lp.x0 + lp.x1) / 2;
    rail(w, cx, -S04.lpHood.halfZ - 0.35, 0);
    rail(w, cx, S04.lpHood.halfZ + 0.35, 0);
    rail(S04.lpHood.halfZ * 2 + 0.7, lp.x0 - 0.3, 0, Math.PI / 2);
    rail(S04.lpHood.halfZ * 2 + 0.7, lp.x1 + 0.3, 0, Math.PI / 2);
  }
  // handrail along the bus-duct slot
  rail(6, 19.5, -3.55, 0);
  rail(6, 19.5, -2.05, 0);

  return g;
}
