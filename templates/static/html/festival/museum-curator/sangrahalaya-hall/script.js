/* Sangrahalaya Hall — wall planner and page behaviour.
   A working gallery elevation, drawn in SVG, plus nav, reveal and the enquiry form. */
(function () {
  'use strict';

  /* ── nav & reveal ───────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        toggle.focus();
      }
    });
  }

  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── enquiry form ───────────────────────────────────────── */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function mark(field, ok) {
      var wrap = field.closest('.f');
      if (!wrap) return;
      wrap.classList.toggle('invalid', !ok);
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');
      var okName = name.value.trim().length > 1;
      var okEmail = emailRe.test(email.value.trim());
      var okMessage = message.value.trim().length > 5;
      mark(name, okName); mark(email, okEmail); mark(message, okMessage);
      if (!okName || !okEmail || !okMessage) {
        (!okName ? name : (!okEmail ? email : message)).focus();
        return;
      }
      var ok = document.getElementById('formOk');
      var who = name.value.trim().split(' ')[0].replace(/[<>&]/g, '');
      ok.innerHTML = '<strong>Thank you, ' + who + '.</strong> The enquiry is in the curator’s book. Ira reads these on Tuesday and Thursday mornings and will reply within three working days.';
      ok.classList.add('show');
      form.reset();
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    form.addEventListener('input', function (e) {
      var wrap = e.target.closest('.f');
      if (wrap && wrap.classList.contains('invalid')) {
        wrap.classList.remove('invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }
  /* ── wall planner ───────────────────────────────────────── */
  var wallEl = document.getElementById('wallW');
  if (!wallEl) return;

  var worksEl = document.getElementById('works');
  var sizesEl = document.getElementById('sizes');
  var arrEl = document.getElementById('arrangement');
  var eyeEl = document.getElementById('eye');
  var wallOut = document.getElementById('wallWOut');
  var worksOut = document.getElementById('worksOut');
  var eyeOut = document.getElementById('eyeOut');
  var elev = document.getElementById('elevation');
  var statUsed = document.getElementById('statUsed');
  var statGap = document.getElementById('statGap');
  var statFix = document.getElementById('statFix');
  var statHeight = document.getElementById('statHeight');
  var noteEl = document.getElementById('planNote');
  var resetEl = document.getElementById('resetPlan');

  var SIZES = {
    small: { w: 0.42, h: 0.52, name: 'small' },
    medium: { w: 0.62, h: 0.82, name: 'medium' },
    large: { w: 0.9, h: 1.2, name: 'large' },
    wide: { w: 1.1, h: 0.55, name: 'wide' }
  };
  var MIXED = ['medium', 'small', 'large', 'small', 'medium', 'wide', 'small', 'medium', 'small', 'large', 'small'];

  var VB_W = 920, VB_H = 430;
  var FLOOR = 378, EYE_SCALE = 95, WALL_TOP = 74; // 1 m = 95 px; wall drawn to 3.2 m
  var MARGIN_M = 0.6;                    // 30 cm each side
  var GAP_M = 0.4;                       // preferred 40 cm

  function pxH(m) { return m * EYE_SCALE; }

  function pickSizes(preset, n) {
    if (preset === 'mixed') {
      return MIXED.slice(0, n).map(function (k) { return SIZES[k]; });
    }
    var out = [];
    for (var i = 0; i < n; i++) out.push(SIZES[preset]);
    return out;
  }

  function layoutRow(items, usableM, gapM) {
    var sum = items.reduce(function (a, s) { return a + s.w; }, 0);
    var gap = gapM;
    var scale = 1;
    if (sum + gap * (items.length - 1) > usableM) {
      gap = (usableM - sum) / Math.max(1, items.length - 1);
      if (gap < 0.06) {
        gap = 0.06;
        scale = Math.max(0.2, (usableM - gap * (items.length - 1)) / sum);
      }
    }
    var used = sum * scale + gap * (items.length - 1);
    var x = (usableM - used) / 2;
    var placed = items.map(function (s) {
      var w = s.w * scale, h = s.h * scale;
      var p = { x: x, w: w, h: h, size: s.name };
      x += w + gap;
      return p;
    });
    return { placed: placed, gap: gap, scale: scale, used: used };
  }

  function render() {
    var wallW = parseFloat(wallEl.value);
    var count = parseInt(worksEl.value, 10);
    var eyeCm = parseInt(eyeEl.value, 10);
    var preset = sizesEl.value;
    var arrangement = arrEl.value;
    var items = pickSizes(preset, count);

    wallOut.textContent = wallW.toFixed(1) + ' m';
    worksOut.textContent = String(count);
    eyeOut.textContent = eyeCm + ' cm';

    var hs = Math.min(64, 820 / wallW);
    var x0 = (VB_W - wallW * hs) / 2;
    var eyeY = FLOOR - (eyeCm / 100) * EYE_SCALE;
    var usableM = wallW - MARGIN_M;
    var wallRight = x0 + wallW * hs;

    var frames = [];
    var gapUsed = GAP_M;
    var scaleUsed = 1;
    var twoLine = false;
    var note = '';

    function placeRow(placed, centreY, topAlignedBottom) {
      placed.forEach(function (p) {
        var h = pxH(p.h);
        var y = topAlignedBottom !== undefined ? topAlignedBottom - h : centreY - h / 2;
        frames.push({
          x: x0 + (wallW / 2 - usableM / 2 + p.x) * hs,
          y: y,
          w: p.w * hs,
          h: h,
          size: p.size,
          centre: FLOOR - (y + h / 2)
        });
      });
    }

    if (arrangement === 'two' && count > 3) {
      twoLine = true;
      var top = [], bottom = [];
      items.forEach(function (s, i) {
        if (s.name === 'small' || s.name === 'wide') top.push(s); else bottom.push(s);
      });
      if (top.length === 0) { top = items.filter(function (_, i) { return i % 2 === 0; }); bottom = items.filter(function (_, i) { return i % 2 === 1; }); }
      if (bottom.length === 0) { top = items.slice(0, Math.ceil(count / 2)); bottom = items.slice(Math.ceil(count / 2)); }
      var tf = layoutRow(top, usableM, GAP_M);
      var bf = layoutRow(bottom, usableM, GAP_M);
      gapUsed = Math.min(tf.gap, bf.gap);
      scaleUsed = Math.min(tf.scale, bf.scale);

      var maxBottomH = bf.placed.reduce(function (m, p) { return Math.max(m, pxH(p.h)); }, 0);
      var bottomTop = eyeY - maxBottomH / 2;
      var topBottom = bottomTop - 10;
      var minTopH = tf.placed.reduce(function (m, p) { return Math.max(m, pxH(p.h)); }, 0);
      if (topBottom - minTopH < WALL_TOP + 8) topBottom = WALL_TOP + 8 + minTopH;

      placeRow(tf.placed, 0, topBottom);
      placeRow(bf.placed, eyeY);
      note = 'The small works sit on the upper line, their bottoms ' +
        Math.max(0, Math.round((bottomTop - topBottom) / EYE_SCALE * 100)) + ' cm above the lower row.';
    } else {
      var row = layoutRow(items, usableM, GAP_M);
      gapUsed = row.gap;
      scaleUsed = row.scale;
      row.placed.forEach(function (p, i) {
        var h = pxH(p.h);
        var offset = arrangement === 'constellation'
          ? [-10, 12, -16, 8, 4, -6, 14, -12, 6, -4, 10][i % 11]
          : 0;
        frames.push({
          x: x0 + (wallW / 2 - usableM / 2 + p.x) * hs,
          y: eyeY - h / 2 + offset,
          w: p.w * hs,
          h: h,
          size: p.size,
          centre: FLOOR - (eyeY - h / 2 + offset + h / 2)
        });
      });
      note = arrangement === 'constellation'
        ? 'A constellation hang around the eye line: centres vary by up to 16 cm, gaps stay even.'
        : 'One line, centres at ' + eyeCm + ' cm, with ' + Math.round(row.gap * 100) + ' cm between frames.';
    }

    if (scaleUsed < 0.995) {
      note += ' Frames scaled to ' + Math.round(scaleUsed * 100) + ' per cent so the row fits.';
      if (scaleUsed < 0.6) note += ' That is smaller than a readable museum hang: fewer works, or a wider wall, would serve the objects better.';
    }

    /* ── draw ── */
    var usedMin = Math.min.apply(null, frames.map(function (f) { return f.x; }));
    var usedMax = Math.max.apply(null, frames.map(function (f) { return f.x + f.w; }));
    var usedM = (usedMax - usedMin) / hs;
    var heights = frames.map(function (f) { return Math.round((FLOOR - (f.y + f.h / 2)) / EYE_SCALE * 100); });
    var minH = Math.min.apply(null, heights);
    var maxH = Math.max.apply(null, heights);
    var fixings = frames.length * 2 + frames.filter(function (f) { return f.w / hs > 1; }).length;

    var s = '';
    s += '<svg viewBox="0 0 ' + VB_W + ' ' + VB_H + '" role="img" aria-label="Elevation of a ' +
      wallW.toFixed(1) + ' metre wall with ' + count + ' framed works hung to a ' + eyeCm + ' centimetre centre line.">';
    s += '<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<line x1="0" y1="0" x2="0" y2="8" stroke="rgba(34,33,28,.18)" stroke-width="1"/></pattern></defs>';

    /* wall surface */
    s += '<rect x="' + x0.toFixed(1) + '" y="' + WALL_TOP + '" width="' + (wallW * hs).toFixed(1) + '" height="' + (FLOOR - WALL_TOP) + '" fill="#f1ebdf" stroke="#55524a" stroke-width="1"/>';
    s += '<rect x="' + x0.toFixed(1) + '" y="' + WALL_TOP + '" width="' + (wallW * hs).toFixed(1) + '" height="' + (FLOOR - WALL_TOP) + '" fill="url(#hatch)" opacity=".35"/>';
    for (var m = 1; m < wallW; m++) {
      var gx = x0 + m * hs;
      s += '<line x1="' + gx.toFixed(1) + '" y1="' + WALL_TOP + '" x2="' + gx.toFixed(1) + '" y2="' + FLOOR + '" stroke="rgba(34,33,28,.08)" stroke-width=".7"/>';
      s += '<text x="' + gx.toFixed(1) + '" y="' + (FLOOR - 6) + '" text-anchor="middle" font-family="Geist Mono,monospace" font-size="7" fill="rgba(85,82,74,.65)">' + m + ' m</text>';
    }

    /* floor */
    s += '<line x1="' + (x0 - 26).toFixed(1) + '" y1="' + FLOOR + '" x2="' + (wallRight + 26).toFixed(1) + '" y2="' + FLOOR + '" stroke="#22211c" stroke-width="1.6"/>';
    s += '<rect x="' + (x0 - 26).toFixed(1) + '" y="' + FLOOR + '" width="' + (wallW * hs + 52).toFixed(1) + '" height="10" fill="url(#hatch)" opacity=".5"/>';

    s += '<text x="' + (x0 + 2).toFixed(1) + '" y="' + (WALL_TOP - 7) + '" font-family="Geist Mono,monospace" font-size="7" fill="rgba(85,82,74,.7)">CEILING 3.2 m</text>';

    /* eye line */
    s += '<line x1="' + (x0 - 16).toFixed(1) + '" y1="' + eyeY.toFixed(1) + '" x2="' + (wallRight + 16).toFixed(1) + '" y2="' + eyeY.toFixed(1) + '" stroke="#6d2b2b" stroke-width=".9" stroke-dasharray="5 5"/>';
    s += '<text x="' + (x0 - 20).toFixed(1) + '" y="' + (eyeY - 4).toFixed(1) + '" text-anchor="end" font-family="Geist Mono,monospace" font-size="8" fill="#6d2b2b">' + eyeCm + ' cm</text>';
    s += '<text x="' + (x0 - 20).toFixed(1) + '" y="' + (eyeY + 8).toFixed(1) + '" text-anchor="end" font-family="Geist Mono,monospace" font-size="7" fill="rgba(109,43,43,.7)">centre</text>';

    /* frames */
    frames.forEach(function (f, i) {
      var w = f.w, h = f.h, x = f.x, y = f.y;
      s += '<rect x="' + (x + 3).toFixed(1) + '" y="' + (y + 3).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="rgba(34,33,28,.12)"/>';
      s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="#faf6ec" stroke="#6d2b2b" stroke-width="1.1"/>';
      s += '<rect x="' + (x + Math.min(4, w * 0.12)).toFixed(1) + '" y="' + (y + Math.min(4, h * 0.12)).toFixed(1) + '" width="' + Math.max(1, w - Math.min(8, w * 0.24)).toFixed(1) + '" height="' + Math.max(1, h - Math.min(8, h * 0.24)).toFixed(1) + '" fill="none" stroke="rgba(34,33,28,.25)" stroke-width=".6"/>';
      if (w > 22 && h > 26) {
        s += '<line x1="' + (x + w * 0.3).toFixed(1) + '" y1="' + (y + h * 0.55).toFixed(1) + '" x2="' + (x + w * 0.7).toFixed(1) + '" y2="' + (y + h * 0.55).toFixed(1) + '" stroke="rgba(34,33,28,.22)" stroke-width=".7"/>';
      }
      s += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle" font-family="Geist Mono,monospace" font-size="6.5" fill="rgba(85,82,74,.8)">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</text>';
    });

    /* dimension line */
    s += '<line x1="' + x0.toFixed(1) + '" y1="410" x2="' + wallRight.toFixed(1) + '" y2="410" stroke="#55524a" stroke-width=".8"/>';
    s += '<line x1="' + x0.toFixed(1) + '" y1="405" x2="' + x0.toFixed(1) + '" y2="415" stroke="#55524a" stroke-width=".8"/>';
    s += '<line x1="' + wallRight.toFixed(1) + '" y1="405" x2="' + wallRight.toFixed(1) + '" y2="415" stroke="#55524a" stroke-width=".8"/>';
    s += '<text x="' + ((x0 + wallRight) / 2).toFixed(1) + '" y="' + 404 + '" text-anchor="middle" font-family="Geist Mono,monospace" font-size="8" fill="#55524a">' + wallW.toFixed(1) + ' m · wall</text>';

    s += '</svg>';
    elev.innerHTML = s;

    statUsed.textContent = usedM.toFixed(1) + ' of ' + wallW.toFixed(1) + ' m';
    statGap.textContent = Math.round(gapUsed * 100) + ' cm';
    statFix.textContent = String(fixings);
    statHeight.textContent = minH === maxH ? minH + ' cm' : minH + '–' + maxH + ' cm';
    noteEl.innerHTML = '<b>' + (twoLine ? 'Two lines.' : 'Plan.') + '</b> ' + note;
  }

  [wallEl, worksEl, sizesEl, arrEl, eyeEl].forEach(function (el) {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  if (resetEl) {
    resetEl.addEventListener('click', function () {
      wallEl.value = 10;
      worksEl.value = 7;
      sizesEl.value = 'mixed';
      arrEl.value = 'line';
      eyeEl.value = 150;
      render();
    });
  }

  render();


})();
