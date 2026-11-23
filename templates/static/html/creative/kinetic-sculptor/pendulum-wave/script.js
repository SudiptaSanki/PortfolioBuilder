/* Pendulum Wave — coupled field simulation + studio chrome.
   Positions come from T = 2π√(L/g) with an exponential damping envelope. */

(() => {
  'use strict';

  /* ---------- nav ---------- */
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

  /* ---------- field model ---------- */
  const G = 9.81;
  const BASE_LENGTH = 1.0; // metres
  const AMP = 0.16;        // radians at release

  const state = {
    count: 32,
    step: 6,        // mm
    damp: 4,        // slider units, /1000
    t: 0,
    paused: false,
    kicked: new Float64Array(48),
    last: 0
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.getElementById('fieldCanvas');
  const stageTag = document.getElementById('stageTag');
  const roFirst = document.getElementById('roFirst');
  const roLast = document.getElementById('roLast');
  const roBeat = document.getElementById('roBeat');
  const roEnergy = document.getElementById('roEnergy');
  const countIn = document.getElementById('count');
  const stepIn = document.getElementById('step');
  const dampIn = document.getElementById('damp');
  const countOut = document.getElementById('countOut');
  const stepOut = document.getElementById('stepOut');
  const dampOut = document.getElementById('dampOut');

  const lengthOf = (i) => BASE_LENGTH + (i * state.step) / 1000;
  const periodOf = (i) => 2 * Math.PI * Math.sqrt(lengthOf(i) / G);
  const theta = (i, time) => {
    const T = periodOf(i);
    const env = Math.exp(-(state.damp / 1000) * time);
    return AMP * env * (Math.cos((2 * Math.PI * time) / T) + state.kicked[i] * 0.55);
  };

  function paintReadouts() {
    const first = periodOf(0);
    const last = periodOf(state.count - 1);
    const beat = (first * last) / Math.abs(last - first);
    if (roFirst) roFirst.textContent = `${first.toFixed(3)} s`;
    if (roLast) roLast.textContent = `${last.toFixed(3)} s`;
    if (roBeat) roBeat.textContent = `${beat.toFixed(1)} s`;
    if (countOut) countOut.textContent = String(state.count);
    if (stepOut) stepOut.textContent = `${state.step} mm`;
    if (dampOut) dampOut.textContent = (state.damp / 1000).toFixed(3);
    if (roEnergy) roEnergy.textContent = Math.exp(-(state.damp / 1000) * state.t).toFixed(2);
  }

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    return { w, h, dpr };
  }

  function draw() {
    if (!canvas) return;
    const { w, h, dpr } = layout();
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    const n = state.count;
    const padX = Math.max(24, w * 0.045);
    const span = w - padX * 2;
    const beamY = Math.round(h * 0.14);
    const bobTop = beamY + Math.round(h * 0.12);
    const bobSpan = Math.round(h * 0.2);
    const traceBase = Math.round(h * 0.62);
    const traceH = Math.round(h * 0.26);
    const stepX = span / (n - 1);

    // ground rules
    g.strokeStyle = 'rgba(233,228,215,0.10)';
    g.lineWidth = 1;
    for (let k = 1; k <= 3; k += 1) {
      const y = traceBase + (traceH / 3) * k;
      g.beginPath();
      g.moveTo(padX, y + 0.5);
      g.lineTo(w - padX, y + 0.5);
      g.stroke();
    }
    g.strokeStyle = 'rgba(233,228,215,0.18)';
    g.beginPath();
    g.moveTo(padX, beamY + 0.5);
    g.lineTo(w - padX, beamY + 0.5);
    g.stroke();

    // labels
    g.fillStyle = 'rgba(233,228,215,0.42)';
    g.font = '10px "dm mono", monospace';
    g.fillText('ELEVATION', padX, beamY - 10);
    g.fillText('PHASE RECORD · LAST 8 s', padX, traceBase - 8);

    // pendulums
    const bobR = Math.max(3.2, Math.min(7.5, w / 170));
    for (let i = 0; i < n; i += 1) {
      const x = padX + i * stepX;
      const th = theta(i, state.t);
      const bobY = bobTop + (i / Math.max(1, n - 1)) * bobSpan - Math.sin(th) * (h * 0.13);
      const bobX = x;
      g.strokeStyle = 'rgba(233,228,215,0.38)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, beamY + 2);
      g.lineTo(bobX, bobY);
      g.stroke();
      g.fillStyle = i % 4 === 0 ? '#c8442f' : '#e9e4d7';
      g.beginPath();
      g.arc(bobX, bobY, i % 4 === 0 ? bobR * 1.15 : bobR, 0, Math.PI * 2);
      g.fill();
      // faint guide through the phase record
      g.strokeStyle = 'rgba(233,228,215,0.05)';
      g.beginPath();
      g.moveTo(x, traceBase);
      g.lineTo(x, traceBase + traceH);
      g.stroke();
    }

    // phase record: stacked spatial samples, oldest at the top
    const samples = 26;
    const dt = 8 / samples;
    for (let s = samples; s >= 0; s -= 1) {
      const tSample = state.t - s * dt;
      if (tSample < 0) continue;
      const age = s / samples;
      g.beginPath();
      for (let i = 0; i < n; i += 1) {
        const th = theta(i, tSample);
        const x = padX + i * stepX;
        const y = traceBase + traceH * age * 0.95 - Math.sin(th) * (traceH * 0.22);
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokeStyle = s === 0
        ? 'rgba(200,68,47,0.9)'
        : `rgba(233,228,215,${(0.5 * (1 - age) + 0.04).toFixed(3)})`;
      g.lineWidth = s === 0 ? 1.8 : 1;
      g.stroke();
    }

    if (stageTag) {
      stageTag.textContent = state.paused
        ? `HELD — t ${state.t.toFixed(1)} s`
        : `RELEASED — t ${state.t.toFixed(1)} s`;
    }
  }

  let raf = 0;
  function loop(now) {
    if (!state.last) state.last = now;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    if (!state.paused) state.t += dt;
    state.kicked.forEach((v, i) => { if (v !== 0) state.kicked[i] = v * Math.exp(-dt * 1.6); });
    draw();
    paintReadouts();
    raf = requestAnimationFrame(loop);
  }

  function release() {
    state.t = 0;
    state.paused = false;
    state.kicked.forEach((_, i) => { state.kicked[i] = 0; });
    const pauseBtn = document.getElementById('pause');
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', 'false');
      pauseBtn.textContent = 'Hold';
    }
    state.last = 0;
    paintReadouts();
    draw();
  }

  if (canvas) {
    paintReadouts();
    if (reduceMotion.matches) {
      state.t = 6.4;
      draw();
      paintReadouts();
      if (stageTag) stageTag.textContent = 'STATIC — reduced motion';
    } else {
      state.t = 8.4;
      draw();
      paintReadouts();
      raf = requestAnimationFrame(loop);
    }

    if ('ResizeObserver' in window) new ResizeObserver(() => draw()).observe(canvas);

    countIn.addEventListener('input', () => {
      state.count = Number(countIn.value);
      paintReadouts();
      draw();
    });
    stepIn.addEventListener('input', () => {
      state.step = Number(stepIn.value);
      paintReadouts();
      draw();
    });
    dampIn.addEventListener('input', () => {
      state.damp = Number(dampIn.value);
      paintReadouts();
      draw();
    });

    document.getElementById('release').addEventListener('click', () => {
      release();
      if (reduceMotion.matches) {
        state.t = 6.4;
        draw();
        if (stageTag) stageTag.textContent = 'STATIC — reduced motion';
      }
    });

    const pauseBtn = document.getElementById('pause');
    pauseBtn.addEventListener('click', () => {
      state.paused = !state.paused;
      pauseBtn.setAttribute('aria-pressed', String(state.paused));
      pauseBtn.textContent = state.paused ? 'Continue' : 'Hold';
      state.last = 0;
      draw();
    });

    // disturb the field with a pointer
    const disturb = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const padX = Math.max(24, rect.width * 0.045);
      const span = rect.width - padX * 2;
      const i = Math.round(((x - padX) / span) * (state.count - 1));
      if (i >= 0 && i < state.count) state.kicked[i] = -1;
    };
    let dragging = false;
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      disturb(e.clientX);
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => { if (dragging) disturb(e.clientX); });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
  }

  /* ---------- works filter ---------- */
  const filters = [...document.querySelectorAll('.filter')];
  const sheets = [...document.querySelectorAll('.sheet')];
  const workCount = document.getElementById('workCount');
  if (filters.length && sheets.length) {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.filter;
        filters.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        let shown = 0;
        sheets.forEach((s) => {
          const match = kind === 'all' || s.dataset.kind === kind;
          s.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (workCount) {
          workCount.textContent = kind === 'all' ? 'Six sheets shown' : `${shown} of 6 sheets shown`;
        }
      });
    });
  }

  /* ---------- pre-feasibility load check ---------- */
  const spanIn = document.getElementById('span');
  if (spanIn) {
    const heightIn = document.getElementById('height');
    const solIn = document.getElementById('solidity');
    const spanOut = document.getElementById('spanOut');
    const heightOut = document.getElementById('heightOut');
    const solOut = document.getElementById('solidityOut');
    const cArea = document.getElementById('cArea');
    const cForce = document.getElementById('cForce');
    const cDesign = document.getElementById('cDesign');
    const cMoment = document.getElementById('cMoment');
    const cVerdict = document.getElementById('cVerdict');

    const calc = () => {
      const span = Number(spanIn.value);
      const height = Number(heightIn.value);
      const sol = Number(solIn.value);
      const area = span * height * (sol / 100);
      const force = 0.85 * area * 1.2;
      const design = force * 1.4;
      const moment = design * (height / 2);
      spanOut.textContent = `${span.toFixed(1)} m`;
      heightOut.textContent = `${height.toFixed(1)} m`;
      solOut.textContent = `${sol} %`;
      cArea.textContent = `${area.toFixed(1)} m²`;
      cForce.textContent = `${force.toFixed(1)} kN`;
      cDesign.textContent = `${design.toFixed(1)} kN`;
      cMoment.textContent = `${Math.round(moment)} kNm`;
      let verdict;
      if (moment < 60) {
        verdict = 'Standard anchor schedule likely: eight M20 chemical anchors into a reinforced slab, checked by the engineer of record.';
      } else if (moment < 160) {
        verdict = 'Engineer review required. Expect a steel sub-frame or a cast-in plate, plus a signed calculation pack before tender.';
      } else {
        verdict = 'Bespoke foundation and anchor design required. Expect a steel sub-frame cast into the slab and a signed calculation pack.';
      }
      cVerdict.textContent = verdict;
      return { area, force, design, moment };
    };
    [spanIn, heightIn, solIn].forEach((el) => el.addEventListener('input', calc));
    calc();
    window.__pwCalc = calc;
  }

  /* ---------- site brief form ---------- */
  const form = document.getElementById('siteForm');
  if (form) {
    const result = document.getElementById('siteResult');
    const preview = document.getElementById('sitePreview');
    const send = document.getElementById('siteSend');
    const edit = document.getElementById('siteEdit');
    const fields = {
      institution: document.getElementById('institution'),
      contactName: document.getElementById('contactName'),
      email: document.getElementById('email'),
      city: document.getElementById('city'),
      message: document.getElementById('message'),
      consent: document.getElementById('consent')
    };
    const rules = {
      institution: (v) => v.trim().length > 1,
      contactName: (v) => v.trim().length > 1,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      city: (v) => v.trim().length > 1,
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
      const load = window.__pwCalc ? window.__pwCalc() : null;
      const brief = [
        'Site brief — Pendulum Wave',
        '',
        `Institution: ${fields.institution.value.trim()}`,
        `Contact: ${fields.contactName.value.trim()}`,
        `Email: ${fields.email.value.trim()}`,
        `City: ${fields.city.value.trim()}`,
        `Setting: ${document.getElementById('setting').value}`,
        `Approximate size: ${document.getElementById('dims').value.trim() || 'not fixed'}`,
        `Budget band: ${document.getElementById('budget').value}`,
        `Opening / deadline: ${document.getElementById('timeline').value.trim() || 'not fixed'}`,
        load ? `Pre-feasibility check: ${load.area.toFixed(1)} m2 projected, ${load.design.toFixed(1)} kN design force, ${Math.round(load.moment)} kNm overturning.` : '',
        '',
        fields.message.value.trim(),
        '',
        'Indicative load check understood: yes'
      ].filter(Boolean).join('\n');
      preview.textContent = brief;
      send.href = `mailto:studio@pendulumwave.ch?subject=${encodeURIComponent('Site brief — ' + fields.institution.value.trim())}&body=${encodeURIComponent(brief)}`;
      result.hidden = false;
      result.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
    edit.addEventListener('click', () => {
      result.hidden = true;
      fields.institution.focus();
    });
  }

  window.__pw = {
    count: () => state.count,
    step: () => state.step,
    damp: () => state.damp,
    time: () => state.t,
    paused: () => state.paused,
    release,
    setCount: (n) => { countIn.value = String(n); countIn.dispatchEvent(new Event('input')); },
    setStep: (n) => { stepIn.value = String(n); stepIn.dispatchEvent(new Event('input')); },
    setDamp: (n) => { dampIn.value = String(n); dampIn.dispatchEvent(new Event('input')); },
    kick: (i) => { state.kicked[i] = -1; },
    painted: () => {
      if (!canvas) return false;
      const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return true;
      return false;
    }
  };
})();
