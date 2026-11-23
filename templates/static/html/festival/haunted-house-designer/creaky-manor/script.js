/* Creaky Manor — site behaviour
   Nav, reveals, fog over the elevation, and the pacing board. No audio anywhere. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- fog over the elevation ---------- */
  (function fog() {
    var canvas = document.getElementById('fog');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var bands = [];

    function seed() {
      bands = [];
      for (var i = 0; i < 4; i += 1) {
        bands.push({
          y: 0.79 + (i % 3) * 0.05,
          rx: 0.28 + (i % 4) * 0.1,
          ry: 0.03 + (i % 2) * 0.012,
          speed: 0.006 + i * 0.0022,
          phase: i * 1.7,
          alpha: 0.04 + (i % 3) * 0.012
        });
      }
    }

    function resize() {
      var box = canvas.getBoundingClientRect();
      if (!box.width) return;
      w = box.width; h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      if (!ctx || !w) return;
      ctx.clearRect(0, 0, w, h);
      bands.forEach(function (b) {
        var x = (((b.phase + t * b.speed) % 1.6) - 0.3) * w;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(159, 179, 168, ' + b.alpha + ')';
        ctx.ellipse(x, b.y * h, b.rx * w, b.ry * h, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    resize();
    seed();
    if (reduced) {
      draw(0);
    } else {
      var start = null;
      var frame = function (now) {
        if (start === null) start = now;
        draw((now - start) / 1000);
        window.requestAnimationFrame(frame);
      };
      window.requestAnimationFrame(frame);
    }
    window.addEventListener('resize', function () {
      resize();
      if (reduced) draw(0);
    });
  })();

  /* ---------- pacing board ---------- */
  (function pacing() {
    var chart = document.getElementById('pacing-chart');
    if (!chart) return;
    var rooms = document.getElementById('rooms');
    var group = document.getElementById('group');
    var fright = document.getElementById('fright');
    var format = document.getElementById('format');
    var outDuration = document.querySelector('[data-out="duration"]');
    var outScares = document.querySelector('[data-out="scares"]');
    var outActors = document.querySelector('[data-out="actors"]');
    var outThroughput = document.querySelector('[data-out="throughput"]');
    var outAdvice = document.querySelector('[data-out="advice"]');

    var W = 760;
    var H = 300;
    var PAD = { l: 44, r: 24, t: 26, b: 40 };

    function model() {
      var r = parseInt(rooms.value, 10);
      var g = parseInt(group.value, 10);
      var f = parseInt(fright.value, 10);
      var fmt = format.value;
      var minutes = fmt === 'maze' ? r * 1.1 + 2.5 : fmt === 'show' ? r * 1.9 + 1.5 : r * 1.25 + g * 0.15 + 1.5;
      var scares = Math.max(2, Math.min(r, Math.round(r * 0.62 * (f / 60))));
      var actors = Math.max(2, Math.ceil(r / 3));
      var throughput = Math.round((g * 60) / Math.max(1, minutes * 0.55));
      return { rooms: r, group: g, fright: f, format: fmt, minutes: minutes, scares: scares, actors: actors, throughput: throughput };
    }

    function positions(m) {
      var list = [];
      var f = m.fright / 100;
      for (var i = 0; i < m.scares; i += 1) {
        var base = 0.14 + (0.76 * (i + 1)) / (m.scares + 0.5);
        var push = i === m.scares - 1 ? -0.06 : 0;
        var wobble = (i % 2 === 0 ? 1 : -1) * (0.03 - f * 0.02);
        var t = Math.min(0.96, Math.max(0.06, base + wobble + push));
        list.push({ t: t, label: String(i + 1) });
      }
      return list;
    }

    function intensityAt(t, marks, m) {
      var base = 0.1 + (m.fright / 100) * 0.12;
      var peak = 0;
      marks.forEach(function (mk) {
        var d = t - mk.t;
        var width = m.fright > 70 ? 0.03 : 0.05;
        var g = Math.exp(-(d * d) / (2 * width * width));
        if (g > peak) peak = g;
      });
      var v = base + 0.035 * Math.sin(t * Math.PI * 3 + 0.4) + peak * 0.58;
      /* a quiet room before the exit */
      v -= 0.18 * Math.exp(-Math.pow((t - 0.9) / 0.06, 2));
      return Math.max(0.05, Math.min(0.97, v));
    }

    function render() {
      var m = model();
      var marks = positions(m);
      var plotW = W - PAD.l - PAD.r;
      var plotH = H - PAD.t - PAD.b;
      var xOf = function (t) { return PAD.l + t * plotW; };
      var yOf = function (v) { return PAD.t + (1 - v) * plotH; };

      var out = '<title id="chart-title">Intensity curve of a ' + m.rooms + ' room ' + m.format + ' with ' + m.scares + ' scares</title>';
      out += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent"/>';

      /* grid */
      for (var g = 0; g <= 4; g += 1) {
        var gy = PAD.t + (plotH / 4) * g;
        out += '<line x1="' + PAD.l + '" y1="' + gy + '" x2="' + (W - PAD.r) + '" y2="' + gy + '" stroke="#ece5d5" stroke-opacity=".1" stroke-width="1"/>';
      }
      var ticks = Math.max(2, Math.round(m.minutes / 4));
      for (var i = 0; i <= ticks; i += 1) {
        var t = i / ticks;
        var gx = xOf(t);
        out += '<line x1="' + gx.toFixed(1) + '" y1="' + PAD.t + '" x2="' + gx.toFixed(1) + '" y2="' + (H - PAD.b) + '" stroke="#ece5d5" stroke-opacity=".06" stroke-width="1"/>';
        out += '<text x="' + gx.toFixed(1) + '" y="' + (H - PAD.b + 18) + '" fill="#9aa89f" font-family="Spectral, Georgia, serif" font-size="11" text-anchor="middle">' + Math.round(t * m.minutes) + '</text>';
      }
      out += '<text x="' + PAD.l + '" y="' + (H - 8) + '" fill="#9aa89f" font-family="Spectral, Georgia, serif" font-size="10.5" letter-spacing="1.4">MINUTES INTO THE WALK</text>';
      out += '<text x="12" y="' + (PAD.t + 4) + '" fill="#9aa89f" font-family="Spectral, Georgia, serif" font-size="10.5" transform="rotate(-90 12 ' + (PAD.t + 4) + ')" text-anchor="end">INTENSITY</text>';

      /* curve */
      var pts = [];
      for (var s = 0; s <= 120; s += 1) {
        var tt = s / 120;
        pts.push([xOf(tt), yOf(intensityAt(tt, marks, m))]);
      }
      var line = pts.map(function (p, idx) { return (idx === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      out += '<path d="' + line + ' L' + xOf(1).toFixed(1) + ' ' + (H - PAD.b) + ' L' + xOf(0).toFixed(1) + ' ' + (H - PAD.b) + ' Z" fill="#c2a061" fill-opacity=".12"/>';
      out += '<path id="pace-line" d="' + line + '" fill="none" stroke="#c2a061" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';

      /* scare markers */
      marks.forEach(function (mk) {
        var x = xOf(mk.t);
        var y = yOf(intensityAt(mk.t, marks, m));
        out += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + (H - PAD.b) + '" stroke="#c06239" stroke-opacity=".45" stroke-width="1" stroke-dasharray="3 3"/>';
        out += '<path d="M' + x.toFixed(1) + ' ' + (y - 9).toFixed(1) + 'l6 10h-12z" fill="#c06239"/>';
        out += '<text x="' + x.toFixed(1) + '" y="' + (y - 14).toFixed(1) + '" fill="#e0c08a" font-family="Spectral, Georgia, serif" font-size="10.5" text-anchor="middle">' + mk.label + '</text>';
      });

      /* exit marker */
      out += '<line x1="' + (W - PAD.r) + '" y1="' + PAD.t + '" x2="' + (W - PAD.r) + '" y2="' + (H - PAD.b) + '" stroke="#ece5d5" stroke-opacity=".3" stroke-width="1"/>';
      out += '<text x="' + (W - PAD.r - 4) + '" y="' + (PAD.t + 12) + '" fill="#9aa89f" font-family="Spectral, Georgia, serif" font-size="10.5" text-anchor="end">EXIT</text>';

      chart.innerHTML = out;

      if (outDuration) outDuration.textContent = Math.round(m.minutes) + ' min';
      if (outScares) outScares.textContent = String(m.scares);
      if (outActors) outActors.textContent = String(m.actors);
      if (outThroughput) outThroughput.textContent = m.throughput + ' / hr';

      if (outAdvice) {
        var paceText;
        if (m.fright >= 80) paceText = 'A hard fright setting: two scares come close together in the middle, then a long quiet before the exit. Warn the front of house; groups will come out fast and loud.';
        else if (m.fright <= 30) paceText = 'A gentle setting, suited to families and daylight hours: the scares sit far apart and the last room is almost kind.';
        else paceText = 'A medium fright: four scares on the way in, two in the last third, and a quiet room before the exit so people leave talking rather than running.';
        outAdvice.textContent = m.rooms + ' rooms, ' + m.format + ' format, group of ' + m.group + '. ' + paceText + ' Est. ' + Math.round(m.minutes) + ' minutes, ' + m.actors + ' actors.';
      }
    }

    [rooms, group, fright, format].forEach(function (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    render();
  })();

  /* ---------- case filters ---------- */
  (function cases() {
    var buttons = document.querySelectorAll('.case-filters button');
    if (!buttons.length) return;
    var items = document.querySelectorAll('.case');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === button ? 'true' : 'false'); });
        items.forEach(function (item) {
          item.hidden = !(filter === 'all' || item.getAttribute('data-kind') === filter);
        });
        var status = document.getElementById('case-status');
        if (status) status.textContent = document.querySelectorAll('.case:not([hidden])').length + ' of ' + items.length + ' cases shown';
      });
    });
  })();

  /* ---------- commission form ---------- */
  (function form() {
    var f = document.getElementById('contact-form');
    if (!f) return;
    var note = document.getElementById('form-note');
    f.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = f.querySelector('#name');
      var email = f.querySelector('#email');
      var message = f.querySelector('#message');
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        if (note) { note.textContent = 'The building, the dates and a name: those three get an answer. The rest can follow.'; note.hidden = false; }
        return;
      }
      if (note) {
        note.textContent = 'Received, ' + name.value.trim().split(' ')[0] + '. I visit on Fridays; if the building is within two hours of Sheffield I can usually come the same week.';
        note.hidden = false;
      }
      f.reset();
    });
  })();
})();
