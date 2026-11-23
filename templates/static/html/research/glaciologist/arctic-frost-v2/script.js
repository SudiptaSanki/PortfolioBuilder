/* arctic-frost — Strand Glacier Programmes
   Sound ruling: FAILS the need-test — no audio anywhere. Glaciology is not a
   sound profession and nothing here teaches through audio. The stub's
   promised "howling polar wind" synth was decoration and was deleted, not
   rebuilt; the falling-snow canvas went with it. The site's one instrument
   is the Balance Explorer: arithmetic, asserted against the printed table. */
(function () {
  'use strict';

  /* View-transition abort guard: when the browser aborts a cross-document
     view transition, the abort surfaces as an unhandled rejection. Swallow
     only that exact case; every other rejection still reports. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile field-index panel ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('fieldIndex');
  if (btn && panel) {
    var firstLink = panel.querySelector('nav a');
    function openPanel() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      });
    }
    function closePanel(returnFocus) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closePanel(false); else openPanel();
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closePanel(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
    });
  }

  /* ---------- reveals (opacity only) ---------- */
  var rv = document.querySelectorAll('.rv');
  if (rv.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      rv.forEach(function (el) { io.observe(el); });
    } else {
      rv.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---------- helpers ---------- */
  function s2(v) { if (Math.abs(v) < 0.005) return '0.00'; return (v > 0 ? '+' : '-') + Math.abs(v).toFixed(2); }
  function s3(v) { if (Math.abs(v) < 0.0005) return '0.000'; return (v > 0 ? '+' : '-') + Math.abs(v).toFixed(3); }
  function money(n) { return '£' + n.toLocaleString('en-GB'); }

  /* ---------- Balance Explorer ---------- */
  var explorer = document.getElementById('explorer');
  if (explorer) {
    var BANDS = [
      { id: 'A', lo: 1400, hi: 1700, area: 1.55, share: 0.18, min: -3.50, max: 0.40, val: -2.40 },
      { id: 'B', lo: 1700, hi: 2000, area: 2.92, share: 0.34, min: -2.60, max: 0.90, val: -0.90 },
      { id: 'C', lo: 2000, hi: 2300, area: 2.67, share: 0.31, min: -1.40, max: 1.60, val: 0.35 },
      { id: 'D', lo: 2300, hi: 2650, area: 1.46, share: 0.17, min: -0.80, max: 2.20, val: 0.95 }
    ];
    var GLACIER_AREA = 8.6; /* km2, printed in Table 1 */
    var STEP = 0.05;

    function renderExplorer() {
      var total = 0;
      BANDS.forEach(function (b) {
        var valEl = document.getElementById('val-' + b.id);
        if (valEl) valEl.firstChild.nodeValue = s2(b.val);
        var row = document.querySelector('.band-row[data-band="' + b.id + '"]');
        if (row) {
          row.querySelector('[data-step="-1"]').disabled = b.val <= b.min + 1e-9;
          row.querySelector('[data-step="1"]').disabled = b.val >= b.max - 1e-9;
        }
        var contrib = b.val * b.share;
        total += contrib;
        var led = document.getElementById('led-' + b.id);
        if (led) led.textContent = s3(contrib);
        var lab = document.getElementById('ledlab-' + b.id);
        if (lab) lab.textContent = 'Band ' + b.id + ' \u00B7 ' + s2(b.val) + ' \u00D7 ' + b.share.toFixed(2);
      });
      var sumEl = document.getElementById('led-total');
      if (sumEl) sumEl.textContent = s2(total) + ' m w.e.';
      var roB = document.getElementById('ro-balance');
      if (roB) {
        roB.textContent = s2(total) + ' m w.e.';
        roB.className = 'v ' + (total < -0.005 ? 'neg' : (total > 0.005 ? 'pos' : ''));
      }
      var vol = total * GLACIER_AREA;
      var roV = document.getElementById('ro-volume');
      if (roV) roV.textContent = (vol < 0 ? '-' : '+') + Math.abs(vol).toFixed(1) + ' M m\u00B3';
      /* equilibrium line */
      var elaV = document.getElementById('ro-ela');
      var elaD = document.getElementById('ro-ela-d');
      var zeroBand = null, firstPos = -1;
      BANDS.forEach(function (b, i) {
        if (Math.abs(b.val) <= 0.0001 && !zeroBand) zeroBand = b;
        if (b.val > 0.0001 && firstPos < 0) firstPos = i;
      });
      var elaTitle, elaText;
      if (zeroBand) {
        elaTitle = 'At Band ' + zeroBand.id;
        elaText = 'Band ' + zeroBand.id + ' balances exactly zero — the line runs through the band itself (' +
          zeroBand.lo.toLocaleString('en-GB') + '\u2013' + zeroBand.hi.toLocaleString('en-GB') + ' m).';
      } else if (firstPos < 0) {
        elaTitle = 'No line this year';
        elaText = 'Every band lost mass — the equilibrium line sits above the glacier\u2019s top (2,650 m). ' +
          'It happens in the worst years, and it is a result, not an error.';
      } else if (firstPos === 0) {
        elaTitle = 'Below the terminus';
        elaText = 'Every band gained — the equilibrium line sits below 1,400 m. A rare, cold, snowy year.';
      } else {
        var hi = BANDS[firstPos], lo2 = BANDS[firstPos - 1];
        elaTitle = '\u2248 ' + hi.lo.toLocaleString('en-GB') + ' m';
        elaText = 'Between Band ' + lo2.id + ' and Band ' + hi.id + ', at their shared boundary. ' +
          'Interpolated between measured bands — a reading aid, not a surveyed line.';
      }
      if (elaV) elaV.textContent = elaTitle;
      if (elaD) elaD.textContent = elaText;
    }
    explorer.querySelectorAll('.band-row').forEach(function (row) {
      var id = row.getAttribute('data-band');
      var band = BANDS.filter(function (b) { return b.id === id; })[0];
      row.querySelectorAll('[data-step]').forEach(function (bEl) {
        bEl.addEventListener('click', function () {
          var d = parseInt(bEl.getAttribute('data-step'), 10) * STEP;
          band.val = Math.round((band.val + d) * 100) / 100;
          if (band.val < band.min) band.val = band.min;
          if (band.val > band.max) band.val = band.max;
          renderExplorer();
        });
      });
    });
    renderExplorer();
  }

  /* ---------- Programme estimator ---------- */
  var estimator = document.getElementById('estimator');
  if (estimator) {
    var VISIT_COST = 1850, REPORT_COST = 1200; /* both printed on the page */
    var est = { g: 3, v: 2 };
    function renderEst() {
      document.getElementById('est-g-val').firstChild.nodeValue = String(est.g);
      document.getElementById('est-v-val').firstChild.nodeValue = String(est.v);
      document.querySelector('[data-est="g"][data-step="-1"]').disabled = est.g <= 1;
      document.querySelector('[data-est="g"][data-step="1"]').disabled = est.g >= 12;
      document.querySelector('[data-est="v"][data-step="-1"]').disabled = est.v <= 2;
      document.querySelector('[data-est="v"][data-step="1"]').disabled = est.v >= 4;
      var field = est.g * est.v * VISIT_COST;
      var rep = est.g * REPORT_COST;
      document.getElementById('est-line-1').textContent =
        est.g + ' glaciers \u00D7 ' + est.v + ' visits \u00D7 ' + money(VISIT_COST);
      document.getElementById('est-line-1-v').textContent = money(field);
      document.getElementById('est-line-2').textContent =
        'Reporting: ' + est.g + ' \u00D7 ' + money(REPORT_COST);
      document.getElementById('est-line-2-v').textContent = money(rep);
      document.getElementById('est-total-v').textContent = money(field + rep);
    }
    estimator.querySelectorAll('[data-est]').forEach(function (bEl) {
      bEl.addEventListener('click', function () {
        var key = bEl.getAttribute('data-est');
        var d = parseInt(bEl.getAttribute('data-step'), 10);
        est[key] += d;
        if (key === 'g') { est.g = Math.max(1, Math.min(12, est.g)); }
        if (key === 'v') { est.v = Math.max(2, Math.min(4, est.v)); }
        renderEst();
      });
    });
    renderEst();
  }

  /* ---------- enquiry form ---------- */
  var form = document.querySelector('form.enquiry');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = form.querySelector('#f-type');
    if (typeSel && params.get('type')) {
      var wanted = params.get('type');
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    var confirm = document.getElementById('confirm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = [
        { el: form.querySelector('#f-name'), ok: function (v) { return v.trim().length > 1; } },
        { el: form.querySelector('#f-email'), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
        { el: form.querySelector('#f-msg'), ok: function (v) { return v.trim().length > 3; } }
      ];
      var firstBad = null;
      fields.forEach(function (f) {
        var good = f.ok(f.el.value);
        f.el.setAttribute('aria-invalid', good ? 'false' : 'true');
        var err = form.querySelector('.err[data-for="' + f.el.id + '"]');
        if (err) err.classList.toggle('show', !good);
        if (!good && !firstBad) firstBad = f.el;
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'ES-2026-' + Math.floor(100 + Math.random() * 900);
      document.getElementById('confirm-ref').textContent = ref;
      confirm.classList.add('show');
      confirm.setAttribute('tabindex', '-1');
      confirm.focus();
    });
    var again = document.getElementById('send-another');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        confirm.classList.remove('show');
        form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.setAttribute('aria-invalid', 'false'); });
        form.querySelectorAll('.err').forEach(function (el) { el.classList.remove('show'); });
        form.querySelector('#f-name').focus();
      });
    }
  }
})();
