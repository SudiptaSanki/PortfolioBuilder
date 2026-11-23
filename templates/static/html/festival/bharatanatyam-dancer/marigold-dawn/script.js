/* Marigold Dawn — programme masthead menu, margam builder, booking form.
   Vanilla JS, no libraries. No audio anywhere: this trade is dance. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only that exact artefact — navigation itself always completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu: the programme panel ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (btn && panel) {
    var open = false;
    function setOpen(next, focusFirst) {
      open = next;
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open && focusFirst) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector('a');
            if (first) first.focus();
          });
        });
      }
    }
    btn.addEventListener('click', function () { setOpen(!open, true); });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { setOpen(false, false); btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && open) setOpen(false, false);
    });
  }

  /* ---------- reveal on scroll (opacity/rise, reduced-motion safe) ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- margam programme builder (index) ---------- */
  var itemsBox = document.getElementById('margamItems');
  if (itemsBox) {
    var BANDS = [
      { max: 45, label: 'Up to 45 min', fee: 40000 },
      { max: 75, label: '46–75 min', fee: 55000 },
      { max: 105, label: '76–105 min', fee: 75000 },
      { max: 135, label: '106–135 min', fee: 95000 },
      { max: Infinity, label: 'Over 135 min', fee: null }
    ];
    var ORCH_FEE = 60000;
    var INTERVAL_AT = 75, INTERVAL_MINS = 15;
    var checks = Array.prototype.slice.call(itemsBox.querySelectorAll('input[type="checkbox"]'));
    var orch = document.getElementById('optOrch');
    var el = function (id) { return document.getElementById(id); };
    var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };

    function compute() {
      var chosen = checks.filter(function (c) { return c.checked; });
      var perf = chosen.reduce(function (s, c) { return s + (+c.getAttribute('data-mins') || 0); }, 0);
      var interval = perf > INTERVAL_AT ? INTERVAL_MINS : 0;
      var band = BANDS.filter(function (b) { return perf <= b.max; })[0];
      var orchFee = orch && orch.checked ? ORCH_FEE : 0;
      checks.forEach(function (c) {
        var row = c.closest('.item');
        if (row) row.classList.toggle('sel', c.checked);
      });
      el('sumCount').textContent = chosen.length + (chosen.length === 1 ? ' item' : ' items');
      el('sumPerf').textContent = perf + ' min';
      el('sumInterval').textContent = interval ? interval + ' min' : 'None';
      el('sumTotal').textContent = (perf + interval) + ' min';
      el('sumBand').textContent = chosen.length ? band.label : '—';
      el('sumOrch').textContent = orchFee ? '+ ' + inr(orchFee) : 'Not included';
      el('sumFee').textContent = !chosen.length ? '—'
        : (band.fee === null ? 'On request' : inr(band.fee + orchFee));
      var list = el('sumOrder');
      list.innerHTML = '';
      chosen.forEach(function (c) {
        var li = document.createElement('li');
        li.textContent = c.getAttribute('data-name') + ' ';
        var sp = document.createElement('span');
        sp.textContent = '· ' + c.getAttribute('data-mins') + ' min';
        li.appendChild(sp);
        list.appendChild(li);
      });
      if (!chosen.length) {
        var li2 = document.createElement('li');
        li2.textContent = 'Tick items on the left to build the running order.';
        list.appendChild(li2);
      }
    }
    checks.forEach(function (c) { c.addEventListener('change', compute); });
    if (orch) orch.addEventListener('change', compute);
    compute();

    var printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
  }

  /* ---------- booking form (contact) ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    var fields = {
      name: { input: document.getElementById('fName'), ok: function (v) { return v.trim().length >= 2; } },
      email: { input: document.getElementById('fEmail'), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      type: { input: document.getElementById('fType'), ok: function (v) { return v !== ''; } },
      message: { input: document.getElementById('fMsg'), ok: function (v) { return v.trim().length >= 10; } }
    };
    Object.keys(fields).forEach(function (k) {
      var f = fields[k];
      if (f.input) f.input.addEventListener('input', function () {
        var wrap = f.input.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        if (!f.input) return;
        var valid = f.ok(f.input.value || '');
        var wrap = f.input.closest('.field');
        if (wrap) wrap.classList.toggle('invalid', !valid);
        if (!valid && !firstBad) firstBad = f.input;
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'AN-2026-' + (100 + Math.floor(Math.random() * 900));
      var typeText = fields.type.input.options[fields.type.input.selectedIndex].text;
      var dateVal = document.getElementById('fDate').value;
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmLine').textContent =
        typeText + (dateVal ? ' · proposed date ' + dateVal : '') + ' · for ' + fields.name.input.value.trim();
      var confirm = document.getElementById('confirm');
      confirm.classList.add('show');
      confirm.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      var head = confirm.querySelector('h3');
      if (head) { head.setAttribute('tabindex', '-1'); head.focus(); }
    });
    var again = document.getElementById('againBtn');
    if (again) again.addEventListener('click', function () {
      document.getElementById('confirm').classList.remove('show');
      form.reset();
      fields.name.input.focus();
    });
  }
})();
