/* neon-utsav — Sana Qureshi, Bollywood Choreographer
   Plain script, no libraries. Contents:
   1. view-transition abort guard   2. mobile Cue menu
   3. Rehearsal Planner (reads Tables T1/T2 from the page)
   4. Booking estimator (reads the printed fee table)
   5. Count-in practice tool — the site's only audio: tap-started,
      synthesised clave at a printed tempo, fixed gain 0.12,
      self-stopping after sixteen counts.
   6. Enquiry form validation (demonstration — transmits nothing) */
(function () {
  'use strict';

  /* 1 — cross-document view transitions can abort when a navigation
     supersedes them; the abort surfaces as an unhandled rejection.
     Swallow only that exact case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 2 — Cue menu ---------------------------------------------------- */
  var cueBtn = document.getElementById('cue-btn');
  var panel = document.getElementById('menu-panel');
  if (cueBtn && panel) {
    var openMenu = function () {
      panel.hidden = false;
      cueBtn.setAttribute('aria-expanded', 'true');
      cueBtn.textContent = 'Cue ▴';
      requestAnimationFrame(function () {
        var first = panel.querySelector('a');
        if (first) first.focus();
      });
    };
    var closeMenu = function (refocus) {
      panel.hidden = true;
      cueBtn.setAttribute('aria-expanded', 'false');
      cueBtn.textContent = 'Cue ▾';
      if (refocus) cueBtn.focus();
    };
    cueBtn.addEventListener('click', function () {
      if (panel.hidden) openMenu(); else closeMenu(false);
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) closeMenu(true);
    });
  }

  /* shared controls -------------------------------------------------- */
  function segValue(id) {
    var b = document.querySelector('#' + id + ' button[aria-pressed="true"]');
    return b ? b.dataset.v || b.dataset.bpm : null;
  }
  function bindSeg(id, onChange) {
    var group = document.getElementById(id);
    if (!group) return;
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      onChange();
    });
  }
  var STEPPERS = {
    'p-songs': { min: 1, max: 8 }, 'p-phrases': { min: 4, max: 24 }, 'p-weeks': { min: 1, max: 12 },
    'e-songs': { min: 1, max: 8 }, 'e-sessions': { min: 0, max: 30 }, 'e-assist': { min: 0, max: 6 }
  };
  function stepVal(id) { return parseInt(document.getElementById(id).textContent, 10) || 0; }
  var stepperCallbacks = [];
  function bindSteppers(onChange) {
    /* Called once per tool; the click listener itself is attached
       exactly once per button, then every registered tool recomputes. */
    stepperCallbacks.push(onChange);
    document.querySelectorAll('[data-step]').forEach(function (btn) {
      if (btn.dataset.stepBound) return;
      btn.dataset.stepBound = '1';
      btn.addEventListener('click', function () {
        var parts = btn.dataset.step.split(':');
        var id = parts[0], d = parseInt(parts[1], 10), cfg = STEPPERS[id];
        var out = document.getElementById(id);
        if (!out || !cfg) return;
        var v = Math.min(cfg.max, Math.max(cfg.min, stepVal(id) + d));
        out.textContent = v;
        stepperCallbacks.forEach(function (cb) { cb(); });
      });
    });
  }
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
  function hours(min) {
    var h = Math.floor(min / 60), m = Math.round(min % 60);
    return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
  }

  /* 3 — Rehearsal Planner -------------------------------------------- */
  var rateTable = document.getElementById('rate-table');
  if (rateTable) {
    var RATES = {}, CHANGES = {};
    rateTable.querySelectorAll('tbody tr').forEach(function (tr) {
      RATES[tr.dataset.class] = { phrase: +tr.dataset.phrase, form: +tr.dataset.form };
    });
    document.querySelectorAll('#changes-table tbody tr').forEach(function (tr) {
      CHANGES[tr.dataset.type] = +tr.dataset.changes;
    });
    var CLASS_LABEL = { troupe: 'trained troupe', mixed: 'mixed group', family: 'non-dancer family' };
    var TYPE_LABEL = { film: 'film song', stage: 'stage number', sangeet: 'sangeet number' };

    var computePlanner = function () {
      var type = segValue('p-type'), cls = segValue('p-class');
      var rate = RATES[cls], changes = CHANGES[type];
      var songs = stepVal('p-songs'), phrases = stepVal('p-phrases'), avail = stepVal('p-weeks');
      var phraseMin = songs * phrases * rate.phrase;
      var formMin = songs * changes * rate.form;
      var total = phraseMin + formMin;
      var sessions = Math.ceil(total / 120);
      var teach = Math.ceil(sessions / 3);
      var cal = teach + 1;
      var spare = avail - cal;

      document.getElementById('w-phrase-lab').textContent =
        'Phrase teaching — ' + songs + ' songs × ' + phrases + ' phrases × ' + rate.phrase + ' min (' + CLASS_LABEL[cls] + ')';
      document.getElementById('w-phrase').textContent = phraseMin.toLocaleString('en-IN') + ' min';
      document.getElementById('w-form-lab').textContent =
        'Formation teaching — ' + songs + ' songs × ' + changes + ' changes (' + TYPE_LABEL[type] + ') × ' + rate.form + ' min';
      document.getElementById('w-form').textContent = formMin.toLocaleString('en-IN') + ' min';
      document.getElementById('w-total').textContent = total.toLocaleString('en-IN') + ' min · ' + hours(total);
      document.getElementById('w-sessions').textContent = sessions + ' sessions';
      document.getElementById('w-teach').textContent = teach + (teach === 1 ? ' week' : ' weeks');
      document.getElementById('w-cal').textContent = cal + ' weeks, against ' + avail + ' available';

      var box = document.getElementById('p-verdict');
      var head = document.getElementById('v-head'), body = document.getElementById('v-body');
      box.classList.remove('bad');
      if (spare > 0) {
        head.textContent = 'Lands — ' + spare + (spare === 1 ? ' week' : ' weeks') + ' to spare.';
        body.innerHTML = 'Teaching ends in week <b>' + teach + '</b>; the polish week is week <b>' + cal +
          '</b>; the date is <b>' + avail + ' weeks</b> out. Keep the spare week empty — it is where moved sessions and sick uncles land.';
      } else if (spare === 0) {
        head.textContent = 'Lands exactly — no slack.';
        body.innerHTML = 'Teaching ends in week <b>' + teach + '</b> and the polish week is the last week before the date. ' +
          'One lost session breaks this plan: protect the calendar, or trim a phrase.';
      } else {
        box.classList.add('bad');
        var budgetMin = Math.max(0, (avail - 1) * 3 * 120);
        var perSong = phrases * rate.phrase + changes * rate.form;
        var songsFit = Math.floor(budgetMin / perSong);
        var twoSessions = Math.ceil((total / 2) / 120);
        var twoCal = Math.ceil(twoSessions / 3) + 1;
        var remedy = songsFit >= 1
          ? 'hold the date and cut to <b>' + songsFit + (songsFit === 1 ? ' song' : ' songs') + '</b> at ' + phrases + ' phrases each'
          : 'not even one song fits before the polish week — the date itself has to move';
        head.textContent = 'This lands after the date.';
        body.innerHTML = 'At this size the work needs <b>' + cal + ' calendar weeks</b>; you have <b>' + avail + '</b>. ' +
          'The printed remedies: a second choreographer halves the floor time — <b>' + twoCal + ' calendar weeks</b>, ' +
          (twoCal <= avail ? 'which lands' : 'which still does not land') + ' — or ' + remedy +
          ', or start <b>' + cal + ' weeks</b> out. What does not work is hoping the family learns faster.';
      }
    };
    bindSeg('p-type', computePlanner);
    bindSeg('p-class', computePlanner);
    bindSteppers(computePlanner);
    computePlanner();
  }

  /* 4 — Booking estimator --------------------------------------------- */
  var feeTable = document.getElementById('fee-table');
  if (feeTable) {
    var FEES = {}, LINES = {};
    feeTable.querySelectorAll('tbody tr').forEach(function (tr) {
      if (tr.dataset.type) FEES[tr.dataset.type] = +tr.dataset.rate;
      if (tr.dataset.line) LINES[tr.dataset.line] = +tr.dataset.rate;
    });
    var ETYPE_LABEL = { film: 'film song', stage: 'stage number', sangeet: 'sangeet number' };
    var computeEstimator = function () {
      var type = segValue('e-type');
      var songs = stepVal('e-songs'), sessions = stepVal('e-sessions'), assist = stepVal('e-assist');
      var c1 = songs * FEES[type], c2 = sessions * LINES.floor, c3 = assist * LINES.assistant;
      document.getElementById('ew-songs-lab').textContent =
        'Choreography — ' + songs + ' × ' + inr(FEES[type]) + ' (' + ETYPE_LABEL[type] + ')';
      document.getElementById('ew-songs').textContent = inr(c1);
      document.getElementById('ew-floor').textContent = inr(c2);
      document.getElementById('ew-assist').textContent = inr(c3);
      document.getElementById('ew-total').textContent = inr(c1 + c2 + c3);
    };
    bindSeg('e-type', computeEstimator);
    bindSteppers(computeEstimator);
    computeEstimator();
  }

  /* 5 — Count-in practice tool ----------------------------------------- */
  var ciDisplay = document.getElementById('ci-display');
  if (ciDisplay) {
    var SEQ = [5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4];
    var ciStatus = document.getElementById('ci-status');
    var playBtn = document.getElementById('ci-play');
    var stopBtn = document.getElementById('ci-stop');
    var actx = null, master = null, timer = null, idx = 0, playing = false;
    window.__acCreated = 0;

    var ensureCtx = function () {
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
        window.__acCreated += 1;
        master = actx.createGain();
        master.gain.value = 0.12;
        master.connect(actx.destination);
      }
      if (actx.state === 'suspended') actx.resume();
    };
    var click = function (accent) {
      var t = actx.currentTime;
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square';
      o.frequency.value = accent ? 1568 : 1047;
      g.gain.setValueAtTime(0.85, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.05);
    };
    var bpm = function () { return parseInt(segValue('ci-tempos'), 10) || 92; };
    var finish = function (msg) {
      if (timer) { clearInterval(timer); timer = null; }
      playing = false;
      playBtn.disabled = false;
      stopBtn.disabled = true;
      ciStatus.textContent = msg;
    };
    var beat = function () {
      var n = SEQ[idx];
      ciDisplay.textContent = n;
      var accent = (idx === 0) || n === 1;
      ciDisplay.classList.toggle('accent', accent);
      click(accent);
      idx += 1;
      if (idx >= SEQ.length) {
        if (timer) { clearInterval(timer); timer = null; }
        playing = false;
        playBtn.disabled = false;
        stopBtn.disabled = true;
        ciStatus.textContent = 'Count-in finished — sixteen counts at ' + bpm() + ' BPM. The floor is yours.';
      }
    };
    var start = function () {
      ensureCtx();
      idx = 0;
      playing = true;
      playBtn.disabled = true;
      stopBtn.disabled = false;
      ciStatus.textContent = 'Count-in running — ' + bpm() + ' BPM. Sixteen counts, then it stops itself.';
      beat();
      timer = setInterval(beat, 60000 / bpm());
    };
    playBtn.addEventListener('click', start);
    stopBtn.addEventListener('click', function () { finish('Stopped. Pick it up from 5 whenever the floor is ready.'); });
    bindSeg('ci-tempos', function () { if (playing) { if (timer) clearInterval(timer); start(); } });
  }

  /* 6 — Enquiry form ------------------------------------------------------ */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var confirm = document.getElementById('form-confirm');
    var checks = {
      'f-name': function () { return document.getElementById('in-name').value.trim().length >= 2; },
      'f-email': function () { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('in-email').value.trim()); },
      'f-type': function () { return document.getElementById('in-type').value !== ''; },
      'f-date': function () {
        var v = document.getElementById('in-date').value;
        if (!v) return false;
        var d = new Date(v + 'T00:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        return d > today;
      },
      'f-msg': function () { return document.getElementById('in-msg').value.trim().length >= 10; }
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(checks).forEach(function (id) {
        var wrap = document.getElementById(id);
        var ok = checks[id]();
        wrap.classList.toggle('invalid', !ok);
        if (!ok && !firstBad) firstBad = wrap.querySelector('input,select,textarea');
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'SQ-2026-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('confirm-ref').textContent = ref;
      form.hidden = true;
      confirm.hidden = false;
      confirm.focus();
    });
    form.querySelectorAll('input,select,textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
