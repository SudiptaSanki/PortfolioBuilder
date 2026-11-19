// serverRoomAudio.js — the hall's sound, synthesised entirely in the Web
// Audio API (zero external files, nothing fetched, nothing downloaded).
//
//   bed     brown-noise airflow through a slowly breathing low-pass
//   fans    a narrow noise band around 900 Hz — blade tone, not white hiss
//   pump    two low saw/sine partials near the CDU, gain follows distance
//   click   mechanical relay + door latch, played on rack selection
//   chime   soft two-note tour-stop chime
//
// State contract used by the UI and the verification harness:
//   'idle'    → bar is showing, nothing started
//   'running' → context resumed, graph audible
//   'closed'  → user chose Stay Muted; nothing will play
//   'suspended' → started earlier, silenced (tab hidden)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export class ServerRoomAudio {
  constructor() {
    this.state = 'idle';
    this.ctx = null;
    this.master = null;
    this.pumpGain = null;
    this.fanGain = null;
    this._started = false;
    this._muted = false;
    this._nodes = [];
    this._lastClick = 0;
  }

  _ctx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!this.ctx) this.ctx = new Ctx({ latencyHint: 'playback' });
    return this.ctx;
  }

  _noiseBuffer(seconds, brown = true) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.2;
      } else {
        d[i] = white;
      }
    }
    return buf;
  }

  async start() {
    const ctx = this._ctx();
    if (!ctx) {
      this.state = 'closed';
      return this.state;
    }
    if (this._started) {
      try { await ctx.resume(); } catch { /* ignore */ }
      if (this.master) {
        const now = ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), now);
        this.master.gain.exponentialRampToValueAtTime(0.55, now + 0.9);
      }
      this.state = 'running';
      this._muted = false;
      return this.state;
    }

    const now = ctx.currentTime;

    // master chain: gentle glue + limiter so nothing ever clips
    const master = ctx.createGain();
    master.gain.value = 0.0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 24;
    comp.ratio.value = 4;
    comp.attack.value = 0.01;
    comp.release.value = 0.3;
    master.connect(comp);
    comp.connect(ctx.destination);
    this.master = master;

    // ---- airflow bed -----------------------------------------------------
    const bed = ctx.createBufferSource();
    bed.buffer = this._noiseBuffer(3.2, true);
    bed.loop = true;
    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = 'lowpass';
    bedFilter.frequency.value = 420;
    bedFilter.Q.value = 0.6;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.42;
    bed.connect(bedFilter);
    bedFilter.connect(bedGain);
    bedGain.connect(master);

    // slow breath on the airflow so it never sounds like a static file
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.055;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = 130;
    breath.connect(breathDepth);
    breathDepth.connect(bedFilter.frequency);
    breath.start(now);
    this._nodes.push(breath);

    // ---- blade / fan band ------------------------------------------------
    const band = ctx.createBufferSource();
    band.buffer = this._noiseBuffer(2.6, false);
    band.loop = true;
    const bandFilter = ctx.createBiquadFilter();
    bandFilter.type = 'bandpass';
    bandFilter.frequency.value = 880;
    bandFilter.Q.value = 1.1;
    const bandGain = ctx.createGain();
    bandGain.gain.value = 0.022;
    band.connect(bandFilter);
    bandFilter.connect(bandGain);
    bandGain.connect(master);
    this.fanGain = bandGain;

    const flutter = ctx.createOscillator();
    flutter.frequency.value = 7.3;
    const flutterDepth = ctx.createGain();
    flutterDepth.gain.value = 0.006;
    flutter.connect(flutterDepth);
    flutterDepth.connect(bandGain.gain);
    flutter.start(now);
    this._nodes.push(flutter);

    // ---- coolant pump (audible near CDU-01) ------------------------------
    const pumpGain = ctx.createGain();
    pumpGain.gain.value = 0.0;
    const pumpFilter = ctx.createBiquadFilter();
    pumpFilter.type = 'lowpass';
    pumpFilter.frequency.value = 360;
    pumpFilter.Q.value = 0.8;
    const pumpMix = ctx.createGain();
    pumpMix.gain.value = 0.9;
    pumpGain.connect(pumpFilter);
    pumpFilter.connect(pumpMix);
    pumpMix.connect(master);

    const hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 47;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.05;
    hum.connect(humGain);
    humGain.connect(pumpGain);

    const hum2 = ctx.createOscillator();
    hum2.type = 'sine';
    hum2.frequency.value = 94.5;
    const hum2Gain = ctx.createGain();
    hum2Gain.gain.value = 0.028;
    hum2.connect(hum2Gain);
    hum2Gain.connect(pumpGain);

    const surge = ctx.createOscillator();
    surge.frequency.value = 0.21;
    const surgeDepth = ctx.createGain();
    surgeDepth.gain.value = 0.016;
    surge.connect(surgeDepth);
    surgeDepth.connect(humGain.gain);
    surge.start(now);

    hum.start(now); hum2.start(now);
    this._nodes.push(hum, hum2, surge);
    this.pumpGain = pumpGain;

    // loop the two noise beds
    bed.start(now);
    band.start(now);
    this._nodes.push(bed, band);
    this._started = true;

    try {
      if (ctx.state === 'suspended') await ctx.resume();
    } catch { /* ignore */ }

    // fade in over ~1.2 s — no pop
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.55, now + 1.2);

    this.state = 'running';
    this._muted = false;
    return this.state;
  }

  mute() {
    this.state = 'closed';
    this._muted = true;
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0.0001, now, 0.18);
      setTimeout(() => { try { this.ctx.suspend(); } catch { /* ignore */ } }, 700);
    }
    return this.state;
  }

  suspend() {
    if (this.state === 'running' && this.ctx) {
      this.ctx.suspend().catch(() => {});
      this.state = 'suspended';
    }
  }

  resume() {
    if (this.state === 'suspended' && this.ctx) {
      this.ctx.resume().catch(() => {});
      this.state = 'running';
      this._muted = false;
    }
  }

  getState() {
    if (this.state === 'idle' && this._started) return this.state;
    return this.state;
  }

  // Distance-aware mix: pump hum swells near CDU-01 (3.6, 1.2), fans lean
  // left/right with the camera. Called every frame from the render loop.
  setListener(x, z) {
    if (!this.ctx || this.state !== 'running') return;
    const d = Math.hypot(x - 3.6, z - 1.2);
    const near = clamp(1 - d / 4.2, 0, 1);
    const target = 0.012 + near * near * 0.085;
    this.pumpGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25);
    const pan = clamp(x / 4.8, -1, 1) * 0.25;
    if (this.master && this.master.pan !== undefined) {
      this.master.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.4);
    }
  }

  // Mechanical relay + rack-door latch. One short burst, no music.
  click(strength = 1) {
    if (!this.ctx || this.state !== 'running') return;
    const t = this.ctx.currentTime;
    if (t - this._lastClick < 0.06) return;
    this._lastClick = t;
    const ctx = this.ctx;

    // metal-on-metal transient
    const burst = ctx.createBufferSource();
    burst.buffer = this._noiseBuffer(0.06, false);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1450;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600;
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16 * strength, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    burst.connect(hp); hp.connect(bp); bp.connect(g); g.connect(this.master);
    burst.start(t); burst.stop(t + 0.07);

    // low latch thunk
    const thunk = ctx.createOscillator();
    thunk.type = 'triangle';
    thunk.frequency.setValueAtTime(148, t);
    thunk.frequency.exponentialRampToValueAtTime(62, t + 0.09);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.0001, t);
    tg.gain.exponentialRampToValueAtTime(0.09 * strength, t + 0.006);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    thunk.connect(tg); tg.connect(this.master);
    thunk.start(t); thunk.stop(t + 0.16);
  }

  // Gentle two-note chime when the tour moves.
  chime() {
    if (!this.ctx || this.state !== 'running') return;
    const t = this.ctx.currentTime;
    const ctx = this.ctx;
    const notes = [
      { f: 659.25, at: 0, dur: 0.85 },
      { f: 987.77, at: 0.085, dur: 1.1 },
    ];
    for (const n of notes) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = n.f;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = n.f * 2.004;
      const g = ctx.createGain();
      const g2 = ctx.createGain();
      const at = t + n.at;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.055, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + n.dur);
      g2.gain.setValueAtTime(0.0001, at);
      g2.gain.exponentialRampToValueAtTime(0.012, at + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, at + n.dur * 0.55);
      o.connect(g); g.connect(this.master);
      o2.connect(g2); g2.connect(this.master);
      o.start(at); o.stop(at + n.dur + 0.05);
      o2.start(at); o2.stop(at + n.dur + 0.05);
    }
  }
}
