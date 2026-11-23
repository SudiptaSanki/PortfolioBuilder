/* ============================================================
   BEAUMONT FLIGHT TEST — sonic-boom
   Sound ruling: NONE. A boom is what this practice works to
   soften; nothing on this site teaches through audio. The
   stub's hover-triggered jet synth was removed, not rebuilt.
   The site is silent by design; the ruling is printed in the
   footer and in CREDITS.md.
   ============================================================ */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts the first; Chrome surfaces that abort as
     an unhandled rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (n) { return n.toLocaleString('en-US'); };
  var money = function (n) { return '$' + fmt(n); };

  /* ---------- mobile card-index panel ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('cardPanel');
  if (btn && panel) {
    var closePanel = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('.sheet a');
          if (first) first.focus({ preventScroll: true });
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target.closest('a')) closePanel();
    });
  }

  /* ---------- reveal (opacity only, JS-gated) ---------- */
  var revs = document.querySelectorAll('.rev');
  if (revs.length && !reduced && 'IntersectionObserver' in window) {
    revs.forEach(function (el) { el.classList.add('rev-pre'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.remove('rev-pre');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revs.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     THE MACH & CONE SHEET
     Reads T from the printed Table T1 in the DOM, γ and R from
     the printed relations. Tool and page cannot disagree.
     a = √(γRT) · M = V/a · μ = asin(1/M) for M > 1.
     ========================================================== */
  var isaTable = document.getElementById('isaTable');
  var chipBox = document.getElementById('bandChips');
  if (isaTable && chipBox) {
    var GAMMA = 1.4, RGAS = 287.05, KT = 0.514444;
    var rows = Array.prototype.slice.call(isaTable.querySelectorAll('tbody tr'));
    var bands = rows.map(function (tr) {
      return { tr: tr, t: parseFloat(tr.getAttribute('data-t')), band: tr.getAttribute('data-band') };
    });
    var selIdx = rows.findIndex(function (tr) { return tr.classList.contains('sel'); });
    if (selIdx < 0) selIdx = bands.length - 1;
    var tas = 1140, TAS_MIN = 250, TAS_MAX = 1500;

    var chips = bands.map(function (b, i) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip';
      c.setAttribute('aria-pressed', i === selIdx ? 'true' : 'false');
      c.innerHTML = b.band + '<small>T ' + b.t.toFixed(2) + ' K</small>';
      c.addEventListener('click', function () { selectBand(i); });
      chipBox.appendChild(c);
      return c;
    });

    var tasVal = document.getElementById('tasVal');
    var roState = document.getElementById('roState');
    var roA = document.getElementById('roA'), roAkt = document.getElementById('roAkt');
    var roV = document.getElementById('roV'), roM = document.getElementById('roM'), roMu = document.getElementById('roMu');
    var workings = document.getElementById('workings');
    var svg = document.getElementById('coneSvg');
    var needle = document.getElementById('coneNeedle');

    function selectBand(i) {
      selIdx = i;
      chips.forEach(function (c, j) { c.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      rows.forEach(function (tr, j) { tr.classList.toggle('sel', j === i); });
      compute();
    }

    document.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        tas += parseInt(b.getAttribute('data-step'), 10);
        if (tas < TAS_MIN) tas = TAS_MIN;
        if (tas > TAS_MAX) tas = TAS_MAX;
        compute();
      });
    });

    function compute() {
      var T = bands[selIdx].t;
      var a = Math.sqrt(GAMMA * RGAS * T);
      var V = tas * KT;
      var M = V / a;
      tasVal.textContent = fmt(tas);
      roA.textContent = a.toFixed(1);
      roAkt.textContent = String(Math.round(a / KT));
      roV.textContent = V.toFixed(1);
      roM.textContent = M.toFixed(3);
      var lines = [];
      lines.push('a = √(1.4 × 287.05 × ' + T.toFixed(2) + ') = √' + fmt(Math.round(GAMMA * RGAS * T)) + ' = <span class="hl">' + a.toFixed(1) + ' m/s</span>');
      lines.push('V = ' + fmt(tas) + ' kt × 0.514444 = ' + V.toFixed(1) + ' m/s');
      lines.push('M = ' + V.toFixed(1) + ' ÷ ' + a.toFixed(1) + ' = <span class="hl">' + M.toFixed(3) + '</span>');
      if (M > 1) {
        var mu = Math.asin(1 / M) * 180 / Math.PI;
        roMu.textContent = mu.toFixed(1) + '°';
        roState.textContent = 'Supersonic — cone formed';
        roState.classList.remove('sub');
        lines.push('μ = asin(1 ÷ ' + M.toFixed(3) + ') = asin(' + (1 / M).toFixed(4) + ') = <span class="hl">' + mu.toFixed(1) + '°</span>');
        var rad = mu * Math.PI / 180;
        needle.setAttribute('x2', (30 + 82 * Math.cos(rad)).toFixed(1));
        needle.setAttribute('y2', (108 - 82 * Math.sin(rad)).toFixed(1));
        needle.style.display = '';
        svg.setAttribute('data-mu', mu.toFixed(1));
      } else {
        roMu.textContent = '—';
        roState.textContent = 'Subsonic — no cone';
        roState.classList.add('sub');
        lines.push('M &lt; 1 — the aircraft is inside its own sound field. <span class="hl">There is no cone and no boom carpet</span>; this sheet does not invent one.');
        needle.style.display = 'none';
        svg.setAttribute('data-mu', 'none');
      }
      workings.innerHTML = lines.join('<br>');
    }
    compute();
  }

  /* ==========================================================
     SORTIE ESTIMATOR — rates parsed from the printed Table F1.
     ========================================================== */
  var feeTable = document.getElementById('feeTable');
  var estBox = document.getElementById('estimator');
  if (feeTable && estBox) {
    var rates = Array.prototype.map.call(
      feeTable.querySelectorAll('tbody tr'),
      function (tr) { return parseInt(tr.getAttribute('data-rate'), 10); }
    ); /* [support, instruction, chase, planning] */
    var counts = { support: 5, instr: 2, chase: 3 };
    var planOn = true;
    var planToggle = document.getElementById('planToggle');

    function line(id, n) { document.getElementById(id).textContent = money(n); }
    function renderEst() {
      var ls = counts.support * rates[0];
      var li = counts.instr * rates[1];
      var lc = counts.chase * rates[2];
      var lp = planOn ? rates[3] : 0;
      document.getElementById('c-support').textContent = counts.support;
      document.getElementById('c-instr').textContent = counts.instr;
      document.getElementById('c-chase').textContent = counts.chase;
      line('l-support', ls); line('l-instr', li); line('l-chase', lc); line('l-plan', lp);
      var total = ls + li + lc + lp;
      document.getElementById('estTotal').textContent = money(total);
      var parts = [
        counts.support + ' × ' + money(rates[0]) + ' = ' + money(ls),
        counts.instr + ' × ' + money(rates[1]) + ' = ' + money(li),
        counts.chase + ' × ' + money(rates[2]) + ' = ' + money(lc)
      ];
      if (planOn) parts.push('planning ' + money(rates[3]));
      document.getElementById('estWork').textContent = parts.join(' · ') + ' → ' + money(total);
      if (planToggle) {
        planToggle.setAttribute('aria-pressed', planOn ? 'true' : 'false');
        planToggle.textContent = planOn ? 'Included' : 'Excluded';
      }
    }
    estBox.querySelectorAll('[data-est]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-est');
        counts[k] += parseInt(b.getAttribute('data-d'), 10);
        if (counts[k] < 0) counts[k] = 0;
        if (counts[k] > 40) counts[k] = 40;
        renderEst();
      });
    });
    if (planToggle) {
      planToggle.addEventListener('click', function () { planOn = !planOn; renderEst(); });
    }
    renderEst();
  }

  /* ==========================================================
     ENQUIRY FORM — demonstration only; nothing is transmitted.
     ========================================================== */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirm = document.getElementById('confirm');
    function fieldOf(input) { return input.closest('.field'); }
    function validate(input) {
      var ok = true;
      var v = (input.value || '').trim();
      if (input.hasAttribute('required') && !v) ok = false;
      if (ok && input.type === 'email' && v) {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      }
      var f = fieldOf(input);
      if (f) {
        f.classList.toggle('invalid', !ok);
        input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      }
      return ok;
    }
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('input', function () { validate(input); });
      input.addEventListener('blur', function () { if (input.value) validate(input); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = true, firstBad = null;
      form.querySelectorAll('input, select, textarea').forEach(function (input) {
        if (!validate(input)) { allOk = false; if (!firstBad) firstBad = input; }
      });
      if (!firstBad && !allOk) firstBad = null;
      if (!allOk) {
        if (firstBad) firstBad.focus({ preventScroll: false });
        return;
      }
      var name = document.getElementById('f-name').value.trim();
      var org = document.getElementById('f-org').value.trim();
      var ref = 'BFT-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmEcho').textContent =
        'Filed for ' + name + (org ? ' · ' + org : '') + '. Expect a reply within two working days — at programme-class level until we are under agreement.';
      form.hidden = true;
      confirm.hidden = false;
      confirm.setAttribute('tabindex', '-1');
      confirm.focus({ preventScroll: false });
    });
  }
})();
