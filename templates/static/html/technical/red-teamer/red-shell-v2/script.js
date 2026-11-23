/* Red Shell — shared script.
   Sound ruling: NONE. This practice is measured from logs and control
   sheets; nothing here teaches through audio, so the site is silent
   by design. No AudioContext is created anywhere in this file. */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts the first; Chrome reports the abort as an
     unhandled rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var gbp = function (n) { return '£' + n.toLocaleString('en-GB'); };
  var rate1 = function (d, a) { return a === 0 ? null : Math.round((d / a) * 1000) / 10; };
  var bandOf = function (r) {
    if (r === null) return { key: 'unobserved', label: 'No actions' };
    if (r >= 80) return { key: 'measured', label: 'Measured' };
    if (r >= 50) return { key: 'partial', label: 'Partial' };
    return { key: 'unobserved', label: 'Unobserved' };
  };

  /* ---------------- mobile control panel ---------------- */
  var menuBtn = $('#menuBtn'), panel = $('#menuPanel'), backdrop = $('#backdrop'), menuClose = $('#menuClose');
  if (menuBtn && panel) {
    var lastFocus = null;
    function openMenu() {
      lastFocus = document.activeElement;
      panel.classList.add('open');
      backdrop.classList.add('open');
      panel.removeAttribute('hidden');
      backdrop.removeAttribute('hidden');
      menuBtn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () {
        var first = panel.querySelector('nav a');
        if (first) first.focus();
      });
    }
    function closeMenu() {
      panel.classList.remove('open');
      backdrop.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () {
        if (!panel.classList.contains('open')) { panel.setAttribute('hidden', ''); backdrop.setAttribute('hidden', ''); }
      }, 320);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    menuBtn.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
    });
  }

  /* ---------------- detection scorecard (index) ---------------- */
  var scTable = $('#scRows');
  if (scTable) {
    var rows = $$('.sc-row[data-name]', scTable);
    function renderScorecard() {
      var tA = 0, tD = 0, weak = [];
      rows.forEach(function (row) {
        var att = parseInt(row.getAttribute('data-att'), 10);
        var det = parseInt(row.getAttribute('data-det'), 10);
        if (det > att) { det = att; row.setAttribute('data-det', String(det)); }
        tA += att; tD += det;
        $('[data-v="att"]', row).textContent = att;
        $('[data-v="det"]', row).textContent = det;
        var r = rate1(det, att), b = bandOf(r);
        $('[data-v="rate"]', row).textContent = r === null ? '—' : r.toFixed(1) + '%';
        $('[data-v="work"]', row).textContent = att === 0 ? 'no actions stepped' : det + ' ÷ ' + att + ' × 100';
        var bandEl = $('[data-v="band"]', row);
        bandEl.textContent = b.label;
        bandEl.className = 'sc-band ' + b.key;
        $$('.stepper button', row).forEach(function (btn) {
          var k = btn.getAttribute('data-k'), d = parseInt(btn.getAttribute('data-d'), 10);
          var cur = k === 'att' ? att : det, next = cur + d;
          btn.disabled = next < 0 || next > 20 || (k === 'det' && next > att);
        });
        if (r !== null && r < 50) weak.push(row.getAttribute('data-name').toLowerCase());
      });
      var attParts = rows.map(function (r) { return r.getAttribute('data-att'); }).join(' + ');
      var detParts = rows.map(function (r) { return r.getAttribute('data-det'); }).join(' + ');
      $('#scAttWork').innerHTML = 'Attempted, all classes:&nbsp; ' + attParts + ' = <b>' + tA + '</b>';
      $('#scDetWork').innerHTML = 'Detected, all classes:&nbsp;&nbsp; ' + detParts + ' = <b>' + tD + '</b>';
      var overall = rate1(tD, tA), ob = bandOf(overall);
      $('#scOverall').innerHTML = 'Overall detection rate:&nbsp; ' + tD + ' ÷ ' + tA + ' × 100 = <b>' + (overall === null ? '—' : overall.toFixed(1) + '%') + '</b>';
      var vWord = $('#scVerdictWord');
      vWord.textContent = ob.label;
      vWord.className = 'v-word ' + ob.key;
      $('#scVerdictText').textContent =
        ob.key === 'measured' ? 'The exercise was seen. The report’s job now is the classes still under 100% — measured is not the same as covered.' :
        ob.key === 'partial' ? 'Seen in places. The report names the gaps by class and prices the fixes in the client’s own backlog order.' :
        'The exercise ran largely unseen. That is a finding about detection, not a defeat for anyone — it is the reason the exercise exists.';
      $('#scWeak').textContent = weak.length
        ? 'Classes under 50% in this exercise shape: ' + weak.join(', ') + '.'
        : 'No class under 50% in this exercise shape.';
    }
    rows.forEach(function (row) {
      $$('.stepper button', row).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var k = btn.getAttribute('data-k'), d = parseInt(btn.getAttribute('data-d'), 10);
          var cur = parseInt(row.getAttribute('data-' + k), 10);
          var next = Math.max(0, Math.min(20, cur + d));
          row.setAttribute('data-' + k, String(next));
          if (k === 'att') {
            var det = parseInt(row.getAttribute('data-det'), 10);
            if (det > next) row.setAttribute('data-det', String(next));
          }
          renderScorecard();
        });
      });
    });
    renderScorecard();

    /* first-alert grading, from the printed response-time bands */
    var gradeOut = $('#alertGrade');
    $$('.alert-btns button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.alert-btns button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        gradeOut.innerHTML = 'Alert grade for this shape: <b>' + btn.getAttribute('data-grade') + '</b> — ' + btn.getAttribute('data-note');
      });
    });
  }

  /* ---------------- engagement estimator (index) ---------------- */
  var est = $('#estimator');
  if (est) {
    var feeTable = $('#feeTable');
    var rates = {
      weeks: parseInt(feeTable.getAttribute('data-rate-weeks'), 10),
      planning: parseInt(feeTable.getAttribute('data-rate-planning'), 10),
      purple: parseInt(feeTable.getAttribute('data-rate-purple'), 10),
      report: parseInt(feeTable.getAttribute('data-rate-report'), 10),
      retest: parseInt(feeTable.getAttribute('data-rate-retest'), 10)
    };
    var state = { weeks: 2, purple: 2, retest: 0, report: true };
    function renderEst() {
      $('#estWeeksVal').textContent = state.weeks;
      $('#estPurpleVal').textContent = state.purple;
      $('#estRetestVal').textContent = state.retest;
      $('#reportToggle').setAttribute('aria-pressed', state.report ? 'true' : 'false');
      $('#reportToggle').textContent = state.report ? 'Included' : 'Excluded';
      var lw = state.weeks * rates.weeks,
          lp = state.purple * rates.purple,
          lr = state.report ? rates.report : 0,
          lt = state.retest * rates.retest;
      $('#lineWeeks').innerHTML = 'Exercise weeks:&nbsp; ' + state.weeks + ' × ' + gbp(rates.weeks) + ' = <b>' + gbp(lw) + '</b>';
      $('#linePlanning').innerHTML = 'Planning &amp; threat profile (fixed): <b>' + gbp(rates.planning) + '</b>';
      $('#linePurple').innerHTML = 'Purple-team days:&nbsp; ' + state.purple + ' × ' + gbp(rates.purple) + ' = <b>' + gbp(lp) + '</b>';
      $('#lineReport').innerHTML = 'After-action report &amp; measurement pack: <b>' + gbp(lr) + '</b>' + (state.report ? '' : ' (excluded)');
      $('#lineRetest').innerHTML = 'Re-test days:&nbsp; ' + state.retest + ' × ' + gbp(rates.retest) + ' = <b>' + gbp(lt) + '</b>';
      $('#estTotal').textContent = gbp(lw + rates.planning + lp + lr + lt);
      $$('.est-step').forEach(function (btn) {
        var key = btn.getAttribute('data-for'), d = parseInt(btn.getAttribute('data-d'), 10);
        var min = parseInt(btn.getAttribute('data-min'), 10), max = parseInt(btn.getAttribute('data-max'), 10);
        var next = state[key] + d;
        btn.disabled = next < min || next > max;
      });
    }
    $$('.est-step').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-for'), d = parseInt(btn.getAttribute('data-d'), 10);
        var min = parseInt(btn.getAttribute('data-min'), 10), max = parseInt(btn.getAttribute('data-max'), 10);
        state[key] = Math.max(min, Math.min(max, state[key] + d));
        renderEst();
      });
    });
    $('#reportToggle').addEventListener('click', function () { state.report = !state.report; renderEst(); });
    renderEst();
  }

  /* ---------------- enquiry form (contact) ---------------- */
  var form = $('#enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = [
        { id: 'fName', test: function (v) { return v.trim().length >= 2; }, msg: 'Please give your name.' },
        { id: 'fOrg', test: function (v) { return v.trim().length >= 2; }, msg: 'Please give your organisation.' },
        { id: 'fEmail', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'Please give a work email we can reply to.' },
        { id: 'fMsg', test: function (v) { return v.trim().length >= 10; }, msg: 'A sentence or two is enough — no system details, please.' }
      ];
      var valid = true, firstBad = null;
      fields.forEach(function (f) {
        var input = document.getElementById(f.id);
        var err = document.getElementById(f.id + 'Err');
        var okF = f.test(input.value);
        input.setAttribute('aria-invalid', okF ? 'false' : 'true');
        if (err) { err.textContent = okF ? '' : f.msg; err.classList.toggle('on', !okF); }
        if (!okF) { valid = false; if (!firstBad) firstBad = input; }
      });
      if (!valid) { if (firstBad) firstBad.focus(); return; }
      var name = document.getElementById('fName').value.trim();
      var org = document.getElementById('fOrg').value.trim();
      var ref = 'RS-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = 'Enquiry reference: ' + ref;
      document.getElementById('confirmEcho').textContent = 'Thank you, ' + name + ' (' + org + '). In a live engagement this form would open a scoping call under NDA — nothing you typed has been transmitted or stored; this demonstration ends here, with the reference above for your notes.';
      form.setAttribute('hidden', '');
      var conf = document.getElementById('confirmPanel');
      conf.removeAttribute('hidden');
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
  }
})();
