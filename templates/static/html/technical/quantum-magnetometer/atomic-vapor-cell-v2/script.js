/* ============================================================
   BRANDT MAGNETOMETRY — site script
   Sound ruling: NONE. Magnetometry is read from traces and
   tables; nothing on this site teaches through audio, so no
   AudioContext is ever created. (Recorded in CREDITS.md.)
   ============================================================ */
(function () {
  'use strict';

  /* ---- view-transition abort guard (standard program pattern):
     Chrome surfaces an aborted cross-document transition as an
     unhandled rejection; the navigation itself always completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var fmt = function (n) { return Math.round(n).toLocaleString('en-GB'); };
  var fmtDec = function (n, dp) {
    var s = n.toFixed(dp);
    return s.replace(/\.?0+$/, '') || '0';
  };

  /* ================= mobile logbook panel ================= */
  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('logPanel');
  var scrim = document.getElementById('scrim');
  var closeBtn = document.getElementById('lpClose');
  function openPanel() {
    panel.classList.add('open');
    scrim.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    /* focus inside rAF, after the panel becomes visible —
       focusing while visibility:hidden is a silent no-op */
    requestAnimationFrame(function () {
      var first = panel.querySelector('.lp-links a');
      if (first) first.focus();
    });
  }
  function closePanel() {
    panel.classList.remove('open');
    scrim.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.focus();
  }
  if (menuBtn && panel) {
    menuBtn.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);
    scrim.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
  }

  /* ================= reveal on scroll (opacity only) ================= */
  var rvEls = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ================= Larmor converter =================
     Printed relation: f = (γ/2π) · B, γ/2π (⁸⁷Rb) = 7.0 Hz/nT.
     The constant is read from the printed relation panel so the
     tool and the page can never disagree. */
  var relPanel = document.getElementById('relationPanel');
  var converter = document.getElementById('converter');
  if (relPanel && converter) {
    var GAMMA = parseFloat(relPanel.getAttribute('data-gamma')); /* 7.0 */

    var state = {
      mode: 'fb',            /* 'fb': frequency → field · 'bf': field → frequency */
      freq: 350000,          /* Hz, step 7000 */
      field: 48000           /* nT, step 1000 */
    };
    var F_STEP = 7000, F_MIN = 0, F_MAX = 700000;
    var B_STEP = 1000, B_MIN = 0, B_MAX = 100000;

    var tabFb = document.getElementById('tabFb');
    var tabBf = document.getElementById('tabBf');
    var paneFb = document.getElementById('paneFb');
    var paneBf = document.getElementById('paneBf');
    var freqVal = document.getElementById('freqVal');
    var fieldValB = document.getElementById('fieldValB');
    var readoutFb = document.getElementById('readoutFb');
    var readoutBf = document.getElementById('readoutBf');
    var workingsFb = document.getElementById('workingsFb');
    var workingsBf = document.getElementById('workingsBf');
    var scaleRows = document.querySelectorAll('.scale-row');

    function bandFor(b) {
      for (var i = 0; i < scaleRows.length; i++) {
        var lo = parseFloat(scaleRows[i].getAttribute('data-min'));
        var hi = parseFloat(scaleRows[i].getAttribute('data-max'));
        if (b >= lo && b < hi) return scaleRows[i];
      }
      return scaleRows[scaleRows.length - 1];
    }
    function markBand(b) {
      var hit = bandFor(b);
      scaleRows.forEach(function (r) { r.classList.toggle('hit', r === hit); });
      return hit;
    }

    function renderFb() {
      var B = state.freq / GAMMA;
      freqVal.innerHTML = fmt(state.freq) + ' Hz<small>STEPPED INPUT · ±7,000 Hz</small>';
      readoutFb.innerHTML = fmt(B) + ' nT <span class="alt">= ' + fmtDec(B / 1000, 2) + ' µT</span>';
      workingsFb.innerHTML =
        '<span class="w-head">Workings — frequency → field</span><br>' +
        'B = f ÷ (γ/2π)<br>' +
        'B = ' + fmt(state.freq) + ' Hz ÷ ' + GAMMA.toFixed(1) + ' Hz/nT<br>' +
        'B = <b>' + fmt(B) + ' nT</b>';
      var hit = markBand(B);
      document.getElementById('verdictFb').innerHTML = '<strong>' + hit.getAttribute('data-name') + '.</strong> ' + hit.getAttribute('data-verdict');
    }
    function renderBf() {
      var f = state.field * GAMMA;
      fieldValB.innerHTML = fmt(state.field) + ' nT<small>STEPPED INPUT · ±1,000 nT</small>';
      readoutBf.innerHTML = fmt(f) + ' Hz <span class="alt">= ' + fmtDec(f / 1000, 1) + ' kHz</span>';
      workingsBf.innerHTML =
        '<span class="w-head">Workings — field → frequency</span><br>' +
        'f = (γ/2π) × B<br>' +
        'f = ' + GAMMA.toFixed(1) + ' Hz/nT × ' + fmt(state.field) + ' nT<br>' +
        'f = <b>' + fmt(f) + ' Hz</b>';
      var hit = markBand(state.field);
      document.getElementById('verdictBf').innerHTML = '<strong>' + hit.getAttribute('data-name') + '.</strong> ' + hit.getAttribute('data-verdict');
    }
    function setMode(mode) {
      state.mode = mode;
      tabFb.setAttribute('aria-selected', mode === 'fb' ? 'true' : 'false');
      tabBf.setAttribute('aria-selected', mode === 'bf' ? 'true' : 'false');
      paneFb.hidden = mode !== 'fb';
      paneBf.hidden = mode !== 'bf';
      if (mode === 'fb') renderFb(); else renderBf();
    }
    tabFb.addEventListener('click', function () { setMode('fb'); });
    tabBf.addEventListener('click', function () { setMode('bf'); });
    document.getElementById('freqMinus').addEventListener('click', function () {
      state.freq = Math.max(F_MIN, state.freq - F_STEP); renderFb();
    });
    document.getElementById('freqPlus').addEventListener('click', function () {
      state.freq = Math.min(F_MAX, state.freq + F_STEP); renderFb();
    });
    document.getElementById('fieldMinus').addEventListener('click', function () {
      state.field = Math.max(B_MIN, state.field - B_STEP); renderBf();
    });
    document.getElementById('fieldPlus').addEventListener('click', function () {
      state.field = Math.min(B_MAX, state.field + B_STEP); renderBf();
    });
    renderFb();
    renderBf();
    setMode('fb');
  }

  /* ================= estimator =================
     Rates are read from the printed rate table (data-rate on each
     row) so the estimator and the printed fees cannot disagree. */
  var est = document.getElementById('estimator');
  if (est) {
    var rows = est.querySelectorAll('.est-row[data-rate]');
    var totalEl = document.getElementById('estTotal');
    function renderEst() {
      var total = 0;
      rows.forEach(function (row) {
        var rate = parseFloat(row.getAttribute('data-rate'));
        var qtyEl = row.querySelector('.qty-num');
        var qty = qtyEl ? parseFloat(qtyEl.getAttribute('data-qty')) : 1;
        var line = rate * qty;
        total += line;
        row.querySelector('.est-line').textContent = '€' + fmt(line);
      });
      totalEl.textContent = '€' + fmt(total);
    }
    est.querySelectorAll('.step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.est-row');
        var qtyEl = row.querySelector('.qty-num');
        var qty = parseFloat(qtyEl.getAttribute('data-qty'));
        var min = parseFloat(qtyEl.getAttribute('data-min'));
        var max = parseFloat(qtyEl.getAttribute('data-max'));
        qty += parseFloat(btn.getAttribute('data-delta'));
        qty = Math.max(min, Math.min(max, qty));
        qtyEl.setAttribute('data-qty', qty);
        qtyEl.childNodes[0].nodeValue = qty;
        renderEst();
      });
    });
    renderEst();
  }

  /* ================= enquiry form ================= */
  var form = document.getElementById('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll('[data-required]').forEach(function (input) {
        var wrap = input.closest('.f-field');
        var ok = input.value.trim().length > 0;
        if (ok && input.type === 'email') {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        wrap.classList.toggle('invalid', !ok);
        input.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'BM-ENQ-' + (1000 + Math.floor(Math.random() * 9000));
      document.getElementById('confirmRef').textContent = ref;
      form.hidden = true;
      var conf = document.getElementById('formConfirm');
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
  }
})();
