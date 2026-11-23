/* Abyssal smoker — plume mixing bench
   A box model of dilution, not a CFD solve. Silent site: no AudioContext. */
(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (document.getElementById('plumeCanvas')) initBench();

  function initBench() {
    var AMBIENT_T = 2.0;
    var AMBIENT_PH = 8.0;
    var state = { ventT: 350, h2s: 8.4, dilution: 40, oxygen: 220 };

    var el = {
      ventT: document.getElementById('ventT'),
      h2s: document.getElementById('h2s'),
      dilution: document.getElementById('dilution'),
      oxygen: document.getElementById('oxygen'),
      ventTOut: document.getElementById('ventTOut'),
      h2sOut: document.getElementById('h2sOut'),
      dilutionOut: document.getElementById('dilutionOut'),
      oxygenOut: document.getElementById('oxygenOut'),
      outT: document.getElementById('outT'),
      outH2s: document.getElementById('outH2s'),
      outPh: document.getElementById('outPh'),
      outRho: document.getElementById('outRho'),
      outEnergy: document.getElementById('outEnergy'),
      outDouble: document.getElementById('outDouble'),
      outRise: document.getElementById('outRise'),
      outDil: document.getElementById('outDil'),
      outZone: document.getElementById('outZone'),
      plumeFoot: document.getElementById('plumeFoot'),
      plume: document.getElementById('plumeCanvas'),
      curve: document.getElementById('curveCanvas')
    };

    function fmt(n, d) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
    }

    function fitCanvas(c, aspect) {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.max(240, c.clientWidth || 640);
      var h = Math.round(w / aspect);
      c.style.height = h + 'px';
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      var ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h, ctx: ctx };
    }

    function mix(s) {
      var f = Math.pow(10, s.dilution / 25);           // seawater per unit fluid
      var t = (s.ventT + f * AMBIENT_T) / (1 + f);
      var h2s = s.h2s / (1 + f);                        // mmol/kg
      var ph = Math.min(7.9, 3.1 + (AMBIENT_PH - 3.1) * (1 - 1 / (1 + f / 25)));
      var rhoAmb = 1027.8;
      var rho = 1027.8 - 0.35 * (t - AMBIENT_T) - 0.0018 * Math.pow(t - AMBIENT_T, 2);
      var drho = rhoAmb - rho;
      var o2mix = s.oxygen * f / (1 + f) / 1000;        // mmol/kg
      var limiting = Math.min(h2s, o2mix / 2);
      var energy = limiting * 0.798;                    // kJ per kg mixture
      var doubling = 9 * Math.exp(-energy / 0.28);      // hours, a proxy
      var rise = Math.min(220, 22 * Math.pow(Math.max(drho, 0.2) / 3.1, 1 / 3));
      return {
        f: f, t: t, h2s: h2s, ph: ph, drho: drho, energy: energy,
        doubling: doubling, rise: rise, o2mix: o2mix, limitedByO2: o2mix / 2 < h2s
      };
    }

    function zone(t) {
      if (t > 120) return 'Sterile fluid — no metazoan survives';
      if (t > 80) return 'Thermal edge — microbial mat only';
      if (t > 40) return 'Alvinellid tubes, Alvinella pompejana';
      if (t > 20) return 'Rimicaris shrimp swarm';
      if (t > 8) return 'Riftia tube worms and mussels';
      if (t > 3) return 'Bathymodiolus mussel bed';
      return 'Ambient seafloor — sparse, deposit feeders';
    }

    /* ---------- plume drawing ---------- */
    function tempColour(t) {
      // orange at hot, pale teal at ambient
      var k = Math.max(0, Math.min(1, (t - AMBIENT_T) / (350 - AMBIENT_T)));
      var r = Math.round(159 + (226 - 159) * k);
      var g = Math.round(196 + (112 - 196) * k);
      var b = Math.round(189 + (58 - 189) * k);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function drawPlume(r) {
      var fit = fitCanvas(el.plume, 1.55);
      var ctx = fit.ctx, W = fit.w, H = fit.h;
      ctx.fillStyle = '#0b1316';
      ctx.fillRect(0, 0, W, H);

      var groundY = H - 22;
      var chimneyH = Math.max(54, H * 0.14);
      var chimneyTop = groundY - chimneyH;
      var cx = W * 0.4;
      var plumeTop = 34;
      var maxRise = 120;

      // faint water-column rules
      ctx.strokeStyle = 'rgba(213,222,219,0.06)';
      ctx.lineWidth = 1;
      for (var gy = plumeTop; gy < groundY; gy += 28) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // depth scale on the left
      ctx.fillStyle = '#7f9793';
      ctx.font = '9px "Azeret Mono", monospace';
      ctx.textAlign = 'right';
      for (var m = 0; m <= maxRise; m += 20) {
        var yl = chimneyTop - (m / maxRise) * (chimneyTop - plumeTop);
        ctx.fillText(m + ' m', 40, yl + 3);
        ctx.strokeStyle = 'rgba(213,222,219,0.14)';
        ctx.beginPath(); ctx.moveTo(46, yl); ctx.lineTo(52, yl); ctx.stroke();
      }

      // plume: a soft cone that cools from orange at the orifice to teal above
      var decay = r.rise * 0.55 + 1;
      var topW = W * 0.115;
      var grad = ctx.createLinearGradient(0, chimneyTop, 0, plumeTop);
      grad.addColorStop(0, 'rgba(226,112,58,0.55)');
      grad.addColorStop(0.18, 'rgba(214,140,96,0.34)');
      grad.addColorStop(0.55, 'rgba(159,196,189,0.18)');
      grad.addColorStop(1, 'rgba(159,196,189,0.06)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx - 10, chimneyTop);
      ctx.bezierCurveTo(cx - 22, chimneyTop - (chimneyTop - plumeTop) * 0.35, cx - topW, chimneyTop - (chimneyTop - plumeTop) * 0.8, cx - topW * 1.08, plumeTop);
      ctx.lineTo(cx + topW * 1.08, plumeTop);
      ctx.bezierCurveTo(cx + topW, chimneyTop - (chimneyTop - plumeTop) * 0.8, cx + 22, chimneyTop - (chimneyTop - plumeTop) * 0.35, cx + 10, chimneyTop);
      ctx.closePath();
      ctx.fill();

      // detached wisps above the cone
      for (var w2 = 0; w2 < 5; w2++) {
        var kk2 = 0.72 + w2 * 0.06;
        var yw = chimneyTop - kk2 * (chimneyTop - plumeTop) - 8;
        ctx.fillStyle = 'rgba(159,196,189,' + (0.05 - w2 * 0.008).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(cx + Math.sin(w2 * 2.1) * 14, yw, topW * (0.55 - w2 * 0.08), 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // wispy edges
      ctx.strokeStyle = 'rgba(190,220,214,0.22)';
      ctx.lineWidth = 1;
      for (var e = -1; e <= 1; e += 2) {
        ctx.beginPath();
        for (var j = 0; j <= 40; j++) {
          var kk = j / 40;
          var xx = cx + e * (11 + Math.pow(kk, 0.8) * topW) + Math.sin(kk * 9 + e) * 4;
          var yy = chimneyTop - kk * (chimneyTop - plumeTop);
          if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }

      // chimney
      ctx.fillStyle = '#1a2529';
      ctx.beginPath();
      ctx.moveTo(cx - 44, groundY);
      ctx.lineTo(cx - 13, chimneyTop);
      ctx.lineTo(cx + 13, chimneyTop);
      ctx.lineTo(cx + 44, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(226,112,58,0.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(159,196,189,0.16)';
      for (var b = 0; b < 6; b++) {
        var by = chimneyTop + 5 + b * (chimneyH / 7);
        var bw = 13 + b * 4.4;
        ctx.beginPath(); ctx.moveTo(cx - bw, by); ctx.lineTo(cx + bw, by); ctx.stroke();
      }
      ctx.fillStyle = '#e2703a';
      ctx.fillRect(cx - 13, chimneyTop - 2, 26, 3);

      // seafloor
      ctx.fillStyle = '#0c1518';
      ctx.fillRect(0, groundY, W, H - groundY);
      ctx.strokeStyle = 'rgba(213,222,219,0.18)';
      ctx.beginPath(); ctx.moveTo(0, groundY + 0.5); ctx.lineTo(W, groundY + 0.5); ctx.stroke();
      ctx.fillStyle = '#131f23';
      for (var rk = 0; rk < 7; rk++) {
        var rx = (rk * 97 + 30) % W;
        if (Math.abs(rx - cx) < 60) continue;
        ctx.beginPath();
        ctx.ellipse(rx, groundY - 2, 12 + (rk % 3) * 5, 4, 0, Math.PI, 0);
        ctx.fill();
      }

      // habitat bands
      var bands = [['Sterile', 120], ['Alvinellids', 40], ['Shrimp', 20], ['Riftia', 8], ['Mussels', 3]];
      ctx.font = '9px "Azeret Mono", monospace';
      ctx.textAlign = 'left';
      for (var bi = 0; bi < bands.length; bi++) {
        var t0 = bands[bi][1];
        var frac = (t0 - AMBIENT_T) / (state.ventT - AMBIENT_T);
        if (frac <= 0.002 || frac >= 1) continue;
        var hmb = -decay * Math.log(frac);
        if (hmb < 0 || hmb > maxRise) continue;
        var yb = chimneyTop - (hmb / maxRise) * (chimneyTop - plumeTop);
        ctx.strokeStyle = 'rgba(213,222,219,0.22)';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        var kEdge = (chimneyTop - yb) / (chimneyTop - plumeTop);
        var xEdge = cx + 11 + Math.pow(Math.max(0, Math.min(1, kEdge)), 0.8) * topW + 14;
        ctx.beginPath();
        ctx.moveTo(xEdge, yb);
        ctx.lineTo(W - 92, yb);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#9fc4bd';
        ctx.fillText(bands[bi][0], W - 86, yb + 3);
        ctx.fillText(t0 + ' °C', W - 30, yb + 3);
      }

      // labels
      ctx.textAlign = 'left';
      ctx.fillStyle = '#7f9793';
      ctx.font = '9px "Azeret Mono", monospace';
      ctx.fillText('VENT FLUID → SEAWATER · 1 : ' + fmt(r.f, 0), 10, H - 6);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#e2703a';
      ctx.fillText(zone(r.t).split(' — ')[0].toUpperCase(), W - 10, 16);

      // mixing point annotation
      ctx.strokeStyle = 'rgba(226,112,58,0.7)';
      ctx.beginPath();
      ctx.moveTo(cx + 58, chimneyTop + 8);
      ctx.lineTo(cx + 120, chimneyTop + 8);
      ctx.stroke();
      ctx.fillStyle = '#e2a06a';
      ctx.textAlign = 'left';
      ctx.fillText(fmt(r.t, 1) + ' °C at 1 : ' + fmt(r.f, 0), cx + 124, chimneyTop + 11);
    }

    function drawCurve(r) {
      var fit = fitCanvas(el.curve, 1.4);
      var ctx = fit.ctx, W = fit.w, H = fit.h;
      ctx.fillStyle = '#0b1316';
      ctx.fillRect(0, 0, W, H);

      var padL = 42, padR = 12, padT = 18, padB = 28;
      var plotW = W - padL - padR, plotH = H - padT - padB;
      var tMin = 1.5, tMax = 420;

      function px(logf) { return padL + (logf / 4) * plotW; }
      function py(t) {
        var v = (Math.log10(Math.max(t, tMin)) - Math.log10(tMin)) / (Math.log10(tMax) - Math.log10(tMin));
        return padT + plotH - v * plotH;
      }

      // zone bands, keyed to temperature
      var zones = [[1.5, 3, 'rgba(159,196,189,0.05)'], [3, 8, 'rgba(159,196,189,0.10)'], [8, 20, 'rgba(159,196,189,0.16)'], [20, 40, 'rgba(226,112,58,0.08)'], [40, 420, 'rgba(226,112,58,0.15)']];
      for (var z = 0; z < zones.length; z++) {
        var y0 = py(Math.min(zones[z][1], tMax));
        var y1 = py(zones[z][0]);
        ctx.fillStyle = zones[z][2];
        ctx.fillRect(padL, y0, plotW, y1 - y0);
      }
      ctx.strokeStyle = 'rgba(213,222,219,0.10)';
      ctx.lineWidth = 1;
      [2, 10, 40, 100, 300].forEach(function (t) {
        if (t > tMax) return;
        var y = py(t);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      });

      // curve
      ctx.strokeStyle = '#9fc4bd';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (var i = 0; i <= 100; i++) {
        var logf = (i / 100) * 4;
        var f = Math.pow(10, logf);
        var t = (state.ventT + f * AMBIENT_T) / (1 + f);
        var x = px(logf), y = py(t);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // current point
      var logNow = state.dilution / 25;
      var xNow = px(logNow), yNow = py(r.t);
      ctx.fillStyle = '#e2703a';
      ctx.beginPath();
      ctx.arc(xNow, yNow, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7f9793';
      ctx.font = '8px "Azeret Mono", monospace';
      ctx.textAlign = 'right';
      [2, 10, 40, 100, 300].forEach(function (t) {
        if (t > tMax) return;
        ctx.fillText(t + '°', padL - 5, py(t) + 3);
      });
      ctx.textAlign = 'center';
      ctx.fillText('1:1', px(0), padT + plotH + 14);
      ctx.fillText('1:100', px(2), padT + plotH + 14);
      ctx.fillText('1:10k', px(4), padT + plotH + 14);
      ctx.textAlign = 'left';
      ctx.fillText('dilution · log scale', padL, padT - 6);
    }

    function update() {
      state.ventT = parseFloat(el.ventT.value);
      state.h2s = parseFloat(el.h2s.value);
      state.dilution = parseFloat(el.dilution.value);
      state.oxygen = parseFloat(el.oxygen.value);

      el.ventTOut.textContent = fmt(state.ventT, 0) + ' °C';
      el.h2sOut.textContent = fmt(state.h2s, 1) + ' mmol/kg';
      el.dilutionOut.textContent = '1 : ' + fmt(Math.pow(10, state.dilution / 25), 0);
      el.oxygenOut.textContent = fmt(state.oxygen, 0) + ' µmol/kg';

      var r = mix(state);

      el.outT.textContent = fmt(r.t, 1) + ' °C';
      el.outH2s.textContent = fmt(r.h2s, 3) + ' mmol/kg';
      el.outPh.textContent = fmt(r.ph, 2);
      el.outRho.textContent = fmt(r.drho, 1) + ' kg/m³';
      el.outEnergy.textContent = fmt(r.energy, 2) + ' kJ/kg' + (r.limitedByO2 ? ' (O₂-limited)' : '');
      el.outDouble.textContent = fmt(r.doubling, 1) + ' h';
      el.outRise.textContent = fmt(r.rise, 0) + ' m';
      el.outDil.textContent = '1 : ' + fmt(r.f, 0);
      el.outZone.textContent = zone(r.t);

      if (r.t > 120) {
        el.plumeFoot.textContent = 'At 1 : ' + fmt(r.f, 0) + ' the mixture is still ' + fmt(r.t, 0) + ' °C. Nothing lives where this fluid leaves the rock, and the animals are all at the edge of the jet.';
      } else if (r.t > 40) {
        el.plumeFoot.textContent = 'Alvinellid territory: ' + fmt(r.t, 1) + ' °C, pH ' + fmt(r.ph, 1) + '. The tubes sit in the boundary layer where the fluid is sheared against cold seawater.';
      } else {
        el.plumeFoot.textContent = 'At 1 : ' + fmt(r.f, 0) + ' the fluid has cooled to ' + fmt(r.t, 1) + ' °C and pH ' + fmt(r.ph, 1) + ', with ' + fmt(r.h2s, 2) + ' mmol/kg of sulphide left. This is the habitat: warm, sour, and still reduced.';
      }

      drawPlume(r);
      drawCurve(r);
    }

    var presets = {
      lucky: { ventT: 324, h2s: 8.4, dilution: 40, oxygen: 220 },
      rainbow: { ventT: 365, h2s: 12.6, dilution: 60, oxygen: 200 },
      diffuse: { ventT: 120, h2s: 2.0, dilution: 20, oxygen: 240 }
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (btn) {
      btn.addEventListener('click', function () {
        var p = presets[btn.getAttribute('data-preset')];
        if (!p) return;
        el.ventT.value = p.ventT;
        el.h2s.value = p.h2s;
        el.dilution.value = p.dilution;
        el.oxygen.value = p.oxygen;
        update();
      });
    });

    [el.ventT, el.h2s, el.dilution, el.oxygen].forEach(function (input) {
      input.addEventListener('input', update);
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var r = mix(state);
        drawPlume(r);
        drawCurve(r);
      }, 120);
    });

    update();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fail(field, message) {
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.add('invalid');
      status.textContent = message;
      status.className = 'form-status err';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      Array.prototype.forEach.call(form.querySelectorAll('.invalid'), function (n) { n.classList.remove('invalid'); });
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;
      var consent = form.elements.consent;

      if (!name.value.trim() || name.value.trim().length < 2) { fail(name, 'A name, please.'); name.focus(); return; }
      if (!emailRe.test(email.value.trim())) { fail(email, 'Check the address: the domain after the @ is missing or incomplete.'); email.focus(); return; }
      if (message.value.trim().length < 20) { fail(message, 'A sentence about the cruise, the field or the footage would help.'); message.focus(); return; }
      if (!consent.checked) { status.textContent = 'Tick the box so I can reply to this address.'; status.className = 'form-status err'; consent.focus(); return; }
      status.textContent = 'Received. Cruise and analysis enquiries get an answer within a week.';
      status.className = 'form-status ok';
      form.reset();
    });

    Array.prototype.forEach.call(form.querySelectorAll('input, textarea, select'), function (input) {
      input.addEventListener('input', function () {
        var wrap = input.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
