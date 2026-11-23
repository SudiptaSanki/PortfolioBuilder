/* Chrono Craft — live Swiss-lever escapement, torque curve, escapement audio. */

(() => {
  'use strict';

  /* nav */
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* page features that work without the bench (filters/forms on inner pages) */
  initPages();

  const svg = document.getElementById('escapement');
  if (!svg) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { beat: 21600, power: 72, ticking: false };

  const gearTeeth = document.getElementById('escapeTeeth');
  for (let i = 0; i < 15; i += 1) {
    const a = (i / 15) * Math.PI * 2;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'escape-tooth');
    line.setAttribute('x1', (Math.cos(a) * 32).toFixed(2));
    line.setAttribute('y1', (Math.sin(a) * 32).toFixed(2));
    line.setAttribute('x2', (Math.cos(a + 0.1) * 41).toFixed(2));
    line.setAttribute('y2', (Math.sin(a + 0.1) * 41).toFixed(2));
    gearTeeth.appendChild(line);
  }

  const $ = (id) => document.getElementById(id);
  const balanceGroup = $('balanceGroup');
  const escapeSmall = $('escapeGroupSmall');
  const forkGroup = $('forkGroup');
  const powerRange = $('powerRange');
  const powerOut = $('powerOut');
  const pvFreq = $('pvFreq');
  const pvAmp = $('pvAmp');
  const pvTorque = $('pvTorque');
  const pvRate = $('pvRate');
  const tcPath = $('tcPath');
  const tcMarker = $('tcMarker');
  const tcDot = $('tcDot');
  const torqueNow = $('torqueNow');

  const T0 = 4.6; // µNm at full wind
  const amplitude = () => Math.round(208 + state.power * 1.06);
  const torque = () => T0 * (1 - 0.38 * (1 - state.power / 100));
  const rate = () => (0.6 + (100 - state.power) * 0.042).toFixed(1);
  const freq = () => state.beat / 7200;

  function curve() {
    const elapsedAt = (p) => 42 * (1 - p / 100);
    const yFor = (t) => 78 - ((t - T0 * 0.62) / (T0 * 0.38)) * 56;
    let d = '';
    for (let i = 0; i <= 40; i += 1) {
      const hours = (i / 40) * 42;
      const t = T0 * (1 - (0.38 * hours) / 42);
      const x = (i / 40) * 360;
      const y = Math.max(14, Math.min(80, yFor(t)));
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    tcPath.setAttribute('d', d.trim());

    const elapsed = elapsedAt(state.power);
    const mx = (elapsed / 42) * 360;
    tcMarker.setAttribute('x1', mx.toFixed(1));
    tcMarker.setAttribute('x2', mx.toFixed(1));
    tcDot.setAttribute('cx', mx.toFixed(1));
    tcDot.setAttribute('cy', Math.max(14, Math.min(80, yFor(torque()))).toFixed(1));
  }

  function paint() {
    powerOut.textContent = `${state.power} %`;
    pvFreq.textContent = `${freq()} Hz`;
    pvAmp.textContent = `${amplitude()}°`;
    pvTorque.textContent = `${torque().toFixed(1)} µNm`;
    pvRate.textContent = `${rate()} s/d`;
    torqueNow.textContent = `${state.power} %`;
    curve();
    if (state.ticking) restartTicker();
  }

  /* ---------- animation ---------- */
  let t0 = null;
  function frame(now) {
    if (t0 === null) t0 = now;
    const t = (now - t0) / 1000;
    const f = freq();
    const phase = 2 * Math.PI * f * t;
    const amp = amplitude();
    const angle = Math.sin(phase) * (amp / 2);
    balanceGroup.setAttribute('transform', `rotate(${angle.toFixed(2)} 230 230)`);

    const step = Math.floor(phase / Math.PI);
    const escAngle = (step * 24) % 360;
    escapeSmall.setAttribute('transform', `rotate(${escAngle} 230 382)`);

    const forkAngle = Math.sin(phase) * 7;
    forkGroup.setAttribute('transform', `rotate(${forkAngle.toFixed(2)} 230 330)`);
    requestAnimationFrame(frame);
  }

  /* ---------- audio ---------- */
  let ctx = null;
  let noise = null;
  let timer = 0;

  function ensureAudio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const len = Math.floor(ctx.sampleRate * 0.02);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tick() {
    if (!ctx) return;
    const at = ctx.currentTime + 0.001;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3800;
    bp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, at);
    g.gain.exponentialRampToValueAtTime(0.0005, at + 0.02);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(at);
    src.stop(at + 0.03);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1250, at);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.06, at);
    g2.gain.exponentialRampToValueAtTime(0.0004, at + 0.012);
    osc.connect(g2).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.02);
  }

  function restartTicker() {
    window.clearInterval(timer);
    if (!state.ticking) return;
    const ms = 1000 / (freq() * 2);
    timer = window.setInterval(tick, Math.max(40, ms));
  }

  const tickBtn = $('tickBtn');
  const tickLabel = $('tickLabel');
  if (tickBtn) {
    tickBtn.addEventListener('click', () => {
      state.ticking = !state.ticking;
      tickBtn.setAttribute('aria-pressed', String(state.ticking));
      tickLabel.textContent = state.ticking ? 'Silence the escapement' : 'Hear the escapement';
      if (state.ticking) {
        ensureAudio();
        tick();
        restartTicker();
      } else {
        window.clearInterval(timer);
      }
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearInterval(timer);
    else if (state.ticking) restartTicker();
  });

  /* ---------- controls ---------- */
  document.querySelectorAll('.beat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.beat = Number(btn.dataset.beat);
      document.querySelectorAll('.beat-btn').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paint();
    });
  });
  powerRange.addEventListener('input', () => {
    state.power = Number(powerRange.value);
    paint();
  });

  if (reduce.matches) {
    balanceGroup.setAttribute('transform', 'rotate(0 230 230)');
  } else {
    requestAnimationFrame(frame);
  }
  paint();

  window.__cc = {
    state: () => ({ ...state }),
    setBeat: (v) => {
      const btn = document.querySelector(`.beat-btn[data-beat="${v}"]`);
      if (btn) btn.click();
    },
    setPower: (v) => {
      powerRange.value = String(v);
      powerRange.dispatchEvent(new Event('input', { bubbles: true }));
    },
    values: () => ({
      freq: pvFreq.textContent,
      amp: pvAmp.textContent,
      torque: pvTorque.textContent,
      rate: pvRate.textContent,
      beat: state.beat
    }),
    balance: () => balanceGroup.getAttribute('transform'),
    tickOn: () => state.ticking,
    toggle: () => tickBtn.click()
  };
})();

/* ---------- inner-page features ---------- */
function initPages() {
  const filters = [...document.querySelectorAll('.filter')];
  const cases = [...document.querySelectorAll('.case')];
  const countEl = document.getElementById('restoCount');
  if (filters.length && cases.length) {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.filter;
        filters.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        let shown = 0;
        cases.forEach((c) => {
          const match = kind === 'all' || c.dataset.kind === kind;
          c.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (countEl) {
          countEl.textContent = kind === 'all' ? 'Six jobs shown' : `${shown} of 6 jobs shown`;
        }
      });
    });
  }

  const form = document.getElementById('serviceForm');
  if (form) {
    const result = document.getElementById('serviceResult');
    const preview = document.getElementById('servicePreview');
    const send = document.getElementById('serviceSend');
    const edit = document.getElementById('serviceEdit');
    const fields = {
      name: document.getElementById('name'),
      email: document.getElementById('email'),
      watch: document.getElementById('watch'),
      message: document.getElementById('message'),
      consent: document.getElementById('consent')
    };
    const rules = {
      name: (v) => v.trim().length > 1,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      watch: (v) => v.trim().length > 2,
      message: (v) => v.trim().length > 8,
      consent: (v, el) => el.checked
    };
    Object.entries(fields).forEach(([key, el]) => {
      const err = document.getElementById(`err-${key}`);
      if (!err) return;
      el.setAttribute('aria-describedby', err.id);
      const clear = () => { err.hidden = true; el.removeAttribute('aria-invalid'); };
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) return;
      const get = (id) => document.getElementById(id);
      const brief = [
        'Service booking — Chrono Craft',
        '',
        `Name: ${fields.name.value.trim()}`,
        `Email: ${fields.email.value.trim()}`,
        `Watch: ${fields.watch.value.trim()}`,
        `Service: ${get('service').value}`,
        `Condition: ${get('condition').value}`,
        `Deadline: ${get('deadline').value.trim() || 'none'}`,
        '',
        fields.message.value.trim(),
        '',
        'Terms acknowledged: estimate before work, old parts returned'
      ].join('\n');
      preview.textContent = brief;
      send.href = `mailto:bench@chronocraft.studio?subject=${encodeURIComponent('Service booking — ' + fields.name.value.trim())}&body=${encodeURIComponent(brief)}`;
      result.hidden = false;
      result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    edit.addEventListener('click', () => {
      result.hidden = true;
      fields.name.focus();
    });
  }
}
