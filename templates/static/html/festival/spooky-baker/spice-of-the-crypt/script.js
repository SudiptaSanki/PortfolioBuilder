/* ==========================================================================
   Spice of the Crypt — interaction
   The batch ledger scales a recipe in grams and baker's percentages, fills
   the spice jar in proportion, and says plainly what the oven will not do.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      rvs.forEach(function (el) { io.observe(el); });
    } else {
      rvs.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ------------------------------------------------------------ the ledger */
  var RECIPES = {
    brownies: {
      name: 'Grave-Dirt Brownies',
      sub: '24 pieces · one 9 × 13 pan',
      yieldOne: 24,
      yieldUnit: 'piece',
      yieldPlural: 'pieces',
      flour: 95,
      ingredients: [
        { n: 'Brown butter', g: 170 },
        { n: 'Dark chocolate, 70%', g: 200 },
        { n: 'Caster sugar', g: 250 },
        { n: 'Eggs, weighed in shell', g: 150 },
        { n: 'Plain flour', g: 95 },
        { n: 'Black cocoa', g: 35 },
        { n: 'Espresso powder', g: 4 },
        { n: 'Smoked salt', g: 3 }
      ],
      spices: [
        { n: 'Black cocoa', share: 55, colour: '#4a2a20' },
        { n: 'Espresso', share: 25, colour: '#7d2b2b' },
        { n: 'Smoked salt', share: 20, colour: '#b98b4a' }
      ],
      blendSub: 'No. 04 · the grave-dirt mix',
      blendNote: 'Black cocoa is not a spice, but it behaves like one: it takes the sweetness out of the room and leaves the smoke behind. The espresso is there to make the chocolate taste more like itself.',
      blendTitle: 'BLEND NO. 04',
      temp: '175 °C',
      time: '28 min',
      note: 'Doubling this recipe means two trays, not one deeper pan. The oven time stays the same; the second tray goes in after the first comes out, and the batter waits in the fridge.'
    },
    boule: {
      name: 'Pumpkin Rye Boule',
      sub: '1 loaf · about 1.14 kg',
      yieldOne: 1,
      yieldUnit: 'loaf',
      yieldPlural: 'loaves',
      flour: 500,
      ingredients: [
        { n: 'Rye flour', g: 300 },
        { n: 'Bread flour', g: 200 },
        { n: 'Roasted pumpkin', g: 250 },
        { n: 'Water, 24 °C', g: 210 },
        { n: 'Levain, 100% hydration', g: 100 },
        { n: 'Pumpkin seeds', g: 60 },
        { n: 'Fine salt', g: 11 },
        { n: 'Spice mix', g: 6 }
      ],
      spices: [
        { n: 'Cassia', share: 55, colour: '#7d3a22' },
        { n: 'Ginger', share: 30, colour: '#b98b4a' },
        { n: 'Clove', share: 15, colour: '#4a2a20' }
      ],
      blendSub: 'No. 07 · the pumpkin mix',
      blendNote: 'Cassia rather than true cinnamon, because the loaf needs the louder bark. Ginger goes in at half the cassia, clove at half again. More clove than that and the bread tastes like a dentist’s waiting room.',
      blendTitle: 'BLEND NO. 07',
      temp: '245 °C',
      time: '45 min',
      note: 'Two boules means two bannetons and two loads of steam. Bake them one at a time: the second proof holds in the fridge for an hour, and the oven needs twenty minutes to come back.'
    },
    buns: {
      name: 'Banshee Buns',
      sub: '12 buns · one tray',
      yieldOne: 12,
      yieldUnit: 'bun',
      yieldPlural: 'buns',
      flour: 500,
      ingredients: [
        { n: 'Bread flour', g: 500 },
        { n: 'Whole milk, 26 °C', g: 250 },
        { n: 'Butter, soft', g: 100 },
        { n: 'Caster sugar', g: 60 },
        { n: 'Fresh yeast', g: 8 },
        { n: 'Fine salt', g: 6 },
        { n: 'Cardamom, ground', g: 6 },
        { n: 'Filling: butter', g: 80 },
        { n: 'Filling: caster sugar', g: 80 },
        { n: 'Filling: cardamom', g: 4 },
        { n: 'Pearl sugar, to finish', g: 30 }
      ],
      spices: [
        { n: 'Cardamom, dough', share: 60, colour: '#6b7a52' },
        { n: 'Cardamom, filling', share: 40, colour: '#94a06f' }
      ],
      blendSub: 'No. 11 · cardamom, twice',
      blendNote: 'Cardamom in the dough and cardamom in the filling. Grind it the morning you bake: pre-ground cardamom is mostly dust and regret. The two shares are counted together here, which is why the jar looks so green.',
      blendTitle: 'BLEND NO. 11',
      temp: '200 °C',
      time: '18 min',
      note: 'One tray of twelve fits on the middle shelf. A double batch needs two trays, rotated halfway through, and the second tray will brown faster because the oven is already hot.'
    },
    bones: {
      name: 'Ossuary Shortbread',
      sub: '16 bones · about 600 g of dough',
      yieldOne: 16,
      yieldUnit: 'bone',
      yieldPlural: 'bones',
      flour: 300,
      ingredients: [
        { n: 'Plain flour', g: 250 },
        { n: 'Rice flour', g: 50 },
        { n: 'Butter, cold', g: 200 },
        { n: 'Caster sugar', g: 70 },
        { n: 'Fine salt', g: 2 },
        { n: 'Black sesame, toasted', g: 20 },
        { n: 'Rosemary, finely chopped', g: 3 }
      ],
      spices: [
        { n: 'Black sesame', share: 85, colour: '#2f2a24' },
        { n: 'Rosemary', share: 15, colour: '#6b7a52' }
      ],
      blendSub: 'No. 02 · the ossuary mix',
      blendNote: 'Black sesame and rosemary, ground together until the rosemary disappears. You want the resin, not the needles. The sesame is there for the look of old stone and the slight bitterness that keeps the sugar honest.',
      blendTitle: 'BLEND NO. 02',
      temp: '160 °C',
      time: '32 min',
      note: 'Shortbread tolerates a crowd: two trays fit at once, but swap the shelves at the halfway mark. The dough must stay cold, so roll and cut one batch at a time and keep the rest in the fridge.'
    }
  };

  var ledger = document.getElementById('ingredients');
  if (ledger) {
    var state = { recipe: 'brownies', batch: 1 };

    var out = {
      title: document.getElementById('recipe-title'),
      sub: document.getElementById('recipe-sub'),
      ingredients: document.getElementById('ingredients'),
      total: document.getElementById('total-weight'),
      temp: document.getElementById('oven-temp'),
      time: document.getElementById('oven-time'),
      yield: document.getElementById('oven-yield'),
      note: document.getElementById('ledger-note'),
      blendSub: document.getElementById('blend-sub'),
      spices: document.getElementById('spices'),
      blendNote: document.getElementById('blend-note'),
      spiceWeight: document.getElementById('spice-weight'),
      batchOut: document.getElementById('batch-out'),
      track: document.getElementById('batch-track'),
      minus: document.getElementById('batch-minus'),
      plus: document.getElementById('batch-plus'),
      jarTitle: document.getElementById('jar-title')
    };

    function fmt(n) {
      var r = Math.round(n);
      return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function render() {
      var r = RECIPES[state.recipe];
      var b = state.batch;

      out.title.textContent = r.name;
      out.sub.textContent = r.sub;

      while (out.ingredients.firstChild) out.ingredients.removeChild(out.ingredients.firstChild);
      var total = 0;
      r.ingredients.forEach(function (ing) {
        var grams = ing.g * b;
        total += grams;
        var tr = document.createElement('tr');
        var td1 = document.createElement('td');
        td1.textContent = ing.n;
        var td2 = document.createElement('td');
        td2.appendChild(document.createTextNode(fmt(grams) + ' g'));
        var pct = document.createElement('span');
        pct.className = 'pct';
        pct.textContent = Math.round(ing.g / r.flour * 100) + '%';
        td2.appendChild(pct);
        tr.appendChild(td1);
        tr.appendChild(td2);
        out.ingredients.appendChild(tr);
      });

      out.total.textContent = fmt(total) + ' g';
      out.temp.textContent = r.temp;
      out.time.textContent = r.time;
      var yieldCount = r.yieldOne * b;
      out.yield.textContent = fmt(yieldCount) + ' ' + (yieldCount === 1 ? r.yieldUnit : r.yieldPlural);
      out.note.textContent = r.note;

      out.blendSub.textContent = r.blendSub;
      while (out.spices.firstChild) out.spices.removeChild(out.spices.firstChild);
      r.spices.forEach(function (sp) {
        var tr = document.createElement('tr');
        var td1 = document.createElement('td');
        td1.textContent = sp.n;
        var td2 = document.createElement('td');
        td2.textContent = sp.share + '%';
        tr.appendChild(td1);
        tr.appendChild(td2);
        out.spices.appendChild(tr);
      });
      out.blendNote.textContent = r.blendNote;

      // spice weight is the sum of the spice-ish ingredients of that recipe
      var spiceGrams = r.ingredients.filter(function (ing) {
        return /cocoa|espresso|salt|spice|cardamom|sesame|rosemary|clove|ginger|cassia/i.test(ing.n);
      }).reduce(function (a, ing) { return a + ing.g; }, 0);
      out.spiceWeight.textContent = fmt(spiceGrams * b) + ' g';

      out.batchOut.textContent = String(b);

      // jar layers, stacked from the bottom in the order listed
      var jarTop = 66;
      var jarHeight = 154;
      var cursor = jarTop + jarHeight;
      for (var li = 0; li < 3; li++) {
        var lrect = document.getElementById('jar-l' + (li + 1));
        if (!lrect) continue;
        var sp = r.spices[li];
        if (!sp) { lrect.setAttribute('height', '0'); lrect.setAttribute('y', String(cursor)); continue; }
        var h = Math.round(jarHeight * sp.share / 100);
        lrect.setAttribute('height', String(h));
        lrect.setAttribute('y', String(cursor - h));
        lrect.setAttribute('fill', sp.colour);
        cursor -= h;
      }

      // batch pips
      if (out.track) {
        while (out.track.firstChild) out.track.removeChild(out.track.firstChild);
        for (var i = 0; i < 6; i++) {
          var pip = document.createElement('i');
          if (i < b) pip.className = 'on';
          out.track.appendChild(pip);
        }
      }
      if (out.minus) out.minus.disabled = b <= 1;
      if (out.plus) out.plus.disabled = b >= 6;

      window.__ledger = { recipe: state.recipe, batch: b, total: Math.round(total), yield: r.yieldOne * b };
      if (out.jarTitle) {
        out.jarTitle.textContent = 'A jar of ' + r.blendSub.split('·').pop().trim() + ', layered in proportion to the recipe';
      }
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-recipe]'), function (btn) {
      btn.addEventListener('click', function () {
        state.recipe = btn.getAttribute('data-recipe');
        Array.prototype.forEach.call(document.querySelectorAll('[data-recipe]'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        render();
      });
    });

    if (out.minus) out.minus.addEventListener('click', function () { if (state.batch > 1) { state.batch -= 1; render(); } });
    if (out.plus) out.plus.addEventListener('click', function () { if (state.batch < 6) { state.batch += 1; render(); } });

    render();
  }

  /* --------------------------------------------------------- contact form */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var success = document.getElementById('sent');
    var detail = document.getElementById('sent-detail');
    var ref = document.getElementById('sent-ref');
    var live = document.getElementById('form-status');

    var checks = [
      { id: 'b-name', test: function (v) { return v.trim().length >= 2; }, msg: 'Please give a name to answer.' },
      { id: 'b-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email address looks incomplete.' },
      { id: 'b-type', test: function (v) { return Boolean(v); }, msg: 'Choose the kind of order.' },
      { id: 'b-date', test: function (v) { return Boolean(v); }, msg: 'A date, even approximate, helps me say yes honestly.' },
      { id: 'b-message', test: function (v) { return v.trim().length >= 12; }, msg: 'Tell me what you need and how many people it is for.' }
    ];

    function wrapOf(el) { return el.closest('.field') || el.closest('.check'); }
    function setErr(el, msg) {
      var w = wrapOf(el);
      if (!w) return;
      w.classList.toggle('has-error', Boolean(msg));
      var e = w.querySelector('.err');
      if (e) e.textContent = msg || '';
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    checks.forEach(function (c) {
      var el = document.getElementById(c.id);
      if (!el) return;
      el.addEventListener('input', function () { if (wrapOf(el) && wrapOf(el).classList.contains('has-error')) setErr(el, ''); });
      el.addEventListener('change', function () { setErr(el, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      var vals = {};
      checks.forEach(function (c) {
        var el = document.getElementById(c.id);
        if (!el) return;
        vals[c.id] = el.value;
        var ok = c.test(el.value);
        setErr(el, ok ? '' : c.msg);
        if (!ok && !bad) bad = el;
      });
      var agree = document.getElementById('b-agree');
      var agreeOk = agree && agree.checked;
      if (agree) {
        var w = agree.closest('.check');
        if (w) w.classList.toggle('has-error', !agreeOk);
        if (!agreeOk && !bad) bad = agree;
      }
      if (bad) {
        bad.focus();
        if (live) live.textContent = 'The order was not sent. Check the marked fields.';
        return;
      }
      var sel = document.getElementById('b-type');
      var type = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : 'order';
      var when = vals['b-date'] ? new Date(vals['b-date'] + 'T12:00:00') : null;
      var whenText = when && !isNaN(when) ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'the date you gave';
      if (detail) {
        detail.textContent = 'Thank you, ' + vals['b-name'].trim().split(' ')[0] + '. I have your note about ' + type.toLowerCase() + ' for ' + whenText + '. I answer orders in the evening after the bake; if the date is inside a week, call the shop and I will pick up if my hands are clean.';
      }
      if (ref) ref.textContent = 'Reference CB-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      form.hidden = true;
      if (success) { success.hidden = false; success.focus(); }
      if (live) live.textContent = 'Order recorded on this page. No message has left the browser.';
    });
  }
})();
