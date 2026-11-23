/* Kirtan Lamplight — behaviour, with an opt-in Web Audio phrase preview.
   No AudioContext is created until the visitor presses "Begin". No autoplay. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* -------------------------------------------------------------- nav --- */
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    var closeNav = function () {
      document.body.classList.remove('nav-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    };
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    var mobileNav = document.getElementById('mobileNav');
    if (mobileNav) mobileNav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { closeNav(); menuBtn.focus(); }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------- ragas --- */
  var RAGAS = {
    yaman: {
      name: 'Yaman', thaat: 'Kalyan', time: 'Dusk, 6–9 pm', vadi: 'Ga',
      aro: 'Sa Re Ga Ma(tivra) Pa Dha Ni Sa', degrees: [0, 2, 4, 6, 7, 9, 11, 12],
      latin: ['Sa', 'Re', 'Ga', 'Ma↑', 'Pa', 'Dha', 'Ni', 'Sa↑'],
      deva: ['सा', 'रे', 'ग', 'म', 'प', 'ध', 'नि', 'सां']
    },
    bhairavi: {
      name: 'Bhairavi', thaat: 'Bhairavi', time: 'Morning, and the last raga of a night', vadi: 'Ma',
      aro: 'Sa re ga Ma Pa dha ni Sa', degrees: [0, 1, 3, 5, 7, 8, 10, 12],
      latin: ['Sa', 're', 'ga', 'Ma', 'Pa', 'dha', 'ni', 'Sa↑'],
      deva: ['सा', 'रे', 'ग', 'म', 'प', 'ध', 'नि', 'सां']
    },
    malkauns: {
      name: 'Malkauns', thaat: 'Bhairavi', time: 'Midnight, 12–3 am', vadi: 'Ma',
      aro: 'Sa ga Ma dha ni Sa', degrees: [0, 3, 5, 8, 10, 12],
      latin: ['Sa', 'ga', 'Ma', 'dha', 'ni', 'Sa↑'],
      deva: ['सा', 'ग', 'म', 'ध', 'नि', 'सां']
    },
    durga: {
      name: 'Durga', thaat: 'Bilawal', time: 'Evening, 6–9 pm', vadi: 'Dha',
      aro: 'Sa Re Pa Dha Ni Sa', degrees: [0, 2, 7, 9, 11, 12],
      latin: ['Sa', 'Re', 'Pa', 'Dha', 'Ni', 'Sa↑'],
      deva: ['सा', 'रे', 'प', 'ध', 'नि', 'सां']
    },
    kafi: {
      name: 'Kafi', thaat: 'Kafi', time: 'Night, 9 pm–midnight', vadi: 'Pa',
      aro: 'Sa Re ga Ma Pa Dha ni Sa', degrees: [0, 2, 3, 5, 7, 9, 10, 12],
      latin: ['Sa', 'Re', 'ga', 'Ma', 'Pa', 'Dha', 'ni', 'Sa↑'],
      deva: ['सा', 'रे', 'ग', 'म', 'प', 'ध', 'नि', 'सां']
    }
  };

  var ragaSelect = document.getElementById('raga');
  var responseSelect = document.getElementById('response');
  var tempoInput = document.getElementById('tempo');
  var tempoOut = document.getElementById('tempoOut');
  var volumeInput = document.getElementById('volume');
  var volOut = document.getElementById('volOut');
  var listenBtn = document.getElementById('listenBtn');
  var stopBtn = document.getElementById('stopBtn');
  var statusEl = document.getElementById('audioStatus');
  var keyboard = document.getElementById('keyboard');
  var bolNow = document.getElementById('bolNow');
  var bolLatin = document.getElementById('bolLatin');
  var callBar = document.getElementById('callBar');
  var respBar = document.getElementById('respBar');

  var whiteKeys = [];
  if (keyboard) {
    var whites = 14;
    var blackAfter = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
    for (var w = 0; w < whites; w++) {
      var k = document.createElement('div');
      k.className = 'key white';
      keyboard.appendChild(k);
      whiteKeys.push(k);
    }
    blackAfter.forEach(function (i) {
      var b = document.createElement('div');
      b.className = 'key black';
      b.style.left = ((i + 1) * (100 / whites) - 1.75) + '%';
      keyboard.appendChild(b);
    });
  }

  var updateRagaCard = function () {
    var r = RAGAS[ragaSelect.value];
    if (!r) return;
    document.getElementById('ragaKicker').textContent = 'Raga ' + r.name + ' · ' + r.thaat + ' thaat';
    document.getElementById('ragaTime').textContent = r.time + ' · vadi ' + r.vadi;
    document.getElementById('ragaAro').textContent = 'Aroha · ' + r.aro;
    document.getElementById('ragaAro').setAttribute('lang', 'en');
  };

  if (ragaSelect) {
    ragaSelect.addEventListener('change', function () {
      updateRagaCard();
      if (engine.playing) stopPhrase('Raga changed. Press begin for the new one.');
    });
    updateRagaCard();
  }
  if (tempoInput) {
    tempoInput.addEventListener('input', function () {
      tempoOut.value = tempoInput.value + ' bpm';
      if (engine.playing) stopPhrase('Tempo changed. Press begin to hear it.');
    });
  }
  if (volumeInput) {
    volumeInput.addEventListener('input', function () {
      volOut.value = volumeInput.value + '%';
      engine.setVolume();
    });
  }

  /* --------------------------------------------------------- audio engine --- */
  var engine = {
    ctx: null,
    master: null,
    droneNodes: [],
    noise: null,
    timers: [],
    playing: false,
    autoStop: null,
    supported: !!(window.AudioContext || window.webkitAudioContext),

    volume: function () {
      return (parseInt(volumeInput ? volumeInput.value : '30', 10) || 0) / 100;
    },

    ensure: function () {
      if (!this.supported) return false;
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.ctx.destination);
        this.startDrone();
        this.noise = this.makeNoise();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },

    setVolume: function () {
      if (!this.ctx || !this.master) return;
      var t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.linearRampToValueAtTime(this.volume() * 0.9, t + 0.12);
    },

    makeNoise: function () {
      var len = Math.floor(this.ctx.sampleRate * 0.08);
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      return buf;
    },

    startDrone: function () {
      var ctx = this.ctx;
      var sa = 130.81;
      var droneFreqs = [
        { f: sa, type: 'sawtooth', g: 0.022 },
        { f: sa * 1.004, type: 'sawtooth', g: 0.016 },
        { f: sa * 1.5, type: 'triangle', g: 0.014 },
        { f: sa * 2, type: 'sine', g: 0.008 }
      ];
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 760;
      filter.Q.value = 0.6;
      filter.connect(this.master);
      var self = this;
      droneFreqs.forEach(function (d) {
        var osc = ctx.createOscillator();
        osc.type = d.type;
        osc.frequency.value = d.f;
        var g = ctx.createGain();
        g.gain.value = d.g;
        osc.connect(g);
        g.connect(filter);
        osc.start();
        self.droneNodes.push(osc);
      });
      this.droneFilter = filter;
    },

    note: function (midi, when, dur, gain) {
      var ctx = this.ctx;
      var freq = 440 * Math.pow(2, (midi - 69) / 12);
      var osc = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var g = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc2.type = 'triangle';
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 1.004;
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      filter.Q.value = 0.9;
      var peak = (gain || 0.09);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(peak, when + 0.045);
      g.gain.setValueAtTime(peak, when + Math.max(0.06, dur * 0.55));
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.32);
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      osc.start(when);
      osc2.start(when);
      osc.stop(when + dur + 0.4);
      osc2.stop(when + dur + 0.4);
    },

    click: function (when) {
      if (!this.noise) return;
      var ctx = this.ctx;
      var src = ctx.createBufferSource();
      src.buffer = this.noise;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2800;
      bp.Q.value = 1.6;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.16, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
      src.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      src.start(when);
      src.stop(when + 0.09);
    },

    clearTimers: function () {
      this.timers.forEach(function (t) { window.clearTimeout(t); });
      this.timers = [];
      if (this.autoStop) { window.clearTimeout(this.autoStop); this.autoStop = null; }
    },

    stop: function (immediate) {
      var ctx = this.ctx;
      var master = this.master;
      if (!ctx) return;
      this.clearTimers();
      var now = ctx.currentTime;
      if (master) {
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0.0001, now + (immediate ? 0.04 : 0.22));
      }
      this.playing = false;
      var nodes = this.droneNodes;
      this.droneNodes = [];
      var self = this;
      this.ctx = null;
      this.master = null;
      this.noise = null;
      window.setTimeout(function () {
        nodes.forEach(function (o) { try { o.stop(); } catch (e) { /* already stopped */ } });
        try { ctx.close(); } catch (e) { /* noop */ }
      }, 340);
      listenBtn.setAttribute('aria-pressed', 'false');
      listenBtn.disabled = false;
      stopBtn.disabled = true;
      whiteKeys.forEach(function (k) { k.classList.remove('on'); });
      if (callBar) callBar.classList.remove('active');
      if (respBar) respBar.classList.remove('active');
    }
  };

  var clearHighlight = function () {
    whiteKeys.forEach(function (k) { k.classList.remove('on'); });
  };

  var playPhrase = function () {
    if (!engine.supported) {
      statusEl.textContent = 'This browser does not support Web Audio, so the phrase cannot play. The rest of the page works.';
      return;
    }
    if (engine.playing) return;
    var ok = false;
    try { ok = engine.ensure(); } catch (e) {
      statusEl.textContent = 'The audio could not start in this browser.';
      return;
    }
    if (!ok) return;

    var raga = RAGAS[ragaSelect.value] || RAGAS.yaman;
    var response = responseSelect.value;
    var bpm = parseInt(tempoInput.value, 10) || 76;
    var beat = 60 / bpm;
    var ctx = engine.ctx;
    var start = ctx.currentTime + 0.12;
    var degrees = raga.degrees;
    var midiBase = 60; /* C4 as Sa */

    var callPattern = [0, 1, 2, 3, 4, 3, 2, 1];
    var respPattern = [4, 3, 2, 1, 0, 1, 2, 0];
    var rounds = response === 'jhala' ? 6 : 4;
    var noteDur = response === 'jhala' ? beat * 0.32 : beat * 0.55;
    var events = [];
    var t = 0;
    var idx = 0;
    for (var r = 0; r < rounds; r++) {
      var pattern = (response === 'samvad' && r % 2 === 1) ? respPattern : callPattern;
      var isResp = (response === 'samvad' && r % 2 === 1);
      var pat = pattern;
      if (response === 'jhala') pat = [0, 2, 3, 4, 3, 2, 1, 0];
      for (var p = 0; p < pat.length; p++) {
        var degreeIndex = pat[p] % degrees.length;
        var midi = midiBase + degrees[degreeIndex];
        if (response === 'jhala' && (p === 3 || p === 7)) midi += 12;
        events.push({
          time: start + t,
          at: t,
          midi: midi,
          dur: noteDur * 0.92,
          degree: degreeIndex,
          round: r,
          isResp: isResp,
          count: idx++
        });
        if (response === 'jhala' && p % 2 === 0) events.push({ click: true, time: start + t, at: t });
        t += noteDur;
      }
      t += beat * (response === 'jhala' ? 0.15 : 0.45);
    }

    var last = events[events.length - 1];
    engine.setVolume();
    engine.playing = true;
    listenBtn.setAttribute('aria-pressed', 'true');
    listenBtn.disabled = true;
    stopBtn.disabled = false;

    events.forEach(function (ev) {
      if (ev.click) {
        engine.click(ev.time);
        return;
      }
      engine.note(ev.midi, ev.time, ev.dur, response === 'jhala' ? 0.07 : 0.08);
      var delay = Math.max(0, (ev.at) * 1000);
      engine.timers.push(window.setTimeout(function () {
        if (!engine.playing) return;
        clearHighlight();
        var keyIndex = (ev.degree * 2) % whiteKeys.length;
        if (whiteKeys[keyIndex]) whiteKeys[keyIndex].classList.add('on');
        var deva = raga.deva[ev.degree] || raga.deva[0];
        var latin = raga.latin[ev.degree] || raga.latin[0];
        bolNow.textContent = deva;
        bolLatin.textContent = latin + (ev.isResp ? ' · the room' : ' · the leader');
        if (callBar) callBar.classList.toggle('active', !ev.isResp);
        if (respBar) respBar.classList.toggle('active', ev.isResp);
      }, delay));
    });

    statusEl.textContent = 'Playing: Raga ' + raga.name + ', ' + (response === 'samvad' ? 'call and response' : (response === 'jhala' ? 'jhala' : 'leader alone')) +
      ', ' + bpm + ' bpm. Nothing is recorded; stop whenever you like.';

    var total = (last.at + last.dur + 0.9) * 1000;
    engine.autoStop = window.setTimeout(function () {
      if (!engine.playing) return;
      engine.stop();
      bolNow.textContent = '—';
      bolLatin.textContent = 'phrase finished';
      statusEl.textContent = 'The phrase has finished. Press begin to hear it again, or change the raga.';
    }, total);
  };

  var stopPhrase = function (message) {
    if (!engine.ctx) {
      statusEl.textContent = message || 'Audio is off.';
      return;
    }
    engine.stop();
    bolNow.textContent = '—';
    bolLatin.textContent = 'stopped';
    statusEl.textContent = message || 'Stopped. Nothing is playing.';
  };

  if (listenBtn) {
    listenBtn.addEventListener('click', playPhrase);
    stopBtn.addEventListener('click', function () { stopPhrase('Stopped. Nothing is playing.'); });
  }

  /* ----------------------------------------------------------- reveals --- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------- contact form --- */
  var form = document.getElementById('kirtanForm');
  if (form) {
    var success = document.getElementById('rSuccess');
    var rules = {
      rfName: function (v) { return v.trim().length >= 2; },
      rfEmail: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      rfDate: function (v) { return v !== ''; },
      rfType: function (v) { return v !== ''; },
      rfMessage: function (v) { return v.trim().length >= 20; }
    };
    var check = function (id) {
      var el = document.getElementById(id);
      if (!el) return null;
      var ok = rules[id](el.value);
      var wrap = el.closest('.f-field');
      if (wrap) wrap.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var h = function () {
        var wrap = el.closest('.f-field');
        if (wrap && wrap.classList.contains('invalid')) check(id);
      };
      el.addEventListener('input', h);
      el.addEventListener('change', h);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (id) {
        if (check(id) === false && !firstBad) firstBad = document.getElementById(id);
      });
      if (firstBad) {
        firstBad.focus();
        if (success) success.hidden = true;
        return;
      }
      if (success) {
        var nameEl = document.getElementById('rfName');
        var slot = document.getElementById('rSuccessName');
        if (slot) slot.textContent = nameEl && nameEl.value.trim() ? nameEl.value.trim().split(' ')[0] : 'friend';
        success.hidden = false;
        success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      form.reset();
      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var wrap = el.closest('.f-field');
        if (wrap) wrap.classList.remove('invalid');
        el.removeAttribute('aria-invalid');
      });
    });
  }
})();
