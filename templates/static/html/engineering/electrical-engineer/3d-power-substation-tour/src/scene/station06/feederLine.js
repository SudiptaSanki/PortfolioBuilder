// feederLine.js — the street's spine (inventory §4.2): Feeder F-7's
// 11 kV overhead line on 9.1 m PSCC poles at true 40 m spans, V-type
// cross-arms, pin insulators, ACSR conductors with honest catenary
// sag (1.25% of span), LT underbuild (bare four-wire on one span,
// ABC bundle on the others), service drops, and the pole dressing
// that makes it Indian distribution — danger plates, pole numbers,
// anti-climbing guards, earth wires, a stayed corner pole, surge
// arresters at the line entry, and the transition pole where the
// ring dives underground to RMU-3 (§4.5).

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';
import { box, cyl, mat, textPlate, conductorTube } from './helpers.js';

const S06 = STATION06;
const F = S06.feeder;
const P06 = S06.palette;

const conductorMat = new THREE.MeshStandardMaterial({
  color: 0x2e3134, roughness: 0.45, metalness: 0.75,
});
const porcelainBrown = mat.std(PALETTE.porcelainBrown, 'porcelain');
const polymerGrey = mat.std(PALETTE.polymerShed, 'porcelain');

// one 11 kV pin insulator: pin, shed stack, cap
function pinInsulator(x, y, z, parent) {
  const g = new THREE.Group();
  g.add(cyl(0.028, 0.028, 0.09, mat.darkSteel(), 0, 0.045, 0, 8));
  g.add(cyl(0.052, 0.062, 0.05, porcelainBrown, 0, 0.11, 0, 10));
  g.add(cyl(0.078, 0.06, 0.035, porcelainBrown, 0, 0.15, 0, 10));
  g.add(cyl(0.045, 0.055, 0.05, porcelainBrown, 0, 0.19, 0, 10));
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// a hanging disc string (section/corner pole only)
function discString(x, y, z, parent) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    g.add(cyl(0.085, 0.085, 0.028, porcelainBrown, 0, -0.05 - i * 0.075, 0, 12));
    g.add(cyl(0.03, 0.03, 0.05, mat.darkSteel(), 0, -0.025 - i * 0.075, 0, 8));
  }
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// grey polymer surge arrester on a small bracket
function arrester(x, y, z, parent) {
  const g = new THREE.Group();
  g.add(box(0.3, 0.05, 0.12, mat.galv(), 0, 0, 0));
  const body = cyl(0.048, 0.048, 0.42, polymerGrey, 0, 0.26, 0, 10);
  g.add(body);
  for (let i = 0; i < 4; i++) g.add(cyl(0.075, 0.075, 0.02, polymerGrey, 0, 0.12 + i * 0.09, 0, 10));
  g.add(cyl(0.012, 0.012, 0.14, mat.std(PALETTE.copper, 'brushedSteel'), 0, 0.54, 0, 6));
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

function dangerPlate(x, z, num) {
  const g = new THREE.Group();
  const plate = textPlate(0.42, 0.3, [
    { text: '11,000 VOLTS', size: 74, color: '#ffffff' },
    { text: 'DANGER', size: 92, color: '#ffffff' },
  ], { px: [512, 384], bg: '#a02722', emissive: 0.25 });
  plate.position.set(x, 1.75, z - 0.17);
  plate.rotation.y = Math.PI;
  g.add(plate);
  const numPlate = textPlate(0.3, 0.16, [
    { text: num, size: 92, color: '#e8ecf0' },
  ], { px: [384, 192], bg: '#26292d', emissive: 0.3 });
  numPlate.position.set(x, 2.25, z - 0.165);
  numPlate.rotation.y = Math.PI;
  g.add(numPlate);
  return g;
}

// one plain line pole, dressed. opts.section: disc strings + stay
// (the corner/section pole); opts.entry: arresters (line entry).
export function createLinePole(x, num, opts = {}) {
  const g = new THREE.Group();
  const poleMat = mat.std(0x8a867e, 'concrete');
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, F.poleHeight, 4), poleMat);
  pole.rotation.y = Math.PI / 4;
  pole.position.set(x, F.poleHeight / 2 - F.buried, F.poleZ);
  g.add(pole);
  // V cross-arm: two raked bars + the horizontal tie, pins on top
  const armMat = mat.galv();
  for (const s of [-1, 1]) {
    const bar = box(0.06, 0.09, 0.95, armMat, x, F.armY - 0.06, F.poleZ + s * 0.3);
    bar.rotation.x = s * 0.22;
    g.add(bar);
  }
  g.add(box(0.06, 0.09, 1.42, armMat, x, F.armY, F.poleZ));
  if (opts.section) {
    // strings hang from a raised bracket so their clamps meet the
    // through-conductor at the same height as the pin positions
    g.add(box(0.07, 0.5, 1.42, armMat, x, F.armY + 0.22, F.poleZ));
    discString(x, F.armY + 0.44, F.phaseZ[0], g);
    discString(x, F.armY + 0.44, F.phaseZ[2], g);
    pinInsulator(x, F.armY, F.phaseZ[1], g);
  } else {
    pinInsulator(x, F.armY, F.phaseZ[0], g);
    pinInsulator(x, F.armY + 0.35, F.phaseZ[1], g);          // raised middle phase
    pinInsulator(x, F.armY, F.phaseZ[2], g);
  }
  // LT underbuild arm + four pins
  g.add(box(0.055, 0.08, 0.9, armMat, x, F.ltArmY, F.poleZ));
  for (const lz of F.ltZ) {
    g.add(cyl(0.02, 0.02, 0.07, mat.darkSteel(), x, F.ltArmY + 0.06, lz, 6));
    g.add(cyl(0.045, 0.05, 0.05, porcelainBrown, x, F.ltArmY + 0.11, lz, 8));
  }
  // anti-climbing guard: a dark spiked sleeve above reach height
  const guard = cyl(0.21, 0.21, 0.5, mat.std(0x2c2c2e, 'mattePaint'), x, 1.95, F.poleZ, 10);
  g.add(guard);
  // earth wire stapled down the street face to its pit
  g.add(box(0.025, 7.0, 0.012, mat.std(0x7d7466, 'brushedSteel'), x, 3.5, F.poleZ - 0.155));
  g.add(box(0.5, 0.07, 0.4, mat.concreteDark(), x, 0.035, F.poleZ - 0.55));  // earth pit cover
  g.add(dangerPlate(x, F.poleZ, num));
  if (opts.entry) {
    for (const pz of F.phaseZ) arrester(x + 0.28, F.armY + 0.32, pz, g);
  }
  if (opts.section) {
    // stay wire into the footpath edge, yellow guard sleeve low down
    const top = new THREE.Vector3(x, 7.1, F.poleZ);
    const anchor = new THREE.Vector3(x + 3.4, 0.1, F.poleZ - 1.7);
    const dir = new THREE.Vector3().subVectors(anchor, top);
    const len = dir.length();
    const stay = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, len, 6), mat.darkSteel());
    stay.position.copy(top).addScaledVector(dir, 0.5);
    stay.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    g.add(stay);
    const sleeveLen = 2.2;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, sleeveLen, 8),
      mat.std(PALETTE.safetyYellow, 'powderCoat'));
    sleeve.position.copy(anchor).addScaledVector(dir.clone().normalize(), -sleeveLen / 2);
    sleeve.quaternion.copy(stay.quaternion);
    g.add(sleeve);
    // stay insulator, part-way up the wire
    const ins = cyl(0.05, 0.05, 0.16, porcelainBrown, 0, 0, 0, 8);
    ins.position.copy(top).addScaledVector(dir, 0.28);
    ins.quaternion.copy(stay.quaternion);
    g.add(ins);
    g.add(box(0.3, 0.5, 0.3, mat.concrete(), anchor.x, 0.25, anchor.z));      // anchor block
  }
  return g;
}

// The transition pole's underground dive (§4.5): sealing ends on a
// bracket, down-leads cleated in a guard pipe to the trench.
export function createTransitionDressing(x) {
  const g = new THREE.Group();
  g.add(box(0.7, 0.06, 1.3, mat.galv(), x, 5.15, F.poleZ - 0.55));
  for (const pz of F.phaseZ) {
    // sealing end: a porcelain stack on the bracket, cable leaving down
    const se = new THREE.Group();
    se.add(cyl(0.055, 0.07, 0.34, porcelainBrown, 0, 0.17, 0, 10));
    se.add(cyl(0.085, 0.085, 0.03, porcelainBrown, 0, 0.1, 0, 10));
    se.add(cyl(0.085, 0.085, 0.03, porcelainBrown, 0, 0.24, 0, 10));
    se.position.set(x, 5.18, pz - 0.55);
    g.add(se);
    // jumper from the line conductor down to the sealing end
    g.add(conductorTube(
      new THREE.Vector3(x, F.armY + 0.2, pz),
      new THREE.Vector3(x, 5.55, pz - 0.55), 0.06, 0.014, conductorMat));
  }
  // the three down-lead cables, cleated together inside a guard pipe
  const pipe = cyl(0.075, 0.075, 4.9, mat.galv(), x, 2.75, F.poleZ - 0.85, 10);
  g.add(pipe);
  g.add(box(0.16, 0.3, 0.05, mat.darkSteel(), x, 4.4, F.poleZ - 0.8));
  g.add(box(0.16, 0.3, 0.05, mat.darkSteel(), x, 2.2, F.poleZ - 0.8));
  const plate = textPlate(0.62, 0.34, [
    { text: 'F-7 UNDERGROUND SECTION', size: 56, color: '#e8ecf0' },
    { text: '→ RMU-3 · 3C XLPE 185 mm²', size: 52, color: '#c8cfd6' },
  ], { px: [1024, 512], bg: '#26292d', emissive: 0.3 });
  plate.position.set(x, 3.1, F.poleZ - 0.95);
  plate.rotation.y = Math.PI;
  g.add(plate);
  return g;
}

// conductor anchor heights at a support x (matches the pole dressing)
export function phaseAnchor(x, phase) {
  const y = phase === 1 ? F.armY + 0.35 + 0.21 : F.armY + 0.21;
  return new THREE.Vector3(x, y, F.phaseZ[phase]);
}

export function createFeederLine() {
  const group = new THREE.Group();
  group.name = 's06-feeder-line';

  const supports = [-50, S06.hero.x, 30, 70];
  group.add(createLinePole(-50, 'F7/9', { entry: true }));
  group.add(createLinePole(30, 'F7/12', { section: true }));
  group.add(createLinePole(70, 'F7/13', {}));
  group.add(createTransitionDressing(30));

  // 11 kV conductors: three true 40 m spans + continuations into the
  // background canyons at both ends (sag throughout, never straight)
  const allSupports = [-92, ...supports, 112];
  for (let s = 0; s < allSupports.length - 1; s++) {
    const a = allSupports[s], b = allSupports[s + 1];
    const spanLen = b - a;
    const sag = F.sag * (spanLen / F.span);
    for (let ph = 0; ph < 3; ph++) {
      group.add(conductorTube(phaseAnchor(a, ph), phaseAnchor(b, ph), sag, 0.02, conductorMat));
    }
  }
  // LT underbuild: bare four-wire on the middle span, ABC bundle on
  // the flanking spans (both are everywhere in Indian cities, §4.2)
  const ltY = F.ltArmY + 0.15;
  for (const lz of F.ltZ) {
    group.add(conductorTube(new THREE.Vector3(-10, ltY, lz), new THREE.Vector3(30, ltY, lz), 0.35, 0.011, conductorMat));
  }
  const abcMat = mat.std(0x1c1e20, 'powderCoat');
  for (const [a, b] of [[-50, -10], [30, 70]]) {
    group.add(conductorTube(new THREE.Vector3(a, ltY, F.poleZ), new THREE.Vector3(b, ltY, F.poleZ), 0.4, 0.03, abcMat));
  }
  // service drops: line → shop row, line → corner block, and the long
  // diagonal across the carriageway to the apartment meter bank
  const drops = [
    [new THREE.Vector3(-10, ltY, F.ltZ[3]), new THREE.Vector3(-14, 2.6, 8.1), 0.5],
    [new THREE.Vector3(30, ltY, F.ltZ[3]), new THREE.Vector3(31.5, 3.0, 8.1), 0.4],
    [new THREE.Vector3(-50, ltY, F.ltZ[0]), new THREE.Vector3(-36, 2.6, 8.1), 0.6],
    [new THREE.Vector3(-10, ltY, F.ltZ[0]), new THREE.Vector3(-9.75, 2.4, -12.3), 0.9],
    [new THREE.Vector3(30, ltY, F.ltZ[0]), new THREE.Vector3(19.5, 2.3, -9.2), 0.8],
  ];
  for (const [a, b, sag] of drops) group.add(conductorTube(a, b, sag, 0.01, abcMat));

  return group;
}

// The flow system's routes (used by flow.js): the 11 kV phases of the
// three true spans, west → east, plus the transition pole's dive.
export function feederFlowPaths() {
  const paths = [];
  const supports = [-50, S06.hero.x, 30, 70];
  for (let s = 0; s < supports.length - 1; s++) {
    for (let ph = 0; ph < 3; ph++) {
      paths.push({ a: phaseAnchor(supports[s], ph), b: phaseAnchor(supports[s + 1], ph), sag: F.sag });
    }
  }
  paths.push({
    a: new THREE.Vector3(30, F.armY + 0.2, F.phaseZ[1]),
    b: new THREE.Vector3(30, 0.4, F.poleZ - 0.85), sag: 0.02,
  });
  return paths;
}
