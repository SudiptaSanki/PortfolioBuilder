/* ============================================================
   VOGEL STRATOSPHERIC SYSTEMS — flight-level interactions.
   Sound ruling: NONE. Airship lift engineering is not a sound
   profession and nothing on this site teaches through audio.
   The site is silent by design; the ruling is printed in the
   footer and in CREDITS.md.
   ============================================================ */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts the first; Chrome surfaces that abort as
     an unhandled rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (n) { return n.toLocaleString('en-GB'); };

  /* ---------- mobile flight-level panel ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('flPanel');
  if (btn && panel) {
    var closePanel = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus({ preventScroll: true });
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closePanel();
    });
  }

  /* ---------- reveal (opacity only, JS-gated) ---------- */
  var revs = document.querySelectorAll('.rev');
  if (revs.length && !reduced && 'IntersectionObserver' in window) {
    revs.forEach(function (el) { el.classList.add('rev-pre'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.remove('rev-pre');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revs.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     LIFT CALCULATOR — every figure is read from Table 1 as
     printed in the DOM, so the tool and the table cannot
     disagree. Gross lift = (rho_air - rho_He) x V, with
     rho_He = rho_air x 0.138 (molar-mass ratio, printed).
     ========================================================== */
  var table = document.getElementById('atmoTable');
  if (table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    var data = rows.map(function (tr) {
      return { alt: parseFloat(tr.getAttribute('data-alt')), rho: parseFloat(tr.getAttribute('data-rho')) };
    });
    var heFrac = parseFloat(table.getAttribute('data-he')) || 0.138;
    var seaRho = data[0].rho;
    var deductRows = Array.prototype.slice.call(document.querySelectorAll('.deduct .d-row'));
    var fracs = deductRows.map(function (r) { return parseFloat(r.getAttribute('data-frac')); });

    var altIdx = 5; /* 20 km default */
    var vol = 100000, VOL_STEP = 5000, VOL_MIN = 5000, VOL_MAX = 250000;

    var altVal = document.getElementById('altVal');
    var volVal = document.getElementById('volVal');
    var wRho = document.getElementById('wRho');
    var wHe = document.getElementById('wHe');
    var wNet = document.getElementById('wNet');
    var wGross = document.getElementById('wGross');
    var usefulEl = document.getElementById('usefulLift');
    var seaLine = document.getElementById('seaLine');

    var flLabel = function (km) {
      if (km === 0) return 'surface';
      return 'FL' + (Math.round(km * 32.8084 / 10) * 10);
    };

    var render = function () {
      var d = data[altIdx];
      var rhoHe = d.rho * heFrac;
      var net = d.rho - rhoHe;
      var gross = Math.round(net * vol);
      var ded = fracs.map(function (f) { return Math.round(gross * f); });
      var dedSum = ded.reduce(function (a, b) { return a + b; }, 0);
      var useful = gross - dedSum;
      var seaGross = Math.round(seaRho * (1 - heFrac) * vol);
      var pct = seaGross ? (gross / seaGross * 100) : 0;

      altVal.textContent = d.alt + ' km · ' + flLabel(d.alt);
      volVal.textContent = fmt(vol) + ' m³';
      wRho.textContent = 'ρ air at ' + d.alt + ' km (Table 1) = ' + d.rho.toFixed(4) + ' kg/m³';
      wHe.textContent = 'ρ helium = ' + d.rho.toFixed(4) + ' × 0.138 = ' + rhoHe.toFixed(5) + ' kg/m³';
      wNet.textContent = 'net lift per m³ = ' + d.rho.toFixed(4) + ' − ' + rhoHe.toFixed(5) + ' = ' + net.toFixed(5) + ' kg/m³';
      wGross.innerHTML = 'gross lift = ' + net.toFixed(5) + ' × ' + fmt(vol) + ' m³ = <span class="w-hi">' + fmt(gross) + ' kg</span>';
      deductRows.forEach(function (r, i) {
        r.querySelector('.d-val').textContent = '− ' + fmt(ded[i]) + ' kg';
      });
      usefulEl.textContent = fmt(useful) + ' kg';
      seaLine.innerHTML = 'The same ' + fmt(vol) + ' m³ at sea level would gross <strong>' +
        fmt(seaGross) + ' kg</strong>. At ' + d.alt + ' km you keep <strong>' + pct.toFixed(1) +
        '%</strong> of it. That difference is the whole design problem.';
      rows.forEach(function (tr, i) { tr.classList.toggle('sel', i === altIdx); });
    };

    document.getElementById('altMinus').addEventListener('click', function () {
      if (altIdx > 0) { altIdx--; render(); }
    });
    document.getElementById('altPlus').addEventListener('click', function () {
      if (altIdx < data.length - 1) { altIdx++; render(); }
    });
    document.getElementById('volMinus').addEventListener('click', function () {
      vol = Math.max(VOL_MIN, vol - VOL_STEP); render();
    });
    document.getElementById('volPlus').addEventListener('click', function () {
      vol = Math.min(VOL_MAX, vol + VOL_STEP); render();
    });
    rows.forEach(function (tr, i) {
      tr.addEventListener('click', function () { altIdx = i; render(); });
    });
    render();
  }

  /* ==========================================================
     STUDY ESTIMATOR — rates parsed from the printed rows.
     ========================================================== */
  var est = document.getElementById('estimator');
  if (est) {
    var estRows = Array.prototype.slice.call(est.querySelectorAll('[data-rate]'));
    var counts = estRows.map(function (r) { return parseInt(r.getAttribute('data-count'), 10) || 0; });
    var estLines = document.getElementById('estLines');
    var estTotal = document.getElementById('estTotal');
    var renderEst = function () {
      var total = 0, lines = [];
      estRows.forEach(function (r, i) {
        var rate = parseInt(r.getAttribute('data-rate'), 10);
        var unit = r.getAttribute('data-unit');
        var name = r.getAttribute('data-name');
        var sub = counts[i] * rate;
        total += sub;
        lines.push(counts[i] + ' ' + unit + ' × €' + fmt(rate) + ' (' + name + ') = €' + fmt(sub));
        r.querySelector('.s-val').textContent = counts[i] + ' ' + unit;
      });
      estLines.innerHTML = lines.join('<br>');
      estTotal.textContent = '€' + fmt(total);
    };
    estRows.forEach(function (r, i) {
      var min = parseInt(r.getAttribute('data-min'), 10) || 0;
      var max = parseInt(r.getAttribute('data-max'), 10) || 99;
      r.querySelector('[data-dir="-1"]').addEventListener('click', function () {
        counts[i] = Math.max(min, counts[i] - 1); renderEst();
      });
      r.querySelector('[data-dir="1"]').addEventListener('click', function () {
        counts[i] = Math.min(max, counts[i] + 1); renderEst();
      });
    });
    renderEst();
  }

  /* ==========================================================
     ENQUIRY FORM — demonstration only; nothing is transmitted.
     ========================================================== */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var refEl = document.getElementById('confirmRef');
    var check = function (row) {
      var input = row.querySelector('input, select, textarea');
      var v = (input.value || '').trim();
      var ok = true;
      if (input.id === 'fName') ok = v.length >= 2;
      else if (input.id === 'fEmail') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      else if (input.id === 'fType') ok = v.length > 0;
      else if (input.id === 'fMsg') ok = v.length >= 10;
      row.classList.toggle('invalid', !ok);
      return ok;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var rowsF = Array.prototype.slice.call(form.querySelectorAll('.f-row[data-req]'));
      var results = rowsF.map(check);
      if (results.indexOf(false) !== -1) {
        var firstBad = form.querySelector('.f-row.invalid input, .f-row.invalid select, .f-row.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'VS-ENQ-' + Math.floor(1000 + Math.random() * 9000);
      if (refEl) refEl.textContent = ref;
      form.hidden = true;
      confirmBox.hidden = false;
      var h = confirmBox.querySelector('h3');
      if (h) h.focus({ preventScroll: false });
    });
    form.querySelectorAll('.f-row[data-req] input, .f-row[data-req] select, .f-row[data-req] textarea')
      .forEach(function (input) {
        input.addEventListener('input', function () {
          input.closest('.f-row').classList.remove('invalid');
        });
      });
  }
})();
