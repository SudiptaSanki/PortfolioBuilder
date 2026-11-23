/* Atelier Roux — tessera, grout and daylight transmission plotter. */

(function () {
  'use strict';

  /* ------------------------------------------------------------- mobile nav */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = 'Menu';
      }
    });
  }

  /* ---------------------------------------------------------------- palette */
  var PALETTES = {
    cathedral: ['#2f4a6d', '#9c2b34', '#b98f43', '#2f6b52', '#5b4772', '#c7d0c4', '#22384f'],
    antique: ['#3a5675', '#8e3b40', '#b09055', '#4c6b57', '#6a5878', '#cfc6b0'],
    opal: ['#c7d0c4', '#9fb8a8', '#d8c9a8', '#b0899b', '#8fa3b8', '#e3ddd0'],
    dense: ['#1f3350', '#7c2630', '#93702f', '#20503c', '#4a3660', '#8e9aa6']
  };
  var TL = { cathedral: 0.90, antique: 0.84, opal: 0.55, dense: 0.38 };
  var TL_LABEL = { cathedral: 'cathedral glass', antique: 'antique glass', opal: 'opalescent glass', dense: 'dense slab glass' };

  var controls = {
    width: document.getElementById('width'),
    height: document.getElementById('height'),
    shape: document.getElementById('shape'),
    size: document.getElementById('size'),
    grout: document.getElementById('grout'),
    glass: document.getElementById('glass'),
    lux: document.getElementById('lux')
  };
  if (!controls.width) { initForm(); return; }

  var out = {
    widthTag: document.getElementById('widthTag'),
    heightTag: document.getElementById('heightTag'),
    sizeTag: document.getElementById('sizeTag'),
    groutTag: document.getElementById('groutTag'),
    luxTag: document.getElementById('luxTag'),
    svg: document.getElementById('panelSvg'),
    foot: document.getElementById('panelFoot'),
    foot2: document.getElementById('panelFoot2'),
    pieces: document.getElementById('outPieces'),
    area: document.getElementById('outArea'),
    groutOut: document.getElementById('outGrout'),
    luxOut: document.getElementById('outLux'),
    note: document.getElementById('plotNote')
  };

  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function pick(arr, i, j) { return arr[(i * 37 + j * 17 + ((i * j) % 11)) % arr.length]; }

  function drawPanel(W, H, s, g, shape, colors) {
    var scale = Math.min(290 / W, 292 / H);
    var pw = W * scale, ph = H * scale;
    var x0 = 168 + (290 - pw) / 2, y0 = 34 + (292 - ph) / 2;
    var pieces = [];
    var pitch = (s + g) * scale;
    var groutPx = Math.max(0.6, g * scale);

    pieces.push('<rect x="' + (x0 - 7) + '" y="' + (y0 - 7) + '" width="' + (pw + 14) + '" height="' + (ph + 14) + '" fill="#e6ddca" stroke="#b9ad95"/>');
    pieces.push('<clipPath id="panelClip"><rect x="' + x0 + '" y="' + y0 + '" width="' + pw + '" height="' + ph + '"/></clipPath>');
    pieces.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + pw + '" height="' + ph + '" fill="#c5b9a1"/>');

    if (shape === 'square') {
      var cols = Math.ceil(W / (s + g));
      var rows = Math.ceil(H / (s + g));
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var x = x0 + c * pitch + groutPx / 2;
          var y = y0 + r * pitch + groutPx / 2;
          var w = s * scale - groutPx;
          pieces.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(1, w).toFixed(1) + '" height="' + Math.max(1, w).toFixed(1) + '" fill="' + pick(colors, r, c) + '"/>');
        }
      }
    } else if (shape === 'diamond') {
      var side = (s + g) * scale;
      var diag = side * Math.SQRT2;
      var n = Math.ceil((pw + ph) / diag) + 3;
      pieces.push('<g clip-path="url(#panelClip)" transform="rotate(45 ' + (x0 + pw / 2) + ' ' + (y0 + ph / 2) + ')">');
      for (var dr = -n; dr <= n; dr++) {
        for (var dc = -n; dc <= n; dc++) {
          var dx = x0 + pw / 2 + dc * diag - diag / 2;
          var dy = y0 + ph / 2 + dr * diag - diag / 2;
          var dw = s * scale - groutPx;
          pieces.push('<rect x="' + dx.toFixed(1) + '" y="' + dy.toFixed(1) + '" width="' + Math.max(1, dw).toFixed(1) + '" height="' + Math.max(1, dw).toFixed(1) + '" fill="' + pick(colors, dr + 40, dc + 40) + '"/>');
        }
      }
      pieces.push('</g>');
    } else {
      /* hexagons, flat-top rows */
      var R = (s / Math.sqrt(3)) * scale;
      var hexPitchX = (s + g) * scale;
      var hexPitchY = hexPitchX * 0.866;
      var hcols = Math.ceil(pw / hexPitchX) + 1;
      var hrows = Math.ceil(ph / hexPitchY) + 1;
      pieces.push('<g clip-path="url(#panelClip)">');
      for (var hr = 0; hr < hrows; hr++) {
        for (var hc = 0; hc < hcols; hc++) {
          var cx = x0 + hc * hexPitchX + (hr % 2 ? hexPitchX / 2 : 0);
          var cy = y0 + hr * hexPitchY;
          var pts = [];
          for (var k = 0; k < 6; k++) {
            var ang = Math.PI / 3 * k;
            pts.push((cx + R * Math.cos(ang)).toFixed(1) + ',' + (cy + R * Math.sin(ang)).toFixed(1));
          }
          pieces.push('<polygon points="' + pts.join(' ') + '" fill="' + pick(colors, hr, hc) + '" stroke="#c5b9a1" stroke-width="' + Math.max(0.6, groutPx).toFixed(1) + '"/>');
        }
      }
      pieces.push('</g>');
    }

    pieces.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="#8d8171" stroke-width="1.5"/>');

    /* dimension lines */
    var dim = '#8d8171';
    pieces.push('<g stroke="' + dim + '" stroke-width="1" fill="none">' +
      '<path d="M' + (x0 - 26) + ' ' + y0 + 'v' + ph + '"/>' +
      '<path d="M' + (x0 - 31) + ' ' + y0 + 'h10M' + (x0 - 31) + ' ' + (y0 + ph) + 'h10"/>' +
      '<path d="M' + x0 + ' ' + (y0 - 18) + 'h' + pw + '"/>' +
      '<path d="M' + x0 + ' ' + (y0 - 23) + 'v10M' + (x0 + pw) + ' ' + (y0 - 23) + 'v10"/>' +
      '</g>');
    pieces.push('<text x="' + (x0 - 34) + '" y="' + (y0 + ph / 2) + '" transform="rotate(-90 ' + (x0 - 34) + ' ' + (y0 + ph / 2) + ')" text-anchor="middle" font-family="Karla, sans-serif" font-size="10" fill="' + dim + '">' + H + ' in</text>');
    pieces.push('<text x="' + (x0 + pw / 2) + '" y="' + (y0 - 27) + '" text-anchor="middle" font-family="Karla, sans-serif" font-size="10" fill="' + dim + '">' + W + ' in</text>');
    pieces.push('<text x="' + (x0 + pw) + '" y="' + (y0 + ph + 28) + '" text-anchor="end" font-family="Cormorant SC, serif" font-size="10" letter-spacing="1" fill="' + dim + '">SCALE 1:' + Math.round(1 / scale) + '</text>');

    out.svg.innerHTML = pieces.join('');
  }

  function update() {
    var W = Number(controls.width.value);
    var H = Number(controls.height.value);
    var s = Number(controls.size.value);
    var groutMm = Number(controls.grout.value);
    var g = groutMm / 25.4;
    var shape = controls.shape.value;
    var glass = controls.glass.value;
    var lux = Number(controls.lux.value);

    var pitch = s + g;
    var pieceArea = shape === 'hex' ? 0.866 * s * s : s * s;
    var cellArea = shape === 'hex' ? 0.866 * pitch * pitch : pitch * pitch;
    var pieces = Math.max(1, Math.round((W * H) / cellArea));
    var glassArea = pieces * pieceArea;
    var panelArea = W * H;
    var aperture = Math.min(1, glassArea / panelArea);
    var groutPct = Math.max(0, Math.min(100, (1 - aperture) * 100));
    var transmitted = lux * aperture * TL[glass];

    out.widthTag.textContent = W + ' in';
    out.heightTag.textContent = H + ' in';
    out.sizeTag.textContent = s + ' in';
    out.groutTag.textContent = groutMm + ' mm';
    out.luxTag.textContent = fmt(lux) + ' lux';

    out.pieces.textContent = fmt(pieces);
    out.area.innerHTML = (glassArea / 144).toFixed(1) + '<small>sq ft</small>';
    out.groutOut.innerHTML = Math.round(groutPct) + '<small>%</small>';
    out.luxOut.innerHTML = fmt(transmitted) + '<small>lux</small>';

    var shapeName = shape === 'hex' ? 'hexagon' : shape === 'diamond' ? 'diamond' : 'square quarry';
    out.foot.textContent = W + ' × ' + H + ' in · ' + shapeName + ' · ' + s + ' in';
    out.foot2.textContent = 'lead ' + groutMm + ' mm · ' + TL_LABEL[glass];

    var note = '<b>Reading the figure.</b> ' + fmt(pieces) + ' pieces at ' + (pieceArea).toFixed(1) + ' in² each, with ' +
      Math.round(groutPct) + '% of the opening given over to lead. ' + fmt(transmitted) + ' lux reaches the room at ' + fmt(lux) +
      ' lux outside, using a transmission of ' + TL[glass].toFixed(2) + ' for ' + TL_LABEL[glass] + '.';
    if (s <= 2) {
      note += ' Small quarries mean a high piece count and a lot of cutting: beautiful, and expensive to make.';
    } else if (groutMm >= 7) {
      note += ' A wide lead joint will read as a dark net from across the room; make sure that is the drawing you want.';
    }
    out.note.innerHTML = note;

    drawPanel(W, H, s, g, shape, PALETTES[glass]);
  }

  ['width', 'height', 'size', 'grout', 'lux'].forEach(function (id) {
    controls[id].addEventListener('input', update);
  });
  ['shape', 'glass'].forEach(function (id) {
    controls[id].addEventListener('change', update);
  });
  update();

function initForm() {
  /* ----------------------------------------------------------------- intake */
  var form = document.getElementById('intake');
  if (!form) return;

  var fstatus = document.getElementById('formStatus');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setErr(id, message) {
    var input = document.getElementById(id);
    var err = document.getElementById(id + 'Err');
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) err.textContent = message || '';
    return !message;
  }

  ['name', 'email', 'msg'].forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener('input', function () { setErr(id, ''); });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var ok = true;
    if (!form.elements.name.value.trim()) ok = setErr('name', 'A name for the reply.') && ok;
    else setErr('name', '');
    if (!form.elements.email.value.trim()) ok = setErr('email', 'An email address, please.') && ok;
    else if (!emailRe.test(form.elements.email.value.trim())) ok = setErr('email', 'That address looks incomplete.') && ok;
    else setErr('email', '');
    if (form.elements.msg.value.trim().length < 20) ok = setErr('msg', 'A sentence about the building and the opening is enough.') && ok;
    else setErr('msg', '');

    if (!ok) {
      fstatus.className = 'form-status show';
      fstatus.textContent = 'The enquiry needs a name, an email address and a sentence about the opening.';
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var who = form.elements.name.value.trim().split(' ')[0];
    fstatus.className = 'form-status show';
    fstatus.textContent = 'Thank you, ' + who + '. I answer commissions on Mondays and Thursdays. The first step is usually a drawing of the opening at 1:20 and a conversation about the light. This is a demonstration form in a portfolio template; nothing was transmitted.';
    form.reset();
    ['name', 'email', 'msg'].forEach(function (id) { setErr(id, ''); });
  });
}

  initForm();
})();
