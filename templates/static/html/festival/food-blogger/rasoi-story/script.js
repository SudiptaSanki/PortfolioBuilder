/* Rasoi Story — the masala scale.
   Weights are real kitchen weights for four; scaling is linear for the bulk
   and deliberately sub-linear for spice, salt and fat, which is how a cook
   actually adjusts a pot. No libraries. */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- reveal ---------- */
  var revealables = document.querySelectorAll('.index__list li, .recipe, .card, .voice blockquote, .ing tbody tr');
  if ('IntersectionObserver' in window) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('rise'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- recipe filter ---------- */
  var chips = document.querySelectorAll('.filters .chip');
  if (chips.length) {
    var items = document.querySelectorAll('.recipes [data-type]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        Array.prototype.forEach.call(chips, function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        Array.prototype.forEach.call(items, function (it) {
          it.hidden = want !== 'all' && it.getAttribute('data-type') !== want;
        });
      });
    });
  }

  /* ---------- letter form ---------- */
  var letter = document.getElementById('letter-form');
  if (letter) {
    var sent = document.getElementById('sent');
    var sentList = document.getElementById('sent-list');
    function val(id) { var f = document.getElementById(id); return f ? f.value.trim() : ''; }
    function err(k, m, f) {
      var e = document.getElementById('e-' + k);
      if (e) e.textContent = m || '';
      if (f) f.setAttribute('aria-invalid', m ? 'true' : 'false');
    }
    letter.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = 0;
      var name = val('w-name'), email = val('w-email'), subject = val('w-subject'), msg = val('w-message');
      if (name.length < 2) { err('name', 'A name to sign the reply with.', document.getElementById('w-name')); n++; } else err('name', '', document.getElementById('w-name'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err('email', 'This address looks incomplete.', document.getElementById('w-email')); n++; } else err('email', '', document.getElementById('w-email'));
      if (!subject) { err('subject', 'Pick what this is about.', document.getElementById('w-subject')); n++; } else err('subject', '', document.getElementById('w-subject'));
      if (msg.length < 20) { err('message', 'Twenty characters at least — a question is enough.', document.getElementById('w-message')); n++; } else err('message', '', document.getElementById('w-message'));
      if (n > 0) { var f = letter.querySelector('[aria-invalid="true"]'); if (f) f.focus(); return; }
      var sel = document.getElementById('w-subject');
      sentList.innerHTML = '<dt>From</dt><dd>' + name.replace(/[<>]/g, '') + '</dd>' +
        '<dt>Reply to</dt><dd>' + email.replace(/[<>]/g, '') + '</dd>' +
        '<dt>About</dt><dd>' + sel.options[sel.selectedIndex].text + '</dd>';
      letter.hidden = true;
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  /* ---------- the scale ---------- */
  var body = document.getElementById('ing-body');
  if (!body) return;

  var CUPS = { dal: 200, rice: 190, poha: 80, veg: 150, onion: 160, peanut: 145, jaggery: 200 };

  var RECIPES = {
    amti: {
      name: 'Amti',
      time: 22,
      potPerPerson: 0.75,
      note: 'Boil the dal with turmeric until it collapses, then tamarind and jaggery, then goda masala off the heat.',
      items: [
        { n: 'Toor dal', g: 180, kind: 'bulk', cup: CUPS.dal },
        { n: 'Water', g: 900, kind: 'liquid' },
        { n: 'Tamarind pulp', g: 30, kind: 'bulk', tbsp: 30 },
        { n: 'Jaggery, grated', g: 25, kind: 'bulk', cup: CUPS.jaggery },
        { n: 'Goda masala', g: 8, kind: 'spice' },
        { n: 'Turmeric', g: 1.5, kind: 'spice' },
        { n: 'Red chilli powder', g: 3, kind: 'spice' },
        { n: 'Salt', g: 6, kind: 'salt' },
        { n: 'Ghee', g: 15, kind: 'fat' },
        { n: 'Mustard seeds', g: 2, kind: 'spice' },
        { n: 'Curry leaves', g: 2, kind: 'leaf' },
        { n: 'Asafoetida', g: 0.6, kind: 'spice' }
      ]
    },
    bisi: {
      name: 'Bisi bele bath',
      time: 48,
      potPerPerson: 1.1,
      note: 'Rice and dal together, vegetables in the order that survives, powder from the tin stirred in with the ghee at the end.',
      items: [
        { n: 'Rice', g: 200, kind: 'bulk', cup: CUPS.rice },
        { n: 'Toor dal', g: 120, kind: 'bulk', cup: CUPS.dal },
        { n: 'Mixed vegetables', g: 300, kind: 'bulk', cup: CUPS.veg },
        { n: 'Bisi bele powder', g: 20, kind: 'spice' },
        { n: 'Tamarind pulp', g: 25, kind: 'bulk', tbsp: 30 },
        { n: 'Jaggery', g: 15, kind: 'bulk', cup: CUPS.jaggery },
        { n: 'Ghee', g: 30, kind: 'fat' },
        { n: 'Cashew nuts', g: 30, kind: 'bulk', cup: CUPS.peanut },
        { n: 'Salt', g: 8, kind: 'salt' },
        { n: 'Water', g: 1400, kind: 'liquid' }
      ]
    },
    poha: {
      name: 'Kanda poha',
      time: 15,
      potPerPerson: 0.45,
      note: 'Sprinkle the poha, never wash it. Peanuts in the same oil as the mustard; lemon off the heat.',
      items: [
        { n: 'Thick poha', g: 200, kind: 'bulk', cup: CUPS.poha },
        { n: 'Onion', g: 150, kind: 'bulk', cup: CUPS.onion },
        { n: 'Peanuts', g: 40, kind: 'bulk', cup: CUPS.peanut },
        { n: 'Turmeric', g: 2, kind: 'spice' },
        { n: 'Mustard seeds', g: 3, kind: 'spice' },
        { n: 'Curry leaves', g: 3, kind: 'leaf' },
        { n: 'Lemon juice', g: 20, kind: 'liquid' },
        { n: 'Sugar', g: 8, kind: 'bulk' },
        { n: 'Salt', g: 5, kind: 'salt' },
        { n: 'Oil', g: 30, kind: 'fat' },
        { n: 'Water, sprinkled', g: 100, kind: 'liquid' }
      ]
    }
  };

  var state = { recipe: 'amti', people: 4 };
  window.__rasoi = state;

  var el = {
    people: document.getElementById('people'),
    peopleOut: document.getElementById('people-out'),
    total: document.getElementById('total-weight'),
    pot: document.getElementById('pot-size'),
    time: document.getElementById('cook-time'),
    title: document.getElementById('sheet-title'),
    serves: document.getElementById('sheet-serves'),
    cap: document.getElementById('sheet-cap'),
    body: body,
    note: document.getElementById('sheet-note'),
    warn: document.getElementById('sheet-warn')
  };

  var TSP = 4.6;      /* grams per teaspoon of a ground spice */
  var TBSP = 13.8;

  function fraction(x) {
    var whole = Math.floor(x);
    var frac = x - whole;
    var glyph = '';
    if (frac >= 0.875) { whole += 1; frac = 0; }
    else if (frac >= 0.625) glyph = '¾';
    else if (frac >= 0.375) glyph = '½';
    else if (frac >= 0.125) glyph = '¼';
    if (whole === 0 && glyph) return glyph;
    if (whole === 0 && !glyph) return '0';
    return String(whole) + glyph;
  }

  function weightText(g) {
    if (g >= 1000) return (g / 1000).toFixed(2).replace(/0$/, '') + ' kg';
    if (g >= 100) return Math.round(g) + ' g';
    if (g >= 10) return (Math.round(g * 2) / 2) + ' g';
    return (Math.round(g * 10) / 10) + ' g';
  }

  function measureText(item, g) {
    if (item.kind === 'spice' || item.kind === 'salt') {
      var tsp = g / TSP;
      if (tsp < 0.2) return 'a pinch';
      if (tsp >= 3) return fraction(tsp / 3) + ' tbsp';
      return fraction(Math.round(tsp * 4) / 4) + ' tsp';
    }
    if (item.kind === 'liquid') {
      if (g >= 1000) return (g / 1000).toFixed(2).replace(/0$/, '') + ' L';
      return Math.round(g) + ' ml';
    }
    if (item.kind === 'leaf') return Math.round(g / 0.4) + ' leaves';
    if (item.tbsp) return fraction(g / item.tbsp) + ' tbsp';
    if (item.cup) {
      var cups = g / item.cup;
      if (cups < 0.3) return fraction(cups) + ' cup';
      return fraction(Math.round(cups * 4) / 4) + ' cup';
    }
    return '—';
  }

  function factorFor(kind, f) {
    if (kind === 'spice') return 1 + (f - 1) * 0.82;
    if (kind === 'salt') return 1 + (f - 1) * 0.9;
    if (kind === 'fat') return 1 + (f - 1) * 0.94;
    return f;
  }

  function render() {
    var r = RECIPES[state.recipe];
    var f = state.people / 4;
    var rows = [];
    var total = 0;

    r.items.forEach(function (it) {
      var k = factorFor(it.kind, f);
      var g = it.g * k;
      total += g;
      var cls = it.kind === 'spice' || it.kind === 'leaf' ? 'is-spice' : it.kind === 'salt' ? 'is-salt' : '';
      rows.push('<tr class="' + cls + '"><td>' + it.n + '</td><td>' + weightText(g) + '</td><td>' + measureText(it, g) + '</td></tr>');
    });

    el.body.innerHTML = rows.join('');
    el.title.textContent = r.name;
    el.serves.textContent = 'for ' + state.people;
    el.cap.textContent = 'Written for four, scaled to ' + state.people;
    el.peopleOut.textContent = String(state.people);
    el.total.textContent = weightText(total);

    var litres = r.potPerPerson * state.people;
    var pot;
    if (litres <= 1.5) pot = '1.5 L saucepan';
    else if (litres <= 3) pot = '3 L saucepan';
    else if (litres <= 5) pot = '5 L pressure cooker';
    else if (litres <= 8) pot = '8 L pressure cooker';
    else pot = 'Two 6 L pots';
    el.pot.textContent = pot;

    var minutes = r.time + (f > 1.5 ? 5 : 0) + (f > 3 ? 10 : 0);
    el.time.textContent = minutes + ' min';

    var notes = [];
    if (f < 1) {
      notes.push('Halving is the one place the scale misleads — use the measure column rather than the weight, and keep the cooking time the same.');
    } else if (f <= 1.5) {
      notes.push('Straight multiplication at this size. Nothing to adjust.');
    } else if (f <= 2.5) {
      notes.push('Spices are scaled to 82% of the linear amount and salt to 90%. Cook in the same pot and taste at the end, not at the start.');
    } else {
      notes.push('Above 2.5× the method changes, not only the weights: fry the masala in a wider pan so the oil keeps the same depth, and add the tamarind in two goes because a big pot takes longer to balance.');
    }
    el.note.textContent = notes[0];

    var warns = [];
    if (litres > 8) warns.push('Two pots, two burners, and stir the base of each every ten minutes: a domestic burner heats one spot.');
    if (state.recipe === 'poha' && state.people >= 12) warns.push('Poha for twelve needs two pans. In one pan the flakes on the bottom go soft before the top is hot, and the stir breaks them.');
    if (state.recipe === 'bisi' && f > 2.5) warns.push('Bisi bele bath for more than ten needs the rice and dal cooked separately, then folded together, or the rice turns to paste.');
    el.warn.hidden = warns.length === 0;
    el.warn.textContent = warns.join(' ');

    state.factor = f;
    state.total = total;
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-recipe]'), function (b) {
    b.addEventListener('click', function () {
      state.recipe = b.getAttribute('data-recipe');
      Array.prototype.forEach.call(document.querySelectorAll('[data-recipe]'), function (o) {
        var on = o === b;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  el.people.addEventListener('input', function () {
    state.people = parseInt(el.people.value, 10);
    render();
  });

  render();
})();
