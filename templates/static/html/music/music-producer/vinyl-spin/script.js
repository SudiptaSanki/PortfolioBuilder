/* Slate & Shellac — cutting bench + page behaviour.
   The bench does real arithmetic: groove area / pitch = time, radius = velocity,
   velocity^2 = tracing loss, and THD comes from an actual tanh analysis of a sine. */

(function () {
  'use strict';

  var page = document.body.getAttribute('data-page') || 'home';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------- shared chrome ---------------- */

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  document.querySelectorAll('.nav a').forEach(function (a) {
    var here = a.getAttribute('href');
    var current = here === page + '.html' || (page === 'home' && here === 'index.html');
    if (current) a.setAttribute('aria-current', 'page');
  });

  /* Scroll reveals are intentionally left out: every section is complete without JS,
     and content that fades in on scroll reads as decoration on a portfolio. */

  /* ---------------- discography filter ---------------- */

  var filters = document.querySelectorAll('.filter');
  if (filters.length) {
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-filter');
        filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var rows = document.querySelectorAll('.disco tbody tr');
        var shown = 0;
        rows.forEach(function (row) {
          var match = want === 'all' || row.getAttribute('data-format') === want;
          row.classList.toggle('hide', !match);
          if (match) shown += 1;
        });
        var count = document.getElementById('discoCount');
        if (count) count.textContent = shown + (shown === 1 ? ' release' : ' releases');
      });
    });
  }

  /* ---------------- contact form ---------------- */

  var form = document.getElementById('bookingForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    var setError = function (field, message) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.err') : null;
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (err) err.textContent = message || '';
    };

    var validate = function () {
      var ok = true;
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;
      if (!name.value.trim()) { setError(name, 'Please give a name or a project alias.'); ok = false; } else setError(name, '');
      if (!email.value.trim() || !emailRe.test(email.value.trim())) {
        setError(email, 'A working email address, so I can send the level report.'); ok = false;
      } else setError(email, '');
      if (message.value.trim().length < 12) {
        setError(message, 'A sentence about the release is enough to start.'); ok = false;
      } else setError(message, '');
      return ok;
    };

    ['name', 'email', 'message'].forEach(function (n) {
      var f = form.elements[n];
      if (!f) return;
      f.addEventListener('input', function () {
        if (f.getAttribute('aria-invalid') === 'true') setError(f, '');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        if (status) { status.className = 'form-status show'; status.textContent = 'Two fields need attention before this can go out.'; }
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      var name = form.elements.name.value.trim().split(/\s+/)[0];
      var type = form.elements.kind ? form.elements.kind.value : 'release';
      if (status) {
        status.className = 'form-status show ok';
        status.textContent = 'Thank you, ' + name + '. The brief for this ' + type + ' is in the queue; I answer cutting enquiries on Tuesdays and Fridays, usually within a day. Nothing has been sent to a mailing list.';
      }
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.setAttribute('aria-invalid', 'false'); });
      form.querySelectorAll('.err').forEach(function (f) { f.textContent = ''; });
    });
  }

  if (page !== 'home') return;

  /* ---------------- bench model ---------------- */

  var DISC = {
    '12': { d: 302, rIn: 62 },
    '10': { d: 250, rIn: 56 },
    '7': { d: 177, rIn: 50 }
  };

  var el = {
    form: document.getElementById('benchForm'),
    disc: document.getElementById('discCanvas'),
    curve: document.getElementById('curveCanvas'),
    programOut: document.getElementById('programOut'),
    lpiOut: document.getElementById('lpiOut'),
    driveOut: document.getElementById('driveOut'),
    rumbleOut: document.getElementById('rumbleOut'),
    deessOut: document.getElementById('deessOut'),
    pitchCaption: document.getElementById('pitchCaption'),
    capacity: document.getElementById('roCapacity'),
    capacityNote: document.getElementById('roCapacityNote'),
    pitchUse: document.getElementById('roPitchUse'),
    velocity: document.getElementById('roVelocity'),
    igd: document.getElementById('roIgd'),
    thd: document.getElementById('roThd'),
    dr: document.getElementById('roDr'),
    verdict: document.getElementById('verdict'),
    btn: document.getElementById('auditionBtn'),
    note: document.getElementById('auditionNote'),
    meter: document.getElementById('meterFill'),
    laq: document.getElementById('laqId')
  };
  if (!el.form || !el.disc) return;

  function readState() {
    var fd = new FormData(el.form);
    return {
      rpm: parseFloat(fd.get('rpm') || '33.333'),
      diameter: String(fd.get('diameter') || '12'),
      program: parseFloat(fd.get('program') || '18'),
      lpi: parseFloat(fd.get('lpi') || '160'),
      drive: parseFloat(fd.get('drive') || '4'),
      rumble: parseFloat(fd.get('rumble') || '60'),
      deess: parseFloat(fd.get('deess') || '30')
    };
  }

  function fmtTime(minutes) {
    var m = Math.floor(minutes);
    var s = Math.round((minutes - m) * 60);
    if (s === 60) { m += 1; s = 0; }
    return m + ':' + String(s).padStart(2, '0');
  }

  /* THD of a 1 kHz sine through the saturation stage, by harmonic correlation.
     0 dB is the clean path; as drive rises the wet tanh path takes more of the signal. */
  function measureThd(driveDb) {
    var k = driveDb / 12;
    var g = 1 + driveDb * 0.1;
    var N = 2048, cycles = 8, amp = 0.55;
    var norm = Math.tanh(g * amp);
    var shape = function (x) {
      return (1 - k) * x + k * (Math.tanh(g * x) / norm);
    };
    var sum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < N; i += 1) {
      var x = amp * Math.sin(2 * Math.PI * cycles * i / N);
      var y = shape(x);
      for (var h = 1; h <= 9; h += 1) {
        sum[h] += y * Math.sin(2 * Math.PI * h * cycles * i / N);
      }
    }
    var a1 = Math.abs(sum[1]) * 2 / N;
    var rest = 0;
    for (var h = 2; h <= 9; h += 1) {
      var ah = Math.abs(sum[h]) * 2 / N;
      rest += ah * ah;
    }
    return (Math.sqrt(rest) / a1) * 100;
  }

  function model(s) {
    var disc = DISC[s.diameter];
    var rOut = disc.d / 2;
    var rIn = disc.rIn;
    var pitchMm = 25.4 / s.lpi;
    // A spiral turns (rOut - rIn) / pitch times, and each turn is one platter
    // revolution: minutes = turns / rpm, independent of where on the disc it is.
    var turns = (rOut - rIn) / pitchMm;
    var lengthMm = Math.PI * (rOut * rOut - rIn * rIn) / pitchMm;
    var rMid = (rOut + rIn) / 2;
    var vMid = 2 * Math.PI * (rMid / 1000) * (s.rpm / 60);
    var vInner = 2 * Math.PI * (rIn / 1000) * (s.rpm / 60);
    var vOuter = 2 * Math.PI * (rOut / 1000) * (s.rpm / 60);
    var rawCapacity = turns / s.rpm; // minutes of groove at constant pitch
    // Saturation eats pitch headroom; de-essing gives a little back.
    var capacity = rawCapacity * (1 - 0.0062 * s.drive) * (1 + 0.00042 * s.deess);
    var used = capacity > 0 ? s.program / capacity : 2;
    var igd = (0.1615 / (vInner * vInner)) * Math.pow(1 - 0.25 * s.deess / 100, 0.35);
    var thd = measureThd(s.drive);
    var dr = Math.max(24, 58 - 0.55 * s.drive + (s.rumble >= 75 ? 1.2 : 0) + Math.max(0, 1 - used) * 3.2);
    return {
      rOut: rOut, rIn: rIn, pitchMm: pitchMm, lengthMm: lengthMm, turns: turns,
      vInner: vInner, vOuter: vOuter, vMid: vMid,
      capacity: capacity, rawCapacity: rawCapacity, used: used,
      igd: igd, thd: thd, dr: dr,
      over: s.program > capacity,
      slack: capacity - s.program
    };
  }

  function verdictFor(s, m) {
    var head = m.slack;
    var bits = [];
    if (m.over) {
      bits.push('Does not fit. This side holds ' + fmtTime(m.capacity) + ' and the programme is ' + fmtTime(s.program) + ', ' + fmtTime(-m.slack) + ' too long.');
      if (s.rpm > 40) {
        bits.push('At 45 the platter is faster, so the same groove area holds less: drop to 33⅓ or move a track across.');
      } else if (s.lpi < 185) {
        bits.push('Tightening the pitch towards 185 lpi buys time, at the cost of a lower peak level.');
      } else {
        bits.push('A 10- or 12-inch side cannot take more at this pitch; the programme has to change.');
      }
    } else if (head < 1) {
      bits.push('Fits with ' + Math.round(head * 60) + ' seconds of headroom — a loud master will run out of pitch before the last groove, so keep the last track a little shorter.');
    } else {
      bits.push('Fits with ' + fmtTime(head) + ' of headroom. There is room to widen the pitch to ' + Math.min(200, Math.round(s.lpi / 5) * 5 + 15) + ' lpi and keep a louder cut.');
    }
    if (m.igd > 4.2) bits.push('Tracing loss at the label is ' + m.igd.toFixed(1) + ' dB at 10 kHz: high strings and cymbals will dull before the run-out. A 45 cut, or moving the bright track outward, fixes it.');
    else if (m.igd < 2.2) bits.push('Tracing loss at the label stays under ' + m.igd.toFixed(1) + ' dB at 10 kHz, so the inner tracks keep their top end.');
    if (s.drive > 9) bits.push('At ' + s.drive.toFixed(1) + ' dB the saturation is audible on transients (' + m.thd.toFixed(1) + '% THD); check the kick on the test pressing.');
    if (s.rumble <= 35) bits.push('A ' + s.rumble + ' Hz filter lets warped-pressing rumble through; 55–70 Hz is the usual floor for a 12-inch.');
    return bits.join(' ');
  }

  /* ---------------- canvas: record ---------------- */

  var discCtx = el.disc.getContext('2d');
  var curveCtx = el.curve.getContext('2d');
  var discBox = el.disc.parentElement;

  function sizeCanvas(cv, ctx, ratio) {
    var w = cv.parentElement.clientWidth;
    if (w < 10) return null;
    var cssW = w;
    var cssH = Math.round(w * ratio);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    cv.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: cssW, h: cssH };
  }

  function drawDisc(s, m, phase) {
    var size = sizeCanvas(el.disc, discCtx, 0.66);
    if (!size) return;
    var ctx = discCtx;
    var w = size.w, h = size.h;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f0d0a';
    ctx.fillRect(0, 0, w, h);

    var cx = w * 0.5;
    var cy = h * 0.58;
    var rPx = Math.min(w * 0.46, h * 0.62);
    var scale = rPx / (m.rOut / 1); // px per mm

    // platter
    ctx.beginPath();
    ctx.arc(cx, cy, rPx * 1.04, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1611';
    ctx.fill();

    // lacquer body
    var grad = ctx.createRadialGradient(cx - rPx * 0.35, cy - rPx * 0.4, rPx * 0.1, cx, cy, rPx);
    grad.addColorStop(0, '#241f18');
    grad.addColorStop(0.55, '#14100c');
    grad.addColorStop(1, '#0b0906');
    ctx.beginPath();
    ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // grooves: spacing exaggerated 12x so pitch is visible
    var ex = 12;
    var spacing = Math.max(1.4, m.pitchMm * scale * ex);
    var rInnerPx = m.rIn * scale;
    var musicEnd = rInnerPx + (rPx - rInnerPx) * Math.max(0, Math.min(1, 1 - m.used));

    ctx.lineWidth = 1;
    for (var r = rPx; r > rInnerPx; r -= spacing) {
      var inProgramme = r >= musicEnd;
      var alpha = inProgramme ? 0.5 : 0.14;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(236, 226, 207, ' + alpha * 0.45 + ')';
      ctx.stroke();
      if (inProgramme) {
        ctx.beginPath();
        ctx.arc(cx, cy, r - spacing * 0.42, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(236, 226, 207, 0.07)';
        ctx.stroke();
      }
    }

    // programme band
    ctx.beginPath();
    ctx.arc(cx, cy, rPx, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, m.used), false);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(196, 138, 87, 0.55)';
    ctx.stroke();

    // label
    ctx.beginPath();
    ctx.arc(cx, cy, rInnerPx, 0, Math.PI * 2);
    ctx.fillStyle = '#7c2f26';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, rInnerPx * 0.94, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(243, 231, 210, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#f0e2c9';
    ctx.textAlign = 'center';
    ctx.font = '500 ' + Math.max(8, rInnerPx * 0.2) + 'px "DM Mono", monospace';
    ctx.fillText('SS-041', cx, cy - rInnerPx * 0.34);
    ctx.font = 'italic ' + Math.max(9, rInnerPx * 0.26) + 'px "Bodoni Moda", serif';
    ctx.fillText('Kade', cx, cy + rInnerPx * 0.02);
    ctx.font = '400 ' + Math.max(7, rInnerPx * 0.15) + 'px "DM Mono", monospace';
    ctx.fillText(s.rpm > 40 ? '45 RPM' : '33⅓ RPM', cx, cy + rInnerPx * 0.36);

    // spindle
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, rInnerPx * 0.06), 0, Math.PI * 2);
    ctx.fillStyle = '#0f0d0a';
    ctx.fill();

    // stylus and head, lowered at the current outer radius
    var ang = -0.62;
    var sx = cx + Math.cos(ang) * rPx * 0.96;
    var sy = cy + Math.sin(ang) * rPx * 0.96;
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c99a';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ang + 0.55) * rPx * 0.5, sy + Math.sin(ang + 0.55) * rPx * 0.5);
    ctx.strokeStyle = 'rgba(201, 189, 166, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // rotation tick
    if (!reduce.matches) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(phase);
      ctx.beginPath();
      ctx.moveTo(0, -rPx * 0.9);
      ctx.lineTo(0, -rPx * 0.62);
      ctx.strokeStyle = 'rgba(236, 226, 207, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // captions inside the scope
    ctx.textAlign = 'left';
    ctx.font = '400 10px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(185, 172, 151, 0.85)';
    ctx.fillText('MUSIC BAND ' + Math.round((1 - Math.min(1, m.used)) * 100) + '% OF AREA USED', 10, 16);
    ctx.textAlign = 'right';
    ctx.fillText('GROOVE SPACING SHOWN ×12', w - 10, h - 10);
  }

  /* ---------------- canvas: RIAA ---------------- */

  function riaaDb(f) {
    var tau1 = 318e-6, tau2 = 3180e-6, tau3 = 75e-6;
    var w = 2 * Math.PI * f;
    var num = Math.sqrt(1 + Math.pow(w * tau1, 2));
    var den = Math.sqrt(1 + Math.pow(w * tau2, 2)) * Math.sqrt(1 + Math.pow(w * tau3, 2));
    return 20 * Math.log10(num / den);
  }

  function drawCurve(s, m) {
    var size = sizeCanvas(el.curve, curveCtx, 0.56);
    if (!size) return;
    var ctx = curveCtx;
    var w = size.w, h = size.h;
    var padL = 40, padR = 12, padT = 16, padB = 26;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f0d0a';
    ctx.fillRect(0, 0, w, h);

    var fMin = 20, fMax = 20000;
    var yMin = -24, yMax = 22;
    var xOf = function (f) { return padL + (Math.log10(f / fMin) / Math.log10(fMax / fMin)) * (w - padL - padR); };
    var yOf = function (db) { return padT + ((yMax - db) / (yMax - yMin)) * (h - padT - padB); };

    // grid
    var ticks = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    ctx.strokeStyle = 'rgba(236, 226, 207, 0.09)';
    ctx.lineWidth = 1;
    ctx.font = '400 9px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(169, 158, 140, 0.9)';
    ticks.forEach(function (f) {
      var x = Math.round(xOf(f)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
      ctx.stroke();
      if ([20, 100, 1000, 10000].indexOf(f) !== -1) {
        ctx.textAlign = 'center';
        ctx.fillText(f >= 1000 ? (f / 1000) + 'k' : String(f), x, h - padB + 13);
      }
    });
    for (var db = -20; db <= 20; db += 10) {
      var y = Math.round(yOf(db)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText((db > 0 ? '+' : '') + db, padL - 6, y + 3);
    }

    // filtered rumble region
    var xR = xOf(s.rumble);
    ctx.fillStyle = 'rgba(154, 116, 49, 0.09)';
    ctx.fillRect(padL, padT, xR - padL, h - padT - padB);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xR, padT);
    ctx.lineTo(xR, h - padB);
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'rgba(201, 160, 106, 0.6)';
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(201, 160, 106, 0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(s.rumble + ' Hz', xR + 4, padT + 10);

    // 10 kHz marker
    var x10 = xOf(10000);
    ctx.beginPath();
    ctx.moveTo(x10, padT);
    ctx.lineTo(x10, h - padB);
    ctx.setLineDash([1, 4]);
    ctx.strokeStyle = 'rgba(236, 226, 207, 0.22)';
    ctx.stroke();
    ctx.setLineDash([]);

    // curves
    var drawSeries = function (fn, color, dash, width) {
      ctx.beginPath();
      for (var px = padL; px <= w - padR; px += 1) {
        var f = fMin * Math.pow(fMax / fMin, (px - padL) / (w - padL - padR));
        var yv = yOf(fn(f));
        if (px === padL) ctx.moveTo(px, yv);
        else ctx.lineTo(px, yv);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    var base = riaaDb(1000);
    drawSeries(function (f) { return riaaDb(f) - base; }, 'rgba(236, 226, 207, 0.85)', [], 1.6);
    drawSeries(function (f) { return riaaDb(f) - base - m.igd * Math.pow(f / 10000, 0.7); }, 'rgba(196, 138, 87, 0.95)', [5, 3], 1.5);

    // legend
    ctx.textAlign = 'left';
    ctx.font = '400 9px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(236, 226, 207, 0.85)';
    ctx.fillText('RIAA play', padL + 4, padT + 10);
    ctx.fillStyle = 'rgba(196, 138, 87, 0.95)';
    ctx.fillText('at label (' + (-m.igd).toFixed(1) + ' dB @10k)', padL + 4, padT + 23);
  }

  /* ---------------- readouts ---------------- */

  function update(s, m) {
    if (el.programOut) el.programOut.textContent = fmtTime(s.program);
    if (el.lpiOut) el.lpiOut.textContent = s.lpi + ' lpi';
    if (el.driveOut) el.driveOut.textContent = s.drive.toFixed(1) + ' dB';
    if (el.rumbleOut) el.rumbleOut.textContent = s.rumble + ' Hz';
    if (el.deessOut) el.deessOut.textContent = Math.round(s.deess) + '%';
    if (el.pitchCaption) el.pitchCaption.textContent = s.lpi + ' lpi · ' + Math.round(m.pitchMm * 1000) + ' µm';
    if (el.capacity) el.capacity.textContent = fmtTime(m.capacity);
    if (el.capacityNote) el.capacityNote.textContent = 'at ' + s.lpi + ' lpi, ' + (s.rpm > 40 ? '45 rpm' : '33⅓ rpm');
    if (el.pitchUse) el.pitchUse.textContent = Math.round(Math.min(199, m.used * 100)) + '%';
    if (el.velocity) el.velocity.textContent = m.vInner.toFixed(2);
    if (el.igd) el.igd.textContent = '−' + m.igd.toFixed(1);
    if (el.thd) el.thd.textContent = m.thd.toFixed(1) + '%';
    if (el.dr) el.dr.textContent = Math.round(m.dr);

    var warnCards = [el.capacity, el.pitchUse];
    warnCards.forEach(function (c) { if (c) c.parentElement.classList.remove('warn'); });
    if (m.over && el.pitchUse) el.pitchUse.parentElement.classList.add('warn');
    if (m.igd > 4.2 && el.igd) el.igd.parentElement.classList.add('warn');

    if (el.verdict) el.verdict.textContent = verdictFor(s, m);
    if (el.laq) el.laq.textContent = 'SS-041 ' + (s.rpm > 40 ? 'A·45' : 'A');
  }

  var lastState = null;
  var lastModel = null;
  var phase = 0;

  function render() {
    lastState = readState();
    lastModel = model(lastState);
    update(lastState, lastModel);
    drawDisc(lastState, lastModel, phase);
    drawCurve(lastState, lastModel);
  }

  el.form.addEventListener('input', function (e) {
    if (e.target && e.target.type === 'range') render();
  });
  el.form.addEventListener('change', render);
  el.form.addEventListener('submit', function (e) { e.preventDefault(); render(); });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (lastState) {
        drawDisc(lastState, lastModel, phase);
        drawCurve(lastState, lastModel);
      }
    }, 140);
  });

  render();

  // slow turn of the lacquer: 9 s per turn, paused for reduced motion
  if (!reduce.matches) {
    var spin = 0;
    var tick = function () {
      spin += 0.006;
      phase = spin;
      if (lastState) drawDisc(lastState, lastModel, phase);
      requestAnimationFrame(tick);
    };
    // only animate while the bench is near the viewport
    var benchEl = document.getElementById('bench');
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.05 }).observe(benchEl);
    }
    var loop = function () {
      if (visible && !document.hidden) { spin += 0.006; phase = spin; if (lastState) drawDisc(lastState, lastModel, phase); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    void tick;
  }

  /* ---------------- opt-in audition ---------------- */

  var audio = { ctx: null, graph: null, playing: false, timer: null, analyser: null };
  window.__audioState = { created: false, playing: false };

  function buildCurve(driveDb) {
    var g = Math.pow(10, driveDb / 20);
    var n = 2048;
    var curve = new Float32Array(n);
    var norm = Math.tanh(g);
    for (var i = 0; i < n; i += 1) {
      var x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(g * x) / (norm || 1);
    }
    return curve;
  }

  function scheduleBar(ctx, out, s) {
    var t0 = ctx.currentTime + 0.06;
    var bpm = s.rpm > 40 ? 112 : 96;
    var beat = 60 / bpm;
    var barLen = beat * 4;

    // kick on 1 and 3
    [0, 2].forEach(function (b) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(120, t0 + b * beat);
      o.frequency.exponentialRampToValueAtTime(44, t0 + b * beat + 0.16);
      g.gain.setValueAtTime(0.0001, t0 + b * beat);
      g.gain.exponentialRampToValueAtTime(0.9, t0 + b * beat + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + b * beat + 0.34);
      o.connect(g).connect(out);
      o.start(t0 + b * beat);
      o.stop(t0 + b * beat + 0.4);
    });

    // bass line, two notes
    [[0.5, 55], [1.5, 82.4], [2.5, 55], [3.5, 73.4]].forEach(function (pair) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 420;
      o.type = 'sawtooth';
      o.frequency.value = pair[1];
      g.gain.setValueAtTime(0.0001, t0 + pair[0] * beat);
      g.gain.exponentialRampToValueAtTime(0.32, t0 + pair[0] * beat + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + pair[0] * beat + beat * 0.9);
      o.connect(f).connect(g).connect(out);
      o.start(t0 + pair[0] * beat);
      o.stop(t0 + pair[0] * beat + beat);
    });

    // hats, soft noise
    var noiseLen = Math.floor(ctx.sampleRate * 0.06);
    var buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < noiseLen; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
    for (var b = 0; b < 8; b += 1) {
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var hg = ctx.createGain();
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 6500;
      hg.gain.value = b % 2 === 0 ? 0.1 : 0.05;
      src.connect(hp).connect(hg).connect(out);
      src.start(t0 + b * beat * 0.5);
    }
    return barLen;
  }

  function startAudio() {
    var s = lastState;
    if (!audio.ctx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      audio.ctx = new Ctor();
      window.__audioState.created = true;
    }
    var ctx = audio.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    var master = ctx.createGain();
    master.gain.value = 0.0001;
    var shaper = ctx.createWaveShaper();
    shaper.curve = buildCurve(s.drive);
    shaper.oversample = '2x';
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = s.rumble;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = s.rpm > 40 ? 17000 : 14000;
    var analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    var bus = ctx.createGain();
    bus.gain.value = 0.22;

    bus.connect(shaper).connect(hp).connect(lp).connect(master).connect(analyser).connect(ctx.destination);
    master.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.35);

    audio.graph = { master: master, bus: bus, hp: hp, ls: lp, shaper: shaper, analyser: analyser };
    audio.playing = true;
    window.__audioState.playing = true;
    if (el.btn) {
      el.btn.textContent = 'Stop the audition';
      el.btn.setAttribute('aria-pressed', 'true');
    }
    if (el.note) el.note.textContent = 'Playing a four-bar loop through ' + s.drive.toFixed(1) + ' dB of saturation, a ' + s.rumble + ' Hz rumble filter and a ' + (s.rpm > 40 ? '45' : '33⅓') + ' rpm top end. Move a control and press again to re-cut.';

    var bar = scheduleBar(ctx, bus, s);
    audio.timer = setInterval(function () {
      if (!audio.playing) return;
      var cur = readState();
      scheduleBar(ctx, bus, cur);
    }, (bar - 0.12) * 1000);

    // meter
    var buf = new Uint8Array(analyser.fftSize);
    var meterLoop = function () {
      if (!audio.playing) {
        if (el.meter) el.meter.style.width = '0%';
        return;
      }
      analyser.getByteTimeDomainData(buf);
      var sum = 0;
      for (var i = 0; i < buf.length; i += 1) {
        var v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      var rms = Math.sqrt(sum / buf.length);
      if (el.meter) el.meter.style.width = Math.min(100, rms * 320) + '%';
      requestAnimationFrame(meterLoop);
    };
    requestAnimationFrame(meterLoop);
    return true;
  }

  function stopAudio() {
    if (!audio.ctx) return;
    var ctx = audio.ctx;
    if (audio.graph) {
      try {
        audio.graph.master.gain.cancelScheduledValues(ctx.currentTime);
        audio.graph.master.gain.setValueAtTime(audio.graph.master.gain.value, ctx.currentTime);
        audio.graph.master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      } catch (err) { /* graph already torn down */ }
    }
    audio.playing = false;
    window.__audioState.playing = false;
    if (audio.timer) clearInterval(audio.timer);
    audio.timer = null;
    if (el.btn) {
      el.btn.textContent = 'Audition the cut';
      el.btn.setAttribute('aria-pressed', 'false');
    }
    if (el.note) el.note.textContent = 'Silent until you press play. A short synthesised loop runs through the same saturation and filters the bench is set to.';
    if (el.meter) el.meter.style.width = '0%';
    setTimeout(function () { if (!audio.playing && ctx.state === 'running') ctx.suspend(); }, 400);
  }

  if (el.btn) {
    el.btn.addEventListener('click', function () {
      if (!audio.playing) {
        var ok = startAudio();
        if (!ok && el.note) el.note.textContent = 'This browser has no Web Audio, so the audition is silent. The bench numbers still hold.';
      } else {
        stopAudio();
      }
    });
  }

  /* ---------------- probe hooks ---------------- */

  window.__bench = {
    read: function () {
      var s = readState();
      var m = model(s);
      return {
        rpm: s.rpm, diameter: s.diameter, program: s.program, lpi: s.lpi,
        capacity: m.capacity, used: m.used, vInner: m.vInner, vOuter: m.vOuter,
        igd: m.igd, thd: m.thd, dr: m.dr, over: m.over,
        verdict: el.verdict ? el.verdict.textContent : '',
        readouts: {
          capacity: el.capacity && el.capacity.textContent,
          pitch: el.pitchUse && el.pitchUse.textContent,
          velocity: el.velocity && el.velocity.textContent,
          igd: el.igd && el.igd.textContent,
          thd: el.thd && el.thd.textContent,
          dr: el.dr && el.dr.textContent
        },
        audioCreated: window.__audioState.created
      };
    },
    set: function (name, value) {
      var field = el.form.elements[name];
      if (name === 'rpm') {
        var radios = el.form.querySelectorAll('input[name="rpm"]');
        radios.forEach(function (r) { r.checked = String(r.value) === String(value); });
      } else if (field) {
        field.value = value;
      }
      render();
    }
  };
})();
