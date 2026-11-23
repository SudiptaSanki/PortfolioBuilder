/**
 * main.js
 * ============================================================================
 * Boots the Research Lab portfolio: renderer, the procedural research campus
 * (src/scene/researchWorld.js), the procedural lab soundscape
 * (src/audio/researchAudio.js), the scroll → campus-progress mapping, the HUD,
 * the station rail, click-to-travel on the instruments, and the sound prompt.
 *
 * The world contract does the heavy lifting:
 *
 *   const pose = world.getResearchPose(progress)     // 0..1
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

import { createResearchWorld, RESEARCH_PHASES } from './scene/researchWorld.js';
import { createResearchAudio } from './audio/researchAudio.js';
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
  temp: document.getElementById('temp-value'),
  lock: document.getElementById('lock-value'),
  compute: document.getElementById('compute-value'),
  citations: document.getElementById('cites-value'),
  datasets: document.getElementById('datasets-value'),
  lamp: document.getElementById('lock-lamp'),
  pct: document.getElementById('pct-value'),
  mTemp: document.getElementById('m-temp'),
  mLock: document.getElementById('m-lock'),
  mCompute: document.getElementById('m-compute'),
  mCitations: document.getElementById('m-cites'),
  mFill: document.getElementById('m-fill'),
  bottom: document.getElementById('bottom-hud'),
  soundToggle: document.getElementById('sound-toggle'),
  soundLabel: document.getElementById('sound-label'),
  experimentToggle: document.getElementById('experiment-toggle'),
  laserToggle: document.getElementById('laser-toggle'),
  laserLabel: document.getElementById('laser-label'),
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
  dom.experimentToggle.setAttribute('aria-label', portfolio.hud.experimentAria);
  dom.laserToggle.setAttribute('aria-label', portfolio.hud.laserAria);
  dom.contact.setAttribute('aria-label', portfolio.hud.contactAria);
  dom.contact.href = mailtoHref(portfolio.contact.primary);

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

function publicationsHtml(station) {
  if (!station.publications || !station.publications.length) return '';
  const items = station.publications.slice(0, 3).map((paper) => `
    <li class="pub">
      <p class="pub__title">${escapeHtml(paper.title)}</p>
      <p class="pub__meta">${escapeHtml(paper.venue)} · ${escapeHtml(paper.year)} · <span class="pub__doi">doi ${escapeHtml(paper.doi)}</span></p>
    </li>
  `).join('');
  return `<div class="archive-pubs"><h3>Selected publications</h3><ul class="pub-list">${items}</ul></div>`;
}

function grantsHtml() {
  if (!portfolio.grants || !portfolio.grants.length) return '';
  const items = portfolio.grants.map((grant) => `
    <li class="grant">
      <span class="grant__funder">${escapeHtml(grant.funder)}</span>
      <span class="grant__title">${escapeHtml(grant.title)}</span>
      <span class="grant__meta">${escapeHtml(grant.period)} · ${escapeHtml(grant.amount)}</span>
    </li>
  `).join('');
  return `<details class="archive-fold archive-grants"><summary>Grants &amp; funding · ${portfolio.grants.length}</summary><ul class="grant-list">${items}</ul></details>`;
}

function membersHtml() {
  if (!portfolio.members || !portfolio.members.length) return '';
  const items = portfolio.members.map((member) => `
    <li><strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.role)}</span></li>
  `).join('');
  return `<details class="archive-fold members"><summary>The group · ${portfolio.members.length} core members</summary><ul class="member-list">${items}</ul></details>`;
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
      ${membersHtml()}
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

    const [, ...kickerRest] = station.kicker.split('·');
    const kickerTail = kickerRest.join('·').trim() || station.kicker;

    section.innerHTML = `
      <article class="station__card">
        <p class="station__kicker">
          <span class="station__no">${escapeHtml(station.no)}</span>
          <span>${escapeHtml(kickerTail)}</span>
        </p>
        <h2 class="station__title" id="${escapeHtml(station.id)}-title">${escapeHtml(station.title)}</h2>
        <p class="station__lede">${escapeHtml(station.lede)}</p>
        <p class="station__body">${escapeHtml(station.body)}</p>
        <dl class="station__facts">${station.facts.map(factHtml).join('')}</dl>
        <ul class="station__tags">${station.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>
        ${publicationsHtml(station)}
        ${station.id === 'archive' ? grantsHtml() : ''}
        ${station.id === 'archive' ? contactHtml() : ''}
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
renderer.toneMappingExposure = 1.04;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
// PCFSoftShadowMap was removed in three r187; PCF is the supported equivalent.
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0xd9dcd1, 1);

const scene = new THREE.Scene();
const initialAspect = viewport.width / viewport.height;
const camera = new THREE.PerspectiveCamera(initialAspect < 0.85 ? 72 : 54, initialAspect, 0.1, 9000);

let world = null;
let lastPose = null;

const audio = createResearchAudio({ volume: 0.8, muted: true });

/** Portrait screens need a wider vertical field of view than the pose suggests. */
function poseFov(pose) {
  const aspect = camera.aspect;
  const base = pose && Number.isFinite(pose.fov) ? pose.fov : 52;
  if (aspect < 0.75) return Math.min(82, base * 1.38);
  if (aspect < 1.0) return Math.min(76, base * 1.22);
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
  laser: false,
  experimentFlash: false,
  anchors: [{ y: 0, p: stations[0].progress }],
  maxScroll: 1,
  activeStation: 0,
};

const hudCache = { temp: null, lock: null, compute: null, citations: null, datasets: null, pct: null, station: -1 };

function setLoader(pct, stage) {
  if (dom.loaderFill) dom.loaderFill.style.width = `${clamp(pct, 2, 100)}%`;
  if (stage && dom.loaderStage) dom.loaderStage.textContent = stage;
}

async function boot() {
  applyConfigCopy();
  buildStations();
  buildRail();

  setLoader(8, 'Opening the research campus…');
  await nextFrame();

  setLoader(24, 'Glazing the south wall…');
  await nextFrame();
  await sleep(40);

  const buildStart = performance.now();
  try {
    world = createResearchWorld(scene, {
      quality,
      seed: 20261120,
      shadows: quality !== 'low',
      aspect: initialAspect,
      publications: (stations.find((station) => station.id === 'archive') || {}).publications || [],
    });
  } catch (error) {
    console.error('[RESEARCH LAB] world build failed', error);
    throw error;
  }
  const buildMs = Math.round(performance.now() - buildStart);

  setLoader(58, 'Cooling the dilution stage…');
  await nextFrame();

  world.setViewport(camera.aspect);
  world.setLaserAlignment(app.laser);

  setLoader(76, 'Waking the blade cluster…');
  measureLayout();
  updateHudImmediate();
  syncControls();
  syncSoundUi();

  // Compile the scene once behind the preloader so the first visible frame is
  // already warm (the first WebGL frame is by far the most expensive).
  const firstPose = world.getResearchPose(app.progress);
  applyPose(firstPose);
  lastPose = firstPose;
  world.update(0, 0.016, app.progress, camera);
  renderer.render(scene, camera);

  setLoader(92, 'Rolling the dome back…');
  await nextFrame();
  await nextFrame();

  startLoop();
  bindEvents();
  setupScrollMotion();

  setLoader(100, 'Ready — the campus is live.');
  await sleep(520);

  dom.loader.classList.add('is-out');
  await sleep(560);
  dom.loader.hidden = true;

  app.ready = true;
  window.__researchReady = true;

  await sleep(160);
  openSoundPrompt();

  window.__research.debug = {
    buildMs,
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    programs: renderer.info.programs ? renderer.info.programs.length : 0,
    phasing: RESEARCH_PHASES.length,
  };
  if (typeof console !== 'undefined' && console.info) {
    console.info(
      `[RESEARCH LAB] world ready in ${buildMs} ms · quality ${quality} · ` +
        `${renderer.info.render.calls} draw calls · ${RESEARCH_PHASES.length} stations`
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

  const hudTop = 96;
  const hudBottom = 112;

  sections.forEach((section, index) => {
    const top = section.getBoundingClientRect().top + scrollY;
    const card = section.querySelector('.station__card');
    let y = top + Math.max(0, (section.offsetHeight - vh) / 2);

    if (card) {
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

  window.setTimeout(() => {
    app.introDone = true;
  }, 760);

  if (reduceMotion) {
    app.introDone = true;
    if (ScrollTrigger) ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    return;
  }

  gsap.registerPlugin?.(ScrollTrigger);

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

    const scrollY = window.scrollY || window.pageYOffset || 0;
    app.target = progressAtScroll(scrollY);
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt / 0.17);
    app.progress += (app.target - app.progress) * k;
    if (Math.abs(app.target - app.progress) < 0.00005) app.progress = app.target;
    app.progress = clamp01(app.progress);

    const pose = world.getResearchPose(app.progress);
    applyPose(pose);
    lastPose = pose;
    world.update(elapsed, dt, app.progress, camera);
    if (!captureMode) renderer.render(scene, camera);

    if (now - lastAudioAt > 70) {
      lastAudioAt = now;
      try {
        audio.update(app.progress, pose.temperatureMk, pose.laserLockPct, app.experimentFlash, world.getLaserAlignment());
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
  const temp = pose.temperatureMk.toFixed(1);
  const lock = pose.laserLockPct.toFixed(1);
  const compute = pose.computePf.toFixed(1);
  const citations = numberFormat.format(pose.citations);
  const datasets = numberFormat.format(pose.datasets);
  const pct = Math.round(app.progress * 100);

  if (hudCache.temp !== temp) {
    hudCache.temp = temp;
    dom.temp.textContent = temp;
    dom.mTemp.textContent = temp;
  }

  if (hudCache.lock !== lock) {
    hudCache.lock = lock;
    dom.lock.textContent = lock;
    dom.mLock.textContent = lock;
    dom.lamp.dataset.tone = pose.laserLockPct < 97 ? 'amber' : 'green';
  }

  if (hudCache.compute !== compute) {
    hudCache.compute = compute;
    dom.compute.textContent = compute;
    dom.mCompute.textContent = compute;
  }

  if (hudCache.citations !== citations) {
    hudCache.citations = citations;
    dom.citations.textContent = citations;
    dom.mCitations.textContent = citations;
  }

  if (hudCache.datasets !== datasets) {
    hudCache.datasets = datasets;
    dom.datasets.textContent = datasets;
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
  updateHud(world.getResearchPose(app.progress));
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
  const pose = world.getResearchPose(p);
  applyPose(pose);
  lastPose = pose;
  world.update(elapsed, 1 / 60, p, camera);
  renderer.render(scene, camera);
  updateHud(pose);
  return {
    progress: p,
    temperatureMk: pose.temperatureMk,
    laserLockPct: pose.laserLockPct,
    computePf: pose.computePf,
    citations: pose.citations,
    datasets: pose.datasets,
    timeOfDay: pose.timeOfDay,
    phaseId: pose.phaseId,
    phaseName: pose.phaseName,
    station: pose.station,
    cameraFov: Math.round(camera.fov * 10) / 10,
    laserAligned: world.getLaserAlignment(),
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    programs: renderer.info.programs ? renderer.info.programs.length : 0,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries,
    frame: renderer.info.render.frame,
  };
}

/* ========================================================================== */
/* 10. Controls: sound, experiment pulse, laser alignment                    */
/* ========================================================================== */

function syncSoundUi() {
  const on = app.soundOn && !audio.isMuted();
  dom.soundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  dom.soundLabel.textContent = isNarrow
    ? portfolio.sound.pillOn.replace(/\s(On|Off)$/, '')
    : on
      ? portfolio.sound.pillOn
      : portfolio.sound.pillOff;
  dom.soundToggle.setAttribute(
    'aria-label',
    `${portfolio.hud.soundAria} — ${on ? 'currently on' : 'currently muted'}`
  );
}

function syncControls() {
  dom.laserToggle.setAttribute('aria-pressed', app.laser ? 'true' : 'false');
  dom.laserLabel.textContent = app.laser ? portfolio.hud.laserOn : portfolio.hud.laserOff;
  dom.laserToggle.setAttribute(
    'aria-label',
    `${portfolio.hud.laserAria} — ${app.laser ? 'beam folded through the mirror train' : 'beam running direct'}`
  );
}

function triggerExperiment({ chime = true } = {}) {
  let fired = false;
  try {
    fired = world ? world.triggerExperiment() : false;
  } catch (error) {
    fired = false;
  }
  app.experimentFlash = true;
  dom.experimentToggle.classList.add('is-firing');
  window.setTimeout(() => {
    app.experimentFlash = false;
    dom.experimentToggle.classList.remove('is-firing');
  }, 1500);

  if (chime) {
    try {
      if (audio.getState().initialized) audio.playExperimentChime();
    } catch (error) {
      /* the pulse is visual; the cue is a bonus */
    }
  }
  return fired;
}

function setLaser(enabled, { chime = true } = {}) {
  app.laser = Boolean(enabled);
  if (world) world.setLaserAlignment(app.laser);
  syncControls();
  if (chime) {
    try {
      if (audio.getState().initialized) audio.playLaserChime();
    } catch (error) {
      /* ignore */
    }
  }
  return app.laser;
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
        audio.playExperimentChime();
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

  dom.experimentToggle.addEventListener('click', () => {
    triggerExperiment();
    dom.experimentToggle.blur();
  });

  dom.laserToggle.addEventListener('click', () => {
    setLaser(!app.laser);
    dom.laserToggle.blur();
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

  /* ---- click / tap a 3D instrument to travel there -------------------- */
  let pointerDown = null;
  let hoverAt = 0;

  const ndcFromEvent = (event) => {
    const rect = dom.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    return { x, y };
  };

  dom.canvas.addEventListener('pointerdown', (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
  });

  dom.canvas.addEventListener('pointerup', (event) => {
    if (!pointerDown || !world) return;
    const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (moved > 8) return;
    const ndc = ndcFromEvent(event);
    const hit = world.pickStation(ndc.x, ndc.y);
    if (hit && typeof hit.index === 'number') {
      if (hit.index === app.activeStation) {
        // clicking the instrument you are standing at runs it
        triggerExperiment();
      } else {
        scrollToStation(hit.index);
      }
      try { if (audio.getState().initialized) audio.playClick(); } catch (error) { /* ignore */ }
    }
  });

  dom.canvas.addEventListener('pointermove', (event) => {
    if (!world || event.pointerType === 'touch') return;
    const now = performance.now();
    if (now - hoverAt < 140) return;
    hoverAt = now;
    const ndc = ndcFromEvent(event);
    const hit = world.pickStation(ndc.x, ndc.y);
    dom.canvas.style.cursor = hit ? 'pointer' : '';
  });

  dom.canvas.addEventListener('pointerleave', () => {
    dom.canvas.style.cursor = '';
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      if (world) world.setViewport(camera.aspect);
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

window.__research = {
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
      experiment: rect(dom.experimentToggle),
      laser: rect(dom.laserToggle),
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
  setLaser,
  toggleLaser: () => setLaser(!app.laser),
  laserOn: () => app.laser,
  triggerExperiment,
  pickStation: (x, y) => (world ? world.pickStation(x, y) : null),
};

boot().catch((error) => {
  // A boot failure must be visible in the UI rather than a silent black screen.
  console.error('[RESEARCH LAB] boot failed', error);
  if (dom.loaderStage) dom.loaderStage.textContent = 'The research campus could not be prepared. Please reload.';
  document.documentElement.classList.remove('is-locked');
});
