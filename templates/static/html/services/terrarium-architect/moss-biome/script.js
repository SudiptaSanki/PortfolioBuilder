/* Hollow Glass — layer inspector, glass-state control, commission form. */

(function () {
  'use strict';

  /* ---------- menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  window.addEventListener('load', function () { document.body.classList.add('loaded'); });

  /* ---------- layer data ---------- */
  var LAYERS = {
    drainage: {
      title: 'Drainage reservoir',
      desc: 'A shallow reservoir of rinsed LECA under everything else. In a sealed jar there is no outlet, so this layer is not drainage in the garden sense: it is a margin for error you can see through the glass.',
      depth: '25 mm, visible',
      mat: 'LECA clay pebbles, 8–16 mm',
      func: 'Holds excess water below the substrate',
      watch: 'A waterline climbing above 10 mm'
    },
    mesh: {
      title: 'Separation mesh',
      desc: 'A single sheet of rot-resistant fibreglass screen. Without it the fine substrate migrates into the voids below and the reservoir silts up within a year.',
      depth: '1 mm',
      mat: 'Fibreglass window screen',
      func: 'Keeps fines out of the reservoir',
      watch: 'Silt, or a gap at the edge'
    },
    charcoal: {
      title: 'Charcoal',
      desc: 'Horticultural charcoal, coarse rather than activated. Its job here is physical: it adds open, chunky structure that resists compaction. It is not a filter that keeps working forever, and treating it as one is how jars go sour.',
      depth: '8 mm',
      mat: 'Horticultural charcoal, 5–10 mm',
      func: 'Structure and air space in the base',
      watch: 'Breaking down into fines over years'
    },
    substrate: {
      title: 'Substrate',
      desc: 'A low-nutrient, open mix in the ABG tradition: two parts tree fern fibre for structure, one part peat for acidity and water retention, two parts orchid bark, one part sphagnum, one part charcoal. Rich potting compost is the usual mistake: it compacts and feeds algae that outgrow the moss.',
      depth: '50 mm',
      mat: 'ABG mix 2 : 1 : 2 : 1 : 1',
      func: 'Anchors moss, holds moisture, stays aerated',
      watch: 'Compaction, algae, fertiliser salts'
    },
    planting: {
      title: 'Moss & hardscape',
      desc: 'The living surface: moss gametophytes, cork bark and stone. Moss has no stomata on its leaves, so it takes water across the whole leaf surface. That is why surface moisture and turgor matter more than a humidity number.',
      depth: '0–30 mm above substrate',
      mat: 'Bryophytes, cork bark, slate',
      func: 'Photosynthesis, cover, microclimate',
      watch: 'Dry crisp edges, mould at the base'
    },
    air: {
      title: 'Headspace & glass',
      desc: 'The part people forget to design. The headspace holds the vapour that the moss respires into, and the glass gives it somewhere cool to condense. Open the lid for a few hours when fog will not clear; otherwise leave the loop alone.',
      depth: '120–160 mm',
      mat: 'Air, soda glass, ground lid',
      func: 'Condensation cycle and gas exchange',
      watch: 'Fog that never lifts, water running down'
    }
  };

  var hitRects = {
    drainage: { y: 288, h: 64 },
    mesh: { y: 276, h: 12 },
    charcoal: { y: 252, h: 24 },
    substrate: { y: 204, h: 48 },
    planting: { y: 148, h: 56 },
    air: { y: 66, h: 82 }
  };

  var selRect = document.getElementById('selRect');
  var titleEl = document.getElementById('layerTitle');
  var descEl = document.getElementById('layerDesc');
  var dDepth = document.getElementById('dDepth');
  var dMat = document.getElementById('dMat');
  var dFunc = document.getElementById('dFunc');
  var dWatch = document.getElementById('dWatch');

  function selectLayer(key) {
    var d = LAYERS[key];
    if (!d) return;
    titleEl.textContent = d.title;
    descEl.textContent = d.desc;
    dDepth.textContent = d.depth;
    dMat.textContent = d.mat;
    dFunc.textContent = d.func;
    dWatch.textContent = d.watch;
    var r = hitRects[key];
    if (r && selRect) {
      selRect.setAttribute('y', r.y);
      selRect.setAttribute('height', r.h);
    }
    document.querySelectorAll('.layer-hit').forEach(function (g) {
      g.classList.toggle('active', g.getAttribute('data-layer') === key);
    });
    document.querySelectorAll('.layer-hit-rect').forEach(function (el2) {
      el2.classList.toggle('active', el2.getAttribute('data-layer') === key);
    });
  }

  var firstLayer = document.querySelector('.layer-hit');
  document.querySelectorAll('.layer-hit').forEach(function (g) {
    g.addEventListener('click', function () { selectLayer(g.getAttribute('data-layer')); });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectLayer(g.getAttribute('data-layer'));
      }
    });
  });
  document.querySelectorAll('.layer-hit-rect').forEach(function (r) {
    r.addEventListener('click', function () { selectLayer(r.getAttribute('data-layer')); });
    r.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectLayer(r.getAttribute('data-layer'));
      }
    });
  });
  if (firstLayer) selectLayer('planting');

  /* ---------- glass state ---------- */
  var MIST = {
    dry: { rh: 62, fog: 0.02, drop: 0.22, text: 'No condensation for days, and the moss feels crisp at the edges. Mist the glass once, close the lid, and check again in a week.' },
    balanced: { rh: 78, fog: 0.09, drop: 0.7, text: 'A thin film of condensation in the morning, clear by mid-afternoon. Leave it alone.' },
    wet: { rh: 90, fog: 0.2, drop: 1, text: 'Fog that does not lift, with water running down the glass. Take the lid off for a few hours, then reseal and watch the waterline.' }
  };
  var fogEl = document.getElementById('jarFog');
  var dropsEl = document.getElementById('jarDrops');
  var rhEl = document.getElementById('rhRead');
  var stateEl = document.getElementById('stateText');
  var mistNow = document.getElementById('mistNow');
  var state = 'balanced';

  function applyMist(key) {
    state = key;
    var m = MIST[key];
    if (fogEl) fogEl.setAttribute('opacity', m.fog);
    if (dropsEl) dropsEl.setAttribute('opacity', m.drop);
    if (rhEl) rhEl.textContent = m.rh + '% RH';
    if (stateEl) stateEl.textContent = m.text;
    document.querySelectorAll('[data-mist]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-mist') === key ? 'true' : 'false');
    });
    if (mistNow) mistNow.setAttribute('aria-pressed', 'false');
  }

  document.querySelectorAll('[data-mist]').forEach(function (b) {
    b.addEventListener('click', function () { applyMist(b.getAttribute('data-mist')); });
  });

  if (mistNow) {
    mistNow.addEventListener('click', function () {
      var pressed = mistNow.getAttribute('aria-pressed') === 'true';
      if (pressed) {
        applyMist(state);
        return;
      }
      mistNow.setAttribute('aria-pressed', 'true');
      var base = MIST[state];
      if (fogEl) fogEl.setAttribute('opacity', Math.min(0.32, base.fog + 0.16));
      if (dropsEl) dropsEl.setAttribute('opacity', 1);
      if (rhEl) rhEl.textContent = Math.min(96, base.rh + 8) + '% RH';
      if (stateEl) stateEl.textContent = 'Freshly misted: the glass is beaded and the light is being scattered. Leave the lid on and let it clear over the next few hours.';
      window.setTimeout(function () {
        if (mistNow.getAttribute('aria-pressed') === 'true') applyMist(state);
      }, 5000);
    });
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('commissionForm');
  if (form) {
    var status = document.getElementById('commissionStatus');
    var checks = [
      { id: 'm-name', test: function (v) { return v.trim().length >= 2; } },
      { id: 'm-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { id: 'm-light', test: function (v) { return v.trim().length >= 3; } }
    ];
    function check(c) {
      var input = document.getElementById(c.id);
      if (!input) return true;
      var ok = c.test(input.value);
      input.closest('.field').classList.toggle('invalid', !ok);
      return ok;
    }
    checks.forEach(function (c) {
      var input = document.getElementById(c.id);
      if (input) input.addEventListener('blur', function () { check(c); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!checks.every(check)) {
        var bad = form.querySelector('.field.invalid input, .field.invalid select');
        if (bad) bad.focus();
        return;
      }
      status.className = 'form-status show';
      status.innerHTML = '<strong>Commission received.</strong> We will reply within two working days with a vessel size, a price and the next settle date. If the light where it will sit is not enough for moss, we will say so before you order.';
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sent';
    });
  }
})();
