// telemetryConsoles.js — the golden-signal console arc: four operator
// desks in a shallow arc facing the map wall, one per golden signal
// (Google SRE Book ch. 6, in the book's order: LATENCY, TRAFFIC,
// ERRORS, SATURATION). Identical brushed-steel shells — sameness of
// furniture — but each console's INSTRUMENT is different, never a
// recoloured copy: a physical histogram, a counter readout, an error
// split, a saturation forecast. The worked service is the literature's
// example checkout API: p99 420 ms, 1,200 req/s, 0.3% 5xx, pool 85%,
// disk full in ~6 h — presented as an example, as the sources present
// it. Two operator stools stand before the centre desks.

import * as THREE from 'three';
import { STATION06, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { createLEDField } from './flow.js';

const S06 = STATION06;
const C = S06.consoles;
const MID_X = (C.xs[0] + C.xs[C.xs.length - 1]) / 2;
const HALF_X = (C.xs[C.xs.length - 1] - C.xs[0]) / 2;

export function consolePose(i) {
  const x = C.xs[i];
  const t = (x - MID_X) / HALF_X;                    // −1 … +1 along the arc
  return {
    x,
    z: C.z + C.arcLift * t * t,
    rotY: -Math.PI / 2 - 0.12 * t,                   // faces west, fanned to the room
  };
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function faceMaterial(tex, glow = 0.5) {
  return new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.45, metalness: 0.15,
    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow,
  });
}

function plate(w, h, lines, { bg = '#0d1015', ink = '#dfe7ee', px = [512, 96], sub = '#9aa7b5' } = {}) {
  const tex = canvasTexture(px[0], px[1], (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = 'rgba(160,175,195,0.3)';
    g.lineWidth = 3;
    g.strokeRect(2, 2, cw - 4, ch - 4);
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.fillStyle = ink;
      g.font = '700 46px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 16);
    } else {
      g.fillStyle = ink;
      g.font = '700 42px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 8);
      g.fillStyle = sub;
      g.font = '400 32px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 34);
    }
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), faceMaterial(tex, 0.38));
}

// ------------------------------------------------------- instruments ----
// LATENCY: a physical histogram on the sloped panel — bucket bars as
// thin boxes, the p99 tail picked out in gold — over a dark face whose
// strip carries the percentile figures.
function latencyFace() {
  return canvasTexture(512, 320, (g, w, h) => {
    g.fillStyle = '#101216'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(160,175,195,0.16)';
    g.lineWidth = 1;
    for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, i * h / 5); g.lineTo(w, i * h / 5); g.stroke(); }
    g.fillStyle = '#9aa7b5';
    g.textAlign = 'left';
    g.font = '700 25px Arial, sans-serif';
    g.fillText('RESPONSE TIME · BUCKETS', 18, 36);
    g.fillStyle = '#e8eef4';
    g.textAlign = 'center';
    g.font = '700 34px "Courier New", monospace';
    g.fillText('p50 38 · p95 210 · p99 420 MS', w / 2, h - 18);
  });
}

function buildLatencyBars(panel) {
  const heights = [0.05, 0.09, 0.14, 0.18, 0.2, 0.17, 0.13, 0.1, 0.07, 0.05, 0.034, 0.024];
  const barMat = new THREE.MeshStandardMaterial({ color: 0x8d99a6, roughness: 0.4, metalness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0x6b5518, emissive: PALETTE.dgxGold, emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.4,
  });
  heights.forEach((bh, i) => {
    const tail = i >= 10;                            // the p99 tail
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.036, bh, 0.028), tail ? goldMat : barMat);
    bar.position.set(-0.28 + i * 0.051, -0.155 + bh / 2, 0.035);
    panel.add(bar);
  });
}

// TRAFFIC: the plainest console — a number and a shape.
function trafficFace() {
  return canvasTexture(512, 320, (g, w, h) => {
    g.fillStyle = '#101216'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9aa7b5';
    g.textAlign = 'left';
    g.font = '700 25px Arial, sans-serif';
    g.fillText('DEMAND · HTTP REQUESTS', 18, 36);
    g.fillStyle = '#e8eef4';
    g.textAlign = 'center';
    g.font = '700 118px "Courier New", monospace';
    g.fillText('1,200', w / 2, 158);
    g.font = '700 34px Arial, sans-serif';
    g.fillStyle = '#9aa7b5';
    g.fillText('REQ / S', w / 2, 202);
    // sparkline: the day's demand shape
    const rnd = seeded(67);
    g.strokeStyle = '#b9bec4';
    g.lineWidth = 3;
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = 26 + i * (w - 52) / 40;
      const day = Math.sin(i / 40 * Math.PI * 1.15) * 34;
      const y = h - 34 - day - rnd() * 7;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  });
}

// ERRORS: total vs failed, the ratio as the headline.
function errorsFace() {
  return canvasTexture(512, 320, (g, w, h) => {
    g.fillStyle = '#101216'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9aa7b5';
    g.textAlign = 'left';
    g.font = '700 25px Arial, sans-serif';
    g.fillText('FAILED REQUESTS · ALL KINDS', 18, 36);
    g.fillStyle = '#e8eef4';
    g.textAlign = 'center';
    g.font = '700 108px "Courier New", monospace';
    g.fillText('0.3%', w / 2, 152);
    g.font = '700 32px Arial, sans-serif';
    g.fillStyle = '#9aa7b5';
    g.fillText('RETURNING 5XX', w / 2, 196);
    // the split bar: steel for served, one amber segment for failed —
    // drawn at reading size, the figure above carries the exact value
    const bx = 26, bw = w - 52, by = h - 62;
    g.fillStyle = '#8d99a6'; g.fillRect(bx, by, bw, 20);
    g.fillStyle = '#ffb02e'; g.fillRect(bx + bw - 10, by, 10, 20);
    g.fillStyle = '#9aa7b5';
    g.font = '400 24px Arial, sans-serif';
    g.textAlign = 'left';
    g.fillText('SERVED', bx, by + 44);
    g.textAlign = 'right';
    g.fillStyle = '#ffb02e';
    g.fillText('FAILED', bx + bw, by + 44);
  });
}

// SATURATION: resource bars, the most constrained lit brightest, and
// the forecast the SRE book insists on.
function saturationFace() {
  return canvasTexture(512, 320, (g, w, h) => {
    g.fillStyle = '#101216'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9aa7b5';
    g.textAlign = 'left';
    g.font = '700 25px Arial, sans-serif';
    g.fillText('HOW FULL · MOST CONSTRAINED FIRST', 18, 36);
    const rows = [
      ['CONN POOL', 0.85, '#e8eef4'],
      ['MEMORY', 0.71, '#8d99a6'],
      ['CPU', 0.62, '#8d99a6'],
    ];
    rows.forEach(([label, frac, col], i) => {
      const y = 66 + i * 56;
      g.fillStyle = '#c8d2dc';
      g.font = '700 27px Arial, sans-serif';
      g.fillText(label, 18, y + 8);
      g.fillStyle = '#22262c'; g.fillRect(168, y - 12, 250, 20);
      g.fillStyle = col; g.fillRect(168, y - 12, 250 * frac, 20);
      g.fillStyle = '#e8eef4';
      g.font = '700 27px "Courier New", monospace';
      g.fillText(`${Math.round(frac * 100)}%`, 430, y + 8);
    });
    g.fillStyle = '#ffb02e';
    g.font = '700 29px Arial, sans-serif';
    g.fillText('DISK · FULL IN ~6 H AT CURRENT GROWTH', 18, h - 22);
  });
}

const FACES = { latency: latencyFace, traffic: trafficFace, errors: errorsFace, saturation: saturationFace };
const NAMES = { latency: 'LATENCY', traffic: 'TRAFFIC', errors: 'ERRORS', saturation: 'SATURATION' };

// ------------------------------------------------------------ a desk ----
function buildConsole(kind, leds) {
  const desk = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x767e86, ...SURFACE.brushedSteel });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x2c3138, ...SURFACE.powderCoat });
  const frame = new THREE.MeshStandardMaterial({ color: 0x14171b, ...SURFACE.powderCoat });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(C.width, 0.07, C.depth), darkSteel);
  plinth.position.y = 0.035;
  desk.add(plinth);
  const body = new THREE.Mesh(new THREE.BoxGeometry(C.width, 0.72, 0.55), steel);
  body.position.set(0, 0.43, -0.03);
  desk.add(body);
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.52, 0.52), darkSteel);
    cheek.position.set(s * (C.width / 2 - 0.015), 0.82, 0.0);
    desk.add(cheek);
  }
  // the sloped instrument panel
  const panel = new THREE.Group();
  panel.position.set(0, 0.94, 0.1);
  panel.rotation.x = -0.58;
  desk.add(panel);
  const panelBox = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.46, 0.035), frame);
  panel.add(panelBox);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.4), faceMaterial(FACES[kind]()));
  face.position.z = 0.02;
  panel.add(face);
  if (kind === 'latency') buildLatencyBars(panel);
  // telltales along the panel's top edge
  const rnd = seeded(kind.length * 13 + 5);
  for (let i = 0; i < 3; i++) {
    leds.push({
      local: [-0.24 + i * 0.09, 0.235, 0.03], panel,
      color: i === 1 ? PALETTE.ledBlue : PALETTE.ledGreen,
      phase: rnd(), blink: i === 1 ? 1 : 0,
    });
  }
  // name plate on the desk front (operator side)
  const name = plate(0.56, 0.1, [NAMES[kind]], { px: [512, 92] });
  name.position.set(0, 0.6, 0.248);
  desk.add(name);

  if (kind === 'latency') {
    const value = plate(0.6, 0.09, ['p99 CHECKOUT · 420 MS'], { px: [640, 92] });
    value.position.set(0, 0.24, 0.248);
    desk.add(value);
  }
  if (kind === 'errors') {
    const kinds = plate(0.34, 0.19, ['EXPLICIT · HTTP 500', 'IMPLICIT · 200 WRONG-CONTENT', 'BY POLICY · TOO SLOW'],
      { px: [640, 288] });
    // three lines: the helper draws two — draw this one bespoke below
    kinds.material.map = canvasTexture(640, 288, (g, w, h) => {
      g.fillStyle = '#0d1015'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(160,175,195,0.3)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
      g.fillStyle = '#dfe7ee'; g.textAlign = 'center';
      g.font = '700 40px Arial, sans-serif';
      g.fillText('THREE WAYS TO FAIL', w / 2, 62);
      g.font = '400 37px Arial, sans-serif';
      g.fillStyle = '#9aa7b5';
      g.fillText('EXPLICIT · HTTP 500', w / 2, 128);
      g.fillText('IMPLICIT · 200, WRONG CONTENT', w / 2, 182);
      g.fillText('BY POLICY · TOO SLOW', w / 2, 236);
    });
    kinds.material.emissiveMap = kinds.material.map;
    kinds.position.set(C.width / 2 + 0.017, 0.72, 0.02);
    kinds.rotation.y = Math.PI / 2;
    desk.add(kinds);
  }
  if (kind === 'saturation') {
    const fc = plate(0.62, 0.09, ['SATURATION PAGES ON THE FORECAST'], { px: [768, 92], ink: '#ffb02e' });
    fc.position.set(0, 0.24, 0.248);
    desk.add(fc);
  }
  return desk;
}

// ------------------------------------------------------------ stools ----
function buildStool(x, z) {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x4a5158, ...SURFACE.brushedSteel });
  const cushion = new THREE.MeshStandardMaterial({ color: 0x232830, roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.03, 20), steel);
  base.position.y = 0.015;
  g.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.5, 10), steel);
  post.position.y = 0.28;
  g.add(post);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.055, 20), cushion);
  seat.position.y = 0.56;
  g.add(seat);
  g.position.set(x, 0, z);
  return g;
}

export function createTelemetryConsoles() {
  const group = new THREE.Group();
  group.name = 's06-consoles';
  const leds = [];
  C.kinds.forEach((kind, i) => {
    const pose = consolePose(i);
    const specs = [];
    const desk = buildConsole(kind, specs);
    desk.position.set(pose.x, 0, pose.z);
    desk.rotation.y = pose.rotY;
    group.add(desk);
    desk.updateMatrixWorld(true);
    // resolve this desk's telltales from panel-local into station space
    for (const spec of specs) {
      const v = new THREE.Vector3(...spec.local);
      spec.panel.localToWorld(v);
      leds.push({ x: v.x, y: v.y, z: v.z, color: spec.color, phase: spec.phase, blink: spec.blink });
    }
  });
  if (leds.length) group.add(createLEDField(leds));

  // two operator stools before the centre desks
  for (const i of [1, 2]) {
    const pose = consolePose(i);
    group.add(buildStool(pose.x - 0.72, pose.z + 0.04));
  }
  return group;
}
