/* Feather Storm — passista kit builder and page behaviour. */
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

  /* reveal */
  var items = Array.prototype.slice.call(document.querySelectorAll('.kit, .numbers, .quote-band, .closing, .page-head, .about-grid, .timeline, .work, .contact-grid, .faq'));
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

  /* ---------- kit builder ---------- */
  var PIECES = {
    headdress: { label: 'Headdress', pt: 'penacho', base: 46, structure: 0.55, hours: 7, structCost: 420, spread: 0.96, len: 1 },
    backpiece: { label: 'Backpiece', pt: 'costas', base: 132, structure: 1.5, hours: 16, structCost: 940, spread: 1.24, len: 1.12 },
    shoulder: { label: 'Shoulders', pt: 'ombreira', base: 74, structure: 0.78, hours: 10, structCost: 610, spread: 0.72, len: 0.86 }
  };
  var FEATHERS = {
    ostrich: { label: 'ostrich', g: 3.2, price: 4.4, factor: 1.15, len: 250, width: 15, colour: 'pink' },
    rooster: { label: 'rooster', g: 1.8, price: 2.4, factor: 1.0, len: 150, width: 9, colour: 'gold' },
    pheasant: { label: 'pheasant', g: 2.6, price: 3.2, factor: 1.05, len: 200, width: 12, colour: 'green' }
  };
  var COVER = {
    light: { label: 'light coverage', factor: 0.5, drawn: 0.55 },
    medium: { label: 'medium coverage', factor: 1.0, drawn: 0.8 },
    full: { label: 'full coverage', factor: 1.55, drawn: 1 }
  };

  var state = { piece: 'headdress', feather: 'ostrich', cover: 'medium' };
  var svgEl = document.getElementById('kitSvg');
  var specEl = document.getElementById('kitSpec');
  var nameEl = document.getElementById('kitName');
  var coverEl = document.getElementById('kitCover');

  function money(n) {
    return 'R$ ' + Math.round(n).toLocaleString('pt-BR');
  }

  function compute() {
    var p = PIECES[state.piece];
    var f = FEATHERS[state.feather];
    var c = COVER[state.cover];
    var count = Math.round(p.base * c.factor * f.factor);
    var weight = p.structure + (count * f.g) / 1000;
    var hours = p.hours + count * 0.035;
    var cost = count * f.price + p.structCost + hours * 65 + 280;
    return { p: p, f: f, c: c, count: count, weight: weight, hours: hours, cost: cost };
  }

  function featherShape(cx, cy, angle, len, width, fill, opacity) {
    var rad = (angle * Math.PI) / 180;
    var tipX = cx + Math.sin(rad) * len;
    var tipY = cy - Math.cos(rad) * len;
    var midX = cx + Math.sin(rad) * len * 0.55;
    var midY = cy - Math.cos(rad) * len * 0.55;
    var ctrlX = midX + Math.cos(rad) * width;
    var ctrlY = midY + Math.sin(rad) * width;
    var ctrl2X = midX - Math.cos(rad) * width;
    var ctrl2Y = midY - Math.sin(rad) * width;
    return '<path d="M' + cx + ' ' + cy + ' Q' + ctrlX.toFixed(1) + ' ' + ctrlY.toFixed(1) + ' ' + tipX.toFixed(1) + ' ' + tipY.toFixed(1) + ' Q' + ctrl2X.toFixed(1) + ' ' + ctrl2Y.toFixed(1) + ' ' + cx + ' ' + cy + 'Z" fill="' + fill + '" opacity="' + opacity + '"/>' +
      '<path d="M' + cx + ' ' + cy + ' L' + tipX.toFixed(1) + ' ' + tipY.toFixed(1) + '" stroke="#14101a" stroke-width="0.8" opacity="0.35"/>';
  }

  function kitSvg(c) {
    var cx = 210, cy = 306;
    var drawn = Math.max(9, Math.min(44, Math.round(18 + c.count * 0.16 * c.c.drawn)));
    var spread = c.p.spread;
    var baseLen = c.f.len * c.p.len;
    var parts = [];
    parts.push('<defs>');
    parts.push('<linearGradient id="kPink" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#8e1b4b"/><stop offset="100%" stop-color="#e23a7b"/></linearGradient>');
    parts.push('<linearGradient id="kGold" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#a87a1d"/><stop offset="100%" stop-color="#f2c14e"/></linearGradient>');
    parts.push('<linearGradient id="kGreen" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#0a5740"/><stop offset="100%" stop-color="#0f8a5f"/></linearGradient>');
    parts.push('<radialGradient id="kGlow" cx="50%" cy="55%" r="55%"><stop offset="0%" stop-color="#e23a7b" stop-opacity="0.18"/><stop offset="100%" stop-color="#e23a7b" stop-opacity="0"/></radialGradient>');
    parts.push('</defs>');
    parts.push('<rect width="420" height="320" fill="#14101a"/>');
    parts.push('<ellipse cx="210" cy="190" rx="200" ry="180" fill="url(#kGlow)"/>');

    var order = [];
    for (var i = 0; i < drawn; i++) {
      var t = drawn === 1 ? 0.5 : i / (drawn - 1);
      var angle = (t - 0.5) * spread * 180;
      var edge = 1 - Math.abs(t - 0.5) * 0.5;
      var len = baseLen * (0.72 + 0.4 * edge) * (i % 2 === 0 ? 1 : 0.9);
      var fill = c.f.colour === 'pink' ? (i % 3 === 0 ? 'url(#kGold)' : i % 5 === 0 ? 'url(#kGreen)' : 'url(#kPink)')
        : c.f.colour === 'gold' ? (i % 4 === 0 ? 'url(#kPink)' : i % 6 === 0 ? 'url(#kGreen)' : 'url(#kGold)')
          : (i % 4 === 0 ? 'url(#kGold)' : i % 6 === 0 ? 'url(#kPink)' : 'url(#kGreen)');
      order.push({ angle: angle, len: len, fill: fill, i: i });
    }
    order.sort(function (a, b) { return Math.abs(b.angle) - Math.abs(a.angle); });
    order.forEach(function (o) {
      parts.push(featherShape(cx, cy, o.angle, o.len, c.f.width * (0.85 + 0.3 * (o.i % 2)), o.fill, 0.94));
    });

    /* sequinned band */
    parts.push('<path d="M' + (cx - 90) + ' ' + (cy - 8) + 'c30 16 150 16 180 0l-6 26c-40 16-128 16-168 0z" fill="#1d1424" stroke="#f2c14e" stroke-width="1.4"/>');
    for (var s = 0; s < 12; s++) {
      parts.push('<circle cx="' + (cx - 78 + s * 14.2) + '" cy="' + (cy + 30 + (s % 2) * 5) + '" r="2.4" fill="' + (s % 2 ? '#f2c14e' : '#e23a7b') + '"/>');
    }
    parts.push('<circle cx="' + cx + '" cy="' + (cy - 10) + '" r="26" fill="#14101a" stroke="#f2c14e" stroke-width="2"/>');
    parts.push('<circle cx="' + cx + '" cy="' + (cy - 10) + '" r="9" fill="#e23a7b"/>');

    /* ground shadow */
    parts.push('<ellipse cx="' + cx + '" cy="' + (cy + 52) + '" rx="86" ry="10" fill="#000" opacity="0.3"/>');
    return parts.join('');
  }

  function render() {
    if (!svgEl || !specEl) return;
    var c = compute();
    svgEl.innerHTML = kitSvg(c);
    nameEl.textContent = c.p.label + ' \u00b7 ' + c.f.label;
    coverEl.textContent = c.c.label;
    specEl.innerHTML =
      '<h3>The atelier account</h3>' +
      '<div class="row"><span>Piece</span><span>' + c.p.label + ' / ' + c.p.pt + '</span></div>' +
      '<div class="row"><span>Feathers</span><span>' + c.count + '</span></div>' +
      '<div class="row"><span>Longest plume</span><span>' + Math.round(c.f.len) + ' cm</span></div>' +
      '<div class="row"><span>Finished weight</span><span>' + c.weight.toFixed(1).replace('.', ',') + ' kg</span></div>' +
      '<div class="row"><span>Sewing hours</span><span>' + c.hours.toFixed(1).replace('.', ',') + ' h</span></div>' +
      '<div class="row"><span>Feathers + structure</span><span>' + money(c.count * c.f.price + c.p.structCost) + '</span></div>' +
      '<div class="total"><span>Workshop estimate</span><strong>' + money(c.cost) + '</strong></div>' +
      '<p class="note">Excludes shoes, tights and the fitting. A backpiece is built on a carbon frame; the weight above is the finished piece, not the crate.</p>';
  }

  document.querySelectorAll('.piece').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.piece = btn.getAttribute('data-piece');
      document.querySelectorAll('.piece').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  [['featherGroup', 'feather', 'data-feather'], ['coverGroup', 'cover', 'data-cover']].forEach(function (group) {
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

  /* ---------- booking form ---------- */
  var contact = document.getElementById('contactForm');
  if (contact) {
    var status = document.getElementById('formStatus');
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contact.querySelector('#fName');
      var email = contact.querySelector('#fEmail');
      var date = contact.querySelector('#fDate');
      var msg = contact.querySelector('#fMessage');
      var bad = [];
      [name, email, date, msg].forEach(function (f) { if (f) f.removeAttribute('aria-invalid'); });
      if (!name.value.trim()) bad.push(name);
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad.push(email);
      if (!date.value) bad.push(date);
      if (msg.value.trim().length < 15) bad.push(msg);
      if (bad.length) {
        bad.forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
        status.textContent = 'I need a name, an email, the date and a line about the show or the costume.';
        status.className = 'form-status is-error';
        bad[0].focus();
        return;
      }
      status.textContent = 'Recebido, ' + name.value.trim() + '. I answer on Mondays and Thursdays; October is already filling for February costumes.';
      status.className = 'form-status is-ok';
      contact.reset();
    });
  }
})();
