/* Pranayama Flow — navigation, the breath pacer, filters, form. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- navigation ---------------- */
  var toggle = doc.querySelector('.nav-toggle');
  var cnav = doc.getElementById('cnav');
  if (toggle && cnav) {
    toggle.addEventListener('click', function () {
      var open = cnav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    cnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        cnav.classList.remove('open');
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
        el.style.transitionDelay = Math.min(i, 4) * 55 + 'ms';
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          targets.forEach(function (el) { el.classList.add('in'); });
        });
      });
    }
  }

  /* =========================================================
     BREATH PACER
     ========================================================= */
  var canvas = doc.getElementById('dial');
  if (canvas) {

  var ctx = canvas.getContext('2d');
  var SIZE = 420;
  var TECHNIQUES = [
    { id: 'box', name: 'Box breathing', sub: 'steady, for focus', phases: [4, 4, 4, 4], use: 'Before work that needs a clear head' },
    { id: 'coherent', name: 'Coherent 5.5', sub: 'balanced, no holds', phases: [5.5, 0, 5.5, 0], use: 'Daily baseline; heart-rate variability work' },
    { id: 'relax', name: '4 · 7 · 8', sub: 'long exhale', phases: [4, 7, 8, 0], use: 'Before sleep, or after a difficult meeting' },
    { id: 'nadi', name: 'Nadi shodhana', sub: 'channel clearing', phases: [4, 16, 8, 0], use: 'Alternate nostril, seated, empty stomach' },
    { id: 'ujjayi', name: 'Ujjayi 1:2', sub: 'soft throat', phases: [5, 0, 10, 0], use: 'Through asana; keeps the breath audible' },
    { id: 'bhramari', name: 'Bhramari 1:2', sub: 'humming', phases: [4, 0, 8, 0], use: 'Anxious nights; the hum is the point' }
  ];
  var COLORS = ['#d9a45c', '#7fa896', '#c07a5a', '#5d8478'];
  var LABELS = ['Inhale', 'Hold', 'Exhale', 'Hold'];

  var state = {
    tech: TECHNIQUES[0],
    rounds: 5,
    round: 1,
    phase: 0,
    elapsed: 0,     /* seconds into the current phase */
    running: false,
    finished: false,
    cycleElapsed: 0,
    raf: null,
    last: 0,
    doneRounds: 0
  };

  function cycleTime() {
    return state.tech.phases.reduce(function (a, b) { return a + b; }, 0);
  }
  function activePhases() {
    return state.tech.phases.map(function (d, i) { return { d: d, i: i }; }).filter(function (p) { return p.d > 0; });
  }

  function drawDial() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    var cx = SIZE / 2, cy = SIZE / 2;

    /* tick ring */
    ctx.strokeStyle = 'rgba(236,232,218,.16)';
    ctx.lineWidth = 1;
    for (var t = 0; t < 60; t++) {
      var a = (t / 60) * Math.PI * 2 - Math.PI / 2;
      var r1 = 182, r2 = t % 5 === 0 ? 172 : 177;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }

    /* inner hairline + crosshair */
    ctx.strokeStyle = 'rgba(236,232,218,.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, 108, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 124, cy); ctx.lineTo(cx - 112, cy);
    ctx.moveTo(cx + 112, cy); ctx.lineTo(cx + 124, cy);
    ctx.moveTo(cx, cy - 124); ctx.lineTo(cx, cy - 112);
    ctx.moveTo(cx, cy + 112); ctx.lineTo(cx, cy + 124);
    ctx.stroke();

    /* phase segments */
    var total = cycleTime() || 1;
    var start = -Math.PI / 2;
    var segs = [];
    for (var i = 0; i < state.tech.phases.length; i++) {
      var d = state.tech.phases[i];
      if (!d) continue;
      var span = (d / total) * Math.PI * 2;
      segs.push({ start: start, end: start + span, color: COLORS[i], i: i });
      ctx.beginPath();
      ctx.strokeStyle = COLORS[i];
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 20;
      ctx.arc(cx, cy, 148, start, start + span);
      ctx.stroke();
      ctx.globalAlpha = 1;
      start += span;
    }

    /* progress within the cycle */
    var prog = (state.cycleElapsed / total);
    if (!state.running && !state.finished) prog = 0;
    if (state.finished) prog = 1;

    /* active phase emphasis */
    var acc = 0;
    for (var s = 0; s < segs.length; s++) {
      var seg = segs[s];
      var a0 = seg.start;
      var a1 = seg.end;
      var active = state.running && seg.i === state.phase;
      ctx.beginPath();
      ctx.strokeStyle = seg.color;
      ctx.globalAlpha = active ? 1 : 0.55;
      ctx.lineWidth = active ? 24 : 20;
      ctx.arc(cx, cy, 148, a0, a1);
      ctx.stroke();
      ctx.globalAlpha = 1;
      acc = seg.end;
    }

    /* marker line + dot at current angle */
    var ang = -Math.PI / 2 + prog * Math.PI * 2;
    var px = cx + Math.cos(ang) * 148;
    var py = cy + Math.sin(ang) * 148;
    ctx.beginPath();
    ctx.fillStyle = '#ece8da';
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(236,232,218,.5)';
    ctx.lineWidth = 1;
    ctx.moveTo(cx + Math.cos(ang) * 126, cy + Math.sin(ang) * 126);
    ctx.lineTo(cx + Math.cos(ang) * 168, cy + Math.sin(ang) * 168);
    ctx.stroke();
  }

  function setCenter() {
    var ph = doc.getElementById('phaseName');
    var cnt = doc.getElementById('phaseCount');
    var rnd = doc.getElementById('phaseRound');
    var p = state.tech.phases[state.phase];
    if (!ph) return;
    if (state.finished) {
      ph.textContent = 'Complete';
      cnt.textContent = '✓';
      rnd.textContent = state.rounds + ' rounds · ' + Math.round(state.rounds * cycleTime()) + 's';
      return;
    }
    ph.textContent = state.running ? LABELS[state.phase] : 'Ready';
    var left = p ? Math.max(0, p - state.elapsed) : 0;
    cnt.textContent = state.running ? Math.ceil(left) : '—';
    rnd.textContent = 'Round ' + state.round + ' / ' + state.rounds;
  }

  function setButtons() {
    var b = doc.getElementById('pacStart');
    if (!b) return;
    b.textContent = state.running ? 'Pause' : (state.finished ? 'Begin again' : (state.cycleElapsed > 0 ? 'Resume' : 'Begin session'));
  }

  function frame(ts) {
    if (!state.running) return;
    if (!state.last) state.last = ts;
    var dt = Math.min(0.1, (ts - state.last) / 1000);
    state.last = ts;
    var phases = state.tech.phases;
    state.elapsed += dt;
    state.cycleElapsed += dt;

    while (phases[state.phase] === 0) {
      state.phase = (state.phase + 1) % 4;
    }
    if (state.elapsed >= phases[state.phase]) {
      state.elapsed -= phases[state.phase];
      var next = (state.phase + 1) % 4;
      while (phases[next] === 0) next = (next + 1) % 4;
      if (next === 0) {
        state.doneRounds += 1;
        if (state.doneRounds >= state.rounds) {
          finish();
          return;
        }
        state.round += 1;
        state.cycleElapsed = 0;
      }
      state.phase = next;
    }
    drawDial();
    setCenter();
    state.raf = requestAnimationFrame(frame);
  }

  function finish() {
    state.running = false;
    state.finished = true;
    state.cycleElapsed = cycleTime();
    if (state.raf) cancelAnimationFrame(state.raf);
    drawDial();
    setCenter();
    setButtons();
  }

  function start() {
    if (state.finished) reset();
    state.running = true;
    state.last = 0;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(frame);
    setButtons();
    setCenter();
  }

  function pause() {
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    setButtons();
    setCenter();
  }

  function reset() {
    state.running = false;
    state.finished = false;
    state.round = 1;
    state.phase = 0;
    state.elapsed = 0;
    state.cycleElapsed = 0;
    state.doneRounds = 0;
    state.last = 0;
    if (state.raf) cancelAnimationFrame(state.raf);
    drawDial();
    setCenter();
    setButtons();
  }

  function renderStrip() {
    var strip = doc.getElementById('phaseStrip');
    var legend = doc.getElementById('phaseLegend');
    if (!strip) return;
    var total = cycleTime();
    strip.innerHTML = state.tech.phases.map(function (d, i) {
      if (!d) return '';
      return '<i style="width:' + (d / total) * 100 + '%;background:' + COLORS[i] + '"></i>';
    }).join('');
    if (legend) {
      legend.innerHTML = activePhases().map(function (p) {
        return '<span><em style="background:' + COLORS[p.i] + '"></em>' + LABELS[p.i] + ' ' + p.d + 's</span>';
      }).join('');
    }
  }

  function renderTechs() {
    var wrap = doc.getElementById('techList');
    if (!wrap) return;
    wrap.innerHTML = TECHNIQUES.map(function (t) {
      var on = t.id === state.tech.id;
      return '<button class="tech" type="button" data-tech="' + t.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span><b>' + t.name + '</b><span>' + t.sub + '</span></span>' +
        '<span class="ratio">' + t.phases.filter(function (x) { return x; }).join('·') + '</span>' +
        '</button>';
    }).join('');
    wrap.querySelectorAll('.tech').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-tech');
        TECHNIQUES.forEach(function (t) { if (t.id === id) state.tech = t; });
        reset();
        renderTechs();
        renderStrip();
        var desc = doc.getElementById('techUse');
        if (desc) desc.textContent = state.tech.use;
      });
    });
  }

  var startBtn = doc.getElementById('pacStart');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (state.running) pause();
      else start();
    });
  }
  var resetBtn = doc.getElementById('pacReset');
  if (resetBtn) resetBtn.addEventListener('click', reset);

  var roundsInput = doc.getElementById('rounds');
  if (roundsInput) {
    roundsInput.addEventListener('change', function () {
      var v = parseInt(roundsInput.value, 10);
      state.rounds = Math.max(1, Math.min(30, isNaN(v) ? 5 : v));
      roundsInput.value = state.rounds;
      if (!state.running) {
        state.finished = state.finished && state.doneRounds >= state.rounds;
        setCenter();
      }
    });
  }

  renderTechs();
  renderStrip();
  reset();

  }

  /* ---------------- programme filters ---------------- */
  var chips = doc.querySelectorAll('.chip[data-filter]');
  if (chips.length) {
    var items = doc.querySelectorAll('.prog');
    var count = doc.getElementById('filterCount');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        items.forEach(function (it) {
          var match = want === 'all' || it.getAttribute('data-kind') === want;
          it.hidden = !match;
          if (match) shown++;
        });
        if (count) count.textContent = shown + ' of ' + items.length + ' programmes';
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
            '. I reply on Tuesdays and Fridays, and I will send the intake form before we speak.';
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
