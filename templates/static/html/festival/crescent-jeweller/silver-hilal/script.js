/* Silver Hilal — commission bench, ring elevation, navigation, commission form.
   No libraries, no audio. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bar = document.querySelector('.bar');
  var navBtn = document.getElementById('navBtn');
  if (bar && navBtn) {
    navBtn.addEventListener('click', function () {
      var open = bar.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      navBtn.textContent = open ? 'Close' : 'Menu';
    });
    bar.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        bar.classList.remove('nav-open');
        navBtn.setAttribute('aria-expanded', 'false');
        navBtn.textContent = 'Menu';
      });
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- commission bench ---------- */
  var form = document.getElementById('ringForm');
  if (form) {
    var ringSize = document.getElementById('ringSize');
    var band = document.getElementById('band');
    var arc = document.getElementById('arc');
    var metalSel = document.getElementById('metal');
    var stoneSel = document.getElementById('stone');
    var engrave = document.getElementById('engrave');
    var group = document.getElementById('ringGroup');
    var SVGNS = 'http://www.w3.org/2000/svg';

    var METAL = {
      silver: { label: 'silver 925', density: 10.49, rate: 1.3, hallmark: '925 · YK' },
      gold: { label: '18k white gold', density: 15.6, rate: 45, hallmark: '750 · YK' },
      platinum: { label: '950 platinum', density: 21.45, rate: 32, hallmark: '950 · YK' }
    };
    var STONE = { none: { label: 'no stone', cost: 0, hours: 0 }, moonstone: { label: 'moonstone', cost: 40, hours: 2 }, diamond: { label: 'brilliant', cost: 380, hours: 3.5 }, onyx: { label: 'black onyx', cost: 25, hours: 1.8 } };

    function el(name, attrs) {
      var n = document.createElementNS(SVGNS, name);
      for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
      return n;
    }

    function polar(cx, cy, r, deg) {
      var a = (deg * Math.PI) / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }

    function draw(size, bandMm, arcDeg, metal, stone, eng) {
      group.textContent = '';
      var cx = 300, cy = 205, R = 96;
      var w = Math.max(8, bandMm * 3.4);
      var ink = '#c8cfd2';
      var dim = '#6e7c80';

      /* grid */
      var g = el('g', { stroke: '#2a363b', 'stroke-width': 0.7 });
      g.appendChild(el('path', { d: 'M20 ' + cy + ' H580' }));
      g.appendChild(el('path', { d: 'M' + cx + ' 20 V400' }));
      group.appendChild(g);
      group.appendChild(el('circle', { cx: cx, cy: cy, r: R + 42, fill: 'none', stroke: '#2a363b', 'stroke-width': 0.7, 'stroke-dasharray': '2 6' }));

      /* band */
      group.appendChild(el('circle', { cx: cx, cy: cy, r: R, fill: 'none', stroke: ink, 'stroke-width': w }));
      group.appendChild(el('circle', { cx: cx, cy: cy, r: R, fill: 'none', stroke: '#eef1ef', 'stroke-width': 1, opacity: 0.3, 'stroke-dasharray': '22 14' }));
      group.appendChild(el('circle', { cx: cx, cy: cy, r: R, fill: 'none', stroke: '#0e1418', 'stroke-width': 1.2, opacity: 0.35 }));

      /* crescent crest, an annular sector centred on the top */
      var half = arcDeg / 2;
      var a0 = -90 - half, a1 = -90 + half;
      var ro = R + w / 2 + Math.min(20, w * 0.55), ri = R - w / 2 + 2;
      var p1 = polar(cx, cy, ro, a0), p2 = polar(cx, cy, ro, a1);
      var p3 = polar(cx, cy, ri, a1), p4 = polar(cx, cy, ri, a0);
      var large = arcDeg > 180 ? 1 : 0;
      var d = 'M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) +
        ' A' + ro + ' ' + ro + ' 0 ' + large + ' 1 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) +
        ' L' + p3[0].toFixed(1) + ' ' + p3[1].toFixed(1) +
        ' A' + ri + ' ' + ri + ' 0 ' + large + ' 0 ' + p4[0].toFixed(1) + ' ' + p4[1].toFixed(1) + ' Z';
      group.appendChild(el('path', { d: d, fill: ink, stroke: '#eef1ef', 'stroke-width': 1 }));
      group.appendChild(el('path', { d: d, fill: 'none', stroke: '#0e1418', 'stroke-width': 1, opacity: 0.35, transform: 'translate(0 2)' }));
      group.appendChild(el('path', {
        d: 'M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' A' + ro + ' ' + ro + ' 0 ' + large + ' 1 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1),
        fill: 'none', stroke: '#0e1418', 'stroke-width': 1, opacity: 0.3
      }));

      /* stone at the leading horn */
      if (stone !== 'none') {
        var sp = polar(cx, cy, R, a0);
        group.appendChild(el('circle', { cx: sp[0], cy: sp[1], r: 7, fill: stone === 'onyx' ? '#1b2426' : '#e8efec', stroke: '#8d999d', 'stroke-width': 1 }));
        if (stone !== 'onyx') group.appendChild(el('circle', { cx: sp[0] - 2, cy: sp[1] - 2, r: 2.2, fill: '#ffffff', opacity: 0.85 }));
      }

      /* dimensions: inner diameter */
      var yDim = cy + R + 46;
      group.appendChild(el('path', { d: 'M' + (cx - R) + ' ' + yDim + ' H' + (cx + R), stroke: dim, 'stroke-width': 0.9 }));
      group.appendChild(el('path', { d: 'M' + (cx - R) + ' ' + (yDim - 6) + ' v12 M' + (cx + R) + ' ' + (yDim - 6) + ' v12', stroke: dim, 'stroke-width': 0.9 }));
      var t1 = el('text', { x: cx, y: yDim + 18, 'text-anchor': 'middle', fill: '#8d999d', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, 'letter-spacing': '0.08em' });
      t1.textContent = 'INNER Ø ' + (size / Math.PI).toFixed(1) + ' MM · SIZE ' + size;
      group.appendChild(t1);

      /* arc label */
      var at = el('text', { x: cx, y: cy - R - 34, 'text-anchor': 'middle', fill: '#8d999d', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, 'letter-spacing': '0.08em' });
      at.textContent = 'HILAL ' + arcDeg + '°';
      group.appendChild(at);

      /* band width callout */
      var bx = cx + R + w / 2 + 22;
      group.appendChild(el('path', { d: 'M' + bx + ' ' + (cy - w / 2) + ' v' + w, stroke: dim, 'stroke-width': 0.9 }));
      group.appendChild(el('path', { d: 'M' + (bx - 4) + ' ' + (cy - w / 2) + ' h8 M' + (bx - 4) + ' ' + (cy + w / 2) + ' h8', stroke: dim, 'stroke-width': 0.9 }));
      var bt = el('text', { x: bx + 10, y: cy + 3, fill: '#8d999d', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 9 });
      bt.textContent = bandMm + ' MM';
      group.appendChild(bt);

      /* engraving mark inside */
      var en = el('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', fill: '#6e7c80', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 9, 'letter-spacing': '0.1em' });
      en.textContent = eng > 0 ? 'INSIDE · ' + eng + ' CH' : 'NO ENGRAVING';
      group.appendChild(en);

      var foot = el('text', { x: 24, y: 420, fill: '#6e7c80', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 9, 'letter-spacing': '0.08em' });
      foot.textContent = 'ELEVATION · ' + METAL[metal].label.toUpperCase() + ' · ' + STONE[stone].label.toUpperCase();
      group.appendChild(foot);
      var foot2 = el('text', { x: 576, y: 420, 'text-anchor': 'end', fill: '#6e7c80', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 9 });
      foot2.textContent = 'YK · 1:1';
      group.appendChild(foot2);
    }

    function compute() {
      var size = Number(ringSize.value);
      var bandMm = Number(band.value);
      var arcDeg = Number(arc.value);
      var metal = metalSel.value;
      var stone = stoneSel.value;
      var eng = Number(engrave.value);
      var M = METAL[metal];

      var t = 1.4, plate = 1.2;
      var D = size / Math.PI;
      var bandVol = Math.PI * (Math.pow(D / 2 + t, 2) - Math.pow(D / 2, 2)) * bandMm; /* mm3 */
      var crestVol = Math.PI * (Math.pow(D / 2 + plate, 2) - Math.pow(D / 2, 2)) * (bandMm + 2) * (arcDeg / 360) * 0.85;
      var grams = (bandVol + crestVol) / 1000 * M.density;

      var hours = 7 + bandMm / 4 + arcDeg / 180 + STONE[stone].hours + eng * 0.08;
      var price = Math.round((grams * M.rate + hours * 50 + STONE[stone].cost + 20) / 10) * 10;

      ringSizeOut.textContent = size + ' · ' + (size / Math.PI).toFixed(1) + ' mm';
      bandOut.textContent = bandMm + ' mm';
      arcOut.textContent = arcDeg + '°';
      engraveOut.textContent = eng + (eng === 1 ? ' character' : ' characters');

      document.getElementById('outMetal').textContent = grams.toFixed(1) + ' g';
      document.getElementById('outHours').textContent = Math.round(hours) + '';
      document.getElementById('outPrice').textContent = '€' + price.toLocaleString('en-GB');
      document.getElementById('outHall').textContent = M.hallmark;

      document.getElementById('stageTitle').textContent = (arcDeg > 260 ? 'Eclipse' : 'Hilal') + ' · ' + arcDeg + '° · ' + M.label;
      document.getElementById('stageSize').textContent = 'Ø ' + D.toFixed(1) + ' mm';

      var v;
      if (bandMm < 3) v = 'A ' + bandMm + ' mm band is a sliver. With a crest on top it will twist on the finger and the crest will wear at the join; I would not make it in silver under 3 mm.';
      else if (arcDeg > 270) v = 'At ' + arcDeg + '° the crescent almost closes. It is the most beautiful thing in the catalogue and the hardest to set: the stone sits in a gap held only by the two horns, so it must be a cabochon, not a brilliant.';
      else if (arcDeg < 100) v = 'A ' + arcDeg + '° arc is a horn rather than a moon. On a ' + bandMm + ' mm band it reads as a raised shoulder; on a wide band it disappears.';
      else v = 'A ' + bandMm + ' mm band with a ' + arcDeg + '° crest is a balanced ring: enough silver to wear every day, enough crescent to read across a table. The silver is ' + grams.toFixed(1) + ' g and the crest is cut from the same plate as the band, so there is no solder line at the horn.';
      if (metal === 'gold') v += ' In 18k white gold the same ring is ' + grams.toFixed(1) + ' g and takes six weeks; the crest is cast, not cut, because the alloy is harder to saw.';
      if (metal === 'platinum') v += ' Platinum is denser and heavier in the hand; the same dimensions come out at ' + grams.toFixed(1) + ' g. It will not tarnish and it will not stay polished the way silver does.';
      if (stone !== 'none') v += ' The ' + STONE[stone].label + ' is set at the leading horn with four beads, not a bezel, so the light can enter from the side.';
      verdict.textContent = v;

      var checks = document.getElementById('checks');
      checks.textContent = '';
      [
        'Band wall 1.4 mm — ' + (bandMm >= 4 ? 'enough for daily wear' : 'thin; treat it as a dress ring'),
        'Crest plate 1.2 mm — ' + (arcDeg > 240 ? 'the closing horns need a thicker plate' : 'supports the stone without a bezel cup'),
        'Assay and hallmark included' + (eng > 0 ? ' · ' + eng + ' characters engraved inside' : '')
      ].forEach(function (s) {
        var li = document.createElement('li');
        li.textContent = s;
        checks.appendChild(li);
      });

      document.getElementById('caution').textContent = 'Allow ' + (metal === 'silver' ? 'three' : 'six') + ' weeks. Sizing after the fact is possible within one size; past that the crest has to be reset. ' + (arcDeg > 260 ? 'Eclipse settings are made to order and are not returnable once the stone is set.' : 'A drawing is sent before any metal is cut.');

      draw(size, bandMm, arcDeg, metal, stone, eng);
    }

    var ringSizeOut = document.getElementById('ringSizeOut');
    var bandOut = document.getElementById('bandOut');
    var arcOut = document.getElementById('arcOut');
    var engraveOut = document.getElementById('engraveOut');
    var verdict = document.getElementById('verdict');

    [ringSize, band, arc, engrave].forEach(function (r) { r.addEventListener('input', compute); });
    [metalSel, stoneSel].forEach(function (s) { s.addEventListener('change', compute); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    form.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-preset');
        if (p === 'hilal') { ringSize.value = 60; band.value = 6; arc.value = 180; metalSel.value = 'silver'; stoneSel.value = 'moonstone'; engrave.value = 8; }
        if (p === 'sliver') { ringSize.value = 54; band.value = 2.5; arc.value = 120; metalSel.value = 'silver'; stoneSel.value = 'none'; engrave.value = 0; }
        if (p === 'eclipse') { ringSize.value = 62; band.value = 8; arc.value = 300; metalSel.value = 'silver'; stoneSel.value = 'onyx'; engrave.value = 12; }
        compute();
      });
    });

    compute();
    if (!reduced) {
      group.style.opacity = '0';
      requestAnimationFrame(function () {
        group.style.transition = 'opacity 600ms ease';
        group.style.opacity = '1';
      });
    }
  }

  /* ---------- catalogue filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var rows = document.querySelectorAll('.cat-row');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var key = btn.getAttribute('data-filter');
      filters.querySelectorAll('.filter').forEach(function (f) {
        var on = f === btn;
        f.classList.toggle('is-on', on);
        f.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      rows.forEach(function (r) { r.hidden = key !== 'all' && r.getAttribute('data-kind') !== key; });
      var count = document.getElementById('catCount');
      if (count) {
        var n = 0;
        rows.forEach(function (r) { if (!r.hidden) n++; });
        count.textContent = n + (n === 1 ? ' piece' : ' pieces');
      }
    });
  }

  /* ---------- commission form ---------- */
  var cf = document.getElementById('commissionForm');
  if (cf) {
    var note = document.getElementById('formNote');
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var piece = document.getElementById('piece');
      var size = document.getElementById('size');
      var when = document.getElementById('when');
      var message = document.getElementById('message');
      var consent = document.getElementById('consent');
      var ok = true;
      function show(id, msg) { var n = document.getElementById(id); if (n) n.textContent = msg || ''; }
      ['errName', 'errEmail', 'errPiece', 'errSize', 'errWhen', 'errMessage', 'errConsent'].forEach(function (id) { show(id, ''); });

      if (!name.value.trim() || name.value.trim().length < 2) { show('errName', 'A name for the commission.'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { show('errEmail', 'That address will not reach the workshop.'); ok = false; }
      if (!piece.value) { show('errPiece', 'Choose a piece, or “something else”.'); ok = false; }
      var s = size.value.trim();
      if (s && !/^\d{2}(\.\d)?$/.test(s)) { show('errSize', 'Ring sizes are 44 to 72; write “unknown” if you do not know.'); ok = false; }
      if (!when.value) { show('errWhen', 'A date helps me place the order with the caster.'); ok = false; }
      if (message.value.trim().length < 12) { show('errMessage', 'Tell me the metal, the stone and the finger.'); ok = false; }
      if (!consent.checked) { show('errConsent', 'Please tick the box so I may reply.'); ok = false; }

      if (!ok) {
        if (note) note.hidden = true;
        var first = cf.querySelector('.err:not(:empty)');
        if (first) first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
      if (note) {
        note.hidden = false;
        note.textContent = 'Noted for ' + name.value.trim().split(' ')[0] + '. I send a drawing within three days, and nothing is cut until you approve it. If the date is tight, say so in the reply and I will tell you honestly whether the caster can hold it.';
      }
      cf.reset();
    });
  }
})();
