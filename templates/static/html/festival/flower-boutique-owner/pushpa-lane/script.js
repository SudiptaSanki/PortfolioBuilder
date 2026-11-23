/* Pushpa Lane — navigation, the bouquet bench, filters, form. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- navigation ---------------- */
  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- entrance ---------------- */
  var targets = doc.querySelectorAll('.reveal-on');
  if (targets.length) {
    if (reduce) targets.forEach(function (el) { el.classList.add('in'); });
    else {
      targets.forEach(function (el, i) {
        el.classList.add('reveal');
        el.style.transitionDelay = Math.min(i, 4) * 60 + 'ms';
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          targets.forEach(function (el) { el.classList.add('in'); });
        });
      });
    }
  }

  /* =========================================================
     THE BOUQUET BENCH
     ========================================================= */
  var canvas = doc.getElementById('bouquet');
  if (canvas) {
  var ctx = canvas.getContext('2d');
  var W = 480, H = 540;

  var STEMS = [
    { id: 'rose', name: 'Rose', color: '#c8506a', price: 120, type: 'rose' },
    { id: 'marigold', name: 'Marigold', color: '#e0962a', price: 40, type: 'round' },
    { id: 'jasmine', name: 'Jasmine', color: '#f6f1e0', price: 90, type: 'strand' },
    { id: 'tuberose', name: 'Tuberose', color: '#f8f4ea', price: 60, type: 'spike' },
    { id: 'eucalyptus', name: 'Eucalyptus', color: '#6f8f74', price: 70, type: 'leaf' },
    { id: 'orchid', name: 'Orchid', color: '#b78bc4', price: 250, type: 'orchid' },
    { id: 'sunflower', name: 'Sunflower', color: '#e2b23a', price: 150, type: 'sun' },
    { id: 'chrys', name: 'Chrysanth', color: '#e8c66a', price: 50, type: 'round' }
  ];
  var WRAPS = [
    { id: 'kraft', name: 'Kraft', color: '#c9a878', price: 0 },
    { id: 'blush', name: 'Blush', color: '#e0b3a6', price: 80 },
    { id: 'green', name: 'Green', color: '#3f5d45', price: 80 }
  ];
  var TIE = 200;
  var state = { items: [], wrap: WRAPS[0] };

  function stem(id) {
    for (var i = 0; i < STEMS.length; i++) if (STEMS[i].id === id) return STEMS[i];
    return STEMS[0];
  }
  function count(id) { return state.items.filter(function (x) { return x === id; }).length; }
  function subtotal() {
    return state.items.reduce(function (t, id) { return t + stem(id).price; }, 0);
  }
  function total() { return subtotal() + (state.items.length ? TIE + state.wrap.price : 0); }

  function bloom(x, y, r, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    var i, a;
    if (s.type === 'rose') {
      for (var ring = 3; ring >= 1; ring--) {
        for (var k = 0; k < 7; k++) {
          var pa = (k / 7) * Math.PI * 2 + ring * 0.4;
          ctx.save();
          ctx.rotate(pa);
          ctx.beginPath();
          ctx.fillStyle = ring === 3 ? '#b4435c' : (ring === 2 ? s.color : '#d46a80');
          ctx.ellipse(0, -r * (0.22 + ring * 0.2), r * (0.34 - ring * 0.06), r * (0.4 - ring * 0.07), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.beginPath();
      ctx.fillStyle = '#7e2f42';
      ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.type === 'round') {
      for (i = 0; i < 12; i++) {
        a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.ellipse(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.34, r * 0.34, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = '#8a5a1c';
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.type === 'strand') {
      for (i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.fillStyle = i % 2 ? s.color : '#e8e0c8';
        ctx.arc((i - 3) * r * 0.34, Math.sin(i) * r * 0.3, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (s.type === 'spike') {
      for (i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.fillStyle = i % 2 ? s.color : '#efe6cf';
        ctx.ellipse(0, -r * 0.7 + i * r * 0.24, r * 0.3, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (s.type === 'orchid') {
      for (i = 0; i < 5; i++) {
        a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.ellipse(0, -r * 0.62, r * 0.4, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.fillStyle = '#f0d27a';
      ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.type === 'sun') {
      for (i = 0; i < 16; i++) {
        a = (i / 16) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.fillStyle = i % 2 ? s.color : '#d7a02a';
        ctx.ellipse(0, -r * 0.72, r * 0.17, r * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.fillStyle = '#6b4a1c';
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      /* leaf sprig */
      for (i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.fillStyle = i % 2 ? s.color : '#87a58b';
        ctx.ellipse(0, -r * 0.5 - i * r * 0.36, r * 0.3, r * 0.16, (i % 2 ? 1 : -1) * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var cx = W / 2;
    var tieY = 318;
    var n = state.items.length;
    var spread = Math.min(1.45, 0.6 + n * 0.085);
    var blooms = [];
    var i, ang, len, bx, by;

    /* the bench line, faint */
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(251,246,238,.10)';
    ctx.lineWidth = 1;
    ctx.moveTo(28, H - 26);
    ctx.lineTo(W - 28, H - 26);
    ctx.stroke();

    /* paper: a fan behind the stems, gathered at the tie */
    var fanTop = 176;
    ctx.beginPath();
    ctx.moveTo(cx - 24, tieY + 34);
    ctx.bezierCurveTo(cx - 92, tieY - 10, cx - 128, fanTop + 40, cx - 126, fanTop);
    ctx.quadraticCurveTo(cx, fanTop - 34, cx + 126, fanTop);
    ctx.bezierCurveTo(cx + 128, fanTop + 40, cx + 92, tieY - 10, cx + 24, tieY + 34);
    ctx.closePath();
    ctx.fillStyle = state.wrap.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,26,20,.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    /* paper fold */
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,.32)';
    ctx.moveTo(cx - 6, tieY + 28);
    ctx.lineTo(cx - 10, fanTop + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(20,26,20,.18)';
    ctx.moveTo(cx + 58, tieY + 6);
    ctx.quadraticCurveTo(cx + 74, fanTop + 60, cx + 92, fanTop + 6);
    ctx.stroke();

    /* positions first, so stems can be drawn under the blooms */
    for (i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      ang = -spread + t * spread * 2;
      len = 196 - Math.abs(ang) * 30 + (i % 3) * 12;
      bx = cx + Math.sin(ang) * len;
      by = tieY - Math.cos(ang) * len;
      blooms.push({ x: bx, y: by, s: stem(state.items[i]), ang: ang, idx: i });
    }

    /* stems, cut long below the paper */
    blooms.forEach(function (b) {
      ctx.beginPath();
      ctx.strokeStyle = '#4f6b51';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.moveTo(b.x, b.y);
      ctx.bezierCurveTo(b.x * 0.6 + cx * 0.4, tieY - 40, cx + (b.idx % 2 ? 8 : -8), tieY + 40, cx + (b.idx - n / 2) * 5, H - 34);
      ctx.stroke();
    });

    /* filler foliage let out over the paper */
    for (var f = 0; f < 3; f++) {
      var fa = -0.5 + f * 0.5;
      var tipX = cx + Math.sin(fa) * 128;
      var tipY = tieY - Math.cos(fa) * 152;
      ctx.beginPath();
      ctx.strokeStyle = '#4f6b51';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.moveTo(cx, tieY + 20);
      ctx.quadraticCurveTo(cx + Math.sin(fa) * 40, tieY - 40, tipX, tipY);
      ctx.stroke();
      for (var lf = 0; lf < 3; lf++) {
        var lt = 0.45 + lf * 0.2;
        var lx = cx + (tipX - cx) * lt + (lf % 2 ? 9 : -9);
        var ly = tieY + 20 + (tipY - tieY - 20) * lt;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate((lf % 2 ? 1 : -1) * 0.75 + fa);
        ctx.beginPath();
        ctx.fillStyle = lf % 2 ? '#87a58b' : '#6f8f74';
        ctx.ellipse(0, 0, 13, 5.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* tie band */
    ctx.beginPath();
    ctx.fillStyle = '#233a2b';
    ctx.fillRect(cx - 34, tieY + 10, 68, 16);
    ctx.beginPath();
    ctx.strokeStyle = '#e9c86a';
    ctx.lineWidth = 2;
    ctx.moveTo(cx - 34, tieY + 18);
    ctx.lineTo(cx + 34, tieY + 18);
    ctx.stroke();
    /* ribbon bow */
    ctx.beginPath();
    ctx.fillStyle = '#e9c86a';
    ctx.ellipse(cx - 24, tieY + 34, 13, 7, -0.5, 0, Math.PI * 2);
    ctx.ellipse(cx + 24, tieY + 34, 13, 7, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#d9b45a';
    ctx.arc(cx, tieY + 30, 6, 0, Math.PI * 2);
    ctx.fill();

    /* blooms on top */
    blooms.sort(function (a, b) { return a.y - b.y; });
    blooms.forEach(function (b) {
      var r = b.s.type === 'rose' ? 26 : b.s.type === 'sun' ? 32 : b.s.type === 'orchid' ? 25 : 19;
      bloom(b.x, b.y, r, b.s, b.ang * 0.4);
    });

    /* label */
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(251,246,238,.5)';
    ctx.fillText(n ? n + ' STEMS · ' + state.wrap.name.toUpperCase() : 'BENCH EMPTY', 20, 26);
  }

  function renderOrder() {
    var list = doc.getElementById('orderRows');
    if (!list) return;
    if (!state.items.length) {
      list.innerHTML = '<div class="order-row"><span>Nothing on the bench yet. Add a stem to begin.</span></div>';
    } else {
      var ids = [];
      state.items.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      list.innerHTML = ids.map(function (id) {
        var s = stem(id);
        var q = count(id);
        return '<div class="order-row"><span>' + s.name + ' × ' + q + ' <button type="button" data-remove="' + id + '" aria-label="Remove one ' + s.name + '" style="background:none;border:0;color:inherit;cursor:pointer;font-family:inherit;font-size:13px;padding:0 4px">−</button></span><b>₹' + (s.price * q) + '</b></div>';
      }).join('');
      list.querySelectorAll('[data-remove]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-remove');
          var i = state.items.lastIndexOf(id);
          if (i > -1) state.items.splice(i, 1);
          renderAll();
        });
      });
    }
    var tie = doc.getElementById('orderTie');
    if (tie) tie.textContent = state.items.length ? '₹' + (TIE + state.wrap.price) : '₹0';
    var tot = doc.getElementById('orderTotal');
    if (tot) tot.textContent = '₹' + total();
    var cnt = doc.getElementById('stemCount');
    if (cnt) cnt.textContent = state.items.length + ' stems';
  }

  function renderAll() { renderOrder(); draw(); }

  var lib = doc.getElementById('stemList');
  if (lib) {
    lib.innerHTML = STEMS.map(function (s) {
      return '<button class="stem" type="button" data-stem="' + s.id + '">' +
        '<i style="background:' + s.color + '"></i>' +
        '<span><b>' + s.name + '</b><span>' + s.price + '</span></span>' +
        '<span class="rupee">₹' + s.price + '</span>' +
        '</button>';
    }).join('');
    lib.querySelectorAll('[data-stem]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (state.items.length >= 18) return;
        state.items.push(b.getAttribute('data-stem'));
        renderAll();
      });
    });
  }

  doc.querySelectorAll('.wrap-opt').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-wrap');
      WRAPS.forEach(function (w) { if (w.id === id) state.wrap = w; });
      doc.querySelectorAll('.wrap-opt').forEach(function (o) {
        o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
      });
      renderAll();
    });
  });

  var clear = doc.getElementById('benchClear');
  if (clear) {
    clear.addEventListener('click', function () {
      state.items = [];
      renderAll();
    });
  }

  var copy = doc.getElementById('benchCopy');
  if (copy) {
    copy.addEventListener('click', function () {
      var note = doc.getElementById('copyNote');
      if (!state.items.length) {
        if (note) note.textContent = 'Add a stem first.';
        return;
      }
      var lines = ['Pushpa Lane — bouquet request'];
      var ids = [];
      state.items.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      ids.forEach(function (id) {
        lines.push('· ' + stem(id).name + ' × ' + count(id) + ' — ₹' + (stem(id).price * count(id)));
      });
      lines.push('Wrap: ' + state.wrap.name + ' — ₹' + (TIE + state.wrap.price));
      lines.push('Total: ₹' + total());
      var text = lines.join('\n');
      var done = function () {
        if (note) note.textContent = 'Copied. Send it on WhatsApp and I will confirm.';
        copy.textContent = 'Copied';
        setTimeout(function () { copy.textContent = 'Copy order'; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          if (note) note.textContent = 'Select the summary and copy it by hand.';
        });
      } else {
        var ta = doc.createElement('textarea');
        ta.value = text;
        doc.body.appendChild(ta);
        ta.select();
        try { doc.execCommand('copy'); done(); } catch (e) { if (note) note.textContent = 'Select the summary and copy it by hand.'; }
        doc.body.removeChild(ta);
      }
    });
  }

  renderAll();

  }

  /* ---------------- archive filters ---------------- */
  var chips = doc.querySelectorAll('.chip[data-filter]');
  if (chips.length) {
    var items = doc.querySelectorAll('.work');
    var countEl = doc.getElementById('filterCount');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        items.forEach(function (w) {
          var match = want === 'all' || w.getAttribute('data-kind') === want;
          w.hidden = !match;
          if (match) shown++;
        });
        if (countEl) countEl.textContent = shown + ' of ' + items.length + ' commissions';
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
      var ok = true, firstBad = null;
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
          line.textContent = 'Thank you, ' + name + '. I have your note for ' + doc.getElementById('fDate').value +
            ' and will send a quote and two photographs of the flowers that morning.';
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
