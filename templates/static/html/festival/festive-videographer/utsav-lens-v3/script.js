/* Utsav Lens — festive videographer, Pune.
   Clip reveals run on a scroll position check (never IntersectionObserver:
   a fully clipped element reports zero intersection with itself).
   No audio anywhere on this site. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* An aborted view transition rejects its promise; swallow only that. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile panel ---------- */
  var openBtn = document.querySelector('.menu-btn');
  var closeBtn = document.querySelector('.panel-close');
  var scrim = document.querySelector('.panel-scrim');
  var panel = document.querySelector('.mobile-panel');

  function setPanel(open) {
    document.body.classList.toggle('panel-open', open);
    if (openBtn) openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && panel) {
      var first = panel.querySelector('a');
      requestAnimationFrame(function () { if (first) first.focus({ preventScroll: true }); });
    }
    if (!open && openBtn) openBtn.focus({ preventScroll: true });
  }
  if (openBtn) openBtn.addEventListener('click', function () { setPanel(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setPanel(false); });
  if (scrim) scrim.addEventListener('click', function () { setPanel(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('panel-open')) setPanel(false);
  });

  /* ---------- clip reveals: scroll position check ---------- */
  var clips = Array.prototype.slice.call(document.querySelectorAll('.clip'));
  function checkClips() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = clips.length - 1; i >= 0; i--) {
      var r = clips[i].getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        clips[i].classList.add('in');
        clips.splice(i, 1);
      }
    }
  }
  if (clips.length) {
    if (reduced) {
      clips.forEach(function (el) { el.classList.add('in'); });
      clips = [];
    } else {
      var ticking = false;
      function onScroll() {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(function () { checkClips(); ticking = false; });
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      window.addEventListener('load', checkClips);
      checkClips();
    }
  }

  /* ---------- shoot planner ---------- */
  /* Rates below are the same figures printed in the rate table on the page. */
  var RATES = {
    dayOneCam: 28000,      /* ₹ per festival day, one camera */
    dayTwoCam: 44000,      /* ₹ per festival day, two cameras */
    film8: 12000,          /* 8-minute film, added to the included 3-minute cut */
    film20: 26000,         /* 20-minute film, added instead */
    reelExtra: 3500,       /* per reel after the first */
    photoSet: 9000,        /* per booking */
    hoursPerDay: 10,       /* shooting hours in one festival day */
    cutoffDays: 21         /* bookings close 21 days before the first day */
  };
  var EDIT_DAYS = { '3': 4, '8': 7, '20': 12 };
  var BOOKED = ['2026-09-14', '2026-09-15', '2026-10-20', '2026-11-08', '2027-03-03'];

  var form = document.getElementById('planner-form');
  if (form) {
    var out = {
      hours: document.getElementById('out-hours'),
      edit: document.getElementById('out-edit'),
      delivery: document.getElementById('out-delivery'),
      price: document.getElementById('out-price'),
      lines: document.getElementById('out-lines'),
      notice: document.getElementById('planner-notice')
    };
    var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
    var fmtDate = function (d) {
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };
    var parseDay = function (v) {
      var p = v.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    };

    function plan() {
      var dateVal = document.getElementById('p-date').value;
      var days = Math.max(1, Math.min(5, parseInt(document.getElementById('p-days').value, 10) || 1));
      var cams = document.querySelector('input[name="p-cams"]:checked').value;
      var film = document.getElementById('p-film').value;
      var reels = Math.max(1, Math.min(6, parseInt(document.getElementById('p-reels').value, 10) || 1));
      var photos = document.getElementById('p-photos').checked;

      var dayRate = cams === '2' ? RATES.dayTwoCam : RATES.dayOneCam;
      var shootCost = days * dayRate;
      var filmCost = film === '8' ? RATES.film8 : film === '20' ? RATES.film20 : 0;
      var reelCost = (reels - 1) * RATES.reelExtra;
      var photoCost = photos ? RATES.photoSet : 0;
      var total = shootCost + filmCost + reelCost + photoCost;

      var hours = days * RATES.hoursPerDay;
      var editDays = EDIT_DAYS[film] + Math.max(0, reels - 2) + (photos ? 2 : 0);

      out.hours.textContent = hours + ' hrs';
      out.edit.textContent = editDays + ' days';
      out.price.textContent = inr(total);

      var lines = [];
      lines.push(days + (days === 1 ? ' day' : ' days') + ' × ' + inr(dayRate) +
        ' (' + (cams === '2' ? 'two cameras' : 'one camera') + ') = ' + inr(shootCost));
      lines.push(film === '3' ? '3-minute film: included' :
        film + '-minute film: +' + inr(filmCost) + ' over the included 3-minute cut');
      lines.push(reels === 1 ? '1 vertical reel: included' :
        reels + ' vertical reels: first included, ' + (reels - 1) + ' × ' + inr(RATES.reelExtra) + ' = ' + inr(reelCost));
      lines.push(photos ? 'Photo set of 150 stills: +' + inr(RATES.photoSet) : 'Photo set: not added');
      out.lines.innerHTML = lines.map(function (l) { return '<li>' + l + '</li>'; }).join('');

      var notes = [];
      if (dateVal) {
        var first = parseDay(dateVal);
        var last = new Date(first); last.setDate(last.getDate() + days - 1);
        var delivery = new Date(last); delivery.setDate(delivery.getDate() + editDays);
        out.delivery.textContent = fmtDate(delivery);

        var clash = [];
        for (var i = 0; i < days; i++) {
          var d = new Date(first); d.setDate(d.getDate() + i);
          var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          if (BOOKED.indexOf(key) !== -1) clash.push(fmtDate(d));
        }
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var until = Math.round((first - today) / 86400000);
        if (clash.length) {
          notes.push('<strong>Already booked.</strong> ' + clash.join(' and ') +
            (clash.length === 1 ? ' is' : ' are') +
            ' already on the slate — the Ganpati mandals and the housing society booked those days months out. Two honest options: join the waitlist in case a day frees up, or take the second-shooter cover — my regular second operator leads, I shoot the aarti and visarjan hours myself and edit everything. Use the contact form and name the date.');
        } else if (until < RATES.cutoffDays) {
          notes.push('<strong>Inside the cut-off.</strong> Bookings close ' + RATES.cutoffDays +
            ' days before the first festival day, because permissions, a second operator and battery-and-card logistics cannot be arranged honestly at the last minute. If the festival cannot move, ask about the waitlist — cancellations do happen in the final week.');
        }
      } else {
        out.delivery.textContent = 'Pick a date';
      }
      if (notes.length) {
        out.notice.innerHTML = notes.join('<br>');
        out.notice.hidden = false;
      } else {
        out.notice.hidden = true;
        out.notice.innerHTML = '';
      }
    }
    form.addEventListener('input', plan);
    form.addEventListener('change', plan);
    plan();
  }

  /* ---------- contact form ---------- */
  var enquiry = document.getElementById('enquiry-form');
  if (enquiry) {
    enquiry.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('c-name').value.trim();
      var fest = document.getElementById('c-festival').value.trim();
      var ref = 'UL-' + new Date().getFullYear() + '-' +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      var box = document.getElementById('confirm');
      document.getElementById('confirm-ref').textContent = ref;
      document.getElementById('confirm-line').textContent =
        'Thank you' + (name ? ', ' + name.split(' ')[0] : '') + '. Your enquiry about ' +
        (fest || 'your festival') + ' is on the slate. Tara replies within two working days with the booked-dates picture for your week and a planner run-through at these same printed rates.';
      box.hidden = false;
      box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }
})();
