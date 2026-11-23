/* Séverin Aubert — Atelier de Restauration
   Instruments: the diptych divider, the Scope Planner, the Booking
   Reckoning, the enquiry form. No audio, anywhere, by ruling. */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly when interrupted;
     swallow only that specific rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var EN = '\u2013';   // en dash, as printed in the tables
  var MINUS = '\u2212'; // minus sign, as printed in Table R

  /* ---------- Mobile index panel ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var navPanel = document.getElementById('navPanel');
  if (menuBtn && navPanel) {
    var panelLinks = navPanel.querySelectorAll('a');
    function closePanel(returnFocus) {
      navPanel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (returnFocus) menuBtn.focus();
    }
    menuBtn.addEventListener('click', function () {
      var open = navPanel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && panelLinks.length) {
        requestAnimationFrame(function () { panelLinks[0].focus(); });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navPanel.classList.contains('open')) closePanel(true);
    });
    panelLinks.forEach(function (a) {
      a.addEventListener('click', function () { closePanel(false); });
    });
  }

  /* ---------- The diptych ---------- */
  document.querySelectorAll('[data-diptych]').forEach(function (fig) {
    var stage = fig.querySelector('.dip-stage');
    var handle = fig.querySelector('.dip-handle');
    if (!stage || !handle) return;
    if (reduceMotion.matches) { fig.classList.add('static'); return; }
    var pos = 50;
    function setPos(p) {
      pos = Math.max(4, Math.min(96, p));
      stage.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    }
    function fromEvent(e) {
      var r = stage.getBoundingClientRect();
      if (r.width > 0) setPos(((e.clientX - r.left) / r.width) * 100);
    }
    var dragging = false;
    stage.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      fromEvent(e);
    });
    stage.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    stage.addEventListener('pointerup', function () { dragging = false; });
    stage.addEventListener('pointercancel', function () { dragging = false; });
    handle.addEventListener('keydown', function (e) {
      var step = 0;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') step = -2;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') step = 2;
      else if (e.key === 'PageDown') step = -10;
      else if (e.key === 'PageUp') step = 10;
      else if (e.key === 'Home') { setPos(4); e.preventDefault(); return; }
      else if (e.key === 'End') { setPos(96); e.preventDefault(); return; }
      else return;
      setPos(pos + step);
      e.preventDefault();
    });
    setPos(50);
  });

  /* ---------- Segmented controls ---------- */
  function segInit(id, attr, cb) {
    var seg = document.getElementById(id);
    if (!seg) return null;
    var buttons = Array.prototype.slice.call(seg.querySelectorAll('button'));
    var current = null;
    buttons.forEach(function (b) {
      if (b.getAttribute('aria-pressed') === 'true') current = b.getAttribute(attr);
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        current = b.getAttribute(attr);
        cb(current);
      });
    });
    return { get: function () { return current; } };
  }

  /* ---------- The Scope Planner ----------
     The data below is Tables M, H and R, transcribed. The printed
     tables on the page are the authority; this only reads them aloud. */
  var planOut = document.getElementById('planOut');
  if (planOut) {
    var RATE_CHF = 110;
    var HOURS = {
      conserve:  { standard: [18, 26],  tourbillon: [30, 44],  repeater: [40, 58] },
      light:     { standard: [36, 52],  tourbillon: [64, 92],  repeater: [88, 124] },
      full:      { standard: [62, 94],  tourbillon: [112, 164], repeater: [152, 224] }
    };
    var RECON = [28, 44];
    var MAP = {
      I:   { cls: 'Restore ' + EN + ' light', key: 'light', rateRow: 'restore' },
      II:  { cls: 'Restore ' + EN + ' full', key: 'full', rateRow: 'restore' },
      III: { cls: 'Restore ' + EN + ' full, with a Reconstruct element', key: 'full', recon: true, rateRow: 'recon' },
      IV:  { cls: 'Conserve only', key: 'conserve' }
    };
    var RATES = {
      restore: { standard: MINUS + '3 / +7', tourbillon: MINUS + '4 / +8', repeater: MINUS + '5 / +10' },
      recon:   { standard: MINUS + '5 / +10', tourbillon: MINUS + '6 / +12', repeater: MINUS + '8 / +14' }
    };
    var grade = 'II', comp = 'tourbillon';

    function line(k, v, total) {
      return '<div class="line' + (total ? ' total' : '') + '"><span class="k">' + k +
             '</span><span class="v">' + v + '</span></div>';
    }
    function feeFor(lo, hi) {
      return lo + EN + hi + ' h \u00D7 CHF ' + RATE_CHF + ' = CHF ' + fmt(lo * RATE_CHF) + EN + fmt(hi * RATE_CHF);
    }
    function renderPlan() {
      var m = MAP[grade];
      var h = HOURS[m.key][comp];
      var html = '';
      if (grade === 'IV') {
        html += line('Class assigned (Table M)', 'Conserve only ' + EN + ' restoration refused');
        html += '<div class="refusal"><span class="class-tag">Conserve only ' + EN + ' no restoration is quoted</span>' +
          'No restoration is quoted for a Grade IV watch. Quoting a restoration price for it would be ' +
          'quoting the destruction of the thing that makes it valuable ' + EN + ' its untouched state. ' +
          'The planner will not do it.</div>';
        html += line('Conservation, quoted instead (Table H)', h[0] + EN + h[1] + ' h');
        html += line('Fee', feeFor(h[0], h[1]), true);
        html += line('Rate (Table R)', 'Not regulated ' + EN + ' no rate is published for a conserved watch');
        html += '<p class="note">What conservation buys is stability and a written record: the watch, its ' +
                'evidence intact, handed back. See Case File 3 for the argument in full.</p>';
      } else {
        html += line('Class assigned (Table M)', m.cls);
        if (m.recon) {
          var tLo = h[0] + RECON[0], tHi = h[1] + RECON[1];
          html += line('Bench hours ' + EN + ' Restore (Table H)', h[0] + EN + h[1] + ' h');
          html += line('Reconstruct element (Table H)', '+ ' + RECON[0] + EN + RECON[1] + ' h ' + EN + ' the missing fabric only');
          html += line('Bench hours in total', h[0] + EN + h[1] + ' + ' + RECON[0] + EN + RECON[1] + ' = ' + tLo + EN + tHi + ' h');
          html += line('Fee', feeFor(tLo, tHi), true);
        } else {
          html += line('Bench hours (Table H)', h[0] + EN + h[1] + ' h');
          html += line('Fee', feeFor(h[0], h[1]), true);
        }
        html += line('Expected rate after treatment (Table R)',
                     RATES[m.rateRow][comp] + ' s/day, across positions');
        html += '<p class="note">A planning figure from the printed tables, not a quote: the quote is written ' +
                'in the assessment report, after the watch has been graded on the bench.</p>';
      }
      planOut.innerHTML = html;
    }
    segInit('gradeSeg', 'data-grade', function (v) { grade = v; renderPlan(); });
    segInit('compSeg', 'data-comp', function (v) { comp = v; renderPlan(); });
    renderPlan();
  }

  /* ---------- The Booking Reckoning ---------- */
  var estOut = document.getElementById('estOut');
  if (estOut) {
    var watches = 1, copies = 0, transit = 'owner';
    var wVal = document.getElementById('watchesVal');
    var cVal = document.getElementById('copiesVal');
    var wMinus = document.getElementById('watchesMinus'), wPlus = document.getElementById('watchesPlus');
    var cMinus = document.getElementById('copiesMinus'), cPlus = document.getElementById('copiesPlus');

    function line(k, v, total) {
      return '<div class="line' + (total ? ' total' : '') + '"><span class="k">' + k +
             '</span><span class="v">' + v + '</span></div>';
    }
    function renderEst() {
      var assess = 450 * watches;
      var transitFee = transit === 'atelier' ? 180 * watches : 0;
      var copiesFee = 60 * copies;
      var total = assess + transitFee + copiesFee;
      var html = '';
      html += line('Assessment & condition report', 'CHF 450 \u00D7 ' + watches + ' = CHF ' + fmt(assess));
      html += line('Insured transit arrangement',
                   transit === 'atelier' ? 'CHF 180 \u00D7 ' + watches + ' = CHF ' + fmt(transitFee)
                                         : 'Owner arranges ' + EN + ' CHF 0');
      html += line('Extra bound record copies', 'CHF 60 \u00D7 ' + copies + ' = CHF ' + fmt(copiesFee));
      html += line('Total due at booking', 'CHF ' + fmt(total), true);
      html += '<p class="note">The assessment fee is credited in full against the treatment if the watch ' +
              'proceeds. The deposit on treatment ' + EN + ' 30% of the low end of the quoted fee range ' + EN +
              ' is set out in the assessment report itself.</p>';
      estOut.innerHTML = html;
      wVal.textContent = String(watches);
      cVal.textContent = String(copies);
      wMinus.disabled = watches <= 1; wPlus.disabled = watches >= 3;
      cMinus.disabled = copies <= 0; cPlus.disabled = copies >= 3;
    }
    wMinus.addEventListener('click', function () { if (watches > 1) { watches--; renderEst(); } });
    wPlus.addEventListener('click', function () { if (watches < 3) { watches++; renderEst(); } });
    cMinus.addEventListener('click', function () { if (copies > 0) { copies--; renderEst(); } });
    cPlus.addEventListener('click', function () { if (copies < 3) { copies++; renderEst(); } });
    segInit('transitSeg', 'data-transit', function (v) { transit = v; renderEst(); });
    renderEst();
  }

  /* ---------- The enquiry form (demonstration — transmits nothing) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    var refNo = document.getElementById('refNo');
    var checks = [
      { wrap: 'f-name', input: 'inName', ok: function (v) { return v.trim().length >= 2; } },
      { wrap: 'f-email', input: 'inEmail', ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { wrap: 'f-watch', input: 'inWatch', ok: function (v) { return v.trim().length >= 3; } },
      { wrap: 'f-wrong', input: 'inWrong', ok: function (v) { return v.trim().length >= 10; } }
    ];
    checks.forEach(function (c) {
      var input = document.getElementById(c.input);
      var wrap = document.getElementById(c.wrap);
      input.addEventListener('input', function () { wrap.classList.remove('invalid'); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      checks.forEach(function (c) {
        var input = document.getElementById(c.input);
        var wrap = document.getElementById(c.wrap);
        var good = c.ok(input.value);
        wrap.classList.toggle('invalid', !good);
        if (!good && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }
      refNo.textContent = 'AB-2026-' + Math.floor(1000 + Math.random() * 9000);
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
    });
  }
})();
