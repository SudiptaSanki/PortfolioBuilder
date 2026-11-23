/* The instrument: a live kaleidoscope drawn on a canvas. One seed slice is
   mirrored into six, eight, twelve or sixteen sectors; the pointer steers the
   chamber and the palette changes the glass. */
(function () {
  'use strict';

  var canvas = document.getElementById('scope');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var SIZE = 760;
  var R = SIZE / 2;
  canvas.width = SIZE;
  canvas.height = SIZE;

  var seed = document.createElement('canvas');
  seed.width = 380;
  seed.height = 380;
  var sctx = seed.getContext('2d');

  var palettes = {
    velvet: ['#b0436e', '#7a3f8f', '#d98a5f', '#3a2050'],
    ember: ['#c4642c', '#8f2f1f', '#e0a24a', '#3a1c10'],
    ice: ['#5d93b5', '#8fc6d8', '#2f5a70', '#152833'],
    citrine: ['#b99a3c', '#d9c47a', '#6f5a1e', '#2a2410']
  };

  var palette = 'velvet';
  var folds = 12;
  var frozen = false;
  var pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  var phase = 0;
  var visible = true;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawSeed(time) {
    var colors = palettes[palette];
    var w = seed.width;
    var h = seed.height;
    var cx = w / 2;
    var cy = h / 2;

    sctx.clearRect(0, 0, w, h);

    var px = (pointer.x - 0.5) * 40;
    var py = (pointer.y - 0.5) * 40;

    /* ground: dark at the rim, a small hot centre */
    var base = sctx.createRadialGradient(cx, cy, 4, cx, cy, w * 0.66);
    base.addColorStop(0, 'rgba(255, 238, 208, 1)');
    base.addColorStop(0.05, 'rgba(255, 186, 120, 1)');
    base.addColorStop(0.16, colors[2]);
    base.addColorStop(0.38, colors[0]);
    base.addColorStop(0.68, colors[1]);
    base.addColorStop(1, colors[3]);
    sctx.fillStyle = base;
    sctx.fillRect(0, 0, w, h);

    /* hard bands: each a ring with a dark separation line */
    for (var b = 0; b < 7; b += 1) {
      var r0 = 30 + b * 24;
      var band = sctx.createRadialGradient(cx, cy, r0, cx, cy, r0 + 22);
      band.addColorStop(0, 'rgba(10, 7, 14, 0.55)');
      band.addColorStop(0.18, colors[(b + 1) % colors.length]);
      band.addColorStop(1, 'rgba(10, 7, 14, 0.15)');
      sctx.beginPath();
      sctx.arc(cx + px * 0.2, cy + py * 0.2, r0 + 22, 0, Math.PI * 2);
      sctx.arc(cx + px * 0.2, cy + py * 0.2, r0, 0, Math.PI * 2, true);
      sctx.fillStyle = band;
      sctx.fill();
    }

    /* petals: diamonds set along an arc, alternating colour */
    for (var i = 0; i < 7; i += 1) {
      var angle = 0.18 + i * 0.16 + Math.sin(time * 0.25 + i) * 0.02;
      var radius = 52 + (i % 3) * 40 + ((px * Math.cos(angle) + py * Math.sin(angle)) * 0.5);
      var x = cx + Math.cos(angle) * radius;
      var y = cy + Math.sin(angle) * radius;
      var len = 26 + (i % 2) * 14;
      var wide = 9 + (i % 3) * 3;

      sctx.save();
      sctx.translate(x, y);
      sctx.rotate(angle);
      sctx.beginPath();
      sctx.moveTo(-len, 0);
      sctx.lineTo(0, -wide);
      sctx.lineTo(len, 0);
      sctx.lineTo(0, wide);
      sctx.closePath();
      sctx.fillStyle = colors[i % 3];
      sctx.globalAlpha = 0.92;
      sctx.fill();
      sctx.globalAlpha = 1;
      sctx.strokeStyle = 'rgba(255, 244, 224, 0.65)';
      sctx.lineWidth = 0.8;
      sctx.stroke();
      sctx.restore();
    }

    /* thin bright needles from the centre */
    for (var j = 0; j < 5; j += 1) {
      var a = 0.25 + j * 0.22 + time * 0.05;
      sctx.beginPath();
      sctx.moveTo(cx, cy);
      sctx.lineTo(cx + Math.cos(a) * 230, cy + Math.sin(a) * 230);
      sctx.strokeStyle = 'rgba(255, 248, 232, ' + (0.16 + j * 0.03) + ')';
      sctx.lineWidth = 1.4 - j * 0.15;
      sctx.stroke();
    }

    /* specks that read as foil in the cell */
    for (var k = 0; k < 8; k += 1) {
      var ka = 0.1 + k * 0.19 + time * 0.1;
      var kr = 40 + ((k * 37) % 170);
      sctx.beginPath();
      sctx.arc(cx + Math.cos(ka) * kr, cy + Math.sin(ka) * kr, 1.4 + (k % 3), 0, Math.PI * 2);
      sctx.fillStyle = 'rgba(255, 250, 238, 0.85)';
      sctx.fill();
    }
  }

  function draw(time) {
    var angle = (Math.PI * 2) / folds;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0810';
    ctx.fillRect(0, 0, SIZE, SIZE);

    for (var i = 0; i < folds; i += 1) {
      ctx.save();
      ctx.translate(R, R);
      ctx.rotate(i * angle + time * 0.02);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R + 2, 0, angle);
      ctx.closePath();
      ctx.clip();
      if (i % 2 === 1) ctx.scale(1, -1);
      var drift = Math.sin(time * 0.2) * 6;
      ctx.drawImage(seed, -R + drift, -R, SIZE, SIZE);
      ctx.restore();
    }

    /* the lens edge */
    var edge = ctx.createRadialGradient(R, R, R * 0.55, R, R, R);
    edge.addColorStop(0, 'rgba(11, 8, 16, 0)');
    edge.addColorStop(0.86, 'rgba(11, 8, 16, 0.35)');
    edge.addColorStop(1, 'rgba(11, 8, 16, 0.95)');
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.arc(R, R, R, 0, Math.PI * 2);
    ctx.fill();

    /* brass rim */
    ctx.beginPath();
    ctx.arc(R, R, R - 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 164, 92, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  var last = 0;
  function frame(now) {
    if (!visible) { requestAnimationFrame(frame); return; }
    var t = now / 1000;
    if (!frozen) {
      phase = t;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      drawSeed(t);
      draw(t);
    }
    requestAnimationFrame(frame);
  }

  function still() {
    drawSeed(0);
    draw(0);
  }

  /* controls */
  document.querySelectorAll('[data-fold]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-fold]').forEach(function (other) {
        other.classList.remove('is-on');
        other.setAttribute('aria-checked', 'false');
      });
      button.classList.add('is-on');
      button.setAttribute('aria-checked', 'true');
      folds = Number(button.getAttribute('data-fold'));
      window.__scopeState.folds = folds;
      if (reduce || frozen) still();
    });
  });

  document.querySelectorAll('[data-palette]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-palette]').forEach(function (other) {
        other.classList.remove('is-on');
        other.setAttribute('aria-checked', 'false');
      });
      button.classList.add('is-on');
      button.setAttribute('aria-checked', 'true');
      palette = button.getAttribute('data-palette');
      window.__scopeState.palette = palette;
      if (reduce || frozen) still();
    });
  });

  var turn = document.getElementById('turn');
  if (turn) {
    turn.addEventListener('click', function () {
      frozen = !frozen;
      turn.setAttribute('aria-pressed', String(frozen));
      turn.textContent = frozen ? 'Let it turn' : 'Hold the view';
      window.__scopeState.frozen = frozen;
      if (frozen) still();
    });
  }

  /* pointer steering */
  function steer(event) {
    var rect = canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width;
    var y = (event.clientY - rect.top) / rect.height;
    pointer.tx = Math.min(1, Math.max(0, x));
    pointer.ty = Math.min(1, Math.max(0, y));
    if (reduce || frozen) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
      still();
    }
  }

  canvas.addEventListener('pointermove', steer);
  canvas.addEventListener('pointerdown', function (event) {
    canvas.setPointerCapture && canvas.setPointerCapture(event.pointerId);
    steer(event);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(canvas);
  }

  window.__scopeState = { folds: folds, palette: palette, frozen: frozen, frames: 0 };
  var counter = 0;
  var originalDraw = draw;
  draw = function (t) { counter += 1; window.__scopeState.frames = counter; originalDraw(t); };

  drawSeed(0);
  draw(0);

  if (!reduce) requestAnimationFrame(frame);
  window.__scopeReady = true;
})();
