/* Harrow & Welt — patina comparison, stitch bench and page behaviour */

(function () {
  'use strict';

  var menubtn = document.querySelector('.menubtn');
  var mnav = document.getElementById('mnav');
  if (menubtn && mnav) {
    menubtn.addEventListener('click', function () {
      var open = menubtn.getAttribute('aria-expanded') === 'true';
      menubtn.setAttribute('aria-expanded', String(!open));
      mnav.hidden = open;
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mnav.hidden = true;
        menubtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mnav.hidden) {
        mnav.hidden = true;
        menubtn.setAttribute('aria-expanded', 'false');
        menubtn.focus();
      }
    });
  }

  /* ---------- patina comparison ---------- */
  var compare = document.getElementById('compare');
  if (!compare) return;

  var frame = document.getElementById('compare-frame');
  var range = document.getElementById('patina-range');

  function setSplit(value) {
    var v = Math.max(0, Math.min(100, value));
    frame.style.setProperty('--split', v + '%');
    range.value = String(Math.round(v));
  }

  range.addEventListener('input', function () { setSplit(Number(range.value)); });

  var dragging = false;
  function fromEvent(e) {
    var r = frame.getBoundingClientRect();
    setSplit(((e.clientX - r.left) / r.width) * 100);
  }
  frame.addEventListener('pointerdown', function (e) {
    dragging = true;
    frame.setPointerCapture(e.pointerId);
    fromEvent(e);
  });
  frame.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    fromEvent(e);
  });
  frame.addEventListener('pointerup', function () { dragging = false; });
  frame.addEventListener('pointercancel', function () { dragging = false; });

  setSplit(Number(range.value));

  /* ---------- stitch tension ---------- */
  var svg = document.getElementById('stitch-svg');
  var stitchGroup = document.getElementById('stitches');
  var tension = document.getElementById('tension');
  var tensionOut = document.getElementById('tension-out');
  var roPitch = document.getElementById('ro-pitch');
  var roHeight = document.getElementById('ro-height');
  var roLoad = document.getElementById('ro-load');
  var roVerdict = document.getElementById('ro-verdict');
  var note = document.getElementById('tension-note');
  var caption = document.getElementById('stitch-caption');
  var topHide = document.getElementById('top-hide');

  var seam = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  seam.setAttribute('d', 'M60 168 C240 156 660 156 840 168');
  seam.setAttribute('fill', 'none');
  seam.setAttribute('stroke', 'none');
  svg.appendChild(seam);

  function renderStitches() {
    var t = Number(tension.value);
    stitchGroup.innerHTML = '';
    var total = seam.getTotalLength();
    var spacing = total / (24 + (t - 6) * 1.6);
    var len = 34 - Math.abs(t - 6) * 1.8;
    var slant = 11 + (t - 6) * 0.9;

    for (var d = spacing * 0.5; d < total; d += spacing) {
      var p = seam.getPointAtLength(d);
      var p2 = seam.getPointAtLength(Math.min(total, d + 1));
      var tx = p2.x - p.x;
      var ty = p2.y - p.y;
      var m = Math.hypot(tx, ty) || 1;
      var nx = -ty / m;
      var ny = tx / m;

      if (t <= 3) {
        var loop = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        loop.setAttribute('d', 'M' + (p.x - slant).toFixed(1) + ' ' + (p.y - 2).toFixed(1) +
          ' Q' + p.x.toFixed(1) + ' ' + (p.y - len - 10).toFixed(1) + ' ' + (p.x + slant).toFixed(1) + ' ' + (p.y + 2).toFixed(1));
        loop.setAttribute('fill', 'none');
        loop.setAttribute('stroke', '#e8d7b4');
        loop.setAttribute('stroke-width', '2.6');
        loop.setAttribute('stroke-linecap', 'round');
        loop.setAttribute('opacity', '0.9');
        stitchGroup.appendChild(loop);
      }

      var tanx = tx / m;
      var tany = ty / m;
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      s.setAttribute('x1', (p.x - tanx * slant - nx * len * 0.5).toFixed(1));
      s.setAttribute('y1', (p.y - tany * slant - ny * len * 0.5).toFixed(1));
      s.setAttribute('x2', (p.x + tanx * slant + nx * len * 0.5).toFixed(1));
      s.setAttribute('y2', (p.y + tany * slant + ny * len * 0.5).toFixed(1));
      s.setAttribute('stroke', t >= 9 ? '#e2c79a' : '#f6e7c6');
      s.setAttribute('stroke-width', (4 - Math.max(0, t - 8) * 0.3).toFixed(2));
      s.setAttribute('stroke-linecap', 'round');
      stitchGroup.appendChild(s);

      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', p.x.toFixed(1));
      dot.setAttribute('cy', p.y.toFixed(1));
      dot.setAttribute('r', '2.1');
      dot.setAttribute('fill', '#3d2517');
      dot.setAttribute('opacity', '0.45');
      stitchGroup.appendChild(dot);

      if (t >= 9) {
        var bite = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bite.setAttribute('d', 'M' + (p.x - 3).toFixed(1) + ' ' + (p.y + 1).toFixed(1) +
          ' q3 6 6 0');
        bite.setAttribute('fill', 'none');
        bite.setAttribute('stroke', '#3d2517');
        bite.setAttribute('stroke-width', '1');
        bite.setAttribute('opacity', '0.4');
        stitchGroup.appendChild(bite);
      }
    }

    // the leather puckers along the seam as the tension bites
    var pucker = Math.max(0, t - 7);
    if (pucker > 0) {
      topHide.setAttribute('d', 'M60 96 C240 84 660 84 840 96 L840 ' + (168 - pucker * 1.2).toFixed(1) +
        ' C740 ' + (160 + pucker * 2.2).toFixed(1) + ' 640 ' + (158 - pucker * 2).toFixed(1) +
        ' 540 ' + (162 + pucker * 1.6).toFixed(1) + ' C440 ' + (166 - pucker * 1.4).toFixed(1) +
        ' 330 ' + (160 + pucker * 2.4).toFixed(1) + ' 220 ' + (162 - pucker * 1.2).toFixed(1) +
        ' C140 ' + (164 + pucker) + ' 100 ' + (166 - pucker) + ' 60 ' + (168 - pucker * 1.2).toFixed(1) + ' Z');
    } else {
      topHide.setAttribute('d', 'M60 96 C240 84 660 84 840 96 L840 168 C660 156 240 156 60 168 Z');
    }

    var pitch = 7 + Math.round((t - 6) * 0.5);
    var height = Math.max(0.1, 0.7 - t * 0.06);
    var load = Math.max(4, 18 - Math.abs(t - 6) * 1.8);
    var verdict = t <= 3 ? 'Loose' : t <= 7 ? 'Even' : 'Biting';
    tensionOut.textContent = String(t);
    roPitch.textContent = pitch + ' / in';
    roHeight.textContent = height.toFixed(1) + ' mm';
    roLoad.textContent = load.toFixed(0) + ' kg';
    roVerdict.textContent = verdict;
    caption.textContent = 'tension ' + t + ' / 10 · ' + verdict.toLowerCase();

    if (t <= 2) {
      note.textContent = 'The thread stands proud of the leather and the stitch is loose enough to catch on a buckle. A seam like this will wear through in a season.';
    } else if (t <= 4) {
      note.textContent = 'Slightly slack: the two layers are not drawn together and the wax sits on the surface. Fine for a temporary repair, not for a bridle.';
    } else if (t <= 7) {
      note.textContent = 'At six the thread sits in the leather, the seam is flat and the two layers are drawn together without a pucker. This is the tension a bridle is stitched at.';
    } else if (t <= 8) {
      note.textContent = 'A little firm. The seam is still sound, but the leather is beginning to ripple along the stitch line; check the awl angle before the next run.';
    } else {
      note.textContent = 'Too hard: the thread has bitten into the leather, the seam puckers and the break load drops because the fibres are cut. Back off before the leather is marked.';
    }
  }

  tension.addEventListener('input', renderStitches);
  renderStitches();
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
        el.style.borderColor = '#a98443';
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
    var val = function (id) { return (form.querySelector('#' + id).value || '').trim(); };
    var wants = Array.prototype.slice.call(form.querySelectorAll('input[name="want"]:checked')).map(function (c) { return c.value; }).join(', ') || 'not stated';
    var ref = 'HW-' + String(Date.now()).slice(-6);
    var body = [
      'Name: ' + val('s-name'),
      'Email: ' + val('s-email'),
      'Horse: ' + val('s-horse'),
      'Rider seat: ' + val('s-seat'),
      'Discipline: ' + val('s-disc'),
      'What is wanted: ' + wants,
      '',
      val('s-message')
    ].join('\n');
    var mail = 'mailto:bench@harrowandwelt.example?subject=' + encodeURIComponent('Fitting ' + ref) + '&body=' + encodeURIComponent(body);
    status.hidden = false;
    status.innerHTML = '<h3>Fitting sheet ' + ref + '</h3>' +
      '<p>Nothing has been sent yet. Your answers are ready as an email; open it and send it, or write to <a href="mailto:bench@harrowandwelt.example">bench@harrowandwelt.example</a>.</p>' +
      '<p><a href="' + mail + '">Open the email with your fitting sheet</a></p>';
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
