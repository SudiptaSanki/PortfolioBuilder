// streams.js — the Stream Gallery, this station's hero: four Kafka
// topics made physical as waist-high log channels. Each channel is a
// trough of partition lanes filled with offset blocks — small numbered
// slabs laid old → new along +X, exactly the Kafka documentation's
// "Anatomy of a Topic" extruded into 3D. Blocks are ONE InstancedMesh
// per topic and NEVER move (a log is immutable — that is the point);
// the only motion is light: write-head append pulses and the flow
// particles in flow.js. The hero topic (orders) carries a replication
// twin beneath a smoked-glass shelf: leader + followers, RF 3.

import * as THREE from 'three';
import { STATION01, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S01 = STATION01;
const G = S01.gallery;
const BED_TOP = 0.84;                    // blocks sit on the bed
const BLOCK_H = 0.055;
const BLOCK_Y = BED_TOP + BLOCK_H / 2;
const X_START = -3.45;
const PER_LANE = 19;

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
function numberPlateTex(text) {
  if (_plateTex.has(text)) return _plateTex.get(text);
  const tex = canvasTexture(128, 80, (g, w, h) => {
    g.fillStyle = '#c9ccd1'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 46px Arial, sans-serif';
    g.fillText(text, w / 2, 56);
  });
  _plateTex.set(text, tex);
  return tex;
}

function flagPlate(text) {
  const tex = canvasTexture(512, 96, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#14171a'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 40px Arial, sans-serif';
    g.fillText(text, w / 2, 62);
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.086),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, side: THREE.DoubleSide }));
  return mesh;
}

const galvMat = () => new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.brushedSteel });
const bedMat = () => new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.85, metalness: 0.2 });

// per-topic pulse state for tickStreams
const _pulse = [];

function buildChannel(group, leds, ch, topicIndex) {
  const len = G.x1 - G.x0 + 0.2;
  const midX = (G.x0 + G.x1) / 2;
  const galv = galvMat();

  // legs + bed + side rails
  const legGeo = new THREE.BoxGeometry(0.06, BED_TOP - 0.03, 0.06);
  for (const lx of [G.x0 + 0.25, -1.0, 0.6, G.x1 - 0.25]) {
    for (const dz of [-G.width / 2 + 0.05, G.width / 2 - 0.05]) {
      const leg = new THREE.Mesh(legGeo, galv);
      leg.position.set(lx, (BED_TOP - 0.03) / 2, ch.z + dz);
      group.add(leg);
    }
  }
  const bed = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, G.width), bedMat());
  bed.position.set(midX, BED_TOP - 0.03, ch.z);
  group.add(bed);
  for (const dz of [-G.width / 2 + 0.02, G.width / 2 - 0.02]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.11, 0.04), galv);
    rail.position.set(midX, BED_TOP + 0.055, ch.z + dz);
    group.add(rail);
  }
  // glass-clear cover strip over the centre lane
  const cover = new THREE.Mesh(
    new THREE.PlaneGeometry(len - 0.3, 0.34),
    new THREE.MeshPhysicalMaterial({
      color: 0xd6e6ee, transparent: true, opacity: 0.14, roughness: 0.08,
      metalness: 0, side: THREE.DoubleSide, depthWrite: false,
    }));
  cover.rotation.x = -Math.PI / 2;
  cover.position.set(midX, 0.945, ch.z);
  group.add(cover);

  // ---- offset blocks: one InstancedMesh for the whole topic ----
  const blockGeo = new THREE.BoxGeometry(G.blockLen, BLOCK_H, 0.22);
  const blockMat = new THREE.MeshStandardMaterial({ color: 0xd8dbde, roughness: 0.5, metalness: 0.1 });
  const total = G.lanes * PER_LANE;
  const mesh = new THREE.InstancedMesh(blockGeo, blockMat, total);
  const rnd = seeded(200 + topicIndex * 13);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  const baseTints = new Float32Array(total);
  const tailIndices = [];
  let i = 0;
  for (let lane = 0; lane < G.lanes; lane++) {
    const lz = ch.z + (lane - 1) * G.laneGap;
    for (let b = 0; b < PER_LANE; b++, i++) {
      dummy.position.set(X_START + b * G.blockPitch, BLOCK_Y, lz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const v = 0.9 + rnd() * 0.1;
      baseTints[i] = v;
      mesh.setColorAt(i, tint.setScalar(v));
      if (b === PER_LANE - 1) tailIndices.push(i);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  group.add(mesh);
  _pulse.push({ mesh, tailIndices, baseTints, topicIndex });

  // offset number plates: per-lane offsets 0 / 8 / 16 on the block tops
  const plateGeo = new THREE.PlaneGeometry(0.15, 0.09);
  for (let lane = 0; lane < G.lanes; lane++) {
    const lz = ch.z + (lane - 1) * G.laneGap;
    for (const b of [0, 8, 16]) {
      const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({
        map: numberPlateTex(String(b)), roughness: 0.6,
      }));
      plate.rotation.x = -Math.PI / 2;
      plate.position.set(X_START + b * G.blockPitch, BLOCK_Y + BLOCK_H / 2 + 0.0015, lz);
      group.add(plate);
    }
  }

  // ---- write head: slim arch + finger at the tail, amber LED ----
  const postGeo = new THREE.BoxGeometry(0.045, 0.34, 0.045);
  for (const dz of [-G.width / 2 + 0.02, G.width / 2 - 0.02]) {
    const post = new THREE.Mesh(postGeo, galv);
    post.position.set(1.62, BED_TOP + 0.17, ch.z + dz);
    group.add(post);
  }
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, G.width), galv);
  cross.position.set(1.62, BED_TOP + 0.34, ch.z);
  group.add(cross);
  const finger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.05), galv);
  finger.position.set(1.62, BED_TOP + 0.24, ch.z);
  group.add(finger);
  leds.push({ x: 1.62, y: BED_TOP + 0.33, z: ch.z, color: PALETTE.ledAmber, phase: topicIndex * 0.27, blink: 0.85 });
  leds.push({ x: G.x0 - 0.06, y: 0.5, z: ch.z - G.width / 2, color: PALETTE.ledGreen, phase: topicIndex * 0.4, blink: 0 });

  // ---- consumer cursors: parked at DIFFERENT offsets, on purpose ----
  const cursorMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.polishedSteel });
  const cursors = [
    { lane: 0, block: 7, label: 'lake-writer · @1,204' },
    { lane: 2, block: 12, label: 'feature-pipeline · @1,187' },
  ];
  for (const cur of cursors) {
    const cx = X_START + cur.block * G.blockPitch - G.blockPitch / 2;
    const cz = ch.z + (cur.lane - 1) * G.laneGap;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.3), cursorMat);
    marker.position.set(cx, BLOCK_Y + BLOCK_H / 2 + 0.018, cz);
    group.add(marker);
    const flag = flagPlate(cur.label);
    flag.position.set(cx, 1.06, ch.z + G.width / 2 + 0.1);
    flag.rotation.y = Math.PI;   // face the gallery walkway (north), not away from it
    group.add(flag);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14, 0.015), cursorMat);
    stem.position.set(cx, 0.97, ch.z + G.width / 2 + 0.02);
    group.add(stem);
  }

  // ---- replication twin (hero topic only): followers under glass ----
  if (ch.hero) {
    const twinBed = new THREE.Mesh(new THREE.BoxGeometry(len - 0.4, 0.05, G.width - 0.14), bedMat());
    twinBed.position.set(midX, 0.4, ch.z);
    group.add(twinBed);
    const twinGeo = new THREE.BoxGeometry(G.blockLen, BLOCK_H, 0.22);
    const twinMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.65, metalness: 0.1 });
    const twin = new THREE.InstancedMesh(twinGeo, twinMat, 2 * PER_LANE);
    const td = new THREE.Object3D();
    let ti = 0;
    for (const dz of [-G.laneGap / 1.6, G.laneGap / 1.6]) {
      for (let b = 0; b < PER_LANE; b++, ti++) {
        td.position.set(X_START + b * G.blockPitch, 0.4 + 0.025 + BLOCK_H / 2, ch.z + dz);
        td.updateMatrix();
        twin.setMatrixAt(ti, td.matrix);
      }
    }
    twin.instanceMatrix.needsUpdate = true;
    group.add(twin);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(len - 0.4, 0.36),
      new THREE.MeshPhysicalMaterial({
        color: 0x39424c, transparent: true, opacity: 0.42, roughness: 0.15,
        metalness: 0, side: THREE.DoubleSide, depthWrite: false,
      }));
    glass.position.set(midX, 0.44, ch.z + G.width / 2 + 0.015);
    group.add(glass);
  }
}

export function createStreams() {
  const group = new THREE.Group();
  group.name = 's01-streams';
  const leds = [];
  G.channels.forEach((ch, i) => buildChannel(group, leds, ch, i));
  group.add(createLEDField(leds));
  return group;
}

// Append pulses: the tail block of one lane per topic glows briefly as
// a record "lands", cycling lanes on a slow staggered timer. Blocks
// themselves never move — only the light does.
const _c = new THREE.Color();
export function tickStreams(t) {
  for (const p of _pulse) {
    const cycle = (t * 0.55 + p.topicIndex * 0.83) % 3;
    const lane = Math.floor(cycle);
    const frac = cycle - lane;
    const glow = Math.sin(frac * Math.PI) * 0.45;
    p.tailIndices.forEach((idx, li) => {
      const v = p.baseTints[idx] * (li === lane ? 1 + glow : 1);
      p.mesh.setColorAt(idx, _c.setScalar(v));
    });
    if (p.mesh.instanceColor) p.mesh.instanceColor.needsUpdate = true;
  }
}
