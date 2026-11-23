/* Amara Diallo — mix desk
   Two decks, one crossfader, opt-in synthesised preview. No autoplay, no files. */

(function () {
  'use strict';

  /* ---------- nav ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- desk ---------- */
  var canvas = document.getElementById('waveCanvas');
  if (!canvas) { initRest(); return; }

  var BPM_A = 124;
  var BPM_B = 128;
  var KEY_A = 8;
  var KEY_B = 9;

  var ui = {
    pitchA: document.getElementById('pitchA'),
    pitchB: document.getElementById('pitchB'),
    cross: document.getElementById('cross'),
    filter: document.getElementById('filter'),
    nudge: document.getElementById('nudge'),
    pitchAOut: document.getElementById('pitchAOut'),
    pitchBOut: document.getElementById('pitchBOut'),
    crossGain: document.querySelector('.cross-gain'),
    gainA: document.getElementById('gainA'),
    gainB: document.getElementById('gainB'),
    filterOut: document.getElementById('filterOut'),
    nudgeOut: document.getElementById('nudgeOut'),
    bpmBOut: document.getElementById('bpmBOut'),
    outBpm: document.getElementById('outBpm'),
    outPitch: document.getElementById('outPitch'),
    outOffset: document.getElementById('outOffset'),
    outFilter: document.getElementById('outFilter'),
    outCross: document.getElementById('outCross'),
    outHarm: document.getElementById('outHarm'),
    phaseRead: document.getElementById('phaseRead'),
    keyRead: document.getElementById('keyRead'),
    matchRead: document.getElementById('matchRead'),
    playBtn: document.getElementById('playBtn'),
    playLabel: document.getElementById('playLabel'),
    audioState: document.getElementById('audioState'),
    flagA: document.getElementById('flagA'),
    flagB: document.getElementById('flagB')
  };

  function state() {
    var pa = parseFloat(ui.pitchA.value);
    var pb = parseFloat(ui.pitchB.value);
    var effA = BPM_A * (1 + pa / 100);
    var effB = BPM_B * (1 + pb / 100);
    var need = (effA / BPM_B - 1) * 100;
    var cross = parseFloat(ui.cross.value);
    var filterPos = parseFloat(ui.filter.value);
    var cutoff = 200 * Math.pow(100, filterPos / 100);
    var nudge = parseFloat(ui.nudge.value);
    var beatMs = 60000 / effA;
    var offsetBeats = nudge / beatMs;
    var camelot = ((KEY_B - KEY_A) % 12 + 12) % 12;
    var harmonic = camelot === 0 ? 'same key' : camelot === 1 ? '+1' : camelot === 11 ? '−1' : camelot === 2 ? '+2' : camelot === 7 ? 'energy' : '+' + camelot;
    var compatible = [0, 1, 11, 2, 7].indexOf(camelot) !== -1;

    return {
      pa: pa, pb: pb, effA: effA, effB: effB, need: need,
      cross: cross, gainA: (100 - cross) / 100, gainB: cross / 100,
      cutoff: cutoff, filterPos: filterPos, nudge: nudge,
      beatMs: beatMs, offsetBeats: offsetBeats,
      camelot: camelot, harmonic: harmonic, compatible: compatible
    };
  }

  var current = null;
  var raf = null;
  var visualPhase = 0;

  function update() {
    current = state();
    ui.pitchAOut.textContent = (current.pa > 0 ? '+' : '') + current.pa.toFixed(1) + '%';
    ui.pitchBOut.textContent = (current.pb > 0 ? '+' : current.pb < 0 ? '−' : '') + Math.abs(current.pb).toFixed(1) + '%';
    ui.gainA.textContent = Math.round(current.gainA * 100) + '%';
    ui.gainB.textContent = Math.round(current.gainB * 100) + '%';
    ui.filterOut.textContent = current.cutoff >= 1000 ? (current.cutoff / 1000).toFixed(1) + ' kHz' : Math.round(current.cutoff) + ' Hz';
    ui.nudgeOut.textContent = (current.nudge > 0 ? '+' : '') + current.nudge + ' ms';

    ui.bpmBOut.textContent = current.effB.toFixed(1) + ' BPM';
    ui.outBpm.textContent = current.effB.toFixed(1);
    ui.outPitch.textContent = (current.need > 0 ? '+' : '') + current.need.toFixed(1) + '%';
    ui.outOffset.textContent = current.nudge + ' ms';
    ui.outFilter.textContent = current.cutoff >= 1000 ? (current.cutoff / 1000).toFixed(1) + ' kHz' : Math.round(current.cutoff) + ' Hz';
    ui.outCross.textContent = 'A ' + Math.round(current.gainA * 100) + ' / B ' + Math.round(current.gainB * 100);
    ui.outHarm.textContent = current.harmonic + (current.compatible ? ' · OK' : ' · clash');

    var diff = Math.abs(current.effB - current.effA);
    var matched = diff < 0.15;
    ui.matchRead.textContent = matched ? 'LOCKED · ' + current.effA.toFixed(1) + ' BPM' : 'PITCH ' + (current.need > 0 ? '+' : '') + current.need.toFixed(2) + '% TO MATCH';
    ui.matchRead.style.color = matched ? '#d9ff57' : '#8b8b84';
    ui.phaseRead.textContent = 'PHASE ' + (current.offsetBeats >= 0 ? '+' : '−') + Math.abs(current.offsetBeats).toFixed(2) + ' BEAT';
    ui.keyRead.textContent = '8A → 9A · ' + current.harmonic + (current.compatible ? ' · compatible' : ' · tension');

    if (ui.flagB) ui.flagB.textContent = matched ? 'SYNC' : 'MATCH';
    if (ui.flagA) ui.flagA.textContent = 'MASTER';

    draw();
  }

  function amp(i, seed) {
    return 0.22 + 0.36 * Math.abs(Math.sin(i * 0.41 + seed)) + 0.28 * Math.abs(Math.sin(i * 1.73 + seed * 2.3)) * Math.abs(Math.sin(i * 0.13));
  }

  function draw() {
    if (!current) return;
    var ctx = canvas.getContext('2d');
    var cssW = canvas.clientWidth || 900;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssH = Math.round(Math.max(300, Math.min(400, cssW * 0.4)));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#070707';
    ctx.fillRect(0, 0, cssW, cssH);

    var left = 64;
    var right = cssW - 16;
    var laneH = Math.round((cssH - 96) / 2);
    var lanes = [
      { label: 'A', bpm: current.effA, color: '#d9ff57', y: 22, seed: 1.7, gain: current.gainA },
      { label: 'B', bpm: current.effB, color: '#f4f1ea', y: 22 + laneH + 18, seed: 4.2, gain: current.gainB }
    ];

    lanes.forEach(function (lane) {
      var cy = lane.y + laneH / 2;
      var h = laneH / 2 - 6;

      ctx.fillStyle = '#6f6f68';
      ctx.font = '500 11px "Spline Sans Mono", monospace';
      ctx.fillText(lane.label, 16, lane.y + 18);
      ctx.fillStyle = lane.color;
      ctx.font = '400 10px "Spline Sans Mono", monospace';
      ctx.fillText(lane.bpm.toFixed(1), 16, lane.y + 36);

      /* centre line */
      ctx.strokeStyle = '#1e1e1c';
      ctx.beginPath();
      ctx.moveTo(left, cy);
      ctx.lineTo(right, cy);
      ctx.stroke();

      /* waveform bars */
      var bars = Math.max(80, Math.floor((right - left) / 4));
      for (var i = 0; i < bars; i++) {
        var x = left + (i / bars) * (right - left);
        var a = amp(i + visualPhase * 6, lane.seed) * h * (0.55 + 0.45 * lane.gain);
        ctx.fillStyle = lane.color;
        ctx.globalAlpha = 0.28 + lane.gain * 0.6;
        ctx.fillRect(x, cy - a, 2, a * 2);
      }
      ctx.globalAlpha = 1;

      /* beat grid */
      var beatPx = (right - left) / 16;
      ctx.strokeStyle = 'rgba(217,255,87,.18)';
      for (var b = 0; b <= 16; b++) {
        var bx = left + b * beatPx;
        ctx.beginPath();
        ctx.moveTo(bx, lane.y);
        ctx.lineTo(bx, lane.y + laneH);
        ctx.stroke();
        if (b % 4 === 0) {
          ctx.fillStyle = '#5c5c56';
          ctx.font = '9px "Spline Sans Mono", monospace';
          ctx.fillText(String(b / 4 + 1), bx + 3, lane.y + 9);
        }
      }

      /* playhead */
      var phx = left + (right - left) * 0.46;
      ctx.strokeStyle = lane.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(phx, lane.y);
      ctx.lineTo(phx, lane.y + laneH);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = lane.color;
      ctx.beginPath();
      ctx.moveTo(phx - 5, lane.y);
      ctx.lineTo(phx + 5, lane.y);
      ctx.lineTo(phx, lane.y + 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#5c5c56';
      ctx.font = '9px "Spline Sans Mono", monospace';
      ctx.fillText(lane.gain > 0.005 ? Math.round(lane.gain * 100) + '% GAIN' : 'MUTED', right - 62, lane.y + 10);
    });

    /* crossfader graphic */
    var fy = cssH - 34;
    ctx.fillStyle = '#161615';
    ctx.fillRect(left, fy, right - left, 8);
    var split = left + (right - left) * current.gainB;
    ctx.fillStyle = '#d9ff57';
    ctx.fillRect(left, fy, split - left, 8);
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(split, fy, right - split, 8);
    ctx.fillStyle = '#070707';
    ctx.fillRect(split - 2, fy - 4, 4, 16);
    ctx.fillStyle = '#6f6f68';
    ctx.font = '9px "Spline Sans Mono", monospace';
    ctx.fillText('CROSSFADER', left, fy - 8);
    ctx.fillStyle = '#8b8b84';
    ctx.fillText('A ' + Math.round(current.gainA * 100) + ' / B ' + Math.round(current.gainB * 100), right - 84, fy - 8);

    /* phase marker between lanes */
    ctx.fillStyle = '#6f6f68';
    ctx.font = '9px "Spline Sans Mono", monospace';
    ctx.fillText('PHASE ' + (current.offsetBeats >= 0 ? '+' : '−') + Math.abs(current.offsetBeats).toFixed(2), left, (lanes[0].y + laneH + lanes[1].y) / 2 + 3);
  }

  ['input', 'change'].forEach(function (evt) {
    [ui.pitchA, ui.pitchB, ui.cross, ui.filter, ui.nudge].forEach(function (node) {
      node.addEventListener(evt, update);
    });
  });
  if (window.ResizeObserver) new ResizeObserver(function () { draw(); }).observe(canvas);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(); });

  /* ---------- audio ---------- */
  var audio = null;
  var playing = false;
  var timer = null;
  var nextA = 0;
  var nextB = 0;

  function ensureAudio() {
    if (audio) return audio;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { ui.audioState.textContent = 'NO WEB AUDIO'; return null; }
    var ctx = new AC();
    var master = ctx.createGain();
    master.gain.value = 0.5;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = current.cutoff;
    filter.Q.value = 0.6;
    var gainA = ctx.createGain();
    var gainB = ctx.createGain();
    gainA.gain.value = current.gainA;
    gainB.gain.value = current.gainB;
    gainA.connect(filter);
    gainB.connect(filter);
    filter.connect(master);
    master.connect(ctx.destination);
    audio = { ctx: ctx, master: master, filter: filter, gainA: gainA, gainB: gainB };
    return audio;
  }

  function kick(t, dest, base) {
    var ctx = audio.ctx;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.3, t + 0.1);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + 0.18);
  }

  function hat(t, dest) {
    var ctx = audio.ctx;
    var len = Math.floor(ctx.sampleRate * 0.035);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7500;
    var g = ctx.createGain();
    g.gain.value = 0.18;
    src.connect(hp); hp.connect(g); g.connect(dest);
    src.start(t);
  }

  function bass(t, dest, hz) {
    var ctx = audio.ctx;
    var osc = ctx.createOscillator();
    var lp = ctx.createBiquadFilter();
    var g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = hz;
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    osc.connect(lp); lp.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + 0.3);
  }

  var beatCountA = 0;
  var beatCountB = 0;

  function schedule() {
    var ctx = audio.ctx;
    var ahead = ctx.currentTime + 0.12;
    while (nextA < ahead) {
      kick(nextA, audio.gainA, 160);
      hat(nextA + (60000 / current.effA) / 1000 / 2, audio.gainA);
      if (beatCountA % 2 === 0) bass(nextA + 0.01, audio.gainA, 55);
      beatCountA++;
      nextA += 60 / current.effA;
    }
    while (nextB < ahead) {
      kick(nextB, audio.gainB, 150);
      hat(nextB + (60000 / current.effB) / 1000 / 2, audio.gainB);
      if (beatCountB % 2 === 1) bass(nextB + 0.01, audio.gainB, 73.4);
      beatCountB++;
      nextB += 60 / current.effB;
    }
  }

  function startPreview() {
    if (!ensureAudio()) return;
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    audio.gainA.gain.value = current.gainA;
    audio.gainB.gain.value = current.gainB;
    audio.filter.frequency.value = current.cutoff;
    playing = true;
    nextA = audio.ctx.currentTime + 0.08;
    nextB = nextA;
    beatCountA = 0;
    beatCountB = 0;
    if (timer) clearInterval(timer);
    timer = setInterval(schedule, 25);
    schedule();
    ui.playBtn.setAttribute('aria-pressed', 'true');
    ui.playLabel.textContent = 'Stop preview';
    ui.audioState.textContent = 'AUDIO ON';
    loop();
  }

  function stopPreview() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (audio && audio.ctx.state === 'running') audio.ctx.suspend();
    ui.playBtn.setAttribute('aria-pressed', 'false');
    ui.playLabel.textContent = 'Play preview';
    ui.audioState.textContent = 'AUDIO PAUSED';
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  function loop() {
    if (!playing) return;
    visualPhase = (visualPhase + 0.01) % 1000;
    draw();
    if (audio) {
      audio.gainA.gain.setTargetAtTime(current.gainA, audio.ctx.currentTime, 0.02);
      audio.gainB.gain.setTargetAtTime(current.gainB, audio.ctx.currentTime, 0.02);
      audio.filter.frequency.setTargetAtTime(current.cutoff, audio.ctx.currentTime, 0.05);
    }
    raf = requestAnimationFrame(loop);
  }

  ui.playBtn.addEventListener('click', function () {
    if (playing) stopPreview(); else startPreview();
  });

  update();
  initRest();

  /* ---------- filters, form ---------- */
  function initRest() {
    var chips = document.querySelectorAll('.chip');
    var releases = document.querySelectorAll('.release');
    if (chips.length && releases.length) {
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var cat = chip.getAttribute('data-filter');
          chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
          releases.forEach(function (r) {
            r.hidden = !(cat === 'all' || r.getAttribute('data-cat') === cat);
          });
        });
      });
    }

    var form = document.getElementById('briefForm');
    if (!form) return;
    var ok = document.getElementById('formOk');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var problems = [];
      function setErr(field, msg) {
        var box = document.getElementById(field.name + 'Err');
        if (box) box.textContent = msg || '';
        if (msg) problems.push(msg);
      }
      var name = form.elements.name;
      var email = form.elements.email;
      var pages = form.elements.pages;
      var message = form.elements.message;

      setErr(name, name.value.trim().length < 2 ? 'Name needed.' : '');
      setErr(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'Check that address.');
      setErr(pages, pages.value && (parseInt(pages.value, 10) < 1 || parseInt(pages.value, 10) > 400) ? 'Capacity between 1 and 400.' : '');
      setErr(message, message.value.trim().length < 20 ? 'Tell me about the room and the night.' : '');

      if (problems.length) { if (ok) ok.hidden = true; return; }
      if (ok) {
        ok.hidden = false;
        ok.querySelector('p').textContent = 'Thank you, ' + name.value.trim().split(' ')[0] +
          '. Your date is in the queue. I answer booking mail on Mondays and Thursdays, and I confirm travel before I confirm a fee.';
        ok.scrollIntoView({ block: 'nearest' });
      }
      form.reset();
      form.querySelectorAll('.err').forEach(function (n) { n.textContent = ''; });
    });
  }
})();
