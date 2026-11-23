/* Solberg Glass Studio — shared script
   - view-transition abort guard
   - mobile menu (commission-book contents panel)
   - clip reveal on window plates (the window opens)
   - Window Planner + booking estimator: both READ the figures
     printed in the tables on the page, so tool and page cannot disagree
   - contact form validation + in-page confirmation (demonstration) */

(function () {
  'use strict';

  /* Chrome reports an aborted cross-document view transition as an
     unhandled rejection; the navigation itself always completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- mobile menu ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var mobilePanel = document.getElementById('mobilePanel');
  if (menuBtn && mobilePanel) {
    var setMenu = function (open) {
      menuBtn.setAttribute('aria-expanded', String(open));
      mobilePanel.classList.toggle('open', open);
      mobilePanel.setAttribute('aria-hidden', String(!open));
      if (open) {
        requestAnimationFrame(function () {
          var first = mobilePanel.querySelector('a');
          if (first) first.focus();
        });
      }
    };
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
    mobilePanel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  /* ---------------- clip reveal: the window opens ---------------- */
  var plates = document.querySelectorAll('.plate');
  if (plates.length) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      plates.forEach(function (p) { p.classList.add('revealed'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('revealed');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
      plates.forEach(function (p) { io.observe(p); });
    }
  }

  /* ---------------- helpers ---------------- */
  function num(text) {
    var v = parseFloat(String(text).replace(/[^0-9.]/g, ''));
    return isNaN(v) ? 0 : v;
  }
  function money(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }
  function $(id) { return document.getElementById(id); }

  /* Segmented radio-group: returns object with get() */
  function segControl(id, onChange) {
    var el = $(id);
    if (!el) return null;
    var buttons = Array.prototype.slice.call(el.querySelectorAll('button[role="radio"]'));
    function current() {
      var b = buttons.filter(function (x) { return x.getAttribute('aria-checked') === 'true'; })[0];
      return b ? b.getAttribute('data-value') : null;
    }
    function select(btn, fire) {
      buttons.forEach(function (x) { x.setAttribute('aria-checked', String(x === btn)); });
      if (fire) onChange(current());
    }
    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () { select(btn, true); });
      btn.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % buttons.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + buttons.length) % buttons.length;
        if (j !== null) { e.preventDefault(); select(buttons[j], true); buttons[j].focus(); }
      });
    });
    return { get: current };
  }

  /* Stepper: minus/plus buttons around a value readout */
  function stepper(id, opts, onChange) {
    var el = $(id);
    if (!el) return null;
    var valEl = el.querySelector('.step-val .v');
    var value = opts.value;
    function render() { valEl.textContent = value.toFixed(opts.decimals); }
    el.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = parseFloat(btn.getAttribute('data-step'));
        var next = Math.round((value + d * opts.step) * 100) / 100;
        next = Math.min(opts.max, Math.max(opts.min, next));
        if (next !== value) { value = next; render(); onChange(value); }
      });
    });
    render();
    return { get: function () { return value; } };
  }

  /* ---------------- read the printed tables ---------------- */
  var schedTable = $('schedTable');
  var glassTable = $('glassTable');
  var feeTable = $('feeTable');
  if (schedTable && glassTable) {
    var sched = {};   /* class -> {pieces, came, pace, making} */
    schedTable.querySelectorAll('tbody tr').forEach(function (tr) {
      var c = tr.cells;
      sched[tr.getAttribute('data-class')] = {
        label: c[0].textContent.trim(),
        pieces: num(c[1].textContent),
        came: num(c[2].textContent),
        pace: num(c[3].textContent),
        making: num(c[4].textContent)
      };
    });
    var glass = {};   /* glass -> £/m² */
    glassTable.querySelectorAll('tbody tr').forEach(function (tr) {
      glass[tr.getAttribute('data-glass')] = num(tr.cells[1].textContent);
    });
    var fees = {};    /* class -> design & cartoon fee */
    if (feeTable) {
      feeTable.querySelectorAll('tbody tr').forEach(function (tr) {
        fees[tr.getAttribute('data-class')] = num(tr.cells[1].textContent);
      });
    }

    /* ---------------- Window Planner ---------------- */
    var pClass = segControl('pClass', plan);
    var pGlass = segControl('pGlass', plan);
    var pWidth = stepper('pWidth', { value: 1.2, min: 0.4, max: 3.0, step: 0.1, decimals: 2 }, plan);
    var pHeight = stepper('pHeight', { value: 2.4, min: 0.4, max: 4.0, step: 0.1, decimals: 2 }, plan);

    function band(area, rate, making) {
      var base = area * (rate + making);
      return {
        base: base,
        lo: Math.floor(base / 100) * 100,
        hi: Math.ceil((base * 1.2) / 100) * 100
      };
    }

    function plan() {
      if (!pClass || !pWidth || !pHeight || !pGlass) return;
      var key = pClass.get();
      var row = sched[key];
      var w = pWidth.get(), h = pHeight.get();
      var area = w * h;
      var pieces = Math.round(area * row.pieces);
      var came = area * row.came;
      var weeks = Math.ceil((area / row.pace) * 2) / 2;
      var mode = pGlass.get();
      var bMouth = band(area, glass.mouth, row.making);
      var bMach = band(area, glass.machine, row.making);

      $('p-area').textContent = area.toFixed(2) + ' m²';
      $('p-pieces').textContent = pieces.toLocaleString('en-GB');
      $('p-came').textContent = row.came === 0 ? 'Set, not leaded' : came.toFixed(1) + ' m';
      $('p-weeks').textContent = weeks.toFixed(1) + ' weeks';
      $('p-band-mb').textContent = money(bMouth.lo) + ' – ' + money(bMouth.hi);
      $('p-band-mc').textContent = money(bMach.lo) + ' – ' + money(bMach.hi);
      $('row-band-mb').hidden = (mode === 'machine');
      $('row-band-mc').hidden = (mode === 'mouth');
      $('p-compare').hidden = (mode !== 'compare');

      var cameLine = row.came === 0
        ? 'came — mosaic is set in a cement bed, not leaded'
        : 'came ' + area.toFixed(2) + ' × ' + row.came + ' = ' + came.toFixed(1) + ' m';
      $('p-workings').innerHTML =
        '<strong>Workings, from the tables above.</strong> ' +
        'Area ' + w.toFixed(2) + ' × ' + h.toFixed(2) + ' = ' + area.toFixed(2) + ' m² · ' +
        'pieces ' + area.toFixed(2) + ' × ' + row.pieces + ' = ' + (area * row.pieces).toFixed(1) + ' → ' + pieces.toLocaleString('en-GB') + ' · ' +
        cameLine + ' · ' +
        'studio time ' + area.toFixed(2) + ' ÷ ' + row.pace + ' = ' + (area / row.pace).toFixed(1) + ' → ' + weeks.toFixed(1) + ' weeks (rounded up to the half week) · ' +
        'mouth-blown ' + area.toFixed(2) + ' × (' + money(glass.mouth) + ' + ' + money(row.making) + ') = ' + money(bMouth.base) + ' → band ' + money(bMouth.lo) + ' – ' + money(bMouth.hi) + ' · ' +
        'machine-made ' + area.toFixed(2) + ' × (' + money(glass.machine) + ' + ' + money(row.making) + ') = ' + money(bMach.base) + ' → band ' + money(bMach.lo) + ' – ' + money(bMach.hi) + '. ' +
        'Band rule: the estimate is rounded down to the nearest £100 at the low end; the high end adds a fifth for access, scaffolding and fixing unknowns, then rounds up.';
    }
    plan();

    /* ---------------- Booking estimator ---------------- */
    var eClass = segControl('eClass', estimate);
    var eGlass = segControl('eGlass', estimate);
    var eArea = stepper('eArea', { value: 2.0, min: 0.5, max: 12.0, step: 0.5, decimals: 1 }, estimate);

    function estimate() {
      if (!eClass || !eGlass || !eArea) return;
      var key = eClass.get();
      var row = sched[key];
      var area = eArea.get();
      var rate = glass[eGlass.get()];
      var design = fees[key] || 0;
      var makingLine = area * row.making;
      var glassLine = area * rate;
      var total = design + makingLine + glassLine;
      $('e-design').textContent = money(design);
      $('e-making').textContent = money(makingLine);
      $('e-glass').textContent = money(glassLine);
      $('e-total').textContent = money(total);
      $('e-workings').innerHTML =
        '<strong>Workings.</strong> Design &amp; cartoon ' + money(design) + ' (Table F1, ' + row.label.toLowerCase() + ') + ' +
        'making ' + area.toFixed(1) + ' m² × ' + money(row.making) + ' = ' + money(makingLine) + ' + ' +
        'glass ' + area.toFixed(1) + ' m² × ' + money(rate) + ' = ' + money(glassLine) + ' → ' + money(total) + '. ' +
        'An estimate at mid-band figures, not a quote: the fixed price is set at Gate 2, when the cartoon is approved and the opening has been surveyed.';
    }
    estimate();
  }

  /* ---------------- contact form (demonstration) ---------------- */
  var form = $('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('f-name'), email = $('f-email'), type = $('f-type'), msg = $('f-msg');
      var ok = true;
      function check(input, errId, valid) {
        var err = $(errId);
        if (err) err.hidden = valid;
        input.setAttribute('aria-invalid', String(!valid));
        if (!valid) ok = false;
      }
      check(name, 'err-name', name.value.trim().length >= 2);
      check(email, 'err-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
      check(type, 'err-type', type.value !== '');
      check(msg, 'err-msg', msg.value.trim().length >= 10);
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'SG-2026-' + Math.floor(1000 + Math.random() * 9000);
      $('confirmRef').textContent = ref;
      $('confirmSummary').textContent =
        'Thank you, ' + name.value.trim() + '. Your enquiry about a ' +
        type.options[type.selectedIndex].text.toLowerCase() +
        ' has been recorded on this page with reference ' + ref + '.';
      form.hidden = true;
      var confirmBox = $('confirmBox');
      confirmBox.hidden = false;
      confirmBox.querySelector('h3').focus();
    });
  }
})();
