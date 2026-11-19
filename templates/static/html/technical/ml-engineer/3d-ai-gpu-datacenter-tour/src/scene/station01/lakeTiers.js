// lakeTiers.js — the lake terraces (racks.js's role: the storage
// wall). Three bays of JBOD storage on the east wall — same hardware
// family, three grades of care: BRONZE copper-framed and densely
// packed with mixed carrier generations, SILVER brushed-steel and
// uniform, GOLD black with gold trim, sparse, one door open. The tier
// story is finish + density + trim, never colour fill. Each bay wears
// its _delta_log as a version spine of commit plates on its front.
// Carriers and chassis are instanced; activity is one LED field.

import * as THREE from 'three';
import { STATION01, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S01 = STATION01;
const B = S01.tierBay;
const FRONT_X = B.x - B.depth / 2;               // 5.27 — enclosure fronts
const ENC = { w: 1.32, h: 0.58, d: 0.6, gap: 0.045, base: 0.1 };
const ENC_Y = [0, 1, 2].map((i) => ENC.base + ENC.h / 2 + i * (ENC.h + ENC.gap));

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const _plateTex = new Map();
function commitPlateTex(text, wide) {
  const key = text + (wide ? ':w' : '');
  if (_plateTex.has(key)) return _plateTex.get(key);
  const tex = canvasTexture(wide ? 352 : 160, 56, (g, w, h) => {
    g.fillStyle = wide ? '#14171a' : '#e8eaec'; g.fillRect(0, 0, w, h);
    g.fillStyle = wide ? '#f2f3f4' : '#14171a';
    g.textAlign = 'center';
    // the wide CHECKPOINT string is 19 glyphs: at 30px Courier it
    // measures ~343px and centre-clips off both ends of a 320px
    // canvas (the halved end glyphs read as reversed) — 27px on a
    // 352px canvas fits it whole with margin.
    g.font = `700 ${wide ? 27 : 30}px "Courier New", monospace`;
    g.fillText(text, w / 2, 39);
  });
  _plateTex.set(key, tex);
  return tex;
}

const TIER_STYLE = {
  bronze: {
    frame: () => new THREE.MeshStandardMaterial({ color: PALETTE.copper, roughness: 0.58, metalness: 0.9 }),
    cols: 5, rows: 3, mixed: true, filled: [0, 1, 2],
  },
  silver: {
    frame: () => new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel }),
    cols: 6, rows: 3, mixed: false, filled: [0, 1, 2],
  },
  gold: {
    frame: () => new THREE.MeshStandardMaterial({ color: PALETTE.rackFrame, ...SURFACE.powderCoat }),
    cols: 4, rows: 2, mixed: false, filled: [0, 2],   // middle enclosure is the open one
    trim: true,
  },
};

// collectors for the instanced sets (built across all three bays)
const _chassis = [];   // {x,y,z}
const _carriers = [];  // {x,y,z,sy,sz}
const _latches = [];   // {x,y,z,color}
const _leds = [];

function buildBay(group, tierDef) {
  const style = TIER_STYLE[tierDef.tier];
  const z = tierDef.z;
  const frame = style.frame();
  const rnd = seeded(300 + Math.round(z * 100));

  // plinth + corner posts + top cap (racks.js frame discipline)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(B.depth, 0.09, B.width), frame);
  plinth.position.set(B.x, 0.045, z);
  group.add(plinth);
  const postGeo = new THREE.BoxGeometry(0.05, B.height - 0.09, 0.05);
  for (const dx of [-B.depth / 2 + 0.025, B.depth / 2 - 0.025]) {
    for (const dz of [-B.width / 2 + 0.025, B.width / 2 - 0.025]) {
      const post = new THREE.Mesh(postGeo, frame);
      post.position.set(B.x + dx, 0.09 + (B.height - 0.09) / 2, z + dz);
      group.add(post);
    }
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(B.depth, 0.05, B.width), frame);
  cap.position.set(B.x, B.height - 0.025, z);
  group.add(cap);
  // back + end panels (the bays pack close; ends are mostly seam)
  const panelMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackBlack, ...SURFACE.powderCoat });
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.03, B.height - 0.14, B.width - 0.1), panelMat);
  back.position.set(B.x + B.depth / 2 - 0.015, B.height / 2, z);
  group.add(back);
  for (const s of [-1, 1]) {
    const end = new THREE.Mesh(new THREE.BoxGeometry(B.depth - 0.08, B.height - 0.14, 0.025), panelMat);
    end.position.set(B.x, B.height / 2, z + s * (B.width / 2 - 0.012));
    group.add(end);
  }
  if (style.trim) {   // gold: dgxGold trim on the front edges, not gold boxes
    const trimMat = new THREE.MeshStandardMaterial({ color: PALETTE.dgxGold, ...SURFACE.gold });
    for (const dz of [-B.width / 2 + 0.01, B.width / 2 - 0.01]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.02, B.height - 0.1, 0.02), trimMat);
      trim.position.set(FRONT_X - 0.005, B.height / 2, z + dz);
      group.add(trim);
    }
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, B.width), trimMat);
    topTrim.position.set(FRONT_X - 0.005, B.height - 0.06, z);
    group.add(topTrim);
  }

  // enclosures + their carrier grids
  ENC_Y.forEach((ey, ei) => {
    _chassis.push({ x: B.x, y: ey, z });
    if (!style.filled.includes(ei)) {
      // gold's middle enclosure: carriers recessed behind an open door
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          _carriers.push({
            x: FRONT_X + 0.055, y: ey - 0.13 + r * 0.26, z: z - 0.45 + c * 0.3, sy: 1, sz: 1,
          });
        }
      }
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, ENC.h - 0.04, 0.62),
        new THREE.MeshStandardMaterial({ color: PALETTE.rackBlack, ...SURFACE.powderCoat }));
      const hinge = new THREE.Group();
      hinge.position.set(FRONT_X - 0.01, ey, z + 0.33);
      door.position.set(0, 0, -0.31);
      hinge.add(door);
      hinge.rotation.y = -2.0;                       // swung open toward the room
      group.add(hinge);
      return;
    }
    const { cols, rows } = style;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // bronze mixes generations: some carriers older and larger
        const big = style.mixed && rnd() < 0.22;
        const cw = (ENC.w - 0.12) / cols;
        _carriers.push({
          x: FRONT_X - 0.015,
          y: ey - (rows - 1) * 0.085 + r * 0.17,
          z: z - ENC.w / 2 + 0.06 + cw / 2 + c * cw,
          sy: big ? 1.35 : 1, sz: big ? 1.3 : 1,
        });
        const idx = _carriers.length - 1;
        _latches.push({
          x: FRONT_X - 0.035, y: _carriers[idx].y - 0.02,
          z: _carriers[idx].z + cw * 0.32,
          color: [0x2e7d32, 0x2456c8, 0x8f2f28][Math.floor(rnd() * 3)],
        });
        _leds.push({
          x: FRONT_X - 0.032, y: _carriers[idx].y + 0.055, z: _carriers[idx].z - cw * 0.3,
          color: PALETTE.ledBlue, phase: rnd(), blink: rnd() < 0.4 ? 0.75 : 0,
        });
      }
    }
  });

  // ---- version spine: the _delta_log as a floor-standing ledger
  // rail just in front of the bay (the enclosure fronts span nearly
  // the whole bay width, so the rail stands off the face to be read) --
  const spineX = FRONT_X - 0.09, spineZ = z + 0.45;
  const railMat = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.6 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.8, 0.03), railMat);
  rail.position.set(spineX, 0.95, spineZ);
  group.add(rail);
  for (const dz of [-0.09, 0.09]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.05), railMat);
    foot.position.set(spineX, 0.015, spineZ + dz);
    group.add(foot);
  }
  const commits = ['000000', '000005', '000011', '000018', '000024', 'CHECKPOINT · 000030', '000033', '000038', '000042'];
  commits.forEach((text, i) => {
    const wide = text.startsWith('CHECKPOINT');
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(wide ? 0.295 : 0.135, 0.047),
      new THREE.MeshStandardMaterial({ map: commitPlateTex(text, wide), roughness: 0.6 }));
    plate.position.set(spineX - 0.018, 0.22 + i * 0.185, spineZ);
    plate.rotation.y = -Math.PI / 2;
    group.add(plate);
  });
}

function buildInstanced(group) {
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  const chassisMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(ENC.d, ENC.h, ENC.w),
    new THREE.MeshStandardMaterial({ color: 0x1b1e22, ...SURFACE.paintedMetal }),
    _chassis.length);
  _chassis.forEach((c, i) => {
    dummy.position.set(c.x, c.y, c.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    chassisMesh.setMatrixAt(i, dummy.matrix);
  });
  chassisMesh.instanceMatrix.needsUpdate = true;
  group.add(chassisMesh);

  const carrierMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.035, 0.15, 0.19),
    new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.55, metalness: 0.3 }),
    _carriers.length);
  _carriers.forEach((c, i) => {
    dummy.position.set(c.x, c.y, c.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, c.sy, c.sz);
    dummy.updateMatrix();
    carrierMesh.setMatrixAt(i, dummy.matrix);
    tint.setScalar(0.9 + ((i * 37) % 10) / 10 * 0.15);
    carrierMesh.setColorAt(i, tint);
  });
  carrierMesh.instanceMatrix.needsUpdate = true;
  if (carrierMesh.instanceColor) carrierMesh.instanceColor.needsUpdate = true;
  group.add(carrierMesh);

  const latchMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.014, 0.055, 0.028),
    new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 }),
    _latches.length);
  _latches.forEach((l, i) => {
    dummy.position.set(l.x, l.y, l.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    latchMesh.setMatrixAt(i, dummy.matrix);
    latchMesh.setColorAt(i, tint.setHex(l.color));
  });
  latchMesh.instanceMatrix.needsUpdate = true;
  if (latchMesh.instanceColor) latchMesh.instanceColor.needsUpdate = true;
  group.add(latchMesh);
}

export function createLakeTiers() {
  const group = new THREE.Group();
  group.name = 's01-lake-tiers';
  for (const tierDef of S01.tiers) buildBay(group, tierDef);
  buildInstanced(group);
  group.add(createLEDField(_leds));
  return group;
}
