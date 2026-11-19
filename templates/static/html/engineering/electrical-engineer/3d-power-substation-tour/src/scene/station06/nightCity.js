// nightCity.js — the ground the night stands on, the sky it stands
// under, and the lighting rig. Night here is a palette, not an
// absence (inventory §5): deep blue sky with a sodium city-glow
// horizon, an ambient floor that keeps every facade readable at
// 5–8%, and the scene's real lights all owned by fixtures in the
// other modules (streetlights, tea stall, curve wall). This module
// owns the ground plane, road markings, the sky dome, the receding
// background canyons, the skyline, and the base light rig.

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';
import { canvasTexture, box, mat, createWindowField } from './helpers.js';

const S06 = STATION06;
const ST = S06.street;
const P06 = S06.palette;

function asphaltTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#3f3f42'; g.fillRect(0, 0, w, h);
    // aggregate speckle — asphalt is read by its grain at night
    for (let i = 0; i < 5200; i++) {
      const v = 52 + Math.random() * 30;
      g.fillStyle = `rgb(${v},${v},${v + 3})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    g.fillStyle = 'rgba(20,20,22,0.25)';
    g.fillRect(0, h * 0.46, w, h * 0.08);            // a patched band
  });
}

function slabTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#5d5a52'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = 82 + Math.random() * 22;
      g.fillStyle = `rgb(${v},${v - 2},${v - 8})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    g.strokeStyle = 'rgba(30,28,25,0.8)'; g.lineWidth = 5;
    g.strokeRect(0, 0, w, h);
  });
}

export function createNightCity() {
  const group = new THREE.Group();
  group.name = 's06-night-city';

  // ---- ground: one dark earth plane under everything (never black)
  const earth = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 320),
    mat.std(0x23211e, 'concrete'));
  earth.rotation.x = -Math.PI / 2;
  earth.position.y = -0.05;
  group.add(earth);

  // ---- carriageway
  const asphTex = asphaltTexture();
  asphTex.wrapS = asphTex.wrapT = THREE.RepeatWrapping;
  asphTex.repeat.set(30, 2.4);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ST.halfX * 2 + 160, ST.carriageHalf * 2),
    new THREE.MeshStandardMaterial({ map: asphTex, roughness: 0.94, metalness: 0 }));
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.0;
  group.add(road);

  // ---- footpaths (slab texture, slightly raised kerbs)
  const slabTex = slabTexture();
  slabTex.wrapS = slabTex.wrapT = THREE.RepeatWrapping;
  slabTex.repeat.set(60, 1.3);
  const slabMat = new THREE.MeshStandardMaterial({ map: slabTex, roughness: 0.95, metalness: 0 });
  for (const side of [1, -1]) {
    const fp = new THREE.Mesh(new THREE.BoxGeometry(ST.halfX * 2 + 160, 0.12, 2.55), slabMat);
    fp.position.set(0, 0.06, side * 6.02);
    group.add(fp);
    const kerb = box(ST.halfX * 2 + 160, 0.13, 0.18, mat.concreteDark(), 0, 0.065, side * 4.84);
    group.add(kerb);
    // aprons in front of the buildings
    const apron = new THREE.Mesh(new THREE.BoxGeometry(ST.halfX * 2 + 160, 0.1, 1.6), mat.concrete());
    apron.position.set(0, 0.05, side * (side > 0 ? 7.75 : -8.1));
    if (side < 0) apron.scale.z = 2.6;               // deeper forecourt ground south
    group.add(apron);
  }

  // ---- road markings: centre dashes + the worn zebra at the corner
  const paintMat = new THREE.MeshBasicMaterial({ color: 0xb9bcbe });
  const paintDim = new THREE.MeshBasicMaterial({ color: 0x77797c });
  for (let x = -118; x < 120; x += 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.15), (x / 6) % 3 === 0 ? paintDim : paintMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.012, 0);
    group.add(dash);
  }
  // zebra crossing at x ≈ 23.5 (the RMU / curve-wall corner), worn edges
  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 1.15),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x9ea0a2 : 0x83858a, transparent: true, opacity: 0.85 }));
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(23.5, 0.013, -3.6 + i * 1.45);
    group.add(stripe);
  }

  // ---- the reinstated trench line along the cable route (footpath,
  // north side): a slightly paler slab band from the transition pole
  // (x 30) west to the RMU (x 26) and on toward the corner — the
  // surface evidence of the buried ring (§4.5).
  const trench = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x6a665c, roughness: 0.95 }));
  trench.rotation.x = -Math.PI / 2;
  trench.position.set(28.4, 0.125, 6.9);
  group.add(trench);

  // ---- sky dome: gradient from zenith blue to the city's own glow
  const skyTex = canvasTexture(64, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0d1b2e');
    grad.addColorStop(0.55, '#18263d');
    grad.addColorStop(0.8, '#2a2438');
    grad.addColorStop(1, '#4a3a30');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(380, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
  sky.position.y = -20;
  group.add(sky);

  // a few faint stars near the zenith only
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 260; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = 0.6 + Math.random() * 1.3;              // elevation, high sky only
    const r = 360;
    starPos.push(r * Math.cos(e) * Math.cos(a), r * Math.sin(e), r * Math.cos(e) * Math.sin(a));
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xaFC4e0, size: 1.1, sizeAttenuation: false, fog: false,
    transparent: true, opacity: 0.55,
  }));
  group.add(stars);

  // ---- background canyons: darker receding blocks both ways, kept
  // simple — silhouettes with a scatter of lit windows (§4.7 skyline)
  const bgMat = mat.std(0x2c3038, 'mattePaint');
  const bgMat2 = mat.std(0x23262d, 'mattePaint');
  const bgWindows = [];
  const blocks = [
    // [x, z, w, h, d, mat]
    [-72, 16, 20, 15, 14, bgMat], [-74, -18, 18, 11, 12, bgMat2],
    [74, 18, 22, 18, 14, bgMat2], [76, -20, 18, 13, 12, bgMat],
    [-98, 14, 24, 21, 16, bgMat2], [102, -16, 24, 16, 14, bgMat],
    [-64, 34, 26, 24, 14, bgMat2], [66, 38, 24, 21, 14, bgMat],
  ];
  for (const [x, z, w, h, d, m] of blocks) {
    group.add(box(w, h, d, m, x, h / 2, z));
    const cols = Math.floor(w / 2.6), rows = Math.floor(h / 3);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (Math.random() > 0.22) continue;            // sparse: most are dark
      const faceZ = z + (z > 0 ? -d / 2 - 0.02 : d / 2 + 0.02);
      bgWindows.push({
        x: x - w / 2 + 1.3 + i * 2.6, y: 1.6 + j * 3, z: faceZ,
        w: 1.1, h: 1.3, rotY: z > 0 ? Math.PI : 0,
        color: Math.random() > 0.3 ? P06.windowWarm : P06.windowCool,
        bright: 0.25 + Math.random() * 0.4,
      });
    }
  }
  // rooftop water tanks on the background blocks — skyline rhythm
  const tankMat = mat.darkSteel();
  for (const [x, z, w, h] of [[-72, 16, 20, 15], [74, 18, 22, 18], [-98, 14, 24, 21]]) {
    group.add(box(2.6, 1.6, 2.6, tankMat, x - w / 4, h + 0.8, z));
    group.add(box(2.2, 1.4, 2.2, tankMat, x + w / 4, h + 0.7, z + 1));
  }

  // ---- distant high-rise, NW: a dark slab with a few lit windows
  const hr = box(16, 42, 12, bgMat2, -78, 21, 52);
  group.add(hr);
  for (let i = 0; i < 14; i++) {
    bgWindows.push({
      x: -78 - 8 + 2 + (i % 4) * 3.6, y: 4 + Math.floor(i / 4) * 9, z: 52 - 6 - 0.02,
      w: 1.4, h: 1.8, rotY: Math.PI,
      color: P06.windowWarm, bright: 0.3 + Math.random() * 0.35,
    });
  }
  group.add(createWindowField(bgWindows));

  // ---- mobile tower, NE: lattice mast + red aviation lights (§4.7)
  const tower = new THREE.Group();
  const legMat = mat.std(0x2e3238, 'mattePaint');
  for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
    const leg = box(0.22, 34, 0.22, legMat, dx * 0.4, 17, dz * 0.4);
    leg.rotation.z = -dx * 0.028; leg.rotation.x = dz * 0.028;
    tower.add(leg);
  }
  for (let y = 6; y < 33; y += 6) tower.add(box(1.9 - y * 0.03, 0.16, 1.9 - y * 0.03, legMat, 0, y, 0));
  tower.add(box(0.3, 3.4, 0.3, legMat, 0, 34.5, 0));
  for (const y of [30.5, 33.5]) {                     // panel antennas
    for (const a of [0, 2.1, 4.2]) {
      const p = box(0.35, 1.9, 0.18, legMat, Math.sin(a) * 1.0, y, Math.cos(a) * 1.0);
      p.rotation.y = a;
      tower.add(p);
    }
  }
  tower.position.set(80, 0, 30);
  group.add(tower);
  // aviation lights — small emissive spheres, blinked by the assembly
  const avMat = new THREE.MeshBasicMaterial({ color: PALETTE.ledRed });
  const av1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), avMat);
  av1.position.set(80, 36.4, 30);
  const av2 = av1.clone(); av2.position.y = 27;
  group.add(av1, av2);
  group.userData.aviationMat = avMat;

  return group;
}

// The base light rig: an ambient floor (anti-void), a faint moon-blue
// directional for form, and nothing else — every other lumen in the
// scene belongs to a fixture in another module. One scoped exception:
// a dim moon shaft (spot) aimed only at the apartment roof, so the
// tanks, lift room and dishes up there keep their form in the
// rooftops pose; its cone and range end above street level, so no
// street-level frame brightens.
export function createNightLights() {
  const group = new THREE.Group();
  group.name = 's06-night-lights';
  const hemi = new THREE.HemisphereLight(0x2c4066, 0x1c1712, 0.85);
  group.add(hemi);
  const moon = new THREE.DirectionalLight(0x8fb0e8, 0.35);
  moon.position.set(30, 60, -25);
  group.add(moon);
  const A = S06.apartment;
  const roofWash = new THREE.SpotLight(0x93b4e8, 900, 62, 0.46, 0.95, 2);
  roofWash.position.set(A.x1 + 16, 46, A.backZ - 14);
  roofWash.target.position.set(
    (A.x0 + A.x1) / 2, A.floors * A.floorH, (A.frontZ + A.backZ) / 2);
  group.add(roofWash, roofWash.target);
  return group;
}
