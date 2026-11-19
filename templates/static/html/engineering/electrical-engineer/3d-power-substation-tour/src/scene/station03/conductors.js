// conductors.js — quad ACSR Moose in true catenaries, the earth
// wire above them, jumper loops at the tension tower, spacer dampers
// on the ≤70 m sub-span rule and Stockbridge dampers at the span
// ends. Every curve is sampled from the catenary of the inventory's
// worked example (hot condition: sag 14.3 m on 400 m; earth wire
// shallower at 12 m so the ≥9 m mid-span separation holds).

import * as THREE from 'three';
import { PALETTE, STATION03 } from '../../config/world.js';
import { TOWERS, spanDir, clampWorld, tensionDeadEndWorld } from './towers.js';
import { earthAttachWorld, jumperPoints } from './strings.js';
import { catenaryTube, catenaryPoint, solveC, bundleFrame, bundleOffsets } from './catenary.js';
import { mergeGeoms, basisMatrix } from './geom.js';

const S03 = STATION03;
const R_SUB = S03.conductor.renderDiaMm / 2000;       // Ø100 mm visual → r 0.05
const R_EARTH = S03.conductor.earthRenderDiaMm / 2000;

function bundleCentre(t, side, lvl, spanIdx) {
  if (t.type === 'tension') return tensionDeadEndWorld(t, side, lvl, spanIdx);
  return clampWorld(t, side, lvl);
}

export function buildConductors() {
  const group = new THREE.Group();
  group.name = 's03-conductors';
  const condMat = new THREE.MeshStandardMaterial({
    color: 0xb4b7ba, roughness: 0.42, metalness: 0.85, // weathered aluminium
  });
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0x83888d, roughness: 0.55, metalness: 0.7,  // galvanised steel wire
  });

  const spacerMats = [];
  const stockMats = [];

  for (let i = 0; i < 4; i++) {
    const A = TOWERS[i], B = TOWERS[i + 1];
    const dir = spanDir(i);
    const frame = bundleFrame(dir);
    const offsets = bundleOffsets(frame);
    // earth wire, peak to peak, shallower catenary
    const eA = earthAttachWorld(A, i), eB = earthAttachWorld(B, i);
    const ew = catenaryTube(eA, eB, S03.sag.earthWireM, R_EARTH, earthMat, 64);
    group.add(ew);

    // Aviation marker balls belong ON the wire, over a crossing —
    // here the dirt road (z = 600) under span 2 (T-215 → T-216).
    // Three balls centred on mid-span, each seated exactly on the
    // earth wire's own catenary (solved with its 12 m sag), so the
    // wire runs through every ball's centre.
    if (i === 1) {
      const LhE = Math.hypot(eB.x - eA.x, eB.z - eA.z);
      const cE = solveC(LhE, S03.sag.earthWireM);
      const ballMat = new THREE.MeshStandardMaterial({
        color: 0xc8501e, roughness: 0.5, metalness: 0.05,   // aviation orange
      });
      const ballGeom = new THREE.SphereGeometry(0.45, 18, 12);
      const bp = new THREE.Vector3();
      for (const dt of [-0.045, 0, 0.045]) {
        catenaryPoint(eA, eB, cE, 0.5 + dt, bp);
        const ball = new THREE.Mesh(ballGeom, ballMat);
        ball.position.copy(bp);
        group.add(ball);
      }
    }

    for (const side of [-1, 1]) for (let lvl = 0; lvl < 3; lvl++) {
      const cA = bundleCentre(A, side, lvl, i);
      const cB = bundleCentre(B, side, lvl, i);
      for (const o of offsets) {
        const tube = catenaryTube(
          cA.clone().add(o), cB.clone().add(o), S03.sag.hotM, R_SUB, condMat, 72);
        if (i === 0) tube.castShadow = true;
        group.add(tube);
      }
      // spacer dampers: ≤70 m sub-spans, ≤40 m end sub-spans,
      // staggered ±5 m phase to phase so they never form a rank
      const Lh = Math.hypot(cB.x - cA.x, cB.z - cA.z);
      const cCat = solveC(Lh, S03.sag.hotM);
      const phaseIdx = (side + 1) / 2 * 3 + lvl;
      const stagger = ((phaseIdx * 37) % 11) - 5;
      const p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
      for (const d of S03.spacers.atM) {
        const t = THREE.MathUtils.clamp((d + stagger) / Lh, 0.02, 0.98);
        catenaryPoint(cA, cB, cCat, t, p0);
        catenaryPoint(cA, cB, cCat, Math.min(t + 0.01, 1), p1);
        const tangent = p1.sub(p0).normalize();
        const up2 = new THREE.Vector3(0, 1, 0).addScaledVector(tangent, -tangent.y).normalize();
        const side2 = new THREE.Vector3().crossVectors(up2, tangent).normalize();
        spacerMats.push(basisMatrix(p0.clone(), side2, up2, tangent));
      }
      // Stockbridge dampers near both ends, near spans only
      if (i <= 1) {
        for (const o of offsets) {
          const a = cA.clone().add(o), b = cB.clone().add(o);
          const cC = solveC(Math.hypot(b.x - a.x, b.z - a.z), S03.sag.hotM);
          for (const tEnd of [1.5 / 400, 1 - 1.5 / 400]) {
            catenaryPoint(a, b, cC, tEnd, p0);
            catenaryPoint(a, b, cC, Math.min(tEnd + 0.01, 1), p1);
            const tangent = p1.sub(p0).normalize();
            const up2 = new THREE.Vector3(0, 1, 0).addScaledVector(tangent, -tangent.y).normalize();
            const side2 = new THREE.Vector3().crossVectors(up2, tangent).normalize();
            // damper geometry: bar along local X → align X to tangent
            stockMats.push(basisMatrix(p0.clone(), tangent, up2, side2));
          }
        }
      }
    }
  }

  // jumper loops at T-215: slack quad bundles under the arms,
  // dipping ~3.2 m below their chord — the tension tower's signature
  {
    const t = TOWERS[1];
    for (const side of [-1, 1]) for (let lvl = 0; lvl < 3; lvl++) {
      const { A, B } = jumperPoints(t, side, lvl);
      const dir = B.clone().sub(A).setY(0).normalize();
      const frame = bundleFrame(dir);
      for (const o of bundleOffsets(frame)) {
        group.add(catenaryTube(
          A.clone().add(o), B.clone().add(o), S03.sag.jumperM, R_SUB, condMat, 32));
      }
    }
  }

  // spacer-damper frame: cross bars + four clamp jaws + hub, instanced
  const spacerGeom = mergeGeoms([
    { geom: new THREE.BoxGeometry(0.52, 0.045, 0.045), matrix: new THREE.Matrix4() },
    { geom: new THREE.BoxGeometry(0.045, 0.52, 0.045), matrix: new THREE.Matrix4() },
    { geom: new THREE.BoxGeometry(0.1, 0.1, 0.09), matrix: new THREE.Matrix4() },
    ...[-0.2285, 0.2285].flatMap((sx) => [-0.2285, 0.2285].map((sy) => ({
      geom: new THREE.BoxGeometry(0.09, 0.09, 0.15),
      matrix: new THREE.Matrix4().makeTranslation(sx, sy, 0),
    }))),
  ]);
  const spacerMesh = new THREE.InstancedMesh(spacerGeom,
    new THREE.MeshStandardMaterial({ color: PALETTE.aluminium, roughness: 0.5, metalness: 0.6 }),
    spacerMats.length);
  spacerMats.forEach((m, i) => spacerMesh.setMatrixAt(i, m));
  spacerMesh.instanceMatrix.needsUpdate = true;
  group.add(spacerMesh);

  // Stockbridge damper: clamp saddle + messenger bar + two bell
  // weights, instanced. The saddle straddles the conductor — it is
  // what makes the damper read ATTACHED at render distance (the
  // Ø100 mm wire and hair-thin stems alone simply vanish, leaving
  // the bells looking like floating eggs).
  const stockGeom = mergeGeoms([
    { geom: new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6),
      matrix: new THREE.Matrix4().makeRotationZ(Math.PI / 2) },
    { geom: new THREE.BoxGeometry(0.17, 0.11, 0.11), matrix: new THREE.Matrix4() },
    ...[-0.19, 0.19].flatMap((sx) => [
      { geom: new THREE.CylinderGeometry(0.015, 0.015, 0.1, 5),
        matrix: new THREE.Matrix4().makeTranslation(sx, -0.05, 0) },
      { geom: new THREE.SphereGeometry(0.075, 8, 6),
        matrix: new THREE.Matrix4().makeScale(1, 1.35, 1).setPosition(sx, -0.16, 0) },
    ]),
  ]);
  const stockMesh = new THREE.InstancedMesh(stockGeom,
    new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, roughness: 0.6, metalness: 0.5 }),
    stockMats.length);
  stockMats.forEach((m, i) => stockMesh.setMatrixAt(i, m));
  stockMesh.instanceMatrix.needsUpdate = true;
  group.add(stockMesh);

  return group;
}
