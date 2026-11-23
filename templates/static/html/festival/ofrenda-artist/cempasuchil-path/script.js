/* Cempasuchil Path — the altar composer. Silent site: no audio. */
(function () {
  'use strict';

  var years = document.querySelectorAll('[data-year]');
  for (var y = 0; y < years.length; y++) years[y].textContent = new Date().getFullYear();

  var altar = document.getElementById('altar');
  if (altar) {
    var shelfLayer = document.getElementById('shelfLayer');
    var itemLayer = document.getElementById('itemLayer');
    var bannerLayer = document.getElementById('bannerLayer');
    var floorLayer = document.getElementById('floor');
    var note = document.getElementById('altarNote');
    var reading = document.getElementById('reading');
    var lightBtn = document.getElementById('light');
    var clearBtn = document.getElementById('clear');

    var ORDER = ['photo', 'water', 'salt', 'candles', 'cempasuchil', 'bread', 'fruit', 'copal'];
    var NAMES = {
      water: 'water', salt: 'salt', cempasuchil: 'cempasúchil', candles: 'candles',
      bread: 'pan de muerto', papel: 'papel picado', fruit: 'fruit', photo: 'a photograph', copal: 'copal'
    };
    var SHELF_W = { 2: [380, 320], 3: [392, 340, 288], 5: [400, 356, 312, 268, 224] };
    var SHELF_TOP = { 2: [236, 372], 3: [168, 280, 388], 5: [128, 194, 260, 326, 392] };
    var CAPACITY = 3;

    function tiers() {
      var el = document.querySelector('input[name="tiers"]:checked');
      return el ? Number(el.value) : 3;
    }

    function chosen() {
      var out = [];
      var boxes = document.querySelectorAll('#offerings input[type="checkbox"]');
      for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) out.push(boxes[i].value);
      }
      return out;
    }

    /* ---- small drawings, each drawn with its feet at (0,0) ---- */
    function drawWater() {
      return '<g><path d="M-13 0h26l-3 -34h-20z" fill="#8fc7d8" fill-opacity=".22" stroke="#8fc7d8" stroke-opacity=".7"/>' +
        '<path d="M-11 -28h22" stroke="#8fc7d8" stroke-opacity=".45"/>' +
        '<path d="M-9 -4h18" stroke="#8fc7d8" stroke-opacity=".8"/></g>';
    }
    function drawSalt() {
      return '<g><ellipse cx="0" cy="-4" rx="15" ry="5" fill="#2a1a30" stroke="#d3c3ae" stroke-opacity=".5"/>' +
        '<path d="M-11 -6q11 -9 22 0z" fill="#f2e6d0" fill-opacity=".85"/></g>';
    }
    function drawCempasuchil() {
      var petals = '';
      for (var i = 0; i < 8; i++) {
        petals += '<ellipse rx="3.4" ry="8" transform="rotate(' + (i * 45) + ') translate(0 -8)" fill="#f0a12b"/>';
      }
      return '<g><path d="M0 0v-26" stroke="#3f8f74" stroke-width="2"/>' +
        '<path d="M0 -12q-8 -4 -11 -10M0 -16q8 -4 11 -10" fill="none" stroke="#3f8f74" stroke-width="1.6"/>' +
        '<g transform="translate(0 -38)"><g>' + petals + '</g><circle r="4" fill="#c97c16"/></g></g>';
    }
    function drawCandles() {
      return '<g><rect x="-16" y="-30" width="10" height="30" rx="2" fill="#f2e6d0"/>' +
        '<path class="flame" d="M-11 -42c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#ffc45e"/>' +
        '<rect x="4" y="-38" width="10" height="38" rx="2" fill="#f2e6d0"/>' +
        '<path class="flame" d="M9 -50c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#ffc45e"/></g>';
    }
    function drawBread() {
      return '<g><ellipse cx="0" cy="-12" rx="24" ry="13" fill="#d9a25a" stroke="#a97640"/>' +
        '<ellipse cx="0" cy="-14" rx="24" ry="12" fill="#ebb877"/>' +
        '<g stroke="#a97640" stroke-width="1.4" fill="none">' +
        '<path d="M-10 -18l4 10M0 -20l4 10M10 -18l4 10"/></g>' +
        '<circle cx="0" cy="-27" r="4" fill="#ebb877" stroke="#a97640"/></g>';
    }
    function drawFruit() {
      return '<g><path d="M-20 -8h40l-5 8h-30z" fill="#6b4a2a" stroke="#3f2517"/>' +
        '<circle cx="-9" cy="-14" r="9" fill="#e06a2d"/><circle cx="7" cy="-16" r="8" fill="#f2c14e"/>' +
        '<circle cx="0" cy="-24" r="7" fill="#d0407a"/></g>';
    }
    function drawPhoto() {
      return '<g><rect x="-22" y="-46" width="44" height="46" fill="#2a1a30" stroke="#f0a12b" stroke-width="2"/>' +
        '<circle cx="0" cy="-31" r="7" fill="#d3c3ae" fill-opacity=".55"/>' +
        '<path d="M-13 -6q13 -16 26 0z" fill="#d3c3ae" fill-opacity=".4"/></g>';
    }
    function drawCopal() {
      return '<g><path d="M-14 0h28l-4 -14h-20z" fill="#4a2a33" stroke="#8b5f4a"/>' +
        '<path d="M-6 -16q-8 -10 0 -20M6 -16q8 -10 0 -22" fill="none" stroke="#d3c3ae" stroke-opacity=".45" stroke-width="1.6"/>' +
        '<circle cx="0" cy="-14" r="2.4" fill="#f0a12b"/></g>';
    }

    var DRAW = {
      water: drawWater, salt: drawSalt, cempasuchil: drawCempasuchil, candles: drawCandles,
      bread: drawBread, fruit: drawFruit, photo: drawPhoto, copal: drawCopal,
    };

    function drawBanner() {
      var flags = '';
      var colours = ['#d0407a', '#f0a12b', '#3f8f74', '#f2e6d0'];
      for (var i = 0; i < 11; i++) {
        var x = 24 + i * 34;
        var colour = colours[i % colours.length];
        flags += '<g transform="translate(' + x + ' 26)"><path d="M0 0h26l-13 20z" fill="' + colour + '" fill-opacity=".8"/>' +
          '<circle cx="9" cy="8" r="2.4" fill="#140f1c" fill-opacity=".6"/>' +
          '<circle cx="17" cy="8" r="2.4" fill="#140f1c" fill-opacity=".6"/></g>';
      }
      bannerLayer.innerHTML = '<path d="M8 26q202 14 404 0" fill="none" stroke="#f0a12b" stroke-opacity=".4"/>' + flags;
    }

    function drawFloor(shelves) {
      var petals = '';
      for (var i = 0; i < 26; i++) {
        var x = 30 + i * 14;
        var y = 442 - Math.abs(Math.sin(i * 1.7)) * 10;
        petals += '<ellipse cx="' + x + '" cy="' + y + '" rx="5" ry="2.6" fill="#f0a12b" fill-opacity="' + (0.3 + (i % 3) * 0.2) + '" transform="rotate(' + (i * 17 % 40 - 20) + ' ' + x + ' ' + y + ')"/>';
      }
      floorLayer.innerHTML = '<path d="M40 432h340" stroke="#3a1a3f"/>' + petals;
    }

    function render() {
      var count = tiers();
      var widths = SHELF_W[count];
      var tops = SHELF_TOP[count];

      drawBanner();
      drawFloor();

      /* shelves, widest at the bottom */
      var shelfMarkup = '';
      for (var t = 0; t < count; t++) {
        var w = widths[t];
        var top = tops[t];
        shelfMarkup += '<rect x="' + (210 - w / 2) + '" y="' + top + '" width="' + w + '" height="9" rx="2" fill="url(#shelfWood)"/>' +
          '<path d="M' + (210 - w / 2 + 4) + ' ' + (top + 9) + 'v16M' + (210 + w / 2 - 4) + ' ' + (top + 9) + 'v16" stroke="#3a1a3f" stroke-width="3"/>';
      }
      shelfMarkup += '<path d="M30 448h360" stroke="#3a1a3f" stroke-width="3"/>';
      shelfLayer.innerHTML = shelfMarkup;

      var picked = chosen();
      var placeable = ORDER.filter(function (key) { return picked.indexOf(key) !== -1; });
      var slots = count * CAPACITY;

      var markup = '';
      var placed = [];
      placeable.forEach(function (key, index) {
        var shelf = index % count;
        var slot = Math.floor(index / count);
        if (slot >= CAPACITY) return;
        var w = widths[shelf];
        var left = 210 - w / 2;
        var x = left + (w / (CAPACITY + 1)) * (slot + 1);
        var y = tops[shelf] + 2;
        var fn = DRAW[key];
        if (fn) {
          markup += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + fn() + '</g>';
          placed.push(key);
        }
      });
      itemLayer.innerHTML = markup;

      var candles = picked.indexOf('candles') !== -1 ? 2 : 0;
      var overflow = placeable.length - placed.length;
      var names = placeable.map(function (k) { return NAMES[k]; });
      var tiersWord = count === 2 ? 'Two tiers: the earth and what is above it.' : count === 3 ? 'Three tiers: the earth, the road, and what is above.' : 'Five tiers: the full reading, from the underworld to the light.';

      if (reading) {
        reading.textContent = tiersWord + ' ' + (names.length ? names.length + ' offering' + (names.length === 1 ? '' : 's') + ': ' + names.join(', ') + '.' : 'Nothing placed yet.') + (candles ? ' ' + candles + ' candles.' : '');
      }
      if (note) {
        note.textContent = overflow > 0
          ? 'The shelves are full. ' + overflow + ' offering' + (overflow === 1 ? '' : 's') + ' stayed in the basket — remove something to make room.'
          : (placed.length ? 'Placed, and the path of petals runs to the street.' : 'An empty table, waiting for someone to set it.');
      }
      altar.classList.remove('lit');
      if (lightBtn) lightBtn.textContent = 'Light the candles';
    }

    altar.addEventListener('click', function (e) {
      /* clicking a shelf is the same as pressing the light button */
      if (e.target.closest('#itemLayer')) {
        altar.classList.toggle('lit');
        if (lightBtn) lightBtn.textContent = altar.classList.contains('lit') ? 'Blow them out' : 'Light the candles';
      }
    });

    var tierInputs = document.querySelectorAll('input[name="tiers"]');
    for (var i = 0; i < tierInputs.length; i++) tierInputs[i].addEventListener('change', render);

    var boxes = document.querySelectorAll('#offerings input[type="checkbox"]');
    for (var b = 0; b < boxes.length; b++) boxes[b].addEventListener('change', render);

    if (lightBtn) {
      lightBtn.addEventListener('click', function () {
        var lit = altar.classList.toggle('lit');
        lightBtn.textContent = lit ? 'Blow them out' : 'Light the candles';
        if (note) note.textContent = lit ? 'Lit. The flames are the invitation; they stay on until the second of November.' : 'Out. The table waits in the dark.';
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        for (var c = 0; c < boxes.length; c++) boxes[c].checked = false;
        render();
        if (note) note.textContent = 'Cleared. Not even the four elements are left.';
      });
    }

    render();
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('commission-form');
  if (form) {
    var status = document.getElementById('form-status');
    var date = form.querySelector('#date');
    if (date) {
      var today = new Date();
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      date.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    }
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var kind = form.querySelector('#kind');
      var when = form.querySelector('#date');
      var where = form.querySelector('#where');
      var names = form.querySelector('#names');
      var missing = [];
      if (!name.value.trim()) missing.push('a name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) missing.push('an email');
      if (!kind.value) missing.push('the kind of altar');
      if (!when.value) missing.push('a date');
      if (!where.value.trim()) missing.push('where it will stand');
      if (names.value.trim().length < 2) missing.push('who the altar is for');
      status.hidden = false;
      if (missing.length) {
        status.textContent = 'Still needed: ' + missing.join(', ') + '.';
        status.style.color = '#e2885b';
        return;
      }
      status.style.color = '';
      status.textContent = 'Noted: an altar for ' + names.value.trim() + ', on ' + when.value + '. I reply within two days with a visit time and a materials list.';
      form.reset();
    });
  }
})();
