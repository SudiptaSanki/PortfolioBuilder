/* Lotus Blush — shared script: mobile nav, view-transition guard,
   programme planner (index), booking form confirmation (contact). */
(function () {
  'use strict';

  /* View transitions: swallow the known abort rejection only. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* Footer year */
  document.querySelectorAll('.yr').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- mobile nav ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (btn && panel) {
    var close = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus({ preventScroll: true });
        });
      }
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        close();
        btn.focus();
      }
    });
  }

  /* ---------- programme planner (index only) ---------- */
  var pickList = document.getElementById('pickList');
  if (pickList) {
    var picks = Array.prototype.slice.call(pickList.querySelectorAll('.pick-in'));
    var intervalIn = document.getElementById('intervalIn');
    var travelIn = document.getElementById('travelIn');
    var slotVal = document.getElementById('slotVal');
    var outDance = document.getElementById('outDance');
    var outRun = document.getElementById('outRun');
    var outFee = document.getElementById('outFee');
    var verdict = document.getElementById('verdict');
    var slot = 120;

    var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };

    var compute = function () {
      var chosen = picks.filter(function (p) { return p.checked; });
      var dance = chosen.reduce(function (s, p) { return s + parseInt(p.dataset.minutes, 10); }, 0);
      var interval = intervalIn.checked ? 15 : 0;
      var run = dance + interval;
      var fee = 0;
      if (dance > 0) {
        fee = 18000 + Math.max(0, dance - 30) * 400 + 16000 + (travelIn.checked ? 1200 : 0);
      }
      outDance.textContent = dance + ' min';
      outRun.textContent = run + ' min';
      outFee.textContent = inr(fee);
      slotVal.textContent = slot + ' min';

      verdict.classList.remove('over');
      if (dance === 0) {
        verdict.innerHTML = 'Tick at least one item and I will cost the evening honestly. A programme with no items has no fee — and, sadly, no dance.';
        return;
      }
      if (run > slot) {
        var over = run - slot;
        var fits = chosen.filter(function (p) { return run - parseInt(p.dataset.minutes, 10) <= slot; });
        if (fits.length) {
          fits.sort(function (a, b) { return parseInt(b.dataset.minutes, 10) - parseInt(a.dataset.minutes, 10); });
          var drop = fits[0];
          verdict.classList.add('over');
          verdict.innerHTML = 'Over your slot by <b>' + over + ' min</b>. Do not hurry the dance — drop an item. Dropping the <b>' +
            drop.dataset.name + '</b> (' + drop.dataset.minutes + ' min) brings the evening to ' + (run - parseInt(drop.dataset.minutes, 10)) +
            ' min, inside your slot with room to breathe.';
        } else {
          var longest = chosen.slice().sort(function (a, b) { return parseInt(b.dataset.minutes, 10) - parseInt(a.dataset.minutes, 10); })[0];
          verdict.classList.add('over');
          verdict.innerHTML = 'Over your slot by <b>' + over + ' min</b>, and no single item dropped fixes it. Start by dropping the <b>' +
            longest.dataset.name + '</b> (' + longest.dataset.minutes + ' min), then look again — or ask the venue for a longer slot. I will not squeeze a margam into a space it does not fit.';
        }
        return;
      }
      if (run === slot) {
        verdict.innerHTML = 'Fits — exactly. There is no room for a late start, so I will ask the organisers to hold the item before mine to its time. The dance itself will not be hurried.';
        return;
      }
      verdict.innerHTML = 'Fits, with <b>' + (slot - run) + ' min</b> to spare. Room for the lamp to be lit properly, the musicians to settle, and nobody to run. This is how an evening should fit.';
    };

    picks.forEach(function (p) { p.addEventListener('change', compute); });
    intervalIn.addEventListener('change', compute);
    travelIn.addEventListener('change', compute);
    document.getElementById('slotMinus').addEventListener('click', function () {
      slot = Math.max(30, slot - 15); compute();
    });
    document.getElementById('slotPlus').addEventListener('click', function () {
      slot = Math.min(240, slot + 15); compute();
    });
    compute();
  }

  /* ---------- booking form (contact only) ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName');
      var email = document.getElementById('fEmail');
      if (!name.value.trim()) { name.focus(); return; }
      if (!email.value.trim() || email.value.indexOf('@') < 1) { email.focus(); return; }
      var ref = 'LB-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      var type = document.getElementById('fType').value;
      var date = document.getElementById('fDate').value.trim();
      var venue = document.getElementById('fVenue').value.trim();
      document.getElementById('refOut').textContent = ref;
      document.getElementById('confirmSummary').textContent =
        'Thank you, ' + name.value.trim().split(' ')[0] + '. Your enquiry — a ' + type.toLowerCase() +
        (date ? ', ' + date : '') + (venue ? ', at ' + venue : '') +
        ' — is noted under this reference. I will reply within two days with a written quote.';
      form.hidden = true;
      var box = document.getElementById('confirmBox');
      box.hidden = false;
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
})();
