/* =========================================================
   Coherent Bench — fringe bench
   Michelson fringe field, Fabry-Pérot Airy scan,
   tabs, filters and the booking form.
   ========================================================= */
(function () {
  'use strict';

  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  var C = 299792458;

  function fpVisible() {
    var panel = document.getElementById('panel-fp');
    return !!(panel && !panel.hidden);
  }

  var TINT = {
    632.8: [255, 66, 54],
    532: [126, 255, 140],
    405: [176, 128, 255],
    1550: [255, 82, 190]
  };

  /* ================= Michelson ================= */
  var mCanvas = document.getElementById('fringeCanvas');
  var mCtx = mCanvas ? mCanvas.getContext('2d') : null;
  var MW = 460, MH = 460;
  var PUPIL_MM = 5;        // pupil radius in object space
  var VISIBLE_FRACTION = 0.93;

  var mic = { laser: 632.8, m2: 1000, tilt: 0.6, curve: 2.0, linewidth: 1 };

  function drawFringes() {
    if (!mCtx) return;
    var lambda = mic.laser;
    var tint = TINT[mic.laser] || TINT[632.8];
    var half = MW / 2;
    var pxPerMm = (half * VISIBLE_FRACTION) / PUPIL_MM;
    var img = mCtx.createImageData(MW, MH);
    var d = img.data;
    var inv2R = 1 / (mic.curve * 1000); // 1/mm

    for (var y = 0; y < MH; y++) {
      var ym = (half - y) / pxPerMm;
      for (var x = 0; x < MW; x++) {
        var xm = (x - half) / pxPerMm;
        var r2 = xm * xm + ym * ym;
        var inside = r2 <= PUPIL_MM * PUPIL_MM;
        var idx = (y * MW + x) * 4;
        if (!inside) {
          d[idx] = 8; d[idx + 1] = 8; d[idx + 2] = 10; d[idx + 3] = 255;
          continue;
        }
        var delta = 2 * mic.m2 + 2000 * mic.tilt * xm + r2 * inv2R * 1e6;
        var phase = (delta / lambda) * 2 * Math.PI;
        var v = 0.5 * (1 + Math.cos(phase));
        var glow = Math.pow(v, 1.4);
        d[idx] = Math.min(255, tint[0] * glow + 12);
        d[idx + 1] = Math.min(255, tint[1] * glow + 8);
        d[idx + 2] = Math.min(255, tint[2] * glow + 8);
        d[idx + 3] = 255;
      }
    }
    mCtx.putImageData(img, 0, 0);

    // aperture ring
    mCtx.beginPath();
    mCtx.arc(half, half, half * VISIBLE_FRACTION, 0, Math.PI * 2);
    mCtx.strokeStyle = 'rgba(232,226,214,0.35)';
    mCtx.lineWidth = 1;
    mCtx.stroke();
    mCtx.beginPath();
    mCtx.moveTo(half - 8, half); mCtx.lineTo(half + 8, half);
    mCtx.moveTo(half, half - 8); mCtx.lineTo(half, half + 8);
    mCtx.strokeStyle = 'rgba(232,226,214,0.25)';
    mCtx.stroke();
  }

  var mEl = {
    laser: document.getElementById('laser'),
    m2: document.getElementById('m2'),
    m2Out: document.getElementById('m2Out'),
    tilt: document.getElementById('tilt'),
    tiltOut: document.getElementById('tiltOut'),
    curve: document.getElementById('curve'),
    curveOut: document.getElementById('curveOut'),
    linewidth: document.getElementById('linewidth'),
    lwOut: document.getElementById('lwOut'),
    path: document.getElementById('roPath'),
    order: document.getElementById('roOrder'),
    spacing: document.getElementById('roSpacing'),
    vis: document.getElementById('roVis'),
    coh: document.getElementById('roCoh'),
    note: document.getElementById('fringeNote'),
    foot: document.getElementById('fringeFoot')
  };

  function updateMichelson() {
    var lambda = mic.laser;
    var path = 2 * mic.m2;
    var order = path / lambda;
    var spacing = lambda / (2 * Math.max(mic.tilt, 0.0001) * 1e-3) / 1e6; // mm
    var lc = C / (Math.PI * mic.linewidth * 1e6);
    var vis = Math.exp(-path * 1e-9 / lc) * 100;
    var rings = mic.curve > 0 ? (PUPIL_MM * PUPIL_MM * 1e6) / (mic.curve * 1000 * lambda) : 0;

    if (mEl.m2Out) mEl.m2Out.textContent = Math.round(mic.m2).toLocaleString('en-US') + ' nm';
    if (mEl.tiltOut) mEl.tiltOut.textContent = mic.tilt.toFixed(2) + ' mrad';
    if (mEl.curveOut) mEl.curveOut.textContent = mic.curve.toFixed(1) + ' m';
    if (mEl.lwOut) mEl.lwOut.textContent = mic.linewidth < 1 ? (mic.linewidth * 1000).toFixed(0) + ' kHz' : mic.linewidth.toFixed(1) + ' MHz';

    if (mEl.path) mEl.path.innerHTML = Math.round(path).toLocaleString('en-US') + '<small>nm</small>';
    if (mEl.order) mEl.order.innerHTML = order.toFixed(2) + '<small>orders</small>';
    if (mEl.spacing) mEl.spacing.innerHTML = spacing.toFixed(2) + '<small>mm</small>';
    if (mEl.vis) mEl.vis.innerHTML = Math.round(vis) + '<small>%</small>';
    if (mEl.coh) mEl.coh.innerHTML = (lc > 1000 ? (lc / 1000).toFixed(1) + '<small>km</small>' : (lc < 10 ? lc.toFixed(1) : lc.toFixed(0)) + '<small>m</small>');

    if (mEl.note) {
      mEl.note.textContent = 'Ring centre offset ' + (mic.tilt * 5).toFixed(1) + ' mm · about ' +
        Math.max(0, Math.round(rings)) + ' closed rings across the pupil · spacing ' + spacing.toFixed(2) + ' mm';
    }
    if (mEl.foot && !fpVisible()) {
      mEl.foot.textContent = 'Coherence length from a Lorentzian line: Lc = c / (π Δν) = ' +
        (lc > 1000 ? (lc / 1000).toFixed(1) + ' km' : lc.toFixed(0) + ' m') +
        '. At this path difference the fringe contrast is still ' + vis.toFixed(0) +
        '% — you would need ' + (0.69 * lc).toFixed(0) + ' m of imbalance to lose half of it.';
    }

    drawFringes();
  }

  /* ================= Fabry-Pérot ================= */
  var aCanvas = document.getElementById('airyCanvas');
  var aCtx = aCanvas ? aCanvas.getContext('2d') : null;
  var AW = 460, AH = 460;

  var fp = { laser: 632.8, length: 10, refl: 0.98, scan: 0, loss: 0.4 };

  function fpNumbers() {
    var lambdaM = fp.laser * 1e-9;
    var lm = fp.length * 1e-3;
    var fsrM = (lambdaM * lambdaM) / (2 * lm);
    var fsrPm = fsrM * 1e12;
    var fsrGHz = C / (2 * lm) / 1e9;
    var finesse = (Math.PI * Math.sqrt(fp.refl)) / (1 - fp.refl);
    var A = fp.loss / 100;
    var peakT = Math.pow((1 - fp.refl) / (1 - fp.refl + A), 2);
    var contrast = 1 + (4 * fp.refl) / Math.pow(1 - fp.refl, 2);
    return {
      fsrPm: fsrPm, fsrGHz: fsrGHz, finesse: finesse,
      resMHz: (fsrGHz * 1000) / finesse,
      peakT: peakT, contrast: contrast, A: A
    };
  }

  function drawAiry() {
    if (!aCtx) return;
    var n = fpNumbers();
    aCtx.fillStyle = '#08080a';
    aCtx.fillRect(0, 0, AW, AH);

    var padL = 58, padR = 20, padT = 34, padB = 48;
    var w = AW - padL - padR, h = AH - padT - padB;
    var xMin = -2.5, xMax = 2.5;
    var F = (4 * fp.refl) / Math.pow(1 - fp.refl, 2);

    function X(v) { return padL + ((v - xMin) / (xMax - xMin)) * w; }
    function Y(t) { return padT + h - t * h; }

    // grid
    aCtx.strokeStyle = 'rgba(232,226,214,0.08)';
    aCtx.lineWidth = 1;
    aCtx.font = '10px "Chivo Mono", monospace';
    aCtx.fillStyle = '#9a948a';
    for (var g = 0; g <= 1.001; g += 0.25) {
      aCtx.beginPath(); aCtx.moveTo(padL, Y(g)); aCtx.lineTo(padL + w, Y(g)); aCtx.stroke();
      aCtx.textAlign = 'right';
      aCtx.fillText(g.toFixed(2), padL - 8, Y(g) + 3);
    }
    for (var k = -2; k <= 2; k++) {
      aCtx.beginPath(); aCtx.moveTo(X(k), padT); aCtx.lineTo(X(k), padT + h); aCtx.stroke();
      aCtx.textAlign = 'center';
      aCtx.fillText(k === 0 ? '0' : (k > 0 ? '+' + k : String(k)), X(k), padT + h + 16);
    }

    // axis
    aCtx.strokeStyle = 'rgba(232,226,214,0.4)';
    aCtx.beginPath();
    aCtx.moveTo(padL, padT); aCtx.lineTo(padL, padT + h); aCtx.lineTo(padL + w, padT + h);
    aCtx.stroke();

    // transmission
    aCtx.strokeStyle = '#ff4136';
    aCtx.lineWidth = 1.8;
    aCtx.beginPath();
    for (var px = 0; px <= w; px += 1) {
      var vv = xMin + (px / w) * (xMax - xMin);
      var t = n.peakT / (1 + F * Math.pow(Math.sin(Math.PI * vv), 2));
      var xx = padL + px;
      var yy = Y(Math.min(t, 1));
      if (px === 0) aCtx.moveTo(xx, yy); else aCtx.lineTo(xx, yy);
    }
    aCtx.stroke();

    // scan marker
    var scanX = X(fp.scan / n.fsrPm);
    aCtx.strokeStyle = 'rgba(95,179,168,0.9)';
    aCtx.setLineDash([3, 4]);
    aCtx.beginPath(); aCtx.moveTo(scanX, padT); aCtx.lineTo(scanX, padT + h); aCtx.stroke();
    aCtx.setLineDash([]);

    var tNow = n.peakT / (1 + F * Math.pow(Math.sin(Math.PI * (fp.scan / n.fsrPm)), 2));
    aCtx.beginPath();
    aCtx.arc(scanX, Y(Math.min(tNow, 1)), 4.5, 0, Math.PI * 2);
    aCtx.fillStyle = '#5fb3a8';
    aCtx.fill();

    aCtx.fillStyle = '#9a948a';
    aCtx.textAlign = 'left';
    aCtx.fillText('transmission', padL + 4, padT - 12);
    aCtx.textAlign = 'right';
    aCtx.fillText('detuning, free spectral ranges', padL + w, AH - 12);
    aCtx.fillStyle = '#f0ebe1';
    aCtx.textAlign = 'left';
    aCtx.fillText((tNow * 100).toFixed(1) + ' %', scanX + 8, Y(Math.min(tNow, 1)) - 8);
  }

  var aEl = {
    laser: document.getElementById('fpLaser'),
    length: document.getElementById('fpLength'),
    lengthOut: document.getElementById('fpLengthOut'),
    refl: document.getElementById('fpRefl'),
    reflOut: document.getElementById('fpReflOut'),
    scan: document.getElementById('fpScan'),
    scanOut: document.getElementById('fpScanOut'),
    loss: document.getElementById('fpLoss'),
    lossOut: document.getElementById('fpLossOut'),
    fsr: document.getElementById('roFsr'),
    finesse: document.getElementById('roFinesse'),
    res: document.getElementById('roRes'),
    peak: document.getElementById('roPeakT'),
    contrast: document.getElementById('roContrast'),
    note: document.getElementById('airyNote'),
    foot: document.getElementById('fringeFoot')
  };

  function updateFP() {
    var n = fpNumbers();
    if (aEl.lengthOut) aEl.lengthOut.textContent = fp.length.toFixed(1) + ' mm';
    if (aEl.reflOut) aEl.reflOut.textContent = fp.refl.toFixed(3);
    if (aEl.scanOut) aEl.scanOut.textContent = (fp.scan > 0 ? '+' : '') + fp.scan.toFixed(1) + ' pm';
    if (aEl.lossOut) aEl.lossOut.textContent = fp.loss.toFixed(1) + ' %';

    if (aEl.fsr) aEl.fsr.innerHTML = n.fsrPm.toFixed(1) + '<small>pm</small>';
    if (aEl.finesse) aEl.finesse.innerHTML = Math.round(n.finesse).toLocaleString('en-US');
    if (aEl.res) aEl.res.innerHTML = Math.round(n.resMHz) + '<small>MHz</small>';
    if (aEl.peak) aEl.peak.innerHTML = Math.round(n.peakT * 100) + '<small>%</small>';
    if (aEl.contrast) aEl.contrast.innerHTML = Math.round(n.contrast).toLocaleString('en-US') + '<small>:1</small>';

    if (aEl.note) {
      aEl.note.textContent = 'FSR ' + n.fsrPm.toFixed(1) + ' pm · finesse ' + Math.round(n.finesse) +
        ' · one mode every ' + n.fsrGHz.toFixed(1) + ' GHz';
    }
    if (aEl.foot && fpVisible()) {
      aEl.foot.textContent = 'Airy transmission with ' + (fp.loss).toFixed(1) + '% round-trip loss: peak ' +
        Math.round(n.peakT * 100) + '% of incident, resolution ' + Math.round(n.resMHz) +
        ' MHz, and the cavity holds ' + Math.round(n.contrast).toLocaleString('en-US') +
        ':1 between on-resonance and off. Loss, not reflectivity, sets the ceiling.';
    }

    drawAiry();
  }

  /* ================= binding ================= */
  function bindRange(input, obj, key, cb) {
    if (!input) return;
    input.addEventListener('input', function () {
      obj[key] = parseFloat(input.value);
      cb();
    });
  }

  bindRange(mEl.m2, mic, 'm2', updateMichelson);
  bindRange(mEl.tilt, mic, 'tilt', updateMichelson);
  bindRange(mEl.curve, mic, 'curve', updateMichelson);
  bindRange(mEl.linewidth, mic, 'linewidth', updateMichelson);
  if (mEl.laser) mEl.laser.addEventListener('change', function () {
    mic.laser = parseFloat(mEl.laser.value);
    updateMichelson();
  });

  bindRange(aEl.length, fp, 'length', updateFP);
  bindRange(aEl.refl, fp, 'refl', updateFP);
  bindRange(aEl.scan, fp, 'scan', updateFP);
  bindRange(aEl.loss, fp, 'loss', updateFP);
  if (aEl.laser) aEl.laser.addEventListener('change', function () {
    fp.laser = parseFloat(aEl.laser.value);
    updateFP();
  });

  /* ================= tabs ================= */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = {
    michelson: document.getElementById('panel-michelson'),
    fp: document.getElementById('panel-fp')
  };

  function selectMode(mode) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-mode') === mode;
      t.setAttribute('aria-selected', String(on));
      t.setAttribute('tabindex', on ? '0' : '-1');
    });
    Object.keys(panels).forEach(function (k) {
      if (panels[k]) panels[k].hidden = k !== mode;
    });
    if (mode === 'fp') updateFP(); else updateMichelson();
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { selectMode(t.getAttribute('data-mode')); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var next = t.getAttribute('data-mode') === 'michelson' ? 'fp' : 'michelson';
        selectMode(next);
        var btn = document.getElementById('tab-' + next);
        if (btn) btn.focus();
      }
    });
  });

  updateMichelson();
  updateFP();
  selectMode('michelson');

  /* ================= filters ================= */
  var fbtns = Array.prototype.slice.call(document.querySelectorAll('.fbtn'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.item'));
  var filterCount = document.getElementById('filterCount');
  if (fbtns.length) {
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        fbtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var n = 0;
        cards.forEach(function (c) {
          var show = f === 'all' || c.getAttribute('data-cat') === f;
          c.classList.toggle('is-hidden', !show);
          if (show) n++;
        });
        if (filterCount) filterCount.textContent = n + (n === 1 ? ' instrument shown' : ' instruments shown');
      });
    });
  }

  /* ================= booking form ================= */
  var form = document.getElementById('benchForm');
  var result = document.getElementById('benchResult');
  var preview = document.getElementById('benchPreview');
  var send = document.getElementById('benchSend');
  var edit = document.getElementById('benchEdit');

  function val(id) { var n = document.getElementById(id); return n ? n.value.trim() : ''; }
  function flag(id, on) { var n = document.getElementById(id); if (n) n.hidden = !on; }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = val('name'), email = val('email'), part = val('part'), tol = val('tol'), msg = val('message');
      var consent = document.getElementById('consent').checked;
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      flag('err-name', !name);
      flag('err-email', !ok);
      flag('err-part', !part);
      flag('err-tol', !tol);
      flag('err-message', !msg);
      flag('err-consent', !consent);
      if (!name || !ok || !part || !tol || !msg || !consent) {
        var first = !name ? 'name' : (!ok ? 'email' : (!part ? 'part' : (!tol ? 'tol' : (!msg ? 'message' : 'consent'))));
        var target = document.getElementById(first);
        if (target && target.focus) target.focus();
        if (result) result.hidden = true;
        return;
      }

      var org = val('org'), geometry = val('geometry');
      var text = 'Bench booking request\n\n' +
        'Name: ' + name + '\n' +
        (org ? 'Organisation: ' + org + '\n' : '') +
        'Email: ' + email + '\n' +
        'Geometry: ' + geometry + '\n' +
        'Part: ' + part + '\n' +
        'Tolerance: ' + tol + '\n\n' +
        'Notes:\n' + msg + '\n\n' +
        'Sent from the Coherent Bench booking form.';
      if (preview) preview.textContent = text;
      if (send) send.setAttribute('href', 'mailto:bench@coherentbench.example?subject=' + encodeURIComponent('Bench booking — ' + (org || name)) + '&body=' + encodeURIComponent(text));
      if (result) result.hidden = false;
    });
  }

  if (edit) {
    edit.addEventListener('click', function () {
      if (result) result.hidden = true;
      var n = document.getElementById('name');
      if (n) n.focus();
    });
  }
})();
