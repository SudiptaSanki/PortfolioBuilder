/* =========================================================
   Carbon Lattice — process window model
   Arrhenius growth fit, sp² / Raman estimate, phase map.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- nav ---------------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------------- growth model ---------------- */
  var EA = 32000;      // J/mol, fitted
  var R = 8.314;
  var T_REF = 1173.15; // 900 °C
  var RATE_REF = 4.0;  // µm/h

  function regime(tC, c) {
    if (tC < 700) return 'none';
    if (c > 5.2) return 'sp2';
    if (tC > 1150) return 'graphitic';
    if (tC < 790) return 'nano';
    if (tC >= 1000 && c <= 1.6) return 'single';
    return 'micro';
  }

  function grow(state) {
    var T = state.temp + 273.15;
    var arr = Math.exp(-EA / (R * T)) / Math.exp(-EA / (R * T_REF));
    var ratio = state.methane / 2.5;
    var g = ratio * Math.exp(1 - ratio);
    var pf = Math.pow(state.power / 3, 0.8);
    var press = Math.exp(-Math.pow(Math.log(state.pressure / 100), 2) / (2 * 0.38 * 0.38));
    var rate = RATE_REF * arr * g * pf * press;
    if (state.temp < 700) rate *= Math.max(0, (state.temp - 600) / 100) * 0.35;
    if (state.temp > 1180) rate *= 0.55;

    var sp2 = 0.32 * Math.pow(state.methane, 1.45);
    if (state.temp < 780) sp2 += (780 - state.temp) / 55;
    if (state.temp > 1120) sp2 += (state.temp - 1120) / 40;

    var fwhm = 2.2 + 0.75 * Math.pow(state.methane, 1.15) + (state.temp < 800 ? 0.8 : 0);
    var kappa = 2200 - 52 * sp2 - 42 * (fwhm - 2.2);
    if (regime(state.temp, state.methane) === 'none') kappa = 0;
    if (state.temp > 1150) kappa = Math.min(kappa, 1400);

    return { rate: Math.max(rate, 0), sp2: Math.max(sp2, 0), fwhm: fwhm, kappa: Math.max(kappa, 0), regime: regime(state.temp, state.methane) };
  }

  var TEXTURE = {
    none: 'No growth<br>polymer deposit',
    nano: 'Nanocrystalline<br>20–80 nm',
    micro: 'Microcrystalline<br>columnar',
    single: 'Single crystal<br>step-flow',
    sp2: 'sp²-rich<br>graphite inclusions',
    graphitic: 'Graphitic<br>poor adhesion'
  };

  var state = { temp: 900, methane: 2, power: 3, pressure: 100 };

  /* ---------------- phase map ---------------- */
  var canvas = document.getElementById('phaseMap');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var MW = 760, MH = 360;

  function T_X(t) { return 64 + ((t - 650) / 600) * (MW - 64 - 16); }
  function C_Y(c) { return MH - 34 - (c / 10) * (MH - 34 - 16); }

  function drawMap(res) {
    if (!ctx) return;
    ctx.fillStyle = '#0c0712';
    ctx.fillRect(0, 0, MW, MH);

    var step = 6;
    for (var px = 64; px < MW - 16; px += step) {
      for (var py = 16; py < MH - 34; py += step) {
        var t = 650 + ((px - 64) / (MW - 64 - 16)) * 600;
        var c = ((MH - 34 - py) / (MH - 34 - 16)) * 10;
        var r = regime(t, c);
        var col;
        if (r === 'single') col = 'rgba(120, 230, 216, 0.30)';
        else if (r === 'micro') col = 'rgba(255, 79, 163, 0.20)';
        else if (r === 'nano') col = 'rgba(165, 107, 255, 0.20)';
        else if (r === 'sp2') col = 'rgba(120, 60, 50, 0.35)';
        else if (r === 'graphitic') col = 'rgba(90, 60, 110, 0.28)';
        else col = 'rgba(40, 26, 54, 0.55)';
        ctx.fillStyle = col;
        ctx.fillRect(px, py, step, step);
      }
    }

    // grid + axes
    ctx.strokeStyle = 'rgba(222,211,234,0.12)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#8d7ea0';
    ctx.font = '10px "Spline Sans Mono", monospace';
    for (var t2 = 700; t2 <= 1200; t2 += 100) {
      var x = T_X(t2);
      ctx.beginPath(); ctx.moveTo(x, 16); ctx.lineTo(x, MH - 34); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(t2.toLocaleString('en-US'), x, MH - 18);
    }
    for (var c2 = 0; c2 <= 10; c2 += 2) {
      var y = C_Y(c2);
      ctx.beginPath(); ctx.moveTo(64, y); ctx.lineTo(MW - 16, y); ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(c2 + '%', 54, y + 3);
    }
    ctx.textAlign = 'left';
    ctx.fillText('CH₄', 20, 24);
    ctx.textAlign = 'center';
    ctx.fillText('substrate temperature, °C', (64 + MW - 16) / 2, MH - 4);

    // region labels
    ctx.font = '9px "Spline Sans Mono", monospace';
    ctx.fillStyle = 'rgba(222,211,234,0.55)';
    ctx.fillText('no growth', T_X(660), C_Y(6));
    ctx.fillStyle = 'rgba(190,170,215,0.8)';
    ctx.fillText('nanocrystalline', T_X(720), C_Y(8.6));
    ctx.fillStyle = 'rgba(255,150,200,0.8)';
    ctx.fillText('microcrystalline', T_X(850), C_Y(3.4));
    ctx.fillStyle = 'rgba(140,240,225,0.9)';
    ctx.fillText('single crystal', T_X(1030), C_Y(1.0));
    ctx.fillStyle = 'rgba(230,160,140,0.85)';
    ctx.fillText('sp² / graphite', T_X(820), C_Y(7.2));

    // operating point
    var ox = T_X(state.temp);
    var oy = C_Y(state.methane);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, 16); ctx.lineTo(ox, MH - 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(64, oy); ctx.lineTo(MW - 16, oy); ctx.stroke();
    ctx.beginPath();
    ctx.arc(ox, oy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox, oy, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,79,163,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // label near the point
    ctx.font = '10px "Spline Sans Mono", monospace';
    ctx.fillStyle = '#ffffff';
    var lx = ox + 18;
    var align = 'left';
    if (lx > MW - 150) { lx = ox - 18; align = 'right'; }
    ctx.textAlign = align;
    ctx.fillText(res.rate.toFixed(1) + ' µm/h', lx, oy - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(state.temp + ' °C · ' + state.methane.toFixed(1) + '%', lx, oy + 12);
  }

  /* ---------------- reactor visuals ---------------- */
  var halo = document.getElementById('plasmaHalo');
  var ball = document.getElementById('plasmaBall');
  var film = document.getElementById('filmLayer');
  var capTemp = document.getElementById('capTemp');

  function paintReactor(res) {
    var size = 58 + state.power * 7;
    if (halo) {
      halo.setAttribute('r', String(58 + size * 0.6));
      halo.setAttribute('opacity', String(0.45 + Math.min(state.power / 6, 1) * 0.45));
    }
    if (ball) {
      ball.setAttribute('rx', String(size));
      ball.setAttribute('ry', String(size * 0.78));
      ball.setAttribute('opacity', String(0.22 + Math.min(res.rate / 8, 1) * 0.28));
    }
    if (film) {
      var h = 2 + Math.min(res.rate, 9) * 0.55;
      film.setAttribute('height', h.toFixed(1));
      film.setAttribute('y', (280 - h).toFixed(1));
      film.setAttribute('opacity', String(0.5 + Math.min(res.rate / 8, 1) * 0.4));
    }
    if (capTemp) capTemp.textContent = state.temp + ' °C';
  }

  /* ---------------- readouts ---------------- */
  var el = {
    temp: document.getElementById('temp'),
    tempOut: document.getElementById('tempOut'),
    methane: document.getElementById('methane'),
    methaneOut: document.getElementById('methaneOut'),
    power: document.getElementById('power'),
    powerOut: document.getElementById('powerOut'),
    pressure: document.getElementById('pressure'),
    pressureOut: document.getElementById('pressureOut'),
    rate: document.getElementById('roRate'),
    texture: document.getElementById('roTexture'),
    raman: document.getElementById('roRaman'),
    sp2: document.getElementById('roSp2'),
    kappa: document.getElementById('roKappa'),
    time: document.getElementById('roTime'),
    foot: document.getElementById('windowFoot')
  };

  function update() {
    var res = grow(state);

    if (el.tempOut) el.tempOut.textContent = state.temp + ' °C';
    if (el.methaneOut) el.methaneOut.textContent = state.methane.toFixed(1) + ' %';
    if (el.powerOut) el.powerOut.textContent = state.power.toFixed(1) + ' kW';
    if (el.pressureOut) el.pressureOut.textContent = state.pressure + ' Torr';

    if (el.rate) el.rate.innerHTML = res.rate.toFixed(1) + '<small>µm/h</small>';
    if (el.texture) el.texture.innerHTML = TEXTURE[res.regime];
    if (el.raman) el.raman.innerHTML = res.fwhm.toFixed(1) + '<small>cm⁻¹</small>';
    if (el.sp2) el.sp2.innerHTML = res.sp2.toFixed(1) + '<small>%</small>';
    if (el.kappa) el.kappa.innerHTML = Math.round(res.kappa).toLocaleString('en-US') + '<small>W/m·K</small>';
    if (el.time) {
      if (res.rate > 0.05) {
        var hrs = 300 / res.rate;
        el.time.innerHTML = Math.round(hrs).toLocaleString('en-US') + '<small>h at this rate</small>';
      } else {
        el.time.innerHTML = '—<small>no growth</small>';
      }
    }

    if (el.foot) {
      var verdict;
      if (res.regime === 'single') verdict = 'Operating point inside the device-grade window — step-flow growth on an off-axis seed.';
      else if (res.regime === 'micro') verdict = 'Usable polycrystalline window: good thermal grade, grain boundaries limit the optical and electronic use.';
      else if (res.regime === 'nano') verdict = 'Nanocrystalline regime: smooth, tough, low conductivity. Right for coatings, wrong for heat spreaders.';
      else if (res.regime === 'none') verdict = 'Below 700 °C the surface never reaches diamond growth — you will deposit a polymer-like film.';
      else if (res.regime === 'sp2') verdict = 'Too much carbon: sp² inclusions, a broad Raman line and a film that will not hold an edge.';
      else verdict = 'Graphitic regime — the hydrogen etch cannot keep up at this temperature.';
      el.foot.textContent = verdict + ' Growth ' + res.rate.toFixed(1) + ' µm/h · Raman FWHM ' + res.fwhm.toFixed(1) + ' cm⁻¹ · κ ' + Math.round(res.kappa).toLocaleString('en-US') + ' W/m·K.';
    }

    drawMap(res);
    paintReactor(res);
  }

  function bind(input, key) {
    if (!input) return;
    input.addEventListener('input', function () {
      state[key] = parseFloat(input.value);
      update();
    });
  }
  bind(el.temp, 'temp');
  bind(el.methane, 'methane');
  bind(el.power, 'power');
  bind(el.pressure, 'pressure');

  update();

  /* ---------------- growth-run filter ---------------- */
  var fbtns = Array.prototype.slice.call(document.querySelectorAll('.fbtn'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.run'));
  var filterCount = document.getElementById('filterCount');
  if (fbtns.length) {
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        fbtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var n = 0;
        cards.forEach(function (c) {
          var show = f === 'all' || c.getAttribute('data-cat') === f;
          c.classList.toggle('is-hidden', !show);
          if (show) n++;
        });
        if (filterCount) filterCount.textContent = n + (n === 1 ? ' run shown' : ' runs shown');
      });
    });
  }

  /* ---------------- run request ---------------- */
  var form = document.getElementById('runForm');
  var result = document.getElementById('runResult');
  var preview = document.getElementById('runPreview');
  var send = document.getElementById('runSend');
  var edit = document.getElementById('runEdit');

  function val(id) { var n = document.getElementById(id); return n ? n.value.trim() : ''; }
  function flag(id, on) { var n = document.getElementById(id); if (n) n.hidden = !on; }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = val('name'), email = val('email'), spec = val('spec'), size = val('size'), msg = val('message');
      var consent = document.getElementById('consent').checked;
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      flag('err-name', !name);
      flag('err-email', !ok);
      flag('err-spec', !spec);
      flag('err-size', !size);
      flag('err-message', !msg);
      flag('err-consent', !consent);
      if (!name || !ok || !spec || !size || !msg || !consent) {
        var first = !name ? 'name' : (!ok ? 'email' : (!spec ? 'spec' : (!size ? 'size' : (!msg ? 'message' : 'consent'))));
        var target = document.getElementById(first);
        if (target && target.focus) target.focus();
        if (result) result.hidden = true;
        return;
      }

      var org = val('org'), grade = val('grade');
      var text = 'Growth run enquiry\n\n' +
        'Name: ' + name + '\n' +
        (org ? 'Organisation: ' + org + '\n' : '') +
        'Email: ' + email + '\n' +
        'Grade: ' + grade + '\n' +
        'Property required: ' + spec + '\n' +
        'Size / quantity: ' + size + '\n\n' +
        'Notes:\n' + msg + '\n\n' +
        'Sent from the Carbon Lattice run request form.';
      if (preview) preview.textContent = text;
      if (send) send.setAttribute('href', 'mailto:growth@carbonlattice.example?subject=' + encodeURIComponent('Growth run — ' + (org || name)) + '&body=' + encodeURIComponent(text));
      if (result) result.hidden = false;
    });
  }

  if (edit) {
    edit.addEventListener('click', function () {
      if (result) result.hidden = true;
      var n = document.getElementById('name');
      if (n) n.focus();
    });
  }
})();
