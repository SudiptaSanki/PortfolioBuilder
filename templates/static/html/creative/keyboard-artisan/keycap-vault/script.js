/* Keycap Vault — switch acoustics bench, colourway plate, page chrome.
   Sound is synthesised on demand. Nothing plays without a press. */

(() => {
  'use strict';

  /* ---------- mobile navigation ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- switch model ---------- */
  const SWITCHES = {
    tactile: {
      label: 'Tactile',
      note: 'D-shaped bump at 1.9 mm. Bottom-out is a dry thock with a 2.4 kHz edge.',
      house: 'PC top / nylon base',
      travel: 4.0,
      peak: 38,
      decay: 34,
      pitch: 1,
      click: false,
      bump: true
    },
    linear: {
      label: 'Linear',
      note: 'No bump, no click. The sound is all spring and housing — deeper, longer, quieter.',
      house: 'PC top / POM base',
      travel: 4.0,
      peak: 33,
      decay: 52,
      pitch: 0.86,
      click: false,
      bump: false
    },
    clicky: {
      label: 'Clicky',
      note: 'Two-stage click bar. Short, bright, and 3 dB louder at the top of the stroke.',
      house: 'PC top / polycarb base',
      travel: 3.6,
      peak: 47,
      decay: 18,
      pitch: 1.38,
      click: true,
      bump: true
    }
  };

  const COLORWAYS = {
    ember: { name: 'Ember', top: '#c25a3c', face: '#b04a2f', side: '#8d3a23', legend: '#f7f2e6' },
    kiln: { name: 'Kiln Blue', top: '#4a6f86', face: '#3c5c71', side: '#2c4657', legend: '#eef2f2' },
    ash: { name: 'Ash Glaze', top: '#cfcabb', face: '#b9b3a2', side: '#948e7e', legend: '#24211c' },
    oxblood: { name: 'Oxblood', top: '#6d2b2f', face: '#58222a', side: '#401820', legend: '#eadfd2' }
  };

  const state = {
    switchKey: 'tactile',
    colorKey: 'ember',
    spring: 55,
    lastPeak: null,
    lastDecay: null
  };

  const root = document.documentElement;
  const roAct = document.getElementById('roAct');
  const roBot = document.getElementById('roBot');
  const roTrv = document.getElementById('roTrv');
  const roPeak = document.getElementById('roPeak');
  const roDec = document.getElementById('roDec');
  const roHouse = document.getElementById('roHouse');
  const switchNote = document.getElementById('switch-note');
  const springOut = document.getElementById('springOut');
  const spring = document.getElementById('spring');
  const scopeMode = document.getElementById('scopeMode');

  const actuation = () => Math.round(state.spring * 0.82);

  function paintReadout() {
    const s = SWITCHES[state.switchKey];
    const c = COLORWAYS[state.colorKey];
    if (roAct) roAct.textContent = `${actuation()} gf`;
    if (roBot) roBot.textContent = `${state.spring} gf`;
    if (roTrv) roTrv.textContent = `${s.travel.toFixed(1)} mm`;
    if (roPeak) roPeak.textContent = state.lastPeak === null ? '—' : `${state.lastPeak.toFixed(1)} dB`;
    if (roDec) roDec.textContent = state.lastDecay === null ? '—' : `${state.lastDecay} ms`;
    if (roHouse) roHouse.textContent = s.house;
    if (switchNote) switchNote.textContent = s.note;
    if (springOut) springOut.textContent = `${state.spring} gf`;
    if (scopeMode) scopeMode.textContent = `${s.label} / ${c.name} / ${state.spring} gf`;
  }

  /* ---------- audio ---------- */
  let ctx = null;
  let bus = null;

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      bus = ctx.createGain();
      bus.gain.value = 0.5;
      bus.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noiseBuffer(seconds) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1;
      last = 0.72 * last + 0.28 * white;
      data[i] = last;
    }
    return buf;
  }

  function noiseHit(at, dur, freq, q, gain, type) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur + 0.01);
    const filter = ctx.createBiquadFilter();
    filter.type = type || 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
    src.connect(filter).connect(g).connect(bus);
    src.start(at);
    src.stop(at + dur + 0.02);
  }

  function thock(at, freq, dur, gain, drop) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * (drop || 0.72)), at + dur * 0.85);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
    osc.connect(g).connect(bus);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  function playSwitch(key) {
    const c = audio();
    if (!c) return null;
    const s = SWITCHES[state.switchKey];
    const t = c.currentTime + 0.012;
    const weight = state.spring / 55;
    const pitch = s.pitch * (1 + (state.spring - 55) * -0.0018);
    const offsets = { esc: 0.94, 1: 1, 2: 1.03, q: 0.97, w: 0.99, art: 0.82 };
    const k = offsets[key] || 1;

    if (s.click) {
      noiseHit(t, 0.016, 3600 * pitch, 1.4, 0.42, 'highpass');
      thock(t + 0.002, 1750 * pitch * k, 0.022, 0.1 * weight, 0.6);
      noiseHit(t + 0.03, 0.02, 2500 * pitch, 2.2, 0.22, 'bandpass');
    } else if (s.bump) {
      noiseHit(t, 0.02, 900 * pitch, 1.6, 0.13 * weight, 'bandpass');
      thock(t + 0.004, 330 * pitch * k, 0.035, 0.08 * weight, 0.8);
    }

    thock(t + 0.055, 132 * pitch * k, 0.13 + state.spring * 0.0009, 0.34 * weight, 0.62);
    noiseHit(t + 0.056, 0.035, 640 * pitch, 0.9, 0.16 * weight, 'lowpass');
    if (s.click) noiseHit(t + 0.058, 0.012, 1800 * pitch, 1.2, 0.12, 'bandpass');

    state.lastPeak = s.peak + (state.spring - 55) * 0.11 + (key === 'art' ? 2.1 : 0);
    state.lastDecay = Math.round(s.decay * (0.9 + state.spring / 400));
    paintReadout();
    return { peak: state.lastPeak, decay: state.lastDecay };
  }

  /* ---------- waveform drawing ---------- */
  const canvas = document.getElementById('scope');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function envelope(x, s, weight) {
    // x: 0..1 across 180 ms
    const t = x * 180;
    let a = 0;
    if (s.click) a += 0.75 * Math.exp(-Math.pow((t - 4) / 7, 2));
    if (s.bump) a += 0.3 * Math.exp(-Math.pow((t - 12) / 10, 2));
    a += Math.exp(-Math.pow((t - 62) / (s.decay * 0.9), 1.35)) * (0.72 + weight * 0.2);
    a += 0.16 * Math.exp(-Math.pow((t - 78) / 42, 1.6)) * Math.sin(t / 5.2) * Math.sin(t / 17);
    return Math.min(1, Math.max(0, a));
  }

  function drawScope(progress) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 700;
    const h = canvas.clientHeight || 150;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    const s = SWITCHES[state.switchKey];
    const weight = state.spring / 55;
    const mid = h * 0.62;

    // grid
    g.strokeStyle = 'rgba(244,240,231,0.10)';
    g.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const y = (h / 4) * i;
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(w, y + 0.5);
      g.stroke();
    }
    for (let i = 1; i < 6; i += 1) {
      const x = (w / 6) * i;
      g.beginPath();
      g.moveTo(x + 0.5, 0);
      g.lineTo(x + 0.5, h);
      g.stroke();
    }

    // curve
    const pts = [];
    const N = Math.max(180, Math.round(w));
    for (let i = 0; i <= N; i += 1) {
      const x = i / N;
      const a = envelope(x, s, weight);
      const y = mid - a * (h * 0.46);
      pts.push([x * w, y]);
    }
    g.beginPath();
    g.moveTo(0, mid);
    pts.forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(w, mid);
    g.closePath();
    const grad = g.createLinearGradient(0, 0, 0, mid);
    grad.addColorStop(0, 'rgba(176,74,47,0.42)');
    grad.addColorStop(1, 'rgba(176,74,47,0.04)');
    g.fillStyle = grad;
    g.fill();

    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = '#e3856a';
    g.lineWidth = 1.6;
    g.stroke();

    // baseline
    g.strokeStyle = 'rgba(244,240,231,0.28)';
    g.beginPath();
    g.moveTo(0, mid + 0.5);
    g.lineTo(w, mid + 0.5);
    g.stroke();

    if (typeof progress === 'number' && progress > 0) {
      const x = Math.min(1, progress) * w;
      g.strokeStyle = 'rgba(244,240,231,0.55)';
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
  }

  let playRaf = 0;
  function animateScope() {
    if (reduceMotion.matches) {
      drawScope(0);
      return;
    }
    const start = performance.now();
    cancelAnimationFrame(playRaf);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 320);
      drawScope(p);
      if (p < 1) playRaf = requestAnimationFrame(tick);
    };
    playRaf = requestAnimationFrame(tick);
  }

  /* ---------- controls ---------- */
  document.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.switchKey = btn.dataset.switch;
      document.querySelectorAll('.seg-btn').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      state.lastPeak = null;
      state.lastDecay = null;
      paintReadout();
      drawScope(0);
    });
  });

  document.querySelectorAll('.swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.colorKey = btn.dataset.color;
      const c = COLORWAYS[state.colorKey];
      root.style.setProperty('--cap-top', c.top);
      root.style.setProperty('--cap-face', c.face);
      root.style.setProperty('--cap-side', c.side);
      root.style.setProperty('--legend', c.legend);
      document.querySelectorAll('.swatch').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paintReadout();
      drawScope(0);
    });
  });

  if (spring) {
    spring.addEventListener('input', () => {
      state.spring = Number(spring.value);
      paintReadout();
      drawScope(0);
    });
  }

  document.querySelectorAll('.key').forEach((key) => {
    key.addEventListener('click', () => {
      key.classList.add('is-down');
      window.setTimeout(() => key.classList.remove('is-down'), 130);
      playSwitch(key.dataset.key);
      animateScope();
    });
  });

  /* ---------- page chrome ---------- */
  paintReadout();
  if (canvas) {
    drawScope(0);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => drawScope(0));
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', () => drawScope(0));
    }
  }

  /* ---------- batch filter (projects page) ---------- */
  const filters = [...document.querySelectorAll('.filter')];
  const batches = [...document.querySelectorAll('.batch')];
  const filterCount = document.getElementById('filterCount');
  if (filters.length && batches.length) {
    const labels = { all: 'all', colourway: 'colourway', sculpted: 'sculpted', blank: 'blank' };
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.filter;
        filters.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        let shown = 0;
        batches.forEach((b) => {
          const match = kind === 'all' || b.dataset.kind === kind;
          b.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (filterCount) {
          filterCount.textContent = kind === 'all'
            ? `Showing all ${shown} batches`
            : `Showing ${shown} ${labels[kind]} ${shown === 1 ? 'batch' : 'batches'}`;
        }
      });
    });
  }

  /* ---------- commission brief ---------- */
  const form = document.getElementById('briefForm');
  if (form) {
    const result = document.getElementById('briefResult');
    const preview = document.getElementById('briefPreview');
    const send = document.getElementById('briefSend');
    const edit = document.getElementById('briefEdit');
    const fields = {
      name: document.getElementById('name'),
      email: document.getElementById('email'),
      board: document.getElementById('board'),
      message: document.getElementById('message'),
      consent: document.getElementById('consent')
    };

    const rules = {
      name: (v) => v.trim().length > 1,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      board: (v) => v.trim().length > 1,
      message: (v) => v.trim().length > 8,
      consent: (v, el) => el.checked
    };

    Object.entries(fields).forEach(([key, el]) => {
      const err = document.getElementById(`err-${key}`);
      if (!err || !el) return;
      el.setAttribute('aria-describedby', err.id);
      const clear = () => {
        err.hidden = true;
        el.removeAttribute('aria-invalid');
      };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });

    const validate = () => {
      let firstBad = null;
      Object.entries(fields).forEach(([key, el]) => {
        const err = document.getElementById(`err-${key}`);
        const ok = rules[key](el.value, el);
        if (err) err.hidden = ok;
        if (ok) el.removeAttribute('aria-invalid');
        else {
          el.setAttribute('aria-invalid', 'true');
          if (!firstBad) firstBad = el;
        }
      });
      if (firstBad) firstBad.focus();
      return !firstBad;
    };

    const buildBrief = () => {
      const q = document.getElementById('quantity').value;
      const p = document.getElementById('profile').value;
      const colour = document.getElementById('colour').value.trim() || 'Open to the house palette';
      return [
        `Commission brief — Keycap Vault`,
        ``,
        `Name: ${fields.name.value.trim()}`,
        `Email: ${fields.email.value.trim()}`,
        `Board / switch: ${fields.board.value.trim()}`,
        `Quantity: ${q}`,
        `Profile and row: ${p}`,
        `Colourway: ${colour}`,
        ``,
        fields.message.value.trim(),
        ``,
        `Deposit terms acknowledged: yes`
      ].join('\n');
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) return;
      const brief = buildBrief();
      preview.textContent = brief;
      send.href = `mailto:bench@keycapvault.studio?subject=${encodeURIComponent('Commission brief — ' + fields.name.value.trim())}&body=${encodeURIComponent(brief)}`;
      result.hidden = false;
      result.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });

    edit.addEventListener('click', () => {
      result.hidden = true;
      fields.name.focus();
    });
  }

  // expose a small read surface for the headless checks
  window.__kv = {
    switchKey: () => state.switchKey,
    colorKey: () => state.colorKey,
    spring: () => state.spring,
    actuation,
    play: (k) => playSwitch(k || 'q'),
    scopeNonBlank: () => {
      if (!canvas) return false;
      const g = canvas.getContext('2d');
      const d = g.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return true;
      return false;
    }
  };
})();
