/* Hardpoint — bay model.
   Closed-form Euler-Bernoulli estimates. Everything here is an estimate;
   flight numbers come from test. */

(function () {
  'use strict';

  var MATERIALS = {
    al: { label: 'Al 6061-T6', E: 69e9, alpha: 23.6e-6, rho: 2700, sigma: 276e6, wall: 0.004 },
    cfrp: { label: 'CFRP M55J', E: 300e9, alpha: -0.6e-6, rho: 1600, sigma: 490e6, wall: 0.003 },
    ti: { label: 'Ti-6Al-4V', E: 114e9, alpha: 8.6e-6, rho: 4430, sigma: 880e6, wall: 0.004 },
    invar: { label: 'Invar 36', E: 141e9, alpha: 1.2e-6, rho: 8100, sigma: 276e6, wall: 0.004 }
  };

  var OD = 0.2;          // tube outer diameter, m
  var PANELS = 3;
  var FORM = document.getElementById('bay-form');

  function geometry(mat) {
    var id = OD - 2 * mat.wall;
    var A = Math.PI * (OD * OD - id * id) / 4;
    var I = Math.PI * (Math.pow(OD, 4) - Math.pow(id, 4)) / 64;
    return { A: A, I: I, mprime: mat.rho * A };
  }

  function model(p) {
    var mat = MATERIALS[p.material] || MATERIALS.cfrp;
    var g = geometry(mat);
    var L = p.length;
    var EI = mat.E * g.I;

    var growth = mat.alpha * L * p.dT * 1000;                                  // mm
    var mode = (Math.pow(1.8751, 2) / (2 * Math.PI)) * Math.sqrt(EI / (g.mprime * Math.pow(L, 4)));
    var deflect = (p.load * Math.pow(L, 3)) / (3 * EI) * 1000;                 // mm
    var kappa = mat.alpha * p.gradient / OD;                                   // 1/m
    var bow = (kappa * L * L / 2) * 1000;                                      // mm at tip
    var mass = 4 * g.mprime * L + 12 * 3 + 16 * 0.9 * 0.26 + 2 * 4.5;          // kg
    var M = p.load * L;
    var sigma = (M * (OD / 2) / g.I + p.load / g.A) / 1e6;                     // MPa
    var margin = mat.sigma / 1e6 / 1.5;

    var verdict = [];
    if (mode < 0.08) verdict.push('First mode ' + mode.toFixed(2) + ' Hz sits inside the attitude-control band (floor 0.08 Hz) — the controller will fight the structure.');
    if (deflect > p.budget) verdict.push('Tip moves ' + (deflect - p.budget).toFixed(1) + ' mm past the ' + p.budget.toFixed(1) + ' mm alignment budget under a ' + p.load + ' N push.');
    if (sigma > margin) verdict.push('Root stress ' + sigma.toFixed(0) + ' MPa leaves no 1.5 factor on yield for this material.');
    if (Math.abs(growth) > 12) verdict.push('Free growth of ' + Math.abs(growth).toFixed(1) + ' mm has to be absorbed by the interface, not by the bay.');

    return {
      mat: mat, L: L, growth: growth, mode: mode, deflect: deflect, bow: bow,
      mass: mass, sigma: sigma, margin: margin, verdict: verdict
    };
  }

  function readForm() {
    if (!FORM) return null;
    return {
      material: document.getElementById('material').value,
      length: parseFloat(document.getElementById('length').value),
      dT: parseFloat(document.getElementById('deltaT').value),
      gradient: parseFloat(document.getElementById('gradient').value),
      load: parseFloat(document.getElementById('load').value),
      budget: parseFloat(document.getElementById('budget').value)
    };
  }

  function bound(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function setParams(next) {
    if (!FORM) return;
    if (next.material) document.getElementById('material').value = next.material;
    var ids = { length: 'length', dT: 'deltaT', gradient: 'gradient', load: 'load', budget: 'budget' };
    Object.keys(ids).forEach(function (k) {
      if (typeof next[k] === 'number') document.getElementById(ids[k]).value = String(bound(next[k], -1e9, 1e9));
    });
    update();
  }

  var canvas = document.getElementById('elevation');
  var ctx = canvas ? canvas.getContext('2d') : null;

  function drawElevation(res, p) {
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = canvas.clientWidth || 720;
    var cssH = Math.round(cssW * (420 / 720));
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var cs = getComputedStyle(document.documentElement);
    var ink = cs.getPropertyValue('--ink-2').trim() || '#bac4cc';
    var muted = cs.getPropertyValue('--muted').trim() || '#8d979f';
    var accent = cs.getPropertyValue('--accent').trim() || '#e07a4a';

    var m = { l: 62, r: 26, t: 26, b: 46 };
    var w = cssW - m.l - m.r;
    var h = cssH - m.t - m.b;
    var axisY = m.t + h * 0.52;
    var depth = Math.min(96, h * 0.34);

    // grid
    ctx.strokeStyle = 'rgba(233,238,242,0.08)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 8; i += 1) {
      var gx = m.l + (w * i) / 8;
      ctx.beginPath(); ctx.moveTo(gx, m.t); ctx.lineTo(gx, m.t + h); ctx.stroke();
    }
    for (var j = 0; j <= 4; j += 1) {
      var gy = m.t + (h * j) / 4;
      ctx.beginPath(); ctx.moveTo(m.l, gy); ctx.lineTo(m.l + w, gy); ctx.stroke();
    }

    var span = Math.max(res.deflect, res.bow, 0.2);
    var targetPx = 34;
    var exag = Math.max(1, Math.round(targetPx / span));

    var deflShape = function (x01) {
      // cantilever shape for a tip load, normalised to 1 at the tip
      return (x01 * x01 * (3 - x01)) / 2;
    };
    var bowShape = function (x01) { return x01 * x01; };

    var disp = function (x01) {
      return (res.deflect * deflShape(x01) + res.bow * bowShape(x01)) * exag;
    };
    var thermalOnly = function (x01) { return res.bow * bowShape(x01) * exag; };

    var toX = function (x01) { return m.l + x01 * w; };

    // wall
    ctx.fillStyle = 'rgba(233,238,242,0.07)';
    ctx.fillRect(m.l - 12, m.t + 4, 12, h - 8);
    ctx.strokeStyle = 'rgba(233,238,242,0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(m.l, m.t + 4); ctx.lineTo(m.l, m.t + h - 4); ctx.stroke();
    ctx.strokeStyle = 'rgba(233,238,242,0.28)';
    ctx.lineWidth = 1;
    for (var s = m.t + 8; s < m.t + h - 6; s += 9) {
      ctx.beginPath(); ctx.moveTo(m.l - 12, s); ctx.lineTo(m.l, s + 9); ctx.stroke();
    }

    function chord(x01, offset, dashed, colour, width, alpha) {
      ctx.beginPath();
      var steps = 40;
      for (var k = 0; k <= steps; k += 1) {
        var t = (x01 * k) / steps;
        var px = toX(t);
        var py = axisY + offset + (dashed ? thermalOnly(t) : disp(t));
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.setLineDash(dashed ? [4, 4] : []);
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // undeformed reference
    chord(1, 0, false, 'rgba(233,238,242,0.18)', 1, 1);

    // thermal-only shape, dashed
    chord(1, 0, true, accent, 1.3, 0.85);

    // deformed truss
    var panelW = 1 / PANELS;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.6;
    for (var pc = 0; pc <= PANELS; pc += 1) {
      var x01 = pc * panelW;
      var px = toX(x01);
      var py = axisY + disp(x01);
      ctx.beginPath();
      ctx.moveTo(px, py - depth / 2);
      ctx.lineTo(px, py + depth / 2);
      ctx.stroke();
      // diagonals
      if (pc < PANELS) {
        var nx = toX((pc + 1) * panelW);
        var ny = axisY + disp((pc + 1) * panelW);
        ctx.beginPath();
        if (pc % 2 === 0) {
          ctx.moveTo(px, py - depth / 2);
          ctx.lineTo(nx, ny + depth / 2);
        } else {
          ctx.moveTo(px, py + depth / 2);
          ctx.lineTo(nx, ny - depth / 2);
        }
        ctx.stroke();
      }
    }
    // chords
    for (var c = -1; c <= 1; c += 2) {
      ctx.beginPath();
      var steps = 48;
      for (var q = 0; q <= steps; q += 1) {
        var t2 = q / steps;
        var cxp = toX(t2);
        var cyp = axisY + (c * depth) / 2 + disp(t2);
        if (q === 0) ctx.moveTo(cxp, cyp); else ctx.lineTo(cxp, cyp);
      }
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = ink;
      ctx.stroke();
    }

    // tip marker and value
    var tipY = axisY + disp(1);
    ctx.beginPath();
    ctx.arc(toX(1), tipY, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = accent;
    ctx.textAlign = 'left';
    ctx.fillText('tip ' + (res.deflect + res.bow).toFixed(1) + ' mm', Math.min(toX(1) + 8, cssW - 78), tipY + 4);

    // dimension line for length
    ctx.strokeStyle = 'rgba(233,238,242,0.4)';
    ctx.lineWidth = 1;
    var dy = m.t + h + 6;
    ctx.beginPath();
    ctx.moveTo(m.l, dy); ctx.lineTo(m.l + w, dy);
    ctx.moveTo(m.l, dy - 5); ctx.lineTo(m.l, dy + 5);
    ctx.moveTo(m.l + w, dy - 5); ctx.lineTo(m.l + w, dy + 5);
    ctx.stroke();
    ctx.fillStyle = muted;
    ctx.textAlign = 'center';
    ctx.fillText('L = ' + p.length.toFixed(1) + ' m', m.l + w / 2, dy + 18);

    // scale bar
    ctx.textAlign = 'left';
    ctx.fillText('1 m', m.l + 4, m.t + 12);
    ctx.strokeStyle = 'rgba(233,238,242,0.5)';
    var pxPerM = w / p.length;
    ctx.beginPath();
    ctx.moveTo(m.l + 34, m.t + 9); ctx.lineTo(m.l + 34 + pxPerM, m.t + 9);
    ctx.moveTo(m.l + 34, m.t + 6); ctx.lineTo(m.l + 34, m.t + 12);
    ctx.moveTo(m.l + 34 + pxPerM, m.t + 6); ctx.lineTo(m.l + 34 + pxPerM, m.t + 12);
    ctx.stroke();
  }

  function update() {
    if (!FORM || !canvas) return;
    var p = readForm();
    var res = model(p);

    var set = function (id, v, unit) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = v + '<span>' + unit + '</span>';
    };
    set('out-growth', (res.growth >= 0 ? '+' : '') + res.growth.toFixed(1), 'mm');
    set('out-mode', res.mode.toFixed(1), 'Hz');
    set('out-deflect', res.deflect.toFixed(1), 'mm');
    set('out-bow', res.bow.toFixed(1), 'mm');
    set('out-mass', res.mass.toFixed(0), 'kg');
    set('out-stress', res.sigma.toFixed(0), 'MPa');

    var out = {
      length: document.getElementById('length-out'),
      deltaT: document.getElementById('deltaT-out'),
      gradient: document.getElementById('gradient-out'),
      load: document.getElementById('load-out'),
      budget: document.getElementById('budget-out')
    };
    if (out.length) out.length.textContent = p.length.toFixed(1) + ' m';
    if (out.deltaT) out.deltaT.textContent = (p.dT < 0 ? '\u2212' : '+') + Math.abs(p.dT) + ' K';
    if (out.gradient) out.gradient.textContent = p.gradient + ' K';
    if (out.load) out.load.textContent = p.load + ' N';
    if (out.budget) out.budget.textContent = p.budget.toFixed(1) + ' mm';

    var verdict = document.getElementById('verdict');
    if (verdict) {
      var bad = res.verdict.length > 0;
      verdict.classList.toggle('is-bad', bad);
      if (!bad) {
        verdict.textContent = 'Within budget: ' + res.mode.toFixed(1) + ' Hz first mode, ' + (res.deflect + res.bow).toFixed(1) +
          ' mm total tip movement against a ' + p.budget.toFixed(1) + ' mm budget, ' + Math.round(res.margin - res.sigma) + ' MPa of yield margin left.';
      } else {
        verdict.textContent = res.verdict[0];
      }
    }

    var exagEl = document.getElementById('exag');
    drawElevation(res, p);
    if (exagEl) {
      var span = Math.max(res.deflect, res.bow, 0.2);
      exagEl.textContent = String(Math.max(1, Math.round(34 / span)));
    }

    window.__trussState = { p: p, res: res };
  }

  if (FORM) {
    FORM.addEventListener('input', update);
    FORM.addEventListener('change', update);
    var eclipse = document.getElementById('eclipse');
    var sun = document.getElementById('sun');
    if (eclipse) eclipse.addEventListener('click', function () { setParams({ dT: -140, gradient: 26 }); });
    if (sun) sun.addEventListener('click', function () { setParams({ dT: 120, gradient: 12 }); });
    update();
    window.addEventListener('resize', update);
  }

  /* structures filter */

  var chips = document.querySelectorAll('[data-kind]');
  var structures = document.querySelectorAll('.structure');
  if (chips.length && structures.length) {
    var counter = document.getElementById('structure-count');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var kind = chip.dataset.kind;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        structures.forEach(function (s) {
          var match = kind === 'all' || s.dataset.type === kind;
          s.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (counter) counter.textContent = shown + ' of ' + structures.length + ' shown';
      });
    });
  }

  /* statement of work form */

  var form = document.getElementById('statement-form');
  if (form) {
    var panel = document.getElementById('statement-result');
    var preview = document.getElementById('statement-preview');
    var send = document.getElementById('statement-send');

    var errFor = function (field, msg) {
      var e = document.getElementById('err-' + field.name);
      if (e) e.textContent = msg;
      if (field.type !== 'checkbox') field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };

    var validate = function () {
      var ok = true;
      Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (field) {
        if (field.type === 'checkbox') {
          errFor(field, field.checked ? '' : 'Please confirm the note is not confidential before we file it.');
          if (!field.checked) ok = false;
          return;
        }
        var v = field.value.trim();
        var msg = '';
        if (field.required && !v) msg = 'Required.';
        else if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'That address will not route.';
        else if (field.type === 'number' && v && (Number(v) < 0.5 || Number(v) > 30)) msg = 'Bay lengths we build run from 0.5 m to 30 m.';
        errFor(field, msg);
        if (msg) ok = false;
      });
      return ok;
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!validate()) {
        if (panel) panel.hidden = true;
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var d = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        org: form.elements.org.value.trim() || '—',
        mission: form.elements.mission.value,
        length: form.elements.baylength.value || '—',
        env: form.elements.environment.value,
        message: form.elements.message.value.trim()
      };
      var text = [
        'STATEMENT OF WORK — HARDPOINT',
        'contact   ' + d.name + ' <' + d.email + '>',
        'client    ' + d.org,
        'class     ' + d.mission,
        'bay       ' + d.length + ' m',
        'env       ' + d.env,
        '',
        d.message
      ].join('\n');
      preview.textContent = text;
      send.href = 'mailto:structures@hardpoint.example?subject=' +
        encodeURIComponent('Statement of work — ' + d.mission + ' — ' + d.name) +
        '&body=' + encodeURIComponent(text);
      panel.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    form.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('aria-invalid') === 'true') errFor(ev.target, '');
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  window.__truss = {
    set: setParams,
    run: update,
    read: function () {
      var s = window.__trussState;
      if (!s) return null;
      return {
        material: s.p.material,
        length: s.p.length,
        growth: Math.round(s.res.growth * 10) / 10,
        mode: Math.round(s.res.mode * 10) / 10,
        deflect: Math.round(s.res.deflect * 10) / 10,
        bow: Math.round(s.res.bow * 10) / 10,
        mass: Math.round(s.res.mass),
        stress: Math.round(s.res.sigma),
        verdict: (document.getElementById('verdict') || {}).textContent || ''
      };
    }
  };
})();
