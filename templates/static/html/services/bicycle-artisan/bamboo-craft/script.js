/* Cane & Lug — parametric frame drawing, discipline switcher, fit form. */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  var GEO = {
    road: { ha: 73.0, sa: 73.5, cs: 420, bb: 60, reach: 393, stack: 585, wb: 990, tyre: 28, wheel: 336, stl: 560, htl: 160, atc: 368, test: 2.4 },
    gravel: { ha: 71.5, sa: 72.5, cs: 430, bb: 70, reach: 385, stack: 600, wb: 1020, tyre: 50, wheel: 350, stl: 550, htl: 170, atc: 380, test: 2.4 },
    track: { ha: 74.0, sa: 74.0, cs: 380, bb: 55, reach: 400, stack: 560, wb: 960, tyre: 23, wheel: 336, stl: 540, htl: 130, atc: 360, test: 2.2 },
    tour: { ha: 71.0, sa: 72.0, cs: 445, bb: 72, reach: 375, stack: 615, wb: 1050, tyre: 40, wheel: 350, stl: 545, htl: 185, atc: 390, test: 2.7 },
    rando: { ha: 73.0, sa: 73.0, cs: 415, bb: 65, reach: 390, stack: 590, wb: 995, tyre: 32, wheel: 336, stl: 530, htl: 155, atc: 372, test: 2.3 }
  };

  var S = 0.3;            // px per mm
  var RAX = 110, AXY = 250;

  function geom(g) {
    var ra = { x: RAX, y: AXY };
    var fa = { x: RAX + g.wb * S, y: AXY };
    var bb = { x: ra.x + Math.sqrt(Math.max(0, g.cs * g.cs - g.bb * g.bb)) * S, y: AXY + g.bb * S };
    var sar = g.sa * Math.PI / 180;
    var st = { x: bb.x - Math.cos(sar) * g.stl * S, y: bb.y - Math.sin(sar) * g.stl * S };
    var har = g.ha * Math.PI / 180;
    var hb = { x: fa.x - Math.cos(har) * g.atc * S, y: fa.y - Math.sin(har) * g.atc * S };
    var ht = { x: hb.x - Math.cos(har) * g.htl * S, y: hb.y - Math.sin(har) * g.htl * S };
    return { ra: ra, fa: fa, bb: bb, st: st, hb: hb, ht: ht, r: g.wheel * S };
  }

  function drawFrame(svg, key, opts) {
    opts = opts || {};
    var g = GEO[key];
    var q = geom(g);
    svg.innerHTML = '';
    if (!opts.svgTitle) {
      var t = el('title', {}, svg);
      t.textContent = 'Side elevation of a bamboo ' + key + ' bicycle frame with dimension callouts';
    }

    // ground and axle lines
    el('line', { x1: 20, y1: AXY, x2: 640, y2: AXY, stroke: 'rgba(36,31,26,0.14)', 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);

    // wheels
    [q.ra, q.fa].forEach(function (c) {
      el('circle', { cx: c.x, cy: c.y, r: q.r, fill: 'none', stroke: opts.dark ? 'rgba(242,235,223,0.45)' : '#8c8376', 'stroke-width': 1.4 }, svg);
      el('circle', { cx: c.x, cy: c.y, r: q.r - 5, fill: 'none', stroke: opts.dark ? 'rgba(242,235,223,0.18)' : 'rgba(36,31,26,0.18)', 'stroke-width': 1 }, svg);
      el('circle', { cx: c.x, cy: c.y, r: 5, fill: opts.dark ? '#d9bf94' : '#241f1a' }, svg);
    });

    var caneColor = opts.dark ? '#c99a55' : '#b3813f';
    var lugColor = opts.dark ? '#efe6d7' : '#241f1a';
    var steelColor = opts.dark ? '#8f8779' : '#6f6a60';

    // stays and fork
    el('path', { d: 'M' + q.bb.x + ' ' + q.bb.y + ' L' + q.ra.x + ' ' + q.ra.y, stroke: caneColor, 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, svg);
    el('path', { d: 'M' + q.st.x + ' ' + q.st.y + ' L' + q.ra.x + ' ' + q.ra.y, stroke: caneColor, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, svg);
    el('path', { d: 'M' + q.hb.x + ' ' + q.hb.y + ' L' + q.fa.x + ' ' + q.fa.y, stroke: steelColor, 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, svg);

    // main triangle
    el('path', { d: 'M' + q.bb.x + ' ' + q.bb.y + ' L' + q.st.x + ' ' + q.st.y, stroke: caneColor, 'stroke-width': 11, 'stroke-linecap': 'round', fill: 'none' }, svg);
    el('path', { d: 'M' + q.st.x + ' ' + q.st.y + ' L' + q.ht.x + ' ' + q.ht.y, stroke: caneColor, 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, svg);
    el('path', { d: 'M' + q.bb.x + ' ' + q.bb.y + ' L' + q.hb.x + ' ' + q.hb.y, stroke: caneColor, 'stroke-width': 10, 'stroke-linecap': 'round', fill: 'none' }, svg);
    el('path', { d: 'M' + q.hb.x + ' ' + q.hb.y + ' L' + q.ht.x + ' ' + q.ht.y, stroke: steelColor, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, svg);

    // cane node ticks
    function node(from, to, n) {
      for (var i = 1; i < n; i++) {
        var t = i / n;
        var x = from.x + (to.x - from.x) * t;
        var y = from.y + (to.y - from.y) * t;
        el('circle', { cx: x, cy: y, r: 1.8, fill: opts.dark ? 'rgba(26,23,19,0.55)' : 'rgba(36,31,26,0.4)' }, svg);
      }
    }
    node(q.bb, q.st, 4); node(q.st, q.ht, 5); node(q.bb, q.hb, 4); node(q.bb, q.ra, 3); node(q.st, q.ra, 4);

    // lugs
    [[q.bb, 10], [q.st, 8], [q.ht, 7], [q.hb, 8], [q.ra, 7]].forEach(function (p) {
      el('circle', { cx: p[0].x, cy: p[0].y, r: p[1], fill: lugColor }, svg);
      el('circle', { cx: p[0].x, cy: p[0].y, r: p[1] - 3, fill: 'none', stroke: caneColor, 'stroke-width': 1 }, svg);
    });

    // saddle and bars
    el('path', { d: 'M' + (q.st.x - 16) + ' ' + (q.st.y - 9) + ' l34 -2 l4 4 l-38 2 z', fill: lugColor }, svg);
    el('path', { d: 'M' + q.ht.x + ' ' + q.ht.y + ' l-10 -14 l14 -2', stroke: steelColor, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, svg);
    el('path', { d: 'M' + (q.ht.x - 26) + ' ' + (q.ht.y - 18) + ' q14 -6 24 0', stroke: steelColor, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, svg);

    if (opts.dims !== false) {
      var dimColor = opts.dark ? 'rgba(217,191,148,0.85)' : '#a0432b';
      var labelFill = opts.dark ? '#d9bf94' : '#a0432b';
      // chainstay dimension
      var csY = q.ra.y + q.r + 16;
      el('line', { x1: q.ra.x, y1: csY, x2: q.bb.x, y2: csY, stroke: dimColor, 'stroke-width': 0.9 }, svg);
      el('line', { x1: q.ra.x, y1: csY - 4, x2: q.ra.x, y2: csY + 4, stroke: dimColor, 'stroke-width': 0.9 }, svg);
      el('line', { x1: q.bb.x, y1: csY - 4, x2: q.bb.x, y2: csY + 4, stroke: dimColor, 'stroke-width': 0.9 }, svg);
      var t1 = el('text', { x: q.ra.x + 4, y: csY - 5, fill: labelFill, 'font-family': 'ui-monospace, monospace', 'font-size': 9 }, svg);
      t1.textContent = 'CS ' + g.cs;

      // wheelbase dimension
      var wbY = q.ra.y + q.r + 34;
      el('line', { x1: q.ra.x, y1: wbY, x2: q.fa.x, y2: wbY, stroke: dimColor, 'stroke-width': 0.9 }, svg);
      el('line', { x1: q.ra.x, y1: wbY - 5, x2: q.ra.x, y2: wbY + 5, stroke: dimColor, 'stroke-width': 0.9 }, svg);
      el('line', { x1: q.fa.x, y1: wbY - 5, x2: q.fa.x, y2: wbY + 5, stroke: dimColor, 'stroke-width': 0.9 }, svg);
      var t2 = el('text', { x: (q.ra.x + q.fa.x) / 2 - 32, y: wbY - 6, fill: labelFill, 'font-family': 'ui-monospace, monospace', 'font-size': 9 }, svg);
      t2.textContent = 'WB ' + g.wb;

      // bb drop
      el('line', { x1: q.bb.x - 26, y1: q.bb.y, x2: q.bb.x - 26, y2: AXY, stroke: dimColor, 'stroke-width': 0.8, 'stroke-dasharray': '2 2' }, svg);
      var t3 = el('text', { x: q.bb.x - 68, y: (q.bb.y + AXY) / 2 + 3, fill: labelFill, 'font-family': 'ui-monospace, monospace', 'font-size': 9 }, svg);
      t3.textContent = 'BB ' + g.bb;

      // seat angle arc
      var arcR = 34;
      var saRad = g.sa * Math.PI / 180;
      el('path', {
        d: 'M' + (q.bb.x - arcR) + ' ' + q.bb.y + ' A' + arcR + ' ' + arcR + ' 0 0 0 ' + (q.bb.x - Math.cos(saRad) * arcR) + ' ' + (q.bb.y - Math.sin(saRad) * arcR),
        fill: 'none', stroke: dimColor, 'stroke-width': 0.9
      }, svg);
      var t4 = el('text', { x: q.bb.x + 8, y: q.bb.y + 24, fill: labelFill, 'font-family': 'ui-monospace, monospace', 'font-size': 9 }, svg);
      t4.textContent = g.sa.toFixed(1) + '°';

      // head angle arc
      var hArc = 26;
      var haRad = g.ha * Math.PI / 180;
      el('path', {
        d: 'M' + (q.hb.x - hArc) + ' ' + q.hb.y + ' A' + hArc + ' ' + hArc + ' 0 0 0 ' + (q.hb.x - Math.cos(haRad) * hArc) + ' ' + (q.hb.y - Math.sin(haRad) * hArc),
        fill: 'none', stroke: dimColor, 'stroke-width': 0.9
      }, svg);
      var t5 = el('text', { x: q.hb.x + 6, y: q.hb.y - 8, fill: labelFill, 'font-family': 'ui-monospace, monospace', 'font-size': 9 }, svg);
      t5.textContent = g.ha.toFixed(1) + '°';

      // tyre clearance
      var t6 = el('text', { x: q.fa.x - 40, y: q.fa.y + q.r + 16, fill: opts.dark ? 'rgba(239,230,215,0.6)' : '#857b6c', 'font-family': 'ui-monospace, monospace', 'font-size': 9 }, svg);
      t6.textContent = 'TYRE ' + g.tyre + ' mm';
    }
  }

  var heroFrame = document.getElementById('heroFrame');
  if (heroFrame) drawFrame(heroFrame, 'gravel', { dims: true });

  document.querySelectorAll('[data-geo]').forEach(function (svg) {
    var key = svg.getAttribute('data-geo');
    if (GEO[key]) drawFrame(svg, key, { dims: true });
  });

  var geoSvg = document.getElementById('geoSvg');
  if (geoSvg) {
    var specs = document.getElementById('geoSpecs');
    var draw = document.getElementById('geoDraw');
    var current = 'gravel';

    function paint(key) {
      current = key;
      drawFrame(geoSvg, key, { dims: true, dark: true });
      var g = GEO[key];
      var vals = {
        ha: g.ha.toFixed(1) + '°',
        sa: g.sa.toFixed(1) + '°',
        cs: g.cs + ' mm',
        bb: g.bb + ' mm',
        reach: g.reach + ' mm',
        stack: g.stack + ' mm',
        wb: g.wb + ' mm',
        tyre: g.tyre + ' mm'
      };
      for (var k in vals) {
        var cell = specs.querySelector('[data-k="' + k + '"]');
        if (cell) cell.textContent = vals[k];
      }
      document.querySelectorAll('[data-disc]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.disc === key ? 'true' : 'false');
      });
      var built = document.querySelector('.loads .load-row:nth-child(2) b');
      if (built) built.textContent = g.test.toFixed(1) + ' kN';
      var bar = document.querySelector('.loads .load-row:nth-child(2) i');
      if (bar) bar.style.width = Math.round((g.test / 3.5) * 100) + '%';
    }

    document.querySelectorAll('[data-disc]').forEach(function (b) {
      b.addEventListener('click', function () { paint(b.dataset.disc); });
    });
    paint(current);
  }

  /* ---------- rail menu ---------- */
  var toggle = document.getElementById('railToggle');
  var railNav = document.getElementById('railNav');
  if (toggle && railNav) {
    toggle.addEventListener('click', function () {
      var open = railNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    railNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        railNav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  window.addEventListener('load', function () { document.body.classList.add('loaded'); });

  /* ---------- fit form ---------- */
  var form = document.getElementById('fitForm');
  if (form) {
    var status = document.getElementById('fitStatus');
    var checks = [
      { id: 'b-name', test: function (v) { return v.trim().length >= 2; } },
      { id: 'b-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { id: 'b-height', test: function (v) { var n = parseFloat(v); return n >= 120 && n <= 220; } },
      { id: 'b-inseam', test: function (v) { var n = parseFloat(v); return n >= 55 && n <= 110; } }
    ];
    function check(c) {
      var input = document.getElementById(c.id);
      if (!input) return true;
      var ok = c.test(input.value);
      input.closest('.field').classList.toggle('invalid', !ok);
      return ok;
    }
    checks.forEach(function (c) {
      var input = document.getElementById(c.id);
      if (input) input.addEventListener('blur', function () { check(c); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!checks.every(check)) {
        var bad = form.querySelector('.field.invalid input');
        if (bad) bad.focus();
        return;
      }
      status.className = 'form-status show';
      status.innerHTML = '<strong>Measurements received.</strong> You will get a drawing and a lead-time date within three working days. If the numbers suggest a stock frame would fit you better, we will say so rather than take the order.';
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sent to the bench';
    });
  }
})();
