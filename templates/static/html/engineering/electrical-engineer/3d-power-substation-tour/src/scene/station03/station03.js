// station03.js — assembly: the Riverbend–Kestrel corridor.
// Five towers, four true-catenary spans, the ground they cross and
// the late-afternoon light they stand in. The only motion in the
// scene is a couple of distant birds — still air, plumb strings,
// maximum sag: the calm is the engineering.

import * as THREE from 'three';
import { STATION03 } from '../../config/world.js';
import { TOWERS, buildTower, clampWorld, peakWorld } from './towers.js';
import { buildStrings, jumperPoints } from './strings.js';
import { buildConductors } from './conductors.js';
import { buildTerrain, buildSky } from './terrain.js';
import { catenaryPoint, solveC } from './catenary.js';

const S03 = STATION03;

export function createStation03() {
  const group = new THREE.Group();
  group.name = 'station03-transmission-corridor';

  group.add(buildSky());
  group.add(buildTerrain());
  for (const t of TOWERS) group.add(buildTower(t));
  group.add(buildStrings());
  group.add(buildConductors());

  // light: one warm low sun from the west, soft fill from the sky.
  // Shadows are framed on the hero tower's neighbourhood only —
  // a 1.6 km shadow map would dissolve into noise.
  const hemi = new THREE.HemisphereLight(0xbfd4ea, 0x9a8a64, 0.95);
  group.add(hemi);
  const sun = new THREE.DirectionalLight(0xffdfae, 2.6);
  sun.position.set(-260, 150, -90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -115; sun.shadow.camera.right = 115;
  sun.shadow.camera.top = 115; sun.shadow.camera.bottom = -115;
  sun.shadow.camera.near = 50; sun.shadow.camera.far = 750;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.target.position.set(0, 0, 60);
  group.add(sun, sun.target);

  // distant birds — points only, a slow drift far west of the line
  const N = 30;
  const bPos = new Float32Array(N * 3);
  const bOff = [];
  let seed = 13;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < N; i++) {
    bOff.push([(rnd() - 0.5) * 26, (rnd() - 0.5) * 3, (rnd() - 0.5) * 12, i < N / 2 ? 0 : 1]);
  }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  const birds = new THREE.Points(bGeo, new THREE.PointsMaterial({
    color: 0x2e2a24, size: 1.7, sizeAttenuation: true, transparent: true, opacity: 0.75, fog: false,
  }));
  birds.frustumCulled = false;
  group.add(birds);

  group.userData.update = (t) => {
    for (let i = 0; i < N; i++) {
      const [ox, oy, oz, flock] = bOff[i];
      const cx = -190 + 60 * Math.sin(t * 0.011 + flock * 2.4);
      const cz = (flock ? 620 : 260) + 190 * Math.sin(t * 0.007 + flock * 1.9);
      bPos[i * 3] = cx + ox + 16 * Math.sin(t * 0.05 + i * 0.3);
      bPos[i * 3 + 1] = 66 + flock * 9 + oy + Math.sin(t * 0.9 + i) * 0.5;
      bPos[i * 3 + 2] = cz + oz;
    }
    bGeo.attributes.position.needsUpdate = true;
  };
  return group;
}

// Anchor points for the later portfolio journey: the hero tower, a
// countable suspension string, the mid-span sag point, the tension
// tower and its jumper loop, the earth-wire peak, a spacer damper.
export function station03Anchors() {
  const t0 = TOWERS[0], t1 = TOWERS[1];
  const cA = clampWorld(t0, 1, 0);
  // span-0 bottom east bundle's far end is T-215's dead-end
  const deB = jumperPoints(t1, 1, 0).A.clone();
  const Lh = Math.hypot(deB.x - cA.x, deB.z - cA.z);
  const mid = catenaryPoint(cA, deB, solveC(Lh, S03.sag.hotM), 0.5, new THREE.Vector3());
  const spacerPt = catenaryPoint(cA, deB, solveC(Lh, S03.sag.hotM), 40 / Lh, new THREE.Vector3());
  const { M } = jumperPoints(t1, 1, 1);
  return [
    { id: 'hero-tower', label: 'T-214 · suspension tower, 49 m', position: new THREE.Vector3(0, 26, 0) },
    { id: 'suspension-string', label: 'Suspension set · 23 discs · grading ring', position: clampWorld(t0, 1, 0) },
    { id: 'midspan-sag', label: 'Mid-span · sag 14.3 m at 75 °C · clearance 11.6 m', position: mid },
    { id: 'spacer-damper', label: 'Spacer damper · sub-span ≤ 70 m', position: spacerPt },
    { id: 'tension-tower', label: 'T-215 · tension tower · line turns 25°', position: new THREE.Vector3(0, 26, 400) },
    { id: 'jumper-loop', label: 'Jumper loop · strain strings horizontal', position: M.clone().add(new THREE.Vector3(0, -3.4, 0)) },
    { id: 'earth-peak', label: 'Earth wire peak · shielding angle ≈ 25–30°', position: peakWorld(t0) },
  ];
}
