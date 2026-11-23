/* Crescent Ink — studio script
   Silent by design: no audio anywhere on this site. */
(function () {
  'use strict';

  /* ---------- navigation ---------- */
  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 760) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- the qalam lab ---------- */
  var canvas = document.getElementById('qalam');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var W = 960, H = 540;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    var state = { letter: 'nun', ink: 72, angle: 28, nib: 18, guides: true, seed: 1 };

    /* Each letter is a list of strokes; each stroke is a list of cubic segments:
       [startX, startY, c1x, c1y, c2x, c2y, endX, endY]. Hand-drawn from the studio sheet. */
    var LETTERS = {
      nun: {
        name: 'Nun', ar: 'ن',
        strokes: [
          [352, 318, 354, 388, 410, 428, 480, 420, 542, 412, 582, 378, 576, 344, 571, 318, 548, 306, 528, 316]
        ],
        dots: [[452, 452, 15]]
      },
      alif: {
        name: 'Alif', ar: 'ا',
        strokes: [
          [446, 182, 444, 240, 448, 330, 452, 398]
        ],
        dots: []
      },
      waw: {
        name: 'Waw', ar: 'و',
        strokes: [
          [430, 360, 392, 330, 400, 272, 452, 258, 508, 244, 556, 288, 540, 330, 528, 362, 486, 372, 458, 360, 440, 404, 470, 424, 506, 420]
        ],
        dots: []
      },
      heh: {
        name: 'Heh', ar: 'ه',
        strokes: [
          [430, 360, 400, 320, 410, 268, 460, 256, 516, 244, 552, 290, 532, 330, 516, 362, 470, 372, 444, 356],
          [444, 356, 452, 392, 490, 406, 526, 398]
        ],
        dots: []
      }
    };

    function sampleStroke(seg) {
      /* seg is a flat list of cubic segments chained together. */
      var pts = [];
      var x0 = seg[0], y0 = seg[1];
      pts.push({ x: x0, y: y0 });
      for (var i = 2; i + 5 < seg.length; i += 6) {
        var c1x = seg[i], c1y = seg[i + 1], c2x = seg[i + 2], c2y = seg[i + 3], x1 = seg[i + 4], y1 = seg[i + 5];
        if (x1 === undefined) break;
        var steps = 26;
        for (var s = 1; s <= steps; s++) {
          var t = s / steps, mt = 1 - t;
          var x = mt * mt * mt * x0 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x1;
          var y = mt * mt * mt * y0 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y1;
          pts.push({ x: x, y: y });
        }
        x0 = x1; y0 = y1;
      }
      return pts;
    }

    function seeded(n) {
      var x = Math.sin(n * 127.1 + state.seed * 311.7) * 43758.5453;
      return x - Math.floor(x);
    }

    function drawStroke(pts, opts) {
      var n = pts.length;
      if (n < 2) return;
      var nibPx = opts.nib * 1.95;
      var phi = (opts.angle * Math.PI) / 180;
      var left = [], right = [];
      for (var i = 0; i < n; i++) {
        var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 1;
        var tx = dx / len, ty = dy / len;
        var dir = Math.atan2(ty, tx);
        var t = i / (n - 1);
        var taper = Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t * 0.94)), 0.32);
        var contrast = Math.abs(Math.sin(dir - phi));
        var h = Math.max(1.1, (nibPx / 2) * contrast * (0.22 + 0.95 * taper) * (0.7 + opts.ink / 260));
        var nx = -ty, ny = tx;
        left.push({ x: pts[i].x + nx * h, y: pts[i].y + ny * h });
        right.push({ x: pts[i].x - nx * h, y: pts[i].y - ny * h });
      }
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      for (var j = 1; j < left.length; j++) ctx.lineTo(left[j].x, left[j].y);
      for (var k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k].x, right[k].y);
      ctx.closePath();
      ctx.fill();

      /* rounded terminals, sized to the stroke's own width */
      [0, n - 1].forEach(function (idx) {
        var p = pts[idx];
        var pa = pts[Math.max(0, idx - 1)], pb = pts[Math.min(n - 1, idx + 1)];
        var ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
        var t2 = idx / (n - 1);
        var tpr = Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t2 * 0.94)), 0.32);
        var hh = Math.max(1.4, (nibPx / 2) * Math.abs(Math.sin(ang - phi)) * (0.22 + 0.95 * tpr) * 0.62 * (0.7 + opts.ink / 260));
        ctx.beginPath();
        ctx.arc(p.x, p.y, hh, 0, Math.PI * 2);
        ctx.fill();
      });

      /* dry-brush break-up at low ink load */
      if (opts.ink < 46) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        var specks = Math.round((46 - opts.ink) * 1.4);
        for (var s = 0; s < specks; s++) {
          var pi = Math.floor(seeded(s + n) * n);
          var p2 = pts[pi];
          var r = 0.6 + seeded(s * 3.3 + 7) * 2.4;
          ctx.globalAlpha = 0.35 + seeded(s * 1.7) * 0.4;
          ctx.beginPath();
          ctx.arc(p2.x + (seeded(s + 33) - 0.5) * 8, p2.y + (seeded(s + 91) - 0.5) * 8, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function draw() {
      var L = LETTERS[state.letter];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      /* paper */
      ctx.fillStyle = '#efe6d4';
      ctx.fillRect(0, 0, W, H);
      var g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(255,255,255,.35)');
      g.addColorStop(0.55, 'rgba(168,120,51,.03)');
      g.addColorStop(1, 'rgba(23,19,15,.05)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      /* deckle edge shading */
      ctx.strokeStyle = 'rgba(23,19,15,.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(18.5, 18.5, W - 37, H - 37);

      if (state.guides) {
        var rows = [
          { y: 176, label: 'ascender', dash: [3, 6] },
          { y: 296, label: 'x-height', dash: [3, 6] },
          { y: 400, label: 'baseline', dash: [] },
          { y: 470, label: 'descender', dash: [3, 6] }
        ];
        ctx.save();
        rows.forEach(function (row) {
          ctx.beginPath();
          ctx.setLineDash(row.dash);
          ctx.strokeStyle = row.label === 'baseline' ? 'rgba(23,19,15,.38)' : 'rgba(23,19,15,.20)';
          ctx.lineWidth = row.label === 'baseline' ? 1.2 : 1;
          ctx.moveTo(96, row.y + 0.5);
          ctx.lineTo(864, row.y + 0.5);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(23,19,15,.42)';
          ctx.font = '11px Karla, Arial, sans-serif';
          ctx.fillText(row.label, 96, row.y - 7);
        });
        /* margin marks */
        ctx.strokeStyle = 'rgba(23,19,15,.18)';
        ctx.beginPath(); ctx.moveTo(96, 140); ctx.lineTo(96, 500); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(864, 140); ctx.lineTo(864, 500); ctx.stroke();
        ctx.fillStyle = 'rgba(168,120,51,.65)';
        ctx.font = '10px Karla, Arial, sans-serif';
        ctx.fillText('PRACTICE SHEET  ·  ' + L.name.toUpperCase(), 96, 118);
        ctx.fillText('QALAM STUDIO', 748, 118);
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = state.ink < 34 ? 'rgba(23,19,15,.72)' : 'rgba(23,19,15,.94)';
      ctx.translate(470, 330);
      ctx.scale(1.18, 1.18);
      ctx.translate(-470, -330);
      L.strokes.forEach(function (seg) {
        drawStroke(sampleStroke(seg), state);
      });
      /* dots (nun) */
      L.dots.forEach(function (d) {
        ctx.beginPath();
        ctx.arc(d[0], d[1], d[2] * (0.45 + state.nib / 40), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      /* ink bleed echo */
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.translate(0.8, 0.6);
      ctx.fillStyle = 'rgba(23,19,15,.9)';
      ctx.translate(470, 330);
      ctx.scale(1.18, 1.18);
      ctx.translate(-470, -330);
      L.strokes.forEach(function (seg) { drawStroke(sampleStroke(seg), state); });
      ctx.restore();

      /* date stamp */
      ctx.fillStyle = 'rgba(23,19,15,.38)';
      ctx.font = '10px Karla, Arial, sans-serif';
      ctx.fillText('HYDERABAD · 2026', 748, 500);

      /* readout */
      var note = document.getElementById('lab-note');
      var count = document.getElementById('lab-count');
      if (note) {
        note.textContent = L.name + ' · nib ' + state.nib + ' mm · ink ' + state.ink + '% · angle ' + state.angle + '°';
      }
      if (count) {
        count.textContent = state.ink < 34 ? 'the reed is running dry' : 'broad-nib model, 4 practice letters';
      }
      canvas.setAttribute('aria-label', 'Calligraphy preview of the letter ' + L.name + ' drawn with a ' + state.nib + ' millimetre nib at ' + state.angle + ' degrees and ' + state.ink + ' percent ink.');
    }

    /* controls */
    var ink = document.getElementById('ink');
    var angle = document.getElementById('angle');
    var nib = document.getElementById('nib');
    var guides = document.getElementById('guides');
    var inkOut = document.getElementById('ink-out');
    var angleOut = document.getElementById('angle-out');
    var nibOut = document.getElementById('nib-out');

    function sync() {
      if (ink) { state.ink = +ink.value; if (inkOut) inkOut.textContent = state.ink + '%'; }
      if (angle) { state.angle = +angle.value; if (angleOut) angleOut.textContent = state.angle + '°'; }
      if (nib) { state.nib = +nib.value; if (nibOut) nibOut.textContent = state.nib + ' mm'; }
      if (guides) state.guides = guides.checked;
    }
    [ink, angle, nib].forEach(function (el) {
      if (el) el.addEventListener('input', function () { sync(); draw(); });
    });
    if (guides) guides.addEventListener('change', function () { sync(); draw(); });

    var letters = [].slice.call(document.querySelectorAll('.letter'));
    letters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        letters.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.letter = btn.getAttribute('data-letter');
        draw();
      });
    });

    var redraw = document.getElementById('redraw');
    if (redraw) {
      redraw.addEventListener('click', function () {
        state.seed++;
        draw();
      });
    }

    sync();
    draw();
    window.addEventListener('resize', function () {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      draw();
    });
  }

  /* ---------- work filter ---------- */
  var chips = [].slice.call(document.querySelectorAll('.chip[data-filter]'));
  if (chips.length) {
    var rows = [].slice.call(document.querySelectorAll('.work-row'));
    var empty = document.querySelector('.work-empty');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        var f = chip.getAttribute('data-filter');
        var shown = 0;
        rows.forEach(function (row) {
          var match = f === 'all' || row.getAttribute('data-format') === f;
          row.hidden = !match;
          if (match) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('commission-form');
  if (form) {
    var sent = document.getElementById('sent');
    var fields = {
      name: { el: document.getElementById('c-name'), msg: 'Please write the name the piece is for.' },
      email: { el: document.getElementById('c-email'), msg: 'A working email, so I can send the trial sheet.' },
      format: { el: document.getElementById('c-format'), msg: 'Choose the kind of commission.' },
      date: { el: document.getElementById('c-date'), msg: 'The date you need it by.' },
      brief: { el: document.getElementById('c-brief'), msg: 'A few lines about the words and the wall.' }
    };

    function setError(key, message) {
      var f = fields[key];
      if (!f || !f.el) return;
      var err = document.getElementById('err-' + key);
      if (err) err.textContent = message || '';
      f.el.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validate() {
      var ok = true;
      if (!fields.name.el.value.trim()) { setError('name', fields.name.msg); ok = false; } else setError('name', '');
      var email = fields.email.el.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', fields.email.msg); ok = false; } else setError('email', '');
      if (!fields.format.el.value) { setError('format', fields.format.msg); ok = false; } else setError('format', '');
      if (!fields.date.el.value) { setError('date', fields.date.msg); ok = false; } else setError('date', '');
      if (fields.brief.el.value.trim().length < 12) { setError('brief', fields.brief.msg); ok = false; } else setError('brief', '');
      return ok;
    }

    Object.keys(fields).forEach(function (k) {
      var el = fields[k].el;
      if (!el) return;
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') validate(); });
      el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') validate(); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      var name = fields.name.el.value.trim().split(' ')[0];
      var note = document.getElementById('sent-note');
      if (note) {
        note.textContent = 'Thank you, ' + name + '. Your brief is in the queue; I answer briefs on Sunday and Thursday evenings, and the trial sheet follows within ten days.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.focus(); }
    });
  }
})();
