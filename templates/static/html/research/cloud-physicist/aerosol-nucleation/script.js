// Aerosol Nucleation — cloud field plate and kappa-Köhler bench.
(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      if (!name || !ok || message.length < 12) {
        status.className = 'form-status err';
        status.textContent = !name ? 'Please add a name.' : !ok ? 'That address looks incomplete.' : 'A sentence about the campaign or the data, please.';
        return;
      }
      status.className = 'form-status';
      status.textContent = 'Noted. I answer on Thursdays.';
      form.reset();
    });
  }

  /* ---------- deterministic field of droplets ---------- */
  var field = document.getElementById('cloudfield');
  if (field) {
    var fdpr = Math.min(window.devicePixelRatio || 1, 2);

    function seeded(seed) {
      var s = seed;
      return function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
    }

    function drawField() {
      var w = Math.max(260, Math.round(field.clientWidth || 1200));
      var h = Math.round(w * (w < 520 ? 0.44 : 380 / 1200));
      field.width = w * fdpr;
      field.height = h * fdpr;
      field.style.height = h + 'px';
      var f = field.getContext('2d');
      f.setTransform(fdpr, 0, 0, fdpr, 0, 0);

      f.fillStyle = '#eef3f5';
      f.fillRect(0, 0, w, h);

      // horizon and the ridge behind it
      f.strokeStyle = 'rgba(31,88,118,0.3)';
      f.lineWidth = 1;
      f.beginPath();
      f.moveTo(0, h - 54);
      f.bezierCurveTo(220, h - 92, 380, h - 34, 560, h - 58);
      f.bezierCurveTo(740, h - 82, 900, h - 40, 1200, h - 66);
      f.stroke();
      f.strokeStyle = 'rgba(31,88,118,0.16)';
      f.beginPath();
      f.moveTo(0, h - 24);
      f.lineTo(w, h - 24);
      f.stroke();

      var rnd = seeded(7919);

      function droplet(cx, cy, r, alpha) {
        f.beginPath();
        var steps = 22;
        for (var i = 0; i <= steps; i++) {
          var a = (i / steps) * Math.PI * 2;
          var wob = 1 + Math.sin(a * 3 + cx) * 0.035 + Math.cos(a * 5 + cy) * 0.02;
          var x = cx + Math.cos(a) * r * wob;
          var y = cy + Math.sin(a) * r * wob;
          if (i === 0) f.moveTo(x, y); else f.lineTo(x, y);
        }
        f.closePath();
        f.fillStyle = 'rgba(255,255,255,' + Math.min(1, alpha * 1.3).toFixed(3) + ')';
        f.fill();
        f.strokeStyle = 'rgba(31,88,118,' + Math.min(0.8, alpha * 1.6).toFixed(3) + ')';
        f.lineWidth = 1;
        f.stroke();
        f.beginPath();
        f.arc(cx, cy, r * 0.74, Math.PI * 1.06, Math.PI * 1.44);
        f.strokeStyle = 'rgba(255,255,255,0.95)';
        f.lineWidth = 0.9;
        f.stroke();
      }

      var scale = w / 1200;
      var maxR = 34 * scale;
      for (var i = 0; i < 210; i++) {
        var x = rnd() * w;
        var y = 30 * scale + rnd() * (h - 100 * scale);
        var depth = (y - 30 * scale) / Math.max(1, h - 100 * scale);
        var r = (3 + rnd() * 7 + depth * depth * 14) * scale;
        if (rnd() < 0.06) r *= 1.8;
        droplet(x, y, Math.max(1.1, r), 0.32 + rnd() * 0.3);
      }
      droplet(w * 0.25, h * 0.55, Math.max(6, maxR * 0.8), 0.6);
      droplet(w * 0.69, h * 0.4, Math.max(4, maxR * 0.5), 0.55);

      // scale bar
      var barY = h - 12;
      f.strokeStyle = 'rgba(31,88,118,0.7)';
      f.beginPath();
      f.moveTo(20, barY); f.lineTo(20 + 100 * scale, barY);
      f.moveTo(20, barY - 4); f.lineTo(20, barY + 4);
      f.moveTo(20 + 100 * scale, barY - 4); f.lineTo(20 + 100 * scale, barY + 4);
      f.stroke();
      f.fillStyle = 'rgba(31,88,118,0.8)';
      f.font = '9px "Fragment Mono", monospace';
      f.textAlign = 'left';
      f.fillText('50 µm', 20, barY - 8);
    }

    drawField();
    var fTimer;
    window.addEventListener('resize', function () {
      clearTimeout(fTimer);
      fTimer = setTimeout(drawField, 140);
    });
  }

  /* ---------- Köhler bench ---------- */
  var dry = document.getElementById('dry');
  if (!dry) return;

  var kappa = document.getElementById('kappa');
  var temp = document.getElementById('temp');
  var amb = document.getElementById('ambient');
  var plot = document.getElementById('kohler');

  var MW = 0.018, R = 8.314, RHO = 997;

  function kohler(d, k, D) {
    // d, D in metres
    var d3 = Math.pow(d, 3);
    var D3 = Math.pow(D, 3);
    var act = (D3 - d3) / (D3 - d3 * (1 - k));
    return act;
  }

  function compute() {
    var dNm = Number(dry.value);
    var k = Number(kappa.value);
    var tC = Number(temp.value);
    var ambPct = Number(amb.value);
    var T = tC + 273.15;
    var sigma = 0.0756 - 0.00014 * tC; // N/m, linear approximation
    var A = (4 * sigma * MW) / (R * T * RHO);
    var d = dNm * 1e-9;

    // scan for the critical point
    var Sc = 0, Dc = d;
    var pts = [];
    var minD = Math.max(d * 1.0005, 1e-9);
    var maxD = Math.max(d * 400, 3e-6);
    var steps = 900;
    var lmin = Math.log(minD), lmax = Math.log(maxD);
    for (var i = 0; i <= steps; i++) {
      var D = Math.exp(lmin + (i / steps) * (lmax - lmin));
      var S = kohler(d, k, D) * Math.exp(A / D);
      pts.push([D, S]);
      if (S > Sc) { Sc = S; Dc = D; }
    }

    var Samb = 1 + ambPct / 100;
    var activates = Samb > Sc;
    var dropD = 0;
    if (activates) {
      // first crossing on the growth branch beyond the critical diameter
      for (var j = 0; j < pts.length; j++) {
        if (pts[j][0] > Dc && pts[j][1] <= Samb) { dropD = pts[j][0]; break; }
      }
      if (!dropD) dropD = maxD;
    } else {
      // stable haze droplet: crossing before the peak
      for (var m = 0; m < pts.length; m++) {
        if (pts[m][1] >= Samb) { dropD = pts[m][0]; break; }
      }
    }

    return {
      d: d, dNm: dNm, k: k, tC: tC, ambPct: ambPct,
      Sc: Sc, Dc: Dc, Samb: Samb, activates: activates, dropD: dropD, pts: pts
    };
  }

  function fmt(n, digits) {
    return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function draw(r) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(300, Math.round(plot.clientWidth || 760));
    var h = Math.round(w * (w < 520 ? 0.72 : 460 / 760));
    if (plot.width !== w * dpr || plot.height !== h * dpr) {
      plot.width = w * dpr;
      plot.height = h * dpr;
      plot.style.height = h + 'px';
    }
    var g = plot.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    var left = w < 520 ? 44 : 62;
    var right = w - (w < 520 ? 14 : 28);
    var top = 24, bottom = h - (w < 520 ? 44 : 54);

    var scPct = (r.Sc - 1) * 100;
    var yMax = Math.max(0.6, scPct * 1.45, r.ambPct * 1.35);
    var yMin = -0.12;

    function X(D) {
      var lo = Math.log10(r.d * 1000 * 0.9), hi = Math.log10(Math.max(20, r.Dc * 1e6 * 20));
      var t = (Math.log10(D * 1e6) - lo) / (hi - lo);
      return left + Math.max(0, Math.min(1, t)) * (right - left);
    }
    function Y(pct) {
      var t = (pct - yMin) / (yMax - yMin);
      return bottom - t * (bottom - top);
    }

    // grid
    g.strokeStyle = 'rgba(31,88,118,0.10)';
    g.lineWidth = 1;
    var yTicks = 5;
    for (var i = 0; i <= yTicks; i++) {
      var pct = yMin + (i / yTicks) * (yMax - yMin);
      var y = Y(pct);
      g.beginPath(); g.moveTo(left, y); g.lineTo(right, y); g.stroke();
      g.fillStyle = 'rgba(76,98,110,0.9)';
      g.font = '9px "Fragment Mono", monospace';
      g.textAlign = 'right';
      g.fillText(pct.toFixed(2), left - 8, y + 3);
    }
    var xTicks = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30];
    xTicks.forEach(function (um) {
      var x = X(um * 1e-6);
      if (x < left || x > right) return;
      g.strokeStyle = 'rgba(31,88,118,0.08)';
      g.beginPath(); g.moveTo(x, top); g.lineTo(x, bottom); g.stroke();
      g.fillStyle = 'rgba(76,98,110,0.85)';
      g.font = '8.5px "Fragment Mono", monospace';
      g.textAlign = 'center';
      g.fillText(String(um), x, bottom + 14);
    });

    // axes
    g.strokeStyle = 'rgba(22,37,45,0.6)';
    g.beginPath();
    g.moveTo(left, top); g.lineTo(left, bottom); g.lineTo(right, bottom);
    g.stroke();

    g.fillStyle = 'rgba(76,98,110,0.9)';
    g.font = '9px "Fragment Mono", monospace';
    g.textAlign = 'right';
    g.fillText('S − 1 (%)', left - 8, top - 8);
    g.textAlign = 'center';
    g.fillText('wet diameter (µm)', (left + right) / 2, h - 8);

    // ambient supersaturation line
    var ya = Y(r.ambPct);
    g.strokeStyle = 'rgba(168,65,44,0.55)';
    g.setLineDash([4, 4]);
    g.beginPath();
    g.moveTo(left, ya); g.lineTo(right, ya);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = 'rgba(168,65,44,0.85)';
    g.textAlign = 'right';
    g.font = '9px "Fragment Mono", monospace';
    g.fillText('cloud S ' + fmt(r.ambPct, 2) + ' %', right - 2, ya - 6);

    // curve
    g.beginPath();
    var started = false;
    for (var p = 0; p < r.pts.length; p++) {
      var D = r.pts[p][0], S = r.pts[p][1];
      var x2 = X(D), y2 = Y((S - 1) * 100);
      if (D * 1e6 < 0.005) continue;
      if (!started) { g.moveTo(x2, y2); started = true; }
      else g.lineTo(x2, y2);
    }
    g.strokeStyle = '#1f5876';
    g.lineWidth = 1.8;
    g.stroke();

    // area under the growth branch
    g.lineTo(X(r.pts[r.pts.length - 1][0]), bottom);
    g.lineTo(X(r.pts[0][0]), bottom);
    g.closePath();
    g.fillStyle = 'rgba(31,88,118,0.05)';
    g.fill();

    // critical point
    var cx = X(r.Dc), cy = Y(scPct);
    g.beginPath();
    g.arc(cx, cy, 3.2, 0, Math.PI * 2);
    g.fillStyle = '#1f5876';
    g.fill();
    g.strokeStyle = 'rgba(31,88,118,0.4)';
    g.setLineDash([2, 3]);
    g.beginPath();
    g.moveTo(cx, cy); g.lineTo(cx, bottom);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#1f5876';
    g.font = '9px "Fragment Mono", monospace';
    g.textAlign = cx > right - 90 ? 'right' : 'left';
    g.fillText('critical', cx + (cx > right - 90 ? -8 : 8), cy - 8);

    // the droplet at cloud S
    if (r.activates) {
      var xd = X(r.dropD), yd = Y(r.ambPct);
      g.beginPath();
      g.arc(xd, yd, 3, 0, Math.PI * 2);
      g.fillStyle = '#a8412c';
      g.fill();
      g.textAlign = 'left';
      g.fillText('droplet', xd + 6, yd + 12);
    } else {
      g.fillStyle = 'rgba(168,65,44,0.9)';
      g.textAlign = 'left';
      g.fillText('stays haze', left + 10, top + 14);
    }
  }

  function update() {
    var r = compute();
    document.getElementById('dryOut').textContent = r.dNm + ' nm';
    document.getElementById('kappaOut').textContent = fmt(r.k, 2);
    document.getElementById('tempOut').textContent = (r.tC > 0 ? '+' : '') + r.tC + ' °C';
    document.getElementById('ambientOut').textContent = fmt(r.ambPct, 2) + ' %';

    document.getElementById('rSc').textContent = fmt((r.Sc - 1) * 100, 2) + ' %';
    document.getElementById('rDc').textContent = fmt(r.Dc * 1e6, 2) + ' µm';
    var state = document.getElementById('rState');
    state.textContent = r.activates ? 'Activates' : 'Stays haze';
    state.style.color = r.activates ? '#1f5876' : '#a8412c';
    document.getElementById('rDrop').textContent = r.activates
      ? fmt(r.dropD * 1e6, 1) + ' µm'
      : fmt(r.dropD * 1e6, 2) + ' µm haze';

    document.getElementById('plotNote').textContent = r.activates ? 'activated branch' : 'below activation';
    draw(r);
  }

  ['input', 'change'].forEach(function (ev) {
    [dry, kappa, temp, amb].forEach(function (el) { el.addEventListener(ev, update); });
  });
  update();

})();
