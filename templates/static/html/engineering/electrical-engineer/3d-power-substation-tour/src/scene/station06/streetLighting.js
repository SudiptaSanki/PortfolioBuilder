// streetLighting.js — the night scene's key light (inventory §4.6):
// IS 1944 discipline — 9 m tapered octagonal poles at 30 m staggered
// spacing, 100–120 W LED fittings at 4000 K, pools that just touch at
// mid-span. One pole is the legacy sodium fitting the LED retrofit
// missed; its deep amber pool is the retrofit story told without a
// word. Fourteen fittings burn on this block tonight (7 detailed +
// 7 plain in the receding streets) — 14 × 120 W ≈ the 1.7 kW on the
// load table. Every light has a fixture: emissive head, glow, pool
// decal, and real luminaires where the story needs them (the hero
// transformer's raking spot, the sodium point).

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';
import { box, cyl, mat, textPlate, lightPool, lampGlow } from './helpers.js';

const S06 = STATION06;
const SL = S06.streetlights;
const P06 = S06.palette;

// one detailed streetlight. side: +1 = north footpath (arm reaches
// south over the road), −1 = south footpath (arm reaches north).
function streetlightPole(x, side, sodium, num) {
  const g = new THREE.Group();
  const z = side * SL.poleZ;
  const poleMat = mat.galv();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.11, SL.height, 8), poleMat);
  pole.position.set(x, SL.height / 2, z);
  g.add(pole);
  g.add(box(0.34, 0.5, 0.3, poleMat, x, 0.25, z));                    // base compartment
  // bracket arm curving over the carriageway
  const headZ = z - side * SL.armReach;
  const arm = cyl(0.032, 0.032, SL.armReach + 0.3, poleMat, x, SL.height - 0.12, z - side * SL.armReach / 2, 8);
  arm.rotation.x = Math.PI / 2 - side * 0.1;
  g.add(arm);
  g.add(box(0.1, 0.5, 0.06, poleMat, x, SL.height - 0.32, z - side * 0.28));
  // the fitting: die-cast housing, flat glass, photocell nub
  const housing = box(0.62, 0.09, 0.24, mat.darkSteel(), x, SL.height - 0.02, headZ);
  housing.rotation.x = side * 0.06;
  g.add(housing);
  const glassCol = sodium ? P06.sodiumPool : P06.ledPool;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.17),
    new THREE.MeshBasicMaterial({ color: glassCol }));
  glass.rotation.x = Math.PI / 2;
  glass.position.set(x, SL.height - 0.075, headZ);
  g.add(glass);
  g.add(cyl(0.028, 0.028, 0.05, mat.darkSteel(), x, SL.height + 0.05, headZ, 8));  // photocell
  g.add(lampGlow(x, SL.height - 0.15, headZ, sodium ? 2.6 : 2.2, glassCol, sodium ? 0.95 : 0.8));
  // the pool: elongated ellipse along the road, just touching its
  // neighbours' at mid-span (uniformity ≈ 0.4, per IS 1944 practice)
  g.add(lightPool(x, headZ - side * 0.4, 8.6, 3.4, glassCol, sodium ? 0.42 : 0.34));
  if (num) {
    const plate = textPlate(0.26, 0.15, [{ text: num, size: 92, color: '#e8ecf0' }],
      { px: [384, 224], bg: '#26292d', emissive: 0.3 });
    plate.position.set(x, 2.4, z - side * 0.1);
    if (side > 0) plate.rotation.y = Math.PI;
    g.add(plate);
  }
  return { group: g, head: new THREE.Vector3(x, SL.height - 0.1, headZ), sodium };
}

export function createStreetLighting() {
  const group = new THREE.Group();
  group.name = 's06-street-lighting';
  const heads = [];

  SL.north.forEach((s, i) => {
    const r = streetlightPole(s.x, 1, !!s.sodium, `SL-${217 + i * 3}`);
    group.add(r.group); heads.push(r);
  });
  SL.south.forEach((s, i) => {
    const r = streetlightPole(s.x, -1, !!s.sodium, `SL-${218 + i * 3}`);
    group.add(r.group); heads.push(r);
  });

  // background fittings in the receding streets — plain poles, lit
  // heads, small pools; fittings 8–14 of the block's count
  const bgMat = mat.std(0x3a3f45, 'galvanised');
  const bgSpots = [
    [-74, 1], [-59, -1], [61, -1], [76, 1], [-89, -1], [91, 1], [106, -1],
  ];
  for (const [x, side] of bgSpots) {
    const z = side * SL.poleZ;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, SL.height, 6), bgMat);
    p.position.set(x, SL.height / 2, z);
    group.add(p);
    const headZ = z - side * SL.armReach;
    group.add(box(0.55, 0.08, 0.22, bgMat, x, SL.height, headZ));
    group.add(lampGlow(x, SL.height - 0.12, headZ, 1.9, P06.ledPool, 0.7));
    group.add(lightPool(x, headZ - side * 0.4, 8.2, 3.2, P06.ledPool, 0.26));
  }

  // ---- the real luminaires (physical lights, sparingly):
  // the hero transformer's raking light — its own streetlight, from
  // the side, across the radiator fins (§5 accent)
  const heroHead = heads.find((h) => Math.abs(h.head.x - (-14)) < 0.1);
  const spot = new THREE.SpotLight(0xffe9c4, 900, 55, 0.62, 0.85, 1.6);
  spot.position.copy(heroHead.head);
  spot.target.position.set(S06.hero.x, 6.1, S06.hero.z);
  group.add(spot, spot.target);
  // the sodium fitting's amber wash over the RMU corner
  const sodiumHead = heads.find((h) => h.sodium);
  const sodiumLight = new THREE.PointLight(P06.sodiumPool, 160, 34, 1.8);
  sodiumLight.position.copy(sodiumHead.head).y -= 0.3;
  group.add(sodiumLight);
  // one neutral LED wash mid-block so the carriageway's middle never
  // falls to black between pools (the anti-void rule, §5)
  const midHead = heads.find((h) => Math.abs(h.head.x - 1) < 0.1);
  const midLight = new THREE.PointLight(0xffe9c4, 120, 36, 1.8);
  midLight.position.copy(midHead.head).y -= 0.3;
  group.add(midLight);

  return group;
}
