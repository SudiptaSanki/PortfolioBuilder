/* ============================================================
   Kowalczyk CVD — run-log interactions.
   Sound ruling: NONE. Diamond growth is not a sound profession
   and nothing on this site teaches through audio; the stub's
   pulsing plasma canvas was decoration and has been removed.
   The site is silent by design.
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

  /* ---------- mobile sheet panel ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('sheetPanel');
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

  /* ---------- reveal (opacity only) ---------- */
  var revs = document.querySelectorAll('.rev');
  if (reduced || !('IntersectionObserver' in window)) {
    revs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    revs.forEach(function (el) { io.observe(el); });
  }

  /* ---------- money formatting ---------- */
  function eur(n) {
    return '€' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ==========================================================
     Heat-Spreader Calculator — R_th = L / (k · A)
     k values are read from the chips, which carry the same
     numbers as Table T1 printed beside the tool. One source,
     two renderings: they cannot disagree.
     ========================================================== */
  var calc = document.getElementById('calc');
  if (calc) {
    var COPPER_K = 398;
    var state = { k: 2100, name: 'Single-crystal CVD, electronic grade', thick: 0.5, area: 100 };
    var chips = calc.querySelectorAll('.chip');
    var thickVal = document.getElementById('thickVal');
    var areaVal = document.getElementById('areaVal');
    var rBig = document.getElementById('rBig');
    var rSub = document.getElementById('rSub');
    var work = document.getElementById('workLines');
    var matName = document.getElementById('matName');
    var rows = document.querySelectorAll('#matTable tbody tr[data-k]');

    function renderCalc() {
      var Lm = state.thick / 1000;          /* mm -> m   */
      var Am = state.area / 1000000;        /* mm² -> m² */
      var kA = state.k * Am;
      var R = Lm / kA;
      var Rcu = Lm / (COPPER_K * Am);
      var ratio = Rcu / R;
      thickVal.textContent = state.thick.toFixed(1) + ' mm';
      areaVal.textContent = state.area + ' mm²';
      matName.textContent = state.name;
      rBig.innerHTML = 'R<sub>th</sub> = <b>' + R.toFixed(5) + ' K/W</b>';
      rSub.textContent = '= ' + (R * 1000).toFixed(2) + ' mK/W through the plate — ' +
        ratio.toFixed(1) + '× less temperature drop than copper at the same geometry';
      work.innerHTML =
        'L = ' + state.thick.toFixed(2) + ' mm = <b>' + Lm.toFixed(6) + ' m</b><br>' +
        'A = ' + state.area + ' mm² = <b>' + Am.toFixed(6) + ' m²</b><br>' +
        'k · A = ' + state.k + ' × ' + Am.toFixed(6) + ' = <b>' + kA.toFixed(4) + '</b><br>' +
        'R_th = L / (k · A) = ' + Lm.toFixed(6) + ' / ' + kA.toFixed(4) + ' = <b>' + R.toFixed(5) + ' K/W</b><br>' +
        'Copper (k = 398), same L and A: R = <b>' + Rcu.toFixed(5) + ' K/W</b> → ratio ' + Rcu.toFixed(5) + ' / ' + R.toFixed(5) + ' = <b>' + ratio.toFixed(1) + '×</b>';
      rows.forEach(function (tr) {
        tr.setAttribute('data-active', tr.getAttribute('data-k') === String(state.k) ? 'true' : 'false');
      });
      chips.forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-k') === String(state.k) ? 'true' : 'false');
      });
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        state.k = parseFloat(c.getAttribute('data-k'));
        state.name = c.getAttribute('data-name');
        renderCalc();
      });
    });
    calc.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-step').split(':');
        var d = parseFloat(parts[1]);
        if (parts[0] === 'thick') {
          state.thick = Math.min(3.0, Math.max(0.1, Math.round((state.thick + d) * 10) / 10));
        } else if (parts[0] === 'area') {
          state.area = Math.min(2500, Math.max(25, state.area + d));
        }
        renderCalc();
      });
    });
    renderCalc();
  }

  /* ==========================================================
     Run estimator — printed rates only.
     Growth day €1,450 · Characterisation €620/batch ·
     Polish & lap €240/part · Report pack €450 fixed.
     ========================================================== */
  var est = document.getElementById('est');
  if (est) {
    var RATES = { growth: 1450, char: 620, polish: 240 };
    var LIMITS = { growth: [1, 20], char: [0, 10], polish: [0, 40] };
    var FIXED = 450;
    var qty = { growth: 4, char: 1, polish: 2 };

    function renderEst() {
      var total = FIXED;
      Object.keys(RATES).forEach(function (key) {
        var line = qty[key] * RATES[key];
        total += line;
        document.getElementById('q-' + key).textContent = qty[key];
        document.getElementById('lt-' + key).textContent =
          qty[key] + (key === 'growth' ? ' days' : key === 'char' ? ' batches' : ' parts') +
          ' × ' + eur(RATES[key]);
        document.getElementById('amt-' + key).textContent = eur(line);
      });
      document.getElementById('estTotal').textContent = eur(total);
    }
    est.querySelectorAll('[data-est]').forEach(function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-est').split(':');
        var key = parts[0], d = parseInt(parts[1], 10);
        qty[key] = Math.min(LIMITS[key][1], Math.max(LIMITS[key][0], qty[key] + d));
        renderEst();
      });
    });
    renderEst();
  }

  /* ==========================================================
     Enquiry form — demonstration only. Nothing is transmitted;
     the page says so, and the confirmation says so again.
     ========================================================== */
  var form = document.getElementById('enquiry');
  if (form) {
    var confirmBox = document.getElementById('confirm');
    var fields = {
      name: { el: document.getElementById('f-name'), err: document.getElementById('err-name'),
              test: function (v) { return v.trim().length >= 2; }, msg: 'Your name, as it should appear on the run sheet.' },
      email: { el: document.getElementById('f-email'), err: document.getElementById('err-email'),
               test: function (v) { return /^\S+@\S+\.\S+$/.test(v.trim()); }, msg: 'A working email — the reply and the data pack travel by it.' },
      interest: { el: document.getElementById('f-interest'), err: document.getElementById('err-interest'),
                  test: function (v) { return v !== ''; }, msg: 'Choose the closest line — it decides which sheet your enquiry lands on.' },
      message: { el: document.getElementById('f-message'), err: document.getElementById('err-message'),
                 test: function (v) { return v.trim().length >= 20; }, msg: 'Twenty characters at least: material, dimensions and the number you must hit.' }
    };
    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      f.el.addEventListener('input', function () {
        f.el.removeAttribute('aria-invalid');
        f.err.textContent = '';
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (key) {
        var f = fields[key];
        if (!f.test(f.el.value)) {
          f.el.setAttribute('aria-invalid', 'true');
          f.err.textContent = f.msg;
          if (!firstBad) firstBad = f.el;
        }
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'CVD-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmEcho').textContent =
        'Logged for ' + fields.name.el.value.trim() + ' — ' +
        fields.interest.el.options[fields.interest.el.selectedIndex].text + '.';
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus({ preventScroll: false });
    });
  }
})();
