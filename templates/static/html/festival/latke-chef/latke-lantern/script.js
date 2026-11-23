/* The Latke Lantern — contents panel, Batch & Fry Planner, order form.
   No audio, no libraries. */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly in some browsers;
     swallow only that specific rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- Contents panel (mobile nav) ---------- */
  var btn = document.querySelector('.contents-btn');
  var panel = document.getElementById('toc-panel');
  if (btn && panel) {
    var setOpen = function (open) {
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', function () {
      setOpen(!panel.classList.contains('open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        setOpen(false);
        btn.focus();
      }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
  }

  /* ---------- Batch & Fry Planner ----------
     Reads the same numbers printed in the recipe card on the page:
     per batch of 12 latkes — 1 kg potatoes, 1 onion, 2 eggs,
     30 g matzo meal, 200 ml oil; 4 to a pan, 3 min a side,
     3 pan-loads a batch; classic dozen $24. */
  var planner = document.getElementById('planner');
  if (planner) {
    var state = { guests: 12, perGuest: 3, pans: 1 };
    var LIMITS = { guests: { min: 1, max: 200 }, perGuest: { min: 1, max: 8 } };
    var out = {};
    ['guests', 'perGuest'].forEach(function (k) { out[k] = document.getElementById('p-' + k); });
    ['needed', 'made', 'batches', 'potatoes', 'onions', 'eggs', 'meal', 'oil', 'loads', 'fry', 'cost']
      .forEach(function (k) { out[k] = document.getElementById('o-' + k); });
    var verdict = document.getElementById('p-verdict');
    var verdictText = document.getElementById('p-verdict-text');

    function fmtOil(ml) {
      return ml >= 1000 ? (ml / 1000).toFixed(1).replace(/\.0$/, '') + ' L' : ml + ' ml';
    }
    function fmtTime(min) {
      if (min < 60) return min + ' min';
      var h = Math.floor(min / 60), m = min % 60;
      return m ? h + ' h ' + m + ' min' : h + ' h';
    }

    function render() {
      var needed = state.guests * state.perGuest;
      var batches = Math.ceil(needed / 12);
      var made = batches * 12;
      var loads = batches * 3;
      var fry = Math.ceil(loads / state.pans) * 6;

      out.guests.textContent = state.guests;
      out.perGuest.textContent = state.perGuest;
      out.needed.textContent = needed;
      out.made.textContent = made === needed ? '' : ' (you will fry ' + made + ' — plan the batches in whole dozens)';
      out.batches.textContent = batches;
      out.potatoes.textContent = batches + ' kg';
      out.onions.textContent = batches;
      out.eggs.textContent = batches * 2;
      out.meal.textContent = batches * 30 + ' g';
      out.oil.textContent = fmtOil(batches * 200);
      out.loads.textContent = loads;
      out.fry.textContent = fmtTime(fry);
      out.cost.textContent = '$' + batches * 24;

      var cls, msg;
      if (fry > 150) {
        cls = 'over';
        msg = 'That is ' + fmtTime(fry) + ' at the stove, and latkes held too long go soft while they wait. ' +
          'Split the crowd across two nights, or book the on-site event fry (see the menu) and I bring a second cook and more pans.';
      } else if (state.pans === 1 && fry > 90) {
        cls = 'warn';
        msg = 'One pan can do it, but you will be standing a while. A second pan cuts the frying to ' +
          fmtTime(Math.ceil(loads / 2) * 6) + ' — borrow one before the first night, not during it.';
      } else {
        cls = 'ok';
        msg = 'Workable at one stove. Heat the oil 20 minutes before the first guests, fry in waves, ' +
          'and hold finished latkes on a rack in a 100°C oven — never stacked, never covered.';
      }
      verdict.className = 'verdict ' + cls;
      verdictText.textContent = msg;
    }

    planner.querySelectorAll('.stepper button').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-key');
        var d = parseInt(b.getAttribute('data-d'), 10);
        var lim = LIMITS[key];
        state[key] = Math.min(lim.max, Math.max(lim.min, state[key] + d));
        render();
      });
    });
    planner.querySelectorAll('.panset button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.pans = parseInt(b.getAttribute('data-pans'), 10);
        planner.querySelectorAll('.panset button').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        render();
      });
    });
    render();
  }

  /* ---------- Order form ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    var confirmBox = document.getElementById('confirm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var name = document.getElementById('f-name').value.trim().split(' ')[0] || 'friend';
      var nightSel = document.getElementById('f-night');
      var night = nightSel.options[nightSel.selectedIndex].text;
      var ref = 'LL-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('c-name').textContent = name;
      document.getElementById('c-night').textContent = night;
      document.getElementById('c-ref').textContent = ref;
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
  }
})();
