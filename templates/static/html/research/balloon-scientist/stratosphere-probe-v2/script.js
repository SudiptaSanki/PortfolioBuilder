/* ============================================================
   Ellison Near-Space Flights — shared behaviour.
   No audio anywhere: this trade's sound need-test fails on
   purpose (a beep is not telemetry). Everything below is
   guarded so each page only runs what it contains.
   ============================================================ */
(function () {
  'use strict';

  /* --- Cross-document view transitions abort noisily in some
         browsers; the navigation itself always completes. Swallow
         only that specific rejection. --- */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Mobile log-index folio --- */
  var btn = document.querySelector('.logindex-btn');
  var folio = document.getElementById('folio');
  if (btn && folio) {
    var closeFolio = function () {
      folio.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = folio.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        /* Focus after the panel becomes visible — focusing while
           it is still visibility:hidden is a silent no-op. */
        requestAnimationFrame(function () {
          var first = folio.querySelector('a');
          if (first) first.focus({ preventScroll: true });
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && folio.classList.contains('open')) {
        closeFolio();
        btn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (folio.classList.contains('open') && !folio.contains(e.target) && !btn.contains(e.target)) {
        closeFolio();
      }
    });
  }

  /* --- Reveal on scroll (opacity-led; content is visible without JS) --- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  var fmt = function (n, dp) {
    return n.toLocaleString('en-GB', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  };
  var gbp = function (n) { return '£' + fmt(Math.round(n)); };

  /* ==========================================================
     SIGNATURE — Pressure → Altitude converter.
     Driven by the printed ISA table below, which is also the
     table printed on the page. Linear interpolation between
     the two bracketing printed levels, working shown.
     ========================================================== */
  var ISA = [
    [0, 1013.25], [1000, 898.7], [2000, 795.0], [3000, 701.1], [4000, 616.4],
    [5000, 540.2], [6000, 472.0], [7000, 410.6], [8000, 356.0], [9000, 307.4],
    [10000, 264.4], [11000, 226.3], [12000, 193.3], [14000, 141.7], [16000, 103.5],
    [18000, 75.7], [20000, 55.3], [25000, 25.5], [30000, 12.0], [35000, 5.8], [40000, 2.9]
  ];

  var pRange = document.getElementById('p-range');
  var pNum = document.getElementById('p-num');
  if (pRange && pNum) {
    var pOut = document.getElementById('p-alt');
    var pFt = document.getElementById('p-ft');
    var pArith = document.getElementById('p-arith');
    var pBracket = document.getElementById('p-bracket');
    var cells = document.querySelectorAll('#atmo-table [data-alt]');

    function convert(raw) {
      var p = parseFloat(raw);
      if (isNaN(p)) return;
      var clamped = Math.min(1013.25, Math.max(2.9, p));
      /* find bracket: ISA pressures descend as altitude rises */
      var lo = null, hi = null, exact = null;
      for (var i = 0; i < ISA.length; i++) {
        if (Math.abs(ISA[i][1] - clamped) < 0.001) { exact = ISA[i]; break; }
        if (ISA[i][1] > clamped) { lo = ISA[i]; }
        if (ISA[i][1] < clamped && !hi) { hi = ISA[i]; }
      }
      var alt, html;
      if (exact) {
        alt = exact[0];
        pBracket.textContent = 'On a printed level: ' + fmt(exact[0]) + ' m = ' + exact[1].toFixed(2).replace(/\.?0+$/, '') + ' hPa';
        html = 'Your pressure sits exactly on the printed level <span class="res">' +
          fmt(exact[0]) + ' m</span> — no interpolation needed.';
      } else if (lo && hi) {
        var frac = (lo[1] - clamped) / (lo[1] - hi[1]);
        alt = lo[0] + frac * (hi[0] - lo[0]);
        pBracket.textContent = 'Bracketed by ' + fmt(lo[0]) + ' m (' + lo[1].toFixed(1) + ' hPa) and ' +
          fmt(hi[0]) + ' m (' + hi[1].toFixed(1) + ' hPa)';
        html =
          'Drop from the lower level: <span class="res">' + lo[1].toFixed(1) + '</span> <span class="op">−</span> ' +
          '<span class="res">' + clamped.toFixed(1) + '</span> <span class="op">=</span> <span class="res">' +
          (lo[1] - clamped).toFixed(1) + ' hPa</span><br>' +
          'Drop across the whole bracket: <span class="res">' + lo[1].toFixed(1) + '</span> <span class="op">−</span> ' +
          '<span class="res">' + hi[1].toFixed(1) + '</span> <span class="op">=</span> <span class="res">' +
          (lo[1] - hi[1]).toFixed(1) + ' hPa</span><br>' +
          'Fraction down the bracket: ' + (lo[1] - clamped).toFixed(1) + ' <span class="op">÷</span> ' +
          (lo[1] - hi[1]).toFixed(1) + ' <span class="op">=</span> <span class="res">' + frac.toFixed(3) + '</span><br>' +
          'Altitude: ' + fmt(lo[0]) + ' <span class="op">+</span> ' + frac.toFixed(3) + ' <span class="op">×</span> ' +
          fmt(hi[0] - lo[0]) + ' m <span class="op">=</span> <span class="res">' + fmt(Math.round(alt)) + ' m</span>';
      }
      if (typeof alt === 'number') {
        pOut.innerHTML = fmt(Math.round(alt)) + ' <small>metres, standard atmosphere</small>';
        pFt.textContent = '≈ ' + fmt(Math.round(alt * 3.28084)) + ' ft — the figure we would write in the log before checking the day’s own sounding.';
      }
      pArith.innerHTML = html;
      /* highlight the bracketing levels in the printed table */
      cells.forEach(function (td) {
        var a = parseFloat(td.getAttribute('data-alt'));
        var on = exact ? (a === exact[0]) : (lo && hi && (a === lo[0] || a === hi[0]));
        td.classList.toggle('hl', !!on);
        if (td.nextElementSibling) td.nextElementSibling.classList.toggle('hl', !!on);
      });
      if (document.activeElement !== pNum) pNum.value = clamped.toFixed(1);
      if (document.activeElement !== pRange) pRange.value = clamped;
    }

    pRange.addEventListener('input', function () { convert(pRange.value); });
    pNum.addEventListener('input', function () { convert(pNum.value); });
    pNum.addEventListener('change', function () { convert(pNum.value); });
    document.querySelectorAll('[data-pstep]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = parseFloat(b.getAttribute('data-pstep'));
        var cur = parseFloat(pNum.value) || 0;
        convert(Math.min(1013.25, Math.max(2.9, cur + d)));
        pNum.value = Math.min(1013.25, Math.max(2.9, cur + d)).toFixed(1);
        pRange.value = Math.min(1013.25, Math.max(2.9, cur + d));
      });
    });
    convert(500);
  }

  /* ==========================================================
     Campaign estimator — every line printed, arithmetic shown.
     Rates match the fee card on the same page.
     ========================================================== */
  var est = document.getElementById('estimator');
  if (est) {
    var RATES = { ops: 2400, consum: 1150, recovery: 450, day: 650, report: 1800 };
    var launches = 3, days = 2;
    var lOut = document.getElementById('est-launches');
    var dOut = document.getElementById('est-days');
    var lines = document.getElementById('est-lines');
    var total = document.getElementById('est-total');

    function renderEst() {
      var perLaunch = RATES.ops + RATES.consum + RATES.recovery;
      var launchTotal = perLaunch * launches;
      var dayTotal = RATES.day * days;
      var sum = launchTotal + dayTotal + RATES.report;
      lOut.textContent = launches;
      dOut.textContent = days;
      lines.innerHTML =
        'Per launch: ' + gbp(RATES.ops) + ' ops <span class="op">+</span> ' + gbp(RATES.consum) +
        ' balloon, helium &amp; consumables <span class="op">+</span> ' + gbp(RATES.recovery) +
        ' recovery allowance <span class="op">=</span> <span class="res">' + gbp(perLaunch) + '</span><br>' +
        fmt(launches) + ' launch' + (launches === 1 ? '' : 'es') + ' <span class="op">×</span> ' + gbp(perLaunch) +
        ' <span class="op">=</span> <span class="res">' + gbp(launchTotal) + '</span><br>' +
        fmt(days) + ' extra field day' + (days === 1 ? '' : 's') + ' <span class="op">×</span> ' + gbp(RATES.day) +
        ' <span class="op">=</span> <span class="res">' + gbp(dayTotal) + '</span><br>' +
        'Analysis &amp; flight reports <span class="op">=</span> <span class="res">' + gbp(RATES.report) + '</span>';
      total.innerHTML = gbp(sum) + ' <small>planning figure, before site-specific quotes</small>';
    }
    est.querySelectorAll('[data-est]').forEach(function (b) {
      b.addEventListener('click', function () {
        var spec = b.getAttribute('data-est').split(':');
        var d = parseInt(spec[1], 10);
        if (spec[0] === 'launches') launches = Math.min(12, Math.max(1, launches + d));
        if (spec[0] === 'days') days = Math.min(10, Math.max(0, days + d));
        renderEst();
      });
    });
    renderEst();
  }

  /* ==========================================================
     Enquiry form — validation + in-page confirmation.
     Demonstration form: nothing is transmitted anywhere.
     ========================================================== */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var confirmBox = document.getElementById('form-confirm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field');
        var valid = input.value.trim().length > 0;
        if (valid && input.type === 'email') {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        if (field) field.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'ENQ-' + new Date().getFullYear() + '-' +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      document.getElementById('confirm-ref').textContent = ref;
      var name = document.getElementById('f-name').value.trim().split(' ')[0];
      document.getElementById('confirm-name').textContent = name ? ', ' + name : '';
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus({ preventScroll: false });
    });
    form.querySelectorAll('[required]').forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field) field.classList.remove('invalid');
      });
    });
  }
})();
