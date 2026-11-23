/* Whisper Reel — the cue deck.
   No AudioContext exists until the listener presses Arm audio.
   Nothing is fetched: every sound is synthesised in the page. */
(() => {
  'use strict';

  /* ── chrome ─────────────────────────────────────────────── */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── tape strip (static, no audio) ──────────────────────── */
  const tape = document.getElementById('tape-canvas');
  if (tape) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const drawTape = () => {
      const w = tape.clientWidth;
      const h = 110;
      tape.width = Math.round(w * dpr);
      tape.height = Math.round(h * dpr);
      const c = tape.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      c.strokeStyle = 'rgba(231,224,210,.08)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
      // deterministic pseudo-waveform
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      c.beginPath();
      for (let x = 0; x < w; x += 2) {
        const env = 0.25 + 0.75 * Math.abs(Math.sin(x / 90) * Math.cos(x / 240));
        const y = h / 2 + (rnd() - 0.5) * 34 * env;
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.strokeStyle = 'rgba(208,138,60,.5)';
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = 'rgba(231,224,210,.18)';
      for (let x = 12; x < w; x += 28) c.fillRect(x, h / 2 - 1, 1, 2);
    };
    drawTape();
    window.addEventListener('resize', () => { if (!audio) drawTape(); });
  }

  /* ── deck ───────────────────────────────────────────────── */
  const armBtn = document.getElementById('arm');
  if (!armBtn) { bindContact(); return; }
  const status = document.getElementById('console-status');
  const pads = [...document.querySelectorAll('.pad')];
  const sceneBtn = document.getElementById('play-scene');
  const prog = document.getElementById('scene-progress');
  const sceneTime = document.getElementById('scene-time');
  const meter = document.getElementById('meter-canvas');
  const mctx = meter.getContext('2d');

  const sliders = {
    room: document.getElementById('g-room'),
    rain: document.getElementById('g-rain'),
    whisper: document.getElementById('g-whisper'),
    sub: document.getElementById('g-sub'),
    creak: document.getElementById('g-creak'),
    master: document.getElementById('g-master'),
  };
  const outs = {
    room: document.getElementById('o-room'),
    rain: document.getElementById('o-rain'),
    whisper: document.getElementById('o-whisper'),
    sub: document.getElementById('o-sub'),
    creak: document.getElementById('o-creak'),
    master: document.getElementById('o-master'),
  };
  const panSlider = document.getElementById('pan');

  let audio = null;               // built only on the arm gesture
  let sceneTimers = [];
  let raf = 0;
  let sceneStart = 0;

  const curve = (v) => Math.pow(v / 100, 2) * 0.85;
  const db = (v) => (v <= 0 ? '-∞' : (20 * Math.log10(curve(v))).toFixed(1) + ' dB');

  Object.keys(sliders).forEach((k) => {
    const s = sliders[k];
    const paint = () => {
      const pct = s.value + '%';
      s.style.setProperty('--pct', pct);
      if (outs[k]) outs[k].textContent = db(parseInt(s.value, 10));
      if (audio) {
        const node = audio.gains[k];
        if (node) {
          const on = k !== 'master' ? audio.pads[k] !== false : true;
          node.gain.setTargetAtTime(on && audio.pads[k] !== false ? curve(parseInt(s.value, 10)) : 0, audio.ctx.currentTime, 0.05);
        }
      }
    };
    s.addEventListener('input', paint);
    paint();
  });

  /* paint the slider fill with a gradient via CSS variable fallback */
  const paintRanges = () => {
    document.querySelectorAll('.ch input[type=range]').forEach((s) => {
      const pct = ((s.value - s.min) / (s.max - s.min)) * 100;
      s.style.background = `linear-gradient(90deg, #8a5a24 0%, #d08a3c ${pct}%, #2a2620 ${pct}%, #2a2620 100%)`;
      s.style.borderRadius = '1px';
    });
  };
  document.querySelectorAll('.ch input[type=range]').forEach((s) => {
    s.addEventListener('input', paintRanges);
  });
  paintRanges();

  function noiseBuffer(ctx, seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  function buildAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    window.__audioCreated = true;
    const master = ctx.createGain();
    master.gain.value = curve(parseInt(sliders.master.value, 10));
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    master.connect(analyser);
    analyser.connect(ctx.destination);

    const gains = { room: ctx.createGain(), rain: ctx.createGain(), whisper: ctx.createGain(), sub: ctx.createGain(), creak: ctx.createGain() };
    Object.values(gains).forEach((g) => { g.gain.value = 0; g.connect(master); });
    gains.creak.connect(master);

    const buf = noiseBuffer(ctx, 4);

    const loop = () => {
      const s = ctx.createBufferSource();
      s.buffer = buf; s.loop = true;
      s.start();
      return s;
    };

    // room tone
    const roomSrc = loop();
    const roomLp = ctx.createBiquadFilter();
    roomLp.type = 'lowpass'; roomLp.frequency.value = 320; roomLp.Q.value = 0.7;
    roomSrc.connect(roomLp).connect(gains.room);

    // rain on tin
    const rainSrc = loop();
    const rainHp = ctx.createBiquadFilter();
    rainHp.type = 'highpass'; rainHp.frequency.value = 900;
    const rainBp = ctx.createBiquadFilter();
    rainBp.type = 'peaking'; rainBp.frequency.value = 3200; rainBp.gain.value = 8; rainBp.Q.value = 0.9;
    rainSrc.connect(rainHp).connect(rainBp).connect(gains.rain);

    // whisper, panned
    const whisperSrc = loop();
    const wbp = ctx.createBiquadFilter();
    wbp.type = 'bandpass'; wbp.frequency.value = 1550; wbp.Q.value = 6;
    const wbp2 = ctx.createBiquadFilter();
    wbp2.type = 'bandpass'; wbp2.frequency.value = 2400; wbp2.Q.value = 9;
    const panner = ctx.createStereoPanner();
    panner.pan.value = parseInt(panSlider.value, 10) / 100;
    const trem = ctx.createGain();
    trem.gain.value = 0.6;
    const tremLfo = ctx.createOscillator();
    tremLfo.frequency.value = 3.1;
    const tremAmt = ctx.createGain();
    tremAmt.gain.value = 0.4;
    tremLfo.connect(tremAmt).connect(trem.gain);
    tremLfo.start();
    whisperSrc.connect(wbp).connect(wbp2).connect(trem).connect(gains.whisper);
    gains.whisper.connect(panner).connect(master);

    // slow auto-pan, so the whisper crosses the head
    const panLfo = ctx.createOscillator();
    panLfo.frequency.value = 0.07;
    const panAmt = ctx.createGain();
    panAmt.gain.value = 0.35;
    panLfo.connect(panAmt).connect(panner.pan);
    panLfo.start();

    // heartbeat
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine'; subOsc.frequency.value = 44;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.55;
    const beatLfo = ctx.createOscillator();
    beatLfo.type = 'sine'; beatLfo.frequency.value = 1.05;
    const beatAmt = ctx.createGain();
    beatAmt.gain.value = 0.45;
    beatLfo.connect(beatAmt).connect(subGain.gain);
    beatLfo.start();
    subOsc.connect(subGain).connect(gains.sub);
    subOsc.start();

    panSlider.addEventListener('input', () => {
      panner.pan.setTargetAtTime(parseInt(panSlider.value, 10) / 100, ctx.currentTime, 0.08);
    });

    return {
      ctx, master, analyser, gains, buf,
      pads: { room: true, rain: false, whisper: false, sub: false, creak: true },
      nodes: { panner },
      oneShots: { creak: () => creak(), scream: () => scream() },
    };

    function creak() {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 12;
      bp.frequency.setValueAtTime(420, t);
      bp.frequency.exponentialRampToValueAtTime(150, t + 1.1);
      const g = ctx.createGain();
      const level = curve(parseInt(sliders.creak.value, 10)) * 1.4;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
      src.connect(bp).connect(g).connect(master);
      src.start(t); src.stop(t + 1.5);
    }

    function scream() {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 1;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 4;
      bp.frequency.setValueAtTime(1600, t);
      bp.frequency.exponentialRampToValueAtTime(500, t + 0.55);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      src.connect(bp).connect(g).connect(master);
      src.start(t); src.stop(t + 0.7);
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.5);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.05, t + 0.03);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(og).connect(master);
      osc.start(t); osc.stop(t + 0.6);
    }
  }

  pads.forEach((p) => { p.disabled = true; p.setAttribute('aria-pressed', 'false'); });
  sceneBtn.disabled = true;

  function setPad(name, on) {
    const pad = pads.find((p) => p.dataset.cue === name);
    if (pad) {
      pad.classList.toggle('on', on);
      pad.setAttribute('aria-pressed', String(on));
    }
  }

  function applyPadLevels() {
    if (!audio) return;
    const { ctx, gains, pads: state } = audio;
    const map = { room: 'room', rain: 'rain', whisper: 'whisper', sub: 'sub' };
    Object.keys(map).forEach((k) => {
      const on = state[k];
      const v = curve(parseInt(sliders[k].value, 10));
      gains[k].gain.setTargetAtTime(on ? v : 0, ctx.currentTime, 0.12);
    });
  }

  armBtn.addEventListener('click', async () => {
    if (audio) {
      // second press: mute or unmute, keeping the context alive
      audio.muted = !audio.muted;
      audio.master.gain.setTargetAtTime(audio.muted ? 0 : curve(parseInt(sliders.master.value, 10)), audio.ctx.currentTime, 0.08);
      armBtn.setAttribute('aria-pressed', String(!audio.muted));
      armBtn.querySelector('.arm-txt').textContent = audio.muted ? 'Audio muted' : 'Armed · mute';
      status.textContent = audio.muted ? 'Desk muted. The room is still there; you just cannot hear it.' : 'Desk live again.';
      return;
    }
    try {
      audio = buildAudio();
      if (audio.ctx.state === 'suspended') await audio.ctx.resume();
      armBtn.setAttribute('aria-pressed', 'true');
      armBtn.querySelector('.arm-txt').textContent = 'Armed · mute';
      status.textContent = 'Desk armed. Room tone is live at ' + db(parseInt(sliders.room.value, 10)) + '. Headphones.';
      pads.forEach((p) => { p.disabled = false; });
      sceneBtn.disabled = false;
      audio.pads = { room: true, rain: false, whisper: false, sub: false, creak: true };
      setPad('room', true);
      audio.gains.room.gain.value = curve(parseInt(sliders.room.value, 10));
      startMeter();
    } catch (e) {
      status.textContent = 'The browser refused to start audio. Try again, or open the page in another browser.';
    }
  });

  pads.forEach((pad) => {
    pad.addEventListener('click', () => {
      if (!audio) return;
      const cue = pad.dataset.cue;
      if (cue === 'creak' || cue === 'scream') {
        audio.oneShots[cue]();
        pad.classList.add('flash');
        setTimeout(() => pad.classList.remove('flash'), 220);
        return;
      }
      const on = !audio.pads[cue];
      audio.pads[cue] = on;
      setPad(cue, on);
      if (on && sliders[cue] && parseInt(sliders[cue].value, 10) < 5) {
        sliders[cue].value = '30';
        sliders[cue].dispatchEvent(new Event('input', { bubbles: true }));
      }
      applyPadLevels();
      if (cue === 'whisper' && on) status.textContent = 'Whisper live, moving slowly across the stereo field.';
    });
  });

  /* ── 24-second scene ──────────────────────────────────── */
  function playScene() {
    if (!audio) return;
    clearScene();
    const ctx = audio.ctx;
    const t0 = ctx.currentTime;
    sceneStart = performance.now();
    const setG = (key, target, at, ramp = 0.8) => {
      audio.gains[key].gain.cancelScheduledValues(t0 + at);
      audio.gains[key].gain.setTargetAtTime(target, t0 + at, ramp / 3);
    };
    const roomV = curve(parseInt(sliders.room.value, 10));
    const whisperV = curve(parseInt(sliders.whisper.value, 10)) || 0.06;
    const subV = curve(parseInt(sliders.sub.value, 10)) || 0.07;
    const rainV = curve(parseInt(sliders.rain.value, 10)) || 0.05;

    setG('room', roomV, 0, 1.2);
    audio.pads.room = true; setPad('room', true);
    audio.pads.whisper = true; setPad('whisper', true);
    audio.pads.sub = true; setPad('sub', true);
    audio.pads.rain = true; setPad('rain', true);

    sceneTimers.push(setTimeout(() => audio.oneShots.creak(), 2000));
    setG('whisper', whisperV, 5.5, 2.0);
    sceneTimers.push(setTimeout(() => {
      const p = audio.nodes.panner.pan;
      p.cancelScheduledValues(ctx.currentTime);
      p.setValueAtTime(-0.85, ctx.currentTime);
      p.linearRampToValueAtTime(0.85, ctx.currentTime + 9);
    }, 5800));
    setG('sub', subV, 11.5, 1.6);
    setG('rain', rainV, 16.5, 1.4);
    sceneTimers.push(setTimeout(() => audio.oneShots.creak(), 18500));
    setG('whisper', 0, 21.5, 1.2);
    setG('rain', 0, 21.5, 1.2);
    setG('sub', 0, 22, 1.2);
    setG('room', 0, 22.5, 1.4);
    sceneTimers.push(setTimeout(() => {
      audio.pads = { room: true, rain: false, whisper: false, sub: false, creak: true };
      ['rain', 'whisper', 'sub'].forEach((k) => setPad(k, false));
      status.textContent = 'Scene over. The room is quiet again. You can build the next one yourself.';
      if (audio) {
        audio.gains.room.gain.setTargetAtTime(curve(parseInt(sliders.room.value, 10)), ctx.currentTime, 0.4);
      }
      sceneBtn.querySelector('.scene-txt').textContent = 'Play scene: the landing, 24 seconds';
    }, 24000));
    status.textContent = 'Playing: the landing. Room, a floorboard, a whisper crossing, a heartbeat, rain.';
    sceneBtn.querySelector('.scene-txt').textContent = 'Playing scene…';
  }

  function clearScene() {
    sceneTimers.forEach((t) => clearTimeout(t));
    sceneTimers = [];
  }

  sceneBtn.addEventListener('click', () => {
    playScene();
  });

  function startSceneUi() {
    const tick = () => {
      const elapsed = (performance.now() - sceneStart) / 1000;
      if (elapsed <= 24) {
        prog.style.width = Math.min(100, (elapsed / 24) * 100) + '%';
        sceneTime.textContent = `0:${String(Math.floor(elapsed)).padStart(2, '0')}`;
        requestAnimationFrame(tick);
      } else {
        prog.style.width = '0%';
        sceneTime.textContent = '0:00';
      }
    };
    requestAnimationFrame(tick);
  }
  sceneBtn.addEventListener('click', startSceneUi);

  /* ── meter ─────────────────────────────────────────────── */
  function startMeter() {
    cancelAnimationFrame(raf);
    const data = new Uint8Array(audio.analyser.fftSize);
    const draw = () => {
      const w = meter.clientWidth;
      const h = 72;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (meter.width !== Math.round(w * dpr)) {
        meter.width = Math.round(w * dpr);
        meter.height = Math.round(h * dpr);
      }
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.clearRect(0, 0, w, h);
      // grid
      mctx.strokeStyle = 'rgba(231,224,210,.07)';
      mctx.lineWidth = 1;
      for (let x = 0; x < w; x += 60) {
        mctx.beginPath(); mctx.moveTo(x, 0); mctx.lineTo(x, h); mctx.stroke();
      }
      audio.analyser.getByteTimeDomainData(data);
      mctx.beginPath();
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const x = (i / data.length) * w;
        const v = (data[i] - 128) / 128;
        peak = Math.max(peak, Math.abs(v));
        const y = h / 2 + v * (h / 2 - 8);
        if (i === 0) mctx.moveTo(x, y); else mctx.lineTo(x, y);
      }
      mctx.strokeStyle = peak > 0.02 ? 'rgba(208,138,60,.85)' : 'rgba(231,224,210,.25)';
      mctx.lineWidth = 1.2;
      mctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();
  }

  // static meter line before arming
  requestAnimationFrame(() => {
    const w = meter.clientWidth || 600;
    const h = 72;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    meter.width = Math.round(w * dpr); meter.height = Math.round(h * dpr);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.strokeStyle = 'rgba(231,224,210,.18)';
    mctx.lineWidth = 1;
    mctx.beginPath(); mctx.moveTo(0, h / 2); mctx.lineTo(w, h / 2); mctx.stroke();
  });

  bindContact();

  /* ── contact form ───────────────────────────────────────── */
  function bindContact() {
    const cform = document.getElementById('contact-form');
    if (!cform) return;
    const st = document.getElementById('form-status');
    const fields = [...cform.querySelectorAll('input, textarea, select')];
    const slotFor = (el) => (el.closest('.field') || el.parentElement).querySelector('.err');
    cform.addEventListener('submit', (e) => {
      e.preventDefault();
      let bad = null;
      fields.forEach((el) => {
        let msg = '';
        const v = (el.value || '').trim();
        if (el.required && !v) msg = 'This one is needed.';
        else if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'That email looks incomplete.';
        else if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 8) msg = 'Full number, with the country code.';
        const slot = slotFor(el);
        if (slot) slot.textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      st.hidden = false;
      st.textContent = 'Received. Ira reads every story herself, usually on Sunday nights, and replies only if she wants to record it — which may take a month.';
      cform.reset();
      st.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    fields.forEach((el) => el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') {
        const slot = slotFor(el);
        if (slot) slot.textContent = '';
        el.setAttribute('aria-invalid', 'false');
      }
    }));
  }
})();
