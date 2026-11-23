/* Trench Explorer — profiler, depth rail, navigation, contact form.
   Silent template: no audio APIs are used anywhere. */

(function () {
  'use strict';

  var G = 9.80665;
  var R_O = 1.05;              // 2.1 m outside diameter, metres
  var PAYLOAD = 2300;          // crew of three, life support, batteries, thrusters, lights
  var FOAM_DENSITY = 420;      // kg/m3, syntactic foam
  var CD = 0.95;               // blunt sphere in a protective frame
  var ZONE_MAX = 11000;

  var WATERS = {
    pacific: { rho: 1027, label: 'Equatorial Pacific', density: '1,027 kg/m³' },
    atlantic: { rho: 1027.6, label: 'North Atlantic', density: '1,027.6 kg/m³' },
    cayman: { rho: 1035, label: 'Cayman Trough brine', density: '1,035 kg/m³' }
  };

  var MATERIALS = {
    ti: { name: 'Ti-6Al-4V', yield: 880e6, density: 4430, E: 114e9, nu: 0.34, knock: 0.62 },
    alumina: { name: 'Alumina 99.5%', yield: 2000e6, density: 3900, E: 300e9, nu: 0.22, knock: 0.55 },
    acrylic: { name: 'Cast acrylic', yield: 70e6, density: 1190, E: 3.2e9, nu: 0.35, knock: 0.4 }
  };

  var state = { depth: 4960, wall: 110, foam: 6, ballast: 620, water: 'pacific', mat: 'ti' };

  var fmt = function (n, d) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  };

  /* ---------- physics ---------- */

  function model() {
    var w = WATERS[state.water];
    var m = MATERIALS[state.mat];
    var t = state.wall / 1000;
    var rI = R_O - t;
    var pressure = w.rho * G * state.depth;                 // Pa
    var K = R_O / rI;
    var hoop = pressure * (K * K + 1) / (K * K - 1);         // Lame, inner wall
    var limit = m.yield / ((K * K + 1) / (K * K - 1));       // external pressure at yield
    var margin = limit / pressure;
    var shellVol = (4 / 3) * Math.PI * (Math.pow(R_O, 3) - Math.pow(rI, 3));
    var hullMass = shellVol * m.density;
    var hullDispl = (4 / 3) * Math.PI * Math.pow(R_O, 3) * w.rho;
    var foamDispl = state.foam * w.rho;
    var foamMass = state.foam * FOAM_DENSITY;
    var net = (hullDispl + foamDispl) - (hullMass + foamMass + PAYLOAD + state.ballast); // kg, negative sinks
    var area = Math.PI * Math.pow(R_O + 0.4, 2);
    var speed = net < 0 ? Math.sqrt((2 * Math.abs(net) * G) / (w.rho * CD * area)) : 0;
    var seconds = speed > 0.02 ? state.depth / speed : 0;
    var buckle = (2 * m.E / Math.sqrt(3 * (1 - m.nu * m.nu))) * Math.pow(t / R_O, 2) * m.knock;
    return {
      rho: w.rho, pressure: pressure, hoop: hoop, limit: limit, margin: margin,
      hullMass: hullMass, net: net, speed: speed, seconds: seconds, buckle: buckle,
      area: area, m: m, w: w
    };
  }

  /* ---------- plot ---------- */

  var NS = 'http://www.w3.org/2000/svg';
  var PLOT = { x0: 56, x1: 540, y0: 16, y1: 274, pMax: 130 };

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function px(p) { return PLOT.x0 + (Math.min(p, PLOT.pMax) / PLOT.pMax) * (PLOT.x1 - PLOT.x0); }
  function py(d) { return PLOT.y0 + (d / ZONE_MAX) * (PLOT.y1 - PLOT.y0); }

  function buildPlot() {
    var bands = document.getElementById('zoneBands');
    var grid = document.getElementById('plotGrid');
    var labels = document.getElementById('plotLabels');
    if (!bands || !grid || !labels) return;

    var zones = [
      ['Epipelagic', 0, 200, 'rgba(207,220,134,0.05)'],
      ['Mesopelagic', 200, 1000, 'rgba(207,220,134,0.02)'],
      ['Bathypelagic', 1000, 4000, 'rgba(231,233,223,0.035)'],
      ['Abyssopelagic', 4000, 6000, 'rgba(231,233,223,0.02)'],
      ['Hadal', 6000, 11000, 'rgba(201,138,94,0.07)']
    ];
    zones.forEach(function (z) {
      var top = py(z[1]);
      var h = py(z[2]) - py(z[1]);
      bands.appendChild(el('rect', { x: PLOT.x0, y: top, width: PLOT.x1 - PLOT.x0, height: h, fill: z[3] }));
      if (h >= 34) {
        labels.appendChild(el('text', { x: PLOT.x1 - 6, y: top + 12, fill: '#7b8b82', 'font-size': '8.5', 'text-anchor': 'end' })).textContent = z[0];
      }
    });

    [0, 2000, 4000, 6000, 8000, 10000].forEach(function (d) {
      grid.appendChild(el('line', { x1: PLOT.x0, x2: PLOT.x1, y1: py(d), y2: py(d) }));
      var t = el('text', { x: PLOT.x0 - 8, y: py(d) + 3.5, 'text-anchor': 'end' });
      t.textContent = d === 0 ? '0' : fmt(d / 1000) + ' km';
      labels.appendChild(t);
    });
    [0, 25, 50, 75, 100, 125].forEach(function (p) {
      grid.appendChild(el('line', { x1: px(p), x2: px(p), y1: PLOT.y0, y2: PLOT.y1 }));
      var t = el('text', { x: px(p), y: PLOT.y1 + 14, 'text-anchor': 'middle' });
      t.textContent = p === 125 ? 'MPa' : String(p);
      labels.appendChild(t);
    });
  }

  function drawPlot(m) {
    var line = document.getElementById('pressureLine');
    var marker = document.getElementById('missionMarker');
    var dot = document.getElementById('markerDot');
    var rule = document.getElementById('markerRule');
    var text = document.getElementById('markerText');
    var shade = document.getElementById('marginShade');
    var limitLine = document.getElementById('limitLine');
    if (!line) return;

    var endP = Math.min((m.rho * G * ZONE_MAX) / 1e6, PLOT.pMax);
    line.setAttribute('d', 'M' + px(0) + ',' + py(0) + ' L' + px(endP) + ',' + py(ZONE_MAX));

    var x = px(m.pressure / 1e6);
    var y = py(state.depth);
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    rule.setAttribute('x1', x);
    rule.setAttribute('x2', x);
    rule.setAttribute('y1', y);
    rule.setAttribute('y2', PLOT.y1);
    text.setAttribute('x', x > PLOT.x1 - 96 ? x - 10 : x + 10);
    text.setAttribute('y', y - 8);
    text.setAttribute('text-anchor', x > PLOT.x1 - 96 ? 'end' : 'start');
    text.textContent = fmt(state.depth) + ' m · ' + (m.pressure / 1e6).toFixed(1) + ' MPa';

    if (limitLine) {
      var xl = px(m.limit / 1e6);
      limitLine.setAttribute('x1', xl);
      limitLine.setAttribute('x2', xl);
    }
    if (shade) {
      var left = Math.min(x, px(m.limit / 1e6));
      var right = Math.max(x, px(m.limit / 1e6));
      shade.setAttribute('x', left);
      shade.setAttribute('width', Math.max(0, right - left));
      shade.setAttribute('fill', m.margin >= 1 ? 'rgba(207,220,134,0.07)' : 'rgba(201,138,94,0.10)');
    }
    if (marker) marker.setAttribute('opacity', '1');
  }

  /* ---------- readouts ---------- */

  function render() {
    if (!document.getElementById('outPressure')) return;
    var m = model();

    document.getElementById('outPressure').innerHTML =
      (m.pressure / 1e6).toFixed(1) + ' MPa<small>' + fmt(Math.round(m.pressure / 1e5)) + ' bar at ' + fmt(state.depth) + ' m</small>';
    document.getElementById('outStress').innerHTML =
      fmt(Math.round(m.hoop / 1e6)) + ' MPa<small>' + m.m.name + ', inner wall, Lamé</small>';

    var marginEl = document.getElementById('outMargin');
    marginEl.innerHTML = (m.margin >= 0.1 ? m.margin.toFixed(2) : '<0.1') + '×<small>to yield at ' +
      (m.limit / 1e6).toFixed(0) + ' MPa</small>';
    marginEl.className = m.margin < 1.15 ? 'warn' : '';

    var buoy = document.getElementById('outBuoy');
    buoy.innerHTML = (m.net < 0 ? '−' : '+') + fmt(Math.abs(Math.round(m.net))) + ' kg<small>' +
      (m.net < 0 ? 'negative: descends' : 'positive: holds station') + '</small>';

    document.getElementById('outSpeed').innerHTML = m.speed > 0.02
      ? m.speed.toFixed(2) + ' m/s<small>terminal, Cd ' + CD + '</small>'
      : '—<small>no descent weight</small>';

    var mins = m.seconds / 60;
    document.getElementById('outTime').innerHTML = m.seconds > 0
      ? Math.floor(mins / 60) + ' h ' + String(Math.round(mins % 60)).padStart(2, '0') + ' m<small>straight descent, no stops</small>'
      : '—<small>trim is not negative</small>';

    var note = document.getElementById('consoleNote');
    if (m.net < 0) {
      note.textContent = 'Trim is ' + fmt(Math.round(Math.abs(m.net))) + ' kg negative. The sphere falls at ' +
        m.speed.toFixed(2) + ' m/s and reaches ' + fmt(state.depth) + ' m in ' +
        Math.floor(mins / 60) + ' h ' + String(Math.round(mins % 60)).padStart(2, '0') + ' m. ' +
        (m.buckle / m.pressure).toFixed(1) + '× margin on elastic shell buckling before the imperfection knockdown.';
    } else {
      note.textContent = 'Trim is ' + fmt(Math.round(m.net)) + ' kg positive. Drop ballast or reduce foam until the load is negative, or the dive becomes a hover.';
    }

    var cap = document.getElementById('plotCap');
    if (cap) cap.textContent = m.w.label + ' surface density ' + m.w.density + '. Straight line: constant density to the selected depth. Dashed rule marks the pressure at which the ' + m.m.name + ' wall reaches yield.';

    drawPlot(m);
  }

  function setOut(id, text) { var n = document.getElementById(id); if (n) n.textContent = text; }

  /* ---------- controls ---------- */

  function bind() {
    var depth = document.getElementById('depthRange');
    if (!depth) return;

    depth.addEventListener('input', function () {
      state.depth = +this.value;
      setOut('depthRead', fmt(state.depth) + ' m');
      render();
    });
    document.getElementById('wallRange').addEventListener('input', function () {
      state.wall = +this.value;
      setOut('wallRead', state.wall + ' mm');
      render();
    });
    document.getElementById('foamRange').addEventListener('input', function () {
      state.foam = +this.value;
      setOut('foamRead', state.foam.toFixed(1) + ' m³');
      render();
    });
    document.getElementById('ballastRange').addEventListener('input', function () {
      state.ballast = +this.value;
      setOut('ballastRead', fmt(state.ballast) + ' kg');
      render();
    });

    document.querySelectorAll('[data-water]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.water = this.dataset.water;
        document.querySelectorAll('[data-water]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        this.setAttribute('aria-pressed', 'true');
        render();
      });
    });
    document.querySelectorAll('[data-mat]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.mat = this.dataset.mat;
        document.querySelectorAll('[data-mat]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        this.setAttribute('aria-pressed', 'true');
        render();
      });
    });
  }

  /* ---------- depth rail ---------- */

  function rail() {
    var fill = document.getElementById('railFill');
    var label = document.getElementById('railLabel');
    if (!fill) return;
    var tick = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var f = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.height = (f * 100).toFixed(1) + '%';
      label.textContent = fmt(Math.round(f * 10994)) + ' m';
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* ---------- menu ---------- */

  function menu() {
    var btn = document.getElementById('menuBtn');
    var nav = document.getElementById('siteNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- contact form ---------- */

  function form() {
    var f = document.getElementById('diveForm');
    if (!f) return;
    var status = document.getElementById('formStatus');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.querySelector('#fName').value.trim();
      var email = f.querySelector('#fEmail').value.trim();
      var brief = f.querySelector('#fBrief').value.trim();
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      if (!name) { status.textContent = 'Add a name so I know who I am writing back to.'; status.className = 'form-status error'; return; }
      if (!okEmail) { status.textContent = 'That email address does not look complete.'; status.className = 'form-status error'; return; }
      if (brief.length < 20) { status.textContent = 'Give me two lines on the site, the depth and the season.'; status.className = 'form-status error'; return; }
      status.className = 'form-status';
      status.textContent = 'Logged, ' + name.split(' ')[0] + '. I answer dive enquiries within two working days, sooner if the mobilisation date is inside six weeks.';
      f.reset();
    });
  }

  buildPlot();
  bind();
  render();
  rail();
  menu();
  form();
})();
