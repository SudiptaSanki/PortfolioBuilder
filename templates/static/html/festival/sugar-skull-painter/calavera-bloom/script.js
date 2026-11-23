/* Calavera Bloom — an SVG calavera sketchbook. No audio anywhere on this site. */
(function () {
  'use strict';

  for (var i = 0; i < document.querySelectorAll('[data-year]').length; i++) {
    document.querySelectorAll('[data-year]')[i].textContent = new Date().getFullYear();
  }

  var svg = document.getElementById('face');
  var strokes = document.getElementById('strokes');

  if (svg && strokes) {
    var guides = document.getElementById('guides');
    var hint = document.getElementById('canvasHint');
    var recipe = document.getElementById('recipe');
    var mirror = document.getElementById('mirror');
    var guidesToggle = document.getElementById('guidesToggle');
    var undoBtn = document.getElementById('undo');
    var clearBtn = document.getElementById('clear');

    var history = [];       // arrays of group elements per press
    var counts = {};        // "pigment|motif" -> n
    var MOTIF_NAMES = { flower: 'flower', tear: 'tear', dot: 'dot', web: 'ray' };
    var PIGMENT_NAMES = { '#b3315b': 'magenta', '#e07a1f': 'marigold', '#1f5d50': 'verdigris', '#3b1f33': 'ink' };

    function chosen(name) {
      var el = svg.ownerDocument.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }

    function shape(motif, colour, x, y, scale) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + scale.toFixed(2) + ')');
      g.setAttribute('pointer-events', 'none');

      if (motif === 'flower') {
        var petals = 6;
        for (var p = 0; p < petals; p++) {
          var el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
          el.setAttribute('rx', '4.4');
          el.setAttribute('ry', '9');
          el.setAttribute('transform', 'rotate(' + (p * (360 / petals)) + ') translate(0 -9)');
          el.setAttribute('fill', colour);
          el.setAttribute('opacity', '0.92');
          g.appendChild(el);
        }
        var centre = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        centre.setAttribute('r', '3.2');
        centre.setAttribute('fill', colour === '#e07a1f' ? '#b3315b' : '#e07a1f');
        g.appendChild(centre);
      } else if (motif === 'tear') {
        var tear = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tear.setAttribute('d', 'M0 -10c3 5 5 8 5 11a5 5 0 0 1 -10 0c0 -3 2 -6 5 -11z');
        tear.setAttribute('fill', colour);
        tear.setAttribute('opacity', '0.9');
        g.appendChild(tear);
      } else if (motif === 'dot') {
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', colour);
        g.appendChild(dot);
      } else if (motif === 'web') {
        for (var r = 0; r < 3; r++) {
          var ray = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          var len = 12 + r * 4;
          ray.setAttribute('d', 'M0 0L' + len + ' 0');
          ray.setAttribute('stroke', colour);
          ray.setAttribute('stroke-width', '1.4');
          ray.setAttribute('stroke-linecap', 'round');
          ray.setAttribute('transform', 'rotate(' + (r * 40 - 40) + ')');
          g.appendChild(ray);
        }
      }
      return g;
    }

    function addStroke(x, y) {
      var motif = chosen('motif') || 'flower';
      var colour = chosen('pigment') || '#b3315b';
      var scale = motif === 'dot' ? 1.5 : 1;
      var made = [];
      var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.appendChild(shape(motif, colour, x, y, scale));
      strokes.appendChild(group);
      made.push(group);

      if (mirror && mirror.checked && Math.abs(x - 160) > 6) {
        var mx = 320 - x;
        var group2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group2.appendChild(shape(motif, colour, mx, y, scale));
        strokes.appendChild(group2);
        made.push(group2);
      }

      history.push(made);
      var key = PIGMENT_NAMES[colour] + '|' + MOTIF_NAMES[motif];
      counts[key] = (counts[key] || 0) + made.length;

      if (hint) hint.textContent = 'Placed a ' + MOTIF_NAMES[motif] + ' in ' + PIGMENT_NAMES[colour] + (made.length > 1 ? ', mirrored' : '') + '.';
      updateRecipe();
    }

    function updateRecipe() {
      if (!recipe) return;
      var entries = [];
      for (var key in counts) {
        if (!counts.hasOwnProperty(key) || !counts[key]) continue;
        var parts = key.split('|');
        entries.push(counts[key] + ' ' + parts[1] + (counts[key] > 1 ? 's' : '') + ' in ' + parts[0]);
      }
      if (!entries.length) {
        recipe.textContent = 'No strokes yet.';
        undoBtn.disabled = true;
        return;
      }
      recipe.textContent = entries.join(', ') + '.';
      undoBtn.disabled = false;
    }

    function toSvgPoint(evt) {
      var rect = svg.getBoundingClientRect();
      var vb = svg.viewBox.baseVal;
      return {
        x: ((evt.clientX - rect.left) / rect.width) * vb.width + vb.x,
        y: ((evt.clientY - rect.top) / rect.height) * vb.height + vb.y,
      };
    }

    svg.addEventListener('click', function (evt) {
      var pt = toSvgPoint(evt);
      addStroke(pt.x, pt.y);
    });

    /* keyboard access: space or enter places at a fixed poetic spot */
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', function (evt) {
      if (evt.key !== 'Enter' && evt.key !== ' ') return;
      evt.preventDefault();
      var n = history.length;
      var spots = [[160, 96], [160, 210], [112, 150], [208, 150], [160, 320]];
      var s = spots[n % spots.length];
      addStroke(s[0], s[1]);
    });

    undoBtn.addEventListener('click', function () {
      var last = history.pop();
      if (!last) return;
      var motif = chosen('motif') || 'flower';
      var colour = chosen('pigment') || '#b3315b';
      var key = PIGMENT_NAMES[colour] + '|' + MOTIF_NAMES[motif];
      if (counts[key]) counts[key] = Math.max(0, counts[key] - last.length);
      for (var i = 0; i < last.length; i++) {
        if (last[i].parentNode) last[i].parentNode.removeChild(last[i]);
      }
      if (hint) hint.textContent = 'Stroke lifted. The base is still dry.';
      updateRecipe();
    });

    clearBtn.addEventListener('click', function () {
      strokes.textContent = '';
      history = [];
      counts = {};
      if (hint) hint.textContent = 'Bare skull again. The first stroke is always the bravest.';
      updateRecipe();
    });

    if (mirror) mirror.addEventListener('change', function () {
      if (hint) hint.textContent = mirror.checked ? 'Mirror on: every stroke lands twice.' : 'Mirror off: free hand only.';
    });

    if (guidesToggle && guides) {
      guidesToggle.addEventListener('change', function () {
        guides.style.display = guidesToggle.checked ? '' : 'none';
      });
    }

    updateRecipe();
  }

  /* ---------- booking form ---------- */
  var form = document.getElementById('booking-form');
  if (form) {
    var status = document.getElementById('form-status');
    var date = form.querySelector('#date');
    if (date) {
      var today = new Date();
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      date.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    }
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var kind = form.querySelector('#kind');
      var when = form.querySelector('#date');
      var faces = form.querySelector('#faces');
      var message = form.querySelector('#message');
      var missing = [];
      if (!name.value.trim()) missing.push('a name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) missing.push('an email that reaches you');
      if (!kind.value) missing.push('the kind of day');
      if (!when.value) missing.push('a date');
      if (!faces.value || Number(faces.value) < 1) missing.push('how many faces');
      if (message.value.trim().length < 10) missing.push('a line about the plan');
      status.hidden = false;
      if (missing.length) {
        status.textContent = 'Still needed: ' + missing.join(', ') + '.';
        status.style.color = '#7d1f3e';
        return;
      }
      status.style.color = '';
      status.textContent = 'Sitting requested for ' + faces.value + ' face' + (Number(faces.value) > 1 ? 's' : '') + ' on ' + when.value + '. I answer within a day, and I hold the date for three.';
      form.reset();
    });
  }
})();
