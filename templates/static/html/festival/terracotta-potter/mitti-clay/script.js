/* Mitti Clay — Salim Kumbhar. Menu, parallax layers, Order & Kiln Planner,
   contact form. No sound, no libraries. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition abort guard: swallow only the known abort rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu: layered panel ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('nav-panel');
  if (btn && panel) {
    var close = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () { if (!panel.classList.contains('open')) panel.hidden = true; }, reduced ? 0 : 300);
    };
    btn.addEventListener('click', function () {
      if (panel.hidden) {
        panel.hidden = false;
        requestAnimationFrame(function () {
          panel.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      } else {
        close();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); }
    });
  }

  /* ---------- parallax layers ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-plx]'));
  if (layers.length && !reduced) {
    var ticking = false;
    var apply = function () {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var centre = r.top + r.height / 2 - vh / 2;
        var speed = parseFloat(el.getAttribute('data-plx')) || 0.05;
        var shift = Math.max(-30, Math.min(30, -centre * speed));
        el.style.transform = 'scale(1.14) translateY(' + shift.toFixed(1) + 'px)';
      });
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    apply();
  }

  /* ---------- Order & Kiln Planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    /* Same figures as the rate table printed beside the planner. */
    var PIECES = {
      diya:    { label: 'Diya',        clay: 0.12, perDay: 400, kiln: 400, dry: 3, price: 15,  defQty: 200, step: 100 },
      kulhad:  { label: 'Kulhad',      clay: 0.20, perDay: 300, kiln: 500, dry: 3, price: 10,  defQty: 200, step: 100 },
      garba:   { label: 'Garba pot',   clay: 1.20, perDay: 25,  kiln: 60,  dry: 5, price: 250, defQty: 20,  step: 5 },
      planter: { label: 'Planter 30cm',clay: 2.00, perDay: 20,  kiln: 40,  dry: 5, price: 350, defQty: 10,  step: 5 },
      matka:   { label: 'Matka 10L',   clay: 3.50, perDay: 12,  kiln: 24,  dry: 7, price: 450, defQty: 10,  step: 5 }
    };
    var BREAKAGE = 1.08; /* 8 in every 100 crack or warp — thrown extra, never billed */
    var DIWALI = new Date(2027, 9, 29); /* Friday 29 October 2027 */
    var state = { piece: 'diya', qty: 200 };

    var chips = planner.querySelectorAll('.chip');
    var qtyVal = document.getElementById('qty-val');
    var dateInput = document.getElementById('need-date');
    var out = {
      thrown: document.getElementById('out-thrown'),
      clay: document.getElementById('out-clay'),
      wheel: document.getElementById('out-wheel'),
      kiln: document.getElementById('out-kiln'),
      lead: document.getElementById('out-lead'),
      total: document.getElementById('out-total')
    };
    var verdict = document.getElementById('verdict');

    var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
    var fmtDate = function (d) {
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    var compute = function () {
      var p = PIECES[state.piece];
      var thrown = Math.ceil(state.qty * BREAKAGE);
      var clayKg = thrown * p.clay;
      var wheel = Math.ceil(thrown / p.perDay);
      var kiln = Math.ceil(thrown / p.kiln);
      var lead = wheel + p.dry + kiln + 1; /* +1 cooling & packing */
      var total = state.qty * p.price;
      return { p: p, thrown: thrown, clayKg: clayKg, wheel: wheel, kiln: kiln, lead: lead, total: total };
    };

    var render = function () {
      var r = compute();
      qtyVal.textContent = state.qty.toLocaleString('en-IN');
      out.thrown.textContent = r.thrown.toLocaleString('en-IN') + ' thrown';
      out.clay.textContent = (Math.round(r.clayKg * 10) / 10).toLocaleString('en-IN') + ' kg';
      out.wheel.textContent = r.wheel + (r.wheel === 1 ? ' day' : ' days');
      out.kiln.textContent = r.kiln + (r.kiln === 1 ? ' load' : ' loads');
      out.lead.textContent = r.lead + ' days';
      out.total.textContent = inr(r.total);

      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (!dateInput.value) {
        verdict.className = 'verdict';
        verdict.innerHTML = 'Tell me the day you need them and I will tell you plainly whether the kiln can make it — <strong>' + r.lead + ' days</strong> is what this order asks of the clay.';
        return;
      }
      var need = new Date(dateInput.value + 'T00:00:00');
      var daysLeft = Math.round((need - today) / 86400000);
      var ready = new Date(today.getTime() + r.lead * 86400000);
      if (daysLeft < 0) {
        verdict.className = 'verdict warn';
        verdict.innerHTML = '<strong>That day has passed.</strong> Pick a date ahead of us and I will reckon it again.';
      } else if (r.lead <= daysLeft) {
        verdict.className = 'verdict ok';
        verdict.innerHTML = '<strong>The kiln can make it.</strong> Ready by <strong>' + fmtDate(ready) + '</strong> — ' + (daysLeft - r.lead) + ' days to spare before you need them.';
      } else {
        var msg = '<strong>Too close — I will not promise it.</strong> This order needs ' + r.lead + ' days (throwing, drying, firing, cooling) and you have ' + daysLeft + '. ' +
          'What <em>is</em> ready on the shelf today: <strong>600 fired diyas, 40 matkas and 120 kulhads</strong>, packed and waiting.';
        if (need <= DIWALI) {
          msg += ' For Diwali the last kiln fires on <strong>Friday 22 October 2027</strong> — after that, shelf stock is the honest road.';
        }
        verdict.className = 'verdict warn';
        verdict.innerHTML = msg;
      }
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state.piece = chip.getAttribute('data-piece');
        state.qty = PIECES[state.piece].defQty;
        render();
      });
    });
    document.getElementById('qty-minus').addEventListener('click', function () {
      var step = PIECES[state.piece].step;
      state.qty = Math.max(step, state.qty - step);
      render();
    });
    document.getElementById('qty-plus').addEventListener('click', function () {
      var step = PIECES[state.piece].step;
      state.qty = Math.min(5000, state.qty + step);
      render();
    });
    dateInput.addEventListener('change', render);
    render();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var piece = document.getElementById('f-piece');
      var pieceLabel = piece.options[piece.selectedIndex].text;
      var qty = document.getElementById('f-qty').value;
      var ref = 'MC-2027-' + Math.floor(1000 + Math.random() * 9000);
      var box = document.getElementById('confirmation');
      document.getElementById('conf-ref').textContent = ref;
      document.getElementById('conf-summary').textContent =
        'Thank you, ' + name + '. Your note about ' + qty + ' × ' + pieceLabel +
        ' is on my order slate. I reply within two working days — sooner in the Diwali season.';
      form.hidden = true;
      box.hidden = false;
      box.setAttribute('tabindex', '-1');
      box.focus();
      box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
