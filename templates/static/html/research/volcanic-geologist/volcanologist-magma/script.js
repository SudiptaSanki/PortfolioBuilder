/* Physical volcanologist — magma rheology and eruption column
   VFT viscosity, a solubility law and a plume scaling. Silent site. */
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

  if (document.getElementById('columnCanvas')) initBench();

  function initBench() {
    var state = { sio2: 63, temp: 1050, water: 4.5, pressure: 120, merSlider: 63 };

    var el = {
      sio2: document.getElementById('sio2'),
      temp: document.getElementById('temp'),
      water: document.getElementById('water'),
      pressure: document.getElementById('pressure'),
      mer: document.getElementById('mer'),
      sio2Out: document.getElementById('sio2Out'),
      tempOut: document.getElementById('tempOut'),
      waterOut: document.getElementById('waterOut'),
      pressureOut: document.getElementById('pressureOut'),
      merOut: document.getElementById('merOut'),
      outVisc: document.getElementById('outVisc'),
      outGas: document.getElementById('outGas'),
      outSol: document.getElementById('outSol'),
      outHeight: document.getElementById('outHeight'),
      outVol: document.getElementById('outVol'),
      outVei: document.getElementById('outVei'),
      outStyle: document.getElementById('outStyle'),
      columnFoot: document.getElementById('columnFoot'),
      viscFoot: document.getElementById('viscFoot'),
      column: document.getElementById('columnCanvas'),
      visc: document.getElementById('viscCanvas')
    };

    function fmt(n, d) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
    }

    var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    function supNum(n) {
      return String(n).split('').map(function (c) { return SUP[c] || c; }).join('');
    }
    function sci(x, d) {
      if (x === 0) return '0';
      var e = Math.floor(Math.log10(Math.abs(x)));
      var m = x / Math.pow(10, e);
      return fmt(m, d) + ' × 10' + supNum(e);
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
      return { w: w, h: h, ctx: ctx };
    }

    function vft(sio2, tempC, water) {
      var B = 5812 + (sio2 - 50) * 152;
      var C = 499 - (sio2 - 50) * 5.96;
      var tk = tempC + 273.15;
      var logDry = -4.55 + B / Math.max(60, tk - C);
      var logWet = logDry - 0.55 * water;
      return Math.max(-1, Math.min(14.5, logWet));
    }

    function solubility(sio2, pMPa) {
      return (0.30 + 0.0035 * (sio2 - 50)) * Math.sqrt(Math.max(0, pMPa));
    }

    function model(s) {
      var logEta = vft(s.sio2, s.temp, s.water);
      var eta = Math.pow(10, logEta);
      var solDeep = solubility(s.sio2, s.pressure);
      var solShallow = solubility(s.sio2, 10);
      var gas = Math.max(0, (s.water - solShallow) / Math.max(0.01, s.water));
      var mer = Math.pow(10, 3 + (s.merSlider / 100) * 6);
      var height = Math.min(43, 0.236 * Math.pow(mer, 0.25) * (1 + 0.85 * gas));
      var volume = mer * 9 * 3600 / 1200;             // 9-hour eruption, bulk deposit m³
      var vei = volume < 1e4 ? 0 : volume < 1e6 ? 1 : volume < 1e7 ? 2 : volume < 1e8 ? 3 :
        volume < 1e9 ? 4 : volume < 1e10 ? 5 : volume < 1e11 ? 6 : 7;
      var style;
      if (logEta > 8) style = 'Dome extrusion and collapse (Pelean)';
      else if (logEta > 6) style = gas > 0.5 ? 'Plinian column' : 'Thick lava dome, short flows';
      else if (logEta > 3.6) style = gas > 0.55 ? 'Plinian column, gas-rich' : 'Vulcanian cannon and ash column';
      else if (logEta > 1.6) style = 'Strombolian bursts';
      else style = 'Hawaiian fountains and flows';
      var satP = Math.pow(s.water / (0.30 + 0.0035 * (s.sio2 - 50)), 2);
      return {
        logEta: logEta, eta: eta, solDeep: solDeep, solShallow: solShallow, gas: gas,
        mer: mer, height: height, volume: volume, vei: vei, style: style, satP: satP
      };
    }

    function columnColour(sio2) {
      // basalt dark, rhyolite pale
      var k = Math.max(0, Math.min(1, (sio2 - 45) / 33));
      var r = Math.round(52 + (176 - 52) * k);
      var g = Math.round(45 + (168 - 45) * k);
      var b = Math.round(40 + (158 - 40) * k);
      return { fill: 'rgb(' + r + ',' + g + ',' + b + ')', hot: k < 0.4 };
    }

    function drawColumn(r) {
      var fit = fitCanvas(el.column, 1.6);
      var ctx = fit.ctx, W = fit.w, H = fit.h;
      ctx.fillStyle = '#fbf9f5';
      ctx.fillRect(0, 0, W, H);

      var maxKm = 45;
      var padL = 46, padR = 130, padT = 20, padB = 34;
      var plotW = W - padL - padR, plotH = H - padT - padB;
      var groundY = padT + plotH;
      var cx = padL + plotW * 0.4;

      function ky(km) { return groundY - (km / maxKm) * plotH; }

      // height grid
      ctx.strokeStyle = 'rgba(27,26,24,0.10)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#6f675d';
      ctx.font = '9px "Fragment Mono", monospace';
      ctx.textAlign = 'right';
      for (var km = 0; km <= 40; km += 5) {
        var y = ky(km);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
        ctx.fillText(km + ' km', padL - 6, y + 3);
      }

      var height = Math.max(0.2, Math.min(maxKm - 2, r.height));
      var col = columnColour(state.sio2);
      var topY = ky(height);

      // ground
      ctx.strokeStyle = '#1b1a18';
      ctx.beginPath(); ctx.moveTo(padL, groundY + 0.5); ctx.lineTo(padL + plotW, groundY + 0.5); ctx.stroke();
      // cone
      ctx.fillStyle = '#2a2724';
      ctx.beginPath();
      ctx.moveTo(cx - 30, groundY);
      ctx.lineTo(cx - 7, groundY - 16);
      ctx.lineTo(cx + 7, groundY - 16);
      ctx.lineTo(cx + 30, groundY);
      ctx.closePath();
      ctx.fill();

      // plume
      var baseW = 6;
      var topW = Math.min(plotW * 0.17, 15 + height * 1.7);
      ctx.fillStyle = col.fill;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(cx - baseW, groundY - 14);
      ctx.bezierCurveTo(cx - baseW - 3, groundY - (groundY - topY) * 0.2, cx - baseW - 8, groundY - (groundY - topY) * 0.55, cx - topW * 0.8, groundY - (groundY - topY) * 0.84);
      ctx.quadraticCurveTo(cx - topW * 0.95, topY + 6, cx - topW, topY);
      ctx.lineTo(cx + topW, topY);
      ctx.quadraticCurveTo(cx + topW * 0.95, topY + 6, cx + topW * 0.8, groundY - (groundY - topY) * 0.84);
      ctx.bezierCurveTo(cx + baseW + 8, groundY - (groundY - topY) * 0.55, cx + baseW + 3, groundY - (groundY - topY) * 0.2, cx + baseW, groundY - 14);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // umbrella cloud
      ctx.fillStyle = col.fill;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(cx, topY, topW * 1.7, 6 + height * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // hot fountain at the vent
      if (col.hot && height < 12) {
        ctx.fillStyle = '#b3401a';
        ctx.beginPath();
        ctx.ellipse(cx, groundY - 16, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ash fall dots
      ctx.fillStyle = 'rgba(27,26,24,0.35)';
      for (var d = 0; d < 40; d++) {
        var px = cx + (Math.sin(d * 12.9898) * 43758.5453 % 1) * plotW * 1.4 - plotW * 0.5;
        var py = groundY - (Math.abs(Math.sin(d * 4.1)) * (groundY - topY) * 0.9);
        if (px < padL || px > padL + plotW) continue;
        ctx.fillRect(px, py, 1.6, 1.6);
      }

      // neutral buoyancy label
      ctx.strokeStyle = 'rgba(27,26,24,0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      var nblX = Math.min(cx + topW * 1.8, padL + plotW - 80);
      ctx.moveTo(nblX, topY);
      ctx.lineTo(padL + plotW, topY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#1b1a18';
      ctx.textAlign = 'left';
      ctx.font = '9px "Fragment Mono", monospace';
      ctx.fillText('NBL ' + fmt(height, 1) + ' km', nblX + 4, topY - 6);

      // right-hand annotation
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6f675d';
      ctx.fillText('MER ' + sci(r.mer, 1) + ' kg/s', padL + plotW + 10, padT + 34);
      ctx.fillText('gas ' + fmt(r.gas * 100, 0) + '%', padL + plotW + 10, padT + 50);
      ctx.fillText('VEI ' + r.vei, padL + plotW + 10, padT + 66);

      // 1 km reference
      ctx.strokeStyle = '#1b1a18';
      var rx = padL + 14;
      ctx.beginPath();
      ctx.moveTo(rx, groundY);
      ctx.lineTo(rx, ky(1));
      ctx.moveTo(rx - 3, groundY); ctx.lineTo(rx + 3, groundY);
      ctx.moveTo(rx - 3, ky(1)); ctx.lineTo(rx + 3, ky(1));
      ctx.stroke();
      ctx.fillStyle = '#6f675d';
      ctx.textAlign = 'left';
      ctx.fillText('1 km', rx + 6, ky(1) + 12);
    }

    function drawVisc(r) {
      var fit = fitCanvas(el.visc, 1.42);
      var ctx = fit.ctx, W = fit.w, H = fit.h;
      ctx.fillStyle = '#fbf9f5';
      ctx.fillRect(0, 0, W, H);

      var padL = 44, padR = 12, padT = 18, padB = 30;
      var plotW = W - padL - padR, plotH = H - padT - padB;
      var tMin = 700, tMax = 1250;
      var lMin = -1, lMax = 14;

      function px(t) { return padL + ((t - tMin) / (tMax - tMin)) * plotW; }
      function py(l) { return padT + plotH - ((l - lMin) / (lMax - lMin)) * plotH; }

      // glass transition band
      ctx.fillStyle = 'rgba(179,64,26,0.10)';
      ctx.fillRect(padL, padT, plotW, py(12) - padT);
      ctx.strokeStyle = 'rgba(179,64,26,0.4)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, py(12));
      ctx.lineTo(padL + plotW, py(12));
      ctx.stroke();
      ctx.setLineDash([]);

      // grid
      ctx.strokeStyle = 'rgba(27,26,24,0.10)';
      ctx.lineWidth = 1;
      for (var l = 0; l <= 12; l += 3) {
        var y = py(l);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      }
      for (var t = 700; t <= 1250; t += 100) {
        var x = px(t);
        ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      }

      // curve
      ctx.strokeStyle = '#1b1a18';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (var i = 0; i <= 90; i++) {
        var tc = tMin + (i / 90) * (tMax - tMin);
        var lv = vft(state.sio2, tc, state.water);
        var xx = px(tc), yy = py(lv);
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();

      // current point
      ctx.fillStyle = '#b3401a';
      ctx.beginPath();
      ctx.arc(px(state.temp), py(r.logEta), 4, 0, Math.PI * 2);
      ctx.fill();

      // labels
      ctx.fillStyle = '#6f675d';
      ctx.font = '8px "Fragment Mono", monospace';
      ctx.textAlign = 'right';
      for (var l2 = 0; l2 <= 12; l2 += 3) {
        ctx.fillText('10' + supNum(l2), padL - 5, py(l2) + 3);
      }
      ctx.textAlign = 'center';
      for (var t2 = 700; t2 <= 1200; t2 += 200) {
        ctx.fillText(t2 + '°', px(t2), padT + plotH + 13);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8f3114';
      ctx.fillText('glass transition', padL + 4, py(12) - 4);
    }

    function update() {
      state.sio2 = parseFloat(el.sio2.value);
      state.temp = parseFloat(el.temp.value);
      state.water = parseFloat(el.water.value);
      state.pressure = parseFloat(el.pressure.value);
      state.merSlider = parseFloat(el.mer.value);

      el.sio2Out.textContent = fmt(state.sio2, 1) + ' wt%';
      el.tempOut.textContent = fmt(state.temp, 0) + ' °C';
      el.waterOut.textContent = fmt(state.water, 1) + ' wt%';
      el.pressureOut.textContent = fmt(state.pressure, 0) + ' MPa';
      el.merOut.textContent = sci(Math.pow(10, 3 + (state.merSlider / 100) * 6), 1) + ' kg/s';

      var r = model(state);

      el.outVisc.textContent = r.logEta >= 12 ? '10' + supNum(Math.round(r.logEta)) + ' Pa·s (solid)' : sci(r.eta, 1) + ' Pa·s';
      el.outGas.textContent = fmt(r.gas * 100, 0) + ' %';
      el.outSol.textContent = fmt(r.solDeep, 1) + ' wt% at ' + fmt(state.pressure, 0) + ' MPa';
      el.outHeight.textContent = fmt(r.height, 1) + ' km';
      el.outVol.textContent = sci(r.volume, 1) + ' m³';
      el.outVei.textContent = String(r.vei);
      el.outStyle.textContent = r.style;

      if (r.logEta >= 12) {
        el.columnFoot.textContent = 'At 10' + supNum(Math.round(r.logEta)) + ' Pa·s the melt is below the glass transition: it does not flow, it fractures, and any eruption is explosive or a dome collapse.';
      } else if (r.gas < 0.05) {
        el.columnFoot.textContent = 'Almost no gas is exsolved: the magma reaches the surface as coherent lava. Column height is set by the eruption rate alone.';
      } else {
        el.columnFoot.textContent = 'Gas fraction ' + fmt(r.gas * 100, 0) + '% at 10 MPa; column height ' + fmt(r.height, 1) + ' km from ' + sci(r.mer, 1) + ' kg/s. Neutral buoyancy level marked.';
      }
      el.viscFoot.textContent = r.logEta >= 12
        ? 'The working point sits in the glass band: 10' + supNum(Math.round(r.logEta)) + ' Pa·s, i.e. solid.'
        : 'Working point: 10' + supNum(Math.round(r.logEta)) + ' Pa·s at ' + fmt(state.temp, 0) + ' °C and ' + fmt(state.water, 1) + ' wt% water.';

      drawColumn(r);
      drawVisc(r);
    }

    var presets = {
      fagradal: { sio2: 47, temp: 1180, water: 0.8, pressure: 30, mer: 17 },
      eyja: { sio2: 58, temp: 980, water: 4.0, pressure: 100, mer: 50 },
      pinatubo: { sio2: 65, temp: 840, water: 5.5, pressure: 200, mer: 95 }
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (btn) {
      btn.addEventListener('click', function () {
        var p = presets[btn.getAttribute('data-preset')];
        if (!p) return;
        el.sio2.value = p.sio2;
        el.temp.value = p.temp;
        el.water.value = p.water;
        el.pressure.value = p.pressure;
        el.mer.value = p.mer;
        update();
      });
    });

    [el.sio2, el.temp, el.water, el.pressure, el.mer].forEach(function (input) {
      input.addEventListener('input', update);
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var r = model(state);
        drawColumn(r);
        drawVisc(r);
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
      if (!emailRe.test(email.value.trim())) { fail(email, 'The address needs a domain after the @.'); email.focus(); return; }
      if (message.value.trim().length < 20) { fail(message, 'A sentence on the sample and the question, please.'); message.focus(); return; }
      if (!consent.checked) { status.textContent = 'The consent box lets me reply to this address.'; status.className = 'form-status err'; consent.focus(); return; }
      status.textContent = 'Received. Sample enquiries get an answer within two weeks; shipping instructions follow.';
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
