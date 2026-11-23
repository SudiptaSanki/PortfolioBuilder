/* Katha Night — behaviour. Silent site: no audio is created or played. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* ------------------------------------------------------------- nav --- */
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    var closeNav = function () {
      document.body.classList.remove('nav-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    };
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        closeNav();
        menuBtn.focus();
      }
    });
    var nav = document.getElementById('nav');
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* --------------------------------------------------- star field --- */
  var canvas = document.getElementById('stars');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var stars = [];
    var w = 0;
    var h = 0;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var raf = 0;
    var t = 0;

    var seedRand = function (n) {
      var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    var build = function () {
      w = window.innerWidth;
      h = Math.max(window.innerHeight, document.documentElement.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var count = Math.min(150, Math.round((w * h) / 16000));
      for (var i = 0; i < count; i++) {
        stars.push({
          x: seedRand(i + 1) * w,
          y: seedRand(i + 41) * h,
          r: 0.4 + seedRand(i + 91) * 1.2,
          a: 0.15 + seedRand(i + 137) * 0.55,
          phase: seedRand(i + 211) * Math.PI * 2,
          drift: 0.02 + seedRand(i + 307) * 0.06
        });
      }
    };

    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = reduceMotion ? s.a : s.a * (0.65 + 0.35 * Math.sin(t * 0.0004 + s.phase));
        var y = reduceMotion ? s.y : (s.y + Math.sin(t * 0.00008 + s.phase) * 3) % h;
        ctx.beginPath();
        ctx.arc(s.x, y < 0 ? y + h : y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = i % 11 === 0 ? 'rgba(233,178,95,' + alpha + ')' : 'rgba(241,233,218,' + alpha + ')';
        ctx.fill();
      }
      if (!reduceMotion) {
        t += 16;
        raf = window.requestAnimationFrame(draw);
      }
    };

    build();
    if (reduceMotion) {
      draw();
    } else {
      draw();
      window.addEventListener('resize', function () {
        window.cancelAnimationFrame(raf);
        build();
        draw();
      });
    }
  }

  /* ------------------------------------------------------- scrollspy --- */
  var chapters = [].slice.call(document.querySelectorAll('[data-chapter]'));
  var marks = [].slice.call(document.querySelectorAll('.spine-marks li'));
  var fill = document.getElementById('spineFill');

  if (chapters.length && marks.length) {
    var updateSpine = function () {
      var eye = window.scrollY + window.innerHeight * 0.34;
      var active = chapters[0];
      chapters.forEach(function (section) {
        var top = section.getBoundingClientRect().top + window.scrollY;
        if (top <= eye) active = section;
      });
      var key = active.getAttribute('data-chapter');
      marks.forEach(function (mark) {
        mark.classList.toggle('is-on', mark.getAttribute('data-spine') === key);
      });
      if (fill) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
        fill.style.height = pct + '%';
      }
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () { updateSpine(); ticking = false; });
      }
    }, { passive: true });
    updateSpine();
  }

  /* --------------------------------------------------------- planner --- */
  var planner = document.getElementById('plannerForm');
  if (planner) {
    var lengthEl = document.getElementById('length');
    var widthEl = document.getElementById('width');
    var audienceEl = document.getElementById('audience');
    var seatingEl = document.getElementById('seating');
    var outL = document.getElementById('lengthOut');
    var outW = document.getElementById('widthOut');
    var outA = document.getElementById('audienceOut');
    var planSvg = document.getElementById('planSvg');
    var verdict = document.getElementById('planVerdict');
    var warn = document.getElementById('planWarn');
    var note = document.getElementById('planNote');

    var SEATS = {
      cushion: { width: 0.62, depth: 0.8, label: 'floor cushions and rugs', r: 4.4 },
      chair: { width: 0.55, depth: 0.95, label: 'chairs in rows', r: 3.6 },
      mixed: { width: 0.58, depth: 0.85, label: 'chairs behind cushions', r: 4 }
    };

    var plan = function () {
      var L = parseInt(lengthEl.value, 10);
      var W = parseInt(widthEl.value, 10);
      var N = parseInt(audienceEl.value, 10);
      var seat = SEATS[seatingEl.value] || SEATS.cushion;

      outL.value = L + ' m';
      outW.value = W + ' m';
      outA.value = String(N);

      var perRow = Math.max(2, Math.floor((W - 1.2) / seat.width));
      var rows = Math.ceil(N / perRow);
      var rowsFit = Math.max(0, Math.floor((L - 2.4 - 1.2) / seat.depth));
      var capacity = rowsFit * perRow;
      var depth = 2.4 + Math.min(rows, Math.max(rowsFit, 1)) * seat.depth;
      var lamps = Math.ceil((2 * (L + W)) / 5) + 2;
      var oil = (lamps * 0.06 * 3).toFixed(1);
      var prep = 45 + Math.min(60, rows * 5);
      var hour = 19 * 60 - prep;
      var hh = Math.floor(hour / 60);
      var mm = hour % 60;
      var timeLabel = (hh > 12 ? hh - 12 : hh) + ':' + String(mm).padStart(2, '0') + ' pm';

      var fits = capacity >= N;
      if (fits) {
        verdict.textContent = 'Fits, with ' + (capacity - N) + ' seats to spare.';
        warn.textContent = 'Keep the last metre behind the back row empty; it is where people stand when they arrive late.';
      } else if (rowsFit > 0) {
        verdict.textContent = 'Tight. Room for ' + capacity + ' of ' + N + '.';
        warn.textContent = 'The courtyard is ' + (N - capacity) + ' seats short. Cut the guest list, or ask the host to open the verandah behind the back row.';
      } else {
        verdict.textContent = 'Not enough depth for a single row.';
        warn.textContent = 'The courtyard is under ' + (2.4 + seat.depth + 1.2).toFixed(1) + ' m deep. Tell from the doorway and keep the audience outside, or move the night.';
      }
      if (seat.depth * rows + 2.4 > L && fits) {
        warn.textContent = 'Rows just fit: the back row sits ' + (Math.max(0, depth)).toFixed(1) + ' m from the arch. Leave the entrance clear.';
      }

      document.getElementById('planRows').textContent = String(rows);
      document.getElementById('planSeats').textContent = String(Math.min(N, capacity));
      document.getElementById('planLamps').textContent = String(lamps);
      document.getElementById('planOil').textContent = oil + ' L';
      document.getElementById('planDepth').textContent = depth.toFixed(1) + ' m';
      document.getElementById('planArrive').textContent = timeLabel;

      var seatNote = {
        cushion: 'Cushions suit this courtyard: the floor is the oldest seating there is, and it keeps the room low enough that the lamp lights every face.',
        chair: 'Chairs are easier for older guests but put the back row in shadow. Add two lamps behind them, or keep a low row in front.',
        mixed: 'Mixed seating works when the front cushions are on rugs and the chairs sit 15 cm higher behind them. Nobody minds the height; they mind the view.'
      }[seatingEl.value] || '';
      note.textContent = seatNote + ' At ' + perRow + ' abreast, this plan needs ' + rows + ' rows and ' + lamps + ' lamps lit 30 minutes before the first guest.';

      drawPlan(L, W, rows, perRow, N, capacity, seat, lamps);
      planSvg.setAttribute('aria-label', 'Top-down plan of a ' + L + ' by ' + W + ' metre courtyard with ' +
        Math.min(N, capacity) + ' seats in ' + rows + ' rows and ' + lamps + ' lamps');
    };

    var drawPlan = function (L, W, rows, perRow, N, capacity, seat, lamps) {
      var pad = 26;
      var boxW = 588;
      var boxH = 330;
      var scale = Math.min(boxW / L, boxH / W);
      var cw = L * scale;
      var ch = W * scale;
      var x0 = (640 - cw) / 2;
      var y0 = 34 + (330 - ch) / 2;
      var parts = [];

      parts.push('<defs><radialGradient id="lampGlowPlan" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0" stop-color="#E9B25F" stop-opacity=".55"/>' +
        '<stop offset=".45" stop-color="#E9B25F" stop-opacity=".16"/>' +
        '<stop offset="1" stop-color="#E9B25F" stop-opacity="0"/></radialGradient>' +
        '<pattern id="planGrid" width="24" height="24" patternUnits="userSpaceOnUse">' +
        '<path d="M24 0H0v24" fill="none" stroke="#F1E9DA" stroke-opacity=".04"/></pattern></defs>');

      parts.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + cw + '" height="' + ch + '" fill="#0A0F1B" stroke="#F1E9DA" stroke-opacity=".22"/>');
      parts.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + cw + '" height="' + ch + '" fill="url(#planGrid)"/>');

      var stageDepth = 2.4 * scale;
      var archW = Math.min(cw * 0.42, 120);
      parts.push('<rect x="' + (x0 + cw / 2 - archW / 2) + '" y="' + (y0 + 8) + '" width="' + archW + '" height="' + (stageDepth - 8) + '" fill="#E9B25F" fill-opacity=".08" stroke="#E9B25F" stroke-opacity=".45" stroke-dasharray="3 3"/>');
      parts.push('<path d="M' + (x0 + cw / 2 - archW / 2) + ' ' + (y0 + 8 + stageDepth * 0.45) +
        'a' + (archW / 2) + ' ' + (archW / 2) + ' 0 0 1 ' + archW + ' 0" fill="none" stroke="#E9B25F" stroke-opacity=".5"/>');
      parts.push('<text x="' + (x0 + cw / 2) + '" y="' + (y0 + stageDepth + 12) + '" text-anchor="middle" font-family="Spline Sans Mono, monospace" font-size="7.5" letter-spacing="1.6" fill="#E9B25F" opacity=".8">ARCH · TELLER</text>');

      var aisleX = x0 + cw / 2;
      parts.push('<line x1="' + aisleX + '" y1="' + (y0 + stageDepth) + '" x2="' + aisleX + '" y2="' + (y0 + ch - 8) + '" stroke="#F1E9DA" stroke-opacity=".1" stroke-dasharray="2 4"/>');

      var maxRowsByDepth = Math.max(1, Math.floor((ch - stageDepth - 0.55 * scale) / (seat.depth * scale)));
      var drawRows = Math.min(rows, maxRowsByDepth);
      var seatR = Math.max(2.2, Math.min(seat.r, (seat.width * scale) / 2.4));
      var gapX = (cw - 1.2 * scale) / perRow;
      var totalSeats = Math.min(N, capacity, drawRows * perRow);
      var drawn = 0;

      for (var r = 0; r < drawRows; r++) {
        var cy = y0 + stageDepth + 0.55 * scale + r * seat.depth * scale;
        if (cy > y0 + ch - 10) break;
        for (var c = 0; c < perRow; c++) {
          if (drawn >= totalSeats) break;
          var cx = x0 + 0.6 * scale + gapX * (c + 0.5);
          if (Math.abs(cx - aisleX) < gapX * 0.45) cx += gapX * 0.22;
          var alpha = (0.26 + 0.5 * (1 - r / Math.max(1, drawRows))) * (drawn < N ? 1 : 0.3);
          parts.push('<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + seatR.toFixed(1) +
            '" fill="#F1E9DA" fill-opacity="' + alpha.toFixed(2) + '"/>');
          drawn++;
        }
      }

      var lampPoints = [];
      var around = Math.min(lamps, 12);
      for (var i = 0; i < around; i++) {
        var side = i % 4;
        var frac = Math.floor(i / 4) / Math.max(1, Math.ceil(around / 4));
        var lx;
        var ly;
        if (side === 0) { lx = x0 + frac * cw; ly = y0; }
        else if (side === 1) { lx = x0 + cw; ly = y0 + frac * ch; }
        else if (side === 2) { lx = x0 + cw - frac * cw; ly = y0 + ch; }
        else { lx = x0; ly = y0 + ch - frac * ch; }
        lampPoints.push([lx, ly]);
      }
      lampPoints.forEach(function (p) {
        parts.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="26" fill="url(#lampGlowPlan)"/>');
        parts.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" fill="#E9B25F"/>');
      });

      parts.push('<text x="' + (x0 + 4) + '" y="' + (y0 + ch - 6) + '" font-family="Spline Sans Mono, monospace" font-size="7.5" letter-spacing="1.4" fill="#F1E9DA" fill-opacity=".45">' + L + ' × ' + W + ' M</text>');
      parts.push('<text x="' + (x0 + cw - 4) + '" y="' + (y0 + ch - 6) + '" text-anchor="end" font-family="Spline Sans Mono, monospace" font-size="7.5" letter-spacing="1.4" fill="#E9B25F" fill-opacity=".8">' + totalSeats + ' HEADS · ' + rows + ' ROWS</text>');

      planSvg.innerHTML = parts.join('');
    };

    planner.addEventListener('submit', function (e) {
      e.preventDefault();
      plan();
      var svgWrap = document.querySelector('.plan-svg-wrap');
      if (svgWrap) {
        svgWrap.classList.remove('pulse');
        void svgWrap.offsetWidth;
        svgWrap.classList.add('pulse');
      }
    });
    [lengthEl, widthEl, audienceEl].forEach(function (el) { el.addEventListener('input', plan); });
    seatingEl.addEventListener('change', plan);

    var reset = document.getElementById('plannerReset');
    if (reset) reset.addEventListener('click', function () {
      planner.reset();
      lengthEl.value = '12';
      widthEl.value = '8';
      audienceEl.value = '70';
      seatingEl.value = 'cushion';
      plan();
    });

    plan();
  }

  /* -------------------------------------------------------- reveals --- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* --------------------------------------------------- contact form --- */
  var nightForm = document.getElementById('nightForm');
  if (nightForm) {
    var success = document.getElementById('nSuccess');
    var rules = {
      nfName: function (v) { return v.trim().length >= 2; },
      nfEmail: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      nfType: function (v) { return v !== ''; },
      nfMessage: function (v) { return v.trim().length >= 20; }
    };
    var check = function (id) {
      var el = document.getElementById(id);
      if (!el) return null;
      var ok = rules[id](el.value);
      var wrap = el.closest('.f-field');
      if (wrap) wrap.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };

    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var handler = function () {
        var wrap = el.closest('.f-field');
        if (wrap && wrap.classList.contains('invalid')) check(id);
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });

    nightForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (id) {
        if (check(id) === false && !firstBad) firstBad = document.getElementById(id);
      });
      if (firstBad) {
        firstBad.focus();
        if (success) success.hidden = true;
        return;
      }
      if (success) {
        var nameEl = document.getElementById('nfName');
        var slot = document.getElementById('nSuccessName');
        if (slot) slot.textContent = nameEl && nameEl.value.trim() ? nameEl.value.trim().split(' ')[0] : 'friend';
        success.hidden = false;
        success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      nightForm.reset();
      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var wrap = el.closest('.f-field');
        if (wrap) wrap.classList.remove('invalid');
        el.removeAttribute('aria-invalid');
      });
    });
  }
})();
