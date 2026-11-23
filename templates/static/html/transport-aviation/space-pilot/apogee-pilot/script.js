/* Apogee — one-dimensional flight profile.
   Point mass, exponential atmosphere, no wind, no lift, no guidance. */

(function () {
  'use strict';

  var G0 = 9.80665;
  var H_SCALE = 8500;
  var RHO0 = 1.225;
  var DT = 0.25;

  // Beta differs by phase: the stack is slender on the way up, the capsule
  // separates and re-enters blunt-end first.
  var VEHICLES = {
    capsule: { label: 'Aurora II', betaUp: 4200, betaDown: 560, dry: 2600 },
    winged: { label: 'Aurora W', betaUp: 4600, betaDown: 800, dry: 3100 }
  };

  function rhoAt(h) {
    return RHO0 * Math.exp(-Math.max(0, h) / H_SCALE);
  }

  function dragDecel(h, v, beta) {
    return (0.5 * rhoAt(h) * v * v) / beta;
  }

  // integrate a flight with a given burnout velocity; returns samples and metrics
  function fly(p, vTarget, record) {
    var veh = VEHICLES[p.vehicle];
    var mass = veh.dry + p.pax * 90;
    var thrustAcc = p.gforce * G0;         // T/m
    var h = 0, v = 0, t = 0;
    var burnout = false;
    var apogee = 0, vBurn = 0, tBurn = 0;
    var peakUp = 0, peakDown = 0, maxQ = 0, tAbove = 0, t3 = null, peakH = 0;
    var tW0 = null, tW1 = null;
    var samples = [];
    var lastSample = -1;

    while (t < 1400) {
      var d = dragDecel(h, v, burnout ? veh.betaDown : veh.betaUp);
      var a;
      if (!burnout) {
        a = thrustAcc - G0 - d;
        if (v >= vTarget) { burnout = true; vBurn = v; tBurn = t; a = -G0 - d; }
      } else {
        a = -G0 - d * (v >= 0 ? 1 : -1);
      }
      var sensed = burnout ? (d / G0) : ((thrustAcc - d) / G0);
      if (!burnout && sensed > peakUp) peakUp = sensed;
      if (burnout && v < 0 && sensed > peakDown) peakDown = sensed;
      if (!burnout) {
        var q = 0.5 * rhoAt(h) * v * v;
        if (q > maxQ) maxQ = q;
      }
      if (h > 80000) tAbove += DT;
      if (burnout && tW0 === null) tW0 = t;
      if (burnout && v < 0 && tW1 === null && sensed > 0.2) tW1 = t;
      if (h > apogee) apogee = h;
      if (h > peakH) peakH = h;
      if (burnout && v < 0 && t3 === null && h <= 3000) t3 = t;

      if (record && Math.floor(t) !== lastSample) {
        lastSample = Math.floor(t);
        samples.push({ t: t, h: h, g: sensed, burnt: burnout });
      }

      v += a * DT;
      h += v * DT;
      t += DT;
      if (burnout && v < 0 && h <= 0) break;
    }

    return {
      samples: samples, apogee: peakH, vBurn: vBurn, tBurn: tBurn,
      peakUp: peakUp, peakDown: peakDown, maxQ: maxQ, tAbove: tAbove,
      weightless: (tW1 === null ? t : tW1) - (tW0 === null ? 0 : tW0),
      tTotal: t, t3: t3 === null ? t : t3
    };
  }

  function solve(p) {
    var target = p.apogee * 1000;
    var lo = 300, hi = 2600;
    var best = null;
    for (var i = 0; i < 32; i += 1) {
      var mid = (lo + hi) / 2;
      var r = fly(p, mid, false);
      best = r;
      if (r.apogee < target) lo = mid; else hi = mid;
    }
    // take the upper bracket so the flown profile clears the target
    return fly(p, hi, true);
  }

  function readForm() {
    var f = document.getElementById('profile-form');
    if (!f) return null;
    return {
      apogee: parseFloat(document.getElementById('apogee').value),
      gforce: parseFloat(document.getElementById('gforce').value),
      vehicle: document.getElementById('vehicle').value,
      pax: parseFloat(document.getElementById('pax').value)
    };
  }

  function setParams(next) {
    if (!document.getElementById('profile-form')) return;
    if (next.apogee != null) document.getElementById('apogee').value = String(next.apogee);
    if (next.gforce != null) document.getElementById('gforce').value = String(next.gforce);
    if (next.pax != null) document.getElementById('pax').value = String(next.pax);
    if (next.vehicle) document.getElementById('vehicle').value = next.vehicle;
    update();
  }

  function mmss(seconds) {
    var s = Math.max(0, Math.round(seconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ' min ' + (r < 10 ? '0' + r : r) + ' s';
  }

  var canvas = document.getElementById('profile-canvas');

  function drawProfile(res, p) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = canvas.clientWidth || 900;
    var cssH = Math.round(cssW * (420 / 900));
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var cs = getComputedStyle(document.documentElement);
    var navy = cs.getPropertyValue('--navy').trim() || '#16233a';
    var muted = cs.getPropertyValue('--muted').trim() || '#6b6357';
    var brass = cs.getPropertyValue('--brass').trim() || '#8a5a16';
    var line = 'rgba(22,35,58,0.14)';

    var m = { l: 48, r: 16, t: 22, b: 66 };
    var w = cssW - m.l - m.r;
    var h = cssH - m.t - m.b;
    var gH = 34;

    var tMax = Math.ceil(res.tTotal / 60) * 60;
    var hMax = Math.max(120, Math.ceil(res.apogee / 10000) * 10);
    var X = function (t) { return m.l + (t / tMax) * w; };
    var Y = function (alt) { return m.t + h - (Math.min(alt, hMax * 1000) / (hMax * 1000)) * h; };

    // altitude grid
    ctx.font = '9px "Spline Sans Mono", monospace';
    for (var alt = 0; alt <= hMax; alt += 20) {
      ctx.strokeStyle = line;
      ctx.beginPath();
      ctx.moveTo(m.l, Y(alt * 1000)); ctx.lineTo(m.l + w, Y(alt * 1000));
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.textAlign = 'right';
      ctx.fillText(alt + ' km', m.l - 8, Y(alt * 1000) + 3);
    }
    for (var tm = 0; tm <= tMax; tm += 120) {
      ctx.strokeStyle = 'rgba(22,35,58,0.07)';
      ctx.beginPath();
      ctx.moveTo(X(tm), m.t); ctx.lineTo(X(tm), m.t + h);
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(tm / 60) + ' min', X(tm), m.t + h + 16);
    }

    // weightless band (above 80 km)
    var above = res.samples.filter(function (s) { return s.h >= 80000; });
    if (above.length) {
      var t0 = above[0].t, t1 = above[above.length - 1].t;
      ctx.fillStyle = 'rgba(201,162,39,0.12)';
      ctx.fillRect(X(t0), m.t, Math.max(2, X(t1) - X(t0)), h);
      ctx.fillStyle = brass;
      ctx.textAlign = 'center';
      ctx.fillText('weightless', (X(t0) + X(t1)) / 2, m.t + 12);
    }

    // 100 km Karman line
    if (hMax >= 100) {
      ctx.strokeStyle = 'rgba(22,35,58,0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(m.l, Y(100000)); ctx.lineTo(m.l + w, Y(100000));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = muted;
      ctx.textAlign = 'left';
      ctx.fillText('100 km', m.l + 4, Y(100000) - 4);
    }

    // altitude trace
    ctx.strokeStyle = navy;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    res.samples.forEach(function (s, i) {
      var x = X(s.t), y = Y(s.h);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // markers
    var mark = function (t, alt, label, align) {
      ctx.beginPath();
      ctx.arc(X(t), Y(alt), 3.6, 0, Math.PI * 2);
      ctx.fillStyle = brass;
      ctx.fill();
      ctx.fillStyle = navy;
      ctx.font = '9px "Spline Sans Mono", monospace';
      ctx.textAlign = align || 'left';
      ctx.fillText(label, X(t) + (align === 'right' ? -8 : 8), Y(alt) - 8);
    };
    var atBurn = res.samples.reduce(function (best, s) {
      return Math.abs(s.t - res.tBurn) < Math.abs(best.t - res.tBurn) ? s : best;
    }, res.samples[0]);
    var atPeak = res.samples.reduce(function (best, s) { return s.h > best.h ? s : best; }, res.samples[0]);
    mark(atBurn.t, atBurn.h, 'engine cutoff');
    mark(atPeak.t, atPeak.h, 'apogee ' + (res.apogee / 1000).toFixed(1) + ' km', 'right');

    // G strip
    var gy = m.t + h + gH;
    var gMax = 7;
    ctx.strokeStyle = 'rgba(22,35,58,0.2)';
    ctx.beginPath();
    ctx.moveTo(m.l, m.t + h); ctx.lineTo(m.l + w, m.t + h);
    ctx.stroke();
    ctx.fillStyle = muted;
    ctx.textAlign = 'right';
    ctx.fillText('g', m.l - 8, gy - 4);

    ctx.beginPath();
    ctx.moveTo(X(0), gy);
    res.samples.forEach(function (s) {
      ctx.lineTo(X(s.t), gy - Math.min(s.g, gMax) / gMax * gH);
    });
    ctx.lineTo(X(res.tTotal), gy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(138,90,22,0.18)';
    ctx.fill();
    ctx.strokeStyle = brass;
    ctx.lineWidth = 1;
    ctx.beginPath();
    res.samples.forEach(function (s, i) {
      var x = X(s.t), y = gy - Math.min(s.g, gMax) / gMax * gH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = muted;
    ctx.textAlign = 'left';
    ctx.font = '8.5px "Spline Sans Mono", monospace';
    ctx.fillText('sensed load, 0 to 7 g', m.l + 2, gy + 11);

    canvas.setAttribute('aria-label', 'Altitude against time: apogee ' + (res.apogee / 1000).toFixed(1) +
      ' kilometres at ' + mmss(res.tTotal / 2) + ', ' + mmss(res.tAbove) + ' above 80 kilometres, peak entry load ' +
      res.peakDown.toFixed(1) + ' g.');
  }

  function update() {
    var p = readForm();
    if (!p || !canvas) return;
    var res = solve(p);

    var set = function (id, v, unit) {
      var n = document.getElementById(id);
      if (n) n.innerHTML = v + '<span>' + unit + '</span>';
    };
    set('out-apogee', (res.apogee / 1000).toFixed(1), 'km');
    set('out-vel', Math.round(res.vBurn).toLocaleString('en-GB').replace(/,/g, ' '), 'm/s');
    set('out-burn', Math.round(res.tBurn), 's');
    document.getElementById('out-float').textContent = mmss(res.weightless);
    set('out-gup', res.peakUp.toFixed(1), 'g');
    set('out-gdown', res.peakDown.toFixed(1), 'g');
    set('out-q', Math.round(res.maxQ / 1000), 'kPa');
    document.getElementById('out-time').textContent = mmss(res.tAbove);

    var outs = {
      apogee: document.getElementById('apogee-out'),
      gforce: document.getElementById('gforce-out'),
      pax: document.getElementById('pax-out')
    };
    if (outs.apogee) outs.apogee.textContent = p.apogee.toFixed(1) + ' km';
    if (outs.gforce) outs.gforce.textContent = p.gforce.toFixed(1) + ' g';
    if (outs.pax) outs.pax.textContent = String(p.pax);

    var verdict = document.getElementById('verdict');
    if (verdict) {
      var notes = [];
      var bad = false;
      if (p.apogee >= 100) {
        notes.push('Clears the Kármán line by ' + (res.apogee / 1000 - 100).toFixed(1) + ' km, with ' + mmss(res.weightless) + ' of weightlessness and ' + res.peakDown.toFixed(1) + ' g on the way down.');
      } else {
        notes.push('This profile peaks at ' + (res.apogee / 1000).toFixed(1) + ' km, below the 100 km line. It is a high-altitude flight, not a spaceflight, and the certificate wording has to say so.');
        bad = true;
      }
      if (res.peakDown > 6) {
        notes.push('Peak entry load of ' + res.peakDown.toFixed(1) + ' g is above the 6 g limit for a passenger with no centrifuge qualification.');
        bad = true;
      }
      if (res.maxQ / 1000 > 50) {
        notes.push('Max dynamic pressure of ' + Math.round(res.maxQ / 1000) + ' kPa is past the 50 kPa structural limit for this vehicle.');
        bad = true;
      }
      verdict.classList.toggle('is-bad', bad);
      verdict.textContent = notes.join(' ');
    }

    drawProfile(res, p);
    window.__apogeeState = { p: p, res: res };
  }

  var form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    var karman = document.getElementById('preset-karman');
    var record = document.getElementById('preset-record');
    if (karman) karman.addEventListener('click', function () { setParams({ apogee: 100, gforce: 3, pax: 2, vehicle: 'capsule' }); });
    if (record) record.addEventListener('click', function () { setParams({ apogee: 107, gforce: 3.4, pax: 2, vehicle: 'capsule' }); });
    update();
    window.addEventListener('resize', update);
  }

  /* flight record filter */

  var chips = document.querySelectorAll('[data-filter]');
  var flights = document.querySelectorAll('.flight');
  if (chips.length && flights.length) {
    var count = document.getElementById('flight-count');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var kind = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        flights.forEach(function (f) {
          var cats = (f.dataset.cat || '').split(' ');
          var match = kind === 'all' || cats.indexOf(kind) !== -1;
          f.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (count) count.textContent = shown + ' of ' + flights.length + ' shown';
      });
    });
  }

  /* enquiry form */

  var enq = document.getElementById('enquiry-form');
  if (enq) {
    var panel = document.getElementById('enquiry-result');
    var preview = document.getElementById('enquiry-preview');
    var send = document.getElementById('enquiry-send');

    var errFor = function (field, msg) {
      var e = document.getElementById('err-' + field.name);
      if (e) e.textContent = msg;
      if (field.type !== 'checkbox') field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };

    var validate = function () {
      var ok = true;
      Array.prototype.forEach.call(enq.querySelectorAll('input, select, textarea'), function (field) {
        if (field.type === 'checkbox') {
          errFor(field, field.checked ? '' : 'Please confirm we may hold this note.');
          if (!field.checked) ok = false;
          return;
        }
        var v = field.value.trim();
        var msg = '';
        if (field.required && !v) msg = 'Required.';
        else if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Check the address.';
        errFor(field, msg);
        if (msg) ok = false;
      });
      return ok;
    };

    enq.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!validate()) {
        if (panel) panel.hidden = true;
        var firstBad = enq.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var d = {
        name: enq.elements.name.value.trim(),
        email: enq.elements.email.value.trim(),
        org: enq.elements.org.value.trim() || '—',
        interest: enq.elements.interest.value,
        window: enq.elements.window.value,
        message: enq.elements.message.value.trim()
      };
      var text = [
        'ENQUIRY — APOGEE FLIGHT',
        'name     ' + d.name + ' <' + d.email + '>',
        'client   ' + d.org,
        'interest ' + d.interest,
        'window   ' + d.window,
        '',
        d.message
      ].join('\n');
      preview.textContent = text;
      send.href = 'mailto:flight@apogee.example?subject=' +
        encodeURIComponent('Enquiry — ' + d.interest + ' — ' + d.name) +
        '&body=' + encodeURIComponent(text);
      panel.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    enq.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('aria-invalid') === 'true') errFor(ev.target, '');
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  window.__apogee = {
    set: setParams,
    run: update,
    read: function () {
      var s = window.__apogeeState;
      if (!s) return null;
      return {
        apogee: Math.round(s.res.apogee / 100) / 10,
        vBurn: Math.round(s.res.vBurn),
        tBurn: Math.round(s.res.tBurn),
        tAbove: Math.round(s.res.tAbove),
        weightless: Math.round(s.res.weightless),
        peakUp: Math.round(s.res.peakUp * 10) / 10,
        peakDown: Math.round(s.res.peakDown * 10) / 10,
        maxQ: Math.round(s.res.maxQ / 1000),
        tTotal: Math.round(s.res.tTotal),
        samples: s.res.samples.length,
        verdict: (document.getElementById('verdict') || {}).textContent || ''
      };
    }
  };
})();
