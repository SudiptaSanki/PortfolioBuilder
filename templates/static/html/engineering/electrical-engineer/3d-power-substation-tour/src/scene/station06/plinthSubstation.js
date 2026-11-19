// plinthSubstation.js — the apartment block's supply (inventory
// §4.4): a 500 kVA, 11/0.433 kV, Dyn11 plinth transformer fed from
// RMU-3's tee-off, in its low fenced compound on a gravel bed, with
// the LV feeder pillar beside it — and the block's second feeder
// pillar mid-block on the north footpath. Same tank language as the
// hero at larger scale, plus the cable box a plinth unit carries.

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';
import { box, cyl, mat, textPlate } from './helpers.js';

const S06 = STATION06;
const PL = S06.plinth;

const tankMat = mat.std(0x767c78, 'powderCoat', { roughness: 0.62 });
const tankDark = mat.std(0x5c625e, 'powderCoat');
const porcelainBrown = mat.std(PALETTE.porcelainBrown, 'porcelain');

function bushing(h, r) {
  const g = new THREE.Group();
  g.add(cyl(r * 0.8, r, 0.05, mat.darkSteel(), 0, 0.025, 0, 10));
  const sheds = Math.max(2, Math.round(h / 0.11));
  for (let i = 0; i < sheds; i++) {
    g.add(cyl(r * 1.45, r * 1.45, 0.022, porcelainBrown, 0, 0.09 + i * (h - 0.14) / sheds, 0, 10));
    g.add(cyl(r * 0.72, r * 0.72, (h - 0.14) / sheds, porcelainBrown, 0, 0.09 + (i + 0.5) * (h - 0.14) / sheds, 0, 10));
  }
  g.add(cyl(0.016, 0.016, 0.07, mat.std(PALETTE.brass, 'brushedSteel'), 0, h + 0.02, 0, 8));
  return g;
}

export function createPlinthSubstation() {
  const group = new THREE.Group();
  group.name = 's06-plinth-substation';
  const C = PL.compound;
  const T = PL.tank;
  const cx = PL.x, cz = PL.z;
  const baseY = 0.25;                                   // plinth top

  // gravel bed + concrete plinth
  const gravel = box(C.x1 - C.x0, 0.06, C.z1 - C.z0, mat.std(0x6f6a5e, 'concrete'),
    (C.x0 + C.x1) / 2, 0.15, (C.z0 + C.z1) / 2);
  group.add(gravel);
  group.add(box(T.w + 0.5, baseY, T.d + 0.5, mat.concrete(), cx, baseY / 2 + 0.06, cz));

  // ---- the 500 kVA tank
  const tank = new THREE.Group();
  tank.add(box(T.w, T.h, T.d, tankMat, 0, 0, 0));
  const finGeo = new THREE.BoxGeometry(0.09, T.h - 0.2, 0.055);
  const fins = new THREE.InstancedMesh(finGeo, tankDark, 26);
  const m4 = new THREE.Matrix4();
  let fi = 0;
  for (const side of [-1, 1]) for (let k = 0; k < 13; k++) {
    m4.makeTranslation(-T.w / 2 + 0.15 + k * (T.w - 0.3) / 12, 0, side * (T.d / 2 + 0.028));
    fins.setMatrixAt(fi++, m4);
  }
  fins.instanceMatrix.needsUpdate = true;
  tank.add(fins);
  tank.add(box(T.w + 0.06, 0.06, T.d + 0.06, tankDark, 0, T.h / 2 + 0.03, 0));
  [-0.55, 0, 0.55].forEach((dx) => {                    // HV bushings
    const b = bushing(0.46, 0.055);
    b.position.set(dx, T.h / 2 + 0.06, 0.22);
    tank.add(b);
  });
  // LV cable box on the street side — plinth units terminate indoors
  tank.add(box(0.9, 0.8, 0.22, tankDark, -0.3, -0.1, -T.d / 2 - 0.11));
  // conservator + breather, same language as the hero
  const drum = cyl(0.17, 0.17, 0.8, tankMat, 0.5, T.h / 2 + 0.42, 0.28, 16);
  drum.rotation.z = Math.PI / 2;
  tank.add(drum);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x5d84b8, roughness: 0.15, transparent: true, opacity: 0.75 }));
  bowl.scale.y = 0.8;
  bowl.position.set(0.22, T.h / 2 + 0.12, 0.28);
  tank.add(bowl);
  const rating = textPlate(0.8, 0.42, [
    { text: '500 kVA · 11,000/433 V', size: 62, color: '#ece7da' },
    { text: 'Dyn11 · ONAN · IS 1180', size: 56, color: '#c9c2b2' },
  ], { px: [1024, 512], bg: '#3a3f3c', emissive: 0.3 });
  rating.position.set(T.w / 2 + 0.012, 0, 0);
  rating.rotation.y = Math.PI / 2;
  tank.add(rating);
  tank.position.set(cx, baseY + T.h / 2, cz);
  group.add(tank);

  // ---- the compound fence: posts + two rail bars + a gate
  const fenceMat = mat.galv();
  const fx = [C.x0, C.x1], fz = [C.z0, C.z1];
  for (const px of [fx[0], (fx[0] + fx[1]) / 2, fx[1]]) for (const pz of fz) {
    group.add(cyl(0.03, 0.03, 1.15, fenceMat, px, 0.72, pz, 8));
  }
  for (const pz of [fz[0], fz[1]]) for (const pz2 of [0.62, 1.05]) {
    group.add(box(C.x1 - C.x0, 0.045, 0.045, fenceMat, (C.x0 + C.x1) / 2, pz2, pz));
  }
  for (const px of fx) for (const ry of [0.62, 1.05]) {
    group.add(box(0.045, 0.045, C.z1 - C.z0, fenceMat, px, ry, (C.z0 + C.z1) / 2));
  }
  for (const px of [fx[0], fx[1]]) for (const pz of [(fz[0] + fz[1]) / 2]) {
    group.add(cyl(0.03, 0.03, 1.15, fenceMat, px, 0.72, pz, 8));
  }
  // compound plate + danger plate on the gate (north rail, street side)
  const plate = textPlate(1.5, 0.36, [
    { text: 'S/STN 500 kVA — SHANTI APARTMENTS', size: 58, color: '#f0ead8' },
  ], { px: [1536, 384], bg: '#2c332a', emissive: 0.4 });
  plate.position.set((C.x0 + C.x1) / 2, 1.32, C.z1 + 0.02);
  group.add(plate);
  const danger = textPlate(0.4, 0.28, [
    { text: '11,000 VOLTS', size: 74, color: '#ffffff' },
    { text: 'DANGER', size: 92, color: '#ffffff' },
  ], { px: [512, 384], bg: '#a02722', emissive: 0.25 });
  danger.position.set(C.x1 - 0.7, 0.82, C.z1 + 0.02);
  group.add(danger);

  // ---- feeder pillars ×2 (one here, one mid-block north, §4.4)
  for (const fp of S06.feederPillars) {
    const pillar = new THREE.Group();
    pillar.add(box(0.85, 1.1, 0.4, mat.std(S06.palette.kioskGreen, 'powderCoat'), 0, 0.55, 0));
    pillar.add(box(0.92, 0.06, 0.46, mat.darkSteel(), 0, 1.13, 0));
    pillar.add(box(0.6, 0.5, 0.02, mat.std(0x626b5e, 'powderCoat'), 0, 0.62, -0.21));
    const lab = textPlate(0.62, 0.15, [{ text: 'FEEDER PILLAR', size: 84, color: '#eef0e8' }],
      { px: [768, 192], bg: '#3c4438', emissive: 0.3 });
    lab.position.set(0, 0.95, -0.215);
    lab.rotation.y = Math.PI;
    pillar.add(lab);
    pillar.position.set(fp.x, 0.12, fp.z);
    group.add(pillar);
  }
  return group;
}
