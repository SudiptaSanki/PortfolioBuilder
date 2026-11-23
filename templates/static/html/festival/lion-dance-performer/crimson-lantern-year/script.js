/* Crimson Lantern Year — lion dance booking ledger.
   Vanilla JS: mobile ledger menu, season explorer, enquiry form.
   No audio anywhere on this site — by ruling, not by omission:
   a troupe's sound is the product, and a synthesis would misrepresent it. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition aborts surface as unhandled rejections in Chrome;
     the navigation itself always completes. Swallow only that case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (btn && panel) {
    var firstLink = panel.querySelector('a');
    function openMenu() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    }
    function closeMenu(returnFocus) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeMenu(false); else openMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });
  }

  /* ---------- reveal on scroll (opacity only, reduced-motion safe) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.06 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- booking explorer ---------- */
  var SHEETS = {
    caiqing: {
      name: 'Corporate cai qing visit',
      lions: '1 lion',
      duration: '25–40 min route · up to 12 stops',
      floor: 'Route-based — clear 3 m × 3 m at each stop',
      ceiling: '2.7 m minimum — the lion rears to about 2.4 m',
      fee: 'A$880',
      feeNote: 'from · metro Melbourne',
      roles: [
        ['Lion — head & tail', 2], ['Drum', 1], ['Gong', 1],
        ['Cymbals', 2], ['Cai qing host', 1], ['Coordinator & route marshal', 1]
      ],
      note: 'The lion visits each office or shopfront in turn, takes the lettuce at the door, and finishes with a full-percussion stop in the lobby. We supply the lettuces and the scroll. The red packet at the final stop is yours to give, if you wish — the lion never asks.'
    },
    atrium: {
      name: 'Shopping centre atrium show',
      lions: '2 lions',
      duration: '18 min set · one or two sets per visit',
      floor: '8 m × 8 m clear, level and dry',
      ceiling: 'Ground set 4 m · pole set needs 6.5 m clear above the floor',
      fee: 'A$1,450',
      feeNote: 'from · ground set — pole set +A$450 after a clearance survey',
      roles: [
        ['Lions — two pairs', 4], ['Drum', 1], ['Gong', 1],
        ['Cymbals', 2], ['Cai qing host', 1], ['Coordinator', 1]
      ],
      note: 'The pole set is only sold after we have measured your ceiling ourselves. If the clearance is not there, we tell you in writing and rebuild the show on the ground — that is exactly what happened in Case 02.'
    },
    school: {
      name: 'School assembly programme',
      lions: '1 lion',
      duration: '30 min · 12 min performance, then talk & meet-the-lion',
      floor: '6 m × 6 m of hall floor · front rows seated 3 m back',
      ceiling: '3 m minimum',
      fee: 'A$690',
      feeNote: 'from · one assembly — same-day second assembly A$390',
      roles: [
        ['Lion — head & tail', 2], ['Drum (damped)', 1], ['Gong', 1],
        ['Cymbals', 1], ['Cai qing host', 1], ['Coordinator & teacher liaison', 1]
      ],
      note: 'Built for young and noise-sensitive audiences: the drum is damped, the cymbals rest for the first half, and the lion is introduced asleep before it wakes. Ear defenders are welcome and are mentioned in the teacher pack we send ahead.'
    },
    parade: {
      name: 'Street parade & festival route',
      lions: '2 lions',
      duration: '45–60 min route · up to 1.2 km',
      floor: 'Route-based · road closure and crowd marshals by the organiser',
      ceiling: 'None — overhead wires, banners and low branches checked on the route walk',
      fee: 'A$1,900',
      feeNote: 'from · within the festival precinct',
      roles: [
        ['Lions — two pairs', 4], ['Drum', 1], ['Gong', 1],
        ['Cymbals', 2], ['Banner carriers', 2], ['Cai qing host', 1], ['Coordinator', 1]
      ],
      note: 'We walk the route with the organiser in the week before. Rain plan, in writing: papier-mâché heads do not perform in rain, so the booking converts to the covered-area plan or a reschedule credit — decided together by 7 am on the day.'
    }
  };

  var xBtns = document.querySelectorAll('.xbtn');
  var xSheet = document.getElementById('xSheet');
  if (xBtns.length && xSheet) {
    var xName = document.getElementById('xName'),
        xLions = document.getElementById('xLions'),
        xDuration = document.getElementById('xDuration'),
        xFloor = document.getElementById('xFloor'),
        xCeiling = document.getElementById('xCeiling'),
        xFee = document.getElementById('xFee'),
        xFeeNote = document.getElementById('xFeeNote'),
        xRoles = document.getElementById('xRoles'),
        xTotal = document.getElementById('xTotal'),
        xNote = document.getElementById('xNote');
    function renderSheet(key) {
      var s = SHEETS[key];
      if (!s) return;
      xName.textContent = s.name;
      xLions.textContent = s.lions;
      xDuration.textContent = s.duration;
      xFloor.textContent = s.floor;
      xCeiling.textContent = s.ceiling;
      xFee.textContent = s.fee;
      xFeeNote.textContent = s.feeNote;
      xNote.textContent = s.note;
      var total = 0, html = '';
      s.roles.forEach(function (r) {
        total += r[1];
        html += '<li><span>' + r[0] + '</span><span class="r-n">' + r[1] + '</span></li>';
      });
      xRoles.innerHTML = html;
      xTotal.textContent = total;
      xBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-sheet') === key ? 'true' : 'false');
      });
    }
    xBtns.forEach(function (b) {
      b.addEventListener('click', function () { renderSheet(b.getAttribute('data-sheet')); });
    });
    renderSheet('caiqing');
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var fields = {
      fName: { el: document.getElementById('fName'), test: function (v) { return v.trim().length >= 2; } },
      fEmail: { el: document.getElementById('fEmail'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      fType: { el: document.getElementById('fType'), test: function (v) { return v !== ''; } },
      fDate: { el: document.getElementById('fDate'), test: function (v) { return v.trim().length >= 4; } }
    };
    function validateField(key) {
      var f = fields[key];
      var ok = f.test(f.el.value);
      var wrap = f.el.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', !ok);
      f.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }
    Object.keys(fields).forEach(function (key) {
      var el = fields[key].el;
      el.addEventListener('input', function () { validateField(key); });
      el.addEventListener('change', function () { validateField(key); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = true, firstBad = null;
      Object.keys(fields).forEach(function (key) {
        var ok = validateField(key);
        if (!ok) { allOk = false; if (!firstBad) firstBad = fields[key].el; }
      });
      if (!allOk) { if (firstBad) firstBad.focus(); return; }
      var ref = 'CLT-2026-' + Math.floor(100 + Math.random() * 900);
      var typeSel = fields.fType.el;
      var typeText = typeSel.options[typeSel.selectedIndex].text;
      document.getElementById('cRef').textContent = ref;
      document.getElementById('cSummary').textContent =
        fields.fName.el.value.trim() + ' · ' + typeText + ' · ' + fields.fDate.el.value.trim();
      form.hidden = true;
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function () {
      form.reset();
      Object.keys(fields).forEach(function (key) {
        var wrap = fields[key].el.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
        fields[key].el.setAttribute('aria-invalid', 'false');
      });
      confirmBox.classList.remove('show');
      form.hidden = false;
      fields.fName.el.focus();
    });
  }
})();
