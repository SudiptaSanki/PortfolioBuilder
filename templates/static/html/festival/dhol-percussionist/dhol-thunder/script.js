/* ============================================================
   DHOL THUNDER — shared behaviour
   Menu · reveals · rhythm player (Web Audio, user-started only)
   · evening planner · enquiry form.
   No audio exists anywhere until a visitor presses Play.
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only that exact artefact — navigation always completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- mobile menu: the running order ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (menuBtn && panel) {
    var panelLinks = panel.querySelectorAll('a');
    function openMenu() {
      panel.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (panelLinks.length) panelLinks[0].focus();
        });
      });
    }
    function closeMenu(returnFocus) {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (returnFocus) menuBtn.focus();
    }
    menuBtn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeMenu(false); else openMenu();
    });
    panelLinks.forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && panel.classList.contains('open')) closeMenu(false);
    });
  }

  /* ---------------- reveal on scroll (opacity only, has one job) ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ================================================================
     THE RHYTHM PLAYER
     Patterns as played, simplified to the grid. Voices are
     synthesised strokes — Ge (bass side), Na (treble slap),
     Ka (rim) — labelled on the page as demonstrations.
     ================================================================ */
  var PATTERNS = {
    chaal: {
      name: 'Bhangra Chaal', beats: 8, stepsPerBeat: 2, bpm: 100, min: 84, max: 120,
      desc: 'The groove under every bhangra track — the one the dancefloor already knows. Bass on the beat, the treble hand answering off it.',
      steps: ['B', '', 'S', '', 'B', 'R', 'S', '', 'B', '', 'S', 'R', 'B', '', 'S', 'R']
    },
    dhamaal: {
      name: 'Dhamaal', beats: 8, stepsPerBeat: 2, bpm: 112, min: 96, max: 126,
      desc: 'Built for the finale. Heavy on the one, doubles on the bass side, no space left to sit down. Played for the last set, never the first.',
      steps: ['BS', '', 'B', 'S', 'B', '', 'BS', '', 'B', 'S', 'B', '', 'BS', '', 'B', 'S']
    },
    keharwa: {
      name: 'Keharwa — the 8', beats: 8, stepsPerBeat: 2, bpm: 88, min: 76, max: 100,
      desc: 'The entrance and dinner pattern. Light hands, long gaps — it lifts a room without shouting over the conversation.',
      steps: ['B', '', '', 'S', '', '', 'B', 'S', 'B', '', '', 'S', '', 'B', '', 'S']
    },
    baraat: {
      name: 'Baraat Walk', beats: 4, stepsPerBeat: 1, bpm: 76, min: 68, max: 88,
      desc: 'Procession pace — one stroke per step, played walking, for as long as the route takes. The tempo is set by feet, not by the DJ.',
      steps: ['B', 'S', 'B', 'S', 'B', 'S', 'BR', 'S']
    }
  };
  var VOICE_LABEL = { B: 'Ge', S: 'Na', R: 'Ka', BS: 'Ge·Na', BR: 'Ge·Ka' };

  var grid = document.getElementById('beatGrid');
  if (grid) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.pattern-tab'));
    var descEl = document.getElementById('patternDesc');
    var metaEl = document.getElementById('patternMeta');
    var statusEl = document.getElementById('playerStatus');
    var playBtn = document.getElementById('playBtn');
    var playLabel = document.getElementById('playLabel');
    var tempoRange = document.getElementById('tempoRange');
    var tempoRead = document.getElementById('tempoRead');
    var bpmDown = document.getElementById('bpmDown');
    var bpmUp = document.getElementById('bpmUp');

    var currentId = 'chaal';
    var bpm = PATTERNS.chaal.bpm;

    /* audio state — nothing exists before Play */
    var ctx = null, master = null, noiseBuf = null;
    var playing = false, schedTimer = null, rafId = null;
    var nextStep = 0, nextTime = 0, queue = [], shownStep = -1;

    function ensureCtx() {
      if (ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 6;
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    function voiceBass(t) { /* Ge — the big side */
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(155, t);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.2);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
    }
    function voiceSlap(t) { /* Na — treble slap */
      var src = ctx.createBufferSource(); src.buffer = noiseBuf;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 0.9;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.55, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.12);
      var o = ctx.createOscillator(), g2 = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 305;
      g2.gain.setValueAtTime(0.22, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      o.connect(g2); g2.connect(master); o.start(t); o.stop(t + 0.07);
    }
    function voiceRim(t) { /* Ka — rim / stick click */
      var src = ctx.createBufferSource(); src.buffer = noiseBuf;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4800;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.32, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      src.connect(hp); hp.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.05);
    }
    function scheduleStep(stepIdx, t) {
      var code = PATTERNS[currentId].steps[stepIdx];
      if (!code) return;
      if (code.indexOf('B') > -1) voiceBass(t);
      if (code.indexOf('S') > -1) voiceSlap(t);
      if (code.indexOf('R') > -1) voiceRim(t);
    }
    function scheduler() {
      var pat = PATTERNS[currentId];
      var stepDur = 60 / bpm / pat.stepsPerBeat;
      while (nextTime < ctx.currentTime + 0.12) {
        scheduleStep(nextStep, nextTime);
        queue.push({ step: nextStep, time: nextTime });
        nextTime += stepDur;
        nextStep = (nextStep + 1) % pat.steps.length;
      }
    }
    function paintLoop() {
      if (!playing) return;
      var now = ctx.currentTime, cur = -1;
      while (queue.length && queue[0].time <= now) { cur = queue.shift().step; }
      if (cur > -1 && cur !== shownStep) {
        shownStep = cur;
        var cells = grid.children;
        for (var i = 0; i < cells.length; i++) cells[i].classList.toggle('on', i === cur);
        var pat = PATTERNS[currentId];
        var beat = Math.floor(cur / pat.stepsPerBeat) + 1;
        statusEl.textContent = 'Playing — ' + pat.name + ' · beat ' + beat + ' of ' + pat.beats +
          ' · step ' + (cur + 1) + ' of ' + pat.steps.length + ' · ' + bpm + ' BPM';
      }
      rafId = requestAnimationFrame(paintLoop);
    }
    function start() {
      ensureCtx();
      if (ctx.state === 'suspended') ctx.resume();
      playing = true;
      nextStep = 0; shownStep = -1; queue = [];
      nextTime = ctx.currentTime + 0.06;
      schedTimer = setInterval(scheduler, 25);
      rafId = requestAnimationFrame(paintLoop);
      playBtn.classList.add('playing');
      playBtn.setAttribute('aria-pressed', 'true');
      playLabel.textContent = 'Stop';
      statusEl.textContent = 'Playing — ' + PATTERNS[currentId].name + ' · ' + bpm + ' BPM';
    }
    function stop() {
      playing = false;
      if (schedTimer) clearInterval(schedTimer);
      if (rafId) cancelAnimationFrame(rafId);
      schedTimer = null; queue = [];
      var cells = grid.children;
      for (var i = 0; i < cells.length; i++) cells[i].classList.remove('on');
      shownStep = -1;
      playBtn.classList.remove('playing');
      playBtn.setAttribute('aria-pressed', 'false');
      playLabel.textContent = 'Play the pattern';
      statusEl.textContent = 'Stopped. The demonstrations are synthesised strokes — Ge, Na and Ka — not recordings of a real dhol.';
    }
    function buildGrid() {
      var pat = PATTERNS[currentId];
      grid.dataset.steps = pat.steps.length;
      grid.innerHTML = '';
      pat.steps.forEach(function (code, i) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        if (i % pat.stepsPerBeat === 0) cell.classList.add('beat-start');
        if (i === 0) cell.classList.add('sam');
        if (code.indexOf('B') > -1) cell.classList.add('hit-bass');
        if (code.indexOf('S') > -1) cell.classList.add('hit-slap');
        if (code.indexOf('R') > -1) cell.classList.add('hit-rim');
        var n = document.createElement('span'); n.className = 'n'; n.textContent = i + 1;
        var v = document.createElement('span'); v.className = 'v'; v.textContent = code ? VOICE_LABEL[code] : '·';
        cell.appendChild(n); cell.appendChild(v);
        grid.appendChild(cell);
      });
      descEl.textContent = pat.desc;
      metaEl.textContent = pat.name.toUpperCase() + ' — ' + pat.beats + (pat.beats === 1 ? ' BEAT' : ' BEATS') +
        ' · ' + pat.steps.length + ' STEPS · TEMPO ' + pat.min + '–' + pat.max + ' BPM';
      tempoRange.min = pat.min; tempoRange.max = pat.max;
    }
    function setTempo(v) {
      var pat = PATTERNS[currentId];
      bpm = Math.max(pat.min, Math.min(pat.max, Math.round(v)));
      tempoRange.value = bpm;
      tempoRead.textContent = bpm + ' BPM';
    }
    function selectPattern(id, focusTab) {
      if (playing) stop();
      currentId = id;
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-pattern') === id ? 'true' : 'false'); });
      bpm = PATTERNS[id].bpm;
      buildGrid();
      setTempo(bpm);
      statusEl.textContent = PATTERNS[id].name + ' loaded. Press play to hear the pattern.';
      if (focusTab) { /* keep focus where the tap landed */ }
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { selectPattern(t.getAttribute('data-pattern'), true); });
    });
    playBtn.addEventListener('click', function () { if (playing) stop(); else start(); });
    tempoRange.addEventListener('input', function () { setTempo(parseInt(tempoRange.value, 10)); });
    bpmDown.addEventListener('click', function () { setTempo(bpm - 2); });
    bpmUp.addEventListener('click', function () { setTempo(bpm + 2); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) stop();
    });
    buildGrid();
    setTempo(bpm);

    /* probe handle — state only, no control */
    window.DholThunder = {
      state: function () {
        return {
          ctx: ctx ? ctx.state : 'none',
          playing: playing,
          step: shownStep,
          pattern: currentId,
          bpm: bpm,
          steps: PATTERNS[currentId].steps.length
        };
      }
    };
  }

  /* ================================================================
     THE EVENING PLANNER — cues, clock times, totals that add up.
     ================================================================ */
  var planRowsEl = document.getElementById('planRows');
  if (planRowsEl) {
    var CUES = [
      { id: 'baraat', name: 'Baraat — the procession', desc: 'Outdoors, walking with the groom’s party. Sets the pace, gathers the crowd, lands at the doors.', dur: 45, kind: 'playing', on: true },
      { id: 'entrance', name: 'Couple’s entrance', desc: 'The room stands up. One short, huge cue — timed to the doors opening, not a minute before.', dur: 10, kind: 'playing', on: true },
      { id: 'dinner', name: 'Dinner set', desc: 'Keharwa at low hands while food is served. Under the conversation, never over it.', dur: 45, kind: 'playing', on: true },
      { id: 'floor1', name: 'Dancefloor set 1', desc: 'Chaal locked to the DJ’s first bhangra block. This is the set that fills the floor.', dur: 40, kind: 'playing', on: true },
      { id: 'brk', name: 'Break', desc: 'Off the drum. Water, towel, cool down — a dhol head and a player both need it.', dur: 15, kind: 'break', on: true },
      { id: 'floor2', name: 'Dancefloor set 2 + finale', desc: 'Dhamaal to close. The last ten minutes are the loudest of the night, on purpose.', dur: 35, kind: 'playing', on: true }
    ];
    var startSel = document.getElementById('startTime');
    var totPlaying = document.getElementById('totalPlaying');
    var totSpan = document.getElementById('totalSpan');
    var totFinish = document.getElementById('planFinish');
    var totStart = document.getElementById('planStart');

    function fmt(mins) {
      var h = Math.floor(mins / 60) % 24, m = mins % 60;
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    function fmtDur(mins) {
      var h = Math.floor(mins / 60), m = mins % 60;
      return h ? (h + 'h ' + (m ? m + 'm' : '')).trim() : m + ' min';
    }
    function renderPlan() {
      var start = parseInt(startSel.value, 10);
      var t = start, playingMin = 0, spanMin = 0;
      planRowsEl.innerHTML = '';
      CUES.forEach(function (cue) {
        var li = document.createElement('li');
        li.className = 'plan-row' + (cue.on ? '' : ' off');
        var whenHtml, kindHtml;
        if (cue.on) {
          whenHtml = fmt(t) + '–' + fmt(t + cue.dur) + '<span class="dur">' + cue.dur + ' min</span>';
          spanMin += cue.dur;
          if (cue.kind === 'playing') playingMin += cue.dur;
          t += cue.dur;
        } else {
          whenHtml = '—<span class="dur">' + cue.dur + ' min, cut</span>';
        }
        kindHtml = cue.kind === 'playing' ? 'Playing' : 'Off the drum';
        li.innerHTML =
          '<button type="button" class="tick" role="checkbox" aria-checked="' + cue.on + '" aria-label="Include: ' + cue.name + '">✓</button>' +
          '<div class="when">' + whenHtml + '</div>' +
          '<div class="what"><b>' + cue.name + '</b><span>' + cue.desc + '</span></div>' +
          '<div class="kind' + (cue.kind === 'playing' ? ' playing' : '') + '">' + kindHtml + '</div>';
        li.querySelector('.tick').addEventListener('click', function () {
          cue.on = !cue.on;
          renderPlan();
          var btn = planRowsEl.querySelector('[aria-label="Include: ' + cue.name.replace(/"/g, '') + '"]');
          if (btn) btn.focus();
        });
        planRowsEl.appendChild(li);
      });
      totPlaying.textContent = fmtDur(playingMin);
      totSpan.textContent = fmtDur(spanMin);
      totStart.textContent = fmt(start);
      totFinish.textContent = fmt(start + spanMin);
    }
    startSel.addEventListener('change', renderPlan);
    renderPlan();
  }

  /* ================================================================
     ENQUIRY FORM — validated, confirms in-page, transmits nothing.
     ================================================================ */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var conf = document.getElementById('confirmation');
    var required = ['fName', 'fEmail', 'fDate', 'fVenue', 'fMsg'];
    function fieldOk(id) {
      var el = document.getElementById(id);
      var v = (el.value || '').trim();
      if (!v) return false;
      if (id === 'fEmail') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      return true;
    }
    function mark(id) {
      var el = document.getElementById(id);
      var wrap = el.closest('.field');
      var ok = fieldOk(id);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (wrap) wrap.classList.toggle('invalid', !ok);
      return ok;
    }
    required.forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('input', function () { mark(id); });
      el.addEventListener('change', function () { mark(id); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = true, firstBad = null;
      required.forEach(function (id) {
        if (!mark(id)) { allOk = false; if (!firstBad) firstBad = id; }
      });
      if (!allOk) { document.getElementById(firstBad).focus(); return; }
      var email = document.getElementById('fEmail').value.trim();
      var date = document.getElementById('fDate').value;
      var name = document.getElementById('fName').value.trim();
      var s = email + '|' + date, hash = 0;
      for (var i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
      var ref = 'MS-2026-' + (100 + (hash % 900));
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confName').textContent = name.split(' ')[0];
      document.getElementById('confDate').textContent = date;
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
      conf.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function () {
      form.reset();
      required.forEach(function (id) {
        var el = document.getElementById(id);
        el.setAttribute('aria-invalid', 'false');
        el.closest('.field').classList.remove('invalid');
      });
      conf.hidden = true;
      form.hidden = false;
      document.getElementById('fName').focus();
    });
  }
})();
