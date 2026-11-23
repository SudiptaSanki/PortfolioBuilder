/* Kahwa Candle — page behaviour. Silent by design: no AudioContext, no libraries. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- shared chrome ---------- */
  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        drawer.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  var thread = document.getElementById('thread');
  function paintThread() {
    if (!thread) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? window.scrollY / h : 0;
    thread.style.width = Math.min(100, Math.max(0, p * 100)).toFixed(2) + '%';
  }
  paintThread();
  window.addEventListener('scroll', paintThread, { passive: true });
  window.addEventListener('resize', paintThread);

  /* ---------- reveals ---------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length) {
    if (reduceMotion) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var ticking = false;
      var checkReveals = function () {
        ticking = false;
        var limit = window.innerHeight * 0.94;
        rvs = rvs.filter(function (el) {
          if (el.classList.contains('in')) return false;
          if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false; }
          return true;
        });
      };
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(checkReveals);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      checkReveals();
    }
  }

  /* ---------- hero: a small tilt on the pot ---------- */
  var tilt = document.getElementById('tilt');
  var plate = document.querySelector('.samovar-plate');
  if (tilt && plate && !reduceMotion && window.matchMedia('(hover:hover)').matches) {
    plate.addEventListener('pointermove', function (e) {
      var r = plate.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = 'rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 4).toFixed(2) + 'deg)';
    });
    plate.addEventListener('pointerleave', function () {
      tilt.style.transform = '';
    });
  }

  /* ---------- the bench ---------- */
  var bench = document.getElementById('bench-form');
  if (bench) {
    var state = { vessel: 220, strength: 1, sweet: 'sugar', saffron: true };

    function chipGroup(id, key, parse) {
      var group = document.getElementById(id);
      if (!group) return;
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        group.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state[key] = parse(chip);
        render();
      });
    }

    chipGroup('vessel-chips', 'vessel', function (c) { return Number(c.dataset.vessel); });
    chipGroup('strength-chips', 'strength', function (c) { return Number(c.dataset.strength); });
    chipGroup('sweet-chips', 'sweet', function (c) { return c.dataset.sweet; });

    var saff = document.getElementById('saffron-toggle');
    if (saff) {
      saff.addEventListener('change', function () {
        state.saffron = saff.checked;
        render();
      });
    }

    var notes = document.getElementById('bench-note');
    var noteCopy = {
      none: 'Without sugar the cardamom comes forward and the saffron reads almost savoury. It is the way a wazwan kitchen makes it.',
      honey: 'Honey goes into the cup, never the pot — a boiled honey loses the flower it came from.',
      sugar: 'Sugar goes into the pot a spoon at a time, tasted at the third spoon. A pot sweetened for the first cup is too sweet by the last.',
      mishri: 'Mishri is rock sugar, dropped in whole and stirred with the spoon still in the pot. It sweetens the last cup more than the first.'
    };

    function round05(n) { return Math.round(n * 2) / 2; }

    function render() {
      var water = Math.round(state.vessel * 0.9 / 10) * 10;
      var cups = Math.max(1, Math.round(state.vessel / 220));
      var leaf = water / 100 * state.strength;
      var cardamom = Math.max(1, Math.round(water / 250 * state.strength));
      var cinnamon = Math.max(1, round05(water / 200 * state.strength + 0.5));
      var cloves = Math.max(1, Math.round(water / 300 * state.strength));
      var strands = state.saffron ? Math.round(water / 20) : 0;
      var almonds = Math.round(water / 33);
      var sweetQty = 0;
      var sweetWord = '';
      if (state.sweet === 'honey') { sweetQty = cups * 1; sweetWord = 'tsp honey'; }
      else if (state.sweet === 'sugar') { sweetQty = cups * 1.5; sweetWord = 'tsp sugar'; }
      else if (state.sweet === 'mishri') { sweetQty = cups * 2; sweetWord = 'tsp mishri'; }
      var steep = state.strength <= 0.9 ? '1 min 30 s' : (state.strength < 1.15 ? '2 min' : '2 min 30 s');

      set('out-water', water + ' ml');
      var leafEl = document.getElementById('out-leaf');
      if (leafEl) leafEl.textContent = leaf.toFixed(1).replace(/\.0$/, '');
      set('out-cardamom', cardamom + (cardamom === 1 ? ' pod' : ' pods'));
      set('out-cinnamon', cinnamon + ' cm');
      set('out-cloves', String(cloves));
      set('out-saffron', state.saffron ? strands + ' strands' : 'none');
      set('out-almond', String(almonds));
      set('out-sweet', state.sweet === 'none' ? 'none' : sweetQty + ' ' + sweetWord);
      set('out-steep', steep);
      set('out-serves', cups + (cups === 1 ? ' cup' : ' cups'));
      set('out-buy', Math.ceil(leaf * 1.15) + ' g');
      set('out-saffron-g', (strands * 0.003).toFixed(2) + ' g');
      if (notes) notes.textContent = noteCopy[state.sweet];
      benchData = { leaf: leaf, cardamom: cardamom, cinnamon: cinnamon, cloves: cloves, strands: strands, almonds: almonds, water: water, steep: steep, cups: cups };
      renderStep(currentStep);
    }

    function set(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    /* steps */
    var currentStep = 0;
    var benchData = {};
    var stepEls = Array.prototype.slice.call(document.querySelectorAll('.step'));
    var stepNote = document.getElementById('step-note');

    function renderStep(i, fromClick) {
      currentStep = i;
      stepEls.forEach(function (el) {
        el.setAttribute('aria-current', String(Number(el.dataset.step) === i));
      });
      if (!stepNote) return;
      var d = benchData;
      var copy;
      switch (i) {
        case 0:
          copy = '<b>Rinse and fill.</b> Hot water round the pot and out again, then ' + d.water + ' ml of fresh water. A copper samovar that has stood empty tastes of the tin, not the tea.';
          break;
        case 1:
          copy = '<b>Spices into cold water.</b> ' + d.cinnamon + ' cm of cinnamon quill, ' + d.cardamom + ' green cardamom' + (d.cardamom === 1 ? '' : 's') + ' crushed just enough to open, ' + d.cloves + ' clove' + (d.cloves === 1 ? '' : 's') + '. Bring up and hold six minutes.';
          break;
        case 2:
          copy = '<b>Tea, off the boil.</b> ' + d.leaf.toFixed(1).replace(/\.0$/, '') + ' g of loose green tea, ' + d.steep + ' only. Longer turns it bitter and grey, and no amount of saffron brings it back.';
          break;
        case 3:
          copy = d.strands ? '<b>Bloom the saffron.</b> ' + d.strands + ' strands in two spoons of warm water. Add the bloom and the strands, or the colour stays in the cup and never reaches the pot.' : '<b>No saffron today.</b> Add a turn of black pepper instead, off the heat, and let it stand for thirty seconds before straining.';
          break;
        default:
          copy = '<b>Strain, almonds, serve.</b> ' + d.almonds + ' almond slivers into the pot, cups warmed, first cup poured while the steam is still rising. ' + d.cups + ' cup' + (d.cups === 1 ? '' : 's') + ' from this pot.';
      }
      stepNote.innerHTML = copy;
    }

    stepEls.forEach(function (el) {
      el.addEventListener('click', function () { renderStep(Number(el.dataset.step), true); });
    });

    render();
  }

  /* ---------- trays filter ---------- */
  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var offers = Array.prototype.slice.call(document.querySelectorAll('.offer'));
    var showing = document.getElementById('showing');
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.fchip');
      if (!btn) return;
      var f = btn.dataset.filter;
      filterBar.querySelectorAll('.fchip').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var shown = 0;
      offers.forEach(function (card) {
        var show = f === 'all' || card.dataset.type === f;
        card.hidden = !show;
        if (show) shown++;
      });
      if (showing) showing.textContent = shown + ' of ' + offers.length;
    });
  }

  /* ---------- request form ---------- */
  var form = document.getElementById('kahwa-form');
  if (form) {
    var sent = document.getElementById('sent');

    function field(id) { return document.getElementById(id); }
    function showError(id, msg) {
      var err = document.getElementById(id + '-err');
      var input = field(id);
      if (err) err.textContent = msg;
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    form.addEventListener('input', function (e) {
      var id = e.target.id;
      if (id && document.getElementById(id + '-err')) showError(id, '');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = field('k-name');
      var mail = field('k-email');
      var date = field('k-date');
      var note = field('k-note');
      var agree = field('k-agree');
      var ok = true;

      if (!name || name.value.trim().length < 2) { showError('k-name', 'A name, so I know who is coming.'); ok = false; }
      else showError('k-name', '');

      if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { showError('k-email', 'An address I can reply to.'); ok = false; }
      else showError('k-email', '');

      if (!date || !date.value) { showError('k-date', 'Pick the day you have in mind.'); ok = false; }
      else {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var picked = new Date(date.value + 'T12:00:00');
        if (isNaN(picked.getTime())) { showError('k-date', 'That date does not read.'); ok = false; }
        else if (picked < today) { showError('k-date', 'A past date cannot be held.'); ok = false; }
        else showError('k-date', '');
      }

      if (!note || note.value.trim().length < 12) { showError('k-note', 'Tell me the room and the number of cups.'); ok = false; }
      else showError('k-note', '');

      if (!agree || !agree.checked) { showError('k-agree', 'Please confirm you understand the date is not held yet.'); ok = false; }
      else showError('k-agree', '');

      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first && first.focus) first.focus();
        return;
      }

      var d = new Date(date.value + 'T12:00:00');
      var pretty = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      document.getElementById('sent-mail').textContent = mail.value.trim();
      document.getElementById('sent-date').textContent = pretty;
      document.getElementById('sent-guests').textContent = field('k-guests') ? field('k-guests').value : 'Two';
      var occ = field('k-occasion');
      document.getElementById('sent-occasion').textContent = occ && occ.value.trim() ? occ.value.trim() : 'A table without a name';
      form.hidden = true;
      sent.hidden = false;
      sent.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
})();
