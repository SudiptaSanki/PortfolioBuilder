/* Orris & Copper — yield mixer, note pyramid and page behaviour */

(function () {
  'use strict';

  var navbtn = document.querySelector('.navbtn');
  var mnav = document.getElementById('mnav');
  if (navbtn && mnav) {
    navbtn.addEventListener('click', function () {
      var open = navbtn.getAttribute('aria-expanded') === 'true';
      navbtn.setAttribute('aria-expanded', String(!open));
      mnav.hidden = open;
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mnav.hidden = true;
        navbtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mnav.hidden) {
        mnav.hidden = true;
        navbtn.setAttribute('aria-expanded', 'false');
        navbtn.focus();
      }
    });
  }

  /* ---------- yield mixer ---------- */
  var botanical = document.getElementById('botanical');
  if (!botanical) return;

  var method = document.getElementById('method');
  var charge = document.getElementById('charge');
  var chargeOut = document.getElementById('charge-out');
  var yieldPct = document.getElementById('yield-pct');
  var yieldRange = document.getElementById('yield-range');
  var yieldFill = document.getElementById('yield-fill');
  var outProduct = document.getElementById('out-product');
  var outHours = document.getElementById('out-hours');
  var outWater = document.getElementById('out-water');
  var outCost = document.getElementById('out-cost');
  var note = document.getElementById('mixer-note');

  var DATA = {
    rose: {
      label: 'Rosa damascena — fresh petals',
      cost: 6.2,
      yields: { hydro: 0.045, steam: 0.040, concrete: 0.30, absolute: 0.18 },
      ranges: { hydro: 'published range 0.035–0.049% of fresh flowers', steam: 'published range 0.030–0.045%', concrete: 'published range 0.30–0.66% of fresh flowers', absolute: 'concrete at 0.30%, absolute at 60% of the concrete' },
      notes: {
        hydro: 'Hydrodistillation of fresh Damask rose. The oil separates from the hydrosol; the water keeps most of the phenylethyl alcohol, which is why the distilled oil smells sharper than the flower.',
        steam: 'Steam at the same charge runs a little faster and a little drier. The first oil and the cohobated second oil are blended afterwards.',
        concrete: 'Solvent extraction of fresh petals. The concrete is a waxy paste holding the full flower, including the honeyed note distillation loses.',
        absolute: 'The concrete is washed with ethanol and the waxes drop out. Two stages, two records; the yield above is of the original flowers.'
      }
    },
    orris: {
      label: 'Iris pallida — dried rhizome',
      cost: 58,
      yields: { hydro: 0.050, steam: 0.048, concrete: 0.90, absolute: 0.50 },
      ranges: { hydro: 'published range 0.045–0.055% of dried rhizome', steam: 'published range 0.040–0.055%', concrete: 'published 0.6–1.2% solvent extract', absolute: 'concrete at 0.9%, absolute at 55% of the concrete' },
      notes: {
        hydro: 'What the trade calls orris butter: a waxy, cream-coloured mass rather than a mobile oil, because myristic acid comes over with the steam. Three years of drying before the rhizome is charged.',
        steam: 'The same butter with a tighter cut. The irone content, not the yield, decides whether the batch is worth keeping.',
        concrete: 'A solvent extract of dried rhizome. The word concrete describes the texture here as much as the method.',
        absolute: 'Ethanol washing of the orris concrete. Used where the wax would cloud a clear perfume.'
      }
    },
    jasmine: {
      label: 'Jasminum grandiflorum — fresh flowers',
      cost: 19,
      yields: { hydro: 0.010, steam: 0.008, concrete: 0.35, absolute: 0.21 },
      ranges: { hydro: 'distilled jasmine oil is rare, published 0.005–0.012%', steam: 'published 0.005–0.010%', concrete: 'published range 0.10–0.50% of fresh flowers', absolute: 'concrete at 0.35%, absolute at 60% of the concrete' },
      notes: {
        hydro: 'Jasmine is not usually distilled: the flower gives up little oil and the tea-like notes dominate. When we do it, the charge is small and the fire is low.',
        steam: 'A slightly higher yield and a greener top. Still a curiosity rather than a commercial material.',
        concrete: 'Picked before dawn, extracted the same morning with hexane. The concrete is the material most jasmine perfumes are actually built on.',
        absolute: 'The concrete washed with ethanol. Indolic, animalic, and much stronger than the numbers suggest.'
      }
    },
    vetiver: {
      label: 'Vetiveria zizanioides — dried roots',
      cost: 4.1,
      yields: { hydro: 1.10, steam: 1.00, concrete: 3.00, absolute: 1.95 },
      ranges: { hydro: 'published range 0.8–1.5% of dried root', steam: 'published range 0.8–1.4%', concrete: 'published 2–4% solvent extract of root', absolute: 'concrete at 3.0%, absolute at 65% of the concrete' },
      notes: {
        hydro: 'Two-year-old roots, washed and shredded. The oil is heavy; the first oil and the cohobated water are kept apart and blended to the brief.',
        steam: 'Steam gives a cleaner, less smoky oil from the same roots. Haitian material is earthier than Javanese.',
        concrete: 'Solvent extraction of dried root, used when the smoky top notes are wanted in a resin.',
        absolute: 'The concrete washed with ethanol; softer and more wearable than the oil, with less of the campfire.'
      }
    },
    labdanum: {
      label: 'Cistus ladanifer — dried leaf',
      cost: 2.6,
      yields: { hydro: 0.60, steam: 0.55, concrete: 2.40, absolute: 1.44 },
      ranges: { hydro: 'published 0.4–0.8% of dried leaf', steam: 'published 0.4–0.7%', concrete: 'published 1.5–3.0% resinoid', absolute: 'resinoid at 2.4%, absolute at 60% of the resinoid' },
      notes: {
        hydro: 'An oil from the rock-rose leaf: leather, amber and a little smoke. Used in small doses; it can swallow a composition.',
        steam: 'A cleaner cut with the same leathery body and a softer opening.',
        concrete: 'A resinoid from dried leaf, washed twice. The material most amber accords are built on.',
        absolute: 'The resinoid washed with ethanol: sweeter, more powdery, easier to blend into a floral heart.'
      }
    },
    neroli: {
      label: 'Citrus aurantium — fresh blossom',
      cost: 12.5,
      yields: { hydro: 0.100, steam: 0.090, concrete: 0.25, absolute: 0.125 },
      ranges: { hydro: 'published range 0.08–0.12% of fresh blossom', steam: 'published 0.07–0.11%', concrete: 'published 0.2–0.3% of blossom', absolute: 'concrete at 0.25%, absolute at 50% of the concrete' },
      notes: {
        hydro: 'Bitter orange blossom distilled within four hours of picking. A delay turns the top soapy and the batch is lost.',
        steam: 'Steam distillation of the same blossom: a slightly greener oil, with the honeyed note further back.',
        concrete: 'Solvent extraction of fresh blossom. The concrete is dark and strong; the absolute is what most perfumers buy.',
        absolute: 'The concrete washed with ethanol. Honeyed, green, and one of the few materials that can carry a whole composition.'
      }
    }
  };

  var METHOD_HOURS = { hydro: 1.6, steam: 1.2, concrete: 6.0, absolute: 3.0 };
  var METHOD_WATER = { hydro: 3.0, steam: 3.0, concrete: 1.2, absolute: 2.0 };

  function money(n) {
    return '€' + Math.round(n).toLocaleString('en-GB');
  }

  function updateMixer() {
    var key = botanical.value;
    var m = method.value;
    var d = DATA[key];
    var kg = Number(charge.value);
    var pct = d.yields[m];
    var product = kg * pct / 100;
    var hours = Math.max(0.5, (kg / 500) * METHOD_HOURS[m]);
    var water = kg * METHOD_WATER[m];
    var cost = kg * d.cost + hours * 22;

    chargeOut.textContent = String(kg);
    yieldPct.textContent = pct < 0.1 ? pct.toFixed(3) : pct.toFixed(2);
    yieldRange.textContent = d.ranges[m];
    yieldFill.style.width = Math.min(100, (pct / 2.6) * 100).toFixed(1) + '%';
    outProduct.textContent = product < 1 ? Math.round(product * 1000) + ' g' : product.toFixed(2) + ' kg';
    outHours.textContent = hours.toFixed(1) + ' h';
    outWater.textContent = Math.round(water) + ' L';
    outCost.textContent = money(cost);
    note.textContent = d.notes[m];
  }

  [botanical, method, charge].forEach(function (el) {
    el.addEventListener('input', updateMixer);
    el.addEventListener('change', updateMixer);
  });
  updateMixer();

  /* ---------- note pyramid ---------- */
  var TIERS = {
    top: {
      k: 'Top · 12% of the concentrate',
      title: 'The first ten minutes',
      body: 'Bergamot gives the lift and the pink pepper the bite; neroli ties the citrus to the flower that is coming. This is the part that has to smell expensive before anyone has decided to like the perfume.',
      notes: [
        ['Bergamot', '6.0%', 'Calabria'],
        ['Pink pepper', '3.5%', 'Réunion'],
        ['Neroli', '2.5%', 'Vallauris']
      ]
    },
    heart: {
      k: 'Heart · 33% of the concentrate',
      title: 'The middle, where the flower lives',
      body: 'Rose absolute carries the composition and orris gives it the powder; jasmine in a small dose keeps the rose from reading like soap. This is the part that has to work at an hour, when the citrus has gone.',
      notes: [
        ['Rose absolute', '18.0%', 'Isparta'],
        ['Orris butter', '9.0%', 'Tuscany'],
        ['Jasmine absolute', '6.0%', 'Grasse']
      ]
    },
    base: {
      k: 'Base · 55% of the concentrate',
      title: 'What is left on the skin',
      body: 'Labdanum gives the amber and the leather, vetiver the earth under it, cedar the dry spine. At 55% the base is heavier than a cologne and lighter than an oriental; it is what the linen still holds after a night on the line.',
      notes: [
        ['Labdanum resinoid', '24.0%', 'Andalusia'],
        ['Vetiver oil', '19.0%', 'Les Cayes'],
        ['Cedar', '12.0%', 'Atlas']
      ]
    }
  };

  var pyramid = document.getElementById('pyramid');
  if (pyramid) {
    var kEl = document.getElementById('tier-k');
    var titleEl = document.getElementById('tier-title');
    var bodyEl = document.getElementById('tier-body');
    var listEl = document.getElementById('tier-list');
    pyramid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tier]');
      if (!btn) return;
      var key = btn.getAttribute('data-tier');
      Array.prototype.forEach.call(pyramid.querySelectorAll('[data-tier]'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var t = TIERS[key];
      kEl.textContent = t.k;
      titleEl.textContent = t.title;
      bodyEl.textContent = t.body;
      listEl.innerHTML = t.notes.map(function (n) {
        return '<li><span class="note__n">' + n[0] + '</span><span class="note__d">' + n[1] + '</span><span class="note__o">' + n[2] + '</span></li>';
      }).join('');
    });
  }
})();

/* ---------- brief form ---------- */
(function () {
  var form = document.getElementById('brief-form');
  if (!form) return;
  var status = document.getElementById('brief-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      if (!el.value.trim()) {
        ok = false;
        el.style.borderColor = '#a9643c';
        el.setAttribute('aria-invalid', 'true');
      } else {
        el.style.borderColor = '';
        el.removeAttribute('aria-invalid');
      }
    });
    if (!ok) {
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var val = function (id) { return (form.querySelector('#' + id).value || '').trim(); };
    var wants = Array.prototype.slice.call(form.querySelectorAll('input[name="need"]:checked')).map(function (c) { return c.value; }).join(', ') || 'not stated';
    var ref = 'OC-' + String(Date.now()).slice(-6);
    var body = [
      'Name: ' + val('b-name'),
      'House or studio: ' + (val('b-house') || '\u2014'),
      'Email: ' + val('b-email'),
      'Brief: ' + val('b-type'),
      'Volume: ' + val('b-volume'),
      'Need: ' + wants,
      '',
      val('b-message')
    ].join('\n');
    var mail = 'mailto:alembic@orrisandcopper.example?subject=' + encodeURIComponent('Brief ' + ref) + '&body=' + encodeURIComponent(body);
    status.hidden = false;
    status.innerHTML = '<h3>Brief ' + ref + ' assembled</h3>' +
      '<p>Nothing has been sent yet. Your brief is ready as an email; open it and send it, or write to <a href="mailto:alembic@orrisandcopper.example">alembic@orrisandcopper.example</a>.</p>' +
      '<p><a href="' + mail + '">Open the email with the brief</a></p>';
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
