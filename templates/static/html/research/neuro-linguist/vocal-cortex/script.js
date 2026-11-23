/* Vocal Cortex — Mira Halvorsen
   Canvas 1: averaged ERP traces and electrode map (figure).
   Canvas 2: synthetic spectrogram from a source–filter model.
   Canvas 3: ERP preview waveform and tone schedule.
   Web Audio is created only after an explicit play action. No autoplay. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- navigation ---------- */

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  function fit(canvas, logicalW, logicalH) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(w / logicalW, 0, 0, h / logicalH, 0, 0);
    return ctx;
  }

  /* ---------- figure 1: ERP traces ---------- */

  var erpCanvas = document.getElementById('erpCanvas');

  function drawErpFigure() {
    if (!erpCanvas) return;
    var W = 720, H = 620;
    var c = fit(erpCanvas, W, H);
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#fbfbf8';
    c.fillRect(0, 0, W, H);

    var plotL = 70, plotR = W - 26, plotT = 66, plotB = 372;
    var plotW = plotR - plotL, plotH = plotB - plotT;
    var tMin = -200, tMax = 1000;
    function X(t) { return plotL + (t - tMin) / (tMax - tMin) * plotW; }

    // grid
    c.strokeStyle = 'rgba(18,21,26,0.09)';
    c.lineWidth = 1;
    for (var t = -200; t <= 1000; t += 200) {
      var x = X(t);
      c.beginPath();
      c.moveTo(x, plotT);
      c.lineTo(x, plotB);
      c.stroke();
      c.fillStyle = '#7a828d';
      c.font = '15px "Chivo Mono", monospace';
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(t === 0 ? '0' : String(t), x, plotB + 8);
    }
    for (var v = -4; v <= 4; v += 2) {
      var y = plotT + plotH / 2 - v / 5 * plotH / 2;
      c.beginPath();
      c.moveTo(plotL, y);
      c.lineTo(plotR, y);
      c.stroke();
      c.fillStyle = '#7a828d';
      c.textAlign = 'right';
      c.textBaseline = 'middle';
      c.fillText((v > 0 ? '+' : '') + v, plotL - 8, y);
    }
    c.strokeStyle = 'rgba(18,21,26,0.5)';
    c.beginPath();
    c.moveTo(plotL, plotT);
    c.lineTo(plotL, plotB);
    c.lineTo(plotR, plotB);
    c.stroke();

    // stimulus markers
    c.fillStyle = 'rgba(43,63,208,0.08)';
    c.fillRect(X(0), plotT, X(120) - X(0), plotH);

    // traces: three channels, each a sum of components with noise-like wiggle
    var channels = [
      { color: '#2b3fd0', width: 1.8, n400: 4.6, p600: 1.4, offset: 0, phase: 0.2 },
      { color: '#b8462f', width: 1.4, n400: 2.1, p600: 3.9, offset: 0, phase: 1.6 },
      { color: '#7a828d', width: 1.2, n400: 0.9, p600: 1.1, offset: 0, phase: 3.1 }
    ];

    function curve(ch, t) {
      var ms = t / 1000;
      var base = -0.35 * Math.exp(-Math.pow((t + 100) / 60, 2)); // early sensory
      var n4 = -ch.n400 * Math.exp(-Math.pow((t - 382) / 95, 2));
      var p6 = ch.p600 * Math.exp(-Math.pow((t - 612) / 150, 2));
      var slow = -0.5 * Math.exp(-Math.pow((t - 260) / 220, 2));
      var ripple = 0.22 * Math.sin(t * 0.021 + ch.phase) * Math.exp(-Math.pow((t - 300) / 500, 2));
      return base + n4 + p6 + slow + ripple;
    }

    channels.forEach(function (ch) {
      c.beginPath();
      var started = false;
      for (var t2 = tMin; t2 <= tMax; t2 += 4) {
        var y = plotT + plotH / 2 - curve(ch, t2) / 5 * (plotH / 2);
        if (!started) { c.moveTo(X(t2), y); started = true; } else { c.lineTo(X(t2), y); }
      }
      c.strokeStyle = ch.color;
      c.lineWidth = ch.width;
      c.lineJoin = 'round';
      c.stroke();
    });

    // component markers
    [{ t: 382, label: 'N400' }, { t: 612, label: 'P600' }].forEach(function (m) {
      var x2 = X(m.t);
      c.save();
      c.strokeStyle = 'rgba(18,21,26,0.4)';
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(x2, plotT);
      c.lineTo(x2, plotB);
      c.stroke();
      c.restore();
      c.fillStyle = '#12151a';
      c.font = '15px "Chivo Mono", monospace';
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText(m.label, x2, plotT - 6);
    });

    // axis titles
    c.fillStyle = '#4d545e';
    c.font = '15px "Chivo Mono", monospace';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('Grand-average amplitude, µV', 18, 16);
    c.textAlign = 'right';
    c.fillText('time from word onset, ms', plotR, plotB + 24);

    // head map
    var hx = W / 2, hy = 512, hr = 66;
    c.strokeStyle = 'rgba(18,21,26,0.5)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(hx, hy, hr, 0, Math.PI * 2);
    c.stroke();
    // nose
    c.beginPath();
    c.moveTo(hx - 12, hy - hr + 3);
    c.lineTo(hx, hy - hr - 12);
    c.lineTo(hx + 12, hy - hr + 3);
    c.stroke();
    // ears
    c.beginPath();
    c.arc(hx - hr, hy, 8, -Math.PI / 2, Math.PI / 2);
    c.stroke();
    c.beginPath();
    c.arc(hx + hr, hy, 8, Math.PI / 2, Math.PI * 1.5);
    c.stroke();

    // electrodes
    var positions = [
      [-0.55, -0.42], [-0.26, -0.5], [0.02, -0.52], [0.3, -0.48], [0.56, -0.38],
      [-0.66, -0.1], [-0.34, -0.16], [-0.08, -0.18], [0.18, -0.16], [0.44, -0.12], [0.68, -0.06],
      [-0.7, 0.16], [-0.4, 0.1], [-0.14, 0.1], [0.12, 0.1], [0.38, 0.12], [0.72, 0.18],
      [-0.58, 0.42], [-0.3, 0.36], [-0.04, 0.34], [0.24, 0.36], [0.5, 0.42]
    ];
    positions.forEach(function (p) {
      var px = hx + p[0] * hr;
      var py = hy + p[1] * hr;
      c.beginPath();
      c.arc(px, py, 3, 0, Math.PI * 2);
      c.fillStyle = '#c9ced4';
      c.fill();
      c.strokeStyle = 'rgba(18,21,26,0.35)';
      c.lineWidth = 0.8;
      c.stroke();
    });
    // highlighted N400 region (left temporal / midline)
    [[-0.4, 0.1], [-0.14, 0.1], [-0.3, 0.36], [-0.04, 0.34]].forEach(function (p) {
      c.beginPath();
      c.arc(hx + p[0] * hr, hy + p[1] * hr, 5, 0, Math.PI * 2);
      c.fillStyle = 'rgba(43,63,208,0.85)';
      c.fill();
    });
    // highlighted P600 region (parietal)
    [[0.12, 0.1], [0.24, 0.36], [0.38, 0.12]].forEach(function (p) {
      c.beginPath();
      c.arc(hx + p[0] * hr, hy + p[1] * hr, 5, 0, Math.PI * 2);
      c.fillStyle = 'rgba(184,70,47,0.85)';
      c.fill();
    });

    c.fillStyle = '#4d545e';
    c.font = '13px "Chivo Mono", monospace';
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('32-channel montage · N400 left temporal, P600 parietal', hx, hy + hr + 14);
  }

  if (erpCanvas) {
    drawErpFigure();
    if ('ResizeObserver' in window) new ResizeObserver(drawErpFigure).observe(erpCanvas);
    else window.addEventListener('resize', drawErpFigure);
  }

  /* ---------- formant model ---------- */

  var VOWELS = {
    a: { name: '/a/', f: [730, 1090, 2440] },
    e: { name: '/e/', f: [530, 1840, 2480] },
    i: { name: '/i/', f: [270, 2290, 3010] },
    o: { name: '/o/', f: [570, 840, 2410] },
    u: { name: '/u/', f: [300, 870, 2240] }
  };

  var spectro = document.getElementById('spectrogramCanvas');
  var mini = document.getElementById('erpMiniCanvas');
  if (spectro) bootBench();

  function bootBench() {
    var state = {
      vowel: 'a',
      f0: 118,
      tract: 17.5,
      playing: false,
      erpPlaying: false,
      timers: []
    };

    var el = {
      f0: document.getElementById('f0'),
      tract: document.getElementById('tract')
    };
    var out = {
      f0: document.getElementById('f0Out'),
      tract: document.getElementById('tractOut'),
      f1: document.getElementById('f1'),
      f2: document.getElementById('f2'),
      f3: document.getElementById('f3'),
      fdiff: document.getElementById('fdiff'),
      sgVowel: document.getElementById('sgVowel'),
      audio: document.getElementById('audioStatus'),
      erpStatus: document.getElementById('erpStatus'),
      playVowel: document.getElementById('playVowel'),
      stop: document.getElementById('stopSound'),
      playErp: document.getElementById('playErp')
    };

    function formants() {
      var scale = 17.5 / state.tract;
      return VOWELS[state.vowel].f.map(function (f) { return Math.round(f * scale); });
    }

    function renderReadouts() {
      var f = formants();
      out.f0.textContent = state.f0 + ' Hz';
      out.tract.textContent = state.tract.toFixed(1) + ' cm';
      out.f1.textContent = f[0];
      out.f2.textContent = f[1];
      out.f3.textContent = f[2];
      out.fdiff.textContent = f[1] - f[0];
      out.sgVowel.textContent = VOWELS[state.vowel].name + ' · F1 ' + f[0] + ' · F2 ' + f[1] + ' · F3 ' + f[2] + ' Hz';
    }

    function formantAt(t) {
      // neutral schwa at the edges, target vowel in the middle
      var target = formants();
      var neutral = [500 * 17.5 / state.tract, 1500 * 17.5 / state.tract, 2500 * 17.5 / state.tract];
      var k = 1;
      if (t < 0.16) k = t / 0.16;
      else if (t > 1.04) k = Math.max(0, (1.2 - t) / 0.16);
      return target.map(function (f, i) { return neutral[i] + (f - neutral[i]) * k; });
    }

    function drawSpectrogram() {
      var cssW = spectro.getBoundingClientRect().width || 900;
      var narrow = cssW < 560;
      var W = narrow ? 480 : 900;
      var H = narrow ? 560 : 360;
      var c = fit(spectro, W, H);
      c.clearRect(0, 0, W, H);

      var padL = narrow ? 44 : 46, padR = narrow ? 24 : 10, padT = 12, padB = narrow ? 50 : 30;
      var plotW = W - padL - padR;
      var plotH = H - padT - padB;
      var fMax = 4000, dur = 1.2;

      // heatmap, computed at half resolution for speed
      var imgW = Math.round(plotW / 2);
      var imgH = Math.round(plotH / 2);
      var img = c.createImageData(imgW, imgH);
      var data = img.data;
      var ramp = [
        [11, 14, 18], [58, 40, 38], [126, 56, 46], [184, 70, 47], [216, 145, 92], [250, 235, 214]
      ];
      function color(v) {
        var x = Math.max(0, Math.min(0.999, v)) * (ramp.length - 1);
        var i = Math.floor(x);
        var f = x - i;
        var a = ramp[i], b = ramp[Math.min(ramp.length - 1, i + 1)];
        return [
          a[0] + (b[0] - a[0]) * f,
          a[1] + (b[1] - a[1]) * f,
          a[2] + (b[2] - a[2]) * f
        ];
      }
      for (var py = 0; py < imgH; py++) {
        var f = (1 - py / imgH) * fMax;
        for (var px = 0; px < imgW; px++) {
          var t = px / imgW * dur;
          var fs = formantAt(t);
          var energy = 0;
          // formant envelope
          for (var i2 = 0; i2 < 3; i2++) {
            var bw = 90 + i2 * 30;
            var d = (f - fs[i2]) / bw;
            energy += Math.exp(-d * d) * (i2 === 0 ? 1 : i2 === 1 ? 0.62 : 0.35);
          }
          // harmonic comb
          var nearest = Math.round(f / state.f0);
          var offset = Math.abs(f - nearest * state.f0);
          var comb = Math.exp(-Math.pow(offset / (state.f0 * 0.16), 2)) / Math.pow(Math.max(1, nearest), 0.55);
          var v = energy * comb * 1.9 + energy * 0.12;
          v += 0.02 * (Math.sin(px * 0.4) * 0.5 + 0.5) * Math.exp(-Math.pow((f - 200) / 2400, 2));
          var rgb = color(Math.min(1, Math.pow(v, 0.7)));
          var idx = (py * imgW + px) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = 255;
        }
      }
      // putImageData ignores the transform, so draw at device coordinates
      var scaleX = spectro.width / W;
      var scaleY = spectro.height / H;
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      if (!drawSpectrogram.tmp) drawSpectrogram.tmp = document.createElement('canvas');
      var tmp = drawSpectrogram.tmp;
      if (tmp.width !== imgW || tmp.height !== imgH) { tmp.width = imgW; tmp.height = imgH; }
      tmp.getContext('2d').putImageData(img, 0, 0);
      c.imageSmoothingEnabled = true;
      c.drawImage(tmp, padL * scaleX, padT * scaleY, plotW * scaleX, plotH * scaleY);
      c.restore();

      // axes
      c.strokeStyle = 'rgba(223,229,234,0.25)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(padL, padT);
      c.lineTo(padL, padT + plotH);
      c.lineTo(padL + plotW, padT + plotH);
      c.stroke();

      c.font = (narrow ? 14 : 11) + 'px "Chivo Mono", monospace';
      c.fillStyle = '#aab4bd';
      c.textAlign = 'right';
      c.textBaseline = 'middle';
      [0, 1, 2, 3, 4].forEach(function (k) {
        var y = padT + plotH - (k * 1000 / fMax) * plotH;
        c.fillText(k + 'k', padL - 6, y);
        c.strokeStyle = 'rgba(223,229,234,0.10)';
        c.beginPath();
        c.moveTo(padL, y);
        c.lineTo(padL + plotW, y);
        c.stroke();
      });
      c.textAlign = 'center';
      c.textBaseline = 'top';
      [0, 0.3, 0.6, 0.9, 1.2].forEach(function (t3) {
        var x = padL + (t3 / dur) * plotW;
        c.fillStyle = '#aab4bd';
        c.fillText(t3.toFixed(1), x, padT + plotH + 7);
      });
      c.textAlign = 'left';
      c.fillText('s', padL + plotW + 2, padT + plotH + 7);

      // formant tracks
      c.save();
      c.setLineDash([4, 4]);
      c.lineWidth = 1.2;
      ['#dfe5ea', '#9fb0ff', '#c9ced4'].forEach(function (col, i3) {
        c.strokeStyle = col;
        c.beginPath();
        for (var px2 = 0; px2 <= plotW; px2 += 6) {
          var t4 = px2 / plotW * dur;
          var fv = formantAt(t4)[i3];
          var y2 = padT + plotH - (fv / fMax) * plotH;
          if (px2 === 0) c.moveTo(padL + px2, y2); else c.lineTo(padL + px2, y2);
        }
        c.stroke();
      });
      c.restore();
    }

    /* ----- audio ----- */

    var audioCtx = null;
    var activeNode = null;
    var masterGain = null;

    function setStatus(text, on) {
      if (!out.audio) return;
      out.audio.textContent = text;
      out.audio.classList.toggle('is-on', !!on);
    }

    function ensureAudio() {
      try {
        if (!audioCtx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) { setStatus('audio unavailable'); return null; }
          audioCtx = new AC();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
      } catch (e) {
        setStatus('audio blocked');
        return null;
      }
    }

    function stopAll() {
      state.timers.forEach(function (t) { clearTimeout(t); });
      state.timers = [];
      if (activeNode) {
        try {
          if (masterGain) {
            masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
            masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.02);
          }
          activeNode.stop(audioCtx.currentTime + 0.1);
        } catch (e) { /* already stopped */ }
        activeNode = null;
      }
      state.playing = false;
      state.erpPlaying = false;
      if (out.stop) out.stop.disabled = true;
      setStatus('sound off', false);
    }

    function playVowel() {
      var ac = ensureAudio();
      if (!ac) return;
      stopAll();
      var f = formants();
      var now = ac.currentTime + 0.02;
      var dur = 1.2;

      var osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(state.f0 * 1.02, now);
      osc.frequency.linearRampToValueAtTime(state.f0 * 0.97, now + dur);

      // vibrato
      var lfo = ac.createOscillator();
      var lfoGain = ac.createGain();
      lfo.frequency.value = 5.2;
      lfoGain.gain.value = state.f0 * 0.008;
      lfo.connect(lfoGain).connect(osc.frequency);

      masterGain = ac.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.16, now + 0.05);
      masterGain.gain.setValueAtTime(0.16, now + dur - 0.14);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      masterGain.connect(ac.destination);

      var gains = [1.0, 0.55, 0.28];
      var qs = [9, 11, 13];
      f.forEach(function (freq, i) {
        var bp = ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = freq;
        bp.Q.value = qs[i];
        var g = ac.createGain();
        g.gain.value = gains[i];
        osc.connect(bp).connect(g).connect(masterGain);
      });

      // a little direct source for body
      var direct = ac.createGain();
      direct.gain.value = 0.06;
      var lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      osc.connect(lp).connect(direct).connect(masterGain);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + dur + 0.02);
      lfo.stop(now + dur + 0.02);
      activeNode = osc;

      state.playing = true;
      if (out.stop) out.stop.disabled = false;
      setStatus('playing ' + VOWELS[state.vowel].name + ' · ' + state.f0 + ' Hz', true);

      state.timers.push(setTimeout(function () {
        if (state.playing) {
          state.playing = false;
          activeNode = null;
          if (out.stop) out.stop.disabled = true;
          setStatus('finished', false);
        }
      }, (dur + 0.1) * 1000));
    }

    function playErpSequence() {
      var ac = ensureAudio();
      if (!ac) return;
      stopAll();
      state.erpPlaying = true;
      if (out.erpStatus) out.erpStatus.textContent = 'playing · 0 / 6';

      var pattern = [1000, 1000, 1000, 1200, 1000, 1000];
      var gap = 0.52;
      var start = ac.currentTime + 0.08;

      pattern.forEach(function (freq, i) {
        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        var t0 = start + i * gap;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
        osc.connect(g).connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + 0.13);
        state.timers.push(setTimeout(function () {
          if (out.erpStatus) out.erpStatus.textContent = 'playing · ' + (i + 1) + ' / 6';
          drawErpMini(i);
        }, (t0 - ac.currentTime) * 1000));
      });

      state.timers.push(setTimeout(function () {
        state.erpPlaying = false;
        if (out.erpStatus) out.erpStatus.textContent = 'finished · 5 standard, 1 deviant';
        drawErpMini(5);
      }, (start - ac.currentTime + pattern.length * gap) * 1000));
    }

    /* ----- ERP mini ----- */

    function drawErpMini(active) {
      if (!mini) return;
      var cssW = mini.getBoundingClientRect().width || 900;
      var narrow = cssW < 560;
      var W = narrow ? 480 : 900;
      var H = narrow ? 320 : 220;
      var c = fit(mini, W, H);
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#0b0e12';
      c.fillRect(0, 0, W, H);

      var padL = narrow ? 26 : 40, padR = narrow ? 10 : 16, padT = 16, padB = narrow ? 40 : 30;
      var plotW = W - padL - padR;
      var plotH = H - padT - padB;
      var tMax = 3400;
      function X(t) { return padL + t / tMax * plotW; }

      // tone markers
      for (var i = 0; i < 6; i++) {
        var t0 = 200 + i * 520;
        var deviant = i === 3;
        c.fillStyle = deviant ? 'rgba(232,178,107,0.22)' : 'rgba(159,176,255,0.10)';
        c.fillRect(X(t0), padT, X(t0 + 120) - X(t0), plotH);
        if (i === active) {
          c.fillStyle = deviant ? 'rgba(232,178,107,0.5)' : 'rgba(159,176,255,0.3)';
          c.fillRect(X(t0), padT, X(t0 + 120) - X(t0), plotH);
        }
        c.fillStyle = deviant ? '#e8b26b' : '#aab4bd';
        c.font = (narrow ? 13 : 10) + 'px "Chivo Mono", monospace';
        c.textAlign = 'center';
        c.textBaseline = 'top';
        c.fillText(deviant ? '1200' : '1000', X(t0 + 60), padT + 4);
      }

      // waveform: a smoothed average, not a raw trace
      c.beginPath();
      for (var px = 0; px <= 720; px++) {
        var t = px / 720 * tMax;
        var v = 0;
        v += -0.55 * Math.exp(-Math.pow((t - 430) / 120, 2));
        v += 0.95 * Math.exp(-Math.pow((t - 620) / 160, 2));
        v += -0.85 * Math.exp(-Math.pow((t - 900) / 100, 2));
        v += 1.0 * Math.exp(-Math.pow((t - 1150) / 150, 2));
        v += -0.35 * Math.exp(-Math.pow((t - 1620) / 170, 2));
        v += 0.4 * Math.exp(-Math.pow((t - 2140) / 180, 2));
        v += 0.25 * Math.exp(-Math.pow((t - 2660) / 180, 2));
        var y = padT + plotH / 2 - v * plotH * 0.3;
        if (px === 0) c.moveTo(X(t), y); else c.lineTo(X(t), y);
      }
      c.strokeStyle = '#9fb0ff';
      c.lineWidth = 1.6;
      c.lineJoin = 'round';
      c.stroke();

      // baseline
      c.strokeStyle = 'rgba(223,229,234,0.16)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(padL, padT + plotH / 2);
      c.lineTo(padL + plotW, padT + plotH / 2);
      c.stroke();

      // component labels
      c.fillStyle = '#aab4bd';
      c.font = (narrow ? 13 : 10) + 'px "Chivo Mono", monospace';
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText('N400', X(900) + 6, padT + plotH * 0.78);
      c.fillText('P600', X(1150) + 8, padT + plotH * 0.12);

      // time axis
      c.fillStyle = '#8b97a2';
      c.textAlign = 'center';
      [0, 1000, 2000, 3000].forEach(function (ms) {
        c.fillText((ms / 1000) + ' s', X(ms), padT + plotH + 8);
      });
    }

    /* ----- wiring ----- */

    document.querySelectorAll('.vowel').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.vowel = btn.getAttribute('data-vowel');
        document.querySelectorAll('.vowel').forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        renderReadouts();
        drawSpectrogram();
      });
    });

    ['input', 'change'].forEach(function (evt) {
      el.f0.addEventListener(evt, function () {
        state.f0 = parseFloat(el.f0.value);
        renderReadouts();
        drawSpectrogram();
      });
      el.tract.addEventListener(evt, function () {
        state.tract = parseFloat(el.tract.value);
        renderReadouts();
        drawSpectrogram();
      });
    });

    if (out.playVowel) out.playVowel.addEventListener('click', playVowel);
    if (out.playErp) out.playErp.addEventListener('click', playErpSequence);
    if (out.stop) out.stop.addEventListener('click', stopAll);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAll();
    });

    renderReadouts();
    drawSpectrogram();
    drawErpMini(-1);
  }

  /* ---------- contact form ---------- */

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var status = document.getElementById('formStatus');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.elements.namedItem('name');
      var email = contactForm.elements.namedItem('email');
      var message = contactForm.elements.namedItem('message');
      var ok = true;
      [name, email, message].forEach(function (field) {
        if (!field) return;
        var bad = !field.value.trim() || (field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field.value));
        field.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) ok = false;
      });
      if (!status) return;
      status.classList.add('is-visible');
      if (!ok) {
        status.classList.add('is-error');
        status.textContent = 'Check the name, email and message — nothing was drafted.';
        return;
      }
      status.classList.remove('is-error');
      status.textContent = 'Draft ready, ' + name.value.trim().split(/\s+/)[0] + '. Nothing was transmitted: copy the text into an email to mira@speechlab.no.';
      contactForm.reset();
    });
  }
})();
