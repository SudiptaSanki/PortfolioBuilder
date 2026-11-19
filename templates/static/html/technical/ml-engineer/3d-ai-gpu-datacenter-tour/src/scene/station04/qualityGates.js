// qualityGates.js — the gates (the inspection plant, in the schema
// gate's freight-scanner language). Two gantries span the production
// line: Gate 1 runs lint and the unit tests, Gate 2 runs the
// vulnerability scan against a hard threshold. A gate is not a
// report — it is a threshold with the power to stop the line, and
// the reject bin south of Gate 2 is that power made visible: build
// #479 sits in it, red-lit, never signed and never shipped.

import * as THREE from 'three';
import { STATION04, PALETTE, SURFACE } from '../../config/world.js';
import { createLEDField, registerStageLight } from './flow.js';

const S04 = STATION04;
const G = S04.gates;
const L = S04.line;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function textPlate(w, h, draw, px = [512, 128]) {
  const tex = canvasTexture(px[0], px[1], draw);
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
      g.font = '700 44px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 16);
    } else {
      g.font = '700 40px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 4);
      g.font = '400 32px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 36);
    }
  }, px);
}

// The packet reaches the gates at these fractions of the build cycle.
const GATE_TIMES = [0.182, 0.247];

function buildGantry(group, leds, gi) {
  const x = G.xs[gi];
  const heavy = gi === 1;
  const steel = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x565d64, ...SURFACE.brushedSteel });
  const [z0, z1] = G.spanZ;
  const zc = (z0 + z1) / 2, span = z1 - z0;
  const sec = heavy ? 0.17 : 0.13;

  for (const z of [z0, z1]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(sec, G.beamY + 0.12, sec), steel);
    upright.position.set(x, (G.beamY + 0.12) / 2, z);
    group.add(upright);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.36), darkSteel);
    foot.position.set(x, 0.02, z);
    group.add(foot);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.19, heavy ? 0.3 : 0.24, span + 0.26), steel);
  beam.position.set(x, G.beamY, zc);
  group.add(beam);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, span - 0.2), darkSteel);
  bar.position.set(x, G.beamY - 0.18, zc);
  group.add(bar);
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.012, span - 0.3),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xf4f7f9, emissiveIntensity: 1.4 }));
  strip.position.set(x, G.beamY - 0.215, zc);
  group.add(strip);

  // steady green ticks on the beam's west face — suites that
  // passed — sitting proud of the plates, in the gaps between them
  for (const dz of [-1.62, -0.65, 0.28, 0.48]) {
    leds.push({
      x: x - 0.115, y: G.beamY, z: dz,
      color: PALETTE.ledGreen, phase: dz * 0.4 + gi * 0.4, blink: 0,
    });
  }
  // the verdict flash: two discs on the south upright that flare
  // green as the packet passes under the gate (build-clock driven)
  for (const y of [1.55, 1.32]) {
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x10130f, emissive: PALETTE.ledGreen, emissiveIntensity: 0.12,
      roughness: 0.4, metalness: 0.2,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.014, 20), discMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.set(x - sec / 2 - 0.008, y, z1 - 0.02);
    group.add(disc);
    registerStageLight(discMat, GATE_TIMES[gi], { width: 0.02, base: 0.12, peak: 2.6 });
  }
}

function buildGatePlates(group) {
  // Suite plates on the beam's west (approach) face — read as the
  // build arrives. Suites are counted, not waved at.
  const lint = simplePlate(0.52, 0.13, ['LINT ✓'], { px: [512, 128] });
  lint.position.set(G.xs[0] - 0.098, G.beamY, -1.05);
  lint.rotation.y = -Math.PI / 2;
  group.add(lint);
  const tests = simplePlate(0.62, 0.13, ['TESTS 1,284 ✓'], { px: [640, 128] });
  tests.position.set(G.xs[0] - 0.098, G.beamY, -0.2);
  tests.rotation.y = -Math.PI / 2;
  group.add(tests);

  // Gate 2's threshold rides its beam; the honest scan report stands
  // on a results board beside the walkway — not every build is
  // spotless, and the gate's job is the threshold, not perfection
  const thr = simplePlate(0.78, 0.14, ['FAIL ON CRITICAL · HIGH'],
    { bg: '#14171a', ink: '#f2f3f4', px: [768, 128] });
  thr.position.set(G.xs[1] - 0.098, G.beamY, -1.0);
  thr.rotation.y = -Math.PI / 2;
  group.add(thr);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.5, metalness: 0.7 });
  for (const dx of [-0.42, 0.42]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.06, 6), postMat);
    post.position.set(G.xs[1] + dx, 0.53, 0.42);
    group.add(post);
  }
  const rep = simplePlate(0.92, 0.24,
    ['SCAN · 0 CRITICAL · 2 HIGH', 'FIXED IN #483'], { px: [900, 224] });
  rep.position.set(G.xs[1], 1.18, 0.42);
  group.add(rep);
}

// ------------------------------------------------------- reject bin ---
function buildRejectBin(group, leds) {
  const { x, z } = G.rejectBin;
  const galv = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, roughness: 0.55, metalness: 0.6 });
  const H = 0.62, T = 0.03, W = 0.72;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.04, W), galv);
  floor.position.set(x, 0.02, z);
  group.add(floor);
  for (const [dx, dz, wdt, dep] of [[0, -W / 2, W, T], [0, W / 2, W, T], [-W / 2, 0, T, W], [W / 2, 0, T, W]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wdt, H, dep), galv);
    wall.position.set(x + dx, H / 2 + 0.04, z + dz);
    group.add(wall);
  }
  // the bin's fill: rejected work, packed down — and the reason the
  // #479 crate rides high enough to be seen over the rim
  const fill = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.34, 0.6),
    new THREE.MeshStandardMaterial({ color: PALETTE.interiorDark, roughness: 0.95 }));
  fill.position.set(x, 0.21, z);
  group.add(fill);
  // the rejected crate: a standard crate, one steady red light. It
  // sits on the fill so its top and its label clear the bin's rim
  // (0.66) from a standing viewpoint — the story must read from the
  // walkway, not only from above.
  const crate = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.38, 0.52),
    new THREE.MeshStandardMaterial({ color: PALETTE.trayBody, ...SURFACE.powderCoat }));
  body.position.y = 0.19;
  crate.add(body);
  const trimMat = new THREE.MeshStandardMaterial({ color: PALETTE.trayTrim, ...SURFACE.brushedSteel });
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.03, 0.54), trimMat);
  rim.position.y = 0.395;
  crate.add(rim);
  const label = textPlate(0.36, 0.09, (g, w, h) => {
    g.fillStyle = '#e8eaec'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 44px "Courier New", monospace';
    g.fillText('BUILD #479', w / 2, h / 2 + 15);
  }, [512, 128]);
  label.position.set(0, 0.32, 0.263);
  crate.add(label);
  crate.position.set(x, 0.38, z);
  crate.rotation.y = 0.18;
  group.add(crate);
  leds.push({ x: x + 0.14, y: 0.8, z: z + 0.16, color: PALETTE.ledRed, phase: 0.5, blink: 0 });

  const plate = simplePlate(0.92, 0.26,
    ['REJECTED · BUILD #479', '1 CRITICAL CVE · NEVER SIGNED · NEVER SHIPPED'],
    { ink: '#c0272d', px: [1024, 288] });
  plate.position.set(x, 0.45, z + W / 2 + 0.03);
  group.add(plate);
}

export function createQualityGates() {
  const group = new THREE.Group();
  group.name = 's04-quality-gates';
  const leds = [];
  buildGantry(group, leds, 0);
  buildGantry(group, leds, 1);
  buildGatePlates(group);
  buildRejectBin(group, leds);
  group.add(createLEDField(leds));
  return group;
}
