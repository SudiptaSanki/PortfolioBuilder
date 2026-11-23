/* Pal Pandal Works — the planner, the menu, the enquiry form. No audio. */

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
      if (e.target.closest('a') && window.innerWidth <= 700) {
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

  /* ------------------------------------------------------------ planner -- */
  var sheet = document.getElementById('elevation');
  if (sheet) {
    var NS = 'http://www.w3.org/2000/svg';
    var inputs = {
      width: document.getElementById('width'),
      height: document.getElementById('height'),
      footfall: document.getElementById('footfall')
    };
    var outs = {
      width: document.getElementById('width-out'),
      height: document.getElementById('height-out'),
      footfall: document.getElementById('footfall-out')
    };
    var q = {
      bamboo: document.getElementById('q-bamboo'),
      cane: document.getElementById('q-cane'),
      cloth: document.getElementById('q-cloth'),
      led: document.getElementById('q-led'),
      shola: document.getElementById('q-shola'),
      bulbs: document.getElementById('q-bulbs'),
      hands: document.getElementById('q-hands'),
      days: document.getElementById('q-days'),
      load: document.getElementById('q-load')
    };
    var capSize = document.getElementById('cap-size');
    var capTheme = document.getElementById('cap-theme');
    var estNote = document.querySelector('.est-note');

    var THEMES = {
      shola: {
        name: 'Bamboo and shola',
        ink: '#e9a227',
        fill: '#f4eddf',
        rate: 1250,
        note: 'Ivory shola panels on a cane frame, lit from inside the arch.'
      },
      terracotta: {
        name: 'Terracotta',
        ink: '#d2703f',
        fill: '#c96a3e',
        rate: 1450,
        note: 'Baked tile panels, stepped temple silhouette, heavy frame.'
      },
      jute: {
        name: 'Jute and mirror',
        ink: '#cbb27a',
        fill: '#d9c396',
        rate: 1180,
        note: 'Woven jute with mirror work, wide and low, best for a long frontage.'
      },
      neon: {
        name: 'Neon LED',
        ink: '#7fd6c4',
        fill: '#7fd6c4',
        rate: 1620,
        note: 'LED strip outline with a dark cloth skin; the light is the decoration.'
      },
      paper: {
        name: 'Paper and cane',
        ink: '#e8bf88',
        fill: '#e8bf88',
        rate: 1080,
        note: 'Layered paper scallops, cheapest to build and quickest to repair in rain.'
      }
    };

    var state = { width: 60, height: 24, footfall: 12000, theme: 'shola' };

    function fmt(n) {
      return Math.round(n).toLocaleString('en-IN');
    }

    function el(tag, attrs) {
      var node = document.createElementNS(NS, tag);
      if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      return node;
    }

    // Top edge of the arch in normalised coordinates: x 0..1, y 0..1 from the top.
    function topCurve(theme, t) {
      var s = Math.sin(Math.PI * t);
      if (theme === 'shola') return 0.58 - 0.50 * Math.pow(s, 0.9);
      if (theme === 'jute') return 0.34 - 0.21 * Math.pow(s, 0.8);
      if (theme === 'neon') return 0.52 - 0.44 * Math.pow(s, 1.3);
      if (theme === 'paper') return 0.36 - 0.17 * s + 0.035 * Math.cos(12 * Math.PI * t);
      // terracotta, stepped
      if (t < 0.10 || t > 0.90) return 0.64;
      if (t < 0.24 || t > 0.76) return 0.40;
      if (t < 0.36 || t > 0.64) return 0.24;
      return 0.17;
    }

    function pathFrom(points) {
      return points.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' ');
    }

    function draw() {
      var th = THEMES[state.theme];
      var W = 720;
      var H = 430;
      var ground = 368;
      var pxPerFt = Math.min(620 / state.width, 296 / state.height, 14);
      var wPx = state.width * pxPerFt;
      var hPx = state.height * pxPerFt;
      var left = (W - wPx) / 2;
      var topY = ground - hPx;
      var cx = W / 2;

      while (sheet.firstChild) sheet.removeChild(sheet.firstChild);
      sheet.setAttribute('aria-label',
        'Elevation of a ' + state.width + ' by ' + Math.round(state.width * 0.65) + ' foot pandal, ' +
        state.height + ' feet high, theme ' + th.name + '.');

      var bg = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#17110d' });
      sheet.appendChild(bg);

      // set-out grid, like a drawing sheet
      var grid = el('g', { stroke: '#3a2c22', 'stroke-width': 0.6 });
      for (var gx = 60; gx < W; gx += 60) grid.appendChild(el('line', { x1: gx, y1: 24, x2: gx, y2: ground }));
      for (var gy = 60; gy < ground; gy += 60) grid.appendChild(el('line', { x1: 24, y1: gy, x2: W - 24, y2: gy }));
      sheet.appendChild(grid);

      // scale bar
      var barFt = 10;
      var barPx = barFt * pxPerFt;
      var bar = el('g', { stroke: '#8a7a68', 'stroke-width': 1 });
      bar.appendChild(el('line', { x1: 40, y1: ground + 26, x2: 40 + barPx, y2: ground + 26 }));
      bar.appendChild(el('line', { x1: 40, y1: ground + 21, x2: 40, y2: ground + 31 }));
      bar.appendChild(el('line', { x1: 40 + barPx, y1: ground + 21, x2: 40 + barPx, y2: ground + 31 }));
      sheet.appendChild(bar);
      var scaleLabel = el('text', { x: 40 + barPx + 10, y: ground + 30, fill: '#8a7a68', 'font-size': 10, 'font-family': 'DM Mono, monospace' });
      scaleLabel.textContent = barFt + ' ft';
      sheet.appendChild(scaleLabel);

      var dimLabel = el('text', { x: W - 44, y: ground + 30, fill: '#8a7a68', 'font-size': 10, 'text-anchor': 'end', 'font-family': 'DM Mono, monospace' });
      dimLabel.textContent = state.width + ' × ' + Math.round(state.width * 0.65) + ' ft plan · ' + state.height + ' ft high';
      sheet.appendChild(dimLabel);

      // frame poles behind the skin
      var poles = Math.max(4, Math.round(state.width / 9));
      var poleG = el('g', { stroke: '#8a6034', 'stroke-width': 2, 'stroke-opacity': 0.55 });
      for (var i = 0; i <= poles; i++) {
        var px = left + (wPx * i) / poles;
        var t = i / poles;
        var py = topY + hPx * topCurve(state.theme, t);
        poleG.appendChild(el('line', { x1: px, y1: ground, x2: px, y2: py + 6 }));
      }
      sheet.appendChild(poleG);

      // braces
      var braces = el('g', { stroke: '#5c3f24', 'stroke-width': 1, 'stroke-opacity': 0.7 });
      [0.45, 0.68, 0.9].forEach(function (f) {
        braces.appendChild(el('line', { x1: left, y1: topY + hPx * f, x2: left + wPx, y2: topY + hPx * f }));
      });
      sheet.appendChild(braces);

      // the top edge and the skin silhouette
      var pts = [];
      for (var k = 0; k <= 48; k++) {
        var tt = k / 48;
        pts.push([left + wPx * tt, topY + hPx * topCurve(state.theme, tt)]);
      }
      var skin = el('path', {
        d: pathFrom([[left, ground]].concat(pts, [[left + wPx, ground]])) + ' Z',
        fill: th.fill,
        'fill-opacity': state.theme === 'neon' ? 0.07 : 0.1
      });
      sheet.appendChild(skin);

      var arch = el('path', {
        d: pathFrom([[left, ground]].concat(pts)),
        fill: 'none',
        stroke: th.ink,
        'stroke-width': 2.6
      });
      sheet.appendChild(arch);

      // interior pattern by theme
      var interior = el('g');
      if (state.theme === 'shola' || state.theme === 'paper') {
        var cols = Math.max(3, Math.round(state.width / 7));
        for (var c = 0; c < cols; c++) {
          var cxp = left + (wPx * (c + 0.5)) / cols;
          var cw = (wPx / cols) * 0.62;
          var ty = topY + hPx * 0.30 + (c % 2 ? 14 : 0);
          var panel = el('path', {
            d: 'M' + (cxp - cw / 2) + ' ' + ty +
               ' L' + (cxp + cw / 2) + ' ' + ty +
               ' L' + (cxp + cw / 2) + ' ' + (ty + hPx * 0.30) +
               ' L' + cxp + ' ' + (ty + hPx * 0.34) +
               ' L' + (cxp - cw / 2) + ' ' + (ty + hPx * 0.30) + ' Z',
            fill: th.fill,
            'fill-opacity': 0.16,
            stroke: th.fill,
            'stroke-opacity': 0.55,
            'stroke-width': 1
          });
          interior.appendChild(panel);
        }
      } else if (state.theme === 'terracotta') {
        var step = Math.max(16, wPx / 16);
        for (var tx = left + 6; tx < left + wPx - 6; tx += step) {
          for (var tyy = topY + 30; tyy < ground - 6; tyy += step) {
            interior.appendChild(el('rect', {
              x: tx, y: tyy, width: step - 4, height: step - 4,
              fill: th.fill, 'fill-opacity': 0.14, stroke: th.fill, 'stroke-opacity': 0.28, 'stroke-width': 0.8
            }));
          }
        }
      } else if (state.theme === 'jute') {
        for (var band = 0; band < 4; band++) {
          interior.appendChild(el('line', {
            x1: left + 8, y1: topY + hPx * (0.32 + band * 0.16),
            x2: left + wPx - 8, y2: topY + hPx * (0.32 + band * 0.16),
            stroke: th.fill, 'stroke-opacity': 0.4, 'stroke-width': 1
          }));
          var mirrors = Math.max(3, Math.round(state.width / 12));
          for (var m = 0; m < mirrors; m++) {
            interior.appendChild(el('circle', {
              cx: left + (wPx * (m + 0.5)) / mirrors,
              cy: topY + hPx * (0.32 + band * 0.16),
              r: 3, fill: '#f4eddf', 'fill-opacity': 0.5
            }));
          }
        }
      } else if (state.theme === 'neon') {
        for (var n = 1; n <= 3; n++) {
          var insetPts = [];
          for (var s2 = 0; s2 <= 36; s2++) {
            var u = s2 / 36;
            insetPts.push([
              left + 10 * n + (wPx - 20 * n) * u,
              topY + hPx * (topCurve(state.theme, u) + 0.05 * n)
            ]);
          }
          interior.appendChild(el('path', {
            d: pathFrom(insetPts), fill: 'none', stroke: th.ink,
            'stroke-opacity': 0.75 - n * 0.16, 'stroke-width': 2
          }));
        }
      }
      sheet.appendChild(interior);

      // doorway, always centred
      var doorW = Math.min(wPx * 0.30, 150);
      var doorH = Math.min(hPx * 0.62, 210);
      var door = el('path', {
        d: 'M' + (cx - doorW / 2) + ' ' + ground +
           ' V' + (ground - doorH + doorW / 2) +
           ' a' + doorW / 2 + ' ' + doorW / 2 + ' 0 0 1 ' + doorW + ' 0' +
           ' V' + ground + ' Z',
        fill: '#0d0a08', stroke: th.ink, 'stroke-width': 1.6
      });
      sheet.appendChild(door);

      var lampY = ground - doorH * 0.52;
      sheet.appendChild(el('line', { x1: cx, y1: ground - doorH + 14, x2: cx, y2: lampY - 16, stroke: th.ink, 'stroke-width': 1 }));
      sheet.appendChild(el('path', {
        d: 'M' + (cx - 15) + ' ' + lampY + ' h30 l-6 14 h-18 Z',
        fill: '#e9a227', 'fill-opacity': 0.9
      }));
      sheet.appendChild(el('ellipse', { cx: cx, cy: lampY + 26, rx: 46, ry: 30, fill: '#e9a227', 'fill-opacity': 0.08 }));

      // bulbs along the arch
      var bulbs = Math.round(Math.min(140, 14 + state.width / 3));
      for (var b = 0; b < bulbs; b++) {
        var bt = (b + 0.5) / bulbs;
        var bx = left + wPx * bt;
        var by = topY + hPx * topCurve(state.theme, bt) - 7;
        sheet.appendChild(el('circle', { cx: bx, cy: by, r: 2.6, fill: '#f6c25c' }));
        sheet.appendChild(el('circle', { cx: bx, cy: by, r: 7, fill: '#f6c25c', 'fill-opacity': 0.1 }));
      }

      // toran under the apex
      var toranCount = Math.max(5, Math.round(wPx / 26));
      for (var to = 0; to < toranCount; to++) {
        var txp = left + wPx * (0.22 + 0.56 * (to / Math.max(1, toranCount - 1)));
        var typ = topY + hPx * topCurve(state.theme, 0.22 + 0.56 * (to / Math.max(1, toranCount - 1))) + 18;
        sheet.appendChild(el('path', {
          d: 'M' + (txp - 7) + ' ' + typ + ' h14 l-7 13 Z',
          fill: '#c4381e', 'fill-opacity': 0.85
        }));
      }

      // crowd density
      var crowd = Math.max(3, Math.min(34, Math.round(state.footfall / 1400)));
      var crowdG = el('g', { fill: '#f4eddf', 'fill-opacity': 0.32 });
      for (var p = 0; p < crowd; p++) {
        var pxp = (W * (p + 0.5)) / crowd;
        var jitter = ((p * 37) % 9) - 4;
        crowdG.appendChild(el('circle', { cx: pxp, cy: ground + 8 + (p % 3) * 5, r: 3.4 + (p % 2) * 0.9 }));
      }
      sheet.appendChild(crowdG);

      sheet.appendChild(el('line', { x1: 0, y1: ground, x2: W, y2: ground, stroke: '#a67c4e', 'stroke-width': 1.4, 'stroke-opacity': 0.8 }));

      var sheetTag = el('text', { x: 40, y: 34, fill: '#8a7a68', 'font-size': 10, 'font-family': 'DM Mono, monospace' });
      sheetTag.textContent = 'PAL PANDAL WORKS · ELEVATION · ' + state.width + ' × ' + state.height + ' FT';
      sheet.appendChild(sheetTag);

      // quantities
      var depth = state.width * 0.65;
      var perim = 2 * (state.width + depth);
      var bamboo = Math.round(perim * 1.6 + state.height * 4);
      var cane = Math.ceil(bamboo / 24);
      var cloth = Math.round(perim * state.height * 0.55);
      var led = Math.round(perim * 1.4 + state.width * 0.8);
      var shola = Math.round(state.width * state.height * 0.8);
      var bulbCount = Math.round(Math.min(1600, state.footfall / 38) + state.width * 2);
      var hands = Math.max(6, Math.ceil((state.width * state.height) / 70));
      var days = Math.max(10, Math.round(10 + (state.width * state.height) / 180 + state.footfall / 6000));
      var load = 3 + (bulbCount * 9 + led * 14) / 1000;

      q.bamboo.textContent = fmt(bamboo);
      q.cane.textContent = fmt(cane);
      q.cloth.textContent = fmt(cloth) + ' sq ft';
      q.led.textContent = fmt(led) + ' m';
      q.shola.textContent = fmt(shola);
      q.bulbs.textContent = fmt(bulbCount);
      q.hands.textContent = fmt(hands);
      q.days.textContent = fmt(days);
      q.load.textContent = load.toFixed(1) + ' kW';

      capSize.textContent = state.width + ' × ' + Math.round(depth) + ' ft plan, ' + state.height + ' ft high';
      capTheme.textContent = th.name;

      var lakh = (state.width * state.height * th.rate) / 100000;
      if (estNote) {
        estNote.textContent = 'Budget guide: ₹' + Math.round(lakh * 0.85) + '–' + Math.round(lakh * 1.15) +
          ' lakh for frame, cloth, light and labour at 2024 Baranagar rates. ' + th.note +
          ' Fire-retardant treatment, the electrical certificate and the idol are quoted separately, because they are not optional.';
      }
    }

    function syncLabels() {
      outs.width.textContent = state.width + ' ft';
      outs.height.textContent = state.height + ' ft';
      outs.footfall.textContent = state.footfall.toLocaleString('en-IN');
    }

    ['width', 'height', 'footfall'].forEach(function (key) {
      inputs[key].addEventListener('input', function () {
        state[key] = parseInt(inputs[key].value, 10);
        syncLabels();
        draw();
      });
    });

    var chips = document.querySelectorAll('[data-theme]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        state.theme = chip.dataset.theme;
        Array.prototype.forEach.call(chips, function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        draw();
      });
    });

    var form = document.getElementById('plan-form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

    syncLabels();
    draw();
  }

  /* --------------------------------------------------------------- form -- */
  var enquiry = document.getElementById('enquiry-form');
  if (enquiry) {
    var status = document.getElementById('form-status');
    var fields = [
      { id: 'committee', test: function (v) { return v.trim().length >= 2; }, msg: 'Which committee is this for?' },
      { id: 'name', test: function (v) { return v.trim().length >= 2; }, msg: 'A name to reply to, please.' },
      { id: 'email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email looks incomplete.' },
      { id: 'size', test: function (v) { return v !== ''; }, msg: 'Even an approximate frontage helps.' },
      { id: 'message', test: function (v) { return v.trim().length >= 12; }, msg: 'A line about the site and the theme is enough.' }
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

    fields.forEach(function (f) {
      var input = document.getElementById(f.id);
      if (input) input.addEventListener('input', function () { setErr(f.id, ''); });
    });

    enquiry.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      fields.forEach(function (f) {
        var input = document.getElementById(f.id);
        if (!input) return;
        var ok = f.test(input.value);
        setErr(f.id, ok ? '' : f.msg);
        if (!ok && !bad) bad = input;
      });
      if (bad) {
        if (status) status.textContent = 'Still needed: ' + fields.filter(function (f) {
          var i = document.getElementById(f.id);
          return i && !f.test(i.value);
        }).map(function (f) { return f.id; }).join(', ') + '.';
        bad.focus();
        return;
      }
      var c = document.getElementById('committee');
      var n = document.getElementById('name');
      var em = document.getElementById('email');
      var size = document.getElementById('size');
      var place = document.getElementById('place');
      var msg = document.getElementById('message');
      var subject = 'Pandal enquiry — ' + (c ? c.value : '');
      var body = 'Committee: ' + (c ? c.value : '') +
        '\nContact: ' + (n ? n.value : '') +
        '\nEmail: ' + (em ? em.value : '') +
        '\nSite: ' + (place ? place.value : '') +
        '\nFrontage / height: ' + (size ? size.value : '') +
        '\n\n' + (msg ? msg.value : '');
      var link = document.getElementById('mail-link');
      if (link) {
        link.href = 'mailto:studio@palpandalworks.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        link.hidden = false;
      }
      if (status) status.textContent = 'Checked. Open the message in your mail app to send it. We reply to committees within three days, and sooner in March.';
    });
  }
})();
