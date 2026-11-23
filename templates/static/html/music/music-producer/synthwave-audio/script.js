/* VOSS — interactions.
   Audio exists ONLY inside the patch player, and only after a
   visitor presses Play: the trade is synthesised sound, so the
   synth is the portfolio — but nothing autoplays, nothing plays
   on hover, and the AudioContext is not even created until the
   first deliberate press. (The stub's always-on synth pads were
   deleted on exactly that rule.) */
document.documentElement.classList.add('js');

/* View-transition aborts surface as unhandled InvalidStateError
   rejections; swallow only that exact class (proven pattern). */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile nav ---------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('mobile-nav');
  if (!btn || !nav) return;
  var open = false;
  function setNav(state, moveFocus) {
    open = state;
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-locked', open);
    if (moveFocus === false) return;
    if (open) { var f = nav.querySelector('a'); if (f) f.focus(); }
    else { btn.focus(); }
  }
  btn.addEventListener('click', function () { setNav(!open); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false, false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setNav(false); });
  window.addEventListener('resize', function () { if (open && window.innerWidth > 900) setNav(false, false); });
})();

/* ---------- reveal on scroll (reading order only) ---------- */
(function () {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();

/* =====================================================================
   THE PATCH PLAYER — a subtractive synth playing five original
   cues. Voices: saw bass + square sub, square arp, detuned-saw
   pad, and a drum kit built from a sine drop and filtered noise.
   Everything runs through ONE lowpass filter — the CUTOFF fader
   on the panel is wired to that filter's frequency, live.
   ===================================================================== */
(function () {
  var root = document.getElementById('player-box');
  if (!root) return;

  var SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(name) {
    var m = /^([A-G][#b]?)(-?\d)$/.exec(name);
    var midi = (parseInt(m[2], 10) + 1) * 12 + SEMI[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  var TRACKS = [
    {
      title: 'Night Freeway', use: 'Trailer cue', bpm: 105, key: 'D minor', len: '1:30',
      cutoff: 1800,
      patch: { osc: 'Sawtooth ×2, detune +6¢', sub: 'Square, −1 octave', q: '9', env: 'A 0.01 · D 0.24 · S 0.35 · R 0.28', fx: '⅜-note delay, feedback 0.32', drums: 'Four-on-floor kick · noise snare · offbeat hats' },
      bass: ['D2', null, 'D2', null, 'D2', null, 'D2', 'D3', 'D2', null, 'D2', null, 'Bb1', null, 'C2', null],
      arp: ['D4', 'F4', 'A4', 'D5', 'A4', 'F4', 'D4', 'F4', 'A4', 'D5', 'C5', 'A4', 'Bb4', 'A4', 'F4', 'D4'],
      padA: ['D3', 'F3', 'A3'], padB: ['Bb2', 'D3', 'F3'],
      kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], open: []
    },
    {
      title: 'Vector Coast', use: 'Game score — Neon Drifts', bpm: 118, key: 'A minor', len: 'Loop set',
      cutoff: 2600,
      patch: { osc: 'Sawtooth + pulse 25%', sub: 'Square, −1 octave', q: '7', env: 'A 0.005 · D 0.18 · S 0.3 · R 0.2', fx: '⅜-note delay, feedback 0.28', drums: 'Kick 1/5/9/13 · snare 5/13 · 8th-note hats' },
      bass: ['A1', null, 'A1', 'A1', null, 'A1', null, 'C2', 'A1', null, 'A1', 'A1', null, 'G1', null, 'E2'],
      arp: ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'A4', 'C5', 'E5', 'A5', 'G5', 'E5', 'F5', 'E5', 'C5', 'B4'],
      padA: ['A2', 'C3', 'E3'], padB: ['F2', 'A2', 'C3'],
      kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], open: [15]
    },
    {
      title: 'Chrome Orchard', use: 'Title theme', bpm: 92, key: 'F major', len: '0:45',
      cutoff: 1200,
      patch: { osc: 'Sawtooth ×2, detune −4¢ (slow chorus)', sub: 'Sine, −1 octave', q: '5', env: 'A 0.4 · D 0.6 · S 0.5 · R 0.8 (pad-led)', fx: 'Tape echo, 420 ms, feedback 0.38', drums: 'Half-time — kick 1, snare 9, sparse hats' },
      bass: ['F2', null, null, 'F2', null, null, 'C2', null, 'F2', null, null, 'F2', null, 'G2', null, 'A2'],
      arp: ['F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'F4', null, 'E4', 'G4', 'C5', 'E5', 'C5', 'G4', 'A4', null],
      padA: ['F2', 'A2', 'C3'], padB: ['C3', 'E3', 'G3'],
      kick: [0], snare: [8], hat: [4, 12], open: []
    },
    {
      title: 'Static Bloom', use: 'Sync library track', bpm: 100, key: 'C minor', len: '2:48',
      cutoff: 3200,
      patch: { osc: 'Sawtooth + square blend', sub: 'Square, −1 octave', q: '11', env: 'A 0.005 · D 0.15 · S 0.25 · R 0.18', fx: '⅜-note delay, feedback 0.35', drums: 'Driving 8th hats · kick 1/5/9/13 · snare 5/13' },
      bass: ['C2', 'C2', null, 'C2', null, 'C2', 'G1', null, 'C2', 'C2', null, 'C2', null, 'Eb2', null, 'G1'],
      arp: ['C5', 'Eb5', 'G5', 'C6', 'G5', 'Eb5', 'C5', 'Eb5', 'Ab5', 'G5', 'Eb5', 'C5', 'D5', 'Eb5', 'G5', null],
      padA: ['C3', 'Eb3', 'G3'], padB: ['Ab2', 'C3', 'Eb3'],
      kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: []
    },
    {
      title: 'Midnight Toll', use: 'Game score — in production', bpm: 124, key: 'E minor', len: 'Loop set',
      cutoff: 2100,
      patch: { osc: 'Sawtooth, hard sync flavour', sub: 'Square, −1 octave', q: '8', env: 'A 0.005 · D 0.2 · S 0.3 · R 0.22', fx: '⅜-note delay, feedback 0.3', drums: 'Gallop kick pattern · snare 5/13 · offbeat hats' },
      bass: ['E2', null, 'E2', 'E2', null, 'E2', null, 'E2', 'E2', null, 'E2', 'E2', null, 'D2', null, 'B1'],
      arp: ['E5', 'D5', 'B4', 'G4', 'B4', 'D5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'A4', 'B4', 'D5', null],
      padA: ['E2', 'G2', 'B2'], padB: ['C3', 'E3', 'G3'],
      kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], open: [15]
    }
  ];

  var tabs = Array.prototype.slice.call(root.querySelectorAll('.track-tab'));
  var elTitle = document.getElementById('np-title');
  var elMeta = document.getElementById('np-meta');
  var patchRows = {
    osc: document.getElementById('patch-osc'), sub: document.getElementById('patch-sub'),
    vcf: document.getElementById('patch-vcf'), env: document.getElementById('patch-env'),
    fx: document.getElementById('patch-fx'), drums: document.getElementById('patch-drums')
  };
  var btnPlay = document.getElementById('btn-play');
  var btnStop = document.getElementById('btn-stop');
  var readout = document.getElementById('step-readout');
  var cells = Array.prototype.slice.call(root.querySelectorAll('.step-cell'));
  var cutoff = document.getElementById('cutoff');
  var cutoffVal = document.getElementById('cutoff-val');

  var current = 0;
  var actx = null, voiceBus = null, filterNode = null, master = null, delaySend = null, noiseBuf = null;
  var playing = false, schedTimer = null, rafId = null;
  var step = 0, bar = 0, nextTime = 0, uiStep = -1, scheduled = [];

  function fmtHz(v) { return v >= 1000 ? (Math.round(v / 100) / 10) + ' kHz' : Math.round(v) + ' Hz'; }

  function ensureCtx() {
    if (actx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    actx = new AC();
    voiceBus = actx.createGain(); voiceBus.gain.value = 0.9;
    filterNode = actx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = parseFloat(cutoff.value, 10) || TRACKS[current].cutoff;
    filterNode.Q.value = parseFloat(TRACKS[current].patch.q, 10) || 8;
    master = actx.createGain(); master.gain.value = 0.5;
    var comp = actx.createDynamicsCompressor();
    voiceBus.connect(filterNode);
    filterNode.connect(master);
    master.connect(comp); comp.connect(actx.destination);
    /* dotted-eighth style echo: send from the bus, return into the filter */
    var delay = actx.createDelay(1.0); delay.delayTime.value = 0.34;
    var fb = actx.createGain(); fb.gain.value = 0.32;
    var wet = actx.createGain(); wet.gain.value = 0.5;
    delaySend = actx.createGain(); delaySend.gain.value = 1;
    voiceBus.connect(delaySend); delaySend.connect(delay);
    delay.connect(fb); fb.connect(delay);
    delay.connect(wet); wet.connect(filterNode);
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function envGain(t, peak, dur, sustain) {
    var g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0012), t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }
  function bassNote(f, t, dur) {
    var g = envGain(t, 0.34, dur, 0.1);
    var o1 = actx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = f;
    var o2 = actx.createOscillator(); o2.type = 'square'; o2.frequency.value = f / 2;
    var g2 = actx.createGain(); g2.gain.value = 0.55;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(voiceBus);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function arpNote(f, t) {
    var g = envGain(t, 0.13, 0.14, 0.02);
    var o = actx.createOscillator(); o.type = 'square'; o.frequency.value = f;
    o.connect(g); g.connect(voiceBus); g.connect(delaySend);
    o.start(t); o.stop(t + 0.2);
  }
  function padChord(notes, t, dur) {
    notes.forEach(function (n) {
      [-6, 6].forEach(function (cents) {
        var o = actx.createOscillator();
        o.type = 'sawtooth'; o.frequency.value = freq(n); o.detune.value = cents;
        var g = actx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.028, t + Math.min(0.45, dur * 0.3));
        g.gain.setValueAtTime(0.028, t + dur - 0.25);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(voiceBus);
        o.start(t); o.stop(t + dur + 0.05);
      });
    });
  }
  function kick(t) {
    var o = actx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(128, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(g); g.connect(voiceBus);
    o.start(t); o.stop(t + 0.3);
  }
  function noiseHit(t, type, freqHz, q, peak, dur) {
    var src = actx.createBufferSource(); src.buffer = noiseBuf;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    var f = actx.createBiquadFilter(); f.type = type; f.frequency.value = freqHz; f.Q.value = q;
    var g = actx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(voiceBus);
    src.start(t); src.stop(t + dur + 0.05);
  }
  function snare(t) {
    noiseHit(t, 'bandpass', 1800, 0.9, 0.4, 0.13);
    var o = actx.createOscillator(); o.type = 'triangle'; o.frequency.value = 190;
    var g = actx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); g.connect(voiceBus);
    o.start(t); o.stop(t + 0.1);
  }

  function scheduleStep(s, t) {
    var tr = TRACKS[current];
    var stepDur = 60 / tr.bpm / 4;
    if (tr.kick.indexOf(s) !== -1) kick(t);
    if (tr.snare.indexOf(s) !== -1) snare(t);
    if (tr.hat.indexOf(s) !== -1) noiseHit(t, 'highpass', 7500, 0.7, 0.13, 0.045);
    if (tr.open.indexOf(s) !== -1) noiseHit(t, 'highpass', 7500, 0.7, 0.13, 0.26);
    if (tr.bass[s]) bassNote(freq(tr.bass[s]), t, stepDur * 1.8);
    if (tr.arp[s]) arpNote(freq(tr.arp[s]), t);
    if (s === 0) padChord(tr.padA, t, stepDur * 8);
    if (s === 8) padChord(tr.padB, t, stepDur * 8);
    scheduled.push({ step: s, bar: bar, time: t });
  }
  function scheduler() {
    var stepDur = 60 / TRACKS[current].bpm / 4;
    while (nextTime < actx.currentTime + 0.14) {
      scheduleStep(step, nextTime);
      nextTime += stepDur;
      step++;
      if (step === 16) { step = 0; bar++; }
    }
  }
  function draw() {
    if (!playing) return;
    var now = actx.currentTime;
    while (scheduled.length && scheduled[0].time <= now) {
      var s = scheduled.shift();
      if (s.step !== uiStep || s.bar !== draw._bar) {
        uiStep = s.step; draw._bar = s.bar;
        cells.forEach(function (c, i) { c.classList.toggle('on', i === uiStep); });
        readout.innerHTML = 'STEP <strong>' + String(uiStep + 1).padStart(2, '0') + ' / 16</strong> · BAR ' + (s.bar + 1) + ' · ' + TRACKS[current].bpm + ' BPM';
      }
    }
    rafId = requestAnimationFrame(draw);
  }

  function play() {
    ensureCtx();
    if (actx.state === 'suspended') actx.resume();
    master.gain.cancelScheduledValues(actx.currentTime);
    master.gain.setTargetAtTime(0.5, actx.currentTime, 0.03);
    playing = true;
    root.classList.add('playing');
    step = 0; bar = 0; uiStep = -1; scheduled = [];
    nextTime = actx.currentTime + 0.08;
    schedTimer = setInterval(scheduler, 27);
    rafId = requestAnimationFrame(draw);
    btnPlay.disabled = true; btnStop.disabled = false;
    btnPlay.textContent = '❚❚ PLAYING';
  }
  function stop() {
    if (!actx) return;
    playing = false;
    clearInterval(schedTimer);
    if (rafId) cancelAnimationFrame(rafId);
    master.gain.setTargetAtTime(0.0001, actx.currentTime, 0.03);
    root.classList.remove('playing');
    cells.forEach(function (c) { c.classList.remove('on'); });
    readout.innerHTML = 'STEP <strong>— / 16</strong> · STOPPED';
    btnPlay.disabled = false; btnStop.disabled = true;
    btnPlay.textContent = '▶ PLAY';
    uiStep = -1;
  }

  function loadTrack(i, keepPlaying) {
    var wasPlaying = playing;
    if (wasPlaying) { clearInterval(schedTimer); if (rafId) cancelAnimationFrame(rafId); playing = false; }
    current = i;
    var tr = TRACKS[i];
    tabs.forEach(function (t, j) { t.setAttribute('aria-pressed', String(j === i)); });
    elTitle.textContent = tr.title;
    elMeta.textContent = tr.use + ' · ' + tr.bpm + ' BPM · ' + tr.key + ' · ' + tr.len;
    patchRows.osc.textContent = tr.patch.osc;
    patchRows.sub.textContent = tr.patch.sub;
    patchRows.vcf.textContent = '24 dB/oct lowpass · cutoff ' + fmtHz(tr.cutoff) + ' · resonance Q ' + tr.patch.q;
    patchRows.env.textContent = tr.patch.env;
    patchRows.fx.textContent = tr.patch.fx;
    patchRows.drums.textContent = tr.patch.drums;
    cutoff.value = tr.cutoff;
    cutoffVal.textContent = fmtHz(tr.cutoff);
    if (filterNode) {
      filterNode.frequency.value = tr.cutoff;
      filterNode.Q.value = parseFloat(tr.patch.q, 10) || 8;
    }
    cells.forEach(function (c) { c.classList.remove('on'); });
    if (wasPlaying && keepPlaying !== false) play();
    else if (!wasPlaying) {
      readout.innerHTML = 'STEP <strong>— / 16</strong> · READY';
    }
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { loadTrack(i); });
  });
  btnPlay.addEventListener('click', play);
  btnStop.addEventListener('click', stop);
  cutoff.addEventListener('input', function () {
    var v = parseFloat(cutoff.value, 10);
    cutoffVal.textContent = fmtHz(v);
    if (filterNode) filterNode.frequency.value = v;
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && playing) stop();
  });

  loadTrack(0, false);

  /* Probe / test hooks — the instrument reports its own state. */
  window.PatchPlayer = {
    ctx: function () { return actx; },
    filterFreq: function () { return filterNode ? filterNode.frequency.value : null; },
    playing: function () { return playing; },
    step: function () { return uiStep; },
    track: function () { return current; }
  };
})();

/* ---------- contact form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var conf = document.getElementById('confirmation');
  var fields = {
    name: { el: form.elements.name, test: function (v) { return v.trim().length >= 2; } },
    email: { el: form.elements.email, test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
    type: { el: form.elements.type, test: function (v) { return v !== ''; } },
    message: { el: form.elements.message, test: function (v) { return v.trim().length >= 20; } }
  };
  Object.keys(fields).forEach(function (k) {
    fields[k].el.addEventListener('input', function () {
      fields[k].el.closest('.field').classList.remove('invalid');
    });
    fields[k].el.addEventListener('change', function () {
      fields[k].el.closest('.field').classList.remove('invalid');
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(fields).forEach(function (k) {
      var f = fields[k];
      var ok = f.test(f.el.value || '');
      f.el.closest('.field').classList.toggle('invalid', !ok);
      if (!ok && !firstBad) firstBad = f.el;
    });
    if (firstBad) { firstBad.focus(); return; }
    var ref = 'VOSS-2026-' + String(Math.floor(100 + Math.random() * 900));
    document.getElementById('conf-ref').textContent = ref;
    form.style.display = 'none';
    conf.classList.add('show');
    conf.setAttribute('tabindex', '-1');
    conf.focus();
  });
})();
