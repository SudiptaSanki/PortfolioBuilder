/* Haddad Lab — LIF membrane bench and notebook behaviour.
   Forward Euler at 50 µs with a fixed noise seed; every figure is computed, not drawn by hand. */

(function () {
  'use strict';

  var page = document.body.getAttribute('data-page') || 'index';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.topnav a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === page + '.html') a.setAttribute('aria-current', 'page');
  });

  /* ---------------- contact form ---------------- */

  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var setErr = function (field, msg) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.err') : null;
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    };
    ['name', 'email', 'message'].forEach(function (n) {
      var f = form.elements[n];
      if (!f) return;
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') setErr(f, ''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.elements.name, email = form.elements.email, message = form.elements.message;
      if (!name.value.trim()) { setErr(name, 'Please add a name.'); ok = false; } else setErr(name, '');
      if (!emailRe.test(email.value.trim())) { setErr(email, 'An address that accepts mail.'); ok = false; } else setErr(email, '');
      if (message.value.trim().length < 12) { setErr(message, 'A sentence about the question is enough.'); ok = false; } else setErr(message, '');
      if (!ok) {
        if (status) { status.className = 'status show'; status.textContent = 'Three fields are needed before this can be sent.'; }
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      if (status) {
        status.className = 'status show ok';
        status.textContent = 'Received, ' + name.value.trim().split(/\s+/)[0] + '. I read lab mail on Wednesday mornings; if the question is about a position, mention the funding line and I will route it to the right group.';
      }
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.setAttribute('aria-invalid', 'false'); });
      form.querySelectorAll('.err').forEach(function (f) { f.textContent = ''; });
    });
  }

  if (page !== 'index') return;

  /* ---------------- model ---------------- */

  var V_REST = -70;
  var V_RESET = -72;
  var DT = 0.05;
  var STEPS = Math.round(400 / DT);

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var rnd = mulberry32(12648430);
  var gauss = function () {
    var u = Math.max(1e-9, rnd());
    var v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  var el = {
    form: document.getElementById('benchForm'),
    trace: document.getElementById('traceCanvas'),
    raster: document.getElementById('rasterCanvas'),
    stdp: document.getElementById('stdpSvg'),
    out: {
      drive: document.getElementById('driveOut'),
      res: document.getElementById('resOut'),
      tau: document.getElementById('tauOut'),
      noise: document.getElementById('noiseOut'),
      thresh: document.getElementById('threshOut'),
      refract: document.getElementById('refractOut'),
      weight: document.getElementById('weightOut'),
      dt: document.getElementById('dtOut'),
      ap: document.getElementById('apOut')
    },
    scopeTrace: document.getElementById('scopeTrace'),
    scopeRaster: document.getElementById('scopeRaster'),
    scopeDwd: document.getElementById('scopeDwd'),
    regime: document.getElementById('regimeStamp'),
    rate: document.getElementById('roRate'),
    latency: document.getElementById('roLatency'),
    cv: document.getElementById('roCv'),
    spikes: document.getElementById('roSpikes'),
    w: document.getElementById('roW'),
    verdict: document.getElementById('verdict'),
    energy: document.getElementById('energyNote')
  };
  if (!el.form || !el.trace) return;

  function readState() {
    var fd = new FormData(el.form);
    return {
      drive: parseFloat(fd.get('drive')),
      res: parseFloat(fd.get('res')),
      tau: parseFloat(fd.get('tau')),
      noise: parseFloat(fd.get('noise')),
      thresh: parseFloat(fd.get('thresh')),
      refract: parseFloat(fd.get('refract')),
      weight: parseFloat(fd.get('weight')),
      dtPair: parseFloat(fd.get('dtPair')),
      ap: parseFloat(fd.get('ap'))
    };
  }

  function simulate(s, scale, seed) {
    var local = mulberry32(seed);
    var g = function () {
      var u = Math.max(1e-9, local());
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * local());
    };
    var iEff = s.drive * (s.weight / 0.6) * scale;
    var driveTerm = iEff * s.res;
    var noiseStep = s.noise * Math.sqrt(DT / s.tau);
    var v = V_REST;
    var refracUntil = -1;
    var spikes = [];
    var trace = new Float32Array(STEPS);
    for (var i = 0; i < STEPS; i += 1) {
      var t = i * DT;
      if (t < refracUntil) {
        trace[i] = V_RESET;
        continue;
      }
      v += (-(v - V_REST) + driveTerm) * (DT / s.tau) + noiseStep * g();
      if (v >= s.thresh) {
        spikes.push(t);
        v = V_RESET;
        refracUntil = t + s.refract;
      }
      trace[i] = v;
    }
    return { trace: trace, spikes: spikes };
  }

  function metrics(spikes) {
    if (!spikes.length) return { rate: 0, latency: 0, cv: 0 };
    var isis = [];
    for (var i = 1; i < spikes.length; i += 1) isis.push(spikes[i] - spikes[i - 1]);
    var mean = isis.length ? isis.reduce(function (a, b) { return a + b; }, 0) / isis.length : 0;
    var sd = isis.length > 1
      ? Math.sqrt(isis.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (isis.length - 1))
      : 0;
    return {
      rate: spikes.length / 0.4,
      latency: spikes[0],
      cv: mean > 0 ? sd / mean : 0
    };
  }

  function stdpDelta(s) {
    var aMinus = s.ap * 1.05;
    if (s.dtPair > 0) return s.ap * Math.exp(-s.dtPair / 20);
    if (s.dtPair < 0) return -aMinus * Math.exp(s.dtPair / 20);
    return 0;
  }

  /* ---------------- drawing ---------------- */

  var tctx = el.trace.getContext('2d');
  var rctx = el.raster.getContext('2d');

  function setup(cv, ctx, ratio) {
    var w = cv.parentElement.clientWidth - 20;
    if (w < 20) return null;
    var h = Math.max(96, Math.round(w * ratio));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  var COL = { ink: '#16201f', teal: '#0f4c4a', verm: '#b4442a', grid: 'rgba(22,32,31,0.10)', muted: '#5d6a66' };

  function drawTrace(s, sim) {
    var size = setup(el.trace, tctx, 0.34);
    if (!size) return;
    var ctx = tctx, w = size.w, h = size.h;
    var padL = 32, padR = 8, padT = 8, padB = 16;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 0, w, h);

    var lo = -80, hi = -44;
    var xOf = function (t) { return padL + (t / 400) * (w - padL - padR); };
    var yOf = function (v) { return padT + ((hi - v) / (hi - lo)) * (h - padT - padB); };

    ctx.font = '400 8px "Spline Sans Mono", monospace';
    ctx.strokeStyle = COL.grid;
    ctx.lineWidth = 1;
    [-80, -70, -60, -50].forEach(function (v) {
      var y = Math.round(yOf(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillStyle = COL.muted;
      ctx.textAlign = 'right';
      ctx.fillText(String(v), padL - 4, y + 2.5);
    });
    [0, 100, 200, 300, 400].forEach(function (t) {
      var x = Math.round(xOf(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, h - padB); ctx.stroke();
      ctx.fillStyle = COL.muted;
      ctx.textAlign = t === 0 ? 'left' : t === 400 ? 'right' : 'center';
      ctx.fillText(String(t), x, h - 4);
    });

    // threshold
    var yTh = Math.round(yOf(s.thresh)) + 0.5;
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(180,68,42,0.75)';
    ctx.beginPath(); ctx.moveTo(padL, yTh); ctx.lineTo(w - padR, yTh); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(180,68,42,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('Vth ' + s.thresh, padL + 3, yTh - 3);

    // trace
    ctx.beginPath();
    for (var i = 0; i < sim.trace.length; i += 1) {
      var t = i * DT;
      var x = xOf(t);
      var y = yOf(Math.max(lo, Math.min(hi, sim.trace[i])));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = COL.teal;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // spikes
    ctx.fillStyle = COL.verm;
    sim.spikes.forEach(function (t) {
      var x = xOf(t);
      ctx.fillRect(x - 1, padT, 2, 5);
      ctx.beginPath();
      ctx.moveTo(x, padT + 5);
      ctx.lineTo(x - 3, padT + 11);
      ctx.lineTo(x + 3, padT + 11);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawRaster(pop) {
    var size = setup(el.raster, rctx, 0.62);
    if (!size) return;
    var ctx = rctx, w = size.w, h = size.h;
    var padL = 22, padR = 6, padT = 6, padB = 12;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 0, w, h);
    var rows = 16;
    var rowH = (h - padT - padB) / rows;
    var xOf = function (t) { return padL + (t / 400) * (w - padL - padR); };

    ctx.font = '400 7px "Spline Sans Mono", monospace';
    ctx.strokeStyle = COL.grid;
    for (var r = 0; r < rows; r += 1) {
      var y = Math.round(padT + r * rowH + rowH / 2) + 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    }
    [0, 200, 400].forEach(function (t) {
      var x = Math.round(xOf(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, h - padB); ctx.stroke();
      ctx.fillStyle = COL.muted;
      ctx.textAlign = t === 0 ? 'left' : t === 400 ? 'right' : 'center';
      ctx.fillText(String(t), x, h - 3);
    });

    pop.forEach(function (spikes, idx) {
      ctx.strokeStyle = idx === 0 ? COL.verm : COL.ink;
      ctx.lineWidth = 1;
      var y0 = padT + idx * rowH + rowH * 0.2;
      var y1 = padT + idx * rowH + rowH * 0.8;
      spikes.forEach(function (t) {
        var x = Math.round(xOf(t)) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      });
    });
  }

  function drawStdp(s) {
    var svg = el.stdp;
    if (!svg) return;
    var w = 260, h = 150;
    var padL = 24, padR = 10, padT = 12, padB = 22;
    var xOf = function (dt) { return padL + ((dt + 60) / 120) * (w - padL - padR); };
    var yOf = function (dw) { return padT + ((0.032 - dw) / 0.064) * (h - padT - padB); };
    var aMinus = s.ap * 1.05;
    var top = Math.max(0.032, s.ap * 1.1);
    var y0 = padT + ((top - 0) / (top * 2)) * (h - padT - padB);

    var pos = [], neg = [];
    for (var dt = 0.5; dt <= 60; dt += 1) {
      pos.push([dt, s.ap * Math.exp(-dt / 20)]);
      neg.push([-dt, -aMinus * Math.exp(-dt / 20)]);
    }
    var dPos = pos.map(function (p, i) { return (i ? 'L' : 'M') + xOf(p[0]).toFixed(1) + ' ' + yOf(p[1]).toFixed(1); }).join(' ');
    var dNeg = neg.map(function (p, i) { return (i ? 'L' : 'M') + xOf(p[0]).toFixed(1) + ' ' + yOf(p[1]).toFixed(1); }).join(' ');
    var dw = stdpDelta(s);
    var mx = xOf(s.dtPair), my = yOf(dw);

    svg.innerHTML =
      '<g stroke="rgba(22,32,31,0.12)" stroke-width="1">' +
        '<path d="M' + padL + ' ' + y0.toFixed(1) + ' H' + (w - padR) + '"/>' +
        '<path d="M' + xOf(0).toFixed(1) + ' ' + padT + ' V' + (h - padB) + '"/>' +
      '</g>' +
      '<g font-family="\'Spline Sans Mono\', monospace" font-size="7" fill="#5d6a66">' +
        '<text x="' + padL + '" y="' + (h - 8) + '">−60</text>' +
        '<text x="' + (xOf(0) - 8).toFixed(1) + '" y="' + (h - 8) + '">0</text>' +
        '<text x="' + (w - padR - 14) + '" y="' + (h - 8) + '">+60</text>' +
        '<text x="2" y="' + (padT + 5) + '">+A</text>' +
        '<text x="2" y="' + (h - padB) + '">−A</text>' +
        '<text x="' + (w - 62) + '" y="' + (padT + 9) + '">Δt (ms)</text>' +
      '</g>' +
      '<path d="' + dPos + '" fill="none" stroke="#b4442a" stroke-width="1.5"/>' +
      '<path d="' + dNeg + '" fill="none" stroke="#0f4c4a" stroke-width="1.5"/>' +
      '<circle cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="3" fill="' + (s.dtPair >= 0 ? '#b4442a' : '#0f4c4a') + '"/>' +
      '<path d="M' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' V' + y0.toFixed(1) + '" stroke="rgba(22,32,31,0.35)" stroke-width="1" stroke-dasharray="2 2"/>';
  }

  /* ---------------- update ---------------- */

  var last = null;

  function render() {
    var s = readState();
    var cell = simulate(s, 1, 99173);
    var m = metrics(cell.spikes);
    var pop = [];
    var popTotal = 0;
    for (var i = 0; i < 16; i += 1) {
      var scale = 0.85 + 0.3 * ((i * 37 % 16) / 15);
      var sim = simulate(s, scale, 99173 + i * 7919);
      pop.push(sim.spikes);
      popTotal += sim.spikes.length;
    }
    var dw = stdpDelta(s);
    var wAfter = Math.max(0, Math.min(2, s.weight + dw));

    el.out.drive.textContent = s.drive.toFixed(2) + ' nA';
    el.out.res.textContent = s.res + ' MΩ';
    el.out.tau.textContent = s.tau + ' ms';
    el.out.noise.textContent = s.noise.toFixed(1) + ' mV';
    el.out.thresh.textContent = '−' + Math.abs(s.thresh) + ' mV';
    el.out.refract.textContent = s.refract + ' ms';
    el.out.weight.textContent = s.weight.toFixed(2);
    el.out.dt.textContent = (s.dtPair > 0 ? '+' : '') + s.dtPair + ' ms';
    el.out.ap.textContent = s.ap.toFixed(3);

    el.rate.innerHTML = Math.round(m.rate) + '<small>Hz</small>';
    el.latency.innerHTML = m.spikes === 0 && !cell.spikes.length ? '—' : Math.round(m.latency) + '<small>ms</small>';
    el.cv.textContent = m.cv.toFixed(2);
    el.spikes.textContent = String(cell.spikes.length);
    el.w.textContent = wAfter.toFixed(3);
    el.scopeTrace.textContent = cell.spikes.length + ' spikes · ' + m.rate.toFixed(1) + ' Hz';
    el.scopeRaster.textContent = popTotal + ' spikes';
    el.scopeDwd.textContent = 'Δw ' + (dw >= 0 ? '+' : '') + dw.toFixed(3);

    var refractoryRate = 1000 / s.refract;
    var regime = 'Regular';
    if (!cell.spikes.length) regime = 'Silent';
    else if (m.rate > refractoryRate * 0.8) regime = 'Saturated';
    else if (m.cv > 0.5) regime = 'Irregular';
    else if (m.cv < 0.12) regime = 'Regular';
    else regime = 'Tonic';
    el.regime.textContent = regime;

    var bits = [];
    if (!cell.spikes.length) {
      bits.push('Silent: with a threshold of ' + s.thresh + ' mV and ' + s.drive.toFixed(2) + ' nA through ' + s.res + ' MΩ, the steady state is ' + (V_REST + s.drive * (s.weight / 0.6) * s.res).toFixed(1) + ' mV — below threshold. Raise the drive, the resistance or the noise.');
    } else {
      bits.push('The cell fires ' + cell.spikes.length + ' times in 400 ms (' + m.rate.toFixed(0) + ' Hz), first at ' + m.latency.toFixed(0) + ' ms, with an ISI coefficient of variation of ' + m.cv.toFixed(2) + '.');
    }
    if (m.rate > refractoryRate * 0.8) {
      bits.push('That is close to the refractory ceiling of ' + Math.round(refractoryRate) + ' Hz: the rate is set by the reset, not by the input, so the cell has stopped carrying information in its timing.');
    }
    if (m.cv > 0.5 && cell.spikes.length > 2) {
      bits.push('The irregularity comes mostly from the ' + s.noise.toFixed(1) + ' mV of noise; a front end that codes in spike counts should average over a longer window.');
    }
    if (s.tau > 30) bits.push('A ' + s.tau + ' ms membrane integrates over roughly a whole stimulus frame at 30 fps, which will smear fast events.');
    if (s.refract > 8) bits.push('A ' + s.refract + ' ms refractory period is long for an event camera; real cells sit between 1 and 5 ms.');
    if (s.dtPair > 0) {
      bits.push('At Δt = +' + s.dtPair + ' ms the pairing potentiates by ' + dw.toFixed(3) + ', taking the weight from ' + s.weight.toFixed(2) + ' to ' + wAfter.toFixed(2) + '.');
    } else if (s.dtPair < 0) {
      bits.push('At Δt = ' + s.dtPair + ' ms the post-synaptic spike leads, so the pairing depresses the weight by ' + Math.abs(dw).toFixed(3) + '.');
    } else {
      bits.push('At Δt = 0 the STDP window is undefined and this model applies no change, which is one of the places where the biological story is messier than the equation.');
    }
    el.verdict.textContent = bits.join(' ');

    var events = popTotal * 128;
    el.energy.textContent = '≈ ' + (events * 23.6 / 1000).toFixed(2) + ' nJ of synaptic events across 16 cells per run at 128 fan-out';

    drawTrace(s, cell);
    drawRaster(pop);
    drawStdp(s);

    last = { s: s, m: m, cell: cell, pop: pop, popTotal: popTotal, dw: dw, wAfter: wAfter, regime: regime };
  }

  el.form.addEventListener('input', render);
  el.form.addEventListener('change', render);
  el.form.addEventListener('submit', function (e) { e.preventDefault(); render(); });

  var t = null;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { if (last) { drawTrace(last.s, last.cell); drawRaster(last.pop); } }, 140);
  });

  render();

  window.__lif = {
    read: function () {
      return {
        rate: last.m.rate,
        latency: last.m.latency,
        cv: last.m.cv,
        spikes: last.cell.spikes.length,
        populationSpikes: last.popTotal,
        dw: last.dw,
        weightAfter: last.wAfter,
        regime: last.regime,
        verdict: el.verdict.textContent,
        readouts: {
          rate: el.rate.textContent,
          latency: el.latency.textContent,
          cv: el.cv.textContent,
          spikes: el.spikes.textContent,
          weight: el.w.textContent
        },
        audio: typeof window.AudioContext !== 'undefined' && window.__audioState ? window.__audioState.created : false
      };
    },
    set: function (name, value) {
      var f = el.form.elements[name];
      if (f) f.value = value;
      render();
    }
  };

  void reduce;
})();
