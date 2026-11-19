// poleTransformer.js — the hero (inventory §4.1): a 315 kVA,
// 11,000/433 V, Dyn11, ONAN distribution transformer to IS 1180 on
// its double-pole structure — corrugated radiator fins, three HV and
// four LV bushings, conservator with its silica-gel breather, tap
// wheel, drop-out fuses on the arm above, gang switch with its
// operating rod, earth wires to their pits, and the plate that tells
// tonight's story: 78% loaded at 20:15, humming at 100 Hz. A second,
// plainer unit stands at the west end of the block (detail=false).

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';
import { box, cyl, mat, textPlate, conductorTube } from './helpers.js';
import { phaseAnchor } from './feederLine.js';

const S06 = STATION06;
const H = S06.hero;
const F = S06.feeder;

const tankMat = mat.std(0x767c78, 'powderCoat', { roughness: 0.62 });  // weathered smoke grey
const tankDark = mat.std(0x5c625e, 'powderCoat');
const porcelainBrown = mat.std(PALETTE.porcelainBrown, 'porcelain');

// a shedded porcelain bushing, `h` tall, standing at the origin
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

// corrugated radiator fins on both long faces — instanced thin panels
function finField(tank) {
  const finGeo = new THREE.BoxGeometry(0.085, tank.h - 0.18, 0.055);
  const count = 22;
  const inst = new THREE.InstancedMesh(finGeo, tankDark, count);
  const m4 = new THREE.Matrix4();
  let i = 0;
  for (const side of [-1, 1]) {
    for (let k = 0; k < 11; k++) {
      const x = -tank.w / 2 + 0.14 + k * (tank.w - 0.28) / 10;
      m4.makeTranslation(x, 0, side * (tank.d / 2 + 0.028));
      inst.setMatrixAt(i++, m4);
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}

export function createPoleTransformer(cx, detail = true) {
  const g = new THREE.Group();
  const T = H.tank;
  const poleMat = mat.std(0x8a867e, 'concrete');
  const poleXs = [cx - H.poleGap / 2, cx + H.poleGap / 2];

  // ---- the double-pole structure
  for (const px of poleXs) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, F.poleHeight, 4), poleMat);
    pole.rotation.y = Math.PI / 4;
    pole.position.set(px, F.poleHeight / 2 - F.buried, H.z);
    g.add(pole);
    // earth wire down the street face to its pit
    g.add(box(0.025, 7.2, 0.012, mat.std(0x7d7466, 'brushedSteel'), px, 3.6, H.z - 0.155));
    g.add(box(0.5, 0.07, 0.4, mat.concreteDark(), px, 0.035, H.z - 0.55));
  }
  // X cross-bracing between the poles, below the platform
  for (const s of [-1, 1]) {
    const brace = box(0.05, 3.6, 0.05, mat.galv(), cx, 3.6, H.z);
    brace.rotation.z = s * 0.68;
    g.add(brace);
  }
  g.add(box(H.poleGap + 0.5, 0.07, 0.07, mat.galv(), cx, 5.35, H.z));
  // channel bearers at platform height (tank base centres 415 mm)
  for (const bz of [H.z - 0.21, H.z + 0.21]) {
    g.add(box(H.poleGap + 0.6, 0.15, 0.11, mat.darkSteel(), cx, H.platformY - 0.075, bz));
  }

  // ---- the tank
  const tank = new THREE.Group();
  const body = box(T.w, T.h, T.d, tankMat, 0, 0, 0);
  tank.add(body);
  tank.add(finField(T));
  const cover = box(T.w + 0.06, 0.06, T.d + 0.06, tankDark, 0, T.h / 2 + 0.03, 0);
  tank.add(cover);
  for (const lx of [-T.w / 2 + 0.15, T.w / 2 - 0.15]) {       // lifting lugs
    tank.add(box(0.05, 0.11, 0.03, tankDark, lx, T.h / 2 + 0.11, 0));
  }
  // cover bolts on both long edges + the rust weep that runs from
  // them down the street face (§4.1 weathering: dirt where water goes)
  const boltMat = mat.darkSteel();
  for (let i = 0; i < 8; i++) {
    const bx = -T.w / 2 + 0.1 + i * (T.w - 0.2) / 7;
    for (const side of [-1, 1]) {
      tank.add(cyl(0.016, 0.016, 0.05, boltMat, bx, T.h / 2 + 0.02, side * (T.d / 2 + 0.035), 6));
    }
    if (detail && i % 2 === 0) {
      const weep = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x4a3826, transparent: true, opacity: 0.4, depthWrite: false }));
      weep.position.set(bx, T.h / 2 - 0.2, -T.d / 2 - 0.062);
      weep.rotation.y = Math.PI;
      tank.add(weep);
    }
  }
  // HV bushings (line side, north edge of the cover) + LV bushings
  const hvTips = [];
  [-0.45, 0, 0.45].forEach((dx, i) => {
    const b = bushing(0.42, 0.05);
    b.position.set(dx, T.h / 2 + 0.06, 0.2);
    tank.add(b);
    hvTips.push(new THREE.Vector3(cx + dx, H.tank.centreY + T.h / 2 + 0.5, H.z + 0.2));
  });
  [-0.5, -0.17, 0.17, 0.5].forEach((dx) => {
    const b = bushing(0.24, 0.04);
    b.position.set(dx, T.h / 2 + 0.06, -0.22);
    tank.add(b);
  });
  // conservator drum on its support, oil gauge on the end cap
  const cons = H.conservator;
  const drum = cyl(cons.r, cons.r, cons.len, tankMat, 0, 0, 0, 16);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(cx + 0.45, cons.y, cons.z);
  g.add(drum);
  for (const sx of [cx + 0.25, cx + 0.65]) {
    g.add(box(0.05, cons.y - (H.tank.centreY + T.h / 2), 0.05, tankDark, sx, (cons.y + H.tank.centreY + T.h / 2) / 2, cons.z + 0.1));
  }
  const gauge = cyl(0.055, 0.055, 0.02, mat.std(0xe8e4da, 'powderCoat'), cx + 0.45 + cons.len / 2 + 0.01, cons.y, cons.z, 14);
  gauge.rotation.z = Math.PI / 2;
  g.add(gauge);
  g.add(cyl(0.022, 0.022, 0.35, tankDark, cx + 0.3, cons.y - 0.3, cons.z + 0.12, 8));  // oil pipe
  // the breather, hanging below the conservator: pot + glass bowl of
  // silica gel, blue when dry — the beloved detail (§4.1)
  const brY = cons.y - 0.52;
  g.add(cyl(0.05, 0.05, 0.14, tankDark, cx + 0.18, brY + 0.1, cons.z, 10));
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x5d84b8, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.75 }));
  bowl.scale.y = 0.8;
  bowl.position.set(cx + 0.18, brY, cons.z);
  g.add(bowl);
  // off-circuit tap changer wheel on the west end face (the long
  // faces belong to the radiator fins)
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 8, 20), mat.darkSteel());
  wheel.position.set(cx - T.w / 2 - 0.04, H.tank.centreY - 0.25, H.z);
  wheel.rotation.y = Math.PI / 2;
  g.add(wheel);
  tank.position.set(cx, H.tank.centreY, H.z);
  g.add(tank);

  if (detail) {
    // rating plate on the east end face (fin-free, catches the light)
    const rating = textPlate(0.72, 0.4, [
      { text: '315 kVA · 11,000/433 V', size: 62, color: '#ece7da' },
      { text: 'Dyn11 · ONAN · IS 1180', size: 56, color: '#c9c2b2' },
    ], { px: [1024, 512], bg: '#3a3f3c', emissive: 0.3 });
    rating.position.set(cx + T.w / 2 + 0.012, H.tank.centreY, H.z);
    rating.rotation.y = Math.PI / 2;
    g.add(rating);
    // DO fuse arm above, fuses angled ~15°, jumpers from the line
    g.add(box(H.poleGap + 0.4, 0.08, 0.08, mat.galv(), cx, 7.5, H.z));
    [-0.45, 0, 0.45].forEach((dx, i) => {
      const fuse = new THREE.Group();
      fuse.add(cyl(0.032, 0.032, 0.55, porcelainBrown, 0, -0.24, 0, 10));
      fuse.add(cyl(0.045, 0.045, 0.07, mat.darkSteel(), 0, 0.02, 0, 10));
      fuse.position.set(cx + dx, 7.52, H.z + 0.05);
      fuse.rotation.x = 0.26;                                  // ~15° from vertical
      g.add(fuse);
      const anchor = phaseAnchor(cx, i);
      g.add(conductorTube(anchor, new THREE.Vector3(cx + dx, 7.56, H.z + 0.05), 0.04, 0.013,
        mat.std(0x2e3134, 'brushedSteel', { metalness: 0.7, roughness: 0.45 })));
      g.add(conductorTube(new THREE.Vector3(cx + dx, 7.14, H.z + 0.18), hvTips[i], 0.03, 0.011,
        mat.std(0x2e3134, 'brushedSteel', { metalness: 0.7, roughness: 0.45 })));
    });
    // gang-operated AB switch: handle at reach height, rod up the pole
    const px = poleXs[0];
    g.add(cyl(0.018, 0.018, 5.2, mat.galv(), px - 0.2, 4.3, H.z - 0.1, 8));
    g.add(box(0.34, 0.22, 0.14, mat.std(PALETTE.panelBlue, 'powderCoat'), px - 0.2, 6.85, H.z - 0.1));
    const handle = box(0.05, 0.55, 0.05, mat.std(PALETTE.warningRed, 'powderCoat'), px - 0.2, 1.62, H.z - 0.16);
    handle.rotation.x = -0.5;
    g.add(handle);
    g.add(box(0.3, 0.42, 0.2, mat.std(PALETTE.panelBlue, 'powderCoat'), px - 0.2, 1.25, H.z - 0.12));
    // climbing steps up the east pole
    for (let y = 2.3; y < 5.6; y += 0.42) {
      const step = cyl(0.014, 0.014, 0.3, mat.galv(), poleXs[1], y, H.z, 6);
      step.rotation.z = Math.PI / 2;
      g.add(step);
    }
    // streetlight control box on the west pole (§4.11) + its plate
    g.add(box(0.42, 0.56, 0.18, mat.std(0x707880, 'powderCoat'), px, 1.62, H.z - 0.24));
    const slPlate = textPlate(0.4, 0.24, [
      { text: 'SL CONTROL', size: 74, color: '#e8ecf0' },
      { text: 'ON 19:02 · OFF 05:41', size: 62, color: '#c8cfd6' },
    ], { px: [768, 448], bg: '#26292d', emissive: 0.3 });
    slPlate.position.set(px, 1.62, H.z - 0.34);
    slPlate.rotation.y = Math.PI;
    g.add(slPlate);
    // danger plate + the story plate on its stand at the footpath edge
    const danger = textPlate(0.42, 0.3, [
      { text: '11,000 VOLTS', size: 74, color: '#ffffff' },
      { text: 'DANGER', size: 92, color: '#ffffff' },
    ], { px: [512, 384], bg: '#a02722', emissive: 0.25 });
    danger.position.set(px, 2.6, H.z - 0.17);
    danger.rotation.y = Math.PI;
    g.add(danger);
    const story = new THREE.Group();
    const storyPlate = textPlate(1.15, 0.52, [
      { text: '315 kVA · Dyn11 · ONAN', size: 66, color: '#f0ead8' },
      { text: '78% LOADED AT 20:15 · HUM 100 Hz', size: 56, color: '#ffd9a0' },
    ], { px: [1408, 640], bg: '#22262a', emissive: 0.4 });
    storyPlate.rotation.x = -0.32;
    story.add(storyPlate);
    for (const s of [-0.45, 0.45]) story.add(box(0.045, 1.02, 0.045, mat.darkSteel(), s, -0.28, -0.1));
    story.position.set(cx + 2.6, 1.06, H.z - 0.85);
    story.rotation.y = Math.PI + 0.35;
    g.add(story);
  }
  return g;
}

export function createHeroTransformer() {
  return createPoleTransformer(S06.hero.x, true);
}

export function createSecondTransformer() {
  return createPoleTransformer(S06.secondUnit.x, false);
}
