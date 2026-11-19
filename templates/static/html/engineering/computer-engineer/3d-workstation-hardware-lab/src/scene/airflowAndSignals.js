/**
 * airflowAndSignals.js
 * ============================================================================
 * Volumetric airflow, PCB signal traffic, AI data-flow and coolant overlays for
 * the Computer Engineering portfolio hardware rig.
 *
 * The module is built around the world contract of `hardwareRig.js`:
 *   1 unit = 1 cm, +X right, +Y up, +Z toward the default camera, the
 *   motherboard plane near z = 0 and the air intake at the chassis front
 *   (+Z).  Default anchors and bounds are the rig's own, so the overlay drops
 *   into `scene` next to `createHardwareRig()` without extra setup.  Pass
 *   `options.anchors` / `options.bounds` for any other layout.
 *
 * What it adds to the rig
 *   - 5,200 GPU-resident airflow particles on curved intake-to-exhaust
 *     streamlines (front intake -> CPU tower fins -> GPU shroud -> rear / top
 *     exhaust), colour graded inside the vertex shader from cyan-blue at the
 *     intake through emerald and amber over the heatsinks to coral at the
 *     exhaust.  `setThermalLoad()` drives speed, turbulence and heat.
 *   - Faint streamline filaments under the particles so the flow stays legible
 *     between them.
 *   - Glowing PCB bus ribbons (CPU <-> RAM, CPU <-> GPU PCIe x16, CPU <-> M.2)
 *     with animated light packets, stretching with the exploded view.
 *   - An AI inference overlay: packets race RAM -> CPU -> PCIe x16 -> GPU ->
 *     the tensor matrix, and a multi-layer 3D neural lattice pulses with
 *     `setAiLoad()`.
 *   - An optional closed coolant loop (radiator -> blocks -> pump -> radiator)
 *     with flowing particles, and support for animating particles along the
 *     rig's own tube path via `options.coolantPath`.
 *   - Wireframe telemetry micro-nodes that hover around each subsystem.
 *
 * Everything is procedural.  The only texture is a tiny float atlas baked on
 * the CPU from the streamlines; there are no image, model or audio assets.
 *
 * ----------------------------------------------------------------------------
 * Usage
 * ----------------------------------------------------------------------------
 *   const flow = createAirflowAndSignals(scene, {
 *     anchors: rig.anchors,          // optional: defaults already match
 *     bounds: { min: [-27, -30.5, -13], max: [27, 30.5, 23] },
 *     particleCount: 5200,
 *     showLiquidLoop: false,         // the rig models its own loop
 *     showAiLattice: false           // the rig has its own tensor matrix
 *   });
 *
 *   flow.setThermalLoad(0.7);
 *   flow.setAiLoad(0.9);
 *   flow.setExplode(scrollExplode);
 *   flow.update(elapsed, delta, camera.position);
 *
 * Layers can be switched independently with `showAirflow`, `showSignals`,
 * `showAiFlow`, `showAiLattice`, `showLiquidLoop` and `showTelemetry`.
 * When `options.anchors` includes `tensorMatrix`, the AI lattice defaults to
 * off because the rig already builds one there; set `showAiLattice: true` to
 * add this module's multi-layer lattice on top.  When `options.anchors`
 * includes `liquidCooler`, the separate coolant loop
 * defaults to off because `hardwareRig.js` already models a physical loop with
 * flowing coolant shaders; pass `showLiquidLoop: true` to add this overlay's
 * coolant particles as well (or supply `options.coolantPath` to follow the
 * rig's own tubes).
 * ============================================================================
 */

import * as THREE from 'three';

/* ========================================================================== */
/*  Palette                                                                   */
/* ========================================================================== */

/** Thermal gradient used by the airflow shader, intake to exhaust. */
export const AIRFLOW_PALETTE = Object.freeze({
  intake: '#38bdf8', // cool cyan-blue at the front intake
  warming: '#34d399', // emerald across the cold side of the heatsinks
  hot: '#f59e0b', // amber over the CPU / GPU fin stacks
  exhaust: '#fb7185', // warm coral at the rear / top exhaust
  signal: '#38bdf8',
  signalPulse: '#dff6ff',
  ai: '#a78bfa',
  aiPulse: '#f0abfc',
  coolantCold: '#22d3ee',
  coolantWarm: '#fb923c'
});

/**
 * Default local-space anchors.  These mirror `COMPONENT_ANCHORS` from
 * `hardwareRig.js` plus the M.2 slot and reservoir positions used by this
 * overlay.  Values are in centimeters.
 */
export const AIRFLOW_ANCHORS = Object.freeze({
  overview: Object.freeze([0, 0.5, 4]),
  chassis: Object.freeze([0, 0, 0]),
  motherboard: Object.freeze([0, 0, 0.8]),
  cpu: Object.freeze([-5.6, 5.4, 1.6]),
  cooler: Object.freeze([-5.6, 6.4, 7.0]),
  gpu: Object.freeze([-4.0, -9.7, 7.4]),
  ram: Object.freeze([6.0, 5.2, 3.4]),
  nvme: Object.freeze([11.2, -9.4, 0.4]),
  psu: Object.freeze([0.0, -25.0, 3.0]),
  radiator: Object.freeze([0.0, 26.4, 0.0]),
  reservoir: Object.freeze([21.0, 8.0, 7.0]),
  liquidCooler: Object.freeze([14.0, -17.5, 6.0]),
  tensorMatrix: Object.freeze([-4.0, -3.2, 4.6])
});

/** Default chassis bounds, matching `CHASSIS` in hardwareRig.js. */
export const AIRFLOW_BOUNDS = Object.freeze({
  min: Object.freeze([-27, -30.5, -13]),
  max: Object.freeze([27, 30.5, 23])
});

const TAU = Math.PI * 2;

/* ========================================================================== */
/*  Small numeric helpers                                                     */
/* ========================================================================== */

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function finiteOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readNumber(value, fallback) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toVector3(value, fallback) {
  if (value && typeof value === 'object') {
    if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
      return new THREE.Vector3(value.x, value.y, value.z);
    }
    if (Array.isArray(value) && value.length >= 3) {
      return new THREE.Vector3(
        readNumber(value[0], 0),
        readNumber(value[1], 0),
        readNumber(value[2], 0)
      );
    }
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

/** Deterministic xorshift RNG so the layout is identical on every reload. */
function createRandom(seed) {
  let state = (readNumber(seed, 0x9e3779b9) >>> 0) || 0x1a2b3c4d;
  return function random() {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

/* ========================================================================== */
/*  Layout resolution                                                         */
/* ========================================================================== */

const ANCHOR_ALIASES = Object.freeze({
  rig: 'overview',
  studio: 'overview',
  board: 'motherboard',
  mobo: 'motherboard',
  mainboard: 'motherboard',
  processor: 'cpu',
  socket: 'cpu',
  heatsink: 'cooler',
  aircooler: 'cooler',
  air: 'cooler',
  graphics: 'gpu',
  graphicscard: 'gpu',
  card: 'gpu',
  memory: 'ram',
  dimm: 'ram',
  water: 'liquidCooler',
  watercooler: 'liquidCooler',
  aio: 'liquidCooler',
  loop: 'liquidCooler',
  rad: 'radiator',
  tensor: 'tensorMatrix',
  matrix: 'tensorMatrix',
  tank: 'reservoir',
  pump: 'reservoir',
  nvmeSlot: 'nvme',
  ssd: 'nvme',
  power: 'psu'
});

function resolveLayout(options) {
  const scale = readNumber(options.scale, 1) > 0 ? readNumber(options.scale, 1) : 1;
  const anchors = {};

  for (const key of Object.keys(AIRFLOW_ANCHORS)) {
    const fallback = AIRFLOW_ANCHORS[key];
    const source = options.anchors ? options.anchors[key] : undefined;
    anchors[key] = toVector3(source, fallback).multiplyScalar(scale);
  }

  // Forgiving aliases for integrator-supplied anchor tables.
  if (options.anchors) {
    for (const [alias, canonical] of Object.entries(ANCHOR_ALIASES)) {
      if (options.anchors[alias] !== undefined && options.anchors[canonical] === undefined) {
        anchors[canonical] = toVector3(options.anchors[alias], AIRFLOW_ANCHORS[canonical]).multiplyScalar(scale);
      }
    }
  }

  const base = anchors.chassis;
  let bounds;

  if (options.bounds) {
    const b = options.bounds;
    if (Array.isArray(b.min) && Array.isArray(b.max)) {
      bounds = new THREE.Box3(
        new THREE.Vector3(b.min[0], b.min[1], b.min[2]).multiplyScalar(scale),
        new THREE.Vector3(b.max[0], b.max[1], b.max[2]).multiplyScalar(scale)
      );
    } else if (b.min && b.max && typeof b.min.x === 'number') {
      bounds = new THREE.Box3(
        new THREE.Vector3(b.min.x, b.min.y, b.min.z).multiplyScalar(scale),
        new THREE.Vector3(b.max.x, b.max.y, b.max.z).multiplyScalar(scale)
      );
    } else if (typeof b.xMin === 'number') {
      bounds = new THREE.Box3(
        new THREE.Vector3(b.xMin, b.yMin, b.zMin).multiplyScalar(scale),
        new THREE.Vector3(b.xMax, b.yMax, b.zMax).multiplyScalar(scale)
      );
    }
  }

  if (!bounds) {
    const min = AIRFLOW_BOUNDS.min;
    const max = AIRFLOW_BOUNDS.max;
    bounds = new THREE.Box3(
      new THREE.Vector3(base.x + (min[0] - 0) * scale, base.y + min[1] * scale, base.z + min[2] * scale),
      new THREE.Vector3(base.x + max[0] * scale, base.y + max[1] * scale, base.z + max[2] * scale)
    );
  }

  const size = bounds.getSize(new THREE.Vector3());
  const unit = Math.max(0.001, size.y / 61); // 1 at rig scale, scales all sizes

  return { anchors, bounds, scale, unit, size };
}

/* ========================================================================== */
/*  Lane atlas: CPU-baked sampled streamlines the vertex shader can walk.     */
/* ========================================================================== */

function sampleCurve(points, { closed = false, tension = 0.5, samples = 64 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', clamp(tension, 0, 1));
  const sampled = curve.getSpacedPoints(samples - 1);
  const out = sampled.map((point) => point.clone());
  while (out.length < samples) out.push(out[out.length - 1].clone());
  return { curve, points: out, length: curve.getLength() };
}

/**
 * Bakes sampled lanes into a float RGBA atlas:
 *   RGB = position, A = per-lane channel (heat or speed factor).
 * Nearest filtering keeps it portable; the shader interpolates by hand.
 */
function createLaneAtlas(lanes, samples) {
  const height = Math.max(1, lanes.length);
  const data = new Float32Array(samples * height * 4);

  for (let laneIndex = 0; laneIndex < height; laneIndex++) {
    const lane = lanes[laneIndex];
    const points = lane.points;
    const channel = lane.channel;
    for (let i = 0; i < samples; i++) {
      const point = points[Math.min(i, points.length - 1)] || new THREE.Vector3();
      const offset = (laneIndex * samples + i) * 4;
      data[offset] = point.x;
      data[offset + 1] = point.y;
      data[offset + 2] = point.z;
      data[offset + 3] = Array.isArray(channel)
        ? readNumber(channel[i], 1)
        : readNumber(channel, 1);
    }
  }

  const texture = new THREE.DataTexture(data, samples, height, THREE.RGBAFormat, THREE.FloatType);
  texture.name = 'airflow-lane-atlas';
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return { texture, width: samples, height };
}

/* ========================================================================== */
/*  Shaders                                                                   */
/* ========================================================================== */

const LANE_SAMPLER = /* glsl */ `
  uniform sampler2D uLaneTexture;
  uniform float uLaneCount;
  uniform float uLaneSamples;

  vec4 laneTexel(float lane, float index) {
    vec2 uv = vec2((index + 0.5) / uLaneSamples, (lane + 0.5) / uLaneCount);
    return texture2D(uLaneTexture, uv);
  }

  vec3 lanePosition(float lane, float t) {
    float f = clamp(t, 0.0, 1.0) * (uLaneSamples - 1.0);
    float i0 = floor(f);
    float i1 = min(i0 + 1.0, uLaneSamples - 1.0);
    return mix(laneTexel(lane, i0).xyz, laneTexel(lane, i1).xyz, f - i0);
  }

  float laneChannel(float lane, float t) {
    float f = clamp(t, 0.0, 1.0) * (uLaneSamples - 1.0);
    float i0 = floor(f);
    float i1 = min(i0 + 1.0, uLaneSamples - 1.0);
    return mix(laneTexel(lane, i0).a, laneTexel(lane, i1).a, f - i0);
  }
`;

/* ------------------------------- Airflow ---------------------------------- */

const AIRFLOW_VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uThermal;
  uniform float uExplode;
  uniform float uParticleSize;
  uniform float uViewScale;
  uniform vec3 uIntakeColor;
  uniform vec3 uWarmColor;
  uniform vec3 uHotColor;
  uniform vec3 uExhaustColor;

  attribute float aLane;
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aSeed;
  attribute float aHeat;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vHeat;

  ${LANE_SAMPLER}

  void main() {
    float laneFactor = laneTexel(aLane, 0.0).a;
    float laneSpeed = (0.014 + aSpeed * 0.016) * (0.30 + 1.42 * uThermal) * laneFactor;
    float t = fract(aOffset + uTime * laneSpeed);

    vec3 p = lanePosition(aLane, t);

    // Gentle turbulence: stronger the harder the fans work.
    float turbulence = 0.35 + 0.95 * uThermal;
    float phase = aSeed * 6.2831853;
    p.x += sin(t * 15.0 + phase) * 0.16 * turbulence;
    p.y += cos(t * 11.0 + phase * 1.7) * 0.14 * turbulence;
    p.z += sin(t * 8.0 + phase * 2.3) * 0.12 * turbulence;

    // Exploded view pushes the flow field outward so it keeps framing the rig.
    vec3 outward = normalize(p + vec3(0.0001, 0.0001, 0.0));
    p += outward * uExplode * 5.5 * (0.35 + aSeed);

    float heat = 0.06 + smoothstep(0.22, 0.50, t) * 0.36 + smoothstep(0.50, 0.78, t) * 0.42 + smoothstep(0.78, 0.96, t) * 0.16;
    heat = clamp(heat + uThermal * 0.12 + aHeat * 0.10, 0.0, 1.0);

    vec3 color = mix(uIntakeColor, uWarmColor, smoothstep(0.02, 0.58, heat));
    color = mix(color, uHotColor, smoothstep(0.58, 0.94, heat));
    color = mix(color, uExhaustColor, smoothstep(0.94, 1.0, heat));

    float fade = smoothstep(0.0, 0.045, t) * (1.0 - smoothstep(0.90, 1.0, t));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = max(-mvPosition.z, 0.08);
    gl_PointSize = clamp(
      uParticleSize * aSize * (0.85 + heat * 0.55) * uViewScale / dist,
      1.0,
      5.5
    );

    vColor = color;
    vHeat = heat;
    vAlpha = fade * (0.65 + 0.30 * aSeed) * (0.55 + 0.35 * uThermal);
  }
`;

const AIRFLOW_FRAG = /* glsl */ `
  precision highp float;

  uniform float uOpacity;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vHeat;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    float core = smoothstep(0.5, 0.0, dist);
    float glow = pow(core, 2.5) * 0.82 + core * 0.18;

    float alpha = glow * vAlpha * uOpacity;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(vColor * (0.62 + vHeat * 0.7), alpha);
  }
`;

const AIRFLOW_GUIDE_VERT = /* glsl */ `
  precision highp float;

  attribute float aU;
  varying float vU;

  void main() {
    vU = aU;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AIRFLOW_GUIDE_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uThermal;
  uniform float uOpacity;
  uniform vec3 uIntakeColor;
  uniform vec3 uWarmColor;
  uniform vec3 uHotColor;
  uniform vec3 uExhaustColor;

  varying float vU;

  void main() {
    float heat = clamp(
      0.06 + smoothstep(0.24, 0.60, vU) * 0.34 + smoothstep(0.54, 0.94, vU) * 0.56 + uThermal * 0.10,
      0.0,
      1.0
    );
    vec3 color = mix(uIntakeColor, uWarmColor, smoothstep(0.04, 0.50, heat));
    color = mix(color, uHotColor, smoothstep(0.50, 0.90, heat));
    color = mix(color, uExhaustColor, smoothstep(0.90, 1.0, heat));

    float bands = fract(vU * 2.5 - uTime * (0.05 + 0.14 * uThermal));
    float streak = smoothstep(0.0, 0.12, bands) * (1.0 - smoothstep(0.12, 0.62, bands));
    float energy = 0.11 + streak * 0.38;

    gl_FragColor = vec4(color * energy, energy * uOpacity);
  }
`;

/* ------------------------------ AI data packets --------------------------- */

const AI_PACKET_VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAi;
  uniform float uThermal;
  uniform float uExplode;
  uniform float uParticleSize;
  uniform float uViewScale;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  attribute float aLane;
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aSeed;

  varying vec3 vColor;
  varying float vAlpha;

  ${LANE_SAMPLER}

  void main() {
    float laneFactor = laneTexel(aLane, 0.0).a;
    float laneSpeed = (0.020 + aSpeed * 0.030) * (0.06 + 1.35 * uAi) * laneFactor;
    float t = fract(aOffset + uTime * laneSpeed);

    vec3 p = lanePosition(aLane, t);
    p += normalize(p + vec3(0.0001, 0.0001, 0.0)) * uExplode * 4.0 * (0.4 + aSeed);

    float pulse = 0.72 + 0.28 * sin(t * 42.0 + aSeed * 6.2831853 + uTime * 2.4);

    vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 0.55, t));
    color = mix(color, uColorC, smoothstep(0.62, 1.0, t));

    float fade = smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.93, 1.0, t));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = max(-mvPosition.z, 0.08);
    gl_PointSize = clamp(uParticleSize * aSize * pulse * uViewScale / dist, 1.0, 26.0);

    vColor = color;
    vAlpha = fade * (0.25 + 0.75 * uAi) * (0.7 + 0.3 * uThermal);
  }
`;

const AI_PACKET_FRAG = /* glsl */ `
  precision highp float;

  uniform float uOpacity;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    float core = smoothstep(0.5, 0.0, dist);
    float glow = pow(core, 3.0) * 1.1 + core * 0.18;
    float alpha = glow * vAlpha * uOpacity;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(vColor * 1.35, alpha);
  }
`;

/* ------------------------------ PCB signal traces ------------------------- */

const TRACE_VERT = /* glsl */ `
  precision highp float;

  uniform float uExplode;

  attribute float aU;
  attribute vec3 aExplode;

  varying float vU;

  void main() {
    vec3 p = position + aExplode * uExplode;
    vU = aU;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const TRACE_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uSpeed;
  uniform float uPhase;
  uniform float uPacketCount;
  uniform float uBaseIntensity;
  uniform float uPacketIntensity;
  uniform float uOpacity;
  uniform float uExplode;
  uniform vec3 uColor;
  uniform vec3 uPacketColor;

  varying float vU;

  void main() {
    float shimmer = 0.72 + 0.28 * sin(vU * 30.0 - uTime * 1.6 + uPhase * 6.2831853);
    float base = uBaseIntensity * shimmer * (1.0 - uExplode * 0.35);

    float f = fract(vU * uPacketCount - uTime * uSpeed + uPhase);
    float head = smoothstep(0.0, 0.020, f) * (1.0 - smoothstep(0.020, 0.085, f));
    float packet = pow(head, 1.4);

    float energy = base + packet * uPacketIntensity;
    if (energy < 0.004) discard;

    vec3 color = mix(uColor, uPacketColor, clamp(packet * 1.4, 0.0, 1.0));
    gl_FragColor = vec4(color * energy, energy * uOpacity);
  }
`;

/* ------------------------------ Neural lattice ---------------------------- */

const LATTICE_NODE_VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAi;
  uniform float uExplode;
  uniform float uPointSize;
  uniform float uViewScale;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  attribute float aLayer;
  attribute float aPhase;
  attribute float aSeed;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float wave = sin(uTime * (1.1 + 2.9 * uAi) - aLayer * 1.55 + aPhase);
    float flicker = 0.6 + 0.4 * sin(uTime * (2.2 + aSeed * 3.4) + aPhase * 6.2831853);
    float activation = smoothstep(0.05, 0.85, uAi);

    vec3 p = position;
    p += normalize(p + vec3(0.0001)) * uExplode * 4.5;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = max(-mvPosition.z, 0.08);
    gl_PointSize = clamp(
      uPointSize * (0.75 + 0.5 * activation) * (0.85 + 0.3 * wave) * uViewScale / dist,
      1.0,
      16.0
    );

    vColor = mix(uColorA, uColorB, clamp(aLayer / 3.0, 0.0, 1.0));
    vAlpha = (0.24 + 0.76 * activation) * (0.55 + 0.45 * wave) * flicker;
  }
`;

const LATTICE_NODE_FRAG = /* glsl */ `
  precision highp float;

  uniform float uOpacity;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    float core = smoothstep(0.5, 0.0, dist);
    float glow = pow(core, 2.8) * 0.9 + core * 0.3;
    float alpha = glow * vAlpha * uOpacity;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(vColor * 1.1, alpha);
  }
`;

const LATTICE_EDGE_VERT = /* glsl */ `
  precision highp float;

  attribute float aT;
  attribute float aSeed;
  attribute vec3 aExplode;

  uniform float uExplode;

  varying float vT;
  varying float vSeed;

  void main() {
    vec3 p = position + aExplode * uExplode;
    vT = aT;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const LATTICE_EDGE_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAi;
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform vec3 uPulseColor;

  varying float vT;
  varying float vSeed;

  void main() {
    float f = fract(vT - uTime * (0.35 + 1.15 * uAi) + vSeed);
    float head = smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.05, 0.38, f));
    float packet = pow(head, 1.6);

    float activation = smoothstep(0.05, 0.9, uAi);
    float base = 0.035 + 0.075 * uAi;
    float energy = base + packet * (0.30 + 0.70 * activation);

    vec3 color = mix(uColor, uPulseColor, clamp(packet * 1.2, 0.0, 1.0));
    gl_FragColor = vec4(color * energy, energy * uOpacity);
  }
`;

/* ------------------------------ Coolant flow ------------------------------ */

const COOLANT_VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uLoad;
  uniform float uParticleSize;
  uniform float uViewScale;
  uniform vec3 uColdColor;
  uniform vec3 uWarmColor;
  uniform vec3 uHotColor;

  attribute float aLane;
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aSeed;

  varying vec3 vColor;
  varying float vAlpha;

  ${LANE_SAMPLER}

  void main() {
    float speed = (0.012 + aSpeed * 0.014) * (0.35 + 1.7 * uLoad);
    float t = fract(aOffset + uTime * speed);

    vec3 p = lanePosition(aLane, t);
    float heat = laneChannel(aLane, t);

    float phase = aSeed * 6.2831853;
    p.x += sin(t * 40.0 + phase + uTime * 1.4) * 0.12;
    p.y += cos(t * 34.0 + phase * 1.3 + uTime * 1.1) * 0.12;

    vec3 color = mix(uColdColor, uWarmColor, smoothstep(0.10, 0.62, heat));
    color = mix(color, uHotColor, smoothstep(0.68, 0.98, heat));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = max(-mvPosition.z, 0.08);
    gl_PointSize = clamp(
      uParticleSize * aSize * (0.7 + 0.6 * heat) * uViewScale / dist,
      1.0,
      18.0
    );

    vColor = color;
    vAlpha = (0.35 + 0.45 * aSpeed) * (0.35 + 0.65 * uLoad);
  }
`;

const COOLANT_FRAG = /* glsl */ `
  precision highp float;

  uniform float uOpacity;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    float core = smoothstep(0.5, 0.0, dist);
    float glow = pow(core, 2.0) * 0.8 + core * 0.35;
    float alpha = glow * vAlpha * uOpacity;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(vColor * 1.05, alpha);
  }
`;

const TUBE_FLOW_VERT = /* glsl */ `
  precision highp float;

  attribute float aU;
  varying float vU;

  void main() {
    vU = aU;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TUBE_FLOW_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uLoad;
  uniform float uOpacity;
  uniform vec3 uColdColor;
  uniform vec3 uWarmColor;

  varying float vU;

  void main() {
    float bands = fract(vU * 30.0 - uTime * (0.12 + 0.8 * uLoad));
    float band = smoothstep(0.0, 0.06, bands) * (1.0 - smoothstep(0.06, 0.42, bands));
    float heat = smoothstep(0.15, 0.72, vU);
    vec3 color = mix(uColdColor, uWarmColor, heat * 0.85);
    float energy = 0.05 + band * (0.22 + 0.65 * uLoad);

    gl_FragColor = vec4(color * energy, energy * uOpacity);
  }
`;

/* ========================================================================== */
/*  Geometry helpers                                                          */
/* ========================================================================== */

/**
 * TubeGeometry lays out (tubularSegments + 1) rings of (radialSegments + 1)
 * vertices.  Annotate each vertex with its position along the tube and an
 * explode offset so the exploded view costs no geometry rebuild.
 */
function annotateTube(geometry, tubularSegments, radialSegments, startOffset, endOffset) {
  const position = geometry.getAttribute('position');
  const count = position.count;
  const verticesPerRing = radialSegments + 1;
  const uArray = new Float32Array(count);
  const explodeArray = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const ring = Math.floor(i / verticesPerRing);
    const t = clamp01(ring / Math.max(1, tubularSegments));
    uArray[i] = t;
    explodeArray[i * 3] = startOffset.x * (1 - t) + endOffset.x * t;
    explodeArray[i * 3 + 1] = startOffset.y * (1 - t) + endOffset.y * t;
    explodeArray[i * 3 + 2] = startOffset.z * (1 - t) + endOffset.z * t;
  }

  geometry.setAttribute('aU', new THREE.BufferAttribute(uArray, 1));
  geometry.setAttribute('aExplode', new THREE.BufferAttribute(explodeArray, 3));
  return geometry;
}

function createTraceMaterial({ color, packetColor, speed, phase, packetCount, base, packet, opacity = 1 }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uPhase: { value: phase },
      uPacketCount: { value: packetCount },
      uBaseIntensity: { value: base },
      uPacketIntensity: { value: packet },
      uOpacity: { value: opacity },
      uExplode: { value: 0 },
      uColor: { value: color },
      uPacketColor: { value: packetColor }
    },
    vertexShader: TRACE_VERT,
    fragmentShader: TRACE_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
}

/* ========================================================================== */
/*  Airflow lane construction                                                 */
/* ========================================================================== */

/**
 * Curved streamlines for the airflow particles, in rig centimeters.
 * Front (intake) is +Z, exhaust is -Z / +Y.  Lanes are grouped by hardware
 * zone so density and heat bias can differ per subsystem.
 */
function buildAirflowLanes(layout, random) {
  const { anchors: a, bounds: b, unit } = layout;
  const frontZ = b.max.z;
  const rearZ = b.min.z;
  const topY = b.max.y;
  const bottomY = b.min.y;
  const frontOut = frontZ - 1.5 * unit;
  const rearOut = rearZ - 2.5 * unit;
  const jitter = (amount) => (random() * 2 - 1) * amount * unit;

  const lanes = [];
  const addLane = (points, heat, weight) => {
    const sampled = sampleCurve(points, { samples: 64, tension: 0.45 });
    lanes.push({ points: sampled.points, channel: { heat, weight }, length: sampled.length });
  };

  /* --- GPU shroud: over, across and under the card ---------------------- */
  const gpuProfiles = [
    { dy: 4.6, dx: -4.5, under: false },
    { dy: 0.0, dx: 1.0, under: false },
    { dy: -4.8, dx: 4.0, under: true }
  ];
  for (let i = 0; i < gpuProfiles.length; i++) {
    const { dy, dx, under } = gpuProfiles[i];
    const y = a.gpu.y + dy;
    addLane(
      [
        new THREE.Vector3(a.gpu.x + dx + jitter(1.2), y, frontOut),
        new THREE.Vector3(a.gpu.x + dx, y, frontZ - 4 * unit),
        new THREE.Vector3(a.gpu.x + dx * 0.8, y, 12 * unit),
        new THREE.Vector3(a.gpu.x + dx * 0.7, y, 9.2 * unit),
        new THREE.Vector3(a.gpu.x + dx * 0.5, y + (under ? -0.4 : 0.4) * unit, 6.6 * unit),
        new THREE.Vector3(a.gpu.x + dx * 0.2, under ? a.gpu.y - 6.4 : a.gpu.y + 5.4, 1.5 * unit),
        new THREE.Vector3(a.gpu.x + 1.5 * unit, under ? a.gpu.y - 7.0 : a.gpu.y + 5.6, rearZ + 7 * unit),
        new THREE.Vector3(a.gpu.x + 2.5 * unit, under ? a.gpu.y - 6.0 : a.gpu.y + 5.0, rearOut)
      ],
      0.86,
      2.2
    );
  }

  /* --- CPU tower lanes: two outside the towers, four through the fins --- */
  const cpuOffsets = [-5.0, -1.7, 1.7, 5.0];
  const cpuLateral = [-8.0, -4.2, -1.6, 1.0, 3.4, 8.0];
  for (let i = 0; i < cpuLateral.length; i++) {
    const dy = cpuOffsets[i % cpuOffsets.length] * unit;
    const x = a.cooler.x + cpuLateral[i] * unit;
    addLane(
      [
        new THREE.Vector3(x + jitter(1.4), a.cooler.y + dy, frontOut),
        new THREE.Vector3(x + jitter(1.0), a.cooler.y + dy, frontZ - 5 * unit),
        new THREE.Vector3(x, a.cooler.y + dy, 16 * unit),
        new THREE.Vector3(x, a.cooler.y + dy, 9.4 * unit),
        new THREE.Vector3(x, a.cooler.y + dy, 7.8 * unit),
        new THREE.Vector3(x, a.cooler.y + dy, 2.2 * unit),
        new THREE.Vector3(x + 2.0 * unit, a.cooler.y + dy * 0.9, rearZ + 8 * unit),
        new THREE.Vector3(x + 4.0 * unit, a.cooler.y + dy * 0.8, rearOut)
      ],
      0.98,
      2.4
    );
  }

  /* --- Top exhaust: warm air peeling up through the radiator ------------ */
  addLane(
    [
      new THREE.Vector3(a.cooler.x + 10 * unit, 16 * unit, frontOut),
      new THREE.Vector3(a.cooler.x + 9 * unit, 18 * unit, 14 * unit),
      new THREE.Vector3(a.cooler.x + 7 * unit, 21 * unit, 6 * unit),
      new THREE.Vector3(a.cooler.x + 3 * unit, 24 * unit, 0.0),
      new THREE.Vector3(a.cooler.x, 26.5 * unit, -3 * unit),
      new THREE.Vector3(a.cooler.x, 31.5 * unit, -5 * unit)
    ],
    0.72,
    1.4
  );

  /* --- Lower intake / PSU tunnel ---------------------------------------- */
  addLane(
    [
      new THREE.Vector3(a.psu.x - 6 * unit, bottomY + 6 * unit, frontOut),
      new THREE.Vector3(a.psu.x - 6 * unit, bottomY + 6 * unit, frontZ - 6 * unit),
      new THREE.Vector3(a.psu.x - 4 * unit, bottomY + 6.5 * unit, 8 * unit),
      new THREE.Vector3(a.psu.x, bottomY + 7 * unit, 0.0),
      new THREE.Vector3(a.psu.x + 2 * unit, bottomY + 8 * unit, rearZ + 4 * unit),
      new THREE.Vector3(a.psu.x + 2 * unit, bottomY + 9 * unit, rearOut)
    ],
    0.30,
    0.7
  );

  /* --- Upper bypass across the RAM / VRM area --------------------------- */
  addLane(
    [
      new THREE.Vector3(a.ram.x + 6 * unit, a.ram.y + 7 * unit, frontOut),
      new THREE.Vector3(a.ram.x + 6 * unit, a.ram.y + 7 * unit, frontZ - 5 * unit),
      new THREE.Vector3(a.ram.x + 4 * unit, a.ram.y + 7 * unit, 10 * unit),
      new THREE.Vector3(a.ram.x - 2 * unit, a.ram.y + 7 * unit, 0.0),
      new THREE.Vector3(a.cpu.x + 8 * unit, a.cpu.y + 9 * unit, rearZ + 5 * unit),
      new THREE.Vector3(a.cpu.x + 8 * unit, a.cpu.y + 8 * unit, rearOut)
    ],
    0.18,
    0.55
  );

  return {
    lanes,
    weights: lanes.map((lane) => lane.channel.weight)
  };
}

function pickWeighted(weights, random) {
  let total = 0;
  for (let i = 0; i < weights.length; i++) total += weights[i];
  let roll = random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

function buildAirflowPoints(layout, random, count) {
  const { lanes, weights } = buildAirflowLanes(layout, random);
  const atlas = createLaneAtlas(
    lanes.map((lane) => ({ points: lane.points, channel: lane.length })),
    64
  );

  const laneCount = lanes.length;
  const positions = new Float32Array(count * 3);
  const laneAttr = new Float32Array(count);
  const offsets = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const heats = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const laneIndex = pickWeighted(weights, random);
    laneAttr[i] = laneIndex;
    offsets[i] = random();
    speeds[i] = 0.55 + random() * 0.9;
    sizes[i] = 0.55 + random() * 0.85;
    seeds[i] = random();
    heats[i] = readNumber(lanes[laneIndex].channel.heat, 0.4);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aLane', new THREE.BufferAttribute(laneAttr, 1));
  geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aHeat', new THREE.BufferAttribute(heats, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(80, layout.size.length()));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uLaneTexture: { value: atlas.texture },
      uLaneCount: { value: atlas.height },
      uLaneSamples: { value: atlas.width },
      uTime: { value: 0 },
      uThermal: { value: 0.3 },
      uExplode: { value: 0 },
      uParticleSize: { value: 0.33 * layout.unit },
      uViewScale: { value: 900 },
      uOpacity: { value: 1 },
      uIntakeColor: { value: new THREE.Color(AIRFLOW_PALETTE.intake) },
      uWarmColor: { value: new THREE.Color(AIRFLOW_PALETTE.warming) },
      uHotColor: { value: new THREE.Color(AIRFLOW_PALETTE.hot) },
      uExhaustColor: { value: new THREE.Color(AIRFLOW_PALETTE.exhaust) }
    },
    vertexShader: AIRFLOW_VERT,
    fragmentShader: AIRFLOW_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'thermal-airflow';
  points.frustumCulled = false;
  points.renderOrder = 4;

  // Fine streamline filaments keep the flow legible between particles.
  const guideMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uThermal: { value: 0.3 },
      uOpacity: { value: 0.9 },
      uIntakeColor: { value: new THREE.Color(AIRFLOW_PALETTE.intake) },
      uWarmColor: { value: new THREE.Color(AIRFLOW_PALETTE.warming) },
      uHotColor: { value: new THREE.Color(AIRFLOW_PALETTE.hot) },
      uExhaustColor: { value: new THREE.Color(AIRFLOW_PALETTE.exhaust) }
    },
    vertexShader: AIRFLOW_GUIDE_VERT,
    fragmentShader: AIRFLOW_GUIDE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const guides = new THREE.Group();
  guides.name = 'airflow-streamlines';
  for (const lane of lanes) {
    const pointCount = lane.points.length;
    const linePositions = new Float32Array(pointCount * 3);
    const lineU = new Float32Array(pointCount);
    for (let i = 0; i < pointCount; i++) {
      const point = lane.points[i];
      linePositions[i * 3] = point.x;
      linePositions[i * 3 + 1] = point.y;
      linePositions[i * 3 + 2] = point.z;
      lineU[i] = i / Math.max(1, pointCount - 1);
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('aU', new THREE.BufferAttribute(lineU, 1));
    const line = new THREE.Line(lineGeometry, guideMaterial);
    line.frustumCulled = false;
    line.renderOrder = 2;
    guides.add(line);
  }

  return { points, material, guides, guideMaterial, texture: atlas.texture, laneCount, particleCount: count };
}

/* ========================================================================== */
/*  AI packet lanes                                                           */
/* ========================================================================== */

/** RAM -> CPU -> PCIe x16 -> GPU tensor area, three slightly offset strands. */
function buildAiLanes(layout, random) {
  const { anchors: a, unit } = layout;
  const lanes = [];
  const boardZ = a.motherboard.z + 0.25 * unit;

  for (let strand = 0; strand < 3; strand++) {
    const lateral = (strand - 1) * 0.9 * unit;
    const points = [
      new THREE.Vector3(a.ram.x + 1.2 * unit + lateral, a.ram.y - 3.0 * unit, boardZ),
      new THREE.Vector3(a.ram.x + 1.0 * unit + lateral, a.ram.y + 3.0 * unit, boardZ),
      new THREE.Vector3(a.cpu.x + 7.0 * unit + lateral, a.cpu.y + 2.0 * unit, boardZ),
      new THREE.Vector3(a.cpu.x + 1.2 * unit + lateral, a.cpu.y - 1.5 * unit, boardZ),
      new THREE.Vector3(a.cpu.x + 0.8 * unit + lateral, a.cpu.y - 9.0 * unit, boardZ),
      new THREE.Vector3(a.gpu.x + 6.0 * unit + lateral, a.gpu.y + 2.0 * unit, boardZ + 1.5 * unit),
      new THREE.Vector3(a.gpu.x + 2.0 * unit + lateral, a.gpu.y + 3.2 * unit, a.gpu.z - 1.0 * unit),
      new THREE.Vector3(a.gpu.x + lateral, a.gpu.y + 5.2 * unit, a.tensorMatrix.z)
    ];
    const sampled = sampleCurve(points, { samples: 64, tension: 0.5 });
    lanes.push({ points: sampled.points, length: sampled.length });
  }

  return lanes;
}

function buildAiPackets(layout, random, count) {
  const lanes = buildAiLanes(layout, random);
  const atlas = createLaneAtlas(
    lanes.map((lane) => ({ points: lane.points, channel: 1 })),
    64
  );

  const positions = new Float32Array(count * 3);
  const laneAttr = new Float32Array(count);
  const offsets = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    laneAttr[i] = i % lanes.length;
    offsets[i] = random();
    speeds[i] = 0.6 + random() * 0.8;
    sizes[i] = 0.9 + random() * 0.8;
    seeds[i] = random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aLane', new THREE.BufferAttribute(laneAttr, 1));
  geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(80, layout.size.length()));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uLaneTexture: { value: atlas.texture },
      uLaneCount: { value: atlas.height },
      uLaneSamples: { value: atlas.width },
      uTime: { value: 0 },
      uAi: { value: 0 },
      uThermal: { value: 0.3 },
      uExplode: { value: 0 },
      uParticleSize: { value: 0.80 * layout.unit },
      uViewScale: { value: 900 },
      uOpacity: { value: 0.95 },
      uColorA: { value: new THREE.Color(AIRFLOW_PALETTE.signal) },
      uColorB: { value: new THREE.Color(AIRFLOW_PALETTE.ai) },
      uColorC: { value: new THREE.Color(AIRFLOW_PALETTE.aiPulse) }
    },
    vertexShader: AI_PACKET_VERT,
    fragmentShader: AI_PACKET_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'ai-data-packets';
  points.frustumCulled = false;
  points.renderOrder = 6;

  return { points, material, texture: atlas.texture };
}

/* ========================================================================== */
/*  Neural / tensor lattice                                                   */
/* ========================================================================== */

function buildNeuralLattice(center, size, unit) {
  const layers = 4;
  const grid = 3;
  const group = new THREE.Group();
  group.name = 'ai-tensor-lattice';

  const nodes = [];
  const layerSpacing = size.y;
  const halfX = size.x / 2;
  const halfZ = size.z / 2;

  for (let layer = 0; layer < layers; layer++) {
    for (let row = 0; row < grid; row++) {
      for (let col = 0; col < grid; col++) {
        const x = center.x + (col / (grid - 1) - 0.5) * size.x;
        const z = center.z + (row / (grid - 1) - 0.5) * size.z;
        const y = center.y + (layer / (layers - 1) - 0.5) * layerSpacing;
        nodes.push({ layer, x, y, z });
      }
    }
  }

  const nodePositions = new Float32Array(nodes.length * 3);
  const nodeLayer = new Float32Array(nodes.length);
  const nodePhase = new Float32Array(nodes.length);
  const nodeSeed = new Float32Array(nodes.length);
  nodes.forEach((node, i) => {
    nodePositions[i * 3] = node.x;
    nodePositions[i * 3 + 1] = node.y;
    nodePositions[i * 3 + 2] = node.z;
    nodeLayer[i] = node.layer;
    nodePhase[i] = (node.layer * 0.9 + (i % grid) * 0.7 + Math.floor(i / grid) * 0.35) % TAU;
    nodeSeed[i] = ((i * 2654435761) % 1000) / 1000;
  });

  const nodeGeometry = new THREE.BufferGeometry();
  nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
  nodeGeometry.setAttribute('aLayer', new THREE.BufferAttribute(nodeLayer, 1));
  nodeGeometry.setAttribute('aPhase', new THREE.BufferAttribute(nodePhase, 1));
  nodeGeometry.setAttribute('aSeed', new THREE.BufferAttribute(nodeSeed, 1));
  nodeGeometry.boundingSphere = new THREE.Sphere(center.clone(), Math.max(size.x, size.y, size.z) * 2);

  const nodeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAi: { value: 0 },
      uExplode: { value: 0 },
      uPointSize: { value: 0.75 * unit },
      uViewScale: { value: 900 },
      uOpacity: { value: 1 },
      uColorA: { value: new THREE.Color('#67e8f9') },
      uColorB: { value: new THREE.Color(AIRFLOW_PALETTE.aiPulse) }
    },
    vertexShader: LATTICE_NODE_VERT,
    fragmentShader: LATTICE_NODE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
  nodePoints.frustumCulled = false;
  nodePoints.renderOrder = 8;
  group.add(nodePoints);

  // Sparse layered connections read as a neural graph without becoming a web.
  const edgePositions = [];
  const edgeT = [];
  const edgeSeed = [];
  const edgeExplode = [];

  for (let layer = 0; layer < layers - 1; layer++) {
    const from = nodes.filter((node) => node.layer === layer);
    const to = nodes.filter((node) => node.layer === layer + 1);
    for (let i = 0; i < from.length; i++) {
      for (let k = 0; k < 3; k++) {
        const j = (i * 4 + k * 3 + layer * 2) % to.length;
        const a = from[i];
        const b = to[j];
        const seed = ((i * 7 + j * 13 + layer * 29) % 100) / 100;
        edgePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        edgeT.push(0, 1);
        edgeSeed.push(seed, seed);
        edgeExplode.push(0, 0, 0, 0, 0, 0);
      }
    }
  }

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  edgeGeometry.setAttribute('aT', new THREE.Float32BufferAttribute(edgeT, 1));
  edgeGeometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(edgeSeed, 1));
  edgeGeometry.setAttribute('aExplode', new THREE.Float32BufferAttribute(edgeExplode, 3));
  edgeGeometry.boundingSphere = new THREE.Sphere(center.clone(), Math.max(size.x, size.y, size.z) * 2);

  const edgeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAi: { value: 0 },
      uExplode: { value: 0 },
      uOpacity: { value: 0.9 },
      uColor: { value: new THREE.Color(AIRFLOW_PALETTE.ai) },
      uPulseColor: { value: new THREE.Color('#f5d0fe') }
    },
    vertexShader: LATTICE_EDGE_VERT,
    fragmentShader: LATTICE_EDGE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  edgeLines.frustumCulled = false;
  edgeLines.renderOrder = 7;
  group.add(edgeLines);

  // Thin frames around each layer keep the lattice legible in 3D.
  const framePositions = [];
  for (let layer = 0; layer < layers; layer++) {
    const y = center.y + (layer / (layers - 1) - 0.5) * layerSpacing;
    const x0 = center.x - halfX;
    const x1 = center.x + halfX;
    const z0 = center.z - halfZ;
    const z1 = center.z + halfZ;
    framePositions.push(
      x0, y, z0, x1, y, z0,
      x1, y, z0, x1, y, z1,
      x1, y, z1, x0, y, z1,
      x0, y, z1, x0, y, z0
    );
  }

  const frameGeometry = new THREE.BufferGeometry();
  frameGeometry.setAttribute('position', new THREE.Float32BufferAttribute(framePositions, 3));
  const frameMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color('#67e8f9'),
    transparent: true,
    opacity: 0.10,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const frameLines = new THREE.LineSegments(frameGeometry, frameMaterial);
  frameLines.renderOrder = 5;
  group.add(frameLines);

  return {
    group,
    nodeMaterial,
    edgeMaterial,
    frameMaterial,
    nodeCount: nodes.length,
    edgeCount: edgePositions.length / 6,
    center: center.clone()
  };
}

/* ========================================================================== */
/*  PCB signal traces                                                         */
/* ========================================================================== */

function buildSignalTraces(layout, options) {
  const { anchors: a, unit } = layout;
  const group = new THREE.Group();
  group.name = 'pcb-signals';

  const traces = [];
  const boardZ = a.motherboard.z + 0.35 * unit;
  const explodeOffsets = {
    ram: toVector3(options.explodeOffsets && options.explodeOffsets.ram, [0, 1.2 * unit, 5.2 * unit]),
    gpu: toVector3(options.explodeOffsets && options.explodeOffsets.gpu, [0, 1.4 * unit, 11.8 * unit]),
    nvme: toVector3(options.explodeOffsets && options.explodeOffsets.nvme, [0, 0, 3.6 * unit])
  };

  const addTrace = (points, config) => {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.28);
    const tubular = 72;
    const radial = 4;
    const geometry = new THREE.TubeGeometry(curve, tubular, 0.15 * unit, radial, false);
    annotateTube(
      geometry,
      tubular,
      radial,
      config.startOffset || new THREE.Vector3(),
      config.endOffset || new THREE.Vector3()
    );

    const material = createTraceMaterial({
      color: new THREE.Color(config.color || AIRFLOW_PALETTE.signal),
      packetColor: new THREE.Color(config.packetColor || AIRFLOW_PALETTE.signalPulse),
      speed: config.speed,
      phase: config.phase,
      packetCount: config.packetCount,
      base: config.base,
      packet: config.packet,
      opacity: config.opacity ?? 1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 3;
    mesh.frustumCulled = false;
    group.add(mesh);
    traces.push({ mesh, material, geometry, curve });

    // Solder pad / via at each end.
    const padMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.packetColor || AIRFLOW_PALETTE.signalPulse),
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const padGeometry = new THREE.RingGeometry(0.14 * unit, 0.30 * unit, 16);
    const startPad = new THREE.Mesh(padGeometry, padMaterial);
    startPad.position.copy(points[0]);
    startPad.rotation.x = Math.PI / 2;
    startPad.renderOrder = 3;
    const endPad = new THREE.Mesh(padGeometry, padMaterial);
    endPad.position.copy(points[points.length - 1]);
    endPad.rotation.x = Math.PI / 2;
    endPad.renderOrder = 3;
    group.add(startPad, endPad);
  };

  // --- CPU <-> RAM: four parallel address/data traces --------------------
  for (let i = 0; i < 4; i++) {
    const offset = (i - 1.5) * 0.55 * unit;
    addTrace(
      [
        new THREE.Vector3(a.cpu.x + 3.2 * unit, a.cpu.y - 0.4 * unit + offset, boardZ),
        new THREE.Vector3(a.cpu.x + 5.8 * unit, a.cpu.y - 0.2 * unit + offset, boardZ),
        new THREE.Vector3(a.ram.x - 2.8 * unit, a.ram.y - 5.8 * unit + offset, boardZ),
        new THREE.Vector3(a.ram.x - 1.6 * unit, a.ram.y - 6.4 * unit + offset, boardZ)
      ],
      {
        speed: 0.85 + i * 0.03,
        phase: i * 0.21,
        packetCount: 5,
        base: 0.24,
        packet: 1.8,
        color: '#0ea5b7',
        packetColor: '#7dd3fc',
        endOffset: explodeOffsets.ram
      }
    );
  }

  // --- CPU <-> GPU PCIe x16: eight lanes bundled into the slot ----------
  for (let i = 0; i < 8; i++) {
    const offset = (i - 3.5) * 0.34 * unit;
    addTrace(
      [
        new THREE.Vector3(a.cpu.x + 1.2 * unit + offset, a.cpu.y - 3.4 * unit, boardZ),
        new THREE.Vector3(a.cpu.x + 2.4 * unit + offset, a.cpu.y - 7.6 * unit, boardZ),
        new THREE.Vector3(a.gpu.x - 10.0 * unit + offset, a.gpu.y + 4.2 * unit, boardZ),
        new THREE.Vector3(a.gpu.x - 7.0 * unit + offset, a.gpu.y + 3.9 * unit, boardZ),
        new THREE.Vector3(a.gpu.x - 2.0 * unit + offset, a.gpu.y + 3.9 * unit, boardZ)
      ],
      {
        speed: 1.15 + i * 0.02,
        phase: (i * 0.13) % 1,
        packetCount: 7,
        base: 0.26,
        packet: 2.0,
        color: '#0284c7',
        packetColor: '#a5f3fc',
        endOffset: explodeOffsets.gpu
      }
    );
  }

  // --- CPU <-> M.2 NVMe: two short storage buses ------------------------
  for (let i = 0; i < 2; i++) {
    const offset = (i - 0.5) * 0.42 * unit;
    addTrace(
      [
        new THREE.Vector3(a.cpu.x + 3.6 * unit, a.cpu.y - 8.0 * unit + offset, boardZ),
        new THREE.Vector3(a.nvme.x - 4.6 * unit, a.nvme.y + 5.2 * unit + offset, boardZ),
        new THREE.Vector3(a.nvme.x - 2.0 * unit, a.nvme.y + 1.6 * unit + offset, boardZ)
      ],
      {
        speed: 0.95 + i * 0.05,
        phase: 0.35 + i * 0.3,
        packetCount: 4,
        base: 0.22,
        packet: 1.6,
        color: '#0ea5b7',
        packetColor: '#67e8f9',
        endOffset: explodeOffsets.nvme
      }
    );
  }

  return { group, traces };
}

/* ========================================================================== */
/*  AI pipeline ribbon                                                        */
/* ========================================================================== */

function buildAiRibbon(layout, options) {
  const { anchors: a, unit } = layout;
  const boardZ = a.motherboard.z + 0.32 * unit;
  const points = [
    new THREE.Vector3(a.ram.x + 1.4 * unit, a.ram.y - 2.2 * unit, boardZ),
    new THREE.Vector3(a.ram.x + 0.4 * unit, a.ram.y + 4.0 * unit, boardZ),
    new THREE.Vector3(a.cpu.x + 6.4 * unit, a.cpu.y + 3.4 * unit, boardZ),
    new THREE.Vector3(a.cpu.x + 6.0 * unit, a.cpu.y - 2.6 * unit, boardZ),
    new THREE.Vector3(a.cpu.x + 0.6 * unit, a.cpu.y - 10.0 * unit, boardZ),
    new THREE.Vector3(a.gpu.x + 8.0 * unit, a.gpu.y + 3.0 * unit, boardZ + 2.0 * unit),
    new THREE.Vector3(a.gpu.x + 3.0 * unit, a.gpu.y + 4.2 * unit, a.gpu.z - 1.0 * unit),
    new THREE.Vector3(a.gpu.x, a.gpu.y + 5.4 * unit, a.tensorMatrix.z)
  ];
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const tubular = 120;
  const radial = 4;
  const geometry = new THREE.TubeGeometry(curve, tubular, 0.42 * unit, radial, false);
  annotateTube(
    geometry,
    tubular,
    radial,
    new THREE.Vector3(),
    toVector3(options.explodeOffsets && options.explodeOffsets.gpu, [0, 1.4 * unit, 11.8 * unit])
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 1.5 },
      uPhase: { value: 0.12 },
      uPacketCount: { value: 9 },
      uBaseIntensity: { value: 0.22 },
      uPacketIntensity: { value: 3.6 },
      uOpacity: { value: 0.9 },
      uExplode: { value: 0 },
      uColor: { value: new THREE.Color(AIRFLOW_PALETTE.ai) },
      uPacketColor: { value: new THREE.Color('#f5d0fe') }
    },
    vertexShader: TRACE_VERT,
    fragmentShader: TRACE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ai-pipeline-ribbon';
  mesh.renderOrder = 6;
  mesh.frustumCulled = false;

  return { mesh, material, geometry };
}

/* ========================================================================== */
/*  Liquid cooling loop                                                       */
/* ========================================================================== */

function buildCoolantLoop(layout, options) {
  const { anchors: a, bounds: b, unit } = layout;
  const group = new THREE.Group();
  group.name = 'liquid-cooling-loop';

  let curve;
  let sampled;

  if (Array.isArray(options.coolantPath) && options.coolantPath.length > 2) {
    const pathPoints = options.coolantPath.map((point) => toVector3(point, [0, 0, 0]));
    curve = new THREE.CatmullRomCurve3(pathPoints, true, 'catmullrom', 0.5);
  } else {
    // Radiator ports -> reservoir -> pump / blocks -> CPU -> radiator.
    const loopPoints = [
      new THREE.Vector3(a.radiator.x - 14 * unit, a.radiator.y - 2.2 * unit, a.radiator.z - 4 * unit),
      new THREE.Vector3(18 * unit, 20 * unit, 4 * unit),
      new THREE.Vector3(a.reservoir.x, a.reservoir.y + 2 * unit, a.reservoir.z),
      new THREE.Vector3(a.reservoir.x, a.reservoir.y - 8 * unit, a.reservoir.z + 0.5 * unit),
      new THREE.Vector3(a.reservoir.x - 3 * unit, a.liquidCooler.y + 1 * unit, a.liquidCooler.z),
      new THREE.Vector3(a.liquidCooler.x - 4 * unit, a.liquidCooler.y, a.liquidCooler.z),
      new THREE.Vector3(a.liquidCooler.x - 12 * unit, a.liquidCooler.y + 3 * unit, a.liquidCooler.z - 1 * unit),
      new THREE.Vector3(a.gpu.x + 4 * unit, a.gpu.y - 1 * unit, a.gpu.z + 1 * unit),
      new THREE.Vector3(a.cpu.x + 1 * unit, a.cpu.y - 4 * unit, a.cpu.z + 1.5 * unit),
      new THREE.Vector3(a.cpu.x - 1 * unit, a.cpu.y + 2 * unit, a.cpu.z + 2.0 * unit),
      new THREE.Vector3(a.cpu.x - 3 * unit, a.cpu.y + 9 * unit, a.cpu.z + 1.0 * unit),
      new THREE.Vector3(-6 * unit, 23 * unit, 0.0),
      new THREE.Vector3(6 * unit, 24.4 * unit, 0.0),
      new THREE.Vector3(14 * unit, 23 * unit, 2 * unit)
    ];
    curve = new THREE.CatmullRomCurve3(loopPoints, true, 'catmullrom', 0.5);
  }

  const tubular = 240;
  const radial = 8;
  const samples = 96;
  sampled = curve.getSpacedPoints(samples - 1);

  // --- Tubes -------------------------------------------------------------
  let shellMaterial = null;
  let flowMaterial = null;
  if (!Array.isArray(options.coolantPath)) {
    const shellGeometry = new THREE.TubeGeometry(curve, tubular, 0.62 * unit, radial, true);
    shellMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#0b2a33'),
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.renderOrder = 2;
    shell.frustumCulled = false;
    group.add(shell);

    const flowGeometry = new THREE.TubeGeometry(curve, tubular, 0.36 * unit, radial, true);
    const flowU = new Float32Array(flowGeometry.getAttribute('position').count);
    const verticesPerRing = radial + 1;
    for (let i = 0; i < flowU.length; i++) {
      flowU[i] = clamp01(Math.floor(i / verticesPerRing) / tubular);
    }
    flowGeometry.setAttribute('aU', new THREE.BufferAttribute(flowU, 1));

    const flowMaterialInit = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLoad: { value: 0.2 },
        uOpacity: { value: 0.8 },
        uColdColor: { value: new THREE.Color(AIRFLOW_PALETTE.coolantCold) },
        uWarmColor: { value: new THREE.Color(AIRFLOW_PALETTE.coolantWarm) }
      },
      vertexShader: TUBE_FLOW_VERT,
      fragmentShader: TUBE_FLOW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    flowMaterial = flowMaterialInit;
    const flow = new THREE.Mesh(flowGeometry, flowMaterial);
    flow.renderOrder = 3;
    flow.frustumCulled = false;
    group.add(flow);

    // Slim radiator panel so the loop reads as hardware when used standalone.
    const radiator = new THREE.Group();
    radiator.name = 'radiator';
    const panelWidth = 36 * unit;
    const panelHeight = 10 * unit;
    const panelDepth = 2.8 * unit;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#0e2b33'),
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      })
    );
    radiator.add(panel);

    const finPositions = [];
    const finCount = 22;
    for (let i = 0; i < finCount; i++) {
      const x = (i / (finCount - 1) - 0.5) * panelWidth * 0.92;
      finPositions.push(x, -panelHeight / 2, panelDepth / 2 + 0.01, x, panelHeight / 2, panelDepth / 2 + 0.01);
    }
    const finGeometry = new THREE.BufferGeometry();
    finGeometry.setAttribute('position', new THREE.Float32BufferAttribute(finPositions, 3));
    const finMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#22d3ee'),
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const fins = new THREE.LineSegments(finGeometry, finMaterial);
    radiator.add(fins);
    radiator.position.set(a.radiator.x, a.radiator.y, a.radiator.z);
    group.add(radiator);

    // CPU / GPU water blocks, small emissive clamps.
    const blockMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#0f3b45'),
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    const blockGeometry = new THREE.BoxGeometry(5.4 * unit, 1.4 * unit, 4.4 * unit);
    const cpuBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    cpuBlock.position.set(a.cpu.x, a.cpu.y + 1.0 * unit, a.cpu.z + 1.0 * unit);
    cpuBlock.renderOrder = 2;
    const gpuBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    gpuBlock.position.set(a.gpu.x + 2 * unit, a.gpu.y + 2.4 * unit, a.gpu.z - 1.0 * unit);
    gpuBlock.renderOrder = 2;
    group.add(cpuBlock, gpuBlock);
  }

  // --- Coolant particles -------------------------------------------------
  const heatProfile = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    heatProfile[i] = clamp01(
      smoothstep(0.05, 0.30, t) * 0.55 +
      smoothstep(0.35, 0.72, t) * 0.45 -
      smoothstep(0.86, 1.0, t) * 0.55
    );
  }

  const atlas = createLaneAtlas(
    [{ points: sampled.map((point) => point.clone()), channel: heatProfile }],
    samples
  );

  const count = Math.max(80, Math.round(readNumber(options.coolantParticleCount, 260)));
  const positions = new Float32Array(count * 3);
  const laneAttr = new Float32Array(count);
  const offsets = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    laneAttr[i] = 0;
    offsets[i] = Math.random();
    speeds[i] = 0.55 + Math.random() * 0.9;
    sizes[i] = 0.6 + Math.random() * 0.9;
    seeds[i] = Math.random();
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('aLane', new THREE.BufferAttribute(laneAttr, 1));
  particleGeometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
  particleGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  particleGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(80, layout.size.length()));

  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uLaneTexture: { value: atlas.texture },
      uLaneCount: { value: atlas.height },
      uLaneSamples: { value: atlas.width },
      uTime: { value: 0 },
      uLoad: { value: 0.2 },
      uParticleSize: { value: 0.30 * unit },
      uViewScale: { value: 900 },
      uOpacity: { value: 1 },
      uColdColor: { value: new THREE.Color(AIRFLOW_PALETTE.coolantCold) },
      uWarmColor: { value: new THREE.Color(AIRFLOW_PALETTE.coolantWarm) },
      uHotColor: { value: new THREE.Color('#fb7185') }
    },
    vertexShader: COOLANT_VERT,
    fragmentShader: COOLANT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.name = 'coolant-particles';
  particles.frustumCulled = false;
  particles.renderOrder = 6;
  group.add(particles);

  return {
    group,
    flowMaterial,
    particleMaterial,
    shellMaterial,
    particleTexture: atlas.texture,
    count,
    curve
  };
}

/* ========================================================================== */
/*  Telemetry micro-nodes                                                     */
/* ========================================================================== */

function createTelemetryNode(position, color, unit, phase) {
  const group = new THREE.Group();
  group.position.copy(position);

  const size = 1.6 * unit;
  const box = new THREE.BoxGeometry(size, size, size);
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(box),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  group.add(wire);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(size * 0.75, size * 0.78, 32), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const tickGeometry = new THREE.BufferGeometry();
  const tick = size * 1.5;
  tickGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -tick, 0, 0, -tick * 0.72, 0, 0,
    tick, 0, 0, tick * 0.72, 0, 0,
    0, -tick, 0, 0, -tick * 0.72, 0,
    0, tick, 0, 0, tick * 0.72, 0
  ], 3));
  const tickMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const ticks = new THREE.LineSegments(tickGeometry, tickMaterial);
  group.add(ticks);

  group.userData.phase = phase;
  group.userData.materials = [wire.material, ringMaterial, tickMaterial];

  return group;
}

function buildTelemetry(layout) {
  const { anchors: a, unit } = layout;
  const group = new THREE.Group();
  group.name = 'telemetry-nodes';

  const definitions = [
    { key: 'cpu', position: new THREE.Vector3(a.cpu.x, a.cpu.y + 3.0 * unit, a.cpu.z + 3.0 * unit), color: '#f59e0b', phase: 0.0 },
    { key: 'cooler', position: new THREE.Vector3(a.cooler.x + 7.0 * unit, a.cooler.y + 8.0 * unit, a.cooler.z + 2.0 * unit), color: '#34d399', phase: 1.2 },
    { key: 'gpu', position: new THREE.Vector3(a.gpu.x + 10.0 * unit, a.gpu.y + 2.0 * unit, a.gpu.z + 2.0 * unit), color: '#fb7185', phase: 2.1 },
    { key: 'ram', position: new THREE.Vector3(a.ram.x, a.ram.y + 9.0 * unit, a.ram.z + 1.0 * unit), color: '#38bdf8', phase: 3.3 },
    { key: 'nvme', position: new THREE.Vector3(a.nvme.x, a.nvme.y - 2.0 * unit, a.nvme.z + 2.0 * unit), color: '#a78bfa', phase: 4.4 },
    { key: 'radiator', position: new THREE.Vector3(a.radiator.x - 16.0 * unit, a.radiator.y + 3.0 * unit, a.radiator.z + 4.0 * unit), color: '#22d3ee', phase: 5.2 }
  ];

  const nodes = definitions.map((definition) => {
    const node = createTelemetryNode(definition.position, new THREE.Color(definition.color), unit, definition.phase);
    node.name = `telemetry-${definition.key}`;
    group.add(node);
    return node;
  });

  return { group, nodes };
}

/* ========================================================================== */
/*  Main factory                                                              */
/* ========================================================================== */

/**
 * Creates the airflow, signal, AI and coolant overlay group.
 *
 * @param {THREE.Scene|THREE.Group} scene Parent object the group is added to.
 * @param {object} [options]
 * @param {object} [options.anchors] Anchor overrides (see AIRFLOW_ANCHORS).
 * @param {object} [options.bounds] Chassis bounds override.
 * @param {number} [options.scale=1] Uniform layout multiplier.
 * @param {number} [options.thermalLoad=0.35] Initial thermal load (0..1).
 * @param {number} [options.aiLoad=0.12] Initial AI load (0..1).
 * @param {number} [options.particleCount=5200] Airflow particle count.
 * @param {number} [options.aiPacketCount=260] AI packet count.
 * @param {number} [options.coolantParticleCount=260] Coolant particle count.
 * @param {number} [options.viewportHeight=900] Viewport height for point size.
 * @param {number} [options.pixelRatio=1] Device pixel ratio.
 * @param {number} [options.fov=45] Camera vertical FOV.
 * @param {THREE.Vector3|object} [options.position] Group position.
 * @param {boolean} [options.showAirflow=true]
 * @param {boolean} [options.showSignals=true]
 * @param {boolean} [options.showAiFlow=true]
 * @param {boolean} [options.showAiLattice] Defaults to false when
 *   `options.anchors.tensorMatrix` is supplied (the rig already builds a
 *   tensor matrix there). Set true to add this module's multi-layer lattice.
 * @param {boolean} [options.showLiquidLoop] Defaults to false when
 *   `options.anchors.liquidCooler` is supplied (the rig already has one).
 * @param {Array} [options.coolantPath] Optional closed path for coolant
 *   particles only (useful to follow the rig's own tube geometry).
 * @param {boolean} [options.showTelemetry=true]
 * @returns {object} See module header.
 */
export function createAirflowAndSignals(scene, options = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new TypeError('createAirflowAndSignals: a THREE.Scene or Group is required');
  }

  const config = options || {};
  const layout = resolveLayout(config);
  const random = createRandom(config.seed ?? 20261117);

  const group = new THREE.Group();
  group.name = 'airflowAndSignals';
  if (config.position) {
    group.position.copy(toVector3(config.position, [0, 0, 0]));
  }

  const state = {
    thermal: clamp01(finiteOr(config.thermalLoad, 0.35)),
    thermalTarget: clamp01(finiteOr(config.thermalLoad, 0.35)),
    ai: clamp01(finiteOr(config.aiLoad, 0.12)),
    aiTarget: clamp01(finiteOr(config.aiLoad, 0.12)),
    explode: 0,
    time: 0,
    lastElapsed: 0,
    elapsedSeen: false,
    disposed: false,
    frame: 0
  };

  const viewport = {
    height: Math.max(120, readNumber(config.viewportHeight, 900)),
    pixelRatio: clamp(readNumber(config.pixelRatio, 1), 0.25, 4)
  };

  const resources = [];

  const computeViewScale = () => {
    const fov = THREE.MathUtils.degToRad(clamp(readNumber(config.fov, 45), 10, 120));
    return (viewport.height * viewport.pixelRatio) / (2 * Math.tan(fov / 2));
  };

  const anchorsProvided = !!(config.anchors && typeof config.anchors === 'object');
  const rigHasLattice = anchorsProvided && config.anchors.tensorMatrix !== undefined;
  const rigHasLiquid = anchorsProvided && (config.anchors.liquidCooler !== undefined || config.anchors.reservoir !== undefined);

  /* ------------------------------- Airflow ------------------------------- */

  let airflow = null;
  if (config.showAirflow !== false) {
    const particleCount = Math.max(600, Math.round(readNumber(config.particleCount, 8000)));
    airflow = buildAirflowPoints(layout, random, particleCount);
    airflow.material.uniforms.uViewScale.value = computeViewScale();
    airflow.material.uniforms.uThermal.value = state.thermal;
    group.add(airflow.points, airflow.guides);
    resources.push(airflow.points.geometry, airflow.material, airflow.guideMaterial, airflow.texture);
    airflow.guides.traverse((child) => {
      if (child.isLine && child.geometry) resources.push(child.geometry);
    });
  }

  /* --------------------------- PCB signal traces ------------------------- */

  let signalGroup = null;
  let signalTraces = [];
  if (config.showSignals !== false) {
    const built = buildSignalTraces(layout, config);
    signalGroup = built.group;
    signalTraces = built.traces;
    group.add(signalGroup);
    for (const trace of signalTraces) {
      resources.push(trace.geometry, trace.material);
    }
    signalGroup.traverse((child) => {
      if (child.isMesh && child.geometry && child.material) {
        if (!signalTraces.some((trace) => trace.mesh === child)) {
          resources.push(child.geometry, child.material);
        }
      }
    });
  }

  /* ------------------------------ AI overlay ----------------------------- */

  let aiGroup = null;
  let aiPackets = null;
  let aiRibbon = null;
  let lattice = null;
  let aiGroupBaseY = 0;

  if (config.showAiFlow !== false) {
    aiGroup = new THREE.Group();
    aiGroup.name = 'ai-workload-overlay';

    aiRibbon = buildAiRibbon(layout, config);
    aiGroup.add(aiRibbon.mesh);
    resources.push(aiRibbon.geometry, aiRibbon.material);

    const packetCount = Math.max(60, Math.round(readNumber(config.aiPacketCount, 260)));
    aiPackets = buildAiPackets(layout, random, packetCount);
    aiPackets.material.uniforms.uViewScale.value = computeViewScale();
    aiPackets.material.uniforms.uAi.value = state.ai;
    aiGroup.add(aiPackets.points);
    resources.push(aiPackets.points.geometry, aiPackets.material, aiPackets.texture);

    const showLattice = config.showAiLattice !== undefined ? !!config.showAiLattice : !rigHasLattice;
    if (showLattice) {
      const latticeSize = {
        x: readNumber(config.latticeWidth, 12) * layout.unit,
        y: readNumber(config.latticeHeight, 10) * layout.unit,
        z: readNumber(config.latticeDepth, 9) * layout.unit
      };
      const latticeCenter = config.latticeCenter
        ? toVector3(config.latticeCenter, [0, 0, 0])
        : new THREE.Vector3(
            layout.anchors.tensorMatrix.x + 9 * layout.unit,
            layout.anchors.tensorMatrix.y + 5.5 * layout.unit,
            layout.anchors.tensorMatrix.z + 5 * layout.unit
          );

      lattice = buildNeuralLattice(latticeCenter, latticeSize, layout.unit);
      lattice.nodeMaterial.uniforms.uViewScale.value = computeViewScale();
      lattice.nodeMaterial.uniforms.uAi.value = state.ai;
      lattice.edgeMaterial.uniforms.uAi.value = state.ai;
      aiGroup.add(lattice.group);
      resources.push(
        lattice.group.children[0].geometry,
        lattice.nodeMaterial,
        lattice.group.children[1].geometry,
        lattice.edgeMaterial,
        lattice.group.children[2].geometry,
        lattice.frameMaterial
      );
    }

    aiGroupBaseY = aiGroup.position.y;
    group.add(aiGroup);
  }

  /* ---------------------------- Liquid cooling --------------------------- */

  let liquid = null;
  const showLiquid = config.showLiquidLoop !== undefined
    ? !!config.showLiquidLoop
    : Array.isArray(config.coolantPath) || !rigHasLiquid;
  if (showLiquid) {
    liquid = buildCoolantLoop(layout, config);
    liquid.particleMaterial.uniforms.uViewScale.value = computeViewScale();
    group.add(liquid.group);
    resources.push(liquid.particleMaterial, liquid.particleTexture);
    if (liquid.shellMaterial) resources.push(liquid.shellMaterial);
    if (liquid.flowMaterial) resources.push(liquid.flowMaterial);
    liquid.group.traverse((child) => {
      if ((child.isMesh || child.isLineSegments) && child.geometry && child.material) {
        resources.push(child.geometry, child.material);
      }
    });
  }

  /* ------------------------------ Telemetry ------------------------------ */

  let telemetry = null;
  if (config.showTelemetry !== false) {
    telemetry = buildTelemetry(layout);
    group.add(telemetry.group);
    for (const node of telemetry.nodes) {
      node.traverse((child) => {
        if ((child.isMesh || child.isLineSegments) && child.geometry && child.material) {
          resources.push(child.geometry, child.material);
        }
      });
    }
  }

  scene.add(group);

  /* ------------------------------- API ---------------------------------- */

  const applyLoads = () => {
    const thermal = state.thermal;
    const ai = state.ai;

    if (airflow) {
      airflow.material.uniforms.uThermal.value = thermal;
      airflow.material.uniforms.uTime.value = state.time;
      airflow.guideMaterial.uniforms.uThermal.value = thermal;
      airflow.guideMaterial.uniforms.uTime.value = state.time;
    }
    if (aiPackets) {
      aiPackets.material.uniforms.uAi.value = ai;
      aiPackets.material.uniforms.uThermal.value = thermal;
      aiPackets.material.uniforms.uTime.value = state.time;
    }
    if (lattice) {
      lattice.nodeMaterial.uniforms.uAi.value = ai;
      lattice.nodeMaterial.uniforms.uTime.value = state.time;
      lattice.edgeMaterial.uniforms.uAi.value = ai;
      lattice.edgeMaterial.uniforms.uTime.value = state.time;
    }
    if (liquid) {
      const load = clamp01(0.18 + thermal * 0.55 + ai * 0.45);
      if (liquid.flowMaterial && liquid.flowMaterial.uniforms) {
        liquid.flowMaterial.uniforms.uLoad.value = load;
        liquid.flowMaterial.uniforms.uTime.value = state.time;
      }
      liquid.particleMaterial.uniforms.uLoad.value = load;
      liquid.particleMaterial.uniforms.uTime.value = state.time;
    }
  };

  const setThermalLoad = (load) => {
    if (state.disposed) return;
    state.thermalTarget = clamp01(readNumber(load, state.thermalTarget));
  };

  const setAiLoad = (load) => {
    if (state.disposed) return;
    state.aiTarget = clamp01(readNumber(load, state.aiTarget));
  };

  const setExplode = (factor) => {
    if (state.disposed) return;
    const value = clamp01(readNumber(factor, 0));
    state.explode = value;
    state.explodeTarget = value;

    for (const trace of signalTraces) {
      trace.material.uniforms.uExplode.value = value;
    }
    if (aiRibbon) aiRibbon.material.uniforms.uExplode.value = value;
    if (airflow) airflow.material.uniforms.uExplode.value = value;
    if (aiPackets) aiPackets.material.uniforms.uExplode.value = value;
    if (lattice) {
      lattice.nodeMaterial.uniforms.uExplode.value = value;
      lattice.edgeMaterial.uniforms.uExplode.value = value;
    }
    if (aiGroup) {
      aiGroup.position.y = aiGroupBaseY + value * 4.5 * layout.unit;
    }
    if (liquid) {
      if (liquid.shellMaterial) liquid.shellMaterial.opacity = 0.22 * (1 - 0.55 * value);
      if (liquid.flowMaterial && liquid.flowMaterial.uniforms) {
        liquid.flowMaterial.uniforms.uOpacity.value = 0.8 * (1 - 0.5 * value);
      }
      liquid.particleMaterial.uniforms.uOpacity.value = 1 - 0.45 * value;
    }
  };

  const update = (elapsed, delta, cameraPos) => {
    if (state.disposed) return;

    const elapsedValue = finiteOr(elapsed, state.lastElapsed);
    let dt;
    if (typeof delta === 'number' && Number.isFinite(delta)) {
      dt = clamp(delta, 0, 0.1);
    } else if (state.elapsedSeen) {
      dt = clamp(elapsedValue - state.lastElapsed, 0, 0.1);
    } else {
      dt = 1 / 60;
    }
    state.lastElapsed = elapsedValue;
    state.elapsedSeen = true;
    state.time += dt;
    state.frame += 1;

    const thermalEase = 1 - Math.exp(-dt * 2.6);
    const aiEase = 1 - Math.exp(-dt * 2.0);
    state.thermal += (state.thermalTarget - state.thermal) * thermalEase;
    state.ai += (state.aiTarget - state.ai) * aiEase;

    applyLoads();

    // Camera proximity lifts brightness when the viewer leans into the cooler.
    let proximity = 0.35;
    const camera = cameraPos && cameraPos.isCamera ? cameraPos.position : cameraPos;
    if (camera && Number.isFinite(camera.x) && Number.isFinite(camera.y) && Number.isFinite(camera.z)) {
      const center = layout.anchors.cooler;
      const dx = camera.x - center.x;
      const dy = camera.y - center.y;
      const dz = camera.z - center.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      proximity = clamp01(1 - smoothstep(20 * layout.unit, 110 * layout.unit, distance) * 0.9);
    }

    if (airflow) {
      airflow.material.uniforms.uOpacity.value = 0.72 + proximity * 0.22;
      airflow.guideMaterial.uniforms.uOpacity.value = (0.5 + proximity * 0.3) * (1 - state.explode * 0.5);
    }
    for (const trace of signalTraces) {
      trace.material.uniforms.uTime.value = state.time;
      trace.material.uniforms.uOpacity.value = 0.6 + proximity * 0.25;
    }
    if (aiRibbon) {
      aiRibbon.material.uniforms.uTime.value = state.time;
      aiRibbon.material.uniforms.uOpacity.value = (0.35 + 0.65 * state.ai) * (0.8 + proximity * 0.2);
    }
    if (lattice) {
      lattice.frameMaterial.opacity = 0.06 + 0.10 * state.ai;
    }

    if (telemetry) {
      for (const node of telemetry.nodes) {
        const phase = node.userData.phase;
        const pulse = 0.5 + 0.5 * Math.sin(state.time * 1.25 + phase);
        node.scale.setScalar(1 + pulse * 0.08);
        node.rotation.y = state.time * 0.18 + phase;
        const materials = node.userData.materials;
        materials[0].opacity = 0.20 + pulse * 0.26;
        materials[1].opacity = 0.12 + pulse * 0.20;
        materials[2].opacity = 0.08 + pulse * 0.14;
      }
    }
  };

  const getState = () => ({
    particleCount: airflow ? airflow.particleCount : 0,
    laneCount: airflow ? airflow.laneCount : 0,
    aiPacketCount: aiPackets ? aiPackets.points.geometry.getAttribute('aLane').count : 0,
    coolantParticles: liquid ? liquid.count : 0,
    signalTraceCount: signalTraces.length,
    latticeNodes: lattice ? lattice.nodeCount : 0,
    latticeEdges: lattice ? lattice.edgeCount : 0,
    thermalLoad: state.thermal,
    thermalTarget: state.thermalTarget,
    aiLoad: state.ai,
    aiTarget: state.aiTarget,
    explode: state.explode,
    time: state.time,
    frames: state.frame,
    disposed: state.disposed
  });

  const dispose = () => {
    if (state.disposed) return;
    state.disposed = true;

    group.traverse((child) => {
      if (child.isMesh || child.isPoints || child.isLine || child.isLineSegments) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
          else child.material.dispose();
        }
      }
    });

    const seen = new Set();
    for (const resource of resources) {
      if (!resource || seen.has(resource)) continue;
      seen.add(resource);
      if (typeof resource.dispose === 'function') resource.dispose();
    }

    if (group.parent) group.parent.remove(group);
  };

  return {
    group,
    anchors: layout.anchors,
    bounds: layout.bounds,
    setThermalLoad,
    setAiLoad,
    setExplode,
    update,
    getState,
    dispose
  };
}

export default createAirflowAndSignals;
