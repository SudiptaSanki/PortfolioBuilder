// rmu.js — the scene's second hero (inventory §4.3, §4.10): RMU-3, a
// 3-way ring main unit in its street kiosk — two 630 A ring switches
// and a 200 A transformer feeder for the 500 kVA plinth unit. It is
// the hardware that makes Feeder F-7 an open ring: isolate a fault
// between two RMUs, close the normally open point toward RMU-4, and
// the block stays lit. The kiosk carries both plates: what it is,
// and the worked fault story of last Tuesday. Beside it, the FRTU
// cabinet that reports to Station 01's control room. The buried
// ring's surface evidence — trench covers, joint bays, route
// markers — is modelled too (§4.5): underground plant is read by
// what it leaves on the footpath.

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';
import { box, cyl, mat, textPlate } from './helpers.js';

const S06 = STATION06;
const R = S06.rmu;
const P06 = S06.palette;

// one mimic door: frame, position-indicator flag, handle slot
function mimicDoor(x, y, z, label, state, parent) {
  const g = new THREE.Group();
  g.add(box(0.52, 1.06, 0.03, mat.std(0x6a7462, 'powderCoat'), 0, 0, 0));
  g.add(box(0.44, 0.98, 0.012, mat.std(0x79836f, 'powderCoat'), 0, 0, -0.012));
  // mimic line + the red/green position flag — the only saturated
  // points at ground level, per the inventory's colour discipline
  const flag = box(0.09, 0.09, 0.02,
    mat.std(state === 'closed' ? PALETTE.ledRed : PALETTE.ledGreen, 'powderCoat',
      { emissive: state === 'closed' ? PALETTE.ledRed : PALETTE.ledGreen, emissiveIntensity: 0.7 }),
    0, 0.28, -0.03);
  g.add(flag);
  g.add(box(0.03, 0.3, 0.015, mat.darkSteel(), 0, -0.05, -0.028));      // mimic busbar stub
  g.add(box(0.16, 0.035, 0.02, mat.darkSteel(), 0, -0.34, -0.028));     // handle slot
  const lab = textPlate(0.44, 0.13, [{ text: label, size: 84, color: '#eef0e8' }],
    { px: [768, 224], bg: '#3c4438', emissive: 0.35 });
  lab.position.set(0, -0.62, -0.02);
  lab.rotation.y = Math.PI;
  g.add(lab);
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

export function createRmu() {
  const group = new THREE.Group();
  group.name = 's06-rmu';
  const kioskMat = mat.std(P06.kioskGreen, 'powderCoat', { roughness: 0.6 });
  const frontZ = R.z - R.d / 2;

  // plinth, ~300 mm proud, hollow over the cable basement
  group.add(box(R.w + 0.5, R.plinthTop, R.d + 0.5, mat.concrete(), R.x, R.plinthTop / 2, R.z));
  // the kiosk body + a slightly overhanging roof with dust on top
  group.add(box(R.w, R.h, R.d, kioskMat, R.x, R.plinthTop + R.h / 2, R.z));
  group.add(box(R.w + 0.16, 0.07, R.d + 0.16, mat.std(0x5f6859, 'powderCoat'), R.x, R.plinthTop + R.h + 0.035, R.z));
  // three mimic doors on the street face: ring-in (closed, fed from
  // the west tonight), transformer feeder (closed), ring-out toward
  // RMU-4 — the NOP side, OPEN, and its flag says so
  mimicDoor(R.x - 0.56, R.plinthTop + 0.82, frontZ - 0.01, 'RING · WEST IN', 'closed', group);
  mimicDoor(R.x, R.plinthTop + 0.82, frontZ - 0.01, 'TX FEEDER · 200 A', 'closed', group);
  mimicDoor(R.x + 0.56, R.plinthTop + 0.82, frontZ - 0.01, 'RING · EAST → RMU-4', 'open', group);
  // fault passage indicator box with its flag window (red = fault
  // passed here; tonight it rests dark — the story plate explains)
  const fpi = new THREE.Group();
  fpi.add(box(0.3, 0.22, 0.07, mat.std(PALETTE.panelBlue, 'powderCoat'), 0, 0, 0));
  fpi.add(box(0.16, 0.09, 0.02, mat.std(0x22262a, 'powderCoat'), 0, 0.02, -0.04));
  const fpiLab = textPlate(0.26, 0.08, [{ text: 'FPI', size: 92, color: '#dfe5ea' }],
    { px: [384, 128], bg: '#33566e', emissive: 0.3 });
  fpiLab.position.set(0, -0.06, -0.045);
  fpiLab.rotation.y = Math.PI;
  fpi.add(fpiLab);
  fpi.position.set(R.x + 0.68, R.plinthTop + 1.62, frontZ - 0.02);
  group.add(fpi);
  // ventilation louvres low on both flanks + a padlocked hasp
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      group.add(box(0.02, 0.035, 0.6, mat.darkSteel(), R.x + side * (R.w / 2 + 0.005), R.plinthTop + 0.28 + i * 0.09, R.z));
    }
  }
  group.add(box(0.07, 0.12, 0.03, mat.steel(), R.x + 0.28, R.plinthTop + 0.78, frontZ - 0.03));
  group.add(cyl(0.035, 0.035, 0.025, mat.std(PALETTE.brass, 'brushedSteel'), R.x + 0.28, R.plinthTop + 0.68, frontZ - 0.035, 10));

  // the nameplate — the ring, stated
  const plate = textPlate(1.7, 0.44, [
    { text: 'RMU-3 · FEEDER F-7 · RING MAIN UNIT', size: 58, color: '#f0ead8' },
    { text: 'NOP → RMU-4 (OPEN) · RING 630 A · SF6', size: 52, color: '#cfd4c8' },
  ], { px: [1536, 384], bg: '#2c332a', emissive: 0.4 });
  plate.position.set(R.x, R.plinthTop + R.h + 0.32, frontZ + 0.1);
  plate.rotation.y = Math.PI;
  plate.rotation.x = 0.1;
  group.add(plate);
  for (const s of [-0.7, 0.7]) group.add(box(0.05, 0.34, 0.05, mat.darkSteel(), R.x + s, R.plinthTop + R.h + 0.12, frontZ + 0.1));

  // the fault story plate (§4.10) on a stand at the kiosk's west side
  const story = new THREE.Group();
  const storyPlate = textPlate(1.3, 0.86, [
    { text: '21:40, LAST TUESDAY', size: 62, color: '#ffd9a0' },
    { text: 'CABLE FAULT BETWEEN RMU-2 AND RMU-3.', size: 47, color: '#e8ecf0' },
    { text: 'FPI FLAGS RED ON THE FAULTED LEG.', size: 47, color: '#e8ecf0' },
    { text: 'RMU-3 WEST SWITCH OPENED — FAULT ISOLATED.', size: 47, color: '#e8ecf0' },
    { text: 'NOP AT RMU-4 CLOSED: THIS BLOCK RE-FED', size: 47, color: '#e8ecf0' },
    { text: 'FROM THE EAST IN 11 MINUTES.', size: 47, color: '#e8ecf0' },
    { text: 'THAT IS THE ENTIRE REASON THE RING EXISTS.', size: 47, color: '#ffd9a0' },
  ], { px: [1408, 928], bg: '#20262b', emissive: 0.42 });
  storyPlate.rotation.x = -0.3;
  story.add(storyPlate);
  for (const s of [-0.52, 0.52]) story.add(box(0.045, 1.04, 0.045, mat.darkSteel(), s, -0.3, -0.12));
  story.position.set(R.x - 1.75, 1.12, frontZ - 0.55);
  story.rotation.y = Math.PI + 0.3;
  group.add(story);

  // FRTU cabinet beside the kiosk + its stubby antenna (→ Station 01)
  const FT = S06.frtu;
  group.add(box(FT.w + 0.24, 0.18, FT.d + 0.24, mat.concrete(), FT.x, 0.09, FT.z));
  group.add(box(FT.w, FT.h, FT.d, mat.std(PALETTE.panelBlue, 'powderCoat'), FT.x, 0.18 + FT.h / 2, FT.z));
  const ftLab = textPlate(0.44, 0.16, [{ text: 'FRTU · SCADA', size: 80, color: '#dfe5ea' }],
    { px: [768, 256], bg: '#2a4257', emissive: 0.35 });
  ftLab.position.set(FT.x, 0.18 + FT.h - 0.22, FT.z - FT.d / 2 - 0.012);
  ftLab.rotation.y = Math.PI;
  group.add(ftLab);
  const ant = cyl(0.012, 0.02, 1.15, mat.darkSteel(), FT.x + 0.12, 0.18 + FT.h + 0.55, FT.z, 6);
  group.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8),
    new THREE.MeshStandardMaterial({ color: PALETTE.ledGreen, emissive: PALETTE.ledGreen, emissiveIntensity: 0.9 }));
  antTip.position.set(FT.x + 0.12, 0.18 + FT.h + 1.14, FT.z);
  group.add(antTip);
  group.userData.scadaTipMat = antTip.material;

  // ---- the buried ring's surface evidence (§4.5)
  // trench covers from the kiosk toward the transition pole and the
  // apartment plinth substation; two joint-bay covers; route markers
  const coverMat = mat.concreteDark();
  for (let i = 0; i < 3; i++) {
    group.add(box(1.1, 0.045, 0.7, coverMat, R.x + 1.6 + i * 1.25, 0.145, 6.9));
  }
  group.add(box(1.3, 0.05, 0.8, coverMat, 28.6, 0.145, 6.9));       // joint bay
  group.add(box(1.3, 0.05, 0.8, coverMat, 24.2, 0.145, 6.9));       // joint bay
  const markerMat = mat.std(0xd8d2c2, 'concrete');
  const markerTop = mat.std(PALETTE.warningRed, 'powderCoat');
  for (const mx of [29.2, 26.9, 24.6]) {
    group.add(box(0.16, 0.45, 0.16, markerMat, mx, 0.34, 7.08));
    group.add(box(0.17, 0.07, 0.17, markerTop, mx, 0.6, 7.08));
    const ht = textPlate(0.13, 0.2, [{ text: 'HT', size: 96, color: '#7a2018' }],
      { px: [192, 288], bg: '#d8d2c2', emissive: 0.15, border: null });
    ht.position.set(mx, 0.36, 7.08 - 0.085);
    ht.rotation.y = Math.PI;
    group.add(ht);
  }
  // earth pit at the kiosk
  group.add(box(0.5, 0.07, 0.4, mat.concreteDark(), R.x - 1.3, 0.035, R.z - 0.9));
  const earthLab = textPlate(0.44, 0.14, [{ text: 'EARTH', size: 88, color: '#c8cfd6' }],
    { px: [512, 160], bg: '#3a3d40', emissive: 0.2 });
  earthLab.rotation.x = -Math.PI / 2;
  earthLab.position.set(R.x - 1.3, 0.075, R.z - 0.9);
  group.add(earthLab);

  return group;
}
