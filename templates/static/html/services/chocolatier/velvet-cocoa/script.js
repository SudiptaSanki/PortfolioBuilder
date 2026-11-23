/* Velvet Cocoa — interactions.
   No sound anywhere: chocolate is tasted, not heard, and the need-test fails. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition aborts (back/forward swipes, rapid taps) surface as an
     unhandled rejection; swallow only that exact one. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  var closeBtn = document.getElementById('menuClose');
  function setMenu(open) {
    if (!panel || !btn) return;
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      requestAnimationFrame(function () {
        var first = panel.querySelector('nav a');
        if (first) first.focus({ preventScroll: true });
      });
    }
  }
  if (btn && panel) {
    btn.addEventListener('click', function () { setMenu(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); btn.focus(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) { setMenu(false); btn.focus(); }
    });
  }

  /* ---------- clip reveal (scroll position check, not IntersectionObserver:
     a fully clip-masked element never intersects itself) ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reveals.length) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var ticking = false;
      var check = function () {
        ticking = false;
        var vh = window.innerHeight || 800;
        reveals = reveals.filter(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < vh * 0.92 && r.bottom > 0) { el.classList.add('in'); return false; }
          return true;
        });
        if (!reveals.length) {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
        }
      };
      var onScroll = function () {
        if (!ticking) { ticking = true; requestAnimationFrame(check); }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      check();
    }
  }

  /* ---------- helpers ---------- */
  var DAY = 24 * 60 * 60 * 1000;
  function fmt(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function todayFloor() {
    var t = new Date(); t.setHours(0, 0, 0, 0); return t;
  }
  function parseDateInput(v) {
    if (!v) return null;
    var p = v.split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  /* ---------- Tasting Order Planner ----------
     Reads its numbers from the printed tables beside it:
     prices from #priceTable rows (data-price / data-kind),
     schedule from #prodTable data attributes. */
  var priceTable = document.getElementById('priceTable');
  var prodTable = document.getElementById('prodTable');
  if (priceTable && prodTable) {
    var prices = {}, kinds = {};
    priceTable.querySelectorAll('tbody tr').forEach(function (tr) {
      prices[tr.getAttribute('data-key')] = parseInt(tr.getAttribute('data-price'), 10);
      kinds[tr.getAttribute('data-key')] = tr.getAttribute('data-kind');
    });
    var leadBars = parseInt(prodTable.getAttribute('data-lead-bars'), 10);
    var leadBonbons = parseInt(prodTable.getAttribute('data-lead-bonbons'), 10);
    var keepBonbons = parseInt(prodTable.getAttribute('data-keep-bonbons'), 10);
    var minimum = parseInt(prodTable.getAttribute('data-min'), 10);

    var qty = {};
    Object.keys(prices).forEach(function (k) { qty[k] = 0; });

    var totalEl = document.getElementById('plTotal');
    var readyEl = document.getElementById('plReady');
    var verdictEl = document.getElementById('plVerdict');
    var minEl = document.getElementById('plMin');
    var dateEl = document.getElementById('eventDate');

    function compute() {
      var total = 0, hasBonbon = false, any = false;
      Object.keys(prices).forEach(function (k) {
        total += qty[k] * prices[k];
        if (qty[k] > 0) { any = true; if (kinds[k] === 'bonbon') hasBonbon = true; }
      });
      totalEl.textContent = '€' + total;

      var today = todayFloor();
      var lead = hasBonbon ? leadBonbons : leadBars;
      var ready = new Date(today.getTime() + lead * DAY);
      readyEl.textContent = any ? fmt(ready) : '—';

      verdictEl.className = 'pl-verdict';
      if (!any) {
        verdictEl.classList.add('idle');
        verdictEl.textContent = 'Choose a bar or a case to see the count.';
      } else {
        var event = parseDateInput(dateEl.value);
        if (!event) {
          verdictEl.classList.add('ok');
          verdictEl.textContent = hasBonbon
            ? 'Ready ' + fmt(ready) + ' — bonbons are made fresh, so the count starts today. Give me the date you need them and I will check it against their three weeks of life.'
            : 'Ready ' + fmt(ready) + ' — bars keep six months in a cool cupboard, so any date this season works.';
        } else if (event.getTime() < ready.getTime()) {
          var alt = hasBonbon ? new Date(today.getTime() + leadBars * DAY) : null;
          verdictEl.classList.add('warn');
          verdictEl.textContent = hasBonbon
            ? 'Too soon, honestly: this order is ready ' + fmt(ready) + ', after your date. Bars alone could be ready ' + fmt(alt) + ' — or write to me and we will see what the week allows.'
            : 'Too soon, honestly: the bars are cut and wrapped in two days, ready ' + fmt(ready) + '. The shelf sells single bars today with no wait.';
        } else if (hasBonbon && event.getTime() > ready.getTime() + keepBonbons * DAY) {
          var makeWeek = new Date(event.getTime() - leadBonbons * DAY);
          verdictEl.classList.add('warn');
          verdictEl.textContent = 'Bonbons made now would pass their best by your date — they keep three weeks from ' + fmt(ready) + '. I would make yours in the week of ' + fmt(makeWeek) + ' instead; order now and I hold the date. Bars keep six months if you need something in hand sooner.';
        } else {
          verdictEl.classList.add('ok');
          verdictEl.textContent = hasBonbon
            ? 'That works: ready ' + fmt(ready) + ', and the bonbons are in their best weeks for ' + fmt(event) + '. Write via the contact page and I will hold the batch.'
            : 'That works: ready ' + fmt(ready) + ', well inside the bars\u2019 six months for ' + fmt(event) + '.';
        }
      }

      if (any && total < minimum) {
        minEl.hidden = false;
        minEl.textContent = 'Under the €' + minimum + ' made-to-order minimum — the shelf sells single pieces with no minimum, or add to the order.';
      } else {
        minEl.hidden = true;
        minEl.textContent = '';
      }
    }

    document.querySelectorAll('.stepper button').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-key');
        var step = parseInt(b.getAttribute('data-step'), 10);
        qty[key] = Math.max(0, Math.min(60, (qty[key] || 0) + step));
        var out = document.getElementById('qty-' + key);
        if (out) out.textContent = qty[key];
        compute();
      });
    });
    if (dateEl) dateEl.addEventListener('change', compute);
    compute();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName');
      var email = document.getElementById('fEmail');
      var msg = document.getElementById('fMsg');
      var bad = null;
      [name, email, msg].forEach(function (f) { f.style.borderColor = ''; });
      if (!name.value.trim()) bad = name;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) bad = email;
      else if (!msg.value.trim()) bad = msg;
      if (bad) { bad.style.borderColor = '#b3402a'; bad.focus(); return; }

      var ref = 'VC-2027-' + String(Math.floor(1000 + Math.random() * 9000));
      var refEl = document.getElementById('confirmRef');
      if (refEl) refEl.textContent = ref;
      var box = document.getElementById('confirmBox');
      form.hidden = true;
      if (box) {
        box.hidden = false;
        box.setAttribute('tabindex', '-1');
        box.focus({ preventScroll: false });
      }
    });
  }
})();
