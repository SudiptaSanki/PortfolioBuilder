/* Taller Tolentino — the papel designer, the menu and the commission form.
   Silent: this page draws paper, it does not play it. */

(function () {
  'use strict';

  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth <= 650) {
        nav.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------- designer -- */
  var svg = document.getElementById('papel');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var state = { motif: 'calavera', hex: '#c2185b', colour: 'Rosa mexicano', pennants: 7, density: 2 };
    var MOTIF_NAMES = {
      calavera: 'Calavera',
      cempasuchil: 'Cempasúchil',
      milagro: 'Milagro',
      nopal: 'Nopal',
      paloma: 'Paloma'
    };

    var pennantsIn = document.getElementById('pennants');
    var densityIn = document.getElementById('density');
    var countOut = document.getElementById('count-out');
    var densityOut = document.getElementById('density-out');
    var capMotif = document.getElementById('cap-motif');
    var capColour = document.getElementById('cap-colour');
    var capCount = document.getElementById('cap-count');
    var calc = {
      sheets: document.getElementById('c-sheets'),
      passes: document.getElementById('c-passes'),
      cuts: document.getElementById('c-cuts'),
      string: document.getElementById('c-string'),
      hours: document.getElementById('c-hours'),
      price: document.getElementById('c-price')
    };

    function el(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      return n;
    }

    function stringY(x) {
      // quadratic from (20,46) to (640,46), control (330,76)
      var t = (x - 20) / 620;
      var mt = 1 - t;
      return mt * mt * 46 + 2 * mt * t * 76 + t * t * 46;
    }

    function motifHoles(g, type, cx, cy, s, HOLE) {
      var i;
      if (type === 'calavera') {
        g.appendChild(el('circle', { cx: cx - s * 0.18, cy: cy - s * 0.12, r: s * 0.10, fill: HOLE }));
        g.appendChild(el('circle', { cx: cx + s * 0.18, cy: cy - s * 0.12, r: s * 0.10, fill: HOLE }));
        g.appendChild(el('path', { d: 'M' + (cx - s * 0.05) + ' ' + (cy + s * 0.04) + 'l' + (s * 0.10) + ' 0l-' + (s * 0.05) + ' ' + (s * 0.10) + 'Z', fill: HOLE }));
        for (i = 0; i < 4; i++) {
          g.appendChild(el('rect', { x: cx - s * 0.20 + i * s * 0.11, y: cy + s * 0.22, width: s * 0.06, height: s * 0.10, fill: HOLE }));
        }
        g.appendChild(el('circle', { cx: cx, cy: cy - s * 0.30, r: s * 0.05, fill: HOLE }));
      } else if (type === 'cempasuchil') {
        for (i = 0; i < 8; i++) {
          var a = (i * Math.PI) / 4;
          var px = cx + Math.cos(a) * s * 0.30;
          var py = cy + Math.sin(a) * s * 0.30;
          g.appendChild(el('ellipse', {
            cx: px, cy: py, rx: s * 0.10, ry: s * 0.20,
            transform: 'rotate(' + (i * 45 + 90) + ' ' + px + ' ' + py + ')',
            fill: HOLE
          }));
        }
        g.appendChild(el('circle', { cx: cx, cy: cy, r: s * 0.12, fill: HOLE }));
      } else if (type === 'milagro') {
        g.appendChild(el('path', {
          d: 'M' + cx + ' ' + (cy + s * 0.34) +
             'C' + (cx - s * 0.46) + ' ' + (cy + s * 0.02) + ' ' + (cx - s * 0.28) + ' ' + (cy - s * 0.34) + ' ' + cx + ' ' + (cy - s * 0.12) +
             'C' + (cx + s * 0.28) + ' ' + (cy - s * 0.34) + ' ' + (cx + s * 0.46) + ' ' + (cy + s * 0.02) + ' ' + cx + ' ' + (cy + s * 0.34) + 'Z',
          fill: HOLE
        }));
        for (i = 0; i < 6; i++) {
          var ang = (i * Math.PI) / 3;
          g.appendChild(el('line', {
            x1: cx + Math.cos(ang) * s * 0.34, y1: cy - s * 0.18 + Math.sin(ang) * s * 0.30,
            x2: cx + Math.cos(ang) * s * 0.46, y2: cy - s * 0.18 + Math.sin(ang) * s * 0.42,
            stroke: HOLE, 'stroke-width': s * 0.05, 'stroke-linecap': 'round'
          }));
        }
      } else if (type === 'nopal') {
        g.appendChild(el('rect', { x: cx - s * 0.09, y: cy - s * 0.34, width: s * 0.18, height: s * 0.68, rx: s * 0.09, fill: HOLE }));
        g.appendChild(el('path', { d: 'M' + (cx - s * 0.09) + ' ' + (cy - s * 0.10) + 'q-' + (s * 0.24) + ' 0 -' + (s * 0.24) + ' ' + (s * 0.12) + 'v' + (s * 0.12) + 'q0 ' + (s * 0.12) + ' ' + (s * 0.12) + ' ' + (s * 0.12) + 'h' + (s * 0.12) + 'Z', fill: HOLE }));
        g.appendChild(el('path', { d: 'M' + (cx + s * 0.09) + ' ' + (cy - s * 0.20) + 'q' + (s * 0.24) + ' 0 ' + (s * 0.24) + ' ' + (s * 0.12) + 'v' + (s * 0.12) + 'q0 ' + (s * 0.12) + ' -' + (s * 0.12) + ' ' + (s * 0.12) + 'h-' + (s * 0.12) + 'Z', fill: HOLE }));
        for (i = 0; i < 5; i++) {
          g.appendChild(el('circle', { cx: cx - s * 0.03 + (i % 2) * s * 0.07, cy: cy - s * 0.24 + i * s * 0.12, r: s * 0.015, fill: HOLE }));
        }
      } else if (type === 'paloma') {
        g.appendChild(el('path', {
          d: 'M' + (cx - s * 0.34) + ' ' + (cy + s * 0.10) +
             'q' + (s * 0.18) + ' -' + (s * 0.16) + ' ' + (s * 0.34) + ' -' + (s * 0.22) +
             'q' + (s * 0.10) + ' -' + (s * 0.20) + ' ' + (s * 0.24) + ' -' + (s * 0.14) +
             'q' + (s * 0.02) + ' ' + (s * 0.12) + ' -' + (s * 0.06) + ' ' + (s * 0.18) +
             'q' + (s * 0.16) + ' ' + (s * 0.04) + ' ' + (s * 0.20) + ' ' + (s * 0.20) +
             'q-' + (s * 0.28) + ' ' + (s * 0.04) + ' -' + (s * 0.44) + ' ' + (s * 0.06) +
             'q-' + (s * 0.16) + ' ' + (s * 0.04) + ' -' + (s * 0.28) + ' -' + (s * 0.02) + 'Z',
          fill: HOLE
        }));
        g.appendChild(el('circle', { cx: cx - s * 0.30, cy: cy + s * 0.05, r: s * 0.02, fill: HOLE }));
        g.appendChild(el('path', { d: 'M' + (cx - s * 0.04) + ' ' + (cy + s * 0.02) + 'q' + (s * 0.08) + ' ' + (s * 0.10) + ' ' + (s * 0.16) + ' ' + (s * 0.04), stroke: HOLE, fill: 'none', 'stroke-width': s * 0.04 }));
      }
    }

    function draw() {
      var W = 660;
      var H = 300;
      var HOLE = '#17120f';
      var n = state.pennants;
      var gap = 8;
      var w = Math.min(96, (600 - gap * (n - 1)) / n);
      var h = 140;

      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute('aria-label',
        'Papel picado banner of ' + n + ' ' + MOTIF_NAMES[state.motif] + ' pennants in ' + state.colour + '.');

      svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: HOLE }));

      // a wall with faint horizontal courses
      var wall = el('g', { stroke: '#2b241e', 'stroke-width': 1 });
      for (var wy = 34; wy < H; wy += 44) wall.appendChild(el('line', { x1: 0, y1: wy, x2: W, y2: wy }));
      svg.appendChild(wall);

      // the string, and the run centred under it
      var total = n * w + (n - 1) * gap;
      var startX = (W - total) / 2;
      svg.appendChild(el('path', { d: 'M' + (startX - 26) + ' 40Q' + W / 2 + ' 74 ' + (startX + total + 26) + ' 40', fill: 'none', stroke: '#7a6a55', 'stroke-width': 1.6 }));
      svg.appendChild(el('path', { d: 'M20 34L' + (startX - 26) + ' 40M' + (startX + total + 26) + ' 40L640 34', fill: 'none', stroke: '#7a6a55', 'stroke-width': 1.2, 'stroke-opacity': 0.7 }));

      function stringY(x) {
        var t = (x - (startX - 26)) / (total + 52);
        var mt = 1 - t;
        return mt * mt * 40 + 2 * mt * t * 74 + t * t * 40;
      }

      var sheets = el('g', { fill: state.hex });
      var holes = el('g');
      var cuts = 0;

      for (var i = 0; i < n; i++) {
        var x = startX + i * (w + gap);
        var ty = stringY(x + w / 2) + 4;
        sheets.appendChild(el('path', {
          d: 'M' + x + ' ' + ty + 'h' + w + 'v' + h + 'l-' + (w / 2) + ' 12l-' + (w / 2) + ' -12Z'
        }));
        holes.appendChild(el('circle', { cx: x + w / 2, cy: ty + 3, r: 2.2, fill: HOLE }));
        cuts++;

        var border = 2 + state.density;
        for (var b = 0; b < border; b++) {
          var by = ty + h * (0.34 + (b * 0.52) / border);
          holes.appendChild(el('circle', { cx: x + 4, cy: by, r: 1.9, fill: HOLE }));
          holes.appendChild(el('circle', { cx: x + w - 4, cy: by, r: 1.9, fill: HOLE }));
          cuts += 2;
        }
        var topCuts = state.density + 1;
        for (var t2 = 0; t2 < topCuts; t2++) {
          var tx = x + (w * (t2 + 1)) / (topCuts + 1);
          holes.appendChild(el('path', {
            d: 'M' + (tx - 2.4) + ' ' + (ty + 7) + 'l2.4 3.2l2.4 -3.2Z', fill: HOLE
          }));
          cuts++;
        }

        var s = Math.max(14, w * 0.78);
        var before = holes.childElementCount;
        motifHoles(holes, state.motif, x + w / 2, ty + h * 0.52, s, HOLE);
        cuts += holes.childElementCount - before;
      }

      svg.appendChild(sheets);
      svg.appendChild(holes);

      // the string knots at each pennant
      var knots = el('g', { fill: '#7a6a55' });
      for (var k = 0; k < n; k++) {
        var kx = startX + k * (w + gap) + w / 2;
        knots.appendChild(el('circle', { cx: kx, cy: stringY(kx) + 1, r: 2.6 }));
      }
      svg.appendChild(knots);

      var caption = el('text', { x: 22, y: 22, fill: '#a2947f', 'font-size': 9, 'font-family': 'Courier Prime, monospace' });
      caption.textContent = 'TALLER TOLENTINO · ' + MOTIF_NAMES[state.motif].toUpperCase() + ' · ' + n + ' PENNANTS';
      svg.appendChild(caption);

      // counts
      var sheetsN = n;
      var hours = (n * 0.16 + 1.5).toFixed(1);
      var price = 180 * n + 450;
      var stringM = (n * 0.6 + 0.4).toFixed(1);
      calc.sheets.textContent = String(sheetsN);
      calc.passes.textContent = sheetsN > 40 ? Math.ceil(sheetsN / 40) + ' passes' : sheetsN + ' layers, 1 pass';
      calc.cuts.textContent = String(cuts);
      calc.string.textContent = stringM + ' m';
      calc.hours.textContent = hours + ' h';
      calc.price.textContent = '$' + price.toLocaleString('es-MX') + ' MXN';

      capMotif.textContent = MOTIF_NAMES[state.motif];
      capColour.textContent = state.colour;
      capCount.textContent = n + ' pennants';
    }

    pennantsIn.addEventListener('input', function () {
      state.pennants = parseInt(pennantsIn.value, 10);
      countOut.textContent = String(state.pennants);
      draw();
    });

    densityIn.addEventListener('input', function () {
      state.density = parseInt(densityIn.value, 10);
      densityOut.textContent = ['open', 'regular', 'close'][state.density - 1];
      draw();
    });

    var motifs = document.querySelectorAll('[data-motif]');
    Array.prototype.forEach.call(motifs, function (chip) {
      chip.addEventListener('click', function () {
        state.motif = chip.dataset.motif;
        Array.prototype.forEach.call(motifs, function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        draw();
      });
    });

    var swatches = document.querySelectorAll('[data-colour]');
    Array.prototype.forEach.call(swatches, function (sw) {
      sw.addEventListener('click', function () {
        state.hex = sw.dataset.hex;
        state.colour = sw.getAttribute('aria-label');
        Array.prototype.forEach.call(swatches, function (c) {
          var on = c === sw;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        draw();
      });
    });

    var form = document.getElementById('papel-form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

    draw();
  }

  /* --------------------------------------------------------------- form -- */
  var enquiry = document.getElementById('commission-form');
  if (enquiry) {
    var status = document.getElementById('form-status');
    var fields = [
      { id: 'name', test: function (v) { return v.trim().length >= 2; }, msg: 'A name to reply to, please.' },
      { id: 'email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email looks incomplete.' },
      { id: 'kind', test: function (v) { return v !== ''; }, msg: 'Choose the kind of banner.' },
      { id: 'date', test: function (v) { return v !== ''; }, msg: 'The date the banner is needed.' },
      { id: 'message', test: function (v) { return v.trim().length >= 12; }, msg: 'A line about the place and the occasion is enough.' }
    ];

    function setErr(id, msg) {
      var e = document.getElementById('err-' + id);
      if (e) e.textContent = msg;
      var input = document.getElementById(id);
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    fields.forEach(function (fd) {
      var input = document.getElementById(fd.id);
      if (input) {
        input.addEventListener('input', function () { setErr(fd.id, ''); });
        input.addEventListener('change', function () { setErr(fd.id, ''); });
      }
    });

    enquiry.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      fields.forEach(function (fd) {
        var input = document.getElementById(fd.id);
        if (!input) return;
        var ok = fd.test(input.value);
        setErr(fd.id, ok ? '' : fd.msg);
        if (!ok && !bad) bad = input;
      });
      if (bad) {
        if (status) status.textContent = 'The taller still needs: ' + fields.filter(function (fd) {
          var i = document.getElementById(fd.id);
          return i && !fd.test(i.value);
        }).map(function (fd) { return fd.id; }).join(', ') + '.';
        bad.focus();
        return;
      }
      var get = function (id) { var e2 = document.getElementById(id); return e2 ? e2.value : ''; };
      var subject = 'Banner commission — ' + get('kind') + ' — ' + get('name');
      var body = 'Name: ' + get('name') +
        '\nEmail: ' + get('email') +
        '\nKind: ' + get('kind') +
        '\nNeeded by: ' + get('date') +
        '\nPlace and size: ' + get('place') +
        '\n\n' + get('message');
      var link = document.getElementById('mail-link');
      if (link) {
        link.href = 'mailto:hola@tallertolentino.mx?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        link.hidden = false;
      }
      if (status) status.textContent = 'Checked. Open the message in your mail app to send it. The taller answers within two days, and in October within one.';
    });
  }
})();
