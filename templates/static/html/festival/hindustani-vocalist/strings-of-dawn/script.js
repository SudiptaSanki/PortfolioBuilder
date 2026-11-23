/* Saanvi Chatterjee — strings of dawn
   The page is silent until the tanpura button is pressed: no AudioContext is
   constructed at load, and none is constructed by the visual effects. */

(function () {
  'use strict';

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- clock ---------- */
  const clock = document.getElementById('clock');
  if (clock) {
    const tick = () => {
      const d = new Date();
      clock.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    tick();
    setInterval(tick, 20000);
  }

  /* ---------- nav ---------- */
  const rail = document.querySelector('.rail');
  const toggle = document.querySelector('.nav-toggle');
  if (rail && toggle) {
    toggle.addEventListener('click', () => {
      const open = rail.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    rail.querySelectorAll('.rail-nav a').forEach((a) => {
      a.addEventListener('click', () => {
        rail.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- the wheel ---------- */
  const PRAHARS = [
    { from: 4, name: 'First prahar', raga: 'Lalit' },
    { from: 7, name: 'Second prahar', raga: 'Todi' },
    { from: 10, name: 'Third prahar', raga: 'Jaunpuri' },
    { from: 13, name: 'Fourth prahar', raga: 'Multani' },
    { from: 16, name: 'Fifth prahar', raga: 'Bhimpalasi' },
    { from: 19, name: 'Sixth prahar', raga: 'Yaman' },
    { from: 22, name: 'Seventh prahar', raga: 'Khamaj' },
    { from: 1, name: 'Eighth prahar', raga: 'Bageshri' },
  ];

  const wheel = document.getElementById('wheel');
  function polar(cx, cy, r, hour) {
    const a = ((hour - 4) / 24) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function wedge(cx, cy, r0, r1, h0, h1) {
    const [x0, y0] = polar(cx, cy, r1, h0);
    const [x1, y1] = polar(cx, cy, r1, h1);
    const [x2, y2] = polar(cx, cy, r0, h1);
    const [x3, y3] = polar(cx, cy, r0, h0);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
  }

  if (wheel) {
    const NS = 'http://www.w3.org/2000/svg';
    const cx = 210, cy = 210;
    const el = (n, attrs, text) => {
      const node = document.createElementNS(NS, n);
      Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
      if (text !== undefined) node.textContent = text;
      return node;
    };

    wheel.appendChild(el('circle', { cx, cy, r: 186, fill: 'none', stroke: 'rgba(242,232,216,0.10)', 'stroke-width': 1 }));
    wheel.appendChild(el('circle', { cx, cy, r: 92, fill: 'none', stroke: 'rgba(242,232,216,0.10)', 'stroke-width': 1 }));

    // hour ticks
    for (let h = 0; h < 24; h++) {
      const major = h % 3 === 0;
      const [x0, y0] = polar(cx, cy, 150, h);
      const [x1, y1] = polar(cx, cy, major ? 164 : 157, h);
      wheel.appendChild(el('line', {
        x1: x0.toFixed(1), y1: y0.toFixed(1), x2: x1.toFixed(1), y2: y1.toFixed(1),
        stroke: major ? 'rgba(217,168,78,0.55)' : 'rgba(242,232,216,0.16)', 'stroke-width': 1,
      }));
    }

    // prahar wedges
    PRAHARS.forEach((p, i) => {
      const h0 = p.from, h1 = (p.from + 3) % 24;
      const path = wedge(cx, cy, 92, 150, h0, h0 + 3);
      wheel.appendChild(el('path', {
        d: path,
        fill: i % 2 === 0 ? 'rgba(242,232,216,0.035)' : 'rgba(217,168,78,0.05)',
        stroke: 'rgba(242,232,216,0.09)',
        'stroke-width': 1,
      }));
      const mid = h0 + 1.5;
      const [tx, ty] = polar(cx, cy, 121, mid);
      const label = el('text', {
        x: tx.toFixed(1), y: ty.toFixed(1), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: '#f2e8d8', 'font-size': 12, 'font-family': 'Marcellus, serif',
      }, p.raga);
      wheel.appendChild(label);
    });

    // outer hour numbers
    [4, 7, 10, 13, 16, 19, 22, 1].forEach((h) => {
      const [x, y] = polar(cx, cy, 174, h);
      wheel.appendChild(el('text', {
        x: x.toFixed(1), y: y.toFixed(1), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: '#9aa4c0', 'font-size': 10, 'font-family': 'Karla, sans-serif', 'letter-spacing': '0.05em',
      }, h + 'h'));
    });

    const hand = el('g', { class: 'wheel-hand' });
    const handLine = el('line', {
      x1: cx, y1: cy, x2: cx, y2: cy - 86, stroke: '#d9a84e', 'stroke-width': 1.6, 'stroke-linecap': 'round',
    });
    hand.appendChild(handLine);
    hand.appendChild(el('circle', { cx, cy, r: 3.4, fill: '#d9a84e' }));
    wheel.appendChild(hand);
    wheel.appendChild(el('text', {
      x: cx, y: cy + 30, 'text-anchor': 'middle', fill: '#9aa4c0', 'font-size': 9,
      'font-family': 'Karla, sans-serif', 'letter-spacing': '0.12em',
    }, 'YOUR HOUR'));

    const nowEl = document.getElementById('wheelNow');
    const ragaEl = document.getElementById('wheelRaga');
    function placeHand() {
      const d = new Date();
      const h = d.getHours() + d.getMinutes() / 60;
      handLine.setAttribute('transform', `rotate(${((h - 4) / 24) * 360} ${cx} ${cy})`);
      const p = PRAHARS.find((q) => (h >= q.from && h < q.from + 3) || (q.from + 3 > 24 && h < q.from + 3 - 24));
      if (nowEl) nowEl.textContent = d.toTimeString().slice(0, 5);
      if (ragaEl && p) ragaEl.textContent = p.raga + ' · ' + p.name.toLowerCase();
      if (ragaEl && !p) ragaEl.textContent = 'between prahars';
    }
    placeHand();
    setInterval(placeHand, 60000);
  }

  /* ---------- audio: nothing is constructed until a gesture ---------- */

  const SWARAS = [
    { name: 'Sa', dev: 'सा', ratio: 1, semis: 0, note: 'ṣaḍja' },
    { name: 'Re', dev: 'रे', ratio: 9 / 8, semis: 2, note: 'śuddha re' },
    { name: 're', dev: 'रे॒', ratio: 16 / 15, semis: 1, note: 'komal re' },
    { name: 'Ga', dev: 'ग', ratio: 5 / 4, semis: 4, note: 'śuddha ga' },
    { name: 'ga', dev: 'ग॒', ratio: 6 / 5, semis: 3, note: 'komal ga' },
    { name: 'Ma', dev: 'म', ratio: 4 / 3, semis: 5, note: 'śuddha ma' },
    { name: 'Ma↑', dev: 'म॑', ratio: 45 / 32, semis: 6, note: 'tīvra ma' },
    { name: 'Pa', dev: 'प', ratio: 3 / 2, semis: 7, note: 'pañcama' },
    { name: 'dha', dev: 'ध॒', ratio: 8 / 5, semis: 8, note: 'komal dha' },
    { name: 'Dha', dev: 'ध', ratio: 5 / 3, semis: 9, note: 'śuddha dha' },
    { name: 'ni', dev: 'नि॒', ratio: 16 / 9, semis: 10, note: 'komal ni' },
    { name: 'Ni', dev: 'नि', ratio: 9 / 5, semis: 11, note: 'śuddha ni' },
  ];

  const audio = {
    ctx: null, master: null, droneTimer: null, step: 0,
    on: false, level: 0.58, sa: 138.59,
  };

  function ensureAudio() {
    if (!audio.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio.ctx = new AC();
      window.__audioCreated = true;
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.0001;
      const comp = audio.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 3;
      audio.master.connect(comp);
      comp.connect(audio.ctx.destination);
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }

  function pluck(freq, when, dur, level) {
    const ctx = audio.ctx;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(level, when + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(Math.min(5200, freq * 14), when);
    filt.frequency.exponentialRampToValueAtTime(Math.max(320, freq * 4), when + dur * 0.8);

    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.value = freq;

    const jawari = ctx.createOscillator();
    jawari.type = 'sawtooth';
    jawari.frequency.value = freq * 2.006;
    const jawariGain = ctx.createGain();
    jawariGain.gain.value = 0.06;

    body.connect(filt);
    jawari.connect(jawariGain);
    jawariGain.connect(filt);
    filt.connect(env);
    env.connect(audio.master);

    body.start(when);
    jawari.start(when);
    body.stop(when + dur + 0.05);
    jawari.stop(when + dur + 0.05);
  }

  function stringSet() {
    const sa = audio.sa;
    return [sa * 0.75, sa, sa, sa * 0.5]; // Pa, Sa, Sa, Sa (mandra)
  }

  function scheduleDrone() {
    if (!audio.on) return;
    const t = audio.ctx.currentTime + 0.06;
    const freqs = stringSet();
    pluck(freqs[audio.step % 4], t, 7.5, 0.16);
    audio.step += 1;
    // a soft full-string strum every fourth cycle, the way a player resets the drone
    if (audio.step % 4 === 0) {
      freqs.forEach((f, i) => pluck(f, t + 0.02 + i * 0.012, 6.4, 0.045));
    }
  }

  const droneBtn = document.getElementById('droneBtn');
  const consoleEl = document.getElementById('console');
  const droneStatus = document.getElementById('droneStatus');
  const tonicSel = document.getElementById('tonic');
  const volEl = document.getElementById('vol');
  const stringHint = document.getElementById('stringHint');

  function setPlaying(on) {
    audio.on = on;
    if (consoleEl) consoleEl.classList.toggle('playing', on);
    if (droneBtn) {
      droneBtn.setAttribute('aria-pressed', String(on));
      const txt = droneBtn.querySelector('.btn-text');
      if (txt) txt.textContent = on ? 'Stop the tanpura' : 'Start the tanpura';
      const icon = droneBtn.querySelector('.btn-icon');
      if (icon) icon.innerHTML = on
        ? '<svg viewBox="0 0 20 20" width="16" height="16"><rect x="5" y="5" width="10" height="10" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M6 4l10 6-10 6Z" fill="currentColor"/></svg>';
    }
    if (droneStatus) {
      droneStatus.className = 'console-status' + (on ? ' on' : '');
      droneStatus.textContent = on
        ? 'Playing. Sa ' + audio.sa.toFixed(1) + ' Hz, tanpura plucked in a slow four-string cycle.'
        : 'Silent. The tanpura starts when you press start.';
    }
  }

  function startDrone() {
    const ctx = ensureAudio();
    if (!ctx) {
      if (droneStatus) {
        droneStatus.className = 'console-status warn';
        droneStatus.textContent = 'This browser will not run Web Audio, so the drone stays silent. Everything else on the page works.';
      }
      return;
    }
    audio.master.gain.cancelScheduledValues(ctx.currentTime);
    audio.master.gain.setValueAtTime(Math.max(0.0001, audio.master.gain.value), ctx.currentTime);
    audio.master.gain.exponentialRampToValueAtTime(Math.max(0.02, audio.level * 0.9), ctx.currentTime + 1.2);
    audio.step = 0;
    scheduleDrone();
    audio.droneTimer = setInterval(scheduleDrone, 1650);
    setPlaying(true);
  }

  function stopDrone() {
    if (!audio.ctx) { setPlaying(false); return; }
    const ctx = audio.ctx;
    clearInterval(audio.droneTimer);
    audio.droneTimer = null;
    audio.master.gain.cancelScheduledValues(ctx.currentTime);
    audio.master.gain.setValueAtTime(audio.master.gain.value, ctx.currentTime);
    audio.master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    setPlaying(false);
  }

  if (droneBtn) {
    droneBtn.addEventListener('click', () => {
      if (audio.on) stopDrone(); else startDrone();
    });
  }

  document.querySelectorAll('[data-start-drone]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!audio.on) startDrone();
      const room = document.getElementById('room');
      if (room) room.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  if (tonicSel) {
    tonicSel.addEventListener('change', () => {
      audio.sa = parseFloat(tonicSel.value) || 138.59;
      if (stringHint) {
        stringHint.textContent = 'Four strings, tuned Pa ' + (audio.sa * 0.75).toFixed(1) + ' · Sa ' + audio.sa.toFixed(1) + ' · ' + audio.sa.toFixed(1) + ' · ' + (audio.sa * 0.5).toFixed(1) + ' Hz.';
      }
      if (droneStatus && audio.on) droneStatus.textContent = 'Playing. Sa ' + audio.sa.toFixed(1) + ' Hz, tanpura plucked in a slow four-string cycle.';
    });
  }

  if (volEl) {
    volEl.addEventListener('input', () => {
      audio.level = Number(volEl.value) / 100;
      if (audio.ctx && audio.on) {
        audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
        audio.master.gain.setTargetAtTime(Math.max(0.02, audio.level * 0.9), audio.ctx.currentTime, 0.15);
      }
    });
  }

  /* ---------- swara pad ---------- */

  const pad = document.getElementById('pad');
  const padReadout = document.getElementById('padReadout');
  let padTimer = null;

  function centsOf(s) {
    return Math.round((1200 * Math.log2(s.ratio) - 100 * s.semis) * 10) / 10;
  }

  if (pad) {
    SWARAS.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swara';
      b.dataset.ratio = String(s.ratio);
      b.setAttribute('aria-label', s.name + ', ' + s.note + ', ratio ' + (s.ratio === 1 ? '1/1' : '') );
      const cents = centsOf(s);
      b.innerHTML = '<em lang="hi">' + s.dev + '</em><b>' + s.name + '</b><span>' +
        (Math.abs(cents) < 0.5 ? 'just · 0¢' : (cents > 0 ? '+' : '') + cents + '¢') + '</span>';
      b.addEventListener('click', () => {
        const ctx = ensureAudio();
        if (!ctx) {
          if (padReadout) padReadout.innerHTML = 'Web Audio is not available in this browser; the pad stays silent.';
          return;
        }
        if (!audio.on) {
          audio.master.gain.cancelScheduledValues(ctx.currentTime);
          audio.master.gain.setValueAtTime(Math.max(0.0001, audio.master.gain.value), ctx.currentTime);
          audio.master.gain.exponentialRampToValueAtTime(Math.max(0.02, audio.level * 0.9), ctx.currentTime + 0.25);
        }
        pluck(audio.sa * 2 * s.ratio, ctx.currentTime + 0.02, 2.9, 0.26);
        b.classList.add('hit');
        clearTimeout(padTimer);
        padTimer = setTimeout(() => b.classList.remove('hit'), 180);
        if (padReadout) {
          const c = centsOf(s);
          padReadout.innerHTML = '<b>' + s.name + '</b> · ' + s.note + ' · ' + (s.ratio === 1 ? '1/1' : (s.ratio * 1000 % 100 === 0 ? s.ratio : s.ratio.toFixed(4))) +
            ' · ' + Math.round(1200 * Math.log2(s.ratio)) + ' cents above Sa, ' +
            (Math.abs(c) < 0.5 ? 'exactly on the piano key' : Math.abs(c) + ' cents ' + (c > 0 ? 'sharper' : 'flatter') + ' than equal temperament') +
            ' · ' + (audio.sa * 2 * s.ratio).toFixed(1) + ' Hz.';
        }
      });
      pad.appendChild(b);
    });
  }

  /* ---------- contact form ---------- */
  const form = document.getElementById('inviteForm');
  if (form) {
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const name = String(d.get('name') || '').trim();
      const email = String(d.get('email') || '').trim();
      const purpose = String(d.get('purpose') || '').trim();
      const message = String(d.get('message') || '').trim();
      const bad = [];
      if (name.length < 2) bad.push('your name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push('a working email address');
      if (message.length < 12) bad.push('a line about what you are asking for');
      if (bad.length) {
        status.className = 'form-status err';
        status.textContent = 'Please add ' + bad.join(', ') + '.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Thank you, ' + name.split(' ')[0] + '. ' +
        (purpose === 'study' ? 'I write to students on the first Sunday of the month; you will hear from me then.'
          : purpose === 'baithak' ? 'I will hold a place and send you the address a week before, once the room is confirmed.'
          : 'I answer my own mail, usually within three days.') +
        ' If it is urgent, the number on this page reaches me faster.';
      form.reset();
    });
  }
})();
