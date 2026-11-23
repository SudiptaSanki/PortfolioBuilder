/* Twinkle Roof — menu, install estimator, booking form.
   No sound, no scroll effects. The estimator reads the same numbers
   printed in the rate table on the page. */
(function () {
  'use strict';

  /* CSS view transitions abort noisily when a navigation interrupts one;
     swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById('menu-btn');
  var panel = document.getElementById('mobile-panel');
  if (btn && panel) {
    var firstLink = panel.querySelector('nav a');
    function closeMenu() {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function () {
      var opening = !panel.classList.contains('open');
      if (opening) {
        panel.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      } else {
        closeMenu();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closeMenu();
        btn.focus();
      }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  /* ---------- install estimator (index page) ---------- */
  var BULBS = {
    c9:   { spacing: 0.30, watts: 0.8,  rate: 34 },
    c7:   { spacing: 0.20, watts: 0.6,  rate: 29 },
    mini: { spacing: 0.10, watts: 0.05, rate: 22 }
  };
  var TIMER_PRICE = 45;      /* fitted, one per circuit */
  var TREE_PRICE = 95;       /* per garden tree wrapped */
  var TREE_WATTS = 30;       /* a wrapped tree adds ~30 W of mini string */
  var MIN_JOB = 390;         /* small-job minimum */
  var CIRCUIT_LIMIT = 1440;  /* 80% of a 15 A, 120 V circuit */
  var BOOKED = { nov23: true, nov30: true };
  var EARLIEST_OPEN = 'the week of Mon 7 December';

  var est = document.getElementById('estimator-form');
  if (est) {
    var state = { metres: 24, bulb: 'c9', timer: true, trees: 1, week: 'nov16' };
    var metresVal = document.getElementById('metres-val');
    var treesVal = document.getElementById('trees-val');
    var outBulbs = document.getElementById('out-bulbs');
    var outLoad = document.getElementById('out-load');
    var outHours = document.getElementById('out-hours');
    var outTotal = document.getElementById('out-total');
    var verdict = document.getElementById('est-verdict');
    var weekSel = document.getElementById('est-week');

    function money(n) { return '$' + n.toLocaleString('en-US'); }

    function render() {
      var b = BULBS[state.bulb];
      var bulbs = Math.ceil(state.metres / b.spacing);
      var load = Math.round(bulbs * b.watts + state.trees * TREE_WATTS);
      var hours = Math.ceil(state.metres / 6) + state.trees;
      var raw = state.metres * b.rate + (state.timer ? TIMER_PRICE : 0) + state.trees * TREE_PRICE;
      var minApplied = raw < MIN_JOB;
      var total = Math.round(Math.max(MIN_JOB, raw));

      metresVal.textContent = state.metres + ' m';
      treesVal.textContent = state.trees;
      outBulbs.textContent = bulbs.toLocaleString('en-US') + ' bulbs';
      outLoad.textContent = load.toLocaleString('en-US') + ' W';
      outHours.textContent = hours + ' crew-hours';
      outTotal.textContent = money(total);

      var circuit = load <= CIRCUIT_LIMIT
        ? 'Load ' + load.toLocaleString('en-US') + ' W sits on one circuit, well inside the 1,440 W working limit.'
        : 'Load ' + load.toLocaleString('en-US') + ' W is over the 1,440 W working limit for one circuit — I split the run into two circuits at the ridge, no extra charge for the split.';
      var minNote = minApplied ? ' The small-job minimum of $390 applies to this one.' : '';

      if (BOOKED[state.week]) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'That week is full — every ladder slot is taken. The booked-out weeks are Mon 23 November and Mon 30 November. The earliest week with room is ' + EARLIEST_OPEN + ': pick it above, or send the booking form and I will hold a slot for 48 hours. ' + circuit + minNote;
      } else {
        verdict.className = 'verdict';
        verdict.textContent = 'That week has room. ' + circuit + minNote + ' January takedown is $9 per metre when booked with the install ($12 if you book it later).';
      }
    }

    est.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-step]');
      if (!b) return;
      var key = b.getAttribute('data-step');
      var d = parseInt(b.getAttribute('data-dir'), 10);
      if (key === 'metres') state.metres = Math.min(80, Math.max(6, state.metres + d * 2));
      if (key === 'trees') state.trees = Math.min(6, Math.max(0, state.trees + d));
      render();
    });
    est.addEventListener('change', function (e) {
      if (e.target.name === 'bulb') { state.bulb = e.target.value; render(); }
      if (e.target.id === 'est-timer') { state.timer = e.target.checked; render(); }
      if (e.target === weekSel) { state.week = weekSel.value; render(); }
    });
    render();
  }

  /* ---------- booking form (contact page) ---------- */
  var form = document.getElementById('book-form');
  if (form) {
    var confirmBox = document.getElementById('book-confirm');
    var refEl = document.getElementById('book-ref');
    var sumEl = document.getElementById('book-summary');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('bk-name').value.trim();
      var email = document.getElementById('bk-email').value.trim();
      var weekSel = document.getElementById('bk-week');
      var weekText = weekSel.options[weekSel.selectedIndex].text;
      var seed = (name + '|' + email).split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
      var ref = 'TR-2026-' + (1000 + (seed % 9000));
      refEl.textContent = ref;
      if (BOOKED[weekSel.value]) {
        sumEl.textContent = 'Thank you, ' + name.split(' ')[0] + '. ' + weekText + ' — that week is fully booked, so this goes on the waitlist under reference ' + ref + '. The first slot I would offer you is ' + EARLIEST_OPEN + '. I reply within one working day.';
      } else {
        sumEl.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your measure visit request for ' + weekText.toLowerCase() + ' is logged under reference ' + ref + '. I reply within one working day with two visit times.';
      }
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
  }
})();
