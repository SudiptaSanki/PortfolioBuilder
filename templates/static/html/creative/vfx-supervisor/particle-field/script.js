/* ============================================================
   PARTICLE FIELD — site script
   1. Shot-list mobile nav
   2. The Wedge Bench — a working particle wedge with a
      production readout (the sketch is a briefing tool)
   3. Bid form — validation, confirmation, setup prefill
   No audio anywhere: film FX is a visual trade.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Shot-list mobile nav ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('shot-panel');
  if (btn && panel) {
    var close = function () {
      btn.setAttribute('aria-expanded', 'false');
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    };
    var open = function () {
      btn.setAttribute('aria-expanded', 'true');
      panel.classList.add('open');
      panel.removeAttribute('aria-hidden');
      var first = panel.querySelector('a');
      if (first) first.focus();
    };
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-expanded') === 'true') { close(); btn.focus(); }
      else { open(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        close(); btn.focus();
      }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
  }

  /* ---------- 2. The Wedge Bench ---------- */
  var canvas = document.getElementById('wedge-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var poster = document.getElementById('wedge-poster');
    var note = document.getElementById('bench-note');
    var fpsEl = document.getElementById('bench-fps');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var COLOURWAYS = {
      ember:     { label: 'Ember',     cols: ['#ffe3b3', '#ffb347', '#ff7847', '#e2483d'] },
      cryo:      { label: 'Cryo',      cols: ['#f2faff', '#bfe3ff', '#5fb4ff', '#7ee0d2'] },
      verdigris: { label: 'Verdigris', cols: ['#f4ffd9', '#a8e063', '#3fa46a', '#d9c25f'] }
    };
    var BEHAVIOURS = ['burst', 'fountain', 'vortex', 'fallout'];

    var state = {
      behaviour: 'burst',
      colourway: 'ember',
      count: 1200,
      energy: 100,      /* percent */
      turbulence: 35,   /* 0..100 */
      running: true,
      burstTimer: 0
    };

    /* deterministic seed so the static frame is the same wedge every load */
    var seed = 41;
    var rand = function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    var W = 0, H = 0, DPR = 1;
    function sizeCanvas() {
      DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    var particles = [];
    function spawn(p, cx, cy) {
      var e = state.energy / 100;
      var t = state.turbulence / 100;
      var a, sp;
      p.colour = COLOURWAYS[state.colourway].cols[(rand() * 4) | 0];
      p.size = 0.8 + rand() * 2.1;
      p.maxLife = 90 + rand() * 130;
      p.life = p.maxLife;
      if (state.behaviour === 'burst') {
        a = rand() * Math.PI * 2;
        sp = (0.6 + Math.pow(rand(), 1.6) * 5.4) * e;
        p.x = cx; p.y = cy;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 0.4;
      } else if (state.behaviour === 'fountain') {
        p.x = cx + (rand() - 0.5) * W * 0.06; p.y = H - 4;
        p.vx = (rand() - 0.5) * 0.9;
        p.vy = -(5.2 + rand() * 3.6) * e;
        p.maxLife = 150 + rand() * 90; p.life = p.maxLife;
      } else if (state.behaviour === 'vortex') {
        a = rand() * Math.PI * 2;
        var r = 30 + rand() * Math.min(W, H) * 0.3;
        p.x = cx + Math.cos(a) * r; p.y = cy + Math.sin(a) * r;
        p.vx = -Math.sin(a) * (1.4 + rand() * 1.6) * e;
        p.vy = Math.cos(a) * (1.4 + rand() * 1.6) * e;
      } else { /* fallout */
        p.x = rand() * W; p.y = -4;
        p.vx = (rand() - 0.5) * 0.4;
        p.vy = (0.5 + rand() * 1.1) * (0.6 + e * 0.5);
        p.maxLife = 320 + rand() * 160; p.life = p.maxLife;
        p.phase = rand() * Math.PI * 2;
      }
      p.turb = (rand() - 0.5) * 0.24 * t;
      return p;
    }

    function step() {
      var cx = W / 2, cy = H / 2;
      var grav = state.behaviour === 'fountain' ? 0.14 :
                 state.behaviour === 'burst' ? 0.045 : 0;
      /* emission */
      if (state.behaviour === 'burst') {
        state.burstTimer -= 1;
        if (state.burstTimer <= 0) {
          var n = Math.round(state.count / 3);
          for (var i = 0; i < n; i++) particles.push(spawn({}, cx, cy));
          state.burstTimer = 165;
        }
      } else {
        var deficit = state.count - particles.length;
        var emit = Math.min(Math.max(0, deficit), 60);
        for (var j = 0; j < emit; j++) particles.push(spawn({}, cx, cy));
      }
      if (particles.length > state.count * 1.6) {
        particles.splice(0, particles.length - Math.round(state.count * 1.6));
      }
      /* integrate */
      ctx.fillStyle = 'rgba(11,12,14,0.30)';
      ctx.fillRect(0, 0, W, H);
      for (var k = particles.length - 1; k >= 0; k--) {
        var p = particles[k];
        p.life -= 1;
        if (p.life <= 0 || p.y > H + 12 || p.x < -12 || p.x > W + 12) {
          particles.splice(k, 1);
          continue;
        }
        if (state.behaviour === 'vortex') {
          var dx = cx - p.x, dy = cy - p.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          p.vx += (dx / d) * 0.045;
          p.vy += (dy / d) * 0.045;
          p.vx *= 0.985; p.vy *= 0.985;
        } else if (state.behaviour === 'fallout') {
          p.phase += 0.03;
          p.vx += Math.sin(p.phase) * 0.012 * (0.4 + state.turbulence / 100);
        } else {
          p.vy += grav;
          p.vx *= 0.992; p.vy *= 0.992;
        }
        p.vx += p.turb * Math.sin(p.life * 0.05);
        p.x += p.vx; p.y += p.vy;
        var fade = Math.min(1, p.life / (p.maxLife * 0.35));
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.colour;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }

    var rafId = null, lastT = 0, fpsEMA = 60, frameCount = 0;
    function loop(t) {
      if (!state.running) { rafId = null; return; }
      if (lastT) {
        var dt = t - lastT;
        if (dt > 0) fpsEMA = fpsEMA * 0.92 + (1000 / dt) * 0.08;
        frameCount += 1;
        if (frameCount % 30 === 0 && fpsEl) {
          fpsEl.innerHTML = 'THIS DEVICE <b>' + Math.round(fpsEMA) + ' FPS</b>';
        }
      }
      lastT = t;
      step();
      rafId = requestAnimationFrame(loop);
    }
    function start() {
      if (rafId === null && state.running && !reduceMotion) {
        lastT = 0;
        rafId = requestAnimationFrame(loop);
      }
    }
    function stop() {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function drawStaticFrame() {
      /* one frozen wedge, rendered instantly — the reduced-motion poster */
      sizeCanvas();
      ctx.fillStyle = '#0b0c0e';
      ctx.fillRect(0, 0, W, H);
      seed = 41;
      var cx = W / 2, cy = H / 2;
      var saved = { behaviour: state.behaviour, count: state.count };
      var frame = [];
      var n = Math.round(state.count / 3);
      var i, p;
      for (i = 0; i < n; i++) frame.push(spawn({}, cx, cy));
      for (var s = 0; s < 70; s++) {
        for (i = 0; i < frame.length; i++) {
          p = frame[i];
          p.vy += 0.045; p.vx *= 0.992; p.vy *= 0.992;
          p.x += p.vx; p.y += p.vy; p.life -= 1;
        }
      }
      for (i = 0; i < frame.length; i++) {
        p = frame[i];
        if (p.life <= 0) continue;
        ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.35));
        ctx.fillStyle = p.colour;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      state.behaviour = saved.behaviour; state.count = saved.count;
      if (note) note.textContent = 'STATIC FRAME — MOTION IS REDUCED IN YOUR BROWSER, SO THE WEDGE IS FROZEN AT FRAME 070.';
    }

    /* ---------- readout: settings -> production language ---------- */
    var readoutEls = {
      code: document.getElementById('ro-code'),
      cls: document.getElementById('ro-class'),
      scale: document.getElementById('ro-scale'),
      cache: document.getElementById('ro-cache'),
      farm: document.getElementById('ro-farm'),
      verdict: document.getElementById('ro-verdict'),
      enquiry: document.getElementById('ro-enquiry')
    };
    function fmt(n) { return n.toLocaleString('en-GB'); }
    function updateReadout() {
      var c = state.count;
      var cls = c <= 800 ? 'A' : (c <= 2000 ? 'B' : 'C');
      var clsName = cls === 'A' ? 'Class A — background element' :
                    cls === 'B' ? 'Class B — mid-ground sim' : 'Class C — hero sim';
      var finalPts = c * 1500;
      var finalTxt = finalPts >= 1000000
        ? (finalTxt = (finalPts / 1000000).toFixed(1).replace(/\.0$/, '') + 'M particles')
        : fmt(finalPts) + ' particles';
      var cacheMB = Math.round(c * 0.039 * (state.behaviour === 'burst' ? 1.25 : 1));
      var farm = cls === 'A' ? '≈ 6 min per frame on one farm node' :
                 cls === 'B' ? '≈ 35 min per frame on one farm node' :
                               '≈ 2.4 hrs per frame across a node pair';
      var code = 'WDG-' + String(c).padStart(4, '0') + ' · ' +
                 state.behaviour.toUpperCase() + ' / ' +
                 COLOURWAYS[state.colourway].label.toUpperCase();
      var verdict = cls === 'A'
        ? 'Wedged in an afternoon and usually approved off the first dailies. This is the class most "invisible" FX lives in.'
        : cls === 'B'
        ? 'Needs a real sim review before the bid is final — three wedge rounds are included in the wedge package for this class.'
        : 'A hero sim: budget for a dedicated TD, checkpointed caches and a farm burst in the final week. Priced per shot, never per day.';
      if (readoutEls.code) readoutEls.code.innerHTML =
        code + ' — <span class="cls">' + clsName + '</span>';
      if (readoutEls.cls) readoutEls.cls.textContent = clsName.split(' — ')[1] || clsName;
      if (readoutEls.scale) readoutEls.scale.innerHTML =
        '≈ ' + finalTxt + ' <span class="dim">(this bench runs at 1:1500 wedge scale)</span>';
      if (readoutEls.cache) readoutEls.cache.textContent =
        '≈ ' + fmt(cacheMB) + ' MB per frame, point cache with attributes';
      if (readoutEls.farm) readoutEls.farm.textContent = farm;
      if (readoutEls.verdict) readoutEls.verdict.innerHTML = '<strong>Wedge note.</strong> ' + verdict;
      if (readoutEls.enquiry) {
        var summary = code + ' | ' + clsName + ' | energy ' + state.energy +
          '% | turbulence ' + state.turbulence + '% | est. cache ' + fmt(cacheMB) + ' MB/frame';
        readoutEls.enquiry.setAttribute('href',
          'contact.html?setup=' + encodeURIComponent(summary));
      }
    }

    /* ---------- controls ---------- */
    function wireSeg(id, attr, cb) {
      var seg = document.getElementById(id);
      if (!seg) return;
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        seg.querySelectorAll('button').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        cb(b.getAttribute(attr));
      });
    }
    wireSeg('seg-behaviour', 'data-behaviour', function (v) {
      state.behaviour = v; particles = []; state.burstTimer = 0;
      if (reduceMotion) drawStaticFrame();
      updateReadout();
    });
    wireSeg('seg-colourway', 'data-colourway', function (v) {
      state.colourway = v;
      if (reduceMotion) drawStaticFrame();
      updateReadout();
    });
    function wireRange(id, outId, key, suffix) {
      var r = document.getElementById(id);
      var out = document.getElementById(outId);
      if (!r) return;
      r.addEventListener('input', function () {
        state[key] = parseInt(r.value, 10);
        if (out) out.textContent = r.value + (suffix || '');
        updateReadout();
      });
    }
    wireRange('rng-count', 'out-count', 'count', '');
    wireRange('rng-energy', 'out-energy', 'energy', '%');
    wireRange('rng-turbulence', 'out-turbulence', 'turbulence', '%');

    var detBtn = document.getElementById('btn-detonate');
    if (detBtn) detBtn.addEventListener('click', function () {
      if (state.behaviour !== 'burst') {
        state.behaviour = 'burst';
        document.querySelectorAll('#seg-behaviour button').forEach(function (x) {
          x.setAttribute('aria-pressed', x.getAttribute('data-behaviour') === 'burst' ? 'true' : 'false');
        });
      }
      particles = [];
      state.burstTimer = 0;
      if (reduceMotion) drawStaticFrame(); else step();
      updateReadout();
    });
    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', function () {
      state.running = !state.running;
      pauseBtn.textContent = state.running ? 'Pause' : 'Resume';
      pauseBtn.setAttribute('aria-pressed', state.running ? 'false' : 'true');
      if (state.running) start(); else stop();
    });

    /* ---------- init ---------- */
    sizeCanvas();
    if (poster) poster.style.display = 'none';
    canvas.style.display = 'block';
    if (reduceMotion) {
      state.running = false;
      if (pauseBtn) { pauseBtn.textContent = 'Resume'; pauseBtn.setAttribute('aria-pressed', 'true'); }
      drawStaticFrame();
    } else {
      ctx.fillStyle = '#0b0c0e';
      ctx.fillRect(0, 0, W, H);
      start();
    }
    updateReadout();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.05 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    var resizeTO;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTO);
      resizeTO = setTimeout(function () {
        sizeCanvas();
        if (reduceMotion) drawStaticFrame();
      }, 180);
    });
  }

  /* ---------- 3. Bid form ---------- */
  var form = document.getElementById('bid-form');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var setup = params.get('setup');
    var attached = document.getElementById('attached-setup');
    var details = document.getElementById('f-details');
    if (setup && attached && details) {
      attached.classList.add('show');
      attached.innerHTML = '<b>WEDGE CONFIGURATION ATTACHED</b> — ' + setup.replace(/</g, '&lt;');
      if (!details.value) {
        details.value = 'Wedge configuration from the bench: ' + setup + '\n\n';
      }
    }

    function fieldInvalid(input, bad) {
      var wrap = input.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    function validate() {
      var ok = true;
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var type = document.getElementById('f-type');
      ok = fieldInvalid(name, !name.value.trim()) && ok;
      ok = fieldInvalid(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = fieldInvalid(type, !type.value) && ok;
      ok = fieldInvalid(details, details.value.trim().length < 20) && ok;
      return ok;
    }
    ['f-name', 'f-email', 'f-type', 'f-details'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { fieldInvalid(el, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var name = document.getElementById('f-name').value.trim();
      var ref = 'PF-2026-' + String(1000 + Math.floor(Math.random() * 9000));
      var conf = document.getElementById('confirm');
      var refEl = document.getElementById('confirm-ref');
      var sumEl = document.getElementById('confirm-summary');
      if (refEl) refEl.textContent = ref;
      if (sumEl) {
        sumEl.innerHTML = 'Thank you, <strong>' + name.replace(/</g, '&lt;') +
          '</strong>. Your bid request is logged under reference <strong>' + ref +
          '</strong>. On a live engagement the reply comes within one working day, ' +
          'with a wedge plan and a per-shot bid — not a day-rate guess.';
      }
      form.style.display = 'none';
      if (conf) {
        conf.classList.add('show');
        conf.setAttribute('tabindex', '-1');
        conf.focus();
      }
      window.scrollTo({ top: form.offsetTop - 90, behavior: 'smooth' });
    });
  }
})();
