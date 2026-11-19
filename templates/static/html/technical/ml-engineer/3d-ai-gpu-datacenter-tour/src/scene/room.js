// room.js — the hall shell: raised floor (600 mm tiles, perforated strip in
// the cold aisle), walls, ceiling structure, cold-aisle containment
// (roof panels + end doors) and perimeter CRAH units.
// Perforation is a canvas texture, never geometry (research rule 2).

import * as THREE from 'three';
import { TILE, LAYOUT, PALETTE, SURFACE, seeded } from '../config/world.js';

function canvasTexture(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ------------------------------------------------------------ floor -----
function solidTileTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#d2d5d8';
    g.fillRect(0, 0, w, h);
    const rnd = seeded(7);
    for (let i = 0; i < 2600; i++) {                       // speckle
      const v = 185 + Math.floor(rnd() * 55);
      g.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      g.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
    }
    g.strokeStyle = '#3a3f42';                             // seam
    g.lineWidth = 5;
    g.strokeRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.35)';              // bevel highlight
    g.lineWidth = 1.5;
    g.strokeRect(4, 4, w - 8, h - 8);
  });
}

function perfTileTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#c3c7cb';
    g.fillRect(0, 0, w, h);
    const rnd = seeded(11);
    for (let i = 0; i < 1800; i++) {
      const v = 165 + Math.floor(rnd() * 50);
      g.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      g.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
    }
    // dense field of holes (~25% open) — drawn dark, reads as recessed
    const step = 16, r = 4.4;
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const grad = g.createRadialGradient(x - 1, y - 1, 0.5, x, y, r);
        grad.addColorStop(0, '#83898e');
        grad.addColorStop(0.55, '#4c5157');
        grad.addColorStop(1, '#26292d');
        g.fillStyle = grad;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    }
    g.strokeStyle = '#3a3f42';
    g.lineWidth = 5;
    g.strokeRect(0, 0, w, h);
  });
}

function buildFloor(group) {
  const { widthX, depthZ } = LAYOUT.room;
  const nx = Math.round(widthX / TILE), nz = Math.round(depthZ / TILE);

  const sub = new THREE.Mesh(
    new THREE.PlaneGeometry(widthX + 0.4, depthZ + 0.4),
    new THREE.MeshStandardMaterial({ color: PALETTE.subfloor, roughness: 0.9 })
  );
  sub.rotation.x = -Math.PI / 2;
  sub.position.y = -0.028;
  group.add(sub);

  const tileGeo = new THREE.BoxGeometry(TILE - 0.004, 0.025, TILE - 0.004);
  const solidMat = new THREE.MeshStandardMaterial({
    map: solidTileTexture(), ...SURFACE.floor,
  });
  const perfMat = new THREE.MeshStandardMaterial({
    map: perfTileTexture(), roughness: 0.5, metalness: 0.05,
  });

  const aisleHalf = LAYOUT.aisleWidth / 2;               // perforated strip
  const rowHalf = (LAYOUT.racksPerRow * 0.6) / 2;         // under containment
  const solids = [], perfs = [];
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      const x = -widthX / 2 + TILE / 2 + ix * TILE;
      const z = -depthZ / 2 + TILE / 2 + iz * TILE;
      const inPerf = Math.abs(z) < aisleHalf - 0.01 && Math.abs(x) < rowHalf - 0.01;
      (inPerf ? perfs : solids).push([x, z]);
    }
  }

  const rnd = seeded(23);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  const mkTiles = (list, mat) => {
    const mesh = new THREE.InstancedMesh(tileGeo, mat, list.length);
    list.forEach(([x, z], i) => {
      dummy.position.set(x, -0.0125, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const v = 0.93 + rnd() * 0.07;                     // per-tile tonal drift
      mesh.setColorAt(i, tint.setScalar(v));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  mkTiles(solids, solidMat);
  mkTiles(perfs, perfMat);

  // yellow safety lines along both cold-aisle edges
  const lineMat = new THREE.MeshStandardMaterial({
    color: PALETTE.safetyYellow, roughness: 0.8,
  });
  for (const s of [-1, 1]) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(rowHalf * 2 + 0.6, 0.05), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.002, s * (aisleHalf + 0.06));
    group.add(line);
  }
}

// ------------------------------------------------------------ walls -----
function wallTexture() {
  const tex = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#eceef0';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9ccd0';
    g.lineWidth = 2;
    for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.beginPath(); g.moveTo(0, h * 0.55); g.lineTo(w, h * 0.55); g.stroke();
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildWalls(group) {
  const { widthX, depthZ, height } = LAYOUT.room;
  const tex = wallTexture();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 });
  const mkWall = (wdt, x, z, rotY, repX) => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(repX, 1);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(wdt, height),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }));
    m.position.set(x, height / 2, z);
    m.rotation.y = rotY;
    group.add(m);
    return m;
  };
  mkWall(widthX, 0, -depthZ / 2, 0, 8);                    // north (behind row B)
  mkWall(widthX, 0, depthZ / 2, Math.PI, 8);               // south (behind row A)
  const west = mkWall(depthZ, -widthX / 2, 0, Math.PI / 2, 7); // west — carries the door
  west.material.color.set(0xd6dade);  // dim the far end so it can't blow out to white
  mkWall(depthZ, widthX / 2, 0, -Math.PI / 2, 7);          // east

  // west end-wall dressing: skirting + pilasters break up the flat field
  // so the far end of the hall keeps depth at hero distance
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xc4c9ce, roughness: 0.85 });
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, depthZ), trimMat);
  skirt.position.set(-widthX / 2 + 0.015, 0.06, 0);
  group.add(skirt);
  for (const pz of [-2.9, 2.9]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.025, height, 0.2), trimMat);
    pil.position.set(-widthX / 2 + 0.012, height / 2, pz);
    group.add(pil);
  }

  // fire door on the west wall, centred on the cold aisle (labels add EXIT)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x878e96, ...SURFACE.paintedMetal });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 1.0), doorMat);
  door.position.set(-widthX / 2 + 0.03, 1.05, 0);
  group.add(door);
  // door leaf detail: two panel mouldings + a kick plate, so the leaf
  // keeps shading/detail at hero distance instead of reading as flat white
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x767e87, ...SURFACE.paintedMetal });
  for (const py of [1.5, 0.62]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.72, 0.68), panelMat);
    panel.position.set(-widthX / 2 + 0.065, py, 0);
    group.add(panel);
  }
  const kick = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.22, 0.92),
    new THREE.MeshStandardMaterial({ color: 0x6d747c, ...SURFACE.brushedSteel }));
  kick.position.set(-widthX / 2 + 0.065, 0.13, 0);
  group.add(kick);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x565b61, roughness: 0.6 });
  for (const s of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.16, 0.08), frameMat);
    jamb.position.set(-widthX / 2 + 0.04, 1.08, s * 0.54);
    group.add(jamb);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.16), frameMat);
  lintel.position.set(-widthX / 2 + 0.04, 2.18, 0);
  group.add(lintel);
  const pushBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.05, 0.8),
    new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }));
  pushBar.position.set(-widthX / 2 + 0.09, 1.02, 0);
  group.add(pushBar);
}

// ---------------------------------------------------------- ceiling -----
function buildCeiling(group) {
  const { widthX, depthZ, height } = LAYOUT.room;
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(widthX, depthZ),
    new THREE.MeshStandardMaterial({ color: PALETTE.ceiling, roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = height;
  group.add(ceil);

  const beamMat = new THREE.MeshStandardMaterial({ color: PALETTE.beam, roughness: 0.7, metalness: 0.4 });
  const beamGeo = new THREE.BoxGeometry(0.18, 0.24, depthZ);
  for (let x = -widthX / 2 + 0.6; x < widthX / 2; x += 1.2) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, height - 0.14, 0);
    group.add(beam);
  }
}

// ------------------------------------------------------ containment -----
function buildContainment(group) {
  const endX = LAYOUT.containment.endX;
  const roofY = LAYOUT.containment.roofY;
  const half = LAYOUT.aisleWidth / 2;
  const frameMat = new THREE.MeshStandardMaterial({
    color: PALETTE.galvanised, ...SURFACE.brushedSteel,
  });
  const panelMat = new THREE.MeshPhysicalMaterial({
    color: 0xd6e6ee, transparent: true, opacity: 0.18,
    roughness: 0.08, metalness: 0, side: THREE.DoubleSide, depthWrite: false,
  });

  // roof: framed transparent panels spanning the aisle between rack tops
  const segLen = 1.2;
  for (let x = -endX; x < endX - 0.01; x += segLen) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(segLen - 0.06, LAYOUT.aisleWidth - 0.04), panelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(x + segLen / 2, roofY, 0);
    group.add(panel);
    for (const dz of [-half, half]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.045, 0.045), frameMat);
      rail.position.set(x + segLen / 2, roofY, dz);
      group.add(rail);
    }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, LAYOUT.aisleWidth), frameMat);
    cross.position.set(x, roofY, 0);
    group.add(cross);
  }

  // end doors: framed translucent panels + black brush strip at the base
  const doorPanelMat = panelMat.clone();
  doorPanelMat.opacity = 0.3;
  for (const s of [-1, 1]) {
    const x = s * endX;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(LAYOUT.aisleWidth - 0.04, roofY - 0.1), doorPanelMat);
    panel.rotation.y = Math.PI / 2;
    panel.position.set(x, (roofY - 0.1) / 2 + 0.06, 0);
    group.add(panel);
    for (const dz of [-half, half]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, roofY, 0.05), frameMat);
      post.position.set(x, roofY / 2, dz);
      group.add(post);
    }
    const header = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, LAYOUT.aisleWidth), frameMat);
    header.position.set(x, roofY, 0);
    group.add(header);
    const brush = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.09, LAYOUT.aisleWidth - 0.06),
      new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 1 }));
    brush.position.set(x, 0.045, 0);
    group.add(brush);
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.3, 0.025), frameMat);
    handle.position.set(x - s * 0.03, 1.05, half - 0.18);
    group.add(handle);
  }
}

// ------------------------------------------------------------- CRAH -----
function crahTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#d8dbde';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2c3034';                               // grille field
    g.fillRect(14, 60, w - 28, h - 90);
    g.fillStyle = '#454b51';
    for (let y = 66; y < h - 36; y += 9) g.fillRect(18, y, w - 36, 3.5);
    g.fillStyle = '#8b9096';                               // top panel + seams
    g.fillRect(14, 14, w - 28, 34);
    g.strokeStyle = '#a9adb2';
    g.strokeRect(7, 7, w - 14, h - 14);
    g.fillStyle = '#39ff7a';                               // status dot
    g.beginPath(); g.arc(w - 30, 31, 4, 0, Math.PI * 2); g.fill();
  });
}

function buildCRAH(group) {
  const { depthZ } = LAYOUT.room;
  const tex = crahTexture();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8dbde, roughness: 0.7, metalness: 0.2 });
  const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 });
  for (const s of [-1, 1]) {
    for (const x of [-2.7, 2.7]) {
      const unit = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.3, 0.55), bodyMat);
      body.position.y = 1.15;
      unit.add(body);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 2.24), faceMat);
      face.position.set(0, 1.15, -s * 0.28);
      face.rotation.y = s > 0 ? Math.PI : 0;
      unit.add(face);
      unit.position.set(x, 0, s * (depthZ / 2 - 0.3));
      group.add(unit);
    }
  }
}

// -------------------------------------------------------------- main ----
export function createRoom() {
  const group = new THREE.Group();
  group.name = 'room';
  buildFloor(group);
  buildWalls(group);
  buildCeiling(group);
  buildContainment(group);
  buildCRAH(group);
  return group;
}
