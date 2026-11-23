/* ============================================================
   Bakker Orbital Structures — orbital-truss
   No audio is used anywhere on this site. The stub's
   hover-triggered airlock pressurisation sound failed the
   program's sound need-test (structural engineering is not a
   sound profession, and hover audio is a deal-breaker) — it was
   removed, not rebuilt. The footer states the ruling.
   ============================================================ */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces an unhandled InvalidStateError
     rejection; the navigation itself always completes. Swallow only
     that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal on scroll (JS-gated; content visible without JS
     and under reduced motion) ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  }

  /* ---------- drawing-index panel (mobile menu) ---------- */
  var panel = document.getElementById('indexPanel');
  var menuBtn = document.querySelector('.menu-btn');
  var scrim = document.getElementById('scrim');
  if (panel && menuBtn && scrim) {
    var closeBtn = panel.querySelector('.panel-close');
    function openMenu() {
      panel.classList.add('open');
      scrim.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      /* focus AFTER .open is applied (panel is visibility:hidden until
         then; a synchronous focus() would be a silent no-op) */
      requestAnimationFrame(function () { if (closeBtn) closeBtn.focus(); });
    }
    function closeMenu() {
      panel.classList.remove('open');
      scrim.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      menuBtn.focus();
    }
    menuBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
    });
  }

  /* ---------- helpers ---------- */
  function fmt(n, d) {
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function money(n) { return '€' + n.toLocaleString('en-GB'); }

  /* ============================================================
     THE MODULE SIZER — Sheet BS-101
     Printed method:
       1  V        = π r² L
       2  t        = p · r / σ_allow
       3  A_shell  = 2πrL + 2πr²   (barrel + end-closure allowance)
       4  t_design = 1.5 × t       (preliminary factor)
       5  m        = A_shell × t_design × ρ
     ============================================================ */
  var sizer = document.getElementById('sizer');
  if (sizer) {
    var state = { sigma: 190, rho: 2840, alloy: 'Al 2219-T87', radius: 2.0, length: 6.0, pressure: 101 };
    var LIMITS = { radius: [1.0, 3.0], length: [2.0, 12.0], pressure: [50, 130] };

    var els = {
      vBig: document.getElementById('vBig'),
      vSub: document.getElementById('vSub'),
      mBig: document.getElementById('mBig'),
      mSub: document.getElementById('mSub'),
      work: document.getElementById('workLines'),
      alloyName: document.getElementById('alloyName'),
      radiusVal: document.getElementById('radiusVal'),
      lengthVal: document.getElementById('lengthVal'),
      pressureVal: document.getElementById('pressureVal'),
      svgBody: document.getElementById('svgBody'),
      svgEndL: document.getElementById('svgEndL'),
      svgEndR: document.getElementById('svgEndR'),
      svgDimL: document.getElementById('svgDimL'),
      svgDimLineL: document.getElementById('svgDimLineL'),
      svgTickL1: document.getElementById('svgTickL1'),
      svgTickL2: document.getElementById('svgTickL2'),
      svgDimD: document.getElementById('svgDimD'),
      svgT: document.getElementById('svgT')
    };

    function compute() {
      var r = state.radius, L = state.length;
      var p = state.pressure * 1000;          /* Pa */
      var sig = state.sigma * 1e6;            /* Pa */
      var V = Math.PI * r * r * L;
      var t = p * r / sig;                    /* m */
      var A = 2 * Math.PI * r * L + 2 * Math.PI * r * r;
      var td = 1.5 * t;
      var m = A * td * state.rho;
      return { V: V, t: t, A: A, td: td, m: m };
    }

    function draw(res) {
      var r = state.radius, L = state.length;
      var w = 90 + L * 24, h = 56 + r * 36;
      var x0 = (640 - w) / 2, y0 = 160 - h / 2;
      els.svgBody.setAttribute('x', x0); els.svgBody.setAttribute('y', y0);
      els.svgBody.setAttribute('width', w); els.svgBody.setAttribute('height', h);
      els.svgEndL.setAttribute('cx', x0); els.svgEndL.setAttribute('cy', 160);
      els.svgEndL.setAttribute('ry', h / 2);
      els.svgEndR.setAttribute('cx', x0 + w); els.svgEndR.setAttribute('cy', 160);
      els.svgEndR.setAttribute('ry', h / 2);
      var dy = 160 + h / 2 + 36;
      els.svgDimLineL.setAttribute('x1', x0); els.svgDimLineL.setAttribute('x2', x0 + w);
      els.svgDimLineL.setAttribute('y1', dy); els.svgDimLineL.setAttribute('y2', dy);
      els.svgTickL1.setAttribute('x1', x0); els.svgTickL1.setAttribute('x2', x0);
      els.svgTickL1.setAttribute('y1', dy - 6); els.svgTickL1.setAttribute('y2', dy + 6);
      els.svgTickL2.setAttribute('x1', x0 + w); els.svgTickL2.setAttribute('x2', x0 + w);
      els.svgTickL2.setAttribute('y1', dy - 6); els.svgTickL2.setAttribute('y2', dy + 6);
      els.svgDimL.setAttribute('x', 320); els.svgDimL.setAttribute('y', dy + 22);
      els.svgDimL.textContent = 'L = ' + fmt(L, 1) + ' m';
      els.svgDimD.textContent = 'Ø ' + fmt(2 * r, 1) + ' m';
      els.svgDimD.setAttribute('x', Math.max(56, x0 - 44));
      els.svgT.textContent = 't design = ' + fmt(res.td * 1000, 2) + ' mm · p = ' + state.pressure + ' kPa';
    }

    function render() {
      var res = compute();
      els.vBig.textContent = fmt(res.V, 1) + ' m³';
      els.vSub.textContent = 'Shell area A = ' + fmt(res.A, 1) + ' m² of plate';
      els.mBig.textContent = fmt(res.m, 0) + ' kg';
      els.mSub.textContent = 'Hoop t = ' + fmt(res.t * 1000, 2) + ' mm → design t = ' + fmt(res.td * 1000, 2) + ' mm (×1.5)';
      els.alloyName.textContent = state.alloy + ' — σ_allow ' + state.sigma + ' MPa · ρ ' + fmt(state.rho, 0) + ' kg/m³';
      els.radiusVal.textContent = fmt(state.radius, 2) + ' m';
      els.lengthVal.textContent = fmt(state.length, 1) + ' m';
      els.pressureVal.textContent = state.pressure + ' kPa';
      els.work.textContent =
        'V = π × ' + fmt(state.radius, 2) + '² × ' + fmt(state.length, 1) + ' = ' + fmt(res.V, 1) + ' m³\n' +
        't = ' + fmt(state.pressure * 1000, 0) + ' × ' + fmt(state.radius, 2) + ' ÷ ' + fmt(state.sigma * 1e6, 0) + ' = ' + fmt(res.t * 1000, 2) + ' mm\n' +
        'A = 2π × ' + fmt(state.radius, 2) + ' × ' + fmt(state.length, 1) + ' + 2π × ' + fmt(state.radius, 2) + '² = ' + fmt(res.A, 1) + ' m²\n' +
        't_design = 1.5 × ' + fmt(res.t * 1000, 2) + ' mm = ' + fmt(res.td * 1000, 2) + ' mm\n' +
        'm = ' + fmt(res.A, 1) + ' m² × ' + (res.td).toFixed(5) + ' m × ' + fmt(state.rho, 0) + ' kg/m³ = ' + fmt(res.m, 0) + ' kg';
      sizer.querySelectorAll('#alloyTable tbody tr').forEach(function (tr) {
        tr.setAttribute('data-active', tr.getAttribute('data-alloy') === state.alloy ? 'true' : 'false');
      });
      draw(res);
    }

    sizer.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        sizer.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state.sigma = parseFloat(chip.getAttribute('data-sigma'));
        state.rho = parseFloat(chip.getAttribute('data-rho'));
        state.alloy = chip.getAttribute('data-alloy');
        render();
      });
    });
    sizer.querySelectorAll('[data-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-step').split(':');
        var key = parts[0], delta = parseFloat(parts[1]);
        var lim = LIMITS[key];
        state[key] = Math.round((state[key] + delta) * 100) / 100;
        if (state[key] < lim[0]) state[key] = lim[0];
        if (state[key] > lim[1]) state[key] = lim[1];
        render();
      });
    });
    render();
  }

  /* ============================================================
     STUDY ESTIMATOR — printed rates
       sizing   €1,650 / day     analysis  €1,250 / day
       review   €900 / day       report    €3,600 fixed
     ============================================================ */
  var est = document.getElementById('estimator');
  if (est) {
    var RATES = { sizing: 1650, analysis: 1250, review: 900 };
    var days = { sizing: 6, analysis: 4, review: 2 };
    var FIXED = 3600;
    function renderEst() {
      var total = FIXED;
      Object.keys(RATES).forEach(function (k) {
        var amt = days[k] * RATES[k];
        total += amt;
        document.getElementById('lt-' + k).textContent =
          days[k] + (days[k] === 1 ? ' day' : ' days') + ' × ' + money(RATES[k]);
        document.getElementById('amt-' + k).textContent = money(amt);
      });
      document.getElementById('estTotal').textContent = money(total);
    }
    est.querySelectorAll('[data-est]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-est').split(':');
        var k = parts[0], d = parseInt(parts[1], 10);
        days[k] = Math.max(0, Math.min(30, days[k] + d));
        renderEst();
      });
    });
    renderEst();
  }

  /* ============================================================
     ENQUIRY FORM — demonstration form: validates and confirms
     in-page with a generated reference; transmits nothing.
     ============================================================ */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var conf = document.getElementById('confirmation');
    function setInvalid(input, bad) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    function validate() {
      var ok = true;
      var name = form.querySelector('#f-name');
      var email = form.querySelector('#f-email');
      var type = form.querySelector('#f-type');
      var msg = form.querySelector('#f-message');
      ok = setInvalid(name, name.value.trim().length < 2) && ok;
      ok = setInvalid(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = setInvalid(type, type.value === '') && ok;
      ok = setInvalid(msg, msg.value.trim().length < 10) && ok;
      return ok;
    }
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('input', function () { setInvalid(input, false); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'BS-ENQ-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confName').textContent = form.querySelector('#f-name').value.trim();
      form.style.display = 'none';
      conf.classList.add('show');
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
  }
})();
