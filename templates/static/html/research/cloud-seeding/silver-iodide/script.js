// Silver Iodide — plume planner and cross-section.
(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Index';
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
        status.textContent = !name ? 'Name required.' : !ok ? 'Check the email address.' : 'Add the basin and the season, please.';
        return;
      }
      status.className = 'form-status';
      status.textContent = 'Received. Feasibility enquiries are answered between storms.';
      form.reset();
    });
  }

  var rate = document.getElementById('rate');
  if (!rate) return;

  var wind = document.getElementById('wind');
  var stab = document.getElementById('stability');
  var cloudT = document.getElementById('cloudT');
  var dist = document.getElementById('dist');
  var canvas = document.getElementById('plume');

  var NAMES = { B: 'B — unstable', C: 'C — slightly unstable', D: 'D — neutral', E: 'E — slightly stable', F: 'F — stable' };

  // Briggs rural dispersion coefficients
  function sigmas(cls, x) {
    // Briggs rural coefficients; x in metres, result in metres
    var sy, sz;
    switch (cls) {
      case 'B':
        sy = 0.16 * x * Math.pow(1 + 0.0001 * x, -0.5);
        sz = 0.12 * x;
        break;
      case 'C':
        sy = 0.11 * x * Math.pow(1 + 0.0001 * x, -0.5);
        sz = 0.08 * x * Math.pow(1 + 0.0002 * x, -0.5);
        break;
      case 'E':
        sy = 0.06 * x * Math.pow(1 + 0.0001 * x, -0.5);
        sz = 0.03 * x * Math.pow(1 + 0.0003 * x, -1);
        break;
      case 'F':
        sy = 0.04 * x * Math.pow(1 + 0.0001 * x, -0.5);
        sz = 0.016 * x * Math.pow(1 + 0.0003 * x, -1);
        break;
      default:
        sy = 0.08 * x * Math.pow(1 + 0.0001 * x, -0.5);
        sz = 0.06 * x * Math.pow(1 + 0.0015 * x, -0.5);
    }
    return { sy: Math.max(sy, 1), sz: Math.max(sz, 1) };
  }

  // active ice nuclei per gram of AgI, fitted to published generator tests
  function nucleiPerGram(t) {
    if (t > -4) return 0;
    var exp = 12 + 0.175 * (-t - 4);
    return Math.min(Math.pow(10, exp), 1e16);
  }

  function compute() {
    var r = Number(rate.value); // g/h
    var u = Number(wind.value);
    var cls = stab.value;
    var t = Number(cloudT.value);
    var xKm = Number(dist.value);
    var x = xKm * 1000;

    var n = nucleiPerGram(t);
    var q = (r / 3600) * n; // nuclei per second
    var s = sigmas(cls, x);
    var concM3 = q / (2 * Math.PI * u * s.sy * s.sz);
    var concL = concM3 / 1000;
    var widthKm = (4 * s.sy) / 1000;
    var areaKm2 = (10000 * 4 * s.sy) / 1e6;

    return {
      r: r, u: u, cls: cls, t: t, xKm: xKm, n: n, conc: concL,
      width: widthKm, area: areaKm2, sy: s.sy, sz: s.sz
    };
  }

  function verdictOf(d) {
    if (d.t > -4) {
      return { text: 'Too warm for silver iodide. Below about −4 °C the crystal lattice starts to template ice; above it the aerosol is a very expensive dust. Wait for colder cloud or use a different nucleant.', bad: true };
    }
    if (d.t < -21) {
      return { text: 'Cold enough that the cloud may already be glaciated. At these temperatures natural ice nuclei are plentiful and the added silver iodide changes little; the plume is arriving at a cloud that has made its own decision.', bad: true };
    }
    if (d.conc > 500) {
      return { text: 'Over-seeding. At this concentration the available supercooled water is split among too many crystals, they stay small, and they may not fall out over the target. Reduce the release rate or spread the generator line.', bad: true };
    }
    if (d.conc < 5) {
      return { text: 'The plume is too dilute at the ridge. Increase the release rate, wait for a more stable boundary layer, or move the generator line closer to the terrain.', bad: true };
    }
    if (d.u > 18) {
      return { text: 'Workable chemically, marginal operationally: at this wind the plume crosses the ridge quickly and the generators may not keep a steady flame. Expect a short seeding window.', bad: false };
    }
    return { text: 'A workable release: the plume reaches the ridge with enough active nuclei to matter, and the cloud is cold enough to hold them.', bad: false };
  }

  function draw(d) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(280, Math.round(canvas.clientWidth || 820));
    var h = Math.round(w * (w < 520 ? 0.58 : 380 / 820));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.height = h + 'px';
    }
    var g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    g.fillStyle = '#d9d3c6';
    g.fillRect(0, 0, w, h);

    var left = w < 520 ? 26 : 46, right = w - (w < 520 ? 10 : 24), ground = h - (w < 520 ? 44 : 58);
    // distance scale: 30 km across the frame, ridge at d.xKm
    var kmToX = (right - left) / 30;
    var ridgeX = left + d.xKm * kmToX;

    // cloud layer, height scaled from temperature (colder = higher base)
    var cloudBase = 120 - (d.t + 25) * 2.2;
    cloudBase = Math.max(46, Math.min(160, cloudBase));
    g.fillStyle = 'rgba(61,90,108,0.16)';
    g.fillRect(left, 24, right - left, cloudBase - 24);
    g.strokeStyle = 'rgba(61,90,108,0.45)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(left, cloudBase);
    // ragged cloud base
    for (var cx = left; cx <= right; cx += 12) {
      g.lineTo(cx, cloudBase + Math.sin(cx * 0.07) * 3 + Math.sin(cx * 0.021) * 5);
    }
    g.stroke();
    g.fillStyle = 'rgba(61,90,108,0.7)';
    g.font = '8px "Spline Sans Mono", monospace';
    g.textAlign = 'left';
    g.fillText('cloud base ' + d.t + ' °C', left + 6, cloudBase - 8);

    // terrain
    var terrain = new Path2D();
    terrain.moveTo(left, ground);
    terrain.lineTo(left + 40, ground - 4);
    terrain.bezierCurveTo(ridgeX - 120, ground - 8, ridgeX - 80, ground - 120, ridgeX, ground - 132);
    terrain.bezierCurveTo(ridgeX + 70, ground - 122, ridgeX + 130, ground - 40, right, ground - 18);
    terrain.lineTo(right, ground);
    terrain.closePath();
    g.fillStyle = '#bdb3a0';
    g.fill(terrain);
    g.strokeStyle = '#8f8778';
    g.lineWidth = 1.2;
    g.stroke(terrain);

    // everything airborne stays above the ground
    var sky = new Path2D();
    sky.rect(0, 0, w, h);
    sky.addPath(terrain);
    g.save();
    g.clip(sky, 'evenodd');
    g.fillStyle = '#6d675c';
    g.font = '8px "Spline Sans Mono", monospace';
    g.fillText('ridge ' + d.xKm + ' km', ridgeX - 24, ground - 140);

    // plume cone: narrow at the generator, widening toward the ridge
    var tipX = Math.min(ridgeX + 26, right - 6);
    var tipY = Math.min(cloudBase + 34, ground - 96);
    var halfTip = Math.min(42, 8 + d.sz / 10);
    g.beginPath();
    g.moveTo(left + 8, ground - 8);
    g.lineTo(tipX, tipY - halfTip);
    g.lineTo(tipX, tipY + halfTip);
    g.closePath();
    g.fillStyle = 'rgba(181,137,47,0.2)';
    g.fill();
    g.strokeStyle = 'rgba(166,122,34,0.8)';
    g.setLineDash([4, 4]);
    g.stroke();
    g.setLineDash([]);

    // ice crystals, density following the concentration at the ridge
    var count = Math.max(5, Math.min(120, Math.round(d.conc * 1.1)));
    for (var i = 0; i < count; i++) {
      var t = 0.12 + Math.random() * 0.86;
      var cx2 = (left + 8) + t * (tipX - (left + 8));
      var cy2 = (ground - 8) + t * (tipY - (ground - 8));
      var spread = 3 + t * halfTip * 0.9;
      var px = cx2 + (Math.random() - 0.5) * 8;
      var py = cy2 + (Math.random() - 0.5) * 2 * spread;
      g.fillStyle = 'rgba(120,86,18,0.9)';
      g.fillRect(px, py, 2, 2);
    }

    // fall streaks over the ridge
    if (d.conc > 5 && d.t <= -4) {
      g.strokeStyle = 'rgba(61,90,108,0.35)';
      for (var s = 0; s < 7; s++) {
        var sx = ridgeX - 30 + s * 9;
        g.beginPath();
        g.moveTo(sx, ground - 128 + s * 2);
        g.lineTo(sx - 4, ground - 52);
        g.stroke();
      }
    }

    g.restore();

    // ground ruler
    g.strokeStyle = 'rgba(33,31,28,0.4)';
    g.beginPath();
    g.moveTo(left, ground + 22);
    g.lineTo(right, ground + 22);
    g.stroke();
    for (var km = 0; km <= 30; km += 5) {
      var x = left + km * kmToX;
      g.beginPath();
      g.moveTo(x, ground + 18);
      g.lineTo(x, ground + 26);
      g.stroke();
      g.fillStyle = 'rgba(86,80,73,0.9)';
      g.font = '8px "Spline Sans Mono", monospace';
      g.textAlign = 'center';
      g.fillText(km + ' km', x, ground + 38);
    }

    // wind arrow
    g.strokeStyle = 'rgba(61,90,108,0.8)';
    g.beginPath();
    g.moveTo(left + 8, 14);
    g.lineTo(left + 58, 14);
    g.lineTo(left + 52, 10);
    g.moveTo(left + 58, 14);
    g.lineTo(left + 52, 18);
    g.stroke();
    g.fillStyle = 'rgba(61,90,108,0.9)';
    g.font = '8px "Spline Sans Mono", monospace';
    g.textAlign = 'left';
    g.fillText(d.u + ' m/s', left + 64, 17);
  }

  var last = { conc: 12, t: -10, xKm: 12, u: 9, sy: 640, clss: 'D' };

  function update() {
    var d = compute();
    last = d;
    document.getElementById('rateOut').textContent = d.r + ' g/h';
    document.getElementById('windOut').textContent = d.u + ' m/s';
    document.getElementById('stabilityOut').textContent = NAMES[d.cls];
    document.getElementById('cloudTOut').textContent = (d.t > 0 ? '+' : '−') + Math.abs(d.t) + ' °C';
    document.getElementById('distOut').textContent = d.xKm + ' km';

    document.getElementById('plumeNote').textContent = d.cls + ' · ' + d.u + ' m/s · ' + d.xKm + ' km';
    document.getElementById('rActive').textContent = d.t > -4 ? 'No' : 'Yes';
    document.getElementById('rConc').textContent = d.conc >= 1000
      ? Math.round(d.conc).toLocaleString('en-US') + ' L⁻¹'
      : (d.conc < 1 ? d.conc.toFixed(1) : Math.round(d.conc)) + ' L⁻¹';
    document.getElementById('rWidth').textContent = d.width.toFixed(1) + ' km';
    document.getElementById('rArea').textContent = Math.round(d.area) + ' km²';

    var v = verdictOf(d);
    var el = document.getElementById('verdict');
    el.textContent = v.text;
    el.style.borderLeftColor = v.bad ? '#9c3f2a' : '#b5892f';

    draw(d);
  }

  ['input', 'change'].forEach(function (ev) {
    [rate, wind, stab, cloudT, dist].forEach(function (el) { el.addEventListener(ev, update); });
  });
  update();

})();
