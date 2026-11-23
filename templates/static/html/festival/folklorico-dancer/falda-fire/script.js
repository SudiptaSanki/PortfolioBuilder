/* Falda Fire — skirt workshop and page behaviour. */
(function () {
  'use strict';

  var menuBtn = document.querySelector('.menu-btn');
  var rail = document.getElementById('rail');
  if (menuBtn && rail) {
    menuBtn.addEventListener('click', function () {
      var open = rail.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    rail.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        rail.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.classList.contains('is-open')) {
        rail.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- reveal ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.falda-section, .known, .quote-band, .closing, .page-head, .about-grid, .timeline, .work, .programme, .contact-grid, .faq'));
  if (items.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.94) el.classList.add('reveal');
    });
    var check = function () {
      document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.93) el.classList.add('is-in');
      });
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    check();
    setTimeout(check, 1200);
  }

  /* ---------- falda workshop ---------- */
  var DANCES = {
    jarabe: {
      name: 'Jarabe Tapatío', place: 'Jalisco', hem: 12.5, ribbon: 1.2,
      colors: ['#9e1b2e', '#e8a21a', '#17665a'],
      note: 'China poblana: red and green on the skirt, gold ribbon at the hem. A twelve-metre hem needs two dressers to carry it through a door.'
    },
    bamba: {
      name: 'La Bamba', place: 'Veracruz', hem: 9.5, ribbon: 0.9,
      colors: ['#f7f0e4', '#9e1b2e', '#17665a'],
      note: 'White cotton with red ruffle, worn short enough to show the zapateado. The fan is played fast, in eighths.'
    },
    sinaloense: {
      name: 'El Sinaloense', place: 'Sinaloa', hem: 8, ribbon: 0.7,
      colors: ['#e8a21a', '#9e1b2e', '#1e1412'],
      note: 'A narrower hem and a higher waist. The banda plays it in 6/8 and the skirt answers on the off-beat.'
    },
    machetes: {
      name: 'Los Machetes', place: 'Nayarit', hem: 10, ribbon: 1.0,
      colors: ['#17665a', '#f7f0e4', '#9e1b2e'],
      note: 'Green with cream underskirt. The dance is played with machetes, so the skirt stays below the wrist line.'
    }
  };

  var FABRICS = {
    satin: { label: 'satin', gsm: 180, price: 320, drape: 1.0 },
    silk: { label: 'silk', gsm: 95, price: 780, drape: 1.14 },
    cotton: { label: 'cotton', gsm: 140, price: 220, drape: 0.92 }
  };

  var LENGTHS = {
    short: { label: 'short', drop: 0.62, hemFactor: 0.88 },
    standard: { label: 'standard', drop: 0.82, hemFactor: 1.0 },
    full: { label: 'full', drop: 1.0, hemFactor: 1.1 }
  };

  var PLEATS = {
    accordion: { label: 'accordion', density: 9.5, labour: 6.4 },
    carton: { label: 'cartón', density: 7.2, labour: 8.8 }
  };

  var state = { dance: 'jarabe', fabric: 'satin', length: 'standard', pleat: 'accordion' };
  var fanEl = document.getElementById('skirtFan');
  var ledgerEl = document.getElementById('ledger');
  var nameEl = document.getElementById('skirtName');
  var metaEl = document.getElementById('skirtMeta');

  function money(n) {
    return '$' + Math.round(n).toLocaleString('es-MX');
  }

  function compute() {
    var d = DANCES[state.dance];
    var f = FABRICS[state.fabric];
    var l = LENGTHS[state.length];
    var p = PLEATS[state.pleat];
    var hem = d.hem * l.hemFactor;
    var panels = Math.ceil(hem / 1.5) + 1;
    var cloth = panels * (l.drop + 0.35);
    var pleats = Math.round(hem * p.density / (f.drape * 0.98));
    var ribbon = Math.round(hem * d.ribbon);
    var weight = (cloth * 1.5 * f.gsm) / 1000 + ribbon * 0.018 + 0.35;
    var hours = Math.round((pleats * p.labour + cloth * 22) / 6) / 10;
    var fabricCost = cloth * f.price;
    var trimCost = ribbon * 18 + 650;
    var labour = 4800 + pleats * 9;
    var total = fabricCost + trimCost + labour;
    return { d: d, f: f, l: l, p: p, hem: hem, panels: panels, cloth: cloth, pleats: pleats, ribbon: ribbon, weight: weight, hours: hours, total: total };
  }

  function fanSvg(c) {
    var cx = 210, cy = 64, rOut = 196, rIn = 48;
    var n = Math.max(20, Math.min(52, Math.round(c.pleats / 3)));
    var a0 = Math.PI * 0.1, a1 = Math.PI * 0.9;
    var parts = [];
    parts.push('<defs><linearGradient id="fanFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#000" stop-opacity="0.14"/><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.16"/></linearGradient></defs>');
    parts.push('<rect width="420" height="300" fill="#fbf6ec"/>');
    for (var i = 0; i < n; i++) {
      var b0 = a0 + (a1 - a0) * (i / n);
      var b1 = a0 + (a1 - a0) * ((i + 1) / n);
      var col = c.d.colors[i % c.d.colors.length];
      var xi1 = cx + rIn * Math.cos(b0), yi1 = cy + rIn * Math.sin(b0);
      var xi2 = cx + rIn * Math.cos(b1), yi2 = cy + rIn * Math.sin(b1);
      var xo1 = cx + rOut * Math.cos(b0), yo1 = cy + rOut * Math.sin(b0);
      var xo2 = cx + rOut * Math.cos(b1), yo2 = cy + rOut * Math.sin(b1);
      parts.push('<path class="fanpleat" d="M' + xi1.toFixed(1) + ' ' + yi1.toFixed(1) +
        ' L' + xo1.toFixed(1) + ' ' + yo1.toFixed(1) +
        ' A' + rOut + ' ' + rOut + ' 0 0 1 ' + xo2.toFixed(1) + ' ' + yo2.toFixed(1) +
        ' L' + xi2.toFixed(1) + ' ' + yi2.toFixed(1) +
        ' A' + rIn + ' ' + rIn + ' 0 0 0 ' + xi1.toFixed(1) + ' ' + yi1.toFixed(1) + ' Z" fill="' + col + '" stroke="#1e1412" stroke-width="0.6" stroke-opacity="0.3"/>');
    }
    var hemL = [cx + rOut * Math.cos(a0), cy + rOut * Math.sin(a0)];
    var hemR = [cx + rOut * Math.cos(a1), cy + rOut * Math.sin(a1)];
    parts.push('<path d="M' + hemL[0].toFixed(1) + ' ' + hemL[1].toFixed(1) + ' A' + rOut + ' ' + rOut + ' 0 0 1 ' + hemR[0].toFixed(1) + ' ' + hemR[1].toFixed(1) + '" fill="none" stroke="#1e1412" stroke-width="1.4"/>');
    parts.push('<path d="M' + (cx + rIn * Math.cos(a0)).toFixed(1) + ' ' + (cy + rIn * Math.sin(a0)).toFixed(1) + ' A' + rIn + ' ' + rIn + ' 0 0 1 ' + (cx + rIn * Math.cos(a1)).toFixed(1) + ' ' + (cy + rIn * Math.sin(a1)).toFixed(1) + '" fill="none" stroke="#1e1412" stroke-width="1"/>');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rIn + '" fill="#f7f0e4" stroke="#1e1412" stroke-width="1.2"/>');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#9e1b2e"/>');
    var rRib = rOut - 16;
    parts.push('<path d="M' + (cx + rRib * Math.cos(a0 + 0.03)).toFixed(1) + ' ' + (cy + rRib * Math.sin(a0 + 0.03)).toFixed(1) + ' A' + rRib + ' ' + rRib + ' 0 0 1 ' + (cx + rRib * Math.cos(a1 - 0.03)).toFixed(1) + ' ' + (cy + rRib * Math.sin(a1 - 0.03)).toFixed(1) + '" fill="none" stroke="#e8a21a" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/>');
    parts.push('<text x="' + cx + '" y="' + (cy + rOut + 22) + '" text-anchor="middle" font-family="Archivo, sans-serif" font-size="9" letter-spacing="2" fill="#7a655a">HEM ' + c.hem.toFixed(1).replace('.', ',') + ' M</text>');
    parts.push('<rect width="420" height="300" fill="url(#fanFade)"/>');
    return parts.join('');
  }

  function render() {
    var c = compute();
    if (!fanEl || !ledgerEl) return;
    fanEl.innerHTML = fanSvg(c);
    nameEl.textContent = c.d.name + ' · ' + c.d.place;
    metaEl.textContent = c.f.label + ' · ' + c.l.label + ' · ' + c.p.label;
    ledgerEl.innerHTML =
      '<h3>Workshop estimate</h3>' +
      '<div class="rows">' +
      '<div class="row"><span>Hem circumference</span><span>' + c.hem.toFixed(1).replace('.', ',') + ' m</span></div>' +
      '<div class="row"><span>Cloth, 1.5 m wide</span><span>' + c.cloth.toFixed(1).replace('.', ',') + ' m</span></div>' +
      '<div class="row"><span>Panels</span><span>' + c.panels + '</span></div>' +
      '<div class="row"><span>Pleats</span><span>' + c.pleats + '</span></div>' +
      '<div class="row"><span>Ribbon at the hem</span><span>' + c.ribbon + ' m</span></div>' +
      '<div class="row"><span>Finished weight</span><span>' + c.weight.toFixed(1).replace('.', ',') + ' kg</span></div>' +
      '<div class="row"><span>Bench hours</span><span>' + c.hours + ' h</span></div>' +
      '</div>' +
      '<div class="total"><span>Estimate in pesos</span><strong>' + money(c.total) + '</strong></div>' +
      '<p class="note">' + c.d.note + ' Estimate includes cloth, ribbon, notions and bench labour; it does not include a fitting or shipping.</p>';
  }

  document.querySelectorAll('.choice').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.dance = btn.getAttribute('data-dance');
      document.querySelectorAll('.choice').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  [['fabricGroup', 'fabric', 'data-fabric'], ['lengthGroup', 'length', 'data-length'], ['pleatGroup', 'pleat', 'data-pleat']].forEach(function (group) {
    var wrap = document.getElementById(group[0]);
    if (!wrap) return;
    wrap.querySelectorAll('.seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state[group[1]] = btn.getAttribute(group[2]);
        wrap.querySelectorAll('.seg-btn').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        render();
      });
    });
  });

  var swirlBtn = document.getElementById('swirlBtn');
  if (swirlBtn) {
    swirlBtn.addEventListener('click', function () {
      if (!fanEl) return;
      fanEl.classList.remove('is-turning');
      void fanEl.getBoundingClientRect();
      fanEl.classList.add('is-turning');
      render();
      ledgerEl.scrollIntoView({ block: 'nearest' });
    });
  }

  if (fanEl && ledgerEl) render();

  /* ---------- booking form ---------- */
  var contact = document.getElementById('contactForm');
  if (contact) {
    var status = document.getElementById('formStatus');
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contact.querySelector('#bName');
      var email = contact.querySelector('#bEmail');
      var date = contact.querySelector('#bDate');
      var msg = contact.querySelector('#bMessage');
      var bad = [];
      [name, email, date, msg].forEach(function (f) { if (f) f.removeAttribute('aria-invalid'); });
      if (!name.value.trim()) bad.push(name);
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!date.value) bad.push(date);
      if (msg.value.trim().length < 15) bad.push(msg);
      if (bad.length) {
        bad.forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
        status.textContent = 'I need a name, a working email, the event date and a line about the venue.';
        status.className = 'form-status is-error';
        bad[0].focus();
        return;
      }
      status.textContent = 'Received, ' + name.value.trim() + '. I answer bookings on Mondays and Thursdays; if the date is inside three weeks, call the studio instead.';
      status.className = 'form-status is-ok';
      contact.reset();
    });
  }
})();
