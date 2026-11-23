/* ============================================================
   SHRED CORE — shared behaviour + the Tempo Trainer.
   The trainer is a practice tool: its clicks are synthesised
   in the browser and demonstrate tempo and subdivision only.
   Audio is created ONLY when the player presses Start.
   ============================================================ */
(function () {
  'use strict';

  /* Cross-document view transitions abort in some engines when the
     destination races; the abort surfaces as an unhandled rejection
     while the navigation itself completes. Filter only that case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile panel ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobile-panel');
  if (btn && panel) {
    var panelLinks = panel.querySelectorAll('a[href]');
    function openPanel() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (panelLinks.length) panelLinks[0].focus();
        });
      });
    }
    function closePanel(returnFocus) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closePanel(false);
      else openPanel();
    });
    panelLinks.forEach(function (a) {
      a.addEventListener('click', function () { closePanel(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && panel.classList.contains('open')) closePanel(false);
    });
  }

  /* ---------- reveal on scroll (job: pace the case register) ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ==========================================================
     TEMPO TRAINER
     ========================================================== */
  var root = document.getElementById('trainer');
  if (!root) return;

  var bpmRange = document.getElementById('bpm-range');
  var bpmNum = document.getElementById('bpm-num');
  var bpmOut = document.getElementById('bpm-out');
  var minusBtn = document.getElementById('bpm-minus');
  var plusBtn = document.getElementById('bpm-plus');
  var tapBtn = document.getElementById('tap-btn');
  var startBtn = document.getElementById('start-btn');
  var sigSel = document.getElementById('sig-sel');
  var subSel = document.getElementById('sub-sel');
  var accentChk = document.getElementById('accent-chk');
  var dotsBox = document.getElementById('beat-dots');
  var beatReadout = document.getElementById('beat-readout');
  var roMs = document.getElementById('ro-ms');
  var roBar = document.getElementById('ro-bar');
  var roNote = document.getElementById('ro-note');
  var roClicks = document.getElementById('ro-clicks');

  var SUBDIVISIONS = { '1': 1, '2': 2, '3': 3, '4': 4 };
  var NOTE_NAMES = { '1': 'Quarter notes', '2': 'Eighth notes', '3': 'Eighth-note triplets', '4': 'Sixteenth notes' };

  var state = {
    bpm: parseInt(bpmRange.value, 10) || 120,
    beatsPerBar: 4,
    sub: 1,
    accent: true,
    playing: false
  };

  /* audio graph — created lazily on first Start press */
  var actx = null;
  var master = null;
  function ensureAudio() {
    if (actx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = 0.9;
    master.connect(actx.destination);
  }
  function clickAt(time, isAccent, isBeat) {
    var osc = actx.createOscillator();
    var g = actx.createGain();
    osc.type = 'square';
    osc.frequency.value = isAccent ? 1960 : (isBeat ? 1240 : 880);
    var peak = isAccent ? 0.5 : (isBeat ? 0.34 : 0.2);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + (isBeat ? 0.045 : 0.03));
    osc.connect(g); g.connect(master);
    osc.start(time); osc.stop(time + 0.06);
  }

  /* scheduler */
  var timerID = null;
  var nextNoteTime = 0;
  var currentBeat = 0;
  var currentSub = 0;
  var drawQueue = [];
  var LOOKAHEAD_MS = 25;
  var AHEAD = 0.12;

  function scheduler() {
    var secondsPerBeat = 60 / state.bpm;
    while (nextNoteTime < actx.currentTime + AHEAD) {
      var isBeat = currentSub === 0;
      var isAccent = isBeat && currentBeat === 0 && state.accent;
      clickAt(nextNoteTime, isAccent, isBeat);
      drawQueue.push({ time: nextNoteTime, beat: currentBeat, isBeat: isBeat });
      nextNoteTime += secondsPerBeat / state.sub;
      currentSub += 1;
      if (currentSub >= state.sub) {
        currentSub = 0;
        currentBeat = (currentBeat + 1) % state.beatsPerBar;
      }
    }
  }

  var rafID = null;
  function draw() {
    var now = actx.currentTime;
    var active = null;
    while (drawQueue.length && drawQueue[0].time <= now) {
      active = drawQueue.shift();
    }
    if (active) {
      var dots = dotsBox.children;
      for (var i = 0; i < dots.length; i++) {
        var on = i === active.beat;
        dots[i].classList.toggle('on', on);
        dots[i].classList.toggle('first', on && active.beat === 0);
      }
      if (active.isBeat) {
        beatReadout.textContent = 'Bar beat ' + (active.beat + 1) + ' of ' + state.beatsPerBar +
          ' · ' + state.bpm + ' BPM · ' + NOTE_NAMES[String(state.sub)].toLowerCase();
      }
    }
    if (state.playing) rafID = requestAnimationFrame(draw);
  }

  function buildDots() {
    dotsBox.innerHTML = '';
    for (var i = 0; i < state.beatsPerBar; i++) {
      var d = document.createElement('span');
      d.className = 'beat-dot';
      dotsBox.appendChild(d);
    }
  }

  function start() {
    ensureAudio();
    if (actx.state === 'suspended') actx.resume();
    state.playing = true;
    currentBeat = 0; currentSub = 0; drawQueue = [];
    nextNoteTime = actx.currentTime + 0.06;
    timerID = setInterval(scheduler, LOOKAHEAD_MS);
    rafID = requestAnimationFrame(draw);
    startBtn.setAttribute('aria-pressed', 'true');
    startBtn.textContent = '■ Stop';
    beatReadout.textContent = 'Playing — ' + state.bpm + ' BPM';
  }
  function stop() {
    state.playing = false;
    if (timerID) clearInterval(timerID);
    if (rafID) cancelAnimationFrame(rafID);
    timerID = null;
    var dots = dotsBox.children;
    for (var i = 0; i < dots.length; i++) dots[i].classList.remove('on', 'first');
    startBtn.setAttribute('aria-pressed', 'false');
    startBtn.textContent = '▶ Start click';
    beatReadout.textContent = 'Stopped. Press Start when you are ready to practise.';
  }

  function refreshReadouts() {
    var msPerBeat = 60000 / state.bpm;
    bpmNum.textContent = state.bpm;
    bpmOut.textContent = state.bpm + ' BPM';
    roMs.textContent = msPerBeat.toFixed(1) + ' ms';
    roBar.textContent = (msPerBeat * state.beatsPerBar / 1000).toFixed(2) + ' s';
    roNote.textContent = NOTE_NAMES[String(state.sub)];
    roClicks.textContent = state.beatsPerBar * state.sub;
    if (!state.playing) {
      beatReadout.textContent = 'Ready — ' + state.beatsPerBar + ' beats to the bar, ' +
        NOTE_NAMES[String(state.sub)].toLowerCase() + ' at ' + state.bpm + ' BPM.';
    }
  }
  function setBpm(v) {
    state.bpm = Math.max(40, Math.min(240, Math.round(v)));
    bpmRange.value = state.bpm;
    refreshReadouts();
  }

  bpmRange.addEventListener('input', function () { setBpm(parseInt(bpmRange.value, 10)); });
  minusBtn.addEventListener('click', function () { setBpm(state.bpm - 1); });
  plusBtn.addEventListener('click', function () { setBpm(state.bpm + 1); });
  sigSel.addEventListener('change', function () {
    state.beatsPerBar = parseInt(sigSel.value, 10);
    currentBeat = 0; currentSub = 0;
    buildDots(); refreshReadouts();
  });
  subSel.addEventListener('change', function () {
    state.sub = SUBDIVISIONS[subSel.value] || 1;
    currentSub = 0;
    refreshReadouts();
  });
  accentChk.addEventListener('change', function () { state.accent = accentChk.checked; });
  startBtn.addEventListener('click', function () {
    if (state.playing) stop(); else start();
  });

  /* tap tempo — average of the last few taps inside 2 seconds */
  var taps = [];
  tapBtn.addEventListener('click', function () {
    var now = performance.now();
    taps = taps.filter(function (t) { return now - t < 2000; });
    taps.push(now);
    if (taps.length >= 2) {
      var intervals = [];
      for (var i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
      var avg = intervals.reduce(function (a, b) { return a + b; }, 0) / intervals.length;
      setBpm(60000 / avg);
    }
  });

  /* presets + setlist "load tempo" buttons */
  function bindLoaders(scope) {
    scope.querySelectorAll('[data-load-bpm]').forEach(function (el) {
      el.addEventListener('click', function () {
        var bpm = parseInt(el.getAttribute('data-load-bpm'), 10);
        var sig = el.getAttribute('data-load-sig');
        if (!isNaN(bpm)) setBpm(bpm);
        if (sig && parseInt(sig, 10) !== state.beatsPerBar) {
          sigSel.value = sig;
          sigSel.dispatchEvent(new Event('change'));
        }
        root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        startBtn.focus({ preventScroll: true });
      });
    });
  }
  bindLoaders(document);

  buildDots();
  refreshReadouts();
})();
