/* Eggshell Meadow — studio interactions and the pysanka recipe table. */
(function () {
  'use strict';

  /* ---------- navigation ---------- */
  var header = document.querySelector('.topbar');
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- scroll reveal ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('.process, .commissions, .quote-band, .closing, .studio-head, .studio-grid'));
  if (revealables.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealables.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.94) el.classList.add('reveal');
    });
    var ticking = false;
    var checkReveal = function () {
      ticking = false;
      document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('is-in');
      });
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; checkReveal(); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('load', checkReveal);
    checkReveal();
    setTimeout(checkReveal, 900);
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) { el.classList.add('is-in'); });
    }, 5000);
  }

  /* ---------- pysanka table ---------- */
  var DYES = {
    onion: { label: 'onion skin', hex: '#c0773c', temp: 62, min: 22, note: 'the ochre that starts almost every egg' },
    madder: { label: 'madder root', hex: '#a3352a', temp: 58, min: 20, note: 'roots dug in the second autumn' },
    indigo: { label: 'indigo', hex: '#2f4257', temp: 55, min: 18, note: 'the bath that swallows the light' },
    walnut: { label: 'walnut husk', hex: '#4a3a28', temp: 60, min: 20, note: 'a brown with green still in it' },
    buckthorn: { label: 'buckthorn', hex: '#5e7358', temp: 60, min: 20, note: 'the old green, hard to keep even' }
  };

  var MOTIFS = {
    star8: {
      label: 'eight-point star', axes: 8, waxMarks: 9,
      shapes: [{ d: 'M12 0l3 8 8-2-6 6 6 6-8-2-3 8-3-8-8 2 6-6-6-6 8 2z', mode: 'fill' }],
      cols: 3, rows: 3, scale: 1.15, offset: true, name: 'star'
    },
    rye: {
      label: 'rye ear', axes: 6, waxMarks: 12,
      shapes: [
        { d: 'M12 23V6', mode: 'stroke' },
        { d: 'M12 8C8.4 6.2 5.6 7.4 4.4 11c3.6 1 6.4-.2 7.6-3z', mode: 'fill' },
        { d: 'M12 8c3.6-1.8 6.4-.6 7.6 3-3.6 1-6.4-.2-7.6-3z', mode: 'fill' },
        { d: 'M12 14c-3.6-1.8-6.4-.6-7.6 3 3.6 1 6.4-.2 7.6-3z', mode: 'fill' },
        { d: 'M12 14c3.6-1.8 6.4-.6 7.6 3-3.6 1-6.4-.2-7.6-3z', mode: 'fill' }
      ],
      cols: 2, rows: 3, scale: 1.5, offset: false, name: 'rye ear'
    },
    sun: {
      label: 'sun rosette', axes: 8, waxMarks: 6,
      shapes: [
        { d: 'M12 7.6a4.4 4.4 0 1 1-.01 0z', mode: 'fill' },
        { d: 'M12 0v4M12 20v4M0 12h4M20 12h4M3.6 3.6l2.8 2.8M17.6 17.6l2.8 2.8M20.4 3.6l-2.8 2.8M6.4 17.6l-2.8 2.8', mode: 'stroke' }
      ],
      cols: 2, rows: 2, scale: 1.7, offset: false, name: 'sun'
    },
    spiral: {
      label: 'trypillian spiral', axes: 6, waxMarks: 10,
      shapes: [
        { d: 'M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6 8 8 0 1 1-8-8', mode: 'stroke' }
      ],
      cols: 3, rows: 3, scale: 1.25, offset: true, name: 'spiral'
    }
  };

  var SIZES = {
    hen: { label: 'hen', cm: 5.5, factor: 0.82, axesName: 'axis' },
    goose: { label: 'goose', cm: 7.5, factor: 1, axesName: 'axis' },
    ostrich: { label: 'ostrich', cm: 15, factor: 1.38, axesName: 'axis' }
  };

  var state = { motif: 'star8', order: ['onion', 'madder', 'indigo'], size: 'goose' };

  var preview = document.getElementById('eggPreview');
  var recipeEl = document.getElementById('recipe');
  var warningEl = document.getElementById('recipeWarning');
  var footEl = document.getElementById('recipeFoot');
  var orderList = document.getElementById('orderList');
  var bathCount = document.getElementById('bathCount');
  var form = document.getElementById('pysankaForm');

  function luminance(hex) {
    var c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var rgb = [0, 2, 4].map(function (i) {
      var v = parseInt(c.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function motifCells(motif) {
    var cells = [];
    var cols = motif.cols;
    var rows = motif.rows;
    var x0 = 44, x1 = 196;
    var y0 = 76, y1 = 226;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = x0 + (cols === 1 ? 0 : (x1 - x0) * (c / (cols - 1)));
        var y = y0 + (rows === 1 ? 0 : (y1 - y0) * (r / (rows - 1)));
        if (motif.offset && r % 2 === 1) x += (x1 - x0) / (cols * 2) * 0.5;
        cells.push({ x: x, y: y, row: r });
      }
    }
    return cells;
  }

  function motifMarkup(motif, cx, cy, scale, color) {
    var out = '<g transform="translate(' + (cx - 12 * scale).toFixed(1) + ' ' + (cy - 12 * scale).toFixed(1) + ') scale(' + scale + ')">';
    motif.shapes.forEach(function (shape) {
      if (shape.mode === 'stroke') {
        out += '<path d="' + shape.d + '" fill="none" stroke="' + color + '" stroke-width="1.7" stroke-linecap="round"/>';
      } else {
        out += '<path d="' + shape.d + '" fill="' + color + '"/>';
      }
    });
    return out + '</g>';
  }

  function renderEgg() {
    var motif = MOTIFS[state.motif];
    var colors = state.order.map(function (k) { return DYES[k].hex; });
    var base = colors.length ? colors[colors.length - 1] : '#f7f0e2';
    var c1 = colors.length > 0 ? colors[0] : '#c0773c';
    var c2 = colors.length > 1 ? colors[1] : c1;
    var parts = [];

    parts.push('<defs><clipPath id="eggClip"><path d="M120 12C172 12 208 88 208 164c0 88-39 148-88 148S32 252 32 164C32 88 68 12 120 12Z"/></clipPath></defs>');
    parts.push('<ellipse cx="120" cy="300" rx="62" ry="8" fill="#2b2117" opacity="0.16"/>');
    parts.push('<path d="M120 12C172 12 208 88 208 164c0 88-39 148-88 148S32 252 32 164C32 88 68 12 120 12Z" fill="' + base + '"/>');
    parts.push('<g clip-path="url(#eggClip)">');

    parts.push('<rect x="0" y="54" width="240" height="8" fill="' + c1 + '"/>');
    parts.push('<rect x="0" y="64" width="240" height="2" fill="' + c2 + '"/>');
    parts.push('<rect x="0" y="238" width="240" height="8" fill="' + c1 + '"/>');
    parts.push('<rect x="0" y="248" width="240" height="2" fill="' + c2 + '"/>');

    parts.push(motifMarkup(motif, 120, 150, 2.9, c2));
    parts.push(motifMarkup(motif, 120, 150, 1.5, c1));

    var ring = [];
    for (var k = 0; k < 8; k++) {
      var angle = (Math.PI * 2 * k) / 8 - Math.PI / 2;
      ring.push([120 + Math.cos(angle) * 66, 150 + Math.sin(angle) * 72]);
    }
    ring.forEach(function (pt) {
      parts.push(motifMarkup(motif, pt[0], pt[1], 0.95, c1));
    });

    for (var i = 0; i < 9; i++) {
      var x = 42 + i * 19.5;
      parts.push('<circle cx="' + x.toFixed(1) + '" cy="46" r="2.2" fill="' + c2 + '"/>');
      parts.push('<circle cx="' + x.toFixed(1) + '" cy="262" r="2.2" fill="' + c2 + '"/>');
    }

    parts.push('<circle cx="120" cy="86" r="3.2" fill="' + c1 + '"/>');
    parts.push('<circle cx="120" cy="216" r="3.2" fill="' + c1 + '"/>');

    parts.push('</g>');
    parts.push('<path d="M120 12C172 12 208 88 208 164c0 88-39 148-88 148S32 252 32 164C32 88 68 12 120 12Z" fill="none" stroke="#2b2117" stroke-width="1.2" opacity="0.5"/>');

    preview.innerHTML = '<svg viewBox="0 0 240 312" role="img" aria-label="Preview of a ' + SIZES[state.size].label + ' pysanka with ' + motif.label + ' motif in ' + state.order.map(function (k) { return DYES[k].label; }).join(', ') + '">' + parts.join('') + '</svg>';
  }

  function renderOrder() {
    orderList.innerHTML = '';
    if (!state.order.length) {
      orderList.innerHTML = '<li class="empty">No bath chosen yet — the egg stays cream.</li>';
    }
    state.order.forEach(function (key, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="n">' + (i + 1) + '</span><span>Bath ' + (i + 1) + ' · ' + DYES[key].label + ' — ' + DYES[key].min + ' min at ' + DYES[key].temp + ' °C</span>';
      orderList.appendChild(li);
    });
    document.querySelectorAll('.dye').forEach(function (btn) {
      var key = btn.getAttribute('data-dye');
      var idx = state.order.indexOf(key);
      btn.classList.toggle('is-on', idx >= 0);
      if (idx >= 0) btn.setAttribute('data-order', String(idx + 1));
      else btn.removeAttribute('data-order');
      btn.setAttribute('aria-pressed', idx >= 0 ? 'true' : 'false');
    });
    bathCount.textContent = state.order.length + (state.order.length === 1 ? ' bath' : ' baths');
  }

  function renderRecipe() {
    var motif = MOTIFS[state.motif];
    var size = SIZES[state.size];
    var steps = [];
    var total = 0;
    steps.push('Wash the ' + size.label + ' shell (' + size.cm + ' cm) and divide it into ' + motif.axes + ' axes with a 4B pencil.');
    state.order.forEach(function (key, i) {
      var d = DYES[key];
      var mins = Math.round(d.min * size.factor);
      total += mins;
      steps.push('Bath ' + (i + 1) + ' — ' + d.label + ', ' + mins + ' min at ' + d.temp + ' °C. ' + d.note.charAt(0).toUpperCase() + d.note.slice(1) + '.');
      if (i === 0) {
        steps.push('Dry the shell 15 minutes, then wax ' + motif.waxMarks + ' ' + motif.name + ' marks with the fine kistka. Wax at 118 °C.');
      } else if (i === 1) {
        steps.push('Wax the field between the ' + motif.name + ' marks and the rim dots. Keep the wax line unbroken.');
      }
    });
    if (!state.order.length) {
      steps.push('With no bath chosen the egg stays the colour of the shell. Choose at least one dye to begin.');
    }
    steps.push('Melt the wax beside a candle flame, wipe with linen, and polish with one drop of sunflower oil.');

    recipeEl.innerHTML = steps.map(function (s, i) {
      return '<li><span class="rn">' + String(i + 1).padStart(2, '0') + '</span><span>' + s + '</span></li>';
    }).join('');

    var dark = state.order.some(function (key, i) {
      return i > 0 && luminance(DYES[key].hex) > luminance(DYES[state.order[i - 1]].hex) + 0.02;
    });
    if (dark) {
      warningEl.hidden = false;
      warningEl.textContent = 'This order goes back towards the light. A later pale bath will not lift an earlier dark one — the egg turns muddy instead. Traditional order: onion, then madder, then indigo or walnut.';
    } else {
      warningEl.hidden = true;
      warningEl.textContent = '';
    }

    var waxMarks = motif.waxMarks;
    footEl.textContent = 'Total dipping ' + total + ' min · wax 118 °C · ' + waxMarks + ' wax marks · ' + size.cm + ' cm shell · ' + state.order.length + ' colour' + (state.order.length === 1 ? '' : 's') + ' on the egg.';
  }

  function renderAll() {
    renderEgg();
    renderOrder();
    renderRecipe();
  }

  document.querySelectorAll('.motif').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.motif = btn.getAttribute('data-motif');
      document.querySelectorAll('.motif').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      renderAll();
    });
  });

  document.querySelectorAll('.dye').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-dye');
      var idx = state.order.indexOf(key);
      if (idx >= 0) {
        state.order.splice(idx, 1);
      } else {
        if (state.order.length >= 3) state.order.splice(2, 1);
        state.order.push(key);
      }
      renderAll();
    });
  });

  var sizeSel = document.getElementById('eggSize');
  if (sizeSel) {
    sizeSel.addEventListener('change', function () {
      state.size = sizeSel.value;
      renderAll();
    });
  }

  var resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      state = { motif: 'star8', order: ['onion', 'madder', 'indigo'], size: 'goose' };
      if (sizeSel) sizeSel.value = 'goose';
      document.querySelectorAll('.motif').forEach(function (b) {
        var on = b.getAttribute('data-motif') === 'star8';
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      renderAll();
    });
  }

  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

  if (preview && recipeEl) renderAll();

  /* ---------- contact form ---------- */
  var contact = document.getElementById('contactForm');
  if (contact) {
    var status = document.getElementById('formStatus');
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contact.querySelector('#cName');
      var email = contact.querySelector('#cEmail');
      var message = contact.querySelector('#cMessage');
      var errors = [];
      [name, email, message].forEach(function (f) { f.removeAttribute('aria-invalid'); });
      if (!name.value.trim()) { errors.push(['name', name]); }
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { errors.push(['email', email]); }
      if (message.value.trim().length < 12) { errors.push(['message', message]); }
      if (errors.length) {
        errors.forEach(function (pair) { pair[1].setAttribute('aria-invalid', 'true'); });
        status.textContent = 'Please add a name, a working email and a sentence about the egg.';
        status.className = 'form-status is-error';
        errors[0][1].focus();
        return;
      }
      status.textContent = 'Thank you, ' + name.value.trim() + '. Your note is in the studio inbox — I answer on Tuesday and Friday evenings.';
      status.className = 'form-status is-ok';
      contact.reset();
    });
  }
})();
