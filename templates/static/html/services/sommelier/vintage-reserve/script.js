/* Vintage Reserve — the cellar book's working parts.
   No sound anywhere: the stub's glass-clink failed the programme's
   sound need-test (a cellar director's profession is taste and smell,
   not sound) and was deleted, not rebuilt. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View transitions abort noisily when a navigation interrupts one;
     swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- mobile index (nav) ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (btn && panel) {
    function closePanel() {
      panel.classList.remove('open');
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closePanel();
        btn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        closePanel();
      }
    });
  }

  /* ---------- allocation stamps ----------
     Position-check on scroll (an element hidden by its own reveal
     state can report zero intersection with itself, so observers
     are not trusted here). Reduced motion: CSS keeps stamps
     visible; the class is added anyway for state consistency. */
  var stamps = Array.prototype.slice.call(document.querySelectorAll('[data-stamp]'));
  if (stamps.length) {
    var ticking = false;
    function checkStamps() {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      stamps = stamps.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh - 12 && r.bottom > 0) {
          el.classList.add('stamped');
          return false;
        }
        return true;
      });
      if (!stamps.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(checkStamps); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    checkStamps();
  }

  /* ---------- Cellar Allocation Planner (index only) ----------
     Every number is read from the printed ledger rows on this page
     (data attributes on the planner rows mirror the tables above);
     nothing is priced from a hidden constant. */
  var planner = document.getElementById('planner');
  if (planner) {
    var rows = Array.prototype.slice.call(planner.querySelectorAll('.plan-row[data-bin]'));
    var wines = rows.map(function (row) {
      return {
        bin: row.getAttribute('data-bin'),
        name: row.getAttribute('data-name'),
        vintage: row.getAttribute('data-vintage'),
        price: parseInt(row.getAttribute('data-price'), 10),
        avail: parseInt(row.getAttribute('data-avail'), 10),
        from: parseInt(row.getAttribute('data-from'), 10),
        peakFrom: parseInt(row.getAttribute('data-peak-from'), 10),
        peakTo: parseInt(row.getAttribute('data-peak-to'), 10),
        by: parseInt(row.getAttribute('data-by'), 10),
        cases: 0,
        valEl: row.querySelector('.val b'),
        minus: row.querySelector('[data-step="-1"]'),
        plus: row.querySelector('[data-step="1"]')
      };
    });
    var year = 2030;
    var YEAR_MIN = 2026, YEAR_MAX = 2040;
    var yearVal = document.getElementById('yearVal');
    var yearMinus = document.getElementById('yearMinus');
    var yearPlus = document.getElementById('yearPlus');
    var out = document.getElementById('planOut');

    function money(n) { return '€' + n.toLocaleString('en-IE'); }

    function altInWindow(y, notBin) {
      for (var i = 0; i < wines.length; i++) {
        var w = wines[i];
        if (w.bin !== notBin && w.avail > 0 && y >= w.from && y <= w.by) {
          return w.name + ' ' + w.vintage + ' (Bin ' + w.bin + ')';
        }
      }
      return null;
    }
    function altAtPeak(y, notBin) {
      for (var i = 0; i < wines.length; i++) {
        var w = wines[i];
        if (w.bin !== notBin && w.avail > 0 && y >= w.peakFrom && y <= w.peakTo) {
          return w.name + ' ' + w.vintage + ' (Bin ' + w.bin + ')';
        }
      }
      return altInWindow(y, notBin);
    }

    function verdict(w, y) {
      if (y < w.from) {
        var alt = altInWindow(y, w.bin);
        return { cls: 'warn', head: 'Not yet.',
          body: 'This bin\u2019s window opens in <strong>' + w.from + '</strong> and peaks ' +
            w.peakFrom + '\u2013' + w.peakTo + '. The book will lay it down for you' +
            (alt ? ', or drink <strong>' + alt + '</strong> in ' + y + ' instead.' : '.') };
      }
      if (y < w.peakFrom) {
        return { cls: 'warn', head: 'Drinking, still rising.',
          body: 'Honest wine in ' + y + ', better in its peak, <strong>' + w.peakFrom + '\u2013' + w.peakTo + '</strong>.' };
      }
      if (y <= w.peakTo) {
        return { cls: 'good', head: 'At its peak.',
          body: 'This is the year this bin was kept for.' };
      }
      if (y <= w.by) {
        return { cls: 'warn', head: 'Past its peak, still sound.',
          body: 'Drink it in ' + y + ' and enjoy it \u2014 do not cellar it any further. The window closes in <strong>' + w.by + '</strong>.' };
      }
      var alt2 = altAtPeak(y, w.bin);
      return { cls: 'warn', head: 'Too late.',
        body: 'The window closed in <strong>' + w.by + '</strong>; the book will not sell this bin for ' + y + '.' +
          (alt2 ? ' Drink <strong>' + alt2 + '</strong> instead.' : ' Nothing in the current book covers ' + y + ' \u2014 write to the cellar.') };
    }

    function render() {
      yearVal.textContent = year;
      yearMinus.disabled = year <= YEAR_MIN;
      yearPlus.disabled = year >= YEAR_MAX;
      var totalCases = 0, total = 0, lines = [];
      wines.forEach(function (w) {
        if (w.valEl) w.valEl.textContent = w.cases;
        if (w.minus) w.minus.disabled = w.cases <= 0;
        if (w.plus) w.plus.disabled = w.cases >= w.avail;
        if (w.cases > 0) {
          totalCases += w.cases;
          total += w.cases * w.price;
          var v = verdict(w, year);
          lines.push('<div class="verdict"><span class="vw">' + w.name + ' ' + w.vintage +
            ' \u00d7 ' + w.cases + ' \u2014 ' + v.head + '</span> ' +
            '<span class="vt">' + v.body + '</span></div>');
        }
      });
      var allocated = wines.filter(function (w) { return w.avail === 0; });
      var html = '';
      if (totalCases === 0) {
        html = '<p class="blank">The page is blank. Add a case above, then set the year you mean to drink it \u2014 the book will judge every bin against its printed window.</p>';
      } else {
        html = lines.join('');
        var deposit = Math.round(total * 0.2 * 100) / 100;
        html += '<div class="plan-total"><div><span class="amt">' + money(total) + '</span>' +
          '<div class="dep">' + totalCases + (totalCases === 1 ? ' case' : ' cases') + ' \u00b7 ' + (totalCases * 12) +
          ' bottles, at the printed case prices.</div></div>' +
          '<div class="dep">' + money(deposit) + ' (20%) confirms the allocation;<br>the balance is due at collection.</div></div>';
      }
      if (allocated.length) {
        html += '<p class="small" style="margin-top:12px">Bin ' + allocated.map(function (w) { return w.bin; }).join(', ') +
          ' is allocated in full \u2014 no cases can be added. The book keeps a waitlist; write to the cellar.</p>';
      }
      out.innerHTML = html;
    }

    wines.forEach(function (w) {
      if (w.minus) w.minus.addEventListener('click', function () { if (w.cases > 0) { w.cases--; render(); } });
      if (w.plus) w.plus.addEventListener('click', function () { if (w.cases < w.avail) { w.cases++; render(); } });
    });
    if (yearMinus) yearMinus.addEventListener('click', function () { if (year > YEAR_MIN) { year--; render(); } });
    if (yearPlus) yearPlus.addEventListener('click', function () { if (year < YEAR_MAX) { year++; render(); } });
    render();
  }

  /* ---------- contact form (contact only) ---------- */
  var form = document.getElementById('cellarForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var ref = 'VR-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      var confirm = document.getElementById('confirm');
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmName').textContent = name ? name.split(' ')[0] : 'Thank you';
      form.hidden = true;
      confirm.hidden = false;
      confirm.setAttribute('tabindex', '-1');
      confirm.focus();
    });
  }
})();
