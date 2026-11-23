/* ============================================================
   Chitra Comic — page behaviour and the pacing bench
   Plain ES5-safe JavaScript. No libraries.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- chrome ---------- */

  var navBtn = document.getElementById('navBtn');
  if (navBtn) {
    navBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- contact form ---------- */

  var form = document.getElementById('contactForm');
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var note = document.getElementById('formNote');
    var errName = document.getElementById('errName');
    var errEmail = document.getElementById('errEmail');
    var errMsg = document.getElementById('errMsg');
    var mail = form.querySelector('#email');
    var name = form.querySelector('#name');
    var msg = form.querySelector('#message');

    function setErr(el, text) { if (el) el.textContent = text || ''; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      setErr(errName, '');
      setErr(errEmail, '');
      setErr(errMsg, '');

      if (!name.value.trim()) { setErr(errName, 'A name is needed for the reply.'); ok = false; }
      if (!emailRe.test(email.value.trim())) { setErr(errEmail, 'That address will bounce. Check the spelling.'); ok = false; }
      if (msg.value.trim().length < 12) { setErr(errMsg, 'A sentence or two is plenty — twelve characters at least.'); ok = false; }
      if (!form.querySelector('#consent').checked) { setErr(errMsg, 'Please tick the box so I know it is all right to write back.'); ok = false; }

      if (!ok) {
        var firstErr = form.querySelector('.err:not(:empty)');
        if (firstErr && firstErr.previousElementSibling) {
          var focusable = firstErr.parentElement.querySelector('input, textarea, select');
          if (focusable) focusable.focus();
        }
        return;
      }

      note.hidden = false;
      note.textContent = 'Thank you — the note is in the studio inbox. I answer letters on Tuesdays and Fridays, usually within three days.';
      form.reset();
    });
  }

  /* ---------- the pacing bench ---------- */

  var pageCanvas = document.getElementById('paceMap');
  var beatCanvas = document.getElementById('beatMap');
  if (!pageCanvas || !beatCanvas) return;

  var els = {
    panels: document.getElementById('panels'),
    gutter: document.getElementById('gutter'),
    words: document.getElementById('words'),
    wash: document.getElementById('wash'),
    spot: document.getElementById('spot'),
    panelsVal: document.getElementById('panelsVal'),
    gutterVal: document.getElementById('gutterVal'),
    wordsVal: document.getElementById('wordsVal'),
    outTime: document.getElementById('outTime'),
    outPanels: document.getElementById('outPanels'),
    outInk: document.getElementById('outInk'),
    outVerdict: document.getElementById('outVerdict'),
    outNote: document.getElementById('outNote')
  };

  var INK = '#17140f';
  var PAPER = '#f0e9d9';
  var VERM = '#c8452c';

  function setup(canvas, w, h) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return ctx;
  }

  /* Panel layout: one wide panel opens the page when the count is odd,
     then two-up rows. Each row keeps its own height weight so the page
     does not read as a spreadsheet. */
  function layout(n, g, W, H, pad) {
    var innerW = W - pad * 2;
    var innerH = H - pad * 2;
    var rows = [];
    var left = n;
    if (n % 2 === 1 && n > 1) { rows.push(1); left -= 1; }
    while (left > 0) { rows.push(left >= 2 ? 2 : 1); left -= (left >= 2 ? 2 : 1); }
    var weights = rows.map(function (c, i) {
      if (rows.length === 1) return 1;
      if (i === 0) return c === 1 ? 1.35 : 1.1;
      return i === rows.length - 1 ? 0.92 : 1;
    });
    var sumW = weights.reduce(function (a, b) { return a + b; }, 0);
    var gapTotal = g * (rows.length - 1);
    var rowH = (innerH - gapTotal) / sumW;
    var rects = [];
    var y = pad;
    var k = 1;
    rows.forEach(function (cols, ri) {
      var h = rowH * weights[ri];
      var colGap = g * (cols - 1);
      var w = (innerW - colGap) / cols;
      for (var c = 0; c < cols; c++) {
        rects.push({
          x: pad + c * (w + g),
          y: y,
          w: w,
          h: h,
          idx: k++
        });
      }
      y += h + g;
    });
    return rects;
  }

  /* Each panel gets a scene drawn to its own proportions: a horizon and
     a boat, a close-up profile, a window, two people talking, a doorway,
     or a small crowd. Caption boxes and balloons sit above the drawing. */
  function drawArt(ctx, r) {
    var cx = r.x + r.w * 0.5;
    var baseY = r.y + r.h * 0.86;
    var s = Math.min(r.w, r.h) * 0.46;
    var kind = ((r.idx - 1) % 6) + 1;
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';

    if (kind === 1) {
      /* horizon, a moored boat drawn solid, one figure standing in it */
      var hy = baseY - s * 0.34;
      ctx.beginPath(); ctx.moveTo(r.x + 10, hy); ctx.lineTo(r.x + r.w - 10, hy); ctx.stroke();
      /* hull: straight sheer line, curved bottom, filled */
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.86, hy + 4);
      ctx.lineTo(cx + s * 0.86, hy + 4);
      ctx.quadraticCurveTo(cx + s * 0.52, hy + 4 + s * 0.5, cx, hy + 4 + s * 0.5);
      ctx.quadraticCurveTo(cx - s * 0.52, hy + 4 + s * 0.5, cx - s * 0.86, hy + 4);
      ctx.closePath();
      ctx.fill();
      /* a standing figure with a pole */
      ctx.beginPath();
      ctx.arc(cx + s * 0.1, hy - s * 0.44, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(1.6, s * 0.07);
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.1, hy - s * 0.34);
      ctx.lineTo(cx + s * 0.1, hy + s * 0.08);
      ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.06, hy - s * 0.2);
      ctx.lineTo(cx + s * 0.34, hy - s * 0.62);
      ctx.stroke();
      /* water marks */
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(r.x + 14 + i * 12, hy + 30 + i * 8);
        ctx.lineTo(r.x + 14 + i * 12 + s * 0.55, hy + 30 + i * 8);
        ctx.stroke();
      }
    } else if (kind === 2) {
      /* close-up profile and shoulder */
      var hx = cx + s * 0.06, hy = baseY - s * 0.66;
      /* a head in profile: skull, brow, nose, chin, neck, shoulder */
      ctx.beginPath();
      ctx.moveTo(hx - s * 0.24, hy + s * 0.34);
      ctx.bezierCurveTo(hx - s * 0.34, hy - s * 0.02, hx - s * 0.18, hy - s * 0.36, hx + s * 0.04, hy - s * 0.38);
      ctx.bezierCurveTo(hx + s * 0.24, hy - s * 0.40, hx + s * 0.30, hy - s * 0.24, hx + s * 0.28, hy - s * 0.12);
      ctx.lineTo(hx + s * 0.34, hy + s * 0.02);
      ctx.lineTo(hx + s * 0.26, hy + s * 0.08);
      ctx.lineTo(hx + s * 0.26, hy + s * 0.22);
      ctx.quadraticCurveTo(hx + s * 0.20, hy + s * 0.30, hx + s * 0.16, hy + s * 0.30);
      ctx.lineTo(hx + s * 0.14, hy + s * 0.44);
      ctx.lineTo(hx - s * 0.06, hy + s * 0.44);
      ctx.quadraticCurveTo(hx - s * 0.20, hy + s * 0.40, hx - s * 0.24, hy + s * 0.34);
      ctx.stroke();
      /* eye and a hatched hair mass */
      ctx.beginPath();
      ctx.arc(hx + s * 0.12, hy - s * 0.08, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      for (var hh = 0; hh < 4; hh++) {
        ctx.beginPath();
        ctx.moveTo(hx - s * 0.20 + hh * s * 0.05, hy - s * 0.28 + hh * s * 0.02);
        ctx.lineTo(hx - s * 0.06 + hh * s * 0.05, hy - s * 0.34 + hh * s * 0.02);
        ctx.stroke();
      }
      ctx.lineWidth = 1.6;
      /* shoulders */
      ctx.beginPath();
      ctx.moveTo(hx - s * 0.52, baseY);
      ctx.quadraticCurveTo(hx - s * 0.1, baseY - s * 0.34, hx + s * 0.62, baseY);
      ctx.stroke();
    } else if (kind === 3) {
      /* a window with rain */
      var wx = r.x + r.w * 0.2, wy = r.y + r.h * 0.34, ww = r.w * 0.42, wh = r.h * 0.46;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
      ctx.moveTo(wx, wy + wh * 0.45); ctx.lineTo(wx + ww, wy + wh * 0.45);
      ctx.stroke();
      ctx.save();
      ctx.strokeStyle = 'rgba(36,53,107,0.65)';
      ctx.lineWidth = 1.2;
      for (var j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.moveTo(wx + 6 + j * 9, wy + 6);
        ctx.lineTo(wx + 4 + j * 9, wy + wh * 0.8);
        ctx.stroke();
      }
      ctx.restore();
      /* a cup on the sill */
      ctx.beginPath();
      ctx.moveTo(wx + ww + 10, wy + wh);
      ctx.quadraticCurveTo(wx + ww + 12, wy + wh - 16, wx + ww + 26, wy + wh - 16);
      ctx.quadraticCurveTo(wx + ww + 40, wy + wh - 16, wx + ww + 42, wy + wh);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 4) {
      /* two people and a table */
      var ay = baseY - s * 0.5;
      ctx.beginPath(); ctx.arc(cx - s * 0.5, ay, s * 0.14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + s * 0.5, ay - s * 0.06, s * 0.13, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.5, ay + s * 0.15); ctx.lineTo(cx - s * 0.5, baseY - 4);
      ctx.moveTo(cx + s * 0.5, ay + s * 0.1); ctx.lineTo(cx + s * 0.5, baseY - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.72, baseY - s * 0.18); ctx.lineTo(cx + s * 0.72, baseY - s * 0.18);
      ctx.stroke();
    } else if (kind === 5) {
      /* a doorway, someone leaving */
      var dx = cx - s * 0.34, dy = r.y + r.h * 0.36, dw = s * 0.68, dh = r.h * 0.46;
      ctx.strokeRect(dx, dy, dw, dh);
      ctx.fillStyle = 'rgba(23,20,15,0.82)';
      ctx.fillRect(dx + 3, dy + 3, dw * 0.36, dh - 3);
      ctx.beginPath();
      ctx.arc(dx + dw * 0.68, dy + dh * 0.34, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(dx + dw * 0.62, dy + dh * 0.46, s * 0.12, dh * 0.3);
    } else {
      /* a small crowd, heads and shoulders */
      for (var k = 0; k < 5; k++) {
        var px = cx - s * 0.9 + k * s * 0.45;
        var py = baseY - s * (k % 2 ? 0.34 : 0.44);
        ctx.beginPath(); ctx.arc(px, py, s * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(px - s * 0.1, py + s * 0.12, s * 0.2, s * 0.3);
      }
    }
  }

  function drawCaption(ctx, r, wordLines) {
    if (wordLines <= 0) return;
    var bw = Math.min(r.w * 0.56, 96);
    var bh = wordLines * 7 + 10;
    ctx.fillStyle = PAPER;
    ctx.fillRect(r.x + 7, r.y + 6, bw, bh);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(r.x + 7.5, r.y + 6.5, bw - 1, bh - 1);
    ctx.strokeStyle = 'rgba(23,20,15,0.62)';
    ctx.lineWidth = 1;
    for (var i = 0; i < wordLines; i++) {
      ctx.beginPath();
      ctx.moveTo(r.x + 13, r.y + 13 + i * 7);
      ctx.lineTo(r.x + 7 + bw - (i === wordLines - 1 ? 20 : 9), r.y + 13 + i * 7);
      ctx.stroke();
    }
  }

  function drawBalloon(ctx, r) {
    if (r.w < 90 || r.h < 70) return;
    var spotPanel = r.idx === 2;
    var bx = r.x + r.w - 52;
    var by = spotPanel ? r.y + r.h - 62 : r.y + 30;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(bx, by, 34, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    if (spotPanel) {
      ctx.moveTo(bx - 10, by - 16);
      ctx.lineTo(bx - 2, by - 34);
      ctx.lineTo(bx + 6, by - 15);
    } else {
      ctx.moveTo(bx - 12, by + 17);
      ctx.lineTo(bx - 4, by + 33);
      ctx.lineTo(bx + 4, by + 16);
    }
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(23,20,15,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - 22, by - 5); ctx.lineTo(bx + 22, by - 5);
    ctx.moveTo(bx - 26, by + 5); ctx.lineTo(bx + 12, by + 5);
    ctx.stroke();
  }

  var pageCtx = null;

  function drawPage(state) {
    var W = 640, H = 440, pad = 22;
    pageCtx = setup(pageCanvas, W, H);
    var ctx = pageCtx;

    /* paper and the fold */
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(23,20,15,0.16)';
    ctx.setLineDash([3, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 10);
    ctx.lineTo(W / 2, H - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    var rects = layout(state.panels, state.gutter, W, H, pad);
    var wordLines = Math.min(4, Math.ceil(state.words / 7));

    rects.forEach(function (r) {
      /* ink wash inside the panel, heavier at the bottom */
      if (state.wash) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();
        var grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
        grad.addColorStop(0, 'rgba(36,53,107,0.02)');
        grad.addColorStop(0.72, 'rgba(36,53,107,0.09)');
        grad.addColorStop(1, 'rgba(23,20,15,0.14)');
        ctx.fillStyle = grad;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = 'rgba(23,20,15,0.11)';
        for (var yy = r.y + 10; yy < r.y + r.h; yy += 11) {
          for (var xx = r.x + 10; xx < r.x + r.w; xx += 11) {
            var d = ((xx * 7 + yy * 3) % 11) / 11;
            if (yy > r.y + r.h * 0.62 && d > 0.35) {
              ctx.beginPath();
              ctx.arc(xx + d * 1.4, yy, 0.55 + d * 0.9, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.restore();
      }

      /* one panel carries the spot colour, as a hard diagonal wedge */
      if (state.spot && r.idx === 2) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();
        ctx.fillStyle = 'rgba(200,69,44,0.8)';
        ctx.beginPath();
        ctx.moveTo(r.x + r.w * 0.62, r.y);
        ctx.lineTo(r.x + r.w, r.y);
        ctx.lineTo(r.x + r.w, r.y + r.h * 0.62);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      drawArt(ctx, r);
      drawCaption(ctx, r, wordLines);
      if (state.words >= 10) drawBalloon(ctx, r);

      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.6;
      ctx.strokeRect(r.x + 1.3, r.y + 1.3, r.w - 2.6, r.h - 2.6);

      ctx.fillStyle = INK;
      ctx.font = '700 8px "Courier Prime", Courier, monospace';
      ctx.fillText(String(r.idx), r.x + 6, r.y + r.h - 6);
    });

    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, W - 12, H - 12);
  }

  function drawRhythm(holds) {
    var W = 640, H = 96;
    var c = setup(beatCanvas, W, H);
    var max = Math.max.apply(null, holds);
    var total = holds.reduce(function (a, b) { return a + b; }, 0);
    var x = 10;
    var usable = W - 20;
    c.font = '700 9px "Courier Prime", Courier, monospace';
    holds.forEach(function (h, i) {
      var w = Math.max(10, (h / total) * usable);
      var hgt = 34 + (h / max) * 30;
      c.fillStyle = i % 2 ? 'rgba(23,20,15,0.16)' : 'rgba(200,69,44,0.55)';
      c.fillRect(x, 54 - hgt, w - 3, hgt);
      c.strokeStyle = INK;
      c.lineWidth = 1.5;
      c.strokeRect(x, 54 - hgt, w - 3, hgt);
      c.fillStyle = INK;
      c.fillText(String(i + 1), x + 3, 68);
      c.fillText(h.toFixed(1) + 's', x + 3, 80);
      x += w;
    });
    c.strokeStyle = 'rgba(23,20,15,0.4)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(10, 56.5);
    c.lineTo(W - 10, 56.5);
    c.stroke();
  }

  function compute(state) {
    var perPanel = 1.05 + state.words / 3.2 + (state.wash ? 0.22 : 0);
    var total = perPanel * state.panels;
    var ink = 18 + state.panels * 3.4 + (state.wash ? 16 : 0) + (state.spot ? 5 : 0) + (state.gutter < 10 ? 6 : 0);
    ink = Math.min(74, Math.round(ink));

    var verdict, note;
    if (state.gutter <= 8) {
      verdict = 'tight';
      note = 'A gutter under ten pixels turns the page into a single texture. Use it only where you want the reader to feel crowded.';
    } else if (state.panels >= 8 && state.words > 18) {
      verdict = 'crowded';
      note = 'Nine or more panels each carrying a full caption asks the reader to do two jobs at once. Cut the words, or give the beat its own page.';
    } else if (total > 30) {
      verdict = 'slow';
      note = 'Over half a minute on one page is a deliberate pause. Fine for an ending, punishing in the middle of a chapter.';
    } else if (total < 8) {
      verdict = 'brisk';
      note = 'A page read in under eight seconds is a page the eye skims. If the moment matters, add a quiet panel rather than more words.';
    } else if (state.panels >= 7) {
      verdict = 'busy';
      note = 'Seven or more cuts keep the page moving; keep captions short so the eye is not reading while it is also crossing gutters.';
    } else {
      verdict = 'holds';
      note = 'A ' + state.panels + '-panel page at a ' + state.gutter + ' px gutter leaves the eye enough room to read the wash before the next cut.';
    }
    return { total: total, ink: ink, verdict: verdict, note: note, holds: new Array(state.panels).fill(perPanel) };
  }

  function readState() {
    return {
      panels: parseInt(els.panels.value, 10),
      gutter: parseInt(els.gutter.value, 10),
      words: parseInt(els.words.value, 10),
      wash: els.wash.checked,
      spot: els.spot.checked
    };
  }

  function render() {
    var state = readState();
    els.panelsVal.textContent = String(state.panels);
    els.gutterVal.textContent = state.gutter + ' px';
    els.wordsVal.textContent = String(state.words);

    var res = compute(state);
    els.outTime.textContent = res.total.toFixed(1);
    els.outPanels.textContent = String(state.panels);
    els.outInk.textContent = String(res.ink);
    els.outVerdict.textContent = res.verdict;
    els.outNote.textContent = res.note;

    drawPage(state);
    drawRhythm(res.holds);
  }

  ['change', 'input'].forEach(function (evt) {
    els.panels.addEventListener(evt, render);
    els.gutter.addEventListener(evt, render);
    els.words.addEventListener(evt, render);
    els.wash.addEventListener(evt, render);
    els.spot.addEventListener(evt, render);
  });

  var presets = {
    quiet: { panels: 3, gutter: 24, words: 6, wash: true, spot: false },
    action: { panels: 9, gutter: 6, words: 8, wash: false, spot: true },
    silent: { panels: 4, gutter: 18, words: 0, wash: true, spot: true }
  };

  var chips = document.querySelectorAll('[data-pace]');
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      var p = presets[chip.getAttribute('data-pace')];
      if (!p) return;
      els.panels.value = p.panels;
      els.gutter.value = p.gutter;
      els.words.value = p.words;
      els.wash.checked = p.wash;
      els.spot.checked = p.spot;
      render();
    });
  });

  render();

  /* a page that is not visible does not need redrawing; redraw once when
     the bench scrolls into view so the canvas is sharp on first sight */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { render(); io.disconnect(); }
      });
    }, { threshold: 0.05 });
    io.observe(pageCanvas);
  }
})();
