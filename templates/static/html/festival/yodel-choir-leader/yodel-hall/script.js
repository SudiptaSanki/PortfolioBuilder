/* Alpenklang — practice room and page behaviour.
   Sound is opt-in: no AudioContext exists until a sound control is pressed. */

(function () {
  'use strict';

  /* ---------- navigation ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.movement .body, .movement .margin, .hero-text, .hero-draw, .foot-grid');
  if (reveals.length && 'IntersectionObserver' in window) {
    reveals.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- repertoire filter ---------- */
  var filters = document.querySelectorAll('.filter');
  if (filters.length) {
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-on');
        btn.setAttribute('aria-pressed', 'true');
        var want = btn.getAttribute('data-filter');
        document.querySelectorAll('.rep-row').forEach(function (row) {
          var keep = want === 'all' || row.getAttribute('data-form') === want;
          row.classList.toggle('is-hidden', !keep);
        });
        var count = document.querySelectorAll('.rep-row:not(.is-hidden)').length;
        var out = document.getElementById('repCount');
        if (out) out.textContent = count + (count === 1 ? ' number' : ' numbers');
      });
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('bookingForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      var fields = form.querySelectorAll('[data-required]');
      fields.forEach(function (input) {
        var wrap = input.closest('.form-field');
        var value = (input.value || '').trim();
        var bad = !value;
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        if (!bad && input.type === 'number') bad = Number(value) < 1 || Number(value) > 60;
        wrap.classList.toggle('has-error', bad);
        if (bad) { ok = false; if (!wrap.dataset.touched) { input.focus(); wrap.dataset.touched = '1'; } }
      });
      var okBox = document.getElementById('formOk');
      var errBox = document.getElementById('formFail');
      if (okBox) okBox.classList.toggle('is-shown', ok);
      if (errBox) errBox.classList.toggle('is-shown', !ok);
      if (okBox && ok) okBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (ok) form.reset();
    });
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        var wrap = input.closest('.form-field');
        if (wrap) wrap.classList.remove('has-error');
      });
    });
  }

  /* ---------- practice room ---------- */
  var panel = document.getElementById('practicePanel');
  if (!panel) return;

  var VOICES = {
    alto:    { low: 55, name: 'Alto',    range: 'F3–C5',  breakNote: 'A4', color: '#A93226' },
    tenor:   { low: 48, name: 'Tenor',   range: 'C3–G4',  breakNote: 'E4', color: '#2C3A34' },
    soprano: { low: 57, name: 'Soprano', range: 'A3–E5',  breakNote: 'D5', color: '#7A5A16' },
    bass:    { low: 43, name: 'Bass',    range: 'G2–D4',  breakNote: 'C4', color: '#3B4A63' }
  };
  var INTERVALS = { 7: 'a fifth', 9: 'a sixth', 12: 'an octave' };
  var NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

  var state = { voice: 'alto', interval: 7, chord: [98, 196, 245, 294] };

  function noteName(midi) {
    return NOTES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
  }
  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  /* audio is created here and nowhere else */
  var ctx = null, master = null, live = [];
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = (parseInt(document.getElementById('vol').value, 10) || 62) / 100 * 0.5;
      master.connect(ctx.destination);
      window.__audioCreated = true;
      setState('Audio ready. ' + VOICES[state.voice].name + ' voice selected — nothing plays until you press a control.');
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function setState(text) {
    var el = document.getElementById('audioState');
    if (el) el.textContent = text;
  }

  function voiceNode(freq, when, dur, kind) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = kind === 'chest' ? 1500 : 4200;
    filt.Q.value = 0.6;
    o.type = kind === 'chest' ? 'sawtooth' : 'sine';
    o.frequency.setValueAtTime(freq, when);
    if (kind === 'head') {
      o.frequency.setValueAtTime(freq * 0.955, when);
      o.frequency.exponentialRampToValueAtTime(freq, when + 0.09);
      var vib = ctx.createOscillator();
      var vg = ctx.createGain();
      vib.frequency.value = 5.2;
      vg.gain.value = freq * 0.004;
      vib.connect(vg); vg.connect(o.frequency);
      vib.start(when); vib.stop(when + dur + 0.1);
      live.push(vib);
    } else {
      o.frequency.setValueAtTime(freq, when);
    }
    var peak = kind === 'chest' ? 0.16 : 0.11;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.035);
    g.gain.exponentialRampToValueAtTime(peak * 0.8, when + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(filt); filt.connect(g); g.connect(master);
    o.start(when); o.stop(when + dur + 0.05);
    live.push(o, g);
  }

  function playSequence(seq) {
    if (!audio()) return;
    var base = hz(VOICES[state.voice].low);
    var t = ctx.currentTime + 0.06;
    seq.forEach(function (step) {
      var f = base * Math.pow(2, step[0] / 12);
      voiceNode(f, t, step[1], step[2]);
      t += step[1] + 0.03;
    });
    setState('Playing ' + seq.length + ' notes in the ' + VOICES[state.voice].name.toLowerCase() + ' voice · ' + noteName(VOICES[state.voice].low) + ' base.');
  }

  function stopAll() {
    if (!ctx) { setState('Audio idle — nothing has been created yet.'); return; }
    var now = ctx.currentTime;
    try { master.gain.cancelScheduledValues(now); master.gain.setTargetAtTime(0.0001, now, 0.04); } catch (e) { /* ignore */ }
    setTimeout(function () {
      live.forEach(function (n) { try { n.stop(); } catch (e) { /* already stopped */ } try { n.disconnect(); } catch (e2) { /* ignore */ } });
      live = [];
      try { master.gain.setValueAtTime((parseInt(document.getElementById('vol').value, 10) || 62) / 100 * 0.5, ctx.currentTime); } catch (e) { /* ignore */ }
      setState('Silent. Audio context kept warm — press any control to start again.');
    }, 160);
  }

  /* voice selector */
  panel.querySelectorAll('[data-voice]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      panel.querySelectorAll('[data-voice]').forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true');
      state.voice = btn.getAttribute('data-voice');
      updateDiagram();
      var v = VOICES[state.voice];
      document.getElementById('voiceNote').textContent = v.name + ' · break around ' + v.breakNote + ' · comfortable ' + v.range;
    });
  });

  /* interval selector */
  panel.querySelectorAll('[data-interval]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      panel.querySelectorAll('[data-interval]').forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true');
      state.interval = parseInt(btn.getAttribute('data-interval'), 10);
      updateDiagram();
    });
  });

  /* the break */
  document.getElementById('breakBtn').addEventListener('click', function () {
    playSequence([[0, 0.55, 'chest'], [state.interval, 1.0, 'head']]);
    document.getElementById('figNote').innerHTML = 'Chest <strong>' + noteName(VOICES[state.voice].low) + '</strong> → head <strong>' +
      noteName(VOICES[state.voice].low + state.interval) + '</strong>, ' + INTERVALS[state.interval] +
      '. Listen for the seam: the vowel must stay open across it.';
    flashPause();
  });

  /* calls */
  var CALLS = {
    juchzer: [[0, 0.42, 'chest'], [7, 0.3, 'chest'], [12, 1.45, 'head'], [7, 0.32, 'head'], [0, 0.65, 'head']],
    zaeuerli: [[0, 0.28, 'chest'], [7, 0.24, 'head'], [2, 0.28, 'chest'], [9, 0.24, 'head'], [0, 0.3, 'chest'], [7, 0.5, 'head']],
    ranz: [[0, 0.85, 'chest'], [5, 0.5, 'chest'], [7, 1.05, 'head'], [4, 0.45, 'head'], [0, 0.8, 'chest']],
    jodelied: [[0, 0.34, 'chest'], [4, 0.3, 'chest'], [7, 0.34, 'head'], [12, 0.38, 'head'], [7, 0.32, 'head'], [4, 0.3, 'chest'], [0, 0.72, 'chest']]
  };
  panel.querySelectorAll('[data-call]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-call');
      playSequence(CALLS[key]);
      document.getElementById('figNote').textContent = 'Now singing: ' + btn.textContent.trim() + ' — the pattern repeats a break six or seven times in under four seconds.';
    });
  });

  /* chord */
  function chordTick() {
    panel.querySelectorAll('[data-chord]').forEach(function (box) {
      var f = box.getAttribute('data-chord');
      var dot = panel.querySelector('[data-dot="' + f + '"]');
      if (dot) dot.classList.toggle('is-off', !box.checked);
    });
    state.chord = Array.prototype.filter.call(panel.querySelectorAll('[data-chord]'), function (b) { return b.checked; })
      .map(function (b) { return parseInt(b.getAttribute('data-chord'), 10); });
  }
  panel.querySelectorAll('[data-chord]').forEach(function (box) { box.addEventListener('change', chordTick); });

  document.getElementById('chordBtn').addEventListener('click', function () {
    if (!state.chord.length) { setState('No voices selected — tick at least one before humming the chord.'); return; }
    if (!audio()) return;
    var t = ctx.currentTime + 0.06;
    state.chord.forEach(function (freq, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i === 2 ? 'sine' : 'triangle';
      o.frequency.value = freq;
      o.detune.value = (i - 1.5) * 3.5;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.075, t + 0.35);
      g.gain.setValueAtTime(0.075, t + 1.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 2.4);
      live.push(o);
    });
    setState('G major in just intonation · ' + state.chord.length + ' voices, interval ratios 1, 5/4, 3/2, 2 from the tenor G.');
  });

  /* volume + stop */
  document.getElementById('vol').addEventListener('input', function () {
    if (ctx) master.gain.setTargetAtTime((parseInt(this.value, 10) || 0) / 100 * 0.5, ctx.currentTime, 0.05);
  });
  document.getElementById('stopBtn').addEventListener('click', stopAll);

  /* diagram */
  var noteLow = document.getElementById('noteLow');
  var noteHigh = document.getElementById('noteHigh');
  var stemLow = document.getElementById('stemLow');
  var stemHigh = document.getElementById('stemHigh');
  var leapPath = document.getElementById('leapPath');
  var leapLabel = document.getElementById('leapLabel');
  var labelLow = document.getElementById('labelLow');
  var labelHigh = document.getElementById('labelHigh');
  var figNote = document.getElementById('figNote');

  function yFor(midi) { return Math.max(46, Math.min(174, 178 - (midi - 40) * 4.3)); }

  function updateDiagram() {
    var low = VOICES[state.voice].low;
    var high = low + state.interval;
    var y1 = yFor(low), y2 = yFor(high);
    noteLow.setAttribute('cy', y1.toFixed(1));
    noteHigh.setAttribute('cy', y2.toFixed(1));
    stemLow.setAttribute('d', 'M105 ' + y1.toFixed(1) + ' V' + (y1 - 46).toFixed(1));
    stemHigh.setAttribute('d', 'M313 ' + y2.toFixed(1) + ' V' + (y2 + 46).toFixed(1));
    labelLow.setAttribute('y', (y1 + 32).toFixed(1));
    labelHigh.setAttribute('y', (y2 - 14).toFixed(1));
    labelLow.textContent = noteName(low);
    labelHigh.textContent = noteName(high);
    leapLabel.textContent = INTERVALS[state.interval];
    leapLabel.setAttribute('y', ((y1 + y2) / 2 - 6).toFixed(1));
    var mx = (y1 + y2) / 2;
    leapPath.setAttribute('d', 'M112 ' + (y1 - 8).toFixed(1) + ' C168 ' + (mx - 16).toFixed(1) + ' 224 ' + (mx - 26).toFixed(1) + ' 286 ' + (y2 + 4).toFixed(1));
    figNote.innerHTML = '<strong>' + VOICES[state.voice].name + '</strong>: chest ' + noteName(low) + ' (' + hz(low).toFixed(1) + ' Hz), head ' +
      noteName(high) + ' (' + hz(high).toFixed(1) + ' Hz). The leap is ' + INTERVALS[state.interval] + '.';
  }

  function flashPause() {
    var ring = document.getElementById('pauseRing');
    if (!ring) return;
    ring.setAttribute('opacity', '1');
    setTimeout(function () { ring.setAttribute('opacity', '0'); }, 900);
  }

  updateDiagram();
  chordTick();
})();
