/* Mridanga Beat — tabla maestro console.
   Vanilla JS: mobile index panel, the Tala Practice Planner (reads the
   printed table), the cycle bench (one tap-gated Web Audio cycle), the form. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition abort guard: an aborted CSS view transition surfaces as
     an unhandled InvalidStateError rejection; swallow only that exact case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile index panel ---------- */
  var btn = document.getElementById('menu-btn');
  var panel = document.getElementById('mobile-panel');
  if (btn && panel) {
    var setPanel = function (open) {
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      }
    };
    btn.addEventListener('click', function () {
      setPanel(!panel.classList.contains('open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        setPanel(false);
        btn.focus();
      }
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setPanel(false); });
    });
  }

  /* ---------- Tala Practice Planner ---------- */
  var table = document.getElementById('tala-table');
  if (table) {
    var TALAS = {};
    var rows = {};
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var name = tr.getAttribute('data-tala');
      TALAS[name] = {
        matras: parseInt(tr.getAttribute('data-matras'), 10),
        ceiling: parseInt(tr.getAttribute('data-ceiling'), 10),
        pattern: tr.getAttribute('data-pattern')
      };
      rows[name] = tr;
    });

    var state = { tala: 'Teental', bpm: 60, min: 30 };
    var outCycle = document.getElementById('out-cycle');
    var outCycles = document.getElementById('out-cycles');
    var outBeats = document.getElementById('out-beats');
    var outTala = document.getElementById('out-tala');
    var outPattern = document.getElementById('out-pattern');
    var outHonest = document.getElementById('out-honest');
    var bpmVal = document.getElementById('bpm-val');
    var minVal = document.getElementById('min-val');

    var render = function () {
      var t = TALAS[state.tala];
      var cycleSec = t.matras * 60 / state.bpm;
      var cycles = Math.floor(state.min * 60 / cycleSec);
      var beats = cycles * t.matras;
      bpmVal.textContent = state.bpm;
      minVal.textContent = state.min;
      outCycle.innerHTML = cycleSec.toFixed(1) + ' <small>sec</small>';
      outCycles.textContent = cycles.toLocaleString('en-IN');
      outBeats.textContent = beats.toLocaleString('en-IN');
      outTala.textContent = state.tala;
      outPattern.textContent = t.pattern;
      Object.keys(rows).forEach(function (k) {
        rows[k].setAttribute('aria-selected', k === state.tala ? 'true' : 'false');
      });
      document.querySelectorAll('[data-chip]').forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip.getAttribute('data-chip') === state.tala ? 'true' : 'false');
      });
      if (state.bpm > t.ceiling) {
        outHonest.hidden = false;
        outHonest.innerHTML = '<strong>Honest note:</strong> ' + state.bpm + ' BPM is past the learning ceiling for ' +
          state.tala + ' (' + t.ceiling + ' BPM — it is printed in the table above). At that speed the hands memorise ' +
          'the gaps between the bols instead of the bols: the cycle feels fluent, and falls apart the moment a singer ' +
          'leans on it. Practise this tala at ' + t.ceiling + ' BPM or below until the theka holds for twenty cycles ' +
          'without drifting. Speed is earned later, in performance — not in practice.';
      } else {
        outHonest.hidden = true;
        outHonest.innerHTML = '';
      }
    };

    document.querySelectorAll('[data-chip]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.tala = chip.getAttribute('data-chip');
        render();
      });
    });
    var step = function (id, fn) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };
    step('bpm-up', function () { state.bpm = Math.min(200, state.bpm + 4); render(); });
    step('bpm-down', function () { state.bpm = Math.max(40, state.bpm - 4); render(); });
    step('min-up', function () { state.min = Math.min(120, state.min + 5); render(); });
    step('min-down', function () { state.min = Math.max(10, state.min - 5); render(); });
    render();
  }

  /* ---------- The cycle bench ----------
     ONE tap-gated Web Audio bench. Off by default; no AudioContext exists
     until a button is pressed. Master gain 0.12. Plays exactly one cycle of
     synthesized strokes and stops by itself. */
  var BENCH = {
    teental: { label: 'Teental', matras: 16, bpm: 96, sam: [1], tali: [5, 13], khali: [9] },
    jhaptal: { label: 'Jhaptal', matras: 10, bpm: 90, sam: [1], tali: [3, 8], khali: [6] },
    keherwa: { label: 'Keherwa', matras: 8, bpm: 100, sam: [1], tali: [], khali: [5] },
    dadra: { label: 'Dadra', matras: 6, bpm: 100, sam: [1], tali: [], khali: [4] },
    rupak: { label: 'Rupak', matras: 7, bpm: 84, sam: [], tali: [4, 6], khali: [1] }
  };
  window.MR_BENCH = { contexts: 0, lastPeak: 0, playing: false, cyclesPlayed: 0 };
  var benchStatus = document.getElementById('bench-status');
  var actx = null, master = null, analyser = null, peakTimer = null;

  function ensureContext() {
    if (actx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    actx = new AC();
    window.MR_BENCH.contexts += 1;
    master = actx.createGain();
    master.gain.value = 0.12;
    analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    master.connect(analyser);
    analyser.connect(actx.destination);
  }
  function stroke(t, kind, rel) {
    var dur = kind === 'bayan' ? 0.22 : 0.13;
    var osc = actx.createOscillator();
    var g = actx.createGain();
    osc.type = 'sine';
    if (kind === 'dayan') { osc.frequency.setValueAtTime(235, t); osc.frequency.exponentialRampToValueAtTime(155, t + dur); }
    else if (kind === 'bayan') { osc.frequency.setValueAtTime(128, t); osc.frequency.exponentialRampToValueAtTime(82, t + dur); }
    else { osc.frequency.setValueAtTime(320, t); osc.frequency.exponentialRampToValueAtTime(280, t + dur); }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(rel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function playCycle(key, button) {
    if (window.MR_BENCH.playing) return;
    ensureContext();
    if (actx.state === 'suspended') actx.resume();
    var spec = BENCH[key];
    var spb = 60 / spec.bpm;
    var total = spec.matras * spb;
    var t0 = actx.currentTime + 0.06;
    for (var beat = 1; beat <= spec.matras; beat++) {
      var t = t0 + (beat - 1) * spb;
      if (spec.sam.indexOf(beat) !== -1) { stroke(t, 'dayan', 0.60); stroke(t, 'bayan', 0.35); }
      else if (spec.tali.indexOf(beat) !== -1) { stroke(t, 'dayan', 0.50); }
      else if (spec.khali.indexOf(beat) !== -1) { stroke(t, 'bayan', 0.38); }
      else { stroke(t, 'tick', 0.26); }
    }
    window.MR_BENCH.playing = true;
    button.classList.add('playing');
    if (benchStatus) benchStatus.textContent = 'Playing one cycle of ' + spec.label + ' — ' + spec.matras + ' beats at ' + spec.bpm + ' BPM (' + total.toFixed(1) + ' sec). It stops by itself.';
    var buf = new Float32Array(analyser.fftSize);
    peakTimer = setInterval(function () {
      analyser.getFloatTimeDomainData(buf);
      for (var i = 0; i < buf.length; i++) {
        var v = Math.abs(buf[i]);
        if (v > window.MR_BENCH.lastPeak) window.MR_BENCH.lastPeak = v;
      }
    }, 40);
    setTimeout(function () {
      clearInterval(peakTimer);
      window.MR_BENCH.playing = false;
      window.MR_BENCH.cyclesPlayed += 1;
      button.classList.remove('playing');
      if (benchStatus) benchStatus.textContent = 'Cycle finished — ' + spec.label + ', ' + spec.matras + ' beats at ' + spec.bpm + ' BPM. Press again to hear it once more.';
    }, Math.round(total * 1000) + 350);
  }
  document.querySelectorAll('[data-bench]').forEach(function (button) {
    button.addEventListener('click', function () { playCycle(button.getAttribute('data-bench'), button); });
  });

  /* ---------- contact form ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var email = document.getElementById('f-email').value.trim();
      var msg = document.getElementById('f-msg').value.trim();
      if (!name || !email || !msg || email.indexOf('@') === -1) {
        var firstBad = !name ? 'f-name' : (!email || email.indexOf('@') === -1 ? 'f-email' : 'f-msg');
        document.getElementById(firstBad).focus();
        return;
      }
      var ref = 'RK-2027-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('form-ref').textContent = ref;
      document.getElementById('form-echo').textContent =
        'Thank you, ' + name.split(' ')[0] + ' — I will reply personally to ' + email + ', usually within two days. Keep the reference if you write again about the same enquiry.';
      var confirm = document.getElementById('form-confirm');
      confirm.hidden = false;
      confirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.reset();
    });
  }
})();
