/* Meissner levitation bench
   Everything here is a lumped model, not a finite-element solve.
   Silent by design: no AudioContext anywhere on this site. */
(function () {
  'use strict';

  /* ---------- navigation ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- bench ---------- */
  if (document.getElementById('benchForm')) initBench();

  function initBench() {
  var bench = document.getElementById('benchForm');

  var MU0 = 4 * Math.PI * 1e-7;
  var TC = 91.4;          // K, midpoint of the current film
  var HC1_0 = 92;         // mT at 0 K
  var PUCK_AREA = 2.827e-3; // m^2, 6 cm diameter puck
  var G = 9.81;

  var el = {
    temp: document.getElementById('temp'),
    field: document.getElementById('field'),
    load: document.getElementById('load'),
    pin: document.getElementById('pin'),
    tempOut: document.getElementById('tempOut'),
    fieldOut: document.getElementById('fieldOut'),
    loadOut: document.getElementById('loadOut'),
    pinOut: document.getElementById('pinOut'),
    outGap: document.getElementById('outGap'),
    outLift: document.getElementById('outLift'),
    outMargin: document.getElementById('outMargin'),
    outJc: document.getElementById('outJc'),
    outStiff: document.getElementById('outStiff'),
    outRes: document.getElementById('outRes'),
    outRegime: document.getElementById('outRegime'),
    rigFoot: document.getElementById('rigFoot'),
    forceFoot: document.getElementById('forceFoot'),
    rig: document.getElementById('rigCanvas'),
    force: document.getElementById('forceCanvas')
  };

  var state = { T: 77, B: 60, m: 0.35, pin: 4 };

  function compute(s) {
    var t = s.T / TC;
    var normal = s.T >= TC;
    var hc1 = normal ? 0 : HC1_0 * (1 - t * t);            // mT
    var hStar = hc1 * (2.2 + 0.55 * s.pin);                 // practical screening limit, mT
    var mixedFrac = 0;
    var bEff = 0;
    if (!normal && s.B > 0) {
      if (s.B <= hc1) {
        bEff = s.B;
      } else if (s.B < hStar) {
        mixedFrac = (s.B - hc1) / (hStar - hc1);
        bEff = hc1 + 0.45 * (s.B - hc1);
      } else {
        mixedFrac = 1;
        bEff = (hc1 + 0.45 * (hStar - hc1)) * 0.38;
      }
    }
    var gain = 1 + 6 * (s.pin / 8) * (0.35 + 0.65 * mixedFrac);
    var pressure = (bEff * 1e-3) * (bEff * 1e-3) / (2 * MU0); // Pa
    var f0 = normal ? 0 : pressure * PUCK_AREA * gain;         // N at zero gap
    var lambda = 1.2 + 0.35 * s.pin;                           // mm, force decay length
    var weight = s.m * G;
    var gap = 0;
    var lift = f0;
    var contact = false;
    if (!normal && f0 > weight) {
      gap = lambda * Math.log(f0 / weight);
      lift = weight;
    } else if (!normal) {
      contact = true;
      lift = f0;
    }
    var jc0 = 6.2; // MA/cm^2 at 4 K
    var jc = normal ? 0 : jc0 * Math.pow(Math.max(0, 1 - Math.pow(t, 3)), 0.85) /
      (1 + s.B / (180 * (1 + 0.2 * s.pin)));
    var stiff = (!normal && !contact) ? (weight / (lambda * 1e-3)) : 0; // N/m
    var res = stiff > 0 ? Math.sqrt(stiff / s.m) / (2 * Math.PI) : 0;

    var regime = 'Meissner — full expulsion';
    if (normal) regime = 'Quench — normal state';
    else if (s.B >= hStar) regime = 'Flux flow — screening lost';
    else if (contact) regime = 'Contact — lift below weight';
    else if (mixedFrac > 0) regime = 'Mixed state — pinned vortices';

    return {
      t: t, hc1: hc1, hStar: hStar, bEff: bEff, mixedFrac: mixedFrac,
      f0: f0, gap: gap, lift: lift, weight: weight, jc: jc,
      stiff: stiff, res: res, regime: regime, normal: normal,
      contact: contact, lambda: lambda, margin: weight > 0 ? f0 / weight : 0
    };
  }

  function fmt(n, d) {
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /* ---------- drawing ---------- */
  function ink(ctx, colour, width) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width || 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function fitCanvas(c, aspect) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(240, c.clientWidth || 600);
    var h = Math.round(w / aspect);
    c.style.height = h + 'px';
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  function drawRig(r) {
    var c = el.rig;
    var size = fitCanvas(c, 2.05);
    var ctx = c.getContext('2d');
    var W = size.w, H = size.h;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1f2627';
    ctx.fillRect(0, 0, W, H);

    var groundY = H - 26;
    var body = groundY - 44;
    var magnetH = body * 0.28;
    var puckH = body * 0.20;
    var magnetTop = groundY - magnetH;
    var maxGapPx = body * 0.34;
    var mm = maxGapPx / 4;            // pixels per mm of gap, 4 mm full scale
    var gapPx = Math.min(maxGapPx, r.gap * mm);
    var puckW = Math.min(420, W * 0.56);
    var cx = W * 0.5;
    var puckBottom = magnetTop - gapPx;
    var puckTop = puckBottom - puckH;
    var left = cx - puckW / 2;

    function roundRect(x, y, w, h, rad) {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + w - rad, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
      ctx.lineTo(x + w, y + h - rad);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      ctx.lineTo(x + rad, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
    }

    // stage hatch
    ctx.fillStyle = '#141a1b';
    ctx.fillRect(0, groundY, W, H - groundY);
    ink(ctx, 'rgba(231,234,227,0.14)', 1);
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(W, groundY + 0.5);
    ctx.stroke();
    for (var x = -20; x < W; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 16, H);
      ctx.stroke();
    }

    // magnet stack
    var tiles = 6;
    var tw = puckW / tiles;
    ctx.fillStyle = '#20282a';
    ctx.fillRect(left, magnetTop, puckW, magnetH);
    for (var ti = 0; ti < tiles; ti++) {
      ctx.fillStyle = ti % 2 === 0 ? '#394446' : '#283133';
      ctx.fillRect(left + ti * tw + 3, magnetTop + 3, tw - 6, magnetH - 6);
    }
    ctx.fillStyle = r.normal ? '#4b5556' : '#74d6d0';
    ctx.globalAlpha = r.normal ? 0.3 : 0.5;
    for (var pi = 0; pi < tiles; pi++) {
      if (pi % 2 === 0) ctx.fillRect(left + pi * tw + 3, magnetTop, tw - 6, 4);
    }
    ctx.globalAlpha = 1;
    ink(ctx, 'rgba(231,234,227,0.22)', 1);
    ctx.strokeRect(left + 0.5, magnetTop + 0.5, puckW - 1, magnetH - 1);

    // field lines below the puck
    var fieldNorm = Math.min(1, (r.normal ? 0.35 : state.B) / 300);
    var lines = Math.max(5, Math.round(11 * fieldNorm));
    var spacing = (puckW - 48) / Math.max(1, lines - 1);
    var fluxXs = [];
    for (var i = 0; i < lines; i++) fluxXs.push(left + 24 + i * spacing);

    if (!r.normal) {
      for (var j = 0; j < fluxXs.length; j++) {
        var fx = fluxXs[j];
        if (r.mixedFrac < 0.05) {
          var side = fx < cx ? -1 : 1;
          ink(ctx, 'rgba(116,214,208,0.6)', 1.4);
          ctx.beginPath();
          ctx.moveTo(fx, magnetTop);
          ctx.bezierCurveTo(fx, magnetTop - 26, fx + 26 * side, puckTop + 20, fx + 62 * side, puckTop - 24);
          ctx.stroke();
        } else {
          ink(ctx, 'rgba(116,214,208,0.55)', 1.2);
          ctx.beginPath();
          ctx.moveTo(fx, magnetTop);
          ctx.lineTo(fx, puckTop);
          ctx.stroke();
        }
      }
    }

    // puck
    var cover = ctx.createLinearGradient(0, puckTop, 0, puckBottom);
    cover.addColorStop(0, r.normal ? '#3c4648' : '#2b6b6d');
    cover.addColorStop(1, r.normal ? '#2a3335' : '#174648');
    ctx.fillStyle = cover;
    roundRect(left, puckTop, puckW, puckH, 5);
    ctx.fill();
    ink(ctx, r.normal ? 'rgba(231,234,227,0.28)' : 'rgba(116,214,208,0.75)', 1.2);
    roundRect(left + 0.5, puckTop + 0.5, puckW - 1, puckH - 1, 5);
    ctx.stroke();
    // film layer along the underside
    ctx.fillStyle = r.normal ? 'rgba(231,234,227,0.16)' : 'rgba(116,214,208,0.45)';
    ctx.fillRect(left + 10, puckBottom - 6, puckW - 20, 2);
    // label on the puck
    ctx.fillStyle = r.normal ? 'rgba(231,234,227,0.55)' : 'rgba(231,234,227,0.8)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YBCO FILM', cx, puckTop + puckH / 2 + 4);

    // pinned flux that stops inside the film, drawn over the puck
    if (!r.normal && r.mixedFrac >= 0.05) {
      for (var k = 0; k < fluxXs.length; k++) {
        var px2 = fluxXs[k];
        var stopY = puckBottom - 8 - ((k * 9) % (puckH - 16));
        ink(ctx, 'rgba(150,235,230,0.95)', 1.6);
        ctx.beginPath();
        ctx.moveTo(px2, puckTop);
        ctx.lineTo(px2, stopY);
        ctx.stroke();
        ctx.fillStyle = '#a9ebe7';
        ctx.beginPath();
        ctx.arc(px2, stopY, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // normal-state: field passes straight through everything
    if (r.normal) {
      ink(ctx, 'rgba(151,163,160,0.3)', 1);
      ctx.setLineDash([3, 5]);
      for (var n = 0; n < fluxXs.length; n++) {
        ctx.beginPath();
        ctx.moveTo(fluxXs[n], magnetTop);
        ctx.lineTo(fluxXs[n], puckTop - 40);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // gap dimension on the right
    var dimX = left + puckW + 24;
    ink(ctx, 'rgba(231,234,227,0.35)', 1);
    ctx.beginPath();
    ctx.moveTo(dimX, magnetTop);
    ctx.lineTo(dimX, puckBottom);
    ctx.moveTo(dimX - 5, magnetTop);
    ctx.lineTo(dimX + 5, magnetTop);
    ctx.moveTo(dimX - 5, puckBottom);
    ctx.lineTo(dimX + 5, puckBottom);
    ctx.stroke();
    ctx.fillStyle = '#e7eae3';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    var gapLabel = (r.contact || r.normal) ? '0.00 mm' : fmt(r.gap, 2) + ' mm';
    ctx.fillText(gapLabel, dimX + 9, (magnetTop + puckBottom) / 2 + 4);

    // load arrow above the puck
    var arrowX = cx;
    var arrowTop = Math.max(30, puckTop - 26);
    ink(ctx, 'rgba(208,138,74,0.85)', 1.2);
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowTop);
    ctx.lineTo(arrowX, puckTop - 6);
    ctx.moveTo(arrowX - 4, puckTop - 11);
    ctx.lineTo(arrowX, puckTop - 6);
    ctx.lineTo(arrowX + 4, puckTop - 11);
    ctx.stroke();
    ctx.fillStyle = 'rgba(208,138,74,0.9)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(fmt(state.m, 2) + ' kg', arrowX + 7, arrowTop + 9);

    // scale ruler
    ink(ctx, 'rgba(151,163,160,0.4)', 1);
    var rulerX = 40;
    ctx.beginPath();
    ctx.moveTo(rulerX, magnetTop);
    ctx.lineTo(rulerX, Math.max(26, magnetTop - 4 * mm));
    ctx.stroke();
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#97a3a0';
    ctx.textAlign = 'right';
    for (var mmm = 0; mmm <= 4; mmm++) {
      var yr = magnetTop - mmm * mm;
      if (yr < 24) break;
      ctx.beginPath();
      ctx.moveTo(rulerX - 4, yr);
      ctx.lineTo(rulerX, yr);
      ctx.stroke();
      ctx.fillText(mmm + '', rulerX - 8, yr + 3);
    }
    ctx.save();
    ctx.translate(10, magnetTop - 26);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.fillText('gap / mm', 0, 0);
    ctx.restore();

    // header labels
    ctx.textAlign = 'left';
    ctx.fillStyle = '#97a3a0';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('YBCO / NdFeB · ' + fmt(state.B, 0) + ' mT applied · ' + fmt(state.T, 1) + ' K', 14, 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = r.normal ? '#d08a4a' : '#74d6d0';
    ctx.fillText(r.regime.split(' — ')[0].toUpperCase(), W - 14, 18);
  }

  function drawForce(r) {
    var c = el.force;
    var size = fitCanvas(c, 1.45);
    var ctx = c.getContext('2d');
    var W = size.w, H = size.h;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1f2627';
    ctx.fillRect(0, 0, W, H);

    var padL = 46, padR = 16, padT = 24, padB = 34;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var xMax = 8; // mm
    var yMax = Math.max(r.f0, r.weight, 1) * 1.25;

    // grid
    ink(ctx, 'rgba(231,234,227,0.1)', 1);
    for (var g = 0; g <= 4; g++) {
      var gy = padT + (plotH * g) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(W - padR, gy);
      ctx.stroke();
    }
    for (var gx = 0; gx <= 4; gx++) {
      var gxp = padL + (plotW * gx) / 4;
      ctx.beginPath();
      ctx.moveTo(gxp, padT);
      ctx.lineTo(gxp, padT + plotH);
      ctx.stroke();
    }
    // axes
    ink(ctx, 'rgba(231,234,227,0.3)', 1);
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.stroke();

    function px(mm) { return padL + (mm / xMax) * plotW; }
    function py(f) { return padT + plotH - (f / yMax) * plotH; }

    // curve
    if (!r.normal) {
      ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var gm = (i / 120) * xMax;
        var f = r.f0 * Math.exp(-gm / r.lambda);
        if (i === 0) ctx.moveTo(px(gm), py(f)); else ctx.lineTo(px(gm), py(f));
      }
      ink(ctx, '#74d6d0', 1.8);
      ctx.stroke();
    }

    // load line
    ink(ctx, 'rgba(208,138,74,0.85)', 1.2);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, py(r.weight));
    ctx.lineTo(W - padR, py(r.weight));
    ctx.stroke();
    ctx.setLineDash([]);

    // equilibrium
    if (!r.normal && !r.contact) {
      var ex = px(r.gap), ey = py(r.weight);
      ctx.fillStyle = '#74d6d0';
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e7eae3';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(fmt(r.gap, 2) + ' mm', Math.min(ex + 10, W - 70), ey - 9);
    }

    // labels
    ctx.fillStyle = '#97a3a0';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(fmt(yMax / 1.25, 1) + ' N', padL - 6, padT + 8);
    ctx.fillText('0', padL - 6, padT + plotH + 3);
    ctx.textAlign = 'center';
    ctx.fillText('0', padL, padT + plotH + 16);
    ctx.fillText('4', padL + plotW / 2, padT + plotH + 16);
    ctx.fillText(xMax + ' mm', W - padR, padT + plotH + 16);
    ctx.textAlign = 'left';
    ctx.fillText('F(g) = F₀ e^(−g/λ)', padL, padT - 8);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#d08a4a';
    ctx.fillText('load', W - padR, py(r.weight) - 6);
  }

  function update() {
    state.T = parseFloat(el.temp.value);
    state.B = parseFloat(el.field.value);
    state.m = parseFloat(el.load.value);
    state.pin = parseFloat(el.pin.value);

    el.tempOut.textContent = fmt(state.T, 1) + ' K';
    el.fieldOut.textContent = fmt(state.B, 0) + ' mT';
    el.loadOut.textContent = fmt(state.m, 2) + ' kg';
    el.pinOut.textContent = fmt(state.pin, 1) + ' vol%';

    var r = compute(state);

    el.outGap.textContent = (r.normal || r.contact) ? '0.00 mm' : fmt(r.gap, 2) + ' mm';
    el.outLift.textContent = fmt(r.lift, 2) + ' N';
    el.outMargin.textContent = r.normal ? '—' : fmt(r.margin, 2) + '×';
    el.outJc.textContent = r.jc > 0.01 ? fmt(r.jc, 2) + ' MA/cm²' : '0.00 MA/cm²';
    el.outStiff.textContent = r.stiff > 0 ? fmt(r.stiff, 0) + ' N/m' : '—';
    el.outRes.textContent = r.res > 0 ? fmt(r.res, 1) + ' Hz' : '—';
    el.outRegime.textContent = r.regime;

    if (r.normal) {
      el.rigFoot.textContent = 'Above Tc the film is normal. The field passes straight through, nothing is trapped, and the puck rests on its stops at ' + fmt(state.T, 1) + ' K.';
    } else if (r.contact) {
      el.rigFoot.textContent = 'Lift of ' + fmt(r.f0, 2) + ' N against ' + fmt(r.weight, 2) + ' N of weight. The puck sits on the stops: no gap, no stiffness.';
    } else if (r.mixedFrac < 0.05) {
      el.rigFoot.textContent = 'Meissner state at ' + fmt(state.B, 0) + ' mT, below Hc1 of ' + fmt(r.hc1, 1) + ' mT. Screening currents hold ' + fmt(r.gap, 2) + ' mm of gap, and the field bends around the film.';
    } else {
      el.rigFoot.textContent = 'Mixed state: vortices enter and stop at pinning sites. ' + fmt(r.gap, 2) + ' mm gap, ' + fmt(r.stiff, 0) + ' N/m vertical stiffness.';
    }
    el.forceFoot.textContent = (r.normal || r.contact)
      ? 'No intersection: the lift curve never rises above the load line.'
      : 'Equilibrium at ' + fmt(r.gap, 2) + ' mm, where lift equals ' + fmt(r.weight, 2) + ' N. Slope at that point is the stiffness.';

    drawRig(r);
    drawForce(r);
  }

  ['temp', 'field', 'load', 'pin'].forEach(function (k) {
    el[k].addEventListener('input', update);
  });

  var presets = {
    cryo: { T: 4.2, B: 120, m: 1.2, pin: 6 },
    ln2: { T: 77, B: 60, m: 0.35, pin: 4 },
    quench: { T: 98, B: 60, m: 0.35, pin: 4 }
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (btn) {
    btn.addEventListener('click', function () {
      var p = presets[btn.getAttribute('data-preset')];
      if (!p) return;
      el.temp.value = p.T;
      el.field.value = p.B;
      el.load.value = p.m;
      el.pin.value = p.pin;
      update();
    });
  });

  update();

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 120);
  });

  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setError(field, message) {
      var wrap = field.closest('.field') || field.closest('.check');
      if (wrap && wrap.classList.contains('field')) wrap.classList.add('invalid');
      status.textContent = message;
      status.className = 'form-status err';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      Array.prototype.forEach.call(form.querySelectorAll('.invalid'), function (n) {
        n.classList.remove('invalid');
      });
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;
      var consent = form.elements.consent;

      if (!name.value.trim() || name.value.trim().length < 2) {
        setError(name, 'Please give a name I can reply to.');
        name.focus();
        return;
      }
      if (!emailRe.test(email.value.trim())) {
        setError(email, 'That email address does not look complete. Check the part after the @.');
        email.focus();
        return;
      }
      if (message.value.trim().length < 20) {
        setError(message, 'A few more words, please: specimen, temperature, and what you need measured.');
        message.focus();
        return;
      }
      if (!consent.checked) {
        status.textContent = 'Tick the box so I know I may write back to this address.';
        status.className = 'form-status err';
        consent.focus();
        return;
      }
      status.textContent = 'Received. I answer within two working days, usually on the bench days.';
      status.className = 'form-status ok';
      form.reset();
      Array.prototype.forEach.call(form.querySelectorAll('.invalid'), function (n) {
        n.classList.remove('invalid');
      });
    });

    Array.prototype.forEach.call(form.querySelectorAll('input, textarea, select'), function (input) {
      input.addEventListener('input', function () {
        var wrap = input.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
