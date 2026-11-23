/* Grape Vintner — picking window, cellar filter, tasting form. No audio, no libraries. */
(function () {
  'use strict';

  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- picking window ---------- */
  var VARIETY = {
    sauvignon: {
      rate: 0.11, target: 22, row: 'Block 3, east', last: '18 Feb 2026 · 21.8 °Brix', crop: '4.2 t',
      note: 'Sauvignon Blanc for a still wine is usually picked between 21.5 and 22.5 °Brix, at night, with the acid still above 6 g/L. Hold the fruit a week longer and you gain alcohol you will later have to hide.'
    },
    chenin: {
      rate: 0.105, target: 22.4, row: 'Block 7, north', last: '24 Feb 2026 · 22.6 °Brix', crop: '3.1 t',
      note: 'Chenin holds its acid better than anything else on this slope, so it can hang a week past the whites around it. I pick it for texture, not numbers, and I am usually right about one block in three.'
    },
    shiraz: {
      rate: 0.12, target: 24, row: 'Block 1, west', last: '6 Mar 2026 · 24.1 °Brix', crop: '6.8 t',
      note: 'Shiraz wants 23.5 to 24.5 and a fortnight of flavour ripeness after the sugar arrives. Chew the skin: if the tannin is still green at 24, the number is lying to you and you wait.'
    },
    cabernet: {
      rate: 0.115, target: 24.2, row: 'Block 5, ridge', last: '11 Mar 2026 · 24.4 °Brix', crop: '5.4 t',
      note: 'Cabernet is the last block picked and the one most likely to be picked too late. The ridge runs hot; at 25 °Brix the wine is a fruit bomb with no spine, and no amount of barrel fixes that.'
    },
    zinfandel: {
      rate: 0.125, target: 24.5, row: 'Block 9, gully', last: '2 Mar 2026 · 24.6 °Brix', crop: '2.9 t',
      note: 'Zinfandel goes over in three days. It is uneven in the bunch, so the refractometer reading is an average of berries that are two weeks apart. Pick on taste and accept that half the crop is a compromise.'
    }
  };

  var form = document.getElementById('pick-form');
  if (form) {
    var state = { variety: 'sauvignon', style: 'still' };
    var brixNow = document.getElementById('brix-now');
    var brixTarget = document.getElementById('pick-brix');
    var nowOut = document.getElementById('brix-now');
    var nowLabel = document.querySelector('label[for="brix-now"] output');
    var targetLabel = document.querySelector('label[for="pick-brix"] output');
    var pruneInput = document.getElementById('prune');
    var dateEl = document.getElementById('harvest-date');
    var awayEl = document.getElementById('days-away');
    var gainEl = document.getElementById('brix-gain');
    var alcEl = document.getElementById('potential-alc');
    var taEl = document.getElementById('ta');
    var noteEl = document.getElementById('pick-note');
    var captionEl = document.getElementById('chart-caption');
    var rowEl = document.getElementById('row-note');
    var lastEl = document.getElementById('last-year');
    var cropEl = document.getElementById('crop-note');

    var SVGNS = 'http://www.w3.org/2000/svg';
    var chart = document.getElementById('brix-chart');
    var grid = document.getElementById('chart-grid');
    var line = document.getElementById('chart-line');
    var targetLine = document.getElementById('chart-target');
    var marks = document.getElementById('chart-marks');
    var W = 640, H = 260, L = 48, R = 24, T = 22, B = 40;

    function fmtDate(d) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    function fmtShort(d) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    function dayDiff(a, b) {
      return Math.round((a - b) / 86400000);
    }

    function drawChart(today, days, current, target, rate) {
      var span = Math.max(60, Math.min(150, Math.ceil(days * 1.45 / 10) * 10));
      var yMin = Math.max(10, Math.floor((Math.min(current, target) - 2) / 2) * 2);
      var yMax = Math.min(30, Math.ceil((Math.max(current, target) + 2) / 2) * 2);
      function x(day) { return L + (day / span) * (W - L - R); }
      function y(brix) { return T + (1 - (brix - yMin) / (yMax - yMin)) * (H - T - B); }

      grid.innerHTML = '';
      marks.innerHTML = '';
      [yMin, (yMin + yMax) / 2, target, yMax].forEach(function (v) {
        var yy = y(v);
        var gl = document.createElementNS(SVGNS, 'line');
        gl.setAttribute('x1', L); gl.setAttribute('x2', W - R);
        gl.setAttribute('y1', yy); gl.setAttribute('y2', yy);
        grid.appendChild(gl);
        var t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('x', L - 8); t.setAttribute('y', yy + 3.5);
        t.setAttribute('text-anchor', 'end');
        t.textContent = v.toFixed(1) + '°';
        grid.appendChild(t);
      });
      for (var d = 0; d <= span; d += 30) {
        var xx = x(d);
        var vl = document.createElementNS(SVGNS, 'line');
        vl.setAttribute('x1', xx); vl.setAttribute('x2', xx);
        vl.setAttribute('y1', H - B); vl.setAttribute('y2', H - B + 5);
        grid.appendChild(vl);
        var lab = document.createElementNS(SVGNS, 'text');
        lab.setAttribute('x', xx); lab.setAttribute('y', H - B + 19);
        lab.setAttribute('text-anchor', 'middle');
        var dd = new Date(today.getTime() + d * 86400000);
        lab.textContent = fmtShort(dd);
        grid.appendChild(lab);
      }

      var endDay = Math.min(span, days + Math.max(10, days * 0.16));
      line.setAttribute('d', 'M' + x(0) + ',' + y(current) + ' L' + x(endDay) + ',' + y(current + rate * endDay));
      targetLine.setAttribute('d', 'M' + x(0) + ',' + y(target) + ' L' + x(span) + ',' + y(target));

      var point = document.createElementNS(SVGNS, 'circle');
      point.setAttribute('cx', x(days)); point.setAttribute('cy', y(target)); point.setAttribute('r', 4.5);
      marks.appendChild(point);
      var pl = document.createElementNS(SVGNS, 'text');
      pl.setAttribute('x', Math.min(x(days) + 10, W - R - 60));
      pl.setAttribute('y', y(target) - 11);
      pl.textContent = target.toFixed(1) + '° · ' + fmtShort(new Date(today.getTime() + days * 86400000));
      marks.appendChild(pl);

      var start = document.createElementNS(SVGNS, 'circle');
      start.setAttribute('cx', x(0)); start.setAttribute('cy', y(current)); start.setAttribute('r', 3);
      marks.appendChild(start);
      var sl = document.createElementNS(SVGNS, 'text');
      sl.setAttribute('x', x(0) + 8); sl.setAttribute('y', y(current) + 16);
      sl.textContent = 'today · ' + current.toFixed(1) + '°';
      marks.appendChild(sl);
    }

    function compute() {
      var v = VARIETY[state.variety];
      var current = Number(brixNow.value);
      var target = Number(brixTarget.value);
      var days = Math.max(0, Math.ceil((target - current) / v.rate));
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var pick = new Date(today.getTime() + days * 86400000);
      var prune = new Date(pruneInput.value || '2026-10-14');
      var afterPrune = isNaN(prune.getTime()) ? null : dayDiff(pick, prune);

      dateEl.textContent = fmtDate(pick);
      awayEl.textContent = days === 0
        ? 'ready now at ' + current.toFixed(1) + ' °Brix'
        : 'in ' + days + ' day' + (days === 1 ? '' : 's') + (afterPrune ? ' · ' + afterPrune + ' days after pruning' : '');
      gainEl.textContent = Math.max(0, target - current).toFixed(1) + ' °Brix';
      alcEl.textContent = (target * 0.57).toFixed(1) + '%';
      taEl.textContent = Math.max(3.2, 8.2 - (target - 12) * 0.22).toFixed(1) + ' g/L';

      rowEl.textContent = v.row;
      lastEl.textContent = v.last;
      cropEl.textContent = v.crop;

      var note = v.note;
      if (state.style === 'sparkling') {
        note = 'For a sparkling base, come back to 18.5 to 19.5 °Brix with the acid above 8 g/L — the second fermentation will add the alcohol you are giving up now. ' + note;
      } else if (state.style === 'rose') {
        note = 'Rosé is picked earlier than the same block would be for red: colour comes out in hours, and acid is what keeps it fresh in a Nashik summer. ' + note;
      }
      if (target > current + 0 && days > 75) {
        note += ' A projection this far out is a shape, not a date — take another reading in a fortnight.';
      }
      if (current > 25.5) {
        note = 'At ' + current.toFixed(1) + ' °Brix this block is already past most targets. Pick, or accept a wine that is hot and low in acid. ' + note;
      }
      noteEl.textContent = note;

      captionEl.textContent = 'Projected at ' + v.rate.toFixed(3) + ' °Brix a day from a reading of ' +
        current.toFixed(1) + ' on ' + fmtShort(today) + '. The dashed line is the target you set.';
      drawChart(today, days, current, target, v.rate);
      if (nowLabel) nowLabel.value = current.toFixed(1);
      if (targetLabel) targetLabel.value = target.toFixed(1);
    }

    form.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      if (b.dataset.variety) {
        state.variety = b.dataset.variety;
        brixTarget.value = String(VARIETY[state.variety].target);
      }
      if (b.dataset.style) state.style = b.dataset.style;
      Array.prototype.forEach.call(b.parentElement.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      compute();
    });
    brixNow.addEventListener('input', compute);
    brixTarget.addEventListener('input', compute);
    pruneInput.addEventListener('change', compute);

    compute();
  }

  /* ---------- cellar book filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var empty = document.querySelector('.empty-note');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var f = b.dataset.filter;
      Array.prototype.forEach.call(filters.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      Array.prototype.forEach.call(document.querySelectorAll('.entry'), function (en) {
        var show = f === 'all' || en.dataset.type === f;
        en.hidden = !show;
        if (show) shown++;
      });
      if (empty) empty.classList.toggle('on', shown === 0);
    });
  }

  /* ---------- tasting form ---------- */
  var taste = document.getElementById('taste-form');
  if (taste) {
    var sent = document.getElementById('sent');
    var sentName = document.getElementById('sent-name');
    var fields = [
      { id: 't-name', msg: 'Who shall I put on the list?' },
      { id: 't-email', msg: 'An email address, so the confirmation reaches you.', email: true },
      { id: 't-date', msg: 'Choose a day.', date: true },
      { id: 't-guests', msg: 'How many are coming?' },
      { id: 't-note', msg: 'Tell me what you like to drink, so I can choose the flight.', min: 6 }
    ];
    var agree = document.getElementById('t-agree');

    taste.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var nameVal = '';
      fields.forEach(function (f) {
        var el = document.getElementById(f.id);
        if (!el) return;
        var v = el.value.trim();
        var bad = !v;
        if (!bad && f.email) bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (!bad && f.date) bad = !/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v).getTime());
        if (!bad && f.min) bad = v.length < f.min;
        var wrap = el.closest('.field');
        if (wrap) {
          wrap.classList.toggle('bad', bad);
          var err = wrap.querySelector('.err');
          if (err) err.textContent = bad ? f.msg : '';
        }
        if (bad) ok = false;
        if (f.id === 't-name') nameVal = v;
      });
      if (agree && !agree.checked) {
        ok = false;
        var aw = agree.closest('.check-wrap');
        if (aw) aw.classList.add('bad');
      }
      if (!ok) {
        var first = taste.querySelector('.field.bad input, .field.bad textarea, .field.bad select');
        if (first) first.focus();
        return;
      }
      if (sentName) sentName.textContent = nameVal.split(' ')[0] || 'friend';
      taste.hidden = true;
      if (sent) {
        sent.hidden = false;
        sent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    taste.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field');
      if (wrap && wrap.classList.contains('bad') && e.target.value.trim()) {
        wrap.classList.remove('bad');
        var err = wrap.querySelector('.err');
        if (err) err.textContent = '';
      }
      if (agree && agree.checked) {
        var aw = agree.closest('.check-wrap');
        if (aw) aw.classList.remove('bad');
      }
    });
  }
})();
