/* ============================================================
   AKASH LENS — site script. No libraries.
   Sound ruling: NONE. This site ships silent by design — a
   festival's sound belongs in its film, not behind a page.
   ============================================================ */
(function () {
  'use strict';

  /* View-transition aborts surface as unhandled rejections in Chrome;
     the navigation itself completes. Swallow only that exact error. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- flight-deck mobile menu ---------- */
  var deck = document.getElementById('deck');
  var openBtn = document.getElementById('menu-open');
  var closeBtn = document.getElementById('menu-close');
  var lastFocus = null;
  function openDeck() {
    if (!deck) return;
    lastFocus = document.activeElement;
    deck.hidden = false;
    requestAnimationFrame(function () {
      deck.classList.add('open');
      var first = deck.querySelector('nav a');
      if (first) first.focus();
    });
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDeck() {
    if (!deck) return;
    deck.classList.remove('open');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    var done = function () { deck.hidden = true; };
    if (reduced) done(); else setTimeout(done, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (openBtn) openBtn.addEventListener('click', openDeck);
  if (closeBtn) closeBtn.addEventListener('click', closeDeck);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && deck && !deck.hidden) closeDeck();
  });

  /* ---------- reveal on scroll ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- helpers ---------- */
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
  function hm(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    if (h && m) return h + ' h ' + m + ' min';
    if (h) return h + ' h';
    return m + ' min';
  }
  function segWire(id, attr, cb) {
    var seg = document.getElementById(id);
    if (!seg) return null;
    var btns = seg.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        cb(b.getAttribute(attr));
      });
    });
    return seg;
  }
  function pressed(id, attr) {
    var seg = document.getElementById(id);
    if (!seg) return null;
    var b = seg.querySelector('button[aria-pressed="true"]');
    return b ? b.getAttribute(attr) : null;
  }
  function workings(el, rows) {
    if (!el) return;
    el.innerHTML = rows.map(function (r) {
      return '<div class="w-row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join('');
  }

  /* ============================================================
     SORTIE PLANNER — reads its sortie lengths from printed Table T1
     ============================================================ */
  var t1 = document.getElementById('t1');
  if (t1) {
    var t1map = {};
    t1.querySelectorAll('td[data-pack]').forEach(function (td) {
      t1map[td.getAttribute('data-pack') + '|' + td.getAttribute('data-wind')] = {
        min: parseInt(td.getAttribute('data-min'), 10), cell: td
      };
    });
    var TURNAROUND = 6, DUTY = 10, FLEET = 2;
    var packNames = { standard: 'Standard pack', endurance: 'Endurance pack' };
    var windNames = { calm: 'Calm', breeze: 'Breeze', gusty: 'Gusty' };
    var covHours = 4;

    var covVal = document.getElementById('cov-val');
    var planOut = document.getElementById('plan-out');
    var planWork = document.getElementById('plan-workings');
    var planVerdict = document.getElementById('plan-verdict');
    var planGrounded = document.getElementById('plan-grounded');

    function renderPlan() {
      var pack = pressed('seg-pack', 'data-pack');
      var wind = pressed('seg-wind', 'data-wind');
      t1.querySelectorAll('td.hot').forEach(function (td) { td.classList.remove('hot'); });
      if (wind === 'over') {
        planOut.hidden = true;
        planGrounded.hidden = false;
        return;
      }
      planOut.hidden = false;
      planGrounded.hidden = true;
      var entry = t1map[pack + '|' + wind];
      if (entry) entry.cell.classList.add('hot');
      var sortieLen = entry.min;
      var covMin = Math.round(covHours * 60);
      var sorties = Math.ceil(covMin / sortieLen);
      var ground = (sorties - 1) * TURNAROUND;
      var windowMin = covMin + ground;
      var aircraft = Math.ceil(sorties / DUTY);

      covVal.textContent = covHours.toFixed(1) + ' hours';
      workings(planWork, [
        ['Coverage required', covMin + ' min (' + covHours.toFixed(1) + ' h)'],
        ['Planning sortie length — ' + packNames[pack] + ' · ' + windNames[wind] + ' (T1)', sortieLen + ' min'],
        ['Sorties = ceil(' + covMin + ' ÷ ' + sortieLen + ')', String(sorties)],
        ['Batteries (one per sortie)', String(sorties)],
        ['Ground time = (' + sorties + ' − 1) × ' + TURNAROUND + ' min turnaround', ground + ' min'],
        ['Committed window = ' + covMin + ' + ' + ground, hm(windowMin)]
      ]);

      planVerdict.className = 'verdict';
      if (aircraft > FLEET) {
        planVerdict.classList.add('stop');
        planVerdict.innerHTML = '<b>Plan refused as drawn</b>' +
          sorties + ' sorties need ' + aircraft + ' aircraft at the ' + DUTY + '-sortie duty limit, and this practice fields ' + FLEET +
          '. The honest options: split the coverage across two days, shorten the window, or step up to Endurance packs and re-run this sheet.';
      } else if (aircraft === 2) {
        var first = DUTY, rest = sorties - DUTY;
        planVerdict.classList.add('warn');
        planVerdict.innerHTML = '<b>Flyable — second aircraft required</b>' +
          sorties + ' sorties pass the ' + DUTY + '-sortie duty limit for one aircraft, so the day splits ' + first + ' + ' + rest +
          ' across two aircraft. That is what the estimator&rsquo;s second-aircraft line is for.';
      } else {
        planVerdict.classList.add('ok');
        planVerdict.innerHTML = '<b>Flyable as drawn — one aircraft</b>' +
          sorties + ' sorties sit inside the ' + DUTY + '-sortie duty limit with the landing reserve intact. This is the shape of plan we would put in writing after the site survey.';
      }
    }
    segWire('seg-pack', 'data-pack', renderPlan);
    segWire('seg-wind', 'data-wind', renderPlan);
    document.getElementById('cov-minus').addEventListener('click', function () {
      covHours = Math.max(1, covHours - 0.5); renderPlan();
    });
    document.getElementById('cov-plus').addEventListener('click', function () {
      covHours = Math.min(8, covHours + 0.5); renderPlan();
    });
    renderPlan();
  }

  /* ============================================================
     BOOKING ESTIMATOR — reads its rates from printed Fee Sheet F1
     ============================================================ */
  var f1 = document.getElementById('f1');
  if (f1) {
    var rates = {};
    f1.querySelectorAll('td[data-key]').forEach(function (td) {
      rates[td.getAttribute('data-key')] = parseInt(td.getAttribute('data-rate'), 10);
    });
    var days = 1;
    var dayVal = document.getElementById('day-val');
    var estWork = document.getElementById('est-workings');
    var estTotal = document.getElementById('est-total');
    var travelNames = { 'travel-local': 'Travel — within 60 km of Pune', 'travel-state': 'Travel — within Maharashtra', 'travel-out': 'Travel — outstation' };

    function renderEst() {
      var daytype = pressed('seg-daytype', 'data-daytype');
      var dayRate = rates[daytype === 'full' ? 'day-full' : 'day-half'];
      var second = document.getElementById('sw-second').getAttribute('aria-checked') === 'true';
      var survey = document.getElementById('sw-survey').getAttribute('aria-checked') === 'true';
      var travelKey = pressed('seg-travel', 'data-travel');

      dayVal.textContent = days + (days === 1 ? ' day' : ' days') + ' · ' + (daytype === 'full' ? 'full' : 'half');

      var rows = [], total = 0;
      var dayLine = days * dayRate;
      rows.push([(daytype === 'full' ? 'Festival day' : 'Half day') + ' × ' + days, inr(dayLine)]);
      total += dayLine;
      if (second) {
        rows.push(['Second aircraft + operator × ' + days, inr(days * rates.second)]);
        total += days * rates.second;
      }
      rows.push(['Permission administration (per event, not optional)', inr(rates.permission)]);
      total += rates.permission;
      if (survey) {
        rows.push(['Site survey visit', inr(rates.survey)]);
        total += rates.survey;
      }
      rows.push([travelNames[travelKey], inr(rates[travelKey])]);
      total += rates[travelKey];

      workings(estWork, rows);
      estTotal.textContent = inr(total);
    }
    segWire('seg-daytype', 'data-daytype', renderEst);
    segWire('seg-travel', 'data-travel', renderEst);
    ['sw-second', 'sw-survey'].forEach(function (id) {
      var sw = document.getElementById(id);
      sw.addEventListener('click', function () {
        sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
        renderEst();
      });
    });
    document.getElementById('day-minus').addEventListener('click', function () {
      days = Math.max(1, days - 1); renderEst();
    });
    document.getElementById('day-plus').addEventListener('click', function () {
      days = Math.min(4, days + 1); renderEst();
    });
    renderEst();
  }

  /* ============================================================
     ENQUIRY FORM — demonstration only; nothing is transmitted
     ============================================================ */
  var form = document.getElementById('enquiry');
  if (form) {
    var confirmBox = document.getElementById('confirm');
    function fieldOk(name) {
      var f = form.querySelector('[data-field="' + name + '"]');
      var inp = f.querySelector('.inp');
      var v = (inp.value || '').trim();
      var ok = true;
      if (name === 'name') ok = v.length >= 2;
      else if (name === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      else if (name === 'type') ok = v !== '';
      else if (name === 'date') ok = v !== '';
      else if (name === 'place') ok = v.length >= 3;
      else if (name === 'message') ok = v.length >= 20;
      f.classList.toggle('invalid', !ok);
      return ok;
    }
    ['name', 'email', 'type', 'date', 'place', 'message'].forEach(function (n) {
      var inp = form.querySelector('[data-field="' + n + '"] .inp');
      inp.addEventListener('input', function () {
        form.querySelector('[data-field="' + n + '"]').classList.remove('invalid');
      });
      inp.addEventListener('change', function () {
        form.querySelector('[data-field="' + n + '"]').classList.remove('invalid');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var names = ['name', 'email', 'type', 'date', 'place', 'message'];
      var allOk = true, firstBad = null;
      names.forEach(function (n) {
        var ok = fieldOk(n);
        if (!ok) { allOk = false; if (!firstBad) firstBad = n; }
      });
      if (!allOk) {
        var bad = form.querySelector('[data-field="' + firstBad + '"] .inp');
        if (bad) bad.focus();
        return;
      }
      var ref = 'AL-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirm-ref').textContent = ref;
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
