/* Longline — deboost model and hero drawing.
   Dipole geomagnetic field, orbit-averaged current, fixed plasma impedance. */

(function () {
  'use strict';

  var MU = 3.986004418e14;
  var RE = 6371000;
  var B0 = 3.1e-5;
  var R_PLASMA = 300;
  var I_MAX = 1.2;      // hollow-cathode emission limit, A
  var DUTY = 0.55;      // fraction of the orbit spent in useful plasma

  var CONDUCTORS = {
    al: { label: 'Aluminium', rho: 2.82e-8, dens: 2700, area: 0.5e-6, yieldMPa: 300 },
    cu: { label: 'Copper', rho: 1.68e-8, dens: 8960, area: 0.5e-6, yieldMPa: 220 },
    tape: { label: 'Aluminium tape', rho: 2.82e-8, dens: 2700, area: 2e-6, yieldMPa: 250 }
  };

  function model(p) {
    var c = CONDUCTORS[p.conductor] || CONDUCTORS.al;
    var r = RE + p.altitude * 1000;
    var L = p.length * 1000;
    var B = B0 * Math.pow(RE / r, 3);
    var v = Math.sqrt(MU / r);
    var emf = B * L * v;
    var Rt = (c.rho * L) / c.area;
    var iGen = Math.min(emf / (Rt + R_PLASMA), I_MAX);
    var force = p.current * L * B;
    var a = force / p.endmass;
    var dvDay = a * 86400 * (2 / Math.PI) * DUTY;
    var rp = RE + 120000;
    var dvReq = v * (1 - Math.sqrt((2 * rp) / (r + rp)));
    var days = dvDay > 0 ? dvReq / dvDay : Infinity;
    var mass = L * c.area * c.dens;
    var dg = (2 * MU * L) / Math.pow(r, 3);
    var tension = p.endmass * dg + force;
    var stress = tension / c.area / 1e6;
    var powerNeeded = p.current > iGen ? (p.current * emf + p.current * p.current * (Rt + R_PLASMA)) : 0;
    return {
      c: c, B: B, emf: emf, iGen: iGen, force: force, a: a, dvDay: dvDay, dvReq: dvReq,
      days: days, mass: mass, stress: stress, tension: tension, powerNeeded: powerNeeded, v: v
    };
  }

  function readForm() {
    var f = document.getElementById('calc-form');
    if (!f) return null;
    return {
      length: parseFloat(document.getElementById('length').value),
      current: parseFloat(document.getElementById('current').value),
      altitude: parseFloat(document.getElementById('altitude').value),
      endmass: parseFloat(document.getElementById('endmass').value),
      conductor: document.getElementById('conductor').value
    };
  }

  function setParams(next) {
    var f = document.getElementById('calc-form');
    if (!f) return;
    if (next.length != null) document.getElementById('length').value = String(next.length);
    if (next.current != null) document.getElementById('current').value = String(next.current);
    if (next.altitude != null) document.getElementById('altitude').value = String(next.altitude);
    if (next.endmass != null) document.getElementById('endmass').value = String(next.endmass);
    if (next.conductor) document.getElementById('conductor').value = next.conductor;
    update();
  }

  function fmt(v, d) {
    if (!isFinite(v)) return '—';
    if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString('en-GB');
    return v.toFixed(d == null ? 1 : d);
  }

  var SVGNS = 'http://www.w3.org/2000/svg';

  function drawChart(p, res) {
    var svg = document.getElementById('chart');
    if (!svg) return;
    var W = 560, H = 220;
    var m = { l: 52, r: 14, t: 16, b: 34 };
    var w = W - m.l - m.r;
    var h = H - m.t - m.b;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var maxI = 3;
    var peak = model(Object.assign({}, p, { current: maxI }));
    var yMax = Math.max(peak.dvDay, res.dvDay, 1);
    yMax = Math.ceil(yMax * 1.15);

    var X = function (i) { return m.l + (i / maxI) * w; };
    var Y = function (v) { return m.t + h - (v / yMax) * h; };

    var el = function (name, attrs) {
      var n = document.createElementNS(SVGNS, name);
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') { n.textContent = attrs[k]; return; }
        n.setAttribute(k, attrs[k]);
      });
      return n;
    };

    // grid
    for (var i = 0; i <= maxI; i += 1) {
      svg.appendChild(el('line', { x1: X(i), y1: m.t, x2: X(i), y2: m.t + h, stroke: 'rgba(230,235,245,0.09)', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: X(i), y: m.t + h + 18, fill: '#8a93a8', 'font-size': 9, 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle', text: i + ' A' }));
    }
    for (var g = 0; g <= 4; g += 1) {
      var gv = (yMax * g) / 4;
      svg.appendChild(el('line', { x1: m.l, y1: Y(gv), x2: m.l + w, y2: Y(gv), stroke: 'rgba(230,235,245,0.07)', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: m.l - 8, y: Y(gv) + 3, fill: '#8a93a8', 'font-size': 9, 'font-family': 'DM Mono, monospace', 'text-anchor': 'end', text: gv >= 10 ? Math.round(gv) : gv.toFixed(1) }));
    }

    // generator limit
    var iLim = Math.min(res.iGen, maxI);
    svg.appendChild(el('line', { x1: X(iLim), y1: m.t, x2: X(iLim), y2: m.t + h, stroke: '#e3a857', 'stroke-width': 1, 'stroke-dasharray': '2 4', opacity: 0.55 }));

    // curve: solid up to the generator limit, dashed beyond
    var pts = function (from, to) {
      var d = '';
      var steps = 24;
      for (var k = 0; k <= steps; k += 1) {
        var cur = from + ((to - from) * k) / steps;
        var m2 = model(Object.assign({}, p, { current: cur }));
        d += (k === 0 ? 'M' : 'L') + X(cur).toFixed(1) + ' ' + Y(m2.dvDay).toFixed(1);
      }
      return d;
    };
    svg.appendChild(el('path', { d: pts(0, iLim), fill: 'none', stroke: '#9fb6d6', 'stroke-width': 2 }));
    if (res.iGen < maxI) {
      svg.appendChild(el('path', { d: pts(iLim, maxI), fill: 'none', stroke: '#9fb6d6', 'stroke-width': 1.4, 'stroke-dasharray': '5 4', opacity: 0.7 }));
    }

    // operating point
    var px = X(Math.min(p.current, maxI));
    var py = Y(res.dvDay);
    svg.appendChild(el('line', { x1: px, y1: m.t, x2: px, y2: m.t + h, stroke: 'rgba(227,168,87,0.35)', 'stroke-width': 1 }));
    svg.appendChild(el('circle', { cx: px, cy: py, r: 4, fill: '#e3a857' }));
    svg.appendChild(el('text', {
      x: Math.min(px + 10, W - 90), y: Math.max(py - 8, m.t + 12),
      fill: '#e6ebf5', 'font-size': 10, 'font-family': 'DM Mono, monospace',
      text: p.current.toFixed(1) + ' A → ' + res.dvDay.toFixed(1) + ' m/s/d'
    }));

    svg.setAttribute('aria-label', 'Velocity change per day against current: ' + res.dvDay.toFixed(1) +
      ' metres per second per day at ' + p.current.toFixed(1) + ' amperes, with the self-generated limit at ' + res.iGen.toFixed(1) + ' amperes.');
  }

  function update() {
    var p = readForm();
    if (!p) return;
    var res = model(p);

    var set = function (id, value, unit) {
      var node = document.getElementById(id);
      if (node) node.innerHTML = value + '<span>' + unit + '</span>';
    };
    set('out-b', (res.B * 1e6).toFixed(1), '&micro;T');
    set('out-emf', fmt(res.emf, 0), 'V');
    set('out-force', res.force < 1 ? (res.force * 1000).toFixed(0) : res.force.toFixed(2), res.force < 1 ? 'mN' : 'N');
    set('out-accel', (res.a * 1000).toFixed(2), 'mm/s&sup2;');
    set('out-dv', res.dvDay.toFixed(1), 'm/s');
    set('out-days', isFinite(res.days) ? (res.days < 1 ? res.days.toFixed(2) : res.days < 100 ? res.days.toFixed(1) : String(Math.round(res.days))) : '—', 'days');
    set('out-mass', res.mass.toFixed(1), 'kg');
    set('out-stress', res.stress.toFixed(0), 'MPa');

    var out = {
      length: document.getElementById('length-out'),
      current: document.getElementById('current-out'),
      altitude: document.getElementById('altitude-out'),
      endmass: document.getElementById('endmass-out')
    };
    if (out.length) out.length.textContent = p.length.toFixed(1) + ' km';
    if (out.current) out.current.textContent = p.current.toFixed(1) + ' A';
    if (out.altitude) out.altitude.textContent = Math.round(p.altitude) + ' km';
    if (out.endmass) out.endmass.textContent = Math.round(p.endmass) + ' kg';

    var note = document.getElementById('chart-note');
    if (note) note.textContent = 'generator limit ' + res.iGen.toFixed(1) + ' A';

    var verdict = document.getElementById('calc-verdict');
    if (verdict) {
      var notes = [];
      var bad = false;
      if (p.current > res.iGen * 1.02) {
        bad = true;
        notes.push('Above the self-generated limit of ' + res.iGen.toFixed(1) + ' A: the bus has to drive the contactor, which costs ' + Math.round(res.powerNeeded) + ' W at this altitude.');
      }
      if (isFinite(res.days) && res.days > 25 * 365) {
        bad = true;
        notes.push('At ' + res.dvDay.toFixed(1) + ' m/s per day the line needs ' + Math.round(res.days / 365) + ' years to reach 120 km, which fails the 25-year guideline.');
      }
      if (res.stress > res.c.yieldMPa / 1.5) {
        bad = true;
        notes.push('Tension of ' + res.tension.toFixed(1) + ' N puts ' + res.stress.toFixed(0) + ' MPa on the conductor, past a 1.5 factor on yield.');
      }
      verdict.classList.toggle('is-bad', bad);
      if (!notes.length) {
        notes.push('Deorbit in ' + res.days.toFixed(1) + ' days from ' + Math.round(p.altitude) + ' km: ' +
          Math.round(res.dvReq) + ' m/s of drag-free velocity to lose, ' + res.force.toFixed(2) + ' N of Lorentz force, ' +
          res.mass.toFixed(1) + ' kg of conductor.');
      }
      verdict.textContent = notes.join(' ');
    }

    drawChart(p, res);
    window.__tetherState = { p: p, res: res };
  }

  var form = document.getElementById('calc-form');
  if (form) {
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    var reset = document.getElementById('reset');
    if (reset) {
      reset.addEventListener('click', function () {
        setParams({ length: 5, current: 0.6, altitude: 400, endmass: 500, conductor: 'al' });
      });
    }
    update();
    window.addEventListener('resize', function () { drawChart(readForm(), model(readForm())); });
  }

  /* hero drawing */

  var canvas = document.getElementById('limb');
  if (canvas && canvas.getContext) {
    var draw = function () {
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth || 1440;
      var h = canvas.clientHeight || 880;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#080d1a');
      sky.addColorStop(0.5, '#0a0f20');
      sky.addColorStop(1, '#070a14');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // stars, deterministic
      for (var i = 0; i < 150; i += 1) {
        var sx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
        var sy = ((Math.sin(i * 78.233) * 12543.123) % 1 + 1) % 1;
        var r = 0.5 + ((i * 37) % 10) / 15;
        ctx.globalAlpha = 0.16 + ((i * 53) % 40) / 100;
        ctx.fillStyle = 'rgba(230,235,245,0.9)';
        ctx.beginPath();
        ctx.arc(sx * w, sy * h * 0.9, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      var narrow = w < 700;
      var cx = narrow ? w * 0.98 : w * 0.8;
      var cy = narrow ? h * 1.38 : h * 1.36;
      var rad = narrow ? h * 0.72 : h * 0.92;

      // atmosphere glow outside the limb
      var glow = ctx.createRadialGradient(cx, cy, rad * 0.98, cx, cy, rad * 1.14);
      glow.addColorStop(0, 'rgba(122,176,224,0.4)');
      glow.addColorStop(0.35, 'rgba(96,148,200,0.16)');
      glow.addColorStop(1, 'rgba(96,148,200,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 1.16, 0, Math.PI * 2);
      ctx.fill();

      // earth disc
      var earth = ctx.createLinearGradient(cx - rad * 0.6, cy - rad, cx + rad * 0.5, cy + rad * 0.6);
      earth.addColorStop(0, '#2b4c68');
      earth.addColorStop(0.22, '#1b3550');
      earth.addColorStop(0.6, '#0d1c30');
      earth.addColorStop(1, '#08111f');
      ctx.fillStyle = earth;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      // cloud bands near the limb
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(198,222,242,0.13)';
      for (var b = 0; b < 26; b += 1) {
        var ang = -2.7 + (b % 13) * 0.14 + ((b * 7) % 5) * 0.02;
        var rr = rad * (0.9 + ((b * 13) % 8) / 90);
        var bx = cx + Math.cos(ang) * rr;
        var by = cy + Math.sin(ang) * rr;
        ctx.beginPath();
        ctx.ellipse(bx, by, rad * (0.16 + ((b * 3) % 7) / 50), rad * 0.019, ang + Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // limb light
      ctx.strokeStyle = 'rgba(178,214,244,0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,170,215,0.25)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, rad + 3, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();

      // tether
      if (narrow) return;
      var satX = narrow ? w * 0.74 : w * 0.88;
      var satY = narrow ? h * 0.24 : h * 0.3;
      var dirX = cx - satX;
      var dirY = cy - satY;
      var len = Math.sqrt(dirX * dirX + dirY * dirY);
      var tetherFrac = narrow ? 0.42 : 0.46;
      var endX = satX + (dirX / len) * len * tetherFrac;
      var endY = satY + (dirY / len) * len * tetherFrac;

      ctx.strokeStyle = 'rgba(159,182,214,0.85)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // bus
      ctx.fillStyle = '#e3a857';
      ctx.fillRect(satX - 4, satY - 4, 8, 8);
      ctx.strokeStyle = 'rgba(230,235,245,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(satX - 11, satY - 11, 22, 22);

      // end mass
      ctx.fillStyle = '#9fb6d6';
      ctx.beginPath();
      ctx.arc(endX, endY, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // mono labels
      ctx.font = '10px "DM Mono", monospace';
      ctx.fillStyle = 'rgba(230,235,245,0.62)';
      ctx.textAlign = 'left';
      ctx.fillText('bus 6U', satX + 16, satY - 2);
      var midX = satX + (endX - satX) * 0.55;
      var midY = satY + (endY - satY) * 0.55;
      ctx.fillStyle = 'rgba(159,182,214,0.85)';
      ctx.fillText('5.0 km', midX + 8, midY);
      ctx.fillStyle = 'rgba(230,235,245,0.5)';
      ctx.fillText('end mass 500 kg', endX - 30, endY + 22);
    };

    draw();
    window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  }

  /* programme filter */

  var chips = document.querySelectorAll('[data-filter]');
  var programmes = document.querySelectorAll('.programme');
  if (chips.length && programmes.length) {
    var count = document.getElementById('programme-count');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var kind = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        programmes.forEach(function (pr) {
          var match = kind === 'all' || (pr.dataset.cat || '').split(' ').indexOf(kind) !== -1;
          pr.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (count) count.textContent = shown + ' of ' + programmes.length + ' shown';
      });
    });
  }

  /* brief form */

  var brief = document.getElementById('brief-form');
  if (brief) {
    var panel = document.getElementById('brief-result');
    var preview = document.getElementById('brief-preview');
    var send = document.getElementById('brief-send');

    var errFor = function (field, msg) {
      var e = document.getElementById('err-' + field.name);
      if (e) e.textContent = msg;
      if (field.type !== 'checkbox') field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };

    var validate = function () {
      var ok = true;
      Array.prototype.forEach.call(brief.querySelectorAll('input, select, textarea'), function (field) {
        if (field.type === 'checkbox') {
          errFor(field, field.checked ? '' : 'Please confirm we may hold this note.');
          if (!field.checked) ok = false;
          return;
        }
        var v = field.value.trim();
        var msg = '';
        if (field.required && !v) msg = 'Required.';
        else if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Check the address.';
        else if (field.type === 'number' && v && (Number(v) < 1 || Number(v) > 2000)) msg = 'We work between 1 kg and 2 000 kg.';
        errFor(field, msg);
        if (msg) ok = false;
      });
      return ok;
    };

    brief.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!validate()) {
        if (panel) panel.hidden = true;
        var firstBad = brief.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var d = {
        name: brief.elements.name.value.trim(),
        email: brief.elements.email.value.trim(),
        org: brief.elements.org.value.trim() || '—',
        mass: brief.elements.mass.value || '—',
        orbit: brief.elements.orbit.value,
        when: brief.elements.when.value,
        message: brief.elements.message.value.trim()
      };
      var text = [
        'MISSION NOTE — LONGLINE',
        'name    ' + d.name + ' <' + d.email + '>',
        'org     ' + d.org,
        'mass    ' + d.mass + ' kg',
        'orbit   ' + d.orbit,
        'when    ' + d.when,
        '',
        d.message
      ].join('\n');
      preview.textContent = text;
      send.href = 'mailto:post@longline.example?subject=' +
        encodeURIComponent('Mission note — ' + d.orbit + ' — ' + d.name) +
        '&body=' + encodeURIComponent(text);
      panel.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    brief.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('aria-invalid') === 'true') errFor(ev.target, '');
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  window.__tether = {
    set: setParams,
    run: update,
    read: function () {
      var s = window.__tetherState;
      if (!s) return null;
      return {
        length: s.p.length,
        current: s.p.current,
        altitude: s.p.altitude,
        force: Math.round(s.res.force * 1000) / 1000,
        dvDay: Math.round(s.res.dvDay * 10) / 10,
        days: Math.round(s.res.days * 10) / 10,
        iGen: Math.round(s.res.iGen * 10) / 10,
        mass: Math.round(s.res.mass * 10) / 10,
        stress: Math.round(s.res.stress),
        verdict: (document.getElementById('calc-verdict') || {}).textContent || '',
        chartNodes: (document.getElementById('chart') || { childNodes: [] }).childNodes.length
      };
    }
  };
})();
