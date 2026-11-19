// main.js — Station 03: interactive server-room tour.
// Boots the renderer, builds the hall, then wires the camera rig, raycast
// picking (racks + in-row CDU), the machine inspector, the six-stop tour
// and the synthesised server-room audio.
//
// Deep links used by the screenshot harness (all deterministic):
//   ?stop=1..6      open a tour stop immediately
//   ?machine=A04    frame a machine and open its inspector
//   ?instant=1      no camera glide, no idle drift
//   ?mute=1         start with the audio bar dismissed (state 'closed')

import * as THREE from 'three';
import { LAYOUT, RACK, allAnchors } from './config/world.js';
import { STOPS, MACHINES } from './config/portfolio.js';
import { createDatacentre } from './scene/datacentre.js';
import { createSelection } from './scene/selection.js';
import { createRig } from './camera/rig.js';
import { createHUD } from './ui/hud.js';
import { ServerRoomAudio } from './audio/serverRoomAudio.js';

const params = new URLSearchParams(location.search);
const instant = params.get('instant') === '1';
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// ------------------------------------------------------------- renderer ---
const container = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9edf0);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 80);

const dc = createDatacentre(scene);
scene.add(dc.group);

const anchors = allAnchors();
const rackGroups = [];
anchors.forEach((a) => {
  const g = scene.getObjectByName(`rack-${a.code}`);
  if (g) rackGroups.push(g);
});
const cduGroup = scene.getObjectByName('cdu');
const selection = createSelection(scene, { rackGroups, cduGroup });

// --------------------------------------------------------------- camera ---
const rig = createRig(camera, { reduced: false });
rig.setStill(instant);

function poseForMachine(id) {
  if (id === 'CDU-01') {
    return { pos: [3.5, 1.55, -1.62], tgt: [3.6, 1.02, 0.8] };
  }
  const a = anchors.find((x) => x.code === id);
  if (!a) return STOPS[0].pose;
  const frontZ = a.row === 'A' ? LAYOUT.rowZ - RACK.depth / 2 : -(LAYOUT.rowZ - RACK.depth / 2);
  const dir = a.row === 'A' ? -1 : 1;
  // Stand in the aisle a little to the door-hinge side of the cabinet: the
  // whole unit fits at 62°, the neighbour stays behind the camera and the
  // open door swings away. The 1.2 m aisle rules out a square-on shot.
  const dx = a.row === 'A' ? 0.9 : -0.9;
  return {
    pos: [a.x + dx, 1.52, frontZ + 1.05 * dir],
    tgt: [a.x, 1.02, frontZ - 0.55 * dir],
  };
}

// ---------------------------------------------------------------- audio ---
const audio = new ServerRoomAudio();
let audioChoiceMade = false;
let audioAutoHide = 0;

// ------------------------------------------------------------------ HUD ---
let currentStop = 0;
let selectedId = null;

const hud = createHUD({
  onGoStop: (i) => goStop(i),
  onReturn: () => returnToTour(),
});

function setDoor(group, target, dur = 0.9) {
  const pivot = group?.userData?.doorPivot;
  if (!pivot) return;
  group.userData.doorAnim = { from: pivot.rotation.y, to: target, t0: performance.now(), dur };
}

function closeAllDoors() {
  rackGroups.forEach((g) => setDoor(g, 0, 0.7));
  if (cduGroup) setDoor(cduGroup, 0, 0.7);
}

function clearSelection() {
  selectedId = null;
  selection.set('none');
  closeAllDoors();
}

function goStop(i, { immediate = false, silent = false } = {}) {
  const idx = Math.max(0, Math.min(STOPS.length - 1, i));
  currentStop = idx;
  hud.setStop(idx, { immediate: immediate || instant });
  rig.setFov(baseFov());
  rig.setPose(STOPS[idx].pose, { immediate: immediate || instant });
  if (selectedId) {
    selectedId = null;
    selection.set('none');
    hud.closeMachine();
    closeAllDoors();
  }
  if (!silent) audio.chime();
}

function openMachine(id, { immediate = false } = {}) {
  if (!MACHINES[id]) return false;
  selectedId = id;
  selection.set('selected', id);
  rackGroups.forEach((g) => setDoor(g, g.userData.anchor.code === id ? 1.2 : 0));
  if (cduGroup) setDoor(cduGroup, 0);
  rig.setPose(poseForMachine(id), { immediate: immediate || instant });
  rig.setFov(baseFov() + 7);
  hud.openMachine(id, { immediate: immediate || instant });
  audio.click(1);
  return true;
}

function returnToTour() {
  clearSelection();
  hud.closeMachine();
  rig.setFov(baseFov());
  rig.setPose(STOPS[currentStop].pose, { immediate: instant });
  audio.click(0.45);
}

// ------------------------------------------------------------- raycasting ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredId = null;
let pointerDown = null;

function pickAt(clientX, clientY) {
  camera.updateMatrixWorld(true);
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(selection.proxies, false);
  return hits.length ? hits[0].object.userData.machineId : null;
}

function pick(ev) {
  return pickAt(ev.clientX, ev.clientY);
}

function setHover(id) {
  if (hoveredId === id) return;
  hoveredId = id;
  renderer.domElement.style.cursor = id ? 'pointer' : 'default';
  if (!selectedId) selection.set(id ? 'hover' : 'none', id);
  else if (id && id !== selectedId) selection.set('hover', id);
}

renderer.domElement.addEventListener('pointermove', (ev) => {
  if (ev.pointerType === 'touch') return;
  setHover(pick(ev));
});

renderer.domElement.addEventListener('pointerleave', () => setHover(null));

renderer.domElement.addEventListener('pointerdown', (ev) => {
  pointerDown = { x: ev.clientX, y: ev.clientY, t: performance.now() };
});

const tapLog = [];
function handleTap(x, y, source) {
  const rec = { source, x: Math.round(x), y: Math.round(y), hadDown: !!pointerDown };
  tapLog.push(rec);
  if (tapLog.length > 8) tapLog.shift();
  if (!pointerDown) return;
  const moved = Math.hypot(x - pointerDown.x, y - pointerDown.y);
  pointerDown = null;
  rec.moved = +moved.toFixed(1);
  if (moved > 14) return;                 // a drag, not a tap
  const id = pickAt(x, y);
  rec.id = id;
  if (id) openMachine(id);
  else if (selectedId) returnToTour();
}

renderer.domElement.addEventListener('touchstart', (ev) => {
  const t = ev.changedTouches[0];
  if (!t) return;
  pointerDown = { x: t.clientX, y: t.clientY, t: performance.now() };
}, { passive: true });

renderer.domElement.addEventListener('touchend', (ev) => {
  const t = ev.changedTouches[0];
  if (t) handleTap(t.clientX, t.clientY, 'touchend');
}, { passive: true });

renderer.domElement.addEventListener('pointerup', (ev) => {
  if (ev.pointerType === 'touch') return;
  handleTap(ev.clientX, ev.clientY, ev.pointerType || 'pointerup');
});

// ------------------------------------------------------------------- audio ---
const bar = document.getElementById('sound-bar');

async function powerOn() {
  const state = await audio.start();
  hud.soundUI.setState(state);
  audioChoiceMade = true;
  if (state === 'running') {
    setTimeout(() => audio.chime(), 420);
    clearTimeout(audioAutoHide);
    audioAutoHide = setTimeout(() => {
      if (audio.getState() === 'running') hud.soundUI.hide();
    }, 8000);
  }
  return state;
}

function stayMuted() {
  audio.mute();
  audioChoiceMade = true;
  clearTimeout(audioAutoHide);
  hud.soundUI.hide();
  hud.soundUI.setState('closed');
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

document.getElementById('audio-on').addEventListener('click', powerOn);
document.getElementById('audio-mute').addEventListener('click', stayMuted);
document.getElementById('audio-close').addEventListener('click', stayMuted);
document.getElementById('audio-toggle').addEventListener('click', () => {
  hud.soundUI.show();
  hud.soundUI.setState(audio.getState() === 'closed' ? 'idle' : audio.getState());
  powerOn();
});

if (params.get('mute') === '1') {
  stayMuted();
}

// -------------------------------------------------------------- keyboard ---
function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

window.addEventListener('keydown', (e) => {
  if (isTypingTarget(e.target)) return;
  const inspectorOpen = !document.getElementById('inspector').hidden;
  if (e.key === 'Escape') {
    if (inspectorOpen) { e.preventDefault(); returnToTour(); }
    else if (!bar.hidden) { e.preventDefault(); stayMuted(); }
    return;
  }
  if (e.key === 'Enter' && !bar.hidden && !(e.target instanceof HTMLButtonElement)) {
    e.preventDefault();
    powerOn();
    return;
  }
  if (e.key === 'ArrowRight') { e.preventDefault(); if (currentStop < STOPS.length - 1) goStop(currentStop + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); if (currentStop > 0) goStop(currentStop - 1); }
  if (/^[1-6]$/.test(e.key) && !inspectorOpen) goStop(Number(e.key) - 1);
});

// ------------------------------------------------------------ wheel nav ---
// A trackpad/wheel flick walks the tour one stop at a time, so the page
// scrolls the way the rail reads. Panels keep their own scrolling.
let wheelLock = 0;
let wheelLast = 0;
window.addEventListener('wheel', (ev) => {
  if (ev.target instanceof Element && ev.target.closest('.stop, .inspector, .rail')) return;
  if (Math.abs(ev.deltaY) < 10) return;
  const now = performance.now();
  const sameGesture = now - wheelLast < 420;   // trackpads fire a stream of events
  wheelLast = now;
  if (sameGesture || now - wheelLock < 950) return;
  wheelLock = now;
  if (ev.deltaY > 0 && currentStop < STOPS.length - 1) goStop(currentStop + 1);
  else if (ev.deltaY < 0 && currentStop > 0) goStop(currentStop - 1);
}, { passive: true });

// ------------------------------------------------------------- responsive ---
function baseFov() {
  return window.innerWidth / window.innerHeight < 1 ? 68 : 55;
}

function projFactor() {
  return window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  if (document.getElementById('inspector').hidden) rig.setFov(baseFov(), 0.2);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  dc.setProjFactor(projFactor() * renderer.getPixelRatio());
}
window.addEventListener('resize', onResize);
dc.setProjFactor(projFactor() * renderer.getPixelRatio());

// ------------------------------------------------------- reduced motion ---
function applyReduced() {
  const reduced = reduceQuery.matches;
  rig.setReduced(reduced);
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
}
applyReduced();
reduceQuery.addEventListener?.('change', applyReduced);

// ------------------------------------------------------------------ loop ---
const clock = new THREE.Clock();
let frames = 0;
let last = performance.now();
renderer.setAnimationLoop(() => {
  const dt = Math.min(0.05, (performance.now() - last) / 1000 || 0.016);
  last = performance.now();
  const t = clock.getElapsedTime();

  rig.update(performance.now());
  dc.update(t);

  // doors ease toward their target angle on wall-clock time, so a slow
  // frame rate can never leave a door half-open
  const nowMs = performance.now();
  rackGroups.forEach((g) => {
    const pivot = g.userData.doorPivot;
    const anim = g.userData.doorAnim;
    if (!pivot || !anim) return;
    const k = Math.min(1, (nowMs - anim.t0) / (anim.dur * 1000));
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    pivot.rotation.y = anim.from + (anim.to - anim.from) * e;
    if (k >= 1) g.userData.doorAnim = null;
  });

  selection.update(t, dt);
  audio.setListener(camera.position.x, camera.position.z);

  renderer.render(scene, camera);
  frames++;
  if (frames === 3) {
    window.__rendered = true;
    window.__sr.ready = true;
  }
});

// ----------------------------------------------------------- deep links ---
function stopFromParam(v) {
  if (!v) return 0;
  const byId = STOPS.findIndex((s) => s.id === v);
  if (byId >= 0) return byId;
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1 && n <= STOPS.length) return n - 1;
  return 0;
}

const startStop = stopFromParam(params.get('stop') || params.get('view'));
goStop(startStop, { immediate: true, silent: true });
if (params.get('machine')) {
  openMachine(params.get('machine').toUpperCase(), { immediate: true });
}

// ------------------------------------------------------------ debug API ---
window.__sr = {
  ready: false,
  version: '3.0.0',
  stops: STOPS,
  machines: MACHINES,
  get stopIndex() { return currentStop; },
  get selected() { return selectedId; },
  get hovered() { return hoveredId; },
  goStop,
  openMachine,
  closeMachine: () => returnToTour(),
  setPose: (pos, tgt) => rig.setPose({ pos, tgt }, { immediate: true }),
  audio,
  hud,
  rig,
  camera,
  renderer,
  scene,
  rects: () => hud.rects(),
  project: (x, y, z) => {
    camera.updateMatrixWorld(true);
    const v = new THREE.Vector3(x, y, z).project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
      z: v.z,
    };
  },
  pickAt,
  tapLog: () => tapLog,
  rackTargets: () => {
    camera.updateMatrixWorld(true);
    return rackGroups.map((g) => {
    const a = g.userData.anchor;
    const front = a.row === 'A' ? LAYOUT.rowZ - RACK.depth / 2 : -(LAYOUT.rowZ - RACK.depth / 2);
    const p = new THREE.Vector3(a.x, 1.15, front).project(camera);
    return {
      code: a.code,
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
    };
    });
  },
  doorAngle: (id) => {
    const g = rackGroups.find((r) => r.userData.anchor.code === id);
    return g?.userData?.doorPivot?.rotation.y ?? 0;
  },
  audioBar: () => ({
    hidden: bar.hidden,
    state: audio.getState(),
    text: bar.innerText.replace(/\s+/g, ' ').trim(),
  }),
  get reduced() { return reduceQuery.matches; },
  stats: () => ({
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    programs: renderer.info.programs ? renderer.info.programs.length : 0,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries,
  }),
};
