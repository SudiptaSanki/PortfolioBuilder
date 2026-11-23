/* Cocoa Cloak — site behaviour
   Nav, reveals, the batch scaler, order filters, order form. No audio anywhere. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- batch scaler ---------- */
  (function scaler() {
    var form = document.getElementById('scaler-form');
    if (!form) return;
    var recipeSel = document.getElementById('recipe');
    var tin = document.getElementById('tin');
    var batches = document.getElementById('batches');
    var when = document.getElementById('when');
    var tinOut = document.querySelector('[data-out="tin"]');
    var batchOut = document.querySelector('[data-out="batches"]');
    var table = document.querySelector('.scale-table');
    var plan = document.querySelector('.bake-plan');

    var RECIPES = {
      cocoa: {
        name: 'Cocoa cloak cake',
        tin: 20,
        bake: 48,
        bakeStep: 3,
        rows: [
          ['flour', 'Wheat flour', 210, 'g'],
          ['butter', 'Butter, soft', 180, 'g'],
          ['cocoa', 'Dark cocoa', 60, 'g'],
          ['sugar', 'Sugar', 200, 'g'],
          ['eggs', 'Eggs, whole', 3, 'eggs'],
          ['cream', 'Sour cream', 120, 'g']
        ],
        note: 'A 20 cm tin, one batch. Cloak it while the chocolate is still moving.'
      },
      stollen: {
        name: 'Stollen',
        tin: 20,
        bake: 55,
        bakeStep: 2,
        rows: [
          ['flour', 'Wheat flour', 500, 'g'],
          ['butter', 'Butter, soft', 250, 'g'],
          ['sugar', 'Sugar', 90, 'g'],
          ['almond', 'Marzipan', 120, 'g'],
          ['yeast', 'Fresh yeast', 21, 'g'],
          ['milk', 'Milk, warm', 220, 'ml']
        ],
        note: 'One loaf of about a kilo. Wrap it in paper and leave it a week before the first cut.'
      },
      ginger: {
        name: 'Gingerbread hearts',
        tin: 20,
        bake: 12,
        bakeStep: 1,
        rows: [
          ['flour', 'Wheat flour', 400, 'g'],
          ['butter', 'Butter, soft', 150, 'g'],
          ['sugar', 'Sugar', 160, 'g'],
          ['honey', 'Honey', 180, 'g'],
          ['eggs', 'Eggs, whole', 2, 'eggs'],
          ['spice', 'Gingerbread spice', 14, 'g']
        ],
        note: 'One tray of hearts. The dough wants a night in the cold before it is rolled.'
      }
    };

    function fmt(n, unit) {
      if (unit === 'eggs') {
        var count = Math.max(1, Math.round(n));
        return String(count);
      }
      if (unit === 'ml') return Math.round(n) + ' ml';
      return Math.round(n) + ' g';
    }

    function total(data, factor) {
      var grams = 0;
      data.rows.forEach(function (r) {
        if (r[3] === 'g') grams += r[2] * factor;
      });
      return grams >= 1000 ? (grams / 1000).toFixed(2) + ' kg' : Math.round(grams) + ' g';
    }

    function render() {
      var data = RECIPES[recipeSel.value] || RECIPES.cocoa;
      var diameter = parseInt(tin.value, 10);
      var batch = parseFloat(batches.value);
      var areaFactor = Math.pow(diameter / data.tin, 2);
      var factor = areaFactor * batch;

      var head = '<div class="scale-head"><span>Ingredient</span><span>Weight</span></div>';
      var rows = data.rows.map(function (r) {
        return '<p class="scale-row"><span>' + r[1] + '</span><span data-out="' + r[0] + '">' + fmt(r[2] * factor, r[3]) + '</span></p>';
      }).join('');
      var totalRow = '<p class="scale-row total"><span>Total</span><span data-out="total">' + total(data, factor) + '</span></p>';
      table.innerHTML = head + rows + totalRow;

      var tins = Math.max(1, Math.ceil(batch * (data.name === 'Gingerbread hearts' ? 1 : 1)));
      var traysOut = document.querySelector('[data-out="trays"]');
      if (traysOut) traysOut.textContent = tins + (data.name === 'Stollen' ? ' loaf' : data.name === 'Gingerbread hearts' ? ' tray' : ' tin') + (tins > 1 ? 's' : '');

      var bake = Math.round(data.bake + (diameter - data.tin) * data.bakeStep);
      var bakeOut = document.querySelector('[data-out="bake"]');
      if (bakeOut) bakeOut.textContent = String(bake);

      if (tinOut) tinOut.textContent = diameter + ' cm';
      if (batchOut) batchOut.textContent = String(batch);

      var note = document.querySelector('[data-out="note"]');
      if (note) {
        var collect = when.value === 'eve' ? 'Bake it the day before and keep it cool.' : when.value === 'mid' ? 'Bake it in the week you collect; it keeps five days.' : 'Bake it two days ahead so the cocoa settles.';
        note.textContent = data.note + ' ' + collect;
      }

      /* plan times follow the tin */
      var steps = plan.querySelectorAll('li');
      var times = [0, 6, 20, 26, 26 + bake];
      steps.forEach(function (li, i) {
        var t = times[i] !== undefined ? times[i] : 0;
        var mm = Math.floor(t / 60);
        var ss = t % 60;
        var label = li.querySelector('.step-t');
        if (label) label.textContent = mm + ':' + (ss < 10 ? '0' + ss : ss);
      });
    }

    [recipeSel, tin, batches, when].forEach(function (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    render();
  })();

  /* ---------- order filters ---------- */
  (function orders() {
    var buttons = document.querySelectorAll('.order-filters button');
    if (!buttons.length) return;
    var items = document.querySelectorAll('.order');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === button ? 'true' : 'false'); });
        items.forEach(function (item) {
          item.hidden = !(filter === 'all' || item.getAttribute('data-kind') === filter);
        });
        var status = document.getElementById('order-status');
        if (status) status.textContent = document.querySelectorAll('.order:not([hidden])').length + ' of ' + items.length + ' orders shown';
      });
    });
  })();

  /* ---------- order form ---------- */
  (function form() {
    var f = document.getElementById('contact-form');
    if (!f) return;
    var note = document.getElementById('form-note');
    f.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = f.querySelector('#name');
      var email = f.querySelector('#email');
      var message = f.querySelector('#message');
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        if (note) { note.textContent = 'A name, an email and what you would like baked — that is all I need to start.'; note.hidden = false; }
        return;
      }
      if (note) {
        note.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your order is in the book; I confirm each one by email within two days, with the collection hour.';
        note.hidden = false;
      }
      f.reset();
    });
  })();
})();
