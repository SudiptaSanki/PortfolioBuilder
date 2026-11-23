/* Tirtha Walk — nav, walk planner, booking form.
   Planner data is copied from the printed index and rate table on index.html.
   If the printed numbers ever change, change them here too — the planner
   is not allowed to know anything the page doesn't show. */
(function () {
  'use strict';

  /* View-transition abort guard: an aborted CSS view transition surfaces as
     an unhandled InvalidStateError rejection. Swallow only that one. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- mobile nav: the "Route index" panel ---------- */
  var head = document.getElementById('siteHead');
  var toggle = document.getElementById('navToggle');
  var panel = document.getElementById('navPanel');
  var scrim = document.getElementById('navScrim');

  function setNav(open) {
    if (!head || !toggle) return;
    head.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && panel) {
      requestAnimationFrame(function () {
        var first = panel.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      });
    }
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(!head.classList.contains('open'));
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && head && head.classList.contains('open')) {
      setNav(false);
      if (toggle) toggle.focus();
    }
  });
  if (panel) {
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
  }

  /* ---------- the walk planner ---------- */
  var FESTIVAL_DATE = '2026-11-24'; /* Dev Deepawali 2026, Tuesday, Kartik Purnima */
  var ROUTES = {
    dawn:     { name: 'Dawn Ghats Walk',              mins: 120, starts: ['05:30'],           cap: 12, finish: 'Dashashwamedh Ghat' },
    lanes:    { name: 'Old City Lanes & Bazaar Walk', mins: 150, starts: ['07:00', '15:30'], cap: 10, finish: 'Thatheri Bazaar', closedOnFestival: true },
    weavers:  { name: "Weavers' Quarter Walk",        mins: 120, starts: ['09:00'],           cap: 8,  finish: 'Pili Kothi' },
    aarti:    { name: 'Evening Aarti Walk',           mins: 90,  starts: ['17:15'],           cap: 12, finish: 'the Dashashwamedh aarti stand' },
    festival: { name: 'Dev Deepawali Festival Walk', mins: 180, starts: ['16:00'],           cap: 15, finish: 'Dashashwamedh, in time for the maha aarti', festivalOnly: true, flat: 1500 }
  };

  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
  function perPerson(route, size) {
    if (route.flat) return route.flat;
    if (size <= 4) return 1200;
    if (size <= 8) return 950;
    return 750;
  }
  function addMinutes(hhmm, mins) {
    var p = hhmm.split(':');
    var t = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + mins;
    var h = Math.floor(t / 60) % 24, m = t % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function fmtDate(iso) {
    var p = iso.split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function todayISO() {
    var d = new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  var pRoute = document.getElementById('p-route');
  if (pRoute) {
    var pDate = document.getElementById('p-date');
    var pStart = document.getElementById('p-start');
    var pSize = document.getElementById('p-size');
    var outTitle = document.getElementById('out-title');
    var outRows = document.getElementById('out-rows');
    var outStart = document.getElementById('out-start');
    var outEnd = document.getElementById('out-end');
    var outPer = document.getElementById('out-per');
    var outTotal = document.getElementById('out-total');
    var outNote = document.getElementById('out-note');

    function fillStarts() {
      var route = ROUTES[pRoute.value];
      pStart.innerHTML = '';
      route.starts.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s; o.textContent = s;
        pStart.appendChild(o);
      });
    }
    function size() {
      var n = parseInt(pSize.value, 10);
      return isNaN(n) || n < 1 ? 1 : n;
    }
    function fail(title, html) {
      outTitle.textContent = title;
      outRows.style.display = 'none';
      outNote.className = 'out-note bad';
      outNote.innerHTML = html;
    }
    function plan() {
      var route = ROUTES[pRoute.value];
      var date = pDate.value;
      var n = size();
      outNote.className = 'out-note';
      outNote.innerHTML = '';
      outRows.style.display = '';

      if (!date) { fail('Pick a date first', 'The planner needs a date — every rule below hangs on it.'); return; }
      if (date < todayISO()) {
        fail('That date has already walked past',
          '<strong>' + fmtDate(date) + ' is behind us.</strong> Walks book from tomorrow onwards — pick a date ahead and the planner will price it from the printed table.');
        return;
      }
      if (route.festivalOnly && date !== FESTIVAL_DATE) {
        fail('The Festival Walk runs once a year',
          '<strong>The Dev Deepawali Festival Walk runs only on Tuesday 24 November 2026</strong> — Kartik Purnima, the one night the ghats are lamp-lit end to end. On ' + fmtDate(date) + ' the same riverfront is covered by the <strong>Dawn Ghats Walk</strong> (05:30, cap 12) and the <strong>Evening Aarti Walk</strong> (17:15, cap 12).');
        return;
      }
      if (route.closedOnFestival && date === FESTIVAL_DATE) {
        fail('The lanes are closed that day',
          '<strong>The Old City Lanes &amp; Bazaar Walk does not run on Tuesday 24 November 2026.</strong> On Dev Deepawali the old-city lanes are barricaded for the festival crowds. The walk built for that day is the <strong>Dev Deepawali Festival Walk</strong> — 3.1 km along the lamp-lit ghats, 16:00–19:00, cap 15.');
        return;
      }
      if (n > route.cap) {
        fail('That group is bigger than the walk',
          '<strong>' + route.name + ' is capped at ' + route.cap + ' walkers</strong> — the cap is set by the lanes and the loom rooms, not by my diary, and I don\'t stretch it. Two honest options: split into two groups (I run a second start 30 minutes later, with a fellow licensed guide for groups over 20), or take the <strong>Dawn Ghats Walk</strong>, which holds 12.');
        return;
      }
      var per = perPerson(route, n);
      var start = pStart.value || route.starts[0];
      outTitle.textContent = route.name + ' — ' + fmtDate(date);
      outStart.textContent = start;
      outEnd.textContent = addMinutes(start, route.mins);
      outPer.textContent = inr(per);
      outTotal.textContent = inr(per * n);
      outNote.innerHTML = 'You finish at <strong>' + route.finish + '</strong> at ' + addMinutes(start, route.mins) +
        '. The total is ' + n + (n === 1 ? ' walker' : ' walkers') + ' × ' + inr(per) +
        (route.flat ? ' (flat festival rate, from the printed table)' : ' (group of ' + (n <= 4 ? '1–4' : n <= 8 ? '5–8' : '9 to cap') + ', from the printed rate table)') +
        '. Nothing is due now — <a href="./contact.html">send the booking</a> and pay on the day, after the walk.';
    }
    pRoute.addEventListener('change', function () { fillStarts(); plan(); });
    pDate.addEventListener('change', plan);
    pStart.addEventListener('change', plan);
    pSize.addEventListener('input', plan);
    pSize.addEventListener('change', plan);
    document.getElementById('p-minus').addEventListener('click', function () {
      pSize.value = String(Math.max(1, size() - 1)); plan();
    });
    document.getElementById('p-plus').addEventListener('click', function () {
      pSize.value = String(Math.min(40, size() + 1)); plan();
    });
    fillStarts();
    plan();
  }

  /* ---------- booking form ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    var NAMES = {
      dawn: 'Dawn Ghats Walk', lanes: 'Old City Lanes & Bazaar Walk',
      weavers: "Weavers' Quarter Walk", aarti: 'Evening Aarti Walk',
      festival: 'Dev Deepawali Festival Walk'
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('b-name').value.trim();
      var email = document.getElementById('b-email').value.trim();
      var route = document.getElementById('b-route').value;
      var date = document.getElementById('b-date').value;
      var n = parseInt(document.getElementById('b-size').value, 10);
      var err = document.getElementById('form-error');
      var problem = '';
      if (!name) problem = 'I need your name — I answer people, not forms.';
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problem = 'That email doesn\'t look complete — my reply has to reach you.';
      else if (!date) problem = 'Pick a date, even a rough one. The walk hangs on it.';
      else if (isNaN(n) || n < 1) problem = 'Tell me how many walkers — even a guess helps me plan.';
      if (problem) {
        err.textContent = problem;
        err.hidden = false;
        return;
      }
      err.hidden = true;
      var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      var ref = 'TW-';
      for (var i = 0; i < 4; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
      document.getElementById('conf-ref').textContent = ref;
      document.getElementById('conf-summary').textContent =
        name.split(' ')[0] + ', your request for the ' + NAMES[route] + ' on ' + fmtDate(date) +
        ' for ' + n + (n === 1 ? ' walker' : ' walkers') + ' is with me. Expect my reply at ' + email +
        ' within a day — with the meeting steps, the start time and the total in writing.';
      var box = document.getElementById('confirmBox');
      box.hidden = false;
      box.focus({ preventScroll: false });
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
})();
