/* ============================================================
   OSEI SYNTHESIS REVIEW — shared script
   Sound ruling: NONE. Screening records and yield arithmetic are
   read, not heard; no interaction here teaches through audio.
   The stub's sequencing beep synth was removed, not rebuilt.
   No AudioContext is created anywhere in this file.
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces an unhandled InvalidStateError rejection;
     the navigation itself completes. Swallow only that rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var fmtEUR = function (n) { return '€' + n.toLocaleString('en-GB'); };

  /* ---------- mobile docket panel ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var panel = document.getElementById('docketPanel');
  if (menuBtn && panel) {
    var closePanel = function () {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    menuBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        /* focus only after the panel is visible — focusing inside a
           still-hidden panel is a silent no-op */
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closePanel();
        menuBtn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        closePanel();
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Item 01: Yield Calculator ---------- */
  var gradeTable = document.getElementById('gradeTable');
  if (gradeTable) {
    var cvals = [];
    gradeTable.querySelectorAll('tbody tr').forEach(function (tr) {
      var cell = tr.querySelector('.cval');
      cvals.push(parseFloat(cell.textContent));
    });
    var rows = gradeTable.querySelectorAll('tbody tr');
    var state = { grade: 0, n: 60 };
    var fracEl = document.getElementById('yieldFrac');
    var workEl = document.getElementById('yieldWork');
    var verdictEl = document.getElementById('yieldVerdict');
    var lenVal = document.getElementById('lenVal');
    var chips = document.querySelectorAll('#gradeChips .chip');
    var lenChips = document.querySelectorAll('#lenChips .chip');

    function bandFor(f) {
      if (f >= 0.60) return { cls: '', tag: 'Light burden', text: 'At this fraction, standard purification usually suffices — cost it as a step, not a project.' };
      if (f >= 0.35) return { cls: 'mid', tag: 'Standard burden', text: 'Plan chromatographic purification and cost it in. This is the range where most honest orders live.' };
      return { cls: 'heavy', tag: 'Heavy burden', text: 'Below this fraction, purification becomes the project. Redesign shorter or step up a grade before you order — on paper, where changes are free.' };
    }
    function renderYield() {
      var c = cvals[state.grade];
      var f = Math.pow(c, state.n - 1);
      var pct = (f * 100).toFixed(1);
      fracEl.textContent = pct + '%';
      lenVal.textContent = state.n;
      workEl.innerHTML =
        'full-length fraction ≈ c<sup>(n−1)</sup><br>' +
        '= <b>' + c.toFixed(3) + '<sup>' + state.n + ' − 1</sup></b> = ' + c.toFixed(3) + '<sup>' + (state.n - 1) + '</sup><br>' +
        '= <b>' + f.toFixed(3) + '</b> → <b>' + pct + '%</b> of crude product is full-length<br>' +
        '≈ ' + Math.round(f * 100) + ' of every 100 molecules started finish full-length';
      var b = bandFor(f);
      verdictEl.className = 'verdict ' + b.cls;
      verdictEl.innerHTML = '<b>' + b.tag + '</b>' + b.text;
      chips.forEach(function (ch) {
        ch.setAttribute('aria-pressed', parseInt(ch.dataset.grade, 10) === state.grade ? 'true' : 'false');
      });
      rows.forEach(function (tr, i) { tr.classList.toggle('sel', i === state.grade); });
      lenChips.forEach(function (ch) {
        ch.setAttribute('aria-pressed', parseInt(ch.dataset.len, 10) === state.n ? 'true' : 'false');
      });
    }
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        state.grade = parseInt(ch.dataset.grade, 10);
        renderYield();
      });
    });
    lenChips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        state.n = parseInt(ch.dataset.len, 10);
        renderYield();
      });
    });
    document.getElementById('lenUp').addEventListener('click', function () {
      state.n = Math.min(150, state.n + 5); renderYield();
    });
    document.getElementById('lenDown').addEventListener('click', function () {
      state.n = Math.max(20, state.n - 5); renderYield();
    });
    renderYield();
  }

  /* ---------- Item 04: Estimator ---------- */
  var feeTable = document.getElementById('feeTable');
  if (feeTable) {
    var rates = {};
    feeTable.querySelectorAll('.rate').forEach(function (td) {
      rates[td.dataset.line] = parseInt(td.textContent.replace(/[^0-9]/g, ''), 10);
    });
    var qty = { screen: 6, review: 3, qc: 1 };
    var estTotal = document.getElementById('estTotal');
    var estWork = document.getElementById('estWork');
    function renderEst() {
      var s = qty.screen * rates.screen;
      var r = qty.review * rates.review;
      var q = qty.qc * rates.qc;
      var total = s + r + q + rates.report;
      estTotal.textContent = fmtEUR(total);
      estWork.innerHTML =
        'screening&nbsp;&nbsp;' + qty.screen + ' × ' + fmtEUR(rates.screen) + ' = <b>' + fmtEUR(s) + '</b><br>' +
        'design review&nbsp;&nbsp;' + qty.review + ' × ' + fmtEUR(rates.review) + ' = <b>' + fmtEUR(r) + '</b><br>' +
        'yield &amp; QC&nbsp;&nbsp;' + qty.qc + ' × ' + fmtEUR(rates.qc) + ' = <b>' + fmtEUR(q) + '</b><br>' +
        'report (fixed)&nbsp;&nbsp;= <b>' + fmtEUR(rates.report) + '</b><br>' +
        'total = <b>' + fmtEUR(total) + '</b> (excl. VAT)';
      document.querySelectorAll('[data-est-val]').forEach(function (el) {
        el.textContent = qty[el.dataset.estVal];
      });
    }
    document.querySelectorAll('[data-est]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var line = btn.dataset.est;
        var dir = parseInt(btn.dataset.dir, 10);
        qty[line] = Math.max(0, Math.min(40, qty[line] + dir));
        renderEst();
      });
    });
    renderEst();
  }

  /* ---------- Contact form (demonstration) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var fields = {
      name: { el: document.getElementById('fName'), ok: function (v) { return v.trim().length > 1; } },
      org: { el: document.getElementById('fOrg'), ok: function (v) { return v.trim().length > 2; } },
      email: { el: document.getElementById('fEmail'), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      type: { el: document.getElementById('fType'), ok: function (v) { return v !== ''; } },
      msg: { el: document.getElementById('fMsg'), ok: function (v) { return v.trim().length > 3; } }
    };
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener('input', function () {
        fields[k].el.closest('.field').classList.remove('invalid');
      });
      fields[k].el.addEventListener('change', function () {
        fields[k].el.closest('.field').classList.remove('invalid');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var valid = f.ok(f.el.value);
        f.el.closest('.field').classList.toggle('invalid', !valid);
        if (!valid && !firstBad) firstBad = f.el;
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'OSR-ENQ-' + Math.floor(1000 + Math.random() * 9000);
      confirmRef.textContent = ref;
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    var again = document.getElementById('againBtn');
    if (again) {
      again.addEventListener('click', function () {
        confirmBox.hidden = true;
        form.hidden = false;
        form.reset();
      });
    }
  }
})();
