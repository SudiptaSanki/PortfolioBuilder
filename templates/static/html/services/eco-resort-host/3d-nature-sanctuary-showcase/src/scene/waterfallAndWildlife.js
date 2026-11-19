/**
 * waterfallAndWildlife.js
 * ----------------------------------------------------------------------------
 * Procedural waterfall, river, plunge pool and living wildlife for the
 * open-world nature portfolio. Everything is generated at runtime from
 * Three.js geometry and custom GLSL — no textures, models or audio assets.
 *
 * Public API
 *   createWaterfallAndWildlife(scene, options?) -> {
 *     group,
 *     animals,           // [{ id, name, species, mesh, position, speed, ... }]
 *     fish,              // koi & trout records (aquatic, not followable)
 *     butterflies, fireflies,
 *     anchor, layout,    // exact waterfall / pool / river placement
 *     update(elapsed, delta, cameraPos),
 *     getNearestAnimal(point),
 *     getWaterfallDistance(point),
 *     dispose()
 *   }
 *
 * Integration
 *   Pass the terrain sampler from skyAndTerrain.js through options:
 *
 *     import { getTerrainHeight, getTerrainNormal } from './skyAndTerrain.js';
 *     const nature = createWaterfallAndWildlife(scene, {
 *       getTerrainHeight, getTerrainNormal
 *     });
 *
 *   Both are optional. Without them a self-contained gentle valley terrain is
 *   used so the module can be dropped into a bare scene for testing. The
 *   fallback is intentionally calm and only shapes the ground under the
 *   animals, rocks and river banks; it is never rendered.
 *
 * World layout (all distances in world units, +Z points downstream/toward the
 * default camera, +X is east):
 *
 *   waterfallAnchor = { x: 0, yTop: 34, yBottom: 0, z: -65, width: 22 }
 *     The curtain hangs in front of a cliff at z ≈ −65, its lip at y = 34.
 *     The rock lip of the headwall sits at z ≈ −66.5 (CLIFF_LIP_Z in
 *     skyAndTerrain.js), which is why the curtain leans forward as it falls.
 *   plunge pool     = centre (0, 0, -57), radius ≈ 30, bed at y ≈ -3.4.
 *   river           = leaves the pool at the headwall and flows toward +Z:
 *                       phase = z + 66.5
 *                       x = smoothstep(0, 90, phase) ·
 *                           (9.5·sin(phase·0.0092) + 4.0·sin(phase·0.0231 + 1.7))
 *                     half-width ≈ 10.75 + 0.15·sin(0.043z + 0.8),
 *                     water level 0 (riverLevel option), reaches z ≈ 260.
 *   upper river     = a short reach on the plateau at y = 33, z ≈ -158…-66.5,
 *                     feeding the lip.
 *     These numbers match the constants and height field exported by
 *     skyAndTerrain.js, so the water, banks and fish line up without tuning.
 *
 *   Animals live on the meadows on both banks (|x| ≈ 10–55), never in water.
 *   Fish swim inside the pool and the first stretch of the river. The
 *   `animals` array (and getNearestAnimal) covers the followable land animals
 *   — deer, foxes and the hare; fish are exposed separately in `fish`.
 *
 *   `cliff` (default true) draws a procedural rock amphitheatre around the
 *   falls: two wings, a lintel and a wet back panel. Set `cliff: false` when a
 *   host terrain already provides its own detailed waterfall cliff.
 *
 * Options
 *   getTerrainHeight(x, z) -> number      optional ground sampler
 *   getTerrainNormal(x, z, target?) -> Vector3
 *   waterfallAnchor { x, yTop, yBottom, z, width }
 *   riverLevel (number, default 0)
 *   sunDirection (Vector3, default (0.42, 0.45, -0.78))
 *   seed (number, default 1337)           deterministic scatter
 *   deer (4..6, default 5), foxes (1..3, default 2), fish (default 16)
 *   butterflies (default 28), fireflies (default 240)
 *   mistParticles (default 1600)
 *   cliff (bool, default true)            procedural rock face behind the falls
 *   shadows (bool, default true)          soft contact shadows under animals
 *   quality ('high' | 'medium', default 'high')
 *
 * Notes
 *   `update` is NaN-safe: bad elapsed/delta values fall back to the last good
 *   frame so a paused tab or a broken clock cannot fling the animals across
 *   the map. Delta is clamped to 100 ms.
 */

import * as THREE from 'three';

/* ========================================================================== */
/* Public constants                                                           */
/* ========================================================================== */

export const DEFAULT_WATERFALL_ANCHOR = Object.freeze({
  x: 0,
  yTop: 34,
  yBottom: 0,
  z: -65,
  width: 22
});

export const RIVER = Object.freeze({
  startZ: -66.5,
  endZ: 260,
  level: 0,
  poolCenterZ: -57,
  poolRadius: 30,
  poolDepth: 3.4,
  halfWidth: 11
});

/** Centre line of the river, shared by geometry, shaders and fish paths. */
export function riverCenterX(z) {
  const phase = z - RIVER.startZ;
  const envelope = smoothstep(0, 90, phase);
  return envelope * (9.5 * Math.sin(phase * 0.0092) + 4.0 * Math.sin(phase * 0.0231 + 1.7));
}

/** Half width of the river channel at a given z. */
export function riverHalfWidth(z) {
  return 10.75 + 0.15 * Math.sin(z * 0.043 + 0.8);
}

/* ========================================================================== */
/* Small math helpers                                                         */
/* ========================================================================== */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash2(x, y) {
  let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return h - Math.floor(h);
}

function valueNoise2(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function fbm2(x, y, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
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

function finiteNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readVector(value, fallback) {
  if (value && typeof value === 'object') {
    const x = finiteNumber(value.x, fallback.x);
    const y = finiteNumber(value.y, fallback.y);
    const z = finiteNumber(value.z, fallback.z);
    return new THREE.Vector3(x, y, z);
  }
  return new THREE.Vector3(fallback.x, fallback.y, fallback.z);
}

/* ========================================================================== */
/* Fallback terrain — a quiet river valley with a cliff behind the falls       */
/* ========================================================================== */

/**
 * Height of the built-in valley. Only used when the host scene does not
 * provide getTerrainHeight(); never rendered, it merely grounds the props.
 */
export function fallbackTerrainHeight(x, z) {
  const poolX = 0;
  const poolZ = RIVER.poolCenterZ;

  let h = 0.28 + 1.05 * fbm2(x * 0.045 + 13.7, z * 0.045 - 4.2, 4);

  // meadow shoulders rising away from the river
  const side = smoothstep(24, 105, Math.abs(x));
  h += side * (7 + 13 * fbm2(x * 0.014 + 5.1, z * 0.014 + 8.7, 3));

  // upstream plateau behind the waterfall, with a steep cliff band
  const plateau = smoothstep(-66.0, -73.5, z);
  h += plateau * 34;

  // distant hills
  const radial = Math.hypot(x * 0.85, z + 30);
  h += smoothstep(130, 420, radial) * 28 * (0.5 + 0.5 * fbm2(x * 0.009, z * 0.009, 3));

  // plunge pool basin
  const poolD = Math.hypot(x - poolX, z - poolZ);
  const inPool = 1 - smoothstep(RIVER.poolRadius * 0.45, RIVER.poolRadius * 1.02, poolD);
  h = lerp(h, Math.min(h, -RIVER.poolDepth), inPool);

  // river channel, carved only downstream of the pool
  const riverT =
    smoothstep(RIVER.startZ - 2, RIVER.startZ + 8, z) * (1 - smoothstep(RIVER.endZ - 10, RIVER.endZ + 8, z));
  const halfW = riverHalfWidth(z);
  const bank = 1 - smoothstep(halfW * 0.35, halfW * 0.78, Math.abs(x - riverCenterX(z)));
  h = lerp(h, Math.min(h, -1.75), bank * riverT);

  return h;
}

/** Analytic-ish normal of the fallback terrain (central difference). */
export function fallbackTerrainNormal(x, z, target = new THREE.Vector3()) {
  const e = 0.65;
  const hx = fallbackTerrainHeight(x + e, z) - fallbackTerrainHeight(x - e, z);
  const hz = fallbackTerrainHeight(x, z + e) - fallbackTerrainHeight(x, z - e);
  return target.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
}

/* ========================================================================== */
/* Shared shader pieces                                                       */
/* ========================================================================== */

const GLSL_COMMON = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * vnoise(p);
      p = p * 2.03 + vec2(13.7, 7.1);
      a *= 0.5;
    }
    return s;
  }

  vec3 applyFogRGB(vec3 col, float dist) {
    float f = 0.0;
    if (uFogMode > 1.5) {
      f = smoothstep(uFogNear, uFogFar, dist);
    } else if (uFogMode > 0.5) {
      float d = uFogDensity * dist;
      f = 1.0 - exp(-d * d);
    }
    return mix(col, uFogColor, clamp(f, 0.0, 1.0));
  }
`;

const FOG_UNIFORM_DECL = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uFogMode;
  uniform float uFogNear;
  uniform float uFogFar;
`;

/* ========================================================================== */
/* Shaders — flowing river & plunge pool                                      */
/* ========================================================================== */

const WATER_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  varying float vViewDist;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vViewDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const WATER_FRAGMENT = /* glsl */ `
  ${FOG_UNIFORM_DECL}
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uPoolCenter;
  uniform float uPoolRadius;
  uniform vec3 uFallBase;
  uniform float uRiverLipZ;
  uniform float uRiverEndZ;
  uniform float uRiverHalf;
  uniform float uRiverAmp1;
  uniform float uRiverFreq1;
  uniform float uRiverAmp2;
  uniform float uRiverFreq2;
  uniform float uRiverPhase2;
  uniform float uRiverEnvelope;

  varying vec3 vWorld;
  varying float vViewDist;

  ${GLSL_COMMON}

  float riverCenterX(float z) {
    float phase = z - uRiverLipZ;
    float env = smoothstep(0.0, uRiverEnvelope, phase);
    return env * (uRiverAmp1 * sin(phase * uRiverFreq1) + uRiverAmp2 * sin(phase * uRiverFreq2 + uRiverPhase2));
  }

  float riverHalfWidth(float z) {
    return uRiverHalf + 0.15 * sin(z * 0.043 + 0.8);
  }

  float poolSdf(vec2 p) {
    vec2 d = p - uPoolCenter.xz;
    float ang = atan(d.y, d.x);
    float r = uPoolRadius + 1.8 * sin(ang * 3.0 + 1.2) + 1.1 * sin(ang * 5.0 - 0.4);
    return length(d) - r;
  }

  float waterSdf(vec2 p) {
    float pool = poolSdf(p);
    float river = 1e6;
    if (p.y > uRiverLipZ) {
      river = abs(p.x - riverCenterX(p.y)) - riverHalfWidth(p.y);
      river = max(river, uRiverLipZ - p.y);
      river = max(river, p.y - uRiverEndZ);
    }
    return min(pool, river);
  }

  vec2 waveGrad(vec2 p, vec2 dir, float freq, float speed, float amp, float phase) {
    float ph = dot(p, dir) * freq + uTime * speed + phase;
    return dir * (amp * freq * cos(ph));
  }

  void main() {
    vec2 p = vWorld.xz;
    float sdf = waterSdf(p);
    float mask = 1.0 - smoothstep(-0.35, 1.6, sdf);
    if (mask < 0.01) discard;

    // ---- animated surface normal (sum of travelling ripples) ----
    vec2 g = vec2(0.0);
    g += waveGrad(p, normalize(vec2(0.82, 0.57)), 0.62, 1.05, 0.055, 0.0);
    g += waveGrad(p, normalize(vec2(-0.55, 0.83)), 0.94, 1.35, 0.038, 1.7);
    g += waveGrad(p, normalize(vec2(0.28, -0.96)), 1.55, 1.9, 0.022, 4.1);
    g += waveGrad(p, normalize(vec2(-0.92, -0.4)), 2.4, 2.4, 0.018, 2.6);
    g += waveGrad(p, normalize(vec2(0.66, -0.75)), 4.8, 3.1, 0.008, 3.2);
    g += waveGrad(p, normalize(vec2(-0.2, 0.98)), 7.3, 4.0, 0.005, 5.1);
    // current lines pulled downstream
    g += waveGrad(vec2(p.x, p.y - uTime * 2.6), normalize(vec2(0.12, 0.99)), 1.1, 0.8, 0.055, 0.9);

    // foam patch turbulence feeds small chops
    float turb = fbm(p * 0.7 + vec2(0.0, -uTime * 0.9));
    g += (vec2(turb, fbm(p * 0.7 + 19.3)) - 0.5) * 0.35;

    vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
    vec3 V = normalize(cameraPosition - vWorld);

    // ---- water column colour ----
    float deepness = smoothstep(-0.2, 6.0, -sdf);
    vec3 deep = vec3(0.012, 0.062, 0.075);
    vec3 shallow = vec3(0.075, 0.34, 0.31);
    vec3 base = mix(shallow, deep, 0.25 + deepness * 0.75);

    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
    vec3 R = reflect(-V, N);
    float skyT = clamp(R.y, 0.0, 1.0);
    vec3 sky = mix(vec3(0.62, 0.76, 0.80), vec3(0.20, 0.44, 0.78), pow(skyT, 0.7));
    // warm haze close to the horizon line
    sky = mix(sky, vec3(0.86, 0.88, 0.80), smoothstep(0.16, 0.0, skyT) * 0.55);

    vec3 col = mix(base, sky, 0.12 + fres * 0.55);

    // the wooded banks and the dark cliff are the real horizon for a low
    // reflection vector — without them the pool reads as flat blue paint.
    vec3 bankReflection = vec3(0.035, 0.082, 0.058);
    col = mix(col, bankReflection, smoothstep(0.26, 0.01, R.y) * (0.30 + fres * 0.42));

    // sun reflection
    float sunGlow = pow(max(dot(R, uSunDir), 0.0), 190.0);
    col += vec3(1.0, 0.90, 0.72) * sunGlow * 0.85;

    vec3 H = normalize(V + uSunDir);
    float spec = pow(max(dot(N, H), 0.0), 380.0);
    col += vec3(1.0, 0.95, 0.86) * spec * 1.1;

    // fine sparkle glints
    float sparkle = step(0.9985, hash21(floor(p * 30.0) + floor(uTime * 12.0)));
    col += vec3(0.85, 0.95, 1.0) * sparkle * 0.28;

    // ---- foam: banks, plunge rings, impact boil, whitewater trail ----
    float bankFoam = smoothstep(-2.2, 0.0, sdf) * (0.35 + 0.65 * turb);
    bankFoam *= 0.55 + 0.45 * sin(p.y * 1.3 - uTime * 1.4 + p.x * 0.4);

    vec2 dBase = p - uFallBase.xz;
    float rBase = length(dBase);
    float angBase = atan(dBase.y, dBase.x);
    float rings = 0.0;
    float impact = 0.0;
    if (rBase < 28.0) {
      rings = sin(rBase * 1.55 - uTime * 4.2) * 0.5 + 0.5;
      rings *= smoothstep(28.0, 3.0, rBase);
      rings *= 0.5 + 0.5 * vnoise(vec2(angBase * 4.0, rBase * 0.5 - uTime * 0.9));
      float churn = fbm(vec2(angBase * 7.0, rBase * 0.9 - uTime * 2.6));
      float broken = smoothstep(0.26, 0.76, churn * 0.68 + 0.32 * vnoise(vec2(angBase * 11.0, rBase * 2.0 - uTime * 3.5)));
      impact = smoothstep(22.0, 1.0, rBase) * broken;
      float chop = fbm(p * 2.1 + vec2(0.0, -uTime * 2.2));
      float fineFoam = vnoise(p * 5.5 + vec2(0.0, -uTime * 2.8));
      impact *= 0.30 + 0.70 * smoothstep(0.30, 0.74, chop);
      impact *= 0.60 + 0.40 * smoothstep(0.28, 0.78, fineFoam);
      impact = pow(impact, 1.1);
    }
    float plume = 0.0;
    if (p.y > uFallBase.z) {
      float lane = abs(p.x - riverCenterX(p.y));
      float halfW = riverHalfWidth(p.y);
      float spread = smoothstep(halfW * 0.95, 0.0, lane);
      float trail = exp(-(p.y - uFallBase.z) / 20.0);
      plume = spread * trail * (0.30 + 0.70 * fbm(vec2(p.x * 0.5, p.y * 0.26 - uTime * 1.6)));
    }

    float foam = clamp(bankFoam * 0.48 + rings * 0.38 + impact * 1.10 + plume * 0.42, 0.0, 1.0);
    float fleck = smoothstep(0.70, 0.92, vnoise(p * 2.7 + vec2(0.0, -uTime * 1.7))) * smoothstep(18.0, 0.0, rBase);
    foam = clamp(foam + fleck * 0.35, 0.0, 1.0);
    foam *= (1.0 - smoothstep(0.0, 1.4, sdf)) * mask;

    vec3 foamCol = vec3(0.94, 0.985, 0.98);
    col = mix(col, foamCol, foam * 0.90);

    float alpha = mask * mix(0.44, 0.72, deepness);
    alpha = clamp(alpha + foam * 0.30, 0.0, 0.98);

    col = applyFogRGB(col, vViewDist);

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ========================================================================== */
/* Shaders — waterfall curtain                                                */
/* ========================================================================== */

const FALL_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uLayer;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vViewDist;

  void main() {
    vUv = uv;
    vec3 p = position;

    // living skin: tiny lateral wobble so the curtain never feels like glass
    float edge = abs(uv.x - 0.5) * 2.0;
    p.z += sin(uv.x * 11.0 + uTime * 0.8 + uLayer * 1.7) * 0.10 * (1.0 - edge * 0.6);
    p.x += sin(uv.y * 8.0 + uTime * 0.55) * 0.05;

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vViewDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FALL_FRAGMENT = /* glsl */ `
  ${FOG_UNIFORM_DECL}
  uniform float uTime;
  uniform float uLayer;
  uniform vec3 uSunDir;
  uniform float uWaterLevel;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vViewDist;

  ${GLSL_COMMON}

  void main() {
    vec2 uv = vUv;
    float t = uTime * (1.0 + uLayer * 0.14);

    // ragged silhouette: the sheet is torn at the edges instead of cut with a knife
    float edgeNoise = 0.018 + 0.055 * fbm(vec2(uv.y * 9.0 + uLayer * 4.0, uLayer * 3.0));
    float edge = smoothstep(0.0, edgeNoise, uv.x) * smoothstep(1.0, 1.0 - edgeNoise, uv.x);

    // two scrolling streak fields: broad sheets and fine white threads
    vec2 q1 = vec2(uv.x * 6.4 + uLayer * 3.1, uv.y * 1.55 + t * 1.05);
    float sheet = fbm(q1);
    float sheet2 = fbm(vec2(uv.x * 2.6 - 11.0, uv.y * 0.85 + t * 0.62));
    float thread = fbm(vec2(uv.x * 24.0 + uLayer * 7.0, uv.y * 4.2 + t * 2.0));
    float threadFine = vnoise(vec2(uv.x * 76.0, uv.y * 10.0 + t * 3.4));

    float streak = smoothstep(0.28, 0.82, sheet * 0.72 + sheet2 * 0.5);
    float whiteThreads = smoothstep(0.60, 0.94, thread) * 0.55 + smoothstep(0.76, 0.99, threadFine) * 0.45;

    // crest whitewater that spills over an irregular lip, mid-ledge splash, base boil
    float lipY = 0.972 - 0.030 * vnoise(vec2(uv.x * 7.0, 2.3));
    float lipMask = smoothstep(0.28, 0.70, vnoise(vec2(uv.x * 11.0, 3.7)));
    float lip = smoothstep(lipY, min(1.0, lipY + 0.032), uv.y) * (0.45 + 0.55 * threadFine) * lipMask;
    float drip = lip * smoothstep(0.35, 0.95, thread);
    float ledge = exp(-pow((uv.y - 0.36) * 27.0, 2.0)) * smoothstep(0.42, 0.8, vnoise(vec2(uv.x * 9.5, 4.1))) * 0.6;
    float baseBoil = smoothstep(0.135, 0.0, uv.y) * (0.55 + 0.45 * fbm(vec2(uv.x * 8.0, uv.y * 5.0 - t * 2.4)));

    float foam = clamp(streak * 0.48 + whiteThreads * 0.48 + lip * 0.62 + drip * 0.35 + ledge * 0.30 + baseBoil * 0.9, 0.0, 1.0);

    vec3 deepWater = vec3(0.010, 0.175, 0.195);
    vec3 paleWater = vec3(0.26, 0.60, 0.61);
    vec3 foamWhite = vec3(0.94, 0.985, 0.98);

    vec3 col = mix(deepWater, paleWater, smoothstep(0.05, 0.52, foam));
    col = mix(col, foamWhite, smoothstep(0.46, 0.9, foam));

    // body of water catches a little sky between the streaks
    float bodyMask = (1.0 - smoothstep(0.2, 0.6, foam));
    col += vec3(0.06, 0.10, 0.10) * bodyMask * (0.4 + 0.6 * sheet2);

    // translucency: edges catch the sky
    float rim = smoothstep(0.35, 1.0, abs(uv.x - 0.5) * 2.0);
    col = mix(col, vec3(0.60, 0.79, 0.81), rim * 0.15);

    // sun sparkle specks inside the water sheet
    vec2 cell = floor(vec2(uv.x * 200.0, uv.y * 330.0 - t * 60.0));
    float sparkle = step(0.9978, hash21(cell + uLayer * 17.0));
    col += vec3(1.0, 0.97, 0.9) * sparkle * 0.55;

    float alpha = edge * (0.52 + 0.46 * foam + lip * 0.08);
    alpha *= smoothstep(0.0, 0.065, uv.y) * smoothstep(1.0, 0.975, uv.y);
    alpha *= smoothstep(uWaterLevel - 2.2, uWaterLevel + 0.15, vWorld.y);
    alpha *= (uLayer > 0.5) ? 0.72 : 1.0;

    col = applyFogRGB(col, vViewDist);

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ========================================================================== */
/* Shaders — mist & spray points                                              */
/* ========================================================================== */

const MIST_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec3 uAnchor;
  uniform float uWidth;
  uniform float uHeight;
  uniform float uPixelRatio;
  uniform vec3 uCameraPos;
  attribute vec4 aSeed;      // x: lateral, y: depth, z: phase, w: size
  attribute float aKind;     // 0 falling spray, 1 rising mist, 2 pool haze
  attribute float aSpeed;
  varying float vAlpha;
  varying float vKind;
  varying float vFogDist;

  void main() {
    float phase = fract(aSeed.z + uTime * aSpeed);
    vec3 p;
    float size = aSeed.w;
    float fade = 1.0;

    if (aKind < 0.5) {
      // heavy droplets falling along the curtain face
      float v = 1.0 - phase;
      p.x = uAnchor.x + (aSeed.x - 0.5) * uWidth * 0.92;
      p.y = mix(uAnchor.y, uAnchor.y + uHeight, v);
      p.z = uAnchor.z + pow(1.0 - v, 1.55) * 4.0 + (aSeed.y - 0.5) * 1.4;
      p.x += sin(phase * 8.0 + aSeed.z * 20.0) * 0.35;
      p.y -= phase * 0.6;
      fade = smoothstep(0.0, 0.12, phase) * smoothstep(1.0, 0.82, phase);
      vAlpha = 0.20 * fade;
    } else if (aKind < 1.5) {
      // billowing mist climbing off the plunge pool
      float rise = pow(phase, 0.72);
      p.x = uAnchor.x + (aSeed.x - 0.5) * uWidth * (1.25 + rise * 1.6);
      p.y = uAnchor.y + rise * (uHeight * 0.42);
      p.z = uAnchor.z + 3.4 + (aSeed.y - 0.5) * 9.0 + rise * 7.0;
      p.x += sin(uTime * 0.4 + aSeed.z * 31.0) * (0.8 + rise * 2.2);
      p.z += cos(uTime * 0.33 + aSeed.z * 24.0) * (0.6 + rise * 1.8);
      size *= 1.0 + rise * 1.15;
      fade = smoothstep(0.0, 0.18, phase) * smoothstep(1.0, 0.55, phase);
      vAlpha = 0.12 * fade;
    } else {
      // low haze sliding over the pool surface
      float ang = aSeed.x * 6.28318;
      float rad = (0.35 + phase) * 30.0 * aSeed.y;
      p.x = uAnchor.x + cos(ang + uTime * 0.06) * rad;
      p.z = uAnchor.z + 8.0 + sin(ang + uTime * 0.05) * rad * 0.8;
      p.y = uAnchor.y + 0.35 + pow(phase, 2.0) * 2.6;
      size *= 1.35;
      fade = smoothstep(0.0, 0.3, phase) * smoothstep(1.0, 0.6, phase);
      vAlpha = 0.07 * fade;
    }

    vec4 mv = viewMatrix * vec4(p, 1.0);
    vFogDist = -mv.z;
    gl_Position = projectionMatrix * mv;

    // keep spray from smearing across the lens
    float nearCamera = smoothstep(1.8, 5.5, distance(p, uCameraPos));
    gl_PointSize = clamp(size * uPixelRatio * (205.0 / max(1.0, vFogDist)), 0.6, 40.0) * nearCamera;
    vAlpha *= nearCamera;
    vKind = aKind;
  }
`;

const MIST_FRAGMENT = /* glsl */ `
  ${FOG_UNIFORM_DECL}
  uniform float uTime;
  varying float vAlpha;
  varying float vKind;
  varying float vFogDist;

  ${GLSL_COMMON}

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;
    float soft = pow(1.0 - d, 2.3);
    float core = smoothstep(0.55, 0.0, d);

    vec3 col = mix(vec3(0.72, 0.83, 0.85), vec3(0.97, 0.99, 0.995), core);
    float alpha = vAlpha * soft;
    alpha *= (vKind > 1.5) ? 0.7 : 1.0;

    float dist = vFogDist;
    float fog = 0.0;
    if (uFogMode > 1.5) fog = smoothstep(uFogNear, uFogFar, dist);
    else if (uFogMode > 0.5) { float dd = uFogDensity * dist; fog = 1.0 - exp(-dd * dd); }
    col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));
    alpha *= 1.0 - fog * 0.55;

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ========================================================================== */
/* Shaders — butterflies                                                      */
/* ========================================================================== */

const BUTTERFLY_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aPhase;
  attribute vec3 aColor;
  attribute vec3 aAccent;
  varying vec2 vLocal;
  varying vec3 vColor;
  varying vec3 vAccent;
  varying vec3 vNormalW;
  varying float vViewDist;

  void main() {
    vLocal = position.xz;
    vColor = aColor;
    vAccent = aAccent;

    // hinge along the body (x axis): both wings lift together
    float flap = sin(uTime * (14.0 + aPhase * 3.0) + aPhase * 6.2831);
    vec3 p = position;
    float span = max(abs(p.z), 0.001);
    p.y += span * sin(flap * 1.05) * 1.05;
    p.z *= cos(flap * 0.95);

    vec4 world = instanceMatrix * vec4(p, 1.0);
    vec4 mv = modelMatrix * world;
    vNormalW = normalize(mat3(modelMatrix) * normalize(vec3(0.0, 1.0, 0.35)));
    vViewDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const BUTTERFLY_FRAGMENT = /* glsl */ `
  ${FOG_UNIFORM_DECL}
  uniform vec3 uSunDir;
  varying vec2 vLocal;
  varying vec3 vColor;
  varying vec3 vAccent;
  varying vec3 vNormalW;
  varying float vViewDist;

  ${GLSL_COMMON}

  void main() {
    vec2 p = vLocal;
    float r = length(vec2(p.x * 1.15, p.y));
    float wingEdge = smoothstep(0.20, 0.245, r);

    // dark veins radiating from the hinge
    float ang = atan(p.y, p.x + 0.0001);
    float veins = smoothstep(0.90, 1.0, abs(sin(ang * 9.0))) * 0.55;
    veins += smoothstep(0.02, 0.0, abs(p.x)) * 0.6;

    // pale marginal spots
    float spots = smoothstep(0.70, 0.95, vnoise(vec2(ang * 6.0, r * 26.0))) * smoothstep(0.145, 0.21, r);

    vec3 col = mix(vColor, vAccent, wingEdge * 0.85);
    col = mix(col, vAccent * 0.25 + vColor * 0.15, veins * 0.75);
    col = mix(col, vec3(0.95, 0.94, 0.86), spots * 0.65);

    float light = 0.65 + 0.35 * max(dot(normalize(vNormalW), uSunDir), 0.0);
    col *= light;

    float fog = 0.0;
    if (uFogMode > 1.5) fog = smoothstep(uFogNear, uFogFar, vViewDist);
    else if (uFogMode > 0.5) { float d = uFogDensity * vViewDist; fog = 1.0 - exp(-d * d); }
    col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));

    gl_FragColor = vec4(col, 0.96);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ========================================================================== */
/* Shaders — fireflies                                                        */
/* ========================================================================== */

const FIREFLY_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute vec3 aSeed;
  attribute float aPhase;
  attribute float aSize;
  varying float vGlow;
  varying float vFogDist;

  void main() {
    vec3 p = position;
    float t = uTime * 0.35 + aPhase * 6.2831;
    p.x += sin(t * 0.9 + aSeed.x * 18.0) * 2.2;
    p.z += cos(t * 0.7 + aSeed.y * 21.0) * 2.2;
    p.y += sin(t * 1.3 + aSeed.z * 13.0) * 0.7;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    vFogDist = -mv.z;
    gl_Position = projectionMatrix * mv;

    float pulse = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.9 + aPhase * 1.7) + aPhase * 30.0), 2.5);
    vGlow = pulse;
    gl_PointSize = clamp(aSize * uPixelRatio * (150.0 / max(1.0, vFogDist)) * (0.7 + pulse * 0.6), 0.8, 15.0);
  }
`;

const FIREFLY_FRAGMENT = /* glsl */ `
  ${FOG_UNIFORM_DECL}
  uniform vec3 uColor;
  varying float vGlow;
  varying float vFogDist;

  ${GLSL_COMMON}

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;
    float halo = pow(1.0 - d, 2.6);
    float core = smoothstep(0.30, 0.0, d);
    vec3 col = uColor * (0.6 + core * 1.8);
    float alpha = halo * vGlow * 0.55;
    float fog = 0.0;
    if (uFogMode > 1.5) fog = smoothstep(uFogNear, uFogFar, vFogDist);
    else if (uFogMode > 0.5) { float dd = uFogDensity * vFogDist; fog = 1.0 - exp(-dd * dd); }
    alpha *= 1.0 - clamp(fog, 0.0, 1.0) * 0.7;
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ========================================================================== */
/* Shaders — soft contact shadows                                             */
/* ========================================================================== */

const CONTACT_SHADOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CONTACT_SHADOW_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.15, d) * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(0.045, 0.055, 0.035, a);
  }
`;

/* ========================================================================== */
/* Factory                                                                    */
/* ========================================================================== */

export function createWaterfallAndWildlife(scene, options = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new TypeError('createWaterfallAndWildlife(scene, options): a THREE.Scene is required');
  }

  const settings = Object.assign(
    {
      seed: 1337,
      riverLevel: RIVER.level,
      deer: 5,
      foxes: 2,
      fish: 16,
      butterflies: 28,
      fireflies: 240,
      mistParticles: 1600,
      cliff: true,
      shadows: true,
      quality: 'high'
    },
    options
  );

  const quality = settings.quality === 'medium' ? 0.65 : 1;
  const random = mulberry32(Math.floor(finiteNumber(settings.seed, 1337)));

  const group = new THREE.Group();
  group.name = 'WaterfallAndWildlife';
  scene.add(group);

  /* ---------------------------------------------------------------- anchor */

  const rawAnchor = settings.waterfallAnchor || {};
  const anchor = {
    x: finiteNumber(rawAnchor.x, DEFAULT_WATERFALL_ANCHOR.x),
    yTop: finiteNumber(rawAnchor.yTop, DEFAULT_WATERFALL_ANCHOR.yTop),
    yBottom: finiteNumber(rawAnchor.yBottom, DEFAULT_WATERFALL_ANCHOR.yBottom),
    z: finiteNumber(rawAnchor.z, DEFAULT_WATERFALL_ANCHOR.z),
    width: clamp(finiteNumber(rawAnchor.width, DEFAULT_WATERFALL_ANCHOR.width), 6, 90)
  };
  if (anchor.yTop <= anchor.yBottom) anchor.yTop = anchor.yBottom + 6;

  const riverLevel = finiteNumber(settings.riverLevel, RIVER.level);
  const poolCenter = new THREE.Vector3(anchor.x, riverLevel, RIVER.poolCenterZ);
  const fallBase = new THREE.Vector3(anchor.x, riverLevel, anchor.z + 4.2);
  const sunDirection = readVector(settings.sunDirection, new THREE.Vector3(0.42, 0.45, -0.78)).normalize();
  const upAxis = new THREE.Vector3(0, 1, 0);

  /* --------------------------------------------------------------- terrain */

  const customHeight = typeof settings.getTerrainHeight === 'function' ? settings.getTerrainHeight : null;
  const customNormal = typeof settings.getTerrainNormal === 'function' ? settings.getTerrainNormal : null;

  function terrainHeight(x, z) {
    if (customHeight) {
      try {
        const h = customHeight(x, z);
        if (Number.isFinite(h)) return h;
      } catch (err) {
        /* fall through to the built-in valley */
      }
    }
    return fallbackTerrainHeight(x, z) + riverLevel;
  }

  const normalScratch = new THREE.Vector3();
  function terrainNormal(x, z) {
    if (customNormal) {
      try {
        normalScratch.set(0, 1, 0);
        const result = customNormal(x, z, normalScratch);
        const picked = result && typeof result === 'object' && Number.isFinite(result.x) ? result : normalScratch;
        if (Number.isFinite(picked.x) && Number.isFinite(picked.y) && Number.isFinite(picked.z)) {
          const len = Math.hypot(picked.x, picked.y, picked.z);
          if (len > 1e-5) return normalScratch.copy(picked).multiplyScalar(1 / len);
        }
      } catch (err) {
        /* fall through */
      }
    }
    return fallbackTerrainNormal(x, z, normalScratch).clone();
  }

  /* --------------------------------------------------------------- uniforms */

  const timeUniform = { value: 0 };
  const sunUniform = { value: sunDirection.clone() };
  const pixelRatio = typeof window !== 'undefined' ? clamp(window.devicePixelRatio || 1, 1, 2.5) : 1;
  const cameraUniform = { value: new THREE.Vector3(0, 20, 80) };

  const fogUniforms = {
    uFogColor: { value: new THREE.Color(0xcfe0e4) },
    uFogDensity: { value: 0 },
    uFogMode: { value: 0 },
    uFogNear: { value: 1 },
    uFogFar: { value: 1000 }
  };

  const disposables = { geometries: [], materials: [], meshes: [] };

  function trackMaterial(material) {
    disposables.materials.push(material);
    return material;
  }

  function trackGeometry(geometry) {
    disposables.geometries.push(geometry);
    return geometry;
  }

  function addMesh(mesh, parent = group, { shadow = false } = {}) {
    mesh.castShadow = !!shadow;
    mesh.receiveShadow = false;
    disposables.meshes.push(mesh);
    parent.add(mesh);
    return mesh;
  }

  /* ------------------------------------------------------------- water sheet */

  const waterGeometry = trackGeometry(new THREE.PlaneGeometry(120, 372, Math.round(190 * quality), Math.round(320 * quality)));
  waterGeometry.rotateX(-Math.PI / 2);

  const waterMaterial = trackMaterial(
    new THREE.ShaderMaterial({
      uniforms: Object.assign({}, fogUniforms, {
        uTime: timeUniform,
        uSunDir: sunUniform,
        uPoolCenter: { value: poolCenter.clone() },
        uPoolRadius: { value: RIVER.poolRadius },
        uFallBase: { value: fallBase.clone() },
        uRiverLipZ: { value: RIVER.startZ },
        uRiverEndZ: { value: RIVER.endZ },
        uRiverHalf: { value: RIVER.halfWidth },
        uRiverAmp1: { value: 9.5 },
        uRiverFreq1: { value: 0.0092 },
        uRiverAmp2: { value: 4.0 },
        uRiverFreq2: { value: 0.0231 },
        uRiverPhase2: { value: 1.7 },
        uRiverEnvelope: { value: 90 }
      }),
      vertexShader: WATER_VERTEX,
      fragmentShader: WATER_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  const water = addMesh(new THREE.Mesh(waterGeometry, waterMaterial));
  water.name = 'RiverAndPlungePool';
  water.position.set(anchor.x, riverLevel, 90);
  water.renderOrder = 3;

  // the sheet is masked to the river/pool in the shader, so the rectangle
  // never paints over the meadows.

  /* ------------------------------------------------------- waterfall curtain */

  function buildCurtainGeometry(segX, segY) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];
    const bottomY = anchor.yBottom - 1.7;
    const height = anchor.yTop - bottomY;

    for (let iy = 0; iy <= segY; iy++) {
      const v = iy / segY;
      for (let ix = 0; ix <= segX; ix++) {
        const u = ix / segX;
        const centered = u * 2 - 1;
        const spread = 0.90 + 0.24 * (1 - v);
        let x = anchor.x + centered * (anchor.width * 0.5) * spread;

        // the crest is never a straight razor line — it dips and spills
        const crest = smoothstep(0.9, 1.0, v);
        const notch = crest * (0.40 + 1.90 * valueNoise2(u * 12.4 + 3.1, 0.7));

        let y = bottomY + height * v - notch;
        if (v < 0.04) y += Math.sin(u * Math.PI * 7) * 0.22 * (1 - v / 0.04);
        let z = anchor.z + Math.pow(1 - v, 1.65) * 4.3 - Math.pow(Math.abs(centered), 3) * 1.2;
        z += 0.55 * Math.exp(-Math.pow((v - 0.36) * 16, 2)) * (0.55 + 0.45 * valueNoise2(u * 5.2, 8.3));
        z += Math.sin(u * Math.PI) * 0.55;
        x += Math.sin(v * 9.1) * 0.13 * (1 - crest);
        y += Math.sin(u * Math.PI * 4) * 0.05 * (1 - crest);

        positions.push(x, y, z);
        uvs.push(u, v);
      }
    }

    for (let iy = 0; iy < segY; iy++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = iy * (segX + 1) + ix;
        const b = a + 1;
        const c = a + segX + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const curtainGeometry = trackGeometry(buildCurtainGeometry(Math.round(56 * quality), Math.round(44 * quality)));
  const curtainMaterials = [];

  function makeCurtain(layer, zOffset, scaleX, opacityBias) {
    const material = trackMaterial(
      new THREE.ShaderMaterial({
        uniforms: Object.assign({}, fogUniforms, {
          uTime: timeUniform,
          uSunDir: sunUniform,
          uLayer: { value: layer },
          uWaterLevel: { value: riverLevel }
        }),
        vertexShader: FALL_VERTEX,
        fragmentShader: FALL_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending
      })
    );
    material.uniforms.uLayer.value = layer;
    const mesh = addMesh(new THREE.Mesh(curtainGeometry, material));
    mesh.position.z = zOffset;
    mesh.scale.x = scaleX;
    mesh.renderOrder = 5 + layer;
    mesh.frustumCulled = false;
    curtainMaterials.push(material);
    return mesh;
  }

  makeCurtain(0, 0.12, 1, 0);
  makeCurtain(1, -0.42, 1.035, 0);

  /* ------------------------------------------------- upper river on the shelf */

  const upstreamLevel = 33;
  const upstreamGeometry = trackGeometry(new THREE.PlaneGeometry(anchor.width * 0.88, 92, 12, 34));
  upstreamGeometry.rotateX(-Math.PI / 2);
  const upstreamMaterial = trackMaterial(
    new THREE.ShaderMaterial({
      uniforms: Object.assign({}, fogUniforms, {
        uTime: timeUniform,
        uSunDir: sunUniform,
        uHalfWidth: { value: anchor.width * 0.44 },
        uCenterX: { value: anchor.x },
        uLipZ: { value: anchor.z },
        uLevel: { value: upstreamLevel }
      }),
      vertexShader: WATER_VERTEX,
      fragmentShader: /* glsl */ `
        ${FOG_UNIFORM_DECL}
        uniform float uTime;
        uniform vec3 uSunDir;
        uniform float uHalfWidth;
        uniform float uCenterX;
        uniform float uLipZ;
        varying vec3 vWorld;
        varying float vViewDist;

        ${GLSL_COMMON}

        void main() {
          vec2 p = vWorld.xz;
          float edge = 1.0 - smoothstep(uHalfWidth * 0.72, uHalfWidth, abs(vWorld.x - uCenterX));
          if (edge < 0.01) discard;

          vec2 g = vec2(0.0);
          g += vec2(0.05, 0.02) * cos(p.y * 1.4 + uTime * 2.2 + p.x * 0.3);
          g += vec2(-0.03, 0.05) * cos(p.y * 2.6 - uTime * 3.1 + p.x * 0.8);
          vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
          vec3 V = normalize(cameraPosition - vWorld);
          vec3 R = reflect(-V, N);
          float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);

          vec3 deep = vec3(0.010, 0.075, 0.09);
          vec3 sky = mix(vec3(0.62, 0.76, 0.80), vec3(0.22, 0.46, 0.80), clamp(R.y, 0.0, 1.0));
          vec3 col = mix(deep, sky, 0.14 + fres * 0.52);
          col = mix(col, vec3(0.035, 0.085, 0.055), smoothstep(0.24, 0.02, R.y) * 0.35);

          float sunGlow = pow(max(dot(R, uSunDir), 0.0), 190.0);
          col += vec3(1.0, 0.9, 0.72) * sunGlow * 0.7;

          float flow = fbm(vec2(p.x * 0.9, p.y * 0.22 + uTime * 1.4));
          float lipFoam = smoothstep(uLipZ - 7.0, uLipZ + 0.3, p.y) * (0.4 + 0.6 * flow);
          float streaks = smoothstep(0.6, 0.85, fbm(vec2(p.x * 2.4, p.y * 0.6 + uTime * 2.2))) * 0.35;
          col = mix(col, vec3(0.93, 0.98, 0.97), clamp(lipFoam + streaks, 0.0, 1.0) * 0.85);

          col = applyFogRGB(col, vViewDist);
          float distal = smoothstep(-162.0, -138.0, vWorld.z);
          gl_FragColor = vec4(col, edge * 0.92 * distal);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  const upstream = addMesh(new THREE.Mesh(upstreamGeometry, upstreamMaterial));
  upstream.name = 'UpperRiver';
  upstream.position.set(anchor.x, riverLevel + upstreamLevel, anchor.z - 46);
  upstream.renderOrder = 3;

  /* ------------------------------------------------------------ cliff & lip */

  const rockMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true
    })
  );

  const cliffMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.98,
      metalness: 0.01,
      flatShading: false,
      side: THREE.DoubleSide,
      emissive: 0x231c15,
      emissiveIntensity: 0.62
    })
  );

  /** World-space procedural rock grain for the cliff faces. */
  (function applyRockDetail(material) {
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec3 vRockWorld;\nvarying vec3 vRockNormal;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
         vRockWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vRockNormal = normalize(mat3(modelMatrix) * objectNormal);`
      );
      shader.fragmentShader =
        'varying vec3 vRockWorld;\nvarying vec3 vRockNormal;\n' +
        `float rockHash(vec2 p) {
           p = fract(p * vec2(123.34, 456.21));
           p += dot(p, p + 45.32);
           return fract(p.x * p.y);
         }
         float rockNoise(vec2 p) {
           vec2 i = floor(p);
           vec2 f = fract(p);
           vec2 u = f * f * (3.0 - 2.0 * f);
           return mix(mix(rockHash(i), rockHash(i + vec2(1.0, 0.0)), u.x),
                      mix(rockHash(i + vec2(0.0, 1.0)), rockHash(i + vec2(1.0, 1.0)), u.x), u.y);
         }
         float rockFbm(vec2 p) {
           float s = 0.0;
           float a = 0.5;
           for (int i = 0; i < 4; i++) {
             s += a * rockNoise(p);
             p = p * 2.07 + vec2(11.3, 5.7);
             a *= 0.5;
           }
           return s;
         }
        ` +
        shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float grain = rockFbm(vec2(vRockWorld.x * 0.22 + vRockWorld.y * 0.16, vRockWorld.z * 0.2 - vRockWorld.y * 0.12));
         float strata = 0.5 + 0.5 * sin(vRockWorld.y * 0.85 + rockFbm(vec2(vRockWorld.x * 0.04, vRockWorld.z * 0.04)) * 7.0);
         float crevice = smoothstep(0.58, 0.92, rockFbm(vec2(vRockWorld.x * 0.75, vRockWorld.y * 0.85 + vRockWorld.z * 0.3)));
         diffuseColor.rgb *= 0.80 + 0.34 * grain + 0.10 * strata;
         diffuseColor.rgb *= 1.0 - crevice * 0.38;
         float mossPatch = smoothstep(0.02, 0.55, vRockNormal.y) * smoothstep(0.36, 0.66, rockFbm(vRockWorld.xz * 0.55 + vRockWorld.y * 0.1));
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.14, 0.27, 0.09), mossPatch * 0.55);
         float wetBand = (1.0 - smoothstep(2.0, 17.0, abs(vRockWorld.x))) * (1.0 - smoothstep(18.0, 32.0, vRockWorld.y));
         diffuseColor.rgb *= 1.0 - wetBand * 0.22;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        `#include <normal_fragment_begin>
         {
           float e = 0.55;
           vec2 bp = vec2(vRockWorld.x * 0.55, vRockWorld.y * 0.55 + vRockWorld.z * 0.2);
           float n0 = rockFbm(bp);
           float nx = rockFbm(bp + vec2(e, 0.0));
           float ny = rockFbm(bp + vec2(0.0, e));
           vec3 gradW = vec3(-(nx - n0) / e, 0.0, -(ny - n0) / e) * 1.05;
           normal = normalize(normal + (viewMatrix * vec4(gradW, 0.0)).xyz);
         }
        `
      );
    };
    material.customProgramCacheKey = () => 'waterfall-rock-detail';
  })(cliffMaterial);

  function makeRockColors(geometry, { moss = 0.55, wetCenter = true } = {}) {
    const pos = geometry.attributes.position;
    const nrm = geometry.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const nx = nrm.getX(i);
      const ny = nrm.getY(i);
      const nz = nrm.getZ(i);
      const grain = fbm2(x * 0.4 + 3.1, y * 0.4 - 1.7, 3);
      const n = fbm2(x * 0.16 + 11.0, y * 0.16, 3);
      color.setRGB(0.40 + grain * 0.16, 0.375 + grain * 0.15, 0.32 + grain * 0.13);
      const mossMask = smoothstep(0.2, 0.8, ny) * smoothstep(0.45, 0.75, n) * moss;
      color.lerp(new THREE.Color(0.24, 0.36 + grain * 0.08, 0.15), mossMask);
      if (wetCenter) {
        const wet = smoothstep(anchor.width * 1.05, anchor.width * 0.25, Math.abs(x)) * 0.30;
        color.multiplyScalar(1 - wet * 0.7);
        color.lerp(new THREE.Color(0.14, 0.16, 0.15), wet * 0.4);
      }
      color.multiplyScalar(0.82 + 0.30 * clamp(nz * 0.5 + 0.5, 0, 1));
      // horizontal strata and damp crevices
      const strata = 0.86 + 0.14 * Math.sin(y * 0.72 + grain * 5.0);
      const crevice = 0.78 + 0.22 * smoothstep(0.35, 0.8, fbm2(x * 0.7 + 2.0, y * 0.9, 2));
      color.multiplyScalar(strata * crevice);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  if (settings.cliff) {
    const segX = Math.round(54 * quality);
    const segY = Math.round(40 * quality);

    // Back panel: the dark, wet rock the curtain is seen through. It sits just
    // in front of the terrain headwall so the translucent water never shows
    // the raw terrain mesh.
    function buildBackPanel() {
      const width = anchor.width * 1.5;
      const height = anchor.yTop - anchor.yBottom + 2;
      const geometry = trackGeometry(new THREE.PlaneGeometry(width, height, segX, segY));
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        let z = (fbm2(x * 0.24 + 8.1, y * 0.24, 3) - 0.5) * 1.2;
        z += (fbm2(x * 0.8, y * 0.9 + 2.0, 2) - 0.5) * 0.35;
        z -= smoothstep(anchor.width * 0.5, 0, Math.abs(x)) * 1.0;
        pos.setZ(i, z);
        if (y > height * 0.3) {
          const crown = smoothstep(height * 0.3, height * 0.5, y);
          pos.setY(i, y - crown * (0.2 + 2.2 * valueNoise2(x * 0.5 + 6.0, 3.3)));
        }
      }
      geometry.computeVertexNormals();
      makeRockColors(geometry, { moss: 0.22, wetCenter: true });
      const mesh = addMesh(new THREE.Mesh(geometry, cliffMaterial));
      mesh.name = 'WaterfallBackRock';
      mesh.position.set(anchor.x, (anchor.yTop + anchor.yBottom) * 0.5, anchor.z - 1.25);
      mesh.receiveShadow = true;
      return mesh;
    }

    // Wings: rock walls that flank the notch and reach forward toward the pool,
    // giving the falls an alcove instead of a flat cardboard backdrop.
    function buildWing(sideSign) {
      const width = Math.min(60, anchor.width * 2.8);
      const geometry = trackGeometry(new THREE.BufferGeometry());
      const positions = [];
      const uvs = [];
      const indices = [];

      for (let iy = 0; iy <= segY; iy++) {
        const v = iy / segY;
        for (let ix = 0; ix <= segX; ix++) {
          const u = ix / segX;
          const dist = u * width;
          const outward = Math.pow(u, 0.72);
          let x = anchor.x + sideSign * (anchor.width * 0.5 + 0.15 + dist);
          const bottomY = anchor.yBottom - 4;
          const topY =
            anchor.yTop + 1.2 +
            9.0 * (fbm2(x * 0.055 + sideSign * 7.0, 1.7, 3) - 0.5) -
            outward * 16.0;
          let y = bottomY + v * (topY - bottomY);
          let z = anchor.z - 1.55 + outward * 8.6;
          const relief = fbm2(x * 0.15 + sideSign * 3.0, y * 0.14, 4) - 0.5;
          const fine = fbm2(x * 0.6, y * 0.55 + 4.2, 2) - 0.5;
          z += relief * 2.8 + fine * 0.8;
          z += Math.sin(x * 0.36 + y * 0.21) * 0.35;
          x += fine * 0.8;
          y += relief * 1.5;
          positions.push(x, y, z);
          uvs.push(u, v);
        }
      }

      for (let iy = 0; iy < segY; iy++) {
        for (let ix = 0; ix < segX; ix++) {
          const a = iy * (segX + 1) + ix;
          const b = a + 1;
          const c = a + segX + 1;
          const d = c + 1;
          if (sideSign > 0) indices.push(a, b, c, b, d, c);
          else indices.push(a, c, b, b, c, d);
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      makeRockColors(geometry, { moss: 0.5, wetCenter: false });
      const mesh = addMesh(new THREE.Mesh(geometry, cliffMaterial));
      mesh.name = sideSign > 0 ? 'WaterfallWingEast' : 'WaterfallWingWest';
      mesh.receiveShadow = true;
      return mesh;
    }

    buildBackPanel();
    buildWing(1);
    buildWing(-1);
  }

  /* -------------------------------------------------------------- boulders */

  function makeBoulderGeometry(seedOffset) {
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n = hash2(x * 3.1 + seedOffset, z * 2.7 + y * 1.9) - 0.5;
      const s = 1 + n * 0.22;
      pos.setXYZ(i, x * s * 1.15, y * s * 0.82, z * s);
    }
    geometry.computeVertexNormals();
    makeRockColors(geometry, { moss: 0.8, wetCenter: false });
    return geometry;
  }

  const boulderGeometries = [makeBoulderGeometry(1.7), makeBoulderGeometry(9.3), makeBoulderGeometry(17.1)];
  boulderGeometries.forEach(trackGeometry);

  const boulderPlacements = [];
  function queueBoulder(x, z, size, wet = false, yOverride = null) {
    const normal = wet ? new THREE.Vector3(0, 1, 0) : terrainNormal(x, z).clone();
    boulderPlacements.push({
      x,
      z,
      size,
      wet,
      yOverride,
      normal,
      rot: random() * Math.PI * 2,
      tilt: (random() - 0.5) * 0.25
    });
  }

  // cliff base, flanking the curtain
  for (let i = 0; i < 10; i++) {
    const side = random() < 0.5 ? -1 : 1;
    const x = anchor.x + side * (anchor.width * 0.56 + random() * anchor.width * 1.25);
    queueBoulder(x, anchor.z + random() * 4.6 - 0.4, 0.8 + random() * 1.25);
  }
  // pool rim
  for (let i = 0; i < 10; i++) {
    const ang = random() * Math.PI * 2;
    const rad = RIVER.poolRadius + 0.6 + random() * 4.5;
    queueBoulder(anchor.x + Math.cos(ang) * rad, RIVER.poolCenterZ + Math.sin(ang) * rad, 0.5 + random() * 1.1);
  }
  // river banks and shallows
  for (let i = 0; i < 14; i++) {
    const z = 0 + random() * 210;
    const side = random() < 0.5 ? -1 : 1;
    const offset = riverHalfWidth(z) + 1.6 + random() * 2.6;
    queueBoulder(riverCenterX(z) + side * offset, z, 0.4 + random() * 0.85);
  }
  for (let i = 0; i < 5; i++) {
    const z = 4 + random() * 130;
    queueBoulder(riverCenterX(z) + (random() - 0.5) * riverHalfWidth(z) * 0.6, z, 0.4 + random() * 0.55, true);
  }

  const boulderMeshes = boulderGeometries.map((geometry) => {
    const mesh = new THREE.InstancedMesh(geometry, rockMaterial, Math.ceil(boulderPlacements.length / 3) + 1);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'Boulders';
    disposables.meshes.push(mesh);
    group.add(mesh);
    return mesh;
  });

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  boulderPlacements.forEach((b, i) => {
    const target = boulderMeshes[i % boulderMeshes.length];
    const index = target.count++;
    const ground = b.yOverride !== null
      ? b.yOverride
      : b.wet
        ? riverLevel - b.size * 0.55
        : terrainHeight(b.x, b.z) - b.size * 0.42;
    dummy.position.set(b.x, ground, b.z);
    dummy.quaternion.setFromUnitVectors(upAxis, b.normal);
    dummy.rotateY(b.rot);
    dummy.rotateZ(b.tilt);
    dummy.scale.set(b.size * (0.85 + random() * 0.35), b.size * (0.62 + random() * 0.3), b.size);
    dummy.updateMatrix();
    target.setMatrixAt(index, dummy.matrix);
    if (target.setColorAt) {
      tint.setHSL(0.09 + random() * 0.035, 0.03 + random() * 0.05, 0.62 + random() * 0.14);
      target.setColorAt(index, tint);
    }
  });
  boulderMeshes.forEach((mesh) => {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  });

  /* --------------------------------------------------------- mist & spray */

  const mistCount = Math.max(300, Math.round(finiteNumber(settings.mistParticles, 1600) * quality));
  const mistGeometry = new THREE.BufferGeometry();
  {
    const positions = new Float32Array(mistCount * 3);
    const seeds = new Float32Array(mistCount * 4);
    const kinds = new Float32Array(mistCount);
    const speeds = new Float32Array(mistCount);
    for (let i = 0; i < mistCount; i++) {
      const roll = random();
      const kind = roll < 0.45 ? 0 : roll < 0.82 ? 1 : 2;
      kinds[i] = kind;
      speeds[i] = kind === 0 ? 0.35 + random() * 0.35 : kind === 1 ? 0.10 + random() * 0.10 : 0.05 + random() * 0.05;
      seeds[i * 4 + 0] = random();
      seeds[i * 4 + 1] = random();
      seeds[i * 4 + 2] = random();
      seeds[i * 4 + 3] =
        kind === 0 ? 0.8 + random() * 1.1 : kind === 1 ? 1.6 + random() * 2.2 : 2.4 + random() * 2.6;
      positions[i * 3] = anchor.x;
      positions[i * 3 + 1] = anchor.yBottom;
      positions[i * 3 + 2] = anchor.z;
    }
    mistGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mistGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    mistGeometry.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
    mistGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    trackGeometry(mistGeometry);
  }

  const mistMaterial = trackMaterial(
    new THREE.ShaderMaterial({
      uniforms: Object.assign({}, fogUniforms, {
        uTime: timeUniform,
        uAnchor: { value: new THREE.Vector3(anchor.x, anchor.yBottom, anchor.z) },
        uWidth: { value: anchor.width },
        uHeight: { value: anchor.yTop - anchor.yBottom },
        uPixelRatio: { value: pixelRatio },
        uCameraPos: cameraUniform
      }),
      vertexShader: MIST_VERTEX,
      fragmentShader: MIST_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );

  const mist = addMesh(new THREE.Points(mistGeometry, mistMaterial));
  mist.name = 'WaterfallMist';
  mist.frustumCulled = false;
  mist.renderOrder = 6;

  /* ------------------------------------------------------ contact shadows */

  const shadowGeometry = trackGeometry(new THREE.CircleGeometry(1, 24));
  shadowGeometry.rotateX(-Math.PI / 2);

  function makeContactShadow(radiusX, radiusZ, opacity) {
    if (!settings.shadows) return null;
    const material = trackMaterial(
      new THREE.ShaderMaterial({
        uniforms: { uOpacity: { value: opacity } },
        vertexShader: CONTACT_SHADOW_VERTEX,
        fragmentShader: CONTACT_SHADOW_FRAGMENT,
        transparent: true,
        depthWrite: false
      })
    );
    const mesh = new THREE.Mesh(shadowGeometry, material);
    mesh.scale.set(radiusX, 1, radiusZ);
    mesh.position.y = 0.03;
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    return mesh;
  }

  /* --------------------------------------------------------------- wildlife */

  const animals = [];
  const fish = [];
  const butterflies = [];
  const fireflies = [];

  const unitSphere = trackGeometry(new THREE.SphereGeometry(1, 14, 10));
  const unitSphereLow = trackGeometry(new THREE.SphereGeometry(1, 9, 7));
  const unitBox = trackGeometry(new THREE.BoxGeometry(1, 1, 1));
  const unitCone = trackGeometry(new THREE.ConeGeometry(1, 1, 8));
  const legUpperGeometry = trackGeometry(new THREE.CylinderGeometry(0.062, 0.085, 0.56, 7));
  const legLowerGeometry = trackGeometry(new THREE.CylinderGeometry(0.042, 0.06, 0.52, 7));
  const hoofGeometry = trackGeometry(new THREE.BoxGeometry(0.075, 0.09, 0.11));
  const neckGeometry = trackGeometry(new THREE.CylinderGeometry(0.125, 0.175, 0.85, 9));

  const material = (color, opts = {}) =>
    trackMaterial(
      new THREE.MeshStandardMaterial(
        Object.assign({ color, roughness: 0.9, metalness: 0, flatShading: false }, opts)
      )
    );

  /** Object-space fur grain, so the low-poly bodies do not read as plastic. */
  function applyFurGrain(mat, amount = 0.16, scale = 9.0) {
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec3 vFurPos;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n vFurPos = position;'
      );
      shader.fragmentShader =
        'varying vec3 vFurPos;\n' +
        `float furHash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 31.7); return fract(p.x * p.y); }
         float furNoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
           return mix(mix(furHash(i), furHash(i+vec2(1.0,0.0)), u.x), mix(furHash(i+vec2(0.0,1.0)), furHash(i+vec2(1.0,1.0)), u.x), u.y); }
        ` +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float furN = furNoise(vFurPos.xz * ${scale.toFixed(2)} + vFurPos.y * 5.0);
         float furPatch = furNoise(vFurPos.xy * 2.6 + 4.2);
         diffuseColor.rgb *= 1.0 - ${amount.toFixed(3)} + ${(amount * 2).toFixed(3)} * (furN * 0.65 + furPatch * 0.35);
        `
      );
    };
    mat.customProgramCacheKey = () => 'fur-grain-' + amount;
    return mat;
  }

  const furPalette = [0x8d6a4b, 0x79583f, 0x9a7250].map((c) => applyFurGrain(material(c, { roughness: 0.94 }), 0.24, 13));
  const deerBelly = applyFurGrain(material(0xd0b795, { roughness: 0.95 }), 0.1, 7);
  const deerDark = material(0x4a3223, { roughness: 0.9 });
  const deerLeg = applyFurGrain(material(0x654a34, { roughness: 0.93 }), 0.12, 8);
  const antlerMaterial = material(0xc0aa82, { roughness: 0.72 });
  const eyeMaterial = material(0x0e0b08, { roughness: 0.28, metalness: 0.1 });
  const noseMaterial = material(0x2a1b15, { roughness: 0.5 });

  const foxFur = applyFurGrain(material(0xb95b26, { roughness: 0.95 }), 0.14, 9);
  const foxCream = applyFurGrain(material(0xf0e4d1, { roughness: 0.95 }), 0.08, 8);
  const foxDark = material(0x352016, { roughness: 0.9 });

  const hareFur = applyFurGrain(material(0x9c8c74, { roughness: 0.96 }), 0.15, 10);
  const hareBelly = applyFurGrain(material(0xdfd3bd, { roughness: 0.96 }), 0.09, 8);

  const fishSilver = material(0xa8b8b0, { roughness: 0.32, metalness: 0.35, emissive: 0x1a2420, emissiveIntensity: 0.7 });
  const fishOlive = material(0x77876b, { roughness: 0.4, metalness: 0.2, emissive: 0x121a10, emissiveIntensity: 0.6 });
  const fishPink = material(0xd98d84, { roughness: 0.5 });
  const koiOrange = material(0xe27a2a, { roughness: 0.38, metalness: 0.15, emissive: 0x471708, emissiveIntensity: 0.8 });
  const koiWhite = material(0xf1e7d6, { roughness: 0.42, emissive: 0x2b2620, emissiveIntensity: 0.5 });
  const finMaterial = material(0xcfd8cf, { roughness: 0.55, transparent: true, opacity: 0.85 });

  function part(geometry, mat, parent, position, scale, rotation) {
    const mesh = new THREE.Mesh(geometry, mat);
    if (position) mesh.position.set(position[0], position[1], position[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }

  /* ------------------------------------------------------------- deer builder */

  function buildAntler(sideSign) {
    const antler = new THREE.Group();
    const s = sideSign;
    const beamPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.01, 0.16, 0.05 * s),
      new THREE.Vector3(-0.04, 0.32, 0.11 * s),
      new THREE.Vector3(-0.16, 0.48, 0.17 * s),
      new THREE.Vector3(-0.30, 0.60, 0.22 * s)
    ];
    const beamCurve = new THREE.CatmullRomCurve3(beamPoints);
    const beamGeometry = trackGeometry(new THREE.TubeGeometry(beamCurve, 10, 0.038, 5, false));
    part(beamGeometry, antlerMaterial, antler, [0, 0, 0], null, null);

    const tineDefs = [
      { at: 1, dir: [0.16, 0.20, 0.05 * s], len: 0.22 },
      { at: 2, dir: [0.18, 0.17, 0.07 * s], len: 0.20 },
      { at: 3, dir: [-0.02, 0.18, 0.10 * s], len: 0.17 }
    ];
    for (const tine of tineDefs) {
      const base = beamPoints[tine.at];
      const tip = new THREE.Vector3(
        base.x + tine.dir[0],
        base.y + tine.dir[1],
        base.z + tine.dir[2]
      );
      const mid = new THREE.Vector3().lerpVectors(base, tip, 0.5);
      mid.x += 0.02;
      const curve = new THREE.CatmullRomCurve3([base.clone(), mid, tip]);
      const geometry = trackGeometry(
        new THREE.TubeGeometry(curve, 6, 0.027 * tine.len / 0.2, 5, false)
      );
      part(geometry, antlerMaterial, antler, [0, 0, 0], null, null);
    }
    return antler;
  }

  function buildDeer({ stag, scale, fur, name }) {
    const root = new THREE.Group();
    root.name = `deer-${name}`;
    root.scale.setScalar(scale);

    const body = new THREE.Group();
    root.add(body);

    part(unitSphere, fur, body, [0, 1.14, 0], [0.98, 0.44, 0.37]);
    part(unitSphere, fur, body, [0.44, 1.17, 0], [0.46, 0.40, 0.35]);
    part(unitSphere, fur, body, [-0.46, 1.13, 0], [0.48, 0.41, 0.35]);
    part(unitSphere, deerBelly, body, [0.02, 0.90, 0], [0.74, 0.19, 0.29]);
    part(unitSphere, deerBelly, body, [-0.83, 1.21, 0], [0.135, 0.18, 0.23]);

    // neck + head
    const neck = new THREE.Group();
    neck.position.set(0.62, 1.40, 0);
    neck.rotation.z = -0.52;
    body.add(neck);
    part(neckGeometry, fur, neck, [0, 0.42, 0], [1.05, 1.05, 1.05]);
    part(unitSphere, fur, neck, [0, 0.02, 0], [0.21, 0.22, 0.20]);
    part(unitSphere, deerBelly, neck, [0.13, 0.40, 0], [0.075, 0.24, 0.11]);

    const head = new THREE.Group();
    head.position.set(0.02, 0.86, 0);
    neck.add(head);
    part(unitSphere, fur, head, [0.10, 0.04, 0], [0.285, 0.225, 0.20]);
    part(unitCone, deerBelly, head, [0.33, -0.025, 0], [0.105, 0.33, 0.09], [0, 0, -Math.PI / 2]);
    part(unitSphere, noseMaterial, head, [0.49, -0.035, 0], [0.05, 0.036, 0.048]);
    part(unitSphere, deerBelly, head, [0.23, -0.10, 0], [0.095, 0.05, 0.095]);

    const ears = [];
    for (const side of [-1, 1]) {
      const ear = part(unitCone, fur, head, [0.0, 0.245, 0.155 * side], [0.09, 0.33, 0.055], [0.8 * side, 0, -0.12]);
      ears.push(ear);
      part(unitCone, deerBelly, head, [0.015, 0.25, 0.158 * side], [0.05, 0.25, 0.028], [0.8 * side, 0, -0.12]);
      part(unitSphere, eyeMaterial, head, [0.23, 0.085, 0.165 * side], [0.038, 0.038, 0.028]);
    }

    if (stag) {
      for (const side of [-1, 1]) {
        const antler = buildAntler(side);
        antler.position.set(0.02, 0.205, 0.095 * side);
        antler.rotation.x = 0.15 * side;
        head.add(antler);
      }
    }

    // tail
    const tail = part(unitCone, fur, body, [-0.92, 1.26, 0], [0.075, 0.30, 0.075], [0, 0, 2.35]);

    // four articulated legs
    const legs = [];
    const legDefs = [
      { x: 0.62, z: 0.235, front: true, phase: 0 },
      { x: 0.62, z: -0.235, front: true, phase: Math.PI },
      { x: -0.62, z: 0.235, front: false, phase: Math.PI },
      { x: -0.62, z: -0.235, front: false, phase: 0 }
    ];
    for (const def of legDefs) {
      const hip = new THREE.Group();
      hip.position.set(def.x, 1.08, def.z);
      body.add(hip);
      part(unitSphere, fur, hip, [0, -0.03, 0], [0.13, 0.17, 0.12]);
      const upper = part(legUpperGeometry, fur, hip, [0, -0.28, 0], null, null);
      const knee = new THREE.Group();
      knee.position.set(0, -0.56, 0);
      hip.add(knee);
      part(legLowerGeometry, deerLeg, knee, [0, -0.26, 0], null, null);
      part(hoofGeometry, deerDark, knee, [0.012, -0.53, 0], null, null);
      legs.push({ hip, knee, upper, front: def.front, phase: def.phase });
    }

    const shadow = makeContactShadow(1.10, 0.62, 0.26);
    if (shadow) root.add(shadow);

    return { root, body, neck, head, tail, legs, ears, shadow, baseBodyY: 1.14 };
  }

  /* -------------------------------------------------------------- fox builder */

  function buildFox({ scale, name }) {
    const root = new THREE.Group();
    root.name = `fox-${name}`;
    root.scale.setScalar(scale);

    const body = new THREE.Group();
    root.add(body);

    part(unitSphere, foxFur, body, [0, 0.56, 0], [0.52, 0.23, 0.20]);
    part(unitSphere, foxFur, body, [0.36, 0.58, 0], [0.27, 0.21, 0.19]);
    part(unitSphere, foxFur, body, [-0.34, 0.56, 0], [0.28, 0.22, 0.19]);
    part(unitSphere, foxCream, body, [0.08, 0.44, 0], [0.42, 0.12, 0.15]);

    const neck = new THREE.Group();
    neck.position.set(0.48, 0.66, 0);
    neck.rotation.z = -0.55;
    body.add(neck);
    part(unitSphere, foxFur, neck, [0, 0.06, 0], [0.17, 0.18, 0.16]);

    const head = new THREE.Group();
    head.position.set(0.02, 0.22, 0);
    neck.add(head);
    part(unitSphere, foxFur, head, [0.07, 0.03, 0], [0.17, 0.145, 0.145]);
    part(unitCone, foxFur, head, [0.23, -0.015, 0], [0.075, 0.24, 0.065], [0, 0, -Math.PI / 2]);
    part(unitSphere, foxDark, head, [0.34, -0.015, 0], [0.032, 0.026, 0.03]);

    const ears = [];
    for (const side of [-1, 1]) {
      const ear = part(unitCone, foxFur, head, [0.02, 0.17, 0.085 * side], [0.055, 0.19, 0.045], [0.25 * side, 0, -0.08]);
      part(unitCone, foxDark, head, [0.025, 0.165, 0.085 * side], [0.03, 0.14, 0.026], [0.25 * side, 0, -0.08]);
      ears.push(ear);
      part(unitSphere, eyeMaterial, head, [0.16, 0.055, 0.115 * side], [0.023, 0.023, 0.02]);
    }

    // brush tail — three puffs on a lazy S-curve
    const tail = new THREE.Group();
    tail.position.set(-0.46, 0.60, 0);
    tail.rotation.z = -0.32;
    body.add(tail);
    part(unitSphere, foxFur, tail, [-0.10, 0.02, 0], [0.22, 0.15, 0.14]);
    part(unitSphere, foxFur, tail, [-0.30, 0.10, 0], [0.20, 0.145, 0.135]);
    part(unitSphere, foxCream, tail, [-0.53, 0.16, 0], [0.105, 0.085, 0.08]);

    const legs = [];
    const legDefs = [
      { x: 0.33, z: 0.13, front: true, phase: 0 },
      { x: 0.33, z: -0.13, front: true, phase: Math.PI },
      { x: -0.31, z: 0.13, front: false, phase: Math.PI },
      { x: -0.31, z: -0.13, front: false, phase: 0 }
    ];
    for (const def of legDefs) {
      const hip = new THREE.Group();
      hip.position.set(def.x, 0.50, def.z);
      body.add(hip);
      part(unitSphere, foxFur, hip, [0, -0.02, 0], [0.09, 0.12, 0.085]);
      const upper = part(unitCone, foxFur, hip, [0, -0.12, 0], [0.065, 0.26, 0.065], [Math.PI, 0, 0]);
      const knee = new THREE.Group();
      knee.position.set(0, -0.24, 0);
      hip.add(knee);
      part(unitCone, foxDark, knee, [0, -0.10, 0], [0.045, 0.22, 0.045], [Math.PI, 0, 0]);
      part(unitBox, foxDark, knee, [0.015, -0.23, 0], [0.07, 0.055, 0.075]);
      legs.push({ hip, knee, upper, front: def.front, phase: def.phase });
    }

    const shadow = makeContactShadow(0.62, 0.40, 0.3);
    if (shadow) root.add(shadow);

    return { root, body, neck, head, tail, legs, ears, shadow, baseBodyY: 0.56 };
  }

  /* ------------------------------------------------------------- hare builder */

  function buildHare({ scale, name }) {
    const root = new THREE.Group();
    root.name = `hare-${name}`;
    root.scale.setScalar(scale);

    const body = new THREE.Group();
    root.add(body);

    part(unitSphere, hareFur, body, [0, 0.34, 0], [0.30, 0.20, 0.18]);
    part(unitSphere, hareBelly, body, [0.02, 0.24, 0], [0.24, 0.12, 0.15]);
    part(unitSphere, hareFur, body, [-0.17, 0.35, 0], [0.19, 0.17, 0.16]);

    const head = new THREE.Group();
    head.position.set(0.26, 0.50, 0);
    head.rotation.z = -0.25;
    body.add(head);
    part(unitSphere, hareFur, head, [0, 0, 0], [0.135, 0.125, 0.12]);
    part(unitSphere, hareBelly, head, [0.09, -0.03, 0], [0.075, 0.065, 0.065]);
    part(unitSphere, noseMaterial, head, [0.16, -0.025, 0], [0.022, 0.018, 0.02]);

    const ears = [];
    for (const side of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(-0.02, 0.10, 0.055 * side);
      ear.rotation.set(0.18 * side, 0, 0.22);
      head.add(ear);
      part(unitCone, hareFur, ear, [0, 0.16, 0], [0.045, 0.34, 0.025]);
      part(unitCone, hareBelly, ear, [0.005, 0.15, 0.008 * side], [0.028, 0.28, 0.014]);
      ears.push(ear);
      part(unitSphere, eyeMaterial, head, [0.075, 0.035, 0.095 * side], [0.02, 0.02, 0.018]);
    }

    // haunches
    part(unitSphere, hareFur, body, [-0.16, 0.28, 0.10], [0.14, 0.13, 0.10]);
    part(unitSphere, hareFur, body, [-0.16, 0.28, -0.10], [0.14, 0.13, 0.10]);

    const frontLegs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(0.19, 0.22, 0.085 * side);
      body.add(leg);
      part(unitBox, hareFur, leg, [0, -0.1, 0], [0.035, 0.18, 0.035]);
      part(unitBox, hareBelly, leg, [0.012, -0.20, 0], [0.05, 0.04, 0.05]);
      frontLegs.push(leg);
    }
    const hindLegs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(-0.22, 0.28, 0.105 * side);
      body.add(leg);
      part(unitBox, hareFur, leg, [0.02, -0.12, 0], [0.05, 0.20, 0.05]);
      part(unitBox, hareBelly, leg, [0.10, -0.24, 0], [0.14, 0.045, 0.06]);
      hindLegs.push(leg);
    }

    const tail = part(unitSphere, hareBelly, body, [-0.30, 0.36, 0], [0.075, 0.075, 0.065]);

    const shadow = makeContactShadow(0.42, 0.32, 0.26);
    if (shadow) root.add(shadow);

    return { root, body, head, ears, tail, frontLegs, hindLegs, shadow, baseBodyY: 0.34 };
  }

  /* -------------------------------------------------------------- paths */

  const pathSpecs = {
    deer: [
      [[-34, -18], [-46, 10], [-40, 42], [-24, 58], [-14, 30], [-18, -2]],
      [[30, -8], [44, 20], [40, 52], [24, 64], [16, 36], [20, 4]],
      [[26, -32], [38, -18], [36, 4], [24, 8], [18, -12]],
      [[-52, 20], [-64, 48], [-56, 78], [-42, 88], [-36, 60], [-42, 32]],
      [[-14, 80], [-24, 104], [-30, 130], [-24, 150], [-14, 124], [-12, 96]]
    ],
    fox: [
      [[-58, -6], [-66, 26], [-58, 56], [-46, 64], [-44, 34], [-48, 6]],
      [[52, -24], [62, 4], [56, 34], [44, 44], [40, 16], [44, -10]]
    ],
    hare: [
      [[-16, 10], [-20, 34], [-14, 56], [-24, 70], [-30, 46], [-26, 22]]
    ]
  };

  function makePath(points, y = 0) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(p[0], y, p[1])),
      true,
      'catmullrom',
      0.5
    );
    curve.arcLengthDivisions = 240;
    return { curve, length: Math.max(1, curve.getLength()) };
  }

  const deerPaths = pathSpecs.deer.map((pts) => makePath(pts));
  const foxPaths = pathSpecs.fox.map((pts) => makePath(pts));
  const harePaths = pathSpecs.hare.map((pts) => makePath(pts));

  /* ------------------------------------------------------------- spawn deer */

  const deerCount = clamp(Math.round(finiteNumber(settings.deer, 5)), 0, 6);
  const deerNames = ['Bramble', 'Fennel', 'Juniper', 'Willow', 'Clover', 'Sorrel'];

  for (let i = 0; i < deerCount; i++) {
    const stag = i < Math.min(3, deerCount);
    const path = deerPaths[i % deerPaths.length];
    const fur = furPalette[i % furPalette.length];
    const scale = (stag ? 1.02 : 0.94) + random() * 0.09;
    const name = deerNames[i];
    const built = buildDeer({ stag, scale, fur, name });
    built.root.position.set(0, 0, 0);
    group.add(built.root);

    const rec = {
      id: `deer-${i + 1}`,
      name,
      species: stag ? 'red-deer-stag' : 'red-deer-doe',
      kind: 'deer',
      followable: true,
      mesh: built.root,
      position: new THREE.Vector3(),
      speed: 0.8,
      baseSpeed: 0.9 + random() * 0.55,
      yaw: 0,
      parts: built,
      path,
      distance: path.length * ((i / Math.max(1, deerCount)) + random() * 0.05),
      state: 'walk',
      timer: 6 + random() * 10,
      gait: 0,
      gaitPhase: random() * Math.PI * 2,
      headDown: 0,
      normal: new THREE.Vector3(0, 1, 0),
      scratch: {
        p: new THREE.Vector3(),
        tangent: new THREE.Vector3(),
        normal: new THREE.Vector3(),
        qAlign: new THREE.Quaternion(),
        qYaw: new THREE.Quaternion(),
        up: new THREE.Vector3(0, 1, 0)
      }
    };
    animals.push(rec);
    placeAnimal(rec, 0);
  }

  /* -------------------------------------------------------------- spawn foxes */

  const foxCount = clamp(Math.round(finiteNumber(settings.foxes, 2)), 0, 3);
  const foxNames = ['Rust', 'Pip', 'Ember'];

  for (let i = 0; i < foxCount; i++) {
    const path = foxPaths[i % foxPaths.length];
    const name = foxNames[i];
    const built = buildFox({ scale: 0.95 + random() * 0.14, name });
    group.add(built.root);

    const rec = {
      id: `fox-${i + 1}`,
      name,
      species: 'red-fox',
      kind: 'fox',
      followable: true,
      mesh: built.root,
      position: new THREE.Vector3(),
      speed: 1.4,
      baseSpeed: 1.5 + random() * 0.5,
      yaw: 0,
      parts: built,
      path,
      distance: path.length * (i / Math.max(1, foxCount) + random() * 0.1),
      state: 'walk',
      timer: 3 + random() * 6,
      gait: 0,
      gaitPhase: random() * Math.PI * 2,
      headDown: 0,
      run: 0,
      normal: new THREE.Vector3(0, 1, 0),
      scratch: {
        p: new THREE.Vector3(),
        tangent: new THREE.Vector3(),
        normal: new THREE.Vector3(),
        qAlign: new THREE.Quaternion(),
        qYaw: new THREE.Quaternion(),
        up: new THREE.Vector3(0, 1, 0)
      }
    };
    animals.push(rec);
    placeAnimal(rec, 0);
  }

  /* --------------------------------------------------------------- spawn hare */

  {
    const path = harePaths[0];
    const built = buildHare({ scale: 1 + random() * 0.12, name: 'Thistle' });
    group.add(built.root);
    const rec = {
      id: 'hare-1',
      name: 'Thistle',
      species: 'brown-hare',
      kind: 'hare',
      followable: true,
      mesh: built.root,
      position: new THREE.Vector3(),
      speed: 0,
      baseSpeed: 1.8 + random() * 0.6,
      yaw: 0,
      parts: built,
      path,
      distance: path.length * 0.35,
      state: 'walk',
      timer: 2 + random() * 4,
      gait: 0,
      gaitPhase: random() * Math.PI * 2,
      headDown: 0,
      hop: 0,
      normal: new THREE.Vector3(0, 1, 0),
      scratch: {
        p: new THREE.Vector3(),
        tangent: new THREE.Vector3(),
        normal: new THREE.Vector3(),
        qAlign: new THREE.Quaternion(),
        qYaw: new THREE.Quaternion(),
        up: new THREE.Vector3(0, 1, 0)
      }
    };
    animals.push(rec);
    placeAnimal(rec, 0);
  }

  /* ------------------------------------------------------------- spawn fish */

  const fishCount = clamp(Math.round(finiteNumber(settings.fish, 16)), 0, 40);
  const koiNames = ['Saffron', 'Mochi', 'Copper', 'Pearl', 'Ginger'];
  const troutNames = ['Torrent', 'Riffle', 'Pebble', 'Cascade', 'Shale', 'Brook', 'Run', 'Eddy', 'Drift'];
  let koiIndex = 0;
  let troutIndex = 0;

  function buildFish({ koi, scale, name }) {
    const root = new THREE.Group();
    root.name = `fish-${name}`;
    root.scale.setScalar(scale);

    const bodyMat = koi ? koiOrange : fishSilver;
    const body = part(unitSphereLow, bodyMat, root, [0, 0, 0], [koi ? 0.34 : 0.28, koi ? 0.11 : 0.075, koi ? 0.085 : 0.06]);
    if (koi) {
      part(unitSphere, koiWhite, root, [0.05, 0.012, 0], [0.19, 0.075, 0.068]);
      part(unitSphere, koiWhite, root, [-0.14, 0.008, 0], [0.10, 0.06, 0.055]);
    } else {
      part(unitSphere, fishOlive, root, [-0.02, 0.035, 0], [0.22, 0.045, 0.045]);
      part(unitBox, fishPink, root, [-0.01, 0, 0.056], [0.22, 0.024, 0.004]);
      part(unitBox, fishPink, root, [-0.01, 0, -0.056], [0.22, 0.024, 0.004]);
    }

    const tail = new THREE.Group();
    tail.position.set(koi ? -0.30 : -0.25, 0, 0);
    root.add(tail);
    part(unitCone, finMaterial, tail, [-0.09, 0, 0], [0.045, 0.22, 0.15], [0, 0, Math.PI / 2]);

    part(unitCone, finMaterial, root, [0.02, 0.075, 0], [0.03, 0.10, 0.09], [0, 0, 0.25]);
    for (const side of [-1, 1]) {
      part(unitCone, finMaterial, root, [0.08, -0.03, 0.06 * side], [0.02, 0.09, 0.035], [0.9 * side, 0, 0]);
      part(unitSphere, eyeMaterial, root, [0.17, 0.025, 0.043 * side], [0.016, 0.016, 0.014]);
    }

    return { root, body, tail };
  }

  for (let i = 0; i < fishCount; i++) {
    const koi = i % 4 === 0;
    const name = koi ? koiNames[koiIndex++ % koiNames.length] : troutNames[troutIndex++ % troutNames.length] + `-${troutIndex}`;
    const scale = koi ? 1.5 + random() * 0.5 : 1 + random() * 0.4;
    const built = buildFish({ koi, scale, name });
    group.add(built.root);

    let center;
    let radii;
    let yBase;
    if (koi) {
      const ang = random() * Math.PI * 2;
      const rad = 3 + random() * 6;
      center = new THREE.Vector2(Math.cos(ang) * rad, RIVER.poolCenterZ + 4 + Math.sin(ang) * rad);
      radii = new THREE.Vector2(6 + random() * 5, 5 + random() * 5);
      yBase = riverLevel - 0.65 - random() * 0.6;
    } else if (i % 2 === 0) {
      const ang = random() * Math.PI * 2;
      const rad = 2 + random() * 8;
      center = new THREE.Vector2(Math.cos(ang) * rad, RIVER.poolCenterZ + 4 + Math.sin(ang) * rad);
      radii = new THREE.Vector2(5.5 + random() * 6, 5 + random() * 6);
      yBase = riverLevel - 0.55 - random() * 0.55;
    } else {
      const z = 8 + random() * 54;
      center = new THREE.Vector2(riverCenterX(z), z);
      radii = new THREE.Vector2(3.2 + random() * 1.6, 9 + random() * 7);
      yBase = riverLevel - 0.45 - random() * 0.5;
    }

    const rec = {
      id: koiNames.includes(name) ? `koi-${i + 1}` : `trout-${i + 1}`,
      name,
      species: koi ? 'koi' : 'river-trout',
      kind: 'fish',
      aquatic: true,
      followable: false,
      mesh: built.root,
      position: new THREE.Vector3(),
      speed: 0.6 + random() * 0.7,
      center,
      radii,
      yBase,
      angle: random() * Math.PI * 2,
      phase: random() * Math.PI * 2,
      tail: built.tail
    };
    fish.push(rec);
    updateFish(rec, 0, 0);
  }

  /* --------------------------------------------------------- spawn butterflies */

  const butterflyCount = clamp(Math.round(finiteNumber(settings.butterflies, 28)), 0, 80);
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.0, 0.0);
  wingShape.bezierCurveTo(-0.06, 0.10, -0.03, 0.20, 0.035, 0.235);
  wingShape.bezierCurveTo(0.10, 0.225, 0.13, 0.11, 0.085, 0.035);
  wingShape.bezierCurveTo(0.06, -0.01, 0.02, -0.015, 0.0, 0.0);

  const rightWingGeometry = trackGeometry(new THREE.ShapeGeometry(wingShape, 10));
  rightWingGeometry.rotateX(-Math.PI / 2);
  const leftWingGeometry = trackGeometry(rightWingGeometry.clone());
  {
    const positions = leftWingGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) positions.setZ(i, -positions.getZ(i));
    positions.needsUpdate = true;
    leftWingGeometry.computeVertexNormals();
  }

  const palettes = [
    { color: new THREE.Color(0xe2913a), accent: new THREE.Color(0x2a1a12), weight: 0.42 },
    { color: new THREE.Color(0x5a8ee0), accent: new THREE.Color(0x18264f), weight: 0.22 },
    { color: new THREE.Color(0xe6d27e), accent: new THREE.Color(0x7b6127), weight: 0.22 },
    { color: new THREE.Color(0xeee8da), accent: new THREE.Color(0x5c5044), weight: 0.14 }
  ];

  function pickPalette() {
    let roll = random();
    for (const p of palettes) {
      roll -= p.weight;
      if (roll <= 0) return p;
    }
    return palettes[0];
  }

  const butterflyMaterial = trackMaterial(
    new THREE.ShaderMaterial({
      uniforms: Object.assign({}, fogUniforms, { uTime: timeUniform, uSunDir: sunUniform }),
      vertexShader: BUTTERFLY_VERTEX,
      fragmentShader: BUTTERFLY_FRAGMENT,
      side: THREE.DoubleSide,
      transparent: false
    })
  );

  function makeWingMesh(geometry, count) {
    const mesh = new THREE.InstancedMesh(geometry, butterflyMaterial, Math.max(1, count));
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = count;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    disposables.meshes.push(mesh);
    group.add(mesh);
    return mesh;
  }

  const rightWings = makeWingMesh(rightWingGeometry, butterflyCount);
  const leftWings = makeWingMesh(leftWingGeometry, butterflyCount);

  const wingPhase = new Float32Array(Math.max(1, butterflyCount));
  const wingColor = new Float32Array(Math.max(1, butterflyCount) * 3);
  const wingAccent = new Float32Array(Math.max(1, butterflyCount) * 3);
  for (let i = 0; i < butterflyCount; i++) {
    const pal = pickPalette();
    wingPhase[i] = random();
    wingColor.set([pal.color.r, pal.color.g, pal.color.b], i * 3);
    wingAccent.set([pal.accent.r, pal.accent.g, pal.accent.b], i * 3);
    const zone = random();
    let homeX;
    let homeZ;
    if (zone < 0.25) {
      homeX = anchor.x + (random() - 0.5) * 30;
      homeZ = anchor.z + 12 + random() * 26;
    } else if (zone < 0.55) {
      homeX = -16 - random() * 26;
      homeZ = -10 + random() * 70;
    } else if (zone < 0.85) {
      homeX = 14 + random() * 28;
      homeZ = -20 + random() * 90;
    } else {
      homeX = -8 + random() * 16;
      homeZ = 84 + random() * 60;
    }
    butterflies.push({
      homeX,
      homeZ,
      radiusX: 1.2 + random() * 3.4,
      radiusZ: 1.2 + random() * 3.4,
      phase: random() * Math.PI * 2,
      speed: 0.55 + random() * 0.5,
      height: 0.6 + random() * 1.6,
      scale: 0.85 + random() * 0.7
    });
  }

  const wingAttributes = (geometry) => {
    geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(wingPhase, 1));
    geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(wingColor, 3));
    geometry.setAttribute('aAccent', new THREE.InstancedBufferAttribute(wingAccent, 3));
  };
  if (butterflyCount > 0) {
    wingAttributes(rightWingGeometry);
    wingAttributes(leftWingGeometry);
  }

  const butterflyBodies = (() => {
    const geometry = trackGeometry(new THREE.CapsuleGeometry(0.012, 0.05, 2, 5));
    geometry.rotateZ(Math.PI / 2);
    const mat = material(0x241a12, { roughness: 0.8 });
    const mesh = new THREE.InstancedMesh(geometry, mat, Math.max(1, butterflyCount));
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = butterflyCount;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  })();

  /* ----------------------------------------------------------- spawn fireflies */

  const fireflyCount = clamp(Math.round(finiteNumber(settings.fireflies, 240) * quality), 0, 800);
  if (fireflyCount > 0) {
    const positions = new Float32Array(fireflyCount * 3);
    const seeds = new Float32Array(fireflyCount * 3);
    const phases = new Float32Array(fireflyCount);
    const sizes = new Float32Array(fireflyCount);
    for (let i = 0; i < fireflyCount; i++) {
      let x;
      let z;
      if (random() < 0.35) {
        const ang = random() * Math.PI * 2;
        const rad = 10 + random() * 24;
        x = anchor.x + Math.cos(ang) * rad;
        z = anchor.z + 10 + Math.sin(ang) * rad * 0.8;
      } else {
        x = -34 + random() * 74;
        z = -20 + random() * 130;
        if (Math.abs(x - riverCenterX(z)) < riverHalfWidth(z) + 2) x += 14;
      }
      const y = terrainHeight(x, z) + 0.8 + Math.pow(random(), 1.6) * 5.5;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i * 3] = random();
      seeds[i * 3 + 1] = random();
      seeds[i * 3 + 2] = random();
      phases[i] = random();
      sizes[i] = 1.1 + random() * 1.8;
    }
    const geometry = trackGeometry(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const pointsMaterial = trackMaterial(
      new THREE.ShaderMaterial({
        uniforms: Object.assign({}, fogUniforms, {
          uTime: timeUniform,
          uPixelRatio: { value: pixelRatio },
          uColor: { value: new THREE.Color(0xffc46e) }
        }),
        vertexShader: FIREFLY_VERTEX,
        fragmentShader: FIREFLY_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    const points = addMesh(new THREE.Points(geometry, pointsMaterial));
    points.name = 'Fireflies';
    points.frustumCulled = false;
    points.renderOrder = 7;
    fireflies.push(points);
  }

  /* --------------------------------------------------------- creature logic */

  const creatureDummy = new THREE.Object3D();
  let lastElapsed = 0;
  let lastDelta = 1 / 60;
  let disposed = false;

  /** Sample the patrol path, ground the animal and tilt it to the slope. */
  function placeAnimal(rec, dt) {
    const path = rec.path;
    const t = ((rec.distance / path.length) % 1 + 1) % 1;
    const p = rec.scratch.p;
    const tangent = rec.scratch.tangent;
    path.curve.getPointAt(t, p);
    path.curve.getTangentAt(t, tangent);
    if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
    tangent.y = 0;
    tangent.normalize();

    const ground = terrainHeight(p.x, p.z);
    rec.mesh.position.set(p.x, ground + 0.02, p.z);

    const normal = terrainNormal(p.x, p.z);
    const blend = dt > 0 ? Math.min(1, dt * 5) : 1;
    rec.normal.lerp(normal, blend);
    if (rec.normal.lengthSq() < 1e-6) rec.normal.set(0, 1, 0);
    rec.normal.normalize();

    const desiredYaw = Math.atan2(-tangent.z, tangent.x);
    let diff = desiredYaw - rec.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    rec.yaw += diff * (dt > 0 ? Math.min(1, dt * 5) : 1);

    rec.scratch.qYaw.setFromAxisAngle(upAxis, rec.yaw);
    rec.scratch.qAlign.setFromUnitVectors(upAxis, rec.normal);
    rec.mesh.quaternion.copy(rec.scratch.qAlign).multiply(rec.scratch.qYaw);

    rec.position.copy(rec.mesh.position);
  }

  function animateQuadrupedLegs(rec, dt, moveAmount, frequency, stride) {
    rec.gait += dt * frequency;
    const swing = moveAmount * stride;
    for (const leg of rec.parts.legs) {
      const s = Math.sin(rec.gait + leg.phase);
      const lift = Math.max(0, Math.sin(rec.gait + leg.phase + Math.PI / 2));
      leg.hip.rotation.z = s * swing;
      const bendDir = leg.front ? -1 : 1;
      leg.knee.rotation.z = bendDir * (0.08 + lift * 0.55) * moveAmount;
    }
  }

  function updateDeer(rec, dt, time) {
    rec.timer -= dt;
    if (rec.timer <= 0) {
      if (rec.state === 'graze') {
        rec.state = 'walk';
        rec.timer = 9 + random() * 12;
      } else {
        rec.state = 'graze';
        rec.timer = 3.5 + random() * 6.5;
      }
    }

    const target = rec.state === 'graze' ? 0 : rec.baseSpeed;
    rec.speed += (target - rec.speed) * Math.min(1, dt * 2.0);
    rec.distance += rec.speed * dt;
    placeAnimal(rec, dt);

    const move = clamp(rec.speed / 1.15, 0, 1);
    animateQuadrupedLegs(rec, dt, move, 3.2 + rec.speed * 1.8, 0.60);

    rec.parts.body.position.y = Math.sin(rec.gait * 2) * 0.035 * move - rec.headDown * 0.06;
    rec.parts.body.rotation.z = Math.sin(rec.gait) * 0.028 * move;

    const grazeTarget = rec.state === 'graze' ? 1 : 0;
    rec.headDown += (grazeTarget - rec.headDown) * Math.min(1, dt * 1.7);
    rec.parts.neck.rotation.z = -0.52 - rec.headDown * 1.90;
    rec.parts.head.rotation.z = -0.16 - rec.headDown * 0.55;
    rec.parts.head.rotation.y = Math.sin(time * 0.42 + rec.gaitPhase) * 0.30 * (0.25 + rec.headDown);

    rec.parts.tail.rotation.z = 2.35 + Math.sin(time * 1.7 + rec.gaitPhase) * 0.10;
    rec.parts.tail.rotation.x = Math.sin(time * 2.3 + rec.gaitPhase) * 0.08;

    rec.parts.ears[0].rotation.z = -0.1 + Math.sin(time * 1.1 + rec.gaitPhase) * 0.08;
    rec.parts.ears[1].rotation.z = -0.1 + Math.sin(time * 1.3 + rec.gaitPhase + 1.4) * 0.08;
  }

  function updateFox(rec, dt, time) {
    rec.timer -= dt;
    if (rec.timer <= 0) {
      const roll = random();
      if (rec.state === 'pause' || rec.state === 'sniff') {
        rec.state = roll < 0.3 ? 'sprint' : 'walk';
        rec.timer = rec.state === 'sprint' ? 1.2 + random() * 1.4 : 4 + random() * 6;
      } else if (roll < 0.28) {
        rec.state = 'pause';
        rec.timer = 1.4 + random() * 3.0;
      } else if (roll < 0.42) {
        rec.state = 'sniff';
        rec.timer = 1.6 + random() * 2.4;
      } else if (roll < 0.6) {
        rec.state = 'sprint';
        rec.timer = 1.0 + random() * 1.6;
      } else {
        rec.state = 'walk';
        rec.timer = 3.5 + random() * 6;
      }
    }

    let target = rec.baseSpeed;
    if (rec.state === 'sprint') target = rec.baseSpeed * 2.6;
    else if (rec.state === 'pause' || rec.state === 'sniff') target = 0;

    rec.speed += (target - rec.speed) * Math.min(1, dt * (rec.state === 'sprint' ? 5 : 3));
    rec.distance += rec.speed * dt;
    placeAnimal(rec, dt);

    const move = clamp(rec.speed / 1.6, 0, 1);
    animateQuadrupedLegs(rec, dt, move, 4.4 + rec.speed * 2.1, 0.66);

    rec.parts.body.position.y = Math.sin(rec.gait * 2) * 0.026 * move;
    rec.parts.body.rotation.z = Math.sin(rec.gait) * 0.04 * move;

    const sniff = rec.state === 'sniff' ? 1 : 0;
    rec.headDown += (sniff - rec.headDown) * Math.min(1, dt * 4);
    rec.parts.neck.rotation.z = -0.55 - rec.headDown * 0.55;
    rec.parts.head.rotation.z = -0.1 - rec.headDown * 0.5;
    rec.parts.head.rotation.y = Math.sin(time * 0.8 + rec.gaitPhase) * 0.35 * (1 - rec.headDown * 0.6);

    rec.parts.tail.rotation.z = -0.32 + Math.sin(time * 2.4 + rec.gaitPhase) * 0.16;
    rec.parts.tail.rotation.y = Math.sin(time * 3.1 + rec.gaitPhase) * 0.25;

    rec.parts.ears[0].rotation.x = 0.25 + Math.sin(time * 2.2 + rec.gaitPhase) * 0.12;
    rec.parts.ears[1].rotation.x = -0.25 + Math.sin(time * 2.5 + rec.gaitPhase + 1.1) * 0.12;
  }

  function updateHare(rec, dt, time) {
    rec.timer -= dt;
    if (rec.timer <= 0) {
      if (rec.state === 'pause') {
        rec.state = 'walk';
        rec.timer = 3 + random() * 5;
      } else if (random() < 0.35) {
        rec.state = 'pause';
        rec.timer = 1.2 + random() * 2.4;
      } else {
        rec.timer = 3 + random() * 5;
      }
    }

    const target = rec.state === 'pause' ? 0 : rec.baseSpeed;
    rec.speed += (target - rec.speed) * Math.min(1, dt * 4);
    rec.distance += rec.speed * dt;
    placeAnimal(rec, dt);

    const move = clamp(rec.speed / 1.5, 0, 1);
    rec.hop += dt * (4.2 + rec.speed * 1.1);
    const hop = Math.abs(Math.sin(rec.hop)) * 0.24 * move;
    rec.parts.body.position.y = hop;
    rec.parts.body.rotation.z = -0.10 * move + Math.sin(rec.hop * 2) * 0.05 * move;

    for (const leg of rec.parts.frontLegs) {
      leg.rotation.z = -0.5 * move + Math.sin(rec.hop) * 0.35 * move;
    }
    for (const leg of rec.parts.hindLegs) {
      leg.rotation.z = 0.6 * move - Math.sin(rec.hop + 0.8) * 0.55 * move;
    }

    rec.parts.head.rotation.y = Math.sin(time * 0.9 + rec.gaitPhase) * 0.35;
    rec.parts.head.rotation.z = -0.25 + Math.sin(time * 1.4 + rec.gaitPhase) * 0.05;
    rec.parts.ears[0].rotation.z = 0.22 + Math.sin(time * 1.7 + rec.gaitPhase) * 0.12;
    rec.parts.ears[1].rotation.z = 0.22 + Math.sin(time * 1.9 + rec.gaitPhase + 1.6) * 0.12;
  }

  function updateFish(rec, dt, time) {
    const meanRadius = Math.max(2, (rec.radii.x + rec.radii.y) * 0.5);
    rec.angle += (dt * rec.speed) / meanRadius;
    const x = rec.center.x + Math.cos(rec.angle) * rec.radii.x;
    const z = rec.center.y + Math.sin(rec.angle) * rec.radii.y;
    const y = rec.yBase + Math.sin(time * 1.15 + rec.phase) * 0.10;
    rec.mesh.position.set(x, y, z);

    const dx = -Math.sin(rec.angle) * rec.radii.x;
    const dz = Math.cos(rec.angle) * rec.radii.y;
    const yaw = Math.atan2(-dz, dx);
    rec.mesh.rotation.set(
      Math.sin(time * 0.6 + rec.phase) * 0.06,
      yaw,
      Math.sin(time * 0.8 + rec.phase) * 0.10
    );
    rec.tail.rotation.y = Math.sin(time * 7.2 + rec.phase + rec.angle * 2) * 0.5;
    rec.position.copy(rec.mesh.position);
  }

  function updateButterflies(time) {
    if (!butterflyCount) return;
    for (let i = 0; i < butterflyCount; i++) {
      const b = butterflies[i];
      const t = time * b.speed + b.phase;
      const x = b.homeX + Math.sin(t * 0.7) * b.radiusX + Math.sin(t * 1.9 + 1.3) * 0.7;
      const z = b.homeZ + Math.cos(t * 0.63) * b.radiusZ + Math.sin(t * 1.6 + 0.4) * 0.6;
      const y = terrainHeight(x, z) + b.height + Math.sin(t * 1.35) * 0.45;

      creatureDummy.position.set(x, y, z);
      creatureDummy.rotation.set(0, Math.sin(t * 0.8) * 1.5 + b.phase, 0);
      creatureDummy.scale.setScalar(b.scale);
      creatureDummy.updateMatrix();

      rightWings.setMatrixAt(i, creatureDummy.matrix);
      leftWings.setMatrixAt(i, creatureDummy.matrix);
      butterflyBodies.setMatrixAt(i, creatureDummy.matrix);
    }
    rightWings.instanceMatrix.needsUpdate = true;
    leftWings.instanceMatrix.needsUpdate = true;
    butterflyBodies.instanceMatrix.needsUpdate = true;
  }

  /* -------------------------------------------------------------- fog sync */

  function syncFog() {
    const fog = scene.fog;
    if (!fog) {
      fogUniforms.uFogMode.value = 0;
      return;
    }
    if (fog.color) fogUniforms.uFogColor.value.copy(fog.color);
    if (fog.isFogExp2) {
      fogUniforms.uFogMode.value = 1;
      fogUniforms.uFogDensity.value = Math.max(0, finiteNumber(fog.density, 0));
    } else if (fog.isFog) {
      fogUniforms.uFogMode.value = 2;
      fogUniforms.uFogNear.value = finiteNumber(fog.near, 1);
      fogUniforms.uFogFar.value = Math.max(finiteNumber(fog.far, 1000), fogUniforms.uFogNear.value + 1);
    } else {
      fogUniforms.uFogMode.value = 0;
    }
  }

  /* ---------------------------------------------------------------- update */

  function update(elapsed, delta, cameraPos) {
    if (disposed) return;

    const safeElapsed = Number.isFinite(elapsed) ? elapsed : lastElapsed;
    let safeDelta = Number.isFinite(delta) ? delta : lastDelta;
    safeDelta = clamp(safeDelta, 0, 0.1);

    lastElapsed = safeElapsed;
    lastDelta = safeDelta > 0 ? safeDelta : lastDelta;
    timeUniform.value = safeElapsed;

    if (cameraPos && typeof cameraPos === 'object') {
      const cx = finiteNumber(cameraPos.x, NaN);
      const cy = finiteNumber(cameraPos.y, NaN);
      const cz = finiteNumber(cameraPos.z, NaN);
      if (Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(cz)) {
        cameraUniform.value.set(cx, cy, cz);
      }
    }

    syncFog();

    for (const animal of animals) {
      if (animal.kind === 'deer') updateDeer(animal, safeDelta, safeElapsed);
      else if (animal.kind === 'fox') updateFox(animal, safeDelta, safeElapsed);
      else if (animal.kind === 'hare') updateHare(animal, safeDelta, safeElapsed);
    }

    for (const fy of fish) updateFish(fy, safeDelta, safeElapsed);
    updateButterflies(safeElapsed);
  }

  /* ------------------------------------------------------------- public API */

  const queryPoint = new THREE.Vector3();

  function getNearestAnimal(point) {
    if (!point || typeof point !== 'object') return null;
    const x = finiteNumber(point.x, NaN);
    const y = finiteNumber(point.y, NaN);
    const z = finiteNumber(point.z, NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    queryPoint.set(x, y, z);

    let best = null;
    let bestDistance = Infinity;
    for (const animal of animals) {
      const distance = queryPoint.distanceTo(animal.position);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = animal;
      }
    }
    return best ? { animal: best, distance: bestDistance, speed: best.speed } : null;
  }

  function getWaterfallDistance(point) {
    if (!point || typeof point !== 'object') return Infinity;
    const x = finiteNumber(point.x, NaN);
    const y = finiteNumber(point.y, NaN);
    const z = finiteNumber(point.z, NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return Infinity;

    const cx = clamp(x, anchor.x - anchor.width * 0.5, anchor.x + anchor.width * 0.5);
    const cy = clamp(y, anchor.yBottom, anchor.yTop);
    const cz = anchor.z + Math.pow(clamp(1 - (cy - anchor.yBottom) / (anchor.yTop - anchor.yBottom), 0, 1), 1.7) * 4.2;
    return Math.hypot(x - cx, y - cy, z - cz);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    if (group.parent) group.parent.remove(group);

    const seenGeometry = new Set();
    for (const geometry of disposables.geometries) {
      if (geometry && !seenGeometry.has(geometry)) {
        seenGeometry.add(geometry);
        try {
          geometry.dispose();
        } catch (err) {
          /* already gone */
        }
      }
    }

    for (const mat of disposables.materials) {
      if (mat && typeof mat.dispose === 'function') {
        try {
          mat.dispose();
        } catch (err) {
          /* already gone */
        }
      }
    }

    disposables.geometries.length = 0;
    disposables.materials.length = 0;
    disposables.meshes.length = 0;
    animals.length = 0;
    fish.length = 0;
    butterflies.length = 0;
    fireflies.length = 0;
  }

  // Prime the procedural uniforms so the very first rendered frame is correct.
  syncFog();
  update(0, 0, cameraUniform.value);

  return {
    group,
    animals,
    fish,
    butterflies,
    fireflies,
    anchor: Object.assign({}, anchor),
    layout: {
      poolCenter: poolCenter.clone(),
      poolRadius: RIVER.poolRadius,
      rivers: { startZ: RIVER.startZ, endZ: RIVER.endZ, level: riverLevel },
      riverCenterX,
      riverHalfWidth
    },
    update,
    getNearestAnimal,
    getWaterfallDistance,
    dispose
  };
}

export default createWaterfallAndWildlife;



