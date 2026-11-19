// flow.js — Station 06's one particle system (SCAFFOLD rule 4):
// energy moving along Feeder F-7. Points ride the three phase
// conductors of the three true 40 m spans, west → east (tonight the
// ring is fed from the west), sagging with the same catenary maths
// as the tubes they follow, and a few dive down the transition pole
// into the buried ring. All motion is computed in the vertex shader
// from a uniform clock — zero per-frame CPU cost. The shimmer is
// deliberately faint: this is a working street, not a light show.

import * as THREE from 'three';
import { feederFlowPaths } from './feederLine.js';

export const flowUniforms = { uTime: { value: 0 }, uProj: { value: 900 } };

const flowMat = new THREE.ShaderMaterial({
  uniforms: flowUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute vec3 aA;
    attribute vec3 aB;
    attribute float aSag;
    attribute vec2 aSeed;             // x: phase 0..1, y: speed factor
    attribute vec3 aColor;
    uniform float uTime;
    uniform float uProj;
    varying vec3 vColor;
    varying float vFade;
    void main() {
      float t = fract(aSeed.x + uTime * 0.045 * aSeed.y);
      vec3 p = mix(aA, aB, t);
      p.y -= aSag * 4.0 * t * (1.0 - t);
      vColor = aColor;
      vFade = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.94, t);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = 0.055 * uProj / max(0.1, -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    varying vec3 vColor;
    varying float vFade;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      float fall = smoothstep(0.5, 0.08, length(d));
      gl_FragColor = vec4(vColor * 1.6, fall * vFade * 0.5);
    }`,
});

export function createFlow() {
  const paths = feederFlowPaths();
  const perSpan = 62, perDive = 26;
  const total = (paths.length - 1) * perSpan + perDive;
  const A = new Float32Array(total * 3);
  const B = new Float32Array(total * 3);
  const sag = new Float32Array(total);
  const seed = new Float32Array(total * 2);
  const col = new Float32Array(total * 3);
  const warm = new THREE.Color(0xffd9a0);
  const white = new THREE.Color(0xfff3dd);
  const c = new THREE.Color();
  let i = 0;
  paths.forEach((path, pi) => {
    const n = pi === paths.length - 1 ? perDive : perSpan;
    for (let k = 0; k < n; k++, i++) {
      A.set([path.a.x, path.a.y, path.a.z], i * 3);
      B.set([path.b.x, path.b.y, path.b.z], i * 3);
      sag[i] = path.sag;
      seed.set([k / n + pi * 0.137, 0.85 + ((k * 7 + pi * 3) % 10) * 0.03], i * 2);
      c.copy(warm).lerp(white, ((k * 13 + pi) % 10) / 14);
      col.set([c.r, c.g, c.b], i * 3);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(A.slice(), 3)); // required by three
  geo.setAttribute('aA', new THREE.BufferAttribute(A, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(B, 3));
  geo.setAttribute('aSag', new THREE.BufferAttribute(sag, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(geo, flowMat);
  points.frustumCulled = false;
  points.name = 's06-feeder-flow';
  return points;
}

export function tickFlow(t) {
  flowUniforms.uTime.value = t;
}
