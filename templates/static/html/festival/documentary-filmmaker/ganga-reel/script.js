/* ============================================================
   Ganga Reel — Ishaan Mukherjee
   Frame / lens / depth-of-field / sync bench. No audio anywhere.
   ============================================================ */
(function () {
  'use strict';

  var navBtn = document.getElementById('navBtn');
  if (navBtn) {
    navBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- screening form ---------- */

  var form = document.getElementById('screeningForm');
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var note = document.getElementById('formNote');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var checks = [
        ['scName', function (v) { return v.trim().length > 1; }, 'A name for the reply.'],
        ['scEmail', function (v) { return emailRe.test(v.trim()); }, 'That address will bounce.'],
        ['scWhere', function (v) { return v.trim().length > 1; }, 'Which festival or venue?'],
        ['scMessage', function (v) { return v.trim().length > 12; }, 'A line or two about the screening.']
      ];
      checks.forEach(function (c) {
        var input = document.getElementById(c[0]);
        var err = document.getElementById('err-' + c[0]);
        if (!c[1](input.value)) {
          if (err) err.textContent = c[2];
          ok = false;
        } else if (err) err.textContent = '';
      });
      if (!ok) {
        var first = form.querySelector('.err:not(:empty)');
        if (first) {
          var f = first.parentElement.querySelector('input, textarea, select');
          if (f) f.focus();
        }
        return;
      }
      note.hidden = false;
      note.textContent = 'Received. Screeners and DCP details go out within four working days; if the screening is inside two weeks, mark the subject URGENT.';
      form.reset();
    });
  }

  /* ---------- bench ---------- */

  var frameCanvas = document.getElementById('frameMap');
  var syncCanvas = document.getElementById('syncMap');
  if (!frameCanvas || !syncCanvas) return;

  var els = {
    format: document.getElementById('format'),
    aspect: document.getElementById('aspect'),
    focal: document.getElementById('focal'),
    aperture: document.getElementById('aperture'),
    distance: document.getElementById('distance'),
    subject: document.getElementById('subject'),
    fps: document.getElementById('fps'),
    take: document.getElementById('take'),
    focalVal: document.getElementById('focalVal'),
    apertureVal: document.getElementById('apertureVal'),
    distanceVal: document.getElementById('distanceVal'),
    subjectVal: document.getElementById('subjectVal'),
    takeVal: document.getElementById('takeVal'),
    hfov: document.getElementById('outHfov'),
    fill: document.getElementById('outFill'),
    dof: document.getElementById('outDof'),
    drift: document.getElementById('outDrift'),
    note: document.getElementById('outNote')
  };

  var FORMATS = {
    '16': { w: 12.52, h: 7.41, name: 'Super 16', label: '16 mm · SR3' },
    s35: { w: 23.76, h: 13.37, name: 'Super 35', label: 'S35 · Alexa' },
    ff: { w: 36, h: 24, name: 'Full frame', label: 'FF · FX6' }
  };

  var INK = '#16181a';
  var PAPER = '#ece5d6';
  var RIVER = '#2f5d57';
  var AMBER = '#c9772f';

  function setup(cv, w, h) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return ctx;
  }

  function gate(fmt, aspect) {
    var sw = FORMATS[fmt].w, sh = FORMATS[fmt].h;
    var usedW = sw, usedH = sw / aspect;
    if (usedH > sh) { usedH = sh; usedW = sh * aspect; }
    return { w: usedW, h: usedH };
  }

  function solve(s) {
    var g = gate(s.format, s.aspect);
    var f = s.focal;
    var hfov = 2 * Math.atan(g.w / (2 * f)) * 180 / Math.PI;
    var vfov = 2 * Math.atan(g.h / (2 * f)) * 180 / Math.PI;
    var coverage = 2 * s.distance * Math.tan((vfov / 2) * Math.PI / 180);
    var fill = (s.subject / coverage) * 100;

    var diag = Math.sqrt(g.w * g.w + g.h * g.h);
    var coc = diag / 1500; /* mm, circle of confusion */
    var H = (f * f) / (s.aperture * coc) + f; /* hyperfocal, mm */
    var dmm = s.distance * 1000;
    var near = (dmm * (H - f)) / (H + dmm - 2 * f) / 1000;
    var far = dmm < H ? (dmm * (H - f)) / (H - dmm) / 1000 : Infinity;
    var dof = far === Infinity ? Infinity : far - near;

    var driftFrames = 0;
    var driftText;
    if (s.fps === 25) {
      driftText = '0';
    } else if (s.fps === 24) {
      driftFrames = Math.round(s.take);
      driftText = String(driftFrames);
    } else {
      driftFrames = 0;
      driftText = '0';
    }

    return { g: g, hfov: hfov, vfov: vfov, coverage: coverage, fill: fill, near: near, far: far, dof: dof, driftFrames: driftFrames, driftText: driftText };
  }

  function drawFrame(s, res) {
    var W = 680, H = 420, pad = 16;
    var ctx = setup(frameCanvas, W, H);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);

    /* the available rectangle inside the canvas margin */
    var availW = W - pad * 2;
    var availH = H - pad * 2 - 26;
    var ar = s.aspect;
    var fw = availW, fh = availW / ar;
    if (fh > availH) { fh = availH; fw = availH * ar; }
    var fx = pad + (availW - fw) / 2;
    var fy = pad + (availH - fh) / 2;

    /* letterbox bars */
    ctx.fillStyle = '#0b0c0d';
    ctx.fillRect(pad, pad, availW, (availH - fh) / 2);
    ctx.fillRect(pad, fy + fh, availW, (availH - fh) / 2);

    /* frame content: sky, river, steps */
    var sky = ctx.createLinearGradient(0, fy, 0, fy + fh);
    sky.addColorStop(0, '#d9cdb4');
    sky.addColorStop(0.55, '#cfc2a6');
    sky.addColorStop(1, '#b3ab92');
    ctx.fillStyle = sky;
    ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = 'rgba(95,115,104,0.85)';
    ctx.fillRect(fx, fy + fh * 0.62, fw, fh * 0.38);

    /* far bank */
    ctx.strokeStyle = 'rgba(22,24,26,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh * 0.62);
    ctx.lineTo(fx + fw, fy + fh * 0.62);
    ctx.stroke();

    /* depth-of-field band behind the subject */
    var band = Math.min(fh, Math.max(10, (Math.min(res.dof, 200) / Math.max(0.6, res.coverage)) * fh));
    ctx.fillStyle = 'rgba(201,119,47,0.16)';
    ctx.fillRect(fx, fy + fh * 0.5 - band / 2, fw, band);
    ctx.strokeStyle = 'rgba(201,119,47,0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh * 0.5 - band / 2);
    ctx.lineTo(fx + fw, fy + fh * 0.5 - band / 2);
    ctx.moveTo(fx, fy + fh * 0.5 + band / 2);
    ctx.lineTo(fx + fw, fy + fh * 0.5 + band / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    /* the subject, drawn to its true fraction of the frame height */
    var frac = Math.min(1.35, res.fill / 100);
    var ph = fh * frac;
    var pxx = fx + fw / 2;
    var feetY = fy + fh * 0.88;
    var headY = feetY - ph;
    /* a filled silhouette: it reads at any size and shows true coverage */
    var headR = ph * 0.068;
    var shoulderY = headY + ph * 0.2;
    var hipY = headY + ph * 0.56;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(pxx, headY + headR * 1.1, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pxx - ph * 0.055, headY + headR * 2.0);
    ctx.lineTo(pxx + ph * 0.055, headY + headR * 2.0);
    ctx.lineTo(pxx + ph * 0.105, hipY);
    ctx.lineTo(pxx - ph * 0.105, hipY);
    ctx.closePath();
    ctx.fill();
    /* arms */
    ctx.lineWidth = Math.max(2, ph * 0.032);
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pxx - ph * 0.08, shoulderY);
    ctx.lineTo(pxx - ph * 0.145, hipY + ph * 0.02);
    ctx.moveTo(pxx + ph * 0.08, shoulderY);
    ctx.lineTo(pxx + ph * 0.145, hipY + ph * 0.02);
    ctx.stroke();
    /* legs */
    ctx.beginPath();
    ctx.moveTo(pxx - ph * 0.045, hipY);
    ctx.lineTo(pxx - ph * 0.075, feetY);
    ctx.moveTo(pxx + ph * 0.045, hipY);
    ctx.lineTo(pxx + ph * 0.075, feetY);
    ctx.stroke();
    /* a faint ground shadow */
    ctx.fillStyle = 'rgba(22,24,26,0.18)';
    ctx.beginPath();
    ctx.ellipse(pxx, feetY + 2, ph * 0.13, Math.max(2, ph * 0.016), 0, 0, Math.PI * 2);
    ctx.fill();

    if (res.fill > 100) {
      ctx.fillStyle = AMBER;
      ctx.font = '500 11px "Spline Sans Mono", monospace';
      ctx.fillText('SUBJECT OVER FRAME', fx + 10, fy + 20);
    }

    /* thirds and corner marks */
    ctx.strokeStyle = 'rgba(236,229,214,0.28)';
    ctx.lineWidth = 1;
    for (var i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(fx + (fw / 3) * i, fy);
      ctx.lineTo(fx + (fw / 3) * i, fy + fh);
      ctx.moveTo(fx, fy + (fh / 3) * i);
      ctx.lineTo(fx + fw, fy + (fh / 3) * i);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(236,229,214,0.8)';
    ctx.lineWidth = 1.4;
    var m = 12;
    [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]].forEach(function (c) {
      ctx.beginPath();
      ctx.moveTo(c[0] + c[2] * m, c[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(c[0], c[1] + c[3] * m);
      ctx.stroke();
    });

    /* labels */
    ctx.fillStyle = PAPER;
    ctx.font = '400 10px "Spline Sans Mono", monospace';
    ctx.fillText(FORMATS[s.format].label.toUpperCase() + ' · ' + s.focal + 'MM · T' + s.aperture.toFixed(1), pad, H - 10);
    ctx.fillText(String(s.aspect.toFixed(2)) + ':1 · ' + fw.toFixed(0) + '×' + fh.toFixed(0) + ' PX PREVIEW', W - 250, H - 10);
  }

  function drawSync(s, res) {
    var W = 680, H = 84;
    var ctx = setup(syncCanvas, W, H);
    ctx.clearRect(0, 0, W, H);
    var x0 = 44, x1 = W - 18;
    var yPic = 30, yAud = 52;

    ctx.strokeStyle = 'rgba(22,24,26,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, yPic); ctx.lineTo(x1, yPic);
    ctx.moveTo(x0, yAud); ctx.lineTo(x1, yAud);
    ctx.stroke();

    /* picture ticks: 25 fps delivery, one tick every 5 s */
    ctx.strokeStyle = RIVER;
    ctx.lineWidth = 2;
    for (var t = 0; t <= 60; t += 5) {
      var x = x0 + (t / 60) * (x1 - x0);
      ctx.beginPath();
      ctx.moveTo(x, yPic - 7); ctx.lineTo(x, yPic + 7);
      ctx.stroke();
    }

    /* sound ticks: position follows the camera speed */
    var ratio = s.fps === 24 ? 24 / 25 : 1;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 2;
    for (var t2 = 0; t2 <= 60; t2 += 5) {
      var x2 = x0 + ((t2 * ratio) / 60) * (x1 - x0);
      ctx.beginPath();
      ctx.moveTo(x2, yAud - 7); ctx.lineTo(x2, yAud + 7);
      ctx.stroke();
    }

    ctx.fillStyle = INK;
    ctx.font = '400 9px "Spline Sans Mono", monospace';
    ctx.fillText('PIC', 8, yPic + 3);
    ctx.fillText('SND', 8, yAud + 3);
    ctx.fillText('0s', x0 - 6, 74);
    ctx.fillText('60s', x1 - 14, 74);

    if (res.driftFrames > 0) {
      ctx.strokeStyle = 'rgba(201,119,47,0.9)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, yPic);
      ctx.lineTo(x1, yAud);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = AMBER;
      ctx.fillText('DRIFT ' + res.driftFrames + ' FR / MIN', x1 - 138, 18);
    } else {
      ctx.fillStyle = RIVER;
      ctx.fillText(s.fps === 25 ? 'SYNC LOCKED · 25 FPS' : 'CONFORMED · SLOW MOTION', x1 - 168, 18);
    }
  }

  function read() {
    return {
      format: els.format.value,
      aspect: parseFloat(els.aspect.value),
      focal: parseInt(els.focal.value, 10),
      aperture: parseFloat(els.aperture.value),
      distance: parseInt(els.distance.value, 10),
      subject: parseFloat(els.subject.value),
      fps: parseInt(els.fps.value, 10),
      take: parseInt(els.take.value, 10)
    };
  }

  function render() {
    var s = read();
    els.focalVal.textContent = s.focal + ' mm';
    els.apertureVal.textContent = 'T ' + s.aperture.toFixed(1);
    els.distanceVal.textContent = s.distance + ' m';
    els.subjectVal.textContent = s.subject.toFixed(2) + ' m';
    els.takeVal.textContent = s.take + ' s';

    var res = solve(s);
    els.hfov.textContent = res.hfov.toFixed(0);
    els.fill.textContent = res.fill.toFixed(0);
    els.dof.textContent = res.dof === Infinity ? '∞' : res.dof.toFixed(1);
    els.drift.textContent = res.driftText;

    var note;
    if (res.fill > 105) {
      note = 'At ' + s.distance + ' m the subject no longer fits head to toe; this is a mid-shot. Pull back or drop ' + Math.max(1, Math.round((res.fill / 95 - 1) * s.distance)) + ' m to get the full figure.';
    } else if (res.fill < 25) {
      note = 'The figure fills only ' + res.fill.toFixed(0) + '% of the frame height — that is a wide, useful for context, not for faces.';
    } else if (res.dof !== Infinity && res.dof < 0.6) {
      note = 'A depth of field under 0.6 m at ' + s.distance + ' m is a close-focus look; the ghat behind will be soft. Fine for a portrait, wrong for a scene.';
    } else if (s.fps === 24) {
      note = '24 fps on a 25 fps delivery: sound drifts about ' + res.driftFrames + ' frames over a ' + s.take + '-second take. Either shoot 25, or plan the 4% pulldown.';
    } else {
      note = s.focal + ' mm on ' + FORMATS[s.format].name + ' at ' + s.distance + ' m holds a person at ' + res.fill.toFixed(0) + '% of frame height, with ' + (res.dof === Infinity ? 'the background in focus' : res.dof.toFixed(1) + ' m of depth of field') + '.';
    }
    els.note.textContent = note;

    drawFrame(s, res);
    drawSync(s, res);
  }

  ['input', 'change'].forEach(function (evt) {
    ['format', 'aspect', 'focal', 'aperture', 'distance', 'subject', 'fps', 'take'].forEach(function (k) {
      els[k].addEventListener(evt, render);
    });
  });

  render();
})();
