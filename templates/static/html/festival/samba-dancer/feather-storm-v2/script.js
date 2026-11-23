/* Larissa Peixoto — Samba Dancer (feather-storm rebuild)
   Sound ruling: ONE tap-gated teaching tool — the Bateria Tempo
   metronome below. It is OFF until the visitor presses Start, it is
   synthesised (no recordings), fixed low gain (0.12), self-stops
   after 8 bars, and has a Stop control. Nothing else on this site
   makes a sound; there is no hover or autoplay audio anywhere. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces an unhandled InvalidStateError
     rejection. The navigation itself always completes — swallow only
     that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var fmtBRL = function (n) { return 'R$ ' + n.toLocaleString('pt-BR'); };

  /* ---------------- mobile programme panel ---------------- */
  var menuBtn = document.querySelector('.menu-btn');
  var panel = document.getElementById('nav-panel');
  if (menuBtn && panel) {
    var closeMenu = function () {
      panel.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    menuBtn.addEventListener('click', function () {
      var open = panel.hidden;
      if (open) {
        panel.hidden = false;
        menuBtn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      } else {
        closeMenu();
        menuBtn.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { closeMenu(); menuBtn.focus(); }
    });
  }

  /* ---------------- stepper helper ---------------- */
  function wireStepper(rootId, min, max, onChange) {
    var root = document.getElementById(rootId);
    if (!root) return null;
    var valEl = root.querySelector('.val');
    var state = { value: parseInt(valEl.textContent, 10) || min };
    var render = function () { valEl.textContent = state.value; };
    root.querySelector('[data-step="-1"]').addEventListener('click', function () {
      if (state.value > min) { state.value--; render(); onChange(state.value); }
    });
    root.querySelector('[data-step="1"]').addEventListener('click', function () {
      if (state.value < max) { state.value++; render(); onChange(state.value); }
    });
    render();
    return state;
  }

  /* ---------------- Parade Readiness Planner ----------------
     Every figure is parsed from the tables and rules printed on the
     page itself, so the tool and the page cannot disagree. */
  var planner = document.getElementById('planner');
  if (planner) {
    var rulesEl = document.getElementById('planner-rules');
    var RATE = parseInt(rulesEl.getAttribute('data-atelier-rate'), 10);      // build-hours per week
    var STANDARD = parseInt(rulesEl.getAttribute('data-rehearsal-standard'), 10); // sessions
    var classes = {};
    document.querySelectorAll('#costume-table tbody tr').forEach(function (tr) {
      classes[tr.getAttribute('data-class')] = {
        name: tr.getAttribute('data-name'),
        hours: parseInt(tr.getAttribute('data-hours'), 10),
        fittings: parseInt(tr.getAttribute('data-fittings'), 10)
      };
    });
    var classSel = document.getElementById('planner-class');
    var workings = document.getElementById('planner-workings');
    var verdict = document.getElementById('planner-verdict');
    var weeks = { value: 12 }, sessions = { value: 3 };

    var computePlanner = function () {
      var c = classes[classSel.value];
      document.querySelectorAll('#costume-table tbody tr').forEach(function (tr) {
        tr.setAttribute('aria-selected', tr.getAttribute('data-class') === classSel.value ? 'true' : 'false');
      });
      var buildWeeks = Math.ceil(c.hours / RATE);
      var available = weeks.value - 1; // costume finished 1 week before parade day
      var totalSessions = sessions.value * weeks.value;
      var lines = [
        'Costume class ' + classSel.value + ' — ' + c.name + ': ' + c.hours + ' build hours (the atelier\u2019s figure, Table 1).',
        'Atelier rate: ' + RATE + ' build-hours per week \u2192 ' + c.hours + ' \u00F7 ' + RATE + ' = ' + (c.hours / RATE).toFixed(1) + ' \u2192 ' + buildWeeks + ' weeks of build (rounded up).',
        'Fittings: ' + c.fittings + ', one per week across the final ' + c.fittings + ' weeks of the build — inside the build window, not added to it.',
        'Parade deadline: the costume must be finished 1 week before parade day (technical rehearsal in full costume) \u2192 ' + weeks.value + ' \u2212 1 = ' + available + ' weeks available for the build.',
        'Rehearsals: ' + sessions.value + ' sessions/week \u00D7 ' + weeks.value + ' weeks = ' + totalSessions + ' sessions. The school\u2019s stated readiness standard: ' + STANDARD + ' sessions.'
      ];
      workings.innerHTML = lines.map(function (l) { return '<p>' + l + '</p>'; }).join('');
      var vTitle = verdict.querySelector('.v-title');
      var vBody = verdict.querySelector('p');
      verdict.classList.remove('bad', 'warn');
      if (buildWeeks > available) {
        verdict.classList.add('bad');
        vTitle.textContent = 'The costume cannot be built in this window';
        vBody.textContent = 'The build needs ' + buildWeeks + ' weeks; only ' + available + ' are available before the technical rehearsal. The honest options, in order: parade in last season\u2019s costume, or step back a position whose costume already exists. A destaque does not promise the avenue a costume the atelier cannot finish.';
      } else if (totalSessions < STANDARD) {
        verdict.classList.add('warn');
        vTitle.textContent = 'Costume fits — rehearsal standard not met';
        vBody.textContent = 'The costume is ready with ' + (available - buildWeeks) + ' weeks to spare, but ' + totalSessions + ' sessions is ' + (STANDARD - totalSessions) + ' short of the school\u2019s ' + STANDARD + '-session standard. Add a weekly session, start earlier, or step back a position — the avenue can tell an under-rehearsed destaque.';
      } else {
        vTitle.textContent = 'Ready — costume and rehearsal standard both met';
        vBody.textContent = 'Build: ' + buildWeeks + ' weeks against ' + available + ' available (' + (available - buildWeeks) + ' weeks spare before the technical rehearsal). Rehearsals: ' + totalSessions + ' sessions against a ' + STANDARD + '-session standard. This is the window the booking terms ask for.';
      }
    };
    weeks = wireStepper('weeks-stepper', 2, 24, computePlanner) || weeks;
    sessions = wireStepper('sessions-stepper', 1, 7, computePlanner) || sessions;
    classSel.addEventListener('change', computePlanner);
    computePlanner();
  }

  /* ---------------- Booking estimator ---------------- */
  var estimator = document.getElementById('estimator');
  if (estimator) {
    var rates = {};
    document.querySelectorAll('#rate-table tbody tr').forEach(function (tr) {
      rates[tr.getAttribute('data-key')] = {
        name: tr.getAttribute('data-name'),
        unit: tr.getAttribute('data-unit'),
        rate: parseInt(tr.getAttribute('data-rate'), 10)
      };
    });
    var travelFees = {};
    document.querySelectorAll('#travel-table tbody tr').forEach(function (tr) {
      travelFees[tr.getAttribute('data-key')] = {
        name: tr.getAttribute('data-name'),
        fee: parseInt(tr.getAttribute('data-fee'), 10)
      };
    });
    var svcSel = document.getElementById('est-service');
    var travelSel = document.getElementById('est-travel');
    var estWorkings = document.getElementById('est-workings');
    var qty = { value: 1 };
    var computeEst = function () {
      var s = rates[svcSel.value];
      var t = travelFees[travelSel.value];
      var lineTotal = s.rate * qty.value;
      var total = lineTotal + t.fee;
      estWorkings.innerHTML =
        '<p>' + s.name + ' — ' + s.unit + ': ' + fmtBRL(s.rate) + ' \u00D7 ' + qty.value + ' = ' + fmtBRL(lineTotal) + '</p>' +
        '<p>Travel — ' + t.name + ': ' + fmtBRL(t.fee) + ' (flat, per engagement)</p>' +
        '<p class="total">Estimate total: ' + fmtBRL(total) + '</p>' +
        '<p class="small">An estimate from the printed rate card, not a quote. Costume class and travel are what move it — see the fee notes.</p>';
    };
    qty = wireStepper('qty-stepper', 1, 12, computeEst) || qty;
    svcSel.addEventListener('change', computeEst);
    travelSel.addEventListener('change', computeEst);
    computeEst();
  }

  /* ---------------- Bateria Tempo (tap-gated metronome) ----------------
     Strict pattern: AudioContext is created ONLY on the Start tap;
     synthesised pattern, master gain 0.12, self-stops after 8 bars,
     Stop control always available while playing. */
  var tempo = document.getElementById('tempo-tool');
  if (tempo) {
    var startBtn = document.getElementById('tempo-start');
    var stopBtn = document.getElementById('tempo-stop');
    var status = document.getElementById('tempo-status');
    var bpm = 140;
    tempo.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        tempo.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        bpm = parseInt(chip.getAttribute('data-bpm'), 10);
        if (!playing) status.textContent = 'Ready — ' + bpm + ' BPM. Press start; the tempo plays 8 bars and stops itself.';
      });
    });
    var ctx = null, master = null, timer = null, playing = false;
    var beat = 0, nextTime = 0;
    var TOTAL_BEATS = 32; // 8 bars of 4
    function thump(t) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(96, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.18);
    }
    function click(t, accent) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = accent ? 2100 : 1600;
      g.gain.setValueAtTime(accent ? 0.25 : 0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.05);
    }
    function scheduler() {
      var spb = 60 / bpm;
      while (nextTime < ctx.currentTime + 0.12) {
        var inBar = beat % 4;
        if (inBar === 0 || inBar === 2) thump(nextTime);
        click(nextTime, inBar === 0);
        status.textContent = 'Playing — bar ' + (Math.floor(beat / 4) + 1) + ' of 8, ' + bpm + ' BPM.';
        beat++;
        nextTime += spb;
        if (beat >= TOTAL_BEATS) {
          var stopAt = nextTime;
          setTimeout(stopTempo, Math.max(0, (stopAt - ctx.currentTime) * 1000));
          clearInterval(timer); timer = null;
          return;
        }
      }
    }
    function stopTempo() {
      if (timer) { clearInterval(timer); timer = null; }
      playing = false;
      startBtn.hidden = false;
      stopBtn.hidden = true;
      status.textContent = 'Stopped. ' + bpm + ' BPM, 8 bars — the length of a quadra warm-up round.';
    }
    startBtn.addEventListener('click', function () {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.12;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      beat = 0;
      nextTime = ctx.currentTime + 0.06;
      playing = true;
      startBtn.hidden = true;
      stopBtn.hidden = false;
      stopBtn.focus();
      timer = setInterval(scheduler, 25);
    });
    stopBtn.addEventListener('click', stopTempo);
  }

  /* ---------------- contact form (demonstration) ---------------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var confirmation = document.getElementById('form-confirmation');
    var showErr = function (id, on) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('on', on);
      return !on;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var type = document.getElementById('f-type');
      var msg = document.getElementById('f-message');
      var ok = true;
      ok = showErr('e-name', name.value.trim().length < 2) && ok;
      ok = showErr('e-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
      ok = showErr('e-type', !type.value) && ok;
      ok = showErr('e-message', msg.value.trim().length < 10) && ok;
      if (!ok) return;
      var ref = 'LP-2026-' + String(1000 + (Date.now() % 9000));
      document.getElementById('confirmation-ref').textContent = ref;
      document.getElementById('confirmation-summary').textContent =
        type.options[type.selectedIndex].text + ' — for ' + name.value.trim() + '.';
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.setAttribute('tabindex', '-1');
      confirmation.focus();
    });
  }
})();
