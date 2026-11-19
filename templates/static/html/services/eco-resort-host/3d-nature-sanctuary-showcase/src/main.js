/**
 * main.js
 * -----------------------------------------------------------------------------
 * Boots the open-world nature portfolio: renderer, the three world modules
 * (sky & terrain, waterfall & wildlife, nature audio), the six-station camera
 * path, the HUD, the zone jump rail and the live valley telemetry.
 *
 * World contract (shared by every module, see skyAndTerrain.js)
 *   waterfall curtain .... x ∈ [−11, 11], z = −65, y 34 → 0
 *   plunge pool .......... centre (0, 0, −57), radius 30, bed −3.4
 *   river ................ leaves the pool at y = 0 and flows towards +Z,
 *                          centreline x = getRiverCenterX(z), to z ≈ 260
 *   camera stations ...... six poses along that valley, summit → horizon
 *
 * The page is deliberate about one rule: the HUD reads the camera, never the
 * scroll. Elevation, waterfall distance and nearest wildlife all come from the
 * camera that is on screen, so the readouts and the render can never disagree.
 */

import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  createSkyAndTerrain,
  getTerrainHeight,
  WATERFALL_ANCHOR
} from './scene/skyAndTerrain.js';
import { createWaterfallAndWildlife } from './scene/waterfallAndWildlife.js';
import { createNatureAudio } from './audio/natureAudio.js';

import portfolio, { resolvePath, isRealLink } from './config/portfolio.js';

gsap.registerPlugin(ScrollTrigger);

/* ========================================================================== */
/* 0. Small utilities                                                         */
/* ========================================================================== */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 1,142 — thousands separated, no sign (elevation is always above the floor). */
function formatElevation(value) {
  return Math.round(value).toLocaleString('en-US');
}

/** 0 m — distances in whole metres. */
function formatDistance(value) {
  if (!Number.isFinite(value)) return '—';
  return Math.round(value).toLocaleString('en-US');
}

function readStoredMuted() {
  try {
    return window.localStorage.getItem('verdant:muted') !== 'off';
  } catch (error) {
    return true;
  }
}

function storeMuted(muted) {
  try {
    window.localStorage.setItem('verdant:muted', muted ? 'on' : 'off');
  } catch (error) {
    /* private mode — the toggle simply won't be remembered */
  }
}

/* ========================================================================== */
/* 1. Loading veil                                                            */
/* ========================================================================== */

class LoadingVeil {
  constructor() {
    this.el = document.getElementById('loader');
    this.bar = document.getElementById('loader-bar');
    this.altEl = document.getElementById('loader-elevation');
    this.noteEl = document.getElementById('loader-note');
    this.done = false;
  }

  /** Progress 0…1 is narrated as a descent from the summit to the valley floor. */
  set(progress, note) {
    if (!this.el) return;
    const p = clamp01(progress);
    if (this.bar) this.bar.style.width = `${(p * 100).toFixed(1)}%`;
    if (this.altEl) this.altEl.textContent = formatElevation(lerp(1142, 204, p));
    if (note && this.noteEl) this.noteEl.textContent = note;
  }

  async step(progress, note) {
    this.set(progress, note);
    await nextFrame();
    await sleep(28);
  }

  async finish() {
    if (!this.el || this.done) return;
    this.done = true;
    this.set(1, 'Ready — walk down into the valley');
    await sleep(160);
    this.el.classList.add('is-hidden');
    this.el.setAttribute('aria-hidden', 'true');
    await sleep(760);
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }

  /** Non-blocking failure: keep the writing readable without WebGL. */
  fail(message) {
    document.body.classList.add('no-webgl');
    if (!this.el) return;
    this.set(1, message);
    const title = this.el.querySelector('.loader__title');
    if (title) title.textContent = 'Flat edition';
    const glyph = this.el.querySelector('.loader__glyph');
    if (glyph) glyph.style.opacity = '0.35';
    setTimeout(() => {
      this.el.classList.add('is-hidden');
      this.el.setAttribute('aria-hidden', 'true');
    }, 2400);
  }
}

/* ========================================================================== */
/* 2. Config → DOM                                                            */
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

  document.title = `${portfolio.brand.fullName} — Nature Portfolio`;
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
/* 3. Zone jump rail                                                          */
/* ========================================================================== */

function buildRail(onJump) {
  const track = document.getElementById('rail-track');
  if (!track) return;

  const zones = portfolio.zones;
  zones.forEach((zone, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rail__tick';
    button.dataset.zone = zone.id;
    button.style.setProperty('--t', `${(index / Math.max(1, zones.length - 1)) * 100}%`);
    button.setAttribute('aria-label', `Jump to ${zone.label} — zone ${zone.number}`);

    const text = document.createElement('span');
    text.className = 'rail__tick-text';

    const num = document.createElement('span');
    num.className = 'rail__tick-num';
    num.textContent = zone.number;

    const label = document.createElement('span');
    label.className = 'rail__tick-label';
    label.textContent = zone.short;

    text.append(num, label);
    button.append(text);
    button.addEventListener('click', () => onJump(zone.id));

    track.append(button);
  });
}

/* ========================================================================== */
/* 4. Quality tier                                                            */
/* ========================================================================== */

function pickQuality() {
  // ?quality=high|medium|low forces a tier (handy for capture and for a
  // conference display that should always render the long view).
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === 'high' || forced === 'medium' || forced === 'low') {
    return {
      name: forced === 'high' ? 'high' : 'lean',
      skyQuality: forced,
      shadows: true,
      maxPixelRatio: Math.min(window.devicePixelRatio || 1, 2)
    };
  }

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 8;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 720;
  const lean = coarse || cores <= 4 || smallViewport;

  const maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  if (lean) {
    return {
      name: 'lean',
      skyQuality: 'medium',
      shadows: true,
      maxPixelRatio: Math.min(maxPixelRatio, 1.75)
    };
  }

  return { name: 'high', skyQuality: 'high', shadows: true, maxPixelRatio };
}

/* ========================================================================== */
/* 5. Camera stations                                                         */
/* ========================================================================== */

/**
 * One pose per zone, in the same order as portfolio.zones.
 *   pos   — camera position (world units, y above the valley floor)
 *   look  — the point the lens aims at
 *   bow   — lateral arc of the flight INTO this station's successor, so the
 *           camera curves along the valley instead of sliding on a wire
 *
 * Notes
 *  • The summit sits high on the east flank and looks north-west across the
 *    valley to the falls, with the sun behind them.
 *  • The meadow station skims the wildflower floor at 6 m, with the deer paths
 *    and the fox run inside the right half of the frame (the plate covers the
 *    left, so the wildlife never hides behind the copy).
 *  • The falls station stands 80 m off the curtain: 34 m of water fills the
 *    frame at 52° without cropping the lip.
 *  • The river station turns downstream: the plunge pool behind, the meander
 *    and the pass ahead.
 *  • The ridge station climbs the west flank into the pine belt; zone 06 rises
 *    back over the whole valley for the closing page.
 */
const CAMERA_POSES = [
  { pos: [178, 66, 152], look: [-30, 26, -96], bow: 44 }, // 01 summit overlook
  { pos: [34, 6.5, 66], look: [-4, 8, -62], bow: 26 }, // 02 emerald meadow
  { pos: [10, 15, 30], look: [0, 18, -64], bow: 16 }, // 03 cascading falls
  { pos: [12, 4.5, 44], look: [-8, 0.5, 150], bow: 30 }, // 04 river sanctuary
  { pos: [96, 40, 30], look: [30, 52, -40], bow: 34 }, // 05 pine ridge
  { pos: [42, 86, 232], look: [-10, 14, -72], bow: 0 } // 06 valley horizon
];

/* ========================================================================== */
/* 6. Boot                                                                    */
/* ========================================================================== */

const veil = new LoadingVeil();
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionParam = new URLSearchParams(window.location.search).get('motion');
let reduceMotion = reduceMotionQuery.matches || motionParam === 'off';

let renderer = null;
let scene = null;
let camera = null;
let sky = null;
let waterfall = null;
let audio = null;
let lenis = null;

let running = false;
let elapsed = 0;

const anchors = []; // one per zone: { id, scrollTop, pos, look, bow, grade }
let scrollY = 0;
let zoneProgress = 0;
let currentZoneIndex = 0;

const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };

const follow = {
  active: false,
  animal: null,
  index: -1,
  weight: 0,
  enteredAt: 0
};

const smoothPos = new THREE.Vector3();
const smoothLook = new THREE.Vector3();
const desiredPos = new THREE.Vector3();
const desiredLook = new THREE.Vector3();
const basePosePosition = new THREE.Vector3();
const basePoseLook = new THREE.Vector3();
const chasePos = new THREE.Vector3();
const chaseLook = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const upAxis = new THREE.Vector3(0, 1, 0);

let currentFov = 0;
let lastElevationLabel = '';
let lastZoneLabel = '';
let lastTelemetryAt = 0;
let lastRailT = -1;
let frozenPose = null;

/* -------------------------------------------------------------- DOM refs -- */
const dom = {
  railElevation: document.getElementById('rail-elevation'),
  railZone: document.getElementById('rail-zone'),
  railFill: document.getElementById('rail-fill'),
  railMarker: document.getElementById('rail-marker'),
  railTrack: document.getElementById('rail-track'),
  sound: document.getElementById('sound-toggle'),
  soundLabel: document.getElementById('sound-label'),
  followToggle: document.getElementById('follow-toggle'),
  followLabel: document.getElementById('follow-label'),
  followStatus: document.getElementById('follow-status'),
  followStatusText: document.getElementById('follow-status-text'),
  followStop: document.getElementById('follow-stop'),
  telElevation: document.getElementById('tel-elevation'),
  telWaterfall: document.getElementById('tel-waterfall'),
  telWildlife: document.getElementById('tel-wildlife'),
  telZone: document.getElementById('tel-zone'),
  telCount: document.getElementById('tel-count'),
  content: document.getElementById('content')
};

/* ================================================================ boot ==== */
async function boot() {
  bindConfig();
  renderContactLinks();
  buildRail(jumpTo);
  bindHud();
  buildReveals();

  const quality = pickQuality();

  await veil.step(0.06, 'Reading the ridge line');

  /* ------------------------------------------------------------ renderer */
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
    veil.fail('WebGL is not available in this browser — showing the flat edition.');
    wireStaticOnly();
    return;
  }

  renderer.setPixelRatio(quality.maxPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xbcd7e6, 1);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbcd7e6);

  camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.6, 6200);
  camera.position.fromArray(CAMERA_POSES[0].pos);
  camera.lookAt(new THREE.Vector3().fromArray(CAMERA_POSES[0].look));

  smoothPos.copy(camera.position);
  smoothLook.fromArray(CAMERA_POSES[0].look);

  await veil.step(0.2, 'Laying the valley floor');

  /* ------------------------------------------------- sky, hills, wildlife */
  // The camera goes in BEFORE the first update(): the sky dome, the sun flare
  // and the shadow focus all follow it from frame one.
  sky = createSkyAndTerrain(scene, {
    camera,
    quality: quality.skyQuality,
    shadows: quality.shadows
  });

  await veil.step(0.46, 'Filling the meadow');

  waterfall = createWaterfallAndWildlife(scene, {
    // the terrain module already owns the headwall — no second rock face
    cliff: false,
    getTerrainHeight: sky.getTerrainHeight,
    getTerrainNormal: sky.getTerrainNormal,
    waterfallAnchor: WATERFALL_ANCHOR,
    quality: quality.name === 'lean' ? 'medium' : 'high',
    shadows: quality.shadows
  });

  await veil.step(0.72, 'Sending the deer across the meadow');

  /* ---------------------------------------------------------------- audio */
  const muted = readStoredMuted();
  audio = createNatureAudio({
    masterVolume: 0.72,
    muted,
    updateIntervalMs: 55,
    waterfallPosition: WATERFALL_ANCHOR
  });
  syncSoundButton(muted);

  await veil.step(0.9, 'Tuning the waterfall and the birds');

  /* --------------------------------------------------------------- scroll */
  measureAnchors();
  setupScroll();

  if (dom.telCount && waterfall) {
    const count = (waterfall.animals || []).length + (waterfall.fish || []).length;
    dom.telCount.textContent = `${count} animals`;
  }

  // one synchronous frame so the first painted pixel is the real valley
  resolvePose({ i: 0, j: 0, t: 0 });
  smoothPos.copy(basePosePosition);
  smoothLook.copy(basePoseLook);
  camera.position.copy(smoothPos);
  camera.lookAt(smoothLook);
  sky.setCamera(camera);
  sky.update(0, 0.016, camera.position);
  waterfall.update(0, 0.016, camera.position);
  applyZone(0);
  renderer.render(scene, camera);

  running = true;
  gsap.ticker.add(frame);

  // Handy from the console (and for automated screenshots):
  //   verdant.jumpTo('falls'), verdant.freeze([0,20,60],[0,20,-65]), verdant.followNearest()
  window.verdant = {
    THREE,
    scene,
    camera,
    renderer,
    sky,
    waterfall,
    audio,
    lenis,
    anchors,
    zones: portfolio.zones,
    jumpTo,
    // Test helper: land on a station's exact pose in one call (used by the
    // screenshot harness so a slow software renderer doesn't stall the run).
    snap(id) {
      const index = anchors.findIndex((a) => a.id === id);
      if (index < 0) return false;
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo(0, top);
      }
      resolvePose({ i: index, j: index, t: 0 });
      smoothPos.copy(basePosePosition);
      smoothLook.copy(basePoseLook);
      camera.position.copy(smoothPos);
      camera.lookAt(smoothLook);
      applyZone(index, 0);
      // Land the station fully formed: finish the copy reveals and refresh the
      // readouts, so a capture never catches a tween half-way on a slow
      // (software) renderer or shows the previous station's numbers.
      revealTweens.forEach((tween) => tween.progress(1));
      updateHud(waterfall.getWaterfallDistance(camera.position), waterfall.getNearestAnimal(camera.position));
      renderer.render(scene, camera);
      return true;
    },
    followNearest,
    stopFollowing,
    nextAnimal,
    get zone() {
      return portfolio.zones[currentZoneIndex];
    },
    freeze(pos, look) {
      frozenPose = {
        pos: new THREE.Vector3().fromArray(pos),
        look: new THREE.Vector3().fromArray(look)
      };
    },
    unfreeze() {
      frozenPose = null;
    }
  };

  await veil.step(1, 'Ready — walk down into the valley');
  await veil.finish();
}

/* ============================================================== scroll ==== */
function measureAnchors() {
  anchors.length = 0;
  const scrollTop = window.scrollY || window.pageYOffset || 0;

  portfolio.zones.forEach((zone, index) => {
    const el = document.getElementById(zone.id);
    if (!el) return;
    const pose = CAMERA_POSES[index] || CAMERA_POSES[CAMERA_POSES.length - 1];
    const rect = el.getBoundingClientRect();
    anchors.push({
      id: zone.id,
      grade: zone.grade,
      scrollTop: rect.top + scrollTop,
      pos: new THREE.Vector3().fromArray(pose.pos),
      look: new THREE.Vector3().fromArray(pose.look),
      bow: pose.bow || 0
    });
  });
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

  window.addEventListener(
    'scroll',
    () => {
      scrollY = window.scrollY || window.pageYOffset || 0;
    },
    { passive: true }
  );

  scrollY = window.scrollY || window.pageYOffset || 0;

  /* Rail ticks + any [data-scroll-to] control */
  document.querySelectorAll('[data-scroll-to]').forEach((el) => {
    el.addEventListener('click', (event) => {
      const id = el.dataset.scrollTo;
      if (!id || !document.getElementById(id)) return;
      event.preventDefault();
      jumpTo(id);
    });
  });

  /* Leaving a follow when the visitor starts scrolling again */
  const exitFollowOnScroll = () => {
    if (!follow.active) return;
    if (performance.now() - follow.enteredAt < 500) return;
    stopFollowing();
  };
  window.addEventListener('wheel', exitFollowOnScroll, { passive: true });
  window.addEventListener('touchmove', exitFollowOnScroll, { passive: true });
  window.addEventListener(
    'keydown',
    (event) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(event.key)) {
        exitFollowOnScroll();
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
  });
  window.addEventListener('pagehide', disposeEverything, { once: true });
}

function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (camera && renderer) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  measureAnchors();
  ScrollTrigger.refresh();
}

function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (follow.active) stopFollowing();

  const top = el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);

  if (lenis) {
    lenis.scrollTo(top, { duration: reduceMotion ? 0 : 1.5, lock: false });
  } else {
    window.scrollTo({ top, behavior: 'auto' });
  }
}

/* ================================================================ HUD ==== */
function bindHud() {
  if (dom.sound && !dom.sound.dataset.bound) {
    dom.sound.dataset.bound = '1';
    dom.sound.addEventListener('click', toggleSound);
  }

  if (dom.followToggle && !dom.followToggle.dataset.bound) {
    dom.followToggle.dataset.bound = '1';
    dom.followToggle.addEventListener('click', () => {
      if (!follow.active) {
        followNearest();
      } else {
        nextAnimal();
      }
    });
  }

  if (dom.followStop && !dom.followStop.dataset.bound) {
    dom.followStop.dataset.bound = '1';
    dom.followStop.addEventListener('click', stopFollowing);
  }
}

/* ---------------------------------------------------------- follow mode -- */
function followables() {
  return waterfall && waterfall.animals
    ? waterfall.animals.filter((animal) => animal && animal.followable !== false)
    : [];
}

function followNearest() {
  const list = followables();
  if (!list.length) return;

  const near = waterfall.getNearestAnimal(camera.position);
  follow.index = near && near.animal ? Math.max(0, list.indexOf(near.animal)) : 0;
  startFollowing(list[follow.index]);
}

function nextAnimal() {
  const list = followables();
  if (!list.length) return;
  follow.index = (follow.index + 1) % list.length;
  startFollowing(list[follow.index]);
}

function startFollowing(animal) {
  if (!animal) return;
  follow.active = true;
  follow.animal = animal;
  follow.enteredAt = performance.now();

  if (dom.followToggle) {
    dom.followToggle.classList.add('is-active');
    dom.followToggle.setAttribute('aria-pressed', 'true');
    dom.followToggle.setAttribute(
      'aria-label',
      `Next animal — currently following ${animal.name}`
    );
    dom.followToggle.title = `Following ${animal.name} — click for the next animal`;
  }
  if (dom.followLabel) dom.followLabel.textContent = 'Next wildlife';

  if (dom.followStatus) dom.followStatus.classList.add('is-visible');
  updateFollowStatus();
}

function stopFollowing() {
  follow.active = false;
  follow.animal = null;

  if (dom.followToggle) {
    dom.followToggle.classList.remove('is-active');
    dom.followToggle.setAttribute('aria-pressed', 'false');
    dom.followToggle.setAttribute('aria-label', 'Follow a deer, fox or hare across the meadow');
    dom.followToggle.title = 'Track a deer, fox or hare across the meadow';
  }
  if (dom.followLabel) dom.followLabel.textContent = 'Follow wildlife';
  if (dom.followStatus) dom.followStatus.classList.remove('is-visible');
}

function speciesLabel(animal) {
  switch (animal.kind) {
    case 'deer':
      return animal.species === 'red-deer-stag' ? 'red deer stag' : 'red deer doe';
    case 'fox':
      return 'red fox';
    case 'hare':
      return 'brown hare';
    default:
      return animal.species || 'wildlife';
  }
}

function updateFollowStatus() {
  if (!follow.active || !follow.animal) return;
  if (!dom.followStatusText) return;
  const dx = follow.animal.position.x - camera.position.x;
  const dz = follow.animal.position.z - camera.position.z;
  const distance = Math.round(Math.hypot(dx, dz));
  dom.followStatusText.textContent = `Following ${follow.animal.name} · ${speciesLabel(follow.animal)} · ${distance} m`;
}

/* -------------------------------------------------------------- sound ---- */
function toggleSound() {
  if (!audio) return;

  if (audio.isMuted()) {
    const ready = audio.init();
    if (!ready) {
      if (dom.soundLabel) dom.soundLabel.textContent = 'No audio';
      dom.sound.disabled = true;
      return;
    }
    audio.resume();
    audio.setMuted(false);
    storeMuted(false);
    syncSoundButton(false);
  } else {
    audio.setMuted(true);
    storeMuted(true);
    syncSoundButton(true);
  }
}

function syncSoundButton(muted) {
  if (!dom.sound) return;
  dom.sound.classList.toggle('is-on', !muted);
  dom.sound.setAttribute('aria-pressed', muted ? 'false' : 'true');
  dom.sound.setAttribute(
    'aria-label',
    muted ? 'Play the valley soundscape' : 'Mute the valley soundscape'
  );
  if (dom.soundLabel) dom.soundLabel.textContent = muted ? 'Sound' : 'Mute';
}

/* ============================================================ reveals ==== */
const revealTweens = [];

function buildReveals() {
  if (reduceMotion) return;

  const items = gsap.utils.toArray('[data-reveal]');
  gsap.set(items, { opacity: 0, y: 20 });

  items.forEach((item) => {
    revealTweens.push(gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 90%',
        once: true
      }
    }));
  });
}

/* ============================================================ frame ====== */
function frame(_time, deltaMs) {
  if (!running || !renderer) return;
  const dt = clamp((deltaMs || 16.666) / 1000, 0, 0.1);
  elapsed += document.hidden ? 0 : dt;

  /* ---- 1. scroll → station -------------------------------------------- */
  const liveScroll = lenis ? lenis.scroll : window.scrollY || window.pageYOffset || 0;
  scrollY = liveScroll;
  const located = locate(scrollY);
  zoneProgress = clamp01((scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)));

  /* ---- 2. pointer parallax -------------------------------------------- */
  if (!pointer.active || reduceMotion) {
    pointer.targetX = 0;
    pointer.targetY = 0;
  }
  const pointerEase = 1 - Math.exp(-dt * 3.4);
  pointer.x += (pointer.targetX - pointer.x) * pointerEase;
  pointer.y += (pointer.targetY - pointer.y) * pointerEase;

  /* ---- 3. follow blending ---------------------------------------------- */
  const followTarget = follow.active ? 1 : 0;
  follow.weight += (followTarget - follow.weight) * (1 - Math.exp(-dt * 2.1));
  const followWeight = clamp01(follow.weight);

  /* ---- 4. camera pose -------------------------------------------------- */
  resolvePose(located);
  if (follow.animal) computeChasePose(follow.animal); else computeChasePose(null);

  desiredPos.copy(basePosePosition).lerp(chasePos, followWeight);
  desiredLook.copy(basePoseLook).lerp(chaseLook, followWeight);

  if (!reduceMotion) {
    const sway = 1 - followWeight * 0.7;
    desiredLook.x += pointer.x * 58 * sway;
    desiredLook.y += -pointer.y * 34 * sway;
    desiredPos.x += pointer.x * 8 * sway;
    desiredPos.y += -pointer.y * 4 * sway;

    // breathing drift so the camera never feels bolted to a rail
    const breathe = 1 - followWeight * 0.8;
    desiredPos.x += Math.sin(elapsed * 0.23) * 1.2 * breathe;
    desiredPos.y += Math.sin(elapsed * 0.51 + 1.3) * 0.3 * breathe;
  }

  const poseEase = 1 - Math.exp(-dt * 6.2);
  smoothPos.lerp(desiredPos, poseEase);
  smoothLook.lerp(desiredLook, poseEase);

  if (frozenPose) {
    smoothPos.copy(frozenPose.pos);
    smoothLook.copy(frozenPose.look);
  }

  camera.position.copy(smoothPos);
  camera.lookAt(smoothLook);

  const fovTarget = 52 + followWeight * 4;
  if (Math.abs(fovTarget - currentFov) > 0.02) {
    currentFov = fovTarget;
    camera.fov = fovTarget;
    camera.updateProjectionMatrix();
  }

  /* ---- 5. world -------------------------------------------------------- */
  sky.update(elapsed, dt, camera.position);
  waterfall.update(elapsed, dt, camera.position);

  /* ---- 6. audio -------------------------------------------------------- */
  const waterfallDistance = waterfall.getWaterfallDistance(camera.position);
  const nearest = waterfall.getNearestAnimal(camera.position);
  const nearestDistance = nearest ? nearest.distance : 9999;
  audio.update(camera.position, waterfallDistance, nearestDistance, zoneProgress);

  /* ---- 7. HUD ---------------------------------------------------------- */
  applyZone(located.i, located.t);
  updateSectionFades();
  updateHud(waterfallDistance, nearest);
  if (follow.active) updateFollowStatus();

  /* ---- 8. draw --------------------------------------------------------- */
  renderer.render(scene, camera);
}

/* ---------------------------------------------------- camera pose maths -- */
function locate(scrollPosition) {
  const count = anchors.length;
  if (!count) return { i: 0, j: 0, t: 0 };

  if (scrollPosition <= anchors[0].scrollTop) return { i: 0, j: 0, t: 0 };

  for (let i = 0; i < count - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (scrollPosition < b.scrollTop) {
      const span = Math.max(1, b.scrollTop - a.scrollTop);
      return { i, j: i + 1, t: clamp01((scrollPosition - a.scrollTop) / span) };
    }
  }

  const last = count - 1;
  return { i: last, j: last, t: 0 };
}

function resolvePose(located) {
  const a = anchors[located.i] || anchors[0];
  if (!a) return;
  const b = anchors[located.j] || a;

  const eased = smoothstep(located.t);
  basePosePosition.copy(a.pos).lerp(b.pos, eased);
  basePoseLook.copy(a.look).lerp(b.look, eased);

  /* The flight curves instead of sliding on a wire: a lateral bow plus a small
     lift at the midpoint, both scaled by the raw progress so the endpoints stay
     exact on their stations. */
  if (a !== b && a.bow) {
    tmpForward.subVectors(b.pos, a.pos);
    tmpForward.y = 0;
    if (tmpForward.lengthSq() < 1e-6) tmpForward.set(0, 0, -1);
    tmpForward.normalize();
    const arc = Math.sin(Math.PI * located.t) * a.bow;
    basePosePosition.x += -tmpForward.z * arc;
    basePosePosition.z += tmpForward.x * arc;
    basePosePosition.y += Math.sin(Math.PI * located.t) * a.bow * 0.22;
  }
}

function computeChasePose(animal) {
  if (!animal || !animal.position) {
    chasePos.set(0, 20, 220);
    chaseLook.set(0, 6, 0);
    return;
  }

  const position = animal.position;
  const yaw = Number.isFinite(animal.yaw) ? animal.yaw : 0;
  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  const rightX = -Math.cos(yaw);
  const rightZ = Math.sin(yaw);

  // A deer is ~2 m long in this world; the lens keeps 9–12 m of respectful room
  // and 3 m of height, so the animal reads against the meadow instead of
  // filling the frame.
  const back = animal.kind === 'fox' ? 9 : animal.kind === 'hare' ? 7 : 11;
  const lateral = animal.kind === 'hare' ? 1.6 : 2.8;
  const height = animal.kind === 'hare' ? 1.8 : 3.1;

  let x = position.x - forwardX * back + rightX * lateral;
  let z = position.z - forwardZ * back + rightZ * lateral;

  const ground = getTerrainHeight(x, z);
  const y = Math.max(position.y + height, ground + 1.6);

  chasePos.set(x, y, z);
  chaseLook.set(
    position.x + forwardX * 2.4,
    position.y + (animal.kind === 'hare' ? 0.35 : 1.1),
    position.z + forwardZ * 2.4
  );
}

/* --------------------------------------------------------------- HUD ----- */
/**
 * A station plate fades away as it slides up under the fixed HUD, so no copy is
 * ever left legible behind the brand pill. Returns to 1 as soon as the plate is
 * back in the reading area — the fade spans the last 120 px of the exit only.
 */
function updateSectionFades() {
  const plates = document.querySelectorAll('.section__inner');
  for (let i = 0; i < plates.length; i += 1) {
    const rect = plates[i].getBoundingClientRect();
    const fade = clamp01((rect.bottom - 100) / 150);
    if (fade >= 0.995) {
      if (plates[i].style.opacity) plates[i].style.opacity = '';
    } else {
      plates[i].style.opacity = fade.toFixed(3);
    }
  }
}

function applyZone(index, t = 0) {
  let nearest = index;
  if (anchors.length > 1 && t > 0.5) nearest = Math.min(anchors.length - 1, index + 1);

  if (nearest !== currentZoneIndex) {
    currentZoneIndex = nearest;
    const grade = anchors[nearest] ? anchors[nearest].grade : 'bright';
    document.body.dataset.grade = grade || 'bright';

    document.querySelectorAll('.rail__tick').forEach((tick, i) => {
      tick.classList.toggle('is-current', i === nearest);
    });

    const zone = portfolio.zones[nearest];
    if (zone && dom.railZone) dom.railZone.textContent = `${zone.number} · ${zone.label}`;
    if (zone && dom.telZone) dom.telZone.textContent = `${zone.number} · ${zone.zone}`;
  }
}

function updateHud(waterfallDistance, nearest) {
  const elevation = Math.max(0, camera.position.y);
  const elevationLabel = formatElevation(elevation);

  // Elevation is written from the camera that is on screen — one source, so the
  // rail and the telemetry card can never disagree.
  if (elevationLabel !== lastElevationLabel) {
    lastElevationLabel = elevationLabel;
    if (dom.railElevation) dom.railElevation.textContent = elevationLabel;
    if (dom.telElevation) dom.telElevation.textContent = elevationLabel;
  }

  if (dom.railTrack) {
    const railT = clamp01(zoneProgress) * 100;
    if (Math.abs(railT - lastRailT) > 0.15) {
      lastRailT = railT;
      dom.railTrack.style.setProperty('--rail-t', `${railT.toFixed(2)}%`);
      if (dom.railFill) dom.railFill.style.height = `${railT.toFixed(2)}%`;
      if (dom.railMarker) dom.railMarker.style.top = `${railT.toFixed(2)}%`;
    }
  }

  const now = performance.now();
  if (now - lastTelemetryAt < 150) return;
  lastTelemetryAt = now;

  if (dom.telWaterfall) dom.telWaterfall.textContent = formatDistance(waterfallDistance);

  if (dom.telWildlife) {
    if (nearest && nearest.animal) {
      dom.telWildlife.textContent = `${nearest.animal.name} · ${formatDistance(nearest.distance)} m`;
    } else {
      dom.telWildlife.textContent = '—';
    }
  }

  const zone = portfolio.zones[currentZoneIndex];
  if (zone && dom.telZone && dom.telZone.textContent !== `${zone.number} · ${zone.zone}`) {
    dom.telZone.textContent = `${zone.number} · ${zone.zone}`;
  }
}

/* =========================================================== listeners === */
if (typeof window !== 'undefined') {
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

  window.addEventListener(
    'pointerleave',
    () => {
      pointer.active = false;
    },
    { passive: true }
  );

  reduceMotionQuery.addEventListener('change', (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      pointer.targetX = 0;
      pointer.targetY = 0;
      pointer.x = 0;
      pointer.y = 0;
    }
  });
}

/* ============================================================ teardown === */
function disposeEverything() {
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
  if (waterfall) {
    waterfall.dispose();
    waterfall = null;
  }
  if (sky) {
    sky.dispose();
    sky = null;
  }
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
}

/** Without WebGL the page still scrolls: keep the rail and anchor links alive. */
function wireStaticOnly() {
  bindHud();
  const onScroll = () => {
    const pageHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = clamp01((window.scrollY || 0) / pageHeight);
    if (dom.railFill) dom.railFill.style.height = `${(progress * 100).toFixed(2)}%`;
    if (dom.railMarker) dom.railMarker.style.top = `${(progress * 100).toFixed(2)}%`;
    if (dom.railElevation) dom.railElevation.textContent = formatElevation(lerp(1142, 204, progress));
    const index = Math.min(
      portfolio.zones.length - 1,
      Math.round(progress * (portfolio.zones.length - 1))
    );
    const zone = portfolio.zones[index];
    if (zone && dom.railZone) dom.railZone.textContent = `${zone.number} · ${zone.label}`;
    document.body.dataset.grade = zone ? zone.grade : 'bright';
    document.querySelectorAll('.rail__tick').forEach((tick, i) => {
      tick.classList.toggle('is-current', i === index);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ================================================================ start == */
boot().catch((error) => {
  console.error('[nature-portfolio] boot failed', error);
  if (veil) veil.fail('The valley failed to load — showing the flat edition.');
  try {
    wireStaticOnly();
  } catch (fallbackError) {
    /* nothing else we can do */
  }
});
