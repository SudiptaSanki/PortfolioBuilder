/* Hongbao Press — the envelope press, canvas proof and page behaviour. Silent. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal ---------- */
  var targets = document.querySelectorAll('.plate, .plate-full, .craft-steps li, .proof, .press-controls, .side-note, .form-card, .side-info, .timeline li, .page-head .lead, .press-head');
  if ('IntersectionObserver' in window && !reduce) {
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- press room ---------- */
  var canvas = document.getElementById('envelope');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var W = 520, H = 720;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.aspectRatio = W + ' / ' + H;
    ctx.scale(dpr, dpr);

    var state = {
      surname: 'Chen',
      char: '福',
      word: 'fortune',
      foil: '#C9A227',
      foilName: 'Gold',
      pattern: 'cloud',
      qty: 1000
    };

    var R = { x: 40, y: 34, w: 440, h: 648 };

    function scallopRow(y, step, size) {
      ctx.beginPath();
      for (var x = R.x - step; x < R.x + R.w + step; x += step) {
        ctx.moveTo(x, y);
        ctx.arc(x + size, y, size, Math.PI, 0);
      }
      ctx.stroke();
    }

    function drawPattern() {
      ctx.save();
      ctx.beginPath();
      ctx.rect(R.x + 14, R.y + 14, R.w - 28, R.h - 28);
      ctx.clip();
      ctx.strokeStyle = state.foil;
      ctx.fillStyle = state.foil;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.22;

      if (state.pattern === 'cloud') {
        for (var y = R.y + 40; y < R.y + R.h; y += 76) {
          scallopRow(y, 66, 33);
          scallopRow(y + 26, 44, 22);
        }
      } else if (state.pattern === 'lattice') {
        ctx.lineWidth = 1.1;
        for (var d = -R.h; d < R.w + R.h; d += 46) {
          ctx.beginPath();
          ctx.moveTo(R.x + d, R.y);
          ctx.lineTo(R.x + d + R.h, R.y + R.h);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(R.x + d, R.y + R.h);
          ctx.lineTo(R.x + d + R.h, R.y);
          ctx.stroke();
        }
      } else if (state.pattern === 'plum') {
        var seed = 7;
        function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
        for (var i = 0; i < 34; i++) {
          var px = R.x + 30 + rand() * (R.w - 60);
          var py = R.y + 30 + rand() * (R.h - 60);
          var r = 4 + rand() * 4;
          for (var p = 0; p < 5; p++) {
            var a = (p / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(px + Math.cos(a) * r, py + Math.sin(a) * r, r * 0.72, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function spacedText(text, cx, y, spacing) {
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = spacing + 'px';
        var w = ctx.measureText(text).width;
        ctx.fillText(text, cx - (w - spacing) / 2, y);
        ctx.letterSpacing = '0px';
        return;
      }
      var chars = text.split('');
      var widths = chars.map(function (c) { return ctx.measureText(c).width; });
      var total = widths.reduce(function (a, b) { return a + b; }, 0) + spacing * (chars.length - 1);
      var x = cx - total / 2;
      chars.forEach(function (c, i) {
        ctx.fillText(c, x, y);
        x += widths[i] + spacing;
      });
    }

    function paint() {
      ctx.clearRect(0, 0, W, H);

      /* desk */
      ctx.fillStyle = '#DDD1BC';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(23,18,15,0.06)';
      ctx.lineWidth = 1;
      for (var g = 0; g < W; g += 22) {
        ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, H); ctx.stroke();
      }

      /* envelope */
      ctx.save();
      ctx.shadowColor = 'rgba(23, 18, 15, 0.32)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#B3272D';
      ctx.fillRect(R.x, R.y, R.w, R.h);
      ctx.restore();

      /* paper tooth */
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#2B0C0E';
      for (var i = 0; i < 1600; i++) {
        var sx = R.x + Math.random() * R.w;
        var sy = R.y + Math.random() * R.h;
        ctx.fillRect(sx, sy, 1, 1);
      }
      ctx.restore();

      drawPattern();

      /* borders */
      ctx.strokeStyle = state.foil;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(R.x + 22, R.y + 20, R.w - 44, R.h - 40);
      ctx.lineWidth = 0.9;
      ctx.strokeRect(R.x + 30, R.y + 28, R.w - 60, R.h - 56);

      /* corners */
      ctx.lineWidth = 2;
      var c = 16;
      [[R.x + 22, R.y + 20], [R.x + R.w - 22, R.y + 20], [R.x + 22, R.y + R.h - 20], [R.x + R.w - 22, R.y + R.h - 20]].forEach(function (p, idx) {
        var sx = idx % 2 === 0 ? 1 : -1;
        var sy = idx < 2 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(p[0] + sx * c, p[1]);
        ctx.lineTo(p[0], p[1]);
        ctx.lineTo(p[0], p[1] + sy * c);
        ctx.stroke();
      });

      /* roundel */
      var cx = 260, cy = 300;
      ctx.strokeStyle = state.foil;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(cx, cy, 118, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(cx, cy, 130, 0, Math.PI * 2); ctx.stroke();
      for (var t = 0; t < 24; t++) {
        var ta = (t / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ta) * 134, cy + Math.sin(ta) * 134);
        ctx.lineTo(cx + Math.cos(ta) * (t % 2 === 0 ? 142 : 138), cy + Math.sin(ta) * (t % 2 === 0 ? 142 : 138));
        ctx.lineWidth = t % 2 === 0 ? 1.6 : 0.8;
        ctx.stroke();
      }

      /* character */
      ctx.fillStyle = state.foil;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 148px "Noto Serif SC", "Songti SC", serif';
      ctx.fillText(state.char, cx, cy + 4);

      /* surname */
      ctx.font = '500 15px "Space Grotesk", sans-serif';
      ctx.textBaseline = 'alphabetic';
      var surname = (state.surname || '').trim().toUpperCase();
      if (surname) {
        spacedText('FOR THE ' + surname + ' FAMILY', cx, 478, 3.6);
        ctx.strokeStyle = state.foil;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - 70, 492);
        ctx.lineTo(cx + 70, 492);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      /* seal */
      ctx.save();
      ctx.translate(346, 560);
      ctx.rotate(-0.05);
      ctx.fillStyle = '#7C171C';
      ctx.fillRect(0, 0, 66, 66);
      ctx.strokeStyle = state.foil;
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 58, 58);
      ctx.fillStyle = '#EBD9B4';
      ctx.font = '600 19px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('吉', 33, 30);
      ctx.fillText('祥', 33, 54);
      ctx.restore();

      /* footer line */
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(235, 217, 180, 0.85)';
      ctx.font = '400 8px "Space Grotesk", sans-serif';
      ctx.fillText('HONGBAO PRESS · DIHUA ST, TAIPEI', R.x + 40, R.y + R.h - 34);
      ctx.textAlign = 'right';
      ctx.fillText('120 GSM · ' + state.foilName.toUpperCase() + ' FOIL', R.x + R.w - 40, R.y + R.h - 34);

      /* proof stamp */
      ctx.save();
      ctx.translate(120, 592);
      ctx.rotate(-0.28);
      ctx.strokeStyle = 'rgba(235, 217, 180, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-34, -14, 68, 28);
      ctx.fillStyle = 'rgba(235, 217, 180, 0.55)';
      ctx.font = '600 11px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PROOF', 0, 4);
      ctx.restore();
    }

    var codeEl = document.getElementById('proofCode');
    var qtyOut = document.getElementById('qtyOut');
    var liftsEl = document.getElementById('lifts');
    var passesEl = document.getElementById('passes');
    var estEl = document.getElementById('estimate');
    var noteEl = document.getElementById('pressNote');
    var statusEl = document.getElementById('pressStatus');

    function money(n) {
      return 'NT$ ' + Math.round(n).toLocaleString('en-US');
    }

    function rateFor(q) {
      if (q >= 10000) return 26;
      if (q >= 3000) return 30;
      if (q >= 1000) return 34;
      return 38;
    }

    function update() {
      codeEl.textContent = 'Plate ' + state.char + ' · ' + state.foilName;
      qtyOut.textContent = state.qty.toLocaleString('en-US');
      var lifts = Math.ceil(state.qty / 100);
      var passes = state.pattern === 'plain' ? 1 : 2;
      liftsEl.textContent = String(lifts);
      passesEl.textContent = String(passes);
      estEl.textContent = money(rateFor(state.qty) * state.qty);
      noteEl.textContent = state.qty.toLocaleString('en-US') + ' envelopes at 120 gsm, ' + state.foilName.toLowerCase() + ' foil, ' +
        passes + (passes === 1 ? ' pass' : ' passes') + ': ' + lifts + ' lifts of the platen and about ' +
        Math.max(7, Math.round(lifts / 1.2)) + ' working days from an approved proof.';
      canvas.setAttribute('aria-label', 'A red envelope proof with ' + state.foilName.toLowerCase() + ' foil, the character ' + state.char + ' for ' + state.word + ', a ' + state.pattern + ' pattern and the surname ' + (state.surname || 'blank'));
      paint();
    }

    var surnameInput = document.getElementById('surname');
    surnameInput.addEventListener('input', function () {
      state.surname = surnameInput.value;
      update();
    });

    document.querySelectorAll('.glyph').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.glyph').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.char = btn.dataset.char;
        state.word = btn.dataset.word;
        update();
      });
    });

    document.querySelectorAll('.foil').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.foil').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.foil = btn.dataset.foil;
        state.foilName = btn.dataset.name;
        update();
      });
    });

    document.querySelectorAll('input[name="hp-pattern"]').forEach(function (input) {
      input.addEventListener('change', function () {
        state.pattern = input.value;
        update();
      });
    });

    document.getElementById('qty').addEventListener('input', function (e) {
      state.qty = Number(e.target.value);
      update();
    });

    document.getElementById('proofBtn').addEventListener('click', function () {
      statusEl.textContent = 'Proof noted: ' + state.char + ' · ' + state.foilName.toLowerCase() + ' foil · ' + state.pattern + ' · ' +
        state.qty.toLocaleString('en-US') + ' envelopes · ' + (state.surname ? 'surname ' + state.surname : 'no surname') +
        ' · ' + money(rateFor(state.qty) * state.qty) + '. Send it through the commission form and I will cut a plate proof within four days.';
    });

    update();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { paint(); });
      if (document.fonts.load) {
        document.fonts.load('700 148px "Noto Serif SC"').then(function () { paint(); }).catch(function () {});
      }
    }
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('commission-form');
  if (form) {
    var status = document.getElementById('commission-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['name', 'email', 'date', 'message'].forEach(function (id) {
        var el = form.querySelector('#' + id);
        if (!el) return;
        var wrap = el.closest('.field');
        var valid = el.value.trim().length > 0;
        if (id === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        if (wrap) wrap.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        status.className = 'form-status err on';
        status.textContent = 'I need a name, an email, the date you need the envelopes by, and a line about the run.';
        return;
      }
      var name = form.querySelector('#name').value.trim().split(' ')[0];
      var qty = form.querySelector('#quantity');
      status.className = 'form-status on';
      status.textContent = 'Thank you, ' + name + '. ' + (qty && qty.value ? 'A run of ' + Number(qty.value).toLocaleString('en-US') + ' is noted. ' : '') + 'I answer commissions on Monday and Thursday, and the first thing I send is a plate proof, not an invoice.';
      form.reset();
    });
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
