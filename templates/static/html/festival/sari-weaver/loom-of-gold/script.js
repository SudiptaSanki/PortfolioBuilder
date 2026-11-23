/* Loom of Gold — Kamala Venkatesh. Menu, opposing warp/weft rows,
   Sari Commission Planner, commission form. No sound anywhere. */
(function () {
  'use strict';

  /* View-transition abort guard: Chrome surfaces an aborted cross-document
     transition as an unhandled rejection; the navigation itself completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuPanel = document.getElementById('menuPanel');
  if (menuBtn && menuPanel) {
    var setMenu = function (open) {
      menuPanel.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = menuPanel.querySelector('a');
          if (first) first.focus();
        });
      }
    };
    menuBtn.addEventListener('click', function () {
      setMenu(!menuPanel.classList.contains('open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuPanel.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (menuPanel.classList.contains('open') &&
          !menuPanel.contains(e.target) && !menuBtn.contains(e.target)) {
        setMenu(false);
      }
    });
  }

  /* ---------- opposing rows: warp drifts left, weft drifts right ----------
     The ONE assigned scroll effect. Driven by the pair's own progress
     through the viewport; reduced motion leaves both rows static. */
  var pair = document.getElementById('threadPair');
  if (pair && !reduced) {
    var warp = pair.querySelector('.thread-row.warp .thread-track');
    var weft = pair.querySelector('.thread-row.weft .thread-track');
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = pair.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var p = (vh - r.top) / (vh + r.height);   /* 0 entering -> 1 leaving */
      if (p < 0) p = 0; if (p > 1) p = 1;
      var shift = (p - 0.5) * 140;              /* -70px .. +70px */
      if (warp) warp.style.transform = 'translateX(' + (-shift) + 'px)';
      if (weft) weft.style.transform = 'translateX(' + shift + 'px)';
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Sari Commission Planner ----------
     Every rate below is the loom card printed on index.html. Keep identical. */
  var CARD = {
    length:  { l63: { m: 6.3, ends: 4800 }, l73: { m: 7.3, ends: 4800 }, l96: { m: 9.6, ends: 5280 } },
    silk:    { g3a: { gpm: 100, rate: 9 },  g5a: { gpm: 120, rate: 12 } },
    zari:    { tested: 6, half: 15, pure: 240 },
    border:  { narrow: { g: 40, pace: 1.6 }, medium: { g: 85, pace: 2.1 }, temple: { g: 140, pace: 2.8 } },
    dayRate: 850,
    setupDays: 3,
    dyeDays: 2,
    finishing: 1200,
    picksPerCm: 30
  };
  var SHELF = {
    tested: { name: 'Marigold Field', detail: 'tested zari · 6.3 m · medium border', price: 19900 },
    half:   { name: 'Peacock Half-Fine', detail: 'half-fine zari · 6.3 m · temple border', price: 41200 },
    pure:   { name: 'Kumkum Pure', detail: 'pure zari · 6.3 m · medium border', price: 92500 }
  };
  var fmt = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var fmtN = function (n) { return Math.round(n).toLocaleString('en-IN'); };

  var planner = document.getElementById('planner');
  if (planner) {
    var state = { length: 'l63', silk: 'g3a', zari: 'tested', border: 'medium' };
    var out = {
      ends: document.getElementById('outEnds'),
      picks: document.getElementById('outPicks'),
      silk: document.getElementById('outSilk'),
      zari: document.getElementById('outZari'),
      days: document.getElementById('outDays'),
      labour: document.getElementById('outLabour'),
      fin: document.getElementById('outFin'),
      total: document.getElementById('outTotal'),
      ready: document.getElementById('outReady'),
      verdict: document.getElementById('verdict'),
      verdictText: document.getElementById('verdictText')
    };
    var dateInput = document.getElementById('needDate');
    var today = new Date(); today.setHours(0, 0, 0, 0);
    if (dateInput) {
      var iso = function (d) {
        var p = function (x) { return (x < 10 ? '0' : '') + x; };
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      };
      dateInput.min = iso(today);
    }
    var fmtDate = function (d) {
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    var render = function () {
      var L = CARD.length[state.length];
      var S = CARD.silk[state.silk];
      var B = CARD.border[state.border];
      var silkG = L.m * S.gpm;
      var silkCost = silkG * S.rate;
      var zariCost = B.g * CARD.zari[state.zari];
      var weaveDays = Math.ceil(L.m * B.pace);
      var labour = weaveDays * CARD.dayRate;
      var total = silkCost + zariCost + labour + CARD.finishing;
      var lead = CARD.setupDays + CARD.dyeDays + weaveDays;
      var picks = Math.round(L.m * 100) * CARD.picksPerCm;
      var readyDate = new Date(today.getTime() + lead * 86400000);

      out.ends.textContent = fmtN(L.ends) + ' ends';
      out.picks.textContent = fmtN(picks) + ' picks';
      out.silk.textContent = fmt(silkCost);
      out.zari.textContent = fmt(zariCost);
      out.days.textContent = weaveDays + ' days';
      out.labour.textContent = fmt(labour);
      out.fin.textContent = fmt(CARD.finishing);
      out.total.textContent = fmt(total);
      out.ready.textContent = fmtDate(readyDate);

      var msg, warn = false;
      if (dateInput && dateInput.value) {
        var need = new Date(dateInput.value + 'T00:00:00');
        if (need < readyDate) {
          warn = true;
          var s = SHELF[state.zari];
          msg = 'That date is inside the weaving time — this sari cannot be woven, dyed and finished by ' +
                fmtDate(need) + '. It would leave the loom on ' + fmtDate(readyDate) + '. ' +
                'On the shelf today, in the same zari class: the ' + s.name + ' (' + s.detail + '), ' +
                fmt(s.price) + ', folded and ready to courier. Or keep the date and choose a narrower border — the planner above will re-count it at once.';
        } else {
          msg = 'That date works. The sari leaves the loom on ' + fmtDate(readyDate) +
                ', with ' + Math.round((need - readyDate) / 86400000) + ' days to spare for pressing, tassels and the courier.';
        }
      } else {
        msg = 'Counted from today, this sari leaves the loom on ' + fmtDate(readyDate) +
              ' — ' + CARD.setupDays + ' days of warp and loom setup, ' + CARD.dyeDays +
              ' days of dyeing, then ' + weaveDays + ' days at the pit. Add a needed-by date and I will tell you plainly whether it fits.';
      }
      out.verdictText.textContent = msg;
      out.verdict.classList.toggle('warn', warn);
    };

    var bindSeg = function (id, key) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        state[key] = btn.dataset.value;
        Array.prototype.forEach.call(el.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        render();
      });
    };
    bindSeg('segLength', 'length');
    bindSeg('segSilk', 'silk');
    bindSeg('segZari', 'zari');
    bindSeg('segBorder', 'border');
    if (dateInput) dateInput.addEventListener('change', render);
    render();
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('commissionForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ref = 'LOG-2026-' + Array.prototype.map.call(
        window.crypto.getRandomValues(new Uint8Array(4)),
        function (b) { return 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b % 31]; }
      ).join('');
      var conf = document.getElementById('confirmation');
      document.getElementById('confRef').textContent = ref;
      var name = document.getElementById('fName').value.trim();
      if (name) document.getElementById('confName').textContent = name.split(' ')[0];
      form.hidden = true;
      conf.hidden = false;
      conf.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      conf.setAttribute('tabindex', '-1');
      conf.focus({ preventScroll: true });
    });
  }
})();
