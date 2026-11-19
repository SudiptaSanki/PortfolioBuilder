// buildings.js — the load itself (inventory §4.7): the 48-flat
// apartment block whose AC units ARE the evening peak, the shop row
// with its tea stall, the houses, and the corner block that carries
// the load-curve wall. Windows are individuals — ~60% lit, varied
// warmth and intensity, some curtained, one television — assigned by
// a seeded RNG so the pattern is stable between renders.

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';
import { box, cyl, mat, textPlate, createWindowField, lampGlow } from './helpers.js';

const S06 = STATION06;
const P06 = S06.palette;

// deterministic RNG (mulberry32) — same windows lit on every load
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One window's night state. Returns null for a plain dark window
// (still drawn, as a faint blue-grey quad, so the grid reads).
function windowState(rand) {
  const r = rand();
  if (r < 0.40) return null;                                   // dark
  if (r < 0.72) return { color: P06.windowWarm, bright: 0.75 + rand() * 0.45 };
  if (r < 0.84) return { color: P06.windowCool, bright: 0.7 + rand() * 0.4 };
  if (r < 0.94) return { color: P06.curtain, bright: 0.8 + rand() * 0.3 };  // curtained
  return { color: P06.tvBlue, bright: 0.85 };                  // television
}

function plasterTexture(base, streak) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(60,55,48,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  g.fillStyle = streak;                                       // water streaks
  for (let i = 0; i < 9; i++) {
    const x = Math.random() * 256;
    g.fillRect(x, 0, 3 + Math.random() * 5, 90 + Math.random() * 160);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createBuildings() {
  const group = new THREE.Group();
  group.name = 's06-buildings';
  const windows = [];
  const rand = rng(20261119);
  const plaster = new THREE.MeshStandardMaterial({
    map: plasterTexture('#8f8a80', 'rgba(52,50,46,0.20)'), roughness: 0.92, metalness: 0 });
  const plasterDark = new THREE.MeshStandardMaterial({
    map: plasterTexture('#6e6a62', 'rgba(40,38,35,0.25)'), roughness: 0.92, metalness: 0 });

  // ------------------------------------------------ apartment block --
  const A = S06.apartment;
  const aW = A.x1 - A.x0, aD = A.frontZ - A.backZ, aH = A.floors * A.floorH;
  const apt = box(aW, aH, aD, plaster, (A.x0 + A.x1) / 2, aH / 2, (A.frontZ + A.backZ) / 2);
  group.add(apt);
  // window grid on the street face: 8 bays × 6 floors
  for (let f = 0; f < A.floors; f++) {
    for (let b = 0; b < 8; b++) {
      const x = A.x0 + 1.7 + b * 2.95;
      const y = f * A.floorH + 1.95;
      const st = windowState(rand);
      windows.push({
        x, y, z: A.frontZ + 0.03, w: 1.35, h: 1.45, rotY: 0,
        color: st ? st.color : 0x141c28, bright: st ? st.bright : 0.6,
      });
      // balcony on alternate bays: slab + railing + a door spill
      if (b % 2 === 0) {
        group.add(box(2.3, 0.12, 0.85, mat.concreteDark(), x, f * A.floorH + 1.12, A.frontZ + 0.45));
        const rail = box(2.3, 0.75, 0.05, mat.darkSteel(), x, f * A.floorH + 1.55, A.frontZ + 0.86);
        group.add(rail);
        if (st) windows.push({                              // door light spill
          x: x + 0.55, y: f * A.floorH + 1.62, z: A.frontZ + 0.82, w: 0.7, h: 1.0, rotY: 0,
          color: st.color, bright: st.bright * 0.5,
        });
      }
      // AC outdoor unit under ~40% of windows — they ARE the peak
      if (rand() < 0.42) {
        const ac = box(0.8, 0.6, 0.28, mat.std(0x9aa0a4, 'powderCoat'), x + 0.4, y - 1.25, A.frontZ + 0.16);
        group.add(ac);
        const grille = cyl(0.21, 0.21, 0.03, mat.darkSteel(), x + 0.4, y - 1.25, A.frontZ + 0.31, 16);
        grille.rotation.x = Math.PI / 2;
        group.add(grille);
      }
    }
  }
  // east side face windows (a few, for the overview's angle)
  for (let f = 0; f < A.floors; f++) for (let b = 0; b < 3; b++) {
    const st = windowState(rand);
    windows.push({
      x: A.x1 + 0.03, y: f * A.floorH + 1.95, z: A.frontZ - 2.2 - b * 3.2,
      w: 1.3, h: 1.4, rotY: Math.PI / 2,
      color: st ? st.color : 0x141c28, bright: st ? st.bright : 0.6,
    });
  }
  // rooftop: two black water tanks, lift room, dishes, clothes line
  const roofY = aH;
  const tankMat = mat.std(0x1e2124, 'powderCoat');
  group.add(cyl(1.05, 1.05, 1.5, tankMat, A.x0 + 4.5, roofY + 0.75, A.backZ + 3, 18));
  group.add(cyl(1.05, 1.05, 1.5, tankMat, A.x0 + 7.6, roofY + 0.75, A.backZ + 3.4, 18));
  group.add(box(3.4, 2.3, 3, plasterDark, A.x1 - 3.4, roofY + 1.15, A.backZ + 3));
  for (const dx of [9, 14.5, 19]) {                           // dish antennas
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 6, 0, Math.PI * 2, 0, 0.9),
      mat.std(0xb9bcbe, 'powderCoat'));
    dish.position.set(A.x0 + dx, roofY + 0.75, A.frontZ - 1.6);
    dish.rotation.x = -0.9;
    group.add(dish);
    group.add(cyl(0.03, 0.03, 0.75, mat.darkSteel(), A.x0 + dx, roofY + 0.37, A.frontZ - 1.6, 6));
  }
  const lineMat = mat.darkSteel();                            // clothes line + washing
  group.add(box(5.5, 0.03, 0.03, lineMat, A.x0 + 12, roofY + 1.5, A.backZ + 6));
  const clothCols = [0x7a4a3a, 0x4a5d7a, 0x8a8578];
  clothCols.forEach((cc, i) => {
    group.add(box(0.85, 1.05, 0.03, mat.std(cc, 'mattePaint'), A.x0 + 10.2 + i * 1.15, roofY + 0.95, A.backZ + 6));
  });
  // the block's name plate (48 flats — the inventory's count)
  const aptPlate = textPlate(2.6, 0.5, [
    { text: 'SHANTI APARTMENTS · 48 FLATS', size: 58, color: '#d8d2c2' },
  ], { px: [1024, 192], bg: '#2e3134', emissive: 0.3 });
  aptPlate.position.set((A.x0 + A.x1) / 2, 3.4, A.frontZ + 0.06);
  group.add(aptPlate);

  // ------------------------------------------------------ shop row --
  const SH = S06.shops;
  group.add(box(SH.x1 - SH.x0, SH.h, 6, plasterDark, (SH.x0 + SH.x1) / 2, SH.h / 2, SH.frontZ + 3));
  group.add(box(SH.x1 - SH.x0 + 0.6, 0.35, 6.6, mat.concreteDark(), (SH.x0 + SH.x1) / 2, SH.h + 0.17, SH.frontZ + 3));
  const shopNames = [
    { name: 'SHARMA STORES', col: '#31517a', open: true },
    { name: 'HOTEL AASHIRWAD', col: '#7a3b2a', open: true },
    { name: 'CITY MEDICALS', col: '#2a5d50', open: true },
    { name: 'ELECTRO WORLD', col: '#54477a', open: false },
    { name: 'FRESH BAKERY', col: '#7a6228', open: true },
    { name: 'MOBILE POINT', col: '#28557a', open: false },
  ];
  const flickerMats = [];
  shopNames.forEach((shop, i) => {
    const x = SH.x0 + 3 + i * 6;
    const sign = textPlate(4.6, 0.8, [{ text: shop.name, size: 84, color: '#f2ead8' }],
      { px: [1024, 192], bg: shop.col, emissive: 0.55 });
    sign.position.set(x, 3.55, SH.frontZ - 0.06);
    sign.rotation.y = Math.PI;
    group.add(sign);
    if (shop.open) {
      // warm interior behind glass + spill pool on the footpath
      windows.push({ x, y: 1.55, z: SH.frontZ - 0.04, w: 4.4, h: 2.5, rotY: Math.PI, color: P06.windowWarm, bright: 0.95 });
      const spill = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.6),
        new THREE.MeshBasicMaterial({ color: 0xffc98a, transparent: true, opacity: 0.10, depthWrite: false }));
      spill.rotation.x = -Math.PI / 2;
      spill.position.set(x, 0.14, SH.frontZ - 1.3);
      group.add(spill);
      if (i === 1) {                                          // restaurant steam vent
        group.add(cyl(0.09, 0.09, 1.1, mat.galv(), x + 1.8, SH.h + 0.55, SH.frontZ + 1.2, 10));
      }
    } else {
      // roller shutter: horizontal slats, closed for the night
      const shutter = box(4.4, 2.7, 0.08, mat.std(0x6d7276, 'galvanised'), x, 1.45, SH.frontZ - 0.02);
      group.add(shutter);
      for (let s = 0; s < 7; s++) {
        group.add(box(4.4, 0.045, 0.03, mat.darkSteel(), x, 0.35 + s * 0.37, SH.frontZ - 0.07));
      }
    }
  });
  // one flickering tube sign above the bakery (registered for update)
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xcfe4ff });
  const tube = box(2.2, 0.09, 0.09, tubeMat, SH.x0 + 3 + 4 * 6, 4.45, SH.frontZ - 0.3);
  group.add(tube);
  flickerMats.push(tubeMat);
  group.userData.flickerMats = flickerMats;

  // -------------------------------------------------- corner block --
  const C = S06.cornerBlock;
  const cH = C.floors * C.floorH;
  group.add(box(C.x1 - C.x0, cH, C.backZ - C.frontZ, plaster,
    (C.x0 + C.x1) / 2, cH / 2, (C.frontZ + C.backZ) / 2));
  for (let f = 1; f < C.floors; f++) {                        // street face, above the wall
    for (let b = 0; b < 6; b++) {
      const st = windowState(rand);
      windows.push({
        x: C.x0 + 2.2 + b * 3.1, y: f * C.floorH + 1.95, z: C.frontZ - 0.03,
        w: 1.3, h: 1.4, rotY: Math.PI,
        color: st ? st.color : 0x141c28, bright: st ? st.bright : 0.6,
      });
    }
  }
  for (let f = 0; f < C.floors; f++) {                        // west flank
    for (let b = 0; b < 4; b++) {
      const st = windowState(rand);
      windows.push({
        x: C.x0 - 0.03, y: f * C.floorH + 1.95, z: C.frontZ + 2.4 + b * 3.4,
        w: 1.3, h: 1.4, rotY: -Math.PI / 2,
        color: st ? st.color : 0x141c28, bright: st ? st.bright : 0.6,
      });
    }
  }
  group.add(cyl(0.95, 0.95, 1.4, tankMat, C.x1 - 4, cH + 0.7, C.backZ - 3, 16));

  // -------------------------------------------------------- houses --
  const houseDefs = [
    { x: -1, w: 8, floors: 2, tint: '#7d7668' },
    { x: 9, w: 9, floors: 3, tint: '#877d6a' },
    { x: 19, w: 8, floors: 2, tint: '#756c60' },
  ];
  for (const hd of houseDefs) {
    const hH = hd.floors * 3.05;
    const hMat = new THREE.MeshStandardMaterial({
      map: plasterTexture(hd.tint, 'rgba(50,48,44,0.18)'), roughness: 0.92 });
    group.add(box(hd.w, hH, 7.5, hMat, hd.x, hH / 2, S06.street.houseFrontZ - 3.75));
    group.add(box(hd.w + 0.5, 0.25, 8, mat.concreteDark(), hd.x, hH + 0.12, S06.street.houseFrontZ - 3.75));
    // compound wall + gate
    group.add(box(hd.w, 1.1, 0.18, mat.concrete(), hd.x, 0.55, S06.street.houseFrontZ + 0.4));
    group.add(box(1.6, 1.05, 0.06, mat.darkSteel(), hd.x + hd.w / 2 - 1.2, 0.52, S06.street.houseFrontZ + 0.4));
    for (let f = 0; f < hd.floors; f++) for (let b = 0; b < 3; b++) {
      const st = windowState(rand);
      windows.push({
        x: hd.x - hd.w / 2 + 1.6 + b * 2.5, y: f * 3.05 + 1.85, z: S06.street.houseFrontZ + 0.03,
        w: 1.15, h: 1.3, rotY: 0,
        color: st ? st.color : 0x141c28, bright: st ? st.bright : 0.6,
      });
    }
    // porch light — a small warm quad by the door + glow (a fixture!)
    windows.push({ x: hd.x - hd.w / 2 + 0.9, y: 2.3, z: S06.street.houseFrontZ + 0.05, w: 0.28, h: 0.28, rotY: 0, color: P06.windowWarm, bright: 1.2 });
    group.add(lampGlow(hd.x - hd.w / 2 + 0.9, 2.3, S06.street.houseFrontZ + 0.35, 0.85, P06.windowWarm, 0.5));
  }
  // rooftop solar water heater on the middle house (silhouette story)
  const swh = box(1.6, 0.12, 1.1, mat.std(0x27303a, 'powderCoat'), 9, 9.5 + 0.75, S06.street.houseFrontZ - 3);
  swh.rotation.x = -0.5;
  group.add(swh);
  group.add(cyl(0.32, 0.32, 1.3, mat.std(0x8b9094, 'powderCoat'), 10.2, 9.5 + 0.65, S06.street.houseFrontZ - 3.2, 12));

  // ----------------------------------------------------- tea stall --
  // the human centre of the block (§4.7): a kiosk at the east corner,
  // one bare bulb, steam over the kettle.
  const tea = new THREE.Group();
  const teaMat = mat.std(0x5d6a72, 'powderCoat');
  tea.add(box(2.2, 2.3, 1.8, teaMat, 0, 1.15, 0));
  tea.add(box(2.6, 0.08, 2.2, mat.darkSteel(), 0, 2.36, 0));
  tea.add(box(1.9, 0.75, 0.06, mat.std(PALETTE.cabinetCream, 'powderCoat'), 0, 1.35, -0.93)); // counter board
  const teaSign = textPlate(2.0, 0.42, [{ text: 'TEA STALL', size: 84, color: '#ffd9a0' }],
    { px: [768, 160], bg: '#4a3421', emissive: 0.6 });
  teaSign.position.set(0, 2.05, -0.95);
  teaSign.rotation.y = Math.PI;
  tea.add(teaSign);
  tea.position.set(44.6, 0.12, 6.7);
  tea.rotation.y = -0.25;
  group.add(tea);
  group.add(lampGlow(44.6, 2.15, 5.9, 1.5, 0xffc37a, 0.8));   // the bare bulb
  const bulbLight = new THREE.PointLight(0xffc37a, 26, 13, 1.8);
  bulbLight.position.set(44.6, 2.15, 5.9);
  group.add(bulbLight);
  // kettle steam: a soft translucent wisp (a cone, gently — life, not spectacle)
  const steam = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 10),
    new THREE.MeshBasicMaterial({ color: 0xd8dee2, transparent: true, opacity: 0.16, depthWrite: false }));
  steam.position.set(44.2, 1.95, 6.2);
  group.add(steam);
  group.userData.steam = steam;

  group.add(createWindowField(windows));
  return group;
}
