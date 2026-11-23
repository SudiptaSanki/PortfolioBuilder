/* Fanous Bazaar — lantern glazier and page behaviour. */
(function () {
  'use strict';

  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- reveal ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.glazier, .bazaar, .quote-band, .closing, .page-head, .story, .craft-steps, .materials, .work, .contact-grid, .faq'));
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

  /* ---------- lantern glazier ---------- */
  var SHAPES = {
    fanous: { label: 'Fanous', sides: 6, tiers: 3, w: 1, h: 1, taper: 1.14 },
    mishkah: { label: 'Mishkah', sides: 8, tiers: 4, w: 0.86, h: 1.1, taper: 1.05 },
    burj: { label: 'Burj', sides: 6, tiers: 3, w: 0.9, h: 1.02, taper: 1.3 }
  };
  var SIZES = {
    small: { label: 'small', cm: 24, w: 104, h: 138, lamp: 'candle socket', lead: '3 days' },
    medium: { label: 'medium', cm: 38, w: 168, h: 210, lamp: 'E14 bulb, 4 W', lead: '5 days' },
    large: { label: 'large', cm: 55, w: 208, h: 252, lamp: 'E14 bulb, 7 W', lead: '9 days' }
  };
  var GLASS = {
    crimson: { label: 'crimson & amber', a: '#b03a2e', b: '#e8a93f', c: '#8f2a1e' },
    nil: { label: 'Nil green', a: '#2f7a5f', b: '#e9dfc6', c: '#1e5c46' },
    sultan: { label: 'Sultan\u2019s blue', a: '#33557e', b: '#b03a2e', c: '#223d5c' }
  };
  var FINISH = {
    aged: { label: 'aged brass', metal: '#c8963e', metalDark: '#8f6522', mult: 1 },
    polished: { label: 'polished brass', metal: '#e6c078', metalDark: '#b28737', mult: 1.18 },
    tin: { label: 'painted tin', metal: '#7c8a86', metalDark: '#4f5c59', mult: 0.82 }
  };

  var state = { shape: 'fanous', size: 'medium', glass: 'crimson', finish: 'aged' };
  var svgEl = document.getElementById('lanternSvg');
  var specEl = document.getElementById('spec');
  var nameEl = document.getElementById('lanternName');
  var glassEl = document.getElementById('lanternGlass');

  function compute() {
    var s = SHAPES[state.shape];
    var z = SIZES[state.size];
    var g = GLASS[state.glass];
    var f = FINISH[state.finish];
    var bodyW = z.cm * 0.52;
    var bodyH = z.cm * 0.8;
    var panes = s.sides * s.tiers;
    var paneW = (bodyW / s.sides) * 0.9;
    var paneH = (bodyH / s.tiers) * 0.86;
    var glassArea = Math.round(panes * paneW * paneH);
    var brassArea = Math.round(2 * (bodyW + bodyW) * bodyH * 0.2 + 90);
    var weight = brassArea * 0.00032 + glassArea * 0.00075 + 0.32;
    var base = state.size === 'large' ? 980 : state.size === 'small' ? 120 : 400;
    var price = (300 + brassArea * 0.4 + glassArea * 0.9 + panes * 11 + base) * f.mult;
    price = Math.round(price / 10) * 10;
    return { s: s, z: z, g: g, f: f, panes: panes, glassArea: glassArea, brassArea: brassArea, weight: weight, price: price, lead: z.lead, lamp: z.lamp };
  }

  function lanternSvg(c) {
    var s = c.s;
    var f = c.f;
    var cx = 180;
    var w = c.z.w * s.w;
    var bodyH = c.z.h * s.h;
    var topHalf = w * 0.4;
    var botHalf = topHalf * s.taper;
    var topY = 138 + (210 - bodyH) * 0.3;
    var botY = topY + bodyH;
    var apex = topY - 40 - w * 0.06;
    var parts = [];

    parts.push('<defs>');
    parts.push('<radialGradient id="lampGlow" cx="50%" cy="60%" r="52%"><stop offset="0%" stop-color="' + c.g.b + '" stop-opacity="0.3"/><stop offset="55%" stop-color="' + c.g.a + '" stop-opacity="0.12"/><stop offset="100%" stop-color="' + c.g.a + '" stop-opacity="0"/></radialGradient>');
    parts.push('<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + f.metal + '"/><stop offset="55%" stop-color="' + f.metalDark + '"/><stop offset="100%" stop-color="' + f.metal + '"/></linearGradient>');
    parts.push('<radialGradient id="inner" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff2c9" stop-opacity="0.55"/><stop offset="100%" stop-color="#fff2c9" stop-opacity="0"/></radialGradient>');
    parts.push('</defs>');

    parts.push('<ellipse cx="' + cx + '" cy="' + (botY * 0.62) + '" rx="' + Math.min(164, w * 1.35).toFixed(1) + '" ry="' + (bodyH * 0.9) + '" fill="url(#lampGlow)"/>');

    /* chain */
    parts.push('<g stroke="url(#metal)" stroke-width="2.2" fill="none">');
    parts.push('<path d="M' + cx + ' 4v' + (apex - 4 - w * 0.1) + '"/>');
    parts.push('<circle cx="' + cx + '" cy="' + (apex - 6) + '" r="' + (4 + w * 0.02) + '"/>');
    parts.push('</g>');

    /* dome */
    parts.push('<path d="M' + (cx - topHalf - 5) + ' ' + topY + 'C' + (cx - topHalf - 5) + ' ' + (topY - 34) + ' ' + (cx - topHalf * 0.5) + ' ' + apex + ' ' + cx + ' ' + apex + 'C' + (cx + topHalf * 0.5) + ' ' + apex + ' ' + (cx + topHalf + 5) + ' ' + (topY - 34) + ' ' + (cx + topHalf + 5) + ' ' + topY + 'Z" fill="url(#metal)"/>');
    parts.push('<path d="M' + (cx - topHalf - 5) + ' ' + topY + 'h' + (topHalf * 2 + 10) + '" stroke="' + f.metalDark + '" stroke-width="2.6"/>');
    parts.push('<circle cx="' + cx + '" cy="' + (apex - 2) + '" r="' + (4 + w * 0.02) + '" fill="url(#metal)"/>');

    /* body */
    parts.push('<path d="M' + (cx - topHalf) + ' ' + topY + 'h' + (topHalf * 2) + 'l' + (botHalf - topHalf) + ' ' + bodyH + 'h' + (-botHalf * 2) + 'z" fill="#0d1524" stroke="url(#metal)" stroke-width="2"/>');

    /* glass panes */
    var tiers = s.tiers, cols = s.sides;
    for (var t = 0; t < tiers; t++) {
      var y0 = topY + (bodyH * t) / tiers;
      var y1 = topY + (bodyH * (t + 1)) / tiers;
      var h0 = topHalf + ((botHalf - topHalf) * t) / tiers;
      var h1 = topHalf + ((botHalf - topHalf) * (t + 1)) / tiers;
      for (var k = 0; k < cols; k++) {
        var x0a = cx - h0 + (2 * h0 * k) / cols;
        var x0b = cx - h0 + (2 * h0 * (k + 1)) / cols;
        var x1a = cx - h1 + (2 * h1 * k) / cols;
        var x1b = cx - h1 + (2 * h1 * (k + 1)) / cols;
        var col = (s.tiers > 3 ? (t % 2 === 0 ? c.g.a : c.g.b) : (k % 2 === 0 ? c.g.a : c.g.b));
        parts.push('<path d="M' + x0a.toFixed(1) + ' ' + y0.toFixed(1) + 'L' + x0b.toFixed(1) + ' ' + y0.toFixed(1) + 'L' + x1b.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x1a.toFixed(1) + ' ' + y1.toFixed(1) + 'Z" fill="' + col + '" stroke="#241a0c" stroke-width="1.4" opacity="0.92"/>');
      }
    }
    parts.push('<ellipse cx="' + cx + '" cy="' + (topY + bodyH * 0.55) + '" rx="' + (topHalf * 0.8) + '" ry="' + (bodyH * 0.34) + '" fill="url(#inner)"/>');

    /* frame */
    parts.push('<g stroke="url(#metal)" stroke-width="2.2" fill="none">');
    for (var t2 = 0; t2 <= tiers; t2++) {
      var yy = topY + (bodyH * t2) / tiers;
      var hh = topHalf + ((botHalf - topHalf) * t2) / tiers;
      parts.push('<path d="M' + (cx - hh).toFixed(1) + ' ' + yy.toFixed(1) + 'H' + (cx + hh).toFixed(1) + '"/>');
    }
    for (var k2 = 0; k2 <= cols; k2++) {
      var xt = cx - topHalf + (2 * topHalf * k2) / cols;
      var xb = cx - botHalf + (2 * botHalf * k2) / cols;
      parts.push('<path d="M' + xt.toFixed(1) + ' ' + topY + 'L' + xb.toFixed(1) + ' ' + botY + '"/>');
    }
    parts.push('<path d="M' + (cx - topHalf) + ' ' + topY + 'h' + (topHalf * 2) + 'l' + (botHalf - topHalf) + ' ' + bodyH + 'h' + (-botHalf * 2) + 'z"/>');
    parts.push('</g>');

    /* base and finial */
    parts.push('<path d="M' + (cx - botHalf) + ' ' + botY + 'h' + (botHalf * 2) + 'l-10 ' + (14 + w * 0.02) + 'h-' + (botHalf * 2 - 20) + 'z" fill="url(#metal)" stroke="' + f.metalDark + '" stroke-width="1.2"/>');
    parts.push('<path d="M' + cx + ' ' + (botY + 14 + w * 0.02) + 'v14" stroke="url(#metal)" stroke-width="1.8"/>');
    parts.push('<circle cx="' + cx + '" cy="' + (botY + 30 + w * 0.02) + '" r="' + (3 + w * 0.015) + '" fill="url(#metal)"/>');

    /* handles */
    parts.push('<g stroke="url(#metal)" stroke-width="1.5" fill="none">');
    parts.push('<path d="M' + (cx - topHalf + 3) + ' ' + (topY + 24) + 'c-' + (12 + w * 0.05) + ' 4-' + (18 + w * 0.06) + ' 12-' + (20 + w * 0.06) + ' 22"/>');
    parts.push('<path d="M' + (cx + topHalf - 3) + ' ' + (topY + 24) + 'c' + (12 + w * 0.05) + ' 4 ' + (18 + w * 0.06) + ' 12 ' + (20 + w * 0.06) + ' 22"/>');
    parts.push('</g>');

    /* a warm gleam on the glass */
    parts.push('<path d="M' + (cx - topHalf + 8) + ' ' + (topY + 10) + 'l' + (botHalf - topHalf) + ' ' + (bodyH - 20) + '" stroke="#fff2c9" stroke-width="1" opacity="0.12"/>');
    return parts.join('');
  }

  function render() {
    if (!svgEl || !specEl) return;
    var c = compute();
    svgEl.innerHTML = lanternSvg(c);
    nameEl.textContent = c.s.label + ' \u00b7 ' + c.z.label;
    glassEl.textContent = c.g.label + ' \u00b7 ' + c.f.label;
    specEl.innerHTML =
      '<h3>The glazier\u2019s account</h3>' +
      '<div class="row"><span>Body</span><span>' + c.s.label + ' \u00b7 ' + c.s.sides + ' sides \u00d7 ' + c.s.tiers + ' tiers</span></div>' +
      '<div class="row"><span>Glass panes</span><span>' + c.panes + '</span></div>' +
      '<div class="row"><span>Glass, cut</span><span>' + c.glassArea + ' cm\u00b2</span></div>' +
      '<div class="row"><span>Brass sheet</span><span>' + c.brassArea + ' cm\u00b2</span></div>' +
      '<div class="row"><span>Finished weight</span><span>' + c.weight.toFixed(1).replace('.', ',') + ' kg</span></div>' +
      '<div class="row"><span>Light</span><span>' + c.lamp + '</span></div>' +
      '<div class="row"><span>Lead time</span><span>' + c.lead + '</span></div>' +
      '<div class="price"><span>From the shop</span><strong>\u00a3E ' + c.price.toLocaleString('en-US') + '</strong></div>' +
      '<p class="note">Price includes brass, glass, lead-free solder, wiring and the first candle or bulb. Antique finish is hand-rubbed; it will keep changing for a year.</p>';
  }

  document.querySelectorAll('.sil').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.shape = btn.getAttribute('data-shape');
      document.querySelectorAll('.sil').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  document.querySelectorAll('.pal').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.glass = btn.getAttribute('data-palette');
      document.querySelectorAll('.pal').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  [['sizeGroup', 'size', 'data-size'], ['finishGroup', 'finish', 'data-finish']].forEach(function (group) {
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

  if (svgEl && specEl) render();

  /* ---------- order form ---------- */
  var contact = document.getElementById('contactForm');
  if (contact) {
    var status = document.getElementById('formStatus');
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contact.querySelector('#oName');
      var email = contact.querySelector('#oEmail');
      var qty = contact.querySelector('#oQty');
      var msg = contact.querySelector('#oMessage');
      var bad = [];
      [name, email, qty, msg].forEach(function (f) { if (f) f.removeAttribute('aria-invalid'); });
      if (!name.value.trim()) bad.push(name);
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!qty.value || Number(qty.value) < 1) bad.push(qty);
      if (msg.value.trim().length < 12) bad.push(msg);
      if (bad.length) {
        bad.forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
        status.textContent = 'Please give a name, an email, the quantity and a line about the order.';
        status.className = 'form-status is-error';
        bad[0].focus();
        return;
      }
      status.textContent = 'Shukran, ' + name.value.trim() + '. The order is with the shop; we reply within two working days, and sooner in the last week before Ramadan.';
      status.className = 'form-status is-ok';
      contact.reset();
    });
  }
})();
