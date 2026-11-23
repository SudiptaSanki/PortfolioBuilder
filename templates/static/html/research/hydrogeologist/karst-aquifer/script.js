/* Karst Aquifer — Nela Vuković
   Two canvases: a basin cross-section (figure) and a dye-tracer breakthrough bench.
   No audio, no external libraries. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- navigation ---------------- */

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- canvas sizing ---------------- */

  /* ---------------- contact form ---------------- */

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var status = document.getElementById('formStatus');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.elements.namedItem('name');
      var email = contactForm.elements.namedItem('email');
      var message = contactForm.elements.namedItem('message');
      var valid = true;
      [name, email, message].forEach(function (field) {
        if (!field) return;
        var bad = !field.value.trim() || (field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field.value));
        field.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) valid = false;
      });
      if (!status) return;
      status.classList.add('is-visible');
      if (!valid) {
        status.classList.add('is-error');
        status.textContent = 'Check the name, email and message — the message was not sent.';
        return;
      }
      status.classList.remove('is-error');
      var firstName = name.value.trim().split(/\s+/)[0];
      status.textContent = 'Draft saved locally, ' + firstName + '. This portfolio has no mail server, so the text stays in this browser — copy it into an email to nela@kraswater.si to send it.';
      contactForm.reset();
    });
  }

  function fitCanvas(canvas, logicalW, logicalH) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(w / logicalW, 0, 0, h / logicalH, 0, 0);
    return ctx;
  }

  /* ---------------- figure 1: basin cross-section ---------------- */

  var sectionCanvas = document.getElementById('sectionCanvas');
  var sectionCtx = null;
  var tracerPhase = 0;
  var SW = 720, SH = 620;

  function drawSection() {
    if (!sectionCanvas) return;
    sectionCtx = fitCanvas(sectionCanvas, SW, SH);
    var c = sectionCtx;
    c.clearRect(0, 0, SW, SH);

    // sky
    c.fillStyle = '#e7e1d2';
    c.fillRect(0, 0, SW, SH * 0.16);

    // soil / epikarst band
    c.fillStyle = '#cbb289';
    c.beginPath();
    c.moveTo(0, 96);
    for (var x = 0; x <= SW; x += 24) {
      c.lineTo(x, 96 + Math.sin(x * 0.05) * 5 + Math.cos(x * 0.11) * 3);
    }
    c.lineTo(SW, 132);
    for (var x2 = SW; x2 >= 0; x2 -= 30) {
      c.lineTo(x2, 132 + Math.sin(x2 * 0.07 + 1) * 6);
    }
    c.closePath();
    c.fill();

    // epikarst fissure texture
    c.strokeStyle = 'rgba(120, 92, 54, 0.35)';
    c.lineWidth = 0.8;
    for (var i = 0; i < 26; i++) {
      var fx = 14 + i * 27;
      c.beginPath();
      c.moveTo(fx, 100 + Math.sin(i) * 4);
      c.lineTo(fx + 5, 112 + Math.cos(i * 1.7) * 6);
      c.lineTo(fx + 1, 126 + Math.sin(i * 2.3) * 5);
      c.stroke();
    }

    // limestone body
    var lime = c.createLinearGradient(0, 130, 0, SH);
    lime.addColorStop(0, '#ded8c8');
    lime.addColorStop(0.55, '#d3ccb9');
    lime.addColorStop(1, '#c4bca7');
    c.fillStyle = lime;
    c.fillRect(0, 130, SW, SH - 130);

    // bedding planes
    c.strokeStyle = 'rgba(80, 76, 64, 0.16)';
    for (var y = 158; y < SH; y += 34) {
      c.beginPath();
      c.moveTo(0, y);
      for (var bx = 0; bx <= SW; bx += 40) {
        c.lineTo(bx, y + Math.sin(bx * 0.013 + y) * 3);
      }
      c.stroke();
    }

    // joints
    c.strokeStyle = 'rgba(80, 76, 64, 0.13)';
    for (var j = 0; j < 12; j++) {
      var jx = 30 + j * 62;
      c.beginPath();
      c.moveTo(jx, 140 + (j % 3) * 18);
      c.lineTo(jx + 18, 260 + (j % 4) * 22);
      c.stroke();
    }

    // water table
    c.save();
    c.strokeStyle = 'rgba(30, 91, 98, 0.55)';
    c.setLineDash([5, 5]);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, 300);
    c.bezierCurveTo(180, 296, 330, 308, 470, 330);
    c.bezierCurveTo(560, 344, 630, 352, 720, 356);
    c.stroke();
    c.restore();

    // saturated tint below water table
    c.save();
    c.beginPath();
    c.moveTo(0, 300);
    c.bezierCurveTo(180, 296, 330, 308, 470, 330);
    c.bezierCurveTo(560, 344, 630, 352, 720, 356);
    c.lineTo(720, SH);
    c.lineTo(0, SH);
    c.closePath();
    c.fillStyle = 'rgba(30, 91, 98, 0.10)';
    c.fill();
    c.restore();

    // swallow hole
    c.fillStyle = '#9a6329';
    c.beginPath();
    c.ellipse(146, 98, 26, 9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5e4326';
    c.beginPath();
    c.ellipse(146, 99, 17, 5, 0, 0, Math.PI * 2);
    c.fill();

    // vadose shaft
    c.strokeStyle = '#6f6959';
    c.lineWidth = 7;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(146, 104);
    c.bezierCurveTo(150, 160, 196, 196, 208, 244);
    c.bezierCurveTo(218, 282, 246, 300, 274, 314);
    c.stroke();
    c.strokeStyle = '#c9c1ae';
    c.lineWidth = 4.2;
    c.beginPath();
    c.moveTo(146, 104);
    c.bezierCurveTo(150, 160, 196, 196, 208, 244);
    c.bezierCurveTo(218, 282, 246, 300, 274, 314);
    c.stroke();

    // phreatic conduit
    c.strokeStyle = '#6f6959';
    c.lineWidth = 16;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(268, 316);
    c.bezierCurveTo(340, 330, 390, 382, 470, 392);
    c.bezierCurveTo(560, 402, 602, 430, 648, 448);
    c.stroke();
    c.strokeStyle = '#a9c4c2';
    c.lineWidth = 11;
    c.beginPath();
    c.moveTo(268, 316);
    c.bezierCurveTo(340, 330, 390, 382, 470, 392);
    c.bezierCurveTo(560, 402, 602, 430, 648, 448);
    c.stroke();
    c.strokeStyle = 'rgba(30, 91, 98, 0.65)';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(268, 316);
    c.bezierCurveTo(340, 330, 390, 382, 470, 392);
    c.bezierCurveTo(560, 402, 602, 430, 648, 448);
    c.stroke();

    // secondary fissure seepage
    c.save();
    c.strokeStyle = 'rgba(30, 91, 98, 0.32)';
    c.lineWidth = 1.4;
    c.setLineDash([3, 6]);
    c.beginPath();
    c.moveTo(210, 200);
    c.bezierCurveTo(300, 240, 360, 300, 430, 360);
    c.stroke();
    c.restore();

    // spring pool at valley
    c.fillStyle = '#b7cfcc';
    c.beginPath();
    c.moveTo(640, 444);
    c.bezierCurveTo(672, 452, 700, 470, 720, 490);
    c.lineTo(720, SH);
    c.lineTo(620, SH);
    c.bezierCurveTo(612, 500, 620, 460, 640, 444);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(20, 63, 69, 0.6)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(638, 446);
    c.bezierCurveTo(672, 456, 700, 474, 720, 494);
    c.stroke();

    // tracer particles along the conduit
    var paths = [
      { p0: [146, 104], p1: [150, 160], p2: [196, 196], p3: [208, 244], q0: [218, 282], q1: [246, 300], q2: [274, 314] },
      { p0: [268, 316], p1: [340, 330], p2: [390, 382], p3: [470, 392], q0: [560, 402], q1: [602, 430], q2: [648, 448] }
    ];
    function pt(t, seg) {
      if (seg === 0) {
        var u = 1 - t;
        return [
          u * u * u * seg.p0[0] + 3 * u * u * t * seg.p1[0] + 3 * u * t * t * seg.p2[0] + t * t * t * seg.p3[0],
          u * u * u * seg.p0[1] + 3 * u * u * t * seg.p1[1] + 3 * u * t * t * seg.p2[1] + t * t * t * seg.p3[1]
        ];
      }
      var u2 = 1 - t;
      return [
        u2 * u2 * u2 * seg.p3[0] + 3 * u2 * u2 * t * seg.q0[0] + 3 * u2 * t * t * seg.q1[0] + t * t * t * seg.q2[0],
        u2 * u2 * u2 * seg.p3[1] + 3 * u2 * u2 * t * seg.q0[1] + 3 * u2 * t * t * seg.q1[1] + t * t * t * seg.q2[1]
      ];
    }
    var dots = [
      { path: 0, seg: 0, t: (tracerPhase * 0.9) % 1 },
      { path: 0, seg: 1, t: (tracerPhase * 0.9 + 0.45) % 1 },
      { path: 1, seg: 0, t: (tracerPhase * 0.7 + 0.2) % 1 },
      { path: 1, seg: 1, t: (tracerPhase * 0.7 + 0.62) % 1 }
    ];
    dots.forEach(function (d) {
      var seg = paths[d.path];
      var p = pt(d.t, seg);
      c.beginPath();
      c.arc(p[0], p[1], 3.4, 0, Math.PI * 2);
      c.fillStyle = 'rgba(154, 99, 41, 0.9)';
      c.fill();
      c.beginPath();
      c.arc(p[0], p[1], 6.4, 0, Math.PI * 2);
      c.fillStyle = 'rgba(154, 99, 41, 0.14)';
      c.fill();
    });

    // rain over the recharge area
    c.strokeStyle = 'rgba(30, 91, 98, 0.35)';
    c.lineWidth = 1;
    for (var r = 0; r < 12; r++) {
      var rx = 34 + r * 15 + (tracerPhase * 14 % 9);
      var ry = 16 + (r * 19 + tracerPhase * 30) % 70;
      c.beginPath();
      c.moveTo(rx, ry);
      c.lineTo(rx - 2, ry + 8);
      c.stroke();
    }

    // --- labels ---
    c.font = '10px "IBM Plex Mono", monospace';
    c.fillStyle = '#4a4f49';
    c.fillText('recharge', 30, 24);
    c.fillText('swallow hole', 78, 86);
    c.fillText('epikarst', 246, 118);
    c.fillText('vadose shaft', 232, 232);
    c.fillText('water table', 26, 292);
    c.fillText('phreatic conduit', 388, 372);
    c.fillText('limestone', 30, 208);
    c.fillText('spring', 660, 438);
    c.fillText('4.6 km', 430, 416);

    // depth ticks
    c.strokeStyle = 'rgba(74, 79, 73, 0.35)';
    for (var d2 = 0; d2 < 5; d2++) {
      var dy = 300 + d2 * 40;
      c.beginPath();
      c.moveTo(0, dy);
      c.lineTo(9, dy);
      c.stroke();
    }
    c.fillStyle = '#767b72';
    c.fillText('0 m', 12, 304);
    c.fillText('−160 m', 12, 464);

    // scale bar
    c.strokeStyle = '#4a4f49';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(480, 584);
    c.lineTo(590, 584);
    c.moveTo(480, 580);
    c.lineTo(480, 588);
    c.moveTo(590, 580);
    c.lineTo(590, 588);
    c.stroke();
    c.fillStyle = '#4a4f49';
    c.fillText('1 km (approx.)', 494, 600);
  }

  if (sectionCanvas) {
    drawSection();
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () { drawSection(); });
      ro.observe(sectionCanvas);
    } else {
      window.addEventListener('resize', drawSection);
    }
    if (!reduceMotion) {
      var last = 0;
      var loop = function (ts) {
        if (ts - last > 70) {
          tracerPhase = (ts / 1000) % 1000;
          drawSection();
          last = ts;
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  /* ---------------- figure 2: tracer breakthrough bench ---------------- */

  var form = document.getElementById('tracerForm');
  var btCanvas = document.getElementById('breakthroughCanvas');
  if (!form || !btCanvas) return;

  var el = {
    gradient: document.getElementById('gradient'),
    diameter: document.getElementById('diameter'),
    distance: document.getElementById('distance'),
    matrix: document.getElementById('matrix'),
    tracer: document.getElementById('tracer'),
    mass: document.getElementById('mass')
  };
  var out = {
    gradient: document.getElementById('gradientOut'),
    diameter: document.getElementById('diameterOut'),
    distance: document.getElementById('distanceOut'),
    matrix: document.getElementById('matrixOut'),
    mass: document.getElementById('massOut'),
    peakTime: document.getElementById('peakTime'),
    peakVelocity: document.getElementById('peakVelocity'),
    discharge: document.getElementById('discharge'),
    regime: document.getElementById('regime'),
    peakConc: document.getElementById('peakConc'),
    recovery: document.getElementById('recovery'),
    caption: document.getElementById('chartCaption')
  };

  var TRACERS = {
    uranine: { label: 'uranine', limit: 0.02, color: '#1e5b62', rgb: '30, 91, 98' },
    rhodamine: { label: 'rhodamine WT', limit: 0.05, color: '#9a3d4a', rgb: '154, 61, 74' },
    eosin: { label: 'eosin', limit: 0.1, color: '#9a6329', rgb: '154, 99, 41' }
  };

  var PRESETS = {
    ljubljanica: { gradient: 0.0045, diameter: 0.8, distance: 4100, matrix: -4.6, tracer: 'uranine', mass: 3.0 },
    istria: { gradient: 0.002, diameter: 0.4, distance: 2300, matrix: -5.2, tracer: 'rhodamine', mass: 1.2 },
    storm: { gradient: 0.018, diameter: 1.2, distance: 1500, matrix: -4.2, tracer: 'uranine', mass: 2.0 }
  };

  var state = { result: null };

  function num(id) { return parseFloat(el[id].value); }

  function calculate() {
    var i = num('gradient');
    var D = num('diameter');
    var L = num('distance');
    var logK = num('matrix');
    var M = num('mass');
    var tracer = TRACERS[el.tracer.value] || TRACERS.uranine;

    // empirical tracer velocity, calibrated on Dinaric tests (m/day)
    var vDay = 30000 * Math.pow(i, 0.9) * Math.pow(D, 0.6);
    var ttDays = L / vDay;

    // conduit discharge, Darcy-Weisbach with a high friction factor for a
    // partly full, rough conduit (f = 8.0)
    var g = 9.81;
    var R = D / 4;
    var vPipe = Math.sqrt((8 * g * R * i) / 8.0);
    var area = Math.PI * D * D / 4;
    var Q = vPipe * area;            // m3/s
    var Re = vPipe * D / 1.3e-6;

    // longitudinal dispersivity and Peclet number
    var alpha = 15 + 0.02 * L;       // m
    var DL = alpha * vDay;           // m2/day
    var Pe = (vDay * L) / DL;

    // matrix exchange: fraction of mass and release time constant
    var kRel = Math.min(1, Math.max(0, (logK + 6) / 3));
    var phi = 0.08 + 0.30 * kRel;
    var tau = ttDays * (1.4 + 3.6 * (1 - kRel));

    // concentration shape (arbitrary units before mass scaling)
    var n = 260;
    var tMin = Math.max(0.05, ttDays * 0.04);
    var tMax = ttDays * 5.2;
    var times = [];
    var adv = [];
    var tail = [];
    var shape = [];
    for (var s = 0; s < n; s++) {
      var t = tMin + (tMax - tMin) * s / (n - 1);
      times.push(t);
      var ca = Math.exp(-Math.pow(L - vDay * t, 2) / (4 * DL * t)) / Math.sqrt(4 * Math.PI * DL * t);
      var ct = (t / tau) * Math.exp(1 - t / tau); // gamma(2), peak 1 at t = tau
      adv.push(ca);
      tail.push(ct);
    }
    var advMax = Math.max.apply(null, adv);
    var tailMax = Math.max.apply(null, tail);
    for (var k = 0; k < n; k++) {
      shape.push((1 - phi) * (adv[k] / advMax) + phi * (tail[k] / tailMax));
    }

    // scale shape to concentration in g/m3, then to ug/L
    var integral = 0;
    var dt = (tMax - tMin) / (n - 1);
    for (var q = 0; q < n - 1; q++) {
      integral += (shape[q] + shape[q + 1]) / 2 * dt;
    }
    var massG = M * 1000;
    var scale = massG / (Q * 86400 * integral); // g/m3 per unit shape
    var conc = shape.map(function (v) { return v * scale * 1000; }); // ug/L

    // peak
    var peakIdx = 0;
    for (var p = 1; p < n; p++) if (conc[p] > conc[peakIdx]) peakIdx = p;
    var peakTimeDays = times[peakIdx];
    var peakC = conc[peakIdx];

    // recovery within a 30-day monitoring window
    var rec = 0;
    for (var r2 = 0; r2 < n - 1; r2++) {
      if (times[r2] > 30) break;
      rec += (conc[r2] + conc[r2 + 1]) / 2 * dt;
    }
    var total = 0;
    for (var r3 = 0; r3 < n - 1; r3++) {
      total += (conc[r3] + conc[r3 + 1]) / 2 * dt;
    }
    var recovery = total > 0 ? (rec / total) * 100 : 0;

    // 90% mass window
    var cum = [];
    var acc = 0;
    for (var w = 0; w < n - 1; w++) {
      acc += (conc[w] + conc[w + 1]) / 2 * dt;
      cum.push(acc / total);
    }
    function timeAt(fraction) {
      for (var w2 = 0; w2 < cum.length; w2++) if (cum[w2] >= fraction) return times[w2];
      return times[times.length - 1];
    }
    var t25 = timeAt(0.25);
    var t75 = timeAt(0.75);
    var t90 = timeAt(0.95);

    // time above detection
    var above = 0;
    var first = null, last = null;
    for (var a = 0; a < n; a++) {
      if (conc[a] >= tracer.limit) {
        above++;
        if (first === null) first = times[a];
        last = times[a];
      }
    }
    var aboveDays = first === null ? 0 : (last - first);

    return {
      vDay: vDay, ttDays: ttDays, Q: Q, Re: Re, Pe: Pe, alpha: alpha,
      peakTimeDays: peakTimeDays, peakC: peakC, recovery: recovery,
      times: times, conc: conc, t25: t25, t75: t75, t90: t90, tracer: tracer,
      aboveHours: aboveDays * 24, aboveSamples: above, phi: phi, tau: tau,
      i: i, D: D, L: L, M: M
    };
  }

  function fmt(n, digits) {
    return Number(n).toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function supNum(value) {
    var map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
    return String(value).split('').map(function (ch) { return map[ch] || ch; }).join('');
  }

  function drawCurve(res) {
    var cssW = btCanvas.getBoundingClientRect().width || 920;
    var narrow = cssW < 560;
    var W = narrow ? 480 : 920;
    var H = narrow ? 560 : 440;
    var c = fitCanvas(btCanvas, W, H);
    c.clearRect(0, 0, W, H);

    var padL = narrow ? 58 : 76;
    var padR = narrow ? 16 : 26;
    var padT = narrow ? 30 : 30;
    var padB = narrow ? 54 : 56;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var fs = narrow ? 13 : 12;
    var fsSmall = narrow ? 12 : 11;
    var monoFont = 'px "IBM Plex Mono", monospace';

    var maxC = Math.max(res.peakC * 1.3, res.tracer.limit * 8);
    var minC = Math.max(Math.min(res.tracer.limit / 4, res.peakC / 500), 1e-5);
    var logMin = Math.log10(minC);
    var logMax = Math.log10(maxC);
    var lastT = res.times[res.times.length - 1];
    var maxT = Math.min(lastT, Math.max(res.t90 * 1.05, res.peakTimeDays * 2.2));

    function X(t) { return padL + (t / maxT) * plotW; }
    function Y(v) {
      var lv = Math.log10(Math.max(v, minC));
      return padT + plotH - ((lv - logMin) / (logMax - logMin)) * plotH;
    }
    function decadeLabel(v) {
      if (v >= 1) return String(Math.round(v));
      return v.toFixed(Math.round(-Math.log10(v)));
    }

    // plot background
    c.fillStyle = '#f8f5ed';
    c.fillRect(padL, padT, plotW, plotH);

    // 90% mass band, behind everything
    c.fillStyle = 'rgba(154, 99, 41, 0.07)';
    var bx1 = X(Math.min(res.t25, maxT));
    var bx2 = X(Math.min(res.t75, maxT));
    c.fillRect(bx1, padT, Math.max(2, bx2 - bx1), plotH);

    // horizontal gridlines, one per decade of concentration
    c.font = fsSmall + monoFont;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (var dec = Math.ceil(logMin); dec <= Math.floor(logMax); dec++) {
      var v = Math.pow(10, dec);
      var y = Y(v);
      c.strokeStyle = 'rgba(22, 26, 24, 0.10)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(padL, y);
      c.lineTo(padL + plotW, y);
      c.stroke();
      c.fillStyle = '#767b72';
      c.fillText(decadeLabel(v), padL - 8, y);
    }

    // vertical gridlines with a readable number of labels
    var targets = narrow ? 4 : 6;
    var rawStep = maxT / targets;
    var mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    var mult = rawStep / mag;
    var step = (mult <= 1 ? 1 : mult <= 2 ? 2 : mult <= 5 ? 5 : 10) * mag;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (var t = 0; t <= maxT + 1e-9; t += step) {
      var x = X(t);
      c.strokeStyle = 'rgba(22, 26, 24, 0.07)';
      c.beginPath();
      c.moveTo(x, padT);
      c.lineTo(x, padT + plotH);
      c.stroke();
      c.fillStyle = '#767b72';
      c.fillText(t % 1 === 0 ? String(Math.round(t)) : t.toFixed(1), x, padT + plotH + 8);
    }

    // detection limit
    if (res.tracer.limit > minC) {
      var dy = Y(res.tracer.limit);
      c.save();
      c.strokeStyle = 'rgba(154, 61, 74, 0.7)';
      c.setLineDash([4, 4]);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(padL, dy);
      c.lineTo(padL + plotW, dy);
      c.stroke();
      c.restore();
      c.textAlign = 'left';
      c.textBaseline = 'bottom';
      c.fillStyle = '#9a3d4a';
      c.font = fsSmall + monoFont;
      c.fillText('detection ' + res.tracer.limit + ' µg/L', padL + 5, dy - 3);
    }

    // curve
    var lastX = padL;
    c.beginPath();
    var started = false;
    for (var idx = 0; idx < res.times.length; idx++) {
      if (res.times[idx] > maxT) break;
      var cx = X(res.times[idx]);
      var cy = Y(res.conc[idx]);
      if (!started) { c.moveTo(cx, cy); started = true; } else { c.lineTo(cx, cy); }
      lastX = cx;
    }
    c.strokeStyle = res.tracer.color;
    c.lineWidth = narrow ? 2.6 : 2;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();

    // subtle wash under the curve only, clipped to the plot
    c.save();
    c.beginPath();
    var started2 = false;
    for (var idx2 = 0; idx2 < res.times.length; idx2++) {
      if (res.times[idx2] > maxT) break;
      var cx2 = X(res.times[idx2]);
      var cy2 = Y(res.conc[idx2]);
      if (!started2) { c.moveTo(cx2, cy2); started2 = true; } else { c.lineTo(cx2, cy2); }
    }
    c.lineTo(lastX, padT + plotH);
    c.lineTo(padL, padT + plotH);
    c.closePath();
    c.clip();
    c.fillStyle = 'rgba(' + res.tracer.rgb + ', 0.05)';
    c.fillRect(padL, padT, plotW, plotH);
    c.restore();

    // peak marker
    var px = X(Math.min(res.peakTimeDays, maxT));
    var py = Y(res.peakC);
    c.save();
    c.strokeStyle = 'rgba(22, 26, 24, 0.28)';
    c.setLineDash([2, 4]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(px, padT);
    c.lineTo(px, padT + plotH);
    c.stroke();
    c.restore();
    c.beginPath();
    c.arc(px, py, narrow ? 4 : 3.6, 0, Math.PI * 2);
    c.fillStyle = res.tracer.color;
    c.fill();
    c.beginPath();
    c.arc(px, py, narrow ? 7.5 : 7, 0, Math.PI * 2);
    c.strokeStyle = res.tracer.color;
    c.lineWidth = 1;
    c.stroke();

    // peak label with a paper-coloured plate so it stays legible over the grid
    c.font = fsSmall + monoFont;
    var line1 = 'peak ' + fmt(res.peakC, res.peakC < 10 ? 2 : 0) + ' µg/L';
    var line2 = 'at ' + fmt(res.peakTimeDays * 24, res.peakTimeDays * 24 < 10 ? 1 : 0) + ' h';
    var tw = Math.max(c.measureText(line1).width, c.measureText(line2).width);
    var labelX = px + 10;
    if (labelX + tw > padL + plotW - 4) labelX = px - tw - 10;
    if (labelX < padL + 4) labelX = padL + 4;
    var labelY = Math.max(padT + 4, py - 34);
    c.fillStyle = 'rgba(248, 245, 237, 0.92)';
    c.fillRect(labelX - 3, labelY - 2, tw + 6, 30);
    c.fillStyle = '#161a18';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(line1, labelX, labelY);
    c.fillStyle = '#767b72';
    c.fillText(line2, labelX, labelY + 15);

    // axis titles
    c.fillStyle = '#4a4f49';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(narrow ? 'Concentration, µg/L (log)' : 'Concentration at the spring, µg/L (log scale)', padL, 6);
    c.textAlign = 'right';
    c.textBaseline = 'bottom';
    c.fillText(narrow ? 'Days after injection' : 'Time since injection, days', padL + plotW, H - 2);
    c.textAlign = 'left';
    c.textBaseline = 'top';
  }

  function render() {
    var res = calculate();
    state.result = res;

    out.gradient.textContent = fmt(res.i, res.i < 0.01 ? 4 : 3);
    out.diameter.textContent = fmt(res.D, 1) + ' m';
    out.distance.textContent = fmt(res.L, 0) + ' m';
    var logK = num('matrix');
    var kExp = Math.floor(logK);
    var kMant = Math.pow(10, logK - kExp);
    out.matrix.textContent = kMant.toFixed(1) + ' × 10' + supNum(kExp) + ' m/s';
    out.mass.textContent = fmt(res.M, 1) + ' kg';

    out.peakTime.textContent = res.ttDays < 1
      ? fmt(res.ttDays * 24, 1) + ' h'
      : fmt(res.ttDays, res.ttDays < 10 ? 1 : 0) + ' days';
    out.peakVelocity.textContent = fmt(res.vDay, 0) + ' m/day · Péclet ' + fmt(res.Pe, 0);
    out.discharge.textContent = res.Q < 0.1
      ? fmt(res.Q * 1000, 0) + ' L/s'
      : fmt(res.Q, 2) + ' m³/s';
    out.regime.textContent = res.Re > 4000 ? 'turbulent' : res.Re > 2000 ? 'transitional' : 'laminar';
    out.peakConc.textContent = fmt(res.peakC, res.peakC < 10 ? 2 : 0) + ' µg/L';
    out.recovery.textContent = fmt(res.recovery, 0) + '% of injected mass';
    out.caption.textContent = 'Shaded band: middle 50% of recovered mass, ' + fmt(res.t25, 1) + '–' + fmt(res.t75, 1) + ' days; 95% has passed by day ' + fmt(res.t90, 1) + '. Dye above the detection limit for ' + fmt(res.aboveHours, 0) + ' h. Matrix exchange holds ' + Math.round(res.phi * 100) + '% of the dye in fissures, released over about ' + fmt(res.tau, 1) + ' days.';

    drawCurve(res);
  }

  ['input', 'change'].forEach(function (evt) {
    form.addEventListener(evt, function (e) {
      if (e.target.matches('input, select')) {
        document.querySelectorAll('.chip').forEach(function (ch) { ch.setAttribute('aria-pressed', 'false'); });
        render();
      }
    });
  });

  document.querySelectorAll('.chip[data-preset]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var preset = PRESETS[chip.getAttribute('data-preset')];
      if (!preset) return;
      el.gradient.value = preset.gradient;
      el.diameter.value = preset.diameter;
      el.distance.value = preset.distance;
      el.matrix.value = preset.matrix;
      el.tracer.value = preset.tracer;
      el.mass.value = preset.mass;
      document.querySelectorAll('.chip').forEach(function (ch) { ch.setAttribute('aria-pressed', 'false'); });
      chip.setAttribute('aria-pressed', 'true');
      render();
    });
  });

  if ('ResizeObserver' in window) {
    var ro2 = new ResizeObserver(function () { if (state.result) drawCurve(state.result); });
    ro2.observe(btCanvas);
  } else {
    window.addEventListener('resize', function () { if (state.result) drawCurve(state.result); });
  }

  render();

})();
