/* Ratri Diya — the practice room.
   Taal arithmetic, a matra grid, and opt-in Web Audio. No AudioContext is
   constructed until the visitor presses play, and it is closed again on stop. */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- reveal ---------- */
  var revealables = document.querySelectorAll('.act, .show, .voice blockquote, .study');
  if ('IntersectionObserver' in window) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('rise'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- performance filter ---------- */
  var chips = document.querySelectorAll('.filters .chip');
  if (chips.length) {
    var items = document.querySelectorAll('.shows [data-type]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        Array.prototype.forEach.call(chips, function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        Array.prototype.forEach.call(items, function (it) {
          it.hidden = want !== 'all' && it.getAttribute('data-type') !== want;
        });
      });
    });
  }

  /* ---------- booking form ---------- */
  var booking = document.getElementById('booking-form');
  if (booking) {
    var sent = document.getElementById('sent');
    var sentList = document.getElementById('sent-list');
    function val(id) { var f = document.getElementById(id); return f ? f.value.trim() : ''; }
    function err(k, m, f) {
      var e = document.getElementById('e-' + k);
      if (e) e.textContent = m || '';
      if (f) f.setAttribute('aria-invalid', m ? 'true' : 'false');
    }
    booking.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = 0;
      var name = val('b-name'), email = val('b-email'), date = val('b-date'), place = val('b-place');
      var kind = val('b-kind'), duration = val('b-duration'), msg = val('b-message');
      var agree = document.getElementById('b-agree').checked;

      if (name.length < 2) { err('name', 'A name, and the organisation if there is one.', document.getElementById('b-name')); n++; } else err('name', '', document.getElementById('b-name'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err('email', 'This address looks incomplete.', document.getElementById('b-email')); n++; } else err('email', '', document.getElementById('b-email'));
      if (!date) { err('date', 'The date, or the week you are considering.', document.getElementById('b-date')); n++; } else err('date', '', document.getElementById('b-date'));
      if (place.length < 2) { err('place', 'Which city and venue?', document.getElementById('b-place')); n++; } else err('place', '', document.getElementById('b-place'));
      if (!kind) { err('kind', 'Choose the closest kind of evening.', document.getElementById('b-kind')); n++; } else err('kind', '', document.getElementById('b-kind'));
      if (!duration) { err('duration', 'How long is the slot?', document.getElementById('b-duration')); n++; } else err('duration', '', document.getElementById('b-duration'));
      if (msg.length < 20) { err('message', 'A line about the stage, the audience and the light.', document.getElementById('b-message')); n++; } else err('message', '', document.getElementById('b-message'));
      if (!agree) { err('agree', 'Please tick this before sending.'); n++; } else err('agree', '');

      if (n > 0) { var f = booking.querySelector('[aria-invalid="true"]'); if (f) f.focus(); return; }

      var ksel = document.getElementById('b-kind');
      var dsel = document.getElementById('b-duration');
      sentList.innerHTML = '<dt>From</dt><dd>' + name.replace(/[<>]/g, '') + '</dd>' +
        '<dt>Date</dt><dd>' + date + '</dd>' +
        '<dt>Venue</dt><dd>' + place.replace(/[<>]/g, '') + '</dd>' +
        '<dt>Programme</dt><dd>' + ksel.options[ksel.selectedIndex].text + ' · ' + dsel.options[dsel.selectedIndex].text + '</dd>';
      booking.hidden = true;
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  /* ---------- the practice room ---------- */
  var grid = document.getElementById('matra-grid');
  if (!grid) return;

  var TAALS = {
    teen: {
      name: 'Teen Taal', beats: 16,
      bols: ['dha', 'dhin', 'dhin', 'dha', 'dha', 'dhin', 'dhin', 'dha', 'dha', 'tin', 'tin', 'ta', 'ta', 'dhin', 'dhin', 'dha'],
      marks: { 0: 'X', 4: '2', 8: '0', 12: '3' },
      note: 'Four vibhags of four. The khali falls on matra nine, where the sound thins.'
    },
    jhap: {
      name: 'Jhap Taal', beats: 10,
      bols: ['dhi', 'na', 'dhi', 'dhi', 'na', 'ti', 'na', 'dhi', 'dhi', 'na'],
      marks: { 0: 'X', 2: '2', 5: '0', 7: '3' },
      note: 'Two, two, two, four — the second vibhag starts on khali, which is where young dancers lose it.'
    },
    rupak: {
      name: 'Rupak', beats: 7,
      bols: ['tin', 'tin', 'na', 'dhin', 'na', 'dhin', 'na'],
      marks: { 0: '0', 2: '2', 4: '3' },
      note: 'The only taal that begins on khali. Sam is silent; count it anyway.'
    },
    dadra: {
      name: 'Dadra', beats: 6,
      bols: ['dha', 'dhi', 'na', 'dha', 'tu', 'na'],
      marks: { 0: 'X', 3: '0' },
      note: 'Six matras in two halves. The thumri sits here.'
    }
  };

  var state = { taal: 'teen', bpm: 96, playing: false, matra: 0, avartan: 0, sam: 0, bells: false };
  var audio = { ctx: null, master: null, noise: null };
  window.__taal = { state: state, audio: audio, plays: 0, contexts: 0 };

  var el = {
    grid: grid,
    bol: document.getElementById('now-bol'),
    matra: document.getElementById('now-matra'),
    cycle: document.getElementById('now-cycle'),
    laya: document.getElementById('laya'),
    layaOut: document.getElementById('laya-out'),
    layaHint: document.getElementById('laya-hint'),
    play: document.getElementById('play'),
    stop: document.getElementById('stop'),
    bells: document.getElementById('bells'),
    audioState: document.getElementById('audio-state'),
    theka: document.getElementById('theka'),
    readCycle: document.getElementById('read-cycle'),
    readAvartan: document.getElementById('read-avartan'),
    readSam: document.getElementById('read-sam'),
    pulse: document.getElementById('pulse')
  };

  function currentTaal() { return TAALS[state.taal]; }

  function buildGrid() {
    var t = currentTaal();
    var html = '';
    for (var i = 0; i < t.beats; i++) {
      var mark = t.marks[i] || '';
      var cls = 'cell';
      if (mark === 'X') cls += ' is-sam';
      if (mark === '0') cls += ' is-khali';
      html += '<div class="' + cls + '" role="gridcell" data-matra="' + i + '">' +
        '<span class="cell__n"><span>' + (i + 1) + '</span><span class="cell__mark">' + mark + '</span></span>' +
        '<span class="cell__bol">' + t.bols[i] + '</span></div>';
    }
    el.grid.innerHTML = html;
    el.grid.setAttribute('aria-label', 'Matra grid for ' + t.name + ', ' + t.beats + ' matras');

    var theka = '';
    for (var j = 0; j < t.beats; j++) {
      theka += '<span data-theka="' + j + '">' + t.bols[j] + (t.marks[j] ? '<b>' + t.marks[j] + '</b>' : '') + '</span>';
    }
    el.theka.innerHTML = theka;
    el.readCycle.textContent = ((t.beats * 60) / state.bpm).toFixed(1) + ' s';
    el.bol.textContent = t.bols[0];
    el.matra.textContent = 'Matra 1 · ' + (t.marks[0] === '0' ? 'khali' : 'sam');
    el.cycle.textContent = 'Not started';
  }

  function clearHighlight() {
    Array.prototype.forEach.call(el.grid.querySelectorAll('.is-on'), function (c) { c.classList.remove('is-on'); });
    Array.prototype.forEach.call(el.theka.querySelectorAll('.is-live'), function (s) { s.classList.remove('is-live'); });
  }

  /* ---------- audio (created only on a gesture) ---------- */
  function ensureAudio() {
    if (!audio.ctx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audio.ctx = new Ctx();
      window.__taal.contexts += 1;
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.2;
      audio.master.connect(audio.ctx.destination);
      var len = Math.floor(audio.ctx.sampleRate * 0.35);
      var buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      audio.noise = buf;
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }

  var BOL = {
    dha:  { f: 92,  drop: 0.55, dur: 0.3,  noise: 0.9, filt: 700 },
    dhin: { f: 124, drop: 0.62, dur: 0.32, noise: 0.6, filt: 900 },
    dhi:  { f: 104, drop: 0.58, dur: 0.24, noise: 0.55, filt: 800 },
    na:   { f: 196, drop: 0.7,  dur: 0.16, noise: 0.3, filt: 1400 },
    ta:   { f: 620, drop: 0.85, dur: 0.08, noise: 0.5, filt: 2600 },
    ti:   { f: 520, drop: 0.8,  dur: 0.09, noise: 0.5, filt: 2400 },
    tin:  { f: 340, drop: 0.9,  dur: 0.2,  noise: 0.35, filt: 1900 },
    tu:   { f: 170, drop: 0.6,  dur: 0.13, noise: 0.3, filt: 1100 },
    ge:   { f: 78,  drop: 0.5,  dur: 0.22, noise: 0.4, filt: 600 }
  };

  function playBol(bol) {
    var ctx = audio.ctx;
    if (!ctx) return;
    var spec = BOL[bol] || BOL.na;
    var t = ctx.currentTime;

    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(spec.f, t);
    osc.frequency.exponentialRampToValueAtTime(spec.f * spec.drop, t + spec.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + spec.dur);
    osc.connect(g); g.connect(audio.master);
    osc.start(t); osc.stop(t + spec.dur + 0.02);

    if (spec.noise > 0) {
      var src = ctx.createBufferSource();
      src.buffer = audio.noise;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = spec.filt;
      bp.Q.value = 1.2;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(spec.noise * 0.5, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      src.connect(bp); bp.connect(ng); ng.connect(audio.master);
      src.start(t); src.stop(t + 0.12);
    }
    window.__taal.plays += 1;
  }

  function playBells() {
    var ctx = audio.ctx;
    if (!ctx) return;
    var t = ctx.currentTime;
    var src = ctx.createBufferSource();
    src.buffer = audio.noise;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200;
    bp.Q.value = 2.6;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    src.connect(bp); bp.connect(g); g.connect(audio.master);
    src.start(t); src.stop(t + 0.16);

    [2480, 3160].forEach(function (f) {
      var o = ctx.createOscillator();
      var og = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(0.06, t + 0.005);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(og); og.connect(audio.master);
      o.start(t); o.stop(t + 0.11);
    });
  }

  /* ---------- pulse canvas ---------- */
  var pctx = el.pulse.getContext('2d');
  var beats = [];
  var raf = null;

  function drawPulse() {
    if (!pctx) return;
    var w = el.pulse.width, h = el.pulse.height;
    pctx.clearRect(0, 0, w, h);
    pctx.fillStyle = '#1d1a27';
    pctx.fillRect(0, 0, w, h);
    pctx.strokeStyle = 'rgba(242,236,224,0.14)';
    pctx.beginPath(); pctx.moveTo(0, h - 12); pctx.lineTo(w, h - 12); pctx.stroke();

    var now = performance.now();
    beats.forEach(function (b, i) {
      var age = (now - b) / 1200;
      if (age > 1) return;
      var x = w - 12 - (i * (w - 24) / 15);
      if (x < 6) return;
      var amp = (1 - age) * (h - 30);
      pctx.strokeStyle = 'rgba(201,162,39,' + (0.9 * (1 - age)).toFixed(3) + ')';
      pctx.lineWidth = 3;
      pctx.lineCap = 'round';
      pctx.beginPath();
      pctx.moveTo(x, h - 12);
      pctx.lineTo(x, h - 12 - Math.max(4, amp));
      pctx.stroke();
    });
    beats = beats.filter(function (b) { return now - b < 1200; }).slice(-16);

    if (state.playing) raf = requestAnimationFrame(drawPulse);
  }

  /* ---------- transport ---------- */
  var timer = null;

  function tick() {
    var t = currentTaal();
    var i = state.matra;
    var bol = t.bols[i];
    var mark = t.marks[i];

    clearHighlight();
    var cell = el.grid.querySelector('[data-matra="' + i + '"]');
    if (cell) cell.classList.add('is-on');
    var tek = el.theka.querySelector('[data-theka="' + i + '"]');
    if (tek) tek.classList.add('is-live');

    el.bol.textContent = bol;
    var where = mark === 'X' ? 'sam' : mark === '0' ? 'khali' : mark ? 'tali ' + mark : 'plain';
    el.matra.textContent = 'Matra ' + (i + 1) + ' of ' + t.beats + ' · ' + where;

    if (i === 0) { state.sam += 1; }
    if (i === 0 && state.matra === 0 && state.avartan === 0 && state.sam === 1) { /* first sam, no count yet */ }
    el.cycle.textContent = 'Avartan ' + Math.max(state.avartan, 0) + ' · sam ×' + state.sam;
    el.readAvartan.textContent = String(state.avartan);
    el.readSam.textContent = String(state.sam);

    playBol(bol);
    if (state.bells) playBells();

    beats.push(performance.now());
    if (!raf) drawPulse();

    state.matra = (i + 1) % t.beats;
    if (state.matra === 0) { state.avartan += 1; }
  }

  function start() {
    if (state.playing) return;
    var ctx = ensureAudio();
    if (!ctx) { el.audioState.textContent = 'This browser has no audio output available.'; return; }
    state.playing = true;
    el.play.disabled = true;
    el.stop.disabled = false;
    el.play.textContent = 'Playing';
    state.matra = 0; state.avartan = 0; state.sam = 0;
    el.audioState.textContent = 'Playing ' + currentTaal().name + ' at ' + state.bpm + ' bpm · ghungroo ' + (state.bells ? 'on' : 'off') + '.';
    beats = [];
    tick();
    timer = setInterval(tick, 60000 / state.bpm);
    if (!raf) drawPulse();
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    state.playing = false;
    el.play.disabled = false;
    el.stop.disabled = true;
    el.play.textContent = 'Play the theka';
    clearHighlight();
    el.cycle.textContent = 'Stopped after ' + state.avartan + ' avartan' + (state.avartan === 1 ? '' : 's');
    el.audioState.textContent = 'Stopped. The audio channel is closed again; press play to reopen it.';
    if (audio.ctx && audio.ctx.state !== 'closed') {
      try { audio.ctx.close(); } catch (e) {}
    }
    audio.ctx = null; audio.master = null; audio.noise = null;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    beats = [];
    if (pctx) { pctx.clearRect(0, 0, el.pulse.width, el.pulse.height); pctx.fillStyle = '#1d1a27'; pctx.fillRect(0, 0, el.pulse.width, el.pulse.height); }
  }

  el.play.addEventListener('click', start);
  el.stop.addEventListener('click', stop);

  el.bells.addEventListener('change', function () {
    state.bells = el.bells.checked;
    if (state.playing) {
      el.audioState.textContent = 'Playing ' + currentTaal().name + ' at ' + state.bpm + ' bpm · ghungroo ' + (state.bells ? 'on' : 'off') + '.';
    }
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-taal]'), function (b) {
    b.addEventListener('click', function () {
      var wasPlaying = state.playing;
      if (wasPlaying) stop();
      state.taal = b.getAttribute('data-taal');
      state.matra = 0; state.avartan = 0; state.sam = 0;
      Array.prototype.forEach.call(document.querySelectorAll('[data-taal]'), function (o) {
        var on = o === b;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      buildGrid();
      el.audioState.textContent = wasPlaying ? 'Stopped on the taal change. Press play when you are ready.' : 'Sound is off until you press play.';
    });
  });

  el.laya.addEventListener('input', function () {
    state.bpm = parseInt(el.laya.value, 10);
    el.layaOut.textContent = state.bpm + ' bpm';
    el.layaHint.textContent = state.bpm < 80
      ? 'Vilambit laya. Slow enough to hear every bol, and to hear where you are late.'
      : state.bpm <= 140
        ? 'Madhya laya. The theka sits here for most of a recital.'
        : 'Drut laya. The footwork has to be decided before the tempo, not during it.';
    el.readCycle.textContent = ((currentTaal().beats * 60) / state.bpm).toFixed(1) + ' s';
    if (state.playing) {
      if (timer) { clearInterval(timer); timer = null; }
      timer = setInterval(tick, 60000 / state.bpm);
    }
  });

  buildGrid();
  el.readCycle.textContent = ((currentTaal().beats * 60) / state.bpm).toFixed(1) + ' s';
  if (pctx) { pctx.fillStyle = '#1d1a27'; pctx.fillRect(0, 0, el.pulse.width, el.pulse.height); }
})();
