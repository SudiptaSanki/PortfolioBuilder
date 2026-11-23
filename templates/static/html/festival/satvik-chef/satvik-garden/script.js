/* Satvik Garden — seasonal thali builder and page behaviour.
   The menu, shopping list and prep order are generated from the chosen month,
   guest count, region and fasting/dairy settings. No libraries. */
(function () {
  'use strict';

  /* ── nav & reveal ───────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        toggle.focus();
      }
    });
  }

  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── thali builder ──────────────────────────────────────── */
  var monthEl = document.getElementById('month');
  if (!monthEl) { initForm(); return; }

  var guestsEl = document.getElementById('guests');
  var guestsOut = document.getElementById('guestsOut');
  var regionEl = document.getElementById('region');
  var fastEl = document.getElementById('fast');
  var dairyEl = document.getElementById('dairy');
  var plate = document.getElementById('plate');
  var plateTitle = document.getElementById('plateTitle');
  var plateSeason = document.getElementById('plateSeason');
  var dishList = document.getElementById('dishList');
  var shopList = document.getElementById('shopList');
  var prepList = document.getElementById('prepList');
  var noteEl = document.getElementById('builderNote');
  var priceEl = document.getElementById('platePrice');

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  var SEASON = ['winter', 'winter', 'spring', 'spring', 'spring', 'monsoon',
    'monsoon', 'monsoon', 'autumn', 'autumn', 'autumn', 'winter'];
  var SEASON_NAME = { winter: 'Cool season', spring: 'Spring', monsoon: 'Monsoon', autumn: 'Autumn' };

  var ROLES = {
    karnataka: ['Rice', 'Dal', 'Palya', 'Kootu', 'Chutney', 'Payasa'],
    tamil: ['Rice', 'Sambar', 'Poriyal', 'Kootu', 'Rasam', 'Payasam'],
    bengali: ['Rice', 'Dal', 'Shukto', 'Bhaja', 'Chutney', 'Mishti'],
    gujarati: ['Rotli', 'Dal', 'Shaak', 'Shaak', 'Chutney', 'Lapsi']
  };
  var ROLES_FAST = {
    karnataka: ['Sama rice', 'Sweet potato', 'Palya', 'Kootu', 'Chutney', 'Payasa'],
    tamil: ['Sama rice', 'Sweet potato', 'Poriyal', 'Kootu', 'Rasam', 'Payasam'],
    bengali: ['Sama rice', 'Sweet potato', 'Shukto', 'Bhaja', 'Chutney', 'Mishti'],
    gujarati: ['Sama rotli', 'Sweet potato', 'Shaak', 'Shaak', 'Chutney', 'Lapsi']
  };

  var MENUS = {
    karnataka: {
      winter: ['Steamed rice', 'Toor dal with ghee', 'Avarekai palya', 'Cabbage kootu', 'Coconut chutney', 'Rave payasa'],
      spring: ['Steamed rice', 'Moong dal', 'Beans palya', 'Raw mango kootu', 'Coriander chutney', 'Mango payasa'],
      monsoon: ['Steamed rice', 'Horse gram dal', 'Ivy gourd palya', 'Ash gourd kootu', 'Coconut chutney', 'Kadubu'],
      autumn: ['Steamed rice', 'Toor dal', 'Snake gourd palya', 'Pumpkin kootu', 'Coconut chutney', 'Rave undi']
    },
    tamil: {
      winter: ['Steamed rice', 'Drumstick sambar', 'Carrot poriyal', 'Cabbage kootu', 'Pepper rasam', 'Sakkarai pongal'],
      spring: ['Steamed rice', 'Moong sambar', 'Raw banana poriyal', 'Snake gourd kootu', 'Buttermilk rasam', 'Semiya payasam'],
      monsoon: ['Steamed rice', 'Tamarind sambar', 'Beans poriyal', 'Yam kootu', 'Tomato rasam', 'Aval payasam'],
      autumn: ['Steamed rice', 'Toor sambar', 'Banana blossom poriyal', 'Ash gourd kootu', 'Lemon rasam', 'Paruppu payasam']
    },
    bengali: {
      winter: ['Steamed rice', 'Moong dal', 'Shukto', 'Cauliflower bhaja', 'Tomato chutney', 'Nolen gur sandesh'],
      spring: ['Steamed rice', 'Chana dal', 'Lau ghonto', 'Aloo posto', 'Aam chutney', 'Mishti doi'],
      monsoon: ['Khichuri', 'Moong dal', 'Begun bhaja', 'Pumpkin chochchori', 'Tomato chutney', 'Payesh'],
      autumn: ['Steamed rice', 'Chana dal', 'Labra', 'Pumpkin bhaja', 'Tomato chutney', 'Sandesh']
    },
    gujarati: {
      winter: ['Rotli', 'Tuvar dal', 'Undhiyu', 'Cabbage shaak', 'Coriander chutney', 'Lapsi'],
      spring: ['Rotli', 'Moong dal', 'Bhindi shaak', 'Dudhi muthiya', 'Kothmir chutney', 'Shrikhand'],
      monsoon: ['Rotli', 'Kadhi', 'Bhinda shaak', 'Pumpkin shaak', 'Coriander chutney', 'Mohanthal'],
      autumn: ['Rotli', 'Dal', 'Ringan shaak', 'Valor shaak', 'Coriander chutney', 'Lapsi']
    }
  };

  var REGION_NAME = { karnataka: 'Mysuru', tamil: 'Chettinad', bengali: 'Bengal', gujarati: 'Gujarat' };
  var MINS = [35, 32, 22, 26, 10, 30];
  var NOTES = {
    Rice: 'sona masuri, washed three times',
    Rotli: 'soft wheat rotli, rolled thin',
    Dal: 'tempered with mustard, curry leaf and asafoetida',
    Sambar: 'tamarind, toor dal and the season’s vegetable',
    Palya: 'dry-fried with coconut and green chilli',
    Poriyal: 'mustard, curry leaf, fresh coconut',
    Kootu: 'dal and vegetable, finished with pepper',
    Shukto: 'bitter vegetables, milk and a little sugar',
    Bhaja: 'thinly sliced, shallow-fried in mustard oil',
    'Sweet potato': 'roasted, then folded into a coconut kootu',
    Shaak: 'light, with cumin and asafoetida',
    Chutney: 'ground fresh, no onion or garlic',
    Rasam: 'pepper, cumin and tamarind',
    Payasa: 'jaggery, cardamom, milk or coconut milk',
    Payasam: 'jaggery, cardamom, milk or coconut milk',
    Mishti: 'milk or coconut sweet, made the same morning',
    Lapsi: 'broken wheat, ghee and jaggery'
  };
  var DAIRY_SWAPS = {
    'Toor dal with ghee': 'Toor dal, coconut oil',
    'Rave payasa': 'Rave payasa with coconut milk',
    'Mango payasa': 'Mango payasa with coconut milk',
    'Sakkarai pongal': 'Sakkarai pongal with coconut oil',
    'Semiya payasam': 'Semiya payasam with coconut milk',
    'Aval payasam': 'Aval payasam with coconut milk',
    'Paruppu payasam': 'Paruppu payasam with coconut milk',
    'Nolen gur sandesh': 'Nolen gur coconut sandesh',
    'Mishti doi': 'Coconut jaggery pudding',
    'Payesh': 'Payesh with coconut milk',
    'Sandesh': 'Coconut sandesh',
    'Shrikhand': 'Coconut jaggery cream',
    'Kadhi': 'Coconut kadhi',
    'Dudhi muthiya': 'Dudhi muthiya, steamed'
  };

  function seasonFor(month) { return SEASON[month]; }

  function buildMenu(region, season, fast, noDairy) {
    var names = MENUS[region][season].slice();
    if (fast) {
      names[0] = region === 'gujarati' ? 'Sama rotli' : 'Sama rice pulao';
      names[1] = 'Sweet potato kootu';
      if (names[5].indexOf('Payasa') !== -1) names[5] = 'Sama payasa';
    }
    if (noDairy) {
      names = names.map(function (n) { return DAIRY_SWAPS[n] || n; });
    }
    return names;
  }

  function money(n) { return '₹' + n.toLocaleString('en-IN'); }

  function render() {
    var month = parseInt(monthEl.value, 10);
    var season = seasonFor(month);
    var guests = parseInt(guestsEl.value, 10);
    var region = regionEl.value;
    var fast = fastEl.checked;
    var noDairy = !dairyEl.checked;

    guestsOut.textContent = String(guests);
    var names = buildMenu(region, season, fast, noDairy);
    var roles = fast ? ROLES_FAST[region] : ROLES[region];

    plateTitle.textContent = REGION_NAME[region] + ' thali';
    plateSeason.textContent = MONTHS[month] + ' · ' + SEASON_NAME[season].toLowerCase() + ' · ' + guests + ' guests';

    /* dish list */
    var html = '';
    names.forEach(function (n, i) {
      var role = roles[i] || '';
      var note = NOTES[role] || NOTES[Object.keys(NOTES).find(function (k) { return role.indexOf(k) !== -1; })] || '';
      html += '<li><span class="dish">' + n + '<small>' + role + ' · ' + note + '</small></span>' +
        '<span class="mins">' + MINS[i] + ' min</span></li>';
    });
    dishList.innerHTML = html;

    /* shopping */
    var rice = Math.round(guests * (fast ? 80 : 90) / 10) * 10;
    var dal = fast ? 0 : Math.round(guests * 45 / 10) * 10;
    var veg = Math.round(guests * 220 / 50) * 50;
    var coconut = Math.round(guests * 20 / 10) * 10;
    var ghee = noDairy ? 0 : Math.round(guests * 12 / 5) * 5;
    var oil = noDairy ? Math.round(guests * 10 / 5) * 5 : Math.round(guests * 4 / 5) * 5;
    var jaggery = Math.round(guests * 18 / 10) * 10;
    var salt = Math.round(guests * 4);
    var tamarind = Math.round(guests * 3);

    function kg(g) { return g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g + ' g'; }
    var shop = [
      ['Rice / sama', kg(rice)],
      ['Dal', dal ? kg(dal) : '—'],
      ['Vegetables', kg(veg)],
      ['Coconut', kg(coconut)],
      [noDairy ? 'Coconut oil' : 'Ghee', noDairy ? oil + ' ml' : kg(ghee)],
      ['Oil', oil + ' ml'],
      ['Jaggery', kg(jaggery)],
      ['Tamarind', kg(tamarind)],
      ['Salt', kg(salt)]
    ];
    shopList.innerHTML = shop.map(function (s) {
      return '<li><span>' + s[0] + '</span><b>' + s[1] + '</b></li>';
    }).join('');

    /* prep order */
    var prepSteps = [
      '<b>Wash and soak.</b> Rinse the rice three times; soak the dal for ' + (region === 'karnataka' ? '20' : '15') + ' minutes.',
      '<b>Set the grain.</b> Rice on the back burner, ' + (fast ? 'sama cooks in 15 minutes' : 'rice in 25') + '; start the dal at the same time.',
      '<b>Cut the vegetables.</b> Palya and kootu cut to the same size so they cook at the same speed.',
      '<b>Temper last.</b> Mustard, curry leaf and asafoetida in ' + (noDairy ? 'coconut oil' : 'ghee') + ', then the vegetables.',
      '<b>Finish.</b> Grind the chutney fresh; warm the sweet just before serving.'
    ];
    if (fast) prepSteps.splice(2, 0, '<b>Keep the grain out.</b> Ekadashi plate: no rice, wheat or pulses; the millet and sweet potato carry it.');
    prepList.innerHTML = prepSteps.map(function (s) { return '<li>' + s + '</li>'; }).join('');

    /* price */
    var perPlate = fast ? 1050 : (region === 'bengali' ? 1100 : (region === 'gujarati' ? 950 : 850));
    priceEl.textContent = money(perPlate) + ' per plate · ' + money(perPlate * guests) + ' total';

    /* total time */
    var base = 25 + 32 + 26 + 22 + 10 + 30;
    var extra = Math.max(0, Math.round((guests - 12) * 0.9));
    var total = base + extra;
    var h = Math.floor(total / 60), m = total % 60;
    noteEl.innerHTML = '<b>' + (fast ? 'Ekadashi.' : 'Season.') + '</b> ' +
      (fast
        ? 'No grains or pulses. Sama rice and sweet potato replace the rice and dal; the rest of the plate stays seasonal.'
        : 'Cooking for ' + guests + ' takes about ' + (h ? h + ' h ' : '') + m + ' min of active time, most of it in the last hour.') +
      (noDairy ? ' Dairy is out: coconut milk and coconut oil replace ghee and milk.' : '') +
      ' Everything is cooked without onion or garlic.';

    drawPlate(names, roles);
  }

  function drawPlate(names, roles) {
    if (!plate) return;
    var labels = names.map(function (n, i) {
      var short = n.length > 20 ? n.slice(0, 19) + '…' : n;
      var words = short.split(' ');
      var lines = [];
      var line = '';
      words.forEach(function (w) {
        if ((line + ' ' + w).trim().length > 14) { if (line) lines.push(line.trim()); line = w; }
        else line += ' ' + w;
      });
      if (line.trim()) lines.push(line.trim());
      return lines.slice(0, 2);
    });

    var positions = [
      { x: 200, y: 200, r: 66 },  // grain centre
      { x: 105, y: 118, r: 44 },
      { x: 296, y: 116, r: 44 },
      { x: 318, y: 220, r: 42 },
      { x: 248, y: 310, r: 40 },
      { x: 96, y: 268, r: 40 }
    ];
    var colors = ['#f4e7c3', '#e8c879', '#b8c98d', '#94b77d', '#c97a58', '#c9a45a'];

    var s = '<svg viewBox="0 0 400 400" role="img" aria-label="A brass thali with six preparations: ' + names.join(', ') + '.">';
    s += '<defs><radialGradient id="plateG" cx="42%" cy="36%"><stop offset="0" stop-color="#f4ecd6"/><stop offset=".7" stop-color="#e5d8b8"/><stop offset="1" stop-color="#cdb98c"/></radialGradient>' +
      '<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8b66a"/><stop offset=".5" stop-color="#b98f3f"/><stop offset="1" stop-color="#e0c27c"/></linearGradient></defs>';
    s += '<circle cx="200" cy="200" r="192" fill="url(#rim)"/>';
    s += '<circle cx="200" cy="200" r="180" fill="url(#plateG)" stroke="#b99a63" stroke-width="1"/>';
    s += '<circle cx="200" cy="200" r="160" fill="none" stroke="rgba(120,95,45,.25)" stroke-width="1" stroke-dasharray="3 5"/>';

    positions.forEach(function (p, i) {
      s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + p.r + '" fill="#fdfaf0" stroke="#b9a374" stroke-width="1.2"/>';
      s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (p.r - 5) + '" fill="' + colors[i] + '" opacity=".55"/>';
      s += '<ellipse cx="' + (p.x - p.r * 0.22) + '" cy="' + (p.y - p.r * 0.28) + '" rx="' + (p.r * 0.34) + '" ry="' + (p.r * 0.18) + '" fill="#fffdf6" opacity=".45"/>';
      var startY = p.y - (labels[i].length - 1) * 7;
      labels[i].forEach(function (line, j) {
        s += '<text x="' + p.x + '" y="' + (startY + j * 14 + 3) + '" text-anchor="middle" font-family="Figtree,sans-serif" font-size="' + (i === 0 ? 11 : 9.5) + '" fill="#3a3f33">' + line + '</text>';
      });
    });

    s += '<g opacity=".55" stroke="#8f7a4a" stroke-width="1" fill="none">' +
      '<path d="M200 14v10M200 376v10M14 200h10M376 200h10"/></g>';
    s += '</svg>';
    plate.innerHTML = s;
  }

  [monthEl, guestsEl, regionEl, fastEl, dairyEl].forEach(function (el) {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  var resetEl = document.getElementById('resetThali');
  if (resetEl) {
    resetEl.addEventListener('click', function () {
      monthEl.value = '10';
      guestsEl.value = 12;
      regionEl.value = 'karnataka';
      fastEl.checked = false;
      dairyEl.checked = true;
      render();
    });
  }

  render();

  /* ── booking form ───────────────────────────────────────── */
  function initForm() {
    var form = document.getElementById('bookingForm');
    if (!form) return;
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function mark(field, ok) {
      var wrap = field.closest('.f');
      if (!wrap) return;
      wrap.classList.toggle('invalid', !ok);
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');
      var okName = name.value.trim().length > 1;
      var okEmail = emailRe.test(email.value.trim());
      var okMessage = message.value.trim().length > 5;
      mark(name, okName); mark(email, okEmail); mark(message, okMessage);
      if (!okName || !okEmail || !okMessage) {
        (!okName ? name : (!okEmail ? email : message)).focus();
        return;
      }
      var ok = document.getElementById('formOk');
      var who = name.value.trim().split(' ')[0].replace(/[<>&]/g, '');
      ok.innerHTML = '<strong>Namaskara, ' + who + '.</strong> Anasuya reads these on Monday mornings, after the market. She will reply within three days with a menu, a price per plate and the shopping list.';
      ok.classList.add('show');
      form.reset();
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    form.addEventListener('input', function (e) {
      var wrap = e.target.closest('.f');
      if (wrap && wrap.classList.contains('invalid')) {
        wrap.classList.remove('invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }

})();
