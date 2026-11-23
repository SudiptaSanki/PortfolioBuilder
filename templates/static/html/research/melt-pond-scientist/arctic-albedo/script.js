/* Arctic Albedo — Nuka Olsen
   Canvas 1: plan view of a drifting floe with melt ponds (hover to inspect).
   Canvas 2: area-averaged albedo and absorbed shortwave against pond cover.
   No audio. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- navigation ---------- */

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- contact form ---------- */

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var status = document.getElementById('formStatus');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.elements.namedItem('name');
      var email = contactForm.elements.namedItem('email');
      var message = contactForm.elements.namedItem('message');
      var ok = true;
      [name, email, message].forEach(function (field) {
        if (!field) return;
        var bad = !field.value.trim() || (field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field.value));
        field.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) ok = false;
      });
      if (!status) return;
      status.classList.add('is-visible');
      if (!ok) {
        status.classList.add('is-error');
        status.textContent = 'Check the name, email and message — nothing was drafted.';
        return;
      }
      status.classList.remove('is-error');
      status.textContent = 'Draft ready, ' + name.value.trim().split(/\s+/)[0] + '. Nothing was transmitted: copy the text into an email to nuka@polarsurface.no.';
      contactForm.reset();
    });
  }

  function fit(canvas, logicalW, logicalH) {
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

  /* ---------- deterministic random ---------- */

  function rng(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- hero floe ---------- */

  var floeCanvas = document.getElementById('floeCanvas');
  var pondHint = document.getElementById('pondHint');
  var FW = 1440, FH = 820;
  var ponds = [];
  var hovered = -1;
  var pointer = null;
  var timePhase = 0;

  function buildPonds() {
    var rand = rng(7319);
    ponds = [];
    // floe occupies an irregular area on the right two thirds
    for (var i = 0; i < 34; i++) {
      var x = 520 + rand() * 860;
      var y = 110 + rand() * 640;
      var rx = 18 + rand() * rand() * 96;
      var ry = rx * (0.42 + rand() * 0.5);
      ponds.push({
        x: x, y: y, rx: rx, ry: ry,
        rot: rand() * Math.PI,
        depth: 0.12 + rand() * 0.55,
        id: i + 1
      });
    }
  }
  buildPonds();

  function floePath(c) {
    c.beginPath();
    c.moveTo(430, 250);
    c.bezierCurveTo(520, 120, 760, 88, 980, 104);
    c.bezierCurveTo(1200, 120, 1420, 168, 1470, 300);
    c.bezierCurveTo(1510, 430, 1450, 590, 1330, 690);
    c.bezierCurveTo(1210, 790, 980, 812, 760, 780);
    c.bezierCurveTo(560, 750, 430, 640, 400, 500);
    c.bezierCurveTo(378, 400, 390, 300, 430, 250);
    c.closePath();
  }

  function turntable(rect) {
    var scale = Math.max(rect.width / FW, rect.height / FH);
    var ox = (rect.width - FW * scale) / 2;
    var oy = (rect.height - FH * scale) / 2;
    return { scale: scale, ox: ox, oy: oy };
  }

  function drawFloe() {
    if (!floeCanvas) return;
    var rect = floeCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var c = fit(floeCanvas, FW, FH);
    c.clearRect(0, 0, FW, FH);

    // ocean
    var sea = c.createLinearGradient(0, 0, 0, FH);
    sea.addColorStop(0, '#0a1c27');
    sea.addColorStop(0.55, '#081620');
    sea.addColorStop(1, '#050e14');
    c.fillStyle = sea;
    c.fillRect(0, 0, FW, FH);

    // ocean texture: long low swells
    c.strokeStyle = 'rgba(127, 212, 227, 0.05)';
    for (var s = 0; s < 26; s++) {
      c.lineWidth = 0.8 + (s % 3) * 0.4;
      c.beginPath();
      var yy = 20 + s * 32;
      c.moveTo(0, yy);
      for (var x = 0; x < FW; x += 60) {
        c.lineTo(x, yy + Math.sin(x * 0.008 + s) * 5);
      }
      c.stroke();
    }

    // lead: dark water between floes
    c.fillStyle = 'rgba(3, 9, 13, 0.85)';
    c.beginPath();
    c.moveTo(300, 0);
    c.bezierCurveTo(360, 160, 300, 300, 340, 470);
    c.bezierCurveTo(370, 610, 330, 740, 290, 820);
    c.lineTo(0, 820);
    c.lineTo(0, 0);
    c.closePath();
    c.fill();

    // floe body
    c.save();
    floePath(c);
    var ice = c.createLinearGradient(400, 100, 1420, 800);
    ice.addColorStop(0, '#dde8ea');
    ice.addColorStop(0.45, '#c4d3d6');
    ice.addColorStop(1, '#9fb3b8');
    c.fillStyle = ice;
    c.fill();
    c.clip();

    // snow drifts and bare ice texture
    var rand = rng(4421);
    for (var i = 0; i < 260; i++) {
      var px = 380 + rand() * 1140;
      var py = 80 + rand() * 760;
      var pr = 8 + rand() * 46;
      c.beginPath();
      c.ellipse(px, py, pr, pr * (0.4 + rand() * 0.5), rand() * 3, 0, Math.PI * 2);
      c.fillStyle = rand() > 0.42 ? 'rgba(246, 251, 252, 0.20)' : 'rgba(120, 148, 156, 0.10)';
      c.fill();
    }

    // ridge line
    c.strokeStyle = 'rgba(104, 128, 136, 0.55)';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(620, 175);
    c.bezierCurveTo(760, 230, 820, 210, 940, 268);
    c.bezierCurveTo(1040, 318, 1120, 300, 1210, 350);
    c.stroke();
    c.strokeStyle = 'rgba(238, 246, 248, 0.45)';
    c.lineWidth = 2;
    c.stroke();

    // cracks
    c.strokeStyle = 'rgba(52, 82, 92, 0.55)';
    var cracks = [
      [[470, 470], [620, 440], [760, 486], [900, 452], [1080, 500], [1230, 470]],
      [[560, 690], [700, 650], [860, 680], [1010, 640], [1180, 676]],
      [[820, 120], [860, 240], [900, 360], [880, 470]],
      [[1130, 200], [1160, 330], [1140, 470], [1180, 610]]
    ];
    for (var k = 0; k < cracks.length; k++) {
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(cracks[k][0][0], cracks[k][0][1]);
      for (var j = 1; j < cracks[k].length; j++) c.lineTo(cracks[k][j][0], cracks[k][j][1]);
      c.stroke();
    }

    // ponds
    for (var p = 0; p < ponds.length; p++) {
      var pd = ponds[p];
      c.save();
      c.translate(pd.x, pd.y);
      c.rotate(pd.rot);
      // wet rim
      c.beginPath();
      c.ellipse(0, 0, pd.rx + 7, pd.ry + 5, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(160, 196, 202, 0.45)';
      c.fill();
      // water
      c.beginPath();
      c.ellipse(0, 0, pd.rx, pd.ry, 0, 0, Math.PI * 2);
      var wg = c.createLinearGradient(-pd.rx, -pd.ry, pd.rx, pd.ry);
      var deep = Math.min(0.85, pd.depth);
      wg.addColorStop(0, 'rgba(40, 92, 104, 0.95)');
      wg.addColorStop(0.55, 'rgba(18, 56, 68, ' + (0.85 + deep * 0.1) + ')');
      wg.addColorStop(1, 'rgba(8, 32, 42, 0.96)');
      c.fillStyle = wg;
      c.fill();
      // rim shadow
      c.strokeStyle = 'rgba(8, 26, 32, 0.45)';
      c.lineWidth = 1.2;
      c.stroke();
      // glint
      c.beginPath();
      c.ellipse(-pd.rx * 0.25, -pd.ry * 0.32, pd.rx * 0.42, pd.ry * 0.22, -0.3, 0, Math.PI * 2);
      c.fillStyle = 'rgba(196, 234, 240, ' + (0.10 + 0.05 * Math.sin(timePhase + p)) + ')';
      c.fill();
      c.restore();
    }

    // hover highlight
    if (hovered >= 0 && ponds[hovered]) {
      var hp = ponds[hovered];
      c.save();
      c.translate(hp.x, hp.y);
      c.rotate(hp.rot);
      c.beginPath();
      c.ellipse(0, 0, hp.rx + 9, hp.ry + 7, 0, 0, Math.PI * 2);
      c.strokeStyle = '#e8b877';
      c.lineWidth = 2.2;
      c.stroke();
      c.restore();
    }

    // snow remnants on top
    for (var n2 = 0; n2 < 30; n2++) {
      var q = rng(900 + n2)();
      var sx = 450 + q * 1000;
      var sy = 110 + rng(1200 + n2)() * 680;
      c.beginPath();
      c.ellipse(sx, sy, 12 + q * 30, 7 + q * 14, q * 3, 0, Math.PI * 2);
      c.fillStyle = 'rgba(250, 253, 253, 0.5)';
      c.fill();
    }
    c.restore();

    // floe edge highlight
    c.save();
    floePath(c);
    c.strokeStyle = 'rgba(232, 246, 249, 0.65)';
    c.lineWidth = 2.4;
    c.stroke();
    c.strokeStyle = 'rgba(127, 212, 227, 0.25)';
    c.lineWidth = 8;
    c.stroke();
    c.restore();

    // scale bar
    c.strokeStyle = 'rgba(234, 243, 245, 0.5)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(1180, 760);
    c.lineTo(1300, 760);
    c.moveTo(1180, 754);
    c.lineTo(1180, 766);
    c.moveTo(1300, 754);
    c.lineTo(1300, 766);
    c.stroke();
    c.fillStyle = 'rgba(234, 243, 245, 0.6)';
    c.font = '11px "Spline Sans Mono", monospace';
    c.fillText('100 m', 1196, 750);
  }

  function pondAt(clientX, clientY) {
    if (!floeCanvas) return -1;
    var rect = floeCanvas.getBoundingClientRect();
    var t = turntable(rect);
    var lx = (clientX - rect.left - t.ox) / t.scale;
    var ly = (clientY - rect.top - t.oy) / t.scale;
    for (var i = 0; i < ponds.length; i++) {
      var p = ponds[i];
      var dx = lx - p.x;
      var dy = ly - p.y;
      var cs = Math.cos(-p.rot);
      var sn = Math.sin(-p.rot);
      var ex = (dx * cs - dy * sn) / p.rx;
      var ey = (dx * sn + dy * cs) / p.ry;
      if (ex * ex + ey * ey <= 1) return i;
    }
    return -1;
  }

  if (floeCanvas) {
    drawFloe();
    if ('ResizeObserver' in window) {
      new ResizeObserver(drawFloe).observe(floeCanvas);
    } else {
      window.addEventListener('resize', drawFloe);
    }

    function updateHint(i) {
      if (!pondHint) return;
      if (i >= 0) {
        var p = ponds[i];
        var area = Math.PI * p.rx * p.ry * 0.25; // m2, 100 m ≈ 200 px
        pondHint.textContent = 'Pond ' + p.id + ' · ' + (p.rx * 0.5).toFixed(1) + ' × ' + (p.ry * 0.5).toFixed(1) + ' m · ' + p.depth.toFixed(2) + ' m deep · ' + Math.round(area) + ' m²';
        pondHint.classList.add('is-active');
      } else {
        pondHint.textContent = 'Move across the floe to read a pond';
        pondHint.classList.remove('is-active');
      }
    }

    floeCanvas.addEventListener('pointermove', function (e) {
      var i = pondAt(e.clientX, e.clientY);
      if (i !== hovered) {
        hovered = i;
        updateHint(i);
        drawFloe();
      }
    });
    floeCanvas.addEventListener('pointerleave', function () {
      hovered = -1;
      updateHint(-1);
      drawFloe();
    });
    floeCanvas.addEventListener('click', function (e) {
      var i = pondAt(e.clientX, e.clientY);
      hovered = i;
      updateHint(i);
      drawFloe();
    });

    if (!reduceMotion) {
      var last = 0;
      var loop = function (ts) {
        if (ts - last > 120) {
          timePhase = ts / 2600;
          drawFloe();
          last = ts;
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- albedo bench ---------- */

  var form = document.getElementById('albedoForm');
  var chart = document.getElementById('albedoCanvas');
  if (!form || !chart) return;

  var el = {
    pondFraction: document.getElementById('pondFraction'),
    pondDepth: document.getElementById('pondDepth'),
    snow: document.getElementById('snow'),
    cloud: document.getElementById('cloud'),
    zenith: document.getElementById('zenith'),
    season: document.getElementById('season')
  };
  var out = {
    pondFraction: document.getElementById('pondFractionOut'),
    pondDepth: document.getElementById('pondDepthOut'),
    snow: document.getElementById('snowOut'),
    cloud: document.getElementById('cloudOut'),
    zenith: document.getElementById('zenithOut'),
    albedo: document.getElementById('albedoOut'),
    delta: document.getElementById('albedoDelta'),
    absorbed: document.getElementById('absorbed'),
    extra: document.getElementById('extra'),
    melt: document.getElementById('melt'),
    gain: document.getElementById('gain'),
    note: document.getElementById('chartNote'),
    reading: document.getElementById('reading')
  };

  var PRESETS = {
    onset: { pondFraction: 12, pondDepth: 0.15, snow: 22, cloud: 60, zenith: 28 },
    peak: { pondFraction: 34, pondDepth: 0.45, snow: 4, cloud: 70, zenith: 34 },
    drained: { pondFraction: 9, pondDepth: 0.1, snow: 0, cloud: 40, zenith: 30 },
    snow: { pondFraction: 2, pondDepth: 0.08, snow: 34, cloud: 50, zenith: 22 }
  };

  var state = { result: null };

  function val(id) { return parseFloat(el[id].value); }

  function model(f, depth, snowCm, cloudPct, elev, days) {
    var pondAlbedo = 0.30 - 0.22 * (1 - Math.exp(-depth / 0.18));
    var iceAlbedo = 0.55 + 0.27 * (1 - Math.exp(-snowCm / 6));
    var albedo = f * pondAlbedo + (1 - f) * iceAlbedo;
    var S = 1361 * Math.sin(elev * Math.PI / 180) * 0.45 * (1 - 0.6 * Math.pow(cloudPct, 1.5));
    var absorbed = S * (1 - albedo);
    var absorbedNoPonds = S * (1 - iceAlbedo);
    var extra = absorbed - absorbedNoPonds;
    var extraEnergy = extra * days * 86400;
    var meltM = extraEnergy / (334e3 * 917);
    var gainPerPercent = S * (iceAlbedo - pondAlbedo) / 100;
    return {
      f: f, depth: depth, snowCm: snowCm, cloudPct: cloudPct, elev: elev, days: days,
      pondAlbedo: pondAlbedo, iceAlbedo: iceAlbedo, albedo: albedo, S: S,
      absorbed: absorbed, absorbedNoPonds: absorbedNoPonds, extra: extra,
      meltM: meltM, gainPerPercent: gainPerPercent
    };
  }

  function calculate() {
    return model(val('pondFraction') / 100, val('pondDepth'), val('snow'),
      val('cloud') / 100, val('zenith'), parseFloat(el.season.value));
  }

  function fmt(n, d) {
    return Number(n).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function drawChart(res) {
    var cssW = chart.getBoundingClientRect().width || 960;
    var narrow = cssW < 560;
    var W = narrow ? 480 : 960;
    var H = narrow ? 540 : 420;
    var c = fit(chart, W, H);
    c.clearRect(0, 0, W, H);

    var padL = narrow ? 54 : 64;
    var padR = narrow ? 54 : 64;
    var padT = narrow ? 40 : 34;
    var padB = narrow ? 56 : 58;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var fs = narrow ? 12 : 11.5;

    var maxF = 0.6;
    var maxAlbedo = 0.9;
    var maxExtra = Math.max(30, res.S * (res.iceAlbedo - 0.05) * 0.6);

    function X(f) { return padL + (f / maxF) * plotW; }
    function Ya(a) { return padT + plotH - (a / maxAlbedo) * plotH; }
    function Ye(e) { return padT + plotH - (e / maxExtra) * plotH; }

    // panel
    c.fillStyle = '#0b151c';
    c.fillRect(0, 0, W, H);

    // horizontal grid
    c.font = fs + 'px "Spline Sans Mono", monospace';
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (var a = 0; a <= 0.8; a += 0.2) {
      var y = Ya(a);
      c.strokeStyle = 'rgba(214, 236, 241, 0.09)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(padL, y);
      c.lineTo(padL + plotW, y);
      c.stroke();
      c.fillStyle = '#748a93';
      c.fillText(a.toFixed(1), padL - 8, y);
    }

    // right axis labels (extra absorbed)
    c.textAlign = 'left';
    for (var q = 0; q <= 4; q++) {
      var ev = maxExtra * q / 4;
      c.fillStyle = '#5d7580';
      c.fillText(Math.round(ev), padL + plotW + 8, Ye(ev));
    }

    // x ticks
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (var f = 0; f <= maxF + 0.001; f += 0.1) {
      var x = X(f);
      c.strokeStyle = 'rgba(214, 236, 241, 0.06)';
      c.beginPath();
      c.moveTo(x, padT);
      c.lineTo(x, padT + plotH);
      c.stroke();
      c.fillStyle = '#748a93';
      c.fillText(Math.round(f * 100) + '%', x, padT + plotH + 8);
    }

    // extra absorbed area
    c.beginPath();
    c.moveTo(X(0), Ye(0));
    for (var f2 = 0; f2 <= maxF + 0.0001; f2 += 0.01) {
      var e2 = res.S * (res.iceAlbedo - (f2 * res.pondAlbedo + (1 - f2) * res.iceAlbedo));
      c.lineTo(X(f2), Ye(e2));
    }
    c.lineTo(X(maxF), Ye(0));
    c.closePath();
    var ag = c.createLinearGradient(0, padT, 0, padT + plotH);
    ag.addColorStop(0, 'rgba(232, 184, 119, 0.16)');
    ag.addColorStop(1, 'rgba(232, 184, 119, 0.02)');
    c.fillStyle = ag;
    c.fill();

    // albedo curve
    c.beginPath();
    for (var f3 = 0; f3 <= maxF + 0.0001; f3 += 0.005) {
      var al = f3 * res.pondAlbedo + (1 - f3) * res.iceAlbedo;
      if (f3 === 0) c.moveTo(X(f3), Ya(al)); else c.lineTo(X(f3), Ya(al));
    }
    c.strokeStyle = '#7fd4e3';
    c.lineWidth = 2.2;
    c.lineJoin = 'round';
    c.stroke();

    // albedo curve label
    c.fillStyle = '#7fd4e3';
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.font = fs + 'px "Spline Sans Mono", monospace';
    c.fillText('surface albedo', X(0.02), Ya(res.iceAlbedo) - 8);

    // extra absorbed label
    c.fillStyle = '#e8b877';
    c.textAlign = 'right';
    c.textBaseline = 'top';
    c.fillText('extra absorbed, W/m²', padL + plotW - 6, padT + 8);

    // current state marker
    var mx = X(res.f);
    var my = Ya(res.albedo);
    c.save();
    c.strokeStyle = 'rgba(234, 243, 245, 0.3)';
    c.setLineDash([3, 5]);
    c.beginPath();
    c.moveTo(mx, padT);
    c.lineTo(mx, padT + plotH);
    c.stroke();
    c.restore();
    c.beginPath();
    c.arc(mx, my, 5, 0, Math.PI * 2);
    c.fillStyle = '#eaf3f5';
    c.fill();
    c.beginPath();
    c.arc(mx, my, 9, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(127, 212, 227, 0.7)';
    c.lineWidth = 1.2;
    c.stroke();

    // marker label
    var label = Math.round(res.f * 100) + '% · ' + res.albedo.toFixed(2);
    c.font = fs + 'px "Spline Sans Mono", monospace';
    var tw = c.measureText(label).width;
    var lx = mx + 12;
    if (lx + tw > padL + plotW) lx = mx - tw - 12;
    var ly = Math.max(padT + 4, my - 30);
    c.fillStyle = 'rgba(11, 21, 28, 0.92)';
    c.fillRect(lx - 4, ly - 2, tw + 8, 20);
    c.fillStyle = '#eaf3f5';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(label, lx, ly);

    // axis titles
    c.fillStyle = '#748a93';
    if (narrow) {
      c.textAlign = 'left';
      c.fillText('albedo', 6, 12);
    } else {
      c.textAlign = 'right';
      c.fillText('albedo', padL - 18, 12);
    }
    c.textAlign = 'right';
    c.fillText('W/m²', W - 6, 12);
    c.textAlign = 'center';
    c.fillText(narrow ? 'Pond cover' : 'Pond cover, share of floe surface', padL + plotW / 2, H - 16);
  }

  function render() {
    var res = calculate();
    state.result = res;

    out.pondFraction.textContent = Math.round(res.f * 100) + '%';
    out.pondDepth.textContent = fmt(res.depth, 2) + ' m';
    out.snow.textContent = fmt(res.snowCm, 0) + ' cm';
    out.cloud.textContent = Math.round(res.cloudPct * 100) + '%';
    out.zenith.textContent = Math.round(res.elev) + '°';

    out.albedo.textContent = res.albedo.toFixed(2);
    out.delta.textContent = '−' + (res.iceAlbedo - res.albedo).toFixed(2) + ' vs pond-free snow/ice';
    out.absorbed.textContent = Math.round(res.absorbed) + ' W/m²';
    out.extra.textContent = '+' + Math.round(res.extra) + ' W/m²';
    out.melt.textContent = fmt(res.meltM, 2) + ' m ice';
    out.gain.textContent = fmt(res.gainPerPercent, 1) + ' W/m² per 1%';

    out.note.textContent = 'Albedo falls from ' + res.iceAlbedo.toFixed(2) + ' with no ponds to ' + res.pondAlbedo.toFixed(2) + ' on open water. Incoming shortwave ' + Math.round(res.S) + ' W/m². Marker: ' + Math.round(res.f * 100) + '% pond cover.';

    out.reading.textContent = 'At ' + Math.round(res.f * 100) + '% pond cover the floe albedo is ' + res.albedo.toFixed(2) + ' and it absorbs ' + Math.round(res.absorbed) + ' W/m², or ' + Math.round(res.extra) + ' W/m² more than the same surface with no ponds. Over ' + res.days + ' days of melt season that surplus is enough to melt ' + fmt(res.meltM, 2) + ' m of ice, if all of it went into melting rather than warming water or the air.';

    drawChart(res);
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
      var p = PRESETS[chip.getAttribute('data-preset')];
      if (!p) return;
      el.pondFraction.value = p.pondFraction;
      el.pondDepth.value = p.pondDepth;
      el.snow.value = p.snow;
      el.cloud.value = p.cloud;
      el.zenith.value = p.zenith;
      document.querySelectorAll('.chip').forEach(function (ch) { ch.setAttribute('aria-pressed', 'false'); });
      chip.setAttribute('aria-pressed', 'true');
      render();
    });
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { if (state.result) drawChart(state.result); }).observe(chart);
  } else {
    window.addEventListener('resize', function () { if (state.result) drawChart(state.result); });
  }

  render();

})();
