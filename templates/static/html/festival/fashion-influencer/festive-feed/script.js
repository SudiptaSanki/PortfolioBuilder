/* Festive Feed — festive look planner and page behaviour. */
(function () {
  'use strict';

  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* reveal */
  var items = Array.prototype.slice.call(document.querySelectorAll('.planner, .feed-section, .quote-band, .closing, .page-head, .about-grid, .timeline, .kit-table, .work, .contact-grid, .faq'));
  if (items.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.94) el.classList.add('reveal');
    });
    var check = function () {
      document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.93) el.classList.add('is-in');
      });
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    check();
    setTimeout(check, 1200);
  }

  /* ---------- look planner ---------- */
  var OCCASIONS = {
    diwali: { label: 'Diwali puja', note: 'A long day, a short puja, a lot of photographs in the courtyard.' },
    sangeet: { label: 'Sangeet', note: 'You will dance, so the hem has to clear your feet and the dupatta has to be pinned.' },
    karva: { label: 'Karva Chauth', note: 'Evening light, a moon photograph, and a blouse that has to sit still through the fast.' },
    reception: { label: 'Reception', note: 'Hotel lighting, a formal room, and heels you can stand in for two hours.' }
  };

  var OUTFITS = [
    { id: 'cotton-kurta', name: 'Cotton-silk kurta set', price: 6800, mood: 'modern', occ: ['diwali', 'karva'], colours: ['#e9a23b', '#b22e3a', '#f4e9d9'] },
    { id: 'georgette', name: 'Georgette saree, hand-embroidered', price: 9800, mood: 'modern', occ: ['karva', 'diwali'], colours: ['#16697a', '#e9a23b', '#f4e9d9'] },
    { id: 'organza', name: 'Organza saree with a red blouse', price: 12400, mood: 'classic', occ: ['diwali', 'karva'], colours: ['#f3d9c0', '#b22e3a', '#e9a23b'] },
    { id: 'sharara', name: 'Sharara set, short kurta', price: 14500, mood: 'modern', occ: ['sangeet', 'karva'], colours: ['#5b2a4e', '#e9a23b', '#f0d9c8'] },
    { id: 'anarkali', name: 'Anarkali in teal silk', price: 18500, mood: 'classic', occ: ['sangeet', 'diwali'], colours: ['#16697a', '#c9a227', '#e9a23b'] },
    { id: 'kanjivaram', name: 'Kanjivaram saree, temple border', price: 28000, mood: 'classic', occ: ['reception', 'diwali'], colours: ['#7a1f2b', '#c9a227', '#e9a23b'] },
    { id: 'sequin', name: 'Sequin lehenga, fitted blouse', price: 32000, mood: 'modern', occ: ['reception', 'sangeet'], colours: ['#9b2d5a', '#e9a23b', '#f2d0a4'] },
    { id: 'banarasi', name: 'Banarasi lehenga, kadhwa border', price: 42000, mood: 'classic', occ: ['reception', 'sangeet'], colours: ['#b22e3a', '#c9a227', '#e9a23b'] }
  ];

  var JEWELLERY = [
    { name: 'Maang tikka, gold-plated', price: 3800 },
    { name: 'Jhumkas, silver-gilt', price: 6500 },
    { name: 'Temple jewellery set', price: 12000 },
    { name: 'Kundan set, rented or bought', price: 18000 },
    { name: 'Polki choker set', price: 32000 }
  ];

  var SHOES = [
    { name: 'Kolhapuri flats', price: 2900 },
    { name: 'Juttis, cushioned', price: 3800 },
    { name: 'Block heels, 3 inch', price: 5200 }
  ];

  var BAGS = [{ name: 'Potli bag, brocade', price: 2400 }];

  var state = { occ: 'diwali', budget: 38000, mood: 'classic' };
  var svgEl = document.getElementById('lookSvg');
  var sheetEl = document.getElementById('lookSheet');
  var paletteEl = document.getElementById('lookPalette');
  var budgetEl = document.getElementById('budget');
  var budgetOut = document.getElementById('budgetOut');

  function inr(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function pick(list, max, preferOrder) {
    var affordable = list.filter(function (item) { return item.price <= max; });
    if (!affordable.length) return null;
    affordable.sort(function (a, b) { return b.price - a.price; });
    if (preferOrder) {
      for (var i = 0; i < preferOrder.length; i++) {
        for (var j = 0; j < affordable.length; j++) {
          if (affordable[j].name.indexOf(preferOrder[i]) !== -1) return affordable[j];
        }
      }
    }
    return affordable[0];
  }

  function plan() {
    var B = state.budget;
    var occasion = OCCASIONS[state.occ];
    var candidates = OUTFITS.filter(function (o) {
      return o.occ.indexOf(state.occ) !== -1;
    });
    if (!candidates.length) candidates = OUTFITS.slice();
    var sameMood = candidates.filter(function (o) { return o.mood === state.mood; });
    if (sameMood.length) candidates = sameMood.concat(candidates.filter(function (o) { return o.mood !== state.mood; }));

    var outfit = null;
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].price <= B * 0.62) { outfit = candidates[i]; break; }
    }
    if (!outfit) {
      var cheapest = candidates.slice().sort(function (a, b) { return a.price - b.price; })[0];
      if (cheapest.price <= B) outfit = cheapest;
    }
    if (!outfit) outfit = OUTFITS.slice().sort(function (a, b) { return a.price - b.price; })[0];

    var tailoring = Math.max(1500, Math.round(outfit.price * 0.09));
    var total = outfit.price + tailoring;
    var remaining = B - total;
    var jewellery = pick(JEWELLERY, remaining * 0.55, state.occ === 'reception' ? ['Kundan', 'Polki', 'Temple'] : ['Temple', 'Jhumkas', 'Maang']);
    if (jewellery) { total += jewellery.price; remaining = B - total; }
    var shoes = pick(SHOES, remaining * 0.4, ['Juttis', 'Block', 'Kolhapuri']);
    if (shoes) { total += shoes.price; remaining = B - total; }
    var bag = null;
    if (remaining > 2600) {
      var b = BAGS[0];
      if (b.price <= remaining * 0.5) { bag = b; total += b.price; remaining = B - total; }
    }
    return { outfit: outfit, tailoring: tailoring, jewellery: jewellery, shoes: shoes, bag: bag, total: total, left: B - total, B: B, occasion: occasion };
  }

  function figureSvg(p) {
    var c = p.outfit.colours;
    var classic = state.mood === 'classic';
    var parts = [];
    parts.push('<rect width="320" height="380" fill="#f4e9d9"/>');
    parts.push('<circle cx="160" cy="150" r="132" fill="#fbf6ee" opacity="0.75"/>');

    /* skirt */
    parts.push('<path d="M128 148h64l46 162H82z" fill="' + c[0] + '"/>');
    parts.push('<path d="M82 302h156l6 12H76z" fill="' + c[1] + '"/>');
    parts.push('<path d="M136 152 118 300M148 154 140 300M160 156v144M172 154l8 146M184 152l18 148" stroke="' + c[1] + '" stroke-width="' + (classic ? 1.6 : 0.9) + '" opacity="0.5"/>');

    /* dupatta behind the shoulder */
    parts.push('<path d="M188 104c28 22 36 60 26 104-18-12-30-34-34-58z" fill="' + c[1] + '" opacity="0.92"/>');

    /* blouse */
    parts.push('<path d="M132 106h56l7 46h-70z" fill="' + c[2] + '"/>');
    parts.push('<path d="M128 148c22 12 42 12 64 0l5 12c-24 12-50 12-74 0z" fill="' + c[1] + '"/>');
    parts.push('<path d="M132 106c-6 10-8 22-6 34l10 2c0-12 2-24 6-32zM188 106c6 10 8 22 6 34l-10 2c0-12-2-24-6-32z" fill="' + c[2] + '"/>');

    /* arms */
    parts.push('<path d="M132 118c-12 18-15 40-12 62" stroke="#e2bd9b" stroke-width="9" fill="none" stroke-linecap="round"/>');
    parts.push('<path d="M188 118c12 18 15 40 12 62" stroke="#e2bd9b" stroke-width="9" fill="none" stroke-linecap="round"/>');

    /* neck and head */
    parts.push('<rect x="152" y="88" width="16" height="22" fill="#e2bd9b"/>');
    parts.push('<circle cx="160" cy="68" r="28" fill="#e2bd9b"/>');
    parts.push('<path d="M132 64c0-16 12-27 28-27s28 11 28 27c-8-6-17-8-28-8s-20 2-28 8Z" fill="#241a14"/>');
    parts.push('<circle cx="190" cy="50" r="8" fill="#241a14"/>');
    parts.push('<g fill="#3a2b22"><circle cx="150" cy="70" r="1.8"/><circle cx="170" cy="70" r="1.8"/></g>');
    parts.push('<path d="M154 80c4 3 8 3 12 0" stroke="#b5745a" stroke-width="1.3" fill="none"/>');

    if (classic) {
      parts.push('<g fill="' + c[1] + '"><circle cx="104" cy="176" r="4"/><circle cx="120" cy="212" r="4"/><circle cx="216" cy="176" r="4"/><circle cx="200" cy="212" r="4"/><circle cx="160" cy="250" r="4"/><circle cx="138" cy="284" r="3"/><circle cx="182" cy="284" r="3"/></g>');
    } else {
      parts.push('<g fill="' + c[1] + '" opacity="0.8"><circle cx="138" cy="196" r="3"/><circle cx="182" cy="196" r="3"/><circle cx="160" cy="266" r="3"/></g>');
    }
    if (p.jewellery) {
      parts.push('<path d="M144 104c10 14 22 14 32 0" fill="none" stroke="#c9a227" stroke-width="2.2"/>');
      parts.push('<circle cx="160" cy="120" r="4" fill="#c9a227"/>');
      parts.push('<circle cx="128" cy="88" r="3" fill="#c9a227"/><circle cx="192" cy="88" r="3" fill="#c9a227"/>');
      parts.push('<path d="M150 88v8M170 88v8" stroke="#c9a227" stroke-width="1"/>');
    }
    if (p.shoes) {
      parts.push('<path d="M118 300c-3 12 6 18 17 18s15-6 13-18z" fill="' + c[1] + '"/>');
      parts.push('<path d="M176 300c-3 12 6 18 17 18s15-6 13-18z" fill="' + c[1] + '"/>');
    }
    if (p.bag) {
      parts.push('<g transform="translate(232 240)"><path d="M0 12c0-8 7-14 16-14s16 6 16 14l-4 24H4z" fill="' + c[1] + '"/><path d="M6 2c0-6 4-10 10-10s10 4 10 10" fill="none" stroke="#f2d0a4" stroke-width="1.8"/></g>');
    }
    parts.push('<text x="160" y="360" text-anchor="middle" font-family="Manrope, sans-serif" font-size="9" letter-spacing="2" fill="#7d6a5e">' + p.occasion.label.toUpperCase() + '</text>');
    return parts.join('');
  }

  function render() {
    if (!svgEl || !sheetEl) return;
    var p = plan();
    svgEl.innerHTML = figureSvg(p);
    paletteEl.innerHTML = p.outfit.colours.map(function (c) { return '<span style="background:' + c + '"></span>'; }).join('');
    var rows = '<div class="row"><span>Outfit · ' + p.outfit.name + '</span><span>' + inr(p.outfit.price) + '</span></div>';
    rows += '<div class="row"><span>Tailoring &amp; blouse</span><span>' + inr(p.tailoring) + '</span></div>';
    rows += '<div class="row"><span>Jewellery · ' + (p.jewellery ? p.jewellery.name : 'none at this budget') + '</span><span>' + (p.jewellery ? inr(p.jewellery.price) : '—') + '</span></div>';
    rows += '<div class="row"><span>Footwear · ' + (p.shoes ? p.shoes.name : 'none at this budget') + '</span><span>' + (p.shoes ? inr(p.shoes.price) : '—') + '</span></div>';
    rows += '<div class="row"><span>Bag · ' + (p.bag ? p.bag.name : 'skip it') + '</span><span>' + (p.bag ? inr(p.bag.price) : '—') + '</span></div>';
    var note = p.left >= 0
      ? p.occasion.note + ' Left over: ' + inr(p.left) + ' for a shawl, a second blouse or the photographer.'
      : 'This budget does not reach the three pieces in ' + p.occasion.label + '. The nearest workable total is ' + inr(p.total) + '.';
    sheetEl.innerHTML = '<h3>Your look</h3><div class="rows">' + rows + '</div>' +
      '<div class="total"><span>Total</span><strong>' + inr(p.total) + '</strong></div>' +
      '<p class="note">' + note + '</p>';
  }

  document.querySelectorAll('.occ').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.occ = btn.getAttribute('data-occ');
      document.querySelectorAll('.occ').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  var moodWrap = document.getElementById('moodGroup');
  if (moodWrap) {
    moodWrap.querySelectorAll('.seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.mood = btn.getAttribute('data-mood');
        moodWrap.querySelectorAll('.seg-btn').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        render();
      });
    });
  }

  if (budgetEl) {
    var syncBudget = function () {
      state.budget = Number(budgetEl.value);
      if (budgetOut) budgetOut.textContent = inr(state.budget);
      render();
    };
    budgetEl.addEventListener('input', syncBudget);
    budgetEl.addEventListener('change', syncBudget);
  }

  if (svgEl && sheetEl) render();

  /* ---------- brief form ---------- */
  var contact = document.getElementById('contactForm');
  if (contact) {
    var status = document.getElementById('formStatus');
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contact.querySelector('#aName');
      var email = contact.querySelector('#aEmail');
      var brand = contact.querySelector('#aBrand');
      var msg = contact.querySelector('#aMessage');
      var bad = [];
      [name, email, brand, msg].forEach(function (f) { if (f) f.removeAttribute('aria-invalid'); });
      if (!name.value.trim()) bad.push(name);
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!brand.value.trim()) bad.push(brand);
      if (msg.value.trim().length < 15) bad.push(msg);
      if (bad.length) {
        bad.forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
        status.textContent = 'Please add your name, email, brand or project, and a line about the brief.';
        status.className = 'form-status is-error';
        bad[0].focus();
        return;
      }
      status.textContent = 'Thank you, ' + name.value.trim() + '. I answer briefs on Tuesdays and Fridays; Diwali content closes in August.';
      status.className = 'form-status is-ok';
      contact.reset();
    });
  }
})();
