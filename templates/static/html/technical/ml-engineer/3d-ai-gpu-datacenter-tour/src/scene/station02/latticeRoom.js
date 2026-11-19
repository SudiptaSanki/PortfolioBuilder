// latticeRoom.js — the Lattice Hall shell: raised 600 mm tile floor
// with the pass traced as a floor decal beneath the spine, white panel
// walls, light ceiling structure, a door at each end (west entry from
// Station 01, east exit toward Station 03) — and the hall's discipline
// cue, the RESIDUAL SPINE itself: one unbroken brushed-steel rail at
// waist height running the length of the hall, which every block reads
// from and writes a correction back to. It is never broken and never
// replaced; the bays are built around it. No containment in this hall.
// Techniques mirror intakeRoom.js throughout; the inlay is a texture
// on a plane 1.5 mm above the tiles, never geometry.

import * as THREE from 'three';
import { TILE, STATION02, PALETTE, SURFACE, seeded } from '../../config/world.js';

const S02 = STATION02;
const { widthX, depthZ, height } = S02.room;
const SP = S02.spine;

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
    for (let i = 0; i < 2600; i++) {
      const v = 185 + Math.floor(rnd() * 55);
      g.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      g.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
    }
    g.strokeStyle = '#3a3f42';
    g.lineWidth = 5;
    g.strokeRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 1.5;
    g.strokeRect(4, 4, w - 8, h - 8);
  });
}

// The pass drawn into the floor: one line under the spine with
// direction chevrons, a branch north to the attention board and one
// south to the QKV cabinets — matte, thin, quiet (a decal, not a
// glowing river).
function inlayTexture() {
  const W = 2048, H = 1229;                       // ~170 px per metre
  const px = (x) => (x + widthX / 2) / widthX * W;
  const pz = (z) => (z + depthZ / 2) / depthZ * H;
  return canvasTexture(W, H, (g) => {
    g.clearRect(0, 0, W, H);
    g.strokeStyle = 'rgba(47,183,201,0.55)';
    g.fillStyle = 'rgba(47,183,201,0.55)';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const line = (pts) => {
      g.beginPath();
      pts.forEach(([x, z], i) => (i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))));
      g.stroke();
    };
    const chevron = (x, z, ang) => {               // small ▸ along a run
      const s = 15;
      g.save();
      g.translate(px(x), pz(z));
      g.rotate(ang);
      g.beginPath();
      g.moveTo(-s, -s * 0.8); g.lineTo(s, 0); g.lineTo(-s, s * 0.8);
      g.lineWidth = 6;
      g.stroke();
      g.restore();
    };
    // main run: token rail → along the spine → LM head
    line([[-5.35, 0], [SP.x0, 0], [SP.x1, 0], [5.85, 0]]);
    // branches: north to the board, south to the cabinets (hero bay)
    line([[0, 0], [0, -3.3]]);
    line([[0, 0], [0, 2.9]]);
    for (const x of [-4.4, -2.6, -0.8, 1.0, 2.8, 4.6]) chevron(x, 0, 0);
    chevron(0, -1.7, -Math.PI / 2);
    chevron(0, 1.6, Math.PI / 2);
    // node dots where the path meets plant
    for (const [x, z] of [[-5.35, 0], ...S02.blocks.centresX.map((cx) => [cx, 0]),
      [0, -3.3], [0, 2.9], [5.85, 0]]) {
      g.beginPath(); g.arc(px(x), pz(z), 9, 0, Math.PI * 2); g.fill();
    }
  });
}

function buildFloor(group) {
  const nx = Math.round(widthX / TILE), nz = Math.round(depthZ / TILE);
  const sub = new THREE.Mesh(
    new THREE.PlaneGeometry(widthX + 0.4, depthZ + 0.4),
    new THREE.MeshStandardMaterial({ color: PALETTE.subfloor, roughness: 0.9 }));
  sub.rotation.x = -Math.PI / 2;
  sub.position.y = -0.028;
  group.add(sub);

  const tileGeo = new THREE.BoxGeometry(TILE - 0.004, 0.025, TILE - 0.004);
  const solidMat = new THREE.MeshStandardMaterial({ map: solidTileTexture(), ...SURFACE.floor });
  const tiles = new THREE.InstancedMesh(tileGeo, solidMat, nx * nz);
  const rnd = seeded(23);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let i = 0;
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      dummy.position.set(-widthX / 2 + TILE / 2 + ix * TILE, -0.0125, -depthZ / 2 + TILE / 2 + iz * TILE);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      tiles.setMatrixAt(i, dummy.matrix);
      tiles.setColorAt(i, tint.setScalar(0.93 + rnd() * 0.07));
      i++;
    }
  }
  tiles.instanceMatrix.needsUpdate = true;
  if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
  tiles.receiveShadow = true;
  group.add(tiles);

  const inlay = new THREE.Mesh(
    new THREE.PlaneGeometry(widthX, depthZ),
    new THREE.MeshStandardMaterial({
      map: inlayTexture(), transparent: true, roughness: 0.6, metalness: 0.05,
      polygonOffset: true, polygonOffsetFactor: -1,
    }));
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.0016;
  group.add(inlay);
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

// One end door, room.js discipline: leaf with panel mouldings, kick
// plate, jambs, lintel, push bar — so it keeps shading at distance.
function buildDoor(group, wallX, z) {
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x878e96, ...SURFACE.paintedMetal });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x767e87, ...SURFACE.paintedMetal });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x565b61, roughness: 0.6 });
  const dir = wallX < 0 ? 1 : -1;                  // into the room
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 1.0), doorMat);
  door.position.set(wallX + dir * 0.03, 1.05, z);
  group.add(door);
  for (const py of [1.5, 0.62]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.72, 0.68), panelMat);
    panel.position.set(wallX + dir * 0.065, py, z);
    group.add(panel);
  }
  const kick = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.22, 0.92),
    new THREE.MeshStandardMaterial({ color: 0x6d747c, ...SURFACE.brushedSteel }));
  kick.position.set(wallX + dir * 0.065, 0.13, z);
  group.add(kick);
  for (const s of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.16, 0.08), frameMat);
    jamb.position.set(wallX + dir * 0.04, 1.08, z + s * 0.54);
    group.add(jamb);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.16), frameMat);
  lintel.position.set(wallX + dir * 0.04, 2.18, z);
  group.add(lintel);
  const pushBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.05, 0.8),
    new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }));
  pushBar.position.set(wallX + dir * 0.09, 1.02, z);
  group.add(pushBar);
}

function buildWalls(group) {
  const tex = wallTexture();
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
  mkWall(widthX, 0, -depthZ / 2, 0, 10);                    // north
  mkWall(widthX, 0, depthZ / 2, Math.PI, 10);               // south
  const west = mkWall(depthZ, -widthX / 2, 0, Math.PI / 2, 6);
  west.material.color.set(0xd6dade);   // dim the entry end (Station 03 fix)
  mkWall(depthZ, widthX / 2, 0, -Math.PI / 2, 6);            // east

  // skirting + pilasters on the west wall, as Station 03 learned
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xc4c9ce, roughness: 0.85 });
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, depthZ), trimMat);
  skirt.position.set(-widthX / 2 + 0.015, 0.06, 0);
  group.add(skirt);
  for (const pz of [-3.1, 3.1]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.025, height, 0.2), trimMat);
    pil.position.set(-widthX / 2 + 0.012, height / 2, pz);
    group.add(pil);
  }

  buildDoor(group, -widthX / 2, S02.tokenRail.entryDoorZ);  // west entry (from Station 01)
  buildDoor(group, widthX / 2, S02.tokenRail.entryDoorZ);   // east exit (toward Station 03)
}

// ---------------------------------------------------------- ceiling -----
function buildCeiling(group) {
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(widthX, depthZ),
    new THREE.MeshStandardMaterial({ color: PALETTE.ceiling, roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = height;
  group.add(ceil);
  // slim, light structure in the hall's clinical palette (Station
  // 03's ceiling discipline) — thin painted ribs flush with the
  // ceiling plane, not dark slabs hanging into the frame.
  const beamMat = new THREE.MeshStandardMaterial({ color: 0xd2d6da, roughness: 0.85, metalness: 0.15 });
  const beamGeo = new THREE.BoxGeometry(0.12, 0.1, depthZ);
  for (let x = -widthX / 2 + 0.6; x < widthX / 2; x += 1.2) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, height - 0.05, 0);
    group.add(beam);
  }
}

// ------------------------------------------------------------- spine ----
// The residual stream as plant: a brushed-steel rail on slim posts.
// Two chords (the stream's body) with a bright top face the Forward
// Pass rides; posts every 1.2 m; end stops where the stream begins
// (token rail) and where the LM head's feed takes over.
function buildSpine(group) {
  const steelMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x878e96, ...SURFACE.paintedMetal });
  const len = SP.x1 - SP.x0;
  const cx = (SP.x0 + SP.x1) / 2;

  const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.035, 0.13), steelMat);
  top.position.set(cx, SP.y + 0.018, SP.z);
  group.add(top);
  const chord = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, 0.08), railMat);
  chord.position.set(cx, SP.y - 0.035, SP.z);
  group.add(chord);
  for (const s of [-1, 1]) {   // side cheeks tying the chords
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.012), steelMat);
    cheek.position.set(cx, SP.y - 0.005, SP.z + s * 0.059);
    group.add(cheek);
  }
  const postGeo = new THREE.BoxGeometry(0.05, SP.y - 0.05, 0.05);
  const footGeo = new THREE.BoxGeometry(0.16, 0.02, 0.16);
  for (let x = SP.x0 + 0.3; x <= SP.x1 - 0.2; x += 1.2) {
    const post = new THREE.Mesh(postGeo, railMat);
    post.position.set(x, (SP.y - 0.05) / 2, SP.z);
    group.add(post);
    const foot = new THREE.Mesh(footGeo, railMat);
    foot.position.set(x, 0.01, SP.z);
    group.add(foot);
  }
  for (const ex of [SP.x0, SP.x1]) {   // end stops
    const stop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.16), railMat);
    stop.position.set(ex, SP.y + 0.02, SP.z);
    group.add(stop);
  }
}

export function createLatticeRoom() {
  const group = new THREE.Group();
  group.name = 's02-room';
  buildFloor(group);
  buildWalls(group);
  buildCeiling(group);
  buildSpine(group);
  return group;
}
