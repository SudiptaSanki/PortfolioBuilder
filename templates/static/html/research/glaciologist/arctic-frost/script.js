/* Arctic Frost — core reader and basal mechanics bench */
(function () {
  'use strict';

  var RHO = 917;        // kg/m3
  var G = 9.81;
  var A_ICE = 1e-17;    // Pa-3 yr-1, cold ice
  var N_GLEN = 3;
  var SLIDE_K = 1000;   // m/yr at tau/N = 1

  var ISO = [
    [0, -34.8], [3000, -35.0], [8000, -35.3], [11700, -36.2], [12900, -38.6],
    [15000, -40.2], [20000, -41.8], [25000, -41.0], [30000, -40.4], [40000, -38.9],
    [50000, -40.6], [60000, -39.2], [70000, -41.2], [80000, -38.0], [90000, -41.0],
    [100000, -39.6], [110000, -36.5], [120000, -34.6]
  ];

  var $ = function (id) { return document.getElementById(id); };

  function fmt(n, d) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function delta(age) {
    if (age <= ISO[0][0]) return ISO[0][1];
    for (var i = 1; i < ISO.length; i += 1) {
      if (age <= ISO[i][0]) {
        var a = ISO[i - 1], b = ISO[i];
        var t = (age - a[0]) / (b[0] - a[0]);
        return a[1] + t * (b[1] - a[1]);
      }
    }
    return ISO[ISO.length - 1][1];
  }

  function stageOf(age) {
    if (age < 11700) return 'Holocene';
    if (age < 12900) return 'Younger Dryas';
    if (age < 27000) return 'Last Glacial Maximum';
    if (age < 57000) return 'Middle Weichselian';
    if (age < 115000) return 'Early Weichselian';
    return 'Eemian';
  }

  function calc() {
    var thick = parseFloat($('thick').value);
    var accum = parseFloat($('accum').value);
    var depth = Math.min(parseFloat($('depth').value), thick * 0.96);
    var slope = parseFloat($('slope').value) * Math.PI / 180;
    var water = parseFloat($('water').value) / 100;

    var age = (thick / accum) * Math.log(thick / (thick - depth));
    var d18 = delta(age);
    var dt = (d18 + 34.8) * 1.5;
    var layer = accum * (1 - depth / thick) * 100;   // cm

    var tau = RHO * G * thick * Math.sin(slope);      // Pa
    var over = RHO * G * thick;
    var neff = over * (1 - water);
    var def = (2 * A_ICE / (N_GLEN + 1)) * Math.pow(tau, N_GLEN) * thick;
    var ratio = neff > 0 ? tau / neff : 50;
    var slide = Math.min(SLIDE_K * Math.pow(Math.min(ratio, 50), 3), 40000);

    return {
      thick: thick, accum: accum, depth: depth, slope: slope * 180 / Math.PI, water: water,
      age: age, d18: d18, dt: dt, layer: layer, tau: tau, over: over, neff: neff,
      def: def, slide: slide, total: def + slide
    };
  }

  function drawStrip(r) {
    var Y0 = 20, Y1 = 290;
    var y = function (z) { return Y0 + (z / r.thick) * (Y1 - Y0); };
    var layers = '';
    var N = 48;
    for (var i = 0; i < N; i += 1) {
      var zc = r.thick * (i + 0.5) / N;
      var ag = (r.thick / r.accum) * Math.log(r.thick / (r.thick - zc));
      var dv = delta(ag);
      var t = Math.max(0, Math.min(1, (dv + 43) / 9));
      var mix = function (c1, c2) { return Math.round(c1 + (c2 - c1) * t); };
      var col = 'rgb(' + mix(228, 75) + ',' + mix(238, 138) + ',' + mix(242, 168) + ')';
      layers += '<rect x="20" y="' + (Y0 + i * (Y1 - Y0) / N) + '" width="46" height="' + ((Y1 - Y0) / N + 0.6) + '" fill="' + col + '"></rect>';
    }
    $('stripLayers').innerHTML = layers;

    var grid = '';
    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
      var yy = Y0 + f * (Y1 - Y0);
      grid += '<line x1="20" y1="' + yy + '" x2="280" y2="' + yy + '"></line>';
    });
    for (var k = 0; k < 5; k += 1) {
      var x = 190 + k * 22;
      grid += '<line x1="' + x + '" y1="' + Y0 + '" x2="' + x + '" y2="' + Y1 + '"></line>';
    }
    $('stripGrid').innerHTML = grid;

    var d = '';
    for (var j = 0; j <= 160; j += 1) {
      var z = r.thick * j / 160;
      var a = (r.thick / r.accum) * Math.log(r.thick / (r.thick - z));
      var dv2 = delta(a);
      var px = 234 + ((dv2 + 45) / 12) * 46;
      d += (j === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + y(z).toFixed(1) + ' ';
    }
    $('stripCurve').setAttribute('d', d.trim());

    var my = y(r.depth);
    $('stripMark').setAttribute('y1', my);
    $('stripMark').setAttribute('y2', my);
    $('stripCap').setAttribute('y', Math.max(28, Math.min(280, my - 5)));
    $('stripCap').textContent = fmt(r.d18, 1) + ' ‰';

    var axis = '';
    axis += '<text x="72" y="' + (Y0 + 4) + '">0 m</text>';
    axis += '<text x="72" y="' + (Y0 + (Y1 - Y0) / 2 + 3) + '">' + fmt(r.thick / 2, 0) + '</text>';
    axis += '<text x="72" y="' + (Y1 - 2) + '">' + fmt(r.thick, 0) + ' m</text>';
    axis += '<text x="190" y="' + (Y1 + 16) + '">-45</text>';
    axis += '<text x="278" y="' + (Y1 + 16) + '">-33 ‰</text>';
    $('stripAxis').innerHTML = axis;
  }

  function drawBed(r) {
    var X0 = 96, X1 = 318, TOP = 34, ROW = 58, H = 16;
    var lo = Math.log10(0.01), hi = Math.log10(10000);
    var x = function (v) {
      if (v <= 0.01) return X0 + 1;
      return X0 + ((Math.log10(v) - lo) / (hi - lo)) * (X1 - X0);
    };

    var axis = '';
    [0.01, 1, 100, 10000].forEach(function (v) {
      axis += '<line x1="' + x(v) + '" y1="' + (TOP - 6) + '" x2="' + x(v) + '" y2="' + (TOP + 3 * ROW - 14) + '" stroke="rgba(14,43,58,0.14)"></line>';
      axis += '<text x="' + x(v) + '" y="' + (TOP + 3 * ROW + 4) + '" text-anchor="middle">' + (v >= 1 ? v : v.toFixed(2)) + '</text>';
    });
    axis += '<text x="' + ((X0 + X1) / 2) + '" y="' + (TOP + 3 * ROW + 18) + '" text-anchor="middle">m / yr, log scale</text>';
    $('bedAxis').innerHTML = axis;

    var rows = [
      { label: 'deformation', v: r.def, color: '#2d6f8e' },
      { label: 'sliding', v: r.slide, color: '#b4522f' },
      { label: 'total', v: r.total, color: '#0e2b3a' }
    ];
    var bars = '';
    var labels = '';
    rows.forEach(function (row, i) {
      var yy = TOP + i * ROW;
      var w = Math.max(2, x(row.v) - X0);
      bars += '<rect x="' + X0 + '" y="' + yy + '" width="' + w + '" height="' + H + '" fill="' + row.color + '"></rect>';
      labels += '<text x="' + (X0 - 8) + '" y="' + (yy + 12) + '" text-anchor="end">' + row.label + '</text>';
      labels += '<text x="' + Math.min(X1 + 4, X0 + w + 6) + '" y="' + (yy + 12) + '" fill="' + row.color + '">' + fmt(row.v, row.v < 10 ? 2 : 0) + '</text>';
    });
    $('bedBars').innerHTML = bars;
    $('bedLabels').innerHTML = labels;

    var regime = r.total < 5 ? 'cold, slow' : (r.total < 50 ? 'interior creep' : (r.total < 500 ? 'fast stream' : 'surging'));
    $('bedCap').textContent = 'total ' + fmt(r.total, 1) + ' m/yr — ' + regime + ', with ' + fmt(r.water * 100, 0) + ' % water pressure at the bed.';
  }

  function render() {
    if (!$('depth') || !$('strip')) return;
    var r = calc();

    $('depthOut').textContent = fmt(r.depth, 0) + ' m';
    $('thickOut').textContent = fmt(r.thick, 0) + ' m';
    $('accumOut').textContent = fmt(r.accum, 2) + ' m ice/yr';
    $('slopeOut').textContent = fmt(r.slope, 2) + '°';
    $('waterOut').textContent = fmt(r.water * 100, 0) + ' %';

    $('outAge').textContent = r.age >= 1000 ? fmt(r.age / 1000, 1) + ' kyr' : fmt(r.age, 0) + ' yr';
    $('outD18').textContent = fmt(r.d18, 1) + ' ‰';
    $('outDt').textContent = (r.dt >= 0 ? '+' : '−') + fmt(Math.abs(r.dt), 1) + ' °C';
    $('outLayer').textContent = fmt(r.layer, 1) + ' cm';
    $('outStage').textContent = stageOf(r.age);
    $('outDt').classList.toggle('warn', r.dt < -6);

    $('outTau').textContent = fmt(r.tau / 1000, 0) + ' kPa';
    $('outN').textContent = fmt(r.neff / 1e6, 1) + ' MPa';
    $('outDef').textContent = fmt(r.def, r.def < 10 ? 2 : 1) + ' m/yr';
    $('outSlide').textContent = fmt(r.slide, r.slide < 10 ? 2 : 1) + ' m/yr';
    $('outTotal').textContent = fmt(r.total, 1) + ' m/yr';
    $('outTotal').classList.toggle('warn', r.total > 500);

    var total = r.total;
    var regime = total < 5 ? 'cold, slow' : (total < 50 ? 'interior creep' : (total < 500 ? 'fast stream' : 'surging'));
    $('outRegime').textContent = regime;
    $('outRegime').className = total > 500 ? 'warn' : (total < 50 ? 'good' : '');

    $('ageNote').textContent = 'Thinning model only: no layer counted, no radar, no flow correction. At ' + fmt(r.depth, 0) + ' m the layers are squeezed to ' + fmt(r.layer, 1) + ' cm, which is why the deepest ice is the hardest to date.';

    var note;
    if (r.water > 0.9) {
      note = 'With water at ' + fmt(r.water * 100, 0) + ' % of overburden the effective pressure has almost gone, and sliding is ' + fmt(r.slide / Math.max(r.def, 0.001), 0) + ' times the deformation. This is the regime that turns a glacier into an ice stream, and it is reached from below, not from above.';
    } else if (r.total > 50) {
      note = 'Sliding contributes ' + fmt(100 * r.slide / r.total, 0) + ' % of the motion at this water pressure. A bed that is merely wet is not enough; it has to be nearly unsupported.';
    } else {
      note = 'At ' + fmt(r.water * 100, 0) + ' % water pressure the bed is still carrying most of the weight, so the ice creeps and the deformation term dominates. Raise the water pressure and the balance does not shift gradually.';
    }
    $('bedNote').textContent = note;

    drawStrip(r);
    drawBed(r);
  }

  function bindBench() {
    if (!$('depth')) return;
    ['depth', 'thick', 'accum', 'slope', 'water'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', render);
    });
    render();
  }

  function bindFilters() {
    var list = $('caseList');
    if (!list) return;
    var cases = list.querySelectorAll('.case');
    var count = $('caseCount');
    var btns = document.querySelectorAll('[data-filter]');

    function apply(f) {
      var shown = 0;
      for (var i = 0; i < cases.length; i += 1) {
        var tags = (cases[i].getAttribute('data-tags') || '').split(' ');
        var on = f === 'all' || tags.indexOf(f) !== -1;
        cases[i].hidden = !on;
        if (on) shown += 1;
      }
      if (count) count.textContent = 'Showing ' + shown + ' of ' + cases.length + ' projects';
      for (var j = 0; j < btns.length; j += 1) {
        var on = btns[j].getAttribute('data-filter') === f;
        btns[j].classList.toggle('is-on', on);
        btns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    for (var k = 0; k < btns.length; k += 1) {
      btns[k].addEventListener('click', function () { apply(this.getAttribute('data-filter')); });
    }
    apply('all');
  }

  function bindForm() {
    var f = $('enquiryForm');
    if (!f) return;
    var status = $('formStatus');
    var result = $('formResult');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('fName').value.trim();
      var email = $('fEmail').value.trim();
      var org = $('fOrg').value.trim();
      var kind = $('fKind').value;
      var message = $('fMessage').value.trim();
      var ok = true;

      $('errName').textContent = '';
      $('errEmail').textContent = '';
      $('errMessage').textContent = '';
      status.textContent = '';
      status.classList.remove('bad');

      if (name.length < 2) { $('errName').textContent = 'A name, please.'; ok = false; }
      if (!emailRe.test(email)) { $('errEmail').textContent = 'An address that can receive a reply.'; ok = false; }
      if (message.length < 24) { $('errMessage').textContent = 'Which core, which interval, and what you need dated.'; ok = false; }

      if (!ok) {
        result.hidden = true;
        status.textContent = 'Not sent. Check the marked fields.';
        status.classList.add('bad');
        ($('errName').textContent ? $('fName') : ($('errEmail').textContent ? $('fEmail') : $('fMessage'))).focus();
        return;
      }

      var body = 'Name: ' + name + '\nEmail: ' + email + '\nInstitution: ' + (org || '—') +
        '\nRequest: ' + kind + '\n\n' + message;
      $('resultBody').textContent = body;
      $('resultSend').setAttribute('href',
        'mailto:i.solheim@arcticfrost.no?subject=' + encodeURIComponent('Arctic Frost enquiry — ' + (org || name)) +
        '&body=' + encodeURIComponent(body));
      result.hidden = false;
      status.textContent = 'Enquiry prepared. Nothing has left this page.';
      result.focus();
    });
  }

  function bindMenu() {
    var btn = $('menuBtn');
    var nav = $('siteNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  window.__frost = {
    read: function () { return calc(); },
    set: function (name, value) { var el = $(name); if (el) { el.value = String(value); render(); } },
    stageOf: stageOf
  };

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindBench();
    bindFilters();
    bindForm();
  });
})();
