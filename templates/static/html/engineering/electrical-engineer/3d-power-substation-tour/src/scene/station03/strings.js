// strings.js — insulator strings: the countable hardware.
// Suspension sets (48 corridor-wide): shackle → arcing horn → 23
// porcelain discs (255 × 146 mm, instanced from one lathe bell) →
// grading ring → yoke plate → clamp. Strain sets at T-215: double
// horizontal strings of 23 larger discs (280 × 170 mm) per phase per
// side, yoke plates, dead-end clamps, pilot strings holding the
// jumper loops, and the earth wire's own small strain sets.

import * as THREE from 'three';
import { PALETTE, SURFACE, STATION03 } from '../../config/world.js';
import { TOWERS, spanDir, stringTopWorld, tensionTipWorld, tensionDeadEndWorld, peakWorld, midOffset } from './towers.js';
import { axisMatrix } from './geom.js';

const S03 = STATION03;
const LEVELS = S03.towers.armLevelsM;

// Bell profile of a cap-and-pin disc (radius, height), one pitch tall.
function discGeometry() {
  const pts = [
    [0.001, 0.0], [0.07, 0.002], [0.115, 0.012], [0.1275, 0.03],
    [0.124, 0.05], [0.095, 0.07], [0.06, 0.088], [0.048, 0.105],
    [0.052, 0.125], [0.04, 0.146],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 12);
}

const discMats = [];   // every disc instance corridor-wide, one mesh
const _p = new THREE.Vector3();
function disc(pos, quat, sx, sy) {
  const m = new THREE.Matrix4().compose(pos, quat || new THREE.Quaternion(),
    new THREE.Vector3(sx || 1, sy || 1, sx || 1));
  discMats.push(m);
}
const IDENTITY_Q = new THREE.Quaternion();
const TENSION_SCALE = [S03.string.tensionDiscDiaMm / S03.string.discDiaMm,
  S03.string.tensionDiscPitchMm / S03.string.discPitchMm];

function flushDiscs() {
  const mat = new THREE.MeshStandardMaterial({ color: PALETTE.porcelainBrown, ...SURFACE.porcelain });
  const mesh = new THREE.InstancedMesh(discGeometry(), mat, discMats.length);
  discMats.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  return mesh;
}

// Jumper geometry at the tension tower: the two dead-ends of a phase
// and the loop's midpoint (used by conductors.js for the loop itself).
export function jumperPoints(t, side, lvl) {
  const ti = TOWERS.indexOf(t);
  const A = tensionDeadEndWorld(t, side, lvl, ti - 1);
  const B = tensionDeadEndWorld(t, side, lvl, ti);
  const M = A.clone().add(B).multiplyScalar(0.5);
  return { A, B, M };
}

// Where a span's earth wire terminates at tower t for span spanIdx.
export function earthAttachWorld(t, spanIdx) {
  const peak = peakWorld(t);
  if (t.type !== 'tension') return peak;
  const ti = TOWERS.indexOf(t);
  const away = spanIdx >= ti ? spanDir(spanIdx) : spanDir(spanIdx).negate();
  return peak.clone().addScaledVector(away, 2.3).add(new THREE.Vector3(0, -0.15, 0));
}

export function buildStrings() {
  const group = new THREE.Group();
  group.name = 's03-strings';
  const steelDark = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, roughness: 0.55, metalness: 0.6 });
  const steelLight = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, roughness: 0.6, metalness: 0.15 });

  const horns = [], rings = [], yokes = [], clamps = [], links = [];
  const hornGeom = new THREE.TorusGeometry(0.3, 0.018, 6, 14, Math.PI);
  const ringGeom = new THREE.TorusGeometry(S03.string.gradingRingDiaM / 2, 0.035, 8, 24);
  const yokeGeom = new THREE.BoxGeometry(0.52, 0.05, 0.3);
  const clampGeom = new THREE.BoxGeometry(0.34, 0.24, 0.52);
  const linkGeom = new THREE.BoxGeometry(0.08, 0.52, 0.08);
  const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));

  // ---- suspension sets on the four suspension towers
  for (const t of TOWERS) {
    if (t.type !== 'suspension') continue;
    for (const side of [-1, 1]) for (let lvl = 0; lvl < 3; lvl++) {
      const top = stringTopWorld(t, side, lvl);
      // 23 discs, fittings occupying the top 0.55 m of the 4.6 m set
      for (let i = 0; i < S03.string.discs; i++) {
        _p.set(top.x, top.y - 0.55 - (i + 1) * 0.146, top.z);
        disc(_p.clone(), IDENTITY_Q, 1, 1);
      }
      const yawQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, t.yaw, 0));
      horns.push(new THREE.Matrix4().compose(
        new THREE.Vector3(top.x, top.y - 0.3, top.z), yawQ, new THREE.Vector3(1, 1, 1)));
      links.push(new THREE.Matrix4().makeTranslation(top.x, top.y - 0.26, top.z));
      rings.push(new THREE.Matrix4().compose(
        new THREE.Vector3(top.x, top.y - 3.98, top.z), qFlat, new THREE.Vector3(1, 1, 1)));
      yokes.push(new THREE.Matrix4().makeTranslation(top.x, top.y - 4.3, top.z));
      clamps.push(new THREE.Matrix4().makeTranslation(top.x, top.y - 4.48, top.z));
    }
  }

  // ---- strain sets + pilots + earth strain at the tension tower
  const t = TOWERS[1];
  const ti = 1;
  const strainYokes = [], strainClamps = [], rods = [];
  for (const side of [-1, 1]) for (let lvl = 0; lvl < 3; lvl++) {
    for (const spanIdx of [ti - 1, ti]) {
      const away = spanIdx >= ti ? spanDir(spanIdx) : spanDir(spanIdx).negate();
      const perp = new THREE.Vector3(away.z, 0, -away.x);
      const tip = tensionTipWorld(t, side, lvl);
      // tower-side yoke plate merging the double strings
      strainYokes.push({ pos: tip.clone().addScaledVector(away, 0.35).add(new THREE.Vector3(0, -0.05, 0)), away });
      for (const off of [-0.28, 0.28]) {
        const start = tip.clone().addScaledVector(perp, off).addScaledVector(away, 0.6);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), away.clone().negate());
        for (let i = 0; i < S03.string.discs; i++) {
          const pos = start.clone().addScaledVector(away, (i + 1) * 0.17);
          disc(pos, q, TENSION_SCALE[0], TENSION_SCALE[1]);
        }
      }
      const de = tensionDeadEndWorld(t, side, lvl, spanIdx);
      strainClamps.push({ pos: de.clone().add(new THREE.Vector3(0, 0.3, 0)), away });
    }
    // pilot string: support rod from the arm tip to above the loop's
    // midpoint, a link rod, then 16 discs down to the loop
    const { M } = jumperPoints(t, side, lvl);
    const tip = tensionTipWorld(t, side, lvl);
    const S = new THREE.Vector3(M.x, LEVELS[lvl] - 0.05, M.z);
    rods.push({ a: tip.clone(), b: S.clone() });
    rods.push({ a: S.clone(), b: S.clone().add(new THREE.Vector3(0, -0.95, 0)) });
    for (let i = 0; i < 16; i++) {
      _p.set(S.x, S.y - 0.95 - (i + 1) * 0.146, S.z);
      disc(_p.clone(), IDENTITY_Q, 1, 1);
    }
    // counterweight stack on one jumper assembly (middle phase, +side)
    if (side === 1 && lvl === 1) {
      const cw = new THREE.Group();
      const rodMat = steelDark;
      for (let i = 0; i < 5; i++) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.055, 14), rodMat);
        w.position.set(M.x, M.y - 3.62 - i * 0.065, M.z);
        cw.add(w);
      }
      group.add(cw);
    }
  }
  // earth-wire strain sets at T-215 (11 discs each side)
  {
    const peak = peakWorld(t);
    for (const spanIdx of [0, 1]) {
      const away = spanIdx >= ti ? spanDir(spanIdx) : spanDir(spanIdx).negate();
      const start = peak.clone().addScaledVector(away, 0.3);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), away.clone().negate());
      for (let i = 0; i < 11; i++) {
        disc(start.clone().addScaledVector(away, (i + 1) * 0.146), q, 1, 1);
      }
    }
  }

  const addInstanced = (geom, mat, mats) => {
    const mesh = new THREE.InstancedMesh(geom, mat, mats.length);
    mats.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    return mesh;
  };
  addInstanced(hornGeom, steelDark, horns);
  addInstanced(ringGeom, steelLight, rings);
  addInstanced(yokeGeom, steelDark, yokes);
  addInstanced(clampGeom, steelDark, clamps);
  addInstanced(linkGeom, steelDark, links);
  for (const y of strainYokes) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.78), steelDark);
    m.position.copy(y.pos);
    m.lookAt(y.pos.clone().add(y.away));
    group.add(m);
  }
  for (const c of strainClamps) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.62), steelDark);
    m.position.copy(c.pos);
    m.lookAt(c.pos.clone().add(c.away));
    group.add(m);
  }
  for (const r of rods) {
    const dir = r.b.clone().sub(r.a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 6), steelDark);
    m.position.copy(r.a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    group.add(m);
  }
  group.add(flushDiscs());
  return group;
}
