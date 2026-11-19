// pipelineRoom.js — the Build Hall shell: raised 600 mm tile floor
// with the build's true path inlaid as a floor decal (along the
// production line, around the deploy ring, out the east door), white
// panel walls, ceiling structure, a door at each end (west entry from
// Station 03, east exit toward Station 05), and the production line
// itself — the waist-high conveyor the build packet travels.
// Techniques mirror intakeRoom.js throughout; the inlay is a texture
// on a plane 1.5 mm above the tiles, never geometry.

import * as THREE from 'three';
import { TILE, STATION04, PALETTE, SURFACE, seeded } from '../../config/world.js';

const S04 = STATION04;
const { widthX, depthZ, height } = S04.room;
const L = S04.line;
const RING = S04.ring;

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

// The build's path drawn into the floor: in at the commit gantry,
// along the line to the stack, a spur from the intake dock, east to
// the registry and the desk, around the deploy ring, and out the
// east door — aqua line + direction chevrons, in the floor texture's
// own discipline (a decal, not a glowing river: matte, thin, quiet).
function inlayTexture() {
  const W = 2048, H = 1229;                       // ~170 px per metre
  const px = (x) => (x + widthX / 2) / widthX * W;
  const pz = (z) => (z + depthZ / 2) / depthZ * H;
  const M = W / widthX;                          // px per metre (x = z)
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
    // the production line, gantry → stack
    line([[-5.45, L.z], [L.x0, L.z], [L.x1, L.z], [S04.stack.x, L.z]]);
    // the spur: intake dock → the stack's weights layer
    line([[S04.commit.dock.x, S04.commit.dock.z + 0.2], [-4.5, -1.5], [0.6, -1.5], [S04.stack.x - 0.2, -0.95]]);
    // stack → registry front → signing desk → ring south rim
    line([[S04.stack.x + 0.3, -0.2], [3.1, 0.35], [5.3, 1.4]]);
    line([[5.3, 1.55], [4.5, 2.2], [S04.desk.x + 0.15, S04.desk.z - 0.15]]);
    line([[S04.desk.x, S04.desk.z - 0.3], [RING.x, RING.z + RING.radius + 0.25]]);
    // the ring itself
    g.beginPath();
    g.arc(px(RING.x), pz(RING.z), RING.radius * M, 0, Math.PI * 2);
    g.stroke();
    // ring → deploy gate → east door
    line([[RING.x + RING.radius, RING.z], [5.5, RING.z], [widthX / 2 - 0.05, RING.z]]);
    for (const x of [-4.4, -2.4, -0.4, 1.0]) chevron(x, L.z, 0);
    chevron(-2.4, -1.5, 0);
    chevron(0.6, -1.5, 0);
    chevron(4.2, 0.8, Math.PI / 4);
    chevron(5.62, RING.z, 0);
    // node dots where the path meets plant
    for (const [x, z] of [[-5.45, L.z], [S04.gates.xs[0], L.z], [S04.gates.xs[1], L.z],
      [S04.stack.x, L.z], [5.3, 1.45], [S04.desk.x + 0.1, S04.desk.z - 0.2],
      [RING.x, RING.z + RING.radius], [RING.x + RING.radius, RING.z]]) {
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

  buildDoor(group, -widthX / 2, S04.entryDoorZ);            // west entry
  buildDoor(group, widthX / 2, S04.exitDoorZ);              // east exit
}

// ---------------------------------------------------------- ceiling -----
function buildCeiling(group) {
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(widthX, depthZ),
    new THREE.MeshStandardMaterial({ color: PALETTE.ceiling, roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = height;
  group.add(ceil);
  // slim, light structure in the hall's clinical palette — thin
  // painted ribs flush with the ceiling plane, not dark slabs.
  const beamMat = new THREE.MeshStandardMaterial({ color: 0xd2d6da, roughness: 0.85, metalness: 0.15 });
  const beamGeo = new THREE.BoxGeometry(0.12, 0.1, depthZ);
  for (let x = -widthX / 2 + 0.6; x < widthX / 2; x += 1.2) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, height - 0.05, 0);
    group.add(beam);
  }
}

// ------------------------------------------------------------- line -----
// The production line: a waist-high roller conveyor from the commit
// gantry to the layer stack, with one work-in-progress crate parked
// between the gates — the line is fixed plant; builds flow over it.
function rollerTexture() {
  return canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = '#33373c';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#454a4f';
    for (let x = 10; x < w; x += 32) g.fillRect(x, 6, 13, h - 12);
    g.fillStyle = '#22252a';
    g.fillRect(0, 0, w, 5);
    g.fillRect(0, h - 5, w, 5);
  });
}

function buildLine(group) {
  const galv = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x565d64, ...SURFACE.brushedSteel });
  // the bed stops at the stack plinth's west edge: running it further
  // east would bite into the top slab and bury its REBUILT stamp
  const x0 = L.x0 - 0.35, x1 = S04.stack.x - 0.72;
  const len = x1 - x0, cx = (x0 + x1) / 2;

  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(len, 0.07, 0.8),
    new THREE.MeshStandardMaterial({ map: rollerTexture(), roughness: 0.5, metalness: 0.6 }));
  bed.position.set(cx, L.topY - 0.035, L.z);
  group.add(bed);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.04), galv);
    rail.position.set(cx, L.topY + 0.025, L.z + s * 0.42);
    group.add(rail);
  }
  for (let x = x0 + 0.3; x < x1; x += 1.3) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, L.topY - 0.07, 0.06), darkSteel);
      leg.position.set(x, (L.topY - 0.07) / 2, L.z + s * 0.34);
      group.add(leg);
    }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.68), darkSteel);
    cross.position.set(x, 0.12, L.z);
    group.add(cross);
  }

  // one work-in-progress crate parked between the gates
  const crate = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.4, 0.56),
    new THREE.MeshStandardMaterial({ color: PALETTE.trayBody, ...SURFACE.powderCoat }));
  body.position.y = 0.2;
  crate.add(body);
  const trimMat = new THREE.MeshStandardMaterial({ color: PALETTE.trayTrim, ...SURFACE.brushedSteel });
  for (const [dx, dz] of [[-0.27, -0.27], [0.27, -0.27], [-0.27, 0.27], [0.27, 0.27]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.4, 0.035), trimMat);
    post.position.set(dx, 0.2, dz);
    crate.add(post);
  }
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.03, 0.58), trimMat);
  rim.position.y = 0.405;
  crate.add(rim);
  crate.position.set(-0.6, L.topY, L.z);
  group.add(crate);
}

export function createPipelineRoom() {
  const group = new THREE.Group();
  group.name = 's04-room';
  buildFloor(group);
  buildWalls(group);
  buildCeiling(group);
  buildLine(group);
  return group;
}
