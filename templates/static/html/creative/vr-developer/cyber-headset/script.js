/* Ines Kovač — VR build bench
   Pure canvas + DOM. No audio, no storage. */

(function () {
  'use strict';

  /* ---------- menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- status clock ---------- */
  var clock = document.getElementById('clock');
  if (clock) {
    var tick = function () {
      var d = new Date();
      var p = function (n) { return String(n).padStart(2, '0'); };
      clock.textContent = 'BUILD 2026.11 · ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + ' LOCAL';
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- frame budget bench ---------- */
  var canvas = document.getElementById('stereoCanvas');
  if (!canvas) { initRest(); return; }

  var DEVICES = {
    q3: { name: 'Quest 3', rx: 2064, ry: 2208, fov: 110, rates: [72, 90, 120], def: 90 },
    index: { name: 'Valve Index', rx: 1440, ry: 1600, fov: 130, rates: [80, 90, 120, 144], def: 144 },
    psvr2: { name: 'PSVR2', rx: 2000, ry: 2040, fov: 110, rates: [90, 120], def: 120 },
    avp: { name: 'Vision Pro', rx: 3660, ry: 3200, fov: 100, rates: [90, 96], def: 90 }
  };

  var ui = {
    device: document.getElementById('device'),
    hz: document.getElementById('hz'),
    scale: document.getElementById('scale'),
    ipd: document.getElementById('ipd'),
    fov: document.getElementById('fov'),
    draws: document.getElementById('draws'),
    tris: document.getElementById('tris'),
    foveated: document.getElementById('foveated'),
    hzOut: document.getElementById('hzOut'),
    scaleOut: document.getElementById('scaleOut'),
    ipdOut: document.getElementById('ipdOut'),
    fovOut: document.getElementById('fovOut'),
    drawsOut: document.getElementById('drawsOut'),
    trisOut: document.getElementById('trisOut'),
    verdict: document.getElementById('verdict'),
    verdictTitle: document.getElementById('verdictTitle'),
    verdictText: document.getElementById('verdictText'),
    rBudget: document.getElementById('rBudget'),
    rFrame: document.getElementById('rFrame'),
    rHead: document.getElementById('rHead'),
    rRate: document.getElementById('rRate'),
    rPpd: document.getElementById('rPpd'),
    rDisp: document.getElementById('rDisp'),
    rM2p: document.getElementById('rM2p'),
    rCall: document.getElementById('rCall')
  };

  function fillRates(def) {
    ui.hz.innerHTML = def.rates.map(function (r) {
      return '<option value="' + r + '"' + (r === def.def ? ' selected' : '') + '>' + r + ' Hz</option>';
    }).join('');
  }
  fillRates(DEVICES[ui.device.value]);

  ui.device.addEventListener('change', function () {
    var d = DEVICES[ui.device.value];
    fillRates(d);
    ui.fov.value = String(d.fov);
    compute();
  });

  function model() {
    var d = DEVICES[ui.device.value];
    var hz = parseInt(ui.hz.value, 10);
    var scale = parseFloat(ui.scale.value) / 100;
    var ipd = parseFloat(ui.ipd.value);
    var fov = parseFloat(ui.fov.value);
    var draws = parseInt(ui.draws.value, 10);
    var tris = parseFloat(ui.tris.value); /* millions */
    var fovOn = ui.foveated.checked;

    var pxEye = d.rx * d.ry * scale * scale;
    var pxFrame = pxEye * 2;
    var budget = 1000 / hz;
    var geometry = draws * 0.004 + (tris * 1e6 / 10000) * 0.0007;
    var shading = (pxFrame / 900e6) * 1000 * (fovOn ? 0.55 : 1);
    var cpu = 0.9;
    var frame = geometry + shading + cpu;
    var headroom = ((budget - frame) / budget) * 100;
    var rate = (pxFrame * hz) / 1e6;
    var ppd = (d.rx * scale) / fov;
    var disparity = 2 * Math.atan((ipd / 2) / 2000) * (180 / Math.PI);
    var m2p = 8 + frame + (1000 / hz) / 2 + 1;

    return {
      d: d, hz: hz, scale: scale, ipd: ipd, fov: fov, draws: draws, tris: tris, fovOn: fovOn,
      pxEye: pxEye, pxFrame: pxFrame, budget: budget, geometry: geometry, shading: shading,
      cpu: cpu, frame: frame, headroom: headroom, rate: rate, ppd: ppd, disparity: disparity, m2p: m2p
    };
  }

  var last = null;

  function compute() {
    var m = model();
    last = m;

    ui.hzOut.textContent = m.hz + ' Hz';
    ui.scaleOut.textContent = Math.round(m.scale * 100) + '%';
    ui.ipdOut.textContent = m.ipd + ' mm';
    ui.fovOut.textContent = m.fov + '°';
    ui.drawsOut.textContent = String(m.draws);
    ui.trisOut.textContent = m.tris.toFixed(1) + ' M';

    ui.rBudget.textContent = m.budget.toFixed(1) + ' ms';
    ui.rFrame.textContent = m.frame.toFixed(1) + ' ms';
    ui.rHead.textContent = (m.headroom >= 0 ? '' : '−') + Math.abs(m.headroom).toFixed(0) + '%';
    ui.rRate.textContent = Math.round(m.rate) + ' MP/s';
    ui.rPpd.textContent = m.ppd.toFixed(1);
    ui.rDisp.textContent = m.disparity.toFixed(1) + '°';
    ui.rM2p.textContent = Math.round(m.m2p) + ' ms';

    var cls = '', title, text, call;
    if (m.headroom >= 18) {
      cls = ''; title = 'Fits with ' + m.headroom.toFixed(0) + '% headroom';
      text = m.frame.toFixed(1) + ' ms of ' + m.budget.toFixed(1) + ' ms used at ' + m.hz + ' Hz. Room to add one more mechanic.';
      call = 'Comfortable';
    } else if (m.headroom >= 0) {
      cls = 'warn'; title = 'Tight — ' + m.headroom.toFixed(0) + '% headroom';
      text = m.frame.toFixed(1) + ' ms of ' + m.budget.toFixed(1) + ' ms. Drop render scale to ' +
        Math.max(50, Math.round(m.scale * 100) - 15) + '% or cut ' + Math.round(m.draws * 0.25) + ' draw calls.';
      call = 'Needs trimming';
    } else {
      cls = 'bad'; title = 'Misses ' + m.hz + ' Hz by ' + Math.abs(m.headroom).toFixed(0) + '%';
      text = 'Frame is ' + m.frame.toFixed(1) + ' ms against a ' + m.budget.toFixed(1) + ' ms budget. This will reproject or judder.';
      call = 'Over budget';
    }
    ui.verdict.className = 'verdict ' + cls;
    ui.verdictTitle.textContent = title;
    ui.verdictText.textContent = text;
    ui.rCall.textContent = call;

    draw();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function label(c, text, x, y, color, size, align) {
    c.fillStyle = color || '#5b6672';
    c.font = '500 ' + (size || 9.5) + 'px "JetBrains Mono", monospace';
    c.textAlign = align || 'left';
    c.fillText(text, x, y);
    c.textAlign = 'left';
  }

  function draw() {
    if (!last) return;
    var c = canvas.getContext('2d');
    var cssW = canvas.clientWidth || 760;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var narrow = cssW < 560;
    var cssH = narrow
      ? Math.round(Math.max(430, Math.min(560, cssW * 1.3)))
      : Math.round(Math.max(360, Math.min(470, cssW * 0.55)));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = cssH + 'px';
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, cssW, cssH);
    c.fillStyle = '#05070a';
    c.fillRect(0, 0, cssW, cssH);

    var m = last;

    /* ---- stereo diagram ---- */
    var sx = 18, sy = 14;
    var sw = narrow ? cssW - 36 : (cssW - 54) * 0.46;
    var sh = narrow ? 196 : cssH - 28;
    drawStereo(c, m, sx, sy, sw, sh);

    /* ---- frame budget chart ---- */
    var cx = narrow ? 18 : sx + sw + 22;
    var cy = narrow ? sy + sh + 24 : sy;
    var cw = narrow ? cssW - 36 : cssW - cx - 18;
    var ch = narrow ? cssH - cy - 14 : cssH - 28;
    drawChart(c, m, cx, cy, cw, ch);

    if (!narrow) {
      c.strokeStyle = '#1e242c';
      c.beginPath();
      c.moveTo(sx + sw + 11, 14);
      c.lineTo(sx + sw + 11, cssH - 14);
      c.stroke();
    }
  }

  function drawStereo(c, m, x, y, w, h) {
    label(c, 'STEREO VIEW', x, y + 9, '#8b97a3', 8.5);
    label(c, m.d.name.toUpperCase() + ' · ' + m.hz + ' HZ', x + w, y + 9, '#3fe0cf', 8.5, 'right');

    var top = y + 24;
    var availH = h - 58;
    var aspect = m.d.rx / m.d.ry;
    var eyeH = Math.min(availH, 200);
    var eyeW = Math.min(eyeH * aspect, (w - 44) / 2);
    eyeH = eyeW / aspect;
    var gap = Math.min(28, w * 0.06);
    var totalW = eyeW * 2 + gap;
    var ex = x + (w - totalW) / 2;
    var ey = top + Math.max(0, (availH - eyeH) / 2);

    [0, 1].forEach(function (i) {
      var exx = ex + i * (eyeW + gap);
      c.fillStyle = '#0a0f15';
      c.strokeStyle = '#2a3340';
      c.lineWidth = 1;
      roundRect(c, exx, ey, eyeW, eyeH, 3);
      c.fill();
      c.stroke();

      /* horizon + floor grid */
      c.save();
      roundRect(c, exx, ey, eyeW, eyeH, 3);
      c.clip();
      var hzY = ey + eyeH * 0.46;
      c.strokeStyle = 'rgba(63,224,207,.22)';
      c.beginPath();
      c.moveTo(exx, hzY);
      c.lineTo(exx + eyeW, hzY);
      c.stroke();
      var vx = exx + eyeW / 2, vy = hzY;
      c.strokeStyle = 'rgba(63,224,207,.14)';
      for (var k = -4; k <= 4; k++) {
        c.beginPath();
        c.moveTo(vx, vy);
        c.lineTo(vx + k * (eyeW * 0.42), ey + eyeH);
        c.stroke();
      }
      for (var r = 1; r <= 4; r++) {
        var yy = vy + Math.pow(r / 4, 2) * (eyeH * 0.5);
        c.beginPath();
        c.moveTo(exx, yy);
        c.lineTo(exx + eyeW, yy);
        c.stroke();
      }
      /* eye pupil + fov cone */
      c.fillStyle = '#3fe0cf';
      c.beginPath();
      c.arc(vx, ey + eyeH - 12, 3, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(255,61,129,.5)';
      c.beginPath();
      c.moveTo(vx, ey + eyeH - 12);
      c.lineTo(vx - Math.tan((m.fov / 2) * Math.PI / 180) * eyeH * 0.9, vy);
      c.moveTo(vx, ey + eyeH - 12);
      c.lineTo(vx + Math.tan((m.fov / 2) * Math.PI / 180) * eyeH * 0.9, vy);
      c.stroke();
      c.restore();

      label(c, i === 0 ? 'L' : 'R', exx + 7, ey + 15, '#8b97a3', 9);
    });

    /* ipd bracket */
    var lCenter = ex + eyeW / 2;
    var rCenter = ex + eyeW + gap + eyeW / 2;
    var by = ey + eyeH + 16;
    c.strokeStyle = '#ff3d81';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(lCenter, by - 5);
    c.lineTo(lCenter, by + 1);
    c.moveTo(rCenter, by - 5);
    c.lineTo(rCenter, by + 1);
    c.moveTo(lCenter, by - 2);
    c.lineTo(rCenter, by - 2);
    c.stroke();
    label(c, 'IPD ' + m.ipd + ' MM', (lCenter + rCenter) / 2, by + 12, '#ff3d81', 8.5, 'center');

    /* bottom specs */
    var specY = y + h - 4;
    label(c, Math.round(m.d.rx * m.scale) + ' × ' + Math.round(m.d.ry * m.scale) + ' / EYE', x, specY, '#5b6672', 8);
    label(c, Math.round(m.ppd) + ' PX/DEG', x + w, specY, '#3fe0cf', 8, 'right');
  }

  function drawChart(c, m, x, y, w, h) {
    label(c, 'FRAME BUDGET', x, y + 9, '#8b97a3', 8.5);
    label(c, m.budget.toFixed(1) + ' MS @ ' + m.hz + ' HZ', x + w, y + 9, '#ff3d81', 8.5, 'right');

    var rows = [
      { key: 'CPU', val: m.cpu, color: '#5b6672' },
      { key: 'GEOMETRY', val: m.geometry, color: '#3fe0cf' },
      { key: 'SHADING', val: m.shading, color: '#ff3d81' },
      { key: 'TOTAL', val: m.frame, color: '#e9edf2' }
    ];
    var maxVal = Math.max(m.budget * 1.15, m.frame * 1.1, 1);
    var chartTop = y + 26;
    var chartH = h - 52;
    var barMaxW = w - 66;
    var rowH = chartH / rows.length;

    /* budget line */
    var bx = x + 62 + (m.budget / maxVal) * barMaxW;
    c.strokeStyle = 'rgba(255,61,129,.55)';
    c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(bx, chartTop - 4);
    c.lineTo(bx, chartTop + chartH);
    c.stroke();
    c.setLineDash([]);

    rows.forEach(function (row, i) {
      var ry = chartTop + i * rowH;
      var bh = Math.min(16, rowH * 0.42);
      label(c, row.key, x, ry + bh, '#5b6672', 8);
      var bw = Math.max(1, (row.val / maxVal) * barMaxW);
      c.fillStyle = row.color;
      c.globalAlpha = row.key === 'TOTAL' ? 0.95 : 0.75;
      c.fillRect(x + 62, ry, bw, bh);
      c.globalAlpha = 1;
      label(c, row.val.toFixed(1), x + 62 + bw + 6, ry + bh, '#8b97a3', 8);
    });

    /* axis ticks */
    var axisY = chartTop + chartH + 12;
    c.strokeStyle = '#1e242c';
    c.beginPath();
    c.moveTo(x + 62, axisY - 4);
    c.lineTo(x + 62 + barMaxW, axisY - 4);
    c.stroke();
    label(c, '0', x + 62, axisY + 8, '#3a444f', 7.5, 'center');
    label(c, maxVal.toFixed(1) + ' MS', x + 62 + barMaxW, axisY + 8, '#3a444f', 7.5, 'right');

    /* verdict pill */
    var over = m.headroom < 0;
    label(c, over ? 'OVER BUDGET — WILL JUDDER' : (m.headroom < 18 ? 'TIGHT — TRIM THE FRAME' : 'WITHIN BUDGET'),
      x, y + h - 2, over ? '#ff4d4d' : (m.headroom < 18 ? '#ffb020' : '#3fe0cf'), 9);
  }

  ['input', 'change'].forEach(function (evt) {
    [ui.device, ui.hz, ui.scale, ui.ipd, ui.fov, ui.draws, ui.tris, ui.foveated].forEach(function (node) {
      node.addEventListener(evt, compute);
    });
  });

  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { draw(); });
    ro.observe(canvas);
  } else {
    window.addEventListener('resize', draw);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { draw(); });
  }

  compute();
  initRest();

  /* ---------- projects filter ---------- */
  function initRest() {
    var chips = document.querySelectorAll('.chip');
    var rows = document.querySelectorAll('.log-row');
    if (chips.length && rows.length) {
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var cat = chip.getAttribute('data-filter');
          chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
          rows.forEach(function (row) {
            row.hidden = !(cat === 'all' || row.getAttribute('data-cat') === cat);
          });
        });
      });
    }

    /* ---------- contact form ---------- */
    var form = document.getElementById('briefForm');
    if (!form) return;
    var ok = document.getElementById('formOk');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var problems = [];
      function setErr(field, msg) {
        var box = document.getElementById(field.name + 'Err');
        if (box) box.textContent = msg || '';
        if (msg) problems.push(msg);
      }
      var name = form.elements.name;
      var email = form.elements.email;
      var team = form.elements.team;
      var message = form.elements.message;

      setErr(name, name.value.trim().length < 2 ? 'Name needed.' : '');
      setErr(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'That address looks incomplete.');
      setErr(team, team.value && (parseInt(team.value, 10) < 1 || parseInt(team.value, 10) > 200) ? 'A team between 1 and 200.' : '');
      setErr(message, message.value.trim().length < 25 ? 'Describe the mechanic in at least a sentence or two.' : '');

      if (problems.length) {
        if (ok) ok.hidden = true;
        return;
      }
      if (ok) {
        ok.hidden = false;
        ok.querySelector('p').textContent = 'Thank you, ' + name.value.trim().split(' ')[0] +
          '. I read build briefs on Monday and Thursday and reply with a frame-budget read before a quote.';
        ok.scrollIntoView({ block: 'nearest' });
      }
      form.reset();
      form.querySelectorAll('.err').forEach(function (n) { n.textContent = ''; });
    });
  }
})();
