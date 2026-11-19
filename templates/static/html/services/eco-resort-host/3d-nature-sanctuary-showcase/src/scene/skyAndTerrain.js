/**
 * skyAndTerrain.js
 * ============================================================================
 * Atmosphere, sky, sun, clouds, soaring birds and the lush green hill terrain
 * for the open-world 3D nature-hotel portfolio.
 *
 * Everything here is procedural — no textures, no GLB models, no network
 * requests. The module is deterministic: the same seed builds the same world on
 * every load, so the waterfall, wildlife and camera modules can rely on it.
 *
 * ----------------------------------------------------------------------------
 * WORLD CONTRACT  (read this before placing anything in the scene)
 * ----------------------------------------------------------------------------
 * Axes      +X = east, +Y = up, +Z = south (towards the arrival viewpoint)
 * Terrain   a 1200 × 1200 warped grid centred on the origin, displaced by
 *           getTerrainHeight(x, z). The grid is denser (≈1 world unit) in the
 *           central valley and coarser (≈10 units) towards the far ridges.
 *
 * THE VALLEY
 *   The valley runs north ↔ south along the X = 0 axis. Its floor sits around
 *   Y = 0…2, the river channel is cut into that floor, and rolling green hills
 *   rise on both flanks (+20 … +95) into distant misty ridge lines.
 *
 * THE RIVER  (flows towards +Z, i.e. "downhill" towards the viewer)
 *   Water surface ......... RIVER_WATER_LEVEL = 0  (flat, downstream of the falls)
 *   Channel width ......... RIVER_WIDTH = 22  (half width 11)
 *   Centreline ............ x = getRiverCenterX(z)  — pinned to x = 0 at the
 *                           waterfall lip, meandering ±14 units downstream.
 *   Bank / shingle edge ... +0.15 … +1.55 above the water, ~18 units wide
 *   River bed ............. −3.4 at the centreline
 *   Helpers ............... getRiverY(x, z) → water height (0)
 *                           isInRiver(x, z, margin?) → boolean
 *                           getRiverCenterX(z), getDistanceToRiver(x, z)
 *   Trout / koi / river stones belong between z ≈ −40 and z ≈ +260.
 *
 * THE WATERFALL  (the head of the valley — all numbers are exact)
 *   WATERFALL_ANCHOR = { x: 0, yTop: 34, yBottom: 0, z: −65, width: 22 }
 *     • The curtain hangs in the vertical plane z = −65, centred on x = 0,
 *       spanning x ∈ [−11, +11], from y = 34 down to y = 0.
 *     • The rock lip is at CLIFF_LIP_Z = −66.5, y = CLIFF_TOP_Y = 34; the cliff
 *       face drops to the valley floor in ≈1.8 units of Z (near vertical), and
 *       the terrain at the foot of the curtain is already below the water line,
 *       so the falling water lands cleanly in the plunge pool.
 *   PLUNGE_POOL = { x: 0, z: −57, radius: 30, depth: 3.4 }
 *     • A round basin blending into the river channel; its rim is the water
 *       line (y ≈ 0), so a pool mesh at y = 0 sits perfectly in it.
 *   UPSTREAM (z < −66.5)
 *     • A high shelf at y ≈ 34 carrying the upper river reach:
 *       UPSTREAM_RIVER_LEVEL = 33 (bed 31.9) running straight along x = 0.
 *       Mist, spray, the crest lip and any upper-river water plane belong here.
 *
 * THE SKY
 *   SUN_DIRECTION is the unit vector FROM the scene TOWARDS the sun (warm
 *   golden morning, ~26° above the horizon, behind the waterfall). The dome
 *   follows the active camera, so it never clips; the sun light also follows the
 *   camera's ground position so its shadow map always covers what you see.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   import {
 *     createSkyAndTerrain, getTerrainHeight, getTerrainNormal,
 *     WATERFALL_ANCHOR, RIVER_WATER_LEVEL,
 *   } from './scene/skyAndTerrain.js';
 *
 *   const world = createSkyAndTerrain(scene, { camera });
 *   // every frame
 *   world.update(elapsed, delta, camera.position);
 *   // clean up
 *   world.dispose();
 *
 * getTerrainHeight / getTerrainNormal are pure functions and can be imported on
 * their own (needed by the waterfall, wildlife and camera modules) without
 * building the scene.
 *
 * ----------------------------------------------------------------------------
 * OPTIONS  (all optional)
 * ----------------------------------------------------------------------------
 *   quality          'high' | 'medium' | 'low'  → terrain resolution + instance
 *                    counts + shadow map size (see QUALITY_PRESETS)
 *   seed             integer, default 20261117   deterministic world
 *   camera           THREE.Camera — enables the screen-space lens flare and
 *                    sizes the sky dome to the camera's far plane (setCamera())
 *   addLights        default true — add sun / hemisphere / fill to the scene
 *   gradeLights      default true — let update() gently grade the lights
 *   manageFog        default true — create (or adopt) an exponential valley fog
 *   shadows          default true — 2048² PCF shadow map around the camera
 *   terrainShadows   default false — let the hills cast shadows too (costlier,
 *                    prone to hard slabs on a 1-unit cliff face)
 *   sunIntensity, hemiIntensity, fillIntensity, *Color …  palette overrides
 *   pines, broadleaf, grassTufts, flowers, boulders, cloudPuffs, mistBanks,
 *   mistParticles, hawks, swallows, terrainSegments, shadowMapSize, treeRadius,
 *   meadowRadius, fogDensityLow/High, cloudOpacity, mistOpacity, windStrength
 *
 * RETURNED HANDLE
 *   { group, lights: { sun, hemisphere, fill, target }, terrain, sky, glow,
 *     clouds, mistBanks, mistParticles, birds, birdStates, trees, stats,
 *     config, sunDirection, update, dispose, setCamera, getCamera,
 *     getTerrainHeight, getTerrainNormal, getTerrainSlope, getRiverCenterX,
 *     getDistanceToRiver, getRiverY, isInRiver, isInPlungePool,
 *     getEnvironmentState }
 *
 * Integration note: the sibling waterfallAndWildlife.js already mirrors the
 * RIVER / PLUNGE_POOL numbers above; pass its `cliff: false` option so its rock
 * face does not double this module's headwall.
 * ============================================================================
 */

import * as THREE from 'three';

/* ========================================================================== */
/*  World constants                                                           */
/* ========================================================================== */

/** Unit vector pointing FROM the scene TOWARDS the sun. */
export const SUN_DIRECTION = new THREE.Vector3(0.42, 0.45, -0.78).normalize();

/** Side length of the terrain plane (world units). */
export const TERRAIN_SIZE = 1200;

/** The waterfall curtain — see the header for the full geometry. */
export const WATERFALL_ANCHOR = Object.freeze({
  x: 0,
  yTop: 34,
  yBottom: 0,
  z: -65,
  width: 22,
});

/** Rock lip of the headwall (top edge of the cliff). */
export const CLIFF_LIP_Z = -66.5;
/** Top surface of the headwall plateau. */
export const CLIFF_TOP_Y = 34;
/** Z distance over which the headwall drops to the valley floor. */
const CLIFF_DROP_RUN = 1.8;

/** Lateral ripple of the cliff line (0 at the falls, up to ±11 units on the flanks). */
function cliffLipZ(x) {
  const amp = smoothstep01((Math.abs(x) - 12) / 20);
  return (
    CLIFF_LIP_Z +
    amp *
      (6.4 * Math.sin(x * 0.026) +
        3.4 * Math.sin(x * 0.061 + 1.2) +
        2.0 * Math.sin(x * 0.148 + 0.4) +
        1.4 * Math.sin(x * 0.31 - 1.1))
  );
}

/** 1 inside the waterfall notch, 0 out on the flanks (where the cliff can relax). */
function cliffNotch(x) {
  return 1 - smoothstep01((Math.abs(x) - 13) / 15);
}

/** Height of the plateau top — exactly CLIFF_TOP_Y at the falls, undulating away. */
function cliffTopY(x) {
  const amp = smoothstep01((Math.abs(x) - 13) / 60);
  if (amp <= 0) return CLIFF_TOP_Y;
  const n = fbm2(x * 0.011 + 5.1, 7.3, 3) - 0.5;
  return CLIFF_TOP_Y + amp * (n * 16 + 5.5 * Math.sin(x * 0.019 + 0.6));
}

/** Plunge pool bowl under the falls. */
export const PLUNGE_POOL = Object.freeze({ x: 0, z: -57, radius: 30, depth: 3.4 });

/** Flat water line downstream of the falls. */
export const RIVER_WATER_LEVEL = 0;
/** Nominal river width (matches the waterfall curtain width). */
export const RIVER_WIDTH = 22;
/** Half of RIVER_WIDTH. */
export const RIVER_HALF_WIDTH = RIVER_WIDTH * 0.5;
/** Base centreline of the river channel. */
export const RIVER_CENTER_X = 0;
/** Z of the main cross-section of the river reach (it passes the origin). */
export const RIVER_CENTER_Z = 0;
/** Water surface of the upper river reach on the plateau. */
export const UPSTREAM_RIVER_LEVEL = 33;

/** Cloud altitude band. */
const CLOUD_Y_MIN = 235;
const CLOUD_Y_MAX = 400;

/* ========================================================================== */
/*  Small math helpers                                                        */
/* ========================================================================== */

const TAU = Math.PI * 2;

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function smoothstep01(value) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Integer hash → [0, 1). Deterministic, no tables. */
function hash2i(ix, iz) {
  let h = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise on the integer lattice. */
function valueNoise2(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2i(ix, iz);
  const b = hash2i(ix + 1, iz);
  const c = hash2i(ix, iz + 1);
  const d = hash2i(ix + 1, iz + 1);

  return (a + (b - a) * ux) * (1 - uz) + (c + (d - c) * ux) * uz;
}

/** Fractal brownian motion → [0, 1]. */
function fbm2(x, z, octaves) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    sum += amp * valueNoise2(x * freq + i * 31.7, z * freq - i * 57.3);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

/** Ridged multifractal → [0, 1], sharp crests. */
function ridged2(x, z, octaves) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    const n = 1 - Math.abs(valueNoise2(x * freq + i * 17.3, z * freq + i * 41.9) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

/** Deterministic PRNG (mulberry-ish LCG) for placement. */
function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/* ========================================================================== */
/*  Terrain height field                                                      */
/* ========================================================================== */

/**
 * Meander of the river centreline. Pinned to x = 0 at the waterfall lip and
 * free to wander downstream, so the fall stays centred on the anchor.
 */
export function getRiverCenterX(z) {
  const envelope = smoothstep01((z - CLIFF_LIP_Z) / 90);
  const phase = z - CLIFF_LIP_Z;
  return envelope * (9.5 * Math.sin(phase * 0.0092) + 4.0 * Math.sin(phase * 0.0231 + 1.7));
}

/** Distance from (x, z) to the river centreline. */
export function getDistanceToRiver(x, z) {
  return Math.abs(x - getRiverCenterX(z));
}

/** Water surface height of the river at (x, z) — flat at 0 downstream. */
export function getRiverY(x, z) {
  return z < CLIFF_LIP_Z ? UPSTREAM_RIVER_LEVEL : RIVER_WATER_LEVEL;
}

/** True when (x, z) is inside the wet river channel (optionally with margin). */
export function isInRiver(x, z, margin = 0) {
  if (z <= CLIFF_LIP_Z) return false;
  return getDistanceToRiver(x, z) <= RIVER_HALF_WIDTH + margin;
}

/** True when (x, z) is inside the plunge pool basin. */
export function isInPlungePool(x, z, margin = 0) {
  const dx = x - PLUNGE_POOL.x;
  const dz = z - PLUNGE_POOL.z;
  return Math.hypot(dx, dz) <= PLUNGE_POOL.radius + margin;
}

/**
 * The height of the ground at (x, z).
 *
 * A single deterministic field composed of:
 *   1. a gentle valley floor,
 *   2. rolling hills that fade in away from the river corridor,
 *   3. long ridged hill crests higher up the flanks,
 *   4. distant mountain ridges around the horizon,
 *   5. a near-vertical headwall carrying the waterfall plateau,
 *   6. the plunge pool bowl, the river channel and the upper river reach.
 *
 * @param {number} x
 * @param {number} z
 * @returns {number} world Y (finite for every finite input)
 */
export function getTerrainHeight(x, z) {
  const px = Number.isFinite(x) ? x : 0;
  const pz = Number.isFinite(z) ? z : 0;

  const riverX = getRiverCenterX(pz);
  const dRiver = Math.abs(px - riverX);

  /* --- 1. valley floor --------------------------------------------------- */
  const broad = fbm2(px * 0.0042 + 3.7, pz * 0.0055 - 1.9, 4);
  const fine = fbm2(px * 0.019 - 8.3, pz * 0.021 + 4.4, 3);
  const floor = 1.35 + (broad - 0.5) * 2.6 + (fine - 0.5) * 0.9;

  /* --- 5. headwall plateau (computed first, it reshapes the base) -------- */
  const lipZ = cliffLipZ(px);
  const notch = cliffNotch(px);
  const dropRun = CLIFF_DROP_RUN + (1 - notch) * 7.5;
  let stepT = clamp01((pz - lipZ) / dropRun);
  if (notch < 0.985) {
    // terraced face: benches and ledges instead of one clean wall
    const terrace = Math.sin(stepT * Math.PI * 3.2 + 0.4) * 0.085 * (1 - notch);
    stepT = clamp01(stepT + terrace);
  }
  const plateau = 1 - smoothstep01(stepT);

  let h = floor * (1 - plateau) + plateau * CLIFF_TOP_Y;
  if (plateau > 0) h += plateau * (cliffTopY(px) - CLIFF_TOP_Y);

  /* --- 2. rolling hills -------------------------------------------------- */
  const hillMask = smoothstep01((dRiver - 24) / 120);
  if (hillMask > 0) {
    const rolls = fbm2(px * 0.0061 + 11.3, pz * 0.0052 - 7.7, 4);
    const crest = ridged2(px * 0.0029 - 4.1, pz * 0.0026 + 9.4, 4);
    h += hillMask * Math.max(0, rolls * 30 + crest * 38 - 4);
  }

  /* --- 3. long ridge crests on the flanks -------------------------------- */
  const ridgeMask = smoothstep01((dRiver - 150) / 240);
  if (ridgeMask > 0) {
    const crest2 = ridged2(px * 0.0017 + 17.9, pz * 0.0015 - 5.1, 4);
    const rolls2 = fbm2(px * 0.0034 - 2.2, pz * 0.0031 + 6.6, 3);
    h += ridgeMask * (crest2 * 52 + rolls2 * 18);
  }

  /* --- 4. distant mountain ridges ---------------------------------------- */
  const radial = Math.hypot(px, pz * 0.9);
  let mtn = smoothstep01((radial - 320) / 260);
  if (mtn > 0) {
    // Keep a corridor open along the valley axis so the horizon reads as a pass.
    const corridorOpen = 1 - smoothstep01((Math.abs(px) - 60) / 140);
    mtn *= 1 - 0.78 * corridorOpen;
    const n1 = ridged2(px * 0.003 + 7.7, pz * 0.0027 - 3.3, 5);
    const n2 = ridged2(px * 0.0011 - 5.5, pz * 0.001 + 2.2, 3);
    h += mtn * (n1 * 105 + n2 * 120 * mtn + 12);
  }

  /* --- plateau relief (flat at the lip so the anchor stays exact) -------- */
  if (plateau > 0) {
    const reliefFade = smoothstep01((lipZ - pz) / 55);
    if (reliefFade > 0) {
      const pn = (fbm2(px * 0.0031 + 21.1, pz * 0.0026 - 13.4, 4) - 0.42) * 15;
      const pr = ridged2(px * 0.0016 + 2.4, pz * 0.0015 - 8.8, 3) * 22;
      h += plateau * reliefFade * (pn + pr);
    }
  }

  /* --- 5b. talus apron at the foot of the headwall ----------------------- */
  if (notch < 0.92) {
    const apronStart = lipZ + dropRun;
    const apronDistance = pz - apronStart;
    if (apronDistance > -2 && apronDistance < 30) {
      const wedge = 1 - smoothstep01((apronDistance + 2) / 30);
      h += wedge * (1 - notch) * 8.0;
    }
  }

  /* --- 6a. plunge pool basin --------------------------------------------- */
  const pdx = px - PLUNGE_POOL.x;
  const pdz = pz - PLUNGE_POOL.z;
  const poolDist = Math.hypot(pdx, pdz);
  if (poolDist < PLUNGE_POOL.radius + 20) {
    const edgeFade = 1 - smoothstep01((poolDist - PLUNGE_POOL.radius) / 20);
    const frontOnly = smoothstep01((pz - CLIFF_LIP_Z) / 1.5);
    const weight = edgeFade * frontOnly;
    if (weight > 0) {
      const t = Math.min(poolDist / PLUNGE_POOL.radius, 1);
      const target = -PLUNGE_POOL.depth + PLUNGE_POOL.depth * t * t;
      h = h * (1 - weight) + Math.min(h, target) * weight;
    }
  }

  /* --- 6b. river channel downstream of the falls ------------------------- */
  const riverFade = smoothstep01((pz - lipZ - 5) / 9) * (1 - smoothstep01((pz - 260) / 140));
  if (riverFade > 0 && dRiver < 56) {
    const weight = riverFade * (1 - smoothstep01((dRiver - 29) / 22));
    if (weight > 0) {
      const t = Math.min(dRiver / RIVER_HALF_WIDTH, 1);
      const bed = RIVER_WATER_LEVEL - 3.4 + 3.4 * t * t;
      const bankT = clamp01((dRiver - RIVER_HALF_WIDTH) / 18);
      const bank = RIVER_WATER_LEVEL + 0.15 + 1.4 * smoothstep01(bankT);
      const target = dRiver <= RIVER_HALF_WIDTH ? bed : bank;
      h = h * (1 - weight) + Math.min(h, target) * weight;
    }
  }

  /* --- 6c. upper river reach on the plateau ------------------------------ */
  if (pz < CLIFF_LIP_Z + 2.5) {
    const upWeight = smoothstep01((CLIFF_LIP_Z + 6 - pz) / 8);
    if (upWeight > 0) {
      const dUp = Math.abs(px);
      if (dUp < 40) {
        const weight = upWeight * (1 - smoothstep01((dUp - 22) / 14));
        if (weight > 0) {
          const t = Math.min(dUp / 9, 1);
          const bed = UPSTREAM_RIVER_LEVEL - 1.15 + 1.15 * t * t;
          const bankT = clamp01((dUp - 9) / 20);
          const bank = UPSTREAM_RIVER_LEVEL + 0.4 + 1.6 * smoothstep01(bankT);
          const target = dUp <= 9 ? bed : bank;
          h = h * (1 - weight) + Math.min(h, target) * weight;
        }
      }
    }
  }

  return h;
}

const _normalEpsilon = 0.85;

/**
 * Surface normal at (x, z) from centred finite differences.
 * @param {number} x
 * @param {number} z
 * @param {THREE.Vector3} [target]
 * @returns {THREE.Vector3}
 */
export function getTerrainNormal(x, z, target = new THREE.Vector3()) {
  const e = _normalEpsilon;
  const hL = getTerrainHeight(x - e, z);
  const hR = getTerrainHeight(x + e, z);
  const hD = getTerrainHeight(x, z - e);
  const hU = getTerrainHeight(x, z + e);
  return target.set(hL - hR, 2 * e, hD - hU).normalize();
}

/** 0 on flat ground, 1 on a vertical wall. */
export function getTerrainSlope(x, z) {
  return 1 - getTerrainNormal(x, z, _slopeNormal).y;
}

const _slopeNormal = new THREE.Vector3();

/* ========================================================================== */
/*  Terrain colouring                                                         */
/* ========================================================================== */

const C_MEADOW_DARK = new THREE.Color(0x2b5426);
const C_MEADOW = new THREE.Color(0x4e8a3a);
const C_MEADOW_SUN = new THREE.Color(0x84ab4c);
const C_MOSS = new THREE.Color(0x6f8a46);
const C_HIGHLAND = new THREE.Color(0x8a9a68);
const C_ROCK = new THREE.Color(0x8a887d);
const C_ROCK_DARK = new THREE.Color(0x565b59);
const C_ROCK_LIGHT = new THREE.Color(0xc3bcac);
const C_SAND = new THREE.Color(0xbda985);
const C_PEBBLE = new THREE.Color(0x8d8a79);
const C_RIVERBED = new THREE.Color(0x4a5a4f);
const C_DRY_GRASS = new THREE.Color(0x9aa25e);
const C_AERIAL = new THREE.Color(0x9aabb4);

const _colorScratch = new THREE.Color();
const _colorScratch2 = new THREE.Color();

/**
 * Vertex colour for a point on the terrain.
 * Blends emerald meadow, sun-warmed highland moss, slate cliff faces on steep
 * slopes, sandy / pebble riverbanks and the darker river bed.
 */
function terrainColorAt(x, z, y, normal, out) {
  const dRiver = getDistanceToRiver(x, z);

  const patch = fbm2(x * 0.0075 - 1.7, z * 0.0081 + 3.2, 2);
  const mid = fbm2(x * 0.032 + 5.4, z * 0.029 - 8.1, 2);
  const grain = valueNoise2(x * 0.14 + 1.2, z * 0.15 - 4.6);

  /* meadow — deep hollows, mid emerald, sun-warmed patches */
  out.copy(C_MEADOW_DARK).lerp(C_MEADOW, smoothstep01((patch - 0.18) / 0.5));
  out.lerp(C_MEADOW_SUN, smoothstep01((mid - 0.42) / 0.4) * 0.5);
  out.lerp(C_MEADOW_DARK, smoothstep01((0.36 - patch) / 0.28) * 0.4);
  _colorScratch2.copy(C_DRY_GRASS);
  out.lerp(_colorScratch2, smoothstep01((mid - 0.6) / 0.32) * 0.34);
  const broadTint = fbm2(x * 0.0035 - 8.9, z * 0.0033 + 2.7, 2);
  out.lerp(C_MEADOW_SUN, smoothstep01((broadTint - 0.55) / 0.35) * 0.28);

  /* highland moss / alpine grass with altitude */
  out.lerp(C_MOSS, smoothstep01((y - 22) / 50) * 0.8);
  out.lerp(C_HIGHLAND, smoothstep01((y - 72) / 85) * 0.75);

  /* exposed rock on steep faces, banded strata */
  const slope = 1 - normal.y;
  const rock = smoothstep01((slope - 0.26) / 0.4);
  if (rock > 0) {
    const strata = 0.5 + 0.5 * Math.sin(y * 0.62 + valueNoise2(x * 0.035, z * 0.035) * 7.0);
    _colorScratch.copy(C_ROCK_DARK).lerp(C_ROCK, strata * 0.85);
    _colorScratch.lerp(C_ROCK_LIGHT, smoothstep01((mid - 0.42) / 0.5) * 0.7);
    _colorScratch.lerp(C_ROCK_DARK, smoothstep01((0.44 - mid) / 0.3) * 0.55);
    out.lerp(_colorScratch, rock);
  }

  /* shingle banks hugging the water — narrow strip, pebbly */
  const bankBand = 1 - smoothstep01((dRiver - 11.0) / 6.0);
  const lowBand = 1 - smoothstep01((y - 2.0) / 1.8);
  const bank = bankBand * lowBand;
  if (bank > 0) {
    _colorScratch.copy(C_SAND).lerp(C_PEBBLE, smoothstep01((grain - 0.4) / 0.45) * 0.75);
    out.lerp(_colorScratch, bank * 0.8);
  }

  /* rocky scree apron at the foot of the headwall */
  const wallFoot = cliffLipZ(x) + 34;
  if (z < wallFoot && z > CLIFF_LIP_Z - 4 && Math.abs(x) > 16) {
    const apron = (1 - smoothstep01((z - cliffLipZ(x) - 30) / 14)) * smoothstep01((Math.abs(x) - 16) / 22);
    if (apron > 0) {
      _colorScratch.copy(C_ROCK_DARK).lerp(C_ROCK_LIGHT, smoothstep01((grain - 0.35) / 0.5) * 0.8);
      out.lerp(_colorScratch, apron * 0.85);
    }
  }

  /* wet pebble bed below the water line */
  const submerged = smoothstep01((0.05 - y) / 0.8);
  if (submerged > 0) {
    _colorScratch.copy(C_RIVERBED).lerp(C_PEBBLE, smoothstep01((grain - 0.42) / 0.5) * 0.5);
    out.lerp(_colorScratch, submerged * 0.92);
  }

  /* aerial perspective on the far ridges */
  out.lerp(C_AERIAL, smoothstep01((y - 95) / 150) * 0.45);

  /* fine grain so large meadow faces never look like flat paint */
  const fine = 0.9 + valueNoise2(x * 0.42, z * 0.42) * 0.2;
  out.multiplyScalar(fine * (0.96 + grain * 0.08));

  return out;
}

/**
 * Procedural surface detail for the terrain material: two scales of value noise
 * perturb the normal (meadow grain, cliff rubble) and break up the albedo with
 * strata banding on steep faces.
 */
function applyTerrainDetail(material) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vTerrainWorldPos;\nvarying vec3 vTerrainNormal;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      vTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vTerrainNormal = normalize(mat3(modelMatrix) * objectNormal);`
    );

    shader.fragmentShader = `varying vec3 vTerrainWorldPos;\nvarying vec3 vTerrainNormal;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      float terrainHash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float terrainNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = terrainHash(i);
        float b = terrainHash(i + vec2(1.0, 0.0));
        float c = terrainHash(i + vec2(0.0, 1.0));
        float d = terrainHash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      {
        float steep = smoothstep(0.45, 0.85, 1.0 - abs(vTerrainNormal.y));
        float grainN = terrainNoise(vTerrainWorldPos.xz * 3.0);
        float midN = terrainNoise(vTerrainWorldPos.xz * 0.55);
        vec2 wallP = vec2(vTerrainWorldPos.x * 0.55 + vTerrainWorldPos.z * 0.32, vTerrainWorldPos.y);
        float rockN = terrainNoise(wallP * 1.15);
        float rockFine = terrainNoise(wallP * 4.1);
        float macro = terrainNoise(vec2(vTerrainWorldPos.x * 0.075 + vTerrainWorldPos.z * 0.05, vTerrainWorldPos.y * 0.15));
        float rockShade = (0.6 + 0.62 * rockN + 0.26 * rockFine) * (0.8 + 0.42 * macro);
        float beds = 0.5 + 0.5 * sin(vTerrainWorldPos.y * 1.15 + terrainNoise(vTerrainWorldPos.xz * 0.035) * 9.0);
        float bedShade = mix(0.88, 1.08, beds);
        diffuseColor.rgb *= mix(1.0, 0.86 + 0.3 * grainN + 0.14 * midN, 0.55);
        diffuseColor.rgb *= mix(1.0, rockShade, steep * 0.9);
        diffuseColor.rgb *= mix(1.0, bedShade, smoothstep(0.72, 0.96, steep) * 0.7);
      }`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
      {
        float detailFade = 1.0 - smoothstep(90.0, 380.0, length(vViewPosition));
        float flatness = smoothstep(0.35, 0.92, abs(normal.y));
        float e = 0.5;
        vec2 wp = vTerrainWorldPos.xz;
        vec2 p = vec2(wp.x * 0.94 - wp.y * 0.34, wp.x * 0.34 + wp.y * 0.94);
        float h0 = terrainNoise(p * 1.35);
        float hx = terrainNoise((p + vec2(e, 0.0)) * 1.35);
        float hz = terrainNoise((p + vec2(0.0, e)) * 1.35);
        vec2 grad = vec2(hx - h0, hz - h0) / e;
        normal = normalize(normal + vec3(-grad.x, 0.0, -grad.y) * detailFade * flatness * 0.16);
      }`
    );
  };
  material.customProgramCacheKey = () => 'terrain-detail';
  return material;
}

/* ========================================================================== */
/*  Procedural textures (DataTexture — works headless, no canvas needed)      */
/* ========================================================================== */

function createSoftSpriteTexture({ size = 96, seed = 7, blobs = 4, softness = 2.0, edge = 0.46, grain = true } = {}) {
  const data = new Uint8Array(size * size * 4);
  const rand = makeRandom(seed);
  const centers = [];
  for (let i = 0; i < blobs; i += 1) {
    centers.push({
      x: 0.5 + (rand() - 0.5) * 0.46,
      y: 0.5 + (rand() - 0.5) * 0.38,
      r: 0.09 + rand() * 0.17,
      w: 0.5 + rand() * 0.85,
    });
  }

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const u = (px + 0.5) / size;
      const v = (py + 0.5) / size;
      let a = 0;
      for (let i = 0; i < centers.length; i += 1) {
        const c = centers[i];
        const d = Math.hypot(u - c.x, v - c.y) / c.r;
        a += c.w * Math.exp(-d * d * softness);
      }
      // soft round mask so a puff never shows a quad edge
      const r = Math.hypot(u - 0.5, v - 0.5);
      a *= 1 - smoothstep01((r - edge) / (0.5 - edge));
      let density = clamp01(a);
      if (grain) {
        density *= 0.82 + valueNoise2(px * 0.22 + seed, py * 0.22) * 0.36;
      }
      density = clamp01(density);
      const alpha = Math.round(Math.pow(density, 0.9) * 255);
      const shade = Math.round(density * 255);
      const index = (py * size + px) * 4;
      data[index] = shade;
      data[index + 1] = shade;
      data[index + 2] = shade;
      data[index + 3] = alpha;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/* ========================================================================== */
/*  Sky dome                                                                  */
/* ========================================================================== */

const SKY_VERTEX_SHADER = /* glsl */ `
varying vec3 vWorldDirection;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldDirection = normalize(worldPosition.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const SKY_FRAGMENT_SHADER = /* glsl */ `
uniform vec3  uSunDirection;
uniform vec3  uSunColor;
uniform vec3  uZenithColor;
uniform vec3  uMidColor;
uniform vec3  uHorizonColor;
uniform vec3  uHazeColor;
uniform vec3  uGroundHaze;
uniform float uExposure;

varying vec3 vWorldDirection;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 dir = normalize(vWorldDirection);
  float h = dir.y;

  // ---- Rayleigh-ish vertical gradient: warm, dense horizon → deep zenith ----
  float up = clamp(h, 0.0, 1.0);
  vec3 color = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.32, up));
  color = mix(color, uZenithColor, smoothstep(0.18, 1.0, up));

  // ---- low warm haze band ------------------------------------------------
  color = mix(color, uHazeColor, exp(-abs(h) * 14.0) * 0.55);

  // ---- Mie scattering around the sun -------------------------------------
  float cosAngle = clamp(dot(dir, uSunDirection), -1.0, 1.0);
  float sunAngle = acos(cosAngle);
  float halo = exp(-sunAngle * 5.5);
  float wideHalo = exp(-sunAngle * 1.4);
  float lowSky = 1.0 - clamp(h, 0.0, 1.0);
  color += uSunColor * (halo * 0.45 + wideHalo * 0.14) * mix(0.35, 1.0, lowSky);

  // warm scattering toward the sun hugging the horizon
  vec2 flatDir = normalize(vec2(dir.x, dir.z) + 1e-5);
  vec2 flatSun = normalize(vec2(uSunDirection.x, uSunDirection.z) + 1e-5);
  float azimuth = max(dot(flatDir, flatSun), 0.0);
  color += uSunColor * exp(-abs(h) * 11.0) * pow(azimuth, 4.0) * 0.16;

  // ---- sun disc + corona -------------------------------------------------
  float disc = 1.0 - smoothstep(0.0034, 0.0056, sunAngle);
  float corona = exp(-sunAngle * 42.0);
  float glow = exp(-sunAngle * 11.0);
  color += uSunColor * (disc * 16.0 + corona * 2.1 + glow * 0.35);

  // ---- ground haze below the horizon -------------------------------------
  color = mix(color, uGroundHaze, smoothstep(0.0, -0.22, h));
  color = mix(color, uGroundHaze * 0.72, smoothstep(-0.3, -1.0, h));

  // ---- dither (kills 8-bit banding on big displays) ----------------------
  color += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(max(color, vec3(0.0)) * uExposure, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ========================================================================== */
/*  Sun glow + lens flare ghosts                                              */
/* ========================================================================== */

const GLOW_VERTEX_SHADER = /* glsl */ `
uniform float uSize;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 center = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 toCamera = normalize(cameraPosition - center);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
  vec3 up = normalize(cross(toCamera, right));
  vec3 world = center + right * (position.x * uSize) + up * (position.y * uSize);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

const GLOW_FRAGMENT_SHADER = /* glsl */ `
uniform vec3  uColor;
uniform float uIntensity;
uniform float uCore;
uniform float uStreak;

varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float core = exp(-r * r * 26.0 * uCore);
  float halo = exp(-r * 4.2) * 0.34;
  float streak = exp(-abs(p.y) * 22.0) * exp(-abs(p.x) * 2.0) * uStreak;
  float ring = exp(-abs(r - 0.36) * 70.0) * 0.06;
  float intensity = (core + halo + streak + ring) * uIntensity;
  if (intensity <= 0.001) discard;
  gl_FragColor = vec4(uColor * intensity, intensity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ========================================================================== */
/*  Drifting billboards (cloud puffs, valley mist)                            */
/* ========================================================================== */

const BILLBOARD_VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform vec2  uWind;
uniform float uSpread;
uniform float uFogDensity;

attribute vec3  aOffset;
attribute vec2  aScale;
attribute float aRot;
attribute float aPhase;
attribute float aSeed;

varying vec2  vUv;
varying float vFogMix;
varying float vDist;

void main() {
  vUv = uv;

  float drift = uTime * (0.5 + aSeed * 0.9);
  vec3 center = aOffset;
  center.x += drift * uWind.x;
  center.z += drift * uWind.y;
  center.y += sin(uTime * 0.06 + aPhase) * 2.0;

  // wrap the field around the camera so it never runs out
  center.x = mod(center.x - cameraPosition.x + uSpread, uSpread * 2.0) - uSpread + cameraPosition.x;
  center.z = mod(center.z - cameraPosition.z + uSpread, uSpread * 2.0) - uSpread + cameraPosition.z;

  vec3 toCamera = normalize(cameraPosition - center);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
  vec3 up = normalize(cross(toCamera, right));

  float c = cos(aRot);
  float s = sin(aRot);
  vec2 p = position.xy;
  vec2 rp = vec2(c * p.x - s * p.y, s * p.x + c * p.y);

  vec3 world = center + right * (rp.x * aScale.x) + up * (rp.y * aScale.y);
  vec4 mv = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;

  vDist = -mv.z;
  vFogMix = 1.0 - exp(-pow(vDist * uFogDensity, 2.0));
}
`;

const BILLBOARD_FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D uMap;
uniform vec3  uTopColor;
uniform vec3  uBottomColor;
uniform vec3  uSunColor;
uniform vec3  uFogColor;
uniform float uOpacity;
uniform float uSunWarmth;
uniform float uNearFade;

varying vec2  vUv;
varying float vFogMix;
varying float vDist;

void main() {
  vec4 tex = texture2D(uMap, vUv);
  float alpha = tex.a;
  if (alpha < 0.008) discard;

  float vertical = clamp(vUv.y, 0.0, 1.0);
  float density = tex.r;

  // sun rakes the tops, density drives the inner shading that gives puffs body
  float lit = smoothstep(0.02, 0.98, vertical * 0.72 + density * 0.42);
  vec3 color = mix(uBottomColor, uTopColor, lit);
  color = mix(color, uSunColor, smoothstep(0.55, 1.0, lit) * uSunWarmth);
  color = mix(color, uBottomColor * 0.82, smoothstep(0.55, 1.0, density) * (1.0 - vertical) * 0.4);

  float fade = smoothstep(uNearFade * 0.15, uNearFade, vDist) * (1.0 - vFogMix);
  gl_FragColor = vec4(mix(color, uFogColor, vFogMix), alpha * uOpacity * fade);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ========================================================================== */
/*  Geometry helpers                                                          */
/* ========================================================================== */

function paintGeometry(geometry, hex) {
  const color = new THREE.Color(hex);
  const count = geometry.getAttribute('position').count;
  const array = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    array[i * 3] = color.r;
    array[i * 3 + 1] = color.g;
    array[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(array, 3));
  return geometry;
}

/** Minimal merge for non-indexed geometries with position / normal / color. */
function mergeGeometries(geometries) {
  const parts = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (let i = 0; i < parts.length; i += 1) total += parts[i].getAttribute('position').count;

  const positions = new Float32Array(total * 3);
  const normals = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);

  let offset = 0;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const position = part.getAttribute('position');
    positions.set(position.array, offset * 3);
    const normal = part.getAttribute('normal');
    if (normal) normals.set(normal.array, offset * 3);
    const color = part.getAttribute('color');
    if (color) colors.set(color.array, offset * 3);
    offset += position.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  merged.computeBoundingSphere();
  return merged;
}

/** Store a 0 → 1 wind weight per vertex (0 at the base, 1 at the crown). */
function addSwayAttribute(geometry, height, power = 1.5) {
  const position = geometry.getAttribute('position');
  const sway = new Float32Array(position.count);
  for (let i = 0; i < position.count; i += 1) {
    sway[i] = Math.pow(clamp01(position.getY(i) / height), power);
  }
  geometry.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
  return geometry;
}

/* ========================================================================== */
/*  Terrain mesh                                                              */
/* ========================================================================== */

/** Non-uniform plane warp: ≈1 unit grid near the valley, ≈10 units at the rim. */
function warpAxis(value, half) {
  const s = clamp01((value / half + 1) * 0.5) * 2 - 1;
  return half * (0.25 * s + 0.75 * s * s * s);
}

function buildTerrainGeometry(size, segments) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  const half = size * 0.5;
  const count = position.count;

  for (let i = 0; i < count; i += 1) {
    const x = warpAxis(position.getX(i), half);
    const z = warpAxis(position.getZ(i), half);
    position.setX(i, x);
    position.setZ(i, z);
    position.setY(i, getTerrainHeight(x, z));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();

  const normal = geometry.attributes.normal;
  const colors = new Float32Array(count * 3);
  const scratchNormal = new THREE.Vector3();
  const scratchColor = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    scratchNormal.set(normal.getX(i), normal.getY(i), normal.getZ(i));
    terrainColorAt(position.getX(i), position.getZ(i), position.getY(i), scratchNormal, scratchColor);
    colors[i * 3] = scratchColor.r;
    colors[i * 3 + 1] = scratchColor.g;
    colors[i * 3 + 2] = scratchColor.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

/* ========================================================================== */
/*  Wind sway for MeshStandardMaterial (trees, grass)                         */
/* ========================================================================== */

function applyWindSway(material, shared, { strength = 0.18, speed = 1.15, key = 'wind' } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = shared.time;
    shader.uniforms.uWindStrength = shared.strength;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWindTime;
        uniform float uWindStrength;
        attribute float aSway;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          vec3 swayOrigin = vec3(0.0);
          #ifdef USE_INSTANCING
            swayOrigin = instanceMatrix[3].xyz;
          #endif
          float swayPhase = uWindTime * ${speed.toFixed(2)} + swayOrigin.x * 0.11 + swayOrigin.z * 0.09;
          float swayAmp = uWindStrength * aSway;
          transformed.x += (sin(swayPhase) + 0.45 * sin(swayPhase * 2.3 + 1.7)) * swayAmp;
          transformed.z += (cos(swayPhase * 0.83 + 2.1) + 0.3 * sin(swayPhase * 3.1)) * swayAmp * 0.7;
          transformed.y += sin(swayPhase * 1.7) * swayAmp * 0.12;
        }`
      );
  };
  material.customProgramCacheKey = () => `wind-${key}-${strength}`;
  material.userData.windStrength = strength;
  return material;
}

/* ========================================================================== */
/*  Vegetation geometry                                                       */
/* ========================================================================== */

function createPineGeometry() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.16, 0.36, 3.0, 5, 1);
  trunk.translate(0, 1.5, 0);
  parts.push(paintGeometry(trunk, 0x40332a));

  const layers = [
    { y: 1.9, r: 2.25, h: 3.8, color: 0x28502f },
    { y: 3.9, r: 1.82, h: 3.5, color: 0x2f5c34 },
    { y: 5.8, r: 1.36, h: 3.1, color: 0x37693a },
    { y: 7.5, r: 0.9, h: 2.7, color: 0x417a41 },
  ];
  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i];
    const cone = new THREE.ConeGeometry(layer.r, layer.h, 7, 1);
    cone.translate(0, layer.y + layer.h * 0.5, 0);
    parts.push(paintGeometry(cone, layer.color));
  }

  const merged = mergeGeometries(parts);
  for (let i = 0; i < parts.length; i += 1) parts[i].dispose();
  return addSwayAttribute(merged, 9.6, 1.7);
}

function createBroadleafGeometry() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.24, 0.46, 3.6, 5, 1);
  trunk.translate(0, 1.8, 0);
  parts.push(paintGeometry(trunk, 0x4b3a2b));

  const branchA = new THREE.CylinderGeometry(0.14, 0.22, 1.9, 4, 1);
  branchA.rotateZ(0.6);
  branchA.translate(0.55, 3.5, 0.1);
  parts.push(paintGeometry(branchA, 0x4b3a2b));

  const branchB = new THREE.CylinderGeometry(0.12, 0.2, 1.6, 4, 1);
  branchB.rotateZ(-0.7);
  branchB.rotateY(1.1);
  branchB.translate(-0.5, 3.7, -0.3);
  parts.push(paintGeometry(branchB, 0x4b3a2b));

  const canopy = [
    { x: 0.0, y: 5.4, z: 0.0, s: 2.5, color: 0x3d6a2f },
    { x: 1.25, y: 4.7, z: 0.35, s: 1.8, color: 0x477a34 },
    { x: -1.15, y: 4.9, z: -0.5, s: 1.7, color: 0x42712f },
    { x: 0.15, y: 6.6, z: -0.4, s: 1.55, color: 0x568c3a },
    { x: -0.35, y: 5.0, z: 1.2, s: 1.5, color: 0x4a8236 },
  ];
  for (let i = 0; i < canopy.length; i += 1) {
    const blob = canopy[i];
    const ico = new THREE.IcosahedronGeometry(blob.s, 0);
    ico.scale(1, 0.82, 1);
    ico.translate(blob.x, blob.y, blob.z);
    parts.push(paintGeometry(ico, blob.color));
  }

  const merged = mergeGeometries(parts);
  for (let i = 0; i < parts.length; i += 1) parts[i].dispose();
  return addSwayAttribute(merged, 8.2, 1.35);
}

function createGrassTuftGeometry({ blades = 6, height = 1.15 } = {}) {
  const positions = [];
  const normals = [];
  const colors = [];
  const sway = [];
  const indices = [];
  const baseColor = new THREE.Color(0x487429);
  const tipColor = new THREE.Color(0xc6de83);
  const rows = [
    { t: 0.0, w: 0.1, bend: 0.0 },
    { t: 0.45, w: 0.075, bend: 0.35 },
    { t: 1.0, w: 0.0, bend: 1.0 },
  ];

  for (let b = 0; b < blades; b += 1) {
    const angle = (b / blades) * TAU + 0.4;
    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);
    // perpendicular in the blade plane
    const perpX = -dirZ;
    const perpZ = dirX;
    const bendScale = 0.32 * height * (0.75 + 0.5 * ((b * 37) % 7) / 7);
    const base = positions.length / 3;

    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r];
      const y = height * row.t;
      const bend = bendScale * row.bend * row.bend;
      const cx = dirX * bend;
      const cz = dirZ * bend;
      const halfW = row.w;
      positions.push(cx + perpX * halfW, y, cz + perpZ * halfW);
      positions.push(cx - perpX * halfW, y, cz - perpZ * halfW);
      const nx = perpX * 0.3;
      const nz = perpZ * 0.3;
      const inv = 1 / Math.hypot(nx, 1, nz);
      normals.push(nx * inv, inv, nz * inv, nx * inv, inv, nz * inv);
      const mixed = baseColor.clone().lerp(tipColor, Math.pow(row.t, 0.7));
      colors.push(mixed.r, mixed.g, mixed.b, mixed.r, mixed.g, mixed.b);
      const w = Math.pow(row.t, 1.3);
      sway.push(w, w);
    }

    for (let r = 0; r < rows.length - 1; r += 1) {
      const a = base + r * 2;
      const bIdx = base + (r + 1) * 2;
      indices.push(a, bIdx, a + 1, a + 1, bIdx, bIdx + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function createFlowerGeometry({ blossom, height = 0.62 } = {}) {
  const positions = [];
  const colors = [];
  const sway = [];
  const indices = [];
  const stemColor = new THREE.Color(0x4b7a33);
  const blossomColor = new THREE.Color(blossom);

  const stems = 3;
  for (let s = 0; s < stems; s += 1) {
    const angle = (s / stems) * TAU + 0.9;
    const ox = Math.cos(angle) * 0.08;
    const oz = Math.sin(angle) * 0.08;
    const h = height * (0.75 + 0.28 * (((s * 13) % 5) / 5));

    // stem — a thin vertical ribbon
    const base = positions.length / 3;
    const w = 0.016;
    positions.push(ox - w, 0, oz, ox + w, 0, oz, ox + w * 0.7, h, oz, ox - w * 0.7, h, oz);
    for (let i = 0; i < 4; i += 1) colors.push(stemColor.r, stemColor.g, stemColor.b);
    sway.push(0, 0, 0.9, 0.9);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);

    // blossom — a small horizontal diamond facing the sky
    const b2 = positions.length / 3;
    const r = 0.055;
    positions.push(ox - r, h, oz, ox, h, oz - r, ox + r, h, oz, ox, h, oz + r);
    for (let i = 0; i < 4; i += 1) colors.push(blossomColor.r, blossomColor.g, blossomColor.b);
    sway.push(1, 1, 1, 1);
    indices.push(b2, b2 + 2, b2 + 1, b2, b2 + 3, b2 + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/* ========================================================================== */
/*  Rocks                                                                     */
/* ========================================================================== */

function createBoulderGeometry(seed) {
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const position = geometry.attributes.position;
  const rand = makeRandom(seed);
  for (let i = 0; i < position.count; i += 1) {
    const jitter = 0.76 + rand() * 0.5;
    position.setXYZ(i, position.getX(i) * jitter, position.getY(i) * jitter * 0.72, position.getZ(i) * jitter);
  }
  geometry.computeVertexNormals();
  const colors = new Float32Array(position.count * 3);
  const rock = new THREE.Color(0x7d7c72);
  const moss = new THREE.Color(0x5c7343);
  const scratch = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const up = clamp01(position.getY(i) * 0.8 + 0.5);
    scratch.copy(rock).lerp(moss, up * 0.55);
    colors[i * 3] = scratch.r;
    colors[i * 3 + 1] = scratch.g;
    colors[i * 3 + 2] = scratch.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/* ========================================================================== */
/*  Birds                                                                     */
/* ========================================================================== */

/**
 * Low-poly bird body pointing +Z (three.js "forward" for our heading maths):
 * fuselage, head, beak, fanned tail and a pale belly patch.
 */
function createBirdBodyGeometry(palette, length = 1) {
  const parts = [];

  const torso = new THREE.SphereGeometry(1, 12, 8);
  torso.scale(0.17 * length, 0.185 * length, 0.62 * length);
  parts.push(paintGeometry(torso, palette.body));

  const belly = new THREE.SphereGeometry(1, 10, 6);
  belly.scale(0.125 * length, 0.1 * length, 0.45 * length);
  belly.translate(0, -0.075 * length, 0.02 * length);
  parts.push(paintGeometry(belly, palette.belly));

  const head = new THREE.SphereGeometry(1, 10, 8);
  head.scale(0.13 * length, 0.125 * length, 0.145 * length);
  head.translate(0, 0.075 * length, 0.55 * length);
  parts.push(paintGeometry(head, palette.head));

  const beak = new THREE.ConeGeometry(0.038 * length, 0.24 * length, 5);
  beak.rotateX(Math.PI / 2);
  beak.translate(0, 0.045 * length, 0.7 * length);
  parts.push(paintGeometry(beak, palette.beak));

  const tail = new THREE.ConeGeometry(0.22 * length, 0.55 * length, 4);
  tail.rotateX(Math.PI / 2);
  tail.scale(1.25, 0.22, 1);
  tail.translate(0, 0.01, -0.72 * length);
  parts.push(paintGeometry(tail, palette.tail));

  const merged = mergeGeometries(parts);
  for (let i = 0; i < parts.length; i += 1) parts[i].dispose();
  return merged;
}

/**
 * One wing, pivot at the shoulder (origin), extending along ±X.
 * The leading edge points +Z (forward) and sweeps back towards the tip.
 */
function createWingGeometry({
  side = 1,
  span = 2.2,
  rootChord = 0.72,
  tipChord = 0.16,
  sweep = 0.42,
  dihedral = 0.06,
  stations = 9,
  rootColor = 0x4a3826,
  tipColor = 0x2f2418,
} = {}) {
  const positions = [];
  const colors = [];
  const indices = [];
  const root = new THREE.Color(rootColor);
  const tip = new THREE.Color(tipColor);

  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    const x = side * (0.11 + (span - 0.11) * Math.pow(t, 0.92));
    const chord = rootChord + (tipChord - rootChord) * Math.pow(t, 1.15);
    const leading = chord * 0.52 - sweep * Math.pow(t, 1.7);
    const trailing = -chord * 0.48 - sweep * 0.28 * t;
    const rise = dihedral * t + Math.pow(t, 2.1) * 0.16;

    for (let j = 0; j <= 2; j += 1) {
      const s = j / 2;
      const z = leading + (trailing - leading) * s;
      const camber = Math.sin(Math.PI * s) * 0.055 * (1 - 0.45 * t) + rise;
      positions.push(x, camber, z);
      const mixed = root.clone().lerp(tip, Math.pow(t, 0.75));
      colors.push(mixed.r, mixed.g, mixed.b);
    }
  }

  const rowSize = 3;
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const a = i * rowSize + j;
      const b = (i + 1) * rowSize + j;
      const c = (i + 1) * rowSize + j + 1;
      const d = i * rowSize + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

const BIRD_SPECIES = {
  hawk: {
    minAlt: 78,
    maxAlt: 158,
    radiusMin: 45,
    radiusMax: 135,
    speedMin: 0.09,
    speedMax: 0.17,
    scaleMin: 2.1,
    scaleMax: 3.1,
    bodyLength: 1,
    span: 2.3,
    flapRate: 1.15,
    flapAmp: 0.42,
    glideBias: 0.62,
    palette: { body: 0x4b3826, belly: 0xb8a382, head: 0x6b5236, beak: 0xd9b25c, tail: 0x3c2c1e },
    wing: { rootColor: 0x5a4229, tipColor: 0x2e2216 },
  },
  swallow: {
    minAlt: 38,
    maxAlt: 104,
    radiusMin: 32,
    radiusMax: 105,
    speedMin: 0.16,
    speedMax: 0.3,
    scaleMin: 1.15,
    scaleMax: 1.7,
    bodyLength: 0.62,
    span: 1.15,
    flapRate: 7.2,
    flapAmp: 0.62,
    glideBias: 0.16,
    palette: { body: 0x1f2738, belly: 0xd8d2c4, head: 0x2c3a53, beak: 0x2a2a2a, tail: 0x1a2130 },
    wing: { rootColor: 0x263149, tipColor: 0x151b28 },
  },
};

function createBirdFlock(cfg, random) {
  const flock = new THREE.Group();
  flock.name = 'birds';
  const states = [];
  const meshes = [];
  const materials = [];

  const kinds = [
    { kind: 'hawk', count: cfg.hawks },
    { kind: 'swallow', count: cfg.swallows },
  ];

  for (let k = 0; k < kinds.length; k += 1) {
    const { kind, count } = kinds[k];
    if (count <= 0) continue;
    const species = BIRD_SPECIES[kind];
    const startIndex = states.length;

    for (let i = 0; i < count; i += 1) {
      const cx = (random() - 0.5) * 360;
      const cz = -110 + random() * 400;
      const groundY = Math.max(getTerrainHeight(cx, cz), 0);
      const altitude = Math.max(
        groundY + 40 + random() * 55,
        species.minAlt + random() * (species.maxAlt - species.minAlt)
      );
      states.push({
        kind,
        cx,
        cz,
        altitude,
        radius: species.radiusMin + random() * (species.radiusMax - species.radiusMin),
        angularSpeed: (species.speedMin + random() * (species.speedMax - species.speedMin)) * (random() < 0.5 ? -1 : 1),
        startAngle: random() * TAU,
        phase: random() * TAU,
        bob: 4 + random() * 9,
        scale: species.scaleMin + random() * (species.scaleMax - species.scaleMin),
        flapPhase: random() * TAU,
        glidePhase: random() * TAU,
      });
    }

    const bodyGeometry = createBirdBodyGeometry(species.palette, species.bodyLength);
    const wingRight = createWingGeometry({
      side: 1,
      span: species.span,
      rootColor: species.wing.rootColor,
      tipColor: species.wing.tipColor,
    });
    const wingLeft = createWingGeometry({
      side: -1,
      span: species.span,
      rootColor: species.wing.rootColor,
      tipColor: species.wing.tipColor,
    });

    const bodyMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.78,
      metalness: 0,
      side: THREE.FrontSide,
    });
    const wingMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    materials.push(bodyMaterial, wingMaterial);

    const bodyMesh = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, count);
    const rightMesh = new THREE.InstancedMesh(wingRight, wingMaterial, count);
    const leftMesh = new THREE.InstancedMesh(wingLeft, wingMaterial, count);
    bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    rightMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    leftMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    bodyMesh.frustumCulled = false;
    rightMesh.frustumCulled = false;
    leftMesh.frustumCulled = false;
    bodyMesh.castShadow = false;
    rightMesh.castShadow = false;
    leftMesh.castShadow = false;

    flock.add(bodyMesh, rightMesh, leftMesh);
    meshes.push({ kind, startIndex, count, bodyMesh, rightMesh, leftMesh, species });
  }

  return { flock, states, meshes };
}

/* ========================================================================== */
/*  Configuration                                                             */
/* ========================================================================== */

const QUALITY_PRESETS = {
  high: {
    terrainSegments: 300,
    pines: 950,
    broadleaf: 480,
    grassTufts: 8200,
    flowers: 2100,
    boulders: 190,
    cloudPuffs: 240,
    mistBanks: 22,
    mistParticles: 900,
    shadowMapSize: 2048,
  },
  medium: {
    terrainSegments: 240,
    pines: 720,
    broadleaf: 360,
    grassTufts: 5200,
    flowers: 1400,
    boulders: 140,
    cloudPuffs: 170,
    mistBanks: 16,
    mistParticles: 600,
    shadowMapSize: 1024,
  },
  low: {
    terrainSegments: 180,
    pines: 430,
    broadleaf: 220,
    grassTufts: 2600,
    flowers: 700,
    boulders: 90,
    cloudPuffs: 100,
    mistBanks: 16,
    mistParticles: 350,
    shadowMapSize: 512,
  },
};

const SKY_RADIUS = 3000;

const DEFAULTS = {
  quality: 'high',
  seed: 20261117,
  addLights: true,
  manageFog: true,
  gradeLights: true,
  shadows: true,
  terrainShadows: false,
  distantRidges: true,
  camera: null,

  terrainSegments: null,
  pines: null,
  broadleaf: null,
  grassTufts: null,
  flowers: null,
  boulders: null,
  cloudPuffs: null,
  mistBanks: null,
  mistParticles: null,
  hawks: 9,
  swallows: 11,
  shadowMapSize: null,
  shadowExtent: 165,
  treeRadius: 520,
  meadowRadius: 270,

  sunColor: 0xfff0d2,
  sunIntensity: 2.75,
  hemiSkyColor: 0xbcdcf4,
  hemiGroundColor: 0x4a5f34,
  hemiIntensity: 1.95,
  fillColor: 0xbcd8f8,
  fillIntensity: 1.35,

  zenithColor: 0x27549c,
  midColor: 0x83b0d8,
  horizonColor: 0xffcf92,
  hazeColor: 0xffe2b8,
  groundHazeColor: 0xc8d2bd,
  skyExposure: 1.0,

  fogColorLow: 0xdcd8c3,
  fogColorHigh: 0xcfdae2,
  fogDensityLow: 0.0013,
  fogDensityHigh: 0.00075,

  cloudOpacity: 0.92,
  cloudTopColor: 0xfff4e0,
  cloudBottomColor: 0x8fa3bd,
  cloudSunColor: 0xffd7a2,
  cloudSpread: 1250,
  cloudSunWarmth: 0.7,

  mistOpacity: 0.13,
  mistTopColor: 0xf4f6ee,
  mistBottomColor: 0xd8e0d2,
  mistSpread: 520,
  mistSunWarmth: 0.18,

  windStrength: 1.0,
};

function resolveConfig(options) {
  const qualityKey = QUALITY_PRESETS[options.quality] ? options.quality : DEFAULTS.quality;
  const preset = QUALITY_PRESETS[qualityKey];
  const cfg = { ...DEFAULTS, quality: qualityKey };

  const numericKeys = [
    'seed', 'hawks', 'swallows', 'shadowExtent', 'treeRadius', 'meadowRadius',
    'sunIntensity', 'hemiIntensity', 'fillIntensity', 'skyExposure',
    'fogDensityLow', 'fogDensityHigh', 'cloudOpacity', 'cloudSpread', 'cloudSunWarmth',
    'mistOpacity', 'mistSpread', 'mistSunWarmth', 'windStrength',
  ];
  for (let i = 0; i < numericKeys.length; i += 1) {
    const key = numericKeys[i];
    if (typeof options[key] === 'number' && Number.isFinite(options[key])) cfg[key] = options[key];
  }

  const colourKeys = [
    'sunColor', 'hemiSkyColor', 'hemiGroundColor', 'fillColor',
    'zenithColor', 'midColor', 'horizonColor', 'hazeColor', 'groundHazeColor',
    'fogColorLow', 'fogColorHigh', 'cloudTopColor', 'cloudBottomColor', 'cloudSunColor',
    'mistTopColor', 'mistBottomColor',
  ];
  for (let i = 0; i < colourKeys.length; i += 1) {
    const key = colourKeys[i];
    if (options[key] !== undefined && options[key] !== null) cfg[key] = options[key];
  }

  const booleanKeys = ['addLights', 'manageFog', 'gradeLights', 'shadows', 'terrainShadows', 'distantRidges'];
  for (let i = 0; i < booleanKeys.length; i += 1) {
    const key = booleanKeys[i];
    if (typeof options[key] === 'boolean') cfg[key] = options[key];
  }

  cfg.camera = options.camera || null;

  cfg.terrainSegments = clampInt(options.terrainSegments, preset.terrainSegments, 48, 512);
  cfg.pines = clampInt(options.pines, preset.pines, 0, 6000);
  cfg.broadleaf = clampInt(options.broadleaf, preset.broadleaf, 0, 4000);
  cfg.grassTufts = clampInt(options.grassTufts, preset.grassTufts, 0, 40000);
  cfg.flowers = clampInt(options.flowers, preset.flowers, 0, 20000);
  cfg.boulders = clampInt(options.boulders, preset.boulders, 0, 3000);
  cfg.cloudPuffs = clampInt(options.cloudPuffs, preset.cloudPuffs, 0, 900);
  cfg.mistBanks = clampInt(options.mistBanks, preset.mistBanks, 0, 300);
  cfg.mistParticles = clampInt(options.mistParticles, preset.mistParticles, 0, 6000);
  cfg.shadowMapSize = clampInt(options.shadowMapSize, preset.shadowMapSize, 256, 4096);

  return cfg;
}

function clampInt(value, fallback, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.round(Math.min(Math.max(value, min), max));
}

/* ========================================================================== */
/*  Environment grading                                                       */
/* ========================================================================== */

const _fogLow = new THREE.Color(DEFAULTS.fogColorLow);
const _fogHigh = new THREE.Color(DEFAULTS.fogColorHigh);

const _environment = {
  sunDirection: SUN_DIRECTION,
  sunColor: new THREE.Color(DEFAULTS.sunColor),
  hemiSkyColor: new THREE.Color(DEFAULTS.hemiSkyColor),
  hemiGroundColor: new THREE.Color(DEFAULTS.hemiGroundColor),
  fogColor: new THREE.Color(DEFAULTS.fogColorLow),
  fogDensity: DEFAULTS.fogDensityLow,
  sunIntensity: DEFAULTS.sunIntensity,
  hemiIntensity: DEFAULTS.hemiIntensity,
  fillIntensity: DEFAULTS.fillIntensity,
  altitudeFactor: 0,
  mistFactor: 0,
  exposure: 1,
  sunVisibility: 1,
};

/**
 * Lighting / atmosphere state for a camera position. Returns a shared object
 * (pass values on, don't keep the reference across frames).
 *
 * @param {THREE.Vector3|{x:number,y:number,z:number}} [cameraPos]
 */
export function getEnvironmentState(cameraPos) {
  const y = cameraPos && Number.isFinite(cameraPos.y) ? cameraPos.y : 40;
  const altitude = clamp01((y - 2) / 150);
  const mist = 1 - clamp01((y - 1) / 90);

  _environment.altitudeFactor = altitude;
  _environment.mistFactor = mist;
  _environment.fogColor.copy(_fogLow).lerp(_fogHigh, smoothstep01(altitude * 1.15));
  _environment.fogDensity = lerp(DEFAULTS.fogDensityLow, DEFAULTS.fogDensityHigh, smoothstep01(altitude * 1.1));
  _environment.sunIntensity = DEFAULTS.sunIntensity;
  _environment.hemiIntensity = DEFAULTS.hemiIntensity * (0.94 + altitude * 0.1);
  _environment.fillIntensity = DEFAULTS.fillIntensity;
  return _environment;
}


/**
 * A faint ring of far mountain silhouettes beyond the terrain plane, so wide
 * shots never see the flat edge of the world. Fog turns it into misty ridges.
 */
function createDistantRidgeRing(seed) {
  const segments = 168;
  const radii = [590, 1150, 1950];
  const positions = [];
  const colors = [];
  const indices = [];
  const cInner = new THREE.Color(0x7f9080);
  const cMid = new THREE.Color(0x8fa2ab);
  const cOuter = new THREE.Color(0xa9bcc6);

  const heights = [[], []];
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * TAU;
    const nx = Math.cos(a);
    const nz = Math.sin(a);
    heights[0].push(30 + ridged2(nx * 2.6 + 5.1, nz * 2.6 - 2.4, 4) * 165);
    heights[1].push(60 + ridged2(nx * 1.35 - 3.2, nz * 1.35 + 7.7, 3) * 290);
  }

  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * TAU;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const ringHeights = [0, heights[0][i], heights[1][i]];
    const ringColors = [cInner, cMid, cOuter];
    for (let k = 0; k < 3; k += 1) {
      positions.push(cos * radii[k], k === 0 ? -2 : ringHeights[k], sin * radii[k]);
      const color = ringColors[k];
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let i = 0; i < segments; i += 1) {
    for (let k = 0; k < 2; k += 1) {
      const a = i * 3 + k;
      const b = i * 3 + k + 1;
      const c = (i + 1) * 3 + k;
      const d = (i + 1) * 3 + k + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    fog: true,
    depthWrite: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'distantRidges';
  return mesh;
}

/* ========================================================================== */
/*  Billboard field helper                                                    */
/* ========================================================================== */

function createBillboardGeometry(items) {
  const base = new THREE.PlaneGeometry(1, 1, 1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(base.index.clone());
  geometry.setAttribute('position', base.getAttribute('position').clone());
  geometry.setAttribute('uv', base.getAttribute('uv').clone());

  const count = items.length;
  const offsets = new Float32Array(count * 3);
  const scales = new Float32Array(count * 2);
  const rotations = new Float32Array(count);
  const phases = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const item = items[i];
    offsets[i * 3] = item.x;
    offsets[i * 3 + 1] = item.y;
    offsets[i * 3 + 2] = item.z;
    scales[i * 2] = item.width;
    scales[i * 2 + 1] = item.height;
    rotations[i] = item.rotation;
    phases[i] = item.phase;
    seeds[i] = item.seed;
  }

  geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 2));
  geometry.setAttribute('aRot', new THREE.InstancedBufferAttribute(rotations, 1));
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.instanceCount = count;
  geometry.computeBoundingSphere();
  base.dispose();
  return geometry;
}

/* ========================================================================== */
/*  Main factory                                                              */
/* ========================================================================== */

/**
 * Build the sky, clouds, sun, birds, hills, forest, meadow and valley mist.
 *
 * @param {THREE.Scene} scene
 * @param {object} [options]
 * @returns {object} world handle
 */
export function createSkyAndTerrain(scene, options = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new Error('createSkyAndTerrain(scene, options): a THREE.Scene is required.');
  }

  const cfg = resolveConfig(options);
  const random = makeRandom(cfg.seed);
  const group = new THREE.Group();
  group.name = 'skyAndTerrain';

  const textures = [];
  const windUniforms = {
    time: { value: 0 },
    strength: { value: cfg.windStrength },
  };

  const previousFog = scene.fog || null;
  let ownFog = null;

  /* ---------------------------------------------------------------- lights */

  const sunLight = new THREE.DirectionalLight(cfg.sunColor, cfg.sunIntensity);
  sunLight.name = 'sunLight';
  sunLight.castShadow = cfg.shadows;
  sunLight.shadow.mapSize.set(cfg.shadowMapSize, cfg.shadowMapSize);
  sunLight.shadow.camera.left = -cfg.shadowExtent;
  sunLight.shadow.camera.right = cfg.shadowExtent;
  sunLight.shadow.camera.top = cfg.shadowExtent;
  sunLight.shadow.camera.bottom = -cfg.shadowExtent;
  sunLight.shadow.camera.near = 20;
  sunLight.shadow.camera.far = 1400;
  sunLight.shadow.bias = -0.0016;
  sunLight.shadow.normalBias = 2.4;
  sunLight.shadow.camera.updateProjectionMatrix();

  const sunTarget = new THREE.Object3D();
  sunTarget.name = 'sunTarget';
  sunTarget.position.set(0, 0, 0);
  sunLight.target = sunTarget;

  const hemiLight = new THREE.HemisphereLight(cfg.hemiSkyColor, cfg.hemiGroundColor, cfg.hemiIntensity);
  hemiLight.name = 'hemisphereLight';

  const fillLight = new THREE.DirectionalLight(cfg.fillColor, cfg.fillIntensity);
  fillLight.name = 'fillLight';
  fillLight.position.set(-0.62, 0.46, 0.64).normalize().multiplyScalar(420);

  const lights = { sun: sunLight, hemisphere: hemiLight, fill: fillLight, target: sunTarget };
  if (cfg.addLights) group.add(sunLight, sunTarget, hemiLight, fillLight);

  /* ------------------------------------------------------------------- sky */

  const skyUniforms = {
    uSunDirection: { value: SUN_DIRECTION.clone() },
    uSunColor: { value: new THREE.Color(0xfff2d6) },
    uZenithColor: { value: new THREE.Color(cfg.zenithColor) },
    uMidColor: { value: new THREE.Color(cfg.midColor) },
    uHorizonColor: { value: new THREE.Color(cfg.horizonColor) },
    uHazeColor: { value: new THREE.Color(cfg.hazeColor) },
    uGroundHaze: { value: new THREE.Color(cfg.groundHazeColor) },
    uExposure: { value: cfg.skyExposure },
  };

  const skyGeometry = new THREE.SphereGeometry(SKY_RADIUS, 48, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: SKY_VERTEX_SHADER,
    fragmentShader: SKY_FRAGMENT_SHADER,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.name = 'skyDome';
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  group.add(sky);

  /* -------------------------------------------------------- sun glow & flare */

  const glowUniforms = {
    uSize: { value: 560 },
    uColor: { value: new THREE.Color(0xfff1cf) },
    uIntensity: { value: 0.75 },
    uCore: { value: 1.8 },
    uStreak: { value: 0.55 },
  };
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 1, 1),
    new THREE.ShaderMaterial({
      uniforms: glowUniforms,
      vertexShader: GLOW_VERTEX_SHADER,
      fragmentShader: GLOW_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  glow.name = 'sunGlow';
  glow.frustumCulled = false;
  glow.renderOrder = -900;
  group.add(glow);

  const GHOST_SPECS = [
    { offset: 0.0, size: 0.05, color: 0xfff7e0, intensity: 0.55, core: 1.4, streak: 0.65 },
    { offset: 0.3, size: 0.075, color: 0xffcf8a, intensity: 0.22, core: 1.0, streak: 0.25 },
    { offset: 0.55, size: 0.13, color: 0xbfe0ff, intensity: 0.14, core: 0.8, streak: 0.1 },
    { offset: 0.8, size: 0.09, color: 0xffb9a2, intensity: 0.1, core: 0.9, streak: 0.35 },
    { offset: -0.32, size: 0.11, color: 0xa9ffd9, intensity: 0.08, core: 0.7, streak: 0.1 },
  ];

  const ghosts = [];
  for (let i = 0; i < GHOST_SPECS.length; i += 1) {
    const spec = GHOST_SPECS[i];
    const uniforms = {
      uSize: { value: 0.1 },
      uColor: { value: new THREE.Color(spec.color) },
      uIntensity: { value: 0 },
      uCore: { value: spec.core },
      uStreak: { value: spec.streak },
    };
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 1, 1),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: GLOW_VERTEX_SHADER,
        fragmentShader: GLOW_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    mesh.name = `sunFlareGhost${i}`;
    mesh.frustumCulled = false;
    mesh.renderOrder = 999;
    mesh.visible = false;
    group.add(mesh);
    ghosts.push({ mesh, uniforms, spec });
  }

  /* ---------------------------------------------------------------- clouds */

  const puffTexture = createSoftSpriteTexture({ size: 160, seed: cfg.seed + 11, blobs: 15, softness: 3.1, edge: 0.44 });
  textures.push(puffTexture);

  const cloudItems = [];
  const cloudClusters = Math.max(2, Math.round(cfg.cloudPuffs / 12));
  const puffsPerCluster = Math.max(1, Math.round(cfg.cloudPuffs / cloudClusters));
  for (let c = 0; c < cloudClusters; c += 1) {
    const cx = (random() - 0.5) * 2000;
    const cz = (random() - 0.5) * 2000;
    const cy = CLOUD_Y_MIN + random() * (CLOUD_Y_MAX - CLOUD_Y_MIN);
    const spreadX = 70 + random() * 120;
    const spreadZ = 60 + random() * 110;
    for (let p = 0; p < puffsPerCluster; p += 1) {
      if (cloudItems.length >= cfg.cloudPuffs) break;
      const width = 120 + random() * 160;
      cloudItems.push({
        x: cx + (random() - 0.5) * spreadX * 2,
        y: cy + (random() - 0.5) * 45,
        z: cz + (random() - 0.5) * spreadZ * 2,
        width,
        height: width * (0.5 + random() * 0.3),
        rotation: (random() - 0.5) * 0.5,
        phase: random() * TAU,
        seed: random(),
      });
    }
  }

  const cloudGeometry = createBillboardGeometry(cloudItems.length ? cloudItems : [{ x: 0, y: 300, z: 0, width: 1, height: 1, rotation: 0, phase: 0, seed: 0 }]);
  const cloudUniforms = {
    uTime: { value: 0 },
    uWind: { value: new THREE.Vector2(0.9, 0.42) },
    uSpread: { value: cfg.cloudSpread },
    uMap: { value: puffTexture },
    uTopColor: { value: new THREE.Color(cfg.cloudTopColor) },
    uBottomColor: { value: new THREE.Color(cfg.cloudBottomColor) },
    uSunColor: { value: new THREE.Color(cfg.cloudSunColor) },
    uFogColor: { value: new THREE.Color(cfg.fogColorLow) },
    uFogDensity: { value: cfg.fogDensityLow },
    uOpacity: { value: cfg.cloudOpacity },
    uSunWarmth: { value: cfg.cloudSunWarmth },
    uNearFade: { value: 260 },
  };
  const clouds = new THREE.Mesh(
    cloudGeometry,
    new THREE.ShaderMaterial({
      uniforms: cloudUniforms,
      vertexShader: BILLBOARD_VERTEX_SHADER,
      fragmentShader: BILLBOARD_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  clouds.name = 'cloudPuffs';
  clouds.frustumCulled = false;
  clouds.renderOrder = -10;
  group.add(clouds);

  /* ------------------------------------------------------------ valley mist */

  const mistTexture = createSoftSpriteTexture({ size: 128, seed: cfg.seed + 23, blobs: 6, softness: 1.7, edge: 0.42, grain: false });
  textures.push(mistTexture);

  const mistItems = [];
  for (let i = 0; i < cfg.mistBanks; i += 1) {
    const along = -95 + random() * 430;
    const across = getRiverCenterX(along) + (random() - 0.5) * 170;
    const width = 230 + random() * 220;
    mistItems.push({
      x: across,
      y: 1.4 + random() * 5,
      z: along,
      width,
      height: 22 + random() * 22,
      rotation: (random() - 0.5) * 0.35,
      phase: random() * TAU,
      seed: random(),
    });
  }

  const mistGeometry = createBillboardGeometry(mistItems.length ? mistItems : [{ x: 0, y: 4, z: 0, width: 1, height: 1, rotation: 0, phase: 0, seed: 0 }]);
  const mistUniforms = {
    uTime: { value: 0 },
    uWind: { value: new THREE.Vector2(0.45, 0.28) },
    uSpread: { value: cfg.mistSpread },
    uMap: { value: mistTexture },
    uTopColor: { value: new THREE.Color(cfg.mistTopColor) },
    uBottomColor: { value: new THREE.Color(cfg.mistBottomColor) },
    uSunColor: { value: new THREE.Color(cfg.cloudSunColor) },
    uFogColor: { value: new THREE.Color(cfg.fogColorLow) },
    uFogDensity: { value: cfg.fogDensityLow },
    uOpacity: { value: cfg.mistOpacity },
    uSunWarmth: { value: cfg.mistSunWarmth },
    uNearFade: { value: 210 },
  };
  const mistBanks = new THREE.Mesh(
    mistGeometry,
    new THREE.ShaderMaterial({
      uniforms: mistUniforms,
      vertexShader: BILLBOARD_VERTEX_SHADER,
      fragmentShader: BILLBOARD_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mistBanks.name = 'mistBanks';
  mistBanks.frustumCulled = false;
  mistBanks.renderOrder = 5;
  group.add(mistBanks);

  /* ------------------------------------------------------- mist particles */

  const mistParticles = (() => {
    const count = cfg.mistParticles;
    if (count <= 0) return null;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const radius = Math.sqrt(random()) * 430;
      const angle = random() * TAU;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const ground = getTerrainHeight(x, z);
      positions[i * 3] = x;
      positions[i * 3 + 1] = Math.max(ground, RIVER_WATER_LEVEL) + 0.8 + random() * 9;
      positions[i * 3 + 2] = z;
      phases[i] = random() * TAU;
      scales[i] = 2.5 + random() * 7;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xf1f4ea) },
      uOpacity: { value: 0.16 },
      uMap: { value: mistTexture },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aPhase;
        attribute float aScale;
        varying float vAlpha;

        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.06 + aPhase) * 5.0;
          p.z += cos(uTime * 0.045 + aPhase * 1.7) * 4.0;
          p.y += sin(uTime * 0.12 + aPhase * 2.3) * 1.8;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = max(-mv.z, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aScale * 260.0 / dist;
          vAlpha = smoothstep(4.0, 45.0, dist) * (1.0 - smoothstep(320.0, 520.0, dist));
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform sampler2D uMap;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          float alpha = tex.a * uOpacity * vAlpha;
          if (alpha < 0.004) discard;
          gl_FragColor = vec4(uColor, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'mistParticles';
    points.frustumCulled = false;
    points.renderOrder = 6;
    group.add(points);
    return points;
  })();

  /* ---------------------------------------------------------------- terrain */

  const terrainGeometry = buildTerrainGeometry(TERRAIN_SIZE, cfg.terrainSegments);
  const terrainMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    dithering: true,
  });
  applyTerrainDetail(terrainMaterial);
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.name = 'terrain';
  terrain.receiveShadow = cfg.shadows;
  terrain.castShadow = cfg.terrainShadows;
  group.add(terrain);

  /* far haze floor fills the void beyond the plane so the horizon never gaps */
  const farGeometry = new THREE.CircleGeometry(2800, 64);
  farGeometry.rotateX(-Math.PI / 2);
  const farMaterial = new THREE.MeshBasicMaterial({ color: 0xb9c1a8, fog: true, depthWrite: true });
  const farGround = new THREE.Mesh(farGeometry, farMaterial);
  farGround.name = 'hazeFloor';
  farGround.position.y = -9;
  group.add(farGround);

  if (cfg.distantRidges) {
    group.add(createDistantRidgeRing(cfg.seed));
  }

  /* ----------------------------------------------------------------- forest */

  const upAxis = new THREE.Vector3(0, 1, 0);
  const dummy = new THREE.Object3D();
  const tiltQuat = new THREE.Quaternion();
  const targetUp = new THREE.Vector3();
  const sampleNormal = new THREE.Vector3();

  const pineMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
    flatShading: true,
  });
  applyWindSway(pineMaterial, windUniforms, { strength: 0.09, speed: 0.95, key: 'pine' });

  const leafMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });
  applyWindSway(leafMaterial, windUniforms, { strength: 0.12, speed: 1.1, key: 'leaf' });

  const pineItems = [];
  const leafItems = [];

  (() => {
    const step = 12.5;
    const limit = cfg.treeRadius;
    for (let gz = -limit; gz <= limit; gz += step) {
      for (let gx = -limit; gx <= limit; gx += step) {
        if (pineItems.length >= cfg.pines && leafItems.length >= cfg.broadleaf) return;

        const x = gx + (random() - 0.5) * step;
        const z = gz + (random() - 0.5) * step;

        // keep the waterfall, the plunge pool and the river mouth clear
        if (Math.abs(x) < 30 && z > -110 && z < -30) continue;

        const y = getTerrainHeight(x, z);
        if (y < 1.5) continue;
        const dRiver = getDistanceToRiver(x, z);
        if (dRiver < 24) continue;
        if (isInPlungePool(x, z, 6)) continue;

        getTerrainNormal(x, z, sampleNormal);
        if (sampleNormal.y < 0.58) continue;

        const forest = fbm2(x * 0.0055 + 4.4, z * 0.0051 - 6.2, 3);
        const threshold = 0.4 - 0.1 * smoothstep01((y - 6) / 60);
        const clearing = fbm2(x * 0.0016 - 12.3, z * 0.0014 + 8.8, 2);
        if (clearing < 0.33) continue;
        if (forest < threshold) {
          // solitary meadow trees, thinning out towards the fields
          if (dRiver < 45 || random() > 0.07) continue;
        }

        const pineChance =
          0.26 +
          0.5 * smoothstep01((y - 8) / 55) +
          0.35 * smoothstep01((0.88 - sampleNormal.y) / 0.3);
        const isPine = random() < pineChance;
        const list = isPine ? pineItems : leafItems;
        if (list.length >= (isPine ? cfg.pines : cfg.broadleaf)) continue;

        const shade = 0.82 + random() * 0.36;
        list.push({
          x,
          y,
          z,
          nx: sampleNormal.x,
          ny: sampleNormal.y,
          nz: sampleNormal.z,
          rotation: random() * TAU,
          scale: (isPine ? 0.72 : 0.68) + random() * (isPine ? 0.85 : 0.62),
          tint: new THREE.Color(
            shade * (0.92 + random() * 0.14),
            shade * (0.96 + random() * 0.08),
            shade * (0.88 + random() * 0.16)
          ),
        });
      }
    }
  })();

  function fillInstances(mesh, items) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      targetUp.set(item.nx, item.ny, item.nz).lerp(upAxis, 0.62).normalize();
      tiltQuat.setFromUnitVectors(upAxis, targetUp);
      dummy.position.set(item.x, item.y - 0.3, item.z);
      dummy.quaternion.setFromAxisAngle(upAxis, item.rotation);
      dummy.quaternion.premultiply(tiltQuat);
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, item.tint);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (typeof mesh.computeBoundingSphere === 'function') mesh.computeBoundingSphere();
  }

  let pineMesh = null;
  if (pineItems.length > 0) {
    const geometry = createPineGeometry();
    pineMesh = new THREE.InstancedMesh(geometry, pineMaterial, pineItems.length);
    pineMesh.name = 'pineTrees';
    pineMesh.castShadow = cfg.shadows;
    pineMesh.receiveShadow = cfg.shadows;
    fillInstances(pineMesh, pineItems);
    group.add(pineMesh);
  }

  let leafMesh = null;
  if (leafItems.length > 0) {
    const geometry = createBroadleafGeometry();
    leafMesh = new THREE.InstancedMesh(geometry, leafMaterial, leafItems.length);
    leafMesh.name = 'broadleafTrees';
    leafMesh.castShadow = cfg.shadows;
    leafMesh.receiveShadow = cfg.shadows;
    fillInstances(leafMesh, leafItems);
    group.add(leafMesh);
  }

  /* --------------------------------------------------------- meadow & rocks */

  const grassMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  applyWindSway(grassMaterial, windUniforms, { strength: 0.17, speed: 1.75, key: 'grass' });

  function scatter(count, radius, accept) {
    const out = [];
    if (count <= 0) return out;
    let attempts = 0;
    const maxAttempts = count * 24;
    while (out.length < count && attempts < maxAttempts) {
      attempts += 1;
      const r = Math.sqrt(random()) * radius;
      const angle = random() * TAU;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const item = accept(x, z);
      if (item) out.push(item);
    }
    return out;
  }

  const grassItems = scatter(cfg.grassTufts, cfg.meadowRadius, (x, z) => {
    const y = getTerrainHeight(x, z);
    if (y < 0.7 || y > 62) return null;
    if (getDistanceToRiver(x, z) < 12.5) return null;
    if (isInPlungePool(x, z, 3)) return null;
    getTerrainNormal(x, z, sampleNormal);
    if (sampleNormal.y < 0.76) return null;
    const shade = 0.8 + random() * 0.45;
    return {
      x,
      y,
      z,
      nx: sampleNormal.x,
      ny: sampleNormal.y,
      nz: sampleNormal.z,
      rotation: random() * TAU,
      scale: 0.7 + random() * 0.7,
      tint: new THREE.Color(shade * (0.86 + random() * 0.2), shade, shade * (0.8 + random() * 0.2)),
    };
  });

  let grassMesh = null;
  if (grassItems.length > 0) {
    const geometry = createGrassTuftGeometry({ blades: 6, height: 1.15 });
    grassMesh = new THREE.InstancedMesh(geometry, grassMaterial, grassItems.length);
    grassMesh.name = 'meadowGrass';
    grassMesh.castShadow = false;
    grassMesh.receiveShadow = cfg.shadows;
    fillInstances(grassMesh, grassItems);
    group.add(grassMesh);
  }

  const flowerPalettes = [
    { color: 0xf7f2e2, share: 0.3 },
    { color: 0xf3c948, share: 0.34 },
    { color: 0xc39ae2, share: 0.2 },
    { color: 0xefa3b8, share: 0.16 },
  ];
  const flowerMaterials = [];
  const flowerMeshes = [];
  for (let p = 0; p < flowerPalettes.length; p += 1) {
    const palette = flowerPalettes[p];
    const count = Math.round(cfg.flowers * palette.share);
    const items = scatter(count, cfg.meadowRadius * 0.8, (x, z) => {
      const y = getTerrainHeight(x, z);
      if (y < 0.9 || y > 40) return null;
      if (getDistanceToRiver(x, z) < 14) return null;
      if (isInPlungePool(x, z, 3)) return null;
      getTerrainNormal(x, z, sampleNormal);
      if (sampleNormal.y < 0.82) return null;
      const shade = 0.85 + random() * 0.3;
      return {
        x,
        y,
        z,
        nx: sampleNormal.x,
        ny: sampleNormal.y,
        nz: sampleNormal.z,
        rotation: random() * TAU,
        scale: 0.95 + random() * 0.7,
        tint: new THREE.Color(shade, shade, shade),
      };
    });
    if (items.length === 0) continue;
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    applyWindSway(material, windUniforms, { strength: 0.16, speed: 2.1, key: `flower-${p}` });
    const geometry = createFlowerGeometry({ blossom: palette.color, height: 0.58 + p * 0.04 });
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
    mesh.name = `wildflowers${p}`;
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    fillInstances(mesh, items);
    flowerMaterials.push(material);
    flowerMeshes.push(mesh);
    group.add(mesh);
  }

  const rockMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0,
    flatShading: true,
  });
  const rockItems = scatter(cfg.boulders, 470, (x, z) => {
    const y = getTerrainHeight(x, z);
    if (y < 0.4) return null;
    if (getDistanceToRiver(x, z) < 12) return null;
    getTerrainNormal(x, z, sampleNormal);
    if (sampleNormal.y < 0.5) return null;
    const nearWater = getDistanceToRiver(x, z) < 42 ? 0.55 : 0.18;
    if (random() > nearWater + smoothstep01((0.9 - sampleNormal.y) / 0.4) * 0.35) return null;
    const shade = 0.8 + random() * 0.4;
    return {
      x,
      y,
      z,
      nx: sampleNormal.x,
      ny: sampleNormal.y,
      nz: sampleNormal.z,
      rotation: random() * TAU,
      scale: 0.55 + Math.pow(random(), 2) * 2.6,
      tint: new THREE.Color(shade, shade * (0.98 + random() * 0.04), shade * 0.96),
    };
  });

  // pebbles along the river channel — reads as a stream bed once water is added
  const pebbleCount = Math.round(cfg.boulders * 1.4);
  for (let i = 0; i < pebbleCount; i += 1) {
    const along = -55 + random() * 300;
    const across = getRiverCenterX(along) + (random() - 0.5) * 46;
    const y = getTerrainHeight(across, along);
    if (y > 1.6) continue;
    const shade = 0.72 + random() * 0.5;
    rockItems.push({
      x: across,
      y,
      z: along,
      nx: 0,
      ny: 1,
      nz: 0,
      rotation: random() * TAU,
      scale: 0.16 + Math.pow(random(), 1.6) * 0.55,
      tint: new THREE.Color(shade * 1.02, shade, shade * 0.94),
    });
  }

  // scree and fallen blocks along the foot of the headwall
  const screeCount = Math.round(cfg.boulders * 0.6);
  for (let i = 0; i < screeCount; i += 1) {
    const x = (random() - 0.5) * 460;
    if (Math.abs(x) < 18) continue;
    const z = cliffLipZ(x) + 2 + random() * 40;
    const y = getTerrainHeight(x, z);
    if (y < 0.1) continue;
    getTerrainNormal(x, z, sampleNormal);
    const shade = 0.78 + random() * 0.42;
    rockItems.push({
      x,
      y,
      z,
      nx: sampleNormal.x,
      ny: sampleNormal.y,
      nz: sampleNormal.z,
      rotation: random() * TAU,
      scale: 0.45 + Math.pow(random(), 1.7) * 2.1,
      tint: new THREE.Color(shade, shade * 0.99, shade * 0.95),
    });
  }

  const rockMeshes = [];
  if (rockItems.length > 0) {
    const half = Math.ceil(rockItems.length / 2);
    const chunks = [rockItems.slice(0, half), rockItems.slice(half)];
    const geometries = [createBoulderGeometry(cfg.seed + 5), createBoulderGeometry(cfg.seed + 91)];
    for (let i = 0; i < chunks.length; i += 1) {
      if (chunks[i].length === 0) continue;
      const mesh = new THREE.InstancedMesh(geometries[i], rockMaterial, chunks[i].length);
      mesh.name = `boulders${i}`;
      mesh.castShadow = cfg.shadows;
      mesh.receiveShadow = cfg.shadows;
      fillInstances(mesh, chunks[i]);
      rockMeshes.push(mesh);
      group.add(mesh);
    }
  }

  /* ------------------------------------------------------------------ birds */

  const { flock, states: birdStates, meshes: birdMeshes } = createBirdFlock(cfg, random);
  group.add(flock);

  const _birdA = new THREE.Vector3();
  const _birdB = new THREE.Vector3();
  const _birdDir = new THREE.Vector3();
  const _birdQuat = new THREE.Quaternion();
  const _birdEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const _birdMatrix = new THREE.Matrix4();
  const _wingMatrix = new THREE.Matrix4();
  const _wingRotation = new THREE.Matrix4();
  const _birdScale = new THREE.Vector3(1, 1, 1);

  function birdPoint(state, time, out) {
    const angle = state.startAngle + time * state.angularSpeed;
    const wobble = 1 + 0.13 * Math.sin(angle * 2.1 + state.phase);
    const radius = state.radius * wobble;
    out.set(
      state.cx + Math.cos(angle) * radius,
      state.altitude +
        Math.sin(angle * 1.35 + state.phase) * state.bob +
        Math.sin(time * 0.17 + state.phase * 3.1) * 3.5,
      state.cz + Math.sin(angle) * radius
    );
    return out;
  }

  function updateBirds(time) {
    for (let m = 0; m < birdMeshes.length; m += 1) {
      const entry = birdMeshes[m];
      const species = entry.species;
      const isHawk = entry.kind === 'hawk';

      for (let i = 0; i < entry.count; i += 1) {
        const state = birdStates[entry.startIndex + i];

        birdPoint(state, time, _birdA);
        birdPoint(state, time + 0.05, _birdB);
        _birdDir.subVectors(_birdB, _birdA);
        if (_birdDir.lengthSq() < 1e-8) {
          _birdDir.set(0, 0, 1);
        } else {
          _birdDir.normalize();
        }

        const yaw = Math.atan2(_birdDir.x, _birdDir.z);
        const pitch = -Math.asin(Math.max(-1, Math.min(1, _birdDir.y)));
        const roll = Math.max(-0.85, Math.min(0.85, -state.angularSpeed * 2.6));

        _birdEuler.set(pitch, yaw, roll);
        _birdQuat.setFromEuler(_birdEuler);
        _birdScale.setScalar(state.scale);
        _birdMatrix.compose(_birdA, _birdQuat, _birdScale);
        entry.bodyMesh.setMatrixAt(i, _birdMatrix);

        const flapWave = Math.sin(time * species.flapRate + state.flapPhase);
        let flap;
        if (isHawk) {
          const gate = smoothstep01((Math.sin(time * 0.27 + state.glidePhase) - 0.05) / 0.6);
          flap = 0.1 + flapWave * species.flapAmp * (0.25 + 0.75 * gate);
        } else {
          const gate = 0.5 + 0.5 * smoothstep01((Math.sin(time * 0.38 + state.glidePhase) + 0.5) / 1.1);
          flap = 0.04 + flapWave * species.flapAmp * gate;
        }

        _wingRotation.makeRotationZ(flap);
        _wingMatrix.makeTranslation(0.06, 0.02, 0);
        _wingMatrix.multiply(_wingRotation);
        _wingMatrix.premultiply(_birdMatrix);
        entry.rightMesh.setMatrixAt(i, _wingMatrix);

        _wingRotation.makeRotationZ(-flap);
        _wingMatrix.makeTranslation(-0.06, 0.02, 0);
        _wingMatrix.multiply(_wingRotation);
        _wingMatrix.premultiply(_birdMatrix);
        entry.leftMesh.setMatrixAt(i, _wingMatrix);
      }

      entry.bodyMesh.instanceMatrix.needsUpdate = true;
      entry.rightMesh.instanceMatrix.needsUpdate = true;
      entry.leftMesh.instanceMatrix.needsUpdate = true;
    }
  }

  /* ------------------------------------------------------------ atmosphere */

  let createdFog = false;
  if (cfg.manageFog) {
    if (scene.fog && scene.fog.isFogExp2) {
      ownFog = scene.fog;
    } else {
      ownFog = new THREE.FogExp2(cfg.fogColorLow, cfg.fogDensityLow);
      scene.fog = ownFog;
      createdFog = true;
    }
  }

  /* --------------------------------------------------------- camera & flare */

  let activeCamera = cfg.camera || null;

  function setCamera(camera) {
    activeCamera = camera && typeof camera.isCamera === 'boolean' ? camera : null;
  }

  const _cam = new THREE.Vector3(0, 48, 150);
  const _ghostPos = new THREE.Vector3();
  const _sunNdc = new THREE.Vector3();
  const _camQuat = new THREE.Quaternion();
  const _right = new THREE.Vector3();
  const _up = new THREE.Vector3();
  const _forward = new THREE.Vector3();
  const shadowFocus = new THREE.Vector3(0, 0, 0);
  const shadowGoal = new THREE.Vector3(0, 0, 0);

  function sunOcclusion(camPos) {
    for (let i = 1; i <= 9; i += 1) {
      const distance = i * 55;
      const sx = camPos.x + SUN_DIRECTION.x * distance;
      const sy = camPos.y + SUN_DIRECTION.y * distance;
      const sz = camPos.z + SUN_DIRECTION.z * distance;
      if (sy < getTerrainHeight(sx, sz) - 1.5) return 0;
    }
    return 1;
  }

  function updateFlare() {
    const camera = activeCamera;
    if (!camera || typeof camera.isCamera !== 'boolean') {
      for (let i = 0; i < ghosts.length; i += 1) ghosts[i].mesh.visible = false;
      return 0;
    }

    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

    const tanHalf = Math.tan(THREE.MathUtils.degToRad((camera.fov || 60) * 0.5));
    const aspect = camera.aspect || 1;

    camera.getWorldQuaternion(_camQuat);
    _right.set(1, 0, 0).applyQuaternion(_camQuat);
    _up.set(0, 1, 0).applyQuaternion(_camQuat);
    _forward.set(0, 0, -1).applyQuaternion(_camQuat);

    _sunNdc.copy(_cam).addScaledVector(SUN_DIRECTION, 1500).project(camera);
    const facing = _forward.dot(SUN_DIRECTION);
    let visible = 0;
    if (facing > 0.02) {
      const edge = Math.max(Math.abs(_sunNdc.x), Math.abs(_sunNdc.y));
      visible = 1 - smoothstep01((edge - 0.72) / 0.6);
    }

    for (let i = 0; i < ghosts.length; i += 1) {
      const ghost = ghosts[i];
      const scale = 1 - ghost.spec.offset;
      _ghostPos
        .copy(_cam)
        .addScaledVector(_right, _sunNdc.x * scale * tanHalf * aspect)
        .addScaledVector(_up, _sunNdc.y * scale * tanHalf)
        .addScaledVector(_forward, 1);
      ghost.mesh.position.copy(_ghostPos);
      ghost.uniforms.uSize.value = ghost.spec.size * 2 * tanHalf;
      ghost.uniforms.uIntensity.value = ghost.spec.intensity * visible;
      ghost.mesh.visible = visible > 0.015;
    }
    return visible;
  }

  /* ------------------------------------------------------------------ update */

  function update(elapsed = 0, delta = 0.016, cameraPos = null) {
    const time = Number.isFinite(elapsed) ? elapsed : 0;
    let dt = Number.isFinite(delta) ? delta : 0.016;
    if (dt < 0) dt = 0;
    if (dt > 0.1) dt = 0.1;

    let hasCameraPos = false;
    if (cameraPos &&
      Number.isFinite(cameraPos.x) &&
      Number.isFinite(cameraPos.y) &&
      Number.isFinite(cameraPos.z)) {
      _cam.set(cameraPos.x, cameraPos.y, cameraPos.z);
      hasCameraPos = true;
    }

    const env = getEnvironmentState(_cam);

    windUniforms.time.value = time;
    cloudUniforms.uTime.value = time;
    mistUniforms.uTime.value = time;
    if (mistParticles) mistParticles.material.uniforms.uTime.value = time;

    /* sky dome and sun glow follow the camera */
    const farPlane = activeCamera && Number.isFinite(activeCamera.far) ? activeCamera.far : 4200;
    const skyScale = Math.max(0.55, (farPlane * 0.8) / SKY_RADIUS);
    sky.scale.setScalar(skyScale);
    sky.position.copy(_cam);

    const sunVisibility = sunOcclusion(_cam) * (hasCameraPos ? 1 : 1);
    const glowDistance = Math.min(2600, SKY_RADIUS * skyScale * 0.85);
    glow.position.copy(_cam).addScaledVector(SUN_DIRECTION, glowDistance);
    glow.scale.setScalar(1);
    glowUniforms.uIntensity.value = 0.35 + 0.65 * sunVisibility;
    glowUniforms.uSize.value = 520;

    const flareVisibility = updateFlare();

    /* fog + haze grading */
    if (ownFog) {
      ownFog.color.copy(env.fogColor);
      ownFog.density = env.fogDensity;
    }
    cloudUniforms.uFogColor.value.copy(env.fogColor);
    cloudUniforms.uFogDensity.value = env.fogDensity;
    mistUniforms.uFogColor.value.copy(env.fogColor);
    mistUniforms.uFogDensity.value = env.fogDensity;
    farMaterial.color.copy(env.fogColor);

    /* lights */
    if (cfg.addLights && cfg.gradeLights) {
      sunLight.intensity = env.sunIntensity * (0.74 + 0.26 * sunVisibility);
      hemiLight.intensity = env.hemiIntensity;
      fillLight.intensity = env.fillIntensity;
    }

    if (cfg.addLights) {
      if (hasCameraPos) shadowGoal.set(_cam.x, 0, _cam.z);
      else shadowGoal.set(0, 0, 0);
      const smoothing = 1 - Math.exp(-dt * 3.5);
      shadowFocus.lerp(shadowGoal, smoothing);
      const texel = (cfg.shadowExtent * 2) / cfg.shadowMapSize;
      const fx = Math.round(shadowFocus.x / texel) * texel;
      const fz = Math.round(shadowFocus.z / texel) * texel;
      sunLight.position.set(
        fx + SUN_DIRECTION.x * 420,
        SUN_DIRECTION.y * 420,
        fz + SUN_DIRECTION.z * 420
      );
      sunTarget.position.set(fx, 0, fz);
      sunTarget.updateMatrixWorld();
    }

    updateBirds(time);
  }

  /* ----------------------------------------------------------------- dispose */

  function dispose() {
    if (group.parent) group.parent.remove(group);
    group.traverse((object) => {
      if (object.geometry && typeof object.geometry.dispose === 'function') {
        object.geometry.dispose();
      }
      const material = object.material;
      if (!material) return;
      const list = Array.isArray(material) ? material : [material];
      for (let i = 0; i < list.length; i += 1) {
        if (list[i] && typeof list[i].dispose === 'function') list[i].dispose();
      }
    });
    for (let i = 0; i < textures.length; i += 1) textures[i].dispose();
    if (createdFog && scene.fog === ownFog) scene.fog = previousFog;
    activeCamera = null;
  }

  scene.add(group);

  const stats = {
    pineTrees: pineItems.length,
    broadleafTrees: leafItems.length,
    grassTufts: grassItems.length,
    wildflowers: flowerMeshes.reduce((sum, mesh) => sum + mesh.count, 0),
    boulders: rockItems.length,
    cloudPuffs: cloudItems.length,
    mistBanks: mistItems.length,
    mistParticles: mistParticles ? mistParticles.geometry.getAttribute('position').count : 0,
    birds: birdStates.length,
    terrainVertices: terrainGeometry.getAttribute('position').count,
    terrainTriangles: terrainGeometry.index ? terrainGeometry.index.count / 3 : 0,
    shadowMapSize: cfg.shadowMapSize,
  };

  return {
    group,
    lights,
    terrain,
    sky,
    glow,
    clouds,
    mistBanks,
    mistParticles,
    birds: flock,
    birdStates,
    trees: {
      pines: pineMesh,
      broadleaf: leafMesh,
      grass: grassMesh,
      flowers: flowerMeshes,
      boulders: rockMeshes,
    },
    stats,
    config: cfg,
    sunDirection: SUN_DIRECTION,
    update,
    dispose,
    setCamera,
    getCamera: () => activeCamera,
    getTerrainHeight,
    getTerrainNormal,
    getTerrainSlope,
    getRiverCenterX,
    getDistanceToRiver,
    getRiverY,
    isInRiver,
    isInPlungePool,
    getEnvironmentState,
  };
}

export default createSkyAndTerrain;
