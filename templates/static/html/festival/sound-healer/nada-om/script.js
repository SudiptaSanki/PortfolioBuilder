/* ============================================================
   Nada Om — sound healer
   The room stays silent until a hand strikes a bowl. No
   AudioContext is constructed anywhere below until that gesture.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- navigation ---------- */
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

  /* ---------- bowls ---------- */
  var BOWLS = [
    { note: 'C3', name: 'Ground', hz: 130.81, decay: 16, beat: 1.4 },
    { note: 'D3', name: 'Hearth', hz: 146.83, decay: 15, beat: 1.1 },
    { note: 'E3', name: 'Navel', hz: 164.81, decay: 14, beat: 1.8 },
    { note: 'F3', name: 'Heart', hz: 174.61, decay: 18, beat: 2.2 },
    { note: 'G3', name: 'Throat', hz: 196.00, decay: 15, beat: 1.6 },
    { note: 'A3', name: 'Brow', hz: 220.00, decay: 13, beat: 2.6 },
    { note: 'B3', name: 'Crown', hz: 246.94, decay: 12, beat: 3.1 }
  ];
  var PARTIALS = [1, 2.02, 2.99, 4.07, 5.39];
  var state = { bowl: 0, minutes: 3, sounding: false, start: 0, strikes: 0, lastStrike: 0 };

  var bowlBtns = Array.prototype.slice.call(document.querySelectorAll('.bowl'));
  var titleEl = document.getElementById('bowl-title');
  var rBase = document.getElementById('r-base');
  var rPartials = document.getElementById('r-partials');
  var rBeat = document.getElementById('r-beat');
  var rDecay = document.getElementById('r-decay');
  var strikeSub = document.querySelector('.strike-sub');
  var strikeBtn = document.getElementById('strike');
  var audioState = document.getElementById('audio-state');
  var clockEl = document.getElementById('clock');
  var clockNote = document.getElementById('clock-note');
  var strikesEl = document.getElementById('strikes');

  function paintReadout() {
    var b = BOWLS[state.bowl];
    if (titleEl) titleEl.innerHTML = b.name + ' <span>' + b.note + '</span>';
    if (rBase) rBase.textContent = b.hz.toFixed(1) + ' Hz';
    if (rPartials) rPartials.textContent = PARTIALS.length + ' · ' + PARTIALS.slice(1).map(function (p) { return p.toFixed(2); }).join(' / ');
    if (rBeat) rBeat.textContent = b.beat.toFixed(1) + ' Hz';
    if (rDecay) rDecay.textContent = b.decay + ' s';
    if (strikeSub) strikeSub.textContent = 'bowl 0' + (state.bowl + 1) + ' · ' + b.name;
    state.waveFreq = b.hz / 16;
  }

  bowlBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.bowl = Number(btn.getAttribute('data-bowl'));
      bowlBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paintReadout();
      if (state.sounding) strikeNow(true);
    });
  });

  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-min]'));
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.minutes = Number(chip.getAttribute('data-min'));
      chips.forEach(function (c) { c.classList.toggle('is-set', c === chip); });
      paintClock(state.minutes * 60);
      if (clockNote) clockNote.textContent = state.start ? 'in progress · ' + state.minutes + ' min' : 'ready · ' + state.minutes + ' min';
    });
  });

  function paintClock(seconds) {
    if (!clockEl) return;
    var s = Math.max(0, Math.round(seconds));
    var mm = String(Math.floor(s / 60)).padStart(2, '0');
    var ss = String(s % 60).padStart(2, '0');
    clockEl.textContent = mm + ':' + ss;
  }

  /* ---------- audio, built only on a user strike ---------- */
  var ctx = null, master = null;

  function ensureAudio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    document.documentElement.setAttribute('data-audio', 'on');
    window.__nadaAudio = { created: true };
    return ctx;
  }

  function playStrike() {
    var c = ensureAudio();
    if (!c) return false;
    if (c.state === 'suspended') { c.resume().catch(function () {}); }
    var b = BOWLS[state.bowl];
    var now = c.currentTime;
    var bus = c.createGain();
    bus.gain.value = 0.9;
    bus.connect(master);

    PARTIALS.forEach(function (ratio, i) {
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = 'sine';
      // a shallow detune per partial produces the slow beating of a struck bowl
      var detune = (i === 0 ? 0 : (i % 2 === 0 ? b.beat : -b.beat)) / 2;
      osc.frequency.value = b.hz * ratio + detune;
      var peak = 0.22 / (1 + i * 0.72);
      var tail = b.decay * (1 - i * 0.1);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(peak, now + (i === 0 ? 0.05 : 0.03));
      g.gain.exponentialRampToValueAtTime(0.0001, now + tail);
      osc.connect(g);
      g.connect(bus);
      osc.start(now);
      osc.stop(now + tail + 0.1);
    });

    // wooden mallet contact: a very short filtered noise transient
    var len = Math.floor(c.sampleRate * 0.045);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    var noise = c.createBufferSource();
    noise.buffer = buf;
    var bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(3200, b.hz * 9);
    bp.Q.value = 1.2;
    var ng = c.createGain();
    ng.gain.value = 0.16;
    noise.connect(bp); bp.connect(ng); ng.connect(bus);
    noise.start(now);

    return true;
  }

  function strikeNow(isReselect) {
    var b = BOWLS[state.bowl];
    var played = playStrike();
    state.sounding = true;
    state.lastStrike = performance.now();
    if (!isReselect) {
      state.strikes += 1;
      if (strikesEl) strikesEl.textContent = String(state.strikes);
    }
    if (strikeBtn) {
      strikeBtn.classList.remove('is-sounding');
      void strikeBtn.offsetWidth;
      strikeBtn.classList.add('is-sounding');
    }
    if (audioState) {
      audioState.textContent = played
        ? 'Sounding: ' + b.name + ' · ' + b.hz.toFixed(1) + ' Hz · ' + b.decay + ' s decay'
        : 'This browser cannot make sound, but the ring below still shows the bowl.';
      audioState.classList.add('is-live');
    }
    if (!state.start) {
      state.start = performance.now();
      if (clockNote) clockNote.textContent = 'in progress';
    }
    paintReadout();
  }

  if (strikeBtn) {
    strikeBtn.addEventListener('click', function () { strikeNow(false); });
  }

  /* ---------- session clock ---------- */
  function tickClock() {
    if (!state.start) return;
    var elapsed = (performance.now() - state.start) / 1000;
    var left = state.minutes * 60 - elapsed;
    if (left <= 0) {
      paintClock(0);
      if (clockNote) clockNote.textContent = 'sitting complete';
      state.start = 0;
      state.sounding = false;
      return;
    }
    paintClock(left);
  }

  /* ---------- ring drawings ---------- */
  function fit(canvas) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var rect = canvas.getBoundingClientRect();
    var changed = false;
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      changed = true;
    }
    var c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: c, w: rect.width, h: rect.height, changed: changed };
  }

  var halo = document.getElementById('halo');
  var wave = document.getElementById('wave');
  var t0 = performance.now();

  function drawHalo(now) {
    if (!halo) return;
    var f = fit(halo);
    var c = f.ctx, w = f.w, h = f.h;
    if (w < 4 || h < 4) return;
    c.clearRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2;
    var max = Math.min(w, h) * 0.48;
    var t = (now - t0) / 1000;

    var glow = c.createRadialGradient(cx, cy, max * 0.05, cx, cy, max);
    glow.addColorStop(0, 'rgba(200,164,100,0.17)');
    glow.addColorStop(0.55, 'rgba(200,164,100,0.05)');
    glow.addColorStop(1, 'rgba(200,164,100,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);

    for (var i = 0; i < 9; i++) {
      var base = max * (0.3 + i * 0.083);
      var ripple = reduced ? 0 : Math.sin(t * 0.5 - i * 0.62) * (2.4 + i * 0.55);
      c.beginPath();
      c.arc(cx, cy, Math.max(0.5, base + ripple), 0, Math.PI * 2);
      c.strokeStyle = i === 0 ? 'rgba(200,164,100,0.55)' : 'rgba(200,164,100,' + (0.26 - i * 0.024) + ')';
      c.lineWidth = i === 0 ? 1.3 : 0.8;
      c.stroke();
    }

    c.save();
    c.translate(cx, cy);
    c.rotate(reduced ? 0 : t * 0.08);
    c.setLineDash([2, 10]);
    c.beginPath();
    c.arc(0, 0, max * 0.985, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(147,171,151,0.32)';
    c.lineWidth = 1;
    c.stroke();
    c.restore();

    for (var k = 0; k < 48; k++) {
      var a = (k / 48) * Math.PI * 2 + (reduced ? 0 : t * 0.05);
      var r1 = max * 0.9;
      var r2 = r1 + (k % 4 === 0 ? 8 : 4);
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      c.strokeStyle = k % 4 === 0 ? 'rgba(200,164,100,0.5)' : 'rgba(200,164,100,0.2)';
      c.stroke();
    }
  }

  function drawWave(now) {
    if (!wave) return;
    var f = fit(wave);
    var c = f.ctx, w = f.w, h = f.h;
    if (w < 4 || h < 4) return;
    c.clearRect(0, 0, w, h);
    var t = (now - t0) / 1000;

    c.strokeStyle = 'rgba(236,229,216,0.055)';
    c.lineWidth = 1;
    for (var x = 0; x < w; x += 56) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke();
    }
    for (var y = 0; y < h; y += 56) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }

    var since = state.sounding ? (now - state.lastStrike) / 1000 : 99;
    var live = Math.max(0, 1 - since / 12);
    var freq = state.waveFreq || 8;
    var amp = (h * 0.16) * (0.1 + live * 0.9);
    var cy = h / 2;

    for (var layer = 0; layer < 3; layer++) {
      c.beginPath();
      for (var px = 0; px <= w; px += 3) {
        var env = Math.sin((px / w) * Math.PI);
        var drift = Math.sin(px * 0.011 * freq + t * (1.6 + layer * 0.7)) * (1 - layer * 0.22);
        var yy = cy + drift * amp * env * Math.pow(env, layer * 0.4);
        if (px === 0) c.moveTo(px, yy); else c.lineTo(px, yy);
      }
      c.strokeStyle = layer === 0 ? 'rgba(200,164,100,' + (0.28 + live * 0.5) + ')' : 'rgba(147,171,151,' + (0.12 + live * 0.26) / layer + ')';
      c.lineWidth = layer === 0 ? 1.4 : 0.9;
      c.stroke();
    }

    var sinceStrike = state.sounding ? (now - state.lastStrike) / 1000 : 99;
    if (sinceStrike < state.lastDecay + 1) {
      c.beginPath();
      c.arc(w / 2, cy, Math.max(0.5, Math.min(sinceStrike / 14, 1) * Math.min(w, h) * 0.44), 0, Math.PI * 2);
      c.strokeStyle = 'rgba(200,164,100,' + Math.max(0, 0.3 - sinceStrike * 0.05) + ')';
      c.lineWidth = 1;
      c.stroke();
    }
  }

  var raf;
  function loop(now) {
    drawHalo(now);
    drawWave(now);
    tickClock();
    raf = requestAnimationFrame(loop);
  }

  if (halo || wave) {
    state.lastDecay = 16;
    raf = requestAnimationFrame(loop);
    window.addEventListener('resize', function () {
      if (halo) fit(halo);
      if (wave) fit(wave);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    });
  }

  /* ---------- work filters ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var works = Array.prototype.slice.call(document.querySelectorAll('.work'));
  if (filterBtns.length && works.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.toggle('is-set', b === btn); });
        works.forEach(function (card) {
          card.hidden = kind !== 'all' && card.getAttribute('data-type') !== kind;
        });
      });
    });
  }

  /* ---------- booking form ---------- */
  var form = document.getElementById('booking-form');
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

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  if (form) {
    ['c-name', 'c-email', 'c-date', 'c-type', 'c-note'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') setError(id, '');
      });
      el.addEventListener('change', function () {
        if (el.getAttribute('aria-invalid') === 'true') setError(id, '');
      });
    });
    var agree = document.getElementById('c-agree');
    if (agree) agree.addEventListener('change', function () {
      var err = document.querySelector('.err[data-for="c-agree"]');
      if (err && agree.checked) err.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('c-name');
      var email = document.getElementById('c-email');
      var date = document.getElementById('c-date');
      var type = document.getElementById('c-type');
      var note = document.getElementById('c-note');
      var problems = [];

      setError('c-name', ''); setError('c-email', ''); setError('c-date', '');
      setError('c-type', ''); setError('c-note', '');
      var agreeErr = document.querySelector('.err[data-for="c-agree"]');
      if (agreeErr) agreeErr.textContent = '';

      if (!name.value.trim()) { setError('c-name', 'Please give a name I can use.'); problems.push(name); }
      if (!email.value.trim()) { setError('c-email', 'An email address is needed for a reply.'); problems.push(email); }
      else if (!validEmail(email.value.trim())) { setError('c-email', 'That address looks incomplete.'); problems.push(email); }
      if (!date.value) { setError('c-date', 'Choose a date, even a rough one.'); problems.push(date); }
      else {
        var d = new Date(date.value + 'T12:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        if (isNaN(d.getTime())) { setError('c-date', 'That date cannot be read.'); problems.push(date); }
        else if (d < today) { setError('c-date', 'Please choose a date still ahead.'); problems.push(date); }
      }
      if (!type.value) { setError('c-type', 'Tell me which kind of sitting.'); problems.push(type); }
      if (note.value.trim().length < 12) { setError('c-note', 'A sentence or two, so I know what to prepare.'); problems.push(note); }
      if (!agree.checked) { if (agreeErr) agreeErr.textContent = 'Please confirm you have read the note above.'; problems.push(agree); }

      if (problems.length) {
        problems[0].focus({ preventScroll: false });
        return;
      }

      var chosen = type.options[type.selectedIndex].textContent.toLowerCase();
      var readable = new Date(date.value + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      if (sentDetail) {
        sentDetail.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. You have asked for ' + chosen + ' on ' + readable + '. I will reply to ' + email.value.trim() + ' within two days with the next available times and directions to Studio 3.';
      }
      form.hidden = true;
      if (sent) sent.hidden = false;
      if (sent) sent.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }

  paintReadout();
  paintClock(state.minutes * 60);
  window.addEventListener('beforeunload', function () {
    if (ctx && ctx.state !== 'closed') { try { ctx.close(); } catch (e) {} }
  });
})();
