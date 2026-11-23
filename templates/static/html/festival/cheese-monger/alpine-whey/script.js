/* Alpine Whey — affinage bench, wheel cross-section, navigation, visit form.
   No libraries, no audio. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var mast = document.querySelector('.mast');
  var navBtn = document.getElementById('navBtn');
  if (mast && navBtn) {
    navBtn.addEventListener('click', function () {
      var open = mast.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      navBtn.textContent = open ? 'Close' : 'Menu';
    });
    mast.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        mast.classList.remove('nav-open');
        navBtn.setAttribute('aria-expanded', 'false');
        navBtn.textContent = 'Menu';
      });
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- affinage bench ---------- */
  var form = document.getElementById('affineForm');
  if (form) {
    var weight = document.getElementById('weight');
    var milk = document.getElementById('milk');
    var temp = document.getElementById('temp');
    var humidity = document.getElementById('humidity');
    var weeks = document.getElementById('weeks');
    var weightOut = document.getElementById('weightOut');
    var tempOut = document.getElementById('tempOut');
    var humidityOut = document.getElementById('humidityOut');
    var weeksOut = document.getElementById('weeksOut');
    var group = document.getElementById('wheelGroup');
    var tasting = document.getElementById('tasting');
    var verdict = document.getElementById('verdict');
    var caution = document.getElementById('caution');
    var SVGNS = 'http://www.w3.org/2000/svg';

    function el(name, attrs) {
      var n = document.createElementNS(SVGNS, name);
      for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
      return n;
    }

    function num(v) {
      return v >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
    }

    function milkLabel(v) {
      return { cow: 'raw cow, summer pasture', 'cow-hay': 'raw cow, hay-fed', goat: 'raw goat', sheep: 'raw sheep' }[v];
    }
    function milkShort(v) {
      return { cow: 'cow', 'cow-hay': 'cow, hay', goat: 'goat', sheep: 'sheep' }[v];
    }
    function cheeseName(w, v) {
      if (v === 'goat' && w < 6) return 'Fresh goat log';
      if (w < 16) return 'Mutschli';
      if (w < 30) return 'Tomme';
      if (w < 60) return 'Bergkäse';
      return 'Alpkäse';
    }

    function draw(weeksN, rindMm, tempN, milkV, W) {
      group.textContent = '';
      var cx = 232, cy = 176, r = 124;
      var rindPx = Math.min(26, Math.max(3, rindMm * 1.7));
      group.appendChild(el('circle', { cx: cx, cy: cy, r: r + 10, fill: 'none', stroke: '#3c4647', 'stroke-width': 1, 'stroke-dasharray': '2 5' }));
      group.appendChild(el('circle', { cx: cx, cy: cy, r: r, fill: '#8a6a3f' }));
      group.appendChild(el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: '#6b4f2c', 'stroke-width': 1.2 }));
      group.appendChild(el('circle', { cx: cx, cy: cy, r: r - rindPx, fill: '#e5cc94' }));
      group.appendChild(el('circle', { cx: cx, cy: cy, r: r - rindPx, fill: 'none', stroke: '#c9a86a', 'stroke-width': 1 }));
      group.appendChild(el('circle', { cx: cx, cy: cy, r: r - rindPx - 12, fill: 'none', stroke: '#d8bd84', 'stroke-width': 0.8, opacity: 0.8 }));

      /* eyes: small in a cold cave, larger when warm */
      var eyeCount = Math.round(Math.max(4, Math.min(26, (tempN - 5) * 2.2)));
      var eyeR = tempN >= 13 ? 7 : tempN >= 10 ? 4 : 2.2;
      var inner = r - rindPx - 16;
      for (var i = 0; i < eyeCount; i++) {
        var ang = i * 2.399963;
        var rad = inner * Math.sqrt((i + 0.6) / eyeCount) * 0.94;
        var ex = cx + rad * Math.cos(ang);
        var ey = cy + rad * Math.sin(ang);
        group.appendChild(el('ellipse', {
          cx: ex.toFixed(1), cy: ey.toFixed(1), rx: (eyeR * (0.7 + (i % 3) * 0.18)).toFixed(1),
          ry: (eyeR * (0.55 + (i % 2) * 0.2)).toFixed(1),
          fill: '#c8a96d', stroke: '#a98a52', 'stroke-width': 0.6, opacity: 0.85
        }));
      }

      /* cut wedge at lower right */
      var a0 = 0.12, a1 = 0.62;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      group.appendChild(el('path', {
        d: 'M' + cx + ' ' + cy + ' L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z',
        fill: '#d7b477', stroke: '#f7e6c0', 'stroke-width': 1.6
      }));
      group.appendChild(el('path', {
        d: 'M' + (cx + 7) + ' ' + (cy - 4) + ' L' + (x0 + 7).toFixed(1) + ' ' + (y0 - 4).toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x1 + 7).toFixed(1) + ' ' + (y1 - 4).toFixed(1) + ' Z',
        fill: '#c9a86a', stroke: '#8a6a3f', 'stroke-width': 0.9, opacity: 0.9
      }));
      group.appendChild(el('path', {
        d: 'M' + cx + ' ' + cy + ' L' + x0.toFixed(1) + ' ' + y0.toFixed(1),
        stroke: '#b99a63', 'stroke-width': 0.9
      }));
      group.appendChild(el('path', {
        d: 'M' + cx + ' ' + cy + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1),
        stroke: '#b99a63', 'stroke-width': 0.9
      }));

      /* rind dimension line */
      var dy = cy + r + 26;
      group.appendChild(el('path', { d: 'M' + (cx - r) + ' ' + dy + ' H' + (cx + r), stroke: '#6f7a74', 'stroke-width': 1 }));
      group.appendChild(el('path', { d: 'M' + (cx - r) + ' ' + (dy - 5) + ' v10 M' + (cx + r) + ' ' + (dy - 5) + ' v10', stroke: '#6f7a74', 'stroke-width': 1 }));
      group.appendChild(el('path', { d: 'M' + (cx + r - rindPx) + ' ' + (cy - r - 18) + ' v' + (2 * r + 36), stroke: '#d8a479', 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }));

      var t = el('text', { x: cx, y: dy + 16, 'text-anchor': 'middle', fill: '#b9c39a', 'font-family': 'DM Mono, monospace', 'font-size': 10, 'letter-spacing': '0.08em' });
      t.textContent = 'RIND ' + rindMm.toFixed(1) + ' MM';
      group.appendChild(t);

      var t2 = el('text', { x: 26, y: 30, fill: '#6f7a74', 'font-family': 'DM Mono, monospace', 'font-size': 9, 'letter-spacing': '0.1em' });
      t2.textContent = 'SECTION · ' + (milkShort(milkV) || 'cow').toUpperCase();
      group.appendChild(t2);

      var wheelCm = 2 * Math.sqrt((W / 1.1) / (Math.PI * (8 + 0.12 * W)));
      var t3 = el('text', { x: 26, y: 346, fill: '#6f7a74', 'font-family': 'DM Mono, monospace', 'font-size': 9, 'letter-spacing': '0.1em' });
      t3.textContent = 'SCALE 1:4 · WHEEL Ø ' + Math.round(wheelCm) + ' CM';
      group.appendChild(t3);
    }

    function compute() {
      var W = Number(weight.value);
      var T = Number(temp.value);
      var H = Number(humidity.value);
      var WK = Number(weeks.value);
      var milkV = milk.value;

      var rate = 0.30 + (T - 10) * 0.03 + (85 - H) * 0.008;
      if (rate < 0.06) rate = 0.06;
      var final = W * Math.pow(1 - rate / 100, WK);
      var loss = ((W - final) / W) * 100;
      var rindMm = 0.6 + WK * 0.18;
      var turn = WK <= 2 ? 'Daily' : WK <= 8 ? 'Every 2 days' : WK <= 100 ? 'Every 3 days' : 'Every 4 days';

      weightOut.textContent = num(W) + ' kg';
      tempOut.textContent = T + ' °C';
      humidityOut.textContent = H + '%';
      weeksOut.textContent = WK + ' week' + (WK === 1 ? '' : 's');

      document.getElementById('outLoss').textContent = loss.toFixed(1) + '%';
      document.getElementById('outFinal').textContent = num(final) + ' kg';
      document.getElementById('outRind').textContent = rindMm.toFixed(1) + ' mm';
      document.getElementById('outTurns').textContent = turn;
      document.getElementById('wheelName').textContent = cheeseName(WK, milkV) + ' · ' + milkShort(milkV);
      document.getElementById('wheelAge').textContent = WK + ' weeks';

      var notes = [];
      if (WK < 8) notes = ['Fresh milk and yogurt', 'A little salt at the finish', 'Rind still soft'];
      else if (WK < 22) notes = ['Butter and hazelnut', 'Hay, a clean lactic edge', 'Rind beginning to firm'];
      else if (WK < 60) notes = ['Hazelnut and brown butter', 'Onion, broth, a mineral middle', 'Long, dry finish'];
      else notes = ['Dried hay and allium', 'Broth, walnut, a little ammonia at the rind', 'Very long, saline finish'];

      if (milkV === 'goat') notes = WK < 12 ? ['Goat, lemon peel', 'Chalk and fresh herbs', 'Short, clean finish'] : ['Goat, preserved lemon', 'Hazelnut and hay', 'A dry, mineral snap'];
      if (milkV === 'sheep') notes = WK < 20 ? ['Lanolin and yogurt', 'Olive oil', 'Sweet milk finish'] : ['Lanolin, brown butter', 'Cured olive and walnut', 'A long, fatty finish'];

      tasting.textContent = '';
      notes.forEach(function (n) {
        var li = document.createElement('li');
        li.textContent = n;
        tasting.appendChild(li);
      });

      var v = '';
      if (T < 7) v = 'At ' + T + ' °C the rind will stall and the paste will stay lactic however long you wait. Raise the cave to 8–10 °C; the wheel will not catch up later.';
      else if (T > 14) v = 'At ' + T + ' °C the paste goes sweet and the rind slips. That is a washed-rind temperature, not an alpine one. Bring it down to 9–11 °C.';
      else if (H < 84) v = 'At ' + H + '% humidity the rind will crack and the wheel will lose weight too fast. A cracked rind cannot be repaired, only trimmed.';
      else if (H > 94) v = 'At ' + H + '% the rind stays wet and slip is likely. Expect ammonia before the paste is ready; drop to 91–92%.';
      else v = 'A cold, damp room, and nothing else. Over ' + WK + ' weeks the paste turns from lactic to hazelnut to broth, the rind thickens to ' + rindMm.toFixed(1) + ' mm and the salt moves inward about a millimetre a week.';
      if (WK > 100 && !T) v = v;
      verdict.textContent = v;

      var c = 'Turn ' + turn.toLowerCase() + '. Wipe the rind with a brine cloth every ten days and brush off any mould with a dry brush.';
      if (WK > 80) c += ' Past two years the rind needs brushing every week and the wheel loses its water faster than it gains character.';
      if (milkV === 'goat' || milkV === 'sheep') c += ' Small milk needs a shorter cave: taste at six weeks and again at twelve, and do not let the rind dry past 4 mm.';
      caution.textContent = c;

      draw(WK, rindMm, T, milkV, W);
    }

    [weight, temp, humidity, weeks].forEach(function (r) { r.addEventListener('input', compute); });
    milk.addEventListener('change', compute);
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    form.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-preset');
        if (p === 'berg') { weight.value = 34; milk.value = 'cow'; temp.value = 9; humidity.value = 92; weeks.value = 78; }
        if (p === 'alp') { weight.value = 38; milk.value = 'cow-hay'; temp.value = 8; humidity.value = 93; weeks.value = 130; }
        if (p === 'mutschli') { weight.value = 0.6; milk.value = 'cow'; temp.value = 11; humidity.value = 90; weeks.value = 12; }
        compute();
      });
    });

    compute();
    if (!reduced) {
      group.style.opacity = '0';
      requestAnimationFrame(function () {
        group.style.transition = 'opacity 500ms ease';
        group.style.opacity = '1';
      });
    }
  }

  /* ---------- wheel ledger filter ---------- */
  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var filters = filterBar.querySelectorAll('.filter');
    var rows = document.querySelectorAll('.ledger-row');
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var key = btn.getAttribute('data-filter');
      filters.forEach(function (f) {
        var on = f === btn;
        f.classList.toggle('is-on', on);
        f.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      rows.forEach(function (r) { r.hidden = key !== 'all' && r.getAttribute('data-milk') !== key; });
      var count = document.getElementById('rowCount');
      if (count) {
        var n = 0;
        rows.forEach(function (r) { if (!r.hidden) n++; });
        count.textContent = n + (n === 1 ? ' wheel' : ' wheels');
      }
    });
  }

  /* ---------- visit form ---------- */
  var visitForm = document.getElementById('visitForm');
  if (visitForm) {
    var note = document.getElementById('formNote');
    visitForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var day = document.getElementById('visitDay');
      var party = document.getElementById('party');
      var message = document.getElementById('message');
      var consent = document.getElementById('consent');
      var ok = true;
      function show(id, msg) { var n = document.getElementById(id); if (n) n.textContent = msg || ''; }
      ['errName', 'errEmail', 'errVisit', 'errParty', 'errMessage', 'errConsent'].forEach(function (id) { show(id, ''); });

      if (!name.value.trim() || name.value.trim().length < 2) { show('errName', 'A name for the list.'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { show('errEmail', 'That address will not reach me.'); ok = false; }
      if (!day.value) { show('errVisit', 'Choose a Thursday, Friday or Saturday.'); ok = false; }
      var p = Number(party.value);
      if (!party.value || isNaN(p) || p < 1 || p > 24) { show('errParty', 'Between one and twenty-four people.'); ok = false; }
      if (message.value.trim().length < 10) { show('errMessage', 'Say what you would like to taste or ask about the cave.'); ok = false; }
      if (!consent.checked) { show('errConsent', 'Please tick the box so I may reply.'); ok = false; }

      if (!ok) {
        if (note) note.hidden = true;
        var first = visitForm.querySelector('.err:not(:empty)');
        if (first) first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
      if (note) {
        note.hidden = false;
        note.textContent = 'Noted for ' + name.value.trim().split(' ')[0] + '. I confirm by email the day before, and hold a place at the counter for the tasting. The cave is 9 °C, so bring a jacket.';
      }
      visitForm.reset();
    });
  }
})();
