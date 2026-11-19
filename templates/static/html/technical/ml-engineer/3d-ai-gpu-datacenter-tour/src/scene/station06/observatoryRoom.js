// observatoryRoom.js — the Observatory shell: the standard 600 mm tile
// floor and 3.3 m hall, re-lit for the night shift. Dark panel walls
// (nightInk — the sanctioned palette exception), a door at the west end
// only (there is no east exit: the map wall closes the world), the
// curved east wall segment the map mounts on, a plain dark ceiling
// cove with the standard strips turned low, the rest dais, and the
// room's dim rig. This hall's discipline cue is the floor flow inlay:
// the telemetry path set into the tiles, a decal, never geometry.
// The drama here is the instruments, not the ceiling — no star field,
// no fibre-optic pinpoints, planetarium manners by architectural means.

import * as THREE from 'three';
import { TILE, STATION06, PALETTE, SURFACE, seeded } from '../../config/world.js';

const S06 = STATION06;
const { widthX, depthZ, height } = S06.room;
const INK = S06.palette.nightInk;

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

// The telemetry path drawn into the floor: in beside the west door,
// south to the pipeline, east along its front, a branch north to the
// console arc, then east to the dais — one thin line, stage-tinted,
// with direction chevrons. Matte and quiet, as Station 01's inlay was.
function inlayTexture() {
  const W = 2048, H = 1229;                       // ~170 px per metre
  const px = (x) => (x + widthX / 2) / widthX * W;
  const pz = (z) => (z + depthZ / 2) / depthZ * H;
  return canvasTexture(W, H, (g) => {
    g.clearRect(0, 0, W, H);
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const line = (pts, style) => {
      g.strokeStyle = style;
      g.beginPath();
      pts.forEach(([x, z], i) => (i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))));
      g.stroke();
    };
    const chevron = (x, z, ang, style) => {
      const s = 15;
      g.strokeStyle = style;
      g.save();
      g.translate(px(x), pz(z));
      g.rotate(ang);
      g.beginPath();
      g.moveTo(-s, -s * 0.8); g.lineTo(s, 0); g.lineTo(-s, s * 0.8);
      g.lineWidth = 6;
      g.stroke();
      g.restore();
    };
    const AQUA = 'rgba(47,183,201,0.55)';
    const STEEL = 'rgba(185,190,196,0.5)';
    const GOLD = 'rgba(201,162,77,0.55)';
    // entry → down the west side → along the pipeline front
    line([[-5.8, S06.entry.conduitZ], [-5.45, S06.entry.conduitZ], [-5.45, 2.5], [-3.6, 2.55]], AQUA);
    line([[-3.6, 2.55], [-0.6, 2.55]], STEEL);
    line([[-0.6, 2.55], [2.4, 2.55]], STEEL);
    // branch north to the console arc, then east to the dais
    line([[0.2, 2.55], [0.2, 1.35], [-0.5, 1.3]], GOLD);
    line([[-0.5, 1.3], [0.9, 1.15], [1.15, 0.4], [S06.dais.x - 0.85, 0]], GOLD);
    for (const x of [-2.6, 0.4]) chevron(x, 2.55, 0, STEEL);
    chevron(-5.45, 0.6, Math.PI / 2, AQUA);
    chevron(0.2, 1.95, -Math.PI / 2, GOLD);
    // node dots where the path meets plant
    g.fillStyle = GOLD;
    for (const [x, z] of [[-5.45, S06.entry.conduitZ], [-3.6, 2.55], [-0.6, 2.55], [2.4, 2.55],
      [-0.5, 1.3], [S06.dais.x - 0.85, 0]]) {
      g.beginPath(); g.arc(px(x), pz(z), 9, 0, Math.PI * 2); g.fill();
    }
  });
}

function buildFloor(group) {
  const nx = Math.round(widthX / TILE), nz = Math.round(depthZ / TILE);
  const sub = new THREE.Mesh(
    new THREE.PlaneGeometry(widthX + 0.4, depthZ + 0.4),
    new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.95 }));
  sub.rotation.x = -Math.PI / 2;
  sub.position.y = -0.028;
  group.add(sub);

  const tileGeo = new THREE.BoxGeometry(TILE - 0.004, 0.025, TILE - 0.004);
  const solidMat = new THREE.MeshStandardMaterial({ map: solidTileTexture(), ...SURFACE.floor });
  const tiles = new THREE.InstancedMesh(tileGeo, solidMat, nx * nz);
  const rnd = seeded(29);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let i = 0;
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      dummy.position.set(-widthX / 2 + TILE / 2 + ix * TILE, -0.0125, -depthZ / 2 + TILE / 2 + iz * TILE);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      tiles.setMatrixAt(i, dummy.matrix);
      // the standard tile, read dimmer under this room's rig
      tiles.setColorAt(i, tint.setScalar(0.5 + rnd() * 0.08));
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
// Dark acoustic panelling: nightInk fields with seams and a chair rail
// — a control room's walls, not a void. Drawn a few values above the
// base tone so the panels read under the dim rig.
function wallTexture() {
  const tex = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#171c24';
    g.fillRect(0, 0, w, h);
    const rnd = seeded(53);
    for (let i = 0; i < 1600; i++) {
      const v = 20 + Math.floor(rnd() * 14);
      g.fillStyle = `rgb(${v},${v + 3},${v + 9})`;
      g.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
    }
    g.strokeStyle = '#0b0e13';
    g.lineWidth = 3;
    for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.beginPath(); g.moveTo(0, h * 0.55); g.lineTo(w, h * 0.55); g.stroke();
    g.strokeStyle = 'rgba(160,175,195,0.10)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, h * 0.55 - 2); g.lineTo(w, h * 0.55 - 2); g.stroke();
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function wallMaterial(tex, repX) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(repX, 1);
  return new THREE.MeshStandardMaterial({ map: t, color: 0xb9c0c9, roughness: 0.94 });
}

// One end door, room.js discipline: leaf with panel mouldings, kick
// plate, jambs, lintel, push bar — graded for the night palette.
function buildDoor(group, wallX, z) {
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x39404a, ...SURFACE.paintedMetal });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x2e343d, ...SURFACE.paintedMetal });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.6 });
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
    new THREE.MeshStandardMaterial({ color: 0x4a5158, ...SURFACE.brushedSteel }));
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
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wdt, height), wallMaterial(tex, repX));
    m.position.set(x, height / 2, z);
    m.rotation.y = rotY;
    group.add(m);
    return m;
  };
  mkWall(widthX, 0, -depthZ / 2, 0, 10);                    // north
  mkWall(widthX, 0, depthZ / 2, Math.PI, 10);               // south
  mkWall(depthZ, -widthX / 2, 0, Math.PI / 2, 6);           // west (entry)

  // east: the curved segment the map wall mounts on — panelled
  // backing following the map's own radius, full height.
  const MW = S06.mapWall;
  const seg = 14;
  const betaMax = Math.asin(MW.zSpan / MW.radius);
  const backMat = new THREE.MeshStandardMaterial({ map: (() => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(1, 1); return t; })(), color: 0x9aa3ae, roughness: 0.94 });
  const segLen = (2 * MW.radius * betaMax) / seg;
  for (let i = 0; i < seg; i++) {
    const b = -betaMax + (i + 0.5) * (2 * betaMax / seg);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(segLen + 0.02, height), backMat);
    p.position.set(MW.curveCentreX - MW.radius * Math.cos(b), height / 2, -MW.radius * Math.sin(b));
    p.rotation.y = Math.atan2(-Math.cos(b), -Math.sin(b)) - Math.PI / 2;
    // plane +Z must face the room (west): orient via lookAt from centre
    p.lookAt(MW.curveCentreX - MW.radius * 2 * Math.cos(b), height / 2, -MW.radius * 2 * Math.sin(b));
    group.add(p);
  }

  // corner fillers: close the gap between the curve's ends (5.8, ±3.0)
  // and the room's east corners (6.0, ±3.6) so no void can show.
  for (const s of [-1, 1]) {
    const filler = new THREE.Mesh(new THREE.PlaneGeometry(0.66, height), backMat);
    filler.position.set(5.9, height / 2, s * 3.3);
    filler.lookAt(0, height / 2, s * 3.3);
    group.add(filler);
  }

  // skirting along the straight walls
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x232830, roughness: 0.85 });
  for (const s of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(widthX, 0.12, 0.03), trimMat);
    skirt.position.set(0, 0.06, s * (depthZ / 2 - 0.015));
    group.add(skirt);
  }
  const skirtW = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, depthZ), trimMat);
  skirtW.position.set(-widthX / 2 + 0.015, 0.06, 0);
  group.add(skirtW);

  buildDoor(group, -widthX / 2, S06.entry.doorZ);           // west entry — the only door

  // the telemetry conduit's wall collar, beside the door
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel }));
  collar.rotation.z = Math.PI / 2;
  collar.position.set(-widthX / 2 + 0.02, 2.3, S06.entry.conduitZ);
  group.add(collar);
}

// ---------------------------------------------------------- ceiling -----
function buildCeiling(group) {
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(widthX, depthZ),
    new THREE.MeshStandardMaterial({ color: 0x1e2631, roughness: 0.97 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = height;
  group.add(ceil);
  // a plain dark cove: slim ribs flush with the ceiling plane
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x252e39, roughness: 0.9, metalness: 0.1 });
  const beamGeo = new THREE.BoxGeometry(0.12, 0.1, depthZ);
  for (let x = -widthX / 2 + 0.6; x < widthX / 2; x += 1.2) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, height - 0.05, 0);
    group.add(beam);
  }
  // the standard strips, turned low — fixtures present, glow restrained.
  // Each strip sits in a dark recess panel set into the ceiling plane
  // (fix loop 1): with the ceiling lifted a value and the diffusers
  // dimmed further, they read as recessed fixtures in a real ceiling,
  // not bright bars floating in a black void.
  const housingMat = new THREE.MeshStandardMaterial({
    color: PALETTE.lightHousing, roughness: 0.5, metalness: 0.5,
  });
  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0x111111, emissive: PALETTE.lightNeutral, emissiveIntensity: 0.15,
  });
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x0b0e12, roughness: 0.95 });
  const stripLen = 10.6;
  for (const z of [-1.8, 0, 1.8]) {
    const recess = new THREE.Mesh(new THREE.BoxGeometry(stripLen + 0.24, 0.025, 0.52), recessMat);
    recess.position.set(0, height - 0.013, z);
    group.add(recess);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(stripLen, 0.05, 0.24), housingMat);
    housing.position.set(0, height - 0.06, z);
    group.add(housing);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(stripLen - 0.1, 0.02, 0.16), diffuserMat);
    bar.position.set(0, height - 0.095, z);
    group.add(bar);
  }
}

// ------------------------------------------------------------- dais -----
// The rest dais: a low platform ~3 m from the map face, where the
// journey's scroll ends. Control-room furniture, not a stage.
function buildDais(group) {
  const D = S06.dais;
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(D.width, D.height, D.depth),
    new THREE.MeshStandardMaterial({ color: 0x1c2129, roughness: 0.7, metalness: 0.2 }));
  top.position.set(D.x, D.height / 2, D.z);
  group.add(top);
  const trimMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  for (const s of [-1, 1]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(D.width, 0.018, 0.03), trimMat);
    edge.position.set(D.x, D.height - 0.009, D.z + s * (D.depth / 2 - 0.015));
    group.add(edge);
  }
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.018, D.depth), trimMat);
  nose.position.set(D.x - D.width / 2 + 0.015, D.height - 0.009, D.z);
  group.add(nose);
}

// ---------------------------------------------------------- lighting ----
// The night rig: low, even, cool ambient so the architecture reads,
// and the instruments supply the room's brightness. No coloured gels,
// no beams, no spotlights chasing particles.
function buildLighting(group) {
  const hemi = new THREE.HemisphereLight(0x8fa3bf, 0x14161a, 0.55);
  group.add(hemi);
  const fill = new THREE.DirectionalLight(0xdfe8f2, 0.3);
  fill.position.set(-4, 6, -2);
  group.add(fill);
  const overArc = new THREE.PointLight(0xbfd2e8, 7, 8, 1.8);
  overArc.position.set(-0.5, 2.7, 0.8);
  group.add(overArc);
  const overDais = new THREE.PointLight(0xbfd2e8, 6, 8, 1.8);
  overDais.position.set(S06.dais.x, 2.7, 0);
  group.add(overDais);
  const overPipe = new THREE.PointLight(0xbfd2e8, 5, 8, 1.8);
  overPipe.position.set(-0.6, 2.6, 2.1);
  group.add(overPipe);
}

export function createObservatoryRoom() {
  const group = new THREE.Group();
  group.name = 's06-room';
  buildFloor(group);
  buildWalls(group);
  buildCeiling(group);
  buildDais(group);
  buildLighting(group);
  return group;
}
