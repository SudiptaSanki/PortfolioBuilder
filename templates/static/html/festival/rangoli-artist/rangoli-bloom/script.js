/* Rangoli Bloom — the loom. Hand-written canvas geometry, no libraries.
   Patterns are generated from a symmetry, a ring count and a palette; the
   ledger is arithmetic a rangoli artist actually does before a commission. */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- reveal ---------- */
  var revealables = document.querySelectorAll('.medallions li, .flo, .work, .voice blockquote, .mat tbody tr');
  if ('IntersectionObserver' in window) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('rise'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- work filter ---------- */
  var chips = document.querySelectorAll('.filters .chip');
  if (chips.length) {
    var items = document.querySelectorAll('.works [data-type]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        Array.prototype.forEach.call(chips, function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        Array.prototype.forEach.call(items, function (it) {
          it.hidden = want !== 'all' && it.getAttribute('data-type') !== want;
        });
      });
    });
  }

  /* ---------- commission form ---------- */
  var brief = document.getElementById('brief-form');
  if (brief) {
    var sent = document.getElementById('sent');
    var sentList = document.getElementById('sent-list');

    function val(id) { var f = document.getElementById(id); return f ? f.value.trim() : ''; }
    function err(key, msg, field) {
      var e = document.getElementById('e-' + key);
      if (e) e.textContent = msg || '';
      if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    brief.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = 0;
      var name = val('r-name'), email = val('r-email'), date = val('r-date');
      var place = val('r-place'), kind = val('r-kind'), size = val('r-size');
      var msg = val('r-message'), agree = document.getElementById('r-agree').checked;

      if (name.length < 2) { err('name', 'A name to answer to.', document.getElementById('r-name')); n++; } else err('name', '', document.getElementById('r-name'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err('email', 'This address looks incomplete.', document.getElementById('r-email')); n++; } else err('email', '', document.getElementById('r-email'));
      if (!date) { err('date', 'The date of the function, even approximate.', document.getElementById('r-date')); n++; } else err('date', '', document.getElementById('r-date'));
      if (place.length < 2) { err('place', 'Where is the floor?', document.getElementById('r-place')); n++; } else err('place', '', document.getElementById('r-place'));
      if (!kind) { err('kind', 'Choose the closest kind of floor.', document.getElementById('r-kind')); n++; } else err('kind', '', document.getElementById('r-kind'));
      if (!size) { err('size', 'Even a rough size helps.', document.getElementById('r-size')); n++; } else err('size', '', document.getElementById('r-size'));
      if (msg.length < 20) { err('message', 'A line about the floor, the light and the hour.', document.getElementById('r-message')); n++; } else err('message', '', document.getElementById('r-message'));
      if (!agree) { err('agree', 'Please confirm before sending.'); n++; } else err('agree', '');

      if (n > 0) { var f = brief.querySelector('[aria-invalid="true"]'); if (f) f.focus(); return; }

      var kindSel = document.getElementById('r-kind');
      var sizeSel = document.getElementById('r-size');
      sentList.innerHTML = '<dt>Name</dt><dd>' + name.replace(/[<>]/g, '') + '</dd>' +
        '<dt>Function</dt><dd>' + date + ' · ' + place.replace(/[<>]/g, '') + '</dd>' +
        '<dt>Floor</dt><dd>' + kindSel.options[kindSel.selectedIndex].text + '</dd>' +
        '<dt>Size</dt><dd>' + sizeSel.options[sizeSel.selectedIndex].text + '</dd>';
      brief.hidden = true;
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  /* ---------- the loom ---------- */
  var canvas = document.getElementById('rangoli');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var W = 900, C = 450, R = 408;

  var PATTERNS = {
    lotus: { name: 'Ashta-dala lotus', density: 0.32 },
    kolam: { name: 'Sikku kolam', density: 0.24 },
    peacock: { name: 'Peacock fan', density: 0.4 },
    diya: { name: 'Diya ring', density: 0.2 }
  };

  var PALETTES = {
    kumkum: { name: 'Kumkum', colours: [
      { name: 'Kumkum red', hex: '#b4472e' },
      { name: 'Haldi ochre', hex: '#c98a2e' },
      { name: 'Mehendi green', hex: '#4a6b3a' },
      { name: 'Indigo', hex: '#2b4a6f' }
    ] },
    indigo: { name: 'Indigo', colours: [
      { name: 'Indigo', hex: '#2b4a6f' },
      { name: 'Slate', hex: '#7d94a8' },
      { name: 'Chalk', hex: '#d8c9a6' },
      { name: 'Night blue', hex: '#12324f' }
    ] },
    marigold: { name: 'Marigold', colours: [
      { name: 'Marigold', hex: '#e0a01f' },
      { name: 'Sindoor', hex: '#d9622b' },
      { name: 'Chestnut', hex: '#8c5a2b' },
      { name: 'Pale gold', hex: '#f0c76a' }
    ] }
  };

  var state = { pattern: 'lotus', sym: 8, rings: 6, size: 6, palette: 'kumkum' };
  window.__loom = state;

  var el = {
    rings: document.getElementById('rings'),
    ringsOut: document.getElementById('rings-out'),
    size: document.getElementById('size'),
    sizeOut: document.getElementById('size-out'),
    total: document.getElementById('ledger-total'),
    time: document.getElementById('ledger-time'),
    outline: document.getElementById('ledger-outline'),
    note: document.getElementById('ledger-note'),
    list: document.getElementById('pigments'),
    caption: document.getElementById('loom-caption')
  };

  function powderStroke(pathFn, colour, width, alpha) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * 0.35;
    ctx.lineWidth = width * 1.7;
    ctx.beginPath(); pathFn(); ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath(); pathFn(); ctx.stroke();
    ctx.restore();
  }

  function drawLotus(sym, ringR, colour, idx) {
    var step = (Math.PI * 2) / sym;
    var offset = (idx % 2) * (step / 2);
    var inner = ringR * 0.56;
    var outer = ringR * 0.99;
    var mid = (inner + outer) / 2;
    var half = Math.min(step * 0.3, 0.34);
    for (var k = 0; k < sym; k++) {
      var a = k * step + offset - Math.PI / 2;
      /* filled petal: narrow base, wide belly, pointed tip */
      var petal = function () {
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.bezierCurveTo(
          Math.cos(a - half) * mid, Math.sin(a - half) * mid,
          Math.cos(a - half * 0.55) * outer, Math.sin(a - half * 0.55) * outer,
          Math.cos(a) * outer, Math.sin(a) * outer
        );
        ctx.bezierCurveTo(
          Math.cos(a + half * 0.55) * outer, Math.sin(a + half * 0.55) * outer,
          Math.cos(a + half) * mid, Math.sin(a + half) * mid,
          Math.cos(a) * inner, Math.sin(a) * inner
        );
        ctx.closePath();
      };
      ctx.save();
      ctx.fillStyle = colour;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); petal(); ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#2a2320';
      ctx.lineWidth = 1;
      ctx.beginPath(); petal(); ctx.stroke();
      ctx.restore();
      /* powder vein and base dot */
      powderStroke(function () {
        ctx.moveTo(Math.cos(a) * inner * 1.05, Math.sin(a) * inner * 1.05);
        ctx.lineTo(Math.cos(a) * outer * 0.84, Math.sin(a) * outer * 0.84);
      }, colour, 1.5, 0.55);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#2a2320';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * ringR * 0.47, Math.sin(a) * ringR * 0.47, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawKolam(sym, ringR, colour) {
    var step = (Math.PI * 2) / sym;
    /* scalloped loop through the dot ring */
    powderStroke(function () {
      for (var k = 0; k <= sym; k++) {
        var a0 = k * step - Math.PI / 2;
        var a1 = (k + 1) * step - Math.PI / 2;
        var mx = (Math.cos(a0) + Math.cos(a1)) / 2 * ringR * 0.86;
        var my = (Math.sin(a0) + Math.sin(a1)) / 2 * ringR * 0.86;
        var cxp = Math.cos((a0 + a1) / 2) * ringR * 1.1;
        var cyp = Math.sin((a0 + a1) / 2) * ringR * 1.1;
        if (k === 0) ctx.moveTo(Math.cos(a0) * ringR, Math.sin(a0) * ringR);
        ctx.quadraticCurveTo(cxp, cyp, Math.cos(a1) * ringR, Math.sin(a1) * ringR);
      }
    }, colour, 3.4, 0.9);

    /* inward hooks, the sikku signature */
    for (var j = 0; j < sym; j++) {
      var a = j * step - Math.PI / 2 + step / 2;
      var r0 = ringR * 0.98;
      var r1 = ringR * 0.62;
      powderStroke(function () {
        ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        ctx.quadraticCurveTo(
          Math.cos(a + 0.22) * (ringR * 0.8), Math.sin(a + 0.22) * (ringR * 0.8),
          Math.cos(a) * r1, Math.sin(a) * r1
        );
      }, colour, 2.6, 0.8);
    }
  }

  function drawPeacock(sym, ringR, colour) {
    var step = (Math.PI * 2) / sym;
    for (var k = 0; k < sym; k++) {
      var a = k * step - Math.PI / 2;
      /* three feather arcs */
      for (var f = 0; f < 3; f++) {
        var rr = ringR * (0.66 + f * 0.11);
        var spread = 0.2 + f * 0.05;
        powderStroke(function () {
          ctx.moveTo(Math.cos(a - spread) * rr, Math.sin(a - spread) * rr);
          ctx.quadraticCurveTo(
            Math.cos(a) * (rr * 1.14), Math.sin(a) * (rr * 1.14),
            Math.cos(a + spread) * rr, Math.sin(a + spread) * rr
          );
        }, colour, 3, 0.85);
      }
      /* eye */
      ctx.save();
      ctx.fillStyle = colour;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * ringR * 0.98, Math.sin(a) * ringR * 0.98, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      /* stem */
      powderStroke(function () {
        ctx.moveTo(Math.cos(a) * ringR * 0.2, Math.sin(a) * ringR * 0.2);
        ctx.lineTo(Math.cos(a) * ringR * 0.62, Math.sin(a) * ringR * 0.62);
      }, colour, 2, 0.5);
    }
  }

  function drawDiya(sym, ringR, colour, flameColour) {
    var step = (Math.PI * 2) / sym;
    var lamp = 0.6 + 0.5 * (ringR / R);
    for (var k = 0; k < sym; k++) {
      var a = k * step - Math.PI / 2;
      var x = Math.cos(a) * ringR * 0.9;
      var y = Math.sin(a) * ringR * 0.9;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 2); /* local +y points outward */
      /* bowl */
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.ellipse(0, 3 * lamp, 10 * lamp, 5.4 * lamp, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#2a2320';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, 3 * lamp, 10 * lamp, 5.4 * lamp, 0, 0, Math.PI * 2);
      ctx.stroke();
      /* flame, drawn toward the centre of the piece */
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = flameColour;
      ctx.beginPath();
      ctx.moveTo(0, -1 * lamp);
      ctx.quadraticCurveTo(5.4 * lamp, -9 * lamp, 0, -19 * lamp);
      ctx.quadraticCurveTo(-5.4 * lamp, -9 * lamp, 0, -1 * lamp);
      ctx.fill();
      ctx.restore();
      /* ring arc between lamps */
      powderStroke(function () {
        var b0 = a + step * 0.14, b1 = a + step * 0.86;
        ctx.moveTo(Math.cos(b0) * ringR, Math.sin(b0) * ringR);
        ctx.quadraticCurveTo(
          Math.cos((b0 + b1) / 2) * ringR * 1.02, Math.sin((b0 + b1) / 2) * ringR * 1.02,
          Math.cos(b1) * ringR, Math.sin(b1) * ringR
        );
      }, colour, 2.2, 0.55);
    }
  }

  function draw() {
    var pal = PALETTES[state.palette];
    var pat = PATTERNS[state.pattern];
    var colourCount = pal.colours.length;

    ctx.clearRect(0, 0, W, W);
    /* floor wash */
    ctx.save();
    ctx.fillStyle = '#f7f3ea';
    ctx.beginPath(); ctx.arc(C, C, R + 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* pulli dots */
    ctx.save();
    ctx.fillStyle = 'rgba(42,35,32,0.16)';
    for (var ri = 1; ri <= state.rings + 1; ri++) {
      var rr = R * (ri / (state.rings + 1)) * 0.94;
      for (var si = 0; si < state.sym; si++) {
        var ang = (si * Math.PI * 2) / state.sym - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(C + Math.cos(ang) * rr, C + Math.sin(ang) * rr, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    /* rings, outer to inner so inner lines sit on top; drawn in centre-relative units */
    ctx.save();
    ctx.translate(C, C);
    for (var i = state.rings; i >= 1; i--) {
      var ringR = R * (i / (state.rings + 1)) * 0.94;
      var col = pal.colours[(state.rings - i) % colourCount];
      if (state.pattern === 'lotus') drawLotus(state.sym, ringR, col.hex, i);
      else if (state.pattern === 'kolam') drawKolam(state.sym, ringR, col.hex);
      else if (state.pattern === 'peacock') drawPeacock(state.sym, ringR, col.hex);
      else drawDiya(state.sym, ringR, pal.colours[0].hex, pal.colours[1].hex);
    }
    ctx.restore();

    /* outer boundary + centre */
    ctx.save();
    ctx.strokeStyle = pal.colours[0].hex;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(C, C, R * 0.97, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.colours[0].hex;
    ctx.beginPath(); ctx.arc(C, C, 11, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    updateLedger(pat, pal);
  }

  function updateLedger(pat, pal) {
    var areaSqFt = Math.PI * Math.pow(state.size / 2, 2);
    var ringFactor = 0.58 + state.rings * 0.07;
    var total = areaSqFt * 45 * pat.density * ringFactor;
    total = Math.round(total / 5) * 5;

    var sumW = (state.rings * (state.rings + 1)) / 2;
    var per = pal.colours.map(function () { return 0; });
    for (var i = 1; i <= state.rings; i++) {
      var share = (total * i) / sumW;
      per[(state.rings - i) % pal.colours.length] += share;
    }

    el.list.innerHTML = pal.colours.map(function (c, idx) {
      var g = Math.round(per[idx] / 5) * 5;
      if (g <= 0) return '';
      return '<li><span class="sw" style="background:' + c.hex + '"></span><span class="nm">' + c.name + '</span><span class="gm">' + g + ' g</span></li>';
    }).join('');

    var minutes = Math.round(total / 1.6 / 5) * 5 + state.size * 5;
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    el.total.textContent = total + ' g';
    el.time.textContent = h + ' h ' + (m < 10 ? '0' + m : m) + ' m';
    el.outline.textContent = 'Rice flour · ' + (Math.round(state.size * 3.1416 * 1.15 * 12 / 5) * 5) + ' g';
    el.ringsOut.textContent = String(state.rings);
    el.sizeOut.textContent = state.size + ' ft';
    el.caption.textContent = pat.name + ' · ' + state.sym + '-fold · ' + state.size + ' ft · ' + state.rings + ' rings';

    var notes = [];
    if (state.size >= 10) notes.push('At ' + state.size + ' ft the symmetry drifts unless you string a grid across the whole floor and draw from the centre out in four quarters. Two pairs of hands, nine hours.');
    if (state.pattern === 'kolam' && state.sym === 12) notes.push('A 12-fold sikku kolam wants 37 dots in the first ring. Lay every dot before you draw a single line, or the loops will not close.');
    if (state.pattern === 'diya' && state.size > 8) notes.push('Diyas need a dead-level floor; on a slope the oil runs to one side of the bowl. Check with a marble before you draw the ring.');
    if (state.size <= 4 && state.rings >= 8) notes.push('This is a dense drawing for a small floor. At ' + state.size + ' ft, drop to 5 rings or the powder lines will merge into one colour when the door opens.');
    if (!notes.length) notes.push('One pair of hands is enough at this size. Draw the outline first in rice flour, then fill from the centre out, so you never kneel on wet pigment.');
    el.note.textContent = notes[0];
  }

  /* controls */
  Array.prototype.forEach.call(document.querySelectorAll('[data-pattern]'), function (b) {
    b.addEventListener('click', function () {
      state.pattern = b.getAttribute('data-pattern');
      document.querySelectorAll('[data-pattern]').forEach(function (o) {
        var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      draw();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-sym]'), function (b) {
    b.addEventListener('click', function () {
      state.sym = parseInt(b.getAttribute('data-sym'), 10);
      document.querySelectorAll('[data-sym]').forEach(function (o) {
        var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      draw();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-pal]'), function (b) {
    b.addEventListener('click', function () {
      state.palette = b.getAttribute('data-pal');
      document.querySelectorAll('[data-pal]').forEach(function (o) {
        var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      draw();
    });
  });

  el.rings.addEventListener('input', function () { state.rings = parseInt(el.rings.value, 10); draw(); });
  el.size.addEventListener('input', function () { state.size = parseInt(el.size.value, 10); draw(); });

  draw();
})();
window.__loomVer='v3';
