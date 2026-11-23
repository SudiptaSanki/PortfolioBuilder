/* =========================================================
   Membrane Works — polarization bench
   Four-term single-cell model, V-I and power curves.
   ========================================================= */
(function () {
  'use strict';

  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  var F = 96485;
  var R = 8.314;
  var T_REF = 353.15;
  var I0_REF = 1.2e-5;
  var R_CONTACT = 0.075;

  function membraneSigma(T) {
    var lambda = 16;
    return (0.005139 * lambda - 0.00326) * Math.exp(1268 * (1 / 303.15 - 1 / T));
  }

  function cellAt(state, i) {
    var T = state.temp + 273.15;
    var pO2 = 0.21 * state.press;
    var pH2 = 0.99 * state.press;
    var Erev = 1.229 - 0.85e-3 * (T - 298.15) + 4.3085e-5 * T * (Math.log(pH2) + 0.5 * Math.log(pO2));

    var i0 = I0_REF * state.activity * Math.exp(-66000 / R * (1 / T - 1 / T_REF));
    var A = R * T / (0.55 * 2 * F);
    var act = A * Math.log(Math.max(i, 0.001) / i0);

    var tCm = state.thickness / 10000;
    var rMem = tCm / membraneSigma(T);
    var ohm = i * (rMem + R_CONTACT);

    var iLimit = 2.2 * Math.pow(state.press, 0.25);
    var ratio = Math.min(i / iLimit, 0.985);
    var conc = 0.05 * Math.log(1 / (1 - ratio));

    var cross = 0.012 * (15 / state.thickness);

    return {
      V: Math.max(Erev - act - ohm - conc - cross, 0),
      Erev: Erev, act: act, ohm: ohm, conc: conc, cross: cross,
      rMem: rMem, rTotal: rMem + R_CONTACT, i0: i0
    };
  }

  var state = { thickness: 15, temp: 80, press: 1, activity: 1, current: 1 };

  /* ---------------- chart ---------------- */
  var canvas = document.getElementById('polar');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var CW = 820, CH = 420;

  function drawChart() {
    if (!ctx) return;
    ctx.fillStyle = '#fbfbf8';
    ctx.fillRect(0, 0, CW, CH);

    var padL = 62, padR = 58, padT = 30, padB = 54;
    var w = CW - padL - padR, h = CH - padT - padB;
    var iMax = 2;

    function X(i) { return padL + (i / iMax) * w; }
    function Yv(v) { return padT + h - (v / 1.2) * h; }
    function Yp(p) { return padT + h - (p / 1.6) * h; }

    // grid
    ctx.strokeStyle = 'rgba(15,20,24,0.09)';
    ctx.lineWidth = 1;
    ctx.font = '11px "Azeret Mono", monospace';
    ctx.fillStyle = '#5a6470';
    for (var v = 0; v <= 1.2; v += 0.2) {
      var y = Yv(v);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + w, y); ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(1), padL - 8, y + 4);
    }
    for (var i = 0; i <= 2.001; i += 0.25) {
      var x = X(i);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + h); ctx.stroke();
      if (Math.abs(i * 4 - Math.round(i * 4)) < 0.001) {
        ctx.textAlign = 'center';
        ctx.fillText(i.toFixed(2), x, padT + h + 20);
      }
    }

    // axes
    ctx.strokeStyle = '#0f1418';
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + h); ctx.lineTo(padL + w, padT + h);
    ctx.stroke();

    // right axis (power)
    ctx.fillStyle = '#c2410c';
    for (var pw = 0; pw <= 1.6; pw += 0.4) {
      var yp = Yp(pw);
      ctx.textAlign = 'left';
      ctx.fillText(pw.toFixed(1), padL + w + 10, yp + 4);
    }

    // curves
    var vs = [];
    var ps = [];
    for (var ii = 0; ii <= 2; ii += 0.02) {
      var c = cellAt(state, ii);
      vs.push([ii, c.V]);
      ps.push([ii, c.V * ii]);
    }

    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ps.forEach(function (p, k) {
      var x = X(p[0]), y = Yp(Math.min(p[1], 1.6));
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = '#1f3fd0';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    vs.forEach(function (p, k) {
      var x = X(p[0]), y = Yv(p[1]);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // operating point
    var op = cellAt(state, state.current);
    var ox = X(state.current), oy = Yv(op.V);
    ctx.strokeStyle = 'rgba(15,20,24,0.55)';
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, padT); ctx.lineTo(ox, padT + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, oy); ctx.lineTo(ox, oy); ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath(); ctx.arc(ox, oy, 5.5, 0, Math.PI * 2); ctx.fillStyle = '#1f3fd0'; ctx.fill();
    ctx.beginPath(); ctx.arc(ox, oy, 10, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(31,63,208,0.45)'; ctx.stroke();

    // labels
    ctx.fillStyle = '#1f3fd0';
    ctx.textAlign = 'left';
    ctx.fillText('cell voltage, V', padL + 6, padT - 10);
    ctx.fillStyle = '#c2410c';
    ctx.textAlign = 'right';
    ctx.fillText('power, W/cm²', padL + w - 6, padT - 10);
    ctx.fillStyle = '#5a6470';
    ctx.textAlign = 'center';
    ctx.fillText('current density, A/cm²', padL + w / 2, CH - 12);

    // operating readout on chart
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f1418';
    var lx = ox + 14;
    if (lx > CW - 150) lx = ox - 14;
    ctx.fillText((op.V).toFixed(3) + ' V', lx, oy - 10);
    ctx.fillStyle = '#5a6470';
    ctx.fillText((op.V * state.current).toFixed(2) + ' W/cm²', lx, oy + 6);
  }

  /* ---------------- readouts ---------------- */
  var el = {
    thickness: document.getElementById('thickness'),
    thicknessOut: document.getElementById('thicknessOut'),
    thickHint: document.getElementById('thickHint'),
    temp: document.getElementById('temp'),
    tempOut: document.getElementById('tempOut'),
    press: document.getElementById('press'),
    pressOut: document.getElementById('pressOut'),
    activity: document.getElementById('activity'),
    activityOut: document.getElementById('activityOut'),
    current: document.getElementById('current'),
    currentOut: document.getElementById('currentOut'),
    V: document.getElementById('roV'),
    P: document.getElementById('roP'),
    eff: document.getElementById('roEff'),
    r: document.getElementById('roR'),
    cells: document.getElementById('roCells'),
    h2: document.getElementById('roH2'),
    foot: document.getElementById('benchFoot')
  };

  function update() {
    var op = cellAt(state, state.current);
    var eff = op.V / 1.254;
    var p = op.V * state.current;
    var cells = Math.ceil(100000 / (p * 300));
    var h2 = 100 / (eff * 33.3);

    if (el.thicknessOut) el.thicknessOut.textContent = state.thickness + ' µm';
    if (el.tempOut) el.tempOut.textContent = state.temp + ' °C';
    if (el.pressOut) el.pressOut.textContent = state.press.toFixed(1) + ' bar';
    if (el.activityOut) el.activityOut.textContent = state.activity.toFixed(1) + ' ×';
    if (el.currentOut) el.currentOut.textContent = state.current.toFixed(2) + ' A/cm²';
    if (el.thickHint) {
      el.thickHint.textContent = state.thickness < 20
        ? 'Thin membrane: low ohmic loss, but hydrogen crossover costs ' + (op.cross * 1000).toFixed(0) + ' mV.'
        : (state.thickness > 100
          ? 'Thick membrane: robust and low crossover, but ' + (op.ohm * 1000).toFixed(0) + ' mV lost to resistance at this current.'
          : 'Reinforced PFSA: the usual compromise between resistance and crossover.');
    }

    if (el.V) el.V.innerHTML = op.V.toFixed(3) + '<small>V</small>';
    if (el.P) el.P.innerHTML = p.toFixed(2) + '<small>W/cm²</small>';
    if (el.eff) el.eff.innerHTML = Math.round(eff * 100) + '<small>%</small>';
    if (el.r) el.r.innerHTML = op.rTotal.toFixed(3) + '<small>Ω·cm²</small>';
    if (el.cells) el.cells.innerHTML = cells.toLocaleString('en-US') + '<small>× 300 cm²</small>';
    if (el.h2) el.h2.innerHTML = h2.toFixed(1) + '<small>kg/h</small>';

    if (el.foot) {
      var heat = 100 * (1 - eff) / eff;
      el.foot.textContent = 'Operating point ' + state.current.toFixed(2) + ' A/cm² at ' + state.temp + ' °C on a ' +
        state.thickness + ' µm membrane: ' + op.V.toFixed(2) + ' V per cell, ' + Math.round(eff * 100) +
        '% on LHV. Heat to reject ' + Math.round(heat) + ' kW per 100 kW gross. Losses: activation ' +
        (op.act * 1000).toFixed(0) + ' mV, ohmic ' + (op.ohm * 1000).toFixed(0) + ' mV, transport ' +
        (op.conc * 1000).toFixed(0) + ' mV, crossover ' + (op.cross * 1000).toFixed(0) + ' mV.';
    }

    drawChart();
  }

  function bind(input, key) {
    if (!input) return;
    input.addEventListener('input', function () {
      state[key] = parseFloat(input.value);
      update();
    });
  }
  bind(el.thickness, 'thickness');
  bind(el.temp, 'temp');
  bind(el.press, 'press');
  bind(el.activity, 'activity');
  bind(el.current, 'current');

  update();

  /* ---------------- stack filter ---------------- */
  var fbtns = Array.prototype.slice.call(document.querySelectorAll('.fbtn'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.stack'));
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
        if (filterCount) filterCount.textContent = n + (n === 1 ? ' stack shown' : ' stacks shown');
      });
    });
  }

  /* ---------------- specification request ---------------- */
  var form = document.getElementById('stackForm');
  var result = document.getElementById('stackResult');
  var preview = document.getElementById('stackPreview');
  var send = document.getElementById('stackSend');
  var edit = document.getElementById('stackEdit');

  function val(id) { var n = document.getElementById(id); return n ? n.value.trim() : ''; }
  function flag(id, on) { var n = document.getElementById(id); if (n) n.hidden = !on; }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = val('name'), email = val('email'), power = val('power'), duty = val('duty'), msg = val('message');
      var consent = document.getElementById('consent').checked;
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      flag('err-name', !name);
      flag('err-email', !ok);
      flag('err-power', !power);
      flag('err-duty', !duty);
      flag('err-message', !msg);
      flag('err-consent', !consent);
      if (!name || !ok || !power || !duty || !msg || !consent) {
        var first = !name ? 'name' : (!ok ? 'email' : (!power ? 'power' : (!duty ? 'duty' : (!msg ? 'message' : 'consent'))));
        var target = document.getElementById(first);
        if (target && target.focus) target.focus();
        if (result) result.hidden = true;
        return;
      }

      var org = val('org'), sector = val('sector');
      var text = 'Stack specification request\n\n' +
        'Name: ' + name + '\n' +
        (org ? 'Organisation: ' + org + '\n' : '') +
        'Email: ' + email + '\n' +
        'Sector: ' + sector + '\n' +
        'Net power: ' + power + ' kW\n' +
        'Duty: ' + duty + '\n\n' +
        'Requirements:\n' + msg + '\n\n' +
        'Sent from the Membrane Works specification form.';
      if (preview) preview.textContent = text;
      if (send) send.setAttribute('href', 'mailto:stacks@membraneworks.example?subject=' + encodeURIComponent('Stack specification — ' + (org || name)) + '&body=' + encodeURIComponent(text));
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
