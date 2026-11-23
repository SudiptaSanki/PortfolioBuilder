/* ============================================================
   CIPHER VAULT — site script
   Sound ruling: NO audio anywhere on this site. The stub's
   alert synth was removed, not rebuilt — key management is
   silent work and nothing here teaches through sound.
   The key-rate sheet derives every printed line from the
   printed rule r = 1 − 2·h(q); displayed terms are rounded
   first, so the ledger adds up exactly as printed.
   ============================================================ */
(function () {
  'use strict';

  /* Cross-document view transitions abort noisily in Chromium when a
     navigation supersedes one; the navigation itself always completes.
     Swallow only that specific rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal on scroll (gated; content visible without it) ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  /* ---------- mobile menu: the key-ledger panel ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuPanel = document.getElementById('menuPanel');
  if (menuBtn && menuPanel) {
    var firstLink = menuPanel.querySelector('a');
    function closeMenu() {
      menuPanel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    menuBtn.addEventListener('click', function () {
      var open = menuPanel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuPanel.classList.contains('open')) {
        closeMenu();
        menuBtn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (menuPanel.classList.contains('open') &&
          !menuPanel.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });
  }

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function money(n) { return '£' + fmtInt(n); }
  function f4(n) { return n.toFixed(4); }
  function minus(s) { return String(s).replace(/-/g, '−'); }

  /* ================================================================
     SHEET K-1 — THE KEY-RATE TOOL
     Printed rule: r = 1 − 2·h(q),
       h(q) = −q·log₂(q) − (1−q)·log₂(1−q)
     Displayed h is the sum of the two displayed (rounded) terms,
     so every line follows from the printed numbers.
     ================================================================ */
  var qVal = $('qVal');
  if (qVal) {
    var QMIN = 0.5, QMAX = 15.0, QSTEP = 0.5;
    var qPct = 5.0;
    var sifted = 1180; /* kbit/s — class M-22 default, as printed on its chip */
    var workLines = $('workLines'),
        stateLine = $('linkState'),
        abortNote = $('abortNote'),
        secretRate = $('secretRate'),
        keysRate = $('keysRate'),
        siftVal = $('siftVal'),
        curvePath = $('curvePath'),
        marker = $('qMarker'),
        markerX = $('qMarkerX'),
        markerY = $('qMarkerY');

    function hFull(q) {
      if (q <= 0 || q >= 1) return 0;
      return -q * Math.log2(q) - (1 - q) * Math.log2(1 - q);
    }
    /* draw the r(q) curve once from the printed rule */
    if (curvePath) {
      var d = '';
      for (var q = 0.002; q <= 0.1501; q += 0.001) {
        var r = Math.max(0, 1 - 2 * hFull(q));
        var x = 54 + (q / 0.15) * 568;
        var y = 252 - r * 224;
        d += (d === '' ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      curvePath.setAttribute('d', d);
    }

    function render() {
      var q = qPct / 100;
      var logQ = Math.log2(q), log1Q = Math.log2(1 - q);
      var t1 = Math.round((-q * logQ) * 10000) / 10000;
      var t2 = Math.round((-(1 - q) * log1Q) * 10000) / 10000;
      var h = Math.round((t1 + t2) * 10000) / 10000;
      var rRaw = Math.round((1 - 2 * h) * 10000) / 10000;
      var aborted = rRaw <= 0;
      var r = aborted ? 0 : rRaw;

      qVal.textContent = qPct.toFixed(1) + '%';

      var lines = [];
      lines.push('q = ' + f4(q));
      lines.push('log₂(q) = log₂(' + f4(q) + ') = ' + minus(f4(logQ)));
      lines.push('−q · log₂(q) = −' + f4(q) + ' × ' + minus(f4(logQ)) + ' = ' + f4(t1));
      lines.push('log₂(1 − q) = log₂(' + f4(1 - q) + ') = ' + minus(f4(log1Q)));
      lines.push('−(1 − q) · log₂(1 − q) = −' + f4(1 - q) + ' × ' + minus(f4(log1Q)) + ' = ' + f4(t2));
      lines.push('<span class="hl">h(q) = ' + f4(t1) + ' + ' + f4(t2) + ' = ' + f4(h) + '</span>');
      if (aborted) {
        lines.push('<span class="amb">r = 1 − 2 × ' + f4(h) + ' = ' + minus(f4(rRaw)) + ' → no secret key</span>');
        lines.push('<span class="amb">secret fraction r = 0.0% of sifted bits</span>');
      } else {
        lines.push('<span class="hl">r = 1 − 2 × ' + f4(h) + ' = ' + f4(r) + '</span>');
        lines.push('<span class="amb">secret fraction r = ' + (r * 100).toFixed(1) + '% of sifted bits</span>');
      }
      workLines.innerHTML = lines.join('\n');

      if (aborted) {
        stateLine.innerHTML = 'LINK STATE: <span class="st-off">ABORTED — q at or past the ≈11.0% threshold</span>';
        abortNote.classList.add('show');
      } else {
        stateLine.innerHTML = 'LINK STATE: <span class="st-on">PRODUCING KEY — r = ' + (r * 100).toFixed(1) + '% of sifted bits survive</span>';
        abortNote.classList.remove('show');
      }

      var secretKbit = r * sifted;
      secretRate.textContent = (Math.round(secretKbit * 10) / 10)
        .toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' kbit/s';
      keysRate.textContent = fmtInt((secretKbit * 1000) / 256) + ' keys/s';
      siftVal.textContent = fmtInt(sifted) + ' kbit/s';

      if (marker) {
        var mx = 54 + (q / 0.15) * 568;
        var my = 252 - Math.max(0, 1 - 2 * hFull(q)) * 224;
        marker.setAttribute('cx', mx.toFixed(1));
        marker.setAttribute('cy', my.toFixed(1));
        if (markerX) { markerX.setAttribute('x1', mx.toFixed(1)); markerX.setAttribute('x2', mx.toFixed(1)); }
        if (markerY) { markerY.setAttribute('y1', my.toFixed(1)); markerY.setAttribute('y2', my.toFixed(1)); }
      }

      document.querySelectorAll('.qchip').forEach(function (chip) {
        chip.setAttribute('aria-pressed', parseFloat(chip.getAttribute('data-q')) === qPct ? 'true' : 'false');
      });
    }

    $('qMinus').addEventListener('click', function () {
      qPct = Math.max(QMIN, Math.round((qPct - QSTEP) * 10) / 10); render();
    });
    $('qPlus').addEventListener('click', function () {
      qPct = Math.min(QMAX, Math.round((qPct + QSTEP) * 10) / 10); render();
    });
    document.querySelectorAll('.qchip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        qPct = parseFloat(chip.getAttribute('data-q')); render();
      });
    });
    document.querySelectorAll('.lchip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        sifted = parseFloat(chip.getAttribute('data-sift'));
        document.querySelectorAll('.lchip').forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        render();
      });
    });
    render();
  }

  /* ================================================================
     ESTIMATOR — rates are the ones printed in the fee table.
     ================================================================ */
  var estTotal = $('estTotal');
  if (estTotal) {
    var rows = [];
    document.querySelectorAll('.est-row').forEach(function (row) {
      rows.push({
        rate: parseFloat(row.getAttribute('data-rate')),
        min: parseFloat(row.getAttribute('data-min')),
        max: parseFloat(row.getAttribute('data-max')),
        qty: parseFloat(row.getAttribute('data-qty')),
        qtyEl: row.querySelector('.est-qty'),
        lineEl: row.querySelector('.est-line'),
        row: row
      });
    });
    function renderEst() {
      var total = 0;
      rows.forEach(function (r) {
        var line = r.rate * r.qty;
        total += line;
        r.qtyEl.textContent = r.qty;
        r.lineEl.textContent = money(line);
      });
      estTotal.textContent = money(total);
    }
    rows.forEach(function (r) {
      r.row.querySelector('.est-minus').addEventListener('click', function () {
        r.qty = Math.max(r.min, r.qty - 1); renderEst();
      });
      r.row.querySelector('.est-plus').addEventListener('click', function () {
        r.qty = Math.min(r.max, r.qty + 1); renderEst();
      });
    });
    renderEst();
  }

  /* ================================================================
     CONTACT FORM — demonstration only; nothing is transmitted.
     ================================================================ */
  var form = $('enquiryForm');
  if (form) {
    var confirm = $('formConfirm');
    var fields = {
      name: { el: $('f-name'), ok: function (v) { return v.trim().length >= 2; } },
      org: { el: $('f-org'), ok: function (v) { return v.trim().length >= 2; } },
      email: { el: $('f-email'), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      type: { el: $('f-type'), ok: function (v) { return v !== ''; } },
      msg: { el: $('f-msg'), ok: function (v) { return v.trim().length >= 10; } }
    };
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener('input', function () {
        fields[k].el.closest('.f-row').classList.remove('invalid');
      });
      fields[k].el.addEventListener('change', function () {
        fields[k].el.closest('.f-row').classList.remove('invalid');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var good = f.ok(f.el.value);
        f.el.closest('.f-row').classList.toggle('invalid', !good);
        if (!good && !firstBad) firstBad = f.el;
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = 'CV-2026-' + Math.floor(1000 + Math.random() * 9000);
      $('confRef').textContent = 'Reference: ' + ref;
      var typeSel = fields.type.el;
      $('confEcho').textContent = 'Enquiry type: ' + typeSel.options[typeSel.selectedIndex].text +
        ' · Organisation: ' + fields.org.el.value.trim();
      form.style.display = 'none';
      confirm.classList.add('show');
      confirm.setAttribute('tabindex', '-1');
      confirm.focus();
    });
  }
})();
