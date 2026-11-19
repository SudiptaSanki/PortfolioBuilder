// substation.js — the pooling substation (inventory §4.7): the
// plant's grid tie and a smaller cousin of Station 02's hero yard.
// Two 40 MVA 33/132 kV step-up transformers in bunded pits with a
// fire wall between them, a 132 kV gantry with strain strings and
// surge arresters, a 33 kV breaker row, and the control building
// whose lit window is the PPC desk — the operator's only visible
// presence at 18:30. Gravel everywhere: the substation signature.

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';
import { MAT, box, cyl, bushing } from './kit.js';
import { fenceRun } from './bess.js';

const S05 = STATION05;
const SS = S05.substation;

function buildTransformer() {
  const g = new THREE.Group();
  // bunded pit: kerb + gravel fill
  g.add(box(8.6, 0.3, 5.6, MAT.concrete, 0, 0.15, 0));
  const fill = box(8.0, 0.34, 5.0, MAT.gravel, 0, 0.17, 0);
  fill.receiveShadow = true;
  g.add(fill);
  // tank 6.5 × 3 × 4.5 class
  const tank = box(6.5, 3.6, 3.0, MAT.tankGreen, 0, 2.2, 0);
  tank.castShadow = true;
  g.add(tank);
  g.add(box(6.7, 0.25, 3.2, MAT.tankGreen, 0, 4.1, 0)); // lid
  // radiator banks on both long faces
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const fin = box(0.09, 2.9, 0.55, MAT.tankGreen, -2.8 + i * 0.7, 2.1, side * 1.78);
      fin.castShadow = true;
      g.add(fin);
    }
    g.add(box(6.0, 0.14, 0.14, MAT.tankGreen, 0, 3.4, side * 1.78));
    g.add(box(6.0, 0.14, 0.14, MAT.tankGreen, 0, 0.85, side * 1.78));
  }
  // conservator + pipe
  const cons = cyl(0.55, 0.55, 3.4, MAT.tankGreen, 0.8, 5.15, -0.9, 14);
  cons.rotation.z = Math.PI / 2;
  g.add(cons);
  g.add(box(0.14, 1.0, 0.14, MAT.tankGreen, 0.8, 4.6, -0.9));
  g.add(box(0.5, 0.7, 0.4, MAT.tankGreen, -2.2, 4.55, 0.8)); // Buchholz relay block
  // three tall 132 kV bushings + three shorter 33 kV bushings
  for (let i = 0; i < 3; i++) {
    const b = bushing(3.1, 0.14, 11);
    b.position.set(-1.8 + i * 1.8, 4.2, -0.75);
    g.add(b);
    const b2 = bushing(1.15, 0.09, 6);
    b2.position.set(-1.2 + i * 1.2, 4.2, 0.85);
    g.add(b2);
  }
  // marshalling kiosk + earth strap
  g.add(box(1.1, 1.5, 0.5, MAT.galvanised, 3.6, 1.1, 0.8));
  g.add(box(0.16, 0.7, 0.03, MAT.copper, 3.28, 0.5, -1.2));
  return g;
}

function buildGantry() {
  const g = new THREE.Group();
  const colMat = MAT.structure;
  for (const dx of [-6, 6]) {
    // lattice column suggested by four legs + cross braces
    for (const [lx, lz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) {
      g.add(box(0.14, 11, 0.14, colMat, dx + lx, 5.5, lz));
    }
    for (let i = 0; i < 4; i++) {
      g.add(box(1.0, 0.1, 0.1, colMat, dx, 1.6 + i * 2.6, 0.47));
      g.add(box(1.0, 0.1, 0.1, colMat, dx, 1.6 + i * 2.6, -0.47));
    }
  }
  const beam = box(13.4, 0.5, 0.5, colMat, 0, 11.2, 0);
  beam.castShadow = true;
  g.add(beam);
  g.add(box(13.4, 0.3, 0.3, colMat, 0, 10.7, 0.55));
  // three strain insulator strings hanging from the beam
  for (const dx of [-4, 0, 4]) {
    const s = bushing(1.5, 0.07, 7);
    s.position.set(dx, 9.35, 0);
    g.add(s);
  }
  // two surge arresters on stands beside the bay
  for (const dx of [-7.6, 7.6]) {
    g.add(box(0.5, 1.0, 0.5, MAT.concrete, dx, 0.5, 1.6));
    const a = bushing(3.4, 0.11, 12);
    a.position.set(dx, 1.0, 1.6);
    g.add(a);
  }
  return g;
}

function buildBreakerRow() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const x = i * 4;
    // steel stool + vacuum breaker tank ~1.2 m + operating cabinet
    g.add(box(1.1, 0.55, 0.9, MAT.structure, x, 0.28, 0));
    const tank = cyl(0.42, 0.42, 1.2, MAT.galvanised, x, 1.15, 0, 14);
    tank.castShadow = true;
    g.add(tank);
    const ct = bushing(1.5, 0.08, 7);
    ct.position.set(x, 1.75, 0);
    g.add(ct);
    g.add(box(0.7, 1.05, 0.4, MAT.galvanised, x + 0.95, 0.53, 0.25));
    g.add(box(0.16, 0.7, 0.03, MAT.copper, x - 0.5, 0.35, 0.3)); // earth strap
  }
  return g;
}

function buildControlBuilding() {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xdcd4c2, roughness: 0.85 });
  const body = box(10, 3.2, 4, wallMat, 0, 1.6, 0);
  body.castShadow = true;
  g.add(body);
  g.add(box(10.4, 0.18, 4.4, MAT.concreteDark, 0, 3.3, 0));
  g.add(box(0.95, 2.1, 0.05, MAT.darkSteel, -3.4, 1.05, 2.01));
  // two windows; the east one lit — the PPC desk, the operator present
  g.add(box(1.4, 1.0, 0.05, new THREE.MeshStandardMaterial({ color: 0x232a30, roughness: 0.2 }), 0.4, 1.9, 2.01));
  g.add(box(1.4, 1.0, 0.05, new THREE.MeshStandardMaterial({ color: 0x2c2c26, emissive: 0xffb765, emissiveIntensity: 1.5 }), 3.2, 1.9, 2.01));
  // wall AC + roof SCADA antenna (small yagi on a mast)
  g.add(box(0.85, 0.65, 0.4, MAT.galvanised, 4.2, 1.8, 2.2));
  g.add(cyl(0.03, 0.03, 2.6, MAT.structure, -3.8, 4.6, 0, 6));
  g.add(box(1.3, 0.05, 0.05, MAT.structure, -3.8, 5.6, 0));
  g.add(box(0.05, 0.05, 0.9, MAT.structure, -3.8, 5.85, 0));
  // cable trench with concrete covers running to the yard
  for (let i = 0; i < 5; i++) g.add(box(0.9, 0.09, 1.1, MAT.concrete, -1 + i * 0.02, 0.05, 3.4 + i * 1.05));
  return g;
}

export function createSubstation() {
  const group = new THREE.Group();
  group.name = 's05-substation';
  const [x0, z0, x1, z1] = SS.yard;

  // gravel yard on a raised stone bed
  const bed = box(x1 - x0 + 3, 0.14, z1 - z0 + 3, MAT.gravel, (x0 + x1) / 2, 0.07, (z0 + z1) / 2);
  bed.receiveShadow = true;
  group.add(bed);
  // concrete walkway spine
  const walk = box(3, 0.17, z1 - z0 - 2, MAT.concrete, 140, 0.09, (z0 + z1) / 2);
  walk.receiveShadow = true;
  group.add(walk);

  SS.transformers.forEach(([tx, tz], i) => {
    const t = buildTransformer();
    t.position.set(tx, 0.14, tz);
    if (i === 1) t.rotation.y = Math.PI; // mirror the pair
    group.add(t);
  });
  // fire wall between the two units
  const fw = box(0.35, 5.2, 6.4, MAT.concrete, 140, 2.6, -44);
  fw.castShadow = true;
  group.add(fw);

  const gantry = buildGantry();
  gantry.position.set(SS.gantry[0], 0.14, SS.gantry[1]);
  gantry.rotation.y = Math.PI / 4; // line bay angled toward the NE exit
  group.add(gantry);

  const breakers = buildBreakerRow();
  breakers.position.set(120, 0.14, SS.breakersZ);
  group.add(breakers);

  const control = buildControlBuilding();
  control.position.set(SS.control[0], 0.14, SS.control[1]);
  group.add(control);

  // yard light pole (its point light lives in lighting.js)
  const [lx, lz] = SS.yardLight;
  group.add(cyl(0.06, 0.09, 6.2, MAT.structure, lx, 3.1, lz, 8));
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x443a26, emissive: 0xffc37a, emissiveIntensity: 2.6 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), lampMat);
  lamp.position.set(lx, 6.25, lz);
  group.add(lamp);
  group.add(box(0.9, 0.08, 0.08, MAT.structure, lx - 0.4, 6.15, lz));

  // perimeter fence + south double gate (gap left in the south run)
  fenceRun(group, x0, z0, x1, z0);
  fenceRun(group, x0, z0, x0, z1);
  fenceRun(group, x1, z0, x1, z1);
  fenceRun(group, x0, z1, x1, z1, [0.44, 0.56]);

  return group;
}
