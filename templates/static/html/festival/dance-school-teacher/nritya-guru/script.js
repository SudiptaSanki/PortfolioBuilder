/* ============================================================
   Nritya Gurukul — the taal desk. No sound: the count is visual.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.getElementById('nav-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      drawer.hidden = open;
      document.body.style.overflow = open ? '' : 'hidden';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- hero wheel ticks ---------- */
  var marks = document.getElementById('wheel-marks');
  if (marks) {
    var NS = 'http://www.w3.org/2000/svg';
    for (var m = 0; m < 16; m++) {
      var a = (m / 16) * Math.PI * 2 - Math.PI / 2;
      var r1 = 160, r2 = m === 0 || m === 8 ? 170 : 166;
      var ln = document.createElementNS(NS, 'line');
      ln.setAttribute('x1', 200 + Math.cos(a) * r1);
      ln.setAttribute('y1', 200 + Math.sin(a) * r1);
      ln.setAttribute('x2', 200 + Math.cos(a) * r2);
      ln.setAttribute('y2', 200 + Math.sin(a) * r2);
      ln.setAttribute('stroke', m === 0 || m === 8 ? '#7a1f2b' : '#151312');
      ln.setAttribute('stroke-width', m === 0 || m === 8 ? '3' : '1');
      marks.appendChild(ln);
      if (m % 2 === 0) {
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('x', 200 + Math.cos(a) * 141);
        t.setAttribute('y', 200 + Math.sin(a) * 141 + 3);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-family', 'DM Mono, monospace');
        t.setAttribute('font-size', '8');
        t.setAttribute('fill', '#6d6258');
        t.textContent = m === 0 ? '1' : String(m + 1);
        marks.appendChild(t);
      }
    }
  }

  /* ---------- tala data ---------- */
  var TAALAS = {
    teentaal: { name: 'Teentaal', matras: 16, vibhag: [4, 4, 4, 4], sam: [1, 9], khali: [5, 13], bol: 'dha dhin dhin dha · dha dhin dhin dha · dha tin tin ta · ta dhin dhin dha', abbr: 'TEEN' },
    jhaptaal: { name: 'Jhaptaal', matras: 10, vibhag: [2, 3, 2, 3], sam: [1, 3, 8], khali: [6], bol: 'dhi na · dhi dhi na · ti na · dhi dhi na', abbr: 'JHAP' },
    rupak: { name: 'Rupak', matras: 7, vibhag: [3, 2, 2], sam: [1], khali: [1], bol: 'tin tin na · dhin na · dhin na', abbr: 'RUPAK' },
    adi: { name: 'Adi', matras: 8, vibhag: [4, 4], sam: [1, 5], khali: [5], bol: 'ta ka dhi mi · ta ka dhi mi', abbr: 'ADI' }
  };
  var LAYAS = { vilambit: { name: 'vilambit', bpm: 48 }, madhya: { name: 'madhya', bpm: 84 }, drut: { name: 'drut', bpm: 140 } };

  var state = { taal: 'teentaal', laya: 'madhya', adds: ['nrittas', 'abhinaya'], beat: 0, timer: null, playing: false };

  var ring = document.getElementById('tala-ring');
  var title = document.getElementById('tala-title');
  var matraCount = document.getElementById('matra-count');
  var vibhagNote = document.getElementById('vibhag-note');
  var cycleTime = document.getElementById('cycle-time');
  var layaNote = document.getElementById('laya-note');
  var bolNote = document.getElementById('bol-note');
  var beatIndex = document.getElementById('beat-index');
  var beatSub = document.getElementById('beat-sub');
  var practice = document.getElementById('practice-list');
  var playBtn = document.getElementById('beat');

  function isSam(t, i) { return t.sam.indexOf(i + 1) !== -1; }
  function isKhali(t, i) { return t.khali.indexOf(i + 1) !== -1; }

  function buildRing(t) {
    if (!ring) return;
    ring.innerHTML = '';
    var NS = 'http://www.w3.org/2000/svg';
    var cx = 180, cy = 180, R = 128, innerR = 152, outerR = 168;
    var base = document.createElementNS(NS, 'circle');
    base.setAttribute('cx', cx); base.setAttribute('cy', cy); base.setAttribute('r', R + 22);
    base.setAttribute('class', 'ring-base');
    ring.appendChild(base);
    var dashed = document.createElementNS(NS, 'circle');
    dashed.setAttribute('cx', cx); dashed.setAttribute('cy', cy); dashed.setAttribute('r', R - 26);
    dashed.setAttribute('class', 'ring-inner');
    ring.appendChild(dashed);

    // vibhag boundary spokes
    var acc = 0;
    t.vibhag.forEach(function (grp, gi) {
      var a = (acc / t.matras) * Math.PI * 2 - Math.PI / 2;
      var ln = document.createElementNS(NS, 'line');
      ln.setAttribute('x1', cx + Math.cos(a) * innerR);
      ln.setAttribute('y1', cy + Math.sin(a) * innerR);
      ln.setAttribute('x2', cx + Math.cos(a) * outerR);
      ln.setAttribute('y2', cy + Math.sin(a) * outerR);
      ln.setAttribute('class', 'vibhag-line');
      ring.appendChild(ln);
      acc += grp;
      if (gi === t.vibhag.length - 1) {
        var a2 = (acc / t.matras) * Math.PI * 2 - Math.PI / 2;
        var ln2 = ln.cloneNode();
        ln2.setAttribute('x1', cx + Math.cos(a2) * innerR);
        ln2.setAttribute('y1', cy + Math.sin(a2) * innerR);
        ln2.setAttribute('x2', cx + Math.cos(a2) * outerR);
        ln2.setAttribute('y2', cy + Math.sin(a2) * outerR);
        ring.appendChild(ln2);
      }
    });

    for (var i = 0; i < t.matras; i++) {
      var ang = (i / t.matras) * Math.PI * 2 - Math.PI / 2;
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'matra' + (isSam(t, i) ? ' sam' : '') + (isKhali(t, i) && !isSam(t, i) ? ' khali' : ''));
      g.setAttribute('data-i', String(i));
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', cx + Math.cos(ang) * R);
      c.setAttribute('cy', cy + Math.sin(ang) * R);
      c.setAttribute('r', isSam(t, i) ? 13 : 12);
      g.appendChild(c);
      var txt = document.createElementNS(NS, 'text');
      txt.setAttribute('x', cx + Math.cos(ang) * R);
      txt.setAttribute('y', cy + Math.sin(ang) * R + 3.2);
      txt.textContent = String(i + 1);
      g.appendChild(txt);
      ring.appendChild(g);
    }

    var cl = document.createElementNS(NS, 'text');
    cl.setAttribute('x', cx); cl.setAttribute('y', cy - 2);
    cl.setAttribute('class', 'centre-label');
    cl.textContent = String(t.matras);
    ring.appendChild(cl);
    var cs = document.createElementNS(NS, 'text');
    cs.setAttribute('x', cx); cs.setAttribute('y', cy + 16);
    cs.setAttribute('class', 'centre-sub');
    cs.textContent = t.abbr;
    ring.appendChild(cs);
  }

  function cycleSeconds(t) { return (t.matras * 60) / LAYAS[state.laya].bpm; }

  function paint() {
    var t = TAALAS[state.taal];
    var l = LAYAS[state.laya];
    if (title) title.textContent = t.name + ' · ' + l.name;
    if (matraCount) matraCount.textContent = t.matras + ' matras';
    if (vibhagNote) vibhagNote.textContent = t.vibhag.join(' + ') + ' (' + t.vibhag.length + ' vibhag)';
    if (cycleTime) cycleTime.textContent = cycleSeconds(t).toFixed(1) + ' s';
    if (layaNote) layaNote.textContent = l.name + ' · ' + l.bpm + ' bpm';
    if (bolNote) bolNote.textContent = t.bol;
    if (beatSub) {
      var sams = t.sam.length;
      beatSub.textContent = 'sam on ' + t.sam.join(' and ') + (t.khali.length ? ' · khali on ' + t.khali.join(', ') : '');
      if (sams < 1) beatSub.textContent = 'no sam marked';
    }
    if (beatIndex) beatIndex.textContent = state.playing ? pad(state.beat + 1) + ' / ' + t.matras : '— / ' + t.matras;
    buildRing(t);
    paintPractice(t);
    stop();
  }

  function paintPractice(t) {
    if (!practice) return;
    var items = [];
    if (state.adds.indexOf('nrittas') !== -1) items.push('Four avartanas of nritta feet, saying the bol aloud at every sam.');
    if (state.adds.indexOf('abhinaya') !== -1) items.push('One avartana of abhinaya, eyes only, no hands — let the tala hold the time.');
    if (state.adds.indexOf('jathi') !== -1) items.push('Two rounds of jathi in this ' + t.matras + '-matra cycle, then one round in double speed.');
    if (!items.length) items.push('Sit with the tala and count it silently for one avartana. That is a practice.');
    practice.innerHTML = '';
    items.forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      practice.appendChild(li);
    });
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function highlight(i) {
    if (!ring) return;
    var all = ring.querySelectorAll('.matra');
    for (var k = 0; k < all.length; k++) {
      all[k].classList.toggle('is-beat', Number(all[k].getAttribute('data-i')) === i);
    }
    var t = TAALAS[state.taal];
    if (beatIndex) beatIndex.textContent = pad(i + 1) + ' / ' + t.matras;
    if (beatSub) {
      var word = 'matra ' + (i + 1);
      if (isSam(t, i)) word = 'SAM · ' + (t.sam.indexOf(i + 1) + 1) + (t.sam.indexOf(i + 1) === 0 ? 'st' : 'th');
      else if (isKhali(t, i)) word = 'KHALI · open hand';
      beatSub.textContent = word;
    }
  }

  function stop() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.playing = false;
    if (playBtn) {
      playBtn.classList.remove('is-playing');
      var label = playBtn.querySelector('.play-text');
      if (label) label.textContent = 'Play the cycle';
    }
    if (ring) {
      var all = ring.querySelectorAll('.matra');
      for (var k = 0; k < all.length; k++) all[k].classList.remove('is-beat');
    }
    if (beatIndex) beatIndex.textContent = '— / ' + TAALAS[state.taal].matras;
  }

  function play() {
    var t = TAALAS[state.taal];
    state.playing = true;
    state.beat = 0;
    if (playBtn) {
      playBtn.classList.add('is-playing');
      var label = playBtn.querySelector('.play-text');
      if (label) label.textContent = 'Stop the cycle';
    }
    highlight(0);
    var ms = (60 / LAYAS[state.laya].bpm) * 1000;
    state.timer = setInterval(function () {
      state.beat = (state.beat + 1) % t.matras;
      highlight(state.beat);
    }, ms);
  }

  if (playBtn) {
    playBtn.addEventListener('click', function () {
      if (state.playing) stop(); else play();
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('.taal[data-taal]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.taal = btn.getAttribute('data-taal');
      document.querySelectorAll('.taal[data-taal]').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paint();
    });
  });

  Array.prototype.slice.call(document.querySelectorAll('.laya[data-laya]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.laya = btn.getAttribute('data-laya');
      document.querySelectorAll('.laya[data-laya]').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-set', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paint();
    });
  });

  Array.prototype.slice.call(document.querySelectorAll('.add')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-add');
      var at = state.adds.indexOf(key);
      if (at === -1) state.adds.push(key); else state.adds.splice(at, 1);
      btn.classList.toggle('is-set', state.adds.indexOf(key) !== -1);
      btn.setAttribute('aria-pressed', String(state.adds.indexOf(key) !== -1));
      paintPractice(TAALAS[state.taal]);
    });
  });

  if (ring) paint();

  /* ---------- repertoire filter ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var reps = Array.prototype.slice.call(document.querySelectorAll('.rep'));
  if (filterBtns.length && reps.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.toggle('is-set', b === btn); });
        reps.forEach(function (r) { r.hidden = kind !== 'all' && r.getAttribute('data-type') !== kind; });
      });
    });
  }

  /* ---------- join form ---------- */
  var form = document.getElementById('trial-form');
  var sent = document.getElementById('sent');
  var sentDetail = document.getElementById('sent-detail');

  function setError(id, message) {
    var err = document.querySelector('.err[data-for="' + id + '"]');
    var input = document.getElementById(id);
    if (err) err.textContent = message || '';
    if (input) {
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      var field = input.closest('.field');
      if (field) field.classList.toggle('has-error', Boolean(message));
    }
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  if (form) {
    ['g-name', 'g-email', 'g-date', 'g-type', 'g-note'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var clear = function () { if (el.getAttribute('aria-invalid') === 'true') setError(id, ''); };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });
    var agree = document.getElementById('g-agree');
    if (agree) agree.addEventListener('change', function () {
      var err = document.querySelector('.err[data-for="g-agree"]');
      if (err && agree.checked) err.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('g-name');
      var email = document.getElementById('g-email');
      var date = document.getElementById('g-date');
      var type = document.getElementById('g-type');
      var note = document.getElementById('g-note');
      var problems = [];
      ['g-name', 'g-email', 'g-date', 'g-type', 'g-note'].forEach(function (id) { setError(id, ''); });
      var agreeErr = document.querySelector('.err[data-for="g-agree"]');
      if (agreeErr) agreeErr.textContent = '';

      if (!name.value.trim()) { setError('g-name', 'A name for the register.'); problems.push(name); }
      if (!email.value.trim()) { setError('g-email', 'An email so the school can write back.'); problems.push(email); }
      else if (!validEmail(email.value.trim())) { setError('g-email', 'That address looks incomplete.'); problems.push(email); }
      if (!date.value) { setError('g-date', 'A preferred start date, even approximate.'); problems.push(date); }
      else {
        var d = new Date(date.value + 'T12:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        if (isNaN(d.getTime())) { setError('g-date', 'That date cannot be read.'); problems.push(date); }
        else if (d < today) { setError('g-date', 'Please choose a date still ahead.'); problems.push(date); }
      }
      if (!type.value) { setError('g-type', 'Which class are you asking about?'); problems.push(type); }
      if (note.value.trim().length < 12) { setError('g-note', 'A sentence about age, experience and knees.'); problems.push(note); }
      if (!agree.checked) { if (agreeErr) agreeErr.textContent = 'Please confirm you have read the note.'; problems.push(agree); }

      if (problems.length) { problems[0].focus(); return; }

      var chosen = type.options[type.selectedIndex].textContent;
      var readable = new Date(date.value + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      if (sentDetail) {
        sentDetail.textContent = 'Your note about ' + chosen + ' from ' + readable + ' is in the register. Vasanthi replies to ' + email.value.trim() + ' on Sunday evenings, after the weekend hall has been swept.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
    });
  }

  window.addEventListener('beforeunload', function () { if (state.timer) clearInterval(state.timer); });
})();
