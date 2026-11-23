/* Float of Giants — Klaassen Parade Works journal.
   Silent by design: no audio is created anywhere in this file.
   Both tools read their numbers from the tables printed on the
   page itself, so the tool and the journal can never disagree. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces as an unhandled rejection; the
     navigation itself has already completed. Swallow only that. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- Contents (mobile menu) ---------- */
  var btn = document.querySelector('.contents-btn');
  var panel = document.getElementById('contents-panel');
  if (btn && panel) {
    var closePanel = function () {
      btn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    };
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      if (open) { closePanel(); return; }
      btn.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      requestAnimationFrame(function () {
        var first = panel.querySelector('a');
        if (first) first.focus();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        closePanel(); btn.focus();
      }
    });
  }

  /* ---------- helpers ---------- */
  function num(el) { return parseFloat((el.textContent || '').replace(/[^0-9.]/g, '')); }
  function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }
  function round2(n) { return Math.round(n * 100) / 100; }
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(d) {
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------- steppers (bound once) ---------- */
  var onStep = [];
  document.querySelectorAll('.stepper').forEach(function (st) {
    if (st.dataset.bound) return;
    st.dataset.bound = '1';
    var valEl = st.querySelector('.step-val span');
    var min = parseInt(st.dataset.min, 10), max = parseInt(st.dataset.max, 10);
    st.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(st.dataset.value, 10) + parseInt(b.dataset.d, 10);
        v = Math.max(min, Math.min(max, v));
        st.dataset.value = String(v);
        if (valEl) valEl.textContent = String(v);
        onStep.forEach(function (fn) { fn(); });
      });
    });
  });
  function stepperVal(id) {
    var st = document.getElementById(id);
    return st ? parseInt(st.dataset.value, 10) : 0;
  }

  /* ================================================================
     THE BUILD PLANNER — parses Tables B1 (hours), B2 (crew),
     B3 (flower surface & coverage) and the pinning rules table.
     ================================================================ */
  var pClass = document.getElementById('p-class');
  if (pClass) {
    var pMethod = document.getElementById('p-method');
    var pDate = document.getElementById('p-date');

    function readHours() {
      var rows = [];
      document.querySelectorAll('#tbl-hours tbody tr').forEach(function (tr) {
        var cell = tr.querySelector('td[data-cls="' + pClass.value + '"]');
        rows.push({ stage: tr.dataset.stage, key: tr.dataset.key, hours: num(cell) });
      });
      return rows;
    }
    function readCrew(key) {
      var tr = document.querySelector('#tbl-crew tbody tr[data-key="' + key + '"]');
      return num(tr.querySelector('td'));
    }
    function readArea(cls) {
      var tr = document.querySelector('#tbl-flowers tbody tr[data-cls="' + cls + '"]');
      return num(tr.querySelector('td'));
    }
    function readRate(method) {
      var tr = document.querySelector('#tbl-coverage tbody tr[data-method="' + method + '"]');
      return num(tr.querySelector('td'));
    }
    function readPin(what) {
      var tr = document.querySelector('#tbl-pin tbody tr[data-pin="' + what + '"]');
      return num(tr.querySelector('td'));
    }

    function runPlanner() {
      var cls = pClass.value, method = pMethod.value;
      var weeks = stepperVal('p-weeks-step');
      var rows = readHours();
      var tbody = document.getElementById('p-stages');
      tbody.innerHTML = '';
      var totalHours = 0, buildWeeks = 0;
      rows.forEach(function (r) {
        var crew = readCrew(r.key);
        var wk = round2(r.hours / (crew * 40));
        totalHours += r.hours; buildWeeks += wk;
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + r.stage + '</td><td class="n">' + fmtInt(r.hours) + '</td>' +
          '<td class="n">' + crew + '</td><td class="n">' + wk.toFixed(2) + '</td>';
        tbody.appendChild(tr);
      });
      buildWeeks = round2(buildWeeks);
      var need = round2(buildWeeks + 1); /* + the flower week, printed rule */
      document.getElementById('p-total-hours').textContent = fmtInt(totalHours) + ' hours';
      document.getElementById('p-crew-days').textContent = (totalHours / 8).toFixed(1) + ' crew-days';
      document.getElementById('p-build-weeks').textContent = buildWeeks.toFixed(2) + ' weeks';

      var area = readArea(cls), rate = readRate(method);
      var flowers = area * rate;
      var pinRate = readPin('rate'), pinDay = readPin('day'), hold = readPin('hold');
      var flowerHours = flowers / pinRate;
      var flowerDays = Math.ceil(flowerHours / pinDay);
      document.getElementById('p-flower-line').textContent =
        area + ' m² × ' + rate + ' flowers = ' + fmtInt(flowers) + ' flowers';
      document.getElementById('p-flower-hours').textContent = flowerHours.toFixed(1) + ' pinning hours';
      document.getElementById('p-flower-days').textContent = flowerDays + ' pinning days';

      var startTxt = '—';
      var parade = pDate.value ? new Date(pDate.value + 'T12:00:00') : null;
      if (parade && !isNaN(parade)) {
        var start = new Date(parade.getTime());
        start.setDate(start.getDate() - flowerDays);
        startTxt = fmtDate(start);
      }
      document.getElementById('p-flower-start').textContent = startTxt;

      var verdict = document.getElementById('p-verdict');
      var problems = [];
      if (weeks < need) {
        problems.push('Class ' + cls + ' cannot be built in ' + weeks + ' weeks — the stages alone need ' +
          buildWeeks.toFixed(2) + ' weeks, and the flower week must follow them. Build a smaller class, or re-skin last year\u2019s float.');
      }
      if (flowerDays > hold) {
        problems.push('Pinning takes ' + flowerDays + ' days at the printed crew, but cut dahlias hold ' + hold +
          ' days — the flower crew must grow, or the first flowers pinned will be brown by parade morning.');
      }
      if (problems.length === 0) {
        verdict.className = 'verdict ok';
        verdict.innerHTML = '<p class="v-head">This build fits — with ' + (weeks - need).toFixed(1) + ' weeks to spare.</p>' +
          '<p>The stages need ' + buildWeeks.toFixed(2) + ' weeks, the flower week follows, and pinning starts ' +
          startTxt + ' — inside the ' + hold + '-day life of a cut dahlia.</p>';
      } else {
        verdict.className = 'verdict no';
        verdict.innerHTML = '<p class="v-head">Not in this window.</p>' +
          problems.map(function (p) { return '<p>' + p + '</p>'; }).join('');
      }
    }
    [pClass, pMethod].forEach(function (el) { el.addEventListener('change', runPlanner); });
    pDate.addEventListener('change', runPlanner);
    onStep.push(runPlanner);
    runPlanner();
  }

  /* ================================================================
     THE ESTIMATE — parses Table F1 (fees) and Table B3 (areas).
     ================================================================ */
  var eClass = document.getElementById('e-class');
  if (eClass) {
    var eMethod = document.getElementById('e-method');
    var eLighting = document.getElementById('e-lighting');
    function fee(sel) {
      var tr = document.querySelector(sel);
      return tr ? num(tr.querySelector('td')) : 0;
    }
    function runEstimator() {
      var cls = eClass.value, method = eMethod.value;
      var build = fee('#tbl-fees tbody tr[data-fee="build"][data-cls="' + cls + '"]');
      var frate = fee('#tbl-fees tbody tr[data-fee="flower"][data-method="' + method + '"]');
      var areaTr = document.querySelector('#tbl-flowers tbody tr[data-cls="' + cls + '"]');
      var area = num(areaTr.querySelector('td'));
      var flowerCost = frate * area;
      var lighting = fee('#tbl-fees tbody tr[data-fee="lighting"][data-opt="' + eLighting.value + '"]');
      var crewN = stepperVal('e-crew-step');
      var crewRate = fee('#tbl-fees tbody tr[data-fee="crew"]');
      var crewCost = crewN * crewRate;
      var transport = fee('#tbl-fees tbody tr[data-fee="transport"]');
      document.getElementById('e-build').textContent = '€' + fmtInt(build);
      document.getElementById('e-flower').textContent =
        '€' + fmtInt(frate) + ' × ' + area + ' m² = €' + fmtInt(flowerCost);
      document.getElementById('e-lighting-line').textContent = '€' + fmtInt(lighting);
      document.getElementById('e-crew-line').textContent =
        crewN + ' × €' + fmtInt(crewRate) + ' = €' + fmtInt(crewCost);
      document.getElementById('e-transport').textContent = '€' + fmtInt(transport);
      document.getElementById('e-total').textContent =
        '€' + fmtInt(build + flowerCost + lighting + crewCost + transport);
    }
    [eClass, eMethod, eLighting].forEach(function (el) { el.addEventListener('change', runEstimator); });
    onStep.push(runEstimator);
    runEstimator();
  }

  /* ================================================================
     CONTACT — demonstration form: validated in the page,
     nothing is transmitted anywhere.
     ================================================================ */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var summary = document.getElementById('form-errors');
    function setErr(id, msg) {
      var el = document.getElementById(id);
      if (el) { el.textContent = msg || ''; el.hidden = !msg; }
      return !msg;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var email = document.getElementById('f-email').value.trim();
      var msg = document.getElementById('f-msg').value.trim();
      var ok = true;
      ok = setErr('err-name', name ? '' : 'Your name is required — the journal answers people, not forms.') && ok;
      ok = setErr('err-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'A working email is required — it is the only way the workshop can answer.') && ok;
      ok = setErr('err-msg', msg ? '' : 'Tell us about the parade and the float you are dreaming of.') && ok;
      if (!ok) {
        summary.hidden = false;
        var firstBad = form.querySelector('.err:not([hidden])');
        if (firstBad) {
          var field = document.getElementById(firstBad.id.replace('err-', 'f-'));
          if (field) field.focus();
        }
        return;
      }
      summary.hidden = true;
      var ref = 'KPW-2027-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('conf-ref').textContent = ref;
      var cls = document.getElementById('f-class').value;
      var date = document.getElementById('f-date').value;
      document.getElementById('conf-line').textContent =
        'For ' + name + ' — class ' + cls + ' float' + (date ? ', parade date ' + date : '') +
        '. The workshop answers enquiries within five working days, in the order the parade calendar demands.';
      form.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
  }
})();
