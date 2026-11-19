// flow.js — Station 04's life & light: the hall's bright clinical rig,
// a whisper of dust, the shared status-LED shader field, the build
// clock's stage lights (chips, gate flashes, the seal — registered by
// the plant modules, driven from here so no cell carries its own
// animation logic), and THE one particle system: the build packet
// travelling fixed paths — commit gantry → line → gates → layer stack
// → registry → signing desk → one circuit of the deploy ring → out
// the east gate. Colour by stage: aqua in flight, steel-white
// assembled, green only once signed. All packet motion is computed in
// the vertex shader from a uniform clock — zero per-frame CPU cost.
// The clock is accumulated from clamped frame deltas by the entry
// point, so a hidden tab freezes the build where it was.

import * as THREE from 'three';
import { STATION04, PALETTE, seeded } from '../../config/world.js';

const S04 = STATION04;
export const BUILD_CYCLE = S04.flow.cycle;   // seconds per build loop

// ------------------------------------------------------- shared LEDs ----
// One shader, one clock — every status light in the station is a point
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

// ------------------------------------------------- build-clock lights --
// Emissive plates whose moment is a point in the build cycle: the
// runner stage chips lighting in sequence, the green flash at each
// quality gate as the packet passes, the seal at the signing desk.
// Plant modules register their materials here; tickFlow drives them
// all from the one clock (the inventory's rule: the lighting is
// driven by flow.js's build clock, not by per-cell animation logic).
const _stageLights = [];
export function registerStageLight(mat, centre, { width = 0.016, base = 0.12, peak = 2.4 } = {}) {
  mat.emissiveIntensity = base;
  _stageLights.push({ mat, centre, width, base, peak });
}

function tickStageLights(t) {
  const f = (t % BUILD_CYCLE) / BUILD_CYCLE;
  for (const s of _stageLights) {
    let d = Math.abs(f - s.centre);
    d = Math.min(d, 1 - d);
    const k = Math.exp(-(d * d) / (s.width * s.width));
    s.mat.emissiveIntensity = s.base + s.peak * k;
  }
}

// ------------------------------------------------------------ lighting --
// The hall keeps Station 03's rig values: even 5000 K strips, a high
// ambient base, gentle fills — the only coloured light in the room is
// the build itself.
export function createHallLighting() {
  const group = new THREE.Group();
  group.name = 's04-lighting';
  const H = S04.room.height;

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
  for (const [x, z] of [[-3.6, -0.6], [-0.6, -0.6], [1.8, -0.6], [3.7, -0.6], [3.6, 2.2]]) {
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

const DUST_COUNT = 110;
let _dust = null;
let _dustBase = null;
let _dustSeed = null;

export function createDust() {
  const group = new THREE.Group();
  group.name = 's04-dust';
  const rnd = seeded(41);
  const pos = new Float32Array(DUST_COUNT * 3);
  _dustBase = new Float32Array(DUST_COUNT * 3);
  _dustSeed = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    const x = -5.2 + rnd() * 10.4;
    const y = 1.1 + rnd() * 2.0;
    const z = (rnd() - 0.5) * 5.6;
    _dustBase.set([x, y, z], i * 3);
    pos.set([x, y, z], i * 3);
    _dustSeed[i] = rnd() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  _dust = new THREE.Points(geo, new THREE.PointsMaterial({
    map: dotTexture(), color: 0xffffff, size: 0.011, sizeAttenuation: true,
    transparent: true, opacity: 0.28, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  _dust.frustumCulled = false;
  group.add(_dust);
  return group;
}

// ---------------------------------------------------------- flow paths --
// Fixed routes between named plant, each with its window in the build
// cycle (fraction of BUILD_CYCLE): a train of points crosses during
// its window and the path rests dark outside it — the pauses at the
// gates and the desk are the gaps between windows. Stage colours per
// the inventory: aqua in flight, steel-white assembled, gold for the
// model weights joining at the stack, green only after signing.
const L = S04.line;
const RING = S04.ring;

function ringCircuitPts() {
  const pts = [[RING.x, 1.0, 2.2], [RING.x, 1.0, 1.0]];
  for (let a = 0; a >= -270; a -= 15) {
    const th = a * Math.PI / 180;
    pts.push([RING.x + RING.radius * Math.sin(th), 1.02, RING.z + RING.radius * Math.cos(th)]);
  }
  pts.push([5.45, 1.05, RING.z], [5.85, 1.3, RING.z], [6.03, 1.55, RING.z]);
  return pts;
}

const PATHS = [
  { // the line: gantry → cells → gate 1 → gate 2 → stack base (aqua)
    color: PALETTE.fibreAqua, count: 250, win: [0.02, 0.30],
    pts: [
      [-5.35, 1.04, L.z], [-4.5, 1.0, L.z], [-3.2, 1.0, L.z], [-2.2, 1.0, L.z],
      [-1.46, 1.0, L.z], [-1.32, 1.0, L.z],           // cluster: slows at gate 1
      [0.14, 1.0, L.z], [0.28, 1.0, L.z],             // cluster: slows at gate 2
      [1.0, 1.0, L.z], [1.5, 1.0, L.z],
    ],
  },
  { // the stack climb: slabs bottom → top as the image assembles
    color: PALETTE.steel, count: 80, win: [0.295, 0.385],
    pts: [
      [1.58, 0.32, L.z], [1.7, 0.55, L.z], [1.7, 0.85, L.z],
      [1.7, 1.12, L.z], [1.78, 1.32, L.z],
    ],
  },
  { // the model weights: intake dock → spur → the weights layer (gold)
    color: PALETTE.dgxGold, count: 90, win: [0.29, 0.40],
    pts: [
      [-4.95, 0.62, -1.95], [-4.2, 0.55, -1.55], [-2.0, 0.52, -1.5],
      [0.0, 0.52, -1.5], [1.2, 0.6, -1.2], [1.62, 0.75, -0.68],
    ],
  },
  { // assembled: stack → a registry shelf slot (steel-white)
    color: PALETTE.steel, count: 120, win: [0.40, 0.50],
    pts: [
      [1.85, 1.15, -0.55], [2.8, 1.3, 0.1], [4.2, 1.3, 0.85], [5.35, 1.25, 1.45],
    ],
  },
  { // registry → the signing desk (steel-white)
    color: PALETTE.steel, count: 80, win: [0.50, 0.575],
    pts: [
      [5.3, 1.2, 1.7], [4.5, 1.1, 2.25], [3.8, 1.02, 2.38],
    ],
  },
  { // signed: desk → one circuit of the ring → deploy gate → out (green)
    color: PALETTE.ledGreen, count: 330, win: [0.575, 0.86],
    pts: ringCircuitPts(),
  },
];

const PATH_SAMPLES = 256;
const flowUniforms = {
  uTime: { value: 0 },
  uProj: { value: 900 },
  uPaths: { value: null },
  uCycle: { value: BUILD_CYCLE },
};

function buildFlowPoints() {
  // bake every path's CatmullRom samples into a float texture; the
  // vertex shader fetches positions by (path row, u) — no CPU motion.
  const rows = PATHS.length;
  const data = new Float32Array(PATH_SAMPLES * rows * 4);
  PATHS.forEach((p, r) => {
    const curve = new THREE.CatmullRomCurve3(p.pts.map((q) => new THREE.Vector3(...q)));
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
  const aPath = new Float32Array(total * 4);         // row, train offset, win t0, win t1
  const aColor = new Float32Array(total * 3);
  const rnd = seeded(2024);
  const c = new THREE.Color();
  let k = 0;
  PATHS.forEach((p, r) => {
    c.setHex(p.color);
    for (let i = 0; i < p.count; i++, k++) {
      aPath.set([r, rnd() * 0.3, p.win[0], p.win[1]], k * 4);
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
      attribute vec4 aPath;           // row, train offset, window t0, window t1 (cycle fractions)
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uProj;
      uniform float uCycle;
      uniform sampler2D uPaths;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        float f = fract(uTime / uCycle);
        float span = max(0.001, aPath.w - aPath.z);
        float local = clamp((f - aPath.z) / span, 0.0, 1.0);
        float u = clamp(local * 1.3 - aPath.y, 0.0, 1.0);
        float gate = smoothstep(aPath.z - 0.004, aPath.z + 0.012, f)
                   * (1.0 - smoothstep(aPath.w - 0.012, aPath.w + 0.004, f));
        float ends = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.88, 1.0, u));
        vAlpha = 0.85 * gate * ends;
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
  group.name = 's04-flow';
  group.add(buildFlowPoints());
  return group;
}

// --------------------------------------------------------------- tick ---
// One clock for every shader and stage light in the station. The
// entry point passes accumulated active time, so hidden tabs pause.
export function tickFlow(t) {
  ledUniforms.uTime.value = t;
  flowUniforms.uTime.value = t;
  tickStageLights(t);
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
