// generator.js — the electrical end of the shaft: the pale
// hydrogen-cooled generator barrel (Ø 4.0 m, ≈360 t stator — the
// reason for the 200 t cranes), its end shields and ribs, the three
// isolated-phase bus ducts diving through the deck, the brushless
// exciter, the turning gear at the very end of the line, and the
// ground-floor stator-water and seal-oil skids that serve it.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { box, cyl, pipeRun } from './kit.js';

const S04 = STATION04;
const SY = S04.shaft.y;
const DY = S04.deck.topY;
const GEN = S04.generator;
const EXC = S04.exciter;

export function createGenerator() {
  const g = new THREE.Group();
  g.name = 's04-generator';

  const enamel = new THREE.MeshStandardMaterial({ color: 0xaebbae, ...SURFACE.powderCoat }); // pale grey-green
  const enamelDark = new THREE.MeshStandardMaterial({ color: 0x8b9a8c, ...SURFACE.powderCoat });
  const castMat = new THREE.MeshStandardMaterial({ color: 0x4d554e, ...SURFACE.powderCoat });
  const soleMat = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, ...SURFACE.brushedSteel });
  const aluMat = new THREE.MeshStandardMaterial({ color: PALETTE.aluminium, ...SURFACE.brushedSteel });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xb9bcba, roughness: 0.45, metalness: 0.6 });

  // ---- barrel ------------------------------------------------------
  const cx = (GEN.x0 + GEN.x1) / 2;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(GEN.dia / 2, GEN.dia / 2, GEN.x1 - GEN.x0, 40), enamel);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(cx, SY, 0);
  g.add(barrel);
  // circumferential stiffening ribs
  for (let i = 0; i < 6; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(GEN.dia / 2 + 0.045, 0.05, 8, 44), enamelDark);
    rib.rotation.y = Math.PI / 2;
    rib.position.set(GEN.x0 + 0.9 + i * 1.55, SY, 0);
    g.add(rib);
  }
  // end shields: bigger-Ø rings at both ends
  for (const ex of [GEN.x0 + 0.28, GEN.x1 - 0.28]) {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(GEN.dia / 2 + 0.22, GEN.dia / 2 + 0.22, 0.55, 40), enamelDark);
    shield.rotation.z = Math.PI / 2;
    shield.position.set(ex, SY, 0);
    g.add(shield);
  }
  // feet + lifting trunnions
  for (const fx of [GEN.x0 + 1.2, GEN.x1 - 1.2]) {
    g.add(box(0.9, SY - GEN.dia / 2 - DY + 0.4, 2.2, castMat, fx, (DY + SY - GEN.dia / 2) / 2, 0));
    g.add(cyl(0.14, 0.14, 0.7, soleMat, fx, SY + GEN.dia / 2 + 0.2, 0, 12));
  }
  // hydrogen cooler pipes under the barrel + seal-oil lines to the shields
  pipeRun([[GEN.x0 + 1.5, SY - 1.9, 0.9], [GEN.x0 + 1.5, DY + 0.4, 0.9], [GEN.x0 + 1.5, DY + 0.4, 3.4]], 0.09, pipeMat, g);
  pipeRun([[GEN.x1 - 1.5, SY - 1.9, -0.9], [GEN.x1 - 1.5, DY + 0.4, -0.9], [GEN.x1 - 1.5, DY + 0.4, -3.2]], 0.09, pipeMat, g);
  for (const ex of [GEN.x0 + 0.3, GEN.x1 - 0.3]) {
    pipeRun([[ex, SY - 0.6, -2.05], [ex, DY + 0.55, -2.6], [ex, DY + 0.55, -3.2]], 0.055, pipeMat, g);
  }

  // ---- isolated-phase bus ducts: three aluminium ducts dive
  // through the deck slot toward the generator transformer (Station 02)
  for (let i = 0; i < 3; i++) {
    const dx = 17.4 + i * 2.1;
    g.add(box(1.15, 0.95, 0.35, aluMat, dx, SY - GEN.dia / 2 - 0.35, -1.35));       // terminal box under the barrel
    g.add(box(1.15, 0.95, 1.9, aluMat, dx, SY - GEN.dia / 2 - 0.35, -2.3));         // elbow south
    const duct = box(1.15, SY - GEN.dia / 2 - 10.4, 0.95, aluMat, dx, (SY - GEN.dia / 2 + 10.4) / 2 + 0.1, -2.8);
    g.add(duct);
    g.add(box(1.3, 0.18, 1.1, soleMat, dx, 10.35, -2.8));   // duct support at basement level
  }

  // ---- exciter + turning gear ---------------------------------------
  const exc = new THREE.Mesh(new THREE.CylinderGeometry(EXC.dia / 2, EXC.dia / 2, EXC.x1 - EXC.x0, 28), enamel);
  exc.rotation.z = Math.PI / 2;
  exc.position.set((EXC.x0 + EXC.x1) / 2, SY, 0);
  g.add(exc);
  const hatch = cyl(0.42, 0.42, 0.14, enamelDark, EXC.x1 + 0.05, SY, 0, 20);
  hatch.rotation.z = Math.PI / 2;
  g.add(hatch);
  g.add(box(0.6, SY - EXC.dia / 2 - DY + 0.3, 1.1, castMat, (EXC.x0 + EXC.x1) / 2, (DY + SY - EXC.dia / 2) / 2, 0));
  // turning (barring) gear: small gearbox + motor at the end of the line
  const tgX = S04.turningGearX;
  g.add(box(0.85, 1.15, 0.95, castMat, tgX, DY + 0.85, 0));
  const tgPinion = cyl(0.3, 0.3, 0.95, enamelDark, tgX + 0.15, SY - 0.55, 0, 16);
  g.add(tgPinion);
  const tgMotor = cyl(0.26, 0.26, 0.8, enamelDark, tgX + 0.75, DY + 0.75, 0, 14);
  tgMotor.rotation.z = Math.PI / 2;
  g.add(tgMotor);

  // ---- ground-floor skids: stator water + seal oil ------------------
  const skidMat = new THREE.MeshStandardMaterial({ color: 0xb9bcba, ...SURFACE.powderCoat });
  // stator-water skid: tank + two pumps, demiwater
  g.add(box(2.6, 1.7, 1.3, skidMat, 19.5, 0.85, -10.5));
  g.add(cyl(0.55, 0.55, 1.9, skidMat, 21.6, 0.95, -10.5, 18));
  for (const px of [18.6, 19.9]) {
    g.add(cyl(0.2, 0.24, 0.75, castMat, px, 0.37, -9.4, 12));
    g.add(cyl(0.24, 0.24, 0.4, enamelDark, px, 0.95, -9.4, 12));
  }
  pipeRun([[19.5, 1.75, -10.2], [19.5, 6.5, -10.2], [19.5, 10.6, -6.2], [19.5, 13.8, -3.2]], 0.07, pipeMat, g);
  // seal-oil skid beside it
  g.add(box(2.2, 1.4, 1.2, skidMat, 24.8, 0.7, -10.5));
  g.add(cyl(0.45, 0.45, 1.5, skidMat, 26.4, 0.75, -10.5, 16));
  pipeRun([[24.8, 1.5, -10.2], [24.8, 8.5, -10.2], [24.8, 13.6, -4.2], [24.4, 14.55, -3.2]], 0.055, pipeMat, g);

  // H2 cooler finned boxes under the barrel, in the basement
  for (const hx of [16.8, 21.2]) {
    g.add(box(2.4, 1.6, 3.4, enamelDark, hx, 4.4, 0));
    for (let f = 0; f < 5; f++) g.add(box(2.5, 0.08, 3.5, soleMat, hx, 3.85 + f * 0.28, 0));
  }

  return g;
}
