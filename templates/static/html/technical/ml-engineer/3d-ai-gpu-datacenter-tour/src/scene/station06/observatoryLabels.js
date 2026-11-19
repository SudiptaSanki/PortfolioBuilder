// observatoryLabels.js — Station 06 signage (labels discipline: cheap
// canvas plates, disproportionately convincing, legible in the dim
// room because they are softly self-lit like real NOC signage). The
// integral plates live with their plant (consoles, pipeline, waterfall,
// gauges, map wall); this module carries the room's own text: the
// wayfinding in, the neighbouring methods (RED / USE) that frame the
// golden signals, the three-signals plate, the Prometheus reference
// stand, the latency rule, and the journey's last line at the dais.

import * as THREE from 'three';
import { STATION06, SURFACE } from '../../config/world.js';

const S06 = STATION06;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function plate(w, h, lines, { px = [768, 96], ink = '#dfe7ee', tilt = 0 } = {}) {
  const tex = canvasTexture(px[0], px[1], (g, cw, ch) => {
    g.fillStyle = '#0d1015'; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = 'rgba(160,175,195,0.3)';
    g.lineWidth = 3;
    g.strokeRect(2, 2, cw - 4, ch - 4);
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.fillStyle = ink;
      g.font = '700 40px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 + 14);
    } else {
      g.fillStyle = ink;
      g.font = '700 38px Arial, sans-serif';
      g.fillText(lines[0], cw / 2, ch / 2 - 5);
      g.fillStyle = '#9aa7b5';
      g.font = '400 31px Arial, sans-serif';
      g.fillText(lines[1], cw / 2, ch / 2 + 33);
    }
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.5, metalness: 0.2,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.42,
    }));
  if (tilt) m.rotation.x = tilt;
  return m;
}

// A plate on two slim posts — the reference-stand furniture used by
// the arc and the dais.
function standPlate(lines, w, h, { x, z, rotY = -Math.PI / 2, y = 1.0, tilt = -0.28, px } = {}) {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3a424c, ...SURFACE.brushedSteel });
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, y, 0.035), postMat);
    post.position.set(s * (w / 2 - 0.06), y / 2, 0);
    group.add(post);
  }
  const p = plate(w, h, lines, { px, tilt });
  p.position.set(0, y + h / 2 - 0.02, 0.01);
  group.add(p);
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

export function createObservatoryLabels() {
  const group = new THREE.Group();
  group.name = 's06-labels';
  const W2 = S06.room.widthX / 2, D2 = S06.room.depthZ / 2;

  // wayfinding in — above the west door
  const way = plate(1.5, 0.17, ['← TELEMETRY IN · FROM THE CANARY MESH'], { px: [1200, 110] });
  way.position.set(-W2 + 0.04, 2.52, S06.entry.doorZ);
  way.rotation.y = Math.PI / 2;
  group.add(way);

  // the neighbouring methods, one plate each (north wall, west end) —
  // RED per service, USE per resource; the golden signals sit between
  const red = plate(0.78, 0.12, ['RED — RATE · ERRORS · DURATION', 'PER SERVICE · TOM WILKIE'], { px: [900, 128] });
  red.position.set(-3.85, 1.98, -D2 + 0.03);
  group.add(red);
  const use = plate(0.78, 0.12, ['USE — UTILISATION · SATURATION · ERRORS', 'PER RESOURCE · BRENDAN GREGG'], { px: [900, 128] });
  use.position.set(-3.85, 1.8, -D2 + 0.03);
  group.add(use);

  // the three signals, where the pipeline runs (south wall, west end)
  const sig = plate(1.06, 0.13, ['THREE SIGNALS — TRACES · METRICS · LOGS', 'INSTRUMENT ONCE, SEND ANYWHERE · OPENTELEMETRY'], { px: [1100, 128] });
  sig.position.set(-5.0, 1.86, D2 - 0.03);
  sig.rotation.y = Math.PI;
  group.add(sig);

  // the latency rule, on a stand at the arc's west end
  group.add(standPlate(
    ['SUCCESS AND FAILURE PLOTTED APART', 'A FAST 500 IS NOT HEALTH'],
    0.66, 0.13, { x: -2.52, z: 0.28, rotY: -Math.PI / 2 - 0.45, y: 0.92, px: [900, 128] }));

  // the Prometheus reference stand at the arc's east end
  const ref = new THREE.Group();
  const types = plate(0.72, 0.11, ['PROMETHEUS TYPES — COUNTER · GAUGE', 'HISTOGRAM · SUMMARY'], { px: [900, 128] });
  types.position.set(0, 1.06, 0);
  types.rotation.x = -0.28;
  ref.add(types);
  const card = plate(0.72, 0.11, ['EVERY LABEL VALUE = A NEW SERIES', 'CARDINALITY IS A COST'], { px: [900, 128] });
  card.position.set(0, 0.9, 0.012);
  card.rotation.x = -0.28;
  ref.add(card);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3a424c, ...SURFACE.brushedSteel });
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.0, 0.035), postMat);
    post.position.set(s * 0.3, 0.5, -0.02);
    ref.add(post);
  }
  ref.position.set(1.38, 0, 1.08);
  ref.rotation.y = -Math.PI / 2 + 0.25;
  group.add(ref);

  // the journey's last line — a stand at the dais, facing the visitor
  group.add(standPlate(
    ['END OF THE LINE — SIX HALLS, ONE SYSTEM', 'THE WHOLE WORLD, WATCHING IT BACK'],
    1.0, 0.15, { x: 3.02, z: 0, rotY: -Math.PI / 2, y: 0.72, px: [1100, 144] }));

  return group;
}
