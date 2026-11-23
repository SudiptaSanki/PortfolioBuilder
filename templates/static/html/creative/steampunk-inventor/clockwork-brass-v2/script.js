/* ============================================================
   FETTLE & BRASS — Clockwork Brass (fictional workshop)
   Sound ruling: NONE. This script contains no audio code and
   never creates an AudioContext. The stub's hover-triggered
   gear-click audio was deleted with the stub: hover audio is a
   deal-breaker in this program, and a fake steam hiss would be
   exactly the dishonesty this persona jokes about.
   The planner and estimator parse their figures from the
   printed tables in the DOM, so tool and page cannot disagree.
   ============================================================ */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces as an unhandled InvalidStateError rejection.
     The navigation itself always completes; swallow only that case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu panel ---------- */
  var toggle = document.getElementById('menuToggle');
  var panel = document.getElementById('menuPanel');
  if (toggle && panel) {
    var closePanel = function (refocus) {
      panel.hidden = true;
      panel.classList.remove('open-anim');
      toggle.setAttribute('aria-expanded', 'false');
      if (refocus) toggle.focus();
    };
    toggle.addEventListener('click', function () {
      if (panel.hidden) {
        panel.hidden = false;
        panel.classList.add('open-anim');
        toggle.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      } else {
        closePanel(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) closePanel(true);
    });
  }

  /* ---------- helpers ---------- */
  function money(n) {
    var v = Math.round(n * 100) / 100;
    if (Number.isInteger(v)) return '£' + v.toLocaleString('en-GB');
    return '£' + v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function parseRows(tableId) {
    var out = {};
    var table = document.getElementById(tableId);
    if (!table) return out;
    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i < rows.length; i++) {
      var d = rows[i].dataset;
      if (d.cls) out[d.cls] = d;
    }
    return out;
  }
  function bindStepper(minusId, plusId, valId, state, key, min, max, step, format, onChange) {
    var minus = document.getElementById(minusId);
    var plus = document.getElementById(plusId);
    var val = document.getElementById(valId);
    if (!minus || !plus || !val) return;
    var render = function () { val.textContent = format(state[key]); };
    minus.addEventListener('click', function () {
      state[key] = Math.max(min, state[key] - step); render(); onChange();
    });
    plus.addEventListener('click', function () {
      state[key] = Math.min(max, state[key] + step); render(); onChange();
    });
    render();
  }
  function setLines(ul, lines) {
    ul.innerHTML = '';
    lines.forEach(function (line) {
      var li = document.createElement('li');
      if (line.total) li.className = 'total-line';
      li.textContent = line.text;
      ul.appendChild(li);
    });
  }

  var runRows = parseRows('runTable');     // data-run, data-cap, data-unit
  var guardRows = parseRows('guardTable'); // data-ops, data-dist, data-foot
  var feeRows = parseRows('feeTable');     // data-day, data-mat

  /* ============================================================
     THE CONTRAPTION PLANNER (index)
     ============================================================ */
  var planClass = document.getElementById('planClass');
  if (planClass && Object.keys(runRows).length && Object.keys(guardRows).length) {
    var planDist = document.getElementById('planDist');
    var planLines = document.getElementById('planLines');
    var planVerdict = document.getElementById('planVerdict');
    var pState = { hours: 4 };
    var singular = function (unit) { return unit.replace(/s$/, ''); };

    var computePlan = function () {
      var cls = planClass.value;
      var r = runRows[cls], g = guardRows[cls];
      var run = parseFloat(r.run), cap = parseFloat(r.cap), unit = r.unit;
      var ops = parseInt(g.ops, 10), minDist = parseFloat(g.dist), foot = g.foot;
      var dist = parseFloat(planDist.value);
      var hours = pState.hours;
      var showMin = hours * 60;
      var runs = Math.ceil(showMin / run);

      setLines(planLines, [
        { text: 'Show length: ' + hours + (hours === 1 ? ' hour' : ' hours') + ' = ' + showMin + ' minutes.' },
        { text: 'Class ' + cls + ' runs ' + run + ' minutes per ' + singular(unit) + ' (Table R1).' },
        { text: 'Runs needed: ' + showMin + ' ÷ ' + run + ' = ' + runs + ' — so ' + runs + ' ' + unit + ', counting the one given before doors.' },
        { text: 'Crew: ' + ops + (ops === 1 ? ' operator' : ' operators') + ' (Table G1). Ground needed: ' + foot + '.' }
      ]);

      var distOK = dist >= minDist;
      var capOK = hours <= cap;
      planVerdict.innerHTML = '';
      var head = document.createElement('p');
      head.className = 'v-head';
      if (distOK && capOK) {
        planVerdict.className = 'verdict ok';
        head.textContent = 'It runs.';
        var body = document.createElement('p');
        body.textContent = 'Your ' + dist + ' m clears the printed ' + minDist + ' m minimum for Class ' + cls +
          ', and ' + hours + ' h sits inside the ' + cap + '-hour day cap. Wind it, guard it, and book it with a clear conscience.';
        planVerdict.appendChild(head); planVerdict.appendChild(body);
      } else {
        planVerdict.className = 'verdict no';
        head.textContent = 'It stays home.';
        planVerdict.appendChild(head);
        var why = document.createElement('p');
        why.textContent = 'The printed tables say no:';
        planVerdict.appendChild(why);
        var ul = document.createElement('ul');
        if (!distOK) {
          var li1 = document.createElement('li');
          li1.textContent = 'Guarding — Class ' + cls + ' needs the crowd at ' + minDist + ' m or more (Table G1). You have ' + dist + ' m.';
          ul.appendChild(li1);
        }
        if (!capOK) {
          var li2 = document.createElement('li');
          li2.textContent = 'The day cap — Class ' + cls + ' works at most ' + cap + ' hours in a day (Table R1). You are asking for ' + hours + '.';
          ul.appendChild(li2);
        }
        planVerdict.appendChild(ul);
        var answer = null;
        var order = ['A', 'B', 'C', 'D'];
        for (var i = 0; i < order.length; i++) {
          var c2 = order[i];
          if (dist >= parseFloat(guardRows[c2].dist) && hours <= parseFloat(runRows[c2].cap)) { answer = c2; break; }
        }
        var tail = document.createElement('p');
        if (answer) {
          tail.textContent = 'The planner\u2019s answer: Class ' + answer + ' can do this show — ' +
            runRows[answer].run + ' min per ' + singular(runRows[answer].unit) + ', ' +
            guardRows[answer].dist + ' m guarding, ' + (String(runRows[answer].cap) === '8' ? 'an' : 'a') + ' ' + runRows[answer].cap + '-hour day cap. Same show, honest machine.';
        } else {
          tail.textContent = 'No class in the fleet can do it: the longest day any machine works is 8 hours (Class B), and every class carries a guarding minimum. Shorten the day, or move the barrier back.';
        }
        planVerdict.appendChild(tail);
      }
    };

    bindStepper('planHoursMinus', 'planHoursPlus', 'planHoursVal', pState, 'hours', 1, 10, 1,
      function (v) { return v + (v === 1 ? ' hour' : ' hours'); }, computePlan);
    planClass.addEventListener('change', computePlan);
    planDist.addEventListener('change', computePlan);
    computePlan();
  }

  /* ============================================================
     THE HIRE & COMMISSION ESTIMATOR (index)
     ============================================================ */
  var estLines = document.getElementById('estLines');
  if (estLines && Object.keys(feeRows).length && Object.keys(guardRows).length) {
    var constants = {};
    var feeList = document.getElementById('feeConstants');
    if (feeList) {
      var spans = feeList.querySelectorAll('[data-fee]');
      for (var i = 0; i < spans.length; i++) {
        constants[spans[i].dataset.fee] = parseFloat(spans[i].textContent.replace(/[£,%\s]/g, ''));
      }
    }
    var oprate = constants.oprate || 180;
    var milerate = constants.milerate || 0.9;
    var benchweek = constants.benchweek || 950;
    var depositPct = constants.deposit || 30;

    var mode = 'hire';
    var eState = { days: 2, miles: 40, weeks: 10 };
    var estClassH = document.getElementById('estClassH');
    var estClassC = document.getElementById('estClassC');
    var estHire = document.getElementById('estHire');
    var estComm = document.getElementById('estComm');
    var modeHire = document.getElementById('modeHire');
    var modeComm = document.getElementById('modeComm');

    var computeEst = function () {
      if (mode === 'hire') {
        var cls = estClassH.value;
        var day = parseFloat(feeRows[cls].day);
        var ops = parseInt(guardRows[cls].ops, 10);
        var hire = eState.days * day;
        var opsCost = ops * eState.days * oprate;
        var transport = eState.miles * 2 * milerate;
        var total = hire + opsCost + transport;
        setLines(estLines, [
          { text: 'Hire: ' + eState.days + (eState.days === 1 ? ' day' : ' days') + ' × ' + money(day) + ' (Class ' + cls + ' day rate, Table F1) = ' + money(hire) + '.' },
          { text: 'Operators: ' + ops + ' × ' + eState.days + (eState.days === 1 ? ' day' : ' days') + ' × ' + money(oprate) + ' = ' + money(opsCost) + '.' },
          { text: 'Transport: ' + eState.miles + ' miles each way × 2 × ' + money(milerate) + ' = ' + money(transport) + '.' },
          { text: 'Estimate total: ' + money(total) + '.', total: true },
          { text: 'Deposit to book (' + depositPct + '%): ' + money(total * depositPct / 100) + ' — the rest after the show, when it has worked.' }
        ]);
      } else {
        var cls2 = estClassC.value;
        var mat = parseFloat(feeRows[cls2].mat);
        var bench = eState.weeks * benchweek;
        var total2 = bench + mat;
        setLines(estLines, [
          { text: 'Bench time: ' + eState.weeks + (eState.weeks === 1 ? ' week' : ' weeks') + ' × ' + money(benchweek) + ' = ' + money(bench) + '.' },
          { text: 'Materials & castings (Class ' + cls2 + ', Table F1): ' + money(mat) + '.' },
          { text: 'Estimate total: ' + money(total2) + '.', total: true },
          { text: 'Deposit to book (' + depositPct + '%): ' + money(total2 * depositPct / 100) + ' — the drawing is agreed and signed before metal is cut.' }
        ]);
      }
    };

    var setMode = function (m) {
      mode = m;
      modeHire.setAttribute('aria-pressed', m === 'hire' ? 'true' : 'false');
      modeComm.setAttribute('aria-pressed', m === 'comm' ? 'true' : 'false');
      estHire.hidden = m !== 'hire';
      estComm.hidden = m !== 'comm';
      computeEst();
    };
    modeHire.addEventListener('click', function () { setMode('hire'); });
    modeComm.addEventListener('click', function () { setMode('comm'); });

    bindStepper('estDaysMinus', 'estDaysPlus', 'estDaysVal', eState, 'days', 1, 14, 1,
      function (v) { return v + (v === 1 ? ' day' : ' days'); }, computeEst);
    bindStepper('estMilesMinus', 'estMilesPlus', 'estMilesVal', eState, 'miles', 0, 400, 10,
      function (v) { return v + ' miles'; }, computeEst);
    bindStepper('estWeeksMinus', 'estWeeksPlus', 'estWeeksVal', eState, 'weeks', 1, 40, 1,
      function (v) { return v + (v === 1 ? ' week' : ' weeks'); }, computeEst);
    estClassH.addEventListener('change', computeEst);
    estClassC.addEventListener('change', computeEst);
    computeEst();
  }

  /* ============================================================
     ENQUIRY FORM (contact) — demonstration form, honestly labelled.
     Validates, then shows the confirmation a real enquiry gets.
     ============================================================ */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var fName = document.getElementById('fName');
    var fEmail = document.getElementById('fEmail');
    var fType = document.getElementById('fType');
    var fMsg = document.getElementById('fMsg');
    var eName = document.getElementById('eName');
    var eEmail = document.getElementById('eEmail');
    var eMsg = document.getElementById('eMsg');
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var confirmText = document.getElementById('confirmText');
    var againBtn = document.getElementById('againBtn');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      var name = fName.value.trim();
      var email = fEmail.value.trim();
      var msg = fMsg.value.trim();
      eName.textContent = ''; eEmail.textContent = ''; eMsg.textContent = '';
      if (name.length < 2) { eName.textContent = 'We need a name — the machines like to know who is asking.'; ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { eEmail.textContent = 'That email will not reach anyone. Check it and try again.'; ok = false; }
      if (msg.length < 10) { eMsg.textContent = 'Tell us a little more: which machine, where, and when — ten characters at least.'; ok = false; }
      if (!ok) return;
      var ref = 'FB-2027-' + (1000 + Math.floor(Math.random() * 9000));
      confirmRef.textContent = ref;
      confirmText.textContent = 'Thank you, ' + name + '. Your enquiry — ' + fType.value + ' — is stamped in under reference ' +
        ref + '. On the workshop\u2019s real site this is the moment the two-working-day clock starts: a price from the printed tables, a plan from the planner\u2019s rules, or a no with the reason attached.';
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    againBtn.addEventListener('click', function () {
      form.reset();
      eName.textContent = ''; eEmail.textContent = ''; eMsg.textContent = '';
      confirmBox.hidden = true;
      form.hidden = false;
      fName.focus();
    });
  }
})();
