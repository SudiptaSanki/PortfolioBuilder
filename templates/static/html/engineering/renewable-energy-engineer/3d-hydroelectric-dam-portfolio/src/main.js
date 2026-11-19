/**
 * main.js
 * ============================================================================
 * Boots the Canyon Hydro Works portfolio: renderer, the procedural dam world,
 * the procedural dam soundscape, the scroll → dam-progress mapping, the HUD,
 * the hydro station rail and the on-load sound prompt.
 *
 * The world contract (src/scene/hydroWorld.js) does the heavy lifting:
 *
 *   const pose = world.getDamPose(progress)     // 0..1
 *   camera.position.copy(pose.cameraPos);
 *   camera.lookAt(pose.lookAt);
 *   if (pose.fov && camera.fov !== pose.fov) { camera.fov = pose.fov; camera.updateProjectionMatrix(); }
 *   world.update(elapsed, delta, progress, camera);   // never moves the camera
 *
 * Scroll is not the world's progress directly: it is interpolated between the
 * scroll anchor of each station and that station's `progress` value from
 * src/config/portfolio.js, so the camera is exactly at the right landmark when
 * the matching copy is on screen.
 * ========================================================================== */

import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { createHydroWorld, DAM_PHASES } from './scene/hydroWorld.js';
import { createHydroAudio } from './audio/hydroAudio.js';
import portfolio, { mailtoHref } from './config/portfolio.js';

/* ========================================================================== */
/* 0. Utilities                                                              */
/* ========================================================================== */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = motionQuery.matches;
document.documentElement.classList.toggle('is-reduced', reduceMotion);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });

/* ========================================================================== */
/* 1. DOM references                                                         */
/* ========================================================================== */

const dom = {
  canvas: document.getElementById('scene'),
  loader: document.getElementById('loader'),
  loaderFill: document.getElementById('loader-fill'),
  loaderStage: document.getElementById('loader-stage'),
  portfolio: document.getElementById('portfolio'),
  topbar: document.getElementById('topbar'),
  route: document.getElementById('route'),
  railList: document.getElementById('rail-list'),
  railFill: document.getElementById('rail-fill'),
  head: document.getElementById('head-value'),
  flow: document.getElementById('flow-value'),
  output: document.getElementById('output-value'),
  grid: document.getElementById('grid-value'),
  time: document.getElementById('time-value'),
  lamp: document.getElementById('grid-lamp'),
  pct: document.getElementById('pct-value'),
  mHead: document.getElementById('m-head'),
  mFlow: document.getElementById('m-flow'),
  mOutput: document.getElementById('m-output'),
  mTime: document.getElementById('m-time'),
  mFill: document.getElementById('m-fill'),
  bottom: document.getElementById('bottom-hud'),
  soundToggle: document.getElementById('sound-toggle'),
  soundLabel: document.getElementById('sound-label'),
  spillwayToggle: document.getElementById('spillway-toggle'),
  spillwayLabel: document.getElementById('spillway-label'),
  cutawayToggle: document.getElementById('cutaway-toggle'),
  cutawayLabel: document.getElementById('cutaway-label'),
  contact: document.getElementById('contact-link'),
  prompt: document.getElementById('sound-prompt'),
  promptBackdrop: document.getElementById('prompt-backdrop'),
  promptEnable: document.getElementById('prompt-enable'),
  promptMute: document.getElementById('prompt-mute'),
  promptTitle: document.getElementById('prompt-title'),
  promptBody: document.getElementById('prompt-body'),
  promptHint: document.getElementById('prompt-hint'),
  brandMarks: document.querySelectorAll('[data-bind="brand.mark"]'),
  brandNames: document.querySelectorAll('[data-bind="brand.name"]'),
  brandShorts: document.querySelectorAll('[data-bind="brand.shortName"]'),
  brandTags: document.querySelectorAll('[data-bind="brand.tagline"]'),
};

const stations = portfolio.stations;
let sections = [];
let railButtons = [];

const numberFormat = new Intl.NumberFormat('en-US');

/* ========================================================================== */
/* 2. Static copy from the config                                            */
/* ========================================================================== */

function applyConfigCopy() {
  document.title = portfolio.meta.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', portfolio.meta.description);

  dom.brandMarks.forEach((el) => { el.textContent = portfolio.brand.mark; });
  dom.brandNames.forEach((el) => { el.textContent = portfolio.brand.name; });
  dom.brandShorts.forEach((el) => { el.textContent = portfolio.brand.shortName; });
  dom.brandTags.forEach((el) => { el.textContent = portfolio.brand.tagline; });

  dom.soundLabel.textContent = portfolio.sound.pillOff;
  dom.soundToggle.setAttribute('aria-label', portfolio.hud.soundAria);
  dom.spillwayToggle.setAttribute('aria-label', portfolio.hud.spillwayAria);
  dom.cutawayToggle.setAttribute('aria-label', portfolio.hud.cutawayAria);
  dom.contact.setAttribute('aria-label', portfolio.hud.contactAria);
  dom.contact.href = mailtoHref(portfolio.contact.primary);
  document.querySelector('.skip-link')?.setAttribute('aria-label', 'Skip to the portfolio');

  dom.promptTitle.textContent = portfolio.sound.title;
  dom.promptBody.textContent = portfolio.sound.body;
  dom.promptEnable.textContent = portfolio.sound.enable;
  dom.promptMute.textContent = portfolio.sound.muted;
  dom.promptHint.textContent = portfolio.sound.hint;

  dom.route.setAttribute('aria-label', portfolio.hud.railAria);
}

/* ========================================================================== */
/* 3. Station sections + station rail                                        */
/* ========================================================================== */

function factHtml(fact) {
  return `<div class="fact"><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`;
}

function contactHtml() {
  const c = portfolio.contact;
  return `
    <div class="contact">
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.body)}</p>
      <div class="contact__actions">
        <a class="btn btn--primary" href="${escapeHtml(mailtoHref(c.primary))}">${escapeHtml(c.primary.label)}</a>
        <a class="btn btn--ghost" href="${escapeHtml(mailtoHref(c.secondary))}">${escapeHtml(c.secondary.label)}</a>
      </div>
    </div>
  `;
}

function buildStations() {
  const frag = document.createDocumentFragment();

  stations.forEach((station, index) => {
    const section = document.createElement('section');
    section.className = 'station';
    section.id = `station-${station.no}`;
    section.dataset.index = String(index);
    section.dataset.stationId = station.id;
    section.setAttribute('aria-labelledby', `${station.id}-title`);

    const [kickerHead, ...kickerRest] = station.kicker.split('·');
    const kickerTail = kickerRest.join('·').trim();

    section.innerHTML = `
      <article class="station__card">
        <p class="station__kicker">
          <span class="station__no">${escapeHtml(station.no)}</span>
          <span>${escapeHtml(kickerTail || kickerHead.trim())}</span>
        </p>
        <h2 class="station__title" id="${escapeHtml(station.id)}-title">${escapeHtml(station.title)}</h2>
        <p class="station__lede">${escapeHtml(station.lede)}</p>
        <p class="station__body">${escapeHtml(station.body)}</p>
        <dl class="station__facts">${station.facts.map(factHtml).join('')}</dl>
        <ul class="station__tags">${station.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>
        ${station.id === 'night' ? contactHtml() : ''}
        <p class="station__sign">${escapeHtml(`${portfolio.principal.role} · ${portfolio.principal.practice}`)}</p>
      </article>
    `;

    frag.appendChild(section);
  });

  dom.portfolio.appendChild(frag);
  sections = Array.from(dom.portfolio.querySelectorAll('.station'));
}

function buildRail() {
  const frag = document.createDocumentFragment();

  stations.forEach((station, index) => {
    const item = document.createElement('li');
    item.className = 'rail__item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rail__btn';
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `Station ${station.no} — ${station.railLabel}`);
    button.innerHTML = `
      <span class="rail__dot" aria-hidden="true"></span>
      <span class="rail__no">${escapeHtml(station.no)}</span>
      <span class="rail__name">${escapeHtml(station.railLabel)}</span>
    `;
    button.addEventListener('click', () => {
      scrollToStation(index);
      button.blur();
    });

    item.appendChild(button);
    frag.appendChild(item);
  });

  dom.railList.appendChild(frag);
  railButtons = Array.from(dom.railList.querySelectorAll('.rail__btn'));
}

/* ========================================================================== */
/* 4. Renderer, scene, camera, world, audio                                  */
/* ========================================================================== */

const viewport = { width: window.innerWidth, height: window.innerHeight };
const isNarrow = viewport.width <= 900;
const quality = isNarrow ? (viewport.width <= 360 ? 'low' : 'medium') : 'high';

// `?capture=1` is a verification affordance: the drawing buffer is preserved and
// the animation loop stops issuing its own renders, so a headless screenshot
// always captures the frame that was just drawn instead of a cleared buffer.
// It changes no visual output.
const captureMode = new URLSearchParams(window.location.search).has('capture');

dom.canvas.setAttribute('data-quality', quality);

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  alpha: false,
  stencil: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: captureMode,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isNarrow ? 1.5 : 1.75));
renderer.setSize(viewport.width, viewport.height, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
// PCFSoftShadowMap was removed in three r187; PCF is the supported equivalent.
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0x0a1416, 1);

const scene = new THREE.Scene();
const initialAspect = viewport.width / viewport.height;
const camera = new THREE.PerspectiveCamera(initialAspect < 0.85 ? 72 : 58, initialAspect, 0.1, 6000);

let world = null;
let lastPose = null;

const audio = createHydroAudio({ volume: 0.78, muted: true, spillwayOpen: 1.0 });

/** Portrait screens need a wider vertical field of view than the pose suggests. */
function poseFov(pose) {
  const aspect = camera.aspect;
  const base = pose && Number.isFinite(pose.fov) ? pose.fov : 55;
  if (aspect < 0.75) return Math.min(80, base * 1.38);
  if (aspect < 1.0) return Math.min(74, base * 1.2);
  if (aspect < 1.3) return Math.min(68, base * 1.08);
  return base;
}

/* ========================================================================== */
/* 5. Boot                                                                   */
/* ========================================================================== */

const app = {
  ready: false,
  progress: stations[0].progress,
  target: stations[0].progress,
  soundOn: false,
  promptOpen: false,
  introDone: false,
  quality,
  spillwayOpen: 1.0,
  cutaway: true,
  anchors: [{ y: 0, p: stations[0].progress }],
  maxScroll: 1,
  activeStation: 0,
};

const hudCache = { head: null, flow: null, output: null, grid: null, time: null, pct: null, station: -1 };

function setLoader(pct, stage) {
  if (dom.loaderFill) dom.loaderFill.style.width = `${clamp(pct, 2, 100)}%`;
  if (stage && dom.loaderStage) dom.loaderStage.textContent = stage;
}

async function boot() {
  applyConfigCopy();
  buildStations();
  buildRail();

  setLoader(8, 'Surveying the gorge…');
  await nextFrame();

  setLoader(24, 'Pouring the arch-gravity crest…');
  await nextFrame();
  await sleep(40);

  const buildStart = performance.now();
  try {
    world = createHydroWorld(scene, {
      quality,
      seed: 20261118,
      shadows: quality !== 'low',
      spillwayOpen: app.spillwayOpen,
      cutaway: app.cutaway,
    });
  } catch (error) {
    console.error('[CANYON HYDRO] world build failed', error);
    throw error;
  }
  const buildMs = Math.round(performance.now() - buildStart);

  setLoader(64, 'Setting the five radial gates…');
  await nextFrame();

  world.setSpillwayOpen(app.spillwayOpen);
  world.setCutaway(app.cutaway);

  setLoader(78, 'Spinning up the Francis runners…');
  measureLayout();
  updateHudImmediate();
  syncControls();
  syncSoundUi();

  // Compile the scene once behind the preloader so the first visible frame is
  // already warm (the first WebGL frame is by far the most expensive).
  const firstPose = world.getDamPose(app.progress);
  applyPose(firstPose);
  lastPose = firstPose;
  world.update(0, 0.016, app.progress, camera);
  renderer.render(scene, camera);

  setLoader(91, 'Energising the 500 kV switchyard…');
  await nextFrame();
  await nextFrame();

  startLoop();
  bindEvents();
  setupScrollMotion();

  setLoader(100, 'Ready — four units online.');
  await sleep(520);

  dom.loader.classList.add('is-out');
  await sleep(560);
  dom.loader.hidden = true;

  app.ready = true;
  window.__hydroReady = true;

  await sleep(160);
  openSoundPrompt();

  window.__hydro.debug = {
    buildMs,
    drawables: world.stats ? world.stats.drawables : null,
    particles: world.stats ? world.stats.particles : null,
  };
  if (typeof console !== 'undefined' && console.info) {
    console.info(
      `[CANYON HYDRO] world ready in ${buildMs} ms · quality ${quality} · ` +
        `${world.stats?.drawables ?? '?'} drawables · phasing ${DAM_PHASES.length} stations`
    );
  }
}

/* ========================================================================== */
/* 6. Pose / camera                                                          */
/* ========================================================================== */

function applyPose(pose) {
  camera.position.copy(pose.cameraPos);
  camera.lookAt(pose.lookAt);
  const fov = poseFov(pose);
  if (Math.abs(camera.fov - fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}

/* ========================================================================== */
/* 7. Scroll → progress                                                      */
/* ========================================================================== */

function measureLayout() {
  const vh = window.innerHeight;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  const anchors = [];
  const scrollY = window.scrollY || 0;

  // Clearance the HUD needs above and below a station card: the top bar is
  // ~76 px tall, the mobile telemetry bar ~92 px plus a margin.
  const hudTop = 96;
  const hudBottom = 112;

  sections.forEach((section, index) => {
    const top = section.getBoundingClientRect().top + scrollY;
    const card = section.querySelector('.station__card');
    let y = top + Math.max(0, (section.offsetHeight - vh) / 2);

    if (card) {
      // A station is "reached" when its card sits fully clear of the HUD.
      //   yMax = the furthest we may scroll while keeping the card's top below
      //          the header
      //   yMin = the least we may scroll while keeping its bottom above the
      //          mobile telemetry bar
      // When the card is taller than that space (long cards on a phone), the
      // top is pinned below the header and the rest is read by scrolling.
      const cardTop = top + card.offsetTop;
      const cardH = card.offsetHeight;
      const yMax = cardTop - hudTop;
      const yMin = cardTop + cardH - vh + hudBottom;
      y = yMin <= yMax ? clamp(y, yMin, yMax) : yMax;
    }

    anchors.push({ y: clamp(y, 0, maxScroll), p: stations[index].progress });
  });

  anchors.push({ y: Math.max(maxScroll, anchors[anchors.length - 1].y + 1), p: 1 });

  for (let i = 1; i < anchors.length; i += 1) {
    if (anchors[i].y <= anchors[i - 1].y) anchors[i].y = anchors[i - 1].y + 1;
  }

  app.anchors = anchors;
  app.maxScroll = maxScroll;
}

function progressAtScroll(y) {
  const anchors = app.anchors;
  if (y <= anchors[0].y) return anchors[0].p;
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (y < b.y) {
      const t = (y - a.y) / (b.y - a.y || 1);
      return lerp(a.p, b.p, clamp01(t));
    }
  }
  return anchors[anchors.length - 1].p;
}

function scrollToStation(index) {
  const target = clamp(index, 0, app.anchors.length - 2);
  const y = Math.max(0, app.anchors[target].y);
  if (lenis) {
    lenis.scrollTo(y, { duration: reduceMotion ? 0 : 1.45, lock: true, force: true });
  } else {
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

let lenis = null;

function createLenis() {
  if (lenis || reduceMotion) return;
  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.6,
    syncTouch: false,
    // Lenis owns its own animation frame: it must not depend on GSAP's ticker,
    // which sleeps when no tween is running (that would freeze every
    // programmatic scroll between stations).
    autoRaf: true,
  });
  lenis.on('scroll', () => {
    if (ScrollTrigger) ScrollTrigger.update();
  });
}

function setupScrollMotion() {
  createLenis();

  // The HUD intro is a CSS animation (see main.css), not a JS tween: a stalled
  // animation frame must never be able to leave the header or the rail
  // invisible. This flag simply tells the verification harness the intro is
  // over.
  window.setTimeout(() => {
    app.introDone = true;
  }, 760);

  if (reduceMotion) {
    app.introDone = true;
    if (ScrollTrigger) ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    return;
  }

  gsap.registerPlugin?.(ScrollTrigger);

  // A gentle parallax on each card. It never changes opacity, so the copy is
  // readable at every scroll position even if a trigger has not fired yet.
  sections.forEach((section) => {
    const card = section.querySelector('.station__card');
    if (!card) return;
    gsap.fromTo(
      card,
      { y: 22 },
      {
        y: -22,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      }
    );
  });

  if (ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
}

/* ========================================================================== */
/* 8. Frame loop                                                             */
/* ========================================================================== */

let rafId = 0;
let lastTime = 0;
let elapsed = 0;
let lastAudioAt = 0;
let lastHudAt = 0;

function startLoop() {
  if (rafId) return;
  lastTime = 0;
  const frame = (now) => {
    rafId = requestAnimationFrame(frame);
    if (document.hidden || !world) return;

    const seconds = now / 1000;
    let dt = lastTime ? seconds - lastTime : 1 / 60;
    lastTime = seconds;
    dt = clamp(dt, 0, 0.1);
    elapsed += dt;

    // scroll → target progress → damped progress
    const scrollY = window.scrollY || window.pageYOffset || 0;
    app.target = progressAtScroll(scrollY);
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt / 0.17);
    app.progress += (app.target - app.progress) * k;
    if (Math.abs(app.target - app.progress) < 0.00005) app.progress = app.target;
    app.progress = clamp01(app.progress);

    const pose = world.getDamPose(app.progress);
    applyPose(pose);
    lastPose = pose;
    world.update(elapsed, dt, app.progress, camera);
    if (!captureMode) renderer.render(scene, camera);

    if (now - lastAudioAt > 70) {
      lastAudioAt = now;
      try {
        audio.update(app.progress, pose.flowM3s, pose.outputMw, app.spillwayOpen);
      } catch (error) {
        /* audio must never break the render loop */
      }
    }

    if (now - lastHudAt > 90) {
      lastHudAt = now;
      updateHud(pose);
    }
  };
  rafId = requestAnimationFrame(frame);
}

/* ========================================================================== */
/* 9. HUD                                                                    */
/* ========================================================================== */

function activeStationIndex(progress) {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < stations.length; i += 1) {
    const distance = Math.abs(stations[i].progress - progress);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

function updateHud(pose) {
  const head = (Math.round(pose.headMeters * 10) / 10).toFixed(1);
  const flow = numberFormat.format(Math.round(pose.flowM3s));
  const output = numberFormat.format(Math.round(pose.outputMw));
  const grid = String(Math.round(pose.gridKv));
  const time = pose.timeLabel || '—';
  const pct = Math.round(app.progress * 100);

  if (hudCache.head !== head) {
    hudCache.head = head;
    dom.head.textContent = head;
    dom.mHead.textContent = head;
  }

  if (hudCache.flow !== flow) {
    hudCache.flow = flow;
    dom.flow.textContent = flow;
    dom.mFlow.textContent = flow;
  }

  if (hudCache.output !== output) {
    hudCache.output = output;
    dom.output.textContent = output;
    dom.mOutput.textContent = output;
  }

  if (hudCache.grid !== grid) {
    hudCache.grid = grid;
    dom.grid.textContent = grid;
  }

  if (hudCache.time !== time) {
    hudCache.time = time;
    dom.time.textContent = time;
    dom.mTime.textContent = portfolio.shortTime[time] || time.split(' ')[0];
    dom.lamp.dataset.tone = time === 'Night' || time === 'Deep night' ? 'amber' : 'green';
  }

  if (hudCache.pct !== pct) {
    hudCache.pct = pct;
    dom.pct.textContent = pct < 10 ? `0${pct}` : String(pct);
    dom.railFill.style.height = `${pct}%`;
    dom.mFill.style.width = `${Math.max(2, pct)}%`;
  }

  const station = activeStationIndex(app.progress);
  if (hudCache.station !== station) {
    hudCache.station = station;
    app.activeStation = station;
    railButtons.forEach((button, index) => {
      if (index === station) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    sections.forEach((section, index) => {
      section.classList.toggle('is-active', index === station);
    });
  }
}

function updateHudImmediate() {
  if (!world) return;
  updateHud(world.getDamPose(app.progress));
}

/**
 * Render one frame at an exact progress value, synchronously.
 *
 * The animation loop damps progress towards the scroll target over a few
 * frames; on a software-rendered machine (or when a verification harness needs
 * a deterministic frame) that is too slow to be useful. This drives the same
 * pose + world update + HUD path once, so screenshots land on the intended
 * landmark. On a normal GPU the loop simply continues from the same value.
 */
function renderAt(progress) {
  if (!world) return null;
  const p = clamp01(progress);
  app.target = p;
  app.progress = p;
  const pose = world.getDamPose(p);
  applyPose(pose);
  lastPose = pose;
  world.update(elapsed, 1 / 60, p, camera);
  renderer.render(scene, camera);
  updateHud(pose);
  return {
    progress: p,
    headMeters: Math.round(pose.headMeters * 10) / 10,
    flowM3s: Math.round(pose.flowM3s),
    outputMw: Math.round(pose.outputMw),
    gridKv: Math.round(pose.gridKv),
    timeLabel: pose.timeLabel,
    phaseId: pose.phaseId,
    phaseName: pose.phaseName,
    station: pose.station,
    cameraFov: Math.round(camera.fov * 10) / 10,
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    programs: renderer.info.programs ? renderer.info.programs.length : 0,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries,
    frame: renderer.info.render.frame,
  };
}

/* ========================================================================== */
/* 10. Controls: sound, spillway, cutaway                                    */
/* ========================================================================== */

function syncSoundUi() {
  const on = app.soundOn && !audio.isMuted();
  dom.soundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  dom.soundLabel.textContent = isNarrow
    ? portfolio.sound.pillOff.replace(/\s(On|Off)$/, '')
    : on
      ? portfolio.sound.pillOn
      : portfolio.sound.pillOff;
  dom.soundToggle.setAttribute(
    'aria-label',
    `${portfolio.hud.soundAria} — ${on ? 'currently on' : 'currently muted'}`
  );
}

function syncControls() {
  const open = app.spillwayOpen > 0.5;
  dom.spillwayToggle.setAttribute('aria-pressed', open ? 'true' : 'false');
  dom.spillwayLabel.textContent = open ? portfolio.hud.spillwayOpen : portfolio.hud.spillwayLow;
  dom.spillwayToggle.setAttribute(
    'aria-label',
    `${portfolio.hud.spillwayAria} — ${open ? '100 % open' : '25 % open'}`
  );

  dom.cutawayToggle.setAttribute('aria-pressed', app.cutaway ? 'true' : 'false');
  dom.cutawayLabel.textContent = app.cutaway ? portfolio.hud.cutawayOn : portfolio.hud.cutawayOff;
  dom.cutawayToggle.setAttribute(
    'aria-label',
    `${portfolio.hud.cutawayAria} — ${app.cutaway ? 'cutaway on' : 'cutaway off'}`
  );
}

function setSpillway(open, { chime = true } = {}) {
  app.spillwayOpen = open ? 1.0 : 0.25;
  if (world) world.setSpillwayOpen(app.spillwayOpen);
  syncControls();
  if (chime) {
    try {
      if (!audio.getState().initialized) {
        /* the gate chime needs a gesture-built graph; the toggle itself is still applied */
      } else {
        audio.playGateChime();
      }
    } catch (error) {
      /* ignore */
    }
  }
  return app.spillwayOpen;
}

function setCutaway(enabled, { click = true } = {}) {
  app.cutaway = Boolean(enabled);
  if (world) world.setCutaway(app.cutaway);
  syncControls();
  if (click) {
    try {
      if (audio.getState().initialized) audio.playClick();
    } catch (error) {
      /* ignore */
    }
  }
  return app.cutaway;
}

function enableSound({ chime = true } = {}) {
  let ok = false;
  try {
    ok = audio.init();
    audio.resume();
    audio.setMuted(false);
  } catch (error) {
    ok = false;
  }
  app.soundOn = ok !== false;
  syncSoundUi();
  if (app.soundOn && chime) {
    window.setTimeout(() => {
      try {
        audio.playGateChime();
      } catch (error) {
        /* ignore */
      }
    }, 240);
  }
  return app.soundOn;
}

function muteSound() {
  try {
    audio.setMuted(true);
  } catch (error) {
    /* ignore */
  }
  app.soundOn = false;
  syncSoundUi();
}

/* ========================================================================== */
/* 11. Sound prompt                                                          */
/* ========================================================================== */

let lastFocused = null;

function openSoundPrompt() {
  if (app.promptOpen) return;
  app.promptOpen = true;
  lastFocused = document.activeElement;
  dom.prompt.hidden = false;
  requestAnimationFrame(() => dom.prompt.classList.add('is-open'));
  document.documentElement.classList.add('is-locked');
  if (lenis) lenis.stop();
  window.setTimeout(() => {
    if (app.promptOpen) dom.promptEnable.focus({ preventScroll: true });
  }, 60);
}

function closeSoundPrompt(reason) {
  if (!app.promptOpen) return;
  app.promptOpen = false;
  dom.prompt.classList.remove('is-open');
  document.documentElement.classList.remove('is-locked');
  if (lenis) lenis.start();
  window.setTimeout(() => {
    if (!app.promptOpen) dom.prompt.hidden = true;
  }, 430);

  if (reason === 'enable') {
    enableSound();
  } else {
    muteSound();
  }

  const focusTarget = lastFocused && lastFocused !== document.body ? lastFocused : dom.soundToggle;
  window.setTimeout(() => {
    try {
      focusTarget.focus({ preventScroll: true });
    } catch (error) {
      /* ignore */
    }
  }, 60);
}

/* ========================================================================== */
/* 12. Events                                                                */
/* ========================================================================== */

function bindEvents() {
  dom.soundToggle.addEventListener('click', () => {
    const state = audio.getState();
    if (!state.initialized) {
      enableSound({ chime: false });
      return;
    }
    if (state.muted) {
      audio.setMuted(false);
      app.soundOn = true;
      syncSoundUi();
      try { audio.playClick(); } catch (error) { /* ignore */ }
    } else {
      muteSound();
    }
  });

  dom.spillwayToggle.addEventListener('click', () => {
    setSpillway(app.spillwayOpen < 0.5);
    dom.spillwayToggle.blur();
  });

  dom.cutawayToggle.addEventListener('click', () => {
    setCutaway(!app.cutaway);
    dom.cutawayToggle.blur();
  });

  dom.promptEnable.addEventListener('click', () => closeSoundPrompt('enable'));
  dom.promptMute.addEventListener('click', () => closeSoundPrompt('mute'));
  dom.promptBackdrop.addEventListener('click', () => closeSoundPrompt('mute'));

  dom.prompt.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSoundPrompt('mute');
      return;
    }
    if (event.key === 'Enter') {
      const onButton = event.target instanceof HTMLElement && event.target.closest('button');
      if (!onButton) {
        event.preventDefault();
        closeSoundPrompt('enable');
      }
      return;
    }
    if (event.key === 'Tab') {
      // two focusable controls: keep the tab ring inside the dialog
      const focusables = [dom.promptEnable, dom.promptMute];
      const current = focusables.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!event.shiftKey && current === focusables.length - 1) {
        event.preventDefault();
        focusables[0].focus();
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!app.promptOpen) return;
    if (event.key === 'Enter' && !(event.target instanceof HTMLElement && event.target.closest('#sound-prompt'))) {
      event.preventDefault();
      closeSoundPrompt('enable');
    }
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      if (lastPose) applyPose(lastPose);
      else camera.updateProjectionMatrix();
      measureLayout();
      updateHudImmediate();
      if (ScrollTrigger && !reduceMotion) ScrollTrigger.refresh();
      syncSoundUi();
    }, 160);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTime = 0;
  });

  // Lenis owns wheel scrolling, so keyboard scrolling is wired explicitly.
  // Without this, arrow keys and Page Down are swallowed on desktop.
  document.addEventListener('keydown', (event) => {
    if (app.promptOpen || event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const target = event.target;
    const tag = target instanceof HTMLElement ? target.tagName : '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    const onControl = target instanceof HTMLElement && target.closest('a[href], button');

    const vh = window.innerHeight;
    const current = window.scrollY || 0;
    let next = null;

    switch (event.key) {
      case 'ArrowDown': next = current + 132; break;
      case 'ArrowUp': next = current - 132; break;
      case 'PageDown': next = current + vh * 0.88; break;
      case 'PageUp': next = current - vh * 0.88; break;
      case 'Home': next = 0; break;
      case 'End': next = app.maxScroll; break;
      case ' ':
        if (onControl) return;
        next = current + (event.shiftKey ? -vh * 0.88 : vh * 0.88);
        break;
      default: return;
    }

    event.preventDefault();
    const y = clamp(next, 0, app.maxScroll);
    if (lenis) lenis.scrollTo(y, { duration: 0.55 });
    else window.scrollTo(0, y);
  });

  const onMotionChange = () => {
    reduceMotion = motionQuery.matches;
    document.documentElement.classList.toggle('is-reduced', reduceMotion);
    if (reduceMotion) {
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
      if (ScrollTrigger) ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.globalTimeline.clear();
    } else {
      setupScrollMotion();
    }
  };
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
  else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

  dom.canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    document.documentElement.classList.add('is-webgl-lost');
  });
}

/* ========================================================================== */
/* 13. Public debug handle (used by the verification harness)                */
/* ========================================================================== */

window.__hydro = {
  app,
  portfolio,
  scene,
  camera,
  renderer,
  audio,
  gsap,
  quality,
  get world() {
    return world;
  },
  get rects() {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
    };
    return {
      topbar: rect(dom.topbar),
      brand: rect(document.querySelector('.brand')),
      sound: rect(dom.soundToggle),
      spillway: rect(dom.spillwayToggle),
      cutaway: rect(dom.cutawayToggle),
      contact: rect(dom.contact),
      route: rect(dom.route),
      telemetry: rect(document.querySelector('.route__telemetry')),
      rail: rect(dom.route.querySelector('.route__rail')),
      bottom: rect(dom.bottom),
      card: rect(document.querySelector('.station.is-active .station__card') || document.querySelector('.station__card')),
      prompt: rect(dom.prompt.querySelector('.prompt__card')),
    };
  },
  anchors: () => app.anchors.map((anchor) => ({ ...anchor })),
  progressForScroll: progressAtScroll,
  renderAt,
  snapToStation(index) {
    const i = clamp(Math.floor(index || 0), 0, stations.length - 1);
    if (lenis) lenis.scrollTo(app.anchors[i].y, { immediate: true, force: true });
    else window.scrollTo(0, app.anchors[i].y);
    return renderAt(stations[i].progress);
  },
  get lenis() {
    return lenis;
  },
  progress: () => app.progress,
  target: () => app.target,
  scrollToStation,
  measure: measureLayout,
  openSoundPrompt,
  closeSoundPrompt,
  isPromptOpen: () => app.promptOpen,
  setSpillway,
  setCutaway,
  toggleSpillway: () => setSpillway(app.spillwayOpen < 0.5),
  toggleCutaway: () => setCutaway(!app.cutaway),
  spillwayOpen: () => app.spillwayOpen,
  cutawayOn: () => app.cutaway,
};

boot().catch((error) => {
  // A boot failure must be visible in the UI rather than a silent black screen.
  console.error('[CANYON HYDRO] boot failed', error);
  if (dom.loaderStage) dom.loaderStage.textContent = 'The dam site could not be prepared. Please reload.';
  document.documentElement.classList.remove('is-locked');
});
