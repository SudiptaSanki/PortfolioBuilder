/* King Cake Court — behaviour. Silent site: no audio anywhere. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* -------------------------------------------------------------- nav --- */
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    var close = function () {
      document.body.classList.remove('nav-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    };
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    var nav = document.getElementById('nav');
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { close(); menuBtn.focus(); }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------- order slip --- */
  var SIZES = {
    petit: { label: 'Petit', cm: 20, serves: [8, 10], dough: 0.7, bake: 22, price: 26, sugar: 60, slices: 9 },
    court: { label: 'Court', cm: 28, serves: [12, 16], dough: 1.1, bake: 28, price: 36, sugar: 90, slices: 14 },
    grand: { label: 'Grand', cm: 36, serves: [20, 24], dough: 1.6, bake: 34, price: 48, sugar: 130, slices: 22 },
    balcony: { label: 'Balcony', cm: 45, serves: [30, 36], dough: 2.2, bake: 42, price: 62, sugar: 170, slices: 32 }
  };

  var FILLINGS = {
    cinnamon: { label: 'Cinnamon sugar', add: 0, color: '#B97A2E' },
    cream: { label: 'Cream cheese', add: 6, color: '#FFFDF6' },
    praline: { label: 'Praline pecan', add: 8, color: '#8C5520' },
    strawberry: { label: 'Strawberry and cream', add: 5, color: '#C9556B' },
    chocolate: { label: 'Chocolate and chicory', add: 7, color: '#5A3A2A' }
  };

  var ICINGS = {
    white: { label: 'White glaze', add: 0, color: '#FFFDF6' },
    cream: { label: 'Cream cheese glaze', add: 3, color: '#F6E7CB' },
    carnival: { label: 'Carnival sugar', add: 2, color: '#F0CF7A' }
  };

  var form = document.getElementById('cakeForm');
  if (form) {
    var sizeEl = document.getElementById('ckSize');
    var fillingEl = document.getElementById('ckFilling');
    var icingEl = document.getElementById('ckIcing');
    var dinersEl = document.getElementById('ckDiners');
    var dinersOut = document.getElementById('ckDinersOut');
    var babyEl = document.getElementById('ckBaby');
    var crownEl = document.getElementById('ckCrown');
    var planSvg = document.getElementById('cakeSvg');
    var saved = false;

    var weekdayFromNow = function (days) {
      var d = new Date();
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    };

    var cake = function () {
      var size = SIZES[sizeEl.value];
      var fill = FILLINGS[fillingEl.value];
      var icing = ICINGS[icingEl.value];
      var diners = parseInt(dinersEl.value, 10);
      var hideBaby = babyEl.checked;

      dinersOut.value = String(diners);

      var price = size.price + fill.add + icing.add;
      var bake = size.bake + (fillingEl.value === 'cream' ? 3 : 0) + (fillingEl.value === 'praline' ? 4 : 0);
      var sugar = size.sugar + (icingEl.value === 'carnival' ? 25 : 0) + (fillingEl.value === 'praline' ? 10 : 0);
      var babies = hideBaby ? (sizeEl.value === 'balcony' ? 2 : 1) : 0;

      document.getElementById('planName').textContent = size.label + ' · ' + size.cm + ' cm';
      document.getElementById('planSub').textContent = fill.label + ' · ' + icing.label.toLowerCase();
      document.getElementById('planPrice').textContent = '$' + price;
      document.getElementById('planDough').textContent = size.dough.toFixed(1) + ' kg';
      document.getElementById('planBake').textContent = bake + ' min';
      document.getElementById('planSugar').textContent = sugar + ' g';
      document.getElementById('planSlices').textContent = String(Math.max(diners, 1));
      document.getElementById('planStart').textContent = weekdayFromNow(2) + ' 6 pm';
      document.getElementById('planBabies').textContent = String(babies);

      var warn = '';
      if (diners > size.serves[1]) {
        var bigger = Object.keys(SIZES).filter(function (k) { return SIZES[k].serves[1] >= diners; })[0];
        var next = bigger ? SIZES[bigger] : null;
        warn = 'This ring serves ' + size.serves[0] + '–' + size.serves[1] + '. For ' + diners +
          ' people, ' + (next ? 'step up to the ' + next.label + ' (' + next.cm + ' cm).' : 'order two Balcony rings; one will not do.');
      } else if (diners < Math.ceil(size.serves[0] * 0.6)) {
        warn = 'You are paying for a bigger ring than the table needs. The Petit serves ' + SIZES.petit.serves[0] + '–' + SIZES.petit.serves[1] + '.';
      } else if (fillingEl.value === 'praline' && sizeEl.value === 'petit') {
        warn = 'Praline is only braided from the Court size up. The kitchen will call to change it.';
      }

      document.getElementById('planWarn').textContent = warn;

      var notes = {
        0: 'No baby, no king. Someone at the table will complain, and they will be right.',
        1: 'One baby, wrapped in food-safe paper, pushed in from the bottom after icing. The paper crown comes in the box.',
        2: 'Two babies for the Balcony ring: one for each end of the table. Two crowns, two arguments.'
      };
      var note = 'A ' + size.label + ' ring is the right size for ' + diners + '. ';
      if (diners >= size.serves[0] && diners <= size.serves[1]) {
        note += 'It leaves ' + (size.serves[1] - diners) + ' slices for the person who arrives late, which is the test of a good host. ';
      }
      note += notes[babies];
      document.getElementById('planNote').textContent = note;

      drawCake(size, fill, icing, hideBaby);
    };

    var drawCake = function (size, fill, icing, hideBaby) {
      var cx = 210;
      var cy = 150;
      var r = 62 + size.cm * 1.4;
      var ring = 26 + size.cm * 0.42;
      var parts = [];

      parts.push('<defs><radialGradient id="plate" cx="50%" cy="45%" r="55%">' +
        '<stop offset="0" stop-color="#FBF3E4"/><stop offset="1" stop-color="#E6D2AF"/></radialGradient></defs>');

      parts.push('<ellipse cx="' + cx + '" cy="' + (cy + r * 0.72) + '" rx="' + (r + 44) + '" ry="12" fill="#2A1F2B" opacity=".08"/>');
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 44) + '" fill="url(#plate)" stroke="#2A1F2B" stroke-opacity=".18"/>');
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 36) + '" fill="none" stroke="#2A1F2B" stroke-opacity=".08" stroke-dasharray="2 6"/>');

      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#B97A2E" stroke-width="' + ring + '" opacity=".42"/>');
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#D79A45" stroke-width="' + (ring - 6) + '"/>');
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + ring / 2 - 2) + '" fill="none" stroke="#E8B96B" stroke-width="2" opacity=".7"/>');
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - ring / 2 + 2) + '" fill="none" stroke="#B97A2E" stroke-width="2" opacity=".5"/>');

      var braid = 'stroke="#8C5520" stroke-opacity=".5" stroke-width="2" fill="none" stroke-dasharray="9 7"';
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + ring * 0.24) + '" ' + braid + '/>');
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - ring * 0.2) + '" ' + braid + '/>');

      var icingPath = 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 1 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 1 ' + (-2 * r) + ' 0';
      parts.push('<path d="' + icingPath + '" fill="none" stroke="' + icing.color + '" stroke-width="' + (ring * 0.42) +
        '" stroke-linecap="round" stroke-dasharray="26 16" opacity=".95"/>');
      parts.push('<path d="' + icingPath + '" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-opacity=".5" stroke-linecap="round" stroke-dasharray="18 24"/>');

      var sugarColors = ['#5B2A86', '#1E6B4A', '#D9A21B'];
      var segs = 9;
      for (var i = 0; i < segs; i++) {
        var a0 = (i * 360) / segs - 84;
        var a1 = ((i + 1) * 360) / segs - 90;
        var rad = (r - ring * 0.18);
        var x0 = cx + rad * Math.cos((a0 * Math.PI) / 180);
        var y0 = cy + rad * Math.sin((a0 * Math.PI) / 180);
        var x1 = cx + rad * Math.cos((a1 * Math.PI) / 180);
        var y1 = cy + rad * Math.sin((a1 * Math.PI) / 180);
        parts.push('<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'A' + rad.toFixed(1) + ' ' + rad.toFixed(1) +
          ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" fill="none" stroke="' + sugarColors[i % 3] +
          '" stroke-width="' + (ring * 0.2) + '" stroke-linecap="round" stroke-dasharray="3 5" opacity=".9"/>');
      }

      if (fill.label !== 'Cinnamon sugar' && fill.label !== 'Cream cheese') {
        var dots = 7;
        for (var j = 0; j < dots; j++) {
          var ang = (j / dots) * Math.PI * 2 + 0.4;
          var rr = r + Math.cos(j) * 6;
          var dx = cx + rr * Math.cos(ang);
          var dy = cy + rr * Math.sin(ang);
          if (fillingEl.value === 'praline') {
            parts.push('<ellipse cx="' + dx.toFixed(1) + '" cy="' + dy.toFixed(1) + '" rx="5" ry="3" fill="#8C5520" transform="rotate(' + ((ang * 180) / Math.PI).toFixed(0) + ' ' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')"/>');
          } else {
            parts.push('<circle cx="' + dx.toFixed(1) + '" cy="' + dy.toFixed(1) + '" r="3.4" fill="' + fill.color + '" opacity=".85"/>');
          }
        }
      }

      if (hideBaby) {
        var ba = -Math.PI / 4;
        var bx = cx + (r + ring * 0.05) * Math.cos(ba);
        var by = cy + (r + ring * 0.05) * Math.sin(ba);
        parts.push('<circle cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="6" fill="#D9A21B" stroke="#8C5520" stroke-width="1.2"/>');
        parts.push('<circle cx="' + (bx - 1.4).toFixed(1) + '" cy="' + (by - 1.4).toFixed(1) + '" r="1.6" fill="#FBF3E4" opacity=".8"/>');
      }

      parts.push('<g stroke="#2A1F2B" stroke-opacity=".25" stroke-dasharray="4 5" fill="none">' +
        '<path d="M' + (cx + r * 0.78) + ' ' + (cy + r * 0.78) + 'l' + (-r * 0.62) + ' ' + (r * 0.62) + 'M' +
        (cx + r * 0.9) + ' ' + (cy + r * 0.55) + 'l' + (-r * 0.72) + ' ' + (r * 0.6) + '"/></g>');

      parts.push('<text x="' + (cx - r - 10) + '" y="' + (cy + r + 26) + '" font-family="Public Sans, sans-serif" font-size="7.5" letter-spacing="1.4" fill="#7C6A72">' + size.cm + ' CM</text>');
      parts.push('<text x="' + (cx + r + 10) + '" y="' + (cy + r + 26) + '" text-anchor="end" font-family="Public Sans, sans-serif" font-size="7.5" letter-spacing="1.4" fill="#7C6A72">' + (hideBaby ? 'BABY HIDDEN' : 'NO BABY') + '</text>');

      planSvg.innerHTML = parts.join('');
      planSvg.setAttribute('aria-label', 'Top view of a ' + size.label + ' ' + size.cm + ' centimetre king cake, ' +
        fill.label.toLowerCase() + ', ' + icing.label.toLowerCase() + (hideBaby ? ', baby hidden' : ', no baby'));
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      cake();
      var drawing = document.querySelector('.plan-drawing');
      if (drawing) {
        drawing.classList.remove('pulse');
        void drawing.offsetWidth;
        drawing.classList.add('pulse');
      }
    });
    [sizeEl, fillingEl, icingEl, dinersEl, babyEl, crownEl].forEach(function (el) {
      if (!el) return;
      el.addEventListener('input', cake);
      el.addEventListener('change', cake);
    });

    var reset = document.getElementById('ckReset');
    if (reset) reset.addEventListener('click', function () {
      form.reset();
      sizeEl.value = 'court';
      fillingEl.value = 'cinnamon';
      icingEl.value = 'white';
      dinersEl.value = '14';
      babyEl.checked = true;
      if (crownEl) crownEl.checked = true;
      cake();
    });

    cake();
  }

  /* ----------------------------------------------------------- reveals --- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------- contact form --- */
  var orderForm = document.getElementById('orderForm');
  if (orderForm) {
    var success = document.getElementById('kSuccess');
    var rules = {
      kfName: function (v) { return v.trim().length >= 2; },
      kfEmail: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      kfDate: function (v) { return v !== ''; },
      kfSize: function (v) { return v !== ''; },
      kfMessage: function (v) { return v.trim().length >= 12; }
    };
    var check = function (id) {
      var el = document.getElementById(id);
      if (!el) return null;
      var ok = rules[id](el.value);
      var wrap = el.closest('.f-field');
      if (wrap) wrap.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var h = function () {
        var wrap = el.closest('.f-field');
        if (wrap && wrap.classList.contains('invalid')) check(id);
      };
      el.addEventListener('input', h);
      el.addEventListener('change', h);
    });
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (id) {
        if (check(id) === false && !firstBad) firstBad = document.getElementById(id);
      });
      if (firstBad) {
        firstBad.focus();
        if (success) success.hidden = true;
        return;
      }
      if (success) {
        var nameEl = document.getElementById('kfName');
        var slot = document.getElementById('kSuccessName');
        if (slot) slot.textContent = nameEl && nameEl.value.trim() ? nameEl.value.trim().split(' ')[0] : 'friend';
        success.hidden = false;
        success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      orderForm.reset();
      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var wrap = el.closest('.f-field');
        if (wrap) wrap.classList.remove('invalid');
        el.removeAttribute('aria-invalid');
      });
    });
  }
})();
