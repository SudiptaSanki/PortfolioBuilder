// Living Materials — mycelium growth bench and specimen drawing.
(function () {
  'use strict';

  /* ---------- navigation ---------- */
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
        status.textContent = !name ? 'A name, please.' : !ok ? 'That email needs another look.' : 'Tell me a little more about the project.';
        return;
      }
      status.className = 'form-status';
      status.textContent = 'Noted. I reply within four working days, usually with questions.';
      form.reset();
    });
  }

  /* ---------- deterministic noise ---------- */
  function seeded(seed) {
    var s = seed;
    return function () {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  }

  /* ---------- hero plate: hyphae through a hurd cross-section ---------- */
  var plate = document.getElementById('network');
  if (plate) {
    var pw = 1200, ph = 420, dpr = Math.min(window.devicePixelRatio || 1, 2);
    plate.width = pw * dpr;
    plate.height = ph * dpr;
    var pc = plate.getContext('2d');
    pc.scale(dpr, dpr);
    var rnd = seeded(48271);

    pc.fillStyle = '#eae1d1';
    pc.fillRect(0, 0, pw, ph);

    // hurd chips: oblong ochre flakes with a shadow edge
    for (var i = 0; i < 340; i++) {
      var x = rnd() * pw, y = rnd() * ph;
      var w = 6 + rnd() * 26, h = 2 + rnd() * 5;
      var a = rnd() * Math.PI;
      pc.save();
      pc.translate(x, y);
      pc.rotate(a);
      pc.fillStyle = 'rgba(176,138,92,' + (0.18 + rnd() * 0.34).toFixed(3) + ')';
      pc.fillRect(-w / 2, -h / 2, w, h);
      pc.fillStyle = 'rgba(120,92,60,0.18)';
      pc.fillRect(-w / 2, h / 2 - 0.7, w, 0.8);
      pc.restore();
    }

    // hyphae: branching polylines, brighter where dense
    function branch(x, y, angle, len, width, depth) {
      if (depth <= 0 || len < 3) return;
      var steps = 5 + Math.floor(rnd() * 5);
      pc.beginPath();
      pc.moveTo(x, y);
      var cx = x, cy = y, ca = angle;
      for (var s = 0; s < steps; s++) {
        ca += (rnd() - 0.5) * 0.7;
        cx += Math.cos(ca) * (len / steps);
        cy += Math.sin(ca) * (len / steps);
        pc.lineTo(cx, cy);
        if (rnd() < 0.28) {
          branch(cx, cy, ca + (rnd() < 0.5 ? 0.9 : -0.9), len * 0.58, Math.max(0.6, width * 0.62), depth - 1);
        }
      }
      pc.strokeStyle = 'rgba(30,58,42,' + (0.5 + rnd() * 0.34).toFixed(3) + ')';
      pc.lineWidth = width;
      pc.lineCap = 'round';
      pc.stroke();
    }
    for (var b = 0; b < 34; b++) {
      var by = 30 + rnd() * (ph - 60);
      branch(rnd() * pw, by, rnd() * 0.7 - 0.35, 130 + rnd() * 240, 1.7, 5);
    }
    // a few junctions, drawn as small nodes
    for (var n = 0; n < 70; n++) {
      pc.beginPath();
      pc.arc(rnd() * pw, rnd() * ph, 0.6 + rnd() * 1.2, 0, Math.PI * 2);
      pc.fillStyle = 'rgba(38,66,50,0.55)';
      pc.fill();
    }
  }

  /* ---------- bench ---------- */
  var days = document.getElementById('days');
  if (!days) return;

  var substrateEl = document.getElementById('substrate');
  var press = document.getElementById('press');
  var moisture = document.getElementById('moisture');
  var coupon = document.getElementById('coupon');
  var cc = coupon.getContext('2d');

  var SUBSTRATES = {
    hemp: { name: 'Hemp hurd', rho: 96, days: 23, k: 1.0, tint: '#c9a273' },
    straw: { name: 'Wheat straw', rho: 104, days: 20, k: 0.94, tint: '#cdb289' },
    sawdust: { name: 'Pine sawdust', rho: 132, days: 30, k: 0.82, tint: '#b99a72' },
    hull: { name: 'Rice hull', rho: 101, days: 28, k: 0.87, tint: '#bda882' }
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fmt(n, d) { return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  function compute() {
    var key = substrateEl.value;
    var sub = SUBSTRATES[key];
    var d = Number(days.value);
    var p = Number(press.value);
    var m = Number(moisture.value);

    var moistureFactor = 1 - Math.min(0.4, Math.abs(m - 62) / 42);
    var colon = clamp(100 * Math.min(1, (d / sub.days) * moistureFactor), 0, 100);
    var density = Math.max(60, sub.rho + p * 44 - Math.max(0, m - 66) * 1.4);
    var strength = 0.2 + 0.00012 * Math.pow(density, 1.55) * Math.pow(colon / 100, 1.7) * sub.k;
    var lambda = 0.034 + 0.00007 * density + 0.004 * (1 - colon / 100);
    var carbon = density * 1.83;

    return { sub: sub, key: key, days: d, press: p, moisture: m, colon: colon, density: density, strength: strength, lambda: lambda, carbon: carbon };
  }

  function verdict(s) {
    if (s.colon < 55) return 'Not finished growing. At this colonisation the binder is patchy, and the coupon will fail at the interface rather than in the material.';
    if (s.strength >= 0.95) return 'Structural grade. This is a load-bearing panel: a floor, a stair tread, a low wall. Check creep before you trust it with a permanent load.';
    if (s.strength >= 0.55) return 'A wall lining with some structural ambition. It carries itself and a shelf, not a roof.';
    if (s.strength >= 0.35) return 'Insulation with a surface. Good at 0.05 W/m·K, indifferent in compression, excellent at being composted.';
    return 'A fragile board. Either press it harder, dry it slower, or use it where nothing will lean on it.';
  }

  function drawCoupon(s) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(240, Math.round(coupon.clientWidth || 720));
    var h = Math.round(w * (w < 420 ? 0.5 : 300 / 720));
    if (coupon.width !== w * dpr || coupon.height !== h * dpr) {
      coupon.width = w * dpr;
      coupon.height = h * dpr;
      coupon.style.height = h + 'px';
      cc.setTransform(1, 0, 0, 1, 0, 0);
      cc.scale(dpr, dpr);
    } else {
      cc.setTransform(1, 0, 0, 1, 0, 0);
      cc.scale(dpr, dpr);
    }
    cc.clearRect(0, 0, w, h);
    cc.fillStyle = '#f4efe6';
    cc.fillRect(0, 0, w, h);

    // load platens
    var left = Math.round(w * 0.13), right = w - Math.round(w * 0.13);
    var top = Math.round(h * 0.21), bottom = h - Math.round(h * 0.21);
    cc.strokeStyle = '#1b2a21';
    cc.lineWidth = 1.4;
    cc.beginPath();
    cc.moveTo(left, top - 18); cc.lineTo(right, top - 18);
    cc.moveTo(left, bottom + 18); cc.lineTo(right, bottom + 18);
    cc.stroke();
    // load arrows
    cc.strokeStyle = 'rgba(180,85,58,0.8)';
    cc.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(function (f) {
      var x = left + (right - left) * f;
      cc.beginPath(); cc.moveTo(x, 18); cc.lineTo(x, top - 22); cc.stroke();
      cc.beginPath(); cc.moveTo(x - 4, top - 28); cc.lineTo(x, top - 20); cc.lineTo(x + 4, top - 28); cc.stroke();
    });

    // panel body
    var rnd = seeded(1337 + Math.round(s.density) + Math.round(s.colon));
    cc.fillStyle = 'rgba(198,156,103,0.72)';
    cc.fillRect(left, top, right - left, bottom - top);
    // substrate flecks
    for (var i = 0; i < 420; i++) {
      var x = left + rnd() * (right - left);
      var y = top + rnd() * (bottom - top);
      var fw = 3 + rnd() * 14, fh = 1 + rnd() * 3;
      cc.fillStyle = 'rgba(' + (135 + Math.round(rnd() * 40)) + ',' + (102 + Math.round(rnd() * 30)) + ',62,' + (0.2 + rnd() * 0.3).toFixed(2) + ')';
      cc.fillRect(x, y, fw, fh);
    }
    // hyphae density scaled by colonisation
    var strands = Math.round(6 + (s.colon / 100) * 150);
    for (var k = 0; k < strands; k++) {
      var sx = left + rnd() * (right - left);
      var sy = top + rnd() * (bottom - top);
      cc.beginPath();
      cc.moveTo(sx, sy);
      var cx = sx, cy = sy, ang = rnd() * Math.PI * 2;
      for (var seg = 0; seg < 4; seg++) {
        ang += (rnd() - 0.5) * 1.4;
        cx += Math.cos(ang) * (4 + rnd() * 12);
        cy += Math.sin(ang) * (4 + rnd() * 12);
        cc.lineTo(cx, cy);
      }
      cc.strokeStyle = 'rgba(252,249,240,' + (0.25 + (s.colon / 100) * 0.55).toFixed(2) + ')';
      cc.lineWidth = 0.7;
      cc.stroke();
    }
    // vertical hairline cracks when the coupon is weak
    if (s.strength < 0.55) {
      cc.strokeStyle = 'rgba(90,72,50,0.5)';
      cc.lineWidth = 0.9;
      for (var c = 0; c < 3; c++) {
        var cx2 = left + 40 + rnd() * (right - left - 80);
        cc.beginPath();
        cc.moveTo(cx2, top);
        var cy2 = top;
        while (cy2 < bottom) {
          cy2 += 10 + rnd() * 18;
          cx2 += (rnd() - 0.5) * 7;
          cc.lineTo(cx2, cy2);
        }
        cc.stroke();
      }
    }
    // dimension line
    cc.strokeStyle = 'rgba(27,42,33,0.5)';
    cc.lineWidth = 1;
    cc.beginPath();
    cc.moveTo(left, bottom + 34); cc.lineTo(right, bottom + 34);
    cc.moveTo(left, bottom + 30); cc.lineTo(left, bottom + 38);
    cc.moveTo(right, bottom + 30); cc.lineTo(right, bottom + 38);
    cc.stroke();
    cc.fillStyle = 'rgba(43,59,49,0.8)';
    cc.font = '10px "DM Mono", monospace';
    cc.textAlign = 'center';
    cc.fillText('100 mm', (left + right) / 2, bottom + 50);
    cc.textAlign = 'left';
    cc.fillText('load', 20, 30);
  }

  function update() {
    var s = compute();
    document.getElementById('daysOut').textContent = s.days + ' days';
    document.getElementById('pressOut').textContent = fmt(s.press, 2) + ' MPa';
    document.getElementById('moistureOut').textContent = s.moisture + ' %';
    document.getElementById('rDensity').textContent = Math.round(s.density) + ' kg/m³';
    document.getElementById('rStrength').textContent = fmt(s.strength, 2) + ' MPa';
    document.getElementById('rLambda').textContent = fmt(s.lambda, 3) + ' W/m·K';
    document.getElementById('rCarbon').textContent = Math.round(s.carbon) + ' kg CO₂e/m³';
    document.getElementById('specId').textContent = 'MH-' + (200 + Math.round(s.days * 3 + s.press * 10 + s.density / 8));
    document.getElementById('specState').textContent = 'Colonised ' + Math.round(s.colon) + ' %';
    document.getElementById('specCaption').textContent = s.days + ' days · ' + fmt(s.press, 2) + ' MPa · ' + s.moisture + ' % moisture';
    document.getElementById('benchVerdict').textContent = verdict(s);
    drawCoupon(s);
  }

  ['input', 'change'].forEach(function (ev) {
    [substrateEl, days, press, moisture].forEach(function (el) {
      el.addEventListener(ev, update);
    });
  });
  update();

})();
