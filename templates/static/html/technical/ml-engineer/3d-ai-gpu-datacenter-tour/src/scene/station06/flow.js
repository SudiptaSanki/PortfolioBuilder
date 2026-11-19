// flow.js — Station 06's life (the Station 01 flow.js role): the shared
// status-LED shader field and THE one particle system — telemetry
// packets walk the OpenTelemetry pipeline (entry → RECEIVE → PROCESS →
// EXPORT) and branch to the instruments it feeds: the console arc, the
// traces waterfall, the map wall. Colour by stage, the refinement story
// every hall tells: aqua raw at collect, steel-white processed, gold
// exported. All motion is computed in the vertex shaders from a uniform
// clock — zero per-frame CPU cost (the gpuUnit.js discipline). The
// lighting rig itself lives in observatoryRoom.js (the inventory's
// call): in this room the only bright light is the instruments.

import * as THREE from 'three';
import { STATION06, PALETTE } from '../../config/world.js';

const S06 = STATION06;
const PIPE = S06.pipeline;
const RCV = PIPE.stages[0], PRC = PIPE.stages[1], EXP = PIPE.stages[2];

// ------------------------------------------------------- shared LEDs ----
// One shader, one clock — every status light in the station (cabinet
// ports, console telltales, gauge lamps) is a point in a field built by
// createLEDField. Same shader as Station 03's gpuUnit field: per-point
// colour + blink phase, size attenuated.
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

// ---------------------------------------------------------- flow paths --
// Fixed routes between named plant, walked at telemetry pace. The
// packets fly these direct routes; the physical conduits in
// otelPipeline.js take the squared ceiling-perimeter run instead —
// no conduit geometry crosses the room's air or the map face.
const PATHS = [
  { // entry conduit → RECEIVE (collect: aqua, raw)
    color: PALETTE.fibreAqua, count: 110, speed: 0.8,
    pts: [
      [-5.92, 2.3, S06.entry.conduitZ],
      [-5.9, 2.4, 1.2],
      [-5.72, 2.5, 2.82],
      [-4.5, PIPE.conduitY, 3.06],
      [RCV.x, 2.46, 3.08],
      [RCV.x, 2.0, 3.04],
    ],
  },
  { // RECEIVE → PROCESS (steel-white: being processed)
    color: PALETTE.steel, count: 80, speed: 0.6,
    pts: [
      [RCV.x, 2.0, 3.04],
      [RCV.x, 2.46, 3.08],
      [-2.1, PIPE.conduitY, 3.08],
      [PRC.x, 2.46, 3.08],
      [PRC.x, 2.0, 3.04],
    ],
  },
  { // PROCESS → EXPORT (steel-white)
    color: PALETTE.steel, count: 80, speed: 0.6,
    pts: [
      [PRC.x, 2.0, 3.04],
      [PRC.x, 2.46, 3.08],
      [0.9, PIPE.conduitY, 3.08],
      [EXP.x, 2.46, 3.08],
      [EXP.x, 2.0, 3.04],
    ],
  },
  { // EXPORT → the console arc (gold: finished telemetry)
    color: PALETTE.dgxGold, count: 120, speed: 0.7,
    pts: [
      [EXP.x, 2.0, 3.04],
      [EXP.x, 2.5, 2.9],
      [1.4, 2.62, 2.2],
      [0.3, 2.3, 1.5],
      [0.05, 1.45, 0.92],
    ],
  },
  { // EXPORT → the traces waterfall cabinet (gold)
    color: PALETTE.dgxGold, count: 100, speed: 0.7,
    pts: [
      [EXP.x, 2.0, 3.04],
      [2.55, 2.55, 2.2],
      [1.6, 2.75, 0.2],
      [0.2, 2.7, -1.8],
      [-1.2, 2.45, -3.0],
      [S06.waterfall.x, 2.26, -3.26],
    ],
  },
  { // EXPORT → the map wall (gold: the edge, reporting in)
    color: PALETTE.dgxGold, count: 150, speed: 0.8,
    pts: [
      [EXP.x, 2.0, 3.04],
      [2.7, 2.5, 2.4],
      [3.8, 2.5, 1.2],
      [4.7, 2.15, 0.4],
      [5.1, 1.8, 0.05],
    ],
  },
  { // distribution run behind the console arc (gold)
    color: PALETTE.dgxGold, count: 70, speed: 0.5,
    pts: [
      [-2.18, 1.32, 1.02],
      [-1.2, 1.4, 0.86],
      [-0.3, 1.4, 0.83],
      [0.6, 1.36, 0.96],
      [1.08, 1.3, 1.06],
    ],
  },
];

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
  const rnd = (() => { let s = 4321; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  const c = new THREE.Color();
  let k = 0;
  PATHS.forEach((p, r) => {
    c.setHex(p.color);
    for (let i = 0; i < p.count; i++, k++) {
      aPath.set([r, rnd(), p.speed / lengths[r], 0], k * 4);
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
        float u = fract(aPath.y + uTime * aPath.z);
        vAlpha = 0.85;
        int idx = int(clamp(u, 0.0, 1.0) * ${(PATH_SAMPLES - 1).toFixed(1)} + 0.5);
        vec3 p = texelFetch(uPaths, ivec2(idx, int(aPath.x + 0.5)), 0).xyz;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 0.026 * uProj / max(0.1, -mv.z);
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
  group.name = 's06-flow';
  group.add(buildFlowPoints());
  return group;
}

// --------------------------------------------------------------- tick ---
// One clock for every shader in the station (LED fields + flow). The
// entry point passes accumulated active time, so hidden tabs pause.
export function tickFlow(t) {
  ledUniforms.uTime.value = t;
  flowUniforms.uTime.value = t;
}
