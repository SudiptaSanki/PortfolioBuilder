/* Santoor Springs — Aaliya Mir.
   A playable santoor built from twelve DOM strings and Web Audio.
   AudioContext is created only by a click, tap or key press on the instrument. */
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

  /* ── the instrument ─────────────────────────────────────── */
  var stringsEl = document.getElementById('strings');
  function initInstrument() {
  if (!stringsEl) return;

  var NAMES = ['S', 'r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N'];
  var DEV = ['Sa', 're', 'Re', 'ga', 'Ga', 'ma', 'Ma', 'Pa', 'dha', 'Dha', 'ni', 'Ni'];
  var RAGAS = {
    yaman: {
      name: 'Raga Yaman',
      thaat: 'Kalyan thaat',
      time: 'Early evening',
      notes: [0, 2, 4, 6, 7, 9, 11],
      aroha: 'N R G M′ P D N S',
      note: 'The first raga most students meet, and the one that teaches the ear to reach for tivra Ma without squeezing. On the santoor the tivra Ma rings longest because the bridge is nearest the soundboard edge.',
      mood: 'Open, ascending, lit from the west'
    },
    kafi: {
      name: 'Raga Kafi',
      thaat: 'Kafi thaat',
      time: 'Late evening',
      notes: [0, 2, 3, 5, 7, 9, 10],
      aroha: 'S R g m P D n S',
      note: 'Kafi is the raga of the Sufiana kalam in our house: the komal Ga and komal Ni give the line its sideways smile. It is also the raga most often requested at weddings, which is a different kind of test.',
      mood: 'Warm, turning, a little mischievous'
    },
    bhairavi: {
      name: 'Raga Bhairavi',
      thaat: 'Bhairavi thaat',
      time: 'Morning, and the end of a concert',
      notes: [0, 1, 3, 5, 7, 8, 10],
      aroha: 'S r g m P d n S',
      note: 'Bhairavi closes almost every night of music, whatever the hour. All four komal swaras make it sound simple; it is not. The andolan on komal Dha is where most santoor players give themselves away.',
      mood: 'Devotional, unhurried, final'
    },
    pilu: {
      name: 'Raga Pilu',
      thaat: 'Kafi thaat',
      time: 'Afternoon, or any time it is asked for',
      notes: [0, 2, 3, 5, 7, 8, 10],
      aroha: 'S R g m P d n S',
      note: 'A light raga for the end of a meal and the beginning of a conversation. We play Pilu for the Rouf songs of spring, when the shikaras come back to the lake.',
      mood: 'Light, folk, spring'
    }
  };

  var currentRaga = 'yaman';
  var octave = 1;
  var ctx = null;
  var master = null;
  var aocharTimers = [];

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    window.__audioCreated = true;
    setSound(true);
    return ctx;
  }

  function saFreq() {
    var el = document.getElementById('saPick');
    return el ? parseFloat(el.value) : 130.81;
  }

  function saName() {
    var el = document.getElementById('saPick');
    if (!el) return 'C3';
    return el.options[el.selectedIndex].getAttribute('data-name') || 'C3';
  }

  function setSound(on) {
    var dot = document.getElementById('dot');
    var text = document.getElementById('soundText');
    if (dot) dot.classList.toggle('on', on);
    if (text) text.textContent = on ? 'Sound on · tuned to Sa = ' + saName() : 'Sound off · strings are silent until you pluck';
  }

  function buildStrings() {
    var html = '';
    for (var i = 0; i < 12; i++) {
      html += '<button class="string" type="button" data-i="' + i + '" aria-label="Pluck ' + DEV[i] + '">' +
        '<span class="note">' + NAMES[i] + '</span><span class="line"></span>' +
        '<span class="oct">' + (i === 0 ? 'Sa' : DEV[i]) + '</span></button>';
    }
    stringsEl.innerHTML = html;
  }

  function applyRaga(key, announce) {
    currentRaga = key;
    var r = RAGAS[key];
    stringsEl.querySelectorAll('.string').forEach(function (el, i) {
      el.classList.toggle('out', r.notes.indexOf(i) === -1);
    });
    var chips = document.querySelectorAll('.raga-chip');
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-raga') === key)); });

    var rn = document.getElementById('ragaName');
    var rp = document.getElementById('ragaPrahar');
    var ar = document.getElementById('aroha');
    var nt = document.getElementById('ragaNote');
    var mood = document.getElementById('ragaMood');
    if (rn) rn.textContent = r.name;
    if (rp) rp.textContent = r.thaat + ' · ' + r.time;
    if (ar) ar.innerHTML = r.aroha.split(' ').map(function (n) { return n === 'S' ? '<span>S</span>' : n; }).join(' ');
    if (nt) nt.textContent = r.note;
    if (mood) mood.textContent = r.mood;
    if (announce) {
      var out = document.getElementById('stringOut');
      if (out) out.innerHTML = '<b>' + r.name + '</b> loaded. The strings outside the raga are muted. Pluck any string.';
    }
  }

  function pluck(index, octOverride) {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    var useOct = octOverride || octave;
    var semi = index + (useOct === 2 ? 12 : 0);
    var f = saFreq() * Math.pow(2, semi / 12);
    var t = ctx.currentTime;

    var out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.26, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);

    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(6200, t);
    filt.frequency.exponentialRampToValueAtTime(1800, t + 1.6);
    out.connect(filt);
    filt.connect(master);

    var partials = [[1, 0.9], [2.001, 0.26], [3.002, 0.12], [4.08, 0.05], [5.4, 0.025], [6.7, 0.012]];
    partials.forEach(function (p) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * p[0];
      g.gain.value = p[1];
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 2.15);
    });

    var el = stringsEl.querySelector('.string[data-i="' + index + '"]');
    if (el) {
      el.classList.add('ringing');
      setTimeout(function () { el.classList.remove('ringing'); }, 520);
    }

    var outEl = document.getElementById('stringOut');
    if (outEl) {
      outEl.innerHTML = 'Sounding <b>' + DEV[index] + '</b> at ' + f.toFixed(2) + ' Hz · ' + RAGAS[currentRaga].name +
        (useOct === 2 ? ' · upper octave' : '');
    }
  }

  buildStrings();
  applyRaga('yaman', false);

  stringsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.string');
    if (b) pluck(parseInt(b.getAttribute('data-i'), 10));
  });

  document.querySelectorAll('.raga-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      applyRaga(chip.getAttribute('data-raga'), true);
    });
  });

  var octaveBtn = document.getElementById('octaveBtn');
  if (octaveBtn) {
    octaveBtn.addEventListener('click', function () {
      octave = octave === 1 ? 2 : 1;
      octaveBtn.setAttribute('aria-pressed', String(octave === 2));
      octaveBtn.textContent = octave === 2 ? 'Middle octave' : 'Upper octave';
      var out = document.getElementById('stringOut');
      if (out) out.textContent = octave === 2 ? 'Upper octave selected. Every string sounds an octave higher.' : 'Middle octave selected.';
    });
  }

  var testBtn = document.getElementById('testBtn');
  if (testBtn) {
    testBtn.addEventListener('click', function () {
      ensureCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      pluck(0);
      testBtn.classList.add('armed');
      testBtn.textContent = 'Sound is on';
      setTimeout(function () { testBtn.classList.remove('armed'); }, 900);
    });
  }

  function clearAochar() {
    aocharTimers.forEach(function (t) { clearTimeout(t); });
    aocharTimers = [];
  }

  var aocharBtn = document.getElementById('aocharBtn');
  if (aocharBtn) {
    aocharBtn.addEventListener('click', function () {
      if (!ensureCtx()) return;
      clearAochar();
      var seq = RAGAS[currentRaga].notes.concat([12]);
      seq.forEach(function (semi, i) {
        aocharTimers.push(setTimeout(function () {
          if (semi === 12) pluck(0, 2); else pluck(semi);
        }, i * 260));
      });
      var out = document.getElementById('stringOut');
      if (out) out.innerHTML = 'Aochar in <b>' + RAGAS[currentRaga].name + '</b> · ' + seq.length + ' notes, ascending.';
    });
  }

  var saPick = document.getElementById('saPick');
  if (saPick) {
    saPick.addEventListener('change', function () {
      setSound(!!ctx);
      var label = document.getElementById('tuningLabel');
      if (label) label.textContent = 'Sa = ' + saName() + ' · ' + saFreq().toFixed(2) + ' Hz';
    });
  }

  /* repertoire rows jump into the practice room with the raga loaded */
  document.querySelectorAll('[data-load-raga]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyRaga(btn.getAttribute('data-load-raga'), true);
      var practice = document.getElementById('practice');
      if (practice) practice.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  }
  initInstrument();

  /* ── booking form ───────────────────────────────────────── */

  var bookForm = document.getElementById('bookForm');
  if (bookForm) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function mark(field, ok) {
      var wrap = field.closest('.f');
      if (!wrap) return;
      wrap.classList.toggle('invalid', !ok);
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
    }
    bookForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = bookForm.querySelector('#name');
      var email = bookForm.querySelector('#email');
      var message = bookForm.querySelector('#message');
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
      ok.innerHTML = '<strong>Shukriya, ' + who + '.</strong> Aaliya reads these on Sunday evenings, between tours. She will reply within four days with dates, a fee and what the room needs.';
      ok.classList.add('show');
      bookForm.reset();
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    bookForm.addEventListener('input', function (e) {
      var wrap = e.target.closest('.f');
      if (wrap && wrap.classList.contains('invalid')) {
        wrap.classList.remove('invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }
})();
