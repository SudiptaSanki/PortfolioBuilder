/* HOLO MESH — shared behaviour: chart-drawer mobile menu,
   scroll reveals (motion-safe, never gating content), enquiry form.
   No audio anywhere: spatial interface design is not a sound trade,
   and the stub's promised "glitch synth" failed the sound need-test. */
(function () {
  'use strict';

  /* Cross-document view transitions (CSS opt-in) abort when the
     viewport changes mid-navigation; the browser surfaces that abort
     as an unhandled rejection of its internal promise. Swallow only
     that exact rejection — navigation itself always completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var msg = e.reason && e.reason.message ? String(e.reason.message) : '';
    if (msg.indexOf('Transition was aborted') !== -1) e.preventDefault();
  });

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- mobile chart-drawer menu ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  var closeBtn = document.getElementById('menuClose');
  var scrim = document.getElementById('menuScrim');
  if (btn && panel) {
    var lastFocus = null;
    function openMenu() {
      lastFocus = document.activeElement;
      document.body.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      if (closeBtn) closeBtn.focus();
    }
    function closeMenu() {
      document.body.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    btn.addEventListener('click', function () {
      document.body.classList.contains('menu-open') ? closeMenu() : openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (scrim) scrim.addEventListener('click', closeMenu);
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 700 && document.body.classList.contains('menu-open')) closeMenu();
    });
  }

  /* ---------- reveal on scroll (only when motion is welcome) ---------- */
  var fine = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  var rvEls = document.querySelectorAll('[data-reveal]');
  if (fine && 'IntersectionObserver' in window && rvEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- enquiry form: validation + honest in-page confirmation ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirm = document.getElementById('confirmBox');
    function fieldOf(input) { return input.closest('.field'); }
    function setInvalid(input, bad) {
      var f = fieldOf(input);
      if (f) {
        var err = f.querySelector('.err');
        if (err) err.classList.toggle('show', bad);
      }
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    function validate(input) {
      var v = (input.value || '').trim();
      if (input.required && !v) return setInvalid(input, true);
      if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return setInvalid(input, true);
      if (input.id === 'fMessage' && v.length > 0 && v.length < 20) return setInvalid(input, true);
      return setInvalid(input, false);
    }
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validate(input);
      });
      input.addEventListener('change', function () {
        if (input.getAttribute('aria-invalid') === 'true') validate(input);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      form.querySelectorAll('input, select, textarea').forEach(function (input) {
        if (!validate(input)) { ok = false; if (!firstBad) firstBad = input; }
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var ref = 'HM-2026-' + Math.floor(100 + Math.random() * 900);
      document.getElementById('confirmRef').textContent = ref;
      var platform = document.getElementById('fPlatform');
      var platformTxt = platform && platform.value ? platform.value : 'your platform';
      document.getElementById('confirmSummary').textContent =
        'Enquiry noted for: ' + platformTxt + '. Expect a reply inside two working days, ' +
        'starting with the three questions every spike begins with — and remember, this ' +
        'demonstration form transmitted nothing, so for a real brief please also email iris@holomesh.studio.';
      form.style.display = 'none';
      confirm.classList.add('show');
      confirm.setAttribute('tabindex', '-1');
      confirm.focus();
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function () {
      form.reset();
      form.style.display = '';
      confirm.classList.remove('show');
      var first = form.querySelector('input, select, textarea');
      if (first) first.focus();
    });
  }
})();
