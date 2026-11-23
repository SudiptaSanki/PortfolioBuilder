/* Verma Chaat — stall board interactions.
   Sound ruling: FAILS the need-test — no audio anywhere. A chaat counter
   is not a sound profession and nothing here teaches through audio; the
   stall's noise belongs to the bazaar, not the website. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces as an unhandled InvalidStateError rejection;
     the navigation itself always completes, so swallow only that. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveals (opacity only) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (reduced || !('IntersectionObserver' in window)) {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    rvEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- mobile menu: the hanging board ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('menu-panel');
  if (btn && panel) {
    var open = false;
    function setMenu(state, focusFirst) {
      open = state;
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.hidden = false;
        panel.classList.remove('opening');
        void panel.offsetWidth; /* restart the drop animation */
        panel.classList.add('opening');
        document.body.style.overflow = 'hidden';
        if (focusFirst) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              var first = panel.querySelector('a');
              if (first) first.focus();
            });
          });
        }
      } else {
        panel.hidden = true;
        document.body.style.overflow = '';
      }
    }
    btn.addEventListener('click', function () { setMenu(!open, true); });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { setMenu(false, false); btn.focus(); }
    });
  }

  /* ---------- shared money format ---------- */
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }

  /* ==================================================================
     THE CHAAT BUILDER
     One data model. The printed menu card and the printed heat chart on
     the same page carry the same numbers; the probe asserts the ticket
     against both.
     ================================================================== */
  var HEAT = [
    { level: 0, name: 'Bina mirch', measure: 'No chilli at all', note: 'No green chilli, no chilli powder. Tang from imli and amchur only — the plate for children and the cautious.' },
    { level: 1, name: 'Halki', measure: '¼ tsp Kashmiri chilli powder', note: 'Colour more than heat. Kashmiri chilli is bred for red, not fire.' },
    { level: 2, name: 'Beech ki', measure: '½ tsp chopped green chilli + ¼ tsp chilli powder', note: 'The counter standard. Warm all the way through, gone in a minute.' },
    { level: 3, name: 'Teekhi', measure: '1 tsp chopped green chilli + ½ tsp chilli powder', note: 'Proper heat. Most regulars who say “spicy” mean this.' },
    { level: 4, name: 'Sarafa teekhi', measure: '2 tsp chopped green chilli + 1 tsp chilli powder + a fresh chilli on top', note: 'The night-market level. We will ask once — “pakka?” — and then build it exactly so.' }
  ];
  var BASES = {
    tikki: {
      name: 'Aloo Tikki Chaat', price: 120, defaultHeat: 2,
      core: ['Crisp aloo tikki — potato, shallow-fried on the tawa to order', 'Chopped onion', 'Fresh coriander', 'Chaat masala sprinkle'],
      allergens: [], finishes: ['yoghurt', 'sev']
    },
    panipuri: {
      name: 'Pani Puri', price: 80, defaultHeat: 3,
      core: ['8 semolina puris, cracked one at a time', 'Potato–chickpea filling', 'Chilled mint water (theekha pani), poured at the counter', 'Chaat masala sprinkle'],
      allergens: ['Gluten — semolina puri'], finishes: []
    },
    bhel: {
      name: 'Bhel Puri', price: 90, defaultHeat: 2,
      core: ['Puffed rice (murmura)', 'Boiled potato', 'Onion and tomato, cut small', 'Raw mango when it is in season'],
      allergens: [], finishes: ['sev']
    },
    papdi: {
      name: 'Papdi Chaat', price: 110, defaultHeat: 1,
      core: ['Papdi — fried flour discs, baked off each morning', 'Boiled potato', 'Chopped onion', 'Chaat masala sprinkle'],
      allergens: ['Gluten — papdi'], finishes: ['yoghurt', 'sev']
    },
    samosa: {
      name: 'Samosa Chaat', price: 140, defaultHeat: 2,
      core: ['One samosa, crushed open while hot', 'Spiced chole (chickpeas)', 'Chopped onion', 'Fresh coriander'],
      allergens: ['Gluten — samosa pastry'], finishes: ['yoghurt', 'sev']
    }
  };
  var CHUTNEYS = {
    light: { name: 'Light', desc: 'Tamarind only, half measure', up: 0, line: 'Imli (tamarind) chutney, half measure' },
    standard: { name: 'Standard', desc: 'Tamarind + mint, full measure', up: 0, line: 'Imli (tamarind) and pudina (mint) chutneys, full measure' },
    generous: { name: 'Generous', desc: 'Double chutney, both kinds', up: 10, line: 'Imli and pudina chutneys, double measure' }
  };
  var FINISHES = {
    sev: { name: 'Sev crunch', up: 0, allergen: 'Gluten — besan sev', line: 'Sev, added in the last 20 seconds so it stays crisp' },
    yoghurt: { name: 'Whipped yoghurt', up: 0, allergen: 'Dairy — curd (yoghurt)', line: 'Whipped yoghurt (dahi), salted and beaten smooth' },
    peanut: { name: 'Crushed peanut', up: 20, allergen: 'Peanut', line: 'Crushed roasted peanut' },
    pom: { name: 'Pomegranate', up: 10, allergen: null, line: 'Pomegranate seeds (anar)' }
  };

  var builder = document.getElementById('builder');
  if (builder) {
    var state = { base: 'tikki', chutney: 'standard', heat: 2, finishes: { sev: true, yoghurt: true, peanut: false, pom: false } };

    function chipGroup(name) { return builder.querySelectorAll('[data-group="' + name + '"] .chip'); }
    function markGroup(name, val) {
      chipGroup(name).forEach(function (c) {
        c.setAttribute('aria-pressed', String(c.getAttribute('data-val') === String(val)));
      });
    }
    function render() {
      var b = BASES[state.base], ch = CHUTNEYS[state.chutney], h = HEAT[state.heat];
      markGroup('base', state.base);
      markGroup('chutney', state.chutney);
      markGroup('heat', state.heat);
      chipGroup('finish').forEach(function (c) {
        c.setAttribute('aria-pressed', String(!!state.finishes[c.getAttribute('data-val')]));
      });

      /* component list, in assembly order */
      var items = b.core.slice();
      items.splice(1, 0, ch.line);
      Object.keys(FINISHES).forEach(function (k) {
        if (state.finishes[k] && k !== 'sev') items.push(FINISHES[k].line);
      });
      if (state.finishes.sev) items.push(FINISHES.sev.line); /* sev always last */

      var list = document.getElementById('t-build');
      list.innerHTML = '';
      items.forEach(function (t) {
        var li = document.createElement('li'); li.textContent = t; list.appendChild(li);
      });

      /* heat readout — the same words as the printed wall chart */
      var dots = '';
      for (var i = 0; i < 5; i++) dots += '<i class="' + (i < state.heat ? 'on' : '') + '"></i>';
      document.getElementById('t-heat').innerHTML =
        '<span class="heat-dots" aria-hidden="true">' + dots + '</span>Level ' + h.level + ' — ' + h.name +
        '<br><span class="mono small">' + h.measure + '</span><br>' + h.note;

      /* allergen flags — computed from base + finishes, never typed twice */
      var flags = b.allergens.slice();
      Object.keys(FINISHES).forEach(function (k) {
        if (state.finishes[k] && FINISHES[k].allergen) flags.push(FINISHES[k].allergen);
      });
      var flagBox = document.getElementById('t-allergens');
      flagBox.innerHTML = '';
      if (!flags.length) {
        var s = document.createElement('span');
        s.className = 'flag none'; s.textContent = 'No flagged allergens in this build';
        flagBox.appendChild(s);
        var note = document.createElement('div');
        note.className = 'small'; note.style.marginTop = '6px';
        note.textContent = 'The counter still handles peanut, dairy and gluten all day — tell us about any allergy and the plate is built on a clean board with a clean spoon.';
        flagBox.appendChild(note);
      } else {
        flags.forEach(function (f) {
          var s = document.createElement('span');
          s.className = 'flag'; s.textContent = f; flagBox.appendChild(s);
        });
      }

      /* diet line — yoghurt is dairy, so yoghurt on means not vegan */
      document.getElementById('t-diet').textContent = state.finishes.yoghurt
        ? 'Vegetarian · Not vegan — this build carries yoghurt. Take the yoghurt off and it is vegan.'
        : 'Vegetarian · Vegan as built — no yoghurt, no dairy in this build.';

      /* price — arithmetic printed on the ticket */
      var parts = [inr(b.price) + ' base'];
      var total = b.price;
      if (ch.up) { parts.push(inr(ch.up) + ' generous chutney'); total += ch.up; }
      Object.keys(FINISHES).forEach(function (k) {
        if (state.finishes[k] && FINISHES[k].up) { parts.push(inr(FINISHES[k].up) + ' ' + FINISHES[k].name.toLowerCase()); total += FINISHES[k].up; }
      });
      document.getElementById('t-price').innerHTML =
        parts.join(' + ') + '<br><span class="total">= ' + inr(total) + '</span> per plate';
      document.getElementById('t-name').textContent = b.name;
    }

    builder.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var group = chip.closest('[data-group]').getAttribute('data-group');
      var val = chip.getAttribute('data-val');
      if (group === 'base') {
        state.base = val;
        state.heat = BASES[val].defaultHeat;
        state.finishes = { sev: false, yoghurt: false, peanut: false, pom: false };
        BASES[val].finishes.forEach(function (k) { state.finishes[k] = true; });
      } else if (group === 'chutney') {
        state.chutney = val;
      } else if (group === 'heat') {
        state.heat = parseInt(val, 10);
      } else if (group === 'finish') {
        state.finishes[val] = !state.finishes[val];
      }
      render();
    });
    render();
  }

  /* ==================================================================
     EVENT COUNTER CALCULATOR — packages printed on the same page.
     ================================================================== */
  var PKGS = {
    counter: { name: 'The Chaat Counter', rate: 450, min: 50, setup: 5000, waiveAt: 100 },
    board: { name: 'The Full Board', rate: 650, min: 40, setup: 7500, waiveAt: 120 }
  };
  var calc = document.getElementById('evcalc');
  if (calc) {
    var pkg = 'counter', covers = 80, travel = 0;
    var coversInput = document.getElementById('ev-covers');
    function renderCalc() {
      var p = PKGS[pkg];
      calc.querySelectorAll('[data-pkg] .chip').forEach(function (c) {
        c.setAttribute('aria-pressed', String(c.getAttribute('data-val') === pkg));
      });
      coversInput.value = covers;
      var food = covers * p.rate;
      var setup = covers >= p.waiveAt ? 0 : p.setup;
      var total = food + setup + travel;
      var lines =
        '<div>' + covers + ' covers × ' + inr(p.rate) + ' = ' + inr(food) + '</div>' +
        '<div>Counter setup: ' + (setup ? inr(setup) : 'waived at ' + p.waiveAt + '+ covers') + '</div>' +
        '<div>Travel: ' + (travel ? inr(travel) + ' (outside Indore, flat)' : 'included (within Indore)') + '</div>' +
        '<div class="total">Total ' + inr(total) + '</div>';
      document.getElementById('ev-lines').innerHTML = lines;
      var note = document.getElementById('ev-note');
      if (covers < p.min) {
        note.textContent = 'Below the ' + p.min + '-cover minimum for ' + p.name + ' — the fryers need a minimum run to be worth firing. Priced as entered; the minimum applies at booking. For smaller groups, ask about the assemble-at-the-table kit on the About page.';
      } else {
        note.textContent = 'An estimate from the printed card, not a quote: the date, the venue and the final dish list settle the number, in writing, before any advance is taken.';
      }
    }
    calc.querySelector('[data-pkg]').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      pkg = chip.getAttribute('data-val');
      renderCalc();
    });
    document.getElementById('ev-travel').addEventListener('change', function (e) {
      travel = parseInt(e.target.value, 10) || 0;
      renderCalc();
    });
    document.getElementById('ev-minus').addEventListener('click', function () {
      covers = Math.max(10, covers - 10); renderCalc();
    });
    document.getElementById('ev-plus').addEventListener('click', function () {
      covers = Math.min(1000, covers + 10); renderCalc();
    });
    coversInput.addEventListener('change', function () {
      var v = parseInt(coversInput.value, 10);
      covers = isNaN(v) ? 10 : Math.max(10, Math.min(1000, v));
      renderCalc();
    });
    renderCalc();
  }

  /* ==================================================================
     CONTACT FORM — demonstration. Validates, confirms in-page with a
     generated reference, transmits nothing.
     ================================================================== */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('f-type');
    if (typeSel && params.get('type')) {
      var want = params.get('type');
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === want) { typeSel.selectedIndex = i; break; }
      }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = [
        { id: 'f-name', test: function (v) { return v.trim().length >= 2; } },
        { id: 'f-contact', test: function (v) { return v.trim().length >= 5; } },
        { id: 'f-msg', test: function (v) { return v.trim().length >= 10; } }
      ];
      var firstBad = null, badCount = 0;
      required.forEach(function (r) {
        var input = document.getElementById(r.id);
        var field = input.closest('.field');
        var ok = r.test(input.value);
        field.classList.toggle('invalid', !ok);
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok) { badCount++; if (!firstBad) firstBad = input; }
      });
      if (badCount) { firstBad.focus(); return; }
      var ref = 'NV-2026-' + Math.floor(100 + Math.random() * 900);
      document.getElementById('confirm-ref').textContent = ref;
      form.hidden = true;
      var confirm = document.getElementById('confirm');
      confirm.hidden = false;
      confirm.querySelector('h3').focus && confirm.querySelector('h3').setAttribute('tabindex', '-1');
      confirm.querySelector('h3').focus();
    });
    var again = document.getElementById('send-another');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        form.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
        document.getElementById('confirm').hidden = true;
        form.hidden = false;
        document.getElementById('f-name').focus();
      });
    }
  }

  /* footer year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
