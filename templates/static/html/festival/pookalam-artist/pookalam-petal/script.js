/* Pookalam Petal — navigation, the pookalam planner, filters, form. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- navigation ---------------- */
  var toggle = doc.querySelector('.nav-toggle');
  var navList = doc.querySelector('#nav ul');
  if (toggle && navList) {
    toggle.addEventListener('click', function () {
      var open = navList.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navList.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- entrance ---------------- */
  var targets = doc.querySelectorAll('.reveal-on');
  if (targets.length) {
    if (reduce) {
      targets.forEach(function (el) { el.classList.add('in'); });
    } else {
      targets.forEach(function (el, i) {
        el.classList.add('reveal');
        el.style.transitionDelay = Math.min(i, 4) * 70 + 'ms';
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          targets.forEach(function (el) { el.classList.add('in'); });
        });
      });
    }
  }

  /* =========================================================
     POOKALAM PLANNER
     ========================================================= */
  var canvas = doc.getElementById('pookalam');
  if (canvas) {

  var ctx = canvas.getContext('2d');
  var SIZE = 500;
  var RINGS = [
    { from: 34, to: 76, size: 15 },
    { from: 78, to: 126, size: 17 },
    { from: 128, to: 172, size: 18 },
    { from: 174, to: 210, size: 19 },
    { from: 212, to: 240, size: 20 }
  ];
  var FLOWERS = {
    marigold: { name: 'Marigold', petal: '#e0912a', dot: '#dd8a24', petals: 12 },
    thumba: { name: 'Thumba', petal: '#f7efd9', dot: '#f7efd9', petals: 6 },
    chethi: { name: 'Chethi', petal: '#b23a30', dot: '#b23a30', petals: 5 },
    aripoo: { name: 'Aripoo', petal: '#efe2c4', dot: '#efe2c4', petals: 8 },
    chrys: { name: 'Chrysanth', petal: '#e6b93c', dot: '#e6b93c', petals: 16 },
    hibiscus: { name: 'Hibiscus', petal: '#8e2b40', dot: '#8e2b40', petals: 5 },
    rose: { name: 'Rose', petal: '#d2708a', dot: '#d2708a', petals: 7 },
    leaf: { name: 'Leaf', petal: '#4c6d43', dot: '#4c6d43', petals: 4 }
  };
  var state = {
    active: 0,
    rings: ['marigold', 'thumba', 'chethi', 'chrys', 'marigold']
  };

  function flowerAt(x, y, r, key, rot) {
    var f = FLOWERS[key];
    var n = f.petals;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (key === 'leaf') {
      ctx.fillStyle = f.petal;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.15, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
    } else {
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = f.petal;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.52, r * 0.30, r * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(43,32,20,.22)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.fillStyle = key === 'thumba' || key === 'aripoo' ? '#d8a63a' : 'rgba(60,40,20,.55)';
      ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function ringCount(ring) {
    var mid = (ring.from + ring.to) / 2;
    return Math.max(8, Math.round((Math.PI * 2 * mid) / (ring.size * 2.05)));
  }

  function draw() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    var cx = SIZE / 2;
    var cy = SIZE / 2;

    /* banana-leaf ground */
    ctx.fillStyle = '#2f4a33';
    ctx.beginPath();
    ctx.arc(cx, cy, 246, 0, Math.PI * 2);
    ctx.fill();

    /* leaf veins */
    ctx.strokeStyle = 'rgba(215,231,196,.10)';
    ctx.lineWidth = 1;
    for (var v = 0; v < 36; v++) {
      var ang = (v / 36) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 40, cy + Math.sin(ang) * 40);
      ctx.lineTo(cx + Math.cos(ang) * 244, cy + Math.sin(ang) * 244);
      ctx.stroke();
    }

    for (var r = RINGS.length - 1; r >= 0; r--) {
      var ring = RINGS[r];
      var mid = (ring.from + ring.to) / 2;
      var n = ringCount(ring);
      var key = state.rings[r];
      /* a dark inter-ring line keeps the circles legible */
      ctx.beginPath();
      ctx.arc(cx, cy, ring.from - 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(20,34,22,.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + (r % 2 ? Math.PI / n : 0);
        flowerAt(cx + Math.cos(a) * mid, cy + Math.sin(a) * mid, ring.size / 2, key, a + Math.PI / 2);
      }
    }

    /* brass lamp at the centre */
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#b8862f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c06a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#7d3a1e';
    ctx.fill();
    /* oil lamps in four directions */
    for (var k = 0; k < 4; k++) {
      var ka = (k / 4) * Math.PI * 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ka) * 30, cy + Math.sin(ka) * 30, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f6dfa4';
      ctx.fill();
    }

    /* rim */
    ctx.beginPath();
    ctx.arc(cx, cy, 246, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(43,32,20,.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function refreshTally() {
    var rows = doc.getElementById('tallyRows');
    if (!rows) return;
    var total = 0;
    rows.innerHTML = state.rings.map(function (key, i) {
      var n = ringCount(RINGS[i]);
      total += n;
      return '<div class="tally-row"><span>Ring ' + (i + 1) + ' · ' + FLOWERS[key].name + '</span><b>' + n + ' markers</b></div>';
    }).join('');
    var totalEl = doc.getElementById('tallyTotal');
    if (totalEl) totalEl.textContent = total + ' markers';
    var baskets = doc.getElementById('tallyBaskets');
    if (baskets) baskets.textContent = '≈ ' + (total * 40).toLocaleString('en-IN') + ' flowers on the floor · ' + (2 + Math.round(total / 12)) + ' hours';
  }

  function refreshTabs() {
    var tabs = doc.querySelectorAll('.ring-tab');
    tabs.forEach(function (tab, i) {
      tab.setAttribute('aria-selected', i === state.active ? 'true' : 'false');
      var swatch = tab.querySelector('i');
      if (swatch) swatch.style.background = FLOWERS[state.rings[i]].dot;
    });
    var label = doc.getElementById('activeRing');
    if (label) label.textContent = 'Ring ' + (state.active + 1);
    var buttons = doc.querySelectorAll('.flower');
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-flower') === state.rings[state.active] ? 'true' : 'false');
    });
  }

  doc.querySelectorAll('.ring-tab').forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      state.active = i;
      refreshTabs();
    });
  });

  doc.querySelectorAll('.flower').forEach(function (b) {
    b.addEventListener('click', function () {
      state.rings[state.active] = b.getAttribute('data-flower');
      draw();
      refreshTally();
      refreshTabs();
    });
  });

  var reset = doc.getElementById('plannerReset');
  if (reset) {
    reset.addEventListener('click', function () {
      state.rings = ['marigold', 'thumba', 'chethi', 'chrys', 'marigold'];
      state.active = 0;
      draw();
      refreshTally();
      refreshTabs();
    });
  }

  var save = doc.getElementById('plannerSave');
  if (save) {
    save.addEventListener('click', function () {
      canvas.toBlob(function (blob) {
        if (!blob) return;
        var a = doc.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pookalam-plan-5-rings.png';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        save.textContent = 'Saved';
        setTimeout(function () { save.textContent = 'Save plan'; }, 2200);
      }, 'image/png');
    });
  }

  draw();
  refreshTally();
  refreshTabs();

  }

  /* ---------------- gallery filter ---------------- */
  var chips = doc.querySelectorAll('.chip[data-filter]');
  if (chips.length) {
    var works = doc.querySelectorAll('.work');
    var count = doc.getElementById('filterCount');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        works.forEach(function (w) {
          var match = want === 'all' || w.getAttribute('data-occasion') === want;
          w.hidden = !match;
          if (match) shown++;
        });
        if (count) count.textContent = shown + ' of ' + works.length + ' pookalams';
      });
    });
  }

  /* ---------------- enquiry form ---------------- */
  var form = doc.getElementById('commissionForm');
  if (form) {
    var fields = {
      name: { el: doc.getElementById('fName'), test: function (v) { return v.trim().length >= 2; } },
      email: { el: doc.getElementById('fEmail'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      date: { el: doc.getElementById('fDate'), test: function (v) { return v.trim().length > 0; } },
      brief: { el: doc.getElementById('fBrief'), test: function (v) { return v.trim().length >= 12; } }
    };
    var sent = doc.getElementById('sent');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var good = f.test(f.el.value);
        f.el.closest('.fld').classList.toggle('bad', !good);
        f.el.setAttribute('aria-invalid', good ? 'false' : 'true');
        if (!good && !firstBad) firstBad = f.el;
        if (!good) ok = false;
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var name = doc.getElementById('fName').value.trim().split(' ')[0];
      if (sent) {
        var line = doc.getElementById('sentLine');
        if (line) {
          line.textContent = 'Thank you, ' + name + '. I have your date (' + doc.getElementById('fDate').value +
            ') and the brief. I will write back within two days with the flower list and the price.';
        }
        sent.classList.add('show');
        sent.setAttribute('tabindex', '-1');
        sent.focus();
      }
      form.reset();
    });
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener('input', function () {
        fields[k].el.closest('.fld').classList.remove('bad');
      });
    });
  }
})();
