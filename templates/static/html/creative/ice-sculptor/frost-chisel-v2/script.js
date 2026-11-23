/* ============================================================
   FROST CHISEL — Korpela Ice Works (fictional)
   Sound ruling: NONE. This script contains no audio code and
   never creates an AudioContext — chainsaw audio on a
   portfolio page is a stunt, and the ruling is printed in
   the footer of every page.
   The planner and estimator parse their figures from the
   printed tables in the DOM, so tool and page cannot disagree.
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

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- hall temperature ticker (index hero) ----------
     The hall cools to carve temperature when the sheet opens:
     -2.0 C down to -10.0 C in half-degree steps. The motion has
     one job — it shows the working condition arriving. Under
     reduced motion the hall is simply already cold. */
  var hallTemp = document.getElementById('hallTemp');
  var hallStatus = document.getElementById('hallStatus');
  if (hallTemp) {
    var fmtT = function (v) { return '−' + Math.abs(v).toFixed(1) + ' °C'; };
    if (reduced) {
      hallTemp.textContent = fmtT(-10);
      if (hallStatus) hallStatus.textContent = 'Hall at carve temperature';
    } else {
      var t = -2.0;
      hallTemp.textContent = fmtT(t);
      if (hallStatus) hallStatus.textContent = 'Hall cooling — blocks tempering';
      var iv = setInterval(function () {
        t = Math.round((t - 0.5) * 10) / 10;
        if (t <= -10) {
          t = -10;
          hallTemp.textContent = fmtT(t);
          if (hallStatus) hallStatus.textContent = 'Hall at carve temperature';
          clearInterval(iv);
        } else {
          hallTemp.textContent = fmtT(t);
        }
      }, 110);
    }
  }

  var eur = function (n) { return '€' + n.toLocaleString('en-GB'); };
  var oneDec = function (n) { return (Math.round(n * 10) / 10).toFixed(1); };

  /* ---------- segmented control helper ---------- */
  function segGroup(id, onPick) {
    var box = document.getElementById(id);
    if (!box) return null;
    var btns = Array.prototype.slice.call(box.querySelectorAll('button[data-v]'));
    var current = null;
    btns.forEach(function (b) {
      if (b.getAttribute('aria-pressed') === 'true') current = b.getAttribute('data-v');
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        current = b.getAttribute('data-v');
        onPick(current);
      });
    });
    return { get: function () { return current; } };
  }

  function stepper(minusId, plusId, valId, opts) {
    var minus = document.getElementById(minusId), plus = document.getElementById(plusId), val = document.getElementById(valId);
    if (!minus || !plus || !val) return null;
    var v = opts.start, step = opts.step || 1, min = opts.min, max = opts.max;
    var numEl = val.querySelector('.n') || val;
    var render = function () { numEl.textContent = v; if (opts.onChange) opts.onChange(v); };
    minus.addEventListener('click', function () { v = Math.max(min, v - step); render(); });
    plus.addEventListener('click', function () { v = Math.min(max, v + step); render(); });
    return { get: function () { return v; } };
  }

  /* ---------- Block & Melt Planner (index) ---------- */
  var carveTable = document.getElementById('carveTable');
  if (carveTable) {
    var classes = {};
    carveTable.querySelectorAll('tbody tr[data-class]').forEach(function (tr) {
      classes[tr.getAttribute('data-class')] = {
        rate: parseFloat(tr.getAttribute('data-rate')),
        name: tr.querySelector('th').textContent.trim()
      };
    });
    var bands = [];
    document.querySelectorAll('#meltTable tbody tr[data-band]').forEach(function (tr) {
      bands.push({
        id: tr.getAttribute('data-band'),
        rate: parseFloat(tr.getAttribute('data-rate')),
        label: tr.querySelector('th').textContent.trim()
      });
    });
    var DETAIL_MM = 12, INSTALL_H = 2;
    var pClass = segGroup('plannerClass', runPlanner);
    var pBand = segGroup('plannerBand', runPlanner);
    var pBlocks = stepper('blocksMinus', 'blocksPlus', 'blocksVal', { start: 6, min: 1, max: 40, onChange: runPlanner });
    var pWin = stepper('winMinus', 'winPlus', 'winVal', { start: 12, step: 6, min: 6, max: 96, onChange: runPlanner });
    var eventInput = document.getElementById('eventWhen');
    if (eventInput) eventInput.addEventListener('change', runPlanner);

    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function fmtWhen(d) {
      var hh = ('0' + d.getHours()).slice(-2), mm = ('0' + d.getMinutes()).slice(-2);
      return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + hh + ':' + mm;
    }
    function lifeText(h) {
      if (h >= 48) return oneDec(h) + ' hours (' + oneDec(h / 24) + ' days)';
      return oneDec(h) + ' hours';
    }

    function runPlanner() {
      if (!pClass || !pBand || !pBlocks || !pWin) return;
      var cls = classes[pClass.get()], band = null;
      bands.forEach(function (b) { if (b.id === pBand.get()) band = b; });
      if (!cls || !band) return;
      var blocks = pBlocks.get(), win = pWin.get();
      var carve = blocks / cls.rate;
      var life = DETAIL_MM / band.rate;
      document.getElementById('workCarve').innerHTML =
        'Carve time: <b>' + blocks + ' blocks ÷ ' + cls.rate.toFixed(2) + ' blocks/h</b> (' + cls.name + ', Table C1) = <b>' + oneDec(carve) + ' team-hours</b>, team of 2.';
      document.getElementById('workLife').innerHTML =
        'Detail life: <b>12 mm ÷ ' + band.rate + ' mm/h</b> (' + band.label + ', Table M1) = <b>' + lifeText(life) + '</b> before the face goes.';
      document.getElementById('outCarve').textContent = oneDec(carve) + ' h';
      document.getElementById('outLife').textContent = lifeText(life);
      var startTxt = '—';
      if (eventInput && eventInput.value) {
        var ev = new Date(eventInput.value);
        if (!isNaN(ev.getTime())) {
          var st = new Date(ev.getTime() - (carve + INSTALL_H) * 3600000);
          startTxt = fmtWhen(st);
        }
      }
      document.getElementById('outStart').textContent = startTxt;
      document.getElementById('workStart').innerHTML =
        'First saw: opening minus <b>' + oneDec(carve) + ' carve hours + ' + INSTALL_H + ' install hours</b> = <b>' + startTxt + '</b>.';
      var verdict = document.getElementById('plannerVerdict');
      var vt = verdict.querySelector('.vt'), vb = verdict.querySelector('.vb');
      if (life >= win) {
        verdict.className = 'verdict ok';
        vt.textContent = 'Stands the window';
        vb.innerHTML = 'At ' + band.label + ' the detail holds <b>' + lifeText(life) + '</b> — ' +
          oneDec(life - win) + ' hours beyond the ' + win + '-hour promise. The melt is planned, not feared.';
      } else {
        /* the warmest band whose detail life covers the window */
        var needed = null;
        bands.forEach(function (b) { if (DETAIL_MM / b.rate >= win && (!needed || b.rate > needed.rate)) needed = b; });
        verdict.className = 'verdict bad';
        vt.textContent = 'Will not stand';
        vb.innerHTML = 'At <b>' + band.label + '</b> this piece will not survive the full festival — the detail is gone in <b>' +
          lifeText(life) + '</b>, ' + oneDec(win - life) + ' hours short of the ' + win + '-hour promise. Carve smaller and install at opening, ' +
          'or the festival buys refrigeration' + (needed ? ': the <b>' + needed.label + '</b> band holds detail for <b>' + lifeText(DETAIL_MM / needed.rate) + '</b>.' : '.');
      }
      /* mark selected rows in the printed tables */
      carveTable.querySelectorAll('tbody tr').forEach(function (tr) {
        tr.classList.toggle('sel', tr.getAttribute('data-class') === pClass.get());
      });
      document.querySelectorAll('#meltTable tbody tr').forEach(function (tr) {
        tr.classList.toggle('sel', tr.getAttribute('data-band') === pBand.get());
      });
    }
    runPlanner();
  }

  /* ---------- Booking estimator (index) ---------- */
  var feeTable = document.getElementById('feeTable');
  if (feeTable) {
    var fees = {};
    feeTable.querySelectorAll('tbody tr[data-line]').forEach(function (tr) {
      fees[tr.getAttribute('data-line')] = parseInt(tr.getAttribute('data-rate'), 10);
    });
    var transportFee = 240;
    var eBlocks = stepper('estBlocksMinus', 'estBlocksPlus', 'estBlocksVal', { start: 6, min: 1, max: 60, onChange: runEst });
    var eDays = stepper('estDaysMinus', 'estDaysPlus', 'estDaysVal', { start: 3, min: 1, max: 30, onChange: runEst });
    var eFreezer = stepper('estFreezerMinus', 'estFreezerPlus', 'estFreezerVal', { start: 3, min: 0, max: 30, onChange: runEst });
    var eTrans = segGroup('estTransport', function (v) { transportFee = parseInt(v, 10); runEst(); });
    var refrigBtn = document.getElementById('estRefrig');
    var refrigOn = false;
    if (refrigBtn) refrigBtn.addEventListener('click', function () {
      refrigOn = !refrigOn;
      refrigBtn.setAttribute('aria-pressed', refrigOn ? 'true' : 'false');
      runEst();
    });
    function runEst() {
      if (!eBlocks || !eDays || !eFreezer) return;
      var b = eBlocks.get() * fees.blocks, d = eDays.get() * fees.day,
          f = eFreezer.get() * fees.freezer, r = refrigOn ? fees.refrig : 0;
      document.getElementById('workEst').innerHTML =
        'Blocks <b>' + eBlocks.get() + ' × ' + eur(fees.blocks) + ' = ' + eur(b) + '</b> · Team <b>' + eDays.get() + ' days × ' + eur(fees.day) + ' = ' + eur(d) +
        '</b> · Freezer truck <b>' + eFreezer.get() + ' days × ' + eur(fees.freezer) + ' = ' + eur(f) + '</b> · Transport <b>' + eur(transportFee) +
        '</b> · Refrigerated marquee <b>' + eur(r) + '</b> — every rate from Table F1.';
      document.getElementById('estTotal').textContent = eur(b + d + f + transportFee + r);
    }
    if (eTrans) transportFee = parseInt(eTrans.get(), 10);
    runEst();
  }

  /* ---------- contact form (contact page) ---------- */
  var form = document.getElementById('carveForm');
  if (form) {
    var done = document.getElementById('formDone');
    var fields = {
      fName: { el: form.fName, err: 'errName', test: function (v) { return v.trim().length >= 2; }, msg: 'Your name, as it should appear on the sheet.' },
      fEmail: { el: form.fEmail, err: 'errEmail', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: 'A working email — the reply goes there.' },
      fDate: { el: form.fDate, err: 'errDate', test: function (v) { return !!v; }, msg: 'The event date — blocks are ordered three weeks out.' },
      fMsg: { el: form.fMsg, err: 'errMsg', test: function (v) { return v.trim().length >= 10; }, msg: 'Ten characters at least: what, where, how big.' }
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k], errEl = document.getElementById(f.err), good = f.test(f.el.value);
        if (errEl) { errEl.hidden = good; if (!good) errEl.textContent = f.msg; }
        f.el.setAttribute('aria-invalid', good ? 'false' : 'true');
        if (!good) { ok = false; if (!firstBad) firstBad = f.el; }
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var ref = 'FC-2027-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('formRef').textContent = ref;
      form.hidden = true;
      if (done) { done.hidden = false; done.scrollIntoView({ block: 'center' }); }
    });
  }
})();
