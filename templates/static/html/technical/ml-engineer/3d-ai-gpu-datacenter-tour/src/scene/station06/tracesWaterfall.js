// tracesWaterfall.js — the traces waterfall cabinet (north wall): one
// worked trace kept as a document on plant. The checkout request from
// the consoles' worked example, drawn as a waterfall on the cabinet
// face: root span at top (POST /checkout · 420 ms — the p99 figure, so
// this cabinet and the LATENCY console tell the same story), child
// spans indented beneath it on a shared time axis, each bar positioned
// by start and sized by duration. The inference span is the widest bar
// low in the tree — the slow hop — and the empty gap before the first
// child is queueing, not work. Both facts are plated, not implied.

import * as THREE from 'three';
import { STATION06, PALETTE, SURFACE } from '../../config/world.js';

const S06 = STATION06;
const WF = S06.waterfall;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function litMaterial(tex, glow = 0.5) {
  return new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.45, metalness: 0.15,
    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow,
  });
}

function plate(w, h, lines, { px = [640, 96], ink = '#dfe7ee' } = {}) {
  const tex = canvasTexture(px[0], px[1], (g, cw, ch) => {
    g.fillStyle = '#0d1015'; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = 'rgba(160,175,195,0.3)';
    g.lineWidth = 3;
    g.strokeRect(2, 2, cw - 4, ch - 4);
    g.fillStyle = ink;
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.font = '700 40px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 14);
    } else {
      g.font = '700 38px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 6);
      g.fillStyle = '#9aa7b5';
      g.font = '400 31px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 32);
    }
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), litMaterial(tex, 0.38));
}

// ------------------------------------------------------- the trace ------
// [name, start ms, duration ms, depth, onCriticalPath]
const SPANS = [
  ['POST /checkout', 0, 420, 0, true],
  ['edge · anycast route', 18, 78, 1, true],
  ['gateway · auth', 30, 34, 2, false],
  ['feature lookup · Station 01 store', 70, 82, 2, false],
  ['inference · Station 03 cluster', 120, 252, 2, true],
  ['forward pass · 6 blocks', 138, 218, 3, true],
  ['response · serialise', 380, 32, 2, false],
];
const T_MAX = 420;

function waterfallTexture() {
  return canvasTexture(768, 1408, (g, w, h) => {
    g.fillStyle = '#101216'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8eef4';
    g.textAlign = 'left';
    g.font = '700 40px Arial, sans-serif';
    g.fillText('TRACE · POST /checkout · 420 MS', 30, 58);
    g.fillStyle = '#9aa7b5';
    g.font = '400 28px Arial, sans-serif';
    g.fillText('ONE REQUEST, EVERY SPAN — BARS BY START + DURATION', 30, 98);

    // Layout bands, top to bottom, each with its own clear space:
    // title (58) · subtitle (98) · axis numbers (158) · root row
    // (220) with a 28 px bracket band beneath its bar for the
    // queueing bracket, then the child rows. The plot leaves a
    // right-hand gutter (plotW = w − 170) so every duration value —
    // the root's 420 ms and the response span's 32 ms included —
    // sits fully inside the canvas.
    const plotX = 40, plotW = w - 170;
    const top = 220, rowH = 118, barH = 44;
    const rowY = (i) => top + i * rowH + (i > 0 ? 28 : 0);
    const tx = (ms) => plotX + (ms / T_MAX) * plotW;
    // time axis
    g.strokeStyle = 'rgba(160,175,195,0.35)';
    g.lineWidth = 2;
    for (let ms = 0; ms <= T_MAX; ms += 60) {
      g.beginPath(); g.moveTo(tx(ms), 170); g.lineTo(tx(ms), rowY(SPANS.length - 1) + barH + 16); g.stroke();
      g.fillStyle = '#9aa7b5';
      g.font = '400 24px "Courier New", monospace';
      g.textAlign = 'center';
      g.fillText(`${ms}`, tx(ms), 158);
    }
    g.textAlign = 'left';
    SPANS.forEach(([name, start, dur, depth, crit], i) => {
      const y = rowY(i);
      const indent = depth * 34;
      g.fillStyle = crit ? '#e8eef4' : '#aeb8c2';
      g.font = '700 30px Arial, sans-serif';
      g.fillText(name, plotX + indent, y - 14);
      g.fillStyle = crit ? '#c9a24d' : '#5f7186';
      g.fillRect(tx(start), y, Math.max(4, tx(start + dur) - tx(start)), barH);
      g.fillStyle = '#9aa7b5';
      g.font = '400 26px "Courier New", monospace';
      g.fillText(`${dur} ms`, tx(start + dur) + 12, y + 32);
      if (name.startsWith('inference')) {
        // the slow hop, marked on the document itself
        g.fillStyle = '#ffb02e';
        g.beginPath();
        const mx = tx(start + dur) - 6;
        g.moveTo(mx, y + barH + 12); g.lineTo(mx + 13, y + barH + 30); g.lineTo(mx - 13, y + barH + 30);
        g.closePath(); g.fill();
        g.font = '700 26px Arial, sans-serif';
        g.fillText('SLOW HOP', mx - 13, y + barH + 58);
      }
    });
    // the queueing gap, bracketed on the root row — it lives in the
    // dedicated band beneath the root bar (see rowY), clear of the
    // bar above and of the first child's label below
    const gy = top + 64;
    g.strokeStyle = '#ffb02e';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(tx(0), gy); g.lineTo(tx(18), gy);
    g.moveTo(tx(0), gy - 8); g.lineTo(tx(0), gy + 8);
    g.moveTo(tx(18), gy - 8); g.lineTo(tx(18), gy + 8);
    g.stroke();
    g.fillStyle = '#ffb02e';
    g.font = '700 22px Arial, sans-serif';
    g.fillText('GAP = QUEUEING', tx(24), gy + 7);
    // footer: how to read it
    g.fillStyle = '#9aa7b5';
    g.font = '400 27px Arial, sans-serif';
    g.fillText('ROOT SPAN = WHAT THE USER FELT · GOLD = CRITICAL PATH', 30, h - 66);
    g.fillText('FOLLOW THE CRITICAL PATH, NOT THE LOUDEST SERVICE', 30, h - 28);
  });
}

export function createTracesWaterfall() {
  const group = new THREE.Group();
  group.name = 's06-waterfall';
  const bodyMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackBlack, ...SURFACE.powderCoat });
  const frameMat = new THREE.MeshStandardMaterial({ color: PALETTE.rackFrame, ...SURFACE.powderCoat });

  const body = new THREE.Mesh(new THREE.BoxGeometry(WF.width, WF.height, WF.depth), bodyMat);
  body.position.set(WF.x, WF.height / 2, WF.centreZ);
  group.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(WF.width + 0.03, 0.04, WF.depth + 0.03), frameMat);
  cap.position.set(WF.x, WF.height + 0.02, WF.centreZ);
  group.add(cap);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(WF.width + 0.03, 0.09, WF.depth + 0.03), frameMat);
  plinth.position.set(WF.x, 0.045, WF.centreZ);
  group.add(plinth);

  const face = new THREE.Mesh(new THREE.PlaneGeometry(WF.width - 0.1, WF.height - 0.14), litMaterial(waterfallTexture(), 0.55));
  face.position.set(WF.x, WF.height / 2 + 0.02, WF.frontZ + 0.002);
  group.add(face);

  // cabinet plates: on the wall beside the cabinet, reading south
  const wallZ = -S06.room.depthZ / 2 + 0.03;
  const left = [
    plate(0.62, 0.13, ['TRACE ID · ONE PER REQUEST', 'EVERYWHERE IT GOES'], { px: [768, 144] }),
    plate(0.62, 0.11, ['7 SPANS · 1 TRACE · 1 ID'], { px: [768, 128] }),
  ];
  left[0].position.set(WF.x - WF.width / 2 - 0.42, 1.72, wallZ);
  left[1].position.set(WF.x - WF.width / 2 - 0.42, 1.52, wallZ);
  const right = [
    plate(0.66, 0.13, ['CONTEXT TRAVELS IN THE traceparent HEADER', 'W3C TRACE CONTEXT'], { px: [900, 144] }),
    plate(0.66, 0.11, ['THE GAP IS QUEUEING, NOT WORK'], { px: [900, 128], ink: '#ffb02e' }),
  ];
  right[0].position.set(WF.x + WF.width / 2 + 0.44, 1.72, wallZ);
  right[1].position.set(WF.x + WF.width / 2 + 0.44, 1.52, wallZ);
  for (const p of [...left, ...right]) group.add(p);

  return group;
}
