/* Agave Ember — ember field, tasting wheel and flight logic. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile nav ---------- */
  var bar = document.querySelector('.topbar');
  var menuBtn = document.querySelector('.menu-btn');
  if (bar && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = bar.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    bar.querySelectorAll('.topnav a').forEach(function (a) {
      a.addEventListener('click', function () {
        bar.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && bar.classList.contains('open')) {
        bar.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------- ember canvas ---------- */
  var canvas = document.getElementById('embers');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var parts = [];
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var raf = null;

    function size() {
      var rect = canvas.getBoundingClientRect();
      w = Math.max(rect.width, 320);
      h = Math.max(rect.height, 320);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      parts = [];
      var n = w < 700 ? 26 : 46;
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.7 + Math.random() * 1.9,
          vy: -(0.12 + Math.random() * 0.42),
          vx: (Math.random() - 0.5) * 0.22,
          a: 0.12 + Math.random() * 0.5,
          hue: Math.random() < 0.75 ? '208,90,42' : '201,162,74',
          tw: Math.random() * Math.PI * 2
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.tw += 0.02;
        if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 8;
        if (p.x > w + 10) p.x = -8;
        var alpha = p.a * (0.62 + 0.38 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.hue + ',' + alpha.toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    size();
    seed();
    if (reduced) {
      draw();
      cancelAnimationFrame(raf);
      raf = null;
    } else {
      draw();
    }

    window.addEventListener('resize', function () {
      size();
      seed();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && !raf && !reduced) draw();
    });
  }

  /* ---------- booking form ---------- */
  var bf = document.getElementById('booking-form');
  if (bf) {
    var status = document.getElementById('form-status');
    bf.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (id) { return document.getElementById(id); };
      var fields = [
        ['name', get('name'), function (v) { return v.trim().length >= 2; }, 'A name is enough — first name is fine.'],
        ['email', get('email'), function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, 'That email address looks incomplete.'],
        ['date', get('date'), function (v) { return !!v; }, 'Choose the night you have in mind, even if it is approximate.'],
        ['note', get('note'), function (v) { return v.trim().length >= 8; }, 'A line about the group helps me seat you properly.'],
        ['agree', get('agree'), function (_, el) { return el.checked; }, 'Please confirm you are over 18 and have read the deposit terms.']
      ];
      ['name', 'email', 'date', 'note', 'agree'].forEach(function (id) {
        var el = document.getElementById('err-' + id);
        if (el) el.textContent = '';
      });
      var firstBad = null;
      fields.forEach(function (row) {
        if (!row[2](row[1].value, row[1])) {
          var el = document.getElementById('err-' + row[0]);
          if (el) el.textContent = row[3];
          if (!firstBad) firstBad = row[1];
        }
      });
      if (firstBad) {
        status.className = 'form-status bad';
        status.textContent = 'A few fields still need you before this can go out.';
        firstBad.focus();
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Gracias, ' + get('name').value.trim().split(' ')[0] + '. This is a portfolio preview, so the request has not left the page — write to hola@agaveember.mx with the same details and I will confirm the night within a day.';
      bf.querySelector('button[type="submit"]').textContent = 'Request noted';
    });
  }

  /* ---------- flight builder ---------- */
  var inputs = Array.prototype.slice.call(document.querySelectorAll('input[name="agave"]'));
  if (!inputs.length) return;

  var DATA = {
    espadin:   { name: 'Espadín',   price: 180, smoke: 7, fruit: 5, earth: 2, spice: 3, heat: 4, serve: 'first' },
    tobala: { name: 'Tobalá',    price: 320, smoke: 5, fruit: 8, earth: 3, spice: 4, heat: 5, serve: 'second' },
    tepeztate: { name: 'Tepeztate', price: 380, smoke: 8, fruit: 3, earth: 6, spice: 7, heat: 6, serve: 'third' },
    jabali:    { name: 'Jabalí',    price: 420, smoke: 9, fruit: 6, earth: 8, spice: 5, heat: 7, serve: 'last' },
    ensamble:  { name: 'Ensamble',  price: 260, smoke: 6, fruit: 6, earth: 5, spice: 4, heat: 5, serve: 'second' },
    pechuga:   { name: 'Pechuga',   price: 450, smoke: 4, fruit: 9, earth: 2, spice: 6, heat: 5, serve: 'last' }
  };

  var wheel = document.getElementById('wheel');
  var roCount = document.getElementById('ro-count');
  var roList = document.getElementById('ro-list');
  var roTotal = document.getElementById('ro-total');
  var roNote = document.getElementById('ro-note');
  var AXES = ['Humo', 'Fruta', 'Tierra', 'Especia', 'Calor'];
  var KEYS = ['smoke', 'fruit', 'earth', 'spice', 'heat'];

  function selected() {
    return inputs.filter(function (i) { return i.checked; }).map(function (i) { return DATA[i.value]; });
  }

  function drawWheel(list) {
    if (!wheel || !wheel.getContext) return;
    var box = wheel.getBoundingClientRect();
    var sizePx = Math.max(240, Math.min(box.width || 360, 420));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    wheel.width = Math.round(sizePx * dpr);
    wheel.height = Math.round(sizePx * dpr);
    wheel.style.height = sizePx + 'px';
    var c = wheel.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, sizePx, sizePx);

    var cx = sizePx / 2, cy = sizePx / 2 + 4, R = sizePx * 0.33;
    var n = KEYS.length;

    // rings
    for (var r = 1; r <= 4; r++) {
      c.beginPath();
      for (var i = 0; i < n; i++) {
        var ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        var rad = R * (r / 4);
        var x = cx + Math.cos(ang) * rad;
        var y = cy + Math.sin(ang) * rad;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath();
      c.strokeStyle = 'rgba(239,230,216,' + (r === 4 ? 0.26 : 0.1) + ')';
      c.lineWidth = 1;
      c.stroke();
    }

    // axes + labels
    c.font = '600 9.5px "Space Grotesk", Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (var a = 0; a < n; a++) {
      var angle = -Math.PI / 2 + (a * 2 * Math.PI) / n;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      c.strokeStyle = 'rgba(239,230,216,0.1)';
      c.stroke();
      var lx = cx + Math.cos(angle) * (R + 26);
      var ly = cy + Math.sin(angle) * (R + 22);
      c.fillStyle = 'rgba(167,156,140,0.95)';
      c.fillText(AXES[a].toUpperCase(), lx, ly);
    }

    var values = KEYS.map(function (k) {
      if (!list.length) return 1.1;
      var sum = list.reduce(function (acc, item) { return acc + item[k]; }, 0);
      return sum / list.length;
    });

    c.beginPath();
    for (var v = 0; v < n; v++) {
      var ang2 = -Math.PI / 2 + (v * 2 * Math.PI) / n;
      var rad2 = R * (values[v] / 10);
      var px = cx + Math.cos(ang2) * rad2;
      var py = cy + Math.sin(ang2) * rad2;
      if (v === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = list.length ? 'rgba(208,90,42,0.24)' : 'rgba(239,230,216,0.03)';
    c.fill();
    c.strokeStyle = list.length ? 'rgba(224,121,76,0.95)' : 'rgba(239,230,216,0.18)';
    c.lineWidth = 1.4;
    c.stroke();

    for (var d = 0; d < n; d++) {
      var ang3 = -Math.PI / 2 + (d * 2 * Math.PI) / n;
      var rad3 = R * (values[d] / 10);
      c.beginPath();
      c.arc(cx + Math.cos(ang3) * rad3, cy + Math.sin(ang3) * rad3, list.length ? 3.2 : 2, 0, Math.PI * 2);
      c.fillStyle = list.length ? '#efe6d8' : 'rgba(239,230,216,0.3)';
      c.fill();
    }

    // centre mark
    c.beginPath();
    c.arc(cx, cy, 2, 0, Math.PI * 2);
    c.fillStyle = 'rgba(201,162,74,0.9)';
    c.fill();
  }

  function update() {
    var list = selected();
    var count = list.length;

    roCount.textContent = count + ' of 3 chosen';
    roTotal.textContent = '$' + list.reduce(function (s, i) { return s + i.price; }, 0);

    if (!count) {
      roList.innerHTML = '<li class="empty">Choose an agave on the left to begin.</li>';
      roNote.textContent = 'Three copitas is a flight. Five is a night. Six is a story you will be told back to you.';
    } else {
      var ordered = list.slice().sort(function (a, b) {
        return (a.earth + a.smoke + a.heat) - (b.earth + b.smoke + b.heat);
      });
      roList.innerHTML = ordered.map(function (item, index) {
        return '<li><span>' + (index + 1) + '. ' + item.name + '</span><span>$' + item.price + '</span></li>';
      }).join('');

      var names = ordered.map(function (i) { return i.name; });
      var pour = names.length === 1
        ? 'One copita is a question, not a flight — but start with ' + names[0] + ' and let it open for a minute before the second sip.'
        : 'Pour ' + names.slice(0, -1).join(', ') + ' then ' + names[names.length - 1] + ', in that order, with water and bread between.';
      var heavy = ordered[ordered.length - 1];
      var food = heavy.earth >= 6
        ? 'With the last copita: aged Oaxaca cheese, a little chapulín salt, and nothing sweet.'
        : heavy.fruit >= 8
          ? 'With the last copita: a slice of mango with chile, or a piece of dark chocolate at 70%.'
          : 'With the last copita: bread, salt, and a few minutes of quiet.';
      roNote.textContent = pour + ' ' + food;
    }

    inputs.forEach(function (input) {
      var label = input.closest('.agave');
      var disabled = count >= 3 && !input.checked;
      input.disabled = disabled;
      if (label) label.classList.toggle('is-disabled', disabled);
    });

    drawWheel(list);
  }

  inputs.forEach(function (input) { input.addEventListener('change', update); });
  window.addEventListener('resize', function () { drawWheel(selected()); });
  update();
})();
