/* Slipstream — levitation gap and drag model, plus the speed ribbon.
   Two-parameter fit to published test-line data. A design aid, not a certificate. */

(function () {
  'use strict';

  var MU0 = 4e-7 * Math.PI;
  var B_NOM = 0.85;       // T at the nominal gap, 800 kA
  var GAP_NOM = 0.100;    // m
  var LAMBDA = 0.055;     // m, decay length of the null-flux field
  var AREA = 8.0;         // m2 of active magnet area per car
  var ETA = 0.35;         // null-flux coupling efficiency
  var CDA = 7.5;          // m2
  var AUX = 2500;         // N, guidance, cooling and auxiliaries
  var SEATS = 600;
  var G = 9.81;

  function fieldAt(gap, current) {
    return B_NOM * (current / 800) * Math.exp(-(gap - GAP_NOM) / LAMBDA);
  }

  function liftAt(gap, current) {
    var B = fieldAt(gap, current);
    return (B * B / (2 * MU0)) * AREA * ETA;
  }

  function model(p) {
    var weight = p.mass * 1000 * G;
    var Bneed = Math.sqrt((weight * 2 * MU0) / (AREA * ETA));
    var ratio = Bneed / (B_NOM * (p.current / 800));
    var gapEq = ratio > 0 && ratio <= 1 ? GAP_NOM - LAMBDA * Math.log(ratio) : 0.3;
    gapEq = Math.max(0.02, Math.min(0.3, gapEq));
    var liftNom = liftAt(GAP_NOM, p.current);
    var margin = liftNom / weight - 1;

    var rho = 1.225 * (p.pressure / 101.325);
    var v = p.speed / 3.6;
    var aero = 0.5 * rho * CDA * v * v;
    var mdrag = p.speed > 0 ? 2427 * v * Math.exp(-v / 28) : 0;
    var total = aero + mdrag + AUX;
    var power = p.speed > 0 ? (total * v) / 0.86 : 0;
    var energy = p.speed > 0 ? (power * 1000) / (v * SEATS * 3600) : 0;
    return {
      weight: weight, gapEq: gapEq * 1000, margin: margin * 100, liftNom: liftNom,
      rho: rho, v: v, aero: aero, mdrag: mdrag, total: total, power: power, energy: energy
    };
  }

  function readForm() {
    var f = document.getElementById('gap-form');
    if (!f) return null;
    return {
      speed: parseFloat(document.getElementById('speed').value),
      mass: parseFloat(document.getElementById('mass').value),
      current: parseFloat(document.getElementById('current').value),
      pressure: parseFloat(document.getElementById('pressure').value)
    };
  }

  function setParams(next) {
    if (!document.getElementById('gap-form')) return;
    if (next.speed != null) document.getElementById('speed').value = String(next.speed);
    if (next.mass != null) document.getElementById('mass').value = String(next.mass);
    if (next.current != null) document.getElementById('current').value = String(next.current);
    if (next.pressure != null) document.getElementById('pressure').value = String(next.pressure);
    update();
  }

  var SVGNS = 'http://www.w3.org/2000/svg';

  function drawChart(p, res) {
    var svg = document.getElementById('drag-chart');
    if (!svg) return;
    var W = 640, H = 240;
    var m = { l: 46, r: 16, t: 18, b: 34 };
    var w = W - m.l - m.r, h = H - m.t - m.b;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var el = function (name, attrs, text) {
      var n = document.createElementNS(SVGNS, name);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (text != null) n.textContent = text;
      return n;
    };

    var peak = model(Object.assign({}, p, { speed: 700 })).total;
    var yMax = Math.max(peak, res.total, 5) * 1.12;
    var X = function (s) { return m.l + (s / 700) * w; };
    var Y = function (f) { return m.t + h - (Math.min(f, yMax) / yMax) * h; };

    for (var s = 0; s <= 700; s += 100) {
      svg.appendChild(el('line', { x1: X(s), y1: m.t, x2: X(s), y2: m.t + h, stroke: 'rgba(26,26,22,0.09)' }));
      svg.appendChild(el('text', { x: X(s), y: m.t + h + 18, fill: '#63645a', 'font-size': 9, 'font-family': 'Space Mono, monospace', 'text-anchor': 'middle' }, s));
    }
    for (var g = 0; g <= 4; g += 1) {
      var gv = (yMax * g) / 4;
      svg.appendChild(el('line', { x1: m.l, y1: Y(gv), x2: m.l + w, y2: Y(gv), stroke: 'rgba(26,26,22,0.09)' }));
      svg.appendChild(el('text', { x: m.l - 8, y: Y(gv) + 3, fill: '#63645a', 'font-size': 9, 'font-family': 'Space Mono, monospace', 'text-anchor': 'end' }, (gv / 1000).toFixed(gv >= 10000 ? 0 : 1)));
    }

    var line = function (key, stroke, width, dash) {
      var d = '';
      for (var k = 0; k <= 40; k += 1) {
        var sp = (700 * k) / 40;
        var mm = model(Object.assign({}, p, { speed: sp }));
        d += (k === 0 ? 'M' : 'L') + X(sp).toFixed(1) + ' ' + Y(mm[key]).toFixed(1);
      }
      var attrs = { d: d, fill: 'none', stroke: stroke, 'stroke-width': width };
      if (dash) attrs['stroke-dasharray'] = dash;
      svg.appendChild(el('path', attrs));
    };

    line('aero', '#63645a', 1.2, '6 4');
    line('mdrag', '#8a8b80', 1.2, '2 4');
    line('total', '#a5310f', 2.2);

    var px = X(Math.min(p.speed, 700));
    var py = Y(res.total);
    svg.appendChild(el('line', { x1: px, y1: m.t, x2: px, y2: m.t + h, stroke: 'rgba(165,49,15,0.3)' }));
    svg.appendChild(el('circle', { cx: px, cy: py, r: 4, fill: '#be3a22' }));

    // legend inside the plot, top right
    var lx = m.l + w - 138, ly = m.t + 8;
    svg.appendChild(el('rect', { x: lx - 8, y: ly - 6, width: 146, height: 60, fill: 'rgba(245,244,239,0.86)', stroke: 'rgba(26,26,22,0.1)' }));
    var items = [['Total', '#a5310f', null], ['Aerodynamic', '#63645a', '6 4'], ['Magnetic', '#8a8b80', '2 4']];
    items.forEach(function (it, i) {
      var y = ly + 8 + i * 17;
      var a = { x1: lx, y1: y, x2: lx + 16, y2: y, stroke: it[1], 'stroke-width': i === 0 ? 2.2 : 1.2 };
      if (it[2]) a['stroke-dasharray'] = it[2];
      svg.appendChild(el('line', a));
      svg.appendChild(el('text', { x: lx + 22, y: y + 3, fill: '#45463d', 'font-size': 9, 'font-family': 'Space Mono, monospace' }, it[0]));
    });

    svg.setAttribute('aria-label', 'Drag against speed: ' + Math.round(res.total / 1000) +
      ' kilonewtons total at ' + p.speed + ' kilometres per hour, made up of ' + Math.round(res.aero / 1000) +
      ' aerodynamic and ' + (res.mdrag / 1000).toFixed(1) + ' magnetic kilonewtons.');
  }

  function update() {
    var p = readForm();
    if (!p) return;
    var res = model(p);

    var set = function (id, v, unit) {
      var n = document.getElementById(id);
      if (n) n.innerHTML = v + '<span>' + unit + '</span>';
    };
    set('out-gap', res.gapEq.toFixed(0), 'mm');
    set('out-lift', (res.margin >= 0 ? '+' : '') + res.margin.toFixed(0), '%');
    set('out-aero', (res.aero / 1000).toFixed(1), 'kN');
    set('out-mdrag', (res.mdrag / 1000).toFixed(1), 'kN');
    set('out-power', (res.power / 1e6).toFixed(1), 'MW');
    set('out-energy', res.energy.toFixed(0), 'Wh');

    var outs = {
      speed: document.getElementById('speed-out'),
      mass: document.getElementById('mass-out'),
      current: document.getElementById('current-out'),
      pressure: document.getElementById('pressure-out')
    };
    if (outs.speed) outs.speed.textContent = Math.round(p.speed) + ' km/h';
    if (outs.mass) outs.mass.textContent = Math.round(p.mass) + ' t';
    if (outs.current) outs.current.textContent = Math.round(p.current) + ' kA';
    if (outs.pressure) outs.pressure.textContent = Math.round(p.pressure) + ' kPa';

    var note = document.getElementById('chart-note');
    if (note) note.textContent = 'total ' + (res.total / 1000).toFixed(1) + ' kN at ' + Math.round(p.speed) + ' km/h';

    // section drawing
    var carGroup = document.getElementById('car-group');
    var gapText = document.getElementById('gap-text');
    var dim = document.getElementById('gap-dim');
    var shift = (res.gapEq - 120) * 0.22;
    if (carGroup) carGroup.setAttribute('transform', 'translate(0,' + (-shift).toFixed(1) + ')');
    if (gapText) gapText.textContent = res.gapEq.toFixed(0) + ' mm';
    if (dim) {
      var path = dim.querySelector('path');
      if (path) path.setAttribute('d', 'M340 ' + (158 - shift).toFixed(1) + 'v' + (32 + shift).toFixed(1));
    }

    var verdict = document.getElementById('verdict');
    if (verdict) {
      var notes = [];
      var bad = false;
      if (res.gapEq < 60) {
        bad = true;
        notes.push('Equilibrium gap ' + res.gapEq.toFixed(0) + ' mm is below the 60 mm floor: the car settles on the coil pack. Add current or take mass out.');
      }
      if (res.margin < 0.15) {
        bad = true;
        notes.push('Lift margin of ' + res.margin.toFixed(0) + ' % at the 100 mm design gap leaves no room for a passenger load or a warm magnet.');
      }
      if (p.speed > 0 && res.power / 1e6 > 25) {
        bad = true;
        notes.push('Traction demand of ' + (res.power / 1e6).toFixed(1) + ' MW is past what a single car can collect from the guideway; this speed needs a lower tunnel pressure or a longer train.');
      }
      verdict.classList.toggle('is-bad', bad);
      if (!notes.length) {
        notes.push('Gap settles at ' + res.gapEq.toFixed(0) + ' mm with ' + res.margin.toFixed(0) + ' % lift margin. At ' +
          Math.round(p.speed) + ' km/h the car needs ' + (res.power / 1e6).toFixed(1) + ' MW, or ' +
          res.energy.toFixed(0) + ' Wh per seat-kilometre.');
      }
      verdict.textContent = notes.join(' ');
    }

    drawChart(p, res);
    window.__maglevState = { p: p, res: res };
  }

  var form = document.getElementById('gap-form');
  if (form) {
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    var service = document.getElementById('preset-service');
    var record = document.getElementById('preset-record');
    if (service) service.addEventListener('click', function () { setParams({ speed: 500, mass: 40, current: 800, pressure: 40 }); });
    if (record) record.addEventListener('click', function () { setParams({ speed: 603, mass: 40, current: 900, pressure: 30 }); });
    update();
    window.addEventListener('resize', update);
  }

  /* speed ribbon */

  var ribbon = document.getElementById('speed-ribbon');
  if (ribbon && ribbon.getContext) {
    var drawRibbon = function () {
      var ctx = ribbon.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = ribbon.clientWidth || 1440;
      var h = ribbon.clientHeight || 200;
      if (ribbon.width !== Math.round(w * dpr) || ribbon.height !== Math.round(h * dpr)) {
        ribbon.width = Math.round(w * dpr);
        ribbon.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var pad = Math.max(24, w * 0.03);
      var compact = w < 620;
      var scaleY = compact ? h * 0.52 : h * 0.62;
      var tickTop = compact ? 14 : 28;
      var labelY = compact ? 34 : 52;
      var unitY = compact ? 48 : 70;
      var x0 = pad, x1 = w - pad;
      var X = function (s) { return x0 + (s / 700) * (x1 - x0); };

      // ground band
      var gb = ctx.createLinearGradient(0, scaleY, 0, h);
      gb.addColorStop(0, 'rgba(26,26,22,0.02)');
      gb.addColorStop(1, 'rgba(26,26,22,0.07)');
      ctx.fillStyle = gb;
      ctx.fillRect(0, scaleY, w, h - scaleY);

      // slab
      ctx.fillStyle = 'rgba(26,26,22,0.09)';
      ctx.fillRect(x0 - 20, scaleY, (x1 - x0) + 40, 9);
      ctx.strokeStyle = 'rgba(26,26,22,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 - 20, scaleY); ctx.lineTo(x1 + 20, scaleY);
      ctx.stroke();

      // sleepers / coil ticks
      ctx.strokeStyle = 'rgba(26,26,22,0.3)';
      for (var tx = x0 - 16; tx < x1 + 20; tx += 22) {
        ctx.beginPath();
        ctx.moveTo(tx, scaleY + 10); ctx.lineTo(tx, scaleY + 16);
        ctx.stroke();
      }

      // scale ticks
      ctx.font = '10px "Space Mono", monospace';
      ctx.fillStyle = '#63645a';
      ctx.textAlign = 'center';
      for (var s = 0; s <= 700; s += 100) {
        var x = X(s);
        ctx.strokeStyle = 'rgba(26,26,22,0.25)';
        ctx.beginPath();
        ctx.moveTo(x, scaleY + tickTop); ctx.lineTo(x, scaleY + tickTop + 10);
        ctx.stroke();
        ctx.fillText(String(s), x, scaleY + labelY);
      }
      ctx.textAlign = 'left';
      ctx.fillText('km/h', x1 - 34, scaleY + unitY);

      // service marker
      if (!compact) {
      ctx.strokeStyle = 'rgba(63,92,83,0.7)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(X(500), h * 0.12); ctx.lineTo(X(500), scaleY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#3f5c53';
      ctx.textAlign = 'center';
      ctx.fillText('500 service', X(500), h * 0.1);
      }

      // train at the record speed
      var cx = X(603);
      var carW = compact ? Math.min(110, (x1 - x0) * 0.3) : Math.min(230, (x1 - x0) * 0.22);
      var carH = Math.min(compact ? h * 0.3 : h * 0.34, 74);
      var carY = scaleY - carH - (compact ? h * 0.06 : h * 0.1);
      var left = cx - carW * 0.55;

      ctx.fillStyle = '#f5f4ef';
      ctx.strokeStyle = '#1a1a16';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, carY + carH);
      ctx.lineTo(left, carY + 8);
      ctx.quadraticCurveTo(left, carY, left + 14, carY);
      ctx.lineTo(left + carW - 34, carY);
      ctx.quadraticCurveTo(left + carW - 6, carY + 4, left + carW, carY + carH * 0.6);
      ctx.lineTo(left + carW, carY + carH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // windows
      ctx.fillStyle = 'rgba(26,26,22,0.35)';
      for (var wi = 0; wi < 4; wi += 1) {
        ctx.fillRect(left + 16 + wi * (carW * 0.17), carY + 10, carW * 0.11, carH * 0.3);
      }

      // undercarriage magnets
      ctx.fillStyle = '#be3a22';
      ctx.fillRect(left + 18, carY + carH - 4, carW * 0.22, 4);
      ctx.fillRect(left + carW * 0.55, carY + carH - 4, carW * 0.3, 4);

      // record marker
      ctx.strokeStyle = '#be3a22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, carY - 14); ctx.lineTo(cx, scaleY);
      ctx.stroke();
      ctx.fillStyle = '#be3a22';
      ctx.textAlign = 'right';
      ctx.font = compact ? '10px "Space Mono", monospace' : '12px "Space Mono", monospace';
      ctx.fillText('603 km/h', compact ? left - 8 : left - 14, compact ? carY + 6 : carY + 24);
      ctx.font = '9px "Space Mono", monospace';
      ctx.fillStyle = '#63645a';
      if (!compact) ctx.fillText('record, 2015', left - 14, carY + 40);

      // levitation gap exaggeration
      if (compact) { ctx.fillStyle = '#63645a'; ctx.textAlign = 'left'; ctx.fillText('gap', left + 4, carY + carH + 12); }
      else {
      ctx.strokeStyle = 'rgba(26,26,22,0.45)';
      ctx.beginPath();
      var gx = left + carW + 18;
      ctx.moveTo(gx, carY + carH); ctx.lineTo(gx, scaleY);
      ctx.moveTo(gx - 4, carY + carH); ctx.lineTo(gx + 4, carY + carH);
      ctx.moveTo(gx - 4, scaleY); ctx.lineTo(gx + 4, scaleY);
      ctx.stroke();
      ctx.fillStyle = '#63645a';
      ctx.textAlign = 'left';
      ctx.fillText('gap', gx + 6, (carY + carH + scaleY) / 2 + 3);
      }
    };

    drawRibbon();
    window.addEventListener('resize', drawRibbon);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawRibbon);
  }

  /* line filter */

  var chips = document.querySelectorAll('[data-kind]');
  var lines = document.querySelectorAll('.line-item');
  if (chips.length && lines.length) {
    var count = document.getElementById('line-count');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var kind = chip.dataset.kind;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        lines.forEach(function (li) {
          var cats = (li.dataset.cat || '').split(' ');
          var match = kind === 'all' || cats.indexOf(kind) !== -1;
          li.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (count) count.textContent = shown + ' of ' + lines.length + ' shown';
      });
    });
  }

  /* route brief */

  var brief = document.getElementById('route-form');
  if (brief) {
    var panel = document.getElementById('route-result');
    var preview = document.getElementById('route-preview');
    var send = document.getElementById('route-send');

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
        else if (field.type === 'number' && v && (Number(v) < 1 || Number(v) > 1200)) msg = 'Routes we work on run from 1 km to 1,200 km.';
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
        length: brief.elements.routelength.value || '—',
        speed: brief.elements.target.value,
        terrain: brief.elements.terrain.value,
        message: brief.elements.message.value.trim()
      };
      var text = [
        'ROUTE BRIEF — SLIPSTREAM',
        'name     ' + d.name + ' <' + d.email + '>',
        'client   ' + d.org,
        'route    ' + d.length + ' km',
        'target   ' + d.speed,
        'terrain  ' + d.terrain,
        '',
        d.message
      ].join('\n');
      preview.textContent = text;
      send.href = 'mailto:office@slipstream.example?subject=' +
        encodeURIComponent('Route brief — ' + d.speed + ' — ' + d.name) +
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

  window.__maglev = {
    set: setParams,
    run: update,
    read: function () {
      var s = window.__maglevState;
      if (!s) return null;
      return {
        speed: s.p.speed,
        mass: s.p.mass,
        current: s.p.current,
        gap: Math.round(s.res.gapEq * 10) / 10,
        margin: Math.round(s.res.margin),
        aero: Math.round(s.res.aero / 100) / 10,
        mdrag: Math.round(s.res.mdrag / 100) / 10,
        power: Math.round(s.res.power / 1e5) / 10,
        energy: Math.round(s.res.energy),
        verdict: (document.getElementById('verdict') || {}).textContent || '',
        gapText: (document.getElementById('gap-text') || {}).textContent || '',
        transform: (document.getElementById('car-group') || { getAttribute: function () { return ''; } }).getAttribute('transform')
      };
    }
  };
})();
