/* Haldi Hour — interactions and the procedural mehndi studio.
   Silent build: no audio. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('rail-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  /* ---------- reveal ---------- */
  var targets = document.querySelectorAll('.bands article, .canvas-card, .controls, .clock li, .entry, .practice-list li, .form-panel, .side-info, .side-card, .page-top .lead, .sec-head');
  if ('IntersectionObserver' in window && !reduce) {
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- mehndi studio ---------- */
  var canvas = document.getElementById('mehndi');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var W = 560, H = 680;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.aspectRatio = W + ' / ' + H;
    ctx.scale(dpr, dpr);

    var seed = 11;
    var state = { motif: 'paisley', density: 2 };

    function rng() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    function handPath() {
      var p = new Path2D();
      p.ellipse(280, 462, 119, 134, 0, 0, Math.PI * 2);
      p.rect(216, 512, 128, 176);
      var fingers = [
        { x: 197, y: 148, w: 57, h: 262, r: 28, rot: -5 },
        { x: 253, y: 116, w: 58, h: 292, r: 29, rot: 0 },
        { x: 309, y: 140, w: 56, h: 268, r: 28, rot: 4 },
        { x: 361, y: 196, w: 50, h: 212, r: 25, rot: 9 }
      ];
      fingers.forEach(function (f) {
        var cxp = f.x + f.w / 2;
        var cyp = f.y + f.h / 2;
        var rp = new Path2D();
        rp.roundRect(-f.w / 2, -f.h / 2, f.w, f.h, f.r);
        p.addPath(rp, new DOMMatrix().translate(cxp, cyp).rotate(f.rot));
      });
      var th = new Path2D();
      th.roundRect(-27, -186, 54, 206, 27);
      p.addPath(th, new DOMMatrix().translate(202, 556).rotate(-40));
      return p;
    }

    var PATH = handPath();

    function drawPaisley(c, cx, cy, s, rot) {
      c.save();
      c.translate(cx, cy);
      c.rotate(rot);
      c.scale(s, s);
      c.beginPath();
      c.moveTo(0, -20);
      c.bezierCurveTo(15, -21, 23, -6, 15, 6);
      c.bezierCurveTo(8, 16, -7, 17, -13, 8);
      c.bezierCurveTo(-19, -1, -13, -11, -6, -10);
      c.stroke();
      c.beginPath();
      c.arc(-1, -2, 6, 0.5, 4.4);
      c.stroke();
      c.beginPath();
      c.arc(0, -20, 1.8, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function drawLotus(c, cx, cy, r, n) {
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 - Math.PI / 2;
        c.save();
        c.translate(cx, cy);
        c.rotate(a);
        c.beginPath();
        c.moveTo(0, -r * 0.34);
        c.bezierCurveTo(r * 0.3, -r * 0.7, r * 0.16, -r, 0, -r);
        c.bezierCurveTo(-r * 0.16, -r, -r * 0.3, -r * 0.7, 0, -r * 0.34);
        c.stroke();
        c.beginPath();
        c.arc(0, -r * 0.55, 1.6, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    function drawJaali(c, x0, y0, w, h, cols, rows) {
      var cw = w / cols, ch = h / rows;
      for (var r = 0; r <= rows; r++) {
        for (var k = 0; k <= cols; k++) {
          var x = x0 + k * cw, y = y0 + r * ch;
          c.beginPath();
          c.arc(x + cw / 2, y, cw / 2, Math.PI, 0);
          c.stroke();
          c.beginPath();
          c.arc(x, y + ch / 2, cw / 2, -Math.PI / 2, Math.PI / 2);
          c.stroke();
        }
      }
    }

    function drawVine(c, x, y0, y1, amp, leafEvery) {
      c.beginPath();
      c.moveTo(x, y0);
      c.bezierCurveTo(x + amp, y0 + (y1 - y0) * 0.3, x - amp, y0 + (y1 - y0) * 0.7, x, y1);
      c.stroke();
      var steps = Math.floor((y1 - y0) / leafEvery);
      for (var i = 1; i < steps; i++) {
        var t = i / steps;
        var yy = y0 + (y1 - y0) * t;
        var xx = x + Math.sin(t * Math.PI * 2) * amp * 0.55;
        var dir = i % 2 === 0 ? 1 : -1;
        c.beginPath();
        c.moveTo(xx, yy);
        c.quadraticCurveTo(xx + 13 * dir, yy - 7, xx + 17 * dir, yy - 15);
        c.quadraticCurveTo(xx + 6 * dir, yy - 12, xx, yy);
        c.stroke();
        c.beginPath();
        c.arc(xx + 17 * dir, yy - 15, 1.7, 0, Math.PI * 2);
        c.fill();
      }
    }

    function drawFingers(c, d) {
      var fingers = [
        { x: 225, yTop: 168, yBase: 360 },
        { x: 282, yTop: 138, yBase: 370 },
        { x: 337, yTop: 162, yBase: 366 },
        { x: 386, yTop: 214, yBase: 372 }
      ];
      fingers.forEach(function (f, i) {
        var step = 30 - d * 5;
        var n = 0;
        for (var y = f.yTop + 18; y < f.yBase - 16; y += step) {
          if (n % 2 === 0) {
            c.beginPath();
            c.moveTo(f.x, y);
            c.quadraticCurveTo(f.x + 8, y - 6, f.x + 11, y - 13);
            c.quadraticCurveTo(f.x + 2, y - 11, f.x, y);
            c.stroke();
          } else {
            c.beginPath();
            c.arc(f.x, y, 2.1, 0, Math.PI * 2);
            c.fill();
          }
          c.beginPath();
          c.arc(f.x - 6, y + 13, 1.2, 0, Math.PI * 2);
          c.fill();
          c.beginPath();
          c.arc(f.x + 6, y + 13, 1.2, 0, Math.PI * 2);
          c.fill();
          n++;
        }
        c.beginPath();
        c.moveTo(f.x, f.yTop + 8);
        c.lineTo(f.x, f.yBase - 14);
        c.stroke();
        c.beginPath();
        for (var k = 0; k < 3; k++) {
          c.moveTo(f.x - 12 + k * 12, f.yBase - 4 + (k % 2) * 5);
          c.arc(f.x - 12 + k * 12, f.yBase - 4, 5.5, Math.PI, 0);
        }
        c.stroke();
        c.beginPath();
        c.arc(f.x, f.yBase - 12, 2.4, 0, Math.PI * 2);
        c.fill();
        if (i === 3) {
          drawPaisley(c, f.x + 18, f.yBase + 10, 0.6, 0.5);
        }
      });
    }

    function drawDesign() {
      var d = state.density;
      var off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      var c = off.getContext('2d');
      c.strokeStyle = '#5C2E1C';
      c.fillStyle = '#5C2E1C';
      c.lineWidth = d === 1 ? 1.4 : d === 2 ? 1.7 : 1.9;
      c.lineCap = 'round';
      c.lineJoin = 'round';

      /* wrist bands */
      var rows = d + 1;
      for (var r = 0; r < rows; r++) {
        var y = 566 + r * 26;
        c.beginPath();
        for (var x = 196; x <= 366; x += 22) {
          c.moveTo(x, y);
          c.arc(x + 11, y, 11, Math.PI, 0);
        }
        c.stroke();
        if (r < rows - 1) {
          for (var dx = 206; dx <= 356; dx += 22) {
            c.beginPath();
            c.arc(dx, y + 13, 1.8, 0, Math.PI * 2);
            c.fill();
          }
        }
      }
      c.beginPath();
      c.moveTo(198, 550);
      c.lineTo(364, 550);
      c.stroke();
      for (var wx = 206; wx <= 356; wx += 15) {
        c.beginPath();
        c.arc(wx, 558, 1.3, 0, Math.PI * 2);
        c.fill();
      }

      /* palm centre */
      var cx = 280, cy = 452;
      if (state.motif === 'paisley') {
        c.beginPath(); c.arc(cx, cy, 68, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(cx, cy, 60, 0, Math.PI * 2); c.setLineDash([3, 5]); c.stroke(); c.setLineDash([]);
        for (var q = 0; q < 16; q++) {
          var qa = q / 16 * Math.PI * 2;
          c.beginPath();
          c.arc(cx + Math.cos(qa) * 74, cy + Math.sin(qa) * 74, 1.6, 0, Math.PI * 2);
          c.fill();
        }
        var n = 4 + d;
        for (var i = 0; i < n; i++) {
          var a = (i / n) * Math.PI * 2;
          drawPaisley(c, cx + Math.cos(a) * 36, cy + Math.sin(a) * 36, 0.6, a + Math.PI / 2);
        }
        c.beginPath(); c.arc(cx, cy, 13, 0, Math.PI * 2); c.stroke();
        drawLotus(c, cx, cy, 11, 6);
        c.beginPath(); c.arc(cx, cy, 3, 0, Math.PI * 2); c.fill();
      } else if (state.motif === 'lotus') {
        c.beginPath(); c.arc(cx, cy, 74, 0, Math.PI * 2); c.stroke();
        drawLotus(c, cx, cy, 66, 6 + d * 2);
        drawLotus(c, cx, cy, 38, 5 + d);
        c.beginPath(); c.arc(cx, cy, 16, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(cx, cy, 5, 0, Math.PI * 2); c.fill();
        for (var k = 0; k < 12; k++) {
          var ang = k / 12 * Math.PI * 2;
          c.beginPath();
          c.arc(cx + Math.cos(ang) * 82, cy + Math.sin(ang) * 82, 1.7, 0, Math.PI * 2);
          c.fill();
        }
      } else if (state.motif === 'jaali') {
        c.save();
        c.beginPath();
        c.arc(cx, cy, 78, 0, Math.PI * 2);
        c.clip();
        drawJaali(c, cx - 78, cy - 78, 156, 156, 4, 4);
        c.restore();
        c.beginPath(); c.arc(cx, cy, 78, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(cx, cy, 30, 0, Math.PI * 2); c.stroke();
        drawLotus(c, cx, cy, 26, 6);
      } else {
        drawVine(c, cx, cy - 96, cy + 96, 34, 26 - d * 4);
        c.beginPath(); c.arc(cx, cy, 40, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(cx, cy, 32, 0, Math.PI * 2); c.setLineDash([2, 6]); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(cx, cy, 6, 0, Math.PI * 2); c.fill();
      }

      /* transition from palm to wrist */
      c.beginPath();
      c.moveTo(204, 528);
      c.quadraticCurveTo(280, 512, 356, 528);
      c.stroke();
      for (var tx = 212; tx <= 350; tx += 13) {
        c.beginPath();
        c.arc(tx, 518, 1.4, 0, Math.PI * 2);
        c.fill();
      }

      /* fingers */
      drawFingers(c, d);

      /* scattered fill dots, seeded */
      var dots = 18 + d * 14;
      for (var q = 0; q < dots; q++) {
        var px = 176 + rng() * 206;
        var py = 250 + rng() * 240;
        c.beginPath();
        c.arc(px, py, 1.1 + rng() * 1.1, 0, Math.PI * 2);
        c.fill();
      }

      /* keep only what falls inside the hand */
      c.globalCompositeOperation = 'destination-in';
      c.fill(PATH);
      c.globalCompositeOperation = 'source-over';
      return off;
    }

    function paint() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#F7E9D3';
      ctx.fillRect(0, 0, W, H);

      /* silhouette: stroke first, then fill over it, so the seams
         between the palm, fingers and thumb disappear */
      ctx.strokeStyle = 'rgba(140, 92, 58, 0.6)';
      ctx.lineWidth = 2.6;
      ctx.stroke(PATH);
      ctx.fillStyle = '#E9C8A4';
      ctx.fill(PATH);
      ctx.save();
      ctx.clip(PATH);
      var g = ctx.createLinearGradient(0, 120, 0, 660);
      g.addColorStop(0, 'rgba(255, 236, 214, 0.55)');
      g.addColorStop(1, 'rgba(196, 143, 101, 0.22)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      /* henna */
      var design = drawDesign();
      ctx.drawImage(design, 0, 0);
    }

    var nameEl = document.getElementById('designName');
    var conesEl = document.getElementById('cones');
    var sitEl = document.getElementById('sitTime');
    var dryEl = document.getElementById('dryTime');
    var noteEl = document.getElementById('studioNote');
    var densityOut = document.getElementById('densityOut');

    var NOTES = {
      paisley: 'A paisley wrist and palm is the pattern I draw when the bride wants tradition without a four-hour sitting.',
      lotus: 'Lotus centres sit best on a broad palm. On a narrow hand I shrink the outer circle and add a wrist band instead.',
      jaali: 'Jaali takes the steadiest hand of the four. It reads as lace at arm’s length and as a screen up close.',
      vine: 'Vine is the family pattern: one line up each finger, leaves alternating, and space left for a ring to show.'
    };

    function update() {
      state.motif = document.querySelector('input[name="motif"]:checked').value;
      state.density = Number(document.getElementById('density').value);
      var words = ['light', 'medium', 'dense'];
      var label = state.motif.charAt(0).toUpperCase() + state.motif.slice(1);
      nameEl.textContent = label + ' · ' + words[state.density - 1];
      densityOut.textContent = words[state.density - 1];
      conesEl.textContent = state.density === 1 ? '1½ cones' : state.density === 2 ? '2½ cones' : '3½ cones';
      sitEl.textContent = state.density === 1 ? '1 h 30' : state.density === 2 ? '2 h 10' : '3 h 20';
      dryEl.textContent = state.density === 1 ? '35 min' : state.density === 2 ? '45 min' : '60 min';
      noteEl.textContent = NOTES[state.motif];
      canvas.setAttribute('aria-label', 'A generated ' + label + ' mehndi pattern at ' + words[state.density - 1] + ' density, drawn on an open hand');
      paint();
    }

    document.querySelectorAll('input[name="motif"]').forEach(function (el) {
      el.addEventListener('change', update);
    });
    var density = document.getElementById('density');
    if (density) density.addEventListener('input', update);
    var redraw = document.getElementById('redraw');
    if (redraw) {
      redraw.addEventListener('click', function () {
        seed = (seed * 7 + 137) % 233280;
        paint();
      });
    }

    update();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('booking-form');
  if (form) {
    var status = document.getElementById('booking-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['name', 'email', 'message'].forEach(function (id) {
        var el = form.querySelector('#' + id);
        var wrap = el.closest('.field');
        var valid = el.value.trim().length > 0;
        if (id === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        wrap.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        status.className = 'form-status err on';
        status.textContent = 'I need a name, an email that works, and a line about the ceremony.';
        return;
      }
      var name = form.querySelector('#name').value.trim().split(' ')[0];
      var areas = Array.prototype.slice.call(form.querySelectorAll('.checks input:checked')).map(function (i) { return i.value; });
      status.className = 'form-status on';
      status.textContent = 'Thank you, ' + name + '. ' + (areas.length ? 'Noted: ' + areas.join(', ') + '. ' : '') + 'I check dates on Sunday and Thursday and will write back within two days. If the wedding is under a month away, send the venue name as well and I will try to fit it.';
      form.reset();
    });
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
