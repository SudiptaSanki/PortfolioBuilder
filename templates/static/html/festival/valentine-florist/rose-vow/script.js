// Rose Vow — bouquet builder, navigation, order form.
(function () {
  'use strict';

  /* nav */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
      }
    });
  }

  /* reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- the bunch ---------- */
  var ROSES = {
    naomi: { name: 'Red Naomi', rate: 120, life: 7, stem: 60, main: '#a33c4a', petal: '#bf5a64', dark: '#6d2230', light: '#d98a90' },
    explorer: { name: 'Explorer', rate: 90, life: 6, stem: 50, main: '#7d1f2b', petal: '#94293a', dark: '#51141c', light: '#b45a68' },
    avalanche: { name: 'Avalanche', rate: 110, life: 8, stem: 55, main: '#f1ebde', petal: '#faf6ec', dark: '#d8cdb9', light: '#ffffff' },
    baccara: { name: 'Black Baccara', rate: 160, life: 5, stem: 60, main: '#3b1620', petal: '#521d2b', dark: '#240d14', light: '#7d3a48' },
    mondial: { name: 'Pink Mondial', rate: 130, life: 8, stem: 55, main: '#d99fa4', petal: '#ecc0c3', dark: '#b77d86', light: '#f6dfe0' },
    texas: { name: 'Yellow Texas', rate: 100, life: 7, stem: 50, main: '#d9b64e', petal: '#e8cd78', dark: '#b3902f', light: '#f2e2a6' }
  };
  var GREENS = { ruscus: { label: 'ruscus', cost: 150 }, eucalyptus: { label: 'eucalyptus', cost: 200 }, fern: { label: 'fern', cost: 120 }, none: { label: 'no greenery', cost: 0 } };
  var WRAPS = { kraft: { label: 'kraft', cost: 80, fill: '#d9c6a4', dark: '#b99f78' }, cellophane: { label: 'cellophane', cost: 60, fill: '#e9efec', dark: '#c4d2cc' }, black: { label: 'black paper', cost: 120, fill: '#2a2522', dark: '#171412' }, jute: { label: 'jute', cost: 100, fill: '#b99a72', dark: '#967a55' } };
  var RIBBONS = { satin: { cost: 40, colour: '#6d2230' }, gold: { cost: 50, colour: '#b08a4f' }, twine: { cost: 20, colour: '#8a6a4f' }, none: { cost: 0, colour: null } };
  var AREAS = {
    south: { label: 'Ballygunge', cost: 120, window: '18:00 and 21:00' },
    central: { label: 'Park Street', cost: 150, window: '18:00 and 21:00' },
    saltlake: { label: 'Salt Lake', cost: 220, window: '17:30 and 20:30' },
    howrah: { label: 'Howrah', cost: 250, window: '17:00 and 20:00' },
    pickup: { label: 'the shop counter', cost: 0, window: 'until 21:00' }
  };

  var form = document.getElementById('bunchForm');
  var stage = document.getElementById('stageFigure');
  var elTitle = document.getElementById('stageTitle');
  var elStems = document.getElementById('outStems');
  var elLife = document.getElementById('outLife');
  var elHeight = document.getElementById('outHeight');
  var elWeight = document.getElementById('outWeight');
  var elPrice = document.getElementById('outPrice');
  var elLine = document.getElementById('outLine');

  function roseHead(cx, cy, r, c) {
    var s = '<g transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')">';
    s += '<circle r="' + r + '" fill="' + c.main + '" stroke="' + c.dark + '" stroke-width=".7"/>';
    for (var k = 0; k < 6; k++) {
      s += '<ellipse cx="0" cy="' + (-r * 0.44).toFixed(1) + '" rx="' + (r * 0.3).toFixed(1) + '" ry="' + (r * 0.4).toFixed(1) + '" fill="' + c.petal + '" stroke="' + c.dark + '" stroke-width=".45" opacity=".95" transform="rotate(' + (k * 60) + ')"/>';
    }
    for (var j = 0; j < 5; j++) {
      s += '<ellipse cx="0" cy="' + (-r * 0.22).toFixed(1) + '" rx="' + (r * 0.2).toFixed(1) + '" ry="' + (r * 0.26).toFixed(1) + '" fill="' + c.main + '" stroke="' + c.dark + '" stroke-width=".4" opacity=".9" transform="rotate(' + (36 + j * 72) + ')"/>';
    }
    s += '<circle r="' + (r * 0.26).toFixed(1) + '" fill="' + c.dark + '"/>';
    s += '<path d="M' + (-r * 0.16) + ' 0a' + (r * 0.16) + ' ' + (r * 0.16) + ' 0 1 1 ' + (r * 0.22) + ' ' + (-r * 0.08) + 'a' + (r * 0.1) + ' ' + (r * 0.1) + ' 0 1 0 ' + (-r * 0.12) + ' ' + (r * 0.1) + '" fill="none" stroke="' + c.light + '" stroke-width="1" opacity=".9"/>';
    s += '</g>';
    return s;
  }

  function leaf(x, y, ang, len, col) {
    return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang + ')">' +
      '<path d="M0 0c' + (len * 0.3) + ' ' + (-len * 0.5) + ' ' + (len * 0.9) + ' ' + (-len * 0.45) + ' ' + len + ' 0c' + (-len * 0.1) + ' ' + (len * 0.45) + ' ' + (-len * 0.7) + ' ' + (len * 0.5) + ' ' + (-len) + ' 0z" fill="' + col + '" stroke="#2f4632" stroke-width=".6" opacity=".9"/>' +
      '<path d="M0 0h' + len + '" stroke="#2f4632" stroke-width=".5" opacity=".6"/></g>';
  }

  function drawBunch(n, rose, greenKey, wrapKey, ribbonKey, hasCard) {
    var W = 400, H = 470;
    var wrap = WRAPS[wrapKey], ribbon = RIBBONS[ribbonKey];
    var headR = n <= 6 ? 29 : n <= 12 ? 23 : n <= 24 ? 17 : 12;
    var rx = n <= 6 ? 78 : n <= 12 ? 104 : n <= 24 ? 122 : 132;
    var ry = n <= 6 ? 58 : n <= 12 ? 74 : n <= 24 ? 86 : 92;
    var cx = 200, cy = 200;
    var tieY = 352;

    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="A hand-tied bunch of ' + n + ' ' + rose.name + ' roses in ' + wrap.label + ' with ' + (ribbonKey === 'none' ? 'no ribbon' : ribbonKey + ' ribbon') + '">';
    s += '<defs><linearGradient id="wrapG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + wrap.dark + '"/><stop offset=".45" stop-color="' + wrap.fill + '"/><stop offset="1" stop-color="' + wrap.dark + '"/></linearGradient></defs>';

    // stems
    var pts = [];
    var golden = 2.39996;
    for (var i = 0; i < n; i++) {
      var t = (i + 0.5) / n;
      var rad = Math.sqrt(t);
      var a = i * golden;
      var x = cx + Math.cos(a) * rx * rad;
      var y = cy + Math.sin(a) * ry * rad * 0.92;
      pts.push({ x: x, y: y });
    }
    // draw stems first (behind heads), fanning from tie point
    for (var j = 0; j < pts.length; j++) {
      var p = pts[j];
      s += '<path d="M' + p.x.toFixed(1) + ' ' + (p.y + headR * 0.4) + 'Q' + ((p.x + cx) / 2).toFixed(1) + ' ' + ((p.y + tieY) / 2).toFixed(1) + ' ' + cx + ' ' + tieY + '" stroke="#4a6650" stroke-width="' + (n > 24 ? 2 : 2.6) + '" fill="none" opacity=".85"/>';
    }

    // greenery
    if (greenKey !== 'none') {
      var gcol = greenKey === 'eucalyptus' ? '#8ea99a' : greenKey === 'fern' ? '#5c7a58' : '#3f5d44';
      var count = greenKey === 'fern' ? 10 : 6;
      for (var g = 0; g < count; g++) {
        var ga = (g / count) * Math.PI * 2 + 0.3;
        var gx = cx + Math.cos(ga) * (rx + 18);
        var gy = cy + Math.sin(ga) * (ry + 14);
        s += leaf(gx, gy, (ga * 180) / Math.PI + 90, greenKey === 'fern' ? 46 : 38, gcol);
      }
    }

    // heads, those further back drawn first
    pts.sort(function (p, q) { return p.y - q.y; });
    for (var m = 0; m < pts.length; m++) {
      s += roseHead(pts[m].x, pts[m].y, headR * (0.92 + (m % 3) * 0.04), rose);
    }

    // wrap cone
    var topW = rx * 0.78, botW = rx * 0.34;
    s += '<path d="M' + (cx - topW) + ' ' + (tieY - 26) + 'L' + (cx - botW) + ' ' + (H - 16) + 'Q' + cx + ' ' + (H - 4) + ' ' + (cx + botW) + ' ' + (H - 16) + 'L' + (cx + topW) + ' ' + (tieY - 26) + 'Q' + cx + ' ' + (tieY - 40) + ' ' + (cx - topW) + ' ' + (tieY - 26) + 'Z" fill="url(#wrapG)" stroke="#231b1b" stroke-width="1.1"/>';
    // wrap folds
    s += '<path d="M' + (cx - topW + 12) + ' ' + (tieY - 22) + 'L' + (cx - botW + 6) + ' ' + (H - 22) + 'M' + (cx + topW - 12) + ' ' + (tieY - 22) + 'L' + (cx + botW - 6) + ' ' + (H - 22) + '" stroke="#231b1b" stroke-width=".7" opacity=".25"/>';
    if (wrapKey === 'cellophane') {
      s += '<path d="M' + (cx - topW * 0.5) + ' ' + (tieY - 6) + 'L' + (cx - botW * 0.2) + ' ' + (H - 34) + '" stroke="#ffffff" stroke-width="14" opacity=".4"/>';
    }

    // ribbon
    if (ribbon.colour) {
      s += '<path d="M' + (cx - topW * 0.72) + ' ' + (tieY - 6) + 'q' + (topW * 0.72) + ' 14 ' + (topW * 1.44) + ' 0" stroke="' + ribbon.colour + '" stroke-width="8" fill="none"/>';
      s += '<path d="M' + (cx + 6) + ' ' + (tieY - 2) + 'c22-18 34 2 20 10s-26 28-16 44" stroke="' + ribbon.colour + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
      s += '<path d="M' + (cx - 6) + ' ' + (tieY - 2) + 'c-22-18-34 2-20 10s26 28 16 44" stroke="' + ribbon.colour + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
      s += '<path d="M' + (cx - 14) + ' ' + (tieY - 2) + 'q14 10 28 0q-14 12-28 0z" fill="' + ribbon.colour + '" opacity=".9"/>';
    }

    // card
    if (hasCard) {
      s += '<g transform="translate(' + (cx + 52) + ' ' + (tieY - 16) + ') rotate(8)">';
      s += '<rect x="0" y="0" width="76" height="46" fill="#fdf9f2" stroke="#231b1b" stroke-width=".9"/>';
      s += '<path d="M8 13h44M8 21h52M8 29h38M8 37h30" stroke="#8a776c" stroke-width="1"/>';
      s += '<path d="M0 0c-14-8-22-18-18-24" stroke="' + (ribbon.colour || '#6d2230') + '" stroke-width="1" fill="none"/>';
      s += '</g>';
    }

    // ground shadow
    s += '<ellipse cx="' + cx + '" cy="' + (H - 8) + '" rx="' + (botW + 26) + '" ry="7" fill="#2f4632" opacity=".12"/>';
    s += '<text x="16" y="18" font-family="Figtree, sans-serif" font-size="8.5" fill="#8a776c" letter-spacing="1.4">HAND-TIED · KOLKATA</text>';
    s += '</svg>';
    return s;
  }

  function roz(n) { return '₹' + n.toLocaleString('en-IN'); }

  function update() {
    if (!form) return;
    var rose = ROSES[form.variety.value];
    var n = Number(form.querySelector('input[name="stems"]:checked').value);
    var green = GREENS[form.green.value];
    var wrap = WRAPS[form.wrap.value];
    var ribbon = RIBBONS[form.ribbon.value];
    var area = AREAS[form.area.value];
    var card = form.card.value === 'written' ? 30 : 0;
    var hasCard = card > 0;

    if (stage) stage.innerHTML = drawBunch(n, rose, form.green.value, form.wrap.value, form.ribbon.value, hasCard);

    var labour = 120 + n * 4;
    var total = n * rose.rate + green.cost + wrap.cost + ribbon.cost + card + area.cost + labour;
    var height = rose.stem + 7;
    var weight = Math.round((0.3 + n * 0.09) * 10) / 10;

    if (elTitle) elTitle.textContent = n + ' ' + rose.name;
    if (elStems) elStems.textContent = n;
    if (elLife) elLife.innerHTML = rose.life + ' <small>days</small>';
    if (elHeight) elHeight.innerHTML = height + ' <small>cm</small>';
    if (elWeight) elWeight.innerHTML = weight.toFixed(1) + ' <small>kg</small>';
    if (elPrice) elPrice.innerHTML = roz(total) + '<small>with ' + (area.cost ? 'delivery to ' + area.label : 'collection') + ', GST included</small>';
    if (elLine) {
      var line = 'Cut-off 14:00 today for delivery between ' + area.window + ' in ' + area.label + '.';
      if (form.area.value === 'pickup') line = 'Collect from the counter until 21:00, or tomorrow from 07:00. Bring a vase with water.';
      if (n >= 50) line += ' Fifty stems needs a day’s notice, not an afternoon.';
      elLine.innerHTML = '<b>' + line + '</b> Vase life ' + rose.life + ' days with the water changed every second day.';
    }
  }

  if (form) {
    ['input', 'change'].forEach(function (ev) { form.addEventListener(ev, update); });
    form.addEventListener('submit', function (e) { e.preventDefault(); update(); });
    update();
  }

  /* contact */
  function niceDate(v) {
    if (!v) return '';
    var d = new Date(v + 'T00:00:00');
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  var cform = document.getElementById('contactForm');
  if (cform) {
    var status = document.getElementById('formStatus');
    var ok = document.getElementById('formOk');
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = cform.elements.name.value.trim();
      var email = cform.elements.email.value.trim();
      var phone = cform.elements.phone.value.trim();
      var date = cform.elements.date.value;
      var msg = cform.elements.message.value.trim();
      var err = '';
      if (name.length < 2) err = 'Please add your name.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err = 'That email address looks incomplete.';
      else if (!/^[0-9+\s-]{8,}$/.test(phone)) err = 'A phone number helps on the fourteenth.';
      else if (!date) err = 'Please choose the delivery date.';
      else if (msg.length < 12) err = 'Tell me what the bunch is for.';
      if (err) {
        status.textContent = err;
        status.classList.remove('ok');
        ok.classList.remove('show');
        return;
      }
      status.textContent = 'Noted. The shop will confirm by phone.';
      status.classList.add('ok');
      ok.classList.add('show');
      ok.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your order is written in the book for ' + niceDate(date) + '. I will call to confirm the stems and the address, and nothing is charged until you have spoken to me.';
      cform.reset();
    });
  }
})();
