/* Utsav Pulse — vanilla JS. No libraries: the kinetic type is a
   scroll-scrubbed transform on display lines only; body text never moves. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* CSS view transitions aborting mid-navigation raise a rejected
     promise; swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu: the gate sheet ---------- */
  var panel = document.getElementById('menu-panel');
  var openBtn = document.getElementById('menu-open');
  var closeBtn = document.getElementById('menu-close');
  var lastFocus = null;

  function openMenu() {
    if (!panel) return;
    lastFocus = document.activeElement;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    /* focus after the panel is visible, or the call is a silent no-op */
    requestAnimationFrame(function () { if (closeBtn) closeBtn.focus(); });
  }
  function closeMenu() {
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel && panel.classList.contains('open')) closeMenu();
  });

  /* ---------- ticker: duplicate the track for a clean loop ---------- */
  var track = document.getElementById('ticker-track');
  if (track && !reduced) track.innerHTML += track.innerHTML;

  /* ---------- kinetic type: display lines drift on scroll ---------- */
  var kinLines = Array.prototype.slice.call(document.querySelectorAll('.kin-line'));
  if (kinLines.length && !reduced) {
    var ticking = false;
    function drift() {
      ticking = false;
      var vh = window.innerHeight;
      kinLines.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = (vh - r.top) / (vh + r.height);
        p = Math.max(0, Math.min(1, p));
        var d = parseFloat(el.getAttribute('data-drift') || '0');
        el.style.transform = 'translateX(' + ((p - 0.5) * d).toFixed(1) + 'px)';
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(drift); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    drift();
  }

  /* ---------- Indian digit grouping: 1,18,00,000 ---------- */
  function inr(n) {
    var s = String(Math.round(n));
    if (s.length <= 3) return s;
    var last3 = s.slice(-3);
    var rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }

  /* ---------- Festival Scale Planner ----------
     Rates are the ones printed on the page:
     area 2 m2/person · lanes 1/1500 (min 2) · toilets 1/100 (min 4)
     stewards 1/100 (min 10) · budget Rs450–700 per person per day
     extra stages Rs5,00,000 per stage per day beyond the first. */
  var attEl = document.getElementById('att');
  if (attEl) {
    var daysEl = document.getElementById('days');
    var stagesEl = document.getElementById('stages');
    var siteEl = document.getElementById('site');
    var out = {
      title: document.getElementById('r-title'),
      area: document.getElementById('r-area'),
      lanes: document.getElementById('r-lanes'),
      toilets: document.getElementById('r-toilets'),
      stewards: document.getElementById('r-stewards'),
      band: document.getElementById('r-band'),
      crore: document.getElementById('r-crore'),
      overcap: document.getElementById('overcap'),
      capText: document.getElementById('cap-text')
    };

    function num(el, fallback) {
      var v = parseInt(el.value, 10);
      return isNaN(v) ? fallback : v;
    }

    function compute() {
      var att = Math.max(0, num(attEl, 0));
      var days = Math.min(14, Math.max(1, num(daysEl, 1)));
      var stages = Math.min(8, Math.max(1, num(stagesEl, 1)));
      var opt = siteEl.options[siteEl.selectedIndex];
      var siteName = opt.value;
      var cap = parseInt(opt.getAttribute('data-cap'), 10) || 0;

      var area = att * 2;
      var lanes = Math.max(2, Math.ceil(att / 1500));
      var toilets = Math.max(4, Math.ceil(att / 100));
      var stewards = Math.max(10, Math.ceil(att / 100));
      var extra = (stages - 1) * 500000 * days;
      var lean = att * days * 450 + extra;
      var full = att * days * 700 + extra;

      out.title.textContent = 'For ' + inr(att) + ' people at ' + siteName;
      out.area.textContent = inr(area) + ' m²';
      out.lanes.textContent = inr(lanes);
      out.toilets.textContent = inr(toilets);
      out.stewards.textContent = inr(stewards);
      out.band.textContent = '₹' + inr(lean) + ' – ₹' + inr(full);
      out.crore.textContent = 'Production budget band — ₹' + (lean / 1e7).toFixed(2) +
        ' to ₹' + (full / 1e7).toFixed(2) + ' crore over ' + days +
        (days === 1 ? ' day' : ' days') + ', before artist fees and my production fee.';

      if (cap > 0 && att > cap) {
        out.capText.textContent = 'That is more people than ' + siteName +
          ' is licensed to hold — the licence caps this site at ' + inr(cap) +
          ' on site at one time, and you are planning for ' + inr(att) +
          '. Two honest options: cap ticket sales at ' + inr(cap) +
          ' and sell the day out, or split the festival — a second day at this site, or a second site. ' +
          'What I will not do is plan for ' + inr(att) +
          ' people on a ' + inr(cap) + ' licence and hope the gate count is kind.';
        out.overcap.hidden = false;
      } else {
        out.overcap.hidden = true;
      }
    }

    [attEl, daysEl, stagesEl].forEach(function (el) {
      el.addEventListener('input', compute);
      el.addEventListener('change', compute);
    });
    siteEl.addEventListener('change', compute);

    document.querySelectorAll('.stepper button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-target'));
        if (!target) return;
        var step = parseInt(btn.getAttribute('data-step'), 10) || 0;
        var v = num(target, 0) + step;
        var min = parseInt(target.getAttribute('min'), 10);
        var max = parseInt(target.getAttribute('max'), 10);
        if (!isNaN(min)) v = Math.max(min, v);
        if (!isNaN(max)) v = Math.min(max, v);
        target.value = v;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    compute();
  }

  /* ---------- booking form: in-page confirmation with reference ---------- */
  var form = document.getElementById('book-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var ok = true;
      [name, email].forEach(function (f) {
        if (!f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value))) {
          f.setAttribute('aria-invalid', 'true');
          f.style.borderColor = '#bc2a5e';
          ok = false;
        } else {
          f.removeAttribute('aria-invalid');
          f.style.borderColor = '';
        }
      });
      if (!ok) { (name.value.trim() ? email : name).focus(); return; }

      var ref = 'UP-' + new Date().getFullYear() + '-' +
        String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('confirm-ref').textContent = ref;
      document.getElementById('confirm-line').textContent =
        'Thank you, ' + name.value.trim().split(' ')[0] +
        ' — I reply within two working days, in person, with the scale maths for your numbers already run.';
      var confirm = document.getElementById('confirm');
      confirm.hidden = false;
      form.reset();
      confirm.focus();
      confirm.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();
