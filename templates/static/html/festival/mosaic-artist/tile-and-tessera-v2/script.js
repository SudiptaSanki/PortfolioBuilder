/* Tile and Tessera — shared script.
   Jobs: view-transition abort guard, the tile-grid mobile menu,
   the Mosaic Estimator (reads the rate tables printed on the page),
   and the contact form's in-page confirmation. No sound, ever. */
(function () {
  'use strict';

  /* View transitions abort noisily when a second navigation interrupts
     the first — swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu: a panel of four big tiles ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobile-panel');
  if (btn && panel) {
    var open = false;
    function setOpen(next, focusFirst) {
      open = next;
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
      if (open && focusFirst) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      }
      if (!open && focusFirst) btn.focus();
    }
    btn.addEventListener('click', function () { setOpen(!open, true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false, true);
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false, false);
    });
  }

  /* ---------- Mosaic Estimator ----------
     Every rate is parsed from the tables printed on the page itself
     (#material-rates and #size-rates), so the figures a visitor reads
     are the figures the tool uses. */
  var form = document.getElementById('estimator-form');
  if (form) {
    function num(text) { return parseFloat(String(text).replace(/[^0-9.]/g, '')); }
    function readRates() {
      var materials = {};
      document.querySelectorAll('#material-rates tbody tr').forEach(function (tr) {
        var cells = tr.querySelectorAll('td');
        materials[tr.getAttribute('data-material')] = {
          price: num(cells[1].textContent),
          kg: num(cells[2].textContent),
          days: num(cells[3].textContent)
        };
      });
      var sizes = {};
      document.querySelectorAll('#size-rates tbody tr').forEach(function (tr) {
        var cells = tr.querySelectorAll('td');
        sizes[tr.getAttribute('data-size')] = num(cells[1].textContent);
      });
      return { materials: materials, sizes: sizes };
    }
    var rates = readRates();
    var areaEl = document.getElementById('est-area');
    var matEl = document.getElementById('est-material');
    var sizeEl = document.getElementById('est-size');
    var outCount = document.getElementById('out-count');
    var outWeight = document.getElementById('out-weight');
    var outDays = document.getElementById('out-days');
    var outPrice = document.getElementById('out-price');
    var note = document.getElementById('fest-note');
    var twoLine = document.getElementById('two-maker');
    var twoDays = document.getElementById('two-days');
    var twoPrice = document.getElementById('two-price');
    var FEST_LIMIT = 9; /* m² one maker can set before the festa deadline, printed on the page */

    function fmtInt(n) { return n.toLocaleString('en-GB'); }
    function fmtEUR(n) { return '€' + n.toLocaleString('en-GB'); }

    function compute() {
      var area = parseFloat(areaEl.value);
      if (!area || area <= 0) area = 0;
      var m = rates.materials[matEl.value];
      var per = rates.sizes[sizeEl.value];
      if (!m || !per) return;
      var count = Math.round(area * per);
      var weight = Math.round(area * m.kg);
      var days = Math.ceil(area * m.days);
      var price = Math.round(area * m.price);
      outCount.textContent = fmtInt(count);
      outWeight.textContent = fmtInt(weight) + ' kg';
      outDays.textContent = days + (days === 1 ? ' day' : ' days');
      outPrice.textContent = fmtEUR(price);
      if (area > FEST_LIMIT) {
        note.hidden = false;
        twoLine.hidden = false;
        twoDays.textContent = Math.ceil(days / 2) + ' days';
        twoPrice.textContent = fmtEUR(Math.round(price * 1.15));
      } else {
        note.hidden = true;
        twoLine.hidden = true;
      }
    }
    form.addEventListener('input', compute);
    form.addEventListener('change', compute);
    compute();
  }

  /* ---------- contact form: in-page confirmation with reference ---------- */
  var cform = document.getElementById('contact-form');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var ref = 'TT-2026-' + Math.floor(1000 + Math.random() * 9000);
      var box = document.getElementById('confirm');
      var refEl = document.getElementById('confirm-ref');
      if (refEl) refEl.textContent = ref;
      cform.hidden = true;
      if (box) {
        box.hidden = false;
        box.setAttribute('tabindex', '-1');
        box.focus();
      }
    });
  }
})();
