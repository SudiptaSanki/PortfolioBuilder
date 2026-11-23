/* Rhea Mascarenhas — comic-book portfolio
   Vanilla JS. The bench plans a print page; nothing is stored or sent. */

(function () {
  'use strict';

  /* ---------- nav ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- print bench ---------- */
  var svg = document.getElementById('pageSvg');
  if (svg) {

  var FORMATS = {
    us: { w: 168.3, h: 260.3, name: 'US comic' },
    a4: { w: 210, h: 297, name: 'A4' },
    manga: { w: 128, h: 182, name: 'Manga B6' },
    digest: { w: 139.7, h: 215.9, name: 'Digest' }
  };
  var SPOTS = ['var(--ink)', '#d8402f', '#23508f', '#e8b33c'];

  var el = {
    format: document.getElementById('format'),
    cols: document.getElementById('cols'),
    rows: document.getElementById('rows'),
    gutter: document.getElementById('gutter'),
    lpi: document.getElementById('lpi'),
    dots: document.getElementById('dots'),
    spots: document.getElementById('spots'),
    gridOut: document.getElementById('gridOut'),
    gutterOut: document.getElementById('gutterOut'),
    lpiOut: document.getElementById('lpiOut'),
    spotsOut: document.getElementById('spotsOut'),
    stageCaption: document.getElementById('stageCaption'),
    inspNo: document.getElementById('inspNo'),
    inspTitle: document.getElementById('inspTitle'),
    inspMeta: document.getElementById('inspMeta'),
    inspWords: document.getElementById('inspWords'),
    inspShare: document.getElementById('inspShare'),
    inspBalloons: document.getElementById('inspBalloons'),
    inspNote: document.getElementById('inspNote'),
    rLive: document.getElementById('rLive'),
    rPanels: document.getElementById('rPanels'),
    rType: document.getElementById('rType'),
    rPitch: document.getElementById('rPitch'),
    rInk: document.getElementById('rInk'),
    rStrokes: document.getElementById('rStrokes')
  };

  var selected = 4;
  var state = null;

  function readState() {
    var f = FORMATS[el.format.value] || FORMATS.us;
    var cols = parseInt(el.cols.value, 10);
    var rows = parseInt(el.rows.value, 10);
    var gutter = parseFloat(el.gutter.value);
    var lpi = parseInt(el.lpi.value, 10);
    var spots = parseInt(el.spots.value, 10);
    var margin = 8; /* mm inside trim */
    var liveW = f.w - margin * 2;
    var liveH = f.h - margin * 2;
    var panelW = (liveW - (cols - 1) * gutter) / cols;
    var panelH = (liveH - (rows - 1) * gutter) / rows;
    return {
      f: f, cols: cols, rows: rows, gutter: gutter, lpi: lpi, spots: spots,
      margin: margin, liveW: liveW, liveH: liveH, panelW: panelW, panelH: panelH,
      count: cols * rows,
      dotPitch: 25.4 / lpi,
      shape: el.dots.value
    };
  }

  function buildSvg(s) {
    var W = 400, H = 560;
    var pad = 24;
    var scale = Math.min((W - pad * 2) / s.f.w, (H - pad * 2) / s.f.h);
    var pw = s.f.w * scale;
    var ph = s.f.h * scale;
    var x0 = (W - pw) / 2;
    var y0 = (H - ph) / 2;
    var m = s.margin * scale;
    var g = s.gutter * scale;
    var pW = s.panelW * scale;
    var pH = s.panelH * scale;

    /* halftone preview is exaggerated ~6x so it can be seen on screen */
    var cell = 7;
    var r = Math.max(0.9, 3.4 - (s.lpi - 65) / 60);
    var pattern;
    if (s.shape === 'square') {
      pattern = '<pattern id="screen" width="' + cell + '" height="' + cell + '" patternUnits="userSpaceOnUse">' +
        '<rect x="0" y="0" width="' + (cell / 2) + '" height="' + (cell / 2) + '" fill="#14110f" opacity=".28"/></pattern>';
    } else {
      pattern = '<pattern id="screen" width="' + cell + '" height="' + cell + '" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<circle cx="' + (cell / 2) + '" cy="' + (cell / 2) + '" r="' + r.toFixed(2) + '" fill="#14110f" opacity=".3"/></pattern>';
    }

    var out = '<defs>' + pattern + '</defs>';
    out += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#efe7d6"/>';
    /* trim and bleed marks */
    out += '<rect x="' + (x0 - m * 0.4).toFixed(2) + '" y="' + (y0 - m * 0.4).toFixed(2) + '" width="' + (pw + m * 0.8).toFixed(2) + '" height="' + (ph + m * 0.8).toFixed(2) + '" fill="none" stroke="#d8402f" stroke-width="0.8" stroke-dasharray="3 3" opacity=".65"/>';
    out += '<rect x="' + x0.toFixed(2) + '" y="' + y0.toFixed(2) + '" width="' + pw.toFixed(2) + '" height="' + ph.toFixed(2) + '" fill="#f6f0e1" stroke="#14110f" stroke-width="1.6"/>';

    var n = 0;
    for (var row = 0; row < s.rows; row++) {
      for (var col = 0; col < s.cols; col++) {
        n++;
        var px = x0 + m + col * (pW + g);
        var py = y0 + m + row * (pH + g);
        var isSel = n === selected;
        var fill = '#fbf6ea';
        out += '<g class="pg-panel" data-panel="' + n + '" tabindex="0" role="button" aria-label="Panel ' + n + '">';
        out += '<rect x="' + px.toFixed(2) + '" y="' + py.toFixed(2) + '" width="' + pW.toFixed(2) + '" height="' + pH.toFixed(2) + '" fill="' + fill + '" stroke="#14110f" stroke-width="' + (isSel ? 2.6 : 1.5) + '"/>';
        /* tone block: first spot for a couple of panels, halftone over all */
        if (n % 3 === 0) {
          out += '<rect x="' + px.toFixed(2) + '" y="' + (py + pH * 0.55).toFixed(2) + '" width="' + pW.toFixed(2) + '" height="' + (pH * 0.45).toFixed(2) + '" fill="' + SPOTS[(n % s.spots) + 1] + '" opacity=".85"/>';
        } else if (n % 4 === 1) {
          out += '<circle cx="' + (px + pW * 0.72).toFixed(2) + '" cy="' + (py + pH * 0.34).toFixed(2) + '" r="' + (Math.min(pW, pH) * 0.18).toFixed(2) + '" fill="#e8b33c" opacity=".9"/>';
        }
        out += '<rect x="' + px.toFixed(2) + '" y="' + py.toFixed(2) + '" width="' + pW.toFixed(2) + '" height="' + pH.toFixed(2) + '" fill="url(#screen)" opacity=".55"/>';
        /* reading-order marker */
        out += '<circle cx="' + (px + 10).toFixed(2) + '" cy="' + (py + 10).toFixed(2) + '" r="7" fill="' + (isSel ? '#d8402f' : '#14110f') + '"/>';
        out += '<text x="' + (px + 10).toFixed(2) + '" y="' + (py + 13.2).toFixed(2) + '" text-anchor="middle" font-family="DM Mono, monospace" font-size="8" fill="#efe7d6">' + n + '</text>';
        out += '</g>';
      }
    }

    /* gutter dimension */
    if (s.cols > 1) {
      var gx = x0 + m + pW;
      out += '<line x1="' + (gx + 0.5).toFixed(2) + '" y1="' + (y0 + ph - m + 8).toFixed(2) + '" x2="' + (gx + g - 0.5).toFixed(2) + '" y2="' + (y0 + ph - m + 8).toFixed(2) + '" stroke="#d8402f" stroke-width="1.2"/>';
      out += '<text x="' + (gx + g / 2).toFixed(2) + '" y="' + (y0 + ph - m + 20).toFixed(2) + '" text-anchor="middle" font-family="DM Mono, monospace" font-size="8" fill="#d8402f">' + s.gutter + ' mm</text>';
    }
    out += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="DM Mono, monospace" font-size="8" fill="#6b6157">' + s.f.name.toUpperCase() + ' · ' + s.f.w + ' × ' + s.f.h + ' MM TRIM</text>';
    svg.innerHTML = out;
  }

  function describe(n, s) {
    var area = s.panelW * s.panelH;
    var ratio = s.panelW / s.panelH;
    var orient = ratio > 1.12 ? 'Landscape' : ratio < 0.89 ? 'Portrait' : 'Near-square';
    var words = Math.max(3, Math.round((area * 0.55) / 40));
    var balloons = Math.max(1, Math.min(6, Math.round(words / 9)));
    var share = (area / (s.liveW * s.liveH)) * 100;
    var note;
    if (words < 8) note = 'A beat, not a conversation.';
    else if (words < 16) note = 'One line, plus a reaction shot.';
    else if (words < 30) note = 'Fits an exchange, not an argument.';
    else if (words < 60) note = 'A full exchange — watch the balloon tails.';
    else note = 'Caption territory. This panel is doing narration work.';

    el.inspNo.textContent = 'P' + n;
    el.inspTitle.textContent = 'Panel ' + n;
    el.inspMeta.textContent = orient + ' · ' + s.panelW.toFixed(0) + ' × ' + s.panelH.toFixed(0) + ' mm on the trim';
    el.inspWords.textContent = words + (words === 1 ? ' word' : ' words');
    el.inspShare.textContent = share.toFixed(1) + '%';
    el.inspBalloons.textContent = balloons + (balloons === 1 ? ' balloon' : ' balloons');
    el.inspNote.textContent = note;
    return { words: words, area: area };
  }

  function updateReadouts(s) {
    el.rLive.textContent = s.liveW.toFixed(0) + ' × ' + s.liveH.toFixed(0) + ' mm';
    el.rPanels.textContent = String(s.count);
    /* smallest cap ~ nine halftone cells; convert cap mm to type pt */
    var capMm = (25.4 / s.lpi) * 9;
    var pt = capMm / 0.7 / 0.3528;
    el.rType.textContent = pt.toFixed(1) + ' pt';
    el.rPitch.textContent = s.dotPitch.toFixed(2) + ' mm';
    var coverage = 38 + s.count * 1.2 + (s.lpi - 65) * 0.16 + s.spots * 4.4 - s.gutter * 1.1;
    coverage = Math.max(28, Math.min(92, coverage));
    el.rInk.textContent = Math.round(coverage) + '%';
    var strokes = Math.round((s.panelW * s.panelH) / 42);
    el.rStrokes.textContent = strokes + ' per panel';

    var warn = s.gutter < 3 ? ' Gutter under 3 mm will fuse on newsprint.' : '';
    el.stageCaption.textContent = 'Screen previewed at roughly six times actual dot pitch. Red numbers give reading order.' + warn;
  }

  function render() {
    state = readState();
    if (selected > state.count) selected = state.count;
    if (selected < 1) selected = 1;
    el.gridOut.textContent = state.cols + ' × ' + state.rows;
    el.gutterOut.textContent = state.gutter + ' mm';
    el.lpiOut.textContent = state.lpi + ' lpi';
    el.spotsOut.textContent = String(state.spots);
    buildSvg(state);
    describe(selected, state);
    updateReadouts(state);
  }

  ['input', 'change'].forEach(function (evt) {
    [el.format, el.cols, el.rows, el.gutter, el.lpi, el.dots, el.spots].forEach(function (node) {
      node.addEventListener(evt, render);
    });
  });

  svg.addEventListener('click', function (e) {
    var group = e.target.closest('[data-panel]');
    if (!group) return;
    selected = parseInt(group.getAttribute('data-panel'), 10);
    buildSvg(state);
    describe(selected, state);
  });
  svg.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var group = e.target.closest && e.target.closest('[data-panel]');
    if (!group) return;
    e.preventDefault();
    selected = parseInt(group.getAttribute('data-panel'), 10);
    buildSvg(state);
    describe(selected, state);
  });

  render();

  } /* end bench */

  /* ---------- project filters ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var projItems = document.querySelectorAll('.proj');
  if (filterBtns.length && projItems.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        projItems.forEach(function (item) {
          var match = cat === 'all' || item.getAttribute('data-cat') === cat;
          item.hidden = !match;
        });
      });
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('briefForm');
  if (form) {
    var ok = document.getElementById('formOk');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var pages = form.elements.pages;
      var message = form.elements.message;
      var problems = [];

      function setErr(field, msg) {
        var box = document.getElementById(field.name + 'Err');
        if (box) box.textContent = msg || '';
        if (msg) problems.push(msg);
      }

      setErr(name, name.value.trim().length < 2 ? 'A name, so I know who I am answering.' : '');
      setErr(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'That address will bounce. Check it once more.');
      setErr(pages, pages.value && (parseInt(pages.value, 10) < 1 || parseInt(pages.value, 10) > 400) ? 'Between 1 and 400 pages.' : '');
      setErr(message, message.value.trim().length < 20 ? 'Tell me about the book in at least a sentence.' : '');

      if (problems.length) {
        var first = form.querySelector('.err:not(:empty)');
        if (first) first.previousElementSibling && first.previousElementSibling.focus();
        if (ok) ok.hidden = true;
        return;
      }

      var summary = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your brief for ' +
        (pages.value ? pages.value + ' pages' : 'the project') + ' is queued. I answer commission mail on Tuesdays and Fridays, usually within two working days.';
      if (ok) {
        ok.hidden = false;
        ok.querySelector('p').textContent = summary;
        ok.scrollIntoView({ block: 'nearest' });
      }
      form.reset();
      form.querySelectorAll('.err').forEach(function (n) { n.textContent = ''; });
    });
  }
})();
