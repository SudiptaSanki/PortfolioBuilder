// streamLabels.js — Station 01 signage (labels.js discipline: cheap
// canvas plates, disproportionately convincing). Topic plates over the
// channels, source bay labels, tier plates in the metals' own tones,
// the gantry and DLQ plates, vault plates, the EXIT sign and the
// FEATURE STORE wayfinding sign at the hand-off to Station 02.

import * as THREE from 'three';
import { STATION01, PALETTE } from '../../config/world.js';

const S01 = STATION01;
const G = S01.gallery;
const BAY_FRONT = S01.tierBay.x - S01.tierBay.depth / 2;

function textPlate(w, h, draw, px = [512, 128]) {
  const c = document.createElement('canvas');
  c.width = px[0]; c.height = px[1];
  draw(c.getContext('2d'), px[0], px[1]);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 }));
}

function simplePlate(w, h, lines, { bg = '#f2f3f4', ink = '#14171a', px = [512, 128] } = {}) {
  return textPlate(w, h, (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.fillStyle = ink;
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.font = '700 52px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 19);
    } else {
      g.font = '700 48px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 6);
      g.font = '400 36px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 42);
    }
  }, px);
}

// --------------------------------------------------------- topics -----
function buildTopicPlates(group) {
  const postMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });
  for (const ch of G.channels) {
    const plate = textPlate(0.68, 0.22, (g, w, h) => {
      g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f2f3f4';
      g.textAlign = 'center';
      g.font = '700 56px "Courier New", monospace';
      g.fillText(ch.topic, w / 2, 62);
      g.font = '400 34px Arial, sans-serif';
      g.fillStyle = '#9aa0a6';
      g.fillText(`${ch.partitions} partitions`, w / 2, 108);
    }, [512, 128]);
    plate.position.set(G.x0 - 0.16, 1.34, ch.z);
    plate.rotation.y = -Math.PI / 2;
    group.add(plate);
    for (const dz of [-0.24, 0.24]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.52, 5), postMat);
      post.position.set(G.x0 - 0.16, 1.06, ch.z + dz);
      group.add(post);
    }
  }
  // replication cue label on the hero channel's smoked glass
  const rep = simplePlate(0.5, 0.11, ['REPLICAS · RF 3'], { px: [512, 112] });
  rep.position.set(-0.6, 0.44, G.channels[1].z + G.width / 2 + 0.035);
  group.add(rep);
}

// -------------------------------------------------------- sources -----
function buildSourceLabels(group) {
  const names = ['API EVENTS', 'CDC · ORDERS DB', 'IOT TELEMETRY', 'BATCH DROP'];
  S01.sources.bayZ.forEach((z, i) => {
    const plate = simplePlate(1.15, 0.23, [names[i]]);
    plate.position.set(-S01.room.widthX / 2 + 0.03, 2.98, z);
    plate.rotation.y = Math.PI / 2;
    group.add(plate);
  });
  const sched = simplePlate(0.52, 0.3, ['BATCH DROP', 'NIGHTLY · 02:00'], { px: [512, 288] });
  sched.position.set(-S01.room.widthX / 2 + 0.03, 1.78, 1.98);
  sched.rotation.y = Math.PI / 2;
  group.add(sched);
}

// ---------------------------------------------------------- tiers -----
function buildTierPlates(group) {
  const plates = [
    { text: 'BRONZE · RAW — AS RECEIVED', bg: '#a06628', ink: '#fff6e8' },
    { text: 'SILVER · VALIDATED', bg: '#9fa6ad', ink: '#14171a' },
    { text: 'GOLD · CURATED', bg: '#c9a24d', ink: '#14171a' },
  ];
  S01.tiers.forEach((t, i) => {
    const plate = simplePlate(1.12, 0.16, [plates[i].text], { bg: plates[i].bg, ink: plates[i].ink, px: [960, 112] });
    plate.position.set(BAY_FRONT - 0.008, S01.tierBay.height - 0.04, t.z);
    plate.rotation.y = -Math.PI / 2;
    group.add(plate);
  });
}

// ----------------------------------------------------------- gate -----
function buildGatePlates(group) {
  const gate = simplePlate(1.5, 0.19, ['SCHEMA GATE · REGISTRY v13'], { bg: '#14171a', ink: '#f2f3f4', px: [960, 96] });
  gate.position.set(S01.gate.x - 0.095, S01.gate.beamY, 0);
  gate.rotation.y = -Math.PI / 2;
  group.add(gate);
  const dlq = simplePlate(0.46, 0.13, ['DLQ · 3 RECORDS'], { ink: '#c0272d', px: [512, 144] });
  dlq.position.set(S01.gate.dlq.x, 0.3, S01.gate.dlq.z + 0.3);
  group.add(dlq);
}

// ---------------------------------------------------------- vault -----
function buildVaultPlates(group) {
  const V = S01.vault;
  const off = simplePlate(1.35, 0.2, ['OFFLINE STORE · FULL HISTORY'], { px: [768, 112] });
  off.position.set(V.archiveX[1], 2.34, V.archiveZ - 0.27);
  off.rotation.y = Math.PI;
  group.add(off);
  for (const x of V.archiveX) {
    const ts = textPlate(0.46, 0.09, (g, w, h) => {
      g.fillStyle = '#e8eaec'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#14171a';
      g.textAlign = 'center';
      g.font = '700 30px "Courier New", monospace';
      g.fillText('AS-OF 2026-11-19 04:30', w / 2, 40);
    }, [512, 64]);
    ts.position.set(x, 1.66, V.archiveZ - 0.256);
    ts.rotation.y = Math.PI;
    group.add(ts);
  }
  const online = simplePlate(0.52, 0.17, ['ONLINE STORE · LATEST ONLY', 'p99 < 10 ms'], { bg: '#14171a', ink: '#f2f3f4', px: [800, 208] });
  online.position.set(V.online.x - 0.316, 1.3, V.online.z);
  online.rotation.y = -Math.PI / 2;
  group.add(online);

  // EXIT over the east door + the wayfinding sign for the hand-off
  const exit = textPlate(0.52, 0.19, (g, w, h) => {
    g.fillStyle = '#0a8a3c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = '700 54px Arial, sans-serif';
    g.fillText('EXIT ▸', w / 2, 63);
  }, [256, 96]);
  exit.material = new THREE.MeshBasicMaterial({ map: exit.material.map });
  exit.position.set(S01.room.widthX / 2 - 0.06, 2.42, V.exitDoorZ);
  exit.rotation.y = -Math.PI / 2;
  group.add(exit);

  const way = simplePlate(0.88, 0.24, ['FEATURE STORE →'], { bg: '#14171a', ink: '#f2f3f4', px: [640, 176] });
  way.material.side = THREE.DoubleSide;
  way.position.set(4.85, 2.52, 1.85);
  way.rotation.y = -Math.PI / 2;
  group.add(way);
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });
  for (const dz of [-0.16, 0.16]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, S01.room.height - 2.64, 5), rodMat);
    rod.position.set(4.85, (S01.room.height + 2.64) / 2, 1.85 + dz);
    group.add(rod);
  }
}

export function createStreamLabels() {
  const group = new THREE.Group();
  group.name = 's01-labels';
  buildTopicPlates(group);
  buildSourceLabels(group);
  buildTierPlates(group);
  buildGatePlates(group);
  buildVaultPlates(group);
  return group;
}
