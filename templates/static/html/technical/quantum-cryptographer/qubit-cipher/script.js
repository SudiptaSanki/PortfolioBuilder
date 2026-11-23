/* Qubit Cipher — navigation, BB84 simulation, key tape, forms. */

(function () {
  'use strict';

  /* ---------- navigation ---------- */

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------- BB84 run ---------- */

  var qubitsEl = document.getElementById('qubits');
  if (qubitsEl) initBB84();

  function initBB84() {
    var eveEl = document.getElementById('eve');
    var noiseEl = document.getElementById('noise');
    var qubitsOut = document.getElementById('qubitsOut');
    var eveOut = document.getElementById('eveOut');
    var noiseOut = document.getElementById('noiseOut');
    var runHint = document.getElementById('runHint');
    var tape = document.getElementById('tapeCanvas');
    var verdict = document.getElementById('verdict');
    var verdictText = document.getElementById('verdictText');
    var outSifted = document.getElementById('outSifted');
    var outErrors = document.getElementById('outErrors');
    var outQber = document.getElementById('outQber');
    var outRate = document.getElementById('outRate');
    var outFinal = document.getElementById('outFinal');
    var simNote = document.getElementById('simNote');
    var rerun = document.getElementById('rerun');

    var THRESHOLD = 0.11;
    var run = 412;
    var state = null;

    function simulate() {
      var n = parseInt(qubitsEl.value, 10);
      var p = parseInt(eveEl.value, 10) / 100;
      var e = parseFloat(noiseEl.value) / 100;

      var rounds = [];
      var sifted = 0, errors = 0;

      for (var i = 0; i < n; i++) {
        var aBasis = Math.random() < 0.5 ? 0 : 1;
        var aBit = Math.random() < 0.5 ? 0 : 1;
        var tBasis = aBasis, tBit = aBit;
        var eveHit = false;

        if (Math.random() < p) {
          eveHit = true;
          var eBasis = Math.random() < 0.5 ? 0 : 1;
          if (eBasis !== aBasis) {
            tBit = Math.random() < 0.5 ? 0 : 1;
          }
          tBasis = eBasis;
        }

        var bBasis = Math.random() < 0.5 ? 0 : 1;
        var bBit;
        if (bBasis === tBasis) bBit = tBit;
        else bBit = Math.random() < 0.5 ? 0 : 1;

        if (Math.random() < e) bBit = 1 - bBit;

        var keep = bBasis === aBasis;
        var error = keep && bBit !== aBit;
        if (keep) {
          sifted++;
          if (error) errors++;
        }

        if (i < 40) {
          rounds.push({ aBasis: aBasis, aBit: aBit, bBasis: bBasis, bBit: bBit, keep: keep, error: error, eveHit: eveHit });
        }
      }

      var qber = sifted ? errors / sifted : 0;
      var h2 = 0;
      if (qber > 0 && qber < 1) h2 = -qber * Math.log2(qber) - (1 - qber) * Math.log2(1 - qber);
      var rate = qber < THRESHOLD ? Math.max(0, 1 - 2 * h2) : 0;
      var finalKey = Math.round(sifted * rate);

      return { n: n, p: p, e: e, rounds: rounds, sifted: sifted, errors: errors, qber: qber, h2: h2, rate: rate, finalKey: finalKey };
    }

    function drawTape(s) {
      var rect = tape.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      tape.width = Math.max(1, Math.round(rect.width * dpr));
      tape.height = Math.max(1, Math.round(rect.height * dpr));
      var ctx = tape.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f8f6f0';
      ctx.fillRect(0, 0, w, h);

      var left = 64, right = 12;
      var cols = w < 480 ? 14 : (w < 760 ? 24 : 40);
      var shown = s.rounds.slice(0, cols);
      cols = shown.length;
      var cw = (w - left - right) / cols;

      var top = h * 0.14;
      var gap = (h * 0.80) / 3.9;
      var rowsY = [top, top + gap, top + 2 * gap, top + 3 * gap];
      var errY = top + 3.7 * gap;
      var glyph = Math.min(6, cw * 0.24, h * 0.035);
      var fs = Math.max(6.5, Math.min(9, h * 0.048));

      shown.forEach(function (r, i) {
        if (!r.keep) {
          ctx.fillStyle = 'rgba(25, 26, 28, 0.045)';
          ctx.fillRect(left + i * cw, top - fs, cw, errY - top + fs * 1.6);
        }
      });

      ctx.strokeStyle = '#d7d2c4';
      ctx.lineWidth = 0.8;
      for (var i = 0; i <= cols; i += 5) {
        ctx.beginPath();
        ctx.moveTo(left + i * cw, top - fs);
        ctx.lineTo(left + i * cw, errY + fs);
        ctx.stroke();
      }

      ctx.font = fs + 'px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#7c7e82';
      ctx.textAlign = 'right';
      ctx.fillText('Alice · basis', left - 8, rowsY[0] + 2);
      ctx.fillText('Alice · bit', left - 8, rowsY[1] + 2);
      ctx.fillText('Bob · basis', left - 8, rowsY[2] + 2);
      ctx.fillText('Bob · bit', left - 8, rowsY[3] + 2);
      ctx.fillText('error', left - 8, errY + 2);

      ctx.textAlign = 'center';

      shown.forEach(function (r, idx) {
        var cx = left + idx * cw + cw / 2;

        ctx.strokeStyle = '#191a1c';
        ctx.lineWidth = 1;
        drawBasis(ctx, cx, rowsY[0], r.aBasis, glyph);
        drawBasis(ctx, cx, rowsY[2], r.bBasis, glyph * 0.85);

        ctx.beginPath();
        ctx.arc(cx, rowsY[1], glyph * 0.62, 0, Math.PI * 2);
        if (r.aBit === 1) { ctx.fillStyle = '#191a1c'; ctx.fill(); }
        else { ctx.strokeStyle = '#191a1c'; ctx.lineWidth = 1.1; ctx.stroke(); }

        ctx.beginPath();
        ctx.arc(cx, rowsY[3], glyph * 0.62, 0, Math.PI * 2);
        if (r.bBit === 1) { ctx.fillStyle = '#3b3f6b'; ctx.fill(); }
        else { ctx.strokeStyle = '#3b3f6b'; ctx.lineWidth = 1.1; ctx.stroke(); }

        if (r.error) {
          ctx.fillStyle = '#b3402a';
          ctx.fillRect(cx - 1.5, errY - 7, 3, 14);
        } else if (r.keep) {
          ctx.fillStyle = '#c2bcab';
          ctx.fillRect(cx - 1, errY - 1, 2, 2);
        }
      });

      ctx.strokeStyle = '#191a1c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top - fs * 1.4);
      ctx.lineTo(w - right, top - fs * 1.4);
      ctx.stroke();

      ctx.fillStyle = '#7c7e82';
      ctx.textAlign = 'left';
      ctx.font = fs + 'px "IBM Plex Mono", monospace';
      ctx.fillText('rounds 1–' + cols + ' of ' + s.n.toLocaleString('en-GB'), left, top - fs * 2.2);
      if (w > 640) {
        ctx.textAlign = 'right';
        ctx.fillText('shaded = basis mismatch, discarded', w - right, top - fs * 2.2);
      }
    }

    function drawBasis(ctx, x, y, basis, r) {
      ctx.beginPath();
      if (basis === 0) {
        ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
      } else {
        var d = r * 0.72;
        ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
        ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d);
      }
      ctx.stroke();
    }

    function update() {
      var s = simulate();
      state = s;

      qubitsOut.textContent = s.n.toLocaleString('en-GB');
      eveOut.textContent = Math.round(s.p * 100) + '%';
      noiseOut.textContent = (s.e * 100).toFixed(1) + '%';
      runHint.textContent = 'run ' + String(run).padStart(4, '0');

      outSifted.textContent = s.sifted.toLocaleString('en-GB');
      outErrors.textContent = s.errors.toLocaleString('en-GB');
      outQber.textContent = (s.qber * 100).toFixed(2) + '%';
      outQber.className = s.qber >= THRESHOLD ? 'warn' : '';
      outRate.textContent = s.rate > 0 ? s.rate.toFixed(2) : '0.00';
      outFinal.textContent = s.finalKey.toLocaleString('en-GB');

      var aborted = s.qber >= THRESHOLD;
      verdict.className = 'verdict' + (aborted ? ' abort' : '');
      if (aborted) verdictText.textContent = 'Abort — key discarded';
      else if (s.qber > 0.05) verdictText.textContent = 'Secure, with Eve suspected';
      else verdictText.textContent = 'Secure';

      if (aborted) {
        simNote.innerHTML = 'QBER ' + (s.qber * 100).toFixed(1) + '% is above the 11% threshold. Alice and Bob throw the whole run away — ' + s.sifted.toLocaleString('en-GB') + ' sifted bits, no key. This is the protocol working, not failing: an eavesdropper on more than about 20% of the qubits cannot be separated from a bad channel, so the channel is not trusted.';
      } else if (s.p > 0) {
        simNote.innerHTML = 'With Eve on ' + Math.round(s.p * 100) + '% of the qubits and ' + (s.e * 100).toFixed(1) + '% channel noise, the QBER lands near ' + (s.qber * 100).toFixed(1) + '%. That is below the 11% abort, so a key survives privacy amplification: ' + s.sifted.toLocaleString('en-GB') + ' sifted bits compress to ' + s.finalKey.toLocaleString('en-GB') + '.';
      } else {
        simNote.innerHTML = 'No eavesdropper, and ' + (s.e * 100).toFixed(1) + '% channel noise. The QBER of ' + (s.qber * 100).toFixed(2) + '% is entirely errors, and ' + s.sifted.toLocaleString('en-GB') + ' sifted bits compress to a key of ' + s.finalKey.toLocaleString('en-GB') + '.';
      }

      drawTape(s);
    }

    qubitsEl.addEventListener('input', update);
    eveEl.addEventListener('input', update);
    noiseEl.addEventListener('input', update);
    rerun.addEventListener('click', function () {
      run++;
      update();
    });

    update();

    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { if (state) drawTape(state); }, 120);
    });
  }

  /* ---------- register filters ---------- */

  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.entry-row'));
    var count = document.getElementById('entryCount');
    var emptyNote = document.getElementById('emptyNote');

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');
      filterBar.querySelectorAll('.filter-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      var shown = 0;
      items.forEach(function (item) {
        var match = cat === 'all' || item.getAttribute('data-cat') === cat;
        item.hidden = !match;
        if (match) shown++;
      });
      if (count) count.textContent = String(shown);
      if (emptyNote) emptyNote.hidden = shown > 0;
    });
  }

  /* ---------- faq ---------- */

  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
      var panel = q.closest('div').querySelector('.faq-a');
      if (panel) panel.hidden = open;
    });
  });

  /* ---------- enquiry form ---------- */

  var form = document.getElementById('enquiry');
  if (form) {
    var status = document.getElementById('formStatus');

    function setError(field, message) {
      field.classList.add('invalid');
      var err = field.querySelector('.err');
      if (err) err.textContent = message;
      var input = field.querySelector('input, textarea, select');
      if (input) input.setAttribute('aria-invalid', 'true');
    }
    function clearError(field) {
      field.classList.remove('invalid');
      var err = field.querySelector('.err');
      if (err) err.textContent = '';
      var input = field.querySelector('input, textarea, select');
      if (input) input.removeAttribute('aria-invalid');
    }

    form.querySelectorAll('.field input, .field textarea, .field select').forEach(function (input) {
      input.addEventListener('input', function () { clearError(input.closest('.field')); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');

      if (!name.value.trim() || name.value.trim().length < 2) {
        setError(name.closest('.field'), 'Please give a name I can answer to.');
        ok = false; firstBad = firstBad || name;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        setError(email.closest('.field'), 'That address does not look complete.');
        ok = false; firstBad = firstBad || email;
      }
      if (message.value.trim().length < 24) {
        setError(message.closest('.field'), 'The link, the topology and the QBER you measure would be a good start.');
        ok = false; firstBad = firstBad || message;
      }

      if (!ok) {
        status.textContent = 'The form needs a name, a working address and a short description of the link.';
        status.className = 'form-status bad';
        if (firstBad) firstBad.focus();
        return;
      }

      status.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. The request is with me; audit enquiries get an answer within two working days.';
      status.className = 'form-status good';
      form.reset();
      form.querySelectorAll('.field').forEach(clearError);
    });
  }
})();
