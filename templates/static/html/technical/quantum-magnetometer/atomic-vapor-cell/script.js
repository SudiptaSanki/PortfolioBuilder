/* Ines Kovač — SERF bench model, nav, form. Silent: no audio APIs. */

(function () {
  'use strict';

  var GYRO = 6.9951;        // Hz per nanotesla, Rb-87
  var GYRO_RAD = 2 * Math.PI * GYRO;
  var READOUT = 0.004;      // effective fraction of atoms contributing to the readout
  var K_SE = 1.9e-25;       // spin-exchange broadening coefficient, s^-1 cm^6

  var state = { field: 50, temp: 168, size: 10, power: 60, buffer: 60 };

  function density(Tc) {
    var T = Tc + 273.15;
    // calibrated at 150 C (423.15 K): 4e12 cm^-3
    return 4e12 * Math.exp(-7265 * (1 / T - 1 / 423.15));
  }

  function model() {
    var n = density(state.temp);
    var vol = Math.pow(state.size / 10, 3);          // cm3
    var N = n * vol;
    var rWall = 1 / (0.012 * Math.pow(state.size / 10, 2));
    var rBuf = 0.25 * state.buffer;
    var rSe = K_SE * n * n;
    var rTot = rWall + rBuf + rSe + 0.004 * Math.pow(state.power / 60, 0.7);
    var T2 = 1 / rTot;
    var f = GYRO * state.field;
    var sens = (1 / (GYRO_RAD * Math.sqrt(Math.max(N * T2 * READOUT, 1)))) * 1e6; // nT to fT
    return { n: n, N: N, vol: vol, T2: T2, f: f, sens: sens, rSe: rSe, rTot: rTot };
  }

  /* ---------- scope drawing ---------- */

  var NS = 'http://www.w3.org/2000/svg';

  function draw(m) {
    var grid = document.getElementById('scopeGrid');
    if (!grid) return;
    var labels = document.getElementById('scopeLabels');
    grid.innerHTML = '';
    labels.innerHTML = '';

    var X0 = 48, X1 = 536, Y0 = 18, Y1 = 258;
    var mid = (Y0 + Y1) / 2;
    var tMax = Math.min(6 / m.f, 2.5 * m.T2);          // seconds
    var amp = (Y1 - Y0) * 0.42;

    // grid
    for (var i = 0; i <= 6; i++) {
      var x = X0 + (i / 6) * (X1 - X0);
      var g = document.createElementNS(NS, 'line');
      g.setAttribute('x1', x); g.setAttribute('x2', x);
      g.setAttribute('y1', Y0); g.setAttribute('y2', Y1);
      grid.appendChild(g);
      if (i % 2 === 0) {
        var tx = document.createElementNS(NS, 'text');
        tx.setAttribute('x', x); tx.setAttribute('y', Y1 + 14);
        tx.setAttribute('text-anchor', 'middle');
        tx.textContent = i === 6 ? (tMax * 1000).toFixed(0) + ' ms' : (tMax * i / 6 * 1000).toFixed(1);
        labels.appendChild(tx);
      }
    }
    [Y0, Y0 + (Y1 - Y0) / 4, mid, Y0 + 3 * (Y1 - Y0) / 4, Y1].forEach(function (y) {
      var g = document.createElementNS(NS, 'line');
      g.setAttribute('x1', X0); g.setAttribute('x2', X1);
      g.setAttribute('y1', y); g.setAttribute('y2', y);
      grid.appendChild(g);
    });

    var zero = document.getElementById('zeroLine');
    zero.setAttribute('y1', mid);
    zero.setAttribute('y2', mid);

    var path = 'M' + X0 + ',' + mid;
    var top = 'M' + X0 + ',' + (mid - amp);
    var bot = 'M' + X0 + ',' + (mid + amp);
    var steps = 420;
    for (var s = 1; s <= steps; s++) {
      var t = (s / steps) * tMax;
      var x2 = X0 + (t / tMax) * (X1 - X0);
      var env = amp * Math.exp(-t / m.T2);
      var y = mid - env * Math.cos(2 * Math.PI * m.f * t);
      path += ' L' + x2.toFixed(1) + ',' + y.toFixed(1);
      top += ' L' + x2.toFixed(1) + ',' + (mid - env).toFixed(1);
      bot += ' L' + x2.toFixed(1) + ',' + (mid + env).toFixed(1);
    }
    document.getElementById('signalPath').setAttribute('d', path);
    document.getElementById('envTop').setAttribute('d', top);
    document.getElementById('envBot').setAttribute('d', bot);

    var cap = document.getElementById('scopeCap');
    if (cap) {
      cap.textContent = state.field + ' nT applied field, ' + state.temp + ' °C cell. ' +
        'Window ' + (tMax * 1000).toFixed(1) + ' ms, ' + (tMax * m.f).toFixed(1) + ' periods inside ' +
        (tMax / m.T2).toFixed(1) + ' coherence times.';
    }
  }

  /* ---------- readouts ---------- */

  function render() {
    if (!document.getElementById('outFreq')) return;
    var m = model();
    var set = function (id, html, warn) {
      var el = document.getElementById(id);
      el.innerHTML = html;
      el.className = warn ? 'warn' : '';
    };

    set('outFreq', (m.f < 1000 ? m.f.toFixed(1) + ' Hz' : (m.f / 1000).toFixed(2) + ' kHz') +
      '<small>γ/2π = 6.9951 Hz/nT</small>');
    set('outPeriod', (1000 / m.f).toFixed(2) + ' ms<small>one precession</small>');
    set('outDensity', fmtDensity(m.n) + ' cm⁻³<small>at ' + state.temp + ' °C</small>');
    set('outT2', m.T2 > 0.1 ? (m.T2 * 1000).toFixed(0) + ' ms<small>coherence time</small>' : (m.T2 * 1000).toFixed(1) + ' ms<small>coherence time</small>', m.T2 < 0.002);
    set('outSens', m.sens.toFixed(1) + ' fT/√Hz<small>projection-noise limit, 0.4% readout</small>', m.sens > 20);
    set('outSerf', Math.round(m.rSe) + ' s⁻¹<small>' + Math.round(100 * m.rSe / m.rTot) + '% of total relaxation</small>', m.rSe > m.rTot * 0.6);

    var note = document.getElementById('benchNote');
    if (note) {
      note.textContent = 'At ' + state.temp + ' °C the cell holds ' + fmtDensity(m.N) +
        ' atoms and coheres for ' + (m.T2 * 1000).toFixed(0) + ' ms. The projection-noise limit sits at ' +
        m.sens.toFixed(1) + ' fT/√Hz with ' + state.power + ' mW of pump light, and spin-exchange collisions account for ' +
        Math.round(100 * m.rSe / m.rTot) + '% of the relaxation.';
    }
    draw(m);
  }

  function fmtDensity(n) {
    // 8.1 × 10¹² is easier to write with a superscript run than with e-notation
    var exp = Math.floor(Math.log10(n));
    var mant = n / Math.pow(10, exp);
    var sup = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
    var ex = String(exp).split('').map(function (c) { return sup[c] || c; }).join('');
    return mant.toFixed(1) + ' × 10' + ex;
  }

  /* ---------- controls ---------- */

  function bind() {
    var field = document.getElementById('field');
    if (!field) return;
    field.addEventListener('input', function () {
      state.field = +this.value;
      document.getElementById('fieldOut').textContent = state.field + ' nT';
      render();
    });
    document.getElementById('temp').addEventListener('input', function () {
      state.temp = +this.value;
      document.getElementById('tempOut').textContent = state.temp + ' °C';
      render();
    });
    document.getElementById('size').addEventListener('input', function () {
      state.size = +this.value;
      document.getElementById('sizeOut').textContent = state.size + ' mm';
      render();
    });
    document.getElementById('power').addEventListener('input', function () {
      state.power = +this.value;
      document.getElementById('powerOut').textContent = state.power + ' mW';
      render();
    });
    document.getElementById('buffer').addEventListener('input', function () {
      state.buffer = +this.value;
      document.getElementById('bufferOut').textContent = state.buffer + ' torr';
      render();
    });
  }

  function menu() {
    var btn = document.getElementById('menuBtn');
    var nav = document.getElementById('siteNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function form() {
    var f = document.getElementById('sensorForm');
    if (!f) return;
    var status = document.getElementById('formStatus');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.querySelector('#fName').value.trim();
      var email = f.querySelector('#fEmail').value.trim();
      var brief = f.querySelector('#fBrief').value.trim();
      if (!name) { status.textContent = 'A name for the reply.'; status.className = 'form-status error'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status.textContent = 'That address is missing something.'; status.className = 'form-status error'; return; }
      if (brief.length < 20) { status.textContent = 'Give me the field, the bandwidth and the environment.'; status.className = 'form-status error'; return; }
      status.className = 'form-status';
      status.textContent = 'Received, ' + name.split(' ')[0] + '. I answer within three working days with a short feasibility note or a straight no.';
      f.reset();
    });
  }

  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { render(); }, 120);
  });

  bind();
  render();
  menu();
  form();

  // swap the static bench note for the computed one on first paint
  var m0 = model();
  var n0 = document.getElementById('benchNote');
  if (n0) {
    n0.textContent = 'At ' + state.temp + ' °C the cell holds ' + fmtDensity(m0.N) + ' atoms and coheres for ' +
      (m0.T2 * 1000).toFixed(0) + ' ms. The projection-noise limit sits at ' + m0.sens.toFixed(1) +
      ' fT/√Hz with ' + state.power + ' mW of pump light.';
  }
})();
