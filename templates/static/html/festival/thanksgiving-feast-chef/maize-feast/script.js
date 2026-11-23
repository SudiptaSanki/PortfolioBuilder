/* The Maize Feast — menu, Feast Planner, booking form. No sound, no libraries. */
(function () {
  'use strict';

  /* View-transition abort guard: an interrupted page turn rejects its
     promise; swallow only that specific rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- Sections panel (mobile nav) ---------- */
  var btn = document.getElementById('sectionsBtn');
  var panel = document.getElementById('sectionsPanel');
  if (btn && panel) {
    var closePanel = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closePanel();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closePanel();
        btn.focus();
      }
    });
  }

  /* ---------- Feast Planner ---------- */
  var guestOut = document.getElementById('guestOut');
  if (guestOut) {
    var guests = 40;
    var GMIN = 10, GMAX = 400, GSTEP = 5;
    var minus = document.getElementById('guestMinus');
    var plus = document.getElementById('guestPlus');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-dish]'));
    var dateInput = document.getElementById('feastDate');
    var outEars = document.getElementById('outEars');
    var outMeal = document.getElementById('outMeal');
    var outHominy = document.getElementById('outHominy');
    var outHours = document.getElementById('outHours');
    var outWood = document.getElementById('outWood');
    var verdict = document.getElementById('verdict');

    /* Rates are read from the printed reckoning table itself, so the
       tool and the page can never disagree. */
    var rates = {};
    Array.prototype.forEach.call(document.querySelectorAll('#reckonTable tr[data-key]'), function (tr) {
      rates[tr.getAttribute('data-key')] = {
        ears: parseFloat(tr.getAttribute('data-ears')) || 0,
        meal: parseFloat(tr.getAttribute('data-meal')) || 0,
        hominy: parseFloat(tr.getAttribute('data-hominy')) || 0
      };
    });

    var fmt = function (n) {
      return (Math.round(n * 10) / 10).toString().replace(/\.0$/, '');
    };
    var fmtKg = function (g) {
      var kg = g / 1000;
      return (Math.round(kg * 10) / 10).toFixed(1) + ' kg';
    };

    var inFreshWindow = function (value) {
      if (!value) return null;
      var parts = value.split('-');
      var m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
      if ((m === 7 && d >= 20) || m === 8 || m === 9 || (m === 10 && d <= 10)) return true;
      return false;
    };

    var compute = function () {
      guestOut.textContent = guests;
      var chosen = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; });
      if (!chosen.length) {
        outEars.textContent = '—';
        outMeal.textContent = '—';
        outHominy.textContent = '—';
        outHours.textContent = '—';
        outWood.textContent = '—';
        verdict.innerHTML = '<strong>No dishes ticked.</strong> A feast of plain firewood is a bonfire, not a dinner. Tick at least one dish and I will do the sums.';
        return;
      }
      var ears = 0, meal = 0, hominy = 0;
      chosen.forEach(function (c) {
        var r = rates[c.getAttribute('data-dish')];
        if (!r) return;
        ears += r.ears * guests;
        meal += r.meal * guests;
        hominy += r.hominy * guests;
      });
      var earsPicked = Math.ceil(ears * 11 / 10); /* the cook's share, in whole ears */
      var hours = 3 + 0.5 * Math.max(0, chosen.length - 2);
      var wood = 7 * hours;
      outEars.textContent = earsPicked.toLocaleString('en-US');
      outMeal.textContent = fmtKg(meal);
      outHominy.textContent = fmtKg(hominy);
      outHours.textContent = fmt(hours) + ' h';
      outWood.textContent = fmt(wood) + ' kg';

      var fresh = inFreshWindow(dateInput.value);
      if (fresh === true) {
        verdict.innerHTML = '<strong>In the fresh window.</strong> Your corn is picked the same morning and grilled in the husk — sweet corn at its brief, loud best. The meal and hominy still come from last October\'s store; that is how a feast covers the whole plant.';
      } else if (fresh === false) {
        verdict.innerHTML = '<strong>Outside the fresh window — and the menu says so.</strong> That date eats from the preserved store: nixtamal hominy, stone-ground polenta, skillet cornbread, and creamed corn frozen at the September peak. Same fire, same cook. February has eaten very well at my table.';
      } else {
        verdict.innerHTML = 'Pick a date and I will tell you which corn you are eating — fresh off the stalk, or out of the store cupboard.';
      }
    };

    minus.addEventListener('click', function () {
      guests = Math.max(GMIN, guests - GSTEP);
      compute();
    });
    plus.addEventListener('click', function () {
      guests = Math.min(GMAX, guests + GSTEP);
      compute();
    });
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var on = c.getAttribute('aria-pressed') === 'true';
        c.setAttribute('aria-pressed', on ? 'false' : 'true');
        compute();
      });
    });
    dateInput.addEventListener('change', compute);
    compute();
  }

  /* ---------- Booking form ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    var note = document.getElementById('formNote');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var date = document.getElementById('fDate').value;
      var guestsVal = document.getElementById('fGuests').value.trim();
      var kind = document.getElementById('fKind').value;
      if (!name || !email || email.indexOf('@') === -1 || !date || !guestsVal) {
        note.textContent = 'A few things are missing — your name, a reachable email, the date, and a rough head count are all I need.';
        note.style.color = '#9E3B24';
        note.style.fontWeight = '700';
        return;
      }
      var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      var ref = 'MF-2026-';
      for (var i = 0; i < 4; i++) {
        ref += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      document.getElementById('confName').textContent = name.split(' ')[0];
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confSummary').textContent =
        'A ' + kind.toLowerCase() + ' for about ' + guestsVal + ' guests, on ' + date +
        '. I\'ll answer within two days with the reckoning in writing — ears, meal, firewood and the price.';
      form.hidden = true;
      var box = document.getElementById('confirmBox');
      box.hidden = false;
      box.focus();
      box.scrollIntoView({ block: 'center' });
    });
  }
})();
