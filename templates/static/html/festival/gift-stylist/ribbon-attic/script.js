// Ribbon Attic — wrapping table, navigation, contact form.
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
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- the wrapping table ---------- */
  var OBJECTS = {
    book: { label: 'Hardback book', l: 24, w: 16, h: 4, paper: [59, 27], extra: 0 },
    bottle: { label: 'Wine bottle', l: 10, w: 10, h: 32, paper: [44, 56], extra: 3, cylinder: true },
    scarf: { label: 'Folded scarf', l: 30, w: 22, h: 6, paper: [75, 37], extra: 1 },
    box: { label: 'Jewellery box', l: 12, w: 12, h: 5, paper: [37, 25], extra: 0 },
    hamper: { label: 'Hamper', l: 40, w: 30, h: 20, paper: [123, 73], extra: 4 },
    record: { label: 'Vinyl record', l: 32, w: 32, h: 1, paper: [69, 37], extra: 3 }
  };
  var PAPERS = {
    kraft: { label: 'kraft', rate: 2.2, fill: 'url(#pgKraft)', edge: '#8a7252', pattern: 'fleck' },
    tissue: { label: 'tissue', rate: 3.1, fill: 'url(#pgTissue)', edge: '#c5a294', pattern: 'sheen' },
    print: { label: 'printed', rate: 4.4, fill: 'url(#pgPrint)', edge: '#75836a', pattern: 'leaf' },
    linen: { label: 'linen', rate: 5.6, fill: 'url(#pgLinen)', edge: '#a08e70', pattern: 'weave' }
  };
  var RIBBONS = {
    satin: { label: 'satin', rate: 1.9, colour: '#a33c31', dark: '#6e241e', light: '#c25a4d' },
    grosgrain: { label: 'grosgrain', rate: 2.4, colour: '#2c4a3c', dark: '#16281f', light: '#47735d' },
    velvet: { label: 'velvet', rate: 3.8, colour: '#b0863c', dark: '#775823', light: '#c9a25b' },
    twine: { label: 'twine', rate: 0.5, colour: '#8a6a4f', dark: '#5f4634', light: '#ab8a6a' }
  };
  var BOWS = { classic: { label: 'classic bow', min: 4, allow: 40 }, double: { label: 'double bow', min: 6, allow: 70 }, pom: { label: 'pom-pom', min: 5, allow: 25 }, knot: { label: 'plain knot', min: 1, allow: 10 } };
  var TAGS = { love: 'With love', birthday: 'Happy birthday', danke: 'Danke', xmas: 'Frohe Weihnachten', none: '' };

  var form = document.getElementById('wrapForm');
  var stage = document.getElementById('stageCanvas');
  var outSheet = document.getElementById('outSheet');
  var outRibbon = document.getElementById('outRibbon');
  var outTime = document.getElementById('outTime');
  var outPrice = document.getElementById('outPrice');
  var outPlan = document.getElementById('outPlan');
  var stageTag = document.getElementById('stageTag');

  function num(n) { return Math.round(n * 10) / 10; }

  function ribbonLength(o, bow) {
    if (o.cylinder) return num((Math.PI * o.l + 2 * (o.h + o.l)) / 100 + bow.allow / 100);
    return num((2 * (o.l + o.h) + 2 * (o.w + o.h) + bow.allow) / 100);
  }

  function buildSVG(o, paper, ribbon, bowKey, tagText) {
    var W = 420, H = 330;
    var scale = Math.min(8.2, 320 / (o.l + o.w * 0.62), 180 / Math.max(o.h, 6));
    var fw = o.l * scale;
    var fh = Math.max(34, o.h * scale);
    if (o.cylinder) { fw = 92; fh = 196; scale = 5.6; }
    var dx = Math.min(80, o.w * scale * 0.55 + 16);
    var dy = dx * 0.52;
    var X = (W - (fw + dx)) / 2 + 4;
    var Y = 286 - fh;
    var rw = Math.max(10, Math.min(22, fw * 0.1));
    var bow = BOWS[bowKey];

    var defs = '<defs>' +
      '<linearGradient id="pgKraft" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#e2cfa9"/><stop offset="1" stop-color="#c7ad84"/></linearGradient>' +
      '<linearGradient id="pgTissue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8eee5"/><stop offset=".55" stop-color="#efe0d3"/><stop offset="1" stop-color="#e6d2c4"/></linearGradient>' +
      '<linearGradient id="pgPrint" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#f4eeda"/><stop offset="1" stop-color="#e6dcc0"/></linearGradient>' +
      '<linearGradient id="pgLinen" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#ece1c9"/><stop offset="1" stop-color="#d9caab"/></linearGradient>' +
      '<linearGradient id="ribG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + ribbon.dark + '"/><stop offset=".45" stop-color="' + ribbon.colour + '"/><stop offset="1" stop-color="' + ribbon.dark + '"/></linearGradient>' +
      '</defs>';

    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="A ' + paper.label + ' paper parcel tied with ' + ribbon.label + ' ribbon and a ' + bow.label + '">' + defs;

    // shadow
    s += '<ellipse cx="' + (X + (fw + dx) / 2) + '" cy="' + (Y + fh + 8) + '" rx="' + (fw * 0.62 + dx * 0.4) + '" ry="9" fill="#211f1b" opacity=".12"/>';
    s += '<path d="M' + (X - 20) + ' ' + (Y + fh + 10) + 'h' + (fw + dx + 40) + '" stroke="#211f1b" stroke-width="1" opacity=".3"/>';

    // side face
    s += '<path d="M' + (X + fw) + ' ' + Y + 'L' + (X + fw + dx) + ' ' + (Y - dy) + 'L' + (X + fw + dx) + ' ' + (Y + fh - dy) + 'L' + (X + fw) + ' ' + (Y + fh) + 'Z" fill="' + paper.fill + '" stroke="' + paper.edge + '" stroke-width="1.1"/>';
    s += '<path d="M' + (X + fw) + ' ' + Y + 'L' + (X + fw + dx) + ' ' + (Y - dy) + 'L' + (X + fw + dx) + ' ' + (Y + fh - dy) + 'L' + (X + fw) + ' ' + (Y + fh) + 'Z" fill="#211f1b" opacity=".1"/>';

    // front face
    s += '<rect x="' + X + '" y="' + Y + '" width="' + fw + '" height="' + fh + '" fill="' + paper.fill + '" stroke="' + paper.edge + '" stroke-width="1.1"/>';

    // top face
    s += '<path d="M' + X + ' ' + Y + 'L' + (X + dx) + ' ' + (Y - dy) + 'L' + (X + fw + dx) + ' ' + (Y - dy) + 'L' + (X + fw) + ' ' + Y + 'Z" fill="' + paper.fill + '" stroke="' + paper.edge + '" stroke-width="1.1" opacity=".97"/>';
    s += '<path d="M' + X + ' ' + Y + 'L' + (X + dx) + ' ' + (Y - dy) + 'L' + (X + fw + dx) + ' ' + (Y - dy) + 'L' + (X + fw) + ' ' + Y + 'Z" fill="#fff" opacity=".16"/>';

    // paper pattern
    var i;
    if (paper.pattern === 'fleck') {
      var flecks = '';
      for (i = 0; i < 26; i++) {
        var fx = X + 6 + ((i * 37) % Math.max(10, fw - 12));
        var fy = Y + 8 + ((i * 53) % Math.max(10, fh - 16));
        flecks += '<circle cx="' + fx.toFixed(1) + '" cy="' + fy.toFixed(1) + '" r="' + (i % 3 === 0 ? 1.1 : 0.7) + '" fill="' + paper.edge + '" opacity=".5"/>';
      }
      s += flecks;
    } else if (paper.pattern === 'linen') {
      var weave = '';
      for (i = 4; i < fh; i += 5) weave += 'M' + X + ' ' + (Y + i) + 'h' + fw;
      for (i = 6; i < fw; i += 6) weave += 'M' + (X + i) + ' ' + Y + 'v' + fh;
      s += '<path d="' + weave + '" stroke="' + paper.edge + '" stroke-width=".45" opacity=".4" fill="none"/>';
    } else if (paper.pattern === 'leaf') {
      var leaves = '';
      for (i = 0; i < 10; i++) {
        var lx = X + 14 + ((i * 41) % Math.max(20, fw - 28));
        var ly = Y + 16 + ((i * 61) % Math.max(20, fh - 32));
        leaves += '<g transform="translate(' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ') rotate(' + ((i * 47) % 180) + ')" opacity=".55">' +
          '<path d="M0 0c8-8 16-8 20 0-6 8-14 8-20 0z" fill="none" stroke="' + paper.edge + '" stroke-width=".9"/>' +
          '<path d="M0 0h19" stroke="' + paper.edge + '" stroke-width=".6"/></g>';
      }
      s += leaves;
    } else {
      s += '<path d="M' + (X + 10) + ' ' + (Y + 12) + 'L' + (X + fw - 8) + ' ' + (Y + fh - 10) + 'M' + (X + fw - 20) + ' ' + (Y + 10) + 'L' + (X + 10) + ' ' + (Y + fh - 14) + '" stroke="#fff" stroke-width="14" opacity=".22"/>';
    }

    // vertical ribbon over front and top
    s += '<path d="M' + (X + fw / 2 - rw / 2) + ' ' + Y + 'L' + (X + fw / 2 + rw / 2) + ' ' + Y + 'L' + (X + fw / 2 + rw / 2 + dx) + ' ' + (Y - dy) + 'L' + (X + fw / 2 - rw / 2 + dx) + ' ' + (Y - dy) + 'Z" fill="url(#ribG)" stroke="' + ribbon.dark + '" stroke-width=".7"/>';
    s += '<rect x="' + (X + fw / 2 - rw / 2) + '" y="' + Y + '" width="' + rw + '" height="' + fh + '" fill="url(#ribG)" stroke="' + ribbon.dark + '" stroke-width=".7"/>';
    // horizontal band across front and side
    var hy = Y + fh * 0.62;
    s += '<rect x="' + X + '" y="' + hy + '" width="' + fw + '" height="' + rw + '" fill="url(#ribG)" stroke="' + ribbon.dark + '" stroke-width=".7"/>';
    s += '<path d="M' + (X + fw) + ' ' + hy + 'L' + (X + fw + dx) + ' ' + (hy - dy) + 'L' + (X + fw + dx) + ' ' + (hy + rw - dy) + 'L' + (X + fw) + ' ' + (hy + rw) + 'Z" fill="url(#ribG)" stroke="' + ribbon.dark + '" stroke-width=".7" opacity=".92"/>';

    // fold creases at the paper edges
    s += '<path d="M' + (X + 2) + ' ' + Y + 'v' + fh + 'M' + (X + fw - 2) + ' ' + Y + 'v' + fh + '" stroke="#211f1b" stroke-width=".5" opacity=".18" stroke-dasharray="3 4"/>';

    // bow
    var bx = X + fw / 2 + dx * 0.5;
    var by = Y - dy * 0.5;
    var bs = Math.max(0.7, Math.min(1.15, fw / 180));
    s += '<g transform="translate(' + bx + ' ' + by + ') scale(' + bs + ')">';
    if (bowKey === 'classic' || bowKey === 'double') {
      s += '<path d="M0 0c-26-22-44-4-32 8s30 4 32-8z" fill="url(#ribG)" stroke="' + ribbon.dark + '" stroke-width="1"/>';
      s += '<path d="M0 0c26-22 44-4 32 8s-30 4-32-8z" fill="url(#ribG)" stroke="' + ribbon.dark + '" stroke-width="1"/>';
      if (bowKey === 'double') {
        s += '<path d="M0 2c-20-26-38-14-28 2s24 12 28-2z" fill="' + ribbon.light + '" stroke="' + ribbon.dark + '" stroke-width=".8" opacity=".9"/>';
        s += '<path d="M0 2c20-26 38-14 28 2s-24 12-28-2z" fill="' + ribbon.light + '" stroke="' + ribbon.dark + '" stroke-width=".8" opacity=".9"/>';
      }
      s += '<path d="M-4 14c-10 16-18 28-10 30s16-14 18-26M4 14c10 16 18 28 10 30s-16-14-18-26" fill="none" stroke="' + ribbon.dark + '" stroke-width="3.4" stroke-linecap="round"/>';
      s += '<circle cx="0" cy="2" r="5.4" fill="' + ribbon.dark + '"/>';
    } else if (bowKey === 'pom') {
      for (i = 0; i < 10; i++) {
        var a = (i / 10) * Math.PI * 2;
        s += '<ellipse cx="' + (Math.cos(a) * 13).toFixed(1) + '" cy="' + (Math.sin(a) * 9).toFixed(1) + '" rx="9" ry="5" fill="' + (i % 2 ? ribbon.light : ribbon.colour) + '" stroke="' + ribbon.dark + '" stroke-width=".7" transform="rotate(' + (a * 57.3).toFixed(0) + ')"/>';
      }
      s += '<circle cx="0" cy="0" r="6" fill="' + ribbon.dark + '"/>';
    } else {
      s += '<path d="M-10 2c6-8 14-8 20 0-8 7-14 7-20 0z" fill="' + ribbon.colour + '" stroke="' + ribbon.dark + '" stroke-width="1"/>';
      s += '<path d="M-8 6c-4 12-8 18-2 20M8 6c4 12 8 18 2 20" fill="none" stroke="' + ribbon.dark + '" stroke-width="2.6" stroke-linecap="round"/>';
    }
    s += '</g>';

    // tag
    if (tagText) {
      var tagW = Math.max(46, tagText.length * 4.6 + 14);
      var tx = X + fw - tagW * 0.62;
      var ty = Y + 16;
      s += '<g transform="translate(' + tx + ' ' + ty + ') rotate(7)">';
      s += '<path d="M0 6c-14-2-22-14-18-22" stroke="' + ribbon.dark + '" stroke-width="1.2" fill="none"/>';
      s += '<rect x="0" y="0" width="' + tagW + '" height="26" fill="#f7f2e6" stroke="#211f1b" stroke-width="1"/>';
      s += '<path d="M0 6h' + tagW + '" stroke="#d9c6a4" stroke-width="3"/>';
      s += '<circle cx="5" cy="15" r="1.6" fill="none" stroke="#7d7566"/>';
      s += '<text x="12" y="18" font-family="Karla, sans-serif" font-size="7.5" fill="#504a40" letter-spacing=".3">' + tagText.toUpperCase() + '</text>';
      s += '</g>';
    }

    // small marks
    s += '<g font-family="Karla, sans-serif" font-size="9" fill="#7d7566" letter-spacing="1"><text x="18" y="316">HAND-WRAPPED, NEUBAUGASSE</text><text x="330" y="316">1 : 8</text></g>';
    s += '</svg>';
    return s;
  }

  function update() {
    if (!form) return;
    var o = OBJECTS[form.object.value];
    var paper = PAPERS[form.paper.value];
    var ribbon = RIBBONS[form.ribbon.value];
    var bow = BOWS[form.bow.value];
    var tagText = TAGS[form.occasion.value];

    if (stage) stage.innerHTML = buildSVG(o, paper, ribbon, form.bow.value, tagText);

    var sheetW = o.paper[0], sheetH = o.paper[1];
    var rib = ribbonLength(o, bow);
    var minutes = 8 + bow.min + (o.extra || 0) + (form.ribbon.value === 'twine' ? 2 : 0);
    var areaM2 = (sheetW * sheetH) / 10000;
    var paperCost = areaM2 * paper.rate * 1.2;
    var ribbonCost = rib * ribbon.rate * (form.ribbon.value === 'twine' ? 0.6 : 1);
    var bowCost = bow.min * 0.6;
    var labour = 5.4 + minutes * 0.16;
    var total = Math.round((paperCost + ribbonCost + bowCost + labour) * 10) / 10;

    if (outSheet) outSheet.innerHTML = sheetW + ' × ' + sheetH + ' <small>cm</small>';
    if (outRibbon) outRibbon.innerHTML = rib.toFixed(2) + ' <small>m</small>';
    if (outTime) outTime.innerHTML = minutes + ' <small>min</small>';
    if (outPrice) outPrice.innerHTML = '€' + total.toFixed(2) + '<small>one parcel, materials included</small>';
    if (stageTag) stageTag.textContent = o.label + ' · ' + paper.label + ' · ' + ribbon.label;
    if (outPlan) {
      var lines = [
        '<b>Cut</b> ' + sheetW + ' × ' + sheetH + ' cm with 3 cm overlap, grain along the long edge.',
        '<b>Fold</b> a 2 cm hem on both long edges; press with a bone folder, not a fingernail.',
        '<b>Set</b> the ' + o.label.toLowerCase() + ' face down; paper over, tape only paper to paper.',
        '<b>Tie</b> ' + rib.toFixed(2) + ' m of ' + ribbon.label + ' across both ways; cut the ends on the bias.'
      ];
      if (tagText) lines.push('<b>Tag</b> reads “' + tagText + '”, tied to the vertical band.');
      outPlan.innerHTML = lines.map(function (l) { return '<span>' + l + '</span>'; }).join('');
    }
  }

  if (form) {
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
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
      var msg = cform.elements.message.value.trim();
      var date = cform.elements.date.value;
      var err = '';
      if (name.length < 2) err = 'Please add your name.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err = 'That email address looks incomplete.';
      else if (msg.length < 15) err = 'Tell me what is being wrapped, and for when.';
      else if (!date) err = 'Please choose the date it has to be ready.';
      if (err) {
        status.textContent = err;
        status.classList.remove('ok');
        ok.classList.remove('show');
        return;
      }
      status.textContent = 'Logged. A reply comes within one working day.';
      status.classList.add('ok');
      ok.classList.add('show');
      ok.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your order is written in the book for ' + niceDate(date) + '. I will confirm the paper and the ribbon before anything is cut, and nothing is charged until you approve the sample.';
      cform.reset();
    });
  }
})();
