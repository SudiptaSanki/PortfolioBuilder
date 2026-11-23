// Radio Cosmos — bench console, spectrum figure, opt-in sonification.
// No autoplay: the AudioContext is created only inside the button handler.
(function () {
  'use strict';

  /* ---------- mobile navigation ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = 'Menu';
      }
    });
  }

  /* ---------- UTC clock in the console head ---------- */
  var clock = document.getElementById('clockReadout');
  if (clock) {
    var tick = function () {
      var now = new Date();
      var hh = String(now.getUTCHours()).padStart(2, '0');
      var mm = String(now.getUTCMinutes()).padStart(2, '0');
      var ss = String(now.getUTCSeconds()).padStart(2, '0');
      clock.textContent = hh + ':' + mm + ':' + ss + ' UTC';
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- spectrum figure ---------- */
  var canvas = document.getElementById('spectrum');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 900, H = 520;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeCanvas() {
      W = Math.max(280, Math.round(canvas.clientWidth || 900));
      H = Math.round(W * (W < 520 ? 0.62 : 520 / 900));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.height = H + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    sizeCanvas();

    // deterministic pseudo-noise so the figure does not shimmer between loads
    var seed = 7;
    function rnd() {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    }
    var noise = [];
    for (var i = 0; i < 220; i++) noise.push(rnd());

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0e16';
      ctx.fillRect(0, 0, W, H);

      var mL = W < 520 ? 34 : 56;
      var mR = W - (W < 520 ? 14 : 28);
      // ruled amplitude grid
      ctx.strokeStyle = 'rgba(233,230,220,0.055)';
      ctx.lineWidth = 1;
      for (var gy = 1; gy < 8; gy++) {
        var yy = 40 + (gy - 1) * ((H - 96) / 7);
        ctx.beginPath();
        ctx.moveTo(mL, yy);
        ctx.lineTo(mR, yy);
        ctx.stroke();
      }
      // frequency rulers
      var f0 = 1380, f1 = 1460;
      for (var f = f0; f <= f1; f += 10) {
        var x = mL + ((f - f0) / (f1 - f0)) * (mR - mL);
        ctx.strokeStyle = f === 1420 ? 'rgba(227,163,63,0.5)' : 'rgba(233,230,220,0.16)';
        ctx.beginPath();
        ctx.moveTo(x, H - 46);
        ctx.lineTo(x, H - 38);
        ctx.stroke();
        if (f % 20 === 0) {
          ctx.fillStyle = 'rgba(146,155,168,0.8)';
          ctx.font = '10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(f), x, H - 24);
        }
      }
      ctx.fillStyle = 'rgba(146,155,168,0.55)';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textAlign = 'right';
      ctx.fillText('MHz', mR, H - 8);
      ctx.textAlign = 'left';
      ctx.fillText('T_A (K)', 8, 22);

      // baseline noise profile, with a broad absorption trough at 1410 MHz
      var pts = [];
      for (var px = mL; px <= mR; px += 3) {
        var freq = f0 + ((px - mL) / (mR - mL)) * (f1 - f0);
        var idx = Math.floor((px / W) * noise.length) % noise.length;
        var trough = (H * -0.14) * Math.exp(-Math.pow((freq - 1410) / 6.5, 2));
        var emission = 22 * Math.exp(-Math.pow((freq - 1420.4) / 0.9, 2));
        var fringe = 3.1 * Math.sin((px / (mR - mL)) * Math.PI * 2 * 26 + t * 0.0004);
        var base = (H * 0.40) + (noise[idx] - 0.5) * 22 + trough + emission + fringe;
        pts.push([px, base]);
      }
      // filled band under the trace
      ctx.beginPath();
      ctx.moveTo(pts[0][0], H - 46);
      for (var k = 0; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.lineTo(pts[pts.length - 1][0], H - 46);
      ctx.closePath();
      var grad = ctx.createLinearGradient(0, 80, 0, H - 46);
      grad.addColorStop(0, 'rgba(227,163,63,0.16)');
      grad.addColorStop(1, 'rgba(227,163,63,0)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      for (var m = 0; m < pts.length; m++) {
        if (m === 0) ctx.moveTo(pts[m][0], pts[m][1]);
        else ctx.lineTo(pts[m][0], pts[m][1]);
      }
      ctx.strokeStyle = '#e3a33f';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // annotate the hydrogen line
      var hx = mL + ((1420.4 - f0) / (f1 - f0)) * (mR - mL);
      ctx.strokeStyle = 'rgba(233,230,220,0.35)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, 40);
      ctx.lineTo(hx, H - 46);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e9e6dc';
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('H I 1420.406', hx + 8, 56);
      ctx.fillStyle = 'rgba(146,155,168,0.9)';
      ctx.fillText('z = 0.42 absorption', mL + 14, H - 60);
    }

    draw(0);
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { sizeCanvas(); draw(performance.now()); }, 140);
    });
    if (!reduce) {
      var raf;
      var start = performance.now();
      var loop = function (now) {
        draw(now - start);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) cancelAnimationFrame(raf);
        else raf = requestAnimationFrame(loop);
      });
    }
  }

  /* ---------- interferometer panel ---------- */
  var baseline = document.getElementById('baseline');
  var freq = document.getElementById('freq');
  var C = 299792458;

  function fmt(n, digits) {
    return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function updateBaseline() {
    if (!baseline || !freq) return;
    var B = Number(baseline.value);
    var fMHz = Number(freq.value);
    var lambdaCm = (C / (fMHz * 1e6)) * 100;
    var fringeArcsec = (lambdaCm / 100 / B) * 206264.8;
    var beamArcmin = ((lambdaCm / 100 / 25) * 206264.8) / 60;

    document.getElementById('baselineOut').textContent = B >= 1000 ? fmt(B / 1000, 2) + ' km' : B + ' m';
    document.getElementById('freqOut').textContent = fmt(fMHz, 0) + ' MHz';
    document.getElementById('rWave').textContent = fmt(lambdaCm, lambdaCm < 100 ? 1 : 0) + ' cm';
    document.getElementById('rFringe').textContent =
      fringeArcsec < 1 ? fmt(fringeArcsec * 1000, 1) + ' mas' : fmt(fringeArcsec, fringeArcsec < 100 ? 2 : 1) + '″';
    document.getElementById('rBeam').textContent =
      beamArcmin < 60 ? fmt(beamArcmin, 1) + '′' : fmt(beamArcmin / 60, 2) + '°';

    var artB = document.getElementById('artB');
    var artBase = document.getElementById('artBase');
    var artLabel = document.getElementById('artLabel');
    var artA = document.getElementById('artA');
    if (artB) {
      var x2 = 60 + Math.min(1, Math.pow(B / 3000, 0.6)) * 240;
      artB.setAttribute('x1', x2);
      artB.setAttribute('x2', x2);
      artBase.setAttribute('x2', x2);
      artLabel.setAttribute('x', (60 + x2) / 2);
      artLabel.textContent = B >= 1000 ? fmt(B / 1000, 2) + ' km' : B + ' m';
      artA.setAttribute('opacity', '1');
    }
  }

  function updateDispersion() {
    var dm = document.getElementById('dm');
    if (!dm) return;
    var d = Number(dm.value);
    var fh = Number(document.getElementById('fhi').value);
    var fl = Number(document.getElementById('flo').value);
    if (fh <= fl) { fh = fl + 0.05; }
    var delay = 4.149 * d * (1 / (fl * fl) - 1 / (fh * fh)) * 1000; // ms, low channel arrives last
    var sweep = Math.abs(4.149 * d * (1 / (fl * fl) - 1 / (fh * fh)));
    document.getElementById('dmOut').textContent = fmt(d, 0) + ' pc cm⁻³';
    document.getElementById('fhiOut').textContent = fmt(fh, 2) + ' GHz';
    document.getElementById('floOut').textContent = fmt(fl, 2) + ' GHz';
    document.getElementById('rDelay').textContent = delay > 1000 ? fmt(delay / 1000, 2) + ' s' : fmt(delay, 0) + ' ms';
    document.getElementById('rSweep').textContent = fmt(sweep, sweep < 1 ? 3 : 2) + ' s across band';

    var hi = document.getElementById('pulseHi');
    var lo = document.getElementById('pulseLo');
    if (hi && lo) {
      var shift = Math.min(64, 4 * Math.log10(1 + d / 20));
      lo.setAttribute('transform', 'translate(' + shift + ',0)');
      lo.setAttribute('opacity', String(Math.max(0.28, 0.95 - shift / 100)));
    }
  }

  ['baseline', 'freq'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateBaseline);
  });
  ['dm', 'fhi', 'flo'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateDispersion);
  });
  updateBaseline();
  updateDispersion();

  /* ---------- opt-in sonification ---------- */
  var audioBtn = document.getElementById('audioBtn');
  var audioLabel = document.getElementById('audioLabel');
  var audioState = document.getElementById('audioState');
  var audioCtx = null;
  var playing = null;

  function stopAudio() {
    if (playing) {
      try {
        playing.forEach(function (node) { node.stop(); });
      } catch (err) { /* already stopped */ }
      playing = null;
    }
    if (audioBtn) audioBtn.setAttribute('aria-pressed', 'false');
    if (audioLabel) audioLabel.textContent = 'Play the pulse';
    if (audioState) audioState.textContent = 'Audio off';
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', function () {
      if (playing) { stopAudio(); return; }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        if (audioState) audioState.textContent = 'This browser has no Web Audio';
        return;
      }
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      var t0 = audioCtx.currentTime + 0.06;
      var dur = 6;
      var master = audioCtx.createGain();
      master.gain.setValueAtTime(0.0001, t0);
      master.gain.exponentialRampToValueAtTime(0.16, t0 + 0.35);
      master.gain.setValueAtTime(0.16, t0 + dur - 0.7);
      master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      master.connect(audioCtx.destination);

      var filt = audioCtx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 1400;
      filt.Q.value = 0.7;
      filt.connect(master);

      // 5.7 ms rotation is 175.4 Hz; the third partial gives the click its edge
      var nodes = [master];
      [175.4, 350.8, 877].forEach(function (hz, i) {
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = i === 2 ? 'triangle' : 'sine';
        osc.frequency.value = hz;
        g.gain.value = i === 0 ? 0.65 : i === 1 ? 0.22 : 0.05;
        osc.connect(g);
        g.connect(filt);
        osc.start(t0);
        osc.stop(t0 + dur + 0.1);
        nodes.push(osc);
      });

      // 11 Hz amplitude comb: the pulse arriving, over and over
      var lfo = audioCtx.createOscillator();
      var lfoGain = audioCtx.createGain();
      lfo.frequency.value = 11;
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);
      lfo.start(t0);
      lfo.stop(t0 + dur);
      nodes.push(lfo);

      playing = nodes;
      audioBtn.setAttribute('aria-pressed', 'true');
      audioLabel.textContent = 'Stop';
      if (audioState) audioState.textContent = 'Playing 175 Hz · 6 s';
      setTimeout(function () {
        if (playing === nodes) stopAudio();
      }, dur * 1000 + 200);
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();
      var validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      if (!name || !validEmail || message.length < 12) {
        status.className = 'form-status err';
        status.textContent = !name ? 'Please add a name.' : !validEmail ? 'That email address does not look complete.' : 'A sentence or two about the source, please.';
        return;
      }
      status.className = 'form-status';
      status.textContent = 'Draft recorded. I answer within five working days.';
      form.reset();
    });
  }
})();
