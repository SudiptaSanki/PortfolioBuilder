// pvField.js — the solar field (inventory §4.2, §4.3). 40,032
// modules in the plant's story; the field models 24 tables × 56 =
// 1,344 of them as ONE InstancedMesh — every module a 2384 × 1303 mm
// dual-glass unit on a 2P fixed-tilt table at 25°, rows at 7.0 m
// pitch so each row's evening shadow just touches the next row's
// feet. Per-module ±0.3° plane jitter: real tables are never flat,
// and the uneven glint is what makes the field read as glass.

import * as THREE from 'three';
import { STATION05 } from '../../config/world.js';
import { MAT, canvasTexture, rng } from './kit.js';

const S05 = STATION05;
const PV = S05.pv;

// A small procedural equirect of the dusk sky, used ONLY as the
// modules' env map: glass needs something to reflect, and with no
// scene env map a metalness-bearing standard material goes black.
function skyEnvMap() {
  const tex = canvasTexture(512, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#7d9bbd');    // dusty blue zenith
    grad.addColorStop(0.42, '#c8b490');   // pale band
    grad.addColorStop(0.52, '#f0b878');   // warm sunset horizon
    grad.addColorStop(0.58, '#8a6f4d');   // ground bounce
    grad.addColorStop(1.0, '#5d4c36');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    // warm glow around the sun's azimuth (WNW)
    const rg = g.createRadialGradient(w * 0.72, h * 0.52, 8, w * 0.72, h * 0.52, 150);
    rg.addColorStop(0, 'rgba(255,190,110,0.85)');
    rg.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

function moduleTexture() {
  return canvasTexture(280, 512, (g, w, h) => {
    // anodised aluminium frame
    g.fillStyle = '#b9bcbe'; g.fillRect(0, 0, w, h);
    // deep blue cell field — dark glass, not a matte void
    g.fillStyle = '#1b2a44'; g.fillRect(9, 9, w - 18, h - 18);
    // sky-sheen gradient baked into the glass: brighter toward the
    // top edge, the way a tilted module mirrors the bright horizon
    const sheen = g.createLinearGradient(0, 9, 0, h - 9);
    sheen.addColorStop(0, 'rgba(130,160,205,0.28)');
    sheen.addColorStop(0.45, 'rgba(90,115,160,0.10)');
    sheen.addColorStop(1, 'rgba(40,55,85,0.0)');
    g.fillStyle = sheen; g.fillRect(9, 9, w - 18, h - 18);
    // cell grid: 132 half-cut cells suggested — vertical busbar lines
    g.strokeStyle = 'rgba(195,208,225,0.6)'; g.lineWidth = 1;
    for (let i = 1; i < 22; i++) {
      g.beginPath(); g.moveTo(9 + (i * (w - 18)) / 22, 9); g.lineTo(9 + (i * (w - 18)) / 22, h - 9); g.stroke();
    }
    for (let i = 1; i < 6; i++) {
      g.beginPath(); g.moveTo(9, 9 + (i * (h - 18)) / 6); g.lineTo(w - 9, 9 + (i * (h - 18)) / 6); g.stroke();
    }
    // slightly lighter cross gaps every ~200 mm
    g.strokeStyle = 'rgba(160,175,195,0.65)'; g.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      g.beginPath(); g.moveTo(9 + (i * (w - 18)) / 6, 9); g.lineTo(9 + (i * (w - 18)) / 6, h - 9); g.stroke();
    }
    // cell sheen variation
    const rand = rng(31);
    for (let i = 0; i < 130; i++) {
      g.fillStyle = `rgba(85,115,165,${0.08 + rand() * 0.13})`;
      g.fillRect(9 + rand() * (w - 30), 9 + rand() * (h - 30), 16, 10);
    }
  });
}

export function createPvField() {
  const group = new THREE.Group();
  group.name = 's05-pv-field';
  const tilt = THREE.MathUtils.degToRad(PV.tiltDeg);
  const sinT = Math.sin(tilt), cosT = Math.cos(tilt);
  const rand = rng(555);

  const tables = [];
  for (const bx of PV.blocks) for (const fz of PV.rowsZ) tables.push([bx, fz]);

  // ---- modules: one InstancedMesh for the whole field ----
  const modGeo = new THREE.BoxGeometry(PV.moduleW, 0.033, PV.moduleL);
  // Dark glass: low metalness (dielectric — metalness without an
  // env map renders black), a dusk-sky env map to reflect, and
  // low-enough roughness for the 7° sun to streak along the rows.
  const modMat = new THREE.MeshStandardMaterial({
    map: moduleTexture(), roughness: 0.27, metalness: 0.15,
    envMap: skyEnvMap(), envMapIntensity: 0.9,
  });
  const perTable = PV.perRow * 2;
  const inst = new THREE.InstancedMesh(modGeo, modMat, tables.length * perTable);
  inst.castShadow = true;
  inst.receiveShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  let idx = 0;
  const sCentres = [PV.moduleL / 2 + 0.02, PV.moduleL * 1.5 + 0.06];
  for (const [bx, fz] of tables) {
    for (const s of sCentres) {
      for (let i = 0; i < PV.perRow; i++) {
        const lx = -PV.tableLen / 2 + PV.moduleW / 2 + i * (PV.moduleW + 0.02);
        const j1 = (rand() - 0.5) * THREE.MathUtils.degToRad(0.6);
        const j2 = (rand() - 0.5) * THREE.MathUtils.degToRad(0.6);
        e.set(tilt + j1, 0, j2); q.setFromEuler(e);
        v.set(bx + lx, PV.frontClearance + s * sinT + 0.1, fz - s * cosT);
        m.compose(v, q, one);
        inst.setMatrixAt(idx++, m);
      }
    }
  }
  group.add(inst);

  // ---- structure: piles (instanced), torque beam + purlins + tray ----
  const pileGeoF = new THREE.BoxGeometry(0.14, 0.75, 0.14);
  const pileGeoR = new THREE.BoxGeometry(0.14, 2.6, 0.14);
  const pilesF = new THREE.InstancedMesh(pileGeoF, MAT.galvanised, tables.length * 6);
  const pilesR = new THREE.InstancedMesh(pileGeoR, MAT.galvanised, tables.length * 6);
  let pf = 0, pr = 0;
  const ident = new THREE.Quaternion();
  for (const [bx, fz] of tables) {
    for (let i = 0; i < 6; i++) {
      const lx = -PV.tableLen / 2 + 3 + i * ((PV.tableLen - 6) / 5);
      v.set(bx + lx, 0.36, fz - 0.35); m.compose(v, ident, one); pilesF.setMatrixAt(pf++, m);
      v.set(bx + lx, 1.28, fz - 4.35); m.compose(v, ident, one); pilesR.setMatrixAt(pr++, m);
    }
    // torque beam under the module plane mid-slope
    const sMid = 2.42;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(PV.tableLen, 0.18, 0.18), MAT.galvanised);
    beam.position.set(bx, PV.frontClearance + sMid * sinT - 0.05, fz - sMid * cosT);
    beam.castShadow = true;
    group.add(beam);
    // cable tray under the rear edge
    const tray = new THREE.Mesh(new THREE.BoxGeometry(PV.tableLen, 0.07, 0.24), MAT.darkSteel);
    tray.position.set(bx, PV.frontClearance + 4.7 * sinT - 0.12, fz - 4.7 * cosT);
    group.add(tray);
    // string-cable trench strip at the table's east end
    const trench = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x8a7558, roughness: 1 }));
    trench.rotation.x = -Math.PI / 2;
    trench.position.set(bx + PV.tableLen / 2 + 0.7, 0.04, fz - 2.2);
    trench.receiveShadow = true;
    group.add(trench);
  }
  pilesF.castShadow = pilesR.castShadow = true;
  group.add(pilesF, pilesR);

  return group;
}
