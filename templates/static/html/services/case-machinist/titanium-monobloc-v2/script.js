/* ============================================================
   FELDMANN CASE WORKS — titanium-monobloc (fictional)
   Sound ruling: NONE. This script contains no audio code and
   never creates an AudioContext — a machine shop is loud
   enough in person, and the ruling is printed in the footer
   of every page.
   The planner and estimator parse their figures from the
   printed tables in the DOM (O1, F1, M1, Q1, P1, T1, E1),
   so tool and page cannot disagree.
   Scroll effect: none, by assignment. Stillness is the spec.
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
      toggle.setAttribute('aria-expanded', 'false');
      if (refocus) toggle.focus();
    };
    toggle.addEventListener('click', function () {
      if (panel.hidden) {
        panel.hidden = false;
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

  /* ---------- formatting (Swiss grouping, printed arithmetic) ---------- */
  function fmt(n, d) {
    var s = n.toFixed(d === undefined ? 2 : d);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return parts.join('.');
  }
  function money(n) { return 'CHF ' + fmt(n, 2); }
  function hours(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
  }
  function tolStr(v) { return '±' + v.toFixed(3) + ' mm'; }
  function round2(n) { return Math.round(n * 100) / 100; }

  /* ---------- segmented control helper ---------- */
  function seg(id, onChange) {
    var el = document.getElementById(id);
    if (!el) return null;
    var state = { value: null };
    el.querySelectorAll('button').forEach(function (b) {
      if (b.getAttribute('aria-pressed') === 'true') state.value = b.dataset.val;
      b.addEventListener('click', function () {
        el.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        state.value = b.dataset.val;
        onChange();
      });
    });
    return state;
  }

  /* ---------- parse the printed tables ---------- */
  function tableRows(id) {
    var t = document.getElementById(id);
    return t ? Array.prototype.slice.call(t.querySelectorAll('tbody tr')) : [];
  }
  var OPS = {}, FIN = {}, MASS = {}, FLOOR = {}, SCRAP = {}, SETUP = {}, PROTO = {}, EXTRA = {};
  var RATE = 0, METAL = 0;
  tableRows('opTable').forEach(function (tr) {
    var mill = +tr.dataset.mill, turn = +tr.dataset.turn, drill = +tr.dataset.drill;
    OPS[tr.dataset.class] = { mill: mill, turn: turn, drill: drill, sub: mill + turn + drill };
  });
  tableRows('finishTable').forEach(function (tr) { FIN[tr.dataset.finish] = +tr.dataset.min; });
  tableRows('massTable').forEach(function (tr) {
    MASS[tr.dataset.class] = { billet: +tr.dataset.billet, finished: +tr.dataset.finished, swarf: +tr.dataset.swarf };
  });
  tableRows('capTable').forEach(function (tr) { FLOOR[tr.dataset.class] = parseFloat(tr.dataset.floor); });
  tableRows('scrapTable').forEach(function (tr) { SCRAP[tr.dataset.class] = parseFloat(tr.dataset.scrap); });
  var priceTable = document.getElementById('priceTable');
  if (priceTable) {
    RATE = parseFloat(priceTable.dataset.rate);
    METAL = parseFloat(priceTable.dataset.metal);
    tableRows('priceTable').forEach(function (tr) {
      if (tr.dataset.class) SETUP[tr.dataset.class] = +tr.dataset.setup;
    });
  }
  tableRows('protoTable').forEach(function (tr) {
    if (tr.dataset.class) PROTO[tr.dataset.class] = +tr.dataset.price;
    if (tr.dataset.key) EXTRA[tr.dataset.key] = +tr.dataset.price;
  });

  /* ---------- Case Run Planner ---------- */
  var planClass = seg('planClass', renderPlan);
  var planFinish = seg('planFinish', renderPlan);
  var planTol = seg('planTol', renderPlan);
  var qtyInput = document.getElementById('qtyInput');

  function qty() {
    var v = parseInt(qtyInput.value, 10);
    if (isNaN(v)) v = 1;
    return Math.max(1, Math.min(500, v));
  }
  if (qtyInput) {
    document.getElementById('qtyMinus').addEventListener('click', function () {
      qtyInput.value = Math.max(1, qty() - 1); renderPlan();
    });
    document.getElementById('qtyPlus').addEventListener('click', function () {
      qtyInput.value = Math.min(500, qty() + 1); renderPlan();
    });
    qtyInput.addEventListener('input', renderPlan);
    qtyInput.addEventListener('change', function () { qtyInput.value = qty(); renderPlan(); });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderPlan() {
    if (!planClass || !qtyInput) return;
    var cls = planClass.value;
    var q = qty();
    var op = OPS[cls], finMin = FIN[planFinish.value], mass = MASS[cls];
    var cycle = op.sub + finMin;
    var scrap = Math.ceil(q * SCRAP[cls]);
    var blanks = q + scrap;
    var totalMin = blanks * cycle;
    var machining = round2(totalMin * RATE);
    var material = round2(blanks * mass.billet * METAL);
    var setup = SETUP[cls];
    var total = round2(machining + material + setup);
    var per = round2(total / q);

    setText('outBlanksWork', q + ' to deliver + ' + scrap + ' scrap allowance (' + fmt(SCRAP[cls] * 100, 0) + '% of blanks, Table Q1, rounded up)');
    setText('outBlanks', fmt(blanks, 0) + ' blanks');
    setText('outCycleWork', blanks + ' × ' + cycle + ' min (' + op.sub + ' machining + ' + finMin + ' finishing)');
    setText('outCycle', fmt(totalMin, 0) + ' min · ' + hours(totalMin));
    setText('outMachWork', fmt(totalMin, 0) + ' min × ' + money(RATE) + ' per minute (Table P1)');
    setText('outMachining', money(machining));
    setText('outMatWork', blanks + ' × ' + mass.billet + ' g × CHF ' + fmt(METAL) + ' per gram (Tables M1 · P1)');
    setText('outMaterial', money(material));
    setText('outSetupWork', 'Class ' + cls + ' setup & programming (Table P1)');
    setText('outSetup', money(setup));
    setText('outTotal', money(total));
    setText('outPerWork', fmt(total) + ' ÷ ' + q + ' delivered cases');
    setText('outPerCase', money(per));
    setText('massLine', 'Billet to order: ' + fmt(blanks * mass.billet, 0) + ' g (' + fmt(blanks * mass.billet / 1000) + ' kg) · leaves as swarf: ' + fmt(blanks * mass.swarf, 0) + ' g · finished metal delivered: ' + q + ' × ' + mass.finished + ' g = ' + fmt(q * mass.finished, 0) + ' g');

    var floor = FLOOR[cls], tol = parseFloat(planTol.value);
    var note = document.getElementById('capNote');
    if (tol < floor - 1e-9) {
      note.hidden = false;
      setText('capNoteText', tolStr(tol) + ' on a Class ' + cls + ' case is beyond our measured capability — our floor on this class is ' + tolStr(floor) + ' (Table T1). The run above is priced at ' + tolStr(floor) + '. Going further would need a temperature-controlled inspection room and every surface measured on the CMM — quoted separately, never promised from this page.');
    } else {
      note.hidden = true;
    }
  }

  /* ---------- Prototype Estimator ---------- */
  var estClass = seg('estClass', renderEst);
  var estFinish = seg('estFinish', renderEst);
  var estCount = document.getElementById('estCount');
  var estReport = document.getElementById('estReport');
  var estLines = document.getElementById('estLines');

  function estQty() {
    var v = parseInt(estCount.value, 10);
    if (isNaN(v)) v = 1;
    return Math.max(1, Math.min(3, v));
  }
  if (estCount) {
    document.getElementById('estMinus').addEventListener('click', function () {
      estCount.value = Math.max(1, estQty() - 1); renderEst();
    });
    document.getElementById('estPlus').addEventListener('click', function () {
      estCount.value = Math.min(3, estQty() + 1); renderEst();
    });
    estCount.addEventListener('input', renderEst);
    estReport.addEventListener('change', renderEst);
  }

  function renderEst() {
    if (!estClass || !estLines) return;
    var n = estQty();
    var unit = PROTO[estClass.value];
    var total = n * unit;
    var rows = '';
    rows += '<tr><th scope="row">Prototypes — Class ' + estClass.value + '</th><td>' + n + ' × ' + money(unit) + ' (Table E1)</td><td class="num">' + money(n * unit) + '</td></tr>';
    if (estReport.checked) {
      total += n * EXTRA.report;
      rows += '<tr><th scope="row">Full measurement report</th><td>' + n + ' × ' + money(EXTRA.report) + '</td><td class="num">' + money(n * EXTRA.report) + '</td></tr>';
    }
    if (estFinish.value === 'Polished') {
      total += n * EXTRA.polish;
      rows += '<tr><th scope="row">Polished finish</th><td>' + n + ' × ' + money(EXTRA.polish) + ', in place of brushed</td><td class="num">' + money(n * EXTRA.polish) + '</td></tr>';
    }
    rows += '<tr class="total"><th scope="row">Estimate total</th><td>From Table E1, printed as lines</td><td class="num" id="estTotal">' + money(total) + '</td></tr>';
    estLines.innerHTML = rows;
  }

  if (planClass) renderPlan();
  if (estClass) renderEst();

  /* ---------- Enquiry form (demonstration — transmits nothing) ---------- */
  var form = document.getElementById('enqForm');
  if (form) {
    var confirmBox = document.getElementById('confirm');
    function check(field, valid) {
      var wrap = form.querySelector('[data-field="' + field + '"]');
      if (wrap) wrap.classList.toggle('invalid', !valid);
      return valid;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var msg = document.getElementById('fMsg').value.trim();
      var ok = true;
      ok = check('name', name.length > 0) && ok;
      ok = check('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = check('msg', msg.length >= 10) && ok;
      if (!ok) {
        var firstBad = form.querySelector('.f-field.invalid input, .f-field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'FCW-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
    document.getElementById('confirmReset').addEventListener('click', function () {
      confirmBox.hidden = true;
      form.hidden = false;
      form.reset();
      document.getElementById('fName').focus();
    });
  }
})();
