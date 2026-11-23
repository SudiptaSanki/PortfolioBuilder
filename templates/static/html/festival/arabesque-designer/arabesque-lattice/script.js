/* Arabesque Lattice — the girih bench.
   A parametric rosette lattice drawn with Canvas 2D, plus an ink-coverage reading.
   Nothing here plays a sound. */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var PALETTES = {
    plaster: { name: 'Plaster & ink', bg: '#f2ecdc', line: '#20242b', accent: '#a8813c', fill: 'rgba(168,129,60,.18)', fill2: 'rgba(29,58,107,.08)', dot: '#8f4a2e' },
    lapis: { name: 'Lapis & gold', bg: '#16233d', line: '#d8b86a', accent: '#7f9ecb', fill: 'rgba(216,184,106,.10)', fill2: 'rgba(127,158,203,.10)', dot: '#d8b86a' },
    turquoise: { name: 'Turquoise & umber', bg: '#eee6d2', line: '#1f5e5a', accent: '#9a5b2e', fill: 'rgba(47,127,122,.16)', fill2: 'rgba(154,91,46,.10)', dot: '#9a5b2e' }
  };
  var FAMILIES = {
    eight: { n: 8, label: 'Eight-fold', grid: 'square' },
    ten: { n: 10, label: 'Ten-fold', grid: 'hex' },
    twelve: { n: 12, label: 'Twelve-fold', grid: 'square' }
  };

  function polygon(ctx, cx, cy, r, n, rotation) {
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = rotation + i * Math.PI * 2 / n;
      var x = cx + Math.cos(a) * r;
      var y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function star(ctx, cx, cy, rOuter, rInner, n, rotation) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 === 0 ? rOuter : rInner;
      var a = rotation + i * Math.PI / n;
      var x = cx + Math.cos(a) * r;
      var y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function rosette(ctx, cx, cy, R, n, depth, P) {
    var rot = -Math.PI / 2;

    /* outer ring */
    polygon(ctx, cx, cy, R, n, rot);
    ctx.strokeStyle = P.line;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    /* main star */
    var inner = R * 0.66;
    star(ctx, cx, cy, R * 0.98, inner, n, rot);
    ctx.strokeStyle = P.line;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = P.fill;
    ctx.fill();

    /* petals, one per point */
    for (var i = 0; i < n; i++) {
      var a = rot + i * Math.PI * 2 / n;
      var a1 = a - Math.PI / n;
      var a2 = a + Math.PI / n;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.98, cy + Math.sin(a) * R * 0.98);
      ctx.quadraticCurveTo(
        cx + Math.cos(a1) * R * 0.52, cy + Math.sin(a1) * R * 0.52,
        cx + Math.cos(a) * R * 0.28, cy + Math.sin(a) * R * 0.28
      );
      ctx.quadraticCurveTo(
        cx + Math.cos(a2) * R * 0.52, cy + Math.sin(a2) * R * 0.52,
        cx + Math.cos(a) * R * 0.98, cy + Math.sin(a) * R * 0.98
      );
      ctx.closePath();
      ctx.strokeStyle = P.line;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (i % 2 === 0) {
        ctx.fillStyle = P.fill2;
        ctx.fill();
      }
    }

    /* inner polygon */
    polygon(ctx, cx, cy, inner * 0.62, n, rot + Math.PI / n);
    ctx.strokeStyle = P.line;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (depth >= 2) {
      /* radial spokes from the inner polygon to the outer points */
      for (var k = 0; k < n; k++) {
        var angle = rot + k * Math.PI * 2 / n;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * inner * 0.62, cy + Math.sin(angle) * inner * 0.62);
        ctx.lineTo(cx + Math.cos(angle) * R * 0.98, cy + Math.sin(angle) * R * 0.98);
        ctx.strokeStyle = P.line;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    if (depth >= 3) {
      /* second star and centre dot */
      star(ctx, cx, cy, inner * 0.94, inner * 0.5, n, rot + Math.PI / n);
      ctx.strokeStyle = P.accent;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.055, 0, Math.PI * 2);
      ctx.fillStyle = P.dot;
      ctx.fill();
    } else {
      polygon(ctx, cx, cy, R * 0.1, n, rot);
      ctx.strokeStyle = P.line;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function interstitial(ctx, cx, cy, r, n, depth, P) {
    star(ctx, cx, cy, r, r * 0.55, n, Math.PI / n);
    ctx.strokeStyle = P.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = P.fill2;
    ctx.fill();
    if (depth >= 2) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = P.dot;
      ctx.fill();
    }
  }

  function drawLattice(canvas, opts) {
    var size = 720;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var P = PALETTES[opts.palette] || PALETTES.plaster;
    var F = FAMILIES[opts.family] || FAMILIES.eight;
    var n = F.n;
    var s = Number(opts.scale) || 96;
    var depth = Number(opts.depth) || 2;
    var rot = (Number(opts.rotation) || 0) * Math.PI / 180;

    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(rot);

    var R = s * 0.42;
    var reach = 540;
    var stepX = F.grid === 'hex' ? s * 0.92 : s;
    var stepY = F.grid === 'hex' ? s * 0.82 : s;
    var cols = Math.ceil(reach / stepX) + 2;
    var rows = Math.ceil(reach / stepY) + 2;

    /* construction grid, faint */
    ctx.strokeStyle = P.line;
    ctx.globalAlpha = 0.055;
    ctx.lineWidth = 0.6;
    for (var gx = -cols; gx <= cols; gx++) {
      ctx.beginPath();
      ctx.moveTo(gx * stepX, -reach * 1.2);
      ctx.lineTo(gx * stepX, reach * 1.2);
      ctx.stroke();
    }
    for (var gy = -rows; gy <= rows; gy++) {
      ctx.beginPath();
      ctx.moveTo(-reach * 1.2, gy * stepY);
      ctx.lineTo(reach * 1.2, gy * stepY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (var j = -rows; j <= rows; j++) {
      for (var i = -cols; i <= cols; i++) {
        var x = i * stepX + (F.grid === 'hex' && Math.abs(j % 2) === 1 ? stepX / 2 : 0);
        var y = j * stepY;
        if (Math.sqrt(x * x + y * y) > reach) continue;
        rosette(ctx, x, y, R, n, depth, P);
      }
    }

    /* interstices */
    for (var j2 = -rows; j2 <= rows; j2++) {
      for (var i2 = -cols; i2 <= cols; i2++) {
        var sx = (i2 + 0.5) * stepX + (F.grid === 'hex' && Math.abs(j2 % 2) === 1 ? stepX / 2 : 0);
        var sy = (j2 + 0.5) * stepY;
        if (Math.sqrt(sx * sx + sy * sy) > reach) continue;
        interstitial(ctx, sx, sy, R * 0.34, n === 10 ? 5 : n === 12 ? 4 : 8, depth, P);
      }
    }

    ctx.restore();

    /* plate border and corner ticks */
    ctx.strokeStyle = P.line;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(18, 18, size - 36, size - 36);
    ctx.globalAlpha = 1;
    [[18, 18, 1, 1], [size - 18, 18, -1, 1], [18, size - 18, 1, -1], [size - 18, size - 18, -1, -1]].forEach(function (c) {
      ctx.beginPath();
      ctx.moveTo(c[0] + c[2] * 22, c[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(c[0], c[1] + c[3] * 22);
      ctx.strokeStyle = P.accent;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });

    return { ctx: ctx, size: size, P: P };
  }

  function coverage(canvas, bg) {
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var bgRgb = hexToRgb(bg);
    var total = 0;
    var ink = 0;
    var step = 6;
    for (var y = 0; y < canvas.height; y += step) {
      for (var x = 0; x < canvas.width; x += step) {
        var idx = (y * canvas.width + x) * 4;
        total++;
        var dr = Math.abs(data[idx] - bgRgb[0]);
        var dg = Math.abs(data[idx + 1] - bgRgb[1]);
        var db = Math.abs(data[idx + 2] - bgRgb[2]);
        if (dr + dg + db > 40) ink++;
      }
    }
    return total ? (ink / total * 100) : 0;
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /* ---------- bench state ---------- */
  var state = { family: 'eight', palette: 'plaster', scale: 104, depth: 2, rotation: 0 };
  var canvas = document.getElementById('latticeCanvas');
  var raf = null;

  function render() {
    if (!canvas) return;
    var info = drawLattice(canvas, state);
    var repeatCm = state.scale * 0.132;
    var perM2 = Math.round(Math.pow(100 / repeatCm, 2));
    var strapMm = (2.2 * 0.132 * 10).toFixed(1);
    var cover = coverage(canvas, info.P.bg);
    var set = function (id, value) { var el = document.getElementById(id); if (el) el.textContent = value; };
    set('outRepeat', repeatCm.toFixed(1) + ' cm');
    set('outDensity', perM2 + ' per m²');
    set('outSymmetry', FAMILIES[state.family].n + '-fold');
    set('outStrap', strapMm + ' mm');
    set('outCoverage', cover.toFixed(1) + '%');
    set('canvasName', FAMILIES[state.family].label + ' rosette');
    set('canvasScale', '1:5 · grid ' + state.scale + ' px');

    document.querySelectorAll('[data-family]').forEach(function (b) {
      var on = b.getAttribute('data-family') === state.family;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-palette]').forEach(function (b) {
      var on = b.getAttribute('data-palette') === state.palette;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-depth]').forEach(function (b) {
      var on = Number(b.getAttribute('data-depth')) === state.depth;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = null; render(); });
  }

  document.querySelectorAll('[data-family]').forEach(function (b) {
    b.addEventListener('click', function () { state.family = b.getAttribute('data-family'); render(); });
  });
  document.querySelectorAll('[data-palette]').forEach(function (b) {
    b.addEventListener('click', function () { state.palette = b.getAttribute('data-palette'); render(); });
  });
  document.querySelectorAll('[data-depth]').forEach(function (b) {
    b.addEventListener('click', function () { state.depth = Number(b.getAttribute('data-depth')); render(); });
  });
  var scaleIn = document.getElementById('scaleIn');
  if (scaleIn) {
    scaleIn.addEventListener('input', function () {
      state.scale = Number(scaleIn.value);
      var out = document.getElementById('scaleOut');
      if (out) out.textContent = state.scale + ' px';
      schedule();
    });
  }
  var rotIn = document.getElementById('rotIn');
  if (rotIn) {
    rotIn.addEventListener('input', function () {
      state.rotation = Number(rotIn.value);
      var out = document.getElementById('rotOut');
      if (out) out.textContent = state.rotation + '°';
      schedule();
    });
  }

  var hero = document.getElementById('heroLattice');
  if (hero) drawLattice(hero, { family: 'twelve', palette: 'lapis', scale: 104, depth: 3, rotation: 0 });

  document.querySelectorAll('canvas.tile-canvas').forEach(function (c) {
    drawLattice(c, {
      family: c.getAttribute('data-family') || 'eight',
      palette: c.getAttribute('data-palette') || 'plaster',
      scale: Number(c.getAttribute('data-scale') || 96),
      depth: Number(c.getAttribute('data-depth') || 2),
      rotation: Number(c.getAttribute('data-rot') || 0)
    });
  });

  var resetBtn = document.getElementById('resetLattice');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      state = { family: 'eight', palette: 'plaster', scale: 104, depth: 2, rotation: 0 };
      if (scaleIn) scaleIn.value = '104';
      if (rotIn) rotIn.value = '0';
      var so = document.getElementById('scaleOut');
      var ro = document.getElementById('rotOut');
      if (so) so.textContent = '104 px';
      if (ro) ro.textContent = '0°';
      render();
    });
  }

  render();

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('latticeForm');
  if (form) {
    var status = document.getElementById('latticeStatus');
    var showError = function (field, message) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.err') : null;
      if (wrap) wrap.classList.toggle('invalid', Boolean(message));
      if (err) err.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var project = form.elements.project;
      var message = form.elements.message;
      var consent = form.elements.consent;
      var problems = 0;
      if (!name.value.trim() || name.value.trim().length < 2) { showError(name, 'A name, please'); problems++; } else showError(name, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { showError(email, 'That address is incomplete'); problems++; } else showError(email, '');
      if (!project.value) { showError(project, 'Choose the kind of project'); problems++; } else showError(project, '');
      if (!message.value.trim() || message.value.trim().length < 10) { showError(message, 'A sentence about the surface and the room'); problems++; } else showError(message, '');
      if (!consent.checked) { showError(consent, 'Please tick to allow a reply'); problems++; } else showError(consent, '');
      if (status) {
        if (problems) {
          status.className = 'form-status bad';
          status.textContent = problems + (problems === 1 ? ' answer needs attention above.' : ' answers need attention above.');
        } else {
          form.reset();
          document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
          document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
          status.className = 'form-status ok';
          status.textContent = 'Received. Nastaran replies within four working days, with a first sketch date.';
        }
      }
    });
    form.addEventListener('reset', function () {
      document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
      document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
    });
  }

  window.__lattice = drawLattice;
})();
