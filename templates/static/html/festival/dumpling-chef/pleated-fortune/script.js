/* Pleated Fortune — navigation, the Pleat Studio, steam timer, filters, form. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- mobile navigation ---------------- */
  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- entrance ---------------- */
  var targets = doc.querySelectorAll('.reveal-on');
  if (targets.length) {
    if (reduce) {
      targets.forEach(function (el) { el.classList.add('in'); });
    } else {
      targets.forEach(function (el, i) {
        el.classList.add('reveal');
        el.style.transitionDelay = Math.min(i, 5) * 55 + 'ms';
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          targets.forEach(function (el) { el.classList.add('in'); });
        });
      });
    }
  }

  /* ---------------- rail section marks ---------------- */
  var dots = doc.querySelectorAll('.rail-dots a');
  if (dots.length && 'IntersectionObserver' in window) {
    var byId = {};
    dots.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        dots.forEach(function (a) { a.classList.remove('is-active'); });
        var link = byId[en.target.id];
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-30% 0px -55% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* =========================================================
     PLEAT STUDIO
     ========================================================= */
  var stage = doc.getElementById('dumpling');
  var shapeButtons = doc.querySelectorAll('.shape[data-shape]');
  var pleatInput = doc.getElementById('pleats');
  var pleatOut = doc.getElementById('pleatOut');
  var fillingSelect = doc.getElementById('filling');
  var outSteam = doc.getElementById('outSteam');
  var outBatch = doc.getElementById('outBatch');
  var previewTag = doc.getElementById('previewTag');

  var SHAPES = {
    crescent: { label: 'Crescent', steam: 8, note: 'Jiaozi, folded on the bench and stood in a ring' },
    pouch: { label: 'Pouch', steam: 10, note: 'Bao, gathered at the crown into a purse' },
    ingot: { label: 'Ingot', steam: 7, note: 'Yuanbao, pinched at both ends like a coin' },
    blossom: { label: 'Blossom', steam: 6, note: 'Xiao long, twisted open into a flower' }
  };
  var FILLINGS = {
    chive: { label: 'Pork & garlic chive', tint: '#a4341c' },
    shiitake: { label: 'Shiitake & cabbage', tint: '#5a6a4a' },
    paneer: { label: 'Paneer & spring onion', tint: '#b98b3c' },
    prawn: { label: 'Prawn & bamboo shoot', tint: '#c2603c' }
  };

  var current = { shape: 'crescent', pleats: 18, filling: 'chive' };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function crescentBody() {
    return 'M 52 170 C 52 210 96 218 150 218 C 204 218 248 210 248 170 C 248 118 204 94 150 94 C 96 94 52 118 52 170 Z';
  }
  function crescentPoint(t) {
    return { x: 52 + 196 * t, y: 170 - 76 * Math.sin(Math.PI * t) };
  }
  function pouchBody() {
    return 'M 150 88 C 196 88 224 118 224 156 C 224 196 194 214 150 214 C 106 214 76 196 76 156 C 76 118 104 88 150 88 Z';
  }
  function ingotBody() {
    return 'M 54 150 C 44 126 84 112 112 120 C 130 125 170 125 188 120 C 216 112 256 126 246 150 C 238 172 206 182 150 182 C 94 182 62 172 54 150 Z';
  }
  function blossomBody() {
    return 'M 150 82 C 168 82 180 96 186 110 C 200 104 218 112 220 128 C 234 134 236 152 224 162 C 230 178 216 192 200 188 C 192 202 174 206 162 196 C 150 206 132 202 126 190 C 110 194 96 182 100 166 C 88 156 90 138 104 132 C 106 114 124 106 138 112 C 142 96 152 82 150 82 Z';
  }

  function pleatArt(shape, pleats) {
    var n = Math.max(6, Math.min(26, pleats));
    var i, t, a, b, mx, my, p, ang;
    var out = { folds: '', creases: '', extra: '' };

    if (shape === 'crescent') {
      for (i = 0; i < n; i++) {
        a = crescentPoint(i / n);
        b = crescentPoint((i + 1) / n);
        mx = (a.x + b.x) / 2;
        my = (a.y + b.y) / 2;
        out.folds += '<path d="M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) +
          ' Q' + mx.toFixed(1) + ' ' + (my - 13).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) +
          ' Q' + mx.toFixed(1) + ' ' + (my - 2).toFixed(1) + ' ' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Z"/>';
      }
      for (i = 1; i < n; i++) {
        p = crescentPoint(i / n);
        out.creases += '<path d="M' + p.x.toFixed(1) + ' ' + (p.y + 2).toFixed(1) +
          ' Q' + (p.x + (150 - p.x) * 0.03).toFixed(1) + ' ' + (p.y + 9).toFixed(1) +
          ' ' + (p.x + (150 - p.x) * 0.06).toFixed(1) + ' ' + (p.y + 15).toFixed(1) + '"/>';
      }
      out.extra = '<path d="M 64 154 C 74 118 108 104 150 104 C 192 104 226 118 236 154" fill="none" stroke="#8a6b40" stroke-width="1" opacity=".35"/>' +
        '<ellipse cx="112" cy="160" rx="40" ry="22" fill="#fdf9ee" opacity=".22"/>';
    } else if (shape === 'pouch') {
      for (i = 0; i < n; i++) {
        ang = Math.PI * 1.05 + (i / (n - 1)) * Math.PI * 0.9;
        a = { x: 150 + Math.cos(ang) * 74, y: 156 + Math.sin(ang) * 66 };
        mx = (150 + a.x) / 2 + 6;
        my = (86 + a.y) / 2 - 4;
        out.folds += '<path d="M150 86 Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) +
          ' Q' + (mx - 9).toFixed(1) + ' ' + (my + 8).toFixed(1) + ' 150 92 Z"/>';
      }
      out.extra = '<ellipse cx="150" cy="88" rx="16" ry="7" fill="#efdcb4" stroke="#5b4222" stroke-width="1.4"/>' +
        '<path d="M138 88 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#5b4222" stroke-width="1.1"/>' +
        '<ellipse cx="118" cy="150" rx="26" ry="34" fill="#fdf9ee" opacity=".18"/>';
    } else if (shape === 'ingot') {
      for (i = 0; i <= n; i++) {
        t = i / n;
        a = { x: 64 + t * 172, y: 140 - Math.sin(Math.PI * t) * 16 };
        out.creases += '<path d="M' + a.x.toFixed(1) + ' ' + (a.y + 3).toFixed(1) + ' V' + (158 - Math.sin(Math.PI * t) * 4).toFixed(1) + '"/>';
      }
      out.extra = '<path d="M54 150 c6 6 10 8 16 8 M246 150 c-6 6 -10 8 -16 8" fill="none" stroke="#5b4222" stroke-width="1.6"/>' +
        '<path d="M 74 148 C 96 132 204 132 226 148" fill="none" stroke="#fdf9ee" stroke-width="3" opacity=".4"/>';
    } else {
      for (i = 0; i < 6; i++) {
        ang = (i / 6) * 360;
        out.folds += '<g transform="rotate(' + ang + ' 150 150)"><ellipse cx="150" cy="110" rx="24" ry="32"/></g>';
      }
      for (i = 0; i < n; i++) {
        ang = (i / n) * Math.PI * 2;
        out.creases += '<path d="M150 150 L' + (150 + Math.cos(ang) * 22).toFixed(1) + ' ' + (150 + Math.sin(ang) * 22).toFixed(1) + '"/>';
      }
      out.extra = '<circle cx="150" cy="150" r="23" fill="none" stroke="#5b4222" stroke-width="1.6"/>' +
        '<circle cx="150" cy="150" r="6" fill="#a4341c" opacity=".55" stroke="none"/>';
    }
    return out;
  }

  function bodyFor(shape) {
    if (shape === 'crescent') return crescentBody();
    if (shape === 'pouch') return pouchBody();
    if (shape === 'ingot') return ingotBody();
    return blossomBody();
  }

  function render() {
    if (!stage) return;
    var tint = FILLINGS[current.filling].tint;
    var body = bodyFor(current.shape);
    var parts = pleatArt(current.shape, current.pleats);

    var art =
      '<defs>' +
        '<linearGradient id="dough" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#fdf6e4"/>' +
          '<stop offset=".58" stop-color="#eddbb4"/>' +
          '<stop offset="1" stop-color="#d9c08c"/>' +
        '</linearGradient>' +
        '<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + tint + '" stop-opacity="0"/>' +
          '<stop offset="1" stop-color="' + tint + '" stop-opacity=".16"/>' +
        '</linearGradient>' +
        '<clipPath id="bodyclip"><path d="' + body + '"/></clipPath>' +
      '</defs>' +
      '<ellipse cx="152" cy="226" rx="92" ry="9" fill="#221f19" opacity=".13"/>' +
      '<g opacity=".45" stroke="#8a7a56" stroke-width="1">' +
        '<path d="M20 212 H282"/><path d="M14 220 H290"/>' +
      '</g>' +
      '<g stroke="#8a7a56" stroke-width=".7" opacity=".4">' +
        '<path d="M34 206 V226"/><path d="M64 206 V226"/><path d="M94 206 V226"/><path d="M124 206 V226"/>' +
        '<path d="M154 206 V226"/><path d="M184 206 V226"/><path d="M214 206 V226"/><path d="M244 206 V226"/><path d="M274 206 V226"/>' +
      '</g>' +
      '<path d="' + body + '" fill="url(#dough)" stroke="#221f19" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<g clip-path="url(#bodyclip)">' +
        '<path d="' + body + '" fill="url(#shade)"/>' +
        '<g stroke="#221f19" stroke-width=".8" opacity=".22">' +
          '<path d="M80 196 l14 12"/><path d="M98 202 l12 12"/><path d="M118 207 l10 11"/>' +
          '<path d="M140 210 l8 11"/><path d="M164 210 l-8 11"/><path d="M186 207 l-10 11"/>' +
          '<path d="M206 202 l-12 12"/><path d="M224 196 l-14 12"/>' +
        '</g>' +
      '</g>' +
      '<g fill="url(#dough)" stroke="#221f19" stroke-width="1.15" stroke-linejoin="round">' + parts.folds + '</g>' +
      '<g stroke="#221f19" stroke-width="1" stroke-linecap="round" opacity=".38" fill="none">' + parts.creases + '</g>' +
      parts.extra +
      '<g stroke="#5a4a34" stroke-width="2.6" stroke-linecap="round" opacity=".72">' +
        '<path d="M248 236 L292 210"/><path d="M254 243 L298 217"/>' +
      '</g>' +
      '<g fill="none" stroke="' + tint + '" stroke-width="2" stroke-linecap="round" opacity=".36">' +
        '<path class="wisp" d="M118 84 c-9 -13, 9 -22, 0 -36 c-6 -9, 2 -16, 8 -22"/>' +
        '<path class="wisp" d="M152 76 c-9 -14, 10 -24, 1 -40"/>' +
        '<path class="wisp" d="M186 84 c-8 -13, 9 -21, 1 -36 c-5 -8, 2 -15, 8 -21"/>' +
      '</g>';

    stage.innerHTML = art;

    /* readouts */
    if (pleatOut) pleatOut.textContent = current.pleats;
    var pleatRead = doc.getElementById('pleatRead');
    if (pleatRead) pleatRead.textContent = current.pleats;
    if (outSteam) {
      var mins = SHAPES[current.shape].steam + Math.round((current.pleats - 18) * 0.1);
      outSteam.innerHTML = mins + '<small>min</small>';
      document.dispatchEvent(new CustomEvent('steam:set', { detail: mins }));
    }
    if (outBatch) outBatch.innerHTML = '12<small>pcs</small>';
    if (previewTag) previewTag.textContent = SHAPES[current.shape].label + ' · ' + FILLINGS[current.filling].label;
    var cap = doc.getElementById('studioNote');
    if (cap) cap.textContent = SHAPES[current.shape].note + '. Steamed over a rolling boil, lid never lifted.';
    if (stage) stage.setAttribute('aria-label', 'A ' + SHAPES[current.shape].label.toLowerCase() + ' dumpling with ' + current.pleats + ' pleats, filled with ' + FILLINGS[current.filling].label.toLowerCase() + ', resting on a bamboo mat.');
  }

  if (shapeButtons.length) {
    shapeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        current.shape = btn.getAttribute('data-shape');
        shapeButtons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        render();
      });
    });
  }

  if (pleatInput) {
    pleatInput.value = current.pleats;
    pleatInput.addEventListener('input', function () {
      current.pleats = parseInt(pleatInput.value, 10);
      if (pleatOut) pleatOut.textContent = current.pleats;
      render();
    });
  }

  if (fillingSelect) {
    fillingSelect.addEventListener('change', function () {
      current.filling = fillingSelect.value;
      render();
    });
  }

  if (stage) render();

  /* ---------------- steam timer ---------------- */
  var tMin = 8;
  doc.addEventListener('steam:set', function (e) { tMin = e.detail; });
  var ring = doc.getElementById('timerRing');
  var clock = doc.getElementById('timerClock');
  var startBtn = doc.getElementById('timerStart');
  var resetBtn = doc.getElementById('timerReset');
  var timerState = { left: tMin * 60, total: tMin * 60, run: false, id: null };
  var CIRC = 2 * Math.PI * 22;

  function paintTimer() {
    if (!clock) return;
    var left = Math.max(0, Math.round(timerState.left));
    var m = Math.floor(left / 60);
    var s = left % 60;
    clock.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    if (ring) {
      var frac = timerState.total ? (timerState.total - timerState.left) / timerState.total : 0;
      ring.style.strokeDasharray = CIRC.toFixed(1);
      ring.style.strokeDashoffset = (CIRC * (1 - Math.min(1, Math.max(0, frac)))).toFixed(1);
    }
    if (left === 0 && startBtn) {
      startBtn.textContent = 'Steamed';
      timerState.run = false;
      clearInterval(timerState.id);
    }
  }

  function resetTimer(mins) {
    clearInterval(timerState.id);
    timerState.run = false;
    timerState.total = Math.max(60, (mins || tMin) * 60);
    timerState.left = timerState.total;
    if (startBtn) startBtn.textContent = 'Start steam';
    paintTimer();
  }

  doc.addEventListener('steam:set', function (e) {
    if (!timerState.run) resetTimer(e.detail);
  });

  if (clock) {
    timerState.total = tMin * 60;
    timerState.left = tMin * 60;
    if (ring) ring.style.strokeDasharray = CIRC.toFixed(1);
    paintTimer();

    startBtn.addEventListener('click', function () {
      if (timerState.left <= 0) resetTimer();
      timerState.run = !timerState.run;
      startBtn.textContent = timerState.run ? 'Pause' : 'Resume';
      if (timerState.run) {
        var last = Date.now();
        timerState.id = setInterval(function () {
          var now = Date.now();
          timerState.left -= (now - last) / 1000;
          last = now;
          paintTimer();
        }, 250);
      } else {
        clearInterval(timerState.id);
      }
    });
    resetBtn.addEventListener('click', function () { resetTimer(); });
  }

  /* ---------------- archive filter (projects page) ---------------- */
  var chips = doc.querySelectorAll('.chip[data-filter]');
  if (chips.length) {
    var works = doc.querySelectorAll('.work');
    var count = doc.getElementById('filterCount');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          var on = c === chip;
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
          c.classList.toggle('is-on', on);
        });
        var shown = 0;
        works.forEach(function (w) {
          var match = want === 'all' || w.getAttribute('data-shape') === want;
          w.hidden = !match;
          if (match) shown++;
        });
        if (count) count.textContent = shown + ' of ' + works.length + ' plates';
      });
    });
  }

  /* ---------------- commission form ---------------- */
  var form = doc.getElementById('commissionForm');
  if (form) {
    var fields = {
      name: { el: doc.getElementById('fName'), test: function (v) { return v.trim().length >= 2; } },
      email: { el: doc.getElementById('fEmail'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      date: { el: doc.getElementById('fDate'), test: function (v) { return v.trim().length > 0; } },
      brief: { el: doc.getElementById('fBrief'), test: function (v) { return v.trim().length >= 12; } }
    };
    var sent = doc.getElementById('sent');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var good = f.test(f.el.value);
        f.el.closest('.fld').classList.toggle('bad', !good);
        f.el.setAttribute('aria-invalid', good ? 'false' : 'true');
        if (!good && !firstBad) firstBad = f.el;
        if (!good) ok = false;
      });
      if (!ok) {
        if (firstBad) firstBad.focus();
        return;
      }
      var name = doc.getElementById('fName').value.trim().split(' ')[0];
      if (sent) {
        var line = doc.getElementById('sentLine');
        if (line) {
          line.textContent = 'Thank you, ' + name + '. Your table request is in the book: ' +
            doc.getElementById('fDate').value + ', ' +
            doc.getElementById('fGuests').value + '. I write back within two days, usually after the morning service.';
        }
        sent.classList.add('show');
        sent.setAttribute('tabindex', '-1');
        sent.focus();
      }
      form.reset();
    });
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener('input', function () {
        fields[k].el.closest('.fld').classList.remove('bad');
      });
    });
  }
})();
