// schemaGate.js — the validation plant (cooling.js's role: the process
// equipment the stream passes through). A brushed-steel portal gantry
// spans all four channels at their exit — freight-scanner logic: what
// passes under the bar has been checked. Beside it, the schema registry
// cabinet with its version plate stack; to the south, the dead-letter
// crate where failed records stop. No scanning beams, no holograms —
// a steady row of green ticks is the truth.

import * as THREE from 'three';
import { STATION01, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S01 = STATION01;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildGantry(group, leds) {
  const steel = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x565d64, ...SURFACE.brushedSteel });
  const { x, spanZ, beamY } = S01.gate;

  for (const s of [-1, 1]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.13, beamY + 0.12, 0.13), steel);
    upright.position.set(x, (beamY + 0.12) / 2, s * spanZ);
    group.add(upright);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.34), darkSteel);
    foot.position.set(x, 0.02, s * spanZ);
    group.add(foot);
    leds.push({ x: x - 0.075, y: 1.25, z: s * spanZ, color: PALETTE.ledGreen, phase: 0.2 * s, blink: 0 });
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.24, spanZ * 2 + 0.26), steel);
  beam.position.set(x, beamY, 0);
  group.add(beam);
  // scanner bar beneath the beam + its steady underside strip
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, spanZ * 2 - 0.2), darkSteel);
  bar.position.set(x, beamY - 0.15, 0);
  group.add(bar);
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.012, spanZ * 2 - 0.3),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xf4f7f9, emissiveIntensity: 1.4 }));
  strip.position.set(x, beamY - 0.182, 0);
  group.add(strip);

  // check lights on the beam's west face: green ticks, one amber
  for (let i = 0; i < 13; i++) {
    const z = -2.16 + i * 0.36;
    const amber = i === 9;
    leds.push({
      x: x - 0.09, y: beamY, z,
      color: amber ? PALETTE.ledAmber : PALETTE.ledGreen,
      phase: i * 0.13, blink: amber ? 0.55 : 0,
    });
  }
}

// ------------------------------------------------------ registry cab --
function registryFaceTex() {
  return canvasTexture(448, 640, (g, w, h) => {
    g.fillStyle = '#17191c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f3f4';
    g.textAlign = 'center';
    g.font = '700 40px Arial, sans-serif';
    g.fillText('SCHEMA REGISTRY', w / 2, 58);
    g.fillStyle = '#3a3e44'; g.fillRect(24, 78, w - 48, 2);
    // the version plate stack — schemas are versioned, compatibility checked
    const plates = [
      ['orders', 'v12 → v13', '#39ff7a'],
      ['clickstream', 'v8', '#39ff7a'],
      ['telemetry', 'v21', '#39ff7a'],
      ['cdc.users', 'v5', '#39ff7a'],
    ];
    plates.forEach(([name, ver, dot], i) => {
      const y = 108 + i * 96;
      g.fillStyle = '#22252a'; g.fillRect(24, y, w - 48, 80);
      g.strokeStyle = '#3a3e44'; g.lineWidth = 2; g.strokeRect(24, y, w - 48, 80);
      g.fillStyle = dot; g.beginPath(); g.arc(56, y + 40, 9, 0, 7); g.fill();
      g.fillStyle = '#e8eaec';
      g.textAlign = 'left';
      g.font = '700 34px Arial, sans-serif';
      g.fillText(name, 82, y + 38);
      g.font = '400 28px Arial, sans-serif';
      g.fillStyle = '#9aa0a6';
      g.fillText(ver, 82, y + 68);
      g.textAlign = 'center';
    });
    g.fillStyle = '#0a8a3c'; g.fillRect(24, h - 92, w - 48, 58);
    g.fillStyle = '#ffffff';
    g.font = '700 32px Arial, sans-serif';
    g.fillText('COMPATIBILITY · BACKWARD', w / 2, h - 54);
  });
}

function buildRegistry(group) {
  const { x, z } = S01.gate.registry;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.5, 0.55),
    new THREE.MeshStandardMaterial({ color: PALETTE.rackBlack, ...SURFACE.powderCoat }));
  body.position.set(x, 0.75, z);
  group.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 1.42),
    new THREE.MeshStandardMaterial({ map: registryFaceTex(), roughness: 0.55, metalness: 0.3 }));
  face.position.set(x - 0.402, 0.75, z);
  face.rotation.y = -Math.PI / 2;
  group.add(face);
}

// --------------------------------------------------------- DLQ crate ---
function buildDLQ(group, leds) {
  const { x, z } = S01.gate.dlq;
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6f4d, roughness: 0.9 });
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.09, 0.62), wood);
  pallet.position.set(x, 0.045, z);
  group.add(pallet);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.7, metalness: 0.3 });
  const H = 0.34, T = 0.025, W = 0.56;
  for (const [dx, dz, wdt, dep] of [[0, -W / 2, W, T], [0, W / 2, W, T], [-W / 2, 0, T, W], [W / 2, 0, T, W]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wdt === T ? T : wdt, H, dep === T ? T : dep), wallMat);
    wall.position.set(x + dx, 0.09 + H / 2, z + dz);
    group.add(wall);
  }
  // the quarantined records: a handful of blocks, two still red-lit
  const rnd = seeded(71);
  const blockGeo = new THREE.BoxGeometry(0.2, 0.05, 0.16);
  const plain = new THREE.MeshStandardMaterial({ color: 0xb9bdc1, roughness: 0.6 });
  const lit = new THREE.MeshStandardMaterial({
    color: 0xb9bdc1, roughness: 0.6, emissive: PALETTE.fireRed, emissiveIntensity: 0.55,
  });
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(blockGeo, i < 2 ? lit : plain);
    b.position.set(x + (rnd() - 0.5) * 0.26, 0.16 + Math.floor(i / 3) * 0.055, z + (rnd() - 0.5) * 0.26);
    b.rotation.y = rnd() * 0.9 - 0.45;
    group.add(b);
  }
  leds.push({ x, y: 0.3, z, color: PALETTE.ledRed, phase: 0.4, blink: 0.6 });
}

export function createSchemaGate() {
  const group = new THREE.Group();
  group.name = 's01-schema-gate';
  const leds = [];
  buildGantry(group, leds);
  buildRegistry(group);
  buildDLQ(group, leds);
  group.add(createLEDField(leds));
  return group;
}
