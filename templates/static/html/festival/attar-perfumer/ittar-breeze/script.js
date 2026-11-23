/* Ittar Breeze — the deg-bhapka bench.
   Works out a distillation from a flower charge and draws the scent pyramid.
   Nothing here uses audio. */
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
  }

  var BASES = {
    sandalwood: { label: 'Sandalwood', color: '#d9a35a', factor: 2.0, note: 'sandal' },
    vetiver: { label: 'Vetiver', color: '#8b7a3f', factor: 1.5, note: 'khus' },
    mitti: { label: 'Mitti', color: '#a86a3c', factor: 1.0, note: 'baked earth' }
  };
  var HEARTS = {
    rose: { label: 'Rose', color: '#b25a6b', rate: 0.32, hours: 0, note: 'gulab' },
    jasmine: { label: 'Jasmine', color: '#c9b8d6', rate: 0.24, hours: 1.0, note: 'chameli' },
    kewra: { label: 'Kewra', color: '#c9c07a', rate: 0.2, hours: 0, note: 'screwpine' }
  };
  var TOPS = {
    bergamot: { label: 'Bergamot', color: '#d8c27a', note: 'citrus peel' },
    saffron: { label: 'Saffron', color: '#c47a2c', note: 'kesar' },
    cardamom: { label: 'Cardamom', color: '#8fa07a', note: 'elaichi' }
  };

  var state = { base: 'sandalwood', heart: 'rose', top: 'bergamot', concentration: 20, batch: 200 };

  function compute() {
    var base = BASES[state.base];
    var heart = HEARTS[state.heart];
    var top = TOPS[state.top];
    var c = state.concentration;
    var topPct = Math.round(19 - (c - 10) * 0.15);
    var heartPct = Math.round(42 - (c - 10) * 0.1);
    var basePct = 100 - topPct - heartPct;
    var charges = Math.ceil(state.batch / 60);
    var hoursPer = 5 + base.factor + heart.hours;
    var hours = Math.round(charges * hoursPer);
    var yieldMl = Math.round(state.batch * heart.rate * (0.8 + c / 100));
    var maceration = 3 + Math.round(c / 8);
    var wood = Math.round(hours * 11);
    var code = 'KB-' + state.batch + '-' + state.base.charAt(0).toUpperCase() + state.heart.charAt(0).toUpperCase() + state.top.charAt(0).toUpperCase();
    return {
      base: base, heart: heart, top: top,
      topPct: topPct, heartPct: heartPct, basePct: basePct,
      charges: charges, hoursPer: hoursPer, hours: hours,
      yieldMl: yieldMl, maceration: maceration, wood: wood, code: code,
      name: heart.label + ' attar'
    };
  }

  function drawPyramid(data) {
    var svg = document.getElementById('pyramid');
    if (!svg) return;
    var apexY = 26, baseY = 300, cx = 230, halfBase = 170;
    var H = baseY - apexY;
    var half = function (y) { return (y - apexY) / H * halfBase; };
    var y1 = apexY + H * data.topPct / 100;
    var y2 = y1 + H * data.heartPct / 100;

    function band(y0, y1b, fill, label) {
      var h0 = half(y0), h1 = half(y1b);
      return '<polygon points="' + (cx - h0) + ',' + y0 + ' ' + (cx + h0) + ',' + y0 + ' ' + (cx + h1) + ',' + y1b + ' ' + (cx - h1) + ',' + y1b + '" fill="' + fill + '" stroke="#2a211c" stroke-width="1.4"/>' +
        '<text x="' + cx + '" y="' + ((y0 + y1b) / 2 + 4) + '" text-anchor="middle" font-family="Fragment Mono, monospace" font-size="9" fill="#2a211c">' + label + '</text>';
    }

    var parts = [];
    parts.push('<rect x="0" y="0" width="460" height="340" fill="none"/>');
    /* guide line */
    parts.push('<line x1="' + (cx - halfBase) + '" y1="' + baseY + '" x2="' + (cx + halfBase) + '" y2="' + baseY + '" stroke="#2a211c" stroke-width="1.4"/>');
    parts.push(band(y1, y2, data.heart.color, 'HEART'));
    parts.push(band(y2, baseY, data.base.color, 'BASE'));
    parts.push(band(apexY, y1, '#efe2c6', 'TOP'));
    /* percentage ticks on the right */
    [[y1, data.topPct + '%'], [y2, (data.topPct + data.heartPct) + '%'], [baseY, '100%']].forEach(function (t) {
      var x = cx + half(t[0]) + 12;
      parts.push('<line x1="' + (cx + half(t[0])) + '" y1="' + t[0] + '" x2="' + (x + 6) + '" y2="' + t[0] + '" stroke="#7a6b5c" stroke-width="0.8"/>');
      parts.push('<text x="' + (x + 10) + '" y="' + (t[0] + 3) + '" font-family="Fragment Mono, monospace" font-size="9" fill="#7a6b5c">' + t[1] + '</text>');
    });
    svg.innerHTML = parts.join('');
  }

  function render() {
    var d = compute();
    drawPyramid(d);
    var legend = document.getElementById('pyramidLegend');
    if (legend) {
      legend.innerHTML =
        '<li><i style="background:#efe2c6"></i><b>' + d.top.label + '</b><span>' + d.topPct + '% · ' + d.top.note + '</span></li>' +
        '<li><i style="background:' + d.heart.color + '"></i><b>' + d.heart.label + '</b><span>' + d.heartPct + '% · ' + d.heart.note + '</span></li>' +
        '<li><i style="background:' + d.base.color + '"></i><b>' + d.base.label + '</b><span>' + d.basePct + '% · ' + d.base.note + '</span></li>';
    }
    var set = function (id, value) { var el = document.getElementById(id); if (el) el.textContent = value; };
    set('lotCode', d.code);
    set('lotName', d.name);
    set('outFlowers', state.batch + ' kg ' + d.heart.label.toLowerCase());
    set('outCharges', d.charges + ' × 60 kg');
    set('outHours', d.hours + ' h · ' + d.hoursPer + ' h a charge');
    set('outYield', d.yieldMl + ' ml');
    set('outMaceration', d.maceration + ' weeks');
    set('outFuel', d.wood + ' kg wood');
    set('captionNotes', d.top.label + ' · ' + d.heart.label + ' · ' + d.base.label);

    document.querySelectorAll('[data-base]').forEach(function (b) {
      var on = b.getAttribute('data-base') === state.base;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-heart]').forEach(function (b) {
      var on = b.getAttribute('data-heart') === state.heart;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-top]').forEach(function (b) {
      var on = b.getAttribute('data-top') === state.top;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-base]').forEach(function (b) {
    b.addEventListener('click', function () { state.base = b.getAttribute('data-base'); render(); });
  });
  document.querySelectorAll('[data-heart]').forEach(function (b) {
    b.addEventListener('click', function () { state.heart = b.getAttribute('data-heart'); render(); });
  });
  document.querySelectorAll('[data-top]').forEach(function (b) {
    b.addEventListener('click', function () { state.top = b.getAttribute('data-top'); render(); });
  });
  var conc = document.getElementById('concIn');
  if (conc) {
    conc.addEventListener('input', function () {
      state.concentration = Number(conc.value);
      var out = document.getElementById('concOut');
      if (out) out.textContent = state.concentration + '%';
      render();
    });
  }
  var batch = document.getElementById('batchIn');
  if (batch) {
    batch.addEventListener('input', function () {
      state.batch = Number(batch.value);
      var out = document.getElementById('batchOut');
      if (out) out.textContent = state.batch + ' kg';
      render();
    });
  }
  var reset = document.getElementById('resetStill');
  if (reset) {
    reset.addEventListener('click', function () {
      state = { base: 'sandalwood', heart: 'rose', top: 'bergamot', concentration: 20, batch: 200 };
      if (conc) conc.value = '20';
      if (batch) batch.value = '200';
      var co = document.getElementById('concOut');
      var bo = document.getElementById('batchOut');
      if (co) co.textContent = '20%';
      if (bo) bo.textContent = '200 kg';
      render();
    });
  }

  render();

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('attarForm');
  if (form) {
    var status = document.getElementById('attarStatus');
    var showError = function (field, message) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.err') : null;
      if (wrap) wrap.classList.toggle('invalid', Boolean(message));
      if (err) err.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var interest = form.elements.interest;
      var message = form.elements.message;
      var consent = form.elements.consent;
      var problems = 0;
      if (!name.value.trim() || name.value.trim().length < 2) { showError(name, 'A name, please'); problems++; } else showError(name, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { showError(email, 'That address is incomplete'); problems++; } else showError(email, '');
      if (!interest.value) { showError(interest, 'Choose what this is about'); problems++; } else showError(interest, '');
      if (!message.value.trim() || message.value.trim().length < 10) { showError(message, 'A sentence about what you are looking for'); problems++; } else showError(message, '');
      if (!consent.checked) { showError(consent, 'Please tick to allow a reply'); problems++; } else showError(consent, '');
      if (status) {
        if (problems) {
          status.className = 'form-status bad';
          status.textContent = problems + (problems === 1 ? ' answer needs attention above.' : ' answers need attention above.');
        } else {
          form.reset();
          document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
          document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
          status.className = 'form-status ok';
          status.textContent = 'Received. Rehana replies within a week, usually after the morning distillation.';
        }
      }
    });
    form.addEventListener('reset', function () {
      document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
      document.querySelectorAll('.err').forEach(function (er) { er.textContent = ''; });
    });
  }

  window.__distil = compute;
})();
