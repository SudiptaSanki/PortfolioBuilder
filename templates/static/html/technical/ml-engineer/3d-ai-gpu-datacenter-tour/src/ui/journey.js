// journey.js — the scroll-driven camera flight, drag look-around,
// clickable machine zones and caption-card driver for Station 03.
//
// The flight is a keyframe track that never leaves the room: the four
// original ?view= poses are keyframes verbatim, joined by transit keys
// that stay inside the cold-aisle corridor (camera height 1.2–2.2 m).
// The camera walks the aisle west→east, turns at the east end (the
// aisle pose), walks back, and only then climbs — from a launch key at
// the west end of the aisle, on a straight line threaded under the
// containment roof rail and over the west racks, up to the verified
// top pose. It returns by the same line and comes to rest on the hero
// framing. Native scroll only — no scroll libraries. The camera
// follows a damped scalar progress value, so it can lag but never
// overshoot the track into a rack.

import * as THREE from 'three';
import { LAYOUT, RACK, PALETTE, allAnchors } from '../config/world.js';
import { ZONES } from './content.js';

// pos/tgt in metres (world contract). `stop` indexes STOPS in content.js.
// `w` is the scroll weight of the segment FROM this key to the next.
const KEYS = [
  { pos: [-2.02, 1.62, 0.0], tgt: [2.2, 1.02, 0.0], stop: 0, w: 1.0 }, // hero (?view=hero)
  { pos: [-0.62, 1.5, -0.3], tgt: [0.35, 1.0, 0.62], stop: 1, w: 0.95 }, // racks (?view=racks)
  { pos: [0.55, 1.5, 0.05], tgt: [-0.75, 2.66, 1.2], stop: 2, w: 0.8 }, // in-aisle, tilt up to the fibre trays
  { pos: [1.15, 1.45, -0.05], tgt: [0.1, 2.58, -1.2], stop: 3, w: 0.5 }, // in-aisle, levelled tilt to the coolant mains over row B (mirrors stop 2's balance: racks low, both mains crossing high, ceiling a band)
  { pos: [2.18, 1.95, 0.0], tgt: [-2.4, 0.92, 0.0], w: 0.7 }, // aisle (?view=aisle) — the turn at the east end
  { pos: [-0.9, 1.85, -0.05], tgt: [-2.3, 1.8, -0.2], w: 0.45 }, // walk back west through the aisle
  { pos: [-2.1, 2.06, -0.32], tgt: [-0.6, 1.15, -0.5], w: 0.8 }, // launch: west end of the aisle
  { pos: [-2.55, 2.88, -2.4], tgt: [0.9, 0.55, 0.55], stop: 4, w: 0.85 }, // top (?view=top)
  { pos: [-2.1, 2.06, -0.32], tgt: [0.4, 1.0, 0.15], w: 0.4 }, // back down the same line into the aisle
  { pos: [-2.02, 1.62, 0.0], tgt: [2.2, 1.02, 0.0], stop: 5, w: 0.5 }, // hero framing, to rest
  { pos: [-2.02, 1.62, 0.0], tgt: [2.2, 1.02, 0.0], w: 0 }, // hold while the content scrolls over
];

const VIEW_KEYS = { hero: 0, racks: 1, aisle: 4, top: 7 };

const TOTAL_W = KEYS.reduce((s, k) => s + k.w, 0);
const CUM = [0];
for (const k of KEYS) CUM.push(CUM[CUM.length - 1] + k.w / TOTAL_W);

// Caption-card dwell: each stop's card holds full opacity while the
// flight is within (CARD_WINDOW - CARD_FADE) of the stop's anchor
// progress, fades across CARD_FADE at the window's edges, and is gone
// beyond CARD_WINDOW. At the journey's 580vh of scroll that is roughly
// ±26vh of full-opacity reading time per stop.
const STOP_ANCHORS = KEYS
  .map((k, i) => ({ stop: k.stop, anchor: CUM[i] }))
  .filter((x) => x.stop != null);
const CARD_WINDOW = 0.068;
const CARD_FADE = 0.024;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (u) => u * u * (3 - 2 * u);

export function createJourney({ camera, scene, ui, reducedMotion }) {
  const stage = document.getElementById('stage');
  const journeyEl = document.getElementById('journey');

  let scrollLen = 1;
  function measure() {
    scrollLen = Math.max(1, journeyEl.offsetHeight - window.innerHeight);
  }
  measure();
  window.addEventListener('resize', measure);

  // ------------------------------------------------------------ state ---
  let prog = 0; // damped progress actually flown
  let targetProg = 0;
  let yawT = 0, pitchT = 0; // drag-look targets (rad)
  let yaw = 0, pitch = 0; // damped drag-look offsets
  let selected = null;

  // -------------------------------------------------------- highlight ---
  const hlFill = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: PALETTE.coolantSupply, transparent: true, opacity: 0.14, depthWrite: false,
    }),
  );
  const hlEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    new THREE.LineBasicMaterial({ color: PALETTE.coolantSupply, transparent: true, opacity: 0.85 }),
  );
  const highlight = new THREE.Group();
  highlight.add(hlFill, hlEdge);
  highlight.visible = false;
  scene.add(highlight);

  // ----------------------------------------------------- click proxies --
  const proxyMat = new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false, colorWrite: false,
  });
  const proxies = [];
  function addZone(data, cx, cy, cz, sx, sy, sz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), proxyMat);
    m.position.set(cx, cy, cz);
    m.userData.zone = {
      data,
      centre: new THREE.Vector3(cx, cy, cz),
      size: new THREE.Vector3(sx, sy, sz),
    };
    proxies.push(m);
    scene.add(m);
  }
  for (const a of allAnchors()) {
    addZone(
      a.hero ? ZONES.dgx(a.code) : ZONES.gb200(a.code),
      a.x, RACK.height / 2, a.z, 0.64, RACK.height + 0.02, 1.24,
    );
    if (a.hero) {
      addZone(
        ZONES.manifold(a.code),
        a.x, 1.05, a.z + a.facing * (RACK.depth / 2 + 0.07), 0.52, 1.95, 0.16,
      );
    }
  }
  addZone(ZONES.cdu(), LAYOUT.cdu.x, 1.07, LAYOUT.cdu.z, 0.95, 2.15, 0.9);
  for (const s of [1, -1]) {
    addZone(ZONES.busway(), 0, 2.3, s * LAYOUT.rowZ, 5.2, 0.24, 0.3);
    addZone(ZONES.trays(), 0, 2.62, s * LAYOUT.rowZ, 6.4, 0.34, 0.42);
  }

  // --------------------------------------------------------- info panel -
  function openPanel(zone) {
    selected = zone;
    ui.panelName.textContent = zone.data.name;
    ui.panelLines.replaceChildren(
      ...zone.data.lines.map((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        return li;
      }),
    );
    ui.panel.classList.add('open');
    ui.panel.setAttribute('aria-hidden', 'false');
    highlight.position.copy(zone.centre);
    highlight.scale.copy(zone.size).addScalar(0.05);
    highlight.visible = true;
  }
  function closePanel() {
    selected = null;
    ui.panel.classList.remove('open');
    ui.panel.setAttribute('aria-hidden', 'true');
    highlight.visible = false;
  }
  ui.panelClose.addEventListener('click', closePanel);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

  // ---------------------------------------------- drag look + tap select -
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pDown = null;
  let dragging = false;

  stage.addEventListener('pointerdown', (e) => {
    pDown = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, id: e.pointerId };
    dragging = false;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pDown || e.pointerId !== pDown.id) return;
    const dx = e.clientX - pDown.x;
    const dy = e.clientY - pDown.y;
    const mx = e.clientX - pDown.lx;
    const my = e.clientY - pDown.ly;
    pDown.lx = e.clientX;
    pDown.ly = e.clientY;
    if (!dragging && Math.hypot(dx, dy) < 5) return;
    if (!dragging) { dragging = true; ui.hintDrag.classList.add('done'); }
    // grab-the-world: pull right to look left, pull down to look down
    yawT = clamp(yawT + mx * 0.003, -1.05, 1.05);
    pitchT = clamp(pitchT - my * 0.0028, -0.55, 0.5);
    stage.classList.add('dragging');
  });
  function endPointer(e) {
    if (!pDown || e.pointerId !== pDown.id) return;
    const wasDrag = dragging;
    pDown = null;
    dragging = false;
    stage.classList.remove('dragging');
    if (wasDrag) return;
    // tap / click → raycast select
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(proxies, false)[0];
    if (hit) openPanel(hit.object.userData.zone);
    else closePanel();
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', () => {
    pDown = null;
    dragging = false;
    stage.classList.remove('dragging');
  });

  // ------------------------------------------------------------- track --
  const _pa = new THREE.Vector3(), _pb = new THREE.Vector3();
  const _ta = new THREE.Vector3(), _tb = new THREE.Vector3();
  const _pos = new THREE.Vector3(), _tgt = new THREE.Vector3();
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion(), _qOff = new THREE.Quaternion();
  const _e = new THREE.Euler(0, 0, 0, 'YXZ');
  const UP = new THREE.Vector3(0, 1, 0);

  function evaluate(p) {
    let i = 0;
    while (i < KEYS.length - 2 && p > CUM[i + 1]) i++;
    const span = CUM[i + 1] - CUM[i] || 1;
    const u = smooth(clamp((p - CUM[i]) / span, 0, 1));
    _pa.fromArray(KEYS[i].pos); _pb.fromArray(KEYS[i + 1].pos);
    _ta.fromArray(KEYS[i].tgt); _tb.fromArray(KEYS[i + 1].tgt);
    _pos.lerpVectors(_pa, _pb, u);
    _tgt.lerpVectors(_ta, _tb, u);
  }

  function setView(name) {
    const idx = VIEW_KEYS[name];
    if (idx == null) return;
    measure();
    targetProg = prog = CUM[idx];
    window.scrollTo(0, targetProg * scrollLen);
  }

  let ready = false;

  function update(dt, t) {
    // scroll → target progress
    targetProg = clamp(window.scrollY / scrollLen, 0, 1);
    if (window.scrollY > 30) ui.hintScroll.classList.add('done');

    // overall page progress bar
    const docLen = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    ui.progressBar.style.transform = `scaleX(${clamp(window.scrollY / docLen, 0, 1)})`;

    // Once the scroll passes the end of the journey spacer, the
    // document sections own the viewport: journey chrome (hint pills,
    // caption cards) must not leak over them.
    const pastJourney = window.scrollY > scrollLen + 1;
    ui.hintScroll.classList.toggle('suppressed', pastJourney);
    ui.hintDrag.classList.toggle('suppressed', pastJourney);
    // an open machine panel belongs to the tour — close it (same path
    // as the ✕) rather than letting it float over the sections
    if (pastJourney && selected) closePanel();

    // damped flight (reduced motion: jump straight to the pose)
    if (reducedMotion) prog = targetProg;
    else prog += (targetProg - prog) * (1 - Math.exp(-dt * 3.8));
    if (Math.abs(targetProg - prog) < 0.00005) prog = targetProg;

    // damped look offsets
    const k = 1 - Math.exp(-dt * 10);
    yaw += (yawT - yaw) * k;
    pitch += (pitchT - pitch) * k;

    evaluate(prog);
    if (!reducedMotion) {
      // the base scene's gentle idle drift, kept tiny
      _pos.x += Math.sin(t * 0.11) * 0.03;
      _pos.y += Math.sin(t * 0.09 + 1.3) * 0.02;
      _pos.z += Math.cos(t * 0.07) * 0.025;
      _tgt.y += Math.sin(t * 0.05 + 0.6) * 0.015;
    }
    camera.position.copy(_pos);
    _m.lookAt(_pos, _tgt, UP);
    _q.setFromRotationMatrix(_m);
    _e.set(pitch, yaw, 0);
    _qOff.setFromEuler(_e);
    camera.quaternion.copy(_q).multiply(_qOff); // look offset in camera space

    // caption cards: only the stop nearest the current progress can
    // show, dwelling at full opacity across its window (see
    // STOP_ANCHORS) — two cards never overlap, and past the journey no
    // card can be active at all. window.__activeStop mirrors the
    // visible stop (or -1) as a testing hook.
    let nearestStop = null;
    if (!pastJourney) {
      let bestD = Infinity;
      for (const { stop, anchor } of STOP_ANCHORS) {
        const d = Math.abs(prog - anchor);
        if (d < bestD) { bestD = d; nearestStop = stop; }
      }
    }
    let activeStop = -1;
    for (const { stop, anchor } of STOP_ANCHORS) {
      const card = ui.cards[stop];
      const o = stop === nearestStop
        ? smooth(clamp((CARD_WINDOW - Math.abs(prog - anchor)) / CARD_FADE, 0, 1))
        : 0;
      card.style.opacity = o.toFixed(3);
      card.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`;
      card.style.visibility = o <= 0.002 ? 'hidden' : 'visible';
      card.classList.toggle('active', o > 0.5);
      if (o > 0.5) activeStop = stop;
    }
    window.__activeStop = activeStop;

    // selected-machine highlight pulse
    if (highlight.visible) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
      hlFill.material.opacity = 0.1 + 0.07 * pulse;
      hlEdge.material.opacity = 0.6 + 0.35 * pulse;
    }

    if (!ready) { ready = true; window.__scrollReady = true; }
  }

  return { update, setView };
}
