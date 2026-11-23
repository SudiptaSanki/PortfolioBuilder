/* Kai Renner — FPV bench model, prop audio (opt-in only), nav, form. */

(function () {
  'use strict';

  var G = 9.80665;
  var CT = 0.12;          // static thrust coefficient, typical 5-inch prop
  var FM = 0.55;          // propeller figure of merit at static
  var MOTOR_EFF = 0.85;
  var CELL = 3.7;
  var SAG = 0.90;         // voltage under full load
  var LOAD = 0.88;        // rpm as a fraction of unloaded KV x volts
  var DUTY = 0.30;        // race-pace average current as a fraction of full
  var PACK_MAH = 1300;

  var state = { kv: 1960, cells: 6, prop: 5.1, pitch: 4.6, mass: 612, alt: 120 };

  function rho(h) {
    if (h <= 11000) return 1.225 * Math.pow(1 - 2.25577e-5 * h, 4.25588);
    return 0.3639;
  }

  function solve() {
    var air = rho(state.alt);
    var volts = state.cells * CELL * SAG;
    var rpm = state.kv * volts * LOAD;
    var n = rpm / 60;
    var D = state.prop / 39.37;
    var A = Math.PI * D * D / 4;
    var T = CT * air * Math.pow(n, 2) * Math.pow(D, 4);           // newtons per motor
    var pShaft = Math.pow(T, 1.5) / (Math.sqrt(2 * air * A) * FM);
    var pElec = pShaft / MOTOR_EFF;
    var amps = pElec / volts;
    var tw = (4 * T) / (state.mass / 1000 * G);
    var hoverT = (state.mass / 1000 * G) / 4;
    var hoverThrottle = Math.sqrt(hoverT / T) * 100;
    var tip = Math.PI * D * n;
    var pitchSpeed = (state.pitch / 39.37) * n;                    // m/s
    var endurance = (PACK_MAH / 1000 * 0.8) / (4 * amps * DUTY) * 60; // minutes
    return {
      air: air, volts: volts, rpm: rpm, thrust: T, amps: amps, tw: tw,
      hover: hoverThrottle, tip: tip, pitchSpeed: pitchSpeed, endurance: endurance,
      topSpeed: pitchSpeed * 0.70 * 3.6
    };
  }

  /* ---------- canvas ---------- */

  var canvas = document.getElementById('curve');
  var ctx = canvas && canvas.getContext('2d');

  function draw() {
    if (!ctx) return;
    var s = solve();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = canvas.clientWidth || 720;
    var cssH = cssW * 0.42;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var L = 46, R = cssW - 44, Tp = 16, B = cssH - 26;
    var tMax = s.thrust * 1.06;
    var iMax = s.amps * 1.1;
    var x = function (p) { return L + (p / 100) * (R - L); };
    var yT = function (t) { return B - (t / tMax) * (B - Tp); };
    var yI = function (a) { return B - (a / iMax) * (B - Tp); };

    ctx.strokeStyle = 'rgba(236,239,242,0.09)';
    ctx.lineWidth = 1;
    ctx.font = '9px "JetBrains Mono", monospace';
    for (var p = 0; p <= 100; p += 20) {
      ctx.beginPath(); ctx.moveTo(x(p), Tp); ctx.lineTo(x(p), B); ctx.stroke();
      ctx.fillStyle = '#6a737d';
      ctx.textAlign = 'center';
      ctx.fillText(p + (p === 100 ? '%' : ''), x(p), B + 14);
    }
    for (var q = 0; q <= 4; q++) {
      var g = q / 4;
      ctx.beginPath(); ctx.moveTo(L, B - g * (B - Tp)); ctx.lineTo(R, B - g * (B - Tp)); ctx.stroke();
      ctx.fillStyle = '#6a737d';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(tMax * g * 101.97) + ' g', L - 6, B - g * (B - Tp) + 3);
      ctx.textAlign = 'left';
      ctx.fillText((iMax * g).toFixed(0) + ' A', R + 6, B - g * (B - Tp) + 3);
    }

    // thrust curve
    ctx.beginPath();
    for (var t = 0; t <= 100; t += 1) {
      var th = t / 100;
      var val = s.thrust * th * th;
      var xx = x(t), yy = yT(val);
      if (t === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.strokeStyle = '#c8f24d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // current curve
    ctx.beginPath();
    for (var t2 = 0; t2 <= 100; t2 += 1) {
      var th2 = t2 / 100;
      var cur = s.amps * Math.pow(th2, 3);
      var x2 = x(t2), y2 = yI(cur);
      if (t2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = 'rgba(152,162,173,0.75)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // hover marker
    var hx = x(Math.min(100, s.hover));
    ctx.beginPath(); ctx.moveTo(hx, Tp); ctx.lineTo(hx, B); ctx.strokeStyle = 'rgba(200,242,77,0.35)';
    ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#c8f24d';
    ctx.beginPath(); ctx.arc(hx, yT(s.thrust * Math.pow(Math.min(100, s.hover) / 100, 2)), 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eceff2';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = hx > R - 110 ? 'right' : 'left';
    ctx.fillText('hover ' + Math.round(s.hover) + '%', hx + (hx > R - 110 ? -8 : 8), Tp + 12);

    // full-throttle marker
    ctx.fillStyle = '#c8f24d';
    ctx.beginPath(); ctx.arc(x(100), yT(s.thrust), 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#98a2ad';
    ctx.textAlign = 'right';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(Math.round(s.thrust * 101.97) + ' g', x(100) - 6, yT(s.thrust) - 7);
  }

  /* ---------- readouts ---------- */

  function render() {
    var s = solve();
    var set = function (id, html, warn) {
      var el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = html;
      el.className = warn ? 'warn' : '';
    };

    set('outThrust', Math.round(s.thrust * 101.97) + ' g<small>' + Math.round(s.rpm).toLocaleString('en-US') + ' rpm loaded</small>');
    set('outTw', s.tw.toFixed(1) + ':1<small>four motors at ' + state.mass + ' g</small>', s.tw < 5);
    set('outHover', Math.round(s.hover) + '%<small>of stick travel</small>', s.hover > 50);
    set('outCurrent', s.amps.toFixed(1) + ' A<small>' + (s.amps * 4).toFixed(0) + ' A across four</small>', s.amps > 40);
    set('outEndurance', s.endurance.toFixed(1) + ' min<small>race pace, 30% duty</small>', s.endurance < 1);
    set('outPitch', Math.round(s.pitchSpeed * 3.6) + ' km/h<small>no-slip, tip ' + Math.round(s.tip) + ' m/s</small>', s.tip > 250);

    var note = document.getElementById('benchNote');
    if (note) {
      note.textContent = s.tw.toFixed(1) + ' to 1 at ' + state.mass + ' g, hovering at ' + Math.round(s.hover) +
        '% throttle on ' + s.volts.toFixed(1) + ' V. Prop tips run at ' + Math.round(s.tip) + ' m/s' +
        (s.tip > 250 ? ', past the point where the prop starts to lose efficiency and the noise complaint starts.' : '.') +
        ' Real top speed lands near ' + Math.round(s.topSpeed) + ' km/h once drag has its say.';
    }

    draw();
  }

  /* ---------- controls ---------- */

  function bind() {
    var kv = document.getElementById('kv');
    if (!kv) return;
    kv.addEventListener('input', function () {
      state.kv = +this.value;
      document.getElementById('kvOut').textContent = state.kv;
      render();
    });
    document.getElementById('cells').addEventListener('input', function () {
      state.cells = +this.value;
      document.getElementById('cellsOut').textContent = state.cells + 'S';
      render();
    });
    document.getElementById('prop').addEventListener('input', function () {
      state.prop = +this.value;
      document.getElementById('propOut').textContent = state.prop.toFixed(1) + ' in';
      render();
    });
    document.getElementById('pitch').addEventListener('input', function () {
      state.pitch = +this.value;
      document.getElementById('pitchOut').textContent = state.pitch.toFixed(1) + ' in';
      render();
    });
    document.getElementById('mass').addEventListener('input', function () {
      state.mass = +this.value;
      document.getElementById('massOut').textContent = state.mass + ' g';
      render();
    });
    document.getElementById('altitude').addEventListener('input', function () {
      state.alt = +this.value;
      document.getElementById('altitudeOut').textContent = state.alt + ' m';
      render();
    });
  }

  /* ---------- opt-in prop harmonic ---------- */

  var audioCtx = null;

  function playProp() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    var s = solve();
    var blades = 3;
    var f0 = (s.rpm / 60) * blades;
    var now = audioCtx.currentTime;
    var master = audioCtx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.06, now + 0.25);
    master.gain.setValueAtTime(0.06, now + 1.9);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

    var lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(9000, f0 * 9);
    master.connect(lp);
    lp.connect(audioCtx.destination);

    var levels = [0.5, 0.24, 0.13, 0.07, 0.04];
    for (var i = 0; i < levels.length; i++) {
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(f0 * (i + 1) * 0.86, now);
      osc.frequency.linearRampToValueAtTime(f0 * (i + 1), now + 1.6);
      g.gain.value = levels[i];
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 2.7);
    }

    var btn = document.getElementById('propPlay');
    if (btn) {
      btn.textContent = 'Playing';
      setTimeout(function () { btn.textContent = 'Play the prop harmonic again'; }, 2800);
    }
  }

  function audioBind() {
    var btn = document.getElementById('propPlay');
    if (!btn) return;
    btn.addEventListener('click', playProp);
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
    var f = document.getElementById('buildForm');
    if (!f) return;
    var status = document.getElementById('formStatus');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.querySelector('#fName').value.trim();
      var email = f.querySelector('#fEmail').value.trim();
      var brief = f.querySelector('#fBrief').value.trim();
      if (!name) { status.textContent = 'Add a name.'; status.className = 'form-status error'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status.textContent = 'Check the email address.'; status.className = 'form-status error'; return; }
      if (brief.length < 20) { status.textContent = 'Tell me what you fly now and what you want it to do.'; status.className = 'form-status error'; return; }
      status.className = 'form-status';
      status.textContent = 'Got it, ' + name.split(' ')[0] + '. Reply within two days. Bring your current build sheet and your lap times.';
      f.reset();
    });
  }

  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(draw, 120);
  });

  bind();
  audioBind();
  render();
  menu();
  form();
})();
