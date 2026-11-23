// Ribbon Dress — dirndl fit sheet, parametric drawing, navigation.
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

  /* ---------- fit & cut ---------- */
  var CLOTH = {
    cotton: { label: 'printed cotton', rate: 24, base: 640, fill: '#dfe7dd', line: '#5d7a63', pattern: 'gingham' },
    linen: { label: 'linen', rate: 32, base: 700, fill: '#e7ddc9', line: '#a08453', pattern: 'weave' },
    silk: { label: 'silk dupion', rate: 58, base: 1260, fill: '#c98a91', line: '#8e4a54', pattern: 'silk' },
    wool: { label: 'light wool', rate: 44, base: 760, fill: '#66755f', line: '#39463a', pattern: 'herring' },
    taffeta: { label: 'taffeta', rate: 38, base: 820, fill: '#886a7c', line: '#5c4553', pattern: 'taffeta' }
  };
  var STYLE = {
    traditional: { label: 'traditional', fullness: 2.2, skirt: 70, extra: 0, bodice: 38 },
    trapeze: { label: 'trapeze', fullness: 1.75, skirt: 62, extra: 0, bodice: 37 },
    midi: { label: 'midi', fullness: 2.05, skirt: 76, extra: 60, bodice: 38 },
    highneck: { label: 'high-neck', fullness: 2.15, skirt: 70, extra: 40, bodice: 40 }
  };
  var APRON = { short: 0.56, knee: 0.82, long: 0.98 };

  var form = document.getElementById('fitForm');
  var stage = document.getElementById('stageFigure');
  var outSize = document.getElementById('outSize');
  var outCloth = document.getElementById('outCloth');
  var outRibbon = document.getElementById('outRibbon');
  var outWeeks = document.getElementById('outWeeks');
  var outPrice = document.getElementById('outPrice');
  var outNotes = document.getElementById('outNotes');

  function r1(n) { return Math.round(n * 10) / 10; }

  function styleOf(key) { return STYLE[key] || STYLE.traditional; }

  function drawDress(bust, waist, hip, height, styleKey, apronKey, clothKey) {
    var st = styleOf(styleKey), cl = CLOTH[clothKey] || CLOTH.cotton;
    var hr = height / 168;
    var bodiceCm = st.bodice * hr;
    var skirtCm = st.skirt * hr;
    var totalCm = bodiceCm + skirtCm;
    var scale = 350 / totalCm;
    var cx = 190, top = 58;
    var waistY = top + bodiceCm * scale;
    var hemY = waistY + skirtCm * scale;

    var bustHalf = bust * 0.225 * scale;
    var waistHalf = Math.max(32, waist * 0.215 * scale);
    var hemHalf = hip * st.fullness / Math.PI / 2 * scale * 1.05;
    var apronHalf = waistHalf * 1.1;
    var apronY = waistY + skirtCm * scale * APRON[apronKey];

    var s = '<svg viewBox="0 0 380 470" role="img" aria-label="Dirndl drafted for a ' + bust + ' cm bust, ' + waist + ' cm waist and ' + hip + ' cm hip, in ' + cl.label + '">';
    s += '<defs><clipPath id="dressClip"><path d="M' + (cx - bustHalf) + ' ' + top +
      'C' + (cx - bustHalf - 6) + ' ' + (top + bodiceCm * scale * 0.55) + ' ' + (cx - waistHalf - 4) + ' ' + (waistY - 18) + ' ' + (cx - waistHalf) + ' ' + waistY +
      'H' + (cx + waistHalf) + 'C' + (cx + waistHalf + 4) + ' ' + (waistY - 18) + ' ' + (cx + bustHalf + 6) + ' ' + (top + bodiceCm * scale * 0.55) + ' ' + (cx + bustHalf) + ' ' + top + 'Z"/>' +
      '<path d="M' + (cx - waistHalf) + ' ' + waistY + 'H' + (cx + waistHalf) + 'L' + (cx + hemHalf) + ' ' + hemY + 'Q' + cx + ' ' + (hemY + 9) + ' ' + (cx - hemHalf) + ' ' + hemY + 'Z"/></clipPath>' +
      (clothKey === 'silk' ? '<linearGradient id="silkG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d69ba1"/><stop offset=".45" stop-color="#b86e78"/><stop offset=".7" stop-color="#d8a8ae"/><stop offset="1" stop-color="#a45f6a"/></linearGradient>' : '') +
      (clothKey === 'taffeta' ? '<linearGradient id="tafG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f5566"/><stop offset=".35" stop-color="#a17f92"/><stop offset=".6" stop-color="#6f5566"/><stop offset=".85" stop-color="#957387"/></linearGradient>' : '') +
      '</defs>';

    // blouse sleeves
    s += '<g fill="#f8f4e9" stroke="#20251f" stroke-width="1">';
    s += '<ellipse cx="' + (cx - bustHalf + 6) + '" cy="' + (top + 22) + '" rx="' + (bustHalf * 0.32) + '" ry="' + (bustHalf * 0.26) + '"/>';
    s += '<ellipse cx="' + (cx + bustHalf - 6) + '" cy="' + (top + 22) + '" rx="' + (bustHalf * 0.32) + '" ry="' + (bustHalf * 0.26) + '"/>';
    s += '</g>';
    s += '<path d="M' + (cx - bustHalf * 0.55) + ' ' + top + 'q' + (bustHalf * 0.55) + ' 24 ' + (bustHalf * 1.1) + ' 0" fill="none" stroke="#20251f" stroke-width="1"/>';

    // skirt (behind apron)
    var skirtFill = clothKey === 'silk' ? 'url(#silkG)' : clothKey === 'taffeta' ? 'url(#tafG)' : cl.fill;
    s += '<path d="M' + (cx - waistHalf) + ' ' + waistY + 'H' + (cx + waistHalf) + 'L' + (cx + hemHalf) + ' ' + hemY + 'Q' + cx + ' ' + (hemY + 9) + ' ' + (cx - hemHalf) + ' ' + hemY + 'Z" fill="' + skirtFill + '" stroke="#20251f" stroke-width="1.4"/>';

    // bodice
    s += '<path d="M' + (cx - bustHalf) + ' ' + top +
      'C' + (cx - bustHalf - 6) + ' ' + (top + bodiceCm * scale * 0.55) + ' ' + (cx - waistHalf - 4) + ' ' + (waistY - 18) + ' ' + (cx - waistHalf) + ' ' + waistY +
      'H' + (cx + waistHalf) + 'C' + (cx + waistHalf + 4) + ' ' + (waistY - 18) + ' ' + (cx + bustHalf + 6) + ' ' + (top + bodiceCm * scale * 0.55) + ' ' + (cx + bustHalf) + ' ' + top +
      'Q' + cx + ' ' + (top + 26) + ' ' + (cx - bustHalf) + ' ' + top + 'Z" fill="' + skirtFill + '" stroke="#20251f" stroke-width="1.4"/>';

    // cloth pattern clipped
    s += '<g clip-path="url(#dressClip)" opacity=".55">';
    if (cl.pattern === 'gingham') {
      var g = '';
      for (var x = cx - hemHalf; x < cx + hemHalf; x += 9) g += 'M' + x + ' ' + top + 'v' + (hemY - top);
      for (var y = top; y < hemY; y += 9) g += 'M' + (cx - hemHalf) + ' ' + y + 'h' + (hemHalf * 2);
      s += '<path d="' + g + '" stroke="' + cl.line + '" stroke-width="1" opacity=".4"/>';
    } else if (cl.pattern === 'weave') {
      var w = '';
      for (var y2 = top; y2 < hemY; y2 += 4) w += 'M' + (cx - hemHalf) + ' ' + y2 + 'h' + (hemHalf * 2);
      for (var x2 = cx - hemHalf; x2 < cx + hemHalf; x2 += 4) w += 'M' + x2 + ' ' + top + 'v' + (hemY - top);
      s += '<path d="' + w + '" stroke="' + cl.line + '" stroke-width=".5" opacity=".35"/>';
    } else if (cl.pattern === 'silk') {
      s += '<path d="M' + (cx - hemHalf) + ' ' + top + 'L' + (cx + hemHalf * 0.2) + ' ' + hemY + 'M' + (cx - hemHalf * 0.4) + ' ' + top + 'L' + (cx + hemHalf * 0.8) + ' ' + hemY + '" stroke="#f0c9cd" stroke-width="10" opacity=".22"/>';
    } else if (cl.pattern === 'herring') {
      var h = '';
      for (var yy = top; yy < hemY; yy += 7) {
        h += 'M' + (cx - hemHalf) + ' ' + yy + 'l8 -4 8 4 8 -4 8 4 8 -4 8 4 8 -4 8 4 8 -4 8 4 8 -4 8 4';
      }
      s += '<path d="' + h + '" stroke="' + cl.line + '" stroke-width=".9" opacity=".4" fill="none"/>';
    } else {
      s += '<path d="M' + (cx - hemHalf) + ' ' + (top + 40) + 'Q' + cx + ' ' + (top + 60) + ' ' + (cx + hemHalf) + ' ' + (top + 40) + 'M' + (cx - hemHalf) + ' ' + (waistY + 40) + 'Q' + cx + ' ' + (waistY + 70) + ' ' + (cx + hemHalf) + ' ' + (waistY + 40) + '" stroke="#f5dfe6" stroke-width="14" opacity=".22" fill="none"/>';
    }
    s += '</g>';

    // skirt pleats
    var pl = '';
    for (var p = 1; p <= 5; p++) {
      var t = p / 6;
      pl += 'M' + (cx - waistHalf + waistHalf * 2 * t) + ' ' + (waistY + 2) + 'L' + (cx - hemHalf + hemHalf * 2 * t) + ' ' + (hemY - 2);
    }
    s += '<path d="' + pl + '" stroke="#20251f" stroke-width=".6" opacity=".22"/>';

    // apron
    var apronFill = clothKey === 'taffeta' ? '#e8e1d0' : clothKey === 'silk' ? '#f0e6d6' : clothKey === 'wool' ? '#e3d8c1' : '#f6f0e0';
    s += '<path d="M' + (cx - apronHalf) + ' ' + (waistY + 4) + 'H' + (cx + apronHalf) + 'L' + (cx + apronHalf * 1.18) + ' ' + apronY + 'Q' + cx + ' ' + (apronY + 6) + ' ' + (cx - apronHalf * 1.18) + ' ' + apronY + 'Z" fill="' + apronFill + '" stroke="#20251f" stroke-width="1.3"/>';
    s += '<path d="M' + (cx - apronHalf) + ' ' + (waistY + 4) + 'H' + (cx + apronHalf) + 'L' + (cx + apronHalf * 1.18) + ' ' + apronY + 'Q' + cx + ' ' + (apronY + 6) + ' ' + (cx - apronHalf * 1.18) + ' ' + apronY + 'Z" fill="none" stroke="' + cl.line + '" stroke-width=".7" stroke-dasharray="3 4" opacity=".7"/>';
    // apron ties
    s += '<path d="M' + (cx + apronHalf) + ' ' + (waistY + 8) + 'l20 16M' + (cx - apronHalf) + ' ' + (waistY + 8) + 'l-20 16" stroke="#b56b74" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    s += '<path d="M' + (cx - 8) + ' ' + (waistY + 4) + 'h16v10h-16z" fill="#b56b74" stroke="#8e4a54" stroke-width=".8"/>';

    // lacing
    var lace = '';
    var lacesTop = top + 16, lacesBot = waistY - 10, lacesN = 5;
    for (var i = 0; i < lacesN; i++) {
      var ya = lacesTop + (lacesBot - lacesTop) * (i / lacesN);
      var yb = lacesTop + (lacesBot - lacesTop) * ((i + 1) / lacesN);
      lace += 'M' + (cx - 11) + ' ' + ya + 'L' + (cx + 11) + ' ' + yb + 'M' + (cx + 11) + ' ' + ya + 'L' + (cx - 11) + ' ' + yb;
    }
    s += '<path d="' + lace + '" stroke="#8e4a54" stroke-width="1.6" fill="none"/>';

    // neckline
    s += '<path d="M' + (cx - bustHalf * 0.62) + ' ' + top + 'q' + (bustHalf * 0.62) + ' 30 ' + (bustHalf * 1.24) + ' 0" fill="#f8f4e9" stroke="#20251f" stroke-width="1.2"/>';
    if (styleKey === 'highneck') {
      s += '<path d="M' + (cx - bustHalf * 0.55) + ' ' + (top + 2) + 'q' + (bustHalf * 0.55) + ' -18 ' + (bustHalf * 1.1) + ' 0" fill="none" stroke="#20251f" stroke-width="1.1"/>';
    }

    // hem stitch
    s += '<path d="M' + (cx - hemHalf + 4) + ' ' + (hemY - 5) + 'Q' + cx + ' ' + (hemY + 5) + ' ' + (cx + hemHalf - 4) + ' ' + (hemY - 5) + '" stroke="#f8f4e9" stroke-width="1.4" stroke-dasharray="4 4" fill="none" opacity=".8"/>';

    // measurement marks: bust / waist / hip
    s += '<g stroke="#7d94a2" stroke-width=".9" fill="none">';
    s += '<path d="M' + (cx - bustHalf - 18) + ' ' + (top + 14) + 'h' + (bustHalf * 2 + 36) + '" stroke-dasharray="2 4"/>';
    s += '<path d="M' + (cx - waistHalf - 22) + ' ' + waistY + 'h' + (waistHalf * 2 + 44) + '" stroke-dasharray="2 4"/>';
    s += '<path d="M' + (cx - hemHalf - 6) + ' ' + (waistY + (hemY - waistY) * 0.22) + 'h' + (hemHalf * 2 + 12) + '" stroke-dasharray="2 4" opacity=".7"/>';
    s += '<path d="M28 ' + (top + 10) + 'v' + (bodiceCm * scale) + '" stroke-width="1.1"/>';
    s += '<path d="M24 ' + (top + 10) + 'h8M24 ' + waistY + 'h8" stroke-width="1.1"/>';
    s += '</g>';
    s += '<g font-family="Jost, sans-serif" font-size="9" fill="#4c5148" letter-spacing=".6">';
    s += '<text x="' + (cx - bustHalf - 44) + '" y="' + (top + 10) + '">' + bust + '</text>';
    s += '<text x="' + (cx - waistHalf - 44) + '" y="' + (waistY - 3) + '">' + waist + '</text>';
    s += '<text x="' + (cx + hemHalf + 8) + '" y="' + (waistY + (hemY - waistY) * 0.22 + 4) + '">' + hip + '</text>';
    s += '<text x="34" y="' + (top + 6) + '">' + Math.round(bodiceCm) + ' cm</text>';
    s += '<text x="' + (cx - 14) + ' ' + (hemY + 26) + '" font-size="8.5" fill="#7c8176">' + height + ' cm · ' + styleOf(styleKey).label + '</text>';
    s += '</g>';
    s += '</svg>';
    return s;
  }

  function update() {
    if (!form) return;
    var bust = Number(form.bust.value) || 92;
    var waist = Number(form.waist.value) || 74;
    var hip = Number(form.hip.value) || 100;
    var height = Number(form.height.value) || 168;
    bust = Math.min(140, Math.max(70, bust));
    waist = Math.min(130, Math.max(55, waist));
    hip = Math.min(150, Math.max(75, hip));
    height = Math.min(200, Math.max(140, height));

    var st = styleOf(form.style.value);
    var cl = CLOTH[form.cloth.value] || CLOTH.cotton;
    var size = Math.min(48, Math.max(32, 36 + Math.round((bust - 84) / 4) * 2));
    var stdBust = 2 * size + 12, stdWaist = 2 * size - 4, stdHip = 2 * size + 19;

    var hr = height / 168;
    var skirtCm = st.skirt * hr;
    var totalWidth = hip * st.fullness + 16;
    var panels = Math.max(2, Math.ceil(totalWidth / 148));
    var skirtM = panels * skirtCm / 100;
    var metres = r1(skirtM + 0.65 + 0.6 + 0.75);
    var ribbon = r1((hip * 2.6 + 120) / 100);
    var weeks = 5 + (form.cloth.value === 'silk' ? 2 : 0) + (st.label === 'midi' ? 1 : 0) + (bust > 106 ? 1 : 0);
    var price = Math.round((cl.base + metres * cl.rate + st.extra) / 10) * 10;

    if (stage) stage.innerHTML = drawDress(bust, waist, hip, height, form.style.value, form.apron.value, form.cloth.value);
    if (outSize) outSize.textContent = 'Gr. ' + size;
    if (outCloth) outCloth.innerHTML = metres.toFixed(1) + ' <small>m, ' + panels + ' panels</small>';
    if (outRibbon) outRibbon.innerHTML = ribbon.toFixed(1) + ' <small>m, apron and lacing</small>';
    if (outWeeks) outWeeks.innerHTML = weeks + ' <small>weeks</small>';
    if (outPrice) outPrice.innerHTML = '€' + price.toLocaleString('en-GB') + '<small>' + cl.label + ', two fittings included</small>';

    var notes = [];
    if (waist > stdWaist + 3) notes.push('<b>Waist, ' + waist + ' cm:</b> ' + (waist - stdWaist) + ' cm over the standard for Gr. ' + size + '. The side seams get 2 cm and the back lacing stays functional, not decorative.');
    else if (waist < stdWaist - 4) notes.push('<b>Waist, ' + waist + ' cm:</b> taken in 2 cm at the side seams, with the lacing left working so it can be let out again.');
    if (bust - waist > 26) notes.push('<b>Bust to waist:</b> a ' + (bust - waist) + ' cm difference needs a full bust adjustment; the princess seam moves 2 cm toward the armhole.');
    if (hip - bust > 12) notes.push('<b>Hip, ' + hip + ' cm:</b> one extra skirt panel and a wider apron, or the gathers pull at the side.');
    if (height < 160) notes.push('<b>Height, ' + height + ' cm:</b> the skirt is shortened 4 cm at the hem, not at the waist, so the pockets stay in reach.');
    if (height > 178) notes.push('<b>Height, ' + height + ' cm:</b> the bodice is lengthened 3 cm, or the waist seam will ride high when you sit.');
    if (!notes.length) notes.push('<b>Close to the standard block:</b> the pattern needs only the usual 1.5 cm seam allowance and no adjustment above the waist.');
    notes.push('<b>Bring:</b> the bra and shoes you will wear, and the apron length you can walk in. Both change the fit more than a centimetre on paper suggests.');
    if (outNotes) outNotes.innerHTML = notes.slice(0, 3).map(function (n) { return '<span style="display:block;margin-bottom:5px">' + n + '</span>'; }).join('');
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
      var date = cform.elements.date.value;
      var msg = cform.elements.message.value.trim();
      var err = '';
      if (name.length < 2) err = 'Please add your name.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err = 'That email address looks incomplete.';
      else if (!date) err = 'Please choose a date you would like to come.';
      else if (msg.length < 12) err = 'Tell me what the dirndl is for.';
      if (err) {
        status.textContent = err;
        status.classList.remove('ok');
        ok.classList.remove('show');
        return;
      }
      status.textContent = 'Request noted. I answer on weekday evenings.';
      status.classList.add('ok');
      ok.classList.add('show');
      ok.textContent = 'Danke, ' + name.split(' ')[0] + '. I have your request for ' + niceDate(date) + ' and will confirm a time within two working days. Bring the bra and shoes you will wear; the first appointment takes about 45 minutes.';
      cform.reset();
    });
  }
})();
