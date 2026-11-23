/**
 * researchWorld.js
 * ============================================================================
 * THE RESEARCH CAMPUS
 *
 * A complete, fully procedural Three.js world for a computational & experimental
 * lab portfolio: a bright glass-and-timber research building that walks from
 * morning daylight in the atrium to a starry twilight observatory and a warm
 * archive terrace at dusk.
 *
 *   research atrium  →  quantum & cryo-optics bench  →  wet lab
 *   →  supercomputing hall  →  sky-dome observatory  →  publication archive
 *
 * Everything is generated at runtime from code — no textures on disk, no GLB
 * models, no image requests. The only dependency is `three`.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   import { createResearchWorld } from './scene/researchWorld.js';
 *
 *   const world = createResearchWorld(scene, { quality: 'high' });
 *   const pose  = world.getResearchPose(progress);     // progress 0..1
 *   camera.position.copy(pose.cameraPos);
 *   camera.lookAt(pose.lookAt);
 *   camera.fov = pose.fov; camera.updateProjectionMatrix();
 *   world.update(elapsed, delta, progress, camera);
 *
 *   world.triggerExperiment();       // lasers fire, reactors bubble, atlas pulses
 *   world.setLaserAlignment(true);   // fold the beam through the mirror train
 *   world.getLaserAlignment();       // boolean
 *   world.pickStation(ndcX, ndcY);   // { id, index, point } | null
 *   world.dispose();                 // removes the group, frees GPU resources
 *
 * `getResearchPose(progress)` returns a fresh object each call:
 *
 *   {
 *     cameraPos, lookAt,        // THREE.Vector3, safe to keep / mutate
 *     fov,                      // suggested vertical field of view, degrees
 *     phaseName, phaseId,       // which of the six stations we are in
 *     station,                  // 1-based station index
 *     temperatureMk,            // dilution-stage temperature, millikelvin
 *     laserLockPct,             // cavity lock quality, %
 *     computePf,                // active compute, petaflops
 *     citations,                // cumulative citations
 *     datasets,                 // open datasets
 *     timeOfDay,                // 0 = morning … 1 = deep twilight
 *   }
 *
 * ----------------------------------------------------------------------------
 * THE SIX STATIONS (camera path)
 * ----------------------------------------------------------------------------
 *   0.00 – 0.17  01 · Research Atrium & Living Lattice
 *                Glazed timber atrium, suspended molecular sculpture, planted
 *                lattice wall, sun patches on a polished terrazzo floor.
 *   0.17 – 0.36  02 · Quantum & Cryo-Optics Bench
 *                Pneumatic optical table, green/red laser train with two
 *                alignment paths, dilution refrigerator stack in copper stages.
 *   0.36 – 0.56  03 · Wet Lab & Bio-Simulation Core
 *                Glass bio-reactors with rising bubbles, spinning centrifuge,
 *                orbital shaker, holographic protein mesh in free space.
 *   0.56 – 0.76  04 · Supercomputing & Dataset Atlas
 *                Blade cluster in a cold aisle beside a volumetric embedding
 *                manifold with animated data pulses.
 *   0.76 – 0.90  05 · Sky-Dome Observatory
 *                Retractable ribbed dome opening to a starry twilight sky,
 *                equatorial telescope and orbital trajectory arcs.
 *   0.90 – 1.00  06 · Publication Archive & Collaboration Deck
 *                Floating illuminated monographs over a reflecting pool and a
 *                warm reading terrace with lanterns.
 *
 * ----------------------------------------------------------------------------
 * INTERNALS
 * ----------------------------------------------------------------------------
 * World units are metres, Y is up. The building runs along +X from −240 to
 * +184, 60 m wide, 17.5 m to the timber trusses. The south wall is a glazed
 * curtain wall onto a meadow; the north wall is plaster with timber battens and
 * recessed shelves. The dome annex sits beyond the east portal, and the archive
 * terrace beyond that.
 *
 * Camera framing deliberately composes the hero subject to the RIGHT of screen
 * centre (~24 % of half-width) so a left-hand portfolio card never covers it.
 * Pass `{ compositionShift: 0 }` if a host wants a centred camera.
 *
 * The module owns `scene.fog` and `scene.background` by default (restored on
 * dispose). All shaders are self-contained GLSL ES 1.00 with manual distance
 * fog so they compile on WebGL1 and WebGL2 without three's shader chunks.
 */

import * as THREE from 'three';

export const RESEARCH_WORLD_VERSION = '1.0.0';

/* ========================================================================== *
 *  Stations
 * ========================================================================== */

export const RESEARCH_PHASES = Object.freeze([
  {
    id: 'atrium',
    name: 'Research Atrium & Living Lattice',
    short: 'Atrium',
    start: 0.0,
    end: 0.17,
    caption: 'A molecular sculpture turns under the skylight above a planted lattice',
  },
  {
    id: 'optics',
    name: 'Quantum & Cryo-Optics Bench',
    short: 'Optics',
    start: 0.17,
    end: 0.36,
    caption: 'A folded laser train beside a dilution refrigerator in copper stages',
  },
  {
    id: 'wetlab',
    name: 'Wet Lab & Bio-Simulation Core',
    short: 'Wet Lab',
    start: 0.36,
    end: 0.56,
    caption: 'Bio-reactors, a spinning centrifuge and a protein folding in free space',
  },
  {
    id: 'compute',
    name: 'Supercomputing & Dataset Atlas',
    short: 'Compute',
    start: 0.56,
    end: 0.76,
    caption: 'A blade cluster beside a manifold atlas alive with data pulses',
  },
  {
    id: 'observatory',
    name: 'Sky-Dome Observatory',
    short: 'Observatory',
    start: 0.76,
    end: 0.9,
    caption: 'The dome rolls back onto a starry sky and its orbital arcs',
  },
  {
    id: 'archive',
    name: 'Publication Archive & Collaboration Deck',
    short: 'Archive',
    start: 0.9,
    end: 1.0,
    caption: 'Illuminated monographs float over a pool on the dusk terrace',
  },
]);

export function phaseAtProgress(progress) {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  let index = 0;
  for (let i = 0; i < RESEARCH_PHASES.length; i += 1) {
    if (p >= RESEARCH_PHASES[i].start) index = i;
  }
  const phase = RESEARCH_PHASES[index];
  const span = Math.max(1e-6, phase.end - phase.start);
  const local = Math.min(1, Math.max(0, (p - phase.start) / span));
  return { index, phase, local, station: index + 1 };
}

/* ========================================================================== *
 *  Layout — one long research building, a dome annex, an archive terrace
 * ========================================================================== */

export const RESEARCH_LAYOUT = Object.freeze({
  hall: {
    xMin: -240,
    xMax: 184,
    zNorth: -30,
    zSouth: 30,
    trussY: 17.5,
    floorY: 0,
  },
  stations: {
    atrium: { x: -205, z: -2 },
    optics: { x: -105, z: 0 },
    wetlab: { x: -6, z: 0 },
    compute: { x: 96, z: 0 },
    observatory: { x: 196, z: 0, y: 6 },
    archive: { x: 252, z: 4, y: 2 },
  },
  dome: { x: 196, z: 0, radius: 13, drumTop: 8 },
  terrace: { xMin: 212, xMax: 296, zMin: -24, zMax: 24 },
});

/* Where the interactive hero of each station sits — also the centre used by
   the click proxies and the zone map. */
export const PICK_ANCHORS = Object.freeze({
  atrium: { x: -186, y: 7, z: -3, r: 9 },
  optics: { x: -107, y: 2.2, z: 1, r: 8 },
  wetlab: { x: 0, y: 3.6, z: -2, r: 9 },
  compute: { x: 96, y: 6, z: -12, r: 11 },
  observatory: { x: 197, y: 7, z: 0, r: 11 },
  archive: { x: 252, y: 4.4, z: -5, r: 11 },
});

/* ========================================================================== *
 *  Small maths helpers
 * ========================================================================== */

const EPS = 1e-6;

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
  if (Math.abs(edge1 - edge0) < EPS) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function smootherstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / Math.max(EPS, edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(random, min, max) {
  return min + (max - min) * random();
}

function hash2i(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function noise2(x, y, seed = 0) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2i(ix, iy, seed);
  const b = hash2i(ix + 1, iy, seed);
  const c = hash2i(ix, iy + 1, seed);
  const d = hash2i(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function fbm2(x, y, octaves = 4, seed = 0) {
  let sum = 0;
  let amp = 0.5;
  let fx = x;
  let fy = y;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += amp * noise2(fx, fy, seed + i * 17);
    norm += amp;
    fx *= 2.04;
    fy *= 2.04;
    amp *= 0.5;
  }
  return sum / Math.max(EPS, norm);
}

/* ========================================================================== *
 *  Canvas texture factory — every texture below is painted at runtime
 * ========================================================================== */

const HAS_CANVAS = typeof document !== 'undefined' && typeof document.createElement === 'function';

function createCanvasTexture(width, height, draw, options = {}) {
  if (!HAS_CANVAS) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = options.wrapS !== undefined ? options.wrapS : THREE.RepeatWrapping;
  texture.wrapT = options.wrapT !== undefined ? options.wrapT : THREE.RepeatWrapping;
  if (options.repeat) texture.repeat.set(options.repeat[0], options.repeat[1]);
  texture.anisotropy = options.anisotropy || 8;
  texture.colorSpace = options.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function makeEnvironmentTexture() {
  return createCanvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      // A bright, slightly overcast sky with a warm horizon — the light the
      // atrium is designed around. It is reflected, never shown directly.
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0.0, '#3f6f9f');
      grad.addColorStop(0.34, '#86aac6');
      grad.addColorStop(0.5, '#d7d9cf');
      grad.addColorStop(0.58, '#f2e4c8');
      grad.addColorStop(0.64, '#b9a98d');
      grad.addColorStop(1.0, '#5c6450');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // the sun, low in the east, as a broad warm lobe
      const sun = ctx.createRadialGradient(w * 0.24, h * 0.4, 6, w * 0.24, h * 0.4, w * 0.34);
      sun.addColorStop(0, 'rgba(255,247,225,0.95)');
      sun.addColorStop(0.25, 'rgba(255,226,176,0.55)');
      sun.addColorStop(1, 'rgba(255,226,176,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);

      // glazing bars reflected in polished floors and metal
      ctx.globalAlpha = 0.16;
      for (let i = 0; i < 9; i += 1) {
        ctx.fillStyle = i % 2 ? '#fffaf0' : '#dce6ea';
        ctx.fillRect(w * (0.04 + i * 0.035), h * 0.16, 2, h * 0.5);
      }
      ctx.globalAlpha = 1;
    },
    { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );
}

function makeTerrazzoTexture() {
  const random = mulberry32(41231);
  return createCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#cdc8bb';
      ctx.fillRect(0, 0, w, h);
      // aggregate chips: warm white, grey, sand, a few brass flakes
      const chips = ['#efe9da', '#b9b2a2', '#a08c6c', '#8f9187', '#e3d6bb', '#c9a267'];
      for (let i = 0; i < 7000; i += 1) {
        const x = random() * w;
        const y = random() * h;
        const r = 0.6 + random() * 2.6;
        ctx.fillStyle = chips[Math.floor(random() * chips.length)];
        ctx.globalAlpha = 0.25 + random() * 0.5;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (0.55 + random() * 0.7), random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // a very faint polish sheen
      const sheen = ctx.createLinearGradient(0, 0, w, h);
      sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
      sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
      sheen.addColorStop(1, 'rgba(255,255,255,0.08)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);
    },
    { repeat: [3, 3] }
  );
}

function makeOakTexture() {
  const random = mulberry32(9182);
  return createCanvasTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#9b6b3f';
      ctx.fillRect(0, 0, w, h);
      // long, soft grain lines
      for (let i = 0; i < 260; i += 1) {
        const y = random() * h;
        const amp = 1.5 + random() * 5;
        ctx.strokeStyle = random() > 0.45 ? `rgba(70,42,20,${0.05 + random() * 0.16})` : `rgba(214,168,116,${0.05 + random() * 0.14})`;
        ctx.lineWidth = 0.7 + random() * 2.2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const yy = y + Math.sin(x * 0.017 + i) * amp;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      // a few knots
      for (let i = 0; i < 5; i += 1) {
        const x = random() * w;
        const y = random() * h;
        const r = 4 + random() * 9;
        for (let k = 0; k < 4; k += 1) {
          ctx.strokeStyle = `rgba(58,34,16,${0.18 - k * 0.03})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(x, y, r + k * 4, (r + k * 4) * 0.45, 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    { repeat: [2, 2] }
  );
}

function makeBrushedTexture() {
  return createCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#c6ced3';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1600; i += 1) {
        const y = Math.random() * h;
        const alpha = 0.04 + Math.random() * 0.10;
        ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(40,55,65,${alpha})`;
        ctx.lineWidth = 0.6 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }
    },
    { repeat: [4, 4] }
  );
}

function makePlasterTexture() {
  const random = mulberry32(772);
  return createCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#e4dfd3';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 14000; i += 1) {
        const v = 210 + random() * 34;
        ctx.fillStyle = `rgba(${v},${v - 5},${v - 12},${0.05 + random() * 0.16})`;
        ctx.fillRect(random() * w, random() * h, 1 + random() * 3, 1 + random() * 2);
      }
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = '#8d8574';
      for (let i = 0; i < 30; i += 1) {
        ctx.beginPath();
        ctx.moveTo(random() * w, 0);
        ctx.bezierCurveTo(random() * w, h * 0.4, random() * w, h * 0.7, random() * w, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { repeat: [2, 2] }
  );
}

function makePerforatedTexture() {
  return createCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#b9bcb8';
      ctx.fillRect(0, 0, w, h);
      const step = 10;
      for (let y = 5; y < h; y += step) {
        const offset = (Math.round(y / step) % 2) * (step * 0.5);
        for (let x = 5 + offset; x < w; x += step) {
          ctx.fillStyle = '#33393b';
          ctx.beginPath();
          ctx.arc(x, y, 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    { repeat: [4, 4] }
  );
}

function makeLabelTexture(title, subtitle, accent = '#f2c98a', options = {}) {
  const dark = options.dark !== false;
  return createCanvasTexture(
    1024,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = dark ? '#10151a' : '#ece6d8';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.14)' : 'rgba(30,30,30,0.18)';
      ctx.lineWidth = 4;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.fillStyle = accent;
      ctx.fillRect(14, 14, 12, h - 28);

      ctx.textBaseline = 'middle';
      ctx.fillStyle = dark ? '#f6efe2' : '#1d1a15';
      const titleSize = options.titleSize || 112;
      ctx.font = `700 ${titleSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.fillText(String(title).toUpperCase(), 62, h * 0.44);
      if (subtitle) {
        ctx.fillStyle = dark ? 'rgba(214,220,218,0.72)' : 'rgba(50,48,42,0.7)';
        ctx.font = `500 ${options.subtitleSize || 38}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        ctx.fillText(String(subtitle).toUpperCase(), 66, h * 0.78);
      }
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 420; i += 1) {
        ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1);
      }
      ctx.globalAlpha = 1;
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, anisotropy: 8 }
  );
}

function makeScreenTexture(kind, accent = '#7fe0c4', seed = 1) {
  const random = mulberry32(seed * 7919 + 13);
  return createCanvasTexture(
    512,
    320,
    (ctx, w, h) => {
      ctx.fillStyle = '#07120f';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(130,220,200,0.10)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const header =
        kind === 'cryo' ? 'DILUTION STAGE · mK' :
        kind === 'protein' ? 'FOLD TRAJECTORY · 1.8 Å' :
        kind === 'atlas' ? 'EMBEDDING ATLAS · UMAP' :
        kind === 'sky' ? 'TARGET QUEUE · TONIGHT' :
        'CAVITY LOCK · ERROR SIGNAL';
      ctx.fillStyle = accent;
      ctx.font = '700 20px "IBM Plex Mono", Menlo, monospace';
      ctx.fillText(header, 18, 30);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(18, 44);
      ctx.lineTo(w - 18, 44);
      ctx.stroke();

      if (kind === 'cryo') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i < 90; i += 1) {
          const x = 20 + (i / 89) * (w - 40);
          const y = 150 + Math.sin(i * 0.22) * 14 + (random() - 0.5) * 8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = '#eafaf4';
        ctx.font = '700 58px "IBM Plex Mono", Menlo, monospace';
        ctx.fillText('12.4', 26, 110);
        ctx.fillStyle = accent;
        ctx.font = '600 22px "IBM Plex Mono", Menlo, monospace';
        ctx.fillText('mK · stable', 200, 106);
        for (let i = 0; i < 8; i += 1) {
          ctx.fillStyle = i % 3 === 0 ? '#f2c98a' : accent;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(28 + i * 58, 250 - random() * 60, 26, 60 + random() * 30);
          ctx.globalAlpha = 1;
        }
      } else if (kind === 'protein') {
        // a helix ribbon
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 120; i += 1) {
          const t = i / 119;
          const x = 70 + t * (w - 140);
          const y = 160 + Math.sin(t * Math.PI * 5) * 62;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(242,201,138,0.85)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 22; i += 1) {
          const t = i / 21;
          const x = 70 + t * (w - 140);
          const y = 160 + Math.sin(t * Math.PI * 5) * 62;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 22, y + 26);
          ctx.stroke();
        }
      } else if (kind === 'atlas') {
        for (let i = 0; i < 260; i += 1) {
          const x = 24 + random() * (w - 48);
          const y = 62 + random() * (h - 92);
          const warm = random() > 0.82;
          ctx.fillStyle = warm ? 'rgba(242,201,138,0.9)' : 'rgba(127,224,196,0.65)';
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + random() * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (kind === 'sky') {
        ctx.fillStyle = 'rgba(8,16,26,1)';
        ctx.fillRect(18, 52, w - 36, h - 70);
        for (let i = 0; i < 180; i += 1) {
          ctx.fillStyle = `rgba(230,240,255,${0.3 + random() * 0.7})`;
          ctx.fillRect(20 + random() * (w - 40), 54 + random() * (h - 74), 1.6, 1.6);
        }
        ctx.strokeStyle = 'rgba(242,201,138,0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(90, 210);
        ctx.lineTo(210, 150);
        ctx.lineTo(330, 190);
        ctx.lineTo(430, 110);
        ctx.stroke();
        for (const [x, y] of [[90, 210], [210, 150], [330, 190], [430, 110]]) {
          ctx.fillStyle = '#f2c98a';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 100; i += 1) {
          const x = 20 + (i / 99) * (w - 40);
          const y = 160 + Math.sin(i * 0.4) * 30 * Math.exp(-i * 0.02) + (random() - 0.5) * 9;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(242,201,138,0.9)';
        ctx.font = '700 40px "IBM Plex Mono", Menlo, monospace';
        ctx.fillText('96.4 %', 250, 108);
      }

      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(150,230,210,0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );
}

function makePageTexture(entry, index = 0) {
  const accent = index % 2 === 0 ? '#b07c3c' : '#2f6f61';
  return createCanvasTexture(
    512,
    768,
    (ctx, w, h) => {
      ctx.fillStyle = '#f1eadb';
      ctx.fillRect(0, 0, w, h);
      // paper grain + a warm edge
      const random = mulberry32(91 + index * 37);
      for (let i = 0; i < 6000; i += 1) {
        ctx.fillStyle = `rgba(120,104,80,${0.02 + random() * 0.05})`;
        ctx.fillRect(random() * w, random() * h, 1.5, 1.5);
      }
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, w, 8);
      ctx.fillStyle = 'rgba(40,36,30,0.75)';
      ctx.font = '600 20px "IBM Plex Mono", Menlo, monospace';
      ctx.fillText(`PAPER ${String(index + 1).padStart(2, '0')} · ${entry.year}`, 42, 62);

      // title, wrapped by hand
      ctx.fillStyle = '#221f1a';
      ctx.font = '700 40px "Iowan Old Style", "Palatino Linotype", Georgia, serif';
      const words = String(entry.title).split(' ');
      let line = '';
      let y = 132;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > w - 84 && line) {
          ctx.fillText(line, 42, y);
          line = word;
          y += 48;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, 42, y);

      y += 74;
      ctx.strokeStyle = 'rgba(60,54,44,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(42, y - 30);
      ctx.lineTo(w - 42, y - 30);
      ctx.stroke();
      ctx.fillStyle = 'rgba(48,44,36,0.85)';
      ctx.font = '500 22px "Helvetica Neue", Helvetica, Arial, sans-serif';
      const authors = String(entry.authors).split(',');
      for (const author of authors) {
        ctx.fillText(author.trim(), 42, y);
        y += 30;
      }

      ctx.fillStyle = accent;
      ctx.font = '700 24px "IBM Plex Mono", Menlo, monospace';
      ctx.fillText(`${entry.venue} · ${entry.year}`, 42, h - 132);
      ctx.fillStyle = 'rgba(60,54,44,0.7)';
      ctx.font = '500 18px "IBM Plex Mono", Menlo, monospace';
      ctx.fillText(`doi ${entry.doi}`, 42, h - 96);
      ctx.fillStyle = 'rgba(60,54,44,0.5)';
      ctx.font = '600 16px "IBM Plex Mono", Menlo, monospace';
      ctx.fillText('RESEARCH LAB · OPEN ACCESS', 42, h - 54);
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, anisotropy: 8 }
  );
}

function makeRadialGlowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  return createCanvasTexture(
    128,
    128,
    (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, inner);
      g.addColorStop(0.28, inner.replace(/,\s*[\d.]+\)$/, ',0.55)'));
      g.addColorStop(1, outer);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );
}

function makeMistTexture() {
  return createCanvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 26; i += 1) {
        const x = w * 0.5 + (Math.random() - 0.5) * w * 0.6;
        const y = h * 0.5 + (Math.random() - 0.5) * h * 0.7;
        const r = 8 + Math.random() * 30;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.10)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );
}

/* ========================================================================== *
 *  GLSL helpers shared by the custom shaders
 * ========================================================================== */

const GLSL_NOISE = /* glsl */ `
  float rsHash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float rsHash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }
  float rsValueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = rsHash12(i);
    float b = rsHash12(i + vec2(1.0, 0.0));
    float c = rsHash12(i + vec2(0.0, 1.0));
    float d = rsHash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float rsFbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * rsValueNoise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return s;
  }
`;

const GLSL_FOG = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  vec3 rsApplyFog(vec3 color, float dist) {
    float f = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    return mix(color, uFogColor, clamp(f, 0.0, 1.0));
  }
`;

/* ========================================================================== *
 *  Material library
 * ========================================================================== */

function attachFloorShader(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.time;
    shader.uniforms.uSeamColor = uniforms.floorSeam;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRsFloorWorld;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvRsFloorWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vRsFloorWorld;
         uniform float uTime;
         uniform vec3 uSeamColor;
         ${GLSL_NOISE}
         vec3 rsFloorPattern(vec3 wp, float t, out float roughOut, out float glowOut) {
           vec2 p = wp.xz;
           float tile = 2.2;
           vec2 cell = p / tile;
           vec2 f = fract(cell);
           vec2 id = floor(cell);

           // a hairline grout: 3 mm on a 2.2 m tile
           vec2 edge = min(f, 1.0 - f);
           float width = 0.0025 + fwidth(p.x) * 0.8;
           float seam = 1.0 - smoothstep(width, width * 2.0, min(edge.x, edge.y));

           // terrazzo aggregate: a few scales of stone and a little brass
           float chipA = rsFbm(p * 3.1 + 11.0);
           float chipB = rsFbm(p * 9.4 + 3.0);
           float brass = smoothstep(0.74, 0.86, rsFbm(p * 5.7 + 21.0)) * 0.5;

           // a polished-slope sheen: light falling from the south glazing
           float sheen = smoothstep(-0.4, 1.0, sin(wp.z * 0.055 + 0.6)) * 0.028;
           sheen += smoothstep(0.4, -0.2, abs(wp.z - 14.0)) * 0.018;

           // a brass inlay every eighth tile, running with the building
           float laneId = floor(cell.y);
           float lane = 1.0 - step(0.5, mod(laneId, 8.0));
           float inlay = seam * lane * 0.8;

           // faint reflected daylight in the polish, moving very slowly
           float ripple = 0.5 + 0.5 * sin(wp.x * 0.06 - t * 0.55 + wp.z * 0.02);
           float polish = (0.02 + 0.03 * ripple) * (1.0 - seam);

           float detail = 1.0 - smoothstep(0.01, 0.06, fwidth(p.x));
           float chips = mix(0.86, 0.72 + chipA * 0.26 + chipB * 0.08, detail);

           vec3 stone = vec3(0.66, 0.63, 0.57) * chips;
           stone = mix(stone, vec3(0.60, 0.47, 0.30), brass * detail * 0.28);
           stone *= 1.0 - seam * 0.18;
           stone += uSeamColor * inlay * 0.05;

           float rough = clamp(0.24 + seam * 0.34 + chipB * 0.10 - polish * 0.35, 0.04, 1.0);
           roughOut = rough;
           glowOut = polish + inlay * 0.06;
           return stone;
         }
        `
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         float rsRough = 0.3;
         float rsGlow = 0.0;
         vec3 rsFloorCol = rsFloorPattern(vRsFloorWorld, uTime, rsRough, rsGlow);
         diffuseColor.rgb *= rsFloorCol;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = clamp(mix(roughnessFactor, rsRough, 0.9), 0.03, 1.0);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += uSeamColor * rsGlow * 0.5;`
      );
  };
  material.customProgramCacheKey = () => 'researchFloor';
}

function createMaterialSet(ctx) {
  const { envMap, textures } = ctx;

  const standard = (params) =>
    new THREE.MeshStandardMaterial({
      envMap,
      envMapIntensity: 0.85,
      ...params,
    });

  const mats = {};

  mats.steel = standard({ color: 0x9aa4ab, metalness: 0.92, roughness: 0.34, map: textures.brushed });
  mats.steelDark = standard({ color: 0x5f6a72, metalness: 0.85, roughness: 0.46 });
  mats.steelDeep = standard({ color: 0x39434a, metalness: 0.78, roughness: 0.54 });
  mats.blackened = standard({ color: 0x222a2e, metalness: 0.7, roughness: 0.52 });
  mats.aluminium = standard({ color: 0xc3cbd0, metalness: 0.95, roughness: 0.28 });
  mats.brass = standard({ color: 0xc9a063, metalness: 1.0, roughness: 0.26, envMapIntensity: 1.2 });
  mats.copper = standard({ color: 0xb8734c, metalness: 1.0, roughness: 0.3, envMapIntensity: 1.15 });
  mats.copperDark = standard({ color: 0x7c4a2e, metalness: 0.95, roughness: 0.42 });
  mats.gold = standard({ color: 0xe0b45c, metalness: 1.0, roughness: 0.18, envMapIntensity: 1.3 });
  mats.oak = standard({ color: 0xb98a56, metalness: 0.02, roughness: 0.72, map: textures.oak });
  mats.oakDark = standard({ color: 0x8a6038, metalness: 0.02, roughness: 0.78, map: textures.oak });
  mats.oakPale = standard({ color: 0xd2ab77, metalness: 0.02, roughness: 0.68, map: textures.oak });
  mats.plaster = standard({ color: 0xe2ddd0, metalness: 0.02, roughness: 0.92, map: textures.plaster });
  mats.plasterWarm = standard({ color: 0xd8cdb8, metalness: 0.02, roughness: 0.94, map: textures.plaster });
  mats.concrete = standard({ color: 0xa7a49c, metalness: 0.03, roughness: 0.9, map: textures.plaster });
  mats.concreteDark = standard({ color: 0x5c605e, metalness: 0.03, roughness: 0.94, map: textures.plaster });
  mats.perf = standard({ color: 0xa8adaa, metalness: 0.72, roughness: 0.5, map: textures.perf });
  mats.breadboard = standard({ color: 0x59636b, metalness: 0.62, roughness: 0.5, map: textures.perf });
  mats.hazard = standard({ color: 0xd8c07a, metalness: 0.2, roughness: 0.7 });
  mats.rubber = standard({ color: 0x14181a, metalness: 0.08, roughness: 0.94 });
  mats.stoneTop = standard({ color: 0xd7d2c6, metalness: 0.05, roughness: 0.42, map: textures.terrazzo });
  mats.leaf = standard({ color: 0x3f6a3a, metalness: 0.02, roughness: 0.8 });
  mats.leafDeep = standard({ color: 0x2c4f31, metalness: 0.02, roughness: 0.84 });
  mats.leafPale = standard({ color: 0x6d8f4e, metalness: 0.02, roughness: 0.78 });
  mats.soil = standard({ color: 0x3a2e22, metalness: 0.0, roughness: 0.96 });
  mats.water = new THREE.MeshStandardMaterial({
    color: 0x22343a,
    metalness: 0.95,
    roughness: 0.05,
    emissive: 0x0a1c24,
    emissiveIntensity: 0.6,
    envMap,
    envMapIntensity: 1.5,
    transparent: true,
    opacity: 0.94,
  });

  mats.floor = standard({
    color: 0xffffff,
    metalness: 0.16,
    roughness: 0.3,
    envMapIntensity: 0.7,
  });
  attachFloorShader(mats.floor, ctx.uniforms);

  mats.screenCryo = standard({
    color: 0x0a1210, metalness: 0.25, roughness: 0.32,
    map: textures.screenCryo, emissive: 0xffffff, emissiveMap: textures.screenCryo, emissiveIntensity: 0.9,
  });
  mats.screenProtein = standard({
    color: 0x0a1210, metalness: 0.25, roughness: 0.32,
    map: textures.screenProtein, emissive: 0xffffff, emissiveMap: textures.screenProtein, emissiveIntensity: 0.9,
  });
  mats.screenAtlas = standard({
    color: 0x0a1210, metalness: 0.25, roughness: 0.32,
    map: textures.screenAtlas, emissive: 0xffffff, emissiveMap: textures.screenAtlas, emissiveIntensity: 0.9,
  });
  mats.screenSky = standard({
    color: 0x070d16, metalness: 0.25, roughness: 0.32,
    map: textures.screenSky, emissive: 0xffffff, emissiveMap: textures.screenSky, emissiveIntensity: 1.0,
  });
  mats.screenLock = standard({
    color: 0x0a1210, metalness: 0.25, roughness: 0.32,
    map: textures.screenLock, emissive: 0xffffff, emissiveMap: textures.screenLock, emissiveIntensity: 0.9,
  });

  mats.glass = new THREE.MeshPhysicalMaterial({
    color: 0xcfe6ea,
    metalness: 0.0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.14,
    envMap,
    envMapIntensity: 1.7,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.glassSheet = new THREE.MeshPhysicalMaterial({
    color: 0xbcd8dd,
    metalness: 0.0,
    roughness: 0.04,
    transparent: true,
    opacity: 0.09,
    envMap,
    envMapIntensity: 1.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.glassGreen = new THREE.MeshPhysicalMaterial({
    color: 0x8fd8b4,
    metalness: 0.0,
    roughness: 0.08,
    transparent: true,
    opacity: 0.2,
    envMap,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.glassAmber = new THREE.MeshPhysicalMaterial({
    color: 0xf0c58c,
    metalness: 0.0,
    roughness: 0.08,
    transparent: true,
    opacity: 0.2,
    envMap,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.vacuum = new THREE.MeshPhysicalMaterial({
    color: 0xdfe9ec,
    metalness: 0.1,
    roughness: 0.03,
    transparent: true,
    opacity: 0.16,
    envMap,
    envMapIntensity: 1.6,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.glassDark = new THREE.MeshPhysicalMaterial({
    color: 0x1e2b2d,
    metalness: 0.45,
    roughness: 0.12,
    transparent: true,
    opacity: 0.4,
    envMap,
    envMapIntensity: 1.2,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
  });

  const emissive = (color, intensity = 1.5, base = 0x0a0f12) =>
    new THREE.MeshStandardMaterial({
      color: base,
      metalness: 0.2,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: intensity,
      envMap,
      envMapIntensity: 0.35,
    });

  mats.emitMint = emissive(0x6fe6c0, 1.6);
  mats.emitMintDeep = emissive(0x2fbf9a, 1.3);
  mats.emitAmber = emissive(0xf2b46a, 1.7);
  mats.emitWarm = emissive(0xffe0b0, 1.4);
  mats.emitWhite = emissive(0xf4fbff, 1.5);
  mats.emitRed = emissive(0xff6a58, 1.6);
  mats.emitViolet = emissive(0xa48bff, 1.4);
  mats.emitGreen = emissive(0x62ff8a, 1.8);

  mats.lamp = standard({ color: 0x2a251c, metalness: 0.6, roughness: 0.4, emissive: 0xffdfae, emissiveIntensity: 2.2 });
  mats.paperLantern = standard({
    color: 0xf3e8d0, metalness: 0.0, roughness: 0.7,
    emissive: 0xffce8a, emissiveIntensity: 1.25, transparent: true, opacity: 0.94,
  });

  mats.glow = {
    mint: new THREE.MeshBasicMaterial({ color: 0x7fe8c8, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    amber: new THREE.MeshBasicMaterial({ color: 0xffc078, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    green: new THREE.MeshBasicMaterial({ color: 0x8dff9e, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    red: new THREE.MeshBasicMaterial({ color: 0xff7a63, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  };

  return mats;
}

/* ========================================================================== *
 *  Geometry helpers
 * ========================================================================== */

function mergeParts(parts) {
  const geometries = [];
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();

  for (const part of parts) {
    let geo = part.geometry ? part.geometry.clone() : new THREE.BoxGeometry(part.w || 1, part.h || 1, part.d || 1);
    if (geo.index) geo = geo.toNonIndexed();
    euler.set(part.rx || 0, part.ry || 0, part.rz || 0);
    quat.setFromEuler(euler);
    scale.set(part.sx || 1, part.sy || 1, part.sz || 1);
    position.set(part.x || 0, part.y || 0, part.z || 0);
    matrix.compose(position, quat, scale);
    geo.applyMatrix4(matrix);
    geometries.push(geo);
  }

  let total = 0;
  for (const geo of geometries) total += geo.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uvs = new Float32Array(total * 2);
  let offset = 0;
  for (const geo of geometries) {
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    const uv = geo.attributes.uv;
    pos.set(p.array, offset * 3);
    if (n) nor.set(n.array, offset * 3);
    if (uv) uvs.set(uv.array, offset * 2);
    offset += p.count;
    geo.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.computeBoundingSphere();
  return merged;
}

function makeMesh(geometry, material, name) {
  const mesh = new THREE.Mesh(geometry, material);
  if (name) mesh.name = name;
  return mesh;
}

function box(w, h, d, material, x, y, z, ry = 0, name) {
  const mesh = makeMesh(new THREE.BoxGeometry(w, h, d), material, name);
  mesh.position.set(x, y, z);
  if (ry) mesh.rotation.y = ry;
  return mesh;
}

function tubeGeometry(points, radius, tubular = 48, radial = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.5);
  return new THREE.TubeGeometry(curve, tubular, radius, radial, closed);
}

function glowSprite(texture, color, size, opacity = 0.8) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}

function cylinder(radiusTop, radiusBottom, height, material, x, y, z, segments = 16, name) {
  const mesh = makeMesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, name);
  mesh.position.set(x, y, z);
  return mesh;
}

function beamBetween(a, b, radius, material, name) {
  const from = new THREE.Vector3(a[0], a[1], a[2]);
  const to = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, length, 6, 1, true);
  const mesh = makeMesh(geo, material, name);
  mesh.position.copy(from).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/* ========================================================================== *
 *  Quality presets
 * ========================================================================== */

const QUALITY_PRESETS = {
  high: {
    pixelRatio: 2,
    plantCount: 320,
    treeCount: 96,
    slatCount: 240,
    bubbleCount: 72,
    atlasNodes: 190,
    starSprites: 40,
    shadowMapSize: 2048,
    detail: 1.0,
  },
  medium: {
    pixelRatio: 1.5,
    plantCount: 220,
    treeCount: 64,
    slatCount: 160,
    bubbleCount: 48,
    atlasNodes: 120,
    starSprites: 24,
    shadowMapSize: 1024,
    detail: 0.8,
  },
  low: {
    pixelRatio: 1,
    plantCount: 140,
    treeCount: 40,
    slatCount: 110,
    bubbleCount: 34,
    atlasNodes: 80,
    starSprites: 14,
    shadowMapSize: 0,
    detail: 0.55,
  },
};

function resolveConfig(options = {}) {
  const quality = QUALITY_PRESETS[options.quality] ? options.quality : 'high';
  const preset = QUALITY_PRESETS[quality];
  const detectedPixelRatio =
    typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
  return {
    quality,
    ...preset,
    seed: Number.isFinite(options.seed) ? options.seed : 20261120,
    pixelRatio: Number.isFinite(options.pixelRatio) ? options.pixelRatio : Math.min(detectedPixelRatio, preset.pixelRatio),
    compositionShift: Number.isFinite(options.compositionShift) ? options.compositionShift : 0.24,
    manageFog: options.manageFog !== false,
    manageBackground: options.manageBackground !== false,
    shadows: options.shadows !== false && preset.shadowMapSize > 0,
    animate: options.animate !== false,
    viewportAspect: Number.isFinite(options.aspect) ? options.aspect : 16 / 9,
  };
}

/* ========================================================================== *
 *  Environment — sky, meadow, skyline, and the architecture of the building
 * ========================================================================== */

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const SKY_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform float uTime;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform float uNight;
  ${GLSL_NOISE}

  void main() {
    vec3 dir = normalize(vDir);
    float up = clamp(dir.y, -1.0, 1.0);

    vec3 zenith = mix(uZenith, vec3(0.010, 0.018, 0.050), uNight);
    vec3 horizon = mix(uHorizon, vec3(0.060, 0.075, 0.150), uNight);
    float t = pow(clamp(up, 0.0, 1.0), 0.52);
    vec3 col = mix(horizon, zenith, t);

    // low sun: a hard disc and a broad warm lobe, extinguished at twilight
    float sunDot = max(0.0, dot(dir, normalize(uSunDir)));
    col += vec3(1.0, 0.92, 0.74) * pow(sunDot, 420.0) * 2.2 * (1.0 - uNight);
    col += vec3(1.0, 0.80, 0.55) * pow(sunDot, 9.0) * 0.22 * (1.0 - uNight * 0.92);

    // warm haze sitting on the horizon line
    float horizonLine = exp(-pow(up / 0.065, 2.0));
    col += mix(vec3(1.0, 0.90, 0.72), vec3(0.16, 0.15, 0.26), uNight) * horizonLine * 0.20;

    // stars, revealed as the sky deepens; a gaussian dot reads round at any size
    vec2 suv = vec2(atan(dir.z, dir.x) * 0.1591549 + 0.5, asin(clamp(dir.y, -1.0, 1.0)) * 0.3183099 + 0.5);
    vec2 grid = suv * vec2(1180.0, 590.0);
    vec2 gid = floor(grid);
    vec2 gf = fract(grid) - 0.5;
    float rnd = rsHash12(gid);
    float bright = step(0.984, rnd);
    float size = mix(0.16, 0.40, rsHash12(gid + 3.7));
    float star = bright * exp(-pow(length(gf) / size, 2.0) * 2.6);
    float twinkle = 0.68 + 0.32 * sin(uTime * (1.1 + rnd * 3.2) + rnd * 61.0);
    float starMask = smoothstep(0.02, 0.26, up) * (0.24 + 0.95 * uNight);
    col += vec3(0.84, 0.90, 1.0) * star * twinkle * starMask * 1.15;
    col += vec3(1.0, 0.88, 0.70) * star * starMask * rsHash12(gid + 8.1) * 0.5 * uNight;

    // a faint galactic band across the summer sky
    float bandY = up - (0.30 + 0.13 * sin(dir.x * 2.1 + dir.z * 1.4));
    float band = exp(-pow(bandY / 0.17, 2.0));
    float neb = rsFbm(vec2(atan(dir.z, dir.x) * 2.3, up * 5.0) + 3.0);
    col += vec3(0.24, 0.28, 0.48) * band * neb * 0.20 * smoothstep(0.0, 0.2, up) * uNight;

    // thin, high cirrus by day, gone by night
    float cloudH = smoothstep(0.0, 0.14, up) * (1.0 - smoothstep(0.20, 0.46, up));
    float cl = rsFbm(vec2(atan(dir.z, dir.x) * 4.2 + uTime * 0.004, up * 22.0));
    float clouds = smoothstep(0.54, 0.80, cl) * cloudH * (1.0 - uNight * 0.9);
    col = mix(col, mix(horizon * 1.1, vec3(1.0, 0.99, 0.96), 0.55), clouds * 0.38);

    // below the horizon: ground haze, never black
    col = mix(col, horizon * 0.32, smoothstep(0.0, -0.22, up));

    gl_FragColor = vec4(col, 1.0);
  }
`;

function buildSky(ctx) {
  const uniforms = {
    uTime: ctx.uniforms.time,
    uZenith: { value: new THREE.Color(0x4a7ba6) },
    uHorizon: { value: new THREE.Color(0xd9d7c7) },
    uSunDir: { value: new THREE.Vector3(0.22, 0.42, 0.88).normalize() },
    uNight: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 32), material);
  mesh.name = 'ResearchSky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  ctx.group.add(mesh);
  return { mesh, uniforms };
}

function buildLandscape(ctx) {
  const { mats } = ctx;
  const random = mulberry32(ctx.cfg.seed + 7);
  const group = new THREE.Group();
  group.name = 'ResearchLandscape';

  const meadowMat = new THREE.MeshStandardMaterial({
    color: 0x8b916b,
    metalness: 0.0,
    roughness: 0.97,
    map: ctx.textures.plaster,
    envMap: ctx.envMap,
    envMapIntensity: 0.3,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3400, 3400, 1, 1), meadowMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.52;
  ground.receiveShadow = true;
  ground.name = 'ResearchMeadow';
  group.add(ground);

  // a lake north of the glass wall, catching the sky
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(260, 120), mats.water);
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(110, -0.44, -190);
  lake.name = 'ResearchLake';
  group.add(lake);

  // gravel apron along the north facade
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(520, 26), mats.concrete);
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(-30, -0.46, -44);
  group.add(apron);

  /* ---- low hills, three ridge lines ------------------------------------ */
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0x6d7a62,
    metalness: 0.0,
    roughness: 0.98,
    envMap: ctx.envMap,
    envMapIntensity: 0.25,
  });
  for (const [distance, height, tint] of [
    [-280, 26, 0x6b7a63],
    [-420, 46, 0x62705f],
    [-620, 74, 0x59665c],
  ]) {
    const geo = new THREE.PlaneGeometry(1500, 220, 70, 12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const n = fbm2(x * 0.006 + 3.2, y * 0.01 + 1.7, 4, 11);
      pos.setZ(i, (n - 0.5) * height * 1.6 * smoothstep(110, 0, Math.abs(y)));
    }
    geo.computeVertexNormals();
    const hill = new THREE.Mesh(geo, hillMat.clone());
    hill.material.color.setHex(tint);
    hill.rotation.x = -Math.PI / 2;
    hill.position.set(-60, -1.2, distance);
    group.add(hill);
  }

  /* ---- trees: a wood beyond the north lawn ----------------------------- */
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 3.2, 5, 1);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const count = ctx.cfg.treeCount;
  const trunks = new THREE.InstancedMesh(trunkGeo, mats.oakDark, count);
  const crowns = new THREE.InstancedMesh(crownGeo, mats.leaf, count);
  const crowns2 = new THREE.InstancedMesh(crownGeo, mats.leafDeep, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const x = -260 + random() * 560;
    const z = -46 - random() * 130;
    const h = randRange(random, 2.4, 5.6);
    p.set(x, h * 0.42 - 0.5, z);
    s.set(1, h / 3.2, 1);
    q.identity();
    m.compose(p, q, s);
    trunks.setMatrixAt(i, m);

    const rr = randRange(random, 2.0, 3.6);
    p.set(x, h + rr * 0.45 - 0.5, z);
    s.set(rr, rr * randRange(random, 1.0, 1.5), rr);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI);
    m.compose(p, q, s);
    crowns.setMatrixAt(i, m);
    color.setHSL(0.26 + random() * 0.06, 0.26 + random() * 0.16, 0.28 + random() * 0.12);
    crowns.setColorAt(i, color);

    p.set(x + randRange(random, -1.2, 1.2), h + rr * 0.8 - 0.5, z + randRange(random, -1.2, 1.2));
    s.set(rr * 0.8, rr * 0.9, rr * 0.8);
    m.compose(p, q, s);
    crowns2.setMatrixAt(i, m);
    color.setHSL(0.28 + random() * 0.05, 0.3, 0.2 + random() * 0.1);
    crowns2.setColorAt(i, color);
  }
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  crowns2.instanceMatrix.needsUpdate = true;
  trunks.castShadow = false;
  group.add(trunks, crowns, crowns2);

  // a weather station and a lone bench on the lawn
  const mast = cylinder(0.08, 0.11, 6.2, mats.aluminium, -70, 2.6, -52, 8);
  group.add(mast);
  group.add(box(0.5, 0.36, 0.3, mats.aluminium, -70, 5.7, -52, 0.4));

  /* ---- distant village lights (off until dusk) -------------------------- */
  const lightGeo = new THREE.SphereGeometry(0.5, 6, 4);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffcf8f, transparent: true, opacity: 0.0 });
  const lightCount = 90;
  const village = new THREE.InstancedMesh(lightGeo, lightMat, lightCount);
  for (let i = 0; i < lightCount; i += 1) {
    const x = -340 + random() * 700;
    const z = -230 - random() * 220;
    p.set(x, -0.3 + random() * 1.4, z);
    s.setScalar(0.7 + random() * 1.1);
    q.identity();
    m.compose(p, q, s);
    village.setMatrixAt(i, m);
  }
  village.instanceMatrix.needsUpdate = true;
  group.add(village);

  ctx.group.add(group);
  ctx.landscape = { village, lightMat };
  return group;
}

/* -------------------------------------------------------------------------- *
 *  Architectural shell — floor, columns, glass walls, timber roof, pendants
 * -------------------------------------------------------------------------- */

function buildShell(ctx) {
  const { mats, cfg } = ctx;
  const hall = RESEARCH_LAYOUT.hall;
  const group = new THREE.Group();
  group.name = 'ResearchShell';

  /* ---- floor slab, polished terrazzo, brass threshold ------------------ */
  const slab = box(hall.xMax - hall.xMin, 0.8, hall.zSouth - hall.zNorth, mats.concreteDark,
    (hall.xMin + hall.xMax) / 2, -0.4, 0);
  slab.receiveShadow = true;
  group.add(slab);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(hall.xMax - hall.xMin, hall.zSouth - hall.zNorth),
    mats.floor
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((hall.xMin + hall.xMax) / 2, 0.012, 0);
  floor.receiveShadow = true;
  floor.name = 'ResearchTerrazzo';
  group.add(floor);

  // brass expansion joints across the nave
  const jointGeo = new THREE.BoxGeometry(0.12, 0.02, hall.zSouth - hall.zNorth);
  const jointCount = 24;
  const joints = new THREE.InstancedMesh(jointGeo, mats.brass, jointCount);
  for (let i = 0; i < jointCount; i += 1) {
    const m = new THREE.Matrix4().makeTranslation(hall.xMin + 12 + i * 18, 0.03, 0);
    joints.setMatrixAt(i, m);
  }
  joints.instanceMatrix.needsUpdate = true;
  group.add(joints);

  /* ---- timber-clad columns, both sides -------------------------------- */
  const columnGeo = mergeParts([
    { w: 0.78, h: 15.4, d: 0.78, x: 0, y: 7.7, z: 0 },
    { w: 0.96, h: 0.34, d: 0.96, x: 0, y: 0.18, z: 0 },
    { w: 1.02, h: 0.26, d: 1.02, x: 0, y: 15.2, z: 0 },
  ]);
  const positions = [];
  for (let x = hall.xMin + 10; x <= hall.xMax - 6; x += 18) {
    positions.push([x, hall.zNorth + 3.6], [x, hall.zSouth - 3.6]);
  }
  const columns = new THREE.InstancedMesh(columnGeo, mats.oakDark, positions.length);
  columns.castShadow = true;
  columns.receiveShadow = true;
  const mm = new THREE.Matrix4();
  positions.forEach(([x, z], i) => {
    mm.makeTranslation(x, 0, z);
    columns.setMatrixAt(i, mm);
  });
  columns.instanceMatrix.needsUpdate = true;
  group.add(columns);

  // steel collars at the column bases
  const collarGeo = new THREE.BoxGeometry(0.92, 0.08, 0.92);
  const collars = new THREE.InstancedMesh(collarGeo, mats.steelDark, positions.length);
  positions.forEach(([x, z], i) => {
    mm.makeTranslation(x, 0.42, z);
    collars.setMatrixAt(i, mm);
  });
  collars.instanceMatrix.needsUpdate = true;
  group.add(collars);

  /* ---- north curtain wall: glazed lookout onto the meadow ------------- */
  const zN = hall.zNorth;
  const glazing = new THREE.Mesh(
    new THREE.PlaneGeometry(hall.xMax - hall.xMin, 15.4),
    mats.glassSheet
  );
  glazing.position.set((hall.xMin + hall.xMax) / 2, 7.7, zN + 0.06);
  group.add(glazing);

  // mullions and transoms
  const mullionGeo = new THREE.BoxGeometry(0.16, 15.4, 0.22);
  const mullionCount = Math.floor((hall.xMax - hall.xMin) / 3.2) + 1;
  const mullions = new THREE.InstancedMesh(mullionGeo, mats.steelDark, mullionCount);
  for (let i = 0; i < mullionCount; i += 1) {
    mm.makeTranslation(hall.xMin + i * 3.2, 7.7, zN + 0.16);
    mullions.setMatrixAt(i, mm);
  }
  mullions.instanceMatrix.needsUpdate = true;
  group.add(mullions);

  for (const y of [3.4, 7.4, 11.4]) {
    group.add(box(hall.xMax - hall.xMin, 0.14, 0.2, mats.steelDark,
      (hall.xMin + hall.xMax) / 2, y, zN + 0.16));
  }
  group.add(box(hall.xMax - hall.xMin, 0.5, 0.34, mats.steelDark,
    (hall.xMin + hall.xMax) / 2, 15.5, zN + 0.16));
  // a deep timber sill with a bench run along the glass
  group.add(box(hall.xMax - hall.xMin, 0.42, 0.9, mats.oak,
    (hall.xMin + hall.xMax) / 2, 0.21, zN + 0.6));

  /* ---- south wall: plaster base, clerestory, timber battens ----------- */
  const zS = hall.zSouth;
  const base = box(hall.xMax - hall.xMin, 7.4, 0.5, mats.plasterWarm,
    (hall.xMin + hall.xMax) / 2, 3.7, zS - 0.25);
  base.receiveShadow = true;
  group.add(base);

  const clerestory = new THREE.Mesh(
    new THREE.PlaneGeometry(hall.xMax - hall.xMin, 7.4),
    mats.glassSheet
  );
  clerestory.rotation.y = Math.PI;
  clerestory.position.set((hall.xMin + hall.xMax) / 2, 11.3, zS - 0.06);
  group.add(clerestory);

  // vertical timber battens on the plaster, and a rhythm of vertical fins
  const battenGeo = new THREE.BoxGeometry(0.14, 7.2, 0.1);
  const battenCount = Math.floor((hall.xMax - hall.xMin) / 1.6);
  const battens = new THREE.InstancedMesh(battenGeo, mats.oak, battenCount);
  for (let i = 0; i < battenCount; i += 1) {
    mm.makeTranslation(hall.xMin + 0.8 + i * 1.6, 3.7, zS - 0.56);
    battens.setMatrixAt(i, mm);
  }
  battens.instanceMatrix.needsUpdate = true;
  group.add(battens);

  const finGeo = new THREE.BoxGeometry(0.12, 7.4, 0.5);
  const finCount = Math.floor((hall.xMax - hall.xMin) / 2.4);
  const fins = new THREE.InstancedMesh(finGeo, mats.oakDark, finCount);
  for (let i = 0; i < finCount; i += 1) {
    mm.makeTranslation(hall.xMin + 1.2 + i * 2.4, 11.3, zS - 0.3);
    fins.setMatrixAt(i, mm);
  }
  fins.instanceMatrix.needsUpdate = true;
  group.add(fins);

  for (const y of [7.5, 12.0, 15.0]) {
    group.add(box(hall.xMax - hall.xMin, 0.16, 0.24, mats.steelDark,
      (hall.xMin + hall.xMax) / 2, y, zS - 0.12));
  }

  /* ---- west wall (behind the camera at the entrance) ------------------ */
  group.add(box(0.6, 15.4, hall.zSouth - hall.zNorth, mats.plaster,
    hall.xMin - 0.3, 7.7, 0));
  // entrance doors in bronze
  group.add(box(0.14, 3.6, 5.4, mats.brass, hall.xMin + 0.02, 1.8, 8));
  group.add(box(0.2, 0.12, 5.6, mats.steelDeep, hall.xMin + 0.04, 3.66, 8));

  /* ---- east wall with a portal into the dome annex -------------------- */
  const portalZ = 0;
  const portalHalf = 3.2;
  group.add(box(0.5, 15.4, (hall.zSouth - portalZ) - portalHalf, mats.plaster,
    hall.xMax + 0.25, 7.7, (hall.zSouth + portalZ + portalHalf) / 2));
  group.add(box(0.5, 15.4, (portalZ - portalHalf) - hall.zNorth, mats.plaster,
    hall.xMax + 0.25, 7.7, (hall.zNorth + portalZ - portalHalf) / 2));
  group.add(box(0.5, 6.4, portalHalf * 2, mats.plaster,
    hall.xMax + 0.25, 12.2, portalZ));
  group.add(box(0.6, 0.3, portalHalf * 2 + 0.6, mats.oakDark,
    hall.xMax + 0.2, 5.9, portalZ));

  /* ---- timber roof: trusses, purlins, skylight band, brise-soleil ----- */
  const beamMat = mats.oakDark;
  for (let x = hall.xMin + 10; x <= hall.xMax - 6; x += 18) {
    group.add(box(0.42, 0.95, hall.zSouth - hall.zNorth, beamMat, x, 15.9, 0));
    // a shallow V-hanger under each beam
    const hanger = box(0.24, 0.24, 46, mats.steelDark, x, 15.25, 0);
    group.add(hanger);
  }
  for (let z = hall.zNorth + 2; z <= hall.zSouth - 2; z += 5.8) {
    group.add(box(hall.xMax - hall.xMin, 0.22, 0.22, beamMat, (hall.xMin + hall.xMax) / 2, 16.6, z));
  }

  // solid roof decks north and south of the central skylight band
  for (const [z0, z1] of [[hall.zNorth, -7.5], [7.5, hall.zSouth]]) {
    const deck = box(hall.xMax - hall.xMin, 0.34, z1 - z0, mats.plaster,
      (hall.xMin + hall.xMax) / 2, 17.15, (z0 + z1) / 2);
    group.add(deck);
  }

  const skylight = new THREE.Mesh(
    new THREE.PlaneGeometry(hall.xMax - hall.xMin, 15),
    mats.glassSheet
  );
  skylight.rotation.x = Math.PI / 2;
  skylight.position.set((hall.xMin + hall.xMax) / 2, 17.2, 0);
  group.add(skylight);

  // skylight ribs and the slatted brise-soleil that patterns the floor
  const slatGeo = new THREE.BoxGeometry(0.16, 0.34, 14.6);
  const slats = new THREE.InstancedMesh(slatGeo, mats.oakPale, cfg.slatCount);
  for (let i = 0; i < cfg.slatCount; i += 1) {
    const x = hall.xMin + 4 + (i / Math.max(1, cfg.slatCount - 1)) * (hall.xMax - hall.xMin - 8);
    mm.makeRotationZ(i % 2 ? 0.12 : -0.1);
    mm.setPosition(x, 16.7, 0);
    slats.setMatrixAt(i, mm);
  }
  slats.instanceMatrix.needsUpdate = true;
  group.add(slats);

  // roof lantern ridge running the length of the building
  group.add(box(hall.xMax - hall.xMin, 0.5, 0.5, mats.oakDark, (hall.xMin + hall.xMax) / 2, 17.5, 0));

  // glazing bars across the skylight, so the roof reads as glass and not as sky
  const glazingBarGeo = new THREE.BoxGeometry(0.08, 0.14, 14.8);
  const glazingBarCount = Math.floor((hall.xMax - hall.xMin) / 2.4);
  const glazingBars = new THREE.InstancedMesh(glazingBarGeo, mats.steelDark, glazingBarCount);
  for (let i = 0; i < glazingBarCount; i += 1) {
    mm.makeTranslation(hall.xMin + 1.2 + i * 2.4, 17.06, 0);
    glazingBars.setMatrixAt(i, mm);
  }
  glazingBars.instanceMatrix.needsUpdate = true;
  group.add(glazingBars);

  /* ---- hanging linear pendants along the nave ------------------------ */
  const pendantGeo = new THREE.BoxGeometry(4.6, 0.07, 0.14);
  const pendantCount = Math.floor((hall.xMax - hall.xMin) / 12);
  const pendants = new THREE.InstancedMesh(pendantGeo, mats.emitWarm, pendantCount);
  const housingGeo = new THREE.BoxGeometry(4.8, 0.13, 0.26);
  const housings = new THREE.InstancedMesh(housingGeo, mats.steelDeep, pendantCount);
  const cableGeo = new THREE.CylinderGeometry(0.012, 0.012, 5.4, 4, 1);
  const cables = new THREE.InstancedMesh(cableGeo, mats.steelDark, pendantCount * 2);
  for (let i = 0; i < pendantCount; i += 1) {
    const x = hall.xMin + 12 + i * 12;
    mm.makeTranslation(x, 10.2, 0);
    pendants.setMatrixAt(i, mm);
    mm.makeTranslation(x, 10.31, 0);
    housings.setMatrixAt(i, mm);
    mm.makeTranslation(x - 2.0, 13.0, 0);
    cables.setMatrixAt(i * 2, mm);
    mm.makeTranslation(x + 2.0, 13.0, 0);
    cables.setMatrixAt(i * 2 + 1, mm);
  }
  pendants.instanceMatrix.needsUpdate = true;
  housings.instanceMatrix.needsUpdate = true;
  cables.instanceMatrix.needsUpdate = true;
  group.add(pendants, housings, cables);

  /* ---- a long oak bench along the glass, and a reading shelf --------- */
  group.add(box(14, 0.12, 0.62, mats.oakPale, -150, 0.62, hall.zNorth + 1.7));
  for (const x of [-156, -150, -144]) {
    group.add(box(0.16, 0.6, 0.5, mats.steelDark, x, 0.3, hall.zNorth + 1.7));
  }

  /* ---- a light timber colonnade inside the glass wall ---------------- */
  group.add(box(hall.xMax - hall.xMin - 6, 0.16, 0.16, mats.oak, (hall.xMin + hall.xMax) / 2, 5.9, hall.zNorth + 1.15));
  const colonnadeGeo = new THREE.BoxGeometry(0.1, 5.9, 0.1);
  const colonnadeCount = Math.floor((hall.xMax - hall.xMin) / 9);
  const colonnade = new THREE.InstancedMesh(colonnadeGeo, mats.oak, colonnadeCount);
  for (let i = 0; i < colonnadeCount; i += 1) {
    mm.makeTranslation(hall.xMin + 5 + i * 9, 2.95, hall.zNorth + 1.15);
    colonnade.setMatrixAt(i, mm);
  }
  colonnade.instanceMatrix.needsUpdate = true;
  group.add(colonnade);

  // planters and benches in the bays along the glass
  const planterGeo = new THREE.BoxGeometry(2.6, 0.55, 0.8);
  const planterCount = Math.floor((hall.xMax - hall.xMin) / 18);
  const planters = new THREE.InstancedMesh(planterGeo, mats.concrete, planterCount);
  const shrubGeo = new THREE.IcosahedronGeometry(0.55, 1);
  const shrubs = new THREE.InstancedMesh(shrubGeo, mats.leaf, planterCount * 3);
  const random = mulberry32(ctx.cfg.seed + 121);
  const sh = new THREE.Vector3();
  const sq = new THREE.Quaternion();
  const sc = new THREE.Color();
  for (let i = 0; i < planterCount; i += 1) {
    const x = hall.xMin + 10 + i * 18;
    const z = hall.zNorth + 2.6;
    mm.makeTranslation(x, 0.28, z);
    planters.setMatrixAt(i, mm);
    for (let b = 0; b < 3; b += 1) {
      sh.set(x - 0.8 + b * 0.8, 0.85 + random() * 0.3, z + (random() - 0.5) * 0.3);
      const sca = 0.8 + random() * 0.5;
      sq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * 3);
      const scaleVec = new THREE.Vector3(sca, sca * 1.2, sca);
      mm.compose(sh, sq, scaleVec);
      shrubs.setMatrixAt(i * 3 + b, mm);
      sc.setHSL(0.26 + random() * 0.08, 0.28 + random() * 0.2, 0.22 + random() * 0.14);
      shrubs.setColorAt(i * 3 + b, sc);
    }
  }
  planters.instanceMatrix.needsUpdate = true;
  shrubs.instanceMatrix.needsUpdate = true;
  group.add(planters, shrubs);

  ctx.group.add(group);
  return group;
}

/* -------------------------------------------------------------------------- *
 *  Signage — hanging station plates and wall numerals
 * -------------------------------------------------------------------------- */

function buildSignage(ctx) {
  const { mats, textures } = ctx;
  const group = new THREE.Group();
  group.name = 'ResearchSignage';
  const plates = [
    ['01 · ATRIUM', 'Research atrium & living lattice', -162, 'Atrium'],
    ['02 · OPTICS', 'Quantum & cryo-optics bench', -105, 'Optics'],
    ['03 · WET LAB', 'Bio-simulation core', -6, 'Wet Lab'],
    ['04 · COMPUTE', 'Supercomputing & dataset atlas', 96, 'Compute'],
    ['05 · OBSERVATORY', 'Sky-dome & orbital arcs', 172, 'Observatory'],
  ];
  for (const [title, subtitle, x, tag] of plates) {
    const texture = makeLabelTexture(title, subtitle, '#f2c98a', { dark: true, titleSize: 92 });
    if (texture) ctx.extraTextures.push(texture);
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0xffffff,
      emissiveMap: texture,
      emissiveIntensity: 0.35,
      metalness: 0.3,
      roughness: 0.55,
      envMap: ctx.envMap,
      envMapIntensity: 0.4,
    });
    ctx.addMaterial(mat);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), mat);
    plate.position.set(x, 7.4, -1.5);
    plate.rotation.y = 0.02;
    group.add(plate);
    // thin frame and two hanger rods
    group.add(box(6.6, 0.06, 0.08, mats.brass, x, 8.24, -1.5));
    group.add(box(6.6, 0.06, 0.08, mats.brass, x, 6.56, -1.5));
    for (const dx of [-2.6, 2.6]) {
      group.add(cylinder(0.018, 0.018, 7.8, mats.steelDark, x + dx, 12.1, -1.5, 5));
    }
  }

  // large numerals on the south plaster wall, one per station
  const numerals = [
    ['01', -205], ['02', -105], ['03', -6], ['04', 96], ['05', 176],
  ];
  for (const [num, x] of numerals) {
    const texture = makeLabelTexture(num, 'research station', '#f2c98a', { dark: false, titleSize: 150 });
    if (!texture) continue;
    ctx.extraTextures.push(texture);
    const mat = new THREE.MeshStandardMaterial({
      map: texture, transparent: true, metalness: 0.1, roughness: 0.9,
      envMap: ctx.envMap, envMapIntensity: 0.2,
    });
    ctx.addMaterial(mat);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.4), mat);
    plane.position.set(x, 5.2, RESEARCH_LAYOUT.hall.zSouth - 0.52);
    plane.rotation.y = Math.PI;
    group.add(plane);
  }

  ctx.group.add(group);
  return group;
}

/* ========================================================================== *
 *  Station 01 — Research Atrium & Living Lattice
 * ========================================================================== */

function buildAtrium(ctx) {
  const { mats, cfg } = ctx;
  const root = new THREE.Group();
  root.name = 'StationAtrium';
  root.userData.stationId = 'atrium';
  root.userData.stationIndex = 0;

  const CX = -205;

  /* ---- the suspended molecular sculpture ----------------------------- */
  const sculpture = new THREE.Group();
  sculpture.name = 'MolecularSculpture';
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 0), mats.brass);
  sculpture.add(nucleus);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.98, 1), mats.emitAmber);
  sculpture.add(core);

  const atomDirs = [
    [1, 0.35, 0.2], [-1, 0.3, -0.1], [0.25, 1, 0.15], [0.1, -0.95, 0.3],
    [0.2, 0.25, 1], [-0.15, 0.2, -1],
  ];
  const atoms = [];
  atomDirs.forEach((dir, index) => {
    const v = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(3.1);
    const atom = new THREE.Mesh(
      new THREE.IcosahedronGeometry(index % 2 ? 0.55 : 0.72, 1),
      index % 3 === 0 ? mats.emitMint : index % 3 === 1 ? mats.copper : mats.glassGreen
    );
    atom.position.copy(v);
    sculpture.add(atom);
    atoms.push(atom);
    const bond = beamBetween([0, 0, 0], [v.x, v.y, v.z], 0.075, mats.brass);
    sculpture.add(bond);
  });
  // secondary bonds between neighbouring atoms
  for (let i = 0; i < 4; i += 1) {
    const a = atoms[i].position;
    const b = atoms[(i + 2) % atoms.length].position;
    sculpture.add(beamBetween([a.x, a.y, a.z], [b.x, b.y, b.z], 0.045, mats.copper));
  }

  const halo = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.035, 6, 96), mats.emitMint);
  halo.rotation.set(Math.PI / 2.6, 0.2, 0.3);
  sculpture.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.022, 6, 80), mats.emitMintDeep);
  halo2.rotation.set(Math.PI / 2.1, -0.4, 0.8);
  sculpture.add(halo2);

  const glow = glowSprite(ctx.textures.radial, 0xffc078, 12, 0.28);
  sculpture.add(glow);

  sculpture.position.set(-186, 8.4, -2);
  sculpture.scale.setScalar(1.32);
  root.add(sculpture);

  // suspension cables to the roof
  for (const [dx, dz] of [[-2.4, -1.2], [2.4, -1.2], [0, 2.6]]) {
    root.add(cylinder(0.012, 0.012, 7.6, mats.steelDark, -186 + dx, 13.0, -2 + dz, 4));
  }

  ctx.animations.push((t) => {
    sculpture.rotation.y = t * 0.12;
    sculpture.rotation.z = Math.sin(t * 0.24) * 0.03;
    sculpture.position.y = 8.4 + Math.sin(t * 0.45) * 0.16;
    halo.rotation.z += 0.0006;
    halo2.rotation.y += 0.0004;
    const pulse = ctx.experiment.value;
    core.material.emissiveIntensity = 1.2 + pulse * 1.6 + Math.sin(t * 1.6) * 0.18;
    glow.material.opacity = 0.22 + pulse * 0.35 + Math.sin(t * 0.9) * 0.03;
    atoms.forEach((atom, i) => {
      atom.rotation.y = t * (0.3 + i * 0.03);
    });
  });

  /* ---- planted living lattice on the north wall ----------------------- */
  const lattice = new THREE.Group();
  lattice.name = 'LivingLattice';
  const latticeX0 = -202;
  const latticeX1 = -168;
  const latticeZ = RESEARCH_LAYOUT.hall.zNorth + 0.55;
  const width = latticeX1 - latticeX0;

  for (let x = latticeX0; x <= latticeX1; x += 0.9) {
    lattice.add(box(0.09, 11.8, 0.3, mats.oak, x, 6.4, latticeZ));
  }
  for (let y = 1.0; y <= 12.2; y += 1.15) {
    lattice.add(box(width, 0.09, 0.34, mats.oakDark, (latticeX0 + latticeX1) / 2, y, latticeZ + 0.02));
  }
  // planter trough at the base
  lattice.add(box(width, 0.8, 0.9, mats.concrete, (latticeX0 + latticeX1) / 2, 0.4, latticeZ + 0.3));
  lattice.add(box(width - 0.6, 0.12, 0.7, mats.soil, (latticeX0 + latticeX1) / 2, 0.84, latticeZ + 0.3));

  // planting modules
  const plantGeo = new THREE.IcosahedronGeometry(0.42, 0);
  const plants = new THREE.InstancedMesh(plantGeo, mats.leaf, cfg.plantCount);
  const random = mulberry32(ctx.cfg.seed + 33);
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const color = new THREE.Color();
  for (let i = 0; i < cfg.plantCount; i += 1) {
    const col = Math.floor(random() * 11);
    const row = Math.floor(random() * 30);
    p.set(
      latticeX0 + 0.5 + col * ((width - 1) / 11) + randRange(random, -0.35, 0.35),
      1.4 + row * 0.36 + randRange(random, -0.2, 0.2),
      latticeZ + 0.42 + randRange(random, -0.12, 0.2)
    );
    const scale = randRange(random, 0.7, 1.5);
    s.set(scale, scale * randRange(random, 0.7, 1.2), scale);
    q.setFromEuler(new THREE.Euler(random() * 3, random() * 3, random() * 3));
    m.compose(p, q, s);
    plants.setMatrixAt(i, m);
    color.setHSL(0.24 + random() * 0.09, 0.3 + random() * 0.25, 0.2 + random() * 0.18);
    plants.setColorAt(i, color);
  }
  plants.instanceMatrix.needsUpdate = true;
  lattice.add(plants);
  // grow lights above the wall
  for (const y of [12.3]) {
    lattice.add(box(width, 0.06, 0.12, mats.emitMintDeep, (latticeX0 + latticeX1) / 2, y, latticeZ + 0.5));
  }
  root.add(lattice);

  ctx.animations.push((t) => {
    plants.rotation.z = Math.sin(t * 0.3) * 0.002;
  });

  /* ---- reception desk, stone top -------------------------------------- */
  const deskX = -182;
  root.add(box(7.2, 1.05, 1.5, mats.oak, deskX, 0.53, 9));
  root.add(box(7.6, 0.12, 1.7, mats.stoneTop, deskX, 1.1, 9));
  root.add(box(7.2, 0.06, 0.5, mats.brass, deskX, 1.18, 8.3));
  for (const x of [deskX - 2.4, deskX + 2.4]) {
    const stool = cylinder(0.24, 0.24, 0.1, mats.rubber, x, 0.66, 10.4, 12);
    root.add(stool);
    root.add(cylinder(0.05, 0.05, 0.62, mats.steel, x, 0.34, 10.4, 8));
    root.add(cylinder(0.26, 0.22, 0.05, mats.steelDark, x, 0.04, 10.4, 12));
  }
  // a monitor on the desk
  const deskScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.72), mats.screenProtein);
  deskScreen.position.set(deskX - 1.4, 1.62, 9.02);
  deskScreen.rotation.x = -0.12;
  root.add(deskScreen);
  root.add(box(0.06, 0.5, 0.06, mats.steelDark, deskX - 1.4, 1.32, 9.0));

  /* ---- model plinth with a crystal ------------------------------------ */
  const plinthX = -172;
  root.add(cylinder(0.85, 0.95, 1.05, mats.concrete, plinthX, 0.52, 6, 20));
  const vitrine = cylinder(0.72, 0.72, 1.5, mats.glass, plinthX, 1.8, 6, 24);
  root.add(vitrine);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), mats.emitMint);
  crystal.position.set(plinthX, 1.7, 6);
  root.add(crystal);
  root.add(cylinder(0.72, 0.72, 0.05, mats.brass, plinthX, 2.56, 6, 24));

  ctx.animations.push((t) => {
    crystal.rotation.y = t * 0.5;
    crystal.position.y = 1.7 + Math.sin(t * 0.9) * 0.06;
  });

  /* ---- long bench and sun patches ------------------------------------- */
  root.add(box(9, 0.14, 0.72, mats.oakPale, -172, 0.62, 13));
  for (const x of [-176, -172, -168]) {
    root.add(box(0.16, 0.58, 0.56, mats.steelDark, x, 0.3, 13));
  }

  // planting and low lounge chairs on the sunlit side of the atrium
  for (const [x, z] of [[-170, 17.5], [-160, 12.5], [-180, 18.5]]) {
    root.add(cylinder(0.55, 0.44, 0.7, mats.concrete, x, 0.35, z, 16));
    root.add(cylinder(0.5, 0.5, 0.06, mats.soil, x, 0.69, z, 16));
    const trunk = cylinder(0.08, 0.12, 2.2, mats.oakDark, x, 1.75, z, 7);
    root.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), mats.leaf);
    crown.position.set(x, 3.3, z);
    crown.scale.set(1, 1.25, 1);
    root.add(crown);
  }
  for (const [x, z, ry] of [[-166, 9.5, 0.4], [-161, 9.5, 0.4]]) {
    root.add(box(1.3, 0.34, 1.1, mats.oakPale, x, 0.44, z, ry));
    root.add(box(1.3, 0.62, 0.14, mats.oakPale, x, 0.72, z - 0.48, ry));
    for (const dx of [-0.55, 0.55]) {
      root.add(box(0.08, 0.42, 0.9, mats.steelDark, x + dx, 0.2, z, ry));
    }
  }

  // a mature indoor tree with a circular bench, framing the far end of the hall
  const treeX = -140;
  const treeZ = -25;
  root.add(cylinder(1.9, 2.05, 0.55, mats.concrete, treeX, 0.28, treeZ, 28));
  root.add(cylinder(1.8, 1.8, 0.06, mats.soil, treeX, 0.56, treeZ, 28));
  root.add(cylinder(0.42, 0.6, 4.6, mats.oakDark, treeX, 2.85, treeZ, 10));
  const canopy = new THREE.Group();
  canopy.position.set(treeX, 6.9, treeZ);
  canopy.scale.setScalar(0.86);
  const randomTree = mulberry32(661);
  for (let i = 0; i < 9; i += 1) {
    const r = 1.5 + randomTree() * 1.5;
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), i % 3 === 0 ? mats.leafDeep : i % 3 === 1 ? mats.leaf : mats.leafPale);
    blob.position.set(
      (randomTree() - 0.5) * 4.4,
      (randomTree() - 0.5) * 2.4,
      (randomTree() - 0.5) * 4.0
    );
    blob.scale.set(1, 0.9 + randomTree() * 0.3, 1);
    canopy.add(blob);
  }
  root.add(canopy);
  const ringBench = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.28, 8, 40, Math.PI * 1.35), mats.oakPale);
  ringBench.rotation.x = Math.PI / 2;
  ringBench.rotation.z = 0.4;
  ringBench.position.set(treeX, 0.55, treeZ);
  root.add(ringBench);
  for (const a of [0.4, 1.4, 2.4]) {
    const bx = treeX + Math.cos(a) * 2.15;
    const bz = treeZ + Math.sin(a) * 2.15;
    root.add(box(0.12, 0.5, 0.5, mats.steelDark, bx, 0.28, bz, -a));
  }

  // a shallow reflecting rill from the doors towards the desk
  root.add(box(26, 0.05, 1.5, mats.water, -206, 0.06, 10.5));
  for (const dz of [-0.8, 0.8]) {
    root.add(box(26, 0.1, 0.12, mats.brass, -206, 0.1, 10.5 + dz));
  }
  for (let i = 0; i < 5; i += 1) {
    root.add(box(0.14, 0.16, 1.7, mats.stoneTop, -218 + i * 6, 0.1, 10.5));
  }
  const patchMat = new THREE.MeshBasicMaterial({
    color: 0xffe0b0, transparent: true, opacity: 0.075,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  ctx.addMaterial(patchMat);
  for (let i = 0; i < 7; i += 1) {
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 13), patchMat);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = -0.32;
    patch.position.set(-232 + i * 8.5, 0.03, 8);
    root.add(patch);
  }

  ctx.group.add(root);
  ctx.stationRoots.push(root);
  return root;
}

/* ========================================================================== *
 *  Station 02 — Quantum & Cryo-Optics Bench
 * ========================================================================== */

function buildOptics(ctx) {
  const { mats } = ctx;
  const root = new THREE.Group();
  root.name = 'StationOptics';
  root.userData.stationId = 'optics';
  root.userData.stationIndex = 1;

  const TX = -107;
  const TZ = 1.5;
  const TOP = 1.16;

  /* ---- vibration-isolated optical table ------------------------------- */
  root.add(box(9.4, 0.16, 5.2, mats.concrete, TX, 0.08, TZ));
  const tableTop = box(7.6, 0.28, 3.6, mats.breadboard || mats.steelDeep, TX, TOP - 0.14, TZ);
  tableTop.castShadow = true;
  root.add(tableTop);
  // breadboard hole grid, drawn as a texture on the top face
  const topPlate = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3.5), mats.breadboard);
  topPlate.rotation.x = -Math.PI / 2;
  topPlate.position.set(TX, TOP + 0.005, TZ);
  root.add(topPlate);

  for (const dx of [-3.3, 3.3]) {
    for (const dz of [-1.4, 1.4]) {
      root.add(cylinder(0.16, 0.2, TOP - 0.3, mats.steel, TX + dx, (TOP - 0.3) / 2 + 0.1, TZ + dz, 10));
      root.add(cylinder(0.26, 0.26, 0.08, mats.rubber, TX + dx, 0.09, TZ + dz, 12));
    }
  }
  // lower shelf with power supplies
  root.add(box(6.6, 0.08, 2.6, mats.steelDark, TX, 0.42, TZ));
  for (let i = -2; i <= 2; i += 1) {
    root.add(box(0.9, 0.24, 0.9, mats.blackened, TX + i * 1.15, 0.58, TZ - 0.4));
  }

  /* ---- lasers, optics and the two beam paths -------------------------- */
  const laserGreen = box(0.62, 0.3, 1.3, mats.blackened, TX - 3.4, TOP + 0.2, TZ + 0.4);
  root.add(laserGreen);
  root.add(box(0.08, 0.08, 0.1, mats.emitGreen, TX - 3.06, TOP + 0.22, TZ + 0.4));
  const laserRed = box(0.5, 0.24, 1.0, mats.blackened, TX - 3.4, TOP + 0.17, TZ - 1.1);
  root.add(laserRed);
  root.add(box(0.07, 0.07, 0.08, mats.emitRed, TX - 3.12, TOP + 0.19, TZ - 1.1));

  const postAndMirror = (x, z, height = 0.62) => {
    const group = new THREE.Group();
    group.position.set(x, TOP, z);
    const post = cylinder(0.045, 0.045, height, mats.steel, 0, height / 2, 0, 8);
    group.add(post);
    const head = new THREE.Group();
    head.position.y = height + 0.14;
    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.035, 24), mats.aluminium);
    mirror.rotation.x = Math.PI / 2;
    head.add(mirror);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.014, 6, 24), mats.blackened);
    head.add(rim);
    group.add(head);
    return { group, head };
  };

  const m1 = postAndMirror(TX + 0.6, TZ + 1.2);
  const m2 = postAndMirror(TX + 2.4, TZ - 0.7);
  root.add(m1.group, m2.group);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mats.glassGreen);
  splitter.position.set(TX - 2.6, TOP + 0.3, TZ + 0.4);
  root.add(splitter);

  // lens holders along the direct path
  for (const dx of [-1.8, -0.7, 0.6]) {
    const post = cylinder(0.04, 0.04, 0.5, mats.steel, TX + dx, TOP + 0.25, TZ + 0.4, 8);
    root.add(post);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 6, 20), mats.blackened);
    ring.position.set(TX + dx, TOP + 0.56, TZ + 0.4);
    ring.rotation.y = Math.PI / 2;
    root.add(ring);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), mats.glassGreen);
    lens.position.set(TX + dx, TOP + 0.56, TZ + 0.4);
    lens.rotation.y = Math.PI / 2;
    root.add(lens);
  }

  // detector screen with a spot
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), mats.emitWhite);
  screen.position.set(TX + 3.3, TOP + 0.55, TZ + 0.4);
  screen.rotation.y = -Math.PI / 2;
  root.add(screen);
  root.add(box(0.06, 0.8, 0.8, mats.steelDeep, TX + 3.36, TOP + 0.5, TZ + 0.4));
  const spot = glowSprite(ctx.textures.radial, 0x9dffbe, 1.4, 0.8);
  spot.position.set(TX + 3.28, TOP + 0.55, TZ + 0.4);
  root.add(spot);

  for (const [gx, gz, color, size] of [[TX - 3.06, TZ + 0.4, 0x8dff9e, 0.9], [TX - 3.12, TZ - 1.1, 0xff7a63, 0.7], [TX + 0.6, TZ + 1.2, 0x8dff9e, 0.7], [TX + 2.4, TZ - 0.7, 0x8dff9e, 0.7]]) {
    const glow = glowSprite(ctx.textures.radial, color, size, 0.75);
    glow.position.set(gx, TOP + 0.34, gz);
    root.add(glow);
  }

  // beam materials (separate instances so the two paths can crossfade)
  const beamMat = (color) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.95, blending: THREE.NormalBlending,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const greenMat = beamMat(0x1fbf5a);
  const redMat = beamMat(0xd8321f);
  const foldedMat = beamMat(0x1fbf5a);
  [greenMat, redMat, foldedMat].forEach((mat) => ctx.addMaterial(mat));

  const direct = new THREE.Group();
  direct.add(beamBetween([TX - 3.0, TOP + 0.24, TZ + 0.4], [TX + 3.3, TOP + 0.24, TZ + 0.4], 0.06, greenMat));
  direct.add(beamBetween([TX - 3.05, TOP + 0.19, TZ - 1.1], [TX + 3.3, TOP + 0.19, TZ - 1.1], 0.045, redMat));
  root.add(direct);

  const folded = new THREE.Group();
  const mA = [TX - 2.6, TOP + 0.24, TZ + 0.4];
  const mB = [TX + 0.6, TOP + 0.78, TZ + 1.2];
  const mC = [TX + 2.4, TOP + 0.78, TZ - 0.7];
  const mD = [TX + 3.3, TOP + 0.55, TZ + 0.4];
  folded.add(beamBetween(mA, mB, 0.058, foldedMat));
  folded.add(beamBetween(mB, mC, 0.058, foldedMat));
  folded.add(beamBetween(mC, mD, 0.058, foldedMat));
  // the folded path is hidden until it is aligned
  folded.visible = false;
  root.add(folded);

  // task lighting directly over the optical table
  for (const dx of [-2.2, 2.2]) {
    root.add(box(3.4, 0.06, 0.9, mats.emitWhite, TX + dx, 5.4, TZ + 0.2));
    root.add(box(3.5, 0.12, 1.0, mats.steelDeep, TX + dx, 5.48, TZ + 0.2));
    for (const dz of [-0.7, 0.7]) {
      root.add(cylinder(0.012, 0.012, 2.4, mats.steelDark, TX + dx, 6.7, TZ + 0.2 + dz, 4));
    }
  }
  const taskLight = new THREE.PointLight(0xfff2dd, 26, 14, 2);
  taskLight.position.set(TX, 5.1, TZ + 0.2);
  root.add(taskLight);

  ctx.stationHooks.optics = {
    direct, folded, greenMat, redMat, foldedMat, m1, m2, spot, screen,
  };

  /* ---- dilution refrigerator ------------------------------------------ */
  const RX = -97;
  const RZ = -11;
  const frameTop = 7.2;
  for (const dx of [-1.5, 1.5]) {
    for (const dz of [-1.5, 1.5]) {
      root.add(box(0.14, frameTop, 0.14, mats.steel, RX + dx, frameTop / 2, RZ + dz));
    }
  }
  root.add(box(3.4, 0.22, 3.4, mats.steelDark, RX, frameTop, RZ));
  root.add(box(3.4, 0.18, 0.5, mats.steelDark, RX, frameTop - 0.3, RZ - 1.4));

  const stageMat = mats.steel;
  const stages = [
    { r: 0.9, h: 1.1, y: 6.3, mat: stageMat, plate: 0.95, copper: false },
    { r: 0.72, h: 1.0, y: 5.25, mat: stageMat, plate: 0.8, copper: true },
    { r: 0.56, h: 0.9, y: 4.3, mat: stageMat, plate: 0.64, copper: true },
    { r: 0.4, h: 0.75, y: 3.45, mat: stageMat, plate: 0.48, copper: true },
  ];
  for (const stage of stages) {
    root.add(cylinder(stage.r, stage.r, stage.h, stage.mat, RX, stage.y, RZ, 20));
    const plate = cylinder(stage.plate, stage.plate, 0.12, stage.copper ? mats.copper : mats.aluminium, RX, stage.y + stage.h / 2, RZ, 28);
    root.add(plate);
    // a thin gold ring clamping each copper plate
    const ring = new THREE.Mesh(new THREE.TorusGeometry(stage.plate * 0.98, 0.018, 5, 28), mats.brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(RX, stage.y + stage.h / 2 + 0.065, RZ);
    root.add(ring);
  }
  const mixing = cylinder(0.16, 0.16, 0.5, mats.gold, RX, 2.95, RZ, 16);
  root.add(mixing);
  root.add(cylinder(0.26, 0.26, 0.06, mats.gold, RX, 2.68, RZ, 20));
  const coldGlow = glowSprite(ctx.textures.radial, 0x9fd8ff, 2.2, 0.35);
  coldGlow.position.set(RX, 2.9, RZ);
  root.add(coldGlow);
  root.add(cylinder(0.05, 0.05, 2.2, mats.copper, RX, 2.0, RZ + 0.5, 8));

  // vacuum can around the cold stack
  const can = cylinder(1.05, 1.05, 4.6, mats.vacuum, RX, 3.5, RZ, 28);
  root.add(can);
  root.add(cylinder(1.1, 1.1, 0.05, mats.aluminium, RX, 5.8, RZ, 28));

  // pulse-tube compressor and gas lines beside the frame
  root.add(box(0.8, 1.3, 0.7, mats.steelDark, RX + 1.9, 0.65, RZ + 1.6));
  const hose = tubeGeometry([
    new THREE.Vector3(RX + 1.9, 1.25, RZ + 1.6),
    new THREE.Vector3(RX + 1.4, 3.4, RZ + 1.2),
    new THREE.Vector3(RX + 0.8, 5.2, RZ + 0.6),
    new THREE.Vector3(RX + 0.5, 6.2, RZ + 0.2),
  ], 0.055, 40, 8);
  root.add(new THREE.Mesh(hose, mats.rubber));

  const coldMist = glowSprite(ctx.textures.mist, 0xbfe9ff, 3.4, 0.16);
  coldMist.position.set(RX, 1.2, RZ);
  root.add(coldMist);

  // control rack with a live cryogenic trace
  root.add(box(1.5, 2.1, 0.7, mats.steelDeep, RX - 2.3, 1.05, RZ + 1.4));
  const cryoScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.68), mats.screenCryo);
  cryoScreen.position.set(RX - 2.3, 1.45, RZ + 1.77);
  root.add(cryoScreen);

  /* ---- oscilloscope cart and gas bottles ------------------------------ */
  root.add(box(1.4, 0.9, 0.7, mats.steelDark, TX + 0.4, 0.5, TZ + 3.0));
  const scope = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.6), mats.screenLock);
  scope.position.set(TX + 0.4, 1.02, TZ + 3.02);
  scope.rotation.x = -0.35;
  root.add(scope);
  for (const dz of [0, 0.7]) {
    root.add(cylinder(0.16, 0.16, 1.5, mats.steel, TX - 1.2, 0.75, TZ + 3.2 + dz, 12));
    root.add(geometryCap(TX - 1.2, 1.55, TZ + 3.2 + dz, mats.brass));
  }

  /* ---- more instruments: wave plates, irises, fibre, a laptop ---------- */
  for (const [dx, dz] of [[-2.2, -0.5], [-1.1, 1.0], [1.6, 0.9]]) {
    root.add(cylinder(0.02, 0.02, 0.34, mats.steel, TX + dx, TOP + 0.17, TZ + dz, 6));
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 20), mats.glassAmber);
    plate.position.set(TX + dx, TOP + 0.36, TZ + dz);
    root.add(plate);
    const mount = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 5, 20), mats.blackened);
    mount.position.copy(plate.position);
    mount.rotation.x = Math.PI / 2;
    root.add(mount);
  }
  // fibre spool
  const spool = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 24), mats.copper);
  spool.position.set(TX + 2.0, TOP + 0.3, TZ + 1.4);
  spool.rotation.x = Math.PI / 2;
  root.add(spool);
  // beam dump
  root.add(box(0.26, 0.26, 0.26, mats.blackened, TX + 3.4, TOP + 0.3, TZ - 1.1));
  // laptop on the end of the table
  const laptop = new THREE.Group();
  laptop.position.set(TX + 3.1, TOP + 0.05, TZ + 1.6);
  laptop.add(box(0.55, 0.04, 0.38, mats.aluminium, 0, 0, 0));
  const laptopScreen = box(0.55, 0.36, 0.02, mats.blackened, 0, 0.2, -0.18);
  laptopScreen.rotation.x = -0.18;
  laptop.add(laptopScreen);
  laptop.add(box(0.5, 0.3, 0.01, mats.screenLock, 0, 0.2, -0.165));
  root.add(laptop);

  /* ---- electronics rack and a second bench along the glass ------------- */
  const rackX = -114;
  const rackZ = -24;
  root.add(box(2.6, 2.2, 0.9, mats.steelDeep, rackX, 1.1, rackZ));
  for (let i = 0; i < 7; i += 1) {
    root.add(box(2.3, 0.24, 0.04, mats.blackened, rackX, 0.32 + i * 0.28, rackZ + 0.48));
    root.add(box(0.06, 0.03, 0.02, i % 3 === 0 ? mats.emitAmber : mats.emitMintDeep, rackX - 0.9, 0.32 + i * 0.28, rackZ + 0.51));
  }
  const rackScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), mats.screenLock);
  rackScreen.position.set(rackX + 0.4, 1.9, rackZ + 0.52);
  root.add(rackScreen);

  root.add(box(4.2, 0.9, 1.6, mats.steelDeep, -99, 0.45, 9));
  root.add(box(4.3, 0.1, 1.7, mats.stoneTop, -99, 0.93, 9));
  root.add(box(1.4, 0.7, 1.2, mats.aluminium, -100, 1.4, 9));
  root.add(cylinder(0.55, 0.55, 0.7, mats.vacuum, -100, 2.1, 9, 20));
  root.add(cylinder(0.6, 0.6, 0.06, mats.steel, -100, 2.47, 9, 20));
  root.add(cylinder(0.28, 0.28, 0.5, mats.glass, -98, 1.65, 9, 16));

  ctx.animations.push((t) => {
    const locked = ctx.laser.mix;
    direct.visible = locked < 0.5;
    folded.visible = locked >= 0.5;
    greenMat.opacity = (1 - locked) * (0.7 + ctx.experiment.value * 0.3);
    redMat.opacity = (1 - locked) * (0.6 + ctx.experiment.value * 0.4);
    foldedMat.opacity = locked * (0.72 + ctx.experiment.value * 0.28);
    m1.head.rotation.z = locked * 0.38;
    m2.head.rotation.z = -locked * 0.5;
    spot.material.opacity = 0.45 + ctx.experiment.value * 0.45;
    coldMist.material.opacity = 0.12 + Math.sin(t * 0.7) * 0.04;
  });

  ctx.group.add(root);
  ctx.stationRoots.push(root);
  return root;
}

function geometryCap(x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.18, 10), material);
  mesh.position.set(x, y, z);
  return mesh;
}

/* ========================================================================== *
 *  Station 03 — Wet Lab & Bio-Simulation Core
 * ========================================================================== */

function buildWetLab(ctx) {
  const { mats, cfg } = ctx;
  const root = new THREE.Group();
  root.name = 'StationWetLab';
  root.userData.stationId = 'wetlab';
  root.userData.stationIndex = 2;

  /* ---- bench island --------------------------------------------------- */
  const BX = -8;
  const BZ = 7.5;
  root.add(box(13, 0.86, 2.6, mats.steelDeep, BX, 0.43, BZ));
  root.add(box(13.2, 0.1, 2.8, mats.stoneTop, BX, 0.94, BZ));
  root.add(box(13.2, 0.05, 0.12, mats.brass, BX, 1.0, BZ + 1.36));
  for (const dx of [-4.2, -1.4, 1.4, 4.2]) {
    root.add(box(2.3, 0.74, 2.4, mats.plaster, BX + dx, 0.4, BZ));
    root.add(box(2.3, 0.03, 0.03, mats.steelDark, BX + dx, 0.78, BZ + 1.2));
  }
  // sinks and taps
  for (const dx of [-5.6, 5.6]) {
    root.add(box(1.0, 0.06, 0.7, mats.steel, BX + dx, 0.96, BZ));
    const tap = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 6, 20, Math.PI), mats.steel);
    tap.position.set(BX + dx, 1.24, BZ - 0.1);
    root.add(tap);
  }

  // glassware along the bench
  const flaskGeo = new THREE.CylinderGeometry(0.055, 0.2, 0.42, 12, 1, true);
  for (let i = 0; i < 9; i += 1) {
    const flask = new THREE.Mesh(flaskGeo, mats.glass);
    flask.position.set(BX - 5 + i * 1.2, 1.21, BZ - 0.5);
    root.add(flask);
    root.add(cylinder(0.2, 0.2, 0.02, mats.glass, BX - 5 + i * 1.2, 1.0, BZ - 0.5, 12));
  }

  /* ---- three glass bio-reactors -------------------------------------- */
  const reactors = [];
  const bubbleData = [];
  [-13.6, -10.4, -7.2].forEach((x, index) => {
    const baseY = 1.0;
    const height = 2.6;
    root.add(box(1.6, 0.2, 1.6, mats.steelDark, x, baseY - 0.1, -2));
    root.add(cylinder(0.62, 0.62, 0.1, mats.steel, x, baseY, -2, 24));
    const vessel = cylinder(0.64, 0.64, height, mats.glass, x, baseY + height / 2, -2, 28);
    root.add(vessel);
    const liquid = cylinder(0.56, 0.56, height * 0.72, mats.glassGreen, x, baseY + height * 0.4, -2, 24);
    root.add(liquid);
    root.add(cylinder(0.68, 0.68, 0.12, mats.steel, x, baseY + height, -2, 24));
    root.add(cylinder(0.14, 0.14, 0.3, mats.steel, x, baseY + height + 0.2, -2, 12));
    // impeller shaft
    root.add(cylinder(0.035, 0.035, height * 0.85, mats.steel, x, baseY + height * 0.45, -2, 8));
    root.add(box(0.42, 0.035, 0.09, mats.steel, x, baseY + 0.3, -2));
    // feed and vent tubes
    const feed = tubeGeometry([
      new THREE.Vector3(x + 0.5, baseY + height * 0.9, -2),
      new THREE.Vector3(x + 0.9, baseY + height * 1.12, -2),
      new THREE.Vector3(x + 0.9, baseY + height * 1.3, -2.4),
      new THREE.Vector3(x + 0.5, baseY + height * 1.35, -3.2),
    ], 0.035, 30, 6);
    root.add(new THREE.Mesh(feed, mats.glassAmber));

    for (let b = 0; b < Math.max(6, Math.floor(cfg.bubbleCount / 9)); b += 1) {
      bubbleData.push({
        x, z: -2,
        phase: Math.random(),
        speed: 0.13 + Math.random() * 0.22,
        radius: 0.02 + Math.random() * 0.035,
        offsetX: (Math.random() - 0.5) * 0.6,
        offsetZ: (Math.random() - 0.5) * 0.6,
        bottom: baseY + 0.15,
        top: baseY + height * 0.92,
      });
    }
    reactors.push({ x, baseY, height });
  });

  const bubbleGeo = new THREE.SphereGeometry(1, 6, 4);
  const bubbleMat = new THREE.MeshBasicMaterial({
    color: 0xbdfbe0, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  ctx.addMaterial(bubbleMat);
  const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, bubbleData.length);
  bubbles.frustumCulled = false;
  root.add(bubbles);

  const bubbleMatrix = new THREE.Matrix4();
  const bubblePos = new THREE.Vector3();
  const bubbleScale = new THREE.Vector3();
  ctx.animations.push((t) => {
    for (let i = 0; i < bubbleData.length; i += 1) {
      const b = bubbleData[i];
      const span = b.top - b.bottom;
      const local = (b.phase + t * b.speed) % 1;
      const wobble = Math.sin(t * 1.4 + i) * 0.06;
      bubblePos.set(b.x + b.offsetX + wobble, b.bottom + local * span, b.z + b.offsetZ);
      const s = b.radius * (0.7 + local * 0.9);
      bubbleScale.set(s, s, s);
      bubbleMatrix.compose(bubblePos, new THREE.Quaternion(), bubbleScale);
      bubbles.setMatrixAt(i, bubbleMatrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
  });

  /* ---- centrifuge ----------------------------------------------------- */
  const centrifuge = new THREE.Group();
  centrifuge.position.set(-15.4, 0, 9.2);
  centrifuge.add(box(1.15, 0.62, 1.15, mats.steelDeep, 0, 0.31, 0));
  centrifuge.add(box(1.2, 0.08, 1.2, mats.steel, 0, 0.66, 0));
  centrifuge.add(cylinder(0.34, 0.34, 0.05, mats.aluminium, 0, 0.72, 0, 20));
  const rotor = new THREE.Group();
  rotor.position.y = 0.78;
  rotor.add(cylinder(0.3, 0.3, 0.06, mats.aluminium, 0, 0, 0, 20));
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 8), mats.glassAmber);
    tube.position.set(Math.cos(angle) * 0.2, 0.09, Math.sin(angle) * 0.2);
    tube.rotation.z = Math.cos(angle) * 0.5;
    tube.rotation.x = Math.sin(angle) * 0.5;
    rotor.add(tube);
  }
  rotor.add(cylinder(0.05, 0.05, 0.3, mats.steel, 0, 0.15, 0, 8));
  centrifuge.add(rotor);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mats.glass);
  lid.position.y = 0.7;
  centrifuge.add(lid);
  const centScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), mats.emitMintDeep);
  centScreen.position.set(0, 0.45, 0.585);
  centrifuge.add(centScreen);
  root.add(centrifuge);

  /* ---- orbital shaker with flasks ------------------------------------ */
  const shaker = new THREE.Group();
  shaker.position.set(-2.6, 0, 9.2);
  shaker.add(box(1.5, 0.34, 1.2, mats.steelDeep, 0, 0.17, 0));
  const platform = box(1.4, 0.1, 1.1, mats.aluminium, 0, 0.42, 0);
  shaker.add(platform);
  const flasks = [];
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.19, 0.36, 10, 1, true), mats.glass);
    flask.position.set(Math.cos(angle) * 0.38, 0.64, Math.sin(angle) * 0.3);
    shaker.add(flask);
    flasks.push(flask);
  }
  root.add(shaker);

  /* ---- incubator cabinet with lit shelves ----------------------------- */
  const cabinet = new THREE.Group();
  cabinet.position.set(3.4, 0, 3.5);
  cabinet.add(box(2.6, 2.6, 1.0, mats.steelDeep, 0, 1.3, 0));
  cabinet.add(box(2.3, 2.2, 0.06, mats.glass, 0, 1.35, 0.52));
  for (let s = 0; s < 4; s += 1) {
    cabinet.add(box(2.3, 0.04, 0.9, mats.plaster, 0, 0.5 + s * 0.62, 0));
    for (let b = 0; b < 6; b += 1) {
      const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.28, 8, 1, true), mats.glassGreen);
      flask.position.set(-0.9 + b * 0.36, 0.67 + s * 0.62, 0);
      cabinet.add(flask);
    }
  }
  cabinet.add(box(2.3, 0.06, 0.1, mats.emitMintDeep, 0, 2.48, 0.48));
  root.add(cabinet);

  // bottle shelf over the bench
  root.add(box(9.0, 0.08, 0.4, mats.oak, -8, 2.5, 9.4));
  for (let i = 0; i < 10; i += 1) {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.32, 8), i % 3 === 0 ? mats.glassAmber : mats.glass);
    bottle.position.set(-12.4 + i * 0.95, 2.72, 9.4);
    root.add(bottle);
    root.add(cylinder(0.03, 0.03, 0.08, mats.plaster, -12.4 + i * 0.95, 2.92, 9.4, 6));
  }

  ctx.animations.push((t) => {
    rotor.rotation.y = t * 7.4;
    platform.position.y = 0.42 + Math.sin(t * 2.2) * 0.012;
    flasks.forEach((flask, i) => {
      const angle = t * 1.1 + (i / 5) * Math.PI * 2;
      flask.position.x = Math.cos(angle) * 0.38;
      flask.position.z = Math.sin(angle) * 0.3;
      flask.rotation.z = Math.cos(angle) * 0.08;
    });
  });

  /* ---- holographic protein ------------------------------------------- */
  const hologram = new THREE.Group();
  hologram.position.set(0, 0, -1);
  hologram.add(cylinder(0.55, 0.62, 0.9, mats.steelDeep, 0, 0.45, 0, 24));
  hologram.add(cylinder(0.46, 0.46, 0.04, mats.emitMint, 0, 0.92, 0, 24));
  hologram.add(cylinder(0.06, 0.06, 0.5, mats.steel, 0, 0.22, 0, 8));
  hologram.add(cylinder(0.7, 0.7, 0.06, mats.steelDark, 0, 0.02, 0, 24));

  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x7fe8c8, transparent: true, opacity: 0.05,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  ctx.addMaterial(coneMat);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4.4, 28, 1, true), coneMat);
  cone.position.y = 3.2;
  cone.rotation.x = Math.PI;
  hologram.add(cone);

  const protein = new THREE.Group();
  protein.position.y = 5.4;
  // a coarse-grained chain: instanced spheres along a noisy helix
  const nodeCount = 90;
  const nodeGeo = new THREE.IcosahedronGeometry(0.115, 1);
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x0d2a24, metalness: 0.2, roughness: 0.3,
    emissive: 0x6fe6c0, emissiveIntensity: 1.5,
    transparent: true, opacity: 0.9,
  });
  ctx.addMaterial(nodeMat);
  const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
  const chain = [];
  const nm = new THREE.Matrix4();
  for (let i = 0; i < nodeCount; i += 1) {
    const u = i / (nodeCount - 1);
    const angle = u * Math.PI * 9;
    const radius = 1.25 + Math.sin(u * Math.PI * 2.2) * 0.32;
    const point = new THREE.Vector3(
      Math.cos(angle) * radius,
      (u - 0.5) * 2.6 + Math.sin(u * 18) * 0.12,
      Math.sin(angle) * radius * 0.72
    );
    chain.push(point);
    nm.makeTranslation(point.x, point.y, point.z);
    nodes.setMatrixAt(i, nm);
  }
  nodes.instanceMatrix.needsUpdate = true;
  protein.add(nodes);

  // backbone tube
  const backbone = new THREE.Mesh(tubeGeometry(chain, 0.03, 220, 5), nodeMat);
  protein.add(backbone);
  // binding pocket, lit amber
  const pocket = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), mats.emitAmber);
  pocket.position.set(0.55, 0.2, 0.4);
  protein.add(pocket);
  const pocketGlow = glowSprite(ctx.textures.radial, 0xffc078, 2.4, 0.4);
  pocketGlow.position.copy(pocket.position);
  protein.add(pocketGlow);
  hologram.add(protein);
  root.add(hologram);

  // a dark projection panel behind the hologram, so the mesh reads against it
  root.add(box(7.2, 4.6, 0.12, mats.blackened, 0, 3.0, -4.6));
  root.add(box(7.4, 0.1, 0.16, mats.emitMintDeep, 0, 5.32, -4.55));
  root.add(box(0.1, 4.6, 0.16, mats.steelDark, -3.65, 3.0, -4.55));
  root.add(box(0.1, 4.6, 0.16, mats.steelDark, 3.65, 3.0, -4.55));

  ctx.animations.push((t) => {
    protein.rotation.y = t * 0.24;
    protein.rotation.z = Math.sin(t * 0.3) * 0.06;
    protein.position.y = 5.4 + Math.sin(t * 0.6) * 0.06;
    nodeMat.emissiveIntensity = 1.2 + ctx.experiment.value * 0.9;
    pocketGlow.material.opacity = 0.3 + ctx.experiment.value * 0.4;
    coneMat.opacity = 0.04 + ctx.experiment.value * 0.03;
  });

  ctx.group.add(root);
  ctx.stationRoots.push(root);
  return root;
}

/* ========================================================================== *
 *  Station 04 — Supercomputing & Dataset Atlas
 * ========================================================================== */

function buildCompute(ctx) {
  const { mats } = ctx;
  const root = new THREE.Group();
  root.name = 'StationCompute';
  root.userData.stationId = 'compute';
  root.userData.stationIndex = 3;

  /* ---- two rows of blade enclosures ---------------------------------- */
  const rackXs = [86, 88.4, 90.8, 93.2, 95.6, 98, 100.4];
  for (const z of [-7.5, 7.5]) {
    rackXs.forEach((x, index) => {
      const rack = box(2.1, 2.45, 1.3, mats.steelDeep, x, 1.22, z);
      rack.castShadow = true;
      root.add(rack);
      // perforated front door, facing the aisle
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 2.2), mats.perf);
      door.position.set(x, 1.22, z + (z > 0 ? -0.66 : 0.66));
      door.rotation.y = z > 0 ? Math.PI : 0;
      root.add(door);
      // status LEDs
      for (let i = 0; i < 6; i += 1) {
        const led = box(0.07, 0.03, 0.02, i % 4 === 0 ? mats.emitAmber : mats.emitMintDeep,
          x - 0.8 + i * 0.26, 2.3, z + (z > 0 ? -0.69 : 0.69));
        root.add(led);
      }
      // a small label plate
      if (index % 2 === 0) {
        const plateTex = makeLabelTexture('BLADE', `rack ${String(index + 1).padStart(2, '0')}`, '#7fe0c4', { dark: true, titleSize: 84 });
        if (plateTex) {
          ctx.extraTextures.push(plateTex);
          const mat = new THREE.MeshStandardMaterial({
            map: plateTex, emissive: 0xffffff, emissiveMap: plateTex, emissiveIntensity: 0.25,
            metalness: 0.3, roughness: 0.6, envMap: ctx.envMap,
          });
          ctx.addMaterial(mat);
          const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), mat);
          plate.position.set(x, 2.62, z + (z > 0 ? -0.66 : 0.66));
          plate.rotation.y = z > 0 ? Math.PI : 0;
          root.add(plate);
        }
      }
    });
    // overhead cable tray
    root.add(box(18, 0.14, 0.75, mats.steelDark, 94, 3.35, z));
    root.add(cylinder(0.03, 0.03, 0.7, mats.steel, 87, 3.05, z, 5));
    root.add(cylinder(0.03, 0.03, 0.7, mats.steel, 101, 3.05, z, 5));
  }
  // cold-aisle grating
  const grate = new THREE.Mesh(new THREE.PlaneGeometry(17, 5.2), mats.perf);
  grate.rotation.x = -Math.PI / 2;
  grate.position.set(94, 0.03, 0);
  root.add(grate);
  // containment doors at both ends of the aisle
  for (const x of [84.4, 102.8]) {
    root.add(box(0.1, 2.5, 6.8, mats.glassDark, x, 1.25, 0));
    root.add(box(0.14, 0.12, 6.9, mats.steelDark, x, 2.52, 0));
    root.add(box(0.14, 0.12, 6.9, mats.steelDark, x, 0.06, 0));
    for (const z of [-3.3, 0, 3.3]) {
      root.add(box(0.12, 2.5, 0.1, mats.steelDark, x, 1.25, z));
    }
  }

  // bundled cable runs over each rack row
  for (const z of [-7.5, 7.5]) {
    for (let i = 0; i < 4; i += 1) {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 17, 5), i % 2 ? mats.rubber : mats.copperDark);
      cable.rotation.z = Math.PI / 2;
      cable.position.set(94, 2.62 + i * 0.07, z - 0.45 + i * 0.1);
      root.add(cable);
    }
  }
  // busway and a CCTV dome
  root.add(box(20, 0.3, 0.4, mats.aluminium, 94, 4.4, 0));
  for (const x of [86, 94, 102]) {
    root.add(cylinder(0.02, 0.02, 1.1, mats.steel, x, 3.95, 0, 4));
  }

  // wall screen with the dataset atlas
  const wallScreen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), mats.screenAtlas);
  wallScreen.position.set(96, 4.4, RESEARCH_LAYOUT.hall.zSouth - 0.62);
  wallScreen.rotation.y = Math.PI;
  root.add(wallScreen);
  root.add(box(5.5, 0.1, 0.12, mats.steelDark, 96, 5.75, RESEARCH_LAYOUT.hall.zSouth - 0.6));

  /* ---- the embedding atlas: a displaced manifold terrain ------------- */
  const sizeX = 26;
  const sizeZ = 18;
  const geo = new THREE.PlaneGeometry(sizeX, sizeZ, 132, 96);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / sizeX;
    const nz = y / sizeZ;
    let h = fbm2(nx * 6.2 + 4.1, nz * 4.6 + 2.7, 5, 9) - 0.48;
    h += (fbm2(nx * 17.0 + 1.2, nz * 12.0, 3, 21) - 0.5) * 0.22;
    // a basin in the middle where the model is least certain
    const d = Math.hypot(nx, nz);
    h -= Math.exp(-Math.pow(d / 0.22, 2)) * 0.42;
    h *= 3.4;
    pos.setZ(i, h);
  }
  geo.computeVertexNormals();

  const atlasUniforms = {
    uTime: ctx.uniforms.time,
    uPulse: { value: 0 },
    uFogColor: ctx.uniforms.fogColor,
    uFogDensity: ctx.uniforms.fogDensity,
  };
  const atlasMat = new THREE.ShaderMaterial({
    uniforms: atlasUniforms,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vHeight;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vHeight = position.z;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uPulse;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec2 vUv;
      varying float vHeight;
      varying vec3 vWorld;
      ${GLSL_NOISE}
      void main() {
        float h = clamp(vHeight * 0.42 + 0.5, 0.0, 1.0);
        vec3 low = vec3(0.025, 0.13, 0.16);
        vec3 mid = vec3(0.09, 0.53, 0.46);
        vec3 high = vec3(0.72, 0.62, 0.40);
        vec3 peak = vec3(1.0, 0.84, 0.58);
        vec3 col = mix(low, mid, smoothstep(0.0, 0.55, h));
        col = mix(col, high, smoothstep(0.55, 0.86, h));
        col = mix(col, peak, smoothstep(0.86, 1.0, h));

        // contour lines, like a bathymetric chart
        float contour = abs(fract(h * 9.0) - 0.5);
        col += vec3(0.55, 0.85, 0.72) * smoothstep(0.44, 0.5, contour) * 0.14;

        // a fine survey grid
        vec2 g = abs(fract(vUv * vec2(30.0, 21.0)) - 0.5);
        float grid = 1.0 - smoothstep(0.455, 0.5, max(g.x, g.y));
        col += vec3(0.42, 0.92, 0.82) * grid * 0.075;

        // data pulses running outward from the centre
        float d = distance(vUv, vec2(0.5));
        float ring = sin(d * 46.0 - uTime * 2.3);
        col += vec3(0.88, 0.95, 0.72) * smoothstep(0.88, 1.0, ring) * (0.16 + uPulse * 0.30);

        // individual embedded points catching the light
        float gl = rsHash12(floor(vUv * 260.0));
        float pointGlow = step(0.994, gl) * (0.55 + 0.45 * sin(uTime * 3.1 + gl * 40.0));
        col += vec3(0.95, 0.98, 0.9) * pointGlow * 0.55;

        float dist = length(vWorld - cameraPosition);
        float f = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        col = mix(col, uFogColor, clamp(f, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  ctx.addMaterial(atlasMat);

  const atlas = new THREE.Mesh(geo, atlasMat);
  atlas.position.set(97, 5.8, -14);
  atlas.rotation.x = -Math.PI / 2 + 0.22;
  atlas.rotation.z = -0.06;
  atlas.name = 'EmbeddingAtlas';
  root.add(atlas);

  // a wireframe overlay to read the ridges
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x9df7de, wireframe: true, transparent: true, opacity: 0.09,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  ctx.addMaterial(wireMat);
  const wire = new THREE.Mesh(geo, wireMat);
  wire.position.copy(atlas.position);
  wire.rotation.copy(atlas.rotation);
  wire.scale.set(1.001, 1.001, 1.001);
  root.add(wire);

  // glowing sample nodes above the surface
  const nodeGeo = new THREE.SphereGeometry(0.09, 6, 5);
  const nodeMat = new THREE.MeshBasicMaterial({
    color: 0xffd79a, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  ctx.addMaterial(nodeMat);
  const atlasNodes = new THREE.InstancedMesh(nodeGeo, nodeMat, ctx.cfg.atlasNodes);
  const random = mulberry32(ctx.cfg.seed + 404);
  const nodeData = [];
  const nm = new THREE.Matrix4();
  for (let i = 0; i < ctx.cfg.atlasNodes; i += 1) {
    const u = randRange(random, 0.06, 0.94);
    const v = randRange(random, 0.06, 0.94);
    nodeData.push({ u, v, phase: random() * 6.28, amp: randRange(random, 0.1, 0.5) });
    nm.makeTranslation((u - 0.5) * sizeX, 0.18, (v - 0.5) * sizeZ);
    atlasNodes.setMatrixAt(i, nm);
  }
  atlasNodes.instanceMatrix.needsUpdate = true;
  atlas.add(atlasNodes);

  // halo rings above the atlas
  const halo = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.03, 6, 80), mats.emitMintDeep);
  halo.position.set(97, 11.4, -14);
  halo.rotation.x = Math.PI / 2.1;
  root.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.022, 6, 64), mats.emitAmber);
  halo2.position.set(97, 11.8, -14);
  halo2.rotation.x = Math.PI / 2.4;
  halo2.rotation.z = 0.3;
  root.add(halo2);

  ctx.animations.push((t) => {
    atlasUniforms.uPulse.value = ctx.experiment.value;
    wireMat.opacity = 0.06 + ctx.experiment.value * 0.06;
    halo.rotation.z = t * 0.05;
    halo2.rotation.y = -t * 0.07;
    for (let i = 0; i < nodeData.length; i += 1) {
      const d = nodeData[i];
      const bob = Math.sin(t * 1.1 + d.phase) * d.amp;
      nm.makeTranslation((d.u - 0.5) * sizeX, 0.2 + bob, (d.v - 0.5) * sizeZ);
      atlasNodes.setMatrixAt(i, nm);
    }
    atlasNodes.instanceMatrix.needsUpdate = true;
  });

  // projection cones lifting the atlas off the compute floor
  const projMat = new THREE.MeshBasicMaterial({
    color: 0x7fe8c8, transparent: true, opacity: 0.03,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  ctx.addMaterial(projMat);
  for (const [x, z] of [[88, -9], [97, -13], [105, -9]]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(3.6, 6.2, 20, 1, true), projMat);
    cone.position.set(x, 2.6, z);
    cone.rotation.x = Math.PI;
    root.add(cone);
  }

  // a console with two live screens
  root.add(box(2.4, 0.9, 0.8, mats.steelDeep, 84, 0.55, 2.4));
  for (const [dx, mat] of [[-0.6, mats.screenAtlas], [0.6, mats.screenLock]]) {
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), mat);
    screen.position.set(84 + dx, 1.12, 2.42);
    screen.rotation.x = -0.4;
    root.add(screen);
  }

  ctx.group.add(root);
  ctx.stationRoots.push(root);
  return root;
}

/* ========================================================================== *
 *  Station 05 — Sky-Dome Observatory
 * ========================================================================== */

function buildObservatory(ctx) {
  const { mats } = ctx;
  const root = new THREE.Group();
  root.name = 'StationObservatory';
  root.userData.stationId = 'observatory';
  root.userData.stationIndex = 4;

  const CX = RESEARCH_LAYOUT.dome.x;
  const CZ = RESEARCH_LAYOUT.dome.z;
  const R = RESEARCH_LAYOUT.dome.radius;
  const DRUM = RESEARCH_LAYOUT.dome.drumTop;

  /* ---- circular floor ------------------------------------------------- */
  const domeFloorMat = new THREE.MeshStandardMaterial({
    color: 0x4a4f4c, metalness: 0.42, roughness: 0.24,
    map: ctx.textures.terrazzo, envMap: ctx.envMap, envMapIntensity: 0.9,
  });
  ctx.addMaterial(domeFloorMat);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R - 0.2, 64), domeFloorMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(CX, 0.03, CZ);
  disc.receiveShadow = true;
  root.add(disc);
  const curb = new THREE.Mesh(new THREE.TorusGeometry(R - 0.15, 0.24, 8, 80), mats.concrete);
  curb.rotation.x = Math.PI / 2;
  curb.position.set(CX, 0.1, CZ);
  root.add(curb);

  // a brass meridian line inlaid in the floor
  const meridian = box(0.06, 0.01, (R - 1) * 2, mats.brass, CX, 0.045, CZ);
  root.add(meridian);
  const meridianX = box((R - 1) * 2, 0.01, 0.06, mats.brass, CX, 0.045, CZ);
  root.add(meridianX);

  /* ---- drum wall with an east portal --------------------------------- */
  const gap = 1.1;
  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, DRUM, 56, 1, true, Math.PI / 2 + gap / 2, Math.PI * 2 - gap),
    new THREE.MeshStandardMaterial({
      color: 0xd6d2c4, metalness: 0.12, roughness: 0.86,
      map: ctx.textures.plaster, side: THREE.DoubleSide,
      envMap: ctx.envMap, envMapIntensity: 0.4,
    })
  );
  drum.position.set(CX, DRUM / 2, CZ);
  drum.receiveShadow = true;
  root.add(drum);
  ctx.addMaterial(drum.material);

  // vertical ribs around the covered arc
  const ribs = 26;
  for (let i = 0; i <= ribs; i += 1) {
    const theta = Math.PI / 2 + gap / 2 + (i / ribs) * (Math.PI * 2 - gap);
    const x = CX + Math.sin(theta) * (R - 0.1);
    const z = CZ + Math.cos(theta) * (R - 0.1);
    root.add(box(0.16, DRUM, 0.3, mats.steelDark, x, DRUM / 2, z, -theta));
  }
  // base and top ring beams
  for (const y of [0.3, DRUM - 0.2]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R - 0.05, 0.18, 6, 72), mats.steelDark);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(CX, y, CZ);
    root.add(ring);
  }
  // horizontal panel bands around the drum
  for (const y of [2.4, 4.6, 6.6]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(R - 0.06, 0.07, 5, 64, Math.PI * 2 - gap), mats.steel);
    band.rotation.x = Math.PI / 2;
    band.rotation.z = -(Math.PI / 2 + gap / 2);
    band.position.set(CX, y, CZ);
    root.add(band);
  }

  // observing console racks against the drum
  for (const [theta, count] of [[2.8, 2], [4.4, 2]]) {
    for (let i = 0; i < count; i += 1) {
      const r = R - 1.2;
      const x = CX + Math.sin(theta + i * 0.16) * r;
      const z = CZ + Math.cos(theta + i * 0.16) * r;
      root.add(box(0.9, 1.8, 0.6, mats.steelDeep, x, 0.9, z, -theta));
      root.add(box(0.72, 0.5, 0.04, i % 2 ? mats.screenSky : mats.screenLock, x, 1.4, z + 0.32, -theta));
    }
  }
  // portal frame
  for (const sign of [-1, 1]) {
    const theta = Math.PI / 2 + sign * gap / 2;
    const x = CX + Math.sin(theta) * R;
    const z = CZ + Math.cos(theta) * R;
    root.add(box(0.34, DRUM, 0.34, mats.oakDark, x, DRUM / 2, z));
  }
  root.add(box(0.4, 0.4, 3.2, mats.oakDark, CX + R, DRUM - 0.2, CZ));

  /* ---- the retractable dome, in two rotating halves ------------------ */
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0xdfe2da, metalness: 0.18, roughness: 0.68,
    side: THREE.DoubleSide, envMap: ctx.envMap, envMapIntensity: 0.55,
  });
  ctx.addMaterial(domeMat);
  const halfGeo = new THREE.SphereGeometry(R, 40, 20, 0, Math.PI, 0, Math.PI / 2);
  const halfA = new THREE.Mesh(halfGeo, domeMat);
  const halfB = new THREE.Mesh(halfGeo, domeMat);
  halfA.position.set(CX, DRUM, CZ);
  halfB.position.set(CX, DRUM, CZ);
  halfB.rotation.y = Math.PI;
  root.add(halfA, halfB);

  // meridian ribs on each half, inside and out
  for (const half of [halfA, halfB]) {
    for (let m = 1; m <= 5; m += 1) {
      const phi = (m / 6) * Math.PI;
      const pts = [];
      for (let i = 0; i <= 18; i += 1) {
        const theta = (i / 18) * (Math.PI / 2);
        pts.push(new THREE.Vector3(
          Math.sin(theta) * Math.cos(phi) * R,
          Math.cos(theta) * R,
          Math.sin(theta) * Math.sin(phi) * R
        ));
      }
      const rib = new THREE.Mesh(tubeGeometry(pts, 0.075, 44, 5), mats.steelDark);
      half.add(rib);
    }
    // horizontal purlin rings at two heights
    for (const f of [0.42, 0.74]) {
      const rr = Math.sin(Math.acos(f)) * R;
      const purlin = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.06, 5, 40, Math.PI), mats.steelDark);
      purlin.rotation.x = Math.PI / 2;
      purlin.position.y = R * f;
      half.add(purlin);
    }
  }

  /* ---- telescope on an equatorial fork ------------------------------- */
  const telescope = new THREE.Group();
  telescope.position.set(CX, 0, CZ);
  telescope.add(cylinder(1.1, 1.25, 0.4, mats.concreteDark, 0, 0.2, 0, 28));
  telescope.add(cylinder(0.7, 0.9, 1.9, mats.steelDeep, 0, 1.2, 0, 24));
  const mount = new THREE.Group();
  mount.position.y = 2.3;
  mount.rotation.z = -0.42;
  telescope.add(mount);
  mount.add(cylinder(0.5, 0.6, 0.5, mats.steelDark, 0, 0.2, 0, 20));
  for (const dx of [-0.85, 0.85]) {
    mount.add(box(0.26, 1.9, 0.7, mats.steelDark, dx, 1.2, 0));
  }
  mount.add(box(1.95, 0.3, 0.8, mats.steelDark, 0, 2.1, 0));

  const tubeGroup = new THREE.Group();
  tubeGroup.position.y = 1.35;
  tubeGroup.rotation.x = -0.95;
  mount.add(tubeGroup);
  tubeGroup.add(cylinder(0.42, 0.42, 4.4, mats.plasterWarm, 0, 1.2, 0, 28));
  tubeGroup.add(cylinder(0.46, 0.46, 0.16, mats.steelDark, 0, 3.36, 0, 28));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.4, 28), mats.glass);
  lens.position.y = 3.45;
  lens.rotation.x = -Math.PI / 2;
  tubeGroup.add(lens);
  tubeGroup.add(cylinder(0.16, 0.16, 0.5, mats.steelDark, 0, 3.6, 0, 12));
  // counterweight and finder
  tubeGroup.add(cylinder(0.44, 0.44, 0.3, mats.copperDark, 0, -1.05, 0, 20));
  tubeGroup.add(cylinder(0.09, 0.09, 1.0, mats.aluminium, 0.55, 1.6, 0.1, 10));
  // instrument box at the back
  tubeGroup.add(box(0.55, 0.5, 0.6, mats.blackened, 0, 0.1, 0.2));
  telescope.add(mount);
  root.add(telescope);

  // observing ladder and a chair
  root.add(cylinder(0.05, 0.05, 3.2, mats.aluminium, CX - 3.4, 1.6, CZ + 2.4, 6));
  root.add(box(0.6, 0.06, 0.06, mats.aluminium, CX - 3.4, 3.2, CZ + 2.4));
  root.add(box(0.55, 0.08, 0.55, mats.steelDeep, CX - 4.6, 0.55, CZ + 4.2));
  root.add(cylinder(0.06, 0.06, 0.55, mats.steel, CX - 4.6, 0.28, CZ + 4.2, 8));

  /* ---- orbital arcs and travelling lights ---------------------------- */
  const arcGroup = new THREE.Group();
  arcGroup.position.set(CX, 0, CZ);
  root.add(arcGroup);
  const arcs = [];
  const arcSpecs = [
    { r: 9.5, h: 11.2, tilt: 0.35, span: 0.72, color: 0x7fe8c8 },
    { r: 11.6, h: 13.6, tilt: -0.28, span: 0.58, color: 0xf2c98a },
    { r: 7.4, h: 9.4, tilt: 0.75, span: 0.66, color: 0xa8d8ff },
  ];
  arcSpecs.forEach((spec, index) => {
    const pts = [];
    const start = index * 1.1;
    for (let i = 0; i <= 40; i += 1) {
      const a = start + (i / 40) * Math.PI * 2 * spec.span;
      pts.push(new THREE.Vector3(
        Math.cos(a) * spec.r,
        spec.h + Math.sin(a * 2 + index) * 0.5,
        Math.sin(a) * spec.r * Math.cos(spec.tilt)
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const mat = new THREE.MeshBasicMaterial({
      color: spec.color, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    ctx.addMaterial(mat);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.035, 6, false), mat);
    arcGroup.add(tube);
    const light = glowSprite(ctx.textures.radial, spec.color, 1.5, 0.9);
    arcGroup.add(light);
    arcs.push({ curve, light, phase: index * 0.33 });
  });

  ctx.animations.push((t) => {
    const open = ctx.dome.mix;
    halfA.rotation.y = -0.015 - open * 0.62;
    halfB.rotation.y = Math.PI + 0.015 + open * 0.62;
    telescope.rotation.y = Math.sin(t * 0.07) * 0.12;
    mount.rotation.y = Math.sin(t * 0.11 + 1.2) * 0.06;
    for (const arc of arcs) {
      const u = (t * 0.045 + arc.phase) % 1;
      const point = arc.curve.getPointAt(u);
      arc.light.position.copy(point);
      arc.light.material.opacity = 0.55 + Math.sin(t * 2 + arc.phase * 6) * 0.3;
    }
  });

  const observingLight = new THREE.PointLight(0xffd9b0, 110, 30, 2);
  observingLight.position.set(CX, 7.2, CZ + 2);
  root.add(observingLight);
  const floorGlow = new THREE.Mesh(new THREE.TorusGeometry(R - 0.9, 0.05, 5, 72), mats.emitWarm);
  floorGlow.rotation.x = Math.PI / 2;
  floorGlow.position.set(CX, 0.1, CZ);
  root.add(floorGlow);

  /* ---- control desk --------------------------------------------------- */
  root.add(box(3.2, 0.9, 0.8, mats.steelDeep, CX - 6.5, 0.55, CZ + 6.5));
  const skyScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95), mats.screenSky);
  skyScreen.position.set(CX - 7.2, 1.2, CZ + 6.42);
  skyScreen.rotation.x = -0.42;
  root.add(skyScreen);
  const skyScreen2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), mats.screenLock);
  skyScreen2.position.set(CX - 5.6, 1.18, CZ + 6.42);
  skyScreen2.rotation.x = -0.42;
  root.add(skyScreen2);

  /* ---- moon, visible through the open slit --------------------------- */
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(9, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xf6f0dc })
  );
  moon.position.set(CX - 26, 118, CZ - 300);
  root.add(moon);
  const moonGlow = glowSprite(ctx.textures.radial, 0xfff6dd, 80, 0.5);
  moonGlow.position.copy(moon.position);
  root.add(moonGlow);

  ctx.dome.halves = { halfA, halfB };

  ctx.group.add(root);
  ctx.stationRoots.push(root);
  return root;
}

/* ========================================================================== *
 *  Station 06 — Publication Archive & Collaboration Deck
 * ========================================================================== */

function buildArchive(ctx, publications) {
  const { mats } = ctx;
  const root = new THREE.Group();
  root.name = 'StationArchive';
  root.userData.stationId = 'archive';
  root.userData.stationIndex = 5;

  /* ---- timber deck ---------------------------------------------------- */
  const deck = box(70, 0.22, 40, mats.oakDark, 256, 0.02, 2);
  deck.receiveShadow = true;
  root.add(deck);
  // plank joints
  for (let x = 222; x <= 290; x += 1.2) {
    root.add(box(0.03, 0.012, 39.6, mats.oak, x, 0.14, 2));
  }

  /* ---- reflecting pool ------------------------------------------------ */
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(38, 17), mats.water);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(249, 0.46, -10);
  root.add(pool);
  for (const [w, h, x, z] of [[38.8, 0.55, 249, -18.7], [38.8, 0.55, 249, -1.3], [0.55, 17.9, 229.8, -10], [0.55, 17.9, 268.2, -10]]) {
    root.add(box(w, 0.62, h, mats.stoneTop, x, 0.32, z));
  }

  /* ---- floating illuminated monographs ------------------------------- */

  /* ---- floating illuminated monographs ------------------------------- */
  const pageTextures = publications.slice(0, 4).map((entry, index) => {
    const texture = makePageTexture(entry, index);
    if (texture) ctx.extraTextures.push(texture);
    return texture;
  });
  const monoliths = [];
  const positions = [
    [240, 3.2, -6.5], [246, 2.9, -0.5], [252, 3.7, -9],
    [258, 3.0, -3.5], [263, 3.4, -8], [245, 2.6, 4.5], [261, 2.4, 3.0],
  ];
  positions.forEach(([x, y, z], index) => {
    const group = new THREE.Group();
    group.position.set(x, y + 1.3, z);
    group.rotation.y = Math.atan2(236 - x, 7 - z) + (index % 2 ? 0.1 : -0.1);
    const texture = pageTextures[index % pageTextures.length];
    const body = box(2.15, 5.1, 0.14, mats.glass, 0, 0, 0);
    group.add(body);
    group.add(box(2.24, 5.18, 0.05, mats.brass, 0, 0, -0.02));
    if (texture) {
      const pageMat = new THREE.MeshStandardMaterial({
        map: texture, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 1.05,
        metalness: 0.05, roughness: 0.85, transparent: true, opacity: 0.97,
        side: THREE.DoubleSide, envMap: ctx.envMap, envMapIntensity: 0.2,
      });
      ctx.addMaterial(pageMat);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 5.0), pageMat);
      front.position.z = 0.085;
      group.add(front);
      const back = front.clone();
      back.position.z = -0.085;
      back.rotation.y = Math.PI;
      group.add(back);
      group.userData.pageMat = pageMat;
    }
    const under = glowSprite(ctx.textures.radial, 0xffd9a0, 5.6, 0.26);
    under.position.y = -2.7;
    group.add(under);
    root.add(group);
    monoliths.push({ group, baseY: y + 1.3, phase: index * 0.7, under });
  });

  ctx.animations.push((t) => {
    monoliths.forEach((m, i) => {
      m.group.position.y = m.baseY + Math.sin(t * 0.35 + m.phase) * 0.18;
      m.group.rotation.y += 0.0006 * (i % 2 ? 1 : -1);
      if (m.group.userData.pageMat) {
        m.group.userData.pageMat.emissiveIntensity = 0.92 + ctx.experiment.value * 0.5 + Math.sin(t * 0.8 + i) * 0.04;
      }
      m.under.material.opacity = 0.16 + ctx.experiment.value * 0.1;
    });
  });

  /* ---- reading terrace: pergola, table, lanterns --------------------- */
  const TX = 279;
  const TZ = 10;
  for (const dx of [-4.5, 0, 4.5]) {
    for (const dz of [-4, 4]) {
      root.add(box(0.18, 3.4, 0.18, mats.oakDark, TX + dx, 1.7, TZ + dz));
    }
  }
  for (let dz = -4; dz <= 4; dz += 0.55) {
    root.add(box(9.6, 0.09, 0.12, mats.oakPale, TX, 3.5, TZ + dz));
  }
  root.add(box(10, 0.18, 0.18, mats.oakDark, TX, 3.35, TZ - 4));
  root.add(box(10, 0.18, 0.18, mats.oakDark, TX, 3.35, TZ + 4));

  // long table and benches
  root.add(box(7.4, 0.12, 1.5, mats.oakPale, TX, 0.78, TZ));
  for (const dx of [-3.1, 0, 3.1]) {
    root.add(box(0.16, 0.72, 1.2, mats.steelDark, TX + dx, 0.39, TZ));
  }
  for (const dz of [-1.5, 1.5]) {
    root.add(box(7.4, 0.1, 0.5, mats.oak, TX, 0.5, TZ + dz));
    for (const dx of [-3.1, 3.1]) {
      root.add(box(0.14, 0.46, 0.42, mats.steelDark, TX + dx, 0.24, TZ + dz));
    }
  }
  // books and cups on the table
  for (let i = 0; i < 7; i += 1) {
    root.add(box(0.3, 0.06, 0.22, i % 2 ? mats.plaster : mats.oakDark, TX - 2.4 + i * 0.7, 0.87, TZ + (i % 3) * 0.2 - 0.2));
  }
  for (const dx of [-1.8, 1.2]) {
    root.add(cylinder(0.06, 0.05, 0.12, mats.emitWarm, TX + dx, 0.9, TZ + 0.3, 10));
  }

  // paper lanterns hanging from the pergola
  const lanterns = [];
  for (let i = 0; i < 7; i += 1) {
    const dx = -3.6 + i * 1.2;
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mats.paperLantern);
    lantern.position.set(TX + dx, 2.75, TZ + (i % 2 ? 1.4 : -1.4));
    root.add(lantern);
    root.add(cylinder(0.012, 0.012, 0.6, mats.steelDark, TX + dx, 3.2, TZ + (i % 2 ? 1.4 : -1.4), 4));
    lanterns.push(lantern);
  }
  ctx.animations.push((t) => {
    lanterns.forEach((lantern, i) => {
      lantern.material.emissiveIntensity = 1.1 + Math.sin(t * 1.4 + i * 0.9) * 0.12;
    });
  });

  /* ---- fireplace and bookshelf -------------------------------------- */
  root.add(box(2.2, 1.5, 1.0, mats.concreteDark, 286, 0.75, 3));
  const fireOpening = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: 0x160c06 }));
  fireOpening.position.set(286, 0.6, 3.51);
  root.add(fireOpening);
  const fireGlow = glowSprite(ctx.textures.radial, 0xff9a4a, 3.2, 0.55);
  fireGlow.position.set(286, 0.65, 3.6);
  root.add(fireGlow);
  ctx.animations.push((t) => {
    fireGlow.material.opacity = 0.45 + Math.sin(t * 6.2) * 0.06 + Math.sin(t * 11.0) * 0.04;
  });

  root.add(box(0.4, 2.6, 8, mats.oakDark, 289, 1.3, -4));
  for (let i = 0; i < 5; i += 1) {
    root.add(box(0.3, 0.04, 7.4, mats.oakPale, 288.85, 0.7 + i * 0.45, -4));
    for (let b = 0; b < 9; b += 1) {
      root.add(box(0.16, 0.3, 0.2, b % 3 === 0 ? mats.emitAmber : mats.plaster, 288.8, 0.9 + i * 0.45, -7 + b * 0.75));
    }
  }

  /* ---- string lights across the terrace ----------------------------- */
  const bulbs = [];
  for (let i = 0; i < 3; i += 1) {
    const x0 = 226 + i * 1.5;
    const pts = [];
    for (let s = 0; s <= 12; s += 1) {
      const u = s / 12;
      pts.push(new THREE.Vector3(
        x0 + u * 60,
        4.2 - Math.sin(u * Math.PI) * 1.1,
        -16 + i * 15 + Math.sin(u * Math.PI * 2) * 0.4
      ));
    }
    const wire = new THREE.Mesh(tubeGeometry(pts, 0.012, 80, 4), mats.steelDeep);
    root.add(wire);
    for (let s = 1; s < 12; s += 1) {
      const point = pts[s];
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), mats.emitWarm);
      bulb.position.set(point.x, point.y - 0.12, point.z);
      root.add(bulb);
      bulbs.push(bulb);
    }
  }

  /* ---- deck edge: low stone parapet and a continuous light line -------- */
  root.add(box(0.4, 0.85, 40, mats.concrete, 290.2, 0.34, 2));
  root.add(box(70, 0.85, 0.4, mats.concrete, 256, 0.34, 21.8));
  root.add(box(70, 0.85, 0.4, mats.concrete, 256, 0.34, -17.8));
  root.add(box(70, 0.06, 0.1, mats.emitWarm, 256, 0.8, 21.55));
  root.add(box(0.1, 0.06, 40, mats.emitWarm, 289.95, 0.8, 2));

  // standing lanterns along the pool
  for (let i = 0; i < 6; i += 1) {
    const x = 232 + i * 7.2;
    root.add(cylinder(0.06, 0.09, 2.4, mats.steelDark, x, 1.2, -20.2, 8));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mats.paperLantern);
    head.position.set(x, 2.5, -20.2);
    root.add(head);
  }

  /* ---- entry arch with the archive plate ----------------------------- */
  const archX = 224;
  for (const dz of [-4.5, 4.5]) {
    root.add(box(0.28, 5.4, 0.28, mats.oakDark, archX, 2.7, dz));
  }
  root.add(box(0.32, 0.32, 9.4, mats.oakDark, archX, 5.4, 0));
  const archiveLabel = makeLabelTexture('06 · ARCHIVE', 'publication archive & collaboration deck', '#f2c98a', { dark: true, titleSize: 88 });
  if (archiveLabel) {
    ctx.extraTextures.push(archiveLabel);
    const mat = new THREE.MeshStandardMaterial({
      map: archiveLabel, emissive: 0xffffff, emissiveMap: archiveLabel, emissiveIntensity: 0.4,
      metalness: 0.2, roughness: 0.7, side: THREE.DoubleSide,
    });
    ctx.addMaterial(mat);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), mat);
    plate.position.set(archX - 0.2, 5.4, 0);
    plate.rotation.y = -Math.PI / 2;
    root.add(plate);
  }

  ctx.group.add(root);
  ctx.stationRoots.push(root);
  return root;
}

/* ========================================================================== *
 *  Lighting — a south sun that falls away into twilight
 * ========================================================================== */

function buildLighting(ctx) {
  const group = new THREE.Group();
  group.name = 'ResearchLighting';

  const hemi = new THREE.HemisphereLight(0xbcd6e8, 0x6d6a52, 0.78);
  group.add(hemi);

  const ambient = new THREE.AmbientLight(0x8899a6, 0.2);
  group.add(ambient);

  const sun = new THREE.DirectionalLight(0xffe8c8, 2.3);
  sun.position.set(-60, 170, 240);
  sun.target.position.set(-40, 0, -20);
  if (ctx.cfg.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(ctx.cfg.shadowMapSize, ctx.cfg.shadowMapSize);
    sun.shadow.camera.left = -260;
    sun.shadow.camera.right = 260;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    sun.shadow.camera.near = 40;
    sun.shadow.camera.far = 620;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.7;
  }
  group.add(sun);
  group.add(sun.target);

  const fill = new THREE.DirectionalLight(0xa8c8dd, 0.45);
  fill.position.set(120, 110, -230);
  fill.target.position.set(-20, 6, 0);
  group.add(fill);
  group.add(fill.target);

  const skyFill = new THREE.DirectionalLight(0xdfeaf2, 0.3);
  skyFill.position.set(0, 120, -80);
  skyFill.target.position.set(-40, 4, 0);
  group.add(skyFill);
  group.add(skyFill.target);

  const practicals = [];
  for (const [x, y, z, color, intensity, distance] of [
    [-205, 12.4, -3, 0xffdcae, 55, 34],
    [-107, 4.4, 1.5, 0xa9f0e0, 30, 20],
    [-97, 4.0, -11, 0x9fd8ff, 22, 16],
    [-8, 4.2, 3, 0xbdf6da, 28, 20],
    [96, 4.6, 0, 0x9fd8ff, 34, 24],
    [196, 6.5, 0, 0xbcd6f5, 26, 22],
    [279, 3.0, 10, 0xffc07a, 85, 26],
    [249, 3.2, -8, 0xffd2a0, 95, 26],
  ]) {
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(x, y, z);
    group.add(light);
    practicals.push(light);
  }

  // warm nave practicals along the roof, one per bay
  const nave = [];
  for (let x = -230; x <= 176; x += 36) {
    const lamp = new THREE.PointLight(0xffd2a2, 26, 34, 2);
    lamp.position.set(x, 10.6, 0);
    group.add(lamp);
    nave.push(lamp);
  }

  ctx.group.add(group);
  ctx.lights = { hemi, ambient, sun, fill, skyFill, practicals, nave };
  return group;
}

/* ========================================================================== *
 *  Camera path — composed so the hero sits right of the left-hand card
 * ========================================================================== */

const CAMERA_KEYS = [
  { p: 0.0, pos: [-226, 7.4, 18], subj: [-192, 6.8, -4], fov: 44, shift: 0.24 },
  { p: 0.075, pos: [-214, 5.8, 12], subj: [-190, 6.6, -3], fov: 46, shift: 0.26 },
  { p: 0.14, pos: [-204, 5.2, 8], subj: [-184, 5.4, 1], fov: 50, shift: 0.26 },
  { p: 0.17, pos: [-198, 6.0, 16], subj: [-160, 5.0, 0], fov: 52, shift: 0.24 },
  { p: 0.2, pos: [-142, 5.6, 14], subj: [-116, 2.4, 1], fov: 52, shift: 0.24 },
  { p: 0.265, pos: [-121, 3.9, 11], subj: [-108, 1.9, 1], fov: 48, shift: 0.24 },
  { p: 0.31, pos: [-104, 4.4, 6], subj: [-97, 4.4, -9], fov: 50, shift: 0.22 },
  { p: 0.345, pos: [-110, 5.0, 11], subj: [-98, 4.6, -9], fov: 52, shift: 0.22 },
  { p: 0.36, pos: [-52, 6.0, 16], subj: [-18, 4.0, 0], fov: 52, shift: 0.24 },
  { p: 0.42, pos: [-38, 5.2, 15], subj: [-8, 4.0, -2], fov: 50, shift: 0.24 },
  { p: 0.46, pos: [-24, 4.6, 12], subj: [-1, 3.8, -1], fov: 50, shift: 0.24 },
  { p: 0.51, pos: [-18, 4.4, 8], subj: [-1, 3.2, 1], fov: 54, shift: 0.23 },
  { p: 0.56, pos: [58, 6.4, 18], subj: [92, 6.4, -10], fov: 52, shift: 0.24 },
  { p: 0.62, pos: [72, 6.0, 10], subj: [94, 6.2, -11], fov: 50, shift: 0.24 },
  { p: 0.65, pos: [82, 4.6, 2], subj: [96, 5.0, -10], fov: 50, shift: 0.24 },
  { p: 0.69, pos: [92, 4.2, 0], subj: [98, 3.4, -8], fov: 54, shift: 0.22 },
  { p: 0.73, pos: [110, 5.0, 8], subj: [106, 3.0, 2], fov: 54, shift: 0.2 },
  { p: 0.76, pos: [166, 6.2, 12], subj: [196, 9.0, -4], fov: 52, shift: 0.24 },
  { p: 0.795, pos: [180, 5.0, 1.5], subj: [198, 10.0, -2], fov: 54, shift: 0.22 },
  { p: 0.83, pos: [187, 3.4, 8.5], subj: [200, 9.0, -2], fov: 58, shift: 0.2 },
  { p: 0.875, pos: [194, 3.6, 7], subj: [203, 12.0, -4], fov: 60, shift: 0.18 },
  { p: 0.9, pos: [211, 4.2, 1.5], subj: [240, 5.0, 0], fov: 54, shift: 0.22 },
  { p: 0.93, pos: [228, 4.2, 2.5], subj: [250, 3.4, -6], fov: 52, shift: 0.24 },
  { p: 0.96, pos: [236, 5.8, 7], subj: [254, 3.6, -5], fov: 52, shift: 0.26 },
  { p: 1.0, pos: [244, 5.6, 10], subj: [262, 3.4, -1], fov: 52, shift: 0.24 },
];

const DEG2RAD = Math.PI / 180;

function composeFraming(position, subject, fov, shift, aspect, outLook) {
  const distance = Math.max(1.0, position.distanceTo(subject));
  const forward = outLook.copy(subject).sub(position).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  right.normalize();
  const tanHalfV = Math.tan((fov * DEG2RAD) / 2);
  const tanHalfH = tanHalfV * Math.max(0.2, aspect);
  const tanYaw = shift * tanHalfH;
  const lookDir = forward.clone().addScaledVector(right, -tanYaw).normalize();
  outLook.copy(position).addScaledVector(lookDir, distance);
  return outLook;
}

function sampleCameraPath(progress, aspect, out) {
  const p = clamp01(progress);
  let i = 0;
  while (i < CAMERA_KEYS.length - 2 && p > CAMERA_KEYS[i + 1].p) i += 1;
  const a = CAMERA_KEYS[i];
  const b = CAMERA_KEYS[i + 1];
  const t = clamp01((p - a.p) / Math.max(1e-6, b.p - a.p));
  const e = smootherstep(0, 1, t);

  out.position.set(
    lerp(a.pos[0], b.pos[0], e),
    lerp(a.pos[1], b.pos[1], e),
    lerp(a.pos[2], b.pos[2], e)
  );
  const subject = new THREE.Vector3(
    lerp(a.subj[0], b.subj[0], e),
    lerp(a.subj[1], b.subj[1], e),
    lerp(a.subj[2], b.subj[2], e)
  );
  out.fov = lerp(a.fov, b.fov, e);
  const shift = lerp(a.shift !== undefined ? a.shift : 0.24, b.shift !== undefined ? b.shift : 0.24, e);

  // a slow breath so a still camera never looks frozen, plus a faint handheld
  // tremor that reads as a real camera operator rather than a locked rig
  out.position.x += Math.sin(p * 41.0) * 0.04 + Math.sin(p * 13.0) * 0.14;
  out.position.y += Math.sin(p * 29.0 + 1.3) * 0.05 + Math.sin(p * 8.0) * 0.1;
  out.position.z += Math.cos(p * 17.0 + 0.6) * 0.09;

  composeFraming(out.position, subject, out.fov, shift, aspect, out.lookAt);
  return out;
}

/* ========================================================================== *
 *  Telemetry — smooth, plausible, always finite
 * ========================================================================== */

function telemetryFor(progress, time, experiment, laserMix) {
  const p = clamp01(progress);
  const t = finite(time, 0);
  const pulse = clamp01(finite(experiment, 0));
  const aligned = clamp01(finite(laserMix, 0));
  const settle = smoothstep(0.1, 0.3, p);
  const atOptics = smoothstep(0.18, 0.26, p) * (1 - smoothstep(0.33, 0.42, p));
  const atCompute = smoothstep(0.48, 0.62, p) * (1 - smoothstep(0.74, 0.86, p));

  const temperatureBase = 12.4 + 0.32 * Math.sin(t * 0.31) + 0.14 * Math.sin(t * 1.7 + 0.6);
  const temperatureMk = finite(
    temperatureBase - atOptics * pulse * 3.4 - settle * 0.6 + 0.9 * smoothstep(0.86, 1.0, p),
    temperatureBase
  );

  const lockBase = 95.6 + 3.3 * aligned + atOptics * 0.6 + 0.16 * Math.sin(t * 0.7);
  const laserLockPct = finite(lockBase + pulse * 0.35, lockBase);

  const computeBase = 0.9 + 17.7 * smoothstep(0.34, 0.64, p) - 8.2 * smoothstep(0.8, 0.97, p);
  const computePf = finite(computeBase + atCompute * pulse * 1.8 + 0.22 * Math.sin(t * 0.9), computeBase);

  const citationBase = 1284 + 1896 * smootherstep(0.0, 0.95, p) + 3 * Math.sin(t * 0.11);
  const citations = Math.round(finite(citationBase, 1284));
  const datasetBase = 48 + 166 * smootherstep(0.1, 0.9, p);
  const datasets = Math.round(finite(datasetBase, 48));

  const timeOfDay = finite(smoothstep(0.12, 0.99, p), 0);

  return {
    temperatureMk: Math.round(clamp(temperatureMk, 5, 25) * 10) / 10,
    laserLockPct: Math.round(clamp(laserLockPct, 90, 99.9) * 10) / 10,
    computePf: Math.round(clamp(computePf, 0.6, 22) * 10) / 10,
    citations,
    datasets,
    timeOfDay: Math.round(timeOfDay * 1000) / 1000,
  };
}

/* ========================================================================== *
 *  World factory
 * ========================================================================== */

export function createResearchWorld(scene, options = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new Error('createResearchWorld(scene, options): a THREE.Scene is required');
  }

  const cfg = resolveConfig(options);
  const group = new THREE.Group();
  group.name = 'ResearchWorld';

  const uniforms = {
    time: { value: 0 },
    fogColor: { value: new THREE.Color(0xd3d6cd) },
    fogDensity: { value: 0.00135 },
    floorSeam: { value: new THREE.Color(0xb08a4e) },
  };

  const animations = [];
  const materials = new Set();
  const extraTextures = [];
  const stationRoots = [];
  const stationHooks = {};
  const experiment = { value: 0, target: 0 };
  const laser = { mix: 0, target: 0 };
  const dome = { mix: 0 };

  const envMap = makeEnvironmentTexture();
  envMap.mapping = THREE.EquirectangularReflectionMapping;

  const textures = {
    terrazzo: makeTerrazzoTexture(),
    oak: makeOakTexture(),
    brushed: makeBrushedTexture(),
    plaster: makePlasterTexture(),
    perf: makePerforatedTexture(),
    screenCryo: makeScreenTexture('cryo', '#7fe0c4', 1),
    screenProtein: makeScreenTexture('protein', '#8fe3c8', 2),
    screenAtlas: makeScreenTexture('atlas', '#f2c98a', 3),
    screenSky: makeScreenTexture('sky', '#cfe0ff', 4),
    screenLock: makeScreenTexture('lock', '#9fe8d0', 5),
    radial: makeRadialGlowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'),
    mist: makeMistTexture(),
  };

  const createdTextures = new Set();
  for (const tex of Object.values(textures)) if (tex) createdTextures.add(tex);
  if (envMap) createdTextures.add(envMap);

  const ctx = {
    scene,
    group,
    cfg,
    envMap,
    textures,
    uniforms,
    extraTextures,
    stationRoots,
    stationHooks,
    animations,
    experiment,
    laser,
    dome,
    clock: { elapsed: 0 },
    addMaterial(material) {
      if (material) materials.add(material);
      return material;
    },
    addAnimation(fn) {
      if (typeof fn === 'function') animations.push(fn);
    },
  };
  // `ctx.animations.push` is used directly inside the station builders.
  ctx.animations = animations;

  ctx.mats = createMaterialSet(ctx);

  /* ---- fog & background -------------------------------------------------- */
  const previousFog = scene.fog || null;
  let ownFog = null;
  if (cfg.manageFog) {
    ownFog = new THREE.FogExp2(0xd3d6cd, 0.00135);
    scene.fog = ownFog;
  }
  const previousBackground = scene.background !== undefined ? scene.background : null;
  let ownBackground = null;
  if (cfg.manageBackground) {
    ownBackground = new THREE.Color(0xd9dcd1);
    scene.background = ownBackground;
  }

  /* ---- environment ------------------------------------------------------- */
  const sky = buildSky(ctx);
  buildLandscape(ctx);
  buildShell(ctx);
  buildSignage(ctx);

  /* ---- stations ---------------------------------------------------------- */
  buildAtrium(ctx);
  buildOptics(ctx);
  buildWetLab(ctx);
  buildCompute(ctx);
  buildObservatory(ctx);
  buildArchive(ctx, options.publications || []);

  /* ---- lighting ---------------------------------------------------------- */
  buildLighting(ctx);

  /* ---- click proxies: an invisible sphere per station -------------------- */
  const pickProxies = [];
  RESEARCH_PHASES.forEach((phase, index) => {
    const anchor = PICK_ANCHORS[phase.id] || { x: 0, y: 4, z: 0, r: 10 };
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(anchor.r, 8, 6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    proxy.position.set(anchor.x, anchor.y, anchor.z);
    proxy.name = `Pick-${phase.id}`;
    proxy.userData.stationId = phase.id;
    proxy.userData.stationIndex = index;
    group.add(proxy);
    pickProxies.push(proxy);
  });

  scene.add(group);

  // the sky follows the eye so the dome never shows a seam
  // (set on every update, and once here so a first render is correct)

  /* ---- pose -------------------------------------------------------------- */
  const poseOut = {
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    fov: 50,
  };
  let aspect = cfg.viewportAspect;

  function getResearchPose(progress = 0) {
    const p = clamp01(progress);
    sampleCameraPath(p, aspect, poseOut);
    const phaseInfo = phaseAtProgress(p);
    const metrics = telemetryFor(p, ctx.clock.elapsed, experiment.value, laser.mix);
    return {
      cameraPos: poseOut.position.clone(),
      lookAt: poseOut.lookAt.clone(),
      fov: poseOut.fov,
      phaseName: phaseInfo.phase.name,
      phaseId: phaseInfo.phase.id,
      station: phaseInfo.station,
      temperatureMk: metrics.temperatureMk,
      laserLockPct: metrics.laserLockPct,
      computePf: metrics.computePf,
      citations: metrics.citations,
      datasets: metrics.datasets,
      timeOfDay: metrics.timeOfDay,
    };
  }

  function setViewport(nextAspect) {
    if (Number.isFinite(nextAspect) && nextAspect > 0.1) aspect = clamp(nextAspect, 0.4, 3.5);
  }

  /* ---- update ------------------------------------------------------------ */
  let lastElapsed = 0;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function update(elapsed, delta, progress, camera) {
    const t = Number.isFinite(elapsed) ? elapsed : lastElapsed + 0.016;
    const dt = clamp(Number.isFinite(delta) ? delta : 0.016, 0, 0.1);
    lastElapsed = t;
    ctx.clock.elapsed = t;
    uniforms.time.value = t;

    const p = clamp01(Number.isFinite(progress) ? progress : 0);
    const night = smoothstep(0.2, 0.98, p);

    if (camera && camera.position) {
      sky.mesh.position.copy(camera.position);
    }

    // experiment pulse: a sharp attack, a slow release
    experiment.value = lerp(experiment.value, experiment.target, clamp01(dt * 6.0));
    experiment.target = Math.max(0, experiment.target - dt * 0.6);
    if (experiment.value < 0.002) experiment.value = 0;

    // laser path crossfade
    laser.mix += clamp(laser.target - laser.mix, -dt * 1.8, dt * 1.8);

    // dome opens as the visitor arrives, and stays open
    const domeTarget = smoothstep(0.75, 0.815, p);
    dome.mix += clamp(domeTarget - dome.mix, -dt * 2.2, dt * 2.2);

    if (ownFog) {
      const targetColor = new THREE.Color(0xd3d6cd).lerp(new THREE.Color(0x161b2a), night);
      ownFog.color.lerp(targetColor, clamp01(dt * 0.8));
      uniforms.fogColor.value.copy(ownFog.color);
      const targetDensity = lerp(0.0013, 0.0029, night);
      ownFog.density += (targetDensity - ownFog.density) * Math.min(1, dt * 1.2);
      uniforms.fogDensity.value = ownFog.density;
    }
    if (ownBackground) {
      ownBackground.lerpColors(new THREE.Color(0xd9dcd1), new THREE.Color(0x121726), night);
    }

    sky.uniforms.uNight.value = night;
    sky.uniforms.uSunDir.value.set(0.22, lerp(0.42, -0.12, p), 0.88).normalize();

    const lights = ctx.lights;
    lights.sun.intensity = lerp(2.3, 0.05, smoothstep(0.25, 0.95, p));
    lights.sun.color.setHSL(lerp(0.09, 0.06, night), lerp(0.55, 0.4, night), lerp(0.72, 0.45, night));
    lights.hemi.intensity = lerp(0.78, 0.24, night);
    lights.ambient.intensity = lerp(0.2, 0.14, night);
    lights.fill.intensity = lerp(0.45, 0.14, night);
    lights.skyFill.intensity = lerp(0.3, 0.09, night);
    lights.practicals.forEach((light, i) => {
      light.intensity = light.userData.base || (light.userData.base = light.intensity);
      light.intensity *= 1 + (i >= 6 ? night * 0.5 : -night * 0.15);
    });
    lights.nave.forEach((lamp) => {
      lamp.intensity = lerp(20, 34, night);
    });
    if (ctx.landscape) {
      ctx.landscape.lightMat.opacity = smoothstep(0.55, 0.95, p) * 0.9;
    }

    for (let i = 0; i < animations.length; i += 1) animations[i](t, dt, p);

    // keep the dome material's alpha stable and open the slit at twilight
    if (ctx.dome.halves) {
      const open = dome.mix;
      ctx.dome.halves.halfA.rotation.y = -0.015 - open * 0.62;
      ctx.dome.halves.halfB.rotation.y = Math.PI + 0.015 + open * 0.62;
    }
  }

  /* ---- interaction ------------------------------------------------------- */
  function triggerExperiment() {
    experiment.target = 1;
    experiment.value = Math.max(experiment.value, 0.55);
    if (stationHooks.optics) {
      // fire the visible pulse at the optics bench
      stationHooks.optics.spot.material.opacity = 1;
    }
    return true;
  }

  function setLaserAlignment(enabled) {
    laser.target = enabled ? 1 : 0;
    // the beam path is a physical selection, not a dimmer: snap on command and
    // let the mirror rotation and beam opacity read the state on the next frame
    laser.mix = laser.target;
    return Boolean(enabled);
  }

  function getLaserAlignment() {
    return laser.target > 0.5;
  }

  function pickStation(ndcX, ndcY) {
    if (!Number.isFinite(ndcX) || !Number.isFinite(ndcY)) return null;
    ndc.set(clamp(ndcX, -1, 1), clamp(ndcY, -1, 1));
    raycaster.setFromCamera(ndc, cameraRef || new THREE.PerspectiveCamera());
    const hits = raycaster.intersectObjects(pickProxies, false);
    if (!hits.length) return null;
    const hit = hits[0];
    const object = hit.object;
    return {
      id: object.userData.stationId,
      index: object.userData.stationIndex,
      point: { x: Math.round(hit.point.x * 100) / 100, y: Math.round(hit.point.y * 100) / 100, z: Math.round(hit.point.z * 100) / 100 },
    };
  }

  // The main loop passes the live camera into update(); the picker needs the
  // same object, so keep the most recent one.
  let cameraRef = null;
  const baseUpdate = update;
  function updateWithCamera(elapsed, delta, progress, camera) {
    if (camera) cameraRef = camera;
    return baseUpdate(elapsed, delta, progress, camera);
  }

  /* ---- zones ------------------------------------------------------------- */
  const zones = RESEARCH_PHASES.map((phase, i) => {
    const anchor = PICK_ANCHORS[phase.id] || { x: 0, y: 4, z: 0, r: 10 };
    return {
      id: phase.id,
      name: phase.name,
      station: i + 1,
      start: phase.start,
      end: phase.end,
      center: new THREE.Vector3(anchor.x, anchor.y, anchor.z),
      radius: phase.id === 'archive' ? 60 : 26,
    };
  });

  /* ---- dispose ----------------------------------------------------------- */
  function dispose() {
    animations.length = 0;
    scene.remove(group);
    group.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (const mat of list) {
          if (!mat) continue;
          mat.dispose();
        }
      }
    });
    for (const mat of materials) mat.dispose();
    for (const tex of createdTextures) if (tex) tex.dispose();
    for (const tex of extraTextures) if (tex) tex.dispose();
    if (scene.fog === ownFog) scene.fog = previousFog;
    if (scene.background === ownBackground) scene.background = previousBackground;
  }

  return {
    group,
    zones,
    lights: ctx.lights,
    getResearchPose,
    setViewport,
    update: updateWithCamera,
    triggerExperiment,
    setLaserAlignment,
    getLaserAlignment,
    pickStation,
    dispose,
  };
}
