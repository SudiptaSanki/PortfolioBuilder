/* Thandai Frost — ledger behaviours.
   View-transition abort guard · ledger-index mobile nav · stamp reveals ·
   the Holi Order Planner · the order-book form. No sound, anywhere. */
(function () {
  'use strict';

  /* A cross-page view transition that gets interrupted (fast taps, a
     second navigation) rejects its promise; swallow only that rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ledger-index mobile nav ---------- */
  var btn = document.getElementById('indexBtn');
  var panel = document.getElementById('navPanel');
  if (btn && panel) {
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var first = panel.querySelector('a');
        if (first) { /* focus after the panel has begun to open */ requestAnimationFrame(function () { first.focus({ preventScroll: true }); }); }
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  /* ---------- stamp reveals ---------- */
  var stamps = Array.prototype.slice.call(document.querySelectorAll('.stamp'));
  if (stamps.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      stamps.forEach(function (s) { s.classList.remove('pre'); });
    } else {
      stamps.forEach(function (s) { s.classList.add('pre'); });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en, i) {
          if (en.isIntersecting) {
            var el = en.target;
            el.style.transitionDelay = (i * 90) + 'ms';
            el.classList.remove('pre');
            io.unobserve(el);
          }
        });
      }, { threshold: 0.4 });
      stamps.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- the Holi Order Planner ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    /* The Measure, printed on this page (Folio 2). The planner reads no
       other numbers. */
    var PER = { almonds: 50, fennel: 10, saffron: 0.25, sugar: 80, milk: 1, paste: 125 };
    var GLASSES_PER_LITRE = 5;
    var STONE_PER_DAY = 40;         /* litres of paste ground per day */
    var PRICE_DRINK = 450;          /* ₹ per litre */
    var PRICE_JAR = 380, JAR_G = 250;
    var PRICE_SYRUP = 520, SYRUP_LITRES = 4;

    var state = { guests: 20, per: 2, form: 'drink', days: 6 };

    var el = function (id) { return document.getElementById(id); };
    var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
    var num = function (n) { return n.toLocaleString('en-IN'); };
    var gfmt = function (g) {
      if (g >= 1000) { var kg = g / 1000; return (kg % 1 ? kg.toFixed(2).replace(/0$/, '') : kg) + ' kg'; }
      return (g % 1 ? g.toFixed(2).replace(/0$/, '') : g) + ' g';
    };

    function stepper(idMinus, idPlus, idVal, key, min, max) {
      el(idMinus).addEventListener('click', function () {
        state[key] = Math.max(min, state[key] - 1); render();
      });
      el(idPlus).addEventListener('click', function () {
        state[key] = Math.min(max, state[key] + 1); render();
      });
    }
    stepper('guestsMinus', 'guestsPlus', 'guestsVal', 'guests', 1, 500);
    stepper('perMinus', 'perPlus', 'perVal', 'per', 1, 6);
    stepper('daysMinus', 'daysPlus', 'daysVal', 'days', 0, 30);

    el('formDrink').addEventListener('click', function () { state.form = 'drink'; render(); });
    el('formPaste').addEventListener('click', function () { state.form = 'paste'; render(); });

    function render() {
      el('guestsVal').textContent = state.guests;
      el('perVal').textContent = state.per;
      el('daysVal').textContent = state.days;
      el('formDrink').setAttribute('aria-pressed', state.form === 'drink' ? 'true' : 'false');
      el('formPaste').setAttribute('aria-pressed', state.form === 'paste' ? 'true' : 'false');

      var glasses = state.guests * state.per;
      var litres = Math.ceil(glasses / GLASSES_PER_LITRE);
      var grindDays = Math.ceil(litres / STONE_PER_DAY);
      var paste = state.form === 'paste';

      el('rGlasses').textContent = num(glasses);
      el('rLitres').textContent = num(litres) + (litres === 1 ? ' litre' : ' litres');
      el('rAlmonds').textContent = gfmt(litres * PER.almonds);
      el('rFennel').textContent = gfmt(litres * PER.fennel);
      el('rSaffron').textContent = gfmt(litres * PER.saffron);
      el('rGrind').textContent = grindDays + (grindDays === 1 ? ' day' : ' days');

      el('rowPaste').hidden = !paste;
      el('rowJars').hidden = !paste;
      el('rowHome').hidden = !paste;
      el('rowMilk').hidden = paste;
      el('rowSugar').hidden = paste;

      var total, workings;
      if (paste) {
        var pasteG = litres * PER.paste;
        var jars = Math.ceil(pasteG / JAR_G);
        total = jars * PRICE_JAR;
        el('rPaste').textContent = num(pasteG) + ' g';
        el('rJars').textContent = jars + (jars === 1 ? ' jar' : ' jars');
        el('rHome').textContent = num(litres) + ' L milk · ' + gfmt(litres * PER.sugar) + ' sugar';
        el('rTotalLab').textContent = 'Total — paste jars';
        workings = 'Workings: ' + num(glasses) + ' glasses ÷ 5 to the litre = ' + num(litres) +
          ' litres · paste ' + num(litres) + ' × 125 g = ' + num(pasteG) + ' g · ' + num(pasteG) +
          ' g ÷ 250 g = ' + jars + ' jars · ' + jars + ' × ₹380 = ' + inr(total) + '.';
      } else {
        total = litres * PRICE_DRINK;
        el('rMilk').textContent = num(litres) + (litres === 1 ? ' litre' : ' litres');
        el('rSugar').textContent = gfmt(litres * PER.sugar);
        el('rTotalLab').textContent = 'Total — ready drink';
        workings = 'Workings: ' + num(glasses) + ' glasses ÷ 5 to the litre = ' + num(litres) +
          ' litres · ' + num(litres) + ' × ₹450 = ' + inr(total) + '.';
      }
      el('rTotal').textContent = inr(total);
      el('rWorkings').textContent = workings;

      var verdict = el('verdict'), vText = el('verdictText');
      var available = state.days + 1; /* today, through the gathering morning */
      if (grindDays > available) {
        var bottles = Math.ceil(litres / SYRUP_LITRES);
        verdict.className = 'verdict no';
        verdict.querySelector('strong').textContent = 'The stone cannot do it.';
        vText.textContent = ' ' + num(litres) + ' litres is ' + grindDays + ' days on the stone, and you have ' +
          available + (available === 1 ? ' day' : ' days') + '. The last grinding day of the season is Saturday 20 March — after that the book is shut, whatever the money. ' +
          'What I can send instead: the syrup — ' + bottles + (bottles === 1 ? ' bottle' : ' bottles') + ' at ₹520 dresses the same ' +
          num(glasses) + ' glasses (' + inr(bottles * PRICE_SYRUP) + '), keeps 45 days, and is ground this week while the stone is free.';
      } else {
        verdict.className = 'verdict ok';
        verdict.querySelector('strong').textContent = 'The stone can do it.';
        var t = ' ' + (grindDays === 1 ? 'One day' : grindDays + ' days') + ' on the stone, and ' +
          (state.days === 0 ? 'the gathering is today — the stone starts at dawn.'
            : state.days + (state.days === 1 ? ' day' : ' days') + ' in hand.');
        if (!paste && state.days > 2) {
          t += ' The paste is ground in time; the milk is mixed only the day before — nothing is mixed early and left to sit.';
        }
        if (paste) {
          t += ' The paste keeps ten days in its jars, so it can be ground on the first of those days and wait for you.';
        }
        if (state.days <= 2 && !paste) {
          t += ' The drink will be mixed the day before your gathering and chilled overnight.';
        }
        vText.textContent = t;
      }
    }
    render();
  }

  /* ---------- the order-book form ---------- */
  var form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var reach = document.getElementById('fReach').value.trim();
      var err = document.getElementById('formError');
      if (!name || !reach) {
        err.hidden = false;
        (!name ? document.getElementById('fName') : document.getElementById('fReach')).focus();
        return;
      }
      err.hidden = true;
      var guests = document.getElementById('fGuests').value;
      var formSel = document.getElementById('fForm');
      var formVal = formSel.options[formSel.selectedIndex].value;
      var dateVal = document.getElementById('fDate').value;
      var ref = 'TF-2027-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confRef').textContent = ref;
      var parts = ['Thank you, ' + name + '. Your entry is in the book'];
      if (guests) { parts.push('for ' + guests + ' guests'); }
      parts.push('— ' + formVal.toLowerCase());
      if (dateVal) {
        var d = new Date(dateVal + 'T00:00:00');
        parts.push('on ' + d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      }
      document.getElementById('confText').textContent = parts.join(' ') + '. Your reference is ' + ref + ' — quote it when you write or call.';
      form.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      conf.focus({ preventScroll: false });
    });
  }
})();
