/* Thali Art — Ritu Saran
   Mobile panel, the Thali Set Planner (reads the same numbers as the
   printed tables on index.html), and the enquiry form confirmation.
   No audio, no trackers, no scroll effects — the frame is stillness. */
(function () {
  'use strict';

  /* View-transition abort guard: rapid repeat navigation can make the
     browser skip a CSS view transition and surface an InvalidStateError
     as an unhandled rejection. Swallow exactly that error, nothing else. */
  window.addEventListener('unhandledrejection', function (e) {
    if (e && e.reason && e.reason.name === 'InvalidStateError') e.preventDefault();
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile panel ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (menuBtn && panel) {
    var firstLink = panel.querySelector('a');
    function setPanel(open) {
      panel.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
      if (open && firstLink) {
        if (reduceMotion) { firstLink.focus({ preventScroll: true }); }
        else { requestAnimationFrame(function () { firstLink.focus({ preventScroll: true }); }); }
      }
    }
    menuBtn.addEventListener('click', function () {
      setPanel(!panel.classList.contains('open'));
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setPanel(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        setPanel(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- planner ---------- */
  var plannerEl = document.querySelector('.planner');
  if (plannerEl) {
    var PLATES = {
      '8':  { w: 360, brass: 1450, copper: 1680, silver: 2750 },
      '10': { w: 470, brass: 1850, copper: 2140, silver: 3450 },
      '12': { w: 610, brass: 2390, copper: 2760, silver: 4390 }
    };
    var PIECES = {
      diya:      { w: 90,  brass: 320, copper: 360, silver: 590 },
      kalash:    { w: 210, brass: 640, copper: 720, silver: 1180 },
      bell:      { w: 110, brass: 390, copper: 430, silver: 690 },
      incense:   { w: 60,  brass: 210, copper: 240, silver: 390 },
      roli:      { w: 45,  brass: 160, copper: 180, silver: 290 },
      kumkum:    { w: 45,  brass: 160, copper: 180, silver: 290 },
      camphor:   { w: 130, brass: 420, copper: 470, silver: 760 },
      panchpatra:{ w: 120, brass: 380, copper: 430, silver: 690 },
      flower:    { w: 95,  brass: 300, copper: 340, silver: 540 },
      gangajal:  { w: 150, brass: 460, copper: 520, silver: 840 }
    };
    var ENGRAVING_PRICE = 450, ENGRAVING_DAYS = 9, PLAIN_DAYS = 3;

    var state = { metal: 'brass', size: '10', engraving: false };
    var outItems = document.getElementById('outItems');
    var outWeight = document.getElementById('outWeight');
    var outPrice = document.getElementById('outPrice');
    var verdict = document.getElementById('verdict');
    var needBy = document.getElementById('needBy');
    var defaultVerdict = verdict.innerHTML;

    function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
    function fmtDate(d) {
      return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    function dayMs(n) { return n * 86400000; }

    function compute() {
      var plate = PLATES[state.size];
      var weight = plate.w;
      var price = plate[state.metal];
      var items = 1;
      plannerEl.querySelectorAll('.chip[aria-pressed="true"]').forEach(function (chip) {
        var p = PIECES[chip.getAttribute('data-piece')];
        if (!p) return;
        weight += p.w;
        price += p[state.metal];
        items += 1;
      });
      if (state.engraving) price += ENGRAVING_PRICE;
      outItems.textContent = String(items);
      outWeight.textContent = weight.toLocaleString('en-IN') + ' g';
      outPrice.textContent = inr(price);

      var lead = state.engraving ? ENGRAVING_DAYS : PLAIN_DAYS;
      if (!needBy.value) {
        verdict.className = 'verdict';
        verdict.innerHTML = defaultVerdict;
        return;
      }
      var parts = needBy.value.split('-').map(Number);
      var need = new Date(parts[0], parts[1] - 1, parts[2]);
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var days = Math.round((need.getTime() - today.getTime()) / 86400000);
      var ready = new Date(today.getTime() + dayMs(lead));
      if (days < 0) {
        verdict.className = 'verdict warn';
        verdict.innerHTML = 'That date has already passed. Pick a day at least <b>' + lead + ' days</b> from today and I will set the plate for it.';
      } else if (days >= lead) {
        verdict.className = 'verdict ok';
        verdict.innerHTML = state.engraving
          ? 'It fits. Hand engraving takes its <b>9 clear days</b>, and your set can still be ready by <b>' + fmtDate(ready) + '</b> — ahead of ' + fmtDate(need) + '.'
          : 'Ready in time. A plain set leaves the bench in <b>3 days</b> — this one can be ready by <b>' + fmtDate(ready) + '</b>, ahead of ' + fmtDate(need) + '.';
      } else if (state.engraving) {
        var plainReady = new Date(today.getTime() + dayMs(PLAIN_DAYS));
        verdict.className = 'verdict warn';
        verdict.innerHTML = 'Honestly: hand engraving needs <b>9 clear days</b>, and ' + fmtDate(need) + ' is only ' + days + (days === 1 ? ' day' : ' days') + ' away. The same set <b>un-engraved</b> can be ready by <b>' + fmtDate(plainReady) + '</b> — or keep the engraving and take the set on <b>' + fmtDate(ready) + '</b>. I will not cut the letters faster and call it handwork.';
      } else {
        verdict.className = 'verdict warn';
        verdict.innerHTML = 'That is closer than the bench allows — even a plain set needs <b>3 days</b>. The earliest this set can be in your hands is <b>' + fmtDate(ready) + '</b>.';
      }
    }

    function wireSeg(id, key, parse) {
      var seg = document.getElementById(id);
      if (!seg) return;
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        seg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state[key] = parse(btn);
        compute();
      });
    }
    wireSeg('segMetal', 'metal', function (b) { return b.getAttribute('data-metal'); });
    wireSeg('segSize', 'size', function (b) { return b.getAttribute('data-size'); });
    wireSeg('segEng', 'engraving', function (b) { return b.getAttribute('data-eng') === 'yes'; });

    var chips = document.getElementById('pieceChips');
    if (chips) {
      chips.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        compute();
      });
    }
    if (needBy) needBy.addEventListener('change', compute);
    compute();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var reach = document.getElementById('fReach').value.trim();
      if (!name || !reach) {
        (name ? document.getElementById('fReach') : document.getElementById('fName')).focus();
        return;
      }
      var interest = document.getElementById('fInterest').value;
      var ref = 'TA-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confText').textContent =
        'Thank you, ' + name.split(' ')[0] + ' — your note about ' + interest.charAt(0).toLowerCase() + interest.slice(1) + ' is on my bench list.';
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus({ preventScroll: true });
      confirmation.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
