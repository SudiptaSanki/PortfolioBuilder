/* Rafael Vidal — parade choreographer
   Nav, the cadence sequencer and the booking form.
   The AudioContext is created only inside the Start button's click handler; the page is
   completely silent until then. No sound files: every hit is synthesized. */

(function () {
  'use strict';

  /* ---------- nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- booking form ---------- */
  const booking = document.getElementById('bookingForm');
  if (booking) {
    const status = document.getElementById('formStatus');
    booking.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(booking);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const event = String(data.get('event') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 12) {
        status.className = 'form-status err';
        status.textContent = 'I need a name, a working email, and a few lines about the parade — route, date, band size.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Noted, ' + name.split(' ')[0] + '. Your note about ' + (event || 'a parade') + ' is on the chart board. I answer on Mondays and Thursdays, between route walks.';
      booking.reset();
    });
  }

  /* ---------- cadence sequencer ---------- */
  const grid = document.getElementById('grid');
  if (!grid) return;

  const ROWS = [
    { id: 'snare', label: 'Snare', colour: '#c8342a' },
    { id: 'tenor', label: 'Tenor', colour: '#d9a53a' },
    { id: 'bass', label: 'Bass', colour: '#8fb2c9' },
    { id: 'cymbal', label: 'Cymbal', colour: '#cfc6b0' }
  ];

  const PRESETS = {
    street: {
      snare: '11010110'.split(''),
      tenor: '00100010'.split(''),
      bass: '10001000'.split(''),
      cymbal: '10000000'.split('')
    },
    march: {
      snare: '10111011'.split(''),
      tenor: '01000100'.split(''),
      bass: '10001000'.split(''),
      cymbal: '00000001'.split('')
    },
    run: {
      snare: '11111111'.split(''),
      tenor: '00110011'.split(''),
      bass: '10001000'.split(''),
      cymbal: '10101010'.split('')
    },
    parade: {
      snare: '10011001'.split(''),
      tenor: '00100010'.split(''),
      bass: '10001000'.split(''),
      cymbal: '00010001'.split('')
    }
  };

  const playBtn = document.getElementById('playBtn');
  const playLabel = document.getElementById('playLabel');
  const bpmInput = document.getElementById('bpm');
  const bpmOut = document.getElementById('bpmOut');
  const tapBtn = document.getElementById('tapBtn');
  const presetSel = document.getElementById('preset');
  const audioNote = document.getElementById('audioNote');
  const countOut = document.getElementById('countOut');
  const stepOut = document.getElementById('stepOut');
  const lamp = document.getElementById('beatLamp');
  const baton = document.getElementById('batonArm');

  let cells = [];
  let playing = false;
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let nextNoteTime = 0;
  let currentStep = 0;
  let timer = null;
  let totalSteps = 0;
  let batonUp = false;

  /* build the grid */
  ROWS.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'grid-row';
    rowEl.dataset.inst = row.id;
    const label = document.createElement('div');
    label.className = 'row-label';
    label.innerHTML = '<i style="background:' + row.colour + '"></i>' + row.label;
    rowEl.appendChild(label);
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cell' + (i === 0 || i === 4 ? ' beat-1' : '');
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', row.label + ' on count ' + (i + 1));
      b.dataset.row = row.id;
      b.dataset.col = String(i);
      rowEl.appendChild(b);
    }
    grid.appendChild(rowEl);
  });

  cells = Array.from(grid.querySelectorAll('.cell'));

  function setPattern(name) {
    const p = PRESETS[name];
    if (!p) return;
    cells.forEach((cell) => {
      const on = p[cell.dataset.row][Number(cell.dataset.col)] === '1';
      cell.setAttribute('aria-pressed', String(on));
    });
  }

  function readPattern() {
    const out = { snare: [], tenor: [], bass: [], cymbal: [] };
    ROWS.forEach((r) => { out[r.id] = [0, 0, 0, 0, 0, 0, 0, 0]; });
    cells.forEach((cell) => {
      out[cell.dataset.row][Number(cell.dataset.col)] = cell.getAttribute('aria-pressed') === 'true' ? 1 : 0;
    });
    return out;
  }

  grid.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const on = cell.getAttribute('aria-pressed') === 'true';
    cell.setAttribute('aria-pressed', String(!on));
  });

  presetSel.addEventListener('change', () => {
    if (presetSel.value === 'clear') {
      cells.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      presetSel.value = 'street';
      return;
    }
    setPattern(presetSel.value);
  });

  bpmInput.addEventListener('input', () => {
    bpmOut.textContent = bpmInput.value + ' BPM';
  });

  /* ---------- audio ---------- */
  function initAudio() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      audioNote.textContent = 'This browser will not build an AudioContext, so the cadence cannot be heard. The grid still works as a chart.';
      return;
    }
    ctx = new AC();
    window.__audioCreated = true;
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);

    const len = Math.floor(ctx.sampleRate * 0.6);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  function noiseHit(time, type) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    if (type === 'snare') {
      filter.type = 'bandpass';
      filter.frequency.value = 1900;
      filter.Q.value = 0.9;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.85, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
    } else {
      filter.type = 'highpass';
      filter.frequency.value = 7200;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.32, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);
    }
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(time);
    src.stop(time + (type === 'snare' ? 0.16 : 0.5));
  }

  function toneHit(time, freq, endFreq, level, decay) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay * 0.85);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + decay + 0.02);
  }

  function playHit(inst, time) {
    if (inst === 'snare') {
      noiseHit(time, 'snare');
      toneHit(time, 190, 150, 0.25, 0.08);
    } else if (inst === 'tenor') {
      toneHit(time, 260, 190, 0.5, 0.16);
      toneHit(time, 520, 420, 0.16, 0.09);
    } else if (inst === 'bass') {
      toneHit(time, 74, 58, 0.7, 0.3);
      toneHit(time, 148, 120, 0.2, 0.2);
    } else {
      noiseHit(time, 'cymbal');
    }
  }

  function scheduleStep(step, pattern, time) {
    ROWS.forEach((r) => {
      if (pattern[r.id][step]) playHit(r.id, time);
    });
  }

  function highlight(step) {
    cells.forEach((c) => c.classList.toggle('is-now', Number(c.dataset.col) === step));
    Array.from(lamp.children).forEach((s, i) => {
      s.classList.toggle('on', i === step);
    });
    batonUp = !batonUp;
    if (baton) baton.style.transform = 'rotate(' + (batonUp ? 16 : -10) + 'deg)';
  }

  function clearHighlight() {
    cells.forEach((c) => c.classList.remove('is-now'));
    Array.from(lamp.children).forEach((s) => s.classList.remove('on'));
    if (baton) baton.style.transform = 'rotate(0deg)';
  }

  function tick() {
    const pattern = readPattern();
    const secondsPerStep = 60 / Number(bpmInput.value) / 2;
    while (nextNoteTime < ctx.currentTime + 0.12) {
      const step = currentStep % 8;
      scheduleStep(step, pattern, nextNoteTime);
      const delay = Math.max(0, (nextNoteTime - ctx.currentTime) * 1000);
      window.setTimeout(() => {
        highlight(step);
        totalSteps += 1;
        countOut.textContent = String(totalSteps);
        stepOut.textContent = 'Phrase ' + (Math.floor((totalSteps - 1) / 8) + 1) + ', count ' + (step + 1);
      }, delay);
      nextNoteTime += secondsPerStep;
      currentStep += 1;
    }
  }

  function start() {
    initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    playing = true;
    playBtn.setAttribute('aria-pressed', 'true');
    playLabel.textContent = 'Stop';
    nextNoteTime = ctx.currentTime + 0.08;
    currentStep = 0;
    totalSteps = 0;
    timer = window.setInterval(tick, 25);
    tick();
    audioNote.innerHTML = 'Sound on. Synthesized in the browser at <b>' + bpmInput.value + ' bpm</b> — a snare, tenors, bass and cymbal, no audio files.';
  }

  function stop() {
    playing = false;
    if (timer) window.clearInterval(timer);
    timer = null;
    playBtn.setAttribute('aria-pressed', 'false');
    playLabel.textContent = 'Start cadence';
    clearHighlight();
    audioNote.innerHTML = 'Stopped. Press <b>Start cadence</b> to hear it again; the grid keeps your pattern.';
  }

  playBtn.addEventListener('click', () => {
    if (playing) stop(); else start();
  });

  /* tap tempo, no audio involved */
  let taps = [];
  tapBtn.addEventListener('click', () => {
    const now = Date.now();
    taps = taps.filter((t) => now - t < 4000);
    taps.push(now);
    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.max(60, Math.min(200, Math.round(60000 / avg)));
      bpmInput.value = String(bpm);
      bpmOut.textContent = bpm + ' BPM';
      tapBtn.textContent = 'Tap · ' + taps.length;
    } else {
      tapBtn.textContent = 'Tap again';
    }
    if (taps.length >= 2) {
      window.setTimeout(() => {
        tapBtn.textContent = 'Tap tempo';
        taps = [];
      }, 4000);
    }
  });

  setPattern('street');
})();
