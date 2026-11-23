/* Hanbok Blossom — colourway studio, petals, page behaviour. Silent. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal ---------- */
  var targets = document.querySelectorAll('.chapter, .stage, .studio-controls, .process-steps li, .look, .look-full, .parts li, .fit-card, .fit-side, .story p, .timeline li');
  if ('IntersectionObserver' in window && !reduce) {
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- falling petals ---------- */
  var canvas = document.getElementById('petals');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var petals = [];
    var tints = ['rgba(196, 101, 110, 0.5)', 'rgba(243, 220, 216, 0.9)', 'rgba(198, 161, 91, 0.35)'];

    function size() {
      var r = canvas.getBoundingClientRect();
      w = r.width || 900;
      h = r.height || 600;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seedPetals() {
      petals = [];
      var count = Math.max(14, Math.round(w / 46));
      for (var i = 0; i < count; i++) {
        petals.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 3 + Math.random() * 4.5,
          vy: 0.16 + Math.random() * 0.3,
          vx: 0.1 + Math.random() * 0.25,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.012,
          tint: tints[Math.floor(Math.random() * tints.length)],
          sway: Math.random() * Math.PI * 2
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        if (!reduce) {
          p.y += p.vy;
          p.x += p.vx + Math.sin((t || 0) * 0.0004 + p.sway) * 0.18;
          p.rot += p.vr;
          if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
          if (p.x > w + 10) p.x = -10;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.tint;
        ctx.fill();
        ctx.restore();
      }
      if (!reduce) requestAnimationFrame(draw);
    }

    size();
    seedPetals();
    if (reduce) draw(0);
    else requestAnimationFrame(draw);

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); seedPetals(); if (reduce) draw(0); }, 180);
    });
  }

  /* ---------- colourway studio ---------- */
  var garment = document.getElementById('studioGarment');
  if (garment) {
    var state = {
      jg: { hex: '#3E6B5E', name: 'Jade' },
      chi: { hex: '#E7B7B4', name: 'Blush' },
      pattern: 'plain'
    };

    var nameEl = document.getElementById('comboName');
    var tagEl = document.getElementById('comboTag');
    var occasionEl = document.getElementById('occasion');
    var lightEl = document.getElementById('lightRead');
    var liningEl = document.getElementById('lining');
    var noteEl = document.getElementById('studioNote');
    var savedEl = document.getElementById('savedSwatches');
    var patternEl = document.getElementById('sPattern');

    function lum(hex) {
      var c = hex.replace('#', '');
      var r = parseInt(c.slice(0, 2), 16) / 255;
      var g = parseInt(c.slice(2, 4), 16) / 255;
      var b = parseInt(c.slice(4, 6), 16) / 255;
      function f(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }

    function reading() {
      var jg = state.jg, chi = state.chi;
      var diff = Math.abs(lum(jg.hex) - lum(chi.hex));
      var light, tag, occasion, lining, note;

      if (diff > 0.45) {
        light = 'Strong contrast — daylight, outdoor photographs';
        tag = 'Outdoor';
      } else if (diff > 0.16) {
        light = 'Medium contrast — daylight and lamp light both work';
        tag = 'Daylight';
      } else {
        light = 'Low contrast — indoor light only';
        tag = 'Indoor';
      }

      if (chi.name === 'Red' && (jg.name === 'Jade' || jg.name === 'Ivory')) {
        occasion = 'Wedding morning, hwarot over the chima';
      } else if (chi.name === 'Blush' || chi.name === 'Mist') {
        occasion = 'Doljanchi, spring photographs';
      } else if (chi.name === 'Midnight' || chi.name === 'Plum') {
        occasion = 'Evening ceremony, indoor hall';
      } else if (chi.name === 'Sand') {
        occasion = 'Palace afternoon, long walks';
      } else {
        occasion = 'Palace day, or a family portrait';
      }

      lining = lum(chi.hex) > 0.55 ? 'White cotton' : 'Bone silk';
      note = jg.name + ' ' + (jg.name === 'Ivory' ? 'silk' : 'jeogori') + ' over a ' + chi.name.toLowerCase() + ' chima. ' + light + '.';

      if (chi.name === 'Blush' && jg.name === 'Jade') {
        note = 'Jade and blush is the combination on the atelier\u2019s own form. It photographs well in daylight and stays quiet next to a child in brighter silk.';
      }
      if (chi.name === 'Red' && jg.name === 'Jade') {
        note = 'Red chima with jade is the classic wedding pairing in this atelier. It needs a hall with warm light, not a courtyard at noon.';
      }
      if (jg.name === 'Ivory' && (chi.name === 'Midnight' || chi.name === 'Red')) {
        note = 'An ivory top over a dark chima is the safest formal choice and the easiest to fit twice without the colour shifting under different lights.';
      }

      nameEl.textContent = jg.name + ' jeogori · ' + chi.name.toLowerCase() + ' chima';
      tagEl.textContent = tag;
      occasionEl.textContent = occasion;
      lightEl.textContent = light;
      liningEl.textContent = lining;
      noteEl.textContent = note;
      garment.setAttribute('aria-label', 'A hanbok in a ' + jg.name.toLowerCase() + ' jeogori and a ' + chi.name.toLowerCase() + ' chima, ' + state.pattern + ' pattern');
    }

    function apply() {
      garment.style.setProperty('--jg', state.jg.hex);
      garment.style.setProperty('--chi', state.chi.hex);
      patternEl.setAttribute('fill', state.pattern === 'plain' ? 'none' : 'url(#pat-' + state.pattern + ')');
      reading();
    }

    document.querySelectorAll('.sw-row').forEach(function (row) {
      var which = row.dataset.target === 'jeogori' ? 'jg' : 'chi';
      row.querySelectorAll('.sw').forEach(function (btn) {
        btn.addEventListener('click', function () {
          row.querySelectorAll('.sw').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
          btn.setAttribute('aria-pressed', 'true');
          state[which] = { hex: btn.dataset.hex, name: btn.dataset.name };
          apply();
        });
      });
    });

    document.querySelectorAll('input[name="pattern"]').forEach(function (input) {
      input.addEventListener('change', function () {
        state.pattern = input.value;
        apply();
      });
    });

    document.getElementById('resetSwatch').addEventListener('click', function () {
      state.jg = { hex: '#3E6B5E', name: 'Jade' };
      state.chi = { hex: '#E7B7B4', name: 'Blush' };
      state.pattern = 'plain';
      document.querySelectorAll('.sw-row').forEach(function (row) {
        row.querySelectorAll('.sw').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.dataset.name === (row.dataset.target === 'jeogori' ? 'Jade' : 'Blush')));
        });
      });
      document.querySelector('input[name="pattern"][value="plain"]').checked = true;
      apply();
    });

    document.getElementById('saveSwatch').addEventListener('click', function () {
      var empty = savedEl.querySelector('.sw-empty');
      if (empty) empty.remove();
      var chip = document.createElement('span');
      chip.className = 'saved';
      chip.innerHTML = '<i style="background:' + state.jg.hex + '"></i><i style="background:' + state.chi.hex + '"></i>' +
        state.jg.name + ' / ' + state.chi.name;
      savedEl.appendChild(chip);
      var chips = savedEl.querySelectorAll('.saved');
      if (chips.length > 4) chips[0].remove();
    });

    apply();
  }

  /* ---------- fitting form ---------- */
  var form = document.getElementById('fitting-form');
  if (form) {
    var status = document.getElementById('fitting-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['name', 'email', 'date', 'message'].forEach(function (id) {
        var el = form.querySelector('#' + id);
        var wrap = el.closest('.field');
        var valid = el.value.trim().length > 0;
        if (id === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        wrap.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        status.className = 'form-status err on';
        status.textContent = 'A name, an email, the date and a line about the occasion, please. Those four are what the calendar needs.';
        return;
      }
      var name = form.querySelector('#name').value.trim().split(' ')[0];
      status.className = 'form-status on';
      status.textContent = 'Thank you, ' + name + '. I answer fittings on Tuesday and Thursday evenings. If your date is inside two weeks, write “urgent” in the subject and I will look at the calendar first.';
      form.reset();
    });
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
