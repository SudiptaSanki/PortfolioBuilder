/* =========================================================
   AUDIO — procedural sci-fi ambience + collect chimes.
   No samples: every sound is synthesised with Web Audio,
   which keeps the build free of binary assets.
   ========================================================= */
window.AUDIO = (function () {
  var ctx = null;
  var master = null;
  var ambientGain = null;
  var started = false;
  var muted = true;
  var nodes = [];

  function now() { return ctx ? ctx.currentTime : 0; }

  function noiseBuffer(seconds) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  function buildAmbient() {
    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.0;
    ambientGain.connect(master);

    // deep drone: two detuned saws through a slowly breathing lowpass
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 3.5;
    filter.connect(ambientGain);

    [55, 82.5, 110.3].forEach(function (f, i) {
      var o = ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 7;
      var g = ctx.createGain();
      g.gain.value = i === 0 ? 0.22 : 0.10;
      o.connect(g); g.connect(filter);
      o.start();
      nodes.push(o);
    });

    // filter sweep LFO
    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    lfo.start();
    nodes.push(lfo);

    // solar wind: filtered noise
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4);
    src.loop = true;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    var windGain = ctx.createGain();
    windGain.gain.value = 0.055;
    var wlfo = ctx.createOscillator();
    wlfo.frequency.value = 0.07;
    var wlfoGain = ctx.createGain();
    wlfoGain.gain.value = 0.03;
    wlfo.connect(wlfoGain); wlfoGain.connect(windGain.gain);
    wlfo.start();
    src.connect(bp); bp.connect(windGain); windGain.connect(master);
    src.start();
    nodes.push(src, wlfo);

    ambientGain.gain.linearRampToValueAtTime(0.5, now() + 3.5);
  }

  function start() {
    if (started) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);
      buildAmbient();
      started = true;
      if (ctx.state === 'suspended') ctx.resume();
      setMuted(false);
      return true;
    } catch (e) {
      return false;
    }
  }

  function setMuted(next) {
    if (!ctx) { muted = next; return; }
    muted = next;
    var t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(next ? 0.0 : 0.85, t, 0.25);
  }

  function toggle() {
    if (!started) { var ok = start(); if (ok) return false; return true; }
    setMuted(!muted);
    return muted;
  }

  /* bell-like artifact pickup */
  function chime(base) {
    if (!ctx || muted) return;
    var t = now();
    var root = base || 528;
    [1, 2.01, 2.99, 4.02].forEach(function (m, i) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = root * m * (1 + (Math.random() - 0.5) * 0.002);
      var peak = 0.30 / (i + 1.4);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.012 + i * 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5 + i * 0.18);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 1.9 + i * 0.2);
    });
    // airy noise tail
    var s = ctx.createBufferSource();
    s.buffer = noiseBuffer(1.2);
    var f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 3600;
    var g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.12, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    s.connect(f); f.connect(g2); g2.connect(master);
    s.start(t); s.stop(t + 1.2);
  }

  /* short UI blip */
  function blip(freq) {
    if (!ctx || muted) return;
    var t = now();
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = freq || 1180;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.12);
  }

  /* travel whoosh */
  function whoosh() {
    if (!ctx || muted) return;
    var t = now();
    var s = ctx.createBufferSource();
    s.buffer = noiseBuffer(1.0);
    var f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(240, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.55);
    f.Q.value = 1.1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + 1.0);
  }

  return {
    start: start,
    toggle: toggle,
    chime: chime,
    blip: blip,
    whoosh: whoosh,
    isMuted: function () { return muted; },
    isStarted: function () { return started; }
  };
})();
