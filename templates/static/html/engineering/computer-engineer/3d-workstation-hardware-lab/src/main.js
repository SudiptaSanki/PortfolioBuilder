/**
 * main.js
 * -----------------------------------------------------------------------------
 * Boots the computer-engineering 3D portfolio: renderer, the verified hardware
 * rig, the airflow / signal overlay, the synthesised hardware audio, the
 * scroll → zone → camera-spline system, the HUD and the live telemetry.
 *
 * World contract (shared by the three hardware modules)
 *   Rig space .......... 1 unit = 1 cm, origin at the chassis centre
 *   Floor ............... y = -30.5          (rig.FLOOR_Y)
 *   Enclosure ........... x ±27, y ±30.5, z -13 … +23
 *   Camera .............. fov 36, hero distance ≈ 120 units so the 60.5u rig
 *                         (and its exploded extents) always fit the frame
 *
 * One state drives every surface:
 *   workload (ai / thermal / fan) + explode → rig shaders, airflow density,
 *   coolant flow, audio filter, the telemetry strip and the rail.
 */

import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
// gsap's ESM build exposes ScrollTrigger as the default export of the plugin
// entry (npm, esm.sh and CDN copies all agree on that shape).
import ScrollTrigger from 'gsap/ScrollTrigger';

import { createHardwareRig } from './scene/hardwareRig.js';
import { createAirflowAndSignals } from './scene/airflowAndSignals.js';
import { createHardwareAudio } from './audio/hardwareAudio.js';

import portfolio, { resolvePath, isRealLink } from './config/portfolio.js';

gsap.registerPlugin(ScrollTrigger);

/* ========================================================================== */
/* 0. Utilities                                                               */
/* ========================================================================== */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const damp = (dt, rate) => 1 - Math.exp(-dt * rate);
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** "1,580" — thousands separated, for RPM readouts. */
const formatInt = (value) => Math.round(value).toLocaleString('en-US');

function readReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ========================================================================== */
/* 1. World constants                                                         */
/* ========================================================================== */

/** Chassis envelope — kept in sync with `CHASSIS` in hardwareRig.js. */
const FLOW_BOUNDS = { min: [-27, -30.5, -13], max: [27, 30.5, 23] };

/**
 * Camera stations, one per zone. `pos` is the camera, `look` what it frames,
 * `shift` moves the subject inside the frame ([0,0] = dead centre, positive x
 * pushes the rig to the right of frame so copy can sit on the left), and
 * `explode` is the automatic explode amount for that zone.
 *
 * Hero distance: |[38,26,114] - [0,1,3]| ≈ 120 units at fov 36 — the full
 * 60.5u rig fits with breathing room on 1440×900 and above.
 */
const CAMERA_POSES = [
  { id: 'overview', pos: [38, 28, 124], look: [0, 2, 4], fov: 36, shift: [0.24, 0], explode: 0 },
  { id: 'motherboard', pos: [7, 7, 80], look: [0, -2, 1], fov: 36, shift: [0.24, 0], explode: 0 },
  { id: 'cpu', pos: [-3.4, 9.8, 28], look: [-5.6, 5.1, 2.4], fov: 34, shift: [0.26, 0], explode: 0 },
  { id: 'cooling', pos: [48, 40, 66], look: [12, 16, 6], fov: 40, shift: [0.22, 0], explode: 0 },
  { id: 'gpu', pos: [10, -2, 62], look: [-4.5, -8.5, 6], fov: 36, shift: [0.26, 0], explode: 0 },
  { id: 'architecture', pos: [34, 24, 148], look: [0, 3, 6], fov: 36, shift: [0.2, 0], explode: 1 }
];

/** Workload presets. `normal` is a desktop at idle-plus; `surge` is training. */
const WORKLOADS = {
  normal: { label: 'Normal', ai: 0.28, thermal: 0.32, fan: 0.72 },
  surge: { label: 'AI Surge', ai: 0.96, thermal: 0.9, fan: 1.34 }
};

/* ========================================================================== */
/* 2. View profile (desktop / tablet / portrait phone)                        */
/* ========================================================================== */

function readView() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  const portrait = aspect < 0.92;
  const narrow = width <= 860;
  const lean = narrow || portrait || (navigator.hardwareConcurrency || 8) <= 4;

  return {
    width,
    height,
    aspect,
    narrow,
    portrait,
    // Portrait phones get a wider lens and a longer lens-to-rig distance so the
    // 54u-wide chassis still fits, while close-ups stay inside the X-ray range.
    fovBoost: portrait ? 12 : aspect < 1.3 ? 4 : 0,
    distanceScale: portrait ? 1.3 : aspect < 1.3 ? 1.12 : 1,
    // Copy sits on the left on wide screens; on phones it sits under the subject.
    shiftScale: portrait || narrow ? 0 : 1,
    liftY: portrait ? 0.1 : narrow ? 0.06 : 0,
    // The rig always runs its full 'high' geometry tier; the lean-device budget
    // is taken from the airflow particle count and the pixel ratio instead.
    particleCount: lean ? (portrait ? 3200 : 4200) : 8000,
    maxPixelRatio: Math.min(window.devicePixelRatio || 1, lean ? 1.6 : 2)
  };
}

/* ========================================================================== */
/* 3. Config → DOM                                                            */
/* ========================================================================== */

function bindConfig() {
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const value = resolvePath(portfolio, el.dataset.bind);
    if (value == null) {
      el.remove();
      return;
    }
    el.textContent = String(value);
  });

  document.querySelectorAll('[data-bind-href]').forEach((el) => {
    const href = resolvePath(portfolio, el.dataset.bindHref);
    if (!isRealLink(href)) {
      el.setAttribute('hidden', '');
      return;
    }
    el.setAttribute('href', href);
    el.removeAttribute('hidden');
  });

  const year = document.getElementById('footer-year');
  if (year) year.textContent = String(new Date().getFullYear());

  document.title = `${portfolio.brand.name} — Computer Engineering & AI Hardware`;
}

function renderContactLinks() {
  const list = document.getElementById('contact-links');
  if (!list) return;
  list.replaceChildren();

  (portfolio.contact.links || [])
    .filter((link) => link && isRealLink(link.href))
    .forEach((link) => {
      const anchor = document.createElement('a');
      anchor.className = 'link';
      anchor.href = link.href;
      if (/^https?:/i.test(link.href)) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }

      const label = document.createElement('span');
      label.className = 'link__label';
      label.textContent = link.label;

      const value = document.createElement('span');
      value.textContent = link.value || link.href.replace(/^mailto:/, '');

      anchor.append(label, value);
      list.append(anchor);
    });
}

/* ========================================================================== */
/* 4. Zone rail                                                               */
/* ========================================================================== */

let railCenters = [];

function buildRail(onJump) {
  const ticks = document.getElementById('rail-ticks');
  const track = document.getElementById('rail-track');
  if (!ticks || !track) return;

  ticks.replaceChildren();

  portfolio.sections.forEach((section, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rail__tick';
    button.dataset.zone = section.id;
    button.setAttribute('aria-label', `Jump to zone ${section.index} — ${section.name}`);

    const num = document.createElement('span');
    num.className = 'rail__num';
    num.textContent = section.index;

    const label = document.createElement('span');
    label.className = 'rail__label';
    label.textContent = section.short || section.name;

    button.append(num, label);
    button.addEventListener('click', () => onJump(section.id));
    ticks.append(button);
  });

  measureRail();
}

function measureRail() {
  const track = document.getElementById('rail-track');
  if (!track) return;
  const buttons = [...track.querySelectorAll('.rail__tick')];
  railCenters = buttons.map((button) => button.offsetTop + button.offsetHeight / 2);
}

let railZoneIndex = -1;

function updateRail(index, t) {
  const fill = document.getElementById('rail-fill');
  const zone = document.getElementById('rail-zone');

  if (index !== railZoneIndex) {
    railZoneIndex = index;
    const buttons = document.querySelectorAll('.rail__tick');
    buttons.forEach((button, i) => {
      const active = i === index;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'true' : 'false');
    });
    const section = portfolio.sections[index];
    if (zone && section) zone.textContent = section.index;
  }

  if (fill && railCenters.length > 1) {
    const a = railCenters[index] ?? 0;
    const b = railCenters[Math.min(index + 1, railCenters.length - 1)] ?? a;
    fill.style.height = `${(a + (b - a) * clamp01(t)).toFixed(1)}px`;
  }
}

/* ========================================================================== */
/* 5. Loading veil                                                            */
/* ========================================================================== */

const veil = {
  el: document.getElementById('loader'),
  bar: document.getElementById('loader-bar'),
  note: document.getElementById('loader-note'),
  zone: document.getElementById('loader-zone'),
  zoneName: document.getElementById('loader-zone-name'),
  progress: 0
};

function setVeil(progress, note, zoneIndex) {
  if (!veil.el) return;
  veil.progress = clamp01(progress);
  if (veil.bar) veil.bar.style.width = `${(veil.progress * 100).toFixed(1)}%`;
  if (note && veil.note) veil.note.textContent = note;
  if (zoneIndex != null) {
    const section = portfolio.sections[zoneIndex];
    if (section) {
      if (veil.zone) veil.zone.textContent = section.index;
      if (veil.zoneName) veil.zoneName.textContent = section.name;
    }
  }
}

async function veilStep(progress, note, zoneIndex) {
  setVeil(progress, note, zoneIndex);
  await nextFrame();
  await sleep(28);
}

async function veilFinish() {
  if (!veil.el) return;
  setVeil(1, 'Ready — scroll to open the case');
  await sleep(160);
  veil.el.classList.add('is-hidden');
  veil.el.setAttribute('aria-hidden', 'true');
  await sleep(760);
  if (veil.el && veil.el.parentNode) veil.el.parentNode.removeChild(veil.el);
}

function veilFail(message) {
  document.body.classList.add('no-webgl');
  if (!veil.el) return;
  setVeil(1, message);
  const title = veil.el.querySelector('.loader__title');
  if (title) title.textContent = 'Flat edition';
  const glyph = veil.el.querySelector('.loader__glyph');
  if (glyph) glyph.style.opacity = '0.3';
  setTimeout(() => {
    veil.el.classList.add('is-hidden');
    veil.el.setAttribute('aria-hidden', 'true');
  }, 2400);
}

/* ========================================================================== */
/* 6. Boot state                                                              */
/* ========================================================================== */

let reduceMotion = readReducedMotion();
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let view = readView();
let renderer = null;
let scene = null;
let camera = null;
let rig = null;
let flow = null;
let audio = null;
let lenis = null;

let running = false;
let elapsed = 0;
let disposed = false;

let anchors = []; // { id, top, height } per zone, in scroll pixels
let poses = []; // effective poses (already adapted to the view profile)
let posCurve = null;
let lookCurve = null;

const workload = {
  name: 'normal',
  ai: WORKLOADS.normal.ai,
  thermal: WORKLOADS.normal.thermal,
  fan: WORKLOADS.normal.fan
};
let explodeMode = 'auto';

let soundWanted = false;
let audioReady = false;

const smoothPos = new THREE.Vector3(0, 26, 114);
const smoothAim = new THREE.Vector3(0, 1, 3);
const desiredPos = new THREE.Vector3();
const desiredAim = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpUp = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);

const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };

let currentFov = 0;
let activeZone = -1;
let lastTelemetryAt = 0;
let lastExplodePercent = -1;
let lastAiPercent = -1;

/* --------------------------------------------------------------- DOM refs -- */
const dom = {
  temp: document.getElementById('tel-temp'),
  rpm: document.getElementById('tel-rpm'),
  ai: document.getElementById('tel-ai'),
  explode: document.getElementById('tel-explode'),
  mode: document.getElementById('tel-mode'),
  audio: document.getElementById('audio-toggle'),
  audioLabel: document.getElementById('audio-label')
};

/* ========================================================================== */
/* 7. Camera poses → spline                                                   */
/* ========================================================================== */

function buildPoses() {
  poses = CAMERA_POSES.map((pose) => {
    const look = new THREE.Vector3().fromArray(pose.look);
    const raw = new THREE.Vector3().fromArray(pose.pos);

    // Portrait / narrow screens pull the camera back along its own view axis,
    // so identical knots keep working at any aspect ratio.
    const offset = raw.clone().sub(look).multiplyScalar(view.distanceScale);
    const pos = look.clone().add(offset);

    return {
      id: pose.id,
      pos,
      look,
      fov: pose.fov + view.fovBoost,
      shift: [pose.shift[0] * view.shiftScale, pose.shift[1] + view.liftY],
      explode: pose.explode
    };
  });

  // Two Catmull-Rom splines (position + aim). Knot i sits exactly at
  // u = i / (n - 1), so every zone still resolves to its authored pose.
  posCurve = new THREE.CatmullRomCurve3(poses.map((p) => p.pos), false, 'centripetal', 0.5);
  lookCurve = new THREE.CatmullRomCurve3(poses.map((p) => p.look), false, 'centripetal', 0.5);
}

/** Scroll offset → { i, j, t } across the zone anchors. */
function locate(scrollY) {
  const count = anchors.length;
  if (count === 0) return { i: 0, j: 0, t: 0 };
  if (scrollY <= anchors[0].top) return { i: 0, j: 0, t: 0 };

  for (let i = 0; i < count - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    // 1.5 px of tolerance: sections land on fractional offsets, and a jump to
    // a zone top must resolve to that zone, not to the tail of the previous one.
    if (scrollY < b.top - 1.5) {
      const span = Math.max(1, b.top - a.top);
      return { i, j: i + 1, t: clamp01((scrollY - a.top) / span) };
    }
  }
  const last = count - 1;
  return { i: last, j: last, t: 0 };
}

/** Resolve the target camera state for a scroll position. */
function resolvePose(scrollY, out) {
  const loc = locate(scrollY);
  const n = poses.length;
  const a = poses[loc.i] || poses[0];
  const b = poses[loc.j] || a;
  if (!a) return { ...loc, explode: 0 };

  const eased = smoothstep(loc.t);
  const u = (loc.i + loc.t) / (n - 1);
  const uClamped = clamp01(u);

  posCurve.getPoint(uClamped, out.pos);
  lookCurve.getPoint(uClamped, out.look);

  out.fov = lerp(a.fov, b.fov, eased);
  out.shiftX = lerp(a.shift[0], b.shift[0], eased);
  out.shiftY = lerp(a.shift[1], b.shift[1], eased);
  out.explode = lerp(a.explode, b.explode, eased);

  // Frame offset: aim slightly away from the subject so the subject drifts to
  // the right (desktop) or up (portrait) of frame, clear of the copy column.
  const forward = tmpForward.copy(out.look).sub(out.pos);
  const distance = Math.max(0.001, forward.length());
  forward.divideScalar(distance);
  tmpRight.crossVectors(forward, worldUp).normalize();
  tmpUp.crossVectors(tmpRight, forward).normalize();

  const halfH = Math.tan(THREE.MathUtils.degToRad(out.fov) / 2) * distance;
  const halfW = halfH * view.aspect;

  out.aim.copy(out.look)
    .addScaledVector(tmpRight, -out.shiftX * halfW)
    .addScaledVector(tmpUp, -out.shiftY * halfH);

  return { ...loc, explode: out.explode };
}

const poseOut = {
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  aim: new THREE.Vector3(),
  fov: 36,
  shiftX: 0,
  shiftY: 0,
  explode: 0
};

/* ========================================================================== */
/* 8. Boot                                                                    */
/* ========================================================================== */

async function boot() {
  bindConfig();
  renderContactLinks();
  buildRail(jumpTo);
  bindControls();

  view = readView();
  buildPoses();

  await veilStep(0.07, 'Reading board topology', 0);

  /* -------------------------------------------------------------- renderer */
  const canvas = document.getElementById('scene');
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
  } catch (error) {
    console.error('[silicon-and-systems] WebGL unavailable', error);
    veilFail('WebGL is not available in this browser — showing the flat edition.');
    wireStaticOnly();
    return;
  }

  renderer.setPixelRatio(view.maxPixelRatio);
  renderer.setSize(view.width, view.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x05080d, 1);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080d);

  camera = new THREE.PerspectiveCamera(poses[0].fov, view.aspect, 0.5, 900);
  camera.position.copy(poses[0].pos);
  camera.lookAt(poses[0].look);

  smoothPos.copy(poses[0].pos);
  smoothAim.copy(poses[0].look);
  currentFov = camera.fov;

  await veilStep(0.24, 'Machining the chassis', 0);

  /* ------------------------------------------------------- hardware rig -- */
  rig = createHardwareRig(scene, { quality: 'high' });

  await veilStep(0.52, 'Routing airflow and bus traffic', 1);

  /* ------------------------------------------------- airflow & bus flow -- */
  flow = createAirflowAndSignals(scene, {
    anchors: rig.anchors,
    bounds: FLOW_BOUNDS,
    viewportHeight: window.innerHeight,
    pixelRatio: renderer.getPixelRatio(),
    fov: camera.fov,
    particleCount: view.particleCount,
    thermalLoad: workload.thermal,
    aiLoad: workload.ai
  });

  await veilStep(0.74, 'Bleeding the coolant loop', 3);

  /* --------------------------------------------------------------- audio -- */
  audio = createHardwareAudio({
    positions: { cooler: rig.anchors.cooler, gpu: rig.anchors.gpu },
    thermalLoad: workload.thermal,
    aiLoad: workload.ai,
    muted: true
  });

  await veilStep(0.9, 'Calibrating telemetry', 5);

  /* --------------------------------------------------------------- scroll -- */
  measureAnchors();
  setupScroll();

  rig.setAiLoad(workload.ai);
  rig.setThermalLoad(workload.thermal);
  rig.setFanRpm(workload.fan);
  rig.setExplode(0, true);
  flow.setAiLoad(workload.ai);
  flow.setThermalLoad(workload.thermal);
  flow.setExplode(0);

  // One synchronous frame so the first painted pixel is the real scene.
  snap();
  rig.update(0, 1 / 60, camera.position);
  flow.update(0, 1 / 60, camera.position);
  renderer.render(scene, camera);

  running = true;
  gsap.ticker.add(frame);

  window.silicon = {
    THREE,
    gsap,
    scene,
    camera,
    renderer,
    rig,
    flow,
    audio,
    get lenis() {
      return lenis;
    },
    jumpTo,
    jumpToZone: (id) => jumpTo(id, { immediate: true }),
    setWorkload,
    setExplodeMode,
    get state() {
      return {
        workload: workload.name,
        ai: rig ? rig.getAiLoad() : 0,
        thermal: rig ? rig.getThermalLoad() : 0,
        fan: rig ? rig.getFanRpm() : 0,
        explode: rig ? rig.getExplode() : 0,
        zone: activeZone,
        camera: camera ? camera.position.toArray().map((v) => +v.toFixed(2)) : null,
        fov: camera ? camera.fov : 0,
        calls: renderer ? renderer.info.render.calls : 0,
        triangles: renderer ? renderer.info.render.triangles : 0
      };
    },
    /** Skip the damping — used by the screenshot harness. */
    snap() {
      snap();
      if (rig) rig.setExplode(resolvePose(scrollPosition(), poseOut).explode, true);
      if (rig) rig.update(elapsed, 1 / 60, camera.position);
      if (flow) flow.update(elapsed, 1 / 60, camera.position);
      if (renderer) renderer.render(scene, camera);
    }
  };

  await veilStep(1, 'Ready — scroll to open the case', 5);
  await veilFinish();

  // Late layout pass (lazy fonts, scrollbar) — anchors are cheap to re-measure.
  await sleep(260);
  measureAnchors();
  measureRail();
  ScrollTrigger.refresh();
}

/* ========================================================================== */
/* 9. Scroll system (Lenis + ScrollTrigger)                                   */
/* ========================================================================== */

function measureAnchors() {
  anchors = portfolio.sections.map((section) => {
    const el = document.getElementById(section.id);
    if (!el) return { id: section.id, top: 0, height: window.innerHeight };
    const rect = el.getBoundingClientRect();
    return {
      id: section.id,
      top: rect.top + window.scrollY,
      height: rect.height
    };
  });
}

function scrollPosition() {
  if (lenis) return lenis.scroll;
  return window.scrollY || window.pageYOffset || 0;
}

function setupScroll() {
  if (!reduceMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
      autoRaf: false
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
  }

  ScrollTrigger.refresh();

  /* One trigger per zone: drives the rail, the "is current" state and the
     reveal of that zone's cards. The camera itself is driven by the spline in
     frame(), sampled from the same scroll position. */
  portfolio.sections.forEach((section, index) => {
    const el = document.getElementById(section.id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        if (self.isActive) setActiveZone(index);
      }
    });
  });

  buildReveals();

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTelemetryAt = 0;
  });
  window.addEventListener('pagehide', disposeEverything, { once: true });

  /* Any [data-scroll-to] control jumps within the page. */
  document.querySelectorAll('[data-scroll-to]').forEach((el) => {
    el.addEventListener('click', (event) => {
      const id = el.dataset.scrollTo;
      if (!id || !document.getElementById(id)) return;
      event.preventDefault();
      jumpTo(id);
    });
  });

  /* A pointer gesture anywhere is enough to unlock the audio context, once the
     visitor has actually asked for sound. */
  const unlock = () => {
    if (!soundWanted || !audioReady) return;
    audio.resume();
  };
  window.addEventListener('pointerdown', unlock, { passive: true });

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
    },
    { passive: true }
  );
  window.addEventListener('pointerleave', () => {
    pointer.active = false;
  }, { passive: true });

  updateRail(0, 0);
}

function setActiveZone(index) {
  if (index === activeZone) return;
  activeZone = index;
  updateRail(index, 0);
}

function jumpTo(id, options = {}) {
  const el = document.getElementById(id);
  if (!el) return;

  const top =
    el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0) + 2;

  if (lenis) {
    lenis.scrollTo(top, {
      duration: options.immediate || reduceMotion ? 0 : 1.5,
      immediate: !!options.immediate,
      force: true,
      lock: false
    });
  } else {
    window.scrollTo({ top, behavior: 'auto' });
  }

  if (options.immediate) {
    setActiveZone(portfolio.sections.findIndex((section) => section.id === id));
  }
}

function handleResize() {
  const next = readView();
  const profileChanged = next.portrait !== view.portrait || Math.abs(next.aspect - view.aspect) > 0.25;

  view = next;

  if (renderer && camera) {
    camera.aspect = view.width / view.height;
    renderer.setPixelRatio(view.maxPixelRatio);
    renderer.setSize(view.width, view.height, false);
  }

  if (profileChanged) {
    buildPoses();
    if (flow) syncFlowViewScale();
  }

  if (camera) camera.updateProjectionMatrix();

  measureAnchors();
  measureRail();
  ScrollTrigger.refresh();
}

/** Re-derive the airflow point-size scale after a fov / viewport change. */
function syncFlowViewScale() {
  if (!flow || !camera) return;
  const scale =
    (window.innerHeight * renderer.getPixelRatio()) /
    (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  flow.group.traverse((child) => {
    const material = child.material;
    if (!material) return;
    const list = Array.isArray(material) ? material : [material];
    for (const mat of list) {
      if (mat.uniforms && mat.uniforms.uViewScale) mat.uniforms.uViewScale.value = scale;
    }
  });
}

/* ========================================================================== */
/* 10. Controls                                                               */
/* ========================================================================== */

function setWorkload(name) {
  const preset = WORKLOADS[name] ? name : 'normal';
  workload.name = preset;
  workload.ai = WORKLOADS[preset].ai;
  workload.thermal = WORKLOADS[preset].thermal;
  workload.fan = WORKLOADS[preset].fan;

  document.querySelectorAll('[data-workload]').forEach((button) => {
    const active = button.dataset.workload === preset;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  if (dom.mode) {
    dom.mode.textContent = WORKLOADS[preset].label;
    dom.mode.classList.toggle('is-surge', preset === 'surge');
  }

  if (audioReady) {
    audio.setAiLoad(workload.ai);
    audio.setThermalLoad(workload.thermal);
  }
}

function setExplodeMode(name) {
  explodeMode = name === 'exploded' ? 'exploded' : 'auto';
  document.querySelectorAll('[data-explode]').forEach((button) => {
    const active = button.dataset.explode === explodeMode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function bindControls() {
  document.querySelectorAll('[data-workload]').forEach((button) => {
    button.addEventListener('click', () => setWorkload(button.dataset.workload));
  });

  document.querySelectorAll('[data-explode]').forEach((button) => {
    button.addEventListener('click', () => setExplodeMode(button.dataset.explode));
  });

  if (dom.audio && !dom.audio.dataset.bound) {
    dom.audio.dataset.bound = '1';
    dom.audio.addEventListener('click', toggleSound);
  }
}

function toggleSound() {
  if (!audio) return;

  if (soundWanted) {
    soundWanted = false;
    audio.setMuted(true);
    syncSoundButton();
    return;
  }

  const context = audio.init();
  if (!context) {
    if (dom.audioLabel) dom.audioLabel.textContent = 'No audio';
    if (dom.audio) dom.audio.disabled = true;
    return;
  }

  audioReady = true;
  soundWanted = true;
  audio.resume();
  audio.setMuted(false);
  audio.setAiLoad(workload.ai);
  audio.setThermalLoad(workload.thermal);
  syncSoundButton();
}

function syncSoundButton() {
  if (!dom.audio) return;
  dom.audio.classList.toggle('is-on', soundWanted);
  dom.audio.setAttribute('aria-pressed', soundWanted ? 'true' : 'false');
  dom.audio.setAttribute(
    'aria-label',
    soundWanted ? 'Mute the hardware audio' : 'Unmute the hardware audio'
  );
  if (dom.audioLabel) dom.audioLabel.textContent = soundWanted ? 'Sound on' : 'Sound off';
}

/* ========================================================================== */
/* 11. Reveals                                                                */
/* ========================================================================== */

function buildReveals() {
  if (reduceMotion) return;

  const items = gsap.utils.toArray('[data-reveal]');
  gsap.set(items, { opacity: 0, y: 18 });

  items.forEach((item) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 90%',
        once: true
      }
    });
  });
}

/* ========================================================================== */
/* 12. Telemetry                                                              */
/* ========================================================================== */

function updateTelemetry(now) {
  if (now - lastTelemetryAt < 120) return;
  lastTelemetryAt = now;
  if (!rig) return;

  const thermal = rig.getThermalLoad();
  const fan = rig.getFanRpm();
  const aiPercent = Math.round(rig.getAiLoad() * 100);
  const explodePercent = Math.round(rig.getExplode() * 100);

  // Core temperature is derived from the same thermal load the shaders use,
  // so the readout can never disagree with the coolant glow.
  const temp = Math.round(38 + thermal * 52);
  if (dom.temp) dom.temp.textContent = String(temp);
  if (dom.rpm) dom.rpm.textContent = formatInt(fan * 2200);
  if (aiPercent !== lastAiPercent) {
    lastAiPercent = aiPercent;
    if (dom.ai) dom.ai.textContent = String(aiPercent);
  }
  if (explodePercent !== lastExplodePercent) {
    lastExplodePercent = explodePercent;
    if (dom.explode) dom.explode.textContent = String(explodePercent);
  }
}

/* ========================================================================== */
/* 13. Frame                                                                  */
/* ========================================================================== */

/** Snap the damped camera to the pose for the current scroll position. */
function snap() {
  const loc = resolvePose(scrollPosition(), poseOut);
  smoothPos.copy(poseOut.pos);
  smoothAim.copy(poseOut.aim);
  if (camera) {
    camera.position.copy(smoothPos);
    if (Math.abs(camera.fov - poseOut.fov) > 0.01) {
      camera.fov = poseOut.fov;
      camera.updateProjectionMatrix();
    }
    currentFov = camera.fov;
    camera.lookAt(smoothAim);
  }
  setActiveZone(loc.i);
  updateRail(loc.i, loc.t);
}

function frame(_time, deltaMs) {
  if (!running || disposed || !renderer || !camera || !rig) return;

  const dt = clamp((deltaMs || 16.666) / 1000, 0, 0.1);
  elapsed += document.hidden ? 0 : dt;

  const now = performance.now();

  /* ---- 1. workload easing ---------------------------------------------- */
  const preset = WORKLOADS[workload.name];
  workload.ai = lerp(workload.ai, preset.ai, damp(dt, 2.0));
  workload.thermal = lerp(workload.thermal, preset.thermal, damp(dt, 1.6));
  workload.fan = lerp(workload.fan, preset.fan, damp(dt, 1.4));
  rig.setAiLoad(workload.ai);
  rig.setThermalLoad(workload.thermal);
  rig.setFanRpm(workload.fan);
  if (audioReady) {
    audio.setAiLoad(workload.ai);
    audio.setThermalLoad(workload.thermal);
  }

  /* ---- 2. scroll → pose ------------------------------------------------ */
  const scrollY = scrollPosition();
  const loc = resolvePose(scrollY, poseOut);

  /* ---- 3. explode (auto per zone, or forced open) ---------------------- */
  const explodeTarget = explodeMode === 'exploded' ? 1 : poseOut.explode;
  rig.setExplode(explodeTarget);

  /* ---- 4. camera ------------------------------------------------------- */
  desiredPos.copy(poseOut.pos);
  desiredAim.copy(poseOut.aim);

  // Pointer parallax: a couple of units of aim sway, off for reduced motion.
  if (!reduceMotion) {
    if (!pointer.active) {
      pointer.targetX = 0;
      pointer.targetY = 0;
    }
    pointer.x = lerp(pointer.x, pointer.targetX, damp(dt, 3.2));
    pointer.y = lerp(pointer.y, pointer.targetY, damp(dt, 3.2));

    const forward = tmpForward.copy(desiredAim).sub(desiredPos).normalize();
    tmpRight.crossVectors(forward, worldUp).normalize();
    tmpUp.crossVectors(tmpRight, forward).normalize();

    desiredAim.addScaledVector(tmpRight, pointer.x * 3.4);
    desiredAim.addScaledVector(tmpUp, -pointer.y * 2.2);

    // breathing drift — the camera is never bolted to the rail
    desiredPos.x += Math.sin(elapsed * 0.23) * 0.7;
    desiredPos.y += Math.sin(elapsed * 0.41 + 1.2) * 0.28;
  }

  const poseEase = damp(dt, 5.2);
  smoothPos.lerp(desiredPos, poseEase);
  smoothAim.lerp(desiredAim, poseEase);

  camera.position.copy(smoothPos);
  camera.lookAt(smoothAim);

  if (Math.abs(camera.fov - poseOut.fov) > 0.05) {
    camera.fov = lerp(camera.fov, poseOut.fov, damp(dt, 4.0));
    camera.updateProjectionMatrix();
    currentFov = camera.fov;
  }

  /* ---- 5. hardware updates --------------------------------------------- */
  rig.update(elapsed, dt, camera.position);

  flow.setExplode(rig.getExplode());
  flow.setAiLoad(workload.ai);
  flow.setThermalLoad(workload.thermal);
  flow.update(elapsed, dt, camera.position);

  /* ---- 6. audio -------------------------------------------------------- */
  if (audio) {
    const z = loc.i;
    const focus = {
      overall: 0.5,
      cooler: z === 2 || z === 3 ? 1 : 0.32,
      gpu: z === 4 ? 1 : 0.32
    };
    audio.update(camera.position, workload.thermal, focus, workload.ai);
  }

  /* ---- 7. HUD ---------------------------------------------------------- */
  updateRail(loc.i, loc.t);
  if (loc.i !== activeZone) setActiveZone(loc.i);
  updateTelemetry(now);

  /* ---- 8. draw --------------------------------------------------------- */
  renderer.render(scene, camera);
}

/* ========================================================================== */
/* 14. Teardown & static fallback                                             */
/* ========================================================================== */

function disposeEverything() {
  if (disposed) return;
  disposed = true;
  running = false;

  gsap.ticker.remove(frame);
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
  if (audio) {
    audio.dispose();
    audio = null;
  }
  if (flow) {
    flow.dispose();
    flow = null;
  }
  if (rig) {
    rig.dispose();
    rig = null;
  }
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
}

/** Without WebGL the page still scrolls and the rail still jumps. */
function wireStaticOnly() {
  bindControls();
  buildRail((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  });

  const onScroll = () => {
    const y = window.scrollY || 0;
    const found = portfolio.sections.reduce(
      (best, section, index) => {
        const el = document.getElementById(section.id);
        if (!el) return best;
        const top = el.getBoundingClientRect().top + y;
        return top - 160 <= y && top > best.top ? { index, top } : best;
      },
      { index: 0, top: -Infinity }
    );
    updateRail(found.index, 0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ========================================================================== */
/* 15. Start                                                                  */
/* ========================================================================== */

reduceMotionQuery.addEventListener('change', (event) => {
  reduceMotion = event.matches;
});

boot().catch((error) => {
  console.error('[silicon-and-systems] boot failed', error);
  veilFail('The rig failed to load — showing the flat edition.');
  try {
    wireStaticOnly();
  } catch (fallbackError) {
    /* nothing else we can do */
  }
});
