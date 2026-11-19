/**
 * hydroWorld.js
 * ============================================================================
 * A complete, fully procedural Three.js diorama of a concrete arch-gravity
 * hydroelectric dam and everything the water touches on its way to the grid:
 *
 *   mountain reservoir  →  intake towers  →  penstocks  →  Francis turbine
 *   →  generator  →  step-up transformer  →  lattice transmission line
 *   and, in parallel, the spillway:  radial gates  →  stepped chute
 *   →  plunge pool  →  tailrace river.
 *
 * Everything you see is generated at runtime from code: no textures on disk,
 * no GLB models, no image requests. The only dependency is `three`.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   import { createHydroWorld, DAM_PHASES } from './scene/hydroWorld.js';
 *
 *   const world = createHydroWorld(scene, { quality: 'high' });
 *   const pose  = world.getDamPose(progress);          // 0..1
 *   camera.position.copy(pose.cameraPos);
 *   camera.lookAt(pose.lookAt);
 *   world.update(elapsed, delta, progress, camera);
 *
 *   world.setSpillwayOpen(0.75);   // 0 closed … 1 wide open  (default 0.75)
 *   world.setCutaway(true);        // section the turbine/generator
 *   world.dispose();               // removes the group, frees GPU resources
 *
 * `getDamPose(progress)` returns a fresh object each call:
 *
 *   {
 *     cameraPos, lookAt,        // THREE.Vector3 (safe to keep / mutate)
 *     headMeters,               // gross head, reservoir surface − tailwater
 *     flowM3s,                  // total discharge through the plant right now
 *     outputMw,                 // electrical output of the powerhouse
 *     gridKv,                   // transmission voltage leaving the switchyard
 *     phaseName, phaseId,       // which of the six stations we are in
 *     station, stationProgress, // 1-based station index and its local 0..1
 *     timeOfDay, timeLabel,     // 0 = golden hour … 1 = deep night
 *     sunElevation,             // degrees above the horizon
 *     fov,                      // suggested vertical field of view, degrees
 *   }
 *
 * ----------------------------------------------------------------------------
 * THE SIX STATIONS (camera path)
 * ----------------------------------------------------------------------------
 *   0.00 – 0.18  Crest & Mountain Reservoir
 *                Sweeping pass along the curved crest: roadway, parapet,
 *                intake towers, gantry crane, turquoise water to the horizon.
 *   0.18 – 0.38  Spillway Gates & Whitewater Cascade
 *                Downstream of the five radial gates, then down the stepped
 *                chute to the plunge pool, mist and the tailrace river.
 *   0.38 – 0.58  Penstocks & Powerhouse Approach
 *                Descending beside the three steel penstocks, whose cutaway
 *                windows show the flow pulses racing toward the turbines.
 *   0.58 – 0.78  Turbine & Generator Cutaway Hall
 *                Inside the powerhouse, framing a sectioned Francis unit:
 *                spiral case, stay and guide vanes, spinning runner, shaft,
 *                rotor poles, glowing stator windings, energy particles.
 *   0.78 – 0.92  Switchyard & High-Voltage Grid
 *                Golden hour gives way to dusk over transformer banks, ceramic
 *                bushings, glowing busbars and catenary lines leaving the gorge.
 *   0.92 – 1.00  Night Dam Panorama
 *                The whole dam lit up under the stars: floodlights, hall
 *                windows, valley lights and the distant grid.
 *
 * ----------------------------------------------------------------------------
 * INTERNALS
 * ----------------------------------------------------------------------------
 * World units are metres, Y is up, the dam axis runs along X and the reservoir
 * lies upstream in −Z. The crest is an arc of radius 300 m centred at
 * (0, 150, 300); its ends sweep downstream to z ≈ +118, so the arch bulges
 * into the reservoir the way a real arch dam does. Water level is 143 m,
 * tailwater ≈ 2 m: a 141 m head.
 *
 * The module owns `scene.fog` and `scene.background` by default (restored on
 * dispose) so the canyon reads with depth; pass `manageFog: false` /
 * `manageBackground: false` if the host app would rather drive them itself.
 *
 * Quality presets 'high' | 'medium' | 'low' trade terrain resolution, tree and
 * mist counts, shadow resolution and transmission spans. The geometry is the
 * same at every preset; only density changes.
 *
 * All shaders are self-contained GLSL ES 1.00 with manual distance fog, so they
 * compile on WebGL1 and WebGL2 and never depend on three's chunk library.
 */

import * as THREE from 'three';

export const HYDRO_WORLD_VERSION = '1.0.0';

/* ========================================================================== *
 *  Stations
 * ========================================================================== */

export const DAM_PHASES = Object.freeze([
  {
    id: 'crest',
    name: 'Crest & Mountain Reservoir',
    short: 'Crest',
    start: 0.0,
    end: 0.18,
    caption: 'An arched arch-gravity crest, 150 m above the tailrace',
  },
  {
    id: 'spillway',
    name: 'Spillway Gates & Whitewater Cascade',
    short: 'Spillway',
    start: 0.18,
    end: 0.38,
    caption: 'Five radial gates feeding a stepped chute and plunge pool',
  },
  {
    id: 'penstocks',
    name: 'Penstocks & Powerhouse Approach',
    short: 'Penstocks',
    start: 0.38,
    end: 0.58,
    caption: 'Three 8.6 m steel conduits falling to the turbine hall',
  },
  {
    id: 'turbine',
    name: 'Turbine & Generator Cutaway Hall',
    short: 'Turbine Hall',
    start: 0.58,
    end: 0.78,
    caption: 'Francis runner, 13 blades, 300 rpm, 50 Hz synchronous generator',
  },
  {
    id: 'switchyard',
    name: 'Switchyard & High-Voltage Grid',
    short: 'Switchyard',
    start: 0.78,
    end: 0.92,
    caption: '13.8 kV stepped up to 500 kV for the canyon line',
  },
  {
    id: 'night',
    name: 'Night Dam Panorama',
    short: 'Night',
    start: 0.92,
    end: 1.0,
    caption: 'Floodlit concrete, a working hall and a valley full of lights',
  },
]);

/** Fast lookup of the station that owns a progress value. */
export function phaseAtProgress(progress) {
  const p = clamp01(finite(progress, 0));
  for (let i = 0; i < DAM_PHASES.length; i += 1) {
    const phase = DAM_PHASES[i];
    if (p < phase.end || i === DAM_PHASES.length - 1) {
      return {
        phase,
        index: i,
        local: clamp01((p - phase.start) / Math.max(1e-6, phase.end - phase.start)),
      };
    }
  }
  return { phase: DAM_PHASES[DAM_PHASES.length - 1], index: DAM_PHASES.length - 1, local: 1 };
}

/* ========================================================================== *
 *  The dam, in numbers
 * ========================================================================== */

const LAYOUT = Object.freeze({
  crestY: 150,
  baseY: -22,
  reservoirY: 143,
  tailwaterY: 2.2,
  archRadius: 300,
  archCenterZ: 300,
  archHalfAngle: 0.92,
  crestThickness: 9,
  baseThickness: 54,
  crestHalfRoad: 4.5,
  spillwayAngle: 0.62,
  spillwayBays: 5,
  spillwayBayWidth: 13.5,
  spillwayPierWidth: 3,
  generatorVoltageKv: 13.8,
  gridVoltageKv: 500,
  units: 4,
  unitRatedMw: 180,
  turbineRatedFlow: 132,
  spillwayRatedFlow: 1600,
  maxHeadMeters: 141,
});

const DEFAULTS = {
  quality: 'high',
  seed: 20260911,
  spillwayOpen: 0.75,
  cutaway: true,
  shadows: true,
  manageFog: true,
  manageBackground: true,
  addLights: true,
  castShadows: true,
  /** Multiply the mist, spray and energy particle budgets. */
  particleScale: 1,
  /** Suggested camera field of view for the stations, degrees. */
  fov: 55,
  /** Where the sun sits at progress 0. */
  sunElevationStart: 9.5,
  sunAzimuthDeg: 305,
};

/* ========================================================================== *
 *  Math helpers
 * ========================================================================== */

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

function smootherstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** A trapezoidal window: rises a→b, holds, falls c→d. */
function band(x, a, b, c, d) {
  return smoothstep(a, b, x) * (1 - smoothstep(c, d, x));
}

function finite(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(random, min, max) {
  return min + (max - min) * random();
}

function hash2i(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth 2D value noise, −1..1. */
function noise2(x, y, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2i(xi, yi, seed);
  const b = hash2i(xi + 1, yi, seed);
  const c = hash2i(xi, yi + 1, seed);
  const d = hash2i(xi + 1, yi + 1, seed);
  const top = a + (b - a) * u;
  const bottom = c + (d - c) * u;
  return (top + (bottom - top) * v) * 2 - 1;
}

function fbm2(x, y, octaves = 4, seed = 0) {
  let sum = 0;
  let amp = 0.5;
  let fx = x;
  let fy = y;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += noise2(fx, fy, seed + i * 17) * amp;
    norm += amp;
    fx = fx * 2.03 + 11.7;
    fy = fy * 2.01 - 7.3;
    amp *= 0.5;
  }
  return sum / (norm || 1);
}

/** Ridged multifractal, 0..1 — mountain crests rather than rolling hills. */
function ridgeNoise(x, y, octaves = 4, seed = 0) {
  let sum = 0;
  let amp = 0.5;
  let fx = x;
  let fy = y;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    const n = 1 - Math.abs(noise2(fx, fy, seed + i * 29));
    sum += n * n * amp;
    norm += amp;
    fx = fx * 2.07 + 3.1;
    fy = fy * 2.05 + 5.7;
    amp *= 0.52;
  }
  return sum / (norm || 1);
}

/* ========================================================================== *
 *  Quality presets
 * ========================================================================== */

const QUALITY_PRESETS = {
  high: {
    terrainSegX: 320,
    terrainSegZ: 360,
    terrainDetail: 1,
    waterSegX: 130,
    waterSegZ: 110,
    trees: 2700,
    distantTrees: 900,
    rocks: 240,
    mist: 1500,
    spray: 700,
    energy: 900,
    dust: 400,
    shadowMapSize: 2048,
    shadows: true,
    towerCount: 6,
    fencePosts: 260,
    valleyLights: 900,
    rippleDetail: 1,
    glslOctaves: 4,
  },
  medium: {
    terrainSegX: 220,
    terrainSegZ: 250,
    terrainDetail: 1,
    waterSegX: 96,
    waterSegZ: 80,
    trees: 1500,
    distantTrees: 520,
    rocks: 150,
    mist: 780,
    spray: 380,
    energy: 520,
    dust: 220,
    shadowMapSize: 1024,
    shadows: true,
    towerCount: 5,
    fencePosts: 160,
    valleyLights: 520,
    rippleDetail: 1,
    glslOctaves: 4,
  },
  low: {
    terrainSegX: 140,
    terrainSegZ: 160,
    terrainDetail: 0,
    waterSegX: 68,
    waterSegZ: 56,
    trees: 700,
    distantTrees: 240,
    rocks: 70,
    mist: 340,
    spray: 160,
    energy: 260,
    dust: 100,
    shadowMapSize: 512,
    shadows: false,
    towerCount: 3,
    fencePosts: 90,
    valleyLights: 240,
    rippleDetail: 0,
    glslOctaves: 3,
  },
};

function resolveConfig(options) {
  const requested = QUALITY_PRESETS[options.quality] ? options.quality : 'high';
  const quality = { ...QUALITY_PRESETS[requested] };
  const cfg = { ...DEFAULTS, ...options, quality: requested, qualitySettings: quality };
  cfg.seed = Math.floor(finite(cfg.seed, DEFAULTS.seed)) || DEFAULTS.seed;
  cfg.spillwayOpen = clamp01(finite(cfg.spillwayOpen, DEFAULTS.spillwayOpen));
  cfg.cutaway = cfg.cutaway !== false;
  cfg.shadows = cfg.shadows !== false && quality.shadows;
  cfg.particleScale = Math.max(0, finite(cfg.particleScale, 1));
  cfg.fov = clamp(finite(cfg.fov, DEFAULTS.fov), 25, 90);
  return cfg;
}

/* ========================================================================== *
 *  Procedural textures (canvas, generated at runtime)
 * ========================================================================== */

const HAS_CANVAS =
  typeof document !== 'undefined' && typeof document.createElement === 'function';

function makeCanvas(width, height) {
  if (!HAS_CANVAS) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Build a CanvasTexture from a draw callback. Returns null in environments
 * without a DOM (Node tests), where every material then falls back to a plain
 * colour — geometry still builds and every frame still runs.
 */
function createCanvasTexture(width, height, draw, options = {}) {
  const canvas = makeCanvas(width, height);
  if (!canvas) return null;
  const context = canvas.getContext('2d');
  if (!context) return null;
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = options.wrapS || THREE.RepeatWrapping;
  texture.wrapT = options.wrapT || THREE.RepeatWrapping;
  texture.colorSpace = options.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, options.anisotropy || 4);
  if (options.repeat) texture.repeat.set(options.repeat[0], options.repeat[1]);
  if (options.offset) texture.offset.set(options.offset[0], options.offset[1]);
  texture.needsUpdate = true;
  return texture;
}

/** Seeded noise splatter used by most of the surface textures. */
function splatter(context, width, height, random, count, minR, maxR, colors, alpha = 1) {
  context.globalAlpha = alpha;
  for (let i = 0; i < count; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const r = randRange(random, minR, maxR);
    context.fillStyle = colors[(random() * colors.length) | 0];
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

/**
 * Concrete: warm grey aggregate, faint pour-lift lines every 128 px, form-board
 * seams every 256 px, damp streaking under the crest and a little algae at the
 * waterline. Tiles seamlessly enough at building scale.
 */
function makeConcreteTexture(seed) {
  const size = 512;
  const random = mulberry32(seed);
  return createCanvasTexture(size, size, (context, w, h) => {
    const base = context.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, '#c8c4b8');
    base.addColorStop(0.55, '#bab6aa');
    base.addColorStop(1, '#a9a59a');
    context.fillStyle = base;
    context.fillRect(0, 0, w, h);

    splatter(context, w, h, random, 2600, 0.4, 2.4, ['#8f8b80', '#d5d1c5', '#a09c91', '#c2bdb1'], 0.35);
    // coarse aggregate flecks
    for (let i = 0; i < 900; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const r = randRange(random, 0.8, 3.2);
      context.fillStyle = random() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(60,58,52,0.12)';
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    }
    // form-board seams (horizontal lifts)
    context.strokeStyle = 'rgba(96,93,86,0.30)';
    for (let y = 0; y < h; y += 128) {
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(0, y + 0.5);
      context.lineTo(w, y + 0.5);
      context.stroke();
      context.strokeStyle = 'rgba(255,255,255,0.12)';
      context.beginPath();
      context.moveTo(0, y + 2.5);
      context.lineTo(w, y + 2.5);
      context.stroke();
      context.strokeStyle = 'rgba(96,93,86,0.30)';
    }
    // vertical construction joints
    context.strokeStyle = 'rgba(80,77,71,0.22)';
    for (let x = 0; x < w; x += 256) {
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, h);
      context.stroke();
    }
    // water stains: soft dark vertical streaks
    for (let i = 0; i < 26; i += 1) {
      const x = random() * w;
      const wdt = randRange(random, 2, 16);
      const top = randRange(random, 0, h * 0.4);
      const grad = context.createLinearGradient(0, top, 0, top + randRange(random, 90, 260));
      grad.addColorStop(0, 'rgba(70,70,64,0.30)');
      grad.addColorStop(1, 'rgba(70,70,64,0)');
      context.fillStyle = grad;
      context.fillRect(x, top, wdt, h - top);
    }
    // algae near the bottom edge (reads as the waterline when tiled low)
    const algae = context.createLinearGradient(0, h * 0.82, 0, h);
    algae.addColorStop(0, 'rgba(72,88,58,0)');
    algae.addColorStop(1, 'rgba(64,82,52,0.34)');
    context.fillStyle = algae;
    context.fillRect(0, h * 0.82, w, h * 0.18);
  });
}

/** Wet, darker concrete for the chute, basin walls and the toe. */
function makeWetConcreteTexture(seed) {
  const size = 512;
  const random = mulberry32(seed + 991);
  return createCanvasTexture(size, size, (context, w, h) => {
    context.fillStyle = '#8f938f';
    context.fillRect(0, 0, w, h);
    splatter(context, w, h, random, 2200, 0.5, 3.4, ['#787c78', '#a2a6a1', '#6c706c', '#b6b9b4'], 0.4);
    for (let i = 0; i < 60; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const r = randRange(random, 8, 40);
      const grad = context.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(150,165,150,0.24)');
      grad.addColorStop(1, 'rgba(120,130,118,0)');
      context.fillStyle = grad;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    }
    context.strokeStyle = 'rgba(60,64,60,0.28)';
    for (let y = 0; y < h; y += 96) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(w, y);
      context.stroke();
    }
  });
}

/** Asphalt for the crest roadway. */
function makeAsphaltTexture(seed) {
  const size = 256;
  const random = mulberry32(seed + 77);
  return createCanvasTexture(size, size, (context, w, h) => {
    context.fillStyle = '#3b3d40';
    context.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const v = random();
      context.fillStyle = v > 0.5 ? 'rgba(150,150,148,0.20)' : 'rgba(20,20,22,0.30)';
      context.fillRect(x, y, randRange(random, 0.8, 2.2), randRange(random, 0.8, 2.2));
    }
  });
}

/** Brushed / weathered steel for penstocks, gates and stacks. */
function makeSteelTexture(seed) {
  const size = 256;
  const random = mulberry32(seed + 313);
  return createCanvasTexture(size, size, (context, w, h) => {
    context.fillStyle = '#7b8087';
    context.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i += 1) {
      const y = random() * h;
      context.strokeStyle = random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(30,32,36,0.08)';
      context.lineWidth = randRange(random, 0.5, 2.0);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(w, y + randRange(random, -2, 2));
      context.stroke();
    }
    // rust blooms
    for (let i = 0; i < 30; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const r = randRange(random, 3, 16);
      const grad = context.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(122,74,40,0.35)');
      grad.addColorStop(1, 'rgba(122,74,40,0)');
      context.fillStyle = grad;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    }
  });
}

/** Gravel / compacted aggregate for the switchyard pad. */
function makeGravelTexture(seed) {
  const size = 256;
  const random = mulberry32(seed + 643);
  return createCanvasTexture(size, size, (context, w, h) => {
    context.fillStyle = '#77736a';
    context.fillRect(0, 0, w, h);
    for (let i = 0; i < 4200; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const r = randRange(random, 0.7, 2.6);
      const tone = (random() * 70 + 90) | 0;
      context.fillStyle = `rgba(${tone},${tone - 4},${tone - 12},0.55)`;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    }
  });
}

/** Fine grey mottle that gives terrain shading some grain. */
function makeGroundDetailTexture(seed) {
  const size = 256;
  const random = mulberry32(seed + 4211);
  return createCanvasTexture(size, size, (context, w, h) => {
    context.fillStyle = '#9a9a94';
    context.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const v = randRange(random, 110, 200) | 0;
      context.fillStyle = `rgba(${v},${v + 2},${v - 6},0.5)`;
      context.fillRect(x, y, randRange(random, 1, 3.4), randRange(random, 1, 3.4));
    }
  }, { repeat: [64, 64], srgb: false });
}

/** Turbine-hall window wall: mullions, glass and a warm interior. */
function makeWindowWallTexture(seed) {
  const size = 512;
  const random = mulberry32(seed + 1789);
  return createCanvasTexture(size, size, (context, w, h) => {
    context.fillStyle = '#c9c4b8';
    context.fillRect(0, 0, w, h);
    const cols = 4;
    const rows = 3;
    const padX = 22;
    const padY = 26;
    const cw = (w - padX * 2) / cols;
    const ch = (h - padY * 2) / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = padX + c * cw + 6;
        const y = padY + r * ch + 6;
        const gw = cw - 12;
        const gh = ch - 12;
        const grad = context.createLinearGradient(x, y, x, y + gh);
        grad.addColorStop(0, '#243038');
        grad.addColorStop(0.45, '#4a5b60');
        grad.addColorStop(1, '#1c262c');
        context.fillStyle = grad;
        context.fillRect(x, y, gw, gh);
        // glazing bars
        context.strokeStyle = 'rgba(200,198,190,0.85)';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(x + gw / 2, y);
        context.lineTo(x + gw / 2, y + gh);
        context.moveTo(x, y + gh * 0.55);
        context.lineTo(x + gw, y + gh * 0.55);
        context.stroke();
        // interior light spill
        const spill = context.createLinearGradient(x, y + gh, x, y);
        spill.addColorStop(0, 'rgba(255,214,150,0.30)');
        spill.addColorStop(0.7, 'rgba(255,214,150,0.04)');
        spill.addColorStop(1, 'rgba(255,214,150,0)');
        context.fillStyle = spill;
        context.fillRect(x, y, gw, gh);
      }
    }
    // grime between frames
    for (let i = 0; i < 26; i += 1) {
      const x = random() * w;
      context.fillStyle = `rgba(90,84,74,${randRange(random, 0.04, 0.12).toFixed(3)})`;
      context.fillRect(x, 0, randRange(random, 2, 10), h);
    }
  }, { repeat: [3, 1] });
}

/** Yellow / black diagonal hazard stripes for gate trims and edges. */
function makeHazardTexture(seed) {
  const size = 128;
  const random = mulberry32(seed + 5003);
  return createCanvasTexture(size, size, (context, w, h) => {
    context.fillStyle = '#e8c22c';
    context.fillRect(0, 0, w, h);
    context.strokeStyle = '#232323';
    context.lineWidth = 16;
    for (let i = -h; i < w + h; i += 32) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i + h, h);
      context.stroke();
    }
    splatter(context, w, h, random, 160, 0.6, 3.2, ['#2b2b2b', '#9a9a9a', '#d8d8d8'], 0.12);
  }, { repeat: [4, 1] });
}

/** Ceramic insulator sheds: alternating pale grey rings. */
function makeCeramicTexture(seed) {
  const size = 64;
  const random = mulberry32(seed + 3301);
  return createCanvasTexture(size, size, (context, w, h) => {
    context.fillStyle = '#d6cec0';
    context.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i += 1) {
      const y = (i / 14) * h;
      context.fillStyle = i % 2 ? 'rgba(150,140,126,0.55)' : 'rgba(245,240,232,0.55)';
      context.fillRect(0, y, w, h / 28);
    }
    splatter(context, w, h, random, 90, 0.5, 2.0, ['#8d8578', '#efe9dc'], 0.2);
  }, { repeat: [1, 1] });
}

/* ========================================================================== *
 *  Environment keyframes — golden hour to night, as the ride progresses
 * ========================================================================== */

const ENV_KEYS = [
  {
    p: 0.0,
    sunElev: 9.5,
    sunColor: 0xffce9c,
    sunIntensity: 3.5,
    zenith: 0x2f6cae,
    horizon: 0xffd8b4,
    ground: 0x2a2b24,
    hemiSky: 0xbcd6ea,
    hemiGround: 0x4a4234,
    hemiIntensity: 1.35,
    ambient: 0.32,
    fog: 0xdce6e8,
    fogDensity: 0.00044,
    stars: 0.0,
    moon: 0.0,
    night: 0.0,
    cityGlow: 0x000000,
    cloudLit: 0xffe2c4,
    cloudShadow: 0x8fa3b6,
  },
  {
    p: 0.30,
    sunElev: 6.4,
    sunColor: 0xffc085,
    sunIntensity: 3.3,
    zenith: 0x2b629f,
    horizon: 0xffc79c,
    ground: 0x2a2822,
    hemiSky: 0xb3cde2,
    hemiGround: 0x4d4335,
    hemiIntensity: 1.3,
    ambient: 0.31,
    fog: 0xe3d5c6,
    fogDensity: 0.00046,
    stars: 0.0,
    moon: 0.0,
    night: 0.0,
    cityGlow: 0x120a06,
    cloudLit: 0xffd6ae,
    cloudShadow: 0x93a4b2,
  },
  {
    p: 0.52,
    sunElev: 3.2,
    sunColor: 0xffab6e,
    sunIntensity: 2.9,
    zenith: 0x2a578c,
    horizon: 0xffb086,
    ground: 0x2b2620,
    hemiSky: 0x9fbcd8,
    hemiGround: 0x4d4132,
    hemiIntensity: 1.22,
    ambient: 0.3,
    fog: 0xe2bfae,
    fogDensity: 0.0005,
    stars: 0.0,
    moon: 0.02,
    night: 0.02,
    cityGlow: 0x2a150a,
    cloudLit: 0xffc59a,
    cloudShadow: 0x8c93a6,
  },
  {
    p: 0.68,
    sunElev: 0.4,
    sunColor: 0xff8f5c,
    sunIntensity: 1.9,
    zenith: 0x27406f,
    horizon: 0xf79a72,
    ground: 0x231f1c,
    hemiSky: 0x88a2c4,
    hemiGround: 0x453a2f,
    hemiIntensity: 1.05,
    ambient: 0.32,
    fog: 0xc99a8c,
    fogDensity: 0.00056,
    stars: 0.06,
    moon: 0.1,
    night: 0.14,
    cityGlow: 0x4a2410,
    cloudLit: 0xf0a37a,
    cloudShadow: 0x6f7690,
  },
  {
    p: 0.80,
    sunElev: -3.4,
    sunColor: 0xc07a86,
    sunIntensity: 0.55,
    zenith: 0x1b2b4d,
    horizon: 0xb8707a,
    ground: 0x1a1717,
    hemiSky: 0x5b7296,
    hemiGround: 0x36302c,
    hemiIntensity: 0.85,
    ambient: 0.36,
    fog: 0x8e7178,
    fogDensity: 0.00062,
    stars: 0.35,
    moon: 0.35,
    night: 0.52,
    cityGlow: 0x6b3312,
    cloudLit: 0xa98591,
    cloudShadow: 0x4b5268,
  },
  {
    p: 0.92,
    sunElev: -7.2,
    sunColor: 0x5a6a9a,
    sunIntensity: 0.0,
    zenith: 0x0b1528,
    horizon: 0x26354f,
    ground: 0x0c0f13,
    hemiSky: 0x354a72,
    hemiGround: 0x1f2226,
    hemiIntensity: 0.62,
    ambient: 0.46,
    fog: 0x2b3746,
    fogDensity: 0.0007,
    stars: 1.0,
    moon: 0.95,
    night: 1.0,
    cityGlow: 0x8a4a1c,
    cloudLit: 0x4b5c78,
    cloudShadow: 0x242c3c,
  },
  {
    p: 1.0,
    sunElev: -9.5,
    sunColor: 0x45538a,
    sunIntensity: 0.0,
    zenith: 0x070f20,
    horizon: 0x1b2740,
    ground: 0x090b0f,
    hemiSky: 0x2b3d61,
    hemiGround: 0x1a1d21,
    hemiIntensity: 0.58,
    ambient: 0.48,
    fog: 0x22303f,
    fogDensity: 0.00072,
    stars: 1.0,
    moon: 1.0,
    night: 1.0,
    cityGlow: 0x9a5622,
    cloudLit: 0x41506a,
    cloudShadow: 0x1d2432,
  },
];

const MOON_ELEVATION = 27;
const MOON_AZIMUTH = 128;

function sunDirection(elevDeg, azimDeg, target = new THREE.Vector3()) {
  const elev = (elevDeg * Math.PI) / 180;
  const azim = (azimDeg * Math.PI) / 180;
  return target.set(Math.cos(elev) * Math.sin(azim), Math.sin(elev), Math.cos(elev) * Math.cos(azim));
}

function resampleEnvironmentKey(progress) {
  const p = clamp01(progress);
  let i = 0;
  while (i < ENV_KEYS.length - 2 && p > ENV_KEYS[i + 1].p) i += 1;
  const a = ENV_KEYS[i];
  const b = ENV_KEYS[i + 1];
  const t = smootherstep(0, 1, clamp01((p - a.p) / Math.max(1e-6, b.p - a.p)));
  return { a, b, t };
}

function colorMix(a, b, t, target = new THREE.Color()) {
  return target.set(a).lerp(_colorScratch.set(b), t);
}
const _colorScratch = new THREE.Color();

/** All environment values for one progress point, into a reusable record. */
function sampleEnvironment(progress, target) {
  const out = target || {};
  const { a, b, t } = resampleEnvironmentKey(progress);
  out.sunElev = lerp(a.sunElev, b.sunElev, t);
  out.azimuth = DEFAULTS.sunAzimuthDeg;
  out.sunColor = colorMix(a.sunColor, b.sunColor, t, out.sunColor || new THREE.Color());
  out.sunIntensity = lerp(a.sunIntensity, b.sunIntensity, t);
  out.zenith = colorMix(a.zenith, b.zenith, t, out.zenith || new THREE.Color());
  out.horizon = colorMix(a.horizon, b.horizon, t, out.horizon || new THREE.Color());
  out.ground = colorMix(a.ground, b.ground, t, out.ground || new THREE.Color());
  out.hemiSky = colorMix(a.hemiSky, b.hemiSky, t, out.hemiSky || new THREE.Color());
  out.hemiGround = colorMix(a.hemiGround, b.hemiGround, t, out.hemiGround || new THREE.Color());
  out.hemiIntensity = lerp(a.hemiIntensity, b.hemiIntensity, t);
  out.ambient = lerp(a.ambient, b.ambient, t);
  out.fogColor = colorMix(a.fog, b.fog, t, out.fogColor || new THREE.Color());
  out.fogDensity = lerp(a.fogDensity, b.fogDensity, t);
  out.stars = lerp(a.stars, b.stars, t);
  out.moon = lerp(a.moon, b.moon, t);
  out.night = lerp(a.night, b.night, t);
  out.cityGlow = colorMix(a.cityGlow, b.cityGlow, t, out.cityGlow || new THREE.Color());
  out.cloudLit = colorMix(a.cloudLit, b.cloudLit, t, out.cloudLit || new THREE.Color());
  out.cloudShadow = colorMix(a.cloudShadow, b.cloudShadow, t, out.cloudShadow || new THREE.Color());
  out.exposure = lerp(1.02, 1.22, out.night);
  return out;
}

/* ========================================================================== *
 *  Shared GLSL — hash / value noise / fbm / distance fog
 * ========================================================================== */

const GLSL_NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float valueNoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);
  return mix(mix(nx00, nx10, u.y), mix(nx01, nx11, u.y), u.z);
}

float fbm2d(vec2 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    sum += valueNoise2(p) * amp;
    norm += amp;
    p = p * 2.03 + vec2(11.7, -7.3);
    amp *= 0.5;
  }
  return sum / max(norm, 1e-4);
}

float fbm3d(vec3 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    sum += valueNoise3(p) * amp;
    norm += amp;
    p = p * 2.01 + vec3(5.2, 1.3, 9.1);
    amp *= 0.5;
  }
  return sum / max(norm, 1e-4);
}
`;

const GLSL_FOG = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCameraPos;

vec3 applyFog(vec3 color, vec3 worldPos) {
  float dist = length(worldPos - uCameraPos);
  float f = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
  f = clamp(f, 0.0, 1.0);
  return mix(color, uFogColor, f);
}
`;

/* ========================================================================== *
 *  Sky dome
 * ========================================================================== */

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w;
}
`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uMoonDir;
uniform vec3 uCityGlow;
uniform vec3 uCloudLit;
uniform vec3 uCloudShadow;
uniform float uSunPower;
uniform float uStars;
uniform float uMoon;
uniform float uNight;
uniform float uTime;
uniform float uCloudCover;

varying vec3 vDir;

${GLSL_NOISE}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;

  float up = pow(clamp(h, 0.0, 1.0), 0.22);
  vec3 col = mix(uHorizon, uZenith, up);

  vec3 low = mix(uHorizon * 0.55, uGround, smoothstep(0.0, -0.22, h));
  col = mix(col, low, smoothstep(0.015, -0.01, h));

  // horizon haze and the warm band around the sun's azimuth
  float band = exp(-abs(h) * 12.0);
  col += uHorizon * band * 0.22;

  float sd = max(dot(d, uSunDir), 0.0);
  col += uSunColor * pow(sd, 2200.0) * 2.4 * uSunPower;
  col += uSunColor * pow(sd, 90.0) * 0.30 * uSunPower;
  col += uSunColor * pow(sd, 8.0) * 0.10 * uSunPower;

  vec2 dz = normalize(d.xz + vec2(1e-5));
  vec2 sz = normalize(uSunDir.xz + vec2(1e-5));
  float az = pow(max(dot(dz, sz), 0.0), 3.0);
  col += uSunColor * az * exp(-pow((h - 0.015) / 0.16, 2.0)) * 0.24 * uSunPower;

  // high cirrus streaks
  if (uCloudCover > 0.001 && h > 0.02) {
    vec2 cuv = d.xz / max(h + 0.10, 0.12);
    vec2 drift = vec2(uTime * 0.0045, uTime * 0.0022);
    float n = fbm2d(cuv * 0.55 + drift, 4);
    float n2 = fbm2d(cuv * 1.9 - drift * 1.7, 3);
    float cover = smoothstep(0.52, 0.78, n * 0.72 + n2 * 0.28) * uCloudCover;
    cover *= smoothstep(0.02, 0.16, h) * (1.0 - smoothstep(0.72, 0.98, h));
    float lit = clamp(0.45 + 0.55 * pow(max(dot(d, uSunDir), 0.0), 2.0), 0.0, 1.4);
    vec3 cloud = mix(uCloudShadow, uCloudLit, lit);
    col = mix(col, cloud, cover * 0.55);
  }

  // stars with a slow twinkle and a faint galactic band
  if (uStars > 0.002) {
    vec3 sp = d * 320.0;
    vec3 cell = floor(sp);
    float seed = hash13(cell);
    vec3 f = fract(sp) - 0.5;
    float dd = length(f);
    float star = smoothstep(0.9975, 1.0, seed) * smoothstep(0.34, 0.0, dd);
    float tw = 0.7 + 0.3 * sin(uTime * (0.6 + seed * 6.0) + seed * 61.0);
    col += vec3(0.80, 0.86, 1.0) * star * tw * uStars * 2.4 * smoothstep(-0.02, 0.14, h);

    float gal = exp(-pow(dot(d, normalize(vec3(0.42, 0.34, -0.84))), 2.0) * 22.0);
    col += vec3(0.09, 0.11, 0.20) * gal * uStars * 0.5 * (0.5 + 0.5 * fbm3d(d * 6.0, 3));
  }

  // moon: disc, halo, faint maria
  float md = dot(d, normalize(uMoonDir));
  float disc = smoothstep(0.99955, 0.9998, md);
  float halo = pow(max(md, 0.0), 420.0) * 0.45 + pow(max(md, 0.0), 26.0) * 0.05;
  float maria = 0.86 + 0.14 * fbm3d(d * 210.0, 3);
  col += (vec3(0.95, 0.97, 1.0) * disc * maria * 1.5 + vec3(0.42, 0.52, 0.82) * halo) * uMoon;

  col += uCityGlow * exp(-abs(h) * 26.0) * 0.55 * uNight;

  col += (hash12(gl_FragCoord.xy) - 0.5) * 0.004;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function buildSky(shared) {
  const uniforms = {
    uZenith: { value: new THREE.Color(0x2f6cae) },
    uHorizon: { value: new THREE.Color(0xffd8b4) },
    uGround: { value: new THREE.Color(0x2a2b24) },
    uSunDir: { value: new THREE.Vector3(0, 0.2, 1) },
    uSunColor: { value: new THREE.Color(0xffce9c) },
    uMoonDir: { value: new THREE.Vector3(0, 0.4, -1) },
    uCityGlow: { value: new THREE.Color(0x000000) },
    uCloudLit: { value: new THREE.Color(0xffe2c4) },
    uCloudShadow: { value: new THREE.Color(0x8fa3b6) },
    uSunPower: { value: 1 },
    uStars: { value: 0 },
    uMoon: { value: 0 },
    uNight: { value: 0 },
    uCloudCover: { value: 0.55 },
    uTime: shared.time,
  };

  const geometry = new THREE.SphereGeometry(5600, 48, 30);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    fog: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'HydroSky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  return { mesh, uniforms, material };
}

/* ========================================================================== *
 *  Glow points — lamps, windows, valley lights, corona, embers
 * ========================================================================== */

const GLOW_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aPhase;
attribute float aSoft;
uniform float uPixelRatio;
uniform float uTime;
uniform float uSizeScale;
uniform float uTwinkle;
uniform float uViewportHeight;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.001);
  // aSize is a real-world radius in metres: project it like geometry
  float pixelsPerMetre = projectionMatrix[1][1] * uViewportHeight * 0.5;
  float atten = clamp(1.0 - dist / 2600.0, 0.0, 1.0);
  gl_PointSize = clamp(aSize * uSizeScale * uPixelRatio * pixelsPerMetre / dist, 1.0, 220.0) * (0.45 + 0.55 * atten);
  gl_Position = projectionMatrix * mv;

  float tw = 1.0 - uTwinkle + uTwinkle * (0.65 + 0.35 * sin(uTime * (1.4 + aPhase * 5.0) + aPhase * 47.0));
  vColor = aColor;
  vAlpha = clamp(0.35 + 0.65 * atten, 0.0, 1.0) * tw;
}
`;

const GLOW_FRAG = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q) * 2.0;
  if (r > 1.0) discard;
  float core = pow(clamp(1.0 - r, 0.0, 1.0), 2.6);
  float halo = pow(clamp(1.0 - r, 0.0, 1.0), 0.8) * 0.35;
  float a = (core * 1.25 + halo) * vAlpha * uOpacity;
  gl_FragColor = vec4(vColor * (1.0 + core * 0.6), a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * Build an additive point cloud. Each entry is
 *   { position: [x,y,z], color: [r,g,b] | THREE.Color, size, phase, twinkle }
 */
function buildGlowPoints(shared, entries, options = {}) {
  if (!entries || !entries.length) return null;
  const count = entries.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const entry = entries[i];
    positions[i * 3] = entry.position[0];
    positions[i * 3 + 1] = entry.position[1];
    positions[i * 3 + 2] = entry.position[2];
    if (entry.color instanceof THREE.Color) color.copy(entry.color);
    else if (Array.isArray(entry.color)) color.setRGB(entry.color[0], entry.color[1], entry.color[2]);
    else color.set(entry.color == null ? 0xffffff : entry.color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    sizes[i] = entry.size == null ? 1 : entry.size;
    phases[i] = entry.phase == null ? Math.random() : entry.phase;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: shared.pixelRatio,
      uTime: shared.time,
      uSizeScale: { value: options.sizeScale == null ? 0.32 : options.sizeScale },
      uTwinkle: { value: options.twinkle == null ? 0 : options.twinkle },
      uOpacity: { value: options.opacity == null ? 1 : options.opacity },
      uViewportHeight: shared.viewportHeight,
    },
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
  });

  const points = new THREE.Points(geometry, material);
  points.name = options.name || 'HydroGlow';
  points.frustumCulled = false;
  points.renderOrder = options.renderOrder == null ? 10 : options.renderOrder;
  points.userData.uniforms = material.uniforms;
  return points;
}

/* ========================================================================== *
 *  Small procedural environment map so metals have something to reflect
 * ========================================================================== */

function createEnvironmentTexture(seed) {
  const width = 96;
  const height = 48;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    const elevation = Math.cos(v * Math.PI); // 1 at top, -1 at bottom
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const i = (y * width + x) * 4;
      const sun = Math.pow(Math.max(0, Math.cos((u - 0.72) * Math.PI * 2)), 32) * Math.max(0, 1 - Math.abs(elevation - 0.18) * 3.2);
      const sky = Math.max(0, elevation);
      const ground = Math.max(0, -elevation);
      const noise = noise2(x * 0.22, y * 0.22, seed) * 10;
      data[i] = clamp(28 + sky * 92 + sun * 150 + noise, 0, 255);
      data[i + 1] = clamp(38 + sky * 112 + sun * 130 + noise, 0, 255);
      data[i + 2] = clamp(46 + sky * 140 + sun * 90 + noise, 0, 255);
      data[i + 3] = 255 * (1 - ground * 0.35) > 0 ? 255 : 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/* ========================================================================== *
 *  Materials
 * ========================================================================== */

function createMaterials(ctx) {
  const { seed, envMap } = ctx;
  const textures = [];
  const materials = [];

  const trackTexture = (texture) => {
    if (texture) textures.push(texture);
    return texture;
  };

  const concreteMap = trackTexture(makeConcreteTexture(seed + 11));
  const wetMap = trackTexture(makeWetConcreteTexture(seed + 23));
  const asphaltMap = trackTexture(makeAsphaltTexture(seed + 31));
  const steelMap = trackTexture(makeSteelTexture(seed + 41));
  const gravelMap = trackTexture(makeGravelTexture(seed + 53));
  const groundMap = trackTexture(makeGroundDetailTexture(seed + 61));
  const windowMap = trackTexture(makeWindowWallTexture(seed + 71));
  const hazardMap = trackTexture(makeHazardTexture(seed + 83));
  const ceramicMap = trackTexture(makeCeramicTexture(seed + 97));

  function standard(name, params) {
    const map = params.map || null;
    // UVs are in metres for most buildings; repeat keeps the aggregate at a
    // believable scale no matter the surface size.
    if (map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
    }
    const material = new THREE.MeshStandardMaterial(
      Object.assign(
        {
          name,
          metalness: 0.06,
          roughness: 0.86,
        },
        params
      )
    );
    material.envMap = envMap;
    material.envMapIntensity = params.envMapIntensity == null ? 0.45 : params.envMapIntensity;
    if (params.vertexColors) material.vertexColors = true;
    materials.push(material);
    return material;
  }

  function physical(name, params) {
    const material = new THREE.MeshPhysicalMaterial(
      Object.assign({ name, metalness: 0.2, roughness: 0.5 }, params)
    );
    material.envMap = envMap;
    material.envMapIntensity = params.envMapIntensity == null ? 0.6 : params.envMapIntensity;
    materials.push(material);
    return material;
  }

  const mats = {
    concrete: standard('HydroConcrete', {
      map: concreteMap,
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.02,
      envMapIntensity: 0.3,
    }),
    concreteTrim: standard('HydroConcreteTrim', {
      map: concreteMap,
      color: 0xfaf6ec,
      roughness: 0.82,
      metalness: 0.02,
      envMapIntensity: 0.3,
    }),
    concreteDark: standard('HydroConcreteDark', {
      map: concreteMap,
      color: 0xcfc9bd,
      roughness: 0.94,
      metalness: 0.02,
      envMapIntensity: 0.25,
    }),
    wetConcrete: standard('HydroWetConcrete', {
      map: wetMap,
      color: 0xa8b0ac,
      roughness: 0.55,
      metalness: 0.05,
      envMapIntensity: 0.55,
    }),
    asphalt: standard('HydroAsphalt', {
      map: asphaltMap,
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.0,
    }),
    steel: standard('HydroSteel', {
      map: steelMap,
      color: 0xe8eef5,
      metalness: 0.62,
      roughness: 0.38,
      envMapIntensity: 1.0,
    }),
    steelDark: standard('HydroSteelDark', {
      map: steelMap,
      color: 0xb7bec7,
      metalness: 0.55,
      roughness: 0.46,
      envMapIntensity: 0.8,
    }),
    steelBlue: standard('HydroSteelBlue', {
      map: steelMap,
      color: 0xb9c9d4,
      metalness: 0.5,
      roughness: 0.44,
      envMapIntensity: 0.8,
    }),
    steelPaint: standard('HydroSteelPaint', {
      color: 0xe8bc4a,
      metalness: 0.25,
      roughness: 0.55,
    }),
    rust: standard('HydroRust', {
      map: steelMap,
      color: 0xc08a63,
      metalness: 0.4,
      roughness: 0.85,
    }),
    bronze: standard('HydroBronze', {
      color: 0xe0b87e,
      metalness: 0.55,
      roughness: 0.3,
      envMapIntensity: 1.2,
    }),
    copper: standard('HydroCopper', {
      color: 0xd08753,
      metalness: 0.7,
      roughness: 0.34,
      envMapIntensity: 1.1,
      emissive: 0x2a0d02,
      emissiveIntensity: 0.4,
    }),
    copperHot: standard('HydroCopperHot', {
      color: 0xc07543,
      metalness: 0.85,
      roughness: 0.32,
      emissive: 0xff7a2a,
      emissiveIntensity: 0.35,
      envMapIntensity: 1.0,
    }),
    blade: standard('HydroBlade', {
      color: 0xdab875,
      metalness: 0.65,
      roughness: 0.32,
      side: THREE.DoubleSide,
      envMapIntensity: 1.15,
    }),
    innerSteel: standard('HydroInnerSteel', {
      color: 0xc3ccd4,
      metalness: 0.45,
      roughness: 0.38,
      side: THREE.DoubleSide,
    }),
    ceramic: standard('HydroCeramic', {
      map: ceramicMap,
      color: 0xe6ddcd,
      metalness: 0.02,
      roughness: 0.42,
      envMapIntensity: 0.7,
    }),
    busbar: standard('HydroBusbar', {
      color: 0xb98352,
      metalness: 1.0,
      roughness: 0.26,
      envMapIntensity: 1.2,
      emissive: 0x2a1204,
      emissiveIntensity: 0.25,
    }),
    gravel: standard('HydroGravel', {
      map: gravelMap,
      color: 0xdad6cb,
      roughness: 0.98,
      metalness: 0.0,
    }),
    rock: standard('HydroRock', {
      map: groundMap,
      color: 0xd4cfc4,
      roughness: 0.98,
      metalness: 0.0,
    }),
    glass: physical('HydroGlass', {
      color: 0x8fb6c4,
      metalness: 0.1,
      roughness: 0.08,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      envMapIntensity: 1.4,
      depthWrite: false,
    }),
    windowWall: standard('HydroWindowWall', {
      map: windowMap,
      emissiveMap: windowMap,
      emissive: 0xffc98a,
      emissiveIntensity: 0.0,
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.05,
      envMapIntensity: 0.35,
    }),
    hazard: standard('HydroHazard', {
      map: hazardMap,
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.2,
    }),
    paintWhite: standard('HydroPaintWhite', {
      color: 0xe7e3d8,
      roughness: 0.7,
      metalness: 0.05,
    }),
    paintYellow: standard('HydroPaintYellow', {
      color: 0xe3b93a,
      roughness: 0.65,
      metalness: 0.08,
    }),
    paintRed: standard('HydroPaintRed', {
      color: 0xb9533c,
      roughness: 0.6,
      metalness: 0.08,
    }),
    lampGlass: standard('HydroLampGlass', {
      color: 0xfff0cf,
      emissive: 0xffd9a0,
      emissiveIntensity: 1.6,
      roughness: 0.25,
      metalness: 0.0,
      toneMapped: true,
    }),
    hallFloor: standard('HydroHallFloor', {
      color: 0x9d9f94,
      roughness: 0.55,
      metalness: 0.08,
      envMapIntensity: 0.6,
    }),
    hallWall: standard('HydroHallWall', {
      color: 0xd6d1c3,
      roughness: 0.88,
      metalness: 0.02,
    }),
    tree: standard('HydroTree', {
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.0,
      flatShading: true,
      envMapIntensity: 0.2,
    }),
    terrain: standard('HydroTerrain', {
      map: null,
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.97,
      metalness: 0.0,
      envMapIntensity: 0.25,
    }),
    stretched: standard('HydroStretched', {
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
    }),
  };


  // Buildings use metric UVs (1 unit = 1 m); set each map's repeat per material.
  const repeat = (material, u, v) => {
    if (!material.map) return;
    const map = material.map;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(u, v);
  };
  repeat(mats.concrete, 0.09, 0.09);
  repeat(mats.concreteTrim, 0.09, 0.09);
  repeat(mats.concreteDark, 0.09, 0.09);
  repeat(mats.wetConcrete, 0.08, 0.08);
  repeat(mats.asphalt, 0.12, 0.12);
  repeat(mats.steel, 0.16, 0.16);
  repeat(mats.steelDark, 0.16, 0.16);
  repeat(mats.steelBlue, 0.16, 0.16);
  repeat(mats.gravel, 0.05, 0.05);
  repeat(mats.hazard, 0.5, 0.5);
  repeat(mats.windowWall, 0.045, 0.035);
  repeat(mats.ceramic, 1, 1);

  return { mats, textures, materials, envMap };
}

/* ========================================================================== *
 *  Geometry helpers
 * ========================================================================== */

/** Merge a list of geometries (optionally transformed) into one buffer. */
function mergeGeometries(items) {
  const prepared = [];
  for (const item of items) {
    const source = item.geometry || item;
    let geometry = source.index ? source.toNonIndexed() : source;
    if (item.matrix) geometry = geometry.clone().applyMatrix4(item.matrix);
    prepared.push(geometry);
  }
  let count = 0;
  for (const geometry of prepared) count += geometry.getAttribute('position').count;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  let offset = 0;
  for (const geometry of prepared) {
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < position.count; i += 1) {
      const k = (offset + i) * 3;
      positions[k] = position.getX(i);
      positions[k + 1] = position.getY(i);
      positions[k + 2] = position.getZ(i);
      if (normal) {
        normals[k] = normal.getX(i);
        normals[k + 1] = normal.getY(i);
        normals[k + 2] = normal.getZ(i);
      } else {
        normals[k + 1] = 1;
      }
      const j = (offset + i) * 2;
      if (uv) {
        uvs[j] = uv.getX(i);
        uvs[j + 1] = uv.getY(i);
      }
    }
    offset += position.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.computeBoundingSphere();
  merged.computeBoundingBox();
  return merged;
}

/**
 * Collector that lets a builder describe a lattice (or a stair, or a fence)
 * as a pile of boxes and get one merged geometry back.
 */
class BoxBuilder {
  constructor() {
    this.items = [];
  }

  add(width, height, depth, position, rotation = null) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    if (rotation) {
      if (rotation.isQuaternion) quaternion.copy(rotation);
      else if (rotation.isEuler) quaternion.setFromEuler(rotation);
      else if (Array.isArray(rotation)) quaternion.setFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
      else quaternion.setFromEuler(new THREE.Euler(0, rotation, 0));
    }
    matrix.compose(
      new THREE.Vector3(position[0], position[1], position[2]),
      quaternion,
      new THREE.Vector3(1, 1, 1)
    );
    this.items.push({ geometry, matrix });
    return this;
  }

  /** A box stretched between two points — used for lattice diagonals. */
  memberBetween(a, b, thickness) {
    const start = new THREE.Vector3(a[0], a[1], a[2]);
    const end = new THREE.Vector3(b[0], b[1], b[2]);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    if (length < 1e-4) return this;
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    const geometry = new THREE.BoxGeometry(thickness, length, thickness);
    const matrix = new THREE.Matrix4().compose(mid, quaternion, new THREE.Vector3(1, 1, 1));
    this.items.push({ geometry, matrix });
    return this;
  }

  cylinder(radiusTop, radiusBottom, height, position, rotation = null, segments = 8) {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, false);
    const quaternion = new THREE.Quaternion();
    if (rotation) {
      if (rotation.isQuaternion) quaternion.copy(rotation);
      else if (rotation.isEuler) quaternion.setFromEuler(rotation);
      else if (Array.isArray(rotation)) quaternion.setFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
      else quaternion.setFromEuler(new THREE.Euler(0, rotation, 0));
    }
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(position[0], position[1], position[2]),
      quaternion,
      new THREE.Vector3(1, 1, 1)
    );
    this.items.push({ geometry, matrix });
    return this;
  }

  build() {
    const geometry = mergeGeometries(this.items);
    for (const item of this.items) item.geometry.dispose();
    this.items.length = 0;
    return geometry;
  }
}

/**
 * A plate curved about a horizontal axis: used for Tainter gates, the scroll
 * case, cut-away housings and duct bends. The arc lies in the local YZ plane,
 * extruded along X.
 */
function makeCurvedPlate(width, radius, angleStart, angleEnd, options = {}) {
  const segmentsU = options.segmentsU || 14;
  const segmentsV = options.segmentsV || 12;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  for (let vi = 0; vi <= segmentsV; vi += 1) {
    const a = lerp(angleStart, angleEnd, vi / segmentsV);
    const y = radius * Math.sin(a);
    const z = -radius * Math.cos(a);
    const ny = Math.sin(a);
    const nz = -Math.cos(a);
    for (let ui = 0; ui <= segmentsU; ui += 1) {
      const x = (ui / segmentsU - 0.5) * width;
      positions.push(x, y, z);
      normals.push(0, ny, nz);
      uvs.push(ui / segmentsU, vi / segmentsV);
    }
  }
  for (let vi = 0; vi < segmentsV; vi += 1) {
    for (let ui = 0; ui < segmentsU; ui += 1) {
      const a = vi * (segmentsU + 1) + ui;
      const b = a + 1;
      const c = a + segmentsU + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/** Multiply a geometry's UVs so a tiling texture keeps its scale per metre. */
function scaleUVs(geometry, su, sv) {
  const uv = geometry.getAttribute('uv');
  if (!uv) return geometry;
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return geometry;
}

/** Sub-curve of a Curve: samples t0..t1 and returns a new CatmullRomCurve3. */
function subCurve(curve, t0, t1, samples = 24) {
  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    points.push(curve.getPoint(lerp(t0, t1, i / samples)));
  }
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

/** A tube between two arbitrary points (steel braces, cables, pipes). */
function tubeBetween(a, b, radius, radialSegments = 6) {
  const start = new THREE.Vector3(a[0], a[1], a[2]);
  const end = new THREE.Vector3(b[0], b[1], b[2]);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, false);
  geometry.translate(0, length * 0.5, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  geometry.applyQuaternion(quaternion);
  geometry.translate(start.x, start.y, start.z);
  void mid;
  return geometry;
}

/* ========================================================================== *
 *  Terrain: the gorge, the reservoir basin, the excavated benches
 * ========================================================================== */

/** Plan position of the dam crest centreline for a given x. */
function crestZAtX(x) {
  const ratio = clamp(x / LAYOUT.archRadius, -0.999, 0.999);
  return LAYOUT.archCenterZ - LAYOUT.archRadius * Math.sqrt(1 - ratio * ratio);
}

/** Angle along the arch for an x position. */
function crestAngleAtX(x) {
  return Math.asin(clamp(x / LAYOUT.archRadius, -1, 1));
}

/** Downstream unit normal of the arch at an angle. */
function crestNormal(theta, target = new THREE.Vector2()) {
  return target.set(-Math.sin(theta), Math.cos(theta));
}

/** Where the spillway crest structure sits, and the frame it is built in. */
const SPILLWAY = (() => {
  const theta = LAYOUT.spillwayAngle;
  const x = LAYOUT.archRadius * Math.sin(theta);
  const z = LAYOUT.archCenterZ - LAYOUT.archRadius * Math.cos(theta);
  const tangent = new THREE.Vector2(Math.cos(theta), Math.sin(theta));
  const normal = new THREE.Vector2(-Math.sin(theta), Math.cos(theta));
  return {
    theta,
    x,
    z,
    tangent,
    normal,
    rotationY: -theta,
    crestLength: 0,
  };
})();

/** Local (u along the crest tangent, v downstream) coordinates of the spillway. */
function spillwayLocal(x, z) {
  const dx = x - SPILLWAY.x;
  const dz = z - SPILLWAY.z;
  return {
    u: dx * SPILLWAY.tangent.x + dz * SPILLWAY.tangent.y,
    v: dx * SPILLWAY.normal.x + dz * SPILLWAY.normal.y,
  };
}

function spillwayWorld(u, v) {
  return {
    x: SPILLWAY.x + u * SPILLWAY.tangent.x + v * SPILLWAY.normal.x,
    z: SPILLWAY.z + u * SPILLWAY.tangent.y + v * SPILLWAY.normal.y,
  };
}

const SPILLWAY_CREST_V = 6.0;
const SPILLWAY_BASIN_V = 156.0;
const SPILLWAY_SILL_Y = 144.0;
const SPILLWAY_BASIN_Y = 2.4;
const CHUTE_TREAD = 2.6;
const CHUTE_OGEE_END = 38;

/** Concrete surface height of the spillway chute at downstream distance v. */
function chuteTopY(v) {
  if (v <= SPILLWAY_CREST_V) return SPILLWAY_SILL_Y;
  if (v <= 38) {
    return SPILLWAY_SILL_Y - (SPILLWAY_SILL_Y - 88.0) * smootherstep(0, 1, (v - SPILLWAY_CREST_V) / (38 - SPILLWAY_CREST_V));
  }
  const t = clamp01((v - 38) / (SPILLWAY_BASIN_V - 38));
  return lerp(88.0, SPILLWAY_BASIN_Y, t);
}

function chuteWidth(v) {
  const t = clamp01(v / SPILLWAY_BASIN_V);
  return lerp(68, 42, smoothstep(0.08, 1.0, t));
}

/* Landscape shape ---------------------------------------------------------- */

function canyonCenterX(z) {
  const base = 14 * Math.sin(z * 0.0021) + 7 * Math.sin(z * 0.0047 + 1.7);
  return base;
}

function bedHalfWidth(z) {
  if (z < 0) return lerp(52, 145, smoothstep(0, -900, z));
  const pool = band(z, 110, 190, 280, 430);
  const wide = lerp(58, 168, pool);
  return wide + 22 * smoothstep(430, 1000, z);
}

function valleyFloorY(z) {
  if (z < 0) return lerp(-2, -34, smoothstep(0, -900, z));
  return lerp(-1, -34, smoothstep(80, 1000, z));
}

function wallTopY(z) {
  const upstream = smoothstep(0, -1000, z);
  return lerp(212, 268, upstream) + 14 * Math.sin(z * 0.0016);
}

/** Soft rounded-rectangle mask, 1 inside, fading over `feather` metres. */
function padMask(x, z, minX, maxX, minZ, maxZ, feather) {
  const mx = smoothstep(minX - feather, minX + feather * 0.15, x) * (1 - smoothstep(maxX - feather * 0.15, maxX + feather, x));
  const mz = smoothstep(minZ - feather, minZ + feather * 0.15, z) * (1 - smoothstep(maxZ - feather * 0.15, maxZ + feather, z));
  return mx * mz;
}

function reservoirMask(z) {
  return smoothstep(10, -140, z);
}

/** Raw landscape height in metres, before any structures. */
function terrainHeightRaw(x, z, seed) {
  const center = canyonCenterX(z);
  const ad = Math.abs(x - center);
  const bed = bedHalfWidth(z);
  const wallWidth = lerp(250, 330, smoothstep(0, -900, z));
  const rise = smoothstep(bed, bed + wallWidth, ad);
  const floor = valleyFloorY(z);
  const top = wallTopY(z);

  let h = floor + (top - floor) * Math.pow(rise, 1.22);

  // roughness grows with distance from the water
  const relief = 0.18 + 0.9 * rise;
  const big = fbm2(x * 0.0022, z * 0.0024, 4, seed) * 46;
  const ridge = (ridgeNoise(x * 0.0031, z * 0.0033, 4, seed + 19) - 0.42) * 62;
  const mid = fbm2(x * 0.012, z * 0.013, 3, seed + 43) * 8.5;
  const crag = (ridgeNoise(x * 0.0085, z * 0.009, 3, seed + 89) - 0.45) * 16;
  const fine = fbm2(x * 0.05, z * 0.052, 2, seed + 71) * 1.6;
  h += (big + ridge * rise + mid + crag * rise) * relief + fine;

  // river bed incision
  const incision = 1 - smoothstep(bed * 0.55, bed * 1.05, ad);
  h -= incision * 4.5;

  // terraces / benches on the lower slopes, like carved glacial shelves
  const terraceBand = Math.sin(h * 0.11 + 0.8) * 0.5 + 0.5;
  h += terraceBand * 1.8 * smoothstep(1.0, 3.0, rise) * (1 - rise * 0.4);

  // keep the reservoir basin below the water line and the tailwater bed low
  return h;
}

/** Height used by the built world: raw landscape plus excavations and pads. */
function terrainHeight(x, z, seed) {
  let h = terrainHeightRaw(x, z, seed);

  // --- spillway excavated channel -----------------------------------------
  const local = spillwayLocal(x, z);
  const halfWidth = chuteWidth(Math.max(0, local.v)) * 0.5 + 14;
  const corridor = (1 - smoothstep(halfWidth - 24, halfWidth + 12, Math.abs(local.u))) *
    smoothstep(-16, 4, local.v) * (1 - smoothstep(SPILLWAY_BASIN_V + 26, SPILLWAY_BASIN_V + 70, local.v));
  if (corridor > 0.001) {
    // the ground sits just below the chute slab: the concrete mass fills the
    // rest, so the spillway reads as a structure built into the flank
    const bedY = local.v < SPILLWAY_BASIN_V + 8
      ? chuteTopY(Math.max(0, local.v)) - 1.6
      : 0.4;
    h = lerp(h, bedY, corridor * 0.94);
  }

  // --- powerhouse bench ----------------------------------------------------
  const plantPad = padMask(x, z, -232, 6, 86, 206, 26);
  if (plantPad > 0.001) h = lerp(h, -0.5, plantPad);

  // the tailrace apron in front of the powerhouse
  const apron = padMask(x, z, -228, 34, 192, 250, 22);
  if (apron > 0.001) h = lerp(h, -1.2, apron);

  // --- switchyard terrace --------------------------------------------------
  const yardPad = padMask(x, z, -330, -188, 174, 284, 26);
  if (yardPad > 0.001) h = lerp(h, 15.4, yardPad);

  // --- spillway basin floor ------------------------------------------------
  const basinCentre = spillwayWorld(0, SPILLWAY_BASIN_V + 8);
  const basin = padMask(x, z, basinCentre.x - 74, basinCentre.x + 74, basinCentre.z - 40, basinCentre.z + 76, 24);
  if (basin > 0.001) h = lerp(h, -0.6, basin * 0.92);

  return h;
}

function terrainSlope(x, z, seed) {
  const d = 3.0;
  const hx = terrainHeight(x + d, z, seed) - terrainHeight(x - d, z, seed);
  const hz = terrainHeight(x, z + d, seed) - terrainHeight(x, z - d, seed);
  return Math.hypot(hx, hz) / (2 * d);
}

/** Palette for the landscape, by height, slope and a little noise. */
function terrainColorAt(x, z, height, slope, seed, target) {
  const color = target || new THREE.Color();
  const patch = fbm2(x * 0.016, z * 0.018, 3, seed + 101) * 0.5 + 0.5;
  const grain = fbm2(x * 0.11, z * 0.12, 2, seed + 131) * 0.5 + 0.5;
  const moss = fbm2(x * 0.045, z * 0.05, 3, seed + 167) * 0.5 + 0.5;

  const shoreBand = 1 - smoothstep(1.2, 7.0, Math.abs(height - LAYOUT.reservoirY));
  const wetBand = 1 - smoothstep(0.3, 3.2, Math.abs(height - LAYOUT.tailwaterY));
  const rocky = smoothstep(0.95, 1.7, slope);
  const cliff = smoothstep(1.35, 2.4, slope);
  const high = smoothstep(196, 268, height);

  // deep conifer forest floor
  color.setRGB(0.028 + patch * 0.03, 0.075 + patch * 0.06, 0.03 + patch * 0.022);
  // sunlit meadow / grass on gentler ground
  const meadow = smoothstep(0.52, 0.86, patch) * (1 - smoothstep(0.55, 1.05, slope));
  color.lerp(_terrainColorA.setRGB(0.125, 0.17, 0.045), meadow * 0.8);
  // mossy green in the wet gullies
  color.lerp(_terrainColorA.setRGB(0.06, 0.115, 0.05), moss * 0.35 * (1 - rocky));
  // exposed rock: cool grey faces, warm ledges
  const rockR = 0.16 + grain * 0.08;
  const rockG = 0.152 + grain * 0.075;
  const rockB = 0.142 + grain * 0.07;
  color.lerp(_terrainColorA.setRGB(rockR, rockG, rockB), rocky * 0.92);
  color.lerp(_terrainColorA.setRGB(0.30, 0.285, 0.26), cliff * 0.55);
  // bare scree and high crags
  color.lerp(_terrainColorA.setRGB(0.235, 0.232, 0.222), high * 0.6);
  // shoreline gravel and wet rock
  color.lerp(_terrainColorA.setRGB(0.205, 0.19, 0.155), shoreBand * 0.6 + wetBand * 0.5);

  const shade = 0.72 + grain * 0.55 + (fbm2(x * 0.004, z * 0.004, 2, seed + 191) * 0.5 + 0.5) * 0.18;
  color.multiplyScalar(shade);
  return color;
}

const _terrainColorA = new THREE.Color();

/**
 * Terrain mesh: a single indexed grid with vertex colours. At the high preset
 * it is ~115k vertices — enough to hold the gorge silhouette from every camera
 * station, while the far mountains fade into fog.
 */
function buildTerrain(ctx) {
  const { cfg, mats } = ctx;
  const quality = cfg.qualitySettings;
  const segX = Math.max(24, Math.round(quality.terrainSegX));
  const segZ = Math.max(24, Math.round(quality.terrainSegZ));
  const minX = -1100;
  const maxX = 1100;
  const minZ = -1500;
  const maxZ = 1100;

  const positions = new Float32Array((segX + 1) * (segZ + 1) * 3);
  const colors = new Float32Array((segX + 1) * (segZ + 1) * 3);
  const uvs = new Float32Array((segX + 1) * (segZ + 1) * 2);
  const indices = [];
  const color = new THREE.Color();

  let k = 0;
  for (let j = 0; j <= segZ; j += 1) {
    const z = lerp(minZ, maxZ, j / segZ);
    for (let i = 0; i <= segX; i += 1) {
      const x = lerp(minX, maxX, i / segX);
      const height = terrainHeight(x, z, cfg.seed);
      positions[k * 3] = x;
      positions[k * 3 + 1] = height;
      positions[k * 3 + 2] = z;
      const slope = terrainSlope(x, z, cfg.seed);
      terrainColorAt(x, z, height, slope, cfg.seed, color);
      colors[k * 3] = color.r;
      colors[k * 3 + 1] = color.g;
      colors[k * 3 + 2] = color.b;
      uvs[k * 2] = x * 0.05;
      uvs[k * 2 + 1] = z * 0.05;
      k += 1;
    }
  }

  for (let j = 0; j < segZ; j += 1) {
    for (let i = 0; i < segX; i += 1) {
      const a = j * (segX + 1) + i;
      const b = a + 1;
      const c = a + segX + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry, mats.terrain);
  mesh.name = 'HydroTerrain';
  mesh.receiveShadow = true;
  mesh.castShadow = false;

  return { mesh, geometry, segX, segZ, minX, maxX, minZ, maxZ };
}

/* Trees and boulders ------------------------------------------------------- */

/** Conifer geometry: trunk + three stacked cones, with baked vertex colour. */
function makeConiferGeometry(seed) {
  const random = mulberry32(seed + 7);
  const items = [];
  const trunkColor = new THREE.Color(0x4a3a2a);
  const needleColors = [0x4a7a3c, 0x568a40, 0x4d7f38, 0x3f6d34];

  const paint = (geometry, color) => {
    const count = geometry.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  };

  const trunk = new THREE.CylinderGeometry(0.22, 0.38, 4.2, 5);
  trunk.translate(0, 2.1, 0);
  items.push(paint(trunk, trunkColor));

  const tiers = [
    { r: 2.55, h: 5.4, y: 4.0 },
    { r: 1.95, h: 4.4, y: 7.0 },
    { r: 1.25, h: 3.2, y: 9.6 },
  ];
  for (const tier of tiers) {
    const geometry = new THREE.ConeGeometry(tier.r, tier.h, 7, 1);
    geometry.translate(randRange(random, -0.12, 0.12), tier.y, randRange(random, -0.12, 0.12));
    const color = new THREE.Color(needleColors[(random() * needleColors.length) | 0]);
    items.push(paint(geometry, color));
  }

  const merged = mergeGeometries(items);
  for (const geometry of items) geometry.dispose();
  return merged;
}

function makeBoulderGeometry(seed) {
  const random = mulberry32(seed + 23);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const scale = 0.68 + random() * 0.62;
    position.setXYZ(i, position.getX(i) * scale, position.getY(i) * scale * 0.72, position.getZ(i) * scale);
  }
  geometry.computeVertexNormals();
  geometry.deleteAttribute('uv');
  return geometry;
}

/** Scatter conifers over the slopes, keeping off water, roads and benches. */
function buildVegetation(ctx) {
  const { cfg, mats, group } = ctx;
  const quality = cfg.qualitySettings;
  const random = mulberry32(cfg.seed + 601);
  const total = Math.round(quality.trees * (cfg.particleScale > 0 ? 1 : 1));
  const target = Math.round(quality.distantTrees);

  const treeGeometry = makeConiferGeometry(cfg.seed);
  const treeMesh = new THREE.InstancedMesh(treeGeometry, mats.tree, total + target);
  treeMesh.name = 'HydroConifers';
  treeMesh.castShadow = cfg.shadows;
  treeMesh.receiveShadow = false;
  treeMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let placed = 0;
  let attempts = 0;
  const maxAttempts = total * 26;

  const isClear = (x, z, height) => {
    if (height < 3.2) return false;
    if (height > LAYOUT.reservoirY - 0.8 && height < LAYOUT.reservoirY + 1.2) return false;
    if (height > 252) return false;
    const slope = terrainSlope(x, z, cfg.seed);
    if (slope > 1.25) return false;
    // keep the reservoir and river clear
    if (z < 30 && height < LAYOUT.reservoirY + 1.5) return false;
    if (Math.abs(x - canyonCenterX(z)) < bedHalfWidth(z) + 2) return false;
    // dam crest and immediate abutments
    if (z > -20 && z < 150 && Math.abs(x) < 268) return false;
    // powerhouse bench and switchyard terrace
    if (x > -244 && x < 16 && z > 78 && z < 200) return false;
    if (x > -358 && x < -176 && z > 186 && z < 322) return false;
    const local = spillwayLocal(x, z);
    if (Math.abs(local.u) < chuteWidth(local.v) * 0.5 + 12 && local.v > -20 && local.v < 250) return false;
    return true;
  };

  while (placed < total && attempts < maxAttempts) {
    attempts += 1;
    const x = randRange(random, -1000, 1000);
    const z = randRange(random, -1380, 1040);
    const height = terrainHeight(x, z, cfg.seed);
    if (!isClear(x, z, height)) continue;

    const near = Math.hypot(x, z);
    const scale = randRange(random, 0.7, 1.65) * (near > 600 ? 1.35 : 1);
    dummy.position.set(x, height - 0.25, z);
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    dummy.scale.set(scale * randRange(random, 0.82, 1.12), scale * randRange(random, 0.9, 1.3), scale * randRange(random, 0.82, 1.12));
    dummy.updateMatrix();
    treeMesh.setMatrixAt(placed, dummy.matrix);
    color.setHSL(0.28 + random() * 0.04, 0.06 + random() * 0.1, 0.86 + random() * 0.12);
    treeMesh.setColorAt(placed, color);
    placed += 1;
  }

  // a lighter ring of distant trees reads as forest without the polygon cost
  let distant = 0;
  let distantAttempts = 0;
  while (distant < target && distantAttempts < target * 30) {
    distantAttempts += 1;
    const angle = random() * Math.PI * 2;
    const radius = randRange(random, 620, 1080);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 180;
    const height = terrainHeight(x, z, cfg.seed);
    if (height < 4 || height > 250) continue;
    const slope = terrainSlope(x, z, cfg.seed);
    if (slope > 1.4) continue;
    const scale = randRange(random, 1.8, 3.6);
    dummy.position.set(x, height - 0.5, z);
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    dummy.scale.set(scale, scale * randRange(random, 1.0, 1.5), scale);
    dummy.updateMatrix();
    treeMesh.setMatrixAt(placed + distant, dummy.matrix);
    color.setHSL(0.28 + random() * 0.04, 0.05 + random() * 0.08, 0.8 + random() * 0.12);
    treeMesh.setColorAt(placed + distant, color);
    distant += 1;
  }

  treeMesh.count = placed + distant;
  treeMesh.instanceMatrix.needsUpdate = true;
  if (treeMesh.instanceColor) treeMesh.instanceColor.needsUpdate = true;
  treeMesh.computeBoundingSphere();
  group.add(treeMesh);

  // boulders along the waterline and scree slopes
  const boulderGeometry = makeBoulderGeometry(cfg.seed);
  const boulderMesh = new THREE.InstancedMesh(boulderGeometry, mats.rock, quality.rocks);
  boulderMesh.name = 'HydroBoulders';
  boulderMesh.castShadow = cfg.shadows;
  boulderMesh.receiveShadow = true;
  let boulders = 0;
  let boulderAttempts = 0;
  while (boulders < quality.rocks && boulderAttempts < quality.rocks * 40) {
    boulderAttempts += 1;
    const x = randRange(random, -900, 900);
    const z = randRange(random, -1200, 950);
    const height = terrainHeight(x, z, cfg.seed);
    const nearWater = Math.abs(height - LAYOUT.reservoirY) < 9 || Math.abs(height - LAYOUT.tailwaterY) < 7;
    const slope = terrainSlope(x, z, cfg.seed);
    if (!nearWater && slope < 0.7) continue;
    if (height < -2) continue;
    const scale = randRange(random, 0.8, 3.4);
    dummy.position.set(x, height + scale * 0.18, z);
    dummy.rotation.set(randRange(random, -0.3, 0.3), random() * Math.PI * 2, randRange(random, -0.3, 0.3));
    dummy.scale.set(scale * randRange(random, 0.8, 1.5), scale * randRange(random, 0.55, 1.0), scale * randRange(random, 0.8, 1.5));
    dummy.updateMatrix();
    boulderMesh.setMatrixAt(boulders, dummy.matrix);
    color.setHSL(0.1, 0.05, 0.32 + random() * 0.16);
    boulderMesh.setColorAt(boulders, color);
    boulders += 1;
  }
  boulderMesh.count = boulders;
  boulderMesh.instanceMatrix.needsUpdate = true;
  if (boulderMesh.instanceColor) boulderMesh.instanceColor.needsUpdate = true;
  boulderMesh.computeBoundingSphere();
  group.add(boulderMesh);

  return { treeMesh, boulderMesh, trees: placed + distant, boulders };
}

/* ========================================================================== *
 *  Water — reservoir, tailrace river, spillway chute, plunge pool
 * ========================================================================== */

const WATER_VERT = /* glsl */ `
attribute float aDepth;
varying vec3 vWorld;
varying vec2 vUv;
varying float vDepth;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vUv = uv;
  vDepth = aDepth;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const WATER_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunPower;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
uniform vec3 uCityGlow;
uniform float uNight;
uniform float uWaveScale;
uniform float uFlowSpeed;
uniform float uFlowAcross;
uniform float uShoreFoam;
uniform float uGlitter;
uniform float uOpacity;
uniform int uOctaves;

varying vec3 vWorld;
varying vec2 vUv;
varying float vDepth;

${GLSL_NOISE}
${GLSL_FOG}

float waveHeight(vec2 p, float t) {
  float h = 0.0;
  h += sin(dot(p, vec2(0.83, 0.55)) * 0.055 * uWaveScale + t * 0.85) * 0.55;
  h += sin(dot(p, vec2(-0.42, 0.91)) * 0.093 * uWaveScale + t * 1.25) * 0.32;
  h += sin(dot(p, vec2(0.31, -0.95)) * 0.17 * uWaveScale + t * 1.9) * 0.16;
  h += sin(dot(p, vec2(0.97, 0.24)) * 0.31 * uWaveScale + t * 2.7) * 0.07;
  return h;
}

void main() {
  vec3 viewDir = normalize(uCameraPos - vWorld);
  vec2 p = vWorld.xz;

  // surface normal from four analytic sine waves
  float e = 0.45;
  float h0 = waveHeight(p, uTime);
  float hx = waveHeight(p + vec2(e, 0.0), uTime);
  float hz = waveHeight(p + vec2(0.0, e), uTime);
  vec3 normal = normalize(vec3((h0 - hx) * 0.55, 1.0, (h0 - hz) * 0.55));

  // wind riffles
  vec2 rip = vec2(fbm2d(p * 0.22 + vec2(uTime * 0.06, -uTime * 0.04), uOctaves),
                  fbm2d(p * 0.22 + vec2(-uTime * 0.05, uTime * 0.07) + 31.7, uOctaves)) - 0.5;
  normal = normalize(normal + vec3(rip.x * 0.16, 0.0, rip.y * 0.16));

  // flowing texture for the river / tailrace
  float flow = fbm2d(vec2(vUv.x * 9.0 + sin(vUv.y * 3.1) * 0.6, vUv.y * 42.0 - uTime * uFlowSpeed), uOctaves);
  float flow2 = fbm2d(vec2(vUv.x * 21.0, vUv.y * 90.0 - uTime * uFlowSpeed * 1.7) + 7.3, uOctaves);
  normal = normalize(normal + vec3((flow - 0.5) * 0.22 * uFlowAcross, 0.0, (flow2 - 0.5) * 0.22 * uFlowAcross));

  float fresnel = pow(clamp(1.0 - max(dot(normal, viewDir), 0.0), 0.0, 1.0), 4.2);
  vec3 reflected = reflect(-viewDir, normal);
  vec3 sky = mix(uSkyHorizon, uSkyTop, clamp(reflected.y * 1.4, 0.0, 1.0));

  float depth01 = smoothstep(0.0, 26.0, vDepth);
  vec3 body = mix(uShallowColor, uDeepColor, depth01);
  body *= 0.86 + 0.14 * smoothstep(-0.4, 0.7, h0);

  vec3 color = mix(body, sky * 0.82, 0.04 + 0.13 * fresnel);
  // turquoise light returning from shallow water
  color += uShallowColor * 0.18 * (1.0 - depth01) * (0.35 + 0.65 * uSunPower);

  // sun glitter: a narrow, anisotropic specular path plus sparkle
  vec3 halfDir = normalize(uSunDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 620.0);
  float glint = pow(max(dot(reflected, uSunDir), 0.0), 42.0) * 0.18;
  float sparkle = smoothstep(0.72, 1.0, fbm2d(p * 1.7 + vec2(uTime * 0.35, -uTime * 0.2), 2));
  color += uSunColor * (spec * 3.0 + glint * 0.6) * uSunPower * uGlitter;
  color += uSunColor * sparkle * 0.05 * uSunPower * uGlitter;

  // moon path on the water at night
  vec3 moonHalf = normalize(uMoonDir + viewDir);
  float moonSpec = pow(max(dot(normal, moonHalf), 0.0), 380.0);
  color += uMoonColor * moonSpec * 1.6 * uNight;
  color += uMoonColor * pow(max(dot(reflected, uMoonDir), 0.0), 18.0) * 0.06 * uNight;

  // shoreline foam: shallow water breaking on the banks
  float shore = 1.0 - smoothstep(0.35, 2.6, vDepth);
  float shoreNoise = fbm2d(p * 0.75 + vec2(uTime * 0.10, uTime * 0.07), 3);
  float foam = shore * smoothstep(0.42, 0.86, shoreNoise + shore * 0.18) * uShoreFoam;

  // moving foam streaks carried by the current
  float streak = smoothstep(0.58, 0.9, flow * 0.65 + flow2 * 0.45);
  streak *= uFlowAcross * 0.85;
  foam += streak * 0.55 * uShoreFoam;

  vec3 foamColor = uFoamColor * (0.55 + 0.45 * uSunPower + 0.35 * uNight);
  color = mix(color, foamColor, clamp(foam, 0.0, 0.9));

  color += uCityGlow * 0.06 * uNight * smoothstep(0.2, 1.0, fresnel);

  color = applyFog(color, vWorld);

  gl_FragColor = vec4(color, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const WHITEWATER_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec2 vUv;
varying vec3 vNormalW;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const WHITEWATER_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunPower;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uWaterColor;
uniform vec3 uFoamColor;
uniform vec3 uSparkColor;
uniform vec3 uMoonColor;
uniform float uNight;
uniform float uFlowSpeed;
uniform float uDensity;
uniform float uOpacity;
uniform float uChurn;
uniform float uSunGlint;
uniform int uOctaves;

varying vec3 vWorld;
varying vec2 vUv;
varying vec3 vNormalW;

${GLSL_NOISE}
${GLSL_FOG}

void main() {
  vec2 uv = vUv;
  float t = uTime;

  // two noise fields racing downstream at different speeds
  float n1 = fbm2d(vec2(uv.x * 7.0, uv.y * 26.0 - t * uFlowSpeed), uOctaves);
  float n2 = fbm2d(vec2(uv.x * 17.0 + 4.7, uv.y * 64.0 - t * uFlowSpeed * 1.55), uOctaves);
  float n3 = fbm2d(vec2(uv.x * 41.0, uv.y * 150.0 - t * uFlowSpeed * 2.2) + 11.3, 2);

  float churn = smoothstep(0.40, 0.62, n1 * 0.55 + n2 * 0.45);
  float bubbles = smoothstep(0.55, 0.9, n2 * 0.6 + n3 * 0.4);
  float lace = smoothstep(0.34, 0.56, n1 * 0.4 + n2 * 0.3 + n3 * 0.3);

  vec3 viewDir = normalize(uCameraPos - vWorld);
  vec3 normal = normalize(vec3((n2 - 0.5) * 1.4, 1.0, (n1 - 0.5) * 1.4) + vNormalW * 0.4);
  float fresnel = pow(clamp(1.0 - max(dot(normal, viewDir), 0.0), 0.0, 1.0), 3.0);

  vec3 color = uWaterColor * (0.55 + 0.45 * churn);
  color = mix(color, uFoamColor, clamp(churn * 0.85 + bubbles * 0.55, 0.0, 1.0));
  color = mix(color, uSkyHorizon, fresnel * 0.30);
  color += uSparkColor * pow(bubbles, 3.0) * (0.35 + 0.55 * uSunPower) * uSunGlint;
  color += uSunColor * pow(max(dot(reflect(-viewDir, normal), uSunDir), 0.0), 180.0) * 1.4 * uSunPower * uSunGlint;
  color += uMoonColor * (0.10 + 0.25 * lace) * uNight;

  float alpha = uOpacity * (0.55 + 0.45 * lace) * uDensity;

  // soften the edges of the sheet
  float edge = smoothstep(0.0, 0.035, uv.x) * (1.0 - smoothstep(0.965, 1.0, uv.x));
  alpha *= mix(1.0, edge, 0.35);

  color = applyFog(color, vWorld);

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* -------------------------------------------------------------------------- */
/*  Reservoir                                                                 */
/* -------------------------------------------------------------------------- */

function buildReservoir(ctx) {
  const { cfg, group, shared, uniforms } = ctx;
  const quality = cfg.qualitySettings;
  const columns = Math.max(24, Math.round(quality.waterSegX));
  const rows = Math.max(18, Math.round(quality.waterSegZ));
  const minX = -520;
  const maxX = 520;
  const farZ = -1360;

  const positions = [];
  const uvs = [];
  const depths = [];
  const indices = [];

  for (let i = 0; i <= columns; i += 1) {
    const x = lerp(minX, maxX, i / columns);
    const damEdge = crestZAtX(clamp(x, -296, 296)) - 2.5;
    const zStart = farZ;
    const zEnd = Math.min(damEdge, 30);
    for (let j = 0; j <= rows; j += 1) {
      const t = j / rows;
      // bias rows toward the dam so the waterline detail is fine near the crest
      const tb = Math.pow(t, 1.35);
      const z = lerp(zStart, zEnd, tb);
      positions.push(x, LAYOUT.reservoirY, z);
      uvs.push((x - minX) / (maxX - minX), t);
      const ground = terrainHeight(x, z, cfg.seed);
      const depth = Math.max(0, LAYOUT.reservoirY - ground);
      depths.push(Math.min(depth, 60));
    }
  }

  for (let i = 0; i < columns; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      const a = i * (rows + 1) + j;
      const b = a + 1;
      const c = a + rows + 1;
      const d = c + 1;
      // counter-clockwise seen from above (i runs along x, j along z)
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    name: 'HydroReservoirWater',
    uniforms: {
      uTime: shared.time,
      uSunDir: uniforms.sunDir,
      uSunColor: uniforms.sunColor,
      uSunPower: uniforms.sunPower,
      uSkyTop: uniforms.skyTop,
      uSkyHorizon: uniforms.skyHorizon,
      uDeepColor: { value: new THREE.Color(0x05505e) },
      uShallowColor: { value: new THREE.Color(0x35cbb4) },
      uFoamColor: { value: new THREE.Color(0xdfeef0) },
      uMoonDir: uniforms.moonDir,
      uMoonColor: uniforms.moonColor,
      uCityGlow: uniforms.cityGlow,
      uNight: uniforms.night,
      uWaveScale: { value: 1.0 },
      uFlowSpeed: { value: 0.0 },
      uFlowAcross: { value: 0.12 },
      uShoreFoam: { value: 0.55 },
      uGlitter: { value: 1.0 },
      uOpacity: { value: 1.0 },
      uOctaves: { value: quality.glslOctaves },
      uFogColor: uniforms.fogColor,
      uFogDensity: uniforms.fogDensity,
      uCameraPos: uniforms.cameraPos,
    },
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    transparent: false,
    side: THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'HydroReservoir';
  mesh.receiveShadow = false;
  mesh.renderOrder = 1;
  return { mesh, material, uniforms: material.uniforms };
}

/* -------------------------------------------------------------------------- */
/*  Tailrace river                                                            */
/* -------------------------------------------------------------------------- */

function riverPath(z) {
  const t = smoothstep(150, 460, z);
  const meander = 26 * Math.sin(z * 0.0031) + 10 * Math.sin(z * 0.0013 + 0.9);
  const center = lerp(-6, meander, t);
  const halfWidth = lerp(150, 70, smoothstep(180, 420, z)) + 18 * smoothstep(500, 980, z);
  const surfaceY = lerp(2.4, -26, smoothstep(200, 1000, z));
  return { center, halfWidth, surfaceY };
}

function buildRiver(ctx) {
  const { cfg, group, shared, uniforms } = ctx;
  const quality = cfg.qualitySettings;
  const columns = 14;
  const rows = Math.max(30, Math.round(quality.waterSegZ * 0.55));
  const zStart = 176;
  const zEnd = 1080;

  const positions = [];
  const uvs = [];
  const depths = [];
  const indices = [];

  for (let j = 0; j <= rows; j += 1) {
    const z = lerp(zStart, zEnd, Math.pow(j / rows, 1.2));
    const { center, halfWidth, surfaceY } = riverPath(z);
    for (let i = 0; i <= columns; i += 1) {
      const s = i / columns;
      const x = center + (s - 0.5) * 2 * halfWidth;
      positions.push(x, surfaceY, z);
      uvs.push(s, (z - zStart) * 0.02);
      const ground = terrainHeight(x, z, cfg.seed);
      depths.push(clamp(surfaceY - ground, 0, 30));
    }
  }

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < columns; i += 1) {
      const a = j * (columns + 1) + i;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    name: 'HydroTailrace',
    uniforms: {
      uTime: shared.time,
      uSunDir: uniforms.sunDir,
      uSunColor: uniforms.sunColor,
      uSunPower: uniforms.sunPower,
      uSkyTop: uniforms.skyTop,
      uSkyHorizon: uniforms.skyHorizon,
      uDeepColor: { value: new THREE.Color(0x0e3540) },
      uShallowColor: { value: new THREE.Color(0x2b7f84) },
      uFoamColor: { value: new THREE.Color(0xe6f2f2) },
      uMoonDir: uniforms.moonDir,
      uMoonColor: uniforms.moonColor,
      uCityGlow: uniforms.cityGlow,
      uNight: uniforms.night,
      uWaveScale: { value: 1.55 },
      uFlowSpeed: { value: 1.35 },
      uFlowAcross: { value: 1.0 },
      uShoreFoam: { value: 0.62 },
      uGlitter: { value: 1.0 },
      uOpacity: { value: 1.0 },
      uOctaves: { value: quality.glslOctaves },
      uFogColor: uniforms.fogColor,
      uFogDensity: uniforms.fogDensity,
      uCameraPos: uniforms.cameraPos,
    },
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    transparent: false,
    side: THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'HydroTailrace';
  mesh.renderOrder = 1;
  return { mesh, material, uniforms: material.uniforms };
}

/* -------------------------------------------------------------------------- */
/*  Spillway chute water sheet + plunge pool                                  */
/* -------------------------------------------------------------------------- */

/**
 * The water running down the stepped chute. It is a ribbon that follows the
 * concrete profile with a little standing wave on every step, so the sheet
 * visibly breaks white as it cascades.
 */
function buildChuteWater(ctx) {
  const { cfg, shared, uniforms, spillwayGroup } = ctx;
  const quality = cfg.qualitySettings;
  const rows = quality.rippleDetail ? 90 : 54;
  const columns = quality.rippleDetail ? 14 : 8;
  const vStart = 4;
  const vEnd = SPILLWAY_BASIN_V + 12;

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= rows; j += 1) {
    const v = lerp(vStart, vEnd, j / rows);
    const width = chuteWidth(v) * 1.0;
    // the sheet follows the stair: horizontal over each tread, then down the
    // riser, so the cascade covers the concrete instead of striping it
    let top;
    if (v < CHUTE_OGEE_END) {
      top = chuteTopY(v);
    } else {
      const stepIndex = Math.floor((v - CHUTE_OGEE_END) / CHUTE_TREAD);
      top = chuteTopY(CHUTE_OGEE_END + stepIndex * CHUTE_TREAD);
      const local = ((v - CHUTE_OGEE_END) % CHUTE_TREAD) / CHUTE_TREAD;
      top -= Math.max(0, chuteTopY(CHUTE_OGEE_END + stepIndex * CHUTE_TREAD) - chuteTopY(CHUTE_OGEE_END + (stepIndex + 1) * CHUTE_TREAD)) * smoothstep(0.7, 1.0, local);
    }
    const y = top + (v < CHUTE_OGEE_END ? 1.15 : 0.5) + Math.sin(v * 0.31) * 0.1;
    for (let i = 0; i <= columns; i += 1) {
      const s = i / columns;
      const u = (s - 0.5) * width;
      // slight side-wall climb so the sheet reads as contained
      const edge = 1 - Math.pow(Math.abs(s - 0.5) * 2, 2);
      positions.push(u, y + (1 - edge) * 0.5, v);
      uvs.push(s, (v - vStart) * 0.045);
    }
  }

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < columns; i += 1) {
      const a = j * (columns + 1) + i;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    name: 'HydroChuteWater',
    uniforms: {
      uTime: shared.time,
      uSunDir: uniforms.sunDir,
      uSunColor: uniforms.sunColor,
      uSunPower: uniforms.sunPower,
      uSkyTop: uniforms.skyTop,
      uSkyHorizon: uniforms.skyHorizon,
      uWaterColor: { value: new THREE.Color(0x6fa8b2) },
      uFoamColor: { value: new THREE.Color(0xffffff) },
      uSparkColor: { value: new THREE.Color(0xffffff) },
      uMoonColor: uniforms.moonColor,
      uNight: uniforms.night,
      uFlowSpeed: { value: 2.6 },
      uDensity: { value: 1.0 },
      uOpacity: { value: 1.0 },
      uChurn: { value: 1.0 },
      uSunGlint: { value: 1.0 },
      uOctaves: { value: quality.glslOctaves },
      uFogColor: uniforms.fogColor,
      uFogDensity: uniforms.fogDensity,
      uCameraPos: uniforms.cameraPos,
    },
    vertexShader: WHITEWATER_VERT,
    fragmentShader: WHITEWATER_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'HydroChuteWater';
  mesh.renderOrder = 6;
  spillwayGroup.add(mesh);
  return { mesh, material, uniforms: material.uniforms };
}

function buildPlungePool(ctx) {
  const { shared, uniforms, spillwayGroup, cfg } = ctx;
  const quality = cfg.qualitySettings;
  const width = 84;
  const depth = 70;
  const segments = quality.rippleDetail ? 40 : 22;

  const geometry = new THREE.PlaneGeometry(width, depth, segments, Math.round(segments * 0.6));
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position');
  const vStart = SPILLWAY_BASIN_V - 18;
  const uvs = geometry.getAttribute('uv');
  const depths = new Float32Array(position.count);
  for (let i = 0; i < position.count; i += 1) {
    const u = position.getX(i);
    const v = vStart + (position.getZ(i) + depth / 2) * 1.0;
    position.setY(i, 0.35 + Math.sin(u * 0.3 + v * 0.2) * 0.16);
    uvs.setXY(i, (u / width) + 0.5, v * 0.02);
    depths[i] = 4 + 6 * Math.exp(-Math.pow(u / 30, 2));
  }
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1));

  const material = new THREE.ShaderMaterial({
    name: 'HydroPlungePool',
    uniforms: {
      uTime: shared.time,
      uSunDir: uniforms.sunDir,
      uSunColor: uniforms.sunColor,
      uSunPower: uniforms.sunPower,
      uSkyTop: uniforms.skyTop,
      uSkyHorizon: uniforms.skyHorizon,
      uWaterColor: { value: new THREE.Color(0xa8ced0) },
      uFoamColor: { value: new THREE.Color(0xffffff) },
      uSparkColor: { value: new THREE.Color(0xffffff) },
      uMoonColor: uniforms.moonColor,
      uNight: uniforms.night,
      uFlowSpeed: { value: 1.1 },
      uDensity: { value: 1.0 },
      uOpacity: { value: 0.97 },
      uChurn: { value: 1.0 },
      uSunGlint: { value: 1.0 },
      uOctaves: { value: quality.glslOctaves },
      uFogColor: uniforms.fogColor,
      uFogDensity: uniforms.fogDensity,
      uCameraPos: uniforms.cameraPos,
    },
    vertexShader: WHITEWATER_VERT,
    fragmentShader: WHITEWATER_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'HydroPlungePool';
  mesh.position.set(0, SPILLWAY_BASIN_Y + 0.1, SPILLWAY_BASIN_V + 22);
  mesh.renderOrder = 5;
  spillwayGroup.add(mesh);
  return { mesh, material, uniforms: material.uniforms };
}

/* -------------------------------------------------------------------------- */
/*  Mist, spray and dust                                                      */
/* -------------------------------------------------------------------------- */

const MIST_VERT = /* glsl */ `
attribute vec3 aVel;
attribute float aPhase;
attribute float aSize;
attribute float aLife;
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
uniform float uSizeScale;
uniform float uViewportHeight;
uniform float uSpeed;
varying float vAlpha;
varying float vSeed;

void main() {
  float life = fract(uTime * uSpeed / max(aLife, 0.5) + aPhase);
  float rise = life;
  vec3 p = position;
  p.y += rise * (14.0 + aSeed * 18.0);
  p.x += aVel.x * rise + sin(uTime * 0.6 + aSeed * 6.28) * (2.0 + aSeed * 5.0) * rise;
  p.z += aVel.z * rise + cos(uTime * 0.5 + aSeed * 4.1) * (2.0 + aSeed * 4.0) * rise;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.001);
  float pixelsPerMetre = projectionMatrix[1][1] * uViewportHeight * 0.5;
  gl_PointSize = clamp(aSize * uSizeScale * uPixelRatio * pixelsPerMetre / dist, 2.0, 460.0);
  gl_Position = projectionMatrix * mv;

  float fade = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.55, 1.0, life));
  float nearFade = smoothstep(6.0, 24.0, dist);
  vAlpha = fade * nearFade * 0.55;
  vSeed = aSeed;
}
`;

const MIST_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uShadowColor;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uOpacity;
uniform int uOctaves;
varying float vAlpha;
varying float vSeed;

${GLSL_NOISE}

void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q) * 2.0;
  if (r > 1.0) discard;

  float body = pow(clamp(1.0 - r, 0.0, 1.0), 1.5);
  float grain = fbm2d(gl_PointCoord * 5.0 + vSeed * 37.0, uOctaves);
  float a = body * (0.55 + 0.65 * grain) * vAlpha * uOpacity;

  vec3 lit = mix(uShadowColor, uColor, clamp(0.45 + grain * 0.75, 0.0, 1.0));
  lit += uSunColor * pow(max(dot(normalize(vec3(q.x, 0.35, q.y)), uSunDir), 0.0), 6.0) * 0.18;

  gl_FragColor = vec4(lit, clamp(a, 0.0, 0.85));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function buildMistCloud(shared, uniforms, options) {
  const count = options.count;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const lives = new Float32Array(count);
  const seeds = new Float32Array(count);
  const random = mulberry32(options.seed || 1);

  for (let i = 0; i < count; i += 1) {
    const r = Math.sqrt(random()) * options.radius;
    const a = random() * Math.PI * 2;
    const spread = options.spread == null ? 1 : options.spread;
    positions[i * 3] = options.center[0] + Math.cos(a) * r * spread;
    positions[i * 3 + 1] = options.center[1] + random() * (options.height || 10);
    positions[i * 3 + 2] = options.center[2] + Math.sin(a) * r;
    velocities[i * 3] = (random() - 0.5) * (options.drift || 6);
    velocities[i * 3 + 1] = 0;
    velocities[i * 3 + 2] = (random() - 0.5) * (options.drift || 6);
    phases[i] = random();
    sizes[i] = lerp(options.sizeRange[0], options.sizeRange[1], Math.pow(random(), 1.6));
    lives[i] = lerp(options.lifeRange[0], options.lifeRange[1], random());
    seeds[i] = random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aVel', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aLife', new THREE.BufferAttribute(lives, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius += 120;

  const quality = options.quality || { glslOctaves: 3 };
  const material = new THREE.ShaderMaterial({
    name: options.name || 'HydroMist',
    uniforms: {
      uTime: shared.time,
      uPixelRatio: shared.pixelRatio,
      uSizeScale: { value: options.sizeScale == null ? 1 : options.sizeScale },
      uViewportHeight: shared.viewportHeight,
      uSpeed: { value: options.speed == null ? 0.12 : options.speed },
      uColor: { value: new THREE.Color(options.color == null ? 0xf2f7f7 : options.color) },
      uShadowColor: { value: new THREE.Color(options.shadow == null ? 0x9fb0b4 : options.shadow) },
      uSunColor: uniforms.sunColor,
      uSunDir: uniforms.sunDir,
      uOpacity: { value: options.opacity == null ? 1 : options.opacity },
      uOctaves: { value: quality.glslOctaves },
    },
    vertexShader: MIST_VERT,
    fragmentShader: MIST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
    fog: false,
  });

  const points = new THREE.Points(geometry, material);
  points.name = options.name || 'HydroMist';
  points.frustumCulled = false;
  points.renderOrder = options.renderOrder == null ? 8 : options.renderOrder;
  points.userData.uniforms = material.uniforms;
  return points;
}

/* ========================================================================== *
 *  The dam: arch-gravity body, crest roadway, intake towers, gantry crane
 * ========================================================================== */

function damThicknessAt(y) {
  const t = clamp01((y - LAYOUT.baseY) / (LAYOUT.crestY - LAYOUT.baseY));
  return lerp(LAYOUT.baseThickness, LAYOUT.crestThickness, Math.pow(t, 0.62));
}

function damFaceOffsets(y) {
  const t = damThicknessAt(y);
  return { upstream: -t * 0.42, downstream: t * 0.58, thickness: t };
}

/** Plan point on the arch at angle theta. */
function crestPlan(theta) {
  return {
    x: LAYOUT.archRadius * Math.sin(theta),
    z: LAYOUT.archCenterZ - LAYOUT.archRadius * Math.cos(theta),
  };
}

/** A point on the crest centreline, with the arch's downstream normal. */
function crestPoint(theta, y = LAYOUT.crestY, lateral = 0, target = new THREE.Vector3()) {
  const plan = crestPlan(theta);
  const normal = crestNormal(theta);
  return target.set(plan.x + normal.x * lateral, y, plan.z + normal.y * lateral);
}

function crestTangentVector(theta, target = new THREE.Vector3()) {
  return target.set(Math.cos(theta), 0, Math.sin(theta));
}

/** Loft a ribbon (left/right edges per step) into a mesh. */
function buildLoft(samples, edgeFn, uvScale = [25, 1], closed = false) {
  const positions = [];
  const uvs = [];
  const indices = [];
  let arc = 0;
  let previous = null;

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const { left, right } = edgeFn(t);
    if (previous) arc += left.distanceTo(previous.left);
    previous = { left: left.clone() };
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, arc / uvScale[0], uvScale[1], arc / uvScale[0]);
  }

  for (let i = 0; i < samples; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }
  if (closed) {
    const a = samples * 2;
    const b = 0;
    indices.push(a, b, a + 1, b, 1, a + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** The dam body as four crisp surfaces (upstream, downstream, crest, base). */
function buildDamBody(ctx) {
  const { mats, cfg } = ctx;
  const NU = cfg.quality === 'low' ? 56 : 104;
  const NV = cfg.quality === 'low' ? 12 : 22;
  const thetaStart = -LAYOUT.archHalfAngle;
  const thetaEnd = LAYOUT.archHalfAngle;
  const surfaces = [];

  const makeSurface = (pointFn, flip) => {
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i <= NU; i += 1) {
      const theta = lerp(thetaStart, thetaEnd, i / NU);
      for (let j = 0; j <= NV; j += 1) {
        const y = lerp(LAYOUT.baseY, LAYOUT.crestY, j / NV);
        const p = pointFn(theta, y);
        positions.push(p.x, p.y, p.z);
        uvs.push((theta + LAYOUT.archHalfAngle) * LAYOUT.archRadius * 0.09, y * 0.09);
      }
    }
    for (let i = 0; i < NU; i += 1) {
      for (let j = 0; j < NV; j += 1) {
        const a = i * (NV + 1) + j;
        const b = a + 1;
        const c = a + NV + 1;
        const d = c + 1;
        if (flip) indices.push(a, b, c, b, d, c);
        else indices.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };

  // upstream face (battered slightly, so the reservoir presses on a wall)
  surfaces.push(
    makeSurface((theta, y) => {
      const plan = crestPlan(theta);
      const normal = crestNormal(theta);
      const offset = damFaceOffsets(y).upstream;
      return new THREE.Vector3(plan.x + normal.x * offset, y, plan.z + normal.y * offset);
    }, false)
  );

  // downstream face
  surfaces.push(
    makeSurface((theta, y) => {
      const plan = crestPlan(theta);
      const normal = crestNormal(theta);
      const offset = damFaceOffsets(y).downstream;
      return new THREE.Vector3(plan.x + normal.x * offset, y, plan.z + normal.y * offset);
    }, true)
  );

  // crest cap
  surfaces.push(
    makeSurface((theta, y) => {
      void y;
      const plan = crestPlan(theta);
      const normal = crestNormal(theta);
      const offset = damFaceOffsets(LAYOUT.crestY).downstream - 0.4;
      return new THREE.Vector3(plan.x + normal.x * offset, LAYOUT.crestY, plan.z + normal.y * offset);
    }, false)
  );

  const bodyGeometry = mergeGeometries(surfaces.map((geometry) => ({ geometry })));
  for (const geometry of surfaces) geometry.dispose();

  const body = new THREE.Mesh(bodyGeometry, mats.concrete);
  body.name = 'HydroDamBody';
  body.castShadow = cfg.shadows;
  body.receiveShadow = true;

  // --- crest deck: asphalt ribbon with a kerb on both sides ---------------
  const roadT0 = -0.895;
  const roadT1 = 0.895;
  const road = buildLoft(
    120,
    (t) => {
      const theta = lerp(roadT0, roadT1, t);
      const left = crestPoint(theta, LAYOUT.crestY + 0.16, -LAYOUT.crestHalfRoad + 0.35);
      const right = crestPoint(theta, LAYOUT.crestY + 0.16, LAYOUT.crestHalfRoad - 0.35);
      return { left, right };
    },
    [16, 1]
  );
  const roadMesh = new THREE.Mesh(road, mats.asphalt);
  roadMesh.name = 'HydroCrestRoad';
  roadMesh.receiveShadow = true;

  // centre line
  const centreLine = buildLoft(
    110,
    (t) => {
      const theta = lerp(roadT0, roadT1, t);
      const left = crestPoint(theta, LAYOUT.crestY + 0.19, -0.16);
      const right = crestPoint(theta, LAYOUT.crestY + 0.19, 0.16);
      return { left, right };
    },
    [8, 1]
  );
  const centreMesh = new THREE.Mesh(centreLine, mats.paintWhite);
  centreMesh.name = 'HydroCrestRoadLine';

  // kerbs and parapets
  const kerbParts = [];
  const parapetParts = [];
  for (const side of [-1, 1]) {
    kerbParts.push(
      buildLoft(
        110,
        (t) => {
          const theta = lerp(roadT0, roadT1, t);
          const inner = crestPoint(theta, LAYOUT.crestY + 0.22, side * (LAYOUT.crestHalfRoad - 0.36));
          const outer = crestPoint(theta, LAYOUT.crestY + 0.22, side * (LAYOUT.crestHalfRoad - 0.02));
          return side > 0 ? { left: inner, right: outer } : { left: outer, right: inner };
        },
        [8, 1]
      )
    );
    parapetParts.push(
      buildLoft(
        110,
        (t) => {
          const theta = lerp(roadT0, roadT1, t);
          const inner = crestPoint(theta, LAYOUT.crestY + 1.34, side * (LAYOUT.crestHalfRoad + 0.05));
          const outer = crestPoint(theta, LAYOUT.crestY + 1.34, side * (LAYOUT.crestHalfRoad + 0.44));
          return side > 0 ? { left: inner, right: outer } : { left: outer, right: inner };
        },
        [8, 1]
      )
    );
  }
  const kerbMesh = new THREE.Mesh(mergeGeometries(kerbParts.map((geometry) => ({ geometry }))), mats.concreteTrim);
  kerbMesh.name = 'HydroCrestKerb';
  kerbMesh.receiveShadow = true;
  for (const geometry of kerbParts) geometry.dispose();

  // --- parapet walls: vertical faces on both sides of the crest -----------
  const wallGeometries = [];
  for (const side of [-1, 1]) {
    const samples = 110;
    const positions = [];
    const uvs = [];
    const indices = [];
    let arc = 0;
    let prev = null;
    for (let i = 0; i <= samples; i += 1) {
      const theta = lerp(roadT0, roadT1, i / samples);
      const lateral = side * (LAYOUT.crestHalfRoad + 0.26);
      const bottom = crestPoint(theta, LAYOUT.crestY + 0.22, lateral);
      const top = crestPoint(theta, LAYOUT.crestY + 1.7, lateral);
      if (prev) arc += bottom.distanceTo(prev);
      prev = bottom.clone();
      positions.push(bottom.x, bottom.y, bottom.z, top.x, top.y, top.z);
      uvs.push(arc * 0.08, 0, arc * 0.08, 1.4);
    }
    for (let i = 0; i < samples; i += 1) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    wallGeometries.push(geometry);
  }
  const wallMesh = new THREE.Mesh(mergeGeometries(wallGeometries.map((geometry) => ({ geometry }))), mats.concrete);
  wallMesh.name = 'HydroCrestParapets';
  wallMesh.castShadow = cfg.shadows;
  wallMesh.receiveShadow = true;
  for (const geometry of wallGeometries) geometry.dispose();

  // --- cornice band under the crest ---------------------------------------
  const corniceGeometries = [];
  for (const side of [-1, 1]) {
    corniceGeometries.push(
      buildLoft(
        90,
        (t) => {
          const theta = lerp(roadT0, roadT1, t);
          const a = crestPoint(theta, LAYOUT.crestY - 1.7, side * 5.9);
          const b = crestPoint(theta, LAYOUT.crestY - 1.7, side * 5.3);
          return side > 0 ? { left: a, right: b } : { left: b, right: a };
        },
        [8, 1]
      )
    );
  }
  const corniceMesh = new THREE.Mesh(mergeGeometries(corniceGeometries.map((geometry) => ({ geometry }))), mats.concreteTrim);
  corniceMesh.name = 'HydroCrestCornice';
  corniceMesh.castShadow = true;
  for (const geometry of corniceGeometries) geometry.dispose();

  // --- abutment thrust blocks: modest concrete collars where the arch
  //     disappears into the rock, not free-standing towers
  const abutments = [];
  for (const side of [-1, 1]) {
    const theta = side * LAYOUT.archHalfAngle;
    const plan = crestPlan(theta);
    const normal = crestNormal(theta);
    const block = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 26), mats.concreteDark);
    block.position.set(plan.x + normal.x * 4, LAYOUT.crestY - 16, plan.z + normal.y * 4);
    block.rotation.y = -theta;
    block.name = 'HydroAbutment';
    block.castShadow = cfg.shadows;
    block.receiveShadow = true;
    abutments.push(block);
  }

  return { body, roadMesh, centreMesh, kerbMesh, wallMesh, abutments, pilasterMesh: corniceMesh };
}

/* -------------------------------------------------------------------------- */
/*  Crest furniture: lamps, railing, intake towers, gantry crane              */
/* -------------------------------------------------------------------------- */

function buildCrestFurniture(ctx) {
  const { mats, cfg, group } = ctx;
  const quality = cfg.qualitySettings;
  const glowEntries = [];
  const craneGlow = [];
  const lampParts = new BoxBuilder();
  const railParts = new BoxBuilder();
  const roadT0 = -0.88;
  const roadT1 = 0.88;
  const lampCount = 26;

  for (let i = 0; i < lampCount; i += 1) {
    const t = i / (lampCount - 1);
    const theta = lerp(roadT0, roadT1, t);
    if (Math.abs(theta - SPILLWAY.theta) < 0.055) continue; // leave room for the bridge
    const base = crestPoint(theta, LAYOUT.crestY + 0.2, LAYOUT.crestHalfRoad + 0.9);
    const normal = crestNormal(theta);
    // pole
    lampParts.cylinder(0.11, 0.16, 7.4, [base.x, base.y + 3.7, base.z], null, 7);
    // arm over the road
    lampParts.add(0.14, 0.14, 1.6, [base.x - normal.x * 0.8, base.y + 7.3, base.z - normal.y * 0.8], [0, -theta, 0]);
    const head = crestPoint(theta, LAYOUT.crestY + 7.2, LAYOUT.crestHalfRoad + 1.7);
    lampParts.add(0.7, 0.22, 0.42, [head.x, head.y, head.z], [0, -theta, 0]);
    glowEntries.push({
      position: [head.x, head.y - 0.2, head.z],
      color: 0xffdca8,
      size: 1.5,
      phase: i * 0.17,
    });
  }

  // railing posts along both parapets
  const postCount = quality.fencePosts > 0 ? Math.round(quality.fencePosts * 0.5) : 80;
  for (let i = 0; i <= postCount; i += 1) {
    const theta = lerp(roadT0, roadT1, i / postCount);
    if (Math.abs(theta - SPILLWAY.theta) < 0.05) continue;
    for (const side of [-1, 1]) {
      const p = crestPoint(theta, LAYOUT.crestY + 1.72, side * (LAYOUT.crestHalfRoad + 0.26));
      railParts.add(0.09, 0.9, 0.09, [p.x, p.y + 0.45, p.z], [0, -theta, 0]);
    }
  }
  // top rail as a thin lofted band
  const railGeometries = [];
  for (const side of [-1, 1]) {
    railGeometries.push(
      buildLoft(
        100,
        (t) => {
          const theta = lerp(roadT0, roadT1, t);
          const a = crestPoint(theta, LAYOUT.crestY + 2.58, side * (LAYOUT.crestHalfRoad + 0.21));
          const b = crestPoint(theta, LAYOUT.crestY + 2.7, side * (LAYOUT.crestHalfRoad + 0.31));
          return side > 0 ? { left: a, right: b } : { left: b, right: a };
        },
        [8, 1]
      )
    );
  }
  const railMesh = new THREE.Mesh(mergeGeometries(railGeometries.map((geometry) => ({ geometry }))), mats.steelDark);
  railMesh.name = 'HydroCrestHandrail';
  railMesh.castShadow = cfg.shadows;
  for (const geometry of railGeometries) geometry.dispose();

  const lampMesh = new THREE.Mesh(lampParts.build(), mats.steelDark);
  lampMesh.name = 'HydroCrestLamps';
  lampMesh.castShadow = cfg.shadows;

  const postMesh = new THREE.Mesh(railParts.build(), mats.steelDark);
  postMesh.name = 'HydroCrestRailPosts';

  /* ---- intake towers ---------------------------------------------------- */
  const towerParts = [];
  const trashParts = new BoxBuilder();
  const intakePositions = [-152, -112, -72];
  const towerGlow = [];

  for (let ti = 0; ti < intakePositions.length; ti += 1) {
    const x = intakePositions[ti];
    const theta = crestAngleAtX(x);
    const towerBase = crestPoint(theta, LAYOUT.crestY - 26, -15.5);
    const normal = crestNormal(theta);
    const tower = new THREE.Group();
    tower.name = `HydroIntakeTower${ti + 1}`;

    const body = new THREE.Mesh(new THREE.BoxGeometry(14, 42, 12.5), mats.concrete);
    body.position.set(towerBase.x, towerBase.y + 21, towerBase.z);
    body.rotation.y = -theta;
    body.castShadow = cfg.shadows;
    body.receiveShadow = true;
    tower.add(body);

    // upstream trash rack: a recessed frame with vertical bars
    const rackX = towerBase.x - normal.x * 7.6;
    const rackZ = towerBase.z - normal.y * 7.6;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(11.0, 16, 1.2), mats.concreteDark);
    frame.position.set(rackX, towerBase.y + 14, rackZ);
    frame.rotation.y = -theta;
    tower.add(frame);

    const barCount = 14;
    for (let b = 0; b < barCount; b += 1) {
      const lateral = lerp(-5.4, 5.4, b / (barCount - 1));
      const px = rackX + Math.cos(theta) * lateral - normal.x * 0.8;
      const pz = rackZ + Math.sin(theta) * lateral - normal.y * 0.8;
      trashParts.add(0.24, 16.4, 0.5, [px, towerBase.y + 14, pz], [0, -theta, 0]);
    }
    // horizontal rack beams
    for (let h = 0; h < 4; h += 1) {
      trashParts.add(11.6, 0.26, 0.36, [rackX - normal.x * 0.9, towerBase.y + 7 + h * 4.4, rackZ - normal.y * 0.9], [0, -theta, 0]);
    }

    // cornice, corner pilasters and a service door
    const trimParts = new BoxBuilder();
    trimParts.add(15.0, 1.1, 13.6, [towerBase.x, towerBase.y + 42 + 0.3, towerBase.z], [0, -theta, 0]);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        trimParts.add(0.9, 36, 0.9, [towerBase.x + sx * 6.8 * Math.cos(theta) - sz * 6.1 * Math.sin(theta), towerBase.y + 21, towerBase.z + sx * 6.8 * Math.sin(theta) + sz * 6.1 * Math.cos(theta)], [0, -theta, 0]);
      }
    }
    trimParts.add(3.0, 4.2, 0.5, [towerBase.x + normal.x * 7.6, towerBase.y + 13, towerBase.z + normal.y * 7.6], [0, -theta, 0]);
    // window slots on the downstream face
    for (let wy = 0; wy < 3; wy += 1) {
      trimParts.add(7.0, 0.9, 0.4, [towerBase.x - normal.x * 0.2, towerBase.y + 28 + wy * 5.4, towerBase.z - normal.y * 0.2], [0, -theta, 0]);
    }
    const trims = new THREE.Mesh(trimParts.build(), mats.concreteDark);
    trims.castShadow = cfg.shadows;
    tower.add(trims);

    // gate house on top
    const house = new THREE.Mesh(new THREE.BoxGeometry(9.4, 5.6, 8.6), mats.concreteTrim);
    house.position.set(towerBase.x, towerBase.y + 42 + 2.3, towerBase.z);
    house.rotation.y = -theta;
    house.castShadow = cfg.shadows;
    tower.add(house);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.5, 9.8), mats.steelBlue);
    roof.position.set(towerBase.x, towerBase.y + 42 + 5.4, towerBase.z);
    roof.rotation.y = -theta;
    tower.add(roof);
    const rail = new BoxBuilder();
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      rail.add(0.08, 1.0, 0.08, [towerBase.x + Math.cos(a) * 5.2, towerBase.y + 42 + 6.0, towerBase.z + Math.sin(a) * 4.8], null);
    }
    const roofRail = new THREE.Mesh(rail.build(), mats.steelDark);
    tower.add(roofRail);

    // service bridge back to the crest
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(9, 1.1, 6.5), mats.steelDark);
    bridge.position.set(towerBase.x, LAYOUT.crestY + 0.7, towerBase.z + normal.y * 10.5 + 2);
    bridge.rotation.y = -theta;
    bridge.castShadow = cfg.shadows;
    tower.add(bridge);

    // aviation light
    towerGlow.push({ position: [towerBase.x, towerBase.y + 48.4, towerBase.z], color: 0xff5a3c, size: 1.2, phase: ti * 0.4 });
    towerParts.push(tower);
  }

  const trashMesh = new THREE.Mesh(trashParts.build(), mats.steelDark);
  trashMesh.name = 'HydroTrashRacks';
  trashMesh.castShadow = cfg.shadows;

  /* ---- gantry crane over the crest -------------------------------------- */
  const crane = new THREE.Group();
  crane.name = 'HydroGantryCrane';
  const craneTheta = 0.06;
  const craneCentre = crestPoint(craneTheta, LAYOUT.crestY, 0);
  crane.position.copy(craneCentre);
  crane.rotation.y = -craneTheta;

  const cp = new BoxBuilder();
  const craneHalf = 11.5;   // half span along the crest
  const craneGauge = 5.4;   // half gauge across the crest
  const craneHeight = 15.5;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      cp.add(0.95, craneHeight, 0.95, [sx * craneHalf, craneHeight / 2, sz * craneGauge], null);
      cp.add(3.2, 1.1, 2.2, [sx * craneHalf, 0.55, sz * craneGauge], null);
      cp.add(1.6, 0.5, 1.4, [sx * craneHalf, 1.35, sz * craneGauge], null);
    }
    cp.memberBetween([sx * craneHalf, 1.6, -craneGauge], [sx * craneHalf, craneHeight - 1.2, craneGauge], 0.34);
    cp.memberBetween([sx * craneHalf, 1.6, craneGauge], [sx * craneHalf, craneHeight - 1.2, -craneGauge], 0.34);
    cp.add(1.5, 1.7, craneGauge * 2 + 1.6, [sx * craneHalf, craneHeight + 0.85, 0], null);
  }
  // main girders and cross bracing
  for (const sz of [-1, 1]) {
    cp.add(craneHalf * 2 + 2.4, 2.3, 1.6, [0, craneHeight + 2.9, sz * 3.1], null);
    cp.add(craneHalf * 2 + 2.4, 0.25, 1.9, [0, craneHeight + 4.2, sz * 3.1], null);
  }
  for (let i = -4; i <= 4; i += 1) {
    cp.add(0.9, 0.9, 6.2, [i * 2.6, craneHeight + 2.9, 0], null);
  }
  // walkway and handrail
  cp.add(craneHalf * 2, 0.22, 1.5, [0, craneHeight + 1.9, craneGauge + 1.1], null);
  for (let i = -5; i <= 5; i += 1) {
    cp.add(0.1, 1.1, 0.1, [i * 2.2, craneHeight + 2.5, craneGauge + 1.7], null);
  }
  cp.add(craneHalf * 2, 0.1, 0.1, [0, craneHeight + 3.0, craneGauge + 1.7], null);
  // trolley, cab and hook block
  cp.add(4.8, 2.4, 5.0, [2.4, craneHeight + 4.9, 0], null);
  cp.add(1.8, 1.6, 1.8, [4.8, craneHeight + 4.4, 2.4], null);
  cp.add(0.14, 9.5, 0.14, [2.4, craneHeight - 0.2, 0], null);
  cp.add(1.9, 1.3, 1.9, [2.4, craneHeight - 5.2, 0], null);
  cp.add(0.8, 1.6, 0.8, [2.4, craneHeight - 6.8, 0], null);
  const craneMesh = new THREE.Mesh(cp.build(), mats.steelPaint);
  craneMesh.castShadow = cfg.shadows;
  craneMesh.receiveShadow = true;
  crane.add(craneMesh);
  craneGlow.push({ position: [craneCentre.x, craneCentre.y + craneHeight + 6.4, craneCentre.z], color: 0xff5a3c, size: 0.9, phase: 0.2 });

  /* ---- spillway road bridge --------------------------------------------- */
  const bridgeGroup = new THREE.Group();
  bridgeGroup.name = 'HydroSpillwayBridge';
  const bridgeParts = new BoxBuilder();
  const bridgeHalf = 48;
  bridgeParts.add(bridgeHalf * 2, 1.5, 9.5, [0, LAYOUT.crestY + 0.3, 0], null);
  bridgeParts.add(bridgeHalf * 2, 0.9, 0.4, [0, LAYOUT.crestY + 1.2, -4.9], null);
  bridgeParts.add(bridgeHalf * 2, 0.9, 0.4, [0, LAYOUT.crestY + 1.2, 4.9], null);
  for (let i = -3; i <= 3; i += 1) {
    bridgeParts.add(1.6, 2.4, 9.5, [i * 14, LAYOUT.crestY - 1.6, 0], null);
    bridgeParts.add(1.0, 9.0, 1.0, [i * 14, LAYOUT.crestY - 7.2, 0], null);
  }
  const bridgeMesh = new THREE.Mesh(bridgeParts.build(), mats.concreteTrim);
  bridgeMesh.castShadow = cfg.shadows;
  bridgeMesh.receiveShadow = true;
  bridgeGroup.add(bridgeMesh);

  const glowPoints = buildGlowPoints(
    ctx.shared,
    glowEntries.concat(towerGlow, craneGlow),
    { name: 'HydroCrestGlow', sizeScale: 0.85, twinkle: 0.12, opacity: 0.0 }
  );

  return {
    group: new THREE.Group(),
    lampMesh,
    postMesh,
    railMesh,
    trashMesh,
    crane,
    bridgeGroup,
    glowPoints,
    intakeTowers: towerParts,
    lampCount: glowEntries.length,
  };
}
/* ========================================================================== *
 *  Spillway: crest structure, five radial gates, stepped chute, basin
 * ========================================================================== */

const GATE = {
  sillY: 144.0,
  trunnionY: 150.6,
  trunnionV: 7.0,
  radius: 12.5,
  halfAngle: 0.52,
  maxOpenAngle: 1.02,
  bayWidth: 13.5,
  pierWidth: 3.0,
  count: 5,
};

function spillwayBayU(index) {
  const pitch = GATE.bayWidth + GATE.pierWidth;
  return (index - (GATE.count - 1) / 2) * pitch;
}

/** y of the gate lip for an opening fraction 0..1. */
function gateLipY(open) {
  const beta = clamp01(open) * GATE.maxOpenAngle;
  return GATE.trunnionY + GATE.radius * Math.sin(-GATE.halfAngle + beta);
}

function buildSpillway(ctx) {
  const { cfg, mats, shared, uniforms } = ctx;
  const quality = cfg.qualitySettings;
  const group = new THREE.Group();
  group.name = 'HydroSpillway';
  group.position.set(SPILLWAY.x, 0, SPILLWAY.z);
  group.rotation.y = SPILLWAY.rotationY;

  const totalWidth = GATE.count * GATE.bayWidth + (GATE.count - 1) * GATE.pierWidth;
  const halfWidth = totalWidth / 2;

  /* ---- crest structure and abutment wings -------------------------------- */
  const structure = new BoxBuilder();
  structure.add(totalWidth + 20, 56, 30, [0, 116, -3], null);
  structure.add(totalWidth + 26, 4.4, 34, [0, 141.7, -3], null);
  structure.add(7, 62, 46, [-(halfWidth + 11), 113, 12], null);
  structure.add(7, 62, 46, [halfWidth + 11, 113, 12], null);
  const structureMesh = new THREE.Mesh(structure.build(), mats.concrete);
  structureMesh.name = 'HydroSpillwayCrest';
  structureMesh.castShadow = cfg.shadows;
  structureMesh.receiveShadow = true;
  group.add(structureMesh);

  // the sill the gates seal against, just above the reservoir level
  const sill = new THREE.Mesh(new THREE.BoxGeometry(totalWidth + 3, 2.6, 4.2), mats.wetConcrete);
  sill.position.set(0, GATE.sillY - 1.2, -2.4);
  sill.receiveShadow = true;
  group.add(sill);

  /* ---- piers, gate slots, operating deck --------------------------------- */
  const pierParts = new BoxBuilder();
  const pierTopY = 160.4;
  for (let i = 0; i <= GATE.count; i += 1) {
    const u = spillwayBayU(i) - (GATE.bayWidth + GATE.pierWidth) / 2;
    const height = pierTopY - GATE.sillY;
    pierParts.add(GATE.pierWidth, height, 27, [u, GATE.sillY + height / 2, -1], null);
    pierParts.cylinder(1.6, 1.6, height, [u, GATE.sillY + height / 2, -12.4], [Math.PI / 2, 0, 0], 10);
    // pier cap
    pierParts.add(GATE.pierWidth + 1.2, 1.1, 28, [u, pierTopY + 0.4, -1], null);
  }
  const pierMesh = new THREE.Mesh(pierParts.build(), mats.concreteTrim);
  pierMesh.name = 'HydroSpillwayPiers';
  pierMesh.castShadow = cfg.shadows;
  pierMesh.receiveShadow = true;
  group.add(pierMesh);

  // operating deck bridging the piers, with hoist frames over every bay
  const deckParts = new BoxBuilder();
  deckParts.add(totalWidth + GATE.pierWidth * 2 + 4, 1.0, 10, [0, pierTopY + 1.4, -2], null);
  for (let i = 0; i <= GATE.count; i += 1) {
    const u = spillwayBayU(i) - (GATE.bayWidth + GATE.pierWidth) / 2;
    deckParts.add(0.22, 1.3, 0.22, [u, pierTopY + 2.8, -6.6], null);
    deckParts.add(0.22, 1.3, 0.22, [u, pierTopY + 2.8, 2.6], null);
  }
  deckParts.add(totalWidth + 26, 0.18, 0.18, [0, pierTopY + 3.4, -6.6], null);
  deckParts.add(totalWidth + 26, 0.18, 0.18, [0, pierTopY + 3.4, 2.6], null);
  for (let i = 0; i < GATE.count; i += 1) {
    const u = spillwayBayU(i);
    deckParts.add(0.5, 7.2, 0.5, [u - 3.6, pierTopY + 5.4, -1], null);
    deckParts.add(0.5, 7.2, 0.5, [u + 3.6, pierTopY + 5.4, -1], null);
    deckParts.add(8.2, 0.6, 0.6, [u, pierTopY + 9.2, -1], null);
    deckParts.add(2.4, 1.8, 2.4, [u, pierTopY + 8.2, -1], null);
    deckParts.cylinder(0.12, 0.12, 5.4, [u, pierTopY + 4.0, -1], null, 6);
  }
  const deckMesh = new THREE.Mesh(deckParts.build(), mats.steelPaint);
  deckMesh.name = 'HydroSpillwayDeck';
  deckMesh.castShadow = cfg.shadows;
  group.add(deckMesh);

  /* ---- radial (Tainter) gates ------------------------------------------- */
  const gates = [];
  const gateGlow = [];
  for (let i = 0; i < GATE.count; i += 1) {
    const u = spillwayBayU(i);
    const gate = new THREE.Group();
    gate.name = `HydroRadialGate${i + 1}`;
    gate.position.set(u, GATE.trunnionY, GATE.trunnionV);

    const plate = new THREE.Mesh(
      makeCurvedPlate(GATE.bayWidth - 0.45, GATE.radius, -GATE.halfAngle, GATE.halfAngle, {
        segmentsU: 8,
        segmentsV: 14,
      }),
      mats.steel
    );
    plate.name = 'gateSkin';
    plate.castShadow = cfg.shadows;
    plate.receiveShadow = true;
    gate.add(plate);

    const ribParts = new BoxBuilder();
    for (let r = 0; r < 5; r += 1) {
      const a = lerp(-GATE.halfAngle + 0.09, GATE.halfAngle - 0.09, r / 4);
      const y = GATE.radius * Math.sin(a);
      const z = -GATE.radius * Math.cos(a);
      ribParts.add(GATE.bayWidth - 0.4, 0.34, 0.55, [0, y - 0.08, z + 0.35], [a, 0, 0]);
    }
    // vertical girders behind the skin plate
    for (const s of [-1, 1]) {
      ribParts.add(0.5, GATE.radius * 0.9, 1.6, [s * (GATE.bayWidth / 2 - 1.6), 0.4, 3.0], null);
    }
    // trunnion hub
    ribParts.cylinder(1.25, 1.25, GATE.bayWidth - 1.6, [0, 0, 0], [0, 0, Math.PI / 2], 12);
    // radial arms up to the skin plate
    for (const a of [-0.40, 0.03, 0.42]) {
      const y = GATE.radius * Math.sin(a) * 0.96;
      const z = -GATE.radius * Math.cos(a) * 0.96;
      ribParts.memberBetween([0, 0, 0], [-(GATE.bayWidth / 2 - 2.6), y, z], 0.6);
      ribParts.memberBetween([0, 0, 0], [GATE.bayWidth / 2 - 2.6, y, z], 0.6);
    }
    const ribs = new THREE.Mesh(ribParts.build(), mats.steelDark);
    ribs.name = 'gateRibs';
    ribs.castShadow = cfg.shadows;
    gate.add(ribs);

    // hazard stripe along the bottom lip
    const lip = new THREE.Mesh(new THREE.BoxGeometry(GATE.bayWidth - 0.4, 0.55, 0.18), mats.hazard);
    lip.position.set(0, GATE.radius * Math.sin(-GATE.halfAngle) + 0.1, -GATE.radius * Math.cos(-GATE.halfAngle) + 0.2);
    lip.rotation.x = -GATE.halfAngle;
    gate.add(lip);

    group.add(gate);
    const lipWorld = spillwayWorld(u, GATE.trunnionV - GATE.radius * Math.cos(-GATE.halfAngle));
    gateGlow.push({
      position: [lipWorld.x, GATE.trunnionY - GATE.radius * Math.sin(GATE.halfAngle) + 0.6, lipWorld.z],
      color: 0xff6a3a,
      size: 0.9,
      phase: i * 0.3,
    });
    gates.push(gate);
  }

  /* ---- ogee + stepped chute --------------------------------------------- */
  const chuteSurfaces = [];

  // smooth ogee from the sill down to the first step
  const ogeeColumns = 8;
  const ogeeRows = quality.rippleDetail ? 26 : 14;
  {
    const positions = [];
    const uvs = [];
    const indices = [];
    const vStart = 2;
    const vEnd = CHUTE_OGEE_END;
    for (let j = 0; j <= ogeeRows; j += 1) {
      const v = lerp(vStart, vEnd, j / ogeeRows);
      const width = chuteWidth(v);
      for (let i = 0; i <= ogeeColumns; i += 1) {
        const s = i / ogeeColumns;
        const u = (s - 0.5) * width;
        const crown = 0.5 * (1 - Math.pow((s - 0.5) * 2, 2));
        positions.push(u, chuteTopY(v) + crown, v);
        uvs.push(s * width * 0.06, v * 0.06);
      }
    }
    for (let j = 0; j < ogeeRows; j += 1) {
      for (let i = 0; i < ogeeColumns; i += 1) {
        const a = j * (ogeeColumns + 1) + i;
        const b = a + 1;
        const c = a + ogeeColumns + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    chuteSurfaces.push(geometry);
  }

  // stepped section: treads, risers and the solid mass that carries them
  const stepParts = [];
  const TREAD = CHUTE_TREAD;
  const stepStart = CHUTE_OGEE_END;
  const stepCount = Math.floor((SPILLWAY_BASIN_V - stepStart) / TREAD);
  for (let i = 0; i < stepCount; i += 1) {
    const v = stepStart + i * TREAD;
    const width = chuteWidth(v);
    const yTop = chuteTopY(v);
    const yNext = chuteTopY(v + TREAD);
    const drop = Math.max(0.4, yTop - yNext);

    const tread = new THREE.BoxGeometry(width + 2.6, 0.6, TREAD + 0.1);
    tread.translate(0, yTop - 0.3, v + TREAD / 2);
    stepParts.push(tread);

    const riser = new THREE.BoxGeometry(width + 2.6, drop + 0.7, 0.5);
    riser.translate(0, yTop - drop / 2 - 0.25, v + 0.12);
    stepParts.push(riser);

    // a slim underpinning slab: the rock carries the chute, the concrete
    // simply beds it in
    const slab = new THREE.BoxGeometry(width + 2.8, 2.6, TREAD + 0.08);
    slab.translate(0, yNext - 1.5, v + TREAD / 2);
    stepParts.push(slab);
  }
  const stepGeometry = mergeGeometries(stepParts.map((geometry) => ({ geometry })));
  for (const geometry of stepParts) geometry.dispose();
  chuteSurfaces.push(stepGeometry);

  // a shallow bedding slab under the ogee
  const ogeeMass = [];
  for (let i = 0; i < 8; i += 1) {
    const v = lerp(4, CHUTE_OGEE_END, (i + 0.5) / 8);
    const width = chuteWidth(v);
    const yTop = chuteTopY(v);
    const mass = new THREE.BoxGeometry(width + 2.8, 2.8, (CHUTE_OGEE_END - 4) / 8 + 0.2);
    mass.translate(0, yTop - 1.5, v);
    ogeeMass.push(mass);
  }
  chuteSurfaces.push(mergeGeometries(ogeeMass.map((geometry) => ({ geometry }))));
  for (const geometry of ogeeMass) geometry.dispose();

  const chuteMesh = new THREE.Mesh(mergeGeometries(chuteSurfaces.map((geometry) => ({ geometry }))), mats.wetConcrete);
  chuteMesh.name = 'HydroSpillwayChute';
  chuteMesh.castShadow = cfg.shadows;
  chuteMesh.receiveShadow = true;
  group.add(chuteMesh);
  for (const geometry of chuteSurfaces) geometry.dispose();

  /* ---- training walls ---------------------------------------------------- */
  const wallParts = [];
  const wallSegments = 40;
  for (const side of [-1, 1]) {
    for (let i = 0; i < wallSegments; i += 1) {
      const v0 = lerp(2, SPILLWAY_BASIN_V + 10, i / wallSegments);
      const v1 = lerp(2, SPILLWAY_BASIN_V + 10, (i + 1) / wallSegments);
      const vm = (v0 + v1) / 2;
      const width = chuteWidth(vm);
      const top = chuteTopY(vm) + (vm < 40 ? 4.2 : 1.15);
      const world = spillwayWorld(side * (width / 2 + 1.0), vm);
      const ground = terrainHeight(world.x, world.z, cfg.seed);
      const bottom = Math.min(ground - 1.0, chuteTopY(vm) - 8);
      const thickness = 2.4;
      const u = side * (width / 2 + thickness / 2);
      const wall = new THREE.BoxGeometry(thickness, top - bottom, v1 - v0 + 0.08);
      wall.translate(u, (top + bottom) / 2, vm);
      wallParts.push(wall);
      // coping stone
      const coping = new THREE.BoxGeometry(thickness + 0.5, 0.45, v1 - v0 + 0.1);
      coping.translate(u, top + 0.2, vm);
      wallParts.push(coping);
    }
  }
  const wallMesh = new THREE.Mesh(mergeGeometries(wallParts.map((geometry) => ({ geometry }))), mats.concrete);
  wallMesh.name = 'HydroChuteWalls';
  wallMesh.castShadow = cfg.shadows;
  wallMesh.receiveShadow = true;
  group.add(wallMesh);
  for (const geometry of wallParts) geometry.dispose();

  /* ---- stilling basin ---------------------------------------------------- */
  const basinParts = [];
  const basinWidth = chuteWidth(SPILLWAY_BASIN_V) + 26;
  const basinStart = SPILLWAY_BASIN_V - 8;
  const basinEnd = SPILLWAY_BASIN_V + 40;
  const basinFloor = new THREE.BoxGeometry(basinWidth, 3.0, basinEnd - basinStart);
  basinFloor.translate(0, 0.0, (basinStart + basinEnd) / 2);
  basinParts.push(basinFloor);
  const endSill = new THREE.BoxGeometry(basinWidth, 4.6, 3.2);
  endSill.translate(0, 2.0, basinEnd - 2.0);
  basinParts.push(endSill);
  for (let i = -3; i <= 3; i += 1) {
    const block = new THREE.BoxGeometry(3.4, 2.0, 2.4);
    block.translate(i * 7.6, 1.8, basinStart + 11);
    basinParts.push(block);
  }
  for (const side of [-1, 1]) {
    const wall = new THREE.BoxGeometry(2.6, 13, basinEnd - basinStart + 10);
    wall.translate(side * (basinWidth / 2 + 1.3), 5.0, (basinStart + basinEnd) / 2);
    basinParts.push(wall);
  }
  const basinMesh = new THREE.Mesh(mergeGeometries(basinParts.map((geometry) => ({ geometry }))), mats.wetConcrete);
  basinMesh.name = 'HydroStillingBasin';
  basinMesh.castShadow = cfg.shadows;
  basinMesh.receiveShadow = true;
  group.add(basinMesh);
  for (const geometry of basinParts) geometry.dispose();

  /* ---- stair down the right training wall -------------------------------- */
  const stairParts = [];
  const stairSide = 1;
  const stairSteps = 40;
  for (let i = 0; i < stairSteps; i += 1) {
    const v = lerp(20, SPILLWAY_BASIN_V, i / stairSteps);
    const width = chuteWidth(v);
    const u = stairSide * (width / 2 + 4.4);
    const y = chuteTopY(v) + 1.0;
    stairParts.push(tubeBetween([u, y - 2.4, v - 3.6], [u, y - 2.4, v + 3.6], 0.09, 5));
    stairParts.push(tubeBetween([u, y + 1.3, v - 3.6], [u, y + 1.3, v + 3.6], 0.09, 5));
    stairParts.push(tubeBetween([u, y - 2.4, v - 3.4], [u, y + 1.3, v - 3.4], 0.09, 5));
  }
  for (let i = 0; i < stairSteps * 3; i += 1) {
    const v = lerp(20, SPILLWAY_BASIN_V, i / (stairSteps * 3));
    const width = chuteWidth(v);
    const u = stairSide * (width / 2 + 4.4);
    const y = chuteTopY(v) + 0.9;
    const tread = new THREE.BoxGeometry(2.0, 0.16, 1.5);
    tread.translate(u, y, v);
    stairParts.push(tread);
  }
  const stairMesh = new THREE.Mesh(mergeGeometries(stairParts.map((geometry) => ({ geometry }))), mats.steelDark);
  stairMesh.name = 'HydroChuteStair';
  stairMesh.castShadow = cfg.shadows;
  group.add(stairMesh);
  for (const geometry of stairParts) geometry.dispose();

  /* ---- floodlights ------------------------------------------------------- */
  const lightParts = new BoxBuilder();
  const floodGlow = [];
  for (const v of [40, 84, 128, SPILLWAY_BASIN_V + 16]) {
    for (const side of [-1, 1]) {
      const width = chuteWidth(v);
      const u = side * (width / 2 + 7.0);
      const base = chuteTopY(v) + 5.6;
      lightParts.cylinder(0.2, 0.32, 9, [u, base + 4.0, v], null, 6);
      lightParts.add(1.9, 0.6, 1.1, [u, base + 8.8, v], [0, side > 0 ? -0.5 : 0.5, 0]);
      const world = spillwayWorld(u, v);
      floodGlow.push({ position: [world.x, base + 8.3, world.z], color: 0xfff0c8, size: 2.6, phase: v * 0.02 });
    }
  }
  const lightMesh = new THREE.Mesh(lightParts.build(), mats.steelDark);
  lightMesh.name = 'HydroSpillwayFloodPoles';
  lightMesh.castShadow = cfg.shadows;
  group.add(lightMesh);

  /* ---- water: chute sheet, plunge pool, mist, spray ---------------------- */
  const chuteWater = buildChuteWater({ ...ctx, spillwayGroup: group });
  const plungePool = buildPlungePool({ ...ctx, spillwayGroup: group });

  const basinWorld = spillwayWorld(0, SPILLWAY_BASIN_V + 10);
  const mistPoints = buildMistCloud(shared, uniforms, {
    name: 'HydroPlungeMist',
    count: Math.round(quality.mist * ctx.cfg.particleScale),
    center: [basinWorld.x, 4.0, basinWorld.z],
    radius: 46,
    spread: 1.3,
    height: 10,
    drift: 10,
    sizeRange: [4, 24],
    lifeRange: [4.5, 11],
    speed: 0.10,
    sizeScale: 1.0,
    opacity: 0.9,
    quality,
    seed: ctx.cfg.seed + 31,
  });
  group.add(mistPoints);

  const sprayPoints = buildMistCloud(shared, uniforms, {
    name: 'HydroGateSpray',
    count: Math.round(quality.spray * ctx.cfg.particleScale),
    center: [SPILLWAY.x, 148, SPILLWAY.z + 4],
    radius: 40,
    spread: 1.0,
    height: 22,
    drift: 8,
    sizeRange: [0.5, 2.4],
    lifeRange: [1.4, 3.6],
    speed: 0.24,
    sizeScale: 1.0,
    opacity: 0.5,
    quality,
    seed: ctx.cfg.seed + 47,
  });
  group.add(sprayPoints);

  // spray thrown off the steps all the way down the chute
  const chuteSprayWorld = spillwayWorld(0, 96);
  const chuteSpray = buildMistCloud(shared, uniforms, {
    name: 'HydroChuteSpray',
    count: Math.round(quality.spray * 0.6 * ctx.cfg.particleScale),
    center: [chuteSprayWorld.x, 40, chuteSprayWorld.z],
    radius: 22,
    spread: 0.85,
    height: 24,
    drift: 6,
    sizeRange: [0.6, 2.8],
    lifeRange: [1.6, 4.2],
    speed: 0.18,
    sizeScale: 1.0,
    opacity: 0.28,
    quality,
    seed: ctx.cfg.seed + 59,
  });
  group.add(chuteSpray);

  const glowPoints = buildGlowPoints(shared, gateGlow.concat(floodGlow), {
    name: 'HydroSpillwayGlow',
    sizeScale: 0.85,
    twinkle: 0.25,
    opacity: 0,
  });
  group.add(glowPoints);

  return {
    group,
    gates,
    chuteWater,
    plungePool,
    mistPoints,
    sprayPoints,
    chuteSpray,
    glowPoints,
    chuteMesh,
    basinMesh,
    totalWidth,
    halfWidth,
    spillwayWorld,
    basinWorld,
  };
}

/* ========================================================================== *
 *  Penstocks — three steel conduits with a cut-away flow window
 * ========================================================================== */

const PENSTOCK = {
  radius: 4.35,
  innerRadius: 3.75,
  cutStart: 0.46,
  cutEnd: 0.72,
  xs: [-152, -112, -72],
};

const PENSTOCK_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormalW;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const PENSTOCK_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFlow;
uniform float uOpacity;
uniform float uGlow;
uniform float uCavitation;
uniform vec3 uDeepColor;
uniform vec3 uFlowColor;
uniform vec3 uSparkColor;
uniform vec3 uSunColor;
uniform float uSunPower;
uniform int uOctaves;

varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormalW;

${GLSL_NOISE}
${GLSL_FOG}

void main() {
  float along = vUv.x;
  float around = vUv.y;

  // water screaming down the pipe: moving bands plus a spiral seam
  float band = fract(along * 9.0 - uTime * uFlow);
  float bandSoft = smoothstep(0.0, 0.35, band) * (1.0 - smoothstep(0.55, 1.0, band));
  float spiral = fract(along * 5.0 + around * 2.0 - uTime * uFlow * 0.9);
  float spiralSoft = smoothstep(0.0, 0.4, spiral) * (1.0 - smoothstep(0.6, 1.0, spiral));

  float n = fbm2d(vec2(around * 6.0, along * 22.0 - uTime * uFlow * 1.4), uOctaves);
  float bubbles = smoothstep(0.62, 0.95, n);
  float cavitation = bubbles * uCavitation;

  vec3 color = mix(uDeepColor, uFlowColor, clamp(bandSoft * 0.55 + spiralSoft * 0.4 + n * 0.35, 0.0, 1.0));
  color += uSparkColor * cavitation * (0.6 + 0.6 * uSunPower) * uGlow;
  color += uSparkColor * pow(max(dot(normalize(vNormalW), normalize(vec3(0.4, 0.7, 0.2))), 0.0), 24.0) * 0.08 * uSunPower;

  float edge = smoothstep(0.0, 0.08, around) * (1.0 - smoothstep(0.92, 1.0, around));
  vec3 outColor = applyFog(color, vWorld);

  gl_FragColor = vec4(outColor, uOpacity * mix(1.0, edge, 0.35));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function penstockCurve(x, seedOffset = 0) {
  const zc = crestZAtX(x);
  const points = [
    new THREE.Vector3(x, 122, zc - 5),
    new THREE.Vector3(x, 112, zc + 1),
    new THREE.Vector3(x, 92, zc + 12),
    new THREE.Vector3(x, 66, zc + 30),
    new THREE.Vector3(x, 44, zc + 46),
    new THREE.Vector3(x, 30, zc + 64),
    new THREE.Vector3(x, 25, zc + 78),
    new THREE.Vector3(x, 25.5, 100 + seedOffset),
    new THREE.Vector3(x, 26, 112 + seedOffset),
  ];
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35);
}

function buildPenstocks(ctx) {
  const { cfg, mats, shared, uniforms } = ctx;
  const group = new THREE.Group();
  group.name = 'HydroPenstocks';
  const flows = [];
  const supports = [];
  const rings = [];

  for (let i = 0; i < PENSTOCK.xs.length; i += 1) {
    const x = PENSTOCK.xs[i];
    const curve = penstockCurve(x, i * 1.5);

    // outer shell, split so the cut-away window stays open
    const shellMaterials = mats.steel;
    const pieces = [
      { t0: 0.0, t1: PENSTOCK.cutStart - 0.02 },
      { t0: PENSTOCK.cutEnd + 0.02, t1: 1.0 },
    ];
    for (const piece of pieces) {
      const sub = subCurve(curve, piece.t0, piece.t1, 64);
      const geometry = new THREE.TubeGeometry(sub, Math.max(40, Math.round((piece.t1 - piece.t0) * 140)), PENSTOCK.radius, 18, false);
      const mesh = new THREE.Mesh(geometry, shellMaterials);
      mesh.name = `HydroPenstock${i + 1}Shell`;
      mesh.castShadow = cfg.shadows;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // inner water column with the moving flow shader
    const innerGeometry = new THREE.TubeGeometry(curve, 180, PENSTOCK.innerRadius, 16, false);
    const flowMaterial = new THREE.ShaderMaterial({
      name: `HydroPenstockFlow${i + 1}`,
      uniforms: {
        uTime: shared.time,
        uFlow: { value: 1.15 },
        uOpacity: { value: 0.92 },
        uGlow: { value: 0.8 },
        uCavitation: { value: 0.45 },
        uDeepColor: { value: new THREE.Color(0x0b3d4a) },
        uFlowColor: { value: new THREE.Color(0x47c6d6) },
        uSparkColor: { value: new THREE.Color(0xd8fbff) },
        uSunColor: uniforms.sunColor,
        uSunPower: uniforms.sunPower,
        uOctaves: { value: cfg.qualitySettings.glslOctaves },
        uFogColor: uniforms.fogColor,
        uFogDensity: uniforms.fogDensity,
        uCameraPos: uniforms.cameraPos,
      },
      vertexShader: PENSTOCK_VERT,
      fragmentShader: PENSTOCK_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.Mesh(innerGeometry, flowMaterial);
    inner.name = `HydroPenstock${i + 1}Flow`;
    inner.renderOrder = 4;
    group.add(inner);
    flows.push(flowMaterial.uniforms);

    // cut rims and stiffener rings
    const ringParts = [];
    for (const t of [PENSTOCK.cutStart, PENSTOCK.cutEnd]) {
      const frameT = Math.min(0.999, Math.max(0.001, t));
      const point = curve.getPointAt(frameT);
      const tangent = curve.getTangentAt(frameT).normalize();
      const ring = new THREE.TorusGeometry(PENSTOCK.radius + 0.18, 0.34, 8, 26);
      ring.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent));
      ring.translate(point.x, point.y, point.z);
      ringParts.push(ring);
    }
    for (let r = 0; r <= 12; r += 1) {
      const t = r / 12;
      if (t > PENSTOCK.cutStart - 0.01 && t < PENSTOCK.cutEnd + 0.01) continue;
      const point = curve.getPointAt(Math.min(0.995, t));
      const tangent = curve.getTangentAt(Math.min(0.995, t)).normalize();
      const ring = new THREE.TorusGeometry(PENSTOCK.radius + 0.12, 0.2, 6, 22);
      ring.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent));
      ring.translate(point.x, point.y, point.z);
      ringParts.push(ring);
    }
    if (ringParts.length) {
      const ringsGeometry = mergeGeometries(ringParts.map((geometry) => ({ geometry })));
      for (const geometry of ringParts) geometry.dispose();
      const ringMesh = new THREE.Mesh(ringsGeometry, mats.steelDark);
      ringMesh.name = `HydroPenstock${i + 1}Rings`;
      ringMesh.castShadow = cfg.shadows;
      group.add(ringMesh);
    }

    // concrete anchors where the pipe leaves the dam and at the powerhouse wall
    for (const t of [0.08, 0.34, 0.6, 0.86]) {
      const point = curve.getPointAt(t);
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(14, 5.5, 9), mats.concreteDark);
      saddle.position.set(point.x, point.y - 3.4, point.z);
      saddle.rotation.x = -0.22;
      saddle.castShadow = cfg.shadows;
      saddle.receiveShadow = true;
      group.add(saddle);
      supports.push(saddle);
    }
  }

  // manifold / gallery header visible where the penstocks enter the hall
  const header = new THREE.Mesh(new THREE.BoxGeometry(104, 5.5, 7), mats.steelDark);
  header.position.set(-112, 26.5, 101);
  header.castShadow = cfg.shadows;
  group.add(header);

  return { group, flows, supports, rings };
}

/* ========================================================================== *
 *  Powerhouse, turbine hall and the sectioned Francis unit
 * ========================================================================== */

const HALL = {
  minX: -190,
  maxX: -18,
  minZ: 100,
  maxZ: 188,
  floorY: 6.5,
  ceilingY: 52,
  wallThickness: 1.6,
  units: [-152, -112, -72],
  unitZ: 136,
  heroX: -112,
  runnerY: 12.0,
  scrollY: 13.8,
  generatorY: 21.8,
};

const ENERGY_VERT = /* glsl */ `
attribute float aPhase;
attribute float aRadius;
attribute float aSpeed;
attribute float aHeight;
attribute float aSize;
attribute float aYaw;
uniform float uTime;
uniform float uPixelRatio;
uniform float uSizeScale;
uniform float uViewportHeight;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float t = fract(uTime * aSpeed * 0.11 + aPhase);
  float y = t * aHeight;
  float ang = aYaw + t * 12.566;
  vec3 p = position + vec3(cos(ang) * aRadius, y, sin(ang) * aRadius);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.001);
  float pixelsPerMetre = projectionMatrix[1][1] * uViewportHeight * 0.5;
  gl_PointSize = clamp(aSize * uSizeScale * uPixelRatio * pixelsPerMetre / dist, 1.0, 60.0);
  gl_Position = projectionMatrix * mv;
  vColor = mix(uColorA, uColorB, clamp(t * 1.2, 0.0, 1.0));
  vAlpha = sin(t * 3.14159) * uOpacity;
}
`;

const ENERGY_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q) * 2.0;
  if (r > 1.0) discard;
  float core = pow(1.0 - r, 2.0);
  gl_FragColor = vec4(vColor * (1.0 + core), core * vAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function buildEnergyStream(shared, options) {
  const count = options.count;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const radii = new Float32Array(count);
  const speeds = new Float32Array(count);
  const heights = new Float32Array(count);
  const sizes = new Float32Array(count);
  const yaws = new Float32Array(count);
  const random = mulberry32(options.seed || 3);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = options.center[0];
    positions[i * 3 + 1] = options.center[1];
    positions[i * 3 + 2] = options.center[2];
    phases[i] = random();
    radii[i] = lerp(options.radius[0], options.radius[1], random());
    speeds[i] = lerp(0.7, 1.6, random());
    heights[i] = lerp(options.height[0], options.height[1], random());
    sizes[i] = lerp(0.35, 1.1, Math.pow(random(), 1.5));
    yaws[i] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aYaw', new THREE.BufferAttribute(yaws, 1));
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius += heightSafe(options.height) + 6;

  const material = new THREE.ShaderMaterial({
    name: options.name || 'HydroEnergy',
    uniforms: {
      uTime: shared.time,
      uPixelRatio: shared.pixelRatio,
      uSizeScale: { value: options.sizeScale == null ? 1 : options.sizeScale },
      uViewportHeight: shared.viewportHeight,
      uOpacity: { value: options.opacity == null ? 1 : options.opacity },
      uColorA: { value: new THREE.Color(options.colorA || 0x37e0ff) },
      uColorB: { value: new THREE.Color(options.colorB || 0xfff0b0) },
    },
    vertexShader: ENERGY_VERT,
    fragmentShader: ENERGY_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
  });

  const points = new THREE.Points(geometry, material);
  points.name = options.name || 'HydroEnergy';
  points.frustumCulled = false;
  points.renderOrder = 9;
  points.userData.uniforms = material.uniforms;
  return points;
}

function heightSafe(range) {
  return Array.isArray(range) ? range[1] : 10;
}

/* -------------------------------------------------------------------------- */
/*  Francis runner, scroll case, generator                                    */
/* -------------------------------------------------------------------------- */

/** One twisted runner blade as a thin double-sided sheet. */
function makeRunnerBlade(bladeRadius, hubRadius, bladeHeight) {
  const radialSteps = 14;
  const spanSteps = 8;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= radialSteps; i += 1) {
    const u = i / radialSteps;
    const r = lerp(hubRadius, bladeRadius, Math.pow(u, 0.92));
    const wrap = u * 1.15;
    const crown = Math.sin(u * Math.PI) * 0.55;
    for (let j = 0; j <= spanSteps; j += 1) {
      const s = j / spanSteps;
      const y = lerp(-bladeHeight * 0.5, bladeHeight * 0.5, s) + crown;
      const twist = (1 - s) * 0.28 * u;
      const x = Math.cos(wrap + twist) * r;
      const z = Math.sin(wrap + twist) * r;
      positions.push(x, y, z);
      uvs.push(u, s);
    }
  }
  for (let i = 0; i < radialSteps; i += 1) {
    for (let j = 0; j < spanSteps; j += 1) {
      const a = i * (spanSteps + 1) + j;
      const b = a + 1;
      const c = a + spanSteps + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildRunner(bladeCount = 13) {
  const runner = new THREE.Group();
  runner.name = 'HydroRunner';

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.65, 2.8, 20), matsHolder.blade);
  hub.name = 'runnerHub';
  hub.castShadow = true;
  runner.add(hub);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.65, 1.5, 20), matsHolder.blade);
  nose.position.y = -2.1;
  nose.rotation.x = Math.PI;
  runner.add(nose);

  const bladeGeometry = makeRunnerBlade(5.6, 1.85, 2.4);
  const blades = [];
  for (let i = 0; i < bladeCount; i += 1) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const matrix = new THREE.Matrix4().makeRotationY(angle);
    blades.push({ geometry: bladeGeometry.clone().applyMatrix4(matrix) });
  }
  const merged = mergeGeometries(blades);
  for (const item of blades) item.geometry.dispose();
  bladeGeometry.dispose();

  const bladeMesh = new THREE.Mesh(merged, matsHolder.blade);
  bladeMesh.name = 'runnerBlades';
  bladeMesh.castShadow = true;
  runner.add(bladeMesh);

  const crown = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.36, 8, 26), matsHolder.bronze);
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 1.15;
  runner.add(crown);
  const band = new THREE.Mesh(new THREE.TorusGeometry(5.55, 0.24, 8, 32), matsHolder.bronze);
  band.rotation.x = Math.PI / 2;
  band.position.y = -0.95;
  runner.add(band);

  return runner;
}

// The runner builder is used inside createHydroWorld where materials exist;
// this holder keeps the function signatures tidy without threading mats through.
let matsHolder = {};

function buildScrollCase() {
  const scroll = new THREE.Group();
  scroll.name = 'HydroScrollCase';

  // spiral of decreasing cross-section, wrapped 1.75 times around the runner
  const points = [];
  const turns = 2.05;
  const segments = 90;
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * turns - Math.PI * 0.35;
    const r = lerp(8.4, 4.6, Math.pow(t, 0.9));
    points.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
  }
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const radiusSegments = 26;
  const tubular = 150;
  const positions = [];
  const indices = [];
  const uvs = [];
  for (let i = 0; i <= tubular; i += 1) {
    const t = i / tubular;
    const centre = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const radius = lerp(1.5, 0.8, Math.pow(t, 0.8));
    for (let j = 0; j <= radiusSegments; j += 1) {
      const a = (j / radiusSegments) * Math.PI * 2;
      const nx = Math.cos(a) * side.x;
      const nz = Math.cos(a) * side.z;
      const ny = Math.sin(a);
      positions.push(
        centre.x + nx * radius,
        centre.y + ny * radius,
        centre.z + nz * radius
      );
      uvs.push(t * 6, j / radiusSegments);
    }
    void up;
  }
  for (let i = 0; i < tubular; i += 1) {
    for (let j = 0; j < radiusSegments; j += 1) {
      const a = i * (radiusSegments + 1) + j;
      const b = a + 1;
      const c = a + radiusSegments + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, matsHolder.innerSteel);
  mesh.name = 'HydroScrollCaseMesh';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scroll.add(mesh);

  // stay ring / stay vanes feeding the runner
  const vaneParts = [];
  const vaneCount = 14;
  for (let i = 0; i < vaneCount; i += 1) {
    const angle = (i / vaneCount) * Math.PI * 2;
    const vane = new THREE.BoxGeometry(0.3, 2.1, 2.6);
    vane.translate(0, 0, 6.6);
    vane.applyMatrix4(new THREE.Matrix4().makeRotationY(angle));
    vaneParts.push(vane);
  }
  const stayGeometry = mergeGeometries(vaneParts.map((geometry) => ({ geometry })));
  for (const geometry of vaneParts) geometry.dispose();
  const stay = new THREE.Mesh(stayGeometry, matsHolder.steelDark);
  stay.name = 'HydroStayVanes';
  scroll.add(stay);

  // guide vanes (the distributor), slightly rotated
  const guideParts = [];
  const guideCount = 16;
  for (let i = 0; i < guideCount; i += 1) {
    const angle = (i / guideCount) * Math.PI * 2;
    const vane = new THREE.BoxGeometry(0.22, 1.8, 1.8);
    vane.translate(0, 0, 5.6);
    vane.applyMatrix4(new THREE.Matrix4().makeRotationY(angle + 0.32));
    guideParts.push(vane);
  }
  const guideGeometry = mergeGeometries(guideParts.map((geometry) => ({ geometry })));
  for (const geometry of guideParts) geometry.dispose();
  const guides = new THREE.Mesh(guideGeometry, matsHolder.bronze);
  guides.name = 'HydroGuideVanes';
  scroll.add(guides);

  return { group: scroll, mesh, curve, stay, guides };
}

function buildGenerator() {
  const generator = new THREE.Group();
  generator.name = 'HydroGenerator';

  // shaft down to the runner
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 12, 16), matsHolder.steel);
  shaft.position.y = -5.5;
  shaft.castShadow = true;
  generator.add(shaft);

  // rotor spider + rim
  const rotor = new THREE.Group();
  rotor.name = 'HydroRotor';
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 1.7, 36, 1, false), matsHolder.steelDark);
  rotor.add(rim);
  const spiderParts = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const arm = new THREE.BoxGeometry(3.1, 0.8, 0.7);
    arm.translate(0, 0, 2.3);
    arm.applyMatrix4(new THREE.Matrix4().makeRotationY(angle));
    spiderParts.push(arm);
  }
  const spiderGeometry = mergeGeometries(spiderParts.map((geometry) => ({ geometry })));
  for (const geometry of spiderParts) geometry.dispose();
  rotor.add(new THREE.Mesh(spiderGeometry, matsHolder.steelDark));

  // 12 salient poles around the rim
  const poleParts = [];
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const pole = new THREE.BoxGeometry(0.85, 2.0, 1.15);
    pole.translate(0, 0, 4.85);
    pole.applyMatrix4(new THREE.Matrix4().makeRotationY(angle));
    poleParts.push(pole);
  }
  const poleGeometry = mergeGeometries(poleParts.map((geometry) => ({ geometry })));
  for (const geometry of poleParts) geometry.dispose();
  const poles = new THREE.Mesh(poleGeometry, matsHolder.copper);
  poles.name = 'HydroRotorPoles';
  rotor.add(poles);
  generator.add(rotor);

  // stator: laminated core and glowing windings
  const core = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 2.6, 40, 1, true), matsHolder.steelDark);
  core.position.y = 0.3;
  core.material = matsHolder.steelDark;
  core.material.side = THREE.DoubleSide;
  generator.add(core);

  const coilParts = [];
  for (let i = 0; i < 30; i += 1) {
    const angle = (i / 30) * Math.PI * 2;
    const coil = new THREE.BoxGeometry(0.4, 2.3, 1.0);
    coil.translate(0, 0, 6.15);
    coil.applyMatrix4(new THREE.Matrix4().makeRotationY(angle));
    coilParts.push(coil);
  }
  const coilGeometry = mergeGeometries(coilParts.map((geometry) => ({ geometry })));
  for (const geometry of coilParts) geometry.dispose();
  const coils = new THREE.Mesh(coilGeometry, matsHolder.copperHot);
  coils.name = 'HydroStatorWindings';
  generator.add(coils);

  // upper bracket and thrust bearing
  const bracketParts = new BoxBuilder();
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    bracketParts.memberBetween([Math.cos(angle) * 1.2, 5.2, Math.sin(angle) * 1.2], [Math.cos(angle) * 6.2, 5.2, Math.sin(angle) * 6.2], 0.55);
  }
  bracketParts.cylinder(3.4, 3.4, 0.6, [0, 5.2, 0], null, 24);
  bracketParts.cylinder(2.4, 2.7, 1.8, [0, 6.2, 0], null, 20);
  const bracket = new THREE.Mesh(bracketParts.build(), matsHolder.steelDark);
  bracket.name = 'HydroThrustBracket';
  generator.add(bracket);

  // sectioned housing: a cylinder with a wedge removed toward the camera
  const housingOpen = new THREE.Mesh(
    new THREE.CylinderGeometry(7.1, 7.1, 11, 40, 1, true, 1.35, Math.PI * 2 - 1.55),
    matsHolder.steel.clone()
  );
  housingOpen.name = 'HydroGeneratorHousingOpen';
  housingOpen.position.y = 0.8;
  housingOpen.material.side = THREE.DoubleSide;
  housingOpen.material.transparent = true;
  housingOpen.material.opacity = 0.34;
  generator.add(housingOpen);

  const housingCover = new THREE.Mesh(
    new THREE.CylinderGeometry(7.15, 7.15, 11, 20, 1, true, -0.2, 1.55),
    matsHolder.steel.clone()
  );
  housingCover.name = 'HydroGeneratorHousingCover';
  housingCover.position.y = 0.8;
  housingCover.material.side = THREE.DoubleSide;
  housingCover.material.transparent = true;
  housingCover.material.opacity = 1;
  generator.add(housingCover);

  // top enclosure and cooler ring
  const capParts = new BoxBuilder();
  capParts.cylinder(6.6, 6.6, 0.7, [0, 6.9, 0], null, 32);
  capParts.cylinder(3.0, 3.0, 1.0, [0, 7.6, 0], null, 24);
  const cap = new THREE.Mesh(capParts.build(), matsHolder.steelBlue);
  generator.add(cap);

  const coolerParts = new BoxBuilder();
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    coolerParts.add(1.7, 1.9, 0.8, [Math.cos(angle) * 6.6, 4.6, Math.sin(angle) * 6.6], [0, -angle, 0]);
  }
  const coolers = new THREE.Mesh(coolerParts.build(), matsHolder.steelBlue);
  generator.add(coolers);

  return { group: generator, rotor, housingOpen, housingCover, coils, shaft };
}

/* -------------------------------------------------------------------------- */
/*  One turbine-generator unit                                               */
/* -------------------------------------------------------------------------- */

function buildTurbineUnit(ctx, x, detailed, index) {
  const { mats, cfg } = ctx;
  matsHolder = mats;
  const unit = new THREE.Group();
  unit.name = `HydroUnit${index + 1}`;
  unit.position.set(x, 0, HALL.unitZ);

  const concreteRing = new THREE.Mesh(
    new THREE.CylinderGeometry(9.4, 10.3, 6.4, 34, 1, true),
    mats.concrete
  );
  concreteRing.material = mats.concrete;
  concreteRing.position.y = HALL.floorY + 2.9;
  concreteRing.name = 'unitPitWall';
  unit.add(concreteRing);

  // pit floor ring
  const pitFloor = new THREE.Mesh(new THREE.CylinderGeometry(10.4, 10.4, 0.8, 34), mats.hallFloor);
  pitFloor.position.y = HALL.floorY + 0.4;
  unit.add(pitFloor);

  // draft tube: expanding cone into an elbow
  const draftPoints = [
    new THREE.Vector3(0, HALL.runnerY - 1.2, 0),
    new THREE.Vector3(0, 8.2, 0),
    new THREE.Vector3(0, 5.6, 1.6),
    new THREE.Vector3(0, 4.6, 7),
    new THREE.Vector3(0, 4.2, 24),
  ];
  const draftCurve = new THREE.CatmullRomCurve3(draftPoints, false, 'catmullrom', 0.4);
  const draftGeometry = new THREE.TubeGeometry(draftCurve, 40, 4.6, 22, false);
  // taper the tube by scaling radii along its length
  const draftPosition = draftGeometry.getAttribute('position');
  const draftUv = draftGeometry.getAttribute('uv');
  for (let i = 0; i < draftPosition.count; i += 1) {
    const t = draftUv.getX(i);
    const centre = draftCurve.getPoint(Math.min(0.999, t));
    const scale = lerp(1.0, 0.62, t);
    draftPosition.setXYZ(
      i,
      centre.x + (draftPosition.getX(i) - centre.x) * scale,
      centre.y + (draftPosition.getY(i) - centre.y) * scale,
      centre.z + (draftPosition.getZ(i) - centre.z) * scale
    );
  }
  draftGeometry.computeVertexNormals();
  const draft = new THREE.Mesh(draftGeometry, mats.wetConcrete);
  draft.material = mats.wetConcrete;
  draft.name = 'draftTube';
  draft.material.side = THREE.DoubleSide;
  unit.add(draft);

  // runner
  const runner = buildRunner(13);
  runner.position.y = HALL.runnerY;
  unit.add(runner);

  // scroll case
  const scroll = buildScrollCase();
  scroll.group.position.y = HALL.scrollY;
  unit.add(scroll.group);

  // head cover over the runner
  const headCover = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 6.4, 1.8, 30, 1, true), mats.steelDark);
  headCover.position.y = HALL.runnerY + 2.0;
  headCover.material = mats.steelDark;
  headCover.material.side = THREE.DoubleSide;
  unit.add(headCover);

  // generator
  const generator = buildGenerator();
  generator.group.position.y = HALL.generatorY;
  unit.add(generator.group);

  // casing: the big cone that a real unit is buried in — sectioned on the
  // camera side so the machine reads as a cutaway model
  const casingOpen = new THREE.Mesh(
    new THREE.CylinderGeometry(5.0, 10.4, 11, 40, 1, true, 1.45, Math.PI * 2 - 1.65),
    mats.concreteTrim.clone()
  );
  casingOpen.material.side = THREE.DoubleSide;
  casingOpen.material.transparent = true;
  casingOpen.material.opacity = 0.16;
  casingOpen.position.y = HALL.scrollY + 0.2;
  casingOpen.name = 'unitCasingOpen';
  casingOpen.visible = false;
  unit.add(casingOpen);

  const casingCover = new THREE.Mesh(
    new THREE.CylinderGeometry(5.05, 10.45, 11.05, 22, 1, true, -0.2, 1.65),
    mats.concreteTrim.clone()
  );
  casingCover.material.side = THREE.DoubleSide;
  casingCover.material.transparent = true;
  casingCover.material.opacity = 1;
  casingCover.position.y = HALL.scrollY + 0.2;
  casingCover.name = 'unitCasingCover';
  casingCover.visible = false;
  unit.add(casingCover);

  // the pit railing around the unit
  const railParts = new BoxBuilder();
  const railSegments = 18;
  for (let i = 0; i < railSegments; i += 1) {
    const angle = (i / railSegments) * Math.PI * 2;
    const px = Math.cos(angle) * 11.2;
    const pz = Math.sin(angle) * 11.2;
    if (detailed && pz > 3 && px > -11) continue; // leave the viewing side open
    railParts.add(0.08, 1.1, 0.08, [px, HALL.floorY + 1.15, pz], null);
  }
  const railGeometry = railParts.build();
  const railing = new THREE.Mesh(railGeometry, mats.paintYellow);
  railing.name = 'unitRailing';
  unit.add(railing);

  // rotating ring rail on top of the railing
  const topRail = new THREE.Mesh(new THREE.TorusGeometry(11.2, 0.06, 6, 48), mats.paintYellow);
  topRail.rotation.x = Math.PI / 2;
  topRail.position.y = HALL.floorY + 1.7;
  unit.add(topRail);

  // energy particles rising through the shaft, only for the hero unit
  let energy = null;
  if (detailed) {
    energy = buildEnergyStream(ctx.shared, {
      name: 'HydroShaftEnergy',
      count: Math.round(420 * cfg.particleScale),
      center: [0, HALL.runnerY + 2.0, 0],
      radius: [1.0, 2.4],
      height: [4, 13],
      sizeScale: 1.0,
      opacity: 0.9,
      colorA: 0x3fe4ff,
      colorB: 0xffe9a8,
      seed: cfg.seed + 71,
    });
    unit.add(energy);
  }

  return {
    group: unit,
    runner,
    generator,
    scroll,
    casingOpen,
    casingCover,
    housingOpen: generator.housingOpen,
    housingCover: generator.housingCover,
    energy,
    headCover,
  };
}

/* -------------------------------------------------------------------------- */
/*  Powerhouse building                                                       */
/* -------------------------------------------------------------------------- */

function buildPowerhouse(ctx) {
  const { cfg, mats, shared, uniforms } = ctx;
  const quality = cfg.qualitySettings;
  const group = new THREE.Group();
  group.name = 'HydroPowerhouse';

  const width = HALL.maxX - HALL.minX;
  const depth = HALL.maxZ - HALL.minZ;
  const centreX = (HALL.minX + HALL.maxX) / 2;
  const centreZ = (HALL.minZ + HALL.maxZ) / 2;
  const wallHeight = HALL.ceilingY - HALL.floorY;

  /* ---- slabs and walls --------------------------------------------------- */
  const wallParts = [];
  const slab = new THREE.BoxGeometry(width + 4, 1.4, depth + 4);
  slab.translate(centreX, HALL.floorY - 0.7, centreZ);
  wallParts.push(slab);

  // side walls
  for (const x of [HALL.minX, HALL.maxX]) {
    const wall = new THREE.BoxGeometry(HALL.wallThickness, wallHeight, depth + 3);
    wall.translate(x, HALL.floorY + wallHeight / 2, centreZ);
    wallParts.push(wall);
  }

  // upstream wall, cut into segments so the penstocks can pass through
  const openingR = 5.4;
  let cursor = HALL.minX;
  for (const x of HALL.units) {
    const segmentWidth = x - openingR - cursor;
    if (segmentWidth > 0.5) {
      const segment = new THREE.BoxGeometry(segmentWidth, wallHeight, HALL.wallThickness);
      segment.translate(cursor + segmentWidth / 2, HALL.floorY + wallHeight / 2, HALL.minZ);
      wallParts.push(segment);
    }
    // spandrel above and below the penstock throat
    const above = new THREE.BoxGeometry(openingR * 2 + 0.4, wallHeight - 18, HALL.wallThickness);
    above.translate(x, HALL.floorY + 18 + (wallHeight - 18) / 2, HALL.minZ);
    wallParts.push(above);
    const below = new THREE.BoxGeometry(openingR * 2 + 0.4, 9, HALL.wallThickness);
    below.translate(x, HALL.floorY + 4.5, HALL.minZ);
    wallParts.push(below);
    cursor = x + openingR;
  }
  const tail = HALL.maxX - cursor;
  if (tail > 0.5) {
    const segment = new THREE.BoxGeometry(tail, wallHeight, HALL.wallThickness);
    segment.translate(cursor + tail / 2, HALL.floorY + wallHeight / 2, HALL.minZ);
    wallParts.push(segment);
  }

  // downstream wall with big window openings
  const windowWidth = 34;
  const windowHeight = 17;
  const windowY = HALL.floorY + 24;
  const windowCentres = [-152, -112, -72];
  cursor = HALL.minX;
  for (const x of windowCentres) {
    const segmentWidth = x - windowWidth / 2 - cursor;
    if (segmentWidth > 0.5) {
      const segment = new THREE.BoxGeometry(segmentWidth, wallHeight, HALL.wallThickness);
      segment.translate(cursor + segmentWidth / 2, HALL.floorY + wallHeight / 2, HALL.maxZ);
      wallParts.push(segment);
    }
    const sillHeight = windowY - windowHeight / 2 - HALL.floorY;
    const sill = new THREE.BoxGeometry(windowWidth, sillHeight, HALL.wallThickness);
    sill.translate(x, HALL.floorY + sillHeight / 2, HALL.maxZ);
    wallParts.push(sill);
    const headHeight = HALL.ceilingY - (windowY + windowHeight / 2);
    if (headHeight > 0.3) {
      const head = new THREE.BoxGeometry(windowWidth, headHeight, HALL.wallThickness);
      head.translate(x, windowY + windowHeight / 2 + headHeight / 2, HALL.maxZ);
      wallParts.push(head);
    }
    cursor = x + windowWidth / 2;
  }
  const endFill = HALL.maxX - cursor;
  if (endFill > 0.5) {
    const segment = new THREE.BoxGeometry(endFill, wallHeight, HALL.wallThickness);
    segment.translate(cursor + endFill / 2, HALL.floorY + wallHeight / 2, HALL.maxZ);
    wallParts.push(segment);
  }

  const shell = new THREE.Mesh(mergeGeometries(wallParts.map((geometry) => ({ geometry }))), mats.hallWall);
  shell.name = 'HydroPowerhouseShell';
  shell.castShadow = cfg.shadows;
  shell.receiveShadow = true;
  for (const geometry of wallParts) geometry.dispose();
  group.add(shell);

  /* ---- window walls ------------------------------------------------------ */
  const windowParts = [];
  for (const x of windowCentres) {
    const panel = new THREE.BoxGeometry(windowWidth - 0.6, windowHeight, 0.35);
    scaleUVs(panel, 2.2, 0.95);
    panel.translate(x, windowY, HALL.maxZ + 0.1);
    windowParts.push(panel);
  }
  // clerestory band on the upstream wall
  const clerestory = new THREE.BoxGeometry(width - 8, 6.5, 0.35);
  scaleUVs(clerestory, 9.0, 0.34);
  clerestory.translate(centreX, HALL.ceilingY - 6, HALL.minZ - 0.1);
  windowParts.push(clerestory);
  for (const x of [HALL.minX - 0.1, HALL.maxX + 0.1]) {
    const side = new THREE.BoxGeometry(0.35, 7, 30);
    scaleUVs(side, 2.4, 0.36);
    side.translate(x, HALL.floorY + 30, centreZ + 12);
    windowParts.push(side);
  }
  const windows = new THREE.Mesh(mergeGeometries(windowParts.map((geometry) => ({ geometry }))), mats.windowWall);
  windows.name = 'HydroHallWindows';
  for (const geometry of windowParts) geometry.dispose();
  group.add(windows);

  /* ---- exterior pilasters and roof --------------------------------------- */
  const pilasterParts = new BoxBuilder();
  for (let i = 0; i <= 10; i += 1) {
    const x = lerp(HALL.minX - 2, HALL.maxX + 2, i / 10);
    pilasterParts.add(1.6, wallHeight + 1.5, 2.0, [x, HALL.floorY + (wallHeight + 1.5) / 2, HALL.maxZ + 1.2], null);
    pilasterParts.add(1.6, wallHeight + 1.5, 2.0, [x, HALL.floorY + (wallHeight + 1.5) / 2, HALL.minZ - 1.2], null);
  }
  pilasterParts.add(width + 6, 1.2, depth + 6, [centreX, HALL.ceilingY + 0.2, centreZ], null);
  const pilasters = new THREE.Mesh(pilasterParts.build(), mats.concreteTrim);
  pilasters.name = 'HydroPowerhousePilasters';
  pilasters.castShadow = cfg.shadows;
  group.add(pilasters);

  // sawtooth roof with north-light glazing
  const roofParts = [];
  const glassParts = [];
  const teeth = 5;
  const toothWidth = (width + 4) / teeth;
  for (let i = 0; i < teeth; i += 1) {
    const x = HALL.minX - 2 + toothWidth * (i + 0.5);
    const slope = new THREE.BoxGeometry(toothWidth + 0.4, 0.6, depth + 6);
    slope.translate(0, 4.4, 0);
    slope.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.30));
    slope.translate(x, HALL.ceilingY + 2.4, centreZ);
    roofParts.push(slope);

    const riser = new THREE.BoxGeometry(0.5, 4.6, depth + 6);
    riser.translate(x + toothWidth * 0.42, HALL.ceilingY + 4.2, centreZ);
    roofParts.push(riser);

    const glass = new THREE.BoxGeometry(toothWidth * 0.8, 3.2, 0.3);
    glass.translate(x + toothWidth * 0.42, HALL.ceilingY + 4.6, centreZ + 0.2);
    glassParts.push(glass);
  }
  const roof = new THREE.Mesh(mergeGeometries(roofParts.map((geometry) => ({ geometry }))), mats.concreteTrim);
  roof.name = 'HydroPowerhouseRoof';
  roof.castShadow = cfg.shadows;
  roof.receiveShadow = true;
  group.add(roof);
  for (const geometry of roofParts) geometry.dispose();
  if (glassParts.length) {
    const glazing = new THREE.Mesh(mergeGeometries(glassParts.map((geometry) => ({ geometry }))), mats.windowWall);
    glazing.name = 'HydroRoofGlazing';
    group.add(glazing);
    for (const geometry of glassParts) geometry.dispose();
  }

  /* ---- roof gantry cranes ------------------------------------------------ */
  const craneParts = new BoxBuilder();
  for (const side of [-1, 1]) {
    craneParts.add(width + 4, 0.55, 0.9, [centreX, HALL.ceilingY + 7.4, centreZ + side * (depth / 2 + 1)], null);
  }
  for (const gx of [-150, -104, -58]) {
    craneParts.add(3.2, 2.2, depth + 3, [gx, HALL.ceilingY + 8.6, centreZ], null);
    craneParts.add(2.2, 1.6, 3.4, [gx, HALL.ceilingY + 10.2, centreZ], null);
    craneParts.add(0.14, 5.0, 0.14, [gx, HALL.ceilingY + 6.4, centreZ], null);
  }
  const cranes = new THREE.Mesh(craneParts.build(), mats.steelPaint);
  cranes.name = 'HydroRoofCranes';
  cranes.castShadow = cfg.shadows;
  group.add(cranes);

  /* ---- stilling / draft tube outlet block -------------------------------- */
  const outletParts = new BoxBuilder();
  outletParts.add(width + 12, 8, 13, [centreX, 2.6, HALL.maxZ + 6], null);
  for (const x of HALL.units) {
    outletParts.add(9.6, 6.2, 1.2, [x, 3.4, HALL.maxZ + 12.8], null);
  }
  const outlets = new THREE.Mesh(outletParts.build(), mats.wetConcrete);
  outlets.name = 'HydroDraftTubeOutlets';
  outlets.castShadow = cfg.shadows;
  group.add(outlets);

  // trash racks over the outlets
  const rackParts = new BoxBuilder();
  for (const x of HALL.units) {
    for (let i = 0; i < 9; i += 1) {
      rackParts.add(0.24, 5.6, 0.3, [x - 4 + i * 1.0, 3.4, HALL.maxZ + 13.4], null);
    }
  }
  const outletRacks = new THREE.Mesh(rackParts.build(), mats.steelDark);
  outletRacks.name = 'HydroOutletRacks';
  group.add(outletRacks);

  /* ---- interior fit-out -------------------------------------------------- */
  const interior = new THREE.Group();
  interior.name = 'HydroHallInterior';

  // safety lines painted on the floor
  const lineParts = new BoxBuilder();
  for (let i = 0; i < 3; i += 1) {
    lineParts.add(width - 16, 0.05, 0.5, [centreX, HALL.floorY + 0.03, HALL.minZ + 16 + i * 22], null);
  }
  lineParts.add(width - 16, 0.05, 0.6, [centreX, HALL.floorY + 0.03, HALL.minZ + 8], null);
  // crane rails along the walls
  for (const side of [-1, 1]) {
    lineParts.add(width - 6, 0.5, 0.7, [centreX, HALL.ceilingY - 4.4, centreZ + side * 26], null);
    lineParts.add(width - 6, 0.3, 0.4, [centreX, HALL.ceilingY - 4.9, centreZ + side * 26], null);
  }
  const floorLines = new THREE.Mesh(lineParts.build(), mats.paintYellow);
  interior.add(floorLines);

  // transverse roof trusses
  const trussParts = new BoxBuilder();
  for (let i = 0; i <= 8; i += 1) {
    const x = lerp(HALL.minX + 6, HALL.maxX - 6, i / 8);
    const z0 = HALL.minZ + 3;
    const z1 = HALL.maxZ - 3;
    trussParts.memberBetween([x, HALL.ceilingY - 0.6, z0], [x, HALL.ceilingY - 0.6, z1], 0.5);
    trussParts.memberBetween([x, HALL.ceilingY - 3.4, z0], [x, HALL.ceilingY - 3.4, z1], 0.35);
    for (let s = 0; s < 8; s += 1) {
      const za = lerp(z0, z1, s / 8);
      const zb = lerp(z0, z1, (s + 1) / 8);
      trussParts.memberBetween([x, HALL.ceilingY - 0.7, za], [x, HALL.ceilingY - 3.4, zb], 0.2);
      trussParts.memberBetween([x, HALL.ceilingY - 3.4, za], [x, HALL.ceilingY - 0.7, zb], 0.2);
    }
  }
  const trusses = new THREE.Mesh(trussParts.build(), mats.steelDark);
  trusses.name = 'HydroHallTrusses';
  interior.add(trusses);

  // the bridge crane inside the hall
  const bridgeParts = new BoxBuilder();
  const bridgeX = -104;
  bridgeParts.add(4.2, 2.6, depth - 6, [bridgeX, HALL.ceilingY - 7.2, centreZ], null);
  bridgeParts.add(1.2, 1.2, depth - 8, [bridgeX - 1.6, HALL.ceilingY - 8.6, centreZ], null);
  bridgeParts.add(3.0, 2.0, 2.6, [bridgeX, HALL.ceilingY - 8.2, centreZ + 6], null);
  bridgeParts.add(0.16, 9, 0.16, [bridgeX, HALL.ceilingY - 13.6, centreZ + 9], null);
  bridgeParts.add(1.6, 0.9, 1.2, [bridgeX, HALL.ceilingY - 18.2, centreZ + 9], null);
  for (const side of [-1, 1]) {
    bridgeParts.add(6.4, 1.0, 1.0, [bridgeX, HALL.ceilingY - 6.8, centreZ + side * (depth / 2 - 4)], null);
  }
  const bridgeCrane = new THREE.Mesh(bridgeParts.build(), mats.steelPaint);
  bridgeCrane.name = 'HydroHallCrane';
  bridgeCrane.castShadow = cfg.shadows;
  interior.add(bridgeCrane);

  // ceiling light strips
  const lightParts = new BoxBuilder();
  for (let i = 0; i < 6; i += 1) {
    const x = lerp(HALL.minX + 16, HALL.maxX - 16, i / 5);
    lightParts.add(2.2, 0.24, 26, [x, HALL.ceilingY - 4.9, centreZ + 2], null);
  }
  const lightMesh = new THREE.Mesh(lightParts.build(), mats.lampGlass);
  lightMesh.name = 'HydroHallLightStrips';
  interior.add(lightMesh);

  // wall-mounted busbars from the generators toward the switchyard
  const busParts = new BoxBuilder();
  for (const x of HALL.units) {
    busParts.add(0.7, 0.7, 12, [x, 30, HALL.minZ + 8], null);
    busParts.add(0.7, 6, 0.7, [x, 27, HALL.minZ + 3], null);
  }
  const busbars = new THREE.Mesh(busParts.build(), mats.busbar);
  busbars.name = 'HydroHallBusbars';
  interior.add(busbars);

  group.add(interior);

  /* ---- turbine units ----------------------------------------------------- */
  const units = [];
  for (let i = 0; i < HALL.units.length; i += 1) {
    const detailed = HALL.units[i] === HALL.heroX;
    const unit = buildTurbineUnit(ctx, HALL.units[i], detailed, i);
    group.add(unit.group);
    units.push(unit);
  }

  /* ---- hall lighting ----------------------------------------------------- */
  const hallLight = new THREE.PointLight(0xffd6a0, 0, 130, 2);
  hallLight.position.set(HALL.heroX + 22, HALL.ceilingY - 8, HALL.unitZ + 6);
  hallLight.name = 'HydroHallLight';
  group.add(hallLight);

  const heroSpot = new THREE.PointLight(0xfff0d8, 0, 70, 2);
  heroSpot.position.set(HALL.heroX + 4, HALL.ceilingY - 12, HALL.unitZ + 14);
  heroSpot.name = 'HydroHeroSpot';
  group.add(heroSpot);

  const pitLight = new THREE.PointLight(0xffc98a, 0, 26, 2);
  pitLight.position.set(HALL.heroX, HALL.runnerY + 4.2, HALL.unitZ + 5);
  pitLight.name = 'HydroPitLight';
  group.add(pitLight);

  const hallGlow = buildGlowPoints(
    shared,
    [
      { position: [HALL.heroX + 22, HALL.ceilingY - 6, HALL.unitZ + 2], color: 0xffe1b4, size: 2.4, phase: 0.1 },
      { position: [HALL.heroX - 26, HALL.ceilingY - 6, HALL.unitZ + 2], color: 0xffe1b4, size: 2.4, phase: 0.5 },
      { position: [HALL.heroX + 4, HALL.ceilingY - 6, HALL.unitZ - 20], color: 0xffd9a8, size: 2.0, phase: 0.9 },
      { position: [HALL.heroX + 4, HALL.ceilingY - 6, HALL.unitZ + 24], color: 0xffd9a8, size: 2.0, phase: 0.3 },
    ],
    { name: 'HydroHallGlow', sizeScale: 0.7, opacity: 1, twinkle: 0.05 }
  );
  if (hallGlow) group.add(hallGlow);

  return { group, units, hallLight, heroSpot, pitLight, windows, interior, outletRacks, roof };
}

/* ========================================================================== *
 *  Switchyard, step-up transformers and the high-voltage grid
 * ========================================================================== */

const YARD = {
  minX: -322,
  maxX: -196,
  minZ: 182,
  maxZ: 276,
  padY: 16,
  transformers: [-300, -262, -224],
  z: 228,
};

const TOWER_SITES = [
  { x: -352, z: 330, height: 46, arms: 20, rotation: 0.30 },
  { x: -410, z: 448, height: 43, arms: 18, rotation: 0.24 },
  { x: -492, z: 574, height: 41, arms: 17, rotation: 0.18 },
  { x: -596, z: 716, height: 39, arms: 16, rotation: 0.12 },
  { x: -720, z: 876, height: 37, arms: 15, rotation: 0.07 },
  { x: -860, z: 1054, height: 35, arms: 14, rotation: 0.03 },
];

/** Lattice transmission tower: tapered body, X bracing, two crossarm levels. */
function makeLatticeTower(spec, mats, ctx) {
  const { height, arms } = spec;
  const builder = new BoxBuilder();
  const levels = 9;
  const baseHalf = arms * 0.34;
  const topHalf = arms * 0.13;
  const legThickness = Math.max(0.26, height * 0.0085);
  const braceThickness = Math.max(0.14, height * 0.0042);

  const halfAt = (y) => lerp(baseHalf, topHalf, clamp01(y / height));
  const corner = (y, sx, sz) => {
    const half = halfAt(y);
    return [sx * half, y, sz * half];
  };

  // main legs
  for (let i = 0; i < levels; i += 1) {
    const y0 = (i / levels) * height * 0.92;
    const y1 = ((i + 1) / levels) * height * 0.92;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        builder.memberBetween(corner(y0, sx, sz), corner(y1, sx, sz), legThickness);
      }
    }
  }

  // horizontal belts and X bracing on every face
  for (let i = 0; i <= levels; i += 1) {
    const y = (i / levels) * height * 0.92;
    const half = halfAt(y);
    for (const sz of [-1, 1]) {
      builder.memberBetween([-half, y, sz * half], [half, y, sz * half], braceThickness);
    }
    for (const sx of [-1, 1]) {
      builder.memberBetween([sx * half, y, -half], [sx * half, y, half], braceThickness);
    }
    if (i < levels) {
      const y1 = ((i + 1) / levels) * height * 0.92;
      const half1 = halfAt(y1);
      for (const sz of [-1, 1]) {
        builder.memberBetween([-half, y, sz * half], [half1, y1, sz * half1], braceThickness);
        builder.memberBetween([half, y, sz * half], [-half1, y1, sz * half1], braceThickness);
      }
      for (const sx of [-1, 1]) {
        builder.memberBetween([sx * half, y, -half], [sx * half1, y1, half1], braceThickness);
        builder.memberBetween([sx * half, y, half], [sx * half1, y1, -half1], braceThickness);
      }
    }
  }

  const armLevels = [
    { y: height * 0.72, length: arms, phase: 1 },
    { y: height * 0.86, length: arms * 0.82, phase: -1 },
  ];
  const armTips = [];
  for (const arm of armLevels) {
    const half = halfAt(arm.y);
    for (const side of [-1, 1]) {
      const tipX = side * (arm.length * 0.5) + 0;
      const tip = [tipX, arm.y - 1.6, 0];
      // top and bottom chords of the crossarm, plus zig-zag bracing
      builder.memberBetween([side * half, arm.y + 2.0, 0], [tip[0], tip[1], 0], braceThickness * 1.5);
      builder.memberBetween([side * half, arm.y - 2.6, 0], [tip[0], tip[1], 0], braceThickness * 1.5);
      builder.memberBetween([side * half, arm.y + 2.0, 0], [side * half * 0.6, arm.y - 2.6, 0], braceThickness);
      for (let i = 0; i < 4; i += 1) {
        const t0 = i / 4;
        const t1 = (i + 1) / 4;
        const x0 = lerp(side * half, tip[0], t0);
        const x1 = lerp(side * half, tip[0], t1);
        const yTop0 = lerp(arm.y + 2.0, tip[1], t0);
        const yTop1 = lerp(arm.y + 2.0, tip[1], t1);
        builder.memberBetween([x0, yTop0, 0], [x1, yTop1, 0], braceThickness);
        builder.memberBetween([x0, yTop0, 0], [x1, arm.y - 2.0, 0], braceThickness * 0.8);
      }
      armTips.push({ x: tip[0], y: tip[1], z: 0, level: arm.phase });
    }
  }

  // earth-wire peak
  const peakBase = halfAt(height * 0.92);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      builder.memberBetween([sx * peakBase, height * 0.92, sz * peakBase], [0, height + 2.5, 0], legThickness * 0.8);
    }
  }
  builder.memberBetween([-peakBase, height * 0.92, 0], [peakBase, height * 0.92, 0], braceThickness);

  // footings
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      builder.add(2.4, 1.6, 2.4, [sx * baseHalf, 0.4, sz * baseHalf], null);
    }
  }

  const geometry = builder.build();
  const mesh = new THREE.Mesh(geometry, mats.steelDark);
  mesh.castShadow = ctx.cfg.shadows;
  mesh.receiveShadow = true;
  return { mesh, armTips };
}

function makeInsulatorString(length, discs = 12) {
  const parts = [];
  const discHeight = length / discs;
  for (let i = 0; i < discs; i += 1) {
    const disc = new THREE.CylinderGeometry(0.42, 0.42, discHeight * 0.42, 10, 1, false);
    disc.translate(0, -i * discHeight, 0);
    parts.push(disc);
  }
  const rod = new THREE.CylinderGeometry(0.08, 0.08, length, 6);
  rod.translate(0, -length / 2, 0);
  parts.push(rod);
  return mergeGeometries(parts.map((geometry) => ({ geometry })));
}

function buildSwitchyard(ctx) {
  const { cfg, mats, shared, uniforms } = ctx;
  const quality = cfg.qualitySettings;
  const group = new THREE.Group();
  group.name = 'HydroSwitchyard';

  const width = YARD.maxX - YARD.minX;
  const depth = YARD.maxZ - YARD.minZ;
  const centreX = (YARD.minX + YARD.maxX) / 2;
  const centreZ = (YARD.minZ + YARD.maxZ) / 2;

  /* ---- gravel pad, kerb, fence ------------------------------------------ */
  const pad = new THREE.Mesh(new THREE.BoxGeometry(width + 8, 1.2, depth + 8), mats.gravel);
  pad.position.set(centreX, YARD.padY - 0.3, centreZ);
  pad.receiveShadow = true;
  group.add(pad);

  const fenceParts = new BoxBuilder();
  const fenceHeight = 2.6;
  const posts = Math.max(24, Math.floor(quality.fencePosts * 0.4));
  const perimeter = [
    { from: [YARD.minX - 4, YARD.minZ - 4], to: [YARD.maxX + 4, YARD.minZ - 4] },
    { from: [YARD.maxX + 4, YARD.minZ - 4], to: [YARD.maxX + 4, YARD.maxZ + 4] },
    { from: [YARD.maxX + 4, YARD.maxZ + 4], to: [YARD.minX - 4, YARD.maxZ + 4] },
    { from: [YARD.minX - 4, YARD.maxZ + 4], to: [YARD.minX - 4, YARD.minZ - 4] },
  ];
  let postIndex = 0;
  for (const segment of perimeter) {
    const dx = segment.to[0] - segment.from[0];
    const dz = segment.to[1] - segment.from[1];
    const length = Math.hypot(dx, dz);
    const count = Math.max(4, Math.round((length / perimeterLength(perimeter)) * posts));
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      fenceParts.add(0.12, fenceHeight, 0.12, [segment.from[0] + dx * t, YARD.padY + fenceHeight / 2, segment.from[1] + dz * t], null);
      postIndex += 1;
    }
    fenceParts.memberBetween([segment.from[0], YARD.padY + fenceHeight - 0.15, segment.from[1]], [segment.to[0], YARD.padY + fenceHeight - 0.15, segment.to[1]], 0.07);
    fenceParts.memberBetween([segment.from[0], YARD.padY + 1.2, segment.from[1]], [segment.to[0], YARD.padY + 1.2, segment.to[1]], 0.07);
  }
  const fence = new THREE.Mesh(fenceParts.build(), mats.steelDark);
  fence.name = 'HydroYardFence';
  group.add(fence);
  void postIndex;

  /* ---- transformers ------------------------------------------------------ */
  const ceramicParts = [];
  const busParts = [];
  const glowEntries = [];
  const transformerLights = [];

  for (let ti = 0; ti < YARD.transformers.length; ti += 1) {
    const x = YARD.transformers[ti];
    const z = YARD.z;
    const base = YARD.padY + 0.6;
    const bank = new THREE.Group();
    bank.name = `HydroTransformer${ti + 1}`;

    // plinth and tank
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(15, 1.2, 12), mats.concreteDark);
    plinth.position.set(x, YARD.padY + 0.1, z);
    plinth.receiveShadow = true;
    bank.add(plinth);

    const tank = new THREE.Mesh(new THREE.BoxGeometry(11.5, 6.6, 8.2), mats.steelBlue);
    tank.position.set(x, base + 3.3, z);
    tank.castShadow = cfg.shadows;
    tank.receiveShadow = true;
    bank.add(tank);

    // cooling radiators: two banks of thin fins with headers
    const radiatorParts = new BoxBuilder();
    for (const side of [-1, 1]) {
      const rx = x + side * 7.4;
      for (let i = 0; i < 11; i += 1) {
        radiatorParts.add(0.16, 4.6, 2.6, [rx, base + 3.4, z - 3.6 + i * 0.72], null);
      }
      radiatorParts.cylinder(0.34, 0.34, 8.0, [rx + side * 1.5, base + 5.7, z], [Math.PI / 2, 0, 0], 8);
      radiatorParts.cylinder(0.34, 0.34, 8.0, [rx + side * 1.5, base + 1.2, z], [Math.PI / 2, 0, 0], 8);
      radiatorParts.memberBetween([rx, base + 5.6, z - 4], [rx + side * 1.5, base + 5.6, z - 4], 0.2);
      radiatorParts.memberBetween([rx, base + 1.3, z - 4], [rx + side * 1.5, base + 1.3, z - 4], 0.2);
      radiatorParts.memberBetween([rx, base + 5.6, z + 4], [rx + side * 1.5, base + 5.6, z + 4], 0.2);
      radiatorParts.memberBetween([rx, base + 1.3, z + 4], [rx + side * 1.5, base + 1.3, z + 4], 0.2);
      // cooling fans at the bottom
      for (let i = 0; i < 3; i += 1) {
        radiatorParts.cylinder(0.9, 0.9, 0.5, [rx + side * 0.4, base + 0.7, z - 2.2 + i * 2.2], [Math.PI / 2, 0, 0], 12);
      }
    }
    const radiators = new THREE.Mesh(radiatorParts.build(), mats.steelDark);
    radiators.castShadow = cfg.shadows;
    bank.add(radiators);

    // conservator drum on top
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 7.4, 16), mats.steel);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(x - 1.4, base + 8.0, z);
    drum.castShadow = cfg.shadows;
    bank.add(drum);
    for (const s of [-1, 1]) {
      const support = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.4), mats.steelDark);
      support.position.set(x - 1.4 + s * 2.4, base + 7.0, z);
      bank.add(support);
    }

    // high-voltage bushings on top: three tall ceramic stacks
    const bushingPositions = [];
    for (let p = 0; p < 3; p += 1) {
      const bx = x - 3.0 + p * 3.0;
      const bz = z + 1.6;
      bushingPositions.push([bx, bz]);
      for (let d = 0; d < 9; d += 1) {
        const disc = new THREE.CylinderGeometry(0.44 - d * 0.012, 0.44 - d * 0.012, 0.16, 12);
        disc.translate(bx, base + 7.3 + d * 0.42, bz);
        ceramicParts.push(disc);
      }
      const rod = new THREE.CylinderGeometry(0.12, 0.12, 4.6, 8);
      rod.translate(bx, base + 9.4, bz);
      ceramicParts.push(rod);
      // top terminal
      const terminal = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10);
      terminal.translate(bx, base + 11.7, bz);
      ceramicParts.push(terminal);
      glowEntries.push({ position: [bx, base + 11.9, bz], color: 0x9fe0ff, size: 0.55, phase: ti * 0.3 + p * 0.11 });
    }

    // low-voltage bushings toward the powerhouse
    for (let p = 0; p < 3; p += 1) {
      const bx = x - 2.4 + p * 2.4;
      const bz = z - 4.6;
      for (let d = 0; d < 5; d += 1) {
        const disc = new THREE.CylinderGeometry(0.34, 0.34, 0.14, 10);
        disc.translate(bx, base + 7.1 + d * 0.36, bz);
        ceramicParts.push(disc);
      }
      const rod = new THREE.CylinderGeometry(0.1, 0.1, 2.4, 7);
      rod.translate(bx, base + 8.1, bz);
      ceramicParts.push(rod);
    }

    // galvanised conduit to the control cabinet
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 1.6), mats.steelDark);
    cabinet.position.set(x + 5.2, base + 1.7, z - 5.4);
    bank.add(cabinet);

    group.add(bank);
    transformerLights.push({ x, z });

    // flexible conductors from the bushings up to the busbars
    for (const [bx, bz] of bushingPositions) {
      busParts.push(tubeBetween([bx, base + 11.9, bz], [bx, YARD.padY + 24.5, bz + 2.5], 0.09, 6));
    }
  }
  const ceramics = new THREE.Mesh(mergeGeometries(ceramicParts.map((geometry) => ({ geometry }))), mats.ceramic);
  ceramics.name = 'HydroTransformerBushings';
  ceramics.castShadow = cfg.shadows;
  group.add(ceramics);
  for (const geometry of ceramicParts) geometry.dispose();

  /* ---- busbar gantries --------------------------------------------------- */
  const gantryZ = YARD.z + 4;
  const gantryHeight = YARD.padY + 25;
  const gantryParts = new BoxBuilder();
  const gantryXs = [YARD.minX + 18, YARD.minX + 60, YARD.minX + 102, YARD.minX + 142];
  for (let i = 0; i < gantryXs.length; i += 1) {
    const gx = gantryXs[i];
    for (const sz of [-1, 1]) {
      gantryParts.memberBetween([gx, YARD.padY + 1, gantryZ + sz * 6], [gx, gantryHeight, gantryZ], 0.34);
      gantryParts.memberBetween([gx, YARD.padY + 1, gantryZ + sz * 6], [gx, gantryHeight - 8, gantryZ], 0.22);
    }
    gantryParts.add(0.7, 0.7, 12.4, [gx, gantryHeight, gantryZ], null);
    gantryParts.add(0.5, 3.4, 0.5, [gx, gantryHeight + 1.4, gantryZ], null);
  }
  const gantryMesh = new THREE.Mesh(gantryParts.build(), mats.steelDark);
  gantryMesh.name = 'HydroBusGantries';
  gantryMesh.castShadow = cfg.shadows;
  group.add(gantryMesh);

  // three bus runs with droppers down to each transformer
  const busbarGeometry = [];
  for (let phase = 0; phase < 3; phase += 1) {
    const z = gantryZ - 3.2 + phase * 3.2;
    const y = gantryHeight - 0.7;
    busbarGeometry.push(tubeBetween([gantryXs[0] - 10, y, z], [gantryXs[gantryXs.length - 1] + 6, y, z], 0.2, 8));
    // insulator strings holding the bus up
    for (const gx of gantryXs) {
      const string = makeInsulatorString(2.2, 7);
      string.translate(gx, y + 1.1, z);
      busbarGeometry.push(string);
    }
    // droppers into the transformer bushings
    for (let ti = 0; ti < YARD.transformers.length; ti += 1) {
      const tx = YARD.transformers[ti] - 3.0 + phase * 3.0;
      busbarGeometry.push(tubeBetween([tx, YARD.padY + 23.5, YARD.z + 2], [tx, y, z], 0.08, 5));
    }
  }
  const busbars = new THREE.Mesh(mergeGeometries(busbarGeometry.map((geometry) => ({ geometry }))), mats.busbar);
  busbars.name = 'HydroYardBusbars';
  group.add(busbars);
  for (const geometry of busbarGeometry) geometry.dispose();

  /* ---- lightning masts and control building ------------------------------ */
  const mastParts = new BoxBuilder();
  for (const mx of [YARD.minX + 10, YARD.maxX - 10]) {
    const mastHeight = 42;
    for (let i = 0; i < mastHeight; i += 2.2) {
      mastParts.cylinder(0.34 - i * 0.006, 0.42 - i * 0.006, 2.3, [mx, YARD.padY + i + 1.1, YARD.minZ + 6], null, 8);
    }
    mastParts.cylinder(0.5, 0.4, 3.4, [mx, YARD.padY + mastHeight + 1.6, YARD.minZ + 6], null, 6);
    glowEntries.push({ position: [mx, YARD.padY + mastHeight + 3.6, YARD.minZ + 6], color: 0xff4f36, size: 0.8, phase: mx * 0.01 });
  }
  const masts = new THREE.Mesh(mastParts.build(), mats.steelDark);
  masts.name = 'HydroLightningMasts';
  masts.castShadow = cfg.shadows;
  group.add(masts);

  const control = new THREE.Mesh(new THREE.BoxGeometry(26, 7.5, 11), mats.concreteTrim);
  control.position.set(YARD.maxX - 22, YARD.padY + 3.75, YARD.maxZ - 14);
  control.castShadow = cfg.shadows;
  control.receiveShadow = true;
  group.add(control);
  const controlWindowGeometry = new THREE.BoxGeometry(24, 2.6, 0.3);
  scaleUVs(controlWindowGeometry, 1.6, 0.16);
  const controlWindows = new THREE.Mesh(controlWindowGeometry, mats.windowWall);
  controlWindows.position.set(YARD.maxX - 22, YARD.padY + 5.2, YARD.maxZ - 8.6);
  group.add(controlWindows);

  /* ---- transmission line ------------------------------------------------- */
  const towers = [];
  const armPoints = [];
  for (let i = 0; i < TOWER_SITES.length; i += 1) {
    const site = TOWER_SITES[i];
    const groundY = terrainHeight(site.x, site.z, cfg.seed);
    const tower = makeLatticeTower(site, mats, ctx);
    tower.mesh.position.set(site.x, groundY, site.z);
    tower.mesh.rotation.y = site.rotation;
    tower.mesh.name = `HydroTransmissionTower${i + 1}`;
    group.add(tower.mesh);
    towers.push(tower.mesh);

    const points = [];
    for (const tip of tower.armTips) {
      const cos = Math.cos(site.rotation);
      const sin = Math.sin(site.rotation);
      const wx = site.x + tip.x * cos + tip.z * sin;
      const wz = site.z - tip.x * sin + tip.z * cos;
      points.push(new THREE.Vector3(wx, groundY + tip.y, wz));
    }
    armPoints.push(points);

    // insulators hanging from each arm tip
    const insulatorGeometry = makeInsulatorString(3.2, 12);
    for (const point of points) {
      const string = insulatorGeometry.clone();
      string.translate(point.x, point.y - 0.4, point.z);
      const mesh = new THREE.Mesh(string, mats.ceramic);
      mesh.castShadow = cfg.shadows;
      group.add(mesh);
    }
    insulatorGeometry.dispose();

    glowEntries.push({
      position: [site.x, groundY + site.height + 3.2, site.z],
      color: 0xff4f36,
      size: 0.9,
      phase: i * 0.31,
    });
  }

  // catenary conductors between consecutive towers
  const conductorGeometry = [];
  for (let i = 0; i < armPoints.length - 1; i += 1) {
    const a = armPoints[i];
    const b = armPoints[i + 1];
    const pairs = Math.min(a.length, b.length);
    for (let p = 0; p < pairs; p += 1) {
      const start = a[p];
      const end = b[p];
      const span = start.distanceTo(end);
      const sag = span * 0.032;
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.y -= sag;
      const curve = new THREE.QuadraticBezierCurve3(start.clone(), mid, end.clone());
      const tube = new THREE.TubeGeometry(curve, 16, 0.13, 4, false);
      conductorGeometry.push(tube);
    }
    // earth wire between peaks
    const peakA = new THREE.Vector3(a[0].x, a[0].y + 22, a[0].z);
    const peakB = new THREE.Vector3(b[0].x, b[0].y + 22, b[0].z);
    const midPeak = new THREE.Vector3().addVectors(peakA, peakB).multiplyScalar(0.5);
    midPeak.y -= peakA.distanceTo(peakB) * 0.025;
    conductorGeometry.push(
      new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(peakA, midPeak, peakB), 14, 0.09, 4, false)
    );
  }
  // tie the switchyard gantry into the first tower
  const firstTower = armPoints[0];
  for (let phase = 0; phase < Math.min(3, firstTower.length); phase += 1) {
    const start = new THREE.Vector3(gantryXs[gantryXs.length - 1] + 4, gantryHeight - 0.7, gantryZ - 3.2 + phase * 3.2);
    const end = firstTower[phase];
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.y -= 3.2;
    conductorGeometry.push(
      new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start, mid, end), 18, 0.15, 5, false)
    );
  }
  const conductors = new THREE.Mesh(mergeGeometries(conductorGeometry.map((geometry) => ({ geometry }))), mats.steelDark);
  conductors.name = 'HydroTransmissionConductors';
  group.add(conductors);
  for (const geometry of conductorGeometry) geometry.dispose();

  /* ---- switchyard glow and valve hall lights ----------------------------- */
  const yardGlow = buildGlowPoints(shared, glowEntries, {
    name: 'HydroYardGlow',
    sizeScale: 0.9,
    twinkle: 0.2,
    opacity: 0,
  });
  if (yardGlow) group.add(yardGlow);

  // fluorescent strips on the control building
  const stripLights = [];
  for (let i = 0; i < 4; i += 1) {
    stripLights.push({
      position: [YARD.maxX - 30 + i * 5, YARD.padY + 1.2, YARD.maxZ - 7.8],
      color: 0xdff2ff,
      size: 0.9,
      phase: i * 0.2,
    });
  }
  const controlGlow = buildGlowPoints(shared, stripLights, {
    name: 'HydroControlGlow',
    sizeScale: 0.7,
    opacity: 0,
    twinkle: 0.05,
  });
  if (controlGlow) group.add(controlGlow);

  return {
    group,
    towers,
    armPoints,
    glowPoints: yardGlow,
    controlGlow,
    padY: YARD.padY,
    transformerLights,
  };
}

function perimeterLength(segments) {
  let total = 0;
  for (const segment of segments) {
    total += Math.hypot(segment.to[0] - segment.from[0], segment.to[1] - segment.from[1]);
  }
  return total || 1;
}

/* -------------------------------------------------------------------------- */
/*  Valley lights: the town and the grid at night                             */
/* -------------------------------------------------------------------------- */

function buildValleyLights(ctx) {
  const { cfg, shared } = ctx;
  const quality = cfg.qualitySettings;
  const random = mulberry32(cfg.seed + 8811);
  const entries = [];
  const target = Math.round(quality.valleyLights);

  let attempts = 0;
  while (entries.length < target && attempts < target * 12) {
    attempts += 1;
    const angle = randRange(random, -0.9, 0.9) + Math.PI * 0.5;
    const distance = randRange(random, 480, 1500);
    const x = Math.cos(angle) * distance * 0.85;
    const z = Math.sin(angle) * distance + 240;
    const height = terrainHeight(x, z, cfg.seed);
    if (height > 90 || height < -40) continue;
    const warm = random() > 0.28;
    entries.push({
      position: [x + randRange(random, -6, 6), height + randRange(random, 1.5, 4), z + randRange(random, -6, 6)],
      color: warm ? 0xffb46a : 0xbfe4ff,
      size: randRange(random, 0.35, 0.95),
      phase: random(),
    });
  }

  // the dam's own floodlights, seen from far downstream
  const damLights = [
    [-140, 150, 10], [-100, 150, 8], [-60, 150, 9], [-20, 150, 8], [20, 150, 9], [60, 150, 8],
    [100, 150, 7], [140, 150, 8], [176, 152, 10], [-112, 40, 14], [-112, 8, 12],
    [YARD.minX + 8, YARD.padY + 4, YARD.z], [YARD.maxX - 8, YARD.padY + 4, YARD.z],
  ];
  for (let i = 0; i < damLights.length; i += 1) {
    const [x, y, z] = damLights[i];
    entries.push({ position: [x, y, z], color: 0xffcf8a, size: 1.8, phase: i * 0.13 });
  }

  const points = buildGlowPoints(shared, entries, {
    name: 'HydroValleyLights',
    sizeScale: 1.8,
    twinkle: 0.3,
    opacity: 0,
  });
  return points;
}

/* ========================================================================== *
 *  Camera path — six stations, plus the small drift that keeps it alive
 * ========================================================================== */

const CAMERA_KEYS = [
  // 1 — crest and mountain reservoir: a slow aerial pass along the arch
  { p: 0.0, pos: [-213, 160, 93], look: [-120, 150, 24], fov: 56 },
  { p: 0.055, pos: [-155, 159, 46], look: [-44, 149, 2], fov: 56 },
  { p: 0.115, pos: [-72, 158, 11], look: [62, 149, 7], fov: 56 },
  { p: 0.175, pos: [31, 159, 4], look: [158, 150, 45], fov: 55 },
  // 2 — spillway gates and cascade
  { p: 0.225, pos: [252, 152, 196], look: [170, 138, 88], fov: 54 },
  { p: 0.278, pos: [246, 104, 246], look: [152, 74, 124], fov: 55 },
  { p: 0.325, pos: [206, 56, 288], look: [122, 32, 178], fov: 57 },
  { p: 0.375, pos: [152, 28, 300], look: [92, 14, 204], fov: 58 },
  // 3 — penstocks and powerhouse approach
  { p: 0.425, pos: [104, 122, 62], look: [-92, 96, 22], fov: 60 },
  { p: 0.478, pos: [62, 92, 80], look: [-104, 62, 42], fov: 60 },
  { p: 0.53, pos: [24, 66, 90], look: [-112, 34, 72], fov: 58 },
  // 4 — turbine and generator cutaway
  { p: 0.578, pos: [-112, 36, 178], look: [-112, 14, 136], fov: 46 },
  { p: 0.63, pos: [-84, 31, 176], look: [-112, 14, 136], fov: 44 },
  { p: 0.685, pos: [-140, 31, 176], look: [-112, 14, 136], fov: 44 },
  { p: 0.735, pos: [-112, 42, 170], look: [-112, 20, 138], fov: 46 },
  // 5 — switchyard and the line out of the canyon
  { p: 0.79, pos: [-148, 54, 322], look: [-252, 26, 244], fov: 54 },
  { p: 0.845, pos: [-186, 32, 296], look: [-268, 20, 236], fov: 52 },
  { p: 0.905, pos: [-232, 40, 268], look: [-322, 30, 232], fov: 50 },
  // 6 — night panorama
  { p: 0.945, pos: [-116, 136, 378], look: [46, 98, 92], fov: 60 },
  { p: 1.0, pos: [152, 176, 470], look: [4, 108, 40], fov: 66 },
];

const _camPosA = new THREE.Vector3();
const _camPosB = new THREE.Vector3();
const _camLookA = new THREE.Vector3();
const _camLookB = new THREE.Vector3();

function sampleCameraPath(progress, out) {
  const p = clamp01(progress);
  let i = 0;
  while (i < CAMERA_KEYS.length - 2 && p > CAMERA_KEYS[i + 1].p) i += 1;
  const a = CAMERA_KEYS[i];
  const b = CAMERA_KEYS[i + 1];
  const t = clamp01((p - a.p) / Math.max(1e-6, b.p - a.p));
  const e = smootherstep(0, 1, t);

  _camPosA.set(a.pos[0], a.pos[1], a.pos[2]);
  _camPosB.set(b.pos[0], b.pos[1], b.pos[2]);
  _camLookA.set(a.look[0], a.look[1], a.look[2]);
  _camLookB.set(b.look[0], b.look[1], b.look[2]);

  out.position.lerpVectors(_camPosA, _camPosB, e);
  out.lookAt.lerpVectors(_camLookA, _camLookB, e);
  out.fov = lerp(a.fov, b.fov, e);

  // a slow breath so a still camera never looks frozen
  const drift = 0.12 * Math.sin(p * Math.PI * 12.0);
  out.position.y += drift;
  return out;
}

/* ========================================================================== *
 *  Telemetry
 * ========================================================================== */

function sampleTelemetry(p, spillwayOpen) {
  const headMeters = 141.4 - 0.9 * (0.5 + 0.5 * Math.sin(p * 5.7 + 0.6));
  const unitsOnline = 4;
  const load = 0.88 + 0.09 * Math.sin(p * 9.3 + 1.1);
  const unitFlow = 132 * load;
  const turbineFlow = unitsOnline * unitFlow;
  const spillOpen = clamp01(spillwayOpen);
  const spillFlow = spillOpen * LAYOUT.spillwayRatedFlow * (0.95 + 0.05 * Math.sin(p * 13.0 + 2.0));
  const flowM3s = turbineFlow + spillFlow;
  const outputMw = (9.81 * headMeters * turbineFlow * 0.918) / 1000;
  return {
    headMeters,
    flowM3s,
    outputMw,
    turbineFlow,
    spillFlow,
    gridKv: LAYOUT.gridVoltageKv,
    unitsOnline,
    load,
  };
}

const TIME_LABELS = [
  { p: 0.0, label: 'Golden hour' },
  { p: 0.36, label: 'Late afternoon' },
  { p: 0.58, label: 'Sunset' },
  { p: 0.74, label: 'Dusk' },
  { p: 0.86, label: 'Blue hour' },
  { p: 0.94, label: 'Night' },
  { p: 1.0, label: 'Deep night' },
];

function timeLabelAt(progress) {
  const p = clamp01(progress);
  let i = 0;
  while (i < TIME_LABELS.length - 2 && p > TIME_LABELS[i + 1].p) i += 1;
  const a = TIME_LABELS[i];
  const b = TIME_LABELS[i + 1];
  return p - a.p < b.p - p ? a.label : b.label;
}

/* ========================================================================== *
 *  createHydroWorld
 * ========================================================================== */

export function createHydroWorld(scene, options = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new Error('createHydroWorld(scene, options): a THREE.Scene is required');
  }

  const cfg = resolveConfig(options);
  const group = new THREE.Group();
  group.name = 'HydroWorld';

  const detectedPixelRatio =
    cfg.pixelRatio > 0
      ? cfg.pixelRatio
      : typeof window !== 'undefined' && window.devicePixelRatio
        ? Math.min(window.devicePixelRatio, 2)
        : 1;

  const shared = {
    time: { value: 0 },
    pixelRatio: { value: detectedPixelRatio },
    viewportHeight: { value: typeof window !== 'undefined' ? window.innerHeight || 900 : 900 },
  };

  const uniforms = {
    sunDir: { value: new THREE.Vector3(0, 0.2, 1) },
    moonDir: { value: new THREE.Vector3(0, 0.4, -1) },
    sunColor: { value: new THREE.Color(0xffce9c) },
    sunPower: { value: 1 },
    skyTop: { value: new THREE.Color(0x2f6cae) },
    skyHorizon: { value: new THREE.Color(0xffd8b4) },
    moonColor: { value: new THREE.Color(0xa9c4ff) },
    cityGlow: { value: new THREE.Color(0x000000) },
    fogColor: { value: new THREE.Color(0xdce6e8) },
    fogDensity: { value: 0.00044 },
    night: { value: 0 },
    cameraPos: { value: new THREE.Vector3() },
  };

  const ctx = {
    scene,
    group,
    cfg,
    seed: cfg.seed,
    shared,
    uniforms,
    particleScale: cfg.particleScale,
  };

  const envMap = createEnvironmentTexture(cfg.seed);
  ctx.envMap = envMap;
  const materialSet = createMaterials(ctx);
  ctx.mats = materialSet.mats;
  ctx.textures = materialSet.textures;
  ctx.materials = materialSet.materials;

  /* ---- fog and background ------------------------------------------------ */
  const previousFog = scene.fog || null;
  let ownFog = null;
  if (cfg.manageFog) {
    ownFog = new THREE.FogExp2(0xdce6e8, 0.00044);
    scene.fog = ownFog;
  }
  const previousBackground = scene.background === undefined ? null : scene.background;
  let ownBackground = null;
  if (cfg.manageBackground) {
    ownBackground = new THREE.Color(0xcfe0e8);
    scene.background = ownBackground;
  }

  /* ---- world pieces ------------------------------------------------------ */
  const sky = buildSky(shared);
  group.add(sky.mesh);

  const terrain = buildTerrain(ctx);
  group.add(terrain.mesh);

  const vegetation = buildVegetation(ctx);

  const reservoir = buildReservoir(ctx);
  group.add(reservoir.mesh);

  const river = buildRiver(ctx);
  group.add(river.mesh);

  const dam = buildDamBody(ctx);
  group.add(dam.body, dam.roadMesh, dam.centreMesh, dam.kerbMesh, dam.wallMesh, dam.pilasterMesh);
  for (const abutment of dam.abutments) group.add(abutment);

  const crest = buildCrestFurniture(ctx);
  group.add(crest.lampMesh, crest.postMesh, crest.railMesh, crest.trashMesh, crest.crane);
  for (const tower of crest.intakeTowers) group.add(tower);
  if (crest.glowPoints) group.add(crest.glowPoints);

  const spillway = buildSpillway(ctx);
  group.add(spillway.group);

  // the road bridge over the spillway bays
  const bridgeWrapper = new THREE.Group();
  bridgeWrapper.position.set(SPILLWAY.x, 0, SPILLWAY.z);
  bridgeWrapper.rotation.y = SPILLWAY.rotationY;
  bridgeWrapper.add(crest.bridgeGroup);
  group.add(bridgeWrapper);

  const penstocks = buildPenstocks(ctx);
  group.add(penstocks.group);

  const powerhouse = buildPowerhouse(ctx);
  group.add(powerhouse.group);

  const switchyard = buildSwitchyard(ctx);
  group.add(switchyard.group);

  const valleyLights = buildValleyLights(ctx);
  if (valleyLights) group.add(valleyLights);

  /* ---- lights ------------------------------------------------------------ */
  const sun = new THREE.DirectionalLight(0xffce9c, 3.3);
  sun.name = 'HydroSun';
  sun.castShadow = cfg.shadows;
  if (cfg.shadows) {
    const size = cfg.qualitySettings.shadowMapSize;
    sun.shadow.mapSize.set(size, size);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 1800;
    sun.shadow.camera.left = -420;
    sun.shadow.camera.right = 420;
    sun.shadow.camera.top = 420;
    sun.shadow.camera.bottom = -420;
    sun.shadow.bias = -0.0009;
    sun.shadow.normalBias = 0.35;
  }
  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(0, 80, 60);
  sun.target = sunTarget;

  const moonLight = new THREE.DirectionalLight(0xa9c4ff, 0);
  moonLight.name = 'HydroMoon';

  const hemi = new THREE.HemisphereLight(0xbcd6ea, 0x5a5040, 1.35);
  hemi.name = 'HydroHemisphere';

  const ambient = new THREE.AmbientLight(0xdfe8f2, 0.32);
  ambient.name = 'HydroAmbient';

  // sky bounce from the opposite side of the sun: keeps the shaded faces of
  // the dam, the hall and the yard readable instead of crushing to black
  const fill = new THREE.DirectionalLight(0xa9c8e6, 0.95);
  fill.name = 'HydroFill';
  fill.position.set(620, 480, 520);
  const fillTarget = new THREE.Object3D();
  fillTarget.position.set(-40, 60, 20);
  fill.target = fillTarget;

  const lights = { sun, moon: moonLight, hemisphere: hemi, ambient, fill, target: sunTarget, fillTarget };
  if (cfg.addLights) group.add(sun, sunTarget, moonLight, hemi, ambient, fill, fillTarget);

  // spillway floodlight: one real light that comes alive at night
  const spillLight = new THREE.PointLight(0xffd9a0, 0, 300, 2);
  const spillLamp = spillway.spillwayWorld(0, 96);
  spillLight.position.set(spillLamp.x, 88, spillLamp.z);
  spillLight.name = 'HydroSpillwayFloodlight';
  const crestLight = new THREE.PointLight(0xffe2b8, 0, 220, 2);
  crestLight.position.set(60, 168, 30);
  crestLight.name = 'HydroCrestFloodlight';

  // turbine hall work lights
  const hallLights = [];
  for (const [hx, hz] of [[-150, 132], [-112, 138], [-74, 132]]) {
    const light = new THREE.PointLight(0xffd9a8, 0, 110, 2);
    light.position.set(hx, HALL.ceilingY - 10, hz);
    light.name = 'HydroHallWorkLight';
    group.add(light);
    hallLights.push(light);
  }

  // switchyard floodlight masts
  const yardLights = [];
  for (const [lx, lz] of [[-330, 250], [-240, 196], [-200, 246]]) {
    const light = new THREE.PointLight(0xffe6bc, 0, 180, 2);
    light.position.set(lx, YARD.padY + 24, lz);
    light.name = 'HydroYardFloodlight';
    group.add(light);
    yardLights.push(light);
  }

  const damWash = new THREE.SpotLight(0xffe0b0, 0, 900, 0.72, 0.55, 1.4);
  damWash.position.set(120, 26, 260);
  damWash.target.position.set(20, 110, 30);
  damWash.name = 'HydroDamWash';
  group.add(damWash, damWash.target);

  group.add(spillLight, crestLight);

  scene.add(group);

  /* ---- state ------------------------------------------------------------- */
  const state = {
    progress: 0,
    time: 0,
    spillwayTarget: cfg.spillwayOpen,
    spillwayOpen: cfg.spillwayOpen,
    cutawayTarget: cfg.cutaway ? 1 : 0,
    cutawayMix: cfg.cutaway ? 1 : 0,
    runnerAngle: 0,
    rotorAngle: 0,
    night: 0,
    daylight: 1,
    disposed: false,
  };

  const env = {};
  const poseOut = {
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    fov: cfg.fov,
  };

  const coverMaterials = [];
  for (const unit of powerhouse.units) {
    if (unit.casingCover && unit.casingCover.material) coverMaterials.push(unit.casingCover.material);
    if (unit.housingCover && unit.housingCover.material) coverMaterials.push(unit.housingCover.material);
  }

  /* ---- pose -------------------------------------------------------------- */
  function getDamPose(progress = 0) {
    const p = clamp01(finite(progress, 0));
    const cameraPose = sampleCameraPath(p, poseOut);
    const telemetry = sampleTelemetry(p, state.spillwayTarget);
    const phaseInfo = phaseAtProgress(p);
    const sunElevation = 9.5 - p * 19.0;

    return {
      cameraPos: cameraPose.position.clone(),
      lookAt: cameraPose.lookAt.clone(),
      fov: cameraPose.fov,
      headMeters: telemetry.headMeters,
      flowM3s: telemetry.flowM3s,
      outputMw: telemetry.outputMw,
      gridKv: telemetry.gridKv,
      phaseName: phaseInfo.phase.name,
      phaseId: phaseInfo.phase.id,
      phaseCaption: phraseCaption(phaseInfo.phase),
      station: phaseInfo.index + 1,
      stationProgress: phaseInfo.local,
      timeOfDay: smoothstep(0.42, 0.98, p) * 0.85 + 0.15 * smoothstep(0.2, 1.0, p),
      timeOfDayLabel: timeLabelAt(p),
      timeLabel: timeLabelAt(p),
      sunElevation,
      turbineFlow: telemetry.turbineFlow,
      spillFlow: telemetry.spillFlow,
      unitsOnline: telemetry.unitsOnline,
      progress: p,
    };
  }

  function phraseCaption(phase) {
    return phase.caption;
  }

  /* ---- controls ---------------------------------------------------------- */
  function setSpillwayOpen(amount) {
    const value = clamp01(finite(amount, 0));
    state.spillwayTarget = value;
    return value;
  }

  function setCutaway(enabled) {
    state.cutawayTarget = enabled ? 1 : 0;
    return !!enabled;
  }

  /* ---- update ------------------------------------------------------------ */
  const _sunDir = new THREE.Vector3();
  const _moonDir = new THREE.Vector3();
  const _camTarget = new THREE.Vector3();
  const _forward = new THREE.Vector3();
  const _windowColor = new THREE.Color();
  const _fillWarm = new THREE.Color();

  function update(elapsed = 0, delta = 0.016, progress = 0, camera = null) {
    if (state.disposed) return;
    const t = finite(elapsed, 0);
    const dt = clamp(finite(delta, 0.016), 0, 0.1);
    const p = clamp01(finite(progress, 0));

    state.time = t;
    state.progress = p;
    shared.time.value = t;
    if (typeof window !== 'undefined' && window.innerHeight) shared.viewportHeight.value = window.innerHeight;

    /* environment */
    const envNow = sampleEnvironment(p, env);
    const sunElev = envNow.sunElev;
    const sunAzim = envNow.azimuth;
    sunDirection(sunElev, sunAzim, _sunDir);
    sunDirection(MOON_ELEVATION, MOON_AZIMUTH, _moonDir);
    state.night = envNow.night;
    state.daylight = 1 - envNow.night * 0.82;

    const night = envNow.night;

    /* shared shader uniforms */
    uniforms.sunDir.value.copy(_sunDir);
    uniforms.moonDir.value.copy(_moonDir);
    uniforms.sunColor.value.copy(envNow.sunColor);
    uniforms.sunPower.value = Math.max(0.06, envNow.sunIntensity / 3.5);
    uniforms.skyTop.value.copy(envNow.zenith);
    uniforms.skyHorizon.value.copy(envNow.horizon);
    uniforms.fogColor.value.copy(envNow.fogColor);
    uniforms.fogDensity.value = envNow.fogDensity;
    uniforms.night.value = night;
    uniforms.cityGlow.value.copy(envNow.cityGlow);
    uniforms.moonColor.value.setRGB(0.66, 0.77, 1.0).multiplyScalar(0.35 + night * 0.65);

    /* sky */
    const skyU = sky.uniforms;
    skyU.uZenith.value.copy(envNow.zenith);
    skyU.uHorizon.value.copy(envNow.horizon);
    skyU.uGround.value.copy(envNow.ground);
    skyU.uSunDir.value.copy(_sunDir);
    skyU.uSunColor.value.copy(envNow.sunColor);
    skyU.uMoonDir.value.copy(_moonDir);
    skyU.uCityGlow.value.copy(envNow.cityGlow);
    skyU.uCloudLit.value.copy(envNow.cloudLit);
    skyU.uCloudShadow.value.copy(envNow.cloudShadow);
    skyU.uSunPower.value = Math.max(0, envNow.sunIntensity / 3.2);
    skyU.uStars.value = envNow.stars;
    skyU.uMoon.value = envNow.moon;
    skyU.uNight.value = night;
    skyU.uCloudCover.value = 0.55 + 0.2 * Math.sin(p * 2.4 + 0.7);
    skyU.uTime.value = t;

    const cameraPos = camera && camera.position ? camera.position : _camTarget.copy(getDamPose(p).cameraPos);
    sky.mesh.position.copy(cameraPos);
    uniforms.cameraPos.value.copy(cameraPos);

    /* sun & moon lights follow the camera so shadows stay crisp */
    _forward.copy(cameraPos).addScaledVector(_sunDir, -1).normalize();
    sun.color.copy(envNow.sunColor);
    sun.intensity = envNow.sunIntensity;
    sun.position.copy(cameraPos).addScaledVector(_sunDir, 900);
    sun.target.position.copy(cameraPos).addScaledVector(_forward, 120);
    sun.target.updateMatrixWorld();
    if (cfg.shadows) {
      sun.shadow.camera.updateProjectionMatrix();
    }

    moonLight.color.setHex(0x9fb6e8);
    moonLight.intensity = envNow.moon * 0.55;
    moonLight.position.copy(cameraPos).addScaledVector(_moonDir, 900);
    moonLight.target.position.copy(cameraPos);
    moonLight.target.updateMatrixWorld();

    hemi.color.copy(envNow.hemiSky);
    hemi.groundColor.copy(envNow.hemiGround);
    hemi.intensity = envNow.hemiIntensity;
    ambient.intensity = envNow.ambient;

    fill.color.copy(envNow.hemiSky).lerp(_fillWarm.setHex(0xbcd2ea), 0.5);
    fill.intensity = 0.55 + 0.55 * Math.max(0, envNow.sunIntensity / 3.5) + 0.2 * night;

    spillLight.intensity = night * 900;
    crestLight.intensity = night * 300;
    for (const light of hallLights) light.intensity = 620 + night * 420;
    if (powerhouse.heroSpot) powerhouse.heroSpot.intensity = 900 + night * 700;
    if (powerhouse.pitLight) powerhouse.pitLight.intensity = 260 + night * 160;
    for (const light of yardLights) light.intensity = night * 2600;
    damWash.intensity = night * 2600;
    powerhouse.hallLight.intensity = 240 + night * 520;

    /* fog / background */
    if (ownFog) {
      ownFog.color.copy(envNow.fogColor);
      ownFog.density = envNow.fogDensity;
    } else if (scene.fog && scene.fog.color) {
      scene.fog.color.copy(envNow.fogColor);
      if (scene.fog.isFogExp2) scene.fog.density = envNow.fogDensity;
    }
    if (ownBackground) ownBackground.copy(envNow.horizon).multiplyScalar(0.55 + night * 0.1);

    /* router */
    const cameraPose = sampleCameraPath(p, poseOut);
    if (camera && camera.position) {
      void cameraPose;
    }

    /* ---- spillway --------------------------------------------------------- */
    state.spillwayOpen += (state.spillwayTarget - state.spillwayOpen) * clamp01(dt * 2.2);
    if (Math.abs(state.spillwayOpen - state.spillwayTarget) < 0.001) state.spillwayOpen = state.spillwayTarget;
    const open = clamp01(state.spillwayOpen);

    for (let i = 0; i < spillway.gates.length; i += 1) {
      const gate = spillway.gates[i];
      // every gate has a slightly different setpoint, as if trimmed individually
      const trim = 1 - Math.abs(i - 2) * 0.035;
      gate.rotation.x = open * GATE.maxOpenAngle * trim;
    }

    const chuteU = spillway.chuteWater.uniforms;
    chuteU.uTime.value = t;
    chuteU.uDensity.value = 0.16 + 0.88 * open;
    chuteU.uOpacity.value = 0.28 + 0.66 * open;
    chuteU.uFlowSpeed.value = 1.4 + 2.6 * open;
    chuteU.uSunGlint.value = 0.55 + 0.45 * envNow.sunIntensity / 3.5;

    const poolU = spillway.plungePool.uniforms;
    poolU.uTime.value = t;
    poolU.uDensity.value = 0.55 + 0.45 * open;
    poolU.uOpacity.value = 0.72 + 0.26 * open;
    poolU.uFlowSpeed.value = 0.5 + 1.1 * open;

    if (spillway.mistPoints) {
      const mistU = spillway.mistPoints.userData.uniforms;
      mistU.uTime.value = t;
      mistU.uOpacity.value = 0.12 + 0.9 * open;
    }
    if (spillway.sprayPoints) {
      const sprayU = spillway.sprayPoints.userData.uniforms;
      sprayU.uTime.value = t;
      sprayU.uOpacity.value = 0.05 + 0.8 * open;
    }
    if (spillway.chuteSpray) {
      const mistU = spillway.chuteSpray.userData.uniforms;
      mistU.uTime.value = t;
      mistU.uOpacity.value = 0.1 + 0.7 * open;
    }
    if (spillway.glowPoints) {
      spillway.glowPoints.userData.uniforms.uOpacity.value = 0.05 + night * 0.95;
      spillway.glowPoints.userData.uniforms.uTime.value = t;
    }

    /* ---- water ------------------------------------------------------------ */
    const waveTime = t;
    if (reservoir.uniforms) reservoir.uniforms.uTime.value = waveTime;
    if (river.uniforms) river.uniforms.uTime.value = waveTime;
    river.uniforms.uFlowSpeed.value = 0.6 + 0.55 * ((state.spillwayOpen + 0.9) * 0.5);

    /* ---- penstocks -------------------------------------------------------- */
    for (const flow of penstocks.flows) {
      flow.uTime.value = t;
      flow.uFlow.value = 0.9 + 0.9 * (state.spillwayOpen * 0.2 + 0.9);
      flow.uGlow.value = 0.7 + 0.5 * night;
    }

    /* ---- turbine / generator --------------------------------------------- */
    const telemetry = sampleTelemetry(p, state.spillwayTarget);
    const rpm = 300 * clamp01(telemetry.turbineFlow / (4 * 132));
    state.runnerAngle += (rpm / 60) * Math.PI * 2 * dt;
    state.rotorAngle = state.runnerAngle;

    state.cutawayMix += (state.cutawayTarget - state.cutawayMix) * clamp01(dt * 3.4);
    if (Math.abs(state.cutawayMix - state.cutawayTarget) < 0.002) state.cutawayMix = state.cutawayTarget;
    // always emphasised a little harder while the camera is in the turbine hall
    const stationEmphasis = band(p, 0.56, 0.6, 0.76, 0.8);
    const cutaway = clamp01(state.cutawayMix * 0.72 + state.cutawayMix * stationEmphasis * 0.28 + stationEmphasis * 0.18);
    const reveal = clamp01(cutaway);

    for (const unit of powerhouse.units) {
      unit.runner.rotation.y = state.runnerAngle;
      unit.generator.rotor.rotation.y = state.rotorAngle;
      if (unit.generator.coils.material) {
        unit.generator.coils.material.emissiveIntensity = 0.22 + reveal * 0.75 + night * 0.35;
      }
      if (unit.casingCover) unit.casingCover.material.opacity = 1 - reveal;
      if (unit.housingCover) unit.housingCover.material.opacity = 1 - reveal;
      if (unit.energy) {
        unit.energy.userData.uniforms.uTime.value = t;
        unit.energy.userData.uniforms.uOpacity.value = 0.25 + reveal * 0.75;
      }
      if (unit.casingOpen) unit.casingOpen.material.opacity = 0.9 - reveal * 0.42;
    }
    for (const material of coverMaterials) {
      material.depthWrite = material.opacity > 0.55;
    }

    powerhouse.hallLight.intensity = 40 + night * 210;

    /* ---- window glow ------------------------------------------------------ */
    _windowColor.copy(envNow.sunColor);
    mats_window(envNow, night);

    /* ---- glow points: lamps and yard lights ------------------------------ */
    if (crest.glowPoints) {
      crest.glowPoints.userData.uniforms.uOpacity.value = 0.04 + night * 0.96;
      crest.glowPoints.userData.uniforms.uTime.value = t;
    }
    if (switchyard.glowPoints) {
      switchyard.glowPoints.userData.uniforms.uOpacity.value = 0.02 + night * 0.98;
      switchyard.glowPoints.userData.uniforms.uTime.value = t;
    }
    if (switchyard.controlGlow) {
      switchyard.controlGlow.userData.uniforms.uOpacity.value = 0.1 + night * 0.9;
    }
    if (valleyLights) {
      valleyLights.userData.uniforms.uOpacity.value = 0.02 + night * 0.98;
      valleyLights.userData.uniforms.uTime.value = t;
    }
    if (powerhouse.units[1] && powerhouse.units[1].energy) {
      // hero unit particles already driven above
    }

    /* ---- transformer hum visuals ----------------------------------------- */
    const hum = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 2.0);
    for (const material of [ctx.mats.busbar, ctx.mats.copperHot]) {
      if (!material) continue;
      material.emissiveIntensity = 0.18 + night * 0.5 + hum * 0.05;
    }

    /* ---- state ------------------------------------------------------------ */
    state.night = night;
    state.telemetry = telemetry;
  }

  function mats_window(envNow, night) {
    const material = ctx.mats.windowWall;
    if (!material) return;
    material.emissiveIntensity = 0.06 + night * 1.25;
    material.emissive.copy(envNow.sunColor).lerp(_windowColor.setHex(0xffc07a), 0.7 + night * 0.3);
  }

  /* ---- stats ------------------------------------------------------------- */
  let meshCount = 0;
  let instancedMeshes = 0;
  let pointCount = 0;
  let triangleCount = 0;
  let instanceTotal = 0;
  group.traverse((object) => {
    if (object.isInstancedMesh) {
      instancedMeshes += 1;
      instanceTotal += object.count;
    } else if (object.isMesh) {
      meshCount += 1;
    } else if (object.isPoints) {
      pointCount += 1;
    }
    if (object.isMesh && object.geometry) {
      const geometry = object.geometry;
      let tris = 0;
      if (geometry.index) tris = geometry.index.count / 3;
      else if (geometry.getAttribute('position')) tris = geometry.getAttribute('position').count / 3;
      if (object.isInstancedMesh) tris *= object.count;
      triangleCount += tris;
    }
  });

  const stats = {
    version: HYDRO_WORLD_VERSION,
    quality: cfg.quality,
    crestLength: 2 * LAYOUT.archHalfAngle * LAYOUT.archRadius,
    crestHeight: LAYOUT.crestY,
    reservoirLevel: LAYOUT.reservoirY,
    tailwaterLevel: LAYOUT.tailwaterY,
    drawables: meshCount,
    instancedMeshes,
    instances: instanceTotal,
    pointClouds: pointCount,
    triangles: Math.round(triangleCount),
    terrainVertices: terrain.geometry.getAttribute('position').count,
    trees: vegetation.trees,
    boulders: vegetation.boulders,
    gates: spillway.gates.length,
    penstocks: PENSTOCK.xs.length,
    turbines: powerhouse.units.length,
    transmissionTowers: switchyard.towers.length,
    shadowMapSize: cfg.shadows ? cfg.qualitySettings.shadowMapSize : 0,
  };

  /* ---- dispose ----------------------------------------------------------- */
  function dispose() {
    if (state.disposed) return;
    state.disposed = true;
    if (group.parent) group.parent.remove(group);
    group.traverse((object) => {
      if (object.geometry && typeof object.geometry.dispose === 'function') object.geometry.dispose();
      const material = object.material;
      if (!material) return;
      const list = Array.isArray(material) ? material : [material];
      for (const item of list) {
        if (item && typeof item.dispose === 'function') {
          try {
            item.dispose();
          } catch (error) {
            /* already freed */
          }
        }
      }
    });
    for (const texture of ctx.textures) {
      if (texture && typeof texture.dispose === 'function') texture.dispose();
    }
    if (envMap && typeof envMap.dispose === 'function') envMap.dispose();
    if (scene.fog === ownFog) scene.fog = previousFog;
    if (ownBackground && scene.background === ownBackground) scene.background = previousBackground;
  }

  /* ---- handle ------------------------------------------------------------ */
  const handle = {
    group,
    lights,
    sky: sky.mesh,
    terrain: terrain.mesh,
    reservoir: reservoir.mesh,
    river: river.mesh,
    dam: {
      body: dam.body,
      road: dam.roadMesh,
      parapets: dam.wallMesh,
      crest: dam.roadMesh,
      abutments: dam.abutments,
      intakeTowers: crest.intakeTowers,
      crane: crest.crane,
    },
    spillway: {
      group: spillway.group,
      gates: spillway.gates,
      chute: spillway.chuteMesh,
      basin: spillway.basinMesh,
      water: spillway.chuteWater.mesh,
      pool: spillway.plungePool.mesh,
      mist: spillway.mistPoints,
    },
    penstocks: {
      group: penstocks.group,
      count: PENSTOCK.xs.length,
      ducts: penstocks.flows.map((unused, index) => index),
    },
    turbine: {
      group: powerhouse.units[1] ? powerhouse.units[1].group : null,
      units: powerhouse.units.map((unit) => unit.group),
      runner: powerhouse.units[1] ? powerhouse.units[1].runner : null,
      generator: powerhouse.units[1] ? powerhouse.units[1].generator.group : null,
      rotor: powerhouse.units[1] ? powerhouse.units[1].generator.rotor : null,
      stator: powerhouse.units[1] ? powerhouse.units[1].generator.coils : null,
      scrollCase: powerhouse.units[1] ? powerhouse.units[1].scroll.group : null,
      cutaway: powerhouse.units[1]
        ? {
            casingCover: powerhouse.units[1].casingCover,
            housingCover: powerhouse.units[1].housingCover,
            casingShell: powerhouse.units[1].casingOpen,
            housingShell: powerhouse.units[1].housingOpen,
          }
        : null,
      heroIndex: 1,
    },
    powerhouse: {
      group: powerhouse.group,
      hall: powerhouse.interior,
      light: powerhouse.hallLight,
      windows: powerhouse.windows,
    },
    switchyard: {
      group: switchyard.group,
      towers: switchyard.towers,
      transformers: YARD.transformers.map((x) => ({ x, z: YARD.z, kv: LAYOUT.gridVoltageKv })),
    },
    getDamPose,
    setSpillwayOpen,
    setCutaway,
    update,
    dispose,
    getSpillwayOpen: () => state.spillwayTarget,
    isCutaway: () => state.cutawayTarget > 0.5,
    getGroundHeight: (x, z) => terrainHeight(x, z, cfg.seed),
    getPhase: (progress) => {
      const info = phaseAtProgress(progress);
      return { ...info.phase, index: info.index, local: info.local };
    },
    getEnvironment: (progress = 0) => {
      const sampled = sampleEnvironment(progress);
      return {
        sunElevation: sampled.sunElev,
        sunIntensity: sampled.sunIntensity,
        night: sampled.night,
        stars: sampled.stars,
        moon: sampled.moon,
        fogDensity: sampled.fogDensity,
        fogColor: sampled.fogColor.getHex(),
        zenith: sampled.zenith.getHex(),
        horizon: sampled.horizon.getHex(),
      };
    },
    getTelemetry: (progress = state.progress) => ({ ...sampleTelemetry(clamp01(progress), state.spillwayTarget) }),
    stations: DAM_PHASES,
    stats,
    config: cfg,
    state,
    THREE,
  };

  return handle;
}

export default createHydroWorld;
