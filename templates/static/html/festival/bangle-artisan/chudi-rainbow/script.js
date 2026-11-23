/* Chudi Rainbow — stack studio, navigation, order form. */

(function () {
  'use strict';

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

  /* ---------------- stack studio ---------------- */
  var COLORS = [
    { id: 'rani', name: 'Rani pink', hex: '#e0507a' },
    { id: 'vermilion', name: 'Vermilion', hex: '#e2542c' },
    { id: 'turmeric', name: 'Turmeric', hex: '#e0a52c' },
    { id: 'peacock', name: 'Peacock', hex: '#2fa79c' },
    { id: 'ivory', name: 'Ivory', hex: '#f0e2cf' },
    { id: 'ink', name: 'Ink plum', hex: '#7a4b74' },
    { id: 'pistachio', name: 'Pistachio', hex: '#9db35a' },
    { id: 'gold', name: 'Gold lac', hex: '#d8b25a' }
  ];
  var FINISHES = [
    { id: 'lacquer', name: 'Lacquer', add: 0, cls: '', width: 7 },
    { id: 'matte', name: 'Matte', add: 40, cls: 'f-matte', width: 7 },
    { id: 'mirror', name: 'Mirror inlay', add: 180, cls: 'f-mirror', width: 8 },
    { id: 'foil', name: 'Gold foil', add: 150, cls: 'f-foil', width: 7 }
  ];
  var START = [
    { c: 'rani', f: 'lacquer' },
    { c: 'vermilion', f: 'lacquer' },
    { c: 'turmeric', f: 'matte' },
    { c: 'peacock', f: 'lacquer' },
    { c: 'gold', f: 'foil' }
  ];

  var stackEl = document.getElementById('studioStack');
  var slotsEl = document.getElementById('slots');
  if (stackEl && slotsEl) {
    var slots = START.map(function (s) { return { c: s.c, f: s.f }; });
    var handInput = document.getElementById('hand');

    function byId(list, id) {
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return list[0];
    }

    function fit(hand) {
      var h = parseFloat(hand);
      if (isNaN(h)) h = 20;
      h = Math.min(24, Math.max(17, h));
      var dia = h / Math.PI + 0.2;
      var inches = dia / 2.54;
      var sizes = [2.2, 2.4, 2.6, 2.8, 3.0];
      var best = sizes[0], bestD = 99;
      sizes.forEach(function (s) {
        var d = Math.abs(s - inches);
        if (d < bestD) { bestD = d; best = s; }
      });
      return { size: best, dia: (best * 2.54).toFixed(1), hand: h };
    }

    function renderSlots() {
      slotsEl.innerHTML = slots.map(function (s, i) {
        var colorOpts = COLORS.map(function (c) {
          return '<option value="' + c.id + '"' + (s.c === c.id ? ' selected' : '') + '>' + c.name + '</option>';
        }).join('');
        var finishOpts = FINISHES.map(function (f) {
          return '<option value="' + f.id + '"' + (s.f === f.id ? ' selected' : '') + '>' + f.name + '</option>';
        }).join('');
        return '<li class="slot"><span class="idx">' + (i + 1) + '</span>' +
          '<select data-i="' + i + '" data-kind="c" aria-label="Bangle ' + (i + 1) + ' colour">' + colorOpts + '</select>' +
          '<select data-i="' + i + '" data-kind="f" aria-label="Bangle ' + (i + 1) + ' finish">' + finishOpts + '</select></li>';
      }).join('');

      slotsEl.querySelectorAll('select').forEach(function (sel) {
        sel.addEventListener('change', function () {
          var i = parseInt(sel.getAttribute('data-i'), 10);
          var kind = sel.getAttribute('data-kind');
          if (kind === 'c') slots[i].c = sel.value; else slots[i].f = sel.value;
          paint();
        });
      });
    }

    function paint() {
      var f = fit(handInput.value);
      var price = 0;
      var width = 0;
      var names = [];

      stackEl.innerHTML = slots.map(function (s, i) {
        var c = byId(COLORS, s.c);
        var fin = byId(FINISHES, s.f);
        price += 650 + fin.add;
        width += fin.width;
        names.push(c.name.toLowerCase());
        return '<div class="bangle ' + fin.cls + '" style="border-color:' + c.hex +
          ';transform:translateZ(' + (i * 16) + 'px)"></div>';
      }).join('');

      if (f.size >= 2.8) price += 150;

      document.getElementById('sizeOut').textContent = f.size.toFixed(1);
      document.getElementById('diaOut').textContent = 'inner ' + f.dia + ' cm';
      document.getElementById('stackPrice').textContent = '₹' + price.toLocaleString('en-IN');
      document.getElementById('stackSpec').textContent =
        slots.length + ' bangles · ' + width + ' mm wide · size ' + f.size.toFixed(1) +
        (f.size >= 2.8 ? ' · larger size, ₹150' : '');
      document.getElementById('stageCaption').textContent =
        names.join(', ') + ' · size ' + f.size.toFixed(1);
    }

    handInput.addEventListener('input', function () {
      var v = parseFloat(handInput.value);
      if (!isNaN(v)) {
        if (v < 17) v = 17;
        if (v > 24) v = 24;
      }
      paint();
    });

    document.getElementById('resetStack').addEventListener('click', function () {
      slots = START.map(function (s) { return { c: s.c, f: s.f }; });
      handInput.value = '20';
      renderSlots();
      paint();
    });

    renderSlots();
    paint();
  }

  /* ---------------- order form ---------------- */
  var form = document.getElementById('orderForm');
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
      var name = document.getElementById('c-name');
      var phone = document.getElementById('c-phone');
      var email = document.getElementById('c-email');
      var hand = document.getElementById('c-hand');
      var occasion = document.getElementById('c-occasion');
      var date = document.getElementById('c-date');
      var city = document.getElementById('c-city');
      var consent = document.getElementById('c-consent');
      var bad = [];

      var okName = name.value.trim().length >= 2;
      var okPhone = /^[0-9+\s()-]{7,18}$/.test(phone.value.trim());
      var okEmail = email.value.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      var handVal = parseFloat(hand.value);
      var okHand = !isNaN(handVal) && handVal >= 15 && handVal <= 26;
      var okOccasion = occasion.value !== '';
      var okDate = date.value !== '';
      var okCity = city.value.trim().length >= 2;
      var okConsent = consent.checked;

      setErr('c-name', !okName); if (!okName) bad.push('name');
      setErr('c-phone', !okPhone); if (!okPhone) bad.push('phone');
      setErr('c-email', !okEmail); if (!okEmail) bad.push('email');
      setErr('c-hand', !okHand); if (!okHand) bad.push('hand');
      setErr('c-occasion', !okOccasion); if (!okOccasion) bad.push('occasion');
      setErr('c-date', !okDate); if (!okDate) bad.push('date');
      setErr('c-city', !okCity); if (!okCity) bad.push('city');
      setErr('c-consent', !okConsent); if (!okConsent) bad.push('consent');

      if (bad.length) {
        status.textContent = 'Please check the highlighted fields.';
        status.className = 'form-status bad';
        var first = form.querySelector('.has-err input, .has-err select, .has-err textarea');
        if (first) first.focus();
        return;
      }
      status.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Zohra or Sameer will call within two days to fix the fitting.';
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
