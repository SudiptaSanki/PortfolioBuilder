// crane.js — the two EOT cranes that share the hall's rails. Each is
// a double-girder bridge spanning the 36 m AB bay: end carriages,
// a crab with 200 t main + 20 t auxiliary hoists, wire-rope falls to
// a 2 m hook block, festoon cables, an operator cabin — and the
// non-negotiable detail, the capacity in large stencilled numerals
// on both girder faces. In tandem the pair lifts the ≈360 t stator.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { box, cyl, canvasTexture, fitFont } from './kit.js';

const S04 = STATION04;
const CR = S04.crane;

// Girder side texture: yellow with the big "200 t" stencil, an
// "SWL 200 t · AUX 20 t" line and hazard chevrons at the ends.
// Text is measured and shrunk to fit (SCAFFOLD rule 1).
function girderTexture() {
  return canvasTexture(2048, 128, (g, w, h) => {
    g.fillStyle = '#e3a008'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c2126';
    for (const ex of [0, w - 110]) {                       // chevrons
      for (let i = 0; i < 4; i++) {
        g.save();
        g.translate(ex + i * 28, 0);
        g.beginPath();
        g.moveTo(0, h); g.lineTo(28, 0); g.lineTo(48, 0); g.lineTo(20, h);
        g.fill();
        g.restore();
      }
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fitFont(g, '200 t', 700, 'Arial, sans-serif', 104, w * 0.24);
    g.fillStyle = '#14171a';
    g.fillText('200 t', w * 0.36, h / 2);
    fitFont(g, 'SWL 200 t · AUX 20 t', 700, 'Arial, sans-serif', 44, w * 0.3);
    g.fillText('SWL 200 t · AUX 20 t', w * 0.66, h / 2);
  });
}

function createCrane(px, crabZ) {
  const g = new THREE.Group();
  g.name = 's04-crane';
  const yel = new THREE.MeshStandardMaterial({ color: PALETTE.safetyYellow, ...SURFACE.powderCoat });
  const girderMat = new THREE.MeshStandardMaterial({ map: girderTexture(), roughness: 0.55, metalness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, ...SURFACE.brushedSteel });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.6, metalness: 0.5 });
  const span = CR.span;

  // two girders (along z), 3.2 m apart, with plain yellow caps
  for (const gx of [-1.6, 1.6]) {
    // box material order is [+x,-x,+y,-y,+z,-z]: the long ±x faces
    // carry the capacity texture, everything else plain yellow
    const girder = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.7, span), [
      girderMat, girderMat, yel, yel, yel, yel,
    ]);
    girder.position.set(gx, 0, 0);
    g.add(girder);
    // bridge-top walkway + handrail
    g.add(box(0.7, 0.06, span, dark, gx + (gx < 0 ? -0.65 : 0.65), 0.88, 0));
  }
  g.add(box(4.3, 0.35, span, yel, 0, 0.95, 0));            // top deck plate between girders
  // end carriages + travel wheels + chevron ends
  for (const ez of [-span / 2, span / 2]) {
    g.add(box(4.4, 0.9, 1.1, yel, 0, -0.6, ez));
    for (const wx of [-1.5, 1.5]) {
      const wheel = cyl(0.34, 0.34, 0.18, dark, wx, -1.25, ez, 16);
      wheel.rotation.x = Math.PI / 2;
      g.add(wheel);
    }
  }
  // crab: machinery house on rails across the girders
  const crab = new THREE.Group();
  crab.add(box(3.4, 1.1, 2.6, yel, 0, 1.65, 0));
  const drum = cyl(0.55, 0.55, 2.2, dark, -0.8, 1.5, 0, 18);
  drum.rotation.x = Math.PI / 2;
  crab.add(drum);
  crab.add(box(0.9, 0.8, 0.9, dark, 1.1, 1.55, 0.5));      // main hoist motor
  const auxDrum = cyl(0.3, 0.3, 1.1, dark, 1.1, 1.5, -0.7, 12);
  auxDrum.rotation.x = Math.PI / 2;
  crab.add(auxDrum);
  crab.position.set(0, 0, crabZ);
  g.add(crab);
  // wire-rope falls (4) from crab to hook block, hook raised high
  const hookY = -4.6;
  for (const [rx, rz] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) {
    const rope = cyl(0.022, 0.022, Math.abs(hookY) - 0.9, ropeMat, rx, hookY / 2 + 0.55, crabZ + rz, 6);
    g.add(rope);
  }
  // hook block: sheave housing + swivel hook
  const block = new THREE.Group();
  block.add(box(0.75, 1.5, 0.45, yel, 0, 0, 0));
  block.add(box(0.8, 0.3, 0.5, dark, 0, 0.85, 0));
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.075, 8, 18, Math.PI * 1.45), dark);
  hook.position.set(0, -1.05, 0);
  hook.rotation.z = Math.PI * 0.78;
  block.add(hook);
  block.position.set(0, hookY, crabZ);
  g.add(block);
  // operator cabin slung under the bridge's south end
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xd8d5c9, ...SURFACE.powderCoat });
  const cabGlass = new THREE.MeshStandardMaterial({ color: 0x33454f, roughness: 0.15, metalness: 0.3 });
  const cabin = new THREE.Group();
  cabin.add(box(1.7, 2.0, 1.5, cabMat, 0, 0, 0));
  cabin.add(box(1.74, 0.8, 1.54, cabGlass, 0, -0.35, 0));
  cabin.position.set(1.9, -2.1, -span / 2 + 2.2);
  g.add(cabin);
  // festoon power cables looping along the south girder
  for (let i = 0; i < 7; i++) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 6, 16, Math.PI), ropeMat);
    loop.position.set(-2.05, -0.6, -span / 2 + 3.5 + i * 3.6);
    loop.rotation.y = Math.PI / 2;
    loop.rotation.z = Math.PI;
    g.add(loop);
  }

  g.position.set(px, CR.y, 0);
  return g;
}

export function createCranes() {
  const g = new THREE.Group();
  g.name = 's04-cranes';
  g.add(createCrane(CR.parkedX[0], 2.5));    // east crane, over the laydown bay
  g.add(createCrane(CR.parkedX[1], -3));     // west crane, parked at the far end
  return g;
}
