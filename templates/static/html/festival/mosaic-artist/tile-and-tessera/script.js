/* Tile & Tessera — the andamento generator, studio controls, gallery and brief form. */
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

  /* ============================================================
     Palette and motif engine
     ============================================================ */
  var PALETTES = {
    ravenna: ['#2f5d63', '#c9a227', '#a94f32', '#e8e0d2', '#3c3a36'],
    smalti: ['#1f4f5a', '#d9b45b', '#8c3b2a', '#f0e6d2', '#5b7a5e'],
    lime: ['#2b2a28', '#6e6b64', '#b3ab9c', '#f0ebe0', '#4a4844']
  };

  function motifIndex(motif, u, v) {
    var r = Math.hypot(u, v);
    var a = Math.atan2(v, u);
    if (motif === 'peacock') {
      if (r < 0.035) return 4;
      if (r < 0.07) return 1;
      if (r < 0.115) return 0;
      if (r < 0.19) return (Math.floor((a + Math.PI) / 0.35) % 2) ? 2 : 3;
      var ring = Math.floor(r * 8);
      if (ring % 7 === 4) return 1;
      return (ring % 3 === 0) ? 3 : 0;
    }
    if (motif === 'wave') {
      var w = (v + 0.1 * Math.sin(u * 7)) * 6 + 2.5;
      var bands = [0, 0, 2, 3, 1, 4];
      return bands[Math.abs(Math.floor(w)) % 6];
    }
    if (motif === 'lotus') {
      if (r < 0.05) return 3;
      if (r < 0.1) return 1;
      var sector = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 10);
      var band = Math.floor(r * 7);
      var m = (sector + band) % 5;
      var lut = [0, 0, 2, 3, 2];
      return lut[m];
    }
    var step = Math.floor((r * 8 + Math.abs(Math.cos(4 * a)) * 2.2) % 5);
    var starLut = [0, 2, 3, 1, 4];
    return starLut[Math.abs(step)];
  }

  function flowAngle(motif, u, v) {
    var a = Math.atan2(v, u);
    var r = Math.hypot(u, v);
    if (r < 0.001) return 0;
    if (motif === 'peacock') return a + Math.PI / 2;
    if (motif === 'wave') return Math.atan(0.1 * 7 * Math.cos(u * 7)) * 1.15;
    if (motif === 'lotus') return a;
    return (a + Math.PI / 8) * 4;
  }

  function hashNoise(x, y, seed) {
    var n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.max(0, (n >> 16) + amt));
    var g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
    var b = Math.min(255, Math.max(0, (n & 255) + amt));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function drawMosaic(canvas, opts) {
    if (!canvas) return 0;
    var ctx = canvas.getContext('2d');
    var S = canvas.width;
    var mm = opts.mm || 12;
    var tile = Math.max(6, mm * (S / 560) * 1.55);
    var cols = Math.ceil(S / tile) + 1;
    var pal = PALETTES[opts.palette] || PALETTES.ravenna;
    var seed = opts.seed || 1;
    var grout = opts.grout || '#cfc7b8';

    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, S, S);

    var count = 0;
    for (var j = -1; j < cols; j++) {
      for (var i = -1; i < cols; i++) {
        var cx = i * tile + tile / 2;
        var cy = j * tile + tile / 2;
        if (cx < -tile || cy < -tile || cx > S + tile || cy > S + tile) continue;
        var u = cx / S - 0.5;
        var v = cy / S - 0.5;
        var idx = motifIndex(opts.motif, u, v);
        var jitter = (hashNoise(i, j, seed) - 0.5) * 18;
        var base = pal[idx] || pal[0];
        var ang = flowAngle(opts.motif, u, v);
        var w = tile * 1.42 - 1.6 - hashNoise(i, j, seed + 3) * 1.4;
        var h = tile * 0.92 - 1.6;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, -h / 2 + (hashNoise(i, j, seed + 1) - 0.5) * 1.2);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(-w / 2 + (hashNoise(i, j, seed + 2) - 0.5) * 1.2, h / 2);
        ctx.closePath();
        ctx.fillStyle = shade(base, jitter);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, -h / 2);
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();
        count++;
      }
    }
    return count;
  }

  /* ---------------- hero panel ---------------- */
  var hero = document.getElementById('heroMosaic');
  if (hero) {
    drawMosaic(hero, { motif: 'peacock', palette: 'ravenna', mm: 11, seed: 7, grout: '#cfc7b8' });
    var heroMeta = document.getElementById('heroMeta');
    var heroPanel = Math.round(Math.pow(1.2 * (1000 / 13), 2));
    if (heroMeta) heroMeta.textContent = heroPanel.toLocaleString('en-IN') + ' tesserae · 11 mm';
  }

  /* ---------------- studio ---------------- */
  var studio = document.getElementById('studioMosaic');
  var form = document.getElementById('studioForm');
  if (studio && form) {
    var tileRange = document.getElementById('tile');
    var tileVal = document.getElementById('tileVal');
    var caption = document.getElementById('studioCaption');
    var roTitle = document.getElementById('roTitle');
    var roTiles = document.getElementById('roTiles');
    var roCount = document.getElementById('roCount');
    var roWeight = document.getElementById('roWeight');
    var roHours = document.getElementById('roHours');
    var roSet = document.getElementById('roSet');
    var roGrout = document.getElementById('roGrout');
    var roNote = document.getElementById('roNote');

    var MOTIF_NAME = { peacock: 'Peacock eye', wave: 'Wave', lotus: 'Lotus', star: 'Eight-fold star' };
    var PALETTE_NAME = { ravenna: 'Ravenna', smalti: 'Smalti', lime: 'Limestone' };
    var NOTES = {
      peacock: 'A peacock eye is the classic test of andamento: the rows have to turn through 360° without a single straight line crossing the iris.',
      wave: 'The wave is a lesson in unbroken rows. One tile out of line and the whole band reads as a mistake, which is why it is the first exercise in the studio.',
      lotus: 'Lotus petals are laid from the outside in, so each row closes on the centre. The gold is cut last, because smalti chips travel.',
      star: 'The eight-fold star needs the grid to hold at the points and give in the field. It is laid from the centre out, one sector at a time.'
    };

    function checked(name) {
      var input = form.querySelector('input[name="' + name + '"]:checked');
      return input ? input.value : null;
    }

    function renderStudio() {
      var motif = checked('motif') || 'peacock';
      var palette = checked('palette') || 'ravenna';
      var mm = parseInt(tileRange.value, 10);

      var tiles = drawMosaic(studio, { motif: motif, palette: palette, mm: mm, seed: 11, grout: palette === 'lime' ? '#bdb5a6' : '#cfc7b8' });
      var perMetre = 1000 / (mm + 2);
      var side = 1.2;
      var panelTiles = Math.round(Math.pow(side * perMetre, 2));
      var weight = Math.round(panelTiles * 1.35 / 1000);
      var hours = Math.round(panelTiles / 140);
      var settingDays = Math.max(2, Math.round(panelTiles / 2400) + 2);

      if (tileVal) tileVal.textContent = mm + ' mm';
      if (caption) caption.textContent = MOTIF_NAME[motif] + ' · ' + PALETTE_NAME[palette] + ' · ' + mm + ' mm tesserae';
      if (roTitle) roTitle.textContent = MOTIF_NAME[motif].replace(' eye', '') + ', 1.44 m²';
      if (roTiles) roTiles.textContent = panelTiles.toLocaleString('en-IN') + ' tesserae';
      if (roCount) roCount.textContent = panelTiles.toLocaleString('en-IN');
      if (roWeight) roWeight.textContent = weight + ' kg';
      if (roHours) roHours.textContent = hours + ' hours';
      if (roSet) roSet.textContent = settingDays + ' days, direct method';
      if (roGrout) roGrout.textContent = 'Lime and sand, 2 mm joint';
      if (roNote) roNote.textContent = NOTES[motif];
      studio.setAttribute('data-tiles', panelTiles);
    }

    form.addEventListener('change', renderStudio);
    form.addEventListener('input', renderStudio);
    renderStudio();
    window.addEventListener('resize', function () { renderStudio(); });
  }

  /* ---------------- gallery thumbnails ---------------- */
  document.querySelectorAll('canvas.thumb').forEach(function (c) {
    drawMosaic(c, {
      motif: c.getAttribute('data-motif') || 'wave',
      palette: c.getAttribute('data-palette') || 'ravenna',
      mm: parseInt(c.getAttribute('data-mm') || '16', 10),
      seed: parseInt(c.getAttribute('data-seed') || '3', 10),
      grout: c.getAttribute('data-palette') === 'lime' ? '#bdb5a6' : '#cfc7b8'
    });
  });

  /* ---------------- project filter ---------------- */
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
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' panel' : ' panels');
    };
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', c.classList.contains('is-on') ? 'true' : 'false');
      c.addEventListener('click', function () { apply(c.getAttribute('data-filter')); });
    });
  }
})();

/* ============================================================
   Panel brief
   ============================================================ */
(function () {
  'use strict';
  var form = document.getElementById('briefForm');
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
    if (name.length < 2) { setError('name', 'A name for the studio book.'); errors++; } else setError('name', '');
    var email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', 'Please check the email address.'); errors++; } else setError('email', '');
    var w = parseFloat(form.elements.width.value || '0');
    var h = parseFloat(form.elements.height.value || '0');
    if (!w || w < 0.2) { setError('width', 'Width in metres, at least 0.2.'); errors++; } else setError('width', '');
    if (!h || h < 0.2) { setError('height', 'Height in metres, at least 0.2.'); errors++; } else setError('height', '');

    if (errors) {
      if (status) { status.className = 'form-status'; status.textContent = 'A couple of measurements are missing.'; }
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var area = (w * h).toFixed(2);
    var where = form.elements.where.value;
    if (status) {
      status.className = 'form-status ok';
      status.textContent = 'Logged, ' + name + '. A ' + area + ' m² panel for ' + where.toLowerCase() +
        '. The studio will reply with a sample board, a tile count and an andamento sketch within five working days.';
    }
    form.reset();
  });
})();
