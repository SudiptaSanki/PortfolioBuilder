/* ============================================================
   Deep Orbit — Aarav Trivedi
   The diya array bench: oil, burn time, flux, ankle light, wind.
   Silent by design — nothing here makes a sound.
   ============================================================ */
(function () {
  'use strict';

  var navBtn = document.getElementById('navBtn');
  if (navBtn) {
    navBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- hero star-field of flames ---------- */

  var flameGroup = document.getElementById('heroFlames');
  if (flameGroup && document.createElementNS) {
    var NS = 'http://www.w3.org/2000/svg';
    var cx = 450, cy = 430;
    for (var i = 0; i < 46; i++) {
      var ringIndex = i % 4;
      var radius = 118 + ringIndex * 92;
      var angle = (i * 137.5) * Math.PI / 180;
      var x = cx + Math.cos(angle) * radius * 1.9;
      if (x < 20 || x > 880) continue;
      var y = cy + Math.sin(angle) * radius * 0.52;
      var g = document.createElementNS(NS, 'circle');
      g.setAttribute('cx', x.toFixed(1));
      g.setAttribute('cy', y.toFixed(1));
      g.setAttribute('r', (1.6 + (i % 3) * 0.7).toFixed(1));
      g.setAttribute('fill', '#ff8a3d');
      g.setAttribute('opacity', (0.5 + (i % 4) * 0.12).toFixed(2));
      flameGroup.appendChild(g);
      var halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('cx', x.toFixed(1));
      halo.setAttribute('cy', y.toFixed(1));
      halo.setAttribute('r', (7 + (i % 3) * 2).toFixed(1));
      halo.setAttribute('fill', 'url(#flameGlow)');
      halo.setAttribute('opacity', '0.5');
      flameGroup.appendChild(halo);
    }
  }

  /* ---------- small generated arrays inside the work cards ---------- */

  function fillDots(id, cols, rows, x0, y0, dx, dy, r, holes) {
    var g = document.getElementById(id);
    if (!g || !document.createElementNS) return;
    var NS2 = 'http://www.w3.org/2000/svg';
    for (var c = 0; c < cols; c++) {
      for (var rr = 0; rr < rows; rr++) {
        var px = x0 + c * dx;
        var py = y0 + rr * dy;
        if (holes && holes.some(function (hl) { return Math.abs(hl[0] - c) < 1.2 && Math.abs(hl[1] - rr) < 1.2; })) continue;
        var dot = document.createElementNS(NS2, 'circle');
        dot.setAttribute('cx', px.toFixed(1));
        dot.setAttribute('cy', py.toFixed(1));
        dot.setAttribute('r', r);
        dot.setAttribute('opacity', (0.55 + ((c + rr) % 3) * 0.15).toFixed(2));
        g.appendChild(dot);
      }
    }
  }
  fillDots('g1', 21, 11, 32, 42, 13, 10.6, 1.15, null);
  fillDots('g5', 17, 8, 42, 40, 14.5, 15, 1.3, [[6, 3], [7, 3], [6, 4], [7, 4]]);

  (function spiral() {
    var path = document.getElementById('spiralPath');
    if (!path) return;
    var d = '';
    var cx = 160, cy = 100;
    for (var t = 0; t <= 1; t += 0.006) {
      var ang = t * Math.PI * 8.2;
      var rad = 4 + t * 66;
      var x = cx + Math.cos(ang) * rad * 1.18;
      var y = cy + Math.sin(ang) * rad * 0.78;
      d += (t === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    path.setAttribute('d', d);
  })();

  /* ---------- commission form ---------- */

  var form = document.getElementById('commissionForm');
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var note = document.getElementById('formNote');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var checks = [
        ['cName', function (v) { return v.trim().length > 1; }, 'A name for the reply.'],
        ['cEmail', function (v) { return emailRe.test(v.trim()); }, 'That address will bounce.'],
        ['cVenue', function (v) { return v.trim().length > 1; }, 'Where would the array stand?'],
        ['cMessage', function (v) { return v.trim().length > 15; }, 'A sentence on the site and the occasion.']
      ];
      checks.forEach(function (c) {
        var input = document.getElementById(c[0]);
        var err = document.getElementById('err-' + c[0]);
        if (!c[1](input.value)) {
          if (err) err.textContent = c[2];
          ok = false;
        } else if (err) {
          err.textContent = '';
        }
      });
      if (!ok) {
        var first = form.querySelector('.err:not(:empty)');
        if (first) {
          var f = first.parentElement.querySelector('input, textarea, select');
          if (f) f.focus();
        }
        return;
      }
      note.hidden = false;
      note.textContent = 'Received. I answer commission letters on Sundays, and I will ask for the wind data for the site before anything else.';
      form.reset();
    });
  }

  /* ---------- array bench ---------- */

  var canvas = document.getElementById('arrayMap');
  if (!canvas) return;

  var el = {
    shape: document.getElementById('shape'),
    count: document.getElementById('count'),
    oil: document.getElementById('oil'),
    wick: document.getElementById('wick'),
    wind: document.getElementById('wind'),
    shelter: document.getElementById('shelter'),
    countOut: document.getElementById('countOut'),
    oilOut: document.getElementById('oilOut'),
    wickOut: document.getElementById('wickOut'),
    windOut: document.getElementById('windOut'),
    shelterOut: document.getElementById('shelterOut'),
    outOil: document.getElementById('outOil'),
    outBurn: document.getElementById('outBurn'),
    outFlux: document.getElementById('outFlux'),
    outLux: document.getElementById('outLux'),
    outVerdict: document.getElementById('outVerdict'),
    note: document.getElementById('outNote')
  };

  var EMBER = '#ff8a3d';
  var BRASS = '#d9a441';
  var STAR = '#cfd8e8';
  var MUTED = '#8f93a6';
  var GROUND = '#0b0d16';

  function setup(cv, w, h) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return ctx;
  }

  function geometry(shape, n) {
    if (shape === 'grid') {
      var side = Math.ceil(Math.sqrt(n));
      var spacing = 0.45;
      return { kind: 'grid', side: side, spacing: spacing, span: side * spacing, radius: (side * spacing) / 2 };
    }
    if (shape === 'ring') {
      var circumference = n * 0.5;
      var r = circumference / (2 * Math.PI);
      return { kind: 'ring', radius: r, spacing: 0.5 };
    }
    if (shape === 'line') {
      var len = n * 0.45;
      return { kind: 'line', length: len, radius: len / 2, spacing: 0.45 };
    }
    var turns = Math.sqrt(n / 6);
    var rmax = 0.9 * turns;
    return { kind: 'spiral', radius: rmax, turns: turns };
  }

  function compute(s) {
    var rate = 0.8 * (0.6 + 0.04 * s.wick); /* ml per hour, mustard oil, cotton wick */
    var burn = s.oil / rate;
    var perLamp = 1.55 * Math.sqrt(s.wick / 10); /* lumens */
    var totalFlux = perLamp * s.count;
    var g = geometry(s.shape, s.count);
    var area;
    if (g.kind === 'grid') area = g.span * g.span;
    else if (g.kind === 'line') area = g.length * 0.6;
    else area = Math.PI * g.radius * g.radius;
    var lux = (totalFlux * 0.35) / Math.max(1, area);

    var exposure = s.wind / (0.8 + s.shelter * 2.5);
    var tilt = Math.atan(exposure * 0.55) * 180 / Math.PI;
    var verdict = exposure < 1 ? 'protected' : exposure < 1.6 ? 'marginal' : 'at risk';

    return {
      rate: rate, burn: burn, perLamp: perLamp, totalFlux: totalFlux,
      area: area, lux: lux, exposure: exposure, tilt: tilt, verdict: verdict, g: g
    };
  }

  function drawPlan(ctx, s, res, x, y, w, h) {
    var g = res.g;
    var pad = 22;
    var cxp = x + w / 2;
    var cyp = y + h / 2;
    var maxR = Math.min(w, h) / 2 - pad;
    var scale = g.radius > 0 ? maxR / g.radius : 1;

    /* ground disc */
    ctx.save();
    var grad = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, maxR);
    grad.addColorStop(0, 'rgba(255,138,61,0.10)');
    grad.addColorStop(0.6, 'rgba(255,138,61,0.05)');
    grad.addColorStop(1, 'rgba(255,138,61,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cxp, cyp, maxR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* rings */
    ctx.strokeStyle = 'rgba(217,164,65,0.22)';
    ctx.lineWidth = 0.8;
    [0.33, 0.66, 1].forEach(function (k) {
      ctx.beginPath();
      ctx.arc(cxp, cyp, maxR * k, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(cxp - maxR, cyp); ctx.lineTo(cxp + maxR, cyp);
    ctx.moveTo(cxp, cyp - maxR); ctx.lineTo(cxp, cyp + maxR);
    ctx.stroke();

    /* the diyas */
    var pts = [];
    var i;
    if (g.kind === 'grid') {
      var k = Math.ceil(Math.sqrt(s.count));
      for (i = 0; i < s.count; i++) {
        var r = Math.floor(i / k), c = i % k;
        pts.push({
          x: cxp + (c - (k - 1) / 2) * (maxR * 2 / k),
          y: cyp + (r - (k - 1) / 2) * (maxR * 2 / k)
        });
      }
    } else if (g.kind === 'ring') {
      for (i = 0; i < s.count; i++) {
        var a = (i / s.count) * Math.PI * 2;
        pts.push({ x: cxp + Math.cos(a) * maxR * 0.9, y: cyp + Math.sin(a) * maxR * 0.9 });
      }
    } else if (g.kind === 'line') {
      for (i = 0; i < s.count; i++) {
        pts.push({ x: cxp - maxR + (i / Math.max(1, s.count - 1)) * maxR * 2, y: cyp });
      }
    } else {
      for (i = 0; i < s.count; i++) {
        var t = i / s.count;
        var ang = t * res.g.turns * Math.PI * 2;
        var rad = maxR * (0.08 + 0.92 * t);
        pts.push({ x: cxp + Math.cos(ang) * rad, y: cyp + Math.sin(ang) * rad });
      }
    }

    var step = Math.max(1, Math.ceil(pts.length / 900));
    for (i = 0; i < pts.length; i += step) {
      var p = pts[i];
      ctx.fillStyle = 'rgba(255,138,61,0.18)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = EMBER;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    /* labels */
    ctx.fillStyle = BRASS;
    ctx.font = '400 9px "Sometype Mono", monospace';
    ctx.fillText('PLAN · ' + s.shape.toUpperCase(), x + 6, y + 12);
    ctx.fillStyle = MUTED;
    ctx.font = '400 8px "Sometype Mono", monospace';
    ctx.fillText(s.count.toLocaleString('en-IN') + ' DIYAS · RADIUS ' + g.radius.toFixed(1) + ' M', x + 6, y + h - 6);

    /* scale bar */
    var barLen = Math.min(w * 0.3, maxR);
    var barM = (barLen / scale);
    ctx.strokeStyle = 'rgba(207,216,232,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w - 14 - barLen, y + h - 14);
    ctx.lineTo(x + w - 14, y + h - 14);
    ctx.moveTo(x + w - 14 - barLen, y + h - 17);
    ctx.lineTo(x + w - 14 - barLen, y + h - 11);
    ctx.moveTo(x + w - 14, y + h - 17);
    ctx.lineTo(x + w - 14, y + h - 11);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.fillText(barM.toFixed(1) + ' M', x + w - 14 - barLen, y + h - 20);
  }

  function drawSection(ctx, s, res, x, y, w, h) {
    var groundY = y + h - 46;
    ctx.fillStyle = GROUND;
    ctx.fillRect(x, y, w, h);

    /* ground */
    ctx.strokeStyle = 'rgba(207,216,232,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, groundY);
    ctx.lineTo(x + w - 8, groundY);
    ctx.stroke();

    /* shelter wall, drawn to scale against a 1.6 m ceiling */
    var wallH = (s.shelter / 1.6) * (h * 0.5);
    if (wallH > 1) {
      ctx.fillStyle = 'rgba(217,164,65,0.18)';
      ctx.strokeStyle = 'rgba(217,164,65,0.6)';
      ctx.beginPath();
      ctx.rect(x + 10, groundY - wallH, 12, wallH);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = BRASS;
      ctx.font = '400 8px "Sometype Mono", monospace';
      ctx.fillText(s.shelter.toFixed(1) + ' M WALL', x + 6, groundY - wallH - 6);
    }

    /* diyas in section, with flame tilt */
    var n = Math.min(6, Math.max(2, Math.round(w / 46)));
    var tilt = res.tilt;
    for (var i = 0; i < n; i++) {
      var dx = x + 38 + (i / (n - 1)) * (w - 58);
      /* lamp body */
      ctx.fillStyle = '#b4622f';
      ctx.beginPath();
      ctx.moveTo(dx - 9, groundY);
      ctx.quadraticCurveTo(dx, groundY - 9, dx + 9, groundY);
      ctx.closePath();
      ctx.fill();
      /* flame, leaning with the wind */
      var fh = 11 + (s.wick / 22) * 8;
      var lean = Math.tan(tilt * Math.PI / 180) * fh;
      var fgrad = ctx.createLinearGradient(dx, groundY - fh, dx, groundY);
      fgrad.addColorStop(0, 'rgba(255,214,150,0.95)');
      fgrad.addColorStop(1, 'rgba(255,138,61,0.9)');
      ctx.fillStyle = fgrad;
      ctx.beginPath();
      ctx.moveTo(dx, groundY - 5);
      ctx.quadraticCurveTo(dx + lean * 0.4, groundY - fh * 0.7, dx + lean, groundY - fh);
      ctx.quadraticCurveTo(dx - lean * 0.1, groundY - fh * 0.5, dx, groundY - 5);
      ctx.fill();
      /* halo */
      var halo = ctx.createRadialGradient(dx, groundY - fh * 0.5, 0, dx, groundY - fh * 0.5, 26);
      halo.addColorStop(0, 'rgba(255,138,61,0.16)');
      halo.addColorStop(1, 'rgba(255,138,61,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(dx, groundY - fh * 0.5, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    /* wind arrows */
    var arrows = Math.min(4, Math.ceil(s.wind));
    ctx.strokeStyle = 'rgba(207,216,232,0.45)';
    ctx.lineWidth = 1;
    for (var a = 0; a < arrows; a++) {
      var ay = y + 18 + a * 13;
      var ax = x + 12;
      var len = 14 + s.wind * 4;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + len, ay);
      ctx.lineTo(ax + len - 4, ay - 3);
      ctx.moveTo(ax + len, ay);
      ctx.lineTo(ax + len - 4, ay + 3);
      ctx.stroke();
    }
    ctx.fillStyle = MUTED;
    ctx.font = '400 8px "Sometype Mono", monospace';
    ctx.fillText('SECTION · TILT ' + res.tilt.toFixed(0) + '°', x + 8, y + h - 8);
  }

  function render() {
    var s = {
      shape: el.shape.value,
      count: parseInt(el.count.value, 10),
      oil: parseInt(el.oil.value, 10),
      wick: parseInt(el.wick.value, 10),
      wind: parseFloat(el.wind.value),
      shelter: parseFloat(el.shelter.value)
    };

    el.countOut.textContent = s.count.toLocaleString('en-IN');
    el.oilOut.textContent = s.oil + ' ml';
    el.wickOut.textContent = s.wick + ' mm';
    el.windOut.textContent = s.wind.toFixed(1) + ' m/s';
    el.shelterOut.textContent = s.shelter.toFixed(1) + ' m';

    var res = compute(s);

    el.outOil.textContent = (s.count * s.oil / 1000).toFixed(1);
    el.outBurn.textContent = res.burn.toFixed(1);
    el.outFlux.textContent = (res.totalFlux / 1000).toFixed(1);
    el.outLux.textContent = res.lux < 10 ? res.lux.toFixed(1) : String(Math.round(res.lux));
    el.outVerdict.textContent = res.verdict;

    var note;
    if (res.burn < 2) {
      note = 'At ' + res.rate.toFixed(2) + ' ml an hour this array burns out in ' + res.burn.toFixed(1) + ' hours — under the length of most ceremonies. Add oil or a second filling.';
    } else if (res.verdict === 'at risk') {
      note = 'The wind is taking the flame: at ' + s.wind.toFixed(1) + ' m/s behind a ' + s.shelter.toFixed(1) + ' m wall, expect a third of the wicks out within twenty minutes. Raise the shelter or move the date.';
    } else if (res.verdict === 'marginal') {
      note = 'Marginal. The flames will hold but lean, and ' + (res.g.kind === 'line' ? 'the line will flicker unevenly' : 'the outer edge of the array will go out first') + '. A shelter of ' + (s.shelter + 0.3).toFixed(1) + ' m would settle it.';
    } else if (res.lux < 1.5) {
      note = 'Protected from the wind, but the ankle light is dim at ' + res.lux.toFixed(1) + ' lux — an array read as texture rather than as a path. Tighten the spacing if people must walk through it.';
    } else {
      note = 'At ' + s.wind.toFixed(1) + ' m/s a ' + s.shelter.toFixed(1) + ' m wall keeps the flames at a steady ' + res.tilt.toFixed(0) + '° tilt; ' + (s.count * s.oil / 1000).toFixed(1) + ' litres gives ' + res.burn.toFixed(1) + ' hours with oil to spare.';
    }
    el.note.textContent = note;

    var W = 700, H = 430;
    var ctx = setup(canvas, W, H);
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);

    var planW = W * 0.58;
    drawPlan(ctx, s, res, 10, 14, planW - 20, H - 28);
    ctx.strokeStyle = 'rgba(217,164,65,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(planW, 16);
    ctx.lineTo(planW, H - 16);
    ctx.stroke();
    drawSection(ctx, s, res, planW + 14, 14, W - planW - 24, H - 28);
  }

  ['input', 'change'].forEach(function (evt) {
    ['shape', 'count', 'oil', 'wick', 'wind', 'shelter'].forEach(function (k) {
      el[k].addEventListener(evt, render);
    });
  });

  var presets = {
    terrace: { shape: 'grid', count: 480, oil: 10, wick: 9, wind: 2.4, shelter: 0.2 },
    river: { shape: 'line', count: 1200, oil: 16, wick: 12, wind: 3.2, shelter: 0 },
    garden: { shape: 'ring', count: 240, oil: 8, wick: 8, wind: 0.8, shelter: 0.9 }
  };

  document.querySelectorAll('[data-preset]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var p = presets[chip.getAttribute('data-preset')];
      if (!p) return;
      el.shape.value = p.shape;
      el.count.value = p.count;
      el.oil.value = p.oil;
      el.wick.value = p.wick;
      el.wind.value = p.wind;
      el.shelter.value = p.shelter;
      render();
    });
  });

  render();
})();
