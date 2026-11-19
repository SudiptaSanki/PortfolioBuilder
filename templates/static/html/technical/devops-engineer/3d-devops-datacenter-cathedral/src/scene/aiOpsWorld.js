/**
 * aiOpsWorld.js
 * ============================================================================
 * THE NEURAL OPERATIONS CAMPUS
 *
 * A complete, fully procedural Three.js world for an AI/ML & DevOps portfolio:
 * a physical data-centre cathedral at blue hour where the abstract machinery of
 * modern machine learning has been given architecture, weight and light.
 *
 *   data ingestion  →  transformer core  →  GPU training hall
 *   →  CI/CD gantry  →  Kubernetes mesh  →  the edge, seen from orbit
 *
 * Everything is generated at runtime from code — no textures on disk, no GLB
 * models, no image requests. The only dependency is `three`.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   import { createAiOpsWorld } from './scene/aiOpsWorld.js';
 *
 *   const world = createAiOpsWorld(scene, { quality: 'high' });
 *   const pose  = world.getOpsPose(progress);          // progress 0..1
 *   camera.position.copy(pose.cameraPos);
 *   camera.lookAt(pose.lookAt);
 *   camera.fov = pose.fov; camera.updateProjectionMatrix();
 *   world.update(elapsed, delta, progress, camera);
 *
 *   world.triggerForwardPass();      // fires an activation wave through the core
 *   world.setCanaryRollout(true);    // v1 → v2 traffic shift + pod scaling
 *   world.getCanaryRollout();        // boolean
 *   world.dispose();                 // removes the group, frees GPU resources
 *
 * `getOpsPose(progress)` returns a fresh object each call:
 *
 *   {
 *     cameraPos, lookAt,        // THREE.Vector3, safe to keep / mutate
 *     fov,                      // suggested vertical field of view, degrees
 *     phaseName, phaseId,       // which of the six stations we are in
 *     station,                  // 1-based station index
 *     paramsB,                  // active parameters, billions
 *     throughputQps,            // inference requests / second
 *     gpuUtilPct,               // cluster training utilisation, %
 *     p99Ms,                    // edge p99 latency, ms
 *     healthPct,                // cluster health, %
 *     timeOfDay,                // 0 = blue hour … 1 = deep space night
 *   }
 *
 * ----------------------------------------------------------------------------
 * THE SIX STATIONS (camera path)
 * ----------------------------------------------------------------------------
 *   0.00 – 0.18  01 · Data Ingestion & Feature Lake
 *                A monumental intake portal, six illuminated fibre lanes, glass
 *                buffer vaults and vector-embedding prisms on the raised floor.
 *   0.18 – 0.36  02 · Transformer & Attention Core
 *                A sculptural multi-layer transformer: tilted attention rings,
 *                Q/K/V synaptic filaments and a volumetric latent-space sphere.
 *                `triggerForwardPass()` sends an activation wavefront through it.
 *   0.36 – 0.56  03 · Liquid-Cooled GPU Training Cluster
 *                Hot/cold aisle supercomputing: 42U cabinets, 8-GPU sleds,
 *                spinning fans, copper and emerald coolant manifolds, overhead
 *                busway, and a sculpted loss-surface mesh beside the aisle.
 *   0.56 – 0.74  04 · CI/CD & Container Build Gantry
 *                Four industrial build arches — LINT, TEST, IMAGE, SIGN —
 *                robotic arms, laser scanners, container modules on a rail and
 *                a glass artifact vault.
 *   0.74 – 0.90  05 · Kubernetes Mesh & Canary Rollout
 *                Ingress arch, rack-mounted nodes, hexagonal pods with orbiting
 *                Envoy sidecars, and curved v1/v2 traffic arcs that rebalance
 *                when `setCanaryRollout()` is toggled.
 *   0.90 – 1.00  06 · Global Edge Observability
 *                A procedural Earth hovering beyond the observation deck:
 *                continents, ocean specular, atmospheric rim, POP beacons and
 *                great-circle latency arcs with travelling light.
 *
 * ----------------------------------------------------------------------------
 * INTERNALS
 * ----------------------------------------------------------------------------
 * World units are metres, Y is up. The hall runs along +X from −265 to +246,
 * 72 m wide, 18 m to the trusses. Stations sit at fixed X positions so the
 * camera can travel continuously down the nave. The north wall is louvred and
 * solid, the south side is an open colonnade onto the night, and the east end
 * opens onto an observation deck where the Earth hangs in space.
 *
 * Camera framing deliberately composes the hero subject to the RIGHT of screen
 * centre (~24 % of half-width) so a left-hand portfolio card never covers it.
 * Pass `{ compositionShift: 0 }` if a host wants a centred camera.
 *
 * The module owns `scene.fog` and `scene.background` by default (restored on
 * dispose). All shaders are self-contained GLSL ES 1.00 with manual distance
 * fog so they compile on WebGL1 and WebGL2 without three's shader chunks.
 */

import * as THREE from 'three';

export const AI_OPS_WORLD_VERSION = '1.2.0';

/* ========================================================================== *
 *  Stations
 * ========================================================================== */

export const AI_OPS_PHASES = Object.freeze([
  {
    id: 'ingest',
    name: 'Data Ingestion & Feature Lake',
    short: 'Ingestion',
    start: 0.0,
    end: 0.18,
    caption: 'Six fibre lanes feed glass buffer vaults and embedding prisms',
  },
  {
    id: 'core',
    name: 'Transformer & Attention Core',
    short: 'Core',
    start: 0.18,
    end: 0.36,
    caption: 'Multi-head attention rings around a volumetric latent space',
  },
  {
    id: 'gpu',
    name: 'Liquid-Cooled GPU Training Cluster',
    short: 'Cluster',
    start: 0.36,
    end: 0.56,
    caption: 'Hot and cold aisles, copper manifolds and a live loss surface',
  },
  {
    id: 'cicd',
    name: 'CI/CD & Container Build Gantry',
    short: 'Pipeline',
    start: 0.56,
    end: 0.74,
    caption: 'Lint, test, image and sign — four arches over a precision rail',
  },
  {
    id: 'mesh',
    name: 'Kubernetes Mesh & Canary Rollout',
    short: 'Mesh',
    start: 0.74,
    end: 0.9,
    caption: 'Ingress, pods with Envoy sidecars, and a live v1/v2 split',
  },
  {
    id: 'edge',
    name: 'Global Edge Observability',
    short: 'Edge',
    start: 0.9,
    end: 1.0,
    caption: 'POP beacons and great-circle latency arcs over a procedural Earth',
  },
]);

export function phaseAtProgress(progress) {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  let index = 0;
  for (let i = 0; i < AI_OPS_PHASES.length; i += 1) {
    if (p >= AI_OPS_PHASES[i].start) index = i;
  }
  const phase = AI_OPS_PHASES[index];
  const span = Math.max(1e-6, phase.end - phase.start);
  const local = Math.min(1, Math.max(0, (p - phase.start) / span));
  return { index, phase, local, station: index + 1 };
}

/* ========================================================================== *
 *  Layout — one long nave, six installations
 * ========================================================================== */

export const OPS_LAYOUT = Object.freeze({
  hall: {
    xMin: -265,
    xMax: 246,
    zNorth: -36,
    zSouth: 36,
    trussY: 18,
    floorY: 0,
  },
  stations: {
    ingest: { x: -215, z: 0 },
    core: { x: -120, z: 0 },
    gpu: { x: -24, z: -16 },
    cicd: { x: 85, z: 0 },
    mesh: { x: 180, z: 0 },
    edge: { x: 540, y: 66, z: -30 },
  },
  deck: { xMin: 246, xMax: 300, zMin: -44, zMax: 72 },
});

/* ========================================================================== *
 *  Small maths helpers
 * ========================================================================== */

const EPS = 1e-6;

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function inverseLerp(a, b, v) {
  if (Math.abs(b - a) < EPS) return 0;
  return clamp01((v - a) / (b - a));
}

function smoothstep(edge0, edge1, x) {
  if (Math.abs(edge1 - edge0) < EPS) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function smootherstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / Math.max(EPS, edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

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

function randRange(random, min, max) {
  return min + (max - min) * random();
}

function hash2i(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function noise2(x, y, seed = 0) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2i(ix, iy, seed);
  const b = hash2i(ix + 1, iy, seed);
  const c = hash2i(ix, iy + 1, seed);
  const d = hash2i(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function fbm2(x, y, octaves = 4, seed = 0) {
  let sum = 0;
  let amp = 0.5;
  let fx = x;
  let fy = y;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += amp * noise2(fx, fy, seed + i * 17);
    norm += amp;
    fx *= 2.04;
    fy *= 2.04;
    amp *= 0.5;
  }
  return sum / Math.max(EPS, norm);
}

/* ========================================================================== *
 *  Canvas texture factory — every texture below is painted at runtime
 * ========================================================================== */

const HAS_CANVAS = typeof document !== 'undefined' && typeof document.createElement === 'function';

function createCanvasTexture(width, height, draw, options = {}) {
  if (!HAS_CANVAS) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = options.wrapS !== undefined ? options.wrapS : THREE.RepeatWrapping;
  texture.wrapT = options.wrapT !== undefined ? options.wrapT : THREE.RepeatWrapping;
  if (options.repeat) texture.repeat.set(options.repeat[0], options.repeat[1]);
  texture.anisotropy = options.anisotropy || 8;
  texture.colorSpace = options.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function makeEnvironmentTexture() {
  return createCanvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0.0, '#050a12');
      grad.addColorStop(0.34, '#0b1a2a');
      grad.addColorStop(0.52, '#234052');
      grad.addColorStop(0.58, '#6d5a44');
      grad.addColorStop(0.64, '#2c2118');
      grad.addColorStop(1.0, '#07090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // cool light bars, as if from a glass curtain wall
      const bars = [
        [0.1, 0.18, 0.55, 0.052, 'rgba(140,210,255,0.55)'],
        [0.34, 0.12, 0.36, 0.08, 'rgba(120,200,240,0.30)'],
        [0.62, 0.2, 0.6, 0.05, 'rgba(255,196,132,0.55)'],
        [0.86, 0.16, 0.3, 0.06, 'rgba(120,255,214,0.26)'],
      ];
      for (const [x, y, bw, bh, color] of bars) {
        const g = ctx.createRadialGradient((x + bw * 0.5) * w, y * h, 2, (x + bw * 0.5) * w, y * h, bw * w);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect((x - bw) * w, (y - bh) * h * 4, bw * 2 * w, bh * h * 9);
      }

      // faint ceiling strips
      ctx.globalAlpha = 0.22;
      for (let i = 0; i < 7; i += 1) {
        ctx.fillStyle = i % 2 ? '#ffd6a0' : '#8fe6ff';
        ctx.fillRect(0, h * (0.12 + i * 0.035), w, 2);
      }
      ctx.globalAlpha = 1;
    },
    { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );
}

function makeRackPanelTexture() {
  return createCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#aeb6bb';
      ctx.fillRect(0, 0, w, h);
      // perforated sheet: staggered rows of dark perforations
      const step = 11;
      for (let y = 6; y < h; y += step) {
        const offset = (Math.round(y / step) % 2) * (step * 0.5);
        for (let x = 6 + offset; x < w; x += step) {
          const r = 2.1 + Math.random() * 0.5;
          ctx.beginPath();
          ctx.fillStyle = '#2a3035';
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = 'rgba(235,245,250,0.20)';
          ctx.arc(x - 0.6, y - 0.6, r * 0.62, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // vertical brushed streaks
      ctx.globalAlpha = 0.10;
      for (let i = 0; i < 220; i += 1) {
        ctx.strokeStyle = i % 3 ? '#e6eef2' : '#5a666e';
        ctx.beginPath();
        const x = Math.random() * w;
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (Math.random() - 0.5) * 2, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { repeat: [1, 1] }
  );
}

function makeBrushedTexture() {
  return createCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#c6ced3';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1600; i += 1) {
        const y = Math.random() * h;
        const alpha = 0.04 + Math.random() * 0.10;
        ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(40,55,65,${alpha})`;
        ctx.lineWidth = 0.6 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }
    },
    { repeat: [4, 4] }
  );
}

function makeConcreteTexture() {
  return createCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#b4b2ae';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26000; i += 1) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const v = 140 + Math.random() * 70;
        ctx.fillStyle = `rgba(${v},${v - 2},${v - 5},${0.10 + Math.random() * 0.28})`;
        ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      ctx.globalAlpha = 0.20;
      for (let i = 0; i < 32; i += 1) {
        ctx.strokeStyle = '#6b6a66';
        ctx.lineWidth = 0.5 + Math.random() * 1.4;
        ctx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let s2 = 0; s2 < 5; s2 += 1) {
          x += (Math.random() - 0.5) * 40;
          y += (Math.random() - 0.5) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { repeat: [6, 6] }
  );
}

function makeHazardTexture() {
  return createCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d8a13c';
      const stripe = 44;
      ctx.save();
      ctx.translate(-h, 0);
      ctx.rotate(-Math.PI / 4);
      for (let x = 0; x < w + h * 2; x += stripe * 2) {
        ctx.fillRect(x, 0, stripe, h * 2);
      }
      ctx.restore();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#000';
      for (let i = 0; i < 900; i += 1) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      ctx.globalAlpha = 1;
    },
    { repeat: [1, 1] }
  );
}

function makeLabelTexture(title, subtitle, accent = '#ffb765', options = {}) {
  const dark = options.dark !== false;
  return createCanvasTexture(
    1024,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = dark ? '#0c1013' : '#e8e2d4';
      ctx.fillRect(0, 0, w, h);
      // etched border
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 4;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.fillStyle = accent;
      ctx.fillRect(14, 14, 12, h - 28);

      ctx.textBaseline = 'middle';
      ctx.fillStyle = dark ? '#f3ede2' : '#1b1813';
      const titleSize = options.titleSize || 118;
      ctx.font = `700 ${titleSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.fillText(String(title).toUpperCase(), 66, h * 0.45);
      if (subtitle) {
        ctx.fillStyle = dark ? 'rgba(200,214,220,0.72)' : 'rgba(40,40,40,0.7)';
        ctx.font = `500 ${options.subtitleSize || 40}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        ctx.fillText(String(subtitle).toUpperCase(), 70, h * 0.78);
      }
      // subtle wear
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 500; i += 1) {
        ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1);
      }
      ctx.globalAlpha = 1;
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, anisotropy: 8 }
  );
}

function makeScreenTexture(kind, accent = '#5fe3ff', seed = 1) {
  const random = mulberry32(seed * 7919 + 13);
  return createCanvasTexture(
    512,
    320,
    (ctx, w, h) => {
      ctx.fillStyle = '#061014';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(120,200,220,0.10)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // header
      ctx.fillStyle = accent;
      ctx.font = '700 22px "IBM Plex Mono", Menlo, monospace';
      ctx.fillText(kind === 'latency' ? 'P99 LATENCY · EDGE' : kind === 'loss' ? 'TRAINING LOSS' : 'CLUSTER UTILISATION', 20, 32);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(20, 46);
      ctx.lineTo(w - 20, 46);
      ctx.stroke();

      if (kind === 'latency') {
        const bars = 22;
        for (let i = 0; i < bars; i += 1) {
          const bh = 30 + Math.sin(i * 0.7 + 1) * 18 + random() * 34;
          ctx.fillStyle = i > 16 ? '#ffb765' : accent;
          ctx.globalAlpha = 0.75;
          ctx.fillRect(24 + i * 21, h - 46 - bh, 12, bh);
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 60; i += 1) {
          const x = 24 + (i / 59) * (w - 48);
          const y = 130 + Math.sin(i * 0.4) * 18 + random() * 10;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (kind === 'loss') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 80; i += 1) {
          const x = 24 + (i / 79) * (w - 60);
          const y = 84 + Math.exp(-i * 0.055) * 150 + random() * 7;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,183,101,0.85)';
        ctx.font = '700 44px "IBM Plex Mono", Menlo, monospace';
        ctx.fillText('0.0412', 300, 108);
      } else {
        for (let i = 0; i < 14; i += 1) {
          const bh = 24 + random() * 110;
          ctx.fillStyle = i % 4 === 0 ? '#ffb765' : accent;
          ctx.globalAlpha = 0.65;
          ctx.fillRect(24 + i * 33, h - 40 - bh, 20, bh);
          ctx.globalAlpha = 1;
        }
      }

      // scanlines
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(140,230,255,0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );
}

function makeRadialGlowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  return createCanvasTexture(
    128,
    128,
    (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, inner);
      g.addColorStop(0.28, inner.replace(/,\s*[\d.]+\)$/, ',0.55)'));
      g.addColorStop(1, outer);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );
}

function makeCloudTexture() {
  return createCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 90; i += 1) {
        const x = w * 0.5 + (Math.random() - 0.5) * w * 0.6;
        const y = h * 0.5 + (Math.random() - 0.5) * h * 0.4;
        const r = 8 + Math.random() * 38;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.16)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );
}

/* ========================================================================== *
 *  GLSL helpers shared by the custom shaders
 * ========================================================================== */

const GLSL_NOISE = /* glsl */ `
  float aiHash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float aiHash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }
  float aiValueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = aiHash12(i);
    float b = aiHash12(i + vec2(1.0, 0.0));
    float c = aiHash12(i + vec2(0.0, 1.0));
    float d = aiHash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float aiFbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * aiValueNoise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return s;
  }
  float aiValueNoise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float n000 = aiHash13(i);
    float n100 = aiHash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = aiHash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = aiHash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = aiHash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = aiHash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = aiHash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = aiHash13(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
      mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
      u.z
    );
  }
  float aiFbm3(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * aiValueNoise3(p);
      p = p * 2.02 + vec3(11.7, 5.3, 8.9);
      a *= 0.5;
    }
    return s;
  }
  vec3 aiPalette(float t) {
    vec3 a = vec3(0.06, 0.13, 0.17);
    vec3 b = vec3(0.05, 0.55, 0.62);
    vec3 c = vec3(0.35, 0.95, 0.78);
    vec3 d = vec3(1.0, 0.63, 0.30);
    vec3 col = mix(a, b, smoothstep(0.0, 0.45, t));
    col = mix(col, c, smoothstep(0.4, 0.75, t));
    col = mix(col, d, smoothstep(0.75, 1.0, t));
    return col;
  }
`;

const GLSL_FOG = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  vec3 aiApplyFog(vec3 color, float dist) {
    float f = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    return mix(color, uFogColor, clamp(f, 0.0, 1.0));
  }
`;

/* ========================================================================== *
 *  Material library
 * ========================================================================== */

function createMaterialSet(ctx) {
  const { envMap, textures, uniforms } = ctx;

  const standard = (params) =>
    new THREE.MeshStandardMaterial({
      envMap,
      envMapIntensity: 0.9,
      ...params,
    });

  const mats = {};

  mats.steel = standard({ color: 0x9aa4ab, metalness: 0.94, roughness: 0.36, map: textures.brushed });
  mats.steelDark = standard({ color: 0x76828a, metalness: 0.86, roughness: 0.48 });
  mats.steelDeep = standard({ color: 0x404a52, metalness: 0.8, roughness: 0.55 });
  mats.painted = standard({ color: 0x66727a, metalness: 0.5, roughness: 0.66 });
  mats.paintedLight = standard({ color: 0x7d878d, metalness: 0.55, roughness: 0.58 });
  mats.copper = standard({ color: 0xc07348, metalness: 1.0, roughness: 0.3, envMapIntensity: 1.2 });
  mats.copperDark = standard({ color: 0x7d482c, metalness: 0.95, roughness: 0.42 });
  mats.brass = standard({ color: 0xd0a763, metalness: 1.0, roughness: 0.28 });
  mats.concrete = standard({ color: 0x8d9296, metalness: 0.04, roughness: 0.93, map: textures.concrete });
  mats.concreteDark = standard({ color: 0x4e555a, metalness: 0.04, roughness: 0.96, map: textures.concrete });
  mats.rubber = standard({ color: 0x101316, metalness: 0.1, roughness: 0.94 });
  mats.rack = standard({ color: 0x9aa4aa, metalness: 0.82, roughness: 0.44, map: textures.rack });
  mats.rackDark = standard({ color: 0x6b747b, metalness: 0.78, roughness: 0.52, map: textures.rack });
  mats.hazard = standard({ color: 0xffffff, metalness: 0.2, roughness: 0.7, map: textures.hazard });
  mats.screen = standard({
    color: 0x0a1013,
    metalness: 0.3,
    roughness: 0.35,
    map: textures.screen,
    emissive: 0xffffff,
    emissiveMap: textures.screen,
    emissiveIntensity: 0.85,
  });
  mats.screenWarm = standard({
    color: 0x100c09,
    metalness: 0.3,
    roughness: 0.35,
    map: textures.screenWarm,
    emissive: 0xffffff,
    emissiveMap: textures.screenWarm,
    emissiveIntensity: 0.85,
  });

  mats.glass = new THREE.MeshPhysicalMaterial({
    color: 0xa9d6e2,
    metalness: 0.0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.16,
    envMap,
    envMapIntensity: 1.6,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.glassEmerald = new THREE.MeshPhysicalMaterial({
    color: 0x6fe3c0,
    metalness: 0.0,
    roughness: 0.08,
    transparent: true,
    opacity: 0.15,
    envMap,
    envMapIntensity: 1.4,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.glassAmber = new THREE.MeshPhysicalMaterial({
    color: 0xffbe78,
    metalness: 0.0,
    roughness: 0.1,
    transparent: true,
    opacity: 0.15,
    envMap,
    envMapIntensity: 1.3,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.glassDark = new THREE.MeshPhysicalMaterial({
    color: 0x0d1418,
    metalness: 0.35,
    roughness: 0.12,
    transparent: true,
    opacity: 0.42,
    envMap,
    envMapIntensity: 1.2,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const emissive = (color, intensity = 1.5, base = 0x0a0f12) =>
    new THREE.MeshStandardMaterial({
      color: base,
      metalness: 0.2,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: intensity,
      envMap,
      envMapIntensity: 0.4,
    });

  mats.emitCyan = emissive(0x58dcff, 1.55);
  mats.emitTeal = emissive(0x35e6bf, 1.5);
  mats.emitAmber = emissive(0xffa84f, 1.7);
  mats.emitWarm = emissive(0xffd9a4, 1.35);
  mats.emitRed = emissive(0xff5c4a, 1.6);
  mats.emitViolet = emissive(0xa48bff, 1.4);
  mats.emitWhite = emissive(0xf4fbff, 1.45);

  mats.lamp = standard({ color: 0x1a1a16, metalness: 0.7, roughness: 0.4, emissive: 0xffd9a0, emissiveIntensity: 2.4 });

  mats.glow = {
    cyan: new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    amber: new THREE.MeshBasicMaterial({ color: 0xffb765, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    emerald: new THREE.MeshBasicMaterial({ color: 0x5ff0c8, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  };

  /* floor — a custom-shaded raised-access floor with perforation, seams,
     per-tile variation and glowing fibre seams. Uses the standard material so
     it still receives shadows and the station lights. */
  mats.floor = standard({
    color: 0x5f6971,
    metalness: 0.3,
    roughness: 0.38,
    envMapIntensity: 0.5,
  });
  attachFloorShader(mats.floor, uniforms);

  return mats;
}

function attachFloorShader(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.time;
    shader.uniforms.uSeamColor = uniforms.seamColor;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAiFloorWorld;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvAiFloorWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vAiFloorWorld;
         uniform float uTime;
         uniform vec3 uSeamColor;
         ${GLSL_NOISE}
         vec3 aiFloorPattern(vec3 wp, float t, out float roughOut, out float glowOut) {
           vec2 p = wp.xz;
           float tile = 0.6;
           vec2 cell = p / tile;
           vec2 f = fract(cell);
           vec2 id = floor(cell);

           // grout seams (two pixel-ish widths, anti-aliased)
           vec2 edge = min(f, 1.0 - f);
           float width = 0.035 + fwidth(p.x) * 0.9;
           float seam = 1.0 - smoothstep(width, width * 1.9, min(edge.x, edge.y));

           // perforation grid inside each tile — hex-staggered dots
           vec2 local = (f - 0.5) * tile;
           vec2 dotCell = local / 0.048;
           float row = floor(dotCell.y);
           dotCell.x += mod(row, 2.0) * 0.5;
           vec2 dotF = fract(dotCell) - 0.5;
           float dotDist = length(dotF);
           float aa = fwidth(dotCell.x) * 0.8 + 0.06;
           float hole = 1.0 - smoothstep(0.26 - aa, 0.34 + aa, dotDist);
           hole *= 1.0 - smoothstep(0.06, 0.14, min(edge.x, edge.y));

           // per-tile tone variation
           float idn = aiHash12(id);
           float tileTone = 0.86 + idn * 0.22;

           // wear streaks along the dominant travel direction
           float wear = aiFbm(p * 0.55) * 0.12 + aiFbm(p * 0.09 + 7.0) * 0.18;

           // glowing fibre seams every 8th line, running with a pulse in x
           vec2 lineId = floor(cell);
           float seamLane = 1.0 - step(0.5, mod(lineId.y, 8.0));
           float seamLine = seam * seamLane;
           float pulse = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(wp.x * 0.22 - t * 2.1), 6.0);
           float glow = seamLine * pulse * 0.20;

           // faint cyan light escaping the perforations
           float under = hole * (0.18 + 0.22 * sin(wp.x * 0.4 + t * 1.3));
           glow += under * 0.05;

           // fade the fine pattern with distance so it never aliases
           float detail = 1.0 - smoothstep(0.008, 0.045, fwidth(p.x));
           hole *= detail;
           seam = mix(seam, 0.55, 1.0 - detail);
           glow *= mix(0.35, 1.0, detail);

           vec3 col = vec3(tileTone) * (1.0 - seam * 0.55) * (1.0 - hole * 0.82);
           col *= 0.9 + wear;

           float rough = clamp(0.32 + hole * 0.35 + seam * 0.2 + wear * 0.4 - seamLine * 0.15, 0.0, 1.0);
           roughOut = rough;
           glowOut = glow;
           return col;
         }
        `
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         float aiRough = 0.4;
         float aiGlow = 0.0;
         vec3 aiFloorCol = aiFloorPattern(vAiFloorWorld, uTime, aiRough, aiGlow);
         diffuseColor.rgb *= aiFloorCol;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = clamp(mix(roughnessFactor, aiRough, 0.85), 0.03, 1.0);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += uSeamColor * aiGlow;`
      );
  };
  material.customProgramCacheKey = () => 'aiOpsFloor';
}

/* ========================================================================== *
 *  Geometry helpers
 * ========================================================================== */

function mergeParts(parts) {
  const geometries = [];
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();

  for (const part of parts) {
    let geo = part.geometry ? part.geometry.clone() : new THREE.BoxGeometry(part.w || 1, part.h || 1, part.d || 1);
    if (geo.index) geo = geo.toNonIndexed();
    euler.set(part.rx || 0, part.ry || 0, part.rz || 0);
    quat.setFromEuler(euler);
    scale.set(part.sx || 1, part.sy || 1, part.sz || 1);
    position.set(part.x || 0, part.y || 0, part.z || 0);
    matrix.compose(position, quat, scale);
    geo.applyMatrix4(matrix);
    geometries.push(geo);
  }

  let total = 0;
  for (const geo of geometries) total += geo.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uvs = new Float32Array(total * 2);
  let offset = 0;
  for (const geo of geometries) {
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    const uv = geo.attributes.uv;
    pos.set(p.array, offset * 3);
    if (n) nor.set(n.array, offset * 3);
    if (uv) uvs.set(uv.array, offset * 2);
    offset += p.count;
    geo.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.computeBoundingSphere();
  return merged;
}

function makeMesh(geometry, material, name) {
  const mesh = new THREE.Mesh(geometry, material);
  if (name) mesh.name = name;
  return mesh;
}

function box(w, h, d, material, x, y, z, ry = 0, name) {
  const mesh = makeMesh(new THREE.BoxGeometry(w, h, d), material, name);
  mesh.position.set(x, y, z);
  if (ry) mesh.rotation.y = ry;
  return mesh;
}

function tubeGeometry(points, radius, tubular = 48, radial = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.5);
  return new THREE.TubeGeometry(curve, tubular, radius, radial, closed);
}

function bezierArc(a, b, lift = 10, segments = 48) {
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  mid.y += lift;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  return curve.getPoints(segments);
}

function glowSprite(texture, color, size, opacity = 0.8) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}

function discGeometry(radius, segments = 32) {
  return new THREE.CircleGeometry(radius, segments);
}

function ringGeometry(inner, outer, segments = 64) {
  return new THREE.RingGeometry(inner, outer, segments);
}

function makeBoltStrip(parent, mat, from, to, count, radius = 0.035) {
  // small bolts / rivets along a line — cheap architectural detail
  const geo = new THREE.SphereGeometry(radius, 6, 4);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i += 1) {
    const t = count <= 1 ? 0 : i / (count - 1);
    m.makeTranslation(
      lerp(from[0], to[0], t),
      lerp(from[1], to[1], t),
      lerp(from[2], to[2], t)
    );
    inst.setMatrixAt(i, m);
  }
  inst.instanceMatrix.needsUpdate = true;
  parent.add(inst);
  return inst;
}

/* ========================================================================== *
 *  Quality presets
 * ========================================================================== */

const QUALITY_PRESETS = {
  high: {
    pixelRatioCap: 2,
    floorTiles: true,
    rackRows: 28,
    gpuSledsPerRack: 8,
    fanCount: 6,
    particleCount: 1.0,
    cableDetail: 1.0,
    shadowMapSize: 2048,
    earthSegments: 192,
    starCount: 2600,
    distantBuildings: 34,
  },
  medium: {
    pixelRatioCap: 1.5,
    floorTiles: true,
    rackRows: 22,
    gpuSledsPerRack: 6,
    fanCount: 4,
    particleCount: 0.7,
    cableDetail: 0.7,
    shadowMapSize: 1024,
    earthSegments: 128,
    starCount: 1700,
    distantBuildings: 24,
  },
  low: {
    pixelRatioCap: 1,
    floorTiles: true,
    rackRows: 16,
    gpuSledsPerRack: 4,
    fanCount: 3,
    particleCount: 0.45,
    cableDetail: 0.45,
    shadowMapSize: 0,
    earthSegments: 96,
    starCount: 1000,
    distantBuildings: 16,
  },
};

function resolveConfig(options = {}) {
  const quality = QUALITY_PRESETS[options.quality] ? options.quality : 'high';
  const preset = QUALITY_PRESETS[quality];
  const detectedPixelRatio =
    typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
  return {
    quality,
    ...preset,
    seed: Number.isFinite(options.seed) ? options.seed : 20261119,
    pixelRatio: Number.isFinite(options.pixelRatio) ? options.pixelRatio : Math.min(detectedPixelRatio, preset.pixelRatioCap),
    compositionShift: Number.isFinite(options.compositionShift) ? options.compositionShift : 0.24,
    manageFog: options.manageFog !== false,
    manageBackground: options.manageBackground !== false,
    shadows: options.shadows !== false && preset.shadowMapSize > 0,
    animate: options.animate !== false,
    viewportAspect: Number.isFinite(options.aspect) ? options.aspect : 16 / 9,
  };
}
/* ========================================================================== *
 *  Environment — sky, ground, skyline, and the architecture of the hall
 * ========================================================================== */

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const SKY_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform float uTime;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uAurora;
  uniform float uNight;
  ${GLSL_NOISE}

  void main() {
    vec3 dir = normalize(vDir);
    float up = clamp(dir.y, -1.0, 1.0);

    // base gradient: blue hour zenith into a dusty horizon, deepening to space
    vec3 horizon = mix(uHorizon, vec3(0.02, 0.045, 0.08), uNight);
    float t = pow(clamp(up, 0.0, 1.0), 0.52);
    vec3 col = mix(horizon, uZenith, t);

    // below the horizon: a dark ground haze, never pure black
    col = mix(col, uHorizon * 0.18, smoothstep(0.0, -0.22, up));

    // two directional horizon lobes (warm east, cool west) — volumetric glow
    float lobeA = pow(max(0.0, dot(normalize(vec3(1.0, 0.0, 0.25)), dir)), 6.0);
    float lobeB = pow(max(0.0, dot(normalize(vec3(-0.7, 0.0, -0.7)), dir)), 9.0);
    col += uGlow * lobeA * 0.55 * (1.0 - uNight * 0.85) * smoothstep(-0.05, 0.22, up);
    col += vec3(0.10, 0.24, 0.32) * lobeB * 0.35 * smoothstep(-0.05, 0.3, up);

    // thin illuminated haze right on the horizon line
    float horizonLine = exp(-pow(up / 0.07, 2.0));
    col += uGlow * horizonLine * 0.42 * (1.0 - uNight * 0.8);
    col += horizon * horizonLine * 0.30;

    // star field on a spherical grid
    vec2 suv = vec2(atan(dir.z, dir.x) * 0.1591549 + 0.5, asin(clamp(dir.y, -1.0, 1.0)) * 0.3183099 + 0.5);
    vec2 grid = suv * vec2(760.0, 380.0);
    vec2 gid = floor(grid);
    vec2 gf = fract(grid) - 0.5;
    float rnd = aiHash12(gid);
    float bright = step(0.982, rnd);
    float size = mix(0.10, 0.32, aiHash12(gid + 3.7));
    float star = bright * smoothstep(size, 0.0, length(gf));
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.3 + rnd * 3.1) + rnd * 61.0);
    float starMask = smoothstep(0.04, 0.28, up) * (1.0 - clamp(t * 0.75, 0.0, 0.7));
    col += vec3(0.82, 0.90, 1.0) * star * twinkle * starMask * 1.25;
    col += vec3(1.0, 0.86, 0.68) * bright * starMask * aiHash12(gid + 8.1) * 0.5;

    // a faint galactic band
    float bandY = up - (0.22 + 0.12 * sin(dir.x * 2.2 + dir.z * 1.3));
    float band = exp(-pow(bandY / 0.20, 2.0));
    float neb = aiFbm(vec2(atan(dir.z, dir.x) * 2.4, up * 5.0) + 3.0);
    col += vec3(0.22, 0.30, 0.55) * band * neb * 0.30 * smoothstep(0.0, 0.2, up);

    // high, slow aurora curtains, very restrained
    float aur = aiFbm(vec2(dir.x * 3.2 + uTime * 0.02, dir.z * 1.4 - up * 2.0));
    float curtain = smoothstep(0.25, 0.85, up) * smoothstep(0.35, 0.75, aur + 0.18 * sin(dir.x * 5.0 + uTime * 0.08));
    col += uAurora * curtain * 0.09;

    // low cloud deck catching the city glow
    float cloudH = smoothstep(0.0, 0.16, up) * (1.0 - smoothstep(0.16, 0.42, up));
    float cl = aiFbm(vec2(atan(dir.z, dir.x) * 5.0 + uTime * 0.004, up * 26.0));
    float clouds = smoothstep(0.52, 0.78, cl) * cloudH;
    col = mix(col, mix(uHorizon * 1.15, uGlow * 0.9, 0.4), clouds * 0.42);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function buildSky(ctx) {
  const uniforms = {
    uTime: ctx.uniforms.time,
    uZenith: { value: new THREE.Color(0x060d17) },
    uHorizon: { value: new THREE.Color(0x3d5768) },
    uGlow: { value: new THREE.Color(0xffa76a) },
    uAurora: { value: new THREE.Color(0x46e6c6) },
    uNight: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1600, 48, 32), material);
  mesh.name = 'AiOpsSky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  ctx.group.add(mesh);
  return { mesh, uniforms };
}

function buildGround(ctx) {
  const { mats, textures } = ctx;
  const group = new THREE.Group();
  group.name = 'AiOpsGround';

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x14181b,
    metalness: 0.25,
    roughness: 0.86,
    map: textures.concrete,
    envMap: ctx.envMap,
    envMapIntensity: 0.25,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600, 1, 1), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.42;
  ground.receiveShadow = true;
  ground.name = 'AiOpsApron';
  group.add(ground);

  // apron lanes: faint painted edges leading to the hall
  const laneMat = new THREE.MeshBasicMaterial({ color: 0x3c4a52, transparent: true, opacity: 0.5 });
  for (let i = -3; i <= 3; i += 1) {
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(560, 0.18), laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(-20, -0.39, 60 + i * 6);
    group.add(lane);
  }

  // runway lights along the approach
  const dotGeo = new THREE.SphereGeometry(0.16, 6, 4);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffc078 });
  const count = 70;
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i += 1) {
    const x = -265 + (i % 35) * 15;
    const z = 48 + Math.floor(i / 35) * 5;
    m.makeTranslation(x, -0.3, z);
    dots.setMatrixAt(i, m);
  }
  dots.instanceMatrix.needsUpdate = true;
  group.add(dots);

  ctx.group.add(group);
  return group;
}

function makeWindowTexture() {
  return createCanvasTexture(
    128,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#05080a';
      ctx.fillRect(0, 0, w, h);
      for (let y = 6; y < h - 6; y += 9) {
        for (let x = 6; x < w - 6; x += 11) {
          if (Math.random() > 0.68) {
            const warm = Math.random() > 0.55;
            ctx.fillStyle = warm ? 'rgba(255,196,120,0.85)' : 'rgba(150,220,255,0.7)';
            ctx.fillRect(x, y, 5, 3);
          }
        }
      }
    },
    { repeat: [1, 1] }
  );
}

function buildSkyline(ctx) {
  const random = mulberry32(ctx.cfg.seed + 41);
  const group = new THREE.Group();
  group.name = 'AiOpsSkyline';

  const windowTex = makeWindowTexture();
  if (windowTex) ctx.extraTextures.push(windowTex);
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x0d1216,
    metalness: 0.35,
    roughness: 0.7,
    map: windowTex || null,
    emissive: 0xffffff,
    emissiveMap: windowTex || null,
    emissiveIntensity: 1.1,
    envMap: ctx.envMap,
    envMapIntensity: 0.2,
  });

  const count = ctx.cfg.distantBuildings;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const buildings = new THREE.InstancedMesh(geo, buildingMat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  for (let i = 0; i < count; i += 1) {
    const south = random() > 0.35;
    const dist = randRange(random, 430, 980);
    const angle = south
      ? randRange(random, 0.18, 0.82) * Math.PI // south arc
      : randRange(random, 1.06, 1.94) * Math.PI; // north arc
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const h = randRange(random, 26, 120);
    const w = randRange(random, 16, 50);
    pos.set(x, h / 2 - 3, z);
    scl.set(w, h, w * randRange(random, 0.6, 1.4));
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), randRange(random, 0, Math.PI));
    m.compose(pos, q, scl);
    buildings.setMatrixAt(i, m);
  }
  buildings.instanceMatrix.needsUpdate = true;
  group.add(buildings);

  // two brutalist cooling towers far to the south-west
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x1b2024,
    metalness: 0.15,
    roughness: 0.9,
    envMap: ctx.envMap,
    envMapIntensity: 0.18,
  });
  const points = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    const r = 22 + 16 * Math.pow(t - 0.35, 2) * 2.4;
    points.push(new THREE.Vector2(Math.max(10, r), t * 92));
  }
  const towerGeo = new THREE.LatheGeometry(points, 28);
  for (const [x, z, s] of [
    [-520, 250, 1.0],
    [-380, 330, 0.78],
  ]) {
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(x, 0, z);
    tower.scale.setScalar(s);
    group.add(tower);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(22 * s, 0.5, 6, 40),
      new THREE.MeshBasicMaterial({ color: 0xff9a58, transparent: true, opacity: 0.4 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 92 * s, z);
    group.add(rim);
  }

  // a red-beaconed comms mast
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x1a1f23, metalness: 0.6, roughness: 0.5 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.6, 160, 6), mastMat);
  mast.position.set(360, 80, 300);
  group.add(mast);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff4a3a })
  );
  beacon.position.set(360, 161, 300);
  group.add(beacon);
  ctx.registerBlinker(beacon, 1.1);

  ctx.group.add(group);
  return group;
}

/* -------------------------------------------------------------------------- *
 *  Architectural shell — floor, columns, walls, trusses, trays, lamps
 * -------------------------------------------------------------------------- */

function buildFloor(ctx) {
  const { mats } = ctx;
  const hall = OPS_LAYOUT.hall;
  const group = new THREE.Group();
  group.name = 'AiOpsFloor';

  const slab = new THREE.Mesh(new THREE.BoxGeometry(hall.xMax - hall.xMin, 0.7, hall.zSouth - hall.zNorth), mats.concreteDark);
  slab.position.set((hall.xMin + hall.xMax) / 2, -0.36, (hall.zNorth + hall.zSouth) / 2);
  slab.receiveShadow = true;
  group.add(slab);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(hall.xMax - hall.xMin, hall.zSouth - hall.zNorth), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((hall.xMin + hall.xMax) / 2, 0.012, (hall.zNorth + hall.zSouth) / 2);
  floor.receiveShadow = true;
  floor.name = 'AiOpsRaisedFloor';
  group.add(floor);

  // raised-floor perimeter trim in copper
  const trimMat = mats.copper;
  for (const z of [hall.zNorth + 0.2, hall.zSouth - 0.2]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(hall.xMax - hall.xMin, 0.1, 0.22), trimMat);
    trim.position.set((hall.xMin + hall.xMax) / 2, 0.06, z);
    group.add(trim);
  }

  /* ---- illuminated under-floor trenches -------------------------------- */
  const trenchCenters = [-198, -108, -18, 96, 196];
  const trenchFrames = [];
  const barCountPerTrench = 118;
  const barGeo = new THREE.BoxGeometry(0.05, 0.035, 2.36);
  const bars = new THREE.InstancedMesh(barGeo, mats.steelDark, barCountPerTrench * trenchCenters.length);
  const m = new THREE.Matrix4();
  let barIndex = 0;
  const tubeGeo = new THREE.CylinderGeometry(0.055, 0.055, 18.4, 6, 1);
  for (let t = 0; t < trenchCenters.length; t += 1) {
    const cx = trenchCenters[t];
    const cz = 17.2;
    // frame
    const frameParts = [
      { w: 19.2, h: 0.12, d: 0.14, x: cx, y: 0.045, z: cz - 1.24 },
      { w: 19.2, h: 0.12, d: 0.14, x: cx, y: 0.045, z: cz + 1.24 },
      { w: 0.14, h: 0.12, d: 2.62, x: cx - 9.55, y: 0.045, z: cz },
      { w: 0.14, h: 0.12, d: 2.62, x: cx + 9.55, y: 0.045, z: cz },
    ];
    trenchFrames.push(...frameParts);
    // dark cavity
    const cavity = new THREE.Mesh(new THREE.PlaneGeometry(19.1, 2.3), new THREE.MeshBasicMaterial({ color: 0x03070a }));
    cavity.rotation.x = -Math.PI / 2;
    cavity.position.set(cx, 0.03, cz);
    group.add(cavity);
    // glowing fibre conduits below the grate
    for (let i = 0; i < 6; i += 1) {
      const tube = new THREE.Mesh(tubeGeo, i % 3 === 0 ? mats.emitAmber : i % 3 === 1 ? mats.emitCyan : mats.emitTeal);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(cx, 0.075, cz - 0.95 + i * 0.38);
      group.add(tube);
    }
    // gratings
    for (let b = 0; b < barCountPerTrench; b += 1) {
      m.makeTranslation(cx - 9.4 + (b / (barCountPerTrench - 1)) * 18.8, 0.125, cz);
      bars.setMatrixAt(barIndex, m);
      barIndex += 1;
    }
  }
  bars.instanceMatrix.needsUpdate = true;
  bars.castShadow = false;
  group.add(bars);
  const trenchMesh = new THREE.Mesh(mergeParts(trenchFrames), mats.copperDark);
  group.add(trenchMesh);

  /* ---- hazard chevrons marking service crossings ----------------------- */
  const chevron = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), mats.hazard);
  chevron.rotation.x = -Math.PI / 2;
  chevron.position.set(-52, 0.02, 26);
  group.add(chevron);
  const chevron2 = chevron.clone();
  chevron2.position.set(52, 0.02, 26);
  group.add(chevron2);

  ctx.group.add(group);
  return group;
}

function buildStructure(ctx) {
  const { mats } = ctx;
  const hall = OPS_LAYOUT.hall;
  const group = new THREE.Group();
  group.name = 'AiOpsStructure';

  /* ---- I-beam columns, both colonnades -------------------------------- */
  const beamGeo = mergeParts([
    { w: 0.92, h: 18, d: 0.1, x: 0, y: 9, z: -0.4 },
    { w: 0.92, h: 18, d: 0.1, x: 0, y: 9, z: 0.4 },
    { w: 0.12, h: 18, d: 0.7, x: 0, y: 9, z: 0 },
    { w: 0.6, h: 0.55, d: 1.2, x: 0, y: 17.6, z: 0 }, // capital
  ]);
  const columnPositions = [];
  for (let x = hall.xMin + 12; x <= hall.xMax - 6; x += 24) {
    columnPositions.push([x, hall.zNorth + 5.5], [x, hall.zSouth - 5.5]);
  }
  const columns = new THREE.InstancedMesh(beamGeo, mats.steelDark, columnPositions.length);
  columns.castShadow = true;
  columns.receiveShadow = true;
  const m = new THREE.Matrix4();
  columnPositions.forEach(([x, z], i) => {
    m.makeTranslation(x, 0, z);
    columns.setMatrixAt(i, m);
  });
  columns.instanceMatrix.needsUpdate = true;
  group.add(columns);

  const plinthGeo = new THREE.BoxGeometry(1.9, 0.55, 1.9);
  const plinths = new THREE.InstancedMesh(plinthGeo, mats.concrete, columnPositions.length);
  const collarGeo = new THREE.BoxGeometry(2.0, 0.08, 2.0);
  const collars = new THREE.InstancedMesh(collarGeo, mats.copper, columnPositions.length);
  columnPositions.forEach(([x, z], i) => {
    m.makeTranslation(x, 0.27, z);
    plinths.setMatrixAt(i, m);
    m.makeTranslation(x, 0.57, z);
    collars.setMatrixAt(i, m);
  });
  plinths.instanceMatrix.needsUpdate = true;
  collars.instanceMatrix.needsUpdate = true;
  group.add(plinths);
  group.add(collars);

  /* ---- north wall: ribbed concrete with light slots -------------------- */
  const wallZ = hall.zNorth;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(hall.xMax - hall.xMin, 19, 0.8), mats.concrete);
  wall.position.set((hall.xMin + hall.xMax) / 2, 9.5, wallZ - 0.4);
  wall.receiveShadow = true;
  group.add(wall);

  const ribGeo = new THREE.BoxGeometry(0.35, 17.6, 0.55);
  const ribCount = Math.floor((hall.xMax - hall.xMin) / 2.4);
  const ribs = new THREE.InstancedMesh(ribGeo, mats.concreteDark, ribCount);
  for (let i = 0; i < ribCount; i += 1) {
    m.makeTranslation(hall.xMin + 1.2 + i * 2.4, 9, wallZ + 0.28);
    ribs.setMatrixAt(i, m);
  }
  ribs.instanceMatrix.needsUpdate = true;
  group.add(ribs);

  // three continuous light slots in the wall (warm, low intensity)
  const slotMat = new THREE.MeshStandardMaterial({
    color: 0x120d08,
    metalness: 0.2,
    roughness: 0.5,
    emissive: 0xffb877,
    emissiveIntensity: 1.05,
  });
  ctx.trackMaterial(slotMat);
  for (const y of [4.2, 9.4, 14.6]) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(hall.xMax - hall.xMin - 2, 0.13, 0.1), slotMat);
    slot.position.set((hall.xMin + hall.xMax) / 2, y, wallZ + 0.58);
    group.add(slot);
  }

  /* ---- south parapet and colonnade railing ----------------------------- */
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(hall.xMax - hall.xMin, 1.15, 0.45), mats.concrete);
  parapet.position.set((hall.xMin + hall.xMax) / 2, 0.57, hall.zSouth - 0.6);
  parapet.receiveShadow = true;
  group.add(parapet);
  const handrail = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, hall.xMax - hall.xMin, 8), mats.brass);
  handrail.rotation.z = Math.PI / 2;
  handrail.position.set((hall.xMin + hall.xMax) / 2, 1.2, hall.zSouth - 0.6);
  group.add(handrail);

  // balcony walkway outside the colonnade
  const balcony = new THREE.Mesh(new THREE.BoxGeometry(hall.xMax - hall.xMin, 0.4, 10), mats.concreteDark);
  balcony.position.set((hall.xMin + hall.xMax) / 2, -0.2, hall.zSouth + 5.2);
  balcony.receiveShadow = true;
  group.add(balcony);

  /* ---- roof trusses ---------------------------------------------------- */
  const trussParts = [
    { w: 0.22, h: 0.22, d: 72, x: 0, y: 17.4, z: 0 },
    { w: 0.22, h: 0.22, d: 72, x: 0, y: 19.4, z: 0 },
  ];
  for (let z = -34; z <= 34; z += 4.4) {
    trussParts.push({ w: 0.14, h: 2.0, d: 0.14, x: 0, y: 18.4, z });
    trussParts.push({ w: 0.11, h: 0.11, d: 4.55, x: 0, y: 18.4, z: z + 2.2, rx: Math.atan2(2.0, 4.4) });
  }
  const trussGeo = mergeParts(trussParts);
  const trussCount = Math.floor((hall.xMax - hall.xMin) / 12);
  const trusses = new THREE.InstancedMesh(trussGeo, mats.steelDeep, trussCount);
  trusses.castShadow = true;
  for (let i = 0; i < trussCount; i += 1) {
    m.makeTranslation(hall.xMin + 6 + i * 12, 0, 0);
    trusses.setMatrixAt(i, m);
  }
  trusses.instanceMatrix.needsUpdate = true;
  group.add(trusses);

  /* ---- roof: solid panels either side of a long skylight ---------------- */
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x333b41,
    metalness: 0.55,
    roughness: 0.62,
    envMap: ctx.envMap,
    envMapIntensity: 0.35,
  });
  for (const [z0, z1] of [[-36, -8], [8, 36]]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(hall.xMax - hall.xMin, 0.3, Math.abs(z1 - z0)), roofMat);
    panel.position.set((hall.xMin + hall.xMax) / 2, 19.7, (z0 + z1) / 2);
    group.add(panel);
  }
  const skylight = new THREE.Mesh(
    new THREE.PlaneGeometry(hall.xMax - hall.xMin, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0x2a4a5a,
      metalness: 0.2,
      roughness: 0.15,
      transparent: true,
      opacity: 0.32,
      envMap: ctx.envMap,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
    })
  );
  skylight.rotation.x = Math.PI / 2;
  skylight.position.set((hall.xMin + hall.xMax) / 2, 19.72, 0);
  group.add(skylight);

  // skylight mullions
  const mullionGeo = new THREE.BoxGeometry(0.16, 0.18, 16);
  const mullions = new THREE.InstancedMesh(mullionGeo, mats.steelDark, trussCount);
  for (let i = 0; i < trussCount; i += 1) {
    m.makeTranslation(hall.xMin + 6 + i * 12, 19.6, 0);
    mullions.setMatrixAt(i, m);
  }
  mullions.instanceMatrix.needsUpdate = true;
  group.add(mullions);

  /* ---- overhead cable trays with bundled fibre -------------------------- */
  const trayY = 13.4;
  const trayZs = [-27, 27];
  const trayRailGeo = new THREE.BoxGeometry(hall.xMax - hall.xMin - 18, 0.16, 0.1);
  const rungPerTray = Math.floor((hall.xMax - hall.xMin) / 0.55);
  const rungGeo = new THREE.BoxGeometry(0.06, 0.05, 1.5);
  const conduits = [
    { color: 0xb2653a, r: 0.105, off: -0.5 },
    { color: 0x2f6a63, r: 0.085, off: -0.2 },
    { color: 0x1d2a30, r: 0.12, off: 0.06 },
    { color: 0xb2653a, r: 0.075, off: 0.3 },
    { color: 0x24404a, r: 0.09, off: 0.55 },
  ];
  for (const tz of trayZs) {
    for (const side of [-0.82, 0.82]) {
      const rail = new THREE.Mesh(trayRailGeo, mats.steel);
      rail.position.set((hall.xMin + hall.xMax) / 2, trayY, tz + side);
      group.add(rail);
    }
    const rungs = new THREE.InstancedMesh(rungGeo, mats.steelDark, rungPerTray);
    for (let i = 0; i < rungPerTray; i += 1) {
      m.makeTranslation(hall.xMin + 10 + i * 0.55, trayY - 0.08, tz);
      rungs.setMatrixAt(i, m);
    }
    rungs.instanceMatrix.needsUpdate = true;
    group.add(rungs);

    // sagging fibre bundles
    for (const c of conduits) {
      const points = [];
      for (let x = hall.xMin + 12; x <= hall.xMax - 6; x += 12) {
        points.push(new THREE.Vector3(x, trayY + 0.12, tz + c.off));
        points.push(new THREE.Vector3(x + 6, trayY - 0.16, tz + c.off * 1.05));
      }
      points.push(new THREE.Vector3(hall.xMax - 6, trayY + 0.12, tz + c.off));
      const geo = tubeGeometry(points, c.r, 340, 5);
      const mat = new THREE.MeshStandardMaterial({
        color: c.color,
        metalness: 0.55,
        roughness: 0.55,
        envMap: ctx.envMap,
        envMapIntensity: 0.5,
      });
      ctx.trackMaterial(mat);
      group.add(new THREE.Mesh(geo, mat));
    }
  }

  /* ---- hanging industrial lamps ---------------------------------------- */
  const lampXs = [];
  for (let x = hall.xMin + 18; x <= hall.xMax - 12; x += 24) lampXs.push(x);
  const shadeGeo = new THREE.ConeGeometry(1.25, 0.9, 18, 1, true);
  const shades = new THREE.InstancedMesh(shadeGeo, mats.steelDark, lampXs.length);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.24, 10, 8), mats.emitWarm, lampXs.length);
  const rods = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 5), mats.steelDark, lampXs.length);
  lampXs.forEach((x, i) => {
    m.makeTranslation(x, 12.1, 0);
    shades.setMatrixAt(i, m);
    m.makeTranslation(x, 11.72, 0);
    bulbs.setMatrixAt(i, m);
    m.makeTranslation(x, 13.4, 0);
    rods.setMatrixAt(i, m);
  });
  shades.instanceMatrix.needsUpdate = true;
  bulbs.instanceMatrix.needsUpdate = true;
  rods.instanceMatrix.needsUpdate = true;
  shades.castShadow = false;
  group.add(shades);
  group.add(bulbs);
  group.add(rods);

  // soft pools of light beneath the lamps (merged additive quads)
  const poolParts = lampXs.map((x) => ({
    geometry: new THREE.PlaneGeometry(7.5, 7.5),
    x,
    y: 0.035,
    z: 0,
    rx: -Math.PI / 2,
  }));
  const poolGeo = mergeParts(poolParts);
  const poolTex = ctx.textures.radial;
  const poolMat = new THREE.MeshBasicMaterial({
    map: poolTex,
    color: 0xffc98a,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pools = new THREE.Mesh(poolGeo, poolMat);
  group.add(pools);

  // volumetric cones under the lamps
  const coneParts = lampXs.map((x) => ({
    geometry: new THREE.ConeGeometry(2.9, 6.4, 18, 1, true),
    x,
    y: 8.6,
    z: 0,
  }));
  const coneGeo = mergeParts(coneParts);
  const coneMat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      uniform vec3 uColor;
      uniform float uTime;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float edge = 1.0 - abs(dot(normalize(vNormalW), viewDir));
        float fade = pow(clamp(vUv.y, 0.0, 1.0), 1.5);
        float flicker = 0.92 + 0.08 * sin(uTime * 2.3 + vWorld.x * 0.2);
        float alpha = fade * (0.16 + 0.5 * edge) * 0.30 * flicker;
        gl_FragColor = vec4(uColor * (0.6 + edge * 0.6), alpha);
      }
    `,
    uniforms: { uColor: { value: new THREE.Color(0xffc98a) }, uTime: ctx.uniforms.time },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  ctx.trackMaterial(coneMat);
  const cones = new THREE.Mesh(coneGeo, coneMat);
  cones.renderOrder = 2;
  group.add(cones);

  ctx.group.add(group);
  return group;
}

/* -------------------------------------------------------------------------- *
 *  Station signage — physical suspended plates, not floating HUD text
 * -------------------------------------------------------------------------- */

function buildSignage(ctx) {
  const group = new THREE.Group();
  group.name = 'AiOpsSignage';
  const mats = ctx.mats;
  const entries = [
    ['01', 'INGESTION', '#6fe3ff'],
    ['02', 'ATTENTION CORE', '#ffc078'],
    ['03', 'GPU CLUSTER', '#5ff0c8'],
    ['04', 'BUILD GANTRY', '#ffb765'],
    ['05', 'SERVICE MESH', '#7fe8ff'],
    ['06', 'GLOBAL EDGE', '#ffd6a0'],
  ];
  const xs = [-215, -120, -24, 85, 180, 232];
  entries.forEach(([num, title, accent], i) => {
    const tex = makeLabelTexture(title, `STATION ${num}`, accent, { titleSize: 96, subtitleSize: 38 });
    if (tex) ctx.extraTextures.push(tex);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.35,
      color: 0x2a2f33,
      metalness: 0.4,
      roughness: 0.55,
      envMap: ctx.envMap,
      envMapIntensity: 0.4,
    });
    ctx.trackMaterial(mat);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 4.4), mat);
    panel.position.set(xs[i], 10.4, -24.5);
    group.add(panel);
    // frame + hangers
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.32, 4.62), mats.steelDark);
    frame.position.copy(panel.position);
    frame.position.x -= 0.03;
    group.add(frame);
    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), mats.steel);
    hanger.position.set(xs[i], 11.9, -24.5);
    group.add(hanger);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 4.4), mats.steelDark);
    bar.position.set(xs[i], 13.05, -24.5);
    group.add(bar);
  });
  ctx.group.add(group);
  return group;
}
/* ========================================================================== *
 *  Station 01 — Data Ingestion & Feature Lake
 * ========================================================================== */

const CONDUIT_FLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const CONDUIT_FLOW_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uBase;
  uniform float uSpeed;
  uniform float uDensity;
  uniform float uIntensity;
  ${GLSL_FOG}
  void main() {
    float lane = vUv.y * uDensity;
    float t = fract(lane - uTime * uSpeed);
    float head = smoothstep(0.90, 0.985, t) * smoothstep(1.0, 0.975, t);
    float trail = smoothstep(0.55, 0.95, t) * (1.0 - smoothstep(0.95, 1.0, t));
    float dash = head * 2.6 + trail * 0.55;
    float base = 0.07 + 0.05 * sin(vUv.y * 60.0 + uTime * 3.0);
    float filament = pow(0.5 + 0.5 * sin(vUv.x * 6.2831 * 10.0), 8.0) * 0.10;
    vec3 col = uBase * (0.55 + filament) + uColor * (base + filament + dash * 2.4) * uIntensity;
    float dist = length(cameraPosition - vWorld);
    col = aiApplyFog(col, dist);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeConduitMaterial(ctx, color, speed = 1.0, density = 4.0, intensity = 1.0) {
  const material = new THREE.ShaderMaterial({
    vertexShader: CONDUIT_FLOW_VERT,
    fragmentShader: CONDUIT_FLOW_FRAG,
    uniforms: {
      uTime: ctx.uniforms.time,
      uColor: { value: new THREE.Color(color) },
      uBase: { value: new THREE.Color(0x1c2429) },
      uSpeed: { value: speed },
      uDensity: { value: density },
      uIntensity: { value: intensity },
      uFogColor: ctx.uniforms.fogColor,
      uFogDensity: ctx.uniforms.fogDensity,
    },
    fog: false,
  });
  ctx.trackMaterial(material);
  return material;
}

function buildIngestion(ctx) {
  const { mats, cfg } = ctx;
  const random = mulberry32(cfg.seed + 101);
  const group = new THREE.Group();
  group.name = 'AiOpsStation01Ingestion';

  const baseX = OPS_LAYOUT.stations.ingest.x;

  /* ---- monumental intake portal --------------------------------------- */
  const portalParts = [];
  for (const z of [-14, 14]) {
    portalParts.push({ w: 2.6, h: 14.4, d: 2.6, x: baseX, y: 7.2, z });
    portalParts.push({ w: 3.4, h: 0.7, d: 3.4, x: baseX, y: 0.35, z });
    portalParts.push({ w: 3.2, h: 0.5, d: 3.2, x: baseX, y: 14.35, z });
    // stepped capital
    portalParts.push({ w: 3.0, h: 0.5, d: 3.0, x: baseX, y: 12.9, z });
  }
  portalParts.push({ w: 3.0, h: 1.5, d: 30.6, x: baseX, y: 14.9, z: 0 });
  portalParts.push({ w: 2.2, h: 0.35, d: 31.4, x: baseX, y: 15.8, z: 0 });
  const portal = new THREE.Mesh(mergeParts(portalParts), mats.concrete);
  portal.castShadow = true;
  portal.receiveShadow = true;
  group.add(portal);

  // copper fins on the inner faces of the pylons
  const finGeo = new THREE.BoxGeometry(0.09, 12.4, 1.9);
  const fins = new THREE.InstancedMesh(finGeo, mats.copper, 20);
  const m = new THREE.Matrix4();
  let fi = 0;
  for (const z of [-12.6, 12.6]) {
    for (let i = 0; i < 10; i += 1) {
      m.makeTranslation(baseX, 7.2, z + (i - 4.5) * 0.35);
      fins.setMatrixAt(fi, m);
      fi += 1;
    }
  }
  fins.instanceMatrix.needsUpdate = true;
  group.add(fins);

  // recessed light bar under the lintel and a hazard band at its base
  const lintelHousing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 26.5), mats.steelDark);
  lintelHousing.position.set(baseX - 1.05, 14.05, 0);
  group.add(lintelHousing);
  const lintelLight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 25.6), mats.emitAmber);
  lintelLight.position.set(baseX - 1.4, 13.86, 0);
  group.add(lintelLight);
  const lintelLight2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 25.0), mats.emitCyan);
  lintelLight2.position.set(baseX - 1.55, 15.62, 0);
  group.add(lintelLight2);
  for (const z of [-14, 14]) {
    const uplight = new THREE.PointLight(0xffb066, 45, 16, 2);
    uplight.position.set(baseX - 2.2, 1.6, z);
    group.add(uplight);
  }

  /* ---- six fibre lanes through the portal ------------------------------ */
  const laneZs = [-10, -6, -2, 2, 6, 10];
  const laneStart = -262;
  const laneEnd = -190;
  const laneLength = laneEnd - laneStart;
  const laneMid = (laneStart + laneEnd) / 2;
  const jacketGeo = new THREE.CylinderGeometry(0.34, 0.34, laneLength, 16, 1, false);
  const collarGeo = new THREE.TorusGeometry(0.37, 0.055, 6, 14);
  const collars = new THREE.InstancedMesh(collarGeo, mats.brass, laneZs.length * 13);
  let collarIndex = 0;
  const cm = new THREE.Matrix4();
  const qc = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  const sc = new THREE.Vector3(1, 1, 1);

  const flowMats = [];
  laneZs.forEach((z, i) => {
    const flowMat = makeConduitMaterial(ctx, i % 2 ? 0x6fe3ff : 0xffb765, 1.1 + i * 0.07, 24, 0.95);
    flowMats.push(flowMat);
    const jacket = new THREE.Mesh(jacketGeo, flowMat);
    jacket.rotation.z = Math.PI / 2;
    jacket.position.set(laneMid, 2.35, z);
    jacket.castShadow = true;
    group.add(jacket);

    // bolted collars every few metres
    for (let c = 0; c < 13; c += 1) {
      cm.compose(
        new THREE.Vector3(laneStart + 3 + c * 5.2, 2.35, z),
        qc,
        sc
      );
      collars.setMatrixAt(collarIndex, cm);
      collarIndex += 1;
    }

    // saddle supports
    for (let s = laneStart + 5; s < laneEnd; s += 7.5) {
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 1.0), mats.steelDark);
      saddle.position.set(s, 1.72, z);
      group.add(saddle);
    }

    // lane indicator lamp at the portal face
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.5), i % 2 ? mats.emitCyan : mats.emitAmber);
    lamp.position.set(baseX - 1.45, 3.35, z);
    group.add(lamp);
  });
  collars.instanceMatrix.needsUpdate = true;
  group.add(collars);

  /* ---- travelling data packets ----------------------------------------- */
  const packetCount = Math.round(120 * cfg.particleCount);
  const packetGeo = new THREE.CapsuleGeometry(0.12, 0.6, 4, 8);
  const packetMat = new THREE.MeshBasicMaterial({ color: 0xd8fff4 });
  const packets = new THREE.InstancedMesh(packetGeo, packetMat, packetCount);
  packets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const packetState = [];
  for (let i = 0; i < packetCount; i += 1) {
    packetState.push({
      lane: Math.floor(random() * laneZs.length),
      t: random(),
      speed: randRange(random, 0.055, 0.115),
    });
  }
  group.add(packets);
  ctx.addAnimation((elapsed) => {
    const dummy = ctx.scratch.matrix;
    const q = ctx.scratch.quat;
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    for (let i = 0; i < packetCount; i += 1) {
      const s = packetState[i];
      const t = (s.t + elapsed * s.speed) % 1;
      const x = laneStart + 3 + t * (laneLength - 6);
      dummy.compose(
        new THREE.Vector3(x, 2.35, laneZs[s.lane]),
        q,
        new THREE.Vector3(1, 1, 1)
      );
      packets.setMatrixAt(i, dummy);
    }
    packets.instanceMatrix.needsUpdate = true;
  });

  /* ---- manifold where the lanes slow down ------------------------------ */
  const manifold = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.2, 26.4), mats.steelDark);
  manifold.position.set(-188, 2.6, 0);
  manifold.castShadow = true;
  group.add(manifold);
  for (const z of laneZs) {
    const port = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 8, 18), mats.brass);
    port.position.set(-186.35, 2.35, z);
    port.rotation.y = Math.PI / 2;
    group.add(port);
    const glowPort = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16), mats.glow.cyan);
    glowPort.position.set(-186.3, 2.35, z);
    glowPort.rotation.y = Math.PI / 2;
    group.add(glowPort);
  }
  // status screen on the manifold
  const mScreen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.8), mats.screen);
  mScreen.position.set(-186.35, 6.2, 0);
  mScreen.rotation.y = Math.PI / 2;
  group.add(mScreen);

  /* ---- glass buffer vaults --------------------------------------------- */
  const vaultZs = [-24, -18, -12];
  const vaultRingMat = new THREE.MeshStandardMaterial({
    color: 0x07161a,
    metalness: 0.35,
    roughness: 0.4,
    emissive: 0x2fbfb0,
    emissiveIntensity: 0.30,
    envMap: ctx.envMap,
    envMapIntensity: 0.6,
  });
  const vaultRingMatWarm = vaultRingMat.clone();
  vaultRingMatWarm.emissive = new THREE.Color(0xffb066);
  ctx.trackMaterial(vaultRingMat);
  ctx.trackMaterial(vaultRingMatWarm);
  const vaultGroup = new THREE.Group();
  vaultZs.forEach((z, vi) => {
    const vx = -196;
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.2, 1.1, 20), mats.concreteDark);
    plinth.position.set(vx, 0.55, z);
    vaultGroup.add(plinth);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.09, 8, 36), mats.brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(vx, 1.12, z);
    vaultGroup.add(ring);

    const glass = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 7.2, 28, 1, true), vi % 2 ? mats.glassEmerald : mats.glass);
    glass.position.set(vx, 4.85, z);
    vaultGroup.add(glass);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.62, 2.42, 0.5, 24), mats.steel);
    cap.position.set(vx, 8.6, z);
    vaultGroup.add(cap);
    const capGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 18), mats.emitWarm);
    capGlow.position.set(vx, 8.88, z);
    vaultGroup.add(capGlow);

    // stacked memory rings, merged into one emissive mesh
    const discs = [];
    for (let d = 0; d < 9; d += 1) {
      discs.push({
        geometry: new THREE.TorusGeometry(1.86 - d * 0.04, 0.06, 6, 34),
        x: 0,
        y: 2.1 + d * 0.66,
        z: 0,
        rx: Math.PI / 2,
      });
    }
    discs.push({ geometry: new THREE.CylinderGeometry(0.26, 0.26, 6.2, 10), x: 0, y: 4.9, z: 0 });
    const discMesh = new THREE.Mesh(mergeParts(discs), vi === 1 ? vaultRingMatWarm : vaultRingMat);
    discMesh.position.set(vx, 0, z);
    vaultGroup.add(discMesh);

    // vertical support rods
    for (let r = 0; r < 4; r += 1) {
      const a = (r / 4) * Math.PI * 2 + 0.4;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 7.4, 6), mats.steel);
      rod.position.set(vx + Math.cos(a) * 2.25, 4.9, z + Math.sin(a) * 2.25);
      vaultGroup.add(rod);
    }

    // feed pipe from the manifold to the vault
    const feed = tubeGeometry([
      new THREE.Vector3(-186.6, 5.0, z * 0.5),
      new THREE.Vector3(-189.5, 5.4, z * 0.7),
      new THREE.Vector3(-193, 6.4, z),
      new THREE.Vector3(-196, 7.9, z),
    ], 0.13, 24, 6);
    vaultGroup.add(new THREE.Mesh(feed, mats.copper));
  });
  group.add(vaultGroup);

  /* ---- vector-embedding prisms ----------------------------------------- */
  const prismGroup = new THREE.Group();
  const prismSpots = [
    [-208, 20.5, 0.0],
    [-203, 18.2, 0.45],
    [-201.5, 23.5, -0.35],
    [-196.5, 20.8, 1.1],
    [-212, 24.5, -0.9],
    [-214, 17.5, 0.7],
  ];
  prismSpots.forEach(([x, z, phase], i) => {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 2.4, 12), mats.brass);
    ped.position.set(x, 1.2, z);
    ped.castShadow = true;
    prismGroup.add(ped);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 6, 18), mats.copperDark);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(x, 2.35, z);
    prismGroup.add(collar);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.0, 0),
      i % 2 ? mats.glassAmber : mats.glassEmerald
    );
    crystal.scale.set(1, 3.4, 1);
    crystal.position.set(x, 5.0, z);
    prismGroup.add(crystal);
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      i % 2 ? mats.emitAmber : mats.emitTeal
    );
    core.scale.set(1, 3.4, 1);
    core.position.copy(crystal.position);
    prismGroup.add(core);

    ctx.addAnimation((elapsed) => {
      crystal.rotation.y = elapsed * 0.28 + phase * 2.0;
      core.rotation.y = -elapsed * 0.42 + phase;
      crystal.position.y = 5.0 + Math.sin(elapsed * 0.9 + phase) * 0.12;
      core.position.y = crystal.position.y;
    });
  });

  // a low light strip that washes the prism cluster
  const wash = new THREE.Mesh(new THREE.PlaneGeometry(20, 5), new THREE.MeshBasicMaterial({
    map: ctx.textures.radial, color: 0x5fe3ff, transparent: true, opacity: 0.14,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  wash.rotation.x = -Math.PI / 2;
  wash.position.set(-205, 0.05, 21);
  prismGroup.add(wash);
  group.add(prismGroup);

  /* ---- feature lake: a still pool of embedding vectors ------------------ */
  const lakeUniforms = {
    uTime: ctx.uniforms.time,
    uColorA: { value: new THREE.Color(0x03161c) },
    uColorB: { value: new THREE.Color(0x35d6c0) },
    uFogColor: ctx.uniforms.fogColor,
    uFogDensity: ctx.uniforms.fogDensity,
  };
  const lakeMat = new THREE.ShaderMaterial({
    uniforms: lakeUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      varying vec3 vWorld;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      ${GLSL_NOISE}
      ${GLSL_FOG}
      void main() {
        vec2 p = vUv * 12.0;
        float n = aiFbm(p * 0.9 + vec2(uTime * 0.09, -uTime * 0.06));
        float ring = sin(length(p - vec2(6.0)) * 4.2 - uTime * 1.6) * 0.5 + 0.5;
        float glow = smoothstep(0.55, 0.9, n) * 0.55 + pow(ring, 5.0) * 0.20;
        vec3 col = mix(uColorA, uColorB, clamp(n * 0.9 + glow * 0.5, 0.0, 1.0));
        // soft edge
        float edge = smoothstep(0.0, 0.09, vUv.x) * smoothstep(1.0, 0.91, vUv.x) * smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
        col *= edge;
        col = aiApplyFog(col, length(cameraPosition - vWorld));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    fog: false,
  });
  ctx.trackMaterial(lakeMat);
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(13, 8), lakeMat);
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(-232, 0.05, 20.5);
  group.add(lake);
  const lakeRim = mergeParts([
    { w: 13.6, h: 0.28, d: 0.3, x: 0, y: 0.14, z: -4.15 },
    { w: 13.6, h: 0.28, d: 0.3, x: 0, y: 0.14, z: 4.15 },
    { w: 0.3, h: 0.28, d: 8.3, x: -6.65, y: 0.14, z: 0 },
    { w: 0.3, h: 0.28, d: 8.3, x: 6.65, y: 0.14, z: 0 },
  ]);
  const rim = new THREE.Mesh(lakeRim, mats.copper);
  rim.position.set(-232, 0, 20.5);
  group.add(rim);

  // an overhead fibre tray tucked against the north wall, behind the vaults
  const trayRun = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const points = [
      new THREE.Vector3(-252, 5.6, -30 + i * 0.16),
      new THREE.Vector3(-232, 5.8, -30.5 + i * 0.16),
      new THREE.Vector3(-212, 6.2, -31 + i * 0.16),
      new THREE.Vector3(-194, 6.9, -28 + i * 0.16),
      new THREE.Vector3(-190, 7.2, -22 + i * 0.16),
    ];
    trayRun.add(new THREE.Mesh(tubeGeometry(points, 0.085, 44, 6), i % 2 ? mats.copper : mats.copperDark));
  }
  const trayRail = new THREE.Mesh(new THREE.BoxGeometry(64, 0.12, 1.2), mats.steelDark);
  trayRail.position.set(-221, 6.0, -30.5);
  trayRun.add(trayRail);
  for (let x = -252; x <= -190; x += 6.2) {
    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 5.0, 5), mats.steel);
    hanger.position.set(x, 10.5, -30.5);
    trayRun.add(hanger);
  }
  group.add(trayRun);

  /* ---- practical lights ------------------------------------------------ */
  const gateLight = new THREE.PointLight(0xffb765, 55, 46, 2);
  gateLight.position.set(baseX - 2, 10.5, 0);
  group.add(gateLight);
  const vaultLight = new THREE.PointLight(0x5fe3ff, 28, 26, 2);
  vaultLight.position.set(-193, 4.6, -18);
  group.add(vaultLight);

  // status beacons on the portal
  for (const z of [-14, 14]) {
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0x6fe3ff }));
    beacon.position.set(baseX - 1.4, 13.3, z);
    group.add(beacon);
    ctx.registerBlinker(beacon, 1.4);
  }

  ctx.group.add(group);
  return group;
}

/* ========================================================================== *
 *  Station 02 — Transformer & Attention Core
 * ========================================================================== */

const CORE_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  uniform float uTime;
  uniform float uPulse;
  uniform float uEnergy;
  ${GLSL_NOISE}
  void main() {
    vec3 p = normalize(vPos);
    float n = aiFbm3(p * 2.6 + vec3(0.0, uTime * 0.055, uTime * 0.03));
    float n2 = aiFbm3(p * 5.6 - vec3(uTime * 0.045, 0.0, uTime * 0.02));
    float bands = 0.5 + 0.5 * sin(p.y * 7.0 + n * 7.0 + uTime * 0.8);
    vec3 deep = vec3(0.015, 0.12, 0.20);
    vec3 teal = vec3(0.10, 0.78, 0.86);
    vec3 amber = vec3(1.0, 0.58, 0.24);
    vec3 violet = vec3(0.45, 0.34, 0.95);

    vec3 col = mix(deep, teal, smoothstep(0.30, 0.72, n));
    col = mix(col, amber, smoothstep(0.58, 0.95, n2) * 0.55);
    col = mix(col, violet, bands * 0.22);
    col += vec3(0.25, 0.55, 0.60) * smoothstep(0.85, 1.0, n2) * 0.6;

    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(cameraPosition - vWorld))), 2.2);
    col += vec3(0.55, 0.95, 1.0) * fres * 0.85;
    col += amber * uPulse * (0.45 + 0.55 * bands);
    col *= 0.85 + 0.35 * uEnergy;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const WAVE_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vUv;
  uniform float uProgress;
  uniform vec3 uColor;
  uniform float uStrength;
  ${GLSL_NOISE}
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(cameraPosition - vWorld))), 1.8);
    float appear = smoothstep(0.0, 0.12, uProgress);
    float fade = 1.0 - smoothstep(0.55, 1.0, uProgress);
    float bands = 0.65 + 0.35 * sin(vUv.y * 40.0 - uProgress * 20.0);
    float alpha = appear * fade * (0.16 + fres * 0.75) * uStrength * bands;
    gl_FragColor = vec4(uColor * (1.0 + fres), alpha);
  }
`;

function buildCore(ctx) {
  const { mats, cfg } = ctx;
  const random = mulberry32(cfg.seed + 202);
  const group = new THREE.Group();
  group.name = 'AiOpsStation02Core';
  const baseX = OPS_LAYOUT.stations.core.x;

  /* ---- plinth ---------------------------------------------------------- */
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 10.2, 0.55, 56), mats.concrete);
  tier1.position.set(baseX, 0.27, 0);
  tier1.receiveShadow = true;
  group.add(tier1);
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 9.3, 0.5, 56), mats.concreteDark);
  tier2.position.set(baseX, 0.8, 0);
  tier2.receiveShadow = true;
  group.add(tier2);
  const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(7.9, 8.4, 0.35, 56), mats.steelDark);
  tier3.position.set(baseX, 1.22, 0);
  group.add(tier3);

  for (const [r, y, mat] of [
    [9.9, 0.06, mats.brass],
    [8.25, 0.62, mats.copper],
    [7.65, 1.42, mats.brass],
  ]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 6, 72), mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(baseX, y, 0);
    group.add(ring);
  }

  // radial copper fins and uplift strips
  const finParts = [];
  const stripPositions = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    finParts.push({
      w: 0.5,
      h: 1.9,
      d: 3.2,
      x: baseX + Math.cos(a) * 8.9,
      y: 1.9,
      z: Math.sin(a) * 8.9,
      ry: -a,
    });
    stripPositions.push([baseX + Math.cos(a) * 8.9, 2.55, Math.sin(a) * 8.9, a]);
  }
  group.add(new THREE.Mesh(mergeParts(finParts), mats.copperDark));

  stripPositions.forEach(([x, y, z, a]) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.6), mats.emitAmber);
    strip.position.set(x, y, z);
    strip.rotation.y = -a;
    group.add(strip);
  });

  // engraved radial lines on the platform
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x63e8d0, transparent: true, opacity: 0.22 });
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    const line = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 0.06), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = -a;
    line.position.set(baseX + Math.cos(a) * 4.2, 1.41, Math.sin(a) * 4.2);
    group.add(line);
  }

  /* ---- data obelisks and operator consoles on the apron ----------------- */
  const obeliskParts = [];
  const obeliskSeams = [];
  const consoleParts = [];
  const consoleScreens = [];
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const px = baseX + Math.cos(a) * 13.2;
    const pz = Math.sin(a) * 13.2;
    obeliskParts.push({ w: 1.3, h: 6.4, d: 1.3, x: px, y: 3.2, z: pz, ry: -a });
    obeliskParts.push({ w: 1.9, h: 0.45, d: 1.9, x: px, y: 0.22, z: pz, ry: -a });
    obeliskSeams.push([px - Math.cos(a) * 0.68, 3.2, pz - Math.sin(a) * 0.68, -a]);
    // console
    const ca = a + 0.55;
    const cx = baseX + Math.cos(ca) * 14.6;
    const cz = Math.sin(ca) * 14.6;
    consoleParts.push({ w: 2.6, h: 0.9, d: 1.3, x: cx, y: 0.45, z: cz, ry: -ca });
    consoleParts.push({ w: 2.8, h: 0.1, d: 1.5, x: cx, y: 0.95, z: cz, ry: -ca });
    consoleScreens.push([cx, 1.45, cz, -ca]);
  }
  group.add(new THREE.Mesh(mergeParts(obeliskParts), mats.steelDark));
  obeliskSeams.forEach(([x, y, z, ry]) => {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.6, 0.08), mats.emitCyan);
    seam.position.set(x, y, z);
    seam.rotation.y = ry;
    group.add(seam);
  });
  group.add(new THREE.Mesh(mergeParts(consoleParts), mats.steel));
  consoleScreens.forEach(([x, y, z, ry]) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.8), mats.screen);
    panel.position.set(x, y, z);
    panel.rotation.set(-0.9, ry, 0);
    group.add(panel);
  });

  // data cables dropping from the trusses into the core
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const cable = tubeGeometry([
      new THREE.Vector3(baseX + Math.cos(a) * 4.2, 17.4, Math.sin(a) * 4.2),
      new THREE.Vector3(baseX + Math.cos(a) * 4.6, 13.0, Math.sin(a) * 4.6),
      new THREE.Vector3(baseX + Math.cos(a) * 5.6, 10.6, Math.sin(a) * 5.6),
      new THREE.Vector3(baseX + Math.cos(a) * 5.9, 9.6, Math.sin(a) * 5.9),
    ], 0.05, 18, 5);
    group.add(new THREE.Mesh(cable, mats.copperDark));
  }

  /* ---- the latent-space sphere ---------------------------------------- */
  const coreUniforms = {
    uTime: ctx.uniforms.time,
    uPulse: { value: 0 },
    uEnergy: { value: 1 },
  };
  const coreMat = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        vPos = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: CORE_FRAG,
    fog: false,
  });
  ctx.trackMaterial(coreMat);
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.65, 64, 48), coreMat);
  core.position.set(baseX, 7.3, 0);
  group.add(core);

  // outer atmosphere shell
  const shellMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: ctx.uniforms.time,
      uProgress: { value: 0.35 },
      uColor: { value: new THREE.Color(0x6fe3ff) },
      uStrength: { value: 0.35 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec2 vUv;
      uniform float uProgress;
      uniform vec3 uColor;
      uniform float uStrength;
      void main() {
        float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(cameraPosition - vWorld))), 2.6);
        float alpha = fres * uStrength * (0.7 + 0.3 * sin(uProgress * 12.0));
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    fog: false,
  });
  ctx.trackMaterial(shellMat);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(3.15, 40, 28), shellMat);
  shell.position.copy(core.position);
  group.add(shell);

  /* ---- attention rings ------------------------------------------------- */
  const ringDefs = [
    { radius: 5.7, y: 3.4, tilt: 0.12, spin: 0.10, color: 0x6fe3ff, hex: false },
    { radius: 5.35, y: 4.7, tilt: -0.2, spin: -0.08, color: 0xffc078, hex: true },
    { radius: 5.0, y: 6.0, tilt: 0.28, spin: 0.07, color: 0x5ff0c8, hex: false },
    { radius: 4.7, y: 7.3, tilt: -0.14, spin: -0.06, color: 0x6fe3ff, hex: true },
    { radius: 4.4, y: 8.6, tilt: 0.22, spin: 0.055, color: 0xffc078, hex: false },
    { radius: 4.1, y: 9.9, tilt: -0.26, spin: -0.045, color: 0x5ff0c8, hex: false },
  ];
  const ringGroups = [];
  const ringMaterials = [];
  const nodeGeo = new THREE.SphereGeometry(0.13, 8, 6);
  const nodeMaterials = [
    new THREE.MeshBasicMaterial({ color: 0x9df3ff }),
    new THREE.MeshBasicMaterial({ color: 0xffd39a }),
    new THREE.MeshBasicMaterial({ color: 0x9dffe4 }),
  ];

  ringDefs.forEach((def, ri) => {
    const ringGroup = new THREE.Group();
    ringGroup.position.set(baseX, def.y, 0);
    ringGroup.rotation.x = def.tilt;
    ringGroup.rotation.z = def.tilt * 0.6;
    ringGroup.rotation.y = (ri / ringDefs.length) * Math.PI;

    const mat = new THREE.MeshStandardMaterial({
      color: 0x6b5540,
      metalness: 0.95,
      roughness: 0.28,
      emissive: def.color,
      emissiveIntensity: 0.85,
      envMap: ctx.envMap,
      envMapIntensity: 0.9,
    });
    ctx.addMaterial(mat);
    ringMaterials.push({ material: mat, base: 1.4 });

    const torus = new THREE.Mesh(new THREE.TorusGeometry(def.radius, 0.11, 10, 96), mat);
    torus.rotation.x = Math.PI / 2;
    ringGroup.add(torus);

    // structural carrier ring, offset outward
    const carrier = new THREE.Mesh(
      new THREE.TorusGeometry(def.radius + 0.34, 0.035, 6, 96),
      mats.steel
    );
    carrier.rotation.x = Math.PI / 2;
    ringGroup.add(carrier);

    if (def.hex) {
      const hex = new THREE.Mesh(
        new THREE.CylinderGeometry(def.radius + 0.2, def.radius + 0.2, 0.42, 6, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x2a343a,
          metalness: 0.85,
          roughness: 0.4,
          side: THREE.DoubleSide,
          envMap: ctx.envMap,
          envMapIntensity: 0.8,
        })
      );
      hex.rotation.y = Math.PI / 6;
      ringGroup.add(hex);
    }

    // tension rods from the platform up to the rings
    for (let k = 0; k < 4; k += 1) {
      const a = (k / 4) * Math.PI * 2 + 0.3;
      const top = new THREE.Vector3(Math.cos(a) * def.radius, 0, Math.sin(a) * def.radius);
      const bottom = new THREE.Vector3(Math.cos(a) * (def.radius + 0.9), -def.y + 1.35, Math.sin(a) * (def.radius + 0.9));
      const rodGeo = tubeGeometry([bottom, top], 0.028, 2, 4);
      const rod = new THREE.Mesh(rodGeo, mats.steel);
      ringGroup.add(rod);
    }

    // nodes around the ring
    const nodeCount = 12;
    const nodes = new THREE.InstancedMesh(nodeGeo, nodeMaterials[ri % 3], nodeCount);
    const mm = new THREE.Matrix4();
    for (let n = 0; n < nodeCount; n += 1) {
      const a = (n / nodeCount) * Math.PI * 2;
      mm.makeTranslation(Math.cos(a) * def.radius, 0, Math.sin(a) * def.radius);
      nodes.setMatrixAt(n, mm);
    }
    nodes.instanceMatrix.needsUpdate = true;
    ringGroup.add(nodes);

    ringGroup.userData = { baseY: def.y, spin: def.spin, tilt: def.tilt, radius: def.radius, nodeCount };
    ringGroups.push(ringGroup);
    group.add(ringGroup);
  });

  /* ---- Q / K / V synaptic filaments ------------------------------------ */
  const filamentPositions = [];
  const filamentColors = [];
  const colorsByRing = [
    new THREE.Color(0x8ceeff),
    new THREE.Color(0xffb066),
    new THREE.Color(0x7dffcf),
    new THREE.Color(0x8ceeff),
    new THREE.Color(0xffb066),
    new THREE.Color(0x7dffcf),
  ];
  ringDefs.forEach((def, ri) => {
    const count = 12;
    const color = colorsByRing[ri];
    for (let n = 0; n < count; n += 1) {
      const a = (n / count) * Math.PI * 2 + ri * 0.22;
      const start = new THREE.Vector3(
        baseX + Math.cos(a) * def.radius,
        def.y + Math.sin(a * 2.0) * 0.1,
        Math.sin(a) * def.radius
      );
      const end = new THREE.Vector3(
        baseX + Math.cos(a) * 2.55,
        7.3 + (def.y - 7.3) * 0.35 + Math.sin(a * 3.0) * 0.18,
        Math.sin(a) * 2.55
      );
      filamentPositions.push(start.x, start.y, start.z, end.x, end.y, end.z);
      filamentColors.push(color.r, color.g, color.b, color.r * 0.35, color.g * 0.35, color.b * 0.35);
    }
  });
  const filamentGeo = new THREE.BufferGeometry();
  filamentGeo.setAttribute('position', new THREE.Float32BufferAttribute(filamentPositions, 3));
  filamentGeo.setAttribute('color', new THREE.Float32BufferAttribute(filamentColors, 3));
  const filamentMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  ctx.trackMaterial(filamentMat);
  const filaments = new THREE.LineSegments(filamentGeo, filamentMat);
  group.add(filaments);

  // beads travelling along the filaments
  const beadCount = 90;
  const beadGeo = new THREE.SphereGeometry(0.055, 6, 4);
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xd9fbff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const beads = new THREE.InstancedMesh(beadGeo, beadMat, beadCount);
  beads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const beadState = [];
  for (let i = 0; i < beadCount; i += 1) {
    beadState.push({ ring: Math.floor(random() * 6), node: Math.floor(random() * 12), t: random(), speed: randRange(random, 0.25, 0.5) });
  }
  group.add(beads);

  /* ---- forward-pass wavefront ------------------------------------------ */
  const waveUniforms = {
    uProgress: { value: 1 },
    uColor: { value: new THREE.Color(0xffc684) },
    uStrength: { value: 1 },
  };
  const waveMat = new THREE.ShaderMaterial({
    uniforms: waveUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: WAVE_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  ctx.trackMaterial(waveMat);
  const wave = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), waveMat);
  wave.position.copy(core.position);
  wave.scale.setScalar(0.001);
  wave.visible = false;
  group.add(wave);

  const floorWave = new THREE.Mesh(
    new THREE.RingGeometry(0.86, 1.0, 64),
    new THREE.MeshBasicMaterial({ color: 0xffc078, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  floorWave.rotation.x = -Math.PI / 2;
  floorWave.position.set(baseX, 1.46, 0);
  group.add(floorWave);

  /* ---- ambient core particles ------------------------------------------ */
  const particleCount = Math.round(320 * cfg.particleCount);
  const pPositions = new Float32Array(particleCount * 3);
  const pSeeds = [];
  for (let i = 0; i < particleCount; i += 1) {
    const a = random() * Math.PI * 2;
    const r = randRange(random, 3.2, 8.6);
    const y = randRange(random, 1.5, 13);
    pPositions[i * 3] = baseX + Math.cos(a) * r;
    pPositions[i * 3 + 1] = y;
    pPositions[i * 3 + 2] = Math.sin(a) * r;
    pSeeds.push({ a, r, speed: randRange(random, 0.08, 0.3), phase: random() * 6.28 });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xa9f6ff,
    size: 0.09,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  ctx.trackMaterial(pMat);
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  /* ---- animation ------------------------------------------------------- */
  const state = { passStart: -10, passActive: false };

  ctx.addAnimation((elapsed, delta, progress) => {
    const local = clamp01((elapsed * 0.0) + (progress - 0.18) / 0.18);
    coreUniforms.uEnergy.value = 0.85 + 0.3 * Math.sin(elapsed * 0.7) * 0.5 + 0.2 * smoothstep(0.2, 0.6, local);
    shellMat.uniforms.uProgress.value = elapsed * 0.5;

    ringGroups.forEach((rg, i) => {
      const data = rg.userData;
      rg.rotation.y += delta * data.spin;
      rg.position.y = data.baseY + Math.sin(elapsed * 0.6 + i) * 0.07;
      ringMaterials[i].material.emissiveIntensity =
        ringMaterials[i].base * (0.8 + 0.35 * Math.sin(elapsed * 1.4 + i * 1.1));
    });

    // beads race inward along the filaments
    const m = ctx.scratch.matrix;
    const scl = ctx.scratch.scale;
    const quat = ctx.scratch.quat;
    const pos = ctx.scratch.vec;
    for (let i = 0; i < beadCount; i += 1) {
      const b = beadState[i];
      const t = (b.t + elapsed * b.speed) % 1;
      const def = ringDefs[b.ring];
      const a = (b.node / 12) * Math.PI * 2 + b.ring * 0.22;
      const sx = baseX + Math.cos(a) * def.radius;
      const sz = Math.sin(a) * def.radius;
      const sy = def.y + Math.sin(a * 2.0) * 0.1;
      const ex = baseX + Math.cos(a) * 2.55;
      const ez = Math.sin(a) * 2.55;
      const ey = 7.3 + (def.y - 7.3) * 0.35 + Math.sin(a * 3.0) * 0.18;
      pos.set(lerp(sx, ex, t), lerp(sy, ey, t), lerp(sz, ez, t));
      scl.setScalar(1);
      m.compose(pos, quat.identity(), scl);
      beads.setMatrixAt(i, m);
    }
    beads.instanceMatrix.needsUpdate = true;

    // orbiting dust
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i += 1) {
      const s = pSeeds[i];
      const a = s.a + elapsed * s.speed * 0.15;
      arr[i * 3] = baseX + Math.cos(a) * s.r;
      arr[i * 3 + 2] = Math.sin(a) * s.r;
      arr[i * 3 + 1] += Math.sin(elapsed * 0.8 + s.phase) * 0.0025;
    }
    pGeo.attributes.position.needsUpdate = true;

    // forward pass envelope
    if (state.passActive) {
      const t = (elapsed - state.passStart) / 2.7;
      if (t >= 0 && t <= 1) {
        const e = smoothstep(0, 0.18, t) * (1 - smoothstep(0.7, 1, t));
        wave.visible = true;
        wave.scale.setScalar(0.001 + t * 12.5);
        waveUniforms.uProgress.value = clamp01(t);
        waveUniforms.uStrength.value = 0.9 * e;
        coreUniforms.uPulse.value = e * 1.6;
        filamentMat.opacity = 0.7 + e * 1.3;
        floorWave.material.opacity = e * 0.55;
        floorWave.scale.setScalar(1 + t * 11);
        ringMaterials.forEach((rm, i) => {
          rm.material.emissiveIntensity = rm.base + e * 5.5 * (0.6 + 0.4 * Math.sin(t * 12 - i));
        });
      } else {
        wave.visible = false;
        state.passActive = false;
        waveUniforms.uStrength.value = 0;
        coreUniforms.uPulse.value = 0;
        filamentMat.opacity = 0.75;
        floorWave.material.opacity = 0;
        ringMaterials.forEach((rm) => {
          rm.material.emissiveIntensity = rm.base;
        });
      }
    } else {
      wave.visible = false;
      coreUniforms.uPulse.value = Math.max(0, coreUniforms.uPulse.value - delta * 2.2);
    }
  });

  /* ---- lights ---------------------------------------------------------- */
  const coreLight = new THREE.PointLight(0x63e0ff, 90, 40, 2);
  coreLight.position.set(baseX, 7.4, 0);
  group.add(coreLight);
  const uplight = new THREE.SpotLight(0xffc078, 60, 26, 0.6, 0.6, 1.6);
  uplight.position.set(baseX + 2, 12.8, 6);
  uplight.target.position.set(baseX, 2, 0);
  group.add(uplight);
  group.add(uplight.target);

  // the core is deliberately monumental: scale the whole assembly to read at
  // hall distance without shrinking the architecture around it. Everything in
  // this group is authored in world coordinates, so the pivot is compensated
  // to keep the sculpture centred on its station.
  const coreScale = 1.35;
  group.scale.setScalar(coreScale);
  group.position.x = baseX * (1 - coreScale);

  ctx.stationHooks.core = {
    trigger() {
      state.passStart = ctx.clock.elapsed;
      state.passActive = true;
      return true;
    },
    state,
  };

  ctx.group.add(group);
  return group;
}
/* ========================================================================== *
 *  Station 03 — Liquid-Cooled GPU Training Cluster
 * ========================================================================== */

const LOSS_VERT = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  varying float vHeight;
  varying vec2 vUv;
  uniform float uTime;
  ${GLSL_NOISE}

  float lossHeight(vec2 p, float t) {
    float h = 0.0;
    // long, low-frequency ridges
    h += (aiFbm(p * 0.26 + vec2(t * 0.010, 0.0)) - 0.5) * 2.6;
    // two basins and one saddle
    h -= 1.55 * exp(-dot(p - vec2(2.4, 1.1), p - vec2(2.4, 1.1)) * 0.30);
    h -= 0.85 * exp(-dot(p + vec2(2.8, 1.8), p + vec2(2.8, 1.8)) * 0.55);
    h += 1.05 * exp(-dot(p - vec2(-2.4, -2.3), p - vec2(-2.4, -2.3)) * 0.42);
    h += 0.24 * sin(p.x * 1.35 + t * 0.35) * cos(p.y * 1.1 - t * 0.22);
    h += 0.10 * sin(p.x * 3.1 - t * 0.6) * sin(p.y * 2.7 + t * 0.4);
    return h;
  }

  void main() {
    vec2 p = position.xy;
    float h = lossHeight(p, uTime);
    vec3 pos = position;
    pos.z += h;
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vWorld = wp.xyz;
    vHeight = h;
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const LOSS_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  varying float vHeight;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uLow;
  uniform vec3 uMid;
  uniform vec3 uHigh;
  uniform float uCanary;
  ${GLSL_NOISE}
  ${GLSL_FOG}

  void main() {
    float h = vHeight;
    float t = smoothstep(-1.9, 2.4, h);
    vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.55, t));
    col = mix(col, uHigh, smoothstep(0.55, 1.0, t));

    // contour lines every 0.25 units
    float c = abs(fract(h * 4.0) - 0.5);
    float aa = fwidth(h * 4.0) * 1.5 + 0.02;
    float contour = 1.0 - smoothstep(0.03, 0.03 + aa, c);
    col += vec3(0.35, 0.9, 0.85) * contour * 0.55;

    // fine grid
    vec2 g = abs(fract(vUv * vec2(42.0, 30.0)) - 0.5);
    float grid = 1.0 - smoothstep(0.42, 0.48, max(g.x, g.y));
    col *= 0.65 + 0.35 * grid;

    // travelling scan band
    float scan = exp(-pow((vUv.x - fract(uTime * 0.05)) * 9.0, 2.0));
    col += vec3(0.9, 0.65, 0.35) * scan * 0.35;
    col += vec3(1.0, 0.7, 0.3) * uCanary * 0.06;

    col = aiApplyFog(col, length(cameraPosition - vWorld));
    gl_FragColor = vec4(col, 1.0);
  }
`;

function buildGpuCluster(ctx) {
  const { mats, cfg } = ctx;
  const random = mulberry32(cfg.seed + 303);
  const group = new THREE.Group();
  group.name = 'AiOpsStation03Cluster';

  const baseX = OPS_LAYOUT.stations.gpu.x;
  const perRow = cfg.rackRows;
  const spacing = 0.98;
  const rowLength = perRow * spacing;
  const rowStart = baseX - rowLength / 2 + spacing / 2;
  const rowAZ = -19.8;
  const rowBZ = -12.2;
  const aisleZ = (rowAZ + rowBZ) / 2;

  /* ---- shared rack construction ---------------------------------------- */
  const frameGeo = mergeParts([
    { w: 0.05, h: 3.2, d: 1.22, x: -0.44, y: 1.6, z: 0 },
    { w: 0.05, h: 3.2, d: 1.22, x: 0.44, y: 1.6, z: 0 },
    { w: 0.93, h: 0.11, d: 1.24, x: 0, y: 3.16, z: 0 },
    { w: 0.93, h: 0.16, d: 1.24, x: 0, y: 0.08, z: 0 },
    { w: 0.88, h: 3.0, d: 0.05, x: 0, y: 1.6, z: -0.6 },
    { w: 0.07, h: 3.24, d: 0.07, x: -0.45, y: 1.62, z: 0.6 },
    { w: 0.07, h: 3.24, d: 0.07, x: 0.45, y: 1.62, z: 0.6 },
    { w: 0.9, h: 0.06, d: 0.06, x: 0, y: 0.26, z: 0.6 },
    { w: 0.9, h: 0.06, d: 0.06, x: 0, y: 2.96, z: 0.6 },
  ]);
  const rackTransforms = [];
  for (let row = 0; row < 2; row += 1) {
    for (let i = 0; i < perRow; i += 1) {
      const x = rowStart + i * spacing;
      const z = row === 0 ? rowAZ : rowBZ;
      const ry = row === 0 ? 0 : Math.PI;
      rackTransforms.push({ x, z, ry, row, i });
    }
  }
  const frames = new THREE.InstancedMesh(frameGeo, mats.rackDark, rackTransforms.length);
  frames.castShadow = true;
  frames.receiveShadow = true;
  const mm = new THREE.Matrix4();
  const qq = new THREE.Quaternion();
  const pp = new THREE.Vector3();
  const ss = new THREE.Vector3(1, 1, 1);
  rackTransforms.forEach((r, i) => {
    qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r.ry);
    pp.set(r.x, 0, r.z);
    mm.compose(pp, qq, ss);
    frames.setMatrixAt(i, mm);
  });
  frames.instanceMatrix.needsUpdate = true;
  group.add(frames);

  // doors — dark glass panels facing the cold aisle
  const doorGeo = new THREE.BoxGeometry(0.82, 2.62, 0.025);
  const doors = new THREE.InstancedMesh(doorGeo, mats.glass, rackTransforms.length);
  rackTransforms.forEach((r, i) => {
    qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r.ry);
    pp.set(r.x, 1.62, r.z + (r.row === 0 ? 0.615 : -0.615));
    mm.compose(pp, qq, ss);
    doors.setMatrixAt(i, mm);
  });
  doors.instanceMatrix.needsUpdate = true;
  group.add(doors);

  // door handles
  const handleGeo = new THREE.BoxGeometry(0.03, 0.7, 0.05);
  const handles = new THREE.InstancedMesh(handleGeo, mats.brass, rackTransforms.length);
  rackTransforms.forEach((r, i) => {
    pp.set(r.x + 0.36, 1.55, r.z + (r.row === 0 ? 0.64 : -0.64));
    qq.identity();
    mm.compose(pp, qq, ss);
    handles.setMatrixAt(i, mm);
  });
  handles.instanceMatrix.needsUpdate = true;
  group.add(handles);

  // GPU sleds — 8 per rack, each with fin stack and status LEDs
  const sledGeo = mergeParts([
    { w: 0.74, h: 0.2, d: 0.86, x: 0, y: 0, z: 0 },
    { w: 0.66, h: 0.06, d: 0.04, x: 0, y: 0, z: 0.45 },
    { w: 0.06, h: 0.16, d: 0.5, x: -0.3, y: 0.12, z: 0.1 },
    { w: 0.06, h: 0.16, d: 0.5, x: 0.3, y: 0.12, z: 0.1 },
    { w: 0.5, h: 0.13, d: 0.32, x: 0, y: 0.14, z: 0.05 },
  ]);
  const sledCount = rackTransforms.length * cfg.gpuSledsPerRack;
  const sledMat = new THREE.MeshStandardMaterial({
    color: 0x3d464c,
    metalness: 0.92,
    roughness: 0.34,
    envMap: ctx.envMap,
    envMapIntensity: 0.9,
  });
  ctx.trackMaterial(sledMat);
  const sleds = new THREE.InstancedMesh(sledGeo, sledMat, sledCount);
  const ledGeo = new THREE.BoxGeometry(0.035, 0.035, 0.012);
  const ledCyan = new THREE.InstancedMesh(ledGeo, mats.emitTeal, sledCount);
  const ledAmber = new THREE.InstancedMesh(ledGeo, mats.emitAmber, sledCount);
  let si = 0;
  const sledYStart = 0.52;
  const sledStep = 0.30;
  rackTransforms.forEach((r) => {
    for (let s = 0; s < cfg.gpuSledsPerRack; s += 1) {
      const y = sledYStart + s * sledStep;
      const dir = r.row === 0 ? 1 : -1;
      qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r.ry);
      pp.set(r.x, y, r.z + dir * 0.05);
      mm.compose(pp, qq, ss);
      sleds.setMatrixAt(si, mm);
      pp.set(r.x - 0.26, y + 0.02, r.z + dir * 0.47);
      mm.compose(pp, qq, ss);
      ledCyan.setMatrixAt(si, mm);
      pp.set(r.x + 0.26, y + 0.02, r.z + dir * 0.47);
      mm.compose(pp, qq, ss);
      ledAmber.setMatrixAt(si, mm);
      si += 1;
    }
  });
  sleds.instanceMatrix.needsUpdate = true;
  ledCyan.instanceMatrix.needsUpdate = true;
  ledAmber.instanceMatrix.needsUpdate = true;
  group.add(sleds);
  group.add(ledCyan);
  group.add(ledAmber);

  // front intake fans at the top of each rack
  const fanParts = [{ geometry: new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12), x: 0, y: 0, z: 0, rx: Math.PI / 2 }];
  for (let b = 0; b < 5; b += 1) {
    const a = (b / 5) * Math.PI * 2;
    fanParts.push({
      w: 0.19,
      h: 0.055,
      d: 0.02,
      x: Math.cos(a) * 0.07,
      y: Math.sin(a) * 0.07,
      z: 0.02,
      rz: a,
    });
  }
  const fanGeo = mergeParts(fanParts);
  const fanTransforms = [];
  rackTransforms.forEach((r) => {
    for (let f = 0; f < 3; f += 1) {
      fanTransforms.push({
        x: r.x - 0.28 + f * 0.28,
        y: 2.86,
        z: r.z + (r.row === 0 ? 0.66 : -0.66),
        row: r.row,
      });
    }
  });
  const fans = new THREE.InstancedMesh(fanGeo, mats.steel, fanTransforms.length);
  fans.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(fans);

  // rack-top status strips and copper door trim
  const topStripGeo = new THREE.BoxGeometry(0.8, 0.035, 0.05);
  const topStrips = new THREE.InstancedMesh(topStripGeo, mats.emitCyan, rackTransforms.length);
  rackTransforms.forEach((r, i) => {
    pp.set(r.x, 3.1, r.z + (r.row === 0 ? 0.62 : -0.62));
    qq.identity();
    mm.compose(pp, qq, ss);
    topStrips.setMatrixAt(i, mm);
  });
  topStrips.instanceMatrix.needsUpdate = true;
  group.add(topStrips);

  const doorTrimGeo = new THREE.BoxGeometry(0.025, 2.5, 0.03);
  const doorTrims = new THREE.InstancedMesh(doorTrimGeo, mats.copper, rackTransforms.length);
  rackTransforms.forEach((r, i) => {
    pp.set(r.x - 0.42, 1.6, r.z + (r.row === 0 ? 0.63 : -0.63));
    qq.identity();
    mm.compose(pp, qq, ss);
    doorTrims.setMatrixAt(i, mm);
  });
  doorTrims.instanceMatrix.needsUpdate = true;
  group.add(doorTrims);

  // vertical light blades on the rack edges — the thing that makes a cold aisle read
  const edgeGeo = new THREE.BoxGeometry(0.035, 2.7, 0.035);
  const edgeStrips = new THREE.InstancedMesh(edgeGeo, mats.emitCyan, rackTransforms.length * 2);
  let ei = 0;
  rackTransforms.forEach((r) => {
    const dir = r.row === 0 ? 1 : -1;
    for (const side of [-0.42, 0.42]) {
      pp.set(r.x + side, 1.62, r.z + dir * 0.63);
      qq.identity();
      mm.compose(pp, qq, ss);
      edgeStrips.setMatrixAt(ei, mm);
      ei += 1;
    }
  });
  edgeStrips.instanceMatrix.needsUpdate = true;
  group.add(edgeStrips);

  // a warm floor-level strip under each cabinet
  const kickGeo = new THREE.BoxGeometry(0.8, 0.03, 0.04);
  const kicks = new THREE.InstancedMesh(kickGeo, mats.emitAmber, rackTransforms.length);
  rackTransforms.forEach((r, i) => {
    const dir = r.row === 0 ? 1 : -1;
    pp.set(r.x, 0.26, r.z + dir * 0.62);
    qq.identity();
    mm.compose(pp, qq, ss);
    kicks.setMatrixAt(i, mm);
  });
  kicks.instanceMatrix.needsUpdate = true;
  group.add(kicks);

  /* ---- liquid cooling manifolds ---------------------------------------- */
  const copperFlow = makeConduitMaterial(ctx, 0xd07a42, 0.55, 26, 0.55);
  const emeraldFlow = makeConduitMaterial(ctx, 0x3fe6bd, 0.85, 30, 0.55);
  const manifoldLen = rowLength + 3.0;
  const manifoldMid = baseX;

  const pipePartsCopper = [];
  const pipePartsEmerald = [];
  const dropCopper = [];
  const dropEmerald = [];
  const valveParts = [];

  for (const row of [0, 1]) {
    const zPull = row === 0 ? rowAZ - 0.95 : rowBZ + 0.95;
    const zReturn = row === 0 ? rowAZ - 1.25 : rowBZ + 1.25;

    const supply = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, manifoldLen, 12, 1, true), copperFlow);
    supply.rotation.z = Math.PI / 2;
    supply.position.set(manifoldMid, 4.35, zPull);
    group.add(supply);

    const ret = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, manifoldLen, 12, 1, true), emeraldFlow);
    ret.rotation.z = Math.PI / 2;
    ret.position.set(manifoldMid, 4.82, zReturn);
    group.add(ret);

    // vertical drops and return risers to each rack
    rackTransforms
      .filter((r) => r.row === row)
      .forEach((r) => {
        dropCopper.push({
          geometry: new THREE.CylinderGeometry(0.055, 0.055, 1.1, 8),
          x: r.x,
          y: 3.8,
          z: zPull,
        });
        dropCopper.push({
          w: 0.09,
          h: 0.09,
          d: 0.5,
          x: r.x,
          y: 4.35,
          z: zPull + (row === 0 ? 0.25 : -0.25),
        });
        dropEmerald.push({
          geometry: new THREE.CylinderGeometry(0.045, 0.045, 0.75, 8),
          x: r.x + 0.22,
          y: 4.45,
          z: zReturn,
        });
        dropEmerald.push({
          w: 0.07,
          h: 0.07,
          d: 0.4,
          x: r.x + 0.22,
          y: 4.82,
          z: zReturn + (row === 0 ? 0.2 : -0.2),
        });
      });

    // valve wheels every few racks
    for (let i = 0; i < perRow; i += 4) {
      const x = rowStart + i * spacing;
      valveParts.push({ geometry: new THREE.TorusGeometry(0.22, 0.035, 6, 16), x, y: 4.62, z: zPull + (row === 0 ? 0.15 : -0.15), ry: Math.PI / 2 });
      valveParts.push({ geometry: new THREE.CylinderGeometry(0.09, 0.09, 0.09, 8), x, y: 4.35, z: zPull, rx: Math.PI / 2 });
    }
  }
  const dropCopperMesh = new THREE.Mesh(mergeParts([...dropCopper, ...pipePartsCopper]), mats.copper);
  group.add(dropCopperMesh);
  const dropEmeraldMesh = new THREE.Mesh(mergeParts([...dropEmerald, ...pipePartsEmerald]), new THREE.MeshStandardMaterial({
    color: 0x2f6a5e,
    metalness: 0.85,
    roughness: 0.35,
    envMap: ctx.envMap,
    envMapIntensity: 0.8,
  }));
  ctx.trackMaterial(dropEmeraldMesh.material);
  group.add(dropEmeraldMesh);
  group.add(new THREE.Mesh(mergeParts(valveParts), mats.brass));

  // pipe hangers from the trusses
  const hangerParts = [];
  for (let x = baseX - rowLength / 2; x <= baseX + rowLength / 2; x += 4.9) {
    hangerParts.push({ w: 0.05, h: 8.4, d: 0.05, x, y: 9.1, z: rowAZ - 1.1 });
    hangerParts.push({ w: 0.05, h: 8.4, d: 0.05, x, y: 9.1, z: rowBZ + 1.1 });
  }
  group.add(new THREE.Mesh(mergeParts(hangerParts), mats.steelDark));

  /* ---- overhead power busway ------------------------------------------- */
  for (const z of [rowAZ - 0.65, rowBZ + 0.65]) {
    const busway = new THREE.Mesh(new THREE.BoxGeometry(rowLength + 2.4, 0.34, 0.46), mats.steelDark);
    busway.position.set(baseX, 6.4, z);
    group.add(busway);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(rowLength + 2.0, 0.03, 0.05), mats.emitAmber);
    slot.position.set(baseX, 6.21, z);
    group.add(slot);
    const tapParts = [];
    rackTransforms.filter((r) => (z < aisleZ ? r.row === 0 : r.row === 1)).forEach((r) => {
      tapParts.push({ w: 0.22, h: 0.44, d: 0.3, x: r.x, y: 6.06, z });
      tapParts.push({ w: 0.07, h: 0.5, d: 0.07, x: r.x, y: 5.6, z });
    });
    group.add(new THREE.Mesh(mergeParts(tapParts), mats.brass));
  }

  /* ---- cold-aisle containment ------------------------------------------ */
  const containment = new THREE.Group();
  for (let i = 0; i < perRow; i += 1) {
    const x = rowStart + i * spacing;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 7.4), mats.steel);
    beam.position.set(x, 3.42, aisleZ);
    containment.add(beam);
  }
  // open-top containment: glass panels would hide the aisle from the camera,
  // so the roof is expressed as a light steel frame and capping rails only
  for (const z of [rowAZ, rowBZ]) {
    const capRail = new THREE.Mesh(new THREE.BoxGeometry(rowLength, 0.1, 0.12), mats.copper);
    capRail.position.set(baseX, 3.46, z + (z < aisleZ ? 0.62 : -0.62));
    containment.add(capRail);
  }
  group.add(containment);

  /* ---- floor of the aisle: copper cable bundles ------------------------ */
  const bundleParts = [];
  for (let i = 0; i < 5; i += 1) {
    bundleParts.push({ geometry: new THREE.CylinderGeometry(0.05, 0.05, rowLength + 1.0, 6), x: baseX, y: 0.16, z: aisleZ - 2.0 + i * 0.16, rz: Math.PI / 2 });
  }
  group.add(new THREE.Mesh(mergeParts(bundleParts), mats.copperDark));

  // warm hanging luminaires over the cold aisle
  for (let i = 0; i < 5; i += 1) {
    const lx = baseX - rowLength * 0.4 + (i / 4) * rowLength * 0.8;
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.4, 14, 1, true), mats.steelDark);
    shade.position.set(lx, 7.4, aisleZ);
    group.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mats.emitWarm);
    bulb.position.set(lx, 7.2, aisleZ);
    group.add(bulb);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.4, 5), mats.steelDark);
    rod.position.set(lx, 9.2, aisleZ);
    group.add(rod);
  }

  /* ---- loss surface ---------------------------------------------------- */
  const lossGroup = new THREE.Group();
  const lossUniforms = {
    uTime: ctx.uniforms.time,
    uLow: { value: new THREE.Color(0x0a2b2c) },
    uMid: { value: new THREE.Color(0x2fb99a) },
    uHigh: { value: new THREE.Color(0xffb765) },
    uCanary: { value: 0 },
    uFogColor: ctx.uniforms.fogColor,
    uFogDensity: ctx.uniforms.fogDensity,
  };
  const lossMat = new THREE.ShaderMaterial({
    uniforms: lossUniforms,
    vertexShader: LOSS_VERT,
    fragmentShader: LOSS_FRAG,
    fog: false,
    side: THREE.DoubleSide,
  });
  ctx.trackMaterial(lossMat);
  const lossGeo = new THREE.PlaneGeometry(15, 11, 74, 54);
  const lossMesh = new THREE.Mesh(lossGeo, lossMat);
  lossMesh.rotation.x = -Math.PI / 2 + 0.14;
  lossMesh.position.set(-30, 2.05, 8.5);
  lossGroup.add(lossMesh);

  const lossWireMat = new THREE.ShaderMaterial({
    uniforms: lossUniforms,
    vertexShader: LOSS_VERT,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uLow;
      void main() {
        gl_FragColor = vec4(mix(uLow, vec3(0.55, 1.0, 0.92), 0.75), 0.14);
      }
    `,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  ctx.trackMaterial(lossWireMat);
  const lossWire = new THREE.Mesh(lossGeo, lossWireMat);
  lossWire.rotation.copy(lossMesh.rotation);
  lossWire.position.copy(lossMesh.position);
  lossWire.position.y += 0.02;
  lossGroup.add(lossWire);

  const lossPlinth = new THREE.Mesh(new THREE.BoxGeometry(16.4, 1.9, 12.4), mats.concreteDark);
  lossPlinth.position.set(-30, 0.95, 8.5);
  lossPlinth.receiveShadow = true;
  lossGroup.add(lossPlinth);
  const lossRim = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.12, 12.8), mats.copper);
  lossRim.position.set(-30, 1.93, 8.5);
  lossGroup.add(lossRim);

  const marker = new THREE.Group();
  const markerBallMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a0a,
    metalness: 0.3,
    roughness: 0.35,
    emissive: 0xffb765,
    emissiveIntensity: 2.4,
  });
  ctx.trackMaterial(markerBallMat);
  const markerBall = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), markerBallMat);
  marker.add(markerBall);
  const markerHalo = glowSprite(ctx.textures.radial, 0xffc078, 2.2, 0.5);
  marker.add(markerHalo);
  lossGroup.add(marker);

  // small readout pedestal at the near corner of the plinth
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.4), mats.steelDark);
  pedestal.position.set(-38.2, 2.5, 13.6);
  pedestal.rotation.y = 0.5;
  lossGroup.add(pedestal);
  const readout = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.42), mats.screenWarm);
  readout.position.set(-38.15, 2.72, 13.83);
  readout.rotation.y = 0.5;
  lossGroup.add(readout);
  group.add(lossGroup);

  /* ---- cluster operations screen ---------------------------------------- */
  const opsStand = new THREE.Group();
  const opsPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), mats.steelDark);
  opsPost.position.set(-58, 1.1, -8);
  opsStand.add(opsPost);
  const opsPanel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.9, 0.12), mats.steelDark);
  opsPanel.position.set(-58, 2.5, -8);
  opsPanel.rotation.y = -0.5;
  opsStand.add(opsPanel);
  const opsScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.65), mats.screen);
  opsScreen.position.set(-58, 2.5, -7.93);
  opsScreen.rotation.y = -0.5;
  opsStand.add(opsScreen);
  group.add(opsStand);

  /* ---- animation ------------------------------------------------------- */
  const fanSpeeds = fanTransforms.map((f, i) => 0.7 + (i % 5) * 0.12);
  const fanAngles = fanTransforms.map(() => Math.random() * Math.PI * 2);
  ctx.addAnimation((elapsed, delta, progress) => {
    const util = 0.55 + 0.45 * Math.sin(elapsed * 0.31) * 0.5 + 0.2;
    const speed = 3.2 + util * 10;
    const m = ctx.scratch.matrix;
    const q = ctx.scratch.quat;
    const p = ctx.scratch.vec;
    const scl = ctx.scratch.scale.set(1, 1, 1);
    for (let i = 0; i < fanTransforms.length; i += 1) {
      const f = fanTransforms[i];
      fanAngles[i] += delta * speed * fanSpeeds[i];
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), fanAngles[i]);
      p.set(f.x, f.y, f.z);
      m.compose(p, q, scl);
      fans.setMatrixAt(i, m);
    }
    fans.instanceMatrix.needsUpdate = true;

    lossUniforms.uTime.value = elapsed;

    // marker descends toward the global minimum and rises again
    const cycle = (elapsed * 0.11) % 1;
    const drop = smoothstep(0.0, 0.65, cycle) * (1 - smoothstep(0.78, 1.0, cycle));
    marker.position.set(-27.6, 2.05 + 0.55 + (1 - drop) * 5.5, 7.4);
    markerBall.material.emissiveIntensity = 2.2 + drop * 3.0;
    markerHalo.material.opacity = 0.35 + drop * 0.4;
  });

  /* ---- lights ---------------------------------------------------------- */
  const aisleLight = new THREE.PointLight(0x9fe8ff, 42, 26, 2);
  aisleLight.position.set(baseX, 2.6, aisleZ);
  group.add(aisleLight);
  for (const ax of [baseX - rowLength * 0.3, baseX + rowLength * 0.3]) {
    const fill = new THREE.PointLight(0x9fe8ff, 26, 18, 2);
    fill.position.set(ax, 2.4, aisleZ);
    group.add(fill);
  }
  const warmRim = new THREE.PointLight(0xffa860, 40, 34, 2);
  warmRim.position.set(-30, 6.5, 12);
  group.add(warmRim);

  // ceiling-mounted task lights over the aisle
  for (const x of [baseX - rowLength / 3, baseX + rowLength / 3]) {
    const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), mats.emitWhite);
    fixture.position.set(x, 7.6, aisleZ);
    group.add(fixture);
    const shade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.7), mats.steelDark);
    shade.position.set(x, 7.72, aisleZ);
    group.add(shade);
  }

  ctx.group.add(group);
  return group;
}
/* ========================================================================== *
 *  Station 04 — CI/CD & Container Build Gantry
 * ========================================================================== */

const SCANNER_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SCANNER_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform float uTime;
  uniform float uPhase;
  uniform vec3 uColor;
  void main() {
    float sweep = fract(uTime * 0.22 + uPhase);
    float scan = exp(-pow((vUv.y - sweep) * 16.0, 2.0));
    float base = 0.025 + 0.09 * pow(vUv.y, 3.0);
    float side = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
    float grid = 0.5 + 0.5 * sin(vUv.y * 120.0);
    vec3 col = uColor * (base + scan * 1.1 + grid * 0.012);
    float alpha = (base * 0.7 + scan * 0.65) * side;
    gl_FragColor = vec4(col, alpha);
  }
`;

function buildCicdGantry(ctx) {
  const { mats } = ctx;
  const random = mulberry32(ctx.cfg.seed + 404);
  const group = new THREE.Group();
  group.name = 'AiOpsStation04Gantry';

  const centerX = OPS_LAYOUT.stations.cicd.x;
  const railStart = 50;
  const railEnd = 124;
  const stageXs = [62, 76, 90, 104];
  const stageNames = ['LINT', 'TEST', 'IMAGE', 'SIGN'];
  const stageAccents = ['#6fe3ff', '#5ff0c8', '#ffc078', '#ffb765'];

  /* ---- precision rail -------------------------------------------------- */
  const railLength = railEnd - railStart;
  for (const z of [-2.9, 2.9]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(railLength, 0.14, 0.2), mats.steel);
    rail.position.set((railStart + railEnd) / 2, 1.18, z);
    group.add(rail);
    const railGlow = new THREE.Mesh(new THREE.BoxGeometry(railLength - 1, 0.02, 0.06), mats.emitCyan);
    railGlow.position.set((railStart + railEnd) / 2, 1.26, z);
    group.add(railGlow);
  }
  const sleeperGeo = new THREE.BoxGeometry(0.34, 0.16, 6.6);
  const sleeperCount = Math.floor(railLength / 2.2);
  const sleepers = new THREE.InstancedMesh(sleeperGeo, mats.steelDark, sleeperCount);
  const m = new THREE.Matrix4();
  for (let i = 0; i < sleeperCount; i += 1) {
    m.makeTranslation(railStart + 1 + i * 2.2, 1.05, 0);
    sleepers.setMatrixAt(i, m);
  }
  sleepers.instanceMatrix.needsUpdate = true;
  group.add(sleepers);

  // hazard strip along the rail bed
  for (const z of [-6.2, 6.2]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(railLength, 0.8), mats.hazard);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set((railStart + railEnd) / 2, 0.03, z);
    group.add(strip);
  }

  /* ---- four build arches ----------------------------------------------- */
  const archParts = [];
  for (const ax of stageXs) {
    for (const z of [-7.6, 7.6]) {
      archParts.push({ w: 1.1, h: 11.2, d: 1.1, x: ax, y: 5.6, z });
      archParts.push({ w: 1.9, h: 0.55, d: 1.9, x: ax, y: 0.28, z });
      archParts.push({ w: 1.5, h: 0.4, d: 1.5, x: ax, y: 10.9, z });
    }
    archParts.push({ w: 1.2, h: 1.5, d: 16.4, x: ax, y: 11.2, z: 0 });
    archParts.push({ w: 0.8, h: 0.35, d: 15.2, x: ax, y: 12.1, z: 0 });
    // cross bracing in the beam
    archParts.push({ w: 0.16, h: 0.16, d: 15.0, x: ax - 0.35, y: 10.5, z: 0 });
    archParts.push({ w: 0.16, h: 0.16, d: 15.0, x: ax + 0.35, y: 10.5, z: 0 });
  }
  const arches = new THREE.Mesh(mergeParts(archParts), mats.steelDark);
  arches.castShadow = true;
  arches.receiveShadow = true;
  group.add(arches);

  // copper fillets and bolt rows at the arch feet
  const filletParts = [];
  const boltRows = [];
  for (const ax of stageXs) {
    for (const z of [-7.6, 7.6]) {
      filletParts.push({ w: 1.5, h: 0.14, d: 1.5, x: ax, y: 0.62, z });
      for (let b = 0; b < 4; b += 1) {
        boltRows.push([ax - 0.55 + b * 0.36, 0.8, z + 0.8]);
      }
    }
  }
  group.add(new THREE.Mesh(mergeParts(filletParts), mats.copper));
  const boltGeo = new THREE.SphereGeometry(0.055, 6, 4);
  const bolts = new THREE.InstancedMesh(boltGeo, mats.brass, boltRows.length);
  boltRows.forEach(([x, y, z], i) => {
    m.makeTranslation(x, y, z);
    bolts.setMatrixAt(i, m);
  });
  bolts.instanceMatrix.needsUpdate = true;
  group.add(bolts);

  /* ---- stage plates and scanner curtains ------------------------------- */
  stageXs.forEach((ax, i) => {
    const tex = makeLabelTexture(stageNames[i], `STAGE ${i + 1} / 4`, stageAccents[i], {
      titleSize: 132,
      subtitleSize: 40,
    });
    if (tex) ctx.extraTextures.push(tex);
    const plateMat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.55,
      color: 0x34393d,
      metalness: 0.5,
      roughness: 0.5,
      envMap: ctx.envMap,
      envMapIntensity: 0.4,
    });
    ctx.trackMaterial(plateMat);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 4.4), plateMat);
    plate.position.set(ax - 0.66, 11.15, 0);
    group.add(plate);

    const scannerBar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 12.6), mats.steel);
    scannerBar.position.set(ax, 9.9, 0);
    group.add(scannerBar);
    const scannerGlow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 12.2), mats.emitCyan);
    scannerGlow.position.set(ax, 9.73, 0);
    group.add(scannerGlow);

    const curtainMat = new THREE.ShaderMaterial({
      vertexShader: SCANNER_VERT,
      fragmentShader: SCANNER_FRAG,
      uniforms: {
        uTime: ctx.uniforms.time,
        uPhase: { value: i * 0.23 },
        uColor: { value: new THREE.Color(stageAccents[i]) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    ctx.trackMaterial(curtainMat);
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 9.2), curtainMat);
    curtain.rotation.y = -Math.PI / 2;
    curtain.position.set(ax, 5.1, 0);
    group.add(curtain);

    // small status beacons on the arch beam
    for (const z of [-7.6, 7.6]) {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: stageAccents[i] }));
      beacon.position.set(ax - 0.62, 11.95, z);
      group.add(beacon);
      ctx.registerBlinker(beacon, 0.9 + i * 0.35);
    }
  });

  /* ---- articulated robotic arms ---------------------------------------- */
  const arms = [];
  function makeArm(x, z, scale = 1) {
    const root = new THREE.Group();
    root.position.set(x, 10.2, z);
    root.scale.setScalar(scale);

    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.5, 12), mats.steel);
    shoulder.rotation.z = Math.PI / 2;
    root.add(shoulder);

    const upper = new THREE.Group();
    upper.position.set(0, 0, 0);
    root.add(upper);
    const upperLink = new THREE.Mesh(new THREE.BoxGeometry(0.26, 2.5, 0.26), mats.steelDark);
    upperLink.position.y = -1.25;
    upper.add(upperLink);
    const upperPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 8), mats.brass);
    upperPiston.position.set(0.22, -1.2, 0);
    upper.add(upperPiston);

    const elbow = new THREE.Group();
    elbow.position.y = -2.5;
    upper.add(elbow);
    const elbowJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 12), mats.steel);
    elbowJoint.rotation.z = Math.PI / 2;
    elbow.add(elbowJoint);

    const fore = new THREE.Group();
    elbow.add(fore);
    const foreLink = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 0.18), mats.steel);
    foreLink.position.y = -0.95;
    fore.add(foreLink);

    const tool = new THREE.Group();
    tool.position.y = -1.9;
    fore.add(tool);
    const toolHead = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 10), mats.copper);
    toolHead.rotation.x = Math.PI;
    tool.add(toolHead);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mats.emitAmber);
    tip.position.y = -0.34;
    tool.add(tip);

    group.add(root);
    arms.push({ upper, elbow, fore, tool, phase: random() * 6.28, speed: 0.5 + random() * 0.3 });
    return root;
  }
  makeArm(76, -3.4, 1.0);
  makeArm(90, 3.4, 1.0);
  makeArm(104, -3.2, 0.82);

  /* ---- container image modules ----------------------------------------- */
  const corrugation = [];
  for (let r = 0; r < 7; r += 1) {
    corrugation.push({ w: 4.6, h: 2.0, d: 0.05, x: 0, y: 0, z: -1.18 + 0 });
  }
  const containerGeo = mergeParts([
    { w: 4.7, h: 2.3, d: 2.3, x: 0, y: 0, z: 0 },
    { w: 4.78, h: 0.12, d: 2.38, x: 0, y: 1.13, z: 0 },
    { w: 4.78, h: 0.12, d: 2.38, x: 0, y: -1.13, z: 0 },
    // corner castings
    { w: 0.28, h: 0.22, d: 0.28, x: -2.26, y: 1.06, z: 1.06 },
    { w: 0.28, h: 0.22, d: 0.28, x: 2.26, y: 1.06, z: 1.06 },
    { w: 0.28, h: 0.22, d: 0.28, x: -2.26, y: -1.06, z: 1.06 },
    { w: 0.28, h: 0.22, d: 0.28, x: 2.26, y: -1.06, z: 1.06 },
    { w: 0.28, h: 0.22, d: 0.28, x: -2.26, y: 1.06, z: -1.06 },
    { w: 0.28, h: 0.22, d: 0.28, x: 2.26, y: 1.06, z: -1.06 },
    { w: 0.28, h: 0.22, d: 0.28, x: -2.26, y: -1.06, z: -1.06 },
    { w: 0.28, h: 0.22, d: 0.28, x: 2.26, y: -1.06, z: -1.06 },
    // corrugated ribs
    ...Array.from({ length: 9 }, (_, i) => ({ w: 0.12, h: 2.1, d: 2.32, x: -2.1 + i * 0.52, y: 0, z: 0 })),
  ]);
  const containerMat = new THREE.MeshStandardMaterial({
    color: 0x5d6a72,
    metalness: 0.85,
    roughness: 0.42,
    envMap: ctx.envMap,
    envMapIntensity: 0.8,
  });
  ctx.trackMaterial(containerMat);
  const panelGeo = new THREE.PlaneGeometry(1.5, 1.5);
  const containers = [];
  const shuttleStops = [railStart + 2, stageXs[0], stageXs[1], stageXs[2], stageXs[3], railEnd + 2.5];
  for (let i = 0; i < 6; i += 1) {
    const c = new THREE.Group();
    const body = new THREE.Mesh(containerGeo, containerMat);
    body.castShadow = true;
    body.receiveShadow = true;
    c.add(body);
    const panel = new THREE.Mesh(panelGeo, i % 2 ? mats.screen : mats.screenWarm);
    panel.position.set(0.2, 0.15, 1.17);
    c.add(panel);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.02), i % 2 ? mats.emitTeal : mats.emitAmber);
    tag.position.set(-1.5, -0.75, 1.17);
    c.add(tag);
    const skid = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 1.7), mats.steelDark);
    skid.position.y = -1.28;
    c.add(skid);
    group.add(c);
    containers.push({ group: c, index: i });
  }

  function shuttlePosition(index, elapsed) {
    const cycle = 34; // seconds for a full run
    const t = ((elapsed + index * (cycle / 6)) % cycle) / cycle;
    // 6 stops, dwell at each, travel between
    const seg = t * (shuttleStops.length - 1);
    const i0 = Math.floor(seg);
    const local = seg - i0;
    const from = shuttleStops[Math.min(i0, shuttleStops.length - 1)];
    const to = shuttleStops[Math.min(i0 + 1, shuttleStops.length - 1)];
    const ease = local < 0.55 ? 0 : smootherstep(0.55, 1.0, local);
    return lerp(from, to, ease);
  }

  /* ---- artifact vault --------------------------------------------------- */
  const vault = new THREE.Group();
  const vaultX = 130;
  const vaultFrame = new THREE.Mesh(new THREE.BoxGeometry(8.6, 9.4, 11.4), mats.steelDark);
  vaultFrame.position.set(vaultX, 4.7, 0);
  vault.add(vaultFrame);
  const vaultGlass = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 8.6), mats.glass);
  vaultGlass.rotation.y = -Math.PI / 2;
  vaultGlass.position.set(vaultX - 4.32, 4.9, 0);
  vault.add(vaultGlass);
  const vaultDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, 6.2), mats.steel);
  vaultDoorFrame.position.set(vaultX - 4.5, 2.7, 0);
  vault.add(vaultDoorFrame);
  const vaultDoor = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 4.6), mats.glassAmber);
  vaultDoor.rotation.y = -Math.PI / 2;
  vaultDoor.position.set(vaultX - 4.7, 2.5, 0);
  vault.add(vaultDoor);
  // interior shelves of signed artifacts
  const shelfParts = [];
  const artifactParts = [];
  for (let tier = 0; tier < 3; tier += 1) {
    shelfParts.push({ w: 7.4, h: 0.12, d: 1.4, x: 0, y: 1.3 + tier * 2.0, z: -3.2 });
    for (let a = 0; a < 6; a += 1) {
      artifactParts.push({ w: 0.5, h: 0.7, d: 0.5, x: -3.1 + a * 1.22, y: 1.72 + tier * 2.0, z: -3.2 });
    }
  }
  const shelves = new THREE.Mesh(mergeParts(shelfParts), mats.steelDark);
  shelves.position.set(vaultX, 0, 0);
  vault.add(shelves);
  const artifacts = new THREE.Mesh(mergeParts(artifactParts), mats.emitTeal);
  artifacts.position.set(vaultX, 0, 0);
  vault.add(artifacts);
  // vault fascia lights
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 12.4), mats.emitAmber);
  fascia.position.set(vaultX - 4.4, 9.5, 0);
  vault.add(fascia);
  const vaultLabelTex = makeLabelTexture('ARTIFACT VAULT', 'SIGNED · IMMUTABLE · 14.2 TB', '#5ff0c8', { titleSize: 92 });
  if (vaultLabelTex) ctx.extraTextures.push(vaultLabelTex);
  const vaultLabelMat = new THREE.MeshStandardMaterial({
    map: vaultLabelTex, emissive: 0xffffff, emissiveMap: vaultLabelTex, emissiveIntensity: 0.5,
    color: 0x2c3236, metalness: 0.4, roughness: 0.6,
  });
  ctx.trackMaterial(vaultLabelMat);
  const vaultLabel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 6.2), vaultLabelMat);
  vaultLabel.position.set(vaultX - 4.9, 6.9, 0);
  vault.add(vaultLabel);
  group.add(vault);

  /* ---- bridge crane over the gantry ------------------------------------ */
  const craneGroup = new THREE.Group();
  for (const x of [55, 119]) {
    for (const z of [-10.4, 10.4]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 14.4, 0.7), mats.steelDark);
      leg.position.set(x, 7.2, z);
      craneGroup.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.3), mats.concrete);
      foot.position.set(x, 0.2, z);
      craneGroup.add(foot);
    }
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 21.8), mats.steel);
    tie.position.set(x, 13.4, 0);
    craneGroup.add(tie);
  }
  for (const z of [-10.4, 10.4]) {
    const runway = new THREE.Mesh(new THREE.BoxGeometry(66, 0.34, 0.4), mats.steel);
    runway.position.set(87, 14.35, z);
    craneGroup.add(runway);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(66, 0.12, 0.12), mats.brass);
    rail.position.set(87, 14.6, z);
    craneGroup.add(rail);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 21.2), mats.steel);
  bridge.position.set(87, 15.0, 0);
  craneGroup.add(bridge);
  for (const z of [-9.4, 9.4]) {
    const truck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.0), mats.copper);
    truck.position.set(87, 14.65, z);
    craneGroup.add(truck);
  }
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.8), mats.copperDark);
  trolley.position.set(87, 14.6, 0);
  craneGroup.add(trolley);
  const hookCable = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.6, 6), mats.steelDark);
  hookCable.position.set(87, 12.0, 0);
  craneGroup.add(hookCable);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 6, 14, Math.PI * 1.4), mats.brass);
  hook.position.set(87, 9.6, 0);
  hook.rotation.z = 0.3;
  craneGroup.add(hook);
  group.add(craneGroup);

  /* ---- animation -------------------------------------------------------- */
  ctx.addAnimation((elapsed, delta) => {
    arms.forEach((arm, i) => {
      arm.upper.rotation.z = Math.sin(elapsed * arm.speed + arm.phase) * 0.28;
      arm.upper.rotation.x = Math.cos(elapsed * arm.speed * 0.7 + arm.phase) * 0.22;
      arm.elbow.rotation.z = 0.5 + Math.sin(elapsed * arm.speed * 1.3 + arm.phase + 1.2) * 0.55;
      arm.fore.rotation.y = Math.sin(elapsed * arm.speed * 0.8 + arm.phase) * 0.6;
      arm.tool.rotation.z = Math.cos(elapsed * arm.speed * 1.7 + arm.phase) * 0.25;
    });
    containers.forEach((c, i) => {
      c.group.position.set(shuttlePosition(i, elapsed), 1.6, 0);
      c.group.position.y += Math.sin(elapsed * 1.2 + i) * 0.02;
    });
    trolley.position.z = Math.sin(elapsed * 0.12) * 7.5;
  });

  /* ---- lights ---------------------------------------------------------- */
  for (const ax of stageXs) {
    const light = new THREE.PointLight(0x9fe8ff, 26, 22, 2);
    light.position.set(ax, 9.0, 0);
    group.add(light);
  }
  const warmLight = new THREE.PointLight(0xffb066, 48, 30, 2);
  warmLight.position.set(130, 6.5, 0);
  group.add(warmLight);

  ctx.group.add(group);
  return group;
}

/* ========================================================================== *
 *  Station 05 — Kubernetes Mesh & Canary Rollout
 * ========================================================================== */

const TRAFFIC_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSpeed;
  ${GLSL_FOG}
  void main() {
    float t = fract(vUv.x * 5.0 - uTime * uSpeed);
    float dash = smoothstep(0.5, 0.95, t) * smoothstep(0.0, 0.08, t);
    float base = 0.18 + 0.12 * sin(vUv.x * 30.0 - uTime * 2.0);
    vec3 col = uColor * (base + dash * 2.2);
    float alpha = uOpacity * (0.32 + dash * 0.85);
    col = aiApplyFog(col, length(cameraPosition - vWorld));
    gl_FragColor = vec4(col, alpha);
  }
`;

function buildMeshStation(ctx) {
  const { mats } = ctx;
  const random = mulberry32(ctx.cfg.seed + 505);
  const group = new THREE.Group();
  group.name = 'AiOpsStation05Mesh';

  const centerX = OPS_LAYOUT.stations.mesh.x;
  const centerZ = -1;
  const ingressX = 148;

  /* ---- ingress load-balancer arch -------------------------------------- */
  const ingressParts = [];
  for (const z of [-6.4, 6.4]) {
    ingressParts.push({ w: 1.2, h: 12.0, d: 1.2, x: ingressX, y: 6.0, z });
    ingressParts.push({ w: 2.1, h: 0.5, d: 2.1, x: ingressX, y: 0.25, z });
  }
  ingressParts.push({ w: 1.4, h: 1.8, d: 14.4, x: ingressX, y: 12.0, z: 0 });
  ingressParts.push({ w: 0.5, h: 0.2, d: 12.0, x: ingressX - 0.6, y: 11.2, z: 0 });
  const ingress = new THREE.Mesh(mergeParts(ingressParts), mats.concrete);
  ingress.castShadow = true;
  group.add(ingress);

  const lbScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), mats.screen);
  lbScreen.position.set(ingressX - 0.72, 10.2, 0);
  lbScreen.rotation.y = -Math.PI / 2;
  group.add(lbScreen);
  const ingressTex = makeLabelTexture('INGRESS', 'LOAD BALANCER · 12.4K RPS', '#6fe3ff', { titleSize: 108 });
  if (ingressTex) ctx.extraTextures.push(ingressTex);
  const ingressPlateMat = new THREE.MeshStandardMaterial({
    map: ingressTex, emissive: 0xffffff, emissiveMap: ingressTex, emissiveIntensity: 0.55,
    color: 0x2b3236, metalness: 0.5, roughness: 0.5,
  });
  ctx.trackMaterial(ingressPlateMat);
  const ingressPlate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 5.4), ingressPlateMat);
  ingressPlate.position.set(ingressX - 0.7, 12.2, 0);
  group.add(ingressPlate);

  /* ---- physical compute nodes ------------------------------------------ */
  const nodeGroup = new THREE.Group();
  const nodeCount = 7;
  for (let i = 0; i < nodeCount; i += 1) {
    const a = Math.PI * 0.15 + (i / (nodeCount - 1)) * Math.PI * 0.7;
    const r = 14.2;
    const x = centerX + Math.cos(a) * r;
    const z = centerZ + Math.sin(a) * r;
    const rack = new THREE.Group();
    rack.position.set(x, 0, z);
    rack.rotation.y = -a + Math.PI / 2;

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 1.1), mats.rackDark);
    body.position.y = 1.15;
    body.castShadow = true;
    rack.add(body);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.8), mats.glassDark);
    glass.position.set(0, 1.2, 0.56);
    rack.add(glass);
    for (let u = 0; u < 5; u += 1) {
      const unit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.06), mats.steel);
      unit.position.set(0, 0.6 + u * 0.3, 0.58);
      rack.add(unit);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), u % 2 ? mats.emitTeal : mats.emitCyan);
      led.position.set(0.5, 0.6 + u * 0.3, 0.62);
      rack.add(led);
    }
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.15, 1.3), mats.concreteDark);
    plinth.position.y = 0.07;
    rack.add(plinth);
    nodeGroup.add(rack);
  }
  group.add(nodeGroup);

  /* ---- overhead pod truss ring ----------------------------------------- */
  const trussRing = new THREE.Mesh(new THREE.TorusGeometry(9.8, 0.18, 8, 64), mats.steelDark);
  trussRing.rotation.x = Math.PI / 2;
  trussRing.position.set(centerX, 11.4, centerZ);
  group.add(trussRing);
  const hangerParts = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    hangerParts.push({ w: 0.08, h: 6.4, d: 0.08, x: centerX + Math.cos(a) * 9.8, y: 14.6, z: centerZ + Math.sin(a) * 9.8 });
    hangerParts.push({ w: 0.06, h: 5.0, d: 0.06, x: centerX + Math.cos(a) * 9.8, y: 8.9, z: centerZ + Math.sin(a) * 9.8 });
  }
  group.add(new THREE.Mesh(mergeParts(hangerParts), mats.steel));

  /* ---- pods ------------------------------------------------------------- */
  const podDefs = [];
  // v1 pods on the front arc
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI * 0.12 + (i / 5) * Math.PI * 0.76;
    podDefs.push({
      x: centerX + Math.cos(a) * 7.6,
      z: centerZ + Math.sin(a) * 7.6,
      y: 6.0 + (i % 2) * 0.4,
      version: 1,
      angle: a,
      index: i,
    });
  }
  // v2 canary pods, inner ring
  for (let i = 0; i < 3; i += 1) {
    const a = Math.PI * 0.25 + (i / 2) * Math.PI * 0.5;
    podDefs.push({
      x: centerX + Math.cos(a) * 4.2,
      z: centerZ + Math.sin(a) * 4.2,
      y: 6.8 + (i % 2) * 0.35,
      version: 2,
      angle: a,
      index: i,
    });
  }

  const podBodyGeo = new THREE.CylinderGeometry(1.35, 1.45, 0.66, 6, 1);
  const podRimGeo = new THREE.CylinderGeometry(1.44, 1.44, 0.09, 6, 1, true);
  const podCoreGeo = new THREE.SphereGeometry(0.38, 16, 12);
  const podGroups = [];
  podDefs.forEach((def) => {
    const pod = new THREE.Group();
    pod.position.set(def.x, def.y, def.z);
    const isV2 = def.version === 2;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: isV2 ? 0x7a5330 : 0x50646a,
      metalness: 0.9,
      roughness: 0.3,
      envMap: ctx.envMap,
      envMapIntensity: 0.9,
    });
    ctx.trackMaterial(bodyMat);
    const body = new THREE.Mesh(podBodyGeo, bodyMat);
    body.castShadow = true;
    pod.add(body);

    const rim = new THREE.Mesh(podRimGeo, isV2 ? mats.emitAmber : mats.emitTeal);

    pod.add(rim);

    const core = new THREE.Mesh(podCoreGeo, isV2 ? mats.emitAmber : mats.emitCyan);
    pod.add(core);

    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), isV2 ? mats.emitAmber : mats.emitCyan);
    spine.position.y = 0.9;
    pod.add(spine);

    const underRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.05, 6, 24),
      isV2 ? mats.emitAmber : mats.emitCyan
    );
    underRing.rotation.x = Math.PI / 2;
    underRing.position.y = -0.38;
    pod.add(underRing);

    const halo = glowSprite(ctx.textures.radial, isV2 ? 0xffb765 : 0x5fe3ff, 3.2, 0.26);
    pod.add(halo);

    // suspension rod
    for (let v = 0; v < 4; v += 1) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.05), mats.steel);
      vent.position.set(0, -0.22 + v * 0.13, 1.24);
      pod.add(vent);
    }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 6), mats.steel);
    rod.position.y = 1.5;
    pod.add(rod);

    // downward cone of light
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.9, 4.6, 14, 1, true),
      new THREE.MeshBasicMaterial({
        color: isV2 ? 0xffb765 : 0x5fe3ff,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    cone.position.y = -2.9;
    cone.rotation.x = Math.PI;
    pod.add(cone);

    group.add(pod);
    podGroups.push({ group: pod, def, isV2, baseY: def.y, halo, cone, rim, core });
  });

  /* ---- Envoy sidecar rings (instanced) --------------------------------- */
  const sidecarGeo = new THREE.TorusGeometry(0.48, 0.022, 5, 26);
  const sidecarMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  ctx.trackMaterial(sidecarMat);
  const sidecarCount = podGroups.length * 6;
  const sidecars = new THREE.InstancedMesh(sidecarGeo, sidecarMat, sidecarCount);
  sidecars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const sidecarState = [];
  const colorTeal = new THREE.Color(0x2fd0ac);
  const colorAmber = new THREE.Color(0xff9040);
  for (let p = 0; p < podGroups.length; p += 1) {
    const pg = podGroups[p];
    for (let s = 0; s < 6; s += 1) {
      sidecarState.push({
        pod: p,
        angle: (s / 6) * Math.PI * 2,
        tilt: randRange(random, -0.9, 0.9),
        speed: randRange(random, 0.2, 0.55),
        phase: random() * 6.28,
      });
      sidecars.setColorAt(p * 6 + s, pg.isV2 ? colorAmber : colorTeal);
    }
  }
  if (sidecars.instanceColor) sidecars.instanceColor.needsUpdate = true;
  group.add(sidecars);

  /* ---- traffic arcs ---------------------------------------------------- */
  const arcs = [];
  const ingressTop = new THREE.Vector3(ingressX + 0.6, 11.6, 0);
  podGroups.forEach((pg) => {
    const podTop = new THREE.Vector3(pg.def.x, pg.def.y + 0.4, pg.def.z);
    const points = bezierArc(ingressTop, podTop, 1.8 + (pg.isV2 ? 1.2 : 0), 40);
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, 0.11, 6, false);
    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorld;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: TRAFFIC_FRAG,
      uniforms: {
        uTime: ctx.uniforms.time,
        uColor: { value: new THREE.Color(pg.isV2 ? 0xffb765 : 0x4fe6c8) },
        uOpacity: { value: pg.isV2 ? 0 : 0.85 },
        uSpeed: { value: 0.9 },
        uFogColor: ctx.uniforms.fogColor,
        uFogDensity: ctx.uniforms.fogDensity,
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    ctx.trackMaterial(mat);
    const arc = new THREE.Mesh(geo, mat);
    group.add(arc);
    arcs.push({ mesh: arc, material: mat, isV2: pg.isV2, pod: pg });
  });

  // service-mesh lattice between adjacent v1 pods
  const latticePositions = [];
  const v1 = podGroups.filter((p) => !p.isV2);
  for (let i = 0; i < v1.length; i += 1) {
    const a = v1[i];
    const b = v1[(i + 1) % v1.length];
    latticePositions.push(a.def.x, a.def.y - 0.3, a.def.z, b.def.x, b.def.y - 0.3, b.def.z);
  }
  const latticeGeo = new THREE.BufferGeometry();
  latticeGeo.setAttribute('position', new THREE.Float32BufferAttribute(latticePositions, 3));
  const latticeMat = new THREE.LineBasicMaterial({ color: 0x3fd8c0, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
  ctx.trackMaterial(latticeMat);
  group.add(new THREE.LineSegments(latticeGeo, latticeMat));

  /* ---- operations wall -------------------------------------------------- */
  const wallX = centerX + 1;
  const wallZ = -16.5;
  const frameParts = [
    { w: 15.5, h: 0.3, d: 0.4, x: 0, y: 7.6, z: 0 },
    { w: 15.5, h: 0.3, d: 0.4, x: 0, y: 3.9, z: 0 },
    { w: 0.35, h: 4.0, d: 0.4, x: -7.6, y: 5.75, z: 0 },
    { w: 0.35, h: 4.0, d: 0.4, x: 7.6, y: 5.75, z: 0 },
  ];
  const wall = new THREE.Mesh(mergeParts(frameParts), mats.steelDark);
  wall.position.set(wallX, 0, wallZ);
  group.add(wall);
  for (let i = -1; i <= 1; i += 1) {
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.0), i === 1 ? mats.screenWarm : mats.screen);
    screen.position.set(wallX + i * 5.0, 5.75, wallZ + 0.05);
    group.add(screen);
  }
  const desk = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.18, 1.6), mats.steel);
  desk.position.set(wallX, 1.0, wallZ + 1.4);
  group.add(desk);
  for (const dx of [-3.5, 0, 3.5]) {
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), mats.steelDark);
    pedestal.position.set(wallX + dx, 0.45, wallZ + 1.4);
    group.add(pedestal);
  }

  // floor inlay rings
  const inlayMat = new THREE.MeshBasicMaterial({ color: 0x3fe0c8, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
  const inlay1 = new THREE.Mesh(new THREE.RingGeometry(9.4, 9.55, 72), inlayMat);
  inlay1.rotation.x = -Math.PI / 2;
  inlay1.position.set(centerX, 1.4, centerZ);
  group.add(inlay1);
  const inlay2 = new THREE.Mesh(new THREE.RingGeometry(6.0, 6.1, 72), inlayMat);
  inlay2.rotation.x = -Math.PI / 2;
  inlay2.position.set(centerX, 1.4, centerZ);
  group.add(inlay2);

  /* ---- animation -------------------------------------------------------- */
  const canaryState = ctx.canary;
  ctx.addAnimation((elapsed, delta) => {
    const mix = canaryState.mix;
    const m = ctx.scratch.matrix;
    const q = ctx.scratch.quat;
    const p = ctx.scratch.vec;
    const s = ctx.scratch.scale;

    // sidecar rings orbit each pod in drifting planes
    for (let i = 0; i < sidecarCount; i += 1) {
      const st = sidecarState[i];
      const pg = podGroups[st.pod];
      const scale = pg.isV2 ? lerp(0.3, 1.0, mix) : lerp(1.0, 0.86, mix);
      const a = st.angle + elapsed * st.speed * (pg.isV2 ? 1.5 : 1.0);
      const tilt = st.tilt + Math.sin(elapsed * 0.4 + st.phase) * 0.35;
      p.set(
        pg.def.x + Math.cos(a) * 1.85 * scale,
        pg.def.y + Math.sin(tilt) * 0.72 * scale,
        pg.def.z + Math.sin(a) * 1.85 * scale
      );
      q.setFromEuler(new THREE.Euler(0, -a, tilt));
      s.setScalar(scale);
      m.compose(p, q, s);
      sidecars.setMatrixAt(i, m);
    }
    sidecars.instanceMatrix.needsUpdate = true;

    podGroups.forEach((pg, i) => {
      const scale = pg.isV2 ? lerp(0.34, 1.0, mix) : lerp(1.0, 0.9, mix);
      pg.group.scale.setScalar(scale);
      pg.group.position.y = pg.baseY + Math.sin(elapsed * 0.8 + i * 0.7) * 0.12;
      pg.group.rotation.y = elapsed * 0.12 + i;
      pg.halo.material.opacity = (pg.isV2 ? 0.12 + mix * 0.4 : 0.3) * (0.8 + 0.2 * Math.sin(elapsed * 2 + i));
      pg.cone.material.opacity = pg.isV2 ? 0.03 + mix * 0.10 : 0.055;
    });

    arcs.forEach((arc) => {
      arc.material.uniforms.uOpacity.value = arc.isV2 ? mix * 0.95 : lerp(0.85, 0.42, mix);
    });

    sidecarMat.opacity = 0.20 + 0.08 * Math.sin(elapsed * 0.7);
    latticeMat.opacity = 0.18 + 0.14 * Math.sin(elapsed * 1.1);
  });

  /* ---- lights ---------------------------------------------------------- */
  const meshLight = new THREE.PointLight(0x6fe3ff, 70, 32, 2);
  meshLight.position.set(centerX, 9.8, centerZ);
  group.add(meshLight);
  const canaryLight = new THREE.PointLight(0xffb765, 0, 26, 2);
  canaryLight.position.set(centerX, 7.5, centerZ);
  group.add(canaryLight);
  ctx.canaryLight = canaryLight;

  ctx.group.add(group);
  return group;
}
/* ========================================================================== *
 *  Station 06 — Global Edge Observability
 * ========================================================================== */

const EARTH_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uAtmo;
  ${GLSL_NOISE}

  void main() {
    vec3 n = normalize(vPos);
    vec3 viewDir = normalize(cameraPosition - vWorld);

    // domain-warped continents
    vec3 warp = vec3(
      aiFbm3(n * 3.0 + vec3(3.1, 7.7, 1.3)),
      aiFbm3(n * 3.0 + vec3(8.4, 2.2, 5.9)),
      aiFbm3(n * 3.0 + vec3(13.2, 4.6, 9.4))
    );
    float cont = aiFbm3(n * 2.1 + warp * 0.65);
    float land = smoothstep(0.50, 0.545, cont);
    float coast = smoothstep(0.465, 0.505, cont) * (1.0 - smoothstep(0.50, 0.55, cont));
    float mountains = smoothstep(0.60, 0.78, cont);

    float deep = smoothstep(0.30, 0.47, cont);
    vec3 oceanCol = mix(vec3(0.008, 0.035, 0.085), vec3(0.015, 0.14, 0.25), deep);
    oceanCol = mix(oceanCol, vec3(0.03, 0.32, 0.38), coastalTint(cont));

    vec3 landCol = mix(vec3(0.08, 0.24, 0.11), vec3(0.42, 0.34, 0.16), smoothstep(0.52, 0.70, cont));
    landCol = mix(landCol, vec3(0.46, 0.42, 0.34), mountains * 0.75);
    landCol = mix(landCol, vec3(0.16, 0.34, 0.16), smoothstep(0.3, 0.6, aiFbm3(n * 9.0)) * 0.45);

    float ice = smoothstep(0.80, 0.94, abs(n.y) + (aiFbm3(n * 6.0) - 0.5) * 0.14);
    vec3 albedo = mix(oceanCol, landCol, land);
    albedo = mix(albedo, vec3(0.72, 0.80, 0.86), ice * 0.95);

    float ndl = clamp(dot(n, uSunDir), 0.0, 1.0);
    float twilight = smoothstep(-0.25, 0.25, dot(n, uSunDir));

    vec3 col = albedo * (0.035 + ndl * 1.32);

    // ocean sun glint
    vec3 halfV = normalize(uSunDir + viewDir);
    float spec = pow(clamp(dot(n, halfV), 0.0, 1.0), 120.0);
    col += vec3(0.72, 0.88, 1.0) * spec * (1.0 - land) * 1.9;

    // day-side haze
    float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 3.0);
    col += uAtmo * fres * 0.85;
    col += vec3(0.30, 0.52, 0.72) * pow(ndl, 6.0) * 0.10;

    // night side: city lights and a faint cybernetic graticule
    float night = 1.0 - twilight;
    float sparkle = aiFbm3(n * 46.0);
    float lights = land * night * smoothstep(0.50, 0.72, sparkle) * (1.0 - ice);
    lights += land * night * smoothstep(0.63, 0.80, aiFbm3(n * 90.0)) * 0.6;
    col += vec3(1.0, 0.70, 0.34) * lights * 1.9;

    float gu = abs(fract(vUv.x * 48.0) - 0.5);
    float gv = abs(fract(vUv.y * 24.0) - 0.5);
    float graticule = (1.0 - smoothstep(0.46, 0.5, gu)) + (1.0 - smoothstep(0.46, 0.5, gv));
    col += vec3(0.12, 0.55, 0.62) * graticule * night * 0.10;
    col += vec3(0.20, 0.60, 0.70) * coast * 0.25;

    // soft terminator warmth
    col += vec3(1.0, 0.44, 0.18) * exp(-pow((dot(n, uSunDir) - 0.02) * 7.0, 2.0)) * 0.10;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// helper used above (declared as a function through string concatenation trick)
const EARTH_FRAG_WITH_HELPER = EARTH_FRAG.replace(
  'void main() {',
  `float coastalTint(float c) { return smoothstep(0.42, 0.50, c) * (1.0 - smoothstep(0.50, 0.56, c)); }
  void main() {`
);

function buildEdgeStation(ctx) {
  const { mats } = ctx;
  const group = new THREE.Group();
  group.name = 'AiOpsStation06Edge';

  const earthCenter = new THREE.Vector3(
    OPS_LAYOUT.stations.edge.x,
    OPS_LAYOUT.stations.edge.y,
    OPS_LAYOUT.stations.edge.z
  );
  const radius = 74;

  /* ---- the globe ------------------------------------------------------- */
  const earthUniforms = {
    uTime: ctx.uniforms.time,
    uSunDir: { value: new THREE.Vector3(0.72, 0.34, 0.60).normalize() },
    uAtmo: { value: new THREE.Color(0x3f9fd8) },
  };
  const earthMat = new THREE.ShaderMaterial({
    uniforms: earthUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec2 vUv;
      void main() {
        vPos = position;
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: EARTH_FRAG_WITH_HELPER,
    fog: false,
  });
  ctx.trackMaterial(earthMat);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, ctx.cfg.earthSegments, ctx.cfg.earthSegments / 2), earthMat);
  earth.position.copy(earthCenter);
  earth.rotation.z = -0.41;
  earth.rotation.y = 1.1;
  group.add(earth);

  // atmosphere shell
  const atmoMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x3fa8e8) },
      uSunDir: earthUniforms.uSunDir,
      uTime: ctx.uniforms.time,
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      uniform vec3 uColor;
      uniform vec3 uSunDir;
      uniform float uTime;
      void main() {
        vec3 n = normalize(vNormalW);
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - abs(dot(n, viewDir)), 3.4);
        float sun = clamp(dot(n, uSunDir) * 0.5 + 0.62, 0.0, 1.0);
        vec3 col = mix(uColor, vec3(0.72, 0.82, 0.95), clamp(dot(n, uSunDir) * 0.5, 0.0, 0.32));
        gl_FragColor = vec4(col, fres * sun * 0.9);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  ctx.trackMaterial(atmoMat);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.075, 64, 40), atmoMat);
  atmo.position.copy(earthCenter);
  group.add(atmo);

  // cloud shell
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: ctx.uniforms.time,
      uSunDir: earthUniforms.uSunDir,
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        vPos = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vPos;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      uniform float uTime;
      uniform vec3 uSunDir;
      ${GLSL_NOISE}
      void main() {
        vec3 n = normalize(vPos);
        vec3 p = n * 3.2 + vec3(uTime * 0.004, 0.0, uTime * 0.002);
        float c = aiFbm3(p);
        float wisps = aiFbm3(p * 2.6 + 4.0);
        float a = smoothstep(0.62, 0.86, c * 0.7 + wisps * 0.4) * 0.20;
        float ndl = clamp(dot(n, uSunDir), 0.0, 1.0);
        float fres = pow(1.0 - abs(dot(n, normalize(cameraPosition - vWorld))), 1.4);
        vec3 col = mix(vec3(0.55, 0.62, 0.72), vec3(1.0, 0.98, 0.94), ndl);
        gl_FragColor = vec4(col, a * (0.25 + fres * 0.9));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  ctx.trackMaterial(cloudMat);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 72, 48), cloudMat);
  clouds.position.copy(earthCenter);
  group.add(clouds);

  /* ---- POP beacons ------------------------------------------------------ */
  const sites = [
    [37.77, -122.42],
    [40.71, -74.0],
    [51.51, -0.13],
    [52.52, 13.4],
    [35.68, 139.69],
    [1.35, 103.82],
    [19.08, 72.88],
    [-33.92, 18.42],
    [-23.55, -46.63],
    [25.2, 55.27],
    [48.86, 2.35],
    [-33.87, 151.21],
  ];
  const latLonToVec = (lat, lon, r) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  };

  const beaconGroup = new THREE.Group();
  sites.forEach(([lat, lon], i) => {
    const dir = latLonToVec(lat, lon, 1);
    const base = earthCenter.clone().addScaledVector(dir, radius * 1.005);
    const pinHeight = 5.5;
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.32, pinHeight, 8),
      i % 3 === 0 ? mats.emitAmber : mats.emitTeal
    );
    pin.position.copy(base).addScaledVector(dir, pinHeight / 2);
    pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    beaconGroup.add(pin);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), mats.emitWhite);
    head.position.copy(base).addScaledVector(dir, pinHeight);
    beaconGroup.add(head);

    const halo = glowSprite(ctx.textures.radial, 0x9fe8ff, 7, 0.55);
    halo.position.copy(head.position);
    beaconGroup.add(halo);

    // surface ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.2, 28),
      new THREE.MeshBasicMaterial({
        color: 0x6fe3ff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ring.position.copy(earthCenter).addScaledVector(dir, radius * 1.004);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    beaconGroup.add(ring);
  });
  group.add(beaconGroup);

  /* ---- great-circle latency arcs --------------------------------------- */
  const pairs = [
    [0, 4], [1, 3], [2, 7], [5, 4], [6, 10], [8, 1], [9, 3], [11, 5], [7, 2], [0, 11], [6, 5], [10, 9],
  ];
  const arcMaterials = [];
  pairs.forEach(([a, b], i) => {
    const da = latLonToVec(sites[a][0], sites[a][1], 1);
    const db = latLonToVec(sites[b][0], sites[b][1], 1);
    const points = [];
    const steps = 42;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const dir = new THREE.Vector3().copy(da).lerp(db, t).normalize();
      const lift = 1 + Math.sin(t * Math.PI) * 0.16;
      points.push(earthCenter.clone().addScaledVector(dir, radius * lift));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 60, 0.28, 6, false);
    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorld;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: TRAFFIC_FRAG,
      uniforms: {
        uTime: ctx.uniforms.time,
        uColor: { value: new THREE.Color(i % 3 === 0 ? 0xffb765 : 0x6fe3ff) },
        uOpacity: { value: 0.9 },
        uSpeed: { value: 0.35 + (i % 4) * 0.06 },
        uFogColor: ctx.uniforms.fogColor,
        uFogDensity: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    ctx.trackMaterial(mat);
    const arc = new THREE.Mesh(geo, mat);
    group.add(arc);
    arcMaterials.push(mat);
  });

  /* ---- local star field ------------------------------------------------ */
  const starCount = Math.round(900 * ctx.cfg.particleCount);
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i += 1) {
    const v = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize().multiplyScalar(randRange(Math.random, 320, 720));
    starPositions[i * 3] = earthCenter.x + v.x;
    starPositions[i * 3 + 1] = earthCenter.y + v.y;
    starPositions[i * 3 + 2] = earthCenter.z + v.z;
    starSizes[i] = randRange(Math.random, 0.6, 2.4);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xcfe6ff,
    size: 2.2,
    map: ctx.textures.radial,
    alphaTest: 0.02,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  ctx.trackMaterial(starMat);
  group.add(new THREE.Points(starGeo, starMat));

  /* ---- satellites ------------------------------------------------------- */
  const satellites = [];
  for (let i = 0; i < 2; i += 1) {
    const sat = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 1.4), mats.steel);
    sat.add(body);
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 1.9), new THREE.MeshStandardMaterial({
        color: 0x1b2c4a,
        metalness: 0.7,
        roughness: 0.25,
        emissive: 0x1b3f6a,
        emissiveIntensity: 0.4,
      }));
      panel.position.x = side * 4.0;
      sat.add(panel);
    }
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.6, 12), mats.brass);
    dish.rotation.x = Math.PI;
    dish.position.y = 0.9;
    sat.add(dish);
    group.add(sat);
    satellites.push({ group: sat, radius: 118 + i * 26, speed: 0.045 - i * 0.012, tilt: 0.6 + i * 0.5, phase: i * 2.4 });
  }

  /* ---- observation deck ------------------------------------------------ */
  const deck = new THREE.Group();
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x23282c,
    metalness: 0.35,
    roughness: 0.72,
    map: ctx.textures.concrete,
    envMap: ctx.envMap,
    envMapIntensity: 0.4,
  });
  ctx.trackMaterial(deckMat);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(60, 0.7, 120), deckMat);
  slab.position.set(276, -0.35, 14);
  slab.receiveShadow = true;
  deck.add(slab);

  // edge lighting strips
  for (const [x, z, w, d] of [
    [306, 14, 0.3, 120],
    [276, -46, 60, 0.3],
    [276, 74, 60, 0.3],
  ]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mats.emitCyan);
    strip.position.set(x, 0.04, z);
    deck.add(strip);
  }

  // railing
  const postGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
  const postPositions = [];
  for (let z = -44; z <= 72; z += 3.0) postPositions.push([305, z]);
  for (let x = 248; x <= 305; x += 3.0) postPositions.push([x, -43], [x, 71]);
  const posts = new THREE.InstancedMesh(postGeo, mats.steel, postPositions.length);
  const mm = new THREE.Matrix4();
  postPositions.forEach(([x, z], i) => {
    mm.makeTranslation(x, 0.6, z);
    posts.setMatrixAt(i, mm);
  });
  posts.instanceMatrix.needsUpdate = true;
  deck.add(posts);

  for (const [len, x, z, horiz] of [
    [120, 305, 14, false],
    [58, 276, -43, true],
    [58, 276, 71, true],
  ]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, len, 8), mats.brass);
    rail.rotation.z = horiz ? Math.PI / 2 : 0;
    if (horiz) rail.rotation.z = Math.PI / 2;
    if (!horiz) rail.rotation.x = Math.PI / 2;
    rail.position.set(x, 1.2, z);
    deck.add(rail);
  }

  // consoles and antenna
  for (const [x, z, ry] of [[262, 30, -0.4], [268, 52, 0.25]]) {
    const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.2), mats.steelDark);
    consoleBase.position.set(x, 0.5, z);
    consoleBase.rotation.y = ry;
    deck.add(consoleBase);
    const consoleTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.5), mats.brass);
    consoleTop.position.set(x, 1.06, z);
    consoleTop.rotation.y = ry;
    deck.add(consoleTop);
    const consoleScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), mats.screenWarm);
    consoleScreen.position.set(x, 1.55, z);
    consoleScreen.rotation.set(-0.6, ry, 0);
    deck.add(consoleScreen);
  }

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 2.2, 12), mats.concrete);
  pedestal.position.set(288, 1.1, 40);
  deck.add(pedestal);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(4.2, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), mats.steel);
  dish.position.set(288, 5.2, 40);
  dish.rotation.set(-2.2, 0.4, 0);
  dish.material = new THREE.MeshStandardMaterial({ color: 0xb8c4ca, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide, envMap: ctx.envMap });
  ctx.trackMaterial(dish.material);
  deck.add(dish);
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 6), mats.brass);
  feed.position.set(288, 6.6, 38.6);
  feed.rotation.x = 0.9;
  deck.add(feed);

  // edge observatory marker frame
  const markerTex = makeLabelTexture('GLOBAL EDGE', 'OBSERVABILITY DECK · 06', '#ffd6a0', { titleSize: 104 });
  if (markerTex) ctx.extraTextures.push(markerTex);
  const markerMat = new THREE.MeshStandardMaterial({
    map: markerTex, emissive: 0xffffff, emissiveMap: markerTex, emissiveIntensity: 0.45,
    color: 0x30363a, metalness: 0.5, roughness: 0.55,
  });
  ctx.trackMaterial(markerMat);
  const markerPanel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.7, 7.2), markerMat);
  markerPanel.position.set(265, 5.0, -14);
  deck.add(markerPanel);
  for (const dz of [-2.6, 2.6]) {
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.0, 0.35), mats.steelDark);
    pylon.position.set(265, 3.0, -14 + dz);
    deck.add(pylon);
  }
  group.add(deck);

  // low glass wind screen at the end of the hall
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(70, 3.2), mats.glass);
  screen.rotation.y = -Math.PI / 2;
  screen.position.set(247, 1.6, 0);
  group.add(screen);

  /* ---- observation skybridge out toward the edge ------------------------ */
  const bridgeGroup = new THREE.Group();
  const bridgeAngle = Math.atan2(-16, 48);
  const bridgeSlab = new THREE.Mesh(new THREE.BoxGeometry(52, 0.4, 3.8), deckMat);
  bridgeSlab.position.set(324, 5.6, 14);
  bridgeSlab.rotation.y = bridgeAngle;
  bridgeGroup.add(bridgeSlab);

  for (const side of [-1, 1]) {
    const offsetX = Math.cos(bridgeAngle + Math.PI / 2) * side * 1.8;
    const offsetZ = Math.sin(bridgeAngle + Math.PI / 2) * side * 1.8;
    for (let k = 0; k < 18; k += 1) {
      const t = k / 17;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.05, 0.07), mats.steel);
      post.position.set(300 + t * 48 + offsetX, 6.3, 22 - t * 16 + offsetZ);
      bridgeGroup.add(post);
    }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 52, 6), mats.brass);
    rail.position.set(324 + offsetX, 6.9, 14 + offsetZ);
    rail.rotation.z = Math.PI / 2;
    rail.rotation.y = -bridgeAngle;
    bridgeGroup.add(rail);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(52, 0.03, 0.08), mats.emitCyan);
    strip.position.set(324 + offsetX, 5.82, 14 + offsetZ);
    strip.rotation.y = bridgeAngle;
    bridgeGroup.add(strip);
  }

  for (const [x, z] of [[312, 21], [332, 10.5], [348, 5.4]]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 5.6, 8), mats.steelDark);
    strut.position.set(x, 2.8, z);
    bridgeGroup.add(strut);
  }

  const platform = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.8, 0.5, 24), mats.concreteDark);
  platform.position.set(352, 5.55, 3.4);
  bridgeGroup.add(platform);
  const platformRing = new THREE.Mesh(new THREE.TorusGeometry(6.3, 0.09, 6, 40), mats.brass);
  platformRing.rotation.x = Math.PI / 2;
  platformRing.position.set(352, 5.85, 3.4);
  bridgeGroup.add(platformRing);
  const beaconMast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 9.0, 8), mats.steel);
  beaconMast.position.set(353, 10.3, 6.2);
  bridgeGroup.add(beaconMast);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
  beacon.position.set(353, 14.9, 6.2);
  bridgeGroup.add(beacon);
  ctx.registerBlinker(beacon, 0.8);
  const beaconHalo = glowSprite(ctx.textures.radial, 0xffd9a0, 3.4, 0.45);
  beaconHalo.position.copy(beacon.position);
  bridgeGroup.add(beaconHalo);
  group.add(bridgeGroup);

  /* ---- animation -------------------------------------------------------- */
  ctx.addAnimation((elapsed, delta) => {
    earth.rotation.y = 1.1 + elapsed * 0.0045;
    clouds.rotation.y = 1.1 + elapsed * 0.0062;
    satellites.forEach((s) => {
      const a = s.phase + elapsed * s.speed;
      s.group.position.set(
        earthCenter.x + Math.cos(a) * s.radius * Math.cos(s.tilt),
        earthCenter.y + Math.sin(a) * s.radius * Math.sin(s.tilt),
        earthCenter.z + Math.sin(a) * s.radius * Math.cos(s.tilt)
      );
      s.group.rotation.y = -a;
      s.group.rotation.z = 0.4;
    });
  });

  /* ---- lights ----------------------------------------------------------- */
  const deckLight = new THREE.PointLight(0xffd6a0, 60, 60, 2);
  deckLight.position.set(272, 6, 24);
  group.add(deckLight);
  const rimLight = new THREE.DirectionalLight(0x8fc8ff, 0.7);
  rimLight.position.set(100, 80, 200);
  group.add(rimLight);

  ctx.group.add(group);
  return group;
}
/* ========================================================================== *
 *  Camera choreography
 *
 *  Each key composes the hero subject to the RIGHT of screen centre so the
 *  portfolio card on the left never covers it. `shift` is the subject's NDC x
 *  coordinate: 0.24 means roughly 62 % across the viewport on a 16:9 screen.
 * ========================================================================== */

const CAMERA_KEYS = [
  { p: 0.0, pos: [-254, 15.0, 37], subj: [-208, 8.0, -2], fov: 42, shift: 0.22 },
  { p: 0.075, pos: [-250, 13.0, 33], subj: [-210, 8.0, -2], fov: 44, shift: 0.24 },
  { p: 0.155, pos: [-222, 10.5, 26], subj: [-198, 6.5, -2], fov: 48, shift: 0.25 },
  { p: 0.2, pos: [-168, 11.0, 20], subj: [-146, 10.0, -4], fov: 50, shift: 0.24 },
  { p: 0.26, pos: [-144, 10.6, 15], subj: [-124, 9.8, 0], fov: 44, shift: 0.24 },
  { p: 0.315, pos: [-134, 10.2, 12], subj: [-117, 9.4, 0], fov: 44, shift: 0.24 },
  { p: 0.36, pos: [-112, 11.2, 27], subj: [-64, 6.8, -6], fov: 52, shift: 0.24 },
  { p: 0.405, pos: [-80, 10.2, 16], subj: [-36, 6.2, -10], fov: 54, shift: 0.24 },
  { p: 0.445, pos: [-52, 5.5, -6], subj: [-30, 3.5, -16], fov: 55, shift: 0.22 },
  { p: 0.475, pos: [-32, 2.3, -16], subj: [-14, 2.0, -16], fov: 58, shift: 0.18 },
  { p: 0.515, pos: [-18, 2.35, -16], subj: [4, 2.0, -16], fov: 58, shift: 0.18 },
  { p: 0.555, pos: [0, 5.6, -12], subj: [42, 6.6, 2], fov: 56, shift: 0.23 },
  { p: 0.6, pos: [40, 9.6, 21], subj: [84, 7.2, 0], fov: 50, shift: 0.24 },
  { p: 0.655, pos: [66, 8.2, 14], subj: [88, 6.5, 0], fov: 44, shift: 0.24 },
  { p: 0.7, pos: [76, 9.8, 26], subj: [106, 7.0, -2], fov: 50, shift: 0.24 },
  { p: 0.74, pos: [104, 10.4, 26], subj: [140, 8.0, 0], fov: 52, shift: 0.24 },
  { p: 0.79, pos: [152, 9.5, 20], subj: [178, 7.6, 0], fov: 52, shift: 0.24 },
  { p: 0.845, pos: [169, 7.4, 11], subj: [182, 6.0, -1], fov: 52, shift: 0.24 },
  { p: 0.885, pos: [184, 9.0, 14], subj: [212, 8.0, -8], fov: 52, shift: 0.24 },
  { p: 0.925, pos: [204, 11.6, 24], subj: [258, 14.0, -8], fov: 54, shift: 0.24 },
  { p: 0.955, pos: [238, 14.5, 26], subj: [368, 48, -18], fov: 58, shift: 0.16 },
  { p: 1.0, pos: [262, 18.0, 34], subj: [540, 66, -30], fov: 62, shift: 0.10 },
];

const DEG2RAD = Math.PI / 180;

function composeFraming(position, subject, fov, shift, aspect, outLook) {
  const distance = Math.max(1.0, position.distanceTo(subject));
  const forward = outLook.copy(subject).sub(position).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  right.normalize();
  const tanHalfV = Math.tan((fov * DEG2RAD) / 2);
  const tanHalfH = tanHalfV * Math.max(0.2, aspect);
  const tanYaw = shift * tanHalfH;
  const lookDir = forward.clone().addScaledVector(right, -tanYaw).normalize();
  outLook.copy(position).addScaledVector(lookDir, distance);
  return outLook;
}

function sampleCameraPath(progress, aspect, out) {
  const p = clamp01(progress);
  let i = 0;
  while (i < CAMERA_KEYS.length - 2 && p > CAMERA_KEYS[i + 1].p) i += 1;
  const a = CAMERA_KEYS[i];
  const b = CAMERA_KEYS[i + 1];
  const t = clamp01((p - a.p) / Math.max(1e-6, b.p - a.p));
  const e = smootherstep(0, 1, t);

  out.position.set(
    lerp(a.pos[0], b.pos[0], e),
    lerp(a.pos[1], b.pos[1], e),
    lerp(a.pos[2], b.pos[2], e)
  );
  const subject = new THREE.Vector3(
    lerp(a.subj[0], b.subj[0], e),
    lerp(a.subj[1], b.subj[1], e),
    lerp(a.subj[2], b.subj[2], e)
  );
  out.fov = lerp(a.fov, b.fov, e);
  const shift = lerp(a.shift !== undefined ? a.shift : 0.24, b.shift !== undefined ? b.shift : 0.24, e);

  // a slow breath so a still camera never looks frozen, plus a faint handheld
  // tremor that reads as a real camera operator rather than a locked rig
  out.position.x += Math.sin(p * 41.0) * 0.045 + Math.sin(p * 13.0) * 0.16;
  out.position.y += Math.sin(p * 29.0 + 1.3) * 0.06 + Math.sin(p * 8.0) * 0.12;
  out.position.z += Math.cos(p * 17.0 + 0.6) * 0.10;

  composeFraming(out.position, subject, out.fov, shift, aspect, out.lookAt);
  return out;
}

/* ========================================================================== *
 *  Telemetry — smooth, plausible, always finite
 * ========================================================================== */

function telemetryFor(progress, time) {
  const p = clamp01(progress);
  const t = finite(time, 0);
  const settle = smootherstep(0.02, 0.3, p);
  const edge = smoothstep(0.9, 1.0, p);

  const paramsB = finite(3.6 + 11.2 * smootherstep(0.18, 0.94, p) + 0.04 * Math.sin(t * 0.23), 14.8);
  const throughput =
    82 +
    150 * settle * (0.88 + 0.08 * Math.sin(t * 0.41) + 0.04 * Math.sin(t * 1.7)) +
    30 * edge +
    6 * Math.sin(t * 2.3);
  const throughputQps = Math.round(finite(throughput, 120) * 1000);

  const gpuBase = 34 + 58 * (smoothstep(0.34, 0.42, p) * (1 - smoothstep(0.54, 0.62, p)));
  const gpuUtilPct = finite(
    gpuBase + 4.5 * Math.sin(t * 0.7) + 2.2 * Math.sin(t * 2.9 + 1.1) + 1.5 * Math.sin(t * 7.3),
    gpuBase
  );

  const p99Base = 46 - 22 * smootherstep(0.0, 0.35, p) - 8 * edge;
  const p99Ms = finite(
    p99Base + 3.5 * Math.sin(t * 0.53 + 0.7) + 1.8 * Math.sin(t * 3.1) + 0.9 * Math.sin(t * 9.7),
    p99Base
  );

  const healthPct = finite(99.995 - 0.014 * (1 - smootherstep(0.1, 0.6, p)) + 0.002 * Math.sin(t * 0.31), 99.99);
  const timeOfDay = finite(0.52 + 0.48 * smoothstep(0.82, 1.0, p), 1);

  return {
    paramsB: Math.round(paramsB * 100) / 100,
    throughputQps,
    gpuUtilPct: Math.round(clamp(gpuUtilPct, 0, 100) * 10) / 10,
    p99Ms: Math.round(clamp(p99Ms, 6, 90) * 10) / 10,
    healthPct: Math.round(clamp(healthPct, 99.9, 100) * 1000) / 1000,
    timeOfDay: Math.round(timeOfDay * 1000) / 1000,
  };
}

/* ========================================================================== *
 *  World factory
 * ========================================================================== */

export function createAiOpsWorld(scene, options = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new Error('createAiOpsWorld(scene, options): a THREE.Scene is required');
  }

  const cfg = resolveConfig(options);
  const group = new THREE.Group();
  group.name = 'AiOpsWorld';

  const scratch = {
    matrix: new THREE.Matrix4(),
    quat: new THREE.Quaternion(),
    scale: new THREE.Vector3(1, 1, 1),
    vec: new THREE.Vector3(),
    color: new THREE.Color(),
  };

  const uniforms = {
    time: { value: 0 },
    fogColor: { value: new THREE.Color(0x101a23) },
    fogDensity: { value: 0.0019 },
    seamColor: { value: new THREE.Color(0x2b8e9e) },
  };

  const animations = [];
  const materials = new Set();
  const extraTextures = [];
  const blinkers = [];
  const canary = { target: false, mix: 0 };
  const stationHooks = {};

  const envMap = makeEnvironmentTexture();
  envMap.mapping = THREE.EquirectangularReflectionMapping;

  const textures = {
    brushed: makeBrushedTexture(),
    concrete: makeConcreteTexture(),
    rack: makeRackPanelTexture(),
    hazard: makeHazardTexture(),
    screen: makeScreenTexture('latency', '#5fe3ff', 1),
    screenWarm: makeScreenTexture('loss', '#ffc078', 2),
    radial: makeRadialGlowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'),
  };
  const createdTextures = new Set();
  for (const tex of Object.values(textures)) if (tex) createdTextures.add(tex);
  if (envMap) createdTextures.add(envMap);

  const ctx = {
    scene,
    group,
    cfg,
    envMap,
    textures,
    uniforms,
    scratch,
    extraTextures,
    canary,
    stationHooks,
    clock: { elapsed: 0 },
    animations,
    canaryLight: null,
    trackMaterial(material) {
      if (material) materials.add(material);
      return material;
    },
    addMaterial(material) {
      if (material) materials.add(material);
      return material;
    },
    addAnimation(fn) {
      if (typeof fn === 'function') animations.push(fn);
    },
    registerBlinker(object, rate = 1, phase = Math.random() * 6.28) {
      if (!object) return;
      const material = object.material;
      if (!material) return;
      if (material.color) {
        blinkers.push({
          object,
          material,
          baseColor: material.color.clone(),
          baseIntensity: material.emissiveIntensity !== undefined ? material.emissiveIntensity : null,
          rate,
          phase,
        });
      }
    },
  };

  ctx.mats = createMaterialSet(ctx);

  for (const texture of Object.values(textures)) {
    if (texture) createdTextures.add(texture);
  }
  if (ctx.mats.screen && ctx.mats.screen.emissiveMap) createdTextures.add(ctx.mats.screen.emissiveMap);

  /* ---- fog & background -------------------------------------------------- */
  const previousFog = scene.fog || null;
  let ownFog = null;
  if (cfg.manageFog) {
    ownFog = new THREE.FogExp2(0x101a23, 0.0017);
    scene.fog = ownFog;
  }
  const previousBackground = scene.background !== undefined ? scene.background : null;
  let ownBackground = null;
  if (cfg.manageBackground) {
    ownBackground = new THREE.Color(0x04070a);
    scene.background = ownBackground;
  }

  /* ---- environment ------------------------------------------------------- */
  const sky = buildSky(ctx);
  buildGround(ctx);
  buildSkyline(ctx);
  buildFloor(ctx);
  buildStructure(ctx);
  buildSignage(ctx);

  /* ---- stations ---------------------------------------------------------- */
  buildIngestion(ctx);
  buildCore(ctx);
  buildGpuCluster(ctx);
  buildCicdGantry(ctx);
  buildMeshStation(ctx);
  buildEdgeStation(ctx);

  /* ---- lighting ---------------------------------------------------------- */
  const hemi = new THREE.HemisphereLight(0x5d86a6, 0x2a1c12, 1.15);
  hemi.position.set(0, 40, 0);
  group.add(hemi);

  const ambient = new THREE.AmbientLight(0x33465a, 0.38);
  group.add(ambient);

  const key = new THREE.DirectionalLight(0xffd0a2, 2.1);
  key.position.set(180, 240, 140);
  key.target.position.set(-20, 0, 0);
  if (cfg.shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(cfg.shadowMapSize, cfg.shadowMapSize);
    key.shadow.camera.left = -220;
    key.shadow.camera.right = 220;
    key.shadow.camera.top = 160;
    key.shadow.camera.bottom = -160;
    key.shadow.camera.near = 20;
    key.shadow.camera.far = 720;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.6;
  }
  group.add(key);
  group.add(key.target);

  const fill = new THREE.DirectionalLight(0x6aa8d4, 0.85);
  fill.position.set(-220, 140, -180);
  fill.target.position.set(0, 10, 0);
  group.add(fill);
  group.add(fill.target);

  // early-evening sun raking in through the open south colonnade: this is the
  // light that gives the hall its modelling and long shadows
  const sun = new THREE.DirectionalLight(0xffd2b0, 1.0);
  sun.position.set(160, 90, 340);
  sun.target.position.set(-40, 8, -18);
  group.add(sun);
  group.add(sun.target);

  const navWarm = new THREE.PointLight(0xffb765, 35, 90, 2);
  navWarm.position.set(60, 8, 0);
  group.add(navWarm);

  // a sparse run of warm nave practicals so the architecture reads at blue hour
  const naveLights = [];
  for (const [x, z, intensity] of [
    [-222, 2, 70],
    [-150, -2, 60],
    [-70, 4, 95],
    [20, 0, 70],
    [112, 2, 80],
    [206, 0, 60],
  ]) {
    const lamp = new THREE.PointLight(0xffbd83, intensity, 68, 2);
    lamp.position.set(x, 10.6, z);
    group.add(lamp);
    naveLights.push(lamp);
  }

  scene.add(group);

  /* ---- pose -------------------------------------------------------------- */
  const poseOut = { position: new THREE.Vector3(), lookAt: new THREE.Vector3(), fov: 52 };
  let aspect = cfg.viewportAspect;

  function getOpsPose(progress = 0) {
    const p = clamp01(progress);
    sampleCameraPath(p, aspect, poseOut);
    const phaseInfo = phaseAtProgress(p);
    const metrics = telemetryFor(p, ctx.clock.elapsed);
    return {
      cameraPos: poseOut.position.clone(),
      lookAt: poseOut.lookAt.clone(),
      fov: poseOut.fov,
      phaseName: phaseInfo.phase.name,
      phaseId: phaseInfo.phase.id,
      station: phaseInfo.station,
      paramsB: metrics.paramsB,
      throughputQps: metrics.throughputQps,
      gpuUtilPct: metrics.gpuUtilPct,
      p99Ms: metrics.p99Ms,
      healthPct: metrics.healthPct,
      timeOfDay: metrics.timeOfDay,
    };
  }

  function setViewport(nextAspect) {
    if (Number.isFinite(nextAspect) && nextAspect > 0.1) aspect = clamp(nextAspect, 0.4, 3.5);
  }

  /* ---- update ------------------------------------------------------------ */
  let lastElapsed = 0;

  function update(elapsed, delta, progress, camera) {
    const t = Number.isFinite(elapsed) ? elapsed : lastElapsed + 0.016;
    const dt = clamp(Number.isFinite(delta) ? delta : 0.016, 0, 0.1);
    lastElapsed = t;
    ctx.clock.elapsed = t;
    uniforms.time.value = t;

    const p = clamp01(Number.isFinite(progress) ? progress : 0);

    // sky follows the eye so the dome never shows a seam
    if (camera && camera.position) {
      sky.mesh.position.copy(camera.position);
    }

    // atmosphere deepens toward the observation deck
    if (ownFog) {
      const targetDensity = lerp(0.00225, 0.00085, smoothstep(0.86, 1.0, p));
      ownFog.density += (targetDensity - ownFog.density) * Math.min(1, dt * 2.0);
      uniforms.fogDensity.value = ownFog.density;
    }

    // canary transition — smooth, with a little overshoot in the light only
    const target = canary.target ? 1 : 0;
    canary.mix += clamp(target - canary.mix, -dt * 0.85, dt * 0.85);
    if (ctx.canaryLight) ctx.canaryLight.intensity = canary.mix * 70;

    for (let i = 0; i < animations.length; i += 1) animations[i](t, dt, p);

    for (let i = 0; i < blinkers.length; i += 1) {
      const b = blinkers[i];
      const wave = 0.5 + 0.5 * Math.sin(t * b.rate * 2.4 + b.phase);
      b.material.color.copy(b.baseColor).multiplyScalar(0.25 + wave * 0.95);
      if (b.baseIntensity !== null && b.material.emissiveIntensity !== undefined) {
        b.material.emissiveIntensity = 0.6 + wave * b.baseIntensity;
      }
    }

    // the sky deepens into space at the edge
    sky.uniforms.uNight.value = smoothstep(0.86, 1.0, p);

    // navigation light breathes with the station
    navWarm.intensity = 26 + 14 * Math.sin(t * 0.5) + 10 * smoothstep(0.55, 0.75, p);

    // tone the key light with the time of day
    key.intensity = lerp(2.1, 1.35, smoothstep(0.85, 1.0, p));
    hemi.intensity = lerp(1.15, 0.85, smoothstep(0.85, 1.0, p));
    ambient.intensity = lerp(0.38, 0.26, smoothstep(0.85, 1.0, p));
  }

  /* ---- interaction ------------------------------------------------------- */
  function triggerForwardPass() {
    const hook = stationHooks.core;
    if (!hook) return false;
    return hook.trigger();
  }

  function setCanaryRollout(enabled) {
    canary.target = !!enabled;
    return canary.target;
  }

  function getCanaryRollout() {
    return canary.target;
  }

  /* ---- zones ------------------------------------------------------------- */
  const zones = AI_OPS_PHASES.map((phase, i) => {
    const key = phase.id;
    const spot = OPS_LAYOUT.stations[key] || { x: 0, z: 0 };
    return {
      id: key,
      name: phase.name,
      station: i + 1,
      start: phase.start,
      end: phase.end,
      center: new THREE.Vector3(spot.x, 4, spot.z || 0),
      radius: key === 'edge' ? 150 : 34,
    };
  });

  const lights = {
    hemi,
    ambient,
    key,
    fill,
    sun,
    navWarm,
    nave: naveLights,
    get station() {
      return group.children.filter((child) => child.isLight);
    },
  };

  /* ---- dispose ----------------------------------------------------------- */
  function dispose() {
    animations.length = 0;
    blinkers.length = 0;
    scene.remove(group);
    group.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (const mat of list) {
          if (!mat) continue;
          for (const value of Object.values(mat)) {
            if (value && value.isTexture) value.dispose();
          }
          mat.dispose();
        }
      }
      if (object.material && object.material.map && object.material.map.isTexture) object.material.map.dispose();
    });
    for (const mat of materials) mat.dispose();
    for (const tex of createdTextures) if (tex) tex.dispose();
    for (const tex of extraTextures) if (tex) tex.dispose();
    if (scene.fog === ownFog) scene.fog = previousFog;
    if (scene.background === ownBackground) scene.background = previousBackground;
  }

  return {
    group,
    lights,
    zones,
    getOpsPose,
    setViewport,
    triggerForwardPass,
    setCanaryRollout,
    getCanaryRollout,
    update,
    dispose,
  };
}
