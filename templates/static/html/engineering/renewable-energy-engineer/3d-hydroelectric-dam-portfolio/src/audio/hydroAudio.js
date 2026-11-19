/**
 * hydroAudio.js
 * ============================================================================
 * The procedural soundscape of a hydroelectric dam, synthesised live with the
 * Web Audio API. No audio files, no samples, no network requests: every layer
 * is noise, oscillators and filters generated in the browser.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   import { createHydroAudio } from './audio/hydroAudio.js';
 *
 *   const audio = createHydroAudio({ volume: 0.8 });
 *   audio.init();                     // after a user gesture
 *   audio.resume();                   // after a tab switch / iOS unlock
 *   audio.setMuted(true);  audio.isMuted();
 *   audio.setVolume(0.7);             // 0..1
 *   audio.update(progress, flowM3s, outputMw, spillwayOpen);
 *   audio.playGateChime();            // gate / hoist feedback
 *   audio.playClick();                // UI feedback
 *   audio.getState();  audio.dispose();
 *
 * `update` is meant to be called once per animation frame from the same loop
 * that drives the 3D world. It is cheap: values are smoothed onto the audio
 * clock, and parameter writes are throttled to `updateIntervalMs`.
 *
 * ----------------------------------------------------------------------------
 * LAYERS
 * ----------------------------------------------------------------------------
 * 1. RESERVOIR AIR & LAP
 *    Pink noise through a gentle lowpass (breeze over open water) plus a slow
 *    band-passed swell that rises and falls like water lapping at concrete.
 *
 * 2. SPILLWAY WHITEWATER
 *    Three layers, all scaled by both the gate opening and the camera's
 *    proximity to the spillway: a brown-noise sub rumble through a 90 Hz
 *    lowpass (the mass of water), pink noise through a lowpass that opens from
 *    380 Hz to 2.6 kHz as you approach (the roar), and high-passed white noise
 *    (the spray hiss). A convolution send gives the gorge its slap-back echo.
 *
 * 3. PENSTOCK RUSH
 *    Pink noise band-passed around 500 Hz with a slow filter sweep: the sound
 *    of water accelerating down a 140 m steel conduit. Follows the penstock
 *    station and the plant's discharge.
 *
 * 4. TURBINE-GENERATOR HARMONIC HUM
 *    The 50 Hz synchronous hum with its 100/150/200 Hz harmonics, a 32.5 Hz
 *    mechanical rumble amplitude-modulated at the 5 Hz rotation rate (300 rpm),
 *    and a band-passed water rush through the casing. Rises as the camera
 *    enters the powerhouse and follows the electrical output.
 *
 * 5. SWITCHYARD TRANSFORMER BUZZ
 *    Mains-frequency magnetostriction: 100/200/300 Hz tooth through a soft
 *    saturator and a resonant band-pass, plus a faint 100 Hz hum. Cross-fades
 *    in at the transformer yard and at night, with a 0.4 Hz breathing.
 *
 * 6. CONTROL SOUNDS
 *    `playGateChime()` — a radial gate's steel clang plus the servo whine of
 *    its hoist; `playClick()` — a relay click.
 *
 * The mix is band-split by level so that no single station ever dominates.
 *
 * ----------------------------------------------------------------------------
 * TESTING / HEADLESS
 * ----------------------------------------------------------------------------
 * `options.audioContext` accepts any AudioContext-shaped object, so an
 * OfflineAudioContext can drive the whole graph and the rendered buffer can be
 * measured. Without Web Audio and without an injected context, `init()` returns
 * false and every method stays inert.
 *
 * `getState().masterLevel` reports the RMS seen at the master analyser, which
 * is a real measurement of the produced signal on a live context.
 */

export const HYDRO_AUDIO_VERSION = '1.0.0';

const DEFAULTS = {
  volume: 0.8,
  muted: false,
  audioContext: null,
  destination: null,
  spillwayOpen: 0.75,
  /** Station centres in progress space, used to derive proximity. */
  stations: {
    crest: { p: 0.09, w: 0.15 },
    spillway: { p: 0.28, w: 0.15 },
    penstocks: { p: 0.48, w: 0.13 },
    turbine: { p: 0.68, w: 0.14 },
    switchyard: { p: 0.85, w: 0.13 },
    night: { p: 0.98, w: 0.11 },
  },
  updateIntervalMs: 45,
  smoothing: 0.18,
  spillwayRatedFlow: 1600,
  ratedOutputMw: 720,
  reverbSeconds: 2.2,
  reverbAmount: 0.22,
  humBase: 50,
};

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function finite(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/*  Noise generators                                                          */
/* -------------------------------------------------------------------------- */

/** Paul Kellet refined pink noise, −3 dB/octave. */
function fillPink(data, random) {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
}

/** Brown / red noise: the body of falling water. */
function fillBrown(data, random) {
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
}

function fillWhite(data, random) {
  for (let i = 0; i < data.length; i += 1) data[i] = random() * 2 - 1;
}

/* -------------------------------------------------------------------------- */
/*  Factory                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * @param {object} [options]
 * @param {number} [options.volume=0.8]               master volume 0..1
 * @param {boolean} [options.muted=false]
 * @param {AudioContext} [options.audioContext]       inject a context (tests)
 * @param {AudioNode} [options.destination]           override the destination
 * @param {number} [options.spillwayOpen=0.75]        initial gate opening
 * @param {number} [options.updateIntervalMs=45]
 * @param {number} [options.reverbAmount=0.22]
 */
export function createHydroAudio(options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const state = {
    initialized: false,
    disposed: false,
    muted: cfg.muted === true,
    volume: clamp01(finite(cfg.volume, DEFAULTS.volume)),
    progress: 0,
    flowM3s: 0,
    outputMw: 0,
    spillwayOpen: clamp01(finite(cfg.spillwayOpen, DEFAULTS.spillwayOpen)),
    contextState: 'suspended',
    lastUpdate: -1e9,
    masterLevel: 0,
    layers: {
      reservoir: 0,
      spillway: 0,
      penstock: 0,
      turbine: 0,
      transformer: 0,
    },
    ownContext: false,
    triggers: { gates: 0, clicks: 0 },
  };

  let ctx = null;
  let nodes = null;
  let noiseBuffers = null;
  let destination = null;
  let startedAt = 0;

  /* ---- helpers ---------------------------------------------------------- */

  function now() {
    return ctx ? ctx.currentTime : 0;
  }

  function makeNoiseBuffer(kind, seconds, seed) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const random = mulberry32(seed);
    if (kind === 'pink') fillPink(data, random);
    else if (kind === 'brown') fillBrown(data, random);
    else fillWhite(data, random);
    return buffer;
  }

  function makeNoiseSource(kind, seed) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffers[kind] || noiseBuffers.pink;
    source.loop = true;
    source.playbackRate.value = 1;
    void seed;
    source.start(0);
    return source;
  }

  function makeGain(value) {
    const gain = ctx.createGain();
    gain.gain.value = value;
    return gain;
  }

  function makeFilter(type, frequency, q = 1) {
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
  }

  /** A short canyon impulse response: sparse early taps into a tail. */
  function makeImpulse(seconds, decay) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    const random = mulberry32(90210);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        const tail = Math.pow(1 - t, decay) * (random() * 2 - 1) * 0.55;
        data[i] = i < ctx.sampleRate * 0.02 ? tail * 0.25 : tail;
      }
      // discrete slap-back from the gorge walls
      for (const [ms, gain] of [[34, 0.4], [71, 0.3], [118, 0.22], [183, 0.15], [257, 0.1]]) {
        const index = Math.floor((ms / 1000) * ctx.sampleRate) + (channel ? 13 : 0);
        if (index < length) data[index] += gain * (channel ? -1 : 1);
      }
    }
    return impulse;
  }

  function softClipCurve(amount) {
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i += 1) {
      const x = (i / (samples - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
    }
    return curve;
  }

  /* ---- graph ------------------------------------------------------------ */

  function buildGraph() {
    nodes = {};

    const master = makeGain(state.muted ? 0 : state.volume);
    master.name = 'hydroMaster';
    nodes.master = master;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 22;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.28;
    nodes.limiter = limiter;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;
    nodes.analyser = analyser;
    nodes.analyserBuffer = new Float32Array(analyser.fftSize);

    master.connect(limiter);
    limiter.connect(analyser);
    analyser.connect(destination);

    // shared reverb bus
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(cfg.reverbSeconds, 2.4);
    const reverbGain = makeGain(cfg.reverbAmount);
    reverb.connect(reverbGain);
    reverbGain.connect(master);
    nodes.reverb = reverb;
    nodes.reverbGain = reverbGain;

    /* ---- 1. reservoir air ------------------------------------------------ */
    const reservoir = {};
    reservoir.gain = makeGain(0);
    reservoir.source = makeNoiseSource('pink', 1001);
    reservoir.filter = makeFilter('lowpass', 720, 0.7);
    reservoir.source.connect(reservoir.filter);
    reservoir.filter.connect(reservoir.gain);
    reservoir.gain.connect(master);

    // lapping swell: a band-passed copy with a slow tremolo
    reservoir.lapGain = makeGain(0);
    reservoir.lapTremolo = makeGain(0.75);
    reservoir.lapFilter = makeFilter('bandpass', 320, 1.6);
    reservoir.lapSource = makeNoiseSource('brown', 1002);
    reservoir.lapLfo = ctx.createOscillator();
    reservoir.lapLfo.type = 'sine';
    reservoir.lapLfo.frequency.value = 0.16;
    reservoir.lapDepth = makeGain(0.25);
    reservoir.lapSource.connect(reservoir.lapFilter);
    reservoir.lapFilter.connect(reservoir.lapTremolo);
    reservoir.lapLfo.connect(reservoir.lapDepth);
    reservoir.lapDepth.connect(reservoir.lapTremolo.gain);
    reservoir.lapTremolo.connect(reservoir.lapGain);
    reservoir.lapGain.connect(master);
    reservoir.lapLfo.start(0);
    nodes.reservoir = reservoir;

    /* ---- 2. spillway whitewater ------------------------------------------ */
    const spill = {};
    spill.gain = makeGain(0);

    // mass of water
    spill.sub = makeFilter('lowpass', 110, 0.8);
    spill.subGain = makeGain(0.9);
    spill.subSource = makeNoiseSource('brown', 2001);
    spill.subSource.connect(spill.sub);
    spill.sub.connect(spill.subGain);
    spill.subGain.connect(spill.gain);

    // the roar
    spill.roar = makeFilter('lowpass', 600, 0.9);
    spill.roarGain = makeGain(1.0);
    spill.roarSource = makeNoiseSource('pink', 2002);
    spill.roarSource.connect(spill.roar);
    spill.roar.connect(spill.roarGain);
    spill.roarGain.connect(spill.gain);

    // spray
    spill.hiss = makeFilter('highpass', 2600, 0.7);
    spill.hissGain = makeGain(0.28);
    spill.hissSource = makeNoiseSource('white', 2003);
    spill.hissSource.connect(spill.hiss);
    spill.hiss.connect(spill.hissGain);
    spill.hissGain.connect(spill.gain);

    spill.gain.connect(master);
    const spillSend = makeGain(0.5);
    spill.gain.connect(spillSend);
    spillSend.connect(reverb);
    spill.send = spillSend;
    nodes.spillway = spill;

    /* ---- 3. penstock rush ------------------------------------------------ */
    const penstock = {};
    penstock.gain = makeGain(0);
    penstock.filter = makeFilter('bandpass', 520, 0.8);
    penstock.source = makeNoiseSource('pink', 3001);
    penstock.source.connect(penstock.filter);
    penstock.filter.connect(penstock.gain);
    penstock.gain.connect(master);
    const penstockSend = makeGain(0.18);
    penstock.gain.connect(penstockSend);
    penstockSend.connect(reverb);
    nodes.penstock = penstock;

    /* ---- 4. turbine-generator hum -----------------------------========== */
    const turbine = {};
    turbine.gain = makeGain(0);

    // synchronous hum: 50 / 100 / 150 / 200 Hz
    turbine.hums = [];
    const humPlan = [
      { mult: 1, gain: 0.42, type: 'sine' },
      { mult: 2, gain: 0.24, type: 'sine' },
      { mult: 3, gain: 0.13, type: 'sine' },
      { mult: 4, gain: 0.07, type: 'triangle' },
    ];
    for (const plan of humPlan) {
      const osc = ctx.createOscillator();
      osc.type = plan.type;
      osc.frequency.value = cfg.humBase * plan.mult;
      const gain = makeGain(plan.gain);
      osc.connect(gain);
      gain.connect(turbine.gain);
      osc.start(0);
      turbine.hums.push({ osc, gain, mult: plan.mult });
    }

    // mechanical rumble amplitude-modulated at the rotation rate (300 rpm = 5 Hz)
    turbine.rumble = ctx.createOscillator();
    turbine.rumble.type = 'sine';
    turbine.rumble.frequency.value = (cfg.humBase * 13) / 20; // 13 blades, 5 rev/s
    turbine.rumbleGain = makeGain(0.4);
    turbine.rumble.connect(turbine.rumbleGain);
    turbine.rumbleGain.connect(turbine.gain);
    turbine.rumble.start(0);

    turbine.rumbleLfo = ctx.createOscillator();
    turbine.rumbleLfo.type = 'sine';
    turbine.rumbleLfo.frequency.value = 5;
    turbine.rumbleDepth = makeGain(0.28);
    turbine.rumbleLfo.connect(turbine.rumbleDepth);
    turbine.rumbleDepth.connect(turbine.rumbleGain.gain);
    turbine.rumbleLfo.start(0);

    // water through the casing
    turbine.rush = makeFilter('bandpass', 340, 1.1);
    turbine.rushGain = makeGain(0.5);
    turbine.rushSource = makeNoiseSource('pink', 4001);
    turbine.rushSource.connect(turbine.rush);
    turbine.rush.connect(turbine.rushGain);
    turbine.rushGain.connect(turbine.gain);

    turbine.gain.connect(master);
    const turbineSend = makeGain(0.3);
    turbine.gain.connect(turbineSend);
    turbineSend.connect(reverb);
    nodes.turbine = turbine;

    /* ---- 5. transformer buzz -------------------------------------------- */
    const transformer = {};
    transformer.gain = makeGain(0);
    transformer.shaper = ctx.createWaveShaper();
    transformer.shaper.curve = softClipCurve(2.6);
    transformer.shaper.oversample = '2x';
    transformer.filter = makeFilter('bandpass', 620, 1.4);

    transformer.oscillators = [];
    for (const mult of [2, 4, 6]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = cfg.humBase * mult;
      const gain = makeGain(mult === 2 ? 0.34 : mult === 4 ? 0.16 : 0.07);
      osc.connect(gain);
      gain.connect(transformer.shaper);
      osc.start(0);
      transformer.oscillators.push({ osc, gain, mult });
    }
    transformer.shaper.connect(transformer.filter);
    transformer.tremolo = makeGain(0.86);
    transformer.filter.connect(transformer.tremolo);
    transformer.tremolo.connect(transformer.gain);

    // low hum that survives the filter
    transformer.hum = ctx.createOscillator();
    transformer.hum.type = 'sine';
    transformer.hum.frequency.value = cfg.humBase * 2;
    transformer.humGain = makeGain(0.22);
    transformer.hum.connect(transformer.humGain);
    transformer.humGain.connect(transformer.gain);
    transformer.hum.start(0);

    // 0.4 Hz breathing of the core
    transformer.lfo = ctx.createOscillator();
    transformer.lfo.type = 'sine';
    transformer.lfo.frequency.value = 0.4;
    transformer.lfoDepth = makeGain(0.16);
    transformer.lfo.connect(transformer.lfoDepth);
    transformer.lfoDepth.connect(transformer.tremolo.gain);
    transformer.lfo.start(0);

    transformer.gain.connect(master);
    nodes.transformer = transformer;
  }

  /* ---- lifecycle -------------------------------------------------------- */

  function init() {
    if (state.initialized || state.disposed) return state.initialized;
    let context = cfg.audioContext || null;
    if (!context) {
      const Ctor =
        (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
        (typeof globalThis !== 'undefined' && globalThis.AudioContext) ||
        null;
      if (!Ctor) return false;
      try {
        context = new Ctor();
        state.ownContext = true;
      } catch (error) {
        return false;
      }
    }
    if (!context || typeof context.createGain !== 'function') return false;

    ctx = context;
    destination = cfg.destination || ctx.destination || null;
    if (!destination) return false;

    noiseBuffers = {
      pink: makeNoiseBuffer('pink', 5.5, 4711),
      brown: makeNoiseBuffer('brown', 5.5, 9137),
      white: makeNoiseBuffer('white', 3.5, 2711),
    };

    try {
      buildGraph();
    } catch (error) {
      state.initError = error && error.message ? error.message : String(error);
      nodes = null;
      ctx = null;
      return false;
    }

    startedAt = now();
    state.initialized = true;
    state.contextState = ctx.state || 'running';
    if (state.ownContext && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {});
    }
    applyLevels(0, true);
    return true;
  }

  function resume() {
    if (!ctx) return false;
    if (typeof ctx.resume === 'function') {
      const result = ctx.resume();
      if (result && typeof result.then === 'function') {
        result.then(() => {
          state.contextState = ctx.state;
        }).catch(() => {});
      }
    }
    state.contextState = ctx.state || 'running';
    return state.contextState === 'running';
  }

  function setMuted(muted) {
    state.muted = muted === true;
    if (nodes && nodes.master) {
      const target = state.muted ? 0 : state.volume;
      nodes.master.gain.setTargetAtTime(target, now(), 0.05);
    }
    return state.muted;
  }

  function isMuted() {
    return state.muted;
  }

  function setVolume(volume) {
    state.volume = clamp01(finite(volume, state.volume));
    if (nodes && nodes.master && !state.muted) {
      nodes.master.gain.setTargetAtTime(state.volume, now(), 0.05);
    }
    return state.volume;
  }

  /* ---- proximity -------------------------------------------------------- */

  function stationWeights(progress) {
    const p = clamp01(progress);
    const weights = {};
    let total = 0;
    for (const key of Object.keys(cfg.stations)) {
      const station = cfg.stations[key];
      const d = (p - station.p) / Math.max(1e-4, station.w);
      const weight = Math.exp(-d * d);
      weights[key] = weight;
      total += weight;
    }
    // normalise so a layer never jumps when stations overlap
    const norm = total > 0 ? 1 / total : 0;
    for (const key of Object.keys(weights)) weights[key] *= norm;
    return weights;
  }

  function computeLevels(progress, flowM3s, outputMw, spillwayOpen) {
    const w = stationWeights(progress);
    const open = clamp01(spillwayOpen);
    const flowNorm = clamp01(finite(flowM3s, 0) / (cfg.spillwayRatedFlow + 540));
    const outputNorm = clamp01(finite(outputMw, 0) / cfg.ratedOutputMw);

    const spillway = clamp01(
      (w.spillway * 1.15 + w.night * 0.55 + w.crest * 0.12) * Math.pow(open, 0.85) * (0.55 + 0.45 * flowNorm)
    );
    const penstock = clamp01(w.penstocks * 1.05 + w.turbine * 0.35 + w.crest * 0.05);
    const turbine = clamp01(w.turbine * 1.1 + w.penstocks * 0.45 + w.night * 0.18);
    const transformer = clamp01(w.switchyard * 1.05 + w.night * 0.35 + w.turbine * 0.08);
    const reservoir = clamp01(0.62 - spillway * 0.35 - turbine * 0.2 + w.crest * 0.25);

    return {
      reservoir,
      spillway,
      penstock: penstock * (0.55 + 0.45 * (0.4 + 0.6 * outputNorm)),
      turbine: turbine * (0.5 + 0.5 * (0.35 + 0.65 * outputNorm)),
      transformer,
    };
  }

  function applyLevels(deltaTime, immediate = false) {
    if (!nodes) return;
    const t = now();
    const smoothing = immediate ? 0.02 : Math.max(0.05, cfg.smoothing);
    const levels = state.layers;

    nodes.reservoir.gain.gain.setTargetAtTime(0.16 * levels.reservoir, t, smoothing);
    nodes.reservoir.lapGain.gain.setTargetAtTime(0.1 * levels.reservoir, t, smoothing);
    nodes.reservoir.filter.frequency.setTargetAtTime(520 + 420 * levels.reservoir, t, smoothing);

    nodes.spillway.gain.gain.setTargetAtTime(0.42 * levels.spillway, t, smoothing);
    nodes.spillway.subGain.gain.setTargetAtTime(0.5 + 0.5 * levels.spillway, t, smoothing);
    nodes.spillway.roar.frequency.setTargetAtTime(360 + 1900 * Math.pow(levels.spillway, 0.8), t, smoothing);
    nodes.spillway.hissGain.gain.setTargetAtTime(0.06 + 0.34 * levels.spillway, t, smoothing);

    nodes.penstock.gain.gain.setTargetAtTime(0.2 * levels.penstock, t, smoothing);
    nodes.penstock.filter.frequency.setTargetAtTime(420 + 260 * levels.penstock, t, smoothing);
    nodes.penstock.filter.Q.setTargetAtTime(0.7 + 0.6 * levels.penstock, t, smoothing);

    nodes.turbine.gain.gain.setTargetAtTime(0.3 * levels.turbine, t, smoothing);
    nodes.turbine.rushGain.gain.setTargetAtTime(0.25 + 0.45 * levels.turbine, t, smoothing);
    nodes.turbine.rumbleGain.gain.setTargetAtTime(0.22 + 0.4 * levels.turbine, t, smoothing);

    nodes.transformer.gain.gain.setTargetAtTime(0.16 * levels.transformer, t, smoothing);
    void deltaTime;
  }

  /* ---- update ----------------------------------------------------------- */

  function update(progress = 0, flowM3s = 0, outputMw = 0, spillwayOpen = state.spillwayOpen) {
    if (!state.initialized || state.disposed) {
      state.progress = clamp01(finite(progress, 0));
      state.flowM3s = Math.max(0, finite(flowM3s, 0));
      state.outputMw = Math.max(0, finite(outputMw, 0));
      state.spillwayOpen = clamp01(finite(spillwayOpen, state.spillwayOpen));
      state.layers = computeLevels(state.progress, state.flowM3s, state.outputMw, state.spillwayOpen);
      return state.layers;
    }

    const t = now();
    state.progress = clamp01(finite(progress, 0));
    state.flowM3s = Math.max(0, finite(flowM3s, 0));
    state.outputMw = Math.max(0, finite(outputMw, 0));
    state.spillwayOpen = clamp01(finite(spillwayOpen, state.spillwayOpen));
    state.layers = computeLevels(state.progress, state.flowM3s, state.outputMw, state.spillwayOpen);

    if ((t - state.lastUpdate) * 1000 < cfg.updateIntervalMs) {
      return state.layers;
    }
    state.lastUpdate = t;
    state.contextState = ctx.state || state.contextState;

    // the 50 Hz hum sags a few millihertz with load, like a real machine
    const sag = 1 - 0.004 * clamp01(state.outputMw / cfg.ratedOutputMw);
    for (const hum of nodes.turbine.hums) {
      hum.osc.frequency.setTargetAtTime(cfg.humBase * hum.mult * sag, t, 0.4);
    }

    applyLevels(0);
    updateMasterLevel();
    return state.layers;
  }

  function updateMasterLevel() {
    if (!nodes || !nodes.analyser) return 0;
    const data = nodes.analyserBuffer;
    if (!data || typeof nodes.analyser.getFloatTimeDomainData !== 'function') return state.masterLevel;
    nodes.analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    state.masterLevel = state.masterLevel * 0.7 + rms * 0.3;
    return state.masterLevel;
  }

  /* ---- one-shots -------------------------------------------------------- */

  function playClick() {
    if (!state.initialized || !nodes || state.muted) return false;
    const t = now();
    state.triggers.clicks += 1;

    const clickSource = ctx.createBufferSource();
    clickSource.buffer = noiseBuffers.white;
    clickSource.loop = false;
    clickSource.playbackRate.value = 1.6;
    const filter = makeFilter('highpass', 1400, 0.9);
    const gain = makeGain(0);
    clickSource.connect(filter);
    filter.connect(gain);
    gain.connect(nodes.master);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    clickSource.start(t, 0.1, 0.09);
    clickSource.stop(t + 0.1);

    const blip = ctx.createOscillator();
    blip.type = 'square';
    blip.frequency.setValueAtTime(1250, t);
    blip.frequency.exponentialRampToValueAtTime(760, t + 0.045);
    const blipGain = makeGain(0);
    blip.connect(blipGain);
    blipGain.connect(nodes.master);
    blipGain.gain.setValueAtTime(0.0001, t);
    blipGain.gain.exponentialRampToValueAtTime(0.045, t + 0.005);
    blipGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    blip.start(t);
    blip.stop(t + 0.08);
    return true;
  }

  /**
   * The sound of a radial gate being trimmed: a steel clang under the deck,
   * then the hoist's servo whine as the gate takes up its new position.
   */
  function playGateChime() {
    if (!state.initialized || !nodes || state.muted) return false;
    const t = now();
    state.triggers.gates += 1;

    // clang: FM bell with an inharmonic partial
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(268, t);
    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(402, t);
    const modGain = makeGain(260);
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const bodyGain = makeGain(0);
    carrier.connect(bodyGain);
    bodyGain.connect(nodes.master);
    const send = makeGain(0.35);
    bodyGain.connect(send);
    send.connect(nodes.reverb);

    bodyGain.gain.setValueAtTime(0.0001, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.22, t + 0.006);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    carrier.start(t);
    modulator.start(t);
    carrier.stop(t + 1.2);
    modulator.stop(t + 1.2);

    // impact noise
    const impact = ctx.createBufferSource();
    impact.buffer = noiseBuffers.white;
    impact.loop = false;
    const impactFilter = makeFilter('bandpass', 1900, 1.1);
    const impactGain = makeGain(0);
    impact.connect(impactFilter);
    impactFilter.connect(impactGain);
    impactGain.connect(nodes.master);
    impactGain.gain.setValueAtTime(0.0001, t);
    impactGain.gain.exponentialRampToValueAtTime(0.14, t + 0.004);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    impact.start(t, 0.4, 0.24);
    impact.stop(t + 0.26);

    // servo whine as the gate lifts
    const servo = ctx.createOscillator();
    servo.type = 'sawtooth';
    servo.frequency.setValueAtTime(150, t + 0.08);
    servo.frequency.linearRampToValueAtTime(268, t + 0.42);
    servo.frequency.linearRampToValueAtTime(196, t + 1.05);
    const servoFilter = makeFilter('bandpass', 900, 3.2);
    const servoGain = makeGain(0);
    servo.connect(servoFilter);
    servoFilter.connect(servoGain);
    servoGain.connect(nodes.master);
    servoGain.gain.setValueAtTime(0.0001, t + 0.06);
    servoGain.gain.linearRampToValueAtTime(0.05, t + 0.16);
    servoGain.gain.linearRampToValueAtTime(0.03, t + 0.9);
    servoGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    servo.start(t + 0.06);
    servo.stop(t + 1.25);

    // water surging under the lifted gate
    const surge = ctx.createBufferSource();
    surge.buffer = noiseBuffers.pink;
    surge.loop = false;
    const surgeFilter = makeFilter('lowpass', 1100, 0.8);
    const surgeGain = makeGain(0);
    surge.connect(surgeFilter);
    surgeFilter.connect(surgeGain);
    surgeGain.connect(nodes.master);
    surgeGain.gain.setValueAtTime(0.0001, t + 0.1);
    surgeGain.gain.linearRampToValueAtTime(0.07, t + 0.35);
    surgeGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    surge.start(t + 0.1, 0.8, 1.7);
    surge.stop(t + 1.8);
    return true;
  }

  /* ---- introspection ---------------------------------------------------- */

  function getState() {
    return {
      version: HYDRO_AUDIO_VERSION,
      initialized: state.initialized,
      contextState: ctx ? ctx.state || state.contextState : 'none',
      initError: state.initError || null,
      sampleRate: ctx ? ctx.sampleRate : 0,
      muted: state.muted,
      volume: state.volume,
      masterLevel: +state.masterLevel.toFixed(4),
      progress: +state.progress.toFixed(4),
      flowM3s: Math.round(state.flowM3s),
      outputMw: Math.round(state.outputMw),
      spillwayOpen: +state.spillwayOpen.toFixed(3),
      layers: {
        reservoir: +state.layers.reservoir.toFixed(3),
        spillway: +state.layers.spillway.toFixed(3),
        penstock: +state.layers.penstock.toFixed(3),
        turbine: +state.layers.turbine.toFixed(3),
        transformer: +state.layers.transformer.toFixed(3),
      },
      triggers: { ...state.triggers },
      nodes: nodes
        ? {
            reservoir: Object.keys(nodes.reservoir).length,
            spillway: Object.keys(nodes.spillway).length,
            penstock: Object.keys(nodes.penstock).length,
            turbine: Object.keys(nodes.turbine).length,
            transformer: Object.keys(nodes.transformer).length,
          }
        : null,
      uptime: ctx && state.initialized ? +(now() - startedAt).toFixed(2) : 0,
    };
  }

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;
    state.initialized = false;
    if (!nodes || !ctx) {
      nodes = null;
      ctx = null;
      return;
    }
    const stop = (node) => {
      if (!node) return;
      try {
        if (typeof node.stop === 'function') node.stop();
      } catch (error) {
        /* already stopped */
      }
      try {
        if (typeof node.disconnect === 'function') node.disconnect();
      } catch (error) {
        /* already disconnected */
      }
    };
    stop(nodes.reservoir.source);
    stop(nodes.reservoir.lapSource);
    stop(nodes.reservoir.lapLfo);
    stop(nodes.spillway.subSource);
    stop(nodes.spillway.roarSource);
    stop(nodes.spillway.hissSource);
    stop(nodes.penstock.source);
    stop(nodes.turbine.rushSource);
    stop(nodes.turbine.rumble);
    stop(nodes.turbine.rumbleLfo);
    for (const hum of nodes.turbine.hums) stop(hum.osc);
    for (const osc of nodes.transformer.oscillators) stop(osc.osc);
    stop(nodes.transformer.hum);
    stop(nodes.transformer.lfo);
    for (const key of Object.keys(nodes)) {
      const node = nodes[key];
      if (node && typeof node.disconnect === 'function') {
        try {
          node.disconnect();
        } catch (error) {
          /* ignore */
        }
      }
    }
    nodes = null;
    if (state.ownContext && ctx && typeof ctx.close === 'function') {
      try {
        ctx.close();
      } catch (error) {
        /* ignore */
      }
    }
    ctx = null;
  }

  return {
    init,
    resume,
    setMuted,
    isMuted,
    setVolume,
    update,
    playGateChime,
    playClick,
    getState,
    dispose,
    getVolume: () => state.volume,
    getStationWeights: (progress) => stationWeights(progress),
    getLayers: () => ({ ...state.layers }),
    version: HYDRO_AUDIO_VERSION,
  };
}

export default createHydroAudio;
