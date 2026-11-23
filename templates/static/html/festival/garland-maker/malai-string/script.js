/* Malai String — menu, clip reveal, order planner, order form.
   No sound, no libraries. The planner reads its numbers from the
   rate table printed on the same page, so tool and page cannot disagree. */
(function () {
  'use strict';

  /* View-transition aborts surface as unhandled rejections; swallow only those. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobile-panel');
  if (btn && panel) {
    var closeMenu = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  /* ---------- clip reveal (the one assigned scroll effect) ----------
     Position-checked on scroll rather than IntersectionObserver:
     an element clipped to zero height reports zero intersection
     with itself, so IO would never fire on the clipped element. */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.clip-reveal'));
  if (revealEls.length && !reduced) {
    document.documentElement.classList.add('clip-on');
    var ticking = false;
    var checkReveals = function () {
      ticking = false;
      var vh = window.innerHeight;
      revealEls = revealEls.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) {
          el.classList.add('in');
          return false;
        }
        return true;
      });
      if (!revealEls.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(checkReveals); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    checkReveals();
  }

  /* ---------- garland order planner (index only) ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var rates = {};
    document.querySelectorAll('#rate-table tbody tr').forEach(function (tr) {
      rates[tr.getAttribute('data-flower')] = {
        name: tr.getAttribute('data-name'),
        flowers: parseInt(tr.getAttribute('data-flowers'), 10),
        minutes: parseInt(tr.getAttribute('data-minutes'), 10),
        price: parseInt(tr.getAttribute('data-price'), 10)
      };
    });

    var state = { flower: 'jasmine', length: 3, qty: 4, needed: 660 };
    var START = 330;        /* stringing starts 5:30 a.m., after the market run */
    var PACK = 20;          /* banana-leaf wrap + misting, minutes */
    var SAME_DAY_LIMIT = 360; /* one pair of hands, minutes of stringing */

    var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
    var clock = function (mins) {
      var h24 = Math.floor(mins / 60), m = mins % 60;
      var suffix = h24 >= 12 ? 'p.m.' : 'a.m.';
      var h = h24 % 12; if (h === 0) h = 12;
      return h + ':' + (m < 10 ? '0' + m : m) + ' ' + suffix;
    };
    var dur = function (mins) {
      var h = Math.floor(mins / 60), m = mins % 60;
      if (h && m) return h + ' h ' + m + ' min';
      if (h) return h + ' h';
      return m + ' min';
    };

    var out = {
      flowers: document.getElementById('out-flowers'),
      feet: document.getElementById('out-feet'),
      time: document.getElementById('out-time'),
      ready: document.getElementById('out-ready'),
      price: document.getElementById('out-price'),
      verdict: document.getElementById('planner-verdict')
    };

    function render() {
      var r = rates[state.flower];
      var feet = state.length * state.qty;
      var flowers = r.flowers * feet;
      var stringMin = r.minutes * feet;
      var price = r.price * feet;
      var ready = START + stringMin + PACK;

      out.flowers.textContent = flowers.toLocaleString('en-IN') + ' ' + (state.flower === 'jasmine' ? 'buds' : 'flowers');
      out.feet.textContent = feet + ' ft of stringing';
      out.time.textContent = dur(stringMin);
      out.ready.textContent = clock(ready);
      out.price.textContent = inr(price);

      var html;
      if (stringMin > SAME_DAY_LIMIT) {
        var readyTwo = START + Math.ceil(stringMin / 2) + PACK;
        html = '<b>Too much for one morning.</b> One pair of hands strings at most ' +
          dur(SAME_DAY_LIMIT) + ' before a ceremony. <b>Order by 8 p.m. the evening before</b> — ' +
          'the flowers are bought at dawn and my sister strings beside me; with four hands this is ready by ' +
          clock(readyTwo) + '.';
        out.verdict.classList.add('warn');
      } else if (ready > state.needed) {
        html = '<b>Ready at ' + clock(ready) + ' — too late for a ' + clock(state.needed) + ' ceremony.</b> ' +
          'Shorten each garland, drop the count, or order the day before and I start with the first market lot at 5:30 a.m.';
        out.verdict.classList.add('warn');
      } else {
        html = '<b>Ready by ' + clock(ready) + ', wrapped in banana leaf.</b> ' +
          'Order by <b>4 a.m.</b>, before I leave for the market — after that, the morning\u2019s jasmine goes to the next name on the list.';
        out.verdict.classList.remove('warn');
      }
      out.verdict.innerHTML = html;
    }

    planner.querySelectorAll('.seg').forEach(function (seg) {
      seg.addEventListener('click', function () {
        planner.querySelectorAll('.seg').forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
        seg.setAttribute('aria-pressed', 'true');
        state.flower = seg.getAttribute('data-flower');
        render();
      });
    });

    planner.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var target = b.getAttribute('data-step');
        var delta = parseInt(b.getAttribute('data-delta'), 10);
        if (target === 'length') {
          state.length = Math.min(10, Math.max(1, state.length + delta));
          document.getElementById('len-val').textContent = state.length + ' ft';
        } else {
          state.qty = Math.min(60, Math.max(1, state.qty + delta));
          document.getElementById('qty-val').textContent = state.qty;
        }
        render();
      });
    });

    var neededSel = document.getElementById('needed-by');
    neededSel.addEventListener('change', function () {
      state.needed = parseInt(neededSel.value, 10);
      render();
    });

    render();
  }

  /* ---------- order form (contact only) ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var flower = document.getElementById('f-flower').value;
      var length = document.getElementById('f-length').value;
      var qty = document.getElementById('f-qty').value;
      var when = document.getElementById('f-when').value;
      var ref = 'MS-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('conf-ref').textContent = ref;
      document.getElementById('conf-summary').textContent =
        'Thank you, ' + name + '. Your order note reads: ' + qty + ' × ' + flower +
        ' garlands at ' + length + ' ft each, needed by ' + when +
        '. I reply before the next market run — if your date is close, I will tell you plainly whether my hands can reach it.';
      form.style.display = 'none';
      var conf = document.getElementById('confirmation');
      conf.classList.add('show');
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
  }
})();
