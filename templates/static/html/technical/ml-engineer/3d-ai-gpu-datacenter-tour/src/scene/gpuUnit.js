// gpuUnit.js — the servers that fill the racks.
// GB200-style layout per rack: power shelves (6 PSU modules each), 1U compute
// trays with silver trim + front I/O, 1U NVLink switch trays with dense port
// grids, top-of-rack switches, blanking panels filling every remaining U.
// Hero racks carry gold DGX-style 8U chassis instead.
// Bodies and faces are InstancedMesh; the status-LED field is one shader
// Points cloud per rack (per-point colour + blink phase — research rule 3).

import * as THREE from 'three';
import {
  U, RACK, PALETTE, SURFACE, uCentreY, seeded,
} from '../config/world.js';

const FACE_W = RACK.interiorWidth;       // 0.44
const TRAY_FRONT_Z = -RACK.depth / 2 + 0.045;   // tray faces, behind the door
const LED_Z = TRAY_FRONT_Z - 0.006;             // LEDs just behind the mesh

// ------------------------------------------------------------ textures --
function makeTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function computeFaceTex() {
  return makeTex(512, 52, (g, w, h) => {
    g.fillStyle = '#1d2024'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8ccd1'; g.fillRect(0, 3, w, 3);            // silver trim
    g.fillStyle = '#26292e'; g.fillRect(0, h - 9, w, 5);       // vent shadow
    g.fillStyle = '#101214';
    for (let x = 14; x < 300; x += 12) g.fillRect(x, h - 8, 7, 3); // vent slats
    g.fillStyle = '#2c2f34'; g.fillRect(14, 14, 120, 20);      // logo plate
    g.fillStyle = '#9fe870'; g.fillRect(20, 21, 34, 6);        // brand bar
    g.fillStyle = '#0c0d0f';                                   // front I/O cluster
    g.fillRect(w - 128, 13, 112, 26);
    g.fillStyle = '#3d434a';
    for (let i = 0; i < 4; i++) g.fillRect(w - 120 + i * 26, 18, 18, 16);
    g.fillStyle = '#6b7178';
    g.fillRect(w - 120, 40, 10, 5); g.fillRect(w - 104, 40, 10, 5);
    g.fillStyle = '#565b62';                                   // rack-ear screws
    g.beginPath(); g.arc(7, h / 2, 3, 0, 7); g.arc(w - 7, h / 2, 3, 0, 7); g.fill();
  });
}

function switchFaceTex() {
  return makeTex(512, 52, (g, w, h) => {
    g.fillStyle = '#23211b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8f7a3a'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    for (let rowI = 0; rowI < 2; rowI++) {                     // QSFP cage grid
      for (let i = 0; i < 18; i++) {
        const x = 14 + i * 27, y = 8 + rowI * 20;
        g.fillStyle = '#0a0a0a'; g.fillRect(x, y, 21, 14);
        g.fillStyle = '#4a4d42'; g.fillRect(x + 3, y + 3, 15, 8);
      }
    }
    g.fillStyle = '#565b62';
    g.beginPath(); g.arc(7, h / 2, 3, 0, 7); g.arc(w - 7, h / 2, 3, 0, 7); g.fill();
  });
}

function psuShelfFaceTex() {
  return makeTex(512, 104, (g, w, h) => {
    g.fillStyle = '#191b1e'; g.fillRect(0, 0, w, h);
    const mw = w / 6;
    for (let m = 0; m < 6; m++) {
      const x = m * mw;
      g.fillStyle = '#22252a'; g.fillRect(x + 3, 6, mw - 6, h - 12);
      g.strokeStyle = '#3a3e44'; g.strokeRect(x + 3, 6, mw - 6, h - 12);
      const cx = x + mw * 0.36, cy = h / 2, r = 26;           // fan grille
      g.fillStyle = '#0b0c0d';
      g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
      g.strokeStyle = '#585d64'; g.lineWidth = 2.5;
      for (let s = 0; s < 8; s++) {
        const a = s / 8 * Math.PI * 2;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
        g.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
        g.stroke();
      }
      g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
      g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fillStyle = '#585d64'; g.fill();
      g.fillStyle = '#33373d';                               // connector block
      g.fillRect(x + mw * 0.68, h * 0.3, mw * 0.24, h * 0.4);
    }
  });
}

function blankFaceTex() {
  return makeTex(256, 52, (g, w, h) => {
    g.fillStyle = '#121316'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.045)'; g.fillRect(0, 0, w, 5);
    g.fillStyle = '#26282c';
    g.beginPath(); g.arc(8, h / 2, 3, 0, 7); g.arc(w - 8, h / 2, 3, 0, 7); g.fill();
  });
}

function dgxFaceTex() {
  return makeTex(512, 416, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#d8b45e');
    grad.addColorStop(0.5, '#c9a24d');
    grad.addColorStop(1, '#b08a35');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,86,20,0.25)';                    // brushed texture
    const rnd = seeded(5);
    for (let i = 0; i < 500; i++) g.fillRect(rnd() * w, 0, 1, h);
    g.fillStyle = '#f5efdd';                                 // vertical lettering
    g.save();
    g.translate(58, h - 30);
    g.rotate(-Math.PI / 2);
    g.font = '700 64px Arial, sans-serif';
    g.fillText('NVIDIA DGX', 0, 22);
    g.restore();
    g.fillStyle = 'rgba(30,22,4,0.55)';                      // vent slots at base
    for (let x = 120; x < w - 30; x += 18) g.fillRect(x, h - 62, 10, 40);
    g.fillStyle = '#2e2408';
    g.fillRect(w - 66, 26, 40, 12);                          // ID plate
  });
}

// ------------------------------------------------------------- layout ---
// Segment lists per rack style. Each: [type, uSpan]. Sums to exactly 42U.
const STANDARD_LAYOUT = [
  ['psu', 2], ['compute', 18], ['blank', 2], ['switch', 9],
  ['switch', 2], ['blank', 3], ['psu', 2], ['blank', 4],
];
const HERO_LAYOUT = [
  ['dgx', 8], ['dgx', 8], ['compute', 8], ['switch', 6],
  ['blank', 4], ['psu', 2], ['blank', 6],
];

// --------------------------------------------------------- LED shader ---
const ledUniforms = { uTime: { value: 0 }, uProj: { value: 900 } };
function ledMaterial() {
  return new THREE.ShaderMaterial({
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
}
const _ledMat = ledMaterial();

// -------------------------------------------------------------- build ---
class Collector {
  constructor() {
    this.bodies = [];        // {x,y,z,h} unit-height boxes scaled per tray
    this.faces = { compute: [], switch: [], psu: [], blank: [] };
    this.leds = [];          // {x,y,z,color,phase,blink}
  }
}

function addTray(col, type, uIndex, uSpan, rnd) {
  const y = uCentreY(uIndex, uSpan);
  const h = uSpan * U - 0.004;
  if (type !== 'blank') col.bodies.push({ y, h });
  col.faces[type].push({ y, h });
  // status LEDs per type (front I/O cluster positions on the 0.44 m face)
  const led = (dx, color, blink = 0) =>
    col.leds.push({ x: dx, y: y + 0.006, z: LED_Z, color, phase: rnd(), blink });
  if (type === 'compute') {
    led(0.168, PALETTE.ledGreen);
    led(0.194, PALETTE.ledBlue, rnd() < 0.14 ? 1 : 0);
    if (rnd() < 0.05) led(0.142, PALETTE.ledAmber, 0.7);
  } else if (type === 'switch') {
    led(-0.192, PALETTE.ledBlue, rnd() < 0.2 ? 1 : 0);
    led(0.192, PALETTE.ledGreen);
  } else if (type === 'psu') {
    for (let m = 0; m < 6; m++) led(-0.183 + m * 0.0733, PALETTE.ledGreen, rnd() < 0.06 ? 1 : 0);
  } else if (type === 'dgx') {
    led(0.185, PALETTE.ledGreen);
    led(0.185, PALETTE.ledBlue, 0);
    col.leds[col.leds.length - 1].y = y - 0.05;
    col.leds[col.leds.length - 2].y = y - 0.02;
  }
}

function buildInstanced(col, faceTex) {
  const grp = new THREE.Group();

  if (col.bodies.length) {
    const geo = new THREE.BoxGeometry(FACE_W, 1, RACK.trayDepth);
    // interior kept dark (local multiplier — world.js contract untouched)
    // so the LED field pops through the mesh doors
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(PALETTE.trayBody).multiplyScalar(0.6), ...SURFACE.paintedMetal,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, col.bodies.length);
    const d = new THREE.Object3D();
    col.bodies.forEach((b, i) => {
      d.position.set(0, b.y, TRAY_FRONT_Z + RACK.trayDepth / 2);
      d.scale.set(1, b.h, 1);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    grp.add(mesh);
  }

  const faceMats = {
    compute: new THREE.MeshStandardMaterial({ map: faceTex.compute, roughness: 0.5, metalness: 0.4 }),
    switch: new THREE.MeshStandardMaterial({ map: faceTex.switch, roughness: 0.45, metalness: 0.5 }),
    psu: new THREE.MeshStandardMaterial({ map: faceTex.psu, roughness: 0.55, metalness: 0.35 }),
    blank: new THREE.MeshStandardMaterial({ map: faceTex.blank, roughness: 0.7, metalness: 0.2 }),
  };
  for (const m of Object.values(faceMats)) m.color.set(0xdbdbdb); // dim faces vs LEDs
  const faceGeo = new THREE.PlaneGeometry(FACE_W, 1);
  for (const [type, list] of Object.entries(col.faces)) {
    if (!list.length) continue;
    const mesh = new THREE.InstancedMesh(faceGeo, faceMats[type], list.length);
    const d = new THREE.Object3D();
    list.forEach((f, i) => {
      d.position.set(0, f.y, TRAY_FRONT_Z - 0.002); // 2 mm proud of the tray body
      d.rotation.set(0, Math.PI, 0);               // plane faces local -Z
      d.scale.set(1, f.h, 1);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    grp.add(mesh);
  }

  if (col.leds.length) {
    const n = col.leds.length;
    const pos = new Float32Array(n * 3);
    const colArr = new Float32Array(n * 3);
    const blink = new Float32Array(n * 2);
    const c = new THREE.Color();
    col.leds.forEach((l, i) => {
      pos.set([l.x, l.y, l.z], i * 3);
      c.setHex(l.color);
      colArr.set([c.r, c.g, c.b], i * 3);
      blink.set([l.phase, l.blink], i * 2);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colArr, 3));
    geo.setAttribute('aBlink', new THREE.BufferAttribute(blink, 2));
    const points = new THREE.Points(geo, _ledMat);
    points.frustumCulled = false;
    grp.add(points);
  }
  return grp;
}

const _faceTex = {
  compute: computeFaceTex(), switch: switchFaceTex(),
  psu: psuShelfFaceTex(), blank: blankFaceTex(),
};
const _dgxTex = dgxFaceTex();
const _dgxBodyMat = new THREE.MeshStandardMaterial({
  color: PALETTE.dgxGold, ...SURFACE.gold,
});
const _dgxFaceMat = new THREE.MeshStandardMaterial({
  map: _dgxTex, roughness: 0.38, metalness: 0.65,
});

// Populate one rack group (local space) according to its anchor style.
export function populateRack(rackGroup, anchor) {
  const rnd = seeded(anchor.row.charCodeAt(0) * 100 + anchor.index * 17 + 3);
  const layout = anchor.hero ? HERO_LAYOUT : STANDARD_LAYOUT;
  const col = new Collector();
  let u = 0;
  for (const [type, span] of layout) {
    if (type === 'dgx') {
      // hero chassis: real gold body + lettered face, not instanced
      const h = span * U - 0.006;
      const y = uCentreY(u, span);
      const body = new THREE.Mesh(new THREE.BoxGeometry(FACE_W, h, 0.7), _dgxBodyMat);
      body.position.set(0, y, TRAY_FRONT_Z + 0.35);
      rackGroup.add(body);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(FACE_W, h), _dgxFaceMat);
      face.position.set(0, y, TRAY_FRONT_Z - 0.001);
      face.rotation.y = Math.PI;
      rackGroup.add(face);
      col.leds.push(
        { x: 0.185, y: y - 0.03, z: LED_Z, color: PALETTE.ledGreen, phase: rnd(), blink: 0 },
        { x: 0.185, y: y + 0.005, z: LED_Z, color: PALETTE.ledBlue, phase: rnd(), blink: 0 },
      );
    } else {
      addTray(col, type, u, span, rnd);
    }
    u += span;
  }
  rackGroup.add(buildInstanced(col, _faceTex));
}

// Per-frame: advance the shared LED shader clock.
export function tickLEDs(t) {
  ledUniforms.uTime.value = t;
}

// Screenshot harness support: point size scale for the current viewport.
export function setLEDProjFactor(f) {
  ledUniforms.uProj.value = f;
}
