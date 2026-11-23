(function () {
  'use strict';

  /* View-transition abort guard: an interrupted CSS view transition
     rejects its promise; swallow only that specific rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu panel ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var panel = document.querySelector('.mobile-panel');
  if (menuBtn && panel) {
    var firstLink = panel.querySelector('a');
    function setPanel(open) {
      panel.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      }
    }
    menuBtn.addEventListener('click', function () {
      setPanel(!panel.classList.contains('open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        setPanel(false);
        menuBtn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        setPanel(false);
      }
    });
  }

  /* ---------- scroll-driven hand diagram (index) ---------- */
  var drawSec = document.querySelector('.draw-sec');
  if (drawSec) {
    var pats = Array.prototype.slice.call(drawSec.querySelectorAll('.pat'));
    var dots = Array.prototype.slice.call(drawSec.querySelectorAll('.patdot'));
    var pctEl = drawSec.querySelector('.draw-pct');
    var stepEls = Array.prototype.slice.call(drawSec.querySelectorAll('.draw-steps li'));
    pats.forEach(function (p) {
      p.style.strokeDasharray = '100';
      p.style.strokeDashoffset = reduced ? '0' : '100';
    });
    dots.forEach(function (d) { d.style.opacity = reduced ? '1' : '0'; });

    function localProgress(el, p) {
      var at = parseFloat(el.getAttribute('data-at') || '0');
      var v = (p - at) / 0.3;
      return v < 0 ? 0 : (v > 1 ? 1 : v);
    }
    function render(p) {
      var q = p * 1.25; /* stagger headroom: the last elements finish by p = 1 */
      pats.forEach(function (el) {
        el.style.strokeDashoffset = String(100 * (1 - localProgress(el, q)));
      });
      dots.forEach(function (el) {
        el.style.opacity = String(localProgress(el, q));
      });
      if (pctEl) pctEl.textContent = Math.round(p * 100) + '%';
      var active = Math.min(3, Math.floor(p * 4));
      stepEls.forEach(function (li, i) { li.classList.toggle('active', i <= active); });
      drawSec.setAttribute('data-progress', p.toFixed(3));
    }
    if (reduced) {
      render(1);
    } else {
      var ticking = false;
      function update() {
        ticking = false;
        var r = drawSec.getBoundingClientRect();
        var vh = window.innerHeight;
        var total = r.height + vh * 0.55;
        var p = (vh * 0.88 - r.top) / total;
        render(p < 0 ? 0 : (p > 1 ? 1 : p));
      }
      function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    }
  }

  /* ---------- booking planner (index) ---------- */
  var planner = document.querySelector('.planner');
  if (planner) {
    var RATES = {
      palms:  { label: 'Palms only, both hands',        mins: 45,  cones: 1, price: 900 },
      wrist:  { label: 'Hands to the wrist, both sides', mins: 90, cones: 2, price: 1800 },
      elbow:  { label: 'Hands to the elbow (bridal)',  mins: 180, cones: 4, price: 3600 },
      full:   { label: 'Hands to the elbow + feet',    mins: 240, cones: 5, price: 4800 }
    };
    var DENSITY = {
      light:   { label: 'Light',        timeF: 0.7, priceF: 0.8, coneF: 0.75 },
      classic: { label: 'Classic',      timeF: 1.0, priceF: 1.0, coneF: 1.0 },
      dense:   { label: 'Dense bridal', timeF: 1.4, priceF: 1.5, coneF: 1.5 }
    };
    var GUEST_MINS = 12, GUEST_PRICE = 250;

    var state = { coverage: 'elbow', density: 'classic', guests: 0 };
    var covBtns = planner.querySelectorAll('[data-cov]');
    var denBtns = planner.querySelectorAll('[data-den]');
    var gOut = planner.querySelector('#p-guests');
    var gMinus = planner.querySelector('#g-minus');
    var gPlus = planner.querySelector('#g-plus');
    var dateIn = planner.querySelector('#p-date');
    var outTime = planner.querySelector('#out-time');
    var outCones = planner.querySelector('#out-cones');
    var outPrice = planner.querySelector('#out-price');
    var verdict = planner.querySelector('#verdict');

    function fmtMins(m) {
      var h = Math.floor(m / 60), mm = m % 60;
      if (h && mm) return h + ' h ' + mm + ' min';
      if (h) return h + ' h';
      return mm + ' min';
    }
    function fmtINR(n) { return '₹' + n.toLocaleString('en-IN'); }
    function fmtDate(d) {
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    function compute() {
      var base = RATES[state.coverage], den = DENSITY[state.density];
      var mins = Math.round(base.mins * den.timeF / 5) * 5 + state.guests * GUEST_MINS;
      var cones = Math.ceil(base.cones * den.coneF) + Math.ceil(state.guests / 6);
      var price = Math.round(base.price * den.priceF / 50) * 50 + state.guests * GUEST_PRICE;
      outTime.textContent = fmtMins(mins);
      outCones.textContent = String(cones);
      outPrice.textContent = fmtINR(price);

      var cls = 'verdict', html;
      if (dateIn && dateIn.value) {
        var ev = new Date(dateIn.value + 'T12:00:00');
        var now = new Date(); now.setHours(12, 0, 0, 0);
        var days = Math.round((ev - now) / 86400000);
        var sit = new Date(ev); sit.setDate(sit.getDate() - 2);
        if (days >= 2) {
          html = '<p><b>Good timing.</b> Sit on <b>' + fmtDate(sit) + '</b> and the stain peaks on the morning of ' +
                 fmtDate(ev) + ' — paste comes off the night before, colour does the rest while you sleep.</p>';
        } else if (days === 1) {
          cls = 'verdict warn';
          html = '<p><b>One day is not enough.</b> Paste applied today peaks the day <i>after</i> your event — at the ceremony the stain would still be pale orange. ' +
                 'The fix: sit this evening, keep the paste on overnight under a wrap, and expect deep orange by morning — or move the big design to the sangeet and keep the wedding-day sitting small.</p>';
        } else {
          cls = 'verdict bad';
          html = '<p><b>That date is today or past.</b> Henna cannot stain in time — the leaf needs a day on the skin and a day to darken. ' +
                 'The fix: pick a sitting at least two days before the event, and let the colour peak on the day itself.</p>';
        }
      } else {
        html = '<p><b>The 48-hour rule:</b> henna peaks two days after it is applied. Pick your event date above and I will tell you honestly whether the colour can be ready — brides sit two days before, never the day before.</p>';
      }
      verdict.className = cls;
      verdict.innerHTML = html;
      planner.setAttribute('data-total', String(price));
    }

    function bindSeg(btns, key) {
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          state[key] = b.getAttribute(key === 'coverage' ? 'data-cov' : 'data-den');
          compute();
        });
      });
    }
    bindSeg(covBtns, 'coverage');
    bindSeg(denBtns, 'density');
    if (gMinus) gMinus.addEventListener('click', function () {
      state.guests = Math.max(0, state.guests - 1); gOut.textContent = String(state.guests); compute();
    });
    if (gPlus) gPlus.addEventListener('click', function () {
      state.guests = Math.min(60, state.guests + 1); gOut.textContent = String(state.guests); compute();
    });
    if (dateIn) dateIn.addEventListener('change', compute);
    compute();
  }

  /* ---------- contact form ---------- */
  var form = document.querySelector('#book-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('#f-name').value || 'Friend').trim();
      var type = form.querySelector('#f-type').value;
      var ref = 'MV-2026-' + Math.floor(1000 + Math.random() * 9000);
      var box = document.querySelector('#confirm');
      var sum = document.querySelector('#confirm-summary');
      if (sum) {
        sum.textContent = 'Thank you, ' + name + '. Your ' + type + ' enquiry is with Zoya. She replies within one working day — and if your date is close, she will tell you straight away whether the stain can peak in time.';
      }
      var refEl = document.querySelector('#confirm-ref');
      if (refEl) refEl.textContent = ref;
      form.hidden = true;
      if (box) { box.hidden = false; box.setAttribute('tabindex', '-1'); box.focus(); }
    });
  }
})();
