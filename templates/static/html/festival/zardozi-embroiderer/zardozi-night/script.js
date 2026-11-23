/* Saba Rizvi — zardozi sampler.
   Canvas hoop: velvet ground, an opt-in sheen, and five metal stitches laid along the pointer path. */

(function () {
  'use strict';

  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', nav.classList.toggle('is-open') ? 'true' : 'false');
    });
  }

  var canvas = document.getElementById('cloth');
  if (!canvas) { initForm(); return; }
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  var PAISLEY = 'M260 96 C380 84 472 174 458 274 C448 344 390 374 360 414 C342 438 366 458 386 446 C402 436 394 418 378 422 C380 376 322 326 306 256 C292 196 270 136 260 96 Z';

  var state = {
    stitch: 'salma',
    gauge: 20,
    tension: 10,
    guide: true,
    sheen: true,
    stitches: 0,
    metalMM: 0,
    drawing: false,
    last: null
  };

  var STITCH_NAMES = { salma: 'Salma', sitara: 'Sitara', dabka: 'Dabka', nakshi: 'Nakshi', kora: 'Kora' };
  var MM_PER_PX = 0.34;

  /* velvet ground, drawn once to an offscreen canvas */
  var ground = document.createElement('canvas');
  ground.width = W; ground.height = H;
  (function paintGround() {
    var g = ground.getContext('2d');
    var grad = g.createLinearGradient(0, 0, W * 0.6, H);
    grad.addColorStop(0, '#151A34');
    grad.addColorStop(0.55, '#10142A');
    grad.addColorStop(1, '#0C0F20');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    for (var i = 0; i < 5200; i++) {
      var x = Math.random() * W, y = Math.random() * H;
      g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.028 + 0.006) + ')';
      g.fillRect(x, y, 1, 1);
    }
    for (var j = 0; j < 90; j++) {
      var x2 = Math.random() * W, y2 = Math.random() * H;
      g.strokeStyle = 'rgba(10,12,26,' + (Math.random() * 0.25 + 0.1) + ')';
      g.beginPath();
      g.moveTo(x2, y2);
      g.lineTo(x2 + Math.random() * 26 - 13, y2 + Math.random() * 26 - 13);
      g.stroke();
    }
    g.strokeStyle = 'rgba(201,162,39,.16)';
    g.lineWidth = 1;
    g.strokeRect(8.5, 8.5, W - 17, H - 17);
  })();

  /* stitches live on their own layer so the guide can be toggled without losing work */
  var layer = document.createElement('canvas');
  layer.width = W; layer.height = H;
  var lctx = layer.getContext('2d');
  var target = lctx;

  var guidePath = new Path2D(PAISLEY);

  function drawGuide() {
    if (!state.guide) return;
    ctx.save();
    ctx.setLineDash([2, 7]);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(201,162,39,.34)';
    ctx.stroke(guidePath);
    ctx.setLineDash([]);
    ctx.restore();
  }

  function redraw() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(ground, 0, 0);
    if (state.guide) {
      drawGuide();
    } else {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(201,162,39,.14)';
      ctx.strokeRect(8.5, 8.5, W - 17, H - 17);
      ctx.restore();
    }
    ctx.drawImage(layer, 0, 0);
  }

  /* ---------- metal ---------- */
  function metalGradient(x, y, r) {
    var g = target.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, state.sheen ? '#FBEDC4' : '#E3C576');
    g.addColorStop(0.45, '#D9B457');
    g.addColorStop(0.75, '#A9832C');
    g.addColorStop(1, state.sheen ? '#F0D79C' : '#8E6E22');
    return g;
  }

  function bead(px, py, angle) {
    var c = target;
    var r = state.gauge / 20;
    var spacing = (16 - state.tension) * 0.9 + state.gauge * 0.35;
    var scale = spacing / 12;
    c.save();
    c.translate(px, py);
    c.rotate(angle);
    var grad = metalGradient(px, py, 7 * r);
    c.fillStyle = grad;
    c.strokeStyle = 'rgba(60,45,10,.55)';
    c.lineWidth = 0.5;

    if (state.stitch === 'salma') {
      c.beginPath();
      c.ellipse(0, 0, 7.2 * r * scale, 2.5 * r, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(-5 * r, -0.6);
      c.lineTo(5 * r, -0.6);
      c.strokeStyle = 'rgba(255,248,220,.5)';
      c.stroke();
      state.metalMM += 14 * r * scale * MM_PER_PX * 2;
    } else if (state.stitch === 'sitara') {
      c.beginPath();
      c.arc(0, 0, 4.4 * r, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(0, 0, 1.5 * r, 0, Math.PI * 2);
      c.fillStyle = '#10142A';
      c.fill();
      c.beginPath();
      c.arc(-1.2 * r, -1.2 * r, 1.2 * r, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,248,220,.65)';
      c.fill();
      state.metalMM += 8.8 * r * MM_PER_PX * 2;
    } else if (state.stitch === 'dabka') {
      for (var i = -1; i <= 1; i++) {
        c.beginPath();
        c.arc(i * 3.1 * r, 0, 2.3 * r, 0, Math.PI * 2);
        c.fillStyle = i === 0 ? grad : 'rgba(201,162,39,.9)';
        c.fill();
      }
      state.metalMM += 6 * r * MM_PER_PX * 4;
    } else if (state.stitch === 'nakshi') {
      c.beginPath();
      c.arc(-2.6 * r, 0, 3.1 * r, Math.PI * 0.9, Math.PI * 2.1, false);
      c.strokeStyle = grad;
      c.lineWidth = 1.7 * r;
      c.stroke();
      c.beginPath();
      c.arc(3.2 * r, 0, 3.1 * r, Math.PI * 0.9, Math.PI * 2.1, false);
      c.stroke();
      state.metalMM += 11 * r * MM_PER_PX * 2;
    } else {
      c.beginPath();
      c.rect(-8 * r * scale, -1.1 * r, 16 * r * scale, 2.2 * r);
      c.fill();
      c.strokeStyle = 'rgba(255,248,220,.35)';
      c.beginPath();
      c.moveTo(-7 * r, -0.5);
      c.lineTo(7 * r, -0.5);
      c.stroke();
      state.metalMM += 16 * r * scale * MM_PER_PX * 1.4;
    }
    c.restore();
  }

  function lay(x, y, angle) {
    bead(x, y, angle);
    state.stitches++;
  }

  function spacing() {
    return (16 - state.tension) * 0.9 + state.gauge * 0.35;
  }

  /* ---------- pointer ---------- */
  function toCanvas(ev) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * (W / r.width),
      y: (ev.clientY - r.top) * (H / r.height)
    };
  }

  function onDown(ev) {
    canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
    state.drawing = true;
    var p = toCanvas(ev);
    state.last = p;
    lay(p.x, p.y, 0);
    redrawLast();
    updateTally();
    ev.preventDefault();
  }

  function onMove(ev) {
    if (!state.drawing) return;
    var p = toCanvas(ev);
    var dx = p.x - state.last.x, dy = p.y - state.last.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.8) return;
    var ang = Math.atan2(dy, dx);
    var step = spacing();
    var n = Math.floor(dist / step);
    for (var i = 1; i <= n; i++) {
      lay(state.last.x + (dx * (i * step / dist)), state.last.y + (dy * (i * step / dist)), ang);
    }
    if (n > 0) {
      state.last = { x: state.last.x + dx * (n * step / dist), y: state.last.y + dy * (n * step / dist) };
      updateTally();
    }
    ev.preventDefault();
  }

  function onUp() {
    state.drawing = false;
    state.last = null;
  }

  var raf = null;
  function redrawLast() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = null;
      redraw();
    });
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onUp);

  /* ---------- tally ---------- */
  function updateTally() {
    document.getElementById('stitchCount').textContent = String(state.stitches);
    document.getElementById('metalLen').textContent = (state.metalMM / 10).toFixed(1) + ' cm';
    document.getElementById('stitchName').textContent = STITCH_NAMES[state.stitch];
    var hint = document.getElementById('canvasHint');
    if (state.stitches === 0) hint.textContent = 'Press and drag to stitch. Start anywhere inside the frame.';
    else if (state.stitches < 40) hint.textContent = 'Keep going. A real border takes about four hundred stitches per centimetre.';
    else hint.textContent = 'That is ' + state.stitches + ' stitches — enough to edge a cuff. A bridal border runs to six figures.';
  }

  /* ---------- controls ---------- */
  document.querySelectorAll('[data-stitch]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-stitch]').forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true');
      state.stitch = btn.getAttribute('data-stitch');
      updateTally();
    });
  });

  var gauge = document.getElementById('gauge');
  gauge.addEventListener('input', function () {
    state.gauge = parseInt(this.value, 10);
    document.getElementById('gaugeOut').textContent = (state.gauge / 10).toFixed(1) + ' mm';
  });

  var tension = document.getElementById('tension');
  tension.addEventListener('input', function () {
    state.tension = parseInt(this.value, 10);
    var t = state.tension;
    document.getElementById('tensionOut').textContent = t < 9 ? 'loose' : t < 13 ? 'firm' : 'tight';
  });

  document.getElementById('guideOn').addEventListener('change', function () {
    state.guide = this.checked;
    redraw();
  });
  document.getElementById('sheenOn').addEventListener('change', function () {
    state.sheen = this.checked;
  });

  document.getElementById('clearBtn').addEventListener('click', function () {
    state.stitches = 0;
    state.metalMM = 0;
    lctx.clearRect(0, 0, W, H);
    redraw();
    updateTally();
  });

  /* ---------- stitch the motif: walks the paisley path ---------- */
  var motifRunning = false;
  document.getElementById('motifBtn').addEventListener('click', function () {
    if (motifRunning) return;
    motifRunning = true;
    redraw();
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute'; svg.style.opacity = '0';
    var path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', PAISLEY);
    svg.appendChild(path);
    document.body.appendChild(svg);
    var len = path.getTotalLength();
    var step = Math.max(6, spacing() * 0.8);
    var pos = 0;
    var total = Math.ceil(len / step);

    function frame() {
      if (pos > total) {
        /* six sitara accents inside the motif */
        [[430, 208], [415, 268], [380, 328], [350, 258], [340, 388], [400, 158]].forEach(function (p) {
          var saved = state.stitch;
          state.stitch = 'sitara';
          lay(p[0], p[1], 0);
          state.stitch = saved;
        });
        redraw();
        updateTally();
        document.body.removeChild(svg);
        motifRunning = false;
        return;
      }
      var a = path.getPointAtLength(Math.min(len, pos * step));
      var b = path.getPointAtLength(Math.min(len, pos * step + 2));
      var ang = Math.atan2(b.y - a.y, b.x - a.x);
      lay(a.x, a.y, ang);
      redraw();
      pos++;
      if (pos % 6 === 0) updateTally();
      requestAnimationFrame(frame);
    }
    frame();
  });

  /* ---------- commission form ---------- */
  function initForm() {
    var form = document.getElementById('commissionForm');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      form.querySelectorAll('[data-required]').forEach(function (input) {
        var wrap = input.closest('.field');
        var v = (input.value || '').trim();
        var bad = !v;
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        wrap.classList.toggle('bad', bad);
        if (bad) ok = false;
      });
      var okBox = document.getElementById('okBox');
      var badSum = document.getElementById('badSum');
      if (okBox) okBox.classList.toggle('show', ok);
      if (badSum) badSum.classList.toggle('show', !ok);
      if (ok && okBox) { okBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); form.reset(); }
    });
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var w = el.closest('.field');
        if (w) w.classList.remove('bad');
      });
    });
  }

  redraw();
  updateTally();
  initForm();
})();
