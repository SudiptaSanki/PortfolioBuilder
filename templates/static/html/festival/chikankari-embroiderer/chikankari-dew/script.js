/* Chikankari Dew — stitch bench on canvas, navigation, commission form.
   No libraries, no audio. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var top = document.querySelector('.top');
  var navBtn = document.getElementById('navBtn');
  if (top && navBtn) {
    navBtn.addEventListener('click', function () {
      var open = top.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      navBtn.textContent = open ? 'Close' : 'Menu';
    });
    top.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        top.classList.remove('nav-open');
        navBtn.setAttribute('aria-expanded', 'false');
        navBtn.textContent = 'Menu';
      });
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- stitch bench ---------- */
  var canvas = document.getElementById('stitchCanvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var motifSel = document.getElementById('motif');
    var clothSel = document.getElementById('cloth');
    var sizeRange = document.getElementById('size');
    var densityRange = document.getElementById('density');
    var form = document.getElementById('stitchForm');
    var noteEl = document.getElementById('frameNote');
    var verdictEl = document.getElementById('verdict');

    var CLOTH = {
      mulmul: { label: 'Mulmul · 100 count', weave: 3, cost: 600, handle: 1 },
      voile: { label: 'Cotton voile · 80 count', weave: 4, cost: 520, handle: 1.05 },
      khadi: { label: 'Khadi · 60 count', weave: 7, cost: 460, handle: 1.18 },
      georgette: { label: 'Georgette', weave: 2, cost: 780, handle: 1.3 }
    };
    var MOTIF = {
      buti: { name: 'Buti · six petals', factor: 2.6, fill: 0.35 },
      ambi: { name: 'Ambi · paisley', factor: 3.4, fill: 0.3 },
      jaali: { name: 'Jaali · square lattice', factor: 5.2, fill: 0.15 },
      leaf: { name: 'Bakhiya leaf', factor: 2.9, fill: 0.4 }
    };

    function fabric(kind, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f8f2e4';
      ctx.fillRect(0, 0, W, H);
      var step = CLOTH[kind].weave;
      ctx.strokeStyle = 'rgba(47, 59, 82, 0.06)';
      ctx.lineWidth = 1;
      for (var x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke();
      }
      for (var y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke();
      }
      if (kind === 'khadi') {
        ctx.strokeStyle = 'rgba(47, 59, 82, 0.09)';
        for (var i = 0; i < 26; i++) {
          var yy = 12 + i * (H / 26);
          ctx.beginPath();
          ctx.moveTo(20 + (i * 53) % 200, yy);
          ctx.lineTo(180 + (i * 79) % Math.max(220, W - 120), yy + 2);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = 'rgba(47, 59, 82, 0.13)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.strokeRect(12, 12, W - 24, H - 24);
      ctx.setLineDash([]);
    }

    function stitchPath(draw, r, thread, dash) {
      ctx.save();
      ctx.setLineDash(dash || [4.5, 3.2]);
      ctx.lineCap = 'round';
      ctx.save();
      ctx.translate(0, 2.2);
      ctx.strokeStyle = 'rgba(47, 59, 82, 0.38)';
      ctx.lineWidth = 3.6;
      draw();
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = thread || '#ffffff';
      ctx.lineWidth = 2.6;
      draw();
      ctx.stroke();
      ctx.restore();
    }

    function knot(x, y, r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(47, 59, 82, 0.2)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 0.5, y - 0.8, r * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#fffdf8';
      ctx.fill();
    }

    function drawButi(r) {
      for (var p = 0; p < 6; p++) {
        var a = (p / 6) * Math.PI * 2 - Math.PI / 2;
        (function (ang) {
          stitchPath(function () {
            ctx.beginPath();
            ctx.ellipse(Math.cos(ang) * r * 0.52, Math.sin(ang) * r * 0.52, r * 0.34, r * 0.2, ang, 0, Math.PI * 2);
          }, r);
          ctx.save();
          ctx.translate(Math.cos(ang) * r * 0.52, Math.sin(ang) * r * 0.52);
          ctx.rotate(ang);
          stitchPath(function () {
            ctx.beginPath();
            ctx.moveTo(-r * 0.2, 0);
            ctx.quadraticCurveTo(0, -r * 0.07, r * 0.2, 0);
          }, r);
          ctx.restore();
        })(a);
      }
      stitchPath(function () {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.17, 0, Math.PI * 2);
      }, r, '#fffdf8', [2.4, 2.4]);
      for (var k = 0; k < 6; k++) {
        var ka = (k / 6) * Math.PI * 2;
        knot(Math.cos(ka) * r * 0.08, Math.sin(ka) * r * 0.08, 1.9);
      }
    }

    function drawAmbi(r) {
      stitchPath(function () {
        ctx.beginPath();
        ctx.moveTo(0, r * 0.92);
        ctx.bezierCurveTo(-r * 0.78, r * 0.5, -r * 0.8, -r * 0.3, -r * 0.26, -r * 0.76);
        ctx.bezierCurveTo(r * 0.18, -r * 1.04, r * 0.82, -r * 0.58, r * 0.76, -r * 0.08);
        ctx.bezierCurveTo(r * 0.7, r * 0.52, r * 0.32, r * 0.78, 0, r * 0.92);
      }, r);
      stitchPath(function () {
        ctx.beginPath();
        ctx.moveTo(0, r * 0.7);
        ctx.bezierCurveTo(-r * 0.56, r * 0.36, -r * 0.56, -r * 0.22, -r * 0.16, -r * 0.58);
        ctx.bezierCurveTo(r * 0.14, -r * 0.8, r * 0.6, -r * 0.42, r * 0.54, -r * 0.04);
      }, r, '#fffdf8', [3, 3.6]);
      stitchPath(function () {
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, r * 0.3);
        ctx.quadraticCurveTo(r * 0.15, -r * 0.1, r * 0.34, -r * 0.42);
      }, r, '#fffdf8', [2.2, 3]);
      knot(-r * 0.08, r * 0.16, 1.8);
      knot(r * 0.16, r * 0.04, 1.6);
      knot(r * 0.02, -r * 0.18, 1.5);
    }

    function drawJaali(r) {
      var n = 4, cell = (r * 1.55) / n, x0 = -r * 0.775, y0 = -r * 0.775;
      stitchPath(function () {
        ctx.beginPath();
        ctx.rect(x0, y0, r * 1.55, r * 1.55);
      }, r);
      for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
          var x = x0 + i * cell, y = y0 + j * cell;
          stitchPath(function () {
            ctx.beginPath();
            ctx.rect(x + 3, y + 3, cell - 6, cell - 6);
          }, r, '#fffdf8', [2.2, 2]);
          ctx.fillStyle = 'rgba(47, 59, 82, 0.07)';
          ctx.fillRect(x + 8, y + 8, cell - 16, cell - 16);
          stitchPath(function () {
            ctx.beginPath();
            ctx.moveTo(x + cell / 2 - 4, y + cell / 2);
            ctx.lineTo(x + cell / 2 + 4, y + cell / 2);
            ctx.moveTo(x + cell / 2, y + cell / 2 - 4);
            ctx.lineTo(x + cell / 2, y + cell / 2 + 4);
          }, r, '#fffdf8', [1.2, 2]);
        }
      }
    }

    function drawLeaf(r) {
      stitchPath(function () {
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.bezierCurveTo(r * 0.72, -r * 0.45, r * 0.62, r * 0.5, 0, r);
        ctx.bezierCurveTo(-r * 0.62, r * 0.5, -r * 0.72, -r * 0.45, 0, -r);
      }, r);
      stitchPath(function () {
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.86);
        ctx.lineTo(0, r * 0.86);
      }, r, '#fffdf8', [3, 2.6]);
      for (var i = 1; i < 7; i++) {
        var y = -r * 0.8 + (i / 7) * r * 1.6;
        var half = r * 0.5 * Math.sin((i / 7) * Math.PI);
        stitchPath(function () {
          ctx.beginPath();
          ctx.moveTo(-half, y);
          ctx.quadraticCurveTo(0, y - r * 0.08, half, y);
        }, r, '#fffdf8', [2.4, 3]);
      }
    }

    function drawMotif(kind, cx, cy, r) {
      ctx.save();
      ctx.translate(cx, cy);
      if (kind === 'buti') drawButi(r);
      else if (kind === 'ambi') drawAmbi(r);
      else if (kind === 'jaali') drawJaali(r);
      else drawLeaf(r);
      ctx.restore();
      ctx.strokeStyle = 'rgba(47, 59, 82, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawSample() {
      var kind = motifSel.value;
      var cloth = clothSel.value;
      var size = Number(sizeRange.value);
      var density = Number(densityRange.value);

      /* draw at the real CSS width so the stitches stay crisp on a phone */
      var cssW = Math.max(280, canvas.clientWidth || 880);
      var cssH = Math.round(cssW * (cssW < 560 ? 0.78 : 0.58));
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var W = cssW, H = cssH;
      fabric(cloth, W, H);

      var cols = W < 560 ? 2 : 3;
      var cellW = W / cols;
      var r = cellW * 0.2 * (0.72 + size / 17);
      var rows = 2;
      var top = 42, bottom = 54;
      var cellH = (H - top - bottom) / rows;

      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          drawMotif(kind, cellW * (i + 0.5), top + cellH * (j + 0.5), r);
        }
      }

      var mx = cellW * 0.5, my = top - 14;
      ctx.strokeStyle = 'rgba(47, 59, 82, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx - r, my); ctx.lineTo(mx + r, my);
      ctx.moveTo(mx - r, my - 5); ctx.lineTo(mx - r, my + 5);
      ctx.moveTo(mx + r, my - 5); ctx.lineTo(mx + r, my + 5);
      ctx.stroke();
      ctx.fillStyle = '#2f3b52';
      var fs = Math.max(9, Math.round(W / 72));
      ctx.font = '500 ' + fs + 'px "Spline Sans Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(size.toFixed(1) + ' CM', mx, my - 7);

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(47, 59, 82, 0.55)';
      ctx.font = '500 ' + fs + 'px "Spline Sans Mono", monospace';
      ctx.fillText('SAMPLE · ' + cloth.toUpperCase() + ' · ' + density + ' / CM', 20, H - 16);
      ctx.textAlign = 'right';
      ctx.fillText('Z. SIDDIQUI', W - 20, H - 16);
      ctx.strokeStyle = 'rgba(47, 59, 82, 0.3)';
      ctx.beginPath();
      ctx.moveTo(W - 120, H - 28); ctx.lineTo(W - 20, H - 28);
      ctx.moveTo(W - 120, H - 32); ctx.lineTo(W - 120, H - 24);
      ctx.moveTo(W - 20, H - 32); ctx.lineTo(W - 20, H - 24);
      ctx.stroke();
    }

    function fmt(n) { return n.toLocaleString('en-IN'); }

    function compute() {
      var kind = motifSel.value;
      var cloth = clothSel.value;
      var size = Number(sizeRange.value);
      var density = Number(densityRange.value);

      var perMotif = size * density * MOTIF[kind].factor * (1 + MOTIF[kind].fill);
      var stitches = Math.round(perMotif * 6);
      var thread = stitches * 1.6 * 1.18 / 100;
      var hours = stitches / 430;
      var price = Math.round((hours * 420 + CLOTH[cloth].cost + 250 + 350) / 10) * 10;

      document.getElementById('sizeOut').textContent = size.toFixed(1) + ' cm';
      document.getElementById('densityOut').textContent = density + ' / cm';
      document.getElementById('outStitches').textContent = fmt(stitches);
      document.getElementById('outThread').textContent = Math.round(thread) + ' m';
      document.getElementById('outHours').textContent = hours.toFixed(1);
      document.getElementById('outPrice').textContent = '₹' + fmt(price);
      document.getElementById('motifName').textContent = MOTIF[kind].name;
      document.getElementById('clothName').textContent = CLOTH[cloth].label;

      noteEl.textContent = 'A ' + MOTIF[kind].name.split(' · ')[0].toLowerCase() + ' on ' + CLOTH[cloth].label.split(' · ')[0].toLowerCase() + ', worked at ' + density + ' stitches to the centimetre. The block-printed guides are the faint indigo lines.';

      var v = '';
      if (density > 17) v = 'At ' + density + ' stitches to the centimetre this is bridal density: beautiful, slow, and priced for it. Six motifs at this count will take a karigar most of a week.';
      else if (density < 10) v = 'Below ten to the centimetre the shadow stops reading and the motif looks sketched rather than worked. On mulmul the cloth will also pucker at the outline.';
      else v = 'A ' + MOTIF[kind].name.split(' · ')[0].toLowerCase() + ' at this density is a ' + hours.toFixed(1) + '-hour motif. On ' + CLOTH[cloth].label.split(' · ')[0].toLowerCase() + ' the stitches sink into the cloth and the shadow reads at arm\'s length, which is the point.';

      if (cloth === 'georgette') v += ' Georgette needs a frame and almost no tension; above sixteen to the centimetre it pulls.';
      if (cloth === 'khadi') v += ' Khadi’s slub catches the needle, so keep the count low or the motif goes lumpy.';
      if (size > 8) v += ' Above eight centimetres this is a buta rather than a buti, and it needs a larger frame and a slower hand.';
      verdictEl.textContent = v;

      drawSample();
    }

    [motifSel, clothSel].forEach(function (s) { s.addEventListener('change', compute); });
    [sizeRange, densityRange].forEach(function (s) { s.addEventListener('input', compute); });
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });
    compute();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(drawSample, 160);
    });
    if (!reduced) {
      canvas.style.opacity = '0';
      requestAnimationFrame(function () {
        canvas.style.transition = 'opacity 700ms ease';
        canvas.style.opacity = '1';
      });
    }
  }

  /* ---------- piece filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var rows = document.querySelectorAll('.ledger');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var key = btn.getAttribute('data-filter');
      filters.querySelectorAll('.filter').forEach(function (f) {
        var on = f === btn;
        f.classList.toggle('is-on', on);
        f.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      rows.forEach(function (r) { r.hidden = key !== 'all' && r.getAttribute('data-kind') !== key; });
      var count = document.getElementById('pieceCount');
      if (count) {
        var n = 0;
        rows.forEach(function (r) { if (!r.hidden) n++; });
        count.textContent = n + (n === 1 ? ' piece' : ' pieces');
      }
    });
  }

  /* ---------- commission form ---------- */
  var commission = document.getElementById('commissionForm');
  if (commission) {
    var note = document.getElementById('formNote');
    commission.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var piece = document.getElementById('piece');
      var when = document.getElementById('when');
      var message = document.getElementById('message');
      var consent = document.getElementById('consent');
      var ok = true;
      function show(id, msg) { var n = document.getElementById(id); if (n) n.textContent = msg || ''; }
      ['errName', 'errEmail', 'errPiece', 'errWhen', 'errMessage', 'errConsent'].forEach(function (id) { show(id, ''); });

      if (!name.value.trim() || name.value.trim().length < 2) { show('errName', 'A name for the commission.'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { show('errEmail', 'That address will not reach the studio.'); ok = false; }
      if (!piece.value) { show('errPiece', 'Choose the kind of piece.'); ok = false; }
      if (!when.value) { show('errWhen', 'A date, even an approximate one, helps me plan the frame.'); ok = false; }
      if (message.value.trim().length < 15) { show('errMessage', 'Tell me the cloth, the colour and where the piece is worn.'); ok = false; }
      if (!consent.checked) { show('errConsent', 'Please tick the box so I may reply.'); ok = false; }

      if (!ok) {
        if (note) note.hidden = true;
        var first = commission.querySelector('.err:not(:empty)');
        if (first) first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
      if (note) {
        note.hidden = false;
        note.textContent = 'Received, ' + name.value.trim().split(' ')[0] + '. The studio answers on Monday and Thursday. If the date is inside eight weeks I will say at once whether it is possible rather than hold you in suspense.';
      }
      commission.reset();
    });
  }
})();
