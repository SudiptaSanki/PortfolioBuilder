/* Marchetti Planted Works — biophilic-sanctuary
   Sound: none, by ruling (see footer). No audio is created anywhere in this file. */
(function () {
  'use strict';

  /* View-transition abort guard: Chrome surfaces an aborted cross-document
     transition as an unhandled rejection; the navigation itself completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- mobile sheets panel ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('sheetsPanel');
  var panelClose = document.getElementById('panelClose');
  if (menuBtn && panel) {
    var openPanel = function () {
      panel.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () { if (panelClose) panelClose.focus(); });
    };
    var closePanel = function () {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      menuBtn.focus();
    };
    menuBtn.addEventListener('click', openPanel);
    if (panelClose) panelClose.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        panel.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- the walk: pinned stage on desktop, stacked elsewhere ---------- */
  var walk = document.querySelector('.walk');
  if (walk) {
    var stages = Array.prototype.slice.call(walk.querySelectorAll('.stage'));
    /* Pin unless the primary pointer is coarse (a touch device) — touch stacks.
       (pointer:none headless environments count as non-coarse desktops.) */
    var canPin = !window.matchMedia('(pointer: coarse)').matches &&
      window.innerWidth >= 900 && !reducedMotion.matches;
    if (canPin && stages.length) {
      document.body.classList.add('walk-on');
      var rail = walk.querySelector('.walk-rail');
      var bar = walk.querySelector('.walk-progress');
      var railBtns = [];
      if (rail) {
        stages.forEach(function (stage, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = '0' + (i + 1);
          b.setAttribute('aria-label', 'Go to ' + stage.querySelector('h3').textContent);
          b.addEventListener('click', function () {
            var total = walk.offsetHeight - window.innerHeight;
            var y = walk.getBoundingClientRect().top + window.scrollY + (total * (i + 0.5)) / stages.length;
            window.scrollTo({ top: y, behavior: 'smooth' });
          });
          rail.appendChild(b);
          railBtns.push(b);
        });
      }
      var current = -1;
      var setStage = function (idx) {
        if (idx === current) return;
        current = idx;
        stages.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
        railBtns.forEach(function (b, i) { b.classList.toggle('is-active', i === idx); });
      };
      var ticking = false;
      var update = function () {
        ticking = false;
        var total = walk.offsetHeight - window.innerHeight;
        var gone = -walk.getBoundingClientRect().top;
        var p = Math.min(1, Math.max(0, gone / total));
        if (bar) bar.style.width = (p * 100).toFixed(2) + '%';
        setStage(Math.min(stages.length - 1, Math.floor(p * stages.length)));
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      setStage(0);
      update();
    }
  }

  /* ---------- helpers ---------- */
  function fmtInt(n) { return Math.round(n).toLocaleString('en-GB'); }
  function fmtCare(n) { return String(parseFloat(n.toFixed(2))); }
  function fmtGBP(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }
  function cellNum(row, cls) {
    var el = row.querySelector('.' + cls);
    return parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
  }

  /* ---------- steppers (bound once) ---------- */
  document.querySelectorAll('.stepper button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-target'));
      if (!input) return;
      var step = parseFloat(input.step) || 1;
      var dir = btn.getAttribute('data-dir') === 'down' ? -1 : 1;
      var v = (parseFloat(input.value) || 0) + dir * step;
      var min = input.min !== '' ? parseFloat(input.min) : 0;
      var max = input.max !== '' ? parseFloat(input.max) : Infinity;
      input.value = Math.min(max, Math.max(min, v));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  /* ---------- Planting & Establishment Planner (parses Table P1) ---------- */
  var plantTable = document.getElementById('plantTable');
  if (plantTable) {
    var classes = Array.prototype.map.call(
      plantTable.querySelectorAll('tbody tr'),
      function (row) {
        return {
          name: row.querySelector('.c-name').textContent.trim(),
          density: cellNum(row, 'c-density'),
          loss: cellNum(row, 'c-loss'),
          water: cellNum(row, 'c-water'),
          care: cellNum(row, 'c-care'),
          inputId: row.getAttribute('data-input')
        };
      }
    );
    var caretakerInput = document.getElementById('in-caretaker');
    var out = {
      setOut: document.getElementById('out-setout'),
      repl: document.getElementById('out-repl'),
      order: document.getElementById('out-order'),
      water: document.getElementById('out-water'),
      workings: document.getElementById('plannerWorkings'),
      verdict: document.getElementById('plannerVerdict')
    };
    var SEASON_WEEKS = 26;

    function computePlanner() {
      var lines = [];
      var totSet = 0, totRepl = 0, totWaterWk = 0, totCare = 0;
      var perClass = classes.map(function (c) {
        var input = document.getElementById(c.inputId);
        var area = Math.max(0, parseFloat(input.value) || 0);
        var setOut = Math.ceil(area * c.density);
        var repl = Math.ceil(setOut * c.loss / 100);
        var waterWk = area * c.water;
        var care = area * c.care;
        totSet += setOut; totRepl += repl; totWaterWk += waterWk; totCare += care;
        lines.push('<li><b>' + c.name + ':</b> ' + fmtInt(area) + ' m² × ' + c.density +
          ' plants/m² = <b>' + fmtInt(setOut) + '</b> to set out; losses ' + fmtInt(setOut) +
          ' × ' + c.loss + '% = <b>' + fmtInt(repl) + '</b> allowed; water ' + fmtInt(area) +
          ' × ' + c.water + ' L = <b>' + fmtInt(waterWk) + ' L/week</b>; care ' + fmtInt(area) +
          ' × ' + c.care + ' h = <b>' + fmtCare(care) + ' h/month</b>.</li>');
        return { c: c, area: area, care: care };
      });
      var season = totWaterWk * SEASON_WEEKS;
      lines.push('<li><b>Season water:</b> ' + fmtInt(totWaterWk) + ' L/week × ' + SEASON_WEEKS +
        ' weeks = <b>' + fmtInt(season) + ' L</b>.</li>');
      out.setOut.textContent = fmtInt(totSet);
      out.repl.textContent = fmtInt(totRepl);
      out.order.textContent = fmtInt(totSet + totRepl);
      out.water.textContent = fmtInt(season);
      out.workings.innerHTML = lines.join('');

      var caretaker = Math.max(0, parseFloat(caretakerInput.value) || 0);
      if (totCare <= caretaker) {
        out.verdict.className = 'verdict';
        out.verdict.innerHTML = '<span class="v-head">Fits the stated hours.</span> ' +
          'This scheme asks <b>' + fmtCare(totCare) + ' hours of care a month</b>; the stated caretaker time is <b>' +
          fmtCare(caretaker) + ' hours</b>. The maintenance plan can be signed as drawn.';
      } else {
        var scale = caretaker / totCare;
        var reduced = perClass.map(function (p) { return Math.floor(p.area * scale); });
        var reducedCare = perClass.reduce(function (sum, p, i) { return sum + reduced[i] * p.c.care; }, 0);
        var reducedList = perClass.map(function (p, i) {
          return p.c.name.toLowerCase() + ' <b>' + fmtInt(reduced[i]) + ' m²</b>';
        }).join(', ');
        out.verdict.className = 'verdict over';
        out.verdict.innerHTML = '<span class="v-head">Over capacity — this scheme needs more care than the stated hours.</span> ' +
          'As drawn it asks <b>' + fmtCare(totCare) + ' h/month</b> against <b>' + fmtCare(caretaker) +
          ' h/month</b> stated. Scaled by the printed rule (every class cut by the same fraction, ' +
          fmtCare(scale) + '), the scheme that fits is: ' + reducedList + ' — asking <b>' +
          fmtCare(reducedCare) + ' h/month</b>. We would rather plant the smaller scheme than watch the larger one thin out.';
      }
    }
    classes.forEach(function (c) {
      document.getElementById(c.inputId).addEventListener('input', computePlanner);
    });
    caretakerInput.addEventListener('input', computePlanner);
    computePlanner();
  }

  /* ---------- Booking estimator (parses Table F1) ---------- */
  var feeTable = document.getElementById('feeTable');
  if (feeTable) {
    var fees = {};
    feeTable.querySelectorAll('tbody tr').forEach(function (row) {
      fees[row.getAttribute('data-fee')] = cellNum(row, 'c-fee');
    });
    var estArea = document.getElementById('est-area');
    var estVisits = document.getElementById('est-visits');
    var estTotal = document.getElementById('est-total');
    var estWorkings = document.getElementById('estWorkings');
    function computeEstimator() {
      var area = Math.max(0, parseFloat(estArea.value) || 0);
      var visits = Math.max(0, parseFloat(estVisits.value) || 0);
      var planLine = area * fees.perm2;
      var visitLine = visits * fees.visit;
      var total = fees.survey + fees.plan + planLine + visitLine;
      estWorkings.innerHTML =
        '<li>Site survey &amp; soil report: <b>' + fmtGBP(fees.survey) + '</b> (flat).</li>' +
        '<li>Concept &amp; planting plan: <b>' + fmtGBP(fees.plan) + '</b> (flat).</li>' +
        '<li>Setting-out drawings: ' + fmtInt(area) + ' m² × ' + fmtGBP(fees.perm2) + ' = <b>' + fmtGBP(planLine) + '</b>.</li>' +
        '<li>Establishment supervision: ' + fmtInt(visits) + ' visits × ' + fmtGBP(fees.visit) + ' = <b>' + fmtGBP(visitLine) + '</b>.</li>';
      estTotal.textContent = fmtGBP(total);
    }
    estArea.addEventListener('input', computeEstimator);
    estVisits.addEventListener('input', computeEstimator);
    computeEstimator();
  }

  /* ---------- enquiry form: validation + in-page confirmation ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    function markInvalid(id, bad) {
      var field = document.getElementById(id).closest('.form-field');
      field.classList.toggle('invalid', bad);
      return !bad;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var message = document.getElementById('f-message');
      var ok = true;
      ok = markInvalid('f-name', name.value.trim().length < 2) && ok;
      ok = markInvalid('f-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
      ok = markInvalid('f-message', message.value.trim().length < 10) && ok;
      if (!ok) return;
      var ref = 'MPW-2027-' + (1000 + Math.floor(Math.random() * 9000));
      var typeSel = document.getElementById('f-type');
      document.getElementById('confText').innerHTML =
        'Thank you, <b>' + name.value.trim() + '</b>. Your enquiry about a <b>' +
        typeSel.options[typeSel.selectedIndex].text.toLowerCase() + '</b> is logged under reference ' +
        '<span class="ref">' + ref + '</span>. On a live practice site this is the point where the ' +
        'survey diary opens; here, nothing has been transmitted or stored.';
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    });
    ['f-name', 'f-email', 'f-message'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () {
        document.getElementById(id).closest('.form-field').classList.remove('invalid');
      });
    });
  }
})();
