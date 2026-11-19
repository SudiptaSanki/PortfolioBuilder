/* ============================================================
   APP — camera rig, guided path, free roam, HUD, drawers
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const canvas = $('#scene');
  const loaderEl = $('#loader');
  const loadPct = $('#loadPct');
  const loadBar = $('#loadBar');

  /* ---------------- path ---------------- */
  const KEYS = [
    { p: [0, 2.35, 46], l: [0, 4.4, 16] },
    { p: [0.4, 2.30, 34], l: [0, 4.0, 20] },
    { p: [0, 2.25, 24], l: [0, 3.8, 10] },
    { p: [0, 2.55, 14], l: [0, 3.9, -2] },
    { p: [-0.6, 2.65, 7], l: [-1.2, 3.7, -10] },
    { p: [0.6, 2.70, 2], l: [1.2, 3.75, -10] },
    { p: [0, 2.75, -14], l: [0, 3.3, -28] },
    { p: [0, 2.85, -27], l: [0, 3.7, -44] },
    { p: [0, 2.85, -33], l: [0, 3.7, -48] },
    { p: [0, 2.70, -51], l: [0, 3.0, -64] },
    { p: [0, 2.80, -53.5], l: [0, 3.2, -64.5] },
  ];
  const posCurve = new THREE.CatmullRomCurve3(KEYS.map(k => new THREE.Vector3(...k.p)), false, 'catmullrom', 0.35);
  const lookCurve = new THREE.CatmullRomCurve3(KEYS.map(k => new THREE.Vector3(...k.l)), false, 'catmullrom', 0.35);

  const ZONE_T = [0, 0.42, 0.80, 1];
  const ZONE_RANGES = [[0, 0.30], [0.30, 0.68], [0.68, 0.94], [0.94, 1.001]];

  const rig = {
    p: new THREE.Vector3(...KEYS[0].p),
    look: new THREE.Vector3(...KEYS[0].l),
    t: 0,
    cur: 0,
    mode: 'path',        // path | free | focus
    yaw: 0,
    pitch: 0,
    vel: new THREE.Vector3(),
    focus: null,
    fov: 58,
  };

  const _p = new THREE.Vector3(), _l = new THREE.Vector3();
  const _fp = new THREE.Vector3(), _fl = new THREE.Vector3();

  let camera, renderer;
  const keysDown = {};
  let pointerDown = false, dragged = false, lastX = 0, lastY = 0;
  let downX = 0, downY = 0;   // where the gesture started (tap vs swipe)
  const COARSE = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
  let hovered = null, workIndex = 0, lastHitAt = 0;
  const pointer = { x: 0, y: 0 };
  let drawerOpen = false, menuOpen = false, drawerOpenedAt = 0;

  /* ---------------- boot ---------------- */
  function boot() {
    // heavy first frames must not stretch tween time (GSAP clamps long frames)
    gsap.ticker.lagSmoothing(0);
    const w = World.init(canvas);
    camera = w.camera;
    renderer = w.renderer;

    for (let i = 0; i < WORKS.length; i++) World.addWork(i);

    const texLoader = new THREE.TextureLoader();
    texLoader.setCrossOrigin('anonymous');
    let done = 0;
    const total = WORKS.length + 1;
    const tick = () => {
      done++;
      const pct = Math.round((done / total) * 100);
      loadPct.textContent = String(pct).padStart(3, '0');
      loadBar.style.width = pct + '%';
    };

    WORKS.forEach((w, i) => {
      texLoader.load(w.img, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        World.setWorkImage(i, tex);
        tick();
      }, undefined, () => tick());
    });

    // preload the first detail image so the drawer opens instantly
    const pre = new Image();
    pre.onload = () => { tick(); };
    pre.onerror = () => { tick(); };
    pre.src = WORKS[0].detail;

    buildUI();
    startLoop();

    const started = Date.now();
    const waitFor = () => {
      const min = 900;
      const elapsed = Date.now() - started;
      if (elapsed < min) return setTimeout(waitFor, min - elapsed);
      hideLoader();
    };
    setTimeout(waitFor, 400);
  }

  function hideLoader() {
    gsap.to(loaderEl, {
      autoAlpha: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.15,
      onComplete: () => { loaderEl.style.display = 'none'; },
    });
    // safety: never leave the overlay hanging if a tween is starved
    setTimeout(() => { loaderEl.style.display = 'none'; }, 2600);
    intro();
  }

  function intro() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.topbar', { y: -18, autoAlpha: 0, duration: 0.9 }, 0.1)
      .from('.zones .zone', { x: -18, autoAlpha: 0, duration: 0.7, stagger: 0.07 }, 0.25)
      .from('.bottombar > *', { y: 16, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.35)
      .from('.hero-kicker', { y: 14, autoAlpha: 0, duration: 0.7 }, 0.5)
      .from('.hero-title', { y: 40, autoAlpha: 0, duration: 1.2 }, 0.55)
      .from('.hero-foot', { y: 16, autoAlpha: 0, duration: 0.8 }, 0.85)
      .from('.scroll-cue', { autoAlpha: 0, duration: 0.8 }, 1.2);
  }

  /* ---------------- loop ---------------- */
  let last = performance.now(), hoverTimer = 0;

  function startLoop() {
    renderer.setAnimationLoop(loop);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  }

  function loop(now) {
    const dt = Math.min(0.2, (now - last) / 1000);
    last = now;
    const t = now / 1000;

    updateCamera(dt, t);
    World.update(dt, t);
    renderer.render(World.scene, camera);

    // heading + zone readout
    const heading = ((rig.yaw * 180 / Math.PI) % 360 + 360) % 360;
    $('#heading').textContent = String(Math.round(heading)).padStart(3, '0') + '°';
    $('#compassNeedle').style.transform = `rotate(${-heading}deg)`;

    if (++hoverTimer % 4 === 0) updateHover();
  }

  /* ---------------- camera ---------------- */
  function updateCamera(dt, t) {
    if (rig.mode === 'free') {
      const accel = 34;
      const damp = 7.5;
      const speed = keysDown['shift'] ? 2.1 : 1;

      const fwd = new THREE.Vector3(Math.sin(rig.yaw), 0, -Math.cos(rig.yaw));
      const right = new THREE.Vector3(Math.cos(rig.yaw), 0, Math.sin(rig.yaw));
      const wish = new THREE.Vector3();
      if (keysDown['w'] || keysDown['arrowup']) wish.add(fwd);
      if (keysDown['s'] || keysDown['arrowdown']) wish.sub(fwd);
      if (keysDown['d'] || keysDown['arrowright']) wish.add(right);
      if (keysDown['a'] || keysDown['arrowleft']) wish.sub(right);
      if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(accel * speed);

      rig.vel.lerp(wish, 1 - Math.exp(-damp * dt));
      rig.p.addScaledVector(rig.vel, dt);
      rig.p.x = clamp(rig.p.x, -46, 46);
      rig.p.z = clamp(rig.p.z, -80, 54);
      rig.p.y = clamp(rig.p.y, 1.4, 8);

      const bob = Math.sin(t * 7) * 0.035 * Math.min(1, rig.vel.length() / 6);
      const dir = new THREE.Vector3(
        Math.sin(rig.yaw) * Math.cos(rig.pitch),
        Math.sin(rig.pitch),
        -Math.cos(rig.yaw) * Math.cos(rig.pitch)
      );
      rig.look.copy(rig.p).add(dir);
      camera.position.copy(rig.p).setY(rig.p.y + bob);
      camera.lookAt(rig.look);
      return;
    }

    // guided path (also the base under a focus zoom)
    rig.cur += (rig.t - rig.cur) * (1 - Math.exp(-5.5 * dt));
    if (Math.abs(rig.t - rig.cur) < 0.0002) rig.cur = rig.t;
    posCurve.getPoint(clamp(rig.cur, 0, 1), _p);
    lookCurve.getPoint(clamp(rig.cur, 0, 1), _l);

    if (rig.focus) {
      const m = rig.focus.mix;
      _fp.copy(rig.focus.pos); _fl.copy(rig.focus.look);
      _p.lerp(_fp, m);
      _l.lerp(_fl, m);
    }

    // gentle breathing so the world never feels frozen
    _p.y += Math.sin(t * 0.9) * 0.03;

    rig.p.lerp(_p, 1 - Math.exp(-9 * dt));
    rig.look.lerp(_l, 1 - Math.exp(-9 * dt));
    camera.position.copy(rig.p);
    camera.lookAt(rig.look);

    // keep yaw in sync for compass + free-roam hand-off
    const d = new THREE.Vector3().subVectors(rig.look, rig.p).normalize();
    rig.yaw = Math.atan2(d.x, -d.z);
    rig.pitch = Math.asin(clamp(d.y, -1, 1));

    const portrait = window.innerHeight > window.innerWidth * 1.15;
    const baseFov = portrait ? 84 : 58;
    const targetFov = rig.focus ? baseFov - 14 : baseFov;
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov = lerp(camera.fov, targetFov, 1 - Math.exp(-6 * dt));
      camera.updateProjectionMatrix();
    }
  }

  /* ---------------- scroll ---------------- */
  function initScroll() {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: '.scroll-space',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => {
        const p = self.progress;
        // scrolling always drives the guided camera: even if free roam was
        // entered with a mouse drag or WASD, the scroll takes the rig back
        // onto the path instead of freezing the 3D animation
        if (rig.mode === 'free') { rig.t = p; setMode('path'); }
        if (rig.mode !== 'focus') rig.t = p;
        updateProgressUI(p);
        updateHero(p);
      },
    });

    // and any wheel / touch scroll reclaims the path immediately
    window.addEventListener('wheel', reclaimPath, { passive: true });
    window.addEventListener('scroll', reclaimPath, { passive: true });
    window.addEventListener('touchmove', reclaimPath, { passive: true });

    // keep the rail honest after layout changes
    ScrollTrigger.refresh();
  }

  function reclaimPath() {
    if (rig.mode !== 'free') return;
    const m = maxScroll();
    rig.t = m > 0 ? clamp(window.scrollY / m, 0, 1) : 0;
    setMode('path');
  }

  let lastUIProgress = -1;
  function updateProgressUI(p) {
    if (Math.abs(p - lastUIProgress) < 0.0005) return;
    lastUIProgress = p;
    $('#railFill').style.width = (p * 100) + '%';
    $('#railKnob').style.left = (p * 100) + '%';

    const zone = zoneForT(p);
    setZoneLabel(zone);
    $$('.rail-dots i').forEach((d, i) => d.classList.toggle('on', i <= zone));
  }

  function updateHero(p) {
    const hero = $('#hero');
    const o = clamp(1 - p * 7, 0, 1);
    hero.style.opacity = o;
    hero.style.transform = `translateY(${-p * 60}px)`;
    hero.style.visibility = o <= 0.01 ? 'hidden' : 'visible';
    const cue = $('#scrollCue');
    cue.style.opacity = clamp(1 - p * 14, 0, 1);
  }

  function zoneForT(t) {
    for (let i = 0; i < ZONE_RANGES.length; i++) {
      if (t >= ZONE_RANGES[i][0] && t < ZONE_RANGES[i][1]) return i;
    }
    return 3;
  }

  let currentZone = -1;
  function setZoneLabel(i) {
    if (i === currentZone) return;
    currentZone = i;
    $('#zoneName').textContent = ZONES[i].name;
    $('#chapter').textContent = ZONES[i].chapter;
    $$('.zones .zone').forEach((b, k) => b.classList.toggle('active', k === i));
    syncWorksIndex();
    $$('.rail-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
  }

  function syncWorksIndex() {
    const wi = $('#worksIndex');
    if (!wi) return;
    wi.classList.toggle('show', currentZone === 1 && !drawerOpen && !menuOpen);
  }

  function maxScroll() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  function goToZone(i) {
    const t = ZONE_T[i];
    setMode('path');
    closeAll();
    window.scrollTo({ top: t * maxScroll(), behavior: 'smooth' });
  }

  /* ---------------- modes ---------------- */
  function setMode(m) {
    if (rig.mode === m) return;
    if (m === 'free') {
      rig.p.copy(camera.position);
      const d = new THREE.Vector3().subVectors(rig.look, rig.p).normalize();
      rig.yaw = Math.atan2(d.x, -d.z);
      rig.pitch = Math.asin(clamp(d.y, -1, 1)) * 0.6;
      rig.vel.set(0, 0, 0);
      rig.focus = null;
    }
    if (m === 'path') {
      rig.cur = rig.t;
      rig.focus = null;
    }
    rig.mode = m;
    const el = $('#mode');
    if (m === 'free') {
      el.textContent = COARSE ? 'FREE ROAM — TAP' : 'FREE ROAM — ESC';
      el.style.color = 'var(--amber)';
      el.classList.add('is-free');
      el.setAttribute('aria-pressed', 'true');
      el.title = 'Free roam is on — press to return to the guided scroll path';
      document.body.classList.add('is-free');
    } else {
      el.textContent = 'GUIDED PATH';
      el.style.color = '';
      el.classList.remove('is-free');
      el.setAttribute('aria-pressed', 'false');
      el.title = 'Camera follows the scroll path — press for free roam';
      document.body.classList.remove('is-free');
    }
  }

  function updateHover() {
    if (drawerOpen || menuOpen) {
      if (hovered) { hovered = null; document.body.classList.remove('is-hover'); }
      showTip(false);
      World.setHover(-1);
      return;
    }
    const ndc = new THREE.Vector2(
      (pointer.x / window.innerWidth) * 2 - 1,
      -(pointer.y / window.innerHeight) * 2 + 1
    );
    const hit = World.pick(ndc, camera);
    const tip = $('#tip');
    if (hit && (hit.type === 'work' || hit.type === 'contact')) lastHitAt = performance.now();
    if (hit && hit.type === 'work') {
      const w = WORKS[hit.index];
      if (!hovered) document.body.classList.add('is-hover');
      hovered = true;
      $('#tipNo').textContent = w.no;
      $('#tipTitle').textContent = w.title;
      $('.tip-cue').textContent = 'CLICK TO OPEN';
      World.setHover(hit.index);
      showTip(true);
    } else if (hit && hit.type === 'contact') {
      if (!hovered) document.body.classList.add('is-hover');
      hovered = true;
      $('#tipNo').textContent = '04';
      $('#tipTitle').textContent = 'Contact Pavilion';
      $('.tip-cue').textContent = 'CLICK TO OPEN';
      World.setHover(-1);
      showTip(true);
    } else if (performance.now() - lastHitAt > 220) {
      if (hovered) { hovered = null; document.body.classList.remove('is-hover'); }
      World.setHover(-1);
      showTip(false);
    }
  }

  function showTip(on) {
    const tip = $('#tip');
    if (!on) { tip.classList.remove('show'); return; }
    const x = Math.min(window.innerWidth - 240, pointer.x + 18);
    const y = Math.min(window.innerHeight - 60, pointer.y + 18);
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.classList.add('show');
  }

  /* ---------------- picking / input ---------------- */
  function initInput() {
    canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      pointerDown = true; dragged = false;
      lastX = e.clientX; lastY = e.clientY;
      downX = e.clientX; downY = e.clientY;
      pointer.x = e.clientX; pointer.y = e.clientY;

      // A finger on the glass belongs to the page, not to the camera:
      // no pointer capture, no drag-look, no free roam — a vertical swipe
      // must scroll and let ScrollTrigger glide the camera through the zones.
      if (e.pointerType === 'touch') return;

      document.body.classList.add('is-drag');
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* no capture needed */ }
    });

    canvas.addEventListener('pointermove', e => {
      pointer.x = e.clientX; pointer.y = e.clientY;
      if (!pointerDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
      lastX = e.clientX; lastY = e.clientY;
      if (e.pointerType === 'touch') return;   // swipe = page scroll
      if (dragged) {
        if (rig.mode !== 'free') setMode('free');
        rig.yaw += dx * 0.0026;
        rig.pitch = clamp(rig.pitch - dy * 0.0022, -0.9, 0.9);
      }
    });

    const endDrag = e => {
      document.body.classList.remove('is-drag');
      if (!pointerDown) return;
      pointerDown = false;
      // any real travel (a swipe that scrolled, or a look-around drag) is not a tap
      if (dragged || Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 8) return;
      // a clean click: pick a piece
      const ndc = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const hit = World.pick(ndc, camera);
      if (!hit) return;
      if (hit.type === 'work') openWork(hit.index);
      else if (hit.type === 'contact') openContact();
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', () => {
      pointerDown = false; dragged = false;
      document.body.classList.remove('is-drag');
    });
    // a touch that starts on the canvas but is released elsewhere must not leave a stuck state
    window.addEventListener('pointerup', e => {
      if (e.pointerType === 'touch') { pointerDown = false; dragged = false; }
    }, { passive: true });

    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
        if (e.repeat) return;
        if (!drawerOpen && !menuOpen) {
          keysDown[k] = true;
          if (rig.mode !== 'free') setMode('free');
        }
        return;
      }
      if (k === 'escape') {
        if (drawerOpen) { closeAll(); return; }
        if (menuOpen) { toggleMenu(false); return; }
        if (rig.mode === 'free') setMode('path');
      }
      if (k === 'm') toggleMenu(!menuOpen);
    });
    window.addEventListener('keyup', e => { keysDown[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { for (const k in keysDown) keysDown[k] = false; });
  }

  /* ---------------- UI ---------------- */
  function buildUI() {
    // compass ticks
    const ticks = $('#compassTicks');
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r1 = i % 9 === 0 ? 34 : 39;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 50 + Math.sin(a) * r1);
      line.setAttribute('y1', 50 - Math.cos(a) * r1);
      line.setAttribute('x2', 50 + Math.sin(a) * 44);
      line.setAttribute('y2', 50 - Math.cos(a) * 44);
      if (i % 9 === 0) line.setAttribute('class', 'major');
      ticks.appendChild(line);
    }

    // rail dots at zone stops
    const dots = $('#railDots');
    ZONE_T.forEach((t, i) => {
      const d = document.createElement('i');
      d.style.left = (t * 100) + '%';
      d.style.top = '50%';
      d.style.marginTop = '-2.5px';
      d.style.marginLeft = '-2.5px';
      d.title = ZONES[i].short;
      dots.appendChild(d);
    });

    // zone buttons
    $$('[data-zone]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        goToZone(parseInt(el.dataset.zone, 10));
      });
    });

    // rail scrubbing
    const rail = $('#rail');
    const scrub = e => {
      const r = rail.getBoundingClientRect();
      const t = clamp((e.clientX - r.left) / r.width, 0, 1);
      setMode('path');
      window.scrollTo(0, t * maxScroll());
    };
    rail.addEventListener('pointerdown', e => {
      try { rail.setPointerCapture(e.pointerId); } catch (_) { /* no capture needed */ }
      scrub(e); rail._down = true;
    });
    rail.addEventListener('pointermove', e => { if (rail._down) scrub(e); });
    rail.addEventListener('pointerup', () => { rail._down = false; });

    // the mode badge is a real button: one tap/click switches between the
    // guided scroll path and free roam (the way back needs no keyboard)
    const modeBtn = $('#mode');
    modeBtn.addEventListener('click', () => {
      if (rig.mode === 'free') setMode('path');
      else if (rig.mode === 'path') setMode('free');
    });

    // works index (HUD cards)
    const list = $('#worksList');
    WORKS.forEach((w, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<button data-work="${i}"><span class="w-t">${w.title}</span><span class="w-no">${w.no}</span></button>`;
      list.appendChild(li);
    });
    $$('[data-work]').forEach(b => b.addEventListener('click', () => openWork(parseInt(b.dataset.work, 10))));

    // menu
    $('#menuBtn').addEventListener('click', () => toggleMenu(!menuOpen));
    $('#menuClose').addEventListener('click', () => toggleMenu(false));

    // drawers
    $('#drawerClose').addEventListener('click', closeAll);
    $('#contactClose').addEventListener('click', closeAll);
    $('#scrim').addEventListener('click', () => {
      // a tap that opened a drawer also produces a stray click on the scrim
      // right after it — ignore that one instead of closing the drawer at once
      if (performance.now() - drawerOpenedAt < 600) return;
      closeAll();
    });
    $('#csNext').addEventListener('click', () => openWork((workIndex + 1) % WORKS.length));

    gsap.set('#menu', { yPercent: -100, visibility: 'hidden', pointerEvents: 'none' });
    gsap.set(['#drawer', '#contact'], { xPercent: 100, visibility: 'hidden' });
    gsap.set('#scrim', { opacity: 0, pointerEvents: 'none' });

    initScroll();
    initInput();
  }

  function toggleMenu(open) {
    menuOpen = open;
    const m = $('#menu');
    $('#menuBtn').setAttribute('aria-expanded', String(open));
    if (open) {
      m.style.visibility = 'visible';
      m.style.pointerEvents = 'auto';
      document.body.classList.add('locked');
      gsap.to(m, { yPercent: 0, duration: 0.75, ease: 'power4.inOut' });
      gsap.fromTo('.menu-list li', { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, delay: 0.2, ease: 'power3.out' });
    } else {
      gsap.to(m, {
        yPercent: -100, duration: 0.6, ease: 'power4.inOut',
        onComplete: () => { m.style.visibility = 'hidden'; m.style.pointerEvents = 'none'; document.body.classList.remove('locked'); },
      });
    }
  }

  /* ---------------- case study ---------------- */
  function fillDrawer(i) {
    const w = WORKS[i];
    workIndex = i;
    $('#csIndex').textContent = `CASE STUDY ${w.no} / 06`;
    $('#csTitle').textContent = w.title;
    $('#csMeta').innerHTML = [
      ['YEAR', w.year], ['CLIENT', w.client],
      ['ROLE', w.role], ['TYPE', w.type],
    ].map(([k, v]) => `<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');
    $('#csBlurb').textContent = w.blurb;
    const i1 = $('#csImg1'), i2 = $('#csImg2');
    i1.src = w.img; i1.alt = w.title + ' — main image';
    i2.src = w.detail; i2.alt = w.title + ' — detail image';
    $('#csCap1').textContent = w.cap1;
    $('#csCap2').textContent = w.cap2;
    $('#csTags').innerHTML = w.tags.map(t => `<li>${t}</li>`).join('');
    const next = WORKS[(i + 1) % WORKS.length];
    $('#csNextName').textContent = `${next.title} →`;
    $('#drawerScroll').scrollTop = 0;
  }

  function openWork(i) {
    fillDrawer(i);
    drawerOpen = true;
    openDrawerPanel($('#drawer'));
    focusCamera(World.focusFor(i));
  }

  function openContact() {
    drawerOpen = true;
    openDrawerPanel($('#contact'));
    focusCamera(World.contactFocus());
  }

  function openDrawerPanel(el) {
    closeMenuIfAny();
    drawerOpenedAt = performance.now();
    el.setAttribute('aria-hidden', 'false');
    el.style.visibility = 'visible';
    gsap.killTweensOf(el);
    gsap.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.85, ease: 'power4.inOut' });
    gsap.set('#scrim', { pointerEvents: 'auto' });
    gsap.to('#scrim', { opacity: 1, duration: 0.5 });
    document.body.classList.add('locked');
    syncWorksIndex();
  }

  function closeMenuIfAny() {
    if (menuOpen) toggleMenu(false);
  }

  function closeAll() {
    if (!drawerOpen) return;
    drawerOpen = false;
    [$('#drawer'), $('#contact')].forEach(el => {
      gsap.to(el, {
        xPercent: 100, duration: 0.6, ease: 'power4.inOut',
        onComplete: () => { el.style.visibility = 'hidden'; el.setAttribute('aria-hidden', 'true'); },
      });
    });
    gsap.to('#scrim', { opacity: 0, duration: 0.4, onComplete: () => gsap.set('#scrim', { pointerEvents: 'none' }) });
    document.body.classList.remove('locked');
    syncWorksIndex();
    if (rig.focus) {
      gsap.to(rig.focus, {
        mix: 0, duration: 0.9, ease: 'power3.inOut',
        onComplete: () => { rig.focus = null; rig.mode = 'path'; },
      });
    }
  }

  function focusCamera(target) {
    if (rig.mode !== 'free' && rig.mode !== 'path' && !rig.focus) {
      // fall through: focus is layered on the path camera
    }
    const start = {
      pos: rig.p.clone(),
      look: rig.look.clone(),
    };
    rig.focus = {
      pos: target.pos.clone(),
      look: target.look.clone(),
      mix: 0,
    };
    rig.mode = 'focus';
    gsap.to(rig.focus, { mix: 1, duration: 1.1, ease: 'power3.inOut' });
    // make sure the path parameters are current so returning is smooth
    return start;
  }

  /* ---------------- go ---------------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(boot, 0));
  } else {
    window.addEventListener('load', boot);
  }
})();
