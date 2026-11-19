/**
 * aiOpsAudio.js
 * ============================================================================
 * The procedural soundscape of the AI/ML & DevOps campus, synthesised live with
 * the Web Audio API. No audio files, no samples, no network requests: every
 * layer is noise, oscillators and filters generated in the browser.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   import { createAiOpsAudio } from './audio/aiOpsAudio.js';
 *
 *   const audio = createAiOpsAudio({ volume: 0.8 });
 *   audio.init();                       // after a user gesture
 *   audio.resume();                     // after a tab switch / iOS unlock
 *   audio.setMuted(true);  audio.isMuted();
 *   audio.setVolume(0.7);               // 0..1
 *   audio.update(progress, gpuUtilPct, canaryActive);
 *   audio.playForwardPassChime();       // activation wave through the core
 *   audio.playCanaryChime();            // v1 → v2 traffic shift
 *   audio.playClick();                  // UI feedback
 *   audio.getState();  audio.dispose();
 *
 * `update` is designed to run once per animation frame alongside the 3D world.
 * It is cheap: targets are smoothed on the audio clock and parameter writes are
 * throttled to `updateIntervalMs` (default 60 ms). Tick scheduling runs on the
 * audio clock and stays sample-accurate.
 *
 * ----------------------------------------------------------------------------
 * LAYERS
 * ----------------------------------------------------------------------------
 * 1. DATA-CENTRE AIR & FAN BED
 *    Pink noise through a low-pass that opens from 330 Hz to 900 Hz, plus brown
 *    noise room tone. A turbine layer of 52/78 Hz oscillators and band-passed
 *    noise, amplitude-modulated at the blade rate, peaks in the GPU hall.
 *
 * 2. NEURAL TENSOR HARMONICS
 *    A slow, warm six-voice chord (D2 · A2 · D3 · F#3 · A3 · E4) with detuned
 *    pairs, a low-pass that breathes, and a long reverb send. It swells in the
 *    Transformer Core and returns, quieter and higher, at the Global Edge.
 *
 * 3. PACKET & MESH PULSES
 *    Short, band-passed noise ticks on a rhythmic grid whose density follows
 *    the cluster's throughput and GPU utilisation; occasional soft sine pings
 *    read as mesh heartbeats.
 *
 * 4. CLUSTER ELECTRICAL HUM
 *    100 Hz and 200 Hz components through a soft saturator and a resonant
 *    low-pass, present only around the liquid-cooled GPU cluster.
 *
 * 5. CANARY FABRIC
 *    A warm major-second drone that fades in when `canaryActive` is true, with
 *    a gentle stereo sway — the audible counterpart of the amber v2 arcs.
 *
 * 6. CONTROL SOUNDS
 *    `playForwardPassChime()` — a rising five-note bell with a noise whoosh;
 *    `playCanaryChime()` — a two-note amber signal; `playClick()` — a relay tick.
 *
 * ----------------------------------------------------------------------------
 * TESTING / HEADLESS
 * ----------------------------------------------------------------------------
 * `options.audioContext` accepts any AudioContext-shaped object, so an
 * OfflineAudioContext can drive the whole graph and the rendered buffer can be
 * measured. Without Web Audio and without an injected context, `init()` returns
 * false and every method stays inert.
 *
 * `getState().masterLevel` reports the RMS seen at the master analyser — a real
 * measurement of the produced signal, not a modelled value.
 */

export const AI_OPS_AUDIO_VERSION = '1.1.0';

const DEFAULTS = {
  volume: 0.8,
  muted: false,
  audioContext: null,
  seed: 20261119,
  updateIntervalMs: 60,
  reverb: true,
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const finite = (v, fallback) => (Number.isFinite(v) ? v : fallback);

function smoothstep(a, b, x) {
  const t = clamp01((x - a) / Math.max(1e-6, b - a));
  return t * t * (3 - 2 * t);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fillPink(data, random) {
  // Paul Kellet's refined pink-noise filter, normalised to ~0.11 RMS
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

/* ========================================================================== *
 *  Station weights — smooth crossfades across the six stations
 * ========================================================================== */

const STATIONS = [
  { id: 'ingest', start: 0.0, end: 0.18 },
  { id: 'core', start: 0.18, end: 0.36 },
  { id: 'gpu', start: 0.36, end: 0.56 },
  { id: 'cicd', start: 0.56, end: 0.74 },
  { id: 'mesh', start: 0.74, end: 0.9 },
  { id: 'edge', start: 0.9, end: 1.0 },
];

function stationWeights(progress) {
  const p = clamp01(progress);
  const weights = {};
  for (const station of STATIONS) {
    const centre = (station.start + station.end) / 2;
    const half = (station.end - station.start) / 2;
    // a triangular window with soft shoulders, overlapping neighbours
    const d = Math.abs(p - centre) / Math.max(1e-4, half);
    weights[station.id] = clamp01(1.15 - d * 1.05);
  }
  const sum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  for (const key of Object.keys(weights)) weights[key] /= sum;
  return weights;
}

/* ========================================================================== *
 *  Factory
 * ========================================================================== */

export function createAiOpsAudio(options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const random = mulberry32(settings.seed >>> 0);

  let context = settings.audioContext || null;
  let ownsContext = false;
  let initialized = false;
  let muted = !!settings.muted;
  let volume = clamp(finite(settings.volume, 0.8), 0, 1);

  const state = {
    progress: 0,
    gpuUtilPct: 0,
    canaryActive: false,
    canaryMix: 0,
    station: 'ingest',
    lastUpdate: -1e9,
    nextTick: 0,
    tickIndex: 0,
    masterLevel: 0,
  };

  let graph = null;
  let disposed = false;
  let initError = null;

  /* ---- helpers ---------------------------------------------------------- */

  const now = () => (context ? context.currentTime : 0);

  function makeNoiseBuffer(kind, seconds = 2.4, rate = 44100) {
    const length = Math.max(1, Math.floor(seconds * rate));
    const buffer = context.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    if (kind === 'pink') fillPink(data, random);
    else if (kind === 'brown') fillBrown(data, random);
    else fillWhite(data, random);
    return buffer;
  }

  function makeNoiseSource(kind, bufferSet) {
    const source = context.createBufferSource();
    source.buffer = (bufferSet || (graph && graph.buffers) || {})[kind];
    source.loop = true;
    return source;
  }

  function makeGain(value) {
    const gain = context.createGain();
    gain.gain.value = value;
    return gain;
  }

  function makeFilter(type, frequency, q = 1) {
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
  }

  function makeLfo(frequency, depth, target) {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.value = depth;
    osc.connect(gain);
    gain.connect(target);
    osc.start();
    return osc;
  }

  function makeImpulse(seconds = 2.2, decay = 2.6) {
    const rate = context.sampleRate;
    const length = Math.max(1, Math.floor(rate * seconds));
    const impulse = context.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        data[i] = (random() * 2 - 1) * Math.pow(1 - t, decay) * 0.6;
      }
    }
    return impulse;
  }

  function softClipCurve(amount = 1.8) {
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i += 1) {
      const x = (i / (samples - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
    }
    return curve;
  }

  function connect(node, destination) {
    if (node && destination) node.connect(destination);
    return node;
  }

  /* ---- graph ------------------------------------------------------------ */

  function buildGraph() {
    const buffers = {
      pink: makeNoiseBuffer('pink', 3.0),
      brown: makeNoiseBuffer('brown', 4.0),
      white: makeNoiseBuffer('white', 1.6),
    };

    const master = makeGain(0);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 24;
    compressor.ratio.value = 3.6;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.26;

    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;

    connect(master, compressor);
    connect(compressor, analyser);
    connect(analyser, context.destination);

    // shared space
    const reverb = makeGain(1);
    const convolver = context.createConvolver();
    try {
      convolver.buffer = makeImpulse(2.4, 2.4);
    } catch (error) {
      // an injected offline context without createConvolver support
    }
    const reverbReturn = makeGain(0);
    connect(reverb, convolver);
    connect(convolver, reverbReturn);
    connect(reverbReturn, master);
    reverbReturn.gain.value = settings.reverb ? 0.5 : 0;

    /* -- 1. air bed ------------------------------------------------------ */
    const air = makeNoiseSource('pink', buffers);
    const airFilter = makeFilter('lowpass', 380, 0.6);
    const airGain = makeGain(0.06);
    connect(air, airFilter);
    connect(airFilter, airGain);
    connect(airGain, master);
    air.start();

    const room = makeNoiseSource('brown', buffers);
    const roomFilter = makeFilter('lowpass', 160, 0.7);
    const roomGain = makeGain(0.05);
    connect(room, roomFilter);
    connect(roomFilter, roomGain);
    connect(roomGain, master);
    room.start();

    const airLfo = makeLfo(0.07, 55, airFilter.frequency);
    const airGainLfo = makeLfo(0.11, 0.012, airGain.gain);

    /* -- 2. fan turbine -------------------------------------------------- */
    const fanBus = makeGain(0.0);
    connect(fanBus, master);

    const fanOscA = context.createOscillator();
    fanOscA.type = 'sawtooth';
    fanOscA.frequency.value = 52;
    const fanOscB = context.createOscillator();
    fanOscB.type = 'triangle';
    fanOscB.frequency.value = 78.2;
    const fanFilter = makeFilter('lowpass', 260, 1.4);
    const fanGain = makeGain(0.5);
    connect(fanOscA, fanFilter);
    connect(fanOscB, fanFilter);
    connect(fanFilter, fanGain);
    connect(fanGain, fanBus);
    fanOscA.start();
    fanOscB.start();

    const bladeNoise = makeNoiseSource('white', buffers);
    const bladeFilter = makeFilter('bandpass', 420, 2.2);
    const bladeGain = makeGain(0.18);
    connect(bladeNoise, bladeFilter);
    connect(bladeFilter, bladeGain);
    connect(bladeGain, fanBus);
    bladeNoise.start();
    // blade passing frequency amplitude modulation
    const bladeLfo = context.createOscillator();
    bladeLfo.type = 'sine';
    bladeLfo.frequency.value = 7.4;
    const bladeDepth = makeGain(0.1);
    connect(bladeLfo, bladeDepth);
    connect(bladeDepth, bladeGain.gain);
    bladeLfo.start();

    /* -- 3. neural harmonics --------------------------------------------- */
    const padBus = makeGain(0.0);
    const padFilter = makeFilter('lowpass', 900, 0.8);
    connect(padBus, master);
    connect(padBus, reverb);

    const chord = [73.42, 110.0, 146.83, 185.0, 220.0, 293.66];
    const padVoices = [];
    chord.forEach((frequency, index) => {
      const voice = context.createGain();
      voice.gain.value = 0.11 / (1 + index * 0.22);
      const pan = context.createStereoPanner ? context.createStereoPanner() : null;
      if (pan) pan.pan.value = (index / (chord.length - 1)) * 1.1 - 0.55;
      connect(voice, pan || padBus);
      if (pan) connect(pan, padFilter);

      // two detuned oscillators per voice
      for (const detune of [-5.5, 5.5]) {
        const osc = context.createOscillator();
        osc.type = index < 3 ? 'sine' : 'triangle';
        osc.frequency.value = frequency;
        osc.detune.value = detune;
        connect(osc, voice);
        osc.start();
        padVoices.push(osc);
      }
      // slow shimmer
      const lfo = context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.045 + index * 0.013;
      const lfoGain = makeGain(0.16);
      connect(lfo, lfoGain);
      connect(lfoGain, voice.gain);
      lfo.start();
    });
    // the filter output is summed into the pad bus, which feeds master + reverb
    connect(padFilter, padBus);

    const padBreath = makeLfo(0.06, 260, padFilter.frequency);

    /* -- 4. electrical hum ----------------------------------------------- */
    const humBus = makeGain(0);
    const humShaper = context.createWaveShaper();
    humShaper.curve = softClipCurve(1.7);
    const humFilter = makeFilter('lowpass', 420, 3.2);
    connect(humShaper, humFilter);
    connect(humFilter, humBus);
    connect(humBus, master);

    const hum100 = context.createOscillator();
    hum100.type = 'sawtooth';
    hum100.frequency.value = 100;
    const hum200 = context.createOscillator();
    hum200.type = 'sine';
    hum200.frequency.value = 200;
    const humGain100 = makeGain(0.22);
    const humGain200 = makeGain(0.12);
    connect(hum100, humGain100);
    connect(hum200, humGain200);
    connect(humGain100, humShaper);
    connect(humGain200, humShaper);
    hum100.start();
    hum200.start();

    /* -- 5. edge shimmer ------------------------------------------------- */
    const shimmerBus = makeGain(0);
    connect(shimmerBus, reverb);
    connect(shimmerBus, master);
    const shimmerFreqs = [1174.66, 1760, 2349.32, 3136];
    const shimmerVoices = shimmerFreqs.map((frequency, index) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      const gain = makeGain(0.0);
      connect(osc, gain);
      connect(gain, shimmerBus);
      osc.start();
      const lfo = context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08 + index * 0.031;
      const depth = makeGain(0.008);
      connect(lfo, depth);
      connect(depth, gain.gain);
      lfo.start();
      return { osc, gain, base: 0.02 / (1 + index * 0.5) };
    });

    /* -- 6. canary fabric ------------------------------------------------ */
    const canaryBus = makeGain(0);
    connect(canaryBus, master);
    connect(canaryBus, reverb);
    const canaryVoices = [174.61, 261.63, 349.23].map((frequency, index) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      const gain = makeGain(0.0);
      const pan = context.createStereoPanner ? context.createStereoPanner() : null;
      if (pan) {
        pan.pan.value = -0.4 + index * 0.4;
        connect(osc, gain);
        connect(gain, pan);
        connect(pan, canaryBus);
      } else {
        connect(osc, gain);
        connect(gain, canaryBus);
      }
      osc.start();
      const lfo = context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.5 + index * 0.17;
      const depth = makeGain(0.12);
      connect(lfo, depth);
      connect(depth, gain.gain);
      lfo.start();
      return { osc, gain };
    });

    /* -- tick bus -------------------------------------------------------- */
    const tickBus = makeGain(1);
    connect(tickBus, master);
    connect(tickBus, reverb);

    graph = {
      buffers,
      master,
      compressor,
      analyser,
      reverb,
      reverbReturn,
      air,
      airFilter,
      airGain,
      airLfo,
      airGainLfo,
      room,
      roomGain,
      fanBus,
      fanOscA,
      fanOscB,
      fanGain,
      bladeGain,
      padBus,
      padFilter,
      padVoices,
      padBreath,
      humBus,
      humGain100,
      humGain200,
      shimmerBus,
      shimmerVoices,
      canaryBus,
      canaryVoices,
      tickBus,
      levels: {
        air: 0.06,
        room: 0.05,
        fan: 0,
        pad: 0,
        hum: 0,
        shimmer: 0,
        canary: 0,
      },
    };

    // fade the master in gently so the first frame never clicks
    const t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(muted ? 0 : volume, t + 1.2);
  }

  /* ---- lifecycle -------------------------------------------------------- */

  function init() {
    if (disposed) return false;
    if (initialized) return true;
    if (!context) {
      const Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!Ctor) return false;
      try {
        context = new Ctor({ latencyHint: 'interactive' });
        ownsContext = true;
      } catch (error) {
        return false;
      }
    }
    if (!context || typeof context.createGain !== 'function') return false;
    try {
      buildGraph();
    } catch (error) {
      graph = null;
      initError = error && error.message ? error.message : String(error);
      return false;
    }
    initialized = true;
    return true;
  }

  function resume() {
    if (!context) return Promise.resolve(false);
    if (context.state === 'suspended' && typeof context.resume === 'function') {
      return Promise.resolve(context.resume()).then(() => true).catch(() => false);
    }
    return Promise.resolve(true);
  }

  function setMuted(next) {
    muted = !!next;
    if (graph && context) {
      const t = now();
      graph.master.gain.cancelScheduledValues(t);
      graph.master.gain.setTargetAtTime(muted ? 0 : volume, t, 0.12);
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function setVolume(next) {
    volume = clamp(finite(next, volume), 0, 1);
    if (graph && context && !muted) {
      const t = now();
      graph.master.gain.cancelScheduledValues(t);
      graph.master.gain.setTargetAtTime(volume, t, 0.12);
    }
    return volume;
  }

  /* ---- levels ----------------------------------------------------------- */

  function computeLevels(progress, gpuUtilPct) {
    const p = clamp01(progress);
    const weights = stationWeights(p);
    const gpu = clamp01((finite(gpuUtilPct, 50) - 20) / 80);
    const nearestEdge = weights.edge;
    const nearestCore = weights.core;
    const nearestGpu = weights.gpu;

    return {
      weights,
      air: 0.05 + 0.025 * (1 - nearestGpu * 0.6) + 0.01 * Math.sin(p * 9),
      room: 0.045 + 0.02 * (1 - p),
      fan: 0.015 + 0.11 * nearestGpu + 0.035 * weights.ingest + 0.02 * gpu,
      pad: 0.035 + 0.10 * nearestCore + 0.07 * nearestEdge + 0.02 * weights.mesh,
      hum: 0.008 + 0.05 * nearestGpu + 0.012 * weights.cicd,
      shimmer: 0.004 + 0.045 * nearestEdge,
      canary: state.canaryMix * 0.05,
    };
  }

  function applyLevels(levels, immediate = false) {
    if (!graph || !context) return;
    const t = now();
    const timeConstant = immediate ? 0.02 : 0.35;
    const set = (param, value) => {
      if (!param) return;
      param.setTargetAtTime(value, t, timeConstant);
    };
    set(graph.airGain.gain, levels.air);
    set(graph.roomGain.gain, levels.room);
    set(graph.fanBus.gain, levels.fan);
    set(graph.padBus.gain, levels.pad);
    set(graph.humBus.gain, levels.hum);
    set(graph.shimmerBus.gain, levels.shimmer);
    set(graph.canaryBus.gain, levels.canary);

    // the tensor pad brightens as the camera nears the core
    set(graph.padFilter.frequency, 620 + 900 * levels.weights.core + 380 * levels.weights.edge);
    // the air bed opens in the GPU hall
    set(graph.airFilter.frequency, 330 + 480 * levels.weights.gpu);
    // blade pitch rises with utilisation
    const util = clamp01((finite(state.gpuUtilPct, 50) - 20) / 80);
    if (graph.fanGain && graph.fanGain.gain) set(graph.fanGain.gain, 0.4 + util * 0.25);

    // shimmer voices breathe independently
    graph.shimmerVoices.forEach((voice, index) => {
      set(voice.gain.gain, voice.base * (0.6 + 0.4 * Math.sin(t * 0.2 + index)));
    });

    state.levels = levels;
  }

  /* ---- ticks ------------------------------------------------------------ */

  function scheduleTick(when, accent) {
    if (!graph || !context) return;
    const source = context.createBufferSource();
    source.buffer = graph.buffers.white;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = accent ? 3200 + random() * 1800 : 1500 + random() * 1400;
    filter.Q.value = accent ? 7 : 4.5;
    const gain = context.createGain();
    const peak = accent ? 0.05 : 0.028;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + (accent ? 0.09 : 0.055));
    connect(source, filter);
    connect(filter, gain);
    connect(gain, graph.tickBus);
    source.start(when, random() * 1.0, accent ? 0.1 : 0.07);
    source.stop(when + 0.14);
    source.onended = () => {
      try {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (error) {
        /* already gone */
      }
    };
  }

  function scheduleTicks(ratePerSecond, accentChance) {
    if (!context) return;
    const t = now();
    const interval = 1 / Math.max(0.4, ratePerSecond);
    if (state.nextTick < t) state.nextTick = t + 0.05;
    let guard = 0;
    while (state.nextTick < t + 0.2 && guard < 12) {
      const accent = random() < accentChance;
      scheduleTick(state.nextTick, accent);
      state.nextTick += interval * (0.7 + random() * 0.6);
      guard += 1;
    }
  }

  /* ---- control sounds --------------------------------------------------- */

  function playBell(frequency, when, duration = 1.1, level = 0.09, pan = 0) {
    if (!graph || !context) return;
    const carrier = context.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = frequency;
    const modulator = context.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = frequency * 2.01;
    const modGain = context.createGain();
    modGain.gain.value = frequency * 0.9;
    connect(modulator, modGain);
    connect(modGain, carrier.frequency);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    let output = gain;
    if (context.createStereoPanner) {
      const panner = context.createStereoPanner();
      panner.pan.value = pan;
      connect(gain, panner);
      output = panner;
    }
    connect(carrier, gain);
    connect(output, graph.master);
    connect(output, graph.reverb);

    carrier.start(when);
    modulator.start(when);
    carrier.stop(when + duration + 0.05);
    modulator.stop(when + duration + 0.05);
  }

  function playForwardPassChime() {
    if (!graph || !context) return false;
    const t = now() + 0.02;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((frequency, index) => {
      playBell(frequency, t + index * 0.085, 1.15 - index * 0.08, 0.085, -0.3 + index * 0.15);
    });

    // a filtered noise whoosh travelling inward
    const whoosh = context.createBufferSource();
    whoosh.buffer = graph.buffers.white;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.8;
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(240, t + 0.9);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    connect(whoosh, filter);
    connect(filter, gain);
    connect(gain, graph.master);
    whoosh.start(t, 0.2, 1.1);
    whoosh.stop(t + 1.1);
    return true;
  }

  function playCanaryChime() {
    if (!graph || !context) return false;
    const t = now() + 0.02;
    playBell(392.0, t, 0.7, 0.07, -0.15);
    playBell(523.25, t + 0.16, 0.9, 0.065, 0.15);
    playBell(659.25, t + 0.32, 0.8, 0.04, 0.25);
    return true;
  }

  function playClick() {
    if (!graph || !context) return false;
    const t = now() + 0.005;
    const source = context.createBufferSource();
    source.buffer = graph.buffers.white;
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    connect(source, filter);
    connect(filter, gain);
    connect(gain, graph.master);
    source.start(t, random() * 0.5, 0.05);
    source.stop(t + 0.06);
    return true;
  }

  /* ---- update ------------------------------------------------------------ */

  function updateMasterLevel() {
    if (!graph || !graph.analyser) return 0;
    const data = new Float32Array(graph.analyser.fftSize);
    graph.analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
    state.masterLevel = Math.sqrt(sum / data.length);
    return state.masterLevel;
  }

  function update(progress = 0, gpuUtilPct = 50, canaryActive = false) {
    if (disposed) return false;
    const p = clamp01(finite(progress, state.progress));
    state.progress = p;
    state.gpuUtilPct = clamp(finite(gpuUtilPct, 50), 0, 100);
    state.canaryActive = !!canaryActive;

    const weights = stationWeights(p);
    const dominant = Object.entries(weights).sort((a, b) => b[1] - a[1])[0];
    state.station = dominant ? dominant[0] : 'ingest';

    if (!graph || !context || !initialized) return false;

    // canary fabric fades in and out over ~1.2 s
    const target = state.canaryActive ? 1 : 0;
    state.canaryMix += clamp(target - state.canaryMix, -0.02, 0.02);

    const t = now();
    if (t - state.lastUpdate < settings.updateIntervalMs / 1000) {
      return false;
    }
    state.lastUpdate = t;

    const levels = computeLevels(p, state.gpuUtilPct);
    applyLevels(levels);

    // tick density follows throughput and utilisation
    const throughput = 0.25 + 0.75 * smoothstep(0.0, 0.35, p) * (0.7 + 0.3 * smoothstep(30, 95, state.gpuUtilPct));
    const rate = 1.4 + throughput * 11 + (state.canaryActive ? 2.2 : 0);
    scheduleTicks(rate, 0.18 + 0.2 * accentWeight(weights));

    updateMasterLevel();
    return true;
  }

  function accentWeight(weights) {
    // accent probability is higher around the mesh and core stations
    return clamp01(weights.mesh * 0.8 + weights.core * 0.5);
  }

  /* ---- state / dispose --------------------------------------------------- */

  function getState() {
    return {
      version: AI_OPS_AUDIO_VERSION,
      error: initError,
      initialized,
      contextState: context ? context.state : 'none',
      muted,
      volume,
      masterLevel: Math.round(state.masterLevel * 10000) / 10000,
      progress: Math.round(state.progress * 1000) / 1000,
      station: state.station,
      gpuUtilPct: state.gpuUtilPct,
      canaryActive: state.canaryActive,
      canaryMix: Math.round(state.canaryMix * 1000) / 1000,
      layers: graph
        ? {
            air: Math.round(graph.airGain.gain.value * 10000) / 10000,
            room: Math.round(graph.roomGain.gain.value * 10000) / 10000,
            fan: Math.round(graph.fanBus.gain.value * 10000) / 10000,
            pad: Math.round(graph.padBus.gain.value * 10000) / 10000,
            hum: Math.round(graph.humBus.gain.value * 10000) / 10000,
            shimmer: Math.round(graph.shimmerBus.gain.value * 10000) / 10000,
            canary: Math.round(graph.canaryBus.gain.value * 10000) / 10000,
          }
        : null,
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (graph && context) {
      try {
        graph.master.gain.cancelScheduledValues(now());
        graph.master.gain.setTargetAtTime(0, now(), 0.05);
      } catch (error) {
        /* ignore */
      }
      const nodes = [
        graph.air,
        graph.room,
        graph.fanOscA,
        graph.fanOscB,
        graph.hum100,
        graph.hum200,
        graph.bladeGain,
        ...(graph.padVoices || []),
        ...(graph.shimmerVoices || []).map((v) => v.osc),
        ...(graph.canaryVoices || []).map((v) => v.osc),
      ];
      for (const node of nodes) {
        try {
          if (node && typeof node.stop === 'function') node.stop();
        } catch (error) {
          /* already stopped */
        }
      }
      try {
        if (context && typeof context.close === 'function' && ownsContext) context.close();
      } catch (error) {
        /* ignore */
      }
    }
    graph = null;
    initialized = false;
  }

  return {
    init,
    resume,
    setMuted,
    isMuted,
    setVolume,
    update,
    playForwardPassChime,
    playCanaryChime,
    playClick,
    getState,
    dispose,
    get context() {
      return context;
    },
    get graph() {
      return graph;
    },
  };
}
