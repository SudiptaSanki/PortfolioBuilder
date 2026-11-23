/* Odette Boudreaux — Carnival Photographer (zoom-lens-mardi)
   Vanilla JS: route panel · draggable deck · card calculator ·
   booking estimator · demonstration form. No libraries, no sound. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces an unhandled InvalidStateError
     rejection; the navigation itself always completes. Filter only
     that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- route panel (mobile nav) ---------- */
  var btn = document.getElementById('routeBtn');
  var panel = document.getElementById('routePanel');
  if (btn && panel) {
    var closePanel = function (refocus) {
      panel.classList.remove('open');
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus();
    };
    btn.addEventListener('click', function () {
      var open = panel.hidden;
      if (open) {
        panel.hidden = false;
        panel.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      } else {
        closePanel(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) closePanel(true);
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        closePanel(false);
      }
    });
  }

  /* ---------- draggable deck ---------- */
  var deck = document.getElementById('deckScroll');
  if (deck && !reduced) {
    var down = false, startX = 0, startScroll = 0, moved = false;
    deck.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; /* touch uses native swipe */
      down = true; moved = false;
      startX = e.clientX; startScroll = deck.scrollLeft;
      deck.classList.add('dragging');
    });
    deck.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      deck.scrollLeft = startScroll - dx;
    });
    var endDrag = function () { down = false; deck.classList.remove('dragging'); };
    deck.addEventListener('pointerup', endDrag);
    deck.addEventListener('pointercancel', endDrag);
    deck.addEventListener('pointerleave', endDrag);
    /* a drag that ends on a link/figure must not read as a tap */
    deck.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  }

  var fmt = function (n) { return n.toLocaleString('en-US'); };
  var money = function (n) { return '$' + fmt(n); };

  /* ---------- steppers (shared) ---------- */
  function bindStepper(key, min, max, onChange) {
    var val = null;
    document.querySelectorAll('[data-step="' + key + '"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        var next = Math.min(max, Math.max(min, val + dir));
        if (next !== val) { val = next; onChange(val); }
      });
    });
    return {
      set: function (v) { val = v; },
      get: function () { return val; }
    };
  }

  /* ---------- Card & Coverage Calculator ---------- */
  var calcEl = document.getElementById('calcTool');
  if (calcEl) {
    var RATES = { peak: 420, amb: 180, port: 90 };
    var SIZES = { raw: 45, jpeg: 12, rawjpeg: 57 };
    var USABLE = 115.2; /* 128 GB card at 90% — printed on the page */
    var state = { peak: 3, amb: 2, port: 1, fmt: 'raw' };

    var out = {
      peak: document.getElementById('in-peak'),
      amb: document.getElementById('in-amb'),
      port: document.getElementById('in-port')
    };
    function hrs(n) { return n + (n === 1 ? ' hr' : ' hrs'); }

    function renderCalc() {
      var fPeak = state.peak * RATES.peak;
      var fAmb = state.amb * RATES.amb;
      var fPort = state.port * RATES.port;
      var frames = fPeak + fAmb + fPort;
      var mb = frames * SIZES[state.fmt];
      var gb = mb / 1000;
      var needed = Math.ceil(gb / USABLE);
      var carried = Math.ceil(needed * 1.5);

      out.peak.textContent = hrs(state.peak);
      out.amb.textContent = hrs(state.amb);
      out.port.textContent = hrs(state.port);

      document.getElementById('w-peak-l').textContent = 'Peak: ' + state.peak + ' hrs × 420';
      document.getElementById('w-amb-l').textContent = 'Ambient: ' + state.amb + ' hrs × 180';
      document.getElementById('w-port-l').textContent = 'Portraits: ' + state.port + (state.port === 1 ? ' hr' : ' hrs') + ' × 90';
      document.getElementById('w-peak').textContent = fmt(fPeak) + ' frames';
      document.getElementById('w-amb').textContent = fmt(fAmb) + ' frames';
      document.getElementById('w-port').textContent = fmt(fPort) + ' frames';
      document.getElementById('calc-frames').textContent = fmt(frames);
      document.getElementById('w-size-l').textContent = 'Storage: ' + fmt(frames) + ' × ' + SIZES[state.fmt] + ' MB';
      document.getElementById('calc-gb').textContent = gb.toFixed(2) + ' GB';
      document.getElementById('calc-cards').textContent = String(needed);
      document.getElementById('calc-carried').textContent = String(carried);
    }

    var sPeak = bindStepper('peak', 0, 8, function (v) { state.peak = v; renderCalc(); });
    var sAmb = bindStepper('amb', 0, 8, function (v) { state.amb = v; renderCalc(); });
    var sPort = bindStepper('port', 0, 4, function (v) { state.port = v; renderCalc(); });
    sPeak.set(3); sAmb.set(2); sPort.set(1);

    calcEl.querySelectorAll('[data-fmt]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.fmt = b.getAttribute('data-fmt');
        calcEl.querySelectorAll('[data-fmt]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        renderCalc();
      });
    });

    renderCalc();
  }

  /* ---------- Booking Estimator ---------- */
  var estEl = document.getElementById('estTool');
  if (estEl) {
    var DAY = 1450, HALF = 850, SECOND = 450, RUSH = 300;
    var est = { days: 1, half: 0, second: false, rush: false };

    function renderEst() {
      var d = est.days * DAY;
      var h = est.half * HALF;
      var s = est.second ? est.days * SECOND : 0;
      var r = est.rush ? RUSH : 0;
      document.getElementById('in-days').textContent = String(est.days);
      document.getElementById('in-half').textContent = String(est.half);
      document.getElementById('e-days-l').textContent = 'Parade days: ' + est.days + ' × $1,450';
      document.getElementById('e-half-l').textContent = 'Half-days: ' + est.half + ' × $850';
      document.getElementById('e-second-l').textContent = 'Second shooter: ' + (est.second ? est.days : 0) + ' days × $450';
      document.getElementById('e-days').textContent = money(d);
      document.getElementById('e-half').textContent = money(h);
      document.getElementById('e-second').textContent = money(s);
      document.getElementById('e-rush').textContent = money(r);
      document.getElementById('est-total').textContent = money(d + h + s + r);
    }

    var sDays = bindStepper('days', 0, 6, function (v) { est.days = v; renderEst(); });
    var sHalf = bindStepper('half', 0, 6, function (v) { est.half = v; renderEst(); });
    sDays.set(1); sHalf.set(0);

    var cSecond = document.getElementById('in-second');
    var cRush = document.getElementById('in-rush');
    if (cSecond) cSecond.addEventListener('change', function () { est.second = cSecond.checked; renderEst(); });
    if (cRush) cRush.addEventListener('change', function () { est.rush = cRush.checked; renderEst(); });

    renderEst();
  }

  /* ---------- demonstration enquiry form ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    var fields = {
      name: { el: document.getElementById('f-name'), err: document.getElementById('e-name'),
              ok: function (v) { return v.trim().length >= 2; } },
      email: { el: document.getElementById('f-email'), err: document.getElementById('e-email'),
               ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      krewe: { el: document.getElementById('f-krewe'), err: document.getElementById('e-krewe'),
               ok: function (v) { return v.trim().length >= 3; } },
      date: { el: document.getElementById('f-date'), err: document.getElementById('e-date'),
              ok: function (v) { return v.trim().length > 0; } },
      msg: { el: document.getElementById('f-msg'), err: document.getElementById('e-msg'),
             ok: function (v) { return v.trim().length >= 10; } }
    };
    Object.keys(fields).forEach(function (k) {
      var f = fields[k];
      f.el.addEventListener('input', function () {
        f.el.removeAttribute('aria-invalid');
        f.err.classList.remove('on');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var valid = f.ok(f.el.value);
        f.el.setAttribute('aria-invalid', valid ? 'false' : 'true');
        f.err.classList.toggle('on', !valid);
        if (!valid && !firstBad) firstBad = f.el;
      });
      if (firstBad) { firstBad.focus(); return; }

      var ref = 'OB-2027-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmSum').textContent =
        'Noted for: ' + fields.krewe.el.value.trim() + ' · ' + fields.date.el.value +
        ' · reply to ' + fields.email.el.value.trim() + '.';
      form.hidden = true;
      var box = document.getElementById('confirmBox');
      box.hidden = false;
      box.focus();
    });

    var again = document.getElementById('againBtn');
    if (again) again.addEventListener('click', function () {
      document.getElementById('confirmBox').hidden = true;
      form.reset();
      form.hidden = false;
      fields.name.el.focus();
    });
  }
})();
