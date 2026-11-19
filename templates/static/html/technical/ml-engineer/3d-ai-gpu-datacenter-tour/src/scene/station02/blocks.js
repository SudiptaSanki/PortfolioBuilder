// blocks.js — the transformer blocks, this station's hero. Six
// IDENTICAL bays — that sameness is the paper's fact (N = 6 layers of
// the same block) — built from one bay function and repeated. What
// differs per bay is only what it DOES: its label and the attention
// pattern its links show. Each bay: a portal frame the residual spine
// passes through untouched, a calibration (LN) gate at each threshold,
// eight attention head frames hanging above the spine, a sequence
// node rail beneath them, the weighted attention links between heads
// and nodes (one LineSegments system per bay, seeded weights, hero
// bay brightest), the feed-forward press widening 4× below the
// gallery, and "+" merge collars where each sub-layer rejoins the
// spine. Nothing here moves; only light does — tickBlocks brightens
// a bay's links as the Forward Pass passes it.

import * as THREE from 'three';
import { STATION02, PALETTE, SURFACE, seeded } from '../../config/world.js';
import { passHeadU } from './flow.js';

const S02 = STATION02;
const B = S02.blocks;
const SPINE_Y = S02.spine.y;
const headZ = (i) => B.headZ0 + i * B.headPitch;

const frameMat = new THREE.MeshStandardMaterial({ color: PALETTE.galvanised, ...SURFACE.paintedMetal });
const steelMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
const pressMat = new THREE.MeshStandardMaterial({ color: PALETTE.brushedSteel, ...SURFACE.brushedSteel });
const pressPlateMat = new THREE.MeshStandardMaterial({ color: PALETTE.steel, ...SURFACE.brushedSteel });
const lensMat = new THREE.MeshStandardMaterial({ color: 0x10151a, roughness: 0.25, metalness: 0.4 });
const lensCoreMat = new THREE.MeshStandardMaterial({
  color: 0x0d2b33, emissive: PALETTE.fibreAqua, emissiveIntensity: 0.35, roughness: 0.4,
});

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A plate readable from BOTH walkway sides: two planes back to back,
// each with the texture the right way round (a single DoubleSide
// plane would mirror the text from behind).
function doublePlate(w, h, tex) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 });
  const geo = new THREE.PlaneGeometry(w, h);
  const f = new THREE.Mesh(geo, mat);
  const b = new THREE.Mesh(geo, mat);
  b.rotation.y = Math.PI;
  g.add(f, b);
  return g;
}

function gaugePlate() {
  const tex = canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 56px Arial, sans-serif';
    g.fillText('LN', w / 2, 58);
    g.font = '400 30px Arial, sans-serif';
    g.fillStyle = '#5a6169';
    g.fillText('RESCALED', w / 2, 102);
  });
  return doublePlate(0.3, 0.15, tex);
}

function plusPlate() {
  const tex = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#14171a';
    g.textAlign = 'center';
    g.font = '700 84px Arial, sans-serif';
    g.fillText('+', w / 2, 92);
  });
  return doublePlate(0.11, 0.11, tex);
}

// ------------------------------------------------------------- gates ----
// A slim calibration gate across the spine: two posts, a top bar, and
// the LN gauge. The stream passes under it untouched — normalisation
// rescales the vectors, it does not stop them.
function buildGate(x) {
  const g = new THREE.Group();
  const postGeo = new THREE.BoxGeometry(0.045, 1.34, 0.045);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, frameMat);
    post.position.set(x, 0.67, s * 0.27);
    g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.6), frameMat);
  bar.position.set(x, 1.35, 0);
  g.add(bar);
  const gauge = gaugePlate();
  gauge.position.set(x, 1.35, 0);
  g.add(gauge);
  return g;
}

// ------------------------------------------------------------ collar ----
// The residual add as a joint: a ring on the spine with a "+" plate —
// x + Sublayer(x), made visible as hardware, not a wall formula.
function buildCollar(x) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.07, 14), steelMat);
  ring.rotation.z = Math.PI / 2;
  ring.position.set(x, SPINE_Y, 0);
  g.add(ring);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.02, 14), frameMat);
  band.rotation.z = Math.PI / 2;
  band.position.set(x, SPINE_Y, 0);
  g.add(band);
  const plus = plusPlate();
  plus.position.set(x, SPINE_Y + 0.16, 0);
  g.add(plus);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.015), frameMat);
  stem.position.set(x, SPINE_Y + 0.09, 0);
  g.add(stem);
  return g;
}

// ------------------------------------------------------------- press ----
// The feed-forward press: a bellows chamber under the gallery whose
// width IS the computation — the correction path widens 4× through
// it (512 → 2048) and narrows back (→ 512). Five frame rings of
// growing then shrinking width in light steel, tied by top and
// bottom plates and by SLOPED SIDE WEBS that follow the width step
// from ring to ring — the widening silhouette is the first thing the
// walkway reads, not a bench. The spine itself stays straight and
// passes over it untouched.
function buildPress(cx) {
  const g = new THREE.Group();
  const widths = [0.22, 0.5, 0.78, 0.5, 0.22];
  const zs = [-0.44, -0.22, 0, 0.22, 0.44];
  const y0 = 0.38, y1 = 0.86, yC = (y0 + y1) / 2;
  widths.forEach((w, i) => {
    const z = zs[i];
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.05), pressMat);
    top.position.set(cx, y1, z);
    g.add(top);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.05), pressMat);
    bot.position.set(cx, y0, z);
    g.add(bot);
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, y1 - y0, 0.05), pressMat);
      side.position.set(cx + s * (w / 2 - 0.02), yC, z);
      g.add(side);
    }
    if (i > 0) {   // longitudinal plates following the width profile
      const wPrev = widths[i - 1];
      const wAvg = (w + wPrev) / 2;
      const zM = (z + zs[i - 1]) / 2;
      const tp = new THREE.Mesh(new THREE.BoxGeometry(wAvg, 0.018, 0.22), pressPlateMat);
      tp.position.set(cx, y1 + 0.028, zM);
      g.add(tp);
      const bp = new THREE.Mesh(new THREE.BoxGeometry(wAvg, 0.018, 0.22), pressPlateMat);
      bp.position.set(cx, y0 - 0.028, zM);
      g.add(bp);
      // sloped side webs: each web leans with the half-width change
      // across its step, so the bellows profile is a continuous,
      // unmistakable outline from the walkway
      const dx = (w - wPrev) / 2;
      const dz = z - zs[i - 1];
      const segLen = Math.hypot(dx, dz) + 0.02;
      const ang = Math.atan2(dx, dz);
      for (const s of [-1, 1]) {
        const web = new THREE.Mesh(new THREE.BoxGeometry(0.016, y1 - y0 - 0.02, segLen), pressPlateMat);
        web.position.set(cx + s * ((wPrev + w) / 4 - 0.02), yC, zM);
        web.rotation.y = s * ang;
        g.add(web);
      }
    }
  });
  return g;
}

// ------------------------------------------------------------- links ----
// Seeded attention patterns — one style per head, the same in every
// bay (heads are the same plant everywhere); brightness = weight.
function headWeight(j, i, rnd) {
  let w;
  switch (j) {
    case 0: w = Math.exp(-Math.abs(i - 3) * 0.85); break;          // local, mid-sequence
    case 1: w = Math.exp(-i * 0.5) + 0.1; break;                  // long-range, back to the start
    case 2: w = Math.exp(-Math.abs(i - 6) * 1.15); break;         // previous-token focus
    case 3: w = i === 0 ? 1 : 0.14; break;                        // first-token anchor
    case 4: w = Math.exp(-Math.abs(i - 1) * 0.95); break;         // local, early
    case 5: w = 0.5; break;                                       // near-uniform
    case 6: w = Math.exp(-Math.abs(7 - i) * 0.55); break;         // recent-weighted
    default: w = Math.exp(-Math.abs(i - 7) * 1.2); break;         // last-token focus
  }
  return w * (0.85 + rnd() * 0.3);
}

const linkSystems = [];   // { mat, bayU, base, peak } for tickBlocks

function buildLinks(cx, bayIdx) {
  const rnd = seeded(1000 + bayIdx * 100);
  const positions = [];
  const colors = [];
  const aqua = new THREE.Color(PALETTE.fibreAqua);
  const tmp = new THREE.Color();
  for (let j = 0; j < B.heads; j++) {
    for (let i = 0; i < 8; i++) {
      const w = headWeight(j, i, rnd);
      if (w < 0.18) continue;                       // faint links are not drawn
      positions.push(cx, B.galleryY - 0.165, headZ(j), cx, B.nodeY + 0.03, headZ(i));
      tmp.copy(aqua).multiplyScalar(0.3 + 0.7 * Math.min(1, w));
      colors.push(tmp.r, tmp.g, tmp.b, tmp.r, tmp.g, tmp.b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
  const hero = bayIdx === B.hero;
  const mat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false,
    opacity: hero ? 0.3 : 0.15,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  linkSystems.push({
    mat,
    bayU: (cx + 5.35) / 11.39,                      // path fraction at this bay
    base: hero ? 0.3 : 0.15,
    peak: hero ? 1.0 : 0.6,
  });
  return lines;
}

// --------------------------------------------------------------- bay ----
function buildBay(cx, bayIdx) {
  const g = new THREE.Group();
  const span = B.spanZ;

  // portal frame — the block; the spine passes through untouched
  const upGeo = new THREE.BoxGeometry(0.09, 2.42, 0.09);
  for (const s of [-1, 1]) {
    const up = new THREE.Mesh(upGeo, steelMat);
    up.position.set(cx, 1.21, s * span);
    g.add(up);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.2), frameMat);
    foot.position.set(cx, 0.015, s * span);
    g.add(foot);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, span * 2 + 0.12), steelMat);
  beam.position.set(cx, 2.36, 0);
  g.add(beam);

  // calibration gates at both thresholds — one before attention,
  // one before the FFN (the LM head's FINAL LN collar closes the
  // stream at the far end — see lmHead.js)
  g.add(buildGate(cx + B.gate1X));
  g.add(buildGate(cx + B.gate2X));

  // attention gallery: eight slim OPEN head frames hanging from
  // the beam — a thin brushed-steel picture-frame border with an
  // open centre and a small lens disc (Ø 0.048, under a quarter of
  // the frame width). Never a solid panel: black is for screens.
  const frameW = 0.2, frameH = 0.31, frameD = 0.028, bord = 0.024;
  const hBarGeo = new THREE.BoxGeometry(frameW, bord, frameD);
  const vBarGeo = new THREE.BoxGeometry(bord, frameH - 2 * bord, frameD);
  const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.17, 5);
  const lensGeo = new THREE.CircleGeometry(0.024, 16);
  const coreGeo = new THREE.CircleGeometry(0.01, 10);
  for (let j = 0; j < B.heads; j++) {
    const z = headZ(j);
    for (const s of [-1, 1]) {
      const hb = new THREE.Mesh(hBarGeo, steelMat);
      hb.position.set(cx, B.galleryY + s * (frameH / 2 - bord / 2), z);
      g.add(hb);
      const vb = new THREE.Mesh(vBarGeo, steelMat);
      vb.position.set(cx + s * (frameW / 2 - bord / 2), B.galleryY, z);
      g.add(vb);
    }
    const rod = new THREE.Mesh(rodGeo, steelMat);
    rod.position.set(cx, 2.22, z);
    g.add(rod);
    for (const s of [1, -1]) {
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(cx, B.galleryY, z + s * (frameD / 2 + 0.001));
      if (s < 0) lens.rotation.y = Math.PI;
      g.add(lens);
      const core = new THREE.Mesh(coreGeo, lensCoreMat);
      core.position.set(cx, B.galleryY, z + s * (frameD / 2 + 0.002));
      if (s < 0) core.rotation.y = Math.PI;
      g.add(core);
    }
    const numTex = canvasTexture(128, 72, (gg, w, h) => {
      gg.fillStyle = '#f2f3f4'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#14171a';
      gg.textAlign = 'center';
      gg.font = '700 44px "Courier New", monospace';
      gg.fillText(`H${j + 1}`, w / 2, 50);
    });
    const num = doublePlate(0.13, 0.07, numTex);
    num.position.set(cx, B.galleryY + 0.2, z);
    g.add(num);
  }

  // sequence node rail beneath the gallery: the 8 positions at this
  // layer, as nodes on a slim crossbar the links land on
  const nodeBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 3.3), frameMat);
  nodeBar.position.set(cx, B.nodeY - 0.03, 0);
  g.add(nodeBar);
  const nodePostGeo = new THREE.BoxGeometry(0.04, B.nodeY - 0.05, 0.04);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(nodePostGeo, frameMat);
    post.position.set(cx, (B.nodeY - 0.05) / 2, s * 1.6);
    g.add(post);
  }
  const nodeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.022, 12);
  const nodeTopGeo = new THREE.CircleGeometry(0.028, 10);
  const nodeTopMat = new THREE.MeshStandardMaterial({
    color: 0x0d2b33, emissive: PALETTE.fibreAqua, emissiveIntensity: 0.5, roughness: 0.4,
  });
  for (let i = 0; i < 8; i++) {
    const node = new THREE.Mesh(nodeGeo, steelMat);
    node.position.set(cx, B.nodeY + 0.01, headZ(i));
    g.add(node);
    const top = new THREE.Mesh(nodeTopGeo, nodeTopMat);
    top.rotation.x = -Math.PI / 2;
    top.position.set(cx, B.nodeY + 0.022, headZ(i));
    g.add(top);
  }

  g.add(buildLinks(cx, bayIdx));
  g.add(buildPress(cx));
  g.add(buildCollar(cx + B.collar1X));
  g.add(buildCollar(cx + B.collar2X));
  return g;
}

export function createBlocks() {
  const group = new THREE.Group();
  group.name = 's02-blocks';
  S02.blocks.centresX.forEach((cx, i) => group.add(buildBay(cx, i)));
  return group;
}

// --------------------------------------------------------------- tick ---
// The only motion in the bays: a bay's attention links brighten to
// their seeded weights as the Forward Pass passes through it, then
// fade back to their resting faintness. Weights are fixed plant.
export function tickBlocks(t) {
  const uh = passHeadU(t);
  for (const s of linkSystems) {
    if (uh < 0) { s.mat.opacity = s.base; continue; }
    const d = (uh - s.bayU) / 0.055;
    const gain = Math.exp(-d * d);
    s.mat.opacity = s.base + (s.peak - s.base) * gain;
  }
}
