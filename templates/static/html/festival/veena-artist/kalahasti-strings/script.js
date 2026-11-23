/* Kalahasti Strings — page behaviour.
   Audio is strictly opt-in: no AudioContext exists until the drone switch or the
   play button is pressed. Nothing sounds on load. No libraries. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- chrome ---------- */
  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        drawer.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- reveals ---------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length && !reduceMotion) {
    var ticking = false;
    var reveal = function () {
      ticking = false;
      var limit = window.innerHeight * 0.94;
      rvs = rvs.filter(function (el) {
        if (el.classList.contains('in')) return false;
        if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false; }
        return true;
      });
    };
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(reveal);
    }, { passive: true });
    reveal();
  } else if (rvs.length) {
    rvs.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- four strings, drawn ---------- */
  var canvas = document.getElementById('strings');
  if (canvas && canvas.getContext) {
    var ctx2d = canvas.getContext('2d');
    var strings = [0.24, 0.42, 0.6, 0.78];
    var energy = [0, 0, 0, 0];
    var phase = [0, 0, 0, 0];
    var raf = null;
    var dpr = 1;
    var w = 0, h = 0;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    }

    function draw(dt) {
      ctx2d.clearRect(0, 0, w, h);

      /* fret shadows down the band */
      ctx2d.strokeStyle = 'rgba(233,220,195,.05)';
      ctx2d.lineWidth = 1;
      var step = Math.max(46, w / 26);
      for (var x = step; x < w; x += step) {
        ctx2d.beginPath();
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, h);
        ctx2d.stroke();
      }

      var grad = ctx2d.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(233,220,195,.32)');
      grad.addColorStop(.55, 'rgba(233,220,195,.5)');
      grad.addColorStop(1, 'rgba(201,162,39,.42)');

      for (var i = 0; i < strings.length; i++) {
        var y = strings[i] * h;
        var amp = energy[i];
        phase[i] += dt * 0.045;
        ctx2d.beginPath();
        ctx2d.strokeStyle = i === 3 ? 'rgba(201,162,39,.55)' : grad;
        ctx2d.lineWidth = i === 3 ? 1.1 : 1.6;
        for (var px = 0; px <= w; px += 4) {
          var t = px / w;
          var envelope = Math.sin(Math.PI * t);
          var wobble = Math.sin(phase[i] * 2.4 + t * Math.PI * 9) * amp * 13 * envelope;
          var yy = y + wobble;
          if (px === 0) ctx2d.moveTo(px, yy); else ctx2d.lineTo(px, yy);
        }
        ctx2d.stroke();
      }

      /* the nut and bridge */
      ctx2d.strokeStyle = 'rgba(201,162,39,.5)';
      ctx2d.lineWidth = 2;
      ctx2d.beginPath(); ctx2d.moveTo(1, 0); ctx2d.lineTo(1, h); ctx2d.stroke();
      ctx2d.beginPath(); ctx2d.moveTo(w - 1, 0); ctx2d.lineTo(w - 1, h); ctx2d.stroke();
      ctx2d.strokeStyle = 'rgba(233,220,195,.12)';
      ctx2d.lineWidth = 1;
      ctx2d.beginPath(); ctx2d.moveTo(0, h * .5); ctx2d.lineTo(w, h * .5); ctx2d.stroke();

      var alive = false;
      for (var k = 0; k < energy.length; k++) {
        energy[k] *= 0.988;
        if (energy[k] > 0.004) alive = true;
      }
      if (alive) {
        raf = window.requestAnimationFrame(function (ts) {
          if (!draw.last) draw.last = ts;
          var d = Math.min(48, ts - draw.last);
          draw.last = ts;
          draw(d);
        });
      } else {
        raf = null;
        draw.last = 0;
      }
    }

    function pluckAt(clientY) {
      var rect = canvas.getBoundingClientRect();
      var y = clientY - rect.top;
      for (var i = 0; i < strings.length; i++) {
        if (Math.abs(y - strings[i] * h) < h * 0.16) {
          energy[i] = Math.min(1, energy[i] + 0.85);
        }
      }
      if (!raf) {
        draw.last = 0;
        raf = window.requestAnimationFrame(function (ts) { draw.last = ts; draw(16); });
      }
    }

    if (!reduceMotion) {
      canvas.addEventListener('pointermove', function (e) { pluckAt(e.clientY); });
      canvas.addEventListener('pointerdown', function (e) { pluckAt(e.clientY); });
    }
    window.addEventListener('resize', function () {
      window.clearTimeout(resize._t);
      resize._t = window.setTimeout(resize, 120);
    });
    resize();
  }

  /* ---------- the practice room ---------- */
  var RAGAS = {
    mohanam: {
      name: 'Mohanam', mela: 'Janya of 28', display: 'Mohanam',
      note: 'Five notes, no Ma or Ni. The evening raga that behaves like a morning one.',
      semis: { S: 0, R: 2, G: 4, P: 7, D: 9 },
      aro: 'S R2 G3 P D2 S′', ava: 'S′ D2 P G3 R2 S'
    },
    kalyani: {
      name: 'Kalyani', mela: 'Melakarta 65', display: 'Kalyani',
      note: 'The full seven, with a sharp Ma. A raga that asks for patience and gives it back.',
      semis: { S: 0, R: 2, G: 4, M: 6, P: 7, D: 9, N: 11 },
      aro: 'S R2 G3 M2 P D2 N3 S′', ava: 'S′ N3 D2 P M2 G3 R2 S'
    },
    hindolam: {
      name: 'Hindolam', mela: 'Janya of 22', display: 'Hindolam',
      note: 'Five notes with no Ri or Pa. Austere, and unforgiving of a finger that lands late.',
      semis: { S: 0, G: 3, M: 5, D: 8, N: 10 },
      aro: 'S G2 M1 D1 N2 S′', ava: 'S′ N2 D1 M1 G2 S'
    },
    shankarabharanam: {
      name: 'Shankarabharanam', mela: 'Melakarta 29', display: 'Shankarabharanam',
      note: 'The plainest of the great ragas. Every note is where you expect it, which is the difficulty.',
      semis: { S: 0, R: 2, G: 4, M: 5, P: 7, D: 9, N: 11 },
      aro: 'S R2 G3 M1 P D2 N3 S′', ava: 'S′ N3 D2 P M1 G3 R2 S'
    }
  };

  var padWrap = document.getElementById('swaras');
  if (padWrap) {
    var state = { raga: 'mohanam', tonic: 261.63, phrase: [], audio: false };
    var phraseEl = document.getElementById('phrase');
    var phraseCount = document.getElementById('phrase-count');
    var audioNote = document.getElementById('audio-note');
    var speaker = document.getElementById('speaker');
    var swaraBtns = Array.prototype.slice.call(padWrap.querySelectorAll('.swara'));

    /* --- audio engine, built only on a gesture --- */
    var actx = null, master = null, droneGain = null, droneOscs = [];

    function engine() {
      if (actx) {
        if (actx.state === 'suspended') actx.resume();
        return actx;
      }
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try {
        actx = new Ctor();
        master = actx.createGain();
        master.gain.value = 0.42;
        master.connect(actx.destination);
      } catch (e) {
        actx = null;
      }
      return actx;
    }

    function enableAudio(message) {
      state.audio = true;
      if (speaker) speaker.classList.add('on');
      if (audioNote) audioNote.textContent = message || 'Sound is on. Tap a swara to hear it, or play the phrase.';
    }

    function freq(semi) { return state.tonic * Math.pow(2, semi / 12); }

    function pluck(f, when, gain, dur) {
      if (!actx) return;
      var t = actx.currentTime + (when || 0);
      var g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain || 0.2, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 1.8));
      g.connect(master);
      var parts = [[1, 1, 'triangle'], [2, 0.2, 'sine'], [3, 0.07, 'sine']];
      for (var i = 0; i < parts.length; i++) {
        var o = actx.createOscillator();
        var og = actx.createGain();
        o.type = parts[i][2];
        o.frequency.value = f * parts[i][0];
        og.gain.value = parts[i][1];
        o.connect(og);
        og.connect(g);
        o.start(t);
        o.stop(t + (dur || 1.8) + 0.05);
      }
    }

    function renderRaga() {
      var r = RAGAS[state.raga];
      setText('raga-name', r.name);
      setText('raga-display', r.display);
      setText('raga-mela', r.mela);
      setText('raga-note', r.note);
      var aro = document.getElementById('arohana');
      var ava = document.getElementById('avarohana');
      if (aro) aro.innerHTML = '<span>Arohana</span> ' + r.aro;
      if (ava) ava.innerHTML = '<span>Avarohana</span> ' + r.ava;
      swaraBtns.forEach(function (b) {
        var has = Object.prototype.hasOwnProperty.call(r.semis, b.dataset.swara);
        b.disabled = !has;
        b.setAttribute('aria-disabled', String(!has));
      });
      state.phrase = [];
      renderPhrase();
    }

    function setText(id, t) {
      var el = document.getElementById(id);
      if (el) el.textContent = t;
    }

    function renderPhrase() {
      if (!phraseEl) return;
      if (!state.phrase.length) {
        phraseEl.innerHTML = '<p class="empty">Tap a swara to add it. Eight notes is enough for a line.</p>';
      } else {
        phraseEl.innerHTML = state.phrase.map(function (s) {
          return '<span class="note">' + s + '</span>';
        }).join('');
      }
      if (phraseCount) phraseCount.textContent = state.phrase.length + (state.phrase.length === 1 ? ' note' : ' notes');
    }

    /* raga chips */
    var ragaChips = document.getElementById('raga-chips');
    if (ragaChips) {
      ragaChips.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        ragaChips.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state.raga = chip.dataset.raga;
        renderRaga();
        if (state.audio && audioNote) audioNote.textContent = RAGAS[state.raga].name + ' is on the pad. Tap a swara, or play what you have built.';
      });
    }

    /* tonic chips */
    var tonicChips = document.getElementById('tonic-chips');
    if (tonicChips) {
      tonicChips.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        tonicChips.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state.tonic = Number(chip.dataset.tonic);
        if (state.audio && audioNote) audioNote.textContent = 'Tuned to Sa at ' + (state.tonic > 280 ? 'D' : 'C') + '. Play the phrase to hear it.';
      });
    }

    /* swara pad */
    padWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.swara');
      if (!btn || btn.disabled) return;
      if (state.phrase.length >= 8) state.phrase = state.phrase.slice(1);
      state.phrase.push(btn.dataset.swara);
      renderPhrase();
      if (state.audio) {
        engine();
        if (actx) pluck(freq(RAGAS[state.raga].semis[btn.dataset.swara]), 0, 0.16, 1.5);
      }
    });

    /* play phrase */
    var playBtn = document.getElementById('play-phrase');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (!state.phrase.length) {
          if (audioNote) audioNote.textContent = 'Nothing to play yet. Tap two or three swaras first.';
          return;
        }
        var r = RAGAS[state.raga];
        if (!engine()) {
          if (audioNote) audioNote.textContent = 'This browser has no audio engine, but the phrase and the raga data still work.';
          return;
        }
        enableAudio('Playing ' + state.phrase.length + (state.phrase.length === 1 ? ' note' : ' notes') + ' in ' + r.name + '.');
        state.phrase.forEach(function (s, i) {
          pluck(freq(r.semis[s]), i * 0.36, 0.2, 1.7);
        });
      });
    }

    var clearBtn = document.getElementById('clear-phrase');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        state.phrase = [];
        renderPhrase();
        if (audioNote) audioNote.textContent = 'Cleared. Tap a swara to start again.';
      });
    }

    /* drone */
    var droneBtn = document.getElementById('drone');
    if (droneBtn) {
      droneBtn.addEventListener('click', function () {
        var on = droneBtn.getAttribute('aria-pressed') === 'true';
        if (!engine()) {
          if (audioNote) audioNote.textContent = 'This browser has no audio engine, so the drone cannot start here.';
          return;
        }
        if (!on) {
          if (!droneGain) {
            droneGain = actx.createGain();
            droneGain.gain.value = 0.035;
            droneGain.connect(master);
          }
          droneGain.gain.cancelScheduledValues(actx.currentTime);
          droneGain.gain.setValueAtTime(0.0001, actx.currentTime);
          droneGain.gain.linearRampToValueAtTime(0.035, actx.currentTime + 0.8);
          var sa = state.tonic;
          [1, 1.5, 2, 1.5].forEach(function (mult, i) {
            var o = actx.createOscillator();
            var g = actx.createGain();
            o.type = i === 0 ? 'sine' : 'triangle';
            o.frequency.value = sa * mult;
            o.detune.value = (i - 1.5) * 4;
            g.gain.value = i === 3 ? 0.5 : 0.8;
            o.connect(g);
            g.connect(droneGain);
            o.start();
            droneOscs.push({ o: o, g: g });
          });
          droneBtn.setAttribute('aria-pressed', 'true');
          enableAudio('Drone running on Sa and Pa. It will keep going until you switch it off.');
        } else {
          if (droneGain) {
            droneGain.gain.cancelScheduledValues(actx.currentTime);
            droneGain.gain.setValueAtTime(droneGain.gain.value, actx.currentTime);
            droneGain.gain.linearRampToValueAtTime(0.0001, actx.currentTime + 0.5);
          }
          var stopAt = actx.currentTime + 0.6;
          droneOscs.forEach(function (p) { try { p.o.stop(stopAt); } catch (err) {} });
          droneOscs = [];
          droneBtn.setAttribute('aria-pressed', 'false');
          if (audioNote) audioNote.textContent = 'Drone stopped. The pad still sounds when you play a phrase.';
        }
      });
    }

    renderRaga();
  }

  /* ---------- performance filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var perfs = Array.prototype.slice.call(document.querySelectorAll('.perf'));
    var showing = document.getElementById('showing');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.fchip');
      if (!btn) return;
      var f = btn.dataset.filter;
      filters.querySelectorAll('.fchip').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var n = 0;
      perfs.forEach(function (p) {
        var show = f === 'all' || p.dataset.type === f;
        p.hidden = !show;
        if (show) n++;
      });
      if (showing) showing.textContent = n + ' shown';
    });
  }

  /* ---------- booking form ---------- */
  var form = document.getElementById('veena-form');
  if (form) {
    var sent = document.getElementById('sent');
    function field(id) { return document.getElementById(id); }
    function showError(id, msg) {
      var err = document.getElementById(id + '-err');
      var input = field(id);
      if (err) err.textContent = msg;
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    form.addEventListener('input', function (e) {
      if (e.target.id && document.getElementById(e.target.id + '-err')) showError(e.target.id, '');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = field('v-name');
      var mail = field('v-email');
      var date = field('v-date');
      var note = field('v-note');
      var agree = field('v-agree');
      var ok = true;

      if (!name || name.value.trim().length < 2) { showError('v-name', 'A name for the reply.'); ok = false; } else showError('v-name', '');
      if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { showError('v-email', 'An address that reaches you.'); ok = false; } else showError('v-email', '');
      if (!date || !date.value) { showError('v-date', 'Pick the date you have in mind.'); ok = false; }
      else {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var picked = new Date(date.value + 'T12:00:00');
        if (isNaN(picked.getTime())) { showError('v-date', 'That date does not read.'); ok = false; }
        else if (picked < today) { showError('v-date', 'A past date cannot be held.'); ok = false; }
        else showError('v-date', '');
      }
      if (!note || note.value.trim().length < 12) { showError('v-note', 'Tell me the room and who is playing.'); ok = false; } else showError('v-note', '');
      if (!agree || !agree.checked) { showError('v-agree', 'Please confirm the date is not held until I reply.'); ok = false; } else showError('v-agree', '');

      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first && first.focus) first.focus();
        return;
      }

      var d = new Date(date.value + 'T12:00:00');
      setText('sent-mail', mail.value.trim());
      setText('sent-date', d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      var type = field('v-type');
      setText('sent-type', type ? type.value : 'Concert');
      var venue = field('v-venue');
      setText('sent-venue', venue && venue.value.trim() ? venue.value.trim() : 'To be decided');
      form.hidden = true;
      sent.hidden = false;
      sent.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function setText(id, t) {
    var el = document.getElementById(id);
    if (el) el.textContent = t;
  }
})();
