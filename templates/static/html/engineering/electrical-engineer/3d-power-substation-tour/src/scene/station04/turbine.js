// turbine.js — the steam path of the train: front standard, HP and
// IP cylinders in seamed aluminium lagging, the two great crossover
// pipes, the two boxy LP hoods, and the twelve bearing pedestals
// N1–N12 that interrupt the shaft line. The train is a sequence of
// visibly different machines, never a torpedo on a box.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { box, cyl, pipeRun, canvasTexture } from './kit.js';

const S04 = STATION04;
const SY = S04.shaft.y;      // 18.6
const DY = S04.deck.topY;    // 14

// Lagging: aluminium panels with seams and banding straps, drawn once
// and wrapped around the HP/IP barrels.
function laggingTexture() {
  return canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#c8cbcc'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,76,80,0.55)'; g.lineWidth = 2;
    for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = 'rgba(90,96,100,0.8)';
    for (const y of [30, 226]) g.fillRect(0, y, w, 7);           // banding straps
    g.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 500; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  });
}

function barrel(len, dia, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(dia / 2, dia / 2, len, 36), mat);
  m.rotation.z = Math.PI / 2;
  return m;
}

export function createTurbine() {
  const g = new THREE.Group();
  g.name = 's04-turbine';

  const lagTex = laggingTexture();
  lagTex.wrapS = lagTex.wrapT = THREE.RepeatWrapping;
  const lagMat = new THREE.MeshStandardMaterial({ map: lagTex, roughness: 0.5, metalness: 0.65 });
  const lagPlain = new THREE.MeshStandardMaterial({ color: 0xc4c7c8, roughness: 0.5, metalness: 0.6 });
  const castMat = new THREE.MeshStandardMaterial({ color: 0x4d554e, ...SURFACE.powderCoat });  // dark machinery green-grey
  const soleMat = new THREE.MeshStandardMaterial({ color: PALETTE.darkSteel, ...SURFACE.brushedSteel });
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0xd7dade, ...SURFACE.brushedSteel });
  const guardMat = new THREE.MeshStandardMaterial({ color: PALETTE.safetyYellow, ...SURFACE.powderCoat });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xb9bcba, roughness: 0.45, metalness: 0.6 });
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x9aa294, ...SURFACE.powderCoat });
  const hoodDark = new THREE.MeshStandardMaterial({ color: 0x767d72, ...SURFACE.powderCoat });

  const barrelAt = (spec, mat) => {
    const b = barrel(spec.x1 - spec.x0, spec.dia, mat);
    b.position.set((spec.x0 + spec.x1) / 2, SY, 0);
    g.add(b);
    // support feet down to the deck
    for (const fx of [spec.x0 + 0.9, spec.x1 - 0.9]) {
      g.add(box(0.7, SY - spec.dia / 2 - DY + 0.4, 1.6, castMat, fx, (DY + SY - spec.dia / 2) / 2, 0));
    }
    // horizontal joint flange: thickened waist + stud row
    const cx = (spec.x0 + spec.x1) / 2;
    const fl = new THREE.Mesh(new THREE.TorusGeometry(spec.dia / 2 + 0.03, 0.055, 8, 40), lagPlain);
    fl.rotation.y = Math.PI / 2;
    fl.position.set(cx, SY, 0);
    g.add(fl);
    return b;
  };

  // ---- front standard (governor end) ------------------------------
  const fsX = S04.frontStandard.x;
  g.add(box(2.4, 0.35, 2.6, soleMat, fsX, DY + 0.17, 0));
  g.add(box(1.9, 2.5, 1.7, castMat, fsX, DY + 1.6, 0));
  const fsDome = cyl(0.85, 0.85, 1.9, castMat, fsX, DY + 2.85, 0, 20);
  fsDome.rotation.z = Math.PI / 2;
  g.add(fsDome);
  g.add(cyl(0.16, 0.16, 0.9, soleMat, fsX - 0.6, DY + 3.6, 0.4, 12));       // overspeed trip housing
  g.add(cyl(0.3, 0.3, 0.7, castMat, fsX + 0.5, DY + 3.35, -0.45, 14));      // main oil pump casing
  g.add(box(0.5, 0.8, 0.5, lagPlain, fsX - 1.15, DY + 0.75, 0));            // turning-gear engagement box

  // ---- HP cylinder + valve cluster --------------------------------
  barrelAt(S04.hp, lagMat);
  for (const fx of [S04.hp.x0 + 0.25, S04.hp.x1 - 0.25]) {                 // end rings
    const ring = new THREE.Mesh(new THREE.TorusGeometry(S04.hp.dia / 2 + 0.02, 0.05, 8, 36), lagPlain);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(fx, SY, 0);
    g.add(ring);
  }
  g.add(box(0.34, 0.3, 0.2, soleMat, (S04.hp.x0 + S04.hp.x1) / 2, SY + S04.hp.dia / 2 + 0.12, 0)); // lifting lug
  // main steam lines arrive from the BC-bay (north) side at deck level
  const steamMat = lagPlain;
  for (const sx of [-24.6, -22.2]) {
    pipeRun([[sx, 15.6, 12.5], [sx, 15.6, 3.1], [sx, 16.4, 2.45]], 0.23, steamMat, g);
    // ESV chest: vertical bonnet + servo cylinder on top
    g.add(cyl(0.34, 0.38, 1.5, castMat, sx, DY + 0.95, 2.3, 16));
    g.add(cyl(0.09, 0.09, 0.8, soleMat, sx, DY + 2.05, 2.3, 10));
    g.add(cyl(0.2, 0.2, 0.5, soleMat, sx, DY + 2.6, 2.3, 12));
    pipeRun([[sx, 16.2, 2.3], [sx, 17.4, 1.2], [sx, 17.6, 0.4]], 0.17, steamMat, g);
  }
  for (let i = 0; i < 4; i++) {                                            // 4 governing valves along the HP north side
    const vx = -25.9 + i * 1.55;
    g.add(cyl(0.2, 0.23, 0.95, castMat, vx, DY + 0.65, 1.95, 12));
    g.add(cyl(0.06, 0.06, 0.55, soleMat, vx, DY + 1.4, 1.95, 8));
    g.add(cyl(0.13, 0.13, 0.34, soleMat, vx, DY + 1.8, 1.95, 10));
  }
  // casing drains drop to the deck
  for (const dx of [-25.5, -21.8]) pipeRun([[dx, SY - 1.5, 1.1], [dx, DY + 0.25, 1.1]], 0.06, pipeMat, g);

  // ---- IP cylinder + centre admission ------------------------------
  barrelAt(S04.ip, lagMat);
  g.add(box(0.34, 0.3, 0.2, soleMat, (S04.ip.x0 + S04.ip.x1) / 2, SY + S04.ip.dia / 2 + 0.12, 0));
  for (const side of [-1, 1]) {
    // hot reheat lines rise from below deck to the IP centre chests
    pipeRun([[-13.45, 10.8, side * 3.1], [-13.45, 15.8, side * 3.1], [-13.45, 17.2, side * 2.2], [-13.45, 17.8, side * 1.4]], 0.3, steamMat, g);
    g.add(cyl(0.36, 0.4, 1.4, castMat, -13.45, DY + 0.9, side * 2.55, 16));   // interceptor chest
    g.add(cyl(0.09, 0.09, 0.7, soleMat, -13.45, DY + 1.95, side * 2.55, 10));
  }

  // ---- crossover pipes: IP ends arc over into the LP tops ---------
  const crossMat = lagPlain;
  const crossover = (xFrom, xTo) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xFrom, SY + 1.6, 0),
      new THREE.Vector3(xFrom + 0.4, SY + 4.4, 0),
      new THREE.Vector3((xFrom + xTo) / 2, SY + 5.6, 0),
      new THREE.Vector3(xTo - 0.4, SY + 4.4, 0),
      new THREE.Vector3(xTo, S04.lpHood.topY - 0.6, 0),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.75, 18), crossMat);
    g.add(tube);
    for (const bx of [xFrom + 0.4, xTo - 0.4]) {                            // banding straps on the arc
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.77, 0.04, 8, 24), soleMat);
      band.position.set(bx, SY + 4.35, 0);
      band.rotation.x = 0.5;
      g.add(band);
    }
  };
  crossover(-16.6, -6.0);
  crossover(-10.3, 4.8);

  // ---- LP hoods (×2) ------------------------------------------------
  for (const lp of S04.lp) {
    const cx = (lp.x0 + lp.x1) / 2, w = lp.x1 - lp.x0;
    g.add(box(w + 0.5, 0.4, S04.lpHood.halfZ * 2 + 0.5, soleMat, cx, DY + 0.2, 0));
    g.add(box(w, S04.lpHood.topY - DY - 1.1, S04.lpHood.halfZ * 2, hoodMat, cx, (DY + S04.lpHood.topY - 1.1) / 2 + 0.55, 0));
    // shallow barrel-vault roof: a full cylinder squashed flat, its
    // lower half sunk into the hood box (local X maps to world Y
    // under rotation.z = PI/2, so scale.x is the vertical squash)
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(S04.lpHood.halfZ, S04.lpHood.halfZ, w, 24), hoodMat);
    roof.rotation.z = Math.PI / 2;
    roof.scale.set(0.24, 1, 1);
    roof.position.set(cx, S04.lpHood.topY - 1.1, 0);
    g.add(roof);
    // inspection doors with dog handles on both side walls
    for (const side of [-1, 1]) {
      for (const dx of [-2.2, 1.8]) {
        g.add(box(1.5, 2.1, 0.08, hoodDark, cx + dx, DY + 2.2, side * (S04.lpHood.halfZ + 0.03)));
        for (const hy of [-0.6, 0.6]) {
          g.add(box(0.3, 0.07, 0.1, soleMat, cx + dx + 0.55, DY + 2.2 + hy, side * (S04.lpHood.halfZ + 0.08)));
        }
      }
    }
    // rupture diaphragms: flat circular plates on the roof
    for (const dx of [-2.6, 0, 2.6]) {
      const d = cyl(0.55, 0.55, 0.09, hoodDark, cx + dx, S04.lpHood.topY + 0.28, 0, 20);
      g.add(d);
    }
    g.add(box(w - 1, 0.22, 0.3, soleMat, cx, S04.lpHood.topY + 0.45, 0));   // lifting beam
  }

  // ---- bearings N1–N12 ----------------------------------------------
  const thrust = 2; // index of N3
  S04.bearingsX.forEach((bx, i) => {
    const wide = i === thrust ? 1.8 : 1.15;
    g.add(box(wide + 0.5, 0.3, 2.7, soleMat, bx, DY + 0.15, 0));             // soleplate
    g.add(box(wide, SY - DY - 0.85, 2.3, castMat, bx, DY + (SY - DY - 0.85) / 2 + 0.3, 0));
    const cap = cyl(0.78, 0.78, wide, castMat, bx, SY - 0.72, 0, 20);        // domed cap
    cap.rotation.z = Math.PI / 2;
    g.add(cap);
    g.add(box(wide + 0.06, 0.14, 2.36, soleMat, bx, SY - 0.78, 0));          // joint flange
    // emergency gravity oil tank on the cap (largest at N3)
    const tankS = i === thrust ? 0.62 : 0.4;
    g.add(box(tankS + 0.25, tankS * 0.7, tankS + 0.25, lagPlain, bx, SY + 0.32, 0.95));
    g.add(cyl(0.05, 0.05, 0.5, soleMat, bx + wide / 2 - 0.1, SY + 0.1, -0.9, 8)); // vibration probe housing
  });

  // ---- shaft stubs + coupling guards in the gaps -------------------
  const spans = [
    [S04.frontStandard.x + 1.0, S04.hp.x0], [S04.hp.x1, S04.ip.x0],
    [S04.ip.x1, S04.lp[0].x0], [S04.lp[0].x1, S04.lp[1].x0], [S04.lp[1].x1, S04.generator.x0],
    [S04.generator.x1, S04.exciter.x0], [S04.exciter.x1, S04.turningGearX],
  ];
  for (const [a, b] of spans) {
    if (b - a < 0.3) continue;
    const shaft = cyl(0.4, 0.4, b - a, shaftMat, (a + b) / 2, SY, 0, 18);
    shaft.rotation.z = Math.PI / 2;
    g.add(shaft);
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, Math.min(b - a - 0.2, 1.1), 14, 1, true), guardMat);
    guard.rotation.z = Math.PI / 2;
    guard.position.set((a + b) / 2, SY, 0);
    g.add(guard);
  }

  // ---- lube-oil header along the train's south side ----------------
  const oilMat = new THREE.MeshStandardMaterial({ color: 0xb59a5e, roughness: 0.55, metalness: 0.3 }); // muted buff ochre
  pipeRun([[-27.8, DY + 0.62, -3.6], [28.6, DY + 0.62, -3.6]], 0.09, oilMat, g);   // supply
  pipeRun([[-27.8, DY + 0.38, -3.85], [28.6, DY + 0.38, -3.85]], 0.13, oilMat, g); // drain (larger)
  for (const bx of S04.bearingsX) {
    pipeRun([[bx, DY + 0.62, -3.6], [bx, DY + 0.62, -1.35], [bx, DY + 1.1, -1.25]], 0.05, oilMat, g);
  }
  // riser from the ground-floor skid (oilSkid.js) up the deck's south edge
  pipeRun([[-24, 3.4, -7.4], [-24, DY + 0.62, -7.4], [-24, DY + 0.62, -3.6]], 0.11, oilMat, g);

  return g;
}
