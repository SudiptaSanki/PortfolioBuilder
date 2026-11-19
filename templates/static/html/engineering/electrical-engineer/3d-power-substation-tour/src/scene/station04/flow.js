// flow.js — light and life for the Turbine Hall. Lighting (fix
// loop 1): a bright, even, daylit rig per the inventory's
// "cathedral-of-engineering" spec — a strong hemisphere + ambient
// base so no surface falls to black, a key directional angled
// through the south clerestory band, a cooler north fill, and warm
// deck / cool basement point accents (the basement stays a stop
// darker and cooler, by design). No shadow maps — the hall reads
// by scale and rhythm, and SwiftShader stays fast.
//
// The ONE particle system (SCAFFOLD rule 4): lube-oil flow — points
// that leave the main oil tank, rise the deck's south edge, run the
// header the length of the train and drop into the bearings,
// returning conceptually through the drain. Physically routed along
// the pipes turbine.js and oilSkid.js actually draw; points only,
// vertex-shader path param over a DataTexture, plain ShaderMaterial
// (no GLSL3 flag — SCAFFOLD rule 3).

import * as THREE from 'three';
import { STATION04 } from '../../config/world.js';

const S04 = STATION04;
const DY = S04.deck.topY;

export function createHallLighting() {
  const g = new THREE.Group();
  g.name = 's04-lighting';
  // base daylight: hemisphere (sky through clerestory + roof lights,
  // warm floor bounce) plus a low ambient so shaded faces never
  // fall to black — the old rig's 1.05 hemi alone left the roof
  // and far walls reading as a bunker.
  const hemi = new THREE.HemisphereLight(0xf4f8fb, 0x9aa092, 1.55);
  g.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.32);
  g.add(amb);
  // key daylight: high from the south-west, angled down through
  // the south clerestory band (z −18, y 18–27) toward the machine
  const sun = new THREE.DirectionalLight(0xfff1da, 2.6);
  sun.position.set(-28, 52, -40);
  g.add(sun);
  // cooler fill through the north clerestory, lifting the BC side
  const fill = new THREE.DirectionalLight(0xdfeaf4, 0.9);
  fill.position.set(30, 34, 42);
  g.add(fill);
  const basementGlow = new THREE.PointLight(0xbfd0dd, 0.85, 34, 1.3);  // cooler, dimmer below
  basementGlow.position.set(2, 7, 0);
  g.add(basementGlow);
  const basementGlowW = new THREE.PointLight(0xcfe0ee, 0.5, 26, 1.3);  // CW-pipe end of the basement
  basementGlowW.position.set(-12, 5.5, -4);
  g.add(basementGlowW);
  const deckGlow = new THREE.PointLight(0xfff1d8, 0.9, 70, 1.2);
  deckGlow.position.set(-4, 22, 0);
  g.add(deckGlow);
  return g;
}

// ---- oil flow path -------------------------------------------------
// MOT top → along the bund → riser up the deck edge → header east →
// drops at the last bearings → back west along the drain line.
function oilPath() {
  const pts = [];
  const mx = S04.mot.x, mz = S04.mot.z;
  pts.push(new THREE.Vector3(mx, 3.4, mz + 1.2));
  pts.push(new THREE.Vector3(mx, 3.4, -7.4));
  pts.push(new THREE.Vector3(mx, DY + 0.62, -7.4));
  pts.push(new THREE.Vector3(mx, DY + 0.62, -3.6));
  for (const bx of S04.bearingsX) pts.push(new THREE.Vector3(bx, DY + 0.62, -3.6));
  pts.push(new THREE.Vector3(28.6, DY + 0.62, -3.6));
  pts.push(new THREE.Vector3(28.6, DY + 0.38, -3.85));
  for (let i = S04.bearingsX.length - 1; i >= 0; i--) pts.push(new THREE.Vector3(S04.bearingsX[i], DY + 0.38, -3.85));
  pts.push(new THREE.Vector3(-27.8, DY + 0.38, -3.85));
  return pts;
}

const FLOW_COUNT = 420;
let flowMat = null;

export function createFlow() {
  const path = oilPath();
  // resample the polyline to an even arc-length table in a DataTexture
  const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');  // no overshoot at the pipe corners
  const N = 256;
  const data = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const p = curve.getPoint(i / (N - 1));
    data[i * 4] = p.x; data[i * 4 + 1] = p.y; data[i * 4 + 2] = p.z; data[i * 4 + 3] = 1;
  }
  const tex = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;

  const geo = new THREE.BufferGeometry();
  const seeds = new Float32Array(FLOW_COUNT);
  for (let i = 0; i < FLOW_COUNT; i++) seeds[i] = i / FLOW_COUNT;
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FLOW_COUNT * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  flowMat = new THREE.ShaderMaterial({
    uniforms: {
      uPath: { value: tex },
      uTime: { value: 0 },
      uPx: { value: 900 },
    },
    vertexShader: /* glsl */`
      attribute float aSeed;
      uniform sampler2D uPath;
      uniform float uTime;
      uniform float uPx;
      varying float vFade;
      void main() {
        float u = fract(aSeed + uTime * 0.008);
        vec3 p = texture2D(uPath, vec2(u, 0.5)).xyz;
        vFade = smoothstep(0.0, 0.04, u) * (1.0 - smoothstep(0.96, 1.0, u));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(uPx * 0.011 / -mv.z, 1.5, 5.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying float vFade;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        if (dot(d, d) > 0.25) discard;
        gl_FragColor = vec4(1.0, 0.72, 0.3, 0.85 * vFade);
      }`,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, flowMat);
  points.frustumCulled = false;
  points.name = 's04-oil-flow';
  return points;
}

export function tickFlow(t) {
  if (flowMat) flowMat.uniforms.uTime.value = t;
}

export function setFlowProjFactor(f) {
  if (flowMat) flowMat.uniforms.uPx.value = f;
}
