/* =========================================================
   Sounding Line — detection bench
   Hydrophone site: nav, sonar-equation model, spectrogram,
   sound-speed profile, opt-in synthesised playback.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- mobile navigation ---------------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------------- ocean model ---------------- */
  var SALINITY = 34.9;
  var SURFACE_T = 26;

  function tempAt(z) {
    if (z < 80) return SURFACE_T;
    if (z < 1200) return SURFACE_T - 21.8 * Math.pow((z - 80) / 1120, 0.85);
    return 4.2 + 0.00035 * (z - 1200);
  }

  // Mackenzie (1981) nine-term equation, T in Celsius, S in psu, D in metres.
  function soundSpeed(z) {
    var T = tempAt(z), S = SALINITY, D = z;
    return 1448.96 + 4.591 * T - 0.05304 * T * T + 0.0002374 * T * T * T
      + 1.34 * (S - 35) + 0.0163 * D + 1.675e-7 * D * D
      - 0.01025 * T * (S - 35) - 7.139e-13 * T * D * D * D;
  }

  // Thorp absorption, dB/km, f in kHz.
  function absorption(fkHz) {
    var f2 = fkHz * fkHz;
    return 0.11 * f2 / (1 + f2) + 44 * f2 / (4100 + f2) + 2.75e-4 * f2 + 0.003;
  }

  function ambientDb(f, sea) {
    var ship = 78 - 17 * Math.log10(f / 100) + (sea - 3) * 2.5;
    var thermal = 47 + 20 * Math.log10(f / 10000) + (sea - 3) * 2.5;
    var turb = 100 - 30 * Math.log10(Math.max(f, 1) / 10);
    var sum = Math.pow(10, ship / 10) + Math.pow(10, thermal / 10) + Math.pow(10, turb / 10);
    return 10 * Math.log10(sum);
  }

  function transmissionLoss(rangeM, fHz, channel) {
    var km = rangeM / 1000;
    var spread = (channel ? 15 : 20) * Math.log10(Math.max(rangeM, 1));
    return spread + absorption(fHz / 1000) * km;
  }

  var AXIS = 980;
  for (var zz = 0; zz <= 5000; zz += 10) {
    if (soundSpeed(zz) < soundSpeed(AXIS)) AXIS = zz;
  }

  function inChannel(z) { return Math.abs(z - AXIS) < 500; }

  function detectionRange(sl, fHz, sea, z, dt) {
    var nl = ambientDb(fHz, sea);
    var budget = sl - nl - (dt || 9);
    if (budget <= 0) return { range: 0, nl: nl, budget: budget };
    var channel = inChannel(z) && fHz < 300;
    var lo = 1, hi = 2.2e6;
    for (var i = 0; i < 60; i++) {
      var mid = Math.sqrt(lo * hi);
      if (transmissionLoss(mid, fHz, channel) < budget) lo = mid; else hi = mid;
    }
    return { range: lo, nl: nl, budget: budget };
  }

  /* ---------------- sources ---------------- */
  var SOURCES = {
    blue:     { tag: 'BLUE WHALE B CALL', band: '18 Hz · 16 s', f: 18,    sl: 185, dur: 16, dt: 9 },
    fin:      { tag: 'FIN WHALE 20 Hz PULSE', band: '20 Hz · 1 s', f: 20, sl: 184, dur: 1, dt: 9 },
    sperm:    { tag: 'SPERM WHALE CLICK TRAIN', band: '12 kHz · 100 µs', f: 12000, sl: 205, dur: 0.1, dt: 9 },
    humpback: { tag: 'HUMPBACK SONG PHRASE', band: '800 Hz · 6 notes', f: 800, sl: 165, dur: 6, dt: 9 },
    airgun:   { tag: 'SEISMIC AIRGUN ARRAY', band: '60 Hz · 14 ms', f: 60, sl: 225, dur: 14, dt: 9 },
    ship:     { tag: 'CONTAINER SHIP · 14 kn', band: '120 Hz · continuous', f: 120, sl: 175, dur: 999, dt: 21 }
  };
  var current = 'blue';

  /* ---------------- spectrogram ---------------- */
  var canvas = document.getElementById('spectro');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var SW = 1200, SH = 330;
  var FMIN = 10, FMAX = 100000, LOGSPAN = Math.log10(FMAX / FMIN);
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fy(f) {
    var t = Math.log10(Math.max(f, FMIN) / FMIN) / LOGSPAN;
    return SH - t * SH;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  var RAMP = [
    [0.00, 3, 10, 13],
    [0.22, 10, 38, 46],
    [0.42, 20, 82, 86],
    [0.62, 42, 148, 140],
    [0.76, 94, 224, 196],
    [0.90, 224, 168, 80],
    [1.00, 255, 244, 224]
  ];
  function ramp(v) {
    v = clamp01(v);
    for (var i = 1; i < RAMP.length; i++) {
      if (v <= RAMP[i][0]) {
        var a = RAMP[i - 1], b = RAMP[i];
        var t = (v - a[0]) / (b[0] - a[0] || 1);
        return [
          Math.round(a[1] + (b[1] - a[1]) * t),
          Math.round(a[2] + (b[2] - a[2]) * t),
          Math.round(a[3] + (b[3] - a[3]) * t)
        ];
      }
    }
    return [255, 244, 224];
  }

  // Source energy at frequency f for phase p (0..1 within its cycle).
  function sourceEnergy(id, f, p, atten) {
    var s = SOURCES[id];
    var v = 0;
    if (id === 'blue' || id === 'fin') {
      var base = id === 'blue' ? 18 + 2.2 * Math.sin(p * Math.PI) : 20;
      var width = id === 'blue' ? 2.4 : 1.6;
      var env = id === 'blue' ? Math.sin(Math.PI * Math.min(1, p * 1.6)) : (p < 0.12 ? 1 : 0.05);
      for (var h = 1; h <= 4; h++) {
        var fh = base * h;
        v += env * (h === 1 ? 1 : 0.42 / h) * Math.exp(-Math.pow((f - fh) / (width * h), 2));
      }
      v += env * 0.12 * Math.exp(-Math.pow((f - 140) / 90, 2));
    } else if (id === 'sperm') {
      var on = p < 0.06 ? 1 : 0.03;
      v += on * 0.85 * Math.exp(-Math.pow((f - 11000) / 6000, 2));
      v += on * 0.3 * Math.exp(-Math.pow((f - 900) / 700, 2));
    } else if (id === 'humpback') {
      var freq = 220 + 620 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2 - 1));
      v += 0.75 * Math.exp(-Math.pow((f - freq) / 70, 2));
      v += 0.35 * Math.exp(-Math.pow((f - freq * 2) / 90, 2));
      v += 0.2 * Math.exp(-Math.pow((f - 120) / 60, 2));
    } else if (id === 'airgun') {
      var burst = p < 0.03 ? 1 : 0.02;
      v += burst * (0.9 * Math.exp(-Math.pow(Math.log10(Math.max(f, FMIN) / 45) / 0.75, 2)));
    } else if (id === 'ship') {
      v += 0.4 * Math.exp(-Math.pow(Math.log10(Math.max(f, FMIN) / 90) / 1.1, 2));
      v += 0.2 * Math.exp(-Math.pow((f - 120) / 8, 2));
      v += 0.14 * Math.exp(-Math.pow((f - 240) / 10, 2));
      v += 0.09 * Math.exp(-Math.pow((f - 480) / 16, 2));
    }
    return v * atten;
  }

  var clock = 0;

  function paintColumn(x, tSec, state) {
    var img = ctx.createImageData(1, SH);
    var s = SOURCES[current];
    var atten = inChannel(state.z) ? 1 : (s.f < 300 ? 0.45 : 0.8);
    var cycle = s.dur >= 999 ? 1 : s.dur;
    var p = s.dur >= 999 ? 0 : ((tSec % (cycle + (s.dur >= 999 ? 0 : 2))) / cycle);
    if (p > 1) p = 1.0001;

    for (var y = 0; y < SH; y++) {
      var f = FMIN * Math.pow(10, ((SH - y) / SH) * LOGSPAN);
      var nl = ambientDb(f, state.sea);
      var base = clamp01((nl - 30) / 62) * 0.44;
      var grain = Math.random() * 0.07;
      var v = base + grain * (0.6 + 0.4 * Math.sin(y * 0.3 + tSec));

      if (s.dur < 999) {
        var e = sourceEnergy(current, f, p, atten);
        v += e * 0.82;
      } else {
        v += sourceEnergy(current, f, 0, atten) * 0.7;
      }
      // faint shipping haze always present below 400 Hz
      if (f < 400) v += 0.055 * (1 - f / 400);

      var c = ramp(v);
      var o = y * 4;
      img.data[o] = c[0];
      img.data[o + 1] = c[1];
      img.data[o + 2] = c[2];
      img.data[o + 3] = 255;
    }
    ctx.putImageData(img, x, 0);
  }

  function staticFrame(state) {
    for (var x = 0; x < SW; x++) paintColumn(x, (x / SW) * 60, state);
  }

  var state = { z: 1000, sea: 3, spacing: 1.5 };
  var running = false;

  function animate() {
    if (!running) return;
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(canvas, -1, 0);
    ctx.globalCompositeOperation = 'source-over';
    clock += 1;
    paintColumn(SW - 1, clock / 20, state);
    window.setTimeout(function () { requestAnimationFrame(animate); }, 50);
  }

  function repaint() {
    if (!ctx) return;
    if (reduced) { staticFrame(state); return; }
    if (!running) {
      running = true;
      ctx.fillStyle = '#030a0d';
      ctx.fillRect(0, 0, SW, SH);
      for (var x = 0; x < SW; x += 3) paintColumn(x, (x / SW) * 60, state);
      animate();
    }
  }

  /* ---------------- readouts ---------------- */
  var els = {
    depth: document.getElementById('depth'),
    depthOut: document.getElementById('depthOut'),
    depthHint: document.getElementById('depthHint'),
    sea: document.getElementById('sea'),
    seaOut: document.getElementById('seaOut'),
    space: document.getElementById('space'),
    spaceOut: document.getElementById('spaceOut'),
    aliasHint: document.getElementById('aliasHint'),
    speed: document.getElementById('roSpeed'),
    noise: document.getElementById('roNoise'),
    loss: document.getElementById('roLoss'),
    range: document.getElementById('roRange'),
    foot: document.getElementById('roFoot'),
    tag: document.getElementById('specTag')
  };

  function fmt(n, d) {
    return n.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }

  function update() {
    var s = SOURCES[current];
    var res = detectionRange(s.sl, s.f, state.sea, state.z, s.dt);
    var c = soundSpeed(state.z);

    if (els.depthOut) els.depthOut.textContent = fmt(state.z) + ' m';
    if (els.seaOut) els.seaOut.textContent = String(state.sea);
    if (els.spaceOut) els.spaceOut.textContent = state.spacing.toFixed(2) + ' m';

    if (els.depthHint) {
      var dAxis = Math.abs(state.z - AXIS);
      els.depthHint.textContent = dAxis < 500
        ? 'Sound channel axis at ' + fmt(AXIS) + ' m — inside the duct, 15 log r.'
        : 'Sound channel axis at ' + fmt(AXIS) + ' m — ' + fmt(dAxis) + ' m outside it, 20 log r.';
    }
    if (els.aliasHint) {
      els.aliasHint.textContent = 'Spatial Nyquist: usable to ' + fmt(c / (2 * state.spacing)) + ' Hz before grating lobes.';
    }
    if (els.speed) els.speed.innerHTML = fmt(c, 0) + '<small>m/s</small>';
    if (els.noise) els.noise.innerHTML = fmt(res.nl, 0) + '<small>dB re 1 µPa²/Hz</small>';
    if (els.loss) els.loss.innerHTML = fmt(transmissionLoss(10000, s.f, inChannel(state.z)), 0) + '<small>dB</small>';
    if (els.range) {
      if (res.range >= 2e6) {
        els.range.innerHTML = '≥2,000<small>km · basin</small>';
      } else if (res.range < 1000) {
        els.range.innerHTML = fmt(res.range, 0) + '<small>m</small>';
      } else {
        els.range.innerHTML = fmt(res.range / 1000, 0) + '<small>km</small>';
      }
    }
    if (els.foot) {
      els.foot.textContent = 'Source level ' + s.sl + ' dB · threshold ' + s.dt + ' dB · ' +
        (inChannel(state.z) && s.f < 300 ? 'mode-stripping 15 log r' : 'spherical spreading 20 log r') +
        ' · absorption ' + absorption(s.f / 1000).toFixed(3) + ' dB/km at ' + fmt(s.f >= 1000 ? s.f / 1000 : s.f, s.f >= 1000 ? 0 : 0) + (s.f >= 1000 ? ' kHz' : ' Hz') + '.';
    }
    if (els.tag) els.tag.textContent = s.tag + ' · ' + s.band;

    repaint();
  }

  function bindRange(el, key, after) {
    if (!el) return;
    el.addEventListener('input', function () {
      state[key] = parseFloat(el.value);
      if (after) after();
      update();
    });
  }

  bindRange(els.depth, 'z');
  bindRange(els.sea, 'sea');
  bindRange(els.space, 'spacing');

  var srcButtons = Array.prototype.slice.call(document.querySelectorAll('.src'));
  srcButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      current = btn.getAttribute('data-src');
      srcButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      clock = 0;
      update();
      if (audioOn) startAudio();
    });
  });

  /* ---------------- opt-in audio ---------------- */
  var audioOn = false;
  var audioCtx = null;
  var masterGain = null;
  var stopTimer = null;
  var meterRAF = null;
  var nodes = [];

  function makeNoiseBuffer(seconds) {
    var len = Math.floor(audioCtx.sampleRate * seconds);
    var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function clearNodes() {
    nodes.forEach(function (n) {
      try { if (n.stop) n.stop(); } catch (e) { /* already stopped */ }
      try { n.disconnect(); } catch (e) { /* already gone */ }
    });
    nodes = [];
  }

  function tone(freq, start, dur, gain, type, endFreq) {
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(masterGain);
    osc.start(start);
    osc.stop(start + dur + 0.05);
    nodes.push(osc, g);
  }

  function burst(start, dur, level, filterType, freq, q) {
    var src = audioCtx.createBufferSource();
    src.buffer = makeNoiseBuffer(Math.max(dur + 0.05, 0.12));
    var bq = audioCtx.createBiquadFilter();
    bq.type = filterType;
    bq.frequency.value = freq;
    bq.Q.value = q || 0.9;
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(level, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(bq).connect(g).connect(masterGain);
    src.start(start);
    src.stop(start + dur + 0.05);
    nodes.push(src, bq, g);
  }

  function schedule(offset) {
    var t = audioCtx.currentTime + 0.1;
    var s = SOURCES[current];
    if (current === 'blue') {
      [18, 36, 54, 72, 108, 162].forEach(function (f, i) {
        tone(f, t + i * 0.02, 11, 0.16 / (i + 1.2), 'sine');
      });
      tone(18, t + 2, 9, 0.12, 'sine', 22);
    } else if (current === 'fin') {
      for (var i = 0; i < 9; i++) {
        [20, 40, 60, 80, 120].forEach(function (f, k) {
          tone(f, t + i * 1.3 + k * 0.01, 0.9, 0.14 / (k + 1.2), 'sine');
        });
      }
    } else if (current === 'sperm') {
      for (var j = 0; j < 34; j++) {
        var ct = t + j * 0.34;
        burst(ct, 0.012, 0.5, 'bandpass', 9000, 1.6);
        tone(2600, ct, 0.05, 0.05, 'sine', 1800);
      }
    } else if (current === 'humpback') {
      var notes = [220, 330, 440, 392, 294, 196];
      notes.forEach(function (f, k) {
        var st = t + k * 1.9;
        tone(f, st - 0.1, 1.5, 0.12, 'sawtooth', f * 1.6);
        tone(f * 2, st - 0.1, 1.4, 0.05, 'sine', f * 2.4);
      });
    } else if (current === 'airgun') {
      for (var a = 0; a < 3; a++) {
        burst(t + a * 4, 0.35, 0.4, 'lowpass', 240, 0.7);
      }
    } else if (current === 'ship') {
      var src = audioCtx.createBufferSource();
      src.buffer = makeNoiseBuffer(12);
      src.loop = true;
      var lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 260;
      var g = audioCtx.createGain();
      g.gain.value = 0.22;
      src.connect(lp).connect(g).connect(masterGain);
      src.start(t);
      nodes.push(src, lp, g);
    }
    stopTimer = window.setTimeout(stopAudio, 12000);
  }

  function startAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      clearNodes();
      if (masterGain) { try { masterGain.disconnect(); } catch (e) { /* noop */ } }
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(audioCtx.destination);
      schedule();
      audioOn = true;
      var btn = document.getElementById('listenBtn');
      var label = document.getElementById('listenLabel');
      if (btn) btn.setAttribute('aria-pressed', 'true');
      if (label) label.textContent = 'Stop';
      startMeter();
    } catch (e) {
      audioOn = false;
    }
  }

  function stopAudio() {
    clearNodes();
    if (masterGain) { try { masterGain.disconnect(); } catch (e) { /* noop */ } masterGain = null; }
    if (stopTimer) { window.clearTimeout(stopTimer); stopTimer = null; }
    if (meterRAF) { cancelAnimationFrame(meterRAF); meterRAF = null; }
    audioOn = false;
    var btn = document.getElementById('listenBtn');
    var label = document.getElementById('listenLabel');
    var bar = document.getElementById('meterBar');
    if (btn) btn.setAttribute('aria-pressed', 'false');
    if (label) label.textContent = 'Listen to this source · 12 s';
    if (bar) bar.style.width = '2%';
  }

  function startMeter() {
    var bar = document.getElementById('meterBar');
    if (!bar) return;
    var phase = 0;
    function step() {
      if (!audioOn) return;
      phase += 0.08;
      var v = 18 + Math.abs(Math.sin(phase)) * 64 + Math.random() * 14;
      bar.style.width = Math.min(96, v).toFixed(0) + '%';
      meterRAF = requestAnimationFrame(step);
    }
    step();
  }

  var listenBtn = document.getElementById('listenBtn');
  if (listenBtn) {
    listenBtn.addEventListener('click', function () {
      if (audioOn) stopAudio(); else startAudio();
    });
  }

  /* ---------------- sound-speed profile drawing ---------------- */
  var sspPath = document.getElementById('sspPath');
  var sspGlow = document.getElementById('sspGlow');
  var sspGrid = document.getElementById('sspGrid');
  var sspAxisG = document.getElementById('sspAxis');
  var sspAxisLine = document.getElementById('sspAxisLine');
  var sspNote = document.getElementById('sspNote');

  var X0 = 62, X1 = 396, Y0 = 20, Y1 = 500;
  var CMIN = 1478, CMAX = 1566;
  function cToX(c) { return X0 + ((c - CMIN) / (CMAX - CMIN)) * (X1 - X0); }
  function zToY(z) { return Y0 + (z / 5000) * (Y1 - Y0); }

  if (sspPath && sspGrid) {
    var d = '';
    for (var z = 0; z <= 5000; z += 20) {
      var x = cToX(soundSpeed(z));
      var y = zToY(z);
      d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    sspPath.setAttribute('d', d);
    if (sspGlow) sspGlow.setAttribute('d', d);

    var g = '';
    for (var i = 0; i <= 5; i++) {
      var gy = zToY(i * 1000);
      g += '<line x1="' + X0 + '" y1="' + gy + '" x2="' + X1 + '" y2="' + gy + '"/>';
    }
    for (var cTick = 1480; cTick <= 1560; cTick += 20) {
      var gx = cToX(cTick).toFixed(1);
      g += '<line x1="' + gx + '" y1="' + Y0 + '" x2="' + gx + '" y2="' + Y1 + '"/>';
    }
    sspGrid.innerHTML = g;

    if (sspAxisG) {
      var axis = '';
      for (var k = 0; k <= 5; k++) {
        axis += '<text x="' + (X0 - 10) + '" y="' + (zToY(k * 1000) + 3.5) + '" text-anchor="end">' + (k === 0 ? '0' : (k * 1000).toLocaleString('en-US')) + '</text>';
      }
      for (var c2 = 1480; c2 <= 1560; c2 += 20) {
        axis += '<text x="' + cToX(c2).toFixed(1) + '" y="' + (Y1 + 16) + '" text-anchor="middle">' + c2 + '</text>';
      }
      axis += '<text x="' + X0 + '" y="' + (Y0 - 8) + '" text-anchor="start" class="ssp-unit">depth m  /  sound speed m s⁻¹</text>';
      sspAxisG.innerHTML = axis;
    }

    if (sspAxisLine) {
      var ay = zToY(AXIS);
      sspAxisLine.setAttribute('y1', ay.toFixed(1));
      sspAxisLine.setAttribute('y2', ay.toFixed(1));
      sspAxisLine.setAttribute('x1', cToX(soundSpeed(AXIS)).toFixed(1));
    }
    if (sspNote) {
      sspNote.setAttribute('y', (zToY(AXIS) - 10).toFixed(1));
      sspNote.setAttribute('x', (cToX(soundSpeed(AXIS)) + 10).toFixed(1));
      sspNote.textContent = 'axis · ' + AXIS + ' m · ' + soundSpeed(AXIS).toFixed(1) + ' m/s';
    }
  }

  /* ---------------- deployment filter ---------------- */
  var fbtns = Array.prototype.slice.call(document.querySelectorAll('.fbtn'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.deployment'));
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
        if (filterCount) filterCount.textContent = n + (n === 1 ? ' deployment shown' : ' deployments shown');
      });
    });
  }

  /* ---------------- survey brief ---------------- */
  var form = document.getElementById('briefForm');
  var result = document.getElementById('briefResult');
  var preview = document.getElementById('briefPreview');
  var send = document.getElementById('briefSend');
  var edit = document.getElementById('briefEdit');

  function field(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function showErr(id, on) {
    var el = document.getElementById(id);
    if (el) el.hidden = !on;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = field('name'), email = field('email'), site = field('site'), msg = field('message');
      var consent = document.getElementById('consent').checked;
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      showErr('err-name', !name);
      showErr('err-email', !emailOk);
      showErr('err-site', !site);
      showErr('err-message', !msg);
      showErr('err-consent', !consent);
      if (!name || !emailOk || !site || !msg || !consent) {
        var firstBad = !name ? 'name' : (!emailOk ? 'email' : (!site ? 'site' : (!msg ? 'message' : 'consent')));
        var target = document.getElementById(firstBad);
        if (target && target.focus) target.focus();
        if (result) result.hidden = true;
        return;
      }

      var org = field('org'), depth = field('depth'), topic = field('topic');
      var text = 'Survey brief\n\n' +
        'Name: ' + name + '\n' +
        (org ? 'Organisation: ' + org + '\n' : '') +
        'Email: ' + email + '\n' +
        'Purpose: ' + topic + '\n' +
        'Site: ' + site + (depth ? ' · ' + depth + ' m water depth' : '') + '\n\n' +
        'Question to answer:\n' + msg + '\n\n' +
        'Sent from the Sounding Line survey brief form.';

      if (preview) preview.textContent = text;
      if (send) send.setAttribute('href', 'mailto:survey@soundingline.example?subject=' + encodeURIComponent('Survey brief — ' + (org || name)) + '&body=' + encodeURIComponent(text));
      if (result) result.hidden = false;
      if (result && result.scrollIntoView) result.scrollIntoView({ block: 'nearest' });
    });
  }

  if (edit) {
    edit.addEventListener('click', function () {
      if (result) result.hidden = true;
      var nameEl = document.getElementById('name');
      if (nameEl) nameEl.focus();
    });
  }

  /* ---------------- boot ---------------- */
  update();
  window.addEventListener('resize', function () {
    if (reduced) staticFrame(state);
  });
})();
