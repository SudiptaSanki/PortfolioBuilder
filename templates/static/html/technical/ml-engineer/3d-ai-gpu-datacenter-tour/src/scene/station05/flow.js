// flow.js — Station 05's life & light (the Station 01/02 flow.js
// role): the hall's bright clinical rig, a whisper of dust, the
// shared status-LED shader field, THE one particle system — request
// traffic on fixed paths, split between the version lanes in the
// gate's current ratio — and the canary cycle state the gate, drum
// and lectern all read. All motion is computed in the vertex shader
// from a uniform clock: zero per-frame CPU cost, no geometry churn.
// The clock is accumulated from clamped frame deltas by the entry
// point, so a hidden tab freezes the hall where it was.

import * as THREE from 'three';
import { STATION05, PALETTE, seeded } from '../../config/world.js';

const S05 = STATION05;

// ------------------------------------------------------- canary cycle --
// The rollout staircase, shared by the traffic shader (uV2), the
// gate vane + percentage drum and the analysis lectern (canary.js).
// Steps are DECLARED, not improvised (Argo Rollouts setWeight):
// v2 earns 10 → 25 → 50 → 100, holding ~20 s of hall time per step
// while analysis passes, rests at 100, then the room sits "between
// releases" back at 90/10 before the demonstration loop repeats.
// (A real rollout's steps are minutes apart and metric-gated, not
// clocked — the gate plate in meshLabels.js says so.)
export const CANARY_STEPS = S05.flow.steps;              // [10, 25, 50, 100]

export function canaryStepAt(t) {
  const F = S05.flow;
  const period = F.hold * 3 + F.restAtFull + F.between;
  const ph = t % period;
  if (ph < F.hold) return 0;
  if (ph < F.hold * 2) return 1;
  if (ph < F.hold * 3) return 2;
  if (ph < F.hold * 3 + F.restAtFull) return 3;
  return 0;                                  // between releases: 90/10
}

export function canaryV2(t) {
  return CANARY_STEPS[canaryStepAt(t)] / 100;
}

// ------------------------------------------------------- shared LEDs ----
// One shader, one clock — every status light in the station (pod
// readiness, socket lamps, console lights, the gate lamp) is a point
// in a field built by createLEDField. Same shader as Station 03's
// gpuUnit field: per-point colour + blink phase, size attenuated.
export const ledUniforms = { uTime: { value: 0 }, uProj: { value: 900 } };
const _ledMat = new THREE.ShaderMaterial({
  uniforms: ledUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute vec3 aColor;
    attribute vec2 aBlink;            // x: phase, y: blink amount 0..1
    uniform float uTime;
    uniform float uProj;
    varying vec3 vColor;
    varying float vGlow;
    void main() {
      vColor = aColor;
      float b = 1.0;
      if (aBlink.y > 0.01) {
        float s = sin(uTime * 2.4 + aBlink.x * 6.2831);
        b = mix(1.0, 0.25 + 0.75 * smoothstep(-0.3, 0.3, s), aBlink.y);
      }
      vGlow = b;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 0.0115 * uProj / max(0.1, -mv.z) * (0.8 + 0.4 * b);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    varying vec3 vColor;
    varying float vGlow;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      float fall = smoothstep(0.5, 0.05, length(d));
      gl_FragColor = vec4(vColor * vGlow * 2.1, fall * vGlow);
    }`,
});

// list: [{x, y, z, color (hex), phase 0..1, blink 0..1}] in world space
// of the group the returned Points is added to.
export function createLEDField(list) {
  const n = list.length;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const blk = new Float32Array(n * 2);
  const c = new THREE.Color();
  list.forEach((l, i) => {
    pos.set([l.x, l.y, l.z], i * 3);
    c.setHex(l.color);
    col.set([c.r, c.g, c.b], i * 3);
    blk.set([l.phase, l.blink], i * 2);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aBlink', new THREE.BufferAttribute(blk, 2));
  const points = new THREE.Points(geo, _ledMat);
  points.frustumCulled = false;
  return points;
}

export function setLEDProjFactor(f) {
  ledUniforms.uProj.value = f;
  flowUniforms.uProj.value = f;
}

// ------------------------------------------------------------ lighting --
// The hall keeps Station 03's rig values: even 5000 K strips, a high
// ambient base, gentle fills — the only coloured light in the room is
// the traffic itself (particles, LEDs, the gate lamp).
export function createHallLighting() {
  const group = new THREE.Group();
  group.name = 's05-lighting';
  const H = S05.room.height;

  const housingMat = new THREE.MeshStandardMaterial({
    color: PALETTE.lightHousing, roughness: 0.5, metalness: 0.5,
  });
  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0x111111, emissive: PALETTE.lightNeutral, emissiveIntensity: 2.6,
  });
  const stripLen = 10.6;
  for (const z of [-1.8, 0, 1.8]) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(stripLen, 0.05, 0.24), housingMat);
    housing.position.set(0, H - 0.06, z);
    group.add(housing);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(stripLen - 0.1, 0.02, 0.16), diffuserMat);
    bar.position.set(0, H - 0.095, z);
    group.add(bar);
    for (let x = -stripLen / 2 + 0.5; x < stripLen / 2; x += 1.8) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 5), housingMat);
      rod.position.set(x, H - 0.02, z);
      group.add(rod);
    }
  }

  const hemi = new THREE.HemisphereLight(0xffffff, 0xc9ced3, 0.95);
  group.add(hemi);
  const key = new THREE.DirectionalLight(0xfff6e8, 1.15);
  key.position.set(3.5, 6.5, 2.5);
  group.add(key);
  const fill = new THREE.DirectionalLight(0xeef2f5, 0.4);
  fill.position.set(-4, 5, -3);
  group.add(fill);
  for (const [x, z] of [[-3.6, -1.2], [-0.4, 0.4], [2.6, -1.2], [1.2, 2.2]]) {
    const p = new THREE.PointLight(PALETTE.lightNeutral, 16, 9, 1.7);
    p.position.set(x, 2.8, z);
    group.add(p);
  }
  return group;
}

// ---------------------------------------------------------------- dust --
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

const DUST_COUNT = 130;
let _dust = null;
let _dustBase = null;
let _dustSeed = null;

export function createDust() {
  const group = new THREE.Group();
  group.name = 's05-dust';
  const rnd = seeded(509);
  const pos = new Float32Array(DUST_COUNT * 3);
  _dustBase = new Float32Array(DUST_COUNT * 3);
  _dustSeed = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    const x = -4.8 + rnd() * 10.2;                   // above the mesh floor
    const y = 1.2 + rnd() * 1.9;
    const z = (rnd() - 0.5) * 5.4;
    _dustBase.set([x, y, z], i * 3);
    pos.set([x, y, z], i * 3);
    _dustSeed[i] = rnd() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  _dust = new THREE.Points(geo, new THREE.PointsMaterial({
    map: dotTexture(), color: 0xffffff, size: 0.011, sizeAttenuation: true,
    transparent: true, opacity: 0.3, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  _dust.frustumCulled = false;
  group.add(_dust);
  return group;
}

// ------------------------------------------------------------- traffic --
// Fixed routes, baked into a float texture (the Station 01 pattern):
//   row 0 — requests routed to the v1 lane
//   row 1 — requests routed to the v2 lane
//   row 2 — the metrics return: lanes → analysis lectern
// Rows 0/1 share one trunk (fascia → switchboard → overhead tray →
// gate drop) and diverge only at the vane. Each request point rolls
// its lane PER LAP in the vertex shader (seed + lap counter hashed
// against the uV2 uniform), so when the gate steps, the population
// re-balances over one traverse instead of teleporting mid-lane —
// and the lane densities ARE the gate's ratio, exactly.
const TRUNK = [
  [2.5, 2.3, -3.3],                    // ingress fascia, north wall
  [1.2, 2.48, -3.27],                  // rise into the overhead tray
  [-1.5, 2.54, -3.27],                 // west in the tray
  [-2.86, 2.54, -3.0],                 // the tray's south turn
  [-2.88, 2.54, 0.6],                  // south over the west walkway
  [-2.88, 2.2, 1.8],                   // the drop at the gate column
  [-2.84, 1.35, 1.97],
  [-2.72, 1.02, 2.0],                  // the vane
];
const PATHS = [
  { // row 0 — v1 lane (steel)
    pts: [...TRUNK,
      [-2.3, 0.66, 1.62], [-1.2, 0.58, S05.lanes.v1.z], [0.8, 0.58, S05.lanes.v1.z],
      [2.6, 0.58, S05.lanes.v1.z], [3.35, 0.62, 1.58]],
  },
  { // row 1 — v2 lane (gold trim)
    pts: [...TRUNK,
      [-2.3, 0.66, 2.38], [-1.2, 0.58, S05.lanes.v2.z], [0.8, 0.58, S05.lanes.v2.z],
      [2.6, 0.58, S05.lanes.v2.z], [3.35, 0.62, 2.42]],
  },
  { // row 2 — metrics return, between the lanes, skirting the gate
    pts: [
      [3.3, 0.72, 2.0], [1.2, 0.68, 2.0], [-0.8, 0.68, 2.0], [-2.45, 0.7, 2.0],
      [-2.92, 0.62, 2.62], [-3.34, 0.95, 2.3], [-3.38, 1.06, 2.06],
    ],
  },
];

const PATH_SAMPLES = 256;
const flowUniforms = {
  uTime: { value: 0 },
  uProj: { value: 900 },
  uPaths: { value: null },
  uV2: { value: CANARY_STEPS[0] / 100 },
};

function buildTrafficPoints() {
  const rows = PATHS.length;
  const data = new Float32Array(PATH_SAMPLES * rows * 4);
  const lengths = [];
  PATHS.forEach((p, r) => {
    const curve = new THREE.CatmullRomCurve3(p.pts.map((q) => new THREE.Vector3(...q)));
    lengths.push(curve.getLength());
    const v = new THREE.Vector3();
    for (let s = 0; s < PATH_SAMPLES; s++) {
      curve.getPoint(s / (PATH_SAMPLES - 1), v);
      data.set([v.x, v.y, v.z, 1], (r * PATH_SAMPLES + s) * 4);
    }
  });
  const tex = new THREE.DataTexture(data, PATH_SAMPLES, rows, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  flowUniforms.uPaths.value = tex;

  const total = S05.flow.points;
  const nReturn = 170;
  const nRequest = total - nReturn;
  const pos = new Float32Array(total * 3);           // dummy, real pos in shader
  const aSeed = new Float32Array(total);
  const aParam = new Float32Array(total * 3);        // rate, kind (0 req / 1 return), stop u
  const aColor = new Float32Array(total * 3);
  const rnd = seeded(2027);
  const cAqua = new THREE.Color(PALETTE.fibreAqua);
  const cSteel = new THREE.Color(0xe8ecee);
  const reqRate = 1.0 / lengths[0];                  // ~1 m/s along the route
  const retRate = 0.5 / lengths[2];
  for (let i = 0; i < total; i++) {
    const isReturn = i >= nRequest;
    aSeed[i] = rnd();
    if (isReturn) {
      aParam.set([retRate * (0.9 + rnd() * 0.2), 1, 1], i * 3);
      aColor.set([cSteel.r, cSteel.g, cSteel.b], i * 3);
    } else {
      // answered at a capsule along the lane: fade out past `stop`,
      // which sits inside the lane stretch of the route (u ≳ 0.7)
      aParam.set([reqRate * (0.92 + rnd() * 0.16), 0, 0.72 + rnd() * 0.265], i * 3);
      aColor.set([cAqua.r, cAqua.g, cAqua.b], i * 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geo.setAttribute('aParam', new THREE.BufferAttribute(aParam, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));

  const mat = new THREE.ShaderMaterial({
    uniforms: flowUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    // NO glslVersion here — deliberately the gpuUnit.js LED pattern.
    // Three compiles every ShaderMaterial as GLSL ES 3.00 under WebGL2
    // (so texelFetch stays available) and supplies the attribute /
    // varying / gl_FragColor compatibility defines ONLY when
    // glslVersion is unset; declaring GLSL3 drops the gl_FragColor
    // define and the fragment shader fails to compile.
    vertexShader: /* glsl */`
      attribute float aSeed;
      attribute vec3 aParam;          // rate (u/s), kind, stop u
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uProj;
      uniform float uV2;
      uniform sampler2D uPaths;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        float ph = aSeed + uTime * aParam.x;
        float u = fract(ph);
        float row;
        float alpha;
        if (aParam.y > 0.5) {
          row = 2.0;                               // metrics return
          alpha = 0.5 * smoothstep(0.0, 0.04, u) * (1.0 - smoothstep(0.96, 1.0, u));
        } else {
          // one lane roll per lap: the split is re-rolled only when
          // the point wraps, so a gate step never teleports traffic
          float lap = floor(ph);
          float roll = fract(aSeed * 17.31 + lap * 0.61803);
          row = roll < uV2 ? 1.0 : 0.0;
          alpha = 0.85 * smoothstep(0.0, 0.025, u)
                * (1.0 - smoothstep(aParam.z, aParam.z + 0.04, u));
        }
        vAlpha = alpha;
        int idx = int(clamp(u, 0.0, 1.0) * ${(PATH_SAMPLES - 1).toFixed(1)} + 0.5);
        vec3 p = texelFetch(uPaths, ivec2(idx, int(row + 0.5)), 0).xyz;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 0.0238 * uProj / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float fall = smoothstep(0.4, 0.12, length(d));
        gl_FragColor = vec4(vColor * 1.6, fall * vAlpha);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

export function createFlow() {
  const group = new THREE.Group();
  group.name = 's05-flow';
  group.add(buildTrafficPoints());
  return group;
}

// --------------------------------------------------------------- tick ---
// One clock for every shader in the station (LED fields + traffic),
// plus the gate's share as a uniform — a staircase, stepped here so
// the shader and the machinery (canary.js) read the same value.
export function tickFlow(t) {
  ledUniforms.uTime.value = t;
  flowUniforms.uTime.value = t;
  flowUniforms.uV2.value = canaryV2(t);
  if (_dust) {
    const pos = _dust.geometry.attributes.position;
    for (let i = 0; i < DUST_COUNT; i++) {
      const s = _dustSeed[i];
      pos.array[i * 3] = _dustBase[i * 3] + Math.sin(t * 0.07 + s * 1.7) * 0.05;
      pos.array[i * 3 + 1] = _dustBase[i * 3 + 1] + Math.sin(t * 0.12 + s) * 0.045;
    }
    pos.needsUpdate = true;
  }
}
