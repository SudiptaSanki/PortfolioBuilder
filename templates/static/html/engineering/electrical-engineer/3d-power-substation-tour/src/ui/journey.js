// journey.js — the scroll-driven camera flight, drag look-around,
// clickable equipment zones and caption-card driver for Station 02.
//
// The flight is a keyframe track through the yard: the six verified
// ?view= poses of station02-main.js are keyframes verbatim, joined by
// transit keys that keep the camera on the yard's real circulation
// routes — the south road, the equipment walkway, the west end — and
// clear of the plant (transformer bushings top out at 7.4 m, arrester
// tops at 5.2 m, the take-off portal beams at 9.8 m are flown through
// their openings, never through steel). Native scroll only — no
// scroll libraries. The camera follows a damped scalar progress
// value, so it can lag but never overshoot the track into a bay.

import * as THREE from 'three';
import { PALETTE } from '../config/world.js';
import { station02Anchors } from '../scene/station02/station02.js';
import { ZONES } from './content.js';

// pos/tgt in metres (world contract). `stop` indexes STOPS in
// content.js. `w` is the scroll weight of the segment FROM this key
// to the next.
const KEYS = [
  { pos: [-1.8, 1.7, 22.6], tgt: [-0.4, 3.4, -8], stop: 0, w: 1.0 }, // gate (?view=gate)
  { pos: [9, 2.0, 21.5], tgt: [12.3, 2.9, 12.1], w: 0.55 }, // east along the south road
  { pos: [19.9, 2.3, 18.9], tgt: [12.3, 2.9, 12.1], stop: 1, w: 0.9 }, // portrait (?view=portrait)
  { pos: [21.5, 6.5, 10.5], tgt: [13.4, 5.0, 12.4], w: 0.6 }, // climb east of T-2, clear of its bushings
  { pos: [8.8, 5.9, 8.2], tgt: [13.4, 5.0, 12.4], stop: 2, w: 0.95 }, // lid (?view=lid)
  { pos: [-20, 5.5, 10.5], tgt: [0, 3.4, 3.2], w: 0.8 }, // west above the walkway, looking back east
  { pos: [-31.5, 1.5, 4.8], tgt: [20, 3.6, 3.2], stop: 3, w: 0.95 }, // bayline (?view=bayline)
  { pos: [-34.5, 1.7, -4], tgt: [15, 7.5, -12.5], w: 0.55 }, // around the west end, past the bus portal leg
  { pos: [-33.5, 1.7, -12.5], tgt: [15, 7.5, -12.5], stop: 4, w: 1.0 }, // bus (?view=bus)
  { pos: [-30, 2.2, 14], tgt: [0.5, 4.8, 9.0], w: 0.85 }, // south around the west end, outside the LV gantry leg
  { pos: [-6.5, 1.8, 22.6], tgt: [0.5, 4.8, 9.0], stop: 5, w: 0.6 }, // firewall (?view=firewall)
  { pos: [-6.5, 1.8, 22.6], tgt: [0.5, 4.8, 9.0], w: 0 }, // hold while the content scrolls over
];

const VIEW_KEYS = { gate: 0, portrait: 2, lid: 4, bayline: 6, bus: 8, firewall: 10 };

const TOTAL_W = KEYS.reduce((s, k) => s + k.w, 0);
const CUM = [0];
for (const k of KEYS) CUM.push(CUM[CUM.length - 1] + k.w / TOTAL_W);

// Caption-card dwell: each stop's card holds full opacity while the
// flight is within (CARD_WINDOW - CARD_FADE) of the stop's anchor
// progress, fades across CARD_FADE at the window's edges, and is gone
// beyond CARD_WINDOW.
const STOP_ANCHORS = KEYS
  .map((k, i) => ({ stop: k.stop, anchor: CUM[i] }))
  .filter((x) => x.stop != null);
const CARD_WINDOW = 0.062;
const CARD_FADE = 0.022;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (u) => u * u * (3 - 2 * u);

// Click-proxy boxes for the station02Anchors() viewpoints: each box
// wraps the equipment its anchor looks at (centres/sizes in metres,
// from the yard layout in station02.js). Where boxes nest — the
// nameplate on T-2's tank face, inside the transformer box — the
// smallest-volume hit wins, so specific kit beats bulk plant.
const ZONE_BOXES = {
  'transformer-t2': { c: [12.2, 3.0, 12.6], s: [8.6, 6.2, 6.4] },
  'nameplate-t2': { c: [12.55, 2.35, 13.15], s: [1.8, 1.4, 0.7] },
  'buchholz-t2': { c: [13.4, 5.4, 12.85], s: [1.3, 1.3, 1.3] },
  'breaker-fdr2': { c: [24.4, 2.4, 0.6], s: [6.0, 4.8, 1.8] },
  'wave-trap-fdr1': { c: [-24.4, 10.35, -19.2], s: [6.4, 2.4, 2.4] },
  'firewall': { c: [0, 3.9, 12.0], s: [1.4, 7.8, 6.6] },
  'bus': { c: [0, 8.8, -12.5], s: [61, 1.8, 15.5] },
  'future-bay-earth': { c: [30.5, 2.2, 0.6], s: [3.6, 4.4, 2.8] },
  'control-building': { c: [24.0, 2.2, 18.0], s: [7.5, 4.4, 5.5] },
  'lv-interface': { c: [12.2, 5.2, 17.9], s: [9.5, 3.6, 1.8] },
};

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
      color: PALETTE.copper, transparent: true, opacity: 0.14, depthWrite: false,
    }),
  );
  const hlEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    new THREE.LineBasicMaterial({ color: PALETTE.copper, transparent: true, opacity: 0.85 }),
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
  function addZone(data, box) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...box.s), proxyMat);
    m.position.set(...box.c);
    m.userData.zone = {
      data,
      centre: new THREE.Vector3(...box.c),
      size: new THREE.Vector3(...box.s),
      volume: box.s[0] * box.s[1] * box.s[2],
    };
    proxies.push(m);
    scene.add(m);
  }
  const anchors = station02Anchors();
  for (const id of Object.keys(ZONE_BOXES)) {
    if (!anchors[id] || !ZONES[id]) continue;
    addZone(ZONES[id], ZONE_BOXES[id]);
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
    document.body.classList.add('panel-open');
    highlight.position.copy(zone.centre);
    highlight.scale.copy(zone.size).addScalar(0.05);
    highlight.visible = true;
  }
  function closePanel() {
    selected = null;
    ui.panel.classList.remove('open');
    ui.panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('panel-open');
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
    // tap / click → raycast select; among the proxies the ray passes
    // through, the smallest (most specific) zone wins — see ZONE_BOXES
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(proxies, false);
    if (hits.length) {
      let best = hits[0].object.userData.zone;
      for (const h of hits) {
        if (h.object.userData.zone.volume < best.volume) best = h.object.userData.zone;
      }
      openPanel(best);
    } else closePanel();
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
    const pastJourney = window.scrollY > scrollLen - window.innerHeight * 0.35;
    ui.hintScroll.classList.toggle('suppressed', pastJourney);
    ui.hintDrag.classList.toggle('suppressed', pastJourney);
    // an open equipment panel belongs to the tour — close it (same
    // path as the ✕) rather than letting it float over the sections
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
      // a gentle idle drift, kept tiny — a held breath, not a sway
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

    // selected-equipment highlight pulse
    if (highlight.visible) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
      hlFill.material.opacity = 0.1 + 0.07 * pulse;
      hlEdge.material.opacity = 0.6 + 0.35 * pulse;
    }

    if (!ready) { ready = true; window.__scrollReady = true; }
  }

  return { update, setView };
}
