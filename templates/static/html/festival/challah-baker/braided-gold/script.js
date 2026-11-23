/* Braided Gold — bench, braid drawing, navigation and order form.
   No libraries, no audio. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- navigation ---------- */
  var rail = document.querySelector('.rail');
  var navBtn = document.getElementById('navBtn');
  if (navBtn && rail) {
    navBtn.addEventListener('click', function () {
      var open = rail.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      navBtn.textContent = open ? 'Close' : 'Menu';
    });
    rail.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        rail.classList.remove('nav-open');
        navBtn.setAttribute('aria-expanded', 'false');
        navBtn.textContent = 'Menu';
      });
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- braid bench ---------- */
  var form = document.getElementById('braidForm');
  if (form) {
    var flour = document.getElementById('flour');
    var hydration = document.getElementById('hydration');
    var shape = document.getElementById('shape');
    var flourOut = document.getElementById('flourOut');
    var hydrationOut = document.getElementById('hydrationOut');
    var segBtns = Array.prototype.slice.call(document.querySelectorAll('.seg-btn'));
    var strands = 6;
    var stageGroup = document.getElementById('braidGroup');
    var stageTitle = document.getElementById('stageTitle');
    var stageScale = document.getElementById('stageScale');
    var stageNote = document.getElementById('stageNote');
    var scheduleEl = document.getElementById('schedule');
    var verdictEl = document.getElementById('verdict');

    var SVGNS = 'http://www.w3.org/2000/svg';
    var CRUST = ['#c58f3e', '#b07a2c', '#d3a252', '#a26c24', '#c9984a', '#94601f'];

    function el(name, attrs) {
      var n = document.createElementNS(SVGNS, name);
      for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
      return n;
    }

    function straightPath(n, s, amp, lambda) {
      var x0 = 46, x1 = 594, step = 6;
      var phase = (2 * Math.PI * s) / n;
      var d = '';
      for (var x = x0; x <= x1; x += step) {
        var y = 150 + amp * Math.sin((2 * Math.PI * (x - x0)) / lambda + phase);
        d += (x === x0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      return d;
    }

    function coilPath(turns, rMax, cx, cy, wobble, phase) {
      var pts = [];
      var steps = 220;
      for (var i = 0; i <= steps; i++) {
        var t = i / steps;
        var ang = t * turns * 2 * Math.PI + phase;
        var r = 12 + t * (rMax - 12) + wobble * Math.sin(ang * 3);
        pts.push((cx + r * Math.cos(ang)).toFixed(1) + ' ' + (cy + r * Math.sin(ang)).toFixed(1));
      }
      return 'M' + pts.join(' L');
    }

    function drawStraight(n) {
      stageGroup.textContent = '';
      /* board */
      stageGroup.appendChild(el('rect', { x: 22, y: 168, width: 596, height: 74, rx: 3, fill: '#2a1d12', stroke: '#4a3320', 'stroke-width': 1 }));
      stageGroup.appendChild(el('path', { d: 'M22 168 H618', stroke: '#5d4227', 'stroke-width': 1.2 }));
      var i;
      for (i = 0; i < n; i++) {
        stageGroup.appendChild(el('path', {
          d: straightPath(n, i, 30, 152), fill: 'none', stroke: CRUST[i % CRUST.length],
          'stroke-width': 26, 'stroke-linecap': 'round', opacity: 0.96
        }));
      }
      /* highlight ridge on each strand, offset draw for weave */
      for (i = 0; i < n; i++) {
        stageGroup.appendChild(el('path', {
          d: straightPath(n, i, 30, 152), fill: 'none', stroke: '#f2d29b',
          'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.22
        }));
      }
      /* seed scatter */
      for (i = 0; i < 26; i++) {
        var sx = 70 + (i * 71) % 500;
        var sy = 128 + ((i * 53) % 46);
        stageGroup.appendChild(el('ellipse', {
          cx: sx, cy: sy, rx: 2.6, ry: 1.4, fill: '#f4dcab',
          opacity: 0.5, transform: 'rotate(' + ((i * 37) % 60 - 30) + ' ' + sx + ' ' + sy + ')'
        }));
      }
      stageGroup.appendChild(el('text', { x: 22, y: 276, fill: '#cbb392', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, 'letter-spacing': '0.08em' }));
      stageGroup.lastChild.textContent = 'STRANDS · ' + n;
      stageGroup.appendChild(el('text', { x: 618, y: 276, 'text-anchor': 'end', fill: '#cbb392', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, 'letter-spacing': '0.08em' }));
      stageGroup.lastChild.textContent = 'WORK SURFACE 60 CM';
      stageGroup.appendChild(el('path', { d: 'M46 252 H594', stroke: '#cbb392', 'stroke-width': 1, opacity: 0.35 }));
      for (i = 0; i <= 10; i++) {
        var tx = 46 + i * 54.8;
        stageGroup.appendChild(el('path', { d: 'M' + tx + ' 252 v' + (i % 5 === 0 ? 9 : 5), stroke: '#cbb392', 'stroke-width': 1, opacity: 0.45 }));
      }
    }

    function drawCoil(kind) {
      stageGroup.textContent = '';
      stageGroup.appendChild(el('rect', { x: 22, y: 168, width: 596, height: 74, rx: 3, fill: '#2a1d12', stroke: '#4a3320', 'stroke-width': 1 }));
      stageGroup.appendChild(el('circle', { cx: 320, cy: 148, r: 96, fill: 'none', stroke: '#4a3320', 'stroke-width': 1, 'stroke-dasharray': '2 5' }));
      var turns = kind === 'round' ? 4.6 : 3.4;
      for (var ring = 0; ring < 2; ring++) {
        stageGroup.appendChild(el('path', {
          d: coilPath(turns, 92 - ring * 5, 320, 148, 2.5, ring * 2.4),
          fill: 'none', stroke: CRUST[ring + 1], 'stroke-width': 24 - ring * 6, 'stroke-linecap': 'round', opacity: 0.95
        }));
      }
      stageGroup.appendChild(el('path', {
        d: coilPath(turns, 92, 320, 148, 2.5, 0), fill: 'none', stroke: '#f2d29b',
        'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.22
      }));
      if (kind === 'turban') {
        stageGroup.appendChild(el('path', { d: 'M320 52 C352 52 376 74 376 104 C376 128 360 146 338 152', fill: 'none', stroke: CRUST[0], 'stroke-width': 22, 'stroke-linecap': 'round' }));
        stageGroup.appendChild(el('circle', { cx: 320, cy: 64, r: 15, fill: '#a26c24', stroke: '#f2d29b', 'stroke-width': 1, opacity: 0.9 }));
      }
      stageGroup.appendChild(el('text', { x: 22, y: 276, fill: '#cbb392', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, 'letter-spacing': '0.08em' }));
      stageGroup.lastChild.textContent = kind === 'round' ? 'COILED RING · ROSH HASHANAH' : 'SPIRAL · TURBAN';
      stageGroup.appendChild(el('text', { x: 618, y: 276, 'text-anchor': 'end', fill: '#cbb392', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, 'letter-spacing': '0.08em' }));
      stageGroup.lastChild.textContent = 'WORK SURFACE 60 CM';
    }

    function fmt(n) { return n.toLocaleString('en-CA'); }

    function compute() {
      var F = Number(flour.value);
      var H = Number(hydration.value);
      var dough = F * (1 + H / 100 + 0.226);
      var loaves = Math.max(1, Math.round(dough / 1150));
      var perLoaf = dough / loaves;
      var strandG = perLoaf / strands;
      var factor = shape.value === 'straight' ? 1 : (shape.value === 'round' ? 0.92 : 1.16);
      var strandCm = (strandG / 3.7) * factor;
      var bake = Math.round(18 + perLoaf * 0.011 + (shape.value === 'straight' ? 0 : 7));
      var baked;
      if (shape.value === 'straight') baked = Math.round(strandCm * 0.72) + ' cm';
      else if (shape.value === 'round') baked = 'Ø ' + Math.round(strandCm / Math.PI * 1.55) + ' cm';
      else baked = 'Ø ' + Math.round(strandCm / Math.PI * 1.15) + ' cm';

      document.getElementById('outDough').textContent = fmt(Math.round(dough)) + ' g';
      document.getElementById('outLoaves').textContent = String(loaves);
      document.getElementById('outStrand').textContent = fmt(Math.round(strandG)) + ' g';
      document.getElementById('outLength').textContent = Math.round(strandCm) + ' cm';
      document.getElementById('outLoaf').textContent = baked;
      document.getElementById('outBake').textContent = bake + ' min';

      flourOut.textContent = fmt(F) + ' g';
      hydrationOut.textContent = H + '%';

      var shapeName = shape.value === 'straight' ? 'Straight braid' : (shape.value === 'round' ? 'Round' : 'Turban');
      stageTitle.textContent = shapeName + ' · ' + strands + ' strand' + (strands > 1 ? 's' : '');

      stageNote.textContent = shape.value === 'straight'
        ? 'Each strand is ' + Math.round(strandCm) + ' cm before braiding. The loaf lands at about ' + Math.round(strandCm * 0.72) + ' cm, which fits a half-sheet pan with room at both ends.'
        : shape.value === 'round'
          ? 'A ' + Math.round(strandCm) + ' cm strand coils into a ring of about ' + Math.round(strandCm / Math.PI * 1.55) + ' cm across. Leave the centre open: it is a crown, not a bun.'
          : 'A ' + Math.round(strandCm) + ' cm strand winds three and a half turns into a turban, with the knot set slightly off-centre so the top leans.';

      scheduleEl.textContent = '';
      var steps = [
        ['20:30', 'Mix ' + fmt(F) + ' g flour, ' + Math.round(F * H / 100) + ' g water, eggs and oil. Rest 20 min.'],
        ['20:50', 'Add salt and yeast, knead 8 min until the window holds.'],
        ['21:00', 'Bulk 90 min at 22 °C, folding at 30 and 60.'],
        ['22:30', 'Divide into ' + loaves + ' loaf' + (loaves > 1 ? 'es' : '') + ' of ' + fmt(Math.round(perLoaf)) + ' g, then ' + strands + ' strands of ' + fmt(Math.round(strandG)) + ' g. Chill overnight.'],
        ['06:00', 'Braid cold: ' + Math.round(strandCm) + ' cm per strand.'],
        ['06:20', 'Final proof 70 min at 22 °C, covered.'],
        ['07:30', 'Egg wash twice, ten minutes apart. Sesame or poppy.'],
        ['07:35', 'Bake ' + bake + ' min at 190 °C on stone, steam the first 4 min.'],
        ['08:10', 'Cool 40 min before the first slice.']
      ];
      steps.forEach(function (s) {
        var li = document.createElement('li');
        var t = document.createElement('span');
        t.textContent = s[0];
        li.appendChild(t);
        li.appendChild(document.createTextNode(s[1]));
        scheduleEl.appendChild(li);
      });

      var v;
      if (H < 56) v = 'A ' + H + '% dough is tight. The braid will hold a hard edge and the crumb will be close, closer to a weekday loaf. Add two points of water if you want it softer.';
      else if (H > 65) v = 'At ' + H + '% the dough is slack. Braid it cold and give it twenty extra minutes in the fridge, or the crossings will spread in the proof.';
      else v = 'A ' + H + '% dough ' + (dough > 2500 ? 'at this size ' : '') + 'holds a ' + strands + '-strand braid without flattening at the crossings. Mix at 20:30, retard overnight at 4 °C, braid cold at 06:00 and bake at 07:30.';

      if (shape.value === 'round') v += ' For Rosh Hashanah the ring is coiled, not braided, and the bake runs seven minutes longer.';
      if (shape.value === 'turban') v += ' The turban winds from the outside in; the knot goes on last so the dome rises under it.';
      verdictEl.textContent = v;

      if (shape.value === 'straight') drawStraight(strands);
      else drawCoil(shape.value);
    }

    segBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        strands = Number(b.getAttribute('data-strands'));
        segBtns.forEach(function (o) {
          var on = o === b;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        compute();
      });
    });

    flour.addEventListener('input', compute);
    hydration.addEventListener('input', compute);
    shape.addEventListener('change', compute);
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    form.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-preset');
        if (p === 'shabbat') { flour.value = 650; hydration.value = 60; shape.value = 'straight'; strands = 6; }
        if (p === 'newyear') { flour.value = 650; hydration.value = 58; shape.value = 'round'; strands = 5; }
        if (p === 'small') { flour.value = 400; hydration.value = 60; shape.value = 'straight'; strands = 3; }
        segBtns.forEach(function (o) {
          var on = Number(o.getAttribute('data-strands')) === strands;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        compute();
      });
    });

    compute();
    if (!reduced) {
      /* one entrance for the diagram, nothing looping */
      stageGroup.style.opacity = '0';
      requestAnimationFrame(function () {
        stageGroup.style.transition = 'opacity 600ms ease';
        stageGroup.style.opacity = '1';
      });
    }
  }

  /* ---------- projects filter ---------- */
  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var filters = filterBar.querySelectorAll('.filter');
    var loaves = document.querySelectorAll('.loaf');
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var key = btn.getAttribute('data-filter');
      filters.forEach(function (f) {
        var on = f === btn;
        f.classList.toggle('is-on', on);
        f.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      loaves.forEach(function (l) {
        l.hidden = key !== 'all' && l.getAttribute('data-kind') !== key;
      });
      var count = document.getElementById('loafCount');
      if (count) {
        var shown = 0;
        loaves.forEach(function (l) { if (!l.hidden) shown++; });
        count.textContent = shown + (shown === 1 ? ' loaf' : ' loaves');
      }
    });
  }

  /* ---------- order form ---------- */
  var order = document.getElementById('orderForm');
  if (order) {
    var note = document.getElementById('formNote');
    var show = function (id, msg) {
      var node = document.getElementById(id);
      if (node) node.textContent = msg || '';
    };
    order.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var date = document.getElementById('pickup');
      var qty = document.getElementById('qty');
      var msg = document.getElementById('message');
      var consent = document.getElementById('consent');
      var ok = true;

      show('errName', ''); show('errEmail', ''); show('errPickup', ''); show('errQty', ''); show('errMessage', ''); show('errConsent', '');
      if (!name.value.trim() || name.value.trim().length < 2) { show('errName', 'A name for the order, please.'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { show('errEmail', 'That address will not receive a reply.'); ok = false; }
      if (!date.value) { show('errPickup', 'Pick a Friday you can collect.'); ok = false; }
      var n = Number(qty.value);
      if (!qty.value || isNaN(n) || n < 1 || n > 60) { show('errQty', 'Between 1 and 60 loaves.'); ok = false; }
      if (msg.value.trim().length < 12) { show('errMessage', 'Tell me the shape, seeds and any allergies.'); ok = false; }
      if (!consent.checked) { show('errConsent', 'Please tick the box so I may reply.'); ok = false; }

      if (!ok) {
        if (note) note.hidden = true;
        var first = order.querySelector('.err:not(:empty)');
        if (first) first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
      if (note) {
        note.hidden = false;
        note.textContent = 'Order noted for ' + name.value.trim().split(' ')[0] + '. I reply within one bake day, usually Thursday morning, to confirm the pickup window and the total. Nothing is charged until you confirm.';
      }
      order.reset();
    });
  }
})();
