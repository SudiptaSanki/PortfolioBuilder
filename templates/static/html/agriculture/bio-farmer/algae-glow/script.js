/* Nightwater Cultures — photobioreactor canvas, culture states, enquiry form. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  window.addEventListener('load', function () { document.body.classList.add('loaded'); });

  /* ---------- reactor ---------- */
  var canvas = document.getElementById('reactor');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var W = 900, H = 620, DPR = 2;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);

    var lightEl = document.getElementById('light');
    var stirEl = document.getElementById('stir');
    var lightVal = document.getElementById('lightVal');
    var stirVal = document.getElementById('stirVal');
    var cycleVal = document.getElementById('cycleVal');
    var outGlow = document.getElementById('outGlow');
    var outYield = document.getElementById('outYield');
    var stageState = document.getElementById('stageState');
    var stageRead = document.getElementById('stageRead');
    var stimBtn = document.getElementById('stimBtn');

    var state = {
      light: 6000,
      stir: 45,
      dark: false,
      energy: 0.65,
      density: 1.2,
      flash: 0,
      cap: null,
      message: ''
    };

    var N = 5;
    var tubes = [];
    var TUBE_TOP = 132, TUBE_BOT = 540, TUBE_W = 92;
    var totalW = N * TUBE_W + (N - 1) * 34;
    var startX = (W - totalW) / 2;

    for (var i = 0; i < N; i++) {
      var tx = startX + i * (TUBE_W + 34);
      var cells = [];
      for (var j = 0; j < 82; j++) {
        cells.push({
          x: tx + 12 + Math.random() * (TUBE_W - 24),
          y: TUBE_TOP + 24 + Math.random() * (TUBE_BOT - TUBE_TOP - 48),
          r: 0.7 + Math.random() * 1.5,
          ph: Math.random() * Math.PI * 2,
          sp: 0.4 + Math.random() * 0.8
        });
      }
      tubes.push({ x: tx, cells: cells });
    }

    function photosynthesis() {
      if (state.dark) return 0;
      return Math.min(1, state.light / 8000);
    }

    function stirFactor() {
      return 0.25 + (state.stir / 100) * 0.75;
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function draw(t) {
      var p = photosynthesis();
      var s = stirFactor();

      ctx.fillStyle = '#040e14';
      ctx.fillRect(0, 0, W, H);

      // depth ruler
      ctx.strokeStyle = 'rgba(120,150,160,0.25)';
      ctx.fillStyle = 'rgba(120,150,160,0.75)';
      ctx.lineWidth = 1;
      ctx.font = '10px "IBM Plex Mono", monospace';
      for (var d = 0; d < 8; d++) {
        var y = 140 + d * 56;
        ctx.beginPath();
        ctx.moveTo(26, y);
        ctx.lineTo(d % 2 === 0 ? 44 : 36, y);
        ctx.stroke();
        if (d % 2 === 0) ctx.fillText('-' + d * 2 + ' m', 6, y + 3);
      }

      // light bar above the array
      var barW = totalW;
      ctx.fillStyle = 'rgba(214,240,242,0.08)';
      ctx.fillRect(startX, 96, barW, 3);
      ctx.fillStyle = 'rgba(79,230,214,' + (0.15 + p * 0.75) + ')';
      ctx.fillRect(startX, 96, barW * (state.dark ? 0.04 : Math.max(0.04, state.light / 12000)), 3);

      tubes.forEach(function (tube, idx) {
        // soft culture halo
        if (!state.dark) {
          var hx = tube.x + TUBE_W / 2, hy = (TUBE_TOP + TUBE_BOT) / 2;
          var halo = ctx.createRadialGradient(hx, hy, 10, hx, hy, 120);
          halo.addColorStop(0, 'rgba(79,230,214,' + (0.05 + p * 0.07) + ')');
          halo.addColorStop(1, 'rgba(79,230,214,0)');
          ctx.fillStyle = halo;
          ctx.fillRect(hx - 120, hy - 150, 240, 300);
        }
        // glass
        roundRect(tube.x, TUBE_TOP, TUBE_W, TUBE_BOT - TUBE_TOP, TUBE_W / 2);
        ctx.fillStyle = state.dark ? 'rgba(18,54,60,0.6)' : 'rgba(30,116,116,' + (0.26 + p * 0.3) + ')';
        ctx.fill();
        ctx.strokeStyle = state.dark ? 'rgba(79,230,214,0.22)' : 'rgba(79,230,214,' + (0.3 + p * 0.35) + ')';
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // glass highlight
        ctx.strokeStyle = 'rgba(214,240,242,0.10)';
        ctx.beginPath();
        ctx.moveTo(tube.x + 16, TUBE_TOP + 26);
        ctx.lineTo(tube.x + 16, TUBE_BOT - 26);
        ctx.stroke();

        // cells
        tube.cells.forEach(function (c) {
          c.y -= (0.12 + (state.stir / 100) * 1.5) * c.sp * (state.dark ? 0.6 : 1);
          if (c.y < TUBE_TOP + 16) {
            c.y = TUBE_BOT - 16;
            c.x = tube.x + 12 + Math.random() * (TUBE_W - 24);
          }
          var sway = Math.sin(t * 0.0006 + c.ph) * (1 + state.stir / 60);
          var px = c.x + sway;
          var alpha = (0.3 + p * 0.6) * (0.6 + 0.4 * Math.sin(t * 0.001 + c.ph));
          ctx.beginPath();
          ctx.fillStyle = 'rgba(150,246,232,' + Math.max(0.05, alpha) + ')';
          ctx.arc(px, c.y, c.r, 0, Math.PI * 2);
          ctx.fill();

          if (state.flash > 0.02 && Math.random() < 0.5) {
            var g = ctx.createRadialGradient(px, c.y, 0, px, c.y, 9);
            g.addColorStop(0, 'rgba(150,255,240,' + (0.55 * state.flash) + ')');
            g.addColorStop(1, 'rgba(79,230,214,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(px, c.y, 9, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });

      // base manifold
      ctx.fillStyle = 'rgba(214,240,242,0.12)';
      ctx.fillRect(startX - 6, TUBE_BOT + 8, totalW + 12, 4);
      ctx.fillStyle = 'rgba(120,150,160,0.7)';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText('MANIFOLD · 40 L', startX - 4, TUBE_BOT + 30);
      ctx.fillText(state.dark ? 'DARK PHASE' : 'LIGHT PHASE', startX + totalW - 82, TUBE_BOT + 30);
    }

    var last = performance.now();
    function loop(now) {
      var dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      var p = photosynthesis();
      // energy: builds in light, spent by flashing, slowly leaks
      if (!state.dark) {
        state.energy = Math.min(1, state.energy + (0.015 + p * 0.045) * dt);
      } else {
        state.energy = Math.min(1, state.energy + 0.02 * dt);
      }
      // population
      var target = 0.45 + p * 1.75;
      state.density += (target - state.density) * (0.06 * stirFactor()) * dt;
      if (state.density < 0.12) state.density = 0.12;
      // flash decay
      if (state.flash > 0) state.flash = Math.max(0, state.flash - dt / 6);

      draw(now);
      updateReadouts();
      if (!reduce) requestAnimationFrame(loop);
    }

    function updateReadouts() {
      var p = photosynthesis();
      var glowMw = state.flash * 0.15 * Math.min(1.6, state.density) * (state.dark ? 1 : 0.35);
      outGlow.textContent = glowMw.toFixed(2);
      var yieldVal = p * stirFactor() * Math.min(2.4, 0.4 + state.density * 0.75) * 1.42;
      outYield.textContent = yieldVal.toFixed(1);
      stageRead.textContent = (state.density).toFixed(1) + ' × 10⁶ CELLS/ML';
      stageState.textContent = state.dark
        ? 'DARK CYCLE · BIOLUMINESCENCE ARMED'
        : 'PHOTOSYNTHESIS · LIGHT ' + Math.round(state.light).toLocaleString('en-GB') + ' LX';
    }

    lightEl.addEventListener('input', function () {
      state.light = parseInt(lightEl.value, 10);
      lightVal.textContent = state.light.toLocaleString('en-GB') + ' lx';
      if (reduce) { draw(performance.now()); updateReadouts(); }
    });
    stirEl.addEventListener('input', function () {
      state.stir = parseInt(stirEl.value, 10);
      stirVal.textContent = state.stir + ' rpm';
      if (reduce) { draw(performance.now()); updateReadouts(); }
    });
    document.querySelectorAll('[data-cycle]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.dark = b.getAttribute('data-cycle') === 'dark';
        cycleVal.textContent = state.dark ? 'Dark' : 'Light';
        document.querySelectorAll('[data-cycle]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        if (reduce) { draw(performance.now()); updateReadouts(); }
      });
    });

    if (stimBtn) {
      stimBtn.addEventListener('click', function () {
        if (state.energy < 0.15 || !state.dark) {
          stimBtn.setAttribute('aria-pressed', 'true');
          stageState.textContent = state.dark
            ? 'RECOVERY · CULTURE TOO SPENT TO FLASH'
            : 'LIGHTS ON · BIOLUMINESCENCE ONLY IN THE DARK PHASE';
          window.setTimeout(function () {
            stimBtn.setAttribute('aria-pressed', 'false');
            updateReadouts();
          }, 1800);
          return;
        }
        state.flash = 1;
        state.energy = Math.max(0, state.energy - 0.35);
        stimBtn.setAttribute('aria-pressed', 'true');
        window.setTimeout(function () { stimBtn.setAttribute('aria-pressed', 'false'); }, 1200);
        if (reduce) { draw(performance.now()); updateReadouts(); }
      });
    }

    draw(performance.now());
    updateReadouts();
    if (!reduce) requestAnimationFrame(loop);
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var status = document.getElementById('enquiryStatus');
    var checks = [
      { id: 'n-name', test: function (v) { return v.trim().length >= 2; } },
      { id: 'n-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { id: 'n-site', test: function (v) { return v.trim().length >= 3; } },
      { id: 'n-message', test: function (v) { return v.trim().length >= 15; } }
    ];
    function check(c) {
      var input = document.getElementById(c.id);
      if (!input) return true;
      var ok = c.test(input.value);
      input.closest('.field').classList.toggle('invalid', !ok);
      return ok;
    }
    checks.forEach(function (c) {
      var input = document.getElementById(c.id);
      if (input) input.addEventListener('blur', function () { check(c); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!checks.every(check)) {
        var bad = form.querySelector('.field.invalid input, .field.invalid textarea');
        if (bad) bad.focus();
        return;
      }
      status.className = 'form-status show';
      status.innerHTML = '<strong>Received.</strong> We reply within two working days with a reactor size, a culture schedule and a commissioning date. Live cultures travel Monday to Wednesday only, so they are not left in a depot over a weekend.';
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sent';
    });
  }
})();
