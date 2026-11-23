/* Tectonic seismologist — bulletin bench
   Synthetic network: three stations, one hypocentre, S–P location.
   Sound is opt-in and starts only when the button is pressed. */
(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (document.getElementById('mapCanvas')) initBench();

  function initBench() {
    var VP = 6.0, VS = 3.5;           // km/s, upper crust
    var WIDTH_KM = 200, HEIGHT_KM = 140;
    var STATIONS = [
      { code: 'CONC', x: 38, y: 22, err: 0.12 },
      { code: 'ANGO', x: 150, y: 40, err: -0.18 },
      { code: 'CHIL', x: 96, y: 118, err: 0.09 }
    ];

    var state = {
      x: 62, y: 52, depth: 32, mag: 6.4,
      solved: null, audio: null, playing: false
    };

    var el = {
      map: document.getElementById('mapCanvas'),
      wave: document.getElementById('waveCanvas'),
      depth: document.getElementById('depth'),
      mag: document.getElementById('mag'),
      depthOut: document.getElementById('depthOut'),
      magOut: document.getElementById('magOut'),
      solveBtn: document.getElementById('solveBtn'),
      solveOut: document.getElementById('solveOut'),
      audioBtn: document.getElementById('audioBtn'),
      mapFoot: document.getElementById('mapFoot'),
      waveMeta: document.getElementById('waveMeta'),
      outM0: document.getElementById('outM0'),
      outLen: document.getElementById('outLen'),
      outWid: document.getElementById('outWid'),
      outSlip: document.getElementById('outSlip'),
      outClass: document.getElementById('outClass'),
      outTsunami: document.getElementById('outTsunami'),
      d: [document.getElementById('d0'), document.getElementById('d1'), document.getElementById('d2')],
      t: [document.getElementById('t0'), document.getElementById('t1'), document.getElementById('t2')]
    };

    function fitCanvas(c, aspect) {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.max(240, c.clientWidth || 640);
      var h = Math.round(w / aspect);
      c.style.height = h + 'px';
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      var ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h, ctx: ctx };
    }

    function fmt(n, d) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
    }

    function distance(st, x, y, depth) {
      var dx = x - st.x, dy = y - st.y;
      return Math.sqrt(dx * dx + dy * dy + depth * depth);
    }

    function spTime(km) {
      return km * (1 / VS - 1 / VP);   // seconds
    }

    function latlon(x, y) {
      var lat = -33.0 - (y / HEIGHT_KM) * 3.0;
      var lon = -73.55 + (x / WIDTH_KM) * 2.6;
      return {
        lat: fmt(Math.abs(lat), 2) + '° S',
        lon: fmt(Math.abs(lon), 2) + '° W'
      };
    }

    function rupture(mag) {
      var m0 = Math.pow(10, 1.5 * mag + 9.1);              // N m
      var len = Math.pow(10, 0.59 * mag - 2.44);           // km, Wells & Coppersmith
      var wid = Math.pow(10, 0.32 * mag - 1.01);           // km
      var area = len * wid * 1e6;                          // m^2
      var slip = m0 / (30e9 * area);                       // m, mu = 30 GPa
      return { m0: m0, len: len, wid: wid, slip: slip, area: area };
    }

    function depthClass(d) {
      if (d < 35) return 'Crustal thrust';
      if (d <= 70) return 'Interface (megathrust)';
      return 'Intraslab';
    }

    function tsunami(mag, depth) {
      if (mag >= 8.0 && depth <= 40) return 'Pacific-wide advisory likely';
      if (mag >= 7.5 && depth <= 40) return 'Regional watch — SHOA would issue';
      if (mag >= 7.0 && depth <= 25) return 'Local watch, coastline only';
      return 'No tsunami expected';
    }

    /* ---------- map ---------- */
    var coast = function (y) {
      return 26 + 16 * Math.sin(y / 26) + 8 * Math.sin(y / 9 + 1);
    };

    function drawMap() {
      var fit = fitCanvas(el.map, 1.42);
      var ctx = fit.ctx, W = fit.w, H = fit.h;
      var sx = W / WIDTH_KM, sy = H / HEIGHT_KM;

      ctx.fillStyle = '#d9e0e2';
      ctx.fillRect(0, 0, W, H);

      // land
      ctx.beginPath();
      ctx.moveTo(coast(0) * sx, 0);
      for (var yy = 0; yy <= HEIGHT_KM; yy += 4) ctx.lineTo(coast(yy) * sx, yy * sy);
      ctx.lineTo(W, H);
      ctx.lineTo(W, 0);
      ctx.closePath();
      ctx.fillStyle = '#efe6d2';
      ctx.fill();
      ctx.strokeStyle = '#1a1714';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (var y2 = 0; y2 <= HEIGHT_KM; y2 += 2) {
        var cxp = coast(y2) * sx, cyp = y2 * sy;
        if (y2 === 0) ctx.moveTo(cxp, cyp); else ctx.lineTo(cxp, cyp);
      }
      ctx.stroke();

      // graticule
      ctx.strokeStyle = 'rgba(26,23,20,0.08)';
      ctx.lineWidth = 1;
      for (var gx = 20; gx < WIDTH_KM; gx += 20) {
        ctx.beginPath(); ctx.moveTo(gx * sx, 0); ctx.lineTo(gx * sx, H); ctx.stroke();
      }
      for (var gy = 20; gy < HEIGHT_KM; gy += 20) {
        ctx.beginPath(); ctx.moveTo(0, gy * sy); ctx.lineTo(W, gy * sy); ctx.stroke();
      }

      // plate arrow
      ctx.strokeStyle = '#2d4a5e';
      ctx.fillStyle = '#2d4a5e';
      ctx.lineWidth = 1.4;
      var ax = 34 * sx, ay = 118 * sy;
      ctx.beginPath(); ctx.moveTo(ax - 20, ay); ctx.lineTo(ax, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 6, ay - 4); ctx.lineTo(ax - 6, ay + 4); ctx.closePath(); ctx.fill();
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Nazca → 66 mm/yr', ax - 20, ay - 8);

      // places
      var places = [['Concepción', 44, 18], ['Chillán', 104, 110], ['Los Ángeles', 132, 62], ['Arauco', 30, 52]];
      ctx.fillStyle = 'rgba(26,23,20,0.55)';
      for (var i = 0; i < places.length; i++) {
        var p = places[i];
        ctx.beginPath(); ctx.arc(p[1] * sx, p[2] * sy, 2, 0, Math.PI * 2); ctx.fill();
        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(p[0], p[1] * sx + 5, p[2] * sy + 3);
      }

      // station distance circles
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(124,43,34,0.35)';
      for (var s = 0; s < STATIONS.length; s++) {
        var d = distance(STATIONS[s], state.x, state.y, state.depth);
        ctx.beginPath();
        ctx.arc(STATIONS[s].x * sx, STATIONS[s].y * sy, d * sx, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // station-to-epicentre lines
      ctx.strokeStyle = 'rgba(26,23,20,0.35)';
      ctx.lineWidth = 1;
      for (var k = 0; k < STATIONS.length; k++) {
        ctx.beginPath();
        ctx.moveTo(STATIONS[k].x * sx, STATIONS[k].y * sy);
        ctx.lineTo(state.x * sx, state.y * sy);
        ctx.stroke();
      }

      // rupture footprint
      var r = rupture(state.mag);
      var ang = -0.32;
      ctx.save();
      ctx.translate(state.x * sx, state.y * sy);
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(124,43,34,0.55)';
      ctx.fillStyle = 'rgba(124,43,34,0.10)';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-r.len * sx / 2, -r.wid * sy / 2, r.len * sx, r.wid * sy);
      ctx.strokeRect(-r.len * sx / 2, -r.wid * sy / 2, r.len * sx, r.wid * sy);
      ctx.restore();

      // stations
      for (var t = 0; t < STATIONS.length; t++) {
        var st = STATIONS[t];
        var px = st.x * sx, py = st.y * sy;
        ctx.fillStyle = '#f5f1e8';
        ctx.strokeStyle = '#1a1714';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(px, py - 7);
        ctx.lineTo(px + 6, py + 4);
        ctx.lineTo(px - 6, py + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1a1714';
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(st.code, px + 9, py + 4);
      }

      // epicentre star
      var ex = state.x * sx, ey = state.y * sy;
      ctx.fillStyle = '#7c2b22';
      ctx.strokeStyle = '#f5f1e8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var a = 0; a < 10; a++) {
        var rad = a % 2 === 0 ? 9 : 4;
        var th = -Math.PI / 2 + (a * Math.PI) / 5;
        var xx = ex + Math.cos(th) * rad, yyv = ey + Math.sin(th) * rad;
        if (a === 0) ctx.moveTo(xx, yyv); else ctx.lineTo(xx, yyv);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // depth glyph
      ctx.strokeStyle = 'rgba(124,43,34,0.55)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex, ey + state.depth * sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(26,23,20,0.5)';
      ctx.beginPath();
      ctx.arc(ex, ey + state.depth * sy, 3, 0, Math.PI * 2);
      ctx.stroke();

      // labels
      ctx.fillStyle = '#7c2b22';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      var label = 'M' + fmt(state.mag, 1) + ' · h ' + state.depth + ' km';
      var lx = Math.min(ex + 14, W - 130);
      ctx.fillText(label, lx, ey - 8);

      // scale bar
      ctx.strokeStyle = '#1a1714';
      ctx.fillStyle = '#1a1714';
      ctx.lineWidth = 1;
      var barX = 16, barY = H - 18, barLen = 50 * sx;
      ctx.beginPath();
      ctx.moveTo(barX, barY); ctx.lineTo(barX + barLen, barY);
      ctx.moveTo(barX, barY - 4); ctx.lineTo(barX, barY + 4);
      ctx.moveTo(barX + barLen, barY - 4); ctx.lineTo(barX + barLen, barY + 4);
      ctx.stroke();
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('50 km', barX, barY - 8);

      // north
      ctx.textAlign = 'right';
      ctx.fillText('N ↑', W - 12, 16);

      el.map.setAttribute('aria-label', 'Map of the Chilean margin. Epicentre at ' +
        fmt(state.x, 0) + ' km east and ' + fmt(state.y, 0) + ' km north, ' + state.depth + ' kilometres deep, magnitude ' + fmt(state.mag, 1) + '.');
    }

    /* ---------- waveform ---------- */
    function pseudo(n) {
      var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
      return (x - Math.floor(x)) * 2 - 1;
    }

    function drawWave() {
      var fit = fitCanvas(el.wave, 3.45);
      var ctx = fit.ctx, W = fit.w, H = fit.h;
      ctx.fillStyle = '#fffdf8';
      ctx.fillRect(0, 0, W, H);

      var nearest = 0;
      var dmin = Infinity;
      for (var i = 0; i < STATIONS.length; i++) {
        var dd = distance(STATIONS[i], state.x, state.y, state.depth);
        if (dd < dmin) { dmin = dd; nearest = i; }
      }
      var tP = dmin / VP;
      var tS = dmin / VS;
      var total = 80;
      var amp = Math.pow(10, 0.5 * (state.mag - 6));

      var padL = 40, padR = 14, padT = 16, padB = 26;
      var plotW = W - padL - padR, plotH = H - padT - padB;
      var mid = padT + plotH / 2;

      // grid
      ctx.strokeStyle = 'rgba(26,23,20,0.08)';
      ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var yg = padT + (plotH * g) / 4;
        ctx.beginPath(); ctx.moveTo(padL, yg); ctx.lineTo(W - padR, yg); ctx.stroke();
      }
      for (var gx = 0; gx <= 8; gx++) {
        var xg = padL + (plotW * gx) / 8;
        ctx.beginPath(); ctx.moveTo(xg, padT); ctx.lineTo(xg, padT + plotH); ctx.stroke();
      }

      // trace
      ctx.strokeStyle = '#1a1714';
      ctx.lineWidth = 1;
      ctx.beginPath();
      var N = Math.floor(plotW * 1.4);
      for (var n = 0; n <= N; n++) {
        var tt = (n / N) * total;
        var noise = pseudo(n) * 0.035;
        var pEnv = tt >= tP ? Math.exp(-(tt - tP) / 1.6) : 0;
        var sEnv = tt >= tS ? Math.exp(-(tt - tS) / 5.5) : 0;
        var pSig = pEnv * 0.22 * Math.sin((tt - tP) * 2 * Math.PI * 7.5);
        var sSig = sEnv * 0.9 * Math.sin((tt - tS) * 2 * Math.PI * 2.6) * (1 + 0.3 * Math.sin(tt * 0.7));
        var coda = tt > tS ? 0.18 * Math.exp(-(tt - tS) / 12) * Math.sin(tt * 3.1) * pseudo(n + 11) : 0;
        var v = (noise + amp * (pSig + sSig + coda));
        var x = padL + (tt / total) * plotW;
        var y = mid - Math.max(-1, Math.min(1, v)) * (plotH / 2 - 6);
        if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // arrivals
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#2d4a5e';
      ctx.beginPath();
      ctx.moveTo(padL + (tP / total) * plotW, padT);
      ctx.lineTo(padL + (tP / total) * plotW, padT + plotH);
      ctx.stroke();
      ctx.strokeStyle = '#7c2b22';
      ctx.beginPath();
      ctx.moveTo(padL + (tS / total) * plotW, padT);
      ctx.lineTo(padL + (tS / total) * plotW, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#2d4a5e';
      ctx.textAlign = 'left';
      ctx.fillText('P', padL + (tP / total) * plotW + 3, padT + 10);
      ctx.fillStyle = '#7c2b22';
      ctx.fillText('S', padL + (tS / total) * plotW + 3, padT + 10);

      ctx.fillStyle = '#6b6157';
      ctx.textAlign = 'right';
      ctx.fillText('0 s', padL - 6, padT + plotH);
      ctx.textAlign = 'center';
      for (var s2 = 0; s2 <= 8; s2 += 2) {
        ctx.fillText((s2 * 10) + ' s', padL + (plotW * s2) / 8, padT + plotH + 14);
      }
      ctx.textAlign = 'left';
      ctx.fillText('acceleration', padL - 6, padT - 4);

      el.waveMeta.textContent = STATIONS[nearest].code + ' · ' + fmt(dmin, 0) + ' km · S–P ' + fmt(spTime(dmin), 1) + ' s';
    }

    /* ---------- readouts ---------- */
    function updateReadouts() {
      var r = rupture(state.mag);
      var sup = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
      var exp = Math.floor(Math.log10(r.m0));
      var mant = r.m0 / Math.pow(10, exp);
      el.outM0.textContent = fmt(mant, 1) + ' × 10' + String(exp).split('').map(function (c) { return sup[c]; }).join('') + ' N·m';
      el.outLen.textContent = fmt(r.len, 1) + ' km';
      el.outWid.textContent = fmt(r.wid, 1) + ' km';
      el.outSlip.textContent = fmt(r.slip, 2) + ' m';
      el.outClass.textContent = depthClass(state.depth);
      el.outTsunami.textContent = tsunami(state.mag, state.depth);
      el.outTsunami.className = /watch|advisory|likely/i.test(el.outTsunami.textContent) ? 'wide' : 'wide';
      el.outTsunami.style.color = /watch|advisory|likely/i.test(el.outTsunami.textContent) ? '#7c2b22' : '';

      for (var i = 0; i < STATIONS.length; i++) {
        var d = distance(STATIONS[i], state.x, state.y, state.depth);
        el.d[i].textContent = fmt(d, 0) + ' km';
        el.t[i].textContent = fmt(spTime(d), 1) + ' s';
      }

      var ll = latlon(state.x, state.y);
      el.mapFoot.textContent = 'Hypocentre ' + fmt(state.x, 1) + ' km east, ' + fmt(state.y, 1) +
        ' km north of the grid origin (' + ll.lat + ', ' + ll.lon + '), ' + state.depth + ' km deep. Rupture footprint drawn for M' + fmt(state.mag, 1) + '.';
    }

    function update() {
      state.depth = parseInt(el.depth.value, 10);
      state.mag = parseFloat(el.mag.value);
      el.depthOut.textContent = state.depth + ' km';
      el.magOut.textContent = fmt(state.mag, 1);
      drawMap();
      drawWave();
      updateReadouts();
    }

    /* ---------- solve ---------- */
    function solve() {
      // observed S–P picks carry the station error term, exactly as a real pick would
      var obs = STATIONS.map(function (st) {
        return spTime(distance(st, state.x, state.y, state.depth)) + st.err;
      });
      var best = null;
      for (var x = 0; x <= WIDTH_KM; x += 1) {
        for (var y = 0; y <= HEIGHT_KM; y += 1) {
          var sum = 0;
          for (var i = 0; i < STATIONS.length; i++) {
            var model = spTime(distance(STATIONS[i], x, y, state.depth));
            var res = model - obs[i];
            sum += res * res;
          }
          if (!best || sum < best.sum) best = { x: x, y: y, sum: sum };
        }
      }
      // refine to 0.1 km around the coarse minimum
      for (var iter = 0; iter < 3; iter++) {
        var step = iter === 0 ? 1 : (iter === 1 ? 0.3 : 0.1);
        for (var dx = -1; dx <= 1; dx++) {
          for (var dy = -1; dy <= 1; dy++) {
            var cx = best.x + dx * step, cy = best.y + dy * step;
            if (cx < 0 || cy < 0 || cx > WIDTH_KM || cy > HEIGHT_KM) continue;
            var s2 = 0;
            for (var j = 0; j < STATIONS.length; j++) {
              var m2 = spTime(distance(STATIONS[j], cx, cy, state.depth));
              var r2 = m2 - obs[j];
              s2 += r2 * r2;
            }
            if (s2 < best.sum) best = { x: cx, y: cy, sum: s2 };
          }
        }
      }
      var rms = Math.sqrt(best.sum / STATIONS.length);
      var offset = Math.sqrt(Math.pow(best.x - state.x, 2) + Math.pow(best.y - state.y, 2));
      state.solved = { x: best.x, y: best.y, rms: rms, offset: offset };
      el.solveOut.textContent = 'Recovered ' + fmt(best.x, 1) + ' km E / ' + fmt(best.y, 1) +
        ' km N · ' + fmt(offset, 1) + ' km from the placed hypocentre · RMS ' + fmt(rms, 2) + ' s at h = ' + state.depth + ' km';
    }

    /* ---------- audio, opt-in only ---------- */
    function stopAudio() {
      if (state.audio) {
        try { state.audio.close(); } catch (e) { /* already closed */ }
        state.audio = null;
      }
      state.playing = false;
      el.audioBtn.textContent = 'Play the record';
      el.audioBtn.setAttribute('aria-pressed', 'false');
    }

    function playAudio() {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        el.audioBtn.textContent = 'Audio not available';
        return;
      }
      stopAudio();
      var ctx = new Ctx();
      state.audio = ctx;
      var seconds = 6;
      var rate = ctx.sampleRate;
      var buffer = ctx.createBuffer(1, Math.floor(rate * seconds), rate);
      var data = buffer.getChannelData(0);
      var nearest = 0;
      var dmin = Infinity;
      for (var i = 0; i < STATIONS.length; i++) {
        var dd = distance(STATIONS[i], state.x, state.y, state.depth);
        if (dd < dmin) { dmin = dd; nearest = i; }
      }
      var amp = Math.min(0.9, 0.25 * Math.pow(10, 0.28 * (state.mag - 6)));
      var tP = 0.6, tS = 0.6 + spTime(dmin);
      for (var n = 0; n < data.length; n++) {
        var tt = n / rate;
        var v = (Math.random() - 0.5) * 0.02;
        if (tt >= tP) {
          v += Math.exp(-(tt - tP) / 0.35) * 0.10 * Math.sin(2 * Math.PI * 62 * (tt - tP));
        }
        if (tt >= tS) {
          var env = Math.exp(-(tt - tS) / 1.1);
          v += env * amp * (0.6 * Math.sin(2 * Math.PI * 28 * (tt - tS)) + 0.4 * Math.sin(2 * Math.PI * 41 * (tt - tS)));
          v += env * 0.15 * (Math.random() - 0.5);
        }
        data[n] = Math.max(-1, Math.min(1, v));
      }
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      var gain = ctx.createGain();
      gain.gain.value = 0.8;
      src.connect(gain).connect(ctx.destination);
      src.start(0);
      state.playing = true;
      el.audioBtn.textContent = 'Stop the record';
      el.audioBtn.setAttribute('aria-pressed', 'true');
      src.onended = stopAudio;
    }

    /* ---------- events ---------- */
    el.map.addEventListener('click', function (e) {
      var rect = el.map.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      state.x = Math.max(0, Math.min(WIDTH_KM, px * WIDTH_KM));
      state.y = Math.max(0, Math.min(HEIGHT_KM, py * HEIGHT_KM));
      el.solveOut.textContent = 'Hypocentre moved. Press solve to relocate it from the S–P times.';
      update();
    });

    el.depth.addEventListener('input', function () {
      el.solveOut.textContent = 'Depth changed. The solve assumes the depth you set.';
      update();
    });
    el.mag.addEventListener('input', update);

    el.solveBtn.addEventListener('click', solve);

    el.audioBtn.addEventListener('click', function () {
      if (state.playing) stopAudio(); else playAudio();
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { drawMap(); drawWave(); }, 120);
    });

    update();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fail(field, message) {
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.add('invalid');
      status.textContent = message;
      status.className = 'form-status err';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      Array.prototype.forEach.call(form.querySelectorAll('.invalid'), function (n) { n.classList.remove('invalid'); });
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;
      var consent = form.elements.consent;

      if (!name.value.trim() || name.value.trim().length < 2) { fail(name, 'A name, so I know who is writing.'); name.focus(); return; }
      if (!emailRe.test(email.value.trim())) { fail(email, 'The email address is missing something after the @.'); email.focus(); return; }
      if (message.value.trim().length < 20) { fail(message, 'Please add a sentence about what you felt or need.'); message.focus(); return; }
      if (!consent.checked) { status.textContent = 'The consent box is needed before I can reply.'; status.className = 'form-status err'; consent.focus(); return; }
      status.textContent = 'Received. Reports go into the intensity map; data requests get an answer within a week.';
      status.className = 'form-status ok';
      form.reset();
    });

    Array.prototype.forEach.call(form.querySelectorAll('input, textarea, select'), function (input) {
      input.addEventListener('input', function () {
        var wrap = input.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();
