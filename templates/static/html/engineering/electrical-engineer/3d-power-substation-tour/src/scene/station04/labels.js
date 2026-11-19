// labels.js — the hall's sparse, factual plates: bearing number
// tags N1–N12 on the pedestals, the deck-edge VIS plate, nameplates
// for the MOT, condenser and spare rotor, and the generator's stator
// plate carrying the 360 t fact. All text measured to fit (kit.js).

import * as THREE from 'three';
import { STATION04, PALETTE } from '../../config/world.js';
import { textPlate } from './kit.js';

const S04 = STATION04;
const DY = S04.deck.topY;

export function createLabels() {
  const g = new THREE.Group();
  g.name = 's04-labels';

  // bearing tags on the south face of every pedestal
  S04.bearingsX.forEach((bx, i) => {
    const tag = textPlate(0.52, 0.3, [{ text: `N${i + 1}`, px: 120 }], { bg: '#f0efe8', ink: '#1c2126', pxPerM: 300 });
    tag.position.set(bx, DY + 2.6, -1.18);
    tag.rotation.y = Math.PI;
    g.add(tag);
  });
  // the thrust bearing gets its story told
  const thrust = textPlate(1.7, 0.5, [
    { text: 'N3 · THRUST + JOURNAL', px: 62 },
    { text: 'THE SHAFT’S AXIAL ANCHOR', px: 44, weight: 400 },
  ], { bg: '#274b63', ink: '#f2f5f6' });
  thrust.position.set(S04.bearingsX[2], DY + 3.6, -1.35);
  thrust.rotation.y = Math.PI;
  g.add(thrust);

  // VIS plate at the deck's south edge, over the spring gap
  const vis = textPlate(3.4, 0.62, [
    { text: 'TG DECK ON SPRING ISOLATORS (VIS)', px: 66 },
    { text: 'NATURAL FREQUENCY ≈ 2–3 Hz · RUNNING 50 Hz', px: 48, weight: 400 },
  ], { bg: '#f0efe8', ink: '#1c2126' });
  vis.position.set(-8, DY - 1.6, -S04.deck.halfZ - 0.06);
  vis.rotation.y = Math.PI;
  g.add(vis);

  // unit plate on the front standard
  const unit = textPlate(1.6, 0.62, [
    { text: 'UNIT 5 · 660 MW', px: 74 },
    { text: 'ON LOAD 640 MW · 3000 RPM', px: 46, weight: 400 },
  ], { bg: '#f0efe8', ink: '#1c2126' });
  unit.position.set(S04.frontStandard.x, DY + 2.1, -0.88);
  unit.rotation.y = Math.PI;
  g.add(unit);

  // generator stator plate
  const gen = textPlate(2.6, 0.66, [
    { text: 'GENERATOR · TBB-660 CLASS', px: 64 },
    { text: 'STATOR ≈ 360 t · H₂ + STATOR-WATER COOLED', px: 44, weight: 400 },
  ], { bg: '#274b63', ink: '#f2f5f6' });
  gen.position.set((S04.generator.x0 + S04.generator.x1) / 2, S04.shaft.y + 0.4, -S04.generator.dia / 2 - 0.06);
  gen.rotation.y = Math.PI;
  g.add(gen);

  // MOT nameplate (faces south, toward the A-row walkway)
  const mot = textPlate(2.4, 0.6, [
    { text: 'MAIN OIL TANK · 58 m³', px: 70 },
    { text: 'ISO VG 32 · SYSTEM ≈ 52,000 L', px: 46, weight: 400 },
  ], { bg: '#f0efe8', ink: '#1c2126' });
  mot.position.set(S04.mot.x, 2.1, S04.mot.z - 1.56);
  mot.rotation.y = Math.PI;
  g.add(mot);

  // condenser plate in the basement
  const cond = textPlate(2.8, 0.64, [
    { text: 'CONDENSER · 10.3 kPa ABS', px: 66 },
    { text: 'CW 64,000 m³/h · 4 EXHAUST PATHS', px: 46, weight: 400 },
  ], { bg: '#f0efe8', ink: '#1c2126' });
  cond.position.set((S04.condenser.x0 + S04.condenser.x1) / 2, 5.4, -S04.condenser.halfZ - 1.72);
  cond.rotation.y = Math.PI;
  g.add(cond);

  // spare rotor tag
  const rotor = textPlate(1.9, 0.52, [
    { text: 'SPARE HP/IP ROTOR', px: 66 },
    { text: 'TRESTLE-MOUNTED · TAGGED', px: 44, weight: 400 },
  ], { bg: '#f0efe8', ink: '#1c2126' });
  rotor.position.set(31, DY + 0.55, 3.4);
  rotor.rotation.y = -0.5;
  g.add(rotor);

  // exciter end plate
  const exc = textPlate(1.7, 0.5, [
    { text: 'BRUSHLESS EXCITER', px: 62 },
    { text: 'TURNING GEAR ≈ 4–6 RPM', px: 44, weight: 400 },
  ], { bg: '#f0efe8', ink: '#1c2126' });
  exc.position.set((S04.exciter.x0 + S04.exciter.x1) / 2, S04.shaft.y + 1.35, -1.1);
  exc.rotation.y = Math.PI;
  g.add(exc);

  return g;
}
