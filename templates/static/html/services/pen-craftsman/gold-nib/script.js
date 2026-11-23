/* Hollis & Feed — nib playground and page behaviour */

(function () {
  'use strict';

  /* ---------- drawer ---------- */
  var burger = document.querySelector('.burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      drawer.hidden = open;
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) {
        drawer.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- playground ---------- */
  var paper = document.getElementById('paper');
  if (!paper) return;

  var inkLayer = document.getElementById('ink-lines');
  var hint = document.getElementById('hint');
  var pressure = document.getElementById('pressure');
  var flow = document.getElementById('flow');
  var angle = document.getElementById('angle');
  var pOut = document.getElementById('pressure-out');
  var fOut = document.getElementById('flow-out');
  var aOut = document.getElementById('angle-out');
  var roWidth = document.getElementById('ro-width');
  var roFlow = document.getElementById('ro-flow');
  var roAngle = document.getElementById('ro-angle');
  var roChar = document.getElementById('ro-char');
  var note = document.getElementById('grind-note');
  var tip = document.getElementById('nib-tip');
  var viewLabel = document.getElementById('nib-view-label');
  var row = document.getElementById('grind-row');
  var sampleBtn = document.getElementById('sample');
  var clearBtn = document.getElementById('clear');

  var GRINDS = {
    ef: { thin: 0.28, thick: 0.36, flex: 0.12, arch: false, note: 'Extra fine, 0.30 mm tipping. A round ball with almost no flex; the line stays thin whatever the pressure.', char: 'round, little flex', label: 'EF · round tip' },
    f: { thin: 0.38, thick: 0.52, flex: 0.22, arch: false, note: 'Fine, 0.45 mm tipping. A round ball, forgiving of rotation, and the grind most writers should start with.', char: 'round, slight flex', label: 'F · round tip' },
    m: { thin: 0.50, thick: 0.74, flex: 0.35, arch: false, note: 'Medium, 0.60 mm tipping. Enough metal for a little tine spread, so a pressed downstroke opens the line.', char: 'round, springy', label: 'M · round tip' },
    architect: { thin: 0.30, thick: 0.94, flex: 0.06, arch: true, note: 'Architect, 0.30 mm downstroke and 0.90 mm across. An italic turned ninety degrees: broad on the horizontal, fine on the vertical.', char: 'narrow vertical, broad cross', label: 'A · architect tip' },
    stub: { thin: 0.46, thick: 1.12, flex: 0.12, arch: false, note: 'Stub, 0.50 mm downstroke and 1.10 mm across. Broad on the downstroke, thin on the cross stroke, with rounded edges.', char: 'broad down, thin cross', label: 'S · stub tip' }
  };
  var current = 'f';
  var drawing = false;
  var last = null;
  var strokes = 0;

  function mm(v) { return v.toFixed(2) + ' mm'; }

  function widthFor(dx, dy) {
    var g = GRINDS[current];
    var pr = Number(pressure.value) / 10;
    var ang = Number(angle.value);
    var pressF = 1 + (pr - 0.1) * g.flex * 1.5;
    var angleF = 1 + ((ang - 55) / 40) * 0.4;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var sin = Math.abs(dy / len);
    var cos = Math.abs(dx / len);
    var d = g.arch ? cos : sin;
    var shape = Math.pow(d, 1.35);
    var base = g.thin + (g.thick - g.thin) * shape;
    return Math.max(1.2, base * pressF * angleF * 7.2);
  }

  function inkOpacity() { return 0.55 + (Number(flow.value) / 10) * 0.45; }

  function addSegment(x1, y1, x2, y2) {
    var w = widthFor(x2 - x1, y2 - y1);
    var l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('stroke', '#231f1b');
    l.setAttribute('stroke-width', w.toFixed(2));
    l.setAttribute('stroke-linecap', 'round');
    l.setAttribute('opacity', inkOpacity().toFixed(2));
    var fl = Number(flow.value);
    if (fl >= 8) {
      var bleed = l.cloneNode();
      bleed.setAttribute('stroke-width', (w * 1.5).toFixed(2));
      bleed.setAttribute('opacity', (0.06 + (fl - 8) * 0.03).toFixed(2));
      inkLayer.appendChild(bleed);
    }
    inkLayer.appendChild(l);
  }

  function toPoint(evt) {
    var r = paper.getBoundingClientRect();
    return {
      x: ((evt.clientX - r.left) / r.width) * 1000,
      y: ((evt.clientY - r.top) / r.height) * 520
    };
  }

  paper.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    drawing = true;
    last = toPoint(e);
    if (paper.setPointerCapture) paper.setPointerCapture(e.pointerId);
    if (hint) hint.style.display = 'none';
    strokes++;
  });
  paper.addEventListener('pointermove', function (e) {
    if (!drawing || !last) return;
    e.preventDefault();
    var p = toPoint(e);
    var d = Math.hypot(p.x - last.x, p.y - last.y);
    if (d < 1.4) return;
    addSegment(last.x, last.y, p.x, p.y);
    last = p;
  });
  function endStroke(e) {
    if (!drawing) return;
    drawing = false;
    last = null;
    if (e && e.pointerId !== undefined && paper.releasePointerCapture) {
      try { paper.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    }
  }
  paper.addEventListener('pointerup', endStroke);
  paper.addEventListener('pointercancel', endStroke);
  paper.addEventListener('pointerleave', function (e) { if (drawing) endStroke(e); });

  function updateReadout() {
    var g = GRINDS[current];
    var pr = Number(pressure.value) / 10;
    var pressF = 1 + (pr - 0.1) * g.flex * 1.5;
    var angleF = 1 + ((Number(angle.value) - 55) / 40) * 0.4;
    var thick = g.thick * pressF * angleF;
    var thin = g.thin * pressF * angleF;
    pOut.textContent = pressure.value;
    fOut.textContent = flow.value;
    aOut.textContent = angle.value;
    roWidth.textContent = mm(thin) + '–' + mm(thick);
    roFlow.textContent = flow.value + ' / 10';
    roAngle.textContent = angle.value + '°';
    roChar.textContent = g.char;
    note.textContent = g.note;
    viewLabel.textContent = g.label;

    var rx, ry;
    if (current === 'stub') { rx = 22 + Number(pressure.value) * 0.8; ry = 3.6; }
    else if (current === 'architect') { rx = 3.6; ry = 22 + Number(pressure.value) * 0.8; }
    else { rx = 9 + Number(pressure.value) * 0.55; ry = 8 + Number(pressure.value) * 0.45; }
    tip.setAttribute('rx', rx.toFixed(1));
    tip.setAttribute('ry', ry.toFixed(1));
  }

  [pressure, flow, angle].forEach(function (el) { el.addEventListener('input', updateReadout); });

  row.addEventListener('click', function (e) {
    var b = e.target.closest('.grind');
    if (!b) return;
    current = b.getAttribute('data-grind');
    Array.prototype.forEach.call(row.querySelectorAll('.grind'), function (btn) {
      var on = btn === b;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    updateReadout();
  });

  /* a practised capital, drawn at the current nib settings */
  var samplePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  samplePath.setAttribute('d', 'M322 196 C270 182 224 200 218 236 C212 274 262 288 272 322 C282 358 244 386 192 374 C176 370 166 362 160 352');
  samplePath.setAttribute('fill', 'none');
  samplePath.setAttribute('stroke', 'none');
  paper.appendChild(samplePath);
  var underlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  underlinePath.setAttribute('d', 'M160 352 C220 372 320 372 420 344 C500 322 586 306 660 312');
  underlinePath.setAttribute('fill', 'none');
  underlinePath.setAttribute('stroke', 'none');
  paper.appendChild(underlinePath);

  var animating = false;
  function drawPathAlong(pathEl, done) {
    var total = pathEl.getTotalLength();
    var pts = [];
    var steps = Math.max(40, Math.round(total / 4));
    for (var i = 0; i <= steps; i++) pts.push(pathEl.getPointAtLength((i / steps) * total));
    var i2 = 1;
    function tick() {
      for (var k = 0; k < 2 && i2 < pts.length; k++, i2++) {
        addSegment(pts[i2 - 1].x, pts[i2 - 1].y, pts[i2].x, pts[i2].y);
      }
      if (i2 < pts.length) {
        window.setTimeout(tick, 12);
      } else if (done) {
        done();
      }
    }
    tick();
  }

  sampleBtn.addEventListener('click', function () {
    if (animating) return;
    animating = true;
    if (hint) hint.style.display = 'none';
    drawPathAlong(samplePath, function () {
      drawPathAlong(underlinePath, function () { animating = false; });
    });
  });

  clearBtn.addEventListener('click', function () {
    while (inkLayer.firstChild) inkLayer.removeChild(inkLayer.firstChild);
    if (hint) hint.style.display = '';
    strokes = 0;
  });

  updateReadout();
})();

/* ---------- fitting form ---------- */
(function () {
  var form = document.getElementById('fitting');
  if (!form) return;
  var status = document.getElementById('fitting-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      if (!el.value.trim()) {
        ok = false;
        el.style.borderColor = '#9a6a2f';
        el.setAttribute('aria-invalid', 'true');
      } else {
        el.style.borderColor = '';
        el.removeAttribute('aria-invalid');
      }
    });
    if (!ok) {
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var get = function (id) { return (form.querySelector('#' + id).value || '').trim(); };
    var ref = 'HF-' + String(Date.now()).slice(-6);
    var body = [
      'Name: ' + get('fit-name'),
      'Email: ' + get('fit-email'),
      'Writing hand: ' + get('fit-hand'),
      'Pen angle: ' + get('fit-angle'),
      'Pressure: ' + get('fit-pressure'),
      'Script: ' + get('fit-script'),
      'Paper: ' + get('fit-paper'),
      'Ink: ' + get('fit-ink'),
      '',
      get('fit-message')
    ].join('\n');
    var mail = 'mailto:bench@hollisandfeed.example?subject=' + encodeURIComponent('Fitting ' + ref) + '&body=' + encodeURIComponent(body);
    status.hidden = false;
    status.innerHTML = '<h3>Fitting sheet ' + ref + '</h3>' +
      '<p>Your answers are ready as an email; nothing has been sent from this page. Open the message and send it, or write to <a href="mailto:bench@hollisandfeed.example">bench@hollisandfeed.example</a>.</p>' +
      '<p><a href="' + mail + '">Open the email with your fitting sheet</a></p>';
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
