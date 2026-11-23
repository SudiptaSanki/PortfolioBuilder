/* Astro Geology — Lena Márquez
   Canvas 1: rotating cratered body (procedural, no images).
   Canvas 2: crater cross-section or reflectance spectrum, switched by tabs.
   No audio. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      status.textContent = 'Draft ready, ' + name.value.trim().split(/\s+/)[0] + '. Nothing was transmitted: copy the text into an email to lena@planetarysurfaces.org.';
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

  function rng(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- globe ---------- */

  var globe = document.getElementById('globeCanvas');
  var phase = 0;
  var stars = [];
  var craters = [];
  var patches = [];
  var maria = [];

  function buildGlobe() {
    var rand = rng(2214);
    stars = [];
    for (var i = 0; i < 130; i++) {
      stars.push({ x: rand() * 720, y: rand() * 720, r: rand() * 1.3 + 0.2, a: 0.2 + rand() * 0.6 });
    }
    craters = [];
    for (var c = 0; c < 72; c++) {
      var lon = rand() * Math.PI * 2;
      var lat = (rand() - 0.5) * Math.PI * 0.92;
      craters.push({
        lon: lon, lat: lat,
        r: 4 + rand() * rand() * 34,
        depth: 0.4 + rand() * 0.6
      });
    }
    patches = [];
    for (var p = 0; p < 70; p++) {
      patches.push({
        lon: rand() * Math.PI * 2,
        lat: (rand() - 0.5) * Math.PI * 0.95,
        r: 10 + rand() * 46,
        a: 0.015 + rand() * 0.035
      });
    }
    maria = [];
    for (var m = 0; m < 9; m++) {
      maria.push({
        lon: rand() * Math.PI * 2,
        lat: (rand() - 0.5) * Math.PI * 0.8,
        r: 40 + rand() * 70,
        a: 0.10 + rand() * 0.12
      });
    }
  }
  buildGlobe();

  function drawGlobe() {
    if (!globe) return;
    var W = 720, H = 720;
    var c = fit(globe, W, H);
    c.clearRect(0, 0, W, H);

    // space
    c.fillStyle = '#070605';
    c.fillRect(0, 0, W, H);
    stars.forEach(function (s) {
      c.beginPath();
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      c.fillStyle = 'rgba(232, 224, 210, ' + s.a + ')';
      c.fill();
    });

    var cx = 356, cy = 360, R = 248;

    // halo
    var halo = c.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.22);
    halo.addColorStop(0, 'rgba(208, 90, 43, 0.10)');
    halo.addColorStop(1, 'rgba(208, 90, 43, 0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
    c.fill();

    c.save();
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.clip();

    // base surface
    var base = c.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
    base.addColorStop(0, '#9b8b74');
    base.addColorStop(0.5, '#6f6151');
    base.addColorStop(1, '#3b3229');
    c.fillStyle = base;
    c.fillRect(cx - R, cy - R, R * 2, R * 2);

    // dark maria
    maria.forEach(function (p) {
      var lon = p.lon + phase;
      var x3 = Math.cos(p.lat) * Math.sin(lon);
      var z = Math.cos(p.lat) * Math.cos(lon);
      if (z <= 0) return;
      var y3 = Math.sin(p.lat);
      var sx = cx + x3 * R;
      var sy = cy - y3 * R;
      c.beginPath();
      c.ellipse(sx, sy, p.r * z * 1.1, p.r * z * 0.78, 0.3, 0, Math.PI * 2);
      c.fillStyle = 'rgba(28, 24, 20, ' + (p.a * z) + ')';
      c.fill();
    });

    // albedo patches
    patches.forEach(function (p) {
      var lon = p.lon + phase;
      var x3 = Math.cos(p.lat) * Math.sin(lon);
      var z = Math.cos(p.lat) * Math.cos(lon);
      if (z <= 0) return;
      var y3 = Math.sin(p.lat);
      var sx = cx + x3 * R;
      var sy = cy - y3 * R;
      c.beginPath();
      c.ellipse(sx, sy, p.r * z * 0.9, p.r * z * 0.7, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(232, 224, 210, ' + (p.a * z) + ')';
      c.fill();
    });

    // craters
    craters.forEach(function (cr) {
      var lon = cr.lon + phase;
      var x3 = Math.cos(cr.lat) * Math.sin(lon);
      var z = Math.cos(cr.lat) * Math.cos(lon);
      if (z <= 0.06) return;
      var y3 = Math.sin(cr.lat);
      var sx = cx + x3 * R;
      var sy = cy - y3 * R;
      var rr = cr.r * z;
      // shadowed floor
      c.beginPath();
      c.arc(sx, sy, rr, 0, Math.PI * 2);
      c.fillStyle = 'rgba(24, 20, 16, ' + (0.40 * z) + ')';
      c.fill();
      // rim highlight (upper left)
      c.beginPath();
      c.arc(sx, sy, rr, Math.PI * 0.95, Math.PI * 2.05);
      c.strokeStyle = 'rgba(240, 230, 212, ' + (0.50 * z) + ')';
      c.lineWidth = Math.max(0.6, 1.5 * z);
      c.stroke();
      // rim shadow (lower right)
      c.beginPath();
      c.arc(sx, sy, rr, -0.1, Math.PI * 0.95);
      c.strokeStyle = 'rgba(16, 12, 9, ' + (0.5 * z) + ')';
      c.stroke();
      // floor highlight
      c.beginPath();
      c.arc(sx - rr * 0.18, sy - rr * 0.18, rr * 0.55, 0, Math.PI * 2);
      c.fillStyle = 'rgba(150, 132, 108, ' + (0.10 * z) + ')';
      c.fill();
    });

    // terminator: light from upper left, shadow lower right
    var term = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    term.addColorStop(0, 'rgba(0,0,0,0)');
    term.addColorStop(0.42, 'rgba(0,0,0,0.08)');
    term.addColorStop(0.58, 'rgba(0,0,0,0.62)');
    term.addColorStop(1, 'rgba(0,0,0,0.92)');
    c.fillStyle = term;
    c.fillRect(cx - R, cy - R, R * 2, R * 2);

    // limb darkening
    var limb = c.createRadialGradient(cx, cy, R * 0.62, cx, cy, R);
    limb.addColorStop(0, 'rgba(0,0,0,0)');
    limb.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = limb;
    c.fillRect(cx - R, cy - R, R * 2, R * 2);
    c.restore();

    // rim
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(217, 196, 138, 0.35)';
    c.lineWidth = 1.2;
    c.stroke();

    // sun direction
    c.fillStyle = 'rgba(217, 196, 138, 0.55)';
    c.font = '10px "Azeret Mono", monospace';
    c.textAlign = 'left';
    c.fillText('N', cx + 6, cy - R + 14);
    c.fillText('sun', 22, 26);
    c.strokeStyle = 'rgba(217, 196, 138, 0.25)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(44, 32);
    c.lineTo(80, 46);
    c.stroke();
  }

  if (globe) {
    drawGlobe();
    if ('ResizeObserver' in window) new ResizeObserver(drawGlobe).observe(globe);
    else window.addEventListener('resize', drawGlobe);
    if (!reduceMotion) {
      var last = 0;
      var loop = function (ts) {
        if (ts - last > 90) {
          phase = (ts / 26000) % (Math.PI * 2);
          drawGlobe();
          last = ts;
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- bench ---------- */

  var bench = document.getElementById('benchCanvas');
  var tabs = document.querySelectorAll('.tab');
  if (!bench || !tabs.length) return;

  var TARGETS = {
    moon: { g: 1.62, rho: 2900, name: 'Moon' },
    mars: { g: 3.71, rho: 3300, name: 'Mars' },
    mercury: { g: 3.70, rho: 3400, name: 'Mercury' },
    europa: { g: 1.31, rho: 2900, name: 'Europa' },
    ceres: { g: 0.28, rho: 2160, name: 'Ceres' },
    vesta: { g: 0.22, rho: 3200, name: 'Vesta' }
  };

  var MINERALS = {
    pyroxene: {
      label: 'High-Ca pyroxene', albedo: 0.27,
      bands: [{ c: 1.05, w: 0.16, d: 0.30, name: '1 µm' }, { c: 2.05, w: 0.28, d: 0.26, name: '2 µm' }],
      diagnostic: 'Ca-rich clinopyroxene'
    },
    olivine: {
      label: 'Olivine (Fo70)', albedo: 0.34,
      bands: [{ c: 1.05, w: 0.26, d: 0.36, name: '1.05 µm' }],
      diagnostic: 'broad 1 µm, no 2 µm'
    },
    plagioclase: {
      label: 'Plagioclase', albedo: 0.56,
      bands: [{ c: 1.25, w: 0.09, d: 0.07, name: '1.25 µm' }],
      diagnostic: 'bright, weak 1.25 µm'
    },
    hydrated: {
      label: 'Hydrated silica', albedo: 0.42,
      bands: [{ c: 1.41, w: 0.03, d: 0.22, name: '1.41 µm' }, { c: 1.91, w: 0.05, d: 0.32, name: '1.91 µm' }],
      diagnostic: 'OH/H₂O features'
    },
    hematite: {
      label: 'Hematite', albedo: 0.21,
      bands: [{ c: 0.53, w: 0.05, d: 0.12, name: '0.53 µm' }, { c: 0.86, w: 0.10, d: 0.26, name: '0.86 µm' }],
      diagnostic: 'ferric 0.86 µm band'
    }
  };

  var el = {
    impactor: document.getElementById('impactor'),
    velocity: document.getElementById('velocity'),
    angle: document.getElementById('angle'),
    target: document.getElementById('target'),
    mineral: document.getElementById('mineral'),
    grain: document.getElementById('grain'),
    observation: document.getElementById('observation')
  };
  var out = {
    impactor: document.getElementById('impactorOut'),
    velocity: document.getElementById('velocityOut'),
    angle: document.getElementById('angleOut'),
    finalD: document.getElementById('finalD'),
    craterType: document.getElementById('craterType'),
    grain: document.getElementById('grainOut'),
    band: document.getElementById('bandOut'),
    bandDepth: document.getElementById('bandDepth'),
    chartTitle: document.getElementById('chartTitle'),
    chartUnit: document.getElementById('chartUnit'),
    modeNote: document.getElementById('modeNote')
  };

  var mode = 'crater';
  var row = document.getElementById('resultRow');

  function fmt(n, d) {
    return Number(n).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function formatLength(m) {
    if (m >= 1000) return fmt(m / 1000, m / 1000 < 10 ? 2 : 1) + ' km';
    return fmt(m, 0) + ' m';
  }

  function craterModel() {
    var L = parseFloat(el.impactor.value);
    var v = parseFloat(el.velocity.value) * 1000;
    var theta = parseFloat(el.angle.value) * Math.PI / 180;
    var target = TARGETS[el.target.value] || TARGETS.moon;
    var rhoI = 3000;
    var g = target.g;
    var dtc = 1.161 * Math.pow(rhoI / target.rho, 1 / 3) * Math.pow(L, 0.78) *
      Math.pow(v, 0.44) * Math.pow(g, -0.22) * Math.pow(Math.sin(theta), 1 / 3);
    var transition = 15000 * Math.pow(1.62 / g, 0.45);
    var complex = dtc > transition * 0.62;
    var dfinal = dtc * (complex ? 1.45 : 1.25);
    var depth = complex ? dfinal * 0.11 : dtc * 0.2;
    var rim = dfinal * 0.04;
    var ejecta = dfinal * 2.3;
    return {
      L: L, v: v / 1000, theta: el.angle.value, target: target,
      dtc: dtc, dfinal: dfinal, depth: depth, rim: rim, ejecta: ejecta, complex: complex
    };
  }

  function drawCrater(res) {
    var cssW = bench.getBoundingClientRect().width || 960;
    var narrow = cssW < 560;
    var W = narrow ? 480 : 960;
    var H = narrow ? 560 : 520;
    var c = fit(bench, W, H);
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#0e0c0b';
    c.fillRect(0, 0, W, H);

    var padL = narrow ? 18 : 30;
    var padR = narrow ? 18 : 30;
    var padT = narrow ? 30 : 34;
    var padB = narrow ? 66 : 70;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;

    var half = res.ejecta * 1.12;
    var maxDepth = res.depth * 1.45;
    var surfY = padT + plotH * 0.31;

    function X(x) { return padL + plotW / 2 + (x / half) * (plotW / 2); }
    function Y(y) { return surfY + (y / maxDepth) * (plotH * 0.54); }

    var rimY = Y(-res.rim);
    var dRim = res.dfinal / 2;

    // ground body
    var gg = c.createLinearGradient(0, surfY, 0, padT + plotH);
    gg.addColorStop(0, '#221b15');
    gg.addColorStop(1, '#120e0b');
    c.fillStyle = gg;
    c.fillRect(padL, surfY, plotW, padT + plotH - surfY);
    c.strokeStyle = 'rgba(232, 224, 210, 0.055)';
    c.lineWidth = 1;
    for (var st = 1; st <= 4; st++) {
      var sy = surfY + (padT + plotH - surfY) * st / 5;
      c.beginPath();
      c.moveTo(padL, sy);
      c.lineTo(padL + plotW, sy);
      c.stroke();
    }

    // ejecta blanket: raised, thinning outward
    function thickness(x) {
      var a = Math.abs(x);
      if (a < dRim) return res.rim;
      if (a > res.ejecta) return 0;
      var t = (a - dRim) / Math.max(1, res.ejecta - dRim);
      return res.rim * 1.05 * Math.pow(1 - t, 1.5);
    }
    c.beginPath();
    c.moveTo(X(-half), surfY);
    for (var e = -half; e <= half; e += half / 120) {
      c.lineTo(X(e), Y(-thickness(e)));
    }
    c.lineTo(X(half), surfY);
    c.closePath();
    var eg = c.createLinearGradient(0, surfY - res.rim, 0, surfY);
    eg.addColorStop(0, 'rgba(224, 200, 158, 0.55)');
    eg.addColorStop(1, 'rgba(150, 126, 92, 0.26)');
    c.fillStyle = eg;
    c.fill();
    c.strokeStyle = 'rgba(232, 224, 210, 0.30)';
    c.lineWidth = 1;
    c.beginPath();
    for (var e2 = -half; e2 <= half; e2 += half / 120) {
      var yy = Y(-thickness(e2));
      if (e2 === -half) c.moveTo(X(e2), yy); else c.lineTo(X(e2), yy);
    }
    c.stroke();

    // original ground level
    c.save();
    c.strokeStyle = 'rgba(232, 224, 210, 0.22)';
    c.setLineDash([4, 5]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(padL, surfY);
    c.lineTo(padL + plotW, surfY);
    c.stroke();
    c.restore();

    // crater bowl
    c.beginPath();
    c.moveTo(X(-dRim), rimY);
    for (var i = -60; i <= 60; i++) {
      var t = i / 60;
      var depth = res.depth * (1 - t * t);
      c.lineTo(X(t * dRim), Y(depth));
    }
    c.lineTo(X(dRim), rimY);
    c.closePath();
    var bg = c.createLinearGradient(0, rimY, 0, Y(res.depth));
    bg.addColorStop(0, '#3d332a');
    bg.addColorStop(0.45, '#241d17');
    bg.addColorStop(1, '#120e0b');
    c.fillStyle = bg;
    c.fill();
    c.strokeStyle = 'rgba(232, 224, 210, 0.55)';
    c.lineWidth = 1.4;
    c.stroke();

    // rim highlight
    c.strokeStyle = 'rgba(242, 232, 214, 0.8)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(X(-dRim), rimY - 2);
    c.lineTo(X(-dRim) - 3, surfY - res.rim * 0.2);
    c.moveTo(X(dRim), rimY - 2);
    c.lineTo(X(dRim) + 3, surfY - res.rim * 0.2);
    c.stroke();

    // faint rays on the ejecta
    c.strokeStyle = 'rgba(232, 224, 210, 0.07)';
    c.lineWidth = 1;
    for (var r = 0; r < 16; r++) {
      var ang = (r / 16) * Math.PI - Math.PI / 2;
      var len = res.ejecta * (0.7 + (r % 4) * 0.09);
      c.beginPath();
      c.moveTo(X(Math.sin(ang) * dRim * 0.3), surfY - res.rim * 0.5);
      c.lineTo(X(Math.sin(ang) * len), surfY - 4);
      c.stroke();
    }

    // diameter annotation
    var dLineY = padT + 26;
    c.strokeStyle = '#d05a2b';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(X(-dRim), dLineY);
    c.lineTo(X(dRim), dLineY);
    c.moveTo(X(-dRim), dLineY - 4);
    c.lineTo(X(-dRim), dLineY + 4);
    c.moveTo(X(dRim), dLineY - 4);
    c.lineTo(X(dRim), dLineY + 4);
    c.moveTo(X(-dRim), dLineY + 4);
    c.lineTo(X(-dRim), rimY - 3);
    c.moveTo(X(dRim), dLineY + 4);
    c.lineTo(X(dRim), rimY - 3);
    c.stroke();
    c.fillStyle = '#d05a2b';
    c.font = (narrow ? 14 : 12.5) + 'px "Azeret Mono", monospace';
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText('D = ' + formatLength(res.dfinal), X(0), dLineY - 7);

    // depth annotation
    c.strokeStyle = 'rgba(232, 224, 210, 0.5)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(X(0) + 1, surfY);
    c.lineTo(X(0) + 1, Y(res.depth));
    c.moveTo(X(0) - 5, Y(0));
    c.lineTo(X(0) + 6, Y(0));
    c.moveTo(X(0) - 5, Y(res.depth));
    c.lineTo(X(0) + 6, Y(res.depth));
    c.stroke();
    var depthLabel = 'depth ' + formatLength(res.depth);
    c.font = (narrow ? 13 : 11.5) + 'px "Azeret Mono", monospace';
    var dtw = c.measureText(depthLabel).width;
    var dx = X(0) + 16;
    if (dx + dtw > padL + plotW) dx = X(0) - dtw - 16;
    c.fillStyle = 'rgba(14, 12, 11, 0.85)';
    c.fillRect(dx - 3, (surfY + Y(res.depth)) / 2 - 9, dtw + 6, 18);
    c.fillStyle = '#e8e0d2';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(depthLabel, dx, (surfY + Y(res.depth)) / 2);

    // ejecta annotation
    var ex = dRim + (res.ejecta - dRim) * 0.62;
    var ey = Y(-thickness(ex));
    var ejLabel = 'continuous ejecta';
    var ejW = c.measureText(ejLabel).width;
    var ejX = X(ex);
    var ejY = Math.max(padT + 46, surfY - res.rim * 3.2);
    c.strokeStyle = 'rgba(217, 196, 138, 0.5)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(ejX, ejY + 4);
    c.lineTo(ejX, ey - 3);
    c.stroke();
    c.fillStyle = '#9c9080';
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(ejLabel, Math.max(padL + ejW / 2, Math.min(ejX, padL + plotW - ejW / 2)), ejY);

    // scale and note
    c.fillStyle = '#6f665b';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = (narrow ? 12 : 10.5) + 'px "Azeret Mono", monospace';
    c.fillText('vertical exaggeration ×1.8 · ' + res.target.name + ' gravity', padL, 8);

    var barLen = Math.pow(10, Math.floor(Math.log10(res.ejecta * 1.2)));
    var barPx = (barLen / (half * 2)) * plotW;
    c.strokeStyle = '#9c9080';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(padL, H - 24);
    c.lineTo(padL + barPx, H - 24);
    c.moveTo(padL, H - 29);
    c.lineTo(padL, H - 19);
    c.moveTo(padL + barPx, H - 29);
    c.lineTo(padL + barPx, H - 19);
    c.stroke();
    c.fillStyle = '#9c9080';
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.fillText(formatLength(barLen), padL + 4, H - 32);
  }

  function spectrumModel() {
    var m = MINERALS[el.mineral.value] || MINERALS.pyroxene;
    var grain = parseFloat(el.grain.value);
    var weathered = el.observation.value === 'weathered';
    var depthFactor = 0.55 + 0.45 * Math.min(1, Math.log(grain / 10) / Math.log(30));
    var albedo = m.albedo * (weathered ? 0.62 : 1) * (0.92 - 0.35 * Math.min(1, Math.log(grain / 10) / Math.log(30)));
    var bands = m.bands.map(function (b) {
      return { c: b.c, w: b.w, d: b.d * depthFactor * (weathered ? 0.68 : 1), name: b.name };
    });
    return { mineral: m, grain: grain, weathered: weathered, albedo: albedo, bands: bands, depthFactor: depthFactor };
  }

  function reflectance(res, lambda) {
    var cont = res.albedo * (1 + (res.weathered ? 0.28 : 0.06) * (lambda - 1.2));
    var att = 0;
    res.bands.forEach(function (b) {
      att += b.d * Math.exp(-Math.pow((lambda - b.c) / b.w, 2));
    });
    return Math.max(0.02, cont * (1 - att));
  }

  function drawSpectra(res) {
    var cssW = bench.getBoundingClientRect().width || 960;
    var narrow = cssW < 560;
    var W = narrow ? 480 : 960;
    var H = narrow ? 560 : 520;
    var c = fit(bench, W, H);
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#0e0c0b';
    c.fillRect(0, 0, W, H);

    var padL = narrow ? 50 : 62;
    var padR = narrow ? 18 : 28;
    var padT = narrow ? 36 : 42;
    var padB = narrow ? 56 : 62;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var lMin = 0.4, lMax = 2.5;
    var maxRef = 0;
    for (var ml = lMin; ml <= lMax; ml += 0.01) maxRef = Math.max(maxRef, reflectance(res, ml));
    var rMax = Math.max(0.12, Math.ceil(maxRef * 1.35 * 20) / 20);

    function X(l) { return padL + (l - lMin) / (lMax - lMin) * plotW; }
    function Y(r) { return padT + plotH - (r / rMax) * plotH; }

    c.font = (narrow ? 14 : 11) + 'px "Azeret Mono", monospace';
    // grid
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    [0, rMax / 4, rMax / 2, rMax * 0.75].forEach(function (v) {
      c.strokeStyle = 'rgba(232, 224, 210, 0.09)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(padL, Y(v));
      c.lineTo(padL + plotW, Y(v));
      c.stroke();
      c.fillStyle = '#9c9080';
      c.fillText(v.toFixed(2), padL - 8, Y(v));
    });
    c.textAlign = 'center';
    c.textBaseline = 'top';
    [0.5, 1.0, 1.5, 2.0, 2.5].forEach(function (v) {
      var x = X(v);
      c.strokeStyle = 'rgba(232, 224, 210, 0.05)';
      c.beginPath();
      c.moveTo(x, padT);
      c.lineTo(x, padT + plotH);
      c.stroke();
      c.fillStyle = '#9c9080';
      c.fillText(v.toFixed(1), x, padT + plotH + 8);
    });

    // band markers
    res.bands.forEach(function (b) {
      var x = X(b.c);
      c.save();
      c.strokeStyle = 'rgba(208, 90, 43, 0.55)';
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(x, padT);
      c.lineTo(x, padT + plotH);
      c.stroke();
      c.restore();
      c.fillStyle = '#d05a2b';
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText(b.name, x, padT - 4);
    });

    // continuum (dashed)
    c.beginPath();
    for (var l0 = lMin; l0 <= lMax; l0 += 0.02) {
      var rv0 = res.albedo * (1 + (res.weathered ? 0.28 : 0.06) * (l0 - 1.2));
      if (l0 === lMin) c.moveTo(X(l0), Y(rv0)); else c.lineTo(X(l0), Y(rv0));
    }
    c.strokeStyle = 'rgba(232, 224, 210, 0.28)';
    c.setLineDash([5, 5]);
    c.lineWidth = 1;
    c.stroke();
    c.setLineDash([]);

    // spectrum
    c.beginPath();
    for (var l = lMin; l <= lMax; l += 0.005) {
      var rv = reflectance(res, l);
      if (l === lMin) c.moveTo(X(l), Y(rv)); else c.lineTo(X(l), Y(rv));
    }
    c.strokeStyle = '#d9c48a';
    c.lineWidth = 2.2;
    c.lineJoin = 'round';
    c.stroke();

    // fill
    c.lineTo(X(lMax), padT + plotH);
    c.lineTo(X(lMin), padT + plotH);
    c.closePath();
    var fg = c.createLinearGradient(0, padT, 0, padT + plotH);
    fg.addColorStop(0, 'rgba(217, 196, 138, 0.14)');
    fg.addColorStop(1, 'rgba(217, 196, 138, 0.01)');
    c.fillStyle = fg;
    c.fill();

    // axis labels
    c.fillStyle = '#9c9080';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('reflectance', 12, 14);
    c.textAlign = 'right';
    c.textBaseline = 'bottom';
    c.fillText('wavelength, µm', padL + plotW, H - 8);

    c.textAlign = 'right';
    c.textBaseline = 'top';
    c.fillStyle = '#6f665b';
    c.fillText(res.mineral.label + ' · grain ' + Math.round(res.grain) + ' µm · ' + (res.weathered ? 'space-weathered' : 'fresh'), padL + plotW, 12);
    c.textAlign = 'left';
  }

  function setResultLabels(labels, values) {
    var dts = row.querySelectorAll('dt');
    var dds = row.querySelectorAll('dd');
    labels.forEach(function (l, i) { if (dts[i]) dts[i].textContent = l; });
    values.forEach(function (v, i) { if (dds[i]) dds[i].textContent = v; });
    // keep ids on dd elements for future renders
  }

  function render() {
    if (mode === 'crater') {
      var res = craterModel();
      out.impactor.textContent = Math.round(res.L) + ' m';
      out.velocity.textContent = fmt(res.v, 1) + ' km/s';
      out.angle.textContent = res.theta + '°';
      out.finalD.textContent = formatLength(res.dfinal);
      out.craterType.textContent = res.complex ? 'complex crater' : 'simple crater';
      out.chartTitle.textContent = 'Profile section · final crater';
      out.chartUnit.textContent = '0—' + formatLength(res.ejecta * 2.2);
      out.modeNote.textContent = 'pi-scaling · ' + (res.complex ? 'complex crater' : 'simple crater');
      setResultLabels(
        ['Transient diameter', 'Depth', 'Rim height', 'Ejecta radius'],
        [formatLength(res.dtc), formatLength(res.depth), formatLength(res.rim), formatLength(res.ejecta)]
      );
      drawCrater(res);
    } else {
      var sp = spectrumModel();
      out.grain.textContent = Math.round(sp.grain) + ' µm';
      var main = sp.bands.reduce(function (a, b) { return b.d > a.d ? b : a; }, sp.bands[0]);
      out.band.textContent = main.c.toFixed(2) + ' µm';
      out.bandDepth.textContent = 'depth ' + Math.round(main.d * 100) + '% of continuum';
      out.chartTitle.textContent = 'Reflectance spectrum · ' + sp.mineral.label;
      out.chartUnit.textContent = '0.4—2.5 µm';
      out.modeNote.textContent = sp.weathered ? 'MGM · space-weathered' : 'MGM · fresh surface';
      setResultLabels(
        ['Main band centre', 'Band depth', 'Albedo at 0.55 µm', 'Diagnostic'],
        [main.c.toFixed(2) + ' µm', Math.round(main.d * 100) + '%', reflectance(sp, 0.55).toFixed(2), sp.mineral.diagnostic]
      );
      drawSpectra(sp);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      mode = tab.getAttribute('data-tab');
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      document.getElementById('panelCrater').hidden = mode !== 'crater';
      document.getElementById('panelSpectra').hidden = mode !== 'spectra';
      render();
    });
  });

  ['input', 'change'].forEach(function (evt) {
    document.querySelectorAll('.instrument-controls input, .instrument-controls select').forEach(function (node) {
      node.addEventListener(evt, render);
    });
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { render(); }).observe(bench);
  } else {
    window.addEventListener('resize', render);
  }

  render();

})();
