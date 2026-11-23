/* Dana Whitfield — Mach cone model, boom audio (opt-in only), nav, form. */

(function () {
  'use strict';

  var G0 = 9.80665, R = 287.05, GAMMA = 1.4;

  var state = { mach: 1.6, alt: 14000, len: 22 };

  function isa(h) {
    var T, p;
    if (h <= 11000) {
      T = 288.15 - 0.0065 * h;
      p = 101325 * Math.pow(T / 288.15, 5.25588);
    } else {
      T = 216.65;
      p = 22632 * Math.exp((-G0 * (h - 11000)) / (R * T));
    }
    return { T: T, p: p };
  }

  function solve() {
    var atm = isa(state.alt);
    var a = Math.sqrt(GAMMA * R * atm.T);
    var m2 = state.mach * state.mach;
    var cone = Math.asin(1 / state.mach) * 180 / Math.PI;
    var delay = (state.alt / a) * Math.sqrt(Math.max(0, 1 - 1 / m2));
    var dur = (state.len / (state.mach * a)) * 1000;
    var over = 0.75 * atm.p * Math.pow(Math.max(m2 - 1, 0.0001), 0.375) * Math.pow(state.len / state.alt, 0.75);
    return { a: a, T: atm.T, p: atm.p, cone: cone, delay: delay, dur: dur, over: over, psf: over * 0.0208854 };
  }

  /* ---------- canvas ---------- */

  var canvas = document.getElementById('cone');
  var ctx = canvas && canvas.getContext('2d');

  function draw() {
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = canvas.clientWidth || 760;
    var cssH = cssW * (420 / 760);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var s = solve();
    var W = cssW, H = cssH;
    var groundY = H - Math.max(38, H * 0.11);
    var ax = W * 0.74;
    var ay = groundY - (state.alt / 20000) * (groundY - 34);
    var tan = Math.tan(s.cone * Math.PI / 180);
    var dx = (groundY - ay) / tan;

    var label = Math.max(9, Math.min(11, W / 66));

    // ground
    ctx.strokeStyle = 'rgba(21,24,29,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(W, groundY + 0.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(21,24,29,0.2)';
    for (var x = 6; x < W; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 1);
      ctx.lineTo(x - 6, groundY + 8);
      ctx.stroke();
    }

    // altitude rule
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'rgba(21,24,29,0.3)';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // trailing axis, so the cone angle reads
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = 'rgba(21,24,29,0.22)';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(Math.max(4, ax - 150), ay);
    ctx.stroke();
    ctx.setLineDash([]);

    // flight axis
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(21,24,29,0.28)';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(W - 8, ay);
    ctx.stroke();
    ctx.setLineDash([]);

    // cone interior
    ctx.fillStyle = 'rgba(21,67,201,0.055)';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - dx, groundY);
    ctx.lineTo(ax, groundY);
    ctx.closePath();
    ctx.fill();

    // shock front to the ground
    ctx.strokeStyle = '#1543c9';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - dx, groundY);
    ctx.stroke();

    // upper shock, clipped by the frame
    ctx.strokeStyle = 'rgba(21,67,201,0.35)';
    ctx.lineWidth = 1;
    var upX = ax - ay / tan;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(upX, 0);
    ctx.stroke();

    // cone angle arc at the apex
    var mu = s.cone * Math.PI / 180;
    ctx.strokeStyle = 'rgba(21,67,201,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ax, ay, 52, Math.PI - mu, Math.PI, false);
    ctx.stroke();

    // aircraft
    ctx.fillStyle = '#15181d';
    ctx.beginPath();
    ctx.moveTo(ax + 26, ay);
    ctx.lineTo(ax - 6, ay - 7);
    ctx.lineTo(ax - 1, ay);
    ctx.lineTo(ax - 6, ay + 7);
    ctx.closePath();
    ctx.fill();

    // boom arrival at ground
    ctx.strokeStyle = '#1543c9';
    ctx.lineWidth = 1.4;
    for (var r = 5; r <= 15; r += 5) {
      ctx.beginPath();
      ctx.arc(ax - dx, groundY, r, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    ctx.fillStyle = '#1543c9';
    ctx.beginPath();
    ctx.arc(ax - dx, groundY, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // labels
    ctx.font = label + 'px "Space Mono", monospace';
    ctx.fillStyle = '#5a626d';
    ctx.textAlign = 'right';
    ctx.fillText('h ' + Math.round(state.alt).toLocaleString('en-US') + ' m', ax - 6, (ay + groundY) / 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1543c9';
    ctx.fillText('μ ' + s.cone.toFixed(1) + '°', ax + 14, ay + 22);
    ctx.fillStyle = '#5a626d';
    ctx.textAlign = 'right';
    ctx.fillText('boom +' + Math.round(s.delay) + ' s', Math.max(6, ax - dx - 12), groundY - 12);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#858d98';
    ctx.fillText('ground station', 4, groundY + 24);

    // Mach readout in the corner
    ctx.fillStyle = '#15181d';
    ctx.font = '600 ' + (label + 4) + 'px Archivo, sans-serif';
    ctx.fillText('M ' + state.mach.toFixed(2), 4, 22);
    ctx.fillStyle = '#858d98';
    ctx.font = label + 'px "Space Mono", monospace';
    ctx.fillText('steady level flight', 4, 22 + label + 6);
  }

  /* ---------- readouts ---------- */

  function render() {
    var s = solve();
    var set = function (id, html) { var n = document.getElementById(id); if (n) n.innerHTML = html; };

    set('outCone', s.cone.toFixed(1) + '°<small>half-angle, asin(1/M)</small>');
    set('outOver', s.psf.toFixed(1) + ' psf<small>' + Math.round(s.over) + ' Pa at the track</small>');
    set('outDelay', Math.round(s.delay) + ' s<small>behind overflight</small>');
    set('outDur', Math.round(s.dur) + ' ms<small>N-wave period</small>');
    set('outSpeed', Math.round(s.a) + ' m/s<small>' + (s.a / 340.3).toFixed(2) + '× sea-level</small>');
    set('outTemp', s.T.toFixed(1) + ' K<small>' + (s.T - 273.15).toFixed(0) + ' °C static</small>');

    var note = document.getElementById('boomNote');
    if (note) {
      var who = s.psf < 0.7 ? 'barely audible at the track' : s.psf < 1.5 ? 'a soft thump, windows intact' : s.psf < 3 ? 'window rattle to 3 km' : s.psf < 6 ? 'a sharp crack, complaints likely' : 'structural risk inside the carpet';
      note.textContent = 'Cone half-angle ' + s.cone.toFixed(1) + '°. The shock reaches the ground ' + Math.round(s.delay) + ' s behind the aircraft at ' + s.psf.toFixed(1) + ' psf — ' + who + '. Temperature ' + (s.T - 273.15).toFixed(0) + ' °C at ' + Math.round(state.alt).toLocaleString('en-US') + ' m.';
    }
    draw();
  }

  /* ---------- controls ---------- */

  function bind() {
    var mach = document.getElementById('mach');
    if (!mach) return;
    mach.addEventListener('input', function () {
      state.mach = +this.value;
      document.getElementById('machOut').textContent = state.mach.toFixed(2);
      render();
    });
    document.getElementById('alt').addEventListener('input', function () {
      state.alt = +this.value;
      document.getElementById('altOut').textContent = state.alt.toLocaleString('en-US') + ' m';
      render();
    });
    document.getElementById('len').addEventListener('input', function () {
      state.len = +this.value;
      document.getElementById('lenOut').textContent = state.len + ' m';
      render();
    });
  }

  /* ---------- opt-in boom audio ---------- */

  var audioCtx = null;

  function boom() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    var s = solve();
    var rate = audioCtx.sampleRate;
    var len = Math.floor(rate * 1.4);
    var buf = audioCtx.createBuffer(1, len, rate);
    var d = buf.getChannelData(0);

    var rise = Math.max(0.004, Math.min(0.02, 0.006));
    var fall = Math.min(0.35, Math.max(0.08, s.dur / 1000));
    var peak = Math.min(0.55, 0.08 + s.psf * 0.06);
    var start = Math.floor(rate * 0.25);
    var nRise = Math.floor(rate * rise);
    var nFall = Math.floor(rate * fall);
    var i;

    for (i = 0; i < nRise; i++) d[start + i] = peak * (i / nRise);
    for (i = 0; i < nFall; i++) d[start + nRise + i] = peak * (1 - 2 * (i / nFall));
    for (i = 0; i < nRise; i++) d[start + nRise + nFall + i] = -peak * (1 - i / nRise);
    // short ground reflection tail
    var tailStart = start + nRise + nFall + nRise;
    for (i = 0; i < rate * 0.18; i++) {
      if (tailStart + i < len) d[tailStart + i] += -peak * 0.28 * Math.exp(-i / (rate * 0.04)) * (1 - i / (rate * 0.18));
    }

    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    var g = audioCtx.createGain();
    g.gain.value = 0.9;
    src.connect(lp);
    lp.connect(g);
    g.connect(audioCtx.destination);
    src.start();

    var btn = document.getElementById('boomPlay');
    if (btn) {
      btn.textContent = 'Boom played';
      setTimeout(function () { btn.textContent = 'Hear the N-wave again'; }, 1600);
    }
  }

  function audioBind() {
    var btn = document.getElementById('boomPlay');
    if (!btn) return;
    btn.addEventListener('click', boom);
  }

  /* ---------- nav + form ---------- */

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
    var f = document.getElementById('sortieForm');
    if (!f) return;
    var status = document.getElementById('formStatus');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.querySelector('#fName').value.trim();
      var email = f.querySelector('#fEmail').value.trim();
      var brief = f.querySelector('#fBrief').value.trim();
      if (!name) { status.textContent = 'A name, so I can address the reply.'; status.className = 'form-status error'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status.textContent = 'Check the email address.'; status.className = 'form-status error'; return; }
      if (brief.length < 20) { status.textContent = 'Add the airframe, the Mach range and the site.'; status.className = 'form-status error'; return; }
      status.className = 'form-status';
      status.textContent = 'Card received, ' + name.split(' ')[0] + '. Expect a reply within three working days, with the ground-station plan I would start from.';
      f.reset();
    });
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 120);
  });

  bind();
  audioBind();
  render();
  menu();
  form();
})();
