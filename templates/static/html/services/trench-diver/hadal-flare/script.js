/* Hadal Flare — bell bounce schedule model, nav, form. Silent: no audio APIs. */

(function () {
  'use strict';

  var HT = [1.51, 3.02, 4.72, 6.99, 10.21, 14.48, 20.53, 29.11, 41.15];
  var A = [1.6189, 1.3830, 1.1919, 1.0458, 0.9220, 0.8200, 0.7300, 0.6500, 0.5700];
  var B = [0.4770, 0.5747, 0.6527, 0.7223, 0.7582, 0.7957, 0.8279, 0.8553, 0.8800];
  var DESCENT = 18;   // m/min
  var ASCENT = 10;    // m/min
  var STEP = 3;       // m per stop step

  var state = { depth: 190, bottom: 30, o2: 6.5, water: 4 };

  function ambient(d) { return 1 + d / 10; }
  function mValue(i, pAmb) { return A[i] + pAmb / B[i]; }

  function load(tissue, pAlv, minutes) {
    for (var i = 0; i < HT.length; i++) {
      var k = Math.LN2 / HT[i];
      tissue[i] = pAlv + (tissue[i] - pAlv) * Math.exp(-k * minutes);
    }
    return tissue;
  }

  function copy(t) { return t.slice(); }

  /* Surface-to-surface bell run. Returns stops, total time and profile points. */
  function run(fO2, depth, bottomMin) {
    var fHe = 1 - fO2;
    var tissue = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var points = [[0, 0]];
    var t = 0;

    // descent
    t += depth / DESCENT;
    load(tissue, fHe * ambient(depth), depth / DESCENT);
    points.push([t, depth]);

    // bottom
    t += bottomMin;
    load(tissue, fHe * ambient(depth), bottomMin);
    points.push([t, depth]);

    // ascent in 3 m steps with stops
    var stops = [];
    var d = depth;
    var guard = 0;
    while (d > 0 && guard < 400) {
      guard++;
      var next = Math.max(0, d - STEP);
      var nextAmb = ambient(next);
      var allowed = true;
      for (var i = 0; i < HT.length; i++) {
        if (tissue[i] > mValue(i, nextAmb)) { allowed = false; break; }
      }
      if (!allowed) {
        // hold here until every compartment clears the next step
        var held = 0;
        while (!allowed && held < 600) {
          load(tissue, fHe * ambient(d), 1);
          held++;
          allowed = true;
          for (var j = 0; j < HT.length; j++) {
            if (tissue[j] > mValue(j, nextAmb)) { allowed = false; break; }
          }
        }
        t += held;
        stops.push({ depth: d, minutes: held });
        points.push([t, d]);
      }
      t += STEP / ASCENT;
      load(tissue, fHe * ambient(next), STEP / ASCENT);
      d = next;
      points.push([t, d]);
    }

    // merge stops at the same depth (adjacent holds)
    var merged = [];
    stops.forEach(function (s) {
      var last = merged[merged.length - 1];
      if (last && last.depth === s.depth) last.minutes += s.minutes;
      else merged.push({ depth: s.depth, minutes: s.minutes });
    });

    return { stops: merged, tts: t, points: points, tissue: tissue };
  }

  function directOK(fO2, depth, bottomMin) {
    var fHe = 1 - fO2;
    var tissue = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    load(tissue, fHe * ambient(depth), depth / DESCENT + bottomMin);
    var d = depth;
    while (d > 0) {
      var next = Math.max(0, d - STEP);
      load(tissue, fHe * ambient(next), STEP / ASCENT);
      for (var i = 0; i < HT.length; i++) {
        if (tissue[i] > mValue(i, ambient(next))) return false;
      }
      d = next;
    }
    return true;
  }

  function noStop(fO2, depth) {
    if (!directOK(fO2, depth, 0)) return 0;
    var lo = 0, hi = 240;
    for (var n = 0; n < 9; n++) {
      var mid = (lo + hi) / 2;
      if (directOK(fO2, depth, mid)) lo = mid; else hi = mid;
    }
    return Math.floor(lo / 5) * 5;
  }

  var CNS = [[0.5, 999], [0.6, 720], [0.7, 570], [0.8, 450], [0.9, 360], [1.0, 300], [1.1, 240], [1.2, 210], [1.3, 180], [1.4, 150], [1.5, 120], [1.6, 45]];

  function cnsLimit(ppo2) {
    if (ppo2 <= 0.5) return 999;
    for (var i = 1; i < CNS.length; i++) {
      if (ppo2 <= CNS[i][0]) {
        var x0 = CNS[i - 1][0], y0 = CNS[i - 1][1], x1 = CNS[i][0], y1 = CNS[i][1];
        return y0 + (y1 - y0) * (ppo2 - x0) / (x1 - x0);
      }
    }
    return 45;
  }

  /* ---------- drawing ---------- */

  var NS = 'http://www.w3.org/2000/svg';

  function drawProfile(res, depth) {
    var path = document.getElementById('profPath');
    if (!path) return;
    var grid = document.getElementById('profGrid');
    var labels = document.getElementById('profLabels');
    var stopsG = document.getElementById('profStops');
    grid.innerHTML = ''; labels.innerHTML = ''; stopsG.innerHTML = '';

    var X0 = 44, X1 = 500, Y0 = 16, Y1 = 262;
    var tMax = Math.max(30, res.tts);
    var px = function (t) { return X0 + (t / tMax) * (X1 - X0); };
    var py = function (d) { return Y0 + (d / Math.max(depth, 10)) * (Y1 - Y0); };

    [0, 0.5, 1].forEach(function (f) {
      var d = Math.round(depth * f);
      var g = document.createElementNS(NS, 'line');
      g.setAttribute('x1', X0); g.setAttribute('x2', X1);
      g.setAttribute('y1', py(d)); g.setAttribute('y2', py(d));
      grid.appendChild(g);
      var tx = document.createElementNS(NS, 'text');
      tx.setAttribute('x', X0 - 8); tx.setAttribute('y', py(d) + 3.5);
      tx.setAttribute('text-anchor', 'end');
      tx.textContent = d + ' m';
      labels.appendChild(tx);
    });

    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
      var t = tMax * f;
      var g = document.createElementNS(NS, 'line');
      g.setAttribute('x1', px(t)); g.setAttribute('x2', px(t));
      g.setAttribute('y1', Y0); g.setAttribute('y2', Y1);
      grid.appendChild(g);
      var tx = document.createElementNS(NS, 'text');
      tx.setAttribute('x', px(t)); tx.setAttribute('y', Y1 + 14);
      tx.setAttribute('text-anchor', 'middle');
      tx.textContent = t === 0 ? '0' : Math.round(t) + (f === 1 ? ' min' : '');
      labels.appendChild(tx);
    });

    var dstr = res.points.map(function (p, i) {
      return (i === 0 ? 'M' : 'L') + px(p[0]).toFixed(1) + ',' + py(p[1]).toFixed(1);
    }).join(' ');
    path.setAttribute('d', dstr);

    // stop markers
    var seen = {};
    res.stops.forEach(function (s) {
      if (seen[s.depth] || s.minutes < 2) return;
      seen[s.depth] = true;
    });
    // find time of each stop from the points list: draw a dot at the deepest stop and at the shallowest stop
    if (res.stops.length) {
      var first = res.stops.filter(function (x) { return x.minutes >= 3; })[0] || res.stops[0];
      var last = res.stops[res.stops.length - 1];
      [[first, px(0) + 0], [last, 0]].forEach(function () {});
      // plot dots using the profile points nearest each stop depth
      [first, last].forEach(function (s) {
        var best = res.points[0];
        res.points.forEach(function (p) {
          if (p[1] === s.depth && p[0] > best[0]) best = p;
        });
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', px(best[0]));
        dot.setAttribute('cy', py(s.depth));
        dot.setAttribute('r', 3);
        dot.setAttribute('fill', '#c63f1d');
        stopsG.appendChild(dot);
      });
      var lab = document.createElementNS(NS, 'text');
      lab.setAttribute('x', px(0) + 46);
      lab.setAttribute('y', py(first.depth) + 16);
      lab.setAttribute('font-family', 'DM Mono, monospace');
      lab.setAttribute('font-size', '9');
      lab.setAttribute('fill', '#c63f1d');
      lab.textContent = 'first stop ' + first.depth + ' m';
      stopsG.appendChild(lab);
    }
  }

  /* ---------- readouts ---------- */

  function render() {
    var fO2 = state.o2 / 100;
    var pAmb = ambient(state.depth);
    var ppo2 = fO2 * pAmb;
    var density = (fO2 * 1.429 + (1 - fO2) * 0.1785) * pAmb;
    var res = run(fO2, state.depth, state.bottom);
    var ns = noStop(fO2, state.depth);
    var deco = Math.max(0, res.tts - state.bottom - state.depth / DESCENT - state.depth / ASCENT);
    var cns = Math.min(999, (state.bottom / cnsLimit(ppo2)) * 100);
    var mod = fO2 > 0 ? (1.6 / fO2 - 1) * 10 : 0;

    var set = function (id, html, warn) {
      var n = document.getElementById(id);
      if (!n) return;
      n.innerHTML = html;
      n.className = warn ? 'warn' : '';
    };

    set('outPpo2', ppo2.toFixed(2) + ' bar' + (ppo2 > 1.6 || ppo2 < 0.16 ? '<small>outside the working range</small>' : '<small>within the 1.3–1.6 band</small>'), ppo2 > 1.6 || ppo2 < 0.16);
    set('outCns', Math.round(cns) + '%<small>of the NOAA clock</small>', cns > 80);
    set('outDensity', density.toFixed(2) + ' g/L' + (density > 5.2 ? '<small>above the 5.2 g/L limit</small>' : '<small>under the working limit</small>'), density > 5.2);
    set('outNostop', (ns > 0 ? ns + ' min' : 'none') + '<small>' + (ns > 0 ? 'to the surface directly' : 'every ascent needs stops') + '</small>', ns === 0);
    set('outDeco', (deco > 0 ? Math.round(deco) + ' min' : '0 min') + '<small>' + res.stops.length + ' stops</small>', deco > 120);
    var h = Math.floor(res.tts / 60), m = Math.round(res.tts % 60);
    set('outTts', (h > 0 ? h + ' h ' + String(m).padStart(2, '0') + ' m' : m + ' min') + '<small>in the water</small>');

    var note = document.getElementById('winNote');
    if (note) {
      var first = res.stops.filter(function (x) { return x.minutes >= 3; })[0] || res.stops[0];
      var heat = 25 * 1.9 * (33 - state.water) / 1000;
      note.textContent = (first ? 'First stop at ' + first.depth + ' m for ' + first.minutes + ' min. ' : 'No stops required. ') +
        'The same excursion from a saturation storage depth costs about 40 minutes of ascent and no stops, which is why the industry lives at depth for three weeks. ' +
        'Suit heating needs ' + heat.toFixed(1) + ' kW at ' + state.water + ' °C. MOD for 1.6 bar is ' + Math.round(mod) + ' m.';
    }

    var mixNote = document.getElementById('mixNote');
    if (mixNote) {
      mixNote.textContent = state.o2.toFixed(1) + '% O₂ in helium. Maximum operating depth for 1.6 bar is ' + Math.round(mod) +
        ' m; this dive sits at ' + ppo2.toFixed(2) + ' bar' + (state.depth > mod ? ', past the ceiling for this mix.' : '.');
    }

    drawProfile(res, state.depth);
  }

  /* ---------- controls ---------- */

  function bind() {
    var depth = document.getElementById('depth');
    if (!depth) return;
    depth.addEventListener('input', function () {
      state.depth = +this.value;
      document.getElementById('depthOut').textContent = state.depth + ' m';
      render();
    });
    document.getElementById('bottom').addEventListener('input', function () {
      state.bottom = +this.value;
      document.getElementById('bottomOut').textContent = state.bottom + ' min';
      render();
    });
    document.getElementById('o2').addEventListener('input', function () {
      state.o2 = +this.value;
      document.getElementById('o2Out').textContent = state.o2.toFixed(1) + '%';
      render();
    });
    document.getElementById('water').addEventListener('input', function () {
      state.water = +this.value;
      document.getElementById('waterOut').textContent = state.water + ' °C';
      render();
    });
  }

  function menu() {
    var btn = document.getElementById('menuBtn');
    var nav = document.getElementById('siteNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function form() {
    var f = document.getElementById('shiftForm');
    if (!f) return;
    var status = document.getElementById('formStatus');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.querySelector('#fName').value.trim();
      var email = f.querySelector('#fEmail').value.trim();
      var brief = f.querySelector('#fBrief').value.trim();
      if (!name) { status.textContent = 'A name for the reply.'; status.className = 'form-status error'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status.textContent = 'Check that email address.'; status.className = 'form-status error'; return; }
      if (brief.length < 20) { status.textContent = 'Tell me the field, the depth and the window.'; status.className = 'form-status error'; return; }
      status.className = 'form-status';
      status.textContent = 'Logged, ' + name.split(' ')[0] + '. I answer within two working days, and I will say plainly if the schedule you have is one I would not dive.';
      f.reset();
    });
  }

  bind();
  render();
  menu();
  form();
})();
