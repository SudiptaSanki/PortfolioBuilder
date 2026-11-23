/* Itihasa Pixel — the Illuminated Folio.
   Sound ruling: NONE. A folio is read in silence; this site makes no sound.
   The planner and estimator read their hours and rates from the tables
   printed on the page itself, so the tool and the page cannot disagree. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces as an unhandled InvalidStateError rejection.
     Swallow only that exact rejection; every other error still shows. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu: the Leaves panel ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var menuPanel = document.getElementById('menu-panel');
  if (menuBtn && menuPanel) {
    var closeMenu = function () {
      menuPanel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    menuBtn.addEventListener('click', function () {
      var open = menuPanel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = menuPanel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuPanel.classList.contains('open')) {
        closeMenu();
        menuBtn.focus();
      }
    });
    menuPanel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  /* ---------- shared stepper wiring ---------- */
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function wireSteppers(root, onChange) {
    if (!root) return;
    root.querySelectorAll('.stepper').forEach(function (st) {
      var input = st.querySelector('input');
      st.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var dir = btn.getAttribute('data-dir') === 'down' ? -1 : 1;
          var max = parseInt(input.getAttribute('max'), 10) || 99;
          input.value = clamp((parseInt(input.value, 10) || 0) + dir, 0, max);
          onChange();
        });
      });
      input.addEventListener('change', function () {
        var max = parseInt(input.getAttribute('max'), 10) || 99;
        input.value = clamp(parseInt(input.value, 10) || 0, 0, max);
        onChange();
      });
    });
  }
  function readCounts(root) {
    var counts = {};
    root.querySelectorAll('input[data-key]').forEach(function (inp) {
      counts[inp.getAttribute('data-key')] = parseInt(inp.value, 10) || 0;
    });
    return counts;
  }
  function readTable(tableId) {
    var map = {};
    var table = document.getElementById(tableId);
    if (!table) return map;
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      var key = tr.getAttribute('data-key');
      if (!key) return;
      map[key] = {
        label: tr.getAttribute('data-label') || key,
        hours: parseFloat(tr.getAttribute('data-hours') || '0'),
        rate: parseFloat(tr.getAttribute('data-rate') || '0')
      };
    });
    return map;
  }
  function fmtWeeks(x) { return (Math.round(x * 10) / 10).toString(); }
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }

  /* ---------- Asset Production Planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var rates = readTable('rate-table');
    var list = document.getElementById('p-workings');
    var verdict = document.getElementById('p-verdict');
    var deadlineInput = document.getElementById('p-deadline');
    var WEEK_HOURS = 32; /* printed on the page: one working week */

    function runPlanner() {
      var counts = readCounts(planner);
      var total = 0;
      var html = '';
      Object.keys(rates).forEach(function (key) {
        var c = counts[key] || 0;
        var line = c * rates[key].hours;
        total += line;
        html += '<li><span>' + rates[key].label + ' — ' + c + ' × ' + rates[key].hours + ' h</span><span>' + line + ' h</span></li>';
      });
      var weeksExact = total / WEEK_HOURS;
      var weeksCeil = Math.ceil(weeksExact);
      var deadline = clamp(parseInt(deadlineInput.value, 10) || 14, 1, 60);
      html += '<li><span>Total production time</span><span>' + total + ' h</span></li>';
      html += '<li><span>Calendar time at ' + WEEK_HOURS + ' production hours a week</span><span>' + fmtWeeks(weeksExact) + ' weeks</span></li>';
      html += '<li class="w-total"><span>Working weeks to allow</span><span>' + weeksCeil + ' weeks</span></li>';
      list.innerHTML = html;
      if (total === 0) {
        verdict.className = 'verdict';
        verdict.innerHTML = '<strong>Nothing counted yet.</strong> Add at least one asset above and the folio will do the arithmetic.';
      } else if (weeksCeil <= deadline) {
        verdict.className = 'verdict';
        verdict.innerHTML = '<strong>Fits the window.</strong> This scope lands in week ' + weeksCeil +
          ' of the ' + deadline + '-week ship window — ' + (deadline - weeksCeil) +
          ' week' + (deadline - weeksCeil === 1 ? '' : 's') + ' of slack for the review gates to do their work.';
      } else {
        var over = weeksCeil - deadline;
        var twoArtist = Math.ceil(total / 2 / WEEK_HOURS);
        verdict.className = 'verdict over';
        verdict.innerHTML = '<strong>This scope lands after the stated date</strong> — over by ' + over +
          ' week' + (over === 1 ? '' : 's') + '. Per the printed rule: cut assets, or add a second artist — ' +
          'with two artists the same scope takes ' + twoArtist + ' working weeks' +
          (twoArtist <= deadline ? ', which fits.' : ', which still does not fit; the scope itself must shrink.') +
          ' The date does not move to meet the drawing.';
      }
    }
    wireSteppers(planner, runPlanner);
    deadlineInput.addEventListener('change', function () {
      deadlineInput.value = clamp(parseInt(deadlineInput.value, 10) || 14, 1, 60);
      runPlanner();
    });
    runPlanner();
  }

  /* ---------- Booking Estimator ---------- */
  var estimator = document.getElementById('estimator');
  if (estimator) {
    var fees = readTable('fee-table');
    var eList = document.getElementById('e-workings');
    var eTotal = document.getElementById('e-total');
    function runEstimator() {
      var counts = readCounts(estimator);
      var total = 0;
      var html = '';
      Object.keys(fees).forEach(function (key) {
        var c = counts[key] || 0;
        var line = c * fees[key].rate;
        total += line;
        html += '<li><span>' + fees[key].label + ' — ' + c + ' × ' + inr(fees[key].rate) + '</span><span>' + inr(line) + '</span></li>';
      });
      eList.innerHTML = html;
      eTotal.innerHTML = '<span>Total at the printed rates</span><span>' + inr(total) + '</span>';
    }
    wireSteppers(estimator, runEstimator);
    runEstimator();
  }

  /* ---------- Contact form (demonstration) ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    function setErr(input, errEl, bad) {
      if (errEl) errEl.classList.toggle('show', bad);
      if (input) input.classList.toggle('invalid', bad);
      return !bad;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var type = document.getElementById('f-type');
      var msg = document.getElementById('f-message');
      var ok = true;
      ok = setErr(name, document.getElementById('e-name'), name.value.trim().length < 2) && ok;
      ok = setErr(email, document.getElementById('e-email'), !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = setErr(type, document.getElementById('e-type'), !type.value) && ok;
      ok = setErr(msg, document.getElementById('e-message'), msg.value.trim().length < 10) && ok;
      if (!ok) {
        var firstBad = form.querySelector('.invalid');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'FOLIO-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('c-ref').textContent = ref;
      document.getElementById('c-summary').textContent =
        'For ' + name.value.trim() + ' — ' + type.options[type.selectedIndex].text +
        '. In a live studio this folio would now travel to the artist\u2019s desk; here, nothing has been sent or stored.';
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.setAttribute('tabindex', '-1');
      confirmation.focus();
    });
    ['f-name', 'f-email', 'f-type', 'f-message'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { el.classList.remove('invalid'); });
    });
  }
})();
