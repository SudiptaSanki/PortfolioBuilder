/* VENN — site behaviours + session player.
   The player synthesises each arrangement live with the Web Audio API:
   no audio files, no autoplay — a context is only created on a
   deliberate Play press, and Stop tears the voice bus down. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* Cross-document view-transition aborts surface as unhandled
     InvalidStateError rejections in Chromium; the navigation itself
     always completes. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- reveal on scroll (armed only when motion is welcome) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- mobile menu (mixer drawer) ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuPanel = document.getElementById('menuPanel');
  if (menuBtn && menuPanel) {
    var closeMenu = function (refocus) {
      menuPanel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = menuPanel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = menuPanel.querySelector('a');
            if (first) first.focus();
          });
        });
      }
    });
    menuPanel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuPanel.classList.contains('open')) closeMenu(true);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && menuPanel.classList.contains('open')) closeMenu(false);
    });
  }

  /* ================= SESSION PLAYER ================= */
  var trackListEl = document.getElementById('trackList');
  if (!trackListEl) { initForm(); return; }

  var SCALE = [0, 2, 3, 5, 7, 8, 10]; /* natural minor */
  var TRACKS = [
    { id: 'low-ceiling', no: '01', title: 'Low Ceiling', sub: 'Original — written for a 300-cap room',
      bpm: 126, key: 'F minor', root: 29, status: 'Single · 2025',
      sections: [['Intro', 8], ['Build', 8], ['Drop', 16], ['Break', 8], ['Drop', 16], ['Outro', 8]],
      bass: [0, -1, 0, -1, 0, -1, 12, -1, 0, -1, 0, -1, 3, -1, 5, -1],
      arp:  [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 2, 5, 4, 6, 4] },
    { id: 'freight', no: '02', title: 'Freight', sub: 'Original — rolling, no long breakdowns',
      bpm: 130, key: 'G minor', root: 31, status: 'EP track · 2025',
      sections: [['Intro', 8], ['Build', 8], ['Drop', 16], ['Break', 16], ['Drop', 8], ['Outro', 8]],
      bass: [0, 0, -1, 0, -1, 0, -1, -1, 0, 0, -1, 0, 10, -1, 7, -1],
      arp:  [4, 2, 0, 2, 4, 2, 0, 2, 5, 4, 2, 4, 5, 4, 6, 4] },
    { id: 'glasshouse', no: '03', title: 'Glasshouse', sub: 'Co-write — built under an existing topline',
      bpm: 122, key: 'A minor', root: 33, status: 'Single · 2026',
      sections: [['Intro', 8], ['Build', 8], ['Drop', 16], ['Break', 8], ['Drop', 8], ['Outro', 8]],
      bass: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 8, -1, 7, -1],
      arp:  [0, -1, 2, -1, 4, -1, 2, -1, 0, -1, 2, -1, 5, -1, 4, -1] },
    { id: 'second-shift', no: '04', title: 'Second Shift', sub: 'Original — long build, peak-time',
      bpm: 128, key: 'D minor', root: 38, status: 'Single · 2024',
      sections: [['Intro', 8], ['Build', 16], ['Drop', 16], ['Break', 8], ['Drop', 16], ['Outro', 8]],
      bass: [0, -1, 12, -1, 0, -1, 10, -1, 0, -1, 12, -1, 3, -1, 15, -1],
      arp:  [0, 1, 2, 4, 2, 1, 0, 1, 2, 4, 5, 4, 2, 4, 6, 4] },
    { id: 'night-freight', no: '05', title: 'Night Freight (VENN Remix)', sub: 'Remix — six days, vocal stem only',
      bpm: 132, key: 'G♯ minor', root: 32, status: 'Remix · 2026',
      sections: [['Intro', 8], ['Build', 8], ['Drop', 16], ['Break', 8], ['Drop', 16], ['Outro', 16]],
      bass: [0, -1, 0, 0, -1, 0, -1, 12, 0, -1, 0, 0, -1, 3, -1, 10],
      arp:  [6, 4, 2, 4, 6, 4, 2, 4, 5, 4, 2, 4, 6, 4, 2, 1] }
  ];

  function totalBars(tr) { return tr.sections.reduce(function (a, s) { return a + s[1]; }, 0); }
  function totalSecs(tr) { return totalBars(tr) * 4 * 60 / tr.bpm; }
  function fmt(sec) {
    sec = Math.round(sec);
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }
  function mf(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function degToSemi(d) { return SCALE[d % 7] + 12 * Math.floor(d / 7); }

  /* Precompute section start bars */
  TRACKS.forEach(function (tr) {
    var acc = 0;
    tr.map = tr.sections.map(function (s) {
      var m = { name: s[0], bars: s[1], startBar: acc };
      acc += s[1];
      return m;
    });
    tr.bars = acc;
    tr.steps = acc * 16;
  });

  var cur = TRACKS[0];
  var state = 'stopped'; /* stopped | playing | paused | finished */
  var ctx = null, master = null, bus = null, noiseBuf = null;
  var schedTimer = null, uiTimer = null;
  var step = 0, nextStepTime = 0, queue = [];
  var lastSection = 'Ready', lastBar = 0;

  var npTitle = document.getElementById('npTitle');
  var npSection = document.getElementById('npSection');
  var npBar = document.getElementById('npBar');
  var npTime = document.getElementById('npTime');
  var playBtn = document.getElementById('playBtn');
  var playLabel = document.getElementById('playLabel');
  var playIcon = document.getElementById('playIcon');
  var stopBtn = document.getElementById('stopBtn');
  var segWrap = document.getElementById('segments');
  var progressFill = document.getElementById('progressFill');
  var statusEl = document.getElementById('playerStatus');

  /* ---------- build track rows ---------- */
  TRACKS.forEach(function (tr) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'trow';
    b.dataset.track = tr.id;
    b.setAttribute('aria-pressed', tr === cur ? 'true' : 'false');
    b.innerHTML =
      '<span class="no">' + tr.no + '</span>' +
      '<span class="tt">' + tr.title + '<small>' + tr.sub + '</small></span>' +
      '<span class="d"><b>BPM</b>' + tr.bpm + '</span>' +
      '<span class="d d-key"><b>Key</b>' + tr.key + '</span>' +
      '<span class="d"><b>Bars</b>' + tr.bars + '</span>' +
      '<span class="d d-len"><b>Length</b>' + fmt(totalSecs(tr)) + '</span>' +
      '<span class="st"><span class="live-dot" aria-hidden="true"></span> ' + tr.status + '</span>';
    b.addEventListener('click', function () { selectTrack(tr.id, true); });
    trackListEl.appendChild(b);
  });

  /* ---------- build timeline ---------- */
  function buildTimeline() {
    segWrap.innerHTML = '';
    cur.map.forEach(function (sec, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg';
      b.style.flex = sec.bars + ' 1 0';
      b.dataset.kind = sec.name.toLowerCase();
      b.dataset.index = i;
      b.setAttribute('aria-label', 'Jump to ' + sec.name + ', bar ' + (sec.startBar + 1));
      b.innerHTML = '<span class="sg-name">' + sec.name + '</span><span class="sg-bars">' + sec.bars + ' bars</span>';
      b.addEventListener('click', function () { seekTo(sec.startBar * 16); });
      segWrap.appendChild(b);
    });
  }

  function locate(st) {
    var bar = Math.floor(st / 16);
    for (var i = cur.map.length - 1; i >= 0; i--) {
      if (bar >= cur.map[i].startBar) {
        return { idx: i, name: cur.map[i].name, barInSec: bar - cur.map[i].startBar, secBars: cur.map[i].bars, bar: bar };
      }
    }
    return { idx: 0, name: cur.map[0].name, barInSec: 0, secBars: cur.map[0].bars, bar: 0 };
  }

  /* ---------- audio graph ---------- */
  function ensureCtx() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4; comp.knee.value = 12;
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    newBus();
  }
  function newBus() {
    if (bus) { try { bus.disconnect(); } catch (e) {} }
    bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
  }
  function killBus() {
    if (!bus) return;
    var old = bus;
    try {
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      setTimeout(function () { try { old.disconnect(); } catch (e) {} }, 160);
    } catch (e) {}
    newBus();
  }

  /* ---------- voices ---------- */
  function kick(t, g) {
    var o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    gn.gain.setValueAtTime(0.9 * g, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    o.connect(gn); gn.connect(bus);
    o.start(t); o.stop(t + 0.26);
  }
  function hat(t, g) {
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7600;
    var gn = ctx.createGain();
    gn.gain.setValueAtTime(g, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(f); f.connect(gn); gn.connect(bus);
    src.start(t); src.stop(t + 0.07);
  }
  function clap(t) {
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 1.1;
    var gn = ctx.createGain();
    gn.gain.setValueAtTime(0.34, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    src.connect(f); f.connect(gn); gn.connect(bus);
    src.start(t); src.stop(t + 0.15);
  }
  function bassNote(t, midi, dur, g) {
    var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mf(midi);
    var sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = mf(midi - 12);
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(760, t);
    f.frequency.exponentialRampToValueAtTime(240, t + Math.min(dur, 0.3));
    var gn = ctx.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(g, t + 0.006);
    gn.gain.setTargetAtTime(0, t + dur * 0.55, 0.03);
    var sg = ctx.createGain(); sg.gain.value = 0.5;
    o.connect(f); sub.connect(sg); sg.connect(f);
    f.connect(gn); gn.connect(bus);
    o.start(t); o.stop(t + dur + 0.25);
    sub.start(t); sub.stop(t + dur + 0.25);
  }
  function arpNote(t, midi, g) {
    var o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = mf(midi);
    var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mf(midi); o2.detune.value = 5;
    var gn = ctx.createGain();
    gn.gain.setValueAtTime(g, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    var g2 = ctx.createGain(); g2.gain.value = 0.5;
    o.connect(gn); o2.connect(g2); g2.connect(gn);
    gn.connect(bus);
    o.start(t); o.stop(t + 0.15);
    o2.start(t); o2.stop(t + 0.15);
  }
  function padChord(t, dur) {
    [12, 15, 19].forEach(function (off) {
      var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mf(cur.root + off);
      var gn = ctx.createGain();
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(0.038, t + 0.4);
      gn.gain.setValueAtTime(0.038, t + dur - 0.3);
      gn.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(gn); gn.connect(bus);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }

  /* ---------- step scheduler ---------- */
  function scheduleStep(st, t) {
    var loc = locate(st);
    var s = st % 16;
    var stepDur = 60 / cur.bpm / 4;
    var barDur = stepDur * 16;
    var pat = cur.bass, arp = cur.arp;
    switch (loc.name) {
      case 'Intro':
        if (s === 0) { kick(t, 0.5); bassNote(t, cur.root, barDur * 0.9, 0.15); padChord(t, barDur); }
        if (s % 4 === 0 && arp[s] >= 0) arpNote(t, cur.root + 24 + degToSemi(arp[s]), 0.028);
        if (s === 14 && loc.barInSec % 2 === 1) hat(t, 0.1);
        break;
      case 'Build':
        if (s % 4 === 0) kick(t, 0.75);
        if (s % 2 === 0) hat(t, 0.11);
        if (loc.barInSec === loc.secBars - 1 && (s === 4 || s === 12)) clap(t);
        if (s % 2 === 0 && pat[s] >= 0) bassNote(t, cur.root + pat[s], stepDur * 1.7, 0.19);
        if (loc.barInSec === loc.secBars - 1) { if (arp[s] >= 0) arpNote(t, cur.root + 24 + degToSemi(arp[s]), 0.042); }
        else if (s % 2 === 0 && arp[s] >= 0) arpNote(t, cur.root + 24 + degToSemi(arp[s]), 0.036);
        break;
      case 'Drop':
        if (s % 4 === 0) kick(t, 1);
        if (s === 4 || s === 12) clap(t);
        if (s % 2 === 0) hat(t, s % 4 === 2 ? 0.2 : 0.11);
        if (pat[s] >= 0) bassNote(t, cur.root + pat[s], stepDur * 0.92, 0.23);
        if (arp[s] >= 0) arpNote(t, cur.root + 24 + degToSemi(arp[s]), 0.046);
        break;
      case 'Break':
        if (s === 0) { padChord(t, barDur); bassNote(t, cur.root, barDur * 0.95, 0.13); }
        if (s === 8) bassNote(t, cur.root + 3, barDur * 0.45, 0.11);
        break;
      case 'Outro':
        var fade = 1 - (loc.barInSec / loc.secBars) * 0.65;
        if (s % 4 === 0) kick(t, 0.7 * fade);
        if (s % 4 === 2) hat(t, 0.13 * fade);
        if (s % 4 === 0 && pat[s] >= 0) bassNote(t, cur.root + pat[s], stepDur * 1.6, 0.17 * fade);
        if (s % 2 === 0 && arp[s] >= 0) arpNote(t, cur.root + 24 + degToSemi(arp[s]), 0.028 * fade);
        break;
    }
  }

  function scheduler() {
    var stepDur = 60 / cur.bpm / 4;
    while (nextStepTime < ctx.currentTime + 0.12) {
      if (step >= cur.steps) { finish(); return; }
      scheduleStep(step, nextStepTime);
      queue.push({ step: step, time: nextStepTime });
      nextStepTime += stepDur;
      step++;
    }
  }

  function uiTick() {
    var now = ctx.currentTime;
    while (queue.length && queue[0].time <= now + 0.02) {
      var item = queue.shift();
      updateUI(item.step);
    }
  }

  function updateUI(st) {
    var loc = locate(st);
    lastSection = loc.name;
    lastBar = loc.bar + 1;
    npSection.textContent = loc.name;
    npBar.textContent = 'Bar ' + lastBar + ' / ' + cur.bars;
    var stepDur = 60 / cur.bpm / 4;
    npTime.textContent = fmt(st * stepDur) + ' / ' + fmt(totalSecs(cur));
    progressFill.style.width = (st / cur.steps * 100).toFixed(2) + '%';
    var segs = segWrap.children;
    for (var i = 0; i < segs.length; i++) {
      segs[i].classList.toggle('active', i === loc.idx);
      segs[i].classList.toggle('done', i < loc.idx);
    }
  }

  function setPlayUI(label, icon, pressed) {
    playLabel.textContent = label;
    playIcon.textContent = icon;
    playBtn.setAttribute('aria-pressed', String(pressed));
  }

  function start(fromStep) {
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    killBus();
    step = fromStep || 0;
    queue = [];
    nextStepTime = ctx.currentTime + 0.08;
    clearInterval(schedTimer); clearInterval(uiTimer);
    schedTimer = setInterval(scheduler, 27);
    uiTimer = setInterval(uiTick, 50);
    state = 'playing';
    setPlayUI('Pause', '❚❚', true);
    stopBtn.disabled = false;
    markRowPlaying(true);
    statusEl.textContent = 'Playing — ' + cur.title + ', synthesised live. Stop any time.';
    updateUI(step);
    scheduler();
  }

  function pause() {
    if (!ctx) return;
    ctx.suspend();
    state = 'paused';
    setPlayUI('Resume', '▶', false);
    statusEl.textContent = 'Paused at bar ' + lastBar + ' of ' + cur.bars + '.';
  }

  function resume() {
    if (!ctx) return;
    ctx.resume();
    state = 'playing';
    setPlayUI('Pause', '❚❚', true);
    statusEl.textContent = 'Playing — ' + cur.title + ', synthesised live. Stop any time.';
  }

  function stopAll() {
    clearInterval(schedTimer); clearInterval(uiTimer);
    if (ctx) killBus();
    state = 'stopped';
    step = 0; queue = [];
    lastSection = 'Ready'; lastBar = 0;
    setPlayUI('Play', '▶', false);
    stopBtn.disabled = true;
    markRowPlaying(false);
    resetReadout('Ready');
    statusEl.textContent = 'Select a track, press play. Tap a section to jump straight to it.';
  }

  function finish() {
    clearInterval(schedTimer); clearInterval(uiTimer);
    state = 'finished';
    lastSection = 'End';
    setPlayUI('Play again', '▶', false);
    stopBtn.disabled = true;
    markRowPlaying(false);
    npSection.textContent = 'End';
    npBar.textContent = 'Bar ' + cur.bars + ' / ' + cur.bars;
    npTime.textContent = fmt(totalSecs(cur)) + ' / ' + fmt(totalSecs(cur));
    progressFill.style.width = '100%';
    statusEl.textContent = 'Finished — that was the full arrangement of ' + cur.title + ', synthesised live. Press play to run it again.';
  }

  function resetReadout(secName) {
    npTitle.textContent = cur.title;
    npSection.textContent = secName;
    npBar.textContent = 'Bar — / ' + cur.bars;
    npTime.textContent = '0:00 / ' + fmt(totalSecs(cur));
    progressFill.style.width = '0%';
    var segs = segWrap.children;
    for (var i = 0; i < segs.length; i++) segs[i].classList.remove('active', 'done');
  }

  function markRowPlaying(on) {
    trackListEl.querySelectorAll('.trow').forEach(function (r) {
      r.classList.toggle('playing', on && r.dataset.track === cur.id);
    });
  }

  function selectTrack(id, fromUser) {
    var tr = TRACKS.filter(function (t) { return t.id === id; })[0];
    if (!tr) return;
    var wasActive = (state === 'playing' || state === 'paused');
    cur = tr;
    trackListEl.querySelectorAll('.trow').forEach(function (r) {
      r.setAttribute('aria-pressed', String(r.dataset.track === id));
    });
    buildTimeline();
    if (wasActive) { start(0); }
    else {
      state = 'stopped';
      setPlayUI('Play', '▶', false);
      stopBtn.disabled = true;
      markRowPlaying(false);
      resetReadout('Ready');
      if (fromUser) statusEl.textContent = cur.title + ' loaded — ' + cur.bpm + ' BPM, ' + cur.key + ', ' + cur.bars + ' bars. Press play.';
    }
  }

  function seekTo(targetStep) {
    if (state === 'playing' || state === 'paused') {
      var wasPaused = state === 'paused';
      killBus();
      step = targetStep;
      queue = [];
      nextStepTime = ctx.currentTime + 0.08;
      updateUI(step);
      statusEl.textContent = 'Jumped to ' + lastSection + ', bar ' + lastBar + '.';
      if (wasPaused) { /* stay paused at the new position */ }
    } else {
      start(targetStep);
    }
  }

  playBtn.addEventListener('click', function () {
    if (state === 'playing') pause();
    else if (state === 'paused') resume();
    else start(0);
  });
  stopBtn.addEventListener('click', stopAll);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && state === 'playing') pause();
  });

  buildTimeline();
  resetReadout('Ready');

  /* Probe/inspection handle — state only, no control over anyone's browser. */
  window.VennPlayer = {
    state: function () { return state; },
    track: function () { return cur.id; },
    section: function () { return lastSection; },
    bar: function () { return lastBar; },
    ctxState: function () { return ctx ? ctx.state : 'none'; },
    select: function (id) { selectTrack(id, false); },
    play: function () { if (state === 'paused') resume(); else if (state !== 'playing') start(0); },
    stop: function () { stopAll(); }
  };

  /* ================= ENQUIRY FORM (contact page only) ================= */
  function initForm() {
    var form = document.getElementById('enquiryForm');
    if (!form) return;
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var confirmText = document.getElementById('confirmText');
    var againBtn = document.getElementById('againBtn');

    function setInvalid(input, bad) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', String(bad));
      return !bad;
    }
    function validate() {
      var name = document.getElementById('fName');
      var email = document.getElementById('fEmail');
      var type = document.getElementById('fType');
      var msg = document.getElementById('fMsg');
      var results = [
        { el: name, ok: name.value.trim().length >= 2 },
        { el: email, ok: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) },
        { el: type, ok: type.value !== '' },
        { el: msg, ok: msg.value.trim().length >= 10 }
      ];
      var firstBad = null;
      results.forEach(function (r) {
        if (!setInvalid(r.el, !r.ok) && !firstBad) firstBad = r.el;
      });
      if (firstBad) firstBad.focus();
      return !firstBad;
    }
    ['fName', 'fEmail', 'fType', 'fMsg'].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('input', function () { setInvalid(el, false); });
      el.addEventListener('change', function () { setInvalid(el, false); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var name = document.getElementById('fName').value.trim();
      var type = document.getElementById('fType').value;
      var ref = 'VN-2026-' + Math.floor(100 + Math.random() * 900);
      confirmRef.textContent = 'Reference ' + ref;
      confirmText.textContent = 'Thank you, ' + name.split(' ')[0] + ' — your ' + type.split(' — ')[0].toLowerCase() +
        ' brief is noted under reference ' + ref + '. On the live site this confirmation arrives by email; here, nothing has been transmitted or stored.';
      form.style.display = 'none';
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
    if (againBtn) {
      againBtn.addEventListener('click', function () {
        form.reset();
        form.style.display = '';
        confirmBox.classList.remove('show');
        document.getElementById('fName').focus();
      });
    }
  }
  initForm();
})();
