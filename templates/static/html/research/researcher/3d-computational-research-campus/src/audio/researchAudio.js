/**
 * researchAudio.js
 * ============================================================================
 * The procedural soundscape of the research campus, synthesised live with the
 * Web Audio API. No audio files, no samples, no network requests: every layer
 * is noise, oscillators and filters generated in the browser.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   import { createResearchAudio } from './audio/researchAudio.js';
 *
 *   const audio = createResearchAudio({ volume: 0.8 });
 *   audio.init();                       // after a user gesture
 *   audio.resume();                     // after a tab switch / iOS unlock
 *   audio.setMuted(true);  audio.isMuted();
 *   audio.setVolume(0.7);               // 0..1
 *   audio.update(progress, temperatureMk, laserLockPct, experimentActive, aligned);
 *   audio.playExperimentChime();        // the lab runs a pulse
 *   audio.playLaserChime();             // beam folded through the mirror train
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
 * 1. LAB AIR & VENTILATION
 *    Pink noise through a low-pass that opens from 300 Hz to 820 Hz, plus brown
 *    noise room tone. A slow breathing LFO keeps it from sounding like a loop.
 *
 * 2. PULSE-TUBE COMPRESSOR
 *    A cold-head compressor at 48/96 Hz with a 3.2 Hz amplitude modulation —
 *    the rhythm you hear standing beside the dilution refrigerator.
 *
 * 3. CENTRIFUGE & SHAKER
 *    A 19 Hz motor with bearing noise, amplitude-modulated at the rotor rate and
 *    a slow orbital wobble; present only around the wet lab.
 *
 * 4. HARMONIC STATION PAD
 *    A warm six-voice chord (D3 · A3 · D4 · F#4 · A4 · E5) with detuned pairs, a
 *    filter that opens in the atrium and observatory, and a long reverb send.
 *
 * 5. LASER SHIMMER
 *    High sine partials (1760 / 2349 / 3136 Hz) plus band-passed noise that
 *    swells in the optics bay and brightens further when the beam is locked.
 *
 * 6. COMPUTE HUM
 *    A 120/240 Hz electrical bed through a soft saturator, present around the
 *    blade cluster and the atlas.
 *
 * 7. DUSK AIR
 *    A low, warm drone (87.3 / 130.8 Hz) for the archive terrace after dark.
 *
 * 8. CONTROL SOUNDS
 *    `playExperimentChime()` — a rising five-note bell with a noise sweep;
 *    `playLaserChime()` — a two-note glass signal; `playClick()` — a relay tick.
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

export const RESEARCH_AUDIO_VERSION = '1.0.0';

const DEFAULTS = {
  volume: 0.8,
  muted: false,
  audioContext: null,
  seed: 20261120,
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
  { id: 'atrium', start: 0.0, end: 0.17 },
  { id: 'optics', start: 0.17, end: 0.36 },
  { id: 'wetlab', start: 0.36, end: 0.56 },
  { id: 'compute', start: 0.56, end: 0.76 },
  { id: 'observatory', start: 0.76, end: 0.9 },
  { id: 'archive', start: 0.9, end: 1.0 },
];

function stationWeights(progress) {
  const p = clamp01(progress);
  const weights = {};
  for (const station of STATIONS) {
    const centre = (station.start + station.end) / 2;
    const half = (station.end - station.start) / 2;
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

export function createResearchAudio(options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const random = mulberry32(settings.seed >>> 0);

  let context = settings.audioContext || null;
  let ownsContext = false;
  let initialized = false;
  let muted = !!settings.muted;
  let volume = clamp(finite(settings.volume, 0.8), 0, 1);

  const state = {
    progress: 0,
    temperatureMk: 12.4,
    laserLockPct: 96,
    experimentActive: false,
    aligned: false,
    station: 'atrium',
    lastUpdate: -1e9,
    nextTick: 0,
    masterLevel: 0,
  };

  let graph = null;
  let disposed = false;
  let initError = null;

  const now = () => (context ? context.currentTime : 0);

  /* ---- helpers ---------------------------------------------------------- */

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

  function makeImpulse(seconds = 2.4, decay = 2.4) {
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
    compressor.threshold.value = -24;
    compressor.knee.value = 26;
    compressor.ratio.value = 3.2;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.3;

    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;

    connect(master, compressor);
    connect(compressor, analyser);
    connect(analyser, context.destination);

    /* -- shared space --------------------------------------------------- */
    const reverb = makeGain(1);
    const convolver = context.createConvolver();
    try {
      convolver.buffer = makeImpulse(2.8, 2.2);
    } catch (error) {
      /* an injected offline context without createConvolver support */
    }
    const reverbReturn = makeGain(0);
    connect(reverb, convolver);
    connect(convolver, reverbReturn);
    connect(reverbReturn, master);
    reverbReturn.gain.value = settings.reverb ? 0.42 : 0;

    /* -- 1. lab air ------------------------------------------------------ */
    const air = makeNoiseSource('pink', buffers);
    const airFilter = makeFilter('lowpass', 340, 0.6);
    const airGain = makeGain(0.055);
    connect(air, airFilter);
    connect(airFilter, airGain);
    connect(airGain, master);
    air.start();

    const room = makeNoiseSource('brown', buffers);
    const roomFilter = makeFilter('lowpass', 150, 0.7);
    const roomGain = makeGain(0.05);
    connect(room, roomFilter);
    connect(roomFilter, roomGain);
    connect(roomGain, master);
    room.start();

    const airLfo = makeLfo(0.06, 45, airFilter.frequency);
    const airGainLfo = makeLfo(0.09, 0.010, airGain.gain);

    /* -- 2. pulse-tube compressor --------------------------------------- */
    const cryoBus = makeGain(0);
    connect(cryoBus, master);
    const cryoA = context.createOscillator();
    cryoA.type = 'triangle';
    cryoA.frequency.value = 48;
    const cryoB = context.createOscillator();
    cryoB.type = 'sine';
    cryoB.frequency.value = 96.4;
    const cryoFilter = makeFilter('lowpass', 220, 1.8);
    const cryoGain = makeGain(0.34);
    connect(cryoA, cryoFilter);
    connect(cryoB, cryoFilter);
    connect(cryoFilter, cryoGain);
    connect(cryoGain, cryoBus);
    cryoA.start();
    cryoB.start();
    const cryoPulse = context.createOscillator();
    cryoPulse.type = 'sine';
    cryoPulse.frequency.value = 3.2;
    const cryoPulseGain = makeGain(0.14);
    connect(cryoPulse, cryoPulseGain);
    connect(cryoPulseGain, cryoGain.gain);
    cryoPulse.start();

    /* -- 3. centrifuge --------------------------------------------------- */
    const centrifugeBus = makeGain(0);
    connect(centrifugeBus, master);
    const motor = context.createOscillator();
    motor.type = 'sawtooth';
    motor.frequency.value = 19;
    const motorFilter = makeFilter('lowpass', 260, 2.2);
    const motorGain = makeGain(0.22);
    connect(motor, motorFilter);
    connect(motorFilter, motorGain);
    connect(motorGain, centrifugeBus);
    motor.start();
    const bearing = makeNoiseSource('white', buffers);
    const bearingFilter = makeFilter('bandpass', 620, 3.0);
    const bearingGain = makeGain(0.10);
    connect(bearing, bearingFilter);
    connect(bearingFilter, bearingGain);
    connect(bearingGain, centrifugeBus);
    bearing.start();
    const rotorLfo = context.createOscillator();
    rotorLfo.type = 'sine';
    rotorLfo.frequency.value = 6.4;
    const rotorDepth = makeGain(0.06);
    connect(rotorLfo, rotorDepth);
    connect(rotorDepth, bearingGain.gain);
    rotorLfo.start();

    /* -- 4. harmonic station pad ---------------------------------------- */
    const padBus = makeGain(0);
    const padFilter = makeFilter('lowpass', 760, 0.8);
    connect(padBus, master);
    connect(padBus, reverb);
    const chord = [146.83, 220.0, 293.66, 369.99, 440.0, 659.26];
    const padVoices = [];
    chord.forEach((frequency, index) => {
      const voice = context.createGain();
      voice.gain.value = 0.1 / (1 + index * 0.2);
      const pan = context.createStereoPanner ? context.createStereoPanner() : null;
      if (pan) pan.pan.value = (index / (chord.length - 1)) * 1.1 - 0.55;
      connect(voice, pan || padBus);
      if (pan) connect(pan, padFilter);
      for (const detune of [-4.5, 4.5]) {
        const osc = context.createOscillator();
        osc.type = index < 3 ? 'sine' : 'triangle';
        osc.frequency.value = frequency;
        osc.detune.value = detune;
        connect(osc, voice);
        osc.start();
        padVoices.push(osc);
      }
      const lfo = context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.04 + index * 0.011;
      const lfoGain = makeGain(0.14);
      connect(lfo, lfoGain);
      connect(lfoGain, voice.gain);
      lfo.start();
    });
    connect(padFilter, padBus);
    const padBreath = makeLfo(0.055, 220, padFilter.frequency);

    /* -- 5. laser shimmer ------------------------------------------------ */
    const shimmerBus = makeGain(0);
    connect(shimmerBus, reverb);
    connect(shimmerBus, master);
    const shimmerFreqs = [1760, 2349.32, 3136];
    const shimmerVoices = shimmerFreqs.map((frequency, index) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      const gain = makeGain(0.0);
      const pan = context.createStereoPanner ? context.createStereoPanner() : null;
      if (pan) pan.pan.value = -0.5 + index * 0.5;
      connect(osc, gain);
      connect(gain, pan || shimmerBus);
      if (pan) connect(pan, shimmerBus);
      osc.start();
      const lfo = context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07 + index * 0.027;
      const depth = makeGain(0.006);
      connect(lfo, depth);
      connect(depth, gain.gain);
      lfo.start();
      return { osc, gain, base: 0.02 / (1 + index * 0.45) };
    });
    const shimmerNoise = makeNoiseSource('white', buffers);
    const shimmerFilter = makeFilter('bandpass', 4200, 6.0);
    const shimmerNoiseGain = makeGain(0.0);
    connect(shimmerNoise, shimmerFilter);
    connect(shimmerFilter, shimmerNoiseGain);
    connect(shimmerNoiseGain, shimmerBus);
    shimmerNoise.start();

    /* -- 6. compute hum -------------------------------------------------- */
    const humBus = makeGain(0);
    const humShaper = context.createWaveShaper();
    humShaper.curve = softClipCurve(1.6);
    const humFilter = makeFilter('lowpass', 380, 3.0);
    connect(humShaper, humFilter);
    connect(humFilter, humBus);
    connect(humBus, master);
    const hum120 = context.createOscillator();
    hum120.type = 'sawtooth';
    hum120.frequency.value = 120;
    const hum240 = context.createOscillator();
    hum240.type = 'sine';
    hum240.frequency.value = 240;
    const humGain120 = makeGain(0.18);
    const humGain240 = makeGain(0.09);
    connect(hum120, humGain120);
    connect(hum240, humGain240);
    connect(humGain120, humShaper);
    connect(humGain240, humShaper);
    hum120.start();
    hum240.start();

    /* -- 7. dusk air ----------------------------------------------------- */
    const duskBus = makeGain(0);
    connect(duskBus, master);
    connect(duskBus, reverb);
    const duskVoices = [87.31, 130.81].map((frequency, index) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      const gain = makeGain(0.0);
      connect(osc, gain);
      connect(gain, duskBus);
      osc.start();
      const lfo = context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08 + index * 0.03;
      const depth = makeGain(0.1);
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
      room,
      roomGain,
      cryoBus,
      cryoGain,
      centrifugeBus,
      motorGain,
      bearingGain,
      padBus,
      padFilter,
      padVoices,
      shimmerBus,
      shimmerVoices,
      shimmerNoiseGain,
      humBus,
      hum120,
      hum240,
      duskBus,
      duskVoices,
      tickBus,
      levels: { air: 0.05, room: 0.05, cryo: 0, centrifuge: 0, pad: 0, shimmer: 0, hum: 0, dusk: 0 },
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

  function computeLevels(progress) {
    const p = clamp01(progress);
    const w = stationWeights(p);
    const locked = state.aligned ? 1 : 0;
    return {
      weights: w,
      air: 0.045 + 0.02 * (1 - w.compute * 0.5) + 0.008 * Math.sin(p * 9),
      room: 0.04 + 0.02 * (1 - p) + 0.015 * w.archive,
      cryo: 0.008 + 0.10 * w.optics,
      centrifuge: 0.006 + 0.055 * w.wetlab,
      pad: 0.03 + 0.09 * w.atrium + 0.075 * w.observatory + 0.045 * w.archive,
      shimmer: 0.003 + 0.05 * w.optics + 0.02 * locked * w.optics,
      hum: 0.006 + 0.06 * w.compute,
      dusk: 0.004 + 0.055 * w.archive,
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
    set(graph.cryoBus.gain, levels.cryo);
    set(graph.centrifugeBus.gain, levels.centrifuge);
    set(graph.padBus.gain, levels.pad);
    set(graph.shimmerBus.gain, levels.shimmer);
    set(graph.humBus.gain, levels.hum);
    set(graph.duskBus.gain, levels.dusk);

    // the pad opens in the atrium and again under the open dome
    set(graph.padFilter.frequency, 560 + 900 * levels.weights.atrium + 700 * levels.weights.observatory);
    // ventilation opens around the cluster and the wet lab
    set(graph.airFilter.frequency, 300 + 420 * levels.weights.compute + 180 * levels.weights.wetlab);
    // the centrifuge speeds up with the wet lab weight
    if (graph.bearingGain && graph.bearingGain.gain) {
      set(graph.bearingGain.gain, 0.06 + 0.06 * levels.weights.wetlab);
    }

    graph.shimmerVoices.forEach((voice, index) => {
      const base = voice.base * (state.aligned ? 1.6 : 1.0);
      set(voice.gain.gain, base * (0.6 + 0.4 * Math.sin(t * 0.2 + index)));
    });
  }

  /* ---- ticks ------------------------------------------------------------ */

  function scheduleTick(when, accent) {
    if (!graph || !context) return;
    const source = context.createBufferSource();
    source.buffer = graph.buffers.white;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = accent ? 3000 + random() * 1600 : 1400 + random() * 1200;
    filter.Q.value = accent ? 7 : 4.5;
    const gain = context.createGain();
    const peak = accent ? 0.045 : 0.024;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + (accent ? 0.09 : 0.05));
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
      scheduleTick(state.nextTick, random() < accentChance);
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

  function playExperimentChime() {
    if (!graph || !context) return false;
    const t = now() + 0.02;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((frequency, index) => {
      playBell(frequency, t + index * 0.08, 1.2 - index * 0.08, 0.08, -0.3 + index * 0.15);
    });

    // a filtered sweep: the sound of a laser pulse leaving the table
    const whoosh = context.createBufferSource();
    whoosh.buffer = graph.buffers.white;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.8;
    filter.frequency.setValueAtTime(5200, t);
    filter.frequency.exponentialRampToValueAtTime(380, t + 1.0);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    connect(whoosh, filter);
    connect(filter, gain);
    connect(gain, graph.master);
    whoosh.start(t, 0.2, 1.2);
    whoosh.stop(t + 1.2);
    return true;
  }

  function playLaserChime() {
    if (!graph || !context) return false;
    const t = now() + 0.02;
    playBell(880, t, 0.6, 0.06, -0.2);
    playBell(1318.5, t + 0.13, 0.9, 0.055, 0.2);
    playBell(1760, t + 0.26, 0.7, 0.03, 0.1);
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
    gain.gain.exponentialRampToValueAtTime(0.07, t + 0.003);
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

  function update(progress = 0, temperatureMk = 12.4, laserLockPct = 96, experimentActive = false, aligned = false) {
    if (disposed) return false;
    const p = clamp01(finite(progress, state.progress));
    state.progress = p;
    state.temperatureMk = clamp(finite(temperatureMk, 12.4), 4, 30);
    state.laserLockPct = clamp(finite(laserLockPct, 96), 0, 100);
    state.experimentActive = !!experimentActive;
    state.aligned = !!aligned;

    const weights = stationWeights(p);
    const dominant = Object.entries(weights).sort((a, b) => b[1] - a[1])[0];
    state.station = dominant ? dominant[0] : 'atrium';

    if (!graph || !context || !initialized) return false;

    const t = now();
    if (t - state.lastUpdate < settings.updateIntervalMs / 1000) return false;
    state.lastUpdate = t;

    const levels = computeLevels(p);
    applyLevels(levels);

    // instrument ticks: denser in the lab, sparse on the terrace
    const density = 0.2 + 0.7 * smoothstep(0.05, 0.4, p);
    const rate = 1.2 + density * 9 + (state.experimentActive ? 3.4 : 0) + (state.aligned ? 1.2 : 0);
    const accentChance = 0.16 + 0.2 * (weights.optics + weights.compute);
    scheduleTicks(rate, clamp01(accentChance));

    updateMasterLevel();
    return true;
  }

  /* ---- state / dispose --------------------------------------------------- */

  function getState() {
    return {
      version: RESEARCH_AUDIO_VERSION,
      error: initError,
      initialized,
      contextState: context ? context.state : 'none',
      muted,
      volume,
      masterLevel: Math.round(state.masterLevel * 10000) / 10000,
      progress: Math.round(state.progress * 1000) / 1000,
      station: state.station,
      temperatureMk: state.temperatureMk,
      laserLockPct: state.laserLockPct,
      experimentActive: state.experimentActive,
      aligned: state.aligned,
      layers: graph
        ? {
            air: Math.round(graph.airGain.gain.value * 10000) / 10000,
            room: Math.round(graph.roomGain.gain.value * 10000) / 10000,
            cryo: Math.round(graph.cryoBus.gain.value * 10000) / 10000,
            centrifuge: Math.round(graph.centrifugeBus.gain.value * 10000) / 10000,
            pad: Math.round(graph.padBus.gain.value * 10000) / 10000,
            shimmer: Math.round(graph.shimmerBus.gain.value * 10000) / 10000,
            hum: Math.round(graph.humBus.gain.value * 10000) / 10000,
            dusk: Math.round(graph.duskBus.gain.value * 10000) / 10000,
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
        graph.hum120,
        graph.hum240,
        ...(graph.padVoices || []),
        ...(graph.shimmerVoices || []).map((v) => v.osc),
        ...(graph.duskVoices || []).map((v) => v.osc),
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
    playExperimentChime,
    playLaserChime,
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
