/**
 * hardwareRig.js
 * ============================================================================
 * Procedural open-world "hardware lab" for the Computer Engineering portfolio:
 * a complete ATX workstation rig — motherboard, CPU + silicon die, twin-tower
 * air cooler, flagship GPU, chassis frame, PSU shroud — plus a custom liquid
 * cooling loop (water blocks, reservoir, 360 mm radiator, flowing tubes) and a
 * Tensor-Core / AI compute matrix that lights up with AI load.
 *
 * Everything is generated from Three.js primitives, extruded shapes, parametric
 * surfaces and hand-written GLSL. There are no textures, no GLB models, no
 * network requests, and no canvas/DOM calls, so the module builds identically
 * in the browser and in Node.
 *
 * ----------------------------------------------------------------------------
 * WORLD CONTRACT  (read this before placing cameras or labels)
 * ----------------------------------------------------------------------------
 * Units      1 world unit = 1 cm. The assembled mid-tower is ~54 × 60 × 36 u.
 * Axes       +X = right, +Y = up, +Z = toward the default camera.
 * Origin     the centre of the motherboard. The rig stands on the studio floor
 *            at y = FLOOR_Y (-30.5); the board plane is z ≈ 0 with every
 *            component mounted on its +Z face, so a camera sitting around
 *            (26, 14, 72) looking at (0, 0, 0) sees the classic build shot.
 *
 * LAYOUT (all numbers are local to `group`, i.e. the anchors are exact)
 *   Motherboard 34 × 26 × 0.22, centred (0, 0, 0); front face z = +0.11.
 *   CPU socket   centre (-5.6, 5.4); socket top z = 0.95, substrate to z = 1.05,
 *                IHS 3.9 × 3.9 up to z = 1.46 when seated.
 *   Air cooler   coldplate base z = 1.50, twin fin towers (x ≈ -9.0 / -2.2),
 *                2 × 120 mm fans at z ≈ 8.9 facing +Z.
 *   RAM          4 DIMMs at x = 3.6 / 5.2 / 6.8 / 8.4, y = -1.4 … 10.4,
 *                spreaders reaching z = 3.3.
 *   PCIe x16     slot line y = -5.6, x ≈ -9.5 … 7.5.
 *   GPU          body x -16 … 8, y -13.6 … -5.8, z 1.0 … 7.0, 3 × 92 mm fans
 *                on the +Z face at z ≈ 7.1 (showcase / riser orientation, so
 *                the fan side is presented to the camera). The brushed
 *                backplate and its glowing status bar live on the top edge.
 *   Chassis      rails at x = ±27, y = ±30, back wall z = -13, glass accents.
 *   PSU shroud   y -29 … -21, z -11 … 18.
 *   Radiator     360 mm, top-mounted: core x -20 … 20, y 23.7 … 26.3, z -5.7 … 5.7;
 *                3 × 120 mm pull fans above it at y ≈ 26.4 … 28.6 facing +Y.
 *   Reservoir    vertical acrylic cylinder r 2.6, h 14, centred (20, 8, 7).
 *   Block shelf  glass display shelf at y ≈ -19.7, x 4 … 26, holding the CPU
 *                and full-cover GPU water blocks (pump lives in the reservoir
 *                base, so the loop is a clean four-hose run).
 *   Tensor matrix GPU lattice hovers above the GPU backplate (y ≈ -3.4),
 *                CPU lattice sits inside the die (visible once the IHS lifts).
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   import {
 *     createHardwareRig, COMPONENT_ANCHORS, FLOOR_Y,
 *   } from './scene/hardwareRig.js';
 *
 *   const rig = createHardwareRig(scene, {
 *     addLights: true,      // 3-point key/fill/rim + coloured accent lights
 *     shadows: true,        // shadow-casting key light (needs renderer.shadowMap)
 *     explode: 0,           // 0 = assembled, 1 = fully exploded
 *     fanRpm: 0.75,         // 0.2 … 1.5 (normalised RPM for every fan)
 *     aiLoad: 0.35,         // 0 … 1 → tensor-matrix + die activity
 *     thermalLoad: 0.35,    // 0 … 1 → coolant temperature tint
 *     quality: 'high',      // 'high' | 'medium' | 'low'
 *   });
 *
 *   rig.setExplode(0.4);          // smooth: every part eases on its own axis
 *   rig.setFanRpm(1.2);
 *   rig.setAiLoad(0.9);
 *   rig.setThermalLoad(0.7);
 *   rig.update(elapsedSeconds, deltaSeconds, camera.position);
 *   rig.getComponentDistance('cpu', someWorldPoint);   // → number (Infinity if unknown)
 *   rig.getNearestComponent(someWorldPoint);           // → { name, distance }
 *   rig.dispose();                                     // geometry, materials, env map
 *
 * Returned object
 *   group      THREE.Group (already added to `scene` unless attach:false)
 *   lights     { key, fill, rim, accents[], hemisphere, all[] } | null
 *   anchors    frozen copy of COMPONENT_ANCHORS (local to `group`)
 *   groups     named subgroups (motherboard, ram, cpu, cooler, gpu, chassis,
 *              liquidCooler, radiator, tensorMatrix, environment, psu)
 *   setExplode(factor) / getExplode()
 *   setFanRpm(normalised) / getFanRpm()
 *   setAiLoad(load) / getAiLoad()
 *   setThermalLoad(load)
 *   setQuality? (quality is build-time only)
 *   update(elapsed, delta, cameraPos)
 *   getComponentDistance(name, point)
 *   getComponentWorldPosition(name, target?)
 *   getNearestComponent(point)
 *   dispose()
 *
 * PERFORMANCE
 *   ~297 draw calls and ~89k triangles on `high` after static batching (fan
 *   blades, fin stacks, PCB traces, pins and every repeated detail are merged
 *   or instanced), materials shared. Fin
 *   stacks, fan blades, PCB traces and pins are merged or instanced. Custom
 *   shaders: floor, backdrop, glow, RGB light bars, coolant, silicon die.
 *   Every uniform is guarded against NaN; `update()` clamps `delta` so a
 *   background tab cannot teleport the animation.
 * ============================================================================
 */

import * as THREE from 'three';

/* ========================================================================== */
/*  Constants                                                                 */
/* ========================================================================== */

export const HARDWARE_RIG_VERSION = '1.2.0';

const TAU = Math.PI * 2;
const DEG2RAD = Math.PI / 180;

/** Studio floor height (top surface). */
export const FLOOR_Y = -30.5;

/** Overall assembled bounds (world units ≈ cm). */
export const RIG_BOUNDS = Object.freeze({
  width: 54,
  height: 61,
  depth: 36,
  minY: FLOOR_Y,
  maxY: 30.5,
});

/** ATX board plate. `front` is the z of the component face. */
export const BOARD = Object.freeze({
  width: 34,
  height: 26,
  thickness: 0.22,
  front: 0.11,
});

/** CPU socket / package placement (IGS = integrated heat spreader). */
export const CPU_SOCKET = Object.freeze({
  x: -5.6,
  y: 5.4,
  size: 5.4,
  socketTop: 0.95,
  substrateTop: 1.05,
  ihsTop: 1.46,
});

/** Air-cooler reference dimensions. */
export const AIR_COOLER = Object.freeze({
  x: -5.6,
  y: 5.4,
  coldplateZ: 1.5,
  towerLeftX: -9.0,
  towerRightX: -2.2,
  towerWidth: 5.0,
  towerHeight: 12.0,
  towerDepth: 6.4,
  fanZ: 8.9,
  fanRadius: 5.6,
});

/** DDR5 slot x positions and the module envelope. */
export const RAM_SLOTS = Object.freeze([3.6, 5.2, 6.8, 8.4]);
export const RAM_MODULE = Object.freeze({
  bottomY: -1.4,
  topY: 10.4,
  spreaderZ: 3.3,
});

/** PCIe x16 slot. */
export const PCIE_SLOT = Object.freeze({ x: -1.0, y: -5.6, length: 17.0 });

/** GPU envelope (showcase orientation: fans toward +Z). */
export const GPU_BODY = Object.freeze({
  x0: -16.0,
  x1: 8.0,
  y0: -13.6,
  y1: -5.8,
  z0: 1.0,
  z1: 7.0,
  fanY: -9.7,
  fanZ: 7.15,
});

/** Chassis envelope. */
export const CHASSIS = Object.freeze({
  halfWidth: 27,
  halfHeight: 30,
  backZ: -13,
  frontZ: 23,
});

/** Top-mounted 360 mm radiator. */
export const RADIATOR = Object.freeze({
  y: 25.0,
  z: 0.0,
  length: 40,
  depth: 11.4,
  thickness: 2.8,
});

/** Reservoir / pump placement. */
export const RESERVOIR = Object.freeze({
  x: 20.0,
  y: 8.0,
  z: 7.0,
  radius: 2.6,
  height: 14.0,
});

/**
 * Component anchors used by the site's scroll/zone system. All values are
 * local to the returned `group`; use `getComponentWorldPosition()` when the
 * group is transformed.
 */
export const COMPONENT_ANCHORS = Object.freeze({
  overview: Object.freeze({ x: 0.0, y: 0.5, z: 4.0 }),
  motherboard: Object.freeze({ x: 0.0, y: 0.0, z: 0.8 }),
  cpu: Object.freeze({ x: -5.6, y: 5.4, z: 1.6 }),
  cooler: Object.freeze({ x: -5.6, y: 6.4, z: 7.0 }),
  gpu: Object.freeze({ x: -4.0, y: -9.7, z: 7.4 }),
  ram: Object.freeze({ x: 6.0, y: 5.2, z: 3.4 }),
  liquidCooler: Object.freeze({ x: 14.0, y: -3.0, z: 8.0 }),
  radiator: Object.freeze({ x: 0.0, y: 26.4, z: 0.0 }),
  tensorMatrix: Object.freeze({ x: -4.0, y: -3.2, z: 4.6 }),
  psu: Object.freeze({ x: 0.0, y: -25.0, z: 3.0 }),
  chassis: Object.freeze({ x: 0.0, y: 0.0, z: 0.0 }),
});

/** Alias table so scene code can be forgiving about naming. */
const ANCHOR_ALIASES = Object.freeze({
  rig: 'overview',
  studio: 'overview',
  board: 'motherboard',
  mobo: 'motherboard',
  mainboard: 'motherboard',
  processor: 'cpu',
  socket: 'cpu',
  die: 'cpu',
  silicon: 'cpu',
  heatsink: 'cooler',
  aircooler: 'cooler',
  air: 'cooler',
  hsf: 'cooler',
  graphics: 'gpu',
  graphicscard: 'gpu',
  videocard: 'gpu',
  card: 'gpu',
  memory: 'ram',
  dimm: 'ram',
  dimms: 'ram',
  water: 'liquidCooler',
  watercooler: 'liquidCooler',
  aio: 'liquidCooler',
  loop: 'liquidCooler',
  waterblock: 'liquidCooler',
  rad: 'radiator',
  aioRad: 'radiator',
  tensor: 'tensorMatrix',
  tensorcores: 'tensorMatrix',
  ai: 'tensorMatrix',
  matrix: 'tensorMatrix',
  powersupply: 'psu',
  shroud: 'psu',
  frame: 'chassis',
  case: 'chassis',
});

/** Per-part explode displacement (world units) and easing window. */
const EXPLODE_MOTION = Object.freeze({
  cooler: { dx: -2.5, dy: 9.0, dz: 15.0, start: 0.06, end: 0.82 },
  ihs: { dx: 0, dy: 2.2, dz: 5.5, start: 0.18, end: 0.66 },
  gpu: { dx: 2.0, dy: -4.0, dz: 16.0, start: 0.12, end: 0.96 },
  ram: { dx: 5.0, dy: 2.4, dz: 9.0, start: 0.04, end: 0.8, stagger: 1.6 },
  radiator: { dx: 0, dy: 10.0, dz: 2.0, start: 0.2, end: 0.98 },
  reservoir: { dx: 4.0, dy: 1.2, dz: 10.0, start: 0.1, end: 0.9 },
  shelf: { dx: 0, dy: -3.0, dz: 11.0, start: 0.08, end: 0.86 },
  tubes: { dx: 0, dy: 0.8, dz: 4.2, start: 0.14, end: 0.92 },
  tensor: { dx: 0, dy: 3.4, dz: 0.0, start: 0.15, end: 0.85 },
  chassis: { dx: 3.2, dy: 0.0, dz: 2.4, start: 0.0, end: 0.9 },
  psu: { dx: 0, dy: -1.6, dz: 0, start: 0.2, end: 0.9 },
});

/** Quality presets: geometry density and shadow map size. */
const QUALITY_PRESETS = Object.freeze({
  high: {
    finsPerTower: 46,
    radiatorFins: 96,
    traceCount: 58,
    tubeRadialSegments: 14,
    tubePathSegments: 76,
    fanBladeSegments: 9,
    dustCount: 520,
    shadowMapSize: 2048,
    m2HeatsinkFins: 9,
    vrmFins: 11,
  },
  medium: {
    finsPerTower: 34,
    radiatorFins: 64,
    traceCount: 40,
    tubeRadialSegments: 10,
    tubePathSegments: 52,
    fanBladeSegments: 7,
    dustCount: 300,
    shadowMapSize: 1024,
    m2HeatsinkFins: 7,
    vrmFins: 8,
  },
  low: {
    finsPerTower: 24,
    radiatorFins: 44,
    traceCount: 26,
    tubeRadialSegments: 8,
    tubePathSegments: 34,
    fanBladeSegments: 5,
    dustCount: 160,
    shadowMapSize: 1024,
    m2HeatsinkFins: 5,
    vrmFins: 6,
  },
});

/** Palette — kept in one place so the whole rig can be re-skinned. */
export const PALETTE = Object.freeze({
  void: 0x070a10,
  pcb: 0x0a1016,
  pcbInner: 0x0c1a20,
  copper: 0xb06a34,
  copperPolished: 0xd08a52,
  gold: 0xd8a34a,
  nickel: 0xc3c9d2,
  alu: 0xb6bdc7,
  aluDark: 0x2b323b,
  gunmetal: 0x424a56,
  anodized: 0x1d232b,
  plastic: 0x12161c,
  rubber: 0x0a0c10,
  teal: 0x38bdf8,
  amber: 0xf59e0b,
  coral: 0xfb7185,
  violet: 0xa855f7,
  mint: 0x5eead4,
  ice: 0x9be7ff,
});

/* ========================================================================== */
/*  Small maths helpers                                                       */
/* ========================================================================== */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (edge0, edge1, v) => {
  if (edge0 === edge1) return v < edge0 ? 0 : 1;
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const damp = (current, target, lambda, dt) =>
  lerp(current, target, 1 - Math.exp(-lambda * Math.max(dt, 0)));
const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

/** Deterministic PRNG (mulberry32) — the rig is identical on every load. */
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

/* ========================================================================== */
/*  Geometry helpers                                                          */
/* ========================================================================== */

/** Rounded rectangle Shape centred on the origin (for extrusions). */
function roundedRectShape(width, height, radius) {
  const w = Math.max(width, 0.0001);
  const h = Math.max(height, 0.0001);
  const r = clamp(radius, 0, Math.min(w, h) * 0.5);
  const x = -w / 2;
  const y = -h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/**
 * Soft-edged box: rounded corners in-plane plus a small bevel on the front and
 * back faces. Extruded along +Z and re-centred, so it can replace BoxGeometry
 * wherever a crisp-but-not-CAD edge is wanted.
 */
function beveledBoxGeometry(width, height, depth, opts = {}) {
  const radius = opts.radius !== undefined ? opts.radius : 0.28;
  const bevel = Math.min(
    opts.bevel !== undefined ? opts.bevel : 0.07,
    Math.min(width, height, depth) * 0.22
  );
  const curveSegments = opts.curveSegments !== undefined ? opts.curveSegments : 3;
  const shape = roundedRectShape(width - bevel * 2, height - bevel * 2, radius);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth - bevel * 2, 0.001),
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments,
    steps: 1,
  });
  geo.translate(0, 0, -(depth - bevel * 2) * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/** Extrude an arbitrary Shape along Z, centred. */
function extrudeCentered(shape, depth, opts = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth, 0.001),
    bevelEnabled: opts.bevel !== undefined ? opts.bevel : false,
    bevelSize: opts.bevelSize !== undefined ? opts.bevelSize : 0.04,
    bevelThickness: opts.bevelThickness !== undefined ? opts.bevelThickness : 0.04,
    bevelSegments: opts.bevelSegments !== undefined ? opts.bevelSegments : 2,
    curveSegments: opts.curveSegments !== undefined ? opts.curveSegments : 6,
    steps: 1,
  });
  geo.translate(0, 0, -depth * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Merge simple indexed/non-indexed geometries (position/normal/uv only) into
 * one BufferGeometry. Used for fan blade rotors and other repeated detail so
 * each assembly stays a single draw call.
 */
function mergeSimpleGeometries(geometries) {
  const expanded = [];
  let total = 0;
  for (const geo of geometries) {
    if (!geo) continue;
    const g = geo.index ? geo.toNonIndexed() : geo;
    expanded.push(g);
    total += g.attributes.position.count;
  }
  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of expanded) {
    const p = g.attributes.position.array;
    const n = g.attributes.normal ? g.attributes.normal.array : null;
    const t = g.attributes.uv ? g.attributes.uv.array : null;
    const count = g.attributes.position.count;
    position.set(p, o * 3);
    if (n) normal.set(n, o * 3);
    if (t) uv.set(t, o * 2);
    o += count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  merged.computeBoundingSphere();
  for (const g of expanded) {
    if (g !== geometries[geometries.length - 1]) g.dispose();
  }
  return merged;
}

/**
 * A single curved fan blade: a swept, cambered surface with real thickness,
 * generated as a parametric grid. hubR→tipR radially, chord along the angular
 * direction, pitch tilts the chord, sweep drags the tip backwards.
 */
function makeFanBladeGeometry(opts = {}) {
  const hubR = opts.hubR !== undefined ? opts.hubR : 1.75;
  const tipR = opts.tipR !== undefined ? opts.tipR : 5.05;
  const pitch = opts.pitch !== undefined ? opts.pitch : 0.58;
  const sweep = opts.sweep !== undefined ? opts.sweep : 0.95;
  const chordAngle = opts.chordAngle !== undefined ? opts.chordAngle : 0.72;
  const thickness = opts.thickness !== undefined ? opts.thickness : 0.085;
  const segR = opts.segR !== undefined ? opts.segR : 9;
  const segC = opts.segC !== undefined ? opts.segC : 6;

  const front = [];
  const back = [];
  const rows = [];
  for (let i = 0; i <= segR; i++) {
    const u = i / segR;
    const r = lerp(hubR, tipR, u);
    const rowF = [];
    const rowB = [];
    for (let j = 0; j <= segC; j++) {
      const v = j / segC;
      const theta = sweep * Math.pow(u, 1.55) + (v - 0.5) * chordAngle * (0.55 + 0.45 * u);
      const camber = Math.sin(Math.PI * v) * 0.16 * u;
      const z =
        Math.tan(pitch) * (r * (v - 0.5) * chordAngle * (0.55 + 0.45 * u)) +
        camber -
        u * u * 0.22;
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      rowF.push(new THREE.Vector3(x, y, z + thickness * 0.5));
      rowB.push(new THREE.Vector3(x, y, z - thickness * 0.5));
    }
    rows.push(rowF);
    front.push(rowF);
    back.push(rowB);
  }

  // Front + back sheets.
  const positions = [];
  const uvs = [];
  const pushTri = (a, b, c, ua, ub, uc) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    uvs.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
  };

  const uvOf = (i, j) => [i / segR, j / segC];
  for (let i = 0; i < segR; i++) {
    for (let j = 0; j < segC; j++) {
      const a = front[i][j];
      const b = front[i + 1][j];
      const c = front[i + 1][j + 1];
      const d = front[i][j + 1];
      pushTri(a, b, c, uvOf(i, j), uvOf(i + 1, j), uvOf(i + 1, j + 1));
      pushTri(a, c, d, uvOf(i, j), uvOf(i + 1, j + 1), uvOf(i, j + 1));

      const ab = back[i][j];
      const bb = back[i + 1][j];
      const cb = back[i + 1][j + 1];
      const db = back[i][j + 1];
      pushTri(ab, cb, bb, uvOf(i, j), uvOf(i + 1, j + 1), uvOf(i + 1, j));
      pushTri(ab, db, cb, uvOf(i, j), uvOf(i, j + 1), uvOf(i + 1, j + 1));
    }
  }

  // Rim: tip, trailing edge, leading edge (hub edge stays hidden in the hub).
  const addRimQuad = (p0, p1, q0, q1) => {
    pushTri(p0, p1, q1, [0, 0], [0, 0], [0, 0]);
    pushTri(p0, q1, q0, [0, 0], [0, 0], [0, 0]);
  };
  for (let i = 0; i < segR; i++) {
    addRimQuad(front[i][0], front[i + 1][0], back[i][0], back[i + 1][0]);
    addRimQuad(front[i][segC], back[i][segC], front[i + 1][segC], back[i + 1][segC]);
  }
  for (let j = 0; j < segC; j++) {
    addRimQuad(front[segR][j], back[segR][j], front[segR][j + 1], back[segR][j + 1]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/** A rotor: `count` blades radially distributed, merged into one geometry. */
function makeFanRotorGeometry(opts = {}) {
  const count = opts.count !== undefined ? opts.count : 9;
  const hubR = opts.hubR !== undefined ? opts.hubR : 1.75;
  const tipR = opts.tipR !== undefined ? opts.tipR : 5.05;
  const blades = [];
  const base = makeFanBladeGeometry(opts);
  for (let i = 0; i < count; i++) {
    const g = base.clone();
    g.rotateZ((i / count) * TAU);
    blades.push(g);
  }
  base.dispose();
  const merged = mergeSimpleGeometries(blades);
  const hub = new THREE.CylinderGeometry(hubR, hubR * 1.02, opts.hubHeight || 0.9, 24, 1, false);
  hub.rotateX(Math.PI * 0.5);
  return mergeSimpleGeometries([merged, hub]);
}

/** A short tube from a smooth curve. */
function tubeGeometryFromPoints(points, radius, tubularSegments, radialSegments, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.5);
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
  return { geometry: geo, curve };
}

/* ========================================================================== */
/*  Procedural studio environment (for polished metal reflections)             */
/* ========================================================================== */

/**
 * Builds a small equirectangular studio map from maths only: a near-black
 * graded sky, three soft rectangular light sources and a cool rim band. Three
 * converts it to a PMREM at first render, so copper / nickel / aluminium pick
 * up believable softbox highlights without any texture files.
 */
function createStudioEnvironmentMap() {
  const width = 256;
  const height = 128;
  const data = new Uint8Array(width * height * 4);

  const toDir = (azDeg, elDeg) => {
    const az = azDeg * DEG2RAD;
    const el = elDeg * DEG2RAD;
    return {
      x: Math.cos(el) * Math.cos(az),
      y: Math.sin(el),
      z: Math.cos(el) * Math.sin(az),
    };
  };

  const lobes = [
    { dir: toDir(-56, 40), color: [255, 238, 214], gain: 0.62, falloff: 7.0 },
    { dir: toDir(-86, 26), color: [255, 205, 160], gain: 0.3, falloff: 10.0 },
    { dir: toDir(124, 20), color: [120, 210, 255], gain: 0.4, falloff: 5.0 },
    { dir: toDir(58, 8), color: [90, 150, 190], gain: 0.22, falloff: 3.2 },
    { dir: toDir(180, -6), color: [255, 140, 90], gain: 0.14, falloff: 3.0 },
    { dir: toDir(0, 78), color: [190, 225, 255], gain: 0.22, falloff: 2.0 },
  ];

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    const el = (0.5 - v) * Math.PI;
    const cosEl = Math.cos(el);
    const sinEl = Math.sin(el);
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const az = u * TAU;
      const dx = cosEl * Math.cos(az);
      const dy = sinEl;
      const dz = cosEl * Math.sin(az);

      const up = clamp01(dy);
      const horizon = Math.exp(-Math.pow(dy * 4.2, 2));
      let r = 6 + up * 14 + horizon * 5;
      let g = 9 + up * 19 + horizon * 8;
      let b = 15 + up * 28 + horizon * 11;

      // ground bounce (very dim, warm-neutral)
      const down = clamp01(-dy);
      r += down * 6;
      g += down * 7;
      b += down * 9;

      for (const lobe of lobes) {
        const d = dx * lobe.dir.x + dy * lobe.dir.y + dz * lobe.dir.z;
        if (d <= 0) continue;
        const glow = Math.pow(d, lobe.falloff) * lobe.gain;
        r += lobe.color[0] * glow;
        g += lobe.color[1] * glow;
        b += lobe.color[2] * glow;
      }

      const i = (y * width + x) * 4;
      data[i] = Math.min(255, Math.round(r));
      data[i + 1] = Math.min(255, Math.round(g));
      data[i + 2] = Math.min(255, Math.round(b));
      data[i + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/* ========================================================================== */
/*  GLSL sources                                                              */
/* ========================================================================== */

const GLSL_HASH = /* glsl */ `
  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
`;

const FLOOR_VERTEX = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FLOOR_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBase;
  uniform vec3 uLine;
  uniform vec3 uAccent;
  uniform vec3 uWarm;
  uniform float uIntensity;

  varying vec2 vWorld;

  ${GLSL_HASH}

  float gridLine(vec2 p, float cell, float width) {
    vec2 q = abs(fract(p / cell + 0.5) - 0.5) * cell;
    float d = min(q.x, q.y);
    return 1.0 - smoothstep(width, width * 2.6, d);
  }

  void main() {
    vec2 p = vWorld;
    float r = length(p);

    float fine = gridLine(p, 2.5, 0.012) * 0.28;
    float cell = gridLine(p, 10.0, 0.028) * 0.62;
    float major = gridLine(p, 50.0, 0.055) * 0.95;

    vec2 cellId = floor(p / 10.0);
    vec2 local = (fract(p / 10.0) - 0.5) * 10.0;
    float h = hash21(cellId);
    float pad = smoothstep(0.62, 0.42, length(local)) * step(0.9, h) * 0.5;

    vec3 col = uBase;
    col += uLine * (fine + cell * 0.75 + major * 1.15);
    col += uAccent * pad;

    float stage = exp(-pow(r * 0.034, 2.0));
    col += uWarm * stage * 0.11;
    col += uAccent * stage * 0.2;

    float ringRadius = mod(uTime * 4.5, 130.0);
    float ring = exp(-pow((r - ringRadius) * 0.45, 2.0)) * 0.09;
    col += uAccent * ring;

    col *= 1.0 - smoothstep(30.0, 135.0, r);
    col *= uIntensity;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const BACKDROP_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BACKDROP_FRAGMENT = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uHaze;
  uniform vec3 uGlowA;
  uniform vec3 uGlowB;
  uniform vec3 uDirA;
  uniform vec3 uDirB;

  varying vec3 vDir;

  void main() {
    vec3 d = normalize(vDir);
    float up = smoothstep(-0.62, 0.92, d.y);
    vec3 col = mix(uBottom, uTop, up);
    col = mix(col, uHaze, smoothstep(0.16, -0.55, d.y) * 0.9);

    float a = pow(max(dot(d, normalize(uDirA)), 0.0), 5.0);
    float b = pow(max(dot(d, normalize(uDirB)), 0.0), 14.0);
    col += uGlowA * a * 0.36 + uGlowB * b * 0.3;

    col *= 1.0 - 0.35 * smoothstep(0.35, -0.4, d.y);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(clamp(1.0 - d, 0.0, 1.0), uPower) * uStrength;
    gl_FragColor = vec4(uColor * a, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const RGB_BAR_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RGB_BAR_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uHue;
  uniform float uSegments;
  uniform float uSpeed;
  uniform float uBright;
  uniform float uAxis;

  varying vec2 vUv;

  vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
  }

  void main() {
    float t = mix(vUv.y, vUv.x, uAxis);
    float cells = max(uSegments, 1.0);
    float f = t * cells;
    float cellId = floor(f);
    float frac = fract(f);

    float mask = smoothstep(0.06, 0.2, frac) * smoothstep(0.94, 0.8, frac);
    float hue = fract(uHue + cellId * 0.048 + uTime * 0.035 * uSpeed);
    vec3 colour = hsv2rgb(vec3(hue, 0.88, 1.0));

    float pulse = 0.5 + 0.5 * sin(uTime * 1.9 * uSpeed - cellId * 0.62);
    float value = mask * (0.35 + 0.65 * pulse) * uBright;

    vec3 edge = colour * smoothstep(0.0, 0.055, frac) * smoothstep(1.0, 0.945, frac);
    vec3 col = colour * value + edge * 0.45 * uBright;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const COOLANT_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormalView = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const COOLANT_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform float uThermal;
  uniform float uUseV;
  uniform float uStreaks;
  uniform float uBubbles;
  uniform float uSwirl;
  uniform float uOpacity;
  uniform vec3 uCool;
  uniform vec3 uWarm;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  ${GLSL_HASH}

  void main() {
    float along = mix(vUv.x, vUv.y, uUseV);
    float across = mix(vUv.y, vUv.x, uUseV);
    float t = uTime * uFlow;

    // Coolant carries heat around the loop: cool blue where it returns from
    // the radiator, warm teal after the blocks.
    float grad = smoothstep(0.02, 0.98, along);
    vec3 tint = mix(uCool, uWarm, clamp(grad * 0.8 + uThermal * 0.45, 0.0, 1.0));

    // Directional flow streaks: broad, soft, slightly helical in a reservoir.
    float streak = 0.0;
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      float s = fract(along * uStreaks + across * uSwirl - t * (0.14 + 0.06 * fi) + fi * 0.41);
      streak += pow(smoothstep(0.0, 0.34, s) * smoothstep(0.78, 0.3, s), 1.4);
    }
    streak = clamp(streak, 0.0, 1.4);

    // Micro-bubbles drifting with the flow.
    float bubbles = 0.0;
    vec2 bubbleSpace = vec2(along * uBubbles - t * 0.26, across * 3.6);
    vec2 bCell = floor(bubbleSpace);
    vec2 bLocal = fract(bubbleSpace);
    float bh = hash21(bCell);
    vec2 bCenter = vec2(0.2 + 0.6 * hash21(bCell + 3.1), 0.25 + 0.5 * hash21(bCell + 7.7));
    float bDist = length((bLocal - bCenter) * vec2(1.0, 1.35));
    bubbles += smoothstep(0.075, 0.0, bDist) * step(0.66, bh);

    vec3 col = tint * (0.13 + streak * 0.5 + bubbles * 0.55);

    float rim = pow(1.0 - clamp(abs(dot(normalize(vNormalView), normalize(vViewDir))), 0.0, 1.0), 2.6);
    col += tint * rim * 0.22;

    float alpha = clamp(uOpacity * (0.3 + streak * 0.28 + bubbles * 0.4), 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const DIE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DIE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uLoad;
  uniform float uReveal;
  uniform vec3 uCore;
  uniform vec3 uCache;
  uniform vec3 uStreet;

  varying vec2 vUv;

  ${GLSL_HASH}

  void main() {
    vec2 g = vUv * vec2(20.0, 18.0);
    vec2 id = floor(g);
    vec2 f = fract(g);

    float block = smoothstep(0.10, 0.2, f.x) * smoothstep(0.90, 0.8, f.x) *
                  smoothstep(0.12, 0.22, f.y) * smoothstep(0.88, 0.78, f.y);

    float h = hash21(id);
    float cacheBand = step(0.7, fract(id.y * 0.41 + floor(id.x / 3.0) * 0.23 + h * 0.1));
    vec3 base = mix(uCore, uCache, cacheBand);

    float wave = 0.5 + 0.5 * sin(uTime * (0.8 + h * 2.8) + h * 6.2831 + id.x * 0.45);
    float activity = mix(0.3, 1.0, pow(wave, 2.6)) * (1.0 + uLoad * 1.8) * (0.6 + 0.4 * h);

    float streets = (1.0 - block) * 0.22;
    vec3 col = base * (block * activity + streets);
    col += uStreet * (1.0 - block) * 0.12;

    // Package edge glow.
    float edge = smoothstep(0.06, 0.0, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    col += uStreet * edge * 0.6;

    gl_FragColor = vec4(col * uReveal * 1.7, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ========================================================================== */
/*  Materials                                                                 */
/* ========================================================================== */

function createMaterials(envMap) {
  const std = (params) =>
    new THREE.MeshStandardMaterial({ envMap, envMapIntensity: 1.0, ...params });

  const M = {
    /* board */
    pcb: std({ color: PALETTE.pcb, roughness: 0.78, metalness: 0.22, envMapIntensity: 0.22 }),
    pcbInner: std({ color: PALETTE.pcbInner, roughness: 0.62, metalness: 0.3, envMapIntensity: 0.3 }),
    pcbEdge: std({ color: 0x14242b, roughness: 0.5, metalness: 0.35, envMapIntensity: 0.35 }),

    /* metals */
    copper: std({ color: PALETTE.copper, roughness: 0.32, metalness: 1.0, envMapIntensity: 0.85 }),
    copperPolished: std({ color: PALETTE.copperPolished, roughness: 0.18, metalness: 1.0, envMapIntensity: 1.0 }),
    gold: std({ color: PALETTE.gold, roughness: 0.28, metalness: 1.0, envMapIntensity: 0.85 }),
    nickel: std({ color: 0xaeb7c2, roughness: 0.26, metalness: 1.0, envMapIntensity: 0.8 }),
    alu: std({ color: 0x9aa4b0, roughness: 0.5, metalness: 0.8, envMapIntensity: 0.45 }),
    aluDark: std({ color: PALETTE.aluDark, roughness: 0.62, metalness: 0.55, envMapIntensity: 0.3 }),
    gunmetal: std({ color: PALETTE.gunmetal, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.45 }),
    anodized: std({ color: PALETTE.anodized, roughness: 0.6, metalness: 0.55, envMapIntensity: 0.3 }),
    carbon: std({ color: 0x0d1116, roughness: 0.82, metalness: 0.14, envMapIntensity: 0.16 }),
    carbonPlate: std({ color: 0x10141a, roughness: 0.9, metalness: 0.08, envMapIntensity: 0.12 }),
    chrome: std({ color: 0xd2dbe6, roughness: 0.1, metalness: 1.0, envMapIntensity: 1.05 }),
    darkChrome: std({ color: 0x59636f, roughness: 0.16, metalness: 1.0, envMapIntensity: 0.8 }),

    /* plastics & dielectrics */
    plastic: std({ color: PALETTE.plastic, roughness: 0.82, metalness: 0.05, envMapIntensity: 0.25 }),
    plasticGloss: std({ color: 0x0d1116, roughness: 0.34, metalness: 0.15, envMapIntensity: 0.45 }),
    plasticLight: std({ color: 0x1b222b, roughness: 0.66, metalness: 0.1, envMapIntensity: 0.3 }),
    rubber: std({ color: PALETTE.rubber, roughness: 0.96, metalness: 0.0, envMapIntensity: 0.15 }),
    ceramic: std({ color: 0xd8cfc0, roughness: 0.7, metalness: 0.0, envMapIntensity: 0.25 }),
    solder: std({ color: 0x9aa3ad, roughness: 0.24, metalness: 1.0, envMapIntensity: 0.8 }),
    substrate: std({ color: 0x0d2b25, roughness: 0.55, metalness: 0.25, envMapIntensity: 0.35 }),
    braid: std({ color: 0x0e1218, roughness: 0.85, metalness: 0.15, envMapIntensity: 0.22 }),
    thermalPad: std({ color: 0x1d2a33, roughness: 0.9, metalness: 0.0, envMapIntensity: 0.15 }),
  };

  /* Translucent acrylic for blocks and reservoir walls. */
  M.acrylic = new THREE.MeshPhysicalMaterial({
    color: 0xbfe7f5,
    roughness: 0.08,
    metalness: 0.0,
    transmission: 0.0,
    transparent: true,
    opacity: 0.16,
    envMap,
    envMapIntensity: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  /* Dark tempered glass (side-panel accents). */
  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0x6f97a8,
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity: 0.09,
    envMap,
    envMapIntensity: 0.5,
    clearcoat: 0.55,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  /* Emissive strips (status bar, halo rims, I/O slit). */
  const glowMat = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
  M.glowTeal = glowMat(0x7fe8ff, 0.95);
  M.glowAmber = glowMat(0xffb367, 0.9);
  M.glowCoral = glowMat(0xff8a9c, 0.9);
  M.glowViolet = glowMat(0xb98cff, 0.85);
  M.glowWhite = glowMat(0xdff3ff, 0.72);
  M.glassEdge = glowMat(0xbfe8ff, 0.26);

  /* Matte carbon for large horizontal plates: no specular sheen at grazing
     angles, so the shroud stays dark obsidian instead of turning into a
     lightbox when the camera looks along its top. */
  M.carbonTop = new THREE.MeshBasicMaterial({ color: 0x0b0f14 });

  /* Line layers: PCB traces and silkscreen. */
  M.traceGold = new THREE.LineBasicMaterial({
    color: 0xd8a34a,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  M.traceTeal = new THREE.LineBasicMaterial({
    color: 0x4fd6e8,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  M.silk = new THREE.LineBasicMaterial({
    color: 0x9fb3c8,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });

  M.envMap = envMap;
  return M;
}

/** ShaderMaterials that depend on time are registered in ctx.timeUniforms. */
function createCoolantMaterial(ctx, opts = {}) {
  const uTime = { value: 0 };
  ctx.timeUniforms.push(uTime);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      uFlow: { value: opts.flow !== undefined ? opts.flow : 1.0 },
      uThermal: { value: 0.35 },
      uUseV: { value: opts.useV ? 1 : 0 },
      uStreaks: { value: opts.streaks !== undefined ? opts.streaks : 3.0 },
      uBubbles: { value: opts.bubbles !== undefined ? opts.bubbles : 18.0 },
      uSwirl: { value: opts.swirl !== undefined ? opts.swirl : 0.0 },
      uOpacity: { value: opts.opacity !== undefined ? opts.opacity : 0.7 },
      uCool: { value: new THREE.Color(0x2a8fc4) },
      uWarm: { value: new THREE.Color(0x36b9a6) },
    },
    vertexShader: COOLANT_VERTEX,
    fragmentShader: COOLANT_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });
  mat.userData.coolant = true;
  mat.userData.baseFlow = opts.flow !== undefined ? opts.flow : 1.0;
  if (ctx && Array.isArray(ctx.coolantMaterials)) ctx.coolantMaterials.push(mat);
  return mat;
}

function createRgbBarMaterial(ctx, opts = {}) {
  const uTime = { value: 0 };
  ctx.timeUniforms.push(uTime);
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      uHue: { value: opts.hue !== undefined ? opts.hue : 0.52 },
      uSegments: { value: opts.segments !== undefined ? opts.segments : 14.0 },
      uSpeed: { value: 1.0 },
      uBright: { value: 1.0 },
      uAxis: { value: opts.axis !== undefined ? opts.axis : 0.0 },
    },
    vertexShader: RGB_BAR_VERTEX,
    fragmentShader: RGB_BAR_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

function createFloorMaterial(ctx, quality) {
  const uTime = { value: 0 };
  ctx.timeUniforms.push(uTime);
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      uBase: { value: new THREE.Color(0x05080d) },
      uLine: { value: new THREE.Color(0x1b6a7a) },
      uAccent: { value: new THREE.Color(0x2a9fc4) },
      uWarm: { value: new THREE.Color(0x8a5a2a) },
      uIntensity: { value: 1.0 },
    },
    vertexShader: FLOOR_VERTEX,
    fragmentShader: FLOOR_FRAGMENT,
    depthWrite: true,
  });
}

function createBackdropMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(0x0a1220) },
      uBottom: { value: new THREE.Color(0x05070b) },
      uHaze: { value: new THREE.Color(0x0e2230) },
      uGlowA: { value: new THREE.Color(0x2ea6c8) },
      uGlowB: { value: new THREE.Color(0x7a4a2a) },
      uDirA: { value: new THREE.Vector3(0.35, 0.42, -0.84).normalize() },
      uDirB: { value: new THREE.Vector3(-0.55, 0.3, -0.78).normalize() },
    },
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: BACKDROP_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

/** Additive radial glow plane (used for halos, light shafts, stage light). */
function createGlowMaterial(color, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: opts.power !== undefined ? opts.power : 2.4 },
      uStrength: { value: opts.strength !== undefined ? opts.strength : 0.6 },
    },
    vertexShader: GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

function createDieMaterial(ctx) {
  const uTime = { value: 0 };
  ctx.timeUniforms.push(uTime);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      uLoad: { value: 0.35 },
      uReveal: { value: 0.0 },
      uCore: { value: new THREE.Color(0x2fd2ff) },
      uCache: { value: new THREE.Color(0xffb15c) },
      uStreet: { value: new THREE.Color(0x0f4a63) },
    },
    vertexShader: DIE_VERTEX,
    fragmentShader: DIE_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  return mat;
}
/* ========================================================================== */
/*  Mesh helpers                                                              */
/* ========================================================================== */

/** Create + place a box (optionally soft-edged) and add it to `parent`. */
function box(parent, w, h, d, material, x, y, z, opts = {}) {
  const geo = opts.soft
    ? beveledBoxGeometry(w, h, d, {
        radius: opts.radius !== undefined ? opts.radius : 0.2,
        bevel: opts.bevel !== undefined ? opts.bevel : 0.05,
        curveSegments: opts.curveSegments !== undefined ? opts.curveSegments : 2,
      })
    : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  if (opts.name) mesh.name = opts.name;
  parent.add(mesh);
  return mesh;
}

/** Create + place a cylinder. Defaults to a Z-aligned disc. */
function cyl(parent, radiusTop, radiusBottom, height, material, x, y, z, opts = {}) {
  const geo = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    opts.segments !== undefined ? opts.segments : 24,
    opts.heightSegments !== undefined ? opts.heightSegments : 1,
    !!opts.open
  );
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
  parent.add(mesh);
  return mesh;
}

/** Rectangle outline as a LineLoop (silkscreen, etched IHS marks, etc.). */
function outlineRect(parent, w, h, material, x, y, z) {
  const pts = [
    new THREE.Vector3(-w / 2, -h / 2, 0),
    new THREE.Vector3(w / 2, -h / 2, 0),
    new THREE.Vector3(w / 2, h / 2, 0),
    new THREE.Vector3(-w / 2, h / 2, 0),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mesh = new THREE.LineLoop(geo, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/** A smooth tube through control points. */
function addTube(parent, points, radius, material, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points, !!opts.closed, 'catmullrom', 0.5);
  const geo = new THREE.TubeGeometry(
    curve,
    opts.segments !== undefined ? opts.segments : 48,
    radius,
    opts.radial !== undefined ? opts.radial : 10,
    !!opts.closed
  );
  const mesh = new THREE.Mesh(geo, material);
  parent.add(mesh);
  return mesh;
}

/**
 * Deterministic PCB trace field: Manhattan runs with occasional 45° escapes,
 * emitted as one LineSegments object (one draw call for the whole layer).
 */
function buildTraceLines(rand, count, width, height, z, margin = 1.4) {
  const positions = [];
  const xMax = width / 2 - margin;
  const yMax = height / 2 - margin;

  for (let i = 0; i < count; i++) {
    let x = (rand() - 0.5) * width * 0.86;
    let y = (rand() - 0.5) * height * 0.86;
    const steps = 2 + Math.floor(rand() * 3);
    for (let s = 0; s < steps; s++) {
      const horizontal = rand() < 0.55;
      const len = 1.0 + rand() * 5.4;
      const sign = rand() < 0.5 ? -1 : 1;
      let nx = x;
      let ny = y;
      if (horizontal) nx = clamp(x + len * sign, -xMax, xMax);
      else ny = clamp(y + len * sign, -yMax, yMax);

      positions.push(x, y, z, nx, ny, z);

      if (rand() < 0.32) {
        const diag = Math.min(1.4, Math.abs(nx - x) + Math.abs(ny - y));
        const dx = nx >= x ? diag : -diag;
        const dy = ny >= y ? diag : -diag;
        positions.push(nx, ny, z, clamp(nx + dx, -xMax, xMax), clamp(ny + dy, -yMax, yMax), z);
        x = clamp(nx + dx, -xMax, xMax);
        y = clamp(ny + dy, -yMax, yMax);
      } else {
        x = nx;
        y = ny;
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

/** A fan: frame + rotor + halo. Registers the rotor for spinning. */
function addFan(ctx, parent, opts = {}) {
  const size = opts.size !== undefined ? opts.size : 12;
  const thickness = opts.thickness !== undefined ? opts.thickness : 2.0;
  const radius = size * 0.5;
  const bladeTip = radius * (opts.tipFactor !== undefined ? opts.tipFactor : 0.865);
  const hub = radius * (opts.hubFactor !== undefined ? opts.hubFactor : 0.31);
  const blades = opts.blades !== undefined ? opts.blades : 9;
  const x = opts.x || 0;
  const y = opts.y || 0;
  const z = opts.z || 0;
  const materialFrame = opts.materialFrame || ctx.mats.plastic;
  const materialRotor = opts.materialRotor || ctx.mats.plasticGloss;
  const haloColor = opts.haloColor !== undefined ? opts.haloColor : PALETTE.teal;

  const fanGroup = new THREE.Group();
  fanGroup.position.set(x, y, z);
  if (opts.axis === 'y') fanGroup.rotation.x = -Math.PI / 2;
  else if (opts.axis === 'x') fanGroup.rotation.y = Math.PI / 2;
  parent.add(fanGroup);

  // Frame: a square plate with a large circular opening.
  if (opts.frame !== false) {
    const shape = roundedRectShape(size, size, radius * 0.22);
    const hole = new THREE.Path();
    hole.absarc(0, 0, radius * (opts.holeFactor !== undefined ? opts.holeFactor : 0.955), 0, TAU, true);
    shape.holes.push(hole);
    const geo = extrudeCentered(shape, thickness, {
      bevel: true,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      bevelSegments: 2,
      curveSegments: 20,
    });
    const frame = new THREE.Mesh(geo, materialFrame);
    fanGroup.add(frame);

    // Corner screw bosses.
    const cornerOffset = radius - 0.62;
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sy = -1; sy <= 1; sy += 2) {
        const screw = cyl(
          fanGroup,
          0.42,
          0.42,
          thickness * 0.42,
          materialFrame,
          sx * cornerOffset,
          sy * cornerOffset,
          0,
          { segments: 10 }
        );
        screw.rotation.x = Math.PI / 2;
        cyl(
          fanGroup,
          0.2,
          0.2,
          thickness * 0.5,
          ctx.mats.rubber,
          sx * cornerOffset,
          sy * cornerOffset,
          thickness * 0.26,
          { segments: 8, rx: Math.PI / 2 }
        );
      }
    }

    // Subtle inner lip so the rotor sits in a recess.
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.95, 0.055, 6, 48),
      materialFrame
    );
    lip.position.z = thickness * 0.5;
    fanGroup.add(lip);
  }

  // Halo ring behind the blades.
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.82, radius * 0.955, 48),
    new THREE.MeshBasicMaterial({
      color: haloColor,
      transparent: true,
      opacity: opts.haloOpacity !== undefined ? opts.haloOpacity : 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  halo.position.z = -thickness * 0.22;
  fanGroup.add(halo);

  // Rotor: merged curved blades + hub, spinning about local Z.
  const rotorGroup = new THREE.Group();
  rotorGroup.position.z = thickness * 0.06;
  fanGroup.add(rotorGroup);

  const rotorGeo = makeFanRotorGeometry({
    hubR: hub,
    tipR: bladeTip,
    pitch: opts.pitch !== undefined ? opts.pitch : 0.6,
    sweep: opts.sweep !== undefined ? opts.sweep : 1.02,
    chordAngle: opts.chordAngle !== undefined ? opts.chordAngle : 0.72,
    thickness: opts.bladeThickness !== undefined ? opts.bladeThickness : 0.085,
    segR: ctx.quality.fanBladeSegments,
    segC: 5,
    count: blades,
    hubHeight: thickness * 0.55,
  });
  const rotor = new THREE.Mesh(rotorGeo, materialRotor);
  rotorGroup.add(rotor);

  // Hub cap with a glowing ring.
  const cap = cyl(
    rotorGroup,
    hub * 0.92,
    hub * 0.98,
    thickness * 0.42,
    materialRotor,
    0,
    0,
    thickness * 0.24,
    { segments: 24, rx: Math.PI / 2 }
  );
  cap.rotation.x = Math.PI / 2;

  const hubRing = new THREE.Mesh(
    new THREE.RingGeometry(hub * 0.34, hub * 0.7, 32),
    new THREE.MeshBasicMaterial({
      color: haloColor,
      transparent: true,
      opacity: opts.hubGlow !== undefined ? opts.hubGlow : 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  hubRing.position.z = thickness * 0.468;
  rotorGroup.add(hubRing);

  ctx.fans.push({
    object: rotorGroup,
    axis: 'z',
    speed: opts.speed !== undefined ? opts.speed : 1.0,
    phase: opts.phase !== undefined ? opts.phase : ctx.fans.length * 0.37,
    halo,
    hubRing,
  });

  return { group: fanGroup, rotor: rotorGroup, halo, hubRing };
}

/* ========================================================================== */
/*  Tensor-Core / AI compute matrix                                           */
/* ========================================================================== */

/**
 * A lattice of glowing tensor nodes with data-packet traffic. Two orientations:
 * 'xz' for the GPU hologram (lies above the card) and 'xy' for the CPU (sits
 * flat on the die). Returns a ticker that drives pulses from `aiLoad` and a
 * reveal factor.
 */
function buildTensorLattice(ctx, opts = {}) {
  const cols = opts.cols !== undefined ? opts.cols : 11;
  const rows = opts.rows !== undefined ? opts.rows : 5;
  const spacingX = opts.spacingX !== undefined ? opts.spacingX : 1.9;
  const spacingZ = opts.spacingZ !== undefined ? opts.spacingZ : 0.9;
  const nodeSize = opts.nodeSize !== undefined ? opts.nodeSize : 0.3;
  const plane = opts.plane === 'xy' ? 'xy' : 'xz';
  const baseColorA = new THREE.Color(opts.colorA !== undefined ? opts.colorA : 0x3fd0ff);
  const baseColorB = new THREE.Color(opts.colorB !== undefined ? opts.colorB : 0xa855f7);
  const lineColor = opts.lineColor !== undefined ? opts.lineColor : 0x2b93b8;
  const phaseSeed = opts.seed !== undefined ? opts.seed : 3.7;

  const group = new THREE.Group();
  group.name = opts.name || 'tensorMatrixGroup';

  const nodePositions = [];
  const dummy = new THREE.Object3D();
  const nodeGeo = new THREE.BoxGeometry(nodeSize, nodeSize, nodeSize);
  const nodeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, cols * rows);

  const phases = new Float32Array(cols * rows);
  const palette = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const px = (c - (cols - 1) / 2) * spacingX;
      const py = plane === 'xy' ? (r - (rows - 1) / 2) * spacingZ : 0;
      const pz = plane === 'xz' ? (r - (rows - 1) / 2) * spacingZ : 0;
      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      nodes.setMatrixAt(i, dummy.matrix);
      nodePositions.push(new THREE.Vector3(px, py, pz));

      const mix = (c / Math.max(cols - 1, 1)) * 0.55 + (r / Math.max(rows - 1, 1)) * 0.2;
      const col = baseColorA.clone().lerp(baseColorB, clamp01(mix));
      palette.push(col.clone());
      nodes.setColorAt(i, col);
      phases[i] = (Math.sin((c + 1) * 12.9898 + (r + 1) * 78.233 + phaseSeed) * 43758.5453) % 1;
      if (phases[i] < 0) phases[i] += 1;
    }
  }
  nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if (nodes.instanceColor) nodes.instanceColor.setUsage(THREE.DynamicDrawUsage);
  nodes.frustumCulled = false;
  group.add(nodes);

  // Lattice connections.
  const linePoints = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (c < cols - 1) linePoints.push(nodePositions[i], nodePositions[i + 1]);
      if (r < rows - 1) linePoints.push(nodePositions[i], nodePositions[i + cols]);
    }
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const lineMat = new THREE.LineBasicMaterial({
    color: lineColor,
    transparent: true,
    opacity: opts.lineOpacity !== undefined ? opts.lineOpacity : 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.frustumCulled = false;
  group.add(lines);

  // Data packets: a handful of glowing octahedra running along lattice edges.
  const packetEdges = [];
  const packetCount = opts.packets !== undefined ? opts.packets : 7;
  for (let i = 0; i < packetCount; i++) {
    const edge = Math.floor(((i * 37) % (linePoints.length / 2)) / 2) * 2;
    packetEdges.push(edge);
  }
  const packetMat = new THREE.MeshBasicMaterial({
    color: opts.packetColor !== undefined ? opts.packetColor : 0x9df3ff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const packetGeo = new THREE.OctahedronGeometry(nodeSize * 0.78, 0);
  const packets = [];
  for (let i = 0; i < packetCount; i++) {
    const mesh = new THREE.Mesh(packetGeo, packetMat);
    mesh.frustumCulled = false;
    group.add(mesh);
    packets.push({ mesh, edge: packetEdges[i], offset: (i / packetCount) * 1.0 + 0.13 });
  }

  const phasesBase = phases;
  const scratch = new THREE.Color();
  let lastReveal = -1;

  const tick = (state) => {
    const reveal = state.reveal !== undefined ? state.reveal : 1;
    if (reveal <= 0.001) {
      if (group.visible) group.visible = false;
      return;
    }
    group.visible = true;

    const load = state.aiLoad;
    const t = state.time;
    const nodeOpacity = reveal;
    if (lastReveal !== reveal) {
      nodeMat.opacity = nodeOpacity;
      lineMat.opacity = (opts.lineOpacity !== undefined ? opts.lineOpacity : 0.22) * reveal;
      packetMat.opacity = 0.95 * reveal;
      lastReveal = reveal;
    }

    const speed = 0.7 + load * 3.4;
    for (let i = 0; i < phasesBase.length; i++) {
      const pulse = 0.5 + 0.5 * Math.sin(t * speed + phasesBase[i] * TAU);
      const intensity = 0.3 + Math.pow(pulse, 1.7) * (0.55 + load * 0.9);
      scratch.copy(palette[i]).multiplyScalar(intensity);
      nodes.setColorAt(i, scratch);
    }
    if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;

    lineMat.opacity = (opts.lineOpacity !== undefined ? opts.lineOpacity : 0.22) * reveal * (0.6 + load * 0.9);

    const travel = (t * (0.18 + load * 0.5)) % 1;
    for (const p of packets) {
      const a = linePoints[p.edge];
      const b = linePoints[p.edge + 1];
      if (!a || !b) continue;
      const f = (travel + p.offset) % 1;
      p.mesh.position.lerpVectors(a, b, f);
      const fade = Math.sin(Math.PI * f);
      p.mesh.scale.setScalar(0.55 + fade * (0.7 + load * 0.8));
    }
  };

  return { group, nodes, lines, packets, tick, nodePositions };
}

/* ========================================================================== */
/*  Motherboard                                                               */
/* ========================================================================== */

function buildMotherboard(ctx) {
  const { mats, rand, quality } = ctx;
  const group = new THREE.Group();
  group.name = 'motherboardGroup';

  const W = BOARD.width;
  const H = BOARD.height;
  const F = BOARD.front;

  /* --- PCB stack: three visible layers so the board reads as multi-layer --- */
  box(group, W, H, 0.05, mats.pcbEdge, 0, 0, -0.075, { soft: true, radius: 0.5, bevel: 0.03 });
  box(group, W - 0.1, H - 0.1, 0.05, mats.pcbInner, 0, 0, -0.02, { soft: true, radius: 0.5, bevel: 0.03 });
  box(group, W - 0.18, H - 0.18, 0.08, mats.pcb, 0, 0, 0.06, { soft: true, radius: 0.55, bevel: 0.04 });

  // Copper power plane peeking out at the board edge.
  box(group, W - 0.06, 0.16, 0.06, mats.copper, 0, -H / 2 + 0.09, -0.02);
  box(group, 0.16, H - 0.1, 0.06, mats.copper, W / 2 - 0.08, 0, -0.02);

  /* --- traces + vias ------------------------------------------------------ */
  const traceZ = F + 0.004;
  const traces = new THREE.LineSegments(
    buildTraceLines(rand, quality.traceCount, W, H, traceZ),
    mats.traceGold
  );
  group.add(traces);
  const innerTraces = new THREE.LineSegments(
    buildTraceLines(rand, Math.round(quality.traceCount * 0.45), W, H, F - 0.02),
    mats.traceTeal
  );
  group.add(innerTraces);

  const viaGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.03, 8);
  const vias = new THREE.InstancedMesh(viaGeo, mats.gold, Math.round(quality.traceCount * 1.1));
  const viaDummy = new THREE.Object3D();
  for (let i = 0; i < vias.count; i++) {
    viaDummy.position.set((rand() - 0.5) * (W - 3), (rand() - 0.5) * (H - 2.6), F + 0.006);
    viaDummy.rotation.x = Math.PI / 2;
    viaDummy.updateMatrix();
    vias.setMatrixAt(i, viaDummy.matrix);
  }
  group.add(vias);

  /* --- silkscreen outlines ----------------------------------------------- */
  outlineRect(group, 6.6, 6.6, mats.silk, CPU_SOCKET.x, CPU_SOCKET.y, F + 0.006);
  outlineRect(group, 18.2, 1.6, mats.silk, PCIE_SLOT.x, PCIE_SLOT.y, F + 0.006);
  outlineRect(group, 9.0, 5.4, mats.silk, 4.4, 1.0, F + 0.006);
  outlineRect(group, 12.6, 2.2, mats.silk, -7.2, 11.9, F + 0.006);
  outlineRect(group, 6.0, 6.0, mats.silk, 11.2, -9.4, F + 0.006);
  outlineRect(group, 2.4, 7.0, mats.silk, 15.2, 7.6, F + 0.006);

  /* --- VRM heatsinks ------------------------------------------------------ */
  const vrmTop = box(group, 12.4, 1.9, 1.7, mats.aluDark, -7.2, 11.9, 0.95, {
    soft: true,
    radius: 0.2,
    bevel: 0.06,
  });
  const vrmLeft = box(group, 1.8, 10.2, 1.7, mats.aluDark, -13.1, 4.6, 0.95, {
    soft: true,
    radius: 0.2,
    bevel: 0.06,
  });

  // Fins on the VRM blocks (instanced, thin vertical plates).
  const vrmFinGeo = new THREE.BoxGeometry(0.17, 1.55, 1.55);
  const vrmFins = new THREE.InstancedMesh(vrmFinGeo, mats.alu, quality.vrmFins);
  const vrmDummy = new THREE.Object3D();
  for (let i = 0; i < vrmFins.count; i++) {
    const f = i / (vrmFins.count - 1);
    vrmDummy.position.set(lerp(-13.0, -1.6, f), 11.9, 1.9);
    vrmDummy.updateMatrix();
    vrmFins.setMatrixAt(i, vrmDummy.matrix);
  }
  group.add(vrmFins);

  const vrmFinGeoLeft = new THREE.BoxGeometry(1.5, 0.17, 1.5);
  const vrmFinsLeft = new THREE.InstancedMesh(vrmFinGeoLeft, mats.alu, quality.vrmFins);
  for (let i = 0; i < vrmFinsLeft.count; i++) {
    const f = i / (vrmFinsLeft.count - 1);
    vrmDummy.position.set(-13.1, lerp(-0.3, 9.6, f), 1.9);
    vrmDummy.updateMatrix();
    vrmFinsLeft.setMatrixAt(i, vrmDummy.matrix);
  }
  group.add(vrmFinsLeft);

  // Copper heatpipe running through the VRM blocks.
  addTube(
    group,
    [
      new THREE.Vector3(-13.1, 9.4, 0.55),
      new THREE.Vector3(-10.4, 10.6, 0.55),
      new THREE.Vector3(-7.0, 10.9, 0.55),
      new THREE.Vector3(-3.2, 11.4, 0.55),
      new THREE.Vector3(-1.4, 11.9, 0.55),
    ],
    0.19,
    mats.copper,
    { segments: 40, radial: 8 }
  );

  // Thin emissive accent on the VRM.
  box(group, 10.4, 0.06, 0.05, mats.glowTeal, -7.4, 10.72, 2.02);

  /* --- I/O shroud --------------------------------------------------------- */
  const shroudShape = new THREE.Shape();
  shroudShape.moveTo(-3.7, -1.3);
  shroudShape.lineTo(2.6, -1.3);
  shroudShape.lineTo(3.7, -0.2);
  shroudShape.lineTo(3.7, 1.3);
  shroudShape.lineTo(-2.4, 1.3);
  shroudShape.lineTo(-3.7, 0.1);
  shroudShape.closePath();
  const shroudGeo = extrudeCentered(shroudShape, 3.0, {
    bevel: true,
    bevelSize: 0.07,
    bevelThickness: 0.07,
    bevelSegments: 2,
  });
  const ioShroud = new THREE.Mesh(shroudGeo, mats.anodized);
  ioShroud.position.set(-13.1, 11.7, 1.55);
  group.add(ioShroud);

  // Angular accent plate + light slit + etched lines.
  box(group, 4.2, 0.72, 0.16, mats.gunmetal, -13.4, 11.7, 3.12, {
    soft: true,
    radius: 0.12,
    bevel: 0.03,
  });
  box(group, 3.2, 0.1, 0.06, mats.glowTeal, -13.6, 11.72, 3.22);
  box(group, 0.09, 2.0, 0.06, mats.glowAmber, -11.6, 11.6, 3.2);
  for (let i = 0; i < 4; i++) {
    box(group, 1.6, 0.05, 0.05, mats.plasticLight, -14.0 + i * 0.5, 10.75 + i * 0.3, 3.14);
  }

  /* --- Chipset heatsink --------------------------------------------------- */
  const chipset = box(group, 5.0, 5.0, 1.15, mats.aluDark, 11.2, -9.4, 0.72, {
    soft: true,
    radius: 0.55,
    bevel: 0.07,
  });
  const chipFins = new THREE.InstancedMesh(
    new THREE.BoxGeometry(4.4, 0.16, 0.8),
    mats.alu,
    7
  );
  for (let i = 0; i < chipFins.count; i++) {
    vrmDummy.position.set(11.2, -11.2 + i * 0.6, 1.34);
    vrmDummy.updateMatrix();
    chipFins.setMatrixAt(i, vrmDummy.matrix);
  }
  group.add(chipFins);
  const chipGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.86, 4),
    mats.glowTeal
  );
  chipGlow.position.set(11.2, -9.4, 1.32);
  chipGlow.rotation.z = Math.PI / 4;
  group.add(chipGlow);

  /* --- 24-pin ATX + 8-pin EPS connectors --------------------------------- */
  const atx = box(group, 1.75, 6.4, 1.5, mats.plastic, 15.0, 7.6, 0.83, {
    soft: true,
    radius: 0.12,
    bevel: 0.04,
  });
  const pinGeo = new THREE.BoxGeometry(0.42, 0.4, 0.12);
  const atxPins = new THREE.InstancedMesh(pinGeo, mats.gold, 24);
  let pinIndex = 0;
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 2; col++) {
      vrmDummy.position.set(14.62 + col * 0.75, 4.9 + row * 0.48, 1.59);
      vrmDummy.updateMatrix();
      atxPins.setMatrixAt(pinIndex++, vrmDummy.matrix);
    }
  }
  group.add(atxPins);
  box(group, 0.35, 5.6, 1.2, mats.plasticLight, 16.0, 7.6, 0.83);
  box(group, 1.9, 0.5, 1.6, mats.plasticLight, 15.0, 10.9, 0.83);

  const eps = box(group, 4.6, 1.55, 1.5, mats.plastic, -6.2, 12.5, 0.83, {
    soft: true,
    radius: 0.12,
    bevel: 0.04,
  });
  const epsPins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.4, 0.12), mats.gold, 8);
  pinIndex = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      vrmDummy.position.set(-7.5 + col * 0.85, 12.15 + row * 0.68, 1.59);
      vrmDummy.updateMatrix();
      epsPins.setMatrixAt(pinIndex++, vrmDummy.matrix);
    }
  }
  group.add(epsPins);

  /* --- PCIe x16 armoured slot -------------------------------------------- */
  const slot = box(group, PCIE_SLOT.length, 0.9, 1.2, mats.plastic, PCIE_SLOT.x, PCIE_SLOT.y, 0.68);
  box(group, PCIE_SLOT.length + 0.6, 1.9, 0.22, mats.gunmetal, PCIE_SLOT.x, PCIE_SLOT.y, 0.18, {
    soft: true,
    radius: 0.1,
    bevel: 0.03,
  });
  box(group, PCIE_SLOT.length + 0.6, 0.32, 1.7, mats.aluDark, PCIE_SLOT.x, PCIE_SLOT.y + 1.06, 0.95);
  box(group, PCIE_SLOT.length + 0.6, 0.32, 1.7, mats.aluDark, PCIE_SLOT.x, PCIE_SLOT.y - 1.06, 0.95);
  box(group, PCIE_SLOT.length, 0.12, 0.16, mats.gold, PCIE_SLOT.x, PCIE_SLOT.y - 0.12, 1.26);
  box(group, 0.6, 0.5, 1.4, mats.plasticLight, PCIE_SLOT.x + PCIE_SLOT.length / 2 - 0.1, PCIE_SLOT.y + 0.9, 1.0);

  /* --- M.2 NVMe drives with finned heatsinks ----------------------------- */
  const buildM2 = (y, accent) => {
    const m2 = new THREE.Group();
    m2.position.set(-5.5, y, 0);
    group.add(m2);

    box(m2, 8.4, 2.3, 0.14, mats.substrate, 0, 0, 0.24);
    box(m2, 0.9, 2.0, 0.5, mats.gold, -4.2, 0, 0.4);
    box(m2, 1.0, 1.8, 0.55, mats.plastic, 4.1, 0, 0.4);
    // Controller + NAND packages.
    box(m2, 1.5, 1.4, 0.22, mats.plasticGloss, -1.2, 0.05, 0.42);
    box(m2, 1.3, 1.2, 0.2, mats.plasticGloss, 1.2, 0.05, 0.42);

    // Heatsink base + fins.
    box(m2, 8.0, 2.5, 0.32, mats.aluDark, -0.3, 0, 0.66, {
      soft: true,
      radius: 0.18,
      bevel: 0.05,
    });
    const fins = new THREE.InstancedMesh(
      new THREE.BoxGeometry(7.6, 0.14, 0.85),
      mats.alu,
      quality.m2HeatsinkFins
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < fins.count; i++) {
      dummy.position.set(-0.3, -1.0 + (i / (fins.count - 1)) * 2.0, 1.2);
      dummy.updateMatrix();
      fins.setMatrixAt(i, dummy.matrix);
    }
    m2.add(fins);
    box(m2, 6.6, 0.06, 0.06, accent, -0.4, 1.28, 0.86);
    return m2;
  };
  buildM2(0.15, mats.glowTeal);
  buildM2(-2.0, mats.glowViolet);

  /* --- CMOS battery, fan headers, capacitors, chokes ---------------------- */
  const battery = cyl(group, 1.02, 1.02, 0.32, mats.nickel, 12.3, 2.4, 0.3, {
    segments: 28,
    rx: Math.PI / 2,
  });
  cyl(group, 1.12, 1.12, 0.06, mats.plastic, 12.3, 2.4, 0.13, {
    segments: 28,
    rx: Math.PI / 2,
  });

  const headerPositions = [
    [-1.0, 8.9],
    [1.0, 8.9],
    [1.0, 6.9],
    [12.6, 6.0],
  ];
  for (const [hx, hy] of headerPositions) {
    box(group, 1.3, 0.55, 0.65, mats.plasticLight, hx, hy, 0.42);
    box(group, 0.9, 0.16, 0.1, mats.gold, hx, hy + 0.05, 0.72);
  }

  for (let i = 0; i < 5; i++) {
    cyl(group, 0.42, 0.42, 1.1, mats.ceramic, -14.6 + i * 1.0, -11.4, 0.62, {
      segments: 14,
      rx: Math.PI / 2,
    });
    cyl(group, 0.46, 0.46, 0.16, mats.aluDark, -14.6 + i * 1.0, -11.4, 1.12, {
      segments: 14,
      rx: Math.PI / 2,
    });
  }

  for (let i = 0; i < 4; i++) {
    box(group, 0.9, 0.9, 0.9, mats.aluDark, -11.6 + i * 1.1, 10.6, 1.0, {
      soft: true,
      radius: 0.12,
      bevel: 0.04,
    });
  }

  /* --- mounting holes ----------------------------------------------------- */
  const holePositions = [
    [-15.6, -11.6],
    [-15.6, 11.6],
    [15.6, 11.6],
    [15.6, -11.6],
    [0, -11.8],
    [0, 11.8],
    [-15.6, 0],
  ];
  for (const [hx, hy] of holePositions) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 8, 20), mats.gold);
    ring.position.set(hx, hy, F + 0.008);
    group.add(ring);
    cyl(group, 0.36, 0.36, 0.05, mats.rubber, hx, hy, F - 0.01, {
      segments: 16,
      rx: Math.PI / 2,
    });
  }

  /* --- RAM --------------------------------------------------------------- */
  const ramGroup = new THREE.Group();
  ramGroup.name = 'ramGroup';
  group.add(ramGroup);
  const ramModules = [];

  RAM_SLOTS.forEach((slotX, index) => {
    // Slot body + latches (fixed to the board).
    box(ramGroup, 0.86, 12.0, 0.85, mats.plastic, slotX, 4.6, 0.55, {
      soft: true,
      radius: 0.12,
      bevel: 0.03,
    });
    box(ramGroup, 0.94, 0.5, 0.95, mats.plasticLight, slotX, 10.75, 0.55);
    box(ramGroup, 0.94, 0.5, 0.95, mats.plasticLight, slotX, -1.55, 0.55);

    // Removable module.
    const module = new THREE.Group();
    module.position.set(slotX, 0, 0);
    ramGroup.add(module);

    const spreader = box(module, 1.5, 11.6, 2.7, mats.aluDark, 0, 4.4, 1.62, {
      soft: true,
      radius: 0.22,
      bevel: 0.07,
    });
    // Brushed metal ridge pattern.
    for (let r = 0; r < 3; r++) {
      box(module, 1.52, 0.06, 0.5, mats.alu, 0, 1.4 + r * 2.7, 2.9, {
        soft: false,
      });
    }
    // Air gap / PCB edge.
    box(module, 0.35, 11.2, 0.5, mats.substrate, 0, 4.4, 0.42);

    // Addressable RGB diffuser + light bar.
    box(module, 0.62, 11.0, 0.34, mats.plasticGloss, 0, 4.6, 3.16);
    const barMat = createRgbBarMaterial(ctx, {
      hue: 0.53 + index * 0.055,
      segments: 15,
      axis: 0,
    });
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 10.7), barMat);
    bar.position.set(0, 4.6, 3.36);
    module.add(bar);
    // Faint bloom behind the bar.
    const bloom = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 11.6), createGlowMaterial(0x69d9ff, {
      power: 2.2,
      strength: 0.35,
    }));
    bloom.position.set(0, 4.6, 3.3);
    module.add(bloom);

    // Small heat-spreader cap.
    box(module, 1.56, 0.34, 2.8, mats.alu, 0, 10.28, 1.62, {
      soft: true,
      radius: 0.1,
      bevel: 0.03,
    });

    registerMotion(ctx, module, 'ram', index);
    ramModules.push({ group: module, index, bar, bloom });
  });

  return { group, ramGroup, ramModules };
}

/* ========================================================================== */
/*  CPU package + silicon die                                                 */
/* ========================================================================== */

function buildCpu(ctx) {
  const { mats } = ctx;
  const group = new THREE.Group();
  group.name = 'cpuGroup';
  group.position.set(CPU_SOCKET.x, CPU_SOCKET.y, 0);

  const S = CPU_SOCKET;

  /* Socket frame ---------------------------------------------------------- */
  box(group, 5.6, 5.6, 0.55, mats.plastic, 0, 0, 0.38, { soft: true, radius: 0.35, bevel: 0.05 });
  box(group, 5.0, 5.0, 0.16, mats.plasticGloss, 0, 0, 0.72);

  // LGA pin field: a screen of gold points is far cheaper than 1,700 meshes.
  const pinCount = 30;
  const pinPositions = new Float32Array(pinCount * pinCount * 3);
  let pi = 0;
  for (let x = 0; x < pinCount; x++) {
    for (let y = 0; y < pinCount; y++) {
      pinPositions[pi++] = (x / (pinCount - 1) - 0.5) * 4.1;
      pinPositions[pi++] = (y / (pinCount - 1) - 0.5) * 4.1;
      pinPositions[pi++] = 0.82;
    }
  }
  const pinGeo = new THREE.BufferGeometry();
  pinGeo.setAttribute('position', new THREE.BufferAttribute(pinPositions, 3));
  const pins = new THREE.Points(
    pinGeo,
    new THREE.PointsMaterial({
      color: 0xc9a24a,
      size: 0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  pins.frustumCulled = false;
  group.add(pins);

  // Retention frame: four nickel arms with springs and screws.
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i / 4) * TAU + Math.PI / 4;
    group.add(arm);
    box(arm, 2.6, 0.42, 0.55, mats.nickel, 3.1, 0, 0.95);
    const spring = cyl(arm, 0.26, 0.26, 0.5, mats.darkChrome, 4.2, 0, 0.95, {
      segments: 10,
      rx: Math.PI / 2,
    });
    cyl(arm, 0.22, 0.22, 0.16, mats.chrome, 4.2, 0, 1.22, { segments: 10, rx: Math.PI / 2 });
  }

  /* Substrate (teal organic package) --------------------------------------- */
  box(group, 4.3, 4.3, 0.14, mats.substrate, 0, 0, 0.92, { soft: true, radius: 0.18, bevel: 0.02 });
  // Gold contact rows along two edges.
  for (let i = 0; i < 12; i++) {
    box(group, 0.1, 0.16, 0.04, mats.gold, -1.8 + i * 0.33, 2.02, 1.0);
    box(group, 0.1, 0.16, 0.04, mats.gold, -1.8 + i * 0.33, -2.02, 1.0);
  }

  /* Silicon die: chiplets + glowing core/cache micro-blocks ---------------- */
  box(group, 3.0, 3.0, 0.05, mats.plasticGloss, 0, 0, 1.02);
  const dieMat = createDieMaterial(ctx);
  const die = new THREE.Mesh(new THREE.PlaneGeometry(2.95, 2.95), dieMat);
  die.position.set(0, 0, 1.048);
  group.add(die);

  // Chiplet outlines (two CCDs + one IOD).
  const chipletFrames = [
    { w: 1.22, h: 1.66, x: -0.72, y: 0.32 },
    { w: 1.22, h: 1.66, x: 0.72, y: 0.32 },
    { w: 1.5, h: 1.1, x: 0.0, y: -0.86 },
  ];
  for (const f of chipletFrames) {
    const frame = outlineRect(group, f.w, f.h, mats.traceGold, f.x, f.y, 1.056);
    frame.material = mats.traceGold;
  }

  /* IHS: brushed nickel, chamfered --------------------------------------- */
  const ihsGroup = new THREE.Group();
  ihsGroup.name = 'cpuIhs';
  group.add(ihsGroup);
  const ihsMat = mats.nickel.clone();
  ihsMat.transparent = true;
  ihsMat.opacity = 1;
  const ihs = box(ihsGroup, 3.95, 3.95, 0.4, ihsMat, 0, 0, 1.26, {
    soft: true,
    radius: 0.42,
    bevel: 0.09,
    curveSegments: 4,
  });
  // Raised centre pad and etched markings.
  box(ihsGroup, 3.2, 3.2, 0.07, ihsMat, 0, 0, 1.47, { soft: true, radius: 0.3, bevel: 0.02 });
  outlineRect(ihsGroup, 2.5, 2.5, mats.silk, 0, 0, 1.512);
  box(ihsGroup, 1.5, 0.045, 0.045, mats.darkChrome, 0, 0.62, 1.512);
  box(ihsGroup, 0.045, 1.1, 0.045, mats.darkChrome, 0.72, -0.1, 1.512);
  const ihsCore = ihsMat;

  // Package edge glow (visible once the IHS lifts).
  const edgeGlow = new THREE.Mesh(
    new THREE.RingGeometry(1.98, 2.12, 4, 1),
    mats.glowTeal
  );
  edgeGlow.position.set(0, 0, 1.08);
  edgeGlow.rotation.z = Math.PI / 4;
  group.add(edgeGlow);

  /* CPU tensor lattice, hidden inside the die ----------------------------- */
  const cpuTensor = buildTensorLattice(ctx, {
    cols: 8,
    rows: 6,
    spacingX: 0.34,
    spacingZ: 0.34,
    nodeSize: 0.075,
    plane: 'xy',
    colorA: 0x35d6ff,
    colorB: 0xffb15c,
    lineColor: 0x2b8fb0,
    lineOpacity: 0.3,
    packets: 5,
    packetColor: 0xa8f4ff,
    seed: 11.3,
    name: 'cpuTensorMatrix',
  });
  cpuTensor.group.position.set(0, 0, 1.085);
  cpuTensor.group.renderOrder = 3;
  group.add(cpuTensor.group);

  registerMotion(ctx, ihsGroup, 'ihs', 0);

  ctx.refs.dieMaterial = dieMat;
  ctx.refs.ihsMaterial = ihsCore;
  ctx.refs.cpuTensor = cpuTensor;
  ctx.refs.cpuGroup = group;

  return { group, ihsGroup, ihs, die, dieMat, cpuTensor };
}

/* ========================================================================== */
/*  Twin-tower air cooler                                                     */
/* ========================================================================== */

function buildAirCooler(ctx) {
  const { quality } = ctx;

  /* Dedicated shell materials: the CPU zoom fades the heatsink into an X-ray
     ghost, and that must never touch the GPU / chassis metals. */
  const baseMats = ctx.mats;
  const coolerMats = {
    alu: baseMats.alu.clone(),
    aluDark: baseMats.aluDark.clone(),
    plastic: baseMats.plastic.clone(),
    plasticGloss: baseMats.plasticGloss.clone(),
    gunmetal: baseMats.gunmetal.clone(),
    nickel: baseMats.nickel.clone(),
    copper: baseMats.copper.clone(),
    copperPolished: baseMats.copperPolished.clone(),
  };
  for (const material of Object.values(coolerMats)) {
    material.transparent = true;
    material.opacity = 1;
    material.depthWrite = true;
  }
  const mats = { ...baseMats, ...coolerMats };

  const group = new THREE.Group();
  group.name = 'coolerGroup';

  const A = AIR_COOLER;
  const cx = A.x;
  const cy = A.y;

  /* Coldplate + mounting hardware ---------------------------------------- */
  box(group, 4.9, 4.9, 0.5, mats.copperPolished, cx, cy, 1.78, {
    soft: true,
    radius: 0.3,
    bevel: 0.05,
  });
  box(group, 5.1, 5.1, 0.12, mats.nickel, cx, cy, 1.56, { soft: true, radius: 0.3, bevel: 0.03 });
  // Micro-fin channels on the coldplate face (visible when exploded).
  for (let i = 0; i < 7; i++) {
    box(group, 0.1, 3.9, 0.12, mats.copper, cx - 1.92 + i * 0.64, cy, 2.0);
  }

  // Cross-bar mounting bracket with sprung screws.
  for (const by of [cy - 2.6, cy + 2.6]) {
    box(group, 4.6, 0.34, 0.4, mats.nickel, cx, by, 1.86);
    for (const bx of [cx - 1.9, cx + 1.9]) {
      cyl(group, 0.2, 0.2, 0.55, mats.darkChrome, bx, by, 2.1, { segments: 10, rx: Math.PI / 2 });
      cyl(group, 0.34, 0.34, 0.14, mats.chrome, bx, by, 2.4, { segments: 12, rx: Math.PI / 2 });
    }
  }

  /* Six copper heatpipes -------------------------------------------------- */
  const towerXs = [A.towerLeftX, A.towerRightX];
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? 0 : 1;
    const tx = towerXs[side];
    const step = i % 3;
    const startX = cx + (side === 0 ? -0.9 : 0.9) + (step - 1) * 0.5;
    const startY = cy + (step - 1) * 0.75;
    const points = [
      new THREE.Vector3(startX, startY, 2.02),
      new THREE.Vector3(lerp(startX, tx, 0.35), startY + 0.2, 2.55),
      new THREE.Vector3(lerp(startX, tx, 0.78), cy + (step - 1) * 1.1, 3.2),
      new THREE.Vector3(tx + (step - 1) * 0.55, cy + (step - 1) * 1.35, 3.7),
      new THREE.Vector3(tx + (step - 1) * 0.55, cy + 4.6, 3.95),
      new THREE.Vector3(tx + (step - 1) * 0.55, cy + 6.0, 4.2),
    ];
    addTube(group, points, 0.22, mats.copper, { segments: 46, radial: 8 });
  }

  /* Twin fin towers (instanced fins) ------------------------------------- */
  const towerGeo = new THREE.BoxGeometry(A.towerWidth, 0.085, A.towerDepth);
  const finCount = quality.finsPerTower;
  const fins = new THREE.InstancedMesh(towerGeo, mats.alu, finCount * 2);
  const dummy = new THREE.Object3D();
  let fi = 0;
  const towerBottom = cy - 5.2;
  const towerTop = cy + 6.8;
  for (const tx of towerXs) {
    for (let i = 0; i < finCount; i++) {
      const f = i / (finCount - 1);
      dummy.position.set(tx, lerp(towerBottom, towerTop, f), 5.6);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      fins.setMatrixAt(fi++, dummy.matrix);
    }
    // Top + bottom cap plates and side rails.
    box(group, A.towerWidth + 0.16, 0.42, A.towerDepth + 0.2, mats.aluDark, tx, towerTop + 0.28, 5.6, {
      soft: true,
      radius: 0.12,
      bevel: 0.04,
    });
    box(group, A.towerWidth + 0.16, 0.36, A.towerDepth + 0.2, mats.aluDark, tx, towerBottom - 0.24, 5.6, {
      soft: true,
      radius: 0.12,
      bevel: 0.04,
    });
    for (const sx of [-1, 1]) {
      box(group, 0.22, 11.9, 0.26, mats.aluDark, tx + sx * (A.towerWidth / 2 + 0.08), cy + 0.8, 8.72);
      box(group, 0.22, 11.9, 0.26, mats.aluDark, tx + sx * (A.towerWidth / 2 + 0.08), cy + 0.8, 2.48);
    }
    // Copper base plate at the bottom of each tower.
    box(group, A.towerWidth - 0.3, 0.3, A.towerDepth - 0.4, mats.copper, tx, towerBottom - 0.45, 5.6);
  }
  group.add(fins);

  // Bridge between the two towers + top cover.
  box(group, 8.2, 0.5, 2.2, mats.aluDark, (A.towerLeftX + A.towerRightX) / 2, towerTop + 0.62, 5.6, {
    soft: true,
    radius: 0.16,
    bevel: 0.05,
  });
  box(group, 6.4, 0.16, 0.16, mats.chrome, (A.towerLeftX + A.towerRightX) / 2, towerTop + 0.9, 5.6);

  // Brand plate with a light bar on top of the cooler.
  box(group, 4.6, 0.3, 2.6, mats.gunmetal, cx, towerTop + 1.0, 5.4, {
    soft: true,
    radius: 0.14,
    bevel: 0.04,
  });
  box(group, 3.4, 0.07, 0.12, mats.glowTeal, cx, towerTop + 1.16, 6.6);

  /* Two 120 mm PWM fans -------------------------------------------------- */
  const fanY = cy + 0.6;
  const fanZ = A.fanZ;
  const coolerFans = [];
  towerXs.forEach((tx, i) => {
    const fan = addFan(ctx, group, {
      x: tx,
      y: fanY,
      z: fanZ,
      size: 12,
      thickness: 2.0,
      blades: 9,
      materialFrame: mats.plastic,
      materialRotor: mats.plasticGloss,
      haloColor: 0x63e6ff,
      haloOpacity: 0.42,
      hubGlow: 0.5,
      speed: 1.0,
      phase: i * 0.9,
      pitch: 0.62,
    });
    coolerFans.push(fan);
    // PWM cable dropping to the motherboard header.
    const cableStart = new THREE.Vector3(tx + 4.6, fanY - 5.0, fanZ + 0.4);
    addTube(
      group,
      [
        cableStart,
        new THREE.Vector3(tx + 5.2, fanY - 6.2, fanZ - 0.6),
        new THREE.Vector3(tx + 5.4, fanY - 8.0, fanZ - 3.0),
        new THREE.Vector3(cx + 2.4, cy - 3.6, 2.6),
        new THREE.Vector3(0.6, 8.9, 1.2),
      ],
      0.1,
      mats.braid,
      { segments: 40, radial: 6 }
    );
  });

  registerMotion(ctx, group, 'cooler', 0);

  ctx.refs.coolerMaterials = Object.values(coolerMats);
  ctx.refs.coolerGroup = group;

  return { group, fans: coolerFans };
}
/* ========================================================================== */
/*  Flagship GPU                                                              */
/* ========================================================================== */

function buildGpu(ctx) {
  const { mats } = ctx;
  const group = new THREE.Group();
  group.name = 'gpuGroup';

  const B = GPU_BODY;
  const width = B.x1 - B.x0; // 24
  const height = B.y1 - B.y0; // 7.8
  const depth = B.z1 - B.z0; // 6
  const centerX = (B.x0 + B.x1) / 2;
  const centerY = (B.y0 + B.y1) / 2;
  const centerZ = (B.z0 + B.z1) / 2;

  /* Shroud silhouette (extruded side profile) ----------------------------- */
  const hw = width / 2;
  const hh = height / 2;
  const silhouette = new THREE.Shape();
  silhouette.moveTo(-hw + 0.9, -hh);
  silhouette.lineTo(hw - 1.0, -hh);
  silhouette.lineTo(hw, -hh + 1.0);
  silhouette.lineTo(hw, hh - 0.9);
  silhouette.lineTo(hw - 0.9, hh);
  silhouette.lineTo(-hw + 1.1, hh);
  silhouette.lineTo(-hw, hh - 1.1);
  silhouette.lineTo(-hw, -hh + 0.9);
  silhouette.closePath();

  const shroudGeo = extrudeCentered(silhouette, depth, {
    bevel: true,
    bevelSize: 0.09,
    bevelThickness: 0.09,
    bevelSegments: 2,
  });
  const shroud = new THREE.Mesh(shroudGeo, mats.gunmetal);
  shroud.position.set(centerX, centerY, centerZ);
  group.add(shroud);

  /* Backplate + top plate with a vented window --------------------------- */
  const backplate = box(group, width - 0.3, height - 0.4, 0.26, mats.aluDark, centerX, centerY, B.z0 + 0.06, {
    soft: true,
    radius: 0.4,
    bevel: 0.05,
  });
  // Backplate vents.
  const ventGeo = new THREE.BoxGeometry(1.1, 0.16, 0.12);
  const vents = new THREE.InstancedMesh(ventGeo, mats.plastic, 14);
  const ventDummy = new THREE.Object3D();
  for (let i = 0; i < vents.count; i++) {
    ventDummy.position.set(-14.4 + i * 1.6, -12.6, B.z0 - 0.06);
    ventDummy.updateMatrix();
    vents.setMatrixAt(i, ventDummy.matrix);
  }
  group.add(vents);
  box(group, 3.6, 0.9, 0.1, mats.gunmetal, centerX + 6.2, -7.4, B.z0 - 0.12, {
    soft: true,
    radius: 0.1,
    bevel: 0.02,
  });

  // Top plate: two pieces leaving a window over the copper fin stack.
  box(group, 3.0, 0.24, depth - 0.4, mats.aluDark, B.x0 + 1.6, B.y1 + 0.02, centerZ, {
    soft: true,
    radius: 0.15,
    bevel: 0.03,
  });
  box(group, 7.2, 0.24, depth - 0.4, mats.aluDark, B.x1 - 3.6, B.y1 + 0.02, centerZ, {
    soft: true,
    radius: 0.15,
    bevel: 0.03,
  });
  box(group, 1.0, 0.3, depth - 0.2, mats.chrome, B.x0 + 3.2, B.y1 + 0.04, centerZ);
  box(group, 1.0, 0.3, depth - 0.2, mats.chrome, B.x1 - 7.2, B.y1 + 0.04, centerZ);

  // Copper fin stack inside the window + heatpipes running along it.
  const gpuFinGeo = new THREE.BoxGeometry(0.07, 1.25, depth - 1.2);
  const gpuFins = new THREE.InstancedMesh(gpuFinGeo, mats.copper, 26);
  for (let i = 0; i < gpuFins.count; i++) {
    ventDummy.position.set(B.x0 + 4.0 + i * 0.66, B.y1 - 0.72, centerZ);
    ventDummy.updateMatrix();
    gpuFins.setMatrixAt(i, ventDummy.matrix);
  }
  group.add(gpuFins);
  for (let i = 0; i < 4; i++) {
    addTube(
      group,
      [
        new THREE.Vector3(B.x0 + 3.0, B.y1 - 0.32, B.z0 + 1.4 + i * 1.05),
        new THREE.Vector3(centerX - 2.0, B.y1 - 0.28, B.z0 + 1.4 + i * 1.05),
        new THREE.Vector3(B.x1 - 6.6, B.y1 - 0.3, B.z0 + 1.4 + i * 1.05),
      ],
      0.14,
      mats.copperPolished,
      { segments: 24, radial: 7 }
    );
  }

  // Glowing status bar on the top edge.
  box(group, 17.4, 0.09, 0.22, mats.glowCoral, centerX - 1.4, B.y1 + 0.19, B.z1 - 0.7);
  const statusGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(19.0, 1.2),
    createGlowMaterial(0xff8a9c, { power: 2.0, strength: 0.32 })
  );
  statusGlow.rotation.x = -Math.PI / 2;
  statusGlow.position.set(centerX - 1.4, B.y1 + 0.2, B.z1 - 0.7);
  group.add(statusGlow);

  /* Three axial fans ------------------------------------------------------ */
  const fanXs = [-12.0, -4.0, 4.0];
  const gpuFans = [];
  fanXs.forEach((fx, i) => {
    // Dark recess + trim ring.
    const recess = new THREE.Mesh(
      new THREE.CircleGeometry(3.62, 40),
      mats.plasticGloss
    );
    recess.position.set(fx, B.fanY, B.z1 + 0.005);
    group.add(recess);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.1, 8, 48), mats.chrome);
    ring.position.set(fx, B.fanY, B.z1 + 0.06);
    group.add(ring);

    const fan = addFan(ctx, group, {
      x: fx,
      y: B.fanY,
      z: B.z1 + 0.05,
      size: 7.4,
      thickness: 1.25,
      blades: 9,
      frame: false,
      tipFactor: 0.86,
      hubFactor: 0.33,
      materialRotor: mats.plasticGloss,
      haloColor: 0x7fd8ff,
      haloOpacity: 0.4,
      hubGlow: 0.55,
      speed: 1.12 + i * 0.03,
      phase: i * 0.6,
      pitch: 0.66,
    });
    gpuFans.push(fan);
  });

  // Shroud accents: chrome edge strips, an emissive underline, screws.
  box(group, 0.34, height - 2.2, 0.16, mats.chrome, B.x0 + 0.5, centerY, B.z1 + 0.02);
  box(group, 0.34, height - 2.2, 0.16, mats.chrome, B.x1 - 0.5, centerY, B.z1 + 0.02);
  box(group, width - 4.0, 0.075, 0.08, mats.glowTeal, centerX, B.y0 + 0.55, B.z1 + 0.04);
  box(group, 5.2, 0.06, 0.06, mats.glowViolet, centerX + 5.6, B.y1 - 0.5, B.z1 + 0.04);
  for (let i = 0; i < 4; i++) {
    const sx = B.x0 + 2.2 + i * 6.4;
    cyl(group, 0.22, 0.22, 0.12, mats.darkChrome, sx, B.y1 - 0.55, B.z1 + 0.06, {
      segments: 10,
      rx: Math.PI / 2,
    });
  }

  /* Rear I/O bracket + display outputs ----------------------------------- */
  box(group, 0.25, height + 0.6, 2.8, mats.alu, B.x0 - 0.55, centerY, B.z0 + 1.5, {
    soft: true,
    radius: 0.08,
    bevel: 0.03,
  });
  for (let i = 0; i < 4; i++) {
    box(group, 0.18, 0.75, 1.65, mats.rubber, B.x0 - 0.7, centerY + 1.5 - i * 1.05, B.z0 + 1.6);
  }
  // 16-pin 12VHPWR header on the top edge.
  box(group, 2.7, 1.25, 2.1, mats.plastic, centerX + 9.6, B.y1 + 0.72, B.z1 - 1.5, {
    soft: true,
    radius: 0.12,
    bevel: 0.03,
  });
  const gpuPins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.16, 0.08), mats.gold, 16);
  for (let i = 0; i < 16; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    ventDummy.position.set(centerX + 8.5 + col * 0.28, B.y1 + 0.5 + row * 0.42, B.z1 - 0.44);
    ventDummy.updateMatrix();
    gpuPins.setMatrixAt(i, ventDummy.matrix);
  }
  group.add(gpuPins);
  box(group, 2.9, 0.16, 2.2, mats.chrome, centerX + 9.6, B.y1 + 1.36, B.z1 - 1.5);

  /* Tensor-Core / AI compute matrix above the card ------------------------ */
  const tensor = buildTensorLattice(ctx, {
    cols: 11,
    rows: 4,
    spacingX: 2.0,
    spacingZ: 1.25,
    nodeSize: 0.21,
    plane: 'xy',
    colorA: 0x45d6ff,
    colorB: 0xb07cff,
    lineColor: 0x2f8fb8,
    lineOpacity: 0.3,
    packets: 8,
    packetColor: 0x7fe6ff,
    seed: 5.1,
    name: 'gpuTensorMatrix',
  });
  tensor.group.position.set(centerX, B.y1 + 3.6, centerZ + 2.4);
  tensor.group.rotation.x = -0.22;
  group.add(tensor.group);

  // Vertical compute columns dropping from the lattice to the backplate.
  for (let i = 0; i < 5; i++) {
    const cx2 = B.x0 + 4.5 + i * 4.4;
    addTube(
      group,
      [
        new THREE.Vector3(cx2, B.y1 + 0.2, centerZ - 0.6),
        new THREE.Vector3(cx2, B.y1 + 1.4, centerZ - 0.5),
        new THREE.Vector3(cx2, B.y1 + 2.2, centerZ - 0.4),
      ],
      0.035,
      mats.glowTeal,
      { segments: 6, radial: 5 }
    );
  }
  const tensorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 7.2),
    createGlowMaterial(0x3fd0ff, { power: 2.6, strength: 0.16 })
  );
  tensorGlow.rotation.x = -Math.PI / 2;
  tensorGlow.position.set(centerX, B.y1 + 0.22, centerZ);
  group.add(tensorGlow);

  ctx.refs.gpuTensor = tensor;
  ctx.refs.gpuGroup = group;

  registerMotion(ctx, group, 'gpu', 0);
  registerMotion(ctx, tensor.group, 'tensor', 0);

  return { group, fans: gpuFans, tensor };
}

/* ========================================================================== */
/*  Chassis, glass accents, PSU shroud and braided cables                     */
/* ========================================================================== */

function buildChassis(ctx) {
  const { mats } = ctx;
  const group = new THREE.Group();
  group.name = 'chassisGroup';

  const C = CHASSIS;
  const railHeight = 58;
  const railY = -0.4;
  const frontZ = 21.2;
  const backZ = -11.8;

  /* Four vertical aluminium rails ---------------------------------------- */
  const railXs = [-C.halfWidth + 0.8, C.halfWidth - 0.8];
  for (const rx of railXs) {
    for (const rz of [frontZ, backZ]) {
      box(group, 2.5, railHeight, 2.5, mats.aluDark, rx, railY, rz, {
        soft: true,
        radius: 0.42,
        bevel: 0.12,
      });
      // Brushed highlight strips + shadow groove.
      box(group, 0.34, railHeight - 0.6, 0.08, mats.alu, rx - 0.9, railY, rz + 1.27);
      box(group, 0.08, railHeight - 0.6, 0.34, mats.alu, rx + 1.27, railY, rz + 0.9);
      box(group, 0.5, railHeight - 1.2, 0.5, mats.plastic, rx, railY, rz - 1.02);
    }
    // Horizontal side rails (top + bottom).
    box(group, 2.5, 2.2, frontZ - backZ + 2.5, mats.aluDark, rx, 28.6, (frontZ + backZ) / 2, {
      soft: true,
      radius: 0.4,
      bevel: 0.1,
    });
    box(group, 2.5, 2.2, frontZ - backZ + 2.5, mats.aluDark, rx, -29.2, (frontZ + backZ) / 2, {
      soft: true,
      radius: 0.4,
      bevel: 0.1,
    });
    box(group, 0.28, 0.12, frontZ - backZ - 1.0, mats.alu, rx + 1.3, 28.55, (frontZ + backZ) / 2);
  }

  /* Back panel + motherboard tray ---------------------------------------- */
  box(group, 50.4, 55.6, 0.5, mats.carbon, 0, -0.4, -12.6, {
    soft: true,
    radius: 0.5,
    bevel: 0.08,
  });
  // Cable grommets.
  for (const [gx, gy] of [
    [18.0, 6.0],
    [18.0, -6.0],
    [-17.0, 2.0],
    [-1.0, -14.0],
  ]) {
    box(group, 4.6, 7.0, 0.55, mats.rubber, gx, gy, -12.15, {
      soft: true,
      radius: 1.7,
      bevel: 0.12,
    });
    box(group, 3.6, 5.8, 0.35, mats.plastic, gx, gy, -12.2, {
      soft: true,
      radius: 1.3,
      bevel: 0.08,
    });
  }
  // CPU backplate cut-out frame.
  box(group, 9.6, 9.6, 0.5, mats.aluDark, CPU_SOCKET.x, CPU_SOCKET.y, -12.25, {
    soft: true,
    radius: 1.2,
    bevel: 0.1,
  });
  box(group, 8.2, 8.2, 0.42, mats.plastic, CPU_SOCKET.x, CPU_SOCKET.y, -12.15, {
    soft: true,
    radius: 0.5,
    bevel: 0.06,
  });

  // Tray between board and back panel.
  box(group, 39.4, 31.4, 0.45, mats.carbonPlate, 0, 0.4, -2.45, {
    soft: true,
    radius: 0.5,
    bevel: 0.08,
  });
  // Tray cut-outs behind the board.
  for (const [tx, ty, tw, th] of [
    [16.5, 0.5, 5.2, 15.0],
    [-16.5, 6.0, 4.2, 12.0],
    [0.5, -12.5, 10.0, 4.2],
  ]) {
    box(group, tw, th, 0.5, mats.plastic, tx, ty, -2.38, {
      soft: true,
      radius: 1.0,
      bevel: 0.08,
    });
  }

  // Nine brass standoffs between tray and board.
  const standoffXs = [-15.6, 0, 15.6];
  const standoffYs = [-11.6, 0, 11.8];
  for (const sx of standoffXs) {
    for (const sy of standoffYs) {
      cyl(group, 0.55, 0.55, 2.2, mats.gold, sx, sy, -1.15, { segments: 12, rx: Math.PI / 2 });
      cyl(group, 0.72, 0.72, 0.24, mats.gold, sx, sy, -0.25, { segments: 12, rx: Math.PI / 2 });
    }
  }

  /* Tempered-glass edge accents ------------------------------------------ */
  const glassStrips = [
    { w: 0.16, h: 50.0, d: 3.4, x: 26.1, y: 0, z: 22.9 },
    { w: 0.16, h: 50.0, d: 3.4, x: -26.1, y: 0, z: 22.9 },
    { w: 52.0, h: 0.16, d: 3.4, x: 0, y: 28.75, z: 22.9 },
  ];
  for (const g of glassStrips) {
    box(group, g.w, g.h, g.d, mats.glass, g.x, g.y, g.z);
    // Bright polished edge so the glass reads without transmission.
    box(group, g.w * 0.35 + 0.05, g.h, g.d * 0.06 + 0.03, mats.glassEdge, g.x, g.y, g.z + g.d / 2);  }
  // A single darker glass fin behind the right rail for depth.
  box(group, 0.14, 46, 2.2, mats.glass, 26.35, 1.0, 10.0);

  /* PSU shroud ------------------------------------------------------------ */
  const psuGroup = new THREE.Group();
  psuGroup.name = 'psuGroup';
  group.add(psuGroup);

  box(psuGroup, 50.8, 8.6, 29.6, mats.carbon, 0, -25.0, 5.2, {
    soft: true,
    radius: 0.8,
    bevel: 0.16,
  });
  box(psuGroup, 51.4, 0.45, 30.2, mats.carbonTop, 0, -20.6, 5.2, {
    soft: true,
    radius: 0.5,
    bevel: 0.08,
  });
  box(psuGroup, 44.0, 6.6, 0.5, mats.anodized, 0, -25.2, 20.0, {
    soft: true,
    radius: 0.6,
    bevel: 0.1,
  });
  // Vent slots along the shroud face.
  const slotGeo = new THREE.BoxGeometry(1.5, 3.6, 0.2);
  const slots = new THREE.InstancedMesh(slotGeo, mats.plastic, 16);
  const slotDummy = new THREE.Object3D();
  for (let i = 0; i < slots.count; i++) {
    slotDummy.position.set(-19.0 + i * 2.35, -25.2, 20.28);
    slotDummy.updateMatrix();
    slots.setMatrixAt(i, slotDummy.matrix);
  }
  psuGroup.add(slots);
  box(psuGroup, 10.4, 0.16, 0.22, mats.glowTeal, -12.0, -22.0, 20.32);
  box(psuGroup, 44.0, 0.1, 0.24, mats.chrome, 0, -21.0, 20.3);
  // Window with the PSU visible inside.
  box(psuGroup, 17.0, 6.2, 0.45, mats.rubber, 12.0, -25.2, 20.15, {
    soft: true,
    radius: 0.9,
    bevel: 0.08,
  });
  box(psuGroup, 16.2, 5.5, 0.34, mats.plastic, 12.0, -25.2, 20.22, {
    soft: true,
    radius: 0.7,
    bevel: 0.06,
  });
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0 + i * 0.55, 0.06, 6, 32), mats.gunmetal);
    ring.position.set(12.0, -25.2, 20.4);
    psuGroup.add(ring);
  }
  box(psuGroup, 0.1, 0.1, 0.1, mats.glowAmber, 15.6, -23.6, 20.42);

  // Rubber feet.
  for (const fx of [-23.2, 23.2]) {
    for (const fz of [15.0, -9.0]) {
      cyl(psuGroup, 1.9, 2.1, 1.0, mats.rubber, fx, -30.0, fz, { segments: 18 });
      cyl(psuGroup, 1.6, 1.6, 0.12, mats.aluDark, fx, -29.45, fz, { segments: 18 });
    }
  }

  /* Braided cables: PSU → 24-pin, EPS, 12VHPWR --------------------------- */
  const buildCable = (points, radius) => {
    addTube(group, points, radius, mats.braid, { segments: 64, radial: 8 });
    // Velcro straps + a cable comb.
    const strapMat = mats.rubber;
    for (let i = 1; i < points.length - 1; i += 2) {
      cyl(group, radius * 1.18, radius * 1.18, 0.42, strapMat, points[i].x, points[i].y, points[i].z, {
        segments: 12,
      });
    }
  };

  buildCable(
    [
      new THREE.Vector3(18.0, -20.3, 7.0),
      new THREE.Vector3(19.4, -16.0, 8.0),
      new THREE.Vector3(18.6, -8.0, 6.8),
      new THREE.Vector3(17.2, 0.0, 4.6),
      new THREE.Vector3(15.8, 4.6, 3.0),
      new THREE.Vector3(15.1, 8.2, 1.9),
    ],
    0.85
  );
  buildCable(
    [
      new THREE.Vector3(-14.0, -20.3, 2.0),
      new THREE.Vector3(-16.4, -18.0, -2.4),
      new THREE.Vector3(-15.8, -6.0, -3.4),
      new THREE.Vector3(-13.6, 6.0, -3.0),
      new THREE.Vector3(-10.2, 11.2, -1.5),
      new THREE.Vector3(-7.6, 12.9, 0.8),
    ],
    0.7
  );
  buildCable(
    [
      new THREE.Vector3(6.0, -20.3, 12.0),
      new THREE.Vector3(8.6, -18.0, 13.2),
      new THREE.Vector3(9.2, -13.0, 12.2),
      new THREE.Vector3(7.4, -8.4, 10.4),
      new THREE.Vector3(5.8, -5.4, 7.6),
      new THREE.Vector3(5.2, -4.9, 6.0),
    ],
    0.72
  );

  return { group, psuGroup };
}

/* ========================================================================== */
/*  Custom liquid cooling loop                                                */
/* ========================================================================== */

function buildLiquidCooler(ctx) {
  const { mats, quality } = ctx;
  const group = new THREE.Group();
  group.name = 'liquidCoolerGroup';

  // Hose wall material: a soft, slightly frosty acrylic.
  mats.hose = new THREE.MeshPhysicalMaterial({
    color: 0xcfeefc,
    roughness: 0.12,
    metalness: 0.0,
    envMap: mats.envMap,
    envMapIntensity: 1.2,
    transparent: true,
    opacity: 0.24,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  /* ---- 360 mm radiator -------------------------------------------------- */
  const radiatorGroup = new THREE.Group();
  radiatorGroup.name = 'radiatorGroup';
  radiatorGroup.position.set(0, RADIATOR.y, RADIATOR.z);
  group.add(radiatorGroup);

  const coreW = RADIATOR.length - 0.4;
  const coreH = RADIATOR.thickness;
  const coreD = RADIATOR.depth - 0.2;

  box(radiatorGroup, coreW, coreH, coreD, mats.anodized, 0, 0, 0, {
    soft: true,
    radius: 0.25,
    bevel: 0.06,
  });

  // Dense fin matrix + flat coolant tubes (instanced).
  const radFinGeo = new THREE.BoxGeometry(0.055, coreH - 0.28, coreD - 0.25);
  const radFins = new THREE.InstancedMesh(radFinGeo, mats.alu, quality.radiatorFins);
  const radDummy = new THREE.Object3D();
  for (let i = 0; i < radFins.count; i++) {
    radDummy.position.set(-coreW / 2 + 0.6 + (i / (radFins.count - 1)) * (coreW - 1.2), 0.02, 0);
    radDummy.updateMatrix();
    radFins.setMatrixAt(i, radDummy.matrix);
  }
  radiatorGroup.add(radFins);

  for (let i = 0; i < 7; i++) {
    box(radiatorGroup, coreW - 0.4, 0.22, 0.42, mats.copper, 0, -coreH / 2 + 0.34 + i * 0.36, coreD / 2 - 0.3);
  }

  // End tanks + side frames.
  for (const ex of [-1, 1]) {
    box(radiatorGroup, 1.7, coreH + 0.7, coreD + 0.4, mats.gunmetal, ex * (coreW / 2 + 0.75), 0, 0, {
      soft: true,
      radius: 0.4,
      bevel: 0.08,
    });
    box(radiatorGroup, 0.5, coreH + 0.9, 0.5, mats.chrome, ex * (coreW / 2 + 0.75), 0, coreD / 2 + 0.3);
  }
  for (const sz of [-1, 1]) {
    box(radiatorGroup, coreW + 1.4, 0.28, 0.55, mats.alu, 0, coreH / 2 + 0.22, sz * (coreD / 2 - 0.2));
    box(radiatorGroup, coreW + 1.4, 0.28, 0.55, mats.alu, 0, -coreH / 2 - 0.22, sz * (coreD / 2 - 0.2));
  }

  // Ports on the underside near the right tank.
  const radiatorPorts = [
    { x: 16.4, z: 4.6 },
    { x: 19.2, z: 4.6 },
  ];
  for (const p of radiatorPorts) {
    cyl(radiatorGroup, 0.42, 0.42, 1.6, mats.chrome, p.x, -coreH / 2 - 0.5, p.z, {
      segments: 16,
    });
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.12, 8, 20), mats.darkChrome);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(p.x, -coreH / 2 - 1.15, p.z);
    radiatorGroup.add(collar);
  }

  // Top mounting brackets to the chassis.
  for (const bx of [-15.0, 15.0]) {
    for (const bz of [-3.6, 3.6]) {
      box(radiatorGroup, 1.0, 1.8, 1.0, mats.aluDark, bx, coreH / 2 + 0.9, bz);
      box(radiatorGroup, 1.35, 0.24, 1.35, mats.alu, bx, coreH / 2 + 1.85, bz);
    }
  }

  // Three pull fans facing +Y.
  const radiatorFans = [];
  [-13.2, 0, 13.2].forEach((fx, i) => {
    const fan = addFan(ctx, radiatorGroup, {
      x: fx,
      y: 2.55,
      z: 0,
      axis: 'y',
      size: 11.6,
      thickness: 2.2,
      blades: 9,
      materialFrame: mats.plastic,
      materialRotor: mats.plasticGloss,
      haloColor: 0x8f7bff,
      haloOpacity: 0.34,
      hubGlow: 0.4,
      speed: 0.92,
      phase: i * 1.1,
      pitch: 0.58,
    });
    radiatorFans.push(fan);
  });

  registerMotion(ctx, radiatorGroup, 'radiator', 0);

  /* ---- Reservoir / pump combo ------------------------------------------ */
  const reservoirGroup = new THREE.Group();
  reservoirGroup.name = 'reservoirGroup';
  reservoirGroup.position.set(RESERVOIR.x, RESERVOIR.y, RESERVOIR.z);
  group.add(reservoirGroup);

  const rH = RESERVOIR.height;

  // Acrylic outer wall.
  cyl(reservoirGroup, RESERVOIR.radius, RESERVOIR.radius, rH, mats.acrylic, 0, 0, 0, {
    segments: 40,
    open: true,
  });
  // Coolant volume (custom flow shader).
  const reservoirCoolantMat = createCoolantMaterial(ctx, {
    useV: true,
    flow: 0.9,
    streaks: 3.0,
    bubbles: 24,
    swirl: 3.6,
    opacity: 0.66,
  });
  const coolantBody = cyl(
    reservoirGroup,
    RESERVOIR.radius - 0.22,
    RESERVOIR.radius - 0.22,
    rH - 0.5,
    reservoirCoolantMat,
    0,
    0,
    0,
    { segments: 40, open: true }
  );
  coolantBody.renderOrder = 2;

  // Central return tube.
  cyl(reservoirGroup, 0.32, 0.32, rH - 2.4, mats.darkChrome, 0, 0.2, 0, { segments: 14 });
  // Base plate (pump housing) + impeller glow.
  cyl(reservoirGroup, 2.75, 2.75, 1.3, mats.chrome, 0, -rH / 2 + 0.55, 0, { segments: 32 });
  cyl(reservoirGroup, 2.4, 2.4, 0.16, mats.glowViolet, 0, -rH / 2 + 1.2, 0, { segments: 32 });
  for (let i = 0; i < 6; i++) {
    const blade = box(reservoirGroup, 1.5, 0.1, 0.32, mats.chrome, 0.92, -rH / 2 + 1.32, 0);
    blade.rotation.y = (i / 6) * TAU;
  }
  // Top cap with fill port and pressure valve.
  cyl(reservoirGroup, 2.8, 2.8, 1.25, mats.chrome, 0, rH / 2 - 0.5, 0, { segments: 32 });
  const knurl = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.16, 8, 40), mats.darkChrome);
  knurl.rotation.x = Math.PI / 2;
  knurl.position.y = rH / 2 + 0.1;
  reservoirGroup.add(knurl);
  cyl(reservoirGroup, 0.7, 0.7, 0.8, mats.chrome, 0, rH / 2 + 0.4, 0, { segments: 16 });
  cyl(reservoirGroup, 0.42, 0.42, 0.3, mats.darkChrome, 0.0, rH / 2 + 0.85, 0, { segments: 12 });
  // Outlet at the base + inlet on top.
  cyl(reservoirGroup, 0.45, 0.45, 1.2, mats.chrome, 0, -rH / 2 - 0.2, 0, { segments: 16 });
  cyl(reservoirGroup, 0.45, 0.45, 1.0, mats.chrome, 0, rH / 2 + 0.75, 0, { segments: 16 });

  // Chrome mounting arms to the right rail.
  for (const by of [-4.6, 3.4]) {
    box(reservoirGroup, 3.8, 0.34, 1.4, mats.chrome, 4.2, by, 0.2);
    box(reservoirGroup, 0.9, 1.5, 1.9, mats.aluDark, 5.4, by, 0.2, {
      soft: true,
      radius: 0.2,
      bevel: 0.04,
    });
  }
  box(reservoirGroup, 0.1, 8.6, 0.1, mats.glowViolet, 2.55, 0.0, 1.8);

  registerMotion(ctx, reservoirGroup, 'reservoir', 0);

  /* ---- Block display shelf --------------------------------------------- */
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'blockShelf';
  shelfGroup.position.set(0, -19.7, 0);
  group.add(shelfGroup);

  box(shelfGroup, 22.6, 0.5, 10.6, mats.glass, 15.0, 0, 6.0);
  box(shelfGroup, 22.4, 0.12, 0.12, mats.glassEdge, 15.0, 0.3, 11.2);
  for (const [sx, sz] of [
    [5.0, 1.6],
    [25.0, 1.6],
    [5.0, 10.4],
    [25.0, 10.4],
  ]) {
    cyl(shelfGroup, 0.32, 0.32, 1.1, mats.chrome, sx, -0.75, sz, { segments: 12 });
  }

  // CPU water block (standing, coldplate forward).
  const cpuBlockGroup = new THREE.Group();
  cpuBlockGroup.position.set(7.2, 0.25, 7.0);
  shelfGroup.add(cpuBlockGroup);
  box(cpuBlockGroup, 4.4, 2.6, 2.0, mats.nickel, 0, 1.3, 0, {
    soft: true,
    radius: 0.28,
    bevel: 0.06,
  });
  box(cpuBlockGroup, 4.2, 1.8, 1.9, mats.acrylic, 0, 3.5, 0, {
    soft: true,
    radius: 0.25,
    bevel: 0.05,
  });
  box(cpuBlockGroup, 4.34, 0.16, 2.06, mats.chrome, 0, 2.66, 0);
  const cpuBlockWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.35),
    createCoolantMaterial(ctx, { useV: false, flow: 1.35, streaks: 4, bubbles: 12, opacity: 0.72 })
  );
  cpuBlockWindow.position.set(0, 3.5, 0.96);
  cpuBlockGroup.add(cpuBlockWindow);
  box(cpuBlockGroup, 2.2, 0.06, 0.06, mats.glowTeal, 0, 2.9, 1.0);
  // Barbs.
  for (const bx of [-1.2, 1.2]) {
    cyl(cpuBlockGroup, 0.36, 0.36, 1.3, mats.chrome, bx, 4.9, 0, { segments: 14 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.1, 8, 18), mats.darkChrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(bx, 5.3, 0);
    cpuBlockGroup.add(ring);
  }
  // Nickel coldplate face detail (micro-fins).
  for (let i = 0; i < 6; i++) {
    box(cpuBlockGroup, 0.1, 3.4, 0.12, mats.copper, -1.65 + i * 0.66, 1.3, 1.02);
  }

  // Full-cover GPU water block (lying flat, acrylic top).
  const gpuBlockGroup = new THREE.Group();
  gpuBlockGroup.position.set(17.0, 0.25, 6.0);
  shelfGroup.add(gpuBlockGroup);
  box(gpuBlockGroup, 12.4, 1.1, 7.2, mats.nickel, 0, 0.55, 0, {
    soft: true,
    radius: 0.5,
    bevel: 0.08,
  });
  box(gpuBlockGroup, 12.0, 0.9, 6.9, mats.acrylic, 0, 1.55, 0, {
    soft: true,
    radius: 0.45,
    bevel: 0.06,
  });
  const gpuBlockWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(10.8, 5.9),
    createCoolantMaterial(ctx, { useV: false, flow: 1.1, streaks: 5, bubbles: 18, opacity: 0.68 })
  );
  gpuBlockWindow.rotation.x = -Math.PI / 2;
  gpuBlockWindow.position.set(-0.4, 2.02, 0);
  gpuBlockGroup.add(gpuBlockWindow);
  // Serpentine channel ribs across the acrylic.
  for (let i = 0; i < 5; i++) {
    box(gpuBlockGroup, 10.6, 0.06, 0.14, mats.chrome, -0.4, 2.06, -2.2 + i * 1.1);
  }
  box(gpuBlockGroup, 5.0, 0.08, 0.1, mats.glowTeal, -1.0, 2.05, 2.9);
  // Terminal + ports.
  box(gpuBlockGroup, 2.9, 1.5, 3.4, mats.gunmetal, 6.4, 1.15, 0, {
    soft: true,
    radius: 0.25,
    bevel: 0.05,
  });
  for (const pz of [-1.2, 1.2]) {
    cyl(gpuBlockGroup, 0.4, 0.4, 1.3, mats.chrome, 6.4, 2.4, pz, { segments: 14 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.1, 8, 18), mats.darkChrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(6.4, 2.9, pz);
    gpuBlockGroup.add(ring);
  }
  // Nickel coldplate contact pads on the underside.
  box(gpuBlockGroup, 3.0, 0.16, 2.4, mats.copperPolished, -2.4, -0.03, 0);

  registerMotion(ctx, shelfGroup, 'shelf', 0);

  /* ---- Hoses ------------------------------------------------------------ */
  const tubesGroup = new THREE.Group();
  tubesGroup.name = 'coolantHoses';
  group.add(tubesGroup);
  registerMotion(ctx, tubesGroup, 'tubes', 0);

  const addBarb = (parent, point, tangent, radius) => {
    const dir = tangent.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const barb = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1.3, 12), mats.chrome);
    barb.position.copy(point).addScaledVector(dir, -0.45);
    barb.quaternion.copy(q);
    parent.add(barb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.25, 0.11, 8, 18), mats.darkChrome);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    ring.position.copy(point).addScaledVector(dir, -0.1);
    parent.add(ring);
  };

  const addHose = (points, opts = {}) => {
    const radius = opts.radius !== undefined ? opts.radius : 0.62;
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const seg = quality.tubePathSegments;
    const radial = quality.tubeRadialSegments;

    const outer = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, radial, false), mats.hose);
    tubesGroup.add(outer);

    const coolantMat = createCoolantMaterial(ctx, {
      useV: false,
      flow: opts.flow !== undefined ? opts.flow : 1.15,
      streaks: opts.streaks !== undefined ? opts.streaks : 3.4,
      bubbles: opts.bubbles !== undefined ? opts.bubbles : 22,
      opacity: 0.58,
    });
    const inner = new THREE.Mesh(
      new THREE.TubeGeometry(curve, seg, radius * 0.68, Math.max(6, radial - 4), false),
      coolantMat
    );
    inner.renderOrder = 2;
    tubesGroup.add(inner);

    addBarb(tubesGroup, curve.getPointAt(0), curve.getTangentAt(0), radius * 1.15);
    addBarb(tubesGroup, curve.getPointAt(1), curve.getTangentAt(1).negate(), radius * 1.15);
    return curve;
  };

  // 1. Reservoir outlet → CPU block inlet.
  addHose([
    new THREE.Vector3(20.0, 0.3, 7.0),
    new THREE.Vector3(21.6, -3.0, 8.4),
    new THREE.Vector3(22.8, -8.0, 8.8),
    new THREE.Vector3(21.8, -12.4, 8.2),
    new THREE.Vector3(15.0, -13.9, 7.8),
    new THREE.Vector3(10.4, -14.0, 7.4),
    new THREE.Vector3(8.4, -14.2, 7.0),
  ], { flow: 1.05, streaks: 10 });

  // 2. CPU block outlet → GPU block terminal.
  addHose([
    new THREE.Vector3(6.0, -14.2, 7.0),
    new THREE.Vector3(5.6, -15.6, 6.2),
    new THREE.Vector3(8.0, -16.9, 5.8),
    new THREE.Vector3(13.0, -17.0, 5.6),
    new THREE.Vector3(19.0, -16.9, 6.0),
    new THREE.Vector3(23.4, -16.7, 6.6),
    new THREE.Vector3(23.6, -16.4, 7.2),
  ], { flow: 1.2, streaks: 8, bubbles: 16 });

  // 3. GPU block outlet → radiator port (long right-hand riser).
  addHose([
    new THREE.Vector3(23.6, -16.4, 4.8),
    new THREE.Vector3(24.2, -13.0, 5.6),
    new THREE.Vector3(24.3, -6.0, 7.4),
    new THREE.Vector3(24.3, 2.0, 8.6),
    new THREE.Vector3(24.1, 10.0, 8.0),
    new THREE.Vector3(23.2, 17.0, 6.2),
    new THREE.Vector3(20.9, 21.4, 4.9),
    new THREE.Vector3(19.2, 23.1, 4.6),
  ], { flow: 1.3, streaks: 12, bubbles: 24 });

  // 4. Radiator inlet → reservoir top.
  addHose([
    new THREE.Vector3(16.4, 23.1, 4.6),
    new THREE.Vector3(17.2, 21.3, 5.2),
    new THREE.Vector3(18.5, 18.9, 6.0),
    new THREE.Vector3(19.6, 16.9, 6.7),
    new THREE.Vector3(20.0, 15.5, 7.0),
  ], { flow: 1.0, streaks: 7, bubbles: 14 });

  ctx.refs.liquidCoolerGroup = group;
  ctx.refs.reservoirCoolant = reservoirCoolantMat;
  ctx.refs.radiatorGroup = radiatorGroup;

  return {
    group,
    radiatorGroup,
    reservoirGroup,
    shelfGroup,
    tubesGroup,
    radiatorFans,
    coolantMaterials: [reservoirCoolantMat],
  };
}

/* ========================================================================== */
/*  Studio environment                                                        */
/* ========================================================================== */

function buildEnvironment(ctx) {
  const { mats } = ctx;
  const group = new THREE.Group();
  group.name = 'studioEnvironment';

  /* Backdrop shell (inside-out gradient dome). */
  const domeGeo = new THREE.SphereGeometry(220, 40, 24);
  const dome = new THREE.Mesh(domeGeo, createBackdropMaterial());
  dome.position.y = 10;
  dome.renderOrder = -20;
  dome.frustumCulled = false;
  group.add(dome);

  /* PCB-grid floor. */
  const floorGeo = new THREE.PlaneGeometry(340, 340, 1, 1);
  const floor = new THREE.Mesh(floorGeo, createFloorMaterial(ctx, ctx.quality));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  group.add(floor);

  /* Soft stage pool under the rig. */
  const stage = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    createGlowMaterial(0x1f8fae, { power: 2.8, strength: 0.1 })
  );
  stage.rotation.x = -Math.PI / 2;
  stage.position.y = FLOOR_Y + 0.04;
  group.add(stage);

  const warmPool = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    createGlowMaterial(0xff9a5c, { power: 3.2, strength: 0.07 })
  );
  warmPool.rotation.x = -Math.PI / 2;
  warmPool.position.set(-6, FLOOR_Y + 0.05, 6);
  group.add(warmPool);

  /* Volumetric-style light shafts behind / above the rig. */
  const shaftMaterial = (color, strength) =>
    createGlowMaterial(color, { power: 1.7, strength });

  const shaftA = new THREE.Mesh(new THREE.PlaneGeometry(120, 90), shaftMaterial(0x3f9fc0, 0.14));
  shaftA.position.set(-24, 26, -44);
  shaftA.rotation.set(0, 0.22, -0.32);
  group.add(shaftA);

  const shaftB = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), shaftMaterial(0x8a6a3a, 0.1));
  shaftB.position.set(30, 20, -46);
  shaftB.rotation.set(0, -0.3, 0.28);
  group.add(shaftB);

  const rimHalo = new THREE.Mesh(new THREE.PlaneGeometry(120, 78), shaftMaterial(0x2b7f9c, 0.1));
  rimHalo.position.set(0, 8, -52);
  group.add(rimHalo);

  /* Dust motes: a few hundred additive points drifting in the shafts. */
  const dustCount = ctx.quality.dustCount;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeeds = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const radius = 20 + ctx.rand() * 70;
    const angle = ctx.rand() * TAU;
    dustPositions[i * 3] = Math.cos(angle) * radius * 0.8;
    dustPositions[i * 3 + 1] = -20 + ctx.rand() * 55;
    dustPositions[i * 3 + 2] = -20 + ctx.rand() * 60;
    dustSeeds[i] = ctx.rand();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x9fd8ea,
    size: 0.22,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  group.add(dust);

  ctx.refs.dust = { points: dust, positions: dustPositions, seeds: dustSeeds, base: dustPositions.slice() };
  ctx.refs.shafts = [shaftA, shaftB, rimHalo];

  return { group, floor, dome, dust };
}

/* ========================================================================== */
/*  Lighting rig                                                              */
/* ========================================================================== */

function buildLights(ctx) {
  const { quality } = ctx;
  const hemisphere = new THREE.HemisphereLight(0x2a3c56, 0x05070b, 0.35);
  hemisphere.position.set(0, 30, 0);

  const key = new THREE.DirectionalLight(0xfff1e0, 2.6);
  key.position.set(36, 44, 54);
  key.target.position.set(-2, 0, 2);

  const fill = new THREE.DirectionalLight(0x86b6d8, 0.62);
  fill.position.set(-46, 18, 34);
  fill.target.position.set(-2, 0, 0);

  const rim = new THREE.DirectionalLight(0x74d2ff, 1.8);
  rim.position.set(-18, 26, -46);
  rim.target.position.set(0, 4, 0);

  const tag = new THREE.DirectionalLight(0xffb27a, 0.55);
  tag.position.set(28, -14, 30);
  tag.target.position.set(6, -20, 4);

  if (ctx.shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    key.shadow.camera.left = -46;
    key.shadow.camera.right = 46;
    key.shadow.camera.top = 46;
    key.shadow.camera.bottom = -46;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 190;
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.035;
    key.shadow.radius = 2.2;
  }

  const accents = [];
  const accentSpecs = [
    { color: 0xff9a54, intensity: 260, distance: 70, position: [-9, 9, 14] },
    { color: 0x3fd6ff, intensity: 220, distance: 60, position: [10, -6, 18] },
    { color: 0xa855f7, intensity: 200, distance: 55, position: [21, 6, 12] },
    { color: 0x4ff0d0, intensity: 150, distance: 60, position: [0, 24, 12] },
  ];
  for (const spec of accentSpecs) {
    const light = new THREE.PointLight(spec.color, spec.intensity, spec.distance, 2);
    light.position.set(spec.position[0], spec.position[1], spec.position[2]);
    accents.push(light);
  }

  const all = [hemisphere, key, fill, rim, tag, ...accents];
  return { hemisphere, key, fill, rim, tag, accents, all };
}
/* ========================================================================== */
/*  Explode-view registry                                                     */
/* ========================================================================== */

/** Register a part for explode-view displacement along its assembly axis. */
function registerMotion(ctx, object, key, index = 0) {
  const def = EXPLODE_MOTION[key];
  if (!def) return;
  ctx.motions.push({
    object,
    base: object.position.clone(),
    def,
    index,
  });
}

/* ========================================================================== */
/*  Draw-call compaction                                                     */
/* ========================================================================== */

/**
 * Bakes every static, opaque sibling mesh that shares a material into one
 * merged mesh per material. Runs bottom-up so animated groups (fan rotors,
 * explode modules, tensor nodes) keep their own local transforms. Transparent,
 * additive, shader and instanced meshes are left untouched.
 */
function mergeStaticMeshes(root) {
  for (const child of [...root.children]) {
    if (child.isGroup) mergeStaticMeshes(child);
  }

  const buckets = new Map();
  for (const child of root.children) {
    if (!child.isMesh || child.isInstancedMesh) continue;
    if (child.userData.keepSeparate) continue;
    const material = child.material;
    if (!material || material.isShaderMaterial || material.transparent) continue;
    if (material.blending !== THREE.NormalBlending) continue;
    const geometry = child.geometry;
    if (!geometry || !geometry.attributes.position) continue;
    if (!geometry.attributes.normal || !geometry.attributes.uv) continue;
    if (geometry.morphAttributes && Object.keys(geometry.morphAttributes).length) continue;
    if (!buckets.has(material)) buckets.set(material, []);
    buckets.get(material).push(child);
  }

  for (const [material, meshes] of buckets) {
    if (meshes.length < 2) continue;
    const geometries = [];
    for (const mesh of meshes) {
      mesh.updateMatrix();
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrix);
      geometries.push(geometry);
    }
    const merged = mergeSimpleGeometries(geometries);
    const compact = new THREE.Mesh(merged, material);
    compact.castShadow = meshes[0].castShadow;
    compact.receiveShadow = meshes[0].receiveShadow;
    compact.name = `merged_${meshes.length}`;
    root.add(compact);
    for (const mesh of meshes) {
      root.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
    }
  }
}

/* ========================================================================== */
/*  Public factory                                                            */
/* ========================================================================== */

/**
 * Builds the complete procedural hardware rig and adds it to `scene`.
 *
 * @param {THREE.Scene|null} scene
 * @param {object} options
 * @returns {object} rig controller (see the module header for the full API)
 */
export function createHardwareRig(scene, options = {}) {
  const addLights = options.addLights !== false;
  const shadows = options.shadows !== false;
  const qualityName = QUALITY_PRESETS[options.quality] ? options.quality : 'high';
  const quality = QUALITY_PRESETS[qualityName];
  const seed = Number.isFinite(options.seed) ? options.seed : 11;

  const group = new THREE.Group();
  group.name = 'hardwareRig';
  group.userData.component = 'hardwareRig';
  group.userData.version = HARDWARE_RIG_VERSION;

  const envMap = createStudioEnvironmentMap();
  const mats = createMaterials(envMap);

  const ctx = {
    scene,
    mats,
    envMap,
    quality,
    shadows,
    rand: mulberry32(seed),
    timeUniforms: [],
    coolantMaterials: [],
    fans: [],
    motions: [],
    refs: {},
  };

  /* ---------------------------------------------------------------------- */
  /*  Build                                                                 */
  /* ---------------------------------------------------------------------- */

  const environment = buildEnvironment(ctx);
  group.add(environment.group);

  const chassis = buildChassis(ctx);
  group.add(chassis.group);

  const motherboard = buildMotherboard(ctx);
  group.add(motherboard.group);

  const cpu = buildCpu(ctx);
  group.add(cpu.group);

  const cooler = buildAirCooler(ctx);
  group.add(cooler.group);

  const gpu = buildGpu(ctx);
  group.add(gpu.group);

  const liquid = buildLiquidCooler(ctx);
  group.add(liquid.group);

  /* ---------------------------------------------------------------------- */
  /*  Lights                                                                */
  /* ---------------------------------------------------------------------- */

  let lights = null;
  if (addLights) {
    const rig = buildLights(ctx);
    lights = {
      key: rig.key,
      fill: rig.fill,
      rim: rig.rim,
      accents: rig.accents,
      hemisphere: rig.hemisphere,
      all: rig.all,
    };
    for (const light of rig.all) group.add(light);
    for (const light of [rig.key, rig.fill, rig.rim, rig.tag]) {
      if (light.target) group.add(light.target);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Shadow flags + draw-call compaction                                   */
  /* ---------------------------------------------------------------------- */

  if (options.merge !== false) mergeStaticMeshes(group);

  if (shadows) {
    group.traverse((obj) => {
      if (!obj.isMesh) return;
      const material = obj.material;
      if (!material) return;
      const additive = material.blending === THREE.AdditiveBlending;
      const ghost = material.transparent && material.opacity < 0.22;
      if (additive || ghost || material.isShaderMaterial) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      } else {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  State                                                                 */
  /* ---------------------------------------------------------------------- */

  const state = {
    explodeTarget: clamp01(finite(options.explode, 0)),
    explodeCurrent: clamp01(finite(options.explode, 0)),
    fanRpm: clamp(finite(options.fanRpm, 0.75), 0.2, 1.5),
    aiLoad: clamp01(finite(options.aiLoad, 0.35)),
    thermalLoad: clamp01(finite(options.thermalLoad, 0.35)),
    time: 0,
    dieReveal: 0,
    zoomReveal: 0,
    cpuDistance: 999,
    disposed: false,
  };

  const _camPos = new THREE.Vector3(0, 10, 82);
  const _cpuWorld = new THREE.Vector3();
  const _anchorWorld = new THREE.Vector3();
  const _tmp = new THREE.Vector3();

  const anchors = {};
  for (const key of Object.keys(COMPONENT_ANCHORS)) anchors[key] = { ...COMPONENT_ANCHORS[key] };

  /* Cooler shell materials are cloned during build so the CPU zoom can turn
     the heatsink into a ghost without touching the GPU / chassis metals. */
  const coolerMaterials = ctx.refs.coolerMaterials || [];
  // The cooler clones live only inside the cooler, so fading them is local.
  const coolerHalos = [];
  for (const fan of cooler.fans) {
    if (fan.halo) coolerHalos.push(fan.halo.material);
    if (fan.hubRing) coolerHalos.push(fan.hubRing.material);
  }
  const fadeMaterials = [...coolerMaterials, ...coolerHalos];
  for (const material of fadeMaterials) {
    if (material.userData.baseOpacity === undefined) {
      material.userData.baseOpacity = material.opacity !== undefined ? material.opacity : 1;
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Per-frame update                                                      */
  /* ---------------------------------------------------------------------- */

  function sanitiseCamera(cameraPos) {
    if (cameraPos && cameraPos.isCamera) {
      _camPos.setFromMatrixPosition(cameraPos.matrixWorld);
    } else if (cameraPos && Number.isFinite(cameraPos.x)) {
      _camPos.set(finite(cameraPos.x, 0), finite(cameraPos.y, 0), finite(cameraPos.z, 0));
    } else {
      _camPos.set(0, 12, 82);
    }
    if (!Number.isFinite(_camPos.x) || !Number.isFinite(_camPos.y) || !Number.isFinite(_camPos.z)) {
      _camPos.set(0, 12, 82);
    }
  }

  function update(elapsed, delta, cameraPos) {
    if (state.disposed) return;

    let dt = Number.isFinite(delta) ? clamp(delta, 0, 0.06) : 0.016;
    let t = Number.isFinite(elapsed) ? elapsed : state.time + dt;
    if (!Number.isFinite(t) || t < 0) t = 0;
    state.time = t;

    sanitiseCamera(cameraPos);
    group.updateWorldMatrix(true, false);

    /* Explode easing + per-part spatial transitions. */
    const target = clamp01(state.explodeTarget);
    state.explodeCurrent = damp(state.explodeCurrent, target, 6.5, dt);
    if (Math.abs(state.explodeCurrent - target) < 0.0005) state.explodeCurrent = target;
    const e = state.explodeCurrent;

    for (const motion of ctx.motions) {
      const def = motion.def;
      const stagger = def.stagger ? motion.index * def.stagger : 0;
      const start = def.start + (def.stagger ? motion.index * 0.035 : 0);
      const end = def.end + (def.stagger ? motion.index * 0.035 : 0);
      const k = smoothstep(start, end, e);
      motion.object.position.set(
        motion.base.x + def.dx * k,
        motion.base.y + def.dy * k,
        motion.base.z + (def.dz + stagger) * k
      );
    }

    /* Fans. */
    const rpm = state.fanRpm;
    for (const fan of ctx.fans) {
      fan.object.rotation.z = (fan.object.rotation.z + dt * rpm * 10.5 * fan.speed) % TAU;
      if (fan.halo) {
        const base = fan.halo.material.userData.baseOpacity !== undefined
          ? fan.halo.material.userData.baseOpacity
          : 0.42;
        fan.halo.material.opacity = base * clamp(0.55 + rpm * 0.6, 0.35, 1.35);
      }
    }

    /* Camera proximity → X-ray of the air cooler and a live silicon die. */
    _cpuWorld.set(anchors.cpu.x, anchors.cpu.y, anchors.cpu.z).applyMatrix4(group.matrixWorld);
    state.cpuDistance = _camPos.distanceTo(_cpuWorld);
    const near = 1 - smoothstep(24, 64, state.cpuDistance);
    const assembled = 1 - smoothstep(0.16, 0.5, e);
    state.zoomReveal = clamp01(near * assembled);
    const explodeReveal = smoothstep(0.24, 0.72, e);
    state.dieReveal = clamp01(Math.max(state.zoomReveal, explodeReveal));

    for (const material of fadeMaterials) {
      const base = material.userData.baseOpacity;
      material.opacity = base * lerp(1, 0.075, state.zoomReveal);
      if (material.transparent) material.depthWrite = material.opacity > 0.9;
    }

    /* Shader uniforms. */
    for (const uniform of ctx.timeUniforms) uniform.value = t;

    const die = ctx.refs.dieMaterial;
    if (die) {
      die.uniforms.uReveal.value = state.dieReveal;
      die.uniforms.uLoad.value = state.aiLoad;
    }

    const thermal = clamp01(state.thermalLoad * 0.65 + state.aiLoad * 0.35);
    const flowScale = 0.55 + rpm * 0.7;
    for (const material of ctx.coolantMaterials) {
      material.uniforms.uThermal.value = thermal;
      const baseFlow = material.userData.baseFlow !== undefined ? material.userData.baseFlow : 1;
      material.uniforms.uFlow.value = baseFlow * flowScale;
    }

    const ihsMat = ctx.refs.ihsMaterial;
    if (ihsMat) ihsMat.opacity = lerp(1, 0.18, state.zoomReveal);

    /* AI matrices. */
    if (ctx.refs.gpuTensor) {
      ctx.refs.gpuTensor.tick({ time: t, aiLoad: state.aiLoad, reveal: 1 });
    }
    if (ctx.refs.cpuTensor) {
      ctx.refs.cpuTensor.tick({ time: t, aiLoad: state.aiLoad, reveal: state.dieReveal });
    }

    /* Accent lights breathe with the workload. */
    if (lights) {
      const a = lights.accents;
      if (a[0]) a[0].intensity = 230 + Math.sin(t * 0.7 + 0.4) * 40 + state.aiLoad * 45;
      if (a[1]) a[1].intensity = 150 + state.aiLoad * 150 + Math.sin(t * 1.6) * 16;
      if (a[2]) a[2].intensity = 150 + state.aiLoad * 90 + Math.sin(t * 1.1 + 2.1) * 18;
      if (a[3]) a[3].intensity = 120 + Math.sin(t * 0.5 + 1.4) * 20;
    }

    /* Dust drift. */
    const dust = ctx.refs.dust;
    if (dust) {
      const array = dust.positions;
      const base = dust.base;
      for (let i = 0; i < array.length; i += 3) {
        const s = dust.seeds[i / 3];
        array[i] = base[i] + Math.sin(t * 0.12 + s * 6.283) * 1.4;
        array[i + 1] = base[i + 1] + Math.sin(t * 0.08 + s * 9.1) * 1.1;
      }
      dust.points.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Public methods                                                        */
  /* ---------------------------------------------------------------------- */

  function setExplode(factor, immediate = false) {
    const value = clamp01(finite(factor, state.explodeTarget));
    state.explodeTarget = value;
    if (immediate) {
      state.explodeCurrent = value;
      update(state.time, 0, _camPos);
    }
  }

  function setFanRpm(normalised) {
    state.fanRpm = clamp(finite(normalised, state.fanRpm), 0.2, 1.5);
  }

  function setAiLoad(load) {
    state.aiLoad = clamp01(finite(load, state.aiLoad));
  }

  function setThermalLoad(load) {
    state.thermalLoad = clamp01(finite(load, state.thermalLoad));
  }

  function resolveAnchorName(name) {
    if (typeof name !== 'string') return null;
    const key = name.trim().toLowerCase();
    if (COMPONENT_ANCHORS[key]) return key;
    if (ANCHOR_ALIASES[key]) return ANCHOR_ALIASES[key];
    return null;
  }

  function getComponentWorldPosition(name, target) {
    const key = resolveAnchorName(name);
    if (!key) return null;
    const anchor = COMPONENT_ANCHORS[key];
    const out = target && target.isVector3 ? target : new THREE.Vector3();
    group.updateWorldMatrix(true, false);
    return out.set(anchor.x, anchor.y, anchor.z).applyMatrix4(group.matrixWorld);
  }

  function getComponentDistance(name, point) {
    const key = resolveAnchorName(name);
    if (!key || !point) return Infinity;
    const world = getComponentWorldPosition(key, _anchorWorld);
    if (!world) return Infinity;
    if (point.isVector3) return world.distanceTo(point);
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) {
      return Infinity;
    }
    _tmp.set(point.x, point.y, point.z);
    return world.distanceTo(_tmp);
  }

  function getNearestComponent(point) {
    let best = null;
    let bestDistance = Infinity;
    for (const key of Object.keys(COMPONENT_ANCHORS)) {
      if (key === 'overview' || key === 'chassis') continue;
      const distance = getComponentDistance(key, point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = key;
      }
    }
    return { name: best, distance: bestDistance };
  }

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;

    if (group.parent) group.parent.remove(group);
    else if (scene) scene.remove(group);

    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    group.traverse((obj) => {
      if (obj.geometry && obj.geometry.dispose) geometries.add(obj.geometry);
      const material = obj.material;
      if (!material) return;
      const list = Array.isArray(material) ? material : [material];
      for (const mat of list) {
        if (!mat) continue;
        materials.add(mat);
        for (const value of Object.values(mat)) {
          if (value && value.isTexture) textures.add(value);
        }
        if (mat.uniforms) {
          for (const uniform of Object.values(mat.uniforms)) {
            if (uniform && uniform.value && uniform.value.isTexture) textures.add(uniform.value);
          }
        }
      }
    });

    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
    for (const material of materials) {
      if (material.dispose) material.dispose();
    }

    if (envMap) envMap.dispose();

    if (lights) {
      for (const light of lights.all) {
        if (light.shadow && light.shadow.map) {
          light.shadow.map.dispose();
          light.shadow.map = null;
        }
      }
    }

    ctx.timeUniforms.length = 0;
    ctx.coolantMaterials.length = 0;
    ctx.fans.length = 0;
    ctx.motions.length = 0;
    ctx.refs = {};
  }

  /* ---------------------------------------------------------------------- */
  /*  Assemble                                                              */
  /* ---------------------------------------------------------------------- */

  if (scene && options.attach !== false) scene.add(group);

  const rig = {
    group,
    lights,
    anchors,
    groups: {
      motherboard: motherboard.group,
      ram: motherboard.ramGroup,
      cpu: cpu.group,
      cooler: cooler.group,
      gpu: gpu.group,
      chassis: chassis.group,
      psu: chassis.psuGroup,
      liquidCooler: liquid.group,
      radiator: liquid.radiatorGroup,
      reservoir: liquid.reservoirGroup,
      tensorMatrix: gpu.tensor.group,
      environment: environment.group,
    },
    quality: qualityName,
    setExplode,
    setFanRpm,
    setAiLoad,
    setThermalLoad,
    getExplode: () => state.explodeCurrent,
    getFanRpm: () => state.fanRpm,
    getAiLoad: () => state.aiLoad,
    getThermalLoad: () => state.thermalLoad,
    update,
    getComponentDistance,
    getComponentWorldPosition,
    getNearestComponent,
    dispose,
  };

  // Prime the pose and every shader uniform once.
  update(0, 0, null);

  return rig;
}

export default createHardwareRig;
