/* Shaadi Frame — run-sheet logic.
   Sound ruling: NO audio anywhere. Wedding films are delivered
   artefacts (files handed to couples); this site plays nothing.
   The planner's data model mirrors Table 1 (event blocks & hours)
   and Table 2 (packages) printed on index.html — the verification
   probe asserts the sheet against both printed tables. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections in Chrome;
     the navigation itself always completes. Swallow only that one. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile run-sheet panel ---------- */
  var btn = document.getElementById('menu-btn');
  var panel = document.getElementById('mnav');
  if (btn && panel) {
    var links = panel.querySelectorAll('a');
    function openPanel() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (links.length) links[0].focus(); });
      });
    }
    function closePanel(back) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (back) btn.focus();
    }
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closePanel(false); else openPanel();
    });
    links.forEach(function (a) { a.addEventListener('click', function () { closePanel(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
    });
  }

  /* ---------- reveals: opacity only ---------- */
  var rv = document.querySelectorAll('.rv');
  if (reduced || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* ---------- coverage planner ---------- */
  var EVENTS = {
    haldi:     { name: 'Haldi', hrs: 2 },
    mehndi:    { name: 'Mehndi', hrs: 3 },
    couple:    { name: 'Couple session', hrs: 2 },
    welcome:   { name: 'Welcome evening', hrs: 2 },
    sangeet:   { name: 'Sangeet', hrs: 3.5 },
    ready:     { name: 'Getting ready & details', hrs: 2 },
    ceremony:  { name: 'Ceremony — baraat to vidaai', hrs: 4 },
    portraits: { name: 'Portraits & family groups', hrs: 1.5 },
    reception: { name: 'Reception', hrs: 4 }
  };
  var SHAPES = {
    one:   { label: 'One day', price: 85000, delivery: 4, days: [
      ['Day 1 — the wedding day', ['ready', 'ceremony', 'portraits', 'reception']] ] },
    two:   { label: 'Two days', price: 145000, delivery: 5, days: [
      ['Day 1 — colour & music', ['haldi', 'mehndi', 'sangeet']],
      ['Day 2 — the wedding day', ['ready', 'ceremony', 'portraits', 'reception']] ] },
    three: { label: 'Three days', price: 195000, delivery: 6, days: [
      ['Day 1 — colour', ['haldi', 'mehndi']],
      ['Day 2 — portraits & music', ['couple', 'welcome', 'sangeet']],
      ['Day 3 — the wedding day', ['ready', 'ceremony', 'portraits', 'reception']] ] }
  };
  var SHOOTER_PER_DAY = 20000;
  var FILM_FLAT = 55000;
  var RATE_LO = 45, RATE_HI = 60;

  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
  function hrsFmt(h) { return (h % 1 === 0 ? String(h) : h.toFixed(1)) + ' h'; }
  function round10(n) { return Math.round(n / 10) * 10; }
  function numFmt(n) { return n.toLocaleString('en-IN'); }

  var planRoot = document.getElementById('planner');
  if (planRoot) {
    var state = { shape: 'one', shooter: false, film: false };
    var blocksEl = document.getElementById('plan-blocks');
    var hoursEl = document.getElementById('plan-hours');
    var imagesEl = document.getElementById('plan-images');
    var deliveryEl = document.getElementById('plan-delivery');
    var linesEl = document.getElementById('plan-lines');
    var totalEl = document.getElementById('plan-total');
    var filmLine = document.getElementById('film-line');
    var ctaEl = document.getElementById('plan-cta');

    function render() {
      var s = SHAPES[state.shape];
      var totalHrs = 0;
      var html = '';
      s.days.forEach(function (day) {
        html += '<p class="out-day">' + day[0] + '</p>';
        day[1].forEach(function (key) {
          var ev = EVENTS[key];
          totalHrs += ev.hrs;
          html += '<div class="out-row"><span>' + ev.name + '</span>' +
                  '<span class="h">' + hrsFmt(ev.hrs) + '</span></div>';
        });
      });
      blocksEl.innerHTML = html;
      hoursEl.textContent = hrsFmt(totalHrs);
      imagesEl.textContent = numFmt(round10(totalHrs * RATE_LO)) + '–' + numFmt(round10(totalHrs * RATE_HI));
      deliveryEl.textContent = s.delivery + ' weeks';

      var lines = '<div class="t-row"><span>' + s.label + ' package (Table 2)</span>' +
                  '<span class="v">' + inr(s.price) + '</span></div>';
      var total = s.price;
      if (state.shooter) {
        var sh = SHOOTER_PER_DAY * s.days.length;
        total += sh;
        lines += '<div class="t-row"><span>Second shooter — ' + s.days.length +
                 (s.days.length === 1 ? ' day' : ' days') + ' × ' + inr(SHOOTER_PER_DAY) + '</span>' +
                 '<span class="v">' + inr(sh) + '</span></div>';
      }
      if (state.film) {
        total += FILM_FLAT;
        lines += '<div class="t-row"><span>Film — highlight + full ceremony film</span>' +
                 '<span class="v">' + inr(FILM_FLAT) + '</span></div>';
      }
      linesEl.innerHTML = lines;
      totalEl.textContent = inr(total);
      filmLine.hidden = !state.film;
      ctaEl.setAttribute('href', './contact.html?type=' + state.shape);
    }

    planRoot.querySelectorAll('[data-shape]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.shape = b.getAttribute('data-shape');
        planRoot.querySelectorAll('[data-shape]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        render();
      });
    });
    planRoot.querySelectorAll('[data-opt]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-opt');
        state[key] = !state[key];
        b.setAttribute('aria-pressed', state[key] ? 'true' : 'false');
        var box = b.querySelector('.box');
        if (box) box.textContent = state[key] ? '✓' : '';
        render();
      });
    });
    render();
  }

  /* ---------- enquiry form (contact page) ---------- */
  var form = document.getElementById('enquiry');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var shapeSel = document.getElementById('f-shape');
    var pre = params.get('type');
    if (shapeSel && (pre === 'one' || pre === 'two' || pre === 'three')) {
      shapeSel.value = pre;
    }
    var confirm = document.getElementById('confirm');
    var refEl = document.getElementById('confirm-ref');
    var again = document.getElementById('send-another');

    function fieldBad(input, bad) {
      var wrap = input.closest('.f-field');
      if (wrap) wrap.classList.toggle('bad', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return bad;
    }
    function validate() {
      var firstBad = null;
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var date = document.getElementById('f-date');
      var checks = [
        [name, !name.value.trim()],
        [email, !/.+@.+\..+/.test(email.value.trim())],
        [date, !date.value],
        [shapeSel, !shapeSel.value]
      ];
      checks.forEach(function (c) {
        if (fieldBad(c[0], c[1]) && !firstBad) firstBad = c[0];
      });
      return firstBad;
    }
    ['f-name', 'f-email', 'f-date', 'f-shape'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { fieldBad(el, false); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad) { bad.focus(); return; }
      refEl.textContent = 'SF-2026-' + (100 + Math.floor(Math.random() * 900));
      form.hidden = true;
      if (confirm) { confirm.hidden = false; confirm.scrollIntoView({ block: 'center' }); }
    });
    if (again) again.addEventListener('click', function () {
      form.reset();
      form.hidden = false;
      if (confirm) confirm.hidden = true;
      var name = document.getElementById('f-name');
      if (name) name.focus();
    });
  }
})();
