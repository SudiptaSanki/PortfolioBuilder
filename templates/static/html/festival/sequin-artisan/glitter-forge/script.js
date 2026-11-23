/* Glitter Forge — bench behaviour. No audio, no libraries. */
(function () {
  'use strict';

  /* ---------- shared chrome ---------- */
  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  var yr = document.getElementById('year');
  if (yr) yr.textContent = String(new Date().getFullYear());

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sequin drawing helpers ---------- */
  var FINISH = {
    gold:   { base: '#C9973E', light: '#F6D48C', dark: '#6E4C17' },
    silver: { base: '#B9BEC6', light: '#F3F6F8', dark: '#5C6470' },
    rose:   { base: '#C9798C', light: '#F7CBD5', dark: '#6B2F3E' }
  };

  function sequin(ctx, x, y, r, pal, tilt) {
    var shade = Math.random();
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.62 + 0.38 * Math.abs(tilt)), tilt * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = shade > 0.82 ? pal.light : (shade < 0.16 ? pal.dark : pal.base);
    ctx.globalAlpha = 0.86 + shade * 0.14;
    ctx.fill();
    ctx.globalAlpha = 1;
    // the lip of a cup sequin catches light along one side
    ctx.beginPath();
    ctx.ellipse(x - r * 0.16, y - r * 0.2, r * 0.78, r * 0.52, tilt * 0.6, Math.PI * 0.9, Math.PI * 1.9);
    ctx.strokeStyle = pal.light;
    ctx.lineWidth = Math.max(0.6, r * 0.32);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + r * 0.18, y + r * 0.22, Math.max(0.5, r * 0.16), 0, Math.PI * 2);
    ctx.fillStyle = pal.dark;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function paisleyMask(w, h) {
    var m = document.createElement('canvas');
    m.width = w; m.height = h;
    var c = m.getContext('2d');
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    c.save();
    c.translate(w * 0.5, h * 0.48);
    c.rotate(-0.2);
    var s = Math.min(w, h) * 0.0032;
    c.scale(s, s);
    c.strokeStyle = '#fff';
    c.lineJoin = 'round';
    c.lineCap = 'round';

    function drop() {
      c.beginPath();
      c.moveTo(0, -132);
      c.bezierCurveTo(96, -150, 148, -40, 96, 34);
      c.bezierCurveTo(58, 88, -16, 92, -50, 58);
      c.bezierCurveTo(-92, 14, -78, -66, -18, -104);
      c.bezierCurveTo(4, -118, 30, -112, 40, -92);
      c.bezierCurveTo(50, -70, 28, -50, 8, -56);
      c.bezierCurveTo(-14, -62, -30, -44, -26, -22);
      c.bezierCurveTo(-20, 8, 24, 12, 44, -12);
      c.bezierCurveTo(64, -36, 52, -82, 16, -96);
    }

    c.lineWidth = 20;
    drop();
    c.stroke();

    // the curled inner eye of the paisley, drawn once and left open
    c.beginPath();
    c.moveTo(12, -26);
    c.bezierCurveTo(-24, -16, -34, 12, -12, 28);
    c.bezierCurveTo(10, 44, 34, 24, 28, 4);
    c.lineWidth = 11;
    c.stroke();
    c.beginPath();
    c.arc(-6, 18, 4, 0, Math.PI * 2);
    c.fillStyle = '#fff';
    c.fill();

    c.restore();
    return m;
  }

  function vineMask(w, h) {
    var m = document.createElement('canvas');
    m.width = w; m.height = h;
    var c = m.getContext('2d');
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fff';
    c.lineCap = 'round';
    c.lineWidth = w * 0.075;
    c.beginPath();
    c.moveTo(w * 0.12, h * 0.88);
    c.bezierCurveTo(w * 0.5, h * 0.8, w * 0.16, h * 0.42, w * 0.5, h * 0.3);
    c.bezierCurveTo(w * 0.8, h * 0.2, w * 0.68, h * 0.06, w * 0.9, h * 0.08);
    c.stroke();
    c.fillStyle = '#fff';
    for (var i = 0; i < 7; i++) {
      var t = i / 6;
      var x = w * (0.16 + 0.68 * t);
      var y = h * (0.78 - 0.6 * t + 0.09 * Math.sin(t * 6.2));
      var r = w * (0.05 + 0.035 * Math.sin(i + 1));
      c.beginPath();
      c.ellipse(x, y, r * 1.5, r, (i % 2 ? 0.6 : -0.6), 0, Math.PI * 2);
      c.fill();
    }
    return m;
  }

  function starMask(w, h) {
    var m = document.createElement('canvas');
    m.width = w; m.height = h;
    var c = m.getContext('2d');
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fff';
    c.lineWidth = w * 0.012;
    c.beginPath();
    c.arc(w * 0.5, h * 0.48, w * 0.1, 0, Math.PI * 2);
    c.stroke();
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * Math.PI * 2;
      c.beginPath();
      c.moveTo(w * 0.5 + Math.cos(a) * w * 0.15, h * 0.48 + Math.sin(a) * w * 0.15);
      c.lineTo(w * 0.5 + Math.cos(a) * w * 0.34, h * 0.48 + Math.sin(a) * w * 0.34);
      c.lineWidth = w * 0.012;
      c.stroke();
    }
    c.lineWidth = w * 0.018;
    for (var j = 0; j < 5; j++) {
      var r2 = w * (0.13 + j * 0.055);
      c.beginPath();
      c.arc(w * 0.5, h * 0.48, r2, 0, Math.PI * 2);
      c.stroke();
    }
    return m;
  }

  function borderMask(w, h) {
    var m = document.createElement('canvas');
    m.width = w; m.height = h;
    var c = m.getContext('2d');
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fff';
    var b = w * 0.1;
    c.lineWidth = b * 0.55;
    c.strokeRect(b, b, w - b * 2, h - b * 2);
    c.lineWidth = b * 0.22;
    c.strokeRect(b * 1.9, b * 1.9, w - b * 3.8, h - b * 3.8);
    c.strokeRect(b * 0.35, b * 0.35, w - b * 0.7, h - b * 0.7);
    return m;
  }

  var MASK = { paisley: paisleyMask, vine: vineMask, star: starMask, border: borderMask };

  /* ---------- hero cloth ---------- */
  var cloth = document.getElementById('cloth');
  if (cloth) {
    var cc = cloth.getContext('2d');
    var CW = cloth.width, CH = cloth.height;
    var base = document.createElement('canvas');
    base.width = CW; base.height = CH;
    var bx = base.getContext('2d');

    // dyed silk
    var silk = bx.createLinearGradient(0, 0, CW, CH);
    silk.addColorStop(0, '#2A1B30');
    silk.addColorStop(0.55, '#1E1325');
    silk.addColorStop(1, '#251830');
    bx.fillStyle = silk;
    bx.fillRect(0, 0, CW, CH);
    bx.strokeStyle = 'rgba(241,231,216,0.035)';
    bx.lineWidth = 1;
    for (var gx = -CH; gx < CW + CH; gx += 7) {
      bx.beginPath();
      bx.moveTo(gx, 0);
      bx.lineTo(gx + CH, CH);
      bx.stroke();
    }

    var spots = [];
    var pal = FINISH.gold;
    var mask = paisleyMask(CW, CH);
    var mc = mask.getContext('2d').getImageData(0, 0, CW, CH).data;
    var step = 11;
    for (var y = 18; y < CH - 14; y += step) {
      for (var x = 18; x < CW - 14; x += step) {
        var idx = ((y | 0) * CW + (x | 0)) * 4;
        if (mc[idx] < 40) continue;
        var jx = x + (Math.random() - 0.5) * 6;
        var jy = y + (Math.random() - 0.5) * 6;
        sequin(bx, jx, jy, 3.1, pal, (Math.random() - 0.5) * 1.2);
        spots.push({ x: jx, y: jy });
      }
    }
    // scalloped border of badla along the cloth edge
    bx.strokeStyle = 'rgba(216,168,84,0.5)';
    bx.lineWidth = 1;
    bx.strokeRect(14.5, 14.5, CW - 29, CH - 29);
    bx.strokeStyle = 'rgba(216,168,84,0.22)';
    bx.strokeRect(20.5, 20.5, CW - 41, CH - 41);
    for (var yy = 26; yy < CH - 20; yy += 16) {
      bx.beginPath();
      bx.arc(24, yy + 8, 6, -Math.PI / 2, Math.PI / 2);
      bx.strokeStyle = 'rgba(216,168,84,0.45)';
      bx.stroke();
      bx.beginPath();
      bx.arc(CW - 24, yy + 8, 6, Math.PI / 2, Math.PI * 1.5);
      bx.stroke();
    }

    var clothCount = document.getElementById('cloth-count');
    if (clothCount) clothCount.textContent = spots.length.toLocaleString('en-IN') + ' sequins';
    var clothHours = document.getElementById('cloth-hours');
    if (clothHours) {
      var mins = Math.round((spots.length / 900) * 60);
      clothHours.textContent = (mins >= 60 ? Math.floor(mins / 60) + ' h ' + (mins % 60) + ' m' : mins + ' m') + ' at the bench';
    }

    var pointer = { x: -999, y: -999, on: false };
    cloth.addEventListener('pointermove', function (e) {
      var r = cloth.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * CW;
      pointer.y = ((e.clientY - r.top) / r.height) * CH;
      pointer.on = true;
    });
    cloth.addEventListener('pointerleave', function () { pointer.on = false; pointer.x = -999; });

    var t0 = performance.now();
    function drawCloth(now) {
      cc.clearRect(0, 0, CW, CH);
      cc.drawImage(base, 0, 0);
      var t = (now - t0) / 1000;
      // pin the light to the pointer, or drift it when idle
      var lx = pointer.on ? pointer.x : CW * (0.5 + 0.22 * Math.sin(t * 0.5));
      var ly = pointer.on ? pointer.y : CH * (0.42 + 0.16 * Math.cos(t * 0.42));
      for (var i = 0; i < spots.length; i++) {
        var p = spots[i];
        var d = Math.hypot(p.x - lx, p.y - ly);
        if (d > 130) continue;
        var k = 1 - d / 130;
        cc.beginPath();
        cc.arc(p.x, p.y, 2.6 + k * 1.9, 0, Math.PI * 2);
        cc.fillStyle = 'rgba(255,232,188,' + (0.16 + k * 0.3).toFixed(3) + ')';
        cc.fill();
      }
      if (!reduceMotion) requestAnimationFrame(drawCloth);
    }
    requestAnimationFrame(drawCloth);
    if (reduceMotion) {
      // one still frame, with the lamp light fixed
      cc.clearRect(0, 0, CW, CH);
      cc.drawImage(base, 0, 0);
    }
  }

  /* ---------- panel workbench ---------- */
  var form = document.getElementById('panel-form');
  if (form) {
    var state = { motif: 'paisley', size: 4, density: 48, finish: 'gold', w: 42, h: 58 };
    var pc = document.getElementById('panel-canvas');
    var ctx = pc.getContext('2d');
    var PW = pc.width, PH = 560;
    var fCount = document.getElementById('f-count');
    var fWeight = document.getElementById('f-weight');
    var fHours = document.getElementById('f-hours');
    var fMat = document.getElementById('f-mat');
    var fLab = document.getElementById('f-lab');
    var fTotal = document.getElementById('f-total');
    var label = document.getElementById('preview-label');
    var wOut = document.getElementById('w-out');
    var hOut = document.getElementById('h-out');
    var wRange = document.getElementById('panel-w');
    var hRange = document.getElementById('panel-h');
    var MASS = { 3: 0.012, 4: 0.02, 6: 0.045, 8: 0.08 };
    var RATE = { 3: 980, 4: 1240, 6: 1240, 8: 1700 };
    var DENS = { 3: 12.6, 4: 7.1, 6: 3.2, 8: 1.8 }; // sequins per cm² at 100% coverage

    function money(n) {
      return '₹' + Math.round(n).toLocaleString('en-IN');
    }
    function num(n) {
      return Math.round(n).toLocaleString('en-IN');
    }

    function paint() {
      var pal = FINISH[state.finish];
      ctx.clearRect(0, 0, PW, PH);
      var clothBg = ctx.createLinearGradient(0, 0, PW, PH);
      clothBg.addColorStop(0, '#241730');
      clothBg.addColorStop(1, '#1A1020');
      ctx.fillStyle = clothBg;
      ctx.fillRect(0, 0, PW, PH);
      ctx.strokeStyle = 'rgba(241,231,216,0.04)';
      ctx.lineWidth = 1;
      for (var g = -PH; g < PW + PH; g += 6) {
        ctx.beginPath();
        ctx.moveTo(g, 0);
        ctx.lineTo(g + PH, PH);
        ctx.stroke();
      }

      // the panel is drawn to scale: a 120 cm cloth shows smaller sequins than a 20 cm sample
      var margin = 18;
      var scale = Math.min((PW - margin * 2) / state.w, (PH - margin * 2) / state.h);
      var pw = Math.round(state.w * scale);
      var ph = Math.round(state.h * scale);
      var ox = Math.round((PW - pw) / 2);
      var oy = Math.round((PH - ph) / 2);
      ctx.fillStyle = 'rgba(241,231,216,0.03)';
      ctx.fillRect(ox, oy, pw, ph);
      ctx.strokeStyle = 'rgba(216,168,84,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + 0.5, oy + 0.5, pw - 1, ph - 1);

      var mask = MASK[state.motif](pw, ph);
      var data = mask.getContext('2d').getImageData(0, 0, pw, ph).data;
      var dCm = state.size / 10;
      var coverage = state.density / 100;
      var r = Math.max(1.4, (dCm * scale) / 2);
      var spacing = Math.max(dCm * scale / Math.sqrt(coverage), r * 1.35, 3.4);
      var drawn = 0;
      for (var y = spacing / 2; y < ph; y += spacing) {
        for (var x = spacing / 2; x < pw; x += spacing) {
          var i = ((y | 0) * pw + (x | 0)) * 4;
          if (data[i] < 40) continue;
          if (drawn > 5200) break;
          sequin(ctx, ox + x + (Math.random() - 0.5) * spacing * 0.3, oy + y + (Math.random() - 0.5) * spacing * 0.3, r, pal, (Math.random() - 0.5) * 1.2);
          drawn++;
        }
      }
      // stitched edge, so the cloth reads as cloth and not a sticker
      ctx.strokeStyle = 'rgba(216,168,84,0.5)';
      ctx.setLineDash([3, 4]);
      ctx.strokeRect(ox + 5.5, oy + 5.5, pw - 11, ph - 11);
      ctx.setLineDash([]);

      // the arithmetic behind the figures
      var area = state.w * state.h;
      var count = Math.round(area * DENS[state.size] * coverage);
      var weight = count * MASS[state.size];
      var hours = count / 900;
      var mat = (count / 1000) * RATE[state.size];
      var lab = hours * 320;
      var total = mat + lab;

      fCount.textContent = num(count);
      fWeight.textContent = (weight < 100 ? Math.round(weight) : Math.round(weight)) + ' g';
      fHours.textContent = hours.toFixed(1) + ' h';
      fMat.textContent = money(mat);
      fLab.textContent = money(lab);
      fTotal.textContent = money(total);

      var names = { paisley: 'Paisley', vine: 'Vine', star: 'Star field', border: 'Border' };
      var den = { 22: 'scattered', 48: 'even', 72: 'dense', 92: 'solid' };
      label.textContent = names[state.motif] + ' · ' + state.w + ' × ' + state.h + ' cm · ' + den[state.density];
      wOut.textContent = String(state.w);
      hOut.textContent = String(state.h);
    }

    form.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      if (b.dataset.motif) state.motif = b.dataset.motif;
      if (b.dataset.size) state.size = Number(b.dataset.size);
      if (b.dataset.density) state.density = Number(b.dataset.density);
      if (b.dataset.finish) state.finish = b.dataset.finish;
      var group = b.parentElement;
      Array.prototype.forEach.call(group.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      paint();
    });

    wRange.addEventListener('input', function () { state.w = Number(wRange.value); paint(); });
    hRange.addEventListener('input', function () { state.h = Number(hRange.value); paint(); });

    paint();
  }

  /* ---------- order book filters ---------- */
  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var empty = document.querySelector('.empty-note');
    filterBar.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var f = b.dataset.filter;
      Array.prototype.forEach.call(filterBar.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      Array.prototype.forEach.call(document.querySelectorAll('.entry'), function (entry) {
        var show = f === 'all' || entry.dataset.type === f;
        entry.hidden = !show;
        if (show) shown++;
      });
      if (empty) empty.classList.toggle('on', shown === 0);
    });
  }

  /* ---------- commission form ---------- */
  var comm = document.getElementById('commission-form');
  if (comm) {
    var sent = document.getElementById('sent');
    var sentName = document.getElementById('sent-name');
    var fields = [
      { id: 'c-name', msg: 'Tell me who I am writing back to.' },
      { id: 'c-email', msg: 'An email address, so the reply reaches you.', email: true },
      { id: 'c-occasion', msg: 'What is the cloth for?' },
      { id: 'c-deadline', msg: 'A date, even an approximate one, so I can promise honestly.', date: true },
      { id: 'c-brief', msg: 'A few words on the motif, colours or reference.', min: 12 }
    ];
    var agree = document.getElementById('c-agree');

    function mark(field, bad) {
      var wrap = field.closest('.field') || field.closest('.check-wrap');
      if (wrap) wrap.classList.toggle('bad', bad);
    }

    comm.addEventListener('submit', function (e) {
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
        mark(el, bad);
        var err = el.closest('.field').querySelector('.err');
        if (err) err.textContent = bad ? f.msg : '';
        if (bad) ok = false;
        if (f.id === 'c-name') nameVal = v;
      });
      if (agree && !agree.checked) {
        ok = false;
        var aw = agree.closest('.check-wrap');
        if (aw) aw.classList.add('bad');
      }
      if (!ok) {
        var firstBad = comm.querySelector('.field.bad input, .field.bad textarea, .field.bad select');
        if (firstBad) firstBad.focus();
        return;
      }
      if (sentName) sentName.textContent = nameVal.split(' ')[0] || 'ji';
      comm.hidden = true;
      var head = comm.previousElementSibling;
      if (sent) {
        sent.hidden = false;
        sent.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });

    comm.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f && f.classList.contains('bad') && e.target.value.trim()) {
        var v = e.target.value.trim();
        var def = fields.filter(function (x) { return document.getElementById(x.id) === e.target; })[0];
        var stillBad = false;
        if (def && def.email) stillBad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (def && def.date) stillBad = !/^\d{4}-\d{2}-\d{2}$/.test(v);
        if (def && def.min) stillBad = v.length < def.min;
        if (!stillBad) {
          f.classList.remove('bad');
          var err = f.querySelector('.err');
          if (err) err.textContent = '';
        }
      }
      if (agree) {
        var aw = agree.closest('.check-wrap');
        if (aw && agree.checked) aw.classList.remove('bad');
      }
    });
  }
})();
