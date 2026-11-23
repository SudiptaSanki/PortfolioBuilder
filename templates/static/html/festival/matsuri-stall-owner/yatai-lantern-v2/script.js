/* Sato-ya — menu panel, festival prep planner, booking form.
   The planner reads every rate from the table printed on the page;
   there are no hidden numbers in this file. */
(function () {
  'use strict';

  /* A cross-page view transition that gets interrupted (fast double
     navigation) rejects its promise; swallow only that rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu: a stack of sign boards ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (btn && panel) {
    var closeBtn = document.getElementById('menuClose');
    var firstLink = panel.querySelector('nav a');
    function openMenu() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      if (firstLink) firstLink.focus();
    }
    function closeMenu() {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      btn.focus();
    }
    btn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    panel.addEventListener('click', function (e) { if (e.target === panel) closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
    });
  }

  /* ---------- festival prep planner (index only) ---------- */
  var footEl = document.getElementById('footfallVal');
  if (footEl) {
    var table = document.getElementById('rateTable');
    var stopRate = parseFloat(table.getAttribute('data-stop-rate'));
    var capPerHour = parseFloat(table.getAttribute('data-cap'));
    var capShort = parseFloat(table.getAttribute('data-cap-short'));
    var dishes = {};
    table.querySelectorAll('tr[data-dish]').forEach(function (row) {
      dishes[row.getAttribute('data-dish')] = {
        share: parseFloat(row.getAttribute('data-share')),
        price: parseFloat(row.getAttribute('data-price'))
      };
    });
    var batterPer = parseFloat(table.getAttribute('data-batter-per'));   /* portions per litre */
    var sauceMl = parseFloat(table.getAttribute('data-sauce-ml'));       /* ml per takoyaki */
    var gasHours = parseFloat(table.getAttribute('data-gas-hours'));     /* hours per canister */

    var state = { footfall: 800, hours: 5 };
    var footVal = document.getElementById('footfallVal');
    var hourVal = document.getElementById('hoursVal');
    var yen = function (n) { return '¥' + n.toLocaleString('en-US'); };

    function compute() {
      var buyers = Math.round(state.footfall * stopRate);
      var tako = Math.round(buyers * dishes.takoyaki.share);
      var yaki = Math.round(buyers * dishes.yakisoba.share);
      var corn = buyers - tako - yaki;
      var batter = Math.ceil((tako / batterPer) * 2) / 2;
      var sauce = (tako * sauceMl / 1000).toFixed(1);
      var gas = Math.ceil(state.hours / gasHours) + 1;
      var takings = tako * dishes.takoyaki.price + yaki * dishes.yakisoba.price + corn * dishes.corn.price;
      var cap = capPerHour * state.hours;
      var capShortTotal = capShort * state.hours;

      document.getElementById('rBuyers').textContent = buyers.toLocaleString('en-US');
      document.getElementById('rTako').textContent = tako.toLocaleString('en-US');
      document.getElementById('rYaki').textContent = yaki.toLocaleString('en-US');
      document.getElementById('rCorn').textContent = corn.toLocaleString('en-US');
      document.getElementById('rBatter').textContent = batter.toFixed(1) + ' L';
      document.getElementById('rSauce').textContent = sauce + ' L';
      document.getElementById('rPacks').textContent = yaki.toLocaleString('en-US');
      document.getElementById('rCobs').textContent = corn.toLocaleString('en-US');
      document.getElementById('rGas').textContent = gas.toLocaleString('en-US');
      document.getElementById('rTakings').textContent = yen(takings);

      var warn = document.getElementById('plannerWarn');
      var ok = document.getElementById('plannerOk');
      if (buyers > cap) {
        warn.innerHTML = '<b>One stall cannot serve that crowd.</b> The grill line caps at ' +
          capPerHour + ' customers an hour — ' + cap.toLocaleString('en-US') + ' in ' + state.hours +
          ' hours — so the last ' + (buyers - cap).toLocaleString('en-US') +
          ' people in the queue would never reach the counter. Two honest fixes: book a <b>second stall</b> beside mine (the cap doubles to ' +
          (cap * 2).toLocaleString('en-US') + '), or run the <b>short menu</b> — takoyaki and corn only — and the line moves at ' +
          capShort + ' an hour, ' + capShortTotal.toLocaleString('en-US') + ' across the night. Prep above is for the full ' +
          buyers.toLocaleString('en-US') + '; do not cook it all for one stall.';
        warn.classList.add('show');
        ok.classList.remove('show');
      } else {
        warn.classList.remove('show');
        ok.textContent = 'Within one stall\u2019s reach: ' + buyers.toLocaleString('en-US') +
          ' buyers against a ' + cap.toLocaleString('en-US') + '-customer cap over ' + state.hours + ' hours.';
        ok.classList.add('show');
      }
    }

    function bindStepper(minusId, plusId, key, step, min, max, valEl, fmt) {
      var minus = document.getElementById(minusId);
      var plus = document.getElementById(plusId);
      function render() { valEl.firstChild.textContent = fmt(state[key]); }
      minus.addEventListener('click', function () {
        state[key] = Math.max(min, state[key] - step); render(); compute();
      });
      plus.addEventListener('click', function () {
        state[key] = Math.min(max, state[key] + step); render(); compute();
      });
    }
    bindStepper('footMinus', 'footPlus', 'footfall', 100, 100, 6000, footVal,
      function (v) { return v.toLocaleString('en-US'); });
    bindStepper('hourMinus', 'hourPlus', 'hours', 1, 2, 12, hourVal,
      function (v) { return String(v); });
    compute();
  }

  /* ---------- booking form (contact only) ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var type = document.getElementById('fType').value;
      var ref = 'YT-2027-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmLine').textContent =
        'Thank you, ' + (name || 'friend') + '. Your note about \u201C' + type +
        '\u201D is on the stall board. I reply within two days — slower in festival weeks, when the lanterns come first.';
      form.style.display = 'none';
      var c = document.getElementById('confirmBox');
      c.classList.add('show');
      c.setAttribute('tabindex', '-1');
      c.focus();
    });
  }
})();
