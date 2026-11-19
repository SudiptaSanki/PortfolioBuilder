/**
 * aeroWorld.js
 * ---------------------------------------------------------------------------
 * Aero Pilot — a fully procedural 3D flight world for the Aero Pilot
 * open-world portfolio.
 *
 * One continuous scroll drives a complete flight:
 *
 *   0.00 – 0.15  Departure cockpit & runway 09L (dawn)
 *   0.15 – 0.38  Rotation, steep climb through cloud decks
 *   0.38 – 0.65  Cruise above a sea of instanced clouds, morning → sunset
 *   0.65 – 0.85  Night descent over a glowing city grid
 *   0.85 – 1.00  Final approach & touchdown, runway 27R
 *
 * Everything is generated at runtime: geometry, shaders, lights, sky, clouds,
 * city, airports and aircraft. No textures, no models, no files.
 *
 * World scale: 1 unit = 10 m. A 3 km runway is 300 units, a 42 m airliner is
 * 4.2 units, cruise altitude 11,000 m is 1,100 units.
 *
 * Usage (see README / integrator):
 *   const world = createAeroWorld(scene, { camera });
 *   // every frame:
 *   world.update(elapsed, delta, scrollProgress /* 0..1 *\/, camera);
 *   const pose = world.getFlightPose(scrollProgress);
 *
 * Camera: a PerspectiveCamera(55–60°) with near ~0.05–0.15 and far >= 8000 is
 * required (the sky dome follows the camera, the cloud deck spans ~10,000 units
 * and the destination airport is ~3,000 units away).
 * ---------------------------------------------------------------------------
 */

import * as THREE from 'three';

/* ========================================================================== *
 *  Constants
 * ========================================================================== */

/** World units per metre (1 world unit = 10 m). */
export const WORLD_UNITS_PER_METER = 0.1;

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/** Layout anchors (world units). */
const DEPARTURE_RUNWAY = {
  name: '09L',
  centerX: -40,
  z: 0,
  length: 300,
  width: 4.6,
  heading: 0 // 090° → +X
};

const DESTINATION_RUNWAY = {
  name: '27R',
  thresholdX: -2700,
  endX: -3000,
  z: 0,
  width: 4.6,
  heading: Math.PI // 270° → -X
};

/** Phase table exported for HUD / section mapping. */
export const FLIGHT_PHASES = [
  {
    id: 'departure',
    start: 0.0,
    end: 0.15,
    name: 'Departure · RWY 09L',
    title: 'Flight deck',
    caption: 'Runway 09L · take-off clearance',
    timeOfDay: '05:38 · Dawn',
    utcOffset: 5.5
  },
  {
    id: 'climb',
    start: 0.15,
    end: 0.38,
    name: 'Rotation & Climb',
    title: 'Lift-off',
    caption: 'Positive rate · gear up',
    timeOfDay: '06:21 · Morning',
    utcOffset: 6.1
  },
  {
    id: 'cruise',
    start: 0.38,
    end: 0.65,
    name: 'Cruise · FL370',
    title: 'Above the weather',
    caption: 'Ocean of cloud · timezone shift',
    timeOfDay: '18:47 · Golden hour',
    utcOffset: 7.2
  },
  {
    id: 'descent',
    start: 0.65,
    end: 0.85,
    name: 'Descent · Night City',
    title: 'City lights',
    caption: 'Descending over the grid',
    timeOfDay: '22:14 · Night',
    utcOffset: 8.0
  },
  {
    id: 'approach',
    start: 0.85,
    end: 1.0,
    name: 'Final Approach · RWY 27R',
    title: 'Touchdown',
    caption: 'Runway 27R · welcome',
    timeOfDay: '23:04 · Night',
    utcOffset: 8.0
  }
];

/* ========================================================================== *
 *  Small math helpers
 * ========================================================================== */

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function finite(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
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

/** Frame-rate independent exponential approach. */
function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * Math.max(0, dt));
}

/** Deterministic PRNG so the world is identical on every load. */
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

function randomRange(rng, min, max) {
  return min + (max - min) * rng();
}

/* ========================================================================== *
 *  GLSL noise shared by several procedural materials
 * ========================================================================== */

const GLSL_NOISE = `
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
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

float fbm2(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += valueNoise2(p) * amp;
    p = p * 2.03 + vec2(17.3, 9.7);
    amp *= 0.5;
  }
  return sum;
}

float fbm3(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += valueNoise3(p) * amp;
    p = p * 2.01 + vec311;
    amp *= 0.5;
  }
  return sum;
}

float ridged2(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += (1.0 - abs(valueNoise2(p) * 2.0 - 1.0)) * amp;
    p = p * 2.07 + vec2(5.1, 11.4);
    amp *= 0.5;
  }
  return sum;
}
`.replace('vec311', 'vec3(31.1, 7.3, 13.7)');

/* ========================================================================== *
 *  Sky dome shader — Rayleigh / Mie style gradient, sun, moon, stars
 * ========================================================================== */

const SKY_VERT = /* glsl */ `
varying vec3 vDir;

void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position.z = gl_Position.w; // keep the dome at the far plane
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
uniform float uSunPower;
uniform float uStars;
uniform float uMoon;
uniform float uHaze;
uniform float uTime;

varying vec3 vDir;

${GLSL_NOISE}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;

  // vertical gradient
  float up = pow(clamp(h, 0.0, 1.0), 0.19);
  vec3 col = mix(uHorizon, uZenith, up);

  // below the horizon: haze into the ground tone
  vec3 low = mix(uHorizon * 0.62, uGround, smoothstep(0.0, -0.30, h));
  col = mix(col, low, smoothstep(0.02, -0.02, h));

  // horizon haze band
  float band = exp(-abs(h) * mix(28.0, 9.0, uHaze));
  col += uHorizon * band * 0.32 * uHaze;
  col += uCityGlow * exp(-abs(h) * 20.0) * uHaze * 1.25;

  // sun: small disc, tight glow, broad glow
  float sd = max(dot(d, uSunDir), 0.0);
  col += uSunColor * pow(sd, 2600.0) * 2.2 * uSunPower;
  col += uSunColor * pow(sd, 64.0) * 0.32 * uSunPower;
  col += uSunColor * pow(sd, 7.0) * 0.07 * uSunPower;

  // warm belt along the sun's azimuth, hugging the horizon
  vec2 dz = normalize(d.xz + vec2(1e-5));
  vec2 sz = normalize(uSunDir.xz + vec2(1e-5));
  float az = pow(max(dot(dz, sz), 0.0), 3.0);
  float belt = exp(-pow((h - 0.01) / 0.15, 2.0));
  col += uSunColor * az * belt * 0.26 * uSunPower;

  // stars
  if (uStars > 0.002) {
    vec3 sp = d * 260.0;
    vec3 cell = floor(sp);
    float seed = hash13(cell);
    vec3 f = fract(sp) - 0.5;
    float dd = length(f);
    float star = smoothstep(0.9972, 1.0, seed) * smoothstep(0.36, 0.0, dd);
    float tw = 0.72 + 0.28 * sin(uTime * (0.5 + seed * 5.0) + seed * 63.0);
    col += vec3(0.78, 0.84, 1.0) * star * tw * uStars * 2.6 * smoothstep(-0.04, 0.12, h);

    float gb = exp(-pow(dot(d, normalize(vec3(0.35, 0.30, -0.89))), 2.0) * 24.0);
    col += vec3(0.10, 0.12, 0.21) * gb * uStars * 0.55 * (0.55 + 0.45 * fbm3(d * 5.0));
  }

  // moon disc with a soft halo and faint maria
  float md = dot(d, normalize(uMoonDir));
  float disc = smoothstep(0.99960, 0.99982, md);
  float halo = pow(max(md, 0.0), 380.0) * 0.5 + pow(max(md, 0.0), 26.0) * 0.055;
  float maria = 0.88 + 0.12 * fbm3(d * 190.0);
  col += (vec3(0.94, 0.96, 1.0) * disc * maria * 1.4 + vec3(0.42, 0.55, 0.88) * halo) * uMoon;

  // dither to break banding in the gradients
  col += (hash12(gl_FragCoord.xy) - 0.5) * 0.0045;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ========================================================================== *
 *  Billboard cloud puff shader (instanced, camera facing, procedurally lit)
 * ========================================================================== */

const PUFF_VERT = /* glsl */ `
attribute vec3 aOffset;
attribute vec2 aScale;
attribute float aSeed;

uniform float uTime;
uniform vec3 uWind;

varying vec2 vUv;
varying float vSeed;
varying vec3 vWorld;
varying float vFade;

void main() {
  vec3 center = aOffset + uWind * (uTime * 0.55 + aSeed * 18.0);
  vec4 mv = viewMatrix * vec4(center, 1.0);

  float rot = aSeed * 6.28318;
  float cs = cos(rot);
  float sn = sin(rot);
  vec2 p = vec2(position.x * cs - position.y * sn, position.x * sn + position.y * cs);
  mv.xy += p * aScale;

  vUv = uv;
  vSeed = aSeed;
  vWorld = center;
  vFade = smoothstep(2.0, 46.0, -mv.z) * smoothstep(9000.0, 2600.0, -mv.z);

  gl_Position = projectionMatrix * mv;
}
`;

const PUFF_FRAG = /* glsl */ `
uniform vec3 uLit;
uniform vec3 uShadow;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uOpacity;
uniform float uBright;

varying vec2 vUv;
varying float vSeed;
varying vec3 vWorld;
varying float vFade;

${GLSL_NOISE}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.15) discard;

  float n = fbm2(vUv * 2.6 + vSeed * 37.0);
  float n2 = fbm2(vUv * 6.5 - vSeed * 11.0);

  // irregular cauliflower silhouette
  float silhouette = r + (n - 0.5) * 0.42 + (n2 - 0.5) * 0.16;
  float shape = smoothstep(1.0, 0.18, silhouette);
  float alpha = shape * uOpacity * vFade;
  if (alpha < 0.004) discard;

  // lumpy normal, key light from the sun
  vec3 nrm = normalize(vec3(p.x * 1.5, p.y * 1.7 + 0.5, 0.95 - n * 0.4));
  float key = clamp(dot(nrm, normalize(uSunDir)), 0.0, 1.0);
  float top = smoothstep(-0.4, 0.8, p.y + (n - 0.5) * 0.6);

  vec3 col = mix(uShadow * 0.95, uLit, clamp(top * 0.7 + key * 0.45, 0.0, 1.0));
  col += uSunColor * pow(key, 2.2) * 0.55;
  col += uSunColor * smoothstep(0.62, 1.0, r) * pow(key, 2.6) * 0.45;

  col *= uBright * 1.05;

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ========================================================================== *
 *  Sea of clouds — a huge drifting layer with billowy, sun-lit tops
 * ========================================================================== */

const CLOUD_SEA_VERT = /* glsl */ `
varying vec3 vWorld;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const CLOUD_SEA_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uLit;
uniform vec3 uShadow;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform vec3 uHorizon;
uniform vec3 uCityGlow;
uniform vec2 uCameraXZ;
uniform vec2 uClearCenter;
uniform float uCoverage;
uniform float uNight;
uniform float uCameraY;

varying vec3 vWorld;

${GLSL_NOISE}

float cloudHeight(vec2 p) {
  float n1 = fbm2(p * 0.9);
  float n2 = valueNoise2(p * 2.4 + 13.0);
  float n3 = valueNoise2(p * 5.1 + 41.0);
  float street = fbm2(p * 0.35 + 71.0);
  return n1 * 0.52 + n2 * 0.32 + n3 * 0.16 + street * 0.18;
}

void main() {
  vec2 q = vWorld.xz * 0.0075 + vec2(uTime * 0.005, uTime * 0.003);
  float h = cloudHeight(q);

  float e = 0.004;
  float hx = cloudHeight(q + vec2(e, 0.0)) - cloudHeight(q - vec2(e, 0.0));
  float hz = cloudHeight(q + vec2(0.0, e)) - cloudHeight(q - vec2(0.0, e));

  vec3 nrm = normalize(vec3(-hx * 34.0, 1.0, -hz * 34.0));
  vec3 sunDirN = normalize(uSunDir);
  float sunDot = clamp(dot(nrm, sunDirN), 0.0, 1.0);
  float top = smoothstep(0.26, 0.60, h);

  float shade = clamp(top * 0.72 + sunDot * 0.5, 0.0, 1.0);
  vec3 col = mix(uShadow, uLit, shade);
  col *= 0.86 + 0.26 * top;
  col += uSunColor * pow(sunDot, 4.0) * 0.3;
  col += uSunColor * pow(clamp((h - 0.45) * 3.0, 0.0, 1.0), 2.0) * 0.18;

  // warm bounce from the city below at night
  float cityDist = length(vWorld.xz - uClearCenter);
  col += uCityGlow * (1.0 - smoothstep(700.0, 3000.0, cityDist)) * uNight * 0.45;

  // atmospheric fade towards the horizon
  float dist = length(vWorld.xz - uCameraXZ);
  float fade = 1.0 - smoothstep(2400.0, 4600.0, dist);
  col = mix(uHorizon * 0.95, col, fade);

  // dissolve the plane's outer edge
  float edge = 1.0 - smoothstep(4600.0, 5700.0, length(vWorld.xz - vec2(-700.0, 250.0)));

  // hide the deck once the aircraft has descended below it
  float side = smoothstep(195.0, 250.0, uCameraY);

  gl_FragColor = vec4(col, uCoverage * edge * side);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ========================================================================== *
 *  City ground — dark blocks with glowing street grid
 * ========================================================================== */

const CITY_GROUND_VERT = /* glsl */ `
varying vec3 vWorld;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const CITY_GROUND_FRAG = /* glsl */ `
uniform vec3 uRoadGlow;
uniform vec3 uBlockTint;
uniform vec3 uHorizon;
uniform vec2 uCenter;
uniform vec2 uAirport;
uniform float uGlow;
uniform float uTime;

varying vec3 vWorld;

${GLSL_NOISE}

void main() {
  vec2 q = vWorld.xz;
  vec2 cell = floor(q / 18.0);

  vec2 local = abs(fract(q / 18.0 + 0.5) - 0.5) * 18.0;
  float road = 1.0 - smoothstep(0.30, 1.05, min(local.x, local.y));

  float blockHash = hash12(cell * 1.37);
  vec3 col = uBlockTint * (0.45 + 0.95 * blockHash);

  vec2 majorLocal = abs(fract(q / 90.0 + 0.5) - 0.5) * 90.0;
  float major = 1.0 - smoothstep(0.45, 1.5, min(majorLocal.x, majorLocal.y));

  float roadGain = 0.035 + 0.10 * hash12(cell * 3.1);
  col += uRoadGlow * road * uGlow * roadGain;
  col += uRoadGlow * major * uGlow * 0.10;

  // keep the airfield and its approach corridor dark
  float ax = abs(q.x - uAirport.x);
  float az = abs(q.y - uAirport.y);
  float field = smoothstep(0.0, 380.0, max(ax - 430.0, az - 280.0));
  col = mix(vec3(0.007, 0.008, 0.011) * (0.8 + 0.4 * blockHash), col, field);

  float d = length(q - uCenter);
  col = mix(col, uHorizon, smoothstep(1500.0, 2650.0, d));

  float haze = fbm2(q * 0.004 + uTime * 0.004);
  col += vec3(0.05, 0.028, 0.012) * uGlow * smoothstep(0.42, 0.95, haze) * 0.25;

  float ex = abs(q.x - uCenter.x) / 1400.0;
  float ez = abs(q.y - uCenter.y) / 1310.0;
  float edgeDist = max(ex, ez);
  float edgeFade = 1.0 - smoothstep(0.66, 0.94, edgeDist);
  col = mix(vec3(0.006, 0.006, 0.008), col, edgeFade);
  gl_FragColor = vec4(col, 1.0 - smoothstep(0.945, 0.995, edgeDist));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ========================================================================== *
 *  Glow points (runway lights, city windows, street lamps, cars)
 * ========================================================================== */

const POINTS_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;

uniform float uPixelRatio;
uniform float uSizeScale;
uniform float uTime;
uniform float uTwinkle;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  float dist = max(-mv.z, 0.5);
  gl_PointSize = clamp(aSize * uSizeScale * uPixelRatio * 300.0 / dist, 1.0, 96.0);

  float tw = 0.84 + 0.16 * sin(uTime * (0.6 + fract(aPhase) * 2.2) + aPhase * 21.0);
  vColor = aColor;
  vAlpha = mix(1.0, tw, uTwinkle) * smoothstep(0.0, 22.0, dist);
}
`;

const POINTS_FRAG = /* glsl */ `
uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 7.0);
  float halo = exp(-r2 * 1.7) * 0.30;
  float a = (core + halo) * vAlpha * uOpacity;
  if (a < 0.002) discard;
  gl_FragColor = vec4(vColor * (1.0 + core * 0.8), a);
}
`;

/* ========================================================================== *
 *  Cockpit instrument screens (PFD / ND / EICAS) — fully procedural
 * ========================================================================== */

const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SCREEN_FRAG = /* glsl */ `
uniform float uMode;
uniform float uPitch;
uniform float uRoll;
uniform float uHeading;
uniform float uSpd;
uniform float uAlt;
uniform float uBright;
uniform float uTime;

varying vec2 vUv;

float lineMask(float x, float w) {
  return 1.0 - smoothstep(0.0, w, abs(x));
}

void main() {
  vec2 uv = vUv;
  vec3 col = vec3(0.004, 0.011, 0.013);

  // screen bezel falloff
  float edge = smoothstep(0.0, 0.055, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  col *= 0.5 + 0.5 * edge;

  if (uMode < 0.5) {
    // ---- Primary Flight Display ----
    vec2 p = uv - vec2(0.5, 0.46);
    float s = sin(uRoll);
    float c = cos(uRoll);
    vec2 q = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
    float horizon = clamp(uPitch, -1.0, 1.0) * 0.26;
    float d = q.y - horizon;

    vec3 skyC = vec3(0.035, 0.20, 0.46);
    vec3 gndC = vec3(0.28, 0.15, 0.06);
    col = mix(gndC, skyC, step(0.0, d));

    // pitch ladder
    for (int i = -4; i <= 4; i++) {
      if (i == 0) continue;
      float y = horizon + float(i) * 0.072;
      float w = 0.080 - abs(float(i)) * 0.007;
      float m = lineMask(q.y - y, 0.0035) * step(abs(q.x), w);
      col = mix(col, vec3(0.90, 0.95, 1.0), m * 0.8);
    }
    col = mix(col, vec3(1.0), lineMask(d, 0.0032));

    // bank arc + pointer
    float r = length(p);
    float ang = atan(p.x, p.y);
    float arc = step(0.31, r) * step(r, 0.345) * step(abs(ang), 0.66);
    float ptr = step(0.30, r) * step(r, 0.37) * step(abs(ang), 0.025);
    col = mix(col, vec3(0.9, 0.95, 1.0), arc * 0.65);
    col = mix(col, vec3(1.0, 0.85, 0.2), ptr);

    // speed / altitude tapes
    float tapes = step(0.03, uv.x) * step(uv.x, 0.16) * step(0.16, uv.y) * step(uv.y, 0.76);
    tapes += step(0.84, uv.x) * step(uv.x, 0.97) * step(0.16, uv.y) * step(uv.y, 0.76);
    col += vec3(0.018, 0.05, 0.055) * tapes;

    for (int i = 0; i < 9; i++) {
      float ty = 0.18 + float(i) * 0.062;
      float wl = 0.105 + 0.02 * mod(float(i), 3.0);
      col = mix(col, vec3(0.75, 0.86, 0.9), step(wl, uv.x) * step(uv.x, 0.148) * lineMask(uv.y - ty, 0.0035));
      float wr = 0.905 + 0.02 * mod(float(i), 2.0);
      col = mix(col, vec3(0.75, 0.86, 0.9), step(0.852, uv.x) * step(uv.x, wr) * lineMask(uv.y - ty, 0.0035));
    }

    // flight director cross
    col = mix(col, vec3(1.0, 0.25, 0.85), lineMask(p.x, 0.005) * step(0.075, abs(p.y)) * step(abs(p.y), 0.16));
    col = mix(col, vec3(1.0, 0.25, 0.85), lineMask(p.y + 0.02, 0.005) * step(0.09, abs(p.x)) * step(abs(p.x), 0.20));

    // aircraft reference symbol
    float wing = lineMask(q.y, 0.008) * step(abs(q.x), 0.10) * step(0.025, abs(q.x));
    float dotC = 1.0 - smoothstep(0.012, 0.02, length(q));
    col = mix(col, vec3(0.02), wing);
    col = mix(col, vec3(0.02), dotC * 0.9);
    col = mix(col, vec3(0.9), lineMask(q.y - 0.018, 0.004) * step(abs(q.x), 0.07));

  } else if (uMode < 1.5) {
    // ---- Navigation Display ----
    vec2 p = uv - 0.5;
    float r = length(p);
    col = vec3(0.003, 0.010, 0.008);

    float ringOuter = lineMask(r - 0.36, 0.004) * step(r, 0.40);
    float ringInner = lineMask(r - 0.24, 0.003);
    col = mix(col, vec3(0.35, 0.62, 0.45), ringOuter * 0.9);
    col = mix(col, vec3(0.22, 0.42, 0.30), ringInner * 0.7);

    float ang = atan(p.x, p.y);
    float tick = smoothstep(0.90, 1.0, cos(ang * 36.0)) * step(0.335, r) * step(r, 0.385);
    col = mix(col, vec3(0.55, 0.85, 0.62), tick * 0.8);
    float tickMajor = smoothstep(0.96, 1.0, cos(ang * 6.0)) * step(0.305, r) * step(r, 0.385);
    col = mix(col, vec3(0.75, 0.95, 0.8), tickMajor * 0.9);

    // magenta route from the aircraft to a waypoint ahead
    vec2 wp = normalize(vec2(0.35, 0.94)) * 0.40;
    vec2 dir = wp;
    float along = clamp(dot(p, normalize(dir)), 0.0, 1.0);
    float off = abs(p.x * normalize(dir).y - p.y * normalize(dir).x);
    col = mix(col, vec3(0.95, 0.25, 0.85), lineMask(off, 0.005) * step(0.0, along) * step(along, 0.38) * step(r, 0.36));

    // aircraft symbol
    float ac = lineMask(p.y, 0.005) * step(abs(p.x), 0.07) * step(0.012, abs(p.x));
    col = mix(col, vec3(0.95), ac);
    col = mix(col, vec3(0.95), (1.0 - smoothstep(0.008, 0.014, length(p))) * 0.9);

    // heading bug
    float hb = step(0.90, cos((ang - 0.5) * 1.0)) * step(0.34, r) * step(r, 0.40);
    col = mix(col, vec3(0.3, 0.9, 1.0), hb);

  } else {
    // ---- EICAS / engine display ----
    col = vec3(0.004, 0.010, 0.012);
    for (int k = 0; k < 2; k++) {
      float x0 = k == 0 ? 0.24 : 0.62;
      float bar = step(x0, uv.x) * step(uv.x, x0 + 0.14) * step(0.20, uv.y) * step(uv.y, 0.78);
      col += vec3(0.02, 0.06, 0.06) * bar;
      float lvl = 0.42 + 0.18 * sin(uTime * 0.7 + float(k));
      float fill = step(x0, uv.x) * step(uv.x, x0 + 0.14) * step(0.20, uv.y) * step(uv.y, 0.20 + lvl * 0.58);
      col = mix(col, vec3(0.25, 0.95, 0.65), fill * 0.8);
      for (int j = 0; j < 6; j++) {
        float ty = 0.22 + float(j) * 0.10;
        col = mix(col, vec3(0.5, 0.7, 0.6), step(x0 - 0.02, uv.x) * step(uv.x, x0) * lineMask(uv.y - ty, 0.004));
      }
      col = mix(col, vec3(0.85, 0.9, 0.9), lineMask(uv.x - (x0 + 0.14), 0.002) * step(0.20, uv.y) * step(uv.y, 0.78));
    }
    // fuel / status strip
    float strip = step(0.18, uv.y) * step(uv.y, 0.24) * step(0.2, uv.x) * step(uv.x, 0.8);
    col += vec3(0.03, 0.09, 0.05) * strip;
    col = mix(col, vec3(0.3, 0.9, 0.6), lineMask(uv.y - 0.21, 0.004) * step(0.22, uv.x) * step(uv.x, 0.55));
  }

  col *= uBright;
  col *= 0.94 + 0.06 * sin(uTime * 9.0 + vUv.y * 40.0);

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/* ========================================================================== *
 *  Flight path — one continuous spline from runway 09L to runway 27R
 * ========================================================================== */

/** Local forward axis of the aircraft is +Z (nose), up +Y, right +X. */
function createFlightCurve() {
  const points = [
    // departure: threshold 09L → ground roll east
    new THREE.Vector3(-185, 0.38, 0),
    new THREE.Vector3(-140, 0.38, 0),
    new THREE.Vector3(-80, 0.38, 0),
    new THREE.Vector3(-20, 0.38, 0),
    new THREE.Vector3(40, 0.38, 0),
    // rotation
    new THREE.Vector3(95, 1.4, 0),
    new THREE.Vector3(140, 5.5, 0.5),
    // climb out, turning right (south)
    new THREE.Vector3(190, 9, 9),
    new THREE.Vector3(255, 20, 34),
    new THREE.Vector3(325, 35, 82),
    new THREE.Vector3(390, 57, 152),
    new THREE.Vector3(430, 86, 240),
    new THREE.Vector3(438, 120, 335),
    new THREE.Vector3(405, 161, 420),
    new THREE.Vector3(340, 200, 486),
    new THREE.Vector3(245, 236, 532),
    new THREE.Vector3(125, 262, 556),
    // cruise west above the cloud sea
    new THREE.Vector3(-40, 280, 558),
    new THREE.Vector3(-260, 292, 528),
    new THREE.Vector3(-500, 297, 474),
    new THREE.Vector3(-760, 296, 408),
    new THREE.Vector3(-1020, 290, 342),
    new THREE.Vector3(-1270, 279, 285),
    new THREE.Vector3(-1520, 261, 238),
    new THREE.Vector3(-1740, 237, 200),
    // descent over the city
    new THREE.Vector3(-1940, 204, 168),
    new THREE.Vector3(-2120, 164, 136),
    new THREE.Vector3(-2270, 122, 104),
    new THREE.Vector3(-2390, 84, 74),
    new THREE.Vector3(-2480, 60, 48),
    new THREE.Vector3(-2550, 38, 28),
    new THREE.Vector3(-2605, 22, 14),
    new THREE.Vector3(-2650, 11, 6),
    // threshold 27R, flare, touchdown, rollout west
    new THREE.Vector3(-2695, 3.4, 1.4),
    new THREE.Vector3(-2740, 0.7, 0),
    new THREE.Vector3(-2790, 0.38, 0),
    new THREE.Vector3(-2880, 0.38, 0),
    new THREE.Vector3(-2985, 0.38, 0)
  ];


  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  curve.arcLengthDivisions = 3000;
  curve.updateArcLengths();
  return curve;
}

/**
 * Nearest arc-length parameter to a world point, used to anchor the milestone
 * progress values onto the actual spline.
 */
function nearestU(curve, point, samples = 1400) {
  let best = 0;
  let bestDist = Infinity;
  const p = new THREE.Vector3();
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    curve.getPointAt(u, p);
    const d = p.distanceToSquared(point);
    if (d < bestDist) {
      bestDist = d;
      best = u;
    }
  }
  return best;
}

/* ========================================================================== *
 *  Environment keyframes — sky, sun, moon, fog, cloud tint
 * ========================================================================== */

const ENV_KEYS = [
  {
    p: 0.0,
    sunElev: 7.5,
    sunAzim: 96,
    moonElev: -20,
    moonAzim: 40,
    zenith: 0x2d5f9a,
    horizon: 0xf6c096,
    ground: 0x3a2c2a,
    sunColor: 0xffc489,
    sunIntensity: 2.3,
    sunSkyPower: 1.0,
    hemiSky: 0x9dc2e8,
    hemiGround: 0x4a3a2e,
    hemiIntensity: 0.62,
    ambient: 0.16,
    fogColor: 0xe4c4a6,
    fogDensity: 0.00046,
    stars: 0.05,
    moon: 0.0,
    cityGlow: 0x2a1a12,
    haze: 0.85,
    cloudLit: 0xffd9b8,
    cloudShadow: 0x8a8096,
    cloudSun: 0xffc58f,
    cloudCoverage: 0.0,
    cityLights: 0.55
  },
  {
    p: 0.16,
    sunElev: 13,
    sunAzim: 104,
    moonElev: -18,
    moonAzim: 40,
    zenith: 0x2f6cb4,
    horizon: 0xe8d7c4,
    ground: 0x3a3428,
    sunColor: 0xffe2bd,
    sunIntensity: 2.7,
    sunSkyPower: 1.0,
    hemiSky: 0xa9cbeb,
    hemiGround: 0x4f4432,
    hemiIntensity: 0.7,
    ambient: 0.18,
    fogColor: 0xd9cec4,
    fogDensity: 0.00032,
    stars: 0.0,
    moon: 0.0,
    cityGlow: 0x1c1410,
    haze: 0.6,
    cloudLit: 0xffffff,
    cloudShadow: 0x9aa3b8,
    cloudSun: 0xffe6c6,
    cloudCoverage: 0.0,
    cityLights: 0.35
  },
  {
    p: 0.30,
    sunElev: 26,
    sunAzim: 152,
    moonElev: -12,
    moonAzim: 42,
    zenith: 0x2a67b2,
    horizon: 0xd6e7f3,
    ground: 0x4c4a34,
    sunColor: 0xfff4e0,
    sunIntensity: 3.1,
    sunSkyPower: 1.0,
    hemiSky: 0xb6d8f2,
    hemiGround: 0x5c5a3e,
    hemiIntensity: 0.78,
    ambient: 0.2,
    fogColor: 0xd3e0ea,
    fogDensity: 0.00018,
    stars: 0.0,
    moon: 0.0,
    cityGlow: 0x120e0a,
    haze: 0.45,
    cloudLit: 0xffffff,
    cloudShadow: 0xc2cbdc,
    cloudSun: 0xfff6e8,
    cloudCoverage: 0.0,
    cityLights: 0.2
  },
  {
    p: 0.42,
    sunElev: 19,
    sunAzim: 208,
    moonElev: -6,
    moonAzim: 44,
    zenith: 0x2b5f9e,
    horizon: 0xf7d7ae,
    ground: 0x50462f,
    sunColor: 0xffdd9e,
    sunIntensity: 2.9,
    sunSkyPower: 1.0,
    hemiSky: 0xa9c8e8,
    hemiGround: 0x665334,
    hemiIntensity: 0.68,
    ambient: 0.19,
    fogColor: 0xecd6b8,
    fogDensity: 0.00016,
    stars: 0.0,
    moon: 0.0,
    cityGlow: 0x1a120c,
    haze: 0.5,
    cloudLit: 0xfffaf2,
    cloudShadow: 0xc3c8d8,
    cloudSun: 0xffd9a4,
    cloudCoverage: 0.0,
    cityLights: 0.25
  },
  {
    p: 0.52,
    sunElev: 10,
    sunAzim: 236,
    moonElev: 2,
    moonAzim: 48,
    zenith: 0x284a80,
    horizon: 0xffb274,
    ground: 0x4a3826,
    sunColor: 0xffb877,
    sunIntensity: 2.3,
    sunSkyPower: 1.0,
    hemiSky: 0x93a8cc,
    hemiGround: 0x6a4a2c,
    hemiIntensity: 0.55,
    ambient: 0.17,
    fogColor: 0xf0b98a,
    fogDensity: 0.0002,
    stars: 0.05,
    moon: 0.05,
    cityGlow: 0x2c1a10,
    haze: 0.65,
    cloudLit: 0xffdcc2,
    cloudShadow: 0xa99ab0,
    cloudSun: 0xffab6a,
    cloudCoverage: 0.0,
    cityLights: 0.55
  },
  {
    p: 0.60,
    sunElev: 2.5,
    sunAzim: 250,
    moonElev: 8,
    moonAzim: 52,
    zenith: 0x223a72,
    horizon: 0xff7f56,
    ground: 0x3a2a26,
    sunColor: 0xff8a54,
    sunIntensity: 1.5,
    sunSkyPower: 1.0,
    hemiSky: 0x7d8cb8,
    hemiGround: 0x6a3e28,
    hemiIntensity: 0.42,
    ambient: 0.15,
    fogColor: 0xd97a58,
    fogDensity: 0.00022,
    stars: 0.22,
    moon: 0.15,
    cityGlow: 0x39201a,
    haze: 0.75,
    cloudLit: 0xffb59a,
    cloudShadow: 0x6f5570,
    cloudSun: 0xff8e57,
    cloudCoverage: 0.0,
    cityLights: 0.8
  },
  {
    p: 0.66,
    sunElev: -3,
    sunAzim: 258,
    moonElev: 14,
    moonAzim: 58,
    zenith: 0x0b1430,
    horizon: 0x5a4258,
    ground: 0x1a1418,
    sunColor: 0xd06348,
    sunIntensity: 0.35,
    sunSkyPower: 0.6,
    hemiSky: 0x4b5a80,
    hemiGround: 0x4a2e24,
    hemiIntensity: 0.28,
    ambient: 0.12,
    fogColor: 0x5b3550,
    fogDensity: 0.00024,
    stars: 0.6,
    moon: 0.35,
    cityGlow: 0x4a2a1c,
    haze: 0.5,
    cloudLit: 0x9c7f9c,
    cloudShadow: 0x3c3452,
    cloudSun: 0xd07a5a,
    cloudCoverage: 0.0,
    cityLights: 1.0
  },
  {
    p: 0.73,
    sunElev: -8,
    sunAzim: 262,
    moonElev: 20,
    moonAzim: 64,
    zenith: 0x04081a,
    horizon: 0x1c2334,
    ground: 0x080a12,
    sunColor: 0x4c4a60,
    sunIntensity: 0.06,
    sunSkyPower: 0.08,
    hemiSky: 0x2b3758,
    hemiGround: 0x2a1c18,
    hemiIntensity: 0.66,
    ambient: 0.2,
    fogColor: 0x1d1a2b,
    fogDensity: 0.00028,
    stars: 0.9,
    moon: 0.7,
    cityGlow: 0x5a3520,
    haze: 0.34,
    cloudLit: 0x6a6480,
    cloudShadow: 0x1e2036,
    cloudSun: 0x8a7a8a,
    cloudCoverage: 0.0,
    cityLights: 1.0
  },
  {
    p: 0.82,
    sunElev: -12,
    sunAzim: 266,
    moonElev: 26,
    moonAzim: 70,
    zenith: 0x040814,
    horizon: 0x1e2434,
    ground: 0x06080f,
    sunColor: 0x383a4c,
    sunIntensity: 0.02,
    sunSkyPower: 0.0,
    hemiSky: 0x1d2742,
    hemiGround: 0x241610,
    hemiIntensity: 0.62,
    ambient: 0.19,
    fogColor: 0x171526,
    fogDensity: 0.0003,
    stars: 1.0,
    moon: 0.85,
    cityGlow: 0x6b3d22,
    haze: 0.28,
    cloudLit: 0x5c5878,
    cloudShadow: 0x2a2e46,
    cloudSun: 0x6a5f74,
    cloudCoverage: 0.0,
    cityLights: 1.0
  },
  {
    p: 1.0,
    sunElev: -14,
    sunAzim: 270,
    moonElev: 32,
    moonAzim: 76,
    zenith: 0x03060f,
    horizon: 0x1b2130,
    ground: 0x05070c,
    sunColor: 0x2a2830,
    sunIntensity: 0.01,
    sunSkyPower: 0.0,
    hemiSky: 0x18203a,
    hemiGround: 0x201410,
    hemiIntensity: 0.58,
    ambient: 0.18,
    fogColor: 0x121020,
    fogDensity: 0.00032,
    stars: 0.95,
    moon: 0.9,
    cityGlow: 0x6f4024,
    haze: 0.26,
    cloudLit: 0x545070,
    cloudShadow: 0x252940,
    cloudSun: 0x5f5670,
    cloudCoverage: 0.0,
    cityLights: 1.0
  }
];

// convert colours once
for (const key of ENV_KEYS) {
  for (const field of [
    'zenith',
    'horizon',
    'ground',
    'sunColor',
    'hemiSky',
    'hemiGround',
    'fogColor',
    'cityGlow',
    'cloudLit',
    'cloudShadow',
    'cloudSun'
  ]) {
    key[field] = new THREE.Color(key[field]);
  }
}

function sampleEnv(progress, out) {
  const p = clamp01(progress);
  let i = 0;
  while (i < ENV_KEYS.length - 2 && p > ENV_KEYS[i + 1].p) i++;
  const a = ENV_KEYS[i];
  const b = ENV_KEYS[i + 1] || a;
  const t = clamp01((p - a.p) / Math.max(1e-5, b.p - a.p));

  out.sunElev = lerp(a.sunElev, b.sunElev, t);
  out.sunAzim = lerp(a.sunAzim, b.sunAzim, t);
  out.moonElev = lerp(a.moonElev, b.moonElev, t);
  out.moonAzim = lerp(a.moonAzim, b.moonAzim, t);
  out.sunIntensity = lerp(a.sunIntensity, b.sunIntensity, t);
  out.sunSkyPower = lerp(a.sunSkyPower, b.sunSkyPower, t);
  out.hemiIntensity = lerp(a.hemiIntensity, b.hemiIntensity, t);
  out.ambient = lerp(a.ambient, b.ambient, t);
  out.fogDensity = lerp(a.fogDensity, b.fogDensity, t);
  out.stars = lerp(a.stars, b.stars, t);
  out.moon = lerp(a.moon, b.moon, t);
  out.haze = lerp(a.haze, b.haze, t);
  out.cloudCoverage = lerp(a.cloudCoverage, b.cloudCoverage, t);
  out.cityLights = lerp(a.cityLights, b.cityLights, t);

  out.zenith.lerpColors(a.zenith, b.zenith, t);
  out.horizon.lerpColors(a.horizon, b.horizon, t);
  out.ground.lerpColors(a.ground, b.ground, t);
  out.sunColor.lerpColors(a.sunColor, b.sunColor, t);
  out.hemiSky.lerpColors(a.hemiSky, b.hemiSky, t);
  out.hemiGround.lerpColors(a.hemiGround, b.hemiGround, t);
  out.fogColor.lerpColors(a.fogColor, b.fogColor, t);
  out.cityGlow.lerpColors(a.cityGlow, b.cityGlow, t);
  out.cloudLit.lerpColors(a.cloudLit, b.cloudLit, t);
  out.cloudShadow.lerpColors(a.cloudShadow, b.cloudShadow, t);
  out.cloudSun.lerpColors(a.cloudSun, b.cloudSun, t);

  return out;
}

function createEnvSample() {
  return {
    sunElev: 0,
    sunAzim: 90,
    moonElev: 0,
    moonAzim: 0,
    sunIntensity: 0,
    sunSkyPower: 0,
    hemiIntensity: 0,
    ambient: 0,
    fogDensity: 0.0002,
    stars: 0,
    moon: 0,
    haze: 0.5,
    cloudCoverage: 0,
    cityLights: 0,
    zenith: new THREE.Color(),
    horizon: new THREE.Color(),
    ground: new THREE.Color(),
    sunColor: new THREE.Color(),
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    fogColor: new THREE.Color(),
    cityGlow: new THREE.Color(),
    cloudLit: new THREE.Color(),
    cloudShadow: new THREE.Color(),
    cloudSun: new THREE.Color()
  };
}

/* ========================================================================== *
 *  Flight data — altitude, speed, clock and phase labels
 * ========================================================================== */

const FLIGHT_KEYS = [
  { p: 0.0, alt: 0, ias: 0, mach: 0.0, utc: 5.5 },
  { p: 0.04, alt: 0, ias: 45, mach: 0.07, utc: 5.5 },
  { p: 0.08, alt: 0, ias: 105, mach: 0.16, utc: 5.6 },
  { p: 0.12, alt: 0, ias: 148, mach: 0.22, utc: 5.6 },
  { p: 0.15, alt: 0, ias: 162, mach: 0.25, utc: 5.7 },
  { p: 0.175, alt: 150, ias: 172, mach: 0.27, utc: 5.7 },
  { p: 0.21, alt: 2400, ias: 215, mach: 0.36, utc: 5.9 },
  { p: 0.26, alt: 7200, ias: 268, mach: 0.48, utc: 6.0 },
  { p: 0.31, alt: 15500, ias: 312, mach: 0.62, utc: 6.2 },
  { p: 0.36, alt: 26500, ias: 338, mach: 0.76, utc: 6.4 },
  { p: 0.40, alt: 33000, ias: 462, mach: 0.82, utc: 6.6 },
  { p: 0.47, alt: 36800, ias: 484, mach: 0.85, utc: 7.0 },
  { p: 0.58, alt: 37000, ias: 481, mach: 0.85, utc: 7.5 },
  { p: 0.65, alt: 35500, ias: 448, mach: 0.84, utc: 8.0 },
  { p: 0.70, alt: 28500, ias: 382, mach: 0.78, utc: 8.0 },
  { p: 0.75, alt: 19800, ias: 318, mach: 0.66, utc: 8.0 },
  { p: 0.80, alt: 11200, ias: 262, mach: 0.50, utc: 8.0 },
  { p: 0.85, alt: 4200, ias: 198, mach: 0.33, utc: 8.0 },
  { p: 0.90, alt: 2200, ias: 168, mach: 0.27, utc: 8.0 },
  { p: 0.95, alt: 900, ias: 152, mach: 0.24, utc: 8.0 },
  { p: 0.98, alt: 120, ias: 144, mach: 0.22, utc: 8.0 },
  { p: 1.0, alt: 0, ias: 96, mach: 0.15, utc: 8.0 }
];

function phaseIndexFor(p) {
  for (let i = FLIGHT_PHASES.length - 1; i >= 0; i--) {
    if (p >= FLIGHT_PHASES[i].start - 1e-6) return i;
  }
  return 0;
}

function sampleFlightData(progress, out) {
  const p = clamp01(progress);
  let i = 0;
  while (i < FLIGHT_KEYS.length - 2 && p > FLIGHT_KEYS[i + 1].p) i++;
  const a = FLIGHT_KEYS[i];
  const b = FLIGHT_KEYS[i + 1];
  const t = clamp01((p - a.p) / Math.max(1e-5, b.p - a.p));

  out.altitudeFt = lerp(a.alt, b.alt, t);
  out.airspeedKts = lerp(a.ias, b.ias, t);
  out.mach = lerp(a.mach, b.mach, t);
  out.utcOffset = lerp(a.utc, b.utc, t);

  const idx = phaseIndexFor(p);
  out.phaseIndex = idx;
  out.phaseId = FLIGHT_PHASES[idx].id;
  out.phaseName = FLIGHT_PHASES[idx].name;
  out.timeOfDay = FLIGHT_PHASES[idx].timeOfDay;
  return out;
}

/* ========================================================================== *
 *  Camera choreography — keys in aircraft-local space (or world space)
 * ========================================================================== */

const CAMERA_KEYS = [
  // ---- cockpit: runway 09L ----
  { p: 0.0, space: 'local', pos: [-0.075, 0.062, 1.715], look: [0.0, -0.01, 6.0], up: 'craft', sway: 0.0009 },
  { p: 0.115, space: 'local', pos: [-0.075, 0.063, 1.715], look: [0.0, -0.005, 6.0], up: 'craft', sway: 0.0012 },
  { p: 0.145, space: 'local', pos: [-0.075, 0.069, 1.715], look: [0.0, 0.03, 6.0], up: 'craft', sway: 0.002 },

  // ---- rotation: rise out of the seat, out through the windshield ----
  { p: 0.156, space: 'local', pos: [-0.075, 0.085, 1.75], look: [0.0, 0.06, 6.0], up: 'craft', sway: 0.003 },
  { p: 0.171, space: 'local', pos: [-0.07, 0.10, 2.30], look: [0.0, 0.16, 6.0], up: 'craft', sway: 0.012 },
  { p: 0.190, space: 'local', pos: [-4.5, 1.0, 2.2], look: [0.0, 0.0, 0.2], up: 'blend', sway: 0.02 },
  { p: 0.225, space: 'local', pos: [-7.5, 2.2, 1.5], look: [0.0, 0.0, 0.4], up: 'blend', sway: 0.022 },
  { p: 0.270, space: 'local', pos: [-9.5, 3.2, -4.5], look: [0.0, 0.0, 0.6], up: 'blend', sway: 0.02 },
  { p: 0.330, space: 'local', pos: [-10.5, 4.2, -7.5], look: [0.0, 0.0, 0.8], up: 'blend', sway: 0.018 },

  // ---- cruise: three-quarter, side, high chase ----
  { p: 0.390, space: 'local', pos: [9.5, 3.2, -6.8], look: [0.0, 0.0, 0.6], up: 'blend', sway: 0.016 },
  { p: 0.450, space: 'local', pos: [7.0, 2.0, 2.8], look: [0.0, 0.05, 0.5], up: 'blend', sway: 0.012 },
  { p: 0.510, space: 'local', pos: [-6.5, 1.6, 2.2], look: [0.0, 0.0, 0.3], up: 'blend', sway: 0.012 },
  { p: 0.565, space: 'local', pos: [-9.0, 3.0, -3.8], look: [0.0, 0.0, 0.7], up: 'blend', sway: 0.012 },
  { p: 0.615, space: 'local', pos: [-11.0, 4.6, -9.5], look: [0.0, 0.0, 0.9], up: 'blend', sway: 0.014 },

  // ---- night descent over the city ----
  { p: 0.665, space: 'local', pos: [-11.5, 5.0, -10.5], look: [0.0, 0.0, 1.1], up: 'blend', sway: 0.014 },
  { p: 0.720, space: 'local', pos: [-8.5, 2.8, -8.0], look: [0.0, -0.1, 1.2], up: 'blend', sway: 0.014 },
  { p: 0.780, space: 'local', pos: [-7.5, 2.3, -6.5], look: [0.0, -0.12, 1.0], up: 'blend', sway: 0.012 },

  // ---- final approach: over the left wing, runway ahead ----
  { p: 0.828, space: 'local', pos: [-7.5, 2.6, -9.0], look: [0.0, -0.05, 10.0], up: 'blend', sway: 0.01 },
  { p: 0.862, space: 'local', pos: [-6.5, 2.2, -8.0], look: [0.0, -0.05, 10.0], up: 'blend', sway: 0.009 },
  { p: 0.905, space: 'local', pos: [-5.5, 1.9, -7.0], look: [0.0, -0.08, 12.0], up: 'blend', sway: 0.008 },
  { p: 0.945, space: 'local', pos: [-5.0, 1.8, -6.0], look: [0.0, -0.10, 12.0], up: 'blend', sway: 0.006 },

  // ---- touchdown, tracking alongside the runway ----
  { p: 0.968, space: 'local', pos: [-17.0, 1.7, -2.5], look: [0.0, 0.25, 0.4], up: 'world', sway: 0.006 },
  { p: 1.0, space: 'local', pos: [-26.0, 2.6, -3.6], look: [0.0, 0.25, 0.4], up: 'world', sway: 0.004 }
];

/* ========================================================================== *
 *  Module state
 * ========================================================================== */

/* ========================================================================== *
 *  Shared helpers for procedural point lights / glow sprites
 * ========================================================================== */

function parseGlowEntries(list) {
  const count = list.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const e = list[i];
    positions[i * 3] = e.x;
    positions[i * 3 + 1] = e.y;
    positions[i * 3 + 2] = e.z;
    color.set(e.color === undefined ? 0xffffff : e.color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    sizes[i] = e.size === undefined ? 1 : e.size;
    phases[i] = e.phase === undefined ? (i * 0.37) % 1 : e.phase;
  }

  return { positions, colors, sizes, phases, count };
}

function buildGlowPoints(shared, entries, opts = {}) {
  if (!entries.length) return null;

  const data = parseGlowEntries(entries);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(data.sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(data.phases, 1));
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: shared.pixelRatio,
      uTime: shared.time,
      uSizeScale: { value: opts.sizeScale === undefined ? 1 : opts.sizeScale },
      uTwinkle: { value: opts.twinkle === undefined ? 0 : opts.twinkle },
      uOpacity: { value: opts.opacity === undefined ? 1 : opts.opacity }
    },
    vertexShader: POINTS_VERT,
    fragmentShader: POINTS_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false
  });

  const points = new THREE.Points(geometry, material);
  points.name = opts.name || 'GlowPoints';
  points.frustumCulled = false;
  points.renderOrder = opts.renderOrder === undefined ? 0 : opts.renderOrder;
  points.userData.opacity = material.uniforms.uOpacity;
  return points;
}

/* ========================================================================== *
 *  Sky dome
 * ========================================================================== */

function buildSky(shared) {
  const uniforms = {
    uZenith: { value: new THREE.Color(0x2a67b2) },
    uHorizon: { value: new THREE.Color(0xd6e7f3) },
    uGround: { value: new THREE.Color(0x2a2622) },
    uSunDir: { value: new THREE.Vector3(0.4, 0.2, 0.5) },
    uSunColor: { value: new THREE.Color(0xffd39a) },
    uMoonDir: { value: new THREE.Vector3(0.2, 0.4, -0.8) },
    uCityGlow: { value: new THREE.Color(0x000000) },
    uSunPower: { value: 1 },
    uStars: { value: 0 },
    uMoon: { value: 0 },
    uHaze: { value: 0.5 },
    uTime: shared.time
  };

  const geometry = new THREE.SphereGeometry(3800, 48, 28);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    fog: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'AeroSky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;

  return { mesh, uniforms, material };
}

/* ========================================================================== *
 *  Terrain — patchwork fields around the departure airport
 * ========================================================================== */

function hash2D(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise2D(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash2D(xi, zi);
  const b = hash2D(xi + 1, zi);
  const c = hash2D(xi, zi + 1);
  const d = hash2D(xi + 1, zi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm2D(x, z) {
  let sum = 0;
  let amp = 0.5;
  let fx = x;
  let fz = z;
  for (let i = 0; i < 4; i++) {
    sum += valueNoise2D(fx, fz) * amp;
    fx = fx * 2.03 + 11.7;
    fz = fz * 2.01 + 7.3;
    amp *= 0.5;
  }
  return sum;
}

function terrainHeightAt(x, z) {
  const dep = Math.hypot(x - 0, z - 0);
  const dest = Math.hypot(x + 2850, z - 0);
  const flat = Math.min(smoothstep(420, 1200, dep), smoothstep(520, 1200, dest));
  const n = fbm2D(x * 0.0035, z * 0.0035);
  const ridge = Math.abs(fbm2D(x * 0.0012 + 4.2, z * 0.0012 - 2.1) - 0.5) * 2;
  let h = (n - 0.5) * 46 * flat + ridge * 30 * flat;

  // the city sits on level ground: flatten the terrain across its footprint
  const dx = Math.max(-3420 - x, 0, x + 1520);
  const dz = Math.max(-860 - z, 0, z - 860);
  const cityOut = Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
  const cityFlat = 1 - smoothstep(0, 950, cityOut);
  h *= 1 - cityFlat;
  return h;
}

function buildTerrain(shared, materials) {
  const size = 4200;
  const segments = 110;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const rng = mulberry32(7331);
  const palette = [
    new THREE.Color(0x3f5a2c),
    new THREE.Color(0x4c6733),
    new THREE.Color(0x5c743b),
    new THREE.Color(0x6b7a3f),
    new THREE.Color(0x7d7a44),
    new THREE.Color(0x354e26),
    new THREE.Color(0x8a8450)
  ];

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setY(i, terrainHeightAt(x, z));

    // patchwork: big rotated cells give fields, borders read as hedgerows
    const cx = Math.floor((x * 0.84 + z * 0.54) / 46);
    const cz = Math.floor((z * 0.84 - x * 0.54) / 31);
    const cell = hash2D(cx * 3.7, cz * 5.1);
    const shade = palette[Math.floor(cell * palette.length) % palette.length];
    const border =
      Math.min(
        Math.abs(((x * 0.84 + z * 0.54) / 46) % 1 - 0.5),
        Math.abs(((z * 0.84 - x * 0.54) / 31) % 1 - 0.5)
      ) < 0.018
        ? 0.72
        : 1;
    const tint = 0.88 + rng() * 0.22;
    let cr = shade.r * border * tint;
    let cg = shade.g * border * tint;
    let cb = shade.b * border * tint;

    // the ground around the night city turns to dark urban earth
    const cdx = Math.max(-3420 - x, 0, x + 1520);
    const cdz = Math.max(-860 - z, 0, z - 860);
    const cityOut = Math.hypot(Math.max(cdx, 0), Math.max(cdz, 0));
    const urban = 1 - smoothstep(0, 1100, cityOut);
    const urb = 0.05 + rng() * 0.02;
    cr = lerp(cr, urb, urban * 0.94);
    cg = lerp(cg, urb * 0.95, urban * 0.94);
    cb = lerp(cb, urb * 1.05, urban * 0.94);

    colors[i * 3] = cr;
    colors[i * 3 + 1] = cg;
    colors[i * 3 + 2] = cb;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'AeroFields';
  mesh.receiveShadow = false;

  // low-poly conifers dotted over the fields, away from runways and the city
  const treeGeometry = new THREE.ConeGeometry(1.5, 8, 6, 1);
  treeGeometry.translate(0, 4, 0);
  const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x24401f, roughness: 0.95 });
  const treeCount = 620;
  const trees = new THREE.InstancedMesh(treeGeometry, treeMaterial, treeCount);
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const treeRng = mulberry32(4411);

  let placed = 0;
  let guard = 0;
  while (placed < treeCount && guard < treeCount * 20) {
    guard++;
    const x = (treeRng() - 0.5) * 3600;
    const z = (treeRng() - 0.5) * 3600;
    if (Math.hypot(x, z) < 400) continue; // keep the airfield clear
    if (x < -1200) continue; // keep the city area clear
    const s = 0.6 + treeRng() * 1.2;
    pos.set(x, terrainHeightAt(x, z) - 0.2, z);
    quat.setFromAxisAngle(WORLD_UP, treeRng() * TAU);
    scale.set(s, s * (0.8 + treeRng() * 0.6), s);
    matrix.compose(pos, quat, scale);
    trees.setMatrixAt(placed++, matrix);
  }
  trees.count = placed;
  trees.instanceMatrix.needsUpdate = true;
  trees.frustumCulled = false;
  trees.name = 'AeroTrees';

  const group = new THREE.Group();
  group.name = 'AeroTerrain';
  group.add(mesh);
  group.add(trees);
  materials.push(treeMaterial);
  return group;
}

/* ========================================================================== *
 *  Runways, taxiways and airports
 * ========================================================================== */

function buildRunway(config, shared, materials) {
  const group = new THREE.Group();
  group.name = 'Runway-' + config.name;

  const heading = config.heading; // +1 east, -1 west
  const thresholdX = config.thresholdX;
  const length = config.length;
  const width = config.width;
  const endX = thresholdX + heading * length;
  const centerX = thresholdX + heading * length * 0.5;

  const asphalt = new THREE.MeshStandardMaterial({
    color: 0x22262a,
    roughness: 0.9,
    metalness: 0.04
  });
  const shoulderMat = new THREE.MeshStandardMaterial({
    color: 0x2f3338,
    roughness: 0.95,
    metalness: 0.02
  });
  const markingMat = new THREE.MeshStandardMaterial({
    color: 0xd9dde2,
    roughness: 0.7,
    metalness: 0,
    emissive: 0x1a1c1f
  });

  materials.push(asphalt, shoulderMat, markingMat);

  // shoulders then asphalt
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(length + 26, 0.06, width + 8), shoulderMat);
  shoulder.position.set(centerX, 0.03, config.z);
  group.add(shoulder);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, width), asphalt);
  slab.position.set(centerX, 0.06, config.z);
  group.add(slab);

  // ----- painted markings (single instanced mesh) -----
  const marks = [];
  const pushMark = (offset, lateral, w, l) => {
    marks.push({ x: thresholdX + heading * offset, z: config.z + lateral, w, l });
  };

  // threshold piano keys
  const keyCount = 8;
  for (let i = 0; i < keyCount; i++) {
    const lateral = -width / 2 + 0.7 + (i * (width - 1.4)) / (keyCount - 1);
    pushMark(3.2, lateral, 0.34, 2.3);
  }
  // threshold line
  pushMark(0.7, 0, 0.45, width - 1.0);

  // edge lines
  pushMark(length / 2, width / 2 - 0.26, length - 8, 0.16);
  pushMark(length / 2, -(width / 2 - 0.26), length - 8, 0.16);

  // centreline dashes
  for (let d = 22; d < length - 14; d += 12) {
    pushMark(d, 0, 3.0, 0.22);
  }

  // aiming point (two thick blocks) and touchdown zone bars
  pushMark(52, 1.45, 6.0, 0.55);
  pushMark(52, -1.45, 6.0, 0.55);
  for (let i = 0; i < 3; i++) {
    const d = 78 + i * 26;
    pushMark(d, 1.45, 1.7, 0.42);
    pushMark(d, -1.45, 1.7, 0.42);
  }

  const markGeometry = new THREE.BoxGeometry(1, 1, 1);
  const markMesh = new THREE.InstancedMesh(markGeometry, markingMat, marks.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  marks.forEach((mk, i) => {
    v.set(mk.x, 0.115, mk.z);
    s.set(mk.w, 0.02, mk.l);
    m4.compose(v, q, s);
    markMesh.setMatrixAt(i, m4);
  });
  markMesh.instanceMatrix.needsUpdate = true;
  markMesh.frustumCulled = false;
  markMesh.name = 'RunwayMarkings';
  group.add(markMesh);

  // ----- edge / threshold / centreline light fixtures and glows -----
  const fixtures = [];
  const glows = [];
  const lampColor = config.night ? 0xfff0cf : 0xfff4dd;
  const edgeColor = config.night ? 0xffdca8 : 0xfff6e6;

  for (let d = 2; d < length; d += 6) {
    for (const side of [-1, 1]) {
      fixtures.push({
        x: thresholdX + heading * d,
        z: config.z + side * (width / 2 + 0.5)
      });
      glows.push({
        x: thresholdX + heading * d,
        y: 0.16,
        z: config.z + side * (width / 2 + 0.5),
        size: 0.55,
        color: edgeColor
      });
    }
  }

  // centreline lights — green at the threshold, white where it lands
  for (let d = 6; d < length; d += 12) {
    const color = d < 30 ? 0x66ffb0 : 0xdfe8ff;
    glows.push({ x: thresholdX + heading * d, y: 0.15, z: config.z, size: 0.32, color });
  }

  // threshold lights — green bar across
  for (let l = -width / 2; l <= width / 2; l += 1.6) {
    glows.push({ x: thresholdX, y: 0.18, z: config.z + l, size: 0.5, color: 0x62ff9d });
  }

  // runway end lights — red
  for (let l = -width / 2; l <= width / 2; l += 1.6) {
    glows.push({ x: endX, y: 0.18, z: config.z + l, size: 0.5, color: 0xff5a44 });
  }

  // PAPI — four lights on the left of the approach
  const leftSign = heading > 0 ? -1 : 1;
  const papiX = thresholdX + heading * 55;
  for (let i = 0; i < 4; i++) {
    const z = config.z + leftSign * (width / 2 + 5 + i * 1.4);
    glows.push({ x: papiX, y: 0.7, z, size: 0.9, color: i < 2 ? 0xfff2d0 : 0xff3a2a });
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.4),
      new THREE.MeshBasicMaterial({ color: i < 2 ? 0xfff2d0 : 0xff3a2a, toneMapped: false })
    );
    box.position.set(papiX, 0.35, z);
    group.add(box);
  }

  // fixture bodies
  const fixtureGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.3);
  const fixtureMat = new THREE.MeshBasicMaterial({ color: lampColor, toneMapped: false });
  const fixtureMesh = new THREE.InstancedMesh(fixtureGeometry, fixtureMat, fixtures.length);
  fixtures.forEach((f, i) => {
    v.set(f.x, 0.12, f.z);
    s.set(1, 1, 1);
    m4.compose(v, q, s);
    fixtureMesh.setMatrixAt(i, m4);
  });
  fixtureMesh.instanceMatrix.needsUpdate = true;
  fixtureMesh.frustumCulled = false;
  group.add(fixtureMesh);

  materials.push(fixtureMat);

  // ----- approach lighting system + sequenced flashers (destination) -----
  const flasherLights = [];
  if (config.approach) {
    const barMaterial = new THREE.MeshBasicMaterial({ color: 0xfff4e0, toneMapped: false });
    materials.push(barMaterial);
    const barGeometry = new THREE.BoxGeometry(0.55, 0.12, 0.2);
    const rows = 22;
    const approachStart = thresholdX - heading * 6;
    const approachEnd = thresholdX - heading * 290;
    const step = (approachEnd - approachStart) / (rows - 1);

    const barPositions = [];
    for (let r = 0; r < rows; r++) {
      const x = approachStart + step * r;
      const spread = 8.5;
      for (let k = 0; k < 5; k++) {
        const z = config.z + (k - 2) * (spread / 4);
        barPositions.push({ x, z });
        glows.push({ x, y: 0.5, z, size: 0.7, color: 0xfff6e4 });
      }
    }

    // crossbar near the threshold
    for (let k = -6; k <= 6; k++) {
      barPositions.push({ x: thresholdX - heading * 100, z: config.z + k * 1.6 });
      glows.push({ x: thresholdX - heading * 100, y: 0.5, z: config.z + k * 1.6, size: 0.65, color: 0xfff6e4 });
    }

    const barMesh = new THREE.InstancedMesh(barGeometry, barMaterial, barPositions.length);
    barPositions.forEach((b, i) => {
      v.set(b.x, 0.24, b.z);
      m4.compose(v, q, s.set(1, 1, 1));
      barMesh.setMatrixAt(i, m4);
    });
    barMesh.instanceMatrix.needsUpdate = true;
    barMesh.frustumCulled = false;
    group.add(barMesh);

    // sequenced flashers — 18 beads that chase towards the threshold
    const flashGeometry = new THREE.SphereGeometry(0.42, 8, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const flashMesh = new THREE.InstancedMesh(flashGeometry, flashMat, 18);
    for (let i = 0; i < 18; i++) {
      const d = 12 + i * 15;
      const x = thresholdX - heading * d;
      v.set(x, 0.5, config.z);
      m4.compose(v, q, s.set(1, 1, 1));
      flashMesh.setMatrixAt(i, m4);
      flashMesh.setColorAt(i, new THREE.Color(0x000000));
      flasherLights.push({ index: i });
    }
    flashMesh.instanceMatrix.needsUpdate = true;
    if (flashMesh.instanceColor) flashMesh.instanceColor.needsUpdate = true;
    flashMesh.frustumCulled = false;
    group.add(flashMesh);
    materials.push(flashMat);

    group.userData.flashers = flashMesh;
  }

  // REIL — flashing white bars at the threshold ends
  const reilMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  materials.push(reilMat);
  for (const side of [-1, 1]) {
    const reil = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 2.0), reilMat);
    reil.position.set(thresholdX + heading * 1.2, 0.7, config.z + side * (width / 2 + 3));
    group.add(reil);
  }
  group.userData.reilMaterial = reilMat;

  const glowPoints = buildGlowPoints(shared, glows, { sizeScale: config.night ? 1.45 : 0.9, name: 'RunwayLights' });
  if (glowPoints) group.add(glowPoints);

  group.userData.endX = endX;
  return group;
}

function buildTerminal(config, shared, materials) {
  const group = new THREE.Group();
  group.name = 'Terminal-' + (config.name || 'airport');

  const facadeMat = new THREE.MeshStandardMaterial({
    color: 0x2b3340,
    roughness: 0.5,
    metalness: 0.35
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x8f959c,
    roughness: 0.65,
    metalness: 0.3
  });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xffcf96, toneMapped: false });
  materials.push(facadeMat, roofMat, glassMat);

  const L = config.length || 96;
  const H = config.height || 8;
  const D = config.depth || 13;

  const body = new THREE.Mesh(new THREE.BoxGeometry(L, H, D), facadeMat);
  body.position.set(config.x, H / 2, config.z);
  group.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(L + 3, 0.7, D + 2.5), roofMat);
  roof.position.set(config.x, H + 0.35, config.z);
  group.add(roof);

  // lit window rows on the runway-facing facade
  const winGeometry = new THREE.PlaneGeometry(1, 1);
  const rows = 4;
  const cols = Math.floor(L / 3.2);
  const windows = new THREE.InstancedMesh(winGeometry, glassMat, rows * cols);
  const m4 = new THREE.Matrix4();
  const qq = new THREE.Quaternion();
  const vv = new THREE.Vector3();
  const ss = new THREE.Vector3();
  const colr = new THREE.Color();
  const faceZ = config.z + D / 2 + 0.06;
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = config.x - L / 2 + 1.8 + c * 3.2;
      const y = 1.8 + r * 1.65;
      vv.set(x, y, faceZ);
      ss.set(2.0, 0.9, 1);
      m4.compose(vv, qq, ss);
      windows.setMatrixAt(idx, m4);
      const warm = 0.55 + Math.random() * 0.45;
      colr.setRGB(1.0 * warm, 0.78 * warm, 0.5 * warm);
      windows.setColorAt(idx, colr);
      idx++;
    }
  }
  windows.instanceMatrix.needsUpdate = true;
  if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
  windows.frustumCulled = false;
  group.add(windows);

  // a couple of jet bridges
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x59626e, roughness: 0.6, metalness: 0.3 });
  materials.push(bridgeMat);
  for (let i = 0; i < 3; i++) {
    const bx = config.x - 26 + i * 26;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 10), bridgeMat);
    bridge.position.set(bx, 2.2, config.z + D / 2 + 5);
    bridge.rotation.y = 0.18 * (i - 1);
    group.add(bridge);
  }

  // apron slab
  const apronMat = new THREE.MeshStandardMaterial({ color: 0x34383d, roughness: 0.92 });
  materials.push(apronMat);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(L + 40, 0.06, 34), apronMat);
  apron.position.set(config.x, 0.02, config.z + D / 2 + 18);
  group.add(apron);

  // floodlight masts
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x555b62, roughness: 0.7, metalness: 0.4 });
  materials.push(mastMat);
  const glows = [];
  for (let i = 0; i < 4; i++) {
    const mx = config.x - L / 2 + 8 + i * ((L - 16) / 3);
    const mz = config.z + D / 2 + 22;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 8, 6), mastMat);
    mast.position.set(mx, 4, mz);
    group.add(mast);
    glows.push({ x: mx, y: 8.1, z: mz, size: 1.6, color: 0xffe6bb });
  }

  // control tower
  const towerX = config.towerX === undefined ? config.x - L / 2 - 26 : config.towerX;
  const towerZ = config.towerZ === undefined ? config.z - 12 : config.towerZ;
  const towerHeight = 11;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.7, towerHeight, 10), facadeMat);
  shaft.position.set(towerX, towerHeight / 2, towerZ);
  group.add(shaft);

  const cabMat = new THREE.MeshBasicMaterial({ color: 0x9fdcff, toneMapped: false });
  materials.push(cabMat);
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.6, 2.4, 10), cabMat);
  cab.position.set(towerX, towerHeight + 1.2, towerZ);
  group.add(cab);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.5, 10), roofMat);
  cap.position.set(towerX, towerHeight + 2.6, towerZ);
  group.add(cap);

  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false });
  materials.push(beaconMat);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), beaconMat);
  beacon.position.set(towerX, towerHeight + 3.1, towerZ);
  group.add(beacon);
  group.userData.beaconMaterial = beaconMat;

  glows.push({ x: towerX, y: towerHeight + 2.0, z: towerZ, size: 2.2, color: 0x9fdcff });

  const glowPoints = buildGlowPoints(shared, glows, { sizeScale: 1.1, name: 'TerminalLights' });
  if (glowPoints) group.add(glowPoints);

  return group;
}

/* ========================================================================== *
 *  Night city — instanced buildings, windows, streets, highways
 * ========================================================================== */

const CITY = {
  minX: -3420,
  maxX: -1520,
  minZ: -860,
  maxZ: 860,
  centerX: -2470,
  centerZ: 0
};

function buildCity(shared, materials) {
  const group = new THREE.Group();
  group.name = 'AeroNightCity';
  const rng = mulberry32(20261118);

  // ---- ground with glowing street grid ----
  const groundUniforms = {
    uRoadGlow: { value: new THREE.Color(0xffb066) },
    uBlockTint: { value: new THREE.Color(0x090c14) },
    uHorizon: { value: new THREE.Color(0x0a0b12) },
    uCenter: { value: new THREE.Vector2(CITY.centerX, CITY.centerZ) },
    uAirport: { value: new THREE.Vector2(-2850, 0) },
    uGlow: { value: 1 },
    uTime: shared.time
  };
  const groundMaterial = new THREE.ShaderMaterial({
    uniforms: groundUniforms,
    vertexShader: CITY_GROUND_VERT,
    fragmentShader: CITY_GROUND_FRAG,
    transparent: true,
    depthWrite: false,
    fog: false
  });
  materials.push(groundMaterial);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.maxX - CITY.minX + 900, CITY.maxZ - CITY.minZ + 900, 1, 1),
    groundMaterial
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((CITY.minX + CITY.maxX) / 2, 0.04, (CITY.minZ + CITY.maxZ) / 2);
  group.add(ground);

  // ---- buildings ----
  const buildings = [];
  const blockW = 24;
  const blockD = 22;

  for (let x = CITY.minX; x < CITY.maxX; x += blockW) {
    for (let z = CITY.minZ; z < CITY.maxZ; z += blockD) {
      // airport + approach corridor keep-out
      if (x < -2300 && Math.abs(z) < 330) continue;
      if (x > -3260 && x < -2320 && Math.abs(z) < 330) continue;

      const density = 0.62;
      if (rng() > density) continue;

      const cx = x + blockW * (0.3 + rng() * 0.4);
      const cz = z + blockD * (0.3 + rng() * 0.4);
      const downtown = Math.exp(
        -(Math.pow(cx + 2960, 2) + Math.pow(cz + 280, 2)) / (430 * 430)
      );
      const midtown = Math.exp(
        -(Math.pow(cx + 2360, 2) + Math.pow(cz - 470, 2)) / (330 * 330)
      );
      const cluster = Math.max(downtown, midtown * 0.65);
      const base = 1.2 + rng() * 5.6;
      const height = base + cluster * (16 + rng() * 22) + (rng() < 0.12 ? 9 : 0) + (rng() < 0.05 ? 12 : 0);

      const w = 6 + rng() * 9;
      const d = 6 + rng() * 8;
      buildings.push({ x: cx, z: cz, w, d, h: height, seed: rng() });
    }
  }

  // cap the count, keep the tallest
  if (buildings.length > 2600) {
    buildings.sort((a, b) => b.h - a.h);
    buildings.length = 2600;
  }

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b0f18,
    roughness: 0.85,
    metalness: 0.18
  });
  materials.push(buildingMaterial);

  const buildingMesh = new THREE.InstancedMesh(boxGeometry, buildingMaterial, buildings.length);
  const m4 = new THREE.Matrix4();
  const qq = new THREE.Quaternion();
  const vv = new THREE.Vector3();
  const ss = new THREE.Vector3();
  const col = new THREE.Color();

  buildings.forEach((b, i) => {
    vv.set(b.x, b.h / 2, b.z);
    ss.set(b.w, b.h, b.d);
    m4.compose(vv, qq, ss);
    buildingMesh.setMatrixAt(i, m4);
    const shade = 0.55 + b.seed * 0.5;
    col.setRGB(0.05 * shade, 0.06 * shade, 0.085 * shade);
    buildingMesh.setColorAt(i, col);
  });
  buildingMesh.instanceMatrix.needsUpdate = true;
  if (buildingMesh.instanceColor) buildingMesh.instanceColor.needsUpdate = true;
  buildingMesh.frustumCulled = false;
  buildingMesh.name = 'CityBuildings';
  group.add(buildingMesh);

  // ---- windows and street lamps ----
  const windowPalette = [
    0xffd9a0, 0xffc47a, 0xfff0cf, 0xffb15c, 0xf7e7c8, 0x9fdcff, 0xffe3b0, 0xfff6e2
  ];
  const windowLights = [];
  const facadeOffsets = [];

  for (const b of buildings) {
    const floors = Math.max(2, Math.floor(b.h / 1.1));
    const perFloor = 4 + Math.floor(b.seed * 4);
    const cx = b.x;
    const cz = b.z;

    for (let f = 0; f < floors; f++) {
      for (let k = 0; k < perFloor; k++) {
        if (rng() > 0.72) continue;
        const y = 0.9 + f * 1.05;
        if (y > b.h - 0.3) continue;
        const face = Math.floor(rng() * 4);
        let x = cx;
        let z = cz;
        if (face === 0) {
          x = cx + (rng() - 0.5) * b.w * 0.82;
          z = cz + b.d / 2 + 0.02;
        } else if (face === 1) {
          x = cx + (rng() - 0.5) * b.w * 0.82;
          z = cz - b.d / 2 - 0.02;
        } else if (face === 2) {
          x = cx + b.w / 2 + 0.02;
          z = cz + (rng() - 0.5) * b.d * 0.82;
        } else {
          x = cx - b.w / 2 - 0.02;
          z = cz + (rng() - 0.5) * b.d * 0.82;
        }
        windowLights.push({
          x,
          y,
          z,
          size: 0.40 + rng() * 0.50,
          color: windowPalette[Math.floor(rng() * windowPalette.length)],
          phase: rng()
        });
        if (windowLights.length > 42000) break;
      }
      if (windowLights.length > 42000) break;
    }

    // red obstacle beacons on tall towers
    if (b.h > 16) {
      windowLights.push({
        x: b.x,
        y: b.h + 0.5,
        z: b.z,
        size: 0.65,
        color: 0xff2a1a,
        phase: b.seed
      });
    }
  }

  // street lamps along the grid
  const streetLights = [];
  for (let x = CITY.minX; x < CITY.maxX; x += 24) {
    for (let z = CITY.minZ; z < CITY.maxZ; z += 11.5) {
      if (rng() > 0.5) continue;
      streetLights.push({
        x: x + 1.2,
        y: 0.45,
        z,
        size: 0.55,
        color: rng() < 0.75 ? 0xffbb72 : 0xffe0b0,
        phase: rng()
      });
    }
  }
  for (let z = CITY.minZ; z < CITY.maxZ; z += 22) {
    for (let x = CITY.minX; x < CITY.maxX; x += 9) {
      if (rng() > 0.55) continue;
      streetLights.push({
        x,
        y: 0.45,
        z: z + 1.0,
        size: 0.55,
        color: rng() < 0.7 ? 0xffb066 : 0xfff0d0,
        phase: rng()
      });
    }
  }

  const allLights = windowLights.concat(streetLights);
  const glow = buildGlowPoints(shared, allLights, {
    sizeScale: 0.95,
    twinkle: 0.28,
    opacity: 1,
    name: 'CityLights'
  });
  if (glow) group.add(glow);
  group.userData.glowMaterial = glow ? glow.material : null;

  // ---- highways with moving traffic ----
  const highwayDefs = [
    {
      points: [
        new THREE.Vector3(-1420, 0, -470),
        new THREE.Vector3(-1900, 0, -520),
        new THREE.Vector3(-2380, 0, -430),
        new THREE.Vector3(-2860, 0, -470),
        new THREE.Vector3(-3420, 0, -400)
      ],
      width: 8
    },
    {
      points: [
        new THREE.Vector3(-2480, 0, -900),
        new THREE.Vector3(-2420, 0, -420),
        new THREE.Vector3(-2520, 0, 120),
        new THREE.Vector3(-2430, 0, 640),
        new THREE.Vector3(-2500, 0, 900)
      ],
      width: 7
    },
    {
      points: [
        new THREE.Vector3(-1500, 0, 560),
        new THREE.Vector3(-1980, 0, 430),
        new THREE.Vector3(-2460, 0, 520),
        new THREE.Vector3(-2960, 0, 380),
        new THREE.Vector3(-3400, 0, 470)
      ],
      width: 6
    }
  ];

  const highwayMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    roughness: 0.8,
    metalness: 0.1,
    emissive: 0x1a0e04
  });
  materials.push(highwayMat);

  const highways = [];

  for (const def of highwayDefs) {
    const curve = new THREE.CatmullRomCurve3(def.points, false, 'catmullrom', 0.5);
    curve.arcLengthDivisions = 600;
    const samples = 260;
    const positions = [];
    const normals = [];
    const indices = [];
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = curve.getPointAt(t);
      curve.getTangentAt(t, tangent);
      side.crossVectors(tangent, up).normalize().multiplyScalar(def.width / 2);
      positions.push(p.x + side.x, 0.09, p.z + side.z);
      positions.push(p.x - side.x, 0.09, p.z - side.z);
      normals.push(0, 1, 0, 0, 1, 0);
      if (i > 0) {
        const a = (i - 1) * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeBoundingSphere();

    const ribbon = new THREE.Mesh(geo, highwayMat);
    ribbon.name = 'Highway';
    group.add(ribbon);

    // cache samples for traffic
    const table = [];
    for (let i = 0; i < 320; i++) table.push(curve.getPointAt(i / 320));
    highways.push({ table, length: curve.getLength() });
  }

  // traffic points
  const carCount = 260;
  const carPositions = new Float32Array(carCount * 3);
  const carColors = new Float32Array(carCount * 3);
  const carSizes = new Float32Array(carCount);
  const carPhases = new Float32Array(carCount);
  const cars = [];

  function refreshCarAttribute() {
    const attr = carPoints.geometry.getAttribute('position');
    attr.needsUpdate = true;
  }

  const carColor = new THREE.Color();
  for (let i = 0; i < carCount; i++) {
    const highway = highways[i % highways.length];
    const dir = i % 2 === 0 ? 1 : -1;
    const offset = i / carCount + (i % 7) * 0.013;
    const t = (offset + i * 0.173) % 1;
    cars.push({ highway, t, dir, speed: 0.010 + rng() * 0.012 });
    carSizes[i] = 0.75;
    carPhases[i] = rng();
    carColor.set(dir > 0 ? 0xfff2d8 : 0xff5533);
    carColors[i * 3] = carColor.r;
    carColors[i * 3 + 1] = carColor.g;
    carColors[i * 3 + 2] = carColor.b;
  }

  const carGeometry = new THREE.BufferGeometry();
  carGeometry.setAttribute('position', new THREE.BufferAttribute(carPositions, 3));
  carGeometry.setAttribute('aColor', new THREE.BufferAttribute(carColors, 3));
  carGeometry.setAttribute('aSize', new THREE.BufferAttribute(carSizes, 1));
  carGeometry.setAttribute('aPhase', new THREE.BufferAttribute(carPhases, 1));

  const carMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: shared.pixelRatio,
      uTime: shared.time,
      uSizeScale: { value: 0.9 },
      uTwinkle: { value: 0 },
      uOpacity: { value: 1 }
    },
    vertexShader: POINTS_VERT,
    fragmentShader: POINTS_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false
  });

  var carPoints = new THREE.Points(carGeometry, carMaterial);
  carPoints.name = 'CityTraffic';
  carPoints.frustumCulled = false;
  carPoints.renderOrder = 0;
  group.add(carPoints);

  function updateCars(delta) {
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      car.t += car.speed * delta * car.dir;
      if (car.t > 1) car.t -= 1;
      if (car.t < 0) car.t += 1;
      const table = car.highway.table;
      const idx = Math.min(table.length - 1, Math.max(0, Math.floor(car.t * (table.length - 1))));
      const p = table[idx];
      carPositions[i * 3] = p.x;
      carPositions[i * 3 + 1] = 0.55;
      carPositions[i * 3 + 2] = p.z;
    }
    refreshCarAttribute();
  }
  updateCars(0);

  // ---- soft haze dome over the city ----
  const hazeUniforms = {
    uCenter: { value: new THREE.Vector2(CITY.centerX, CITY.centerZ) },
    uColor: { value: new THREE.Color(0xff8a3c) },
    uAmount: { value: 0.10 }
  };
  const hazeMaterial = new THREE.ShaderMaterial({
    uniforms: hazeUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 uCenter;
      uniform vec3 uColor;
      uniform float uAmount;
      varying vec3 vWorld;
      void main() {
        float d = length(vWorld.xz - uCenter) / 1500.0;
        float a = exp(-d * d * 1.6) * uAmount;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false
  });
  materials.push(hazeMaterial);
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3000), hazeMaterial);
  haze.rotation.x = -Math.PI / 2;
  haze.position.set(CITY.centerX, 24, CITY.centerZ);
  haze.renderOrder = 0;
  group.add(haze);

  group.userData.updateCars = updateCars;
  group.userData.hazeUniforms = hazeUniforms;
  group.userData.groundUniforms = groundUniforms;
  group.userData.buildingCount = buildings.length;
  group.userData.windowCount = windowLights.length;
  group.userData.streetLightCount = streetLights.length;
  group.userData.highwayCount = highwayDefs.length;

  return group;
}

/* ========================================================================== *
 *  Cloud decks — a drifting sea of cloud plus instanced billboard puffs
 * ========================================================================== */

function buildCloudSea(shared, materials) {
  const uniforms = {
    uTime: shared.time,
    uLit: { value: new THREE.Color(0xffffff) },
    uShadow: { value: new THREE.Color(0x9aa3b8) },
    uSunColor: { value: new THREE.Color(0xffe0b8) },
    uSunDir: { value: new THREE.Vector3(0.3, 0.4, 0.6) },
    uHorizon: { value: new THREE.Color(0xd6e7f3) },
    uCityGlow: { value: new THREE.Color(0xff8a3c) },
    uCameraXZ: { value: new THREE.Vector2() },
    uClearCenter: { value: new THREE.Vector2(-2700, 0) },
    uCoverage: { value: 0 },
    uNight: { value: 0 },
    uCameraY: { value: 300 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: CLOUD_SEA_VERT,
    fragmentShader: CLOUD_SEA_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false
  });
  materials.push(material);

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000, 1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(-700, 225, 250);
  mesh.name = 'CloudSea';
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;

  return mesh;
}

function buildPuffLayer(shared, materials, config) {
  const count = config.count;
  const rng = mulberry32(config.seed);
  const base = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.attributes.position = base.attributes.position;
  geometry.attributes.uv = base.attributes.uv;
  geometry.instanceCount = count;

  const offsets = new Float32Array(count * 3);
  const scales = new Float32Array(count * 2);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = config.x[0] + rng() * (config.x[1] - config.x[0]);
    const y = config.y[0] + rng() * (config.y[1] - config.y[0]);
    const z = config.z[0] + rng() * (config.z[1] - config.z[0]);
    offsets[i * 3] = x;
    offsets[i * 3 + 1] = y;
    offsets[i * 3 + 2] = z;
    const s = config.size[0] + rng() * (config.size[1] - config.size[0]);
    scales[i * 2] = s * (1.2 + rng() * 0.5);
    scales[i * 2 + 1] = s;
    seeds[i] = rng();
  }

  geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 2));
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));

  const uniforms = {
    uTime: shared.time,
    uWind: { value: new THREE.Vector3(config.wind[0], 0, config.wind[1]) },
    uLit: { value: new THREE.Color(0xffffff) },
    uShadow: { value: new THREE.Color(0x9aa3b8) },
    uSunColor: { value: new THREE.Color(0xffe0b8) },
    uSunDir: { value: new THREE.Vector3(0.3, 0.5, 0.4) },
    uOpacity: { value: config.opacity === undefined ? 1 : config.opacity },
    uBright: { value: 1 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: PUFF_VERT,
    fragmentShader: PUFF_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false
  });
  materials.push(material);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = config.name;
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.userData.uniforms = uniforms;
  mesh.userData.count = count;

  return mesh;
}

/* ========================================================================== *
 *  Aircraft — procedural twin-jet airliner
 * ========================================================================== */

function fuselageProfile(t) {
  // t: 0 at the tail tip, 1 at the nose tip
  if (t < 0.20) {
    const u = smoothstep(0, 1, t / 0.20);
    return { r: lerp(0.03, 0.205, u), cy: lerp(0.115, 0, u) };
  }
  if (t < 0.80) {
    return { r: 0.205, cy: 0 };
  }
  const u = (t - 0.80) / 0.20;
  return { r: 0.205 * Math.sqrt(Math.max(0, 1 - u * u * 0.985)) + 0.012, cy: -0.012 * u * u };
}

function createFuselageGeometry() {
  const length = 4.2;
  const stations = 64;
  const radial = 32;
  const positions = [];
  const colors = [];
  const indices = [];
  const white = new THREE.Color(0xeef2f7);
  const belly = new THREE.Color(0xb9c2cd);
  const stripe = new THREE.Color(0x16386b);
  const tailStripe = new THREE.Color(0x1b2b4a);

  for (let i = 0; i <= stations; i++) {
    const t = i / stations;
    const z = -2.1 + length * t;
    const prof = fuselageProfile(t);

    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const x = Math.sin(a) * prof.r;
      const y = Math.cos(a) * prof.r * 1.05 + prof.cy;
      positions.push(x, y, z);

      let c = white;
      if (y < prof.cy - 0.075) c = belly;
      const stripeY = -0.012 + prof.cy * 0.4;
      if (Math.abs(y - stripeY) < 0.026 && t > 0.18 && t < 0.845) c = stripe;
      if (t < 0.30) c = tailStripe;
      colors.push(c.r, c.g, c.b);
    }
  }

  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + 1;
      const c = a + radial + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createWingGeometry() {
  // shape.x = span, shape.y = forward (+Z after rotation)
  const shape = new THREE.Shape();
  shape.moveTo(0.12, 1.02);
  shape.lineTo(0.95, 0.36);
  shape.lineTo(1.86, -0.44);
  shape.lineTo(1.86, -0.64);
  shape.lineTo(1.02, -0.76);
  shape.lineTo(0.12, -1.02);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.095,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.016,
    bevelSegments: 1,
    steps: 1
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.0475, 0);
  geo.computeVertexNormals();
  return geo;
}

function createFinGeometry() {
  // shape.x = z (fore/aft), shape.y = height
  const shape = new THREE.Shape();
  shape.moveTo(-1.24, 0.02);
  shape.lineTo(-1.52, 0.52);
  shape.lineTo(-1.84, 0.55);
  shape.lineTo(-2.02, 0.12);
  shape.lineTo(-2.02, 0.02);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    steps: 1
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(0.0225, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

function createStabilizerGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.04, 0.34);
  shape.lineTo(0.42, 0.08);
  shape.lineTo(0.78, -0.18);
  shape.lineTo(0.78, -0.30);
  shape.lineTo(0.04, -0.42);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 1,
    steps: 1
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.02, 0);
  geo.computeVertexNormals();
  return geo;
}

function createEngine(materials, side) {
  const group = new THREE.Group();
  group.name = 'Turbofan';

  const nacelleProfile = [
    new THREE.Vector2(0.118, 0.30),
    new THREE.Vector2(0.146, 0.245),
    new THREE.Vector2(0.162, 0.13),
    new THREE.Vector2(0.163, -0.10),
    new THREE.Vector2(0.148, -0.27),
    new THREE.Vector2(0.118, -0.32)
  ];
  const nacelle = new THREE.LatheGeometry(nacelleProfile, 28);
  nacelle.rotateX(Math.PI / 2);
  const nacelleMesh = new THREE.Mesh(nacelle, materials.nacelle);
  group.add(nacelleMesh);

  // inlet lip
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.016, 6, 28), materials.engineMetal);
  lip.position.z = 0.255;
  group.add(lip);

  // dark inlet duct
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.147, 0.147, 0.18, 26, 1, true), materials.engineDuct);
  duct.rotation.x = Math.PI / 2;
  duct.position.z = 0.16;
  group.add(duct);

  // fan
  const fan = new THREE.Group();
  fan.name = 'Fan';
  const hub = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.10, 16), materials.spinner);
  hub.rotation.x = -Math.PI / 2;
  hub.position.z = 0.20;
  fan.add(hub);

  const bladeGeo = new THREE.BoxGeometry(0.012, 0.105, 0.012);
  bladeGeo.translate(0, 0.075, 0);
  const bladeCount = 20;
  for (let i = 0; i < bladeCount; i++) {
    const blade = new THREE.Mesh(bladeGeo, materials.fanBlade);
    const a = (i / bladeCount) * TAU;
    blade.position.set(Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0.205);
    blade.rotation.z = a - Math.PI / 2;
    blade.rotation.y = 0.6;
    fan.add(blade);
  }
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.012, 26), materials.engineDuct);
  disc.rotation.x = Math.PI / 2;
  disc.position.z = 0.12;
  fan.add(disc);
  group.add(fan);

  // exhaust cone
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.045, 0.16, 18), materials.engineDuct);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.z = -0.30;
  group.add(exhaust);

  group.userData.fan = fan;
  group.userData.side = side;
  return group;
}

function createLandingGear(materials) {
  const group = new THREE.Group();
  group.name = 'LandingGear';

  const wheelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.042, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.046, 10);
  hubGeo.rotateZ(Math.PI / 2);

  function addWheel(x, y, z) {
    const wheel = new THREE.Mesh(wheelGeo, materials.tire);
    wheel.position.set(x, y, z);
    group.add(wheel);
    const hub = new THREE.Mesh(hubGeo, materials.engineMetal);
    hub.position.set(x, y, z);
    group.add(hub);
  }

  function addStrut(x1, y1, z1, x2, y2, z2) {
    const a = new THREE.Vector3(x1, y1, z1);
    const b = new THREE.Vector3(x2, y2, z2);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, len, 8), materials.engineMetal);
    strut.position.copy(a).addScaledVector(dir, 0.5);
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    group.add(strut);
  }

  // nose gear
  addStrut(0, -0.18, 1.42, 0, -0.30, 1.40);
  addWheel(-0.05, -0.315, 1.40);
  addWheel(0.05, -0.315, 1.40);
  addStrut(0, -0.30, 1.40, 0, -0.30, 1.30);

  // main gear
  for (const side of [-1, 1]) {
    addStrut(side * 0.13, -0.16, -0.15, side * 0.26, -0.31, -0.18);
    addWheel(side * 0.26, -0.315, -0.24);
    addWheel(side * 0.26, -0.315, -0.37);
  }

  return group;
}

function createCockpit(shared, materials) {
  const group = new THREE.Group();
  group.name = 'FlightDeck';

  const shell = new THREE.MeshStandardMaterial({
    color: 0x262c35,
    roughness: 0.86,
    metalness: 0.12,
    emissive: 0x0a0e14,
    emissiveIntensity: 0.9
  });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x2b333d,
    roughness: 0.8,
    metalness: 0.18,
    emissive: 0x0b0f15,
    emissiveIntensity: 1.0
  });
  const leather = new THREE.MeshStandardMaterial({
    color: 0x2a2622,
    roughness: 0.94,
    metalness: 0.02
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1d2229,
    roughness: 0.55,
    metalness: 0.45
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x3b424c,
    roughness: 0.5,
    metalness: 0.6
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xa9cfe4,
    roughness: 0.06,
    metalness: 0.1,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const warmStrip = new THREE.MeshBasicMaterial({ color: 0xffb877, toneMapped: false });

  materials.push(shell, panelMat, leather, frameMat, trimMat, glassMat, warmStrip);

  const addBox = (w, h, d, x, y, z, mat, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    group.add(mesh);
    return mesh;
  };

  // ---- interior shell ----
  addBox(0.34, 0.02, 0.96, 0, -0.115, 1.30, shell); // floor
  addBox(0.34, 0.02, 0.96, 0, 0.16, 1.30, shell); // ceiling
  addBox(0.02, 0.28, 0.96, -0.169, 0.02, 1.30, shell); // left wall
  addBox(0.02, 0.28, 0.96, 0.169, 0.02, 1.30, shell); // right wall
  addBox(0.34, 0.28, 0.03, 0, 0.02, 0.86, shell); // rear bulkhead
  addBox(0.30, 0.06, 0.16, 0, -0.05, 1.98, shell, -0.5); // nose deck under the glass

  // ---- glareshield + instrument panel (kept below the eye line) ----
  const glare = addBox(0.32, 0.028, 0.11, 0, 0.0, 1.86, frameMat, -0.08);
  glare.name = 'Glareshield';
  addBox(0.32, 0.012, 0.05, 0, -0.005, 1.798, shell, 0.1); // coaming top
  addBox(0.30, 0.075, 0.02, 0, -0.058, 1.795, panelMat, 0.25); // panel fascia
  addBox(0.30, 0.02, 0.05, 0, -0.10, 1.785, panelMat); // panel lower lip
  addBox(0.30, 0.004, 0.02, 0, -0.012, 1.762, warmStrip); // warm flood strip

  // ---- displays ----
  const screenUniforms = {
    uPitch: { value: 0 },
    uRoll: { value: 0 },
    uHeading: { value: 0 },
    uSpd: { value: 0 },
    uAlt: { value: 0 },
    uBright: { value: 1 },
    uTime: shared.time
  };

  function makeScreen(mode, x, y, w, h) {
    const uniforms = Object.assign({}, screenUniforms, { uMode: { value: mode } });
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: SCREEN_VERT,
      fragmentShader: SCREEN_FRAG,
      toneMapped: false,
      fog: false
    });
    materials.push(material);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    plane.position.set(x, y, 1.782);
    plane.rotation.y = Math.PI;
    group.add(plane);

    // bezel
    addBox(w + 0.012, h + 0.012, 0.008, x, y, 1.787, frameMat);
    return plane;
  }

  const pfd = makeScreen(0, -0.088, -0.045, 0.078, 0.066);
  const nd = makeScreen(1, -0.004, -0.045, 0.078, 0.066);
  const eicas = makeScreen(2, 0.080, -0.045, 0.060, 0.066);
  pfd.name = 'PFD';
  nd.name = 'ND';
  eicas.name = 'EICAS';

  // standby display sitting on the glareshield (the one screen the pilot can
  // read without looking down)
  const standbyMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({}, screenUniforms, { uMode: { value: 0 } }),
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
    toneMapped: false,
    fog: false
  });
  materials.push(standbyMat);
  const standbyGeo = new THREE.PlaneGeometry(0.038, 0.030);
  const standbyUv = standbyGeo.attributes.uv;
  for (let k = 0; k < standbyUv.count; k++) standbyUv.setY(k, 1 - standbyUv.getY(k));
  const standby = new THREE.Mesh(standbyGeo, standbyMat);
  standby.position.set(-0.032, 0.027, 1.827);
  standby.rotation.x = -2.0;
  group.add(standby);
  addBox(0.046, 0.038, 0.006, -0.032, 0.025, 1.830, frameMat, -2.0);

  // standby instruments
  for (let i = 0; i < 2; i++) {
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 16), frameMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0.126, -0.085 + i * 0.030, 1.788);
    group.add(dial);
  }

  // ---- yokes ----
  const columnMat = trimMat;
  for (const side of [-1, 1]) {
    const x = side * 0.082;
    addBox(0.026, 0.095, 0.026, x, -0.085, 1.72, columnMat);
    addBox(0.12, 0.024, 0.026, x, -0.042, 1.712, columnMat);
    addBox(0.024, 0.034, 0.026, x - 0.052, -0.056, 1.712, columnMat);
    addBox(0.024, 0.034, 0.026, x + 0.052, -0.056, 1.712, columnMat);
  }

  // ---- throttle quadrant ----
  addBox(0.10, 0.03, 0.20, 0, -0.125, 1.61, panelMat);
  for (let i = 0; i < 2; i++) {
    addBox(0.012, 0.05, 0.014, -0.018 + i * 0.036, -0.098, 1.59, trimMat, 0.18);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), trimMat);
    knob.position.set(-0.018 + i * 0.036, -0.072, 1.583);
    group.add(knob);
  }

  // ---- overhead panel with rows of switches ----
  const overhead = addBox(0.26, 0.02, 0.16, 0, 0.145, 1.62, panelMat, 0.22);
  const switchGeo = new THREE.BoxGeometry(0.012, 0.012, 0.006);
  const switchMat = new THREE.MeshStandardMaterial({ color: 0xd7dce2, roughness: 0.5, metalness: 0.4 });
  materials.push(switchMat);
  const switches = new THREE.InstancedMesh(switchGeo, switchMat, 48);
  const sm = new THREE.Matrix4();
  const sq = new THREE.Quaternion();
  const sv = new THREE.Vector3();
  const ssc = new THREE.Vector3(1, 1, 1);
  let si = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
      sv.set(-0.105 + c * 0.019, 0.156 - r * 0.006, 1.685 - r * 0.028);
      sm.compose(sv, sq, ssc);
      switches.setMatrixAt(si++, sm);
    }
  }
  switches.instanceMatrix.needsUpdate = true;
  switches.frustumCulled = false;
  group.add(switches);

  // a few glowing indicators on the overhead
  const indicatorGeo = new THREE.PlaneGeometry(0.006, 0.004);
  const indicatorMat = new THREE.MeshBasicMaterial({ color: 0x6dffb0, toneMapped: false });
  materials.push(indicatorMat);
  const indicators = new THREE.InstancedMesh(indicatorGeo, indicatorMat, 10);
  for (let i = 0; i < 10; i++) {
    sv.set(-0.09 + i * 0.02, 0.158, 1.60);
    const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.22, 0, 0));
    sm.compose(sv, rot, ssc);
    indicators.setMatrixAt(i, sm);
  }
  indicators.instanceMatrix.needsUpdate = true;
  indicators.frustumCulled = false;
  group.add(indicators);

  // ---- seats ----
  for (const side of [-1, 1]) {
    const x = side * 0.085;
    addBox(0.095, 0.045, 0.11, x, -0.075, 1.44, leather);
    addBox(0.095, 0.20, 0.03, x, 0.015, 1.365, leather, -0.12);
    addBox(0.085, 0.05, 0.028, x, 0.115, 1.355, leather, -0.2);
    addBox(0.02, 0.05, 0.09, x - 0.05, -0.055, 1.44, leather);
    addBox(0.02, 0.05, 0.09, x + 0.05, -0.055, 1.44, leather);
  }

  // ---- windshield frame ----
  addBox(0.010, 0.016, 0.03, 0, 0.156, 1.83, frameMat, 0, 0, 0); // top centre
  addBox(0.30, 0.018, 0.05, 0, 0.160, 1.828, frameMat, -0.05); // top arch
  addBox(0.30, 0.022, 0.09, 0, -0.030, 1.884, frameMat, 0.22); // sill
  addBox(0.009, 0.17, 0.024, 0, 0.078, 1.842, frameMat, -0.16); // centre post
  addBox(0.014, 0.19, 0.028, -0.152, 0.073, 1.828, frameMat, 0, 0, 0.13); // A-pillar left
  addBox(0.014, 0.19, 0.028, 0.152, 0.073, 1.828, frameMat, 0, 0, -0.13); // A-pillar right

  // side window frames
  addBox(0.012, 0.09, 0.20, -0.164, 0.075, 1.70, frameMat);
  addBox(0.012, 0.09, 0.20, 0.164, 0.075, 1.70, frameMat);

  // ---- windshield glass (one sheet, barely there) ----
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.155), glassMat);
  pane.position.set(0, 0.075, 1.858);
  pane.rotation.set(-0.16, Math.PI, 0);
  pane.renderOrder = 6;
  group.add(pane);

  // wipers
  for (const side of [-1, 1]) {
    addBox(0.004, 0.004, 0.085, side * 0.06, 0.02, 1.885, frameMat, 0.25, 0, side * 0.4);
  }

  // ---- nose deck visible through the glass ----
  const noseGeo = new THREE.PlaneGeometry(0.55, 0.55, 8, 4);
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xe6ebf2,
    roughness: 0.42,
    metalness: 0.25,
    side: THREE.DoubleSide
  });
  materials.push(noseMat);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, -0.10, 2.06);
  nose.rotation.set(-1.15, 0, 0);
  group.add(nose);

  // interior glow light for the panels (cheap, small radius)
  const panelLight = new THREE.PointLight(0xffc890, 0.035, 0.9, 2);
  panelLight.position.set(0, -0.02, 1.73);
  group.add(panelLight);

  group.userData.screenUniforms = screenUniforms;
  group.userData.panelLight = panelLight;

  return group;
}

function createAircraft(shared, materials) {
  const group = new THREE.Group();
  group.name = 'AeroJet';
  const exterior = new THREE.Group();
  exterior.name = 'AeroJetExterior';
  const trim = new THREE.Group();
  trim.name = 'AeroJetTrim';
  const cockpit = createCockpit(shared, materials);
  group.add(exterior, trim, cockpit);

  const skin = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.34,
    metalness: 0.36,
    emissive: 0x1a2334,
    emissiveIntensity: 1.0
  });
  materials.push(skin);

  const fuselage = new THREE.Mesh(createFuselageGeometry(), skin);
  fuselage.name = 'Fuselage';
  exterior.add(fuselage);

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xdfe5ec,
    roughness: 0.4,
    metalness: 0.3,
    side: THREE.DoubleSide,
    emissive: 0x1a2334,
    emissiveIntensity: 1.0
  });
  const finMat = new THREE.MeshStandardMaterial({
    color: 0x22406b,
    roughness: 0.36,
    metalness: 0.35,
    side: THREE.DoubleSide,
    emissive: 0x101827,
    emissiveIntensity: 0.8
  });
  const darkGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0a1118,
    roughness: 0.14,
    metalness: 0.65
  });
  const nacelleMat = new THREE.MeshStandardMaterial({
    color: 0xe9eef4,
    roughness: 0.3,
    metalness: 0.5,
    side: THREE.DoubleSide,
    emissive: 0x1a2334,
    emissiveIntensity: 0.9
  });
  const engineMetal = new THREE.MeshStandardMaterial({
    color: 0x9299a3,
    roughness: 0.28,
    metalness: 0.85
  });
  const engineDuct = new THREE.MeshStandardMaterial({
    color: 0x15181d,
    roughness: 0.7,
    metalness: 0.3,
    side: THREE.DoubleSide
  });
  const spinner = new THREE.MeshStandardMaterial({
    color: 0x2b3138,
    roughness: 0.25,
    metalness: 0.9
  });
  const fanBlade = new THREE.MeshStandardMaterial({
    color: 0x4c525a,
    roughness: 0.3,
    metalness: 0.9
  });
  const tire = new THREE.MeshStandardMaterial({
    color: 0x101114,
    roughness: 0.95,
    metalness: 0.05
  });

  materials.push(wingMat, finMat, darkGlassMat, nacelleMat, engineMetal, engineDuct, spinner, fanBlade, tire);

  const engineMaterials = {
    nacelle: nacelleMat,
    engineMetal,
    engineDuct,
    spinner,
    fanBlade
  };

  // wings
  const wingGeo = createWingGeometry();
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, -0.055, 0.05);
    wing.rotation.z = side * 0.055;
    wing.scale.x = side;
    wing.name = side < 0 ? 'WingLeft' : 'WingRight';
    exterior.add(wing);
    wings.push(wing);

    // winglet
    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.28), finMat);
    winglet.position.set(side * 1.85, 0.06, -0.45);
    winglet.rotation.z = side * -0.30;
    exterior.add(winglet);

    // flap / aileron hint
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.016, 0.16), wingMat);
    flap.position.set(side * 0.56, -0.05, -0.72);
    flap.name = 'Flap';
    exterior.add(flap);
    wing.userData.flap = flap;
  }

  // fin
  const fin = new THREE.Mesh(createFinGeometry(), finMat);
  fin.name = 'VerticalFin';
  exterior.add(fin);

  // stabilizers
  const stabGeo = createStabilizerGeometry();
  for (const side of [-1, 1]) {
    const stab = new THREE.Mesh(stabGeo, wingMat);
    stab.position.set(0, 0.06, -1.62);
    stab.scale.x = side;
    exterior.add(stab);
  }

  // engines
  const engines = [];
  for (const side of [-1, 1]) {
    const engine = createEngine(engineMaterials, side);
    engine.position.set(side * 0.76, -0.26, 0.26);
    exterior.add(engine);
    engines.push(engine);

    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.40), wingMat);
    pylon.position.set(side * 0.76, -0.16, 0.24);
    exterior.add(pylon);
  }

  // landing gear
  const gear = createLandingGear({
    tire,
    engineMetal
  });
  exterior.add(gear);

  // ----- fuselage windows + cockpit glazing (hidden from inside) -----
  const windowGeo = new THREE.BoxGeometry(0.007, 0.010, 0.016);
  const windowCount = 54;
  const windows = new THREE.InstancedMesh(windowGeo, darkGlassMat, windowCount);
  const wm = new THREE.Matrix4();
  const wq = new THREE.Quaternion();
  const wp = new THREE.Vector3();
  const ws = new THREE.Vector3(1, 1, 1);
  let wi = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < windowCount / 2; i++) {
      const z = -1.08 + i * 0.083;
      const t = (z + 2.1) / 4.2;
      const prof = fuselageProfile(t);
      wp.set(side * (prof.r * 0.995), prof.cy + 0.028, z);
      wm.compose(wp, wq, ws);
      windows.setMatrixAt(wi++, wm);
    }
  }
  windows.instanceMatrix.needsUpdate = true;
  windows.frustumCulled = false;
  trim.add(windows);

  // cockpit glazing band on the nose
  const glazing = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.038, 0.075), darkGlassMat);
  glazing.position.set(0, 0.058, 1.845);
  glazing.rotation.x = -0.18;
  trim.add(glazing);

  // doors
  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.20, 0.10), darkGlassMat);
    door.position.set(side * 0.198, 0.0, 0.35);
    trim.add(door);
  }

  // ----- lights -----
  const navGeo = new THREE.SphereGeometry(0.018, 8, 6);
  const navLeftMat = new THREE.MeshBasicMaterial({ color: 0xff3322, toneMapped: false });
  const navRightMat = new THREE.MeshBasicMaterial({ color: 0x22ff66, toneMapped: false });
  const whiteLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  materials.push(navLeftMat, navRightMat, whiteLightMat);

  const navLeft = new THREE.Mesh(navGeo, navLeftMat);
  navLeft.position.set(-1.86, 0.02, -0.44);
  exterior.add(navLeft);

  const navRight = new THREE.Mesh(navGeo, navRightMat);
  navRight.position.set(1.86, 0.02, -0.44);
  exterior.add(navRight);

  const tailLight = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), whiteLightMat);
  tailLight.position.set(0, 0.08, -2.02);
  exterior.add(tailLight);

  const navGlows = buildGlowPoints(
    shared,
    [
      { x: -1.88, y: 0.02, z: -0.44, size: 1.1, color: 0xff3a26 },
      { x: 1.88, y: 0.02, z: -0.44, size: 1.1, color: 0x36ff7a },
      { x: 0, y: 0.09, z: -2.04, size: 0.8, color: 0xffffff }
    ],
    { sizeScale: 1.0, name: 'NavLights' }
  );
  if (navGlows) exterior.add(navGlows);

  const strobeGlows = buildGlowPoints(
    shared,
    [
      { x: -1.88, y: 0.02, z: -0.62, size: 2.6, color: 0xffffff },
      { x: 1.88, y: 0.02, z: -0.62, size: 2.6, color: 0xffffff },
      { x: 0, y: 0.09, z: -2.05, size: 2.2, color: 0xffffff }
    ],
    { sizeScale: 1.0, name: 'StrobeLights' }
  );
  if (strobeGlows) {
    strobeGlows.visible = false;
    exterior.add(strobeGlows);
  }

  const beaconGlows = buildGlowPoints(
    shared,
    [
      { x: 0, y: 0.215, z: -0.3, size: 1.5, color: 0xff2a18 },
      { x: 0, y: -0.215, z: -0.35, size: 1.4, color: 0xff2a18 }
    ],
    { sizeScale: 1.0, name: 'Beacons' }
  );
  if (beaconGlows) exterior.add(beaconGlows);

  // landing lights — bulbs, glow and light cones
  const landingGlows = buildGlowPoints(
    shared,
    [
      { x: -0.16, y: -0.22, z: 1.22, size: 2.0, color: 0xfff4d6 },
      { x: 0.16, y: -0.22, z: 1.22, size: 2.0, color: 0xfff4d6 }
    ],
    { sizeScale: 1.0, name: 'LandingLights' }
  );
  if (landingGlows) {
    landingGlows.visible = false;
    exterior.add(landingGlows);
  }

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c8,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  materials.push(beamMat);

  group.userData.exterior = exterior;
  group.userData.trim = trim;
  group.userData.cockpit = cockpit;
  group.userData.wings = wings;
  group.userData.engines = engines;
  group.userData.gear = gear;
  group.userData.strobeGlows = strobeGlows;
  group.userData.beaconGlows = beaconGlows;
  group.userData.landingGlows = landingGlows;
  group.userData.beamMaterial = beamMat;
  group.userData.screenUniforms = cockpit.userData.screenUniforms;
  group.userData.panelLight = cockpit.userData.panelLight;

  return group;
}

/* ========================================================================== *
 *  Public factory
 * ========================================================================== */

const DEFAULTS = {
  manageFog: true,
  manageBackground: true,
  pixelRatio: 0,
  seed: 20261118
};

/**
 * Build the whole Aero Pilot world.
 *
 * @param {THREE.Scene} scene
 * @param {Object} [options]
 * @param {boolean} [options.manageFog=true]          own scene.fog (restored on dispose)
 * @param {boolean} [options.manageBackground=true]   own scene.background (restored on dispose)
 * @param {number}  [options.pixelRatio=0]            0 → window.devicePixelRatio
 * @returns {{
 *   group: THREE.Group,
 *   lights: Object,
 *   aircraft: THREE.Group,
 *   cockpit: THREE.Group,
 *   getFlightPose: (progress:number)=>Object,
 *   update: (elapsed:number, delta:number, progress:number, camera?:THREE.Camera)=>void,
 *   setPixelRatio: (value:number)=>void,
 *   getEnvironment: (progress:number)=>Object,
 *   stats: Object,
 *   dispose: ()=>void
 * }}
 */
export function createAeroWorld(scene, options = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new Error('createAeroWorld(scene, options): a THREE.Scene is required');
  }

  const params = Object.assign({}, DEFAULTS, options);
  const materialList = [];

  const group = new THREE.Group();
  group.name = 'AeroWorld';
  scene.add(group);

  const detectedPixelRatio =
    params.pixelRatio > 0
      ? params.pixelRatio
      : typeof window !== 'undefined' && window.devicePixelRatio
        ? Math.min(window.devicePixelRatio, 2)
        : 1;

  const shared = {
    time: { value: 0 },
    pixelRatio: { value: detectedPixelRatio }
  };

  /* ---------------------------------------------------------------- sky */
  const sky = buildSky(shared);
  group.add(sky.mesh);

  /* ------------------------------------------------------------ terrain */
  const terrain = buildTerrain(shared, materialList);
  group.add(terrain);

  /* --------------------------------------------------------- departures */
  const departureAirport = new THREE.Group();
  departureAirport.name = 'Airport-09L';

  const departureRunway = buildRunway(
    {
      name: '09L',
      thresholdX: -190,
      length: 300,
      width: 4.6,
      z: 0,
      heading: 1,
      night: false
    },
    shared,
    materialList
  );
  departureAirport.add(departureRunway);

  const departureTerminal = buildTerminal(
    {
      name: 'origin',
      x: 6,
      z: -62,
      length: 104,
      height: 8,
      depth: 13,
      towerX: -112,
      towerZ: -74
    },
    shared,
    materialList
  );
  departureAirport.add(departureTerminal);
  group.add(departureAirport);

  /* ------------------------------------------------------- destination */
  const destinationAirport = new THREE.Group();
  destinationAirport.name = 'Airport-27R';

  const destinationRunway = buildRunway(
    {
      name: '27R',
      thresholdX: -2700,
      length: 300,
      width: 4.6,
      z: 0,
      heading: -1,
      night: true,
      approach: true
    },
    shared,
    materialList
  );
  destinationAirport.add(destinationRunway);

  const destinationTerminal = buildTerminal(
    {
      name: 'destination',
      x: -2860,
      z: -58,
      length: 92,
      height: 8,
      depth: 13,
      towerX: -2760,
      towerZ: -76
    },
    shared,
    materialList
  );
  destinationAirport.add(destinationTerminal);
  group.add(destinationAirport);

  /* ---------------------------------------------------------------- city */
  const city = buildCity(shared, materialList);
  group.add(city);

  /* -------------------------------------------------------------- clouds */
  const cloudSea = buildCloudSea(shared, materialList);
  group.add(cloudSea);

  const climbPuffs = buildPuffLayer(shared, materialList, {
    name: 'ClimbClouds',
    seed: 9182,
    count: 150,
    x: [90, 560],
    y: [40, 240],
    z: [-40, 640],
    size: [26, 72],
    wind: [0.55, 0.22],
    opacity: 0.92
  });
  group.add(climbPuffs);

  const cruisePuffs = buildPuffLayer(shared, materialList, {
    name: 'CruiseClouds',
    seed: 5127,
    count: 150,
    x: [-2500, 700],
    y: [215, 290],
    z: [-1100, 1600],
    size: [95, 230],
    wind: [0.75, 0.3],
    opacity: 0.72
  });
  group.add(cruisePuffs);

  const lowPuffs = buildPuffLayer(shared, materialList, {
    name: 'DescentClouds',
    seed: 3311,
    count: 34,
    x: [-2820, -1980],
    y: [90, 180],
    z: [-700, 700],
    size: [24, 60],
    wind: [0.5, 0.2],
    opacity: 0.35
  });
  group.add(lowPuffs);

  /* ------------------------------------------------------------ aircraft */
  const aircraft = createAircraft(shared, materialList);
  group.add(aircraft);

  /* -------------------------------------------------------------- lights */
  const sunLight = new THREE.DirectionalLight(0xffd9a8, 2.5);
  sunLight.name = 'aeroSun';
  sunLight.target = new THREE.Object3D();
  group.add(sunLight, sunLight.target);

  const moonLight = new THREE.DirectionalLight(0xaec9ff, 0);
  moonLight.name = 'aeroMoon';
  moonLight.target = new THREE.Object3D();
  group.add(moonLight, moonLight.target);

  const hemiLight = new THREE.HemisphereLight(0x9dc2e8, 0x4a3a2e, 0.7);
  hemiLight.name = 'aeroHemisphere';
  group.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.16);
  ambientLight.name = 'aeroAmbient';
  group.add(ambientLight);

  const cityBounce = new THREE.DirectionalLight(0xff9a55, 0);
  cityBounce.name = 'aeroCityBounce';
  cityBounce.target = new THREE.Object3D();
  group.add(cityBounce, cityBounce.target);

  const landingLight = new THREE.SpotLight(0xfff2d2, 0, 260, 0.34, 0.6, 2);
  landingLight.name = 'aeroLandingLight';
  landingLight.target = new THREE.Object3D();
  group.add(landingLight, landingLight.target);

  /* ----------------------------------------------------------------- fog */
  const previousFog = scene.fog || null;
  let ownFog = null;
  if (params.manageFog) {
    ownFog = new THREE.FogExp2(0xe4c4a6, 0.0004);
    scene.fog = ownFog;
  }

  const previousBackground = scene.background === undefined ? null : scene.background;
  let ownBackground = null;
  if (params.manageBackground) {
    ownBackground = new THREE.Color(0x070a12);
    scene.background = ownBackground;
  }

  /* ----------------------------------------------------------- the path */
  const curve = createFlightCurve();

  const milestonePoints = [
    { p: 0.0, target: curve.getPointAt(0) },
    { p: 0.15, target: new THREE.Vector3(95, 1.4, 0) },
    { p: 0.38, target: new THREE.Vector3(-40, 280, 558) },
    { p: 0.65, target: new THREE.Vector3(-1520, 261, 238) },
    { p: 0.85, target: new THREE.Vector3(-2550, 38, 28) },
    { p: 0.94, target: new THREE.Vector3(-2695, 3.4, 1.4) },
    { p: 1.0, target: curve.getPointAt(1) }
  ];

  const milestones = milestonePoints.map((entry) => ({
    p: entry.p,
    u: entry.p === 0 ? 0 : entry.p === 1 ? 1 : nearestU(curve, entry.target)
  }));

  for (let i = 1; i < milestones.length; i++) {
    if (milestones[i].u <= milestones[i - 1].u + 1e-4) {
      milestones[i].u = Math.min(1, milestones[i - 1].u + 1e-3);
    }
  }

  function progressToU(progress) {
    const p = clamp01(progress);
    let i = 0;
    while (i < milestones.length - 2 && p > milestones[i + 1].p) i++;
    const a = milestones[i];
    const b = milestones[i + 1];
    const t = clamp01((p - a.p) / Math.max(1e-6, b.p - a.p));
    return clamp01(lerp(a.u, b.u, t));
  }

  /* --------------------------------------------------------- scratchpad */
  const _posA = new THREE.Vector3();
  const _tanA = new THREE.Vector3();
  const _tanPrev = new THREE.Vector3();
  const _tanNext = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _up = new THREE.Vector3();
  const _basis = new THREE.Matrix4();
  const _rollQuat = new THREE.Quaternion();
  const _pitchQuat = new THREE.Quaternion();
  const _localZ = new THREE.Vector3(0, 0, 1);
  const _localX = new THREE.Vector3(1, 0, 0);
  const _env = createEnvSample();
  const _flight = {};
  const _camPos = new THREE.Vector3();
  const _camLook = new THREE.Vector3();
  const _camUp = new THREE.Vector3();
  const _craftUp = new THREE.Vector3();
  const _keyPosA = new THREE.Vector3();
  const _keyPosB = new THREE.Vector3();
  const _keyLookA = new THREE.Vector3();
  const _keyLookB = new THREE.Vector3();
  const _tmpColor = new THREE.Color();
  const _tmpColor2 = new THREE.Color();
  const _sunDir = new THREE.Vector3();
  const _moonDir = new THREE.Vector3();
  const _localCam = new THREE.Vector3();
  const _invQuat = new THREE.Quaternion();
  const _forward = new THREE.Vector3();
  const _qTarget = new THREE.Quaternion();

  const pose = {
    progress: 0,
    cameraPos: _camPos,
    lookAt: _camLook,
    cameraUp: _camUp,
    cameraSway: 0,
    aircraftPos: new THREE.Vector3(),
    aircraftQuat: new THREE.Quaternion(),
    aircraftForward: new THREE.Vector3(0, 0, 1),
    aircraftUp: new THREE.Vector3(0, 1, 0),
    altitudeFt: 0,
    airspeedKts: 0,
    mach: 0,
    utcOffset: 5.5,
    phaseName: FLIGHT_PHASES[0].name,
    phaseId: FLIGHT_PHASES[0].id,
    phaseIndex: 0,
    timeOfDay: FLIGHT_PHASES[0].timeOfDay,
    bank: 0,
    pitch: 0,
    sunElevation: 0,
    gearDown: 1
  };

  function sunDirection(elevationDeg, azimuthDeg, out) {
    const e = elevationDeg * DEG;
    const a = azimuthDeg * DEG;
    return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize();
  }

  /* ------------------------------------------------------- pose helpers */
  function keyWorldPosition(key, aircraftPos, aircraftQuat, out) {
    if (key.space === 'world') {
      return out.set(key.pos[0], key.pos[1], key.pos[2]);
    }
    return out
      .set(key.pos[0], key.pos[1], key.pos[2])
      .applyQuaternion(aircraftQuat)
      .add(aircraftPos);
  }

  function keyWorldLook(key, aircraftPos, aircraftQuat, forward, out) {
    if (key.lookAircraft) {
      return out.copy(aircraftPos).addScaledVector(forward, 2.5);
    }
    if (key.lookWorld) {
      return out.set(key.lookWorld[0], key.lookWorld[1], key.lookWorld[2]);
    }
    return out
      .set(key.look[0], key.look[1], key.look[2])
      .applyQuaternion(aircraftQuat)
      .add(aircraftPos);
  }

  function upWeightFor(key) {
    if (key.up === 'craft') return 1;
    if (key.up === 'blend') return 0.32;
    return 0;
  }

  /* ------------------------------------------------------------- pose */
  function getFlightPose(progress) {
    const p = clamp01(finite(progress, 0));
    const u = progressToU(p);

    const env = sampleEnv(p, _env);
    const flight = sampleFlightData(p, _flight);

    curve.getPointAt(u, _posA);
    curve.getTangentAt(u, _tanA).normalize();
    curve.getTangentAt(Math.max(0, u - 0.0018), _tanPrev).normalize();
    curve.getTangentAt(Math.min(1, u + 0.0018), _tanNext).normalize();

    // turn rate → bank into the turn
    const crossY = _tanPrev.z * _tanNext.x - _tanPrev.x * _tanNext.z;
    const dotY = clamp(_tanPrev.x * _tanNext.x + _tanPrev.z * _tanNext.z, -1, 1);
    const yaw = Math.atan2(crossY, Math.max(1e-4, dotY));
    let bank = clamp(-yaw * 5.2, -0.58, 0.58);

    // keep the aircraft wings level during the ground roll and touchdown
    const groundBlend =
      Math.max(smoothstep(0.0, 0.02, p) * (1 - smoothstep(0.13, 0.19, p)), smoothstep(0.93, 0.96, p));
    bank *= 1 - groundBlend;

    // rotation and flare add a little nose-up attitude on top of the path
    let pitchBias = 0;
    pitchBias += 0.055 * smoothstep(0.145, 0.17, p) * (1 - smoothstep(0.2, 0.24, p));
    pitchBias += 0.05 * smoothstep(0.958, 0.978, p) * (1 - smoothstep(0.985, 0.995, p));

    const pitch = Math.asin(clamp(_tanA.y, -1, 1));

    _right.crossVectors(WORLD_UP, _tanA);
    if (_right.lengthSq() < 1e-8) _right.set(1, 0, 0);
    _right.normalize();
    _up.crossVectors(_tanA, _right).normalize();
    _basis.makeBasis(_right, _up, _tanA);
    _qTarget.setFromRotationMatrix(_basis);

    _rollQuat.setFromAxisAngle(_localZ, bank);
    _qTarget.multiply(_rollQuat);
    _pitchQuat.setFromAxisAngle(_localX, -pitchBias);
    _qTarget.multiply(_pitchQuat);
    _qTarget.normalize();

    const aircraftPos = pose.aircraftPos.copy(_posA);
    const aircraftQuat = pose.aircraftQuat.copy(_qTarget);
    const forward = pose.aircraftForward.copy(_tanA);
    const aircraftUp = pose.aircraftUp.copy(WORLD_UP).applyQuaternion(aircraftQuat);

    // ---------------------------------------------------------- camera
    let i = 0;
    while (i < CAMERA_KEYS.length - 2 && p > CAMERA_KEYS[i + 1].p) i++;
    const keyA = CAMERA_KEYS[i];
    const keyB = CAMERA_KEYS[i + 1];
    const t = clamp01((p - keyA.p) / Math.max(1e-6, keyB.p - keyA.p));
    const e = smootherstep(0, 1, t);

    keyWorldPosition(keyA, aircraftPos, aircraftQuat, _keyPosA);
    keyWorldPosition(keyB, aircraftPos, aircraftQuat, _keyPosB);
    keyWorldLook(keyA, aircraftPos, aircraftQuat, forward, _keyLookA);
    keyWorldLook(keyB, aircraftPos, aircraftQuat, forward, _keyLookB);

    _camPos.lerpVectors(_keyPosA, _keyPosB, e);
    _camLook.lerpVectors(_keyLookA, _keyLookB, e);

    const upWeight = lerp(upWeightFor(keyA), upWeightFor(keyB), e);
    _craftUp.copy(WORLD_UP).applyQuaternion(aircraftQuat);
    _camUp.copy(WORLD_UP).lerp(_craftUp, upWeight).normalize();
    if (_camUp.lengthSq() < 1e-6) _camUp.copy(WORLD_UP);

    // ---------------------------------------------------------- output
    pose.progress = p;
    pose.altitudeFt = flight.altitudeFt;
    pose.airspeedKts = flight.airspeedKts;
    pose.mach = flight.mach;
    pose.utcOffset = flight.utcOffset;
    pose.phaseName = flight.phaseName;
    pose.phaseId = flight.phaseId;
    pose.phaseIndex = flight.phaseIndex;
    pose.timeOfDay = flight.timeOfDay;
    pose.bank = bank;
    pose.pitch = pitch + pitchBias;
    pose.cameraSway = lerp(keyA.sway || 0, keyB.sway || 0, e);
    pose.sunElevation = env.sunElev;
    pose.gearDown = 1 - smoothstep(0.19, 0.23, p) * (1 - smoothstep(0.83, 0.87, p));

    pose.env = env;

    return pose;
  }

  /* ------------------------------------------------------------- update */
  let lastGearDeploy = 1;

  function update(elapsed = 0, delta = 0.016, progress = 0, camera = null) {
    const t = finite(elapsed, 0);
    const dt = clamp(finite(delta, 0.016), 0, 0.1);
    const p = clamp01(finite(progress, 0));

    shared.time.value = t;

    const env = sampleEnv(p, _env);
    const frame = getFlightPose(p);

    // ---- aircraft transform ----
    aircraft.position.copy(frame.aircraftPos);
    aircraft.quaternion.copy(frame.aircraftQuat);
    aircraft.updateMatrixWorld(true);

    // ---- aircraft animations ----
    const airspeed = frame.airspeedKts;
    const fanSpeed = (2.2 + airspeed * 0.075) * (p < 0.02 ? 0.4 : 1);
    for (const engine of aircraft.userData.engines) {
      engine.userData.fan.rotation.z += fanSpeed * dt * 12;
    }

    // landing gear
    const gearUp = smoothstep(0.185, 0.235, p) * (1 - smoothstep(0.825, 0.875, p));
    const deploy = 1 - gearUp;
    const gear = aircraft.userData.gear;
    gear.visible = deploy > 0.015;
    gear.rotation.x = gearUp * 1.45;
    if (Math.abs(deploy - lastGearDeploy) > 1e-4) {
      lastGearDeploy = deploy;
    }

    // flaps follow the phase
    const flapAngle =
      0.08 * smoothstep(0.1, 0.15, p) * (1 - smoothstep(0.19, 0.26, p)) +
      0.34 * smoothstep(0.8, 0.88, p);
    for (const wing of aircraft.userData.wings) {
      const flap = wing.userData.flap;
      if (flap) flap.rotation.x = -flapAngle;
    }

    // strobes: a double flash every 1.25 s
    const strobeWindow = t % 1.25;
    const strobeOn = strobeWindow < 0.055 || (strobeWindow > 0.14 && strobeWindow < 0.195);
    if (aircraft.userData.strobeGlows) {
      aircraft.userData.strobeGlows.visible = strobeOn && p > 0.05;
    }

    // beacons pulse
    if (aircraft.userData.beaconGlows) {
      const pulse = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 3.1)), 3);
      aircraft.userData.beaconGlows.material.uniforms.uOpacity.value = pulse;
    }

    // landing lights on for the approach
    const landingOn = smoothstep(0.80, 0.88, p);
    if (aircraft.userData.landingGlows) {
      aircraft.userData.landingGlows.visible = landingOn > 0.4;
      aircraft.userData.landingGlows.material.uniforms.uOpacity.value = 0.5 + 0.5 * landingOn;
    }
    aircraft.userData.beamMaterial.opacity = 0.0;

    // cockpit interior / exterior trim
    _invQuat.copy(frame.aircraftQuat).invert();
    _localCam.copy(frame.cameraPos).sub(frame.aircraftPos).applyQuaternion(_invQuat);
    const insideCockpit =
      _localCam.z > 0.5 && _localCam.z < 2.3 && Math.abs(_localCam.x) < 0.42 && Math.abs(_localCam.y) < 0.42;
    aircraft.userData.trim.visible = !insideCockpit;

    // instrument screens
    const screens = aircraft.userData.screenUniforms;
    if (screens) {
      screens.uPitch.value = clamp(-frame.pitch / 0.5, -1, 1);
      screens.uRoll.value = -frame.bank;
      screens.uHeading.value = (p * 2.4) % 1;
      screens.uSpd.value = frame.airspeedKts;
      screens.uAlt.value = frame.altitudeFt;
      screens.uBright.value = 0.85 + 0.4 * (1 - clamp01(env.sunElev / 12));
    }
    if (aircraft.userData.panelLight) {
      aircraft.userData.panelLight.intensity = 0.05 + 0.05 * (1 - clamp01(env.sunElev / 10));
    }

    // ---- sun / moon / lights ----
    sunDirection(env.sunElev, env.sunAzim, _sunDir);
    sunDirection(env.moonElev, env.moonAzim, _moonDir);

    sunLight.color.copy(env.sunColor);
    sunLight.intensity = env.sunIntensity;
    sunLight.position.copy(frame.aircraftPos).addScaledVector(_sunDir, 1600);
    sunLight.target.position.copy(frame.aircraftPos);

    moonLight.color.setHex(0xaec9ff);
    moonLight.intensity = env.moon * 2.4;
    moonLight.position.copy(frame.aircraftPos).addScaledVector(_moonDir, 1200);
    moonLight.target.position.copy(frame.aircraftPos);

    hemiLight.color.copy(env.hemiSky);
    hemiLight.groundColor.copy(env.hemiGround);
    hemiLight.intensity = env.hemiIntensity;

    ambientLight.intensity = env.ambient;

    cityBounce.color.setHex(0xff9a55);
    cityBounce.intensity = env.cityLights * 0.75;
    cityBounce.position.copy(frame.aircraftPos).add(new THREE.Vector3(0, -1, 0.35).normalize().multiplyScalar(600));
    cityBounce.target.position.copy(frame.aircraftPos);

    // landing spotlight
    if (landingOn > 0.05) {
      landingLight.position
        .copy(frame.aircraftPos)
        .addScaledVector(frame.aircraftForward, 1.6)
        .add(new THREE.Vector3(0, -0.35, 0));
      landingLight.target.position
        .copy(frame.aircraftPos)
        .addScaledVector(frame.aircraftForward, 45)
        .add(new THREE.Vector3(0, -6, 0));
      landingLight.intensity = 32000 * landingOn;
    } else {
      landingLight.intensity = 0;
    }

    // ---- sky ----
    const skyU = sky.uniforms;
    skyU.uZenith.value.copy(env.zenith);
    skyU.uHorizon.value.copy(env.horizon);
    skyU.uGround.value.copy(env.ground);
    skyU.uSunDir.value.copy(_sunDir);
    skyU.uSunColor.value.copy(env.sunColor);
    skyU.uSunPower.value = env.sunSkyPower;
    skyU.uStars.value = env.stars;
    skyU.uMoonDir.value.copy(_moonDir);
    skyU.uMoon.value = env.moon;
    skyU.uHaze.value = env.haze;
    skyU.uCityGlow.value.copy(env.cityGlow).multiplyScalar(0.35 + env.cityLights * 0.9);
    sky.mesh.position.copy(camera ? camera.position : frame.cameraPos);

    // ---- fog ----
    const cloudBand =
      smoothstep(0.12, 0.22, p) * (1 - smoothstep(0.3, 0.4, p)) +
      0.6 * smoothstep(0.68, 0.73, p) * (1 - smoothstep(0.74, 0.79, p));
    if (ownFog) {
      ownFog.color.copy(env.fogColor);
      ownFog.density = env.fogDensity * (1 + cloudBand * 2.4);
    } else if (scene.fog && scene.fog.color) {
      scene.fog.color.copy(env.fogColor);
      if (scene.fog.isFogExp2) scene.fog.density = env.fogDensity;
    }
    if (ownBackground) {
      ownBackground.copy(env.horizon).multiplyScalar(0.32);
    }

    // ---- clouds ----
    const seaU = cloudSea.material.uniforms;
    seaU.uLit.value.copy(env.cloudLit);
    seaU.uShadow.value.copy(env.cloudShadow);
    seaU.uSunColor.value.copy(env.cloudSun);
    seaU.uSunDir.value.copy(_sunDir);
    seaU.uHorizon.value.copy(env.horizon);
    seaU.uCityGlow.value.copy(env.cityGlow).multiplyScalar(1.4);
    seaU.uCameraXZ.value.set(frame.cameraPos.x, frame.cameraPos.z);
    seaU.uClearCenter.value.set(-2700, 0);
    const deckCoverage =
      smoothstep(0.12, 0.24, p) * (1 - smoothstep(0.735, 0.80, p)) * (p < 0.12 ? 0 : 1);
    seaU.uCoverage.value = deckCoverage;
    seaU.uNight.value = clamp01(-env.sunElev / 10);
    seaU.uTime.value = t;
    seaU.uCameraY.value = frame.cameraPos.y;

    for (const layer of [climbPuffs, cruisePuffs, lowPuffs]) {
      const u = layer.userData.uniforms;
      u.uLit.value.copy(env.cloudLit);
      u.uShadow.value.copy(env.cloudShadow);
      u.uSunColor.value.copy(env.cloudSun);
      u.uSunDir.value.copy(_sunDir);
      u.uTime.value = t;
    }
    climbPuffs.userData.uniforms.uOpacity.value = 0.92;
    cruisePuffs.userData.uniforms.uOpacity.value = 0.72;
    lowPuffs.userData.uniforms.uOpacity.value = 0.32 * (1 - smoothstep(0.9, 1.0, p));

    // ---- city ----
    const cityGlowUniforms = city.userData.groundUniforms;
    if (cityGlowUniforms) {
      cityGlowUniforms.uGlow.value = 0.15 + env.cityLights * 0.55;
      cityGlowUniforms.uHorizon.value.copy(env.horizon).multiplyScalar(0.18);
      cityGlowUniforms.uTime.value = t;
    }
    if (city.userData.glowMaterial) {
      city.userData.glowMaterial.uniforms.uOpacity.value = 0.35 + env.cityLights * 0.95;
    }
    if (city.userData.hazeUniforms) {
      city.userData.hazeUniforms.uAmount.value = 0.02 + env.cityLights * 0.11;
    }
    if (city.userData.updateCars) city.userData.updateCars(dt);

    // sequenced approach flashers
    const flashers = destinationRunway.userData.flashers;
    if (flashers && flashers.instanceColor) {
      const step = Math.floor((t * 2.4) % 18);
      for (let f = 0; f < 18; f++) {
        let d = f - step;
        if (d < 0) d += 18;
        const bright = d < 3 ? 1 - d / 3 : 0;
        _tmpColor.setRGB(bright, bright * 0.96, bright * 0.86);
        flashers.setColorAt(f, _tmpColor);
      }
      flashers.instanceColor.needsUpdate = true;
    }

    // REIL + tower beacons
    const flash = (t % 1.1) < 0.11 ? 1 : 0;
    if (destinationRunway.userData.reilMaterial) {
      destinationRunway.userData.reilMaterial.color.setRGB(flash, flash, flash);
    }
    if (departureRunway.userData.reilMaterial) {
      departureRunway.userData.reilMaterial.color.setRGB(
        (t + 0.3) % 1.1 < 0.11 ? 1 : 0,
        0.9,
        0.9
      );
    }
    const beaconPulse = 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(t * 2.1)), 4);
    if (departureTerminal.userData.beaconMaterial) {
      departureTerminal.userData.beaconMaterial.color.setRGB(beaconPulse, 0.08, 0.04);
    }
    if (destinationTerminal.userData.beaconMaterial) {
      destinationTerminal.userData.beaconMaterial.color.setRGB(beaconPulse * 0.9, 0.06, 0.03);
    }

    // ---- camera ----
    if (camera) {
      const sway = frame.cameraSway;
      camera.position.copy(frame.cameraPos);
      if (sway > 0) {
        camera.position.x += Math.sin(t * 0.83) * sway * 1.6 + Math.sin(t * 2.17) * sway * 0.4;
        camera.position.y += Math.cos(t * 0.67) * sway * 1.15;
        camera.position.z += Math.sin(t * 1.13) * sway * 0.55;
      }
      camera.up.copy(frame.cameraUp);
      camera.lookAt(frame.lookAt);
      sky.mesh.position.copy(camera.position);
    }

    return frame;
  }

  /* --------------------------------------------------------- environment */
  function getEnvironment(progress) {
    const p = clamp01(finite(progress, 0));
    const env = sampleEnv(p, _env);
    sunDirection(env.sunElev, env.sunAzim, _sunDir);
    return {
      progress: p,
      sunElevation: env.sunElev,
      sunAzimuth: env.sunAzim,
      sunDirection: _sunDir.clone(),
      sunColor: env.sunColor.clone(),
      horizonColor: env.horizon.clone(),
      zenithColor: env.zenith.clone(),
      fogColor: env.fogColor.clone(),
      fogDensity: env.fogDensity,
      starAmount: env.stars,
      moonAmount: env.moon,
      cloudCoverage: env.cloudCoverage,
      cityLights: env.cityLights,
      sunIntensity: env.sunIntensity,
      hemiIntensity: env.hemiIntensity
    };
  }

  /* ----------------------------------------------------------- stats/API */
  let runwayLightCount = 0;
  for (const runwayGroup of [departureRunway, destinationRunway]) {
    runwayGroup.traverse((obj) => {
      if (obj.isPoints && obj.geometry && obj.geometry.attributes.position) {
        runwayLightCount += obj.geometry.attributes.position.count;
      }
    });
  }

  const stats = {
    worldUnitsPerMeter: WORLD_UNITS_PER_METER,
    flightPathLengthUnits: Number(curve.getLength().toFixed(1)),
    buildings: city.userData.buildingCount,
    cityWindows: city.userData.windowCount,
    streetLights: city.userData.streetLightCount,
    highways: city.userData.highwayCount,
    climbCloudPuffs: climbPuffs.userData.count,
    cruiseCloudPuffs: cruisePuffs.userData.count,
    descentCloudPuffs: lowPuffs.userData.count,
    runwayLights: runwayLightCount
  };

  function setPixelRatio(value) {
    const ratio = clamp(finite(value, 1), 0.5, 3);
    shared.pixelRatio.value = ratio;
  }

  const disposed = { value: false };

  function dispose() {
    if (disposed.value) return;
    disposed.value = true;

    scene.remove(group);

    if (params.manageFog && scene.fog === ownFog) {
      scene.fog = previousFog;
    }
    if (params.manageBackground && scene.background === ownBackground) {
      scene.background = previousBackground;
    }

    const geometries = new Set();
    group.traverse((obj) => {
      if (obj.geometry) geometries.add(obj.geometry);
    });
    for (const geo of geometries) geo.dispose();

    for (const material of materialList) {
      if (!material) continue;
      for (const key of Object.keys(material)) {
        const value = material[key];
        if (value && value.isTexture) value.dispose();
      }
      material.dispose();
    }

    group.clear();
  }

  return {
    group,
    lights: {
      sun: sunLight,
      moon: moonLight,
      hemisphere: hemiLight,
      ambient: ambientLight,
      cityBounce,
      landing: landingLight
    },
    aircraft,
    cockpit: aircraft.userData.cockpit,
    runway: {
      departure: departureRunway,
      destination: destinationRunway
    },
    sky: sky.mesh,
    clouds: { sea: cloudSea, climb: climbPuffs, cruise: cruisePuffs, descent: lowPuffs },
    city,
    getFlightPose,
    getEnvironment,
    setPixelRatio,
    update,
    stats,
    dispose
  };
}
