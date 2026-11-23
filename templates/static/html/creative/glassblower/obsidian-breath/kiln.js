/* Annealing schedule. The kiln curve is computed from the wall thickness and
   the chosen cooling rate, and checked against the rate that thickness can
   survive without locking in stress. */
(function () {
  'use strict';

  var svg = document.getElementById('anneal');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var W = 760;
  var H = 380;
  var PAD = { left: 54, right: 18, top: 22, bottom: 40 };
  var plotW = W - PAD.left - PAD.right;
  var plotH = H - PAD.top - PAD.bottom;

  var ANNEAL = 542;
  var STRAIN = 510;
  var ENTRY = 700;
  var ROOM = 20;

  var thickness = 6;
  var rate = 40;

  var schedules = {
    6: { soak: 30, safe: 80 },
    10: { soak: 45, safe: 45 },
    16: { soak: 60, safe: 25 }
  };

  function el(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function build() {
    var spec = schedules[thickness];
    var segments = [
      { label: 'entry', from: ENTRY, to: ANNEAL + 18, perHour: 120 },
      { label: 'soak', hold: spec.soak / 60 },
      { label: 'controlled', from: ANNEAL + 18, to: STRAIN, perHour: rate },
      { label: 'fast', from: STRAIN, to: 80, perHour: 150 },
      { label: 'rest', from: 80, to: ROOM, perHour: 60 }
    ];

    var points = [];
    var t = 0;
    points.push({ t: 0, temp: ENTRY });
    segments.forEach(function (segment) {
      if (segment.hold !== undefined) {
        t += segment.hold;
        points.push({ t: t, temp: points[points.length - 1].temp });
        return;
      }
      var hours = (segment.from - segment.to) / segment.perHour;
      t += hours;
      points.push({ t: t, temp: segment.to });
    });

    return { points: points, total: t, soak: spec.soak, safe: spec.safe };
  }

  function draw() {
    var data = build();
    var maxTemp = 740;
    var maxT = Math.ceil(data.total);

    var x = function (hours) { return PAD.left + (hours / maxT) * plotW; };
    var y = function (temp) { return PAD.top + (1 - temp / maxTemp) * plotH; };

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    /* strain band */
    svg.appendChild(el('rect', {
      x: PAD.left, y: y(STRAIN + 10), width: plotW, height: Math.max(2, y(STRAIN - 10) - y(STRAIN + 10)),
      class: 'strain-band'
    }));

    /* horizontal grid + labels */
    [0, 200, 400, 600].forEach(function (temp) {
      svg.appendChild(el('line', { x1: PAD.left, y1: y(temp), x2: W - PAD.right, y2: y(temp), class: 'grid-line' }));
      svg.appendChild(el('text', { x: PAD.left - 10, y: y(temp) + 4, 'text-anchor': 'end', class: 'axis-label' }, temp + '°'));
    });

    /* vertical grid + hour labels */
    var step = maxT > 10 ? 2 : 1;
    for (var h = 0; h <= maxT; h += step) {
      svg.appendChild(el('line', { x1: x(h), y1: PAD.top, x2: x(h), y2: H - PAD.bottom, class: 'grid-line' }));
      svg.appendChild(el('text', { x: x(h), y: H - PAD.bottom + 16, 'text-anchor': 'middle', class: 'axis-label' }, h + 'h'));
    }

    svg.appendChild(el('line', { x1: PAD.left, y1: H - PAD.bottom, x2: W - PAD.right, y2: H - PAD.bottom, class: 'axis' }));
    svg.appendChild(el('line', { x1: PAD.left, y1: PAD.top, x2: PAD.left, y2: H - PAD.bottom, class: 'axis' }));

    /* curve */
    var line = data.points.map(function (point, index) {
      return (index === 0 ? 'M' : 'L') + x(point.t).toFixed(1) + ' ' + y(point.temp).toFixed(1);
    }).join(' ');
    var area = line + ' L' + x(data.points[data.points.length - 1].t).toFixed(1) + ' ' + (H - PAD.bottom) + ' L' + PAD.left + ' ' + (H - PAD.bottom) + ' Z';

    svg.appendChild(el('path', { d: area, class: 'curve-fill' }));
    svg.appendChild(el('path', { d: line, class: 'curve' }));

    /* strain line label */
    svg.appendChild(el('line', { x1: PAD.left, y1: y(STRAIN), x2: W - PAD.right, y2: y(STRAIN), class: 'strain-line' }));
    svg.appendChild(el('text', { x: W - PAD.right - 2, y: y(STRAIN) - 7, 'text-anchor': 'end', class: 'marker-label' }, 'strain point 510°'));

    /* soak marker */
    var soakPoint = data.points[1];
    svg.appendChild(el('circle', { cx: x(soakPoint.t), cy: y(soakPoint.temp), r: 3.5, class: 'marker' }));
    svg.appendChild(el('text', {
      x: x(soakPoint.t) + 10, y: y(soakPoint.temp) - 10, class: 'marker-label'
    }, 'hold ' + data.soak + ' min at ' + ANNEAL + '°'));

    /* readouts */
    document.getElementById('read-schedule').textContent = data.total.toFixed(1) + ' h in the kiln';
    document.getElementById('read-soak').textContent = data.soak + ' min';
    var verdict = document.getElementById('read-verdict');
    var tooFast = rate > data.safe;
    verdict.textContent = tooFast ? 'Too fast for this wall' : 'Within the safe rate';
    verdict.classList.toggle('is-warn', tooFast);

    window.__kilnState = {
      thickness: thickness,
      rate: rate,
      hours: data.total,
      safe: data.safe,
      verdict: tooFast ? 'too-fast' : 'safe'
    };
  }

  document.querySelectorAll('[data-thickness]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('[data-thickness]').forEach(function (other) {
        other.classList.remove('is-on');
        other.setAttribute('aria-checked', 'false');
      });
      chip.classList.add('is-on');
      chip.setAttribute('aria-checked', 'true');
      thickness = Number(chip.getAttribute('data-thickness'));
      draw();
    });
  });

  var cool = document.getElementById('cool');
  var coolOut = document.getElementById('cool-out');
  if (cool) {
    cool.addEventListener('input', function () {
      rate = Number(cool.value);
      if (coolOut) coolOut.textContent = rate + ' °C/h';
      draw();
    });
  }

  draw();
  window.__kilnReady = true;
})();
