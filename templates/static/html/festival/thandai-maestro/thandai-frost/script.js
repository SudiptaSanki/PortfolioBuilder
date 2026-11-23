/* Thandai Frost — nav, the batch scaler and the drawn glass. */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ============================================================
     The glass, drawn on canvas
     ============================================================ */
  var canvas = document.getElementById('glass');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var W = 420, H = 560;

  function setupCanvas() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function glassPath(c) {
    c.beginPath();
    c.moveTo(122, 44);
    c.lineTo(298, 44);
    c.bezierCurveTo(296, 220, 292, 400, 286, 496);
    c.quadraticCurveTo(284, 516, 264, 516);
    c.lineTo(156, 516);
    c.quadraticCurveTo(136, 516, 134, 496);
    c.bezierCurveTo(128, 400, 124, 220, 122, 44);
    c.closePath();
  }

  function drawGlass(base, ice, sweet) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    var palettes = {
      badam: ['#f6eeda', '#e6d6b6', '#cdb78c'],
      rose: ['#f7ebdf', '#e9cfc0', '#d3a795'],
      khus: ['#eef0e2', '#dbe0c8', '#bcc6a2'],
      melon: ['#f4eee0', '#ecd9c8', '#d9b7a3']
    };
    var p = palettes[base] || palettes.badam;

    /* shadow */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(210, 534, 74, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,52,58,.14)';
    ctx.fill();
    ctx.restore();

    /* glass body */
    ctx.save();
    glassPath(ctx);
    var g = ctx.createLinearGradient(0, 44, 0, 516);
    g.addColorStop(0, p[0]);
    g.addColorStop(.55, p[1]);
    g.addColorStop(1, p[2]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    /* liquid surface */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(210, 78, 88, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,253,246,.95)';
    ctx.fill();
    ctx.restore();

    /* ice */
    ctx.save();
    glassPath(ctx);
    ctx.clip();
    if (ice === 'crushed') {
      var cubes = [
        [150, 130, 34, 26, -.2], [206, 118, 30, 22, .3], [258, 146, 32, 24, -.1],
        [176, 190, 36, 26, .18], [236, 206, 28, 22, -.35], [148, 246, 30, 22, .22],
        [212, 268, 34, 24, -.15], [262, 232, 26, 20, .4], [186, 320, 30, 22, .1],
        [244, 330, 32, 24, -.25], [156, 372, 28, 20, .3], [222, 392, 30, 22, -.1]
      ];
      cubes.forEach(function (c) {
        ctx.save();
        ctx.translate(c[0], c[1]);
        ctx.rotate(c[4]);
        ctx.beginPath();
        ctx.roundRect(-c[2] / 2, -c[3] / 2, c[2], c[3], 5);
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });
    } else if (ice === 'block') {
      ctx.save();
      ctx.translate(210, 210);
      ctx.rotate(.07);
      ctx.beginPath();
      ctx.roundRect(-70, -62, 140, 124, 10);
      ctx.fillStyle = 'rgba(255,255,255,.42)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    /* garnish */
    ctx.save();
    var petals = base === 'rose' ? 2 : 1;
    for (var i = 0; i < petals; i++) {
      ctx.beginPath();
      ctx.ellipse(196 + i * 26, 70 - i * 4, 13, 7, -.4 + i * .3, 0, Math.PI * 2);
      ctx.fillStyle = base === 'rose' ? 'rgba(176,96,79,.9)' : 'rgba(111,138,99,.9)';
      ctx.fill();
    }
    for (var j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.ellipse(160 + j * 12, 76 - j * 2, 5, 3, .2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(111,138,99,.85)';
      ctx.fill();
    }
    ctx.restore();

    /* glass edges and highlights */
    ctx.save();
    glassPath(ctx);
    ctx.strokeStyle = 'rgba(20,52,58,.28)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(210, 44, 88, 12, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(20,52,58,.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(146, 96);
    ctx.bezierCurveTo(140, 200, 144, 340, 150, 470);
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    /* condensation */
    ctx.save();
    for (var k = 0; k < 14; k++) {
      var x = 133 + (k * 53) % 152;
      var y = 150 + ((k * 97) % 300);
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (k % 3) * .6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.fill();
    }
    ctx.restore();

    /* straw */
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(286, 26);
    ctx.lineTo(262, 190);
    ctx.strokeStyle = '#c07a2a';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(286, 26);
    ctx.lineTo(262, 190);
    ctx.strokeStyle = '#e2a869';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    /* sweetness: a faint tone band at the top of the liquid */
    if (sweet === 'rich') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(210, 112, 80, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,168,96,.28)';
      ctx.fill();
      ctx.restore();
    }
  }

  /* ============================================================
     Batch numbers
     ============================================================ */
  var PER_LITRE = {
    badam: { almonds: 40, magaz: 20, poppy: 10, fennel: 8, cardamom: 1.2, saffron: 0.4, pepper: 1, extra: 0, milk: 1000, chill: 4 },
    rose: { almonds: 30, magaz: 18, poppy: 8, fennel: 6, cardamom: 1, saffron: 0.3, pepper: 0.4, extra: 6, milk: 1000, chill: 4 },
    khus: { almonds: 30, magaz: 18, poppy: 8, fennel: 6, cardamom: 1.2, saffron: 0.2, pepper: 1, extra: 8, milk: 1000, chill: 4 },
    melon: { almonds: 20, magaz: 24, poppy: 6, fennel: 6, cardamom: 1, saffron: 0.2, pepper: 0.6, extra: 0, milk: 600, chill: 2 }
  };
  var EXTRA_LABEL = { rose: 'Dried rose petals', khus: 'Vetiver root', badam: '', melon: 'Watermelon pulp' };
  var SUGAR = { light: 60, classic: 90, rich: 120 };
  var BASE_LABEL = { badam: 'Badam', rose: 'Gulab', khus: 'Khus', melon: 'Tarbooz' };

  var form = document.getElementById('scalerForm');
  var range = document.getElementById('glasses');
  var glassesVal = document.getElementById('glassesVal');
  var rowsEl = document.getElementById('roRows');
  var titleEl = document.getElementById('roTitle');
  var chillEl = document.getElementById('roChill');
  var footEl = document.getElementById('roFoot');
  var glassNote = document.getElementById('glassNote');

  function grams(n) {
    if (n >= 10) return Math.round(n) + ' g';
    return (Math.round(n * 10) / 10).toFixed(1) + ' g';
  }

  function current(name, fallback) {
    var checked = form && form.querySelector('input[name="' + name + '"]:checked');
    if (checked) return checked.value;
    var sel = form && form.querySelector('select[name="' + name + '"]');
    return sel ? sel.value : fallback;
  }

  function render() {
    if (!form) return;
    var glasses = parseInt(range.value, 10);
    var base = current('base', 'badam');
    var sweet = current('sweet', 'classic');
    var ice = current('ice', 'crushed');
    var litres = glasses * 0.2;
    var r = PER_LITRE[base];
    var sugar = SUGAR[sweet] * litres;

    if (glassesVal) glassesVal.textContent = glasses;
    if (titleEl) titleEl.textContent = glasses + ' glasses · ' + (Math.round(litres * 10) / 10) + ' litres';
    if (chillEl) chillEl.textContent = 'Chill ' + (ice === 'none' ? r.chill + 2 : r.chill) + ' hr';

    var rows = [];
    rows.push(['Almonds, soaked', grams(r.almonds * litres)]);
    rows.push(['Melon seeds (magaz)', grams(r.magaz * litres)]);
    rows.push(['Poppy seeds', grams(r.poppy * litres)]);
    rows.push(['Fennel', grams(r.fennel * litres)]);
    rows.push(['Cardamom', grams(r.cardamom * litres)]);
    rows.push(['Saffron', grams(r.saffron * litres)]);
    rows.push(['Black pepper', grams(r.pepper * litres)]);
    if (r.extra) rows.push([EXTRA_LABEL[base], grams(r.extra * litres)]);
    rows.push(['Sugar (' + sweet + ')', grams(sugar)]);
    rows.push(['Full-fat milk', (r.milk * litres / 1000).toFixed(1) + ' L']);
    rows.push(['Crushed ice', ice === 'none' ? 'none — extra chill' : ice === 'block' ? 'one block per pot' : Math.round(glasses * 22) + ' g']);

    if (rowsEl) {
      rowsEl.innerHTML = rows.map(function (row) {
        return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td></tr>';
      }).join('');
    }

    if (footEl) {
      footEl.textContent = base === 'melon'
        ? 'Melon pulp goes in cold and last, or the drink separates. Soak only the seeds and nuts overnight.'
        : 'Soak the almonds, melon seeds and poppy seeds tonight. Everything else is ground fresh in the morning.';
    }
    if (glassNote) {
      glassNote.textContent = BASE_LABEL[base] + ' · ' + glasses + ' glasses · ' +
        (ice === 'none' ? 'no ice' : ice === 'block' ? 'one block' : 'crushed ice');
    }

    drawGlass(base, ice, sweet);
  }

  if (canvas && ctx) {
    setupCanvas();
    if (range) range.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('input', render);
    render();
    window.addEventListener('resize', function () { setupCanvas(); render(); });
  }
})();

/* ============================================================
   Pre-order form
   ============================================================ */
(function () {
  'use strict';
  var form = document.getElementById('orderForm');
  if (!form) return;
  var status = document.getElementById('formStatus');

  function setError(name, msg) {
    var field = form.elements[name];
    var slot = form.querySelector('.err[data-for="' + name + '"]');
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (slot) slot.textContent = msg || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = 0;
    var name = form.elements.name.value.trim();
    if (name.length < 2) { setError('name', 'A name for the order slip.'); errors++; } else setError('name', '');
    var phone = form.elements.phone.value.trim();
    if (phone.replace(/\D/g, '').length < 8) { setError('phone', 'A number the counter can call.'); errors++; } else setError('phone', '');
    var date = form.elements.date.value;
    if (!date) { setError('date', 'The date of collection or delivery.'); errors++; }
    else if (new Date(date + 'T00:00:00') < new Date(new Date().toDateString())) { setError('date', 'That date has passed.'); errors++; }
    else setError('date', '');
    var litres = parseFloat(form.elements.litres.value || '0');
    if (!litres || litres < 1) { setError('litres', 'At least one litre; four glasses.'); errors++; } else setError('litres', '');

    if (errors) {
      if (status) { status.className = 'form-status'; status.textContent = 'Two fields still need an answer.'; }
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var base = form.elements.base.value;
    if (status) {
      status.className = 'form-status ok';
      status.textContent = 'Noted, ' + name + '. ' + litres + ' litres of ' + base.toLowerCase() +
        ' thandai for ' + new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) +
        '. We will call ' + phone + ' the day before to confirm the clay pots.';
    }
    form.reset();
  });
})();

/* ============================================================
   Menu filter
   ============================================================ */
(function () {
  'use strict';
  var chips = document.querySelectorAll('.filters .chip');
  var rows = document.querySelectorAll('.menu .menu-row');
  var countEl = document.getElementById('menuCount');
  if (!chips.length || !rows.length) return;

  function apply(filter) {
    var shown = 0;
    rows.forEach(function (row) {
      var match = filter === 'all' || row.getAttribute('data-type') === filter;
      row.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === filter;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (countEl) countEl.textContent = shown + (shown === 1 ? ' item' : ' items');
  }

  chips.forEach(function (c) {
    c.setAttribute('aria-pressed', c.classList.contains('is-on') ? 'true' : 'false');
    c.addEventListener('click', function () { apply(c.getAttribute('data-filter')); });
  });
})();
