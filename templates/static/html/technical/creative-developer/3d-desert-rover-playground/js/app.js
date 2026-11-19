/* ============================================================
   DUNE ROVER® — Playground / app
   Camera rig, input, HUD, sound, case-study drawer, zone jumps.
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('gl');
  const $ = (id) => document.getElementById(id);

  const isTouch = matchMedia('(pointer: coarse)').matches;
  // Never let a slow frame stretch a tween: keep GSAP on wall-clock time.
  if (window.gsap) gsap.ticker.lagSmoothing(0);
  const isMobileDrawer = () => matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── diagnostics (used by the verification runs) ─────────── */
  window.__errors = [];
  window.addEventListener('error', (e) => {
    window.__errors.push(String(e.message || e.error || 'error'));
  });
  window.addEventListener('unhandledrejection', (e) => {
    window.__errors.push('promise: ' + String(e.reason));
  });
  window.__imgFail = 0;
  window.__imgOk = 0;
  new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      const imgs = n.tagName === 'IMG' ? [n] : Array.from(n.querySelectorAll ? n.querySelectorAll('img') : []);
      imgs.forEach((img) => {
        if (img.dataset.tracked) return;
        img.dataset.tracked = '1';
        if (img.complete) { img.naturalWidth ? window.__imgOk++ : window.__imgFail++; return; }
        img.addEventListener('load', () => { window.__imgOk++; });
        img.addEventListener('error', () => { window.__imgFail++; });
      });
    }));
  }).observe(document.body, { childList: true, subtree: true });

  /* ── renderer / scene / camera ───────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 900);
  camera.position.set(40, 62, 78);
  camera.lookAt(0, 0, 0);

  const clock = new THREE.Clock();
  let car = null;
  let running = false;
  let t = 0;

  /* Portrait phones get a wider lens and a longer boom, otherwise the rover
     fills the whole screen and you cannot see where you are going. */
  function fitCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const portrait = aspect < 0.9;
    camera.fov = portrait ? 54 : (aspect < 1.2 ? 46 : 40);
    camera.updateProjectionMatrix();
    cam.dist = portrait ? 21.5 : (aspect < 1.2 ? 18.5 : 16.6);
    cam.height = portrait ? 11.8 : 9.6;
  }

  /* ── camera rig ──────────────────────────────────────────── */
  const cam = {
    mode: 'intro',
    yaw: Math.PI,
    orbit: 0,
    pitch: 0,
    dist: 15.8,
    height: 8.3,
    look: new THREE.Vector3(0, 1.6, 13),
    punch: 0,
  };
  let lookSmooth = new THREE.Vector3(0, 1.4, 6);

  function followTarget(out) {
    const yaw = cam.yaw + cam.orbit;
    const behind = yaw + Math.PI;
    const speedZoom = Math.min(1, Math.abs(car.speed) / 14);
    const d = cam.dist + speedZoom * 1.8 + cam.punch;
    const h = cam.height + cam.pitch + speedZoom * 0.6 + cam.punch * 0.35;
    out.set(
      car.pos.x + Math.sin(behind) * d,
      car.pos.y + h,
      car.pos.z + Math.cos(behind) * d
    );
    // never let a dune swallow the camera
    const gh = World.groundHeight(out.x, out.z);
    if (out.y < gh + 2.2) out.y = gh + 2.2;
    return out;
  }

  const _desired = new THREE.Vector3();
  const _lookTarget = new THREE.Vector3();

  function shortestAngle(a, b) {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  /* ── input ───────────────────────────────────────────────── */
  const keys = new Set();
  const input = { throttle: 0, steer: 0 };
  const touch = { up: false, down: false, left: false, right: false };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  };

  window.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    const k = e.code;
    if (KEYMAP[k]) {
      keys.add(KEYMAP[k]);
      cancelAuto();
      manualDrive();
      e.preventDefault();
    }
    if (k === 'Escape') closeDrawer();
    if (k === 'KeyR') { resetCar(); }
    if (k === 'KeyM') toggleSound();
    if (k === 'Space') { e.preventDefault(); }
    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(k)) {
      gotoZone(['intro', 'projects', 'playground', 'about', 'contact'][Number(k.slice(5)) - 1]);
    }
    Sound.unlock();
  });
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]);
  });
  window.addEventListener('blur', () => { keys.clear(); touch.up = touch.down = touch.left = touch.right = false; });

  /* dpad */
  document.querySelectorAll('#dpad .dpad__btn').forEach((btn) => {
    const dir = btn.dataset.dir;
    const on = (e) => { e.preventDefault(); touch[dir] = true; btn.classList.add('is-down'); cancelAuto(); manualDrive(); Sound.unlock(); };
    const off = (e) => { e.preventDefault(); touch[dir] = false; btn.classList.remove('is-down'); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('pointerleave', off);
  });

  /* canvas drag: orbit on mouse, steer on one finger */
  const drag = { active: false, x: 0, y: 0, ox: 0, oy: 0, moved: 0, steer: 0, thr: 0, mode: 'orbit' };
  let hoverDirty = false;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    Sound.unlock();
    drag.active = true;
    drag.moved = 0;
    drag.x = drag.ox = e.clientX;
    drag.y = drag.oy = e.clientY;
    drag.mode = e.pointerType === 'mouse' ? 'orbit' : 'undecided';
    drag.steer = 0; drag.thr = 0;
    canvas.classList.add('dragging');
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (drag.active) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.mode === 'undecided' && Math.abs(dx) + Math.abs(dy) > 10) {
        // a vertical swipe is the tour, a horizontal one moves the camera
        drag.mode = Math.abs(dy) > Math.abs(dx) * 1.15 ? 'tour' : 'orbit';
      }
      if (drag.mode === 'orbit') {
        cam.orbit -= dx * 0.005;
        cam.pitch = Math.max(-7, Math.min(9, cam.pitch + dy * 0.03));
        drag.moved += 1;
      } else if (drag.mode === 'tour') {
        tourScroll(-dy * 2.8);
      }
    } else if (e.pointerType === 'mouse') {
      hoverDirty = true;
    }
  });

  /* a mouse wheel drives the same tour: go down the page, go along the island */
  window.addEventListener('wheel', (e) => {
    if (drawerOpen) return;
    if (e.ctrlKey) return;                     // keep pinch-zoom working
    if (!e.deltaY) return;
    e.preventDefault();
    tourScroll(e.deltaY);
  }, { passive: false });

  function endDrag(e) {
    if (!drag.active) return;
    drag.active = false;
    canvas.classList.remove('dragging');
    drag.steer = 0; drag.thr = 0;
    if (drag.moved < 8 && (!e || e.type !== 'pointercancel')) handleClick(drag.ox, drag.oy);
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => { drag.active = false; drag.steer = 0; drag.thr = 0; canvas.classList.remove('dragging'); });

  /* ── raycasting ──────────────────────────────────────────── */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);

    const hits = [];
    World.billboards.forEach((b) => hits.push(b.hit));
    World.interactives.forEach((h) => hits.push(h));
    const found = raycaster.intersectObjects(hits, false);
    if (found.length) {
      const u = found[0].object.userData;
      if (u && u.type) return { type: u.type, index: u.index, point: found[0].point };
    }
    const p = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, p)) {
      if (Math.hypot(p.x, p.z) < World.R - 4) return { type: 'ground', point: p };
    }
    return null;
  }

  function handleClick(x, y) {
    const hit = pick(x, y);
    if (!hit) return;
    if (hit.type === 'billboard') {
      openProject(hit.index);
      driveTo(World.billboards[hit.index].pos.x, World.billboards[hit.index].pos.z + 4.5, false);
    } else if (hit.type === 'about') {
      openAbout();
    } else if (hit.type === 'contact') {
      openContact();
    } else if (hit.type === 'projects') {
      gotoZone('projects');
    } else if (hit.type === 'playground') {
      gotoZone('playground');
    } else if (hit.type === 'ground') {
      manualDrive();
      driveTo(hit.point.x, hit.point.z, true);
    }
  }

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || drag.active || !hoverDirty) return;
    hoverDirty = false;
    const hit = pick(e.clientX, e.clientY);
    canvas.classList.toggle('hovering', !!(hit && hit.type !== 'ground'));
  });

  /* ── auto drive ──────────────────────────────────────────── */
  const auto = { target: null, stuck: 0, label: '' };

  function cancelAuto() {
    if (auto.target) { auto.target = null; auto.label = ''; }
  }
  function driveTo(x, z, showToast) {
    auto.target = new THREE.Vector2(x, z);
    auto.stuck = 0;
    if (showToast) toast('DRIVING TO ' + Math.round(x) + ' / ' + Math.round(z));
    Sound.blip(440 + Math.random() * 120, 0.05);
  }

  function gotoZone(name) {
    const z = World.ZONES[name];
    if (!z) return;
    stopTour(null);
    noteUser();
    const safe = {
      intro: [0, 10], projects: [0, -47.5], playground: [46, 6],
      about: [-45, 8], contact: [0, 56],
    }[name];
    driveTo(safe[0], safe[1], false);
    auto.label = name;
    document.querySelectorAll('#zonebar .pill').forEach((p) => {
      p.classList.toggle('is-active', p.dataset.zone === name);
    });
    toast('DRIVING TO ' + z.label);
    cam.punch = 3.6;
    gsap.to(cam, { punch: 0, duration: 1.9, ease: 'power3.out' });
    Sound.blip(520, 0.07);
    if (name === 'projects' && World.billboards.length) {
      // aim at the middle of the billboard row, close enough to open a study
      auto.target.set(0, -47.5);
    }
  }

  document.querySelectorAll('#zonebar .pill').forEach((p) => {
    p.addEventListener('click', () => { Sound.unlock(); noteUser(); gotoZone(p.dataset.zone); });
  });

  /* ── guided tour ──────────────────────────────────────────────
     One open scenic route: INTRO → PROJECTS → PLAYGROUND → ABOUT →
     CONTACT. `u` runs 0..1 along it; a mouse wheel or a vertical swipe
     nudges `u`, AUTO TOUR walks it forward, and the rover drives itself
     to the point at `u`. At u = 1 the rover is standing at the signpost
     and the tour stops — it does not loop back to the start.
  */
  const TOUR_WAYPOINTS = World.TOUR_PATH;
  const TOUR_AUTO_SPEED = 8.8;     // world units per second when cruising
  const TOUR_SCROLL_K = 0.00030;   // u per wheel pixel
  const tour = { u: 0, target: 0, active: false, auto: false, segs: [], len: 1, stuck: 0, unstick: 0, done: false };

  (function buildTour() {
    let acc = 0;
    for (let i = 0; i < TOUR_WAYPOINTS.length - 1; i++) {
      const a = TOUR_WAYPOINTS[i], b = TOUR_WAYPOINTS[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      tour.segs.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], start: acc, len });
      acc += len;
    }
    tour.len = Math.max(1, acc);
  })();

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  const _tourPt = { x: 0, z: 0 };
  function tourPointAt(u, out) {
    const o = out || _tourPt;
    const d = clamp01(u) * tour.len;
    for (let i = 0; i < tour.segs.length; i++) {
      const s = tour.segs[i];
      if (d <= s.start + s.len || i === tour.segs.length - 1) {
        const k = s.len > 1e-6 ? Math.max(0, Math.min(1, (d - s.start) / s.len)) : 0;
        o.x = s.ax + (s.bx - s.ax) * k;
        o.z = s.az + (s.bz - s.az) * k;
        return o;
      }
    }
    o.x = tour.segs[0].ax; o.z = tour.segs[0].az;
    return o;
  }

  function tourUAt(x, z) {
    let best = 0, bd = 1e9;
    for (let i = 0; i < tour.segs.length; i++) {
      const s = tour.segs[i];
      const dx = s.bx - s.ax, dz = s.bz - s.az;
      const l2 = dx * dx + dz * dz || 1;
      let k = ((x - s.ax) * dx + (z - s.az) * dz) / l2;
      k = Math.max(0, Math.min(1, k));
      const px = s.ax + dx * k, pz = s.az + dz * k;
      const dd = Math.hypot(x - px, z - pz);
      if (dd < bd) { bd = dd; best = clamp01((s.start + s.len * k) / tour.len); }
    }
    return best;
  }

  const tourBtn = $('tourBtn');
  function syncTourBtn() {
    if (!tourBtn) return;
    tourBtn.classList.toggle('is-on', tour.auto);
    tourBtn.classList.toggle('is-live', tour.active);
    tourBtn.setAttribute('aria-pressed', String(tour.auto));
    const label = tourBtn.querySelector('span');
    if (label) label.textContent = tour.auto ? 'TOUR ON' : 'AUTO TOUR';
  }

  function startTour(fromStart) {
    if (tour.active) return;
    let u = tourUAt(car.pos.x, car.pos.z);
    if (fromStart && u > 0.975) { u = 0; toast('TOUR RESTARTED — BACK TO INTRO'); }
    tour.u = tour.target = u;
    tour.active = true;
    tour.done = false;
    syncTourBtn();
  }

  function stopTour(msg) {
    const was = tour.active || tour.auto;
    tour.active = false;
    tour.auto = false;
    syncTourBtn();
    if (was && msg) toast(msg);
  }

  function setAutoTour(on, silent) {
    if (on) {
      startTour(true);
      tour.auto = true;
    } else {
      if (!tour.auto) return;
      tour.auto = false;
    }
    syncTourBtn();
    if (!silent) toast(on ? 'AUTO TOUR — SCROLL OR DRIVE TO STOP' : 'AUTO TOUR PAUSED');
    if (on) Sound.blip(560, 0.05);
  }

  function tourScroll(dy) {
    if (!running || drawerOpen) return;
    startTour(false);
    if (tour.auto) setAutoTour(false, true);
    // the two ends of the route are the ends of the scroll: no looping
    tour.target = clamp01(tour.target + dy * TOUR_SCROLL_K);
    tour.done = false;
    noteUser();
  }

  /* the driver takes over: the tour lets go at once */
  function manualDrive() {
    noteUser();
    tour.done = false;
    if (tour.active || tour.auto) stopTour('TOUR OFF — YOU DRIVE');
  }

  let lastUserAt = performance.now();
  function noteUser() { lastUserAt = performance.now(); if (auto.target) { auto.target = null; auto.label = ''; } }

  function finishTour() {
    tour.active = false;
    tour.auto = false;
    tour.done = true;
    tour.u = tour.target = 1;
    syncTourBtn();
    lastUserAt = performance.now();
    toast('TOUR COMPLETE — SAY HELLO');
    Sound.chime();
    const st = prox.states.contact;
    if (st) st.opened = true;
    openContact();
  }

  function tourDrive(dt) {
    if (tour.auto) tour.target = Math.min(1, tour.target + (TOUR_AUTO_SPEED * dt) / tour.len);

    const d = tour.target - tour.u;
    tour.u = clamp01(tour.u + d * (1 - Math.exp(-dt * 3.4)));

    // the scroll cannot run away from the rover: keep it a little ahead.
    // The route passes the intro roundabout twice, so a global nearest-point
    // lookup can point back to the start — only trust it inside a local window.
    const cu = tourUAt(car.pos.x, car.pos.z);
    const lag = tour.u - cu;
    if (lag > 0.03 && lag < 0.2) {
      tour.u = Math.min(tour.target, cu + 0.03);
      if (!tour.auto) tour.target = tour.u;
    }

    // arrived at the signpost: the tour is over, it does not wrap around
    const end = TOUR_WAYPOINTS[TOUR_WAYPOINTS.length - 1];
    if (tour.auto && tour.target > 0.999 && tour.u > 0.998 &&
        Math.hypot(car.pos.x - end[0], car.pos.z - end[1]) < 3.4) {
      finishTour();
      return [0, 0];
    }

    const look = tourPointAt(tour.u + 0.009, _tourPt);
    const dx = look.x - car.pos.x;
    const dz = look.z - car.pos.z;
    const dist = Math.hypot(dx, dz);
    const err = shortestAngle(car.heading, Math.atan2(dx, dz));
    let steer = Math.max(-1, Math.min(1, -err * 2.2));

    // wedged against something? back off and try again instead of grinding
    if (tour.unstick > 0) {
      tour.unstick -= dt;
      return [-1, -steer];
    }
    if (dist > 3 && Math.abs(car.speed) < 0.7) tour.stuck += dt;
    else tour.stuck = Math.max(0, tour.stuck - dt * 0.5);
    if (tour.stuck > 1.6) {
      tour.stuck = 0;
      tour.unstick = 0.85;
      return [-1, -steer];
    }

    let vWant = 8.6;
    // ease down over the last stretch so the rover parks at the signpost
    const endGap = 1 - tour.u;
    if (tour.auto && endGap < 0.035) vWant = Math.min(vWant, Math.max(3.2, 8.6 * (endGap / 0.035)));
    if (Math.abs(err) > 1.1) vWant = 3.2;
    else if (Math.abs(err) > 0.5) vWant = 5.4;
    if (dist < 2.4 && !tour.auto) vWant = 0;
    let thr;
    if (vWant === 0) thr = car.speed > 0.4 ? -1 : 0;
    else thr = car.speed < vWant - 0.3 ? 1 : (car.speed > vWant + 0.9 ? -1 : 0);
    return [thr, steer];
  }

  if (tourBtn) {
    tourBtn.addEventListener('click', () => { Sound.unlock(); noteUser(); setAutoTour(!tour.auto); });
  }

  const projBtn = $('projBtn');
  if (projBtn) projBtn.addEventListener('click', () => { Sound.unlock(); noteUser(); openProjects(); });
  const quickContact = $('contactBtn');
  if (quickContact) quickContact.addEventListener('click', () => { Sound.unlock(); noteUser(); openContact(); });

  function resetCar() {
    Car.reset(car, 0, 8, Math.PI);
    World.resetProps();
    cam.orbit = 0; cam.pitch = 0; cam.yaw = Math.PI;
    auto.target = null;
    stopTour(null);
    tour.done = false;
    tour.u = tour.target = tourUAt(0, 8);
    prox.states = {};
    prox.autoCloseIn = 0;
    closeDrawer();
    toast('CAR RESET');
    Sound.blip(300, 0.06);
  }

  /* ── HUD ─────────────────────────────────────────────────── */
  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast');
    $('toastText').textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2100);
  }

  const zoneList = ['intro', 'projects', 'playground', 'about', 'contact'];
  let lastZone = '';

  function updateHud() {
    const kmh = Car.speedKmh(car);
    $('kmh').textContent = kmh;
    $('speedFill').style.width = Math.min(100, (kmh / 78) * 100) + '%';

    // nearest zone (or the zone we are driving to), kept in sync with the pills
    let best = null, bd = 1e9;
    zoneList.forEach((k) => {
      const z = World.ZONES[k];
      const d = Math.hypot(z.x - car.pos.x, z.z - car.pos.z);
      if (d < bd) { bd = d; best = k; }
    });
    const activeZone = (auto.label && World.ZONES[auto.label]) ? auto.label : (best || 'intro');
    $('zoneTagText').textContent = World.ZONES[activeZone].label;
    if (activeZone !== lastZone) {
      lastZone = activeZone;
      document.querySelectorAll('#zonebar .pill').forEach((p) => {
        p.classList.toggle('is-active', p.dataset.zone === activeZone);
      });
    }

    // near-billboard prompt
    const nb = World.nearestBillboard(car.pos, 8.6);
    const hint = $('nearHint');
    if (nb && !drawerOpen) {
      hint.querySelector('span').textContent = 'OPEN — ' + nb.project.title.toUpperCase();
      hint.classList.add('is-on');
    } else {
      hint.classList.remove('is-on');
    }
  }

  function drawMinimap() {
    const cv = $('minimap');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, S = (W / 2 - 7) / (World.R + 2);   // island radius → map radius
    ctx.clearRect(0, 0, W, W);

    ctx.save();
    ctx.translate(W / 2, W / 2);
    // island
    ctx.beginPath(); ctx.arc(0, 0, (World.R - 4) * S, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,207,166,0.55)'; ctx.fill();
    ctx.strokeStyle = 'rgba(194,103,74,0.45)'; ctx.lineWidth = 1; ctx.stroke();

    // oasis ponds
    (World.PONDS || []).forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x * S, p.z * S, Math.max(1.6, p.r * S), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(63,154,154,0.7)'; ctx.fill();
    });

    // roads
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(194,103,74,0.26)';
    (World.ROADS || []).forEach((r) => {
      ctx.lineWidth = Math.max(1.6, r.w * S * 0.7);
      ctx.beginPath();
      r.pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0] * S, p[1] * S); else ctx.lineTo(p[0] * S, p[1] * S);
      });
      ctx.stroke();
    });

    // billboards
    World.billboards.forEach((b) => {
      ctx.fillStyle = 'rgba(58,42,34,0.5)';
      ctx.fillRect(b.pos.x * S - 1.3, b.pos.z * S - 1.3, 2.6, 2.6);
    });

    // zones
    zoneList.forEach((k) => {
      const z = World.ZONES[k];
      ctx.beginPath(); ctx.arc(z.x * S, z.z * S, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = k === lastZone ? '#c2674a' : 'rgba(58,42,34,0.35)';
      ctx.fill();
    });

    // car
    ctx.save();
    ctx.translate(car.pos.x * S, car.pos.z * S);
    ctx.rotate(-car.heading + Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(3.4, 4); ctx.lineTo(-3.4, 4); ctx.closePath();
    ctx.fillStyle = '#3a2a22';
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /* ── sound ───────────────────────────────────────────────── */
  const Sound = {
    ctx: null, on: true, started: false, master: null,
    humGain: null, osc1: null, osc2: null, filter: null,
    waterGain: null, waterPan: null, waterTarget: 0, bubbles: [],
    unlock() {
      if (!Sound.on) return;
      try {
        if (!Sound.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) { Sound.on = false; return; }
          Sound.ctx = new AC();
          Sound.master = Sound.ctx.createGain();
          Sound.master.gain.value = 0.65;
          Sound.master.connect(Sound.ctx.destination);

          Sound.filter = Sound.ctx.createBiquadFilter();
          Sound.filter.type = 'lowpass';
          Sound.filter.frequency.value = 420;
          Sound.filter.Q.value = 3.5;
          Sound.humGain = Sound.ctx.createGain();
          Sound.humGain.gain.value = 0.0001;
          Sound.filter.connect(Sound.humGain);
          Sound.humGain.connect(Sound.master);

          Sound.osc1 = Sound.ctx.createOscillator();
          Sound.osc1.type = 'sawtooth';
          Sound.osc1.frequency.value = 58;
          Sound.osc2 = Sound.ctx.createOscillator();
          Sound.osc2.type = 'square';
          Sound.osc2.frequency.value = 87;
          const g2 = Sound.ctx.createGain();
          g2.gain.value = 0.35;
          Sound.osc1.connect(Sound.filter);
          Sound.osc2.connect(g2); g2.connect(Sound.filter);
          Sound.osc1.start();
          Sound.osc2.start();

          /* ── oasis water: a lap of filtered noise + slow bubbles.
             Silent by default; only the proximity mix opens it up. ── */
          const sr = Sound.ctx.sampleRate;
          const buf = Sound.ctx.createBuffer(1, sr * 2, sr);
          const dat = buf.getChannelData(0);
          let last = 0;
          for (let i = 0; i < dat.length; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02;
            dat[i] = last * 3.4;
          }
          const noise = Sound.ctx.createBufferSource();
          noise.buffer = buf; noise.loop = true;
          const bp = Sound.ctx.createBiquadFilter();
          bp.type = 'bandpass'; bp.frequency.value = 720; bp.Q.value = 0.7;
          const lp = Sound.ctx.createBiquadFilter();
          lp.type = 'lowpass'; lp.frequency.value = 2600;
          Sound.waterGain = Sound.ctx.createGain();
          Sound.waterGain.gain.value = 0.0001;
          Sound.waterPan = Sound.ctx.createStereoPanner ? Sound.ctx.createStereoPanner() : null;
          noise.connect(bp); bp.connect(lp); lp.connect(Sound.waterGain);
          if (Sound.waterPan) { Sound.waterGain.connect(Sound.waterPan); Sound.waterPan.connect(Sound.master); }
          else Sound.waterGain.connect(Sound.master);
          noise.start();

          [392, 523, 659].forEach((f, i) => {
            const o = Sound.ctx.createOscillator();
            o.type = 'sine'; o.frequency.value = f;
            const g = Sound.ctx.createGain(); g.gain.value = 0.035;
            const lfo = Sound.ctx.createOscillator();
            lfo.type = 'sine'; lfo.frequency.value = 0.27 + i * 0.16;
            const lg = Sound.ctx.createGain(); lg.gain.value = 0.03;
            lfo.connect(lg); lg.connect(g.gain);
            o.connect(g); g.connect(Sound.waterGain);
            o.start(); lfo.start();
            Sound.bubbles.push(o);
          });

          Sound.started = true;
        }
        if (Sound.ctx.state === 'suspended') Sound.ctx.resume().catch(() => {});
      } catch (err) {
        Sound.on = false;
      }
    },
    /* dist = metres to the nearest pond edge; pan -1..1 */
    updateWater(dist, pan) {
      const near = Math.max(0, Math.min(1, (34 - dist) / 26));
      Sound.waterTarget = near * near * 0.17;
      if (!Sound.ctx || !Sound.waterGain) return;
      try {
        const now = Sound.ctx.currentTime;
        Sound.waterGain.gain.setTargetAtTime(Math.max(0.0001, Sound.waterTarget * (Sound.on ? 1 : 0)), now, 0.22);
        if (Sound.waterPan) Sound.waterPan.pan.setTargetAtTime(Math.max(-0.85, Math.min(0.85, pan || 0)), now, 0.3);
      } catch (err) { /* silent */ }
    },
    engine(speed) {
      if (!Sound.ctx || !Sound.on) return;
      const v = Math.min(1, Math.abs(speed) / 16);
      const f = 46 + v * 96;
      const now = Sound.ctx.currentTime;
      Sound.osc1.frequency.setTargetAtTime(f, now, 0.08);
      Sound.osc2.frequency.setTargetAtTime(f * 1.51, now, 0.08);
      Sound.filter.frequency.setTargetAtTime(320 + v * 900, now, 0.1);
      Sound.humGain.gain.setTargetAtTime(0.012 + v * 0.055, now, 0.12);
    },
    blip(freq, vol) {
      if (!Sound.ctx || !Sound.on) return;
      try {
        const o = Sound.ctx.createOscillator();
        const g = Sound.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq || 660;
        g.gain.value = 0;
        o.connect(g); g.connect(Sound.master);
        const now = Sound.ctx.currentTime;
        g.gain.linearRampToValueAtTime(vol || 0.06, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        o.start(now); o.stop(now + 0.5);
      } catch (err) { /* silent */ }
    },
    chime() {
      Sound.blip(880, 0.045);
      setTimeout(() => Sound.blip(1320, 0.03), 90);
    },
    thud(power) {
      if (!Sound.ctx || !Sound.on) return;
      try {
        const o = Sound.ctx.createOscillator();
        const g = Sound.ctx.createGain();
        o.type = 'triangle';
        const now = Sound.ctx.currentTime;
        o.frequency.setValueAtTime(120, now);
        o.frequency.exponentialRampToValueAtTime(46, now + 0.18);
        g.gain.setValueAtTime(Math.min(0.09, 0.02 + power * 0.01), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        o.connect(g); g.connect(Sound.master);
        o.start(now); o.stop(now + 0.26);
      } catch (err) { /* silent */ }
    },
    setEnabled(v) {
      Sound.on = v;
      if (Sound.master) Sound.master.gain.value = v ? 0.65 : 0;
      const btn = $('soundBtn');
      btn.setAttribute('aria-pressed', String(v));
      $('soundLabel').textContent = v ? 'SOUND ON' : 'SOUND OFF';
      if (v) Sound.unlock();
    },
  };
  window.Sound = Sound;

  function toggleSound() {
    Sound.setEnabled(!Sound.on);
    if (Sound.on) Sound.blip(720, 0.05);
    toast(Sound.on ? 'SOUND ON' : 'SOUND OFF');
  }
  $('soundBtn').addEventListener('click', toggleSound);

  /* ── drawer ──────────────────────────────────────────────── */
  const drawer = $('drawer');
  const drawerScroll = $('drawerScroll');
  const scrim = $('scrim');
  let drawerOpen = false;
  let openIndex = -1;
  let drawerOpenedAt = 0;

  function titleHTML(title) {
    const words = title.split(' ');
    if (words.length === 1) return title;
    return words[0] + ' <em>' + words.slice(1).join(' ') + '</em>';
  }

  function projectHTML(p) {
    const next = World.PROJECTS[(World.PROJECTS.indexOf(p) + 1) % World.PROJECTS.length];
    return `
    <article class="cs" data-project="${p.n}">
      <header class="cs__top">
        <div>
          <div class="cs__eyebrow">CASE STUDY <em>/</em> ${p.meta.YEAR} <em>/</em> ${p.n}</div>
          <h2 class="cs__title">${titleHTML(p.title)}</h2>
          <p class="cs__sub">${p.sub}</p>
        </div>
        <div class="cs__index">${p.n}</div>
      </header>
      <dl class="cs__meta">
        ${Object.keys(p.meta).map((k) => `<div><dt>${k}</dt><dd>${p.meta[k]}</dd></div>`).join('')}
      </dl>
      <figure class="cs__hero">
        <img src="${p.hero}" alt="${p.title} — hero image" loading="eager" />
        <div class="cs__cap"><span>FIG. 01 — ${p.title.toUpperCase()}</span><span>${p.meta.CLIENT}</span></div>
      </figure>
      <div class="cs__body">
        <p class="cs__lead">${p.lead}</p>
        ${p.body.map((b) => `<p>${b}</p>`).join('')}
        <blockquote class="cs__quote">${p.quote}<span>${p.quoteBy}</span></blockquote>
      </div>
      <div class="cs__grid">
        ${p.shots.map((s, i) => `
          <figure>
            <img src="${s}" alt="${p.title} — detail ${i + 1}" loading="lazy" />
            <figcaption>FIG. 0${i + 2} — ${i === 0 ? 'PROCESS' : 'SYSTEM'}</figcaption>
          </figure>`).join('')}
      </div>
      <div class="cs__results">
        ${p.results.map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}
      </div>
      <div class="cs__foot">
        <div class="cs__credit">PHOTOGRAPHY — UNSPLASH<br />${p.credit.replace('Photography: Unsplash — ', '')}</div>
        <button class="cs__next" type="button" data-next="${World.PROJECTS.indexOf(next)}">
          NEXT — ${next.title.toUpperCase()}
          <svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>
        </button>
      </div>
    </article>`;
  }

  function aboutHTML() {
    const skills = [
      ['Three.js / WebGL', 94], ['GSAP & scroll systems', 96], ['GLSL shaders', 82],
      ['TypeScript', 90], ['Art direction', 78], ['Motion design', 85],
    ];
    return `
    <div class="pane">
      <div class="pane__eyebrow">ABOUT <span style="opacity:.45">/</span> DUNE ROVER® <span style="opacity:.45">/</span> ISLAND 001</div>
      <h2 class="pane__title">A developer who likes<br />the <em>toy version</em> of things.</h2>
      <p class="pane__lead">Six years of building interactive worlds for museums, studios and brands that would rather be remembered than scrolled past.</p>
      <p>I started in a printing workshop, moved to a motion studio, and ended up writing shaders at 2am because a panel would not reflect the light the way the art director drew it. That is still the job: take a flat idea, give it weight, let people drive it around.</p>
      <p>Most of my work lives on the seam between design and engineering — the place where a typographic decision becomes a camera move. I work alone or with a small team, from concept to launch, and I like projects where the client has one strong opinion and no fear.</p>
      <div class="skills">
        ${skills.map(([n, v], i) => `
          <div class="skill" data-v="${v}">
            <div class="skill__row"><span class="skill__name">${n}</span><span class="skill__val">${v}</span></div>
            <div class="skill__bar"><i data-w="${v}"></i></div>
          </div>`).join('')}
      </div>
      <div class="timeline">
        <div class="tl"><div class="tl__year">2023—26</div><div class="tl__what"><b>Independent — DUNE ROVER®</b><span>WebGL, interaction and identity for cultural clients. 14 launches, 11 awards.</span></div></div>
        <div class="tl"><div class="tl__year">2021—23</div><div class="tl__what"><b>Interactive lead — Studio Fold</b><span>Built the studio's real-time pipeline; three Awwwards Site of the Day in two years.</span></div></div>
        <div class="tl"><div class="tl__year">2019—21</div><div class="tl__what"><b>Front-end — Hanul Types</b><span>Variable type in the browser, editorial sites, a lot of Korean typesetting.</span></div></div>
        <div class="tl"><div class="tl__year">2018—19</div><div class="tl__what"><b>Print workshop — Ink &amp; Grain</b><span>Letterpress, risograph, and the useful habit of checking things by hand.</span></div></div>
      </div>
      <div class="avail"><i></i>AVAILABLE FOR SELECT PROJECTS — SPRING 2026</div>
    </div>`;
  }

  function contactHTML() {
    return `
    <div class="pane">
      <div class="pane__eyebrow">CONTACT <span style="opacity:.45">/</span> SAY HELLO</div>
      <h2 class="pane__title">Bring me something<br /><em>strange</em> to build.</h2>
      <p class="pane__lead">Briefs, collaborations, or a note about a bug you found while driving around this island — all welcome.</p>
      <div class="contact-list">
        <div class="contact-row">
          <div><div class="contact-row__k">EMAIL</div><div class="contact-row__v">hello@example.com</div></div>
          <button class="copy-btn" type="button" data-copy="hello@example.com">COPY</button>
        </div>
        <div class="contact-row">
          <div><div class="contact-row__k">INSTAGRAM</div><div class="contact-row__v">@dunerover</div></div>
          <button class="copy-btn" type="button" data-copy="@dunerover">COPY</button>
        </div>
        <div class="contact-row">
          <div><div class="contact-row__k">GITHUB</div><div class="contact-row__v">github.com/SudiptaSanki/PortfolioBuilder</div></div>
          <button class="copy-btn" type="button" data-copy="github.com/SudiptaSanki/PortfolioBuilder">COPY</button>
        </div>
        <div class="contact-row">
          <div><div class="contact-row__k">STUDIO</div><div class="contact-row__v">Seoul — by appointment</div></div>
          <span class="contact-row__k">GMT+9</span>
        </div>
      </div>
      <div class="avail"><i></i>REPLIES USUALLY WITHIN A DAY</div>
      <p style="margin-top:22px;font-size:11.5px;opacity:.55">Placeholder contact details for this study build — swap them for your own before publishing.</p>
    </div>`;
  }

  function openDrawer(html, kind) {
    drawerScroll.innerHTML = html;
    drawerScroll.scrollTop = 0;
    drawerOpen = true;
    drawerOpenedAt = performance.now();
    drawer.dataset.kind = kind || '';
    scrim.classList.add('is-on');
    drawer.classList.add('is-on');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.dataset.drawer = '1';

    const mobile = isMobileDrawer();
    gsap.killTweensOf(drawer);
    gsap.fromTo(drawer,
      mobile ? { yPercent: 100 } : { xPercent: 102 },
      { xPercent: 0, yPercent: 0, duration: reduceMotion ? 0.01 : 0.72, ease: 'power4.out' });
    gsap.fromTo(drawerScroll.querySelectorAll('.cs__top, .cs__meta, .cs__hero, .cs__body > *, .cs__grid, .cs__results, .cs__foot, .pane > *'),
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.035, ease: 'power3.out', delay: 0.12, overwrite: true });

    const bars = drawerScroll.querySelectorAll('.skill__bar i');
    bars.forEach((b, i) => {
      gsap.fromTo(b, { width: '0%' }, { width: b.dataset.w + '%', duration: 0.9, delay: 0.25 + i * 0.06, ease: 'power3.out' });
    });

    // close / next / copy wiring
    drawerScroll.querySelectorAll('[data-next]').forEach((btn) => {
      btn.addEventListener('click', () => openProject(Number(btn.dataset.next)));
    });
    drawerScroll.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', () => { Sound.blip(640, 0.05); openProject(Number(btn.dataset.open)); });
    });
    drawerScroll.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        const done = () => { btn.textContent = 'COPIED'; Sound.blip(920, 0.045); setTimeout(() => { btn.textContent = 'COPY'; }, 1600); };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => { btn.textContent = 'SELECT'; });
          } else {
            btn.textContent = text;
          }
        } catch (err) { btn.textContent = text; }
      });
    });

    Sound.chime();
  }

  function openProject(i) {
    const p = World.PROJECTS[i];
    if (!p) return;
    openIndex = i;
    openDrawer(projectHTML(p), 'project');
    document.querySelectorAll('#zonebar .pill').forEach((el) => el.classList.remove('is-active'));
  }

  function openAbout() { openIndex = -1; openDrawer(aboutHTML(), 'about'); }
  function openContact() { openIndex = -1; openDrawer(contactHTML(), 'contact'); }

  function projectsListHTML() {
    return `
    <div class="pane">
      <div class="pane__eyebrow">PROJECTS <span style="opacity:.45">/</span> SIX CASE STUDIES</div>
      <h2 class="pane__title">Six things I<br /><em>drove</em> into being.</h2>
      <p class="pane__lead">Every billboard on the island, in one list. Tap a row to read it — or close this and drive over.</p>
      <div class="plist">
        ${World.PROJECTS.map((p, i) => `
          <button class="plist__row" type="button" data-open="${i}">
            <span class="plist__n">${p.n}</span>
            <span class="plist__body"><b>${p.title}</b><em>${p.sub}</em></span>
            <span class="plist__year">${p.meta.YEAR}</span>
            <svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>
          </button>`).join('')}
      </div>
      <div class="avail"><i></i>DRIVE UP TO ANY BILLBOARD AND STOP</div>
    </div>`;
  }

  function openProjects() { openIndex = -1; openDrawer(projectsListHTML(), 'projects'); }

  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;
    openIndex = -1;
    scrim.classList.remove('is-on');
    drawer.classList.remove('is-on');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.dataset.kind = '';
    delete document.body.dataset.drawer;
    const mobile = isMobileDrawer();
    gsap.killTweensOf(drawer);
    gsap.to(drawer, mobile ? { yPercent: 100 } : { xPercent: 102, duration: 0.5, ease: 'power3.in' });
  }

  const safeClose = () => { if (performance.now() - drawerOpenedAt > 420) closeDrawer(); };
  $('drawerClose').addEventListener('click', safeClose);
  scrim.addEventListener('click', safeClose);

  /* ── proximity opens a case study / the contact card ─────────
     Drive near a billboard (by hand or on the tour) and its case study
     opens. Reach CONTACT and the contact card opens. Each target opens
     once per visit: once the drawer is closed it stays shut until the
     car drives away and comes back.
  */
  const TARGETS = [];
  function buildTargets() {
    TARGETS.length = 0;
    World.billboards.forEach((b) => {
      TARGETS.push({
        key: 'bb' + b.index, kind: 'billboard', index: b.index,
        x: b.pos.x, z: b.pos.z, radius: 8.6, exit: 14, dwell: 0.4,
      });
    });
    const c = World.ZONES.contact;
    TARGETS.push({ key: 'contact', kind: 'contact', x: c.x, z: c.z, radius: 10.5, exit: 16, dwell: 0.45 });
  }

  const prox = { states: {}, autoCloseIn: 0 };

  function checkProximity(dt) {
    if (!car) return;
    let hit = null;
    for (let i = 0; i < TARGETS.length; i++) {
      const t = TARGETS[i];
      let st = prox.states[t.key];
      if (!st) st = prox.states[t.key] = { opened: false, inside: false, dwell: 0, dist: 1e9 };
      const d = Math.hypot(t.x - car.pos.x, t.z - car.pos.z);
      st.dist = d;
      if (d > t.exit) { st.opened = false; st.inside = false; st.dwell = 0; continue; }
      if (d > t.radius) { st.inside = false; st.dwell = 0; continue; }
      st.inside = true;
      if (st.opened) continue;
      st.dwell += dt;
      if (!hit && st.dwell >= t.dwell) hit = t;
    }
    if (drawerOpen || !hit) return;

    const st = prox.states[hit.key];
    st.opened = true;
    st.dwell = 0;
    if (hit.kind === 'contact') {
      // on AUTO TOUR the rover drives the last stretch first, then finishTour()
      // opens the card — otherwise the drawer would stop the tour short of the sign
      if (!tour.auto) openContact();
    } else {
      openProject(hit.index);
      // on a hands-off AUTO TOUR the drawer peeks, then the drive resumes
      if (tour.auto) {
        prox.autoCloseIn = 3.2;
        toast('CASE STUDY — TOUR RESUMES IN A MOMENT');
      }
    }
  }

  /* any real interaction with an open drawer keeps it open */
  drawer.addEventListener('pointerdown', () => { prox.autoCloseIn = 0; });
  drawerScroll.addEventListener('wheel', () => { prox.autoCloseIn = 0; }, { passive: true });

  /* ── main loop ───────────────────────────────────────────── */
  let frame = 0;
  let hudTick = 0;
  let paused = false;

  function updateInput(dt) {
    let thr = 0, steer = 0;
    if (keys.has('up') || touch.up) thr += 1;
    if (keys.has('down') || touch.down) thr -= 1;
    if (keys.has('left') || touch.left) steer -= 1;
    if (keys.has('right') || touch.right) steer += 1;

    if (drawerOpen) { thr = 0; steer = 0; }

    // anything the driver does outranks the tour
    if ((thr !== 0 || steer !== 0) && (tour.active || tour.auto)) manualDrive();

    if (thr === 0 && steer === 0 && tour.active && !drawerOpen) {
      const p = tourDrive(dt);
      thr = p[0]; steer = p[1];
    } else if (auto.target && !drawerOpen && thr === 0 && steer === 0) {
      const dx = auto.target.x - car.pos.x;
      const dz = auto.target.y - car.pos.z;
      const dist = Math.hypot(dx, dz);
      const want = Math.atan2(dx, dz);
      const diff = shortestAngle(car.heading, want);
      const aligned = Math.abs(diff) < 1.0;
      const vDesired = aligned ? Math.max(0, Math.min(13, (dist - 1.8) * 1.35)) : 4.2;
      steer = Math.max(-1, Math.min(1, -diff * 1.9));
      thr = car.speed > vDesired + 0.8 ? -1 : car.speed < vDesired - 0.6 ? 1 : 0;
      const near = dist < 2.4 + Math.abs(car.speed) * 0.35;
      if (near) thr = car.speed > 0.4 ? -1 : 0;
      if (dist < 2.0 && Math.abs(car.speed) < 2.2) { auto.target = null; auto.stuck = 0; auto.label = ''; thr = 0; }
      auto.stuck = Math.abs(car.speed) < 0.8 ? auto.stuck + dt : 0;
      if (auto.stuck > 2.6 && dist > 5.5) {
        auto.target = null;
        auto.label = '';
        auto.stuck = 0;
        toast('TAP THE GROUND TO DRIVE THERE');
      }
    }

    input.throttle = thr;
    input.steer = steer;
  }

  function simulate(dt) {
    t += dt;

    if (running) {
      if (!tour.active && !tour.auto && !tour.done && !drawerOpen && performance.now() - lastUserAt > 15000) {
        setAutoTour(true);
      }
      updateInput(dt);
      Car.update(dt, car, input, t);

      const bounced = World.updateProps(dt, car, car.vel);
      if (bounced) {
        Car.bounce(car, bounced);
        if (bounced > 0.6 && Math.abs(car.speed) > 6) Sound.thud(Math.abs(car.speed));
      }

      World.update(dt, t, camera, car);
      checkProximity(dt);

      /* camera */
      if (cam.mode === 'follow') {
        cam.yaw += shortestAngle(cam.yaw, car.heading) * Math.min(1, dt * 3.4);
        followTarget(_desired);
        const k = 1 - Math.exp(-dt * 4.6);
        camera.position.lerp(_desired, k);
        _lookTarget.set(car.pos.x + Math.sin(car.heading) * 3.0, car.pos.y + 2.9, car.pos.z + Math.cos(car.heading) * 3.0);
        lookSmooth.lerp(_lookTarget, 1 - Math.exp(-dt * 6));
        camera.lookAt(lookSmooth);
      }

      Sound.engine(car.speed);

      /* oasis water is only audible near a pond */
      const np = World.nearestPond(car.pos);
      if (np.pond) {
        const rel = shortestAngle(car.heading, Math.atan2(np.pond.x - car.pos.x, np.pond.z - car.pos.z));
        Sound.updateWater(np.dist, Math.sin(rel));
      } else {
        Sound.updateWater(99, 0);
      }

      /* a hands-off tour lets a peeked case study close itself */
      if (drawerOpen && prox.autoCloseIn > 0) {
        prox.autoCloseIn -= dt;
        if (prox.autoCloseIn <= 0) {
          prox.autoCloseIn = 0;
          closeDrawer();
          toast('TOUR RESUMES');
        }
      }

      hudTick += dt;
      if (hudTick > 0.08) {
        hudTick = 0;
        updateHud();
        drawMinimap();
      }
    }

  }

  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    if (!paused) {
      simulate(dt);
      renderer.render(scene, camera);
      frame++;
    }
    requestAnimationFrame(tick);
  }

  /* ── boot ────────────────────────────────────────────────── */
  function boot() {
    World.init(scene, renderer);
    car = Car.create(scene);
    buildTargets();
    World.expectTextures(World.billboards.length);
    fitCamera();
    detectHostBadge();
    [800, 2200, 5000].forEach((ms) => setTimeout(detectHostBadge, ms));

    // camera: start wide, then swoop in
    cam.yaw = car.heading;
    followTarget(_desired);
    camera.position.set(40, 62, 78);
    const look = { x: 0, y: 0, z: -2 };
    camera.lookAt(look.x, look.y, look.z);

    const loader = $('loader');
    const fill = $('loadFill');
    const pctEl = $('loadPct');
    const statusEl = $('loadStatus');
    let shown = 0;
    let finishing = false;

    function setProgress(p) {
      shown = shown + (p - shown) * 0.35;
      const v = Math.max(4, Math.min(100, Math.round(shown * 100)));
      fill.style.width = v + '%';
      pctEl.textContent = String(v).padStart(3, '0');
    }

    World.onTextureProgress((done, total) => {
      const p = total ? done / total : 1;
      setProgress(p);
      statusEl.textContent = done >= total ? 'READY' : `LOADING BILLBOARDS ${done}/${total}`;
    });

    let fake = 0;
    const fakeTimer = setInterval(() => {
      fake = Math.min(0.92, fake + 0.06);
      const p = World.textureProgress();
      const real = p.total ? p.done / p.total : 0;
      setProgress(Math.max(fake, real));
      if (fake > 0.5) statusEl.textContent = 'BUILDING THE ISLAND';
    }, 130);

    const startedAt = performance.now();
    function ready() {
      if (finishing) return;
      finishing = true;
      clearInterval(fakeTimer);
      setProgress(1);
      statusEl.textContent = 'READY';
      const wait = Math.max(0, 700 - (performance.now() - startedAt));
      setTimeout(startIntro, wait);
      setTimeout(() => { if (!running) startIntro(); }, 4000);
    }

    // wait for fonts so canvas type is drawn with the real faces
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      clearInterval(fakeTimer);
      // textures may still be loading — give them a moment, then start anyway
      const p = World.textureProgress();
      if (p.total > 0 && p.done < p.total) {
        const t0 = setInterval(() => {
          const q = World.textureProgress();
          setProgress(q.done / Math.max(1, q.total));
          if (q.done >= q.total) { clearInterval(t0); ready(); }
        }, 120);
        setTimeout(() => { clearInterval(t0); ready(); }, 3500);
      } else {
        ready();
      }
    });

    function startIntro() {
      running = true;
      const loaderEl = loader;
      gsap.to(loaderEl, {
        y: -40, opacity: 0, duration: 0.9, ease: 'power3.inOut', delay: 0.15,
        onComplete: () => { loaderEl.style.display = 'none'; },
      });
      // never let a stalled tween keep the loader on screen
      setTimeout(() => { loaderEl.style.display = 'none'; }, 2000);

      followTarget(_desired);
      const proxy = { x: camera.position.x, y: camera.position.y, z: camera.position.z, lx: 0, ly: 0, lz: -2 };
      gsap.to(proxy, {
        x: _desired.x, y: _desired.y, z: _desired.z,
        lx: car.pos.x, ly: car.pos.y + 2.9, lz: car.pos.z,
        duration: reduceMotion ? 0.6 : 2.8, ease: 'power3.inOut',
        onUpdate: () => { camera.lookAt(proxy.lx, proxy.ly, proxy.lz); },
        onComplete: () => {
          cam.mode = 'follow';
          lookSmooth.set(car.pos.x, car.pos.y + 2.9, car.pos.z);
          window.__ready = true;
          document.body.dataset.loading = '0';
          setTimeout(() => toast(isTouch ? 'SWIPE ↑↓ FOR THE TOUR · OR TAP A ZONE' : 'SCROLL TO TOUR · WASD TO DRIVE'), 600);
        },
      });

      // on very slow devices GSAP's lag smoothing can stretch the swoop; make sure
      // the island becomes interactive regardless.
      setTimeout(() => {
        if (!window.__ready) {
          cam.mode = 'follow';
          lookSmooth.set(car.pos.x, car.pos.y + 2.9, car.pos.z);
          window.__ready = true;
          document.body.dataset.loading = '0';
        }
      }, 5000);

      gsap.fromTo('#hud-top, #hud-controls, #hud-meta, #dock, #dpad',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, delay: 1.4, ease: 'power2.out', clearProps: 'transform' });

      document.body.dataset.loading = '0';
    }

    tick();
  }

  /* ── resize ──────────────────────────────────────────────── */
  /* Some sandbox previews inject an "open sandbox" badge in the bottom-right
     corner. Lift the controls above it so no button becomes untappable. */
  function detectHostBadge() {
    const badge = document.querySelector('iframe[id^="sb__open-sandbox"]');
    if (badge) {
      document.body.classList.add('has-host-badge');
      if (!badge.dataset.watched) {
        badge.dataset.watched = '1';
        badge.addEventListener('load', detectHostBadge);
      }
      const r = badge.getBoundingClientRect();
      document.body.style.setProperty('--host-gap', Math.round(window.innerHeight - r.top) + 'px');
    }
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    fitCamera();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    detectHostBadge();
  });

  window.addEventListener('load', boot);

  /* ── test / automation hooks ─────────────────────────────── */
  window.App = {
    onLand(impact) { Sound.thud(impact); },
    openProject, openAbout, openContact, openProjects, closeDrawer, gotoZone, resetCar,
    toggleSound,
    setCamera(mode) { cam.mode = mode; },
    view(x, y, z, tx, ty, tz) {
      cam.mode = 'free';
      camera.position.set(x, y, z);
      camera.lookAt(tx || 0, ty || 0, tz || 0);
      renderer.render(scene, camera);
    },
    step(seconds, hz) {
      const dt = 1 / (hz || 60);
      const n = Math.max(1, Math.round(seconds / dt));
      for (let i = 0; i < n; i++) simulate(dt);
      renderer.render(scene, camera);
      return n;
    },
    sim(seconds, hz) {
      const dt = 1 / (hz || 60);
      const n = Math.max(1, Math.round(seconds / dt));
      for (let i = 0; i < n; i++) simulate(dt);
      return n;
    },
    draw() { renderer.render(scene, camera); },
    pause() { paused = true; },
    resume() { paused = false; clock.getDelta(); },
    skipIntro() {
      gsap.killTweensOf(camera.position);
      cam.mode = 'follow';
      followTarget(_desired);
      camera.position.copy(_desired);
      lookSmooth.set(car.pos.x, car.pos.y + 2.9, car.pos.z);
      camera.lookAt(lookSmooth);
      const l = document.getElementById('loader');
      if (l) { l.style.display = 'none'; l.style.opacity = '0'; }
      window.__ready = true;
      document.body.dataset.loading = '0';
      renderer.render(scene, camera);
    },
    renderer,
    camera,
    scene,
    sample(x, y) {
      renderer.render(scene, camera);
      const gl = renderer.getContext();
      const dpr = renderer.getPixelRatio();
      const px = new Uint8Array(4);
      gl.readPixels(Math.round(x * dpr), Math.round((window.innerHeight - y) * dpr), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return [px[0], px[1], px[2], px[3]];
    },
    press(dir, on) { if (on) keys.add(dir); else keys.delete(dir); },
    setTouch(dir, on) { touch[dir] = !!on; },
    onHit(power) { Sound.thud(power); },
    parkAt(x, z, h) { Car.reset(car, x, z, typeof h === 'number' ? h : car.heading); auto.target = null; stopTour(null); prox.states = {}; prox.autoCloseIn = 0; },
    scrollTour(dy) { tourScroll(dy); },
    setAutoTour(on) { setAutoTour(!!on); },
    manualDrive() { manualDrive(); },
    touch() { noteUser(); },
    tourState() {
      const p = tourPointAt(tour.u, { x: 0, z: 0 });
      return {
        active: tour.active, auto: tour.auto,
        u: +tour.u.toFixed(4), target: +tour.target.toFixed(4),
        len: +tour.len.toFixed(2),
        nearest: +tourUAt(car.pos.x, car.pos.z).toFixed(4),
        point: { x: +p.x.toFixed(2), z: +p.z.toFixed(2) },
      };
    },
    tourPointAt(u) { const p = tourPointAt(u, { x: 0, z: 0 }); return { x: p.x, z: p.z }; },
    idleMs() { return Math.round(performance.now() - lastUserAt); },
    screenPos(i) {
      const b = World.billboards[i];
      if (!b) return null;
      const v = new THREE.Vector3(b.pos.x, 3.6, b.pos.z);
      v.project(camera);
      return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight, behind: v.z > 1 };
    },
    elements() {
      const el = (s) => { const n = document.querySelector(s); if (!n) return null; const r = n.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), vis: getComputedStyle(n).display !== 'none' && r.width > 0 }; };
      return {
        controls: el('#hud-controls'), dock: el('#dock'), pills: el('#zonebar'), actions: el('#dockactions'),
        dpad: el('#dpad'), speedo: el('#hud-meta'), drawer: el('#drawer'), loader: el('#loader'),
        tourBtn: el('#tourBtn'), projBtn: el('#projBtn'), contactBtn: el('#contactBtn'), toast: el('#toast'),
        vw: window.innerWidth, vh: window.innerHeight,
        scrollH: document.documentElement.scrollHeight,
      };
    },
    state() {
      const np = World.nearestPond ? World.nearestPond(car.pos) : { dist: 999, pond: null };
      return {
        ready: !!window.__ready,
        car: car ? { x: +car.pos.x.toFixed(2), y: +car.pos.y.toFixed(2), z: +car.pos.z.toFixed(2), speed: +car.speed.toFixed(2), heading: +car.heading.toFixed(3), steer: +car.steer.toFixed(2), airborne: car.airborne } : null,
        drawerOpen: drawerOpen,
        drawerKind: drawer.dataset.kind || '',
        textures: World.assets,
        imgOk: window.__imgOk,
        imgFail: window.__imgFail,
        errors: window.__errors.slice(0, 8),
        zones: Object.keys(World.ZONES),
        billboards: World.billboards.length,
        props: World.props.length,
        colliders: World.colliders.length,
        ponds: (World.PONDS || []).map((p) => ({ x: p.x, z: p.z, r: p.r, level: +p.level.toFixed(2) })),
        pondDist: +np.dist.toFixed(2),
        tourDone: tour.done,
        fps: frame,
      };
    },
    audioState() {
      const np = World.nearestPond ? World.nearestPond(car.pos) : { dist: 999 };
      return {
        on: Sound.on,
        ctx: !!Sound.ctx,
        state: Sound.ctx ? Sound.ctx.state : 'none',
        waterTarget: +Sound.waterTarget.toFixed(4),
        waterGain: Sound.waterGain ? +Sound.waterGain.gain.value.toFixed(4) : 0,
        pondDist: +np.dist.toFixed(2),
      };
    },
    resetProximity() { prox.states = {}; prox.autoCloseIn = 0; },
    terrainHeight(x, z) { return +World.groundHeight(x, z).toFixed(3); },
    roadClearance() {
      /* min distance from every collider centre to the nearest road centre line */
      let worst = 1e9, at = null;
      World.colliders.forEach((c) => {
        let best = 1e9, bw = 9;
        World.ROADS.forEach((r) => {
          for (let i = 0; i < r.pts.length - 1; i++) {
            const a = r.pts[i], b = r.pts[i + 1];
            const dx = b[0] - a[0], dz = b[1] - a[1];
            const l2 = dx * dx + dz * dz || 1;
            let k = ((c.x - a[0]) * dx + (c.z - a[1]) * dz) / l2;
            k = Math.max(0, Math.min(1, k));
            const d = Math.hypot(c.x - (a[0] + dx * k), c.z - (a[1] + dz * k)) - r.w * 0.5 - 1.2;
            if (d < best) { best = d; bw = r.w; }
          }
        });
        if (best < worst) { worst = best; at = { x: +c.x.toFixed(1), z: +c.z.toFixed(1), type: c.type, d: +best.toFixed(2) }; }
      });
      return { clearance: +worst.toFixed(2), at };
    },
  };
})();
