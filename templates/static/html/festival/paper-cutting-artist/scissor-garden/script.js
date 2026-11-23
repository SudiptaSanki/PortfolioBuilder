/* Scissor Garden — fold-and-cut studio, navigation, reveals. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile navigation ---------- */
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

  /* ---------- staggered entrance ---------- */
  var revealTargets = doc.querySelectorAll('.ledger, .sheet-head, .sheet-body, .studio-head, .studio-grid, .work, .teach-copy, .teach-list li, .drawer-item, .portrait-band, .process-head, .stage-list li, .kitchen-col, .quote-band blockquote, .commission-band, .contact-grid > *, .questions > *');
  if (!reduce && revealTargets.length) {
    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i, 6) * 55) + 'ms';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        revealTargets.forEach(function (el) { el.classList.add('in'); });
      });
    });
    window.setTimeout(function () {
      revealTargets.forEach(function (el) { el.classList.add('in'); });
    }, 1800);
  }

  /* ---------- archive filter ---------- */
  var chips = doc.querySelectorAll('.chip[data-filter]');
  if (chips.length) {
    var items = doc.querySelectorAll('.drawer-item');
    var count = doc.getElementById('filterCount');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var shown = 0;
        items.forEach(function (item) {
          var match = want === 'all' || item.getAttribute('data-cat') === want;
          item.hidden = !match;
          if (match) shown++;
        });
        if (count) count.textContent = shown + ' of ' + items.length + ' sheets';
      });
    });
  }

  /* ---------- commission form ---------- */
  var form = doc.getElementById('commissionForm');
  if (form) {
    var success = doc.getElementById('formSuccess');
    var setError = function (id, msg) {
      var input = doc.getElementById(id);
      if (!input) return;
      var field = input.closest('.field');
      var slot = field ? field.querySelector('.field-error') : null;
      if (field) field.classList.toggle('invalid', !!msg);
      if (slot) slot.textContent = msg || '';
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = doc.getElementById('name');
      var email = doc.getElementById('email');
      var message = doc.getElementById('message');
      var ok = true;
      if (!name.value.trim()) { setError('name', 'Please add your name.'); ok = false; }
      else setError('name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        setError('email', 'That email does not look complete.'); ok = false;
      } else setError('email', '');
      if (message.value.trim().length < 12) {
        setError('message', 'A sentence or two about the occasion helps.'); ok = false;
      } else setError('message', '');
      if (!ok) { if (success) success.hidden = true; return; }

      var occasion = doc.getElementById('occasion').value;
      var size = doc.getElementById('size').value;
      var subject = 'Commission letter: ' + occasion + ' (' + size + ')';
      var body = 'Name: ' + name.value.trim() + '\nEmail: ' + email.value.trim() +
        '\nOccasion: ' + occasion + '\nSize: ' + size + '\n\n' + message.value.trim();
      var mailto = 'mailto:studio@scissorgarden.in?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      if (success) {
        success.hidden = false;
        success.innerHTML = 'Thank you, ' + name.value.trim().replace(/[<>&]/g, '') +
          '. Your letter is ready — <a href="' + mailto + '">open it in your mail app</a> and send it to the workshop. ' +
          'I answer within two days, and I will tell you honestly whether the sheet can be cut in time.';
      }
    });
    ['name', 'email', 'message'].forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) el.addEventListener('input', function () { setError(id, ''); });
    });
  }

  /* ---------- cut studio ---------- */
  var canvas = doc.getElementById('cutCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var readCount = doc.getElementById('cutCount');
  var readFold = doc.getElementById('foldRead');
  var readShape = doc.getElementById('shapeRead');

  var RINGS = 6;
  var SEGS = 3;
  var INNER = 0.21;
  var OUTER = 0.965;
  var INK = '#2b3a55';
  var PAPER = '#f3eee4';
  var starter = { '1:1': 1, '2:0': 1, '2:2': 1, '3:0': 1, '3:1': 1, '3:2': 1, '4:1': 1, '5:0': 1, '5:1': 1, '5:2': 1 };
  var state = { fold: 4, shape: 'round', cuts: Object.assign({}, starter), sequence: 10 };

  function wedge() { return (Math.PI * 2) / state.fold; }

  function paperPath(cx, cy, R) {
    ctx.beginPath();
    for (var a = 0; a <= Math.PI * 2 + 0.02; a += 0.02) {
      var r = R * (1 + 0.013 * Math.cos(a * state.fold));
      var x = cx + Math.cos(a) * r;
      var y = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function hole(x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    if (state.shape === 'diamond') {
      ctx.moveTo(0, -s * 1.5);
      ctx.lineTo(s * 0.85, 0);
      ctx.lineTo(0, s * 1.5);
      ctx.lineTo(-s * 0.85, 0);
      ctx.closePath();
    } else if (state.shape === 'petal') {
      ctx.moveTo(0, -s * 1.6);
      ctx.bezierCurveTo(s * 1.25, -s * 0.7, s * 0.95, s * 0.9, 0, s * 1.5);
      ctx.bezierCurveTo(-s * 0.95, s * 0.9, -s * 1.25, -s * 0.7, 0, -s * 1.6);
      ctx.closePath();
    } else {
      ctx.ellipse(0, 0, s * 0.82, s * 1.22, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,22,38,.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    var size = canvas.clientWidth || 560;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    var cx = size / 2;
    var cy = size / 2;
    var R = size * 0.455;

    /* the sheet, with its shadow */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = size * 0.035;
    ctx.shadowOffsetY = size * 0.014;
    paperPath(cx, cy, R);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.restore();
    paperPath(cx, cy, R);
    ctx.strokeStyle = 'rgba(20,16,10,.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* fold lines */
    ctx.save();
    ctx.strokeStyle = 'rgba(43,58,85,.20)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 6]);
    for (var k = 0; k < state.fold; k++) {
      var a = k * wedge();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.stroke();
    }
    ctx.restore();

    /* concentric guides, faint */
    ctx.save();
    ctx.strokeStyle = 'rgba(43,58,85,.10)';
    ctx.setLineDash([2, 7]);
    for (var g = 1; g <= RINGS; g++) {
      var gr = R * (INNER + (OUTER - INNER) * (g / RINGS));
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    /* cuts, repeated around the fold */
    var band = (OUTER - INNER) * R / RINGS;
    var step = wedge();
    var segW = step / SEGS;
    Object.keys(state.cuts).forEach(function (key) {
      var parts = key.split(':');
      var ring = parseInt(parts[0], 10);
      var seg = parseInt(parts[1], 10);
      var r = R * INNER + (ring + 0.5) * band;
      var s = band * 0.27 + size * 0.004;
      for (var c = 0; c < state.fold; c++) {
        var ang = c * step + (seg + 0.5) * segW;
        hole(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, s, ang + Math.PI / 2);
      }
    });

    /* punched-out middle mark */
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.012, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
  }

  function normalise(a) {
    a = a % (Math.PI * 2);
    return a < 0 ? a + Math.PI * 2 : a;
  }

  function toggleCut(ev) {
    var rect = canvas.getBoundingClientRect();
    var size = canvas.clientWidth || rect.width;
    var x = ev.clientX - rect.left;
    var y = ev.clientY - rect.top;
    var cx = rect.width / 2;
    var cy = rect.height / 2;
    var R = rect.width * 0.455;
    var dx = x - cx;
    var dy = y - cy;
    var r = Math.sqrt(dx * dx + dy * dy);
    if (r > R * 1.01 || r < R * INNER * 0.96) return;
    var ring = Math.floor((r - R * INNER) / ((OUTER - INNER) * R / RINGS));
    ring = Math.max(0, Math.min(RINGS - 1, ring));
    var a = normalise(Math.atan2(dy, dx));
    var seg = Math.floor((a % wedge()) / (wedge() / SEGS));
    seg = Math.max(0, Math.min(SEGS - 1, seg));
    var key = ring + ':' + seg;
    if (state.cuts[key]) delete state.cuts[key];
    else state.cuts[key] = ++state.sequence;
    paintReadout();
    draw();
  }

  function paintReadout() {
    if (readCount) readCount.textContent = String(Object.keys(state.cuts).length * state.fold);
    if (readFold) readFold.textContent = String(state.fold);
    if (readShape) readShape.textContent = state.shape;
  }

  canvas.addEventListener('pointerdown', toggleCut);
  canvas.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      var fake = { clientX: 0, clientY: 0 };
      toggleCut(fake);
    }
  });
  canvas.tabIndex = 0;

  doc.querySelectorAll('[data-fold]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.fold = parseInt(b.getAttribute('data-fold'), 10);
      doc.querySelectorAll('[data-fold]').forEach(function (o) { o.classList.toggle('is-on', o === b); });
      paintReadout();
      draw();
    });
  });

  doc.querySelectorAll('[data-shape]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.shape = b.getAttribute('data-shape');
      doc.querySelectorAll('[data-shape]').forEach(function (o) { o.classList.toggle('is-on', o === b); });
      paintReadout();
      draw();
    });
  });

  var clearBtn = doc.getElementById('clearCuts');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    state.cuts = {};
    paintReadout();
    draw();
  });

  var newBtn = doc.getElementById('newPattern');
  if (newBtn) newBtn.addEventListener('click', function () {
    state.cuts = {};
    for (var ring = 0; ring < RINGS; ring++) {
      for (var seg = 0; seg < SEGS; seg++) {
        var chance = ring === RINGS - 1 ? 0.42 : 0.24 + ring * 0.03;
        if (Math.random() < chance) state.cuts[ring + ':' + seg] = 1;
      }
    }
    paintReadout();
    draw();
  });

  var saveBtn = doc.getElementById('saveSheet');
  if (saveBtn) saveBtn.addEventListener('click', function () {
    var link = doc.createElement('a');
    link.download = 'sanjhi-sheet.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  window.addEventListener('resize', draw);
  paintReadout();
  draw();
})();
