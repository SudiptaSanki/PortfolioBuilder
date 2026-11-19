/**
 * aeroAudio.js
 * ---------------------------------------------------------------------------
 * Aero Pilot — procedural aviation soundscape.
 *
 * 100% Web Audio API, no samples:
 *   • twin high-bypass turbofans  (turbine rumble + fan whine + blade pass)
 *   • slipstream / cockpit wind   (filtered pink noise, scaled by airspeed)
 *   • airframe + cabin hum
 *   • cabin chime (`playChime`) and switch click (`playClick`)
 *
 * The graph is created lazily in `init()` (call it from a user gesture) and
 * is driven every frame by `update(progress, altitudeFt, airspeedKts)`.
 *
 * Usage:
 *   const audio = createAeroAudio();
 *   button.onclick = () => { audio.init(); audio.resume(); };
 *   // every frame:
 *   audio.update(scrollProgress, pose.altitudeFt, pose.airspeedKts);
 * ---------------------------------------------------------------------------
 */

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Generate a seamless noise buffer (white / pink / brown). */
function createNoiseBuffer(ctx, seconds, kind) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (kind === 'pink') {
    // Paul Kellet's refined pink noise filter
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11;
    }
  } else if (kind === 'brown') {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
  } else {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  // fade the loop seams
  const fade = Math.floor(ctx.sampleRate * 0.02);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    data[i] *= k;
    data[length - 1 - i] *= k;
  }

  return buffer;
}

function createSoftClipCurve(amount = 1.6) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return curve;
}

/**
 * @param {Object} [options]
 * @param {number} [options.masterVolume=0.8]
 * @param {boolean} [options.muted=false]
 * @param {number} [options.cabin=0.55]      cabin hum amount 0..1
 * @param {number} [options.smoothing=2.6]   parameter smoothing rate
 */
export function createAeroAudio(options = {}) {
  const settings = Object.assign(
    {
      masterVolume: 0.8,
      muted: false,
      cabin: 0.55,
      smoothing: 2.6
    },
    options
  );

  let ctx = null;
  let nodes = null;
  let initialized = false;
  let muted = !!settings.muted;
  let volume = clamp(finite(settings.masterVolume, 0.8), 0, 1);
  let disposed = false;

  const state = {
    progress: 0,
    altitudeFt: 0,
    airspeedKts: 0,
    throttle: 0.2,
    wind: 0,
    phase: 'ground'
  };

  /* ------------------------------------------------------------------ graph */

  function buildGraph() {
    const AudioCtx =
      typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
    if (!AudioCtx) return false;

    try {
      ctx = new AudioCtx({ latencyHint: 'interactive' });
    } catch (err) {
      try {
        ctx = new AudioCtx();
      } catch (err2) {
        return false;
      }
    }

    const now = ctx.currentTime;

    /* ---------------------------------------------------------- master bus */
    const master = ctx.createGain();
    master.gain.setValueAtTime(muted ? 0.0001 : Math.max(0.0001, volume), now);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 12;
    compressor.ratio.value = 4.5;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.3;

    const softClip = ctx.createWaveShaper();
    softClip.curve = createSoftClipCurve(1.4);
    softClip.oversample = '2x';

    master.connect(compressor);
    compressor.connect(softClip);
    softClip.connect(ctx.destination);

    /* ------------------------------------------------------- shared noise */
    const pinkBuffer = createNoiseBuffer(ctx, 5, 'pink');
    const brownBuffer = createNoiseBuffer(ctx, 6, 'brown');
    const whiteBuffer = createNoiseBuffer(ctx, 2, 'white');

    function loopNoise(buffer, rate = 1) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.playbackRate.value = rate;
      source.start(now);
      return source;
    }

    /* ------------------------------------------------------------- engines */
    // Each engine is a small graph: turbine core, low rumble, fan whine,
    // blade-pass tone. Slight detune between left and right gives width.
    const engines = [];

    function buildEngine(panValue) {
      const bus = ctx.createGain();
      bus.gain.value = 0.0001;

      const panner =
        typeof ctx.createStereoPanner === 'function'
          ? ctx.createStereoPanner()
          : (() => {
              const g = ctx.createGain();
              g.pan = { value: 0 };
              return g;
            })();
      if (panner.pan) panner.pan.value = panValue;
      bus.connect(panner);
      panner.connect(master);

      // turbine core — two detuned saws through a low-pass
      const coreFilter = ctx.createBiquadFilter();
      coreFilter.type = 'lowpass';
      coreFilter.frequency.value = 420;
      coreFilter.Q.value = 1.1;

      const coreGain = ctx.createGain();
      coreGain.gain.value = 0.5;

      const core1 = ctx.createOscillator();
      core1.type = 'sawtooth';
      core1.frequency.value = 52;
      const core2 = ctx.createOscillator();
      core2.type = 'sawtooth';
      core2.frequency.value = 78.5;
      core2.detune.value = panValue * 14;

      core1.connect(coreFilter);
      core2.connect(coreFilter);
      coreFilter.connect(coreGain);
      coreGain.connect(bus);
      core1.start(now);
      core2.start(now);

      // low-frequency rumble — brown noise through a tight low-pass
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 150;
      rumbleFilter.Q.value = 0.8;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.55;
      const rumble = loopNoise(brownBuffer, 0.85 + (panValue + 1) * 0.03);
      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(bus);

      // fan whine — high bypass buzz, gets brighter with throttle
      const fanFilter = ctx.createBiquadFilter();
      fanFilter.type = 'bandpass';
      fanFilter.frequency.value = 1250;
      fanFilter.Q.value = 3.2;
      const fanGain = ctx.createGain();
      fanGain.gain.value = 0.22;

      const fan = ctx.createOscillator();
      fan.type = 'triangle';
      fan.frequency.value = 980;

      // slow doppler-ish wobble
      const wow = ctx.createOscillator();
      wow.type = 'sine';
      wow.frequency.value = 0.23 + Math.abs(panValue) * 0.05;
      const wowGain = ctx.createGain();
      wowGain.gain.value = 12;
      wow.connect(wowGain);
      wowGain.connect(fan.frequency);
      wow.start(now);

      fan.connect(fanFilter);
      fanFilter.connect(fanGain);
      fanGain.connect(bus);
      fan.start(now);

      // blade-pass rasp
      const bladeGain = ctx.createGain();
      bladeGain.gain.value = 0.0;
      const blade = ctx.createOscillator();
      blade.type = 'square';
      blade.frequency.value = 240;
      const bladeFilter = ctx.createBiquadFilter();
      bladeFilter.type = 'bandpass';
      bladeFilter.frequency.value = 480;
      bladeFilter.Q.value = 6;
      blade.connect(bladeFilter);
      bladeFilter.connect(bladeGain);
      bladeGain.connect(bus);
      blade.start(now);

      // exhaust air — white noise through a band-pass
      const exhaustFilter = ctx.createBiquadFilter();
      exhaustFilter.type = 'bandpass';
      exhaustFilter.frequency.value = 700;
      exhaustFilter.Q.value = 0.7;
      const exhaustGain = ctx.createGain();
      exhaustGain.gain.value = 0.12;
      const exhaust = loopNoise(whiteBuffer, 0.7 + (panValue + 1) * 0.02);
      exhaust.connect(exhaustFilter);
      exhaustFilter.connect(exhaustGain);
      exhaustGain.connect(bus);

      engines.push({
        bus,
        core1,
        core2,
        coreFilter,
        coreGain,
        fan,
        fanFilter,
        fanGain,
        blade,
        bladeGain,
        rumble,
        rumbleGain,
        exhaust,
        exhaustFilter,
        exhaustGain,
        pan: panValue
      });
    }

    buildEngine(-0.55);
    buildEngine(0.55);

    /* ------------------------------------------------------------- wind */
    const windBus = ctx.createGain();
    windBus.gain.value = 0.0001;

    const windHighpass = ctx.createBiquadFilter();
    windHighpass.type = 'highpass';
    windHighpass.frequency.value = 260;
    windHighpass.Q.value = 0.5;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 900;
    windFilter.Q.value = 0.55;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.5;

    const windSource = loopNoise(pinkBuffer, 1);
    windSource.connect(windHighpass);
    windHighpass.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(windBus);
    windBus.connect(master);

    // a second, thinner slipstream layer for the "hiss" past the canopy
    const slipFilter = ctx.createBiquadFilter();
    slipFilter.type = 'highpass';
    slipFilter.frequency.value = 2800;
    const slipGain = ctx.createGain();
    slipGain.gain.value = 0.0;
    const slipSource = loopNoise(whiteBuffer, 1.2);
    slipSource.connect(slipFilter);
    slipFilter.connect(slipGain);
    slipGain.connect(windBus);

    /* ------------------------------------------------------- cabin / airframe */
    const cabinBus = ctx.createGain();
    cabinBus.gain.value = 0.0001;
    cabinBus.connect(master);

    const cabinFilter = ctx.createBiquadFilter();
    cabinFilter.type = 'lowpass';
    cabinFilter.frequency.value = 220;
    const cabinGain = ctx.createGain();
    cabinGain.gain.value = settings.cabin;
    cabinFilter.connect(cabinGain);
    cabinGain.connect(cabinBus);

    const cabin1 = ctx.createOscillator();
    cabin1.type = 'sine';
    cabin1.frequency.value = 58;
    const cabin2 = ctx.createOscillator();
    cabin2.type = 'sine';
    cabin2.frequency.value = 116;
    cabin2.detune.value = 7;
    const cabin1Gain = ctx.createGain();
    cabin1Gain.gain.value = 0.32;
    const cabin2Gain = ctx.createGain();
    cabin2Gain.gain.value = 0.12;
    cabin1.connect(cabin1Gain);
    cabin2.connect(cabin2Gain);
    cabin1Gain.connect(cabinFilter);
    cabin2Gain.connect(cabinFilter);
    cabin1.start(now);
    cabin2.start(now);

    // airframe creak — very quiet filtered noise
    const airframeFilter = ctx.createBiquadFilter();
    airframeFilter.type = 'bandpass';
    airframeFilter.frequency.value = 330;
    airframeFilter.Q.value = 8;
    const airframeGain = ctx.createGain();
    airframeGain.gain.value = 0.05;
    const airframe = loopNoise(brownBuffer, 1.1);
    airframe.connect(airframeFilter);
    airframeFilter.connect(airframeGain);
    airframeGain.connect(cabinBus);

    /* ---------------------------------------------------------- reverb send */
    const reverb = ctx.createConvolver();
    const impulseLength = Math.floor(ctx.sampleRate * 1.6);
    const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < impulseLength; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2.6);
      }
    }
    reverb.buffer = impulse;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.16;
    reverb.connect(reverbGain);
    reverbGain.connect(master);

    // cockpit "space" send for the chimes and clicks
    const cockpitSend = ctx.createGain();
    cockpitSend.gain.value = 0.55;
    cockpitSend.connect(reverb);

    nodes = {
      master,
      compressor,
      engines,
      windBus,
      windFilter,
      windGain,
      slipGain,
      cabinBus,
      cabinFilter,
      reverb,
      cockpitSend,
      pinkBuffer,
      brownBuffer
    };

    initialized = true;
    applyMix(now);
    return true;
  }

  /* ------------------------------------------------------------------ mix */

  function targetMix(progress, altitudeFt, airspeedKts) {
    const p = clamp(finite(progress, 0), 0, 1);
    const alt = clamp(finite(altitudeFt, 0), 0, 45000);
    const kts = clamp(finite(airspeedKts, 0), 0, 600);

    // throttles: take-off spool, cruise pull-back, approach thrust, reverse
    let throttle;
    if (p < 0.15) {
      throttle = smoothstep(0.02, 0.14, p) * 0.92 + 0.08;
    } else if (p < 0.24) {
      throttle = 1.0;
    } else if (p < 0.4) {
      throttle = 1.0 - smoothstep(0.24, 0.4, p) * 0.62;
    } else if (p < 0.62) {
      throttle = 0.38 - smoothstep(0.45, 0.62, p) * 0.1;
    } else if (p < 0.86) {
      throttle = 0.28 + smoothstep(0.62, 0.7, p) * 0.02;
    } else if (p < 0.97) {
      throttle = 0.3 + smoothstep(0.86, 0.93, p) * 0.32;
    } else {
      throttle = 0.62 - smoothstep(0.97, 1.0, p) * 0.3;
    }

    const altitudeFactor = 1 - smoothstep(0, 40000, alt) * 0.45;
    const speedFactor = clamp(kts / 260, 0, 1.7);

    const wind = clamp(
      (0.06 + speedFactor * 0.5) * altitudeFactor * (1 + smoothstep(0.8, 0.95, p) * 0.35),
      0.03,
      1
    );

    const phase =
      p < 0.15
        ? 'ground'
        : p < 0.38
          ? 'climb'
          : p < 0.65
            ? 'cruise'
            : p < 0.85
              ? 'descent'
              : 'approach';

    return { p, alt, kts, throttle, wind, phase, altitudeFactor };
  }

  function applyMix(atTime) {
    if (!ctx || !nodes) return;
    const t = atTime === undefined ? ctx.currentTime : atTime;
    const mix = targetMix(state.progress, state.altitudeFt, state.airspeedKts);

    state.throttle = mix.throttle;
    state.wind = mix.wind;
    state.phase = mix.phase;

    const smooth = clamp(finite(settings.smoothing, 2.6), 0.2, 20);
    const ramp = (param, value) => {
      const v = Math.max(0.0001, value);
      if (typeof param.setTargetAtTime === 'function') {
        param.setTargetAtTime(v, t, 1 / smooth);
      } else {
        param.value = v;
      }
    };

    const whine = 620 + mix.throttle * 980 + mix.altitudeFactor * 90;
    const coreHz = 38 + mix.throttle * 30;
    const bladeHz = 150 + mix.throttle * 190;

    for (let i = 0; i < nodes.engines.length; i++) {
      const e = nodes.engines[i];
      const jitter = i === 0 ? 0.985 : 1.015;
      ramp(e.core1.frequency, coreHz * jitter);
      ramp(e.core2.frequency, coreHz * 1.52 * jitter);
      ramp(e.fan.frequency, whine * jitter);
      ramp(e.blade.frequency, bladeHz * jitter);

      const engineLevel = (0.16 + mix.throttle * 0.85) * (0.55 + 0.45 * mix.altitudeFactor);
      ramp(e.bus.gain, engineLevel * 0.32);

      ramp(e.coreFilter.frequency, 260 + mix.throttle * 620);
      ramp(e.fanGain.gain, 0.1 + mix.throttle * 0.34);
      ramp(e.fanFilter.frequency, 900 + mix.throttle * 1200);
      ramp(e.bladeGain.gain, mix.throttle * 0.05);
      ramp(e.rumbleGain.gain, 0.35 + mix.throttle * 0.45);
      ramp(e.exhaustGain.gain, 0.08 + mix.throttle * 0.16);
      ramp(e.exhaustFilter.frequency, 500 + mix.throttle * 900);
    }

    // wind and slipstream
    ramp(nodes.windBus.gain, 0.04 + mix.wind * 0.42);
    ramp(nodes.windGain.gain, 0.35 + mix.wind * 0.5);
    ramp(nodes.windFilter.frequency, 700 + mix.wind * 1300 + mix.throttle * 180);
    ramp(nodes.slipGain.gain, Math.max(0, mix.wind - 0.35) * 0.09);

    // cabin hum: strong on the ground, quieter at altitude
    const cabinLevel = (0.22 + mix.throttle * 0.5) * (0.6 + 0.4 * mix.altitudeFactor);
    ramp(nodes.cabinBus.gain, cabinLevel * 0.22);
    ramp(nodes.cabinFilter.frequency, 180 + mix.throttle * 260);
  }

  /* ---------------------------------------------------------------- public */

  function init() {
    if (disposed) return false;
    if (initialized) {
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      return true;
    }
    return buildGraph();
  }

  function resume() {
    if (disposed) return Promise.resolve(false);
    if (!initialized && !init()) return Promise.resolve(false);
    if (!ctx) return Promise.resolve(false);
    if (ctx.state === 'suspended') {
      return ctx.resume().then(() => true).catch(() => false);
    }
    return Promise.resolve(true);
  }

  function setMuted(next) {
    muted = !!next;
    if (ctx && nodes) {
      const now = ctx.currentTime;
      const target = muted ? 0.0001 : Math.max(0.0001, volume);
      nodes.master.gain.setTargetAtTime(target, now, 0.08);
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function setVolume(next) {
    volume = clamp(finite(next, volume), 0, 1);
    if (ctx && nodes) {
      nodes.master.gain.setTargetAtTime(
        muted ? 0.0001 : Math.max(0.0001, volume),
        ctx.currentTime,
        0.1
      );
    }
    return volume;
  }

  function update(progress = 0, altitudeFt = 0, airspeedKts = 0) {
    state.progress = clamp(finite(progress, 0), 0, 1);
    state.altitudeFt = clamp(finite(altitudeFt, 0), 0, 60000);
    state.airspeedKts = clamp(finite(airspeedKts, 0), 0, 700);
    if (initialized) applyMix();
    return { ...state };
  }

  function playChime() {
    if (!initialized && !init()) return false;
    if (!ctx || !nodes) return false;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const tones = [
      { freq: 784.0, delay: 0.0, length: 1.1 },
      { freq: 622.25, delay: 0.34, length: 1.5 }
    ];

    for (const tone of tones) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = tone.freq;

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = tone.freq * 2.005;
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.18;
      osc2.connect(osc2Gain);

      const gain = ctx.createGain();
      const start = now + tone.delay;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.24, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.length);

      osc.connect(gain);
      osc2Gain.connect(gain);
      gain.connect(nodes.master);
      gain.connect(nodes.cockpitSend);

      osc.start(start);
      osc2.start(start);
      osc.stop(start + tone.length + 0.05);
      osc2.stop(start + tone.length + 0.05);
    }
    return true;
  }

  function playClick() {
    if (!initialized && !init()) return false;
    if (!ctx || !nodes) return false;

    const now = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 2.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(nodes.master);
    source.start(now);
    return true;
  }

  function getState() {
    return {
      initialized,
      contextState: ctx ? ctx.state : 'closed',
      sampleRate: ctx ? ctx.sampleRate : 0,
      muted,
      volume,
      progress: state.progress,
      altitudeFt: state.altitudeFt,
      airspeedKts: state.airspeedKts,
      throttle: state.throttle,
      wind: state.wind,
      phase: state.phase
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (nodes) {
      try {
        for (const engine of nodes.engines) {
          engine.core1.stop();
          engine.core2.stop();
          engine.fan.stop();
          engine.blade.stop();
        }
      } catch (err) {
        /* already stopped */
      }
    }
    if (ctx && typeof ctx.close === 'function') {
      try {
        ctx.close();
      } catch (err) {
        /* ignore */
      }
    }
    ctx = null;
    nodes = null;
    initialized = false;
  }

  return {
    init,
    resume,
    setMuted,
    isMuted,
    setVolume,
    update,
    playChime,
    playClick,
    getState,
    dispose
  };
}

export default createAeroAudio;
