/**
 * main.js
 * ============================================================================
 * Boots the Aero Pilot portfolio: renderer, procedural flight world, procedural
 * cockpit audio, the scroll → flight-progress mapping, the HUD, the flight rail
 * and the on-load sound prompt.
 *
 * The world contract (src/scene/aeroWorld.js) does the heavy lifting:
 *
 *   world.update(elapsed, delta, progress, camera)  // moves the camera + scene
 *   const pose = world.getFlightPose(progress)      // telemetry, same numbers
 *
 * `update()` also returns the pose it just applied, so the loop reads telemetry
 * from that return value instead of computing the flight path twice.
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

import { createAeroWorld } from './scene/aeroWorld.js';
import { createAeroAudio } from './audio/aeroAudio.js';
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

const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

/** 5.5 → "UTC+05:30", 7.2 → "UTC+07:15" (nearest quarter hour). */
function formatUtcOffset(hours) {
  const raw = Number.isFinite(hours) ? hours : 0;
  const quarter = Math.round(raw * 4) / 4;
  const sign = quarter < 0 ? '−' : '+';
  const abs = Math.abs(quarter);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${pad2(h)}:${pad2(m)}`;
}

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
  railHud: document.getElementById('flight-rail'),
  railList: document.getElementById('rail-list'),
  railFill: document.getElementById('rail-fill'),
  telemetry: document.getElementById('telemetry-title'),
  alt: document.getElementById('alt-value'),
  spd: document.getElementById('spd-value'),
  mach: document.getElementById('mach-value'),
  zone: document.getElementById('zone-value'),
  zoneName: document.getElementById('zone-name'),
  clock: document.getElementById('clock-value'),
  clockLabel: document.getElementById('clock-label'),
  pct: document.getElementById('pct-value'),
  mAlt: document.getElementById('m-alt'),
  mSpd: document.getElementById('m-spd'),
  mClock: document.getElementById('m-clock'),
  mZone: document.getElementById('m-zone'),
  mFill: document.getElementById('m-fill'),
  bottom: document.getElementById('bottom-hud'),
  soundToggle: document.getElementById('sound-toggle'),
  soundLabel: document.getElementById('sound-label'),
  chime: document.getElementById('chime'),
  logbook: document.getElementById('logbook'),
  prompt: document.getElementById('sound-prompt'),
  promptBackdrop: document.getElementById('prompt-backdrop'),
  promptEnable: document.getElementById('prompt-enable'),
  promptMute: document.getElementById('prompt-mute'),
  promptTitle: document.getElementById('prompt-title'),
  promptBody: document.getElementById('prompt-body'),
  promptHint: document.getElementById('prompt-hint'),
  brandMarks: document.querySelectorAll('[data-bind="brand.mark"]'),
  brandNames: document.querySelectorAll('[data-bind="brand.name"]'),
  brandShorts: document.querySelectorAll('[data-bind="brand.short"]'),
  brandTags: document.querySelectorAll('[data-bind="brand.tagline"]'),
};

const stations = portfolio.stations;
let sections = [];
let railButtons = [];

/* ========================================================================== */
/* 2. Static copy from the config                                            */
/* ========================================================================== */

function applyConfigCopy() {
  document.title = portfolio.meta.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', portfolio.meta.description);

  dom.brandMarks.forEach((el) => { el.textContent = portfolio.brand.mark; });
  dom.brandNames.forEach((el) => { el.textContent = portfolio.brand.name; });
  dom.brandShorts.forEach((el) => { el.textContent = portfolio.brand.shortName || portfolio.brand.name; });
  dom.brandTags.forEach((el) => { el.textContent = portfolio.brand.tagline; });

  dom.soundLabel.textContent = portfolio.sound.pillOff;
  dom.soundToggle.setAttribute('aria-label', portfolio.hud.soundAria);
  dom.chime.setAttribute('aria-label', portfolio.sound.chimeAria);
  dom.logbook.setAttribute('aria-label', portfolio.hud.logbookAria);
  dom.logbook.href = `#station-${stations[stations.length - 1].no}`;

  dom.telemetry.textContent = portfolio.hud.panelTitle;
  dom.promptTitle.textContent = portfolio.sound.title;
  dom.promptBody.textContent = portfolio.sound.body;
  dom.promptEnable.textContent = portfolio.sound.enable;
  dom.promptMute.textContent = portfolio.sound.muted;
  dom.promptHint.textContent = portfolio.sound.hint;

  dom.railHud.setAttribute('aria-label', portfolio.hud.rail);
}

/* ========================================================================== */
/* 3. Station sections + flight rail                                         */
/* ========================================================================== */

function factHtml(fact) {
  return `<div class="fact"><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`;
}

function dispatchHtml() {
  const d = portfolio.dispatch;
  return `
    <div class="dispatch">
      <h3>${escapeHtml(d.title)}</h3>
      <p>${escapeHtml(d.body)}</p>
      <div class="dispatch__actions">
        <a class="btn btn--primary" href="${escapeHtml(mailtoHref(d.primary))}">${escapeHtml(d.primary.label)}</a>
        <a class="btn btn--ghost" href="${escapeHtml(mailtoHref(d.secondary))}">${escapeHtml(d.secondary.label)}</a>
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
        ${station.id === 'approach' ? dispatchHtml() : ''}
        <p class="station__sign">${escapeHtml(portfolio.captain.signature)}</p>
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
const quality = isNarrow ? 'medium' : 'high';

dom.canvas.setAttribute('data-quality', quality);

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  alpha: false,
  stencil: false,
  powerPreference: 'high-performance',
});

const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

renderer.setPixelRatio(pixelRatio());
renderer.setSize(viewport.width, viewport.height, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
// The world is lit by analytic lights and emissive glow points; no shadow maps.
renderer.shadowMap.enabled = false;
renderer.setClearColor(0x060b13, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(56, viewport.width / viewport.height, 0.1, 10000);

let world = null;
const audio = createAeroAudio({ masterVolume: 0.8, muted: true });

/* ========================================================================== */
/* 5. Boot                                                                   */
/* ========================================================================== */

const app = {
  ready: false,
  progress: 0.02,
  target: 0.02,
  soundOn: false,
  promptOpen: false,
  quality,
  anchors: [{ y: 0, p: 0.02 }],
  maxScroll: 1,
  activeStation: 0,
  lastPose: null,
};

const hudCache = { alt: null, spd: null, mach: null, zone: null, clock: null, pct: null, station: -1 };

function setLoader(pct, stage) {
  if (dom.loaderFill) dom.loaderFill.style.width = `${clamp(pct, 2, 100)}%`;
  if (stage && dom.loaderStage) dom.loaderStage.textContent = stage;
}

async function boot() {
  applyConfigCopy();
  buildStations();
  buildRail();

  setLoader(10, 'Reading the load sheet…');
  await nextFrame();

  setLoader(32, 'Fuel, trim, flight plan…');
  await nextFrame();
  await sleep(40);

  const buildStart = performance.now();
  world = createAeroWorld(scene, {
    pixelRatio: renderer.getPixelRatio(),
    seed: 20261118,
    manageFog: true,
    manageBackground: true,
  });
  const buildMs = Math.round(performance.now() - buildStart);

  setLoader(72, 'Lighting the flight deck…');
  await nextFrame();

  measureLayout();
  updateHudImmediate();
  syncSoundUi();

  // Compile the scene once behind the preloader so the first visible frame is
  // already warm (the first WebGL frame is by far the most expensive).
  const firstPose = world.getFlightPose(app.progress);
  camera.position.copy(firstPose.cameraPos);
  camera.up.copy(firstPose.cameraUp);
  camera.lookAt(firstPose.lookAt);
  world.update(0, 0.016, app.progress, camera);
  renderer.render(scene, camera);

  setLoader(90, 'Cleared for take-off…');
  await nextFrame();
  await nextFrame();

  startLoop();
  bindEvents();
  setupScrollMotion();

  setLoader(100, 'Runway 09L — cleared.');
  await sleep(520);

  dom.loader.classList.add('is-out');
  await sleep(560);
  dom.loader.hidden = true;

  app.ready = true;
  window.__aeroReady = true;

  await sleep(160);
  openSoundPrompt();

  const stats = world.stats || {};
  window.__aero.debug = { buildMs, stats };
  if (typeof console !== 'undefined' && console.info) {
    console.info(
      `[MERIDIAN] flight ready in ${buildMs} ms · quality ${quality} · ${stats.buildings ?? '?'} buildings · ${stats.runwayLights ?? '?'} runway lights`
    );
  }
}

/* ========================================================================== */
/* 6. Scroll → progress                                                      */
/* ========================================================================== */

function measureLayout() {
  const vh = window.innerHeight;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  const anchors = [{ y: 0, p: 0.02 }];
  const narrow = window.innerWidth <= 720;

  sections.forEach((section, index) => {
    // Anchor the card, not the section: a card taller than its 100vh section
    // would otherwise be pulled half off-screen at its own station.
    const card = section.querySelector('.station__card') || section;
    const rect = card.getBoundingClientRect();
    const cardTop = rect.top + (window.scrollY || 0);
    // Phones read top-down: start the card just under the fixed top bar.
    // Wider screens centre it, so the whole card is on screen at once.
    const y = narrow ? cardTop - 70 : cardTop + rect.height / 2 - vh / 2;
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

let lenis = null;

function scrollToStation(index) {
  const target = clamp(index + 1, 1, app.anchors.length - 2);
  const y = Math.max(0, app.anchors[target].y);
  if (lenis) {
    lenis.scrollTo(y, { duration: reduceMotion ? 0 : 1.45, lock: true, force: true });
  } else {
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

function createLenis() {
  if (lenis || reduceMotion) return;
  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.6,
    syncTouch: false,
  });
  lenis.on('scroll', () => {
    if (ScrollTrigger) ScrollTrigger.update();
  });
  gsap.ticker.add((time) => lenis && lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function setupScrollMotion() {
  createLenis();

  if (reduceMotion) {
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

  gsap
    .timeline({ delay: 0.1 })
    .from(dom.topbar, { y: -10, opacity: 0, duration: 0.7, ease: 'power2.out' })
    .from(dom.railHud, { x: 14, opacity: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5');

  if (ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
}

/* ========================================================================== */
/* 7. Frame loop                                                             */
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

    // update() moves the camera and the scene, and returns this frame's pose
    const pose = world.update(elapsed, dt, app.progress, camera);
    app.lastPose = pose;
    renderer.render(scene, camera);

    if (now - lastAudioAt > 70) {
      lastAudioAt = now;
      try {
        audio.update(app.progress, pose.altitudeFt, pose.airspeedKts);
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
/* 8. HUD                                                                    */
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

/** "05:38 · Dawn" → { base: 338, label: "Dawn" } */
function parseTimeOfDay(value) {
  const text = String(value || '');
  const [timePart, ...rest] = text.split('·');
  const match = /(\d{1,2}):(\d{2})/.exec(timePart);
  const base = match ? Number(match[1]) * 60 + Number(match[2]) : 0;
  const label = rest.join('·').trim();
  return { base, label };
}

function localClock(pose) {
  const parsed = parseTimeOfDay(pose.timeOfDay);
  const fallback = portfolio.clockFallback[pose.phaseId];
  let base = parsed.base;
  if (!parsed.base && fallback) {
    const m = /(\d{1,2}):(\d{2})/.exec(fallback);
    if (m) base = Number(m[1]) * 60 + Number(m[2]);
  }
  const minutes = Math.floor(base + elapsed / 60) % 1440;
  return {
    clock: `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`,
    label: parsed.label || 'Local',
  };
}

function updateHud(pose) {
  const altitude = Math.max(0, Math.round(pose.altitudeFt));
  const speed = Math.max(0, Math.round(pose.airspeedKts));
  const mach = Number.isFinite(pose.mach) ? pose.mach : 0;
  const zone = formatUtcOffset(pose.utcOffset);
  const zoneName = portfolio.zones[pose.phaseId] || stations[activeStationIndex(app.progress)].zone || '—';
  const { clock, label } = localClock(pose);
  const pct = Math.round(app.progress * 100);

  if (hudCache.alt !== altitude) {
    hudCache.alt = altitude;
    const text = altitude.toLocaleString('en-US');
    dom.alt.textContent = text;
    dom.mAlt.textContent = text;
  }

  if (hudCache.spd !== speed) {
    hudCache.spd = speed;
    dom.spd.textContent = String(speed);
    dom.mSpd.textContent = String(speed);
  }

  if (hudCache.mach !== mach) {
    hudCache.mach = mach;
    dom.mach.textContent = `M ${mach.toFixed(2)}`;
  }

  if (hudCache.zone !== `${zone}|${zoneName}`) {
    hudCache.zone = `${zone}|${zoneName}`;
    dom.zone.textContent = zone;
    dom.zoneName.textContent = zoneName;
    dom.mZone.textContent = zone;
  }

  if (hudCache.clock !== `${clock}|${label}`) {
    hudCache.clock = `${clock}|${label}`;
    dom.clock.textContent = clock;
    dom.clockLabel.textContent = label;
    dom.mClock.textContent = clock;
  }

  if (hudCache.pct !== pct) {
    hudCache.pct = pct;
    dom.pct.textContent = pct < 10 ? `0${pct}` : String(pct);
    dom.railFill.style.height = `${pct}%`;
    dom.mFill.style.width = `${Math.max(2, pct)}%`;
  }

  const station = activeStationIndex(app.target);
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
  updateHud(world.getFlightPose(app.progress));
}

/* ========================================================================== */
/* 9. Audio + sound prompt                                                   */
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
  if (app.soundOn && chime && portfolio.sound.enableChime) {
    window.setTimeout(() => {
      try {
        audio.playChime();
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

let lastFocused = null;

function openSoundPrompt() {
  if (app.promptOpen) return;
  app.promptOpen = true;
  lastFocused = document.activeElement;
  dom.prompt.hidden = false;
  requestAnimationFrame(() => dom.prompt.classList.add('is-open'));
  document.documentElement.classList.add('is-locked');
  document.documentElement.classList.add('is-prompt');
  // The portfolio stays in the document but out of reach while the dialog owns
  // the screen: no tab stops behind the modal for pointer or screen reader.
  if ('inert' in HTMLElement.prototype) {
    dom.portfolio.inert = true;
    dom.railHud.inert = true;
    dom.topbar.inert = true;
  }
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
  document.documentElement.classList.remove('is-prompt');
  if ('inert' in HTMLElement.prototype) {
    dom.portfolio.inert = false;
    dom.railHud.inert = false;
    dom.topbar.inert = false;
  }
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

function ringChimeButton() {
  dom.chime.classList.remove('is-ringing');
  // restart the animation even on a quick second press
  void dom.chime.offsetWidth;
  dom.chime.classList.add('is-ringing');
  window.setTimeout(() => dom.chime.classList.remove('is-ringing'), 1000);
}

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

  dom.chime.addEventListener('click', () => {
    const state = audio.getState();
    if (!state.initialized || state.muted) {
      enableSound({ chime: false });
    }
    try {
      audio.playChime();
    } catch (error) {
      /* ignore */
    }
    ringChimeButton();
  });

  dom.logbook.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToStation(stations.length - 1);
    dom.logbook.blur();
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
      renderer.setPixelRatio(pixelRatio());
      renderer.setSize(width, height, false);
      if (world && world.setPixelRatio) world.setPixelRatio(renderer.getPixelRatio());
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      measureLayout();
      updateHudImmediate();
      if (ScrollTrigger && !reduceMotion) ScrollTrigger.refresh();
      syncSoundUi();
    }, 160);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTime = 0;
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
/* 10. Public debug handle (used by the verification harness)                */
/* ========================================================================== */

window.__aero = {
  app,
  portfolio,
  scene,
  camera,
  renderer,
  audio,
  quality,
  get world() {
    return world;
  },
  get rects() {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return {
        top: Math.round(r.top),
        left: Math.round(r.left),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    };
    return {
      topbar: rect(dom.topbar),
      brand: rect(document.querySelector('.brand')),
      sound: rect(dom.soundToggle),
      chime: rect(dom.chime),
      logbook: rect(dom.logbook),
      railHud: rect(dom.railHud),
      telemetry: rect(document.querySelector('.telemetry')),
      rail: rect(dom.railHud.querySelector('.rail__wrap')),
      pct: rect(dom.railHud.querySelector('.rail__pct')),
      bottom: rect(dom.bottom),
      card: rect(document.querySelector('.station.is-active .station__card') || document.querySelector('.station__card')),
      prompt: rect(dom.prompt.querySelector('.prompt__card')),
    };
  },
  anchors: () => app.anchors.map((anchor) => ({ ...anchor })),
  progress: () => app.progress,
  target: () => app.target,
  pose: () => app.lastPose,
  scrollToStation,
  measure: measureLayout,
  openSoundPrompt,
  closeSoundPrompt,
  isPromptOpen: () => app.promptOpen,
  setProgress: (p) => {
    app.progress = clamp01(p);
  },
};

boot().catch((error) => {
  // A boot failure must be visible in the UI rather than a silent black screen.
  console.error('[MERIDIAN] boot failed', error);
  if (dom.loaderStage) dom.loaderStage.textContent = 'The flight could not be prepared. Please reload.';
  document.documentElement.classList.remove('is-locked');
});
