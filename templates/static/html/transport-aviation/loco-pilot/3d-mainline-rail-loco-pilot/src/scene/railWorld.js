/**
 * railWorld.js
 * ============================================================================
 * A complete, 100 % procedural railway world for the "Loco Pilot" open-world
 * portfolio. Everything you see is built at runtime from Three.js geometry and
 * canvas-generated textures — no GLB models, no image files, no audio files, no
 * network requests.
 *
 * The journey is driven by a single number, `progress` in [0, 1], and follows
 * one continuous Catmull-Rom rail corridor of roughly four kilometres:
 *
 *   0.00 – 0.16  CAB DEPARTURE & ORIGIN YARD
 *                The camera sits inside the locomotive cab (drivers seat on the
 *                left, control desk, live speedometer, cab signal) looking out
 *                over the platform, the yard turnouts and a green departure
 *                signal in early morning light.
 *   0.16 – 0.38  COUNTRYSIDE & ROLLING HILLS
 *                Exterior three-quarter chase as the train accelerates through
 *                green hills, pine and broadleaf forest, farmsteads, level
 *                crossings and telegraph poles in bright daylight.
 *   0.38 – 0.58  STEEL TRUSS BRIDGE & GORGE
 *                A long through-truss steel viaduct on stone piers, crossing a
 *                winding river at golden hour, with the valley floor far below.
 *   0.58 – 0.75  MOUNTAIN TUNNEL & DUSK
 *                The line bores through a rock ridge: warm tunnel lamps rush
 *                past, the sound of the world muffles, and the far portal opens
 *                onto deep twilight.
 *   0.75 – 1.00  NIGHT MAINLINE & TERMINAL ARRIVAL
 *                Headlamp beam on gleaming rails, glowing red/amber/green signal
 *                gantries, a twinkling town, then a smooth stop alongside the
 *                illuminated platforms of the destination terminal.
 *
 * ----------------------------------------------------------------------------
 * WORLD CONTRACT
 * ----------------------------------------------------------------------------
 * Axes         +X = right of travel at the start, +Y = up, +Z = direction of
 *              travel at the origin. The corridor curves widely through the
 *              world; always use the track frame (see getRailPose) rather than
 *              assuming a direction.
 * Units        1 unit = 1 metre. Rail head top = the curve itself.
 * Gauge        1.435 m (standard gauge), rails at ±0.7175 m.
 * Track        One CatmullRomCurve3, arc-length parameterised. `progress`
 *              0 → 1 maps to the travelled distance (s) between S_START and
 *              S_END, so screen-space speed is constant for constant progress.
 *              The first S_START metres exist only so the coaches have track
 *              behind them at the start; the last 45 m give the train room to
 *              stop short of the buffer stop.
 * Cab eye      Local to the locomotive: (-1.02, 3.24, 7.15) — 3.24 m above the
 *              rail, on the left (driver) side, behind the raked nose.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   const world = createRailWorld(scene, options);
 *   const pose  = world.getRailPose(progress);   // 0..1
 *   world.update(elapsed, delta, progress, camera);
 *   world.dispose();
 *
 * getRailPose(progress) -> {
 *   cameraPos, lookAt,            THREE.Vector3 (new instances)
 *   trainPos, trainQuat,          locomotive body transform
 *   speedKmh, gradientPct,
 *   signalAspect,                 'green' | 'double-amber' | 'amber' | 'red'
 *   phaseName, phaseId, timeOfDay,
 *   progress, distance, inTunnel
 * }
 *
 * `update` animates the train, wheels, pantograph, lamps, signals, sky, sun,
 * fog, town lights and cab instruments. It never moves the camera; apply the
 * pose yourself (position + lookAt). The camera argument is optional and is
 * used only to keep the sky dome, shadow map and volumetric pools around the
 * viewer.
 *
 * Options
 *   quality   'high' (default) | 'medium' | 'low'
 *   seed      number, default 20261118
 *   shadows   boolean, default true (except 'low')
 *   addLights boolean, default true
 *   addSky    boolean, default true
 *   coaches   number of coaches behind the locomotive, default 5
 *   envMap    boolean, default true — procedural reflection probe for steel
 *
 * The module is deterministic: same seed → same world. It is safe to call from
 * Node (no WebGL): canvas textures are skipped and materials fall back to flat
 * colours, which keeps headless runtime tests meaningful.
 */

import * as THREE from 'three';

export const RAIL_WORLD_VERSION = '1.0.0';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/* ========================================================================== */
/*  Journey structure                                                         */
/* ========================================================================== */

/**
 * Phase table. `start`/`end` are progress values, inclusive on start and
 * exclusive on end (the last phase closes at 1).
 */
export const RAIL_PHASES = Object.freeze([
  { id: 'cab', name: 'Cab Departure — Origin Yard', shortName: 'Cab Departure', start: 0.0, end: 0.16, timeOfDay: 'morning' },
  { id: 'country', name: 'Countryside & Rolling Hills', shortName: 'Countryside', start: 0.16, end: 0.38, timeOfDay: 'daylight' },
  { id: 'bridge', name: 'Steel Truss Bridge & Gorge', shortName: 'Bridge & Gorge', start: 0.38, end: 0.58, timeOfDay: 'golden-hour' },
  { id: 'tunnel', name: 'Mountain Tunnel & Dusk', shortName: 'Mountain Tunnel', start: 0.58, end: 0.75, timeOfDay: 'dusk' },
  { id: 'night', name: 'Night Mainline & Terminal Arrival', shortName: 'Night Terminal', start: 0.75, end: 1.0, timeOfDay: 'night' },
]);

/** Structural landmarks, all in progress space so they always line up. */
const LANDMARK = Object.freeze({
  platformStart: 0.000,
  platformEnd: 0.058,
  yardEnd: 0.135,
  countryStart: 0.16,
  bridgeStart: 0.378,
  bridgeEnd: 0.566,
  tunnelStart: 0.588,
  tunnelEnd: 0.748,
  terminalStart: 0.944,
  terminalEnd: 1.0,
});

/** Metres of track kept behind the start and ahead of the stop. */
const S_START = 200;
const S_END_MARGIN = 45;

/** Track geometry constants (metres, relative to rail-head top). */
const GAUGE = 1.435;
const RAIL_HALF_GAUGE = GAUGE / 2;
const RAIL_HEIGHT = 0.172;
const SLEEPER_TOP = -RAIL_HEIGHT;
const SLEEPER_BOTTOM = SLEEPER_TOP - 0.2;
const BALLAST_TOP = SLEEPER_BOTTOM;
const CONTACT_WIRE_Y = 5.35;

/* ========================================================================== */
/*  Small maths helpers                                                       */
/* ========================================================================== */

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

function smootherstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Convert an sRGB component (0..1) to linear space, as vertex colours expect. */
function srgbToLinear(c) {
  const v = c <= 0 ? 0 : c >= 1 ? 1 : c;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function finite(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Trapezoid band: 0 outside [a, d], 1 inside [b, c], smooth on both flanks.
 */
function band(x, a, b, c, d) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return smoothstep(a, b, x);
  return 1 - smoothstep(c, d, x);
}

/** Deterministic 32-bit PRNG (mulberry32). */
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

function pick(random, list) {
  return list[Math.floor(random() * list.length) % list.length];
}

/* ------------------------------- value noise ------------------------------ */

function hash2i(x, y, seed) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

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
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm2(x, y, octaves = 4, seed = 0) {
  let sum = 0;
  let norm = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    sum += amp * noise2(x * freq, y * freq, seed + i * 131);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

function ridgeNoise(x, y, octaves = 4, seed = 0) {
  let sum = 0;
  let norm = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    const n = 1 - Math.abs(noise2(x * freq, y * freq, seed + i * 71) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    freq *= 2.11;
  }
  return sum / norm;
}

/* ========================================================================== */
/*  Quality presets                                                          */
/* ========================================================================== */

const QUALITY_PRESETS = {
  high: {
    name: 'high',
    shadows: true,
    shadowMapSize: 2048,
    shadowExtent: 95,
    terrainRows: 760,
    terrainCols: 49,
    terrainHalfWidth: 260,
    sleeperStep: 0.68,
    railStep: 2.0,
    ribbonStep: 2.4,
    mastSpacing: 46,
    wireSegments: 7,
    pines: 1900,
    broadleaf: 560,
    bushes: 700,
    rocks: 260,
    houses: 120,
    crossingCount: 2,
    townLights: 6200,
    townBuildings: 320,
    bridgeSpacing: 4.6,
    tunnelLampSpacing: 13,
    tunnelSamples: 5.0,
    signalSpacing: 0.032,
    platformLamps: 22,
    headlampBeam: true,
    glowSprites: true,
  },
  medium: {
    name: 'medium',
    shadows: true,
    shadowMapSize: 1024,
    shadowExtent: 80,
    terrainRows: 480,
    terrainCols: 37,
    terrainHalfWidth: 210,
    sleeperStep: 0.9,
    railStep: 2.8,
    ribbonStep: 3.4,
    mastSpacing: 58,
    wireSegments: 5,
    pines: 1000,
    broadleaf: 320,
    bushes: 380,
    rocks: 140,
    houses: 70,
    crossingCount: 2,
    townLights: 3400,
    townBuildings: 170,
    bridgeSpacing: 6.4,
    tunnelLampSpacing: 18,
    tunnelSamples: 7.0,
    signalSpacing: 0.042,
    platformLamps: 14,
    headlampBeam: true,
    glowSprites: true,
  },
  low: {
    name: 'low',
    shadows: false,
    shadowMapSize: 512,
    shadowExtent: 60,
    terrainRows: 300,
    terrainCols: 25,
    terrainHalfWidth: 160,
    sleeperStep: 1.3,
    railStep: 4.0,
    ribbonStep: 4.8,
    mastSpacing: 76,
    wireSegments: 3,
    pines: 460,
    broadleaf: 150,
    bushes: 160,
    rocks: 60,
    houses: 32,
    crossingCount: 1,
    townLights: 1600,
    townBuildings: 70,
    bridgeSpacing: 8.5,
    tunnelLampSpacing: 24,
    tunnelSamples: 9.0,
    signalSpacing: 0.055,
    platformLamps: 10,
    headlampBeam: false,
    glowSprites: false,
  },
};

function resolveConfig(options) {
  const requested = QUALITY_PRESETS[options.quality] ? options.quality : 'high';
  const quality = { ...QUALITY_PRESETS[requested] };
  if (options.shadows === false) quality.shadows = false;
  if (options.shadows === true) quality.shadows = requested !== 'low';
  return {
    quality,
    qualityName: requested,
    seed: Number.isFinite(options.seed) ? Math.floor(options.seed) : 20261118,
    addLights: options.addLights !== false,
    addSky: options.addSky !== false,
    envMap: options.envMap !== false,
    coachCount: Number.isFinite(options.coaches) ? clamp(Math.floor(options.coaches), 0, 9) : 5,
    trainLivery: options.livery || 'indigo',
  };
}

/* ========================================================================== */
/*  Procedural canvas textures                                               */
/* ========================================================================== */

const HAS_CANVAS =
  typeof document !== 'undefined' && typeof document.createElement === 'function';

function createCanvasTexture(width, height, draw, { repeat = true, srgb = true } = {}) {
  if (!HAS_CANVAS) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function makeBallastTexture(seed) {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    const random = mulberry32(seed ^ 0x9e3779b9);
    ctx.fillStyle = '#5f6469';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const r = 1 + random() * 4.2;
      const shade = 60 + Math.floor(random() * 95);
      const warm = random() < 0.18 ? 12 : 0;
      ctx.fillStyle = `rgb(${shade + warm},${shade + Math.floor(warm * 0.6)},${shade - Math.floor(warm * 0.2)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.6 + random() * 0.6), random() * TAU, 0, TAU);
      ctx.fill();
    }
    // faint oil staining down the centre of the track
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(20,22,24,0)');
    grad.addColorStop(0.5, 'rgba(20,22,24,0.22)');
    grad.addColorStop(1, 'rgba(20,22,24,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeConcreteTexture(seed) {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    const random = mulberry32(seed ^ 0x51ed270b);
    ctx.fillStyle = '#b9b7ae';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i += 1) {
      const shade = 150 + Math.floor(random() * 70);
      ctx.fillStyle = `rgba(${shade},${shade - 2},${shade - 8},${0.18 + random() * 0.3})`;
      const x = random() * w;
      const y = random() * h;
      ctx.fillRect(x, y, 1 + random() * 3, 1 + random() * 3);
    }
    ctx.strokeStyle = 'rgba(90,88,82,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const x = random() * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + random() * 8 - 4, h);
      ctx.stroke();
    }
  });
}

function makeWoodTexture(seed) {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    const random = mulberry32(seed ^ 0x2545f491);
    ctx.fillStyle = '#4a3a2c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i += 1) {
      const y = random() * h;
      const shade = 40 + Math.floor(random() * 55);
      ctx.strokeStyle = `rgba(${shade + 26},${shade + 8},${shade - 4},${0.3 + random() * 0.45})`;
      ctx.lineWidth = 0.6 + random() * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + random() * 6 - 3, w * 0.7, y + random() * 6 - 3, w, y + random() * 4 - 2);
      ctx.stroke();
    }
  });
}

function makeRustTexture(seed) {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    const random = mulberry32(seed ^ 0x68e31da4);
    ctx.fillStyle = '#6c6259';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2200; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const r = 1 + random() * 6;
      const tone = random();
      ctx.fillStyle =
        tone < 0.5
          ? `rgba(${120 + random() * 40},${70 + random() * 30},${40 + random() * 20},0.25)`
          : `rgba(${70 + random() * 30},${66 + random() * 25},${60 + random() * 20},0.3)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  });
}

function makeGroundTexture(seed) {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    const random = mulberry32(seed ^ 0x3f7a21b5);
    ctx.fillStyle = '#d6d6c6';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const r = 2 + random() * 16;
      const tone = random();
      if (tone < 0.5) {
        ctx.fillStyle = `rgba(${150 + random() * 30},${156 + random() * 28},${126 + random() * 26},0.12)`;
      } else {
        ctx.fillStyle = `rgba(${208 + random() * 32},${210 + random() * 30},${186 + random() * 30},0.10)`;
      }
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.5 + random() * 0.7), random() * TAU, 0, TAU);
      ctx.fill();
    }
    // fine grain
    for (let i = 0; i < 9000; i += 1) {
      const shade = 90 + Math.floor(random() * 90);
      ctx.fillStyle = `rgba(${shade},${shade + 4},${shade - 8},0.07)`;
      ctx.fillRect(random() * w, random() * h, 1.4, 1.4);
    }
  });
}

function makeSpeedometerTexture() {
  return createCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = w * 0.42;
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.15);
      glow.addColorStop(0, 'rgba(40,140,190,0.35)');
      glow.addColorStop(1, 'rgba(6,10,18,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // dial face
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fillStyle = '#0e1a2b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2b6f9c';
      ctx.stroke();

      // speed arc (0 .. 140 km/h over 240 degrees)
      const start = Math.PI * 0.75;
      const sweep = Math.PI * 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.86, start, start + sweep);
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(60,150,200,0.28)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.86, start + sweep * 0.72, start + sweep);
      ctx.strokeStyle = 'rgba(240,96,64,0.85)';
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i <= 14; i += 1) {
        const a = start + (sweep * i) / 14;
        const major = i % 2 === 0;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
        ctx.lineTo(Math.cos(a) * (major ? r * 0.64 : r * 0.7), Math.sin(a) * (major ? r * 0.64 : r * 0.7));
        ctx.lineWidth = major ? 2.6 : 1.2;
        ctx.strokeStyle = major ? '#d8eefc' : '#7da6c4';
        ctx.stroke();
        if (major) {
          ctx.save();
          ctx.translate(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52);
          ctx.rotate(a + Math.PI / 2);
          ctx.fillStyle = '#bcdcf0';
          ctx.font = `bold ${Math.round(w * 0.062)}px "Helvetica Neue", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i * 10), 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();

      ctx.fillStyle = '#7fd3ff';
      ctx.font = `bold ${Math.round(w * 0.058)}px "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('km/h', cx, cy + r * 0.36);
      ctx.fillStyle = '#4c7794';
      ctx.font = `${Math.round(w * 0.038)}px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillText('TRACTION  •  LINE 25 kV', cx, cy + r * 0.52);
    },
    { repeat: false }
  );
}

function makeSignTexture(main, sub, { bg = '#12233f', fg = '#f6ead0', accent = '#d9a441', width = 512, height = 160 } = {}) {
  return createCanvasTexture(
    width,
    height,
    (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(3, h * 0.03);
      ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (main) {
        ctx.fillStyle = fg;
        const size = Math.round(h * (sub ? 0.34 : 0.44));
        ctx.font = `bold ${size}px "Helvetica Neue", Arial, sans-serif`;
        ctx.fillText(main, w / 2, sub ? h * 0.4 : h * 0.5);
      }
      if (sub) {
        ctx.fillStyle = accent;
        const size = Math.round(h * 0.22);
        ctx.font = `600 ${size}px "Helvetica Neue", Arial, sans-serif`;
        ctx.fillText(sub, w / 2, h * 0.72);
      }
    },
    { repeat: false }
  );
}

function makeGlowTexture() {
  return createCanvasTexture(
    128,
    128,
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.16, 'rgba(255,244,214,0.92)');
      grad.addColorStop(0.38, 'rgba(255,206,128,0.42)');
      grad.addColorStop(0.7, 'rgba(255,170,80,0.08)');
      grad.addColorStop(1, 'rgba(255,160,70,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    { repeat: false }
  );
}

function makeHeadlampPoolTexture() {
  return createCanvasTexture(
    128,
    256,
    (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h * 0.82, 0, w / 2, h * 0.82, h * 0.9);
      grad.addColorStop(0, 'rgba(255,248,226,1)');
      grad.addColorStop(0.25, 'rgba(255,238,196,0.62)');
      grad.addColorStop(0.6, 'rgba(255,222,160,0.16)');
      grad.addColorStop(1, 'rgba(255,210,140,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    { repeat: false }
  );
}

function makeWindowTexture() {
  // A warm interior seen through a coach window: seats, luggage racks, two
  // reading lights. Repeated along the coach sides.
  return createCanvasTexture(128, 64, (ctx, w, h) => {
    const random = mulberry32(0x1234abcd);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffe9b8');
    grad.addColorStop(0.55, '#e8b978');
    grad.addColorStop(1, '#6b3f22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = `rgba(70,40,22,${0.25 + random() * 0.2})`;
      ctx.fillRect((i + 0.2) * (w / 3), h * 0.55, w * 0.16, h * 0.3);
    }
    ctx.fillStyle = 'rgba(255,255,235,0.85)';
    ctx.fillRect(w * 0.3, h * 0.12, w * 0.06, h * 0.1);
    ctx.fillRect(w * 0.72, h * 0.12, w * 0.06, h * 0.1);
  });
}

/* ========================================================================== */
/*  Procedural reflection probe                                              */
/* ========================================================================== */

/**
 * Tiny equirectangular sky/ground probe so steel, glass and paint have
 * something to reflect. Generated from a smooth gradient plus a warm sun lobe;
 * no image files involved.
 */
function createEnvironmentTexture() {
  const width = 128;
  const height = 64;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    const el = (0.5 - v) * Math.PI;
    const cosEl = Math.cos(el);
    const sinEl = Math.sin(el);
    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width;
      const az = u * TAU;
      const dx = cosEl * Math.cos(az);
      const dy = sinEl;
      const dz = cosEl * Math.sin(az);
      const up = clamp01(dy);
      const horizon = Math.exp(-Math.pow(dy * 5.0, 2));
      let r = 22 + up * 58 + horizon * 40;
      let g = 30 + up * 84 + horizon * 46;
      let b = 44 + up * 120 + horizon * 34;
      const down = clamp01(-dy);
      r += down * 20;
      g += down * 18;
      b += down * 12;
      // sun lobe towards -X/+Y/+Z
      const sunDot = dx * -0.62 + dy * 0.55 + dz * 0.56;
      if (sunDot > 0) {
        const glow = Math.pow(sunDot, 24) * 1.5;
        r += 255 * glow;
        g += 238 * glow;
        b += 196 * glow;
      }
      const i = (y * width + x) * 4;
      data[i] = Math.min(255, Math.round(r));
      data[i + 1] = Math.min(255, Math.round(g));
      data[i + 2] = Math.min(255, Math.round(b));
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/* ========================================================================== */
/*  Materials                                                                */
/* ========================================================================== */

function createMaterials(envMap, seed) {
  const textures = [];
  const materials = [];
  const track = (tex) => {
    if (tex) textures.push(tex);
    return tex;
  };

  const groundMap = track(makeGroundTexture(seed));
  const ballastMap = track(makeBallastTexture(seed));
  const concreteMap = track(makeConcreteTexture(seed));
  const woodMap = track(makeWoodTexture(seed));
  const rustMap = track(makeRustTexture(seed));
  const speedoMap = track(makeSpeedometerTexture());
  const glowMap = track(makeGlowTexture());
  const poolMap = track(makeHeadlampPoolTexture());
  const windowMap = track(makeWindowTexture());

  if (groundMap) groundMap.repeat.set(42, 9);
  if (ballastMap) ballastMap.repeat.set(1, 1);
  if (concreteMap) concreteMap.repeat.set(1, 1);
  if (woodMap) woodMap.repeat.set(1, 1);

  function standard(params, envIntensity = 0) {
    const material = new THREE.MeshStandardMaterial(params);
    if (envMap && envIntensity > 0) {
      material.envMap = envMap;
      material.envMapIntensity = envIntensity;
    }
    materials.push(material);
    return material;
  }

  function physical(params, envIntensity = 0) {
    const material = new THREE.MeshPhysicalMaterial(params);
    if (envMap && envIntensity > 0) {
      material.envMap = envMap;
      material.envMapIntensity = envIntensity;
    }
    materials.push(material);
    return material;
  }

  function basic(params) {
    const material = new THREE.MeshBasicMaterial(params);
    materials.push(material);
    return material;
  }

  const mats = {
    /* ground & track */
    ground: standard({
      color: 0xffffff,
      map: groundMap,
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: false,
    }),
    rock: standard({ vertexColors: true, roughness: 0.88, metalness: 0.02, flatShading: true }),
    ballast: standard({
      color: ballastMap ? 0xb9bcc0 : 0x686c71,
      map: ballastMap,
      roughness: 0.94,
      metalness: 0.02,
    }),
    sleeperConcrete: standard({
      color: concreteMap ? 0x86816f : 0x7d786c,
      map: concreteMap,
      roughness: 0.82,
      metalness: 0.03,
    }),
    sleeperWood: standard({
      color: woodMap ? 0xa08a72 : 0x584534,
      map: woodMap,
      roughness: 0.9,
      metalness: 0.0,
    }),
    railSteel: standard({ color: 0xb9c0c7, roughness: 0.22, metalness: 0.96 }, 1.25),
    railSide: standard({ color: 0x6a5b4c, roughness: 0.82, metalness: 0.55 }, 0.35),
    mastSteel: standard({ color: 0x6f7780, roughness: 0.55, metalness: 0.75 }, 0.55),
    wire: new THREE.LineBasicMaterial({ color: 0x2b2f33, transparent: true, opacity: 0.85 }),
    concreteLight: standard({ color: concreteMap ? 0xd8d4c8 : 0xc4c0b4, map: concreteMap, roughness: 0.9, metalness: 0.02 }),
    concreteDark: standard({ color: 0x8f8b80, roughness: 0.92, metalness: 0.02 }),

    /* bridge & tunnel */
    bridgeSteel: standard({ color: 0xa08a76, map: rustMap, roughness: 0.6, metalness: 0.72 }, 0.8),
    bridgeDeck: standard({ color: 0x5c5348, roughness: 0.85, metalness: 0.2 }),
    stone: standard({ color: 0x9a9184, roughness: 0.95, metalness: 0.0, flatShading: true }),
    tunnelWall: standard({ color: 0x8b8579, roughness: 0.94, metalness: 0.02, emissive: 0x16120c }),
    tunnelRock: standard({ color: 0x4c463d, roughness: 0.96, metalness: 0.0, flatShading: true }),
    tunnelFloor: standard({ color: 0x4a4741, roughness: 0.95, metalness: 0.02 }),
    lampGlass: basic({ color: 0xffd9a0 }),
    lampHousing: standard({ color: 0x2f2c27, roughness: 0.7, metalness: 0.4 }),

    /* water */
    water: physical(
      {
        color: 0x2c5a6e,
        roughness: 0.12,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      },
      1.4
    ),

    /* train */
    trainBody: physical(
      {
        color: 0x1d3358,
        roughness: 0.36,
        metalness: 0.4,
        clearcoat: 0.7,
        clearcoatRoughness: 0.22,
      },
      1.0
    ),
    trainBodyDeep: standard({ color: 0x11213b, roughness: 0.45, metalness: 0.35 }, 0.7),
    trainCream: standard({ color: 0xe9dfc4, roughness: 0.46, metalness: 0.15 }, 0.5),
    trainRed: standard({ color: 0xa8281f, roughness: 0.5, metalness: 0.2 }, 0.4),
    trainRoof: standard({ color: 0x3a3f45, roughness: 0.72, metalness: 0.35 }, 0.4),
    trainSkirt: standard({ color: 0x23262a, roughness: 0.8, metalness: 0.3 }, 0.3),
    glass: physical(
      {
        color: 0x223344,
        roughness: 0.08,
        metalness: 0.1,
        transparent: true,
        opacity: 0.42,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        side: THREE.DoubleSide,
      },
      1.6
    ),
    glassDark: standard({ color: 0x0d1622, roughness: 0.2, metalness: 0.35 }, 0.9),
    windowGlow: basic({
      color: 0xffcf8a,
      map: windowMap,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    }),
    wheel: standard({ color: 0x4b4f55, roughness: 0.42, metalness: 0.9 }, 0.9),
    bogie: standard({ color: 0x2b2e33, roughness: 0.7, metalness: 0.6 }, 0.4),
    pantograph: standard({ color: 0x8b9299, roughness: 0.38, metalness: 0.9 }, 0.8),
    headlampLens: basic({ color: 0xfff6dd }),
    ditchLamp: basic({ color: 0xfff0c4 }),
    tailLamp: basic({ color: 0xff3b2a }),

    /* cab interior */
    cabWall: standard({ color: 0x93a49d, roughness: 0.72, metalness: 0.12, emissive: 0x1d2a2a }),
    cabCeiling: standard({ color: 0xc3ccc6, roughness: 0.8, metalness: 0.05, emissive: 0x20282a }),
    cabFloor: standard({ color: 0x1b1f22, roughness: 0.95, metalness: 0.02 }),
    deskTop: standard({ color: 0x4a545f, roughness: 0.55, metalness: 0.3, emissive: 0x141a20 }),
    deskPanel: standard({ color: 0x333d47, roughness: 0.6, metalness: 0.25, emissive: 0x121920 }),
    screenGlow: basic({ color: 0x64e2ff }),
    screenAmber: basic({ color: 0xffb951 }),
    gaugeFace: basic({ map: speedoMap, color: 0xffffff, transparent: false }),
    leverMetal: standard({ color: 0x9aa2a8, roughness: 0.35, metalness: 0.9 }, 0.8),
    leverKnob: standard({ color: 0x8b1f16, roughness: 0.5, metalness: 0.2 }),
    seatFabric: standard({ color: 0x2b3d4d, roughness: 0.92, metalness: 0.0 }),

    /* signals & signage */
    signalPost: standard({ color: 0x63686c, roughness: 0.6, metalness: 0.7 }, 0.5),
    signalHead: standard({ color: 0x14181c, roughness: 0.7, metalness: 0.3 }),
    lensOff: standard({ color: 0x1a1d20, roughness: 0.35, metalness: 0.2, emissive: 0x000000 }),
    lensGreen: basic({ color: 0x37ff9b }),
    lensAmber: basic({ color: 0xffb32a }),
    lensRed: basic({ color: 0xff3524 }),
    signBoard: basic({ color: 0xffffff }),
    signBack: standard({ color: 0x2a2d31, roughness: 0.7, metalness: 0.3 }),

    /* scenery */
    trunk: standard({ color: 0x574434, roughness: 0.95, metalness: 0.0 }),
    pine: standard({ color: 0x405e33, roughness: 0.92, metalness: 0.0, flatShading: true }),
    pineLight: standard({ color: 0x577a41, roughness: 0.92, metalness: 0.0, flatShading: true }),
    broadleaf: standard({ color: 0x5d8044, roughness: 0.9, metalness: 0.0, flatShading: true }),
    bush: standard({ color: 0x4a6b38, roughness: 0.94, metalness: 0.0, flatShading: true }),
    grass: standard({ color: 0x6f8c46, roughness: 0.95, metalness: 0.0 }),
    houseWallA: standard({ color: 0xd8cdb6, roughness: 0.85, metalness: 0.02 }),
    houseWallB: standard({ color: 0xc0a98c, roughness: 0.88, metalness: 0.02 }),
    houseRoofA: standard({ color: 0x7c4436, roughness: 0.8, metalness: 0.05 }),
    houseRoofB: standard({ color: 0x4c5259, roughness: 0.8, metalness: 0.1 }),
    houseWindow: basic({ color: 0xffd79a }),
    townBuilding: standard({ color: 0x1c232c, roughness: 0.8, metalness: 0.15 }),
    townBuildingLight: standard({ color: 0x2a323a, roughness: 0.8, metalness: 0.15 }),
    platform: standard({ color: 0xa9a294, roughness: 0.88, metalness: 0.02 }),
    platformEdge: standard({ color: 0xe4dcc8, roughness: 0.8, metalness: 0.02 }),
    canopySteel: standard({ color: 0x5d646b, roughness: 0.55, metalness: 0.7 }, 0.5),
    canopyRoof: standard({ color: 0x8a8f93, roughness: 0.7, metalness: 0.35 }),
    stationWall: standard({ color: 0xb8a893, roughness: 0.85, metalness: 0.02 }),
    stationGlass: standard({ color: 0x1b2a38, roughness: 0.2, metalness: 0.4, emissive: 0x2a1c0a, emissiveIntensity: 1.0 }, 0.8),
    crossingTimber: standard({ color: 0x4a4036, roughness: 0.95, metalness: 0.0 }),
    road: standard({ color: 0x35383b, roughness: 0.96, metalness: 0.02 }),
    fence: standard({ color: 0x6b5c4a, roughness: 0.9, metalness: 0.05 }),
  };

  return { mats, textures, materials, glowMap, poolMap, windowMap, ballastMap };
}

/* ========================================================================== */
/*  GLSL: sky dome                                                           */
/* ========================================================================== */

const SKY_VERTEX = /* glsl */ `
varying vec3 vWorldDirection;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldDirection = normalize(world.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uMoonDirection;
uniform float uMoonIntensity;
uniform float uStars;
uniform float uCityGlow;
uniform vec3 uCityGlowColor;
uniform vec3 uSunsetColor;
uniform float uTime;

varying vec3 vWorldDirection;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 dir = normalize(vWorldDirection);
  float h = dir.y;
  float hClamped = clamp(h, -1.0, 1.0);

  // vertical gradient: horizon -> mid -> zenith
  float upT = pow(clamp(hClamped, 0.0, 1.0), 0.55);
  vec3 color = mix(uHorizon, uMid, smoothstep(0.0, 0.35, upT));
  color = mix(color, uZenith, smoothstep(0.25, 1.0, upT));

  // ground haze below the horizon
  color = mix(color, uGround, smoothstep(0.0, -0.22, hClamped));

  // sun: disc + broad halo + a low warm band near the horizon
  float sunDot = max(dot(dir, normalize(uSunDirection)), 0.0);
  float disc = smoothstep(0.99965, 0.99992, sunDot);
  float halo = pow(sunDot, 220.0) * 1.6 + pow(sunDot, 14.0) * 0.35 + pow(sunDot, 3.0) * 0.12;
  color += uSunColor * (disc * 3.2 + halo) * uSunIntensity;

  // warm afterglow hugging the horizon around the sun azimuth
  vec2 flatDir = normalize(dir.xz + vec2(1e-5));
  vec2 flatSun = normalize(normalize(uSunDirection).xz + vec2(1e-5));
  float az = max(dot(flatDir, flatSun), 0.0);
  color += uSunsetColor * pow(az, 3.0) * exp(-abs(h) * 8.0) * 0.5 * uSunIntensity;

  // moon
  float moonDot = max(dot(dir, normalize(uMoonDirection)), 0.0);
  float moonDisc = smoothstep(0.99955, 0.99985, moonDot);
  float moonHalo = pow(moonDot, 320.0) * 0.9 + pow(moonDot, 22.0) * 0.10;
  color += vec3(0.78, 0.86, 1.0) * (moonDisc * 1.8 + moonHalo) * uMoonIntensity;

  // stars (three layers of hashed cells, only above the horizon)
  if (uStars > 0.001 && h > -0.02) {
    vec3 sdir = normalize(dir);
    vec2 uv = vec2(atan(sdir.z, sdir.x) * 1.2732395, asin(clamp(sdir.y, -1.0, 1.0)) * 1.2732395);
    float stars = 0.0;
    for (int layer = 0; layer < 3; layer++) {
      float scale = 34.0 + float(layer) * 23.0;
      vec2 cell = floor(uv * scale);
      vec2 f = fract(uv * scale) - 0.5;
      float rnd = hash12(cell + float(layer) * 17.31);
      float rnd2 = hash12(cell.yx + 5.7 + float(layer) * 3.1);
      float threshold = 0.90 - float(layer) * 0.02;
      if (rnd > threshold) {
        float d = length(f - (vec2(rnd2, hash12(cell + 9.1)) - 0.5) * 0.7);
        float twinkle = 0.65 + 0.35 * sin(uTime * (1.4 + rnd2 * 3.0) + rnd * 40.0);
        stars += smoothstep(0.055, 0.0, d) * twinkle * (0.5 + rnd * 0.9);
      }
    }
    color += vec3(0.86, 0.92, 1.0) * stars * uStars * smoothstep(-0.02, 0.16, h);
  }

  // distant town glow along the horizon (night terminal)
  float hazeBand = exp(-abs(h) * 16.0);
  color += uCityGlowColor * hazeBand * uCityGlow * 0.55;

  // subtle dithering to avoid banding in the gradient
  float dither = (hash12(gl_FragCoord.xy) - 0.5) * 0.004;
  color += dither;

  gl_FragColor = vec4(color, 1.0);
}
`;

/* ========================================================================== */
/*  Track alignment                                                          */
/* ========================================================================== */

/**
 * Curvature schedule (radians per metre) and elevation schedule (metres),
 * integrated into a dense polyline. Keeping the alignment in "station metres"
 * lets us shape real vertical curves and generous horizontal radii instead of
 * eyeballing control points (which produces kinks and fold-over terrain).
 */
const CURVATURE_KEYS = [
  { s: 0, k: 0 },
  { s: 360, k: 0 },
  { s: 420, k: 0.00105 },
  { s: 700, k: 0.00105 },
  { s: 760, k: 0 },
  { s: 1150, k: 0 },
  { s: 1210, k: -0.00125 },
  { s: 1560, k: -0.00125 },
  { s: 1620, k: 0 },
  { s: 2520, k: 0 },
  { s: 2580, k: 0.0008 },
  { s: 2680, k: 0.00115 },
  { s: 3300, k: 0.00115 },
  { s: 3360, k: 0 },
  { s: 3680, k: 0 },
  { s: 3740, k: -0.00105 },
  { s: 4060, k: -0.00105 },
  { s: 4120, k: 0 },
  { s: 4400, k: 0 },
];

const ELEVATION_KEYS = [
  { s: 0, y: 2.0 },
  { s: 320, y: 2.3 },
  { s: 900, y: 6.0 },
  { s: 1400, y: 15.5 },
  { s: 1690, y: 25.4 },
  { s: 1760, y: 26.0 },
  { s: 2480, y: 26.2 },
  { s: 2570, y: 26.8 },
  { s: 2720, y: 30.2 },
  { s: 3080, y: 32.8 },
  { s: 3320, y: 33.2 },
  { s: 3620, y: 30.0 },
  { s: 3900, y: 22.0 },
  { s: 4120, y: 15.0 },
  { s: 4320, y: 11.2 },
  { s: 4400, y: 10.6 },
];

const TRACK_NOMINAL_LENGTH = 4400;

function catmullRom1D(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/** Smoothly sample a sorted [{s, value}] key table. */
function sampleSchedule(keys, s, valueKey) {
  if (s <= keys[0].s) return keys[0][valueKey];
  const last = keys[keys.length - 1];
  if (s >= last.s) return last[valueKey];
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1].s <= s) i += 1;
  const k1 = keys[i];
  const k2 = keys[i + 1];
  const k0 = keys[i - 1] || k1;
  const k3 = keys[i + 2] || k2;
  const t = (s - k1.s) / (k2.s - k1.s || 1);
  return catmullRom1D(k0[valueKey], k1[valueKey], k2[valueKey], k3[valueKey], t);
}

function generateTrackPoints() {
  const step = 2;
  const points = [];
  let heading = 0;
  let x = 0;
  let z = 0;
  for (let s = 0; s <= TRACK_NOMINAL_LENGTH; s += step) {
    points.push(new THREE.Vector3(x, sampleSchedule(ELEVATION_KEYS, s, 'y'), z));
    const k = sampleSchedule(CURVATURE_KEYS, s, 'k');
    const midHeading = heading + k * step * 0.5;
    x += Math.sin(midHeading) * step;
    z += Math.cos(midHeading) * step;
    heading += k * step;
  }
  return points;
}

/**
 * Build the single arc-length-parameterised curve used by everything else.
 */
function createTrackCurve() {
  const dense = generateTrackPoints();
  const controlPoints = [];
  for (let i = 0; i < dense.length; i += 6) controlPoints.push(dense[i]);
  if (controlPoints[controlPoints.length - 1] !== dense[dense.length - 1]) {
    controlPoints.push(dense[dense.length - 1]);
  }
  const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);
  curve.arcLengthDivisions = 6000;
  const length = curve.getLength();
  const sStart = Math.min(S_START, length * 0.15);
  const sEnd = Math.max(sStart + length * 0.5, length - S_END_MARGIN);
  return { curve, length, sStart, sEnd };
}

function sAtProgress(ctx, progress) {
  return ctx.sStart + clamp01(progress) * (ctx.sEnd - ctx.sStart);
}

function progressAtS(ctx, s) {
  return clamp01((s - ctx.sStart) / (ctx.sEnd - ctx.sStart || 1));
}

function uAtS(ctx, s) {
  return clamp01(s / ctx.length);
}

/* ------------------------------- track frame ------------------------------ */

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const _frameMatrix = new THREE.Matrix4();

function createFrame() {
  return {
    s: 0,
    u: 0,
    pos: new THREE.Vector3(),
    tangent: new THREE.Vector3(0, 0, 1),
    right: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    quat: new THREE.Quaternion(),
  };
}

/** Sample the track frame at a distance in metres from the start of the curve. */
function frameAtS(ctx, s, target = createFrame()) {
  const u = uAtS(ctx, s);
  target.s = s;
  target.u = u;
  ctx.curve.getPointAt(u, target.pos);
  ctx.curve.getTangentAt(u, target.tangent);
  if (target.tangent.lengthSq() < 1e-9) target.tangent.set(0, 0, 1);
  target.tangent.normalize();
  target.right.crossVectors(WORLD_UP, target.tangent);
  if (target.right.lengthSq() < 1e-6) target.right.set(1, 0, 0);
  target.right.normalize();
  target.up.crossVectors(target.tangent, target.right).normalize();
  _frameMatrix.makeBasis(target.right, target.up, target.tangent);
  target.quat.setFromRotationMatrix(_frameMatrix);
  return target;
}

function frameAtProgress(ctx, progress, target = createFrame()) {
  return frameAtS(ctx, sAtProgress(ctx, progress), target);
}

/** World point `lateral` metres right of the centreline, `height` above rail. */
function trackPointAt(ctx, s, lateral, height, target = new THREE.Vector3()) {
  const frame = frameAtS(ctx, s, _scratchFrame);
  return target
    .copy(frame.pos)
    .addScaledVector(frame.right, lateral)
    .addScaledVector(WORLD_UP, height);
}

/** World point from progress, lateral and height (handy for scenery). */
function trackPointAtProgress(ctx, progress, lateral, height, target = new THREE.Vector3()) {
  return trackPointAt(ctx, sAtProgress(ctx, progress), lateral, height, target);
}

const _scratchFrame = createFrame();
const _scratchFrameB = createFrame();

/* ========================================================================== */
/*  Ground field                                                             */
/* ========================================================================== */

/**
 * Ground height **relative to the rail head** at progress `p`, `d` metres to
 * the right of the centreline. One function drives the visual terrain, the
 * scenery placement, the gorge, the tunnel cutting and the station apron, so
 * everything agrees.
 */
function groundRelative(ctx, s, p, d) {
  const ad = Math.abs(d);
  const formation = -1.45 - 0.3 * smoothstep(3.4, 7.2, ad);

  // natural rolling countryside
  const nLow = fbm2(s * 0.0024, d * 0.0028, 4, ctx.seed) - 0.5;
  const nBig = fbm2(s * 0.0007, d * 0.0009, 2, ctx.seed + 41) - 0.5;
  const ridge = ridgeNoise(s * 0.0014, d * 0.0019, 3, ctx.seed + 7);
  let natural =
    2.0 +
    nLow * (16 + 30 * (nBig + 0.5)) +
    ridge * 30 * smoothstep(26, 230, ad) -
    1.6 * (1 - smoothstep(10, 40, ad));

  // flatten the origin yard and the destination apron
  const yardFlat = band(p, -0.02, 0.0, 0.075, 0.145);
  const terminalFlat = band(p, 0.928, 0.95, 1.0, 1.02);
  const flatScale = clamp(1 - 0.88 * yardFlat - 0.9 * terminalFlat, 0.06, 1);
  natural = formation + (natural - formation) * flatScale;

  let y = lerp(formation, natural, smoothstep(7.2, 48, ad));

  // ---------------------------------------------------------------- gorge --
  const gorge = band(p, 0.362, 0.392, 0.552, 0.582);
  if (gorge > 0.0001) {
    const wallNoise = fbm2(s * 0.004, d * 0.004, 3, ctx.seed + 91) - 0.5;
    const floorY = -50 + wallNoise * 7;
    const shelfY = -11 + wallNoise * 4;
    const wallT = smoothstep(16, 64, ad);
    const canyon = lerp(floorY, shelfY, wallT);
    const outer = smoothstep(64, 150, ad);
    y = lerp(y, lerp(canyon, y, outer), gorge);
  }

  // --------------------------------------------------------------- tunnel --
  const tunnel = band(p, 0.575, 0.6, 0.735, 0.762);
  if (tunnel > 0.0001) {
    const notch = 1 - smoothstep(11.5, 16.5, ad);
    const ridgeNoiseValue = ridgeNoise(s * 0.006, d * 0.004, 3, ctx.seed + 17);
    const ridgeHeight = 18 + 16 * ridgeNoiseValue + 10 * smoothstep(40, 180, ad);
    const rockFloor = -5.4;
    y = lerp(y, lerp(ridgeHeight, rockFloor, notch), tunnel);
  }

  return y;
}

function groundHeightAt(ctx, progress, lateral) {
  const p = clamp01(progress);
  const s = sAtProgress(ctx, p);
  const frame = frameAtS(ctx, s, _scratchFrame);
  return frame.pos.y + groundRelative(ctx, s, p, lateral);
}

/** Terrain colour, per vertex. */
function terrainColorAt(ctx, s, p, d, relY, slope, out) {
  const ad = Math.abs(d);
  const random = hash2i(Math.floor(s * 0.4), Math.floor(d * 0.4), ctx.seed + 3);
  const detail = fbm2(s * 0.05, d * 0.05, 2, ctx.seed + 61);
  const patch = fbm2(s * 0.011, d * 0.013, 2, ctx.seed + 83);

  let r = 0.40;
  let g = 0.48;
  let b = 0.22;

  // meadow greens, with lush hollows and drier crowns
  const lush = 1 - smoothstep(0.35, 0.75, detail);
  r = lerp(0.36, 0.53, detail) - lush * 0.06;
  g = lerp(0.46, 0.62, detail) - lush * 0.02;
  b = lerp(0.19, 0.29, detail) - lush * 0.05;
  const shade = fbm2(s * 0.004, d * 0.006, 3, ctx.seed + 121);
  const dark = smoothstep(0.55, 0.85, 1 - shade);
  r = lerp(r, 0.24, dark * 0.5);
  g = lerp(g, 0.34, dark * 0.5);
  b = lerp(b, 0.16, dark * 0.5);

  // warmer, drier fields in broad patches
  const field = smoothstep(0.55, 0.72, patch);
  r = lerp(r, 0.58, field * 0.85);
  g = lerp(g, 0.54, field * 0.85);
  b = lerp(b, 0.27, field * 0.85);

  // rock on steep ground
  const rockAmount = clamp01((slope - 0.55) * 1.9);
  r = lerp(r, 0.40 + random * 0.1, rockAmount);
  g = lerp(g, 0.38 + random * 0.09, rockAmount);
  b = lerp(b, 0.34 + random * 0.08, rockAmount);

  // ballast / cutting shoulders next to the track
  const shoulder = 1 - smoothstep(4.2, 9.0, ad);
  r = lerp(r, 0.30, shoulder);
  g = lerp(g, 0.29, shoulder);
  b = lerp(b, 0.28, shoulder);

  // gorge: bare rock on the walls, shingle and sand down by the water
  const gorge = band(p, 0.362, 0.392, 0.552, 0.582);
  if (gorge > 0.001) {
    const rockAmount = gorge * clamp01(0.45 + slope * 0.8);
    r = lerp(r, 0.40 + random * 0.08, rockAmount);
    g = lerp(g, 0.375 + random * 0.07, rockAmount);
    b = lerp(b, 0.34 + random * 0.06, rockAmount);
    const sand = smoothstep(-44, -49, relY);
    r = lerp(r, 0.58, gorge * sand * 0.75);
    g = lerp(g, 0.53, gorge * sand * 0.75);
    b = lerp(b, 0.42, gorge * sand * 0.75);
  }

  // tunnel cutting: bare rock
  const tunnel = band(p, 0.575, 0.6, 0.735, 0.762);
  if (tunnel > 0.001) {
    r = lerp(r, 0.30, tunnel * 0.85);
    g = lerp(g, 0.29, tunnel * 0.85);
    b = lerp(b, 0.27, tunnel * 0.85);
  }

  out[0] = srgbToLinear(r);
  out[1] = srgbToLinear(g);
  out[2] = srgbToLinear(b);
  return out;
}

/* ========================================================================== */
/*  Terrain mesh                                                             */
/* ========================================================================== */

function buildTerrain(ctx) {
  const { quality } = ctx;
  const rows = quality.terrainRows;
  const cols = quality.terrainCols;
  const halfWidth = quality.terrainHalfWidth;
  const total = ctx.length;
  const vertexCount = rows * cols;

  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = [];

  const frame = createFrame();
  const rgb = [0, 0, 0];
  const rowS = new Float32Array(rows);
  const rowP = new Float32Array(rows);
  const rowLateral = new Float32Array(cols);

  for (let c = 0; c < cols; c += 1) {
    const t = (c / (cols - 1)) * 2 - 1;
    // denser near the track, coarser towards the ridge lines
    rowLateral[c] = t * halfWidth * (0.32 + 0.68 * Math.abs(t));
  }

  for (let r = 0; r < rows; r += 1) {
    const s = (r / (rows - 1)) * total;
    rowS[r] = s;
    rowP[r] = progressAtS(ctx, s);
    frameAtS(ctx, s, frame);
    for (let c = 0; c < cols; c += 1) {
      const d = rowLateral[c];
      const relY = groundRelative(ctx, s, rowP[r], d);
      const index = (r * cols + c) * 3;
      positions[index] = frame.pos.x + frame.right.x * d;
      positions[index + 1] = frame.pos.y + relY;
      positions[index + 2] = frame.pos.z + frame.right.z * d;

      // slope approximation from the ground field
      const step = 3.2;
      const slope =
        (Math.abs(groundRelative(ctx, s, rowP[r], d + step) - groundRelative(ctx, s, rowP[r], d - step)) +
          Math.abs(
            groundRelative(ctx, s + step * 2, progressAtS(ctx, s + step * 2), d) -
              groundRelative(ctx, s - step * 2, progressAtS(ctx, s - step * 2), d)
          )) /
        (2 * step);
      terrainColorAt(ctx, s, rowP[r], d, relY, slope, rgb);
      const ci = (r * cols + c) * 3;
      colors[ci] = rgb[0];
      colors[ci + 1] = rgb[1];
      colors[ci + 2] = rgb[2];

      const ui = (r * cols + c) * 2;
      uvs[ui] = (d + halfWidth) / (halfWidth * 2);
      uvs[ui + 1] = s / 60;
    }
  }

  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const a = r * cols + c;
      const b = a + 1;
      const cNext = a + cols;
      const dNext = cNext + 1;
      indices.push(a, cNext, b, b, cNext, dNext);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry, ctx.mats.ground);
  mesh.name = 'terrain';
  mesh.receiveShadow = quality.shadows;
  mesh.castShadow = false;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();

  return { mesh, geometry, rowS, rowP, rowLateral };
}

/* ========================================================================== */
/*  Gorge river                                                              */
/* ========================================================================== */

function buildRiver(ctx) {
  const bridgeMidProgress = (LANDMARK.bridgeStart + LANDMARK.bridgeEnd) * 0.5;
  const sMid = sAtProgress(ctx, bridgeMidProgress);
  const frameMid = frameAtS(ctx, sMid, _scratchFrame);
  const waterLevel = frameMid.pos.y - 42.2;

  const lateralSteps = ctx.quality.name === 'low' ? 34 : 58;
  const acrossSteps = 5;
  const maxLateral = ctx.quality.terrainHalfWidth * 0.94;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= lateralSteps; i += 1) {
    const lateral = (i / lateralSteps) * 2 * maxLateral - maxLateral;
    const meander = 34 * Math.sin(lateral * 0.0061) + 15 * Math.sin(lateral * 0.0143 + 1.4);
    const halfWidth = 13 + 8 * fbm2(lateral * 0.01, 3.1, 2, ctx.seed + 13);
    for (let j = 0; j <= acrossSteps; j += 1) {
      const across = (j / acrossSteps) * 2 - 1;
      const s = sMid + meander + across * halfWidth;
      const frame = frameAtS(ctx, s, _scratchFrameB);
      const d = lateral + across * 2.5;
      positions.push(frame.pos.x + frame.right.x * d, waterLevel, frame.pos.z + frame.right.z * d);
      uvs.push((lateral + maxLateral) / 40, (across + 1) * 0.5);
    }
  }

  const stride = acrossSteps + 1;
  for (let i = 0; i < lateralSteps; i += 1) {
    for (let j = 0; j < acrossSteps; j += 1) {
      const a = i * stride + j;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, ctx.mats.water);
  mesh.name = 'gorgeRiver';
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  return { mesh, waterLevel, sMid };
}

/* ========================================================================== */
/*  Swept track geometry                                                     */
/* ========================================================================== */

/**
 * Sweep an open cross-section along the track.
 * profile: [[lateralOffset, heightAboveRail], ...] ordered left → right.
 */
function sweepProfile(ctx, sFrom, sTo, step, profile, lateralFn = null, uvLength = 2.4, target = null) {
  const rows = Math.max(2, Math.round((sTo - sFrom) / step) + 1);
  const cols = profile.length;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices = [];
  const frame = createFrame();

  // cumulative profile length for U
  const profileU = [0];
  for (let j = 1; j < cols; j += 1) {
    const dx = profile[j][0] - profile[j - 1][0];
    const dy = profile[j][1] - profile[j - 1][1];
    profileU.push(profileU[j - 1] + Math.hypot(dx, dy) / 2.4);
  }

  for (let r = 0; r < rows; r += 1) {
    const s = sFrom + ((sTo - sFrom) * r) / (rows - 1);
    frameAtS(ctx, s, frame);
    const lateral = lateralFn ? lateralFn(s) : 0;
    for (let c = 0; c < cols; c += 1) {
      const d = profile[c][0] + lateral;
      const y = profile[c][1];
      const i = (r * cols + c) * 3;
      positions[i] = frame.pos.x + frame.right.x * d;
      positions[i + 1] = frame.pos.y + y;
      positions[i + 2] = frame.pos.z + frame.right.z * d;
      const ui = (r * cols + c) * 2;
      uvs[ui] = profileU[c];
      uvs[ui + 1] = s / uvLength;
    }
  }

  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const a = r * cols + c;
      const b = a + 1;
      const next = a + cols;
      const nextB = next + 1;
      indices.push(a, next, b, b, next, nextB);
    }
  }

  const geometry = target && target.geometry ? target.geometry : new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Sweep a closed cross-section (rail profile) along the track. */
function sweepClosedProfile(ctx, sFrom, sTo, step, profile, lateralOffset, lateralFn = null) {
  const rows = Math.max(2, Math.round((sTo - sFrom) / step) + 1);
  const cols = profile.length;
  const positions = new Float32Array(rows * cols * 3);
  const indices = [];
  const frame = createFrame();

  for (let r = 0; r < rows; r += 1) {
    const s = sFrom + ((sTo - sFrom) * r) / (rows - 1);
    frameAtS(ctx, s, frame);
    const extra = lateralFn ? lateralFn(s) : 0;
    for (let c = 0; c < cols; c += 1) {
      const d = profile[c][0] + lateralOffset + extra;
      const y = profile[c][1];
      const i = (r * cols + c) * 3;
      positions[i] = frame.pos.x + frame.right.x * d;
      positions[i + 1] = frame.pos.y + y;
      positions[i + 2] = frame.pos.z + frame.right.z * d;
    }
  }

  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cNext = (c + 1) % cols;
      const a = r * cols + c;
      const b = r * cols + cNext;
      const next = (r + 1) * cols + c;
      const nextB = (r + 1) * cols + cNext;
      indices.push(a, next, b, b, next, nextB);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const RAIL_PROFILE = [
  [-0.072, -RAIL_HEIGHT],
  [-0.072, -0.132],
  [-0.026, -0.112],
  [-0.026, -0.048],
  [-0.038, -0.038],
  [-0.038, 0],
  [0.038, 0],
  [0.038, -0.038],
  [0.026, -0.048],
  [0.026, -0.112],
  [0.072, -0.132],
  [0.072, -RAIL_HEIGHT],
];

/* ========================================================================== */
/*  Permanent way                                                            */
/* ========================================================================== */

function buildBallast(ctx) {
  const halfWidth = 3.9;
  const profile = [
    [-halfWidth, -1.32],
    [-2.45, BALLAST_TOP],
    [2.45, BALLAST_TOP],
    [halfWidth, -1.32],
  ];
  const geometry = sweepProfile(ctx, 0, ctx.length, ctx.quality.ribbonStep, profile, null, 2.6);
  const mesh = new THREE.Mesh(geometry, ctx.mats.ballast);
  mesh.name = 'ballast';
  mesh.receiveShadow = ctx.quality.shadows;
  return mesh;
}

function buildRails(ctx) {
  const { quality } = ctx;
  const geometries = [];
  for (const offset of [-RAIL_HALF_GAUGE, RAIL_HALF_GAUGE]) {
    geometries.push(
      sweepClosedProfile(ctx, 0, ctx.length, quality.railStep, RAIL_PROFILE, offset, null)
    );
  }

  // merge the two rails into one buffer geometry (positions + indices)
  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of geometries) {
    totalVerts += g.getAttribute('position').count;
    totalIndices += g.index.count;
  }
  const positions = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);
  let vOffset = 0;
  let iOffset = 0;
  for (const g of geometries) {
    const pos = g.getAttribute('position').array;
    positions.set(pos, vOffset * 3);
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i += 1) indices[iOffset + i] = idx[i] + vOffset;
    vOffset += g.getAttribute('position').count;
    iOffset += idx.length;
    g.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, ctx.mats.railSteel);
  mesh.name = 'rails';
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function buildSleepers(ctx) {
  const { quality, mats } = ctx;
  const step = quality.sleeperStep;
  const count = Math.max(2, Math.floor(ctx.length / step));
  const geometry = new THREE.BoxGeometry(2.62, 0.2, 0.27);
  const group = new THREE.Group();
  group.name = 'sleepers';

  const areas = [
    { material: mats.sleeperWood, predicate: (p) => p < 0.14 || (p > 0.94 && p < 1.001) },
    { material: mats.sleeperConcrete, predicate: () => true },
  ];

  for (const area of areas) {
    const matrices = [];
    const frame = createFrame();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    for (let i = 0; i < count; i += 1) {
      const s = i * step + step * 0.5;
      const p = progressAtS(ctx, s);
      if (!area.predicate(p)) continue;
      frameAtS(ctx, s, frame);
      position
        .copy(frame.pos)
        .addScaledVector(frame.right, 0)
        .addScaledVector(WORLD_UP, SLEEPER_TOP - 0.1);
      matrix.compose(position, frame.quat, new THREE.Vector3(1, 1, 1));
      matrices.push(matrix.clone());
    }
    if (!matrices.length) continue;
    const instanced = new THREE.InstancedMesh(geometry, area.material, matrices.length);
    instanced.name = 'sleeperBatch';
    instanced.castShadow = false;
    instanced.receiveShadow = quality.shadows;
    for (let i = 0; i < matrices.length; i += 1) instanced.setMatrixAt(i, matrices[i]);
    instanced.instanceMatrix.needsUpdate = true;
    group.add(instanced);
  }

  return group;
}

function buildFastenings(ctx) {
  const { quality, mats } = ctx;
  if (quality.name === 'low') return null;
  const step = quality.sleeperStep;
  const count = Math.floor(ctx.length / step);
  const geometry = new THREE.BoxGeometry(0.2, 0.06, 0.16);
  const matrices = [];
  const frame = createFrame();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < count; i += 1) {
    const s = i * step + step * 0.5;
    frameAtS(ctx, s, frame);
    for (const side of [-1, 1]) {
      position
        .copy(frame.pos)
        .addScaledVector(frame.right, side * RAIL_HALF_GAUGE)
        .addScaledVector(WORLD_UP, SLEEPER_TOP + 0.02);
      matrix.compose(position, frame.quat, scale);
      matrices.push(matrix.clone());
    }
  }
  const instanced = new THREE.InstancedMesh(geometry, mats.bogie, matrices.length);
  instanced.name = 'railFastenings';
  instanced.castShadow = false;
  instanced.receiveShadow = false;
  for (let i = 0; i < matrices.length; i += 1) instanced.setMatrixAt(i, matrices[i]);
  instanced.instanceMatrix.needsUpdate = true;
  return instanced;
}

function buildCableTrough(ctx) {
  if (ctx.quality.name === 'low') return null;
  const step = 2.6;
  const count = Math.floor(ctx.length / step);
  const geometry = new THREE.BoxGeometry(0.42, 0.26, step * 0.96);
  const matrices = [];
  const frame = createFrame();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < count; i += 1) {
    const s = i * step;
    frameAtS(ctx, s, frame);
    position
      .copy(frame.pos)
      .addScaledVector(frame.right, 4.15)
      .addScaledVector(WORLD_UP, -1.28);
    matrix.compose(position, frame.quat, scale);
    matrices.push(matrix.clone());
  }
  const instanced = new THREE.InstancedMesh(geometry, ctx.mats.concreteDark, matrices.length);
  instanced.name = 'cableTrough';
  instanced.receiveShadow = ctx.quality.shadows;
  for (let i = 0; i < matrices.length; i += 1) instanced.setMatrixAt(i, matrices[i]);
  instanced.instanceMatrix.needsUpdate = true;
  return instanced;
}

/* ------------------------------- catenary --------------------------------- */

function bakedBox(w, h, d, tx, ty, tz, rz = 0, rx = 0) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  if (rz) geometry.rotateZ(rz);
  if (rx) geometry.rotateX(rx);
  geometry.translate(tx, ty, tz);
  return geometry;
}

function buildCatenary(ctx) {
  const { quality, mats } = ctx;
  const spacing = quality.mastSpacing;
  const mastCount = Math.max(2, Math.floor(ctx.length / spacing));
  const group = new THREE.Group();
  group.name = 'catenary';

  const postGeometry = bakedBox(0.24, 7.6, 0.24, 0, 2.8, 0);
  const armGeometry = bakedBox(3.55, 0.13, 0.13, -1.72, 6.34, 0);
  const braceGeometry = bakedBox(4.05, 0.1, 0.1, -1.9, 6.0, 0, 0.36);
  const registrationGeometry = bakedBox(1.5, 0.08, 0.08, -2.55, 5.5, 0);
  const insulatorGeometry = new THREE.CylinderGeometry(0.09, 0.11, 0.3, 6);

  const frames = [];
  const frame = createFrame();
  for (let i = 0; i < mastCount; i += 1) {
    const s = i * spacing + 12;
    const p = progressAtS(ctx, s);
    if (p > 0.585 && p < 0.752) continue; // no masts inside the tunnel
    frameAtS(ctx, s, frame);
    frames.push({ s, side: i % 2 === 0 ? 1 : -1, quat: frame.quat.clone(), pos: frame.pos.clone(), right: frame.right.clone() });
  }

  const right = frames.filter((f) => f.side === 1);
  const left = frames.filter((f) => f.side === -1);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const flip = new THREE.Quaternion().setFromAxisAngle(WORLD_UP, Math.PI);

  function makeInstanced(geometry, items, mirrored, material, name, shadow = false) {
    if (!items.length) return null;
    const instanced = new THREE.InstancedMesh(geometry, material, items.length);
    instanced.name = name;
    instanced.castShadow = shadow && quality.shadows;
    instanced.receiveShadow = false;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      position.copy(item.pos).addScaledVector(item.right, 3.55 * item.side).addScaledVector(WORLD_UP, 0);
      if (mirrored) {
        instanced.setMatrixAt(i, matrix.compose(position, item.quat.clone().multiply(flip), scale));
      } else {
        instanced.setMatrixAt(i, matrix.compose(position, item.quat, scale));
      }
    }
    instanced.instanceMatrix.needsUpdate = true;
    return instanced;
  }

  const metal = mats.mastSteel;
  group.add(makeInstanced(postGeometry, frames, false, metal, 'mastPosts', true));
  const armR = makeInstanced(armGeometry, right, false, metal, 'mastArmsR');
  const armL = makeInstanced(armGeometry, left, true, metal, 'mastArmsL');
  if (armR) group.add(armR);
  if (armL) group.add(armL);
  const braceR = makeInstanced(braceGeometry, right, false, metal, 'mastBracesR');
  const braceL = makeInstanced(braceGeometry, left, true, metal, 'mastBracesL');
  if (braceR) group.add(braceR);
  if (braceL) group.add(braceL);
  const regR = makeInstanced(registrationGeometry, right, false, metal, 'mastRegR');
  const regL = makeInstanced(registrationGeometry, left, true, metal, 'mastRegL');
  if (regR) group.add(regR);
  if (regL) group.add(regL);

  // insulators on every arm
  const insulators = [];
  for (const item of frames) {
    const p = position
      .copy(item.pos)
      .addScaledVector(item.right, 3.55 * item.side)
      .addScaledVector(WORLD_UP, 6.5);
    insulators.push({ pos: p.clone(), quat: item.quat });
  }
  if (insulators.length) {
    const instanced = new THREE.InstancedMesh(insulatorGeometry, mats.concreteLight, insulators.length);
    instanced.name = 'mastInsulators';
    for (let i = 0; i < insulators.length; i += 1) {
      instanced.setMatrixAt(i, matrix.compose(insulators[i].pos, insulators[i].quat, scale));
    }
    instanced.instanceMatrix.needsUpdate = true;
    group.add(instanced);
  }

  /* ---- wires: contact wire with stagger, messenger with sag, droppers ---- */
  const wirePositions = [];
  const segments = quality.wireSegments;
  const staggerAmplitude = 0.22;

  function wirePoint(s, lateral, y) {
    frameAtS(ctx, s, _scratchFrameB);
    return [
      _scratchFrameB.pos.x + _scratchFrameB.right.x * lateral,
      _scratchFrameB.pos.y + y,
      _scratchFrameB.pos.z + _scratchFrameB.right.z * lateral,
    ];
  }

  let previous = null;
  let index = 0;
  for (let s = 0; s <= ctx.length; s += spacing) {
    const stagger = index % 2 === 0 ? staggerAmplitude : -staggerAmplitude;
    const current = { s, stagger };
    if (previous) {
      const pMid = progressAtS(ctx, (previous.s + current.s) * 0.5);
      const inTunnel = pMid > 0.575 && pMid < 0.762;
      if (!inTunnel) {
        for (let j = 0; j < segments; j += 1) {
          const t0 = j / segments;
          const t1 = (j + 1) / segments;
          const s0 = lerp(previous.s, current.s, t0);
          const s1 = lerp(previous.s, current.s, t1);
          const lat0 = lerp(previous.stagger, current.stagger, t0);
          const lat1 = lerp(previous.stagger, current.stagger, t1);
          const sag0 = 0.45 * 4 * t0 * (1 - t0);
          const sag1 = 0.45 * 4 * t1 * (1 - t1);
          wirePositions.push(...wirePoint(s0, lat0, CONTACT_WIRE_Y + sag0 * 0.15));
          wirePositions.push(...wirePoint(s1, lat1, CONTACT_WIRE_Y + sag1 * 0.15));
          wirePositions.push(...wirePoint(s0, lat0, CONTACT_WIRE_Y + 1.15 - sag0));
          wirePositions.push(...wirePoint(s1, lat1, CONTACT_WIRE_Y + 1.15 - sag1));
        }
        // droppers
        for (let j = 1; j < 3; j += 1) {
          const t = j / 3;
          const sAt = lerp(previous.s, current.s, t);
          const lat = lerp(previous.stagger, current.stagger, t);
          const sag = 0.45 * 4 * t * (1 - t);
          wirePositions.push(...wirePoint(sAt, lat, CONTACT_WIRE_Y + sag * 0.15));
          wirePositions.push(...wirePoint(sAt, lat, CONTACT_WIRE_Y + 1.15 - sag));
        }
      }
    }
    previous = current;
    index += 1;
  }

  if (wirePositions.length) {
    const wireGeometry = new THREE.BufferGeometry();
    wireGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wirePositions, 3));
    const wires = new THREE.LineSegments(wireGeometry, mats.wire);
    wires.name = 'catenaryWires';
    wires.frustumCulled = false;
    group.add(wires);
  }

  return group;
}

/* ========================================================================== */
/*  Platform, canopy and station building                                    */
/* ========================================================================== */

function buildStationPlatform(ctx, { sFrom, sTo, side = -1, edge = 2.55, width = 7.0, top = 0.95, canopy = true, lamps = 8, signTexture = null }) {
  const group = new THREE.Group();
  group.name = 'platform';
  const edgeLateral = side * edge;
  const farLateral = side * (edge + width);

  const topProfile = [
    [Math.min(edgeLateral, farLateral), top],
    [Math.max(edgeLateral, farLateral), top],
  ];
  const geometry = sweepProfile(ctx, sFrom, sTo, ctx.quality.ribbonStep * 1.6, topProfile, null, 3.0);
  const deck = new THREE.Mesh(geometry, ctx.mats.platform);
  deck.receiveShadow = ctx.quality.shadows;
  deck.castShadow = false;
  group.add(deck);

  // leading edge kerb (vertical face towards the track)
  const kerbProfile = [
    [edgeLateral, top],
    [edgeLateral, -1.15],
  ];
  const kerbGeometry = sweepProfile(ctx, sFrom, sTo, ctx.quality.ribbonStep * 1.6, kerbProfile, null, 3.0);
  const kerbMaterial = ctx.mats.platformEdge.clone();
  kerbMaterial.side = THREE.DoubleSide;
  ctx.materials.push(kerbMaterial);
  const kerb = new THREE.Mesh(kerbGeometry, kerbMaterial);
  group.add(kerb);

  // tactile warning strip along the edge
  const stripProfile = [
    [edgeLateral + side * 0.05, top + 0.012],
    [edgeLateral + side * 0.62, top + 0.012],
  ];
  const strip = new THREE.Mesh(
    sweepProfile(ctx, sFrom, sTo, ctx.quality.ribbonStep * 2, stripProfile, null, 3.0),
    ctx.mats.trainCream
  );
  group.add(strip);

  // canopy
  if (canopy) {
    const canopyProfile = [
      [Math.min(edgeLateral - side * 0.4, farLateral), 6.3],
      [Math.max(edgeLateral - side * 0.4, farLateral), 6.3],
    ];
    const roof = new THREE.Mesh(
      sweepProfile(ctx, sFrom, sTo, ctx.quality.ribbonStep * 1.8, canopyProfile, null, 4),
      ctx.mats.canopyRoof
    );
    roof.castShadow = ctx.quality.shadows;
    roof.receiveShadow = false;
    group.add(roof);

    // fascia along the platform edge
    const fascia = new THREE.Mesh(
      sweepProfile(
        ctx,
        sFrom,
        sTo,
        ctx.quality.ribbonStep * 1.8,
        [
          [edgeLateral - side * 0.4, 6.3],
          [edgeLateral - side * 0.4, 5.9],
        ],
        null,
        4
      ),
      ctx.mats.canopySteel
    );
    fascia.material.side = THREE.DoubleSide;
    group.add(fascia);

    // columns
    const columnCount = Math.max(2, Math.floor((sTo - sFrom) / 11));
    const columnGeometry = new THREE.CylinderGeometry(0.16, 0.2, 5.4, 8);
    const posts = new THREE.InstancedMesh(columnGeometry, ctx.mats.canopySteel, columnCount);
    posts.castShadow = ctx.quality.shadows;
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < columnCount; i += 1) {
      const s = sFrom + ((sTo - sFrom) * (i + 0.5)) / columnCount;
      const point = trackPointAt(ctx, s, side * (edge + width - 1.6), top + 2.7);
      posts.setMatrixAt(i, matrix.compose(point, new THREE.Quaternion(), scale));
    }
    posts.instanceMatrix.needsUpdate = true;
    group.add(posts);

    // platform lamps under the canopy
    const lampGeometry = new THREE.SphereGeometry(0.17, 8, 6);
    const lampCount = Math.max(2, lamps);
    const lampMesh = new THREE.InstancedMesh(lampGeometry, ctx.mats.lampGlass, lampCount);
    for (let i = 0; i < lampCount; i += 1) {
      const s = sFrom + ((sTo - sFrom) * (i + 0.5)) / lampCount;
      const point = trackPointAt(ctx, s, side * (edge + width * 0.45), 5.9);
      lampMesh.setMatrixAt(i, matrix.compose(point, new THREE.Quaternion(), scale));
    }
    lampMesh.instanceMatrix.needsUpdate = true;
    group.add(lampMesh);

    // glow points for the lamps (single draw call)
    if (ctx.glowMap) {
      const positions = [];
      for (let i = 0; i < lampCount; i += 1) {
        const s = sFrom + ((sTo - sFrom) * (i + 0.5)) / lampCount;
        const point = trackPointAt(ctx, s, side * (edge + width * 0.45), 5.85);
        positions.push(point.x, point.y, point.z);
      }
      const glowGeometry = new THREE.BufferGeometry();
      glowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const glow = new THREE.Points(
        glowGeometry,
        new THREE.PointsMaterial({
          map: ctx.glowMap,
          color: 0xffd9a2,
          size: 4.6,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      ctx.materials.push(glow.material);
      glow.name = 'platformLampGlow';
      group.add(glow);
      ctx.glowSystems.push(glow);
    }
  }

  // station name board hanging from the canopy
  const sign = signTexture || ctx.signTexture;
  if (sign) {
    const boardMaterial = new THREE.MeshBasicMaterial({ map: sign, transparent: false });
    ctx.materials.push(boardMaterial);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.44), boardMaterial);
    const sMid = (sFrom + sTo) * 0.5;
    const point = trackPointAt(ctx, sMid, side * (edge + width * 0.5), 4.7);
    const frame = frameAtS(ctx, sMid, _scratchFrameB);
    board.position.copy(point);
    board.quaternion.copy(frame.quat);
    board.rotateY(side < 0 ? Math.PI / 2 : -Math.PI / 2);
    group.add(board);
    group.userData.board = board;
  }

  return group;
}

/* ========================================================================== */
/*  Instancing helpers                                                       */
/* ========================================================================== */

function instancedFrom(ctx, geometry, material, items, name, options = {}) {
  if (!items || !items.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  mesh.name = name;
  mesh.castShadow = !!options.castShadow && ctx.quality.shadows;
  mesh.receiveShadow = !!options.receiveShadow && ctx.quality.shadows;
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    quat.copy(item.quaternion || IDENTITY_QUAT);
    if (item.yaw) quat.multiply(new THREE.Quaternion().setFromAxisAngle(WORLD_UP, item.yaw));
    scale.set(item.scaleX == null ? 1 : item.scaleX, item.scaleY == null ? 1 : item.scaleY, item.scaleZ == null ? 1 : item.scaleZ);
    if (item.scale != null) scale.setScalar(item.scale);
    matrix.compose(item.position, quat, scale);
    mesh.setMatrixAt(i, matrix);
    if (item.color) mesh.setColorAt(i, item.color);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

const IDENTITY_QUAT = new THREE.Quaternion();

/** Merge simple non-indexed-index geometries that share the same attributes. */
function mergeGeometryList(list) {
  const arrays = { position: [], normal: [], uv: [] };
  let vertexOffset = 0;
  const indices = [];
  for (const geometry of list) {
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < position.array.length; i += 1) arrays.position.push(position.array[i]);
    if (normal) for (let i = 0; i < normal.array.length; i += 1) arrays.normal.push(normal.array[i]);
    else for (let i = 0; i < position.count * 3; i += 1) arrays.normal.push(0);
    if (uv) for (let i = 0; i < uv.array.length; i += 1) arrays.uv.push(uv.array[i]);
    else for (let i = 0; i < position.count * 2; i += 1) arrays.uv.push(0);
    if (geometry.index) {
      const index = geometry.index.array;
      for (let i = 0; i < index.length; i += 1) indices.push(index[i] + vertexOffset);
    } else {
      for (let i = 0; i < position.count; i += 1) indices.push(i + vertexOffset);
    }
    vertexOffset += position.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(arrays.position, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normal, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(arrays.uv, 2));
  merged.setIndex(indices);
  merged.computeVertexNormals();
  return merged;
}

/* ========================================================================== */
/*  Scenery sampling                                                         */
/* ========================================================================== */

function isBridgeProgress(p) {
  return p > LANDMARK.bridgeStart - 0.02 && p < LANDMARK.bridgeEnd + 0.02;
}

function isTunnelProgress(p) {
  return p > LANDMARK.tunnelStart - 0.012 && p < LANDMARK.tunnelEnd + 0.012;
}

function isStationProgress(p) {
  return p < 0.13 || p > LANDMARK.terminalStart - 0.02;
}

/**
 * Pick a scenic spot beside the line and return its world position plus the
 * terrain data that placed it. Returns null when the candidate is unusable.
 */
function sampleScenerySpot(ctx, random, options = {}) {
  const {
    pMin = 0.0,
    pMax = 1.0,
    lateralMin = 9,
    lateralMax = ctx.quality.terrainHalfWidth * 0.82,
    minSeparation = 0,
    allowBridge = false,
    allowTunnel = false,
    allowStation = false,
    maxSlope = 2.4,
  } = options;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const p = randRange(random, pMin, pMax);
    if (!allowStation && isStationProgress(p)) continue;
    if (!allowBridge && isBridgeProgress(p)) continue;
    if (!allowTunnel && isTunnelProgress(p)) continue;
    const side = random() < 0.5 ? -1 : 1;
    const lateral = side * randRange(random, lateralMin, lateralMax);
    const s = sAtProgress(ctx, p);
    const relY = groundRelative(ctx, s, p, lateral);
    const relY2 = groundRelative(ctx, s, p, lateral + side * 3.5);
    const slope = Math.abs(relY2 - relY) / 3.5;
    if (slope > maxSlope) continue;
    if (isBridgeProgress(p) && relY < -30) continue;
    const frame = frameAtS(ctx, s, _scratchFrame);
    const position = new THREE.Vector3(
      frame.pos.x + frame.right.x * lateral,
      frame.pos.y + relY,
      frame.pos.z + frame.right.z * lateral
    );
    return { p, s, side, lateral, relY, position, frame };
  }
  return null;
}

/* ========================================================================== */
/*  Vegetation                                                               */
/* ========================================================================== */

function buildVegetation(ctx) {
  const { quality, seed } = ctx;
  const random = mulberry32(seed ^ 0x1a2b3c4d);
  const group = new THREE.Group();
  group.name = 'vegetation';

  const pinesDark = [];
  const pinesLight = [];
  const trunks = [];
  const crowns = [];
  const bushes = [];

  const pineConeGeometry = new THREE.ConeGeometry(1, 1, 7, 3);
  pineConeGeometry.translate(0, 0.5, 0);
  const trunkGeometry = new THREE.CylinderGeometry(0.09, 0.14, 1, 5);
  trunkGeometry.translate(0, 0.5, 0);
  const crownGeometry = new THREE.IcosahedronGeometry(1, 0);
  crownGeometry.translate(0, 0.5, 0);
  const bushGeometry = new THREE.IcosahedronGeometry(1, 0);

  // pines on the hillsides
  for (let i = 0; i < quality.pines; i += 1) {
    const spot = sampleScenerySpot(ctx, random, { lateralMin: 12, maxSlope: 2.0 });
    if (!spot) continue;
    if (spot.p > LANDMARK.bridgeStart - 0.03 && spot.p < LANDMARK.bridgeEnd + 0.03 && spot.relY < -10) continue;
    const height = randRange(random, 7, 21);
    const radius = height * randRange(random, 0.17, 0.25);
    const batch = random() < 0.55 ? pinesDark : pinesLight;
    const yaw = random() * TAU;
    // a fir silhouette from two stacked cone tiers on a short trunk
    batch.push({
      position: spot.position.clone().setY(spot.position.y + height * 0.12),
      yaw,
      scaleX: radius,
      scaleY: height * 0.66,
      scaleZ: radius,
    });
    batch.push({
      position: spot.position.clone().setY(spot.position.y + height * 0.44),
      yaw: yaw + 0.6,
      scaleX: radius * 0.68,
      scaleY: height * 0.52,
      scaleZ: radius * 0.68,
    });
    trunks.push({
      position: spot.position.clone(),
      yaw: 0,
      scaleX: 1.1,
      scaleY: height * 0.2,
      scaleZ: 1.1,
    });
  }

  // broadleaf trees closer to the line
  for (let i = 0; i < quality.broadleaf; i += 1) {
    const spot = sampleScenerySpot(ctx, random, { lateralMin: 10, lateralMax: 150, maxSlope: 1.6 });
    if (!spot) continue;
    const height = randRange(random, 5, 12);
    const radius = height * randRange(random, 0.34, 0.46);
    crowns.push({
      position: spot.position.clone(),
      yaw: random() * TAU,
      scaleX: radius,
      scaleY: radius * 1.15,
      scaleZ: radius,
    });
    trunks.push({
      position: spot.position.clone(),
      yaw: 0,
      scaleX: 0.8,
      scaleY: height * 0.55,
      scaleZ: 0.8,
    });
  }

  // low bushes and scrub
  for (let i = 0; i < quality.bushes; i += 1) {
    const spot = sampleScenerySpot(ctx, random, { lateralMin: 6.5, lateralMax: 90, maxSlope: 1.9 });
    if (!spot) continue;
    const size = randRange(random, 0.7, 2.4);
    bushes.push({
      position: spot.position.clone(),
      yaw: random() * TAU,
      scaleX: size * randRange(random, 0.8, 1.5),
      scaleY: size * 0.75,
      scaleZ: size * randRange(random, 0.8, 1.5),
    });
  }

  const pineDarkMesh = instancedFrom(ctx, pineConeGeometry, ctx.mats.pine, pinesDark, 'pinesDark', { castShadow: true });
  const pineLightMesh = instancedFrom(ctx, pineConeGeometry, ctx.mats.pineLight, pinesLight, 'pinesLight', { castShadow: true });
  const crownMesh = instancedFrom(ctx, crownGeometry, ctx.mats.broadleaf, crowns, 'broadleaf', { castShadow: true });
  const trunkMesh = instancedFrom(ctx, trunkGeometry, ctx.mats.trunk, trunks, 'trunks');
  const bushMesh = instancedFrom(ctx, bushGeometry, ctx.mats.bush, bushes, 'bushes');
  for (const mesh of [pineDarkMesh, pineLightMesh, crownMesh, trunkMesh, bushMesh]) if (mesh) group.add(mesh);

  group.userData.counts = {
    pines: pinesDark.length + pinesLight.length,
    broadleaf: crowns.length,
    bushes: bushes.length,
  };
  return group;
}

/* ========================================================================== */
/*  Farmsteads, fences and lineside furniture                                */
/* ========================================================================== */

function buildFarmsteads(ctx) {
  const { quality, seed } = ctx;
  const random = mulberry32(seed ^ 0x77aa55ee);
  const group = new THREE.Group();
  group.name = 'farmsteads';

  const bodiesA = [];
  const bodiesB = [];
  const roofsA = [];
  const roofsB = [];
  const windows = [];
  const bodyGeometry = new THREE.BoxGeometry(1, 1, 1);
  bodyGeometry.translate(0, 0.5, 0);
  const roofGeometry = new THREE.ConeGeometry(0.72, 0.6, 4);
  roofGeometry.rotateY(Math.PI / 4);
  roofGeometry.translate(0, 0.5, 0);
  const windowGeometry = new THREE.PlaneGeometry(1, 1);

  for (let i = 0; i < quality.houses; i += 1) {
    const spot = sampleScenerySpot(ctx, random, {
      pMin: 0.11,
      pMax: 0.99,
      lateralMin: 26,
      lateralMax: 175,
      maxSlope: 1.1,
    });
    if (!spot) continue;
    const width = randRange(random, 6, 13);
    const depth = randRange(random, 5, 10);
    const height = randRange(random, 3.4, 7.2);
    const yaw = random() * TAU;
    const variant = random() < 0.5;
    const item = {
      position: spot.position.clone(),
      yaw,
      scaleX: width,
      scaleY: height,
      scaleZ: depth,
    };
    (variant ? bodiesA : bodiesB).push(item);
    (variant ? roofsA : roofsB).push({
      position: spot.position.clone().setY(spot.position.y + height),
      yaw,
      scaleX: width * 1.5,
      scaleY: height * randRange(random, 0.45, 0.8),
      scaleZ: depth * 1.5,
    });
    // warm windows, only meaningful after dusk but always present
    const windowCount = 2 + Math.floor(random() * 3);
    for (let w = 0; w < windowCount; w += 1) {
      const offset = (w - (windowCount - 1) / 2) * (width / (windowCount + 0.5));
      const localX = Math.cos(yaw) * offset;
      const localZ = -Math.sin(yaw) * offset;
      windows.push({
        position: new THREE.Vector3(
          spot.position.x + localX + Math.sin(yaw) * (depth * 0.5 + 0.02),
          spot.position.y + height * 0.62,
          spot.position.z + localZ + Math.cos(yaw) * (depth * 0.5 + 0.02)
        ),
        yaw: yaw,
        scaleX: 0.9,
        scaleY: 0.7,
        scaleZ: 1,
      });
    }
  }

  const bodyA = instancedFrom(ctx, bodyGeometry, ctx.mats.houseWallA, bodiesA, 'housesA', { castShadow: true, receiveShadow: true });
  const bodyB = instancedFrom(ctx, bodyGeometry, ctx.mats.houseWallB, bodiesB, 'housesB', { castShadow: true, receiveShadow: true });
  const roofA = instancedFrom(ctx, roofGeometry, ctx.mats.houseRoofA, roofsA, 'roofsA', { castShadow: true });
  const roofB = instancedFrom(ctx, roofGeometry, ctx.mats.houseRoofB, roofsB, 'roofsB', { castShadow: true });
  for (const mesh of [bodyA, bodyB, roofA, roofB]) if (mesh) group.add(mesh);

  if (windows.length) {
    const windowMesh = instancedFrom(ctx, windowGeometry, ctx.mats.houseWindow, windows, 'houseWindows');
    if (windowMesh) {
      group.add(windowMesh);
      ctx.emissiveSystems.push({ mesh: windowMesh, base: 0.18, night: 1.0 });
    }
  }

  group.userData.count = bodiesA.length + bodiesB.length;
  return group;
}

function buildLinesideFurniture(ctx) {
  const { quality, seed } = ctx;
  const random = mulberry32(seed ^ 0x5bd1e995);
  const group = new THREE.Group();
  group.name = 'lineside';

  /* ---- boundary fence on the right of the line (countryside only) ---- */
  const postGeometry = new THREE.BoxGeometry(0.09, 1.15, 0.09);
  postGeometry.translate(0, 0.575, 0);
  const posts = [];
  const wirePositions = [];
  const fenceStep = 3.2;
  for (let s = sAtProgress(ctx, 0.13); s < sAtProgress(ctx, 0.93); s += fenceStep) {
    const p = progressAtS(ctx, s);
    if (isBridgeProgress(p) || isTunnelProgress(p)) continue;
    const frame = frameAtS(ctx, s, _scratchFrame);
    const lateral = 8.4;
    const groundY = frame.pos.y + groundRelative(ctx, s, p, lateral);
    posts.push({
      position: new THREE.Vector3(
        frame.pos.x + frame.right.x * lateral,
        groundY,
        frame.pos.z + frame.right.z * lateral
      ),
      quaternion: frame.quat,
    });
    if (posts.length > 1) {
      const prev = posts[posts.length - 2];
      for (const h of [0.55, 0.95]) {
        wirePositions.push(prev.position.x, prev.position.y + h, prev.position.z);
        wirePositions.push(
          frame.pos.x + frame.right.x * lateral,
          groundY + h,
          frame.pos.z + frame.right.z * lateral
        );
      }
    }
  }
  const fenceMesh = instancedFrom(ctx, postGeometry, ctx.mats.fence, posts, 'fencePosts');
  if (fenceMesh) group.add(fenceMesh);
  if (wirePositions.length) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(wirePositions, 3));
    const wireMaterial = new THREE.LineBasicMaterial({ color: 0x5a4d3c, transparent: true, opacity: 0.55 });
    ctx.materials.push(wireMaterial);
    group.add(new THREE.LineSegments(geometry, wireMaterial));
  }

  /* ---- telegraph poles with two sagging wires (the old lineside route) ---- */
  const poleGeometry = new THREE.CylinderGeometry(0.13, 0.18, 7.6, 6);
  poleGeometry.translate(0, 3.8, 0);
  const crossarmGeometry = bakedBox(1.9, 0.1, 0.1, 0, 7.0, 0);
  const poleItems = [];
  const crossarmItems = [];
  const sagWires = [];
  const poleSpacing = 58;
  let previousTop = null;
  for (let p = 0.12; p < 0.94; p += poleSpacing / (ctx.sEnd - ctx.sStart)) {
    if (isTunnelProgress(p) || isBridgeProgress(p)) {
      previousTop = null;
      continue;
    }
    const s = sAtProgress(ctx, p);
    const frame = frameAtS(ctx, s, _scratchFrame);
    const lateral = 11.5;
    const groundY = frame.pos.y + groundRelative(ctx, s, p, lateral);
    const base = new THREE.Vector3(
      frame.pos.x + frame.right.x * lateral,
      groundY,
      frame.pos.z + frame.right.z * lateral
    );
    poleItems.push({ position: base.clone(), quaternion: frame.quat });
    crossarmItems.push({
      position: base.clone().setY(groundY + 7.0),
      quaternion: frame.quat,
    });
    const top = base.clone().setY(groundY + 7.0);
    if (previousTop) {
      for (const offset of [-0.85, 0.85]) {
        const a = previousTop.clone().addScaledVector(frame.right, offset);
        const b = top.clone().addScaledVector(frame.right, offset);
        const segments = 5;
        for (let i = 0; i < segments; i += 1) {
          const t0 = i / segments;
          const t1 = (i + 1) / segments;
          const p0 = a.clone().lerp(b, t0);
          const p1 = a.clone().lerp(b, t1);
          p0.y -= 1.1 * 4 * t0 * (1 - t0);
          p1.y -= 1.1 * 4 * t1 * (1 - t1);
          sagWires.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
        }
      }
    }
    previousTop = top;
  }
  const poleMesh = instancedFrom(ctx, poleGeometry, ctx.mats.trunk, poleItems, 'telegraphPoles', { castShadow: true });
  const crossarmMesh = instancedFrom(ctx, crossarmGeometry, ctx.mats.trunk, crossarmItems, 'telegraphArms');
  if (poleMesh) group.add(poleMesh);
  if (crossarmMesh) group.add(crossarmMesh);
  if (sagWires.length) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(sagWires, 3));
    const material = new THREE.LineBasicMaterial({ color: 0x2c2a26, transparent: true, opacity: 0.5 });
    ctx.materials.push(material);
    group.add(new THREE.LineSegments(geometry, material));
  }

  return group;
}

/* ========================================================================== */
/*  Level crossings                                                          */
/* ========================================================================== */

function buildLevelCrossings(ctx) {
  const { quality, seed } = ctx;
  const random = mulberry32(seed ^ 0x2f9e1d33);
  const group = new THREE.Group();
  group.name = 'levelCrossings';
  const crossings = [];

  const count = quality.crossingCount;
  for (let i = 0; i < count; i += 1) {
    const p = i === 0 ? 0.225 : 0.325;
    const s = sAtProgress(ctx, p);
    const frame = frameAtS(ctx, s, createFrame());
    const crossing = new THREE.Group();
    crossing.name = 'levelCrossing';

    // road surface either side
    const roadMaterial = ctx.mats.road;
    for (const side of [-1, 1]) {
      const roadLength = 46;
      const centre = frame.pos
        .clone()
        .addScaledVector(frame.right, side * (roadLength * 0.5 + 2.6));
      const road = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.16, 7.5), roadMaterial);
      road.position.copy(centre);
      road.position.y += groundRelative(ctx, s, p, side * (roadLength * 0.5 + 2.6)) + 0.1;
      road.quaternion.copy(frame.quat);
      road.receiveShadow = quality.shadows;
      crossing.add(road);
    }

    // timber planks between and outside the rails
    const plankGeometry = new THREE.BoxGeometry(2.6, 0.14, 0.5);
    const planks = [];
    for (let j = -3; j <= 3; j += 1) {
      planks.push({
        position: frame.pos.clone().addScaledVector(frame.tangent, j * 0.62).addScaledVector(WORLD_UP, -0.08),
        quaternion: frame.quat,
      });
    }
    const plankMesh = instancedFrom(ctx, plankGeometry, ctx.mats.crossingTimber, planks, 'crossingPlanks');
    if (plankMesh) crossing.add(plankMesh);

    // warning lights, boom gates and St Andrew's cross on both sides
    for (const side of [-1, 1]) {
      const base = frame.pos
        .clone()
        .addScaledVector(frame.right, side * 9.5)
        .addScaledVector(frame.tangent, side > 0 ? 5.5 : -5.5);
      base.y += groundRelative(ctx, s, p, side * 9.5) + 0.15;

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.1, 6), ctx.mats.signalPost);
      mast.position.copy(base).setY(base.y + 1.55);
      crossing.add(mast);

      const crossBoard = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.9, 0.06), ctx.mats.signBack);
      crossBoard.position.copy(base).setY(base.y + 3.3);
      crossBoard.quaternion.copy(frame.quat);
      crossBoard.rotateY(Math.PI / 2);
      crossing.add(crossBoard);
      for (const angle of [Math.PI / 4, -Math.PI / 4]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.08), ctx.mats.trainCream);
        bar.position.copy(crossBoard.position);
        bar.quaternion.copy(crossBoard.quaternion);
        bar.rotateZ(angle);
        crossing.add(bar);
      }

      const lightHousing = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.32, 0.16), ctx.mats.signalHead);
      lightHousing.position.copy(base).setY(base.y + 2.75);
      lightHousing.quaternion.copy(frame.quat);
      lightHousing.rotateY(Math.PI / 2);
      crossing.add(lightHousing);
      for (const offset of [-0.3, 0.3]) {
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), ctx.mats.lensRed);
        lens.position.copy(lightHousing.position);
        lens.quaternion.copy(lightHousing.quaternion);
        lens.translateX(offset);
        lens.translateZ(0.09);
        crossing.add(lens);
        if (ctx.glowMap && quality.glowSprites) {
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: ctx.glowMap,
              color: 0xff2a1a,
              transparent: true,
              opacity: 0.55,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            })
          );
          ctx.materials.push(sprite.material);
          sprite.position.copy(lens.position).addScaledVector(frame.right, -side * 0.2);
          sprite.scale.setScalar(1.4);
          crossing.add(sprite);
        }
      }

      // boom gate (raised parallel to the road, ready to lower)
      const boomPivot = new THREE.Group();
      boomPivot.position.copy(base).setY(base.y + 1.15);
      boomPivot.quaternion.copy(frame.quat);
      boomPivot.rotateY(Math.PI / 2);
      const boom = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.13, 0.13), ctx.mats.trainRed);
      boom.position.set(2.8, 0, 0);
      boomPivot.add(boom);
      for (let b = 0; b < 4; b += 1) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.14), ctx.mats.trainCream);
        band.position.set(0.7 + b * 1.4, 0, 0);
        boomPivot.add(band);
      }
      crossing.add(boomPivot);
    }

    group.add(crossing);
    crossings.push({ progress: p, group: crossing });
  }

  return { group, crossings };
}

/* ========================================================================== */
/*  Rocks, cuttings and distant peaks                                        */
/* ========================================================================== */

function buildRocks(ctx) {
  const { quality, seed } = ctx;
  const random = mulberry32(seed ^ 0x4c1f9a27);
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  // squash a little so they read as boulders
  geometry.scale(1, 0.68, 1.1);
  const items = [];
  for (let i = 0; i < quality.rocks; i += 1) {
    const spot = sampleScenerySpot(ctx, random, {
      lateralMin: 8,
      lateralMax: 160,
      maxSlope: 3.2,
      allowBridge: true,
      allowTunnel: true,
    });
    if (!spot) continue;
    const size = randRange(random, 0.5, 3.4);
    items.push({
      position: spot.position.clone().setY(spot.position.y + size * 0.25),
      yaw: random() * TAU,
      scaleX: size * randRange(random, 0.8, 1.5),
      scaleY: size * randRange(random, 0.6, 1.1),
      scaleZ: size * randRange(random, 0.8, 1.5),
    });
  }
  const mesh = instancedFrom(ctx, geometry, ctx.mats.rock, items, 'rocks', { castShadow: true });
  return mesh;
}

function buildDistantPeaks(ctx) {
  const group = new THREE.Group();
  group.name = 'distantRidges';

  const material = new THREE.MeshStandardMaterial({
    color: 0x7d93a4,
    roughness: 1,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  ctx.materials.push(material);

  const layers = [
    { distance: 420, height: 46, haze: 0.1, name: 'ridgeNear' },
    { distance: 760, height: 96, haze: 0.35, name: 'ridgeFar' },
    { distance: 1180, height: 150, haze: 0.55, name: 'ridgeFarthest' },
  ];

  for (const layer of layers) {
    for (const side of [-1, 1]) {
      const segments = 96;
      const positions = [];
      const colors = [];
      const indices = [];
      const frame = createFrame();
      const baseColor = new THREE.Color(0x3f5568).lerp(new THREE.Color(0x9db3c2), layer.haze);

      for (let i = 0; i <= segments; i += 1) {
        const s = (i / segments) * ctx.length;
        frameAtS(ctx, s, frame);
        const wobble = 1 + 0.12 * Math.sin(i * 0.37 + layer.distance) + 0.08 * Math.sin(i * 0.11);
        const distance = layer.distance * wobble;
        const peak = ridgeNoise(s * 0.0018 + side * 7.3, layer.distance * 0.01, 4, ctx.seed + 9);
        const shoulder = ridgeNoise(s * 0.006, i * 0.21, 2, ctx.seed + 51);
        const topY = frame.pos.y + layer.height * (0.32 + 0.85 * peak + 0.22 * shoulder);
        const baseY = frame.pos.y - 140;
        const x = frame.pos.x + frame.right.x * side * distance;
        const z = frame.pos.z + frame.right.z * side * distance;
        positions.push(x, baseY, z, x, topY, z);
        const shade = 0.55 + 0.5 * peak;
        colors.push(baseColor.r * 0.78, baseColor.g * 0.8, baseColor.b * 0.84);
        colors.push(baseColor.r * shade, baseColor.g * shade, baseColor.b * shade);
      }

      for (let i = 0; i < segments; i += 1) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `${layer.name}${side > 0 ? 'R' : 'L'}`;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      group.add(mesh);
    }
  }

  return group;
}

/* ========================================================================== */
/*  Steel truss bridge                                                       */
/* ========================================================================== */

const _beamDir = new THREE.Vector3();
const _beamMid = new THREE.Vector3();
const _beamQuat = new THREE.Quaternion();
const BEAM_AXIS = new THREE.Vector3(1, 0, 0);

function beamItem(from, to, thickness) {
  _beamDir.subVectors(to, from);
  const length = _beamDir.length();
  if (length < 1e-4) return null;
  _beamMid.addVectors(from, to).multiplyScalar(0.5);
  _beamQuat.setFromUnitVectors(BEAM_AXIS, _beamDir.normalize());
  return {
    position: _beamMid.clone(),
    quaternion: _beamQuat.clone(),
    scaleX: length,
    scaleY: thickness,
    scaleZ: thickness,
  };
}

function buildBridge(ctx) {
  const { quality, mats } = ctx;
  const sFrom = sAtProgress(ctx, LANDMARK.bridgeStart) - 6;
  const sTo = sAtProgress(ctx, LANDMARK.bridgeEnd) + 6;
  const pMid = progressAtS(ctx, (sFrom + sTo) * 0.5);
  const group = new THREE.Group();
  group.name = 'trussBridge';
  group.userData.span = sTo - sFrom;

  /* deck: a shallow plate girder under the rails */
  const deckProfile = [
    [-3.35, 0.1],
    [3.35, 0.1],
    [3.35, -1.22],
    [-3.35, -1.22],
  ];
  const deckGeometry = sweepClosedProfile(ctx, sFrom, sTo, quality.ribbonStep, deckProfile, 0, null);
  const deck = new THREE.Mesh(deckGeometry, mats.bridgeDeck);
  deck.receiveShadow = quality.shadows;
  deck.castShadow = true;
  group.add(deck);

  /* walkway kerbs */
  for (const side of [-1, 1]) {
    const kerbProfile = [
      [side * 3.35, 0.14],
      [side * 3.35, 0.48],
      [side * 2.85, 0.48],
      [side * 2.85, 0.14],
    ];
    const geometry = sweepProfile(ctx, sFrom, sTo, quality.ribbonStep, kerbProfile, null, 3);
    const kerb = new THREE.Mesh(geometry, mats.concreteDark);
    kerb.material.side = THREE.DoubleSide;
    group.add(kerb);
  }

  /* through-truss members */
  const members = [];
  const panels = Math.max(4, Math.round((sTo - sFrom) / 9.4));
  const panelLength = (sTo - sFrom) / panels;
  const trussHeight = 6.9;
  const halfSpan = 3.95;

  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i <= panels; i += 1) {
      const s = sFrom + i * panelLength;
      const frame = frameAtS(ctx, s, _scratchFrame);
      const bottom = new THREE.Vector3(
        frame.pos.x + frame.right.x * side * halfSpan,
        frame.pos.y + 0.15,
        frame.pos.z + frame.right.z * side * halfSpan
      );
      const top = bottom.clone().addScaledVector(WORLD_UP, trussHeight);
      points.push({ s, bottom, top });
    }
    for (let i = 0; i < panels; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      members.push(beamItem(a.bottom, b.bottom, 0.52));
      members.push(beamItem(a.top, b.top, 0.5));
      members.push(beamItem(a.bottom, a.top, 0.3));
      if (i % 2 === 0) members.push(beamItem(a.bottom, b.top, 0.26));
      else members.push(beamItem(a.top, b.bottom, 0.26));
    }
    const last = points[points.length - 1];
    members.push(beamItem(last.bottom, last.top, 0.26));
  }

  /* top lateral bracing */
  const braceStations = [];
  for (let i = 0; i <= panels; i += 2) {
    const s = sFrom + i * panelLength;
    const frame = frameAtS(ctx, s, _scratchFrame);
    const left = new THREE.Vector3(
      frame.pos.x - frame.right.x * halfSpan,
      frame.pos.y + 0.15 + trussHeight,
      frame.pos.z - frame.right.z * halfSpan
    );
    const right = new THREE.Vector3(
      frame.pos.x + frame.right.x * halfSpan,
      frame.pos.y + 0.15 + trussHeight,
      frame.pos.z + frame.right.z * halfSpan
    );
    members.push(beamItem(left, right, 0.16));
    braceStations.push({ left, right });
  }
  for (let i = 0; i < braceStations.length - 1; i += 1) {
    const a = braceStations[i];
    const b = braceStations[i + 1];
    members.push(beamItem(a.left, b.right, 0.1));
    members.push(beamItem(a.right, b.left, 0.1));
  }

  const beamGeometry = new THREE.BoxGeometry(1, 1, 1);
  const memberMesh = instancedFrom(
    ctx,
    beamGeometry,
    mats.bridgeSteel,
    members.filter(Boolean),
    'trussMembers',
    { castShadow: true }
  );
  if (memberMesh) group.add(memberMesh);

  /* gusset plates at the panel points (small cubes give the truss weight) */
  const gussets = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i <= panels; i += 1) {
      const s = sFrom + i * panelLength;
      const frame = frameAtS(ctx, s, _scratchFrame);
      for (const y of [0.15, 0.15 + trussHeight]) {
        gussets.push({
          position: new THREE.Vector3(
            frame.pos.x + frame.right.x * side * halfSpan,
            frame.pos.y + y,
            frame.pos.z + frame.right.z * side * halfSpan
          ),
          quaternion: frame.quat,
          scaleX: 0.62,
          scaleY: 0.5,
          scaleZ: 0.12,
        });
      }
    }
  }
  const gussetMesh = instancedFrom(ctx, new THREE.BoxGeometry(1, 1, 1), mats.bridgeSteel, gussets, 'gussetPlates');
  if (gussetMesh) group.add(gussetMesh);

  /* piers down to the gorge floor */
  const pierCount = Math.max(3, Math.floor((sTo - sFrom) / 58));
  const piers = [];
  const pierCaps = [];
  for (let i = 1; i < pierCount; i += 1) {
    const s = sFrom + ((sTo - sFrom) * i) / pierCount;
    const p = progressAtS(ctx, s);
    const frame = frameAtS(ctx, s, _scratchFrame);
    const groundY = frame.pos.y + groundRelative(ctx, s, p, 0);
    const height = Math.max(6, frame.pos.y - 1.22 - groundY + 2);
    const base = new THREE.Vector3(frame.pos.x, groundY - 1.2, frame.pos.z);
    piers.push({
      position: base.clone().setY(groundY + height * 0.5 - 1.2),
      quaternion: frame.quat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(WORLD_UP, Math.PI / 4)),
      scaleX: 2.9,
      scaleY: height,
      scaleZ: 2.9,
    });
    pierCaps.push({
      position: new THREE.Vector3(frame.pos.x, frame.pos.y - 1.35, frame.pos.z),
      quaternion: frame.quat,
      scaleX: 7.6,
      scaleY: 0.55,
      scaleZ: 4.2,
    });
  }
  const pierGeometry = new THREE.CylinderGeometry(1.0, 1.25, 1, 4, 1);
  const pierMesh = instancedFrom(ctx, pierGeometry, mats.stone, piers, 'bridgePiers', { castShadow: true });
  const capMesh = instancedFrom(ctx, new THREE.BoxGeometry(1, 1, 1), mats.stone, pierCaps, 'pierCaps', { castShadow: true });
  if (pierMesh) group.add(pierMesh);
  if (capMesh) group.add(capMesh);

  /* abutments at both ends */
  for (const s of [sFrom + 2, sTo - 2]) {
    const p = progressAtS(ctx, s);
    const frame = frameAtS(ctx, s, _scratchFrame);
    const groundY = frame.pos.y + groundRelative(ctx, s, p, 5.5);
    const height = Math.max(4, frame.pos.y - groundY);
    const block = new THREE.Mesh(new THREE.BoxGeometry(10.5, height, 7), mats.stone);
    block.position.set(frame.pos.x, groundY + height * 0.5, frame.pos.z);
    block.quaternion.copy(frame.quat);
    block.castShadow = quality.shadows;
    block.receiveShadow = quality.shadows;
    group.add(block);
  }

  /* portal frames: heavier end posts and a top beam */
  for (const s of [sFrom + 0.4, sTo - 0.4]) {
    const frame = frameAtS(ctx, s, _scratchFrame);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.55, trussHeight + 1.2, 0.55), mats.bridgeSteel);
      post.position
        .copy(frame.pos)
        .addScaledVector(frame.right, side * halfSpan)
        .addScaledVector(WORLD_UP, 0.15 + (trussHeight + 1.2) * 0.5);
      post.quaternion.copy(frame.quat);
      group.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(halfSpan * 2 + 0.8, 0.6, 0.5), mats.bridgeSteel);
    beam.position.copy(frame.pos).addScaledVector(WORLD_UP, 0.15 + trussHeight + 0.9);
    beam.quaternion.copy(frame.quat);
    group.add(beam);
  }

  group.userData.midProgress = pMid;
  return group;
}

/* ========================================================================== */
/*  Mountain tunnel                                                          */
/* ========================================================================== */

const TUNNEL_ARCH = [
  [-4.35, -1.6],
  [-4.35, 1.5],
  [-4.08, 3.1],
  [-3.25, 4.5],
  [-1.95, 5.55],
  [-0.75, 6.05],
  [0.75, 6.05],
  [1.95, 5.55],
  [3.25, 4.5],
  [4.08, 3.1],
  [4.35, 1.5],
  [4.35, -1.6],
];

const TUNNEL_SHELL = [
  [-6.6, -2.4],
  [-6.6, 2.2],
  [-6.1, 4.4],
  [-4.9, 6.3],
  [-3.0, 7.7],
  [-1.2, 8.35],
  [0, 8.45],
  [1.2, 8.35],
  [3.0, 7.7],
  [4.9, 6.3],
  [6.1, 4.4],
  [6.6, 2.2],
  [6.6, -2.4],
];

function buildTunnel(ctx) {
  const { quality, mats } = ctx;
  const sFrom = sAtProgress(ctx, LANDMARK.tunnelStart) - 5;
  const sTo = sAtProgress(ctx, LANDMARK.tunnelEnd) + 5;
  const group = new THREE.Group();
  group.name = 'mountainTunnel';
  group.userData.span = sTo - sFrom;

  /* interior lining */
  const liningGeometry = sweepProfile(ctx, sFrom, sTo, quality.tunnelSamples, TUNNEL_ARCH, null, 5.0);
  const liningMaterial = mats.tunnelWall.clone();
  liningMaterial.side = THREE.DoubleSide;
  liningMaterial.roughness = 0.88;
  ctx.materials.push(liningMaterial);
  const lining = new THREE.Mesh(liningGeometry, liningMaterial);
  lining.receiveShadow = quality.shadows;
  group.add(lining);

  /* rock shell over the lining (what you see from outside) */
  const shellGeometry = sweepProfile(ctx, sFrom, sTo, quality.tunnelSamples * 1.4, TUNNEL_SHELL, null, 6.0);
  const shellMaterial = mats.tunnelRock.clone();
  shellMaterial.side = THREE.DoubleSide;
  ctx.materials.push(shellMaterial);
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  shell.castShadow = quality.shadows;
  shell.receiveShadow = quality.shadows;
  group.add(shell);

  /* walkway slabs */
  for (const side of [-1, 1]) {
    const walkProfile = [
      [side * 4.35, -1.05],
      [side * 3.3, -1.05],
    ];
    const geometry = sweepProfile(ctx, sFrom, sTo, quality.tunnelSamples, walkProfile, null, 4);
    const walk = new THREE.Mesh(geometry, mats.concreteDark);
    walk.material.side = THREE.DoubleSide;
    group.add(walk);
  }

  /* arch ribs every few metres give the bore rhythm and catch the lamps */
  const ribGeometry = new THREE.TorusGeometry(4.4, 0.12, 4, 14, Math.PI);
  const ribItems = [];
  for (let s = sFrom + 6; s < sTo - 6; s += 4.6) {
    const frame = frameAtS(ctx, s, _scratchFrameB);
    ribItems.push({
      position: frame.pos.clone().addScaledVector(WORLD_UP, 1.1),
      quaternion: frame.quat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0)),
      yaw: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    });
  }
  const ribMaterial = mats.tunnelWall.clone();
  ribMaterial.color = new THREE.Color(0x6a6459);
  ctx.materials.push(ribMaterial);
  const ribMesh = new THREE.InstancedMesh(ribGeometry, ribMaterial, ribItems.length);
  ribMesh.name = 'tunnelRibs';
  const ribMatrix = new THREE.Matrix4();
  const ribScale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < ribItems.length; i += 1) {
    ribMesh.setMatrixAt(i, ribMatrix.compose(ribItems[i].position, ribItems[i].quaternion, ribScale));
  }
  ribMesh.instanceMatrix.needsUpdate = true;
  group.add(ribMesh);

  /* portal faces: a rock wall with an arch cut through it */
  const portalShape = new THREE.Shape();
  portalShape.moveTo(-16, -5.5);
  portalShape.lineTo(16, -5.5);
  portalShape.lineTo(16, 13);
  portalShape.lineTo(-16, 13);
  portalShape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-5.0, -1.7);
  hole.lineTo(-5.0, 1.5);
  hole.lineTo(-4.7, 3.2);
  hole.lineTo(-3.8, 4.7);
  hole.lineTo(-2.3, 5.8);
  hole.lineTo(-0.9, 6.35);
  hole.lineTo(0.9, 6.35);
  hole.lineTo(2.3, 5.8);
  hole.lineTo(3.8, 4.7);
  hole.lineTo(4.7, 3.2);
  hole.lineTo(5.0, 1.5);
  hole.lineTo(5.0, -1.7);
  hole.closePath();
  portalShape.holes.push(hole);

  const portalGeometry = new THREE.ExtrudeGeometry(portalShape, {
    depth: 2.4,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.25,
    bevelSegments: 1,
    curveSegments: 4,
  });
  portalGeometry.translate(0, 0, -1.2);

  for (const [s, flip] of [
    [sFrom, 1],
    [sTo, -1],
  ]) {
    const frame = frameAtS(ctx, s, _scratchFrame);
    const portal = new THREE.Mesh(portalGeometry, mats.tunnelRock);
    portal.position.copy(frame.pos).addScaledVector(WORLD_UP, 1.2);
    portal.quaternion.copy(frame.quat);
    if (flip < 0) portal.rotateY(Math.PI);
    portal.castShadow = quality.shadows;
    portal.receiveShadow = quality.shadows;
    group.add(portal);

    // portal wings so the face blends into the hillside
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(7, 16, 12), mats.tunnelRock);
      wing.position
        .copy(frame.pos)
        .addScaledVector(frame.right, side * 17)
        .addScaledVector(WORLD_UP, 4);
      wing.quaternion.copy(frame.quat);
      wing.rotateY(side * 0.18);
      group.add(wing);
    }
  }

  /* tunnel lamps along the left wall */
  const spacing = quality.tunnelLampSpacing;
  const lampGeometry = new THREE.SphereGeometry(0.19, 8, 6);
  const bracketGeometry = bakedBox(0.5, 0.08, 0.08, 0.25, 0, 0);
  const lamps = [];
  const brackets = [];
  const glowPositions = [];
  for (let s = sFrom + 8; s < sTo - 6; s += spacing) {
    const frame = frameAtS(ctx, s, _scratchFrame);
    const point = new THREE.Vector3(
      frame.pos.x + frame.right.x * -4.15,
      frame.pos.y + 4.9,
      frame.pos.z + frame.right.z * -4.15
    );
    lamps.push({ position: point.clone(), quaternion: frame.quat });
    brackets.push({ position: point.clone(), quaternion: frame.quat });
    glowPositions.push(point.x, point.y, point.z);
  }
  const lampMesh = instancedFrom(ctx, lampGeometry, mats.lampGlass, lamps, 'tunnelLamps');
  const bracketMesh = instancedFrom(ctx, bracketGeometry, mats.lampHousing, brackets, 'tunnelLampBrackets');
  if (lampMesh) group.add(lampMesh);
  if (bracketMesh) group.add(bracketMesh);

  if (ctx.glowMap && glowPositions.length) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(glowPositions, 3));
    const material = new THREE.PointsMaterial({
      map: ctx.glowMap,
      color: 0xffc27a,
      size: 7.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    ctx.materials.push(material);
    const glow = new THREE.Points(geometry, material);
    glow.name = 'tunnelLampGlow';
    group.add(glow);
    ctx.glowSystems.push(glow);
  }

  return { group, sFrom, sTo, lamps, glowPositions };
}

/* ========================================================================== */
/*  Signals                                                                  */
/* ========================================================================== */

const ASPECTS = {
  green: { id: 'green', color: 0x2bff8a, lamp: 0, label: 'Clear' },
  'double-amber': { id: 'double-amber', color: 0xffb02a, lamp: 1, label: 'Preliminary caution' },
  amber: { id: 'amber', color: 0xffa62a, lamp: 1, label: 'Caution' },
  red: { id: 'red', color: 0xff2a1a, lamp: 2, label: 'Stop' },
};

/** Each signal and the aspect it displays. */
const SIGNAL_SCHEDULE = [
  { progress: 0.052, aspect: 'green', kind: 'post', side: -1, label: 'Departure' },
  { progress: 0.205, aspect: 'green', kind: 'post', side: 1, label: 'Country home' },
  { progress: 0.312, aspect: 'amber', kind: 'post', side: -1, label: 'Country distant' },
  { progress: 0.5, aspect: 'green', kind: 'post', side: 1, label: 'Bridge home' },
  { progress: 0.573, aspect: 'double-amber', kind: 'gantry', side: 1, label: 'Tunnel approach' },
  { progress: 0.762, aspect: 'green', kind: 'gantry', side: 1, label: 'Night home 1' },
  { progress: 0.818, aspect: 'green', kind: 'gantry', side: 1, label: 'Night home 2' },
  { progress: 0.866, aspect: 'amber', kind: 'gantry', side: 1, label: 'Terminal distant' },
  { progress: 0.914, aspect: 'double-amber', kind: 'gantry', side: 1, label: 'Terminal outer' },
  { progress: 0.958, aspect: 'green', kind: 'gantry', side: 1, label: 'Terminal home' },
  { progress: 0.998, aspect: 'red', kind: 'post', side: 1, label: 'Buffer stop' },
];

/** Aspect of the next signal at or after `progress`. */
function nextSignalAspect(progress) {
  const p = clamp01(progress);
  for (const signal of SIGNAL_SCHEDULE) {
    if (signal.progress >= p - 1e-6) return signal.aspect;
  }
  return 'red';
}

function buildSignals(ctx) {
  const { mats, quality } = ctx;
  const group = new THREE.Group();
  group.name = 'signals';
  const heads = [];

  const lensGeometry = new THREE.CircleGeometry(0.19, 14);
  const hoodGeometry = new THREE.CylinderGeometry(0.24, 0.26, 0.22, 12, 1, true);

  function makeSignalHead(aspectId, position, quaternion) {
    const head = new THREE.Group();
    head.position.copy(position);
    head.quaternion.copy(quaternion); // local +Z faces along the track (away from the train)
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.7, 0.34), mats.signalHead);
    housing.position.set(0, 0, 0);
    head.add(housing);

    const aspect = ASPECTS[aspectId] || ASPECTS.green;
    const litIndex = aspect.lamp;
    const lenses = [];
    for (let i = 0; i < 3; i += 1) {
      const lit = i === litIndex;
      const material = lit
        ? aspectId === 'green'
          ? mats.lensGreen
          : aspectId === 'red'
            ? mats.lensRed
            : mats.lensAmber
        : mats.lensOff;
      const lens = new THREE.Mesh(lensGeometry, material);
      lens.position.set(0, 0.52 - i * 0.52, -0.18);
      lens.rotation.y = Math.PI;
      head.add(lens);
      const hood = new THREE.Mesh(hoodGeometry, mats.signalHead);
      hood.position.set(0, 0.52 - i * 0.52, -0.27);
      hood.rotation.x = Math.PI / 2;
      head.add(hood);
      lenses.push(lens);
      if (lit && ctx.glowMap && quality.glowSprites) {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: ctx.glowMap,
            color: aspect.color,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        ctx.materials.push(sprite.material);
        sprite.position.set(0, 0.52 - i * 0.52, -0.3);
        sprite.scale.setScalar(1.5);
        head.add(sprite);
        heads.push({ sprite, base: 0.85 });
      }
    }

    // back plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.0, 0.08), mats.signBack);
    plate.position.set(0, 0, -0.05);
    head.add(plate);
    return head;
  }

  for (const signal of SIGNAL_SCHEDULE) {
    const s = sAtProgress(ctx, signal.progress);
    const frame = frameAtS(ctx, s, _scratchFrame);

    if (signal.kind === 'post') {
      const lateral = signal.side * 4.6;
      const base = new THREE.Vector3(
        frame.pos.x + frame.right.x * lateral,
        frame.pos.y + groundRelative(ctx, s, signal.progress, lateral) + 0.2,
        frame.pos.z + frame.right.z * lateral
      );
      const height = 5.4;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, height, 8), mats.signalPost);
      post.position.copy(base).setY(base.y + height * 0.5);
      group.add(post);

      // ladder
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.5, height * 0.8, 0.06), mats.signalPost);
      ladder.position.copy(base).addScaledVector(frame.right, -signal.side * 0.28).setY(base.y + height * 0.45);
      ladder.quaternion.copy(frame.quat);
      group.add(ladder);

      const headQuat = frame.quat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(WORLD_UP, Math.PI));
      group.add(makeSignalHead(signal.aspect, base.clone().setY(base.y + height + 0.55 - 0.85), headQuat));
    } else {
      // portal gantry across both tracks
      const topY = 7.9;
      for (const side of [-1, 1]) {
        const lateral = side * 5.4;
        const groundY = frame.pos.y + groundRelative(ctx, s, signal.progress, lateral);
        const postHeight = Math.max(4, topY - (groundY - frame.pos.y));
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, postHeight, 0.3), mats.signalPost);
        post.position
          .copy(frame.pos)
          .addScaledVector(frame.right, lateral)
          .addScaledVector(WORLD_UP, postHeight * 0.5 - 1.2);
        post.quaternion.copy(frame.quat);
        post.castShadow = false;
        group.add(post);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.42, 0.36), mats.signalPost);
      beam.position.copy(frame.pos).addScaledVector(WORLD_UP, topY);
      beam.quaternion.copy(frame.quat);
      group.add(beam);

      // bracing
      for (const side of [-1, 1]) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.16), mats.signalPost);
        brace.position
          .copy(frame.pos)
          .addScaledVector(frame.right, side * 4.6)
          .addScaledVector(WORLD_UP, topY - 1.3);
        brace.rotation.z = side * 0.32;
        group.add(brace);
      }

      const headQuat = frame.quat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(WORLD_UP, Math.PI));
      for (const lateral of [-1.9, 1.9]) {
        group.add(
          makeSignalHead(
            signal.aspect,
            frame.pos.clone().addScaledVector(frame.right, lateral).addScaledVector(WORLD_UP, topY - 1.35),
            headQuat
          )
        );
      }
    }
  }

  ctx.signalHeads = heads;
  return group;
}

/* ========================================================================== */
/*  Night town                                                               */
/* ========================================================================== */

const TOWN_LIGHT_VERTEX = /* glsl */ `
attribute float aPhase;
attribute float aSize;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float twinkle = 0.72 + 0.28 * sin(uTime * 1.6 + aPhase * 6.2831853);
  gl_PointSize = aSize * uPixelRatio * (430.0 / max(1.0, -mvPosition.z)) * twinkle;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const TOWN_LIGHT_FRAGMENT = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float glow = pow(core, 2.4);
  gl_FragColor = vec4(vColor, 1.0) * glow * uOpacity;
}
`;

function buildTown(ctx) {
  const { quality, seed } = ctx;
  const random = mulberry32(seed ^ 0x7f4a7c15);
  const group = new THREE.Group();
  group.name = 'nightTown';

  /* silhouetted buildings along the night mainline */
  const bodyGeometry = new THREE.BoxGeometry(1, 1, 1);
  bodyGeometry.translate(0, 0.5, 0);
  const buildingsDark = [];
  const buildingsLight = [];

  for (let i = 0; i < quality.townBuildings; i += 1) {
    const spot = sampleScenerySpot(ctx, random, {
      pMin: 0.745,
      pMax: 0.995,
      lateralMin: 42,
      lateralMax: 230,
      maxSlope: 1.2,
      allowStation: true,
    });
    if (!spot) continue;
    const width = randRange(random, 8, 26);
    const depth = randRange(random, 8, 24);
    const height = randRange(random, 6, 34) * (spot.lateral > 120 ? 1.25 : 1);
    (random() < 0.5 ? buildingsDark : buildingsLight).push({
      position: spot.position.clone().setY(spot.position.y - 0.6),
      yaw: random() * TAU,
      scaleX: width,
      scaleY: height,
      scaleZ: depth,
    });
  }

  const darkMesh = instancedFrom(ctx, bodyGeometry, ctx.mats.townBuilding, buildingsDark, 'townBlocksA');
  const lightMesh = instancedFrom(ctx, bodyGeometry, ctx.mats.townBuildingLight, buildingsLight, 'townBlocksB');
  if (darkMesh) group.add(darkMesh);
  if (lightMesh) group.add(lightMesh);

  /* thousands of window / street lights as one additive point cloud */
  const count = quality.townLights;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const palette = [
    [1.0, 0.78, 0.42],
    [1.0, 0.66, 0.3],
    [0.72, 0.86, 1.0],
    [1.0, 0.9, 0.62],
    [0.62, 1.0, 0.86],
  ];
  let written = 0;
  let guard = 0;
  while (written < count && guard < count * 6) {
    guard += 1;
    const spot = sampleScenerySpot(ctx, random, {
      pMin: 0.742,
      pMax: 1.0,
      lateralMin: 30,
      lateralMax: 250,
      maxSlope: 1.8,
      allowStation: true,
      allowTunnel: false,
    });
    if (!spot) continue;
    const heightBase = spot.position.y;
    const inCluster = Math.floor(random() * 3) + 1;
    for (let k = 0; k < inCluster && written < count; k += 1) {
      const jitterX = (random() - 0.5) * 44;
      const jitterZ = (random() - 0.5) * 44;
      const height = heightBase + randRange(random, 1.5, spot.lateral > 90 ? 26 : 14);
      positions[written * 3] = spot.position.x + jitterX;
      positions[written * 3 + 1] = height;
      positions[written * 3 + 2] = spot.position.z + jitterZ;
      const colour = palette[Math.floor(random() * palette.length)];
      colors[written * 3] = colour[0];
      colors[written * 3 + 1] = colour[1];
      colors[written * 3 + 2] = colour[2];
      phases[written] = random();
      sizes[written] = randRange(random, 1.6, 4.4);
      written += 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, written * 3), 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors.subarray(0, written * 3), 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases.subarray(0, written), 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes.subarray(0, written), 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
    },
    vertexShader: TOWN_LIGHT_VERTEX,
    fragmentShader: TOWN_LIGHT_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  ctx.materials.push(material);
  const points = new THREE.Points(geometry, material);
  points.name = 'townLights';
  points.frustumCulled = false;
  group.add(points);

  ctx.townMaterial = material;
  group.userData.lights = written;
  group.userData.buildings = buildingsDark.length + buildingsLight.length;
  return group;
}

/* ========================================================================== */
/*  Destination terminal                                                     */
/* ========================================================================== */

function buildTerminal(ctx) {
  const group = new THREE.Group();
  group.name = 'terminal';
  const sStart = sAtProgress(ctx, LANDMARK.terminalStart + 0.008);
  const sEnd = ctx.length - 6;

  group.add(
    buildStationPlatform(ctx, {
      sFrom: sStart,
      sTo: sEnd,
      side: -1,
      edge: 2.7,
      width: 8.4,
      top: 0.98,
      canopy: true,
      lamps: ctx.quality.platformLamps,
      signTexture: ctx.signs.terminal,
    })
  );
  group.add(
    buildStationPlatform(ctx, {
      sFrom: sStart + 12,
      sTo: sEnd,
      side: 1,
      edge: 2.7,
      width: 6.4,
      top: 0.98,
      canopy: false,
      lamps: Math.round(ctx.quality.platformLamps * 0.6),
      signTexture: ctx.signs.terminalSmall,
    })
  );

  /* station building beside the arrival platform */
  const sStation = sStart + 120;
  const frame = frameAtS(ctx, sStation, _scratchFrame);
  const lateral = -22;
  const baseY = frame.pos.y + groundRelative(ctx, sStation, progressAtS(ctx, sStation), lateral);
  const building = new THREE.Group();
  building.position.set(
    frame.pos.x + frame.right.x * lateral,
    baseY,
    frame.pos.z + frame.right.z * lateral
  );
  building.quaternion.copy(frame.quat);
  building.rotateY(Math.PI / 2);

  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(46, 12.5, 17), ctx.mats.stationWall);
  mainHall.position.set(0, 6.25, 0);
  mainHall.castShadow = ctx.quality.shadows;
  mainHall.receiveShadow = ctx.quality.shadows;
  building.add(mainHall);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(49, 0.8, 20), ctx.mats.canopyRoof);
  roof.position.set(0, 12.8, 0);
  building.add(roof);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(7, 8, 7), ctx.mats.stationWall);
  tower.position.set(-14, 16, 0);
  building.add(tower);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 3.2, 4), ctx.mats.canopyRoof);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.position.set(-14, 22, 0);
  building.add(towerRoof);

  // lit windows along the concourse
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffd391 });
  ctx.materials.push(windowMaterial);
  const windowGeometry = new THREE.PlaneGeometry(2.4, 2.8);
  const windows = new THREE.InstancedMesh(windowGeometry, windowMaterial, 16);
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3(1, 1, 1);
  let index = 0;
  for (let i = 0; i < 8; i += 1) {
    for (const y of [4.2, 8.6]) {
      const position = new THREE.Vector3(-19 + i * 4.4, y, 8.56);
      windows.setMatrixAt(index, matrix.compose(position, new THREE.Quaternion(), scale));
      index += 1;
    }
  }
  windows.instanceMatrix.needsUpdate = true;
  building.add(windows);
  ctx.emissiveSystems.push({ mesh: windows, base: 0.35, night: 1.0, basic: true });

  // station name board on the concourse
  if (ctx.signs.terminal) {
    const boardMaterial = new THREE.MeshBasicMaterial({ map: ctx.signs.terminal });
    ctx.materials.push(boardMaterial);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.4), boardMaterial);
    board.position.set(0, 11.2, 8.6);
    building.add(board);
  }

  // clock
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), new THREE.MeshBasicMaterial({ color: 0xf6efdc }));
  ctx.materials.push(clockFace.material);
  clockFace.position.set(9.6, 14.2, 8.62);
  building.add(clockFace);
  const handMaterial = new THREE.MeshBasicMaterial({ color: 0x1b1a17 });
  ctx.materials.push(handMaterial);
  const handGroup = new THREE.Group();
  handGroup.position.copy(clockFace.position);
  const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.05, 0.04), handMaterial);
  minuteHand.position.set(0, 0.45, 0.02);
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.66, 0.04), handMaterial);
  hourHand.position.set(0, 0.26, 0.03);
  handGroup.add(minuteHand, hourHand);
  building.add(handGroup);
  ctx.clockHands = { minuteHand, hourHand };

  group.add(building);

  /* buffer stop at the end of the line */
  const bufferS = ctx.length - 32;
  const bufferFrame = frameAtS(ctx, bufferS, createFrame());
  const buffer = new THREE.Group();
  buffer.position.copy(bufferFrame.pos);
  buffer.quaternion.copy(bufferFrame.quat);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.75, 0.6), ctx.mats.trainRed);
  beam.position.set(0, 1.15, 0);
  buffer.add(beam);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 0.28), ctx.mats.trainSkirt);
    post.position.set(side * 1.05, 0.75, 0);
    buffer.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), ctx.mats.tailLamp);
    lamp.position.set(side * 1.05, 1.7, -0.12);
    buffer.add(lamp);
    if (ctx.glowMap && ctx.quality.glowSprites) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: ctx.glowMap,
          color: 0xff2a1a,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      ctx.materials.push(sprite.material);
      sprite.position.copy(lamp.position);
      sprite.scale.setScalar(2.2);
      buffer.add(sprite);
    }
  }
  group.add(buffer);

  /* floodlight masts over the platform */
  const mastGeometry = new THREE.CylinderGeometry(0.16, 0.24, 14, 8);
  mastGeometry.translate(0, 7, 0);
  const headGeometry = new THREE.BoxGeometry(2.4, 0.5, 1.2);
  const mastItems = [];
  const headItems = [];
  for (let i = 0; i < 5; i += 1) {
    const s = sStart + 25 + i * ((sEnd - sStart - 40) / 4);
    const point = trackPointAt(ctx, s, -13.5, 0);
    point.y = frameAtS(ctx, s, _scratchFrameB).pos.y + groundRelative(ctx, s, progressAtS(ctx, s), -13.5);
    mastItems.push({ position: point.clone(), quaternion: frameAtS(ctx, s, _scratchFrameB).quat });
    headItems.push({
      position: point.clone().setY(point.y + 14),
      quaternion: frameAtS(ctx, s, _scratchFrameB).quat,
    });
  }
  const mastMesh = instancedFrom(ctx, mastGeometry, ctx.mats.canopySteel, mastItems, 'floodlightMasts', { castShadow: true });
  const headMesh = instancedFrom(ctx, headGeometry, ctx.mats.lampHousing, headItems, 'floodlightHeads');
  if (mastMesh) group.add(mastMesh);
  if (headMesh) group.add(headMesh);

  // warm wash over the arrival platform: a run of lamps so the whole
  // platform reads at night, not just the middle
  const platformLights = [];
  for (const offset of [0, 60, 120, 180, 230]) {
    const lampS = Math.min(sEnd - 8, sStart + 30 + offset);
    const light = new THREE.PointLight(0xffd9a6, 0.0, 120, 2);
    light.position.copy(trackPointAt(ctx, lampS, -6.5, 7.2));
    group.add(light);
    platformLights.push(light);
  }
  ctx.terminalLights = platformLights;
  const platformLight = platformLights[platformLights.length - 1];

  return group;
}

/* ========================================================================== */
/*  Origin yard                                                              */
/* ========================================================================== */

function buildYard(ctx) {
  const { quality, mats } = ctx;
  const group = new THREE.Group();
  group.name = 'originYard';

  /* platform at the starting station */
  group.add(
    buildStationPlatform(ctx, {
      sFrom: 120,
      sTo: 350,
      side: -1,
      edge: 2.55,
      width: 7.4,
      top: 0.92,
      canopy: true,
      lamps: Math.max(4, Math.round(quality.platformLamps * 0.5)),
      signTexture: ctx.signs.origin,
    })
  );

  /* maintenance shed and yard office on the far side */
  const shedFrame = frameAtS(ctx, 520, createFrame());
  const shedLateral = 22;
  const shedBaseY = shedFrame.pos.y + groundRelative(ctx, 520, progressAtS(ctx, 520), shedLateral);
  const shed = new THREE.Group();
  shed.position.set(
    shedFrame.pos.x + shedFrame.right.x * shedLateral,
    shedBaseY,
    shedFrame.pos.z + shedFrame.right.z * shedLateral
  );
  shed.quaternion.copy(shedFrame.quat);
  shed.rotateY(-Math.PI / 2);

  const shedBody = new THREE.Mesh(new THREE.BoxGeometry(34, 9, 18), mats.concreteLight);
  shedBody.position.set(0, 4.5, 0);
  shedBody.castShadow = quality.shadows;
  shedBody.receiveShadow = quality.shadows;
  shed.add(shedBody);
  const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(36, 0.7, 20), mats.canopyRoof);
  shedRoof.position.set(0, 9.2, 0);
  shed.add(shedRoof);
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3c46, roughness: 0.6, metalness: 0.4 });
  ctx.materials.push(doorMaterial);
  for (let i = -1; i <= 1; i += 1) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 0.3), doorMaterial);
    door.position.set(i * 10, 3.6, 9.1);
    shed.add(door);
  }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 0.6), mats.lampGlass);
  lamp.position.set(0, 7.6, 9.2);
  shed.add(lamp);
  group.add(shed);

  /* floodlight masts over the yard */
  const mastGeometry = new THREE.CylinderGeometry(0.14, 0.22, 13, 8);
  mastGeometry.translate(0, 6.5, 0);
  const headGeometry = new THREE.BoxGeometry(2.0, 0.45, 1.0);
  const mastItems = [];
  const headItems = [];
  for (const s of [180, 300, 430]) {
    const frame = frameAtS(ctx, s, _scratchFrame);
    const lateral = 12.5;
    const groundY = frame.pos.y + groundRelative(ctx, s, progressAtS(ctx, s), lateral);
    const point = new THREE.Vector3(
      frame.pos.x + frame.right.x * lateral,
      groundY,
      frame.pos.z + frame.right.z * lateral
    );
    mastItems.push({ position: point.clone(), quaternion: frame.quat });
    headItems.push({ position: point.clone().setY(groundY + 13), quaternion: frame.quat });
  }
  const mastMesh = instancedFrom(ctx, mastGeometry, mats.mastSteel, mastItems, 'yardFloodlightMasts', { castShadow: true });
  const headMesh = instancedFrom(ctx, headGeometry, mats.lampHousing, headItems, 'yardFloodlightHeads');
  if (mastMesh) group.add(mastMesh);
  if (headMesh) group.add(headMesh);

  /* a stub siding on the right with buffer stop */
  const sidingLateral = (s) => 6.2 * smoothstep(360, 440, s) + 6.2 * (1 - smoothstep(760, 830, s));
  const sidingGeometry = [];
  for (const offset of [-RAIL_HALF_GAUGE, RAIL_HALF_GAUGE]) {
    sidingGeometry.push(
      sweepClosedProfile(ctx, 360, 830, quality.railStep, RAIL_PROFILE, offset, sidingLateral)
    );
  }
  const sidingPositions = [];
  const sidingIndices = [];
  let offsetVerts = 0;
  for (const g of sidingGeometry) {
    const pos = g.getAttribute('position').array;
    for (let i = 0; i < pos.length; i += 1) sidingPositions.push(pos[i]);
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i += 1) sidingIndices.push(idx[i] + offsetVerts);
    offsetVerts += g.getAttribute('position').count;
    g.dispose();
  }
  const sidingRailGeometry = new THREE.BufferGeometry();
  sidingRailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sidingPositions, 3));
  sidingRailGeometry.setIndex(sidingIndices);
  sidingRailGeometry.computeVertexNormals();
  group.add(new THREE.Mesh(sidingRailGeometry, mats.railSteel));

  // siding sleepers + ballast
  const sidingBallast = sweepProfile(
    ctx,
    360,
    830,
    quality.ribbonStep,
    [
      [-3.0, -1.25],
      [-2.2, BALLAST_TOP],
      [2.2, BALLAST_TOP],
      [3.0, -1.25],
    ],
    sidingLateral,
    2.6
  );
  group.add(new THREE.Mesh(sidingBallast, mats.ballast));

  const sleeperGeometry = new THREE.BoxGeometry(2.5, 0.2, 0.27);
  const sleeperItems = [];
  for (let s = 372; s < 820; s += quality.sleeperStep * 1.15) {
    const frame = frameAtS(ctx, s, _scratchFrameB);
    const lateral = sidingLateral(s);
    sleeperItems.push({
      position: new THREE.Vector3(
        frame.pos.x + frame.right.x * lateral,
        frame.pos.y + SLEEPER_TOP - 0.1,
        frame.pos.z + frame.right.z * lateral
      ),
      quaternion: frame.quat,
    });
  }
  const sleeperMesh = instancedFrom(ctx, sleeperGeometry, mats.sleeperWood, sleeperItems, 'sidingSleepers', {
    receiveShadow: quality.shadows,
  });
  if (sleeperMesh) group.add(sleeperMesh);

  /* yard signal gantry with route indicator */
  const gantryS = 620;
  const gantryFrame = frameAtS(ctx, gantryS, createFrame());
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 8, 0.28), mats.signalPost);
    post.position
      .copy(gantryFrame.pos)
      .addScaledVector(gantryFrame.right, side * 6.4)
      .addScaledVector(WORLD_UP, 3.6);
    post.quaternion.copy(gantryFrame.quat);
    group.add(post);
  }
  const gantryBeam = new THREE.Mesh(new THREE.BoxGeometry(13, 0.36, 0.32), mats.signalPost);
  gantryBeam.position.copy(gantryFrame.pos).addScaledVector(WORLD_UP, 7.6);
  gantryBeam.quaternion.copy(gantryFrame.quat);
  group.add(gantryBeam);

  return group;
}

/* ========================================================================== */
/*  Locomotive                                                               */
/* ========================================================================== */

function addBox(parent, material, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0, name = '') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, material, radiusTop, radiusBottom, height, segments, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material
  );
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}

function makeWheelsetGeometry(radius, halfGauge) {
  const parts = [];
  for (const side of [-1, 1]) {
    const tyre = new THREE.CylinderGeometry(radius, radius, 0.12, 20);
    tyre.rotateZ(Math.PI / 2);
    tyre.translate(side * halfGauge, 0, 0);
    parts.push(tyre);
    const flange = new THREE.CylinderGeometry(radius * 1.06, radius * 1.06, 0.05, 20);
    flange.rotateZ(Math.PI / 2);
    flange.translate(side * (halfGauge + 0.08), 0, 0);
    parts.push(flange);
  }
  const axle = new THREE.CylinderGeometry(radius * 0.16, radius * 0.16, halfGauge * 2, 10);
  axle.rotateZ(Math.PI / 2);
  parts.push(axle);
  return mergeGeometryList(parts);
}

function makeBogieGeometry(width, length) {
  const parts = [];
  const frame = new THREE.BoxGeometry(width, 0.42, length);
  frame.translate(0, 0.42, 0);
  parts.push(frame);
  for (const side of [-1, 1]) {
    const sideFrame = new THREE.BoxGeometry(0.16, 0.5, length * 1.06);
    sideFrame.translate(side * (width * 0.5 - 0.02), 0.34, 0);
    parts.push(sideFrame);
    for (const zOff of [-length * 0.32, length * 0.32]) {
      const axlebox = new THREE.BoxGeometry(0.3, 0.36, 0.42);
      axlebox.translate(side * (width * 0.5 - 0.02), 0.28, zOff);
      parts.push(axlebox);
    }
  }
  const bolster = new THREE.BoxGeometry(width * 0.7, 0.26, 0.5);
  bolster.translate(0, 0.7, 0);
  parts.push(bolster);
  return mergeGeometryList(parts);
}

function buildLocomotive(ctx) {
  const { mats, quality } = ctx;
  const group = new THREE.Group();
  group.name = 'locomotive';
  const loco = {
    group,
    wheels: [],
    axles: [],
    cab: null,
    headlampGlows: [],
    tailGlows: [],
    spot: null,
    pantograph: null,
    cabSignalLamps: [],
  };

  const bodyMaterial = mats.trainBody;
  const wheelRadius = 0.62;
  const halfGauge = 0.72;

  /* ---------------------------------------------------------- underframe -- */
  addBox(group, mats.trainSkirt, 3.02, 0.52, 19.2, 0, 1.04, 0, 0, 0, 0, 'underframe');
  addBox(group, mats.trainSkirt, 2.86, 0.3, 17.8, 0, 0.78, 0);

  /* side panels: an extruded silhouette gives the raked nose its shape */
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-9.2, 1.28);
  sideShape.lineTo(9.15, 1.28);
  sideShape.lineTo(9.42, 1.5);
  sideShape.lineTo(9.2, 2.1);
  sideShape.lineTo(8.5, 3.2);
  sideShape.lineTo(7.85, 3.94);
  sideShape.lineTo(-9.2, 3.94);
  sideShape.closePath();
  const sideWindowHole = new THREE.Path();
  sideWindowHole.moveTo(6.18, 3.04);
  sideWindowHole.lineTo(7.82, 3.04);
  sideWindowHole.lineTo(7.82, 3.84);
  sideWindowHole.lineTo(6.18, 3.84);
  sideWindowHole.closePath();
  sideShape.holes.push(sideWindowHole);
  const sideGeometry = new THREE.ExtrudeGeometry(sideShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 1,
    curveSegments: 3,
  });
  sideGeometry.rotateY(-Math.PI / 2);
  const sideRight = new THREE.Mesh(sideGeometry, bodyMaterial);
  sideRight.position.x = 1.45;
  sideRight.castShadow = quality.shadows;
  sideRight.receiveShadow = quality.shadows;
  group.add(sideRight);
  const sideLeft = new THREE.Mesh(sideGeometry, bodyMaterial);
  sideLeft.position.x = -1.31;
  sideLeft.castShadow = quality.shadows;
  sideLeft.receiveShadow = quality.shadows;
  group.add(sideLeft);

  /* roof: shallow curved slab */
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.5, 3.9);
  roofShape.lineTo(1.5, 3.9);
  roofShape.lineTo(1.5, 4.0);
  roofShape.quadraticCurveTo(0, 4.46, -1.5, 4.0);
  roofShape.closePath();
  const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
    depth: 17.2,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 1,
    curveSegments: 6,
  });
  roofGeometry.translate(0, 0, -8.9);
  const roof = new THREE.Mesh(roofGeometry, mats.trainRoof);
  roof.castShadow = quality.shadows;
  group.add(roof);

  /* cream livery band + red pinstripe along both flanks */
  for (const side of [-1, 1]) {
    addBox(group, mats.trainCream, 0.045, 0.34, 16.4, side * 1.455, 2.62, -0.9);
    addBox(group, mats.trainRed, 0.04, 0.1, 16.4, side * 1.458, 2.38, -0.9);
    addBox(group, mats.trainCream, 0.045, 0.12, 16.4, side * 1.455, 3.72, -0.9);
  }

  /* louvre slats on the machine room flanks */
  const slatGeometry = new THREE.BoxGeometry(0.05, 0.72, 0.1);
  const slats = [];
  for (const side of [-1, 1]) {
    for (let z = -7.6; z < 5.0; z += 0.44) {
      slats.push({
        position: new THREE.Vector3(side * 1.47, 3.24, z),
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
      });
    }
  }
  const slatMesh = instancedFrom(ctx, slatGeometry, ctx.mats.trainSkirt, slats, 'louvres');
  if (slatMesh) group.add(slatMesh);

  /* --------------------------------------------------------- cab front --- */
  const frontZ = 8.42;
  addBox(group, bodyMaterial, 0.13, 2.75, 0.2, -1.42, 2.66, frontZ, 0, 0, 0, 'aPillarLeft');
  addBox(group, bodyMaterial, 0.13, 2.75, 0.2, 1.42, 2.66, frontZ, 0, 0, 0, 'aPillarRight');
  addBox(group, bodyMaterial, 3.0, 0.18, 0.22, 0, 4.02, frontZ, 0, 0, 0, 'header');
  addBox(group, bodyMaterial, 3.0, 0.16, 0.22, 0, 2.98, frontZ);
  addBox(group, bodyMaterial, 0.07, 0.96, 0.16, 0, 3.5, frontZ, 0, 0, 0, 'centrePillar');

  // raked nose below the windscreen
  const noseMain = addBox(group, mats.trainBodyDeep, 3.0, 1.05, 1.2, 0, 2.06, 8.95, -0.62, 0, 0, 'nose');
  noseMain.castShadow = quality.shadows;

  // red nose accent and front skirt
  addBox(group, mats.trainRed, 2.9, 0.34, 0.16, 0, 1.72, 9.44);
  addBox(group, mats.trainSkirt, 3.02, 0.62, 0.3, 0, 0.86, 9.34);
  addBox(group, mats.trainSkirt, 3.02, 0.56, 0.34, 0, 0.9, -9.36);

  /* buffers and couplers */
  for (const z of [9.52, -9.52]) {
    for (const side of [-1, 1]) {
      addCylinder(group, mats.trainSkirt, 0.2, 0.24, 0.34, 10, side * 0.86, 0.9, z, Math.PI / 2, 0, 0);
    }
    addBox(group, mats.trainSkirt, 0.28, 0.26, 0.8, 0, 0.72, z + (z > 0 ? 0.3 : -0.3));
  }

  /* windscreen glass */
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9fc8dd,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
    clearcoat: 1,
  });
  ctx.materials.push(glassMaterial);
  for (const side of [-1, 1]) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.96), glassMaterial);
    pane.position.set(side * 0.7, 3.5, frontZ + 0.13);
    pane.rotation.y = Math.PI;
    group.add(pane);
    // wiper
    addBox(group, mats.trainSkirt, 0.035, 0.72, 0.035, side * 1.18, 3.28, frontZ + 0.21, 0, 0, side * 0.16);
  }

  /* cab side windows (dark glass with frames) */
  for (const side of [-1, 1]) {
    addBox(group, mats.glassDark, 0.05, 0.86, 1.5, side * 1.475, 3.44, 6.9);
    addBox(group, mats.trainSkirt, 0.06, 0.06, 1.6, side * 1.48, 2.98, 6.9);
    addBox(group, mats.trainSkirt, 0.06, 0.06, 1.6, side * 1.48, 3.9, 6.9);
  }

  /* ------------------------------------------------------- headlights ---- */
  const lampGeometry = new THREE.CircleGeometry(0.16, 16);
  for (const side of [-1, 1]) {
    addCylinder(group, mats.trainSkirt, 0.2, 0.22, 0.22, 12, side * 0.82, 2.62, 9.36, Math.PI / 2, 0, 0);
    const lamp = new THREE.Mesh(lampGeometry, mats.headlampLens);
    lamp.position.set(side * 0.82, 2.62, 9.48);
    lamp.rotation.y = Math.PI;
    group.add(lamp);
    loco.headlampGlows.push(lamp);

    // ditch lights low on the nose
    const ditch = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), mats.ditchLamp);
    ditch.position.set(side * 1.16, 1.62, 9.45);
    ditch.rotation.y = Math.PI;
    group.add(ditch);
  }

  /* headlamp beam */
  const spot = new THREE.SpotLight(0xfff0cf, 0, 260, 0.34, 0.55, 1.4);
  spot.position.set(0, 2.55, 9.4);
  spot.castShadow = false;
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0.2, 90);
  group.add(spotTarget);
  spot.target = spotTarget;
  group.add(spot);
  loco.spot = spot;

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffeec2,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  ctx.materials.push(beamMaterial);
  const beamGeometry = new THREE.ConeGeometry(5.6, 58, 18, 1, true);
  beamGeometry.rotateX(-Math.PI / 2);
  beamGeometry.translate(0, 0, 29);
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.position.set(0, 2.2, 9.4);
  beam.name = 'headlampBeam';
  group.add(beam);
  loco.beam = beam;
  loco.beamMaterial = beamMaterial;

  /* pools of light on the rails ahead */
  if (ctx.poolMap) {
    const poolMaterial = new THREE.MeshBasicMaterial({
      map: ctx.poolMap,
      color: 0xffe9bd,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    ctx.materials.push(poolMaterial);
    const poolGeometry = new THREE.PlaneGeometry(9.5, 42);
    poolGeometry.rotateX(-Math.PI / 2);
    const pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.position.set(0, 0.08, 30);
    pool.name = 'headlampPool';
    group.add(pool);
    loco.pool = pool;
    loco.poolMaterial = poolMaterial;
  }

  /* glow sprites for the lamps */
  if (ctx.glowMap && quality.glowSprites) {
    for (const side of [-1, 1]) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: ctx.glowMap,
          color: 0xfff1cc,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      ctx.materials.push(sprite.material);
      sprite.position.set(side * 0.82, 2.62, 9.6);
      sprite.scale.setScalar(4.2);
      group.add(sprite);
      loco.headlampGlows.push(sprite);
    }
  }

  /* tail lamps for the locomotive end (shunting) */
  for (const side of [-1, 1]) {
    const tail = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), mats.tailLamp);
    tail.position.set(side * 1.05, 1.55, -9.55);
    group.add(tail);
  }

  /* roof equipment: insulators, horns, air-conditioning bump */
  addBox(group, mats.trainRoof, 1.5, 0.24, 2.4, 0, 4.36, -2.4);
  addBox(group, mats.trainRoof, 1.2, 0.2, 1.6, 0, 4.34, -6.2);
  const insulatorGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.26, 8);
  for (let i = 0; i < 4; i += 1) {
    const insulator = new THREE.Mesh(insulatorGeometry, mats.concreteLight);
    insulator.position.set(-0.5 + (i % 2) * 1.0, 4.5, 2.2 + Math.floor(i / 2) * 0.9);
    group.add(insulator);
  }
  // horn
  addCylinder(group, mats.pantograph, 0.16, 0.1, 0.5, 10, 0.4, 4.55, 6.2, Math.PI / 2, 0, 0);

  /* -------------------------------------------------------- pantograph --- */
  const panto = new THREE.Group();
  panto.name = 'pantograph';
  panto.position.set(0, 4.3, 2.6);
  const pantoParts = [];
  const base = new THREE.BoxGeometry(1.9, 0.1, 0.7);
  base.translate(0, 0.05, 0);
  pantoParts.push(base);
  for (const side of [-1, 1]) {
    for (const z of [-0.28, 0.28]) {
      const ins = new THREE.CylinderGeometry(0.07, 0.09, 0.24, 8);
      ins.translate(side * 0.8, 0.2, z);
      pantoParts.push(ins);
    }
    // lower arm
    const lower = new THREE.BoxGeometry(0.07, 0.07, 1.1);
    lower.rotateX(-0.5);
    lower.translate(side * 0.55, 0.62, 0.05);
    pantoParts.push(lower);
    // upper arm
    const upper = new THREE.BoxGeometry(0.06, 0.06, 1.0);
    upper.rotateX(0.62);
    upper.translate(side * 0.5, 1.02, -0.24);
    pantoParts.push(upper);
  }
  const strip = new THREE.BoxGeometry(1.85, 0.07, 0.16);
  strip.translate(0, 1.28, -0.5);
  pantoParts.push(strip);
  const pantoGeometry = mergeGeometryList(pantoParts);
  const pantoMesh = new THREE.Mesh(pantoGeometry, mats.pantograph);
  pantoMesh.castShadow = false;
  panto.add(pantoMesh);
  group.add(panto);
  loco.pantograph = panto;

  /* ------------------------------------------------------------- bogies -- */
  const bogieGeometry = makeBogieGeometry(2.3, 3.5);
  const wheelsetGeometry = makeWheelsetGeometry(wheelRadius, halfGauge);
  for (const bogieZ of [-5.5, 5.5]) {
    const bogie = new THREE.Group();
    bogie.position.set(0, 0, bogieZ);
    const frame = new THREE.Mesh(bogieGeometry, mats.bogie);
    frame.castShadow = quality.shadows;
    bogie.add(frame);
    for (const axleZ of [-1.15, 1.15]) {
      const axle = new THREE.Mesh(wheelsetGeometry, mats.wheel);
      axle.position.set(0, wheelRadius, axleZ);
      axle.castShadow = quality.shadows;
      bogie.add(axle);
      loco.axles.push(axle);
    }
    // traction motor blobs
    for (const side of [-1, 1]) {
      addCylinder(bogie, mats.bogie, 0.28, 0.28, 0.8, 10, side * 0.55, 0.55, 0, Math.PI / 2, 0, 0);
    }
    group.add(bogie);
  }

  /* ------------------------------------------------------------- the cab -- */
  loco.cab = buildCabInterior(ctx, group);
  group.add(loco.cab.group);

  group.traverse((object) => {
    if (object.isMesh && object.material && object.material.isMeshStandardMaterial) {
      object.castShadow = quality.shadows && object.name !== 'headlampBeam';
    }
  });

  return loco;
}

/* ========================================================================== */
/*  Cab interior                                                             */
/* ========================================================================== */

function buildCabInterior(ctx, locoGroup) {
  const { mats } = ctx;
  const group = new THREE.Group();
  group.name = 'cabInterior';
  const cab = {
    group,
    gaugeNeedle: null,
    throttleLever: null,
    brakeLever: null,
    signalLamps: { green: null, amber: null, red: null },
    screens: [],
    light: null,
    eye: new THREE.Vector3(-0.56, 3.34, 6.42),
  };

  const interiorMaterial = mats.cabWall.clone();
  interiorMaterial.side = THREE.DoubleSide;
  interiorMaterial.emissive = new THREE.Color(0x18232a);
  interiorMaterial.emissiveIntensity = 1;
  ctx.materials.push(interiorMaterial);
  const cabGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9fc8dd,
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  ctx.materials.push(cabGlassMaterial);

  /* floor, ceiling, rear bulkhead */
  addBox(group, mats.cabFloor, 2.78, 0.1, 3.2, 0, 2.0, 6.85);
  addBox(group, mats.deskPanel, 2.4, 0.03, 2.3, 0, 2.06, 6.7);
  addBox(group, mats.cabCeiling, 2.76, 0.06, 3.2, 0, 4.0, 6.85);
  addBox(group, mats.cabCeiling, 2.6, 0.1, 1.5, 0, 3.93, 6.6);
  addBox(group, interiorMaterial, 2.86, 2.1, 0.1, 0, 3.02, 5.25, 0, 0, 0, 'cabRearWall');
  addBox(group, mats.trainSkirt, 0.8, 1.85, 0.08, 0, 2.96, 5.31);
  addCylinder(group, mats.leverMetal, 0.032, 0.032, 0.2, 8, 0.28, 2.85, 5.35, 0, 0, Math.PI / 2);

  /* side walls with a window opening */
  for (const side of [-1, 1]) {
    addBox(group, interiorMaterial, 0.06, 0.95, 3.2, side * 1.36, 2.52, 6.85);
    addBox(group, interiorMaterial, 0.06, 0.24, 3.2, side * 1.36, 3.9, 6.85);
    addBox(group, interiorMaterial, 0.06, 0.95, 0.95, side * 1.36, 3.42, 5.7);
    addBox(group, interiorMaterial, 0.06, 0.95, 0.45, side * 1.36, 3.42, 8.15);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 0.8), cabGlassMaterial);
    pane.position.set(side * 1.345, 3.42, 7.0);
    pane.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(pane);
    addBox(group, mats.deskPanel, 0.05, 0.06, 1.8, side * 1.34, 3.84, 7.0);
    addBox(group, mats.deskPanel, 0.05, 0.06, 1.8, side * 1.34, 3.0, 7.0);
  }

  /* windscreen trim and sun visor */
  addBox(group, interiorMaterial, 2.7, 0.1, 0.08, 0, 4.0, 8.34);
  addBox(group, interiorMaterial, 2.7, 0.1, 0.08, 0, 2.98, 8.34);
  addBox(group, interiorMaterial, 0.1, 1.02, 0.08, -1.32, 3.5, 8.34);
  addBox(group, interiorMaterial, 0.1, 1.02, 0.08, 1.32, 3.5, 8.34);
  addBox(group, mats.deskPanel, 2.5, 0.05, 0.42, 0, 3.96, 8.12, -0.2, 0, 0);
  // wipers resting at the bottom of the glass
  for (const side of [-1, 1]) {
    addBox(group, mats.trainSkirt, 0.03, 0.55, 0.03, side * 0.9, 3.16, 8.44, 0, 0, side * 0.9);
  }

  /* desk: a shelf with a tilted instrument deck facing the crew */
  addBox(group, mats.deskPanel, 2.72, 0.62, 0.8, 0, 2.68, 7.98);
  addBox(group, mats.deskTop, 2.72, 0.07, 0.9, 0, 2.94, 7.94, -0.05, 0, 0);
  const instrumentDeck = addBox(group, mats.deskPanel, 2.34, 0.05, 0.52, 0, 3.05, 7.92, -0.5, 0, 0);
  instrumentDeck.receiveShadow = false;
  addBox(group, mats.leverMetal, 2.3, 0.02, 0.04, 0, 2.99, 7.68);
  for (let i = 0; i < 5; i += 1) {
    addBox(group, i % 2 ? mats.screenAmber : mats.lensOff, 0.028, 0.018, 0.028, 0.28 + i * 0.09, 3.02, 7.74);
  }

  /* speedometer and two small gauges on the instrument deck */
  if (mats.gaugeFace.map) {
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.115, 24), mats.gaugeFace);
    dial.position.set(-1.02, 3.13, 7.82);
    dial.rotation.set(-0.5, Math.PI, 0);
    group.add(dial);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.119, 0.012, 6, 24), mats.leverMetal);
    bezel.position.copy(dial.position).setZ(7.795);
    bezel.rotation.copy(dial.rotation);
    group.add(bezel);
    const needlePivot = new THREE.Group();
    needlePivot.position.set(-1.02, 3.12, 7.84);
    needlePivot.rotation.set(-0.5, Math.PI, 0);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.1, 0.004), mats.lensAmber);
    needle.position.set(0, 0.042, 0.012);
    needlePivot.add(needle);
    group.add(needlePivot);
    cab.gaugeNeedle = needlePivot;

    for (let i = 0; i < 2; i += 1) {
      const small = new THREE.Mesh(new THREE.CircleGeometry(0.042, 16), mats.gaugeFace);
      small.position.set(-0.78 + i * 0.13, 3.14, 7.85);
      small.rotation.set(-0.5, Math.PI, 0);
      group.add(small);
    }
  }

  /* cab signal display above the windscreen */
  addBox(group, mats.deskPanel, 0.62, 0.2, 0.09, 0, 3.9, 8.22);
  const signalLampGeometry = new THREE.CircleGeometry(0.035, 10);
  for (const spec of [
    { key: 'green', material: mats.lensGreen, x: -0.18 },
    { key: 'amber', material: mats.lensAmber, x: 0 },
    { key: 'red', material: mats.lensRed, x: 0.18 },
  ]) {
    const lamp = new THREE.Mesh(signalLampGeometry, spec.material);
    lamp.position.set(spec.x, 3.9, 8.17);
    lamp.rotation.y = Math.PI;
    group.add(lamp);
    cab.signalLamps[spec.key] = lamp;
  }

  /* screens */
  const screenMaterials = [mats.screenGlow, mats.screenAmber];
  for (let i = 0; i < 2; i += 1) {
    addBox(group, mats.deskPanel, 0.32, 0.24, 0.05, -0.3 + i * 0.48, 3.13, 7.89, -0.5, 0, 0);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.18), screenMaterials[i]);
    screen.position.set(-0.3 + i * 0.48, 3.15, 7.84);
    screen.rotation.set(-0.5, Math.PI, 0);
    group.add(screen);
    cab.screens.push(screen);
  }

  /* levers */
  function makeLever(x, z, material) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 2.95, z);
    addCylinder(pivot, mats.deskPanel, 0.06, 0.08, 0.12, 10, 0, 0, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.3, 8), mats.leverMetal);
    arm.position.set(0, 0.15, 0);
    pivot.add(arm);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), material);
    knob.position.set(0, 0.31, 0);
    pivot.add(knob);
    pivot.rotation.x = -0.4;
    group.add(pivot);
    return pivot;
  }
  cab.throttleLever = makeLever(0.42, 7.66, mats.leverKnob);
  cab.brakeLever = makeLever(-0.42, 7.66, mats.trainRed);

  /* driver and assistant seats */
  for (const x of [-1.02, 0.62]) {
    addBox(group, mats.seatFabric, 0.58, 0.16, 0.58, x, 2.63, 5.9);
    addBox(group, mats.seatFabric, 0.58, 0.72, 0.15, x, 2.98, 5.64, -0.14, 0, 0);
    addCylinder(group, mats.leverMetal, 0.055, 0.065, 0.62, 8, x, 2.33, 5.9);
    addBox(group, mats.seatFabric, 0.18, 0.1, 0.34, x + 0.4, 2.92, 5.94, 0, 0, 0);
    addBox(group, mats.leverMetal, 0.34, 0.04, 0.34, x, 2.2, 5.9);
  }

  /* cab light */
  addBox(group, mats.lampGlass, 0.34, 0.05, 0.16, 0, 3.95, 7.0);
  const light = new THREE.PointLight(0xffd9a0, 3.0, 9, 2);
  light.position.set(0, 3.8, 7.0);
  group.add(light);
  cab.light = light;
  const bounce = new THREE.PointLight(0xa9c4d6, 0.7, 5.5, 2);
  bounce.position.set(0.2, 2.7, 6.3);
  group.add(bounce);
  cab.bounce = bounce;

  /* radio, emergency valve, extinguisher */
  addBox(group, mats.deskPanel, 0.28, 0.2, 0.07, 0.78, 3.42, 5.33);
  addBox(group, mats.screenAmber, 0.11, 0.03, 0.01, 0.78, 3.44, 5.29);
  addCylinder(group, mats.trainRed, 0.075, 0.075, 0.5, 10, 1.14, 2.32, 5.5);
  addBox(group, mats.leverMetal, 0.12, 0.06, 0.12, 1.14, 2.58, 5.5);

  void locoGroup;
  return cab;
}

/* ========================================================================== */
/*  Coaches                                                                  */
/* ========================================================================== */

const COACH_LENGTH = 23.4;
const COACH_HALF = COACH_LENGTH / 2;
const LOCO_HALF = 9.6;
const VEHICLE_GAP = 0.65;

function buildCoach(ctx, index, isLast) {
  const { mats, quality } = ctx;
  const group = new THREE.Group();
  group.name = `coach${index + 1}`;
  const coach = { group, axles: [], index };

  /* body shell */
  addBox(group, mats.trainCream, 3.0, 3.05, COACH_LENGTH, 0, 2.6, 0);
  addBox(group, mats.trainBodyDeep, 3.04, 1.04, COACH_LENGTH - 1.4, 0, 3.3, 0);
  addBox(group, mats.trainSkirt, 2.92, 0.5, COACH_LENGTH - 0.6, 0, 1.0, 0);
  addBox(group, mats.trainRed, 3.02, 0.1, 2.2, 0, 2.02, 0);

  /* curved roof */
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.48, 4.1);
  roofShape.lineTo(1.48, 4.1);
  roofShape.lineTo(1.48, 4.2);
  roofShape.quadraticCurveTo(0, 4.62, -1.48, 4.2);
  roofShape.closePath();
  const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
    depth: COACH_LENGTH - 1.0,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 1,
    curveSegments: 5,
  });
  roofGeometry.translate(0, 0, -(COACH_LENGTH - 1.0) / 2);
  const roof = new THREE.Mesh(roofGeometry, mats.trainRoof);
  roof.castShadow = quality.shadows;
  group.add(roof);

  /* window band and lit windows */
  const windowCount = 11;
  const windowGeometry = new THREE.PlaneGeometry(1.16, 0.82);
  const windowMaterial = ctx.windowMaterial;
  const positions = [];
  for (let i = 0; i < windowCount; i += 1) {
    const z = -COACH_LENGTH / 2 + 2.2 + (i * (COACH_LENGTH - 4.4)) / (windowCount - 1);
    for (const side of [-1, 1]) {
      positions.push({
        position: new THREE.Vector3(side * 1.552, 3.34, z),
        yaw: side > 0 ? Math.PI / 2 : -Math.PI / 2,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
      });
    }
  }
  const windowMesh = instancedFrom(ctx, windowGeometry, windowMaterial, positions, 'coachWindows', {});
  if (windowMesh) group.add(windowMesh);
  ctx.coachWindowMeshes.push(windowMesh);

  /* window frames and doors */
  for (const side of [-1, 1]) {
    addBox(group, mats.trainRoof, 0.02, 0.1, COACH_LENGTH - 2.4, side * 1.53, 3.9, 0);
  }
  const doorGeometry = new THREE.BoxGeometry(0.05, 2.3, 1.05);
  const doorItems = [];
  for (const z of [-COACH_LENGTH / 2 + 2.6, COACH_LENGTH / 2 - 2.6]) {
    for (const side of [-1, 1]) {
      doorItems.push({ position: new THREE.Vector3(side * 1.54, 2.35, z), scaleX: 1, scaleY: 1, scaleZ: 1 });
    }
  }
  const doorMesh = instancedFrom(ctx, doorGeometry, mats.trainBodyDeep, doorItems, 'coachDoors');
  if (doorMesh) group.add(doorMesh);

  /* roof equipment */
  addBox(group, mats.trainRoof, 1.1, 0.24, 2.2, 0, 4.55, -3.5);
  addBox(group, mats.trainRoof, 1.1, 0.24, 2.2, 0, 4.55, 4.5);
  addBox(group, mats.trainRoof, 0.7, 0.16, 6.0, 0, 4.5, 0.5);

  /* gangways */
  addBox(group, mats.trainSkirt, 1.5, 2.2, 0.42, 0, 2.6, -COACH_LENGTH / 2 - 0.1);
  addBox(group, mats.trainSkirt, 1.5, 2.2, 0.42, 0, 2.6, COACH_LENGTH / 2 + 0.1);

  /* bogies */
  const bogieGeometry = makeBogieGeometry(2.2, 2.9);
  const wheelsetGeometry = makeWheelsetGeometry(0.46, 0.68);
  for (const bogieZ of [-8.0, 8.0]) {
    const bogie = new THREE.Group();
    bogie.position.set(0, 0, bogieZ);
    const frame = new THREE.Mesh(bogieGeometry, mats.bogie);
    bogie.add(frame);
    for (const axleZ of [-1.0, 1.0]) {
      const axle = new THREE.Mesh(wheelsetGeometry, mats.wheel);
      axle.position.set(0, 0.46, axleZ);
      bogie.add(axle);
      coach.axles.push(axle);
    }
    group.add(bogie);
  }

  /* tail lamps on the last vehicle */
  if (isLast) {
    for (const side of [-1, 1]) {
      const tail = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), mats.tailLamp);
      tail.position.set(side * 1.1, 1.7, -COACH_LENGTH / 2 - 0.34);
      group.add(tail);
      if (ctx.glowMap && quality.glowSprites) {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: ctx.glowMap,
            color: 0xff2a1a,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        ctx.materials.push(sprite.material);
        sprite.position.set(side * 1.1, 1.7, -COACH_LENGTH / 2 - 0.42);
        sprite.scale.setScalar(1.6);
        group.add(sprite);
        ctx.tailGlows.push(sprite);
      }
    }
  }

  group.traverse((object) => {
    if (object.isMesh && object.material && object.material.isMeshStandardMaterial) {
      object.castShadow = quality.shadows;
      object.receiveShadow = quality.shadows;
    }
  });

  return coach;
}

function buildTrain(ctx) {
  const group = new THREE.Group();
  group.name = 'train';
  const loco = buildLocomotive(ctx);
  group.add(loco.group);

  const coaches = [];
  for (let i = 0; i < ctx.coachCount; i += 1) {
    const coach = buildCoach(ctx, i, i === ctx.coachCount - 1);
    coaches.push(coach);
    group.add(coach.group);
  }

  const offsets = [0];
  for (let i = 0; i < coaches.length; i += 1) {
    offsets.push(-(LOCO_HALF + VEHICLE_GAP + COACH_HALF + i * (COACH_LENGTH + VEHICLE_GAP)));
  }

  return { group, loco, coaches, offsets };
}

/* ========================================================================== */
/*  Light, weather and time of day                                           */
/* ========================================================================== */

const ENV_KEYS = [
  {
    p: 0.0,
    zenith: 0x224b7d,
    mid: 0x7cadd2,
    horizon: 0xffcf9c,
    ground: 0x3b3327,
    sunset: 0xff9f6a,
    sunColor: 0xffd7a4,
    sunIntensity: 2.3,
    sunEl: 6,
    sunAz: -80,
    hemiSky: 0x9dc2de,
    hemiGround: 0x39432f,
    hemiIntensity: 0.7,
    fillColor: 0xa8c6e8,
    fillIntensity: 0.25,
    fog: 0xcfdae2,
    fogDensity: 0.0011,
    stars: 0.0,
    moon: 0.0,
    cityGlow: 0.0,
    night: 0.12,
  },
  {
    p: 0.1,
    zenith: 0x2b64a8,
    mid: 0x83bce4,
    horizon: 0xffe0b4,
    sunColor: 0xffe6b8,
    sunIntensity: 3.1,
    sunEl: 20,
    sunAz: -62,
    hemiIntensity: 0.8,
    fog: 0xdbe7ee,
    fogDensity: 0.0009,
    stars: 0.0,
    moon: 0.0,
    cityGlow: 0.0,
  },
  {
    p: 0.24,
    zenith: 0x2868bd,
    mid: 0x79c2f2,
    horizon: 0xdceeff,
    sunColor: 0xfff6e2,
    sunIntensity: 3.7,
    sunEl: 44,
    sunAz: -34,
    hemiSky: 0xb9dcf7,
    hemiGround: 0x4d5c39,
    hemiIntensity: 1.05,
    fillIntensity: 0.45,
    fog: 0xdfeaf2,
    fogDensity: 0.00062,
    stars: 0.0,
    moon: 0.0,
    cityGlow: 0.0,
  },
  {
    p: 0.38,
    zenith: 0x2b5c9e,
    mid: 0x8fc0e2,
    horizon: 0xffd6a2,
    ground: 0x4a3a28,
    sunset: 0xffa76a,
    sunColor: 0xffcf92,
    sunIntensity: 3.1,
    sunEl: 8,
    sunAz: -66,
    hemiSky: 0xcbb7a4,
    hemiGround: 0x4a4130,
    hemiIntensity: 0.75,
    fog: 0xf0d9bd,
    fogDensity: 0.0009,
    stars: 0.0,
    moon: 0.0,
    cityGlow: 0.0,
  },
  {
    p: 0.5,
    zenith: 0x274c86,
    mid: 0x9a8a9c,
    horizon: 0xffb173,
    sunset: 0xff8447,
    sunColor: 0xff9d5c,
    sunIntensity: 1.6,
    sunEl: 2.2,
    sunAz: -70,
    hemiSky: 0xd0a98e,
    hemiGround: 0x413a2c,
    hemiIntensity: 0.6,
    fog: 0xe2ab8b,
    fogDensity: 0.0012,
    stars: 0.02,
    moon: 0.0,
    cityGlow: 0.0,
    night: 0.34,
  },
  {
    p: 0.585,
    zenith: 0x1a2a52,
    mid: 0x54588a,
    horizon: 0xdb7a5c,
    sunset: 0xff6a42,
    sunColor: 0xff8250,
    sunIntensity: 0.7,
    sunEl: -1.5,
    sunAz: -74,
    hemiSky: 0x8d7f92,
    hemiGround: 0x2e2f26,
    hemiIntensity: 0.45,
    fog: 0x6c5563,
    fogDensity: 0.0016,
    stars: 0.22,
    moon: 0.15,
    cityGlow: 0.04,
    night: 0.66,
  },
  {
    p: 0.68,
    zenith: 0x0b1330,
    mid: 0x243257,
    horizon: 0x5f5570,
    ground: 0x161a1c,
    sunset: 0x9a5a63,
    sunColor: 0x9fb4e8,
    sunIntensity: 0.32,
    sunEl: 18,
    sunAz: 128,
    hemiSky: 0x334a74,
    hemiGround: 0x191c18,
    hemiIntensity: 0.24,
    fillColor: 0x6f88c8,
    fillIntensity: 0.12,
    fog: 0x121c2e,
    fogDensity: 0.0020,
    stars: 0.62,
    moon: 0.7,
    cityGlow: 0.12,
    night: 0.93,
  },
  {
    p: 0.78,
    zenith: 0x040917,
    mid: 0x0a1730,
    horizon: 0x1b314c,
    ground: 0x0a0d10,
    sunset: 0x2a3348,
    sunColor: 0x8fa8e0,
    sunIntensity: 0.28,
    sunEl: 34,
    sunAz: 136,
    hemiSky: 0x2a3f63,
    hemiGround: 0x12150f,
    hemiIntensity: 0.2,
    fillColor: 0x6a82bd,
    fillIntensity: 0.1,
    fog: 0x0a1422,
    fogDensity: 0.0024,
    stars: 1.0,
    moon: 1.0,
    cityGlow: 0.35,
    night: 1.0,
  },
  {
    p: 1.0,
    zenith: 0x050b1c,
    mid: 0x0c1a33,
    horizon: 0x22415f,
    ground: 0x0b0c10,
    sunset: 0x2f3a52,
    sunColor: 0x93aae2,
    sunIntensity: 0.3,
    sunEl: 36,
    sunAz: 140,
    hemiSky: 0x2c4266,
    hemiGround: 0x10130f,
    hemiIntensity: 0.22,
    fillColor: 0x6f88c4,
    fillIntensity: 0.1,
    fog: 0x0b1524,
    fogDensity: 0.0026,
    stars: 1.0,
    moon: 1.0,
    cityGlow: 0.5,
    night: 1.0,
  },
];

/**
 * Every keyframe is completed from the previous one, so partially specified
 * entries can never feed `undefined` into a light uniform (which would turn the
 * whole frame black).
 */
const ENV_DEFAULTS = {
  zenith: 0x2a6fc4,
  mid: 0x7dc3f2,
  horizon: 0xd8ecff,
  ground: 0x3b3327,
  sunset: 0xff9f6a,
  sunColor: 0xfff3dc,
  sunIntensity: 2.4,
  sunEl: 24,
  sunAz: -52,
  hemiSky: 0xb9dcf7,
  hemiGround: 0x4d5c39,
  hemiIntensity: 0.8,
  fillColor: 0xa8c6e8,
  fillIntensity: 0.25,
  fog: 0xdfeaf2,
  fogDensity: 0.0009,
  stars: 0,
  moon: 0,
  cityGlow: 0,
  night: 0,
};

const ENV_KEYS_RESOLVED = [];
for (let envIndex = 0; envIndex < ENV_KEYS.length; envIndex += 1) {
  const parent = envIndex === 0 ? ENV_DEFAULTS : ENV_KEYS_RESOLVED[envIndex - 1];
  ENV_KEYS_RESOLVED.push({ ...parent, ...ENV_KEYS[envIndex] });
}

const _sunDirection = new THREE.Vector3();
const _moonDirection = new THREE.Vector3();

const ENV_STATE = {
  zenith: new THREE.Color(),
  mid: new THREE.Color(),
  horizon: new THREE.Color(),
  ground: new THREE.Color(),
  sunsetColor: new THREE.Color(),
  sunColor: new THREE.Color(),
  hemiSky: new THREE.Color(),
  hemiGround: new THREE.Color(),
  fillColor: new THREE.Color(),
  fogColor: new THREE.Color(),
  sunDirection: _sunDirection,
  moonDirection: _moonDirection,
  sunIntensity: 2,
  hemiIntensity: 0.8,
  fillIntensity: 0.25,
  fogDensity: 0.001,
  stars: 0,
  moon: 0,
  cityGlow: 0,
  night: 0,
  daylight: 1,
  sunEl: 30,
};

const COLOR_A = new THREE.Color();
const COLOR_B = new THREE.Color();
const COLOR_TMP = new THREE.Color();

function mixHex(a, b, t, out) {
  COLOR_A.setHex(a);
  COLOR_B.setHex(b);
  out.copy(COLOR_A).lerp(COLOR_B, t);
  return out;
}

function directionFromAngles(azDeg, elDeg, out) {
  const az = azDeg * DEG;
  const el = elDeg * DEG;
  return out.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
}

/**
 * Interpolate the full lighting/sky state for a progress value. Allocations are
 * avoided: the returned object and its colours are reused between calls.
 */
function sampleEnvironment(progress) {
  const p = clamp01(progress);
  let i = 0;
  const keys = ENV_KEYS_RESOLVED;
  while (i < keys.length - 2 && keys[i + 1].p <= p) i += 1;
  const a = keys[i];
  const b = keys[i + 1];
  const t = smoothstep(0, 1, clamp01((p - a.p) / (b.p - a.p || 1)));

  const lerpColor = (key, out) => mixHex(a[key], b[key], t, out);
  const lerpNumber = (key) => lerp(finite(a[key], 0), finite(b[key], 0), t);

  lerpColor('zenith', ENV_STATE.zenith);
  lerpColor('mid', ENV_STATE.mid);
  lerpColor('horizon', ENV_STATE.horizon);
  lerpColor('ground', ENV_STATE.ground);
  lerpColor('sunset', ENV_STATE.sunsetColor);
  lerpColor('sunColor', ENV_STATE.sunColor);
  lerpColor('hemiSky', ENV_STATE.hemiSky);
  lerpColor('hemiGround', ENV_STATE.hemiGround);
  lerpColor('fillColor', ENV_STATE.fillColor);
  lerpColor('fog', ENV_STATE.fogColor);

  const sunEl = lerpNumber('sunEl');
  const sunAz = lerpNumber('sunAz');
  ENV_STATE.sunEl = sunEl;
  directionFromAngles(sunAz, sunEl, _sunDirection);

  // a fixed moon for the night half of the journey
  const moonEl = lerp(20, 44, smoothstep(0.58, 0.8, p));
  directionFromAngles(lerp(120, 142, smoothstep(0.55, 0.85, p)), moonEl, _moonDirection);

  ENV_STATE.sunIntensity = lerpNumber('sunIntensity');
  ENV_STATE.hemiIntensity = lerpNumber('hemiIntensity');
  ENV_STATE.fillIntensity = lerpNumber('fillIntensity');
  ENV_STATE.fogDensity = lerpNumber('fogDensity');
  ENV_STATE.stars = lerpNumber('stars');
  ENV_STATE.night = lerpNumber('night');
  ENV_STATE.moon = lerpNumber('moon');
  ENV_STATE.cityGlow = lerpNumber('cityGlow');
  ENV_STATE.daylight = 1 - clamp01(ENV_STATE.night);
  return ENV_STATE;
}

/* ========================================================================== */
/*  Speed and camera direction                                               */
/* ========================================================================== */

const SPEED_KEYS = [
  { s: 0.0, v: 0 },
  { s: 0.02, v: 12 },
  { s: 0.08, v: 36 },
  { s: 0.14, v: 60 },
  { s: 0.2, v: 86 },
  { s: 0.28, v: 102 },
  { s: 0.36, v: 110 },
  { s: 0.44, v: 104 },
  { s: 0.52, v: 96 },
  { s: 0.585, v: 86 },
  { s: 0.64, v: 82 },
  { s: 0.72, v: 88 },
  { s: 0.8, v: 84 },
  { s: 0.88, v: 70 },
  { s: 0.94, v: 46 },
  { s: 0.98, v: 16 },
  { s: 1.0, v: 0 },
];

function speedAtProgress(progress) {
  const p = clamp01(progress);
  return Math.max(0, sampleSchedule(SPEED_KEYS, p, 'v'));
}

function phaseAtProgress(progress) {
  const p = clamp01(progress);
  for (const phase of RAIL_PHASES) {
    if (p < phase.end || phase === RAIL_PHASES[RAIL_PHASES.length - 1]) return phase;
  }
  return RAIL_PHASES[RAIL_PHASES.length - 1];
}

function timeOfDayAt(progress) {
  const p = clamp01(progress);
  if (p < 0.16) return 'morning';
  if (p < 0.38) return 'daylight';
  if (p < 0.52) return 'golden-hour';
  if (p < 0.585) return 'sunset';
  if (p < 0.75) return 'dusk';
  return 'night';
}

/* --------------------------- camera directions ---------------------------- */

const _camBase = createFrame();
const _camAhead = createFrame();
const _camTargetFrame = createFrame();

function cabViewPose(ctx, p, sLoco, time, outPos, outTarget) {
  frameAtS(ctx, sLoco, _camBase);
  outPos
    .copy(_camBase.pos)
    .addScaledVector(_camBase.right, -0.56)
    .addScaledVector(WORLD_UP, 3.34)
    .addScaledVector(_camBase.tangent, 6.42);
  // ride vibration: rail joints, traction and the odd flange squeal
  const speedFactor = clamp01(speedAtProgress(p) / 110);
  outPos.x += Math.sin(time * 11.3) * 0.006 * (0.4 + speedFactor);
  outPos.y += Math.sin(time * 23.7) * 0.0045 * (0.3 + speedFactor) + Math.sin(time * 3.1) * 0.006;
  outPos.z += Math.cos(time * 9.1) * 0.005 * (0.4 + speedFactor);

  const aheadS = sLoco + 46;
  frameAtS(ctx, aheadS, _camAhead);
  outTarget
    .copy(_camAhead.pos)
    .addScaledVector(WORLD_UP, 2.35)
    .addScaledVector(_camAhead.right, -0.8);
  // a slow look towards the platform as the train pulls away
  const glance = 1 - smoothstep(0.0, 0.035, p);
  outTarget.addScaledVector(_camAhead.right, -1.6 * glance);
}

function chasePose(ctx, p, sLoco, time, outPos, outTarget) {
  frameAtS(ctx, sLoco, _camBase);
  const sway = Math.sin(time * 0.19) * 0.5;
  outPos
    .copy(_camBase.pos)
    .addScaledVector(_camBase.tangent, -(37 + sway * 4))
    .addScaledVector(_camBase.right, -14 + Math.sin(time * 0.27) * 2.6)
    .addScaledVector(WORLD_UP, 11.2 + Math.sin(time * 0.31) * 0.7);
  frameAtS(ctx, sLoco + 12, _camTargetFrame);
  outTarget.copy(_camTargetFrame.pos).addScaledVector(WORLD_UP, 2.5);
}

function bridgePose(ctx, p, sLoco, time, outPos, outTarget) {
  frameAtS(ctx, sLoco, _camBase);
  const t = clamp01((p - LANDMARK.bridgeStart) / (LANDMARK.bridgeEnd - LANDMARK.bridgeStart));
  const angle = lerp(2.62, 1.06, smoothstep(0, 1, t));
  const radius = lerp(56, 33, t);
  const height = lerp(17, 8.5, t);
  outPos
    .copy(_camBase.pos)
    .addScaledVector(_camBase.right, Math.sin(angle) * radius)
    .addScaledVector(_camBase.tangent, Math.cos(angle) * radius)
    .addScaledVector(WORLD_UP, height + Math.sin(time * 0.22) * 0.8);
  outTarget.copy(_camBase.pos).addScaledVector(WORLD_UP, 2.2);
}

function tunnelPose(ctx, p, sLoco, time, outPos, outTarget) {
  frameAtS(ctx, sLoco, _camBase);
  outPos
    .copy(_camBase.pos)
    .addScaledVector(_camBase.tangent, 23)
    .addScaledVector(_camBase.right, 1.9)
    .addScaledVector(WORLD_UP, 2.45 + Math.sin(time * 1.7) * 0.03);
  frameAtS(ctx, sLoco + 6, _camTargetFrame);
  outTarget.copy(_camTargetFrame.pos).addScaledVector(WORLD_UP, 2.5);
}

function nightPose(ctx, p, sLoco, time, outPos, outTarget) {
  frameAtS(ctx, sLoco, _camBase);
  outPos
    .copy(_camBase.pos)
    .addScaledVector(_camBase.tangent, -44)
    .addScaledVector(_camBase.right, 19)
    .addScaledVector(WORLD_UP, 10.5 + Math.sin(time * 0.24) * 0.6);
  frameAtS(ctx, sLoco + 12, _camTargetFrame);
  outTarget.copy(_camTargetFrame.pos).addScaledVector(WORLD_UP, 2.4);

  // glide to a platform viewpoint for the arrival
  const blend = smoothstep(0.925, 0.962, p);
  if (blend > 0) {
    const platformS = ctx.sEnd + 13;
    frameAtS(ctx, platformS, _camTargetFrame);
    const platformPos = _platformPosScratch
      .copy(_camTargetFrame.pos)
      .addScaledVector(_camTargetFrame.right, -7.6)
      .addScaledVector(WORLD_UP, 4.4);
    // lift the camera over the train while it swings around
    const lift = Math.sin(Math.PI * blend) * 11;
    _platformPosScratch.y += lift;

    const locoFront = _locoFrontScratch
      .copy(_camBase.pos)
      .addScaledVector(_camBase.tangent, 9.2)
      .addScaledVector(WORLD_UP, 2.2);

    outPos.lerp(platformPos, blend);
    outTarget.lerp(locoFront, blend);
  }
}

const _platformPosScratch = new THREE.Vector3();
const _locoFrontScratch = new THREE.Vector3();
const _posePositions = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
];
const _poseTargets = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
];

function cameraModeWeights(p) {
  const weights = [0, 0, 0, 0, 0];
  const cabToCountry = smoothstep(0.148, 0.186, p);
  const countryToBridge = smoothstep(0.37, 0.4, p);
  const bridgeToTunnel = smoothstep(0.558, 0.59, p);
  const tunnelToNight = smoothstep(0.734, 0.77, p);
  weights[0] = 1 - cabToCountry;
  weights[1] = cabToCountry * (1 - countryToBridge);
  weights[2] = countryToBridge * (1 - bridgeToTunnel);
  weights[3] = bridgeToTunnel * (1 - tunnelToNight);
  weights[4] = tunnelToNight;
  return weights;
}

/* ========================================================================== */
/*  Sky dome                                                                 */
/* ========================================================================== */

function buildSky(ctx) {
  const uniforms = {
    uZenith: { value: new THREE.Color(0x2a6fc4) },
    uMid: { value: new THREE.Color(0x7dc3f2) },
    uHorizon: { value: new THREE.Color(0xd8ecff) },
    uGround: { value: new THREE.Color(0x3b3327) },
    uSunDirection: { value: new THREE.Vector3(0, 0.4, 1) },
    uSunColor: { value: new THREE.Color(0xfff6e2) },
    uSunIntensity: { value: 1 },
    uMoonDirection: { value: new THREE.Vector3(0, 0.5, -1) },
    uMoonIntensity: { value: 0 },
    uStars: { value: 0 },
    uCityGlow: { value: 0 },
    uCityGlowColor: { value: new THREE.Color(0xffb46a) },
    uSunsetColor: { value: new THREE.Color(0xff9f6a) },
    uTime: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
  });
  ctx.materials.push(material);

  const geometry = new THREE.SphereGeometry(900, 40, 24);
  const sky = new THREE.Mesh(geometry, material);
  sky.name = 'skyDome';
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  sky.matrixAutoUpdate = true;
  ctx.skyUniforms = uniforms;
  return sky;
}

/* ========================================================================== */
/*  Public factory                                                           */
/* ========================================================================== */

export function createRailWorld(scene, options = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new Error('createRailWorld(scene, options): a THREE.Scene is required.');
  }

  const cfg = resolveConfig(options || {});
  const envMap = cfg.envMap ? createEnvironmentTexture() : null;
  const materialBundle = createMaterials(envMap, cfg.seed);
  const mats = materialBundle.mats;
  const track = createTrackCurve();

  const group = new THREE.Group();
  group.name = 'railWorld';
  group.userData.version = RAIL_WORLD_VERSION;

  /* a shared material for every lit coach window (one update drives them all) */
  const windowMaterial = new THREE.MeshBasicMaterial({
    map: materialBundle.windowMap || null,
    color: 0x2a3342,
    transparent: false,
  });
  materialBundle.materials.push(windowMaterial);

  const ctx = {
    scene,
    cfg,
    quality: cfg.quality,
    seed: cfg.seed,
    mats,
    materials: materialBundle.materials,
    textures: materialBundle.textures,
    envMap,
    glowMap: materialBundle.glowMap,
    poolMap: materialBundle.poolMap,
    curve: track.curve,
    length: track.length,
    sStart: track.sStart,
    sEnd: track.sEnd,
    coachCount: cfg.coachCount,
    signs: {},
    signTexture: null,
    glowSystems: [],
    emissiveSystems: [],
    tailGlows: [],
    coachWindowMeshes: [],
    signalHeads: [],
    windowMaterial,
    time: 0,
    townMaterial: null,
    terminalLight: null,
    clockHands: null,
  };

  /* -------------------------------------------------------------- signage -- */
  const originSign = makeSignTexture('ORIGIN JUNCTION', 'PLATFORM 1', {
    bg: '#13253f',
    fg: '#f7ecd2',
    accent: '#d9a441',
    width: 512,
    height: 150,
  });
  const terminalSign = makeSignTexture('CENTRAL TERMINAL', 'ARRIVALS  •  PLATFORM 3', {
    bg: '#101d31',
    fg: '#fbf1d8',
    accent: '#e0aa48',
    width: 640,
    height: 180,
  });
  const terminalSmallSign = makeSignTexture('CENTRAL', 'PLATFORM 4', {
    bg: '#101d31',
    fg: '#fbf1d8',
    accent: '#e0aa48',
    width: 512,
    height: 150,
  });
  for (const texture of [originSign, terminalSign, terminalSmallSign]) {
    if (texture) ctx.textures.push(texture);
  }
  ctx.signs = { origin: originSign, terminal: terminalSign, terminalSmall: terminalSmallSign };
  ctx.signTexture = originSign;

  /* ----------------------------------------------------------------- sky -- */
  let sky = null;
  if (cfg.addSky) {
    sky = buildSky(ctx);
    group.add(sky);
  }

  /* --------------------------------------------------------------- world -- */
  const terrain = buildTerrain(ctx);
  group.add(terrain.mesh);

  const river = buildRiver(ctx);
  group.add(river.mesh);

  const trackGroup = new THREE.Group();
  trackGroup.name = 'permanentWay';
  trackGroup.add(buildBallast(ctx));
  trackGroup.add(buildRails(ctx));
  trackGroup.add(buildSleepers(ctx));
  const fastenings = buildFastenings(ctx);
  if (fastenings) trackGroup.add(fastenings);
  const troughs = buildCableTrough(ctx);
  if (troughs) trackGroup.add(troughs);
  trackGroup.add(buildCatenary(ctx));
  group.add(trackGroup);

  const vegetation = buildVegetation(ctx);
  group.add(vegetation);
  ctx.vegetationStats = vegetation.userData.counts || null;
  group.add(buildFarmsteads(ctx));
  group.add(buildLinesideFurniture(ctx));
  const crossings = buildLevelCrossings(ctx);
  group.add(crossings.group);
  const rocks = buildRocks(ctx);
  if (rocks) group.add(rocks);
  group.add(buildDistantPeaks(ctx));

  const bridge = buildBridge(ctx);
  group.add(bridge);

  const tunnel = buildTunnel(ctx);
  group.add(tunnel.group);
  group.add(buildSignals(ctx));
  group.add(buildTown(ctx));
  group.add(buildTerminal(ctx));
  group.add(buildYard(ctx));

  /* --------------------------------------------------------------- train -- */
  const train = buildTrain(ctx);
  group.add(train.group);

  /* -------------------------------------------------------------- lights -- */
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.name = 'railSun';
  sun.castShadow = cfg.quality.shadows;
  if (cfg.quality.shadows) {
    sun.shadow.mapSize.set(cfg.quality.shadowMapSize, cfg.quality.shadowMapSize);
    sun.shadow.camera.left = -cfg.quality.shadowExtent;
    sun.shadow.camera.right = cfg.quality.shadowExtent;
    sun.shadow.camera.top = cfg.quality.shadowExtent;
    sun.shadow.camera.bottom = -cfg.quality.shadowExtent;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 900;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.45;
    sun.shadow.camera.updateProjectionMatrix();
  }
  const sunTarget = new THREE.Object3D();
  sunTarget.name = 'railSunTarget';
  sun.target = sunTarget;

  const hemi = new THREE.HemisphereLight(0xb9dcf7, 0x4d5c39, 0.9);
  hemi.name = 'railHemisphere';

  const fill = new THREE.DirectionalLight(0xa8c6e8, 0.3);
  fill.name = 'railFillLight';

  const lights = { sun, hemisphere: hemi, fill, target: sunTarget };
  if (cfg.addLights) group.add(sun, sunTarget, hemi, fill);

  /* pooled tunnel lights follow the train through the bore */
  const tunnelLights = [];
  for (let i = 0; i < 6; i += 1) {
    const light = new THREE.PointLight(0xffb877, 0, 58, 2);
    light.name = `tunnelLight${i}`;
    light.visible = false;
    group.add(light);
    tunnelLights.push(light);
  }

  /* ---------------------------------------------------------------- fog --- */
  const previousFog = scene.fog || null;
  const fog = new THREE.FogExp2(0xdfeaf2, 0.0008);
  scene.fog = fog;

  scene.add(group);

  /* --------------------------------------------------------------- state -- */
  const state = {
    progress: 0,
    time: 0,
    sLoco: sAtProgress(ctx, 0),
    speedKmh: 0,
    distance: 0,
    inTunnel: false,
    signalAspect: 'green',
    daylight: 1,
    headlamp: 0,
    disposed: false,
  };
  let lastSLoco = state.sLoco;
  const _poseFrame = createFrame();
  const _focus = new THREE.Vector3();
  const _cameraPos = new THREE.Vector3();
  const _lookAt = new THREE.Vector3();
  const _cameraPosOut = new THREE.Vector3();
  const _lookAtOut = new THREE.Vector3();
  const _vehicleFrame = createFrame();
  const _beamColor = new THREE.Color();

  /* ========================================================== getRailPose */

  function getRailPose(progress = 0) {
    const p = clamp01(finite(progress, 0));
    const sLoco = sAtProgress(ctx, p);
    const frame = frameAtS(ctx, sLoco, _poseFrame);
    const speedKmh = speedAtProgress(p);

    const weights = cameraModeWeights(p);
    cabViewPose(ctx, p, sLoco, state.time, _posePositions[0], _poseTargets[0]);
    chasePose(ctx, p, sLoco, state.time, _posePositions[1], _poseTargets[1]);
    bridgePose(ctx, p, sLoco, state.time, _posePositions[2], _poseTargets[2]);
    tunnelPose(ctx, p, sLoco, state.time, _posePositions[3], _poseTargets[3]);
    nightPose(ctx, p, sLoco, state.time, _posePositions[4], _poseTargets[4]);

    _cameraPosOut.set(0, 0, 0);
    _lookAtOut.set(0, 0, 0);
    let total = 0;
    for (let i = 0; i < weights.length; i += 1) {
      if (weights[i] <= 0) continue;
      _cameraPosOut.addScaledVector(_posePositions[i], weights[i]);
      _lookAtOut.addScaledVector(_poseTargets[i], weights[i]);
      total += weights[i];
    }
    if (total > 1e-4) {
      _cameraPosOut.multiplyScalar(1 / total);
      _lookAtOut.multiplyScalar(1 / total);
    }

    // keep the camera above the ballast at all times
    const railY = frame.pos.y;
    if (_cameraPosOut.y < railY - 0.4) _cameraPosOut.y = railY - 0.4;

    const tunnelFactor = band(p, LANDMARK.tunnelStart - 0.004, LANDMARK.tunnelStart + 0.008, LANDMARK.tunnelEnd - 0.01, LANDMARK.tunnelEnd + 0.004);
    const phase = phaseAtProgress(p);

    return {
      cameraPos: _cameraPosOut.clone(),
      lookAt: _lookAtOut.clone(),
      trainPos: frame.pos.clone(),
      trainQuat: frame.quat.clone(),
      speedKmh,
      gradientPct: frame.tangent.y * 100,
      signalAspect: nextSignalAspect(p),
      phaseName: phase.name,
      phaseId: phase.id,
      timeOfDay: timeOfDayAt(p),
      progress: p,
      distance: sLoco,
      inTunnel: tunnelFactor > 0.5,
    };
  }

  /* ================================================================= update */

  function update(elapsed = 0, delta = 0.016, progress = 0, camera = null) {
    if (state.disposed) return;
    const t = finite(elapsed, state.time + 0.016);
    let dt = finite(delta, 0.016);
    dt = clamp(dt, 0, 0.1);
    const p = clamp01(finite(progress, 0));
    state.time = t;
    state.progress = p;
    ctx.time = t;

    const speedKmh = speedAtProgress(p);
    state.speedKmh = speedKmh;
    const sLoco = sAtProgress(ctx, p);

    // distance travelled this frame (for wheel rotation)
    let movedBy = (sLoco - lastSLoco);
    if (!Number.isFinite(movedBy) || Math.abs(movedBy) > 30) movedBy = (speedKmh / 3.6) * dt;
    state.distance += Math.abs(movedBy);
    lastSLoco = sLoco;
    state.sLoco = sLoco;

    const tunnelFactor = band(
      p,
      LANDMARK.tunnelStart - 0.004,
      LANDMARK.tunnelStart + 0.008,
      LANDMARK.tunnelEnd - 0.01,
      LANDMARK.tunnelEnd + 0.004
    );
    state.inTunnel = tunnelFactor > 0.5;

    /* ----------------------------------------------------- place vehicles -- */
    const vehicles = [train.loco, ...train.coaches];
    for (let i = 0; i < vehicles.length; i += 1) {
      const vehicle = vehicles[i];
      const offset = train.offsets[i];
      const s = clamp(sLoco + offset, 4, ctx.length - 4);
      frameAtS(ctx, s, _vehicleFrame);
      vehicle.group.position.copy(_vehicleFrame.pos);
      vehicle.group.quaternion.copy(_vehicleFrame.quat);
    }

    /* rotate the wheelsets */
    const locoDistance = movedBy;
    for (const axle of train.loco.axles) axle.rotation.x += locoDistance / 0.62;
    for (const coach of train.coaches) {
      for (const axle of coach.axles) axle.rotation.x += locoDistance / 0.46;
    }

    /* pantograph compliance */
    if (train.loco.pantograph) {
      train.loco.pantograph.position.y = 4.3 + Math.sin(t * 3.4) * 0.008 + Math.sin(t * 0.7) * 0.004;
      train.loco.pantograph.rotation.z = Math.sin(t * 1.3) * 0.0026;
    }

    /* ---------------------------------------------------- environment ----- */
    const env = sampleEnvironment(p);
    state.daylight = env.daylight;
    const night = 1 - env.daylight;
    const headlampPower = clamp01(night * 1.15 + tunnelFactor * 0.9);

    if (cfg.addLights) {
      sun.color.copy(env.sunColor);
      sun.intensity = env.sunIntensity;
      hemi.color.copy(env.hemiSky);
      hemi.groundColor.copy(env.hemiGround);
      hemi.intensity = env.hemiIntensity;
      fill.color.copy(env.fillColor);
      fill.intensity = env.fillIntensity;

      if (camera && camera.position && Number.isFinite(camera.position.x)) {
        _focus.copy(camera.position);
      } else {
        _focus.copy(sLoco === 0 ? train.loco.group.position : train.loco.group.position);
      }
      // blend the shadow focus between the viewer and the train
      _focus.lerp(train.loco.group.position, 0.45);
      const texel = (cfg.quality.shadowExtent * 2) / cfg.quality.shadowMapSize;
      const fx = Math.round(_focus.x / texel) * texel;
      const fz = Math.round(_focus.z / texel) * texel;
      const fy = _focus.y;
      sun.position.set(
        fx + env.sunDirection.x * 320,
        fy + env.sunDirection.y * 320,
        fz + env.sunDirection.z * 320
      );
      sunTarget.position.set(fx, fy, fz);
      sunTarget.updateMatrixWorld();
      fill.position.set(fx - env.sunDirection.x * 200, fy + 180, fz - env.sunDirection.z * 200);
      fill.target = sunTarget;
    }

    fog.color.copy(env.fogColor);
    fog.density = env.fogDensity + tunnelFactor * 0.006;

    /* ------------------------------------------------------------- sky ---- */
    if (sky && ctx.skyUniforms) {
      const u = ctx.skyUniforms;
      u.uZenith.value.copy(env.zenith);
      u.uMid.value.copy(env.mid);
      u.uHorizon.value.copy(env.horizon);
      u.uGround.value.copy(env.ground);
      u.uSunDirection.value.copy(env.sunDirection);
      u.uMoonDirection.value.copy(env.moonDirection);
      u.uSunColor.value.copy(env.sunColor);
      u.uSunIntensity.value = clamp(env.daylight * 1.2 - 0.05, 0, 1.3);
      u.uMoonIntensity.value = env.moon;
      u.uStars.value = env.stars;
      u.uCityGlow.value = env.cityGlow;
      u.uSunsetColor.value.copy(env.sunsetColor);
      u.uTime.value = t;

      if (camera && camera.position && Number.isFinite(camera.position.x)) {
        sky.position.copy(camera.position);
      } else {
        sky.position.copy(train.loco.group.position);
      }
    }

    /* ------------------------------------------------------------ lamps --- */
    if (train.loco.spot) {
      train.loco.spot.intensity = headlampPower * 9.5;
      train.loco.spot.angle = 0.33;
      train.loco.spot.penumbra = 0.55;
    }
    if (train.loco.beamMaterial) {
      train.loco.beamMaterial.opacity = 0.055 * headlampPower;
      train.loco.beam.visible = headlampPower > 0.02;
    }
    if (train.loco.poolMaterial) {
      train.loco.poolMaterial.opacity = 0.34 * headlampPower;
      train.loco.pool.visible = headlampPower > 0.02;
    }
    for (const glow of train.loco.headlampGlows) {
      if (glow.material) glow.material.opacity = (glow.isSprite ? 0.85 : 1) * Math.max(0.22, headlampPower);
    }
    for (const glow of ctx.tailGlows) glow.material.opacity = 0.7 * Math.max(0.35, night);

    /* ------------------------------------------------------ cab controls -- */
    const cab = train.loco.cab;
    if (cab) {
      if (cab.gaugeNeedle) {
        cab.gaugeNeedle.rotation.z = (135 - (speedKmh / 160) * 270) * DEG;
      }
      if (cab.throttleLever) {
        cab.throttleLever.rotation.x = -0.42 + clamp01(speedKmh / 110) * 0.5;
      }
      if (cab.brakeLever) {
        const braking = p > 0.9 ? clamp01((p - 0.9) / 0.09) : 0;
        cab.brakeLever.rotation.x = -0.42 - braking * 0.55;
      }
      const aspect = nextSignalAspect(p);
      const key = aspect === 'double-amber' ? 'amber' : aspect;
      for (const name of ['green', 'amber', 'red']) {
        if (cab.signalLamps[name]) cab.signalLamps[name].visible = name === key;
      }
      if (cab.light) cab.light.intensity = 3.4 + 0.2 * Math.sin(t * 2.1);
      if (cab.bounce) cab.bounce.intensity = 1.1;
      const screenGlow = 0.72 + 0.18 * Math.sin(t * 3.3);
      for (const screen of cab.screens) {
        if (screen.material) screen.material.opacity = screenGlow;
      }
    }

    /* ----------------------------------------------------- coach windows -- */
    windowMaterial.color.setHex(0x2a3342).lerp(COLOR_TMP.setHex(0xfff6e2), Math.min(1, night * 1.15));
    for (const mesh of ctx.coachWindowMeshes) {
      if (mesh) mesh.visible = true;
    }

    /* ------------------------------------------------------- signal glow -- */
    for (let i = 0; i < ctx.signalHeads.length; i += 1) {
      const entry = ctx.signalHeads[i];
      const pulse = 0.8 + 0.2 * Math.sin(t * 2.2 + i * 1.7);
      entry.sprite.material.opacity = entry.base * pulse * (0.45 + night * 0.55 + tunnelFactor * 0.2);
    }

    /* ---------------------------------------------------------- town ----- */
    if (ctx.townMaterial) {
      ctx.townMaterial.uniforms.uTime.value = t;
      ctx.townMaterial.uniforms.uOpacity.value = clamp01(night * 1.3);
      ctx.townMaterial.uniforms.uPixelRatio.value =
        typeof window !== 'undefined' && window.devicePixelRatio ? Math.min(2, window.devicePixelRatio) : 1;
    }
    if (ctx.terminalLights) {
    for (const light of ctx.terminalLights) light.intensity = night * 30;
  }

    /* warm windows in houses and station */
    for (const entry of ctx.emissiveSystems) {
      const material = entry.mesh && entry.mesh.material;
      if (!material || !material.color) continue;
      const base = entry.base == null ? 0.2 : entry.base;
      const amount = clamp01(base + night * (entry.night == null ? 1 : entry.night));
      material.color.setRGB(amount, amount * 0.86, amount * 0.6);
    }
    mats.houseWindow.color.setRGB(0.16 + night * 0.84, 0.15 + night * 0.72, 0.12 + night * 0.42);

    /* clock hands creep forward */
    if (ctx.clockHands) {
      ctx.clockHands.minuteHand.rotation.z = -t * 0.06;
      ctx.clockHands.hourHand.rotation.z = -t * 0.005;
    }

    /* ------------------------------------------------- tunnel light pool -- */
    for (let i = 0; i < tunnelLights.length; i += 1) {
      const light = tunnelLights[i];
      const active = tunnelFactor > 0.01;
      light.visible = active;
      if (!active) {
        light.intensity = 0;
        continue;
      }
      const s = sLoco + (i - 2.5) * 20;
      frameAtS(ctx, clamp(s, 0, ctx.length), _vehicleFrame);
      light.position
        .copy(_vehicleFrame.pos)
        .addScaledVector(_vehicleFrame.right, -3.5)
        .addScaledVector(WORLD_UP, 4.6);
      light.intensity = tunnelFactor * 11;
    }

    /* ------------------------------------------------ glow systems fade --- */
    const glowLevel = 0.35 + night * 0.65;
    for (const points of ctx.glowSystems) {
      if (points.material) points.material.opacity = 0.85 * glowLevel;
    }
  }

  /* ================================================================ dispose */

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
        if (item && typeof item.dispose === 'function') item.dispose();
      }
    });
    for (const material of ctx.materials) {
      if (material && typeof material.dispose === 'function') {
        try {
          material.dispose();
        } catch (err) {
          /* already disposed */
        }
      }
    }
    for (const texture of ctx.textures) {
      if (texture && typeof texture.dispose === 'function') texture.dispose();
    }
    if (envMap && typeof envMap.dispose === 'function') envMap.dispose();
    if (scene.fog === fog) scene.fog = previousFog;
  }

  /* ================================================================ stats -- */

  let meshCount = 0;
  let instanceCount = 0;
  let triangleCount = 0;
  group.traverse((object) => {
    if (!object.isMesh && !object.isPoints && !object.isLine) return;
    meshCount += 1;
    const geometry = object.geometry;
    let tris = 0;
    if (geometry) {
      if (geometry.index) tris = geometry.index.count / 3;
      else if (geometry.getAttribute('position')) tris = geometry.getAttribute('position').count / 3;
    }
    if (object.isInstancedMesh) {
      instanceCount += object.count;
      tris *= object.count;
    }
    triangleCount += tris;
  });

  const stats = {
    trackLength: Math.round(ctx.length),
    travelLength: Math.round(ctx.sEnd - ctx.sStart),
    phases: RAIL_PHASES.length,
    coachCount: cfg.coachCount,
    drawables: meshCount,
    instances: instanceCount,
    triangles: Math.round(triangleCount),
    terrainVertices: terrain.geometry.getAttribute('position').count,
    sleepers: Math.round(ctx.length / cfg.quality.sleeperStep),
    trees: ctx.vegetationStats || null,
    townLights: ctx.quality.townLights,
    shadowMapSize: cfg.quality.shadowMapSize,
  };

  /* =============================================================== handle -- */

  return {
    group,
    lights,
    train: {
      group: train.group,
      locomotive: train.loco.group,
      coaches: train.coaches.map((coach) => coach.group),
      offsets: train.offsets.slice(),
      axles: train.loco.axles.length + train.coaches.reduce((sum, coach) => sum + coach.axles.length, 0),
    },
    trainGroup: train.group,
    locomotive: train.loco.group,
    cab: train.loco.cab,
    cabGroup: train.loco.cab.group,
    sky,
    terrain: terrain.mesh,
    river: river.mesh,
    bridge,
    tunnel: tunnel.group,
    signals: SIGNAL_SCHEDULE.map((s) => ({ ...s })),
    getRailPose,
    update,
    dispose,
    getGroundHeight: (progress, lateral) => groundHeightAt(ctx, progress, lateral),
    getEnvironment(progress = 0) {
      const env = sampleEnvironment(progress);
      return {
        sunIntensity: env.sunIntensity,
        hemiIntensity: env.hemiIntensity,
        daylight: env.daylight,
        stars: env.stars,
        cityGlow: env.cityGlow,
        fogDensity: env.fogDensity,
        sunDirection: env.sunDirection.clone(),
        zenith: env.zenith.getHex(),
        horizon: env.horizon.getHex(),
        fogColor: env.fogColor.getHex(),
      };
    },
    getPhase: (progress) => ({ ...phaseAtProgress(progress) }),
    getSpeedKmh: (progress) => speedAtProgress(progress),
    getSignalAspect: (progress) => nextSignalAspect(progress),
    curve: track.curve,
    length: ctx.length,
    stats,
    config: cfg,
    state,
  };
}

export default createRailWorld;
