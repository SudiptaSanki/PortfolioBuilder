/**
 * hardwareAudio.js
 * ============================================================================
 * Procedural soundscape for the Computer Engineering portfolio hardware rig.
 *
 * Every sound is synthesised at runtime with the Web Audio API — there are no
 * audio files, no fetches and no DOM dependencies.  The mix follows the 3D
 * scene: fan and airflow noise rise with thermal load and with camera
 * proximity to the cooler / GPU, a liquid-cooling pump and fluid shimmer join
 * in as AI load climbs, and a very low clock / bus pad gives the workstation
 * its idle hum.
 *
 * Layers
 *   fan     pink-noise airflow through a velocity-tracked lowpass, plus a
 *           soft PWM motor harmonic with a slow commutation wobble
 *   liquid  pump hum + band-passed fluid shimmer + gentle pulse modulation
 *   clock   three detuned sine/triangle partials and sparse clock ticks
 *   ui      short tonal ticks for clicks and transitions
 *
 * Signal flow
 *   fan -----> fanBus -----\
 *   liquid --> liquidBus ---> master -> limiter -> destination
 *   clock ---> clockBus ----/
 *   ui ------> uiBus -------/
 *
 * Public API
 *   createHardwareAudio(options?) -> {
 *     init(), resume(), setMuted(bool), isMuted(), setVolume(0..1),
 *     setThermalLoad(0..1), setAiLoad(0..1),
 *     update(cameraPos, thermalLoad, zoneProgress, aiLoad?),
 *     playClick(), playTransition(), getState(), dispose()
 *   }
 *
 * `update()` accepts either positional arguments or a single object:
 *   update(cameraPos, thermal, zoneProgress, aiLoad)
 *   update({ cameraPos, thermalLoad, zoneProgress, aiLoad })
 *
 * `zoneProgress` may be a 0..1 proximity hint for the hardware zone currently
 * in view, or an object { cooler, gpu, overall } with values in 0..1.  The
 * higher the value, the closer the camera is to the cooler / GPU, and the more
 * the fan and coolant layers open up.
 *
 * The module is safe to construct before any user gesture: it stores the
 * desired state and only creates the AudioContext in `init()` (or on the first
 * `resume()`), which the app should call from a click / pointer handler.
 * ============================================================================
 */

/* ========================================================================== */
/*  Helpers                                                                   */
/* ========================================================================== */

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function finiteOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readNumber(value, fallback) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Paul Kellet's refined pink noise plus a brown-noise integrator.  Returns a
 * stereo buffer of the requested length.
 */
function createNoiseBuffer(context, seconds, kind) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    let brown = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;

      if (kind === 'white') {
        data[i] = white * 0.5;
      } else if (kind === 'brown') {
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = clamp(brown * 3.4, -1, 1);
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.10;
        b6 = white * 0.115926;
      }
    }
  }

  return buffer;
}

function sanitiseCamera(value) {
  if (!value) return null;
  const source = value.isCamera && value.position ? value.position : value;
  if (
    Number.isFinite(source.x) &&
    Number.isFinite(source.y) &&
    Number.isFinite(source.z)
  ) {
    return { x: source.x, y: source.y, z: source.z };
  }
  return null;
}

function sanitiseZone(zoneProgress) {
  if (typeof zoneProgress === 'number' && Number.isFinite(zoneProgress)) {
    return { overall: clamp01(zoneProgress), cooler: clamp01(zoneProgress), gpu: clamp01(zoneProgress) };
  }
  if (zoneProgress && typeof zoneProgress === 'object') {
    const overall = clamp01(readNumber(zoneProgress.overall, 0.35));
    return {
      overall,
      cooler: clamp01(readNumber(zoneProgress.cooler, overall)),
      gpu: clamp01(readNumber(zoneProgress.gpu, overall))
    };
  }
  return { overall: 0.35, cooler: 0.35, gpu: 0.35 };
}

/* ========================================================================== */
/*  Factory                                                                   */
/* ========================================================================== */

/**
 * @param {object} [options]
 * @param {number} [options.volume=0.55] Master volume 0..1.
 * @param {boolean} [options.muted=false]
 * @param {number} [options.thermalLoad=0.3]
 * @param {number} [options.aiLoad=0]
 * @param {object} [options.positions] Optional world positions of the cooler
 *   and GPU, used for camera-distance attenuation:
 *   { cooler: {x,y,z}, gpu: {x,y,z} } (rig centimeters by default).
 * @param {number} [options.nearDistance=20] Distance at which proximity = 1.
 * @param {number} [options.farDistance=120] Distance at which proximity = 0.
 * @param {AudioContext} [options.audioContext] Inject a context (tests / apps
 *   that already own one).  Injected contexts are not closed on dispose.
 * @param {string} [options.contextFactory] Optional factory name override.
 */
export function createHardwareAudio(options = {}) {
  const config = options || {};

  const settings = {
    volume: clamp01(readNumber(config.volume, 0.55)),
    muted: !!config.muted,
    thermalLoad: clamp01(readNumber(config.thermalLoad, 0.3)),
    aiLoad: clamp01(readNumber(config.aiLoad, 0)),
    nearDistance: Math.max(1, readNumber(config.nearDistance, 20)),
    farDistance: Math.max(2, readNumber(config.farDistance, 120)),
    positions: config.positions || {
      // Defaults match the hardware rig (centimeters); override for other rigs.
      cooler: { x: -5.6, y: 6.4, z: 7.0 },
      gpu: { x: -4.0, y: -9.7, z: 7.4 }
    }
  };

  const state = {
    thermal: settings.thermalLoad,
    thermalTarget: settings.thermalLoad,
    ai: settings.aiLoad,
    aiTarget: settings.aiLoad,
    proximity: 0.35,
    fanLevel: 0,
    coolantLevel: 0,
    time: 0,
    lastUpdate: 0,
    initialized: false,
    disposed: false,
    ticksScheduled: 0
  };

  let context = null;
  let ownsContext = false;
  let graph = null;
  let nextClockAt = 0;
  let clockInterval = 0.62;

  const sources = [];

  /* ------------------------------- graph --------------------------------- */

  function connect(node, target) {
    if (!node || !target) return;
    try {
      node.connect(target);
    } catch (error) {
      /* A mock or a torn-down context can refuse; that must never break the app. */
    }
  }

  function createGain(value = 0) {
    const gain = context.createGain();
    gain.gain.value = value;
    return gain;
  }

  function setParam(param, value, duration = 0.18) {
    if (!param) return;
    const safe = Number.isFinite(value) ? value : 0;
    try {
      if (typeof param.cancelScheduledValues === 'function') {
        param.cancelScheduledValues(context.currentTime);
      }
      if (typeof param.setTargetAtTime === 'function') {
        param.setTargetAtTime(safe, context.currentTime, Math.max(0.008, duration / 3));
      } else {
        param.value = safe;
      }
    } catch (error) {
      param.value = safe;
    }
  }

  function buildGraph() {
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.knee.value = 14;
    limiter.ratio.value = 5;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.24;
    connect(limiter, context.destination);

    const master = createGain(0);
    connect(master, limiter);

    const fanBus = createGain(0.9);
    const liquidBus = createGain(0.9);
    const clockBus = createGain(0.55);
    const uiBus = createGain(0.8);
    connect(fanBus, master);
    connect(liquidBus, master);
    connect(clockBus, master);
    connect(uiBus, master);

    /* ------------------------------- fan -------------------------------- */
    const pink = createNoiseBuffer(context, 4, 'pink');
    const air = createNoiseBuffer(context, 3, 'white');

    const fanSource = context.createBufferSource();
    fanSource.buffer = pink;
    fanSource.loop = true;
    const fanFilter = context.createBiquadFilter();
    fanFilter.type = 'lowpass';
    fanFilter.frequency.value = 480;
    fanFilter.Q.value = 0.6;
    const fanGain = createGain(0);
    connect(fanSource, fanFilter);
    connect(fanFilter, fanGain);
    connect(fanGain, fanBus);

    const airSource = context.createBufferSource();
    airSource.buffer = air;
    airSource.loop = true;
    const airFilter = context.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.value = 1400;
    airFilter.Q.value = 0.9;
    const airGain = createGain(0);
    connect(airSource, airFilter);
    connect(airFilter, airGain);
    connect(airGain, fanBus);

    // PWM motor: fundamental + octave, soft-clipped by a lowpass.
    const motor = context.createOscillator();
    motor.type = 'sine';
    motor.frequency.value = 48;
    const motorOctave = context.createOscillator();
    motorOctave.type = 'triangle';
    motorOctave.frequency.value = 96;
    const motorFilter = context.createBiquadFilter();
    motorFilter.type = 'lowpass';
    motorFilter.frequency.value = 220;
    motorFilter.Q.value = 0.5;
    const motorGain = createGain(0);
    const motorOctaveGain = createGain(0.35);
    connect(motor, motorFilter);
    connect(motorOctave, motorOctaveGain);
    connect(motorOctaveGain, motorFilter);
    connect(motorFilter, motorGain);
    connect(motorGain, fanBus);

    // Slow commutation wobble on the motor level.
    const wobble = context.createOscillator();
    wobble.type = 'sine';
    wobble.frequency.value = 6.4;
    const wobbleGain = createGain(0.0016);
    connect(wobble, wobbleGain);
    connect(wobbleGain, motorGain.gain);

    /* ----------------------------- liquid ------------------------------- */
    const fluid = createNoiseBuffer(context, 5, 'brown');
    const liquidSource = context.createBufferSource();
    liquidSource.buffer = fluid;
    liquidSource.loop = true;
    const liquidFilter = context.createBiquadFilter();
    liquidFilter.type = 'bandpass';
    liquidFilter.frequency.value = 260;
    liquidFilter.Q.value = 2.6;
    const liquidGain = createGain(0);
    connect(liquidSource, liquidFilter);
    connect(liquidFilter, liquidGain);
    connect(liquidGain, liquidBus);

    const pump = context.createOscillator();
    pump.type = 'sine';
    pump.frequency.value = 54;
    const pumpFilter = context.createBiquadFilter();
    pumpFilter.type = 'lowpass';
    pumpFilter.frequency.value = 180;
    const pumpGain = createGain(0);
    connect(pump, pumpFilter);
    connect(pumpFilter, pumpGain);
    connect(pumpGain, liquidBus);

    const pumpPulse = context.createOscillator();
    pumpPulse.type = 'sine';
    pumpPulse.frequency.value = 1.7;
    const pumpPulseGain = createGain(0.0009);
    connect(pumpPulse, pumpPulseGain);
    connect(pumpPulseGain, pumpGain.gain);

    /* ------------------------------ clock ------------------------------- */
    const padGain = createGain(0);
    const padFilter = context.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 420;
    padFilter.Q.value = 0.7;
    connect(padFilter, padGain);
    connect(padGain, clockBus);

    const padPartials = [
      { frequency: 55, type: 'sine', gain: 1.0, detune: -4 },
      { frequency: 82.41, type: 'sine', gain: 0.5, detune: 3 },
      { frequency: 110, type: 'triangle', gain: 0.28, detune: -2 }
    ];
    for (const partial of padPartials) {
      const osc = context.createOscillator();
      osc.type = partial.type;
      osc.frequency.value = partial.frequency;
      if (osc.detune) osc.detune.value = partial.detune;
      const gain = createGain(partial.gain);
      connect(osc, gain);
      connect(gain, padFilter);
      sources.push({ node: osc, kind: 'oscillator' });
      try {
        osc.start();
      } catch (error) {
        /* already started */
      }
    }

    sources.push({ node: fanSource, kind: 'buffer' });
    sources.push({ node: airSource, kind: 'buffer' });
    sources.push({ node: motor, kind: 'oscillator' });
    sources.push({ node: motorOctave, kind: 'oscillator' });
    sources.push({ node: wobble, kind: 'oscillator' });
    sources.push({ node: liquidSource, kind: 'buffer' });
    sources.push({ node: pump, kind: 'oscillator' });
    sources.push({ node: pumpPulse, kind: 'oscillator' });

    for (const source of [fanSource, airSource, liquidSource]) {
      try {
        source.start();
      } catch (error) {
        /* already started */
      }
    }
    for (const oscillator of [motor, motorOctave, wobble, pump, pumpPulse]) {
      try {
        oscillator.start();
      } catch (error) {
        /* already started */
      }
    }

    graph = {
      limiter,
      master,
      fanBus,
      liquidBus,
      clockBus,
      uiBus,
      fanSource,
      fanFilter,
      fanGain,
      airSource,
      airFilter,
      airGain,
      motor,
      motorOctave,
      motorFilter,
      motorGain,
      wobble,
      wobbleGain,
      liquidSource,
      liquidFilter,
      liquidGain,
      pump,
      pumpFilter,
      pumpGain,
      padGain,
      padFilter
    };

    nextClockAt = context.currentTime + 0.1;
  }

  /* --------------------------- context lifecycle -------------------------- */

  function resolveContextConstructor() {
    if (config.audioContext) return null;
    if (typeof window === 'undefined') return null;
    return window.AudioContext || window.webkitAudioContext || null;
  }

  function init() {
    if (state.disposed) return null;
    if (context) return context;

    if (config.audioContext) {
      context = config.audioContext;
      ownsContext = false;
    } else {
      const Constructor = resolveContextConstructor();
      if (!Constructor) return null;
      try {
        context = new Constructor({ latencyHint: 'interactive' });
        ownsContext = true;
      } catch (error) {
        context = null;
        return null;
      }
    }

    if (!context || typeof context.createGain !== 'function') {
      context = null;
      return null;
    }

    try {
      buildGraph();
    } catch (error) {
      try {
        if (ownsContext && typeof context.close === 'function') context.close();
      } catch (closeError) {
        /* ignore */
      }
      context = null;
      graph = null;
      return null;
    }

    state.initialized = true;
    applyMasterLevel(0.2);
    applyLoads(0.2);
    return context;
  }

  function resume() {
    if (state.disposed) return Promise.resolve(false);
    const ctx = init();
    if (!ctx) return Promise.resolve(false);

    let promise;
    try {
      promise = ctx.resume ? ctx.resume() : Promise.resolve();
    } catch (error) {
      promise = Promise.resolve();
    }
    return Promise.resolve(promise)
      .then(() => {
        if (state.disposed) return false;
        applyMasterLevel(0.15);
        return true;
      })
      .catch(() => false);
  }

  /* ------------------------------- levels -------------------------------- */

  function applyMasterLevel(duration = 0.2) {
    if (!graph) return;
    const target = state.disposed || settings.muted ? 0 : settings.volume * 0.9;
    setParam(graph.master.gain, target, duration);
  }

  function applyLoads(duration = 0.2) {
    if (!graph) return;

    const thermal = clamp01(state.thermal);
    const ai = clamp01(state.ai);
    const proximity = clamp01(state.proximity);

    // Fan tracks RPM proxy: idle 0.22, thermal-dominant, AI adds a little.
    const fan = clamp01(0.20 + thermal * 0.72 + ai * 0.18);
    const airflow = fan * (0.55 + proximity * 0.45);
    const coolant = clamp01(0.10 + ai * 0.55 + thermal * 0.3) * (0.6 + proximity * 0.4);

    state.fanLevel = fan;
    state.coolantLevel = coolant;

    setParam(graph.fanFilter.frequency, 320 + fan * 1150 + proximity * 220, duration);
    setParam(graph.fanGain.gain, 0.035 + airflow * 0.095, duration);
    setParam(graph.airFilter.frequency, 900 + fan * 1900, duration);
    setParam(graph.airGain.gain, 0.004 + airflow * 0.024, duration);

    setParam(graph.motor.frequency, 44 + fan * 26, duration);
    setParam(graph.motorOctave.frequency, 88 + fan * 52, duration);
    setParam(graph.motorFilter.frequency, 160 + fan * 190, duration);
    setParam(graph.motorGain.gain, 0.0025 + fan * 0.0105, duration);
    setParam(graph.wobble.frequency, 4.6 + fan * 4.2, duration);

    setParam(graph.liquidFilter.frequency, 200 + coolant * 180, duration);
    setParam(graph.liquidGain.gain, 0.0015 + coolant * 0.016, duration);
    setParam(graph.pump.frequency, 48 + coolant * 20, duration);
    setParam(graph.pumpGain.gain, 0.0015 + coolant * 0.0125, duration);

    setParam(graph.padGain.gain, 0.0025 + ai * 0.0055 + thermal * 0.0015, duration);
    setParam(graph.padFilter.frequency, 320 + ai * 340, duration);

    clockInterval = 0.68 - ai * 0.32;
  }

  /* ------------------------------- update -------------------------------- */

  function update(cameraPos, thermalLoad, zoneProgress, aiLoad) {
    if (state.disposed) return;

    let camera = cameraPos;
    let thermal = thermalLoad;
    let zone = zoneProgress;
    let ai = aiLoad;

    if (cameraPos && typeof cameraPos === 'object' && !cameraPos.isVector3 && !cameraPos.isCamera &&
        (cameraPos.thermalLoad !== undefined || cameraPos.aiLoad !== undefined || cameraPos.cameraPos !== undefined)) {
      const payload = cameraPos;
      camera = payload.cameraPos;
      thermal = payload.thermalLoad;
      zone = payload.zoneProgress;
      ai = payload.aiLoad;
    }

    if (thermal !== undefined) state.thermalTarget = clamp01(readNumber(thermal, state.thermalTarget));
    if (ai !== undefined) state.aiTarget = clamp01(readNumber(ai, state.aiTarget));

    const zoneValue = sanitiseZone(zone);
    let proximity = zoneValue.overall;

    const cameraPoint = sanitiseCamera(camera);
    const positions = settings.positions;
    if (cameraPoint && positions) {
      const targets = [];
      if (positions.cooler) targets.push(positions.cooler);
      if (positions.gpu) targets.push(positions.gpu);
      let nearest = Infinity;
      for (const target of targets) {
        const point = sanitiseCamera(target);
        if (!point) continue;
        const dx = cameraPoint.x - point.x;
        const dy = cameraPoint.y - point.y;
        const dz = cameraPoint.z - point.z;
        nearest = Math.min(nearest, Math.sqrt(dx * dx + dy * dy + dz * dz));
      }
      if (Number.isFinite(nearest)) {
        const span = Math.max(1, settings.farDistance - settings.nearDistance);
        proximity = clamp01(1 - (nearest - settings.nearDistance) / span);
      }
    }

    state.proximity += (proximity - state.proximity) * 0.18;

    // Use the real elapsed time when available so a background tab cannot
    // accelerate the smoothing.
    let dt = 1 / 60;
    if (context && Number.isFinite(context.currentTime)) {
      dt = state.lastUpdate > 0 ? clamp(context.currentTime - state.lastUpdate, 0, 0.25) : 1 / 60;
      state.lastUpdate = context.currentTime;
    }
    state.time += dt;

    const thermalEase = 1 - Math.exp(-dt * 2.4);
    const aiEase = 1 - Math.exp(-dt * 1.9);
    state.thermal += (state.thermalTarget - state.thermal) * thermalEase;
    state.ai += (state.aiTarget - state.ai) * aiEase;

    if (!graph) return;

    applyLoads(0.14);
    scheduleClock();
  }

  function scheduleClock() {
    if (!context || !graph) return;

    const now = context.currentTime;
    if (!Number.isFinite(now)) return;

    // If the tab was asleep, jump the cursor forward instead of stacking ticks.
    if (nextClockAt < now - 1) nextClockAt = now + 0.05;
    if (nextClockAt > now + 1.5) nextClockAt = now + 0.05;

    const horizon = now + 0.25;
    let guard = 0;
    while (nextClockAt < horizon && guard < 8) {
      scheduleTick(nextClockAt);
      nextClockAt += Math.max(0.22, clockInterval);
      guard += 1;
    }
  }

  function scheduleTick(at) {
    if (!graph || !context) return;
    try {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1180 + Math.random() * 220, at);

      const gain = context.createGain();
      const peak = 0.006 + clamp01(state.ai) * 0.006;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);

      connect(osc, gain);
      connect(gain, graph.clockBus);
      osc.start(at);
      osc.stop(at + 0.06);
      state.ticksScheduled += 1;
    } catch (error) {
      /* The context may have been closed between frames. */
    }
  }

  /* --------------------------------- UI ---------------------------------- */

  function playClick() {
    if (state.disposed || settings.muted) return;
    const ctx = init();
    if (!ctx || !graph) return;

    const now = finiteOr(ctx.currentTime, 0);
    try {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1320, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.055);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

      connect(osc, gain);
      connect(gain, graph.uiBus);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (error) {
      /* ignore */
    }
  }

  function playTransition() {
    if (state.disposed || settings.muted) return;
    const ctx = init();
    if (!ctx || !graph) return;

    const now = finiteOr(ctx.currentTime, 0);
    try {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.6, 'pink');
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1.1;
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(2600, now + 0.42);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.58);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.028, now + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      connect(noise, filter);
      connect(filter, gain);
      connect(gain, graph.uiBus);
      noise.start(now);
      noise.stop(now + 0.62);

      const glide = ctx.createOscillator();
      glide.type = 'sine';
      glide.frequency.setValueAtTime(164, now);
      glide.frequency.exponentialRampToValueAtTime(328, now + 0.5);
      const glideGain = ctx.createGain();
      glideGain.gain.setValueAtTime(0.0001, now);
      glideGain.gain.exponentialRampToValueAtTime(0.008, now + 0.16);
      glideGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
      connect(glide, glideGain);
      connect(glideGain, graph.uiBus);
      glide.start(now);
      glide.stop(now + 0.6);
    } catch (error) {
      /* ignore */
    }
  }

  /* -------------------------------- state -------------------------------- */

  function setMuted(muted) {
    settings.muted = !!muted;
    applyMasterLevel(0.08);
  }

  function isMuted() {
    return settings.muted;
  }

  function setVolume(volume) {
    settings.volume = clamp01(readNumber(volume, settings.volume));
    applyMasterLevel(0.1);
  }

  function setThermalLoad(load) {
    state.thermalTarget = clamp01(readNumber(load, state.thermalTarget));
    if (graph) applyLoads(0.15);
  }

  function setAiLoad(load) {
    state.aiTarget = clamp01(readNumber(load, state.aiTarget));
    if (graph) applyLoads(0.15);
  }

  function getState() {
    return {
      initialized: state.initialized,
      running: !!context && (context.state === undefined || context.state === 'running'),
      contextState: context ? context.state || 'unknown' : 'none',
      sampleRate: context ? context.sampleRate : 0,
      muted: settings.muted,
      volume: settings.volume,
      thermalLoad: state.thermal,
      aiLoad: state.ai,
      fanLevel: state.fanLevel,
      coolantLevel: state.coolantLevel,
      proximity: state.proximity,
      clockInterval,
      ticksScheduled: state.ticksScheduled,
      disposed: state.disposed
    };
  }

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;

    for (const source of sources) {
      try {
        if (source.kind === 'oscillator' || source.kind === 'buffer') {
          if (typeof source.node.stop === 'function') source.node.stop();
        }
      } catch (error) {
        /* already stopped */
      }
      try {
        if (typeof source.node.disconnect === 'function') source.node.disconnect();
      } catch (error) {
        /* disconnected */
      }
    }
    sources.length = 0;

    if (graph) {
      for (const node of Object.values(graph)) {
        if (node && typeof node === 'object' && typeof node.disconnect === 'function') {
          try {
            node.disconnect();
          } catch (error) {
            /* ignore */
          }
        }
      }
      graph = null;
    }

    if (context && ownsContext && typeof context.close === 'function') {
      try {
        context.close();
      } catch (error) {
        /* ignore */
      }
    }
    context = null;
    state.initialized = false;
  }

  return {
    init,
    resume,
    setMuted,
    isMuted,
    setVolume,
    setThermalLoad,
    setAiLoad,
    update,
    playClick,
    playTransition,
    getState,
    dispose
  };
}

export default createHardwareAudio;
