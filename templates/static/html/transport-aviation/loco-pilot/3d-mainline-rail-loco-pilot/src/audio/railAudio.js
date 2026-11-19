/**
 * railAudio.js
 * ============================================================================
 * The complete procedural soundscape of the locomotive cab, synthesised live
 * with the Web Audio API. No audio files, no samples, no network requests.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *   const audio = createRailAudio({ volume: 0.8 });
 *   audio.init();                        // after a user gesture
 *   audio.resume();
 *   audio.setMuted(true);  audio.isMuted();
 *   audio.setVolume(0.7);                // 0..1
 *   audio.update(progress, speedKmh, inTunnel);
 *   audio.playHorn();   audio.playClick();
 *   audio.getState();   audio.dispose();
 *
 * `update` is meant to be called once per animation frame from the same loop
 * that drives the world. It is cheap: parameter changes are scheduled onto the
 * audio clock, and the rail-joint scheduler only looks ~100 ms ahead.
 *
 * ----------------------------------------------------------------------------
 * LAYERS
 * ----------------------------------------------------------------------------
 * 1. TRACTION HUM
 *    A stack of sawtooth/triangle oscillators on a 42 Hz fundamental (with
 *    harmonics at 63, 84 and 126 Hz) through a soft lowpass. Level and
 *    brightness rise with speed; a slow tremolo keeps it alive at a stand.
 *
 * 2. INVERTER WHINE
 *    The characteristic rising whine of a three-phase traction drive: a
 *    band-passed sawtooth whose frequency tracks speed (≈ 180 Hz at rest to
 *    ≈ 1.2 kHz at line speed) with a light chorus detune.
 *
 * 3. RAIL-JOINT CLACK  (“clack-clack … clack-clack”)
 *    Scheduled impulses, not a loop: every wheel passes every rail joint.
 *    The interval comes from the joint spacing and the speed, so the rhythm
 *    genuinely speeds up as the train accelerates, and stops when it stands.
 *    Each joint fires a pair of hits (leading and trailing bogie) built from a
 *    filtered noise crack plus a low body thump.
 *
 * 4. ROLLING RUMBLE & SLIPSTREAM
 *    Pink noise through a lowpass, plus a brighter band for the air rushing
 *    past the cab. Both scale with speed; the wind opens up as speed rises.
 *
 * 5. TUNNEL
 *    Inside the bore the world closes in: the wind is low-passed, a resonant
 *    roar joins, and a short feedback echo (a comb delay) gives the reflections
 *    off the tunnel lining. Cross-fades with `inTunnel`, and also follows the
 *    progress value as a fallback.
 *
 * 6. HORN (`playHorn`)
 *    A warm multi-tone chime — three detuned reeds over a lower octave, with a
 *    breathy attack, gentle vibrato, a formant filter and an echo send. It
 *    knows how long to sound and releases cleanly without clicks.
 *
 * 7. COCKPIT DETAIL
 *    `playClick()` is a relay/switch click. A quiet brake squeal joins when the
 *    train is slowing below 35 km/h near the destination.
 *
 * ----------------------------------------------------------------------------
 * TESTING / HEADLESS
 * ----------------------------------------------------------------------------
 * `options.audioContext` accepts any AudioContext-shaped object, so a mock (in
 * Node) or an OfflineAudioContext can drive the whole graph. Without one and
 * without a browser, `init()` returns false and every method stays inert.
 * `getState().masterLevel` reports the RMS seen at the master analyser, which
 * is a real measurement of the produced signal.
 */

export const RAIL_AUDIO_VERSION = '1.0.0';

const DEFAULTS = {
  volume: 0.8,
  muted: false,
  audioContext: null,
  railLength: 25,          // metres between rail joints
  bogieSpacing: 2.9,       // metres between axle groups of one bogie
  hornChord: [311, 370, 466],
  hornOctave: 0.5,
  updateIntervalMs: 45,
  lookahead: 0.12,
  autoResume: true,
};

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function finiteNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Perceptual mapping for speed-driven levels (0..1). */
function speedCurve(speedKmh) {
  return clamp01(speedKmh / 115);
}

/* -------------------------------------------------------------------------- */
/*  Noise buffers                                                            */
/* -------------------------------------------------------------------------- */

/** Paul Kellet refined pink noise (musical, -3 dB/octave). */
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

function fillBrown(data, random) {
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
}

function fillWhite(data, random) {
  for (let i = 0; i < data.length; i += 1) data[i] = random() * 2 - 1;
}

function makeNoiseBuffer(ctx, seconds, kind) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  let seed = 0x1234567;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    if (kind === 'pink') fillPink(data, random);
    else if (kind === 'brown') fillBrown(data, random);
    else fillWhite(data, random);
  }
  return buffer;
}

/** A soft, click-free envelope helper on the audio clock. */
function ramp(param, value, time, duration = 0.08) {
  if (!param) return;
  try {
    if (typeof param.cancelScheduledValues === 'function') param.cancelScheduledValues(time);
    if (typeof param.setTargetAtTime === 'function') param.setTargetAtTime(value, time, Math.max(0.005, duration / 3));
    else param.value = value;
  } catch (err) {
    try {
      param.value = value;
    } catch (err2) {
      /* ignore */
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Factory                                                                  */
/* -------------------------------------------------------------------------- */

export function createRailAudio(options = {}) {
  const settings = Object.assign({}, DEFAULTS, options || {});

  let ctx = null;
  let ownedContext = false;
  let nodes = null;
  let initialized = false;
  let disposed = false;
  let muted = !!settings.muted;
  let volume = clamp01(finiteNumber(settings.volume, DEFAULTS.volume));

  let progress = 0;
  let speedKmh = 0;
  let tunnelFactor = 0;
  let currentSpeed = 0;
  let clackTimer = null;
  let nextClackAt = 0;
  let clackCount = 0;
  let hornCount = 0;
  let clickCount = 0;
  let brakesUntil = 0;

  const layers = {
    traction: 0,
    whine: 0,
    rumble: 0,
    wind: 0,
    tunnel: 0,
    squeal: 0,
  };

  const state = {
    get initialized() {
      return initialized;
    },
    progress,
    speedKmh,
  };

  /* ---------------------------------------------------------------------- */
  /*  Graph                                                                 */
  /* ---------------------------------------------------------------------- */

  function buildGraph() {
    if (settings.audioContext) {
      ctx = settings.audioContext;
      ownedContext = false;
    } else {
      const AudioCtor =
        typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
      if (!AudioCtor) return false;
      try {
        ctx = new AudioCtor({ latencyHint: 'interactive' });
      } catch (err) {
        try {
          ctx = new AudioCtor();
        } catch (err2) {
          return false;
        }
      }
      ownedContext = true;
    }
    if (!ctx || typeof ctx.createGain !== 'function') return false;

    const now = ctx.currentTime || 0;

    /* master: gain -> limiter -> analyser -> destination */
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    if (typeof master.gain.setValueAtTime === 'function') {
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(Math.max(0.0001, muted ? 0.0001 : volume), now + 1.2);
    } else {
      master.gain.value = muted ? 0.0001 : volume;
    }

    const limiter = ctx.createDynamicsCompressor();
    setParam(limiter.threshold, -14);
    setParam(limiter.knee, 12);
    setParam(limiter.ratio, 5);
    setParam(limiter.attack, 0.006);
    setParam(limiter.release, 0.28);

    const analyser = ctx.createAnalyser ? ctx.createAnalyser() : null;
    if (analyser) {
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
    }

    master.connect(limiter);
    if (analyser) {
      limiter.connect(analyser);
      analyser.connect(ctx.destination);
    } else {
      limiter.connect(ctx.destination);
    }

    /* shared noise sources */
    const pinkBuffer = makeNoiseBuffer(ctx, 3, 'pink');
    const brownBuffer = makeNoiseBuffer(ctx, 3, 'brown');
    const whiteBuffer = makeNoiseBuffer(ctx, 1, 'white');
    const crackBuffer = makeNoiseBuffer(ctx, 0.5, 'white');

    function loopSource(buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      try {
        source.start(now + Math.random() * 0.2);
      } catch (err) {
        try {
          source.start(now);
        } catch (err2) {
          /* already started */
        }
      }
      return source;
    }

    const sources = [];
    const oscillators = [];

    /* ------------------------------------------------------- traction hum */
    const tractionGain = ctx.createGain();
    tractionGain.gain.value = 0.0001;
    const tractionFilter = ctx.createBiquadFilter();
    tractionFilter.type = 'lowpass';
    tractionFilter.frequency.value = 320;
    tractionFilter.Q.value = 0.7;
    tractionGain.connect(tractionFilter);
    tractionFilter.connect(master);

    const humSpecs = [
      { type: 'sawtooth', freq: 42, gain: 0.5, detune: -4 },
      { type: 'triangle', freq: 63, gain: 0.34, detune: 3 },
      { type: 'sawtooth', freq: 84, gain: 0.22, detune: -9 },
      { type: 'sine', freq: 126, gain: 0.3, detune: 0 },
    ];
    const humVoices = [];
    for (const spec of humSpecs) {
      const osc = ctx.createOscillator();
      osc.type = spec.type;
      osc.frequency.value = spec.freq;
      if (osc.detune) osc.detune.value = spec.detune;
      const gain = ctx.createGain();
      gain.gain.value = spec.gain;
      osc.connect(gain);
      gain.connect(tractionGain);
      try {
        osc.start(now);
      } catch (err) {
        /* ignore */
      }
      oscillators.push(osc);
      humVoices.push({ osc, gain, baseFreq: spec.freq });
    }

    /* a slow tremolo on the whole hum */
    const tremolo = ctx.createOscillator();
    tremolo.type = 'sine';
    tremolo.frequency.value = 0.42;
    const tremoloDepth = ctx.createGain();
    tremoloDepth.gain.value = 0.18;
    tremolo.connect(tremoloDepth);
    tremoloDepth.connect(tractionGain.gain);
    try {
      tremolo.start(now);
    } catch (err) {
      /* ignore */
    }
    oscillators.push(tremolo);

    /* --------------------------------------------------- inverter whine */
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0.0001;
    const whineFilter = ctx.createBiquadFilter();
    whineFilter.type = 'bandpass';
    whineFilter.frequency.value = 420;
    whineFilter.Q.value = 7;
    whineGain.connect(whineFilter);
    whineFilter.connect(master);

    const whineA = ctx.createOscillator();
    whineA.type = 'sawtooth';
    whineA.frequency.value = 180;
    const whineB = ctx.createOscillator();
    whineB.type = 'sawtooth';
    whineB.frequency.value = 183;
    if (whineB.detune) whineB.detune.value = 8;
    for (const osc of [whineA, whineB]) {
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      osc.connect(gain);
      gain.connect(whineGain);
      try {
        osc.start(now);
      } catch (err) {
        /* ignore */
      }
      oscillators.push(osc);
    }

    /* ----------------------------------------------------- rolling rumble */
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.0001;
    const rumbleLow = ctx.createBiquadFilter();
    rumbleLow.type = 'lowpass';
    rumbleLow.frequency.value = 520;
    rumbleLow.Q.value = 0.4;
    const rumbleHigh = ctx.createBiquadFilter();
    rumbleHigh.type = 'bandshelf';
    rumbleHigh.frequency.value = 90;
    rumbleHigh.gain.value = 4;
    const brownSource = loopSource(brownBuffer);
    sources.push(brownSource);
    brownSource.connect(rumbleHigh);
    rumbleHigh.connect(rumbleLow);
    rumbleLow.connect(rumbleGain);
    rumbleGain.connect(master);

    /* --------------------------------------------------------- slipstream */
    const windGain = ctx.createGain();
    windGain.gain.value = 0.0001;
    const windHigh = ctx.createBiquadFilter();
    windHigh.type = 'highpass';
    windHigh.frequency.value = 420;
    const windLow = ctx.createBiquadFilter();
    windLow.type = 'lowpass';
    windLow.frequency.value = 5200;
    const windSource = loopSource(pinkBuffer);
    sources.push(windSource);
    windSource.connect(windHigh);
    windHigh.connect(windLow);
    windLow.connect(windGain);
    windGain.connect(master);

    /* ------------------------------------------------- tunnel roar + echo */
    const tunnelGain = ctx.createGain();
    tunnelGain.gain.value = 0.0001;
    const tunnelFilter = ctx.createBiquadFilter();
    tunnelFilter.type = 'bandpass';
    tunnelFilter.frequency.value = 260;
    tunnelFilter.Q.value = 1.1;

    const echo = ctx.createDelay ? ctx.createDelay(0.6) : null;
    const echoFeedback = ctx.createGain();
    const echoWet = ctx.createGain();
    const echoTone = ctx.createBiquadFilter();
    echoTone.type = 'lowpass';
    echoTone.frequency.value = 1600;

    const tunnelNoise = loopSource(pinkBuffer);
    sources.push(tunnelNoise);
    tunnelNoise.connect(tunnelFilter);
    tunnelFilter.connect(tunnelGain);
    tunnelGain.connect(master);

    if (echo) {
      echo.delayTime.value = 0.11;
      echoFeedback.gain.value = 0.42;
      echoWet.gain.value = 0.0001;
      // the tunnel bus feeds the echo, and a little of the master too
      tunnelGain.connect(echo);
      echo.connect(echoTone);
      echoTone.connect(echoFeedback);
      echoFeedback.connect(echo);
      echoTone.connect(echoWet);
      echoWet.connect(master);
      // horn also has an echo send in tunnels (see playHorn)
    }

    /* ------------------------------------------------------- brake squeal */
    const squealGain = ctx.createGain();
    squealGain.gain.value = 0.0001;
    const squealFilter = ctx.createBiquadFilter();
    squealFilter.type = 'bandpass';
    squealFilter.frequency.value = 3150;
    squealFilter.Q.value = 18;
    const squealOsc = ctx.createOscillator();
    squealOsc.type = 'sawtooth';
    squealOsc.frequency.value = 2860;
    const squealVibrato = ctx.createOscillator();
    squealVibrato.type = 'sine';
    squealVibrato.frequency.value = 6.4;
    const squealVibratoDepth = ctx.createGain();
    squealVibratoDepth.gain.value = 40;
    squealVibrato.connect(squealVibratoDepth);
    squealVibratoDepth.connect(squealOsc.frequency);
    squealOsc.connect(squealFilter);
    squealFilter.connect(squealGain);
    squealGain.connect(master);
    for (const osc of [squealOsc, squealVibrato]) {
      try {
        osc.start(now);
      } catch (err) {
        /* ignore */
      }
      oscillators.push(osc);
    }

    /* --------------------------------------------------- persistent sources */
    nodes = {
      master,
      limiter,
      analyser,
      tractionGain,
      tractionFilter,
      humVoices,
      whineGain,
      whineFilter,
      whineOscillators: [whineA, whineB],
      rumbleGain,
      rumbleLow,
      windGain,
      windLow,
      windHigh,
      tunnelGain,
      tunnelFilter,
      echo,
      echoFeedback,
      echoWet,
      squealGain,
      squealFilter,
      squealOsc,
      sources,
      oscillators,
      buffers: { pinkBuffer, brownBuffer, whiteBuffer, crackBuffer },
      analyserData: analyser ? new Uint8Array(analyser.fftSize || 1024) : null,
    };

    return true;
  }

  function setParam(param, value) {
    if (!param) return;
    try {
      param.value = value;
    } catch (err) {
      /* ignore */
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Rail joints                                                          */
  /* ---------------------------------------------------------------------- */

  function clack(at, strength) {
    if (!ctx || !nodes) return;
    const { crackBuffer } = nodes.buffers;
    const burst = ctx.createBufferSource();
    burst.buffer = crackBuffer;
    const offset = Math.random() * 0.35;

    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.value = 1200 + Math.random() * 900;
    crackFilter.Q.value = 1.4;

    const crackGain = ctx.createGain();
    const peak = 0.5 * strength;
    if (crackGain.gain.setValueAtTime) {
      crackGain.gain.setValueAtTime(0.0001, at);
      crackGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.004);
      crackGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
    } else {
      crackGain.gain.value = peak;
    }

    burst.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(nodes.master);
    try {
      burst.start(at, offset, 0.14);
      burst.stop(at + 0.16);
    } catch (err) {
      /* ignore */
    }

    // low body thump under the crack
    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.value = 62 + Math.random() * 22;
    const thumpGain = ctx.createGain();
    const thumpPeak = 0.38 * strength;
    if (thumpGain.gain.setValueAtTime) {
      thumpGain.gain.setValueAtTime(0.0001, at);
      thumpGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, thumpPeak), at + 0.006);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    } else {
      thumpGain.gain.value = thumpPeak;
    }
    thump.connect(thumpGain);
    thumpGain.connect(nodes.master);
    try {
      thump.start(at);
      thump.stop(at + 0.2);
    } catch (err) {
      /* ignore */
    }

    clackCount += 1;
  }

  function scheduleJoints() {
    if (!ctx || !nodes || disposed) return;
    const now = ctx.currentTime || 0;
    const mps = currentSpeed / 3.6;
    if (mps < 2.2) {
      nextClackAt = Math.max(nextClackAt, now);
      return;
    }
    if (nextClackAt < now) nextClackAt = now + 0.05;
    const interval = clamp(settings.railLength / mps, 0.14, 1.4);
    const pairSpacing = clamp(settings.bogieSpacing / mps, 0.035, 0.3);
    // the rhythm is strongest at line speed, softer at walking pace
    const strength = clamp(0.35 + speedCurve(currentSpeed) * 0.75, 0.3, 1) * (0.85 + Math.random() * 0.3);

    while (nextClackAt < now + settings.lookahead) {
      clack(nextClackAt, strength);
      clack(nextClackAt + pairSpacing, strength * 0.82);
      // a second, quieter group from the coaches behind
      clack(nextClackAt + 0.09, strength * 0.4);
      nextClackAt += interval;
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  One-shots                                                            */
  /* ---------------------------------------------------------------------- */

  function playHorn() {
    if (!ctx || !nodes || muted || disposed) return false;
    const now = (ctx.currentTime || 0) + 0.02;
    const chord = Array.isArray(settings.hornChord) && settings.hornChord.length
      ? settings.hornChord
      : DEFAULTS.hornChord;
    const duration = 1.35;
    const bus = ctx.createGain();
    bus.gain.value = 0.0001;

    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = 720;
    formant.Q.value = 1.4;
    const air = ctx.createBiquadFilter();
    air.type = 'lowpass';
    air.frequency.value = 2400;

    bus.connect(formant);
    formant.connect(air);
    air.connect(nodes.master);
    if (nodes.echo) {
      const send = ctx.createGain();
      send.gain.value = 0.18;
      air.connect(send);
      send.connect(nodes.echo);
    }

    const voices = [];
    for (let i = 0; i < chord.length; i += 1) {
      const freq = chord[i];
      for (const [mult, gainValue, detune] of [
        [1, 0.34, -6],
        [1, 0.28, 7],
        [settings.hornOctave, 0.3, 0],
        [2, 0.1, 3],
      ]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq * mult;
        if (osc.detune) osc.detune.value = detune;
        const gain = ctx.createGain();
        gain.gain.value = gainValue * (mult < 1 ? 0.9 : 1);
        osc.connect(gain);
        gain.connect(bus);
        voices.push({ osc, gain });
      }
    }

    // vibrato gives the reeds life
    const vibrato = ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.value = 4.6;
    const vibratoDepth = ctx.createGain();
    vibratoDepth.gain.value = 3.4;
    vibrato.connect(vibratoDepth);
    for (const voice of voices) {
      if (voice.osc.frequency) vibratoDepth.connect(voice.osc.frequency);
    }

    try {
      vibrato.start(now);
    } catch (err) {
      /* ignore */
    }

    // envelope: breathy attack, full body, gentle release
    const g = bus.gain;
    if (g.setValueAtTime) {
      g.setValueAtTime(0.0001, now);
      g.exponentialRampToValueAtTime(0.5, now + 0.07);
      g.setTargetAtTime(0.42, now + 0.12, 0.18);
      g.setTargetAtTime(0.0001, now + duration * 0.7, 0.22);
    } else {
      g.value = 0.42;
    }

    for (const voice of voices) {
      try {
        voice.osc.start(now);
        voice.osc.stop(now + duration + 0.5);
      } catch (err) {
        /* ignore */
      }
    }
    try {
      vibrato.stop(now + duration + 0.55);
    } catch (err) {
      /* ignore */
    }

    hornCount += 1;
    return true;
  }

  function playClick() {
    if (!ctx || !nodes || muted || disposed) return false;
    const now = (ctx.currentTime || 0) + 0.01;
    const { crackBuffer } = nodes.buffers;
    const source = ctx.createBufferSource();
    source.buffer = crackBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 3.2;
    const gain = ctx.createGain();
    if (gain.gain.setValueAtTime) {
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    } else {
      gain.gain.value = 0.3;
    }
    source.connect(filter);
    filter.connect(gain);
    gain.connect(nodes.master);
    try {
      source.start(now, Math.random() * 0.3, 0.06);
      source.stop(now + 0.07);
    } catch (err) {
      /* ignore */
    }
    // a second, softer detent a moment later
    const second = ctx.createBufferSource();
    second.buffer = crackBuffer;
    const secondGain = ctx.createGain();
    if (secondGain.gain.setValueAtTime) {
      secondGain.gain.setValueAtTime(0.0001, now + 0.07);
      secondGain.gain.exponentialRampToValueAtTime(0.14, now + 0.073);
      secondGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    } else {
      secondGain.gain.value = 0.12;
    }
    second.connect(secondGain);
    secondGain.connect(filter);
    try {
      second.start(now + 0.07, Math.random() * 0.3, 0.05);
      second.stop(now + 0.13);
    } catch (err) {
      /* ignore */
    }
    clickCount += 1;
    return true;
  }

  /* ---------------------------------------------------------------------- */
  /*  Public controls                                                      */
  /* ---------------------------------------------------------------------- */

  function init() {
    if (initialized || disposed) return initialized;
    let built = false;
    try {
      built = buildGraph();
    } catch (err) {
      built = false;
    }
    if (!built) return false;
    initialized = true;
    if (settings.autoResume) resume();
    if (typeof setInterval === 'function') {
      clackTimer = setInterval(() => {
        try {
          scheduleJoints();
        } catch (err) {
          /* keep the timer alive */
        }
      }, settings.updateIntervalMs);
    }
    return true;
  }

  function resume() {
    if (!ctx || disposed) return false;
    try {
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        const result = ctx.resume();
        if (result && typeof result.catch === 'function') result.catch(() => {});
      }
    } catch (err) {
      /* ignore */
    }
    return true;
  }

  function setMuted(value) {
    muted = !!value;
    if (ctx && nodes) {
      const now = ctx.currentTime || 0;
      ramp(nodes.master.gain, muted ? 0.0001 : Math.max(0.0001, volume), now, 0.18);
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function setVolume(value) {
    volume = clamp01(finiteNumber(value, volume));
    if (ctx && nodes) {
      const now = ctx.currentTime || 0;
      ramp(nodes.master.gain, muted ? 0.0001 : Math.max(0.0001, volume), now, 0.2);
    }
    return volume;
  }

  function update(nextProgress = 0, nextSpeedKmh = 0, inTunnel = false) {
    if (disposed) return;
    progress = clamp01(finiteNumber(nextProgress, progress));
    const targetSpeed = Math.max(0, finiteNumber(nextSpeedKmh, speedKmh));
    speedKmh = targetSpeed;
    // smooth the speed a touch so parameter ramps never step
    currentSpeed += (targetSpeed - currentSpeed) * 0.35;

    const tunnelTarget = inTunnel ? 1 : 0;
    tunnelFactor += (tunnelTarget - tunnelFactor) * 0.1;

    if (!ctx || !nodes) return;
    const now = ctx.currentTime || 0;
    const speed01 = speedCurve(currentSpeed);

    /* traction hum */
    const tractionLevel = 0.1 + speed01 * 0.55;
    ramp(nodes.tractionGain.gain, tractionLevel, now, 0.25);
    const humBase = 40 + speed01 * 16;
    for (const voice of nodes.humVoices) {
      if (voice.osc.frequency) {
        ramp(voice.osc.frequency, voice.baseFreq * (humBase / 42), now, 0.3);
      }
    }
    ramp(nodes.tractionFilter.frequency, 260 + speed01 * 620, now, 0.3);

    /* inverter whine */
    const whineFreq = 170 + speed01 * 980;
    for (const osc of nodes.whineOscillators) {
      if (osc.frequency) ramp(osc.frequency, whineFreq, now, 0.2);
    }
    ramp(nodes.whineFilter.frequency, Math.min(2200, whineFreq * 1.06), now, 0.2);
    ramp(nodes.whineGain.gain, 0.012 + speed01 * 0.05, now, 0.25);

    /* rolling rumble & slipstream */
    ramp(nodes.rumbleGain.gain, 0.04 + speed01 * 0.4, now, 0.25);
    ramp(nodes.rumbleLow.frequency, 340 + speed01 * 420, now, 0.3);
    ramp(nodes.windGain.gain, 0.006 + speed01 * 0.16, now, 0.3);
    ramp(nodes.windLow.frequency, (1 - tunnelFactor) * (4200 + speed01 * 3200) + tunnelFactor * 900, now, 0.35);
    ramp(nodes.windHigh.frequency, 380 + tunnelFactor * 260, now, 0.35);

    /* tunnel bus */
    ramp(nodes.tunnelGain.gain, 0.02 + tunnelFactor * 0.5, now, 0.35);
    ramp(nodes.tunnelFilter.frequency, 200 + tunnelFactor * 160, now, 0.4);
    if (nodes.echoWet) ramp(nodes.echoWet.gain, tunnelFactor * 0.32, now, 0.5);
    if (nodes.echoFeedback) ramp(nodes.echoFeedback.gain, 0.25 + tunnelFactor * 0.32, now, 0.5);

    /* brake squeal near the terminal */
    const nearTerminal = progress > 0.9 && currentSpeed < 45;
    const slowing = progress > 0.93 && currentSpeed < 30;
    const squealTarget = (nearTerminal ? 0.018 : 0) + (slowing ? 0.02 : 0);
    ramp(nodes.squealGain.gain, squealTarget, now, 0.6);
    if (nodes.squealOsc && nodes.squealOsc.frequency) {
      ramp(nodes.squealOsc.frequency, 2400 + currentSpeed * 12, now, 0.4);
    }
    void brakesUntil;

    layers.traction = tractionLevel;
    layers.whine = 0.012 + speed01 * 0.05;
    layers.rumble = 0.04 + speed01 * 0.4;
    layers.wind = 0.006 + speed01 * 0.16;
    layers.tunnel = tunnelFactor;
    layers.squeal = squealTarget;
  }

  /** Peak/RMS level of the produced signal (0..1), for meters and tests. */
  function readMasterLevel() {
    if (!nodes || !nodes.analyser || !nodes.analyserData) return 0;
    try {
      nodes.analyser.getByteTimeDomainData(nodes.analyserData);
      let sum = 0;
      const data = nodes.analyserData;
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / data.length);
    } catch (err) {
      return 0;
    }
  }

  function getState() {
    return {
      initialized,
      muted,
      volume,
      contextState: ctx && ctx.state ? ctx.state : 'none',
      progress,
      speedKmh,
      inTunnel: tunnelFactor > 0.5,
      tunnelFactor,
      layers: { ...layers },
      clacks: clackCount,
      horns: hornCount,
      clicks: clickCount,
      masterLevel: readMasterLevel(),
      nextClackAt,
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (clackTimer !== null && typeof clearInterval === 'function') {
      clearInterval(clackTimer);
      clackTimer = null;
    }
    if (ctx && nodes) {
      const stopAt = ctx.currentTime || 0;
      for (const osc of nodes.oscillators) {
        try {
          if (osc && typeof osc.stop === 'function') osc.stop(stopAt + 0.05);
        } catch (err) {
          /* already stopped */
        }
      }
      for (const source of nodes.sources) {
        try {
          if (source && typeof source.stop === 'function') source.stop(stopAt + 0.05);
        } catch (err) {
          /* already stopped */
        }
      }
      try {
        nodes.master.disconnect();
      } catch (err) {
        /* ignore */
      }
    }
    if (ownedContext && ctx && typeof ctx.close === 'function') {
      try {
        const result = ctx.close();
        if (result && typeof result.catch === 'function') result.catch(() => {});
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
    playHorn,
    playClick,
    getState,
    dispose,
    version: RAIL_AUDIO_VERSION,
  };
}

export default createRailAudio;
