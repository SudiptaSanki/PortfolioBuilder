// flow.js — Station 01's life & light (the atmosphere.js + lighting.js
// role): the hall's bright clinical rig, a whisper of dust, the shared
// status-LED shader field, and THE one particle system — packets travel
// fixed paths between named pieces of plant, coloured by refinement
// stage: aqua raw, steel-white validated, gold features. All motion is
// computed in the vertex shaders from a uniform clock — zero per-frame
// CPU cost, no geometry churn (the gpuUnit.js discipline). The clock is
// accumulated from clamped frame deltas by the entry point, so a hidden
// tab (no frames) freezes the data where it was.

import * as THREE from 'three';
import { STATION01, PALETTE, seeded } from '../../config/world.js';

const S01 = STATION01;

// ------------------------------------------------------- shared LEDs ----
// One shader, one clock — every status light in the station (gateway
// flicker, carrier activity, gate check lights, online-store blink) is
// a point in a field built by createLEDField. Same shader as Station
// 03's gpuUnit field: per-point colour + blink phase, size attenuated.
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
// the data itself.
export function createHallLighting() {
  const group = new THREE.Group();
  group.name = 's01-lighting';
  const H = S01.room.height;

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
  for (const [x, z] of [[-3.4, 0], [0.2, 0], [3.4, 0], [4.6, 2.2]]) {
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
  group.name = 's01-dust';
  const rnd = seeded(97);
  const pos = new Float32Array(DUST_COUNT * 3);
  _dustBase = new Float32Array(DUST_COUNT * 3);
  _dustSeed = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    const x = -3.8 + rnd() * 6.0;                    // above the gallery
    const y = 1.1 + rnd() * 2.0;
    const z = (rnd() - 0.5) * 4.6;
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

// ---------------------------------------------------------- flow paths --
// Fixed routes between named plant. Stage colours per the inventory:
// aqua raw (sources → gate), steel-white validated (gate → bronze),
// steel then gold for the tier refinement hops, gold onward (tiers →
// vault, materialisation bursts, exit). Speeds are walking pace.
const G = S01.gallery;
const chZ = (i) => G.channels[i].z;
const bayZ = (i) => S01.sources.bayZ[i];
const BRONZE = S01.tiers[0], SILVER = S01.tiers[1], GOLD = S01.tiers[2];
const bayFrontX = S01.tierBay.x - S01.tierBay.depth / 2 - 0.12;

const PATHS = [];
for (let i = 0; i < 4; i++) {
  // raw: gateway → along its channel → write head → under the gate
  PATHS.push({
    color: PALETTE.fibreAqua, count: 110, speed: 0.75, burst: 0,
    pts: [
      [S01.sources.faceX - 0.02, 1.15, bayZ(i)],
      [-4.55, 1.1, bayZ(i) + (chZ(i) - bayZ(i)) * 0.55],
      [-3.4, 1.06, chZ(i)],
      [0.4, 1.06, chZ(i)],
      [1.62, 1.06, chZ(i)],
      [S01.gate.x + 0.18, 1.16, chZ(i)],
    ],
  });
  // validated: gate → bronze (everything lands in bronze first)
  PATHS.push({
    color: PALETTE.steel, count: 70, speed: 0.65, burst: 0,
    pts: [
      [S01.gate.x + 0.18, 1.16, chZ(i)],
      [3.3, 1.22, chZ(i) * 0.55],
      [4.4, 1.26, -1.7 + i * 0.28],
      [bayFrontX, 1.3, BRONZE.z - 0.35 + i * 0.22],
    ],
  });
}
PATHS.push( // refinement hop: bronze → silver (still being cleansed)
  {
    color: PALETTE.steel, count: 55, speed: 0.5, burst: 0,
    pts: [
      [bayFrontX, 1.3, BRONZE.z + 0.3],
      [bayFrontX - 0.35, 1.32, (BRONZE.z + SILVER.z) / 2],
      [bayFrontX, 1.3, SILVER.z - 0.3],
    ],
  },
  { // refinement hop: silver → gold (becoming features)
    color: PALETTE.dgxGold, count: 55, speed: 0.5, burst: 0,
    pts: [
      [bayFrontX, 1.3, SILVER.z + 0.3],
      [bayFrontX - 0.35, 1.32, (SILVER.z + GOLD.z) / 2],
      [bayFrontX, 1.3, GOLD.z - 0.3],
    ],
  },
  { // gold → the vault's archive wall
    color: PALETTE.dgxGold, count: 80, speed: 0.6, burst: 0,
    pts: [
      [bayFrontX, 1.3, GOLD.z + 0.25],
      [4.85, 1.38, 2.1],
      [S01.vault.archiveX[1], 1.32, S01.vault.archiveZ - 0.35],
    ],
  },
  { // materialisation: archive → online store, in periodic bursts
    color: PALETTE.dgxGold, count: 70, speed: 0, burst: 1,
    pts: [
      [S01.vault.archiveX[1], 2.18, S01.vault.archiveZ - 0.14],
      [4.85, 2.32, 2.75],
      [S01.vault.online.x, 1.52, S01.vault.online.z + 0.05],
    ],
  },
  { // exit: online store → east wall → Station 02
    color: PALETTE.dgxGold, count: 40, speed: 0.45, burst: 0,
    pts: [
      [S01.vault.online.x + 0.18, 1.2, S01.vault.online.z],
      [5.78, 1.95, 2.62],
      [6.06, 2.42, 2.85],
    ],
  },
);

const PATH_SAMPLES = 256;
const flowUniforms = {
  uTime: { value: 0 },
  uProj: { value: 900 },
  uPaths: { value: null },
};

function buildFlowPoints() {
  // bake every path's CatmullRom samples into a float texture; the
  // vertex shader fetches positions by (path row, u) — no CPU motion.
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

  let total = 0;
  for (const p of PATHS) total += p.count;
  const pos = new Float32Array(total * 3);           // dummy, real pos in shader
  const aPath = new Float32Array(total * 4);         // row, offset, rate, burst
  const aColor = new Float32Array(total * 3);
  const rnd = seeded(1234);
  const c = new THREE.Color();
  let k = 0;
  PATHS.forEach((p, r) => {
    c.setHex(p.color);
    for (let i = 0; i < p.count; i++, k++) {
      // burst packets ride as a train: offsets clustered at the start
      const off = p.burst ? rnd() * 0.22 : rnd();
      aPath.set([r, off, p.speed / lengths[r], p.burst], k * 4);
      aColor.set([c.r, c.g, c.b], k * 3);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPath', new THREE.BufferAttribute(aPath, 4));
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
      attribute vec4 aPath;           // row, offset, rate (u/s), burst flag
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uProj;
      uniform sampler2D uPaths;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        float u;
        float alpha = 0.85;
        if (aPath.w > 0.5) {
          // materialisation heartbeat: a train crosses in the first
          // ~2.3 s of each 6 s cycle, then the path rests dark.
          float f = fract(uTime / 6.0);
          float phase = clamp(f / 0.38, 0.0, 1.0);
          u = aPath.y + phase * 0.78;
          alpha = (1.0 - smoothstep(0.36, 0.46, f)) * 0.9;
        } else {
          u = fract(aPath.y + uTime * aPath.z);
        }
        vAlpha = alpha;
        int idx = int(clamp(u, 0.0, 1.0) * ${(PATH_SAMPLES - 1).toFixed(1)} + 0.5);
        vec3 p = texelFetch(uPaths, ivec2(idx, int(aPath.x + 0.5)), 0).xyz;
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
  group.name = 's01-flow';
  group.add(buildFlowPoints());
  return group;
}

// --------------------------------------------------------------- tick ---
// One clock for every shader in the station (LED fields + flow). The
// entry point passes accumulated active time, so hidden tabs pause.
export function tickFlow(t) {
  ledUniforms.uTime.value = t;
  flowUniforms.uTime.value = t;
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
