/* Twinkle Roof — roofline designer, house elevations, effect animation and quote form. */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- geometry ---------------- */
  var HOUSES = {
    bungalow: {
      outline: 'M96 212L260 96l164 116M120 212v168h280V212M120 302h280M142 302v78M378 302v78',
      fill: '<rect x="152" y="236" width="56" height="52"/><rect x="232" y="236" width="56" height="52"/><rect x="312" y="236" width="56" height="52"/><rect x="228" y="322" width="64" height="58"/>',
      runs: [[[96, 212], [260, 96], [424, 212]]]
    },
    villa: {
      outline: 'M104 176h312v204H104zM104 262h312M172 176v-52h52v52M120 380v-52M200 380v-52M280 380v-52M360 380v-52',
      fill: '<rect x="128" y="196" width="44" height="46"/><rect x="196" y="196" width="44" height="46"/><rect x="264" y="196" width="44" height="46"/><rect x="332" y="196" width="44" height="46"/><rect x="128" y="284" width="44" height="46"/><rect x="196" y="284" width="44" height="46"/><rect x="264" y="284" width="44" height="46"/><rect x="332" y="284" width="44" height="46"/>',
      runs: [[[104, 176], [416, 176]], [[104, 262], [416, 262]]]
    },
    shop: {
      outline: 'M96 196h328v184H96zM96 232h328M120 232v148M400 232v148M120 300h280',
      fill: '<rect x="136" y="248" width="86" height="44"/><rect x="248" y="248" width="86" height="44"/><rect x="240" y="316" width="46" height="64"/>',
      runs: [[[96, 196], [424, 196]], [[96, 232], [424, 232]]]
    }
  };

  function pointOnRun(points, t) {
    var total = 0;
    var segs = [];
    for (var i = 1; i < points.length; i++) {
      var dx = points[i][0] - points[i - 1][0];
      var dy = points[i][1] - points[i - 1][1];
      var len = Math.hypot(dx, dy);
      segs.push(len);
      total += len;
    }
    var target = total * t;
    for (var j = 0; j < segs.length; j++) {
      if (target <= segs[j] || j === segs.length - 1) {
        var f = segs[j] ? target / segs[j] : 0;
        return [
          points[j][0] + (points[j + 1][0] - points[j][0]) * f,
          points[j][1] + (points[j + 1][1] - points[j][1]) * f
        ];
      }
      target -= segs[j];
    }
    return points[0];
  }

  var SCHEMES = {
    warm: ['#f2c14e', '#f7d98a', '#e8b13c'],
    multi: ['#e4573d', '#f2c14e', '#4fa3d1', '#63b37a', '#e08b2f'],
    redgold: ['#c0392b', '#f2c14e'],
    cool: ['#cfe6f2', '#a9d3e6', '#e8f4f8']
  };

  function bulbsMarkup(runs, count, scheme, effect) {
    var pal = SCHEMES[scheme] || SCHEMES.warm;
    var perRun = Math.max(2, Math.round(count / runs.length));
    var out = '';
    var k = 0;
    runs.forEach(function (points) {
      for (var i = 0; i <= perRun; i++) {
        var p = pointOnRun(points, i / perRun);
        var c = pal[k % pal.length];
        var delay = (k * 0.09).toFixed(2);
        out += '<g class="bulb-glow" style="animation-delay:' + delay + 's">' +
          '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="8" fill="url(#bulbGlow)" opacity=".55"/>' +
          '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="' + c + '"/>' +
          '</g>';
        k++;
      }
    });
    return out;
  }

  /* ---------------- hero bulbs ---------------- */
  var heroLayer = document.getElementById('heroBulbs');
  if (heroLayer) {
    heroLayer.innerHTML = bulbsMarkup([[[92, 206], [260, 96], [432, 206]]], 118, 'warm', 'steady');
  }

  /* ---------------- designer ---------------- */
  var svg = document.getElementById('planHouse');
  var form = document.getElementById('designerForm');
  if (svg && form) {
    var shapeG = document.getElementById('houseShape');
    var fillG = document.getElementById('houseFill');
    var bulbG = document.getElementById('planBulbs');
    var caption = document.getElementById('planCaption');
    var run = document.getElementById('run');
    var runVal = document.getElementById('runVal');
    var el = {
      title: document.getElementById('roTitle'),
      spacing: document.getElementById('roSpacing'),
      bulbs: document.getElementById('roBulbs'),
      strands: document.getElementById('roStrands'),
      load: document.getElementById('roLoad'),
      circuits: document.getElementById('roCircuits'),
      install: document.getElementById('roInstall'),
      cost: document.getElementById('roCost'),
      note: document.getElementById('roNote')
    };

    var BULBS = {
      c9: { name: 'C9 LED', watts: 0.6, low: 700, high: 900 },
      g40: { name: 'G40 globe', watts: 2, low: 900, high: 1200 },
      mini: { name: 'mini string', watts: 0.5, low: 500, high: 700 },
      retro: { name: 'retro filament', watts: 3, low: 1100, high: 1400 }
    };
    var HOUSE_NAME = { bungalow: 'Bungalow', villa: 'Two-storey villa', shop: 'Shopfront' };
    var SCHEME_NAME = { warm: 'Warm white', multi: 'Multicolour', redgold: 'Red and gold', cool: 'Cool white' };
    var NOTES = {
      bungalow: 'Warm white on a bungalow: the run gives out at the gutter, so the last bulb sits under the eave rather than at the corner.',
      villa: 'A villa takes two runs — the parapet and the balcony. Both are on the same circuit here; on site the balcony usually gets its own.',
      shop: 'A shopfront is lit along the fascia and the awning edge. The fascia run stays up all year; only the bulbs change.'
    };

    function checked(name) {
      var input = form.querySelector('input[name="' + name + '"]:checked');
      return input ? input.value : null;
    }

    function render() {
      var type = checked('house') || 'bungalow';
      var scheme = form.elements.scheme.value || 'warm';
      var effect = checked('effect') || 'steady';
      var bulbKey = form.elements.bulb.value;
      var metres = parseInt(run.value, 10);
      var house = HOUSES[type];
      var bulb = BULBS[bulbKey];
      var n = Math.round(metres / 0.3);
      var strandCount = Math.max(1, Math.ceil((n * 1.15) / 100));
      var watts = Math.round(n * bulb.watts + 4);
      var amps = (watts / 230).toFixed(2);
      var circuits = Math.max(1, Math.ceil(watts / 1800));
      var days = metres > 30 ? 2 : 1;

      shapeG.innerHTML = '<path d="' + house.outline + '"/>';
      fillG.innerHTML = house.fill;
      bulbG.innerHTML = bulbsMarkup(house.runs, n, scheme, effect);
      svg.setAttribute('data-effect', effect);

      if (runVal) runVal.textContent = metres + ' m';
      if (caption) caption.textContent = HOUSE_NAME[type].toUpperCase() + ' · ' + metres + ' M · ' + SCHEME_NAME[scheme].toUpperCase() + ' · ' + effect.toUpperCase();
      if (el.title) el.title.textContent = metres + ' m roofline';
      if (el.spacing) el.spacing.textContent = '30 cm spacing';
      if (el.bulbs) el.bulbs.textContent = n.toLocaleString('en-IN');
      if (el.strands) el.strands.textContent = strandCount + ' × 100';
      if (el.load) el.load.textContent = watts + ' W · ' + amps + ' A';
      if (el.circuits) el.circuits.textContent = circuits + ' × 16 A';
      if (el.install) el.install.textContent = days + (days === 1 ? ' day' : ' days') + ', two people';
      if (el.cost) {
        el.cost.textContent = '₹' + (metres * bulb.low).toLocaleString('en-IN') + ' – ₹' + (metres * bulb.high).toLocaleString('en-IN');
      }
      if (el.note) {
        el.note.textContent = (NOTES[type] || '') + (strandCount > 3 ? ' At this length the run needs a second feed; do not daisy-chain past three strands.' : '');
      }
    }

    form.addEventListener('change', render);
    form.addEventListener('input', render);
    render();
    window.addEventListener('resize', render);
  }

  /* ---------------- installation thumbnails ---------------- */
  document.querySelectorAll('svg.house-thumb').forEach(function (thumb) {
    var type = thumb.getAttribute('data-house') || 'bungalow';
    var scheme = thumb.getAttribute('data-scheme') || 'warm';
    var metres = parseInt(thumb.getAttribute('data-metres') || '24', 10);
    var house = HOUSES[type];
    var shape = thumb.querySelector('.t-shape');
    var fill = thumb.querySelector('.t-fill');
    var bulbs = thumb.querySelector('.t-bulbs');
    if (shape) shape.innerHTML = '<path d="' + house.outline + '"/>';
    if (fill) fill.innerHTML = house.fill;
    if (bulbs) bulbs.innerHTML = bulbsMarkup(house.runs, Math.round(metres / 0.6), scheme, 'steady');
  });

  /* ---------------- gallery filter ---------------- */
  var chips = document.querySelectorAll('.filters .chip');
  var cards = document.querySelectorAll('.gallery .g-card');
  var countEl = document.getElementById('galleryCount');
  if (chips.length && cards.length) {
    var apply = function (filter) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-type') === filter;
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      chips.forEach(function (c) {
        var on = c.getAttribute('data-filter') === filter;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' install' : ' installs');
    };
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', c.classList.contains('is-on') ? 'true' : 'false');
      c.addEventListener('click', function () { apply(c.getAttribute('data-filter')); });
    });
  }
})();

/* ============================================================
   Quote form
   ============================================================ */
(function () {
  'use strict';
  var form = document.getElementById('quoteForm');
  if (!form) return;
  var status = document.getElementById('formStatus');

  function setError(name, msg) {
    var field = form.elements[name];
    var slot = form.querySelector('.err[data-for="' + name + '"]');
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (slot) slot.textContent = msg || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = 0;
    var name = form.elements.name.value.trim();
    if (name.length < 2) { setError('name', 'A name for the job sheet.'); errors++; } else setError('name', '');
    var email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', 'Please check the email address.'); errors++; } else setError('email', '');
    var area = form.elements.area.value.trim();
    if (area.length < 3) { setError('area', 'The neighbourhood is enough to start.'); errors++; } else setError('area', '');
    var metres = parseFloat(form.elements.metres.value || '0');
    if (!metres || metres < 4) { setError('metres', 'Roughly how many metres of run?'); errors++; } else setError('metres', '');

    if (errors) {
      if (status) { status.className = 'form-status'; status.textContent = 'A couple of fields still need an answer.'; }
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var type = form.elements.property.value;
    if (status) {
      status.className = 'form-status ok';
      status.textContent = 'Logged, ' + name + '. A ' + type.toLowerCase() + ' in ' + area + ' with about ' + metres +
        ' m of run. We will call within two days to fix a daylight survey; the diary closes on 31 October.';
    }
    form.reset();
  });
})();
