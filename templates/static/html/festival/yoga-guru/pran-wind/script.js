/* Pran Wind — navigation, the practice builder and player, filters, form. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- mobile nav ---------------- */
  var toggle = doc.querySelector('.nav-toggle');
  var mnav = doc.getElementById('mnav');
  if (toggle && mnav) {
    toggle.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        mnav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- entrance + breath dots ---------------- */
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
     PRACTICE BUILDER
     ========================================================= */
  var lib = doc.getElementById('poseLib');
  if (lib) {

  var FIG = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  var HEAD = 'fill="currentColor"';

  var POSES = [
    { id: 'mountain', name: 'Mountain', sk: 'Tadasana', secs: 60,
      art: '<circle cx="50" cy="14" r="5" ' + HEAD + '/><path d="M50 20 V46 M50 28 L38 36 M50 28 L62 36 M50 46 L42 64 M50 46 L58 64" ' + FIG + '/>' },
    { id: 'salute', name: 'Half sun salutation', sk: 'Ardha Surya Namaskar', secs: 90,
      art: '<circle cx="50" cy="16" r="5" ' + HEAD + '/><path d="M50 22 V44 M50 26 L44 8 M50 26 L56 8 M50 44 L44 64 M50 44 L56 64" ' + FIG + '/>' },
    { id: 'warrior', name: 'Warrior II', sk: 'Virabhadrasana II', secs: 60,
      art: '<circle cx="50" cy="15" r="5" ' + HEAD + '/><path d="M50 21 V42 M50 27 H24 M50 27 H76 M50 42 L28 62 M50 42 L72 62" ' + FIG + '/>' },
    { id: 'triangle', name: 'Triangle', sk: 'Trikonasana', secs: 45,
      art: '<circle cx="36" cy="24" r="5" ' + HEAD + '/><path d="M36 30 L44 46 M36 32 L22 26 M36 32 L56 20 M44 46 L26 64 M44 46 L70 64" ' + FIG + '/>' },
    { id: 'dog', name: 'Downward dog', sk: 'Adho Mukha Svanasana', secs: 60,
      art: '<circle cx="30" cy="44" r="5" ' + HEAD + '/><path d="M30 49 L50 26 L72 60 M50 26 L80 60 M30 49 L20 62" ' + FIG + '/>' },
    { id: 'fold', name: 'Seated forward fold', sk: 'Paschimottanasana', secs: 90,
      art: '<circle cx="40" cy="34" r="5" ' + HEAD + '/><path d="M40 39 L46 58 M46 58 H76 M46 58 L36 66 M46 44 L68 56" ' + FIG + '/>' },
    { id: 'bridge', name: 'Bridge', sk: 'Setu Bandha Sarvangasana', secs: 45,
      art: '<circle cx="24" cy="54" r="5" ' + HEAD + '/><path d="M30 54 C 44 34, 62 34, 72 54 M30 54 L24 68 M72 54 L80 68 M46 40 L46 66" ' + FIG + '/>' },
    { id: 'savasana', name: 'Corpse', sk: 'Savasana', secs: 180,
      art: '<circle cx="22" cy="44" r="5" ' + HEAD + '/><path d="M28 46 H74 M74 46 L82 40 M74 46 L82 52 M40 46 L34 56" ' + FIG + '/>' }
  ];

  var PACE = { gentle: 1.3, standard: 1, short: 0.7 };
  var state = {
    seq: ['mountain', 'salute', 'warrior', 'dog', 'savasana'],
    pace: 'standard',
    playing: false,
    paused: false,
    idx: 0,
    left: 0,
    elapsed: 0,
    timer: null
  };

  function pose(id) {
    for (var i = 0; i < POSES.length; i++) if (POSES[i].id === id) return POSES[i];
    return POSES[0];
  }
  function dur(p) { return Math.max(15, Math.round(p.secs * PACE[state.pace] / 5) * 5); }
  function total() { return state.seq.reduce(function (t, id) { return t + dur(pose(id)); }, 0); }
  function clock(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function renderLib() {
    lib.innerHTML = POSES.map(function (p) {
      var inSeq = state.seq.indexOf(p.id) > -1;
      return '<button class="pose-add" type="button" data-pose="' + p.id + '"' + (inSeq ? ' disabled' : '') + '>' +
        '<svg viewBox="0 0 100 72" aria-hidden="true">' + p.art + '</svg>' +
        '<span><b>' + p.name + '</b><span>' + p.sk + ' · ' + dur(p) + 's</span></span>' +
        '<span class="plus" aria-hidden="true">' + (inSeq ? '·' : '+') + '</span>' +
        '</button>';
    }).join('');
    lib.querySelectorAll('.pose-add').forEach(function (b) {
      b.addEventListener('click', function () {
        if (state.seq.indexOf(b.getAttribute('data-pose')) > -1) return;
        state.seq.push(b.getAttribute('data-pose'));
        stopPlay();
        renderAll();
      });
    });
  }

  function renderSeq() {
    var list = doc.getElementById('seqList');
    if (!list) return;
    if (!state.seq.length) {
      list.innerHTML = '<p class="seq-empty">Nothing added yet. Choose a posture from the list on the left; the practice builds in the order you pick.</p>';
      return;
    }
    list.innerHTML = state.seq.map(function (id, i) {
      var p = pose(id);
      return '<div class="seq-item">' +
        '<span class="idx">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' +
        '<span class="nm">' + p.name + '<i>' + p.sk + '</i></span>' +
        '<span class="dur">' + clock(dur(p)) + '</span>' +
        '<button class="rm" type="button" data-rm="' + id + '" aria-label="Remove ' + p.name + '">×</button>' +
        '</div>';
    }).join('');
    list.querySelectorAll('.rm').forEach(function (b) {
      b.addEventListener('click', function () {
        state.seq = state.seq.filter(function (id) { return id !== b.getAttribute('data-rm'); });
        stopPlay();
        renderAll();
      });
    });
  }

  function renderTotal() {
    var t = doc.getElementById('seqTotal');
    if (t) t.textContent = clock(total());
    var n = doc.getElementById('seqCount');
    if (n) n.textContent = state.seq.length + ' postures';
    var begin = doc.getElementById('beginBtn');
    if (begin) begin.disabled = state.seq.length === 0;
  }

  function renderPlayer() {
    var panel = doc.getElementById('player');
    if (!panel) return;
    if (!state.seq.length) { panel.hidden = true; return; }
    panel.hidden = false;
    var p = pose(state.seq[Math.min(state.idx, state.seq.length - 1)]);
    doc.getElementById('pArt').innerHTML = '<svg viewBox="0 0 100 72" aria-hidden="true">' + p.art + '</svg>';
    doc.getElementById('pName').textContent = p.name;
    doc.getElementById('pSk').textContent = p.sk;
    doc.getElementById('pClock').textContent = clock(state.left || dur(p));
    var next = state.seq[state.idx + 1];
    doc.getElementById('pNext').textContent = next ? 'Next · ' + pose(next).name : 'Last posture of the practice';
    var bar = doc.getElementById('pBar');
    if (bar) bar.style.width = (total() ? (state.elapsed / total()) * 100 : 0) + '%';
    var cue = doc.getElementById('pCue');
    if (cue) {
      var phase = Math.floor(state.elapsed) % 8;
      cue.textContent = state.playing && !state.paused ? (phase < 4 ? 'Inhale' : 'Exhale') : 'Breathe';
    }
    var btn = doc.getElementById('playBtn');
    if (btn) btn.textContent = state.playing && !state.paused ? 'Pause' : (state.elapsed > 0 ? 'Resume' : 'Begin');
  }

  function renderAll() { renderLib(); renderSeq(); renderTotal(); renderPlayer(); }

  function stopPlay() {
    clearInterval(state.timer);
    state.playing = false;
    state.paused = false;
    state.elapsed = 0;
    state.idx = 0;
    state.left = state.seq.length ? dur(pose(state.seq[0])) : 0;
  }

  function tick() {
    if (!state.playing || state.paused) return;
    state.left -= 1;
    state.elapsed += 1;
    if (state.left <= 0) {
      if (state.idx < state.seq.length - 1) {
        state.idx += 1;
        state.left = dur(pose(state.seq[state.idx]));
      } else {
        clearInterval(state.timer);
        state.playing = false;
        state.left = 0;
        var cue = doc.getElementById('pCue');
        if (cue) cue.textContent = 'Complete';
        renderPlayer();
        return;
      }
    }
    renderPlayer();
  }

  var playBtn = doc.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      if (!state.seq.length) return;
      if (!state.playing) {
        if (state.elapsed === 0) {
          state.idx = 0;
          state.left = dur(pose(state.seq[0]));
        }
        state.playing = true;
        state.paused = false;
        clearInterval(state.timer);
        state.timer = setInterval(tick, 1000);
      } else {
        state.paused = !state.paused;
      }
      renderPlayer();
    });
  }

  var resetBtn = doc.getElementById('resetPlay');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      stopPlay();
      state.left = state.seq.length ? dur(pose(state.seq[0])) : 0;
      renderPlayer();
    });
  }

  var beginBtn = doc.getElementById('beginBtn');
  if (beginBtn) {
    beginBtn.addEventListener('click', function () {
      stopPlay();
      state.left = dur(pose(state.seq[0]));
      renderPlayer();
      var panel = doc.getElementById('player');
      if (panel) panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }

  var paceSel = doc.getElementById('pace');
  if (paceSel) {
    paceSel.addEventListener('change', function () {
      state.pace = paceSel.value;
      stopPlay();
      renderAll();
    });
  }

  state.left = dur(pose(state.seq[0]));
  renderAll();

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

  /* ---------------- class form ---------------- */
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
            ' and will reply within two days with what is open that week.';
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
