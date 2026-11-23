/* Brass Lantern Mardi — phrase builder, canvas contour, opt-in Web Audio fanfare.
   No AudioContext is constructed until the visitor presses play. */
(function () {
  'use strict';

  var yearEls = document.querySelectorAll('[data-year]');
  for (var y = 0; y < yearEls.length; y++) yearEls[y].textContent = new Date().getFullYear();

  /* ---- lantern pointer tilt (CSS 3D) ---- */
  var lantern = document.getElementById('lantern');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (lantern && !reduce.matches) {
    var stage = lantern.closest('.hero-art') || lantern;
    stage.addEventListener('pointermove', function (e) {
      var r = lantern.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      lantern.style.transform = 'rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 6).toFixed(2) + 'deg)';
    });
    stage.addEventListener('pointerleave', function () {
      lantern.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  }

  /* ---- booking form ---- */
  var form = document.getElementById('booking-form');
  if (form) {
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var occasion = form.querySelector('#occasion');
      var date = form.querySelector('#date');
      var message = form.querySelector('#message');
      var problems = [];
      if (!name.value.trim()) problems.push('your name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) problems.push('a working email');
      if (!occasion.value) problems.push('the occasion');
      if (!date.value) problems.push('a date');
      if (message.value.trim().length < 12) problems.push('the route or room in a sentence');
      status.hidden = false;
      if (problems.length) {
        status.textContent = 'Still needed: ' + problems.join(', ') + '.';
        status.style.color = '#e8b4a0';
        return;
      }
      status.style.color = '';
      status.textContent = 'Enquiry noted for ' + date.value + '. I reply within two days; during parade week it can be three.';
      form.reset();
      for (var i = 0; i < form.elements.length; i++) form.elements[i].blur();
    });
    var dateInput = form.querySelector('#date');
    if (dateInput) {
      var today = new Date();
      var iso = today.toISOString().slice(0, 10);
      dateInput.min = iso;
    }
  }

  /* ---- phrase state ---- */
  var MAX_NOTES = 8;
  var NOTES = {
    'C4': { freq: 261.63, label: 'C' },
    'D4': { freq: 293.66, label: 'D' },
    'E4': { freq: 329.63, label: 'E' },
    'G4': { freq: 392.00, label: 'G' },
    'Bb4': { freq: 466.16, label: 'B\u266d' }
  };

  var phrase = [];
  var pads = Array.prototype.slice.call(document.querySelectorAll('.pad'));
  var phraseEl = document.getElementById('phrase');
  var emptyEl = document.getElementById('phraseEmpty');
  var scope = document.getElementById('scope');
  var scopeLabel = document.getElementById('scopeLabel');
  var tempo = document.getElementById('tempo');
  var tempoOut = document.getElementById('tempoOut');
  var playBtn = document.getElementById('play');
  var stopBtn = document.getElementById('stop');
  var clearBtn = document.getElementById('clear');
  var audioNote = document.getElementById('audioNote');

  var ctx = null, master = null, analyser = null, analyserData = null;
  var scheduled = [];
  var playing = false;
  var rafId = 0;
  var playStart = 0;
  var phraseDuration = 0;

  if (!scope || !playBtn || !tempo || !clearBtn || !stopBtn || !pads.length) return;

  /* ---- canvas ---- */
  function sizeCanvas() {
    if (!scope) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = scope.getBoundingClientRect();
    var w = Math.max(240, Math.round(rect.width));
    var h = Math.max(100, Math.round(rect.height));
    if (scope.width !== Math.round(w * dpr) || scope.height !== Math.round(h * dpr)) {
      scope.width = Math.round(w * dpr);
      scope.height = Math.round(h * dpr);
    }
    return { w: w, h: h, dpr: dpr };
  }

  function drawContour(level) {
    if (!scope) return;
    var dims = sizeCanvas();
    if (!dims) return;
    var c = scope.getContext('2d');
    var w = dims.w, h = dims.h, dpr = dims.dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);

    /* baseline */
    c.strokeStyle = 'rgba(244,234,217,0.16)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, h - 22);
    c.lineTo(w, h - 22);
    c.stroke();

    if (!phrase.length) {
      c.strokeStyle = 'rgba(226,171,82,0.5)';
      c.beginPath();
      c.moveTo(0, h - 22);
      c.lineTo(w, h - 22);
      c.stroke();
      return;
    }

    var pitchOrder = ['C4', 'D4', 'E4', 'G4', 'Bb4'];
    var gap = w / Math.max(phrase.length, 4);
    var padX = Math.min(26, gap * 0.22);
    var top = 18, bottom = h - 30;

    c.lineWidth = 2;
    c.strokeStyle = '#e2ab52';
    c.beginPath();
    for (var i = 0; i < phrase.length; i++) {
      var idx = pitchOrder.indexOf(phrase[i]);
      var yv = bottom - (idx / (pitchOrder.length - 1)) * (bottom - top);
      var x0 = i * gap + padX;
      var x1 = (i + 1) * gap - padX;
      if (i === 0) c.moveTo(x0, yv); else c.lineTo(x0, yv);
      c.lineTo(x1, yv);
    }
    c.stroke();

    /* nodes */
    for (var j = 0; j < phrase.length; j++) {
      var idx2 = pitchOrder.indexOf(phrase[j]);
      var yv2 = bottom - (idx2 / (pitchOrder.length - 1)) * (bottom - top);
      var cx = j * gap + gap / 2;
      var active = level === j;
      c.beginPath();
      c.arc(cx, yv2, active ? 6 : 3.6, 0, Math.PI * 2);
      c.fillStyle = active ? '#f4ead9' : '#e2ab52';
      c.fill();
    }

    /* live waveform while sounding */
    if (analyser && analyserData) {
      analyser.getByteTimeDomainData(analyserData);
      c.beginPath();
      c.strokeStyle = 'rgba(123,78,168,0.9)';
      c.lineWidth = 1.4;
      for (var k = 0; k < analyserData.length; k += 2) {
        var x = (k / analyserData.length) * w;
        var v = (analyserData[k] - 128) / 128;
        var yv3 = h / 2 + v * (h / 2 - 14);
        if (k === 0) c.moveTo(x, yv3); else c.lineTo(x, yv3);
      }
      c.stroke();
    }
  }

  function renderPhrase(level) {
    if (!phraseEl) return;
    phraseEl.textContent = '';
    if (!phrase.length) {
      var span = document.createElement('span');
      span.className = 'phrase-empty';
      span.id = 'phraseEmpty';
      span.textContent = 'No notes yet';
      phraseEl.appendChild(span);
    } else {
      for (var i = 0; i < phrase.length; i++) {
        var chip = document.createElement('span');
        chip.className = 'chip' + (level === i ? ' playing' : '');
        chip.textContent = NOTES[phrase[i]].label;
        phraseEl.appendChild(chip);
      }
    }
    drawContour(level);
  }

  function pushNote(name) {
    if (!NOTES[name]) return;
    if (phrase.length >= MAX_NOTES) phrase.shift();
    phrase.push(name);
    renderPhrase(-1);
    var pad = pads.filter(function (p) { return p.dataset.note === name; })[0];
    if (pad) {
      pad.classList.add('hit');
      window.setTimeout(function () { pad.classList.remove('hit'); }, 180);
    }
  }

  pads.forEach(function (pad) {
    pad.addEventListener('click', function () {
      pushNote(pad.dataset.note);
      if (ctx && ctx.state === 'running') playPad(pad.dataset.note);
    });
  });

  tempo.addEventListener('input', function () {
    tempoOut.textContent = tempo.value;
  });

  clearBtn.addEventListener('click', function () {
    phrase = [];
    renderPhrase(-1);
  });

  /* ---- audio ---- */
  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserData = new Uint8Array(analyser.fftSize);
      master.connect(analyser);
      analyser.connect(ctx.destination);
      ctx.onerror = function () {
        if (!audioNote) return;
        if (/^Playing/.test(audioNote.textContent)) {
          audioNote.textContent = audioNote.textContent.replace(/\.$/, '') + ' This device has no audio output, so it runs silently.';
        } else {
          audioNote.textContent = 'This device has no audio output, so the phrase runs silently.';
        }
      };
      } catch (err) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function trumpetNote(freq, start, duration, gainOut) {
    var osc = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var filt = ctx.createBiquadFilter();
    var g = ctx.createGain();
    var vib = ctx.createOscillator();
    var vibGain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc2.type = 'square';
    osc2.frequency.value = freq * 1.004;

    vib.type = 'sine';
    vib.frequency.value = 5.2;
    vibGain.gain.value = freq * 0.004;
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);

    filt.type = 'lowpass';
    filt.Q.value = 2.2;
    filt.frequency.setValueAtTime(700, start);
    filt.frequency.linearRampToValueAtTime(4200, start + 0.07);
    filt.frequency.linearRampToValueAtTime(2200, start + duration * 0.85);

    var peak = gainOut || 0.3;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.035);
    g.gain.exponentialRampToValueAtTime(peak * 0.62, start + Math.min(0.16, duration * 0.4));
    g.gain.setValueAtTime(peak * 0.62, start + duration * 0.72);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration + 0.09);

    osc.connect(filt);
    osc2.connect(filt);
    filt.connect(g);
    g.connect(master);

    osc.start(start); osc2.start(start); vib.start(start);
    osc.stop(start + duration + 0.12);
    osc2.stop(start + duration + 0.12);
    vib.stop(start + duration + 0.12);
  }

  function breath(start, gainOut) {
    var len = Math.floor(ctx.sampleRate * 0.09);
    var buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 0.8;
    var g = ctx.createGain();
    g.gain.value = gainOut || 0.04;
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(start);
  }

  function playPad(name) {
    if (!ensureCtx()) return;
    var n = NOTES[name];
    if (!n) return;
    var t = ctx.currentTime + 0.02;
    trumpetNote(n.freq, t, 0.5, 0.26);
    breath(t, 0.035);
  }

  function stopAll() {
    playing = false;
    scheduled = [];
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
      window.setTimeout(function () {
        if (master) master.gain.setValueAtTime(0.5, ctx.currentTime);
      }, 220);
    }
    stopBtn.disabled = true;
    playBtn.disabled = false;
    renderPhrase(-1);
    audioNote.textContent = 'Stopped. Nothing is playing.';
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function playPhrase() {
    if (!phrase.length) {
      audioNote.textContent = 'Add a note or two to the phrase first.';
      return;
    }
    if (!ensureCtx()) {
      audioNote.textContent = 'This browser does not offer Web Audio, so the fanfare cannot play here.';
      return;
    }
    if (playing) stopAll();

    var bpm = parseInt(tempo.value, 10) || 104;
    var beat = 60 / bpm;
    var beatMs = beat * 1000;
    var noteLen = beat * 0.92;
    var start = ctx.currentTime + 0.08;
    phraseDuration = phrase.length * beat + 0.4;

    try {
      for (var i = 0; i < phrase.length; i++) {
        var when = start + i * beat;
        var n = NOTES[phrase[i]];
        trumpetNote(n.freq, when, noteLen, 0.3);
        if (i === 0 || i === phrase.length - 1) breath(when, 0.04);
        scheduled.push({ index: i, at: when });
      }
    } catch (err) {
      audioNote.textContent = (audioNote.textContent || '') + ' This device refused an audio output, so the phrase runs silently.';
    }

    playing = true;
    playStart = performance.now();
    playBtn.disabled = true;
    stopBtn.disabled = false;
    audioNote.textContent = 'Playing ' + phrase.length + ' notes at ' + bpm + ' bpm.';
    scopeLabel.textContent = 'Live waveform';

    function tick() {
      if (!playing) return;
      var elapsed = (performance.now() - playStart) / 1000;
      var level = -1;
      for (var s = 0; s < scheduled.length; s++) {
        var seg = scheduled[s];
        var segStart = (seg.at - start);
        if (elapsed >= segStart - 0.02 && elapsed < segStart + noteLen) level = seg.index;
      }
      renderPhrase(level);
      if (elapsed < phraseDuration) {
        rafId = requestAnimationFrame(tick);
      } else {
        playing = false;
        rafId = 0;
        playBtn.disabled = false;
        stopBtn.disabled = true;
        audioNote.textContent = 'Phrase finished. Press play again for another pass.';
        scopeLabel.textContent = 'Phrase contour';
        renderPhrase(-1);
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  playBtn.addEventListener('click', playPhrase);
  stopBtn.addEventListener('click', stopAll);

  /* initial canvas */
  renderPhrase(-1);
  sizeCanvas();
  window.addEventListener('resize', function () { sizeCanvas(); renderPhrase(-1); });

  /* keep the brass colour honest if the page is opened with no fonts */
  document.documentElement.classList.add('brass-ready');
})();
