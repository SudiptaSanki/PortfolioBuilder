/* Moonlit Patch — script.js
   Jobs: mobile panel, kinetic type on scroll (F15's one effect),
   lantern lighting, the Commission Planner (arithmetic mirrors the
   rate table printed on index.html), and the contact form.
   No sound, anywhere. Reduced motion: type sits still, lanterns lit. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections in some
     browsers; swallow only that exact case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile panel ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobile-panel');
  if (toggle && panel) {
    var closeBtn = panel.querySelector('.panel-close');
    var openPanel = function () {
      panel.classList.add('open');
      panel.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () {
        var first = panel.querySelector('nav a');
        if (first) first.focus();
      });
    };
    var closePanel = function () {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    };
    toggle.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        panel.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- lanterns: photos light up as they arrive ---------- */
  var lanterns = document.querySelectorAll('.lantern');
  if (lanterns.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      lanterns.forEach(function (el) { el.classList.add('lit'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('lit');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.3 });
      lanterns.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- kinetic type on scroll ---------- */
  var klines = document.querySelectorAll('.kline');
  var bandTrack = document.querySelector('.band-track');
  if (!reduced && (klines.length || bandTrack)) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      klines.forEach(function (el) {
        var rate = parseFloat(el.getAttribute('data-rate') || '0.04');
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var off = (r.top + r.height / 2 - vh / 2) * rate;
        off = Math.max(-70, Math.min(70, off));
        el.style.transform = 'translateX(' + off.toFixed(1) + 'px)';
      });
      if (bandTrack) {
        var b = bandTrack.parentElement.getBoundingClientRect();
        if (b.bottom > -80 && b.top < vh + 80) {
          var p = (vh - b.top) / (vh + b.height);
          p = Math.max(0, Math.min(1, p));
          bandTrack.style.transform = 'translateX(' + (60 - p * 240).toFixed(1) + 'px)';
        }
      }
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Commission Planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    /* These figures mirror the rate table printed on the same page. */
    var SIZES = {
      porch:   { name: 'Porch Classic', weight: '10–15 lb',  pumpkin: 16,  handling: 0,
                 hours: { face: 1, shaded: 3, relief: 5 } },
      display: { name: 'Display',       weight: '25–40 lb',  pumpkin: 48,  handling: 0,
                 hours: { face: 2, shaded: 6, relief: 10 } },
      giant:   { name: 'Giant',         weight: '100–150 lb', pumpkin: 210, handling: 140,
                 hours: { face: 5, shaded: 14, relief: 24 } }
    };
    var DESIGNS = {
      face:   { name: 'Cut-through face',   life: 4 },
      shaded: { name: 'Shaded portrait',    life: 6 },
      relief: { name: 'Sculpted relief',    life: 5 }
    };
    var LABOUR = 65; /* dollars per carve hour, printed on the page */

    var state = { size: 'display', design: 'shaded', qty: 4 };
    var sizeBtns = planner.querySelectorAll('[data-size]');
    var designBtns = planner.querySelectorAll('[data-design]');
    var qtyOut = document.getElementById('p-qty');
    var eventIn = document.getElementById('p-event');
    var carveIn = document.getElementById('p-carve');

    var money = function (n) { return '$' + n.toLocaleString('en-US'); };
    var parseDate = function (v) {
      if (!v) return null;
      var p = v.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    };
    var fmt = function (d) {
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    var addDays = function (d, n) {
      var x = new Date(d.getTime());
      x.setDate(x.getDate() + n);
      return x;
    };

    var setPressed = function (btns, key, val) {
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute(key) === val ? 'true' : 'false');
      });
    };

    var compute = function () {
      var s = SIZES[state.size];
      var d = DESIGNS[state.design];
      var hoursEach = s.hours[state.design];
      var hours = hoursEach * state.qty;
      var spares = Math.ceil(state.qty / 5);
      var buy = state.qty + spares;
      var carveCost = state.qty * (s.pumpkin + hoursEach * LABOUR);
      var spareCost = spares * s.pumpkin;
      var handling = state.qty * s.handling;
      var total = carveCost + spareCost + handling;

      document.getElementById('r-summary').textContent =
        state.qty + ' × ' + s.name + ' (' + s.weight + '), ' + d.name.toLowerCase();
      document.getElementById('r-hours').textContent =
        hours + ' hours (' + hoursEach + ' per pumpkin)';
      document.getElementById('r-buy').textContent =
        buy + ' — ' + state.qty + ' to carve + ' + spares + ' spare' + (spares === 1 ? '' : 's');
      document.getElementById('r-carve').textContent = money(carveCost);
      document.getElementById('r-spares').textContent = money(spareCost);
      var hRow = document.getElementById('r-handling-row');
      if (s.handling) {
        hRow.hidden = false;
        document.getElementById('r-handling').textContent = money(handling);
      } else {
        hRow.hidden = true;
      }
      document.getElementById('r-total').textContent = money(total);

      /* The honest part: the carve window. */
      var verdict = document.getElementById('p-verdict');
      var vHead = verdict.querySelector('.v-head');
      var vBody = verdict.querySelector('.v-body');
      var ev = parseDate(eventIn.value);
      var cv = parseDate(carveIn.value);
      verdict.classList.remove('bad');
      if (!ev || !cv) {
        vHead.textContent = 'Now the dates.';
        vBody.textContent = 'Give me an event date and a carve date and I will tell you plainly whether the timing works. A carved pumpkin keeps its own calendar.';
        return;
      }
      var diff = Math.round((ev - cv) / 86400000);
      var life = d.life;
      if (diff < 0) {
        verdict.classList.add('bad');
        vHead.textContent = 'That order runs backwards.';
        vBody.textContent = 'The carve cannot come after the party. Move the carve date to on or before ' + fmt(ev) + '.';
      } else if (diff > life) {
        verdict.classList.add('bad');
        vHead.textContent = 'Too early — it would miss its own night.';
        vBody.textContent = 'Carved ' + fmt(cv) + ', a ' + d.name.toLowerCase() +
          ' is past its best by ' + fmt(addDays(cv, life)) + ', and ' + fmt(ev) +
          ' is ' + diff + ' days later. Carve between ' + fmt(addDays(ev, -life)) +
          ' and ' + fmt(ev) + ' and it peaks on the night.';
      } else if (diff === 0) {
        vHead.textContent = 'Same-day carve — a dawn start.';
        vBody.textContent = 'Carving on ' + fmt(ev) + ' itself works for a ' + d.name.toLowerCase() +
          ': I start at first light and it lights that night at its best. Book it early; the last week of October fills first.';
      } else {
        vHead.textContent = 'That timing works.';
        vBody.textContent = 'Carved ' + fmt(cv) + ', it settles for ' + diff +
          (diff === 1 ? ' night' : ' nights') + ' and peaks on ' + fmt(ev) +
          ' — inside its ' + life + '-day best.';
      }
    };

    sizeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.size = b.getAttribute('data-size');
        setPressed(sizeBtns, 'data-size', state.size);
        compute();
      });
    });
    designBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.design = b.getAttribute('data-design');
        setPressed(designBtns, 'data-design', state.design);
        compute();
      });
    });
    document.getElementById('p-minus').addEventListener('click', function () {
      if (state.qty > 1) { state.qty--; qtyOut.textContent = state.qty; compute(); }
    });
    document.getElementById('p-plus').addEventListener('click', function () {
      if (state.qty < 60) { state.qty++; qtyOut.textContent = state.qty; compute(); }
    });
    eventIn.addEventListener('change', compute);
    carveIn.addEventListener('change', compute);
    compute();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('c-name').value.trim();
      var when = document.getElementById('c-event').value;
      var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      var ref = 'MP-2026-';
      for (var i = 0; i < 4; i++) ref += chars[Math.floor(Math.random() * chars.length)];
      document.getElementById('conf-ref').textContent = ref;
      document.getElementById('conf-line').textContent =
        'Thank you' + (name ? ', ' + name.split(' ')[0] : '') +
        '. Your note is in the October book' +
        (when ? ' for ' + parseDateFmt(when) : '') +
        '. I answer every enquiry myself, within two days — faster in October.';
      form.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
    function parseDateFmt(v) {
      var p = v.split('-');
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }
})();
