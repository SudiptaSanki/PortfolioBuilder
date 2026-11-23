/* Dhyan Still — Savitri Nair
   Silent: the pacer is visual only, no audio and no AudioContext. */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 760) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  /* ---------- reveal ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- breath pacer ---------- */
  var ring = document.getElementById('breath-ring');
  if (ring) {
    var PATTERNS = {
      box: {
        name: 'Box',
        phases: [['Inhale', 4], ['Hold', 4], ['Exhale', 4], ['Hold', 4]],
        note: 'Four counts in, four held, four out, four held. A square. The oldest pattern there is, and the easiest to return to.'
      },
      relax: {
        name: 'Unwind',
        phases: [['Inhale', 4], ['Hold', 7], ['Exhale', 8]],
        note: 'Four in, seven held, eight out. The long exhale is the point; it is the closest thing to a switch the body has. Do not force the count.'
      },
      coherent: {
        name: 'Coherent',
        phases: [['Inhale', 5.5], ['Exhale', 5.5]],
        note: 'Five and a half in, five and a half out, no pause. Around this rate the breath and the heart settle into step for most people. It is the one to use if you only learn one.'
      },
      ujjayi: {
        name: 'Ujjayi',
        phases: [['Inhale', 6], ['Exhale', 6]],
        note: 'Six and six, with a soft narrowing at the back of the throat, so the breath sounds faintly like the sea. Keep it quiet enough that someone beside you cannot hear it.'
      }
    };

    var CIRC = 2 * Math.PI * 118;
    var state = {
      pattern: 'box',
      running: false,
      elapsed: 0,
      startedAt: 0,
      timer: null
    };
    var phaseEl = document.getElementById('breath-phase');
    var countEl = document.getElementById('breath-count');
    var cyclesEl = document.getElementById('breath-cycles');
    var timeEl = document.getElementById('breath-time');
    var nameEl = document.getElementById('breath-name');
    var noteEl = document.getElementById('pacer-note');
    var core = document.getElementById('breath-core');
    var toggle = document.getElementById('breath-toggle');
    var reset = document.getElementById('breath-reset');

    function totalCycle(p) {
      return PATTERNS[p].phases.reduce(function (s, ph) { return s + ph[1]; }, 0);
    }

    function position(pattern, t) {
      var phases = PATTERNS[pattern].phases;
      var len = totalCycle(pattern);
      var inCycle = t % len;
      var acc = 0;
      for (var i = 0; i < phases.length; i++) {
        if (inCycle < acc + phases[i][1] || i === phases.length - 1) {
          return { index: i, name: phases[i][0], left: Math.max(0, phases[i][1] - (inCycle - acc)), dur: phases[i][1], into: inCycle - acc };
        }
        acc += phases[i][1];
      }
      return { index: 0, name: phases[0][0], left: phases[0][1], dur: phases[0][1], into: 0 };
    }

    function breathAmount(pos) {
      var nm = pos.name.toLowerCase();
      var frac = pos.dur ? pos.into / pos.dur : 0;
      if (nm === 'inhale') return frac;
      if (nm === 'exhale') return 1 - frac;
      return pos.index === 1 ? 1 : 0;
    }

    function paint() {
      var pos = position(state.pattern, state.elapsed);
      var frac = pos.dur ? pos.into / pos.dur : 0;
      var shown = frac;
      if (pos.name === 'Exhale') shown = 1 - frac;
      else if (pos.name === 'Hold') shown = pos.index === 1 ? 1 : 0;
      ring.setAttribute('stroke-dasharray', CIRC.toFixed(1));
      ring.setAttribute('stroke-dashoffset', (CIRC * (1 - shown)).toFixed(1));
      if (core) core.setAttribute('r', String(40 + 20 * breathAmount(pos)));
      phaseEl.textContent = state.running || state.elapsed > 0 ? pos.name : 'Ready';
      countEl.textContent = state.running || state.elapsed > 0 ? (Math.ceil(pos.left) + ' s') : '—';
      var cycles = Math.floor(state.elapsed / totalCycle(state.pattern));
      cyclesEl.textContent = String(cycles);
      var secs = Math.floor(state.elapsed);
      timeEl.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    }

    function tick() {
      state.elapsed = (Date.now() - state.startedAt) / 1000;
      paint();
    }

    function begin() {
      state.running = true;
      state.startedAt = Date.now() - state.elapsed * 1000;
      if (toggle) toggle.textContent = 'Pause';
      clearInterval(state.timer);
      state.timer = setInterval(tick, 100);
      tick();
    }

    function pause() {
      state.running = false;
      clearInterval(state.timer);
      state.timer = null;
      state.elapsed = (Date.now() - state.startedAt) / 1000;
      if (toggle) toggle.textContent = 'Continue';
      paint();
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (state.running) pause(); else begin();
      });
    }

    if (reset) {
      reset.addEventListener('click', function () {
        clearInterval(state.timer);
        state.timer = null;
        state.running = false;
        state.elapsed = 0;
        if (toggle) toggle.textContent = 'Begin';
        paint();
        phaseEl.textContent = 'Ready';
        countEl.textContent = '—';
      });
    }

    var patterns = [].slice.call(document.querySelectorAll('.pattern'));
    patterns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        patterns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.pattern = btn.getAttribute('data-pattern');
        state.elapsed = 0;
        if (state.running) state.startedAt = Date.now();
        var p = PATTERNS[state.pattern];
        if (nameEl) nameEl.textContent = p.name;
        if (noteEl) noteEl.textContent = p.note;
        paint();
        phaseEl.textContent = state.running ? phaseEl.textContent : 'Ready';
      });
    });

    paint();
  }

  /* ---------- programme filter ---------- */
  var chips = [].slice.call(document.querySelectorAll('.chip[data-type]'));
  if (chips.length) {
    var items = [].slice.call(document.querySelectorAll('.prog'));
    var empty = document.querySelector('.prog-empty');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        var f = chip.getAttribute('data-type');
        var shown = 0;
        items.forEach(function (it) {
          var match = f === 'all' || it.getAttribute('data-type') === f;
          it.hidden = !match;
          if (match) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('session-form');
  if (form) {
    var sent = document.getElementById('s-sent');
    var fields = {
      name: { el: document.getElementById('s-name'), msg: 'Please leave a name.' },
      email: { el: document.getElementById('s-email'), msg: 'An email I can reply to.' },
      experience: { el: document.getElementById('s-experience'), msg: 'Where you are with practice, honestly.' },
      format: { el: document.getElementById('s-format'), msg: 'Choose a format.' },
      date: { el: document.getElementById('s-date'), msg: 'A date you would like to aim for.' }
    };
    function err(k, m) {
      var e = document.getElementById('err-s-' + k);
      if (e) e.textContent = m || '';
      if (fields[k].el) fields[k].el.setAttribute('aria-invalid', m ? 'true' : 'false');
    }
    function check() {
      var ok = true;
      if (!fields.name.el.value.trim()) { err('name', fields.name.msg); ok = false; } else err('name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.el.value.trim())) { err('email', fields.email.msg); ok = false; } else err('email');
      if (!fields.experience.el.value) { err('experience', fields.experience.msg); ok = false; } else err('experience');
      if (!fields.format.el.value) { err('format', fields.format.msg); ok = false; } else err('format');
      if (!fields.date.el.value) { err('date', fields.date.msg); ok = false; } else err('date');
      return ok;
    }
    Object.keys(fields).forEach(function (k) {
      if (!fields[k].el) return;
      var handler = function () { if (fields[k].el.getAttribute('aria-invalid') === 'true') check(); };
      fields[k].el.addEventListener('input', handler);
      fields[k].el.addEventListener('change', handler);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!check()) {
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      var nm = fields.name.el.value.trim().split(' ')[0];
      var note = document.getElementById('s-sent-note');
      if (note) {
        note.textContent = 'Thank you, ' + nm + '. I answer on Sunday and Thursday evenings, and I will tell you honestly whether what you are looking for is something I teach.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.focus(); }
    });
  }
})();
