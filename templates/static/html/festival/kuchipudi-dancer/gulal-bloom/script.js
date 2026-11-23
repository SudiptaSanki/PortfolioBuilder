/* Gulal Bloom — powder, tala and booking. No audio, no libraries. */
(function () {
  'use strict';

  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- gulal powder ---------- */
  var canvas = document.getElementById('gulal');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var grains = [];
    var colours = ['226,58,114', '242,166,59', '247,239,227', '242,123,160'];
    var count = 460;
    for (var i = 0; i < count; i++) {
      var r = 1.2 + Math.pow(Math.random(), 2) * 7;
      grains.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: r,
        vx: (Math.random() - 0.5) * 0.24,
        vy: -0.06 - Math.random() * 0.22,
        a: 0.05 + Math.random() * 0.22,
        c: colours[(Math.random() * colours.length) | 0],
        ph: Math.random() * Math.PI * 2
      });
    }
    ctx.globalCompositeOperation = 'lighter';
    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < grains.length; k++) {
        var g = grains[k];
        if (!reduceMotion) {
          g.x += g.vx + Math.sin((t / 2600) + g.ph) * 0.14;
          g.y += g.vy;
          if (g.y < -20) { g.y = H + 20; g.x = Math.random() * W; }
          if (g.x < -20) g.x = W + 20;
          if (g.x > W + 20) g.x = -20;
        }
        var glow = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 2.4);
        glow.addColorStop(0, 'rgba(' + g.c + ',' + g.a + ')');
        glow.addColorStop(1, 'rgba(' + g.c + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(' + g.c + ',' + (g.a * 1.5) + ')';
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- tala builder ---------- */
  var TALA = {
    adi: {
      name: 'Adi', angas: [['Laghu', 4], ['Dhrutam', 2], ['Dhrutam', 2]],
      hand: 'Clap, then count the laghu on the fingers',
      where: 'Tarangam and Krishna Sabdam',
      note: 'Adi tala is the commonest cycle in the repertoire: a laghu of four beats and two dhrutams of two. At this tempo one cycle runs to the time below, and the dancer, the mridangam and the cymbals all have to arrive at the last syllable together.'
    },
    rupaka: {
      name: 'Rupaka', angas: [['Laghu', 4], ['Dhrutam', 2]],
      hand: 'Clap on the first beat, then a wave and a count',
      where: 'Jatiswaram in Kalyani, the javali',
      note: 'Rupaka is six aksharas and the tala of the jatiswaram and the javali. It is short enough to feel circular — by the time you have settled into it the cycle has come round again, which is exactly what the lighter items want.'
    },
    misra: {
      name: 'Misra chapu', angas: [['Laghu', 3], ['Laghu', 4]],
      hand: 'Two claps, the second held for four',
      where: 'The padam, “Bhogeendra Sayinam”',
      note: 'Misra chapu is seven aksharas in two unequal parts, three and four. The gait is what makes it feel like it is leaning forward, and it is the reason a padam set to it can sound like it is about to say something and then does not.'
    },
    khanda: {
      name: 'Khanda chapu', angas: [['Laghu', 2], ['Laghu', 3]],
      hand: 'Clap, then three counts against the palm',
      where: 'The shabdam, “Mati matiki”',
      note: 'Khanda chapu is five aksharas, two and three. Short cycles are unforgiving: there is no room to recover a missed syllable, which is why the shabdam is set to it and why it is taught late.'
    }
  };
  var GATI = { 3: ['ta', 'ki', 'ta'], 4: ['ta', 'ka', 'dhi', 'mi'], 5: ['ta', 'ka', 'ta', 'ki', 'ta'] };

  var form = document.getElementById('tala-form');
  if (form) {
    var state = { tala: 'adi', gati: 4, tempo: 80, cycles: 1 };
    var sumTala = document.getElementById('sum-tala');
    var totalAksharas = document.getElementById('total-aksharas');
    var totalSyllables = document.getElementById('total-syllables');
    var cycleTime = document.getElementById('cycle-time');
    var angaRow = document.getElementById('anga-row');
    var aksharaRow = document.getElementById('akshara-row');
    var syllableLine = document.getElementById('syllable-line');
    var angaList = document.getElementById('anga-list');
    var handNote = document.getElementById('hand-note');
    var talaNote = document.getElementById('tala-note');
    var tempoOut = document.getElementById('tempo-out');
    var tempoInput = document.getElementById('tempo');
    var countBtn = document.getElementById('count-btn');
    var timers = [];

    function beatSeconds() { return 60 / state.tempo; }

    function render() {
      var t = TALA[state.tala];
      var aksharas = t.angas.reduce(function (n, a) { return n + a[1]; }, 0);
      var secs = aksharas * beatSeconds();
      sumTala.textContent = t.name;
      totalAksharas.textContent = String(aksharas);
      totalSyllables.textContent = String(aksharas * state.gati);
      cycleTime.textContent = secs.toFixed(1) + ' s';
      tempoOut.textContent = String(state.tempo);
      handNote.textContent = t.hand;
      var whereEl = document.getElementById('where-note');
      if (whereEl) whereEl.textContent = t.where;
      angaList.textContent = t.angas.map(function (a) { return a[0] + ' ' + a[1]; }).join(' · ');
      talaNote.textContent = t.name + ' at ' + state.tempo + ' beats a minute: ' + t.note;

      angaRow.innerHTML = '';
      t.angas.forEach(function (a) {
        var s = document.createElement('span');
        s.className = 'anga';
        s.textContent = a[0] + ' · ' + a[1];
        angaRow.appendChild(s);
      });

      var syl = GATI[state.gati];
      aksharaRow.innerHTML = '';
      aksharaRow.style.gridTemplateColumns = 'repeat(' + Math.min(aksharas, 8) + ', minmax(0,1fr))';
      var starts = {};
      var idx = 0;
      t.angas.forEach(function (a) { starts[idx] = true; idx += a[1]; });

      var groups = [];
      for (var b = 0; b < aksharas; b++) {
        var el = document.createElement('div');
        el.className = 'akshara gati-' + state.gati + (starts[b] ? ' anga-start' : '');
        el.dataset.i = String(b);
        el.innerHTML = '<span class="n">' + (b + 1) + '</span><span class="syl">' + syl.join(' ') + '</span>';
        aksharaRow.appendChild(el);
        groups.push(syl.join(' '));
      }
      syllableLine.textContent = groups.map(function (g, i) {
        return g;
      }).join('  ·  ');
    }

    function clearPulse() {
      timers.forEach(function (t) { clearTimeout(t); });
      timers = [];
      Array.prototype.forEach.call(aksharaRow.children, function (c) { c.classList.remove('is-pulse'); });
      countBtn.disabled = false;
      countBtn.textContent = 'Count the cycle';
    }

    countBtn.addEventListener('click', function () {
      clearPulse();
      var t = TALA[state.tala];
      var aksharas = t.angas.reduce(function (n, a) { return n + a[1]; }, 0);
      var step = beatSeconds() * 1000;
      var cells = aksharaRow.children;
      countBtn.disabled = true;
      countBtn.textContent = 'Counting…';
      var total = state.cycles * aksharas;
      for (var k = 0; k < total; k++) {
        (function (k) {
          timers.push(setTimeout(function () {
            Array.prototype.forEach.call(cells, function (c) { c.classList.remove('is-pulse'); });
            cells[k % aksharas].classList.add('is-pulse');
            if (k === total - 1) {
              timers.push(setTimeout(function () {
                Array.prototype.forEach.call(cells, function (c) { c.classList.remove('is-pulse'); });
                countBtn.disabled = false;
                countBtn.textContent = 'Count the cycle';
              }, step));
            }
          }, k * step));
        })(k);
      }
    });

    form.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      if (b.dataset.tala) state.tala = b.dataset.tala;
      if (b.dataset.gati) state.gati = Number(b.dataset.gati);
      if (b.dataset.cycles) state.cycles = Number(b.dataset.cycles);
      Array.prototype.forEach.call(b.parentElement.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      render();
    });
    tempoInput.addEventListener('input', function () {
      state.tempo = Number(tempoInput.value);
      render();
    });

    render();
  }

  /* ---------- performances filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var empty = document.querySelector('.empty-note');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var f = b.dataset.filter;
      Array.prototype.forEach.call(filters.querySelectorAll('.chip'), function (c) {
        var on = c === b;
        c.classList.toggle('is-set', on);
        c.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      Array.prototype.forEach.call(document.querySelectorAll('.entry'), function (en) {
        var show = f === 'all' || en.dataset.type === f;
        en.hidden = !show;
        if (show) shown++;
      });
      if (empty) empty.classList.toggle('on', shown === 0);
    });
  }

  /* ---------- booking form ---------- */
  var book = document.getElementById('book-form');
  if (book) {
    var sent = document.getElementById('sent');
    var sentName = document.getElementById('sent-name');
    var fields = [
      { id: 'k-name', msg: 'Who is inviting me?' },
      { id: 'k-email', msg: 'An email address, so the reply reaches you.', email: true },
      { id: 'k-date', msg: 'Choose the date of the event.', date: true },
      { id: 'k-venue', msg: 'Where is it, and what is the stage?' },
      { id: 'k-note', msg: 'Tell me the occasion, the length and the audience.', min: 10 }
    ];
    var agree = document.getElementById('k-agree');

    book.addEventListener('submit', function (e) {
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
        var wrap = el.closest('.field');
        if (wrap) {
          wrap.classList.toggle('bad', bad);
          var err = wrap.querySelector('.err');
          if (err) err.textContent = bad ? f.msg : '';
        }
        if (bad) ok = false;
        if (f.id === 'k-name') nameVal = v;
      });
      if (agree && !agree.checked) {
        ok = false;
        var aw = agree.closest('.check-wrap');
        if (aw) aw.classList.add('bad');
      }
      if (!ok) {
        var first = book.querySelector('.field.bad input, .field.bad textarea, .field.bad select');
        if (first) first.focus();
        return;
      }
      if (sentName) sentName.textContent = nameVal.split(' ')[0] || 'friend';
      book.hidden = true;
      if (sent) {
        sent.hidden = false;
        sent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    book.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field');
      if (wrap && wrap.classList.contains('bad') && e.target.value.trim()) {
        wrap.classList.remove('bad');
        var err = wrap.querySelector('.err');
        if (err) err.textContent = '';
      }
      if (agree && agree.checked) {
        var aw = agree.closest('.check-wrap');
        if (aw) aw.classList.remove('bad');
      }
    });
  }
})();
