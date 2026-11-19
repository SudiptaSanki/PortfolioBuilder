// hall.js — the turbine hall building: three column rows (A/B/C)
// making the 36 m AB machine bay and the 12 m BC auxiliary bay,
// clerestory window bands on both long walls, shallow-pitch roof
// trusses with roof-light strips, crane girders on corbels along A
// and B at rail level, the east equipment door, ground floor with
// painted walkways, and the BC bay's receding row of MCC cabinets.
// Bright, pale, daylit — a cathedral built around one machine.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { box, cyl, textPlate, canvasTexture } from './kit.js';

const S04 = STATION04;
const H = S04.hall;

// Profiled-cladding texture (fix loop 1): pale sheet with a regular
// seam rhythm — vertical panel joints + two horizontal rails — so
// the long walls and roof read as built surfaces with a beat, never
// as flat voids. Seams are drawn, not modelled; repeat is set by
// the caller to keep the panel pitch ≈1 m at wall scale.
function claddingTexture(rx, ry, base = '#e8e8e0') {
  const tex = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.20)';
    for (let i = 0; i < 260; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    g.strokeStyle = 'rgba(88,94,90,0.5)'; g.lineWidth = 2;
    for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.strokeStyle = 'rgba(88,94,90,0.38)';
    for (const y of [h / 3, (2 * h) / 3]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = 'rgba(70,76,72,0.55)';
    for (let x = 32; x < w; x += 64) for (const y of [h / 3, (2 * h) / 3]) g.fillRect(x - 2, y - 2, 4, 4); // fixing dots on the rails
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  return tex;
}

export function createHall() {
  const g = new THREE.Group();
  g.name = 's04-hall';

  const clad = new THREE.MeshStandardMaterial({ color: 0xe3e6e1, ...SURFACE.mattePaint });
  const cladIn = new THREE.MeshStandardMaterial({ map: claddingTexture(10, 2), ...SURFACE.mattePaint });
  const colMat = new THREE.MeshStandardMaterial({ color: 0xd2d5cf, ...SURFACE.powderCoat });
  const colBase = new THREE.MeshStandardMaterial({ color: 0x5d6a60, ...SURFACE.powderCoat });
  const steel = new THREE.MeshStandardMaterial({ color: PALETTE.structureGrey, ...SURFACE.galvanised });
  const darkSteel = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, ...SURFACE.brushedSteel });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xc9c5ba, ...SURFACE.concrete });  // lighter warm grey (fix loop 1)
  const walkMat = new THREE.MeshStandardMaterial({ color: 0xa8aba1, ...SURFACE.concrete });

  // ---- ground floor (±0.00) with painted walkways ----------------
  const floor = box(H.x1 - H.x0, 0.1, H.cZ - H.aZ + 6, floorMat, 0, -0.05, (H.aZ + H.cZ) / 2);
  g.add(floor);
  for (const wz of [-9.5, 12.5]) {           // walkways flanking the deck/basement zone
    g.add(box(H.x1 - H.x0 - 4, 0.012, 1.6, walkMat, 0, 0.006, wz));
  }

  // ---- long walls with clerestory bands --------------------------
  // Wall build per side: lower band (0..18), clerestory (18..27,
  // glazed), upper band (27..33). Glazing is one translucent plane
  // with mullion boxes in front — the band reads as continuous glass.
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xd8e8ee, roughness: 0.12, metalness: 0.1,
    transparent: true, opacity: 0.55, emissive: 0xaec6d2, emissiveIntensity: 0.75,
    side: THREE.DoubleSide,
  });
  for (const z of [H.aZ, H.cZ]) {
    g.add(box(H.x1 - H.x0, H.clerestoryY0, 0.25, cladIn, 0, H.clerestoryY0 / 2, z));
    g.add(box(H.x1 - H.x0, H.eavesY - H.clerestoryY1, 0.25, cladIn, 0, (H.eavesY + H.clerestoryY1) / 2, z));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(H.x1 - H.x0, H.clerestoryY1 - H.clerestoryY0), glassMat);
    glass.position.set(0, (H.clerestoryY0 + H.clerestoryY1) / 2, z);
    g.add(glass);
    for (let x = H.x0; x <= H.x1 + 0.1; x += 4.2) {
      g.add(box(0.18, H.clerestoryY1 - H.clerestoryY0, 0.3, steel, x, (H.clerestoryY0 + H.clerestoryY1) / 2, z));
    }
    g.add(box(H.x1 - H.x0, 0.22, 0.3, steel, 0, H.clerestoryY0, z));
    g.add(box(H.x1 - H.x0, 0.22, 0.3, steel, 0, H.clerestoryY1, z));
  }

  // ---- end walls + east equipment door (8 × 8 m roller shutter) --
  for (const x of [H.x0, H.x1]) {
    g.add(box(0.25, H.eavesY, H.cZ - H.aZ, cladIn, x, H.eavesY / 2, (H.aZ + H.cZ) / 2));
  }
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x9aa39d, ...SURFACE.galvanised });
  const door = box(0.18, 8, 8, doorMat, H.x1 - 0.2, 4, 0);
  g.add(door);
  for (let i = 0; i < 8; i++) g.add(box(0.05, 0.09, 8, darkSteel, H.x1 - 0.32, 0.6 + i * 1.0, 0));

  // ---- column rows A / B / C at 8.4 m pitch ----------------------
  for (const z of [H.aZ, H.bZ, H.cZ]) {
    for (let x = H.x0 + 4.2; x < H.x1; x += H.bayPitch) {
      g.add(box(0.9, 3, 0.9, colBase, x, 1.5, z));
      g.add(box(0.85, H.eavesY - 3, 0.85, colMat, x, 3 + (H.eavesY - 3) / 2, z));
    }
  }

  // ---- crane girders + rails on A and B corbels (≈ +29.6 m) ------
  for (const z of [H.aZ, H.bZ]) {
    g.add(box(H.x1 - H.x0, 1.5, 0.55, steel, 0, H.craneRailY - 0.85, z));
    g.add(box(H.x1 - H.x0, 0.18, 0.14, darkSteel, 0, H.craneRailY + 0.02, z));
    for (let x = H.x0 + 4.2; x < H.x1; x += H.bayPitch) {
      g.add(box(1.4, 0.5, 0.8, steel, x, H.craneRailY - 1.85, z));  // corbels
    }
    // end stops
    g.add(box(0.5, 0.9, 0.6, darkSteel, H.x0 + 0.6, H.craneRailY + 0.4, z));
    g.add(box(0.5, 0.9, 0.6, darkSteel, H.x1 - 0.6, H.craneRailY + 0.4, z));
  }

  // ---- roof trusses + roof-light strips --------------------------
  const trussMat = steel;
  for (let x = H.x0 + 4.2; x < H.x1; x += H.bayPitch) {
    const span = H.cZ - H.aZ;
    const zc = (H.aZ + H.cZ) / 2;
    g.add(box(0.22, 0.3, span, trussMat, x, H.eavesY + 0.15, zc));               // bottom chord
    const chordL = box(0.22, 0.26, span / 2 + 0.6, trussMat, x, H.eavesY + 1.45, H.aZ + span / 4);
    chordL.rotation.x = Math.atan2(2.6, span / 2) * 0.92;
    g.add(chordL);
    const chordR = box(0.22, 0.26, span / 2 + 0.6, trussMat, x, H.eavesY + 1.45, H.cZ - span / 4);
    chordR.rotation.x = -Math.atan2(2.6, span / 2) * 0.92;
    g.add(chordR);
    for (let i = 1; i < 8; i++) {                                                // verticals
      const z = H.aZ + (span * i) / 8;
      const topY = H.eavesY + 2.9 - Math.abs(i - 4) * 0.62;
      g.add(box(0.14, topY - H.eavesY, 0.14, trussMat, x, (H.eavesY + topY) / 2, z));
    }
  }
  // roof planes carry the cladding seam rhythm plus a gentle
  // emissive lift (fix loop 1) — the ceiling must read as pale
  // structure + light, never as a black void over the trusses.
  const roofMat = new THREE.MeshStandardMaterial({
    map: claddingTexture(14, 4, '#e2e4de'), emissive: 0xaeb6ba, emissiveIntensity: 0.22,
    ...SURFACE.mattePaint, side: THREE.DoubleSide,
  });
  for (const [zc, rot] of [[H.aZ + 12, 0.055], [H.cZ - 12, -0.055]]) {
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(H.x1 - H.x0, 25.5), roofMat);
    roof.rotation.x = -Math.PI / 2 + rot;
    roof.position.set(0, H.eavesY + 3.1, zc);
    g.add(roof);
  }
  const skyMat = new THREE.MeshStandardMaterial({
    color: 0xe8f2f8, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.8,
    emissive: 0xcfe2ee, emissiveIntensity: 1.0, side: THREE.DoubleSide,
  });
  for (const zc of [-6, 6, 18]) {              // roof-light strips over the machine bay
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(H.x1 - H.x0 - 6, 3.2), skyMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, H.eavesY + 3.35, zc);
    g.add(strip);
  }

  // ---- BC bay: MCC / cabinet row along the north wall ------------
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xb9bcba, ...SURFACE.powderCoat });
  const cabDark = new THREE.MeshStandardMaterial({ color: 0x2c3136, roughness: 0.35, metalness: 0.2 });
  for (let i = 0; i < 9; i++) {
    const x = -34 + i * 8.4;
    g.add(box(1.6, 2.2, 0.7, cabMat, x, 1.1, H.cZ - 1.1));
    g.add(box(1.2, 0.5, 0.03, cabDark, x, 1.75, H.cZ - 1.48));
    for (let d = 0; d < 3; d++) {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.028, 10),
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: d === 0 ? PALETTE.ledGreen : PALETTE.ledAmber, emissiveIntensity: 1.6 }));
      dot.position.set(x - 0.4 + d * 0.35, 1.35, H.cZ - 1.47);
      dot.rotation.y = Math.PI;
      g.add(dot);
    }
  }
  // cable tray overhead in the BC bay, running the hall's length
  g.add(box(H.x1 - H.x0 - 6, 0.08, 0.45, steel, 0, 3.1, H.cZ - 2.2));

  // ---- caged stairs, ground → deck (two, yellow handrails) -------
  const yel = new THREE.MeshStandardMaterial({ color: PALETTE.safetyYellow, ...SURFACE.powderCoat });
  for (const sx of [-31.5, 20]) {
    const stair = new THREE.Group();
    const run = box(0.18, 0.18, 15.5, steel, 0, 7, 0);
    run.rotation.x = Math.atan2(14, 15.5) * 0.98;
    stair.add(run);
    for (let i = 0; i < 9; i++) {
      stair.add(box(1.1, 0.07, 0.28, darkSteel, 0, 0.8 + i * 1.62, -6.8 + i * 1.7));
    }
    for (const side of [-0.55, 0.55]) {
      const rail = cyl(0.025, 0.025, 20.5, yel, side, 7.6, 0, 8);
      rail.rotation.x = Math.atan2(14, 15.5) * 0.98 - 0.06;
      stair.add(rail);
    }
    stair.position.set(sx, 0, -10.5);
    g.add(stair);
  }

  // ---- hall name plate over the west door -------------------------
  const plate = textPlate(7.5, 0.95, [
    { text: 'TURBINE HALL · UNIT 5', px: 120 },
    { text: '660 MW · 3000 RPM · TANDEM COMPOUND', px: 74, weight: 400 },
  ], { bg: '#274b63', ink: '#f2f5f6' });
  plate.position.set(H.x0 + 0.35, 24, 6);
  plate.rotation.y = Math.PI / 2;
  g.add(plate);

  return g;
}
