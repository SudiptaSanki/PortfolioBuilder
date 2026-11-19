// flow.js — the station's ONE particle system (SCAFFOLD rule 4):
// golden dust drifting east-south-east on the evening breeze, low
// over the array field — points only, physically routed by the same
// wind that turns the rotors. Plus three distant birds crossing the
// sun in the overview (inventory §4.9: they sell the hour better
// than any prop). Nothing else moves except the rotors.

import * as THREE from 'three';
import { rng } from './kit.js';

const DUST_N = 700;
let dustGeo, dustBase, dustPhase;
let birds = [];
let lastT = 0;

function buildDust() {
  const rand = rng(2024);
  dustBase = new Float32Array(DUST_N * 3);
  dustPhase = new Float32Array(DUST_N);
  const pos = new Float32Array(DUST_N * 3);
  for (let i = 0; i < DUST_N; i++) {
    dustBase[i * 3] = -110 + rand() * 250;      // x: across the field
    dustBase[i * 3 + 1] = 0.3 + rand() * 6.5;   // y: low over the tables
    dustBase[i * 3 + 2] = -65 + rand() * 150;   // z
    dustPhase[i] = rand() * Math.PI * 2;
    pos.set(dustBase.subarray(i * 3, i * 3 + 3), i * 3);
  }
  dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // Soft round motes, NOT square points: a plain ShaderMaterial
  // (no GLSL3 flag — SCAFFOLD rule 3) whose fragment stage falls
  // off radially and discards outside the sprite disc. Small
  // (0.10 m) and faint — dust you sense in the light, never
  // Post-it notes pasted on the sky.
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(0xf2d9a4) },
      uSize: { value: 0.10 },
      uOpacity: { value: 0.30 },
      uHeight: { value: window.innerHeight * Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */`
      uniform float uSize;
      uniform float uHeight;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * uHeight * projectionMatrix[1][1] * 0.5 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
        if (d > 1.0) discard;
        float a = smoothstep(1.0, 0.1, d) * uOpacity;
        gl_FragColor = vec4(uColor, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  window.addEventListener('resize', () => {
    mat.uniforms.uHeight.value = window.innerHeight * Math.min(window.devicePixelRatio, 2);
  });
  const points = new THREE.Points(dustGeo, mat);
  points.frustumCulled = false;
  return points;
}

function buildBirds() {
  const mat = new THREE.MeshBasicMaterial({ color: 0x2a2c2e, side: THREE.DoubleSide });
  const out = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.1, 5), mat);
    body.rotation.x = Math.PI / 2;
    b.add(body);
    const wingGeo = new THREE.PlaneGeometry(1.15, 0.34);
    wingGeo.translate(0.58, 0, 0);
    const wl = new THREE.Mesh(wingGeo, mat);
    const wr = new THREE.Mesh(wingGeo, mat);
    wr.rotation.z = Math.PI;
    b.add(wl, wr);
    b.userData = { wl, wr, off: i * 27, dz: i * 9 - 8, dy: i * 5 };
    out.push(b);
  }
  return out;
}

export function createFlow() {
  const group = new THREE.Group();
  group.name = 's05-flow';
  group.add(buildDust());
  birds = buildBirds();
  for (const b of birds) group.add(b);
  return group;
}

export function tickFlow(t) {
  const dt = Math.min(t - lastT, 0.1);
  lastT = t;
  // dust drifts ESE on the breeze, wrapping around the field
  const pos = dustGeo.attributes.position;
  for (let i = 0; i < DUST_N; i++) {
    let x = pos.getX(i) + dt * 1.35;
    if (x > 145) x = -115;
    pos.setX(i, x);
    pos.setY(i, dustBase[i * 3 + 1] + Math.sin(t * 0.45 + dustPhase[i]) * 0.45);
  }
  pos.needsUpdate = true;
  // birds cross WNW → ESE, high and distant, on a slow loop
  for (const b of birds) {
    const u = ((t + b.userData.off) % 120) / 120;
    b.position.set(-360 + u * 760, 128 + b.userData.dy - u * 14, -70 + b.userData.dz + u * 105);
    b.rotation.y = Math.atan2(760, 105);
    const flap = Math.sin(t * 5.2 + b.userData.off) * 0.55;
    b.userData.wl.rotation.z = flap;
    b.userData.wr.rotation.z = Math.PI - flap;
  }
}
