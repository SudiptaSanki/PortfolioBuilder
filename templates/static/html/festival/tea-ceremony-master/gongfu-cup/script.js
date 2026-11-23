/* Gongfu Cup — the table's arithmetic. No audio, no libraries. */
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

  var year = document.getElementById('foot-year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- steep plan ---------- */
  var TEA = {
    green: {
      name: 'green tea',
      ratio: 3.5, temp: 80, rinse: 0,
      times: [15, 20, 25, 35, 45, 60, 80, 100],
      notes: [
        'No rinse: the leaf is young and unrolled, and the first water is part of the tea.',
        'The opened leaf gives grass and chestnut. Keep the water off the boil or it turns bitter in four seconds.',
        'The clearest cup of the eight. This is the one to judge the leaf by.',
        'Softening now, with a sweet edge at the back of the tongue.',
        'Thinner, but still clean. Most greens are finished by here.',
        'A vegetal, almost seaweed smell in the empty cup.',
        'Only worth drinking if the leaf was good to begin with.',
        'The last of it. Long, pale, and mostly water — which is a fine thing to end on.'
      ]
    },
    white: {
      name: 'white tea',
      ratio: 4.5, temp: 85, rinse: 0,
      times: [20, 25, 35, 45, 60, 80, 100, 120],
      notes: [
        'No rinse. White tea is withered, not rolled, so it gives up its flavour slowly and late.',
        'Faint honey and hay. The liquor is almost clear and the taste arrives after you swallow.',
        'The roundest infusion. Silver needle is at its best here.',
        'A melon sweetness appears, with a dry finish.',
        'Lighter, with a pleasant wool texture.',
        'The leaf is spent but the water still smells of it.',
        'Pale and sweet. Good for a second person who arrived late.',
        'A long, quiet steep to close. Nothing left but warmth.'
      ]
    },
    oolong: {
      name: 'oolong',
      ratio: 6.5, temp: 95, rinse: 5,
      times: [10, 12, 15, 20, 25, 30, 40, 50],
      notes: [
        'A five-second rinse, poured away. It wakes the rolled leaf and warms the vessel.',
        'The first real cup: roast, then orchid, then a mineral taste that stays in the throat.',
        'The best of the eight. This is the infusion people remember and cannot find in a shop.',
        'Stone fruit and a dry edge. The roast is still doing the talking.',
        'Honey. The roast has moved back and the leaf has come forward.',
        'Lighter now, with a coolness on the tongue that was not there before.',
        'Sweet water with a ghost of the third infusion.',
        'The last. Faint, warm and slightly woody — a good place to stop.'
      ]
    },
    black: {
      name: 'black tea',
      ratio: 5, temp: 92, rinse: 5,
      times: [10, 12, 15, 18, 22, 28, 35, 45],
      notes: [
        'A quick rinse. Black tea takes it well; the leaf is fully oxidised and will not bruise.',
        'Malt and a little smoke. Darjeeling first flush is the exception — it wants less heat and less time.',
        'Full body, red-brown liquor, a dry finish at the sides of the tongue.',
        'Cocoa and baked bread. Assam is unmistakable here.',
        'Rounder, sweeter, losing the astringency that makes people add milk.',
        'Lighter, but still clearly tea. Good with something salty.',
        'The tannin is back, softly, at the end.',
        'A last long infusion. Fine for the pot, not for a guest.'
      ]
    },
    puerh: {
      name: 'aged puerh',
      ratio: 7, temp: 100, rinse: 10,
      times: [8, 10, 12, 15, 20, 25, 30, 40],
      notes: [
        'Two ten-second rinses for an aged cake, poured away. The tea is woken, not washed.',
        'Damp earth, old wood, a sweetness underneath. The colour is already dark.',
        'Thick in the mouth. This is the cup that separates people who like puerh from people who do not.',
        'The sweetness has come up and the cellar has gone back.',
        'Smooth, almost oily, with a cooling aftertaste.',
        'Lighter, but the throat still feels coated — that is the mark of a decent cake.',
        'Clean and sweet, like the second infusion of a much younger tea.',
        'A long boil to finish. Nothing is wasted from a good cake.'
      ]
    }
  };

  var form = document.getElementById('steep-form');
  if (form) {
    var state = { vessel: 100, tea: 'oolong', strength: 1, guests: 6, pick: 0 };
    var doseEl = document.getElementById('dose');
    var tempEl = document.getElementById('temp');
    var rinseEl = document.getElementById('rinse');
    var totalEl = document.getElementById('total-leaf');
    var noteEl = document.getElementById('steep-note');
    var labelEl = document.getElementById('steep-label');
    var rowEl = document.getElementById('infusion-row');
    var fillEl = document.getElementById('tea-fill');
    var footEl = document.querySelector('.steep-foot');
    var current = [];

    function seconds(n) {
      return n >= 60 ? (n / 60).toFixed(n % 60 === 0 ? 0 : 1) + ' min' : n + ' s';
    }

    function compute() {
      var t = TEA[state.tea];
      var dose = Math.round((t.ratio * state.vessel / 100 * state.strength) * 2) / 2;
      var times = t.times.map(function (s) {
        return Math.max(4, Math.round(s * Math.pow(state.strength, 0.45)));
      });
      var cups = Math.max(1, Math.floor((state.vessel * 0.62) / 35));
      var rounds = Math.ceil(state.guests / cups);
      doseEl.textContent = dose.toFixed(1) + ' g';
      tempEl.textContent = t.temp + ' °C';
      rinseEl.textContent = t.rinse ? t.rinse + ' s' : 'None';
      totalEl.textContent = (dose * rounds).toFixed(1) + ' g';
      current = times;

      if (footEl) {
        footEl.textContent = state.vessel + ' ml pours ' + cups + ' cup' + (cups > 1 ? 's' : '') +
          ' of about 35 ml. For ' + state.guests + ' guest' + (state.guests > 1 ? 's' : '') +
          ' that is ' + rounds + ' round' + (rounds > 1 ? 's' : '') + ' an infusion, so ' +
          (dose * rounds).toFixed(1) + ' g of leaf for the session — the leaf is reused, never replaced.';
      }

      rowEl.innerHTML = '';
      times.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'steep-btn' + (i === state.pick ? ' is-set' : '');
        b.dataset.i = String(i);
        b.setAttribute('aria-pressed', String(i === state.pick));
        b.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="steep-time">' + seconds(s) + '</span>';
        b.addEventListener('click', function () {
          state.pick = i;
          Array.prototype.forEach.call(rowEl.children, function (c) {
            var on = c === b;
            c.classList.toggle('is-set', on);
            c.setAttribute('aria-pressed', String(on));
          });
          showNote();
        });
        rowEl.appendChild(b);
      });
      if (state.pick > 7) state.pick = 0;
      showNote();
    }

    function showNote() {
      var t = TEA[state.tea];
      var i = state.pick;
      var lead = '';
      if (i === 0 && t.rinse) lead = 'Rinse, then pour it away. ';
      noteEl.textContent = lead + (i === 0 && !t.rinse ? '' : '') + t.notes[i];
      labelEl.textContent = 'Infusion ' + (i + 1) + ' of 8 · ' + seconds(current[i]);
      if (fillEl) {
        fillEl.style.opacity = String(0.1 + Math.min(i, 7) * 0.022);
      }
    }

    form.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      if (b.dataset.vessel) state.vessel = Number(b.dataset.vessel);
      if (b.dataset.tea) { state.tea = b.dataset.tea; state.pick = 0; }
      if (b.dataset.strength) state.strength = Number(b.dataset.strength);
      if (b.dataset.guests) state.guests = Number(b.dataset.guests);
      Array.prototype.forEach.call(b.parentElement.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      compute();
    });

    compute();
  }

  /* ---------- sessions filter ---------- */
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

  /* ---------- booking form ---------- */
  var book = document.getElementById('book-form');
  if (book) {
    var sent = document.getElementById('sent');
    var sentName = document.getElementById('sent-name');
    var fields = [
      { id: 'b-name', msg: 'Please tell me who to expect.' },
      { id: 'b-email', msg: 'An email address, so the confirmation reaches you.', email: true },
      { id: 'b-date', msg: 'Choose the day you would like.', date: true },
      { id: 'b-guests', msg: 'How many are coming?' },
      { id: 'b-note', msg: 'Anything I should know — allergies, a tea you want, a birthday.', min: 5 }
    ];
    var agree = document.getElementById('b-agree');

    book.addEventListener('submit', function (e) {
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
        if (f.id === 'b-name') nameVal = v;
      });
      if (agree && !agree.checked) {
        ok = false;
        var aw = agree.closest('.check-wrap');
        if (aw) aw.classList.add('bad');
      }
      if (!ok) {
        var first = book.querySelector('.field.bad input, .field.bad textarea, .field.bad select');
        if (first) first.focus();
        return;
      }
      if (sentName) sentName.textContent = (nameVal.split(' ')[0] || 'friend');
      book.hidden = true;
      if (sent) {
        sent.hidden = false;
        sent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    book.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field');
      if (wrap && wrap.classList.contains('bad') && e.target.value.trim()) {
        wrap.classList.remove('bad');
        var err = wrap.querySelector('.err');
        if (err) err.textContent = '';
      }
      if (agree) {
        var aw = agree.closest('.check-wrap');
        if (aw && agree.checked) aw.classList.remove('bad');
      }
    });
  }
})();
