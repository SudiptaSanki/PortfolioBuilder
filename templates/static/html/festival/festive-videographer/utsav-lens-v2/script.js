/* Utsav Lens — gallery behaviour, Edit & Delivery Planner, Booking Estimator.
   Silent by design: no audio anywhere on this site. Festival sound
   belongs to the festival; the ruling is printed in the footer. */
(function () {
  'use strict';

  /* View-transition abort guard (cross-document transitions) */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) e.preventDefault();
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- guide (mobile menu) ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var guide = document.getElementById('guide');
  var guideClose = document.getElementById('guide-close');
  function openGuide() {
    guide.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { guideClose.focus(); });
  }
  function closeGuide() {
    guide.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menuBtn.focus();
  }
  if (menuBtn && guide && guideClose) {
    menuBtn.addEventListener('click', openGuide);
    guideClose.addEventListener('click', closeGuide);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && guide.classList.contains('open')) closeGuide();
    });
  }

  /* ---------- gallery lights: dim-to-lit reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('lit'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('lit'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- opposing rows: the dawn row starts from its far end ---------- */
  if (!reduced) {
    document.querySelectorAll('.row-viewport[data-from-end]').forEach(function (vp) {
      var setEnd = function () { vp.scrollLeft = vp.scrollWidth - vp.clientWidth; };
      if (document.readyState === 'complete') setEnd();
      else window.addEventListener('load', setEnd);
    });
  }

  /* ---------- opposing rows: scroll drift except on coarse pointers ---------- */
  var coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (window.gsap && window.ScrollTrigger && !reduced && !coarsePointer) {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.row-viewport').forEach(function (vp) {
      var max = vp.scrollWidth - vp.clientWidth;
      if (max <= 0) return;
      var fromEnd = vp.hasAttribute('data-from-end');
      if (fromEnd) vp.scrollLeft = max;
      var tween = { scrollLeft: fromEnd ? 0 : max };
      gsap.fromTo(vp, { scrollLeft: fromEnd ? max : 0 }, Object.assign(tween, {
        ease: 'none',
        scrollTrigger: {
          trigger: vp.closest('section') || vp,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
          invalidateOnRefresh: true
        }
      }));
    });
  }

  /* ---------- shared control wiring ---------- */
  function wireStepper(id, cfg, onChange) {
    var root = document.getElementById(id);
    if (!root) return null;
    var valEl = root.querySelector('.val');
    var state = { value: cfg.value };
    function render() { valEl.textContent = state.value; onChange(state.value); }
    root.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = parseInt(btn.getAttribute('data-d'), 10);
        var next = state.value + d;
        if (next < cfg.min) next = cfg.min;
        if (next > cfg.max) next = cfg.max;
        state.value = next;
        render();
      });
    });
    render();
    return state;
  }
  function wireSeg(id, onChange) {
    var root = document.getElementById(id);
    if (!root) return;
    var btns = root.querySelectorAll('button');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        onChange(btn);
      });
    });
    var active = root.querySelector('button[aria-pressed="true"]');
    if (active) onChange(active);
  }

  /* ---------- date helpers (UTC, no timezone drift) ---------- */
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function parseDate(v) {
    var p = v.split('-');
    return new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));
  }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; }
  function fmt(d) { return DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function dayDiff(a, b) { return Math.round((a.getTime() - b.getTime()) / 86400000); }
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }

  /* ================================================================
     EDIT & DELIVERY PLANNER — arithmetic from the printed tables:
     Table C1: 3.5 raw hours per camera-day.
     Table E1: suite-hours per raw hour — Highlight 2.2 · Procession 1.6 · Aftermovie 3.2.
     Suite day = 8 hours. Table P1: +1 ingest day, +1 finishing day,
     booking window = festival first day + 21 days.
     ================================================================ */
  var plannerRoot = document.getElementById('planner');
  if (plannerRoot) {
    var CAPTURE = 3.5, SUITE_DAY = 8, WINDOW_DAYS = 21;
    var P = { cameras: 2, days: 2, ratio: 2.2, cls: 'Highlight film', editors: 1 };
    var dateInput = document.getElementById('p-date');
    var out = {
      raw: document.getElementById('p-raw'),
      delivery: document.getElementById('p-delivery'),
      deadline: document.getElementById('p-deadline'),
      verdict: document.getElementById('p-verdict'),
      lines: document.getElementById('p-lines')
    };
    function plannerCalc() {
      if (!dateInput.value) return;
      var firstDay = parseDate(dateInput.value);
      var raw = CAPTURE * P.cameras * P.days;
      var editHours = raw * P.ratio;
      var editDays = Math.ceil(editHours / SUITE_DAY / P.editors);
      var lastDay = addDays(firstDay, P.days - 1);
      var delivery = addDays(lastDay, 1 + editDays + 1);
      var deadline = addDays(firstDay, WINDOW_DAYS);
      var diff = dayDiff(deadline, delivery);
      out.raw.textContent = raw.toFixed(1) + ' h';
      out.delivery.textContent = fmt(delivery);
      out.deadline.textContent = fmt(deadline);
      out.lines.innerHTML =
        '<li>RAW — ' + P.cameras + ' camera' + (P.cameras > 1 ? 's' : '') + ' × ' + P.days + ' days × 3.5 h (Table C1) = <b>' + raw.toFixed(1) + ' h</b></li>' +
        '<li>EDIT — ' + raw.toFixed(1) + ' h × ' + P.ratio.toFixed(1) + ' (Table E1, ' + P.cls + ') = <b>' + editHours.toFixed(1) + ' suite-hours</b></li>' +
        '<li>EDIT DAYS — ' + editHours.toFixed(1) + ' ÷ 8 h ÷ ' + P.editors + ' editor' + (P.editors > 1 ? 's' : '') + ' = <b>' + editDays + ' days</b>, rounded up</li>' +
        '<li>PIPELINE — last filming day ' + fmt(lastDay) + ' · +1 ingest · +' + editDays + ' edit · +1 finishing (Table P1) = <b>' + fmt(delivery) + '</b></li>' +
        '<li>WINDOW — the organiser\u2019s booking window closes <b>' + fmt(deadline) + '</b> (festival first day + 21 days, Table P1)</li>';
      if (diff >= 0) {
        out.verdict.classList.remove('miss');
        out.verdict.innerHTML = '<b>Inside the window — by ' + diff + ' day' + (diff === 1 ? '' : 's') + '.</b> This schedule delivers before the organiser\u2019s booking window closes.';
      } else {
        out.verdict.classList.add('miss');
        out.verdict.innerHTML = '<b>This schedule misses the organiser\u2019s booking window — by ' + Math.abs(diff) + ' day' + (Math.abs(diff) === 1 ? '' : 's') + '.</b> An aftermovie that lands after next year\u2019s bookings open is a film nobody can use. Add an editor or cut the film class.';
      }
    }
    wireStepper('p-cameras', { min: 1, max: 4, value: 2 }, function (v) { P.cameras = v; plannerCalc(); });
    wireStepper('p-days', { min: 1, max: 7, value: 2 }, function (v) { P.days = v; plannerCalc(); });
    wireStepper('p-editors', { min: 1, max: 2, value: 1 }, function (v) { P.editors = v; plannerCalc(); });
    wireSeg('p-class', function (btn) {
      P.ratio = parseFloat(btn.getAttribute('data-ratio'));
      P.cls = btn.getAttribute('data-name');
      plannerCalc();
    });
    dateInput.addEventListener('change', plannerCalc);
    plannerCalc();
  }

  /* ================================================================
     BOOKING ESTIMATOR — arithmetic from printed Table F1:
     first camera ₹18,000/day · each additional camera ₹11,000/day ·
     edit & finish: Highlight ₹24,000 · Procession ₹30,000 · Aftermovie ₹42,000 ·
     rush finish (inside 7 days) +25% of the edit & finish fee.
     ================================================================ */
  var estRoot = document.getElementById('estimator');
  if (estRoot) {
    var FIRST = 18000, EXTRA = 11000;
    var E = { days: 2, cameras: 2, fee: 24000, cls: 'Highlight film', rush: false };
    var eOut = {
      film: document.getElementById('e-film-v'),
      edit: document.getElementById('e-edit-v'),
      rush: document.getElementById('e-rush-v'),
      total: document.getElementById('e-total'),
      lines: document.getElementById('e-lines')
    };
    function estCalc() {
      var perDay = FIRST + (E.cameras - 1) * EXTRA;
      var filmFee = E.days * perDay;
      var rushFee = E.rush ? Math.round(E.fee * 0.25) : 0;
      var total = filmFee + E.fee + rushFee;
      eOut.film.textContent = inr(filmFee);
      eOut.edit.textContent = inr(E.fee);
      eOut.rush.textContent = E.rush ? inr(rushFee) : '—';
      eOut.total.textContent = inr(total);
      eOut.lines.innerHTML =
        '<li>FILMING — ' + E.days + ' days × (' + inr(FIRST) + ' first camera' + (E.cameras > 1 ? ' + ' + (E.cameras - 1) + ' × ' + inr(EXTRA) + ' additional' : '') + ') = <b>' + inr(filmFee) + '</b></li>' +
        '<li>EDIT &amp; FINISH — ' + E.cls + ', flat (Table F1) = <b>' + inr(E.fee) + '</b></li>' +
        '<li>RUSH — ' + (E.rush ? 'delivery inside 7 days of the last filming day: 25% of the edit fee = <b>' + inr(rushFee) + '</b>' : 'not applied — delivery on the planner\u2019s normal dates') + '</li>';
    }
    wireStepper('e-days', { min: 1, max: 7, value: 2 }, function (v) { E.days = v; estCalc(); });
    wireStepper('e-cameras', { min: 1, max: 4, value: 2 }, function (v) { E.cameras = v; estCalc(); });
    wireSeg('e-class', function (btn) {
      E.fee = parseInt(btn.getAttribute('data-fee'), 10);
      E.cls = btn.getAttribute('data-name');
      estCalc();
    });
    var rushBtn = document.getElementById('e-rush');
    if (rushBtn) {
      rushBtn.addEventListener('click', function () {
        E.rush = rushBtn.getAttribute('aria-pressed') !== 'true';
        rushBtn.setAttribute('aria-pressed', String(E.rush));
        estCalc();
      });
    }
    estCalc();
  }

  /* ---------- contact form (demonstration — nothing is transmitted) ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var confirmBox = document.getElementById('confirm');
    var refEl = document.getElementById('confirm-ref');
    function setInvalid(id, bad) {
      var f = document.getElementById(id);
      if (f) f.classList.toggle('invalid', bad);
      return !bad;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var email = document.getElementById('f-email').value.trim();
      var festival = document.getElementById('f-festival').value.trim();
      var date = document.getElementById('f-date').value;
      var ok = true;
      ok = setInvalid('field-name', name.length < 2) && ok;
      ok = setInvalid('field-email', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) && ok;
      ok = setInvalid('field-festival', festival.length < 3) && ok;
      ok = setInvalid('field-date', !date) && ok;
      if (!ok) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid select');
        if (firstBad) firstBad.focus();
        return;
      }
      var hash = 0, s = name + '|' + email + '|' + date;
      for (var i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
      refEl.textContent = 'Enquiry reference UL-2026-' + (1000 + (hash % 9000));
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
      confirmBox.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
