// Roshni Beam — DMX desk, stage render, opt-in audio cues.
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
      }
    });
  }

  /* ---------- reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- the rig ---------- */
  var canvas = document.getElementById('stageCanvas');
  var faders = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var masterEl = document.getElementById('master');
  var masterVal = document.getElementById('masterVal');
  var paletteEl = document.getElementById('palette');
  var hazeEl = document.getElementById('haze');
  var sceneName = document.getElementById('sceneName');
  var chipMaster = document.getElementById('chipMaster');
  var chipCue = document.getElementById('chipCue');
  var chipAudio = document.getElementById('chipAudio');
  var stageMeta = document.getElementById('stageMeta');

  var PALETTES = {
    amber: ['#e8a33d', '#e8a33d', '#e8a33d', '#e8a33d', '#e8a33d', '#e8a33d', '#e8a33d'],
    bone: ['#efe7d4', '#efe7d4', '#efe7d4', '#efe7d4', '#efe7d4', '#efe7d4', '#efe7d4'],
    cyan: ['#6fb3c9', '#6fb3c9', '#6fb3c9', '#6fb3c9', '#6fb3c9', '#6fb3c9', '#6fb3c9'],
    magenta: ['#c05a7a', '#c05a7a', '#c05a7a', '#c05a7a', '#c05a7a', '#c05a7a', '#c05a7a'],
    mixed: ['#e8a33d', '#e8a33d', '#f0c07a', '#e8a33d', '#6fb3c9', '#c05a7a', '#6fb3c9']
  };
  var CUES = [
    { name: 'Preset', levels: [72, 64, 88, 64, 30, 30], palette: 'amber', haze: '65', master: 80, chase: false },
    { name: 'Warm', levels: [58, 50, 44, 52, 22, 22], palette: 'mixed', haze: '40', master: 70, chase: false },
    { name: 'Chase', levels: [80, 80, 80, 80, 55, 55], palette: 'cyan', haze: '90', master: 85, chase: true },
    { name: 'Blackout', levels: [0, 0, 0, 0, 0, 0], palette: 'amber', haze: '65', master: 100, chase: false }
  ];
  var cueIndex = 0;
  var chaseOn = false;
  var chaseIndex = 0;
  var chaseTimer = null;

  function values() {
    return faders.map(function (f) { return Number(f.value); });
  }
  function masterPct() { return Number(masterEl.value); }

  function setLevels(arr) {
    faders.forEach(function (f, i) {
      f.value = arr[i];
      var v = document.querySelector('[data-for="' + f.id + '"]');
      if (v) v.textContent = arr[i];
    });
  }

  function applyCue(i) {
    cueIndex = i;
    var c = CUES[i];
    setLevels(c.levels);
    paletteEl.value = c.palette;
    hazeEl.value = c.haze;
    masterEl.value = c.master;
    masterVal.textContent = c.master;
    if (sceneName) sceneName.textContent = c.name;
    document.querySelectorAll('.cue').forEach(function (b, j) {
      b.classList.toggle('active', j === i);
    });
    if (c.chase) startChase(); else stopChase(false);
    // audio cue follows the light cue only if audio has been armed
    if (audioArmed) playAudio(['tone', 'gong', 'sub', 'chime'][i] || 'tone');
    updateChips();
    draw();
  }

  function startChase() {
    chaseOn = true;
    if (chaseTimer) clearInterval(chaseTimer);
    chaseTimer = setInterval(function () {
      chaseIndex = (chaseIndex + 1) % 6;
      draw();
    }, 160);
  }
  function stopChase(resetBtn) {
    chaseOn = false;
    if (chaseTimer) { clearInterval(chaseTimer); chaseTimer = null; }
    if (resetBtn) { chaseIndex = 0; draw(); }
  }

  function updateChips() {
    if (chipMaster) chipMaster.textContent = 'MASTER ' + masterPct();
    if (chipCue) chipCue.textContent = 'Q' + (cueIndex + 1) + ' · ' + CUES[cueIndex].name.toUpperCase();
    if (chipAudio) {
      chipAudio.textContent = audioArmed ? 'AUDIO ARMED' : 'AUDIO OFF';
      chipAudio.classList.toggle('on', audioArmed);
    }
    if (stageMeta) stageMeta.textContent = '4.8 m prosc · 6 fixtures · house at ' + Math.round(masterPct() * 0.25) + '%';
  }

  /* ---------- canvas ---------- */
  var ctx = null;

  function sizeCanvas() {
    if (!canvas) return false;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.round(rect.width), h = Math.round(rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  function draw() {
    var box = sizeCanvas();
    if (!box || !ctx) return;
    var w = box.w, h = box.h;
    var levels = values();
    var master = masterPct() / 100;
    var haze = Number(hazeEl.value) / 100;
    var pal = PALETTES[paletteEl.value] || PALETTES.amber;

    ctx.clearRect(0, 0, w, h);

    // room
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#05070a');
    bg.addColorStop(0.6, '#0a0d11');
    bg.addColorStop(1, '#070809');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    var horizon = h * 0.7;
    // back wall subtle
    var wall = ctx.createLinearGradient(0, h * 0.08, 0, horizon);
    wall.addColorStop(0, 'rgba(255,255,255,.02)');
    wall.addColorStop(1, 'rgba(255,255,255,.05)');
    ctx.fillStyle = wall;
    ctx.fillRect(w * 0.06, h * 0.06, w * 0.88, horizon - h * 0.06);

    // stage floor
    var floor = ctx.createLinearGradient(0, horizon, 0, h);
    floor.addColorStop(0, '#14181c');
    floor.addColorStop(1, '#0a0c0e');
    ctx.fillStyle = floor;
    ctx.beginPath();
    ctx.moveTo(w * 0.16, horizon);
    ctx.lineTo(w * 0.84, horizon);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // floor boards
    ctx.strokeStyle = 'rgba(233,228,216,.05)';
    ctx.lineWidth = 1;
    for (var i = 1; i < 8; i++) {
      var t = i / 8;
      ctx.beginPath();
      ctx.moveTo(w * (0.16 + 0.68 * t), horizon);
      ctx.lineTo(w * t, h);
      ctx.stroke();
    }
    for (var j = 1; j < 5; j++) {
      var y = horizon + (h - horizon) * (j / 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // horizon line
    ctx.strokeStyle = 'rgba(233,228,216,.18)';
    ctx.beginPath();
    ctx.moveTo(w * 0.05, horizon);
    ctx.lineTo(w * 0.95, horizon);
    ctx.stroke();

    // truss
    var trussY = h * 0.22;
    ctx.strokeStyle = 'rgba(233,228,216,.55)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.07, trussY);
    ctx.lineTo(w * 0.93, trussY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(233,228,216,.25)';
    ctx.lineWidth = 1;
    for (var k = 0; k < 15; k++) {
      var tx = w * (0.07 + (0.86 * k) / 14);
      ctx.beginPath();
      ctx.moveTo(tx, trussY - 5);
      ctx.lineTo(tx + 6, trussY + 5);
      ctx.stroke();
    }

    // fixture positions
    var front = [0.14, 0.31, 0.5, 0.69, 0.86].map(function (f) { return { x: w * f, y: trussY + 4 }; });
    var back = [{ x: w * 0.36, y: h * 0.34 }, { x: w * 0.64, y: h * 0.34 }];
    var fixtures = front.concat(back);

    // pools on the floor (front five spread near the front edge, movers just behind)
    var pools = [
      { x: w * 0.22, y: h * 0.88 },
      { x: w * 0.35, y: h * 0.83 },
      { x: w * 0.5, y: h * 0.9 },
      { x: w * 0.65, y: h * 0.83 },
      { x: w * 0.78, y: h * 0.88 },
      { x: w * 0.42, y: h * 0.76 },
      { x: w * 0.58, y: h * 0.76 }
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (var n = 0; n < fixtures.length; n++) {
      var base = n < levels.length ? levels[n] : Math.round((levels[4] + levels[5]) / 2);
      var lvl = (base / 100) * master;
      if (chaseOn) lvl *= (n === chaseIndex ? 1 : 0.22);
      if (lvl <= 0.01) continue;
      var fx = fixtures[n].x, fy = fixtures[n].y;
      var px = pools[n].x, py = pools[n].y;
      var poolW = w * (n < 5 ? 0.11 : 0.13);

      var beam = ctx.createLinearGradient(fx, fy, px, py);
      var col = pal[n];
      beam.addColorStop(0, hexA(col, 0.62 * lvl * (0.5 + haze)));
      beam.addColorStop(0.65, hexA(col, 0.16 * lvl * (0.4 + haze)));
      beam.addColorStop(1, hexA(col, 0.04 * lvl));
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(fx - 4, fy);
      ctx.lineTo(fx + 4, fy);
      ctx.lineTo(px + poolW / 2, py);
      ctx.lineTo(px - poolW / 2, py);
      ctx.closePath();
      ctx.fill();

      // pool
      var pl = ctx.createRadialGradient(px, py, 2, px, py, poolW * 0.62);
      pl.addColorStop(0, hexA(col, 0.55 * lvl));
      pl.addColorStop(0.5, hexA(col, 0.16 * lvl));
      pl.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = pl;
      ctx.beginPath();
      ctx.ellipse(px, py, poolW * 0.62, poolW * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // fixture body + lens glow
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#0c0e10';
      ctx.strokeStyle = 'rgba(233,228,216,.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(fx - 7, fy - 6, 14, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.9 * lvl + 0.1;
      ctx.beginPath();
      ctx.arc(fx, fy + 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'lighter';
    }
    ctx.restore();

    // back wall scrim shadow
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(0, horizon, w, 1);

    // labels
    ctx.fillStyle = 'rgba(233,228,216,.35)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('TRUSS A', w * 0.07, trussY - 12);
  }

  function hexA(hex, a) {
    if (!hex) return 'rgba(0,0,0,0)';
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  }

  faders.forEach(function (f) {
    f.addEventListener('input', function () {
      var v = document.querySelector('[data-for="' + f.id + '"]');
      if (v) v.textContent = f.value;
      if (cueIndex !== 2) stopChase(false);
      draw();
    });
  });
  if (masterEl) masterEl.addEventListener('input', function () {
    masterVal.textContent = masterEl.value;
    updateChips();
    draw();
  });
  if (paletteEl) paletteEl.addEventListener('change', draw);
  if (hazeEl) hazeEl.addEventListener('change', draw);

  document.querySelectorAll('.cue').forEach(function (b) {
    b.addEventListener('click', function () { applyCue(Number(b.getAttribute('data-cue'))); });
  });
  var goBtn = document.getElementById('goBtn');
  if (goBtn) goBtn.addEventListener('click', function () { applyCue((cueIndex + 1) % CUES.length); });
  var stopBtn = document.getElementById('stopBtn');
  if (stopBtn) stopBtn.addEventListener('click', function () { stopChase(true); });

  /* ---------- audio, only after a gesture ---------- */
  var audioArmed = false;
  var audioCtx = null;
  var masterGain = null;
  var toneNodes = null;

  function ensureCtx() {
    if (audioCtx) return audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    window.__audioCreated = true;
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(audioCtx.destination);
    return audioCtx;
  }

  function noiseBuffer() {
    var len = audioCtx.sampleRate * 2;
    var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buf;
  }

  function playTone() {
    if (!audioArmed) return;
    if (toneNodes) { stopTone(); return; }
    var ac = ensureCtx(); if (!ac) return;
    var src = ac.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    var g = ac.createGain();
    g.gain.value = 0.0001;
    src.connect(lp); lp.connect(g); g.connect(masterGain);
    var hum = ac.createOscillator();
    hum.type = 'sine'; hum.frequency.value = 50;
    var hg = ac.createGain(); hg.gain.value = 0.012;
    hum.connect(hg); hg.connect(masterGain);
    src.start(); hum.start();
    g.gain.exponentialRampToValueAtTime(0.16, ac.currentTime + 1.2);
    toneNodes = { src: src, hum: hum, gain: g };
    markPad('tone', true);
  }

  function stopTone() {
    if (!toneNodes) return;
    var ac = audioCtx;
    var t = toneNodes;
    toneNodes = null;
    try {
      t.gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4);
      setTimeout(function () { try { t.src.stop(); t.hum.stop(); } catch (e) {} }, 500);
    } catch (e) {}
    markPad('tone', false);
  }

  function gong() {
    if (!audioArmed) return;
    var ac = ensureCtx(); if (!ac) return;
    var t0 = ac.currentTime;
    voicing(ac, 198, 1.5, t0);
    var carrier = ac.createOscillator(); carrier.type = 'sine'; carrier.frequency.value = 132;
    var mod = ac.createOscillator(); mod.type = 'sine'; mod.frequency.value = 132 * 2.71;
    var modGain = ac.createGain();
    modGain.gain.setValueAtTime(320, t0);
    modGain.gain.exponentialRampToValueAtTime(1, t0 + 2.4);
    mod.connect(modGain); modGain.connect(carrier.frequency);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
    var partial = ac.createOscillator(); partial.type = 'sine'; partial.frequency.value = 264;
    var pg = ac.createGain(); pg.gain.setValueAtTime(0.0001, t0);
    pg.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01);
    pg.gain.exponentialRampToValueAtTime(0.0001, t0 + 2);
    carrier.connect(g); g.connect(masterGain);
    partial.connect(pg); pg.connect(masterGain);
    carrier.start(t0); mod.start(t0); partial.start(t0);
    carrier.stop(t0 + 3.3); mod.stop(t0 + 3.3); partial.stop(t0 + 2.1);
    flashPad('gong');
  }

  function voicing(ac, f, ratio, t0) {
    var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * ratio;
    var g = ac.createGain(); g.gain.value = 0.0001;
    o.connect(g); g.connect(masterGain);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
    o.start(t0); o.stop(t0 + 1.7);
    return o;
  }

  function subDrop() {
    if (!audioArmed) return;
    var ac = ensureCtx(); if (!ac) return;
    var t0 = ac.currentTime;
    var o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t0);
    o.frequency.exponentialRampToValueAtTime(28, t0 + 1.4);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8);
    o.connect(g); g.connect(masterGain);
    o.start(t0); o.stop(t0 + 1.9);
    flashPad('sub');
  }

  function chime() {
    if (!audioArmed) return;
    var ac = ensureCtx(); if (!ac) return;
    var t0 = ac.currentTime;
    [523.25, 784, 1046.5].forEach(function (f, i) {
      var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0 + i * 0.03);
      g.gain.exponentialRampToValueAtTime(0.12 / (i + 1), t0 + i * 0.03 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.03 + 2.2);
      o.connect(g); g.connect(masterGain);
      o.start(t0 + i * 0.03); o.stop(t0 + i * 0.03 + 2.3);
    });
    flashPad('chime');
  }

  function flashPad(key) {
    var pad = document.querySelector('[data-audio="' + key + '"]');
    if (!pad) return;
    pad.classList.add('hit');
    setTimeout(function () { pad.classList.remove('hit'); }, 320);
  }
  function markPad(key, on) {
    var pad = document.querySelector('[data-audio="' + key + '"]');
    if (pad) pad.classList.toggle('hit', !!on);
  }

  function playAudio(key) {
    if (!audioArmed) return;
    if (key === 'tone') { if (!toneNodes) playTone(); }
    else if (key === 'gong') gong();
    else if (key === 'sub') subDrop();
    else if (key === 'chime') chime();
  }

  var armBtn = document.getElementById('armAudio');
  if (armBtn) {
    armBtn.addEventListener('click', function () {
      audioArmed = true;
      var ac = ensureCtx();
      if (ac && ac.state === 'suspended') ac.resume();
      armBtn.setAttribute('aria-pressed', 'true');
      armBtn.textContent = 'Audio armed';
      document.querySelectorAll('.pad').forEach(function (p) { p.disabled = false; });
      updateChips();
    });
  }
  document.querySelectorAll('.pad').forEach(function (pad) {
    pad.addEventListener('click', function () { playAudio(pad.getAttribute('data-audio')); });
  });

  if (canvas) {
    draw();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(draw, 140);
    });
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () { draw(); });
      ro.observe(canvas.parentElement);
    }
  }

  /* ---------- contact ---------- */
  function niceDate(v) {
    if (!v) return '';
    var d = new Date(v + 'T00:00:00');
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  var cform = document.getElementById('contactForm');
  if (cform) {
    var status = document.getElementById('formStatus');
    var ok = document.getElementById('formOk');
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = cform.elements.name.value.trim();
      var email = cform.elements.email.value.trim();
      var date = cform.elements.date.value;
      var venue = cform.elements.venue.value.trim();
      var msg = cform.elements.message.value.trim();
      var err = '';
      if (name.length < 2) err = 'Please add your name.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err = 'That email address looks incomplete.';
      else if (!date) err = 'Please give the show date, even approximate.';
      else if (venue.length < 3) err = 'Which room is it in?';
      else if (msg.length < 20) err = 'Tell me the show and the running time.';
      if (err) {
        status.textContent = err;
        status.classList.remove('ok');
        ok.classList.remove('show');
        return;
      }
      status.textContent = 'Received. A reply within two working days.';
      status.classList.add('ok');
      ok.classList.add('show');
      ok.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your enquiry is logged for ' + niceDate(date) + ' at ' + venue + '. I will come back with a fee, a technical list and an honest answer about the room.';
      cform.reset();
    });
  }
})();
