/* Mridanga Beat — page behaviour
   The only thing here that makes noise is the tala player, and it waits for
   a real press before it builds an AudioContext. Everything else is layout. */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu ---------- */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        document.body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal ---------- */
  const risers = document.querySelectorAll('.rise');
  if (risers.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) risers.forEach((el) => el.classList.add('in'));
    else {
      const io = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
      risers.forEach((el) => io.observe(el));
    }
  }

  /* ---------- booking form ---------- */
  const booking = document.getElementById('booking-form');
  if (booking) {
    const status = document.getElementById('booking-status');
    booking.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = booking.querySelector('#name');
      const email = booking.querySelector('#email');
      const course = booking.querySelector('#course');
      const experience = booking.querySelector('#experience');
      const message = booking.querySelector('#message');
      const bad = [];
      if (!name.value.trim()) bad.push(name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!course.value) bad.push(course);
      if (!experience.value) bad.push(experience);
      if (message.value.trim().length < 6) bad.push(message);

      [name, email, course, experience, message].forEach((el) => {
        const w = el.closest('.field');
        const isBad = bad.includes(el);
        if (w) w.classList.toggle('invalid', isBad);
        el.setAttribute('aria-invalid', String(isBad));
      });

      if (bad.length) {
        status.className = 'form-status bad';
        status.textContent = 'Some fields still need an answer. Nothing has been sent.';
        bad[0].focus();
        return;
      }

      const first = name.value.trim().split(' ')[0];
      const choice = course.value.toLowerCase();
      status.className = 'form-status ok';
      status.textContent = choice.includes('online')
        ? `Thank you, ${first}. I will send you a link for a short call first, so we can check your setup before a lesson is booked.`
        : `Thank you, ${first}. Your note is in the notebook. I answer on Monday and Wednesday evenings and will tell you the next free seat.`;
      booking.reset();
      [name, email, course, experience, message].forEach((el) => {
        const w = el.closest('.field');
        if (w) w.classList.remove('invalid');
      });
    });

    booking.querySelectorAll('input, select, textarea').forEach((el) => {
      const clear = () => {
        const w = el.closest('.field');
        if (w && (el.value.trim() || el.value)) w.classList.remove('invalid');
      };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });
  }

  /* ---------- the tala player ---------- */
  const beatsEl = document.getElementById('beats');
  if (!beatsEl) return;

  const TAALS = {
    teentaal: {
      name: 'Teentaal · 16 matras',
      matras: 16,
      vibhag: [4, 4, 4, 4],
      sam: [1], tali: [5, 13], khali: [9],
      bols: ['dha', 'dha', 'dhin', 'dha', 'dha', 'dhin', 'dha', 'dhin', 'dha', 'ta', 'tin', 'ta', 'ta', 'dhin', 'dha', 'dhin'],
    },
    jhaptal: {
      name: 'Jhaptal · 10 matras',
      matras: 10,
      vibhag: [2, 3, 2, 3],
      sam: [1], tali: [3, 8], khali: [6],
      bols: ['dhi', 'na', 'dhi', 'dhi', 'na', 'ti', 'na', 'dhi', 'dhi', 'na'],
    },
    rupak: {
      name: 'Rupak · 7 matras',
      matras: 7,
      vibhag: [3, 2, 2],
      sam: [], tali: [4, 6], khali: [1],
      bols: ['tin', 'tin', 'na', 'dhin', 'na', 'dhin', 'na'],
    },
    dadra: {
      name: 'Dadra · 6 matras',
      matras: 6,
      vibhag: [3, 3],
      sam: [1], tali: [], khali: [4],
      bols: ['dha', 'dhin', 'na', 'dha', 'tin', 'na'],
    },
  };

  const BOLS = {
    dha: { hi: 'धा', dayan: 'na', bayan: true },
    dhin: { hi: 'धिन', dayan: 'tin', bayan: true },
    dhi: { hi: 'धी', dayan: 'tin', bayan: true },
    ta: { hi: 'ता', dayan: 'ta', bayan: false },
    tin: { hi: 'तिं', dayan: 'tin', bayan: false },
    ti: { hi: 'ति', dayan: 'ti', bayan: false },
    na: { hi: 'ना', dayan: 'na', bayan: false, bayanOnly: true },
    kat: { hi: 'कत', dayan: 'kat', bayan: false },
    ge: { hi: 'गे', dayan: 'ge', bayan: true },
    tirakita: { hi: 'तिरकिट', dayan: 'tirakita', bayan: false },
  };

  const state = {
    taal: 'teentaal',
    bols: TAALS.teentaal.bols.slice(),
    placing: 'dha',
    playing: false,
    step: 0,
    timer: null,
    ctx: null,
    master: null,
  };

  const playBtn = document.getElementById('playBtn');
  const playLabel = document.getElementById('playLabel');
  const playIcon = document.getElementById('playIcon');
  const tempo = document.getElementById('tempo');
  const tempoOut = document.getElementById('tempoOut');
  const taalName = document.getElementById('taalName');
  const vibhagText = document.getElementById('vibhagText');
  const soundNote = document.getElementById('soundNote');

  function drawGrid() {
    const t = TAALS[state.taal];
    beatsEl.dataset.matras = String(t.matras);
    beatsEl.innerHTML = '';
    for (let i = 0; i < t.matras; i++) {
      const n = i + 1;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'beat';
      b.dataset.index = String(i);
      const bolKey = state.bols[i];
      const bol = BOLS[bolKey];
      b.innerHTML = `<span class="bol">${bol ? bol.hi : '—'}</span><span class="num">${n}</span>`;
      if (t.sam.includes(n)) b.classList.add('sam');
      else if (t.tali.includes(n)) b.classList.add('tali');
      if (t.khali.includes(n)) b.classList.add('khali');
      if (bolKey) b.classList.add('on');
      b.setAttribute('aria-label', `Matra ${n}${bolKey ? ', ' + bolKey : ', empty'}${t.sam.includes(n) ? ', sam' : ''}${t.khali.includes(n) ? ', khali' : ''}`);
      b.addEventListener('click', () => {
        if (state.bols[i]) {
          state.bols[i] = null;
          b.classList.remove('on');
          b.querySelector('.bol').textContent = '—';
          b.setAttribute('aria-label', `Matra ${n}, empty`);
        } else {
          state.bols[i] = state.placing;
          b.classList.add('on');
          b.querySelector('.bol').textContent = BOLS[state.placing].hi;
          b.setAttribute('aria-label', `Matra ${n}, ${state.placing}`);
        }
      });
      beatsEl.appendChild(b);
    }
    taalName.textContent = t.name;
    vibhagText.textContent = `Vibhag ${t.vibhag.join(' + ')}`;
  }

  function setTaal(key) {
    state.taal = key;
    state.bols = TAALS[key].bols.slice();
    state.step = 0;
    document.querySelectorAll('[data-taal]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.taal === key)));
    drawGrid();
    if (state.playing) { stop(); }
  }

  document.querySelectorAll('[data-taal]').forEach((btn) => {
    btn.addEventListener('click', () => setTaal(btn.dataset.taal));
  });

  document.querySelectorAll('[data-bol]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.placing = btn.dataset.bol;
      document.querySelectorAll('[data-bol]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    });
  });

  tempo.addEventListener('input', () => {
    tempoOut.textContent = `${tempo.value} BPM`;
    if (state.playing) restartTimer();
  });

  /* ---------- audio ---------- */

  function ensureAudio() {
    if (state.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      soundNote.textContent = 'This browser has no audio support; the grid still runs.';
      return false;
    }
    try {
      state.ctx = new AC();
      window.__audioCreated = true;
      const master = state.ctx.createGain();
      master.gain.value = 0.55;
      master.connect(state.ctx.destination);
      state.master = master;
      return true;
    } catch (e) {
      return false;
    }
  }

  function noiseBurst(t, dur, gain, filterFreq) {
    const ctx = state.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = filterFreq;
    flt.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(g).connect(state.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function dayan(t, type) {
    const ctx = state.ctx;
    const spec = {
      na: { f: 340, dur: 0.28, g: 0.5 },
      tin: { f: 520, dur: 0.34, g: 0.42 },
      ta: { f: 780, dur: 0.16, g: 0.34 },
      ti: { f: 640, dur: 0.18, g: 0.32 },
      kat: { f: 900, dur: 0.07, g: 0.3 },
      ge: { f: 300, dur: 0.26, g: 0.4 },
      tirakita: { f: 700, dur: 0.09, g: 0.26 },
    }[type] || { f: 400, dur: 0.2, g: 0.36 };

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(spec.f, t);
    osc.frequency.exponentialRampToValueAtTime(spec.f * 0.94, t + spec.dur * 0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(spec.g, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + spec.dur);
    osc.connect(g).connect(state.master);
    osc.start(t);
    osc.stop(t + spec.dur + 0.02);

    if (type === 'ta' || type === 'kat' || type === 'tirakita') noiseBurst(t, 0.05, 0.22, 2600);
    else noiseBurst(t, 0.03, 0.1, 1800);
  }

  function bayan(t, type) {
    const ctx = state.ctx;
    const base = type === 'ge' ? 92 : 74;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(base, t + 0.09);
    osc.frequency.exponentialRampToValueAtTime(base * 0.82, t + 0.42);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.62, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(g).connect(state.master);
    osc.start(t);
    osc.stop(t + 0.52);
    noiseBurst(t, 0.04, 0.14, 420);
  }

  function playBol(bolKey, when) {
    const bol = BOLS[bolKey];
    if (!bol) return;
    if (bol.dayan === 'tirakita') {
      for (let i = 0; i < 4; i++) dayan(when + i * 0.055, 'tirakita');
      return;
    }
    if (bol.bayanOnly) { bayan(when, 'na'); return; }
    dayan(when, bol.dayan);
    if (bol.bayan) bayan(when, bolKey === 'ge' ? 'ge' : 'dha');
  }

  /* ---------- transport ---------- */

  function tick() {
    const t = TAALS[state.taal];
    const cells = beatsEl.querySelectorAll('.beat');
    cells.forEach((c) => c.classList.remove('playing'));
    const idx = state.step % t.matras;
    const cell = cells[idx];
    if (cell) cell.classList.add('playing');

    const bolKey = state.bols[idx];
    if (bolKey && state.ctx) {
      const when = state.ctx.currentTime + 0.02;
      playBol(bolKey, when);
      if (t.sam.includes(idx + 1)) {
        /* sam gets a hair more weight: a second soft bayan under the stroke */
        bayan(when + 0.001, 'ge');
      }
    }
    state.step = (state.step + 1) % t.matras;
  }

  function restartTimer() {
    clearInterval(state.timer);
    const beatMs = 60000 / Number(tempo.value);
    state.timer = setInterval(tick, beatMs);
  }

  function start() {
    if (!ensureAudio()) return;
    if (state.ctx.state === 'suspended') state.ctx.resume().catch(() => {});
    state.playing = true;
    state.step = 0;
    playBtn.dataset.state = 'playing';
    playLabel.textContent = 'Stop';
    playIcon.setAttribute('d', 'M4 4h8v8H4z');
    playBtn.setAttribute('aria-label', 'Stop the tala cycle');
    soundNote.classList.add('live');
    soundNote.lastChild.textContent = ' Playing · dayan and bayan synthesised live';
    tick();
    restartTimer();
  }

  function stop() {
    state.playing = false;
    clearInterval(state.timer);
    state.timer = null;
    playBtn.dataset.state = 'stopped';
    playLabel.textContent = 'Play the taal';
    playIcon.setAttribute('d', 'M5 3l8 5-8 5z');
    playBtn.setAttribute('aria-label', 'Start the tala cycle');
    soundNote.classList.remove('live');
    soundNote.lastChild.textContent = ' Sound is off until you press play';
    beatsEl.querySelectorAll('.beat').forEach((c) => c.classList.remove('playing'));
  }

  playBtn.addEventListener('click', () => (state.playing ? stop() : start()));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.playing) stop();
  });

  drawGrid();
})();
