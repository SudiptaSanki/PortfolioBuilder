/* Thali Art — nav, and the thali composer: nine slots, four metals, five occasions. */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- composer ---------------- */
  var plate = document.getElementById('plate');
  var itemsLayer = document.getElementById('plateItems');
  var centerLayer = document.getElementById('plateCenter');
  var form = document.getElementById('composerForm');
  if (!plate || !form) return;

  var R = 112, CX = 210, CY = 200;
  var ORDER = ['diya', 'kumkum', 'haldi', 'akshat', 'bell', 'conch', 'camphor', 'flowers', 'prasad'];

  var SHAPES = {
    diya: '<path d="M-22 4c0 10 10 16 22 16s22-6 22-16c0-3-44-3-44 0Z" fill="#b46a2a" stroke="#6f3c13" stroke-width="1.3"/>' +
          '<path d="M0-20c5 7 8 12 8 17 0 6-4 10-8 10s-8-4-8-10c0-5 3-10 8-17Z" fill="#d3982c"/>' +
          '<path d="M0-16c3 5 5 8 5 12 0 4-2 6-5 6s-5-2-5-6c0-4 2-7 5-12Z" fill="#f6e6bb"/>',
    kumkum: '<circle r="21" fill="#c9a25a" stroke="#7e5c1d" stroke-width="1.3"/><circle r="14" fill="#8c2b22"/><circle r="14" fill="none" stroke="#5e1811" stroke-width=".9"/>',
    haldi: '<circle r="21" fill="#c9a25a" stroke="#7e5c1d" stroke-width="1.3"/><circle r="14" fill="#d8a12a"/><circle r="14" fill="none" stroke="#8f6a12" stroke-width=".9"/>',
    akshat: '<path d="M-20 2c0-9 9-15 20-15s20 6 20 15-9 13-20 13-20-4-20-13Z" fill="#e3d6bd" stroke="#a99672" stroke-width="1.2"/>' +
            '<g fill="#b9a67f"><circle cx="-8" cy="2" r="1.6"/><circle cx="4" cy="-3" r="1.6"/><circle cx="10" cy="5" r="1.6"/><circle cx="-2" cy="9" r="1.6"/></g>',
    bell: '<path d="M0-22v6" stroke="#7e5c1d" stroke-width="1.4"/><path d="M-11-14h22l4 16c0 7-30 7-30 0Z" fill="#c9a25a" stroke="#7e5c1d" stroke-width="1.2"/>' +
          '<circle cx="0" cy="6" r="3" fill="#b98f3f"/>',
    conch: '<path d="M-14 10c0-13 5-21 14-27 9 6 14 14 14 27-5 5-23 5-28 0Z" fill="#e9dcc4" stroke="#a99672" stroke-width="1.2"/>' +
           '<path d="M-6 11c3-8 8-11 11-14" stroke="#a99672" stroke-width="1" fill="none"/>',
    camphor: '<circle r="13" cy="8" fill="#c9a25a" stroke="#7e5c1d" stroke-width="1.2"/><path d="M0-20c3 5 5 8 5 12" stroke="#7e5c1d" stroke-width="1.2" fill="none"/>' +
             '<path d="M0-25c2 3 3 5 3 7" stroke="#d3982c" stroke-width="1.6" fill="none"/>',
    flowers: '<g fill="#c04a2e"><ellipse cx="0" cy="-13" rx="6" ry="11"/><ellipse cx="0" cy="13" rx="6" ry="11"/><ellipse cx="-13" cy="0" rx="11" ry="6"/><ellipse cx="13" cy="0" rx="11" ry="6"/></g>' +
             '<circle r="5" fill="#d8a12a"/>',
    prasad: '<path d="M-19 2c0-7 8-12 19-12s19 5 19 12-8 10-19 10-19-3-19-10Z" fill="#e3d6bd" stroke="#a99672" stroke-width="1.2"/>' +
            '<g fill="#b9a67f"><circle cx="-7" cy="2" r="1.5"/><circle cx="6" cy="-1" r="1.5"/><circle cx="0" cy="6" r="1.5"/></g>'
  };

  var ITEM_LABELS = {
    diya: 'diya', kumkum: 'kumkum', haldi: 'haldi', akshat: 'akshat', bell: 'bell',
    conch: 'conch', camphor: 'camphor', flowers: 'flowers', prasad: 'prasad'
  };

  function slotTransform(i) {
    var a = (-90 + i * 40) * Math.PI / 180;
    return 'translate(' + (CX + R * Math.cos(a)).toFixed(1) + ',' + (CY + R * Math.sin(a)).toFixed(1) + ')';
  }

  /* build the nine slots */
  if (itemsLayer) {
    itemsLayer.innerHTML = ORDER.map(function (key, i) {
      return '<g class="slot" data-item="' + key + '" transform="' + slotTransform(i) + ' scale(.9)">' + SHAPES[key] + '</g>';
    }).join('');
  }
  /* the kalash stays, whatever else is chosen */
  if (centerLayer) {
    centerLayer.innerHTML =
      '<g transform="translate(210 214) scale(.8)">' +
      '<path d="M0-52c24 0 40 17 40 41S24 26 0 26s-40-13-40-37 16-41 40-41Z" fill="#c9a25a" stroke="#7e5c1d" stroke-width="1.5"/>' +
      '<path d="M-16-54h32l7 11h-46z" fill="#b98f3f" stroke="#7e5c1d" stroke-width="1.1"/>' +
      '<path d="M0-72c9 0 16 6 16 12 0 5-3 7-7 6 2-4 1-9-2-10-5-1-9 2-10 7-3-2-4-7-2-10 1-3 3-5 5-5Z" fill="#4a5c3a"/>' +
      '<circle cx="0" cy="-76" r="7" fill="#8c2b22"/>' +
      '<path d="M-28-2c8 6 48 6 56 0" stroke="#8a6624" stroke-width="1" fill="none" opacity=".8"/>' +
      '</g>';
  }

  var OCCASIONS = {
    griha: {
      title: 'Griha pravesh thali',
      size: 24,
      items: ['diya', 'kumkum', 'haldi', 'akshat', 'flowers'],
      note: 'A griha pravesh plate carries an odd number of items. Five is the smallest count that includes a lamp, both powders and rice.'
    },
    navratri: {
      title: 'Navratri thali',
      size: 26,
      items: ['diya', 'kumkum', 'haldi', 'akshat', 'bell', 'flowers', 'prasad'],
      note: 'Nine nights, nine items if the family has the space. Seven is the count most houses use, with the bell replacing the conch for the evening aarti.'
    },
    wedding: {
      title: 'Wedding thali',
      size: 28,
      items: ['diya', 'kumkum', 'haldi', 'akshat', 'bell', 'conch', 'camphor', 'flowers', 'prasad'],
      note: 'The full nine. A wedding plate is the only one that needs both the conch and the bell, and the only one where the camphor stand is used twice in a night.'
    },
    katha: {
      title: 'Satyanarayan katha thali',
      size: 26,
      items: ['diya', 'kumkum', 'akshat', 'bell', 'camphor', 'flowers', 'prasad'],
      note: 'The katha plate leaves out haldi, since the turmeric is mixed into the prasad rather than offered separately. Seven items, always.'
    },
    diwali: {
      title: 'Diwali Lakshmi puja thali',
      size: 22,
      items: ['diya', 'kumkum', 'haldi', 'akshat', 'flowers', 'prasad'],
      note: 'A smaller plate for a puja done at home, often with a second diya set beside it rather than on it. Six is even, so most families add a small camphor cup.'
    }
  };

  var METALS = {
    brass: { label: 'Brass', base: 1450, weight0: 540, perItem: 62, lead: 8 },
    copper: { label: 'Copper', base: 1750, weight0: 580, perItem: 74, lead: 10 },
    silver: { label: 'Silver plate', base: 3900, weight0: 560, perItem: 96, lead: 14 },
    ashta: { label: 'Ashtadhatu', base: 6800, weight0: 640, perItem: 128, lead: 21 }
  };

  var el = {
    occasion: document.getElementById('roOccasion'),
    count: document.getElementById('roCount'),
    metal: document.getElementById('roMetal'),
    size: document.getElementById('roSize'),
    weight: document.getElementById('roWeight'),
    consumables: document.getElementById('roConsumables'),
    price: document.getElementById('roPrice'),
    lead: document.getElementById('roLead'),
    note: document.getElementById('roNote'),
    caption: document.getElementById('plateCaption')
  };

  function checkedValues(name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; });
  }

  function currentMetal() {
    var v = checkedValues('metal')[0];
    return METALS[v] ? v : 'brass';
  }

  function currentOccasion() {
    var v = checkedValues('occasion')[0];
    return OCCASIONS[v] ? v : 'griha';
  }

  function setItems(list) {
    form.querySelectorAll('input[name="item"]').forEach(function (input) {
      input.checked = list.indexOf(input.value) !== -1;
    });
  }

  function render() {
    var metalKey = currentMetal();
    var metal = METALS[metalKey];
    var occKey = currentOccasion();
    var occ = OCCASIONS[occKey];
    var chosen = checkedValues('item');

    plate.setAttribute('data-metal', metalKey);
    if (itemsLayer) {
      itemsLayer.querySelectorAll('.slot').forEach(function (g) {
        g.classList.toggle('is-off', chosen.indexOf(g.getAttribute('data-item')) === -1);
      });
    }

    var extra = Math.max(0, chosen.length - 5);
    var low = metal.base + extra * metal.perItem;
    var high = low + 220;
    var weight = metal.weight0 + chosen.length * metal.perItem;
    var words = { 0: 'no items', 1: 'one item', 2: 'two items', 3: 'three items', 4: 'four items', 5: 'five items', 6: 'six items', 7: 'seven items', 8: 'eight items', 9: 'nine items' };

    if (el.occasion) el.occasion.textContent = occ.title;
    if (el.count) el.count.textContent = chosen.length + ' of 9 items';
    if (el.metal) el.metal.textContent = metal.label;
    if (el.size) el.size.textContent = (metalKey === 'silver' || metalKey === 'ashta' ? Math.max(occ.size, 26) : occ.size) + ' cm';
    if (el.weight) el.weight.textContent = weight + ' g';
    if (el.price) el.price.textContent = '₹' + low.toLocaleString('en-IN') + ' – ₹' + high.toLocaleString('en-IN');
    if (el.lead) el.lead.textContent = metal.lead + ' days';
    if (el.consumables) {
      el.consumables.textContent = chosen.indexOf('kumkum') !== -1 || chosen.indexOf('haldi') !== -1
        ? 'Included, packed separately'
        : 'Not included on this plate';
    }
    if (el.note) {
      var evenNote = chosen.length % 2 === 0 && chosen.length > 0
        ? ' Even counts are avoided at the time of placing; add one more if this plate is for a ritual rather than a gift.'
        : '';
      el.note.textContent = occ.note + evenNote;
    }
    if (el.caption) {
      el.caption.textContent = metal.label + ' · ' + (words[chosen.length] || chosen.length + ' items') + ' plus the kalash';
    }
  }

  form.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'occasion') setItems(OCCASIONS[e.target.value].items);
    render();
  });

  /* first paint: honour the griha pravesh preset */
  setItems(OCCASIONS[currentOccasion()].items);
  render();
})();

/* ============================================================
   Commission enquiry
   ============================================================ */
(function () {
  'use strict';
  var form = document.getElementById('commissionForm');
  if (!form) return;
  var status = document.getElementById('formStatus');

  function setError(name, msg) {
    var field = form.elements[name];
    var slot = form.querySelector('.err[data-for="' + name + '"]');
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (slot) slot.textContent = msg || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = 0;
    var name = form.elements.name.value.trim();
    if (name.length < 2) { setError('name', 'A name for the order book.'); errors++; } else setError('name', '');
    var email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', 'Please check the email address.'); errors++; } else setError('email', '');
    var date = form.elements.date.value;
    if (!date) { setError('date', 'The date the plate is needed.'); errors++; }
    else if (new Date(date + 'T00:00:00') < new Date(new Date().toDateString())) { setError('date', 'That date has passed.'); errors++; }
    else setError('date', '');

    if (errors) {
      if (status) { status.className = 'form-status'; status.textContent = 'A few fields still need an answer.'; }
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var occasion = form.elements.occasion.value;
    var metal = form.elements.metal.value;
    if (status) {
      status.className = 'form-status ok';
      status.textContent = 'Logged. ' + name + ', your ' + occasion.toLowerCase() + ' plate in ' + metal.toLowerCase() +
        ' is in the order book for ' + new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) +
        '. A drawing follows by email within three days.';
    }
    form.reset();
  });
})();

/* ============================================================
   Commission gallery filter
   ============================================================ */
(function () {
  'use strict';
  var chips = document.querySelectorAll('.filters .chip');
  var cards = document.querySelectorAll('.gallery .g-card');
  var countEl = document.getElementById('galleryCount');
  if (!chips.length || !cards.length) return;

  function apply(filter) {
    var shown = 0;
    cards.forEach(function (card) {
      var match = filter === 'all' || card.getAttribute('data-type') === filter;
      card.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === filter;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (countEl) countEl.textContent = shown + (shown === 1 ? ' plate' : ' plates');
  }

  chips.forEach(function (c) {
    c.setAttribute('aria-pressed', c.classList.contains('is-on') ? 'true' : 'false');
    c.addEventListener('click', function () { apply(c.getAttribute('data-filter')); });
  });
})();
