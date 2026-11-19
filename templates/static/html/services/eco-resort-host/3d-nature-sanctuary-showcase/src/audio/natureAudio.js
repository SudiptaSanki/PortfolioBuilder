/**
 * natureAudio.js
 * ----------------------------------------------------------------------------
 * Fully procedural nature soundscape for the open-world nature portfolio.
 * Every layer is synthesised at runtime with the Web Audio API — no audio
 * files are fetched.
 *
 * Public API
 *   createNatureAudio(options?) -> {
 *     init(), resume(), setMuted(bool), isMuted(), setVolume(0..1),
 *     update(cameraPos, waterfallDist, nearestAnimalDist, zoneProgress),
 *     getState(), dispose()
 *   }
 *
 * Layers
 *   waterfall roar   brown/pink noise through a distance-closed lowpass, plus a
 *                    sub rumble and a high mist hiss. Grows fuller and louder as
 *                    the camera approaches the falls and softens up high.
 *   forest wind      modulated bandpass noise with gusting LFOs; a thin ridge
 *                    whistle swells on the hilltops (zoneProgress → 1).
 *   birdsong         FM trills, whistles and two-note calls scheduled
 *                    organically in the meadow canopy; thins out with altitude.
 *   crickets         four AM-buzzed carriers in the grass, louder in the valley.
 *   river babble     filtered noise plus tiny bubble blips near water level.
 *   wildlife         soft hoof/rustle presence when a land animal is close.
 *
 * update(cameraPos, waterfallDist, nearestAnimalDist, zoneProgress)
 *   cameraPos          THREE.Vector3 (or {x,y,z}); a plain number is read as Y
 *   waterfallDist      metres to the waterfall; omit/NaN to compute from
 *                      options.waterfallPosition
 *   nearestAnimalDist  metres to the nearest land animal
 *   zoneProgress       0 = valley floor / waterfall basin, 1 = high ridge
 *
 * Testing
 *   Pass options.audioContext to supply an AudioContext-shaped object (a mock
 *   in Node). Without a browser and without injection, init() returns false and
 *   the rest of the API stays inert but safe.
 */

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

function finite(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Same meander as the scene module, so river babble follows the real water. */
function riverCenterAt(z) {
  const phase = z + 66.5;
  const env = smoothstep(0, 90, phase);
  return env * (9.5 * Math.sin(phase * 0.0092) + 4.0 * Math.sin(phase * 0.0231 + 1.7));
}

/** Paul Kellet refined pink noise, brown-noise integrator, or white noise. */
function createNoiseBuffer(ctx, seconds, kind) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

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
      } else if (kind === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = clamp(brown * 3.5, -1, 1);
      }
    }
  }

  return buffer;
}

/** Open-air impulse response: quick early reflections and a leafy tail. */
function createImpulse(ctx, seconds = 2.4, decay = 2.6) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const attack = 1 - Math.exp(-i / (ctx.sampleRate * 0.012));
      const leaf = 0.85 + 0.15 * Math.sin(i * 0.017 + channel * 1.7);
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * attack * leaf;
    }
  }
  return impulse;
}

function makePanner(ctx) {
  if (typeof ctx.createStereoPanner === 'function') {
    return ctx.createStereoPanner();
  }
  return ctx.createGain();
}

function setPan(node, value) {
  if (node && node.pan && typeof node.pan.value === 'number') node.pan.value = value;
}

export function createNatureAudio(options = {}) {
  const settings = Object.assign(
    {
      masterVolume: 0.8,
      muted: false,
      updateIntervalMs: 55,
      autoResume: true,
      waterfallPosition: { x: 0, y: 1, z: -65 },
      audioContext: null
    },
    options
  );

  const waterfallPosition = {
    x: finite(settings.waterfallPosition && settings.waterfallPosition.x, 0),
    y: finite(settings.waterfallPosition && settings.waterfallPosition.y, 1),
    z: finite(settings.waterfallPosition && settings.waterfallPosition.z, -65)
  };

  let ctx = null;
  let ownedContext = false;
  let nodes = null;
  let initialized = false;
  let muted = !!settings.muted;
  let volume = clamp(finite(settings.masterVolume, 0.8), 0, 1);
  let disposed = false;

  const state = {
    cameraPos: { x: 0, y: 2, z: 80 },
    waterfallDist: 180,
    nearestAnimalDist: 9999,
    zoneProgress: 0
  };

  let schedulerId = null;
  let lastUpdateTime = 0;
  let elapsed = 0;
  let nextBird = 0;
  let nextBubble = 0;
  let nextRustle = 0;
  let scheduledBirds = 0;
  let scheduledBubbles = 0;
  const layerLevels = { waterfall: 0, wind: 0, river: 0, life: 0, crickets: 0, wildlife: 0 };

  /* ---------------------------------------------------------------------- */
  /* Graph                                                                  */
  /* ---------------------------------------------------------------------- */

  function buildGraph() {
    if (settings.audioContext) {
      ctx = settings.audioContext;
      ownedContext = false;
    } else {
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
      ownedContext = true;
    }

    if (!ctx || typeof ctx.createGain !== 'function') return false;

    const now = ctx.currentTime;
    const randomStart = (source) => {
      try {
        source.start(now + Math.random() * 0.35);
      } catch (err) {
        try {
          source.start(now);
        } catch (err2) {
          /* already started */
        }
      }
      return source;
    };

    // ---- master chain ----
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, muted ? 0.0001 : volume), now + 1.6);

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 10;
    limiter.ratio.value = 4.5;
    limiter.attack.value = 0.005;
    limiter.release.value = 0.3;

    master.connect(limiter);
    limiter.connect(ctx.destination);

    // ---- open-air reverb ----
    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulse(ctx, 2.6, 2.4);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.28;
    convolver.connect(reverbReturn);
    reverbReturn.connect(master);
    const reverbInput = ctx.createGain();
    reverbInput.gain.value = 1;
    reverbInput.connect(convolver);

    // ---- noise beds ----
    const pink = createNoiseBuffer(ctx, 4, 'pink');
    const brown = createNoiseBuffer(ctx, 5, 'brown');
    const white = createNoiseBuffer(ctx, 3, 'white');

    const makeNoise = (buffer) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      randomStart(src);
      return src;
    };

    /* ---------------- waterfall: roar, crash, hiss, sub ---------------- */

    const waterfallBus = ctx.createGain();
    waterfallBus.gain.value = 0.0001;
    waterfallBus.connect(master);

    const waterfallReverbSend = ctx.createGain();
    waterfallReverbSend.gain.value = 0.18;
    waterfallBus.connect(waterfallReverbSend);
    waterfallReverbSend.connect(reverbInput);

    const roarSource = makeNoise(brown);
    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.value = 260;
    roarFilter.Q.value = 0.9;
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0.85;
    roarSource.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(waterfallBus);

    const crashSource = makeNoise(pink);
    const crashFilter = ctx.createBiquadFilter();
    crashFilter.type = 'bandpass';
    crashFilter.frequency.value = 780;
    crashFilter.Q.value = 0.55;
    const crashGain = ctx.createGain();
    crashGain.gain.value = 0.5;
    crashSource.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(waterfallBus);

    const hissSource = makeNoise(white);
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 3000;
    hissFilter.Q.value = 0.4;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.16;
    hissSource.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(waterfallBus);

    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 44;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.22;
    subOsc.connect(subGain);
    subGain.connect(waterfallBus);
    subOsc.start(now);

    // slow churn swell on top of the roar
    const churnLfo = ctx.createOscillator();
    churnLfo.type = 'sine';
    churnLfo.frequency.value = 0.085;
    const churnDepth = ctx.createGain();
    churnDepth.gain.value = 0.12;
    churnLfo.connect(churnDepth);
    churnDepth.connect(roarGain.gain);
    churnLfo.start(now);

    /* ------------------------- forest wind ---------------------------- */

    const windBus = ctx.createGain();
    windBus.gain.value = 0.5;
    windBus.connect(master);
    const windReverbSend = ctx.createGain();
    windReverbSend.gain.value = 0.08;
    windBus.connect(windReverbSend);
    windReverbSend.connect(reverbInput);

    const windSource = makeNoise(pink);
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 430;
    windFilter.Q.value = 0.75;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.16;
    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(windBus);

    const gustLfoA = ctx.createOscillator();
    gustLfoA.type = 'sine';
    gustLfoA.frequency.value = 0.061;
    const gustDepthA = ctx.createGain();
    gustDepthA.gain.value = 170;
    gustLfoA.connect(gustDepthA);
    gustDepthA.connect(windFilter.frequency);
    gustLfoA.start(now);

    const gustLfoB = ctx.createOscillator();
    gustLfoB.type = 'sine';
    gustLfoB.frequency.value = 0.037;
    const gustDepthB = ctx.createGain();
    gustDepthB.gain.value = 0.055;
    gustLfoB.connect(gustDepthB);
    gustDepthB.connect(windGain.gain);
    gustLfoB.start(now);

    // needle hiss through pine tops on the ridges
    const ridgeSource = makeNoise(white);
    const ridgeFilter = ctx.createBiquadFilter();
    ridgeFilter.type = 'bandpass';
    ridgeFilter.frequency.value = 2100;
    ridgeFilter.Q.value = 6;
    const ridgeGain = ctx.createGain();
    ridgeGain.gain.value = 0.0001;
    ridgeSource.connect(ridgeFilter);
    ridgeFilter.connect(ridgeGain);
    ridgeGain.connect(windBus);

    // low leafy body of the forest
    const leafSource = makeNoise(brown);
    const leafFilter = ctx.createBiquadFilter();
    leafFilter.type = 'lowpass';
    leafFilter.frequency.value = 220;
    const leafGain = ctx.createGain();
    leafGain.gain.value = 0.10;
    leafSource.connect(leafFilter);
    leafFilter.connect(leafGain);
    leafGain.connect(windBus);

    /* ------------------------- river babble --------------------------- */

    const riverBus = ctx.createGain();
    riverBus.gain.value = 0.0001;
    riverBus.connect(master);
    const riverReverbSend = ctx.createGain();
    riverReverbSend.gain.value = 0.12;
    riverBus.connect(riverReverbSend);
    riverReverbSend.connect(reverbInput);

    const babbleSource = makeNoise(pink);
    const babbleFilter = ctx.createBiquadFilter();
    babbleFilter.type = 'bandpass';
    babbleFilter.frequency.value = 820;
    babbleFilter.Q.value = 1.0;
    const babbleGain = ctx.createGain();
    babbleGain.gain.value = 0.34;
    babbleSource.connect(babbleFilter);
    babbleFilter.connect(babbleGain);
    babbleGain.connect(riverBus);

    const babbleLfo = ctx.createOscillator();
    babbleLfo.type = 'sine';
    babbleLfo.frequency.value = 0.31;
    const babbleLfoDepth = ctx.createGain();
    babbleLfoDepth.gain.value = 260;
    babbleLfo.connect(babbleLfoDepth);
    babbleLfoDepth.connect(babbleFilter.frequency);
    babbleLfo.start(now);

    const trickleSource = makeNoise(white);
    const trickleFilter = ctx.createBiquadFilter();
    trickleFilter.type = 'highpass';
    trickleFilter.frequency.value = 2400;
    trickleFilter.Q.value = 0.6;
    const trickleGain = ctx.createGain();
    trickleGain.gain.value = 0.07;
    trickleSource.connect(trickleFilter);
    trickleFilter.connect(trickleGain);
    trickleGain.connect(riverBus);

    /* ------------------------- birds & life --------------------------- */

    const lifeBus = ctx.createGain();
    lifeBus.gain.value = 0.6;
    lifeBus.connect(master);
    const lifeReverbSend = ctx.createGain();
    lifeReverbSend.gain.value = 0.4;
    lifeBus.connect(lifeReverbSend);
    lifeReverbSend.connect(reverbInput);

    const birdBus = ctx.createGain();
    birdBus.gain.value = 0.75;
    birdBus.connect(lifeBus);

    const cricketBus = ctx.createGain();
    cricketBus.gain.value = 0.0001;
    cricketBus.connect(lifeBus);

    const wildlifeBus = ctx.createGain();
    wildlifeBus.gain.value = 0.0001;
    wildlifeBus.connect(lifeBus);

    const cricketVoices = [];
    for (let i = 0; i < 4; i++) {
      const tone = ctx.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = 4200 + Math.random() * 700 + i * 55;

      const amp = ctx.createGain();
      amp.gain.value = 0.5;

      const pulse = ctx.createOscillator();
      pulse.type = 'square';
      pulse.frequency.value = 19 + Math.random() * 8;
      const pulseDepth = ctx.createGain();
      pulseDepth.gain.value = 0.5;
      pulse.connect(pulseDepth);
      pulseDepth.connect(amp.gain);

      const toneFilter = ctx.createBiquadFilter();
      toneFilter.type = 'bandpass';
      toneFilter.frequency.value = tone.frequency.value;
      toneFilter.Q.value = 1.6;

      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 0.06 + Math.random() * 0.05;

      const pan = makePanner(ctx);
      setPan(pan, (Math.random() * 1.8 - 0.9));

      tone.connect(amp);
      amp.connect(toneFilter);
      toneFilter.connect(voiceGain);
      voiceGain.connect(pan);
      pan.connect(cricketBus);

      tone.start(now + Math.random() * 0.2);
      pulse.start(now + Math.random() * 0.2);
      cricketVoices.push({ tone, pulse, pan });
    }

    /* ------------------------- wildlife rustle ------------------------ */

    nodes = {
      master,
      limiter,
      convolver,
      reverbInput,
      reverbReturn,
      pink,
      brown,
      white,
      waterfallBus,
      roarGain,
      roarFilter,
      crashGain,
      crashFilter,
      hissGain,
      hissFilter,
      subGain,
      churnLfo,
      windBus,
      windGain,
      windFilter,
      ridgeGain,
      ridgeFilter,
      leafGain,
      riverBus,
      babbleGain,
      babbleFilter,
      trickleGain,
      trickleFilter,
      lifeBus,
      birdBus,
      cricketBus,
      cricketVoices,
      wildlifeBus,
      sources: [
        roarSource,
        crashSource,
        hissSource,
        windSource,
        ridgeSource,
        leafSource,
        babbleSource,
        trickleSource
      ],
      oscillators: [
        subOsc,
        churnLfo,
        gustLfoA,
        gustLfoB,
        babbleLfo,
        ...cricketVoices.map((v) => v.tone),
        ...cricketVoices.map((v) => v.pulse)
      ]
    };

    if (settings.autoResume && typeof ctx.resume === 'function' && ctx.state === 'suspended') {
      try {
        ctx.resume().catch(() => {});
      } catch (err) {
        /* ignore autoplay refusal */
      }
    }

    nextBird = now + 0.6;
    nextBubble = now + 1.1;
    nextRustle = now + 1.5;

    return true;
  }

  /* ---------------------------------------------------------------------- */
  /* One-shots                                                              */
  /* ---------------------------------------------------------------------- */

  function scheduleTone(time, config) {
    if (!ctx || !nodes) return;
    const {
      freqStart,
      freqEnd = freqStart,
      duration = 0.2,
      peak = 0.04,
      type = 'sine',
      pan = 0,
      vibrato = 0,
      vibratoRate = 20
    } = config;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freqStart), time);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), time + duration * 0.92);
    }

    let mod = null;
    let modGain = null;
    if (vibrato > 0) {
      mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.value = vibratoRate;
      modGain = ctx.createGain();
      modGain.gain.value = vibrato;
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      mod.start(time);
      mod.stop(time + duration + 0.05);
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + Math.min(0.05, duration * 0.25));
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    const panner = makePanner(ctx);
    setPan(panner, pan);

    osc.connect(env);
    env.connect(panner);
    panner.connect(nodes.birdBus);

    const send = ctx.createGain();
    send.gain.value = 0.35;
    panner.connect(send);
    send.connect(nodes.reverbInput);

    osc.start(time);
    osc.stop(time + duration + 0.05);
    osc.onended = () => {
      try {
        osc.disconnect();
        env.disconnect();
        panner.disconnect();
        send.disconnect();
        if (mod) mod.disconnect();
        if (modGain) modGain.disconnect();
      } catch (err) {
        /* already disconnected */
      }
    };
  }

  function scheduleBird(time, kind) {
    if (!ctx || !nodes) return;
    const pan = Math.random() * 1.5 - 0.75;

    if (kind === 0) {
      // warbling trill
      const duration = 0.45 + Math.random() * 0.55;
      const base = 2500 + Math.random() * 1500;
      scheduleTone(time, {
        freqStart: base,
        freqEnd: base * (0.9 + Math.random() * 0.16),
        duration,
        peak: 0.028 + Math.random() * 0.022,
        pan,
        vibrato: base * 0.05,
        vibratoRate: 24 + Math.random() * 14
      });
    } else if (kind === 1) {
      // two or three clean descending whistles
      const notes = 2 + Math.floor(Math.random() * 2);
      let t = time;
      let freq = 1900 + Math.random() * 900;
      for (let i = 0; i < notes; i++) {
        scheduleTone(t, {
          freqStart: freq,
          freqEnd: freq * 0.78,
          duration: 0.16 + Math.random() * 0.1,
          peak: 0.03 + Math.random() * 0.02,
          pan,
          vibrato: 12,
          vibratoRate: 7
        });
        t += 0.20 + Math.random() * 0.08;
        freq *= 0.88;
      }
    } else if (kind === 2) {
      // distant cuckoo
      const base = 640 + Math.random() * 160;
      scheduleTone(time, { freqStart: base, duration: 0.22, peak: 0.026, pan, vibrato: 30, vibratoRate: 9 });
      scheduleTone(time + 0.3, {
        freqStart: base * 0.82,
        duration: 0.28,
        peak: 0.022,
        pan,
        vibrato: 24,
        vibratoRate: 8
      });
    } else {
      // bright contact calls
      let t = time;
      for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        const f = 3200 + Math.random() * 1800;
        scheduleTone(t, {
          freqStart: f,
          freqEnd: f * 0.72,
          duration: 0.06 + Math.random() * 0.05,
          peak: 0.022 + Math.random() * 0.016,
          pan
        });
        t += 0.09 + Math.random() * 0.07;
      }
    }
    scheduledBirds++;
  }

  function scheduleBubble(time, strength = 1) {
    if (!ctx || !nodes) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const startFreq = 280 + Math.random() * 520;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(startFreq * (1.8 + Math.random()), time + 0.045);

    const env = ctx.createGain();
    const peak = (0.012 + Math.random() * 0.03) * strength;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.09 + Math.random() * 0.1);

    const panner = makePanner(ctx);
    setPan(panner, Math.random() * 1.5 - 0.75);

    osc.connect(env);
    env.connect(panner);
    panner.connect(nodes.riverBus);

    osc.start(time);
    osc.stop(time + 0.25);
    osc.onended = () => {
      try {
        osc.disconnect();
        env.disconnect();
        panner.disconnect();
      } catch (err) {
        /* already disconnected */
      }
    };
    scheduledBubbles++;
  }

  function scheduleRustle(time, proximity) {
    if (!ctx || !nodes) return;
    const src = ctx.createBufferSource();
    src.buffer = nodes.brown;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 260 + Math.random() * 260;
    filter.Q.value = 0.9;

    const env = ctx.createGain();
    const peak = 0.05 * proximity * (0.6 + Math.random() * 0.6);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.16 + Math.random() * 0.2);

    const panner = makePanner(ctx);
    setPan(panner, Math.random() * 1.2 - 0.6);

    src.connect(filter);
    filter.connect(env);
    env.connect(panner);
    panner.connect(nodes.wildlifeBus);

    src.start(time, Math.random() * 2);
    src.stop(time + 0.5);
    src.onended = () => {
      try {
        src.disconnect();
        filter.disconnect();
        env.disconnect();
        panner.disconnect();
      } catch (err) {
        /* already disconnected */
      }
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Scheduler                                                              */
  /* ---------------------------------------------------------------------- */

  function valleyFactor() {
    return clamp(1 - state.zoneProgress, 0, 1);
  }

  function altitudeFactor() {
    const y = state.cameraPos.y;
    return clamp(1 - Math.max(0, y) / 55, 0.08, 1);
  }

  function birdDensity() {
    const valley = valleyFactor();
    const altitude = smoothstep(46, 4, state.cameraPos.y);
    return clamp(0.08 + valley * 0.92 * (0.25 + altitude * 0.75), 0, 1);
  }

  function tick() {
    if (!ctx || !nodes || disposed) return;
    const now = ctx.currentTime;
    const ahead = now + 0.9;

    // ---- birdsong ----
    const density = birdDensity();
    if (nextBird < now - 1.5) nextBird = now + 0.4;
    let guard = 0;
    while (nextBird < ahead && guard++ < 7) {
      const kind = Math.random() < 0.45 ? 0 : Math.random() < 0.55 ? 1 : Math.random() < 0.7 ? 2 : 3;
      scheduleBird(nextBird + Math.random() * 0.1, kind);
      const gap = 1.1 + Math.random() * 3.8;
      nextBird += gap / Math.max(0.12, density);
    }

    // ---- river bubbles near water ----
    const water = waterProximity();
    if (water > 0.08) {
      if (nextBubble < now - 1) nextBubble = now + 0.3;
      let bubbleGuard = 0;
      while (nextBubble < ahead && bubbleGuard++ < 10) {
        scheduleBubble(nextBubble + Math.random() * 0.15, water);
        nextBubble += 0.18 + Math.random() * 0.9;
      }
    } else if (nextBubble < now) {
      nextBubble = now + 2;
    }

    // ---- wildlife presence ----
    const proximity = clamp(1 - state.nearestAnimalDist / 32, 0, 1);
    if (proximity > 0.02) {
      if (nextRustle < now - 1) nextRustle = now + 0.5;
      let rustleGuard = 0;
      while (nextRustle < ahead && rustleGuard++ < 5) {
        scheduleRustle(nextRustle, proximity);
        nextRustle += 0.45 + Math.random() * 0.9;
      }
    } else if (nextRustle < now) {
      nextRustle = now + 1.5;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Mix                                                                    */
  /* ---------------------------------------------------------------------- */

  function waterProximity() {
    const altitude = smoothstep(11, -1, state.cameraPos.y);
    const nearFalls = clamp(1 - state.waterfallDist / 150, 0, 1);
    const z = state.cameraPos.z;
    const inReach = smoothstep(-72, -58, z) * (1 - smoothstep(255, 285, z));
    const lateral = 1 - smoothstep(8, 46, Math.abs(state.cameraPos.x - riverCenterAt(z)));
    const river = lateral * altitude * inReach;
    return clamp(Math.max(river, nearFalls * 0.85) * (0.25 + valleyFactor() * 0.75), 0, 1);
  }

  function applyState(force = false) {
    if (!ctx || !nodes) return;

    const now = ctx.currentTime;
    const set = (param, value, timeConstant = 0.3) => {
      if (!param) return;
      if (force) param.setValueAtTime(value, now);
      else param.setTargetAtTime(value, now, timeConstant);
    };

    const altitude = altitudeFactor();
    const valley = valleyFactor();
    const waterfallNear = clamp(1 - state.waterfallDist / 320, 0, 1);
    const waterfallDisplay = Math.pow(waterfallNear, 1.8);

    // waterfall: loud full body up close, thin distant hiss far away
    const fallsGain = 0.02 + 0.98 * waterfallDisplay;
    layerLevels.waterfall = Math.max(0.0001, fallsGain);
    set(nodes.waterfallBus.gain, layerLevels.waterfall, 0.35);
    set(nodes.roarFilter.frequency, 150 + 520 * waterfallDisplay, 0.35);
    set(nodes.crashFilter.frequency, 520 + 1200 * waterfallDisplay, 0.35);
    set(nodes.hissFilter.frequency, 2200 + 2600 * waterfallDisplay, 0.35);
    set(nodes.hissGain.gain, 0.06 + 0.14 * waterfallDisplay, 0.4);
    set(nodes.subGain.gain, 0.08 + 0.20 * waterfallDisplay, 0.45);

    // wind swells on the ridges and in the tree line
    const windLevel = 0.22 + state.zoneProgress * 0.55 + altitude * 0.23;
    layerLevels.wind = clamp(windLevel, 0.1, 1.15);
    set(nodes.windBus.gain, layerLevels.wind, 0.5);
    set(nodes.windFilter.frequency, 320 + 520 * altitude, 0.6);
    set(nodes.ridgeGain.gain, Math.max(0.0001, smoothstep(0.35, 1, state.zoneProgress) * 0.22 * altitude), 0.7);
    set(nodes.leafGain.gain, 0.08 + 0.06 * valley, 0.6);

    // river babble near the water line
    const water = waterProximity();
    layerLevels.river = Math.max(0.0001, water * 0.8);
    set(nodes.riverBus.gain, layerLevels.river, 0.4);
    set(nodes.babbleFilter.frequency, 640 + 520 * water, 0.5);
    set(nodes.trickleGain.gain, 0.03 + 0.07 * water, 0.5);

    // life: quieter right beside the falls, emptier on the ridge
    const life = (0.22 + valley * 0.58) * (1 - 0.35 * waterfallDisplay);
    layerLevels.life = Math.max(0.0001, life);
    set(nodes.lifeBus.gain, layerLevels.life, 0.5);
    set(nodes.birdBus.gain, 0.65 + 0.2 * valley, 0.6);
    layerLevels.crickets = Math.max(0.0001, (0.35 + valley * 0.65) * 0.55 * altitude);
    set(nodes.cricketBus.gain, layerLevels.crickets, 0.8);

    const wildlife = clamp(1 - state.nearestAnimalDist / 32, 0, 1);
    layerLevels.wildlife = Math.max(0.0001, 0.25 + wildlife * 0.9);
    set(nodes.wildlifeBus.gain, layerLevels.wildlife, 0.35);

    set(nodes.reverbReturn.gain, 0.22 + state.zoneProgress * 0.12, 0.8);
  }

  /* ---------------------------------------------------------------------- */
  /* Public API                                                             */
  /* ---------------------------------------------------------------------- */

  function init() {
    if (disposed) return false;
    if (initialized) {
      if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        try {
          ctx.resume().catch(() => {});
        } catch (err) {
          /* ignore */
        }
      }
      return true;
    }

    const ok = buildGraph();
    if (!ok) return false;

    initialized = true;
    if (muted && nodes) nodes.master.gain.value = 0.0001;

    if (schedulerId === null && typeof setInterval === 'function') {
      schedulerId = setInterval(tick, 220);
    }

    applyState(true);
    tick();
    return true;
  }

  function resume() {
    if (!ctx) return Promise.resolve(false);
    if (ctx.state === 'suspended') {
      try {
        return Promise.resolve(ctx.resume()).then(() => true).catch(() => false);
      } catch (err) {
        return Promise.resolve(false);
      }
    }
    return Promise.resolve(true);
  }

  function setMuted(next) {
    muted = !!next;
    if (ctx && nodes) {
      const now = ctx.currentTime;
      const target = muted ? 0.0001 : Math.max(0.0001, volume);
      nodes.master.gain.cancelScheduledValues(now);
      nodes.master.gain.setTargetAtTime(target, now, 0.12);
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function setVolume(next) {
    volume = clamp(finite(next, volume), 0, 1);
    if (ctx && nodes && !muted) {
      nodes.master.gain.setTargetAtTime(Math.max(0.0001, volume), ctx.currentTime, 0.2);
    }
    return volume;
  }

  function update(cameraPos, waterfallDist, nearestAnimalDist, zoneProgress) {
    if (cameraPos && typeof cameraPos === 'object') {
      const x = finite(cameraPos.x, state.cameraPos.x);
      const y = finite(cameraPos.y, state.cameraPos.y);
      const z = finite(cameraPos.z, state.cameraPos.z);
      state.cameraPos = { x, y, z };
    } else if (typeof cameraPos === 'number' && Number.isFinite(cameraPos)) {
      state.cameraPos = { ...state.cameraPos, y: cameraPos };
    }

    let dist = finite(waterfallDist, NaN);
    if (!Number.isFinite(dist)) {
      const dx = state.cameraPos.x - waterfallPosition.x;
      const dy = state.cameraPos.y - waterfallPosition.y;
      const dz = state.cameraPos.z - waterfallPosition.z;
      dist = Math.hypot(dx, dy, dz);
    }
    state.waterfallDist = Math.max(0, dist);
    state.nearestAnimalDist = Math.max(0, finite(nearestAnimalDist, 9999));
    state.zoneProgress = clamp(finite(zoneProgress, 0), 0, 1);

    if (!ctx || !nodes || disposed) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastUpdateTime < settings.updateIntervalMs) return;
    const dt = lastUpdateTime ? Math.min(0.25, Math.max(0.001, (now - lastUpdateTime) / 1000)) : 0.016;
    lastUpdateTime = now;
    elapsed += dt;

    applyState(false);
  }

  function getState() {
    return {
      initialized,
      running: !!ctx && ctx.state === 'running',
      contextState: ctx ? ctx.state : 'none',
      sampleRate: ctx ? ctx.sampleRate : 0,
      muted,
      volume,
      cameraPos: { ...state.cameraPos },
      waterfallDist: state.waterfallDist,
      nearestAnimalDist: state.nearestAnimalDist,
      zoneProgress: state.zoneProgress,
      layers: { ...layerLevels },
      scheduledBirds,
      scheduledBubbles,
      elapsed
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    if (schedulerId !== null) {
      clearInterval(schedulerId);
      schedulerId = null;
    }

    if (ctx && nodes) {
      try {
        const stopAt = ctx.currentTime;
        for (const osc of nodes.oscillators || []) {
          if (osc && typeof osc.stop === 'function') {
            try {
              osc.stop(stopAt);
            } catch (err) {
              /* already stopped */
            }
          }
        }
        for (const src of nodes.sources || []) {
          if (src && typeof src.stop === 'function') {
            try {
              src.stop(stopAt);
            } catch (err) {
              /* already stopped */
            }
          }
        }
        if (nodes.master) {
          try {
            nodes.master.disconnect();
          } catch (err) {
            /* already disconnected */
          }
        }
      } catch (err) {
        /* teardown races are fine */
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
    getState,
    dispose
  };
}

export default createNatureAudio;
