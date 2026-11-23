/* Calloway Clay — shared script.
   Three jobs, each guarded so pages without the element skip it:
   1. mobile nav toggle   2. batch calculator   3. enquiry form.
   No audio, no tracking, nothing leaves the page. */
(function () {
  'use strict';

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- mobile nav: the kiln door ----------
     The sheet rises from the bottom of the screen over a scrim.
     Esc or a scrim tap closes it; focus goes in on open and back to
     the button on close; a link tap closes (and navigates); the page
     locks behind it; growing past 640px closes it. */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  var scrim = document.getElementById('nav-scrim');
  if (toggle && nav) {
    var closeNav = function (restoreFocus) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
      if (scrim) scrim.hidden = true;
      document.body.classList.remove('nav-locked');
      if (restoreFocus) toggle.focus();
    };
    var openNav = function () {
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = 'Close';
      if (scrim) scrim.hidden = false;
      document.body.classList.add('nav-locked');
      var first = nav.querySelector('a');
      if (first) first.focus();
    };
    toggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) closeNav(true); else openNav();
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav(false); /* the tap navigates */
    });
    if (scrim) scrim.addEventListener('click', function () { closeNav(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeNav(true);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 640 && nav.classList.contains('open')) closeNav(false);
    });
  }

  /* ---------- batch calculator ----------
     Pantile: 342 x 241 mm, laid at a 343 mm gauge -> 10.4 tiles per m2.
     Waste allowance 7% for cuts and breakage, stated on the page. */
  var calc = document.getElementById('calc-form');
  if (calc) {
    var PRICES = { standard: 3.40, blend: 3.90, bespoke: 4.50 };
    var COVERAGE = 10.4;   /* tiles per m2 at standard gauge */
    var WASTE = 1.07;
    var slopeEl = document.getElementById('calc-slope');
    var eavesEl = document.getElementById('calc-eaves');
    var typeEl = document.getElementById('calc-type');
    var errEl = document.getElementById('calc-error');
    var outArea = document.getElementById('out-area');
    var outTiles = document.getElementById('out-tiles');
    var outBatches = document.getElementById('out-batches');
    var outPrice = document.getElementById('out-price');

    function fmt(n) { return n.toLocaleString('en-GB'); }
    function money(n) { return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    function runCalc() {
      var slope = parseFloat(slopeEl.value);
      var eaves = parseFloat(eavesEl.value);
      var price = PRICES[typeEl.value] || PRICES.standard;
      if (!(slope > 0) || !(eaves > 0)) {
        errEl.textContent = 'Enter both measurements, in metres, before the yard will do the sum.';
        outArea.textContent = outTiles.textContent = outBatches.textContent = outPrice.textContent = '—';
        return;
      }
      errEl.textContent = '';
      var area = slope * eaves;
      var tiles = Math.ceil(area * COVERAGE * WASTE);
      var batches = Math.max(1, Math.ceil(tiles / 3000));
      outArea.textContent = area.toFixed(1) + ' m²';
      outTiles.textContent = fmt(tiles) + ' tiles';
      outBatches.textContent = batches + (batches === 1 ? ' firing' : ' firings');
      outPrice.textContent = money(tiles * price);
    }
    calc.addEventListener('submit', function (e) { e.preventDefault(); runCalc(); });
    [slopeEl, eavesEl, typeEl].forEach(function (el) {
      el.addEventListener('change', function () { if (outTiles.textContent !== '—') runCalc(); });
    });
  }

  /* ---------- enquiry form (demonstration — nothing is transmitted) ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    var refEl = document.getElementById('conf-ref');
    var summaryEl = document.getElementById('conf-summary');

    function setInvalid(input, bad) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    function validate(input) {
      var v = (input.value || '').trim();
      if (input.id === 'f-email') return setInvalid(input, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      if (input.required) return setInvalid(input, v === '');
      return setInvalid(input, false);
    }
    ['f-name', 'f-email', 'f-type', 'f-message'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('blur', function () { validate(el); });
        el.addEventListener('input', function () { if (el.closest('.field').classList.contains('invalid')) validate(el); });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['f-name', 'f-email', 'f-type', 'f-message'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !validate(el)) ok = false;
      });
      if (!ok) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var now = new Date();
      var ref = 'CC-' + now.getFullYear() + '-' + String(now.getTime()).slice(-5);
      var typeText = document.getElementById('f-type').selectedOptions[0].textContent;
      var sample = document.getElementById('f-sample').checked;
      refEl.textContent = ref;
      summaryEl.textContent = 'Enquiry type: ' + typeText + '.' +
        (sample ? ' You said you can send a sample tile — the wrapping guidance is on this page.' :
                  ' No sample tile yet — photographs and the measurements listed on this page are a good start.');
      confirmation.hidden = false;
      confirmation.setAttribute('tabindex', '-1');
      confirmation.focus();
      form.reset();
    });
  }
})();
