// flow.js — Station 02's life & light (the Station 01 flow.js role):
// the hall's bright clinical rig, a whisper of dust, the shared
// status-LED shader field, and THE one particle system — the Forward
// Pass. One bright wave travels the residual spine west → east, rises
// through each bay's attention gallery, dips through its FFN press,
// and arrives at the LM head, where it turns gold. One pass at a time,
// on a slow loop with a rest between passes — a forward pass happens
// once per input, and the hall shows one. All motion is computed in
// the vertex shader from a uniform clock: zero per-frame CPU cost.

import * as THREE from 'three';
import { STATION02, PALETTE, seeded } from '../../config/world.js';

const S02 = STATION02;
const FLOW = S02.flow;

// The pass cycle, shared with blocks.js (attention-link brightening):
// head position u ∈ [0,1] along the baked path, or −1 while resting.
export function passHeadU(t) {
  const ph = t % FLOW.period;
  return ph < FLOW.travel ? ph / FLOW.travel : -1;
}

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

// ------------------------------------------------------------ lighting --
// Station 03's rig values, unchanged: even 5000 K strips, a high
// ambient base, gentle fills — the only coloured light in the room is
// the pass itself (pulse, links, LEDs).
export function createHallLighting() {
  const group = new THREE.Group();
  group.name = 's02-lighting';
  const H = S02.room.height;

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
  for (const [x, z] of [[-3.6, 0], [0, 0], [3.6, 0], [4.8, 2.2]]) {
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
  group.name = 's02-dust';
  const rnd = seeded(311);
  const pos = new Float32Array(DUST_COUNT * 3);
  _dustBase = new Float32Array(DUST_COUNT * 3);
  _dustSeed = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    const x = -4.6 + rnd() * 9.8;                    // above the lattice
    const y = 1.2 + rnd() * 1.9;
    const z = (rnd() - 0.5) * 5.2;
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

// ------------------------------------------------------- forward pass ---
// The one route: token rail → spine → (gate, gallery rise, press dip,
// collar) × 6 → final gate → scoreboard → out the east wall. Baked
// into a float texture; the vertex shader walks each point along it
// behind the wave head. Warm white, amber leading edge, gold only
// past uGold (the LM head's refined output).
function passWaypoints() {
  const pts = [[-5.35, 1.02, -0.35], [-4.8, 0.96, 0]];
  for (const cx of S02.blocks.centresX) {
    pts.push(
      [cx + S02.blocks.gate1X, 0.96, 0],   // calibration gate
      [cx - 0.16, 1.9, 0],                 // rise through the gallery
      [cx + 0.1, 1.15, 0],                 // descend
      [cx + S02.blocks.pressX - 0.25, 0.96, 0], // through the press
      [cx + S02.blocks.collar2X, 0.96, 0], // merge collar, back on the spine
    );
  }
  pts.push(
    [S02.lmHead.gateX, 0.96, 0],           // FINAL LN collar
    [5.92, 1.5, 0],                        // rise to the scoreboard
    [5.92, S02.lmHead.boardY, 0],          // scored
    [6.04, 2.05, 0],                       // out the east wall → Station 03
  );
  return pts;
}

const PATH_SAMPLES = 512;
const flowUniforms = {
  uTime: { value: 0 },
  uProj: { value: 900 },
  uPaths: { value: null },
  uGoldU: { value: 0.97 },
  uPeriod: { value: FLOW.period },
  uTravel: { value: FLOW.travel },
};

function buildPassPoints() {
  const curve = new THREE.CatmullRomCurve3(passWaypoints().map((q) => new THREE.Vector3(...q)));
  const data = new Float32Array(PATH_SAMPLES * 4);
  const v = new THREE.Vector3();
  let goldIdx = PATH_SAMPLES - 1;
  for (let s = 0; s < PATH_SAMPLES; s++) {
    curve.getPoint(s / (PATH_SAMPLES - 1), v);
    data.set([v.x, v.y, v.z, 1], s * 4);
    if (goldIdx === PATH_SAMPLES - 1 && v.x > S02.lmHead.x - 0.02) goldIdx = s;
  }
  flowUniforms.uGoldU.value = goldIdx / (PATH_SAMPLES - 1);
  const tex = new THREE.DataTexture(data, PATH_SAMPLES, 1, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  flowUniforms.uPaths.value = tex;

  const total = FLOW.points;
  const pos = new Float32Array(total * 3);           // dummy, real pos in shader
  const aSeed = new Float32Array(total);             // trail offset 0..1
  const rnd = seeded(2718);
  for (let i = 0; i < total; i++) aSeed[i] = Math.pow(rnd(), 1.4); // denser at the head
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));

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
      attribute float aSeed;          // trail offset behind the wave head
      uniform float uTime;
      uniform float uProj;
      uniform float uPeriod;
      uniform float uTravel;
      uniform float uGoldU;
      uniform sampler2D uPaths;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float ph = mod(uTime, uPeriod);
        float head = ph < uTravel ? ph / uTravel : -1.0;
        float u = head - aSeed * 0.085;            // the wave's tail
        float a = 0.0;
        vec3 col = vec3(1.0, 0.965, 0.9);          // warm white body
        if (head >= 0.0 && u > 0.0 && u <= 1.0) {
          float tail = 1.0 - aSeed;                // brighter near the head
          a = 0.25 + 0.75 * tail;
          float lead = smoothstep(0.03, 0.0, head - u);
          col = mix(col, vec3(1.0, 0.69, 0.18), lead * 0.85);   // amber edge
          if (u > uGoldU) col = vec3(0.85, 0.66, 0.28);        // gold output
        }
        vColor = col;
        vAlpha = a;
        int idx = int(clamp(u, 0.0, 1.0) * ${(PATH_SAMPLES - 1).toFixed(1)} + 0.5);
        vec3 p = texelFetch(uPaths, ivec2(idx, 0), 0).xyz;
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
  group.name = 's02-flow';
  group.add(buildPassPoints());
  return group;
}

// --------------------------------------------------------------- tick ---
// One clock for every shader in the station (LED fields + the pass).
// The entry point passes accumulated active time, so hidden tabs pause.
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
