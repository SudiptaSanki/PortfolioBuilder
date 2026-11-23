/* Pookkalam Sadya — leaf rendering, planner, navigation, booking form. */

(function () {
  'use strict';

  /* ---------------- navigation ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------------- dishes ---------------- */
  var LEAF_PATH = 'M50 215 C50 120, 130 70, 300 70 C470 70, 550 120, 550 215 C550 310, 470 360, 300 360 C130 360, 50 310, 50 215 Z';

  var COLORS = {
    pickle: '#9a3a22', chip: '#a8842f', curry: '#2f5734',
    rice: '#e8d9a8', payasam: '#b98f3e', extra: '#6d7a52'
  };
  var INK = { pickle: '#fdf7ea', chip: '#221d10', curry: '#f6f2e2', rice: '#2a2a18', payasam: '#221d10', extra: '#f7f3e4' };

  var DISHES = [
    { n: 1, id: 'salt', name: 'Salt', cat: 'extra', x: 140, y: 112 },
    { n: 2, id: 'mango', name: 'Mango pickle', cat: 'pickle', x: 190, y: 106 },
    { n: 3, id: 'lime', name: 'Lime pickle', cat: 'pickle', x: 240, y: 102 },
    { n: 4, id: 'kadumanga', name: 'Wild lemon pickle', cat: 'pickle', x: 290, y: 100 },
    { n: 5, id: 'upperi', name: 'Banana chips', cat: 'chip', x: 140, y: 158 },
    { n: 6, id: 'sharkara', name: 'Jaggery chips', cat: 'chip', x: 190, y: 152 },
    { n: 7, id: 'pappadam', name: 'Pappadam', cat: 'chip', x: 240, y: 148 },
    { n: 8, id: 'thoran', name: 'Thoran', cat: 'curry', x: 140, y: 206 },
    { n: 9, id: 'olan', name: 'Olan', cat: 'curry', x: 190, y: 204 },
    { n: 10, id: 'avial', name: 'Avial', cat: 'curry', x: 240, y: 202 },
    { n: 11, id: 'kootu', name: 'Kootu', cat: 'curry', x: 290, y: 200 },
    { n: 12, id: 'pachadi', name: 'Pachadi', cat: 'curry', x: 140, y: 252 },
    { n: 13, id: 'kichadi', name: 'Kichadi', cat: 'curry', x: 190, y: 250 },
    { n: 14, id: 'erissery', name: 'Erissery', cat: 'curry', x: 240, y: 248 },
    { n: 15, id: 'kalan', name: 'Kalan', cat: 'curry', x: 140, y: 298 },
    { n: 16, id: 'inji', name: 'Inji curry', cat: 'curry', x: 190, y: 296 },
    { n: 17, id: 'parippu', name: 'Parippu with ghee', cat: 'rice', x: 348, y: 228 },
    { n: 18, id: 'sambar', name: 'Sambar', cat: 'rice', x: 398, y: 226 },
    { n: 19, id: 'rasam', name: 'Rasam', cat: 'rice', x: 448, y: 224 },
    { n: 20, id: 'moru', name: 'Moru', cat: 'rice', x: 348, y: 274 },
    { n: 21, id: 'pulissery', name: 'Pulissery', cat: 'rice', x: 398, y: 272 },
    { n: 22, id: 'rice', name: 'Red matta rice', cat: 'rice', x: 448, y: 270 },
    { n: 23, id: 'ghee', name: 'Ghee', cat: 'extra', x: 398, y: 318 },
    { n: 24, id: 'palada', name: 'Palada pradhaman', cat: 'payasam', x: 486, y: 152 },
    { n: 25, id: 'ada', name: 'Ada pradhaman', cat: 'payasam', x: 486, y: 200 },
    { n: 26, id: 'banana', name: 'Banana', cat: 'extra', x: 470, y: 320 }
  ];

  var OCCASION = {
    onam: { label: 'Onam sadya', base: 520, set: DISHES.map(function (d) { return d.id; }) },
    wedding: { label: 'Wedding sadya', base: 480, set: ['salt', 'mango', 'lime', 'upperi', 'sharkara', 'pappadam', 'thoran', 'olan', 'avial', 'kootu', 'pachadi', 'kichadi', 'erissery', 'kalan', 'inji', 'parippu', 'sambar', 'rasam', 'moru', 'pulissery', 'rice', 'ghee', 'palada', 'banana'] },
    house: { label: 'Housewarming', base: 340, set: ['salt', 'mango', 'upperi', 'pappadam', 'thoran', 'olan', 'avial', 'pachadi', 'erissery', 'parippu', 'sambar', 'rasam', 'moru', 'rice', 'ghee', 'palada'] },
    annadanam: { label: 'Annadanam', base: 260, set: ['salt', 'mango', 'upperi', 'pappadam', 'thoran', 'olan', 'avial', 'kootu', 'pachadi', 'erissery', 'kalan', 'parippu', 'sambar', 'rasam', 'moru', 'rice', 'palada', 'banana'] }
  };

  var KITCHEN = {
    palakkad: { label: 'Palakkad kitchen', note: 'tamarind and pepper' },
    pollachi: { label: 'Pollachi kitchen', note: 'coconut milk' },
    thrissur: { label: 'Thrissur kitchen', note: 'yoghurt' }
  };
  var SERVING = {
    buffet: { label: 'seated service', adj: 0, divisor: 12, base: 2 },
    line: { label: 'leaf line', adj: 15, divisor: 20, base: 4 },
    box: { label: 'packed leaf box', adj: -40, divisor: 60, base: 2 }
  };

  function leafBase(o) {
    var s = '<svg viewBox="0 0 600 430" role="presentation">';
    s += '<defs><clipPath id="leafclip' + o.id + '"><path d="' + LEAF_PATH + '"/></clipPath></defs>';
    s += '<path d="' + LEAF_PATH + '" fill="#d8e2c2"/>';
    s += '<g clip-path="url(#leafclip' + o.id + ')">';
    // lateral veins
    for (var i = 1; i <= 13; i++) {
      var x = 60 + i * 40;
      var drop = 96 * Math.sin((i / 14) * Math.PI) + 24;
      s += '<path d="M' + x + ' 215 Q' + (x + 18) + ' ' + (215 - drop * 0.55) + ' ' + (x + 34) + ' ' + (215 - drop) +
        '" fill="none" stroke="#9fb383" stroke-width=".8" opacity=".55"/>';
      s += '<path d="M' + x + ' 215 Q' + (x + 18) + ' ' + (215 + drop * 0.55) + ' ' + (x + 34) + ' ' + (215 + drop) +
        '" fill="none" stroke="#9fb383" stroke-width=".8" opacity=".55"/>';
    }
    s += '</g>';
    s += '<path d="' + LEAF_PATH + '" fill="none" stroke="#93a97b" stroke-width="1.4"/>';
    s += '<path d="M52 215 C180 206, 420 206, 548 215" fill="none" stroke="#8fa479" stroke-width="2.2" opacity=".8"/>';
    return s;
  }

  /* ---------------- hero leaf ---------------- */
  var HERO_POINTS = [
    { x: 330, y: 300, label: 'Rice', dx: 18, anchor: 'start' },
    { x: 408, y: 268, label: 'Sambar', dx: -18, anchor: 'end' },
    { x: 420, y: 196, label: 'Rasam', dx: 18, anchor: 'start' },
    { x: 190, y: 268, label: 'Avial', dx: -18, anchor: 'end' },
    { x: 120, y: 190, label: 'Thoran', dx: 18, anchor: 'start' },
    { x: 238, y: 332, label: 'Pachadi', dx: 16, anchor: 'start' },
    { x: 130, y: 128, label: 'Pickles', dx: 16, anchor: 'start' },
    { x: 268, y: 110, label: 'Chips', dx: 16, anchor: 'start' },
    { x: 486, y: 168, label: 'Payasam', dx: -20, anchor: 'end' }
  ];

  var heroEl = document.getElementById('heroLeaf');
  if (heroEl) {
    var h = leafBase({ id: 'hero' });
    HERO_POINTS.forEach(function (p) {
      h += '<circle cx="' + p.x + '" cy="' + p.y + '" r="8.5" fill="#1d3a25"/>';
      h += '<circle cx="' + p.x + '" cy="' + p.y + '" r="14" fill="none" stroke="#1d3a25" stroke-width=".9" opacity=".4"/>';
      h += '<text x="' + (p.x + p.dx) + '" y="' + (p.y + 4) + '" text-anchor="' + p.anchor +
        '" font-family="DM Sans, sans-serif" font-size="11.5" fill="#243420" paint-order="stroke" stroke="#d8e2c2" stroke-width="3.4" stroke-linejoin="round">' + p.label + '</text>';
    });
    h += '</svg>';
    heroEl.innerHTML = h;
  }

  /* ---------------- planner ---------------- */
  var plannerEl = document.getElementById('plannerLeaf');
  var dishListEl = document.getElementById('dishList');
  if (plannerEl && dishListEl) {
    var state = new Set(OCCASION.onam.set);
    var dots = {};

    var svg = leafBase({ id: 'plan' });
    DISHES.forEach(function (d) {
      svg += '<g class="leaf-dish" data-dish="' + d.id + '">' +
        '<circle class="leaf-dot" cx="' + d.x + '" cy="' + d.y + '" r="12.5" fill="' + COLORS[d.cat] + '" stroke="#f3eede" stroke-width="1.6"/>' +
        '<text x="' + d.x + '" y="' + (d.y + 3.4) + '" text-anchor="middle" font-family="DM Mono, monospace" font-size="9.4" fill="' + INK[d.cat] + '">' + d.n + '</text>' +
        '</g>';
    });
    svg += '</svg>';
    plannerEl.innerHTML = svg;

    plannerEl.querySelectorAll('.leaf-dish').forEach(function (g) {
      dots[g.getAttribute('data-dish')] = g;
      g.style.cursor = 'pointer';
      g.addEventListener('click', function () { toggle(g.getAttribute('data-dish')); });
    });

    dishListEl.innerHTML = DISHES.map(function (d) {
      return '<li><button type="button" data-dish="' + d.id + '" aria-pressed="true">' +
        '<span class="n">' + d.n + '</span><span class="nm">' + d.name + '</span></button></li>';
    }).join('');

    dishListEl.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { toggle(b.getAttribute('data-dish')); });
    });

    var guests = document.getElementById('guests');
    var guestsRange = document.getElementById('guestsRange');
    var occasion = document.getElementById('occasion');
    var kitchen = document.getElementById('kitchen');
    var serving = document.getElementById('serving');
    var guestHint = document.getElementById('guestHint');

    function clampGuests(v) {
      v = parseInt(v, 10);
      if (isNaN(v)) v = 40;
      return Math.min(2500, Math.max(40, v));
    }

    function toggle(id) {
      if (state.has(id)) state.delete(id); else state.add(id);
      paint();
    }

    function paint() {
      DISHES.forEach(function (d) {
        var g = dots[d.id];
        var on = state.has(d.id);
        var dot = g.querySelector('.leaf-dot');
        dot.setAttribute('fill', on ? COLORS[d.cat] : '#f3eede');
        dot.setAttribute('stroke', on ? '#f3eede' : '#b9c6a4');
        dot.setAttribute('stroke-width', on ? '1.6' : '1.2');
        g.querySelector('text').setAttribute('fill', on ? INK[d.cat] : '#9aa88a');
        g.style.opacity = on ? '1' : '.8';
      });
      dishListEl.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', state.has(b.getAttribute('data-dish')) ? 'true' : 'false');
      });
      updateReadouts();
    }

    function inr(n) {
      return '₹' + n.toLocaleString('en-IN');
    }

    function updateReadouts() {
      var g = clampGuests(guests.value);
      var occ = OCCASION[occasion.value];
      var kit = KITCHEN[kitchen.value];
      var srv = SERVING[serving.value];
      var count = state.size;

      var leaves = Math.ceil(g * 1.06 / 10) * 10;
      var servers = Math.ceil(g / srv.divisor) + srv.base;
      var rice = Math.round(g * (serving.value === 'box' ? 0.2 : 0.16));
      var lead = 1 + Math.ceil(g / 400) + (g > 1200 ? 1 : 0);
      var rate = occ.base + Math.max(0, count - occ.set.length) * 6 + srv.adj;
      var total = Math.round(rate * g / 10) * 10;

      document.getElementById('rDishes').textContent = count;
      document.getElementById('rLeaves').textContent = leaves.toLocaleString('en-IN');
      document.getElementById('rServers').textContent = servers;
      document.getElementById('rRice').textContent = rice + ' kg';
      document.getElementById('rLead').textContent = lead + (lead === 1 ? ' day' : ' days');
      document.getElementById('rQuote').textContent = inr(total);
      document.getElementById('rRate').textContent = inr(rate) + ' per head · ' + occ.label.toLowerCase() +
        ', ' + kit.note + ' · leaves, serving and clearing included';
      document.getElementById('plateSub').textContent = occ.label + ' · ' + kit.label + ' · ' + srv.label;
      guestHint.textContent = g.toLocaleString('en-IN') + ' guests · minimum 40';
      if (guestsRange.value !== String(g) && g <= 1200) guestsRange.value = g;
    }

    guests.addEventListener('input', function () {
      var v = clampGuests(guests.value);
      if (guests.value !== '' && String(v) !== guests.value) guests.value = v;
      updateReadouts();
    });
    guests.addEventListener('blur', function () { guests.value = clampGuests(guests.value); updateReadouts(); });
    guestsRange.addEventListener('input', function () {
      guests.value = guestsRange.value;
      updateReadouts();
    });

    occasion.addEventListener('change', function () {
      state = new Set(OCCASION[occasion.value].set);
      paint();
    });
    kitchen.addEventListener('change', updateReadouts);
    serving.addEventListener('change', updateReadouts);

    document.getElementById('addAll').addEventListener('click', function () {
      state = new Set(DISHES.map(function (d) { return d.id; }));
      paint();
    });
    document.getElementById('resetLeaf').addEventListener('click', function () {
      state = new Set(OCCASION[occasion.value].set);
      paint();
    });

    paint();
  }

  /* ---------------- booking form ---------------- */
  var form = document.getElementById('bookingForm');
  if (form) {
    var status = document.getElementById('formStatus');
    function setErr(id, on) {
      var el = document.getElementById(id);
      if (el) {
        var f = el.closest('.field');
        if (f) f.classList.toggle('has-err', on);
      }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('b-name');
      var phone = document.getElementById('b-phone');
      var email = document.getElementById('b-email');
      var date = document.getElementById('b-date');
      var guests = document.getElementById('b-guests');
      var venue = document.getElementById('b-venue');
      var consent = document.getElementById('b-consent');
      var bad = [];

      var okName = name.value.trim().length >= 2;
      var okPhone = /^[0-9+\s()-]{7,18}$/.test(phone.value.trim());
      var okEmail = email.value.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      var okDate = date.value !== '';
      var okGuests = guests.value !== '' && parseInt(guests.value, 10) >= 40;
      var okVenue = venue.value.trim().length >= 3;
      var okConsent = consent.checked;

      setErr('b-name', !okName); if (!okName) bad.push('name');
      setErr('b-phone', !okPhone); if (!okPhone) bad.push('phone');
      setErr('b-email', !okEmail); if (!okEmail) bad.push('email');
      setErr('b-date', !okDate); if (!okDate) bad.push('date');
      setErr('b-guests', !okGuests); if (!okGuests) bad.push('guests');
      setErr('b-venue', !okVenue); if (!okVenue) bad.push('venue');
      setErr('b-consent', !okConsent); if (!okConsent) bad.push('consent');

      if (bad.length) {
        status.textContent = 'Please check the highlighted fields.';
        status.className = 'form-status bad';
        var first = form.querySelector('.has-err input, .has-err select, .has-err textarea');
        if (first) first.focus();
        return;
      }
      status.textContent = 'Thank you. We will call ' + phone.value.trim() + ' within one working day and hold the date for three.';
      status.className = 'form-status ok';
      form.reset();
      form.querySelectorAll('.has-err').forEach(function (f) { f.classList.remove('has-err'); });
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('has-err');
    });
  }
})();
